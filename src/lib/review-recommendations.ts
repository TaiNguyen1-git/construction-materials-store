/**
 * Review-Enhanced Recommendations Service
 * Integrates product reviews and ratings into recommendation algorithms
 */

import { prisma } from '@/lib/prisma'

interface ReviewMetrics {
  productId: string
  averageRating: number
  totalReviews: number
  verifiedReviews: number
  recentRating: number // Last 30 days
  ratingTrend: 'up' | 'down' | 'stable'
  qualityScore: number // 0-100
}

interface RecommendationWithReview {
  productId: string
  score: number
  reviewBoost: number
  finalScore: number
  reason: string
  reviewMetrics: ReviewMetrics
}

export class ReviewRecommendationsService {
  /**
   * Get review metrics for a product
   */
  static async getProductReviewMetrics(productId: string): Promise<ReviewMetrics> {
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const [allReviews, recentReviews] = await Promise.all([
      prisma.productReview.findMany({
        where: { productId, isPublished: true },
        select: { rating: true, isVerified: true, createdAt: true }
      }),
      prisma.productReview.findMany({
        where: {
          productId,
          isPublished: true,
          createdAt: { gte: thirtyDaysAgo }
        },
        select: { rating: true }
      })
    ])

    const totalReviews = allReviews.length
    const verifiedReviews = allReviews.filter(r => r.isVerified).length

    const averageRating = totalReviews > 0
      ? allReviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews
      : 0

    const recentRating = recentReviews.length > 0
      ? recentReviews.reduce((sum, r) => sum + r.rating, 0) / recentReviews.length
      : averageRating

    // Calculate rating trend
    let ratingTrend: 'up' | 'down' | 'stable' = 'stable'
    if (recentReviews.length >= 5) {
      const diff = recentRating - averageRating
      if (diff > 0.3) ratingTrend = 'up'
      else if (diff < -0.3) ratingTrend = 'down'
    }

    // Quality score factors:
    // - Average rating (50%)
    // - Number of reviews (25%)
    // - Verified reviews ratio (15%)
    // - Recent trend (10%)
    const reviewCountScore = Math.min(totalReviews / 20, 1) * 25 // Max at 20 reviews
    const verifiedRatio = totalReviews > 0 ? verifiedReviews / totalReviews : 0
    const trendScore = ratingTrend === 'up' ? 10 : ratingTrend === 'down' ? 0 : 5

    const qualityScore =
      (averageRating / 5) * 50 +
      reviewCountScore +
      verifiedRatio * 15 +
      trendScore

    return {
      productId,
      averageRating,
      totalReviews,
      verifiedReviews,
      recentRating,
      ratingTrend,
      qualityScore
    }
  }

  /**
   * Enhance recommendations with review data
   */
  static async enhanceRecommendationsWithReviews(
    baseRecommendations: Array<{ productId: string; score: number; reason: string }>,
    options: {
      reviewWeight?: number // 0-1, default 0.3
      minRating?: number // Filter out products below this rating
      minReviews?: number // Filter out products with fewer reviews
    } = {}
  ): Promise<RecommendationWithReview[]> {
    const {
      reviewWeight = 0.3,
      minRating = 0,
      minReviews = 0
    } = options

    const enhanced = await Promise.all(
      baseRecommendations.map(async (rec) => {
        const reviewMetrics = await this.getProductReviewMetrics(rec.productId)

        // Calculate review boost (0-1)
        const reviewBoost = reviewMetrics.qualityScore / 100

        // Combine base score with review boost
        const finalScore = rec.score * (1 - reviewWeight) + reviewBoost * reviewWeight

        return {
          productId: rec.productId,
          score: rec.score,
          reviewBoost,
          finalScore,
          reason: rec.reason,
          reviewMetrics
        }
      })
    )

    // Filter and sort
    return enhanced
      .filter(item =>
        item.reviewMetrics.averageRating >= minRating &&
        item.reviewMetrics.totalReviews >= minReviews
      )
      .sort((a, b) => b.finalScore - a.finalScore)
  }

  /**
   * Get top-rated products in a category
   */
  static async getTopRatedProducts(
    categoryId?: string,
    limit: number = 10,
    minReviews: number = 3
  ) {
    const where: {
      isActive: boolean
      categoryId?: string
    } = {
      isActive: true
    }

    if (categoryId) {
      where.categoryId = categoryId
    }

    const products = await prisma.product.findMany({
      where,
      include: {
        productReviews: {
          where: { isPublished: true },
          select: { rating: true, isVerified: true }
        },
        category: {
          select: { name: true }
        },
        inventoryItem: {
          select: { availableQuantity: true }
        }
      }
    })

    // Calculate scores
    const scored = await Promise.all(
      products.map(async (product) => {
        const reviewMetrics = await this.getProductReviewMetrics(product.id)

        return {
          ...product,
          reviewMetrics,
          score: reviewMetrics.qualityScore
        }
      })
    )

    // Filter and sort
    return scored
      .filter(p => p.reviewMetrics.totalReviews >= minReviews)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
  }

