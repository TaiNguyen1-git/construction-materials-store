import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createSuccessResponse, createErrorResponse, createPaginatedResponse } from '@/lib/api-types'

// GET /api/reviews - Get all reviews (PUBLIC - no auth required for browsing)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const skip = (page - 1) * limit

    // Get reviews with pagination (public access - all reviews)
    const [reviews, total] = await Promise.all([
      prisma.productReview.findMany({
        where: {},
        include: {
          product: {
            select: { 
              id: true,
              name: true,
              images: true,
              price: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.productReview.count()
    ])

    const response = createPaginatedResponse(reviews, total, page, limit)

    return NextResponse.json(
      createSuccessResponse(response, 'Reviews retrieved successfully'),
      { status: 200 }
    )
  } catch (error) {
    console.error('Get reviews error:', error)
    return NextResponse.json(
      createErrorResponse('Internal server error', 'INTERNAL_ERROR'),
      { status: 500 }
    )
  }
}
