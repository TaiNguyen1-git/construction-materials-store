/**
 * Project Contract & Milestones API
 * Creates payment milestones when contractor is selected
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createSuccessResponse, createErrorResponse } from '@/lib/api-types'
import { verifyTokenFromRequest } from '@/lib/auth-middleware-api'

// POST - Create contract with milestones after selecting contractor
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: projectId } = await params
        const payload = verifyTokenFromRequest(request)

        if (!payload?.userId) {
            return NextResponse.json(createErrorResponse('Unauthorized', 'UNAUTHORIZED'), { status: 401 })
        }

        const body = await request.json()
        const { applicationId, milestones, totalAmount } = body

        // Validate milestones
        if (!milestones || !Array.isArray(milestones) || milestones.length === 0) {
            return NextResponse.json(
                createErrorResponse('Cần ít nhất 1 giai đoạn thanh toán', 'VALIDATION_ERROR'),
                { status: 400 }
            )
        }

        // Check total percentage = 100%
        const totalPercentage = milestones.reduce((sum: number, m: any) => sum + (Number(m.percentage) || 0), 0)
        if (Math.abs(totalPercentage - 100) > 0.01) {
            return NextResponse.json(
                createErrorResponse('Tổng % các giai đoạn phải bằng 100%', 'VALIDATION_ERROR'),
                { status: 400 }
            )
        }

        // Get project and application
        const project = await prisma.constructionProject.findUnique({
            where: { id: projectId }
        })

        if (!project) {
            return NextResponse.json(createErrorResponse('Không tìm thấy dự án', 'NOT_FOUND'), { status: 404 })
        }

        const application = await prisma.projectApplication.findUnique({
            where: { id: applicationId }
        })

        if (!application || application.projectId !== projectId) {
            return NextResponse.json(createErrorResponse('Không tìm thấy hồ sơ ứng tuyển', 'NOT_FOUND'), { status: 404 })
        }

        // Get or find customer
        const customer = await prisma.customer.findFirst({
            where: { userId: payload.userId }
        })

        if (!customer) {
            return NextResponse.json(createErrorResponse('Không tìm thấy thông tin khách hàng', 'NOT_FOUND'), { status: 404 })
        }

        if (!application.contractorId) {
            return NextResponse.json(createErrorResponse('Hồ sơ không có thông tin nhà thầu', 'VALIDATION_ERROR'), { status: 400 })
        }

        // Create QuoteRequest to hold milestones
        const quote = await prisma.quoteRequest.create({
            data: {
                customerId: customer.id,
                contractorId: application.contractorId,
                projectId: projectId,
                details: `Hợp đồng: ${project.title} - ${application.message.slice(0, 100)}...`,
                amount: Number(totalAmount) || application.proposedBudget || 0,
                status: 'ACCEPTED',
                metadata: {
                    projectId,
                    applicationId,
                    projectTitle: project.title,
                    source: 'marketplace'
                }
            } as any
        }) as any

        // Create milestones
        const createdMilestones = await Promise.all(
            milestones.map(async (m: any, index: number) => {
                const amount = ((m.percentage / 100) * (totalAmount || application.proposedBudget || 0))
                return prisma.paymentMilestone.create({
                    data: {
                        quoteId: quote.id,
                        name: m.name,
                        percentage: m.percentage,
                        amount: Math.round(amount),
                        order: index + 1,
                        status: 'PENDING'
                    }
                })
            })
        )

        // Update application status
        await prisma.projectApplication.update({
            where: { id: applicationId },
            data: {
                status: 'SELECTED',
                isContactUnlocked: true
            }
        })

        // Close other applications
        await prisma.projectApplication.updateMany({
            where: {
                projectId,
                id: { not: applicationId },
                status: { notIn: ['REJECTED', 'CLOSED'] }
            },
            data: { status: 'CLOSED' }
        })

        // Update project status
        await prisma.constructionProject.update({
            where: { id: projectId },
            data: { status: 'IN_PROGRESS' }
        })

        // Create notification for contractor
        if (application.contractorId) {
            await prisma.notification.create({
                data: {
                    type: 'ORDER_UPDATE',
                    title: '🎉 Bạn đã được chọn làm dự án!',
                    message: `Chúc mừng! Bạn đã được chọn cho dự án "${project.title}". Xem chi tiết hợp đồng và các giai đoạn thanh toán.`,
                    priority: 'HIGH',
                    read: false,
                    userId: null,
                    metadata: {
                        projectId,
                        quoteId: quote.id,
                        contractorId: application.contractorId
                    }
                }
            })
        }

        return NextResponse.json(
            createSuccessResponse({
                quote,
                milestones: createdMilestones,
                totalAmount: totalAmount || application.proposedBudget
            }, 'Đã tạo hợp đồng và lịch thanh toán'),
            { status: 201 }
        )
    } catch (error) {
        console.error('Create contract error:', error)
        return NextResponse.json(createErrorResponse('Lỗi tạo hợp đồng', 'SERVER_ERROR'), { status: 500 })
    }
}

// GET - Get contract details and milestones for a project
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: projectId } = await params

        // Find quote linked to this project
        const quotes = await prisma.quoteRequest.findMany({
            where: {
                projectId: projectId,
                status: 'ACCEPTED'
            },
            include: {
                milestones: {
                    orderBy: { order: 'asc' }
                }
            }
        })

        if (quotes.length === 0) {
            return NextResponse.json(
                createSuccessResponse({ contract: null, milestones: [] }, 'Chưa có hợp đồng'),
                { status: 200 }
            )
        }

        const contract = quotes[0]
        const milestones = (contract as any).milestones || []

        const totalPaid = milestones
            .filter((m: any) => m.status === 'RELEASED')
            .reduce((sum: number, m: any) => sum + (m.amount || 0), 0)

        const totalEscrow = milestones
            .filter((m: any) => m.status === 'ESCROW_PAID')
            .reduce((sum: number, m: any) => sum + (m.amount || 0), 0)

        return NextResponse.json(
            createSuccessResponse({
                contract: {
                    id: contract.id,
                    title: (contract as any).metadata?.projectTitle || 'Hợp đồng dự án',
                    amount: (contract as any).amount || 0,
                    status: contract.status
                },
                milestones: milestones,
                summary: {
                    total: (contract as any).amount || 0,
                    paid: totalPaid,
                    escrow: totalEscrow,
                    remaining: (Number((contract as any).amount) || 0) - totalPaid - totalEscrow
                }
            }, 'Chi tiết hợp đồng'),
            { status: 200 }
        )
    } catch (error) {
        console.error('Get contract error:', error)
        return NextResponse.json(createErrorResponse('Lỗi tải hợp đồng', 'SERVER_ERROR'), { status: 500 })
    }
}
