// Stock Alert & Admin Report Email Templates

import { StockAlertData, AdminReportData, getBaseUrl } from '../email-types'

/** Generates an HTML stock alert email for a given urgency level */
export function getStockAlertHTML(data: StockAlertData, level: 'warning' | 'critical'): string {
    const baseUrl = getBaseUrl()
    const bgColor = level === 'critical' ? '#dc2626' : '#f59e0b'
    const emoji = level === 'critical' ? '🚨' : '⚠️'
    const title = level === 'critical' ? 'KHẨN CẤP: Tồn Kho Nguy Cấp' : 'Cảnh Báo Tồn Kho'

    const percentage = data.minStock > 0 ? Math.round((data.currentStock / data.minStock) * 100) : 0
    const now = new Date()
    const dateStr = now.toLocaleDateString('vi-VN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
    const timeStr = now.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })

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

/** Generates the HTML for a periodic admin report email */
export function getAdminReportHTML(data: AdminReportData): string {
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
