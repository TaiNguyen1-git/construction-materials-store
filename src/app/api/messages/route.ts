/**
 * Conversations API - List and create conversations
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createSuccessResponse, createErrorResponse } from '@/lib/api-types'

// GET /api/messages - Get user's conversations
export async function GET(request: NextRequest) {
    try {
        const userId = request.headers.get('x-user-id')

        if (!userId) {
            return NextResponse.json(
                createErrorResponse('User ID required', 'UNAUTHORIZED'),
                { status: 401 }
            )
        }

        const conversations = await prisma.conversation.findMany({
            where: {
                OR: [
                    { participant1Id: userId },
                    { participant2Id: userId }
                ]
            },
            orderBy: { lastMessageAt: 'desc' }
        })

        // Format for frontend
        const formatted = conversations.map(c => {
            const isParticipant1 = c.participant1Id === userId
            return {
                id: c.id,
                otherUserId: isParticipant1 ? c.participant2Id : c.participant1Id,
                otherUserName: isParticipant1 ? c.participant2Name : c.participant1Name,
                projectId: c.projectId,
                projectTitle: c.projectTitle,
                lastMessage: c.lastMessage,
                lastMessageAt: c.lastMessageAt,
                unreadCount: isParticipant1 ? c.unread1 : c.unread2,
                createdAt: c.createdAt
            }
        })

        return NextResponse.json(
            createSuccessResponse({ conversations: formatted }, 'Conversations loaded'),
            { status: 200 }
        )
    } catch (error) {
        console.error('Get conversations error:', error)
        return NextResponse.json(
            createErrorResponse('Failed to load conversations', 'SERVER_ERROR'),
            { status: 500 }
        )
    }
}

// POST /api/messages - Start new conversation or get existing
export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const {
            senderId,
            senderName,
            recipientId,
            recipientName,
            projectId,
            projectTitle,
            initialMessage
        } = body

        if (!senderId || !recipientId) {
            return NextResponse.json(
                createErrorResponse('Sender and recipient IDs required', 'VALIDATION_ERROR'),
                { status: 400 }
            )
        }

        // Check if conversation exists
        let conversation = await prisma.conversation.findFirst({
            where: {
                OR: [
                    { participant1Id: senderId, participant2Id: recipientId },
                    { participant1Id: recipientId, participant2Id: senderId }
                ]
            }
        })

        // Create new conversation if not exists
        if (!conversation) {
            conversation = await prisma.conversation.create({
                data: {
                    participant1Id: senderId,
                    participant1Name: senderName || 'Khách',
                    participant2Id: recipientId,
                    participant2Name: recipientName || 'Người dùng',
                    projectId: projectId || null,
                    projectTitle: projectTitle || null
                }
            })
        }

        // Send initial message if provided
        if (initialMessage) {
            const isParticipant1 = conversation.participant1Id === senderId

            await prisma.message.create({
                data: {
                    conversationId: conversation.id,
                    senderId,
                    senderName: senderName || 'Khách',
                    content: initialMessage
                }
            })

            // Update conversation
            await prisma.conversation.update({
                where: { id: conversation.id },
                data: {
                    lastMessage: initialMessage.substring(0, 100),
                    lastMessageAt: new Date(),
                    [isParticipant1 ? 'unread2' : 'unread1']: { increment: 1 }
                }
            })
        }

        return NextResponse.json(
            createSuccessResponse({
                conversationId: conversation.id,
                isNew: !conversation.lastMessageAt
            }, 'Conversation ready'),
            { status: 200 }
        )
    } catch (error) {
        console.error('Create conversation error:', error)
        return NextResponse.json(
            createErrorResponse('Failed to create conversation', 'SERVER_ERROR'),
            { status: 500 }
        )
    }
}
