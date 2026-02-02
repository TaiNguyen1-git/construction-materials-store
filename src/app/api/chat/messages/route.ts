import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// Admin support ID used for supplier conversations
const ADMIN_SUPPORT_ID = 'admin_support'
const ADMIN_SUPPORT_NAME = 'Hỗ trợ SmartBuild'

export async function POST(request: NextRequest) {
    try {
        const userId = request.headers.get('x-user-id')
        const userRole = request.headers.get('x-user-role')

        if (!userId) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
        }

        const body = await request.json()
        const { conversationId, content, fileUrl, fileName, fileType, tempId } = body

        if (!conversationId || (!content && !fileUrl)) {
            return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 })
        }

        // Get conversation to determine if it's a supplier chat
        const conv = await prisma.conversation.findUnique({ where: { id: conversationId } })
        if (!conv) {
            return NextResponse.json({ success: false, error: 'Conversation not found' }, { status: 404 })
        }

        // Check if this is a supplier conversation (has admin_support as participant)
        const isSupplierConv = conv.participant1Id === ADMIN_SUPPORT_ID || conv.participant2Id === ADMIN_SUPPORT_ID
        const isAdminUser = userRole === 'MANAGER' || userRole === 'EMPLOYEE'

        // Determine sender ID and name
        let senderId = userId
        let senderName = body.senderName || 'Người dùng'

        if (isSupplierConv && isAdminUser) {
            // Admin sending in supplier conversation - use admin_support identity
            senderId = ADMIN_SUPPORT_ID
            senderName = ADMIN_SUPPORT_NAME
        } else if (!body.senderName) {
            // Regular user or supplier (if not providing name) - get their info
            const [user, supplier] = await Promise.all([
                prisma.user.findUnique({ where: { id: userId } }),
                prisma.supplier.findUnique({ where: { id: userId } })
            ])

            if (user) {
                senderName = user.name
            } else if (supplier) {
                senderName = supplier.name
            } else if (!userId.startsWith('guest_')) {
                // If not found and not a guest, it might be an issue, but let's not 404
                // senderName stays 'Người dùng' or body.senderName
            }
        }

        const message = await prisma.message.create({
            data: {
                conversationId,
                senderId,
                senderName,
                content: content || '',
                fileUrl,
                fileName,
                fileType,
                isRead: false
            }
        })

        // Update conversation last message and unread counts
        const isP1 = conv.participant1Id === senderId
        await prisma.conversation.update({
            where: { id: conversationId },
            data: {
                lastMessage: content || (fileUrl ? 'Đã gửi một tệp đính kèm' : ''),
                lastMessageAt: new Date(),
                unread1: isP1 ? conv.unread1 : conv.unread1 + 1,
                unread2: isP1 ? conv.unread2 + 1 : conv.unread2
            }
        })

        // Push to Firebase Realtime Database for Instant Sync
        try {
            const { getFirebaseDatabase } = await import('@/lib/firebase')
            const { ref, push, set } = await import('firebase/database')

            const db = getFirebaseDatabase()
            const messagesRef = ref(db, `conversations/${conversationId}/messages`)
            const newMessageRef = push(messagesRef)

            await set(newMessageRef, {
                id: message.id,
                tempId: tempId || null,
                senderId,
                senderName,
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

    } catch (error: unknown) {
        console.error('Send message error:', error)
        return NextResponse.json({ success: false, error: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 })
    }
}

