import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getRecommendedPrice, getBatchPriceRecommendations, type ProductPricingData } from '@/lib/ml-services'
import { createSuccessResponse, createErrorResponse } from '@/lib/api-types'

/**
 * GET /api/products/pricing?productId=xxx
 * Get dynamic price recommendation for a product
 */
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const productId = searchParams.get('productId')

        if (!productId) {
            return NextResponse.json(
                createErrorResponse('Product ID required', 'VALIDATION_ERROR'),
                { status: 400 }
            )
        }

        // Fetch product data
        const product = await prisma.product.findUnique({
            where: { id: productId },
            include: {
                category: true,
                inventoryItem: true
            }
        })

        if (!product) {
            return NextResponse.json(
                createErrorResponse('Product not found', 'NOT_FOUND'),
                { status: 404 }
            )
        }

        // Calculate demand index from recent orders
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
        const sixtyDaysAgo = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000)

        const recentOrderItems = await prisma.orderItem.count({
            where: {
                productId,
                order: { createdAt: { gte: thirtyDaysAgo } }
            }
        })

        const previousOrderItems = await prisma.orderItem.count({
            where: {
                productId,
                order: { createdAt: { gte: sixtyDaysAgo, lt: thirtyDaysAgo } }
            }
        })

        const demandIndex = previousOrderItems > 0 ? recentOrderItems / previousOrderItems : 1.0

        const pricingData: ProductPricingData = {
            productId: product.id,
            productName: product.name,
            basePrice: product.price, // Use 'price' field
            cost: product.costPrice || product.price * 0.7,
            category: product.category?.name,
            currentStock: product.inventoryItem?.quantity || 100,
            avgDailySales: recentOrderItems / 30,
            demandIndex,
            competitorPrice: undefined // Would come from market data
        }

        const recommendation = await getRecommendedPrice(pricingData)

        if (!recommendation) {
            // Simple fallback pricing
            const fallback = calculateSimplePricing(pricingData)
            return NextResponse.json(createSuccessResponse({
                ...fallback,
                source: 'fallback'
            }))
        }

        return NextResponse.json(createSuccessResponse({
            ...recommendation,
            source: 'ml-service'
        }))

    } catch (error) {
        console.error('Pricing recommendation error:', error)
        return NextResponse.json(
            createErrorResponse('Pricing failed', 'INTERNAL_ERROR'),
            { status: 500 }
        )
    }
}

/**
 * POST /api/products/pricing
 * Get batch price recommendations
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const { products, productIds } = body

        // If productIds provided, fetch from database
        if (productIds && Array.isArray(productIds)) {
            const dbProducts = await prisma.product.findMany({
                where: { id: { in: productIds } },
                include: {
                    category: true,
                    inventoryItem: true
                }
            })

            const pricingProducts: ProductPricingData[] = dbProducts.map(p => ({
                productId: p.id,
                productName: p.name,
                basePrice: p.price,
                cost: p.costPrice || p.price * 0.7,
                category: p.category?.name,
                currentStock: p.inventoryItem?.quantity || 100,
                avgDailySales: 5,
                demandIndex: 1.0
            }))

            const result = await getBatchPriceRecommendations(pricingProducts)
            return NextResponse.json(createSuccessResponse(result))
        }

        if (products && Array.isArray(products)) {
            const result = await getBatchPriceRecommendations(products)
            return NextResponse.json(createSuccessResponse(result))
        }

        return NextResponse.json(
            createErrorResponse('Missing products or productIds', 'VALIDATION_ERROR'),
            { status: 400 }
        )

    } catch (error) {
        console.error('Batch pricing error:', error)
        return NextResponse.json(
            createErrorResponse('Batch pricing failed', 'INTERNAL_ERROR'),
            { status: 500 }
        )
    }
}

/**
 * Simple fallback pricing when ML service unavailable
 */
function calculateSimplePricing(data: ProductPricingData) {
    let multiplier = 1.0

    // Inventory factor
    const daysOfStock = data.currentStock && data.avgDailySales
        ? data.currentStock / (data.avgDailySales || 1)
        : 30

    if (daysOfStock < 7) multiplier *= 1.08
    else if (daysOfStock > 60) multiplier *= 0.95

    // Demand factor
    if (data.demandIndex && data.demandIndex > 1.2) multiplier *= 1.05
    else if (data.demandIndex && data.demandIndex < 0.8) multiplier *= 0.97

    const recommendedPrice = Math.round(data.basePrice * multiplier / 1000) * 1000
    const priceChange = ((recommendedPrice - data.basePrice) / data.basePrice * 100).toFixed(1)

    return {
        productId: data.productId,
        productName: data.productName,
        currentPrice: data.basePrice,
        recommendedPrice,
        priceChange: `${parseFloat(priceChange) >= 0 ? '+' : ''}${priceChange}%`,
        factors: {
            demand: { value: data.demandIndex || 1.0, reason: 'Demand index' },
            inventory: { value: daysOfStock, reason: `${daysOfStock.toFixed(0)} days of stock` },
            combined: multiplier
        },
        projections: {
            confidence: 0.6
        }
    }
}
