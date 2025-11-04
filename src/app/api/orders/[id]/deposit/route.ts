import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createSuccessResponse, createErrorResponse } from '@/lib/api-types'

// PUT /api/orders/[id]/deposit - Admin confirms deposit received
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
    const { depositProof } = body // Optional: URL to payment proof image

    // Find order
    const order = await prisma.order.findUnique({
      where: { id: orderId }
    })

    if (!order) {
      return NextResponse.json(
        createErrorResponse('Order not found', 'NOT_FOUND'),
        { status: 404 }
      )
    }

    // Check if order is awaiting deposit
    if (order.status !== 'CONFIRMED_AWAITING_DEPOSIT') {
      return NextResponse.json(
        createErrorResponse('Order is not awaiting deposit', 'INVALID_STATE'),
        { status: 400 }
      )
    }

    // Check if order has deposit info
    if (order.paymentType !== 'DEPOSIT') {
      return NextResponse.json(
        createErrorResponse('Order is not a deposit order', 'INVALID_STATE'),
        { status: 400 }
      )
    }

    // Update order status
    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: {
        status: 'DEPOSIT_PAID',
        depositPaidAt: new Date(),
        depositProof: depositProof || null,
        paymentStatus: 'PARTIAL' // Deposit paid, remaining amount pending
      },
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

    // Create order tracking entry
    await prisma.orderTracking.create({
      data: {
        orderId: orderId,
        status: 'DEPOSIT_PAID',
        description: `Deposit received: ${order.depositAmount?.toLocaleString()}đ (${order.depositPercentage}%)`,
        createdBy: userId || 'ADMIN'
      }
    })

    return NextResponse.json(
      createSuccessResponse(updatedOrder, 'Deposit confirmed successfully'),
      { status: 200 }
    )

  } catch (error: any) {
    console.error('Confirm deposit error:', error)
    return NextResponse.json(
      createErrorResponse('Internal server error', 'INTERNAL_ERROR'),
      { status: 500 }
    )
  }
}
