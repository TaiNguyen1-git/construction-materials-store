/**
 * AI Executive Summary API
 * Generates daily business intelligence summary using Gemini AI
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { creditCheckService } from '@/lib/credit-check-service'

export async function GET(request: NextRequest) {
    try {
        // 1. Gather data for AI analysis
        const today = new Date()
        const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000)
        const startOfYesterday = new Date(yesterday.setHours(0, 0, 0, 0))
        const endOfYesterday = new Date(yesterday.setHours(23, 59, 59, 999))

        // Yesterday's revenue
        const yesterdayOrders = await prisma.order.findMany({
            where: {
                createdAt: { gte: startOfYesterday, lte: endOfYesterday },
                status: { in: ['DELIVERED', 'CONFIRMED', 'PROCESSING', 'SHIPPED'] as any }
            }
        })
        const yesterdayRevenue = yesterdayOrders.reduce((sum, o) => sum + o.netAmount, 0)
        const orderCount = yesterdayOrders.length

        // Debt aging report
        const agingReport = await creditCheckService.generateDebtAgingReport()
        const criticalDebtCustomers = agingReport.filter(r => r.over90 > 0)
        const totalOverdue = agingReport.reduce((sum, r) => sum + r.days1to30 + r.days31to60 + r.days61to90 + r.over90, 0)

        // Low stock items
        const lowStockItems = await prisma.inventoryItem.findMany({
            where: {
                availableQuantity: { lte: prisma.inventoryItem.fields.minStockLevel }
            },
            include: {
                product: { select: { name: true, sku: true } }
            },
            take: 10
        })

        // Pending orders
        const pendingOrders = await prisma.order.count({
            where: { status: { in: ['PENDING', 'PENDING_CONFIRMATION'] } }
        })

        // 2. Build context for AI
        const analysisData = {
            date: today.toLocaleDateString('vi-VN'),
            yesterdayRevenue,
            orderCount,
            pendingOrders,
            criticalDebtCount: criticalDebtCustomers.length,
            totalOverdue,
            lowStockCount: lowStockItems.length,
            lowStockItems: lowStockItems.slice(0, 5).map(i => ({
                name: i.product.name,
                current: i.quantity,
                min: i.minStockLevel
            })),
            criticalDebtCustomers: criticalDebtCustomers.slice(0, 3).map(c => ({
                name: c.customerName,
                over90: c.over90
            }))
        }

        // 3. Generate Rule-based summary (No AI to save cost/quota)
        let summary = ''
        const dateStr = today.toLocaleDateString('vi-VN', { day: 'numeric', month: 'long' })

        // Dynamic content based on status
        const revenueText = analysisData.yesterdayRevenue > 0
            ? `Doanh thu hôm qua đạt ${analysisData.yesterdayRevenue.toLocaleString('vi-VN')}đ.`
            : `Hôm qua chưa ghi nhận doanh thu phát sinh.`

        const orderText = analysisData.orderCount > 0
            ? `Hệ thống đã xử lý ${analysisData.orderCount} đơn hàng.`
            : `Không có đơn hàng nào được hoàn tất.`

        const issues = []
        if (analysisData.pendingOrders > 0) issues.push(`đang có ${analysisData.pendingOrders} đơn hàng chờ xác nhận`)
        if (analysisData.lowStockCount > 0) issues.push(`${analysisData.lowStockCount} sản phẩm sắp hết kho`)
        if (analysisData.criticalDebtCount > 0) issues.push(`${analysisData.criticalDebtCount} khách hàng nợ quá hạn`)

        const statusMessage = issues.length > 0
            ? `Cần lưu ý: ${issues.join(', ')}.`
            : `Các chỉ số vận hành đang ở trạng thái ổn định.`

        const actionItems = []
        if (analysisData.pendingOrders > 5) actionItems.push("Ưu tiên xử lý đơn hàng tồn đọng")
        if (analysisData.lowStockCount > 0) actionItems.push("Kiểm tra danh sách nhập hàng")
        if (analysisData.criticalDebtCount > 0) actionItems.push("Liên hệ đôn đốc thu hồi nợ")
        if (actionItems.length === 0) actionItems.push("Tiếp tục theo dõi thị trường")

        summary = `Chào Admin, tình hình ngày ${dateStr}: ${revenueText} ${orderText} ${statusMessage} Gợi ý: ${actionItems.join(' & ')}. Chúc một ngày làm việc hiệu quả! 🚀`

        return NextResponse.json({
            success: true,
            data: {
                summary,
                generatedAt: new Date().toISOString(),
                metrics: {
                    yesterdayRevenue,
                    orderCount,
                    pendingOrders,
                    criticalDebtCount: criticalDebtCustomers.length,
                    lowStockCount: lowStockItems.length
                }
            }
        })

    } catch (error: any) {
        console.error('AI Summary API error:', error)
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        )
    }
}
