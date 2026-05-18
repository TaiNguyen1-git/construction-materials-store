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

export async function handleProductSearch(message: string, sessionId: string, entities?: any) {
    try {
        const cleanedMessage = message.replace(/[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '').trim()
        
        // 1. Try to use extracted entities first for better precision
        let productKeywords = ''
        if (entities?.productName) {
            productKeywords = entities.productName.toLowerCase()
        } else {
            // 2. Enhanced cleaning for natural language
            productKeywords = cleanedMessage.toLowerCase()
                .replace(/tôi|muốn|tìm|kiếm|sản phẩm|phù hợp|cho|báo giá|giá|giúp|cần|mua|bán|có|không|đâu|nào|shop|còn|gửi|link|xem|với|tại|ở|đây|cho|hỏi|về|loại|mẫu/g, '')
                .replace(/\s+/g, ' ')
                .trim()
        }

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
                productRecommendations: products.map(p => ({ id: p.id, name: p.name, price: p.price, unit: p.unit, imageUrl: p.images[0] || '/placeholder.png', inStock: p.inventoryItem ? p.inventoryItem.availableQuantity > 0 : false })),
                confidence: 0.90, sessionId, timestamp: new Date().toISOString()
            }))
        }

        // If no direct DB match, return null to let RAG/AI handle it naturally
        return null 
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
    
    // ─── Contractor Query ──────────────────────────────────────────────────────────
    
    export async function handleContractorQuery(
        message: string,
        sessionId: string
    ) {
        const lower = message.toLowerCase()
        let queryCity = 'Đà Nẵng'
        let displayCity = 'TP. Đà Nẵng'
        
        // Comprehensive list of all Vietnam locations (old and new to match user intent)
        const LOCATION_KEYWORDS = [
            'hà nội', 'hồ chí minh', 'sài gòn', 'hcm', 'đà nẵng', 'hải phòng', 'cần thơ', 'huế',
            'bình dương', 'đồng nai', 'biên hòa', 'bà rịa vũng tàu', 'bà rịa - vũng tàu', 'vũng tàu',
            'nha trang', 'khánh hòa', 'đà lạt', 'lâm đồng', 'quảng nam', 'hội an', 'quảng ngãi',
            'quy nhơn', 'bình định', 'tuy hòa', 'phú yên', 'phan thiết', 'bình thuận', 'ninh thuận',
            'gia lai', 'buôn ma thuột', 'đắk lắk', 'đắk nông', 'kon tum', 'an giang', 'kiên giang',
            'rạch giá', 'cà mau', 'bạc liêu', 'sóc trăng', 'hậu giang', 'trà vinh', 'bến tre',
            'vĩnh long', 'đồng tháp', 'tiền giang', 'long an', 'tây ninh', 'thanh hóa', 'nghệ an',
            'vinh', 'hà tĩnh', 'quảng bình', 'quảng trị', 'thái bình', 'nam định', 'ninh bình',
            'hà nam', 'hưng yên', 'hải dương', 'bắc ninh', 'bắc giang', 'vĩnh phúc', 'thái nguyên',
            'bắc kạn', 'tuyên quang', 'hà giang', 'yên bái', 'lào cai', 'hòa bình', 'sơn la',
            'điện biên', 'lai châu', 'cao bằng', 'lạng sơn', 'hạ long', 'quảng ninh', 'bình phước'
        ];

        // Mapping of old provinces/cities to the new 34 administrative units (2026 Update)
        const MERGED_PROVINCES_MAP: Record<string, string> = {
            'hà giang': 'Tuyên Quang',
            'tuyên quang': 'Tuyên Quang',
            'yên bái': 'Lào Cai',
            'lào cai': 'Lào Cai',
            'bắc kạn': 'Thái Nguyên',
            'thái nguyên': 'Thái Nguyên',
            'vĩnh phúc': 'Phú Thọ',
            'hòa bình': 'Phú Thọ',
            'phú thọ': 'Phú Thọ',
            'bắc giang': 'Bắc Ninh',
            'bắc ninh': 'Bắc Ninh',
            'thái bình': 'Hưng Yên',
            'hưng yên': 'Hưng Yên',
            'hải dương': 'TP. Hải Phòng',
            'hải phòng': 'TP. Hải Phòng',
            'hà nam': 'Ninh Bình',
            'nam định': 'Ninh Bình',
            'ninh bình': 'Ninh Bình',
            'quảng bình': 'Quảng Trị',
            'quảng trị': 'Quảng Trị',
            'quảng nam': 'TP. Đà Nẵng',
            'đà nẵng': 'TP. Đà Nẵng',
            'kon tum': 'Quảng Ngãi',
            'quảng ngãi': 'Quảng Ngãi',
            'bình định': 'Gia Lai',
            'gia lai': 'Gia Lai',
            'ninh thuận': 'Khánh Hòa',
            'khánh hòa': 'Khánh Hòa',
            'đắk nông': 'Lâm Đồng',
            'bình thuận': 'Lâm Đồng',
            'lâm đồng': 'Lâm Đồng',
            'phú yên': 'Đắk Lắk',
            'đắk lắk': 'Đắk Lắk',
            'bà rịa vũng tàu': 'TP. Hồ Chí Minh',
            'bà rịa - vũng tàu': 'TP. Hồ Chí Minh',
            'vũng tàu': 'TP. Hồ Chí Minh',
            'bình dương': 'TP. Hồ Chí Minh',
            'hcm': 'TP. Hồ Chí Minh',
            'hồ chí minh': 'TP. Hồ Chí Minh',
            'sài gòn': 'TP. Hồ Chí Minh',
            'bình phước': 'Đồng Nai',
            'đồng nai': 'Đồng Nai',
            'biên hòa': 'Đồng Nai',
            'long an': 'Tây Ninh',
            'tây ninh': 'Tây Ninh',
            'sóc trăng': 'TP. Cần Thơ',
            'hậu giang': 'TP. Cần Thơ',
            'cần thơ': 'TP. Cần Thơ',
            'bến tre': 'Vĩnh Long',
            'trà vinh': 'Vĩnh Long',
            'vĩnh long': 'Vĩnh Long',
            'tiền giang': 'Đồng Tháp',
            'đồng tháp': 'Đồng Tháp',
            'bạc liêu': 'Cà Mau',
            'cà mau': 'Cà Mau',
            'kiên giang': 'An Giang',
            'an giang': 'An Giang'
        };

        let queryDistrict = ''
        const matched = LOCATION_KEYWORDS.find(k => lower.includes(k))
        if (matched) {
            if (MERGED_PROVINCES_MAP[matched]) {
                const newUnit = MERGED_PROVINCES_MAP[matched]
                queryCity = newUnit.replace('TP. ', '')
                if (matched !== newUnit.toLowerCase() && matched !== 'hcm' && matched !== 'sài gòn' && matched !== 'vũng tàu') {
                    const oldNameFormatted = matched.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
                    displayCity = `${newUnit} (bao gồm ${oldNameFormatted} cũ)`
                    queryDistrict = oldNameFormatted // Focus logistics query on former area
                } else {
                    displayCity = newUnit
                }
            } else {
                // Kept original
                if (matched === 'hà nội') {
                    queryCity = 'Hà Nội'
                    displayCity = 'TP. Hà Nội'
                } else if (matched === 'huế') {
                    queryCity = 'Huế'
                    displayCity = 'TP. Huế'
                } else {
                    const capitalized = matched.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
                    queryCity = capitalized
                    displayCity = capitalized
                }
            }
        }

        try {
            // 1. Try to fetch contractors within the specific district/former region first (Logistics optimization)
            let contractors: any[] = []
            if (queryDistrict) {
                contractors = await prisma.contractorProfile.findMany({
                    where: { 
                        city: { contains: queryCity, mode: 'insensitive' },
                        OR: [
                            { district: { contains: queryDistrict, mode: 'insensitive' } },
                            { address: { contains: queryDistrict, mode: 'insensitive' } }
                        ],
                        isAvailable: true 
                    },
                    take: 3,
                    orderBy: { avgRating: 'desc' }
                })
            }

            // 2. If no district-specific contractors found, fallback to the entire merged city
            if (contractors.length === 0) {
                contractors = await prisma.contractorProfile.findMany({
                    where: { 
                        city: { contains: queryCity, mode: 'insensitive' },
                        isAvailable: true 
                    },
                    take: 3,
                    orderBy: { avgRating: 'desc' }
                })
            }

            let response = `🏗️ **Kết nối Nhà thầu & Dịch vụ thi công tại ${displayCity}**\n\n`
            response += `Chào bạn! SmartBuild có mạng lưới đối tác **nhà thầu, đội thi công uy tín tại ${displayCity}** đã được xác minh năng lực.\n\n`

            if (contractors.length > 0) {
                response += `🏠 **NHÀ THẦU TIÊU BIỂU TẠI KHU VỰC:**\n`
                contractors.forEach((c, idx) => {
                    const stars = '⭐'.repeat(Math.round(c.avgRating || 5))
                    const exp = c.experienceYears ? ` (${c.experienceYears} năm kinh nghiệm)` : ''
                    const skills = c.skills && c.skills.length > 0 ? `\n   📍 Chuyên môn: ${c.skills.slice(0, 3).join(', ')}` : ''
                    
                    // Display exact district/address so they can easily estimate distance
                    let locationDetail = ''
                    if (c.district && c.city) {
                        locationDetail = `\n   📍 Khu vực: ${c.district}, ${c.city}`
                    } else if (c.address) {
                        locationDetail = `\n   📍 Địa chỉ: ${c.address}`
                    }

                    response += `${idx + 1}. **${c.displayName}** ${stars}${exp}${locationDetail}${skills}\n   🔗 [Xem hồ sơ & đánh giá →](/contractors/${c.id})\n\n`
                })
            }

            response += `Chúng tôi có thể giúp bạn kết nối thêm với:\n`
            response += `- 🏠 **Nhà thầu xây thô & Hoàn thiện**: Chuyên biệt thự, nhà phố.\n`
            response += `- 🧱 **Đội thợ xây trát, ốp lát**: Tay nghề cao, báo giá theo m².\n`
            response += `- 🎨 **Đội thi công sơn nước, thạch cao**: Chuyên nghiệp, nhanh chóng.\n`
            response += `- ⚡ **Đội điện nước, chống thấm**: Xử lý triệt để các vấn đề kỹ thuật.\n\n`
            
            response += `💡 **Lợi ích khi chọn nhà thầu qua SmartBuild:**\n`
            response += `- Được kiểm chứng năng lực qua các công trình thực tế.\n`
            response += `- Đảm bảo nguồn vật tư chất lượng, giá gốc từ kho.\n`
            response += `- Hỗ trợ giám sát kỹ thuật và tiến độ thi công.\n\n`
            
            response += `Bạn đang cần tìm thợ cho hạng mục nào ạ? Hãy để lại thông tin hoặc nhấn "Liên hệ nhân viên" để mình kết nối bạn với chuyên viên tư vấn trực tiếp nhé!`

            return NextResponse.json(createSuccessResponse({
                message: response,
                suggestions: [`Tìm thêm thợ tại ${displayCity}`, 'Báo giá thi công', 'Liên hệ nhân viên'],
                confidence: 1.0, sessionId, timestamp: new Date().toISOString()
            }))
        } catch (error) {
            console.error('Contractor query error:', error)
            return NextResponse.json(createSuccessResponse({
                message: `🏗️ **Kết nối Nhà thầu tại ${displayCity}**\n\nHiện tại hệ thống đang kết nối với các đối tác tại khu vực này. Bạn vui lòng để lại số điện thoại hoặc nhu cầu cụ thể (xây mới, sửa chữa...), nhân viên điều phối của SmartBuild sẽ gọi lại tư vấn và giới thiệu nhà thầu phù hợp nhất cho bạn trong vòng 2h làm việc nhé!`,
                suggestions: ['Để lại thông tin', 'Báo giá thi công', 'Liên hệ nhân viên'],
                confidence: 1.0, sessionId, timestamp: new Date().toISOString()
            }))
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
    isAdmin: boolean = false,
    fileData?: { mimeType: string, data: string }
): Promise<{ response: string; suggestions: string[]; productRecommendations?: unknown[]; confidence: number }> {
    // 1. Cache hit (only if no fileData)
    if (!fileData) {
        const cachedResponse = await aiCache.get<{ response: string; suggestions: string[]; productRecommendations?: unknown[]; confidence: number }>(message, { isAdmin, ...context })
        if (cachedResponse) {
            console.log('[AI-CACHE] Hit for:', message)
            return cachedResponse
        }
    }

    // 2. Live AI
    if (isAIEnabled()) {
        try {
            const response = await AIService.generateChatbotResponse(message, context, conversationHistory, isAdmin, fileData)
            if (response.confidence > 0.7 && !fileData) await aiCache.set(message, response, 30 * 60, { isAdmin, ...context }) // 30 min in seconds
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
