import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
    try {
        const userId = request.headers.get('x-user-id')
        if (!userId) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
        }

        const body = await request.json()
        const { conversationId, content, fileUrl, fileName, fileType, tempId } = body

        if (!conversationId || (!content && !fileUrl)) {
            return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 })
        }

        const user = await prisma.user.findUnique({ where: { id: userId } })
        if (!user) return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 })

        const message = await prisma.message.create({
            data: {
                conversationId,
                senderId: userId,
                senderName: user.name,
                content: content || '',
                fileUrl,
                fileName,
                fileType,
                isRead: false
            }
        })

        // 1. Update conversation last message and unread counts
        const conv = await prisma.conversation.findUnique({ where: { id: conversationId } })
        if (conv) {
            const isP1 = conv.participant1Id === userId
            await prisma.conversation.update({
                where: { id: conversationId },
                data: {
                    lastMessage: content || (fileUrl ? 'Đã gửi một tệp đính kèm' : ''),
                    lastMessageAt: new Date(),
                    unread1: isP1 ? conv.unread1 : conv.unread1 + 1,
                    unread2: isP1 ? conv.unread2 + 1 : conv.unread2
                }
            })
        }

        // 2. Push to Firebase Realtime Database for Instant Sync
        try {
            const { getFirebaseDatabase } = await import('@/lib/firebase')
            const { ref, push, set } = await import('firebase/database')

            const db = getFirebaseDatabase()
            const messagesRef = ref(db, `conversations/${conversationId}/messages`)
            const newMessageRef = push(messagesRef)

            await set(newMessageRef, {
                id: message.id,
                tempId: tempId || null,
                senderId: userId,
                senderName: user.name,
                content: content || '',
                fileUrl: fileUrl || null,
                fileName: fileName || null,
                fileType: fileType || null,
                createdAt: message.createdAt.toISOString(),
                isRead: false
            })
        } catch (fbError) {
            console.error('Firebase sync failed:', fbError)
            // Still return success as DB write was successful
        }

        return NextResponse.json({ success: true, data: message })

    } catch (error: any) {
        console.error('Send message error:', error)
        return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }
}
