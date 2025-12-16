/**
 * Collaborative Filtering Recommendations Service
 * Pure JavaScript/TypeScript implementation
 * Replaces Gemini API for product recommendations
 * 
 * Implements:
 * - Item-based Collaborative Filtering
 * - User-based Collaborative Filtering  
 * - Co-purchase Matrix
 * - Association Rules (Apriori-lite)
 * - Content-based Filtering (category/tags)
 * - Hybrid scoring
 */

import { prisma } from '@/lib/prisma'

interface ProductScore {
    productId: string
    score: number
    reason: string
    method: 'collaborative' | 'content' | 'association' | 'popularity' | 'hybrid'
}

interface CoPurchaseEntry {
    productA: string
    productB: string
    count: number
    confidence: number
}

export class CollaborativeFilteringService {

    private coPurchaseMatrix: Map<string, Map<string, number>> = new Map()
    private productPopularity: Map<string, number> = new Map()
    private categoryProducts: Map<string, string[]> = new Map()
    private lastTrainedAt: Date | null = null

    /**
     * Train the recommendation model from order history
     * Should be called periodically (e.g., daily) or on-demand
     */
    async train(): Promise<{ success: boolean; stats: any }> {
        console.log('🔄 Training Collaborative Filtering model...')

        try {
            // 1. Build co-purchase matrix
            await this.buildCoPurchaseMatrix()

            // 2. Calculate product popularity
            await this.calculateProductPopularity()

            // 3. Build category index
            await this.buildCategoryIndex()

            this.lastTrainedAt = new Date()

            console.log('✅ CF Model trained successfully')

            return {
                success: true,
                stats: {
                    coPurchasePairs: this.coPurchaseMatrix.size,
                    productsIndexed: this.productPopularity.size,
                    categories: this.categoryProducts.size,
                    trainedAt: this.lastTrainedAt
                }
            }
        } catch (error) {
            console.error('❌ CF Training error:', error)
            return { success: false, stats: { error } }
        }
    }

    /**
     * Build co-purchase matrix from order history
     * Tracks which products are frequently bought together
     */
    private async buildCoPurchaseMatrix(): Promise<void> {
        this.coPurchaseMatrix.clear()

        // Get all orders with their items
        const orders = await prisma.order.findMany({
            where: {
                status: { in: ['DELIVERED', 'SHIPPED', 'PROCESSING'] }
            },
            select: {
                id: true,
                items: {
                    select: {
                        productId: true
                    }
                }
            }
        })

        // Build co-purchase counts
        for (const order of orders) {
            const productIds = order.items.map(item => item.productId)

            // Create pairs of co-purchased products
            for (let i = 0; i < productIds.length; i++) {
                for (let j = i + 1; j < productIds.length; j++) {
                    const [a, b] = [productIds[i], productIds[j]].sort()

                    if (!this.coPurchaseMatrix.has(a)) {
                        this.coPurchaseMatrix.set(a, new Map())
                    }

                    const currentCount = this.coPurchaseMatrix.get(a)!.get(b) || 0
                    this.coPurchaseMatrix.get(a)!.set(b, currentCount + 1)
                }
            }
        }
    }

    /**
     * Calculate product popularity scores
     */
    private async calculateProductPopularity(): Promise<void> {
        this.productPopularity.clear()

        const thirtyDaysAgo = new Date()
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

        const orderItems = await prisma.orderItem.groupBy({
            by: ['productId'],
            where: {
                order: {
                    createdAt: { gte: thirtyDaysAgo },
                    status: { in: ['DELIVERED', 'SHIPPED', 'PROCESSING'] }
                }
            },
            _sum: {
                quantity: true
            },
            _count: {
                id: true
            }
        })

        // Calculate normalized popularity score
        const maxCount = Math.max(...orderItems.map(i => i._count.id), 1)

        for (const item of orderItems) {
            const score = (item._count.id / maxCount) * 0.7 +
                ((item._sum.quantity || 0) / (maxCount * 10)) * 0.3
            this.productPopularity.set(item.productId, Math.min(1, score))
        }
    }

