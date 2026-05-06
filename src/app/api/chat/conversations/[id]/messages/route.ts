import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id: conversationId } = await params
        const { verifyTokenFromRequest } = await import('@/lib/auth')
        const decoded = await verifyTokenFromRequest(request)
        
        const userId = decoded?.userId || request.headers.get('x-guest-id')
        if (!userId) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
        }

        const { searchParams } = new URL(request.url)
        // Pagination could be added here (skip/take)

        const messages = await prisma.message.findMany({
            where: { conversationId },
            orderBy: { createdAt: 'asc' },
            take: 100, // Limit last 100 messages
            include: {
                replyTo: {
                    select: {
                        id: true,
                        content: true,
                        senderName: true,
                        fileUrl: true,
                        fileType: true
                    }
                }
            }
        })

        // Mark as read for this user - FIRE AND FORGET (Run in background to speed up response)
        const updateUnreadPromise = (async () => {
            try {
                const conv = await prisma.conversation.findUnique({ where: { id: conversationId } })
                if (conv) {
                    const isP1 = conv.participant1Id === userId
                    if (isP1 && conv.unread1 > 0) {
                        await prisma.conversation.update({ where: { id: conversationId }, data: { unread1: 0 } })
                    } else if (!isP1 && conv.participant2Id === userId && conv.unread2 > 0) {
                        await prisma.conversation.update({ where: { id: conversationId }, data: { unread2: 0 } })
                    }
                }
            } catch (err) {
                console.error('Background unread update error:', err)
            }
        })()

        return NextResponse.json({ success: true, data: messages })

    } catch (error: any) {
        console.error('Fetch messages error:', error)
        return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }
}
