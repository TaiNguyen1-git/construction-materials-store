/**
 * Debt Reminder Service
 * Handles automatic debt reminders and credit hold enforcement
 */

import { prisma } from './prisma'
import { sendNotification } from './notification-service'

export class DebtReminderService {
    /**
     * Send reminder for a specific overdue invoice
     */
    static async sendReminder(
        customerId: string,
        invoiceId: string,
        daysOverdue: number
    ): Promise<{ sent: boolean; method: string }> {
        try {
            // Get customer and invoice details
            const invoice = await prisma.invoice.findUnique({
                where: { id: invoiceId },
                include: {
                    customer: {
                        include: { user: true }
                    }
                }
            })

            if (!invoice || !invoice.customer) {
                return { sent: false, method: 'none' }
            }

            const customerName = invoice.customer.user.name
            const customerEmail = invoice.customer.user.email
            const amount = invoice.balanceAmount

            // Determine reminder level based on days overdue
            let reminderLevel: 'FIRST' | 'SECOND' | 'FINAL' = 'FIRST'
            if (daysOverdue >= 15) reminderLevel = 'SECOND'
            if (daysOverdue >= 30) reminderLevel = 'FINAL'

            // Send email notification using existing email service
            try {
                // Log the debt reminder (email sending can be added when EmailService exposes public method)
                console.log(`[DEBT_REMINDER] Sending reminder to ${customerEmail} for invoice ${invoice.invoiceNumber} (${daysOverdue} days overdue, ${amount.toLocaleString('vi-VN')}đ)`)

                // Log notification using existing notification service
                await sendNotification({
                    type: 'ORDER_UPDATE', // Use existing type for debt-related notifications
                    priority: reminderLevel === 'FINAL' ? 'HIGH' : 'MEDIUM',
                    title: `Nhắc nợ lần ${reminderLevel === 'FIRST' ? 1 : reminderLevel === 'SECOND' ? 2 : 3}`,
                    message: `Hóa đơn ${invoice.invoiceNumber} quá hạn ${daysOverdue} ngày. Số tiền: ${amount.toLocaleString('vi-VN')}đ`,
                    data: { invoiceId, customerId, daysOverdue }
                })

                return { sent: true, method: 'notification' }
            } catch (emailError) {
                console.error('Failed to send debt reminder email:', emailError)
                return { sent: false, method: 'email_failed' }
            }
        } catch (error) {
            console.error('Debt reminder error:', error)
            return { sent: false, method: 'error' }
        }
    }

    /**
     * Check and auto-lock accounts that exceed MAX_OVERDUE_DAYS
     */
    static async checkAndLockOverdueAccounts(): Promise<{
        checked: number
        locked: number
        lockedCustomers: string[]
    }> {
        const today = new Date()
        let maxOverdueDays = 30 // Default

        // Try to get config from database
        try {
            const config = await prisma.debtConfiguration.findFirst({
                where: { isActive: true }
            })
            if (config) {
                maxOverdueDays = config.maxOverdueDays
            }
        } catch (e) {
            console.warn('Could not load debt config, using defaults')
        }

        // Find all customers with overdue invoices
        const overdueInvoices = await prisma.invoice.findMany({
            where: {
                invoiceType: 'SALES',
                status: { in: ['SENT', 'OVERDUE'] },
                dueDate: { lt: today },
                balanceAmount: { gt: 0 }
            },
            include: {
                customer: {
                    include: { user: true }
                }
            }
        })

        // Group by customer and find max overdue days
        const customerOverdue: Record<string, { maxDays: number; customerId: string; name: string }> = {}

        for (const invoice of overdueInvoices) {
            if (!invoice.customer || !invoice.dueDate) continue

            const dueDate = new Date(invoice.dueDate)
            const daysOverdue = Math.ceil((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24))

            const existing = customerOverdue[invoice.customerId!]
            if (!existing || daysOverdue > existing.maxDays) {
                customerOverdue[invoice.customerId!] = {
                    maxDays: daysOverdue,
                    customerId: invoice.customerId!,
                    name: invoice.customer.user.name
                }
            }
        }

        let checked = 0
        let locked = 0
        const lockedCustomers: string[] = []

        // Lock accounts that exceed threshold
        for (const [customerId, data] of Object.entries(customerOverdue)) {
            checked++

            if (data.maxDays > maxOverdueDays) {
                // Check if already locked
                const customer = await prisma.customer.findUnique({
                    where: { id: customerId }
                })

                if (customer && !customer.creditHold) {
                    await prisma.customer.update({
                        where: { id: customerId },
                        data: { creditHold: true }
                    })

                    // Send notification using existing notification service
                    await sendNotification({
                        type: 'ORDER_UPDATE', // Use existing type for credit-hold notifications
                        priority: 'HIGH',
                        title: 'Tài khoản bị khóa tín dụng',
                        message: `Tài khoản của bạn đã bị khóa do có hóa đơn quá hạn ${data.maxDays} ngày. Vui lòng thanh toán để mở khóa.`,
                        data: { customerId, maxDays: data.maxDays, action: 'CREDIT_HOLD' }
                    })

                    locked++
                    lockedCustomers.push(data.name)
                }
            }
        }

        return { checked, locked, lockedCustomers }
    }

    /**
     * Process all reminders - main function for daily cron job
     */
    static async processAllReminders(): Promise<{
        remindersProcessed: number
        remindersSent: number
        accountsChecked: number
        accountsLocked: number
    }> {
        const today = new Date()

        // 1. Find all overdue invoices
        const overdueInvoices = await prisma.invoice.findMany({
            where: {
                invoiceType: 'SALES',
                status: { in: ['SENT', 'OVERDUE'] },
                dueDate: { lt: today },
                balanceAmount: { gt: 0 }
            },
            include: {
                customer: true
            }
        })

        let remindersProcessed = 0
        let remindersSent = 0

        // 2. Send reminders for each overdue invoice
        //    Only send on specific days: 1, 7, 15, 30
        for (const invoice of overdueInvoices) {
            if (!invoice.dueDate || !invoice.customerId) continue

            const daysOverdue = Math.ceil((today.getTime() - new Date(invoice.dueDate).getTime()) / (1000 * 60 * 60 * 24))

            // Send reminder on specific days
            if ([1, 7, 15, 30].includes(daysOverdue)) {
                remindersProcessed++
                const result = await this.sendReminder(invoice.customerId, invoice.id, daysOverdue)
                if (result.sent) remindersSent++
            }
        }

        // 3. Check and lock overdue accounts
        const lockResult = await this.checkAndLockOverdueAccounts()

        return {
            remindersProcessed,
            remindersSent,
            accountsChecked: lockResult.checked,
            accountsLocked: lockResult.locked
        }
    }
}

export const debtReminderService = DebtReminderService
