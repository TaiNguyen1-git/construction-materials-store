import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createSuccessResponse, createErrorResponse } from '@/lib/api-types'

// GET /api/orders/[id] - Get order by ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const orderId = params.id

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        customer: {
          select: {
            id: true,
            user: { select: { name: true, email: true, phone: true } }
          }
        },
        orderItems: {
          include: {
            product: {
              select: { id: true, name: true, sku: true, price: true, images: true }
            }
          }
        }
      }
    })

    if (!order) {
      return NextResponse.json(
        createErrorResponse('Order not found', 'NOT_FOUND'),
        { status: 404 }
      )
    }

    return NextResponse.json(
      createSuccessResponse(order, 'Order retrieved successfully'),
      { status: 200 }
    )
  } catch (error) {
    console.error('Get order error:', error)
    return NextResponse.json(
      createErrorResponse('Internal server error', 'INTERNAL_ERROR'),
      { status: 500 }
    )
  }
}

// PUT /api/orders/[id] - Update order (for admin/employee)
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const orderId = params.id
    const body = await request.json()

    const { status, paymentStatus, notes } = body

    const updateData: any = {}
    if (status) updateData.status = status
    if (paymentStatus) updateData.paymentStatus = paymentStatus
    if (notes) updateData.notes = notes

    const order = await prisma.order.update({
      where: { id: orderId },
      data: updateData,
      include: {
        orderItems: {
          include: {
            product: {
              select: { id: true, name: true, sku: true, price: true }
            }
          }
        }
      }
    })

    return NextResponse.json(
      createSuccessResponse(order, 'Order updated successfully'),
      { status: 200 }
    )
  } catch (error) {
    console.error('Update order error:', error)
    return NextResponse.json(
      createErrorResponse('Internal server error', 'INTERNAL_ERROR'),
      { status: 500 }
    )
  }
}
