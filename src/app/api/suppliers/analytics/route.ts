/**
 * API: Supplier Analytics Dashboard
 * GET /api/suppliers/analytics
 * 
 * Returns comprehensive analytics comparing suppliers:
 * - Delivery performance metrics
 * - Quality ratings over time
 * - Price competitiveness
 * - Order history statistics
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

interface SupplierAnalytics {
    id: string
    name: string
    contactPerson: string | null
    isActive: boolean
    metrics: {
        totalOrders: number
        completedOrders: number
        averageOrderValue: number
        totalSpent: number
    }
    performance: {
        qualityRating: number
        deliveryRating: number
        responseRating: number
        overallRating: number
        onTimeDeliveryRate: number
        averageLeadTime: number
    }
    pricing: {
        averagePriceLevel: 'LOW' | 'MEDIUM' | 'HIGH'
        priceCompetitiveness: number // 0-100
        productsCount: number
    }
    trend: {
        ratingTrend: 'UP' | 'DOWN' | 'STABLE'
        ordersTrend: 'UP' | 'DOWN' | 'STABLE'
        lastOrderDate: string | null
    }
}

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const supplierId = searchParams.get('supplierId')
        const period = searchParams.get('period') || '30' // days
        const sortBy = searchParams.get('sortBy') || 'overallRating'

        const periodDays = parseInt(period)
        const periodStart = new Date()
        periodStart.setDate(periodStart.getDate() - periodDays)

        // Fetch all active suppliers
        const suppliers = await prisma.supplier.findMany({
            where: supplierId ? { id: supplierId } : { isActive: true },
            include: {
                purchaseOrders: {
                    orderBy: { orderDate: 'desc' }
                },
                supplierProducts: {
                    where: { isActive: true }
                },
                deliveryRatings: {
                    orderBy: { ratedAt: 'desc' }
                }
            }
        })

        // Calculate analytics for each supplier
        const analyticsData: SupplierAnalytics[] = []

        for (const supplier of suppliers) {
            // Order metrics
            const totalOrders = supplier.purchaseOrders.length
            const completedOrders = supplier.purchaseOrders.filter(
                po => po.status === 'RECEIVED'
            ).length
            const totalSpent = supplier.purchaseOrders.reduce(
                (sum, po) => sum + po.netAmount, 0
            )
            const averageOrderValue = totalOrders > 0 ? totalSpent / totalOrders : 0

            // Performance from delivery ratings
            const recentRatings = supplier.deliveryRatings.filter(
                r => r.ratedAt >= periodStart
            )

            const avgQuality = recentRatings.length > 0
                ? recentRatings.reduce((sum, r) => sum + r.qualityRating, 0) / recentRatings.length
                : supplier.rating || 3

            const avgDelivery = recentRatings.length > 0
                ? recentRatings.reduce((sum, r) => sum + r.accuracyRating, 0) / recentRatings.length
                : 3

            const avgResponse = recentRatings.length > 0
                ? recentRatings.reduce((sum, r) => sum + (r.responseHours ? (24 - Math.min(r.responseHours, 24)) / 24 * 5 : 3), 0) / recentRatings.length
                : 3

            const overallRating = recentRatings.length > 0
                ? recentRatings.reduce((sum, r) => sum + r.overallScore, 0) / recentRatings.length
                : (avgQuality + avgDelivery + avgResponse) / 3

            // On-time delivery calculation
            const ordersWithDates = supplier.purchaseOrders.filter(
                po => po.expectedDate && po.receivedDate
            )
            const onTimeOrders = ordersWithDates.filter(
                po => new Date(po.receivedDate!) <= new Date(po.expectedDate!)
            )
            const onTimeDeliveryRate = ordersWithDates.length > 0
                ? (onTimeOrders.length / ordersWithDates.length) * 100
                : 100

            // Average lead time
            const avgLeadTime = supplier.supplierProducts.length > 0
                ? supplier.supplierProducts.reduce((sum, sp) => sum + sp.leadTimeDays, 0) / supplier.supplierProducts.length
                : 7

            // Pricing analysis
            const productsCount = supplier.supplierProducts.length
            const avgPrice = productsCount > 0
                ? supplier.supplierProducts.reduce((sum, sp) => sum + sp.unitPrice, 0) / productsCount
                : 0

            // Compare with other suppliers' prices for same products
            let priceCompetitiveness = 50 // Default middle
            if (productsCount > 0) {
                const productIds = supplier.supplierProducts.map(sp => sp.productId)
                const allSupplierPrices = await prisma.supplierProduct.findMany({
                    where: {
                        productId: { in: productIds },
                        isActive: true
                    }
                })

                // Group by product and calculate price position
                const pricePositions: number[] = []
                for (const sp of supplier.supplierProducts) {
                    const competitors = allSupplierPrices.filter(asp => asp.productId === sp.productId)
                    if (competitors.length > 1) {
                        const sorted = competitors.sort((a, b) => a.unitPrice - b.unitPrice)
                        const position = sorted.findIndex(c => c.supplierId === supplier.id)
                        pricePositions.push(100 - (position / (sorted.length - 1)) * 100)
                    }
                }

                if (pricePositions.length > 0) {
                    priceCompetitiveness = pricePositions.reduce((a, b) => a + b, 0) / pricePositions.length
                }
            }

            const averagePriceLevel = priceCompetitiveness > 66 ? 'LOW' : priceCompetitiveness > 33 ? 'MEDIUM' : 'HIGH'

            // Trend analysis
            const olderRatings = supplier.deliveryRatings.filter(
                r => r.ratedAt < periodStart
            ).slice(0, recentRatings.length || 5)

            const recentAvg = recentRatings.length > 0
                ? recentRatings.reduce((sum, r) => sum + r.overallScore, 0) / recentRatings.length
                : overallRating

            const olderAvg = olderRatings.length > 0
                ? olderRatings.reduce((sum, r) => sum + r.overallScore, 0) / olderRatings.length
                : recentAvg

            let ratingTrend: 'UP' | 'DOWN' | 'STABLE' = 'STABLE'
            if (recentAvg > olderAvg + 0.3) ratingTrend = 'UP'
            else if (recentAvg < olderAvg - 0.3) ratingTrend = 'DOWN'

            const recentOrderCount = supplier.purchaseOrders.filter(
                po => new Date(po.orderDate) >= periodStart
            ).length
            const olderOrderCount = supplier.purchaseOrders.filter(
                po => new Date(po.orderDate) < periodStart &&
                    new Date(po.orderDate) >= new Date(periodStart.getTime() - periodDays * 24 * 60 * 60 * 1000)
            ).length

            let ordersTrend: 'UP' | 'DOWN' | 'STABLE' = 'STABLE'
            if (recentOrderCount > olderOrderCount * 1.2) ordersTrend = 'UP'
            else if (recentOrderCount < olderOrderCount * 0.8) ordersTrend = 'DOWN'

            const lastOrder = supplier.purchaseOrders[0]

            analyticsData.push({
                id: supplier.id,
                name: supplier.name,
                contactPerson: supplier.contactPerson,
                isActive: supplier.isActive,
                metrics: {
                    totalOrders,
                    completedOrders,
                    averageOrderValue: Math.round(averageOrderValue),
                    totalSpent: Math.round(totalSpent)
                },
                performance: {
                    qualityRating: Math.round(avgQuality * 10) / 10,
                    deliveryRating: Math.round(avgDelivery * 10) / 10,
                    responseRating: Math.round(avgResponse * 10) / 10,
                    overallRating: Math.round(overallRating * 10) / 10,
                    onTimeDeliveryRate: Math.round(onTimeDeliveryRate),
                    averageLeadTime: Math.round(avgLeadTime)
                },
                pricing: {
                    averagePriceLevel,
                    priceCompetitiveness: Math.round(priceCompetitiveness),
                    productsCount
                },
                trend: {
                    ratingTrend,
                    ordersTrend,
                    lastOrderDate: lastOrder?.orderDate?.toISOString() || null
                }
            })
        }

        // Sort results
        analyticsData.sort((a, b) => {
            switch (sortBy) {
                case 'overallRating':
                    return b.performance.overallRating - a.performance.overallRating
                case 'totalOrders':
                    return b.metrics.totalOrders - a.metrics.totalOrders
                case 'priceCompetitiveness':
                    return b.pricing.priceCompetitiveness - a.pricing.priceCompetitiveness
                case 'onTimeDelivery':
                    return b.performance.onTimeDeliveryRate - a.performance.onTimeDeliveryRate
                default:
                    return b.performance.overallRating - a.performance.overallRating
            }
        })

        // Calculate overall statistics
        const overallStats = {
            totalSuppliers: analyticsData.length,
            averageRating: analyticsData.length > 0
                ? analyticsData.reduce((sum, s) => sum + s.performance.overallRating, 0) / analyticsData.length
                : 0,
            topPerformers: analyticsData.filter(s => s.performance.overallRating >= 4).length,
            needsAttention: analyticsData.filter(s => s.performance.overallRating < 3).length,
            totalSpent: analyticsData.reduce((sum, s) => sum + s.metrics.totalSpent, 0)
        }

        return NextResponse.json({
            success: true,
            data: {
                suppliers: analyticsData,
                stats: overallStats,
                period: `${periodDays} days`,
                generatedAt: new Date().toISOString()
            }
        })

    } catch (error) {
        console.error('Error generating supplier analytics:', error)
        return NextResponse.json(
            { error: { message: 'Lỗi khi tạo phân tích nhà cung cấp' } },
            { status: 500 }
        )
    }
}
