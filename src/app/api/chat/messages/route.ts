import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// Admin support ID used for supplier conversations
const ADMIN_SUPPORT_ID = 'admin_support'
const ADMIN_SUPPORT_NAME = 'Hỗ trợ SmartBuild'

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const { conversationId, content, fileUrl, fileName, fileType, tempId, senderId: bodySenderId, senderName: bodySenderName, replyToId, adminOnly } = body

        // Get userId from JWT, header, or body
        const { verifyTokenFromRequest } = await import('@/lib/auth')
        const decoded = await verifyTokenFromRequest(request)
        
        const userId = decoded?.userId || request.headers.get('x-guest-id') || bodySenderId
        const userRole = decoded?.role || request.headers.get('x-user-role') || (userId?.startsWith('guest_') ? 'GUEST' : null)

        if (!userId) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
        }

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
        let senderName = bodySenderName || 'Người dùng'

        if (isSupplierConv && isAdminUser) {
            // Admin sending in supplier conversation - use admin_support identity
            senderId = ADMIN_SUPPORT_ID
            // We keep the actual bodySenderName so admins can see who replied
            if (bodySenderName) senderName = bodySenderName
        } else if (!bodySenderName) {
            // Regular user or supplier (if not providing name) - get their info
            // 🛡️ FIX: Only query if userId is a valid ObjectId hex string (24 chars)
            // Guests use 'guest_xxx' which is not a valid ObjectId and would cause Prisma to throw 500
            const isValidObjectId = userId && userId.length === 24 && /^[0-9a-fA-F]+$/.test(userId)
            
            if (isValidObjectId) {
                const [user, supplier] = await Promise.all([
                    prisma.user.findUnique({ where: { id: userId } }),
                    prisma.supplier.findUnique({ where: { id: userId } })
                ])

                if (user) {
                    senderName = user.name
                } else if (supplier) {
                    senderName = supplier.name
                }
            } else if (userId?.startsWith('guest_')) {
                senderName = 'Khách'
            }
        }

        const isAgreement = content && /chốt|đồng ý|ok|đã thỏa thuận|giá.*thống nhất/i.test(content) && content.length < 100

        const message = await prisma.message.create({
            data: {
                conversationId,
                senderId,
                senderName,
                senderRole: isAdminUser ? userRole : (userId === 'smartbuild_bot' ? 'BOT' : (userId === 'system' ? 'SYSTEM' : 'CUSTOMER')),
                realSenderId: userId,
                content: content || '',
                fileUrl,
                fileName,
                fileType,
                isRead: false,
                isDelivered: true,
                deliveredAt: new Date(),
                replyToId: replyToId || undefined,
                metadata: {
                    ...(isAgreement ? { type: 'AGREEMENT_PROPOSAL' } : {}),
                    tempId,
                    adminOnly
                }
            },
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

        // Update conversation last message and unread counts
        if (conv.isGroup) {
            const unreadMap = (conv.unreadByUser && typeof conv.unreadByUser === 'object')
                ? { ...(conv.unreadByUser as any) }
                : {}
            
            // Increment unread count for all other participants in the group
            const participantIds = conv.participantIds || []
            participantIds.forEach((pid: string) => {
                if (pid !== userId) {
                    unreadMap[pid] = (unreadMap[pid] || 0) + 1
                }
            })

            await prisma.conversation.update({
                where: { id: conversationId },
                data: {
                    lastMessage: content || (fileUrl ? 'Đã gửi một tệp đính kèm' : ''),
                    lastMessageAt: new Date(),
                    unreadByUser: unreadMap
                }
            })
        } else {
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
        }

        // Push to Firebase Realtime Database for Instant Sync
        try {
            const { getFirebaseDatabase } = await import('@/lib/firebase')
            const { ref, push, set } = await import('firebase/database')

            const db = getFirebaseDatabase()
            const messageRef = ref(db, `conversations/${conversationId}/messages/${message.id}`)

            await set(messageRef, {
                id: message.id,
                tempId: tempId || null,
                senderId,
                senderName,
                senderRole: (message as any).senderRole,
                realSenderId: userId,
                content: content || '',
                fileUrl: fileUrl || null,
                fileName: fileName || null,
                fileType: fileType || null,
                createdAt: message.createdAt.toISOString(),
                isRead: false,
                isDelivered: true,
                deliveredAt: message.createdAt.toISOString(),
                replyTo: (message as any).replyTo || null,
                metadata: message.metadata || null,
                adminOnly: adminOnly || false
            })

            // Trigger Web Push and In-App Notifications if sending to Admin Support
            console.log('[CHAT_MSG] Notification check:', { isSupplierConv, isAdminUser, senderId, userId })
            const isSupportRequest = senderId === 'system' && content === 'Khách hàng yêu cầu hỗ trợ trực tiếp từ nhân viên.'
            if (isSupplierConv && !isAdminUser && isSupportRequest) {
                console.log('[CHAT_MSG] Triggering notifications lookup...')
                
                // 1. Fetch all admins with roles MANAGER/EMPLOYEE
                const admins = await prisma.user.findMany({
                    where: {
                        role: { in: ['MANAGER', 'EMPLOYEE'] }
                    },
                    select: { id: true }
                })
                
                const adminIds = admins.map(a => a.id)

                if (adminIds.length > 0) {
                    // 2. Create In-App Notifications in Prisma
                    try {
                        await prisma.notification.createMany({
                            data: adminIds.map(adminId => ({
                                userId: adminId,
                                title: `Tin nhắn mới từ ${senderName}`,
                                message: content || (fileUrl ? 'Đã gửi một tệp đính kèm' : 'Đang nhắn tin...'),
                                type: 'INFO',
                                priority: 'MEDIUM',
                                referenceId: conversationId,
                                referenceType: 'CONVERSATION',
                                metadata: { url: `/admin/messages?id=${conversationId}` }
                            }))
                        })
                    } catch (dbNotifyErr) {
                        console.error('Failed to create DB notifications:', dbNotifyErr)
                    }

                    // 3. Push to Firebase for real-time bell update
                    try {
                        const { pushNotificationToFirebase } = await import('@/lib/firebase-notifications')
                        for (const adminId of adminIds) {
                            await pushNotificationToFirebase({
                                userId: adminId,
                                userRole: 'MANAGER',
                                title: `Tin nhắn mới từ ${senderName}`,
                                message: content || (fileUrl ? 'Đã gửi một tệp đính kèm' : 'Đang nhắn tin...'),
                                type: 'INFO',
                                priority: 'MEDIUM',
                                read: false,
                                createdAt: new Date().toISOString(),
                                referenceId: conversationId,
                                referenceType: 'CONVERSATION',
                                data: { url: `/admin/messages?id=${conversationId}` }
                            })
                        }
                    } catch (fbNotifyErr) {
                        console.error('Failed to push Firebase notifications:', fbNotifyErr)
                    }

                    // 4. Existing Web Push Notification logic
                    const adminSubscriptions = await prisma.userPushSubscription.findMany({
                        where: {
                            userId: { in: adminIds }
                        }
                    })
                    
                    console.log('[CHAT_MSG] Found admin web-push subscriptions:', adminSubscriptions.length)

                    if (adminSubscriptions.length > 0) {
                        const webpush = (await import('@/lib/webpush')).default
                        const payload = JSON.stringify({
                            title: `Khách hàng mới: ${senderName}`,
                            body: content || (fileUrl ? 'Đã gửi một tệp đính kèm' : 'Đang gửi tin nhắn...'),
                            icon: '/images/smartbuild_bot.png',
                            url: `/admin/messages?id=${conversationId}`
                        })

                        adminSubscriptions.forEach((sub: any) => {
                            webpush.sendNotification(
                                {
                                    endpoint: sub.endpoint,
                                    keys: sub.keys as any
                                },
                                payload
                            ).catch((err: any) => {
                                if (err.statusCode === 410 || err.statusCode === 404) {
                                    prisma.userPushSubscription.delete({ where: { id: sub.id } }).catch(() => { })
                                }
                                console.error('Push failed for sub:', sub.id, err.message)
                            })
                        })
                    }
                }
            }

        } catch (fbError) {
            console.error('Firebase/Push sync failed:', fbError)
            // Still return success as DB write was successful
        }

        return NextResponse.json({ success: true, data: message })

    } catch (error: unknown) {
        console.error('Send message error:', error)
        return NextResponse.json({ success: false, error: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 })
    }
}

