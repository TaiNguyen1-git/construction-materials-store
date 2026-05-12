import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createSuccessResponse } from '@/lib/api-types'
import { AIService } from '@/lib/ai-service'
import { parseOrderItems } from '@/lib/chatbot/entity-extractor'
import {
    getConversationState,
    clearConversationState,
    startOrderCreationFlow,
    updateFlowData
} from '@/lib/chatbot/conversation-state'
import { ChatMessage, EnrichedOrderItem, GuestInfo, VatInfo } from './types'
import { sanitizeGuestInfo, extractProductKeywords } from './utils'

/**
 * Common logic to take a list of (potential) items, enrich them with DB data,
 * and either ask for clarification or show a confirmation message.
 */
async function handleEnrichedOrderItems(
    items: Array<{ productName: string, quantity: number, unit?: string }>,
    sessionId: string,
    customerId: string | undefined,
    initialGuestInfo?: GuestInfo,
    initialVatInfo?: VatInfo
) {
    const enrichedItems: EnrichedOrderItem[] = []
    const itemsToClarify: Array<{ item: { productName: string; quantity: number; unit?: string }; products: { id: string; name: string; price: number; unit: string; sku: string }[] }> = []

    // Collect all keywords for all items to fetch in one query
    const itemsWithKeywords = items.map(item => ({
        item,
        keywords: extractProductKeywords(item.productName)
    }))

    const allORConditions = itemsWithKeywords.flatMap(({ keywords }: { keywords: string[] }) => 
        keywords.flatMap((kw: string) => [
            { name: { contains: kw, mode: 'insensitive' as const } },
            { description: { contains: kw, mode: 'insensitive' as const } }
        ])
    )

    const allMatchingProducts = allORConditions.length > 0 
        ? await prisma.product.findMany({
            where: { OR: allORConditions, isActive: true },
            select: { id: true, name: true, price: true, unit: true, sku: true },
            take: 50
        })
        : []

    for (const { item, keywords } of itemsWithKeywords) {
        const matchingProducts = allMatchingProducts.filter(p => 
            keywords.some(kw => 
                p.name.toLowerCase().includes(kw.toLowerCase()) || 
                (p.sku && p.sku.toLowerCase().includes(kw.toLowerCase()))
            )
        ).slice(0, 5)

        if (matchingProducts.length === 1) {
            enrichedItems.push({ 
                productName: matchingProducts[0].name, 
                productId: matchingProducts[0].id, 
                quantity: item.quantity || 1, 
                unit: matchingProducts[0].unit, 
                selectedProduct: matchingProducts[0] 
            })
        } else {
            itemsToClarify.push({ item, products: matchingProducts })
        }
    }

    if (itemsToClarify.length > 0) {
        const clarificationMessages = itemsToClarify.map(({ item, products }) =>
            products.length > 1
                ? `🔍 Tìm thấy **${products.length}** loại **${item.productName}**:\n\n` +
                products.map((p, idx) => `${idx + 1}. ${p.name} - ${p.price.toLocaleString('vi-VN')}đ/${p.unit}`).join('\n') +
                `\n\n💡 Bạn muốn chọn loại nào? (Ví dụ: "1" hoặc "${products[0].name}")`
                : `❌ Không tìm thấy sản phẩm **${item.productName}** trong hệ thống.\n💡 Vui lòng chọn sản phẩm khác hoặc liên hệ hỗ trợ.`
        )

        const finalItems = [...enrichedItems, ...itemsToClarify.map(x => ({ productName: x.item.productName, quantity: x.item.quantity || 1, unit: x.item.unit || 'cái' }))]
        await startOrderCreationFlow(sessionId, finalItems, !!customerId, initialGuestInfo)
        await updateFlowData(sessionId, {
            pendingProductSelection: itemsToClarify.filter(({ products }) => products.length > 0),
            vatInfo: initialVatInfo
        })

        return NextResponse.json(createSuccessResponse({
            message: clarificationMessages.join('\n\n'),
            suggestions: ['Chọn sản phẩm', 'Hủy'], confidence: 0.9, sessionId, timestamp: new Date().toISOString()
        }))
    }

    if (enrichedItems.length > 0) {
        await startOrderCreationFlow(sessionId, enrichedItems, !!customerId, initialGuestInfo)
        if (initialVatInfo) await updateFlowData(sessionId, { vatInfo: initialVatInfo })

        const hasGuestInfo = initialGuestInfo?.name && initialGuestInfo?.phone && initialGuestInfo?.address
        const needsInfo = !customerId && !hasGuestInfo
        let infoSummary = ''
        if (initialGuestInfo?.name || initialGuestInfo?.phone || initialGuestInfo?.address) {
            infoSummary = '\n\n📍 **Thông tin giao hàng:**\n' +
                `- Tên: ${initialGuestInfo.name || '(thiếu)'}\n` +
                `- SĐT: ${initialGuestInfo.phone || '(thiếu)'}\n` +
                `- Địa chỉ: ${initialGuestInfo.address || '(thiếu)'}`
        }
        if (initialVatInfo) {
            infoSummary += '\n\n🧾 **Thông tin hóa đơn VAT:**\n' +
                `- Công ty: ${initialVatInfo.companyName}\n` +
                `- MST: ${initialVatInfo.taxId}\n` +
                `- Địa chỉ: ${initialVatInfo.companyAddress}`
        }

        return NextResponse.json(createSuccessResponse({
            message: '🛒 **Xác nhận đặt hàng**\n\nDanh sách sản phẩm:\n' +
                enrichedItems.map((item, idx) => `${idx + 1}. ${item.productName}: ${item.quantity} ${item.unit}`).join('\n') +
                infoSummary + '\n\n✅ Xác nhận đặt hàng?' +
                (needsInfo ? '\n\n⚠️ *Bạn chưa đăng nhập. Chúng tôi sẽ hỏi thông tin giao hàng còn thiếu sau khi xác nhận.*' : ''),
            suggestions: needsInfo ? ['Xác nhận', 'Đăng nhập', 'Hủy'] : ['Xác nhận', 'Chỉnh sửa', 'Hủy'],
            confidence: 0.95, sessionId, timestamp: new Date().toISOString()
        }))
    }

    return NextResponse.json(createSuccessResponse({
        message: '❌ Không tìm thấy sản phẩm phù hợp. Vui lòng thử lại với tên sản phẩm cụ thể hơn.',
        suggestions: ['Thử lại', 'Xem sản phẩm'], confidence: 0.5, sessionId, timestamp: new Date().toISOString()
    }))
}

