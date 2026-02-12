/**
 * Rule-Based Responses for Simple FAQs
 * Xử lý các câu hỏi đơn giản mà không cần gọi AI
 */

// Normalize Vietnamese text (remove diacritics)
function normalizeVietnamese(text: string): string {
    return text
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/đ/g, 'd')
        .replace(/Đ/g, 'D')
        .toLowerCase()
        .trim()
}

// Store Information
const STORE_INFO = {
    name: 'Cửa hàng Vật liệu Xây dựng Thành Tài',
    address: 'B34,tổ 29,KP5, Phường Trấn Biên, tỉnh Đồng Nai',
    phone: '0903 096 731',
    hotline: '1800 6868',
    email: 'contact@thanhtai.vn',
    workingHours: {
        weekday: '7:00 - 18:00',
        weekend: '7:30 - 17:00',
        sunday: '8:00 - 12:00'
    },
    bankInfo: {
        bank: 'TPBank',
        account: '06729594301',
        holder: 'NGUYEN THANH TAI'
    }
}

// Policy Information
const POLICIES = {
    shipping: {
        freeShip: 'Đơn hàng > 5 triệu hoặc nội thành < 5km',
        fee: '30.000đ - 50.000đ nội thành, tính theo km ngoại thành',
        time: 'Trong ngày (nội thành), 1-2 ngày (ngoại thành)',
        expressTime: '2-4 tiếng (nội thành, phụ thu 50.000đ)'
    },
    return: {
        window: '3 ngày kể từ khi nhận hàng',
        condition: 'Hàng còn nguyên vẹn, chưa sử dụng, bao bì không rách',
        refund: 'Hoàn tiền 100% hoặc đổi sản phẩm tương đương',
        exception: 'Hàng đặt riêng, hàng theo size không được đổi trả'
    },
    warranty: {
        steel: 'Theo tiêu chuẩn nhà sản xuất (không rỉ sét do bảo quản sai)',
        equipment: '6-12 tháng tùy loại thiết bị',
        cement: 'Bảo hành chất lượng trong hạn sử dụng (thường 60 ngày)'
    },
    payment: {
        methods: ['Chuyển khoản 100%', 'Cọc 50%'],
        deposit: 'Cọc 50% khi đặt hàng, thanh toán phần còn lại khi nhận hàng',
        transferNote: 'Nội dung CK: [Mã đơn hàng] - [SĐT]'
    }
}

// Rule-based response patterns
interface RulePattern {
    patterns: RegExp[]
    response: string
    suggestions: string[]
    priority: number
}

