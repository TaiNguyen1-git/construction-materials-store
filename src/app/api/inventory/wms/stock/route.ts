import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyTokenFromRequest } from '@/lib/auth'
import { createSuccessResponse, createErrorResponse } from '@/lib/api-types'
import { CacheService } from '@/lib/cache'

/**
 * 🛡️ SECURITY 2026: Protect WMS Stock Routes
 */
async function authorizeWMS(request: NextRequest) {
    const payload = await verifyTokenFromRequest(request)
    if (!payload || !['MANAGER', 'EMPLOYEE'].includes(payload.role)) {
        return null
    }
    return payload
}

export async function POST(request: NextRequest) {
    try {
        const auth = await authorizeWMS(request)
        if (!auth) {
            return NextResponse.json(createErrorResponse('Staff access required', 'FORBIDDEN'), { status: 403 })
        }

        const body = await request.json()
        const { action, inventoryItemId, fromBinId, toBinId, quantity } = body

        if (!action || !inventoryItemId || !toBinId || !quantity) {
            return NextResponse.json(createErrorResponse('Missing required fields', 'BAD_REQUEST'), { status: 400 })
        }

        if (action === 'assign-bin') {
            const link = await (prisma as any).inventoryBinLink.upsert({
                where: {
                    inventoryItemId_binId: {
                        inventoryItemId,
                        binId: toBinId
                    }
                },
                update: {
                    quantity: { increment: quantity }
                },
                create: {
                    inventoryItemId,
                    binId: toBinId,
                    quantity
                }
            })
            await CacheService.del('wms:layout:all')
            return NextResponse.json(createSuccessResponse(link, 'Stock assigned to bin'))
        }

        if (action === 'move-stock') {
            if (!fromBinId) {
                return NextResponse.json(createErrorResponse('Source bin (fromBinId) required', 'BAD_REQUEST'), { status: 400 })
            }

            // Create a transaction to ensure atomic move
            const result = await (prisma as any).$transaction(async (tx: any) => {
                // Decrease from source
                const source = await tx.inventoryBinLink.update({
                    where: {
                        inventoryItemId_binId: {
                            inventoryItemId,
                            binId: fromBinId
                        }
                    },
                    data: {
                        quantity: { decrement: quantity }
                    }
                })

                if (source.quantity < 0) throw new Error('Insufficient stock in source bin')

                // Increase in destination
                const dest = await tx.inventoryBinLink.upsert({
                    where: {
                        inventoryItemId_binId: {
                            inventoryItemId,
                            binId: toBinId
                        }
                    },
                    update: {
                        quantity: { increment: quantity }
                    },
                    create: {
                        inventoryItemId,
                        binId: toBinId,
                        quantity
                    }
                })

                return { source, dest }
            })

            await CacheService.del('wms:layout:all')
            return NextResponse.json(createSuccessResponse(result, 'Stock moved successfully'))
        }

        return NextResponse.json(createErrorResponse('Invalid action', 'BAD_REQUEST'), { status: 400 })
    } catch (error: any) {
        return NextResponse.json(createErrorResponse(error.message, 'INTERNAL_ERROR'), { status: 500 })
    }
}
