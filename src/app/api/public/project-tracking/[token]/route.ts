
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createSuccessResponse, createErrorResponse } from '@/lib/api-types'

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ token: string }> }
) {
    try {
        const { token } = await params

        // 1. Validate Token
        const tokenRecord = await (prisma as any).projectReportToken.findUnique({
            where: { token },
            include: {
                project: true,
                contractor: true // The contractor who owns/shared this
            }
        })

        if (!tokenRecord || !tokenRecord.isActive) {
            return NextResponse.json(createErrorResponse('Link không tồn tại hoặc đã hết hạn', 'NOT_FOUND'), { status: 404 })
        }

        // 2. Fetch Timeline Data
        // - Worker Reports (Approved only ideally, but for MVP let's show all or Approved)
        // - Order Deliveries (Materials arriving)

        const workerReports = await (prisma as any).workerReport.findMany({
            where: {
                projectId: tokenRecord.projectId,
                // status: 'APPROVED' // Uncomment for production
            },
            orderBy: { createdAt: 'desc' }
        })

        // Find orders related to this project? 
        // Currently Order doesn't strictly link to ConstructionProject except via customer/contractor logic.
        // For MVP, we might skip material delivery events unless explicitly linked.

        return NextResponse.json(createSuccessResponse({
            project: {
                title: tokenRecord.project.title,
                address: `${tokenRecord.project.location}, ${tokenRecord.project.city}`,
                status: tokenRecord.project.status,
                startDate: tokenRecord.project.createdAt
            },
            contractor: {
                name: tokenRecord.contractor.name || 'Nhà thầu uy tín',
                phone: tokenRecord.contractor.phone
            },
            timeline: workerReports.map((r: any) => ({
                id: r.id,
                type: 'WORK_REPORT',
                date: r.createdAt,
                title: r.milestoneId ? 'Hoàn thành giai đoạn' : 'Cập nhật tiến độ',
                description: r.notes,
                image: r.photoUrl,
                workerName: r.workerName
            }))
        }))

    } catch (error) {
        console.error('Project Tracking Error:', error)
        return NextResponse.json(createErrorResponse('Lỗi tải dữ liệu dự án', 'SERVER_ERROR'), { status: 500 })
    }
}
