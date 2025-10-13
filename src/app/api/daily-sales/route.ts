import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createSuccessResponse, createErrorResponse } from '@/lib/api-types'

// POST /api/daily-sales - Save daily sales entry
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { saleDate, entries } = body

    if (!saleDate || !entries || entries.length === 0) {
      return NextResponse.json(
        createErrorResponse('Invalid input', 'VALIDATION_ERROR'),
        { status: 400 }
      )
    }

    // Generate order number
    const orderNumber = `DAILY-${new Date(saleDate).toISOString().split('T')[0]}-${Math.random().toString(36).substr(2, 5).toUpperCase()}`

    // Calculate totals
    const subtotal = entries.reduce((sum: number, e: any) => sum + (e.quantity * e.price), 0)
    const taxAmount = subtotal * 0.1
    const totalAmount = subtotal + taxAmount

    // Create order
    const order = await prisma.order.create({
      data: {
        orderNumber,
        customerType: 'GUEST',
        guestName: 'Bán lẻ ngày ' + new Date(saleDate).toLocaleDateString('vi-VN'),
        guestPhone: '',
        status: 'DELIVERED',
        totalAmount: subtotal,
        taxAmount,
        shippingAmount: 0,
        discountAmount: 0,
        netAmount: totalAmount,
        paymentMethod: 'CASH',
        paymentStatus: 'PAID',
        notes: `Doanh số nhập tay - Ngày ${new Date(saleDate).toLocaleDateString('vi-VN')}`,
        createdAt: new Date(saleDate),
        orderItems: {
          create: entries.map((e: any) => ({
            productId: e.productId,
            quantity: e.quantity,
            unitPrice: e.price,
            totalPrice: e.price * e.quantity,
            discount: 0
          }))
        }
      },
      include: {
        orderItems: {
          include: {
            product: true
          }
        }
      }
    })

    // Update inventory (deduct stock)
    for (const entry of entries) {
      await prisma.inventoryItem.update({
        where: { productId: entry.productId },
        data: {
          availableQuantity: {
            decrement: entry.quantity
          }
        }
      })
    }

    return NextResponse.json(
      createSuccessResponse({
        order,
        orderNumber,
        total: totalAmount
      }, 'Đã lưu doanh số ngày'),
      { status: 200 }
    )

  } catch (error) {
    console.error('Daily sales error:', error)
    return NextResponse.json(
      createErrorResponse('Internal server error', 'INTERNAL_ERROR'),
      { status: 500 }
    )
  }
}

// GET /api/daily-sales - Get daily sales history
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    const where: any = {
      guestName: {
        startsWith: 'Bán lẻ ngày'
      }
    }

    if (startDate) {
      where.createdAt = { gte: new Date(startDate) }
    }
    if (endDate) {
      where.createdAt = { ...where.createdAt, lte: new Date(endDate) }
    }

    const sales = await prisma.order.findMany({
      where,
      include: {
        orderItems: {
          include: {
            product: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json(
      createSuccessResponse(sales, 'Success'),
      { status: 200 }
    )

  } catch (error) {
    console.error('Get daily sales error:', error)
    return NextResponse.json(
      createErrorResponse('Internal server error', 'INTERNAL_ERROR'),
      { status: 500 }
    )
  }
}
