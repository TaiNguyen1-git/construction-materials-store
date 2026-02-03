// Email Service - Using Nodemailer for SMTP

import nodemailer from 'nodemailer'

export interface EmailTemplate {
  to: string
  subject: string
  html: string
  text?: string
}

interface OrderItem {
  name: string
  quantity: number
  price: number
}

interface OrderApprovedData {
  email: string
  name: string
  orderNumber: string
  orderId: string
  totalAmount: number
  depositAmount?: number
  paymentMethod: string
  paymentType: string
  items: OrderItem[]
}

interface NewOrderEmployeeData {
  orderNumber: string
  customerName: string
  customerPhone?: string
  totalAmount: number
  itemCount: number
}

interface StockAlertData {
  productName: string
  sku: string
  currentStock: number
  minStock: number
}

interface AdminReportData {
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
    inventoryStatus: {
      lowStockItems: number
      totalValue: number
    }
  }
  employeeKPI: Array<{
    name: string
    role: string
    tasksCompleted: number
    shiftsWorked: number
    performanceScore: number
  }>
}

interface OrderConfirmationData {
  email: string
  name: string
  orderNumber: string
  totalAmount: number
  items: OrderItem[]
}

interface ShippingNotificationData {
  email: string
  name: string
  orderNumber: string
  trackingNumber?: string
}

interface PasswordResetData {
  email: string
  name: string
  resetLink: string
}

interface OTPData {
  email: string
  name: string
  otpCode: string
  type: 'VERIFICATION' | '2FA' | 'CHANGE_PROFILE'
  expiresInMinutes?: number
}

const BANK_INFO = {
  bankId: '970423', // TPBank
  bankName: 'TPBank',
  accountNumber: '06729594301',
  accountName: 'NGUYEN THANH TAI',
  fullBankName: 'Ngân hàng TMCP Tiên Phong (TPBank)'
}

// Helper function to get base URL - handles Vercel serverless environment
function getBaseUrl(): string {
  const url = (
    process.env.NEXT_PUBLIC_BASE_URL ||
    (process.env.VERCEL_PROJECT_PRODUCTION_URL && `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`) ||
    (process.env.VERCEL_URL && `https://${process.env.VERCEL_URL}`) ||
    'http://localhost:3000'
  ).replace(/\/$/, '')
  return url
}

