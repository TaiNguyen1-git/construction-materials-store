import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyTokenFromRequest } from '@/lib/auth'

export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: messageId } = await params
        const body = await request.json()
        const { action } = body // 'unsend' or 'remove_for_me'

        const decoded = await verifyTokenFromRequest(request)
        // Accept userId from JWT or x-guest-id header
        const userId = decoded?.userId || request.headers.get('x-guest-id')

        if (!userId) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
        }

        const message = await prisma.message.findUnique({
            where: { id: messageId }
        })

        if (!message) {
            return NextResponse.json({ success: false, error: 'Message not found' }, { status: 404 })
        }

        if (action === 'unsend') {
            // Only sender can unsend
            const isSender = message.senderId === userId || message.realSenderId === userId
            if (!isSender) {
                return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })
            }

            const updatedMessage = await prisma.message.update({
                where: { id: messageId },
                data: {
                    isUnsent: true,
                    content: 'Tin nhắn đã được thu hồi',
                    fileUrl: null,
                    fileName: null,
                    fileType: null,
                    fileSize: null
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

            // Sync to Firebase
            try {
                const { getFirebaseDatabase } = await import('@/lib/firebase')
                const { ref, update } = await import('firebase/database')
                const db = getFirebaseDatabase()
                const messageRef = ref(db, `conversations/${message.conversationId}/messages/${messageId}`)
                
                await update(messageRef, {
                    isUnsent: true,
                    content: 'Tin nhắn đã được thu hồi',
                    fileUrl: null,
                    fileName: null,
                    fileType: null,
                    fileSize: null
                })
            } catch (fbError) {
                console.error('Firebase unsend sync failed:', fbError)
            }

            return NextResponse.json({ success: true, data: updatedMessage })
        }

        if (action === 'remove_for_me') {
            // Check if user is already in removedBy to avoid duplicates
            if (message.removedBy.includes(userId)) {
                return NextResponse.json({ success: true, data: message })
            }

            const updatedMessage = await prisma.message.update({
                where: { id: messageId },
                data: {
                    removedBy: {
                        push: userId
                    }
                }
            })
            return NextResponse.json({ success: true, data: updatedMessage })
        }

        return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 })

    } catch (error: any) {
        console.error('[MESSAGE_PATCH]', error)
        return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }
}
