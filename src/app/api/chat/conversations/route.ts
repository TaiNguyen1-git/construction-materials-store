import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyTokenFromRequest } from '@/lib/auth'

// Admin support ID used for supplier conversations
const ADMIN_SUPPORT_ID = 'admin_support'

export async function GET(req: NextRequest) {
    try {
        const decoded = await verifyTokenFromRequest(req)
        if (!decoded) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
        }

        const userId = decoded.userId
        const userRole = decoded.role

        // Build query conditions
        const conditions = [
            { participant1Id: userId },
            { participant2Id: userId }
        ]

        // For MANAGER/EMPLOYEE, also include admin_support conversations (supplier chats)
        if (userRole === 'MANAGER' || userRole === 'EMPLOYEE') {
            conditions.push(
                { participant1Id: ADMIN_SUPPORT_ID },
                { participant2Id: ADMIN_SUPPORT_ID }
            )
        }

        // Find conversations where the user is either participant 1 or 2
        const conversations = await prisma.conversation.findMany({
            where: {
                OR: conditions
            },
            orderBy: {
                lastMessageAt: 'desc'
            }
        })

        // Format for frontend - identify other participant
        const formattedConversations = conversations.map(conv => {
            const isMyConv = conv.participant1Id === userId || conv.participant2Id === userId
            const isAdminSupport = conv.participant1Id === ADMIN_SUPPORT_ID || conv.participant2Id === ADMIN_SUPPORT_ID

            let otherParticipantId: string
            let otherParticipantName: string
            let unreadCount: number

            if (isMyConv) {
                const isP1 = conv.participant1Id === userId
                otherParticipantId = isP1 ? conv.participant2Id : conv.participant1Id
                otherParticipantName = isP1 ? (conv.participant2Name || 'Người dùng') : (conv.participant1Name || 'Người dùng')
                unreadCount = isP1 ? conv.unread1 : conv.unread2
            } else if (isAdminSupport) {
                // For admin viewing supplier conversations
                const supplierId = conv.participant1Id === ADMIN_SUPPORT_ID ? conv.participant2Id : conv.participant1Id
                const supplierName = conv.participant1Id === ADMIN_SUPPORT_ID ? conv.participant2Name : conv.participant1Name
                otherParticipantId = supplierId
                otherParticipantName = supplierName || 'Nhà cung cấp'
                // Admin sees unread for admin_support side
                unreadCount = conv.participant1Id === ADMIN_SUPPORT_ID ? conv.unread1 : conv.unread2
            } else {
                otherParticipantId = conv.participant2Id
                otherParticipantName = conv.participant2Name || 'Người dùng'
                unreadCount = 0
            }

            return {
                ...conv,
                otherParticipantId,
                otherParticipantName,
                unreadCount,
                isSupplierChat: isAdminSupport && !isMyConv
            }
        })

        return NextResponse.json({
            success: true,
            data: formattedConversations
        })

    } catch (error: any) {
        console.error('[CONVERSATIONS_GET]', error)
        return NextResponse.json({ message: error.message || 'Internal Server Error' }, { status: 500 })
    }
}

// POST /api/chat/conversations - Create or get a conversation
export async function POST(req: NextRequest) {
    try {
        const decoded = await verifyTokenFromRequest(req)
        const body = await req.json()
        const { recipientId, recipientName, projectId, projectTitle, senderId: guestId, senderName: guestName } = body

        // Determine current user ID and name
        let userId = decoded?.userId
        let userName = decoded?.name || 'Người dùng'

        if (!userId) {
            // Check if it's a guest request
            if (guestId && guestId.startsWith('guest_')) {
                userId = guestId
                userName = guestName || 'Khách'
            } else {
                return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
            }
        }

        if (!recipientId) {
            return NextResponse.json({ message: 'Recipient ID is required' }, { status: 400 })
        }

        // TypeScript safety
        const currentUserId = userId as string;

        // Check if conversation already exists
        let conversation = await prisma.conversation.findFirst({
            where: {
                OR: [
                    { participant1Id: currentUserId, participant2Id: recipientId },
                    { participant1Id: recipientId, participant2Id: currentUserId }
                ]
            }
        })

        if (!conversation) {
            // Get user names if not provided
            // Special handling for 'admin_support' channel - it's not a real user ID
            const isAdminSupportChannel = recipientId === 'admin_support'

            let user1Name = userName || 'Người dùng'
            let user2Name = recipientName || 'Hỗ trợ khách hàng'

            // Only query users if they have valid ObjectIDs (24 hex chars)
            const isValidObjectId = (id: string) => /^[a-f\d]{24}$/i.test(id)

            if (!isAdminSupportChannel) {
                const [user1, user2] = await Promise.all([
                    isValidObjectId(currentUserId)
                        ? prisma.user.findUnique({ where: { id: currentUserId }, select: { name: true } })
                        : null,
                    isValidObjectId(recipientId)
                        ? prisma.user.findUnique({ where: { id: recipientId }, select: { name: true } })
                        : null
                ])
                user1Name = user1?.name || userName || 'Người dùng'
                user2Name = user2?.name || recipientName || 'Người dùng'
            }

            conversation = await prisma.conversation.create({
                data: {
                    participant1Id: currentUserId,
                    participant1Name: user1Name,
                    participant2Id: recipientId,
                    participant2Name: user2Name,
                    projectId: projectId || null,
                    projectTitle: projectTitle || null
                }
            })

            // If an initial message is provided, create it now
            if (body.initialMessage) {
                const message = await prisma.message.create({
                    data: {
                        conversationId: conversation.id,
                        senderId: currentUserId,
                        senderName: user1Name,
                        content: body.initialMessage,
                        isRead: false
                    }
                })

                // Update conversation last message
                await prisma.conversation.update({
                    where: { id: conversation.id },
                    data: {
                        lastMessage: body.initialMessage.substring(0, 100),
                        lastMessageAt: new Date(),
                        unread2: 1 // Recipient has 1 unread
                    }
                })

                // Sync to Firebase
                try {
                    const { getFirebaseDatabase } = await import('@/lib/firebase')
                    const { ref, push, set } = await import('firebase/database')
                    const db = getFirebaseDatabase()
                    const messagesRef = ref(db, `conversations/${conversation.id}/messages`)
                    const newMessageRef = push(messagesRef)
                    await set(newMessageRef, {
                        id: message.id,
                        senderId: currentUserId,
                        senderName: message.senderName,
                        content: body.initialMessage,
                        createdAt: message.createdAt.toISOString(),
                        isRead: false
                    })
                } catch (fbError) {
                    console.error('Firebase sync failed:', fbError)
                }
            }
        }

        return NextResponse.json({
            success: true,
            data: conversation
        })

    } catch (error: any) {
        console.error('[CONVERSATIONS_POST]', error)
        return NextResponse.json({ message: error.message || 'Internal Server Error' }, { status: 500 })
    }
}
