/**
 * Auto Reorder Alert Service
 * Automatically emails suppliers when stock is low
 */

import { prisma } from './prisma'
import { EmailService } from './email-service'

export interface ReorderAlert {
    productId: string
    productName: string
    productSku: string
    currentStock: number
    minStock: number
    suggestedQuantity: number
    supplierId: string
    supplierName: string
    supplierEmail: string | null
    priority: 'URGENT' | 'HIGH' | 'NORMAL'
}

export class ReorderAlertService {
    /**
     * Check all products for low stock and generate alerts
     */
    static async checkAndAlert(): Promise<{
        alerts: ReorderAlert[]
        emailsSent: number
        errors: string[]
    }> {
        const alerts: ReorderAlert[] = []
        const errors: string[] = []
        let emailsSent = 0

        try {
            // Get all products with inventory and supplier info
            const products = await prisma.product.findMany({
                where: { isActive: true },
                include: {
                    inventoryItem: true,
                    category: true
                }
            })

            // Get all suppliers
            const suppliers = await prisma.supplier.findMany({
                where: { isActive: true }
            })

            const supplierMap = new Map(suppliers.map(s => [s.id, s]))

            for (const product of products) {
                const inventory = product.inventoryItem
                if (!inventory) continue

                const currentStock = inventory.availableQuantity || 0
                const minStock = inventory.minStockLevel || 30
                const maxStock = inventory.maxStockLevel || 500

                // Check if stock is low
                if (currentStock <= minStock) {
                    const suggestedQuantity = maxStock - currentStock

                    // Find appropriate supplier (random for now, could be smarter)
                    const supplier = suppliers[Math.floor(Math.random() * suppliers.length)]
                    if (!supplier) continue

                    // Determine priority
                    let priority: 'URGENT' | 'HIGH' | 'NORMAL' = 'NORMAL'
                    if (currentStock === 0) priority = 'URGENT'
                    else if (currentStock <= minStock * 0.3) priority = 'URGENT'
                    else if (currentStock <= minStock * 0.6) priority = 'HIGH'

                    const alert: ReorderAlert = {
                        productId: product.id,
                        productName: product.name,
                        productSku: product.sku,
                        currentStock,
                        minStock,
                        suggestedQuantity,
                        supplierId: supplier.id,
                        supplierName: supplier.name,
                        supplierEmail: supplier.email,
                        priority
                    }

                    alerts.push(alert)
                }
            }

            // Group alerts by supplier and send emails
            const alertsBySupplier = new Map<string, ReorderAlert[]>()
            for (const alert of alerts) {
                const existing = alertsBySupplier.get(alert.supplierId) || []
                existing.push(alert)
                alertsBySupplier.set(alert.supplierId, existing)
            }

            // Send email to each supplier
            for (const [supplierId, supplierAlerts] of alertsBySupplier) {
                const supplier = supplierMap.get(supplierId)
                if (!supplier?.email) {
                    errors.push(`Supplier ${supplier?.name || supplierId} has no email`)
                    continue
                }

                try {
                    const sent = await this.sendReorderEmail(supplier, supplierAlerts)
                    if (sent) emailsSent++
                } catch (e: any) {
                    errors.push(`Failed to email ${supplier.name}: ${e.message}`)
                }
            }

            // Log the check
            await prisma.notification.create({
                data: {
                    type: 'STOCK_ALERT',
                    title: 'Kiểm tra tồn kho tự động',
                    message: `Phát hiện ${alerts.length} sản phẩm sắp hết. Đã gửi ${emailsSent} email cho NCC.`,
                    priority: alerts.some(a => a.priority === 'URGENT') ? 'HIGH' : 'MEDIUM',
                    read: false,
                    userId: null // System notification
                }
            })

            return { alerts, emailsSent, errors }
        } catch (error: any) {
            console.error('Reorder alert check failed:', error)
            errors.push(error.message)
            return { alerts, emailsSent, errors }
        }
    }

