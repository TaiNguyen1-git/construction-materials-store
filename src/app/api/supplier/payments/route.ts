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

        const supplier = await prisma.supplier.findUnique({
            where: { id: supplierId },
            select: {
                currentBalance: true,
                creditLimit: true,
                paymentTerms: true,
                name: true
            }
        })

        if (!supplier) {
            return NextResponse.json(createErrorResponse('Supplier not found', 'NOT_FOUND'), { status: 404 })
        }

        // Get recent payments/transactions
        // Assuming transactions are linked via Purchase Orders or direct Payments
        // We'll fetch Purchase Orders that are unpaid as "Debt" details
        const unpaidOrders = await (prisma.purchaseOrder as any).findMany({
            where: {
                supplierId,
                status: 'RECEIVED', // Only received goods count as debt
                // paymentStatus: { not: 'PAID' } // Assuming this field exists or checking status
            },
            take: 10,
            orderBy: { createdAt: 'desc' }
        })

        return NextResponse.json(createSuccessResponse({
            summary: supplier,
            unpaidTransactions: unpaidOrders // This is a simplification
        }))
    } catch (error) {
        console.error('Fetch payments error:', error)
        return NextResponse.json(createErrorResponse('Failed to fetch payments', 'SERVER_ERROR'), { status: 500 })
    }
}