const RULE_PATTERNS: RulePattern[] = [
    // =====================================================
    // STORE INFORMATION
    // =====================================================
    {
        patterns: [
            /^(dia chi|o dau|cua hang o dau|shop o dau|diem ban|noi ban)/,
            /^(cua hang|shop).*(o dau|dia chi)/,
            /tim (cua hang|shop|dia chi)/
        ],
        response: `📍 **Địa chỉ cửa hàng**

🏪 **${STORE_INFO.name}**
📍 ${STORE_INFO.address}

🗺️ Tìm đường: [Google Maps](https://maps.google.com)

💡 Bạn có thể ghé trực tiếp để xem hàng hoặc đặt hàng online để được giao tận nơi!`,
        suggestions: ['Giờ mở cửa', 'Phí giao hàng', 'Hotline'],
        priority: 10
    },
    {
        patterns: [
            /^(gio mo cua|mo cua luc may|may gio mo|gio lam viec|working hours)/,
            /^(lam viec|mo cua).*(gio nao|may gio)/,
            /(cua hang|shop).*(mo cua|dong cua|lam viec)/
        ],
        response: `⏰ **Giờ làm việc**

📅 **Thứ 2 - Thứ 6:** ${STORE_INFO.workingHours.weekday}
📅 **Thứ 7:** ${STORE_INFO.workingHours.weekend}
📅 **Chủ nhật:** ${STORE_INFO.workingHours.sunday}

📞 Hotline: **${STORE_INFO.hotline}** (hỗ trợ 24/7)

💡 Đặt hàng trước 10h sáng để được giao trong ngày!`,
        suggestions: ['Địa chỉ cửa hàng', 'Phí giao hàng', 'Đặt hàng'],
        priority: 10
    },
    {
        patterns: [
            /^(hotline|so dien thoai|sdt|lien he|contact|goi dien)/,
            /(so dien thoai|hotline|sdt).*(shop|cua hang)/,
            /(shop|cua hang).*(so dien thoai|hotline)/
        ],
        response: `📞 **Thông tin liên hệ**

📱 **Hotline:** ${STORE_INFO.hotline} (miễn phí, 24/7)
📱 **Điện thoại:** ${STORE_INFO.phone}
📧 **Email:** ${STORE_INFO.email}

💬 Hoặc chat ngay với tôi để được hỗ trợ!`,
        suggestions: ['Địa chỉ cửa hàng', 'Giờ mở cửa', 'Đặt hàng'],
        priority: 10
    },

    // =====================================================
    // SHIPPING POLICY
    // =====================================================
    {
        patterns: [
            /^(phi ship|phi giao hang|phi van chuyen|cuoc ship|cuoc giao)/,
            /^(giao hang|ship).*(phi|gia|bao nhieu)/,
            /(phi|gia).*(giao hang|ship|van chuyen)/,
            /^(freeship|free ship|mien phi giao|mien phi ship)/,
            /(co|duoc).*(freeship|free ship|mien phi giao)/
        ],
        response: `🚚 **Chính sách giao hàng**

✅ **Miễn phí giao hàng:**
- Đơn hàng > 5.000.000đ
- Khoảng cách < 5km

💰 **Phí giao hàng:**
- Nội thành: ${POLICIES.shipping.fee}
- Ngoại thành: Tính theo km

⏱️ **Thời gian giao:**
- Nội thành: ${POLICIES.shipping.time}
- Giao hỏa tốc: ${POLICIES.shipping.expressTime}

💡 Đặt hàng trước 10h sáng để được giao trong ngày!`,
        suggestions: ['Đặt hàng', 'Kiểm tra đơn hàng', 'Địa chỉ cửa hàng'],
        priority: 9
    },

    // =====================================================
    // RETURN POLICY
    // =====================================================
    {
        patterns: [
            /^(doi tra|tra hang|hoan tien|return|refund)/,
            /(co duoc|muon).*(doi|tra|hoan)/,
            /(chinh sach|quy dinh).*(doi tra|tra hang)/,
            /^(doi|tra).*(hang|san pham)/
        ],
        response: `🔄 **Chính sách đổi trả**

⏳ **Thời gian:** ${POLICIES.return.window}

✅ **Điều kiện:**
- ${POLICIES.return.condition}
- Có hóa đơn mua hàng

💰 **Hoàn tiền:** ${POLICIES.return.refund}

⚠️ **Lưu ý:** ${POLICIES.return.exception}

📞 Liên hệ hotline ${STORE_INFO.hotline} để được hỗ trợ!`,
        suggestions: ['Hotline', 'Kiểm tra đơn hàng', 'Bảo hành'],
        priority: 9
    },

    // =====================================================
    // WARRANTY POLICY
    // =====================================================
    {
        patterns: [
            /^(bao hanh|warranty)/,
            /(chinh sach|quy dinh).*(bao hanh)/,
            /(bao hanh).*(the nao|bao lau|nhu nao)/
        ],
        response: `🛡️ **Chính sách bảo hành**

🔩 **Thép, sắt:** ${POLICIES.warranty.steel}
🔧 **Thiết bị, máy móc:** ${POLICIES.warranty.equipment}
🧱 **Xi măng:** ${POLICIES.warranty.cement}

📝 **Để được bảo hành:**
- Giữ lại hóa đơn mua hàng
- Liên hệ trong thời hạn bảo hành
- Hàng không bị hư hỏng do sử dụng sai cách

📞 Hotline hỗ trợ: ${STORE_INFO.hotline}`,
        suggestions: ['Đổi trả', 'Hotline', 'Tìm sản phẩm'],
        priority: 9
    },

    // =====================================================
    // PAYMENT METHODS
    // =====================================================
    {
        patterns: [
            /^(thanh toan|payment|chuyen khoan|tien mat|tra tien)/,
            /(phuong thuc|cach).*(thanh toan|tra tien)/,
            /(thanh toan).*(the nao|nhu nao|cach nao)/,
            /^(stk|so tai khoan|account|bank)/
        ],
        response: `💳 **Phương thức thanh toán**

✅ **Chấp nhận:**
${POLICIES.payment.methods.map(m => `- ${m}`).join('\n')}

🏦 **Thông tin chuyển khoản:**
- Ngân hàng: ${STORE_INFO.bankInfo.bank}
- Số TK: **${STORE_INFO.bankInfo.account}**
- Chủ TK: ${STORE_INFO.bankInfo.holder}

📝 **Nội dung CK:** ${POLICIES.payment.transferNote}

💡 ${POLICIES.payment.deposit}`,
        suggestions: ['Đặt hàng', 'Phí giao hàng', 'Hotline'],
        priority: 9
    },

    // =====================================================
    // SIMPLE GREETINGS (backup)
    // =====================================================
    {
        patterns: [
            /^(xin chao|chao ban|chao shop|chao|hello|hi|hey)$/,
            /^(chao buoi sang|chao buoi chieu|chao buoi toi)$/
        ],
        response: `👋 **Xin chào!**

Tôi là trợ lý AI của **${STORE_INFO.name}**. 

Tôi có thể giúp bạn:
🛒 Tìm kiếm và đặt hàng vật liệu xây dựng
📐 Tính toán khối lượng vật liệu cần thiết
💬 Tư vấn lựa chọn sản phẩm phù hợp
📦 Theo dõi đơn hàng

Hãy cho tôi biết bạn cần hỗ trợ gì nhé!`,
        suggestions: ['Tìm xi măng', 'Tính vật liệu xây nhà', 'Khuyến mãi', 'Giá cả'],
        priority: 5
    },

    // =====================================================
    // THANK YOU RESPONSES
    // =====================================================
    {
        patterns: [
            /^(cam on|thank you|thanks|cam on ban|cam on shop)$/,
            /^(ok cam on|ok thanks|da cam on)$/
        ],
        response: `🙏 **Không có chi!**

Rất vui được hỗ trợ bạn! Nếu cần thêm gì, cứ hỏi tôi nhé.

📞 Hotline: ${STORE_INFO.hotline} (hỗ trợ 24/7)`,
        suggestions: ['Tìm sản phẩm', 'Đặt hàng', 'Khuyến mãi'],
        priority: 5
    },

    // =====================================================
    // GOODBYE RESPONSES
    // =====================================================
    {
        patterns: [
            /^(tam biet|bye|goodbye|hen gap lai)$/,
            /^(ok bye|ok tam biet)$/
        ],
        response: `👋 **Tạm biệt!**

Cảm ơn bạn đã ghé thăm! Hẹn gặp lại bạn!

💡 Bạn có thể quay lại bất cứ lúc nào để được hỗ trợ.`,
        suggestions: ['Quay lại', 'Trang chủ'],
        priority: 5
    },

    // =====================================================
    // PROMOTIONS / SALES
    // =====================================================
    {
        patterns: [
            /^(khuyen mai|giam gia|sale|uu dai|promotion)/,
            /(co|dang).*(khuyen mai|giam gia|sale)/,
            /(khuyen mai|giam gia|sale).*(gi|nao|the nao)/
        ],
        response: `🎉 **Chương trình khuyến mãi**

🔥 **Ưu đãi hiện tại:**
- Giảm 3-8% khi mua số lượng lớn
- Freeship đơn > 5 triệu
- Xi măng INSEE PC40: Mua >100 bao giảm 5%
- Xi măng Hà Tiên: Mua >100 bao giảm 5%

💡 Chat để được tư vấn chi tiết về sản phẩm bạn quan tâm!`,
        suggestions: ['Xem xi măng', 'Xem gạch', 'Đặt hàng'],
        priority: 8
    },

    // =====================================================
    // HELP / WHAT CAN YOU DO
    // =====================================================
    {
        patterns: [
            /^(help|tro giup|ban lam duoc gi|ban co the gi)/,
            /^(huong dan|chi dan|cach su dung)/,
            /(ban|chatbot|ai).*(la gi|lam gi|giup gi)/
        ],
        response: `🤖 **Tôi có thể giúp bạn:**

🔍 **Tìm kiếm sản phẩm**
- "Tìm xi măng INSEE"
- "Giá gạch ống"

📐 **Tính toán vật liệu**
- "Tính vật liệu xây nhà 100m²"
- "Cần bao nhiêu xi măng để đổ 10m² bê tông"

🛒 **Đặt hàng**
- "Đặt 50 bao xi măng INSEE"
- "Mua 1000 viên gạch đinh"

📦 **Tra cứu đơn hàng**
- "Kiểm tra đơn hàng"
- "Đơn hàng của tôi"

💬 **Tư vấn**
- "So sánh xi măng INSEE và Hà Tiên"
- "Xi măng nào tốt để đổ móng"`,
        suggestions: ['Tìm xi măng', 'Tính vật liệu', 'Đặt hàng', 'Khuyến mãi'],
        priority: 7
    },
    {
        patterns: [
            /^(thoi tiet|weather|nhiet do)/,
            /^(ke chuyen|ke chuyen cuoi|troll|hai)/,
            /^(ban co nguoi yeu chua|ban bao nhieu tuoi|ban la ai|ai tao ra ban)/,
            /^(an gi|choi dau|di dau)/,
            /^(hat di|hat cho nghe|ke chuyen ma)/,
            /^(tin tuc|chinh tri|showbiz|bong da)/
        ],
        response: `🤖 **Chào bạn! Rất vui được trò chuyện.**

Tuy nhiên, tôi là **Trợ lý Chuyên gia Vật liệu Xây dựng**. Tôi được thiết kế để hỗ trợ bạn tốt nhất trong các lĩnh vực:
✅ Tra cứu giá và đặc tính vật liệu (Xi măng, Cát, Đá, Gạch, Thép...)
✅ Tính toán khối lượng vật liệu cho công trình (Nhà, Tường, Sàn...)
✅ Hỗ trợ đặt hàng và theo dõi đơn hàng

Những câu hỏi ngoài chuyên môn xây dựng có lẽ tôi chưa rành lắm. Bạn có cần tôi giúp gì về **vật liệu xây dựng** không ạ?`,
        suggestions: ['Bảng giá hôm nay', 'Tính vật liệu xây nhà', 'Tư vấn loại gạch'],
        priority: 4
    }
]

