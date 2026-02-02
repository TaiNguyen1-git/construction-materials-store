import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createSuccessResponse, createErrorResponse } from '@/lib/api-types'

// GET /api/supplier/products?supplierId=...
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const supplierId = searchParams.get('supplierId')

        if (!supplierId) {
            return NextResponse.json(
                createErrorResponse('Missing supplierId', 'VALIDATION_ERROR'),
                { status: 400 }
            )
        }

        // Fetch products linked to this supplier
        // We look in the 'Product' model where supplierId matches
        const products = await prisma.product.findMany({
            where: { supplierId },
            include: {
                category: {
                    select: { name: true }
                },
                inventoryItem: true
            },
            orderBy: { updatedAt: 'desc' }
        })

        return NextResponse.json(createSuccessResponse(products))
    } catch (error) {
        console.error('Fetch supplier products error:', error)
        return NextResponse.json(
            createErrorResponse('Failed to fetch products', 'SERVER_ERROR'),
            { status: 500 }
        )
    }
}

// POST /api/supplier/products - Create new product
export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const { supplierId, name, sku, price, categoryId, description, images, availableQuantity } = body

        if (!supplierId || !name || !sku || !price || !categoryId) {
            return NextResponse.json(
                createErrorResponse('Missing required fields', 'VALIDATION_ERROR'),
                { status: 400 }
            )
        }

        // Check if SKU exists
        const existingProduct = await prisma.product.findUnique({
            where: { sku }
        })

        if (existingProduct) {
            return NextResponse.json(
                createErrorResponse('SKU already exists', 'VALIDATION_ERROR'),
                { status: 400 }
            )
        }

        // Create product
        const product = await prisma.product.create({
            data: {
                name,
                sku,
                price: Number(price),
                description,
                images: images || [],
                isActive: true,
                supplier: {
                    connect: { id: supplierId }
                },
                category: {
                    connect: { id: categoryId }
                },
                inventoryItem: {
                    create: {
                        quantity: Number(availableQuantity) || 0,
                        availableQuantity: Number(availableQuantity) || 0,

                    }
                }
            }
        })

        return NextResponse.json(createSuccessResponse(product, 'Tạo sản phẩm thành công'))
    } catch (error) {
        console.error('Create supplier product error:', error)
        return NextResponse.json(
            createErrorResponse('Failed to create product', 'SERVER_ERROR'),
            { status: 500 }
        )
    }
}

// PATCH /api/supplier/products/[id] - Update price or stock
// This is handled by a dynamic route usually, but for simplicity we can use this one with id in body
export async function PATCH(request: NextRequest) {
    try {
        const { id, price, availableQuantity, isActive, images } = await request.json()

        if (!id) {
            return NextResponse.json(
                createErrorResponse('Product ID required', 'VALIDATION_ERROR'),
                { status: 400 }
            )
        }

        const updateData: any = {}
        if (price !== undefined) updateData.price = price
        if (isActive !== undefined) updateData.isActive = isActive
        if (images !== undefined) updateData.images = images

        const product = await prisma.product.update({
            where: { id },
            data: updateData
        })

        // If inventory needs update
        if (availableQuantity !== undefined) {
            await prisma.inventoryItem.upsert({
                where: { productId: id },
                create: {
                    productId: id,
                    availableQuantity,
                    quantity: availableQuantity // Simplification
                },
                update: {
                    availableQuantity,
                    quantity: availableQuantity
                }
            })
        }

        return NextResponse.json(createSuccessResponse(product, 'Cập nhật thành công'))
    } catch (error) {
        console.error('Update supplier product error:', error)
        return NextResponse.json(
            createErrorResponse('Failed to update product', 'SERVER_ERROR'),
            { status: 500 }
        )
    }
}
