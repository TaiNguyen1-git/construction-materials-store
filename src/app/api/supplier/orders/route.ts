import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createSuccessResponse, createErrorResponse } from '@/lib/api-types'

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const supplierId = searchParams.get('supplierId')

        if (!supplierId) {
            return NextResponse.json(createErrorResponse('Missing supplierId', 'VALIDATION_ERROR'), { status: 400 })
        }

        const orders = await (prisma.purchaseOrder as any).findMany({
            where: { supplierId },
            include: {
                purchaseItems: {
                    include: {
                        product: {
                            select: { name: true, sku: true }
                        }
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        })

        return NextResponse.json(createSuccessResponse(orders))
    } catch (error) {
        return NextResponse.json(createErrorResponse('Failed to fetch orders', 'SERVER_ERROR'), { status: 500 })
    }
}
