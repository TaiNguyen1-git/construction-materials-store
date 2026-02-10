import { NextRequest, NextResponse } from 'next/server'
import { getUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET: List tickets for the current customer
export async function GET(req: NextRequest) {
    try {
        const user = await getUser()
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { searchParams } = new URL(req.url)
        const status = searchParams.get('status')
        const page = parseInt(searchParams.get('page') || '1')
        const limit = parseInt(searchParams.get('limit') || '20')
        const skip = (page - 1) * limit

        // Find customer record
        const customer = await prisma.customer.findFirst({
            where: { userId: user.userId }
        })

        if (!customer) {
            return NextResponse.json({ tickets: [], total: 0, totalPages: 0 })
        }

        const where: any = { customerId: customer.id }
        if (status) where.status = status

        const [tickets, total] = await Promise.all([
            prisma.supportTicket.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit,
                include: {
                    messages: {
                        where: { isInternal: false },
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
            totalPages: Math.ceil(total / limit),
            page
        })
    } catch (error) {
        console.error('Error fetching customer tickets:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

// POST: Create a new ticket
export async function POST(req: NextRequest) {
    try {
        const user = await getUser()
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const body = await req.json()
        const { subject, description, category, priority, orderId } = body

        if (!subject || !description) {
            return NextResponse.json({ error: 'Subject and description are required' }, { status: 400 })
        }

        // Find customer record
        const customer = await prisma.customer.findFirst({
            where: { userId: user.userId }
        })

        // Generate ticket number: TK-YYMMDD-XXXX
        const now = new Date()
        const dateStr = now.toISOString().slice(2, 10).replace(/-/g, '')
        const count = await prisma.supportTicket.count()
        const ticketNumber = `TK-${dateStr}-${String(count + 1).padStart(4, '0')}`

        // Calculate SLA deadline based on priority
        const slaHours: Record<string, number> = {
            URGENT: 4,
            HIGH: 8,
            MEDIUM: 24,
            LOW: 48
        }
        const hours = slaHours[priority || 'MEDIUM'] || 24
        const slaDeadline = new Date(now.getTime() + hours * 60 * 60 * 1000)

        const ticket = await prisma.supportTicket.create({
            data: {
                ticketNumber,
                customerId: customer?.id || null,
                guestName: !customer ? user.email : undefined,
                guestEmail: !customer ? user.email : undefined,
                subject,
                description,
                category: category || 'GENERAL',
                priority: priority || 'MEDIUM',
                status: 'OPEN',
                orderId: orderId || null,
                slaDeadline,
                messages: {
                    create: {
                        senderType: 'CUSTOMER',
                        senderId: user.userId,
                        senderName: user.email || 'Khách hàng',
                        content: description,
                        isInternal: false,
                        attachments: []
                    }
                }
            },
            include: {
                messages: true
            }
        })

        return NextResponse.json({ ticket }, { status: 201 })
    } catch (error) {
        console.error('Error creating ticket:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
