import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createSuccessResponse, createErrorResponse, createPaginatedResponse } from '@/lib/api-types'
import { requireAuth } from '@/lib/auth-middleware-api'
import { z } from 'zod'
import { sendNotification, createStockUpdateNotification, createLowStockAlertNotification } from '@/lib/notification-service'
import { logger, logAPI } from '@/lib/logger'

const querySchema = z.object({
  page: z.string().optional().default('1').transform(val => parseInt(val)),
  limit: z.string().optional().default('20').transform(val => parseInt(val)),
  search: z.string().optional(),
  lowStock: z.string().optional().transform(val => val === 'true'),
  category: z.string().optional(),
  sortBy: z.string().default('productName'),
  sortOrder: z.enum(['asc', 'desc']).default('asc'),
})

const updateStockSchema = z.object({
  quantity: z.number(),
  movementType: z.enum(['IN', 'OUT', 'ADJUSTMENT', 'TRANSFER', 'DAMAGE', 'RETURN']),
  reason: z.string().min(1, 'Reason is required'),
  referenceType: z.string().optional(),
  referenceId: z.string().optional(),
  notes: z.string().optional(),
})

const updateInventorySchema = z.object({
  minStockLevel: z.number().min(0).optional(),
  maxStockLevel: z.number().positive().optional(),
  reorderPoint: z.number().min(0).optional(),
  location: z.string().optional(),
  notes: z.string().optional(),
})

// GET /api/inventory - List inventory items with pagination and filters
export async function GET(request: NextRequest) {
  const startTime = Date.now()

  try {
    // Verify authentication
    const authError = requireAuth(request)
    if (authError) {
      return authError
    }

    const userRole = request.headers.get('x-user-role')
    const userId = request.headers.get('x-user-id')

    if (process.env.NODE_ENV === 'production' && !['MANAGER', 'EMPLOYEE'].includes(userRole || '')) {
      logger.warn('Unauthorized inventory access', { userId, userRole })
      return NextResponse.json(
        createErrorResponse('Employee access required', 'FORBIDDEN'),
        { status: 403 }
      )
    }

    const { searchParams } = new URL(request.url)
    const params = Object.fromEntries(searchParams.entries())

    const validation = querySchema.safeParse(params)
    if (!validation.success) {
      return NextResponse.json(
        createErrorResponse('Invalid query parameters', 'VALIDATION_ERROR', validation.error.issues),
        { status: 400 }
      )
    }

    const { page, limit, search, lowStock, category, sortBy, sortOrder } = validation.data
    const skip = (page - 1) * limit

    // Build where clause
    const where: any = {}

    if (search) {
      where.product = {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { sku: { contains: search, mode: 'insensitive' } },
        ]
      }
    }

    if (category) {
      where.product = {
        ...where.product,
        categoryId: category
      }
    }

    if (lowStock) {
      where.quantity = {
        lte: prisma.inventoryItem.fields.minStockLevel
      }
    }

    // Get inventory items with pagination
    const [inventoryItems, total] = await Promise.all([
      prisma.inventoryItem.findMany({
        where,
        include: {
          product: {
            select: {
              id: true,
              name: true,
              sku: true,
              price: true,
              unit: true,
              category: {
                select: { name: true }
              }
            }
          }
        },
        orderBy: sortBy === 'productName' ? { product: { name: sortOrder } } : { [sortBy]: sortOrder },
        skip,
        take: limit,
      }),
      prisma.inventoryItem.count({ where })
    ])

    // Add computed fields
    const enrichedItems = inventoryItems.map((item: any) => ({
      ...item,
      isLowStock: item.quantity <= item.minStockLevel,
      stockValue: item.quantity * (item.product.price || 0),
    }))

    const response = createPaginatedResponse(enrichedItems, total, page, limit)

    const duration = Date.now() - startTime
    logAPI.response('GET', '/api/inventory', 200, duration, { total, page, userId })

    return NextResponse.json(
      createSuccessResponse(response, 'Inventory items retrieved successfully'),
      { status: 200 }
    )

  } catch (error: any) {
    const duration = Date.now() - startTime
    logAPI.error('GET', '/api/inventory', error, { duration })
    logger.error('Get inventory error', { error: error.message, stack: error.stack })

    return NextResponse.json(
      createErrorResponse('Internal server error', 'INTERNAL_ERROR'),
      { status: 500 }
    )
  }
}

