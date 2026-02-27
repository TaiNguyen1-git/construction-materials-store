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
        const { token, workerName, photoUrl, notes, milestoneId, imageHash, pHash, lat, lng, takenAt } = body

        if (!token || !workerName || !photoUrl) {
            return NextResponse.json(createErrorResponse('Thiếu thông tin báo cáo', 'VALIDATION_ERROR'), { status: 400 })
        }

        // Validate token
        const reportToken = await (prisma as any).projectReportToken.findUnique({
            where: { token, isActive: true },
            include: {
                project: true
            }
        })

        if (!reportToken) {
            return NextResponse.json(createErrorResponse('Link báo cáo không hợp lệ hoặc đã hết hạn', 'UNAUTHORIZED'), { status: 401 })
        }

        // --- AI Anti-Fraud & Verification ---

        // 1. GPS Verification (Check if photo was taken at the site)
        // ConstructionProject model needs lat/lng. We get it from the project relation.
        const project = reportToken.project;
        if (project?.lat && project?.lng && lat && lng) {
            const R = 6371e3 // Earth radius in meters
            const φ1 = (project.lat * Math.PI) / 180
            const φ2 = (lat * Math.PI) / 180
            const Δφ = ((lat - project.lat) * Math.PI) / 180
            const Δλ = ((lng - project.lng) * Math.PI) / 180

            const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
                Math.cos(φ1) * Math.cos(φ2) *
                Math.sin(Δλ / 2) * Math.sin(Δλ / 2)
            const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
            const distance = R * c // distance in meters

            if (distance > 300) { // Limit to 300m radius
                return NextResponse.json(createErrorResponse(
                    `Vị trí không khớp (${Math.round(distance)}m). Vui lòng gửi ảnh chụp tại công trình.`,
                    'LOCATION_MISMATCH'
                ), { status: 400 })
            }
        }

        // 2. Duplicate Detection (Strict Hash & Visual pHash)
        if (imageHash || pHash) {
            const existingReport = await (prisma as any).workerReport.findFirst({
                where: {
                    projectId: reportToken.projectId,
                    OR: [
                        imageHash ? { imageHash } : {},
                        pHash ? { pHash } : {}
                    ]
                }
            })

            if (existingReport) {
                const reason = existingReport.imageHash === imageHash ? 'ảnh cũ' : 'ảnh quá giống ảnh cũ'
                return NextResponse.json(createErrorResponse(
                    `Phát hiện gian lận: Hình ảnh này đã được sử dụng (${reason}).`,
                    'FRAUD_DETECTED'
                ), { status: 400 })
            }
        }
        // ---------------------------

        // Create the worker report
        const report = await (prisma as any).workerReport.create({
            data: {
                projectId: reportToken.projectId,
                contractorId: reportToken.contractorId,
                milestoneId: milestoneId || null,
                workerName,
                photoUrl,
                imageHash: imageHash || null,
                pHash: pHash || null,
                lat: lat ? parseFloat(lat) : null,
                lng: lng ? parseFloat(lng) : null,
                takenAt: takenAt ? new Date(takenAt) : null,
                notes,
                status: 'PENDING'
            }
        })

        // 1. Notify Contractor (as before)
        // Find contractor's user ID (the one who generated the token)
        const contractorCustomer = await prisma.customer.findUnique({
            where: { id: reportToken.contractorId },
            select: { userId: true }
        })

        if (contractorCustomer?.userId) {
            await prisma.notification.create({
                data: {
                    type: 'ORDER_UPDATE',
                    title: '👷 Báo cáo mới từ công trường!',
                    message: `Thợ ${workerName} vừa gửi ảnh báo cáo cho dự án "${reportToken.project.title}".`,
                    priority: 'MEDIUM',
                    userId: contractorCustomer.userId,
                    metadata: {
                        reportId: report.id,
                        projectId: reportToken.projectId
                    }
                } as any
            })
        }

        // 2. Notify Customer if milestone is associated (Smart Milestone Release flow)
        if (milestoneId) {
            const milestone = await (prisma as any).paymentMilestone.findUnique({
                where: { id: milestoneId }
            })

            const customerUserId = reportToken.project.customer.userId

            if (customerUserId) {
                await prisma.notification.create({
                    data: {
                        type: 'SUCCESS',
                        title: '🏗️ Giai đoạn thi công hoàn tất!',
                        message: `Giai đoạn "${milestone?.name || 'mới'}" của dự án "${reportToken.project.title}" đã có báo cáo hoàn thành. Vui lòng kiểm tra và xác nhận giải ngân.`,
                        priority: 'HIGH',
                        userId: customerUserId,
                        metadata: {
                            reportId: report.id,
                            projectId: reportToken.projectId,
                            milestoneId: milestoneId,
                            action: 'RELEASE_PAYMENT'
                        }
                    } as any
                })
            }
        }

        return NextResponse.json(createSuccessResponse(report, 'Đã gửi báo cáo thành công!'))
    } catch (error) {
        console.error('Public report error:', error)
        return NextResponse.json(createErrorResponse('Lỗi gửi báo cáo', 'SERVER_ERROR'), { status: 500 })
    }
}
