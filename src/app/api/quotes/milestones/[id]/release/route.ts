/**
 * API: Release Payment Milestone
 * POST - Customer confirms and releases escrowed payment to contractor
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createSuccessResponse, createErrorResponse } from '@/lib/api-types'
import { saveNotificationForUser } from '@/lib/notification-service'

interface RouteParams {
    params: Promise<{ id: string }>
}

// POST /api/quotes/milestones/[id]/release - Customer releases payment to contractor
export async function POST(request: NextRequest, { params }: RouteParams) {
    try {
        const userId = request.headers.get('x-user-id')
        if (!userId) {
            return NextResponse.json(createErrorResponse('Unauthorized', 'UNAUTHORIZED'), { status: 401 })
        }

        const { id: milestoneId } = await params
        const body = await request.json()
        const { notes, rating } = body // Optional rating for contractor performance

        // Find the milestone
        const milestone = await prisma.paymentMilestone.findUnique({
            where: { id: milestoneId },
            include: {
                quote: {
                    include: {
                        customer: { include: { user: true } },
                        contractor: { include: { user: true } }
                    }
                }
            }
        })

        if (!milestone) {
            return NextResponse.json(createErrorResponse('Không tìm thấy mốc thanh toán', 'NOT_FOUND'), { status: 404 })
        }

        // Verify customer permission
        const customer = await prisma.customer.findFirst({
            where: { userId }
        })

        if (!customer || milestone.quote.customerId !== customer.id) {
            return NextResponse.json(createErrorResponse('Bạn không có quyền thực hiện thao tác này', 'FORBIDDEN'), { status: 403 })
        }

        // Check if milestone is in correct state (PENDING_CONFIRMATION from contractor)
        if (milestone.status !== 'PENDING_CONFIRMATION') {
            return NextResponse.json(createErrorResponse('Mốc thanh toán chưa sẵn sàng để giải ngân', 'INVALID_STATE'), { status: 400 })
        }

        // Update milestone status to released
        const updated = await prisma.paymentMilestone.update({
            where: { id: milestoneId },
            data: {
                status: 'RELEASED',
                paidAt: new Date()
            }
        })

        // Log to quote history
        await prisma.quoteStatusHistory.create({
            data: {
                quoteId: milestone.quoteId,
                userId,
                newStatus: milestone.quote.status,
                notes: `Khách hàng xác nhận giải ngân ${milestone.amount.toLocaleString()}đ cho giai đoạn "${milestone.name}". ${notes || ''}`
            }
        })

        // Check if all milestones are released - if so, mark quote as completed
        const allMilestones = await prisma.paymentMilestone.findMany({
            where: { quoteId: milestone.quoteId }
        })
        const allReleased = allMilestones.every(m => m.status === 'RELEASED')

        if (allReleased) {
            await prisma.quoteRequest.update({
                where: { id: milestone.quoteId },
                data: { status: 'ACCEPTED' } // Or create a COMPLETED status
            })

            // Update contractor trust score (completed project)
            const contractorProfile = await prisma.contractorProfile.findUnique({
                where: { customerId: milestone.quote.contractorId }
            })

            if (contractorProfile) {
                await prisma.contractorProfile.update({
                    where: { id: contractorProfile.id },
                    data: {
                        totalProjectsCompleted: contractorProfile.totalProjectsCompleted + 1
                    }
                })
            }
        }

        // Notify contractor about payment release
        try {
            await saveNotificationForUser({
                type: 'ORDER_UPDATE' as any,
                priority: 'HIGH',
                title: '💰 Tiền đã được giải ngân!',
                message: `Khách hàng ${milestone.quote.customer.user.name || 'Khách hàng'} đã xác nhận hoàn thành giai đoạn "${milestone.name}". Bạn nhận được ${milestone.amount.toLocaleString()}đ.${allReleased ? ' Dự án đã hoàn thành!' : ''}`,
                data: {
                    quoteId: milestone.quoteId,
                    milestoneId,
                    milestoneName: milestone.name,
                    amount: milestone.amount,
                    allCompleted: allReleased
                }
            }, milestone.quote.contractor.userId, 'CUSTOMER')
        } catch (e) {
            console.error('Failed to send notification:', e)
        }

        return NextResponse.json(createSuccessResponse({
            milestone: updated,
            allCompleted: allReleased
        }, allReleased ? 'Dự án đã hoàn thành! Cảm ơn bạn đã sử dụng dịch vụ.' : 'Đã giải ngân thành công.'))

    } catch (error: any) {
        console.error('Release milestone error:', error)
        return NextResponse.json(createErrorResponse('Lỗi máy chủ nội bộ', 'INTERNAL_ERROR'), { status: 500 })
    }
}
