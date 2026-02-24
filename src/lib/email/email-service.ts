// Email Service - Using Nodemailer for SMTP
// Refactored: HTML templates are in ./templates/ and types in ./email-types.ts

import nodemailer from 'nodemailer'
import { EmailTemplate, getBaseUrl } from './email-types'
import {
    getOrderApprovedHTML,
    getNewOrderForEmployeeHTML,
    getOrderConfirmationHTML,
    getOrderConfirmationText,
} from './templates/order.templates'
import { getStockAlertHTML, getAdminReportHTML } from './templates/stock.templates'
import { getPasswordResetHTML, getOTPHTML, getOrganizationInvitationHTML } from './templates/auth.templates'
import { getSupplierPOHTML, getSupportRequestHTML, getLoyaltyGiftHTML } from './templates/supplier.templates'

export class EmailService {
    // Order Confirmation Email (when customer places order)
    static async sendOrderConfirmation(orderData: {
        email: string
        name: string
        orderNumber: string
        totalAmount: number
        items: Array<{ name: string; quantity: number; price: number }>
    }) {
        const template: EmailTemplate = {
            to: orderData.email,
            subject: `✅ Xác nhận đơn hàng ${orderData.orderNumber} - SmartBuild`,
            html: getOrderConfirmationHTML(orderData),
            text: getOrderConfirmationText(orderData)
        }
        return this.sendEmail(template)
    }

    // Order Approved Email with Payment Info (when admin confirms order)
    static async sendOrderApprovedWithPayment(data: {
        email: string
        name: string
        orderNumber: string
        orderId: string
        totalAmount: number
        depositAmount?: number
        paymentMethod: string
        paymentType: string
        items: Array<{ name: string; quantity: number; price: number }>
    }) {
        const template: EmailTemplate = {
            to: data.email,
            subject: `🎉 Đơn hàng ${data.orderNumber} đã được xác nhận - SmartBuild`,
            html: getOrderApprovedHTML(data),
            text: `Đơn hàng ${data.orderNumber} đã được xác nhận. Vui lòng thanh toán để tiếp tục xử lý.`
        }
        return this.sendEmail(template)
    }

    // New Order Email for Employee
    static async sendNewOrderToEmployee(data: {
        orderNumber: string
        customerName: string
        customerPhone?: string
        totalAmount: number
        itemCount: number
    }) {
        const employeeEmail = process.env.EMPLOYEE_NOTIFICATION_EMAIL
        if (!employeeEmail) return false

        const template: EmailTemplate = {
            to: employeeEmail,
            subject: `🛒 Đơn hàng mới: ${data.orderNumber}`,
            html: getNewOrderForEmployeeHTML(data),
            text: `Đơn hàng mới ${data.orderNumber} từ ${data.customerName}, tổng ${data.totalAmount.toLocaleString()}đ`
        }
        return this.sendEmail(template)
    }

    // Stock Alert Email for Employee
    static async sendStockAlertToEmployee(data: {
        productName: string
        sku: string
        currentStock: number
        minStock: number
    }) {
        const employeeEmail = process.env.EMPLOYEE_NOTIFICATION_EMAIL
        if (!employeeEmail) return false

        const template: EmailTemplate = {
            to: employeeEmail,
            subject: `⚠️ Cảnh báo tồn kho: ${data.productName}`,
            html: getStockAlertHTML(data, 'warning'),
            text: `Sản phẩm ${data.productName} (${data.sku}) còn ${data.currentStock} đơn vị, dưới mức tối thiểu ${data.minStock}`
        }
        return this.sendEmail(template)
    }

    // Critical Stock Alert Email for Admin (only critical)
    static async sendCriticalStockAlertToAdmin(data: {
        productName: string
        sku: string
        currentStock: number
        minStock: number
    }) {
        const adminEmail = process.env.ADMIN_NOTIFICATION_EMAIL
        if (!adminEmail) return false

        const template: EmailTemplate = {
            to: adminEmail,
            subject: `🚨 KHẨN CẤP: Tồn kho nguy cấp - ${data.productName}`,
            html: getStockAlertHTML(data, 'critical'),
            text: `KHẨN CẤP: Sản phẩm ${data.productName} (${data.sku}) chỉ còn ${data.currentStock} đơn vị!`
        }
        return this.sendEmail(template)
    }

