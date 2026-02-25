/**
 * POST /api/chat/smart-reply — AI-Suggested Replies for Admin/Staff
 * 
 * When a customer sends a message, this endpoint generates 3 contextual
 * reply suggestions that the admin can use with one click.
 * 
 * This dramatically speeds up admin response time (from typing 30s → click 1s).
 */

import { NextRequest, NextResponse } from 'next/server'
import { getWorkingModelConfig, parseGeminiJSON } from '@/lib/ai/ai-client'
import { prisma } from '@/lib/prisma'
import { verifyTokenFromRequest } from '@/lib/auth'

interface SmartReplyResult {
    replies: string[]
    context?: string
}

export async function POST(request: NextRequest) {
    try {
        // Auth check - only admin/staff can use
        const decoded = await verifyTokenFromRequest(request)
        if (!decoded || (decoded.role !== 'MANAGER' && decoded.role !== 'EMPLOYEE')) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
        }

        const body = await request.json()
        const { customerMessage, conversationId, customerName } = body

        if (!customerMessage) {
            return NextResponse.json(
                { success: false, error: 'Customer message is required' },
                { status: 400 }
            )
        }

        // Fetch recent conversation history for context (last 6 messages)
        let recentHistory: { senderId: string; content: string; senderName: string }[] = []
        if (conversationId) {
            try {
                const messages = await prisma.message.findMany({
                    where: { conversationId },
                    orderBy: { createdAt: 'desc' },
                    take: 6,
                    select: {
                        senderId: true,
                        senderName: true,
                        content: true
                    }
                })
                recentHistory = messages.reverse().map(m => ({
                    senderId: m.senderId,
                    content: m.content || '',
                    senderName: m.senderName
                }))
            } catch (err) {
                console.error('[SmartReply] Failed to fetch history:', err)
            }
        }

        // Fetch customer info for personalization
        let customerContext = ''
        if (conversationId) {
            try {
                const conv = await prisma.conversation.findUnique({
                    where: { id: conversationId }
                })

                if (conv) {
                    const customerId = conv.participant1Id === 'admin_support'
                        ? conv.participant2Id
                        : conv.participant1Id

                    // Only look up if it's a valid user ID (not guest)
                    if (customerId && !customerId.startsWith('guest_') && /^[a-f\d]{24}$/i.test(customerId)) {
                        const customer = await prisma.customer.findFirst({
                            where: { userId: customerId },
                            include: {
                                user: { select: { name: true } },
                                orders: {
                                    orderBy: { createdAt: 'desc' },
                                    take: 3,
                                    select: { orderNumber: true, status: true, netAmount: true }
                                }
                            }
                        })

                        if (customer) {
                            const recentOrders = customer.orders.map(o =>
                                `Đơn ${o.orderNumber} - ${o.status} - ${o.netAmount.toLocaleString('vi-VN')}đ`
                            ).join('; ')

                            customerContext = `\nThông tin khách hàng:
- Tên: ${customer.user?.name || customerName || 'Khách'}
- Hạng thành viên: ${customer.loyaltyTier || 'BRONZE'}
- Tổng chi tiêu: ${customer.totalPurchases?.toLocaleString('vi-VN') || 0}đ
- Đơn hàng gần đây: ${recentOrders || 'Chưa có'}`
                        }
                    } else {
                        customerContext = `\nKhách vãng lai: ${customerName || conv.participant1Name || 'Khách'}`
                    }
                }
            } catch (err) {
                console.error('[SmartReply] Customer lookup error:', err)
            }
        }

        // Build conversation context
        const historyText = recentHistory.length > 0
            ? '\n\nLịch sử hội thoại gần đây:\n' +
            recentHistory.map(m =>
                `[${m.senderName}]: ${m.content?.substring(0, 200) || '(trống)'}`
            ).join('\n')
            : ''

        // Generate smart replies with AI
        const { client, modelName } = await getWorkingModelConfig()
        if (!client) {
            return NextResponse.json({
                success: true,
                data: { replies: getDefaultReplies(customerMessage), context: 'fallback' }
            })
        }

        const prompt = `Bạn là nhân viên hỗ trợ CSKH chuyên nghiệp của cửa hàng vật liệu xây dựng SmartBuild.
${customerContext}
${historyText}

Tin nhắn mới nhất của khách hàng:
"${customerMessage}"

Hãy tạo ĐÚNG 3 câu trả lời gợi ý để nhân viên có thể chọn gửi nhanh.

Quy tắc:
1. Câu 1: Trả lời NGẮN GỌN, thân thiện, trực tiếp (1-2 câu)
2. Câu 2: Trả lời CHI TIẾT hơn, chuyên nghiệp, có thêm thông tin hữu ích (2-3 câu)
3. Câu 3: Trả lời MỞ RỘNG với gợi ý sản phẩm/dịch vụ liên quan (2-4 câu)

Tất cả phải bằng tiếng Việt, xưng "em/mình", gọi khách "anh/chị".

Trả về JSON mảng 3 string:
["câu 1", "câu 2", "câu 3"]`

        const result = await client.models.generateContent({
            model: modelName!,
            contents: [{ role: 'user', parts: [{ text: prompt }] }]
        })

        const responseText = (result as any).text || ''
        const parsed = parseGeminiJSON<string[]>(responseText, [])

        // Validate we got proper replies
        let replies = Array.isArray(parsed) && parsed.length >= 2
            ? parsed.slice(0, 3).map(r => typeof r === 'string' ? r : String(r))
            : getDefaultReplies(customerMessage)

        // Sanitize: ensure no extremely long replies
        replies = replies.map(r => r.length > 500 ? r.substring(0, 500) + '...' : r)

        return NextResponse.json({
            success: true,
            data: {
                replies,
                context: customerContext ? 'personalized' : 'generic'
            } satisfies SmartReplyResult
        })

    } catch (error) {
        console.error('[SmartReply] Error:', error)
        return NextResponse.json({
            success: true,
            data: { replies: getDefaultReplies(''), context: 'error_fallback' }
        })
    }
}

