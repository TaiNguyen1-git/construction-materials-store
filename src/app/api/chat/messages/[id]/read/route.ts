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

        // Validate if messageId is a valid MongoDB ObjectID
        const isValidObjectId = /^[0-9a-fA-F]{24}$/.test(messageId)
        let message = null

        if (isValidObjectId) {
            message = await prisma.message.findUnique({
                where: { id: messageId }
            })
        }

        const body = await request.json().catch(() => ({}))
        const conversationId = message?.conversationId || body.conversationId

        if (!message && !conversationId) {
            return NextResponse.json({ success: false, error: 'Message or Conversation not found' }, { status: 404 })
        }

        const now = new Date()

        // 1. Update MongoDB if exists
        if (message && !message.isRead) {
            await prisma.message.update({
                where: { id: messageId },
                data: {
                    isRead: true,
                    readAt: now
                }
            })
        }

        // 2. Sync to Firebase (always if we have conversationId)
        if (conversationId) {
            try {
                const db = getFirebaseDatabase()
                const messageRef = ref(db, `conversations/${conversationId}/messages/${messageId}`)
                
                await update(messageRef, {
                    isRead: true,
                    readAt: now.toISOString()
                })
            } catch (fbError) {
                console.error('Firebase read sync failed:', fbError)
            }
        }

        return NextResponse.json({ success: true })

    } catch (error: any) {
        console.error('[MESSAGE_READ_POST]', error)
        return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }
}
