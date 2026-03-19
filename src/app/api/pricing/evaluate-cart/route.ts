import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { pricingEngine } from '@/lib/pricing-engine'
import { createSuccessResponse, createErrorResponse } from '@/lib/api-types'
import jwt from 'jsonwebtoken'

/**
 * POST /api/pricing/evaluate-cart
 * Đánh giá giỏ hàng để tính giá theo bậc và gợi ý upsell.
 */

// Extract Auth context (prevent ID spoofing for normal users, allow override for ADMINs)
const getAuthContext = async (request: NextRequest): Promise<{ customerId?: string, role?: string }> => {
    const token = request.headers.get('authorization')?.replace('Bearer ', '') ||
        request.cookies.get('access_token')?.value

    if (!token) return {}

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret') as any
        if (!decoded?.id) return { role: decoded?.role }

        // Look up the customer record for this user
        const customer = await prisma.customer.findFirst({
            where: { userId: decoded.id },
            select: { id: true }
        })

        return { customerId: customer?.id || undefined, role: decoded.role }
    } catch {
        return {}
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const { items } = body // items: Array<{ productId, quantity }>

        const authContext = await getAuthContext(request)
        let customerId = undefined

        if (['ADMIN', 'MANAGER', 'EMPLOYEE'].includes(authContext.role as string)) {
            // ADMIN/EMPLOYEE can evaluate cart on behalf of a specific customer
            customerId = body.customerId || undefined
        } else {
            // CUSTOMER/CONTRACTOR must use their own derived ID.
            // GUEST will just use undefined (correct behavior for guests).
            customerId = authContext.customerId
        }

        if (!items || !Array.isArray(items) || items.length === 0) {
            return NextResponse.json(createErrorResponse('Invalid items', 'VALIDATION_ERROR'), { status: 400 })
        }

        // Validate each item: quantity must be a positive integer, productId must be a non-empty string
        for (const item of items) {
            if (!item.productId || typeof item.productId !== 'string' || item.productId.trim() === '') {
                return NextResponse.json(
                    createErrorResponse('Mã sản phẩm không hợp lệ', 'VALIDATION_ERROR'),
                    { status: 400 }
                )
            }
            if (typeof item.quantity !== 'number' || !Number.isFinite(item.quantity) || item.quantity <= 0) {
                return NextResponse.json(
                    createErrorResponse('Số lượng phải là số dương lớn hơn 0', 'VALIDATION_ERROR'),
                    { status: 400 }
                )
            }
            // Cap max quantity to prevent abuse
            if (item.quantity > 100000) {
                return NextResponse.json(
                    createErrorResponse('Số lượng không được vượt quá 100.000', 'VALIDATION_ERROR'),
                    { status: 400 }
                )
            }
        }

        const results = []
        const suggestions = []

        // Lấy thông tin khách hàng để biết loại khách (hoisted)
        const customer = customerId ? await prisma.customer.findUnique({ where: { id: customerId } }) : null
        const customerType = customer?.customerType || 'REGULAR'

        // Tìm bảng giá đang áp dụng (hoisted)
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

