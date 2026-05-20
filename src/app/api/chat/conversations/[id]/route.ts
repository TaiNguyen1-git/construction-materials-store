import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyTokenFromRequest } from '@/lib/auth'
import { getFirebaseDatabase } from '@/lib/firebase'
import { ref, set } from 'firebase/database'

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: conversationId } = await params
        const decoded = await verifyTokenFromRequest(request)
        if (!decoded || !decoded.userId) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
        }

        const userId = decoded.userId

        // Check if conversation exists
        const conversation = await prisma.conversation.findUnique({
            where: { id: conversationId }
        })

        if (!conversation) {
            return NextResponse.json({ message: 'Conversation not found' }, { status: 404 })
        }

        // Add userId to deletedByIds array if not already present
        const currentDeleted = conversation.deletedByIds || []
        const updatedDeleted = Array.from(new Set([...currentDeleted, userId]))

        // Check if both participants deleted it
        const isParticipant1 = conversation.participant1Id === userId
        const otherParticipantId = isParticipant1 ? conversation.participant2Id : conversation.participant1Id

        const bothDeleted = updatedDeleted.includes(otherParticipantId)

        if (bothDeleted) {
            // Delete messages first (if not cascading)
            await prisma.message.deleteMany({
                where: { conversationId }
            })

            // Delete conversation
            await prisma.conversation.delete({
                where: { id: conversationId }
            })

            // Clean up Firebase node
            try {
                const db = getFirebaseDatabase()
                const messagesRef = ref(db, `conversations/${conversationId}`)
                await set(messagesRef, null)
            } catch (firebaseError) {
                console.error('Firebase delete failed:', firebaseError)
            }

            return NextResponse.json({
                success: true,
                message: 'Conversation deleted permanently'
            })
        } else {
            // Update deletedByIds
            await prisma.conversation.update({
                where: { id: conversationId },
                data: {
                    deletedByIds: updatedDeleted
                }
            })

            return NextResponse.json({
                success: true,
                message: 'Conversation deleted for this user'
            })
        }

    } catch (error: any) {
        console.error('[CONVERSATION_DELETE]', error)
        return NextResponse.json({ message: error.message || 'Internal Server Error' }, { status: 500 })
    }
}

export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: conversationId } = await params
        const decoded = await verifyTokenFromRequest(request)
        if (!decoded || !decoded.userId) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
        }

        const body = await request.json()
        const { projectId, projectTitle } = body

        // Check if conversation exists
        const conversation = await prisma.conversation.findUnique({
            where: { id: conversationId }
        })

        if (!conversation) {
            return NextResponse.json({ message: 'Conversation not found' }, { status: 404 })
        }

        const updated = await prisma.conversation.update({
            where: { id: conversationId },
            data: {
                projectId: projectId || null,
                projectTitle: projectTitle || null
            }
        })

        return NextResponse.json({
            success: true,
            data: updated,
            message: 'Conversation updated successfully'
        })
    } catch (error: any) {
        console.error('[CONVERSATION_PATCH]', error)
        return NextResponse.json({ message: error.message || 'Internal Server Error' }, { status: 500 })
    }
}
