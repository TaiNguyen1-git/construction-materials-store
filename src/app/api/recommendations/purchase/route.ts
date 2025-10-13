import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createSuccessResponse, createErrorResponse } from '@/lib/api-types'
import { z } from 'zod'

const purchaseRecommendationSchema = z.object({
  timeframe: z.enum(['WEEK', 'MONTH', 'QUARTER']).default('MONTH'),
  minConfidence: z.string().optional().default('0.7').transform(val => parseFloat(val)),
  priorityType: z.enum(['URGENT', 'LOW_STOCK', 'PREDICTED_DEMAND', 'SEASONAL']).optional(),
  budget: z.number().positive().optional(),
  supplierId: z.string().optional(),
})

// GET /api/recommendations/purchase - Generate purchase recommendations
export async function GET(request: NextRequest) {
  try {
    // Check user role from middleware
    const userRole = request.headers.get('x-user-role')
    if (!['MANAGER', 'EMPLOYEE'].includes(userRole || '')) {
      return NextResponse.json(
        createErrorResponse('Access denied', 'FORBIDDEN'),
        { status: 403 }
      )
    }

    const { searchParams } = new URL(request.url)
    const params = Object.fromEntries(searchParams.entries())
    
    const validation = purchaseRecommendationSchema.safeParse(params)
    if (!validation.success) {
      return NextResponse.json(
        createErrorResponse('Invalid query parameters', 'VALIDATION_ERROR', validation.error.issues),
        { status: 400 }
      )
    }

    const { timeframe, minConfidence, priorityType, budget, supplierId } = validation.data

    // Get recent inventory predictions
    const predictions = await prisma.inventoryPrediction.findMany({
      where: {
        timeframe,
        confidence: { gte: minConfidence },
        isActive: true,
        predictionDate: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Last 7 days
        }
      },
      orderBy: [
        { confidence: 'desc' },
        { recommendedOrder: 'desc' }
      ]
    })

    // Get additional product data separately to avoid type issues
    const productIds = predictions.map(p => p.productId)
    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
      include: {
        category: true,
        inventoryItem: true,
        purchaseItems: {
          include: {
            purchaseOrder: {
              include: {
                supplier: true
              }
            }
          },
          orderBy: {
            purchaseOrder: { orderDate: 'desc' }
          },
          take: 1
        }
      }
    })

    // Create lookup map for products
    const productMap = new Map(products.map(p => [p.id, p]))

    // Process recommendations
    const recommendations = []

    for (const prediction of predictions) {
      const product = productMap.get(prediction.productId)
      if (!product) continue
      
      const inventory = product.inventoryItem
      const lastPurchase = product.purchaseItems[0]

      // Calculate urgency score
      let urgencyScore = 0
      let priority = 'NORMAL'
      const reasons = []

      // Current stock vs minimum
      const currentStock = inventory?.availableQuantity || 0
      const minStock = inventory?.minStockLevel || 0
      
      if (currentStock <= 0) {
        urgencyScore += 100
        priority = 'URGENT'
        reasons.push('Out of stock')
      } else if (currentStock <= minStock) {
        urgencyScore += 80
        priority = 'HIGH'
        reasons.push('Below minimum stock level')
      } else if (currentStock <= minStock * 2) {
        urgencyScore += 40
        reasons.push('Approaching minimum stock level')
      }

      // Predicted demand vs current stock
      const predictedDemand = prediction.predictedDemand
      const stockoutRisk = (predictedDemand - currentStock) / Math.max(1, predictedDemand)
      
      if (stockoutRisk > 0.8) {
        urgencyScore += 60
        reasons.push('High stockout risk based on predicted demand')
      } else if (stockoutRisk > 0.5) {
        urgencyScore += 30
        reasons.push('Moderate stockout risk')
      }

      // Seasonal factors
      const currentMonth = new Date().getMonth()
      const highSeasonMonths = [2, 3, 4, 5, 6, 7] // Mar-Aug construction season
      if (highSeasonMonths.includes(currentMonth)) {
        urgencyScore += 20
        reasons.push('Peak construction season')
      }

      // Skip if no purchase needed
      if ((prediction.recommendedOrder || 0) <= 0 && urgencyScore < 20) {
        continue
      }

      // Filter by priority type if specified
      if (priorityType) {
        if (priorityType === 'URGENT' && priority !== 'URGENT') continue
        if (priorityType === 'LOW_STOCK' && currentStock > minStock) continue
        if (priorityType === 'PREDICTED_DEMAND' && stockoutRisk < 0.3) continue
        if (priorityType === 'SEASONAL' && !highSeasonMonths.includes(currentMonth)) continue
      }

      // Calculate cost estimates
      const lastUnitPrice = lastPurchase?.unitPrice || product.costPrice || product.price * 0.7
      const recommendedQuantity = Math.max(prediction.recommendedOrder || 0, minStock - currentStock + predictedDemand)
      const estimatedCost = recommendedQuantity * (lastUnitPrice || 0)

      // Get supplier information
      const preferredSupplier = lastPurchase?.purchaseOrder.supplier || await getPreferredSupplier(product.id)

      // Filter by supplier if specified
      if (supplierId && preferredSupplier?.id !== supplierId) continue

      recommendations.push({
        productId: product.id,
        productName: product.name,
        category: product.category.name,
        currentStock,
        minStockLevel: minStock,
        predictedDemand,
        recommendedQuantity,
        urgencyScore,
        priority,
        reasons,
        estimatedCost,
        lastUnitPrice,
        supplier: preferredSupplier ? {
          id: preferredSupplier.id,
          name: preferredSupplier.name,
          contactPerson: preferredSupplier.contactPerson,
          email: preferredSupplier.email,
          phone: preferredSupplier.phone
        } : null,
        prediction: {
          confidence: prediction.confidence,
          timeframe: prediction.timeframe,
          factors: prediction.factors
        },
        lastPurchaseDate: lastPurchase?.purchaseOrder.orderDate,
        daysWithoutPurchase: lastPurchase ? 
          Math.floor((Date.now() - lastPurchase.purchaseOrder.orderDate.getTime()) / (1000 * 60 * 60 * 24)) : 
          null
      })
    }

    // Sort by urgency score and confidence
    recommendations.sort((a, b) => {
      if (a.urgencyScore !== b.urgencyScore) {
        return b.urgencyScore - a.urgencyScore
      }
      return b.prediction.confidence - a.prediction.confidence
    })

    // Apply budget constraint if specified
    let filteredRecommendations = recommendations
    if (budget) {
      let totalCost = 0
      filteredRecommendations = []
      
      for (const rec of recommendations) {
        if (totalCost + rec.estimatedCost <= budget) {
          filteredRecommendations.push(rec)
          totalCost += rec.estimatedCost
        } else if (rec.priority === 'URGENT') {
          // Always include urgent items even if over budget
          filteredRecommendations.push(rec)
          totalCost += rec.estimatedCost
        }
      }
    }

    // Group by supplier for easier ordering
    const supplierGroups = new Map()
    filteredRecommendations.forEach(rec => {
      if (rec.supplier) {
        const supplierId = rec.supplier.id
        if (!supplierGroups.has(supplierId)) {
          supplierGroups.set(supplierId, {
            supplier: rec.supplier,
            items: [],
            totalCost: 0
          })
        }
        const group = supplierGroups.get(supplierId)
        group.items.push(rec)
        group.totalCost += rec.estimatedCost
      }
    })

    const response = {
      recommendations: filteredRecommendations,
      summary: {
        totalItems: filteredRecommendations.length,
        totalEstimatedCost: filteredRecommendations.reduce((sum, rec) => sum + rec.estimatedCost, 0),
        urgentItems: filteredRecommendations.filter(rec => rec.priority === 'URGENT').length,
        highPriorityItems: filteredRecommendations.filter(rec => rec.priority === 'HIGH').length,
        uniqueSuppliers: supplierGroups.size,
        withinBudget: budget ? filteredRecommendations.length < recommendations.length : null
      },
      supplierGroups: Array.from(supplierGroups.values()),
      filters: {
        timeframe,
        minConfidence,
        priorityType,
        budget,
        supplierId
      },
      generatedAt: new Date().toISOString()
    }

    return NextResponse.json(
      createSuccessResponse(response, 'Purchase recommendations generated successfully'),
      { status: 200 }
    )

  } catch (error) {
    console.error('Purchase recommendations error:', error)
    return NextResponse.json(
      createErrorResponse('Internal server error', 'INTERNAL_ERROR'),
      { status: 500 }
    )
  }
}

// Helper function to get preferred supplier for a product
async function getPreferredSupplier(productId: string) {
  // Get the most frequently used supplier for this product
  const purchaseHistory = await prisma.purchaseItem.findMany({
    where: { productId },
    include: {
      purchaseOrder: {
        include: { supplier: true }
      }
    },
    orderBy: {
      purchaseOrder: { orderDate: 'desc' }
    },
    take: 10
  })

  if (purchaseHistory.length === 0) {
    // Return any active supplier if no history
    return await prisma.supplier.findFirst({
      where: { isActive: true }
    })
  }

  // Count supplier frequency
  const supplierCounts = new Map()
  purchaseHistory.forEach(item => {
    const supplier = item.purchaseOrder.supplier
    supplierCounts.set(supplier.id, {
      supplier,
      count: (supplierCounts.get(supplier.id)?.count || 0) + 1
    })
  })

  // Return most frequent supplier
  const mostUsed = Array.from(supplierCounts.values())
    .sort((a, b) => b.count - a.count)[0]

  return mostUsed?.supplier || null
}
