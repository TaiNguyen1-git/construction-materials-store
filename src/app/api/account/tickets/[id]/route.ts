import { NextRequest, NextResponse } from 'next/server'
import { getUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET: Get ticket details with messages
export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const user = await getUser()
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { id } = await params

        const customer = await prisma.customer.findFirst({
            where: { userId: user.userId }
        })

        const ticket = await prisma.supportTicket.findFirst({
            where: {
                id,
                customerId: customer?.id || undefined
            },
            include: {
                messages: {
                    where: { isInternal: false }, // Don't show internal notes to customer
                    orderBy: { createdAt: 'asc' }
                }
            }
        })

        if (!ticket) {
            return NextResponse.json({ error: 'Ticket not found' }, { status: 404 })
        }

        return NextResponse.json({ ticket })
    } catch (error) {
        console.error('Error fetching ticket:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

// POST: Send a message on the ticket
export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const user = await getUser()
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { id } = await params
        const body = await req.json()
        const { content } = body

        if (!content?.trim()) {
            return NextResponse.json({ error: 'Content is required' }, { status: 400 })
        }

        const customer = await prisma.customer.findFirst({
            where: { userId: user.userId }
        })

        // Verify customer owns this ticket
        const ticket = await prisma.supportTicket.findFirst({
            where: { id, customerId: customer?.id || undefined }
        })

        if (!ticket) {
            return NextResponse.json({ error: 'Ticket not found' }, { status: 404 })
        }

        // Create message
        const message = await prisma.supportTicketMessage.create({
            data: {
                ticketId: id,
                senderId: user.userId,
                senderType: 'CUSTOMER',
                senderName: user.email || 'Khách hàng',
                content: content.trim(),
                isInternal: false,
                attachments: []
            }
        })

        // If ticket was WAITING_CUSTOMER or RESOLVED, reopen it
        if (ticket.status === 'WAITING_CUSTOMER') {
            await prisma.supportTicket.update({
                where: { id },
                data: { status: 'IN_PROGRESS', updatedAt: new Date() }
            })
        } else if (ticket.status === 'RESOLVED' || ticket.status === 'CLOSED') {
            await prisma.supportTicket.update({
                where: { id },
                data: { status: 'REOPENED', updatedAt: new Date() }
            })
        }

        return NextResponse.json({ message }, { status: 201 })
    } catch (error) {
        console.error('Error sending message:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

// PATCH: Rate the ticket (customer satisfaction)
export async function PATCH(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const user = await getUser()
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { id } = await params
        const body = await req.json()
        const { rating, feedback } = body

        if (!rating || rating < 1 || rating > 5) {
            return NextResponse.json({ error: 'Rating must be between 1 and 5' }, { status: 400 })
        }

        const customer = await prisma.customer.findFirst({
            where: { userId: user.userId }
        })

        const ticket = await prisma.supportTicket.findFirst({
            where: { id, customerId: customer?.id || undefined }
        })

        if (!ticket) {
            return NextResponse.json({ error: 'Ticket not found' }, { status: 404 })
        }

        const updated = await prisma.supportTicket.update({
            where: { id },
            data: {
                customerRating: rating,
                customerFeedback: feedback || null
            }
        })

        return NextResponse.json({ ticket: updated })
    } catch (error) {
        console.error('Error rating ticket:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
