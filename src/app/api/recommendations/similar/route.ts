import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createSuccessResponse, createErrorResponse } from '@/lib/api-types'
import { z } from 'zod'

const similarRecommendationSchema = z.object({
    productId: z.string().min(1, 'Product ID is required'),
    limit: z.number().optional().default(6),
})

/**
 * Get similar product recommendations for product detail page
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const validation = similarRecommendationSchema.safeParse(body)

        if (!validation.success) {
            return NextResponse.json(
                createErrorResponse('Invalid request', 'VALIDATION_ERROR', validation.error.issues),
                { status: 400 }
            )
        }

        const { productId, limit } = validation.data

        // Get current product details
        const currentProduct = await prisma.product.findUnique({
            where: { id: productId },
            include: { category: true }
        })

        if (!currentProduct) {
            return NextResponse.json(
                createErrorResponse('Product not found', 'NOT_FOUND'),
                { status: 404 }
            )
        }

        // Find similar products in the same category
        const similarProducts = await getSimilarProducts(currentProduct, limit)

        return NextResponse.json(
            createSuccessResponse(
                {
                    recommendations: similarProducts,
                    count: similarProducts.length
                },
                'Similar products retrieved successfully'
            ),
            { status: 200 }
        )
    } catch (error) {
        console.error('Similar recommendations error:', error)
        return NextResponse.json(
            createErrorResponse('Internal server error', 'INTERNAL_ERROR'),
            { status: 500 }
        )
    }
}

/**
 * Find similar products in the same category
 */
async function getSimilarProducts(currentProduct: any, limit: number) {
    const products = await prisma.product.findMany({
        where: {
            categoryId: currentProduct.categoryId,
            id: { not: currentProduct.id },
            isActive: true
        },
        include: {
            category: true,
            inventoryItem: true,
            productReviews: {
                where: { isPublished: true },
                select: { rating: true }
            },
            orderItems: {
                select: { id: true }
            }
        },
        take: limit * 2 // Get more to sort
    })

    // Sort by popularity (order count) and rating
    const sorted = products
        .map(product => ({
            ...product,
            orderCount: product.orderItems.length,
            avgRating: calculateAverageRating(product.productReviews),
            reviewCount: product.productReviews.length
        }))
        .sort((a, b) => {
            // Sort by order count first
            if (b.orderCount !== a.orderCount) return b.orderCount - a.orderCount
            // Then by rating
            if (b.avgRating !== a.avgRating) return b.avgRating - a.avgRating
            // Then by review count
            return b.reviewCount - a.reviewCount
        })
        .slice(0, limit)

    return sorted.map(product => ({
        id: product.id,
        name: product.name,
        price: product.price,
        unit: product.unit,
        images: product.images,
        category: product.category.name,
        inStock: product.inventoryItem ? product.inventoryItem.availableQuantity > 0 : true,
        availableQuantity: product.inventoryItem?.availableQuantity || 0,
        rating: product.avgRating,
        reviewCount: product.reviewCount,
        reason: 'Sản phẩm tương tự',
        badge: '✨ Tương tự',
        confidence: 0.85
    }))
}

/**
 * Calculate average rating from reviews
 */
function calculateAverageRating(reviews: { rating: number }[]): number {
    if (reviews.length === 0) return 0
    const sum = reviews.reduce((acc, r) => acc + r.rating, 0)
    return Math.round((sum / reviews.length) * 10) / 10 // Round to 1 decimal
}
