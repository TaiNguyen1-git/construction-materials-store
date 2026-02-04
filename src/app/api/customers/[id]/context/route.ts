import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyTokenFromRequest } from '@/lib/auth'

// GET /api/customers/[id]/context - Get customer context for support chat
export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const decoded = await verifyTokenFromRequest(req)
        if (!decoded) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
        }

        // Only allow MANAGER/EMPLOYEE to view customer context
        if (decoded.role !== 'MANAGER' && decoded.role !== 'EMPLOYEE') {
            return NextResponse.json({ message: 'Forbidden' }, { status: 403 })
        }

        const { id: customerId } = await params

        // Check if it's a guest ID
        if (customerId.startsWith('guest_')) {
            return NextResponse.json({
                success: true,
                data: {
                    id: customerId,
                    name: `Khách #${customerId.replace('guest_', '')}`,
                    isGuest: true,
                    totalSpent: 0,
                    totalOrders: 0,
                    recentOrders: []
                }
            })
        }

        // Fetch customer data
        const customer = await prisma.customer.findUnique({
            where: { id: customerId },
            include: {
                user: {
                    select: {
                        name: true,
                        email: true,
                        phone: true,
                    }
                }
            }
        })

        if (!customer) {
            return NextResponse.json({ message: 'Customer not found' }, { status: 404 })
        }

        // Fetch order statistics
        const orderStats = await prisma.order.aggregate({
            where: { customerId },
            _sum: { netAmount: true },
            _count: { id: true }
        })

        // Fetch recent orders
        const recentOrders = await prisma.order.findMany({
            where: { customerId },
            orderBy: { createdAt: 'desc' },
            take: 5,
            include: {
                orderItems: {
                    select: { id: true }
                }
            }
        })

        // Determine membership tier based on total spent
        const totalSpent = orderStats._sum.netAmount || 0
        let membershipTier: 'BRONZE' | 'SILVER' | 'GOLD' | 'PLATINUM' = 'BRONZE'
        if (totalSpent >= 100000000) membershipTier = 'PLATINUM' // 100M+
        else if (totalSpent >= 50000000) membershipTier = 'GOLD' // 50M+
        else if (totalSpent >= 10000000) membershipTier = 'SILVER' // 10M+

        return NextResponse.json({
            success: true,
            data: {
                id: customer.id,
                name: customer.user?.name || 'Khách hàng',
                email: customer.user?.email,
                phone: customer.user?.phone,
                membershipTier,
                totalSpent,
                totalOrders: orderStats._count.id,
                recentOrders: recentOrders.map(order => ({
                    id: order.id,
                    orderNumber: order.orderNumber,
                    status: order.status,
                    totalAmount: order.netAmount || 0,
                    createdAt: order.createdAt.toISOString(),
                    itemCount: order.orderItems.length
                })),
                isGuest: false
            }
        })

    } catch (error: unknown) {
        console.error('[CUSTOMER_CONTEXT_GET]', error)
        const errorMessage = error instanceof Error ? error.message : 'Internal Server Error'
        return NextResponse.json({ message: errorMessage }, { status: 500 })
    }
}
