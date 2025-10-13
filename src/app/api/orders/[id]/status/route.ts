import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import jwt from 'jsonwebtoken'

// Mock token verification for development
const verifyToken = async (request: NextRequest) => {
  const token = request.headers.get('authorization')?.replace('Bearer ', '') ||
    request.cookies.get('access_token')?.value
    
  if (!token) return null
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret') as any
    return decoded
  } catch {
    return null
  }
}

// PUT /api/orders/[id]/status - Update order status
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    const user = await verifyToken(request)
    if (!user || !['MANAGER', 'EMPLOYEE'].includes(user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { status, trackingNumber, note } = body

    if (!status) {
      return NextResponse.json({ error: 'Status is required' }, { status: 400 })
    }

    const validStatuses = ['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'COMPLETED', 'CANCELLED']
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
    }

    // Check if order exists
    const existingOrder = await prisma.order.findUnique({
      where: { id },
      include: {
        orderItems: {
          include: {
            product: true
          }
        }
      }
    })

    if (!existingOrder) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    // Handle status change logic
    const updateData: any = {
      status,
      updatedAt: new Date()
    }

    if (trackingNumber) updateData.trackingNumber = trackingNumber
    if (note) updateData.note = note

    // Special handling for status changes that affect inventory
    if (status === 'CANCELLED' && existingOrder.status !== 'CANCELLED') {
      // Return items to stock
      await prisma.$transaction(async (tx: any) => {
        for (const item of existingOrder.orderItems) {
          await tx.product.update({
            where: { id: item.productId },
            data: {
              stock: {
                increment: item.quantity
              }
            }
          })

          // Create inventory movement record
          await tx.inventoryMovement.create({
            data: {
              productId: item.productId,
              type: 'IN',
              quantity: item.quantity,
              reason: `Order ${existingOrder.orderNumber} cancelled`,
              reference: id
            }
          })
        }

        // Update order status
        await tx.order.update({
          where: { id },
          data: updateData
        })
      })
    } else {
      // Update order status without inventory changes
      await prisma.order.update({
        where: { id },
        data: updateData
      })
    }

    // Fetch updated order
    const updatedOrder = await prisma.order.findUnique({
      where: { id },
      include: {
        customer: {
          select: { id: true, user: { select: { name: true, email: true } } }
        },
        orderItems: {
          include: {
            product: {
              select: { id: true, name: true, sku: true, price: true }
            }
          }
        }
      }
    })

    return NextResponse.json(updatedOrder)
  } catch (error) {
    console.error('Error updating order status:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}