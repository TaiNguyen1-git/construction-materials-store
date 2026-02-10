import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createOrderStatusNotificationForCustomer } from '@/lib/notification-service'
import { v4 as uuidv4 } from 'uuid'

// POST to confirm trip for a driver (marks all their orders as SHIPPED)
export async function POST(req: NextRequest) {
    try {
        const body = await req.json()
        const { driverId } = body

        if (!driverId) {
            return NextResponse.json({ success: false, error: 'Driver ID is required' }, { status: 400 })
        }

        // 1. Get all orders assigned to this driver that are not yet SHIPPED or COMPLETED
        const activeOrders = await prisma.order.findMany({
            where: {
                driverId,
                status: { in: ['CONFIRMED', 'PROCESSING'] }
            },
            include: {
                customer: true
            }
        })

        if (activeOrders.length === 0) {
            return NextResponse.json({ success: false, error: 'No active orders for this driver' }, { status: 404 })
        }

        const now = new Date()

        // 2. Perform updates in a transaction
        const updatedOrders = await prisma.$transaction(
            activeOrders.map(order => {
                return prisma.order.update({
                    where: { id: order.id },
                    data: {
                        status: 'SHIPPED',
                        orderTracking: {
                            create: {
                                status: 'SHIPPED',
                                description: 'Tài xế đã nhận hàng và bắt đầu di chuyển đến công trình.',
                                timestamp: now
                            }
                        }
                    }
                })
            })
        )

        // 2.1 Create or Update OrderDelivery records and trigger notifications
        // We do this separately.
        await Promise.all(activeOrders.map(async (order) => {
            const token = uuidv4()
            await (prisma as any).orderDelivery.upsert({
                where: { orderId: order.id },
                create: {
                    orderId: order.id,
                    driverId: driverId,
                    deliveryToken: token,
                    status: 'SHIPPED',
                    shippedAt: now
                },
                update: {
                    driverId: driverId,
                    status: 'SHIPPED',
                    shippedAt: now
                }
            })

            // Trigger notification with token
            if (order.customerId) {
                createOrderStatusNotificationForCustomer({
                    id: order.id,
                    orderNumber: order.orderNumber,
                    status: 'SHIPPED',
                    customer: { userId: order.customerId }
                }, token).catch(err => console.error('Notification error:', err))
            }
        }))


        return NextResponse.json({
            success: true,
            message: `Confirmed trip for ${updatedOrders.length} orders`,
            data: updatedOrders
        })
    } catch (error) {
        console.error('Confirm trip error:', error)
        return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 })
    }
}
