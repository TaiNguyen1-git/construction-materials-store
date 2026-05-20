import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyTokenFromRequest } from '@/lib/auth'

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id: conversationId } = await params
        const decoded = await verifyTokenFromRequest(request)
        const userId = decoded?.userId || request.headers.get('x-guest-id')

        if (!userId) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
        }

        const conv = await prisma.conversation.findUnique({
            where: { id: conversationId }
        })

        if (!conv) {
            return NextResponse.json({ success: false, error: 'Conversation not found' }, { status: 404 })
        }

        if (conv.isGroup) {
            const unreadMap = (conv.unreadByUser && typeof conv.unreadByUser === 'object')
                ? { ...(conv.unreadByUser as any) }
                : {}
            
            unreadMap[userId] = 0

            await prisma.conversation.update({
                where: { id: conversationId },
                data: {
                    unreadByUser: unreadMap
                }
            })
        } else {
            // For 1-1 chats
            const isAdminUser = decoded?.role === 'MANAGER' || decoded?.role === 'EMPLOYEE' || request.headers.get('x-user-role') === 'MANAGER' || request.headers.get('x-user-role') === 'EMPLOYEE'
            const isP1 = conv.participant1Id === userId || (isAdminUser && conv.participant1Id === 'admin_support')
            const isP2 = conv.participant2Id === userId || (isAdminUser && conv.participant2Id === 'admin_support')

            if (isP1 && conv.unread1 > 0) {
                await prisma.conversation.update({
                    where: { id: conversationId },
                    data: { unread1: 0 }
                })
            } else if (isP2 && conv.unread2 > 0) {
                await prisma.conversation.update({
                    where: { id: conversationId },
                    data: { unread2: 0 }
                })
            }
        }

        return NextResponse.json({ success: true })

    } catch (error: any) {
        console.error('[CONVERSATION_READ]', error)
        return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }
}
