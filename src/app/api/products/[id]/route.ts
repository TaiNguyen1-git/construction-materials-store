import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Helper to check admin permissions
function checkAdminPermission(request: NextRequest): { allowed: boolean; userRole: string | null } {
  const userRole = request.headers.get('x-user-role')
  const allowed = ['MANAGER', 'EMPLOYEE'].includes(userRole || '')
  return { allowed, userRole }
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params

    console.log('Fetching product with ID:', id)

    if (!id) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'Product ID is required' } },
        { status: 400 }
      )
    }

    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        category: {
          select: {
            id: true,
            name: true,
            description: true
          }
        },
        inventoryItem: {
          select: {
            availableQuantity: true,
            reservedQuantity: true,
            quantity: true,
            minStockLevel: true,
            maxStockLevel: true,
            reorderPoint: true,
            lastStockDate: true
          }
        }
      }
    })

    console.log('Product found:', product ? 'Yes' : 'No')

    if (!product) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Product not found' } },
        { status: 404 }
      )
    }

    return NextResponse.json(
      { success: true, data: product, message: 'Product retrieved successfully' },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error fetching product:', error)

    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error instanceof Error ? error.message : 'Failed to fetch product'
        }
      },
      { status: 500 }
    )
  }
}

// PUT /api/products/[id] - Update product
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    // Check admin permission
    const { allowed } = checkAdminPermission(request)
    if (!allowed) {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Insufficient permissions' } },
        { status: 403 }
      )
    }

    const { id } = await context.params
    const body = await request.json()

    console.log('Updating product:', id, body)

    if (!id) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'Product ID is required' } },
        { status: 400 }
      )
    }

    // Check if product exists
    const existingProduct = await prisma.product.findUnique({ where: { id } })
    if (!existingProduct) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Product not found' } },
        { status: 404 }
      )
    }

    // Prepare update data
    const updateData: any = {}
    if (body.name !== undefined) updateData.name = body.name
    if (body.description !== undefined) updateData.description = body.description
    if (body.sku !== undefined) updateData.sku = body.sku
    if (body.price !== undefined) updateData.price = body.price
    if (body.unit !== undefined) updateData.unit = body.unit
    if (body.isActive !== undefined) updateData.isActive = body.isActive
    if (body.images !== undefined) updateData.images = body.images
    if (body.tags !== undefined) updateData.tags = body.tags

    // Update the product
    const product = await prisma.product.update({
      where: { id },
      data: updateData,
      include: {
        category: { select: { id: true, name: true } },
        inventoryItem: { select: { quantity: true, availableQuantity: true, minStockLevel: true } }
      }
    })

    // Update inventory minStockLevel if provided
    if (body.minStockLevel !== undefined && product.inventoryItem) {
      await prisma.inventoryItem.update({
        where: { productId: id },
        data: { minStockLevel: body.minStockLevel }
      })
    }

    return NextResponse.json(
      { success: true, data: product, message: 'Product updated successfully' },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error updating product:', error)

    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error instanceof Error ? error.message : 'Failed to update product'
        }
      },
      { status: 500 }
    )
  }
}

// DELETE /api/products/[id] - Soft delete product (deactivate)
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    // Check admin permission
    const { allowed } = checkAdminPermission(request)
    if (!allowed) {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Insufficient permissions' } },
        { status: 403 }
      )
    }

    const { id } = await context.params

    console.log('Deactivating product:', id)

    if (!id) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'Product ID is required' } },
        { status: 400 }
      )
    }

    // Check if product exists
    const existingProduct = await prisma.product.findUnique({ where: { id } })
    if (!existingProduct) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Product not found' } },
        { status: 404 }
      )
    }

    // Soft delete: set isActive = false instead of actually deleting
    // This preserves order history and related data
    await prisma.product.update({
      where: { id },
      data: { isActive: false }
    })

    return NextResponse.json(
      { success: true, message: 'Sản phẩm đã được ngừng bán' },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error deactivating product:', error)

    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error instanceof Error ? error.message : 'Failed to deactivate product'
        }
      },
      { status: 500 }
    )
  }
}
