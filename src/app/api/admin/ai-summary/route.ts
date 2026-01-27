/**
 * AI Executive Summary API
 * Generates daily business intelligence summary using Gemini AI
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { AIService } from '@/lib/ai-service'
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

        // 3. Generate AI summary
        const prompt = `
Bạn là trợ lý BI (Business Intelligence) cho cửa hàng vật liệu xây dựng.
Dựa trên dữ liệu sau, hãy viết một bản tin ngắn gọn (tối đa 80 từ) bằng tiếng Việt cho quản lý:

Dữ liệu:
- Ngày: ${analysisData.date}
- Doanh thu hôm qua: ${analysisData.yesterdayRevenue.toLocaleString('vi-VN')}đ (${analysisData.orderCount} đơn)
- Đơn hàng chờ xử lý: ${analysisData.pendingOrders}
- Khách hàng nợ xấu (90+ ngày): ${analysisData.criticalDebtCount} khách
- Tổng nợ quá hạn: ${analysisData.totalOverdue.toLocaleString('vi-VN')}đ
- Sản phẩm sắp hết: ${analysisData.lowStockCount} mặt hàng
${analysisData.lowStockItems.length > 0 ? `- Chi tiết hết hàng: ${analysisData.lowStockItems.map(i => i.name).join(', ')}` : ''}
${analysisData.criticalDebtCustomers.length > 0 ? `- Khách nợ xấu: ${analysisData.criticalDebtCustomers.map(c => `${c.name} (${c.over90.toLocaleString('vi-VN')}đ)`).join(', ')}` : ''}

Yêu cầu:
- Bắt đầu bằng lời chào ngắn "Chào Admin,"
- Tóm tắt tình hình kinh doanh
- Nêu các vấn đề cần chú ý (nếu có)
- Đề xuất hành động ưu tiên (1-2 gợi ý)
- Giọng văn chuyên nghiệp nhưng thân thiện
`

        let summary = ''
        try {
            const aiResponse = await AIService.generateChatbotResponse(prompt, null, [], true)
            summary = aiResponse.response

            // Check if AI actually returned a valid summary or an error message
            if (summary.includes("Xin lỗi") || summary.length < 50) {
                throw new Error("AI returned error message")
            }
        } catch (aiError) {
            console.error('AI summary generation failed or returned error:', aiError)
            // Fallback to static summary
            summary = `Chào Admin,

📊 **Tóm tắt ngày ${analysisData.date}:**
- Doanh thu hôm qua: ${analysisData.yesterdayRevenue.toLocaleString('vi-VN')}đ (${analysisData.orderCount} đơn)
- Đơn chờ xử lý: ${analysisData.pendingOrders}
${analysisData.criticalDebtCount > 0 ? `⚠️ Có ${analysisData.criticalDebtCount} khách hàng nợ xấu cần theo dõi.` : '✅ Không có khách nợ xấu.'}
${analysisData.lowStockCount > 0 ? `📦 ${analysisData.lowStockCount} sản phẩm sắp hết kho.` : '✅ Tồn kho ổn định.'}

Chúc một ngày làm việc hiệu quả! 💪`
        }

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
