import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createSuccessResponse, createErrorResponse, createPaginatedResponse } from '@/lib/api-types'
import { requireAuth } from '@/lib/auth-middleware-api'

// GET /api/reviews - Get all reviews (for customer to see their own reviews)
export async function GET(request: NextRequest) {
  try {
    const authError = requireAuth(request)
    if (authError) {
      return authError
    }
    

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const skip = (page - 1) * limit

    // Get customer from userId
    const customer = await prisma.customer.findFirst({
      where: { userId }
    })

    if (!customer) {
      return NextResponse.json(
        createErrorResponse('Customer not found', 'NOT_FOUND'),
        { status: 404 }
      )
    }

    // Get reviews with pagination
    const [reviews, total] = await Promise.all([
      prisma.productReview.findMany({
        where: { customerId: customer.id },
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
      prisma.productReview.count({ where: { customerId: customer.id } })
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
