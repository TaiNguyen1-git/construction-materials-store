import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createSuccessResponse, createErrorResponse } from '@/lib/api-types'
import { pushOrderStatusUpdate } from '@/lib/firebase-notifications'

// PUT /api/orders/[id]/confirm - Admin confirms order
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = request.headers.get('x-user-id')
    const userRole = request.headers.get('x-user-role')

    // Check admin authorization
    if (userRole !== 'MANAGER' && userRole !== 'EMPLOYEE') {
      return NextResponse.json(
        createErrorResponse('Unauthorized. Admin access required.', 'UNAUTHORIZED'),
        { status: 403 }
      )
    }

    const { id: orderId } = await params
    const body = await request.json()
    const { action } = body // 'confirm' or 'reject'

    // Find order
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        orderItems: {
          include: {
            product: true
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

    // Check if order is pending confirmation
    if (order.status !== 'PENDING_CONFIRMATION') {
      return NextResponse.json(
        createErrorResponse('Order cannot be confirmed in current status', 'INVALID_STATE'),
        { status: 400 }
      )
    }

    if (action === 'reject') {
      // Reject order - cancel and restore inventory
      const updatedOrder = await prisma.$transaction(async (tx) => {
        // Update order status
        const cancelled = await tx.order.update({
          where: { id: orderId },
          data: {
            status: 'CANCELLED',
            cancelReason: body.reason || 'Rejected by admin',
            cancelledAt: new Date()
          }
        })

        // Restore inventory
        for (const item of order.orderItems) {
          await tx.inventoryItem.update({
            where: { productId: item.productId },
            data: {
              availableQuantity: { increment: item.quantity },
              reservedQuantity: { decrement: item.quantity }
            }
          })
        }

        return cancelled
      })

      // Push status update to Firebase (non-blocking)
      pushOrderStatusUpdate(orderId, 'CANCELLED', order.orderNumber)
        .catch(err => console.error('Firebase push error:', err))

      return NextResponse.json(
        createSuccessResponse(updatedOrder, 'Order rejected successfully'),
        { status: 200 }
      )
    }

    // Confirm order
    const newStatus = order.paymentType === 'DEPOSIT'
      ? 'CONFIRMED_AWAITING_DEPOSIT'
      : 'CONFIRMED'

    // Prepare update data
    const updateData: any = {
      status: newStatus,
      confirmedBy: userId || 'ADMIN',
      confirmedAt: new Date()
    }

    // Create QR code expiry for bank transfer orders (both DEPOSIT and FULL)
    if (order.paymentMethod === 'BANK_TRANSFER') {
      const qrExpiry = new Date()
      qrExpiry.setHours(qrExpiry.getHours() + 24) // 24 hours to pay
      updateData.qrExpiresAt = qrExpiry
    }

    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: updateData,
      include: {
        orderItems: {
          include: {
            product: true
          }
        },
        customer: {
          include: {
            user: true
          }
        }
      }
    })

    // Push status update to Firebase for real-time tracking (non-blocking)
    pushOrderStatusUpdate(orderId, newStatus, order.orderNumber)
      .catch(err => console.error('Firebase push error:', err))

    // Send confirmation email to customer (non-blocking)
    const customerEmail = updatedOrder.customer?.user?.email || updatedOrder.guestEmail
    const customerName = updatedOrder.customer?.user?.name || updatedOrder.guestName || 'Quý khách'

    console.log('📧 Email Debug:', {
      customerEmail,
      customerName,
      guestEmail: updatedOrder.guestEmail,
      guestName: updatedOrder.guestName,
      hasCustomer: !!updatedOrder.customer,
      orderNumber: updatedOrder.orderNumber
    })

    if (customerEmail) {
      import('@/lib/email-service').then(({ EmailService }) => {
        console.log('📧 Sending email to:', customerEmail)
        EmailService.sendOrderApprovedWithPayment({
          email: customerEmail,
          name: customerName || 'Quý khách',
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

    return NextResponse.json(
      createSuccessResponse(updatedOrder, 'Order confirmed successfully'),
      { status: 200 }
    )

  } catch (error: any) {
    console.error('Confirm order error:', error)
    return NextResponse.json(
      createErrorResponse('Internal server error', 'INTERNAL_ERROR'),
      { status: 500 }
    )
  }
}
