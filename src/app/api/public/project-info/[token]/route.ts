import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createSuccessResponse, createErrorResponse } from '@/lib/api-types'

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ token: string }> }
) {
    try {
        const { token } = await params

        const reportToken = await (prisma as any).projectReportToken.findUnique({
            where: { token, isActive: true },
            include: {
                project: true
            }
        })

        if (!reportToken) {
            return NextResponse.json(createErrorResponse('Mã báo cáo không tồn tại hoặc đã hết hạn', 'NOT_FOUND'), { status: 404 })
        }

        // Milestones not currently supported for this project type
        const milestones = []

        return NextResponse.json(createSuccessResponse({
            projectName: reportToken.project.title,
            projectId: reportToken.projectId,
            milestones: milestones.map((m: any) => ({
                id: m.id,
                name: m.name,
                status: m.status
            }))
        }))

    } catch (error) {
        console.error('Error fetching public project info:', error)
        return NextResponse.json(createErrorResponse('Lỗi máy chủ', 'SERVER_ERROR'), { status: 500 })
    }
}