    // Shipping Notification
    static async sendShippingNotification(data: {
        email: string
        name: string
        orderNumber: string
        trackingNumber?: string
    }) {
        const template: EmailTemplate = {
            to: data.email,
            subject: `🚚 Đơn hàng ${data.orderNumber} đang được giao`,
            html: getShippingNotificationHTML(data),
            text: `Xin chào ${data.name},\n\nĐơn hàng ${data.orderNumber} của bạn đang được giao.\n${data.trackingNumber ? `Mã vận đơn: ${data.trackingNumber}` : ''}\n\nCảm ơn bạn đã mua hàng!`
        }
        return this.sendEmail(template)
    }

    // Password Reset Email
    static async sendPasswordReset(data: {
        email: string
        name: string
        resetLink: string
    }) {
        const template: EmailTemplate = {
            to: data.email,
            subject: '🔐 Đặt lại mật khẩu - SmartBuild',
            html: getPasswordResetHTML(data),
            text: `Xin chào ${data.name},\n\nBạn đã yêu cầu đặt lại mật khẩu.\nNhấp vào link sau: ${data.resetLink}\n\nLink có hiệu lực trong 1 giờ.`
        }
        return this.sendEmail(template)
    }

    // Send OTP Email
    static async sendOTP(data: {
        email: string
        name: string
        otpCode: string
        type: 'VERIFICATION' | '2FA' | 'CHANGE_PROFILE'
        expiresInMinutes?: number
    }) {
        const typeLabels = {
            VERIFICATION: 'Xác minh tài khoản',
            '2FA': 'Mã đăng nhập (2FA)',
            CHANGE_PROFILE: 'Thay đổi thông tin'
        }
        const template: EmailTemplate = {
            to: data.email,
            subject: `🛡️ Mã xác thực ${typeLabels[data.type]} - SmartBuild`,
            html: getOTPHTML(data),
            text: `Xin chào ${data.name},\nMã xác thực của bạn là: ${data.otpCode}\nMã có hiệu lực trong ${data.expiresInMinutes || 10} phút.`
        }
        return this.sendEmail(template)
    }

    // Send Organization Invitation
    static async sendOrganizationInvitation(data: {
        email: string
        organizationName: string
        inviterName: string
        registerLink: string
        role: string
    }) {
        const template: EmailTemplate = {
            to: data.email,
            subject: `🏢 Mời tham gia tổ chức ${data.organizationName} - SmartBuild B2B`,
            html: getOrganizationInvitationHTML(data),
            text: `Xin chào,\n\nBạn được mời tham gia tổ chức ${data.organizationName} bởi ${data.inviterName} với vai trò ${data.role}.\nNhấp vào link sau để hoàn tất đăng ký: ${data.registerLink}`
        }
        return this.sendEmail(template)
    }

    // Loyalty Gift Email
    static async sendLoyaltyGift(data: {
        email: string
        name: string
        giftType: string
        giftValue: string
        message: string
    }) {
        const template: EmailTemplate = {
            to: data.email,
            subject: `Món quà tri ân đặc biệt từ SmartBuild dành cho ${data.name}`,
            html: getLoyaltyGiftHTML(data),
            text: `Chào ${data.name},\n\nSmartBuild gửi tặng bạn: ${data.giftValue}.\n\nLời nhắn: ${data.message}`
        }
        return this.sendEmail(template)
    }

