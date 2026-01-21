import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createSuccessResponse, createErrorResponse } from '@/lib/api-types'

/**
 * API for Customers to dispute/reject a worker report
 */
export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const reportId = (await params).id
        const body = await request.json()
        const { reason } = body

        const updated = await (prisma as any).workerReport.update({
            where: { id: reportId },
            data: {
                customerStatus: 'DISPUTED',
                rejectionReason: reason
            },
            include: {
                contractor: {
                    include: { user: true }
                },
                project: true
            }
        })

        // Notify Contractor about the dispute
        if (updated.contractor.user.id) {
            await prisma.notification.create({
                data: {
                    type: 'ALERT',
                    title: '⚠️ Báo cáo bị khiếu nại!',
                    message: `Khách hàng vừa khiếu nại báo cáo từ thợ ${updated.workerName} cho dự án "${updated.project.title}". Lý do: ${reason}`,
                    priority: 'HIGH',
                    userId: updated.contractor.user.id,
                    metadata: {
                        reportId,
                        projectId: updated.projectId
                    }
                } as any
            })
        }

        return NextResponse.json(createSuccessResponse(updated, 'Đã gửi khiếu nại thành công'))
    } catch (error) {
        console.error('Dispute report error:', error)
        return NextResponse.json(createErrorResponse('Internal error', 'SERVER_ERROR'), { status: 500 })
    }
}
