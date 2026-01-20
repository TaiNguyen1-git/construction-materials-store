/**
 * API: Export Project Progress Report to PDF
 * POST /api/projects/[id]/export-report
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { generateProgressReportPDF } from '@/lib/professional-pdf-generator'

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params

        // Try to find in ConstructionProject first (main project type for contractors)
        let project = await prisma.constructionProject.findUnique({
            where: { id },
            include: {
                workerReports: {
                    orderBy: { createdAt: 'desc' }
                }
            }
        })

        let projectData: any = null
        let workerReports: any[] = []
        let contractorInfo: any = null
        let customerInfo: any = null

        if (project) {
            projectData = project
            workerReports = (project as any).workerReports || []

            // Get contractor info
            if (project.customerId && project.customerId !== 'guest') {
                const contractor = await prisma.customer.findFirst({
                    where: { id: project.customerId },
                    include: { user: { select: { name: true, phone: true } } }
                })
                if (contractor) {
                    const profile = await prisma.contractorProfile.findFirst({
                        where: { customerId: contractor.id }
                    })
                    contractorInfo = {
                        name: profile?.companyName || profile?.displayName || contractor.user.name,
                        phone: profile?.phone || contractor.user.phone,
                        email: profile?.email
                    }
                }
            }

            customerInfo = {
                name: project.contactName,
                phone: project.contactPhone
            }
        } else {
            // Try Project model (internal projects)
            const internalProject = await (prisma as any).project.findUnique({
                where: { id },
                include: {
                    customer: {
                        include: {
                            user: { select: { name: true, phone: true } }
                        }
                    },
                    contractor: {
                        include: {
                            user: { select: { name: true, phone: true } }
                        }
                    },
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

            projectData = internalProject

            if (internalProject.contractor) {
                const profile = await prisma.contractorProfile.findFirst({
                    where: { customerId: internalProject.contractor.id }
                })
                contractorInfo = {
                    name: profile?.companyName || profile?.displayName || internalProject.contractor.user.name,
                    phone: profile?.phone || internalProject.contractor.user.phone,
                    email: profile?.email
                }
            }

            customerInfo = {
                name: internalProject.customer?.user?.name || 'Khách hàng',
                phone: internalProject.customer?.user?.phone
            }
        }

        // Build phases from worker reports or tasks
        const phases: any[] = []

        // Group worker reports by milestone or date
        const reportsByDate: { [key: string]: any[] } = {}
        workerReports.forEach(report => {
            const dateKey = new Date(report.createdAt).toLocaleDateString('vi-VN')
            if (!reportsByDate[dateKey]) reportsByDate[dateKey] = []
            reportsByDate[dateKey].push(report)
        })

        // Create phases from grouped reports
        const sortedDates = Object.keys(reportsByDate).sort((a, b) =>
            new Date(b.split('/').reverse().join('-')).getTime() -
            new Date(a.split('/').reverse().join('-')).getTime()
        )

        sortedDates.forEach((date, idx) => {
            const reports = reportsByDate[date]
            phases.push({
                name: `Báo cáo ngày ${date}`,
                status: idx === 0 ? 'IN_PROGRESS' : 'COMPLETED',
                progress: idx === 0 ? 80 : 100,
                photos: reports.map(r => ({
                    url: r.photoUrl,
                    caption: r.notes || `Ảnh từ ${r.workerName}`,
                    date: new Date(r.createdAt).toLocaleTimeString('vi-VN')
                })),
                notes: reports.map(r => `${r.workerName}: ${r.notes || 'Báo cáo công việc'}`).join('; ')
            })
        })

        // If no phases from reports, add default phases based on project type
        if (phases.length === 0) {
            const defaultPhases = [
                { name: 'Chuẩn bị công trường', status: 'COMPLETED', progress: 100, photos: [], notes: 'Đã hoàn tất' },
                { name: 'Thi công phần thô', status: 'IN_PROGRESS', progress: 60, photos: [], notes: 'Đang thực hiện' },
                { name: 'Hoàn thiện', status: 'PENDING', progress: 0, photos: [], notes: 'Chờ thực hiện' }
            ]
            phases.push(...defaultPhases)
        }

        // Calculate overall progress
        const overallProgress = Math.round(
            phases.reduce((sum, p) => sum + p.progress, 0) / phases.length
        )

        // Build report data
        const reportData = {
            projectName: projectData.title || projectData.name || 'Công trình xây dựng',
            projectLocation: projectData.location || projectData.address || '',
            reportDate: new Date().toLocaleDateString('vi-VN'),
            contractor: contractorInfo || { name: 'Nhà thầu SmartBuild' },
            customer: customerInfo || { name: 'Khách hàng' },
            phases,
            overallProgress,
            summary: `Công trình đang tiến hành với tiến độ ${overallProgress}%.` +
                (overallProgress >= 80 ? ' Dự kiến hoàn thành đúng tiến độ.' :
                    overallProgress >= 50 ? ' Tiến độ đang được duy trì tốt.' :
                        ' Cần đẩy nhanh tiến độ thi công.')
        }

        // Generate PDF
        const doc = generateProgressReportPDF(reportData)

        // Return PDF as downloadable file
        const pdfBlob = doc.output('blob')
        const pdfBuffer = await pdfBlob.arrayBuffer()

        return new NextResponse(pdfBuffer, {
            headers: {
                'Content-Type': 'application/pdf',
                'Content-Disposition': `attachment; filename="bao-cao-tien-do-${id.slice(-6)}.pdf"`
            }
        })

    } catch (error) {
        console.error('Error generating progress report PDF:', error)
        return NextResponse.json(
            { error: { message: 'Lỗi khi tạo báo cáo PDF' } },
            { status: 500 }
        )
    }
}
