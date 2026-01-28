import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { AI_CONFIG } from '@/lib/ai-config'
import { getFirebaseDatabase } from '@/lib/firebase'
import { ref, push, set } from 'firebase/database'

const genAI = new GoogleGenerativeAI(AI_CONFIG.GEMINI.API_KEY)

// POST /api/chat/summary - Generate AI summary for a conversation
export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const { conversationId } = body

        if (!conversationId) {
            return NextResponse.json({ error: 'Missing conversationId' }, { status: 400 })
        }

        const userId = request.headers.get('x-user-id')
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // Fetch conversation and messages
        const conversation = await (prisma as any).conversation.findUnique({
            where: { id: conversationId },
            include: {
                messages: {
                    orderBy: { createdAt: 'asc' },
                    take: 100 // Limit to last 100 messages
                }
            }
        })

        if (!conversation) {
            return NextResponse.json({ error: 'Conversation not found' }, { status: 404 })
        }

        // Security Check: Ensure requester is a participant
        if (conversation.participant1Id !== userId && conversation.participant2Id !== userId) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
        }

        if (conversation.messages.length < 3) {
            return NextResponse.json({
                error: 'Cần ít nhất 3 tin nhắn để tạo tóm tắt'
            }, { status: 400 })
        }

        // Format messages for AI
        // Format messages for AI (Truncate long messages to save tokens)
        const messagesText = conversation.messages
            .map((m: any) => {
                let content = m.content || '(file đính kèm)'
                if (content.length > 500) content = content.substring(0, 500) + '...'
                return `[${m.senderName}]: ${content}`
            })
            .join('\n')

        // Generate summary using AI with fallback logic
        const models = ['gemini-2.5-flash', 'gemini-2.5-flash-lite', 'gemini-1.5-flash']
        let responseText = ''
        let lastError: any = null

        const prompt = `
Bạn là trợ lý pháp lý chuyên tóm tắt các cuộc thương lượng xây dựng. Hãy phân tích cuộc hội thoại sau và trích xuất các thỏa thuận quan trọng.

**Cuộc hội thoại giữa "${conversation.participant1Name}" và "${conversation.participant2Name}":**
${messagesText}

**Yêu cầu:**
Trả về JSON với định dạng sau:
{
  "title": "Tiêu đề ngắn gọn cho biên bản (VD: Thỏa thuận thi công lát nền)",
  "summary": "Tóm tắt chi tiết các nội dung đã trao đổi (3-5 câu)",
  "agreedPrice": null hoặc số (VD: 200000),
  "priceUnit": null hoặc "m2" hoặc "total" hoặc "day",
  "agreedDate": null hoặc "YYYY-MM-DD",
  "keyTerms": [
    { "term": "Tên điều khoản", "value": "Giá trị", "confidence": 0.9 }
  ]
}

Lưu ý:
- Chỉ trích xuất những gì được nói rõ ràng trong hội thoại
- Đừng suy đoán nếu không có thông tin cụ thể
- confidence từ 0-1 thể hiện độ chắc chắn của thông tin
- Chỉ trả về JSON, không có text khác
`

        for (const modelName of models) {
            try {
                const model = genAI.getGenerativeModel({ model: modelName })
                const result = await model.generateContent(prompt)
                responseText = result.response.text()
                if (responseText) break
            } catch (err: any) {
                console.error(`Model ${modelName} failed, trying fallback...`, err.message)
                lastError = err
                continue
            }
        }

        if (!responseText) {
            throw lastError || new Error('All AI models failed')
        }

        // Parse AI response
        let summaryData: any = {
            title: `Biên bản chat - ${new Date().toLocaleDateString('vi-VN')}`,
            summary: 'Không thể phân tích cuộc hội thoại',
            keyTerms: []
        }

        try {
            const jsonMatch = responseText.match(/\{[\s\S]*\}/)
            if (jsonMatch) {
                summaryData = JSON.parse(jsonMatch[0])
            }
        } catch (parseError) {
            console.error('Error parsing AI response:', parseError)
        }

        // Save summary to database
        const chatSummary = await (prisma as any).chatSummary.create({
            data: {
                conversationId,
                title: summaryData.title,
                summary: summaryData.summary,
                agreedPrice: summaryData.agreedPrice ? parseFloat(summaryData.agreedPrice) : null,
                priceUnit: summaryData.priceUnit || null,
                agreedDate: summaryData.agreedDate ? new Date(summaryData.agreedDate) : null,
                keyTerms: summaryData.keyTerms || [],
                participant1Name: conversation.participant1Name,
                participant2Name: conversation.participant2Name,
                messageCount: conversation.messages.length,
                fromMessageId: conversation.messages[0]?.id,
                toMessageId: conversation.messages[conversation.messages.length - 1]?.id,
                isConfirmed: false,
                confirmedBy: []
            }
        })

        return NextResponse.json({
            success: true,
            summary: chatSummary,
            message: 'Đã tạo biên bản tóm tắt thành công'
        })

    } catch (error) {
        console.error('Error generating chat summary:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

// GET /api/chat/summary?conversationId=xxx - Get summaries for a conversation
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const conversationId = searchParams.get('conversationId')

        if (!conversationId) {
            return NextResponse.json({ error: 'Missing conversationId' }, { status: 400 })
        }

        const userId = request.headers.get('x-user-id')
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // Verify user is part of the conversation
        const conversation = await (prisma as any).conversation.findUnique({
            where: { id: conversationId },
            select: { participant1Id: true, participant2Id: true }
        })

        if (!conversation) {
            return NextResponse.json({ error: 'Conversation not found' }, { status: 404 })
        }

        if (conversation.participant1Id !== userId && conversation.participant2Id !== userId) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
        }

        const summaries = await (prisma as any).chatSummary.findMany({
            where: { conversationId },
            orderBy: { createdAt: 'desc' }
        })

        return NextResponse.json({ summaries })

    } catch (error) {
        console.error('Error fetching chat summaries:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

// PATCH /api/chat/summary - Confirm a summary
export async function PATCH(request: NextRequest) {
    try {
        const body = await request.json()
        const { summaryId, userId } = body

        if (!summaryId || !userId) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
        }

        const summary = await (prisma as any).chatSummary.findUnique({
            where: { id: summaryId }
        })

        if (!summary) {
            return NextResponse.json({ error: 'Summary not found' }, { status: 404 })
        }

        // Add user to confirmed list
        const confirmedBy = summary.confirmedBy || []
        if (!confirmedBy.includes(userId)) {
            confirmedBy.push(userId)
        }

        // Check if both parties confirmed
        const isConfirmed = confirmedBy.length >= 2

        const updatedSummary = await (prisma as any).chatSummary.update({
            where: { id: summaryId },
            data: {
                confirmedBy,
                isConfirmed
            }
        })

        // Notify via Firebase for real-time update in UI
        try {
            const db = getFirebaseDatabase()
            const syncRef = ref(db, `conversations/${summary.conversationId}/system_events`)
            const newEventRef = push(syncRef)
            await set(newEventRef, {
                type: 'SUMMARY_UPDATED',
                summaryId: summary.id,
                isConfirmed,
                confirmedBy,
                updatedAt: new Date().toISOString()
            })
        } catch (syncError) {
            console.error('Firebase summary sync error:', syncError)
        }

        return NextResponse.json({
            success: true,
            summary: updatedSummary,
            message: isConfirmed
                ? 'Cả hai bên đã xác nhận biên bản!'
                : 'Đã ghi nhận xác nhận của bạn. Đang chờ bên còn lại.'
        })

    } catch (error) {
        console.error('Error confirming summary:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
