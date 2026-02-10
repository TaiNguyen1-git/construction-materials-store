import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyTokenFromRequest } from '@/lib/auth-middleware-api'

interface RouteParams {
    params: Promise<{ id: string }>
}

// GET: Fetch messages for a ticket
export async function GET(request: NextRequest, { params }: RouteParams) {
    try {
        const { id } = await params
        const auth = verifyTokenFromRequest(request)

        const ticket = await prisma.supportTicket.findUnique({
            where: { id }
        })

        if (!ticket) {
            return NextResponse.json(
                { error: 'Ticket not found' },
                { status: 404 }
            )
        }

        // Check access permission
        if (auth?.role !== 'MANAGER') {
            if (ticket.customerId && auth?.userId) {
                const customer = await prisma.customer.findUnique({
                    where: { userId: auth.userId }
                })
                if (!customer || ticket.customerId !== customer.id) {
                    return NextResponse.json(
                        { error: 'Access denied' },
                        { status: 403 }
                    )
                }
            }
        }

        // Fetch messages - hide internal messages from customers
        const messages = await prisma.supportTicketMessage.findMany({
            where: {
                ticketId: id,
                ...(auth?.role !== 'MANAGER' ? { isInternal: false } : {})
            },
            orderBy: { createdAt: 'asc' }
        })

        return NextResponse.json({ messages })
    } catch (error) {
        console.error('Error fetching messages:', error)
        return NextResponse.json(
            { error: 'Failed to fetch messages' },
            { status: 500 }
        )
    }
}

// POST: Add new message to ticket
export async function POST(request: NextRequest, { params }: RouteParams) {
    try {
        const { id } = await params
        const auth = verifyTokenFromRequest(request)
        const body = await request.json()

        const { content, attachments = [], isInternal = false } = body

        if (!content?.trim()) {
            return NextResponse.json(
                { error: 'Message content is required' },
                { status: 400 }
            )
        }

        const ticket = await prisma.supportTicket.findUnique({
            where: { id }
        })

        if (!ticket) {
            return NextResponse.json(
                { error: 'Ticket not found' },
                { status: 404 }
            )
        }

        // Check access permission
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

        // Only admin can post internal messages
        if (isInternal && !isAdmin) {
            return NextResponse.json(
                { error: 'Only staff can post internal notes' },
                { status: 403 }
            )
        }

        // Determine sender type
        let senderType: 'CUSTOMER' | 'STAFF' | 'SYSTEM' = 'CUSTOMER'
        if (isAdmin) {
            senderType = 'STAFF'
        }

        // Get sender name
        let senderName = ticket.guestName || 'Khách hàng'
        if (auth?.userId) {
            const user = await prisma.user.findUnique({
                where: { id: auth.userId },
                select: { name: true }
            })
            if (user) senderName = user.name
        }

        // Create message
        const message = await prisma.supportTicketMessage.create({
            data: {
                ticketId: id,
                senderId: auth?.userId || null,
                senderType,
                senderName,
                content,
                attachments,
                isInternal
            }
        })

        // Update ticket status and first response time
        const ticketUpdate: Record<string, unknown> = {
            updatedAt: new Date()
        }

        // Track first response from staff
        if (isAdmin && !ticket.firstResponseAt) {
            ticketUpdate.firstResponseAt = new Date()
        }

        // Auto-update status based on who replied
        if (isAdmin && ticket.status === 'OPEN') {
            ticketUpdate.status = 'IN_PROGRESS'
        } else if (!isAdmin && ticket.status === 'WAITING_CUSTOMER') {
            ticketUpdate.status = 'IN_PROGRESS'
        }

        await prisma.supportTicket.update({
            where: { id },
            data: ticketUpdate
        })

        return NextResponse.json({
            success: true,
            message
        })
    } catch (error) {
        console.error('Error creating message:', error)
        return NextResponse.json(
            { error: 'Failed to create message' },
            { status: 500 }
        )
    }
}
