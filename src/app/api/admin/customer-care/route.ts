import { NextRequest, NextResponse } from 'next/server'
import { getUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET: Aggregated customer care dashboard data
export async function GET(req: NextRequest) {
    try {
        const user = await getUser()
        if (!user || !['MANAGER', 'EMPLOYEE'].includes(user.role)) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const now = new Date()
        const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000)
        const twoDaysAgo = new Date(now.getTime() - 48 * 60 * 60 * 1000)
        const threeDaysAgo = new Date(now.getTime() - 72 * 60 * 60 * 1000)

        // Parallel fetch all data
        const [
            // Tickets stats
            ticketsOpen,
            ticketsInProgress,
            ticketsTotal,
            ticketsSlaBreached,
            recentTickets,

            // Support Requests stats
            supportPending,
            supportTotal,
            recentSupport,

            // Disputes stats
            disputesOpen,
            disputesTotal,
            recentDisputes,

            // Proactive alerts
            stuckOrders,
            slowTickets,
            slowDisputes,
        ] = await Promise.all([
            // Tickets
            prisma.supportTicket.count({ where: { status: { in: ['OPEN', 'REOPENED'] } } }),
            prisma.supportTicket.count({ where: { status: 'IN_PROGRESS' } }),
            prisma.supportTicket.count(),
            prisma.supportTicket.count({
                where: {
                    status: { notIn: ['RESOLVED', 'CLOSED'] },
                    slaDeadline: { lt: now }
                }
            }),
            prisma.supportTicket.findMany({
                orderBy: { createdAt: 'desc' },
                take: 20,
                include: {
                    messages: {
                        orderBy: { createdAt: 'desc' },
                        take: 1
                    }
                }
            }),

            // Support Requests
            prisma.supportRequest.count({ where: { status: 'PENDING' } }),
            prisma.supportRequest.count(),
            prisma.supportRequest.findMany({
                orderBy: { createdAt: 'desc' },
                take: 20
            }),

            // Disputes
            prisma.dispute.count({ where: { status: 'OPEN' } }),
            prisma.dispute.count(),
            prisma.dispute.findMany({
                orderBy: { createdAt: 'desc' },
                take: 20,
                include: {
                    order: { select: { id: true, orderNumber: true } },
                    customer: { select: { id: true, user: { select: { name: true } } } },
                    comments: { orderBy: { createdAt: 'desc' }, take: 1 }
                }
            }),

            // Proactive: Stuck orders (SHIPPED > 3 days, not delivered)
            prisma.order.findMany({
                where: {
                    status: 'SHIPPED',
                    updatedAt: { lt: threeDaysAgo }
                },
                select: {
                    id: true,
                    orderNumber: true,
                    status: true,
                    updatedAt: true,
                    customer: { select: { user: { select: { name: true, phone: true } } } }
                },
                take: 10
            }),

            // Proactive: Tickets open > 24h with no response
            prisma.supportTicket.findMany({
                where: {
                    status: { in: ['OPEN', 'REOPENED'] },
                    createdAt: { lt: oneDayAgo },
                    firstResponseAt: null
                },
                select: {
                    id: true,
                    ticketNumber: true,
                    subject: true,
                    priority: true,
                    createdAt: true,
                    slaDeadline: true
                },
                take: 10
            }),

            // Proactive: Disputes open > 48h
            prisma.dispute.findMany({
                where: {
                    status: 'OPEN',
                    createdAt: { lt: twoDaysAgo }
                },
                select: {
                    id: true,
                    reason: true,
                    type: true,
                    createdAt: true,
                    customer: { select: { user: { select: { name: true } } } }
                },
                take: 10
            }),
        ])

        // Build unified timeline (merge all sources, sort by date)
        const timeline = [
            ...recentTickets.map((t: any) => ({
                type: 'TICKET' as const,
                id: t.id,
                title: `[${t.ticketNumber}] ${t.subject}`,
                status: t.status,
                priority: t.priority,
                category: t.category,
                lastMessage: t.messages?.[0]?.content?.substring(0, 100),
                createdAt: t.createdAt,
                updatedAt: t.updatedAt
            })),
            ...recentSupport.map((s: any) => ({
                type: 'SUPPORT_REQUEST' as const,
                id: s.id,
                title: `Liên hệ từ ${s.name} (${s.phone})`,
                status: s.status,
                priority: s.priority,
                category: 'CONTACT_FORM',
                lastMessage: s.message?.substring(0, 100),
                createdAt: s.createdAt,
                updatedAt: s.createdAt
            })),
            ...recentDisputes.map((d: any) => ({
                type: 'DISPUTE' as const,
                id: d.id,
                title: `Tranh chấp: ${d.reason}`,
                status: d.status,
                priority: 'HIGH',
                category: d.type,
                lastMessage: d.comments?.[0]?.content?.substring(0, 100) || d.description,
                customerName: d.customer?.user?.name,
                orderId: d.order?.id,
                orderNumber: d.order?.orderNumber,
                createdAt: d.createdAt,
                updatedAt: d.updatedAt
            }))
        ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

        // Build proactive alerts
        const alerts = [
            ...stuckOrders.map((o: any) => ({
                type: 'STUCK_ORDER' as const,
                severity: 'warning' as const,
                title: `Đơn ${o.orderNumber} đã ship ${Math.floor((now.getTime() - new Date(o.updatedAt).getTime()) / 86400000)} ngày chưa giao`,
                description: `Khách: ${o.customer?.user?.name || 'N/A'} - ${o.customer?.user?.phone || ''}`,
                link: `/admin/orders/${o.id}`,
                createdAt: o.updatedAt
            })),
            ...slowTickets.map((t: any) => ({
                type: 'SLOW_TICKET' as const,
                severity: (t.priority === 'URGENT' || t.priority === 'HIGH' ? 'critical' : 'warning') as 'critical' | 'warning',
                title: `Ticket ${t.ticketNumber} chưa phản hồi >24h`,
                description: t.subject,
                link: `/admin/tickets`,
                createdAt: t.createdAt
            })),
            ...slowDisputes.map((d: any) => ({
                type: 'SLOW_DISPUTE' as const,
                severity: 'critical' as const,
                title: `Tranh chấp chưa xử lý >48h`,
                description: `${d.customer?.user?.name || 'N/A'}: ${d.reason}`,
                link: `/admin/disputes`,
                createdAt: d.createdAt
            }))
        ].sort((a, b) => {
            const severityOrder: Record<string, number> = { critical: 0, warning: 1 }
            return (severityOrder[a.severity] || 1) - (severityOrder[b.severity] || 1)
        })

        return NextResponse.json({
            stats: {
                tickets: { open: ticketsOpen, inProgress: ticketsInProgress, total: ticketsTotal, slaBreached: ticketsSlaBreached },
                supportRequests: { pending: supportPending, total: supportTotal },
                disputes: { open: disputesOpen, total: disputesTotal },
                alertCount: alerts.length
            },
            timeline,
            alerts
        })
    } catch (error) {
        console.error('Error in customer care API:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
