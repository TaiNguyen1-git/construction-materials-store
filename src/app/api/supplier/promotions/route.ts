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

        const prismaAny = prisma as any
        const model = prismaAny.supplierPromotion || prismaAny.supplier_promotion || prismaAny.SupplierPromotion

        if (!model) {
            throw new Error('SupplierPromotion model not found in Prisma client.')
        }

        const promotions = await model.findMany({
            where: { supplierId },
            orderBy: { createdAt: 'desc' }
        })

        return NextResponse.json(createSuccessResponse(promotions))
    } catch (error) {
        console.error('Fetch promotions error:', error)
        return NextResponse.json(createErrorResponse('Server error'), { status: 500 })
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const { supplierId, name, description, discountPercent, minOrderAmount, startDate, endDate, appliedProducts } = body

        const promo = await (prisma as any).supplierPromotion.create({
            data: {
                supplierId,
                name,
                description,
                discountPercent,
                minOrderAmount,
                startDate: new Date(startDate),
                endDate: new Date(endDate),
                appliedProducts,
                status: 'PENDING'
            }
        })

        return NextResponse.json(createSuccessResponse(promo, 'Đã gửi yêu cầu khuyến mãi'))
    } catch (error) {
        console.error('Create promotion error:', error)
        return NextResponse.json(createErrorResponse('Server error'), { status: 500 })
    }
}
