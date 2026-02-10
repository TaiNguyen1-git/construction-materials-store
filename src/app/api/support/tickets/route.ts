import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyTokenFromRequest } from '@/lib/auth-middleware-api'

// GET: Fetch tickets (admin sees all, user sees own)
export async function GET(request: NextRequest) {
    try {
        const auth = verifyTokenFromRequest(request)
        const { searchParams } = new URL(request.url)

        const page = parseInt(searchParams.get('page') || '1')
        const limit = parseInt(searchParams.get('limit') || '20')
        const status = searchParams.get('status')
        const category = searchParams.get('category')
        const priority = searchParams.get('priority')
        const search = searchParams.get('search')

        const skip = (page - 1) * limit

        // Build filter
        const where: Record<string, unknown> = {}

        // Non-admin users can only see their own tickets
        if (!auth || auth.role !== 'MANAGER') {
            if (auth?.userId) {
                // Get customer ID from user
                const customer = await prisma.customer.findUnique({
                    where: { userId: auth.userId }
                })
                if (customer) {
                    where.customerId = customer.id
                } else {
                    return NextResponse.json({ tickets: [], total: 0 })
                }
            } else {
                // Guest - need email or phone to identify
                const email = searchParams.get('email')
                const phone = searchParams.get('phone')
                if (email) where.guestEmail = email
                else if (phone) where.guestPhone = phone
                else {
                    return NextResponse.json({ tickets: [], total: 0 })
                }
            }
        }

        if (status) where.status = status
        if (category) where.category = category
        if (priority) where.priority = priority

        if (search) {
            where.OR = [
                { ticketNumber: { contains: search, mode: 'insensitive' } },
                { subject: { contains: search, mode: 'insensitive' } },
                { description: { contains: search, mode: 'insensitive' } },
                { guestName: { contains: search, mode: 'insensitive' } },
                { guestEmail: { contains: search, mode: 'insensitive' } },
            ]
        }

        const [tickets, total] = await Promise.all([
            prisma.supportTicket.findMany({
                where,
                orderBy: [
                    { priority: 'desc' },
                    { createdAt: 'desc' }
                ],
                skip,
                take: limit,
                include: {
                    messages: {
                        orderBy: { createdAt: 'desc' },
                        take: 1
                    }
                }
            }),
            prisma.supportTicket.count({ where })
        ])

        return NextResponse.json({
            tickets,
            total,
            page,
            totalPages: Math.ceil(total / limit)
        })
    } catch (error) {
        console.error('Error fetching tickets:', error)
        return NextResponse.json(
            { error: 'Failed to fetch tickets' },
            { status: 500 }
        )
    }
}

// POST: Create new ticket
export async function POST(request: NextRequest) {
    try {
        const auth = verifyTokenFromRequest(request)
        const body = await request.json()

        const {
            subject,
            description,
            category = 'GENERAL',
            priority = 'MEDIUM',
            orderId,
            productId,
            chatSessionId,
            guestName,
            guestEmail,
            guestPhone,
            attachments = []
        } = body

        if (!subject || !description) {
            return NextResponse.json(
                { error: 'Subject and description are required' },
                { status: 400 }
            )
        }

        // Generate ticket number: TK-YYMMDD-XXXX
        const now = new Date()
        const datePart = now.toISOString().slice(2, 10).replace(/-/g, '')
        const randomPart = Math.random().toString(36).substring(2, 6).toUpperCase()
        const ticketNumber = `TK-${datePart}-${randomPart}`

        // Calculate SLA deadline based on priority
        const slaHours: Record<string, number> = {
            URGENT: 2,
            HIGH: 8,
            MEDIUM: 24,
            LOW: 72
        }
        const slaDeadline = new Date(now.getTime() + (slaHours[priority] || 24) * 60 * 60 * 1000)

        const ticketData: Record<string, unknown> = {
            ticketNumber,
            subject,
            description,
            category,
            priority,
            status: 'OPEN',
            slaDeadline,
            attachments,
            orderId: orderId || undefined,
            productId: productId || undefined,
            chatSessionId: chatSessionId || undefined
        }

        // Attach customer info
        if (auth?.userId) {
            const customer = await prisma.customer.findUnique({
                where: { userId: auth.userId }
            })
            if (customer) {
                ticketData.customerId = customer.id
            }
        } else {
            // Guest ticket
            if (!guestName || (!guestEmail && !guestPhone)) {
                return NextResponse.json(
                    { error: 'Guest must provide name and email/phone' },
                    { status: 400 }
                )
            }
            ticketData.guestName = guestName
            ticketData.guestEmail = guestEmail
            ticketData.guestPhone = guestPhone
        }

        const ticket = await prisma.supportTicket.create({
            data: ticketData as Parameters<typeof prisma.supportTicket.create>[0]['data'],
            include: {
                messages: true
            }
        })

        // Create initial message from the description
        await prisma.supportTicketMessage.create({
            data: {
                ticketId: ticket.id,
                senderId: auth?.userId || null,
                senderType: 'CUSTOMER',
                senderName: guestName || 'Khách hàng',
                content: description,
                attachments
            }
        })

        return NextResponse.json({
            success: true,
            ticket,
            message: 'Ticket created successfully'
        })
    } catch (error) {
        console.error('Error creating ticket:', error)
        return NextResponse.json(
            { error: 'Failed to create ticket' },
            { status: 500 }
        )
    }
}
