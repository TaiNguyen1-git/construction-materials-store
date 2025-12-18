import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createSuccessResponse, createErrorResponse } from '@/lib/api-types'
import { z } from 'zod'
import { logger } from '@/lib/logger'
import { pushOrderStatusUpdate } from '@/lib/firebase-notifications'

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
      updateData.paymentStatus = 'CANCELLED' // Use CANCELLED instead of FAILED (not in enum)
    }

    const updatedOrder = await prisma.$transaction(async (tx) => {
      // If cancelling, restore inventory
      if (status === 'CANCELLED' && existingOrder.status !== 'CANCELLED') {
        const orderItems = await tx.orderItem.findMany({
          where: { orderId }
        })

        for (const item of orderItems) {
          // Restore inventory: move from reserved back to available
          await tx.inventoryItem.update({
            where: { productId: item.productId },
            data: {
              availableQuantity: { increment: item.quantity },
              reservedQuantity: { decrement: item.quantity }
            }
          })

          // Create inventory movement record
          const inventoryItem = await tx.inventoryItem.findUnique({
            where: { productId: item.productId }
          })

          if (inventoryItem) {
            await tx.inventoryMovement.create({
              data: {
                productId: item.productId,
                inventoryId: inventoryItem.id,
                movementType: 'IN',
                quantity: item.quantity,
                previousStock: inventoryItem.availableQuantity - item.quantity,
                newStock: inventoryItem.availableQuantity,
                reason: `Order ${existingOrder.orderNumber} cancelled`,
                referenceType: 'ORDER',
                referenceId: orderId,
                performedBy: 'ADMIN'
              }
            })
          }
        }
      }

      // Update order
      return await tx.order.update({
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
    })

    logger.info('Order status updated', {
      orderId,
      oldStatus: existingOrder.status,
      newStatus: status,
      trackingNumber
    })

    // Push status update to Firebase for real-time tracking (non-blocking)
    pushOrderStatusUpdate(orderId, status, updatedOrder.orderNumber)
      .catch(err => console.error('Firebase push error:', err))

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

    // Send email to customer when order is confirmed
    if (status === 'CONFIRMED' || status === 'CONFIRMED_AWAITING_DEPOSIT') {
      const customerEmail = updatedOrder.customer?.user?.email || updatedOrder.guestEmail
      const customerName = updatedOrder.customer?.user?.name || updatedOrder.guestName || 'Quý khách'

      console.log('📧 Email Debug (status route):', {
        customerEmail,
        customerName,
        guestEmail: updatedOrder.guestEmail,
        status,
        orderNumber: updatedOrder.orderNumber
      })

      if (customerEmail) {
        import('@/lib/email-service').then(({ EmailService }) => {
          console.log('📧 Sending confirmation email to:', customerEmail)
          EmailService.sendOrderApprovedWithPayment({
            email: customerEmail,
            name: customerName,
            orderNumber: updatedOrder.orderNumber,
            orderId: updatedOrder.id,
            totalAmount: updatedOrder.netAmount,
            depositAmount: updatedOrder.depositAmount || undefined,
            paymentMethod: updatedOrder.paymentMethod || 'BANK_TRANSFER',
            paymentType: updatedOrder.paymentType || 'FULL',
            items: updatedOrder.orderItems.map(item => ({
              name: item.product.name,
              quantity: item.quantity,
              price: item.unitPrice
            }))
          }).then(result => {
            console.log('📧 Email sent result:', result)
          }).catch(err => console.error('❌ Email to customer error:', err))
        }).catch(err => console.error('❌ Email import error:', err))
      } else {
        console.log('⚠️ No customer email found, skipping email')
      }
    }

    return NextResponse.json(
      createSuccessResponse(updatedOrder, 'Order status updated successfully'),
      { status: 200 }
    )

  } catch (error: any) {
    logger.error('Update order status error', {
      error: error.message,
      stack: error.stack
    })

    return NextResponse.json(
      createErrorResponse('Internal server error', 'INTERNAL_ERROR'),
      { status: 500 }
    )
  }
}