    // Generic Notification Email (for multi-channel notifications)
    static async sendGenericNotificationEmail(data: {
        email: string
        subject: string
        message: string
        priority: 'HIGH' | 'MEDIUM' | 'LOW'
        actionUrl?: string
    }) {
        const priorityColors = {
            HIGH: { bg: '#dc2626', text: '#ffffff', label: '⚠️ KHẨN CẤP' },
            MEDIUM: { bg: '#f59e0b', text: '#ffffff', label: '📢 Thông báo' },
            LOW: { bg: '#3b82f6', text: '#ffffff', label: '💡 Thông tin' }
        }
        const style = priorityColors[data.priority] || priorityColors.MEDIUM

        const html = `
      <!DOCTYPE html>
      <html>
      <head><meta charset="utf-8"></head>
      <body style="margin: 0; padding: 20px; background-color: #f4f7fa; font-family: Arial, sans-serif;">
        <table style="max-width: 500px; margin: 0 auto; background: #fff; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
          <tr>
            <td style="background: ${style.bg}; padding: 20px; text-align: center;">
              <span style="color: ${style.text}; font-size: 14px; font-weight: 600;">${style.label}</span>
            </td>
          </tr>
          <tr>
            <td style="padding: 25px;">
              <h2 style="margin: 0 0 15px 0; color: #1e293b; font-size: 18px;">${data.subject}</h2>
              <p style="color: #64748b; font-size: 15px; line-height: 1.6; margin: 0;">${data.message}</p>
              ${data.actionUrl ? `
              <div style="text-align: center; margin-top: 25px;">
                <a href="${data.actionUrl}" style="display: inline-block; background: #1d4ed8; color: #fff; padding: 12px 30px; border-radius: 8px; text-decoration: none; font-weight: 600;">
                  Xem Chi Tiết
                </a>
              </div>
              ` : ''}
            </td>
          </tr>
          <tr>
            <td style="background: #f8fafc; padding: 15px; text-align: center; color: #9ca3af; font-size: 12px;">
              SmartBuild - Vật Liệu Xây Dựng Thông Minh
            </td>
          </tr>
        </table>
      </body>
      </html>
    `

        const template: EmailTemplate = {
            to: data.email,
            subject: data.subject,
            html,
            text: `${data.subject}\n\n${data.message}`
        }
        return this.sendEmail(template)
    }

    // Admin Daily/Weekly/Monthly Report
    static async sendAdminReport(data: {
        reportType: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY'
        periodLabel: string
        revenue: {
            total: number
            orderCount: number
            averageOrderValue: number
            growth?: number
        }
        stats: {
            newCustomers: number
            topProducts: Array<{ name: string; quantity: number; revenue: number }>
            inventoryStatus: { lowStockItems: number; totalValue: number }
        }
        employeeKPI: Array<{
            name: string
            role: string
            tasksCompleted: number
            shiftsWorked: number
            performanceScore: number
        }>
    }) {
        const adminEmail = process.env.ADMIN_NOTIFICATION_EMAIL
        if (!adminEmail) return false

        const typeLabels: Record<string, string> = {
            DAILY: 'Ngày', WEEKLY: 'Tuần', MONTHLY: 'Tháng', YEARLY: 'Năm'
        }
        const reportTypeLabel = typeLabels[data.reportType] || 'Ngày'

        const template: EmailTemplate = {
            to: adminEmail,
            subject: `📊 Báo Cáo Doanh Thu ${reportTypeLabel} - ${data.periodLabel}`,
            html: getAdminReportHTML(data)
        }
        return this.sendEmail(template)
    }

    // Support Request Notification Email
    static async sendSupportRequestNotification(data: {
        requestId: string
        name: string
        phone: string
        email?: string | null
        message: string
        attachments?: Array<{ fileName: string; fileUrl: string; fileType: string; fileSize: number }> | null
        systemInfo?: {
            browserName?: string
            browserVersion?: string
            osName?: string
            osVersion?: string
            deviceType?: string
            screenRes?: string
        }
        pageUrl?: string
        ipAddress?: string
        priority: string
    }) {
        const employeeEmail = process.env.EMPLOYEE_NOTIFICATION_EMAIL
        const adminEmail = process.env.ADMIN_NOTIFICATION_EMAIL
        const results: boolean[] = []

        if (employeeEmail) {
            const template: EmailTemplate = {
                to: employeeEmail,
                subject: `[Hỗ Trợ] Yêu cầu mới từ ${data.name} - #${data.requestId.slice(-8).toUpperCase()}`,
                html: getSupportRequestHTML(data)
            }
            results.push(await this.sendEmail(template))
        }

        if (adminEmail) {
            const template: EmailTemplate = {
                to: adminEmail,
                subject: `[Hỗ Trợ] Yêu cầu mới từ ${data.name} - #${data.requestId.slice(-8).toUpperCase()}`,
                html: getSupportRequestHTML(data)
            }
            results.push(await this.sendEmail(template))
        }

        return results.some(r => r === true)
    }

