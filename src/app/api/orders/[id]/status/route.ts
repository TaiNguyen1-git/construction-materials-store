import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createSuccessResponse, createErrorResponse } from '@/lib/api-types'
import { z } from 'zod'
import { logger } from '@/lib/logger'

const updateStatusSchema = z.object({
  status: z.enum([
    'PENDING_CONFIRMATION',
    'CONFIRMED_AWAITING_DEPOSIT', 
    'DEPOSIT_PAID',
    'PENDING', 
    'CONFIRMED', 
    'PROCESSING', 
    'SHIPPED', 
    'DELIVERED',
    'COMPLETED', 
    'CANCELLED',
    'RETURNED'
  ]),
  trackingNumber: z.string().optional(),
  note: z.string().optional()
})

// PUT /api/orders/[id]/status - Update order status
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: orderId } = await params
    
    // Parse request body
    const body = await request.json()
    
    // Validate input
    const validation = updateStatusSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        createErrorResponse('Invalid input', 'VALIDATION_ERROR', validation.error.issues),
        { status: 400 }
      )
    }

    const { status, trackingNumber, note } = validation.data

    // Check if order exists
    const existingOrder = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        customer: {
          include: {
            user: true
          }
        }
      }
    })

    if (!existingOrder) {
      return NextResponse.json(
        createErrorResponse('Order not found', 'NOT_FOUND'),
        { status: 404 }
      )
    }

    // Update order status
    const updateData: any = {
      status,
      updatedAt: new Date()
    }

    if (trackingNumber) {
      updateData.trackingNumber = trackingNumber
    }

    if (note) {
      updateData.notes = note
    }

    // Update payment status based on order status
    if (status === 'DEPOSIT_PAID') {
      updateData.paymentStatus = 'PARTIAL'
    } else if (status === 'DELIVERED' || status === 'COMPLETED') {
      updateData.paymentStatus = 'PAID'
    } else if (status === 'CANCELLED' || status === 'RETURNED') {
      updateData.paymentStatus = 'FAILED'
    }

    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: updateData,
      include: {
        customer: {
          include: {
            user: true
          }
        },
        orderItems: {
          include: {
            product: true
          }
        }
      }
    })

    logger.info('Order status updated', {
      orderId,
      oldStatus: existingOrder.status,
      newStatus: status,
      trackingNumber
    })

    // Send notification to customer
    try {
      const { createOrderStatusNotificationForCustomer } = await import('@/lib/notification-service')
      await createOrderStatusNotificationForCustomer({
        id: updatedOrder.id,
        orderNumber: updatedOrder.orderNumber,
        status: updatedOrder.status,
        customer: updatedOrder.customer ? {
          userId: updatedOrder.customer.userId
        } : null
      })
    } catch (notifError: any) {
      logger.error('Error creating order status notification for customer', { 
        error: notifError.message, 
        orderId 
      })
    }

    return NextResponse.json(
      createSuccessResponse(updatedOrder, 'Order status updated successfully'),
      { status: 200 }
    )

  } catch (error: any) {
    logger.error('Update order status error', { 
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
