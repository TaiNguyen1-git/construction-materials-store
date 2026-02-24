/**
 * Admin Handler - All admin-specific chatbot flows
 * Handles: Analytics, Order Management, Inventory Checks, CRUD Operations
 */
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createSuccessResponse } from '@/lib/api-types'
import { executeAnalyticsQuery } from '@/lib/chatbot/analytics-engine'
import { executeAction } from '@/lib/chatbot/action-handler'
import { requiresManagerRole, type IntentResult } from '@/lib/chatbot/intent-detector'
import { type ExtractedEntities } from '@/lib/chatbot/entity-extractor'
import { startCRUDConfirmationFlow } from '@/lib/chatbot/conversation-state'

// ─── Utilities ────────────────────────────────────────────────────────────────

function formatRelativeTime(date: Date): string {
    const now = Date.now()
    const diff = now - date.getTime()
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)
    if (minutes < 1) return 'Vừa xong'
    if (minutes < 60) return `${minutes} phút trước`
    if (hours < 24) return `${hours} giờ trước`
    return `${days} ngày trước`
}

function getStatusEmoji(status: string): string {
    const emojis: Record<string, string> = {
        'PENDING': '⏰', 'PENDING_CONFIRMATION': '⏰', 'CONFIRMED': '✅',
        'PROCESSING': '🔄', 'SHIPPED': '🚚', 'COMPLETED': '✅', 'CANCELLED': '❌'
    }
    return emojis[status] || '📦'
}

function getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
        'PENDING': 'Chờ xử lý', 'PENDING_CONFIRMATION': 'Chờ xác nhận',
        'CONFIRMED': 'Đã xác nhận', 'PROCESSING': 'Đang xử lý',
        'SHIPPED': 'Đang giao', 'COMPLETED': 'Hoàn thành', 'CANCELLED': 'Đã hủy'
    }
    return labels[status] || status
}

// ─── Admin Order Management ────────────────────────────────────────────────────

