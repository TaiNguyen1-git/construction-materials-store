import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createSuccessResponse, createErrorResponse } from '@/lib/api-types'
import { requireAuth, requireEmployee } from '@/lib/auth-middleware-api'

// GET /api/inventory/movements - Get inventory movements history
export async function GET(request: NextRequest) {
  try {
    const authError = requireAuth(request)
    if (authError) {
      return authError
    }

    const { searchParams } = new URL(request.url)
    const productId = searchParams.get('productId')
    const type = searchParams.get('type')
    const limit = parseInt(searchParams.get('limit') || '50')

    const where: any = {}
    if (productId) where.productId = productId
    if (type) where.movementType = type

    const movements = await prisma.inventoryMovement.findMany({
      where,
      include: {
        product: {
          select: {
            id: true,
            name: true,
            sku: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: limit
    })

    return NextResponse.json(
      createSuccessResponse(movements, 'Inventory movements retrieved successfully'),
      { status: 200 }
    )
  } catch (error) {
    console.error('Error fetching inventory movements:', error)
    return NextResponse.json(
      createErrorResponse('Failed to fetch inventory movements', 'SERVER_ERROR'),
      { status: 500 }
    )
  }
}

// POST /api/inventory/movements - Create new inventory movement
export async function POST(request: NextRequest) {
  try {
    const authError = requireEmployee(request)
    if (authError) {
      return authError
    }

    const body = await request.json()
    const { productId, type, quantity, reason } = body

    if (!productId || !type || !quantity) {
      return NextResponse.json(
        createErrorResponse('Missing required fields', 'VALIDATION_ERROR'),
        { status: 400 }
      )
    }

    // Get current inventory
    const inventory = await prisma.inventoryItem.findUnique({
      where: { productId }
    })

    if (!inventory) {
      return NextResponse.json(
        createErrorResponse('Product inventory not found', 'NOT_FOUND'),
        { status: 404 }
      )
    }

    const previousStock = inventory.availableQuantity
    let newStock = previousStock

    // Calculate new stock based on movement type
    switch (type) {
      case 'IN':
        newStock = previousStock + quantity
        break
      case 'OUT':
      case 'DAMAGE':
        newStock = Math.max(0, previousStock - quantity)
        break
      case 'ADJUSTMENT':
        newStock = quantity // Direct adjustment to specific value
        break
      case 'TRANSFER':
        newStock = previousStock - quantity
        break
      case 'RETURN':
        newStock = previousStock + quantity
        break
      default:
        return NextResponse.json(
          createErrorResponse('Invalid movement type', 'VALIDATION_ERROR'),
          { status: 400 }
        )
    }

    // Create movement record and update inventory in transaction
    const movement = await prisma.$transaction(async (tx) => {
      // Create movement
      const mov = await tx.inventoryMovement.create({
        data: {
          inventoryId: inventory.id,
          productId,
          movementType: type,
          quantity,
          previousStock,
          newStock,
          reason: reason || `${type} movement`,
          referenceType: 'MANUAL',
          performedBy: 'admin'
        }
      })

      // Update inventory
      await tx.inventoryItem.update({
        where: { id: inventory.id },
        data: {
          quantity: newStock,
          availableQuantity: newStock,
          lastStockDate: new Date()
        }
      })

      return mov
    })

    // Send email alerts for low/critical stock levels (non-blocking, outside transaction)
    const isLowStock = newStock <= inventory.minStockLevel
    const isCriticalStock = newStock <= inventory.minStockLevel * 0.2 || newStock <= 0


    if (isLowStock) {
      // Get product info for email
      const product = await prisma.product.findUnique({
        where: { id: productId },
        select: { name: true, sku: true }
      })

      if (product) {

        import('@/lib/email-service').then(({ EmailService }) => {

          // Send to employee for all low stock
          EmailService.sendStockAlertToEmployee({
            productName: product.name,
            sku: product.sku || productId,
            currentStock: newStock,
            minStock: inventory.minStockLevel
          }).then(sent => {
          }).catch(err => console.error('Stock alert email to employee error:', err))

          // Send stock alert to admin for ALL low stock situations
          EmailService.sendCriticalStockAlertToAdmin({
            productName: product.name,
            sku: product.sku || productId,
            currentStock: newStock,
            minStock: inventory.minStockLevel
          }).then(sent => {
          }).catch(err => console.error('Stock alert email to admin error:', err))
        }).catch(err => console.error('Email import error:', err))
      } else {
      }
    }

    return NextResponse.json(
      createSuccessResponse({ data: movement }, 'Inventory movement recorded successfully'),
      { status: 201 }
    )
  } catch (error) {
    console.error('Error creating inventory movement:', error)
    return NextResponse.json(
      createErrorResponse('Failed to record inventory movement', 'SERVER_ERROR'),
      { status: 500 }
    )
  }
}
