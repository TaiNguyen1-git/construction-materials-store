import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
    try {
        // 1. Fetch pending handovers (SHIPPED or DELIVERED + cashHandedOverAt is null)
        const pendingOrders = await prisma.order.findMany({
            where: {
                status: { in: ['SHIPPED', 'DELIVERED'] },
                OR: [
                    { cashHandedOverAt: null },
                    { cashHandedOverAt: { isSet: false } } as any
                ]
            },
            include: {
                driver: { include: { user: true } },
                customer: { include: { user: true } }
            },
            orderBy: { createdAt: 'desc' }
        })

        // 2. Fetch recently completed handovers
        const historyOrders = await prisma.order.findMany({
            where: {
                cashHandedOverAt: { not: null },
            },
            include: {
                driver: { include: { user: true } },
                customer: { include: { user: true } }
            },
            orderBy: { cashHandedOverAt: 'desc' },
            take: 20
        })

        return NextResponse.json({
            success: true,
            data: {
                pending: pendingOrders,
                history: historyOrders
            }
        })
    } catch (error: any) {
        return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 })
    }
}

// PUT to confirm cash received from driver
export async function PUT(req: NextRequest) {
    try {
        const body = await req.json()
        const { orderId } = body

        const order = await prisma.order.update({
            where: { id: orderId },
            data: {
                cashHandedOverAt: new Date(),
                paymentStatus: 'PAID' // Mark as paid when cash is handed over to store
            }
        })

        return NextResponse.json({ success: true, data: order })
    } catch (error) {
        return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 })
    }
}
