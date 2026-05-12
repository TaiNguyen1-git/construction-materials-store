import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createSuccessResponse, createErrorResponse } from '@/lib/api-types'
import {
    getConversationState,
    setConversationState
} from '@/lib/chatbot/conversation-state'
import { OrderEntities } from './types'

export async function handleOrderQueryIntent(
    sessionId: string,
    entities: OrderEntities,
    customerId: string | undefined
) {
    let orderNumber = entities.orderNumber
    const phone = entities.phone || entities.phoneNumber

    // CONTEXT AWARENESS: If order number is missing, try to get it from session state
    if (!orderNumber) {
        const state = await getConversationState(sessionId)
        if (state && state.data.lastOrderNumber) {
            orderNumber = state.data.lastOrderNumber
            entities.orderNumber = orderNumber
        }
    }

    if (!orderNumber) {
        return NextResponse.json(createSuccessResponse({
            message: '🔍 **Bạn muốn kiểm tra đơn hàng?**\n\n' +
                (customerId
                    ? 'Vui lòng cho mình biết **Mã đơn hàng** cụ thể, hoặc mình có thể hiển thị danh sách đơn gần đây của bạn!'
                    : 'Để kiểm tra đơn hàng, bạn vui lòng cung cấp **Mã đơn hàng** kèm theo **Số điện thoại** đã dùng khi đặt hàng nhé!'),
            suggestions: customerId ? ['Đơn hàng mới nhất', 'Liên hệ hỗ trợ'] : ['Cung cấp mã đơn', 'Liên hệ hỗ trợ'],
            confidence: 0.9, sessionId, timestamp: new Date().toISOString()
        }))
    }

    // Attempt to find the order
    try {
        const order = await prisma.order.findFirst({
            where: { orderNumber },
            include: {
                orderItems: { include: { product: true } },
                orderTracking: { orderBy: { timestamp: 'desc' } }
            }
        })

        if (!order) {
            return NextResponse.json(createSuccessResponse({
                message: `❌ Không tìm thấy đơn hàng **${orderNumber}**. Vui lòng kiểm tra lại mã đơn hàng của bạn.`,
                suggestions: ['Thử lại', 'Liên hệ hỗ trợ'],
                confidence: 0.9, sessionId, timestamp: new Date().toISOString()
            }))
        }

        // Verification for Guests
        if (order.customerType === 'GUEST' && !customerId) {
            if (!phone) {
                return NextResponse.json(createSuccessResponse({
                    message: `🔍 Tìm thấy đơn hàng **${orderNumber}**.\n\nĐể bảo mật thông tin, bạn vui lòng cung cấp **Số điện thoại** đã dùng khi đặt hàng nhé!`,
                    suggestions: ['Nhập số điện thoại', 'Hủy'],
                    confidence: 0.95, sessionId, timestamp: new Date().toISOString()
                }))
            }

            const cleanPhone = phone.replace(/\s/g, '')
            const orderPhone = order.guestPhone?.replace(/\s/g, '')
            if (cleanPhone !== orderPhone) {
                return NextResponse.json(createSuccessResponse({
                    message: `❌ Số điện thoại không khớp với đơn hàng **${orderNumber}**. Vui lòng kiểm tra lại.`,
                    suggestions: ['Nhập lại SĐT', 'Liên hệ hỗ trợ'],
                    confidence: 0.95, sessionId, timestamp: new Date().toISOString()
                }))
            }
        }

        // Return order status
        const statusLabels: Record<string, string> = {
            'PENDING_CONFIRMATION': '⏳ Chờ xác nhận',
            'CONFIRMED': '✅ Đã xác nhận',
            'PROCESSING': '⚙️ Đang xử lý',
            'SHIPPED': '🚚 Đang giao hàng',
            'DELIVERED': '📦 Đã giao hàng',
            'COMPLETED': '🎉 Hoàn thành',
            'CANCELLED': '❌ Đã hủy'
        }

        const latestUpdate = order.orderTracking[0]?.description || statusLabels[order.status] || order.status

        // SAVE TO CONTEXT: Remember this order number for subsequent "Change Order" or "Cancel" requests
        await setConversationState(sessionId, 'NONE', 0, { lastOrderNumber: order.orderNumber, lastOrderId: order.id })

        return NextResponse.json(createSuccessResponse({
            message: `📦 **Thông tin đơn hàng: ${orderNumber}**\n\n` +
                `- **Trạng thái:** ${statusLabels[order.status] || order.status}\n` +
                `- **Cập nhật mới nhất:** ${latestUpdate}\n` +
                `- **Tổng tiền:** ${order.netAmount.toLocaleString('vi-VN')}đ\n` +
                `- **Ngày đặt:** ${new Date(order.createdAt).toLocaleDateString('vi-VN')}\n\n` +
                `🛒 **Sản phẩm:**\n${order.orderItems.map(i => `  • ${i.product.name} (x${i.quantity})`).join('\n')}\n\n` +
                `🔗 [Xem chi tiết đơn hàng tại đây](/order-tracking?orderId=${order.id})`,
            suggestions: ['Theo dõi vận chuyển', 'Thay đổi đơn hàng', 'Hủy đơn hàng'],
            confidence: 1.0, sessionId, timestamp: new Date().toISOString(),
            orderData: { orderNumber: order.orderNumber, status: order.status }
        }))
    } catch (error) {
        console.error('Order query error:', error)
        return NextResponse.json(createErrorResponse('Lỗi truy vấn đơn hàng', 'DATABASE_ERROR'), { status: 500 })
    }
}

