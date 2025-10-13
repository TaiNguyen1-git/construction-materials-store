import { NextRequest, NextResponse } from 'next/server'
import { momoService } from '@/lib/momo'
import { createSuccessResponse, createErrorResponse } from '@/lib/api-types'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const orderId = searchParams.get('orderId')

    if (!orderId) {
      return NextResponse.json(
        createErrorResponse('Order ID is required', 'VALIDATION_ERROR'),
        { status: 400 }
      )
    }

    // Get order details
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      select: {
        id: true,
        orderNumber: true,
        netAmount: true,
        status: true
      }
    })

    if (!order) {
      return NextResponse.json(
        createErrorResponse('Order not found', 'NOT_FOUND'),
        { status: 404 }
      )
    }

    // Create MoMo payment
    const { payUrl } = await momoService.createPayment(
      order.orderNumber,
      order.netAmount,
      `Thanh toan don hang ${order.orderNumber}`
    )

    // Redirect to MoMo
    return NextResponse.redirect(payUrl)

  } catch (error) {
    console.error('MoMo payment error:', error)
    return NextResponse.json(
      createErrorResponse('Internal server error', 'INTERNAL_ERROR'),
      { status: 500 }
    )
  }
}
