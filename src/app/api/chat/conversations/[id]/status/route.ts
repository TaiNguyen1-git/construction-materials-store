import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyTokenFromRequest } from '@/lib/auth'

export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: conversationId } = await params
        const decoded = await verifyTokenFromRequest(request)
        const body = await request.json()
        const { action } = body

        if (!decoded || !decoded.userId) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
        }

        const userId = decoded.userId

        if (!['hide', 'unhide', 'archive', 'unarchive'].includes(action)) {
            return NextResponse.json({ message: 'Invalid action. Must be hide, unhide, archive, or unarchive.' }, { status: 400 })
        }

        const conversation = await prisma.conversation.findUnique({
            where: { id: conversationId }
        })

        if (!conversation) {
            return NextResponse.json({ message: 'Conversation not found' }, { status: 404 })
        }

        let updateData: any = {}

        if (action === 'hide') {
            const currentHidden = conversation.hiddenByIds || []
            updateData.hiddenByIds = Array.from(new Set([...currentHidden, userId]))
        } else if (action === 'unhide') {
            const currentHidden = conversation.hiddenByIds || []
            updateData.hiddenByIds = currentHidden.filter(x => x !== userId)
        } else if (action === 'archive') {
            const currentArchived = conversation.archivedByIds || []
            updateData.archivedByIds = Array.from(new Set([...currentArchived, userId]))
            // Auto unhide when archived
            const currentHidden = conversation.hiddenByIds || []
            updateData.hiddenByIds = currentHidden.filter(x => x !== userId)
        } else if (action === 'unarchive') {
            const currentArchived = conversation.archivedByIds || []
            updateData.archivedByIds = currentArchived.filter(x => x !== userId)
        }

        const updated = await prisma.conversation.update({
            where: { id: conversationId },
            data: updateData
        })

        return NextResponse.json({
            success: true,
            data: {
                id: updated.id,
                hiddenByIds: updated.hiddenByIds,
                archivedByIds: updated.archivedByIds
            },
            message: `Action ${action} completed successfully`
        })
    } catch (error: any) {
        console.error('[CONVERSATION_STATUS_PATCH]', error)
        return NextResponse.json({ message: error.message || 'Internal Server Error' }, { status: 500 })
    }
}
