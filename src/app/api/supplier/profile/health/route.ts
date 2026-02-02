import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyTokenFromRequest } from '@/lib/auth'
import { createSuccessResponse, createErrorResponse } from '@/lib/api-types'

export async function GET(req: NextRequest) {
    try {
        const decoded = await verifyTokenFromRequest(req)
        if (!decoded || decoded.role !== 'SUPPLIER') {
            // For supplier portal, sometimes the decoded object has different structure
            // Let's check for supplierId in decoded
            if (!(decoded as any).supplierId) {
                return NextResponse.json(createErrorResponse('Unauthorized', 'UNAUTHORIZED'), { status: 401 })
            }
        }

        const supplierId = (decoded as any).supplierId || decoded?.userId

        const supplier = await prisma.supplier.findUnique({
            where: { id: supplierId },
            include: {
                _count: {
                    select: { products: true }
                }
            }
        })

        if (!supplier) {
            return NextResponse.json(createErrorResponse('Supplier not found', 'NOT_FOUND'), { status: 404 })
        }

        const missingFields: string[] = []

        if (!supplier.taxId) missingFields.push('taxId')
        if (!supplier.bankName) missingFields.push('bankName')
        if (!supplier.bankAccountNumber) missingFields.push('bankAccountNumber')
        if (!supplier.bankAccountName) missingFields.push('bankAccountName')
        if (!supplier.address) missingFields.push('address')
        if (!supplier.city) missingFields.push('city')

        const productCount = supplier._count.products
        const hasProducts = productCount > 0

        const isComplete = missingFields.length === 0 && hasProducts

        // Update profileComplete status in background if it changed
        const currentStatus = (supplier as any).profileComplete
        if (currentStatus !== isComplete) {
            try {
                await (prisma.supplier as any).update({
                    where: { id: supplierId },
                    data: { profileComplete: isComplete }
                })
            } catch (updateError) {
                console.error('[SUPPLIER_PROFILE_HEALTH] Failed to update status:', updateError)
                // We don't throw here to allow the GET request to return the calculated health
            }
        }

        return NextResponse.json(createSuccessResponse({
            isComplete,
            missingFields,
            productCount,
            hasProducts,
            is2FAEnabled: (supplier as any).is2FAEnabled
        }))

    } catch (error: any) {
        console.error('[SUPPLIER_PROFILE_HEALTH]', error)
        return NextResponse.json(createErrorResponse(error.message, 'SERVER_ERROR'), { status: 500 })
    }
}
