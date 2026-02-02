import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createSuccessResponse, createErrorResponse } from '@/lib/api-types'
import { getFirebaseDatabase } from '@/lib/firebase'
import { ref, push, set } from 'firebase/database'

// Fixed Admin Support User ID - This is the system account for supplier support
const ADMIN_SUPPORT_ID = 'admin_support'
const ADMIN_SUPPORT_NAME = 'Hỗ trợ SmartBuild'

/**
 * GET /api/supplier/chat - Get messages for a supplier
 * Uses unified Conversation + Message tables
 */
export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams
    const supplierId = searchParams.get('supplierId')

    if (!supplierId) {
        return NextResponse.json({ success: false, message: 'Missing supplierId' }, { status: 400 })
    }

    try {
        // Find or identify the conversation for this supplier with admin support
        let conversation = await prisma.conversation.findFirst({
            where: {
                OR: [
                    { participant1Id: supplierId, participant2Id: ADMIN_SUPPORT_ID },
                    { participant1Id: ADMIN_SUPPORT_ID, participant2Id: supplierId }
                ]
            }
        })

        if (!conversation) {
            // Get supplier name
            const supplier = await prisma.supplier.findUnique({
                where: { id: supplierId },
                select: { name: true }
            })

            // Create a new conversation for this supplier with admin support
            conversation = await prisma.conversation.create({
                data: {
                    participant1Id: supplierId,
                    participant1Name: supplier?.name || 'Nhà cung cấp',
                    participant2Id: ADMIN_SUPPORT_ID,
                    participant2Name: ADMIN_SUPPORT_NAME
                }
            })
        }

        // Fetch messages from the unified Message table
        const messages = await prisma.message.findMany({
            where: { conversationId: conversation.id },
            orderBy: { createdAt: 'asc' },
            take: 100
        })

        // Format messages for supplier chat UI
        const formattedMessages = messages.map(m => ({
            id: m.id,
            message: m.content,
            isAdmin: m.senderId === ADMIN_SUPPORT_ID || m.senderId !== supplierId,
            fileUrl: m.fileUrl,
            fileType: m.fileType,
            createdAt: m.createdAt
        }))

        // Reset unread count for supplier
        const isParticipant1 = conversation.participant1Id === supplierId
        if (isParticipant1 && conversation.unread1 > 0) {
            await prisma.conversation.update({
                where: { id: conversation.id },
                data: { unread1: 0 }
            })
        } else if (!isParticipant1 && conversation.unread2 > 0) {
            await prisma.conversation.update({
                where: { id: conversation.id },
                data: { unread2: 0 }
            })
        }

        return NextResponse.json(createSuccessResponse({
            messages: formattedMessages,
            conversationId: conversation.id
        }))
    } catch (error) {
        console.error('Error fetching chat:', error)
        return NextResponse.json({ success: false, message: 'Error fetching messages' }, { status: 500 })
    }
}

/**
 * POST /api/supplier/chat - Send message from supplier
 * Uses unified Conversation + Message tables with Firebase real-time sync
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const { supplierId, message, fileUrl, fileType } = body

        if (!supplierId || (!message && !fileUrl)) {
            return NextResponse.json({ success: false, message: 'Missing fields' }, { status: 400 })
        }

        // Get supplier info
        const supplier = await prisma.supplier.findUnique({
            where: { id: supplierId },
            select: { name: true }
        })

        const supplierName = supplier?.name || 'Nhà cung cấp'

        // Find or create conversation
        let conversation = await prisma.conversation.findFirst({
            where: {
                OR: [
                    { participant1Id: supplierId, participant2Id: ADMIN_SUPPORT_ID },
                    { participant1Id: ADMIN_SUPPORT_ID, participant2Id: supplierId }
                ]
            }
        })

        if (!conversation) {
            conversation = await prisma.conversation.create({
                data: {
                    participant1Id: supplierId,
                    participant1Name: supplierName,
                    participant2Id: ADMIN_SUPPORT_ID,
                    participant2Name: ADMIN_SUPPORT_NAME
                }
            })
        }

        // Create message in unified Message table
        const newMessage = await prisma.message.create({
            data: {
                conversationId: conversation.id,
                senderId: supplierId,
                senderName: supplierName,
                content: message || '',
                fileUrl: fileUrl || null,
                fileType: fileType || null,
                isRead: false
            }
        })

        // Update conversation metadata
        const isParticipant1 = conversation.participant1Id === supplierId
        await prisma.conversation.update({
            where: { id: conversation.id },
            data: {
                lastMessage: message || (fileUrl ? 'Đã gửi tệp đính kèm' : ''),
                lastMessageAt: new Date(),
                // Increment unread for the OTHER participant (admin)
                unread1: isParticipant1 ? conversation.unread1 : conversation.unread1 + 1,
                unread2: isParticipant1 ? conversation.unread2 + 1 : conversation.unread2
            }
        })

        // Push to Firebase for real-time sync
        try {
            const db = getFirebaseDatabase()
            const messagesRef = ref(db, `conversations/${conversation.id}/messages`)
            const newMessageRef = push(messagesRef)

            await set(newMessageRef, {
                id: newMessage.id,
                senderId: supplierId,
                senderName: supplierName,
                content: message || '',
                fileUrl: fileUrl || null,
                fileType: fileType || null,
                createdAt: newMessage.createdAt.toISOString(),
                isRead: false
            })
        } catch (fbError) {
            console.error('Firebase sync failed:', fbError)
            // Continue - DB write was successful
        }

        const formattedMessage = {
            id: newMessage.id,
            message: newMessage.content,
            isAdmin: false,
            fileUrl: fileUrl,
            fileType: fileType,
            createdAt: newMessage.createdAt
        }

        return NextResponse.json(createSuccessResponse(formattedMessage))
    } catch (error) {
        console.error('Error sending message:', error)
        return NextResponse.json({ success: false, message: 'Error sending message' }, { status: 500 })
    }
}
