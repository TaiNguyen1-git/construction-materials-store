import { prisma } from '../prisma'
import { creditCheckService } from '../credit-check-service'
import { saveNotificationForUser } from '../notification-service'

export class BillingReminderService {
    /**
     * Chạy tiến trình kiểm tra và gửi nhắc nợ
     */
    static async processBillingReminders() {
        console.log('[BillingReminderService] Bất đầu quét công nợ và thanh toán...')
        const results = {
            debtNotifications: 0,
            orderNotifications: 0,
            milestoneNotifications: 0,
            errors: 0
        }

        // 1. Quét công nợ quá hạn (Cho khách hàng B2B/Credit)
        try {
            const customersWithDebt = await prisma.customer.findMany({
                where: {
                    isDeleted: false,
                    OR: [
                        { currentBalance: { gt: 0 } },
                        { overdueAmount: { gt: 0 } }
                    ]
                },
                include: { user: { select: { name: true, id: true } } }
            })

            for (const customer of customersWithDebt) {
                const { overdueAmount, maxOverdueDays, overdueInvoices } = await creditCheckService.getOverdueInfo(customer.id)
                if (overdueAmount > 0) {
                    await saveNotificationForUser({
                        type: 'PAYMENT_UPDATE',
                        priority: maxOverdueDays > 15 ? 'HIGH' : 'MEDIUM',
                        title: `🔔 Nhắc thanh toán công nợ: ${customer.user.name}`,
                        message: `Bạn có ${overdueInvoices.length} hóa đơn quá hạn. Tổng nợ: ${overdueAmount.toLocaleString()}đ. Vui lòng thanh toán sớm.`,
                        data: { overdueAmount, invoiceCount: overdueInvoices.length }
                    }, customer.userId)
                    results.debtNotifications++
                }
            }
        } catch (err) {
            console.error('Lỗi quét công nợ:', err)
            results.errors++
        }

        // 2. Quét Đơn hàng chờ thanh toán/đặt cọc (Cho User/Contractor mua lẻ)
        try {
            // Lấy các đơn hàng đã xác nhận nhưng chưa cọc/thanh toán quá 24h
            const oneDayAgo = new Date()
            oneDayAgo.setHours(oneDayAgo.getHours() - 24)

            const pendingOrders = await prisma.order.findMany({
                where: {
                    status: 'CONFIRMED_AWAITING_DEPOSIT',
                    paymentStatus: 'PENDING',
                    confirmedAt: { lte: oneDayAgo }
                },
                include: { 
                    customer: { select: { userId: true } }
                }
            })

            for (const order of pendingOrders) {
                const targetUserId = order.customer?.userId
                if (!targetUserId) continue
                
                await saveNotificationForUser({
                    type: 'ORDER_UPDATE',
                    priority: 'MEDIUM',
                    title: `📦 Nhắc thanh toán đơn hàng: ${order.orderNumber}`,
                    message: `Đơn hàng ${order.orderNumber} của bạn đang chờ đặt cọc để bắt đầu xử lý. Vui lòng hoàn tất thanh toán.`,
                    orderId: order.id
                }, targetUserId)
                results.orderNotifications++
            }
        } catch (err) {
            console.error('Lỗi quét đơn hàng:', err)
            results.errors++
        }

        // 3. Quét Milestone dự án chờ nộp Escrow (Cho Contractor/Project)
        try {
            const pendingMilestones = await prisma.paymentMilestone.findMany({
                where: {
                    status: 'PENDING',
                    escrowStatus: 'PENDING',
                    dueDate: { lte: new Date() } // Đã đến hoặc quá hạn nộp
                },
                include: {
                    quote: {
                        include: {
                            customer: { select: { userId: true } }
                        }
                    }
                }
            })

            for (const ms of pendingMilestones) {
                const targetUserId = ms.quote?.customer?.userId
                if (!targetUserId) continue
                
                await saveNotificationForUser({
                    type: 'PAYMENT_UPDATE',
                    priority: 'HIGH',
                    title: `🏗️ Nhắc ký quỹ Milestone: ${ms.name}`,
                    message: `Giai đoạn "${ms.name}" của dự án đã đến hạn nộp tiền vào Escrow (${ms.amount.toLocaleString()}đ). Vui lòng ký quỹ để nhà thầu tiếp tục thi công.`,
                    milestoneId: ms.id
                }, targetUserId)
                results.milestoneNotifications++
            }
        } catch (err) {
            console.error('Lỗi quét milestone:', err)
            results.errors++
        }

        console.log('[BillingReminderService] Hoàn tất quét:', results)
        return results
    }
}
