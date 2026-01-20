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
            where: { customerId: customer.id }
        })

        if (!cart) {
            cart = await prisma.cart.create({
                data: {
                    customerId: customer.id,
                    items: [],
                    totalItems: 0,
                    subtotal: 0
                }
            })
        }

        // Current cart items
        const currentItems = (cart.items as any[]) || []
        let addedCount = 0
        let skippedCount = 0
        let totalAdded = 0

        // Add each material to cart
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

            const finalPrice = isVerified ? price * 0.95 : price // 5% discount for verified

            if (existingIndex >= 0) {
                // Update quantity
                currentItems[existingIndex].quantity += quantity
                currentItems[existingIndex].subtotal = currentItems[existingIndex].quantity * finalPrice
            } else {
                // Add new item
                currentItems.push({
                    productId,
                    productName: name || product.name,
                    quantity,
                    unit: unit || product.unit,
                    unitPrice: finalPrice,
                    originalPrice: price,
                    discountPercent,
                    subtotal: quantity * finalPrice,
                    source: 'BOQ',
                    sourceApplicationId: applicationId,
                    sourceProjectTitle: application.project.title
                })
            }

            addedCount++
            totalAdded += quantity * finalPrice
        }

        // Update cart
        const subtotal = currentItems.reduce((sum: number, item: any) => sum + item.subtotal, 0)
        const totalItems = currentItems.reduce((sum: number, item: any) => sum + item.quantity, 0)

        await prisma.cart.update({
            where: { id: cart.id },
            data: {
                items: currentItems,
                totalItems,
                subtotal
            }
        })

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
