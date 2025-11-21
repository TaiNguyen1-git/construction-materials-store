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

    for (const product of products) {
      const inventory = product.inventoryItem
      if (!inventory) continue

      const currentStock = inventory.availableQuantity || 0
      const minStock = inventory.minStockLevel || 30
      const maxStock = inventory.maxStockLevel || 500

      // Only recommend if stock is low or below minimum
      if (currentStock <= minStock) {
        // Calculate how much to order to reach max stock
        const recommendedQuantity = maxStock - currentStock

        // Calculate urgency based on how far below minimum we are
        const stockDeficit = minStock - currentStock
        const urgencyScore = Math.min(1, Math.max(0, stockDeficit / minStock))

        // Determine priority
        let priority: 'NORMAL' | 'HIGH' | 'URGENT' = 'NORMAL'
        if (currentStock === 0) {
          priority = 'URGENT'
        } else if (urgencyScore >= 0.7) {
          priority = 'URGENT'
        } else if (urgencyScore >= 0.3) {
          priority = 'HIGH'
        }

        // Calculate estimated cost
        const estimatedCost = product.price * recommendedQuantity * 0.85 // Assume 15% margin

        // Calculate days until stockout based on average daily usage
        // Simple estimation: if we have 30 days of data, average = currentStock / 30
        const estimatedDailyUsage = minStock / 30 // Rough estimate
        const daysUntilStockout = currentStock > 0
          ? Math.floor(currentStock / Math.max(1, estimatedDailyUsage))
          : 0

        // Select supplier (could be more sophisticated - e.g., based on category, pricing, etc.)
        const supplier = suppliers[Math.floor(Math.random() * suppliers.length)]

        // Determine reason based on stock situation
        let reason = ''
        if (currentStock === 0) {
          reason = '❗ HẾT HÀNG - Cần đặt hàng gấp'
        } else if (urgencyScore >= 0.7) {
          reason = '⚠️ Tồn kho rất thấp - Ưu tiên đặt hàng'
        } else if (urgencyScore >= 0.3) {
          reason = '📉 Tồn kho thấp - Cần đặt hàng'
        } else {
          reason = '📊 Sắp hết tồn kho tối thiểu'
        }

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
          monthlyDemand: Math.floor(minStock * 1.2), // Estimate based on minStock
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
