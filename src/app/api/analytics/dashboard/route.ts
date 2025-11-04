import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const days = parseInt(searchParams.get('days') || '30')
    
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)
    startDate.setHours(0, 0, 0, 0)

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
          availableQuantity: { lte: prisma.inventoryItem.fields.minStockLevel }
        }
      }),
      prisma.order.count({
        where: { createdAt: { gte: startDate } }
      }),
      prisma.order.count({
        where: { status: { in: ['PENDING', 'CONFIRMED'] } }
      }),
      prisma.order.aggregate({
        where: {
          createdAt: { gte: startDate },
          status: { in: ['DELIVERED', 'SHIPPED'] }
        },
        _sum: { totalAmount: true }
      })
    ])

    // 2. Revenue Trend (last 30 days)
    const revenueTrend = await prisma.$queryRaw<Array<{ date: Date; revenue: number }>>`
      SELECT 
        DATE("createdAt") as date,
        SUM("totalAmount") as revenue
      FROM "orders"
      WHERE "createdAt" >= ${startDate}
        AND "status" IN ('DELIVERED', 'SHIPPED')
      GROUP BY DATE("createdAt")
      ORDER BY date ASC
    `

    // 3. Sales by Category
    const salesByCategory = await prisma.$queryRaw<Array<{ category: string; total: number; count: number }>>`
      SELECT 
        c.name as category,
        SUM(oi."totalPrice") as total,
        SUM(oi.quantity) as count
      FROM "order_items" oi
      JOIN "products" p ON oi."productId" = p.id
      JOIN "categories" c ON p."categoryId" = c.id
      JOIN "orders" o ON oi."orderId" = o.id
      WHERE o."createdAt" >= ${startDate}
        AND o.status IN ('DELIVERED', 'SHIPPED')
      GROUP BY c.name
      ORDER BY total DESC
      LIMIT 10
    `

    // 4. Top Products
    const topProducts = await prisma.$queryRaw<Array<{ name: string; quantity: number; revenue: number }>>`
      SELECT 
        p.name,
        SUM(oi.quantity) as quantity,
        SUM(oi."totalPrice") as revenue
      FROM "order_items" oi
      JOIN "products" p ON oi."productId" = p.id
      JOIN "orders" o ON oi."orderId" = o.id
      WHERE o."createdAt" >= ${startDate}
        AND o.status IN ('DELIVERED', 'SHIPPED')
      GROUP BY p.id, p.name
      ORDER BY revenue DESC
      LIMIT 10
    `

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

    // 8. Employee Performance (by tasks completed)
    const employeePerformance = await prisma.$queryRaw<Array<{ name: string; completed: number; total: number }>>`
      SELECT 
        u.name,
        COUNT(CASE WHEN et.status = 'COMPLETED' THEN 1 END) as completed,
        COUNT(*) as total
      FROM "employees" e
      JOIN "users" u ON e."userId" = u.id
      LEFT JOIN "employee_tasks" et ON e.id = et."employeeId"
      WHERE et."createdAt" >= ${startDate}
      GROUP BY e.id, u.name
      ORDER BY completed DESC
      LIMIT 10
    `

    return NextResponse.json({
      success: true,
      data: {
        kpis: {
          totalProducts,
          totalCustomers,
          lowStockItems,
          totalOrders,
          pendingOrders,
          totalRevenue: totalRevenue._sum.totalAmount || 0
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
          category: i.product.category.name,
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
        }))
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
