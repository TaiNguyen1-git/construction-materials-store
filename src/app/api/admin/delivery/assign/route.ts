
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createSuccessResponse, createErrorResponse } from '@/lib/api-types'
import { v4 as uuidv4 } from 'uuid'

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const { orderId } = body

        if (!orderId) {
            return NextResponse.json(createErrorResponse('Thiếu Order ID', 'BAD_REQUEST'), { status: 400 })
        }

        // Check if already exists
        const existing = await (prisma as any).orderDelivery.findUnique({
            where: { orderId }
        })

        if (existing) {
            return NextResponse.json(createErrorResponse('Đơn này đã được điều phối', 'CONFLICT'), { status: 409 })
        }

        // Create new delivery record
        const token = uuidv4()
        const delivery = await (prisma as any).orderDelivery.create({
            data: {
                orderId,
                deliveryToken: token,
                status: 'ASSIGNED',
                shippedAt: new Date() // Mark as shipped roughly now or when they pick it up
            }
        })

        // Update Order status to SHIPPED
        await prisma.order.update({
            where: { id: orderId },
            data: { status: 'SHIPPED' }
        })

        // Return the Magic Link
        const magicLink = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/delivery/${token}`

        return NextResponse.json(createSuccessResponse({
            deliveryId: delivery.id,
            token,
            magicLink
        }))

    } catch (error) {
        console.error('Assign Delivery Error:', error)
        return NextResponse.json(createErrorResponse('Lỗi tạo vận đơn', 'SERVER_ERROR'), { status: 500 })
    }
}
