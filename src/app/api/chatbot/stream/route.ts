/**
 * POST /api/chatbot/stream — Streaming AI Chatbot Response (SSE)
 *
 * Returns a Server-Sent Events (SSE) stream that sends the AI response
 * token by token, providing a real-time "typing" experience.
 *
 * Response format (each SSE event):
 *   data: {"type":"token","content":"word "}
 *   data: {"type":"suggestions","content":["Tìm sản phẩm","Tính vật liệu"]}
 *   data: {"type":"done","content":"full response text"}
 *   data: {"type":"error","content":"error message"}
 */

import { NextRequest } from 'next/server'
import { z } from 'zod'
import { getWorkingModelConfig } from '@/lib/ai/ai-client'
import { getQuickResponse } from '@/lib/ai/ai-chatbot.service'
import { CHATBOT_SYSTEM_PROMPT } from '@/lib/ai-config'
import { ADMIN_SYSTEM_PROMPT, ADMIN_WELCOME_MESSAGE, CUSTOMER_WELCOME_MESSAGE } from '@/lib/ai-prompts-admin'
import { RAGService } from '@/lib/rag-service'
import { checkRuleBasedResponse } from '@/lib/chatbot/rule-based-responses'
import { checkRateLimit, getRateLimitIdentifier, RateLimitConfigs, formatRateLimitError } from '@/lib/rate-limiter'
import { getCachedResponse, cacheResponse, shouldBypassCache } from '@/lib/chatbot/response-cache'

// ─── Validation ─────────────────────────────────────────────────────────────────

const streamSchema = z.object({
    message: z.string().max(3000).min(1),
    customerId: z.string().optional(),
    sessionId: z.string().min(1),
    userRole: z.string().optional(),
    isAdmin: z.boolean().optional(),
    context: z.object({
        currentPage: z.string().optional(),
    }).optional(),
    conversationHistory: z.array(z.object({
        role: z.string(),
        content: z.string()
    })).optional()
})

// ─── SSE Helpers ────────────────────────────────────────────────────────────────

function createSSEStream(handler: (writer: WritableStreamDefaultWriter<Uint8Array>) => Promise<void>) {
    const encoder = new TextEncoder()
    const stream = new TransformStream()
    const writer = stream.writable.getWriter()

    // Run handler in background
    handler(writer).catch(err => {
        console.error('[Stream] Handler error:', err)
        const errorEvent = `data: ${JSON.stringify({ type: 'error', content: 'Lỗi kết nối. Vui lòng thử lại.' })}\n\n`
        writer.write(encoder.encode(errorEvent)).catch(() => { })
        writer.close().catch(() => { })
    })

    return new Response(stream.readable, {
        headers: {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Connection': 'keep-alive',
            'X-Accel-Buffering': 'no',
        }
    })
}

function writeSSE(writer: WritableStreamDefaultWriter<Uint8Array>, data: { type: string; content: unknown }) {
    const encoder = new TextEncoder()
    return writer.write(encoder.encode(`data: ${JSON.stringify(data)}\n\n`))
}

// ─── POST /api/chatbot/stream ───────────────────────────────────────────────────

