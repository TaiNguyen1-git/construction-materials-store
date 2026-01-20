import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createSuccessResponse, createErrorResponse } from '@/lib/api-types'

export async function POST(
    request: NextRequest,
    { params }: { params: { token: string } }
) {
    try {
        const { token } = params
        const body = await request.json()
        const { proofImageUrl, evidenceNotes, lat, lng } = body

        const delivery = await (prisma as any).orderDelivery.findUnique({
            where: { deliveryToken: token }
        })

        if (!delivery) {
            return NextResponse.json(createErrorResponse('Mã vận đơn không hợp lệ', 'NOT_FOUND'), { status: 404 })
        }

        // Update delivery status
        await (prisma as any).orderDelivery.update({
            where: { id: delivery.id },
            data: {
                status: 'DELIVERED',
                deliveredAt: new Date(),
                proofImageUrl,
                evidenceNotes,
                deliveryLat: lat,
                deliveryLng: lng
            }
        })

        // Update Order status
        await prisma.order.update({
            where: { id: delivery.orderId },
            data: {
                status: 'DELIVERED',
                actualDelivery: new Date(),
                paymentStatus: 'PAID' // Assuming payment on delivery or completed
            }
        })

        // Notify Customer
        const order = await prisma.order.findUnique({
            where: { id: delivery.orderId },
            include: { customer: true }
        })

        if (order?.customer?.userId) {
            await prisma.notification.create({
                data: {
                    type: 'SUCCESS',
                    title: '🚚 Giao hàng thành công!',
                    message: `Đơn hàng ${order.orderNumber} đã được giao thành công. Cảm ơn quý khách!`,
                    priority: 'MEDIUM',
                    userId: order.customer.userId,
                    metadata: {
                        orderId: order.id
                    }
                } as any
            })
        }

        return NextResponse.json(createSuccessResponse(null, 'Đã xác nhận giao hàng thành công!'))

    } catch (error) {
        console.error('Error completing delivery:', error)
        return NextResponse.json(createErrorResponse('Lỗi máy chủ', 'SERVER_ERROR'), { status: 500 })
    }
}
