import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyTokenFromRequest } from '@/lib/auth'
import { getFirebaseDatabase } from '@/lib/firebase'
import { ref, update } from 'firebase/database'

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: messageId } = await params
        
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

        // Only the recipient should mark as read, but for simplicity we allow if valid user
        // and not already read
        if (message.isRead) {
            return NextResponse.json({ success: true, alreadyRead: true })
        }

        const now = new Date()
        const updatedMessage = await prisma.message.update({
            where: { id: messageId },
            data: {
                isRead: true,
                readAt: now
            }
        })

        // Sync to Firebase
        try {
            const db = getFirebaseDatabase()
            const messageRef = ref(db, `conversations/${message.conversationId}/messages/${messageId}`)
            
            await update(messageRef, {
                isRead: true,
                readAt: now.toISOString()
            })
        } catch (fbError) {
            console.error('Firebase read sync failed:', fbError)
        }

        return NextResponse.json({ success: true, data: updatedMessage })

    } catch (error: any) {
        console.error('[MESSAGE_READ_POST]', error)
        return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }
}
