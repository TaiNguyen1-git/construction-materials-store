import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createSuccessResponse, createErrorResponse } from '@/lib/api-types'

// POST /api/admin/cleanup - Cleanup orphaned data (inactive products, orphan inventory items)
export async function POST(request: NextRequest) {
    try {
        // Check admin permission
        const userRole = request.headers.get('x-user-role')
        if (userRole !== 'MANAGER') {
            return NextResponse.json(
                createErrorResponse('Manager access required', 'FORBIDDEN'),
                { status: 403 }
            )
        }

        const results = {
            deletedInventoryItems: 0,
            deletedInventoryMovements: 0,
            deletedProducts: 0,
            skippedProducts: 0,
            errors: [] as string[]
        }

        // 1. Find inactive products
        const inactiveProducts = await prisma.product.findMany({
            where: { isActive: false },
            select: { id: true, name: true }
        })

        // 2. Delete inventory data for each inactive product
        for (const product of inactiveProducts) {
            try {
                // Delete inventory movements
                const deletedMovements = await prisma.inventoryMovement.deleteMany({
                    where: { productId: product.id }
                })
                results.deletedInventoryMovements += deletedMovements.count

                // Delete inventory items
                const deletedItems = await prisma.inventoryItem.deleteMany({
                    where: { productId: product.id }
                })
                results.deletedInventoryItems += deletedItems.count

                // Try to delete the product (may fail if has order history)
                try {
                    await prisma.product.delete({
                        where: { id: product.id }
                    })
                    results.deletedProducts++
                } catch (e: any) {
                    // Product has order history, can't delete - just leave as inactive
                    results.skippedProducts++
                    results.errors.push(`${product.name}: has order history, kept as inactive`)
                }
            } catch (e: any) {
                results.errors.push(`${product.name}: ${e.message}`)
            }
        }

        console.log('🧹 Cleanup completed:', results)

        return NextResponse.json(
            createSuccessResponse(results, `Cleanup complete: ${results.deletedProducts} products deleted, ${results.skippedProducts} skipped`),
            { status: 200 }
        )

    } catch (error: any) {
        console.error('Cleanup error:', error)
        return NextResponse.json(
            createErrorResponse(error.message, 'INTERNAL_ERROR'),
            { status: 500 }
        )
    }
}

// GET /api/admin/cleanup - Preview what will be cleaned up
export async function GET(request: NextRequest) {
    try {
        // Check admin permission
        const userRole = request.headers.get('x-user-role')
        if (!['MANAGER', 'EMPLOYEE'].includes(userRole || '')) {
            return NextResponse.json(
                createErrorResponse('Admin access required', 'FORBIDDEN'),
                { status: 403 }
            )
        }

        // Preview data to be cleaned
        const inactiveProducts = await prisma.product.findMany({
            where: { isActive: false },
            select: { id: true, name: true, sku: true }
        })

        const inventoryItemsForInactive = await prisma.inventoryItem.count({
            where: { product: { isActive: false } }
        })

        return NextResponse.json(
            createSuccessResponse({
                inactiveProducts: inactiveProducts,
                inactiveProductCount: inactiveProducts.length,
                inventoryItemsToDelete: inventoryItemsForInactive,
                warning: 'POST to this endpoint to permanently delete this data'
            }),
            { status: 200 }
        )

    } catch (error: any) {
        console.error('Cleanup preview error:', error)
        return NextResponse.json(
            createErrorResponse(error.message, 'INTERNAL_ERROR'),
            { status: 500 }
        )
    }
}
