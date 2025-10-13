import { NextRequest, NextResponse } from 'next/server'
import { momoService } from '@/lib/momo'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    
    // Convert search params to object
    const params: Record<string, any> = {}
    searchParams.forEach((value, key) => {
      params[key] = value
    })

    // Verify signature
    const isValid = momoService.verifySignature(params)
    
    if (isValid && params.resultCode === '0') {
      const orderNumber = params.orderId
      const transactionId = params.transId
      const amount = parseInt(params.amount)

      // Update order payment status
      const order = await prisma.order.findFirst({
        where: { orderNumber },
        select: { id: true }
      })

      if (order) {
        await prisma.order.update({
          where: { id: order.id },
          data: {
            paymentStatus: 'PAID',
            status: 'CONFIRMED'
          }
        })

        // Create payment record
        await prisma.payment.create({
          data: {
            paymentNumber: `PAY-${Date.now()}`,
            orderId: order.id,
            paymentType: 'INCOMING',
            paymentMethod: 'DIGITAL_WALLET',
            amount,
            status: 'PENDING',
            transactionId,
            reference: orderNumber,
            paymentDate: new Date()
          }
        })
      }

      // Redirect to success page
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_BASE_URL}/order-confirmation?orderId=${order?.id}&payment=success`
      )
    } else {
      // Redirect to failure page
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_BASE_URL}/checkout?payment=failed&message=${encodeURIComponent(params.message || 'Payment failed')}`
      )
    }

  } catch (error) {
    console.error('MoMo return error:', error)
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_BASE_URL}/checkout?payment=error`
    )
  }
}
