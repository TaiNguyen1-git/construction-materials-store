/**
 * API: Add materials from estimate to cart
 * POST /api/cart/add-from-estimate
 * 
 * Adds all materials from a saved estimate to the customer's cart
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

interface EstimateMaterial {
    productId?: string
    name: string
    quantity: number
    unit: string
    unitPrice: number
    totalPrice: number
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const { estimateId, customerId, materials, projectName } = body

        if (!customerId) {
            return NextResponse.json(
                { error: { message: 'Vui lòng đăng nhập để thêm vào giỏ hàng' } },
                { status: 401 }
            )
        }

        // Get or create cart for customer
        let cart = await (prisma as any).cart.findUnique({
            where: { customerId },
            include: { items: true }
        })

        if (!cart) {
            cart = await (prisma as any).cart.create({
                data: {
                    customerId,
                    totalItems: 0,
                    subtotal: 0
                },
                include: { items: true }
            })
        }

        // If estimateId provided, fetch materials from saved estimate
        let materialsToAdd: EstimateMaterial[] = materials || []

        if (estimateId && !materials) {
            const estimate = await prisma.savedEstimate.findUnique({
                where: { id: estimateId }
            })

            if (!estimate) {
                return NextResponse.json(
                    { error: { message: 'Không tìm thấy ước tính' } },
                    { status: 404 }
                )
            }

            materialsToAdd = (estimate.materials as any[]) || []
        }

        if (materialsToAdd.length === 0) {
            return NextResponse.json(
                { error: { message: 'Không có vật liệu để thêm vào giỏ' } },
                { status: 400 }
            )
        }

        // Match materials with products in database
        const productsMap = new Map<string, any>()

        // Try to find products by name matching
        for (const material of materialsToAdd) {
            if (material.productId) {
                const product = await prisma.product.findUnique({
                    where: { id: material.productId, isActive: true }
                })
                if (product) {
                    productsMap.set(material.productId, product)
                }
            } else {
                // Search by name similarity
                const products = await prisma.product.findMany({
                    where: {
                        isActive: true,
                        OR: [
                            { name: { contains: material.name, mode: 'insensitive' } },
                            { sku: { contains: material.name, mode: 'insensitive' } }
                        ]
                    },
                    take: 1
                })

                if (products.length > 0) {
                    productsMap.set(material.name, products[0])
                }
            }
        }

        // Add items to cart
        const addedItems: any[] = []
        const notFoundItems: string[] = []
        let totalAdded = 0
        let subtotalAdded = 0

        for (const material of materialsToAdd) {
            const productKey = material.productId || material.name
            const product = productsMap.get(productKey)

            if (!product) {
                notFoundItems.push(material.name)
                continue
            }

            // Check if item already exists in cart
            const existingItem = (cart as any).items.find(
                (item: any) => item.productId === product.id
            )

            if (existingItem) {
                // Update quantity
                const newQuantity = existingItem.quantity + material.quantity
                const newSubtotal = newQuantity * existingItem.unitPrice

                await (prisma as any).cartItem.update({
                    where: { id: existingItem.id },
                    data: {
                        quantity: newQuantity,
                        subtotal: newSubtotal
                    }
                })

                addedItems.push({
                    productId: product.id,
                    name: product.name,
                    quantity: material.quantity,
                    action: 'updated'
                })
            } else {
                // Create new cart item
                const unitPrice = product.price
                const subtotal = material.quantity * unitPrice

                await (prisma as any).cartItem.create({
                    data: {
                        cartId: cart.id,
                        productId: product.id,
                        productName: product.name,
                        quantity: material.quantity,
                        unit: material.unit || product.unit,
                        unitPrice,
                        subtotal,
                        source: 'ESTIMATE',
                        sourceProjectTitle: projectName || `Ước tính ${new Date().toLocaleDateString('vi-VN')}`
                    }
                })

                addedItems.push({
                    productId: product.id,
                    name: product.name,
                    quantity: material.quantity,
                    action: 'added'
                })

                subtotalAdded += subtotal
            }

            totalAdded += material.quantity
        }

        // Update cart totals
        const updatedCart = await (prisma as any).cart.findUnique({
            where: { id: cart.id },
            include: { items: true }
        })

        const newTotalItems = updatedCart?.items.reduce((sum: number, item: any) => sum + item.quantity, 0) || 0
        const newSubtotal = updatedCart?.items.reduce((sum: number, item: any) => sum + item.subtotal, 0) || 0

        await (prisma as any).cart.update({
            where: { id: cart.id },
            data: {
                totalItems: newTotalItems,
                subtotal: newSubtotal
            }
        })

        // Update estimate status if provided
        if (estimateId) {
            await prisma.savedEstimate.update({
                where: { id: estimateId },
                data: {
                    customerId,
                    notes: (await prisma.savedEstimate.findUnique({ where: { id: estimateId } }))?.notes
                        + ` | Đã thêm vào giỏ: ${new Date().toLocaleString('vi-VN')}`
                }
            })
        }

        return NextResponse.json({
            success: true,
            message: `Đã thêm ${addedItems.length} sản phẩm vào giỏ hàng`,
            data: {
                addedItems,
                notFoundItems,
                totalQuantityAdded: totalAdded,
                cartTotals: {
                    totalItems: newTotalItems,
                    subtotal: newSubtotal
                }
            }
        })

    } catch (error) {
        console.error('Error adding estimate to cart:', error)
        return NextResponse.json(
            { error: { message: 'Lỗi khi thêm vào giỏ hàng' } },
            { status: 500 }
        )
    }
}