export async function POST(request: NextRequest) {
    try {
        const ip = request.headers.get('x-forwarded-for')?.split(',')[0] ||
            request.headers.get('x-real-ip') || 'unknown'

        const body = await request.json()
        const validation = streamSchema.safeParse(body)

        if (!validation.success) {
            return Response.json(
                { success: false, error: 'Invalid input', details: validation.error.issues },
                { status: 400 }
            )
        }

        const { message, customerId, sessionId, isAdmin, userRole, context, conversationHistory } = validation.data
        const isGuest = !userRole || userRole === 'CUSTOMER' || !customerId || customerId.startsWith('guest_')

        // ── Rate Limiting ──────────────────────────────────────────────────────────
        const rateLimitConfig = isAdmin
            ? RateLimitConfigs.ANALYTICS
            : (isGuest ? RateLimitConfigs.CHATBOT.GUEST : RateLimitConfigs.CHATBOT.AUTH)
        const rateLimitId = getRateLimitIdentifier(ip, customerId, isAdmin ? 'admin' : 'chatbot')
        const rateLimitResult = await checkRateLimit(rateLimitId, rateLimitConfig)

        if (!rateLimitResult.allowed) {
            const resetAt = rateLimitResult.resetAt || Date.now() + 60000
            const errorMessage = formatRateLimitError({ ...rateLimitResult, resetAt })
            return Response.json({
                success: true,
                data: {
                    message: errorMessage,
                    suggestions: ['Thử lại sau'],
                    confidence: 1.0,
                    sessionId,
                    data: { isRateLimit: true }
                }
            })
        }

        // ── Quick Responses (No stream needed) ──────────────────────────────────────
        if (message === 'admin_hello' && isAdmin) {
            return Response.json({
                success: true,
                data: { ...ADMIN_WELCOME_MESSAGE, productRecommendations: [], confidence: 1.0, sessionId, timestamp: new Date().toISOString() }
            })
        }
        if (message === 'hello' && !isAdmin) {
            return Response.json({
                success: true,
                data: { ...CUSTOMER_WELCOME_MESSAGE, productRecommendations: [], confidence: 1.0, sessionId, timestamp: new Date().toISOString() }
            })
        }

        // Fast path: greetings
        const quickResponse = getQuickResponse(message)
        if (quickResponse) {
            return Response.json({
                success: true,
                data: { ...quickResponse, sessionId, timestamp: new Date().toISOString() }
            })
        }

        if (!isAdmin) {
            const ruleBased = checkRuleBasedResponse(message)
            if (ruleBased.matched && !ruleBased.requiresProductLookup && !ruleBased.requiresComparison) {
                return Response.json({
                    success: true,
                    data: { message: ruleBased.response, suggestions: ruleBased.suggestions || [], confidence: 1.0, sessionId, timestamp: new Date().toISOString() }
                })
            }
        }

        // ── Cache Check (avoid duplicate AI calls) ────────────────────────────────
        if (!shouldBypassCache(message)) {
            const cached = await getCachedResponse(message, !!isAdmin)
            if (cached) {
                return Response.json({
                    success: true,
                    data: {
                        message: cached.response,
                        suggestions: cached.suggestions,
                        productRecommendations: cached.productRecommendations || [],
                        confidence: cached.confidence,
                        sessionId,
                        timestamp: new Date().toISOString(),
                        fromCache: true
                    }
                })
            }
        }

        // ── SSE Stream for AI Response ──────────────────────────────────────────────
        return createSSEStream(async (writer) => {
            try {
                const { client, modelName } = await getWorkingModelConfig()
                if (!client) throw new Error('AI client not initialized')

                const systemPrompt = isAdmin ? ADMIN_SYSTEM_PROMPT : CHATBOT_SYSTEM_PROMPT

                // Build context (compact)
                const contextStr = context?.currentPage
                    ? `\nTrang hiện tại: ${context.currentPage}`
                    : ''

                // Build conversation history (limit to 4 entries = 2 turns to save tokens)
                let historyStr = ''
                if (conversationHistory && conversationHistory.length > 0) {
                    const recentHistory = conversationHistory.slice(-4)
                    historyStr = '\n\nLịch sử:\n' + recentHistory.map(h => {
                        // Trim long messages in history to save tokens
                        const content = h.content.length > 300 ? h.content.substring(0, 300) + '...' : h.content
                        return `${h.role}: ${content}`
                    }).join('\n')
                }

                // RAG augmentation
                const augmentedPrompt = await RAGService.generateAugmentedPrompt(message)

                const fullPrompt = `${systemPrompt}${contextStr}${historyStr}\n\nUser: ${augmentedPrompt}\n\nTrả lời bằng tiếng Việt, thân thiện. Chỉ trả lời nội dung, không bọc JSON.`

                // Use generateContentStream for real streaming
                const result = await client.models.generateContentStream({
                    model: modelName!,
                    contents: [{ role: 'user', parts: [{ text: fullPrompt }] }],
                })

                let fullResponse = ''

                for await (const chunk of result) {
                    const text = chunk.text || ''
                    if (text) {
                        fullResponse += text
                        await writeSSE(writer, { type: 'token', content: text })
                    }
                }

                // Generate suggestions based on the full response
                const suggestions = generateSuggestions(message, fullResponse, !!isAdmin)
                await writeSSE(writer, { type: 'suggestions', content: suggestions })

                // Send done event
                await writeSSE(writer, {
                    type: 'done',
                    content: {
                        response: fullResponse,
                        suggestions,
                        confidence: 0.9,
                        sessionId,
                        timestamp: new Date().toISOString()
                    }
                })

                // Cache the response for future identical queries (non-blocking)
                cacheResponse(message, {
                    response: fullResponse,
                    suggestions,
                    confidence: 0.9
                }, !!isAdmin).catch(() => { /* ignore cache errors */ })

            } catch (error) {
                console.error('[Stream] AI generation error:', error)
                await writeSSE(writer, {
                    type: 'error',
                    content: 'Xin lỗi, hệ thống đang bận. Vui lòng thử lại sau.'
                })
            } finally {
                await writer.close()
            }
        })

    } catch (error) {
        console.error('[Stream] Route error:', error)
        return Response.json(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        )
    }
}

// ─── Suggestion Generator ───────────────────────────────────────────────────────

function generateSuggestions(userMessage: string, aiResponse: string, isAdmin: boolean): string[] {
    const lower = (userMessage + ' ' + aiResponse).toLowerCase()

    if (isAdmin) {
        return ['Báo cáo doanh thu', 'Tồn kho', 'Đơn hàng hôm nay']
    }

    const suggestions: string[] = []

    // Product-related
    if (lower.includes('xi măng') || lower.includes('cement')) {
        suggestions.push('So sánh các loại xi măng', 'Tính vật liệu xây nhà')
    }
    if (lower.includes('giá') || lower.includes('bao nhiêu')) {
        suggestions.push('Xem khuyến mãi', 'Đặt hàng ngay')
    }
    if (lower.includes('gạch') || lower.includes('cát') || lower.includes('đá')) {
        suggestions.push('Tính số lượng cần thiết', 'Tư vấn thêm')
    }
    if (lower.includes('công trình') || lower.includes('xây nhà')) {
        suggestions.push('Tính dự toán', 'Xem sản phẩm')
    }

    // Default suggestions if none matched
    if (suggestions.length === 0) {
        suggestions.push('Tìm sản phẩm', 'Tính vật liệu', 'Giá cả')
    }

    // Max 3 suggestions
    return suggestions.slice(0, 3)
}
