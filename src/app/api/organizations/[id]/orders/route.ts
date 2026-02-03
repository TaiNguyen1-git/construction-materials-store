import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyTokenFromRequest } from '@/lib/auth-middleware-api'

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const payload = verifyTokenFromRequest(req)
        const userId = payload?.userId
        if (!userId) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

        // Check membership
        const membership = await prisma.organizationMember.findUnique({
            where: {
                organizationId_userId: {
                    organizationId: id,
                    userId
                }
            }
        })

        if (!membership) {
            return NextResponse.json({ success: false, error: 'Access denied' }, { status: 403 })
        }

        const { searchParams } = new URL(req.url)
        const status = searchParams.get('status') // 'PENDING_APPROVAL' or 'ALL'

        const where: any = {
            organizationId: id
        }

        if (status === 'PENDING_APPROVAL') {
            where.b2bApprovalStatus = 'PENDING_APPROVAL'
        }

        const orders = await prisma.order.findMany({
            where,
            include: {
                customer: {
                    include: {
                        user: {
                            select: { name: true, email: true, phone: true }
                        }
                    }
                },
                _count: {
                    select: { orderItems: true }
                }
            },
            orderBy: { createdAt: 'desc' }
        })

        const formattedOrders = orders.map((order: any) => ({
            id: order.id,
            orderNumber: order.orderNumber,
            totalAmount: order.totalAmount,
            status: order.status,
            b2bApprovalStatus: order.b2bApprovalStatus,
            createdAt: order.createdAt,
            itemCount: order._count.orderItems,
            createdBy: order.customer?.user || { name: order.guestName || 'Khách lẻ' }
        }))

        return NextResponse.json({ success: true, data: formattedOrders })

    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }
}
