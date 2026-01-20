/**
 * API: Smart Procurement Wizard
 * GET /api/procurement/wizard
 * 
 * Returns AI-powered reorder recommendations with:
 * - Products below reorder point
 * - Best supplier suggestions based on ratings
 * - Optimal quantities based on predictions
 * - Cost optimization suggestions
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

interface ReorderRecommendation {
    productId: string
    productName: string
    sku: string
    currentStock: number
    reorderPoint: number
    suggestedQuantity: number
    urgency: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW'
    bestSupplier: {
        id: string
        name: string
        unitPrice: number
        leadTimeDays: number
        rating: number
        totalCost: number
    } | null
    alternativeSuppliers: {
        id: string
        name: string
        unitPrice: number
        leadTimeDays: number
        rating: number
        totalCost: number
    }[]
    prediction?: {
        expectedDemand: number
        confidence: number
        timeframe: string
    }
    savingsOpportunity?: number
}

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const urgencyFilter = searchParams.get('urgency') // CRITICAL, HIGH, MEDIUM, LOW
        const limit = parseInt(searchParams.get('limit') || '20')

        // Get all products with inventory
        const inventoryItems = await prisma.inventoryItem.findMany({
            include: {
                product: {
                    include: {
                        category: true
                    }
                }
            },
            take: limit * 2 // Get more to filter later
        })

        // Filter to products that actually need reorder
        const needsReorder = inventoryItems.filter(
            item => item.availableQuantity <= item.reorderPoint || item.quantity <= item.minStockLevel
        )

        // Get supplier products for these items
        const productIds = needsReorder.map(item => item.productId)

        const supplierProducts = await prisma.supplierProduct.findMany({
            where: {
                productId: { in: productIds },
                isActive: true
            },
            include: {
                supplier: true
            },
            orderBy: [
                { isPreferred: 'desc' },
                { averageRating: 'desc' }
            ]
        })

        // Get predictions for these products
        const predictions = await prisma.inventoryPrediction.findMany({
            where: {
                productId: { in: productIds },
                isActive: true,
                targetDate: { gte: new Date() }
            },
            orderBy: { targetDate: 'asc' }
        })

        // Get supplier delivery ratings
        const supplierIds = [...new Set(supplierProducts.map(sp => sp.supplierId))]
        const deliveryRatings = await prisma.supplierDeliveryRating.findMany({
            where: {
                supplierId: { in: supplierIds }
            },
            orderBy: { ratedAt: 'desc' }
        })

        // Build recommendations
        const recommendations: ReorderRecommendation[] = []

        for (const inventory of needsReorder) {
            const product = inventory.product
            const productSuppliers = supplierProducts.filter(sp => sp.productId === product.id)
            const productPrediction = predictions.find(p => p.productId === product.id)

            // Calculate urgency
            const stockRatio = inventory.availableQuantity / Math.max(inventory.reorderPoint, 1)
            let urgency: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW'
            if (stockRatio <= 0.1) urgency = 'CRITICAL'
            else if (stockRatio <= 0.3) urgency = 'HIGH'
            else if (stockRatio <= 0.6) urgency = 'MEDIUM'
            else urgency = 'LOW'

            // Filter by urgency if specified
            if (urgencyFilter && urgency !== urgencyFilter) continue

            // Calculate suggested quantity
            let suggestedQuantity = inventory.maxStockLevel
                ? inventory.maxStockLevel - inventory.quantity
                : inventory.reorderPoint * 2

            // Adjust based on prediction
            if (productPrediction) {
                suggestedQuantity = Math.max(suggestedQuantity, productPrediction.recommendedOrder || productPrediction.predictedDemand)
            }

            suggestedQuantity = Math.ceil(suggestedQuantity)

            // Find best supplier
            let bestSupplier: ReorderRecommendation['bestSupplier'] = null
            const alternativeSuppliers: ReorderRecommendation['alternativeSuppliers'] = []

            // Score suppliers
            const scoredSuppliers = productSuppliers.map(sp => {
                const supplierRatings = deliveryRatings.filter(dr => dr.supplierId === sp.supplierId)
                const avgRating = supplierRatings.length > 0
                    ? supplierRatings.reduce((sum, r) => sum + r.overallScore, 0) / supplierRatings.length
                    : sp.averageRating

                const totalCost = sp.unitPrice * suggestedQuantity

                // Calculate score (lower is better for price, higher is better for rating)
                // Weighted: 40% price, 40% rating, 20% lead time
                const priceScore = sp.unitPrice / (productSuppliers[0]?.unitPrice || 1)
                const ratingScore = avgRating / 5
                const leadTimeScore = 1 - (sp.leadTimeDays / 30)

                const overallScore = (priceScore * 0.4) + ((1 - ratingScore) * 0.4) + ((1 - leadTimeScore) * 0.2)

                return {
                    id: sp.supplierId,
                    name: sp.supplier.name,
                    unitPrice: sp.unitPrice,
                    leadTimeDays: sp.leadTimeDays,
                    rating: avgRating,
                    totalCost,
                    score: overallScore,
                    isPreferred: sp.isPreferred
                }
            }).sort((a, b) => a.score - b.score)

            if (scoredSuppliers.length > 0) {
                bestSupplier = scoredSuppliers[0]
                alternativeSuppliers.push(...scoredSuppliers.slice(1, 3))
            }

            // Calculate savings opportunity
            let savingsOpportunity = 0
            if (scoredSuppliers.length > 1) {
                const highestCost = Math.max(...scoredSuppliers.map(s => s.totalCost))
                const lowestCost = Math.min(...scoredSuppliers.map(s => s.totalCost))
                savingsOpportunity = highestCost - lowestCost
            }

            recommendations.push({
                productId: product.id,
                productName: product.name,
                sku: product.sku,
                currentStock: inventory.availableQuantity,
                reorderPoint: inventory.reorderPoint,
                suggestedQuantity,
                urgency,
                bestSupplier,
                alternativeSuppliers,
                prediction: productPrediction ? {
                    expectedDemand: productPrediction.predictedDemand,
                    confidence: productPrediction.confidence,
                    timeframe: productPrediction.timeframe
                } : undefined,
                savingsOpportunity
            })
        }

        // Sort by urgency
        const urgencyOrder = { 'CRITICAL': 0, 'HIGH': 1, 'MEDIUM': 2, 'LOW': 3 }
        recommendations.sort((a, b) => urgencyOrder[a.urgency] - urgencyOrder[b.urgency])

        // Calculate summary
        const summary = {
            totalProducts: recommendations.length,
            criticalCount: recommendations.filter(r => r.urgency === 'CRITICAL').length,
            highCount: recommendations.filter(r => r.urgency === 'HIGH').length,
            mediumCount: recommendations.filter(r => r.urgency === 'MEDIUM').length,
            lowCount: recommendations.filter(r => r.urgency === 'LOW').length,
            totalEstimatedCost: recommendations.reduce(
                (sum, r) => sum + (r.bestSupplier?.totalCost || 0), 0
            ),
            potentialSavings: recommendations.reduce(
                (sum, r) => sum + (r.savingsOpportunity || 0), 0
            )
        }

        return NextResponse.json({
            success: true,
            data: {
                recommendations: recommendations.slice(0, limit),
                summary,
                generatedAt: new Date().toISOString()
            }
        })

    } catch (error) {
        console.error('Error generating procurement wizard:', error)
        return NextResponse.json(
            { error: { message: 'Lỗi khi tạo gợi ý nhập hàng' } },
            { status: 500 }
        )
    }
}
