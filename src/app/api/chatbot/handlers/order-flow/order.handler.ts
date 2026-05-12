import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createSuccessResponse, createErrorResponse } from '@/lib/api-types'
import {
    ConversationState,
    clearConversationState
} from '@/lib/chatbot/conversation-state'
import { CustomerInfo } from './types'
import { extractProductKeywords } from './utils'

export async function handleOrderCreation(
    sessionId: string,
    customerId: string | undefined,
    state: ConversationState
) {
    try {
        const flowData = state.data
        const isGuest = !customerId
        let customerInfo: CustomerInfo

        if (isGuest) {
            if (!flowData.guestInfo) {
                return NextResponse.json(createSuccessResponse({
                    message: '❌ Thiếu thông tin giao hàng. Vui lòng cung cấp:\n- Họ tên\n- Số điện thoại\n- Địa chỉ\n\n💡 Ví dụ: Nguyễn Văn A, 0901234567, 123 Nguyễn Huệ, Q1, HCM',
                    suggestions: ['Nhập lại', 'Đăng nhập'], confidence: 1.0, sessionId, timestamp: new Date().toISOString()
                }))
            }
            const guestInfo = flowData.guestInfo
            if (!guestInfo?.name || !guestInfo?.phone || !guestInfo?.address) {
                return NextResponse.json(createSuccessResponse({
                    message: '❌ Thiếu thông tin giao hàng. Vui lòng cung cấp:\n- Họ tên\n- Số điện thoại\n- Địa chỉ\n\n' +
                        `💡 Thông tin hiện tại:\n- Tên: ${guestInfo?.name || '(chưa có)'}\n- SĐT: ${guestInfo?.phone || '(chưa có)'}\n- Địa chỉ: ${guestInfo?.address || '(chưa có)'}\n\n` +
                        '💡 Ví dụ: Nguyễn Văn A, 0901234567, 123 Nguyễn Huệ, Q1, HCM',
                    suggestions: ['Nhập lại', 'Đăng nhập'], confidence: 1.0, sessionId, timestamp: new Date().toISOString()
                }))
            }
            customerInfo = { name: guestInfo.name, phone: guestInfo.phone, email: '', address: guestInfo.address }
        } else {
            const customer = await prisma.customer.findUnique({ where: { id: customerId }, include: { user: true } })
            if (!customer) return NextResponse.json(createErrorResponse('Customer not found', 'NOT_FOUND'), { status: 404 })
            customerInfo = { name: customer.user.name, phone: customer.user.phone || '', email: customer.user.email, address: customer.user.address || '' }
        }

        const result = await prisma.$transaction(async (tx) => {
            const items = flowData.items || []
            let subtotal = 0
            const orderItems: { productId: string; quantity: number; unitPrice: number; totalPrice: number; discount: number }[] = []
            let itemsMatched = 0

            // 1. Bulk lookup all potential products to avoid N+1 queries in transaction
            const itemsWithKeywords = items.map((item: { productName: string; quantity?: number }) => ({
                item,
                keywords: extractProductKeywords(item.productName)
            }))

            const allORConditions = itemsWithKeywords.flatMap(({ keywords }: { keywords: string[] }) => 
                keywords.flatMap((kw: string) => [
                    { name: { contains: kw, mode: 'insensitive' as const } },
                    { tags: { hasSome: [kw.toLowerCase()] } }
                ])
            )

            const allMatchingProducts = allORConditions.length > 0 
                ? await tx.product.findMany({
                    where: { OR: allORConditions, isActive: true },
                    select: { id: true, name: true, price: true, unit: true, sku: true, inventoryItem: { select: { availableQuantity: true } } }
                })
                : []

            for (const { item, keywords } of itemsWithKeywords) {
                // Find first product that matches any of the keywords
                let product = null
                for (const keyword of keywords) {
                    product = allMatchingProducts.find(p => 
                        p.name.toLowerCase().includes(keyword.toLowerCase())
                    )
                    if (product) break
                }
                if (product) {
                    const quantity = item.quantity || 1
                    const stockQuantity = product.inventoryItem?.availableQuantity || 0
                    
                    // Inventory Check
                    if (stockQuantity < quantity) {
                        throw new Error(`Sản phẩm "${product.name}" hiện chỉ còn ${stockQuantity} ${product.unit} trong kho. Vui lòng giảm số lượng.`)
                    }

                    const unitPrice = product.price
                    const itemSubtotal = quantity * unitPrice
                    orderItems.push({ productId: product.id, quantity, unitPrice, totalPrice: itemSubtotal, discount: 0 })
                    subtotal += itemSubtotal
                    itemsMatched++
                }
            }

            if (orderItems.length === 0) throw new Error('Không tìm thấy sản phẩm nào trong hệ thống. Vui lòng thử lại.')

            const orderNumber = `ORD-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Date.now().toString().slice(-4)}`
            const depositAmount = Math.round(subtotal * 0.5)

            const order = await tx.order.create({
                data: {
                    orderNumber,
                    customerId: isGuest ? null : customerId,
                    customerType: isGuest ? 'GUEST' : 'REGISTERED',
                    guestName: isGuest ? customerInfo.name : undefined,
                    guestPhone: isGuest ? customerInfo.phone : undefined,
                    guestEmail: isGuest ? (customerInfo.email || undefined) : undefined,
                    status: 'PENDING_CONFIRMATION',
                    totalAmount: subtotal, taxAmount: 0, shippingAmount: 0, discountAmount: 0, netAmount: subtotal,
                    paymentMethod: flowData.paymentMethod || 'BANK_TRANSFER',
                    paymentStatus: 'PENDING', paymentType: 'DEPOSIT',
                    depositPercentage: 50, depositAmount, remainingAmount: subtotal - depositAmount,
                    shippingAddress: { name: customerInfo.name, phone: customerInfo.phone, address: customerInfo.address },
                    billingAddress: flowData.vatInfo ? { taxId: flowData.vatInfo.taxId, companyName: flowData.vatInfo.companyName, companyAddress: flowData.vatInfo.companyAddress } : undefined,
                    notes: isGuest ? 'Đơn hàng từ Chatbot AI (Khách vãng lai)' : 'Đơn hàng tạo từ Chatbot AI'
                }
            })

            await tx.orderItem.createMany({ data: orderItems.map(item => ({ orderId: order.id, ...item })) })
            return { order, itemsMatched, totalItems: items.length }
        }, { timeout: 30000 })

        await clearConversationState(sessionId)

        // Async admin notification (fire-and-forget)
        prisma.order.findUnique({
            where: { id: result.order.id },
            include: { customer: { include: { user: { select: { name: true, email: true, id: true } } } } }
        }).then(async (orderWithCustomer) => {
            if (!orderWithCustomer) return
            try {
                const { createOrderNotification } = await import('@/lib/notification-service')
                await createOrderNotification({ id: orderWithCustomer.id, orderNumber: orderWithCustomer.orderNumber, netAmount: orderWithCustomer.netAmount, customerType: orderWithCustomer.customerType, guestName: orderWithCustomer.guestName, guestPhone: orderWithCustomer.guestPhone, customer: orderWithCustomer.customer })
                if (orderWithCustomer.customer?.userId) {
                    const { createOrderStatusNotificationForCustomer } = await import('@/lib/notification-service')
                    await createOrderStatusNotificationForCustomer({ id: orderWithCustomer.id, orderNumber: orderWithCustomer.orderNumber, status: orderWithCustomer.status, customer: { userId: orderWithCustomer.customer.userId } })
                }
            } catch (notifError) { console.error('Error creating order notification:', notifError) }
        }).catch(err => console.error('Order notification fetch failed:', err))

        const bankId = '970436'
        const accountNo = '1234567890'
        const amount = result.order.depositAmount || 0
        const content = `COC ${result.order.orderNumber}`
        const qrUrl = `https://img.vietqr.io/image/${bankId}-${accountNo}-compact2.png?amount=${amount}&addInfo=${encodeURIComponent(content)}`

        return NextResponse.json(createSuccessResponse({
            message: `✅ Đặt hàng thành công! Mã đơn: **${result.order.orderNumber}**\n\n` +
                `📦 **Chi tiết đơn hàng:**\n- Khách hàng: ${customerInfo.name}\n- SĐT: ${customerInfo.phone}\n` +
                `- Tổng tiền: ${result.order.netAmount.toLocaleString('vi-VN')}đ\n` +
                `- Sản phẩm: ${result.itemsMatched}/${result.totalItems} items\n` +
                `- Đặt cọc: ${amount.toLocaleString('vi-VN')}đ (50%)\n` +
                (flowData.vatInfo ? `- Xuất hóa đơn VAT: ✅\n\n` : `\n`) +
                `💳 **QUÉT MÃ ĐỂ THANH TOÁN CỌC:**\n![QR Code](${qrUrl})\n\n` +
                `⏳ **Bước tiếp theo:**\n1. Quét mã QR trên để thanh toán cọc.\n2. Admin sẽ xác nhận đơn hàng và thanh toán của bạn.\n` +
                `3. ${isGuest ? 'Chúng tôi sẽ gọi điện xác nhận giao hàng.' : 'Bạn có thể theo dõi trạng thái đơn hàng.'}\n\n` +
                (isGuest
                    ? `📞 Chúng tôi sẽ liên hệ qua SĐT **${customerInfo.phone}** để xác nhận!\n\n` +
                    `📋 **Lưu mã đơn hàng:** ${result.order.orderNumber}\n` +
                    `💡 [👉 Theo dõi đơn hàng tại đây](/order-tracking?orderNumber=${result.order.orderNumber})`
                    : `👉 [Xem chi tiết đơn hàng](/account/orders/${result.order.id})`),
            suggestions: isGuest ? ['Xem đơn hàng', 'Lưu mã đơn', 'Tiếp tục mua sắm'] : ['Xem chi tiết', 'Tiếp tục mua sắm'],
            confidence: 1.0, sessionId, timestamp: new Date().toISOString(),
            orderData: { orderNumber: result.order.orderNumber, orderId: result.order.id, status: result.order.status, depositAmount: result.order.depositAmount, totalAmount: result.order.netAmount, isGuest, trackingUrl: `/order-tracking?orderNumber=${encodeURIComponent(result.order.orderNumber)}` }
        }))
    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : String(error)
        console.error('Order creation error:', error)
        await clearConversationState(sessionId)
        return NextResponse.json(createSuccessResponse({
            message: `❌ Không thể tạo đơn hàng: ${errorMessage}\n\nVui lòng thử lại hoặc liên hệ hỗ trợ.`,
            suggestions: ['Thử lại', 'Liên hệ hỗ trợ', 'Tiếp tục xem sản phẩm'],
            confidence: 0.5, sessionId, timestamp: new Date().toISOString()
        }))
    }
}
