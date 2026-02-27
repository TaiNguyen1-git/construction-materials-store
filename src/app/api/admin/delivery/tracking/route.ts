import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
    try {
        // Fetch active deliveries with real-time tracking data
        const activeDeliveries = await prisma.orderDelivery.findMany({
            where: {
                status: { in: ['ASSIGNED', 'SHIPPED'] },
                currentLat: { not: null },
                currentLng: { not: null }
            },
            include: {
                order: {
                    select: {
                        orderNumber: true,
                        totalAmount: true,
                        shippingAddress: true
                    }
                }
            },
            orderBy: { lastLocationUpdate: 'desc' }
        })

        return NextResponse.json({
            success: true,
            data: activeDeliveries
        })
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Unknown error'
        return NextResponse.json({ error: message }, { status: 500 })
    }
}
