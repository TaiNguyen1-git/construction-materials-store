import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createSuccessResponse, createErrorResponse } from '@/lib/api-types'

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const supplierId = searchParams.get('supplierId')

        if (!supplierId) {
            return NextResponse.json(createErrorResponse('Missing supplierId'), { status: 400 })
        }

        const returns = await prisma.purchaseReturn.findMany({
            where: { supplierId },
            include: {
                purchaseOrder: {
                    select: { orderNumber: true }
                },
                items: {
                    include: {
                        product: {
                            select: {
                                name: true,
                                sku: true
                            }
                        }
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        })

        return NextResponse.json(createSuccessResponse(returns))
    } catch (error) {
        console.error('Fetch returns error:', error)
        return NextResponse.json(createErrorResponse('Server error: ' + (error as Error).message), { status: 500 })
    }
}
