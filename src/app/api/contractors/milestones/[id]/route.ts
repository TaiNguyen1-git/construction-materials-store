import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createSuccessResponse, createErrorResponse } from '@/lib/api-types'
import { verifyTokenFromRequest } from '@/lib/auth-middleware-api'

export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: milestoneId } = await params
        const payload = verifyTokenFromRequest(request)
        if (!payload?.userId) return NextResponse.json(createErrorResponse('Unauthorized', 'UNAUTHORIZED'), { status: 401 })

        const { status } = await request.json()
        if (!status) return NextResponse.json(createErrorResponse('Status is required', 'VALIDATION_ERROR'), { status: 400 })

        // Check if milestone exists and contractor is owner
        const milestone = await (prisma as any).paymentMilestone.findUnique({
            where: { id: milestoneId },
            include: {
                quote: { select: { contractorId: true } }
            }
        })

        if (!milestone) return NextResponse.json(createErrorResponse('Milestone not found', 'NOT_FOUND'), { status: 404 })

        const customer = await prisma.customer.findFirst({ where: { userId: payload.userId } })
        if (!customer || milestone.quote.contractorId !== customer.id) {
            return NextResponse.json(createErrorResponse('Forbidden', 'FORBIDDEN'), { status: 403 })
        }

        const updated = await (prisma as any).paymentMilestone.update({
            where: { id: milestoneId },
            data: {
                status,
                updatedAt: new Date()
            }
        })

        return NextResponse.json(createSuccessResponse(updated, 'Đã cập nhật trạng thái milestone'))
    } catch (error: any) {
        console.error('Milestone Update Error:', error)
        return NextResponse.json(createErrorResponse(error.message, 'SERVER_ERROR'), { status: 500 })
    }
}
