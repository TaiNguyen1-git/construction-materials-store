import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createSuccessResponse, createErrorResponse } from '@/lib/api-types'

export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const userId = request.headers.get('x-user-id')
        const body = await request.json()
        const { action } = body

        if (!userId) {
            return NextResponse.json(
                createErrorResponse('User ID required', 'UNAUTHORIZED'),
                { status: 401 }
            )
        }

        if (!['hide', 'unhide', 'archive', 'unarchive'].includes(action)) {
            return NextResponse.json(
                createErrorResponse('Invalid action. Must be hide, unhide, archive, or unarchive.', 'VALIDATION_ERROR'),
                { status: 400 }
            )
        }

        const conversation = await prisma.conversation.findUnique({
            where: { id }
        })

        if (!conversation) {
            return NextResponse.json(
                createErrorResponse('Conversation not found', 'NOT_FOUND'),
                { status: 404 }
            )
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
            where: { id },
            data: updateData
        })

        return NextResponse.json(
            createSuccessResponse({
                id: updated.id,
                hiddenByIds: updated.hiddenByIds,
                archivedByIds: updated.archivedByIds
            }, `Action ${action} completed successfully`),
            { status: 200 }
        )
    } catch (error) {
        console.error('Update conversation status error:', error)
        return NextResponse.json(
            createErrorResponse('Failed to update conversation status', 'SERVER_ERROR'),
            { status: 500 }
        )
    }
}
