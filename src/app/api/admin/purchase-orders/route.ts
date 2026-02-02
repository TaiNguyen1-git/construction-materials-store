import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyTokenFromRequest } from '@/lib/auth-middleware-api'
import nodemailer from 'nodemailer'
// Generate unique order number
function generateOrderNumber() {
    const date = new Date()
    const prefix = 'PO'
    const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '')
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0')
    return `${prefix}${dateStr}${random}`
}

// GET /api/admin/purchase-orders - List all purchase orders
export async function GET(request: NextRequest) {
    try {
        const user = verifyTokenFromRequest(request)
        if (!user || !['ADMIN', 'MANAGER', 'EMPLOYEE'].includes(user.role)) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { searchParams } = new URL(request.url)
        const status = searchParams.get('status')
        const supplierId = searchParams.get('supplierId')
        const page = parseInt(searchParams.get('page') || '1')
        const limit = parseInt(searchParams.get('limit') || '20')

        const where: any = {}
        if (status) where.status = status
        if (supplierId) where.supplierId = supplierId

        const [orders, total] = await Promise.all([
            prisma.purchaseOrder.findMany({
                where,
                include: {
                    supplier: {
                        select: { id: true, name: true, email: true, phone: true }
                    },
                    purchaseItems: {
                        include: {
                            product: {
                                select: { id: true, name: true, sku: true }
                            }
                        }
                    }
                },
                orderBy: { createdAt: 'desc' },
                skip: (page - 1) * limit,
                take: limit
            }),
            prisma.purchaseOrder.count({ where })
        ])

        return NextResponse.json({
            success: true,
            data: orders,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit)
            }
        })

    } catch (error) {
        console.error('Error fetching purchase orders:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

// POST /api/admin/purchase-orders - Create purchase order from smart alerts
export async function POST(request: NextRequest) {
    try {
        const user = verifyTokenFromRequest(request)
        if (!user || !['ADMIN', 'MANAGER'].includes(user.role)) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const body = await request.json()
        const { productIds, autoSend = false, notes } = body

        if (!productIds || !Array.isArray(productIds) || productIds.length === 0) {
            return NextResponse.json({ error: 'Product IDs required' }, { status: 400 })
        }

        // Get products with their suppliers
        const products = await (prisma as any).product.findMany({
            where: { id: { in: productIds } },
            include: {
                inventoryItem: true,
                supplier: true,
                category: true
            }
        })

        if (products.length === 0) {
            return NextResponse.json({ error: 'No products found' }, { status: 404 })
        }

        // Group products by supplier
        const productsBySupplier: Record<string, typeof products> = {}
        const productsWithoutSupplier: typeof products = []

        for (const product of products) {
            if (product.supplierId && product.supplier) {
                if (!productsBySupplier[product.supplierId]) {
                    productsBySupplier[product.supplierId] = []
                }
                productsBySupplier[product.supplierId].push(product)
            } else {
                productsWithoutSupplier.push(product)
            }
        }

        // If products don't have suppliers, try to find suppliers for their categories via SupplierProduct
        if (productsWithoutSupplier.length > 0) {
            // Get all active suppliers
            const suppliers = await (prisma as any).supplier.findMany({
                where: { isActive: true },
                orderBy: { rating: 'desc' }
            })

            // Assign first active supplier if no specific match
            if (suppliers.length > 0) {
                const defaultSupplier = suppliers[0]
                if (!productsBySupplier[defaultSupplier.id]) {
                    productsBySupplier[defaultSupplier.id] = []
                }
                for (const product of productsWithoutSupplier) {
                    productsBySupplier[defaultSupplier.id].push(product)
                }
            }
        }

        // Calculate suggested quantities based on sales data
        const thirtyDaysAgo = new Date()
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

        const recentOrders = await prisma.orderItem.findMany({
            where: {
                productId: { in: productIds },
                order: {
                    createdAt: { gte: thirtyDaysAgo },
                    status: { in: ['CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED'] }
                }
            },
            select: {
                productId: true,
                quantity: true
            }
        })

        const salesByProduct: Record<string, number> = {}
        for (const item of recentOrders) {
            salesByProduct[item.productId] = (salesByProduct[item.productId] || 0) + item.quantity
        }

        // Create purchase orders for each supplier
        const createdOrders = []

        for (const [supplierId, supplierProducts] of Object.entries(productsBySupplier)) {
            const supplier = supplierProducts[0].supplier!

            // Calculate items
            const items = supplierProducts.map((product: any) => {
                const totalSales = salesByProduct[product.id] || 0
                const avgDailySales = totalSales / 30
                const currentStock = product.inventoryItem?.availableQuantity || 0
                const minStock = product.inventoryItem?.minStockLevel || 10

                const suggestedQty = Math.max(
                    minStock,
                    Math.ceil((30 * avgDailySales) + minStock - currentStock)
                )

                const unitPrice = product.costPrice || product.price
                return {
                    productId: product.id,
                    quantity: suggestedQty,
                    unitPrice,
                    totalPrice: suggestedQty * unitPrice,
                    receivedQuantity: 0
                }
            })

            const totalAmount = items.reduce((sum: number, item: any) => sum + item.totalPrice, 0)
            const taxAmount = totalAmount * 0.1 // 10% VAT
            const netAmount = totalAmount + taxAmount

            // Create purchase order using existing schema
            const purchaseOrder = await prisma.purchaseOrder.create({
                data: {
                    orderNumber: generateOrderNumber(),
                    supplierId,
                    status: autoSend ? 'SENT' : 'DRAFT',
                    totalAmount,
                    taxAmount,
                    shippingAmount: 0,
                    discountAmount: 0,
                    netAmount,
                    notes: notes || `Đơn đặt hàng tự động từ hệ thống SmartBuild`,
                    createdBy: user.userId,
                    purchaseItems: {
                        create: items
                    }
                },
                include: {
                    supplier: true,
                    purchaseItems: {
                        include: {
                            product: {
                                select: { id: true, name: true, sku: true }
                            }
                        }
                    }
                }
            })

            // Create in-app notification for supplier
            if (autoSend) {
                try {
                    await (prisma as any).notification.create({
                        data: {
                            supplierId,
                            title: '📝 Đơn đặt hàng mới',
                            message: `Bạn có đơn đặt hàng mới #${purchaseOrder.orderNumber} từ SmartBuild.`,
                            type: 'INFO',
                            priority: 'HIGH',
                            referenceId: purchaseOrder.id,
                            referenceType: 'PURCHASE_ORDER'
                        }
                    })
                } catch (notiError) {
                    console.error('Failed to create notification:', notiError)
                }
            }

            // Send email to supplier if autoSend
            if (autoSend && supplier.email) {
                try {
                    const { EmailService } = await import('@/lib/email-service')
                    await EmailService.sendNewPurchaseOrderToSupplier({
                        supplierEmail: supplier.email,
                        supplierName: supplier.name,
                        orderNumber: purchaseOrder.orderNumber,
                        totalAmount: purchaseOrder.netAmount,
                        items: purchaseOrder.purchaseItems.map((i: any) => ({
                            name: i.product?.name || 'N/A',
                            quantity: i.quantity,
                            price: i.unitPrice
                        }))
                    })
                } catch (emailError) {
                    console.error('Failed to send email to supplier:', emailError)
                }
            }



            createdOrders.push(purchaseOrder)
        }

        return NextResponse.json({
            success: true,
            orders: createdOrders,
            summary: {
                totalOrders: createdOrders.length,
                totalValue: createdOrders.reduce((sum, o) => sum + o.netAmount, 0),
                autoSent: autoSend
            },
            message: autoSend
                ? `Đã tạo và gửi ${createdOrders.length} đơn đặt hàng cho nhà cung cấp`
                : `Đã tạo ${createdOrders.length} đơn đặt hàng (chờ duyệt)`
        })

    } catch (error) {
        console.error('Error creating purchase orders:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

// Helper function to generate email content
function generatePurchaseOrderEmailContent(order: any): string {
    const itemsHtml = order.purchaseItems.map((item: any) => `
    <tr>
      <td style="padding: 12px; border-bottom: 1px solid #eee;">${item.product?.name || 'N/A'}</td>
      <td style="padding: 12px; border-bottom: 1px solid #eee;">${item.product?.sku || 'N/A'}</td>
      <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
      <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: right;">${formatCurrency(item.unitPrice)}</td>
      <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: right; font-weight: bold;">${formatCurrency(item.totalPrice)}</td>
    </tr>
  `).join('')

    return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Đơn đặt hàng #${order.orderNumber}</title>
    </head>
    <body style="font-family: 'Segoe UI', Arial, sans-serif; margin: 0; padding: 20px; background-color: #f5f5f5;">
      <div style="max-width: 700px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.1);">
        
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; color: white;">
          <h1 style="margin: 0; font-size: 24px;">🏗️ SmartBuild</h1>
          <p style="margin: 10px 0 0; opacity: 0.9;">Đơn đặt hàng vật liệu xây dựng</p>
        </div>

        <!-- Order Details -->
        <div style="padding: 30px;">
          <div style="display: flex; justify-content: space-between; margin-bottom: 30px;">
            <div>
              <h2 style="margin: 0 0 10px; color: #333;">Đơn hàng #${order.orderNumber}</h2>
              <p style="margin: 0; color: #666;">Ngày: ${new Date(order.orderDate).toLocaleDateString('vi-VN')}</p>
            </div>
            <div style="text-align: right;">
              <span style="background: #10b981; color: white; padding: 6px 16px; border-radius: 20px; font-size: 14px; font-weight: bold;">
                ĐƠN MỚI
              </span>
            </div>
          </div>

          <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 30px;">
            <h3 style="margin: 0 0 15px; color: #333; font-size: 16px;">Gửi đến: ${order.supplier.name}</h3>
            <p style="margin: 0; color: #666; line-height: 1.6;">
              Kính gửi Quý đối tác,<br><br>
              Chúng tôi xin đặt hàng các sản phẩm sau để bổ sung kho hàng. 
              Vui lòng xác nhận đơn hàng và thời gian giao hàng dự kiến.
            </p>
          </div>

          <!-- Items Table -->
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 30px;">
            <thead>
              <tr style="background: #f8f9fa;">
                <th style="padding: 12px; text-align: left; font-weight: 600; color: #333;">Sản phẩm</th>
                <th style="padding: 12px; text-align: left; font-weight: 600; color: #333;">SKU</th>
                <th style="padding: 12px; text-align: center; font-weight: 600; color: #333;">SL</th>
                <th style="padding: 12px; text-align: right; font-weight: 600; color: #333;">Đơn giá</th>
                <th style="padding: 12px; text-align: right; font-weight: 600; color: #333;">Thành tiền</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
            </tbody>
          </table>

          <!-- Totals -->
          <div style="border-top: 2px solid #eee; padding-top: 20px;">
            <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
              <span style="color: #666;">Tạm tính:</span>
              <span style="font-weight: 600;">${formatCurrency(order.totalAmount)}</span>
            </div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
              <span style="color: #666;">VAT (10%):</span>
              <span style="font-weight: 600;">${formatCurrency(order.taxAmount)}</span>
            </div>
            <div style="display: flex; justify-content: space-between; font-size: 20px; color: #667eea; font-weight: bold;">
              <span>Tổng cộng:</span>
              <span>${formatCurrency(order.netAmount)}</span>
            </div>
          </div>

          ${order.notes ? `
          <div style="margin-top: 30px; padding: 15px; background: #fff3cd; border-radius: 8px; border-left: 4px solid #ffc107;">
            <strong style="color: #856404;">Ghi chú:</strong>
            <p style="margin: 10px 0 0; color: #856404;">${order.notes}</p>
          </div>
          ` : ''}
        </div>

        <!-- Footer -->
        <div style="background: #f8f9fa; padding: 20px 30px; text-align: center; color: #666; font-size: 14px;">
          <p style="margin: 0;">Vui lòng phản hồi lại email này để xác nhận đơn hàng.</p>
          <p style="margin: 10px 0 0;">SmartBuild - Hệ thống quản lý vật liệu xây dựng thông minh</p>
        </div>
      </div>
    </body>
    </html>
  `
}

function formatCurrency(amount: number): string {
    return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND',
        maximumFractionDigits: 0
    }).format(amount)
}