// Quick price lookup patterns (avoid AI call for simple price queries)
const QUICK_PRICE_PATTERNS: Array<{
    pattern: RegExp
    productKeyword: string
    suggestions: string[]
}> = [
        {
            pattern: /^(gia|bao nhieu).*(xi mang|ximang)/,
            productKeyword: 'xi măng',
            suggestions: ['Xi măng INSEE', 'Xi măng Hà Tiên', 'So sánh xi măng']
        },
        {
            pattern: /^(gia|bao nhieu).*(gach)/,
            productKeyword: 'gạch',
            suggestions: ['Gạch đinh', 'Gạch ống', 'Tính gạch xây tường']
        },
        {
            pattern: /^(gia|bao nhieu).*(cat)/,
            productKeyword: 'cát',
            suggestions: ['Cát xây dựng', 'Cát vàng', 'Tính vật liệu']
        },
        {
            pattern: /^(gia|bao nhieu).*(da)/,
            productKeyword: 'đá',
            suggestions: ['Đá 1x2', 'Đá mi', 'Tính vật liệu']
        },
        {
            pattern: /^(gia|bao nhieu).*(thep|sat)/,
            productKeyword: 'thép',
            suggestions: ['Thép D10', 'Thép D12', 'Thép D16']
        }
    ]