  /**
   * Get products with trending positive reviews
   */
  static async getTrendingProducts(limit: number = 10) {
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    // Get products with recent reviews
    const products = await prisma.product.findMany({
      where: {
        isActive: true,
        productReviews: {
          some: {
            createdAt: { gte: thirtyDaysAgo },
            isPublished: true
          }
        }
      },
      include: {
        productReviews: {
          where: { isPublished: true },
          select: { rating: true, createdAt: true }
        },
        category: {
          select: { name: true }
        },
        inventoryItem: {
          select: { availableQuantity: true }
        }
      }
    })

    // Calculate trend scores
    const scored = await Promise.all(
      products.map(async (product) => {
        const reviewMetrics = await this.getProductReviewMetrics(product.id)

        // Trending score = quality + trend bonus
        let trendScore = reviewMetrics.qualityScore

        if (reviewMetrics.ratingTrend === 'up') {
          trendScore += 20 // Significant boost for upward trend
        }

        // Boost for recent activity
        const recentReviews = product.productReviews.filter(
          r => new Date(r.createdAt) >= thirtyDaysAgo
        ).length
        trendScore += Math.min(recentReviews * 2, 20) // Max +20 for activity

        return {
          ...product,
          reviewMetrics,
          trendScore
        }
      })
    )

    return scored
      .filter(p => p.reviewMetrics.totalReviews >= 2) // Min 2 reviews to trend
      .sort((a, b) => b.trendScore - a.trendScore)
      .slice(0, limit)
  }

  /**
   * Collaborative filtering based on reviews
   * "Users who rated X highly also rated..."
   */
  static async getReviewBasedSimilarProducts(
    productId: string,
    limit: number = 10
  ) {
    // Get customers who rated this product highly (4-5 stars)
    const highRaters = await prisma.productReview.findMany({
      where: {
        productId,
        rating: { gte: 4 },
        isPublished: true
      },
      select: { customerId: true }
    })

    if (highRaters.length === 0) {
      return []
    }

    const customerIds = highRaters.map(r => r.customerId)

    // Get other products these customers rated highly
    const otherHighRatings = await prisma.productReview.findMany({
      where: {
        customerId: { in: customerIds },
        productId: { not: productId },
        rating: { gte: 4 },
        isPublished: true
      },
      include: {
        product: {
          include: {
            category: true,
            inventoryItem: true
          }
        }
      }
    })

    // Count occurrences and calculate scores
    interface ProductScore {
      product: {
        id: string
        name: string
        price: number
        images: string[]
        unit: string
        category: { name: string } | null
        inventoryItem: { availableQuantity: number } | null
      }
      count: number
      avgRating: number
      ratings: number[]
    }
    const productScores = new Map<string, ProductScore>()

    otherHighRatings.forEach(review => {
      const existing = productScores.get(review.productId)
      if (existing) {
        existing.count++
        existing.ratings.push(review.rating)
        existing.avgRating = existing.ratings.reduce((a, b) => a + b, 0) / existing.ratings.length
      } else {
        productScores.set(review.productId, {
          product: review.product,
          count: 1,
          avgRating: review.rating,
          ratings: [review.rating]
        })
      }
    })

    // Sort by count and rating
    return Array.from(productScores.values())
      .sort((a, b) => {
        // Primary sort: count (more customers rated it)
        if (b.count !== a.count) return b.count - a.count
        // Secondary sort: average rating
        return b.avgRating - a.avgRating
      })
      .slice(0, limit)
      .map(item => ({
        product: item.product,
        score: item.count * item.avgRating, // Composite score
        sharedRaters: item.count,
        avgRating: item.avgRating,
        reason: `${item.count} khách hàng khác cũng đánh giá cao sản phẩm này`
      }))
  }

  /**
   * Get personalized recommendations based on user's review history
   */
  static async getPersonalizedByReviewHistory(
    customerId: string,
    limit: number = 10
  ) {
    // Get customer's review history
    const customerReviews = await prisma.productReview.findMany({
      where: { customerId },
      include: {
        product: {
          include: { category: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    if (customerReviews.length === 0) {
      return []
    }

    // Analyze preferences
    const likedProducts = customerReviews.filter(r => r.rating >= 4)
    const categoryPreferences = new Map<string, number>()

    likedProducts.forEach(review => {
      const catId = review.product.categoryId
      categoryPreferences.set(catId, (categoryPreferences.get(catId) || 0) + 1)
    })

    // Get products from preferred categories that user hasn't reviewed
    const reviewedProductIds = customerReviews.map(r => r.productId)
    const preferredCategoryIds = Array.from(categoryPreferences.keys())

    if (preferredCategoryIds.length === 0) {
      return []
    }

    const recommendations = await prisma.product.findMany({
      where: {
        categoryId: { in: preferredCategoryIds },
        id: { notIn: reviewedProductIds },
        isActive: true
      },
      include: {
        category: true,
        inventoryItem: true,
        productReviews: {
          where: { isPublished: true },
          select: { rating: true }
        }
      }
    })

    // Score based on category preference and product ratings
    const scored = await Promise.all(
      recommendations.map(async (product) => {
        const categoryScore = categoryPreferences.get(product.categoryId) || 0
        const reviewMetrics = await this.getProductReviewMetrics(product.id)

        const score = categoryScore * 10 + reviewMetrics.qualityScore

        return {
          product,
          score,
          reviewMetrics,
          reason: `Dựa trên sở thích của bạn trong ${product.category.name}`
        }
      })
    )

    return scored
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
  }
}
