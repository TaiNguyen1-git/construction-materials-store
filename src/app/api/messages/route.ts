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

        // Pre-fetch missing user and profile names
        const userIdsToRepair = new Set<string>()
        conversations.forEach(c => {
            const isParticipant1 = c.participant1Id === userId
            const otherUserName = isParticipant1 ? c.participant2Name : c.participant1Name
            const otherUserId = isParticipant1 ? c.participant2Id : c.participant1Id

            if (otherUserName === 'Người dùng' || otherUserName === 'Khách' || !otherUserName) {
                if (otherUserId) userIdsToRepair.add(otherUserId)
            }
        })

        const usersDict: Record<string, string> = {}
        const profilesDict: Record<string, string> = {}

        if (userIdsToRepair.size > 0) {
            const idsList = Array.from(userIdsToRepair)
            const [users, profiles] = await Promise.all([
                prisma.user.findMany({
                    where: { id: { in: idsList } },
                    select: { id: true, name: true }
                }),
                prisma.contractorProfile.findMany({
                    where: { id: { in: idsList } },
                    select: { id: true, displayName: true }
                })
            ])
            users.forEach(u => { if (u.name) usersDict[u.id] = u.name })
            profiles.forEach(p => { if (p.displayName) profilesDict[p.id] = p.displayName })
        }

        const updates: Promise<any>[] = []

        // Format for frontend
        const formatted = conversations.map((c) => {
            const isParticipant1 = c.participant1Id === userId
            let otherUserName = isParticipant1 ? c.participant2Name : c.participant1Name
            const otherUserId = isParticipant1 ? c.participant2Id : c.participant1Id

            // Repair 'Người dùng' or 'Khách' if we can find a better name
            if (otherUserName === 'Người dùng' || otherUserName === 'Khách' || !otherUserName) {
                const fetchedUserName = usersDict[otherUserId]
                const fetchedProfileName = profilesDict[otherUserId]

                if (fetchedUserName && fetchedUserName !== 'Người dùng' && fetchedUserName !== 'Khách') {
                    otherUserName = fetchedUserName
                } else if (fetchedProfileName) {
                    otherUserName = fetchedProfileName
                }

                // Persist the repair in DB if we found a better name
                if (otherUserName && otherUserName !== 'Người dùng' && otherUserName !== 'Khách') {
                    updates.push(prisma.conversation.update({
                        where: { id: c.id },
                        data: {
                            [isParticipant1 ? 'participant2Name' : 'participant1Name']: otherUserName
                        }
                    }))
                }
            }

            return {
                id: c.id,
                otherUserId,
                otherUserName,
                projectId: c.projectId,
                projectTitle: c.projectTitle,
                lastMessage: c.lastMessage,
                lastMessageAt: c.lastMessageAt,
                unreadCount: isParticipant1 ? c.unread1 : c.unread2,
                createdAt: c.createdAt
            }
        })

        if (updates.length > 0) {
            await Promise.all(updates) // execute updates concurrently
        }

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

        // Attempt to fetch names if missing
        let sName = senderName
        let rName = recipientName

        if (!sName || !rName || sName === 'Khách' || rName === 'Người dùng') {
            const users = await prisma.user.findMany({
                where: { id: { in: [senderId, recipientId] } },
                select: { id: true, name: true }
            })

            const profiles = await prisma.contractorProfile.findMany({
                where: { id: { in: [senderId, recipientId] } },
                select: { id: true, displayName: true }
            })

            if (!sName || sName === 'Khách') {
                sName = users.find(u => u.id === senderId)?.name ||
                    profiles.find(p => p.id === senderId)?.displayName ||
                    senderName || 'Khách'
            }
            if (!rName || rName === 'Người dùng') {
                rName = users.find(u => u.id === recipientId)?.name ||
                    profiles.find(p => p.id === recipientId)?.displayName ||
                    recipientName || 'Người dùng'
            }
        }

        // Create new conversation if not exists
        if (!conversation) {
            conversation = await prisma.conversation.create({
                data: {
                    participant1Id: senderId,
                    participant1Name: sName,
                    participant2Id: recipientId,
                    participant2Name: rName,
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
                    senderName: sName,
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
