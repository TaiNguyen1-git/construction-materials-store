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
                status: 'APPROVED'
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

        // Mock AI Summary if requested
        let aiSummary = ""
        if (includeAI) {
            aiSummary = `Dự án "${project.title || project.name}" hiện đang đạt tiến độ khoảng 65%. Các hạng mục thô đã hoàn thành 90%, đang chuyển sang giai đoạn hoàn thiện. Tình trạng vật tư ổn định, các báo cáo hàng ngày từ hiện trường cho thấy chất lượng thi công đạt chuẩn.`
        }

        const workerReports = (project as any).workerReports || []
        const materialRequests = (project as any).siteMaterialRequests || []

        // Calculate overall progress
        const overallProgress = phases.length > 0
            ? Math.round(phases.reduce((sum, p) => sum + p.progress, 0) / phases.length)
            : 0

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
