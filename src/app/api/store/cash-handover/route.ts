import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
    try {
        // Orders that have cash collected but not yet handed over
        const orders = await prisma.order.findMany({
            where: {
                isCashCollected: true,
                cashHandedOverAt: null,
            },
            include: {
                driver: { include: { user: true } }
            },
            orderBy: { cashCollectedAt: 'desc' }
        })

        return NextResponse.json({ success: true, data: orders })
    } catch (error) {
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
