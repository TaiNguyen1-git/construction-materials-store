import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createSuccessResponse, createErrorResponse } from '@/lib/api-types'
import { verifyTokenFromRequest } from '@/lib/auth-middleware-api'

export async function POST(request: NextRequest) {
    try {
        const payload = verifyTokenFromRequest(request)
        if (!payload?.userId) return NextResponse.json(createErrorResponse('Unauthorized', 'UNAUTHORIZED'), { status: 401 })

        const user = await prisma.user.findUnique({
            where: { id: payload.userId },
            include: { customer: true }
        })

        if (!user || !user.customer) {
            return NextResponse.json(createErrorResponse('Profile not found', 'NOT_FOUND'), { status: 404 })
        }

        const body = await request.json()
        const { projectId, milestoneId, photoUrl, workerName, notes } = body

        if (!projectId || !photoUrl) {
            return NextResponse.json(createErrorResponse('Project ID and Photo URL are required', 'VALIDATION_ERROR'), { status: 400 })
        }

        const report = await (prisma as any).workerReport.create({
            data: {
                projectId,
                milestoneId: milestoneId || null,
                contractorId: user.customer.id,
                photoUrl,
                workerName: workerName || user.name || 'Nhà thầu',
                notes: notes || '',
                status: 'APPROVED',
                customerStatus: 'PENDING'
            }
        })

        return NextResponse.json(createSuccessResponse(report, 'Đã gửi báo cáo thành công'))
    } catch (error: any) {
        console.error('Report Creation Error:', error)
        return NextResponse.json(createErrorResponse(error.message, 'SERVER_ERROR'), { status: 500 })
    }
}
