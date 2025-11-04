import { NextRequest, NextResponse } from 'next/server'
import { ReviewRecommendationsService } from '@/lib/review-recommendations'
import { createSuccessResponse, createErrorResponse } from '@/lib/api-types'

/**
 * GET /api/recommendations/review-based
 * Review-based product recommendations
 * Query params:
 *   - type: 'top_rated' | 'trending' | 'similar' | 'personalized'
 *   - productId: for similar products (type=similar)
 *   - customerId: for personalized (type=personalized)
 *   - categoryId: for filtering top_rated
 *   - limit: number of results (default 10)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') || 'top_rated'
    const productId = searchParams.get('productId')
    const customerId = searchParams.get('customerId')
    const categoryId = searchParams.get('categoryId')
    const limit = parseInt(searchParams.get('limit') || '10')
    const minReviews = parseInt(searchParams.get('minReviews') || '3')

    let recommendations: Array<Record<string, unknown>> = []
    let metadata: Record<string, unknown> = { type, limit }

    switch (type) {
      case 'top_rated':
        // Get top-rated products
        const topRated = await ReviewRecommendationsService.getTopRatedProducts(
          categoryId || undefined,
          limit,
          minReviews
        )
        
        recommendations = topRated.map((item: any) => ({
          id: item.id,
          name: item.name,
          price: item.price,
          images: item.images,
          unit: item.unit,
          category: item.category.name,
          rating: item.reviewMetrics.averageRating,
          totalReviews: item.reviewMetrics.totalReviews,
          verifiedReviews: item.reviewMetrics.verifiedReviews,
          qualityScore: item.reviewMetrics.qualityScore,
          inStock: item.inventoryItem ? item.inventoryItem.availableQuantity > 0 : false,
          reason: `⭐ ${item.reviewMetrics.averageRating.toFixed(1)}/5 (${item.reviewMetrics.totalReviews} đánh giá)`,
          recommendationScore: item.score / 100
        }))
        
        metadata.description = 'Sản phẩm được đánh giá cao nhất'
        break

      case 'trending':
        // Get trending products based on recent reviews
        const trending = await ReviewRecommendationsService.getTrendingProducts(limit)
        
        recommendations = trending.map((item: any) => ({
          id: item.id,
          name: item.name,
          price: item.price,
          images: item.images,
          unit: item.unit,
          category: item.category.name,
          rating: item.reviewMetrics.averageRating,
          totalReviews: item.reviewMetrics.totalReviews,
          ratingTrend: item.reviewMetrics.ratingTrend,
          trendScore: item.trendScore,
          inStock: item.inventoryItem ? item.inventoryItem.availableQuantity > 0 : false,
          reason: `🔥 Đang trending (${item.reviewMetrics.ratingTrend === 'up' ? '📈 tăng' : item.reviewMetrics.ratingTrend === 'down' ? '📉 giảm' : '➡️ ổn định'})`,
          recommendationScore: item.trendScore / 100
        }))
        
        metadata.description = 'Sản phẩm đang được quan tâm'
        break

      case 'similar':
        // Review-based similar products
        if (!productId) {
          return NextResponse.json(
            createErrorResponse('productId is required for similar recommendations', 'VALIDATION_ERROR'),
            { status: 400 }
          )
        }

        const similar = await ReviewRecommendationsService.getReviewBasedSimilarProducts(
          productId,
          limit
        )
        
        recommendations = similar.map((item: any) => ({
          id: item.product.id,
          name: item.product.name,
          price: item.product.price,
          images: item.product.images,
          unit: item.product.unit,
          category: item.product.category.name,
          sharedRaters: item.sharedRaters,
          avgRating: item.avgRating,
          inStock: item.product.inventoryItem ? item.product.inventoryItem.availableQuantity > 0 : false,
          reason: item.reason,
          recommendationScore: item.score / 10
        }))
        
        metadata.description = 'Khách hàng cũng thích'
        metadata.productId = productId
        break

      case 'personalized':
        // Personalized based on user's review history
        if (!customerId) {
          return NextResponse.json(
            createErrorResponse('customerId is required for personalized recommendations', 'VALIDATION_ERROR'),
            { status: 400 }
          )
        }

        const personalized = await ReviewRecommendationsService.getPersonalizedByReviewHistory(
          customerId,
          limit
        )
        
        recommendations = personalized.map((item: any) => ({
          id: item.product.id,
          name: item.product.name,
          price: item.product.price,
          images: item.product.images,
          unit: item.product.unit,
          category: item.product.category.name,
          rating: item.reviewMetrics.averageRating,
          totalReviews: item.reviewMetrics.totalReviews,
          inStock: item.product.inventoryItem ? item.product.inventoryItem.availableQuantity > 0 : false,
          reason: item.reason,
          recommendationScore: item.score / 100
        }))
        
        metadata.description = 'Dành riêng cho bạn'
        metadata.customerId = customerId
        break

      default:
        return NextResponse.json(
          createErrorResponse('Invalid recommendation type', 'VALIDATION_ERROR'),
          { status: 400 }
        )
    }

    const response = {
      recommendations,
      metadata: {
        ...metadata,
        count: recommendations.length,
        method: 'review-based'
      }
    }

    return NextResponse.json(
      createSuccessResponse(response, 'Review-based recommendations retrieved successfully'),
      { status: 200 }
    )

  } catch (error: any) {
    console.error('Review-based recommendations error:', error)
    return NextResponse.json(
      createErrorResponse('Internal server error', 'INTERNAL_ERROR'),
      { status: 500 }
    )
  }
}
