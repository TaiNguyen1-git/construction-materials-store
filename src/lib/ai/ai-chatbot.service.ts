// AI Chatbot Service — handles all customer/admin chatbot interactions

import { getWorkingModelConfig, GeminiResponse, ChatbotResponse, parseGeminiJSON } from './ai-client'
import { CHATBOT_SYSTEM_PROMPT } from '../ai-config'
import { ADMIN_SYSTEM_PROMPT } from '../ai-prompts-admin'

// Pre-defined responses for simple messages (no AI call needed)
const QUICK_RESPONSES: Record<string, ChatbotResponse> = {
    // Greetings
    'alo': { response: 'Chào bạn! Mình là SmartBuild AI 🤖 Bạn cần tư vấn vật liệu xây dựng hay tính toán dự toán công trình nào không ạ?', suggestions: ['Tìm hiểu vật liệu', 'Tư vấn vật liệu', 'Tính toán vật liệu'], confidence: 1 },
    'hello': { response: 'Xin chào! Mình là trợ lý SmartBuild AI 👋 Bạn muốn mình giúp gì hôm nay ạ?', suggestions: ['Xem sản phẩm', 'Tư vấn công trình', 'Dự toán chi phí'], confidence: 1 },
    'hi': { response: 'Hi bạn! 👋 Mình có thể giúp gì cho bạn hôm nay?', suggestions: ['Tư vấn vật liệu', 'Xem giá', 'Hỗ trợ đơn hàng'], confidence: 1 },
    'xin chào': { response: 'Chào bạn! 😊 Mình là SmartBuild AI, sẵn sàng hỗ trợ bạn về vật liệu xây dựng. Bạn cần tư vấn gì ạ?', suggestions: ['Tìm sản phẩm', 'Tư vấn công trình', 'Xem khuyến mãi'], confidence: 1 },
    'chào': { response: 'Chào bạn! 👋 Bạn đang quan tâm đến vật liệu gì hôm nay ạ?', suggestions: ['Xi măng', 'Cát đá', 'Gạch ngói', 'Thép'], confidence: 1 },
    'hey': { response: 'Hey! 👋 Mình có thể giúp gì cho bạn?', suggestions: ['Tư vấn mua hàng', 'Xem giá', 'Hỗ trợ'], confidence: 1 },
    // Thank you
    'cảm ơn': { response: 'Không có gì ạ! 😊 Nếu cần thêm hỗ trợ gì, cứ nhắn mình nhé!', suggestions: ['Hỏi thêm', 'Xem sản phẩm khác', 'Tạm biệt'], confidence: 1 },
    'thank': { response: 'Rất vui được giúp bạn! 🙏 Cần gì cứ hỏi nhé!', suggestions: ['Hỏi thêm', 'Xem giỏ hàng', 'Tạm biệt'], confidence: 1 },
    // Goodbye
    'tạm biệt': { response: 'Tạm biệt bạn! 👋 Hẹn gặp lại nhé!', suggestions: ['Quay lại chat', 'Xem sản phẩm'], confidence: 1 },
    'bye': { response: 'Bye bye! 👋 Chúc bạn một ngày tốt lành!', suggestions: ['Quay lại chat'], confidence: 1 },
    // Help
    'help': { response: 'Mình có thể giúp bạn:\n• Tìm kiếm vật liệu xây dựng\n• Tính toán dự toán công trình\n• Tư vấn sản phẩm phù hợp\n• Hỗ trợ đặt hàng\n\nBạn cần gì ạ?', suggestions: ['Tư vấn vật liệu', 'Tính dự toán', 'Đặt hàng'], confidence: 1 },
    'giúp': { response: 'Mình sẵn sàng giúp bạn! Bạn có thể nhờ mình:\n• Tìm vật liệu xây dựng\n• Tính toán nguyên vật liệu\n• Tra cứu giá cả\n• Hỗ trợ đặt hàng', suggestions: ['Tìm sản phẩm', 'Tính vật liệu', 'Xem giá'], confidence: 1 },
    'ok': { response: 'Dạ vâng ạ! 😊 Cần gì bạn cứ nhắn mình nhé.', suggestions: ['Xem giá gạch', 'Tính vật liệu', 'Địa chỉ cửa hàng'], confidence: 1 },
    'vậy thôi': { response: 'Dạ, nếu cần hỗ trợ gì thêm bạn cứ nhắn mình nhé. Chào bạn! 👋', suggestions: ['Quay lại sau', 'Xem sản phẩm'], confidence: 1 },
    'dc': { response: 'Dạ vâng! 😊 Cần gì bạn cứ nhắn nhé.', suggestions: ['Xem giá gạch', 'Tính vật liệu'], confidence: 1 },
    'duoc': { response: 'Dạ vâng! 😊 Cần gì bạn cứ nhắn nhé.', suggestions: ['Xem giá gạch', 'Tính vật liệu'], confidence: 1 },
    'da': { response: 'Dạ vâng! Cần gì bạn cứ nhắn mình nhen. 😊', suggestions: ['Xem sản phẩm', 'Tính vật liệu'], confidence: 1 },
}

/** Check for a quick response to a simple greeting or acknowledgement */
export function getQuickResponse(message: string): ChatbotResponse | null {
    const normalized = message.toLowerCase().trim()
    return QUICK_RESPONSES[normalized] || null
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
