import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createSuccessResponse, createErrorResponse } from '@/lib/api-types'

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ token: string }> }
) {
    try {
        const { token } = await params

        const delivery = await (prisma as any).orderDelivery.findUnique({
            where: { deliveryToken: token },
            include: {
                order: {
                    include: {
                        orderItems: {
                            include: {
                                product: true
                            }
                        }
                    }
                }
            }
        })

        if (!delivery) {
            return NextResponse.json(createErrorResponse('Mã vận đơn không tồn tại', 'NOT_FOUND'), { status: 404 })
        }

        return NextResponse.json(createSuccessResponse({
            orderNumber: delivery.order.orderNumber,
            totalAmount: delivery.order.totalAmount,
            shippingAddress: delivery.order.shippingAddress,
            customerName: delivery.order.guestName || 'Khách hàng',
            customerPhone: delivery.order.guestPhone,
            items: delivery.order.orderItems.map((item: any) => ({
                name: item.product.name,
                quantity: item.quantity,
                unit: item.product.unit
            })),
            status: delivery.status,
            shippedAt: delivery.shippedAt
        }))

    } catch (error) {
        console.error('Error fetching delivery info:', error)
        return NextResponse.json(createErrorResponse('Lỗi máy chủ', 'SERVER_ERROR'), { status: 500 })
    }
}
