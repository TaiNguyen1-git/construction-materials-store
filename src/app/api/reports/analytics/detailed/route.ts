import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createSuccessResponse, createErrorResponse } from '@/lib/api-types'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    if (!startDate || !endDate) {
      return NextResponse.json(
        createErrorResponse('startDate and endDate are required', 'VALIDATION_ERROR'),
        { status: 400 }
      )
    }

    const start = new Date(startDate)
    const end = new Date(endDate)
    end.setHours(23, 59, 59, 999)

    // Get detailed orders
    const orders = await prisma.order.findMany({
      where: {
        createdAt: {
          gte: start,
          lt: end
        },
        status: { not: 'CANCELLED' }
      },
      include: {
        orderItems: {
          include: {
            product: {
              select: {
                name: true,
                unit: true
              }
            }
          }
        },
        customer: {
          include: {
            user: {
              select: {
                name: true,
                email: true
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 50 // Limit to 50 most recent orders
    })

    // Calculate top products
    const productSales: Record<string, any> = {}
    
    orders.forEach(order => {
      order.orderItems.forEach((item: any) => {
        const productName = item.product.name
        if (!productSales[productName]) {
          productSales[productName] = {
            name: productName,
            unit: item.product.unit,
            quantity: 0,
            revenue: 0
          }
        }
        productSales[productName].quantity += item.quantity
        productSales[productName].revenue += item.totalPrice
      })
    })

    const topProducts = Object.values(productSales)
      .sort((a: any, b: any) => b.revenue - a.revenue)
      .slice(0, 10)

    return NextResponse.json(
      createSuccessResponse({
        orders: orders.map(order => ({
          orderNumber: order.orderNumber,
          customerType: order.customerType,
          guestName: order.guestName,
          customer: order.customer,
          netAmount: order.netAmount,
          status: order.status,
          paymentMethod: order.paymentMethod,
          createdAt: order.createdAt,
          orderItemsCount: order.orderItems.length
        })),
        topProducts
      })
    )
  } catch (error) {
    console.error('Error fetching detailed analytics:', error)
    return NextResponse.json(
      createErrorResponse('Failed to fetch detailed report', 'INTERNAL_ERROR'),
      { status: 500 }
    )
  }
}

