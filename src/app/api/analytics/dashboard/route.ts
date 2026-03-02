import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireEmployee } from '@/lib/auth-middleware-api'
import { statisticalForecasting } from '@/lib/stats-forecasting'

export async function GET(request: NextRequest) {
  try {
    const authError = requireEmployee(request)
    if (authError) return authError

    const { searchParams } = new URL(request.url)
    const days = parseInt(searchParams.get('days') || '30')

    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)
    startDate.setHours(0, 0, 0, 0)

    // Các trạng thái đơn hàng được coi là có doanh thu hoặc đang hoạt động
    const activeStatuses: any[] = [
      'CONFIRMED',
      'PROCESSING',
      'SHIPPED',
      'DELIVERED',
      'DEPOSIT_PAID',
      'PENDING',
      'COMPLETED',
      'CONFIRMED_AWAITING_DEPOSIT'
    ]

    // 1. KPI Stats
    const [
      totalProducts,
      totalCustomers,
      lowStockItems,
      totalOrders,
      pendingOrders,
      totalRevenue
    ] = await Promise.all([
      prisma.product.count({ where: { isActive: true } }),
      prisma.customer.count(),
      prisma.inventoryItem.count({
        where: {
          availableQuantity: { lte: prisma.inventoryItem.fields.minStockLevel },
          product: { isActive: true }
        }
      }),
      prisma.order.count({
        where: { createdAt: { gte: startDate } }
      }),
      prisma.order.count({
        where: { status: { in: ['PENDING', 'CONFIRMED', 'PENDING_CONFIRMATION', 'PROCESSING'] as any } }
      }),
      prisma.order.aggregate({
        where: {
          createdAt: { gte: startDate },
          status: { in: activeStatuses }
        },
        _sum: { totalAmount: true }
      })
    ])

    // 2. Revenue Trend (last 30 days) - Using Prisma aggregation
    const orders = await prisma.order.findMany({
      where: {
        createdAt: { gte: startDate },
        status: { in: activeStatuses }
      },
      select: {
        createdAt: true,
        totalAmount: true
      }
    })

    // Group by date and sum revenue
    const revenueByDate = new Map<string, number>()
    orders.forEach(order => {
      const dateKey = order.createdAt.toISOString().split('T')[0]
      revenueByDate.set(dateKey, (revenueByDate.get(dateKey) || 0) + order.totalAmount)
    })

    const revenueTrend = Array.from(revenueByDate.entries())
      .map(([date, revenue]) => ({
        date: new Date(date),
        revenue
      }))
      .sort((a, b) => a.date.getTime() - b.date.getTime())

    // 3 & 4. Sales by Category and Top Products
    // Use aggregation to group by productId first instead of fetching millions of order items
    const ordersInRange = await prisma.order.findMany({
      where: {
        createdAt: { gte: startDate },
        status: { in: activeStatuses }
      },
      select: { id: true }
    })

    const orderIds = ordersInRange.map(o => o.id)

    // Get aggregated sums for each product sold in the period
    const allGroupedProducts = orderIds.length > 0 ? await prisma.orderItem.groupBy({
      by: ['productId'],
      where: {
        orderId: { in: orderIds }
      },
      _sum: {
        quantity: true,
        totalPrice: true
      }
    }) : []

    // Fetch product details just for those that were sold
    const productIdsForCategory = allGroupedProducts.map(p => p.productId)
    const productsWithCategory = productIdsForCategory.length > 0 ? await prisma.product.findMany({
      where: { id: { in: productIdsForCategory } },
      select: {
        id: true,
        name: true,
        category: {
          select: { name: true }
        }
      }
    }) : []

    const productMap = new Map(productsWithCategory.map(p => [p.id, p]))

    // 3. Process Sales by Category
    const salesByCategoryMap = new Map<string, { total: number; count: number }>()
    allGroupedProducts.forEach(item => {
      const product = productMap.get(item.productId)
      const categoryName = product?.category?.name || 'Uncategorized'

      const existing = salesByCategoryMap.get(categoryName) || { total: 0, count: 0 }
      salesByCategoryMap.set(categoryName, {
        total: existing.total + (item._sum.totalPrice || 0),
        count: existing.count + (item._sum.quantity || 0)
      })
    })

    const salesByCategory = Array.from(salesByCategoryMap.entries())
      .map(([category, data]) => ({ category, ...data }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 10)

    // 4. Process Top Products
    const topProductIds = [...allGroupedProducts]
      .sort((a, b) => (b._sum.totalPrice || 0) - (a._sum.totalPrice || 0))
      .slice(0, 10)

    const topProducts = topProductIds.map(p => ({
      name: productMap.get(p.productId)?.name || 'Unknown',
      quantity: p._sum.quantity || 0,
      revenue: p._sum.totalPrice || 0
    }))

    // 5. Inventory Status
    const inventoryStatus = await prisma.inventoryItem.findMany({
      select: {
        product: {
          select: {
            name: true,
            category: {
              select: { name: true }
            }
          }
        },
        availableQuantity: true,
        minStockLevel: true,
        maxStockLevel: true
      },
      orderBy: { availableQuantity: 'asc' },
      take: 20
    })

    // 6. Order Status Distribution
    const orderStatusDistribution = await prisma.order.groupBy({
      by: ['status'],
      where: { createdAt: { gte: startDate } },
      _count: { id: true }
    })

    // 7. Recent Orders (including both registered and guest orders)
    const recentOrders = await prisma.order.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        orderNumber: true,
        totalAmount: true,
        status: true,
        createdAt: true,
        customerType: true,
        guestName: true,
        guestEmail: true,
        customer: {
          select: {
            user: {
              select: { name: true, email: true }
            }
          }
        }
      }
    })

    // 8. Employee Performance (by tasks completed) - Using Prisma queries
    const taskGroups = await prisma.employeeTask.groupBy({
      by: ['employeeId', 'status'],
      where: { createdAt: { gte: startDate } },
      _count: { _all: true }
    })

    const employeeIds = Array.from(new Set(taskGroups.map(t => t.employeeId)))
    const employeesInfo = employeeIds.length > 0 ? await prisma.employee.findMany({
      where: { id: { in: employeeIds } },
      select: {
        id: true,
        user: { select: { name: true } }
      }
    }) : []
    const employeeInfoMap = new Map(employeesInfo.map(e => [e.id, (e.user as any)?.name || 'Unknown']))

    const employeePerfMap = new Map<string, { name: string; completed: number; total: number }>()
    taskGroups.forEach(group => {
      const empId = group.employeeId
      const existing = employeePerfMap.get(empId) || { name: employeeInfoMap.get(empId) || 'Unknown', completed: 0, total: 0 }

      const count = group._count._all
      existing.total += count
      if (group.status === 'COMPLETED') {
        existing.completed += count
      }
      employeePerfMap.set(empId, existing)
    })

    const employeePerformance = Array.from(employeePerfMap.values())
      .sort((a, b) => b.completed - a.completed)
      .slice(0, 10)

    // 9. Predictive Analytics (Global Revenue & Stock Warnings)
    // Revenue Forecast for next 30 days
    const revenueData = revenueTrend.map(r => ({ date: r.date, value: Number(r.revenue) }))
    const revenueForecast = await statisticalForecasting.forecast(revenueData, 30)

    // Stock Warnings (Predicting when items will run out based on recent velocity)
    const stockWarnings = inventoryStatus
      .filter(i => i.availableQuantity <= (i.minStockLevel * 1.5)) // Items near or below min
      .map(i => ({
        product: i.product.name,
        current: i.availableQuantity,
        min: i.minStockLevel,
        urgency: i.availableQuantity <= i.minStockLevel ? 'CRITICAL' : 'WARNING'
      }))

    return NextResponse.json({
      success: true,
      data: {
        kpis: {
          totalProducts,
          totalCustomers,
          lowStockItems,
          totalOrders,
          pendingOrders,
          totalRevenue: totalRevenue?._sum?.totalAmount || 0
        },
        revenueTrend: revenueTrend.map(r => ({
          date: r.date.toISOString().split('T')[0],
          revenue: Number(r.revenue)
        })),
        salesByCategory: salesByCategory.map(s => ({
          category: s.category,
          total: Number(s.total),
          count: Number(s.count)
        })),
        topProducts: topProducts.map(p => ({
          name: p.name,
          quantity: Number(p.quantity),
          revenue: Number(p.revenue)
        })),
        inventoryStatus: inventoryStatus.map(i => ({
          product: i.product.name,
          category: i.product.category?.name || 'Uncategorized',
          available: i.availableQuantity,
          min: i.minStockLevel,
          max: i.maxStockLevel || 0,
          status: i.availableQuantity <= i.minStockLevel ? 'Low' :
            i.availableQuantity >= (i.maxStockLevel || Infinity) * 0.8 ? 'High' : 'Normal'
        })),
        orderStatusDistribution: orderStatusDistribution.map(o => ({
          status: o.status,
          count: o._count.id
        })),
        recentOrders: recentOrders.map(o => ({
          id: o.id,
          orderNumber: o.orderNumber,
          customer: o.customerType === 'GUEST'
            ? (o.guestName || 'Guest Customer')
            : (o.customer?.user?.name || 'Unknown'),
          amount: o.totalAmount,
          status: o.status,
          date: o.createdAt
        })),
        employeePerformance: employeePerformance.map(e => ({
          name: e.name,
          completed: Number(e.completed),
          total: Number(e.total),
          rate: Number(e.total) > 0 ? (Number(e.completed) / Number(e.total) * 100).toFixed(1) : 0
        })),
        predictive: {
          next30DaysRevenue: revenueForecast.predictedDemand,
          confidence: revenueForecast.confidence,
          trend: revenueForecast.trend,
          stockWarnings
        }
      }
    }, {
      headers: {
        // Allow 60-second edge caching with stale-while-revalidate for performance
        'Cache-Control': 'private, s-maxage=60, stale-while-revalidate=30',
      }
    })
  } catch (error) {
    console.error('Dashboard analytics error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch dashboard analytics' },
      { status: 500 }
    )
  }
}
