// AI Chatbot Service — handles all customer/admin chatbot interactions

import { getWorkingModelConfig, GeminiResponse, ChatbotResponse, parseGeminiJSON } from './ai-client'
import { CHATBOT_SYSTEM_PROMPT } from '../ai-config'
import { ADMIN_SYSTEM_PROMPT } from '../ai-prompts-admin'

// Basic normalization: lowercase, remove diacritics, keep letters/numbers
function normalizeText(text: string): string {
    return text
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '') // remove accents
        .replace(/đ/g, 'd')
        .replace(/[^\w\s]/gi, '') // remove special chars but keep space/alphanumeric
        .trim()
}

// Strip emojis and icons but keep the text content
function stripIcons(text: string): string {
    // Matches common emojis/icons used in our suggestions
    return text.replace(/[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '').trim()
}

const STATIC_FAQ_RULES: Array<{
    patterns: RegExp[]
    response: string
    suggestions: string[]
}> = [
        {
            patterns: [/^(hi|hello|xin chao|chao|alo|hey|helo|hi shop|chao shop)$/i],
            response: 'Xin chào! Mình là trợ lý SmartBuild AI 👋 Mình có thể giúp gì cho bạn hôm nay?',
            suggestions: ['Xem sản phẩm', 'Tư vấn công trình', 'Dự toán chi phí']
        },
        {
            patterns: [/^(cam on|thanks|thank|thank you|cam on shop|tk|tks)$/i],
            response: 'Không có gì ạ! 😊 Rất vui được hỗ trợ bạn. Nếu cần thêm gì cứ nhắn mình nhé!',
            suggestions: ['Hỏi thêm', 'Xem sản phẩm khác', 'Tạm biệt']
        },
        {
            patterns: [/^(tam biet|bye|goodbye|hen gap lai|see you)$/i],
            response: 'Tạm biệt bạn! 👋 Hẹn gặp lại nhé! Chúc bạn một ngày tốt lành!',
            suggestions: ['Quay lại sau', 'Xem sản phẩm']
        },
        {
            patterns: [/^(ok|vâng|da|uh|roi|understood|dc|duoc|ok shop)$/i],
            response: 'Dạ vâng ạ! 😊 Cần mình hỗ trợ gì thêm không bạn?',
            suggestions: ['Xem giá gạch', 'Tính vật liệu', 'Địa chỉ cửa hàng']
        },
        {
            patterns: [/^(tro giup|help|giup|huong dan|lam gi|can gi)$/i],
            response: 'Mình có thể giúp bạn:\n• Tìm kiếm VLXD\n• Tính toán vật tư xây dựng\n• Tư vấn báo giá\n• Hỗ trợ đơn hàng\n\nBạn cần phần nào ạ?',
            suggestions: ['Tư vấn vật liệu', 'Tính dự toán', 'Đặt hàng']
        },
        {
            // Suggestion: Xem sản phẩm
            patterns: [/^(xem san pham|tim san pham|danh sach san pham|san pham ban)$/i],
            response: 'Tất nhiên rồi! Bạn đang quan tâm đến loại vật liệu nào ạ? (Xi măng, Thép, Gạch, Cát đá, Sơn...)?',
            suggestions: ['Xi măng', 'Sắt thép', 'Gạch ngói', 'Cát đá']
        },
        {
            // Suggestion: Tính vật liệu
            patterns: [/^(tinh vat lieu|du toan cong trinh|tinh toan vat tu|du toan chi phi)$/i],
            response: 'Dạ, để tính toán chính xác, bạn vui lòng cho mình biết diện tích công trình (m²) và loại hạng mục bạn muốn làm nhé?',
            suggestions: ['Tính gạch xây', 'Tính xi măng', 'Tính thép']
        }
    ]

/** Check for a quick response using both raw and cleaned text */
export function getQuickResponse(message: string): ChatbotResponse | null {
    const rawCleaned = stripIcons(message)
    const normalized = normalizeText(rawCleaned)

    for (const rule of STATIC_FAQ_RULES) {
        if (rule.patterns.some(p => p.test(normalized))) {
            return {
                response: rule.response,
                suggestions: rule.suggestions,
                confidence: 1
            }
        }
    }
    return null
}

/** Generate a full AI chatbot response using Gemini */
export async function generateChatbotResponse(
    message: string,
    context?: Record<string, unknown>,
    conversationHistory?: { role: string; content: string }[],
    isAdmin: boolean = false
): Promise<ChatbotResponse> {
    // Check for quick response first
    const quickResponse = getQuickResponse(message)
    if (quickResponse) return quickResponse

    try {
        const { client, modelName } = await getWorkingModelConfig()
        if (!client) throw new Error('Client init failed')

        const systemPrompt = isAdmin ? ADMIN_SYSTEM_PROMPT : CHATBOT_SYSTEM_PROMPT

        // Build context string if provided
        let contextStr = ''
        if (context) {
            contextStr = `\n\nContext information:\n${JSON.stringify(context, null, 2)}`
        }

        // Build conversation history for multi-turn prompts
        let historyStr = ''
        if (conversationHistory && conversationHistory.length > 0) {
            const recentHistory = conversationHistory.slice(-6) // Last 3 turns
            historyStr = '\n\nConversation history:\n' + recentHistory.map(h => `${h.role}: ${h.content}`).join('\n')
        }

        const fullPrompt = `${systemPrompt}${contextStr}${historyStr}\n\nUser: ${message}\n\nRespond in Vietnamese with a helpful, friendly tone. Return a JSON object with:\n- response: string (your answer)\n- suggestions: string[] (2-4 follow-up options, max 5 words each)\n- productRecommendations: array (if relevant products mentioned)\n- confidence: number (0-1)`

        const result = await client.models.generateContent({
            model: modelName!,
            contents: [{ role: 'user', parts: [{ text: fullPrompt }] }]
        })

        const responseText = (result as GeminiResponse).text || ''
        const parsed = parseGeminiJSON<Partial<ChatbotResponse>>(responseText, {})

        return {
            response: parsed.response || responseText || 'Xin lỗi, mình không thể xử lý yêu cầu này lúc này.',
            suggestions: parsed.suggestions || ['Hỏi thêm', 'Xem sản phẩm', 'Liên hệ hỗ trợ'],
            productRecommendations: parsed.productRecommendations || [],
            confidence: parsed.confidence || 0.8
        }
    } catch (error) {
        console.error('[ChatbotService] generateChatbotResponse error:', error)
        return {
            response: 'Xin lỗi, hệ thống đang bận. Vui lòng thử lại sau hoặc liên hệ hotline 1900-xxxx.',
            suggestions: ['Thử lại', 'Liên hệ hỗ trợ'],
            productRecommendations: [],
            confidence: 0
        }
    }
}

/** Extract structure from a raw text chatbot response */
export async function extractChatbotStructure(response: string): Promise<ChatbotResponse> {
    try {
        const { client, modelName } = await getWorkingModelConfig()
        if (!client) throw new Error('Client init failed')

        const prompt = `
    Extract structured information from the following chatbot response.
    Return a JSON object with these fields:
    - response: the main response text
    - suggestions: an array of 2-4 short suggestion phrases (max 5 words each)
    - productRecommendations: an array of product recommendations if mentioned (can be empty)
    
    Example format:
    {
      "response": "Main response text here",
      "suggestions": ["Suggestion 1", "Suggestion 2"],
      "productRecommendations": [{"name": "Product Name", "price": 15.99}]
    }
    
    Response to structure:
    ${response}
    
    Return only the JSON object, nothing else.
    `

        const result = await client.models.generateContent({
            model: modelName!,
            contents: [{ role: 'user', parts: [{ text: prompt }] }]
        })

        const structuredText = (result as GeminiResponse).text || '{}'
        const structured = parseGeminiJSON<Partial<ChatbotResponse>>(structuredText, {})

        return {
            response: structured.response || response,
            suggestions: structured.suggestions || [],
            productRecommendations: structured.productRecommendations || [],
            confidence: 0.9
        }
    } catch {
        return {
            response,
            suggestions: ['Xem sản phẩm', 'Liên hệ hỗ trợ', 'Thông tin giá cả'],
            productRecommendations: [],
            confidence: 0.7
        }
    }
}
