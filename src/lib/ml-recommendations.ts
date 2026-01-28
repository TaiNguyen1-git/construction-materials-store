/**
 * ML-Enhanced Recommendations Service
 * Uses Collaborative Filtering (replaced Gemini due to rate limits)
 * 
 * Algorithms: Item-based CF, User-based CF, Co-purchase Matrix, Content-based
 */

import { prisma } from '@/lib/prisma'
import { collaborativeFiltering } from './cf-recommendations'

interface ProductScore {
  productId: string
  score: number
  reason: string
  method: 'ml' | 'rule' | 'hybrid'
}

export class MLRecommendationsService {

  /**
   * Initialize/train the CF model (call on server start or periodically)
   */
  static async initialize(): Promise<void> {
    const _result = await collaborativeFiltering.train()
  }

  /**
   * Get hybrid recommendations combining ML and rule-based
   */
  static async getHybridRecommendations(
    productId?: string,
    customerId?: string,
    _type: 'RELATED' | 'PERSONALIZED' | 'SIMILAR' = 'RELATED',
    limit: number = 10
  ) {
    try {
      const mlScores = productId
        ? await this.getMLSimilarProducts(productId, limit * 2)
        : customerId
          ? await this.getMLPersonalizedRecommendations(customerId, limit * 2)
          : []

      const ruleScores = productId
        ? await this.getRuleBasedRelated(productId, limit * 2)
        : customerId
          ? await this.getRuleBasedPersonalized(customerId, limit * 2)
          : []

      // Combine scores using weighted average
      const combined = this.combineScores(mlScores, ruleScores, {
        mlWeight: 0.6, // 60% ML
        ruleWeight: 0.4 // 40% rule-based
      })

      // Get top recommendations
      return combined
        .sort((a, b) => b.score - a.score)
        .slice(0, limit)
    } catch (error) {
      console.error('Hybrid recommendations error:', error)
      // Fallback to rule-based only
      return productId
        ? await this.getRuleBasedRelated(productId, limit)
        : await this.getRuleBasedPersonalized(customerId || '', limit)
    }
  }

  /**
   * ML-based collaborative filtering using co-purchase matrix
   * Uses local CF model instead of Gemini API
   */
  static async getMLSimilarProducts(
    productId: string,
    limit: number = 10
  ): Promise<ProductScore[]> {
    try {
      // Use Collaborative Filtering service
      const cfScores = await collaborativeFiltering.getSimilarProducts(productId, limit)

      return cfScores.map(s => ({
        productId: s.productId,
        score: s.score,
        reason: s.reason,
        method: 'ml' as const
      }))
    } catch (error) {
      console.error('ML similar products error:', error)
      return []
    }
  }

  /**
   * ML-based personalized recommendations using purchase history
   * Uses local CF model instead of Gemini API
   */
  static async getMLPersonalizedRecommendations(
    customerId: string,
    limit: number = 10
  ): Promise<ProductScore[]> {
    try {
      // Use Collaborative Filtering service
      const cfScores = await collaborativeFiltering.getPersonalizedRecommendations(customerId, limit)

      return cfScores.map(s => ({
        productId: s.productId,
        score: s.score,
        reason: s.reason,
        method: 'ml' as const
      }))
    } catch (error) {
      console.error('ML personalized recommendations error:', error)
      return []
    }
  }

  /**
   * Get frequently bought together (for cart suggestions)
   */
  static async getFrequentlyBoughtTogether(
    cartProductIds: string[],
    limit: number = 5
  ): Promise<ProductScore[]> {
    try {
      const cfScores = await collaborativeFiltering.getFrequentlyBoughtTogether(cartProductIds, limit)

      return cfScores.map(s => ({
        productId: s.productId,
        score: s.score,
        reason: s.reason,
        method: 'ml' as const
      }))
    } catch (error) {
      console.error('Frequently bought together error:', error)
      return []
    }
  }

  /**
   * Rule-based related products (fallback/complement)
   */
  private static async getRuleBasedRelated(
    productId: string,
    limit: number
  ): Promise<ProductScore[]> {
    try {
      const product = await prisma.product.findUnique({
        where: { id: productId }
      })

      if (!product) return []

      // Get products in same category, sorted by popularity
      const related = await prisma.product.findMany({
        where: {
          categoryId: product.categoryId,
          id: { not: productId },
          isActive: true
        },
        include: {
          _count: {
            select: { orderItems: true }
          }
        },
        orderBy: [
          { createdAt: 'desc' }
        ],
        take: limit
      })

      // Score by order count
      const maxOrders = Math.max(...related.map(p => p._count.orderItems), 1)

      return related.map(p => ({
        productId: p.id,
        score: 0.5 + (p._count.orderItems / maxOrders) * 0.3,
        reason: 'Cùng danh mục sản phẩm',
        method: 'rule' as const
      }))
    } catch (error) {
      console.error('Rule-based related error:', error)
      return []
    }
  }

