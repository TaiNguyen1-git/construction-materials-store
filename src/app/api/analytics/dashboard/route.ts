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

    const activeStatuses: any[] = ['CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'DEPOSIT_PAID', 'PENDING']

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

    // 3. Sales by Category - Using Prisma queries  
    // NOTE: Nested filter bug - must query orders first, then items by IDs
    const ordersInRange = await prisma.order.findMany({
      where: {
        createdAt: { gte: startDate },
        status: { in: activeStatuses }
      },
      select: { id: true }
    })

    const orderItems = await prisma.orderItem.findMany({
      where: {
        orderId: { in: ordersInRange.map(o => o.id) }
      },
      include: {
        product: {
          include: {
            category: {
              select: {
                name: true
              }
            }
          }
        }
      }
    })

    const salesByCategoryMap = new Map<string, { total: number; count: number }>()
    orderItems.forEach(item => {
      const categoryName = item.product.category?.name || 'Uncategorized'
      const existing = salesByCategoryMap.get(categoryName) || { total: 0, count: 0 }
      salesByCategoryMap.set(categoryName, {
        total: existing.total + item.totalPrice,
        count: existing.count + item.quantity
      })
    })

    const salesByCategory = Array.from(salesByCategoryMap.entries())
      .map(([category, data]) => ({ category, ...data }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 10)

    // 4. Top Products - Using Prisma queries
    const productSalesMap = new Map<string, { name: string; quantity: number; revenue: number }>()
    orderItems.forEach(item => {
      const productId = item.productId
      const existing = productSalesMap.get(productId) || { name: item.product.name, quantity: 0, revenue: 0 }
      productSalesMap.set(productId, {
        name: existing.name,
        quantity: existing.quantity + item.quantity,
        revenue: existing.revenue + item.totalPrice
      })
    })

    const topProducts = Array.from(productSalesMap.values())
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10)

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
    const tasks = await prisma.employeeTask.findMany({
      where: {
        createdAt: { gte: startDate }
      },
      include: {
        employee: {
          include: {
            user: {
              select: {
                name: true
              }
            }
          }
        }
      }
    })

    const employeePerfMap = new Map<string, { name: string; completed: number; total: number }>()
    tasks.forEach(task => {
      const employeeId = task.employeeId
      const userName = (task.employee.user as any).name
      const existing = employeePerfMap.get(employeeId) || { name: userName, completed: 0, total: 0 }
      employeePerfMap.set(employeeId, {
        name: existing.name,
        completed: existing.completed + (task.status === 'COMPLETED' ? 1 : 0),
        total: existing.total + 1
      })
    })

    const employeePerformance = Array.from(employeePerfMap.values())
      .sort((a, b: any) => (b as any).completed - (a as any).completed)
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
