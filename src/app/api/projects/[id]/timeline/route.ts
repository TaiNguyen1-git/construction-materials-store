/**
 * API: Project Timeline Data
 * GET /api/projects/[id]/timeline
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const { searchParams } = new URL(request.url)
        const includeAI = searchParams.get('ai') === 'true'

        // Fetch project with all related data
        let project = await (prisma as any).constructionProject.findUnique({
            where: { id },
            include: {
                workerReports: {
                    orderBy: { createdAt: 'desc' },
                    include: {
                        milestone: true
                    }
                },
                siteMaterialRequests: {
                    orderBy: { createdAt: 'desc' }
                }
            }
        })

        if (!project) {
            // Try internal Project model as fallback
            const internalProject = await (prisma as any).project.findUnique({
                where: { id },
                include: {
                    projectTasks: {
                        orderBy: { createdAt: 'desc' }
                    }
                }
            })

            if (!internalProject) {
                return NextResponse.json(
                    { error: { message: 'Không tìm thấy dự án' } },
                    { status: 404 }
                )
            }
            project = internalProject
        }

        // Get related quote milestones if any
        let quoteMilestones: any[] = []
        const quotes = await (prisma as any).quoteRequest.findMany({
            where: {
                projectId: id,
                status: 'ACCEPTED'
            },
            include: {
                milestones: true
            }
        })

        if (quotes.length > 0) {
            quoteMilestones = quotes.flatMap((q: any) => q.milestones)
        }

        // Build timeline phases
        const phases = buildTimelinePhases(project, quoteMilestones)

        // Calculate overall progress
        const overallProgress = phases.length > 0
            ? Math.round(phases.reduce((sum, p) => sum + p.progress, 0) / phases.length)
            : 0

        // Build a semi-dynamic AI Summary based on real metrics
        let aiSummary = ""
        if (includeAI) {
            const reportCount = (project as any).workerReports?.length || 0;
            const materialCount = (project as any).siteMaterialRequests?.length || 0;
            
            if (overallProgress === 0) {
                aiSummary = `Dự án "${project.title || project.name}" vừa mới được khởi tạo và đang ở giai đoạn chuẩn bị. Hiện tại chưa ghi nhận báo cáo thi công từ hiện trường. Cần tập trung chuẩn bị vật tư và đội ngũ nhân sự để bắt đầu các giai đoạn đầu tiên.`
            } else if (overallProgress < 30) {
                aiSummary = `Dự án "${project.title || project.name}" đã hoàn thành khoảng ${overallProgress}% khối lượng công việc. Các báo cáo gần đây (${reportCount} báo cáo) cho thấy tiến độ đang ở những bước đầu. Tình hình vật tư (${materialCount} yêu cầu) cần được theo dõi sát sao để đảm bảo không gián đoạn.`
            } else if (overallProgress < 80) {
                aiSummary = `Dự án "${project.title || project.name}" đang thi công ổn định với tiến độ đạt ${overallProgress}%. Phần thô cơ bản đã vào guồng, đội ngũ thi công đã gửi ${reportCount} báo cáo chi tiết. Chất lượng công trình đang được kiểm soát tốt thông qua các mốc thanh toán đã giải ngân.`
            } else {
                aiSummary = `Dự án "${project.title || project.name}" đang đi vào giai đoạn hoàn thiện cuối cùng với tiến độ ấn tượng: ${overallProgress}%. Hầu hết các hạng mục chính đã hoàn tất. Cần rà soát kỹ các chi tiết hoàn thiện để chuẩn bị bàn giao cho chủ đầu tư.`
            }
        }

        const workerReports = (project as any).workerReports || []
        const materialRequests = (project as any).siteMaterialRequests || []

        return NextResponse.json({
            success: true,
            data: {
                id: project.id,
                title: project.title || project.name,
                status: project.status,
                overallProgress,
                phases,
                summary: aiSummary,
                totalReports: workerReports.length,
                totalMaterialRequests: materialRequests.length,
                lastUpdated: workerReports[0]?.createdAt || project.updatedAt
            }
        })

    } catch (error) {
        console.error('Error fetching project timeline:', error)
        return NextResponse.json(
            { error: { message: 'Lỗi khi tải dòng thời gian dự án' } },
            { status: 500 }
        )
    }
}

function buildTimelinePhases(project: any, milestones: any[]) {
    // This is a simplified logic to combine milestones, tasks, and reports into phases
    const phases: any[] = []

    // 1. Map milestones to phases
    milestones.forEach(m => {
        phases.push({
            id: m.id,
            name: m.name,
            type: 'MILESTONE',
            status: m.status,
            progress: m.status === 'RELEASED' ? 100 : (m.status === 'ESCROW_PAID' ? 50 : 0),
            date: m.paidAt || m.createdAt,
            amount: m.amount
        })
    })

    // 2. Map recent worker reports as events
    const reports = project.workerReports || []
    reports.slice(0, 5).forEach((r: any) => {
        phases.push({
            id: r.id,
            name: `Báo cáo: ${r.notes || 'Công việc hiện trường'}`,
            type: 'REPORT',
            status: r.status,
            progress: 100,
            date: r.createdAt,
            photo: r.photoUrl,
            worker: r.workerName
        })
    })

    // Sort by date descending
    return phases.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
}
