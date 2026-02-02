import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
    try {
        const userId = req.headers.get('x-user-id')
        if (!userId) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

        const body = await req.json()
        const { orderId, reason, description, evidenceUrls, items } = body

        if (!orderId || !items || items.length === 0) {
            return NextResponse.json({ success: false, error: 'Order ID and items are required' }, { status: 400 })
        }

        // Verify order belongs to customer
        const order = await prisma.order.findUnique({
            where: { id: orderId },
            include: { customer: true }
        })

        if (!order || order.customer?.userId !== userId) {
            return NextResponse.json({ success: false, error: 'Order not found or access denied' }, { status: 404 })
        }

        // Check if status is eligible for return
        if (order.status !== 'DELIVERED' && order.status !== 'COMPLETED') {
            return NextResponse.json({ success: false, error: 'Order is not eligible for return' }, { status: 400 })
        }

        // Create the return request
        const customerReturn = await (prisma as any).customerReturn.create({
            data: {
                orderId,
                customerId: order.customerId!,
                reason,
                description,
                evidenceUrls: evidenceUrls || [],
                status: 'PENDING',
                items: {
                    create: items.map((item: any) => ({
                        productId: item.productId,
                        quantity: item.quantity,
                        unitPrice: item.unitPrice
                    }))
                }
            }
        })

        // Optionally update order status to indicate a pending return (or just use relations)

        return NextResponse.json({ success: true, data: customerReturn })
    } catch (error: any) {
        console.error('Error creating customer return:', error)
        return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }
}

export async function GET(req: NextRequest) {
    try {
        const userId = req.headers.get('x-user-id')
        if (!userId) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

        const customer = await prisma.customer.findFirst({
            where: { userId }
        })

        if (!customer) return NextResponse.json({ success: false, error: 'Customer profile not found' }, { status: 404 })

        const returns = await (prisma as any).customerReturn.findMany({
            where: { customerId: customer.id },
            include: {
                order: {
                    select: { orderNumber: true }
                },
                items: {
                    include: {
                        product: {
                            select: { name: true, images: true }
                        }
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        })

        return NextResponse.json({ success: true, data: returns })
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }
}
