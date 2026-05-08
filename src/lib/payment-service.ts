import { prisma } from './prisma'
import { pushOrderStatusUpdate } from './firebase-notifications'

export class PaymentService {
  /**
   * Processes a successful payment notification for an order
   */
  static async processPaymentSuccess(orderNumber: string, amount: number, transactionId: string) {
    try {
      // 1. Find the order by orderNumber
      const order = await prisma.order.findUnique({
        where: { orderNumber },
        include: {
          customer: { include: { user: true } }
        }
      })

      if (!order) {
        console.error(`[PaymentService] Order #${orderNumber} not found.`)
        return { success: false, message: 'Order not found' }
      }

      // 2. Check if payment is already processed
      if (order.paymentStatus === 'PAID') {
        return { success: true, message: 'Payment already processed' }
      }

      // 3. Determine new status
      let newStatus = order.status
      let newPaymentStatus = 'PAID'
      let depositPaidAt = null

      if (order.paymentType === 'DEPOSIT' && order.status === 'CONFIRMED_AWAITING_DEPOSIT') {
        newStatus = 'DEPOSIT_PAID' // Custom status for deposit confirmed
        depositPaidAt = new Date()
      } else if (order.status === 'PENDING_CONFIRMATION' || order.status === 'CONFIRMED') {
        newStatus = 'PROCESSING' // Move to processing after full payment
      }

      // 4. Update order in database
      const updatedOrder = await prisma.order.update({
        where: { id: order.id },
        data: {
          paymentStatus: 'PAID', // In B2B context, 'PAID' might mean the specific transaction (deposit/full) is cleared
          status: newStatus as any,
          depositPaidAt: depositPaidAt,
          updatedAt: new Date(),
          // We can also create a Payment record here if needed
        }
      })

      // 5. Notify parties
      console.log(`[PaymentService] Payment confirmed for Order #${orderNumber}. Status: ${newStatus}`)
      
      // Real-time notification
      await pushOrderStatusUpdate(order.id, newStatus, order.orderNumber)
        .catch(err => console.error('[PaymentService] Firebase error:', err))

      // 6. Send receipt email (optional/non-blocking)
      const customerEmail = order.customer?.user?.email || order.guestEmail
      if (customerEmail) {
        // Import and send email...
      }

      return { success: true, data: updatedOrder }
    } catch (error) {
      console.error('[PaymentService] Error processing payment:', error)
      throw error
    }
  }
}