export class EmailService {
  // Order Confirmation Email (when customer places order)
  static async sendOrderConfirmation(orderData: {
    email: string
    name: string
    orderNumber: string
    totalAmount: number
    items: Array<{
      name: string
      quantity: number
      price: number
    }>
  }) {
    const template: EmailTemplate = {
      to: orderData.email,
      subject: `✅ Xác nhận đơn hàng ${orderData.orderNumber} - SmartBuild`,
      html: this.getOrderConfirmationHTML(orderData),
      text: this.getOrderConfirmationText(orderData)
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
      html: this.getOrderApprovedHTML(data),
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
    if (!employeeEmail) {
      return false
    }

    const template: EmailTemplate = {
      to: employeeEmail,
      subject: `🛒 Đơn hàng mới: ${data.orderNumber}`,
      html: this.getNewOrderForEmployeeHTML(data),
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
    if (!employeeEmail) {
      return false
    }

    const template: EmailTemplate = {
      to: employeeEmail,
      subject: `⚠️ Cảnh báo tồn kho: ${data.productName}`,
      html: this.getStockAlertHTML(data, 'warning'),
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

    if (!adminEmail) {
      return false
    }

    // Removed the 20% check here - it's already checked in the API route
    // This allows the API to control when to send admin emails

    const template: EmailTemplate = {
      to: adminEmail,
      subject: `🚨 KHẨN CẤP: Tồn kho nguy cấp - ${data.productName}`,
      html: this.getStockAlertHTML(data, 'critical'),
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
      html: this.getShippingNotificationHTML(data),
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
      html: this.getPasswordResetHTML(data),
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
      html: this.getOTPHTML(data),
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
      html: this.getOrganizationInvitationHTML(data),
      text: `Xin chào,\n\nBạn được mời tham gia tổ chức ${data.organizationName} bởi ${data.inviterName} với vai trò ${data.role}.\nNhấp vào link sau để hoàn tất đăng ký: ${data.registerLink}`
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

  // Create nodemailer transporter
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

  // Base send email method
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

  // ============ HTML TEMPLATES ============

  // Order Approved with Payment Info HTML
  private static getOrderApprovedHTML(data: OrderApprovedData): string {
    const baseUrl = getBaseUrl()
    const trackingUrl = `${baseUrl}/order-tracking?orderId=${data.orderId}`
    const paymentAmount = data.depositAmount || data.totalAmount
    const qrUrl = `https://img.vietqr.io/image/${BANK_INFO.bankId}-${BANK_INFO.accountNumber}-compact.png?amount=${paymentAmount}&addInfo=${encodeURIComponent('DH ' + data.orderNumber)}&accountName=${encodeURIComponent(BANK_INFO.accountName)}`

    const paymentLabel = data.depositAmount ? 'Số tiền đặt cọc' : 'Số tiền thanh toán'

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="margin: 0; padding: 0; background-color: #f4f7fa; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
        <table role="presentation" style="width: 100%; border-collapse: collapse;">
          <tr>
            <td align="center" style="padding: 40px 0;">
              <table role="presentation" style="width: 600px; border-collapse: collapse; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.1);">
                
                <!-- Header -->
                <tr>
                  <td style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 40px; text-align: center;">
                    <h1 style="color: #ffffff; font-size: 28px; margin: 0;">🎉 Đơn Hàng Đã Được Xác Nhận!</h1>
                    <p style="color: rgba(255,255,255,0.9); font-size: 16px; margin: 10px 0 0 0;">Mã đơn: <strong>${data.orderNumber}</strong></p>
                  </td>
                </tr>

                <!-- Content -->
                <tr>
                  <td style="padding: 40px;">
                    <p style="color: #374151; font-size: 16px; margin: 0 0 20px 0;">
                      Xin chào <strong style="color: #10b981;">${data.name}</strong>,
                    </p>
                    <p style="color: #6b7280; font-size: 15px; margin: 0 0 30px 0;">
                      Đơn hàng của bạn đã được xác nhận! Vui lòng thanh toán để chúng tôi tiến hành xử lý.
                    </p>

                    <!-- Order Items -->
                    <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
                      <tr>
                        <td colspan="2" style="background: #f8fafc; padding: 15px; border-radius: 8px 8px 0 0; font-weight: 600; color: #374151;">
                          📦 Chi tiết đơn hàng
                        </td>
                      </tr>
                      ${data.items.map((item: OrderItem) => `
                      <tr>
                        <td style="padding: 12px 15px; border-bottom: 1px solid #e5e7eb;">${item.name}</td>
                        <td style="padding: 12px 15px; border-bottom: 1px solid #e5e7eb; text-align: right;">${item.quantity} x ${item.price.toLocaleString()}đ</td>
                      </tr>
                      `).join('')}
                      <tr>
                        <td style="padding: 15px; font-weight: 600; font-size: 18px; color: #10b981;">Tổng cộng</td>
                        <td style="padding: 15px; font-weight: 600; font-size: 18px; color: #10b981; text-align: right;">${data.totalAmount.toLocaleString()}đ</td>
                      </tr>
                    </table>

                    ${data.paymentMethod === 'BANK_TRANSFER' ? `
                    <!-- Payment Info Box -->
                    <table style="width: 100%; border-collapse: collapse; background: linear-gradient(135deg, #dbeafe 0%, #ede9fe 100%); border-radius: 12px; margin-bottom: 20px;">
                      <tr>
                        <td style="padding: 25px;">
                          <h3 style="color: #1e40af; margin: 0 0 15px 0; font-size: 18px;">💳 Thông Tin Thanh Toán</h3>
                          
                          <table style="width: 100%;">
                            <tr>
                              <td style="padding: 8px 0; color: #6b7280;">Ngân hàng:</td>
                              <td style="padding: 8px 0; font-weight: 600; color: #1e40af;">${BANK_INFO.bankName}</td>
                            </tr>
                            <tr>
                              <td style="padding: 8px 0; color: #6b7280;">Số tài khoản:</td>
                              <td style="padding: 8px 0; font-weight: 600; color: #1e40af; font-size: 18px;">${BANK_INFO.accountNumber}</td>
                            </tr>
                            <tr>
                              <td style="padding: 8px 0; color: #6b7280;">Chủ tài khoản:</td>
                              <td style="padding: 8px 0; font-weight: 600; color: #1e40af;">${BANK_INFO.accountName}</td>
                            </tr>
                            <tr>
                              <td style="padding: 8px 0; color: #6b7280;">${paymentLabel}:</td>
                              <td style="padding: 8px 0; font-weight: 600; color: #dc2626; font-size: 20px;">${paymentAmount.toLocaleString()}đ</td>
                            </tr>
                            <tr>
                              <td style="padding: 8px 0; color: #6b7280;">Nội dung CK:</td>
                              <td style="padding: 8px 0; font-weight: 600; color: #1e40af;">DH ${data.orderNumber}</td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>

                    <!-- QR Code -->
                    <table style="width: 100%; border-collapse: collapse; text-align: center; margin-bottom: 20px;">
                      <tr>
                        <td style="padding: 20px; background: #ffffff; border: 2px dashed #cbd5e1; border-radius: 12px;">
                          <p style="color: #6b7280; margin: 0 0 15px 0;">Quét mã QR để thanh toán nhanh:</p>
                          <img src="${qrUrl}" alt="QR Code thanh toán" style="max-width: 200px; height: auto; border-radius: 8px;">
                        </td>
                      </tr>
                    </table>
                    ` : `
                    <table style="width: 100%; border-collapse: collapse; background: #fef3c7; border-radius: 12px; margin-bottom: 20px;">
                      <tr>
                        <td style="padding: 20px; text-align: center;">
                          <p style="color: #92400e; margin: 0; font-weight: 600;">
                            💵 Thanh toán khi nhận hàng (COD)
                          </p>
                          <p style="color: #92400e; margin: 10px 0 0 0;">
                            Vui lòng chuẩn bị ${data.totalAmount.toLocaleString()}đ khi nhận hàng
                          </p>
                        </td>
                      </tr>
                    </table>
                    `}

                    <!-- CTA Button -->
                    <table style="width: 100%;">
                      <tr>
                        <td align="center" style="padding: 20px 0;">
                          <a href="${trackingUrl}" style="display: inline-block; background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 50px; font-size: 16px; font-weight: 600;">
                            📍 Theo Dõi Đơn Hàng
                          </a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- Footer -->
                <tr>
                  <td style="background-color: #f8fafc; padding: 30px; text-align: center; border-top: 1px solid #e5e7eb;">
                    <p style="color: #6b7280; font-size: 13px; margin: 0;">
                      Cần hỗ trợ? Liên hệ: <strong>1900-xxxx</strong>
                    </p>
                    <p style="color: #9ca3af; font-size: 12px; margin: 10px 0 0 0;">
                      © 2024 SmartBuild - Vật Liệu Xây Dựng Thông Minh
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `
  }

  // New Order for Employee HTML
  private static getNewOrderForEmployeeHTML(data: NewOrderEmployeeData): string {
    const baseUrl = getBaseUrl()
    return `
      <!DOCTYPE html>
      <html>
      <head><meta charset="utf-8"></head>
      <body style="margin: 0; padding: 20px; background-color: #f4f7fa; font-family: Arial, sans-serif;">
        <table style="max-width: 500px; margin: 0 auto; background: #fff; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
          <tr>
            <td style="background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); padding: 25px; text-align: center;">
              <h2 style="color: #fff; margin: 0;">🛒 Đơn Hàng Mới</h2>
            </td>
          </tr>
          <tr>
            <td style="padding: 25px;">
              <table style="width: 100%;">
                <tr>
                  <td style="padding: 8px 0; color: #6b7280;">Mã đơn:</td>
                  <td style="padding: 8px 0; font-weight: 600; color: #1d4ed8;">${data.orderNumber}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #6b7280;">Khách hàng:</td>
                  <td style="padding: 8px 0; font-weight: 600;">${data.customerName}</td>
                </tr>
                ${data.customerPhone ? `
                <tr>
                  <td style="padding: 8px 0; color: #6b7280;">SĐT:</td>
                  <td style="padding: 8px 0;">${data.customerPhone}</td>
                </tr>
                ` : ''}
                <tr>
                  <td style="padding: 8px 0; color: #6b7280;">Số sản phẩm:</td>
                  <td style="padding: 8px 0;">${data.itemCount} sản phẩm</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #6b7280;">Tổng tiền:</td>
                  <td style="padding: 8px 0; font-weight: 600; color: #dc2626; font-size: 18px;">${data.totalAmount.toLocaleString()}đ</td>
                </tr>
              </table>
              <div style="text-align: center; margin-top: 20px;">
                <a href="${baseUrl}/admin/orders" style="display: inline-block; background: #1d4ed8; color: #fff; padding: 12px 30px; border-radius: 8px; text-decoration: none; font-weight: 600;">
                  Xem Chi Tiết
                </a>
              </div>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `
  }

  // Stock Alert HTML - Enhanced with more details
  private static getStockAlertHTML(data: StockAlertData, level: 'warning' | 'critical'): string {
    const baseUrl = getBaseUrl()
    const bgColor = level === 'critical' ? '#dc2626' : '#f59e0b'
    const emoji = level === 'critical' ? '🚨' : '⚠️'
    const title = level === 'critical' ? 'KHẨN CẤP: Tồn Kho Nguy Cấp' : 'Cảnh Báo Tồn Kho'

    // Calculate percentage and urgency
    const percentage = data.minStock > 0 ? Math.round((data.currentStock / data.minStock) * 100) : 0
    const now = new Date()
    const dateStr = now.toLocaleDateString('vi-VN', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
    const timeStr = now.toLocaleTimeString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit'
    })

    // Determine urgency level and action
    let urgencyBadge = ''
    let urgencyText = ''
    let actionText = ''

    if (data.currentStock <= 0) {
      urgencyBadge = '<span style="background: #dc2626; color: white; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600;">HẾT HÀNG</span>'
      urgencyText = '⛔ Sản phẩm đã HẾT HÀNG hoàn toàn!'
      actionText = 'Cần đặt hàng NGAY LẬP TỨC để tránh mất khách.'
    } else if (percentage <= 20) {
      urgencyBadge = '<span style="background: #dc2626; color: white; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600;">CỰC KỲ THẤP</span>'
      urgencyText = `🔴 Chỉ còn ${percentage}% so với mức tối thiểu!`
      actionText = 'Đề xuất: Liên hệ nhà cung cấp đặt hàng khẩn cấp trong ngày.'
    } else if (percentage <= 50) {
      urgencyBadge = '<span style="background: #f59e0b; color: white; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600;">THẤP</span>'
      urgencyText = `🟡 Còn ${percentage}% so với mức tối thiểu`
      actionText = 'Đề xuất: Lên kế hoạch đặt hàng trong 2-3 ngày tới.'
    } else {
      urgencyBadge = '<span style="background: #3b82f6; color: white; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600;">CẦN CHÚ Ý</span>'
      urgencyText = `🔵 Còn ${percentage}% so với mức tối thiểu`
      actionText = 'Đề xuất: Theo dõi và chuẩn bị đặt hàng khi cần.'
    }

    // Calculate shortage
    const shortage = Math.max(0, data.minStock - data.currentStock)

    return `
      <!DOCTYPE html>
      <html>
      <head><meta charset="utf-8"></head>
      <body style="margin: 0; padding: 20px; background-color: #f4f7fa; font-family: 'Segoe UI', Arial, sans-serif;">
        <table style="max-width: 600px; margin: 0 auto; background: #fff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="background: ${bgColor}; padding: 30px; text-align: center;">
              <h1 style="color: #fff; margin: 0; font-size: 24px;">${emoji} ${title}</h1>
              <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 14px;">
                📅 ${dateStr} lúc ${timeStr}
              </p>
            </td>
          </tr>
          
          <!-- Urgency Badge -->
          <tr>
            <td style="padding: 20px 25px 0 25px; text-align: center;">
              ${urgencyBadge}
            </td>
          </tr>
          
          <!-- Product Info -->
          <tr>
            <td style="padding: 25px;">
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td colspan="2" style="padding: 15px; background: #f8fafc; border-radius: 8px; margin-bottom: 15px;">
                    <div style="font-size: 18px; font-weight: 700; color: #1e293b; margin-bottom: 5px;">
                      📦 ${data.productName}
                    </div>
                    <div style="color: #64748b; font-size: 13px;">SKU: ${data.sku}</div>
                  </td>
                </tr>
              </table>
              
              <!-- Stock Details -->
              <table style="width: 100%; margin-top: 20px; border-collapse: collapse;">
                <tr>
                  <td style="padding: 12px; background: ${data.currentStock <= 0 ? '#fef2f2' : '#fff7ed'}; border-radius: 8px 0 0 8px; text-align: center; border: 1px solid ${data.currentStock <= 0 ? '#fecaca' : '#fed7aa'};">
                    <div style="font-size: 11px; color: #6b7280; text-transform: uppercase; letter-spacing: 1px;">Tồn kho</div>
                    <div style="font-size: 32px; font-weight: 800; color: ${bgColor};">${data.currentStock}</div>
                  </td>
                  <td style="padding: 12px; background: #f0fdf4; text-align: center; border: 1px solid #bbf7d0; border-left: none;">
                    <div style="font-size: 11px; color: #6b7280; text-transform: uppercase; letter-spacing: 1px;">Tối thiểu</div>
                    <div style="font-size: 32px; font-weight: 800; color: #16a34a;">${data.minStock}</div>
                  </td>
                  <td style="padding: 12px; background: #eff6ff; border-radius: 0 8px 8px 0; text-align: center; border: 1px solid #bfdbfe; border-left: none;">
                    <div style="font-size: 11px; color: #6b7280; text-transform: uppercase; letter-spacing: 1px;">Cần thêm</div>
                    <div style="font-size: 32px; font-weight: 800; color: #2563eb;">${shortage}</div>
                  </td>
                </tr>
              </table>
              
              <!-- Progress Bar -->
              <div style="margin-top: 20px;">
                <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
                  <span style="font-size: 13px; color: #6b7280;">Mức tồn kho</span>
                  <span style="font-size: 13px; font-weight: 600; color: ${bgColor};">${percentage}%</span>
                </div>
                <div style="height: 8px; background: #e5e7eb; border-radius: 4px; overflow: hidden;">
                  <div style="height: 100%; width: ${Math.min(percentage, 100)}%; background: ${percentage <= 20 ? '#dc2626' : percentage <= 50 ? '#f59e0b' : '#10b981'}; border-radius: 4px;"></div>
                </div>
              </div>
              
              <!-- Status Message -->
              <div style="margin-top: 20px; padding: 15px; background: ${data.currentStock <= 0 ? '#fef2f2' : '#fffbeb'}; border-radius: 8px; border-left: 4px solid ${bgColor};">
                <div style="font-weight: 600; color: #1e293b; margin-bottom: 5px;">${urgencyText}</div>
                <div style="font-size: 14px; color: #4b5563;">${actionText}</div>
              </div>
              
              <!-- CTA Buttons -->
              <table style="width: 100%; margin-top: 25px;">
                <tr>
                  <td style="text-align: center;">
                    <a href="${baseUrl}/admin/inventory" style="display: inline-block; background: ${bgColor}; color: #fff; padding: 14px 35px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 15px; margin-right: 10px;">
                      📊 Kiểm Tra Kho
                    </a>
                    <a href="${baseUrl}/admin/products" style="display: inline-block; background: #1e293b; color: #fff; padding: 14px 35px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 15px;">
                      📦 Xem Sản Phẩm
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background: #f8fafc; padding: 20px 25px; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0; font-size: 12px; color: #9ca3af;">
                Email tự động từ hệ thống quản lý kho SmartBuild<br>
                Vui lòng không trả lời email này.
              </p>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `
  }

  // Admin Daily/Weekly/Monthly Report
  static async sendAdminReport(data: {
    reportType: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY'
    periodLabel: string
    revenue: {
      total: number
      orderCount: number
      averageOrderValue: number
      growth?: number // percentage growth comparison
    }
    stats: {
      newCustomers: number
      topProducts: Array<{ name: string; quantity: number; revenue: number }>
      inventoryStatus: {
        lowStockItems: number
        totalValue: number
      }
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
    if (!adminEmail) {
      return false
    }

    const typeLabels: Record<string, string> = {
      DAILY: 'Ngày',
      WEEKLY: 'Tuần',
      MONTHLY: 'Tháng',
      YEARLY: 'Năm'
    }

    // Ensure reportType is valid with fallback
    const reportTypeLabel = typeLabels[data.reportType] || typeLabels['DAILY'] || 'Ngày'

    const template: EmailTemplate = {
      to: adminEmail,
      subject: `📊 Báo Cáo Doanh Thu ${reportTypeLabel} - ${data.periodLabel}`,
      html: this.getAdminReportHTML(data)
    }

    return this.sendEmail(template)
  }

  // Admin Report HTML Template
  private static getAdminReportHTML(data: AdminReportData): string {
    const revenueColor = data.revenue.growth && data.revenue.growth >= 0 ? '#10b981' : '#ef4444'
    const growthSymbol = data.revenue.growth && data.revenue.growth >= 0 ? '↗' : '↘'

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          .stat-card { background: #f8fafc; border-radius: 12px; padding: 15px; border-left: 4px solid #3b82f6; }
          .table { width: 100%; border-collapse: collapse; margin-top: 15px; }
          .table th { text-align: left; padding: 12px; background: #f1f5f9; color: #475569; font-size: 13px; }
          .table td { padding: 12px; border-bottom: 1px solid #e2e8f0; color: #1e293b; font-size: 14px; }
          .badge { padding: 4px 8px; border-radius: 4px; font-size: 11px; font-weight: 600; }
        </style>
      </head>
      <body style="margin: 0; padding: 0; background-color: #f4f7fa; font-family: 'Segoe UI', Arial, sans-serif;">
        <table role="presentation" style="width: 100%; border-collapse: collapse;">
          <tr>
            <td align="center" style="padding: 30px 0;">
              <table role="presentation" style="width: 700px; border-collapse: collapse; background: #ffffff; border-radius: 20px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.1);">
                
                <!-- Title Header -->
                <tr>
                  <td style="background: #1e293b; padding: 40px; text-align: center;">
                    <span style="color: #60a5fa; font-size: 14px; font-weight: 700; letter-spacing: 2px;">SMARTBUILD INSIGHTS</span>
                    <h1 style="color: #ffffff; margin: 10px 0 0 0; font-size: 28px;">Báo Cáo ${data.periodLabel}</h1>
                  </td>
                </tr>

                <!-- Summary Section -->
                <tr>
                  <td style="padding: 40px;">
                    <h2 style="color: #334155; font-size: 20px; border-bottom: 2px solid #f1f5f9; padding-bottom: 10px; margin-bottom: 25px;">💰 Tổng Quan Tài Chính</h2>
                    
                    <div style="display: flex; gap: 20px; margin-bottom: 30px;">
                      <div style="flex: 1; background: #eff6ff; border-radius: 16px; padding: 25px; border: 1px solid #bfdbfe;">
                        <p style="color: #3b82f6; margin: 0; font-size: 14px; font-weight: 600;">Tổng Doanh Thu</p>
                        <p style="color: #1e40af; margin: 10px 0; font-size: 32px; font-weight: 800;">${data.revenue.total.toLocaleString()}đ</p>
                        ${data.revenue.growth !== undefined ? `
                        <span style="color: ${revenueColor}; font-weight: 700; font-size: 14px;">
                          ${growthSymbol} ${Math.abs(data.revenue.growth)}% <span style="color: #64748b; font-weight: 400;">so với kỳ trước</span>
                        </span>
                        ` : ''}
                      </div>
                    </div>

                    <table style="width: 100%; margin-bottom: 40px;">
                      <tr>
                        <td style="width: 32%; padding-right: 15px;">
                          <div class="stat-card">
                            <p style="margin: 0; font-size: 12px; color: #64748b;">Số lượng đơn</p>
                            <p style="margin: 5px 0 0 0; font-size: 20px; font-weight: 700;">${data.revenue.orderCount}</p>
                          </div>
                        </td>
                        <td style="width: 32%; padding-right: 15px;">
                          <div class="stat-card" style="border-left-color: #8b5cf6;">
                            <p style="margin: 0; font-size: 12px; color: #64748b;">TB mỗi đơn</p>
                            <p style="margin: 5px 0 0 0; font-size: 20px; font-weight: 700;">${Math.round(data.revenue.averageOrderValue).toLocaleString()}đ</p>
                          </div>
                        </td>
                        <td style="width: 32%;">
                          <div class="stat-card" style="border-left-color: #10b981;">
                            <p style="margin: 0; font-size: 12px; color: #64748b;">Khách mới</p>
                            <p style="margin: 5px 0 0 0; font-size: 20px; font-weight: 700;">+${data.stats.newCustomers}</p>
                          </div>
                        </td>
                      </tr>
                    </table>

                    <!-- Top Products Table -->
                    <h2 style="color: #334155; font-size: 20px; border-bottom: 2px solid #f1f5f9; padding-bottom: 10px; margin-bottom: 15px;">🏆 Top Sản Phẩm Bán Chạy</h2>
                    <table class="table">
                      <thead>
                        <tr>
                          <th>Sản Phẩm</th>
                          <th style="text-align: center;">SL Bán</th>
                          <th style="text-align: right;">Doanh Thu</th>
                        </tr>
                      </thead>
                      <tbody>
                        ${data.stats.topProducts.map(p => `
                        <tr>
                          <td style="font-weight: 600;">${p.name}</td>
                          <td style="text-align: center;">${Math.round(p.quantity)}</td>
                          <td style="text-align: right; color: #10b981; font-weight: 600;">${Math.round(p.revenue).toLocaleString()}đ</td>
                        </tr>
                        `).join('')}
                      </tbody>
                    </table>

                    <div style="margin-top: 40px;"></div>

                    <!-- Employee KPI Section -->
                    <h2 style="color: #334155; font-size: 20px; border-bottom: 2px solid #f1f5f9; padding-bottom: 10px; margin-bottom: 15px;">👥 Hiệu Suất Nhân Viên</h2>
                    <table class="table">
                      <thead>
                        <tr>
                          <th>Nhân Viên</th>
                          <th style="text-align: center;">Công Việc</th>
                          <th style="text-align: center;">Ca Làm</th>
                          <th style="text-align: right;">Điểm HS</th>
                        </tr>
                      </thead>
                      <tbody>
                        ${data.employeeKPI.map(emp => `
                        <tr>
                          <td>
                            <div style="font-weight: 600;">${emp.name}</div>
                            <div style="font-size: 11px; color: #64748b;">${emp.role}</div>
                          </td>
                          <td style="text-align: center;"><span class="badge" style="background: #dcfce7; color: #166534;">${emp.tasksCompleted}</span></td>
                          <td style="text-align: center;"><span class="badge" style="background: #f1f5f9; color: #475569;">${emp.shiftsWorked}</span></td>
                          <td style="text-align: right; font-weight: 700; color: #3b82f6;">${emp.performanceScore}%</td>
                        </tr>
                        `).join('')}
                      </tbody>
                    </table>

                    <!-- Inventory Warning -->
                    <div style="margin-top: 40px; background: #fff7ed; border-radius: 12px; padding: 20px; border: 1px solid #fed7aa;">
                      <table style="width: 100%;">
                        <tr>
                          <td style="vertical-align: top; width: 40px; font-size: 24px;">📦</td>
                          <td>
                            <h4 style="margin: 0; color: #9a3412;">Tình trạng Kho hàng</h4>
                            <p style="margin: 5px 0 0 0; font-size: 14px; color: #c2410c;">
                              Hiện có <strong>${data.stats.inventoryStatus.lowStockItems} mặt hàng</strong> đang ở mức báo động. 
                              Tổng giá trị hàng tồn ước tính: <strong>${data.stats.inventoryStatus.totalValue.toLocaleString()}đ</strong>
                            </p>
                          </td>
                        </tr>
                      </table>
                    </div>

                  </td>
                </tr>

                <!-- Footer -->
                <tr>
                  <td style="background: #f8fafc; padding: 30px; text-align: center; border-top: 1px solid #e2e8f0;">
                    <p style="color: #94a3b8; font-size: 12px; margin: 0;">
                      © 2024 SmartBuild Analytics System. Tất cả quyền được bảo lưu.<br>
                      Email này được gửi tự động từ hệ thống quản trị.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `
  }

  // HTML Templates
  private static getOrderConfirmationHTML(data: OrderConfirmationData): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .order-details { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
          .item { border-bottom: 1px solid #eee; padding: 10px 0; }
          .total { font-size: 24px; font-weight: bold; color: #667eea; margin-top: 20px; }
          .button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎉 Đặt Hàng Thành Công!</h1>
          </div>
          <div class="content">
            <p>Xin chào <strong>${data.name}</strong>,</p>
            <p>Cảm ơn bạn đã đặt hàng tại SmartBuild!</p>
            
            <div class="order-details">
              <h2>Đơn hàng: ${data.orderNumber}</h2>
              ${data.items.map((item: OrderItem) => `
                <div class="item">
                  <strong>${item.name}</strong><br>
                  Số lượng: ${item.quantity} x ${item.price.toLocaleString()}đ
                </div>
              `).join('')}
              
              <div class="total">
                Tổng cộng: ${data.totalAmount.toLocaleString()}đ
              </div>
            </div>
            
            <p>Chúng tôi sẽ xử lý đơn hàng của bạn trong thời gian sớm nhất.</p>
            
            <a href="${process.env.NEXT_PUBLIC_BASE_URL}/account/orders" class="button">
              Xem Đơn Hàng
            </a>
            
            <p style="color: #666; font-size: 14px; margin-top: 30px;">
              Nếu bạn có bất kỳ câu hỏi nào, vui lòng liên hệ với chúng tôi.<br>
              Hotline: 1900-xxxx
            </p>
          </div>
        </div>
      </body>
      </html>
    `
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private static getOrderConfirmationText(data: any): string {
    return `
Xin chào ${data.name},

Cảm ơn bạn đã đặt hàng tại SmartBuild!

Đơn hàng: ${data.orderNumber}

Sản phẩm:
${data.items.map((item: { name: string; quantity: number; price: number }) => `- ${item.name}: ${item.quantity} x ${item.price.toLocaleString()}đ`).join('\n')}

Tổng cộng: ${data.totalAmount.toLocaleString()}đ

Chúng tôi sẽ xử lý đơn hàng của bạn trong thời gian sớm nhất.

Xem chi tiết: ${process.env.NEXT_PUBLIC_BASE_URL}/account/orders

Hotline: 1900-xxxx
    `
  }

  private static getShippingNotificationHTML(data: ShippingNotificationData): string {
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

  private static getPasswordResetHTML(data: PasswordResetData): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Đặt lại mật khẩu - SmartBuild</title>
      </head>
      <body style="margin: 0; padding: 0; background-color: #f4f7fa; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
        <table role="presentation" style="width: 100%; border-collapse: collapse;">
          <tr>
            <td align="center" style="padding: 40px 0;">
              <table role="presentation" style="width: 600px; border-collapse: collapse; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.1);">
                
                <!-- Header with Gradient -->
                <tr>
                  <td style="background: linear-gradient(135deg, #2563eb 0%, #7c3aed 100%); padding: 40px 40px 30px 40px; text-align: center;">
                    <div style="display: inline-block; background: rgba(255,255,255,0.2); padding: 12px 20px; border-radius: 12px; margin-bottom: 20px;">
                      <span style="font-size: 24px; font-weight: bold; color: #ffffff; letter-spacing: 1px;">🏗️ SMARTBUILD</span>
                    </div>
                    <h1 style="color: #ffffff; font-size: 28px; font-weight: 600; margin: 0; text-shadow: 0 2px 4px rgba(0,0,0,0.1);">🔐 Đặt Lại Mật Khẩu</h1>
                  </td>
                </tr>

                <!-- Main Content -->
                <tr>
                  <td style="padding: 40px;">
                    <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                      Xin chào <strong style="color: #2563eb;">${data.name}</strong>,
                    </p>
                    
                    <p style="color: #6b7280; font-size: 15px; line-height: 1.6; margin: 0 0 30px 0;">
                      Chúng tôi nhận được yêu cầu đặt lại mật khẩu cho tài khoản của bạn. Nhấp vào nút bên dưới để tạo mật khẩu mới:
                    </p>

                    <!-- CTA Button -->
                    <table role="presentation" style="width: 100%; border-collapse: collapse;">
                      <tr>
                        <td align="center" style="padding: 10px 0 30px 0;">
                          <a href="${data.resetLink}" style="display: inline-block; background: linear-gradient(135deg, #2563eb 0%, #7c3aed 100%); color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 50px; font-size: 16px; font-weight: 600; box-shadow: 0 4px 14px rgba(37, 99, 235, 0.4); transition: transform 0.2s;">
                            🔑 Đặt Lại Mật Khẩu Ngay
                          </a>
                        </td>
                      </tr>
                    </table>

                    <!-- Info Box -->
                    <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #fef3c7; border-radius: 12px; margin-bottom: 25px;">
                      <tr>
                        <td style="padding: 20px;">
                          <p style="color: #92400e; font-size: 14px; margin: 0; line-height: 1.6;">
                            <strong>⏱️ Lưu ý quan trọng:</strong><br>
                            • Link có hiệu lực trong <strong>1 giờ</strong><br>
                            • Chỉ sử dụng được 1 lần<br>
                            • Nếu bạn không yêu cầu, vui lòng bỏ qua email này
                          </p>
                        </td>
                      </tr>
                    </table>

                    <!-- Alternative Link -->
                    <p style="color: #9ca3af; font-size: 13px; line-height: 1.6; margin: 0; word-break: break-all;">
                      Nếu nút không hoạt động, copy link sau vào trình duyệt:<br>
                      <a href="${data.resetLink}" style="color: #2563eb; text-decoration: underline;">${data.resetLink}</a>
                    </p>
                  </td>
                </tr>

                <!-- Footer -->
                <tr>
                  <td style="background-color: #f8fafc; padding: 30px 40px; border-top: 1px solid #e5e7eb;">
                    <table role="presentation" style="width: 100%; border-collapse: collapse;">
                      <tr>
                        <td style="text-align: center;">
                          <p style="color: #6b7280; font-size: 13px; margin: 0 0 10px 0;">
                            Cần hỗ trợ? Liên hệ với chúng tôi
                          </p>
                          <p style="color: #2563eb; font-size: 14px; font-weight: 600; margin: 0 0 15px 0;">
                            📞 Hotline: 1900-xxxx | ✉️ support@smartbuild.com
                          </p>
                          <p style="color: #9ca3af; font-size: 12px; margin: 0;">
                            © 2024 SmartBuild - Vật Liệu Xây Dựng Thông Minh<br>
                            123 Nguyễn Văn Linh, Biên Hòa, Đồng Nai
                          </p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `
  }

  private static getOTPHTML(data: OTPData): string {
    const titleMap: any = {
      VERIFICATION: 'Xác Minh Tài Khoản',
      '2FA': 'Xác Nhận Đăng Nhập',
      CHANGE_PROFILE: 'Xác Nhận Thay Đổi'
    }

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="margin: 0; padding: 0; background-color: #f4f7fa; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
        <table role="presentation" style="width: 100%; border-collapse: collapse;">
          <tr>
            <td align="center" style="padding: 40px 0;">
              <table role="presentation" style="width: 500px; border-collapse: collapse; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.1);">
                <tr>
                  <td style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 30px; text-align: center;">
                    <h1 style="color: #ffffff; font-size: 24px; margin: 0;">🛡️ ${titleMap[data.type] || 'Xác Thực'}</h1>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 40px; text-align: center;">
                    <p style="color: #374151; font-size: 16px; margin: 0 0 20px 0;">Xin chào <strong>${data.name}</strong>,</p>
                    <p style="color: #6b7280; font-size: 15px; margin: 0 0 30px 0;">Sử dụng mã dưới đây để hoàn tất quá trình xác thực:</p>
                    
                    <div style="background-color: #f3f4f6; border-radius: 12px; padding: 20px; margin-bottom: 30px; text-align: center;">
                      <span style="font-size: 36px; font-weight: 800; color: #059669; letter-spacing: 12px; margin-left: 12px; display: block;">${data.otpCode}</span>
                    </div>

                    <p style="color: #9ca3af; font-size: 14px; margin: 0;">Mã có hiệu lực trong <strong>${data.expiresInMinutes || 10} phút</strong>.</p>
                    <p style="color: #ef4444; font-size: 12px; margin-top: 20px;">* Vui lòng không chia sẻ mã này với bất kỳ ai.</p>
                  </td>
                </tr>
                <tr>
                  <td style="background-color: #f8fafc; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb;">
                    <p style="color: #9ca3af; font-size: 12px; margin: 0;">© 2024 SmartBuild - Vật Liệu Xây Dựng Thông Minh</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `
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

    // Send to employee
    if (employeeEmail) {
      const template: EmailTemplate = {
        to: employeeEmail,
        subject: `[Hỗ Trợ] Yêu cầu mới từ ${data.name} - #${data.requestId.slice(-8).toUpperCase()}`,
        html: this.getSupportRequestHTML(data)
      }
      results.push(await this.sendEmail(template))
    } else {
    }

    // Send to admin
    if (adminEmail) {
      const template: EmailTemplate = {
        to: adminEmail,
        subject: `[Hỗ Trợ] Yêu cầu mới từ ${data.name} - #${data.requestId.slice(-8).toUpperCase()}`,
        html: this.getSupportRequestHTML(data)
      }
      results.push(await this.sendEmail(template))
    } else {
    }

    return results.some(r => r === true) // Return true if at least one email was sent
  }

  // Support Request HTML Template
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private static getSupportRequestHTML(data: any): string {
    const baseUrl = getBaseUrl()
    const ticketId = `#SP-${data.requestId.slice(-8).toUpperCase()}`
    const now = new Date()
    const timestamp = now.toLocaleString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })

    const priorityColors: Record<string, { bg: string; text: string; label: string }> = {
      LOW: { bg: '#dcfce7', text: '#166534', label: 'Thấp' },
      MEDIUM: { bg: '#fef3c7', text: '#92400e', label: 'Trung bình' },
      HIGH: { bg: '#fee2e2', text: '#991b1b', label: 'Cao' },
      URGENT: { bg: '#dc2626', text: '#ffffff', label: 'Khẩn cấp' }
    }
    const priority = priorityColors[data.priority] || priorityColors.MEDIUM

    // Compact Attachments HTML
    let attachmentsHTML = ''
    if (data.attachments && data.attachments.length > 0) {
      attachmentsHTML = `
        <tr>
          <td style="padding: 0 20px 15px 20px;">
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                ${data.attachments.map((file: { fileType: string; fileUrl: string; fileName: string }) => `
                  <td style="padding: 8px; background: #f8fafc; border: 1px solid #e5e7eb; border-radius: 6px; display: inline-block; margin: 0 8px 8px 0; min-width: 140px;">
                    <table style="width: 100%;">
                      <tr>
                        <td style="width: 24px; vertical-align: middle;">
                          ${file.fileType?.startsWith('image')
          ? `<img src="${file.fileUrl}" style="width: 24px; height: 24px; object-fit: cover; border-radius: 4px;" />`
          : `<div style="width: 24px; height: 24px; background: #e0e7ff; border-radius: 4px; display: flex; align-items: center; justify-content: center; font-size: 8px; color: #4338ca; font-weight: 800;">FILE</div>`
        }
                        </td>
                        <td style="padding-left: 8px; vertical-align: middle;">
                          <a href="${file.fileUrl}" target="_blank" style="color: #1e40af; font-size: 11px; font-weight: 700; text-decoration: none; display: block; border-bottom: 1px dotted #bfdbfe;">
                            ${file.fileName.length > 15 ? file.fileName.slice(0, 12) + '...' : file.fileName}
                          </a>
                        </td>
                      </tr>
                    </table>
                  </td>
                `).join('')}
              </tr>
            </table>
          </td>
        </tr>
      `
    }

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="margin: 0; padding: 0; background-color: #f3f4f6; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
        <table role="presentation" style="width: 100%; border-collapse: collapse;">
          <tr>
            <td align="center" style="padding: 20px 10px;">
              <table role="presentation" style="width: 580px; max-width: 100%; border-collapse: collapse; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.05);">
                
                <!-- Header: Compact -->
                <tr>
                  <td style="background: #1e293b; padding: 15px 25px;">
                    <table style="width: 100%; border-collapse: collapse;">
                      <tr>
                        <td>
                          <h1 style="color: #ffffff; font-size: 16px; margin: 0; font-weight: 800; letter-spacing: -0.02em;">
                            YÊU CẦU HỖ TRỢ <span style="color: #60a5fa; margin-left: 8px;">${ticketId}</span>
                          </h1>
                        </td>
                        <td align="right">
                          <span style="background: ${priority.bg}; color: ${priority.text}; padding: 3px 10px; border-radius: 4px; font-size: 10px; font-weight: 800; text-transform: uppercase;">
                            ${priority.label}
                          </span>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- Customer Details: 2-Column Mesh -->
                <tr>
                  <td style="padding: 15px 20px 10px 20px;">
                    <table style="width: 100%; border-collapse: collapse; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px;">
                      <tr>
                        <td style="width: 50%; padding: 10px 15px; border-right: 1px solid #e2e8f0; border-bottom: 1px solid #e2e8f0;">
                          <div style="color: #64748b; font-size: 10px; font-weight: 700; text-transform: uppercase; margin-bottom: 2px;">Khách hàng</div>
                          <div style="color: #0f172a; font-size: 14px; font-weight: 700;">${data.name}</div>
                        </td>
                        <td style="width: 50%; padding: 10px 15px; border-bottom: 1px solid #e2e8f0;">
                          <div style="color: #64748b; font-size: 10px; font-weight: 700; text-transform: uppercase; margin-bottom: 2px;">Điện thoại</div>
                          <div style="color: #2563eb; font-size: 14px; font-weight: 700;">${data.phone}</div>
                        </td>
                      </tr>
                      <tr>
                        <td style="width: 50%; padding: 10px 15px; border-right: 1px solid #e2e8f0;">
                          <div style="color: #64748b; font-size: 10px; font-weight: 700; text-transform: uppercase; margin-bottom: 2px;">Email</div>
                          <div style="color: #334155; font-size: 13px; font-weight: 600;">${data.email || '—'}</div>
                        </td>
                        <td style="width: 50%; padding: 10px 15px;">
                          <div style="color: #64748b; font-size: 10px; font-weight: 700; text-transform: uppercase; margin-bottom: 2px;">Thời gian</div>
                          <div style="color: #334155; font-size: 12px; font-weight: 600;">${timestamp}</div>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- Message Content: Clean & Direct -->
                <tr>
                  <td style="padding: 5px 20px 15px 20px;">
                    <div style="background: #ffffff; border: 1px solid #e2e8f0; border-left: 4px solid #3b82f6; border-radius: 6px; padding: 10px 15px;">
                      <div style="color: #3b82f6; font-size: 9px; font-weight: 800; text-transform: uppercase; margin-bottom: 4px; display: block;">Nội dung chi tiết:</div>
                      <p style="color: #1e293b; font-size: 13px; line-height: 1.5; margin: 0; white-space: pre-wrap; font-weight: 500;">${data.message.trim()}</p>
                    </div>
                  </td>
                </tr>

                <!-- Compact Attachments -->
                ${attachmentsHTML}

                <!-- Tech/System Info: Ultra Dense -->
                ${data.systemInfo ? `
                <tr>
                  <td style="padding: 0 20px 20px 20px;">
                    <table style="width: 100%; border-collapse: collapse; background: #1e293b; border-radius: 6px; color: #94a3b8;">
                      <tr>
                        <td style="padding: 8px 12px; border-right: 1px solid #334155; text-align: center;">
                          <span style="font-size: 8px; text-transform: uppercase; display: block; opacity: 0.7;">IP</span>
                          <span style="color: #e2e8f0; font-size: 11px; font-weight: 700;">${data.ipAddress || '—'}</span>
                        </td>
                        <td style="padding: 8px 12px; border-right: 1px solid #334155; text-align: center;">
                          <span style="font-size: 8px; text-transform: uppercase; display: block; opacity: 0.7;">Thiết bị</span>
                          <span style="color: #e2e8f0; font-size: 11px; font-weight: 700;">${data.systemInfo.deviceType}</span>
                        </td>
                        <td style="padding: 8px 12px; border-right: 1px solid #334155; text-align: center;">
                          <span style="font-size: 8px; text-transform: uppercase; display: block; opacity: 0.7;">OS</span>
                          <span style="color: #e2e8f0; font-size: 11px; font-weight: 700;">${data.systemInfo.osName}</span>
                        </td>
                        <td style="padding: 8px 12px; text-align: center;">
                          <span style="font-size: 8px; text-transform: uppercase; display: block; opacity: 0.7;">Browser</span>
                          <span style="color: #e2e8f0; font-size: 11px; font-weight: 700;">${data.systemInfo.browserName}</span>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                ` : ''}

                <!-- Footer CTA -->
                <tr>
                  <td style="background: #f1f5f9; padding: 12px 25px; text-align: center;">
                    <table style="width: 100%;">
                      <tr>
                        <td align="left">
                           <span style="color: #64748b; font-size: 10px; font-weight: 600;">SmartBuild Support System</span>
                        </td>
                        <td align="right">
                          <a href="${baseUrl}/admin/support" style="background: #3b82f6; color: #ffffff; text-decoration: none; padding: 6px 15px; border-radius: 4px; font-size: 11px; font-weight: 700; display: inline-block;">
                            XỬ LÝ NGAY
                          </a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `
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
      html: this.getSupplierPOHTML(data),
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

  private static getSupplierPOHTML(data: any): string {
    const baseUrl = getBaseUrl()
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
        <div style="background: #1e3a8a; color: white; padding: 20px; text-align: center;">
          <h1>Đơn Đặt Hàng Mới</h1>
          <p>Mã đơn: ${data.orderNumber}</p>
        </div>
        <div style="padding: 20px;">
          <p>Chào ${data.supplierName},</p>
          <p>SmartBuild đã tạo một đơn đặt hàng mới dành cho bạn. Chi tiết như sau:</p>
          <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
            <thead>
              <tr style="background: #f8fafc;">
                <th style="padding: 10px; border: 1px solid #e2e8f0; text-align: left;">Sản phẩm</th>
                <th style="padding: 10px; border: 1px solid #e2e8f0; text-align: center;">SL</th>
                <th style="padding: 10px; border: 1px solid #e2e8f0; text-align: right;">Đơn giá</th>
              </tr>
            </thead>
            <tbody>
              ${data.items.map((item: any) => `
                <tr>
                  <td style="padding: 10px; border: 1px solid #e2e8f0;">${item.name}</td>
                  <td style="padding: 10px; border: 1px solid #e2e8f0; text-align: center;">${item.quantity}</td>
                  <td style="padding: 10px; border: 1px solid #e2e8f0; text-align: right;">${item.price.toLocaleString()}đ</td>
                </tr>
              `).join('')}
            </tbody>
            <tfoot>
              <tr>
                <td colspan="2" style="padding: 10px; font-weight: bold; text-align: right;">Tổng cộng:</td>
                <td style="padding: 10px; font-weight: bold; text-align: right; color: #dc2626;">${data.totalAmount.toLocaleString()}đ</td>
              </tr>
            </tfoot>
          </table>
          <div style="text-align: center; margin-top: 30px;">
            <p>Vui lòng đăng nhập vào Portal NCC để xác nhận đơn hàng này.</p>
            <a href="${baseUrl}/supplier" style="display: inline-block; background: #1e3a8a; color: white; padding: 12px 25px; border-radius: 6px; text-decoration: none; font-weight: bold;">Đến Cổng NCC</a>
          </div>
        </div>
      </div>
    `
  }

  private static getOrganizationInvitationHTML(data: any): string {
    const roleLabel = data.role === 'ADMIN' ? 'Quản trị viên' : data.role === 'OWNER' ? 'Chủ sở hữu' : 'Người mua hàng (Buyer)';

    return `
      <!DOCTYPE html>
      <html>
      <head><meta charset="utf-8"></head>
      <body style="margin: 0; padding: 20px; background-color: #f4f7fa; font-family: 'Segoe UI', Arial, sans-serif;">
        <table style="max-width: 600px; margin: 0 auto; background: #fff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.1);">
          <tr>
            <td style="background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); padding: 40px; text-align: center;">
              <h1 style="color: #fff; margin: 0; font-size: 24px;">🏢 Lời Mời Tham Gia Tổ Chức</h1>
            </td>
          </tr>
          <tr>
            <td style="padding: 40px;">
              <p style="font-size: 16px; color: #1e293b; margin-bottom: 20px;">Xin chào,</p>
              <p style="font-size: 15px; color: #4b5563; line-height: 1.6;">
                Bạn đã được mời tham gia tổ chức <strong>${data.organizationName}</strong> trên hệ thống <strong>SmartBuild</strong> bởi thành viên <strong>${data.inviterName}</strong>.
              </p>
              
              <div style="background: #f8fafc; padding: 20px; border-radius: 12px; margin: 25px 0;">
                <table style="width: 100%;">
                  <tr>
                    <td style="color: #64748b; font-size: 14px; padding-bottom: 5px;">Vai trò của bạn:</td>
                    <td style="color: #1d4ed8; font-weight: 700; text-align: right;">${roleLabel}</td>
                  </tr>
                  <tr>
                    <td style="color: #64748b; font-size: 14px;">Tổ chức:</td>
                    <td style="color: #1e293b; font-weight: 600; text-align: right;">${data.organizationName}</td>
                  </tr>
                </table>
              </div>
              
              <p style="font-size: 15px; color: #4b5563; line-height: 1.6;">
                Vui lòng nhấn vào nút bên dưới để hoàn tất việc đăng ký tài khoản và gia nhập đội ngũ.
              </p>
              
              <div style="text-align: center; margin-top: 35px;">
                <a href="${data.registerLink}" style="display: inline-block; background: #2563eb; color: #fff; padding: 16px 45px; border-radius: 50px; text-decoration: none; font-weight: 700; font-size: 16px; box-shadow: 0 4px 12px rgba(37, 99, 235, 0.2);">
                  Chấp Nhận Lời Mời & Đăng Ký
                </a>
              </div>
              
              <p style="font-size: 13px; color: #94a3b8; margin-top: 35px; border-top: 1px solid #f1f5f9; padding-top: 20px;">
                * Link này có hiệu lực trong vòng 7 ngày. Nếu bạn không thực hiện đăng ký, lời mời sẽ bị hủy bỏ.
              </p>
            </td>
          </tr>
          <tr>
            <td style="background: #f8fafc; padding: 20px; text-align: center; color: #94a3b8; font-size: 12px;">
              SmartBuild - Hệ thống quản lý vật liệu xây dựng thông minh
            </td>
          </tr>
        </table>
      </body>
      </html>
    `
  }
}
