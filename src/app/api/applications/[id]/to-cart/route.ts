/**
 * BoQ to Cart API
 * Converts Bill of Quantities from application to shopping cart
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createSuccessResponse, createErrorResponse } from '@/lib/api-types'
import { verifyTokenFromRequest } from '@/lib/auth-middleware-api'

// POST - Add all BoQ materials to cart
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: applicationId } = await params
        const payload = verifyTokenFromRequest(request)

        if (!payload?.userId) {
            return NextResponse.json(createErrorResponse('Vui lòng đăng nhập', 'UNAUTHORIZED'), { status: 401 })
        }

        // Get application with materials
        const application = await prisma.projectApplication.findUnique({
            where: { id: applicationId },
            include: {
                project: {
                    select: { title: true }
                }
            }
        })

        if (!application) {
            return NextResponse.json(createErrorResponse('Không tìm thấy hồ sơ', 'NOT_FOUND'), { status: 404 })
        }

        const materials = application.materials as any[] | null
        if (!materials || materials.length === 0) {
            return NextResponse.json(
                createErrorResponse('Hồ sơ này không có danh sách vật tư', 'VALIDATION_ERROR'),
                { status: 400 }
            )
        }

        // Get customer
        const customer = await prisma.customer.findFirst({
            where: { userId: payload.userId }
        })

        if (!customer) {
            return NextResponse.json(createErrorResponse('Không tìm thấy thông tin khách hàng', 'NOT_FOUND'), { status: 404 })
        }

        // Check if contractor is verified (for 5% discount)
        const contractorProfile = await prisma.contractorProfile.findFirst({
            where: { customerId: customer.id }
        })
        const isVerified = contractorProfile?.isVerified || false
        const discountPercent = isVerified ? 5 : 0

        // Get or create cart
        let cart = await prisma.cart.findFirst({
            where: { customerId: customer.id },
            include: { items: true }
        })

        if (!cart) {
            cart = await prisma.cart.create({
                data: {
                    customerId: customer.id,
                    totalItems: 0,
                    subtotal: 0
                },
                include: { items: true }
            })
        }

        // Current cart items
        const currentItems = [...(cart.items || [])]
        let addedCount = 0
        let skippedCount = 0
        let totalAdded = 0

        // Combine materials into existing items
        for (const material of materials) {
            const { productId, quantity, name, unit, price } = material

            // Check if product exists
            const product = await prisma.product.findUnique({
                where: { id: productId }
            })

            if (!product || !product.isActive) {
                skippedCount++
                continue
            }

            // Check if already in cart
            const existingIndex = currentItems.findIndex((item: any) => item.productId === productId)
            const finalPrice = isVerified ? price * 0.95 : price

            if (existingIndex >= 0) {
                // Update quantity
                currentItems[existingIndex].quantity += quantity
                currentItems[existingIndex].subtotal = currentItems[existingIndex].quantity * finalPrice
            } else {
                // Add new item to array (will be created in DB later)
                currentItems.push({
                    productId,
                    productName: name || product.name,
                    quantity,
                    unit: unit || product.unit,
                    unitPrice: finalPrice,
                    originalPrice: price,
                    discountPercent: discountPercent as any,
                    subtotal: quantity * finalPrice,
                    source: 'BOQ',
                    sourceApplicationId: applicationId,
                    sourceProjectTitle: application.project.title
                } as any)
            }

            addedCount++
            totalAdded += quantity * finalPrice
        }

        // Update cart structure in one transaction
        const subtotal = currentItems.reduce((sum: number, item: any) => sum + item.subtotal, 0)
        const totalItems = currentItems.reduce((sum: number, item: any) => sum + item.quantity, 0)

        await prisma.$transaction([
            // Delete all current items for this cart
            prisma.cartItem.deleteMany({
                where: { cartId: cart.id }
            }),
            // Create all new/updated items
            prisma.cart.update({
                where: { id: cart.id },
                data: {
                    totalItems,
                    subtotal,
                    items: {
                        create: currentItems.map(item => ({
                            productId: item.productId,
                            productName: item.productName,
                            quantity: item.quantity,
                            unit: item.unit,
                            unitPrice: item.unitPrice,
                            originalPrice: item.originalPrice,
                            discountPercent: item.discountPercent,
                            subtotal: item.subtotal,
                            source: item.source,
                            sourceApplicationId: item.sourceApplicationId,
                            sourceProjectTitle: item.sourceProjectTitle
                        }))
                    }
                }
            })
        ])

        return NextResponse.json(
            createSuccessResponse({
                addedCount,
                skippedCount,
                totalAdded,
                discountApplied: discountPercent,
                cartTotal: subtotal,
                cartItemCount: totalItems
            }, `Đã thêm ${addedCount} vật tư vào giỏ hàng${isVerified ? ' (giảm 5% Verified Partner)' : ''}`),
            { status: 200 }
        )
    } catch (error) {
        console.error('BoQ to cart error:', error)
        return NextResponse.json(createErrorResponse('Lỗi thêm vào giỏ hàng', 'SERVER_ERROR'), { status: 500 })
    }
}