/**
 * Fallback replies when AI is unavailable
 */
function getDefaultReplies(customerMessage: string): string[] {
    const lower = (customerMessage || '').toLowerCase()

    if (lower.includes('giá') || lower.includes('bao nhiều')) {
        return [
            'Dạ, em gửi bảng giá chi tiết cho anh/chị ngay ạ!',
            'Chào anh/chị! Em kiểm tra giá cập nhật mới nhất và gửi lại cho mình nhé. Có cần báo giá sỉ không ạ?',
            'Dạ anh/chị ơi, giá sẽ tùy vào số lượng đặt hàng. Anh/chị cho em biết số lượng dự kiến để em báo giá tốt nhất ạ!'
        ]
    }

    if (lower.includes('giao hàng') || lower.includes('ship')) {
        return [
            'Dạ, shop miễn phí giao hàng cho đơn trên 500.000đ trong bán kính 10km ạ!',
            'Chào anh/chị! Thời gian giao hàng thường từ 1-3 ngày tùy khu vực. Em check địa chỉ giao cho mình nhé!',
            'Dạ anh/chị cho em xin địa chỉ giao hàng để em tính phí vận chuyển chính xác nhé. Đơn trên 500K thì freeship trong 10km ạ!'
        ]
    }

    return [
        'Dạ, em hiểu rồi ạ. Em hỗ trợ ngay cho anh/chị nhé!',
        'Cảm ơn anh/chị đã liên hệ! Em kiểm tra thông tin và phản hồi ngay ạ.',
        'Dạ anh/chị ơi, để em tìm hiểu kỹ hơn và gửi thông tin chi tiết cho mình nhé. Có điều gì khác em có thể giúp được không ạ?'
    ]
}
