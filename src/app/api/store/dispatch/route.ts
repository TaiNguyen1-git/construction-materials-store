import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
    try {
        // 1. Fetch orders that need dispatching (CONFIRMED, PROCESSING, but not yet COMPLETED)
        const orders = await prisma.order.findMany({
            where: {
                status: { in: ['CONFIRMED', 'PROCESSING', 'SHIPPED'] },
            },
            include: {
                driver: { include: { user: true } },
                customer: { include: { user: true } }
            },
            orderBy: { createdAt: 'desc' }
        })

        // 2. Fetch drivers (Employees with position DRIVER or similar)
        const drivers = await prisma.employee.findMany({
            where: {
                isActive: true,
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

// PUT to assign/unassign driver to order
export async function PUT(req: NextRequest) {
    try {
        const body = await req.json()
        const { orderId, driverId } = body

        if (!orderId) {
            return NextResponse.json({ success: false, error: 'Order ID is required' }, { status: 400 })
        }

        // Build update data based on whether we're assigning or unassigning
        const updateData: any = {
            driverId: driverId || null,
        }

        // Only create tracking and move to PROCESSING if assigning a driver
        if (driverId) {
            updateData.status = 'PROCESSING'
            updateData.orderTracking = {
                create: {
                    status: 'PROCESSING',
                    description: `Đơn hàng đã được sắp xếp giao cho tài xế.`,
                    timestamp: new Date()
                }
            }
        }

        const order = await prisma.order.update({
            where: { id: orderId },
            data: updateData,
            include: {
                driver: { include: { user: true } },
                customer: { select: { userId: true } }
            }
        })

        // Notify customer only when assigning
        if (driverId) {
            import('@/lib/notification-service').then(({ createOrderStatusNotificationForCustomer }) => {
                if (order.customer?.userId) {
                    createOrderStatusNotificationForCustomer({
                        id: order.id,
                        orderNumber: order.orderNumber,
                        status: 'PROCESSING',
                        customer: { userId: order.customer.userId }
                    })
                }
            }).catch(err => console.error('Notification error:', err))
        }

        return NextResponse.json({ success: true, data: order })
    } catch (error) {
        console.error('Dispatch PUT error:', error)
        return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 })
    }
}
