import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createSuccessResponse, createErrorResponse, createPaginatedResponse } from '@/lib/api-types'
import { z } from 'zod'

const createReviewSchema = z.object({
  rating: z.number().min(1).max(5),
  title: z.string().optional(),
  review: z.string().min(10, 'Review must be at least 10 characters'),
  customerId: z.string().optional(),
  orderId: z.string().optional(),
  guestInfo: z.object({
    name: z.string().min(2),
    email: z.string().email(),
    phone: z.string().optional(),
  }).optional()
})

// GET /api/products/[id]/reviews - Get product reviews
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: productId } = await context.params
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const rating = searchParams.get('rating') // Filter by rating
    const skip = (page - 1) * limit

    // Build where clause
    const where: {
      productId: string
      isPublished: boolean
      rating?: number
    } = {
      productId,
      isPublished: true
    }

    if (rating) {
      where.rating = parseInt(rating)
    }

    // Get reviews with pagination
    const [reviews, total] = await Promise.all([
      prisma.productReview.findMany({
        where,
        include: {
          product: {
            select: { name: true }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.productReview.count({ where })
    ])

    // Get customer names from customer IDs
    const reviewsWithCustomer = await Promise.all(
      reviews.map(async (review) => {
        const customer = await prisma.customer.findUnique({
          where: { id: review.customerId },
          include: { user: { select: { name: true } } }
        })

        return {
          ...review,
          customerName: customer?.user?.name || 'Anonymous',
          customerId: undefined // Hide customer ID from response
        }
      })
    )

    const response = createPaginatedResponse(reviewsWithCustomer, total, page, limit)

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

// POST /api/products/[id]/reviews - Create review
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: productId } = await context.params
    const body = await request.json()

    // Validate input
    const validation = createReviewSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        createErrorResponse('Invalid input', 'VALIDATION_ERROR', validation.error.issues),
        { status: 400 }
      )
    }

    const { rating, title, review, orderId, guestInfo } = validation.data
    let customerId = validation.data.customerId

    // Handle Guest User if no customerId provided
    if (!customerId && guestInfo) {
      // Find or create a guest user/customer
      let user = await prisma.user.findUnique({
        where: { email: guestInfo.email }
      })

      if (!user) {
        // Create a basic user for the guest
        user = await prisma.user.create({
          data: {
            name: guestInfo.name,
            email: guestInfo.email,
            phone: guestInfo.phone,
            password: 'GUEST_USER_NO_PASSWORD', // Dummy password for schema requirement
            role: 'CUSTOMER'
          }
        })
      }

      let customer = await prisma.customer.findUnique({
        where: { userId: user.id }
      })

      if (!customer) {
        customer = await prisma.customer.create({
          data: {
            userId: user.id,
            customerType: 'REGULAR'
          }
        })
      }

      customerId = customer.id
    }

    if (!customerId) {
      return NextResponse.json(
        createErrorResponse('Customer authentication required', 'UNAUTHORIZED'),
        { status: 401 }
      )
    }

    // Check if product exists
    const product = await prisma.product.findUnique({
      where: { id: productId }
    })

    if (!product) {
      return NextResponse.json(
        createErrorResponse('Product not found', 'NOT_FOUND'),
        { status: 404 }
      )
    }

    // Check if customer already reviewed this product
    const existingReview = await prisma.productReview.findFirst({
      where: {
        productId,
        customerId
      }
    })

    if (existingReview) {
      return NextResponse.json(
        createErrorResponse('Bạn đã đánh giá sản phẩm này rồi.', 'DUPLICATE_REVIEW'),
        { status: 400 }
      )
    }

    // Check if customer purchased this product (if orderId provided)
    let isVerified = false
    if (orderId) {
      const order = await prisma.order.findFirst({
        where: {
          id: orderId,
          customerId,
          orderItems: {
            some: { productId }
          }
        }
      })
      isVerified = !!order
    }

    // Create review
    const newReview = await prisma.productReview.create({
      data: {
        productId,
        customerId,
        orderId,
        rating,
        title,
        review,
        isVerified,
        isPublished: true
      }
    })

    return NextResponse.json(
      createSuccessResponse(newReview, 'Review created successfully'),
      { status: 201 }
    )
  } catch (error) {
    console.error('Create review error:', error)
    return NextResponse.json(
      createErrorResponse('Internal server error', 'INTERNAL_ERROR'),
      { status: 500 }
    )
  }
}
