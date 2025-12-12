/**
 * ML-Enhanced Recommendations Service
 * Combines rule-based algorithms with ML collaborative filtering
 */

import { prisma } from '@/lib/prisma'

interface ProductScore {
  productId: string
  score: number
  reason: string
  method: 'ml' | 'rule' | 'hybrid'
}

export class MLRecommendationsService {
  /**
   * Get hybrid recommendations combining ML and rule-based
   */
  static async getHybridRecommendations(
    productId?: string,
    customerId?: string,
    type: 'RELATED' | 'PERSONALIZED' | 'SIMILAR' = 'RELATED',
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
   * ML-based collaborative filtering using user-item interactions
   * NOW: Uses Gemini to understand product relationships
   */
  static async getMLSimilarProducts(
    productId: string,
    limit: number = 10
  ): Promise<ProductScore[]> {
    try {
      const product = await prisma.product.findUnique({
        where: { id: productId },
        include: { category: true }
      })

      if (!product) return []

      const recommendations = await import('./ai-service').then(m =>
        m.default.getSmartRecommendations({
          viewedProduct: {
            name: product.name,
            category: product.category.name,
            price: product.price,
            description: product.description
          }
        })
      )

      // Map back to our database products
      // In a real scenario, we'd search for these product names or IDs
      // For now, let's find products with matching string similarity or just return placeholder scores
      // To keep it safe, we'll search for products with similar names

      const scores: ProductScore[] = []

      for (const rec of recommendations) {
        // Try to find this recommended product in our DB
        const dbProduct = await prisma.product.findFirst({
          where: {
            name: { contains: rec.name.split(' ')[0] }, // Simple fuzzy match on first word
            isActive: true,
            id: { not: productId }
          }
        })

        if (dbProduct) {
          scores.push({
            productId: dbProduct.id,
            score: 0.9,
            reason: rec.reason || 'AI Recommended',
            method: 'ml'
          })
        }
      }

      return scores.slice(0, limit)
    } catch (error) {
      console.error('ML similar products error:', error)
      return []
    }
  }

  /**
   * ML-based personalized recommendations using user behavior
   * NOW: Uses Gemini to profile user and suggest items
   */
  static async getMLPersonalizedRecommendations(
    customerId: string,
    limit: number = 10
  ): Promise<ProductScore[]> {
    try {
      // Get user's purchase history context
      const userOrders = await prisma.order.findMany({
        where: {
          customerId,
          status: 'DELIVERED'
        },
        include: {
          orderItems: {
            include: { product: true }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: 5
      })

      if (userOrders.length === 0) return []

      const userHistory = userOrders.map(o => ({
        date: o.createdAt,
        items: o.orderItems.map(i => i.product.name)
      }))

      const recommendations = await import('./ai-service').then(m =>
        m.default.getSmartRecommendations({
          userHistory
        })
      )

      const scores: ProductScore[] = []

      for (const rec of recommendations) {
        // Try to find this recommended product in our DB
        const dbProduct = await prisma.product.findFirst({
          where: {
            name: { contains: rec.name.split(' ')[0] },
            isActive: true
          }
        })

        if (dbProduct) {
          scores.push({
            productId: dbProduct.id,
            score: 0.95,
            reason: rec.reason || 'AI Personalized',
            method: 'ml'
          })
        }
      }

      return scores.slice(0, limit)

    } catch (error) {
      console.error('ML personalized recommendations error:', error)
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

      // Get products in same category
      const related = await prisma.product.findMany({
        where: {
          categoryId: product.categoryId,
          id: { not: productId },
          isActive: true
        },
        include: {
          orderItems: {
            select: { id: true }
          }
        },
        orderBy: [
          { createdAt: 'desc' }
        ],
        take: limit
      })

      return related.map(p => ({
        productId: p.id,
        score: 0.7, // Fixed score for rule-based
        reason: 'Same category',
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
          status: 'DELIVERED'
        },
        include: {
          orderItems: {
            include: { product: true }
          }
        },
        take: 5,
        orderBy: { createdAt: 'desc' }
      })

      if (orders.length === 0) return []

      // Get categories user bought from
      const categories = new Set<string>()
      orders.forEach(order => {
        order.orderItems.forEach(item => {
          categories.add(item.product.categoryId)
        })
      })

      // Get popular products in those categories
      const recommended = await prisma.product.findMany({
        where: {
          categoryId: { in: Array.from(categories) },
          isActive: true
        },
        include: {
          orderItems: {
            select: { id: true }
          }
        },
        orderBy: [
          { createdAt: 'desc' }
        ],
        take: limit
      })

      return recommended.map(p => ({
        productId: p.id,
        score: 0.6,
        reason: 'Popular in your categories',
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
        existing.reason += ` + ${score.reason}`
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
}

// Export singleton
export const mlRecommendations = MLRecommendationsService
