
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createSuccessResponse, createErrorResponse } from '@/lib/api-types'

export async function GET(request: NextRequest) {
    try {
        // 1. Get orders ready for delivery (e.g. PROCESSING, CONFIRMED) that don't have a delivery record yet
        const readyOrders = await prisma.order.findMany({
            where: {
                status: { in: ['PROCESSING', 'CONFIRMED'] },
                delivery: { is: null }
            },
            include: {
                customer: true,
                _count: { select: { orderItems: true } }
            },
            orderBy: { createdAt: 'desc' }
        })

        // 2. Get active deliveries
        const activeDeliveries = await (prisma as any).orderDelivery.findMany({
            where: {
                status: { not: 'DELIVERED' }
            },
            include: {
                order: {
                    include: {
                        customer: true
                    }
                }
            },
            orderBy: { lastLocationUpdate: 'desc' }
        })

        // 3. Get completed deliveries (recent)
        const completedDeliveries = await (prisma as any).orderDelivery.findMany({
            where: {
                status: 'DELIVERED'
            },
            include: {
                order: true
            },
            take: 10,
            orderBy: { deliveredAt: 'desc' }
        })

        return NextResponse.json(createSuccessResponse({
            readyOrders: readyOrders.map(o => ({
                id: o.id,
                orderNumber: o.orderNumber,
                customerName: o.customer?.name || o.guestName || 'Khách lẻ',
                address: o.shippingAddress,
                totalAmount: o.totalAmount,
                itemsCount: o._count.orderItems,
                status: o.status
            })),
            activeDeliveries: activeDeliveries.map((d: any) => ({
                id: d.id,
                orderNumber: d.order.orderNumber,
                driverName: 'Tài xế tự do', // Or fetch from driverId if implemented
                token: d.deliveryToken,
                status: d.status,
                lastLocation: d.currentLat ? { lat: d.currentLat, lng: d.currentLng, updated: d.lastLocationUpdate } : null,
                address: d.order.shippingAddress
            })),
            history: completedDeliveries.map((d: any) => ({
                id: d.id,
                orderNumber: d.order.orderNumber,
                deliveredAt: d.deliveredAt,
                proof: d.proofImageUrl
            }))
        }))

    } catch (error) {
        console.error('Delivery Dashboard Error:', error)
        return NextResponse.json(createErrorResponse('Lỗi tải dữ liệu vận chuyển', 'SERVER_ERROR'), { status: 500 })
    }
}
