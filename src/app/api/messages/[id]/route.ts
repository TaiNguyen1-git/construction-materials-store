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
        const { senderId, senderName, content } = body

        if (!senderId || !content) {
            return NextResponse.json(
                createErrorResponse('Missing required fields', 'VALIDATION_ERROR'),
                { status: 400 }
            )
        }

        // 1. Save to MongoDB (Primary Source)
        const message = await prisma.message.create({
            data: {
                conversationId: id,
                senderId,
                senderName: senderName || 'Khách', // Keep original senderName fallback
                content,
                isRead: false
            }
        })

        // Update conversation last message and unread counts
        const conversation = await prisma.conversation.findUnique({ // Re-fetch conversation to get participant IDs
            where: { id }
        })

        if (!conversation) { // Should not happen if message was created, but good for type safety
            return NextResponse.json(
                createErrorResponse('Conversation not found after message creation', 'NOT_FOUND'),
                { status: 404 }
            )
        }

        const isParticipant1 = conversation.participant1Id === senderId
        await prisma.conversation.update({
            where: { id },
            data: {
                lastMessage: content.substring(0, 100), // Keep original substring logic
                lastMessageAt: new Date(),
                [isParticipant1 ? 'unread2' : 'unread1']: { increment: 1 } // Keep original unread logic
            }
        })

        // 2. Push to Firebase Realtime Database (Sync)
        try {
            const db = getFirebaseDatabase()
            const messagesRef = ref(db, `conversations/${id}/messages`)
            const newMessageRef = push(messagesRef)
            await set(newMessageRef, {
                id: message.id,
                senderId,
                senderName: message.senderName, // Use senderName from created message
                content,
                isRead: false,
                createdAt: message.createdAt.toISOString()
            })
        } catch (firebaseError) {
            console.error('Firebase sync failed:', firebaseError)
            // Firebase sync failure shouldn't stop the primary response
        }

        return NextResponse.json(
            createSuccessResponse({
                message: { // Keep original success response structure
                    id: message.id,
                    senderId: message.senderId,
                    senderName: message.senderName,
                    content: message.content,
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
