/**
 * Public Worker Report Submission API
 * Validated by Magic Token
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createSuccessResponse, createErrorResponse } from '@/lib/api-types'

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const { token, workerName, photoUrl, notes } = body

        if (!token || !workerName || !photoUrl) {
            return NextResponse.json(createErrorResponse('Thiếu thông tin báo cáo', 'VALIDATION_ERROR'), { status: 400 })
        }

        // Validate token
        const reportToken = await (prisma as any).projectReportToken.findUnique({
            where: { token, isActive: true },
            include: { project: true }
        })

        if (!reportToken) {
            return NextResponse.json(createErrorResponse('Link báo cáo không hợp lệ hoặc đã hết hạn', 'UNAUTHORIZED'), { status: 401 })
        }

        // Create the worker report
        const report = await (prisma as any).workerReport.create({
            data: {
                projectId: reportToken.projectId,
                contractorId: reportToken.contractorId,
                workerName,
                photoUrl,
                notes,
                status: 'PENDING'
            }
        })

        // Notify Contractor
        await prisma.notification.create({
            data: {
                type: 'ORDER_UPDATE',
                title: '👷 Báo cáo mới từ công trường!',
                message: `Thợ ${workerName} vừa gửi ảnh báo cáo cho dự án "${reportToken.project.title}". Vui lòng kiểm tra và duyệt.`,
                priority: 'MEDIUM',
                userId: null, // We'll need to link this correctly or use metadata
                metadata: {
                    reportId: report.id,
                    projectId: reportToken.projectId,
                    contractorUserId: null // We should find the user ID linked to the contractor customer ID
                }
            } as any
        })

        return NextResponse.json(createSuccessResponse(report, 'Đã gửi báo cáo thành công!'))
    } catch (error) {
        console.error('Public report error:', error)
        return NextResponse.json(createErrorResponse('Lỗi gửi báo cáo', 'SERVER_ERROR'), { status: 500 })
    }
}
