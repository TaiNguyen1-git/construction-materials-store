
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createSuccessResponse, createErrorResponse } from '@/lib/api-types'
import { z } from 'zod'

const updateInventorySchema = z.object({
    minStockLevel: z.number().min(0).optional(),
    maxStockLevel: z.number().positive().optional(),
    reorderPoint: z.number().min(0).optional(),
    location: z.string().optional(),
    notes: z.string().optional(),
})

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
