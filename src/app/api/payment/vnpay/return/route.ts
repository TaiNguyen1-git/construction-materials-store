import { NextRequest, NextResponse } from 'next/server'
import { vnPayService } from '@/lib/vnpay'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    
    // Convert search params to object
    const vnpParams: Record<string, string> = {}
    searchParams.forEach((value, key) => {
      vnpParams[key] = value
    })

    // Verify payment
    const verification = vnPayService.verifyReturnUrl(vnpParams)
    
    if (verification.isValid) {
      const orderNumber = vnpParams['vnp_TxnRef']
      const transactionId = vnpParams['vnp_TransactionNo']
      const amount = parseInt(vnpParams['vnp_Amount']) / 100

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
        `${process.env.NEXT_PUBLIC_BASE_URL}/checkout?payment=failed&message=${encodeURIComponent(verification.message)}`
      )
    }

  } catch (error) {
    console.error('VNPay return error:', error)
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_BASE_URL}/checkout?payment=error`
    )
  }
}
