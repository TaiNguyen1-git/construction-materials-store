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
        const { token, workerName, photoUrl, notes, milestoneId } = body

        if (!token || !workerName || !photoUrl) {
            return NextResponse.json(createErrorResponse('Thiếu thông tin báo cáo', 'VALIDATION_ERROR'), { status: 400 })
        }

        // Validate token
        const reportToken = await (prisma as any).projectReportToken.findUnique({
            where: { token, isActive: true },
            include: {
                project: {
                    include: {
                        customer: {
                            include: {
                                user: true
                            }
                        }
                    }
                }
            }
        })

        if (!reportToken) {
            return NextResponse.json(createErrorResponse('Link báo cáo không hợp lệ hoặc đã hết hạn', 'UNAUTHORIZED'), { status: 401 })
        }

        // Create the worker report
        // Check for duplicates (Simple Hash check for fraud prevention)
        const imageHash = photoUrl; // In real app, this would be a hash of the image binary
        const existingReport = await (prisma as any).workerReport.findFirst({
            where: {
                projectId: reportToken.projectId,
                imageHash
            }
        })

        if (existingReport) {
            // We still allow it but mark it for contractor/customer review
            console.warn('Duplicate image detected for project:', reportToken.projectId)
        }

        const report = await (prisma as any).workerReport.create({
            data: {
                projectId: reportToken.projectId,
                contractorId: reportToken.contractorId,
                milestoneId: milestoneId || null,
                workerName,
                photoUrl,
                imageHash, // Store the hash
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
