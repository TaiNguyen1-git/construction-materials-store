import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createSuccessResponse, createErrorResponse, createPaginatedResponse } from '@/lib/api-types'
import { requireManager } from '@/lib/auth-middleware-api'

// GET /api/admin/reviews - Get all reviews for admin
export async function GET(request: NextRequest) {
  try {
    // Verify manager role
    const authError = requireManager(request)
    if (authError) {
      return authError
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const rating = searchParams.get('rating')
    const isPublished = searchParams.get('isPublished')
    const isVerified = searchParams.get('isVerified')
    const search = searchParams.get('search')
    
    const skip = (page - 1) * limit

    // Build where clause
    const where: {
      rating?: number
      isPublished?: boolean
      isVerified?: boolean
      OR?: Array<{
        title?: { contains: string; mode: 'insensitive' }
        review?: { contains: string; mode: 'insensitive' }
        product?: { name: { contains: string; mode: 'insensitive' } }
      }>
    } = {}
    
    if (rating) {
      where.rating = parseInt(rating)
    }
    
    if (isPublished !== null && isPublished !== undefined && isPublished !== '') {
      where.isPublished = isPublished === 'true'
    }
    
    if (isVerified !== null && isVerified !== undefined && isVerified !== '') {
      where.isVerified = isVerified === 'true'
    }

    if (search) {
      // MongoDB doesn't support mode: 'insensitive' directly, use case variations
      const searchLower = search.toLowerCase()
      where.OR = [
        { title: { contains: search } },
        { title: { contains: searchLower } },
        { review: { contains: search } },
        { review: { contains: searchLower } },
        { product: { name: { contains: search } } },
        { product: { name: { contains: searchLower } } }
      ]
    }

    // Get reviews with pagination
    const [reviews, total] = await Promise.all([
      prisma.productReview.findMany({
        where,
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
      prisma.productReview.count({ where })
    ])

    // Get customer info for each review
    const reviewsWithCustomer = await Promise.all(
      reviews.map(async (review) => {
        const customer = await prisma.customer.findUnique({
          where: { id: review.customerId },
          include: { user: { select: { name: true, email: true } } }
        })

        return {
          ...review,
          customerName: customer?.user?.name || 'Unknown',
          customerEmail: customer?.user?.email || 'N/A'
        }
      })
    )

    // Get statistics
    const stats = await prisma.productReview.aggregate({
      _avg: { rating: true },
      _count: { id: true }
    })

    const ratingDistribution = await Promise.all(
      [5, 4, 3, 2, 1].map(async (rating) => {
        const count = await prisma.productReview.count({
          where: { rating }
        })
        return { rating, count }
      })
    )

    const response = {
      ...createPaginatedResponse(reviewsWithCustomer, total, page, limit),
      stats: {
        averageRating: stats._avg.rating || 0,
        totalReviews: stats._count.id,
        ratingDistribution
      }
    }

    return NextResponse.json(
      createSuccessResponse(response, 'Reviews retrieved successfully'),
      { status: 200 }
    )
  } catch (error) {
    console.error('Get admin reviews error:', error)
    return NextResponse.json(
      createErrorResponse('Internal server error', 'INTERNAL_ERROR'),
      { status: 500 }
    )
  }
}

// PATCH /api/admin/reviews - Bulk update reviews
export async function PATCH(request: NextRequest) {
  try {
    const userRole = request.headers.get('x-user-role')
    
    if (userRole !== 'MANAGER') {
      return NextResponse.json(
        createErrorResponse('Unauthorized', 'FORBIDDEN'),
        { status: 403 }
      )
    }

    const body = await request.json()
    const { reviewIds, action } = body

    if (!reviewIds || !Array.isArray(reviewIds) || reviewIds.length === 0) {
      return NextResponse.json(
        createErrorResponse('Review IDs are required', 'VALIDATION_ERROR'),
        { status: 400 }
      )
    }

    let updateData: { isPublished?: boolean; isVerified?: boolean } = {}

    switch (action) {
      case 'publish':
        updateData = { isPublished: true }
        break
      case 'unpublish':
        updateData = { isPublished: false }
        break
      case 'verify':
        updateData = { isVerified: true }
        break
      case 'unverify':
        updateData = { isVerified: false }
        break
      default:
        return NextResponse.json(
          createErrorResponse('Invalid action', 'VALIDATION_ERROR'),
          { status: 400 }
        )
    }

    // Update reviews
    await prisma.productReview.updateMany({
      where: { id: { in: reviewIds } },
      data: updateData
    })

    return NextResponse.json(
      createSuccessResponse({ updatedCount: reviewIds.length }, 'Reviews updated successfully'),
      { status: 200 }
    )
  } catch (error) {
    console.error('Bulk update reviews error:', error)
    return NextResponse.json(
      createErrorResponse('Internal server error', 'INTERNAL_ERROR'),
      { status: 500 }
    )
  }
}
