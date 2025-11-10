import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createSuccessResponse, createErrorResponse } from '@/lib/api-types'
import { requireEmployee, requireManager } from '@/lib/auth-middleware-api'
import { z } from 'zod'
import { mlPredictionService } from '@/lib/ml-prediction'

const predictionQuerySchema = z.object({
  productId: z.string().optional(),
  timeframe: z.enum(['WEEK', 'MONTH', 'QUARTER']).default('MONTH'),
  includeSeasonality: z.string().optional().transform(val => val !== 'false'),
  minConfidence: z.string().optional().default('0.7').transform(val => parseFloat(val)),
  method: z.enum(['STATISTICAL', 'PROPHET_ML', 'AUTO']).default('AUTO'),
})

// Prophet ML Prediction (Advanced)
async function predictWithProphetML(
  productId: string,
  timeframe: 'WEEK' | 'MONTH' | 'QUARTER'
): Promise<{
  predictedDemand: number;
  confidence: number;
  factors: any;
  recommendedOrder: number;
  method: string;
} | null> {
  try {
    // Check if model exists
    const hasModel = await mlPredictionService.hasTrainedModel(productId)
    
    if (!hasModel) {
      console.log(`⚠️  No Prophet model for ${productId}, falling back to statistical`)
      return null
    }

    // Make prediction
    const prediction = await mlPredictionService.predict(productId, timeframe)
    
    if (!prediction) {
      return null
    }

    // Get current inventory
    const inventory = await prisma.inventoryItem.findUnique({
      where: { productId }
    })

    // Calculate recommended order
    const currentStock = inventory?.availableQuantity || 0
    const safetyStock = prediction.predictedDemand * 0.2
    const recommendedOrder = Math.max(0, prediction.predictedDemand + safetyStock - currentStock)

    return {
      predictedDemand: prediction.predictedDemand,
      confidence: prediction.confidence,
      factors: {
        ...prediction.factors,
        currentStock,
        safetyStock: Math.round(safetyStock * 100) / 100,
        method: 'PROPHET_ML'
      },
      recommendedOrder: Math.round(recommendedOrder * 100) / 100,
      method: 'PROPHET_ML'
    }
  } catch (error) {
    console.error(`❌ Prophet prediction error for ${productId}:`, error)
    return null
  }
}

// Statistical Prediction (Original - Linear Regression)
async function predictInventoryDemand(
  productId: string, 
  timeframe: string, 
  includeSeasonality: boolean
): Promise<{
  predictedDemand: number;
  confidence: number;
  factors: any;
  recommendedOrder: number;
}> {
  // Get historical sales data
  const endDate = new Date()
  const startDate = new Date()
  
  // Look back further for better prediction
  switch (timeframe) {
    case 'WEEK':
      startDate.setDate(endDate.getDate() - 84) // 12 weeks
      break
    case 'MONTH':
      startDate.setMonth(endDate.getMonth() - 12) // 12 months
      break
    case 'QUARTER':
      startDate.setMonth(endDate.getMonth() - 24) // 24 months
      break
  }

  // Get historical order data
  const historicalOrders = await prisma.orderItem.findMany({
    where: {
      productId,
      order: {
        createdAt: {
          gte: startDate,
          lte: endDate
        },
        status: { not: 'CANCELLED' }
      }
    },
    include: {
      order: true
    },
    orderBy: {
      order: { createdAt: 'asc' }
    }
  })

  // Get current inventory
  const inventory = await prisma.inventoryItem.findUnique({
    where: { productId }
  })

  // Calculate base demand from historical data
  let totalDemand = 0
  const monthlyDemand = new Map<string, number>()
  
  historicalOrders.forEach(item => {
    totalDemand += item.quantity
    const monthKey = item.order.createdAt.toISOString().substring(0, 7) // YYYY-MM
    monthlyDemand.set(monthKey, (monthlyDemand.get(monthKey) || 0) + item.quantity)
  })

  const averageMonthlyDemand = totalDemand / Math.max(1, monthlyDemand.size)
  
  // Calculate trend (simple linear regression on monthly data)
  const months = Array.from(monthlyDemand.entries()).sort((a, b) => a[0].localeCompare(b[0]))
  let trend = 0
  if (months.length > 2) {
    const n = months.length
    const sumX = n * (n - 1) / 2
    const sumY = months.reduce((sum, [, demand]) => sum + demand, 0)
    const sumXY = months.reduce((sum, [, demand], index) => sum + index * demand, 0)
    const sumX2 = n * (n - 1) * (2 * n - 1) / 6
    
    const denominator = n * sumX2 - sumX * sumX
    trend = denominator !== 0 ? (n * sumXY - sumX * sumY) / denominator : 0
  }

  // Seasonal factors (mock - in production would use more sophisticated analysis)
  const currentMonth = new Date().getMonth()
  const seasonalFactors = [
    0.8, 0.85, 1.1, 1.2, 1.3, 1.25, // Jan-Jun (winter/spring construction season)
    1.4, 1.35, 1.2, 1.1, 0.9, 0.8   // Jul-Dec (summer peak, winter decline)
  ]
  const seasonalMultiplier = includeSeasonality ? seasonalFactors[currentMonth] : 1.0

  // Calculate prediction based on timeframe
  let basePrediction = averageMonthlyDemand
  if (timeframe === 'WEEK') {
    basePrediction = averageMonthlyDemand / 4.33 // Average weeks per month
  } else if (timeframe === 'QUARTER') {
    basePrediction = averageMonthlyDemand * 3
  }

  // Apply trend and seasonality
  const predictedDemand = Math.max(0, basePrediction * seasonalMultiplier + trend)
  
  // Calculate confidence based on data quality
  const dataPoints = historicalOrders.length
  const variability = calculateVariability(Array.from(monthlyDemand.values()))
  let confidence = Math.min(0.95, Math.max(0.3, 
    (dataPoints / 50) * 0.4 + // More data = higher confidence
    (1 - variability) * 0.4 + // Less variability = higher confidence
    0.2 // Base confidence
  ))

  // Calculate recommended order quantity
  const currentStock = inventory?.availableQuantity || 0
  const safetyStock = predictedDemand * 0.2 // 20% safety stock
  const recommendedOrder = Math.max(0, predictedDemand + safetyStock - currentStock)

  return {
    predictedDemand: Math.round(predictedDemand * 100) / 100,
    confidence: Math.round(confidence * 100) / 100,
    factors: {
      historicalAverage: Math.round(averageMonthlyDemand * 100) / 100,
      trend: Math.round(trend * 100) / 100,
      seasonalMultiplier: Math.round(seasonalMultiplier * 100) / 100,
      dataPoints,
      variability: Math.round(variability * 100) / 100,
      currentStock,
      safetyStock: Math.round(safetyStock * 100) / 100
    },
    recommendedOrder: Math.round(recommendedOrder * 100) / 100
  }
}

