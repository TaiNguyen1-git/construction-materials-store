import { prisma } from '../prisma'
import { creditCheckService } from '../credit-check-service'
import { saveNotificationForUser } from '../notification-service'

export class BillingReminderService {
    /**
     * Chạy tiến trình kiểm tra và gửi nhắc nợ
     */
    static async processBillingReminders() {
        console.log('[BillingReminderService] Bắt đầu quét công nợ...')

        // 1. Lấy tất cả khách hàng có nợ
        const customersWithDebt = await prisma.customer.findMany({
            where: {
                isDeleted: false,
                OR: [
                    { currentBalance: { gt: 0 } },
                    { overdueAmount: { gt: 0 } }
                ]
            },
            include: {
                user: {
                    select: { name: true, id: true, email: true }
                }
            }
        })

        const results = {
            total: customersWithDebt.length,
            notificationsSent: 0,
            errors: 0
        }

        for (const customer of customersWithDebt) {
            try {
                // 2. Lấy thông tin nợ chi tiết
                const { overdueAmount, maxOverdueDays, overdueInvoices } = await creditCheckService.getOverdueInfo(customer.id)

                if (overdueAmount > 0) {
                    // 3. Gửi thông báo nhắc nợ
                    await saveNotificationForUser({
                        type: 'PAYMENT_UPDATE', // Sử dụng type có sẵn để an toàn
                        priority: maxOverdueDays > 30 ? 'HIGH' : 'MEDIUM',
                        title: `🔔 Nhắc thanh toán công nợ: ${customer.user.name}`,
                        message: `Bạn đang có ${overdueInvoices.length} hóa đơn quá hạn. Tổng nợ quá hạn: ${overdueAmount.toLocaleString()}đ. Vui lòng thanh toán sớm nhất có thể.`,
                        data: {
                            overdueAmount,
                            maxOverdueDays,
                            invoiceCount: overdueInvoices.length
                        }
                    }, customer.userId)

                    results.notificationsSent++
                }
            } catch (err) {
                console.error(`[BillingReminderService] Lỗi xử lý khách hàng ${customer.id}:`, err)
                results.errors++
            }
        }

        console.log('[BillingReminderService] Hoàn tất quét công nợ:', results)
        return results
    }
}
