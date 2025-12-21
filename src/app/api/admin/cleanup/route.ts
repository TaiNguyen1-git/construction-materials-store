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
            deletedProducts: 0,
            deletedInventoryItems: 0,
            deletedInventoryMovements: 0
        }

        await prisma.$transaction(async (tx) => {
            // 1. Find inactive products
            const inactiveProducts = await tx.product.findMany({
                where: { isActive: false },
                select: { id: true, name: true }
            })

            const inactiveProductIds = inactiveProducts.map(p => p.id)

            if (inactiveProductIds.length > 0) {
                // 2. Delete inventory movements for inactive products
                const deletedMovements = await tx.inventoryMovement.deleteMany({
                    where: { productId: { in: inactiveProductIds } }
                })
                results.deletedInventoryMovements = deletedMovements.count

                // 3. Delete inventory items for inactive products
                const deletedItems = await tx.inventoryItem.deleteMany({
                    where: { productId: { in: inactiveProductIds } }
                })
                results.deletedInventoryItems = deletedItems.count

                // 4. Delete the inactive products
                const deletedProducts = await tx.product.deleteMany({
                    where: { id: { in: inactiveProductIds } }
                })
                results.deletedProducts = deletedProducts.count
            }

            // 5. Also cleanup orphaned inventory items (where product doesn't exist anymore)
            // Note: This should not happen normally due to cascade deletes, but just in case
            const allProducts = await tx.product.findMany({ select: { id: true } })
            const productIds = allProducts.map(p => p.id)

            const orphanedItems = await tx.inventoryItem.deleteMany({
                where: {
                    productId: { notIn: productIds.length > 0 ? productIds : ['__none__'] }
                }
            })
            results.deletedInventoryItems += orphanedItems.count
        })

        console.log('🧹 Cleanup completed:', results)

        return NextResponse.json(
            createSuccessResponse(results, `Cleanup complete: ${results.deletedProducts} products, ${results.deletedInventoryItems} inventory items deleted`),
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
