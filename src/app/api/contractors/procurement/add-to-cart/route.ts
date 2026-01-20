import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createSuccessResponse, createErrorResponse } from '@/lib/api-types'

export async function POST(request: NextRequest) {
    try {
        const customerId = request.headers.get('x-user-customer-id')
        if (!customerId) {
            return NextResponse.json(createErrorResponse('Unauthorized', 'UNAUTHORIZED'), { status: 401 })
        }

        const body = await request.json()
        const { items, requestId } = body // items: [{ productId, quantity, unit, price, name }]

        if (!items || !Array.isArray(items)) {
            return NextResponse.json(createErrorResponse('Invalid items', 'VALIDATION_ERROR'), { status: 400 })
        }

        // 1. Get or Create Cart
        let cart = await (prisma as any).cart.findUnique({
            where: { customerId }
        })

        if (!cart) {
            cart = await (prisma as any).cart.create({
                data: { customerId }
            })
        }

        // 2. Add items to cart
        await prisma.$transaction(
            items.map((item) => {
                return (prisma as any).cartItem.create({
                    data: {
                        cartId: cart!.id,
                        productId: item.productId,
                        productName: item.name,
                        quantity: parseFloat(item.quantity),
                        unit: item.unit,
                        unitPrice: item.price,
                        subtotal: parseFloat(item.quantity) * item.price,
                        source: 'SITE_REQUEST',
                        sourceApplicationId: requestId || null
                    }
                })
            })
        )

        // 3. Update SiteMaterialRequest status to ORDERED/PROCESSING
        if (requestId) {
            await (prisma as any).siteMaterialRequest.update({
                where: { id: requestId },
                data: { status: 'ORDERED' }
            })
        }

        return NextResponse.json(createSuccessResponse({ cartId: cart.id }, 'Đã thêm vật tư vào giỏ hàng thành công!'))
    } catch (error) {
        console.error('Add to cart error:', error)
        return NextResponse.json(createErrorResponse('Internal error', 'SERVER_ERROR'), { status: 500 })
    }
}
