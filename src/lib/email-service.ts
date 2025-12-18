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
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <h2>Đặt Lại Mật Khẩu</h2>
          <p>Xin chào ${data.name},</p>
          <p>Bạn đã yêu cầu đặt lại mật khẩu.</p>
          <a href="${data.resetLink}" class="button">Đặt Lại Mật Khẩu</a>
          <p>Link có hiệu lực trong 1 giờ.</p>
          <p>Nếu bạn không yêu cầu, vui lòng bỏ qua email này.</p>
        </div>
      </body>
      </html>
    `
  }
}
