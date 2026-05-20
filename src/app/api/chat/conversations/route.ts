import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyTokenFromRequest } from '@/lib/auth'
import { decodeId } from '@/lib/id-utils'

// Admin support ID used for supplier conversations
const ADMIN_SUPPORT_ID = 'admin_support'

// Only query users if they have valid ObjectIDs (24 hex chars)
const isValidObjectId = (id: string) => /^[a-f\d]{24}$/i.test(id)

export async function GET(req: NextRequest) {
    try {
        const decoded = await verifyTokenFromRequest(req)
        const { searchParams } = new URL(req.url)
        
        let userId: string | null = decoded?.userId || null
        let userRole: string | null = decoded?.role || null

        // Support for Guest users
        if (!userId) {
            const guestId = req.headers.get('x-guest-id') || searchParams.get('guestId')
            if (guestId && guestId.startsWith('guest_')) {
                userId = guestId
                userRole = 'GUEST'
            }
        }

        if (!userId) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
        }

        // Build raw MongoDB filter
        const filter: any = {}

        const conditions: any[] = [
            { participant1Id: userId },
            { participant2Id: userId },
            { participantIds: userId }
        ]

        // For MANAGER/EMPLOYEE, also include admin_support conversations (supplier chats)
        if (userRole === 'MANAGER' || userRole === 'EMPLOYEE') {
            conditions.push(
                { participant1Id: ADMIN_SUPPORT_ID },
                { participant2Id: ADMIN_SUPPORT_ID }
            )
        }

        filter.$or = conditions

        // Exclude deleted conversations for this user
        filter.deletedByIds = { $nin: [userId] }

        const archived = searchParams.get('archived') === 'true'
        const cursor = searchParams.get('cursor') || undefined
        const limit = parseInt(searchParams.get('limit') || '50', 10)

        if (archived) {
            filter.archivedByIds = { $in: [userId] }
        } else {
            filter.archivedByIds = { $nin: [userId] }
            filter.hiddenByIds = { $nin: [userId] }
        }

        // Handle cursor pagination
        if (cursor) {
            const cursorConv = await prisma.conversation.findUnique({
                where: { id: cursor },
                select: { lastMessageAt: true }
            })
            if (cursorConv && cursorConv.lastMessageAt) {
                filter.lastMessageAt = { $lt: { $date: cursorConv.lastMessageAt.toISOString() } }
            }
        }

        // Find conversations via findRaw to bypass Prisma's array NOT has bug
        const rawConversations = await prisma.conversation.findRaw({
            filter,
            options: {
                limit: limit + 1,
                sort: { lastMessageAt: -1 }
            }
        }) as unknown as any[]

        const hasNextPage = rawConversations.length > limit
        const items = hasNextPage ? rawConversations.slice(0, limit) : rawConversations
        const nextCursor = hasNextPage ? (items[items.length - 1]._id?.$oid || items[items.length - 1].id) : null

        // Format for frontend - identify other participant
        const formattedConversations = items.map(conv => {
            const convId = conv._id?.$oid || conv.id
            const isMyConv = conv.participant1Id === userId || conv.participant2Id === userId
            const isAdminSupport = conv.participant1Id === ADMIN_SUPPORT_ID || conv.participant2Id === ADMIN_SUPPORT_ID
            const isGroup = conv.isGroup === true || conv.isGroup === 'true'

            let otherParticipantId: string
            let otherParticipantName: string
            let unreadCount: number

            if (isGroup) {
                otherParticipantId = ''
                otherParticipantName = conv.groupTitle || 'Trò chuyện nhóm'
                const unreadMap = (conv.unreadByUser && typeof conv.unreadByUser === 'object') ? conv.unreadByUser : {}
                unreadCount = (unreadMap as any)[userId as string] || 0
            } else if (isMyConv) {
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
                id: convId,
                participant1Id: conv.participant1Id || '',
                participant1Name: conv.participant1Name || '',
                participant2Id: conv.participant2Id || '',
                participant2Name: conv.participant2Name || '',
                projectId: conv.projectId?.$oid || conv.projectId || null,
                projectTitle: conv.projectTitle || null,
                lastMessage: conv.lastMessage || null,
                lastMessageAt: conv.lastMessageAt?.$date ? new Date(conv.lastMessageAt.$date) : (conv.lastMessageAt ? new Date(conv.lastMessageAt) : null),
                unread1: conv.unread1 || 0,
                unread2: conv.unread2 || 0,
                createdAt: conv.createdAt?.$date ? new Date(conv.createdAt.$date) : (conv.createdAt ? new Date(conv.createdAt) : new Date()),
                updatedAt: conv.updatedAt?.$date ? new Date(conv.updatedAt.$date) : (conv.updatedAt ? new Date(conv.updatedAt) : new Date()),
                hiddenByIds: conv.hiddenByIds || [],
                deletedByIds: conv.deletedByIds || [],
                archivedByIds: conv.archivedByIds || [],
                otherUserId: otherParticipantId,
                otherUserName: otherParticipantName,
                unreadCount,
                isSupplierChat: isAdminSupport && !isMyConv,
                isGroup,
                groupTitle: conv.groupTitle || null,
                groupAvatar: conv.groupAvatar || null,
                participantIds: conv.participantIds || [],
                participantNames: conv.participantNames || [],
                unreadByUser: conv.unreadByUser || null
            }
        })

        return NextResponse.json({
            success: true,
            data: formattedConversations,
            nextCursor
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
        const { recipientId, recipientName, projectId, projectTitle, senderId: guestId, senderName: guestName, isGroup, groupTitle, participantIds: reqParticipantIds } = body

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

        if (isGroup) {
            if (!groupTitle) {
                return NextResponse.json({ message: 'Group title is required' }, { status: 400 })
            }
            if (!reqParticipantIds || !Array.isArray(reqParticipantIds) || reqParticipantIds.length === 0) {
                return NextResponse.json({ message: 'Participants are required for group chat' }, { status: 400 })
            }

            const allParticipantIds = Array.from(new Set([userId as string, ...reqParticipantIds]))
            
            const resolvedParticipants = await Promise.all(
                allParticipantIds.map(async (pid) => {
                    let name = 'Người dùng'
                    if (isValidObjectId(pid)) {
                        const user = await prisma.user.findUnique({ where: { id: pid }, select: { name: true } })
                        if (user?.name) {
                            name = user.name
                        } else {
                            const supplier = await prisma.supplier.findUnique({ where: { id: pid }, select: { name: true } })
                            if (supplier?.name) {
                                name = supplier.name
                            }
                        }
                    } else if (pid === 'admin_support') {
                        name = 'Hỗ trợ SmartBuild'
                    } else if (pid.startsWith('guest_')) {
                        name = 'Khách'
                    }
                    return { id: pid, name }
                })
            )

            const participantIds = resolvedParticipants.map(rp => rp.id)
            const participantNames = resolvedParticipants.map(rp => rp.name)

            const unreadByUser: any = {}
            participantIds.forEach(pid => {
                unreadByUser[pid] = 0
            })

            const conversation = await prisma.conversation.create({
                data: {
                    participant1Id: 'group',
                    participant1Name: 'Group Chat',
                    participant2Id: 'group',
                    participant2Name: 'Group Chat',
                    isGroup: true,
                    groupTitle,
                    participantIds,
                    participantNames,
                    unreadByUser,
                    projectId: projectId || null,
                    projectTitle: projectTitle || null,
                    lastMessage: 'Đã tạo nhóm',
                    lastMessageAt: new Date()
                }
            })

            return NextResponse.json({
                success: true,
                data: {
                    id: conversation.id,
                    participant1Id: 'group',
                    participant1Name: 'Group Chat',
                    participant2Id: 'group',
                    participant2Name: 'Group Chat',
                    projectId: conversation.projectId,
                    projectTitle: conversation.projectTitle,
                    lastMessage: conversation.lastMessage,
                    lastMessageAt: conversation.lastMessageAt,
                    unread1: 0,
                    unread2: 0,
                    createdAt: conversation.createdAt,
                    updatedAt: conversation.updatedAt,
                    hiddenByIds: [],
                    deletedByIds: [],
                    archivedByIds: [],
                    otherUserId: '',
                    otherUserName: groupTitle,
                    unreadCount: 0,
                    isSupplierChat: false,
                    isGroup: true,
                    groupTitle,
                    groupAvatar: null,
                    participantIds,
                    participantNames,
                    unreadByUser
                }
            })
        }

        if (!recipientId) {
            return NextResponse.json({ message: 'Recipient ID is required' }, { status: 400 })
        }

        let decodedRecipientId = decodeId(recipientId)
        
        // Resolve ContractorProfile ID to User ID if necessary
        // This ensures the conversation is linked to the real User account for the contractor
        if (isValidObjectId(decodedRecipientId)) {
            const contractor = await prisma.contractorProfile.findUnique({
                where: { id: decodedRecipientId },
                include: { customer: { select: { userId: true } } }
            })
            if (contractor && contractor.customer?.userId) {
                decodedRecipientId = contractor.customer.userId
            }
        }
        
        // TypeScript safety
        const currentUserId = userId as string;

        // Check if conversation already exists
        let conversation = await prisma.conversation.findFirst({
            where: {
                OR: [
                    { participant1Id: currentUserId, participant2Id: decodedRecipientId },
                    { participant1Id: decodedRecipientId, participant2Id: currentUserId }
                ]
            }
        })

        if (!conversation) {
            // Get user names if not provided
            // Special handling for 'admin_support' channel - it's not a real user ID
            const isAdminSupportChannel = decodedRecipientId === 'admin_support'

            let user1Name = userName || 'Người dùng'
            let user2Name = recipientName || 'Hỗ trợ khách hàng'

            if (!isAdminSupportChannel) {
                const [user1, user2] = await Promise.all([
                    isValidObjectId(currentUserId)
                        ? prisma.user.findUnique({ where: { id: currentUserId }, select: { name: true } })
                        : null,
                    isValidObjectId(decodedRecipientId)
                        ? prisma.user.findUnique({ where: { id: decodedRecipientId }, select: { name: true } })
                        : null
                ])
                user1Name = user1?.name || userName || 'Người dùng'
                user2Name = user2?.name || recipientName || 'Người dùng'
            }

            conversation = await prisma.conversation.create({
                data: {
                    participant1Id: currentUserId,
                    participant1Name: user1Name,
                    participant2Id: decodedRecipientId,
                    participant2Name: user2Name,
                    projectId: projectId || null,
                    projectTitle: projectTitle || null,
                    lastMessage: 'Bắt đầu trò chuyện',
                    lastMessageAt: new Date()
                }
            });
            
            if (!conversation) {
                throw new Error('Failed to create conversation');
            }
            const currentConv = conversation;

            // Create notification for the recipient(s)
            try {
                if (isAdminSupportChannel) {
                    // Notify all admins/managers
                    const admins = await prisma.user.findMany({
                        where: {
                            role: { in: ['MANAGER', 'EMPLOYEE'] }
                        },
                        select: { id: true }
                    });

                    if (admins.length > 0) {
                        const adminIds = admins.map(a => a.id);
                        
                        // Create in DB
                        await prisma.notification.createMany({
                            data: adminIds.map(adminId => ({
                                userId: adminId,
                                title: 'Yêu cầu hỗ trợ mới',
                                message: `${user1Name} đang cần hỗ trợ trực tuyến.`,
                                type: 'INFO',
                                priority: 'HIGH',
                                referenceId: currentConv.id,
                                referenceType: 'CONVERSATION',
                                metadata: { url: `/admin/messages?id=${currentConv.id}` }
                            }))
                        });

                        // Push to Firebase for real-time
                        const { pushNotificationToFirebase } = await import('@/lib/firebase-notifications');
                        for (const adminId of adminIds) {
                            await pushNotificationToFirebase({
                                userId: adminId,
                                userRole: 'MANAGER', // Default for push logic
                                title: 'Yêu cầu hỗ trợ mới',
                                message: `${user1Name} đang cần hỗ trợ trực tuyến.`,
                                type: 'INFO',
                                priority: 'HIGH',
                                read: false,
                                createdAt: new Date().toISOString(),
                                referenceId: currentConv.id,
                                referenceType: 'CONVERSATION',
                                data: { url: `/admin/messages?id=${currentConv.id}` }
                            });
                        }
                    }
                } else {
                    // Original single notification logic for direct chats
                    await prisma.notification.create({
                        data: {
                            userId: decodedRecipientId,
                            title: 'Tin nhắn tư vấn mới',
                            message: `Bạn có một yêu cầu tư vấn mới từ ${user1Name}.`,
                            type: 'INFO',
                            referenceId: currentConv.id,
                            referenceType: 'CONVERSATION',
                            metadata: { url: `/messages?id=${currentConv.id}` }
                        }
                    })

                    // Push to Firebase for direct recipient
                    try {
                        const { pushNotificationToFirebase } = await import('@/lib/firebase-notifications');
                        await pushNotificationToFirebase({
                            userId: decodedRecipientId,
                            userRole: 'CUSTOMER', // Fallback
                            title: 'Tin nhắn tư vấn mới',
                            message: `Bạn có một yêu cầu tư vấn mới từ ${user1Name}.`,
                            type: 'INFO',
                            priority: 'MEDIUM',
                            read: false,
                            createdAt: new Date().toISOString(),
                            referenceId: currentConv.id,
                            referenceType: 'CONVERSATION',
                            data: { url: `/messages?id=${currentConv.id}` }
                        });
                    } catch (fbErr) {
                        console.error('Firebase push failed:', fbErr);
                    }
                }
            } catch (notifyError) {
                console.error('Failed to create notification:', notifyError)
            }

            // If an initial message is provided, create it now
            if (body.initialMessage) {
                const message = await prisma.message.create({
                    data: {
                        conversationId: currentConv.id,
                        senderId: currentUserId,
                        senderName: user1Name,
                        content: body.initialMessage,
                        isRead: false
                    }
                })

                // Update conversation last message
                await prisma.conversation.update({
                    where: { id: currentConv.id },
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
                    const messageRef = ref(db, `conversations/${currentConv.id}/messages/${message.id}`)
                    await set(messageRef, {
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

        const finalConversation = conversation;
        if (!finalConversation) {
            return NextResponse.json({ message: 'Conversation not found' }, { status: 404 });
        }

        // Format the response for the frontend
        const isP1 = finalConversation.participant1Id === userId
        const formattedConv = {
            ...finalConversation,
            otherUserId: isP1 ? finalConversation.participant2Id : finalConversation.participant1Id,
            otherUserName: isP1 ? finalConversation.participant2Name : finalConversation.participant1Name,
            unreadCount: 0
        }

        return NextResponse.json({
            success: true,
            data: formattedConv
        })

    } catch (error: any) {
        console.error('[CONVERSATIONS_POST]', error)
        return NextResponse.json({ message: error.message || 'Internal Server Error' }, { status: 500 })
    }
}
