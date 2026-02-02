import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
    try {
        const body = await req.json()
        const { action, inventoryItemId, fromBinId, toBinId, quantity } = body

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
            return NextResponse.json({ success: true, data: link })
        }

        if (action === 'move-stock') {
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

            return NextResponse.json({ success: true, data: result })
        }

        return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 })
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }
}