function calculateVariability(values: number[]): number {
  if (values.length <= 1) return 0
  
  const mean = values.reduce((sum, val) => sum + val, 0) / values.length
  const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length
  const standardDeviation = Math.sqrt(variance)
  
  return mean > 0 ? standardDeviation / mean : 0 // Coefficient of variation
}

// GET /api/predictions/inventory - Get inventory predictions
export async function GET(request: NextRequest) {
  try {
    // Verify employee or manager role
    const authError = requireEmployee(request)
    if (authError) {
      return authError
    }

    const { searchParams } = new URL(request.url)
    const params = Object.fromEntries(searchParams.entries())
    
    const validation = predictionQuerySchema.safeParse(params)
    if (!validation.success) {
      return NextResponse.json(
        createErrorResponse('Invalid query parameters', 'VALIDATION_ERROR', validation.error.issues),
        { status: 400 }
      )
    }

    const { productId, timeframe, includeSeasonality, minConfidence, method } = validation.data

    let predictions: any[] = []

    // First, try to get existing predictions from DB
    const existingPredictions = await prisma.inventoryPrediction.findMany({
      where: {
        ...(productId && { productId }),
        timeframe,
        predictionDate: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
        }
      },
      include: {
        product: {
          include: {
            category: true,
            inventoryItem: true
          }
        }
      },
      orderBy: {
        predictionDate: 'desc'
      }
    })

    if (existingPredictions.length > 0) {
      // Return existing predictions
      predictions = existingPredictions.map(pred => ({
        productId: pred.product.id,
        productName: pred.product.name,
        category: pred.product.category.name,
        currentStock: pred.product.inventoryItem?.availableQuantity || 0,
        minStockLevel: pred.product.inventoryItem?.minStockLevel || 0,
        predictedDemand: pred.predictedDemand,
        confidence: pred.confidence,
        factors: pred.factors,
        recommendedOrder: pred.recommendedOrder,
        method: pred.method || 'STATISTICAL'
      }))
      
      // Filter by min confidence
      predictions = predictions.filter(p => p.confidence >= minConfidence)
    } else {
      // Generate new predictions if none exist
      // Helper function to get prediction using selected method
      async function getPrediction(prodId: string, tf: typeof timeframe, includeSeas: boolean) {
        let prediction: any = null
        let usedMethod = method

        // AUTO: Try Prophet first, fallback to Statistical
        if (method === 'AUTO' || method === 'PROPHET_ML') {
          prediction = await predictWithProphetML(prodId, tf)
          if (prediction) {
            usedMethod = 'PROPHET_ML'
          } else if (method === 'PROPHET_ML') {
            throw new Error('Prophet model not available for this product')
          }
        }

        // Fallback to Statistical or if explicitly requested
        if (!prediction && (method === 'AUTO' || method === 'STATISTICAL')) {
          prediction = await predictInventoryDemand(prodId, tf, includeSeas)
          usedMethod = 'STATISTICAL'
        }

        return { ...prediction, method: usedMethod }
      }

    if (productId) {
      // Single product prediction
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

      const prediction = await getPrediction(productId, timeframe, includeSeasonality)
      
      predictions = [{
        productId: product.id,
        productName: product.name,
        category: product.category.name,
        currentStock: product.inventoryItem?.availableQuantity || 0,
        minStockLevel: product.inventoryItem?.minStockLevel || 0,
        ...prediction
      }]
    } else {
      // All products prediction
      const products = await prisma.product.findMany({
        where: { isActive: true },
        include: {
          category: true,
          inventoryItem: true
        },
        take: 50 // Limit for performance
      })

      const predictionPromises = products.map(async (product) => {
        try {
          const prediction = await getPrediction(product.id, timeframe, includeSeasonality)
          return {
            productId: product.id,
            productName: product.name,
            category: product.category.name,
            currentStock: product.inventoryItem?.availableQuantity || 0,
            minStockLevel: product.inventoryItem?.minStockLevel || 0,
            ...prediction
          }
        } catch (error) {
          console.error(`Prediction error for product ${product.id}:`, error)
          return null
        }
      })

      const allPredictions = await Promise.all(predictionPromises)
      predictions = allPredictions
        .filter(p => p !== null && p.confidence >= minConfidence)
        .sort((a, b) => (b?.confidence || 0) - (a?.confidence || 0))
    }
    } // Close else block

    // Note: includeOutOfStock filtering would be implemented here if needed

    // Don't store predictions again if we just loaded them from DB
    // Only store if we generated new ones (existingPredictions was empty)

    // Count methods used
    const methodCounts = predictions.reduce((acc, p) => {
      const m = p.method || 'UNKNOWN'
      acc[m] = (acc[m] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    const response = {
      predictions,
      metadata: {
        timeframe,
        includeSeasonality,
        minConfidence,
        requestedMethod: method,
        methodsUsed: methodCounts,
        totalProducts: predictions.length,
        generatedAt: new Date().toISOString()
      },
      summary: {
        totalRecommendedOrders: predictions.reduce((sum, p) => sum + p.recommendedOrder, 0),
        highConfidencePredictions: predictions.filter(p => p.confidence >= 0.8).length,
        lowStockAlerts: predictions.filter(p => p.currentStock <= p.minStockLevel).length
      }
    }

    return NextResponse.json(
      createSuccessResponse(response, 'Inventory predictions generated successfully'),
      { status: 200 }
    )

  } catch (error) {
    console.error('Inventory predictions error:', error instanceof Error ? error.message : String(error))
    return NextResponse.json(
      createErrorResponse('Internal server error', 'INTERNAL_ERROR'),
      { status: 500 }
    )
  }
}

// POST /api/predictions/inventory - Trigger prediction update
export async function POST(request: NextRequest) {
  try {
    // Verify authentication and manager role
    const authError = requireManager(request)
    if (authError) return authError

    const body = await request.json()
    const { productIds, timeframe = 'MONTH', includeSeasonality = true } = body

    // Validate product IDs if provided
    if (productIds && !Array.isArray(productIds)) {
      return NextResponse.json(
        createErrorResponse('Product IDs must be an array', 'VALIDATION_ERROR'),
        { status: 400 }
      )
    }

    // Get products to update
    const where = productIds ? { id: { in: productIds } } : { isActive: true }
    const products = await prisma.product.findMany({
      where,
      include: {
        category: true,
        inventoryItem: true
      }
    })

    const results = []
    for (const product of products) {
      try {
        const prediction = await predictInventoryDemand(product.id, timeframe, includeSeasonality)
        
        // Create prediction (delete existing if any for today)
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        
        await prisma.inventoryPrediction.deleteMany({
          where: {
            productId: product.id,
            predictionDate: {
              gte: today,
              lt: new Date(today.getTime() + 24 * 60 * 60 * 1000)
            },
            timeframe
          }
        })
        
        await prisma.inventoryPrediction.create({
          data: {
            productId: product.id,
            predictionDate: new Date(),
            timeframe,
            predictedDemand: prediction.predictedDemand,
            confidence: prediction.confidence,
            factors: prediction.factors,
            recommendedOrder: prediction.recommendedOrder
          }
        })

        results.push({
          productId: product.id,
          productName: product.name,
          success: true,
          ...prediction
        })
      } catch (error) {
        console.error(`Prediction update error for product ${product.id}:`, error)
        results.push({
          productId: product.id,
          productName: product.name,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        })
      }
    }

    return NextResponse.json(
      createSuccessResponse(results, 'Prediction update completed'),
      { status: 200 }
    )

  } catch (error) {
    console.error('Update predictions error:', error)
    return NextResponse.json(
      createErrorResponse('Internal server error', 'INTERNAL_ERROR'),
      { status: 500 }
    )
  }
}
