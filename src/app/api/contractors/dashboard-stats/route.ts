import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyTokenFromRequest } from '@/lib/auth-middleware-api'

export async function GET(request: NextRequest) {
    try {
        const payload = verifyTokenFromRequest(request)
        if (!payload?.userId) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
        }

        // Find the customer profile associated with this user
        const customer = await prisma.customer.findFirst({
            where: { userId: payload.userId }
        })

        if (!customer) {
            return NextResponse.json({ success: false, error: 'Contractor profile not found' }, { status: 404 })
        }

        const contractorId = customer.id

        // 1. Get stats counts
        const activeProjectsCount = await prisma.project.count({
            where: {
                OR: [
                    { contractorId: contractorId },
                    { customerId: contractorId }
                ],
                status: { in: ['IN_PROGRESS', 'PLANNING'] }
            }
        })

        const pendingOrdersCount = await prisma.order.count({
            where: {
                customerId: contractorId,
                status: { in: ['PENDING', 'CONFIRMED', 'PROCESSING'] }
            }
        })

        // Get unread notifications if model exists, default to 0
        let unreadNotificationsCount = 0
        try {
            unreadNotificationsCount = await (prisma as any).notification?.count({
                where: { userId: payload.userId, read: false }
            }) || 0
        } catch (e) { }

        // 2. Get recent orders
        const recentOrders = await prisma.order.findMany({
            where: { customerId: contractorId },
            take: 5,
            orderBy: { createdAt: 'desc' },
            include: {
                orderItems: {
                    include: { product: true }
                }
            }
        })

        // 3. Calculate spent metrics
        const allOrders = await prisma.order.findMany({
            where: { customerId: contractorId },
            select: { totalAmount: true, createdAt: true }
        })

        const totalSpent = allOrders.reduce((sum, o) => sum + o.totalAmount, 0)

        const now = new Date()
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
        const thisMonthSpent = allOrders
            .filter(o => new Date(o.createdAt) >= startOfMonth)
            .reduce((sum, o) => sum + o.totalAmount, 0)

        return NextResponse.json({
            success: true,
            stats: {
                activeProjects: activeProjectsCount,
                pendingOrders: pendingOrdersCount,
                unreadNotifications: unreadNotificationsCount,
                totalSpent: totalSpent,
                thisMonthSpent: thisMonthSpent
            },
            recentOrders: recentOrders.map(o => ({
                id: o.id,
                code: o.id.substring(o.id.length - 8).toUpperCase(),
                total: o.totalAmount,
                status: o.status,
                date: o.createdAt,
                itemCount: o.orderItems.length,
                firstItem: o.orderItems[0]?.product.name || 'Vật tư xây dựng'
            }))
        })

    } catch (error: unknown) {
        console.error('Dashboard stats error:', error)
        const errorMessage = error instanceof Error ? error.message : 'Unknown error'
        return NextResponse.json({ success: false, error: errorMessage }, { status: 500 })
    }
}
