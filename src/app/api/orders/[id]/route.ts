import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createSuccessResponse, createErrorResponse } from '@/lib/api-types'
import { logger } from '@/lib/logger'

// GET /api/orders/[id] - Get single order
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: orderId } = await params

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        customer: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                phone: true
              }
            }
          }
        },
        orderItems: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                sku: true,
                price: true,
                images: true,
                unit: true
              }
            }
          }
        }
      }
    })

    if (!order) {
      return NextResponse.json(
        createErrorResponse('Order not found', 'NOT_FOUND'),
        { status: 404 }
      )
    }

    return NextResponse.json(
      createSuccessResponse(order, 'Order retrieved successfully'),
      { status: 200 }
    )

  } catch (error: any) {
    logger.error('Get order error', { 
      error: error.message, 
      stack: error.stack,
      orderId: params.id
    })
    
    return NextResponse.json(
      createErrorResponse('Internal server error', 'INTERNAL_ERROR'),
      { status: 500 }
    )
  }
}

// DELETE /api/orders/[id] - Delete order (admin only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const orderId = params.id
    
    // Check if order exists
    const existingOrder = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        orderItems: true
      }
    })

    if (!existingOrder) {
      return NextResponse.json(
        createErrorResponse('Order not found', 'NOT_FOUND'),
        { status: 404 }
      )
    }

    // Delete order and related items in transaction
    await prisma.$transaction(async (tx) => {
      // Delete order items first
      await tx.orderItem.deleteMany({
        where: { orderId }
      })

      // Delete the order
      await tx.order.delete({
        where: { id: orderId }
      })
    })

    logger.info('Order deleted', {
      orderId,
      orderNumber: existingOrder.orderNumber
    })

    return NextResponse.json(
      createSuccessResponse(null, 'Order deleted successfully'),
      { status: 200 }
    )

  } catch (error: any) {
    logger.error('Delete order error', { 
      error: error.message, 
      stack: error.stack,
      orderId: params.id
    })
    
    return NextResponse.json(
      createErrorResponse('Internal server error', 'INTERNAL_ERROR'),
      { status: 500 }
    )
  }
}
