/**
 * Customer Handler - Customer-facing product search, price inquiry & material calculation
 */
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createSuccessResponse } from '@/lib/api-types'
import { RAGService } from '@/lib/rag-service'
import { AIService } from '@/lib/ai-service'
import { materialCalculator } from '@/lib/material-calculator-service'
import { setConversationState } from '@/lib/chatbot/conversation-state'
import { isAIEnabled } from '@/lib/ai-config'
import { aiCache } from '@/lib/ai-cache'
import { generateChatbotFallbackResponse } from '@/app/api/chatbot/fallback-responses'

// ─── Product Search ────────────────────────────────────────────────────────────

export async function handleProductSearch(message: string, sessionId: string) {
    try {
        const cleanedMessage = message.replace(/[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '').trim()
        const productKeywords = cleanedMessage.toLowerCase()
            .replace(/tim|search|co|ban|sell|muon|can|mua|dat|phu hop|san pham/g, '')
            .trim()

        // Handle generic suggestion clicks like "Tìm sản phẩm phù hợp" or "Xem sản phẩm"
        if (!productKeywords || productKeywords.length < 2) {
            return NextResponse.json(createSuccessResponse({
                message: `🛒 **Bạn đang tìm kiếm loại vật liệu nào?**\n\nHệ thống có đầy đủ các loại vật liệu xây dựng tốt nhất. Bạn có thể thử tìm theo:\n\n- 🏗️ **Xi măng, Thép, Sắt**\n- 🧱 **Gạch, Cát, Đá**\n- 🎨 **Sơn, Keo, Chống thấm**\n- 🏠 **Mái ngói, Tôn**\n\nBạn muốn xem báo giá loại nào ạ?`,
                suggestions: ['Xi măng INSEE', 'Thép Hòa Phát', 'Báo giá gạch ống', 'Cát xây tô'],
                confidence: 1.0, sessionId, timestamp: new Date().toISOString()
            }))
        }

        const products = await prisma.product.findMany({
            where: {
                OR: [
                    { name: { contains: productKeywords, mode: 'insensitive' } },
                    { description: { contains: productKeywords, mode: 'insensitive' } },
                    { tags: { hasSome: [productKeywords] } }
                ],
                isActive: true
            },
            include: { category: true, inventoryItem: true, productReviews: { where: { isPublished: true }, select: { rating: true } } },
            take: 5
        })

        if (products.length > 0) {
            const productList = products.map((p, idx) => {
                const avgRating = p.productReviews.length > 0
                    ? (p.productReviews.reduce((sum, r) => sum + r.rating, 0) / p.productReviews.length).toFixed(1)
                    : 'Chưa có đánh giá'
                const inStock = p.inventoryItem ? p.inventoryItem.availableQuantity > 0 : false
                const stockText = inStock ? `✅ Còn ${p.inventoryItem?.availableQuantity || 0} ${p.unit}` : '❌ Hết hàng'
                return `${idx + 1}. **${p.name}**\n` +
                    `   - Giá: ${p.price.toLocaleString()}đ/${p.unit}\n` +
                    `   - ${stockText}\n` +
                    `   - Đánh giá: ${avgRating} ⭐ (${p.productReviews.length} reviews)\n` +
                    `   - Danh mục: ${p.category.name}`
            }).join('\n\n')

            return NextResponse.json(createSuccessResponse({
                message: `🔍 **Tìm thấy ${products.length} sản phẩm:**\n\n${productList}\n\n💡 Nhấn "Xem chi tiết" để xem thêm thông tin hoặc "Đặt hàng" để mua ngay!`,
                suggestions: ['Xem chi tiết', 'Đặt hàng', 'So sánh giá'],
                productRecommendations: products.map(p => ({ id: p.id, name: p.name, price: p.price, unit: p.unit, image: p.images[0] || '/placeholder.png', inStock: p.inventoryItem ? p.inventoryItem.availableQuantity > 0 : false })),
                confidence: 0.90, sessionId, timestamp: new Date().toISOString()
            }))
        }

        return NextResponse.json(createSuccessResponse({
            message: `❌ Không tìm thấy sản phẩm **"${productKeywords}"**\n\n💡 **Gợi ý:**\n- Thử tìm với từ khóa khác (vd: "xi măng", "gạch ống")\n- Xem danh mục sản phẩm\n- Liên hệ tư vấn: 1900-xxxx`,
            suggestions: ['Xem tất cả sản phẩm', 'Tư vấn', 'Tìm khác'],
            confidence: 0.80, sessionId, timestamp: new Date().toISOString()
        }))
    } catch (error) {
        console.error('Product search error:', error)
        return null // Fall through to RAG
    }
}

// ─── Price Inquiry ─────────────────────────────────────────────────────────────

export async function handlePriceInquiry(message: string, sessionId: string) {
    try {
        const cleanedMessage = message.replace(/[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '').trim()
        const productKeywords = cleanedMessage.toLowerCase()
            .replace(/gia|price|bao nhieu|tien|cost|so sanh/g, '')
            .trim()

        if (!productKeywords || productKeywords.length < 2) {
            return NextResponse.json(createSuccessResponse({
                message: `💰 **Bạn muốn xem báo giá của sản phẩm nào hôm nay?**\n\nVui lòng nhập tên sản phẩm hoặc chọn bên dưới để xem giá mới nhất:`,
                suggestions: ['Giá Xi măng', 'Giá Sắt thép', 'Giá Gạch xây', 'Khuyến mãi'],
                confidence: 1.0, sessionId, timestamp: new Date().toISOString()
            }))
        }

        const products = await prisma.product.findMany({
            where: {
                OR: [{ name: { contains: productKeywords, mode: 'insensitive' } }, { description: { contains: productKeywords, mode: 'insensitive' } }],
                isActive: true
            },
            include: { category: true, inventoryItem: true },
            take: 3
        })

        if (products.length > 0) {
            const priceList = products.map((p, idx) => `${idx + 1}. **${p.name}**: ${p.price.toLocaleString()}đ/${p.unit}`).join('\n')
            return NextResponse.json(createSuccessResponse({
                message: `💰 **Bảng giá:**\n\n${priceList}\n\n💡 Giá đã bao gồm VAT. Liên hệ để được báo giá số lượng lớn!`,
                suggestions: ['Đặt hàng', 'So sánh', 'Xem chi tiết'],
                confidence: 0.90, sessionId, timestamp: new Date().toISOString()
            }))
        }

        return null // Not found → fall through to RAG
    } catch (error) {
        console.error('Price inquiry error:', error)
        return null
    }
}

// ─── Material Calculation ──────────────────────────────────────────────────────

export async function handleMaterialCalculation(
    message: string,
    sessionId: string
) {
    try {
        const calcInput = await materialCalculator.parseQueryWithAI(message)

        if (calcInput) {
            const calcResult = await materialCalculator.quickCalculate(calcInput)
            const formattedResponse = materialCalculator.formatForChat(calcResult)

            const calcItems = calcResult.materials?.map(m => ({ productName: m.material, quantity: m.quantity, unit: m.unit })) || []

            // Try to extract guest info for later use
            let guestInfoFromMessage: Record<string, string> | undefined
            try {
                const parsedInfo = await AIService.parseOrderRequest(message)
                if (parsedInfo && (parsedInfo.customerName || parsedInfo.phone || parsedInfo.deliveryAddress)) {
                    guestInfoFromMessage = { name: parsedInfo.customerName || '', phone: parsedInfo.phone || '', address: parsedInfo.deliveryAddress || '' }
                }
            } catch { /* ignore */ }

            if (calcItems.length > 0) {
                await setConversationState(sessionId, 'NONE', 0, {
                    lastCalculation: calcItems,
                    calculationTotal: calcResult.totalEstimatedCost,
                    guestInfo: guestInfoFromMessage
                })
            }

            return NextResponse.json(createSuccessResponse({
                message: formattedResponse,
                suggestions: ['Đặt hàng ngay', 'Điều chỉnh', 'Tính lại'],
                confidence: 0.92, sessionId, timestamp: new Date().toISOString(),
                calculationData: calcResult
            }))
        }

        return NextResponse.json(createSuccessResponse({
            message: `🏗️ **Tính toán vật liệu xây dựng**\n\nVui lòng cho tôi biết thêm thông tin:\n- Diện tích cần xây: bao nhiêu m²?\n- Loại công trình: nhà, tường, sàn,...?\n- Số tầng (nếu có)\n\n📝 **Ví dụ:**\n- "Tính vật liệu cho nhà 100m² x 3 tầng"\n- "Tính xi măng cho sàn 50m²"\n- "Cần bao nhiêu gạch cho tường 30m²"`,
            suggestions: ['Ví dụ', 'Tư vấn'],
            confidence: 0.70, sessionId, timestamp: new Date().toISOString()
        }))
    } catch (error) {
        console.error('Calculation error:', error)
        return null
    }
}

// ─── Rule-Based Comparison (with RAG enrichment) ───────────────────────────────

export async function handleComparisonQuery(
    comparisonProducts: string[],
    sessionId: string
) {
    const { generateComparisonResponse } = await import('@/lib/chatbot/rule-based-responses')
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const comparisonData: any[] = []

    for (const productKeyword of comparisonProducts) {
        const ragProducts = await RAGService.retrieveContext(productKeyword, 1)
        if (ragProducts.length > 0) {
            const ragProduct = ragProducts[0]
            comparisonData.push({ name: ragProduct.name, brand: ragProduct.brand, price: ragProduct.pricing.basePrice, unit: ragProduct.pricing.unit, description: ragProduct.description, usage: ragProduct.usage, quality: ragProduct.quality })
        } else {
            const dbProduct = await prisma.product.findFirst({
                where: { OR: [{ name: { contains: productKeyword, mode: 'insensitive' } }, { description: { contains: productKeyword, mode: 'insensitive' } }], isActive: true },
                select: { name: true, price: true, unit: true, description: true }
            })
            if (dbProduct) comparisonData.push({ name: dbProduct.name, price: dbProduct.price, unit: dbProduct.unit, description: dbProduct.description })
        }
    }

    if (comparisonData.length >= 2) {
        const comparisonResponse = generateComparisonResponse(comparisonData)
        return NextResponse.json(createSuccessResponse({
            message: comparisonResponse,
            suggestions: ['Đặt hàng', 'Tư vấn thêm', 'Xem giá chi tiết'],
            confidence: 1.0, sessionId, timestamp: new Date().toISOString()
        }))
    }

    return null // Not enough products found
}

// ─── Rule-Based Price Lookup ───────────────────────────────────────────────────

export async function handleRuleBasedPriceLookup(
    productKeyword: string,
    suggestions: string[],
    sessionId: string
) {
    const products = await prisma.product.findMany({
        where: {
            OR: [
                { name: { contains: productKeyword, mode: 'insensitive' } },
                { category: { name: { contains: productKeyword, mode: 'insensitive' } } }
            ],
            isActive: true
        },
        select: { name: true, price: true, unit: true, category: { select: { name: true } } },
        take: 5,
        orderBy: { price: 'asc' }
    })

    if (products.length > 0) {
        const priceList = products.map((p, idx) => `${idx + 1}. **${p.name}**: ${p.price.toLocaleString('vi-VN')}đ/${p.unit}`).join('\n')
        return NextResponse.json(createSuccessResponse({
            message: `💰 **Bảng giá ${productKeyword}**\n\n${priceList}\n\n💡 Giảm 5-8% khi mua số lượng lớn!`,
            suggestions: suggestions || ['Đặt hàng', 'Tính vật liệu', 'So sánh'],
            confidence: 1.0, sessionId, timestamp: new Date().toISOString()
        }))
    }

    return null
}

// ─── AI / RAG Fallback ─────────────────────────────────────────────────────────

export async function generateChatbotResponse(
    message: string,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    context?: any,
    conversationHistory?: { role: string; content: string }[],
    isAdmin: boolean = false
): Promise<{ response: string; suggestions: string[]; productRecommendations?: unknown[]; confidence: number }> {
    // 1. Cache hit
    const cachedResponse = await aiCache.get<{ response: string; suggestions: string[]; productRecommendations?: unknown[]; confidence: number }>(message, { isAdmin, ...context })
    if (cachedResponse) {
        console.log('[AI-CACHE] Hit for:', message)
        return cachedResponse
    }

    // 2. Live AI
    if (isAIEnabled()) {
        try {
            const response = await AIService.generateChatbotResponse(message, context, conversationHistory, isAdmin)
            if (response.confidence > 0.7) await aiCache.set(message, response, 30 * 60, { isAdmin, ...context }) // 30 min in seconds
            return response
        } catch (error) {
            console.error('AI Service failed, falling back to static response:', error)
        }
    }

    // 3. Static fallback
    return generateChatbotFallbackResponse(message, isAdmin)
}

// ─── Conversation History Loader ───────────────────────────────────────────────

export async function getConversationHistory(sessionId: string) {
    const interactions = await prisma.customerInteraction.findMany({
        where: { sessionId, interactionType: 'CHATBOT', createdAt: { gte: new Date(Date.now() - 3600000) } },
        orderBy: { createdAt: 'asc' },
        take: 10,
        select: { query: true, response: true }
    })

    const formattedHistory: { role: string; content: string }[] = []
    interactions.forEach(interaction => {
        if (interaction.query) formattedHistory.push({ role: 'user', content: interaction.query })
        if (interaction.response) formattedHistory.push({ role: 'assistant', content: interaction.response })
    })
    return formattedHistory
}
