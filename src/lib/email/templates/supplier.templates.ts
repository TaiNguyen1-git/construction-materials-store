// Supplier & Loyalty Email Templates

import { getBaseUrl } from '../email-types'

/** Generates the HTML for a supplier purchase order email */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function getSupplierPOHTML(data: any): string {
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
            ${data.items.map((item: { name: string; quantity: number; price: number }) => `
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

/** Generates the HTML for a support request notification email */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function getSupportRequestHTML(data: any): string {
    const baseUrl = getBaseUrl()
    const ticketId = `#SP-${data.requestId.slice(-8).toUpperCase()}`
    const now = new Date()
    const timestamp = now.toLocaleString('vi-VN', {
        day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'
    })

    const priorityColors: Record<string, { bg: string; text: string; label: string }> = {
        LOW: { bg: '#dcfce7', text: '#166534', label: 'Thấp' },
        MEDIUM: { bg: '#fef3c7', text: '#92400e', label: 'Trung bình' },
        HIGH: { bg: '#fee2e2', text: '#991b1b', label: 'Cao' },
        URGENT: { bg: '#dc2626', text: '#ffffff', label: 'Khẩn cấp' }
    }
    const priority = priorityColors[data.priority] || priorityColors.MEDIUM

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

              <!-- Customer Details -->
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

              <!-- Message Content -->
              <tr>
                <td style="padding: 5px 20px 15px 20px;">
                  <div style="background: #ffffff; border: 1px solid #e2e8f0; border-left: 4px solid #3b82f6; border-radius: 6px; padding: 10px 15px;">
                    <div style="color: #3b82f6; font-size: 9px; font-weight: 800; text-transform: uppercase; margin-bottom: 4px; display: block;">Nội dung chi tiết:</div>
                    <p style="color: #1e293b; font-size: 13px; line-height: 1.5; margin: 0; white-space: pre-wrap; font-weight: 500;">${data.message.trim()}</p>
                  </div>
                </td>
              </tr>

              ${attachmentsHTML}

              <!-- Tech/System Info -->
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
                        <a href="${baseUrl}/admin/tickets" style="background: #3b82f6; color: #ffffff; text-decoration: none; padding: 6px 15px; border-radius: 4px; font-size: 11px; font-weight: 700; display: inline-block;">
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

/** Generates the HTML for a loyalty gift email */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function getLoyaltyGiftHTML(data: any): string {
    const baseUrl = getBaseUrl()
    const icon = data.giftType === 'POINTS' ? '⭐' : data.giftType === 'VOUCHER' ? '🎫' : '🛠️'
    const color = data.giftType === 'POINTS' ? '#f59e0b' : data.giftType === 'VOUCHER' ? '#3b82f6' : '#10b981'

    return `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"></head>
    <body style="margin: 0; padding: 20px; background-color: #f4f7fa; font-family: 'Segoe UI', Arial, sans-serif;">
      <table style="max-width: 600px; margin: 0 auto; background: #fff; border-radius: 24px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.1);">
        <tr>
          <td style="background: linear-gradient(135deg, ${color} 0%, #1e293b 100%); padding: 50px 40px; text-align: center;">
            <div style="font-size: 60px; margin-bottom: 20px;">${icon}</div>
            <h1 style="color: #fff; margin: 0; font-size: 28px; letter-spacing: -0.5px;">Quà Tặng Tri Ân</h1>
            <p style="color: rgba(255,255,255,0.8); margin-top: 10px; font-size: 16px;">Dành riêng cho khách hàng thân thiết</p>
          </td>
        </tr>
        <tr>
          <td style="padding: 40px;">
            <p style="font-size: 18px; color: #1e293b; margin-bottom: 15px;">Chào <strong>${data.name}</strong>,</p>
            <p style="font-size: 16px; color: #4b5563; line-height: 1.8; margin-bottom: 30px; font-style: italic;">
              "${data.message}"
            </p>

            <div style="background: #f8fafc; border: 2px dashed ${color}44; padding: 30px; border-radius: 20px; text-align: center; margin: 30px 0;">
              <p style="color: #64748b; font-size: 14px; text-transform: uppercase; letter-spacing: 2px; margin-bottom: 10px;">Bạn nhận được</p>
              <h2 style="color: ${color}; font-size: 36px; margin: 0; font-weight: 900;">${data.giftValue}</h2>
            </div>

            <p style="font-size: 14px; color: #94a3b8; text-align: center;">
              Quà tặng đã được kích hoạt trực tiếp trong tài khoản của bạn.<br>
              Cảm ơn bạn đã luôn tin tưởng và đồng hành cùng SmartBuild!
            </p>

            <div style="text-align: center; margin-top: 40px;">
              <a href="${baseUrl}" style="display: inline-block; background: #1e293b; color: #fff; padding: 16px 40px; border-radius: 50px; text-decoration: none; font-weight: 700; font-size: 16px;">
                Đến Cửa Hàng Ngay
              </a>
            </div>
          </td>
        </tr>
        <tr>
          <td style="background: #f8fafc; padding: 30px; text-align: center; color: #94a3b8; font-size: 12px; border-top: 1px solid #f1f5f9;">
            SmartBuild - Hệ thống quản lý vật liệu xây dựng thông minh<br>
            © 2024 SmartBuild. All rights reserved.
          </td>
        </tr>
      </table>
    </body>
    </html>
  `
}