export async function handleOrderCreateIntent(
    message: string,
    sessionId: string,
    customerId: string | undefined,
    conversationHistory: ChatMessage[]
) {
    // 0. Check for order modification if we are in confirmation step
    const currentState = await getConversationState(sessionId)
    const isModification = currentState && 
                          currentState.flow === 'ORDER_CREATION' && 
                          currentState.data.currentStep === 'confirm_items' && 
                          currentState.data.items && 
                          ['bỏ', 'xóa', 'thêm', 'tăng', 'giảm', 'đổi', 'thay', 'chỉnh', 'sửa', 'cộng', 'trừ']
                          .some(kw => message.toLowerCase().includes(kw))

    if (isModification) {
        const currentItems = (currentState.data.items as Array<{ productName: string; quantity: number; unit: string }>).map(it => ({
            productName: it.productName,
            quantity: it.quantity,
            unit: it.unit
        }))
        const updatedItems = await AIService.modifyOrderRequest(currentItems, message)
        
        if (updatedItems && updatedItems.length > 0) {
            return handleEnrichedOrderItems(updatedItems, sessionId, customerId, currentState.data.guestInfo, currentState.data.vatInfo || undefined)
        }
    }

    // 1. Try AI-smart order parsing first
    const aiOrderRequest = await AIService.parseOrderRequest(message)

    if (aiOrderRequest && aiOrderRequest.items && aiOrderRequest.items.length > 0) {
        const guestInfo = sanitizeGuestInfo({ 
            name: aiOrderRequest.customerName || '', 
            phone: aiOrderRequest.phone || '', 
            address: aiOrderRequest.deliveryAddress || '' 
        })
        return handleEnrichedOrderItems(aiOrderRequest.items, sessionId, customerId, guestInfo, aiOrderRequest.vatInfo || undefined)
    }

    // 2. Fallback: Button click "Đặt hàng"
    const lowerMessage = message.toLowerCase().trim()
    const isButtonClick = lowerMessage === 'đặt hàng ngay' || lowerMessage === 'đặt hàng' || lowerMessage === 'order now'

    if ((lowerMessage === 'đặt hàng' || lowerMessage === 'order' || lowerMessage.includes('đặt hàng')) && !lowerMessage.match(/\d+/)) {
        const recentProductMessages = conversationHistory.filter(h => h.role === 'assistant').reverse().slice(0, 5)
        let foundProduct: { id: string; name: string; price: number; unit: string; sku: string } | null = null

        const state = currentState || await getConversationState(sessionId)
        if (state && state.data?.lastSearchedProduct) foundProduct = state.data.lastSearchedProduct

        if (!foundProduct) {
            for (const msg of recentProductMessages) {
                if (msg.content) {
                    const productPatterns = [
                        /(Xi măng\s+[A-Z0-9\s]+)/i, /(Gạch\s+[A-Z0-9\s]+)/i, /(Cát\s+[A-Z0-9\s]+)/i,
                        /(Đá\s+[A-Z0-9\s]+)/i, /(Sơn\s+[A-Z0-9\s]+)/i, /(Tôn\s+[A-Z0-9\s]+)/i, /(Thép\s+[A-Z0-9\s]+)/i,
                    ]
                    for (const pattern of productPatterns) {
                        const match = msg.content.match(pattern)
                        if (match) {
                            foundProduct = await prisma.product.findFirst({ where: { name: { contains: match[1].trim(), mode: 'insensitive' }, isActive: true }, select: { id: true, name: true, price: true, unit: true, sku: true } })
                            if (foundProduct) break
                        }
                    }
                    if (foundProduct) break
                }
            }
        }

        if (foundProduct) {
            return handleEnrichedOrderItems([{ productName: foundProduct.name, quantity: 1, unit: foundProduct.unit }], sessionId, customerId)
        }
    }

    // 3. Parse items from raw message text
    const parsedItems = parseOrderItems(message)
    if (parsedItems.length > 0) {
        return handleEnrichedOrderItems(parsedItems, sessionId, customerId)
    }

    // 4. Check for stored calculation data
    const state = currentState || await getConversationState(sessionId)
    if (isButtonClick && state != null && state.data?.lastCalculation?.length > 0) {
        return handleEnrichedOrderItems(state.data.lastCalculation, sessionId, customerId, state.data.guestInfo)
    }

    if (!isButtonClick && state?.data?.lastCalculation) await clearConversationState(sessionId)

    // 5. Check history for calculations
    const recentCalc = [...conversationHistory].reverse().find((h: { role: string; content: string }) =>
        h.role === 'assistant' && (h.content.includes('KẾT QUẢ TÍNH TOÁN') || h.content.includes('DANH SÁCH VẬT LIỆU'))
    )

    if (recentCalc) {
        const items: Array<{ productName: string; quantity: number; unit: string }> = []
        const materialPattern = /•\s*([^:]+):\s*([0-9.]+)\s*([^\n\(]+)/g
        let match
        while ((match = materialPattern.exec(recentCalc.content)) !== null) {
            const productName = match[1].trim()
            const quantity = parseFloat(match[2])
            const unit = match[3].trim()
            if (productName && quantity > 0) items.push({ productName, quantity, unit })
        }
        if (items.length > 0) {
            return handleEnrichedOrderItems(items, sessionId, customerId)
        }
    }

    return NextResponse.json(createSuccessResponse({
        message: '❓ Bạn muốn đặt hàng gì? Vui lòng cho tôi biết cụ thể:\n\n' +
            '📝 **Ví dụ:**\n- "Tôi muốn mua 10 bao xi măng"\n- "Đặt 20 viên gạch và 5 m³ cát"\n- "50 bao xi măng PC40 Insee"\n\nHoặc bạn có thể tính toán vật liệu trước!',
        suggestions: ['Tính toán vật liệu', 'Xem sản phẩm', 'Ví dụ'],
        confidence: 0.7, sessionId, timestamp: new Date().toISOString()
    }))
}
