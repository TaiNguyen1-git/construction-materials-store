import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createSuccessResponse, createErrorResponse } from '@/lib/api-types'

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const { token, workerName, items, notes, priority } = body

        if (!token || !workerName || !items || !Array.isArray(items)) {
            return NextResponse.json(createErrorResponse('Thiếu thông tin yêu cầu', 'VALIDATION_ERROR'), { status: 400 })
        }

        // Validate token
        const reportToken = await (prisma as any).projectReportToken.findUnique({
            where: { token, isActive: true },
            include: { project: true }
        })

        if (!reportToken) {
            return NextResponse.json(createErrorResponse('Mã báo cáo không hợp lệ', 'UNAUTHORIZED'), { status: 401 })
        }

        // Create material request
        const request_data = await (prisma as any).siteMaterialRequest.create({
            data: {
                projectId: reportToken.projectId,
                contractorId: reportToken.contractorId,
                workerName,
                items,
                notes,
                priority: priority || 'MEDIUM',
                status: 'PENDING'
            }
        })

        // Notify Contractor
        const contractorCustomer = await prisma.customer.findUnique({
            where: { id: reportToken.contractorId },
            select: { userId: true }
        })

        if (contractorCustomer?.userId) {
            await prisma.notification.create({
                data: {
                    type: 'WARNING',
                    title: '📦 Yêu cầu vật tư mới!',
                    message: `Thợ ${workerName} vừa gửi yêu cầu vật tư cho dự án "${reportToken.project.title}".`,
                    priority: 'HIGH',
                    userId: contractorCustomer.userId,
                    metadata: {
                        requestId: request_data.id,
                        projectId: reportToken.projectId
                    }
                } as any
            })
        }

        return NextResponse.json(createSuccessResponse(request_data, 'Đã gửi yêu cầu vật tư thành công!'))
    } catch (error) {
        console.error('Material request error:', error)
        return NextResponse.json(createErrorResponse('Lỗi máy chủ', 'SERVER_ERROR'), { status: 500 })
    }
}
