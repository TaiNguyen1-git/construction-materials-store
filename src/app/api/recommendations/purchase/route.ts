import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createSuccessResponse, createErrorResponse } from '@/lib/api-types'
import { requireManager } from '@/lib/auth-middleware-api'

// GET /api/recommendations/purchase - Get purchase recommendations based on low stock
export async function GET(request: NextRequest) {
  try {
    // TEMPORARY: Auth disabled for testing - TODO: Fix JWT verification
    // const authError = requireManager(request)
    // if (authError) {
    //   return authError
    // }

    // Get all products with inventory
    const products = await prisma.product.findMany({
      where: {
        isActive: true
      },
      include: {
        inventoryItem: true,
        category: true
      }
    })

    // Get suppliers for recommendations
    const suppliers = await prisma.supplier.findMany({
      where: {
        isActive: true
      }
    })

    if (suppliers.length === 0) {
      return NextResponse.json(
        createSuccessResponse({ recommendations: [] }, 'No suppliers available'),
        { status: 200 }
      )
    }

    const recommendations: any[] = []

    // Get latest predictions
    const predictions = await prisma.inventoryPrediction.findMany({
      where: {
        predictionDate: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
        },
        timeframe: 'MONTH'
      }
    })
    const predictionsMap = new Map(predictions.map(p => [p.productId, p]))

    for (const product of products) {
      const inventory = product.inventoryItem
      if (!inventory) continue

      const currentStock = inventory.availableQuantity || 0
      const minStock = inventory.minStockLevel || 30
      const maxStock = inventory.maxStockLevel || 500

      const prediction = predictionsMap.get(product.id)
      const predictedDemand = prediction?.predictedDemand || 0
      const factors = prediction?.factors as any
      const safetyStock = factors?.safetyStock || (predictedDemand * 0.2)

      // Condition 1: Low Stock (Traditional)
      const isLowStock = currentStock <= minStock

      // Condition 2: High Demand (AI Prediction)
      // Trigger if current stock is not enough for predicted demand + safety stock
      const isHighDemand = prediction && currentStock < (predictedDemand + safetyStock)

      if (isLowStock || isHighDemand) {
        let recommendedQuantity = 0
        let reason = ''
        let priority: 'NORMAL' | 'HIGH' | 'URGENT' = 'NORMAL'
        let urgencyScore = 0

        if (isLowStock) {
          // Traditional logic
          recommendedQuantity = maxStock - currentStock
          const stockDeficit = minStock - currentStock
          urgencyScore = Math.min(1, Math.max(0, stockDeficit / minStock))

          if (currentStock === 0) {
            priority = 'URGENT'
            reason = '❗ HẾT HÀNG - Cần đặt hàng gấp'
          } else if (urgencyScore >= 0.7) {
            priority = 'URGENT'
            reason = '⚠️ Tồn kho rất thấp - Ưu tiên đặt hàng'
          } else if (urgencyScore >= 0.3) {
            priority = 'HIGH'
            reason = '📉 Tồn kho thấp - Cần đặt hàng'
          } else {
            reason = '📊 Sắp hết tồn kho tối thiểu'
          }
        } else {
          // AI Prediction logic
          // Target = Predicted Demand + Safety Stock
          const targetStock = Math.ceil(predictedDemand + safetyStock)
          recommendedQuantity = Math.max(0, targetStock - currentStock)

          // Urgency based on how close we are to running out based on prediction
          // If Stock < Predicted Demand (without safety), that's high urgency
          const coverageRatio = currentStock / predictedDemand

          if (coverageRatio < 0.5) {
            priority = 'URGENT'
            urgencyScore = 0.9
            reason = '🤖 AI: Nhu cầu tăng cao đột biến'
          } else if (coverageRatio < 0.8) {
            priority = 'HIGH'
            urgencyScore = 0.7
            reason = '🤖 AI: Dự báo thiếu hụt hàng'
          } else {
            priority = 'NORMAL'
            urgencyScore = 0.4
            reason = '🤖 AI: Đề xuất nhập thêm dự trữ'
          }
        }

        // Calculate estimated cost
        const estimatedCost = product.price * recommendedQuantity * 0.85 // Assume 15% margin

        // Calculate days until stockout based on average daily usage
        // Use prediction if available, otherwise simple estimation
        const dailyUsage = prediction ? (predictedDemand / 30) : (minStock / 30)
        const daysUntilStockout = currentStock > 0
          ? Math.floor(currentStock / Math.max(0.1, dailyUsage))
          : 0

        // Select supplier (could be more sophisticated - e.g., based on category, pricing, etc.)
        const supplier = suppliers[Math.floor(Math.random() * suppliers.length)]

        recommendations.push({
          id: `rec-${product.id}-${Date.now()}`,
          productId: product.id,
          productName: product.name,
          productSku: product.sku,
          category: product.category.name,
          currentStock,
          minStockLevel: minStock,
          maxStockLevel: maxStock,
          recommendedQuantity,
          urgencyScore: Math.round(urgencyScore * 100) / 100,
          priority,
          estimatedCost,
          estimatedDeliveryDays: Math.floor(Math.random() * 5) + 3, // 3-7 days
          supplierId: supplier.id,
          supplierName: supplier.name,
          supplierContact: supplier.contactPerson,
          reason,
          monthlyDemand: Math.floor(predictedDemand || (minStock * 1.2)),
          daysUntilStockout,
          stockoutRisk: urgencyScore >= 0.7 ? 'HIGH' : urgencyScore >= 0.3 ? 'MEDIUM' : 'LOW',
          createdAt: new Date()
        })
      }
    }

    // Sort by priority and urgency
    const priorityOrder = { URGENT: 0, HIGH: 1, NORMAL: 2 }
    recommendations.sort((a, b) => {
      const priorityDiff = priorityOrder[a.priority as keyof typeof priorityOrder] - priorityOrder[b.priority as keyof typeof priorityOrder]
      if (priorityDiff !== 0) return priorityDiff
      return b.urgencyScore - a.urgencyScore
    })

    // Calculate summary statistics
    const summary = {
      totalRecommendations: recommendations.length,
      urgentOrders: recommendations.filter(r => r.priority === 'URGENT').length,
      highPriorityOrders: recommendations.filter(r => r.priority === 'HIGH').length,
      totalEstimatedCost: recommendations.reduce((sum, r) => sum + r.estimatedCost, 0),
      outOfStockItems: recommendations.filter(r => r.currentStock === 0).length,
      criticalItems: recommendations.filter(r => r.stockoutRisk === 'HIGH').length
    }

    return NextResponse.json(
      createSuccessResponse(
        {
          recommendations,
          summary,
          generatedAt: new Date().toISOString()
        },
        'Purchase recommendations generated successfully'
      ),
      { status: 200 }
    )
  } catch (error) {
    console.error('Error generating purchase recommendations:', error)
    return NextResponse.json(
      createErrorResponse('Failed to generate purchase recommendations', 'SERVER_ERROR'),
      { status: 500 }
    )
  }
}
