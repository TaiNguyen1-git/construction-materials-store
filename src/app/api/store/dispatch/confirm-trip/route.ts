import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// POST to confirm trip for a driver (marks all their orders as SHIPPED)
export async function POST(req: NextRequest) {
    try {
        const body = await req.json()
        const { driverId } = body

        console.log(`[ConfirmTrip] Request for driver: ${driverId}`)

        if (!driverId) {
            return NextResponse.json({ success: false, error: 'Driver ID is required' }, { status: 400 })
        }

        // 1. Get all orders assigned to this driver that are ready for shipping
        // We include more statuses just in case they are in different stages of "ready"
        const activeOrders = await prisma.order.findMany({
            where: {
                driverId,
                status: { in: ['CONFIRMED', 'PROCESSING', 'DEPOSIT_PAID', 'PENDING'] }
            },
            include: {
                customer: true
            }
        })

        console.log(`[ConfirmTrip] Found ${activeOrders.length} active orders for driver ${driverId}`)

        if (activeOrders.length === 0) {
            // Check if there are orders ALREADY shipped (maybe user clicked twice)
            const alreadyShipped = await prisma.order.count({
                where: {
                    driverId,
                    status: 'SHIPPED'
                }
            })

            if (alreadyShipped > 0) {
                return NextResponse.json({
                    success: true,
                    message: 'Orders already shipped',
                    alreadyShipped: true
                })
            }

            return NextResponse.json({ success: false, error: 'No active orders for this driver' }, { status: 404 })
        }

        const now = new Date()

        // 2. Update each order: SHIPPED + isCashCollected
        // We do this in one go
        const updatedOrders = await prisma.$transaction(
            activeOrders.map(order => {
                return prisma.order.update({
                    where: { id: order.id },
                    data: {
                        status: 'SHIPPED',
                        isCashCollected: true,
                        cashCollectedAt: now,
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

        console.log(`[ConfirmTrip] Successfully updated ${updatedOrders.length} orders to SHIPPED`)

        // 3. Fire-and-forget: create delivery records + notifications
        // Important: use local variables to avoid closure issues with require
        const orderIds = activeOrders.map(o => ({ id: o.id, number: o.orderNumber, customerId: o.customerId }))

        // We don't use setImmediate with complex logic in Next.js if we can help it
        // but for now let's just make it very safe
        setTimeout(async () => {
            try {
                const { v4: uuidv4 } = require('uuid')
                const { createOrderStatusNotificationForCustomer } = require('@/lib/notification-service')

                for (const orderInfo of orderIds) {
                    try {
                        const token = uuidv4()
                        await (prisma as any).orderDelivery.upsert({
                            where: { orderId: orderInfo.id },
                            create: {
                                orderId: orderInfo.id,
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

                        if (orderInfo.customerId) {
                            await createOrderStatusNotificationForCustomer({
                                id: orderInfo.id,
                                orderNumber: orderInfo.number,
                                status: 'SHIPPED',
                                customer: { userId: orderInfo.customerId }
                            }, token)
                        }
                    } catch (err) {
                        console.error(`[ConfirmTrip-Async] Error for order ${orderInfo.id}:`, err)
                    }
                }
            } catch (globalErr) {
                console.error('[ConfirmTrip-Async] Global error:', globalErr)
            }
        }, 0)

        return NextResponse.json({
            success: true,
            message: `Confirmed trip for ${updatedOrders.length} orders`,
            data: updatedOrders
        })
    } catch (error: any) {
        console.error('[ConfirmTrip] Error:', error)
        return NextResponse.json({ success: false, error: error.message || 'Internal Server Error' }, { status: 500 })
    }
}
