import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
    try {
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

        return NextResponse.json({ success: true, data: racks })
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json()
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
            return NextResponse.json({ success: true, data: rack })
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
            return NextResponse.json({ success: true, data: bin })
        }

        return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 })
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }
}