export async function handleOrderManageIntent(
    sessionId: string,
    entities: OrderEntities,
    customerId: string | undefined
) {
    let orderNumber = entities.orderNumber
    const phone = entities.phone || entities.phoneNumber

    // CONTEXT AWARENESS: If order number is missing, try to get it from session state
    if (!orderNumber) {
        const state = await getConversationState(sessionId)
        if (state && state.data.lastOrderNumber) {
            orderNumber = state.data.lastOrderNumber
            entities.orderNumber = orderNumber // Update entities for handleOrderQueryIntent to work
        }
    }

    if (!orderNumber) {
        return NextResponse.json(createSuccessResponse({
            message: '💡 **Bạn muốn thay đổi hoặc hủy đơn hàng?**\n\n' +
                (customerId
                    ? 'Vui lòng cho mình biết **Mã đơn hàng** cụ thể để mình hỗ trợ ngay nhé!'
                    : 'Vui lòng cung cấp **Mã đơn hàng** và **Số điện thoại** đặt hàng để mình kiểm tra và hỗ trợ thay đổi nhé!'),
            suggestions: ['Kiểm tra đơn hàng', 'Liên hệ hỗ trợ', 'Hủy đơn hàng'],
            confidence: 0.95, sessionId, timestamp: new Date().toISOString()
        }))
    }

    // Use query logic to verify first
    const queryResponse = await handleOrderQueryIntent(sessionId, entities, customerId)
    const queryData = await queryResponse.json()

    if (!queryData.success || queryData.data.message.includes('❌') || queryData.data.message.includes('Để bảo mật')) {
        return queryResponse
    }

    // If verified, check for specific actions
    const lowerMessage = entities.rawMessage?.toLowerCase() || ''
    
    // ACTION: Cancel Order
    if (lowerMessage.includes('hủy đơn') || lowerMessage === 'hủy' || lowerMessage === 'hủy đơn hàng') {
        // Start a confirmation flow
        await setConversationState(sessionId, 'CRUD_CONFIRMATION', 1, {
            action: 'update',
            entityType: 'order',
            entityData: { orderNumber, status: 'CANCELLED' },
            previewMessage: `Bạn có chắc chắn muốn **Hủy đơn hàng ${orderNumber}** không?`
        })

        return NextResponse.json(createSuccessResponse({
            message: `⚠️ **Xác nhận hủy đơn hàng**\n\nBạn có chắc chắn muốn hủy đơn hàng **${orderNumber}** không?\n\n*Lưu ý: Thao tác này không thể hoàn tác sau khi xác nhận.*`,
            suggestions: ['Xác nhận hủy', 'Quay lại', 'Hủy bỏ'],
            confidence: 1.0, sessionId, timestamp: new Date().toISOString()
        }))
    }

    // ACTION: Change Address
    if (lowerMessage.includes('đổi địa chỉ') || lowerMessage.includes('thay đổi địa chỉ')) {
        return NextResponse.json(createSuccessResponse({
            message: `📍 **Thay đổi địa chỉ giao hàng**\n\nĐể đảm bảo hàng hóa được giao đúng hẹn, vui lòng cung cấp địa chỉ mới cho đơn hàng **${orderNumber}**.\n\nHoặc bạn có thể liên hệ hotline **1900-xxxx** để nhân viên cập nhật nhanh nhất!`,
            suggestions: ['Nhập địa chỉ mới', 'Liên hệ hỗ trợ'],
            confidence: 1.0, sessionId, timestamp: new Date().toISOString()
        }))
    }

    // ACTION: Support
    if (lowerMessage.includes('liên hệ hỗ trợ') || lowerMessage.includes('hỗ trợ')) {
        return NextResponse.json(createSuccessResponse({
            message: `📞 **Hỗ trợ đơn hàng ${orderNumber}**\n\nBạn có thể liên hệ với chúng tôi qua các kênh sau để được hỗ trợ nhanh nhất cho đơn hàng này:\n\n` +
                `- **Hotline:** 1900-xxxx (Nhấn phím 1)\n` +
                `- **Zalo:** 090xxxxxxx\n\n` +
                `💡 Nhân viên hỗ trợ sẽ cần bạn cung cấp mã đơn hàng: **${orderNumber}**.`,
            suggestions: ['Quay lại đơn hàng', 'Trang chủ'],
            confidence: 1.0, sessionId, timestamp: new Date().toISOString()
        }))
    }

    // Default: offer management options
    return NextResponse.json(createSuccessResponse({
        message: `🛠️ **Quản lý đơn hàng: ${orderNumber}**\n\n` +
            `Bạn có thể thực hiện các thao tác sau:\n` +
            `1. **Hủy đơn hàng**: Chỉ áp dụng nếu đơn chưa giao.\n` +
            `2. **Thay đổi địa chỉ**: Cần liên hệ nhân viên xác nhận.\n` +
            `3. **Ghi chú thêm**: Thêm yêu cầu cho tài xế.\n\n` +
            `💡 Bạn muốn mình thực hiện thao tác nào?`,
        suggestions: ['Hủy đơn hàng', 'Đổi địa chỉ', 'Liên hệ hỗ trợ'],
        confidence: 1.0, sessionId, timestamp: new Date().toISOString()
    }))
}