export interface RuleBasedResult {
    matched: boolean
    response?: string
    suggestions?: string[]
    requiresProductLookup?: boolean
    productKeyword?: string
    requiresComparison?: boolean
    comparisonProducts?: string[]
}

// Comparison detection patterns
const COMPARISON_PATTERNS = [
    /so sanh\s+(.+?)\s+(voi|va|vs)\s+(.+)/i,
    /(.+?)\s+(voi|hay|vs)\s+(.+?)\s+(nao tot|nao hon|khac nhau|gi khac)/i,
    /nen (chon|mua|dung)\s+(.+?)\s+(hay|voi)\s+(.+)/i,
    /(.+?)\s+khac\s+(.+?)\s+(nhu the nao|the nao|gi)/i
]

/**
 * Detect if message is a comparison request
 */
export function detectComparisonRequest(message: string): { isComparison: boolean, products: string[] } {
    const normalizedMessage = normalizeVietnamese(message)

    for (const pattern of COMPARISON_PATTERNS) {
        const match = normalizedMessage.match(pattern)
        if (match) {
            // Extract product names from match groups
            const products: string[] = []
            for (let i = 1; i < match.length; i++) {
                const group = match[i]?.trim()
                // Skip connector words
                if (group && !['voi', 'va', 'vs', 'hay', 'nao tot', 'nao hon', 'khac nhau', 'gi khac', 'nen', 'chon', 'mua', 'dung', 'nhu the nao', 'the nao', 'gi', 'khac'].includes(group)) {
                    products.push(group)
                }
            }
            if (products.length >= 2) {
                return { isComparison: true, products }
            }
        }
    }

    return { isComparison: false, products: [] }
}

/**
 * Generate comparison response from product data (template-based, no AI needed)
 */
