import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyTokenFromRequest } from '@/lib/auth-middleware-api'
import { CacheService } from '@/lib/cache'

// Helper to check admin permissions
function checkAdminPermission(request: NextRequest): { allowed: boolean; userRole: string | null } {
  const auth = verifyTokenFromRequest(request)
  const allowed = auth ? ['MANAGER', 'EMPLOYEE'].includes(auth.role) : false
  return { allowed, userRole: auth?.role || null }
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params


    if (!id) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'Product ID is required' } },
        { status: 400 }
      )
    }

    const cacheKey = `product:${id}`
    const cachedProduct = await CacheService.get(cacheKey)
    if (cachedProduct) {
      return NextResponse.json({ success: true, data: cachedProduct, message: 'Product retrieved from cache' }, { status: 200 })
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

    if (product) {
      await CacheService.set(cacheKey, product, 3600) // Cache for 1 hour
    }


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

    // Clear cache
    await CacheService.del(`product:${id}`)
    await CacheService.delByPrefix('products:')

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

// DELETE /api/products/[id] - Soft delete product (deactivate) or hard delete if possible
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

    try {
      // Hard delete: Try to delete everything related to inventory first, then delete the Product
      await prisma.$transaction(async (tx) => {
        // 1. Delete InventoryItem (if exists)
        await tx.inventoryItem.deleteMany({
          where: { productId: id }
        })

        // 2. Delete associated inventory movements (if any)
        await tx.inventoryMovement.deleteMany({
          where: { productId: id }
        })

        // 3. Delete the product itself
        await tx.product.delete({
          where: { id }
        })
      })

      // Clear cache
      await CacheService.del(`product:${id}`)
      await CacheService.delByPrefix('products:')

      return NextResponse.json(
        { success: true, message: 'Sản phẩm đã được xoá hoàn toàn' },
        { status: 200 }
      )
    } catch (error: any) {
      // If there's a relation violation (product used in orders, purchases, etc.)
      // Fallback to soft delete (deactivation)
      if (error.code === 'P2003' || error.message?.toLowerCase().includes('violate') || error.message?.toLowerCase().includes('relation')) {
        console.warn('Relations exist, falling back to deactivation for product:', id)

        await prisma.product.update({
          where: { id },
          data: { isActive: false }
        })

        // Clear cache even for soft delete
        await CacheService.del(`product:${id}`)
        await CacheService.delByPrefix('products:')

        return NextResponse.json(
          {
            success: true,
            message: 'Sản phẩm đã có lịch sử giao dịch nên không thể xoá hoàn toàn. Hệ thống đã tự động chuyển sang trạng thái "Ngừng bán".',
            isSoftDeleted: true
          },
          { status: 200 }
        )
      }

      // If it's another error, throw it to be handled by the outer catch
      throw error
    }
  } catch (error) {
    console.error('Error deleting product:', error)

    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error instanceof Error ? error.message : 'Failed to delete product'
        }
      },
      { status: 500 }
    )
  }
}

