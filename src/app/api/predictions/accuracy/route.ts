import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createSuccessResponse, createErrorResponse } from '@/lib/api-types'

// GET /api/predictions/accuracy - Get prediction accuracy statistics
export async function GET(request: NextRequest) {
  try {
    // Get all predictions
    const allPredictions = await prisma.inventoryPrediction.findMany({
      include: {
        product: {
          select: {
            name: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    // Filter validated predictions
    const validatedPredictions = allPredictions.filter(p => p.actualDemand !== null)

    if (validatedPredictions.length === 0) {
      return NextResponse.json(
        createSuccessResponse({
          totalPredictions: allPredictions.length,
          totalValidated: 0,
          averageAccuracy: 0,
          byTimeframe: {
            WEEK: { count: 0, accuracy: 0 },
            MONTH: { count: 0, accuracy: 0 },
            QUARTER: { count: 0, accuracy: 0 }
          },
          byProduct: [],
          recentValidations: []
        }, 'No validated predictions yet'),
        { status: 200 }
      )
    }

    // Calculate average accuracy
    const totalAccuracy = validatedPredictions.reduce((sum, p) => sum + (p.accuracy || 0), 0)
    const averageAccuracy = totalAccuracy / validatedPredictions.length

    // Group by timeframe
    const byTimeframe = {
      WEEK: validatedPredictions.filter(p => p.timeframe === 'WEEK'),
      MONTH: validatedPredictions.filter(p => p.timeframe === 'MONTH'),
      QUARTER: validatedPredictions.filter(p => p.timeframe === 'QUARTER')
    }

    const timeframeStats = {
      WEEK: {
        count: byTimeframe.WEEK.length,
        accuracy: byTimeframe.WEEK.length > 0
          ? byTimeframe.WEEK.reduce((sum, p) => sum + (p.accuracy || 0), 0) / byTimeframe.WEEK.length
          : 0
      },
      MONTH: {
        count: byTimeframe.MONTH.length,
        accuracy: byTimeframe.MONTH.length > 0
          ? byTimeframe.MONTH.reduce((sum, p) => sum + (p.accuracy || 0), 0) / byTimeframe.MONTH.length
          : 0
      },
      QUARTER: {
        count: byTimeframe.QUARTER.length,
        accuracy: byTimeframe.QUARTER.length > 0
          ? byTimeframe.QUARTER.reduce((sum, p) => sum + (p.accuracy || 0), 0) / byTimeframe.QUARTER.length
          : 0
      }
    }

    // Group by product
    const productMap = new Map<string, { 
      productId: string
      productName: string
      predictions: number
      totalAccuracy: number 
    }>()

    validatedPredictions.forEach(p => {
      const existing = productMap.get(p.productId)
      if (existing) {
        existing.predictions++
        existing.totalAccuracy += (p.accuracy || 0)
      } else {
        productMap.set(p.productId, {
          productId: p.productId,
          productName: p.product.name,
          predictions: 1,
          totalAccuracy: p.accuracy || 0
        })
      }
    })

    const byProduct = Array.from(productMap.values())
      .map(p => ({
        productId: p.productId,
        productName: p.productName,
        predictions: p.predictions,
        accuracy: p.totalAccuracy / p.predictions
      }))
      .sort((a, b) => b.predictions - a.predictions)
      .slice(0, 10) // Top 10

    // Recent validations
    const recentValidations = validatedPredictions
      .slice(0, 10)
      .map(p => ({
        id: p.id,
        productName: p.product.name,
        targetDate: p.targetDate.toISOString(),
        predicted: p.predictedDemand,
        actual: p.actualDemand || 0,
        accuracy: p.accuracy || 0,
        timeframe: p.timeframe
      }))

    const stats = {
      totalPredictions: allPredictions.length,
      totalValidated: validatedPredictions.length,
      averageAccuracy,
      byTimeframe: timeframeStats,
      byProduct,
      recentValidations
    }

    return NextResponse.json(
      createSuccessResponse(stats, 'Success'),
      { status: 200 }
    )

  } catch (error) {
    console.error('Prediction accuracy error:', error)
    return NextResponse.json(
      createErrorResponse('Internal server error', 'INTERNAL_ERROR'),
      { status: 500 }
    )
  }
}
