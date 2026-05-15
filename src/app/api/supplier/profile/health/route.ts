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

        const supplierId = (decoded as any).supplierId
        const userId = decoded?.userId

        // Xây dựng điều kiện tìm kiếm hợp lệ
        const where: any = {}
        if (supplierId && supplierId.length === 24) {
            where.id = supplierId
        } else if (userId && userId.length === 24) {
            where.userId = userId
        } else {
            return NextResponse.json(createErrorResponse('Invalid session', 'UNAUTHORIZED'), { status: 401 })
        }

        const supplier = await prisma.supplier.findFirst({
            where,
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

        // Cập nhật trạng thái profileComplete nếu có thay đổi
        if (supplier.profileComplete !== isComplete) {
            try {
                await prisma.supplier.update({
                    where: { id: supplier.id },
                    data: { profileComplete: isComplete }
                })
            } catch (updateError) {
                console.error('[SUPPLIER_PROFILE_HEALTH] Failed to update status:', updateError)
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
