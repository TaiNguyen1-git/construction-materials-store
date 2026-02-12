import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createSuccessResponse, createErrorResponse } from '@/lib/api-types'
import { logger } from '@/lib/logger'
import { verifyTokenFromRequest, AuthService } from '@/lib/auth'

// GET /api/orders/[id] - Get single order
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: orderId } = await params

    // Validate MongoDB ObjectID format (24 hex characters) to prevent Prisma crashing
    const objectIdRegex = /^[0-9a-fA-F]{24}$/
    if (!objectIdRegex.test(orderId)) {
      return NextResponse.json(
        createErrorResponse('Mã ID đơn hàng không đúng định dạng', 'INVALID_ID_FORMAT'),
        { status: 404 }
      )
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      select: {
        id: true,
        orderNumber: true,
        status: true,
        totalAmount: true,
        netAmount: true,
        paymentMethod: true,
        paymentStatus: true,
        customerType: true,
        guestName: true,
        guestPhone: true,
        guestEmail: true,
        shippingAddress: true,
        notes: true,
        createdAt: true,
        customer: {
          select: {
            id: true,
            userId: true,
            user: {
              select: { name: true, phone: true, email: true }
            }
          }
        },
        orderItems: {
          select: {
            id: true,
            quantity: true,
            unitPrice: true,
            totalPrice: true,
            product: {
              select: { id: true, name: true, sku: true, images: true, unit: true }
            }
          }
        },
        orderTracking: {
          orderBy: { timestamp: 'desc' },
          take: 5 // Only get latest tracking for performance 
        },
        deliveryPhases: true,
        contractor: {
          select: { id: true, displayName: true, phone: true }
        }
      }
    })

    if (!order) {
      return NextResponse.json(
        createErrorResponse('Order not found', 'NOT_FOUND'),
        { status: 404 }
      )
    }

    // 🛡️ SECURITY 2026: IDOR Protection / Ownership Check
    const tokenPayload = await verifyTokenFromRequest(request)
    const isAdmin = tokenPayload?.role === 'MANAGER' || tokenPayload?.role === 'EMPLOYEE'

    if (!isAdmin) {
      if (order.customerType === 'REGISTERED') {
        const userId = tokenPayload?.userId
        if (!userId || order.customer?.userId !== userId) {
          return NextResponse.json(
            createErrorResponse('Bạn không có quyền xem đơn hàng này', 'FORBIDDEN'),
            { status: 403 }
          )
        }
      } else {
        // GUEST Check: Priority to HttpOnly Cookie
        const guestToken = request.cookies.get(`order_access_${orderId}`)?.value
        const verifiedGuest = guestToken ? AuthService.verifyGuestOrderToken(guestToken) : null

        if (!verifiedGuest || verifiedGuest.orderId !== orderId) {
          return NextResponse.json(
            createErrorResponse('Quyền truy cập bị từ chối. Vui lòng sử dụng máy tính đã dùng để đặt hàng hoặc đăng nhập.', 'GUEST_ACCESS_DENIED'),
            { status: 403 }
          )
        }
      }
    }

    return NextResponse.json(
      createSuccessResponse(order, 'Order retrieved successfully'),
      {
        status: 200,
        headers: {
          'Cache-Control': 'private, max-age=30' // Cache for 30s locally to prevent spam refresh
        }
      }
    )

  } catch (error: unknown) {
    const err = error as Error
    logger.error('Get order error', {
      error: err.message,
      stack: err.stack
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
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: orderId } = await params

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

    // 🛡️ SECURITY 2026: Only Admins can delete orders
    const tokenPayload = await verifyTokenFromRequest(request)
    const isAdmin = tokenPayload?.role === 'MANAGER' || tokenPayload?.role === 'EMPLOYEE'

    if (!isAdmin) {
      return NextResponse.json(
        createErrorResponse('Bạn không có quyền thực hiện hành động này', 'FORBIDDEN'),
        { status: 403 }
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

  } catch (error: unknown) {
    const err = error as Error
    logger.error('Delete order error', {
      error: err.message,
      stack: err.stack
    })

    return NextResponse.json(
      createErrorResponse('Internal server error', 'INTERNAL_ERROR'),
      { status: 500 }
    )
  }
}
