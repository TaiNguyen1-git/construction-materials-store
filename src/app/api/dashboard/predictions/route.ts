/**
 * API: Dashboard Predictions Summary
 * GET - Get AI predictions summary for admin dashboard
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createSuccessResponse, createErrorResponse } from '@/lib/api-types'

// GET /api/dashboard/predictions - Get predictions summary for dashboard
export async function GET(request: NextRequest) {
    try {
        const userRole = request.headers.get('x-user-role')

        if (userRole !== 'MANAGER') {
            return NextResponse.json(createErrorResponse('Unauthorized', 'UNAUTHORIZED'), { status: 401 })
        }

        const now = new Date()
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0)

        // Get all active predictions for this month
        const predictions = await prisma.inventoryPrediction.findMany({
            where: {
                isActive: true,
                timeframe: 'MONTH',
                targetDate: {
                    gte: startOfMonth,
                    lte: endOfMonth
                }
            },
            include: {
                product: {
                    include: {
                        inventoryItem: true
                    }
                }
            },
            orderBy: { predictedDemand: 'desc' }
        })

        // Calculate summary stats
        const totalPredictedDemand = predictions.reduce((sum, p) => sum + p.predictedDemand, 0)
        const avgConfidence = predictions.length > 0
            ? predictions.reduce((sum, p) => sum + p.confidence, 0) / predictions.length
            : 0

        // Find products that need reorder (predicted demand > current stock)
        const needReorder = predictions
            .filter(p => {
                const currentStock = p.product.inventoryItem?.availableQuantity || 0
                return p.predictedDemand > currentStock * 1.2 // 20% buffer
            })
            .slice(0, 10) // Top 10
            .map(p => ({
                productId: p.productId,
                productName: p.product.name,
                currentStock: p.product.inventoryItem?.availableQuantity || 0,
                predictedDemand: Math.round(p.predictedDemand),
                recommendedOrder: Math.round(p.recommendedOrder || 0),
                confidence: Math.round(p.confidence * 100),
                unit: p.product.unit
            }))

        // Get predictions with actual data for accuracy calculation
        const validatedPredictions = await prisma.inventoryPrediction.findMany({
            where: {
                actualDemand: { not: null },
                validatedAt: { not: null }
            },
            orderBy: { validatedAt: 'desc' },
            take: 100
        })

        const avgAccuracy = validatedPredictions.length > 0
            ? validatedPredictions.reduce((sum, p) => sum + (p.accuracy || 0), 0) / validatedPredictions.length
            : null

        // Get top products by predicted demand
        const topProducts = predictions.slice(0, 5).map(p => ({
            productId: p.productId,
            productName: p.product.name,
            predictedDemand: Math.round(p.predictedDemand),
            confidence: Math.round(p.confidence * 100)
        }))

        // Trend data for chart (last 6 months actual + next 3 months predicted)
        const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 6, 1)
        const threeMonthsAhead = new Date(now.getFullYear(), now.getMonth() + 3, 0)

        const historicalData = await prisma.inventoryMovement.groupBy({
            by: ['createdAt'],
            where: {
                movementType: 'OUT',
                createdAt: { gte: sixMonthsAgo }
            },
            _sum: { quantity: true }
        })

        // Group by month for cleaner data
        const monthlyActual: Record<string, number> = {}
        historicalData.forEach(d => {
            const monthKey = `${d.createdAt.getFullYear()}-${String(d.createdAt.getMonth() + 1).padStart(2, '0')}`
            monthlyActual[monthKey] = (monthlyActual[monthKey] || 0) + Math.abs(d._sum.quantity || 0)
        })

        // Build chart data
        const chartData = []
        for (let i = -6; i <= 2; i++) {
            const date = new Date(now.getFullYear(), now.getMonth() + i, 1)
            const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
            const monthName = date.toLocaleDateString('vi-VN', { month: 'short', year: '2-digit' })

            if (i <= 0) {
                // Historical data
                chartData.push({
                    month: monthName,
                    actual: Math.round(monthlyActual[monthKey] || 0),
                    predicted: null,
                    isPast: true
                })
            } else {
                // Future predictions (aggregate all products)
                const futureDate = new Date(now.getFullYear(), now.getMonth() + i, 15)
                const futurePredictions = await prisma.inventoryPrediction.findMany({
                    where: {
                        isActive: true,
                        targetDate: {
                            gte: new Date(futureDate.getFullYear(), futureDate.getMonth(), 1),
                            lt: new Date(futureDate.getFullYear(), futureDate.getMonth() + 1, 1)
                        }
                    }
                })
                const totalPredicted = futurePredictions.reduce((sum, p) => sum + p.predictedDemand, 0)

                chartData.push({
                    month: monthName,
                    actual: null,
                    predicted: Math.round(totalPredicted),
                    isPast: false
                })
            }
        }

        return NextResponse.json(createSuccessResponse({
            summary: {
                totalProducts: predictions.length,
                totalPredictedDemand: Math.round(totalPredictedDemand),
                avgConfidence: Math.round(avgConfidence * 100),
                avgAccuracy: avgAccuracy ? Math.round(avgAccuracy) : null,
                productsNeedingReorder: needReorder.length
            },
            needReorder,
            topProducts,
            chartData,
            lastUpdated: now.toISOString()
        }))

    } catch (error: any) {
        console.error('Predictions API error:', error)
        return NextResponse.json(createErrorResponse('Internal server error', 'INTERNAL_ERROR'), { status: 500 })
    }
}
