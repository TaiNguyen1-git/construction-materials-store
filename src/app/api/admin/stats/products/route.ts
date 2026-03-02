import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyTokenFromRequest } from '@/lib/auth-middleware-api'
import { createSuccessResponse, createErrorResponse } from '@/lib/api-types'

export async function GET(request: NextRequest) {
    try {
        const user = verifyTokenFromRequest(request)
        if (!user || !['ADMIN', 'MANAGER'].includes(user.role)) {
            return NextResponse.json(createErrorResponse('Unauthorized', 'UNAUTHORIZED'), { status: 401 })
        }

        const [
            totalProducts,
            activeProducts,
            totalSuppliers,
            activeSuppliers,
            inventoryItems
        ] = await Promise.all([
            prisma.product.count(),
            prisma.product.count({ where: { isActive: true } }),
            prisma.supplier.count(),
            prisma.supplier.count({ where: { isActive: true } }),
            prisma.inventoryItem.findMany({
                include: {
                    product: {
                        select: { price: true }
                    }
                }
            })
        ])

        let lowStockProducts = 0
        let totalInventoryValue = 0

        for (const item of inventoryItems) {
            const qty = item.availableQuantity ?? item.quantity ?? 0
            if (qty <= (item.minStockLevel || 0)) {
                lowStockProducts++
            }
            if (item.product?.price) {
                totalInventoryValue += qty * item.product.price
            }
        }

        return NextResponse.json(createSuccessResponse({
            totalProducts,
            activeProducts,
            totalSuppliers,
            activeSuppliers,
            lowStockProducts,
            totalInventoryValue
        }), { status: 200 })

    } catch (error) {
        console.error('Error fetching admin product stats:', error)
        return NextResponse.json(createErrorResponse('Internal server error', 'SERVER_ERROR'), { status: 500 })
    }
}
