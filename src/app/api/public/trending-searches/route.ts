import { NextRequest, NextResponse } from 'next/server'
import { ReviewRecommendationsService } from '@/lib/review-recommendations'
import { createSuccessResponse, createErrorResponse } from '@/lib/api-types'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '4')

    // Get trending products based on recent positive reviews
    const trendingProducts = await ReviewRecommendationsService.getTrendingProducts(limit)

    // Map to the format expected by the search suggestions UI
    // { name: string, tag: string }
    const formattedTrending = trendingProducts.map(p => {
      // Determine a tag based on metrics or status
      let tag = 'Nổi bật'
      if (p.reviewMetrics.ratingTrend === 'up') tag = 'Bán chạy'
      if (p.isFeatured) tag = 'Dự án'
      
      // Randomly assign some tags if they are similar to make it look like the original design
      const tags = ['Bán chạy', 'Dự án', 'Nổi bật', 'Khuyến mãi', 'Mới về']
      const randomTag = tags[Math.floor(Math.random() * tags.length)]
      
      return {
        name: p.name,
        tag: p.reviewMetrics.averageRating >= 4.5 ? 'Bán chạy' : tag
      }
    })

    // If no trending products, fallback to some featured ones or a fixed list
    if (formattedTrending.length === 0) {
      return NextResponse.json(createSuccessResponse([
        { name: 'Sắt thép Hòa Phát', tag: 'Bán chạy' },
        { name: 'Xi măng Hà Tiên PCB40', tag: 'Dự án' },
        { name: 'Gạch ốp lát Prime', tag: 'Nổi bật' },
        { name: 'Sơn Dulux nội thất', tag: 'Khuyến mãi' }
      ]))
    }

    return NextResponse.json(createSuccessResponse(formattedTrending))
  } catch (error) {
    console.error('Error fetching trending searches:', error)
    return NextResponse.json(createErrorResponse('Internal server error', 'INTERNAL_ERROR'), { status: 500 })
  }
}