export async function handleAdminOrderManagement(
    message: string,
    entities: ExtractedEntities,
    sessionId: string
) {
    try {
        const lower = message.toLowerCase()

        // Confirm all pending orders
        if (
            (lower.includes('xác nhận') && lower.includes('tất cả')) ||
            lower === 'xác nhận tất cả' || lower.includes('confirm all') ||
            (lower.includes('duyệt') && lower.includes('tất cả')) ||
            lower === 'trạng thái pending' || lower === 'xác nhận' ||
            lower === 'confirm' || lower === 'xác nhận đơn' || lower === 'duyệt đơn'
        ) {
            const pendingOrders = await prisma.order.findMany({
                where: { status: { in: ['PENDING', 'PENDING_CONFIRMATION'] } },
                select: { id: true, orderNumber: true, netAmount: true, guestName: true, customerType: true, status: true, customer: { include: { user: true } } }
            })

            if (pendingOrders.length === 0) {
                return NextResponse.json(createSuccessResponse({
                    message: '✅ **Không có đơn hàng chờ xử lý!**\n\nTất cả đơn hàng đã được xác nhận.',
                    suggestions: ['Xem tất cả đơn', 'Doanh thu hôm nay', 'Trợ giúp'],
                    confidence: 1.0, sessionId, timestamp: new Date().toISOString()
                }))
            }

            const confirmedOrders: string[] = []
            const failedOrders: string[] = []

            for (const order of pendingOrders) {
                try {
                    await prisma.order.update({ where: { id: order.id }, data: { status: 'CONFIRMED', updatedAt: new Date() } })
                    await prisma.orderTracking.create({ data: { orderId: order.id, status: 'CONFIRMED', description: 'Đơn hàng được xác nhận qua chatbot (Xác nhận tất cả)', createdBy: 'ADMIN_CHATBOT' } })
                    confirmedOrders.push(order.orderNumber)
                } catch (err) {
                    console.error(`Failed to confirm order ${order.orderNumber}:`, err)
                    failedOrders.push(order.orderNumber)
                }
            }

            let responseMsg = `✅ **Đã Xác Nhận Đơn Hàng**\n\n`
            if (confirmedOrders.length > 0) {
                responseMsg += `🎉 Đã xác nhận thành công **${confirmedOrders.length}** đơn hàng:\n\n`
                confirmedOrders.slice(0, 10).forEach((orderNum, idx) => { responseMsg += `${idx + 1}. ${orderNum} ✅\n` })
                if (confirmedOrders.length > 10) responseMsg += `... và ${confirmedOrders.length - 10} đơn khác\n`
                const totalValue = pendingOrders.filter(o => confirmedOrders.includes(o.orderNumber)).reduce((sum, o) => sum + o.netAmount, 0)
                responseMsg += `\n💰 Tổng giá trị: **${totalValue.toLocaleString('vi-VN')}đ**\n`
            }
            if (failedOrders.length > 0) {
                responseMsg += `\n⚠️ Có **${failedOrders.length}** đơn không thể xác nhận:\n`
                failedOrders.forEach(orderNum => { responseMsg += `- ${orderNum} ❌\n` })
            }
            responseMsg += `\n💡 Các đơn hàng đã chuyển sang trạng thái "Đã xác nhận" và sẵn sàng xử lý.`

            return NextResponse.json(createSuccessResponse({
                message: responseMsg,
                suggestions: ['Xem đơn đã xác nhận', 'Đơn chờ xử lý', 'Doanh thu hôm nay'],
                confidence: 1.0, sessionId, timestamp: new Date().toISOString(),
                data: { confirmedCount: confirmedOrders.length, failedCount: failedOrders.length, confirmedOrders, failedOrders }
            }))
        }

        // Check pending orders
        if (lower.includes('chờ') || lower.includes('pending')) {
            const pendingOrders = await prisma.order.findMany({
                where: { status: { in: ['PENDING', 'PENDING_CONFIRMATION'] } },
                include: { customer: { include: { user: true } } },
                orderBy: { createdAt: 'desc' },
                take: 10
            })

            let responseMsg = `📦 **Đơn Hàng Chờ Xử Lý**\n\n`
            if (pendingOrders.length === 0) {
                responseMsg += `✅ Không có đơn hàng chờ xử lý!\n\nTất cả đơn đã được xử lý.`
                return NextResponse.json(createSuccessResponse({ message: responseMsg, suggestions: ['Xem tất cả đơn', 'Doanh thu hôm nay'], confidence: 1.0, sessionId, timestamp: new Date().toISOString() }))
            }

            responseMsg += `Có **${pendingOrders.length}** đơn hàng cần xác nhận:\n\n`
            pendingOrders.slice(0, 5).forEach((order, idx) => {
                const isNew = Date.now() - order.createdAt.getTime() < 30 * 60 * 1000
                const customerName = order.customerType === 'GUEST' ? order.guestName : order.customer?.user.name || 'N/A'
                responseMsg += `\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`
                responseMsg += `${idx + 1}. **${order.orderNumber}** ${isNew ? '⏰ MỚI' : ''}\n`
                responseMsg += `\n👤 Khách hàng: ${customerName} ${order.customerType === 'GUEST' ? '(Khách vãng lai)' : ''}\n`
                responseMsg += `💰 Tổng tiền: **${order.netAmount.toLocaleString('vi-VN')}đ**\n`
                responseMsg += `🕐 Thời gian: ${formatRelativeTime(order.createdAt)}\n`
                responseMsg += `📦 Thanh toán: ${order.paymentMethod}\n`
            })
            responseMsg += `\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`
            if (pendingOrders.length > 5) responseMsg += `... và ${pendingOrders.length - 5} đơn khác\n\n`

            const avgWaitTime = pendingOrders.length > 0
                ? Math.round(pendingOrders.reduce((sum, o) => sum + (Date.now() - o.createdAt.getTime()), 0) / pendingOrders.length / 60000) : 0
            responseMsg += `⏱️ Thời gian chờ TB: ${avgWaitTime} phút\n`
            responseMsg += `💡 Ưu tiên xử lý đơn mới nhất trước!`

            return NextResponse.json(createSuccessResponse({
                message: responseMsg,
                suggestions: ['Xem chi tiết đơn đầu', 'Xác nhận tất cả', 'Làm mới'],
                confidence: 1.0, sessionId, timestamp: new Date().toISOString(),
                data: { pendingOrders: pendingOrders.slice(0, 5) }
            }))
        }

        // Latest / all orders
        if (lower.includes('mới nhất') || lower.includes('latest') || lower.includes('tất cả đơn')) {
            const limit = lower.includes('tất cả đơn') ? 20 : 5
            const recentOrders = await prisma.order.findMany({
                orderBy: { createdAt: 'desc' }, take: limit,
                include: { customer: { include: { user: true } } }
            })

            let responseMsg = lower.includes('tất cả đơn')
                ? `📦 **Tất Cả Đơn Hàng** (${recentOrders.length} đơn gần nhất)\n\n`
                : `📦 **Đơn Hàng Mới Nhất**\n\n`

            if (recentOrders.length === 0) {
                return NextResponse.json(createSuccessResponse({ message: responseMsg + `❌ Không có đơn hàng nào.\n\n`, suggestions: ['Đơn chờ xử lý', 'Doanh thu hôm nay'], confidence: 1.0, sessionId, timestamp: new Date().toISOString() }))
            }

            recentOrders.forEach((order, idx) => {
                const customerName = order.customerType === 'GUEST' ? order.guestName : order.customer?.user.name || 'N/A'
                responseMsg += `\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`
                responseMsg += `${idx + 1}. **${order.orderNumber}**\n`
                responseMsg += `\n${getStatusEmoji(order.status)} **${getStatusLabel(order.status)}**\n`
                responseMsg += `👤 Khách hàng: ${customerName}\n`
                responseMsg += `💰 Tổng tiền: **${order.netAmount.toLocaleString('vi-VN')}đ**\n`
                responseMsg += `🕐 Thời gian: ${formatRelativeTime(order.createdAt)}\n`
            })
            responseMsg += `\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`
            if (lower.includes('tất cả đơn') && recentOrders.length === 20) {
                responseMsg += `💡 Đang hiển thị 20 đơn hàng gần nhất. Vào trang quản lý để xem thêm.\n\n`
            }

            return NextResponse.json(createSuccessResponse({
                message: responseMsg,
                suggestions: ['Đơn chờ xử lý', 'Doanh thu hôm nay', 'Chi tiết hơn'],
                confidence: 1.0, sessionId, timestamp: new Date().toISOString(),
                data: { orders: recentOrders }
            }))
        }

        return NextResponse.json(createSuccessResponse({
            message: `📦 **Quản Lý Đơn Hàng**\n\nTôi có thể giúp bạn:\n\n- Xem đơn hàng chờ xử lý\n- Xem đơn hàng mới nhất\n- Thống kê đơn hàng theo ngày\n\n💡 Thử hỏi: "Đơn hàng chờ xử lý" hoặc "Đơn hàng mới nhất"`,
            suggestions: ['Đơn chờ xử lý', 'Đơn mới nhất', 'Doanh thu hôm nay'],
            confidence: 0.8, sessionId, timestamp: new Date().toISOString()
        }))
    } catch (error: unknown) {
        const err = error as Error
        return NextResponse.json(createSuccessResponse({
            message: `❌ Lỗi khi truy vấn đơn hàng: ${err.message}`,
            suggestions: ['Thử lại', 'Trợ giúp'], confidence: 0.5, sessionId, timestamp: new Date().toISOString()
        }))
    }
}