export function generateComparisonResponse(products: Array<{
    name: string
    brand?: string
    price: number
    unit: string
    description?: string
    specifications?: Record<string, any>
    usage?: string[]
    quality?: string
}>): string {
    if (products.length < 2) {
        return '❌ Không tìm thấy đủ sản phẩm để so sánh.'
    }

    const [p1, p2] = products

    // Build comparison table
    let response = `⚖️ **So sánh ${p1.name} vs ${p2.name}**\n\n`

    // Price comparison
    response += `💰 **Giá:**\n`
    response += `- ${p1.name}: **${p1.price.toLocaleString('vi-VN')}đ**/${p1.unit}\n`
    response += `- ${p2.name}: **${p2.price.toLocaleString('vi-VN')}đ**/${p2.unit}\n`

    const priceDiff = p1.price - p2.price
    if (priceDiff > 0) {
        response += `→ ${p2.name} rẻ hơn ${priceDiff.toLocaleString('vi-VN')}đ\n`
    } else if (priceDiff < 0) {
        response += `→ ${p1.name} rẻ hơn ${Math.abs(priceDiff).toLocaleString('vi-VN')}đ\n`
    } else {
        response += `→ Giá tương đương\n`
    }
    response += '\n'

    // Brand/Quality comparison
    if (p1.brand || p2.brand) {
        response += `🏷️ **Thương hiệu:**\n`
        response += `- ${p1.name}: ${p1.brand || 'N/A'}\n`
        response += `- ${p2.name}: ${p2.brand || 'N/A'}\n\n`
    }

    // Quality comparison
    if (p1.quality || p2.quality) {
        response += `⭐ **Chất lượng:**\n`
        response += `- ${p1.name}: ${p1.quality || 'Tiêu chuẩn'}\n`
        response += `- ${p2.name}: ${p2.quality || 'Tiêu chuẩn'}\n\n`
    }

    // Usage comparison
    if (p1.usage?.length || p2.usage?.length) {
        response += `🔧 **Công dụng:**\n`
        response += `- ${p1.name}: ${p1.usage?.slice(0, 2).join(', ') || 'Đa dụng'}\n`
        response += `- ${p2.name}: ${p2.usage?.slice(0, 2).join(', ') || 'Đa dụng'}\n\n`
    }

    // Recommendation
    response += `💡 **Khuyến nghị:**\n`
    if (priceDiff > 0 && p1.quality?.toLowerCase().includes('cao')) {
        response += `→ Chọn **${p1.name}** nếu ưu tiên chất lượng\n`
        response += `→ Chọn **${p2.name}** nếu muốn tiết kiệm chi phí`
    } else if (priceDiff < 0 && p2.quality?.toLowerCase().includes('cao')) {
        response += `→ Chọn **${p2.name}** nếu ưu tiên chất lượng\n`
        response += `→ Chọn **${p1.name}** nếu muốn tiết kiệm chi phí`
    } else {
        response += `→ Cả hai đều phù hợp, tùy thuộc vào mục đích sử dụng`
    }

    return response
}

/**
 * Check if a message can be handled by rule-based responses
 */
export function checkRuleBasedResponse(message: string): RuleBasedResult {
    const normalizedMessage = normalizeVietnamese(message)

    // First, check if it's a comparison request (needs RAG + template)
    const comparisonResult = detectComparisonRequest(message)
    if (comparisonResult.isComparison) {
        return {
            matched: true,
            requiresComparison: true,
            comparisonProducts: comparisonResult.products,
            suggestions: ['Xem chi tiết', 'Đặt hàng', 'Tư vấn thêm']
        }
    }

    // Check rule patterns (sorted by priority)
    const sortedPatterns = [...RULE_PATTERNS].sort((a, b) => b.priority - a.priority)

    for (const rule of sortedPatterns) {
        for (const pattern of rule.patterns) {
            if (pattern.test(normalizedMessage)) {
                return {
                    matched: true,
                    response: rule.response,
                    suggestions: rule.suggestions
                }
            }
        }
    }

    // Check quick price patterns
    for (const pricePattern of QUICK_PRICE_PATTERNS) {
        if (pricePattern.pattern.test(normalizedMessage)) {
            return {
                matched: true,
                requiresProductLookup: true,
                productKeyword: pricePattern.productKeyword,
                suggestions: pricePattern.suggestions
            }
        }
    }

    return { matched: false }
}

/**
 * Get store information for embedding in responses
 */
export function getStoreInfo() {
    return STORE_INFO
}

/**
 * Get policy information
 */
export function getPolicies() {
    return POLICIES
}

export default {
    checkRuleBasedResponse,
    detectComparisonRequest,
    generateComparisonResponse,
    getStoreInfo,
    getPolicies
}