  /**
   * Rule-based personalized (fallback/complement)
   */
  private static async getRuleBasedPersonalized(
    customerId: string,
    limit: number
  ): Promise<ProductScore[]> {
    try {
      // Get user's order history
      const orders = await prisma.order.findMany({
        where: {
          customerId,
          status: { in: ['DELIVERED', 'SHIPPED'] }
        },
        include: {
          orderItems: {
            include: { product: true }
          }
        },
        take: 10,
        orderBy: { createdAt: 'desc' }
      })

      if (orders.length === 0) {
        // Return bestsellers for new users
        const bestsellers = await prisma.product.findMany({
          where: { isActive: true },
          include: {
            _count: { select: { orderItems: true } }
          },
          orderBy: { createdAt: 'desc' },
          take: limit
        })

        return bestsellers.map(p => ({
          productId: p.id,
          score: 0.5,
          reason: 'Sản phẩm bán chạy',
          method: 'rule' as const
        }))
      }

      // Get categories user bought from
      const categories = new Set<string>()
      const purchasedProductIds = new Set<string>()

      orders.forEach(order => {
        order.orderItems.forEach((item) => {
          categories.add(item.product.categoryId)
          purchasedProductIds.add(item.productId)
        })
      })

      // Get popular products in those categories (not already purchased)
      const recommended = await prisma.product.findMany({
        where: {
          categoryId: { in: Array.from(categories) },
          isActive: true,
          id: { notIn: Array.from(purchasedProductIds) }
        },
        include: {
          _count: { select: { orderItems: true } }
        },
        orderBy: { createdAt: 'desc' },
        take: limit
      })

      const maxOrders = Math.max(...recommended.map(p => p._count.orderItems), 1)

      return recommended.map(p => ({
        productId: p.id,
        score: 0.4 + (p._count.orderItems / maxOrders) * 0.4,
        reason: 'Phù hợp sở thích của bạn',
        method: 'rule' as const
      }))
    } catch (error) {
      console.error('Rule-based personalized error:', error)
      return []
    }
  }

  /**
   * Combine ML and rule-based scores
   */
  private static combineScores(
    mlScores: ProductScore[],
    ruleScores: ProductScore[],
    weights: { mlWeight: number; ruleWeight: number }
  ): ProductScore[] {
    const combined = new Map<string, ProductScore>()

    // Add ML scores
    mlScores.forEach(score => {
      combined.set(score.productId, {
        ...score,
        score: score.score * weights.mlWeight,
        method: 'hybrid'
      })
    })

    // Add/merge rule-based scores
    ruleScores.forEach(score => {
      const existing = combined.get(score.productId)
      if (existing) {
        // Combine scores
        existing.score += score.score * weights.ruleWeight
        existing.reason = `${existing.reason} + ${score.reason}`
      } else {
        combined.set(score.productId, {
          ...score,
          score: score.score * weights.ruleWeight,
          method: 'hybrid'
        })
      }
    })

    return Array.from(combined.values())
  }

  /**
   * Get product details for recommendations
   */
  static async enrichRecommendations(scores: ProductScore[]) {
    const productIds = scores.map(s => s.productId)

    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
      include: {
        category: true,
        inventoryItem: true,
        _count: {
          select: { orderItems: true }
        }
      }
    })

    return scores.map(score => {
      const product = products.find(p => p.id === score.productId)
      if (!product) return null

      return {
        id: product.id,
        name: product.name,
        price: product.price,
        unit: product.unit,
        images: product.images,
        category: product.category.name,
        inStock: product.inventoryItem
          ? product.inventoryItem.availableQuantity > 0
          : false,
        orderCount: product._count.orderItems,
        recommendationScore: score.score,
        reason: score.reason,
        method: score.method
      }
    }).filter(Boolean)
  }

  /**
   * Get model stats
   */
  static getModelStats() {
    return collaborativeFiltering.getModelStats()
  }
}

// Export singleton
export const mlRecommendations = MLRecommendationsService
