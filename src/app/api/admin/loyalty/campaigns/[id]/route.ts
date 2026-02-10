import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createSuccessResponse, createErrorResponse } from '@/lib/api-types'

// PUT: Cập nhật chiến dịch
export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const body = await request.json()

        const campaign = await prisma.loyaltyCampaign.update({
            where: { id },
            data: {
                ...(body.name && { name: body.name }),
                ...(body.description !== undefined && { description: body.description }),
                ...(body.type && { type: body.type }),
                ...(body.status && { status: body.status }),
                ...(body.multiplier !== undefined && { multiplier: body.multiplier }),
                ...(body.bonusPoints !== undefined && { bonusPoints: body.bonusPoints }),
                ...(body.targetTier !== undefined && { targetTier: body.targetTier }),
                ...(body.targetCustomerIds && { targetCustomerIds: body.targetCustomerIds }),
                ...(body.minOrderAmount !== undefined && { minOrderAmount: body.minOrderAmount }),
                ...(body.startDate && { startDate: new Date(body.startDate) }),
                ...(body.endDate && { endDate: new Date(body.endDate) }),
            }
        })

        return NextResponse.json(
            createSuccessResponse(campaign, 'Cập nhật chiến dịch thành công'),
            { status: 200 }
        )
    } catch (error) {
        console.error('Error updating campaign:', error)
        return NextResponse.json(
            createErrorResponse('Lỗi hệ thống', 'INTERNAL_ERROR'),
            { status: 500 }
        )
    }
}

// DELETE: Xóa chiến dịch
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params

        await prisma.loyaltyCampaign.delete({
            where: { id }
        })

        return NextResponse.json(
            createSuccessResponse(null, 'Xóa chiến dịch thành công'),
            { status: 200 }
        )
    } catch (error) {
        console.error('Error deleting campaign:', error)
        return NextResponse.json(
            createErrorResponse('Lỗi hệ thống', 'INTERNAL_ERROR'),
            { status: 500 }
        )
    }
}
