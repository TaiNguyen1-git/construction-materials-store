import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyTokenFromRequest } from '@/lib/auth-middleware-api'

interface RouteParams {
    params: Promise<{ id: string }>
}

// GET: Fetch single ticket with messages
export async function GET(request: NextRequest, { params }: RouteParams) {
    try {
        const { id } = await params
        const auth = verifyTokenFromRequest(request)

        const ticket = await prisma.supportTicket.findUnique({
            where: { id },
            include: {
                messages: {
                    orderBy: { createdAt: 'asc' },
                    where: auth?.role === 'MANAGER' ? {} : { isInternal: false }
                }
            }
        })

        if (!ticket) {
            return NextResponse.json(
                { error: 'Ticket not found' },
                { status: 404 }
            )
        }

        // Check access permission
        if (auth?.role !== 'MANAGER') {
            if (ticket.customerId) {
                // Get customer ID from user to check ownership
                const customer = await prisma.customer.findUnique({
                    where: { userId: auth?.userId || '' }
                })
                if (!customer || ticket.customerId !== customer.id) {
                    return NextResponse.json(
                        { error: 'Access denied' },
                        { status: 403 }
                    )
                }
            }
        }

        return NextResponse.json({ ticket })
    } catch (error) {
        console.error('Error fetching ticket:', error)
        return NextResponse.json(
            { error: 'Failed to fetch ticket' },
            { status: 500 }
        )
    }
}

// PATCH: Update ticket
export async function PATCH(request: NextRequest, { params }: RouteParams) {
    try {
        const { id } = await params
        const auth = verifyTokenFromRequest(request)
        const body = await request.json()

        const ticket = await prisma.supportTicket.findUnique({
            where: { id }
        })

        if (!ticket) {
            return NextResponse.json(
                { error: 'Ticket not found' },
                { status: 404 }
            )
        }

        // Check if user is admin or owner
        const isAdmin = auth?.role === 'MANAGER'
        let isOwner = false

        if (auth?.userId && ticket.customerId) {
            const customer = await prisma.customer.findUnique({
                where: { userId: auth.userId }
            })
            isOwner = customer?.id === ticket.customerId
        }

        if (!isAdmin && !isOwner) {
            return NextResponse.json(
                { error: 'Access denied' },
                { status: 403 }
            )
        }

        const updateData: Record<string, unknown> = {}

        // Fields that customers can update
        if (isOwner || isAdmin) {
            if (body.customerRating) updateData.customerRating = body.customerRating
            if (body.customerFeedback) updateData.customerFeedback = body.customerFeedback
        }

        // Fields only admin can update
        if (isAdmin) {
            if (body.status) {
                updateData.status = body.status
                if (body.status === 'RESOLVED' || body.status === 'CLOSED') {
                    updateData.resolvedAt = new Date()
                    updateData.resolvedBy = auth.userId
                }
            }
            if (body.priority) updateData.priority = body.priority
            if (body.category) updateData.category = body.category
            if (body.assignedTo) {
                updateData.assignedTo = body.assignedTo
                updateData.assignedAt = new Date()
            }
            if (body.resolution) updateData.resolution = body.resolution
            if (body.internalNotes) updateData.internalNotes = body.internalNotes
            if (body.tags) updateData.tags = body.tags
        }

        const updatedTicket = await prisma.supportTicket.update({
            where: { id },
            data: updateData,
            include: { messages: true }
        })

        return NextResponse.json({
            success: true,
            ticket: updatedTicket
        })
    } catch (error) {
        console.error('Error updating ticket:', error)
        return NextResponse.json(
            { error: 'Failed to update ticket' },
            { status: 500 }
        )
    }
}

// DELETE: Close/delete ticket (admin only)
export async function DELETE(request: NextRequest, { params }: RouteParams) {
    try {
        const { id } = await params
        const auth = verifyTokenFromRequest(request)

        if (auth?.role !== 'MANAGER') {
            return NextResponse.json(
                { error: 'Admin access required' },
                { status: 403 }
            )
        }

        // Soft delete by setting status to CLOSED
        await prisma.supportTicket.update({
            where: { id },
            data: {
                status: 'CLOSED',
                resolvedAt: new Date(),
                resolvedBy: auth.userId
            }
        })

        return NextResponse.json({
            success: true,
            message: 'Ticket closed'
        })
    } catch (error) {
        console.error('Error deleting ticket:', error)
        return NextResponse.json(
            { error: 'Failed to delete ticket' },
            { status: 500 }
        )
    }
}
