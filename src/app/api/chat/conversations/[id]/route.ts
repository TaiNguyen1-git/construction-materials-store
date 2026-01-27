import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyTokenFromRequest } from '@/lib/auth'

export async function DELETE(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const decoded = await verifyTokenFromRequest(request)
        if (!decoded) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
        }

        const conversationId = params.id

        // Check if conversation exists
        const conversation = await prisma.conversation.findUnique({
            where: { id: conversationId }
        })

        if (!conversation) {
            return NextResponse.json({ message: 'Conversation not found' }, { status: 404 })
        }

        // Optional: Check if user has permission (admin or participant)
        // For admin page, we assume admin role check is done in verifyToken or here
        // if (decoded.role !== 'ADMIN') ...

        // Delete messages first (if not cascading)
        await prisma.message.deleteMany({
            where: { conversationId }
        })

        // Delete conversation
        await prisma.conversation.delete({
            where: { id: conversationId }
        })

        return NextResponse.json({
            success: true,
            message: 'Conversation deleted successfully'
        })

    } catch (error: any) {
        console.error('[CONVERSATION_DELETE]', error)
        return NextResponse.json({ message: error.message || 'Internal Server Error' }, { status: 500 })
    }
}
