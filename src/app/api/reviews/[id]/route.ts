import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createSuccessResponse, createErrorResponse } from '@/lib/api-types'
import { z } from 'zod'

const updateReviewSchema = z.object({
  rating: z.number().min(1).max(5).optional(),
  title: z.string().optional(),
  review: z.string().min(10, 'Review must be at least 10 characters').optional(),
})

// GET /api/reviews/[id] - Get single review
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: reviewId } = await params

    const review = await prisma.productReview.findUnique({
      where: { id: reviewId },
      include: {
        product: {
          select: { 
            id: true,
            name: true,
            images: true,
            price: true
          }
        }
      }
    })

    if (!review) {
      return NextResponse.json(
        createErrorResponse('Review not found', 'NOT_FOUND'),
        { status: 404 }
      )
    }

    return NextResponse.json(
      createSuccessResponse(review, 'Review retrieved successfully'),
      { status: 200 }
    )
  } catch (error) {
    console.error('Get review error:', error)
    return NextResponse.json(
      createErrorResponse('Internal server error', 'INTERNAL_ERROR'),
      { status: 500 }
    )
  }
}

// PUT /api/reviews/[id] - Update review
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = request.headers.get('x-user-id')
    
    if (!userId) {
      return NextResponse.json(
        createErrorResponse('Authentication required', 'UNAUTHORIZED'),
        { status: 401 }
      )
    }

    const { id: reviewId } = await params
    const body = await request.json()

    // Validate input
    const validation = updateReviewSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        createErrorResponse('Invalid input', 'VALIDATION_ERROR', validation.error.issues),
        { status: 400 }
      )
    }

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

    // Check if review exists and belongs to user
    const existingReview = await prisma.productReview.findUnique({
      where: { id: reviewId }
    })

    if (!existingReview) {
      return NextResponse.json(
        createErrorResponse('Review not found', 'NOT_FOUND'),
        { status: 404 }
      )
    }

    if (existingReview.customerId !== customer.id) {
      return NextResponse.json(
        createErrorResponse('You are not authorized to update this review', 'FORBIDDEN'),
        { status: 403 }
      )
    }

    // Update review
    const updatedReview = await prisma.productReview.update({
      where: { id: reviewId },
      data: validation.data
    })

    return NextResponse.json(
      createSuccessResponse(updatedReview, 'Review updated successfully'),
      { status: 200 }
    )
  } catch (error) {
    console.error('Update review error:', error)
    return NextResponse.json(
      createErrorResponse('Internal server error', 'INTERNAL_ERROR'),
      { status: 500 }
    )
  }
}

// DELETE /api/reviews/[id] - Delete review
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = request.headers.get('x-user-id')
    const userRole = request.headers.get('x-user-role')
    
    if (!userId) {
      return NextResponse.json(
        createErrorResponse('Authentication required', 'UNAUTHORIZED'),
        { status: 401 }
      )
    }

    const { id: reviewId } = await params

    // Check if review exists
    const existingReview = await prisma.productReview.findUnique({
      where: { id: reviewId }
    })

    if (!existingReview) {
      return NextResponse.json(
        createErrorResponse('Review not found', 'NOT_FOUND'),
        { status: 404 }
      )
    }

    // Allow admin or review owner to delete
    if (userRole === 'CUSTOMER') {
      const customer = await prisma.customer.findFirst({
        where: { userId }
      })

      if (!customer || existingReview.customerId !== customer.id) {
        return NextResponse.json(
          createErrorResponse('You are not authorized to delete this review', 'FORBIDDEN'),
          { status: 403 }
        )
      }
    }

    // Delete review
    await prisma.productReview.delete({
      where: { id: reviewId }
    })

    return NextResponse.json(
      createSuccessResponse(null, 'Review deleted successfully'),
      { status: 200 }
    )
  } catch (error) {
    console.error('Delete review error:', error)
    return NextResponse.json(
      createErrorResponse('Internal server error', 'INTERNAL_ERROR'),
      { status: 500 }
    )
  }
}
