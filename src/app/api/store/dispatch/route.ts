import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
    try {
        // 1. Fetch orders that need dispatching (CONFIRMED, PROCESSING, but not yet COMPLETED)
        const orders = await prisma.order.findMany({
            where: {
                status: { in: ['CONFIRMED', 'PROCESSING', 'SHIPPED'] },
            },
            include: {
                driver: { include: { user: true } }
            },
            orderBy: { createdAt: 'desc' }
        })

        // 2. Fetch drivers (Employees with position DRIVER or similar)
        const drivers = await prisma.employee.findMany({
            where: {
                isActive: true,
                // In this project, we might search by department or position
                OR: [
                    { position: { contains: 'DRIVER', mode: 'insensitive' } },
                    { position: { contains: 'Tài xế', mode: 'insensitive' } }
                ]
            },
            include: {
                user: { select: { name: true, email: true } }
            }
        })

        return NextResponse.json({
            success: true,
            data: {
                orders,
                drivers
            }
        })
    } catch (error) {
        console.error('Dispatch API error:', error)
        return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 })
    }
}

// PUT to assign driver to order
export async function PUT(req: NextRequest) {
    try {
        const body = await req.json()
        const { orderId, driverId } = body

        const order = await prisma.order.update({
            where: { id: orderId },
            data: {
                driverId,
                status: 'PROCESSING' // Auto move to processing if assigned
            },
            include: { driver: { include: { user: true } } }
        })

        return NextResponse.json({ success: true, data: order })
    } catch (error) {
        return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 })
    }
}