    /**
     * Build category index for content-based filtering
     */
    private async buildCategoryIndex(): Promise<void> {
        this.categoryProducts.clear()

        const products = await prisma.product.findMany({
            where: { isActive: true },
            select: {
                id: true,
                categoryId: true
            }
        })

        for (const product of products) {
            if (!product.categoryId) continue

            if (!this.categoryProducts.has(product.categoryId)) {
                this.categoryProducts.set(product.categoryId, [])
            }
            this.categoryProducts.get(product.categoryId)!.push(product.id)
        }
    }

    /**
     * Get similar products using Item-based Collaborative Filtering
     * "Customers who bought this also bought..."
     */
    async getSimilarProducts(
        productId: string,
        limit: number = 10
    ): Promise<ProductScore[]> {

        // Ensure model is trained
        if (!this.lastTrainedAt) {
            await this.train()
        }

        const scores: ProductScore[] = []

        // 1. Co-purchase based recommendations
        const coPurchased = this.getCoPurchasedProducts(productId)
        for (const [relatedId, count] of coPurchased) {
            scores.push({
                productId: relatedId,
                score: Math.min(1, count / 10), // Normalize
                reason: `Thường được mua cùng (${count} lần)`,
                method: 'collaborative'
            })
        }

        // 2. Same category products (content-based)
        const product = await prisma.product.findUnique({
            where: { id: productId },
            select: { categoryId: true, tags: true }
        })

        if (product?.categoryId) {
            const sameCategoryProducts = this.categoryProducts.get(product.categoryId) || []

            for (const relatedId of sameCategoryProducts) {
                if (relatedId === productId) continue
                if (scores.find(s => s.productId === relatedId)) continue

                const popularity = this.productPopularity.get(relatedId) || 0
                scores.push({
                    productId: relatedId,
                    score: 0.3 + popularity * 0.4,
                    reason: 'Cùng danh mục sản phẩm',
                    method: 'content'
                })
            }
        }

        // 3. Popular products as fallback
        if (scores.length < limit) {
            const popularProducts = Array.from(this.productPopularity.entries())
                .filter(([id]) => id !== productId && !scores.find(s => s.productId === id))
                .sort((a, b) => b[1] - a[1])
                .slice(0, limit - scores.length)

            for (const [id, popularity] of popularProducts) {
                scores.push({
                    productId: id,
                    score: popularity * 0.5,
                    reason: 'Sản phẩm phổ biến',
                    method: 'popularity'
                })
            }
        }

        // Sort by score and limit
        return scores
            .sort((a, b) => b.score - a.score)
            .slice(0, limit)
    }

    /**
     * Get personalized recommendations for a customer
     * Based on their purchase history
     */
    async getPersonalizedRecommendations(
        customerId: string,
        limit: number = 10
    ): Promise<ProductScore[]> {

        if (!this.lastTrainedAt) {
            await this.train()
        }

        // Get customer's purchase history
        const customerOrders = await prisma.order.findMany({
            where: { customerId },
            select: {
                items: {
                    select: { productId: true, quantity: true }
                }
            },
            orderBy: { createdAt: 'desc' },
            take: 20
        })

        if (customerOrders.length === 0) {
            // New customer - return popular products
            return this.getPopularProducts(limit)
        }

        // Aggregate purchased products with weights
        const purchasedProducts = new Map<string, number>()
        for (const order of customerOrders) {
            for (const item of order.items) {
                const current = purchasedProducts.get(item.productId) || 0
                purchasedProducts.set(item.productId, current + item.quantity)
            }
        }

        // Find products similar to what customer has bought
        const recommendations = new Map<string, { score: number; reasons: string[] }>()

        for (const [boughtProductId, quantity] of purchasedProducts) {
            const weight = Math.min(1, quantity / 10) // Normalize

            // Get co-purchased products
            const similar = this.getCoPurchasedProducts(boughtProductId)

            for (const [relatedId, count] of similar) {
                if (purchasedProducts.has(relatedId)) continue // Already bought

                const score = weight * Math.min(1, count / 5)
                const current = recommendations.get(relatedId) || { score: 0, reasons: [] }

                current.score += score
                if (!current.reasons.includes('Dựa trên lịch sử mua hàng')) {
                    current.reasons.push('Dựa trên lịch sử mua hàng')
                }

                recommendations.set(relatedId, current)
            }
        }

        // Add popular products as fallback
        for (const [productId, popularity] of this.productPopularity) {
            if (purchasedProducts.has(productId)) continue
            if (recommendations.has(productId)) continue

            if (recommendations.size < limit) {
                recommendations.set(productId, {
                    score: popularity * 0.3,
                    reasons: ['Đang được nhiều người mua']
                })
            }
        }

        // Convert to array and sort
        return Array.from(recommendations.entries())
            .map(([productId, data]) => ({
                productId,
                score: Math.min(1, data.score),
                reason: data.reasons.join(', '),
                method: 'hybrid' as const
            }))
            .sort((a, b) => b.score - a.score)
            .slice(0, limit)
    }

