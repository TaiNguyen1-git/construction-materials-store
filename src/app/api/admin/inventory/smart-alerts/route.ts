import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth, verifyTokenFromRequest } from '@/lib/auth-middleware-api'

interface InventoryAnalysis {
    productId: string
    productName: string
    sku: string
    categoryName: string
    currentStock: number
    minStockLevel: number
    reorderPoint: number
    avgDailySales: number
    daysUntilStockout: number
    suggestedOrderQty: number
    urgencyLevel: 'CRITICAL' | 'WARNING' | 'NORMAL'
    lastRestockDate?: string
    estimatedStockoutDate?: string
}

// GET /api/admin/inventory/smart-alerts - Get smart inventory alerts
export async function GET(request: NextRequest) {
    try {
        // Check authorization
        const user = verifyTokenFromRequest(request)
        if (!user || !['MANAGER', 'EMPLOYEE'].includes(user.role)) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { searchParams } = new URL(request.url)
        const daysAhead = parseInt(searchParams.get('daysAhead') || '7')
        const includeNormal = searchParams.get('includeNormal') === 'true'

        // Get all inventory items with product info
        const inventoryItems = await prisma.inventoryItem.findMany({
            include: {
                product: {
                    include: {
                        category: true
                    }
                }
            }
        })

        // Get sales data from last 30 days to calculate average daily sales
        const thirtyDaysAgo = new Date()
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

        const recentOrders = await prisma.orderItem.findMany({
            where: {
                order: {
                    createdAt: { gte: thirtyDaysAgo },
                    status: { in: ['CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED'] }
                }
            },
            select: {
                productId: true,
                quantity: true
            }
        })

        // Calculate average daily sales per product
        const salesByProduct: Record<string, number> = {}
        for (const item of recentOrders) {
            salesByProduct[item.productId] = (salesByProduct[item.productId] || 0) + item.quantity
        }

        // Get last restock dates
        const lastRestocks = await prisma.inventoryMovement.findMany({
            where: {
                movementType: { in: ['IN', 'ADJUSTMENT'] },
                quantity: { gt: 0 }
            },
            orderBy: { createdAt: 'desc' },
            distinct: ['productId'],
            select: {
                productId: true,
                createdAt: true
            }
        })

        const restockByProduct: Record<string, Date> = {}
        for (const restock of lastRestocks) {
            restockByProduct[restock.productId] = restock.createdAt
        }

        // Analyze each inventory item
        const analyses: InventoryAnalysis[] = []

        for (const item of inventoryItems) {
            const totalSales = salesByProduct[item.productId] || 0
            const avgDailySales = totalSales / 30

            // Calculate days until stockout
            let daysUntilStockout = Infinity
            if (avgDailySales > 0) {
                daysUntilStockout = Math.floor(item.availableQuantity / avgDailySales)
            }

            // Determine urgency level
            let urgencyLevel: 'CRITICAL' | 'WARNING' | 'NORMAL' = 'NORMAL'
            if (item.availableQuantity <= item.minStockLevel || daysUntilStockout <= 3) {
                urgencyLevel = 'CRITICAL'
            } else if (item.availableQuantity <= item.reorderPoint || daysUntilStockout <= daysAhead) {
                urgencyLevel = 'WARNING'
            }

            // Calculate suggested order quantity
            // Formula: (target_days * avg_daily_sales) + safety_stock - current_stock
            const targetDays = 30 // Keep 30 days of stock
            const safetyStock = item.minStockLevel
            const suggestedOrderQty = Math.max(
                0,
                Math.ceil((targetDays * avgDailySales) + safetyStock - item.availableQuantity)
            )

            // Calculate estimated stockout date
            let estimatedStockoutDate: string | undefined
            if (daysUntilStockout !== Infinity && daysUntilStockout > 0) {
                const stockoutDate = new Date()
                stockoutDate.setDate(stockoutDate.getDate() + daysUntilStockout)
                estimatedStockoutDate = stockoutDate.toISOString()
            }

            // Only include if not normal OR if includeNormal is true
            if (urgencyLevel !== 'NORMAL' || includeNormal) {
                analyses.push({
                    productId: item.productId,
                    productName: item.product.name,
                    sku: item.product.sku,
                    categoryName: item.product.category?.name || 'Không phân loại',
                    currentStock: item.availableQuantity,
                    minStockLevel: item.minStockLevel,
                    reorderPoint: item.reorderPoint,
                    avgDailySales: Math.round(avgDailySales * 100) / 100,
                    daysUntilStockout: daysUntilStockout === Infinity ? -1 : daysUntilStockout,
                    suggestedOrderQty,
                    urgencyLevel,
                    lastRestockDate: restockByProduct[item.productId]?.toISOString(),
                    estimatedStockoutDate
                })
            }
        }

        // Sort by urgency (CRITICAL first, then WARNING, then by days until stockout)
        analyses.sort((a, b) => {
            const urgencyOrder = { CRITICAL: 0, WARNING: 1, NORMAL: 2 }
            if (urgencyOrder[a.urgencyLevel] !== urgencyOrder[b.urgencyLevel]) {
                return urgencyOrder[a.urgencyLevel] - urgencyOrder[b.urgencyLevel]
            }
            // If same urgency, sort by days until stockout (ascending)
            const aDays = a.daysUntilStockout === -1 ? Infinity : a.daysUntilStockout
            const bDays = b.daysUntilStockout === -1 ? Infinity : b.daysUntilStockout
            return aDays - bDays
        })

        // Summary stats
        const criticalCount = analyses.filter(a => a.urgencyLevel === 'CRITICAL').length
        const warningCount = analyses.filter(a => a.urgencyLevel === 'WARNING').length
        const totalSuggestedValue = analyses.reduce((sum, a) => {
            const product = inventoryItems.find(i => i.productId === a.productId)?.product
            return sum + (a.suggestedOrderQty * (product?.costPrice || product?.price || 0))
        }, 0)

        return NextResponse.json({
            success: true,
            alerts: analyses,
            summary: {
                criticalCount,
                warningCount,
                totalAlerts: analyses.length,
                totalSuggestedOrderValue: Math.round(totalSuggestedValue),
                analyzedProducts: inventoryItems.length,
                daysAhead
            }
        })

    } catch (error) {
        console.error('Error analyzing inventory:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

// POST /api/admin/inventory/smart-alerts - Generate purchase order from alerts
export async function POST(request: NextRequest) {
    try {
        const user = verifyTokenFromRequest(request)
        if (!user || user.role !== 'MANAGER') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const body = await request.json()
        const { productIds, supplierId } = body

        if (!productIds || !Array.isArray(productIds) || productIds.length === 0) {
            return NextResponse.json({ error: 'Product IDs required' }, { status: 400 })
        }

        // Get product details
        const products = await prisma.product.findMany({
            where: { id: { in: productIds } },
            include: {
                inventoryItem: true
            }
        })

        // Calculate suggested quantities (same logic as GET)
        const thirtyDaysAgo = new Date()
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

        const recentOrders = await prisma.orderItem.findMany({
            where: {
                productId: { in: productIds },
                order: {
                    createdAt: { gte: thirtyDaysAgo },
                    status: { in: ['CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED'] }
                }
            },
            select: {
                productId: true,
                quantity: true
            }
        })

        const salesByProduct: Record<string, number> = {}
        for (const item of recentOrders) {
            salesByProduct[item.productId] = (salesByProduct[item.productId] || 0) + item.quantity
        }

        // Create purchase order items
        const orderItems = products.map(product => {
            const totalSales = salesByProduct[product.id] || 0
            const avgDailySales = totalSales / 30
            const currentStock = product.inventoryItem?.availableQuantity || 0
            const minStock = product.inventoryItem?.minStockLevel || 10

            const suggestedQty = Math.max(
                minStock,
                Math.ceil((30 * avgDailySales) + minStock - currentStock)
            )

            return {
                productId: product.id,
                productName: product.name,
                sku: product.sku,
                currentStock,
                suggestedQuantity: suggestedQty,
                unitCost: product.costPrice || product.price,
                totalCost: suggestedQty * (product.costPrice || product.price)
            }
        })

        const totalOrderValue = orderItems.reduce((sum, item) => sum + item.totalCost, 0)

        // Note: In a real implementation, this would create a PurchaseOrder record
        // For now, we return the suggested order data

        return NextResponse.json({
            success: true,
            purchaseOrderDraft: {
                createdAt: new Date().toISOString(),
                createdBy: user.userId,
                supplierId: supplierId || null,
                items: orderItems,
                totalItems: orderItems.length,
                totalValue: Math.round(totalOrderValue),
                status: 'DRAFT'
            },
            message: `Đã tạo đề xuất đặt hàng cho ${orderItems.length} sản phẩm`
        })

    } catch (error) {
        console.error('Error creating purchase order:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
