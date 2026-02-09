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

        // Fetch customer data - Try finding by Customer ID OR User ID
        let customer = await prisma.customer.findFirst({
            where: {
                OR: [
                    { id: customerId },
                    { userId: customerId }
                ]
            },
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

        // If no customer record, try fetching basic user info (it might be a Supplier or Employee)
        if (!customer) {
            const user = await prisma.user.findUnique({
                where: { id: customerId },
                select: {
                    id: true,
                    name: true,
                    email: true,
                    phone: true,
                    role: true
                }
            })

            if (!user) {
                return NextResponse.json({ message: 'User not found' }, { status: 404 })
            }

            return NextResponse.json({
                success: true,
                data: {
                    id: user.id,
                    name: user.name || 'Người dùng',
                    email: user.email,
                    phone: user.phone,
                    membershipTier: 'NONE',
                    totalSpent: 0,
                    totalOrders: 0,
                    recentOrders: [],
                    isGuest: false,
                    role: user.role
                }
            })
        }

        // Fetch order statistics
        const orderStats = await prisma.order.aggregate({
            where: { customerId: customer.id },
            _sum: { netAmount: true },
            _count: { id: true }
        })

        // Fetch recent orders
        const recentOrders = await prisma.order.findMany({
            where: { customerId: customer.id },
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
        let membershipTier: 'BRONZE' | 'SILVER' | 'GOLD' | 'PLATINUM' | 'NONE' = 'BRONZE'
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
