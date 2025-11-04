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
   */
  static async getMLSimilarProducts(
    productId: string,
    limit: number = 10
  ): Promise<ProductScore[]> {
    try {
      // Build co-occurrence matrix from order history
      // Products bought together are similar
      
      const ordersWithProduct = await prisma.order.findMany({
        where: {
          orderItems: {
            some: { productId }
          },
          status: 'DELIVERED'
        },
        include: {
          orderItems: {
            where: { productId: { not: productId } },
            include: { product: true }
          }
        },
        take: 100 // Recent orders for performance
      })

      // Count co-occurrences
      const coOccurrence = new Map<string, number>()
      const productInfo = new Map<string, any>()

      ordersWithProduct.forEach(order => {
        order.orderItems.forEach(item => {
          const count = coOccurrence.get(item.productId) || 0
          coOccurrence.set(item.productId, count + 1)
          productInfo.set(item.productId, item.product)
        })
      })

      // Calculate similarity scores using Jaccard similarity
      const totalOrders = ordersWithProduct.length
      const scores: ProductScore[] = []

      for (const [otherId, coCount] of coOccurrence.entries()) {
        // Get orders containing the other product
        const ordersWithOther = await prisma.order.count({
          where: {
            orderItems: { some: { productId: otherId } },
            status: 'DELIVERED'
          }
        })

        // Jaccard similarity: intersection / union
        const intersection = coCount
        const union = totalOrders + ordersWithOther - intersection
        const similarity = union > 0 ? intersection / union : 0

        scores.push({
          productId: otherId,
          score: similarity,
          reason: `Bought together ${coCount} times`,
          method: 'ml'
        })
      }

      return scores
        .sort((a, b) => b.score - a.score)
        .slice(0, limit)
    } catch (error) {
      console.error('ML similar products error:', error)
      return []
    }
  }

  /**
   * ML-based personalized recommendations using user behavior
   */
  static async getMLPersonalizedRecommendations(
    customerId: string,
    limit: number = 10
  ): Promise<ProductScore[]> {
    try {
      // Get user's purchase history
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
        take: 20
      })

      if (userOrders.length === 0) return []

      // Extract user's product preferences
      const userProducts = new Set<string>()
      const userCategories = new Map<string, number>()

      userOrders.forEach(order => {
        order.orderItems.forEach(item => {
          userProducts.add(item.productId)
          const catCount = userCategories.get(item.product.categoryId) || 0
          userCategories.set(item.product.categoryId, catCount + 1)
        })
      })

      // Find similar users (who bought similar products)
      const similarUsers = await this.findSimilarUsers(customerId, Array.from(userProducts))

      // Get products that similar users bought but current user hasn't
      const recommendations = new Map<string, { count: number, product: any }>()

      for (const similarUser of similarUsers) {
        const theirOrders = await prisma.order.findMany({
          where: {
            customerId: similarUser.userId,
            status: 'DELIVERED'
          },
          include: {
            orderItems: {
              where: {
                productId: { notIn: Array.from(userProducts) }
              },
              include: { product: true }
            }
          },
          take: 10
        })

        theirOrders.forEach(order => {
          order.orderItems.forEach(item => {
            const current = recommendations.get(item.productId)
            if (current) {
              recommendations.set(item.productId, {
                count: current.count + 1,
                product: item.product
              })
            } else {
              recommendations.set(item.productId, {
                count: 1,
                product: item.product
              })
            }
          })
        })
      }

      // Calculate scores based on frequency and similarity
      const scores: ProductScore[] = []
      const maxCount = Math.max(...Array.from(recommendations.values()).map(r => r.count), 1)

      for (const [productId, data] of recommendations.entries()) {
        // Normalize score
        const frequencyScore = data.count / maxCount
        
        // Boost score if product is in user's favorite categories
        let categoryBoost = 1.0
        if (userCategories.has(data.product.categoryId)) {
          categoryBoost = 1.3
        }

        scores.push({
          productId,
          score: frequencyScore * categoryBoost,
          reason: `${data.count} similar customers bought this`,
          method: 'ml'
        })
      }

      return scores
        .sort((a, b) => b.score - a.score)
        .slice(0, limit)
    } catch (error) {
      console.error('ML personalized recommendations error:', error)
      return []
    }
  }

  /**
   * Find similar users based on purchase overlap
   */
  private static async findSimilarUsers(
    customerId: string,
    userProducts: string[]
  ): Promise<{ userId: string; similarity: number }[]> {
    try {
      // Find users who bought similar products
      const similarOrders = await prisma.order.findMany({
        where: {
          customerId: { not: customerId },
          status: 'DELIVERED',
          orderItems: {
            some: {
              productId: { in: userProducts }
            }
          }
        },
        include: {
          orderItems: {
            select: { productId: true }
          }
        },
        take: 50
      })

      // Calculate similarity scores
      const userSimilarity = new Map<string, number>()

      similarOrders.forEach(order => {
        const theirProducts = new Set(order.orderItems.map(item => item.productId))
        const intersection = userProducts.filter(p => theirProducts.has(p)).length
        const union = new Set([...userProducts, ...Array.from(theirProducts)]).size
        const similarity = union > 0 ? intersection / union : 0

        const current = userSimilarity.get(order.customerId) || 0
        userSimilarity.set(order.customerId, Math.max(current, similarity))
      })

      return Array.from(userSimilarity.entries())
        .map(([userId, similarity]) => ({ userId, similarity }))
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, 10) // Top 10 similar users
    } catch (error) {
      console.error('Find similar users error:', error)
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
