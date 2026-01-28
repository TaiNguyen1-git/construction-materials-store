import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
    try {
        const userId = request.headers.get('x-user-id')
        if (!userId) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
        }

        // Check if user exists (implicit check by finding stats, but for auth we could check profile)
        // const profile = await prisma.contractorProfile.findFirst({
        //     where: { userId }
        // })

        // 1. Get stats counts
        const activeProjectsCount = await prisma.project.count({
            where: {
                contractorId: userId,
                status: { in: ['IN_PROGRESS', 'PLANNING'] }
            }
        })

        const pendingOrdersCount = await prisma.order.count({
            where: {
                customerId: userId, // Assuming contractor is also a customer
                status: 'PENDING'
            }
        })

        // Mock unread notifications for now (add Notification model later if needed)
        const unreadNotificationsCount = 5

        // 2. Get recent orders
        const recentOrders = await prisma.order.findMany({
            where: { customerId: userId },
            take: 5,
            orderBy: { createdAt: 'desc' },
            include: {
                orderItems: {
                    take: 1,
                    include: { product: true }
                }
            }
        })

        // 3. Get recent projects (bids won or invites)
        // Mock for now as project structure might vary
        // const recentProjects: any[] = []

        return NextResponse.json({
            success: true,
            stats: {
                activeProjects: activeProjectsCount,
                pendingOrders: pendingOrdersCount,
                unreadNotifications: unreadNotificationsCount,
                totalSpent: 125000000, // Mock total spent
                thisMonthSpent: 15400000 // Mock monthly spent
            },
            recentOrders: recentOrders.map(o => ({
                id: o.id,
                code: o.id.substring(0, 8).toUpperCase(),
                total: o.totalAmount,
                status: o.status,
                date: o.createdAt,
                itemCount: o.orderItems.length, // this is just 1 from include, need count
                firstItem: o.orderItems[0]?.product.name || 'Vật tư xây dựng'
            }))
        })

    } catch (error: unknown) {
        console.error('Dashboard stats error:', error)
        const errorMessage = error instanceof Error ? error.message : 'Unknown error'
        return NextResponse.json({ success: false, error: errorMessage }, { status: 500 })
    }
}
