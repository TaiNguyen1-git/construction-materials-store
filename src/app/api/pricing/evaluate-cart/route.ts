import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { pricingEngine } from '@/lib/pricing-engine'
import { createSuccessResponse, createErrorResponse } from '@/lib/api-types'

/**
 * POST /api/pricing/evaluate-cart
 * Đánh giá giỏ hàng để tính giá theo bậc và gợi ý upsell.
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const { items, customerId } = body // items: Array<{ productId, quantity }>

        if (!items || !Array.isArray(items)) {
            return NextResponse.json(createErrorResponse('Invalid items', 'VALIDATION_ERROR'), { status: 400 })
        }

        const results = []
        const suggestions = []

        for (const item of items) {
            // 1. Lấy giá hiện tại (có tính đến số lượng/bậc giá hiện tại)
            const currentPrice = await pricingEngine.getEffectivePrice(
                item.productId,
                customerId,
                item.quantity
            )

            // 2. Tìm kiếm "Bậc giá tiếp theo" để gợi ý Upsell
            // Chỉ tìm kiếm nếu priceSource là PRICE_LIST (giá sỉ chung)
            let nextTierSuggestion = null

            // Lấy thông tin khách hàng để biết loại khách
            const customer = customerId ? await prisma.customer.findUnique({ where: { id: customerId } }) : null
            const customerType = customer?.customerType || 'REGULAR'

            // Tìm bảng giá đang áp dụng
            const priceList = await prisma.priceList.findFirst({
                where: {
                    isActive: true,
                    customerTypes: { has: customerType as any }
                },
                include: {
                    tiers: {
                        orderBy: { minQuantity: 'asc' }
                    }
                },
                orderBy: { priority: 'desc' }
            })

            if (priceList && priceList.tiers.length > 0) {
                // Tìm bậc giá có minQuantity lớn hơn số lượng hiện tại và gần nhất
                const nextTier = priceList.tiers.find(t => t.minQuantity > item.quantity)

                if (nextTier) {
                    const neededMore = nextTier.minQuantity - item.quantity
                    const potentialDiscount = nextTier.discountPercent

                    nextTierSuggestion = {
                        minQuantity: nextTier.minQuantity,
                        neededMore,
                        potentialDiscount,
                        message: `Mua thêm ${neededMore} sản phẩm nữa để nhận chiết khấu ${potentialDiscount}% (Giá sỉ bậc tiếp theo)`
                    }
                }
            }

            results.push({
                ...currentPrice,
                quantity: item.quantity,
                nextTierSuggestion
            })
        }

        return NextResponse.json(createSuccessResponse({
            items: results,
            summary: {
                totalPrice: results.reduce((sum, item) => sum + (item.effectivePrice * item.quantity), 0)
            }
        }))

    } catch (error: any) {
        console.error('Evaluate cart error:', error)
        return NextResponse.json(createErrorResponse('Internal server error', 'INTERNAL_ERROR'), { status: 500 })
    }
}