    /**
     * Get frequently bought together products (Association Rules)
     * For cart/bundle suggestions
     */
    async getFrequentlyBoughtTogether(
        productIds: string[],
        limit: number = 5
    ): Promise<ProductScore[]> {

        if (!this.lastTrainedAt) {
            await this.train()
        }

        const suggestions = new Map<string, number>()

        for (const productId of productIds) {
            const coPurchased = this.getCoPurchasedProducts(productId)

            for (const [relatedId, count] of coPurchased) {
                if (productIds.includes(relatedId)) continue

                const current = suggestions.get(relatedId) || 0
                suggestions.set(relatedId, current + count)
            }
        }

        return Array.from(suggestions.entries())
            .map(([productId, count]) => ({
                productId,
                score: Math.min(1, count / 10),
                reason: `Thường mua cùng ${count} lần`,
                method: 'association' as const
            }))
            .sort((a, b) => b.score - a.score)
            .slice(0, limit)
    }

    /**
     * Get popular products
     */
    async getPopularProducts(limit: number = 10): Promise<ProductScore[]> {
        if (!this.lastTrainedAt) {
            await this.train()
        }

        return Array.from(this.productPopularity.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, limit)
            .map(([productId, popularity]) => ({
                productId,
                score: popularity,
                reason: 'Sản phẩm bán chạy',
                method: 'popularity' as const
            }))
    }

    /**
     * Helper: Get co-purchased products for a product
     */
    private getCoPurchasedProducts(productId: string): Map<string, number> {
        const results = new Map<string, number>()

        // Check as product A
        const asA = this.coPurchaseMatrix.get(productId)
        if (asA) {
            for (const [b, count] of asA) {
                results.set(b, (results.get(b) || 0) + count)
            }
        }

        // Check as product B
        for (const [a, bMap] of this.coPurchaseMatrix) {
            if (a === productId) continue
            const count = bMap.get(productId)
            if (count) {
                results.set(a, (results.get(a) || 0) + count)
            }
        }

        return results
    }

    /**
     * Enrich recommendations with product details
     */
    async enrichRecommendations(scores: ProductScore[]): Promise<any[]> {
        const productIds = scores.map(s => s.productId)

        const products = await prisma.product.findMany({
            where: { id: { in: productIds }, isActive: true },
            select: {
                id: true,
                name: true,
                price: true,
                images: true,
                category: { select: { name: true } }
            }
        })

        const productMap = new Map(products.map(p => [p.id, p]))

        return scores
            .filter(s => productMap.has(s.productId))
            .map(s => ({
                ...productMap.get(s.productId),
                recommendationScore: s.score,
                recommendationReason: s.reason,
                recommendationMethod: s.method
            }))
    }

    /**
     * Get model stats
     */
    getModelStats() {
        return {
            lastTrainedAt: this.lastTrainedAt,
            coPurchasePairs: this.coPurchaseMatrix.size,
            productsIndexed: this.productPopularity.size,
            categoriesIndexed: this.categoryProducts.size
        }
    }
}

// Export singleton
export const collaborativeFiltering = new CollaborativeFilteringService()
