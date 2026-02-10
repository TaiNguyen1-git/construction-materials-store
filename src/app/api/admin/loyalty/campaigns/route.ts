import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createSuccessResponse, createErrorResponse } from '@/lib/api-types'

// GET: Danh sách chiến dịch
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const status = searchParams.get('status') || undefined

        const where: any = {}
        if (status) where.status = status

        const campaigns = await prisma.loyaltyCampaign.findMany({
            where,
            orderBy: { createdAt: 'desc' },
        })

        return NextResponse.json(
            createSuccessResponse(campaigns, 'Lấy danh sách chiến dịch thành công'),
            { status: 200 }
        )
    } catch (error) {
        console.error('Error fetching campaigns:', error)
        return NextResponse.json(
            createErrorResponse('Lỗi hệ thống', 'INTERNAL_ERROR'),
            { status: 500 }
        )
    }
}

// POST: Tạo chiến dịch mới
export async function POST(request: NextRequest) {
    try {
        const body = await request.json()

        if (!body.name || !body.type || !body.startDate || !body.endDate) {
            return NextResponse.json(
                createErrorResponse('Thiếu thông tin bắt buộc', 'VALIDATION_ERROR'),
                { status: 400 }
            )
        }

        const campaign = await prisma.loyaltyCampaign.create({
            data: {
                name: body.name,
                description: body.description || '',
                type: body.type,
                status: body.status || 'DRAFT',
                multiplier: body.multiplier || null,
                bonusPoints: body.bonusPoints || null,
                targetTier: body.targetTier || null,
                targetCustomerIds: body.targetCustomerIds || [],
                minOrderAmount: body.minOrderAmount || null,
                startDate: new Date(body.startDate),
                endDate: new Date(body.endDate),
                createdBy: body.createdBy || null,
            }
        })

        return NextResponse.json(
            createSuccessResponse(campaign, 'Tạo chiến dịch thành công'),
            { status: 201 }
        )
    } catch (error) {
        console.error('Error creating campaign:', error)
        return NextResponse.json(
            createErrorResponse('Lỗi hệ thống', 'INTERNAL_ERROR'),
            { status: 500 }
        )
    }
}
