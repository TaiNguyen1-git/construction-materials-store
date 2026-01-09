/**
 * API: Apply to Market Project
 * POST - Submit an application to a project
 * GET - Get applications for a project
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { saveNotificationForUser } from '@/lib/notification-service'

interface RouteParams {
    params: Promise<{ id: string }>
}

export async function GET(request: NextRequest, { params }: RouteParams) {
    try {
        const { id: projectId } = await params

        const applications = await prisma.marketProjectApplication.findMany({
            where: { projectId },
            orderBy: { createdAt: 'desc' }
        })

        return NextResponse.json({
            success: true,
            data: applications
        })

    } catch (error) {
        console.error('Error fetching applications:', error)
        return NextResponse.json({
            success: false,
            error: { code: 'SERVER_ERROR', message: 'Lỗi khi lấy danh sách ứng tuyển' }
        }, { status: 500 })
    }
}

export async function POST(request: NextRequest, { params }: RouteParams) {
    try {
        const { id: projectId } = await params
        const body = await request.json()

        const { contractorId, message, proposedBudget, proposedDays } = body

        // Validation
        if (!contractorId) {
            return NextResponse.json({
                success: false,
                error: { code: 'VALIDATION_ERROR', message: 'Thiếu contractorId' }
            }, { status: 400 })
        }

        if (!message || message.trim().length < 10) {
            return NextResponse.json({
                success: false,
                error: { code: 'VALIDATION_ERROR', message: 'Tin nhắn ứng tuyển phải có ít nhất 10 ký tự' }
            }, { status: 400 })
        }

        // Check if project exists
        const project = await prisma.marketProject.findUnique({
            where: { id: projectId }
        })

        if (!project) {
            return NextResponse.json({
                success: false,
                error: { code: 'NOT_FOUND', message: 'Không tìm thấy dự án' }
            }, { status: 404 })
        }

        // Get contractor info for notification
        const contractor = await prisma.customer.findUnique({
            where: { id: contractorId },
            include: { user: { select: { name: true } } }
        })

        // Get contractor profile separately (linked by customerId)
        const contractorProfile = await prisma.contractorProfile.findUnique({
            where: { customerId: contractorId },
            select: { displayName: true, avgRating: true }
        })

        // Check if already applied
        const existingApplication = await prisma.marketProjectApplication.findFirst({
            where: {
                projectId,
                contractorId
            }
        })

        if (existingApplication) {
            return NextResponse.json({
                success: false,
                error: { code: 'DUPLICATE', message: 'Bạn đã ứng tuyển dự án này rồi' }
            }, { status: 400 })
        }

        // Create application
        const application = await prisma.marketProjectApplication.create({
            data: {
                projectId,
                contractorId,
                message: message.trim(),
                proposedBudget: proposedBudget || null,
                proposedDays: proposedDays || null,
                status: 'PENDING'
            }
        })

        // Send notification to project owner
        if (project.customerId && project.customerId !== 'guest') {
            try {
                // Find the customer's userId
                const projectOwner = await prisma.customer.findUnique({
                    where: { id: project.customerId },
                    select: { userId: true }
                })

                if (projectOwner?.userId) {
                    const contractorName = contractorProfile?.displayName || contractor?.user?.name || 'Nhà thầu'
                    const rating = contractorProfile?.avgRating || 0

                    await saveNotificationForUser({
                        type: 'ORDER_UPDATE' as any,
                        priority: 'HIGH',
                        title: '👷 Có nhà thầu ứng tuyển mới!',
                        message: `${contractorName} (⭐${rating.toFixed(1)}) vừa ứng tuyển dự án "${project.title}"${proposedBudget ? `. Đề xuất: ${proposedBudget.toLocaleString()}đ` : ''}`,
                        data: {
                            projectId,
                            applicationId: application.id,
                            contractorId,
                            contractorName,
                            proposedBudget,
                            proposedDays
                        }
                    }, projectOwner.userId, 'CUSTOMER')
                }
            } catch (notifyError) {
                console.error('Failed to send application notification:', notifyError)
            }
        }

        return NextResponse.json({
            success: true,
            data: application,
            message: 'Đã gửi ứng tuyển thành công!'
        })

    } catch (error) {
        console.error('Error creating application:', error)
        return NextResponse.json({
            success: false,
            error: { code: 'SERVER_ERROR', message: 'Lỗi khi gửi ứng tuyển' }
        }, { status: 500 })
    }
}
