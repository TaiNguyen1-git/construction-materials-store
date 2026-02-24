// Order Email HTML Templates

import { OrderApprovedData, OrderConfirmationData, NewOrderEmployeeData, OrderItem, BANK_INFO, getBaseUrl } from '../email-types'

/** Generates the HTML for an approved order email with payment details */
export function getOrderApprovedHTML(data: OrderApprovedData): string {
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

/** Generates the HTML for a new order notification sent to store employees */
export function getNewOrderForEmployeeHTML(data: NewOrderEmployeeData): string {
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

/** Generates the HTML for a customer order confirmation email */
export function getOrderConfirmationHTML(data: OrderConfirmationData): string {
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
export function getOrderConfirmationText(data: any): string {
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
