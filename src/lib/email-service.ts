// Email Service - Using Nodemailer for SMTP

import nodemailer from 'nodemailer'

export interface EmailTemplate {
  to: string
  subject: string
  html: string
  text?: string
}

export class EmailService {
  // Order Confirmation Email
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
      subject: `Xác nhận đơn hàng ${orderData.orderNumber}`,
      html: this.getOrderConfirmationHTML(orderData),
      text: this.getOrderConfirmationText(orderData)
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
      subject: `Đơn hàng ${data.orderNumber} đang được giao`,
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

      await transporter.sendMail({
        from: `"SmartBuild" <${process.env.SMTP_USER}>`,
        to: template.to,
        subject: template.subject,
        html: template.html,
        text: template.text
      })

      console.log('✅ Email sent successfully to:', template.to)
      return true
    } catch (error) {
      console.error('❌ Email sending failed:', error)
      return false
    }
  }

  // HTML Templates
  private static getOrderConfirmationHTML(data: any): string {
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
              ${data.items.map((item: any) => `
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

  private static getOrderConfirmationText(data: any): string {
    return `
Xin chào ${data.name},

Cảm ơn bạn đã đặt hàng tại SmartBuild!

Đơn hàng: ${data.orderNumber}

Sản phẩm:
${data.items.map((item: any) => `- ${item.name}: ${item.quantity} x ${item.price.toLocaleString()}đ`).join('\n')}

Tổng cộng: ${data.totalAmount.toLocaleString()}đ

Chúng tôi sẽ xử lý đơn hàng của bạn trong thời gian sớm nhất.

Xem chi tiết: ${process.env.NEXT_PUBLIC_BASE_URL}/account/orders

Hotline: 1900-xxxx
    `
  }

  private static getShippingNotificationHTML(data: any): string {
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

  private static getPasswordResetHTML(data: any): string {
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
}
