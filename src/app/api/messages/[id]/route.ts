/**
 * Single Conversation API - Get messages and send new ones
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createSuccessResponse, createErrorResponse } from '@/lib/api-types'
import { getFirebaseDatabase } from '@/lib/firebase'
import { ref, push, set } from 'firebase/database'

// GET /api/messages/[id] - Get messages in a conversation
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const userId = request.headers.get('x-user-id')

        const conversation = await prisma.conversation.findUnique({
            where: { id },
            include: {
                messages: {
                    orderBy: { createdAt: 'asc' }
                }
            }
        })

        if (!conversation) {
            return NextResponse.json(
                createErrorResponse('Conversation not found', 'NOT_FOUND'),
                { status: 404 }
            )
        }

        // Mark messages as read
        if (userId) {
            const isParticipant1 = conversation.participant1Id === userId

            await prisma.message.updateMany({
                where: {
                    conversationId: id,
                    senderId: { not: userId },
                    isRead: false
                },
                data: {
                    isRead: true,
                    readAt: new Date()
                }
            })

            // Reset unread count
            await prisma.conversation.update({
                where: { id },
                data: {
                    [isParticipant1 ? 'unread1' : 'unread2']: 0
                }
            })
        }

        return NextResponse.json(
            createSuccessResponse({
                conversation: {
                    id: conversation.id,
                    participant1Id: conversation.participant1Id,
                    participant1Name: conversation.participant1Name,
                    participant2Id: conversation.participant2Id,
                    participant2Name: conversation.participant2Name,
                    projectId: conversation.projectId,
                    projectTitle: conversation.projectTitle
                },
                messages: conversation.messages.map((m: any) => ({
                    id: m.id,
                    senderId: m.senderId,
                    senderName: m.senderName,
                    content: m.content,
                    fileUrl: m.fileUrl,
                    fileName: m.fileName,
                    fileType: m.fileType,
                    fileSize: m.fileSize,
                    isRead: m.isRead,
                    createdAt: m.createdAt
                }))
            }, 'Messages loaded'),
            { status: 200 }
        )
    } catch (error) {
        console.error('Get messages error:', error)
        return NextResponse.json(
            createErrorResponse('Failed to load messages', 'SERVER_ERROR'),
            { status: 500 }
        )
    }
}

// POST /api/messages/[id] - Send a message
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const body = await request.json()
        const { senderId, senderName, content, fileUrl, fileName, fileType, fileSize } = body

        if (!senderId || (!content && !fileUrl)) {
            return NextResponse.json(
                createErrorResponse('Missing required fields or content', 'VALIDATION_ERROR'),
                { status: 400 }
            )
        }

        // 1. Save to MongoDB (Primary Source)
        const message = await prisma.message.create({
            data: {
                conversationId: id,
                senderId,
                senderName: senderName || 'Khách',
                content: content || null,
                fileUrl: fileUrl || null,
                fileName: fileName || null,
                fileType: fileType || null,
                fileSize: fileSize || null,
                isRead: false
            }
        })

        // Update conversation last message and unread counts
        const conversation = await prisma.conversation.findUnique({
            where: { id }
        })

        if (!conversation) {
            return NextResponse.json(
                createErrorResponse('Conversation not found', 'NOT_FOUND'),
                { status: 404 }
            )
        }

        const isParticipant1 = conversation.participant1Id === senderId
        const lastMsgText = content ? content.substring(0, 100) : (fileType === 'image' ? '[Hình ảnh]' : '[Tệp tin]')

        await prisma.conversation.update({
            where: { id },
            data: {
                lastMessage: lastMsgText,
                lastMessageAt: new Date(),
                [isParticipant1 ? 'unread2' : 'unread1']: { increment: 1 }
            }
        })

        // 2. Push to Firebase Realtime Database (Sync)
        try {
            const db = getFirebaseDatabase()
            const messagesRef = ref(db, `conversations/${id}/messages`)
            const newMessageRef = push(messagesRef)
            await set(newMessageRef, {
                id: message.id,
                tempId: body.tempId || null, // Capture tempId for deduplication
                senderId,
                senderName: message.senderName,
                content: content || null,
                fileUrl: fileUrl || null,
                fileName: fileName || null,
                fileType: fileType || null,
                fileSize: fileSize || null,
                isRead: false,
                createdAt: message.createdAt.toISOString()
            })
        } catch (firebaseError) {
            console.error('Firebase sync failed:', firebaseError)
        }

        return NextResponse.json(
            createSuccessResponse({
                message: {
                    id: message.id,
                    senderId: message.senderId,
                    senderName: message.senderName,
                    content: message.content,
                    fileUrl: message.fileUrl,
                    fileName: message.fileName,
                    fileType: message.fileType,
                    fileSize: message.fileSize,
                    createdAt: message.createdAt
                }
            }, 'Message sent'),
            { status: 201 }
        )
    } catch (error) {
        console.error('Send message error:', error)
        return NextResponse.json(
            createErrorResponse('Failed to send message', 'SERVER_ERROR'),
            { status: 500 }
        )
    }
}