    // Supplier: New Purchase Order Notification
    static async sendNewPurchaseOrderToSupplier(data: {
        supplierEmail: string
        supplierName: string
        orderNumber: string
        totalAmount: number
        items: Array<{ name: string; quantity: number; price: number }>
    }) {
        const template: EmailTemplate = {
            to: data.supplierEmail,
            subject: `🛒 Đơn đặt hàng mới từ SmartBuild: ${data.orderNumber}`,
            html: getSupplierPOHTML(data),
            text: `Chào ${data.supplierName}, bạn có đơn đặt hàng mới ${data.orderNumber} từ SmartBuild.`
        }
        return this.sendEmail(template)
    }

    // Admin/Store: Supplier Status Update
    static async sendSupplierStatusUpdate(data: {
        orderNumber: string
        supplierName: string
        status: string
    }) {
        const adminEmail = process.env.ADMIN_NOTIFICATION_EMAIL
        if (!adminEmail) return false

        const statusLabels: Record<string, string> = {
            CONFIRMED: 'Đã xác nhận đơn',
            RECEIVED: 'Đã giao hàng và kho đã nhận',
            CANCELLED: 'Đã hủy đơn'
        }

        const template: EmailTemplate = {
            to: adminEmail,
            subject: `📢 Cập nhật từ nhà cung cấp ${data.supplierName}: ${data.orderNumber}`,
            html: `
        <div style="font-family: Arial, sans-serif; padding: 20px;">
          <h2>Cập nhật trạng thái đơn hàng (PO)</h2>
          <p>Nhà cung cấp <b>${data.supplierName}</b> đã cập nhật trạng thái cho đơn hàng <b>${data.orderNumber}</b>.</p>
          <p>Trạng thái mới: <span style="color: blue; font-weight: bold;">${statusLabels[data.status] || data.status}</span></p>
          <hr />
          <p>Vui lòng kiểm tra hệ thống quản trị để biết thêm chi tiết.</p>
        </div>
      `,
            text: `NCC ${data.supplierName} đã cập nhật ${data.orderNumber} sang ${data.status}`
        }
        return this.sendEmail(template)
    }

    // ============ PRIVATE INFRASTRUCTURE ============

    private static getTransporter() {
        return nodemailer.createTransport({
            host: process.env.SMTP_HOST || 'smtp.gmail.com',
            port: parseInt(process.env.SMTP_PORT || '587'),
            secure: false,
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASSWORD
            }
        })
    }

    private static async sendEmail(template: EmailTemplate): Promise<boolean> {
        try {
            const transporter = this.getTransporter()

            // Redirect test accounts in development
            let recipient = template.to
            const isTestEmail =
                recipient.endsWith('@test.com') ||
                recipient.endsWith('@demo.com') ||
                recipient.endsWith('@example.com') ||
                recipient.includes('admin') ||
                recipient.includes('employee') ||
                recipient.includes('contractor') ||
                recipient.includes('test')

            if (isTestEmail) {
                recipient = 'thanhtai16012004@gmail.com'
                console.log(`[EmailService] Redirecting test email from ${template.to} to ${recipient}`)
            }

            await transporter.sendMail({
                from: `"SmartBuild" <${process.env.SMTP_USER}>`,
                to: recipient,
                subject: template.subject,
                html: template.html,
                text: template.text
            })

            return true
        } catch (error) {
            console.error('❌ Email sending failed:', error)
            return false
        }
    }
}

// ============ INLINE TEMPLATE: Shipping Notification ============
// (small enough to keep here rather than a separate file)
function getShippingNotificationHTML(data: { name: string; orderNumber: string; trackingNumber?: string }): string {
    return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; }
        .content { background: #f9f9f9; padding: 30px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🚚 Đơn Hàng Đang Được Giao!</h1>
        </div>
        <div class="content">
          <p>Xin chào <strong>${data.name}</strong>,</p>
          <p>Đơn hàng <strong>${data.orderNumber}</strong> của bạn đang được giao đến địa chỉ đã đăng ký.</p>
          ${data.trackingNumber ? `<p>Mã vận đơn: <strong>${data.trackingNumber}</strong></p>` : ''}
          <p>Vui lòng chuẩn bị nhận hàng!</p>
        </div>
      </div>
    </body>
    </html>
  `
}

export default EmailService