// POST /api/inventory/movements - Update stock levels
export async function POST(request: NextRequest) {
  const startTime = Date.now()

  try {
    // Check user role from middleware
    const userRole = request.headers.get('x-user-role')
    const userId = request.headers.get('x-user-id')

    if (!['MANAGER', 'EMPLOYEE'].includes(userRole || '')) {
      logger.warn('Unauthorized inventory update attempt', { userId, userRole })
      return NextResponse.json(
        createErrorResponse('Employee access required', 'FORBIDDEN'),
        { status: 403 }
      )
    }

    const body = await request.json()

    // Validate input
    const validation = updateStockSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        createErrorResponse('Invalid input', 'VALIDATION_ERROR', validation.error.issues),
        { status: 400 }
      )
    }

    const { quantity, movementType, reason, referenceType, referenceId, notes } = validation.data
    const { productId } = body

    // Check if inventory item exists
    const inventoryItem = await prisma.inventoryItem.findUnique({
      where: { productId }
    })

    if (!inventoryItem) {
      return NextResponse.json(
        createErrorResponse('Inventory item not found', 'INVENTORY_NOT_FOUND'),
        { status: 404 }
      )
    }

    // Store previous stock level for WebSocket notification
    const previousStock = inventoryItem.quantity

    // Calculate new stock level
    let newQuantity = inventoryItem.quantity
    let actualQuantity = quantity

    switch (movementType) {
      case 'IN':
        newQuantity += quantity
        break
      case 'OUT':
        newQuantity -= quantity
        actualQuantity = -quantity
        if (newQuantity < 0) {
          return NextResponse.json(
            createErrorResponse('Insufficient stock', 'INSUFFICIENT_STOCK'),
            { status: 400 }
          )
        }
        break
      case 'ADJUSTMENT':
        actualQuantity = quantity - inventoryItem.quantity
        newQuantity = quantity
        break
      case 'DAMAGE':
      case 'RETURN':
        newQuantity -= quantity
        actualQuantity = -quantity
        break
      case 'TRANSFER':
        // Handle transfer logic here
        newQuantity += quantity
        break
    }

    // Update inventory and create movement record in transaction
    const result = await prisma.$transaction(async (tx) => {
      // Update inventory
      const updatedInventory = await tx.inventoryItem.update({
        where: { productId },
        data: {
          quantity: newQuantity,
          availableQuantity: newQuantity - inventoryItem.reservedQuantity,
          lastStockDate: new Date(),
        },
        include: {
          product: {
            select: {
              id: true,
              name: true,
              sku: true,
              price: true,
              unit: true
            }
          }
        }
      })

      // Create movement record
      await tx.inventoryMovement.create({
        data: {
          productId,
          inventoryId: inventoryItem.id,
          movementType,
          quantity: actualQuantity,
          previousStock: inventoryItem.quantity,
          newStock: newQuantity,
          reason,
          referenceType,
          referenceId,
          performedBy: userId || 'system',
          notes,
        }
      })

      // Check if we need to create a stock alert notification
      // Only check for OUT, DAMAGE, ADJUSTMENT movements that reduce stock
      if (['OUT', 'DAMAGE', 'ADJUSTMENT'].includes(movementType) &&
        (newQuantity <= 0 || newQuantity <= inventoryItem.minStockLevel)) {
        try {
          await sendNotification({
            type: 'LOW_STOCK',
            priority: newQuantity <= 0 ? 'HIGH' : 'MEDIUM',
            title: 'Low Stock Alert',
            message: `Product ${productId} is running low on stock (${newQuantity} remaining)`,
            productId,
            data: { currentStock: newQuantity, minStockLevel: inventoryItem.minStockLevel }
          })
        } catch (notificationError) {
          console.error('Failed to create stock alert notification:', notificationError)
        }
      }

      return updatedInventory
    })

    // Send email alerts for low/critical stock levels (non-blocking, outside transaction)
    // Send email when stock is at or below minStockLevel
    const isLowStock = newQuantity <= inventoryItem.minStockLevel
    const isCriticalStock = newQuantity <= inventoryItem.minStockLevel * 0.2 || newQuantity <= 0


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
            currentStock: newQuantity,
            minStock: inventoryItem.minStockLevel
          }).then(sent => {
          }).catch(err => console.error('Stock alert email to employee error:', err))

          // Send critical stock alert to admin only for critical levels
          if (isCriticalStock) {
            EmailService.sendCriticalStockAlertToAdmin({
              productName: product.name,
              sku: product.sku || productId,
              currentStock: newQuantity,
              minStock: inventoryItem.minStockLevel
            }).then(sent => {
            }).catch(err => console.error('Critical stock alert email error:', err))
          }
        }).catch(err => console.error('Email import error:', err))
      } else {
      }
    }

    // Send real-time notification via Firebase (formerly WebSocket)
    try {
      if (result.product) {
        await createStockUpdateNotification({
          productId,
          productName: result.product.name,
          sku: result.product.sku || undefined,
          currentStock: newQuantity,
          previousStock: previousStock
        })

        // Send low stock alert if applicable
        if (newQuantity <= 0 || newQuantity <= inventoryItem.minStockLevel) {
          await createLowStockAlertNotification({
            productId,
            productName: result.product.name,
            sku: result.product.sku || undefined,
            currentStock: newQuantity,
            minStockLevel: inventoryItem.minStockLevel
          })
        }
      }
    } catch (notificationError) {
      console.error('Failed to send Firebase notification:', notificationError)
    }

    return NextResponse.json(
      createSuccessResponse(result, 'Stock updated successfully'),
      { status: 200 }
    )

  } catch (error) {
    console.error('Update stock error:', error)
    return NextResponse.json(
      createErrorResponse('Internal server error', 'INTERNAL_ERROR'),
      { status: 500 }
    )
  }
}

