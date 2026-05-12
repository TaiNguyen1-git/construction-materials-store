/**
 * Order Flow Handler - All order creation flows for customers
 * Handles: Smart AI order parsing, manual order items parsing,
 *          product clarification, order confirmation & DB creation
 */
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createSuccessResponse, createErrorResponse } from '@/lib/api-types'
import { AIService } from '@/lib/ai-service'
import { parseOrderItems, type OrderItem } from '@/lib/chatbot/entity-extractor'
import {
    type ConversationState,
    getConversationState,
    setConversationState,
    clearConversationState,
    startOrderCreationFlow,
    updateFlowData
} from '@/lib/chatbot/conversation-state'

// ─── Interfaces ───────────────────────────────────────────────────────────────

interface ChatMessage {
    role: 'user' | 'assistant' | 'system'
    content: string
}

interface EnrichedOrderItem {
    productName: string
    productId: string
    quantity: number
    unit: string
    selectedProduct: {
        id: string
        name: string
        price: number
        unit: string
        sku: string
    }
}

interface CustomerInfo {
    name: string
    phone: string
    email: string
    address: string
}

interface OrderEntities {
    orderNumber?: string
    phone?: string
    phoneNumber?: string
    rawMessage?: string
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const PLACEHOLDER_NAMES = [
    'nguyễn văn a', 'nguyen van a', 'nguyễn thị a', 'nguyen thi a',
    'nguyễn văn b', 'nguyen van b', 'nguyễn thị b', 'nguyen thi b',
    'anh a', 'chị a', 'chi a', 'anh b', 'chị b', 'chi b',
    'khách hàng', 'khach hang', 'customer', 'test', 'abc'
]
const PLACEHOLDER_PHONES = ['0912345678', '0123456789', '0987654321', '0909090909', '0900000000', '0111111111', '0999999999']

function isPlaceholderGuestInfo(info: { name?: string; phone?: string; address?: string } | undefined): boolean {
    if (!info) return true
    const nameLower = (info.name || '').toLowerCase().trim()
    const phoneTrimmed = (info.phone || '').replace(/\s/g, '')
    if (PLACEHOLDER_NAMES.some(p => nameLower === p || nameLower.includes(p))) return true
    if (PLACEHOLDER_PHONES.includes(phoneTrimmed)) return true
    return false
}

function sanitizeGuestInfo(info: { name?: string; phone?: string; address?: string } | undefined) {
    if (!info) return undefined
    if (isPlaceholderGuestInfo(info)) return undefined
    if (!info.name && !info.phone && !info.address) return undefined
    return { name: info.name || '', phone: info.phone || '', address: info.address || '' }
}

/**
 * Map Vietnamese colloquial product names to DB-searchable keywords
 */
export function extractProductKeywords(productName: string): string[] {
    const keywords: string[] = []
    const lower = productName.toLowerCase()

    if (lower.includes('cát tô') || lower.includes('cát xây tô')) keywords.push('cát xây dựng', 'cát')
    else if (lower.includes('cát san lấp') || lower.includes('cát vàng')) keywords.push('cát vàng', 'cát')
    else if (lower.includes('cát')) keywords.push('cát')

    if (lower.includes('insee')) keywords.push('INSEE')
    if (lower.includes('hà tiên')) keywords.push('Hà Tiên')
    if (lower.includes('xi măng') || lower.includes('ximang') || lower.includes('xi-măng')) keywords.push('xi măng')

    if (lower.includes('gạch ống') || lower.includes('gạch ong') || lower.includes('gach ong')) keywords.push('gạch ống', 'gạch')
    else if (lower.includes('gạch đỏ') || lower.includes('gạch đinh') || lower.includes('gach dinh')) keywords.push('gạch đinh', 'gạch đỏ', 'gạch')
    else if (lower.includes('gạch') || lower.includes('gach')) keywords.push('gạch')

    if (lower.includes('đá 1x2') || lower.includes('đá dăm') || lower.includes('da dam')) keywords.push('đá 1x2', 'đá')
    else if (lower.includes('đá mi') || lower.includes('đá mạt') || lower.includes('da mi')) keywords.push('đá mi', 'đá')
    else if (lower.includes('đá') || lower.includes('da ')) keywords.push('đá')

    if (lower.includes('thép') || lower.includes('sắt') || lower.includes('sat ') || lower.includes('thep')) keywords.push('thép')

    if (keywords.length === 0) {
        const words = productName.split(/\s+/).filter(w => w.length > 2)
        keywords.push(...(words.length > 0 ? words.slice(0, 2) : [productName]))
    }

    return keywords
}

// ─── Handle Order Create Intent ────────────────────────────────────────────────

export async function handleOrderCreateIntent(
    message: string,
    sessionId: string,
    customerId: string | undefined,
    conversationHistory: ChatMessage[]
) {
    // 1. Try AI-smart order parsing first
    const aiOrderRequest = await AIService.parseOrderRequest(message)

    if (aiOrderRequest && aiOrderRequest.items && aiOrderRequest.items.length > 0) {
        const enrichedItems: EnrichedOrderItem[] = []
        const itemsToClarify: Array<{ item: typeof aiOrderRequest.items[0]; products: { id: string; name: string; price: number; unit: string; sku: string }[] }> = []

        // Collect all keywords for all items to fetch in one query
        const itemsWithKeywords = aiOrderRequest.items.map(item => ({
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
                take: 50 // Fetch a reasonable batch
            })
            : []

        for (const { item, keywords } of itemsWithKeywords) {
            // Find products from the batch that match this specific item's keywords
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

            const initialItems = [...enrichedItems, ...itemsToClarify.map(x => ({ productName: x.item.productName, quantity: x.item.quantity || 1, unit: x.item.unit || 'cái' }))]
            const guestInfo = sanitizeGuestInfo({ name: aiOrderRequest.customerName || '', phone: aiOrderRequest.phone || '', address: aiOrderRequest.deliveryAddress || '' })
            await startOrderCreationFlow(sessionId, initialItems, !!customerId, guestInfo)
            await updateFlowData(sessionId, {
                pendingProductSelection: itemsToClarify.filter(({ products }) => products.length > 0),
                vatInfo: aiOrderRequest.vatInfo
            })

            return NextResponse.json(createSuccessResponse({
                message: clarificationMessages.join('\n\n'),
                suggestions: ['Chọn sản phẩm', 'Hủy'], confidence: 0.9, sessionId, timestamp: new Date().toISOString()
            }))
        }

        if (enrichedItems.length > 0) {
            const guestInfoFromAI = sanitizeGuestInfo({ name: aiOrderRequest.customerName || '', phone: aiOrderRequest.phone || '', address: aiOrderRequest.deliveryAddress || '' })
            await startOrderCreationFlow(sessionId, enrichedItems, !!customerId, guestInfoFromAI)
            if (aiOrderRequest.vatInfo) await updateFlowData(sessionId, { vatInfo: aiOrderRequest.vatInfo })

            const hasGuestInfo = aiOrderRequest.customerName && aiOrderRequest.phone && aiOrderRequest.deliveryAddress
            const needsInfo = !customerId && !hasGuestInfo
            let infoSummary = ''
            if (aiOrderRequest.customerName || aiOrderRequest.phone || aiOrderRequest.deliveryAddress) {
                infoSummary = '\n\n📍 **Thông tin giao hàng:**\n' +
                    `- Tên: ${aiOrderRequest.customerName || '(thiếu)'}\n` +
                    `- SĐT: ${aiOrderRequest.phone || '(thiếu)'}\n` +
                    `- Địa chỉ: ${aiOrderRequest.deliveryAddress || '(thiếu)'}`
            }
            if (aiOrderRequest.vatInfo) {
                infoSummary += '\n\n🧾 **Thông tin hóa đơn VAT:**\n' +
                    `- Công ty: ${aiOrderRequest.vatInfo.companyName}\n` +
                    `- MST: ${aiOrderRequest.vatInfo.taxId}\n` +
                    `- Địa chỉ: ${aiOrderRequest.vatInfo.companyAddress}`
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
    }

    // 2. Fallback: Button click "Đặt hàng"
    const lowerMessage = message.toLowerCase().trim()
    const isButtonClick = lowerMessage === 'đặt hàng ngay' || lowerMessage === 'đặt hàng' || lowerMessage === 'order now'

    if ((lowerMessage === 'đặt hàng' || lowerMessage === 'order' || lowerMessage.includes('đặt hàng')) && !lowerMessage.match(/\d+/)) {
        // Try to infer product from conversation history
        const recentProductMessages = conversationHistory.filter(h => h.role === 'assistant').reverse().slice(0, 5)
        let foundProduct: { id: string; name: string; price: number; unit: string; sku: string } | null = null

        const currentState = await getConversationState(sessionId)
        if (currentState && currentState.data?.lastSearchedProduct) foundProduct = currentState.data.lastSearchedProduct

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

                    const listMatch = msg.content.match(/\d+\.\s*(?:Xi măng|Gạch|Cát|Đá|Sơn|Tôn|Thép)\s+([A-Z0-9\s]+)/i)
                    if (listMatch) {
                        const productName = listMatch[0].replace(/^\d+\.\s*/, '').replace(/\*\*/g, '').trim()
                        foundProduct = await prisma.product.findFirst({ where: { name: { contains: productName, mode: 'insensitive' }, isActive: true }, select: { id: true, name: true, price: true, unit: true, sku: true } })
                        if (foundProduct) break
                    }
                }
            }
        }

        if (!foundProduct) {
            for (const msg of recentProductMessages) {
                if (msg.content && msg.content.includes('Tìm thấy')) {
                    const firstProductMatch = msg.content.match(/\d+\.\s*\*\*([^*]+)\*\*/)
                    if (firstProductMatch) {
                        foundProduct = await prisma.product.findFirst({ where: { name: { contains: firstProductMatch[1].trim(), mode: 'insensitive' }, isActive: true }, select: { id: true, name: true, price: true, unit: true, sku: true } })
                        if (foundProduct) break
                    }
                }
            }
        }

        if (foundProduct) {
            const defaultUnit = foundProduct.unit || 'bao'
            await startOrderCreationFlow(sessionId, [{ productName: foundProduct.name, quantity: 1, unit: defaultUnit, productId: foundProduct.id }], !!customerId)
            const needsInfo = !customerId
            return NextResponse.json(createSuccessResponse({
                message: '🛒 **Xác nhận đặt hàng**\n\n' +
                    `**Sản phẩm:** ${foundProduct.name}\n` +
                    `**Số lượng:** 1 ${defaultUnit}\n` +
                    `**Giá:** ${foundProduct.price.toLocaleString('vi-VN')}đ/${defaultUnit}\n\n` +
                    '💡 *Bạn có muốn thay đổi số lượng không?*\n\n✅ Xác nhận đặt hàng?' +
                    (needsInfo ? '\n\n⚠️ *Bạn chưa đăng nhập. Chúng tôi sẽ hỏi thông tin giao hàng sau khi xác nhận.*' : ''),
                suggestions: needsInfo ? ['Xác nhận', 'Đăng nhập', 'Chỉnh sửa số lượng', 'Hủy'] : ['Xác nhận', 'Chỉnh sửa số lượng', 'Hủy'],
                confidence: 0.9, sessionId, timestamp: new Date().toISOString()
            }))
        }
    }

    // 3. Parse items from raw message text
    const parsedItems = parseOrderItems(message)
    if (parsedItems.length > 0) {
        const itemsToClarify: Array<{ item: OrderItem; products: Record<string, unknown>[] }> = []
        for (const item of parsedItems) {
            const matchingProducts = await prisma.product.findMany({
                where: { OR: [{ name: { contains: item.productName, mode: 'insensitive' } }, { description: { contains: item.productName, mode: 'insensitive' } }], isActive: true },
                select: { id: true, name: true, price: true, unit: true, sku: true }, take: 10
            })
            if (matchingProducts.length !== 1) itemsToClarify.push({ item, products: matchingProducts })
        }

        if (itemsToClarify.length > 0) {
            const clarificationMessages = itemsToClarify.map(({ item, products }) =>
                products.length > 1
                    ? `🔍 Tìm thấy **${products.length}** loại **${item.productName}**:\n\n` +
                    products.map((p, idx) => {
                        const product = p as { name: string; price: number; unit: string }
                        return `${idx + 1}. ${product.name} - ${product.price.toLocaleString('vi-VN')}đ/${product.unit}`
                    }).join('\n') +
                    `\n\n💡 Bạn muốn chọn loại nào? (Ví dụ: "1" hoặc "${(products[0] as { name: string }).name}")`
                    : `❌ Không tìm thấy sản phẩm **${item.productName}** trong hệ thống.\n💡 Vui lòng chọn sản phẩm khác hoặc liên hệ hỗ trợ.`
            )

            if (clarificationMessages.length > 0) {
                await startOrderCreationFlow(sessionId, parsedItems, !!customerId)
                await updateFlowData(sessionId, { pendingProductSelection: itemsToClarify.filter(({ products }) => products.length > 0) })
                return NextResponse.json(createSuccessResponse({
                    message: clarificationMessages.join('\n\n'),
                    suggestions: ['Chọn sản phẩm', 'Hủy', 'Tìm sản phẩm khác'],
                    confidence: 0.8, sessionId, timestamp: new Date().toISOString()
                }))
            }
        }

        await startOrderCreationFlow(sessionId, parsedItems, !!customerId)
        const needsInfo = !customerId
        return NextResponse.json(createSuccessResponse({
            message: '🛒 **Xác nhận đặt hàng**\n\nDanh sách sản phẩm:\n' +
                parsedItems.map((item, idx) => `${idx + 1}. ${item.productName}: ${item.quantity} ${item.unit}`).join('\n') +
                '\n\n✅ Xác nhận đặt hàng?' +
                (needsInfo ? '\n\n⚠️ *Bạn chưa đăng nhập. Chúng tôi sẽ hỏi thông tin giao hàng sau khi xác nhận.*' : '\n\n💡 *Hệ thống sẽ tự động tìm sản phẩm phù hợp trong kho*'),
            suggestions: needsInfo ? ['Xác nhận', 'Đăng nhập', 'Hủy'] : ['Xác nhận', 'Chỉnh sửa', 'Hủy'],
            confidence: 0.85, sessionId, timestamp: new Date().toISOString()
        }))
    }

    // 4. Check for stored calculation data ("Đặt hàng ngay" from material calculator)
    const currentState = await getConversationState(sessionId)
    if (isButtonClick && currentState != null && currentState.data?.lastCalculation?.length > 0) {
        const items = currentState.data.lastCalculation
        const storedGuestInfo = currentState.data.guestInfo
        await startOrderCreationFlow(sessionId, items, !!customerId, storedGuestInfo)

        const hasCompleteGuestInfo = storedGuestInfo?.name && storedGuestInfo?.phone && storedGuestInfo?.address
        let guestInfoDisplay = ''
        if (storedGuestInfo && (storedGuestInfo.name || storedGuestInfo.phone || storedGuestInfo.address)) {
            guestInfoDisplay = '\n\n📍 **Thông tin giao hàng:**\n' +
                `- Tên: ${storedGuestInfo.name || '(thiếu)'}\n` +
                `- SĐT: ${storedGuestInfo.phone || '(thiếu)'}\n` +
                `- Địa chỉ: ${storedGuestInfo.address || '(thiếu)'}`
        }

        return NextResponse.json(createSuccessResponse({
            message: '🛒 **Xác nhận đặt hàng**\n\nDanh sách vật liệu từ tính toán:\n' +
                items.map((item: { productName: string; quantity: number; unit: string }, idx: number) => `${idx + 1}. ${item.productName}: ${item.quantity} ${item.unit}`).join('\n') +
                guestInfoDisplay + '\n\n✅ Xác nhận đặt hàng?' +
                (hasCompleteGuestInfo ? '' : '\n\n⚠️ *Bạn chưa đăng nhập. Chúng tôi sẽ hỏi thông tin giao hàng sau khi xác nhận.*'),
            suggestions: ['Xác nhận', 'Đăng nhập', 'Hủy'],
            confidence: 0.95, sessionId, timestamp: new Date().toISOString()
        }))
    }

    if (!isButtonClick && currentState?.data?.lastCalculation) await clearConversationState(sessionId)

    // 5. Check conversation history for previous material calculations
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
        if (items.length === 0) {
            if (recentCalc.content.includes('Xi măng')) items.push({ productName: 'Xi măng', quantity: 10, unit: 'bao' })
            if (recentCalc.content.includes('Gạch')) items.push({ productName: 'Gạch', quantity: 50, unit: 'm²' })
            if (recentCalc.content.includes('Cát')) items.push({ productName: 'Cát xây dựng', quantity: 1, unit: 'm³' })
        }

        if (items.length > 0) {
            await startOrderCreationFlow(sessionId, items)
            return NextResponse.json(createSuccessResponse({
                message: '🛒 **Xác nhận đặt hàng**\n\nDanh sách vật liệu từ tính toán:\n' +
                    items.map((item, idx) => `${idx + 1}. ${item.productName}: ${item.quantity} ${item.unit}`).join('\n') +
                    '\n\n✅ Xác nhận đặt hàng?\n\n⚠️ *Bạn chưa đăng nhập. Chúng tôi sẽ hỏi thông tin giao hàng sau khi xác nhận.*',
                suggestions: ['Xác nhận', 'Đăng nhập', 'Hủy'],
                confidence: 0.9, sessionId, timestamp: new Date().toISOString()
            }))
        }
    }

