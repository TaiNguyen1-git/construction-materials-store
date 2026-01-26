/**
 * API: Complete Payment Milestone
 * POST - Contractor marks a milestone as completed
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createSuccessResponse, createErrorResponse } from '@/lib/api-types'
import { saveNotificationForUser } from '@/lib/notification-service'

interface RouteParams {
    params: Promise<{ id: string }>
}

// POST /api/quotes/milestones/[id]/complete - Contractor marks milestone as completed
export async function POST(request: NextRequest, { params }: RouteParams) {
    try {
        const userId = request.headers.get('x-user-id')
        if (!userId) {
            return NextResponse.json(createErrorResponse('Unauthorized', 'UNAUTHORIZED'), { status: 401 })
        }

        const { id: milestoneId } = await params
        const body = await request.json()
        const { notes, proofImages } = body

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

        // Verify contractor permission
        const contractor = await prisma.customer.findFirst({
            where: { userId }
        })

        if (!contractor || milestone.quote.contractorId !== contractor.id) {
            return NextResponse.json(createErrorResponse('Bạn không có quyền thực hiện thao tác này', 'FORBIDDEN'), { status: 403 })
        }

        // Check if milestone is in correct state (ESCROW_PAID means customer has deposited)
        if (milestone.status !== 'ESCROW_PAID') {
            return NextResponse.json(createErrorResponse('Mốc thanh toán chưa được khách hàng thanh toán', 'INVALID_STATE'), { status: 400 })
        }

        // Use EscrowService to submit evidence
        const { escrowService } = await import('@/lib/escrow-service')
        const result = await escrowService.submitCompletionEvidence(
            milestoneId,
            proofImages?.[0] || '', // Use first image as main evidence
            notes || ''
        )

        if (!result.success) {
            return NextResponse.json(createErrorResponse(result.message, 'INVALID_OPERATION'), { status: 400 })
        }

        // Fetch updated milestone
        const updated = await prisma.paymentMilestone.findUnique({
            where: { id: milestoneId }
        })

        // Log to quote history
        await prisma.quoteStatusHistory.create({
            data: {
                quoteId: milestone.quoteId,
                userId,
                newStatus: milestone.quote.status,
                notes: `Nhà thầu báo hoàn thành giai đoạn "${milestone.name}". ${notes || ''}`
            }
        })

        // Notify customer to confirm and release payment
        try {
            await saveNotificationForUser({
                type: 'ORDER_UPDATE' as any,
                priority: 'HIGH',
                title: '✅ Giai đoạn thi công hoàn thành!',
                message: `Nhà thầu ${milestone.quote.contractor.user.name || 'Nhà thầu'} báo đã hoàn thành giai đoạn "${milestone.name}". Vui lòng xác nhận để giải ngân ${milestone.amount.toLocaleString()}đ.`,
                data: {
                    quoteId: milestone.quoteId,
                    milestoneId,
                    milestoneName: milestone.name,
                    amount: milestone.amount,
                    proofImages
                }
            }, milestone.quote.customer.userId, 'CUSTOMER')
        } catch (e) {
            console.error('Failed to send notification:', e)
        }

        return NextResponse.json(createSuccessResponse(updated, 'Đã báo hoàn thành giai đoạn. Chờ khách hàng xác nhận.'))

    } catch (error: any) {
        console.error('Complete milestone error:', error)
        return NextResponse.json(createErrorResponse('Lỗi máy chủ nội bộ', 'INTERNAL_ERROR'), { status: 500 })
    }
}
