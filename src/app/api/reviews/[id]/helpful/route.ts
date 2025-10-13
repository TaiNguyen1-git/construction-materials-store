import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createSuccessResponse, createErrorResponse } from '@/lib/api-types'

// PUT /api/reviews/[id]/helpful - Mark review as helpful
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const reviewId = params.id

    // Increment helpful count
    const review = await prisma.productReview.update({
      where: { id: reviewId },
      data: {
        helpfulCount: { increment: 1 }
      }
    })

    return NextResponse.json(
      createSuccessResponse(review, 'Thank you for your feedback'),
      { status: 200 }
    )
  } catch (error) {
    console.error('Update helpful count error:', error)
    return NextResponse.json(
      createErrorResponse('Internal server error', 'INTERNAL_ERROR'),
      { status: 500 }
    )
  }
}
