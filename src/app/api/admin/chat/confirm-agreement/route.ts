import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const { messageId, conversationId, proposedAmount, proposedDate, description, type } = body

        if (!messageId || !conversationId) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
        }

        // 1. Fetch the conversation to get project context
        const conversation = await prisma.conversation.findUnique({
            where: { id: conversationId }
        })

        if (!conversation) {
            return NextResponse.json({ error: 'Conversation not found' }, { status: 404 })
        }

        // 2. Logic to "Confirm" the settlement
        // In a real scenario, we might create a PaymentMilestone or a new QuoteRequest/Order
        // Since we need a quoteId for PaymentMilestone, let's look for a project if available

        let createdEntity = null

        // If this is an agreement proposal, let's create a "Project Milestone" or "Contract Supplement"
        // For now, we'll record it in a way that links to the project if possible

        if (conversation.projectId) {
            // Check if there's a QuoteRequest for this project
            const quote = await prisma.quoteRequest.findFirst({
                where: { projectId: conversation.projectId },
                orderBy: { createdAt: 'desc' }
            })

            if (quote) {
                // Create a PaymentMilestone
                createdEntity = await prisma.paymentMilestone.create({
                    data: {
                        quoteId: quote.id,
                        name: description || 'Thỏa thuận qua chat',
                        amount: proposedAmount || 0,
                        percentage: 0, // Calculated or manual
                        status: 'PENDING',
                        order: 10, // High order for new milestones
                    }
                })
            } else {
                // No quote found, maybe create a general expense or log it
                createdEntity = await prisma.auditLog.create({
                    data: {
                        action: 'QUOTE_ACCEPT',
                        entityType: 'Conversation',
                        entityId: conversationId,
                        newValue: { proposedAmount, proposedDate, description },
                        reason: 'Chốt thỏa thuận từ chat (Không tìm thấy Quote ID)',
                        severity: 'INFO'
                    }
                })
            }
        } else {
            // Just log it in audit logs if no project
            createdEntity = await prisma.auditLog.create({
                data: {
                    action: 'QUOTE_ACCEPT',
                    entityType: 'Conversation',
                    entityId: conversationId,
                    newValue: { proposedAmount, proposedDate, description },
                    reason: 'Chốt thỏa thuận từ chat (Không có Project ID)',
                    severity: 'INFO'
                }
            })
        }

        // 3. Mark the message as "CONFIRMED" in the metadata to prevent double action
        const message = await prisma.message.findUnique({ where: { id: messageId } })
        if (message) {
            const currentMetadata = (message.metadata as Record<string, unknown>) || {}
            await prisma.message.update({
                where: { id: messageId },
                data: {
                    metadata: {
                        ...currentMetadata,
                        isConfirmed: true,
                        confirmedAt: new Date().toISOString(),
                        entityId: createdEntity?.id,
                        entityType: createdEntity?.constructor?.name || 'Milestone'
                    }
                }
            })
        }

        return NextResponse.json({
            success: true,
            message: 'Đã xác nhận thỏa thuận và cập nhật hệ thống',
            data: createdEntity
        })

    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Unknown error'
        console.error('Error confirming agreement:', message)
        return NextResponse.json({ error: message }, { status: 500 })
    }
}
