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

        const invoices = await (prisma.invoice as any).findMany({
            where: { supplierId },
            include: {
                invoiceItems: {
                    include: {
                        product: { select: { name: true } }
                    }
                }
            },
            orderBy: { issueDate: 'desc' }
        })

        return NextResponse.json(createSuccessResponse(invoices))
    } catch (error) {
        console.error('Fetch invoices error:', error)
        return NextResponse.json(createErrorResponse('Failed to fetch invoices', 'SERVER_ERROR'), { status: 500 })
    }
}