    return NextResponse.json(createSuccessResponse({
        message: '❓ Bạn muốn đặt hàng gì? Vui lòng cho tôi biết cụ thể:\n\n' +
            '📝 **Ví dụ:**\n- "Tôi muốn mua 10 bao xi măng"\n- "Đặt 20 viên gạch và 5 m³ cát"\n- "50 bao xi măng PC40 Insee"\n\nHoặc bạn có thể tính toán vật liệu trước!',
        suggestions: ['Tính toán vật liệu', 'Xem sản phẩm', 'Ví dụ'],
        confidence: 0.7, sessionId, timestamp: new Date().toISOString()
    }))
}

// ─── Create Order in DB ────────────────────────────────────────────────────────

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
                    select: { id: true, name: true, price: true, unit: true, sku: true }
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

// ─── Handle CRUD Execution (flow confirmation) ────────────────────────────────

/**
 * Handle Order Query Intent
 */
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

/**
 * Handle Order Manage Intent
 */
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

/**
 * Handle CRUD Execution (flow confirmation)
 */
export async function handleCRUDExecution(
    sessionId: string,
    state: ConversationState,
    userRole: string
) {
    try {
        const crudData = state.data
        const { executeAction } = await import('@/lib/chatbot/action-handler')
        const actionResult = await executeAction({
            action: crudData.action,
            entityType: crudData.entityType,
            entities: crudData.entityData || {},
            rawMessage: crudData.previewMessage || '',
            userId: '',
            userRole
        })
        await clearConversationState(sessionId)
        return NextResponse.json(createSuccessResponse({
            message: actionResult.message,
            suggestions: ['Tiếp tục', 'Quay lại'],
            confidence: actionResult.success ? 0.9 : 0.5, sessionId, timestamp: new Date().toISOString()
        }))
    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : String(error)
        console.error('CRUD execution error:', error)
        return NextResponse.json(createErrorResponse(`Failed to execute action: ${errorMessage}`, 'EXECUTION_ERROR'), { status: 500 })
    }
}