    /**
     * Send reorder email to supplier
     */
    private static async sendReorderEmail(
        supplier: any,
        alerts: ReorderAlert[]
    ): Promise<boolean> {
        const urgentCount = alerts.filter(a => a.priority === 'URGENT').length
        const subject = urgentCount > 0
            ? `🚨 [KHẨN CẤP] Yêu cầu bổ sung ${alerts.length} sản phẩm`
            : `📦 Yêu cầu bổ sung ${alerts.length} sản phẩm`

        const productList = alerts.map(a => {
            const priorityIcon = a.priority === 'URGENT' ? '🔴' : a.priority === 'HIGH' ? '🟡' : '🟢'
            return `
        <tr>
          <td style="padding: 8px; border: 1px solid #ddd;">${priorityIcon} ${a.productName}</td>
          <td style="padding: 8px; border: 1px solid #ddd; text-align: center;">${a.productSku}</td>
          <td style="padding: 8px; border: 1px solid #ddd; text-align: right;">${a.currentStock}</td>
          <td style="padding: 8px; border: 1px solid #ddd; text-align: right; color: #3b82f6; font-weight: bold;">${a.suggestedQuantity}</td>
        </tr>
      `
        }).join('')

        const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #3b82f6; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; }
          table { width: 100%; border-collapse: collapse; margin: 20px 0; }
          th { background: #f3f4f6; padding: 10px; text-align: left; border: 1px solid #ddd; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Yêu Cầu Bổ Sung Hàng</h1>
          </div>
          <div class="content">
            <p>Kính gửi <strong>${supplier.name}</strong>,</p>
            <p>Chúng tôi cần bổ sung các sản phẩm sau:</p>
            
            <table>
              <thead>
                <tr>
                  <th>Sản phẩm</th>
                  <th>Mã SKU</th>
                  <th>Tồn kho</th>
                  <th>SL cần</th>
                </tr>
              </thead>
              <tbody>
                ${productList}
              </tbody>
            </table>
            
            <p><strong>Vui lòng liên hệ để xác nhận đơn hàng.</strong></p>
            
            <p>Trân trọng,<br/>Cửa Hàng VLXD</p>
          </div>
          <div class="footer">
            Email tự động từ hệ thống quản lý kho
          </div>
        </div>
      </body>
      </html>
    `

        // Use EmailService to send
        return await EmailService['sendEmail']({
            to: supplier.email,
            subject,
            html,
            text: `Yêu cầu bổ sung ${alerts.length} sản phẩm. Vui lòng kiểm tra email HTML hoặc liên hệ cửa hàng.`
        })
    }

    /**
     * Get current low stock products without sending emails
     */
    static async getLowStockProducts(): Promise<ReorderAlert[]> {
        const products = await prisma.product.findMany({
            where: { isActive: true },
            include: { inventoryItem: true }
        })

        const suppliers = await prisma.supplier.findMany({
            where: { isActive: true }
        })

        const alerts: ReorderAlert[] = []

        for (const product of products) {
            const inventory = product.inventoryItem
            if (!inventory) continue

            const currentStock = inventory.availableQuantity || 0
            const minStock = inventory.minStockLevel || 30

            if (currentStock <= minStock) {
                const supplier = suppliers[0] // Default supplier
                let priority: 'URGENT' | 'HIGH' | 'NORMAL' = 'NORMAL'
                if (currentStock === 0) priority = 'URGENT'
                else if (currentStock <= minStock * 0.5) priority = 'HIGH'

                alerts.push({
                    productId: product.id,
                    productName: product.name,
                    productSku: product.sku,
                    currentStock,
                    minStock,
                    suggestedQuantity: (inventory.maxStockLevel || 500) - currentStock,
                    supplierId: supplier?.id || '',
                    supplierName: supplier?.name || 'N/A',
                    supplierEmail: supplier?.email || null,
                    priority
                })
            }
        }

        return alerts.sort((a, b) => {
            const priorityOrder = { URGENT: 0, HIGH: 1, NORMAL: 2 }
            return priorityOrder[a.priority] - priorityOrder[b.priority]
        })
    }
}

export default ReorderAlertService
