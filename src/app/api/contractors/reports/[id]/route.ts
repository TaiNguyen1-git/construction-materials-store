/**
 * Approve or Reject Worker Report
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createSuccessResponse, createErrorResponse } from '@/lib/api-types'
import { verifyTokenFromRequest } from '@/lib/auth-middleware-api'

export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: reportId } = await params
        const { status } = await request.json()
        const payload = verifyTokenFromRequest(request)

        if (!payload?.userId) return NextResponse.json(createErrorResponse('Unauthorized', 'UNAUTHORIZED'), { status: 401 })
        if (!['APPROVED', 'REJECTED'].includes(status)) {
            return NextResponse.json(createErrorResponse('Trạng thái không hợp lệ', 'VALIDATION_ERROR'), { status: 400 })
        }

        const report = await (prisma as any).workerReport.findUnique({
            where: { id: reportId }
        })

        if (!report) return NextResponse.json(createErrorResponse('Báo cáo không tồn tại', 'NOT_FOUND'), { status: 404 })

        // Update the report
        const updated = await (prisma as any).workerReport.update({
            where: { id: reportId },
            data: { status }
        })

        if (status === 'APPROVED') {
            // Logic to potentially link this to a milestone or notify the project owner
            // For now, it just marks it as approved
        }

        return NextResponse.json(createSuccessResponse(updated, 'Cập nhật thành công'))
    } catch (error) {
        return NextResponse.json(createErrorResponse('Lỗi xử lý', 'SERVER_ERROR'), { status: 500 })
    }
}
