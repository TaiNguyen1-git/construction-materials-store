/**
 * Application Report API - Flag/Report suspicious contractors
 * Compliance & Dispute System
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createSuccessResponse, createErrorResponse } from '@/lib/api-types'

// Report reasons
const REPORT_REASONS = {
    FAKE_INFO: 'Thông tin sai sự thật',
    HARASSMENT: 'Quấy rối',
    FRAUD: 'Gian lận tài chính',
    IMPERSONATION: 'Mạo danh doanh nghiệp',
    SPAM: 'Spam/Quảng cáo',
    OTHER: 'Lý do khác'
}

// POST /api/marketplace/projects/[id]/report - Report an application
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: projectId } = await params
        const body = await request.json()

        const {
            applicationId,
            reason,
            description,
            reporterPhone,
            reporterName
        } = body

        // Validation
        if (!applicationId || !reason) {
            return NextResponse.json(
                createErrorResponse('Vui lòng chọn lý do báo cáo', 'VALIDATION_ERROR'),
                { status: 400 }
            )
        }

        if (!REPORT_REASONS[reason as keyof typeof REPORT_REASONS]) {
            return NextResponse.json(
                createErrorResponse('Lý do không hợp lệ', 'VALIDATION_ERROR'),
                { status: 400 }
            )
        }

        // Get application
        const application = await prisma.projectApplication.findUnique({
            where: { id: applicationId }
        })

        if (!application || application.projectId !== projectId) {
            return NextResponse.json(
                createErrorResponse('Không tìm thấy hồ sơ', 'NOT_FOUND'),
                { status: 404 }
            )
        }

        // Create report record using SupportRequest model (reuse existing)
        const report = await prisma.supportRequest.create({
            data: {
                name: reporterName || 'Ẩn danh',
                phone: reporterPhone || 'Không có',
                message: `[BÁO CÁO VI PHẠM]
Lý do: ${REPORT_REASONS[reason as keyof typeof REPORT_REASONS]}
Mô tả: ${description || 'Không có mô tả'}
Hồ sơ ID: ${applicationId}
Dự án ID: ${projectId}
Nhà thầu ID: ${application.contractorId}`,
                status: 'PENDING',
                priority: 'HIGH'
            }
        })

        // If contractor exists (not guest), decrease trust score
        if (!application.isGuest && application.contractorId) {
            const profile = await prisma.contractorProfile.findFirst({
                where: { customerId: application.contractorId }
            })

            if (profile) {
                // Decrease trust score by 10 per report (min 0)
                const newTrustScore = Math.max(0, (profile.trustScore || 100) - 10)

                await prisma.contractorProfile.update({
                    where: { id: profile.id },
                    data: { trustScore: newTrustScore }
                })

                // If trust score drops below 30, auto-flag for review
                if (newTrustScore < 30) {
                    await prisma.notification.create({
                        data: {
                            type: 'WARNING',
                            title: 'Nhà thầu bị báo cáo nhiều lần',
                            message: `Nhà thầu "${profile.displayName}" có điểm tín nhiệm ${newTrustScore}/100. Cần xem xét.`,
                            priority: 'HIGH',
                            read: false,
                            userId: null,
                            metadata: {
                                contractorId: application.contractorId,
                                trustScore: newTrustScore
                            }
                        }
                    })
                }
            }
        }

        // Notify admin
        await prisma.notification.create({
            data: {
                type: 'WARNING',
                title: 'Có báo cáo vi phạm mới',
                message: `Hồ sơ ứng tuyển bị báo cáo: ${REPORT_REASONS[reason as keyof typeof REPORT_REASONS]}`,
                priority: 'HIGH',
                read: false,
                userId: null,
                metadata: {
                    reportId: report.id,
                    applicationId,
                    projectId
                }
            }
        })

        return NextResponse.json(
            createSuccessResponse({ reportId: report.id }, 'Đã gửi báo cáo. Chúng tôi sẽ xem xét và phản hồi sớm.'),
            { status: 201 }
        )
    } catch (error) {
        console.error('Report application error:', error)
        return NextResponse.json(
            createErrorResponse('Lỗi khi gửi báo cáo', 'SERVER_ERROR'),
            { status: 500 }
        )
    }
}