// ─── Admin Inventory Check ─────────────────────────────────────────────────────

export async function handleAdminInventoryCheck(
    message: string,
    entities: ExtractedEntities,
    sessionId: string
) {
    try {
        const inventoryItems = await prisma.inventoryItem.findMany({
            include: { product: { select: { name: true, unit: true, price: true } } }
        })

        const lowStockItems = inventoryItems.filter(item => {
            const safetyStock = Math.max(10, Math.floor(item.availableQuantity * 0.1))
            return item.availableQuantity <= safetyStock && safetyStock > 0
        })
        const criticalItems = lowStockItems.filter(item => {
            const safetyStock = Math.max(10, Math.floor(item.availableQuantity * 0.1))
            return item.availableQuantity <= safetyStock * 0.3
        })
        const warningItems = lowStockItems.filter(item => {
            const safetyStock = Math.max(10, Math.floor(item.availableQuantity * 0.1))
            return item.availableQuantity > safetyStock * 0.3 && item.availableQuantity <= safetyStock
        })

        let responseMsg = `⚠️ **Cảnh Báo Tồn Kho**\n\n`

        if (lowStockItems.length === 0) {
            return NextResponse.json(createSuccessResponse({
                message: responseMsg + `✅ Tất cả sản phẩm đều đủ hàng!\n\nKhông có sản phẩm nào dưới mức an toàn.`,
                suggestions: ['Xem tồn kho', 'Doanh thu hôm nay'], confidence: 1.0, sessionId, timestamp: new Date().toISOString()
            }))
        }

        if (criticalItems.length > 0) {
            responseMsg += `🔴 **KHẨN CẤP** - Cần đặt hàng ngay (${criticalItems.length} sản phẩm):\n\n`
            criticalItems.slice(0, 5).forEach((item, idx) => {
                const safetyStock = Math.max(10, Math.floor(item.availableQuantity * 0.1))
                const daysLeft = item.availableQuantity > 0 && safetyStock > 0 ? Math.floor(item.availableQuantity / (safetyStock * 0.1)) : 0
                responseMsg += `${idx + 1}. **${item.product.name}**\n`
                responseMsg += `   📦 Còn: ${item.availableQuantity} ${item.product.unit}\n`
                responseMsg += `   ⚡ Mức an toàn: ${safetyStock} ${item.product.unit}\n`
                responseMsg += `   ⏰ ${daysLeft <= 0 ? 'HẾT HÀNG' : `Còn ~${daysLeft} ngày`}\n\n`
            })
        }
        if (warningItems.length > 0) {
            responseMsg += `🟡 **CẢNH BÁO** - Sắp hết (${warningItems.length} sản phẩm):\n\n`
            warningItems.slice(0, 3).forEach((item, idx) => {
                responseMsg += `${idx + 1}. **${item.product.name}**: Còn ${item.availableQuantity} ${item.product.unit}\n`
            })
            if (warningItems.length > 3) responseMsg += `... và ${warningItems.length - 3} sản phẩm khác\n`
        }

        const estimatedValue = criticalItems.reduce((sum, item) => {
            const safetyStock = Math.max(10, Math.floor(item.availableQuantity * 0.1))
            return sum + (Math.max(100, safetyStock * 2) * item.product.price)
        }, 0)

        responseMsg += `\n💰 Ước tính giá trị cần đặt: ~${estimatedValue.toLocaleString('vi-VN')}đ\n\n`
        responseMsg += `🎯 **Hành động:**\n✅ Liên hệ nhà cung cấp ngay\n✅ Cập nhật thông báo trên website\n✅ Xem lịch sử nhập hàng`

        return NextResponse.json(createSuccessResponse({
            message: responseMsg,
            suggestions: ['Xem chi tiết', 'Liên hệ NCC', 'Cập nhật tồn kho'],
            confidence: 1.0, sessionId, timestamp: new Date().toISOString(),
            data: {
                criticalCount: criticalItems.length, warningCount: warningItems.length, estimatedValue,
                criticalItems: criticalItems.slice(0, 5).map(i => {
                    const safetyStock = Math.max(10, Math.floor(i.availableQuantity * 0.1))
                    return { productName: i.product.name, available: i.availableQuantity, safetyLevel: safetyStock, unit: i.product.unit }
                })
            }
        }))
    } catch (error: unknown) {
        const err = error as Error
        return NextResponse.json(createSuccessResponse({
            message: `❌ Lỗi khi kiểm tra tồn kho: ${err.message}`,
            suggestions: ['Thử lại', 'Trợ giúp'], confidence: 0.5, sessionId, timestamp: new Date().toISOString()
        }))
    }
}