// PUT /api/inventory/[productId] - Update inventory settings
export async function PUT(request: NextRequest, { params }: { params: Promise<{ productId: string }> }) {
  try {
    // Check user role from middleware
    const userRole = request.headers.get('x-user-role')
    if (userRole !== 'MANAGER') {
      return NextResponse.json(
        createErrorResponse('Manager access required', 'FORBIDDEN'),
        { status: 403 }
      )
    }

    const { productId } = await params
    const body = await request.json()

    // Validate input
    const validation = updateInventorySchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        createErrorResponse('Invalid input', 'VALIDATION_ERROR', validation.error.issues),
        { status: 400 }
      )
    }

    // Check if inventory item exists
    const existingItem = await prisma.inventoryItem.findUnique({
      where: { productId }
    })

    if (!existingItem) {
      return NextResponse.json(
        createErrorResponse('Inventory item not found', 'INVENTORY_NOT_FOUND'),
        { status: 404 }
      )
    }

    // Update inventory settings
    const updatedItem = await prisma.inventoryItem.update({
      where: { productId },
      data: validation.data
    })

    return NextResponse.json(
      createSuccessResponse(updatedItem, 'Inventory settings updated successfully'),
      { status: 200 }
    )

  } catch (error) {
    console.error('Update inventory settings error:', error)
    return NextResponse.json(
      createErrorResponse('Internal server error', 'INTERNAL_ERROR'),
      { status: 500 }
    )
  }
}