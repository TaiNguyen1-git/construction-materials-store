import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyTokenFromRequest } from '@/lib/auth'
import { createSuccessResponse, createErrorResponse } from '@/lib/api-types'
import { CacheService } from '@/lib/cache'

/**
 * 🛡️ SECURITY 2026: Protect WMS Routes
 */
async function authorizeWMS(request: NextRequest) {
    const payload = await verifyTokenFromRequest(request)
    if (!payload || !['MANAGER', 'EMPLOYEE'].includes(payload.role)) {
        return null
    }
    return payload
}

export async function GET(request: NextRequest) {
    try {
        const auth = await authorizeWMS(request)
        if (!auth) {
            return NextResponse.json(createErrorResponse('Unauthorized access to WMS', 'FORBIDDEN'), { status: 403 })
        }

        const cacheKey = 'wms:layout:all'
        const cached = await CacheService.get(cacheKey)
        if (cached) {
            return NextResponse.json(createSuccessResponse(cached), { headers: { 'X-Cache': 'HIT' } })
        }

        const racks = await (prisma as any).warehouseRack.findMany({
            include: {
                bins: {
                    include: {
                        stockItems: {
                            include: {
                                inventoryItem: {
                                    include: {
                                        product: {
                                            select: { name: true, sku: true, unit: true }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        })

        await CacheService.set(cacheKey, racks, 300) // Cache for 5 mins
        return NextResponse.json(createSuccessResponse(racks))
    } catch (error: any) {
        return NextResponse.json(createErrorResponse(error.message, 'INTERNAL_ERROR'), { status: 500 })
    }
}

export async function POST(request: NextRequest) {
    try {
        const auth = await authorizeWMS(request)
        if (!auth || auth.role !== 'MANAGER') {
            return NextResponse.json(createErrorResponse('Manager access required for WMS changes', 'FORBIDDEN'), { status: 403 })
        }

        const body = await request.json()
        const { action, rackId, binCode, name, description, warehouse, type } = body

        if (action === 'create-rack') {
            const rack = await prisma.warehouseRack.create({
                data: {
                    name,
                    description,
                    type: type || 'RACK',
                    warehouse: warehouse || 'Main Warehouse'
                }
            })
            await CacheService.del('wms:layout:all')
            return NextResponse.json(createSuccessResponse(rack, 'Rack created'), { status: 201 })
        }

        if (action === 'create-bin') {
            const bin = await prisma.warehouseBin.create({
                data: {
                    rackId,
                    code: binCode,
                    type: type || 'SHELF_BIN',
                    isActive: true
                }
            })
            await CacheService.del('wms:layout:all')
            return NextResponse.json(createSuccessResponse(bin, 'Bin created'), { status: 201 })
        }

        return NextResponse.json(createErrorResponse('Invalid action', 'BAD_REQUEST'), { status: 400 })
    } catch (error: any) {
        return NextResponse.json(createErrorResponse(error.message, 'INTERNAL_ERROR'), { status: 500 })
    }
}
