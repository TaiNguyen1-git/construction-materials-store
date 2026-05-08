import { NextRequest, NextResponse } from 'next/server'
import { PaymentService } from '@/lib/payment-service'

// This is a mockup of a PayOS/VietQR Webhook
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // In a real implementation, you would verify the HMAC signature here
    // const signature = request.headers.get('x-api-signature')
    // if (!isValidSignature(body, signature, process.env.PAYOS_CHECKSUM_KEY)) {
    //   return NextResponse.json({ success: false, message: 'Invalid signature' }, { status: 401 })
    // }

    const { data } = body
    
    /**
     * PayOS data structure typically looks like:
     * {
     *   "code": "00",
     *   "desc": "success",
     *   "data": {
     *     "orderCode": 123456,
     *     "amount": 500000,
     *     "description": "Thanh toan don hang DH12345",
     *     "transactionDateTime": "...",
     *     "reference": "...",
     *     "status": "PAID"
     *   }
     * }
     */

    if (body.code === '00' && data.status === 'PAID') {
      // Extract order number from description or orderCode
      // Here we assume the description contains the Order Number like "DH12345"
      const description = data.description || ''
      const orderNumberMatch = description.match(/DH\d+/) || description.match(/ORD-\d+/)
      const orderNumber = orderNumberMatch ? orderNumberMatch[0] : null

      if (orderNumber) {
        await PaymentService.processPaymentSuccess(orderNumber, data.amount, data.reference)
        return NextResponse.json({ success: true, message: 'Webhook processed' })
      } else {
        console.warn('[PaymentWebhook] Could not find order number in description:', description)
        return NextResponse.json({ success: false, message: 'Order number not found' }, { status: 400 })
      }
    }

    return NextResponse.json({ success: true, message: 'Received' })
  } catch (error) {
    console.error('[PaymentWebhook] Error:', error)
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 })
  }
}