// ─── Admin CRUD Handler ────────────────────────────────────────────────────────

export async function handleAdminCRUD(
    message: string,
    entities: ExtractedEntities,
    intentResult: IntentResult,
    sessionId: string,
    customerId: string | undefined,
    userRole: string
) {
    if (requiresManagerRole(intentResult.intent) && userRole !== 'MANAGER') {
        return NextResponse.json(createSuccessResponse({
            message: '⛔ Chỉ MANAGER mới có quyền thực hiện thao tác này.',
            suggestions: ['Quay lại'], confidence: 1.0, sessionId, timestamp: new Date().toISOString()
        }))
    }

    const actionResult = await executeAction({
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        action: (entities.action?.toUpperCase() as any) || 'CREATE',
        entityType: entities.entityType || 'product',
        entities,
        rawMessage: message,
        userId: customerId || '',
        userRole: userRole || 'EMPLOYEE'
    })

    if (actionResult.requiresConfirmation) {
        startCRUDConfirmationFlow(sessionId, {
            action: entities.action || 'CREATE',
            entityType: entities.entityType || 'product',
            entityData: actionResult.data,
            previewMessage: actionResult.message
        })
        return NextResponse.json(createSuccessResponse({
            message: actionResult.message + '\n\n⚠️ Xác nhận thực hiện?',
            suggestions: ['Xác nhận', 'Hủy'], confidence: 0.9, sessionId, timestamp: new Date().toISOString()
        }))
    }

    return NextResponse.json(createSuccessResponse({
        message: actionResult.message,
        suggestions: actionResult.success ? ['Tiếp tục', 'Xem chi tiết'] : ['Thử lại', 'Trợ giúp'],
        confidence: actionResult.success ? 0.9 : 0.5, sessionId, timestamp: new Date().toISOString()
    }))
}

// ─── Admin Analytics Handler ───────────────────────────────────────────────────

export async function handleAdminAnalytics(
    message: string,
    entities: ExtractedEntities,
    sessionId: string
) {
    const analyticsResult = await executeAnalyticsQuery(message, entities)
    let suggestions: string[] = []
    if (analyticsResult.success && analyticsResult.data?.hasData === false) {
        suggestions = ['Báo cáo tháng này', 'Báo cáo năm nay', 'Doanh thu hôm nay', 'Trợ giúp']
    } else if (analyticsResult.success && analyticsResult.data) {
        suggestions = ['Xuất báo cáo', 'Chi tiết hơn', 'So sánh kỳ trước']
    } else {
        suggestions = ['Thử lại', 'Trợ giúp']
    }

    return NextResponse.json(createSuccessResponse({
        message: analyticsResult.message, suggestions,
        confidence: analyticsResult.success ? 0.9 : 0.5,
        sessionId, timestamp: new Date().toISOString(),
        data: analyticsResult.data
    }))
}
