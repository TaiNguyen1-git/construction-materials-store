import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id: conversationId } = await params
        const userId = request.headers.get('x-user-id')
        if (!userId) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
        }

        const { searchParams } = new URL(request.url)
        // Pagination could be added here (skip/take)

        const messages = await prisma.message.findMany({
            where: { conversationId },
            orderBy: { createdAt: 'asc' },
            take: 100 // Limit last 100 messages
        })

        // Mark as read for this user
        // We can do this async without awaiting if performance is key, but better to await.
        // Identify which participant am I (1 or 2) to reset unread count?
        // For now, simpler: Just update all messages sent by OTHER to Read? No, 'isRead' is per message.
        // Let's reset the Conversation.unreadX count.

        const conv = await prisma.conversation.findUnique({ where: { id: conversationId } })
        if (conv) {
            const isP1 = conv.participant1Id === userId

            // Reset my unread count
            if (isP1 && conv.unread1 > 0) {
                await prisma.conversation.update({ where: { id: conversationId }, data: { unread1: 0 } })
            } else if (!isP1 && conv.participant2Id === userId && conv.unread2 > 0) {
                await prisma.conversation.update({ where: { id: conversationId }, data: { unread2: 0 } })
            }
        }

        return NextResponse.json({ success: true, data: messages })

    } catch (error: any) {
        console.error('Fetch messages error:', error)
        return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }
}
