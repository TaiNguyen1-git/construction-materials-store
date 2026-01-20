/**
 * Milestone Action API
 * Contractor: Complete & Upload Evidence
 * Owner: Approve & Release Payment (Escrow -> Released)
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createSuccessResponse, createErrorResponse } from '@/lib/api-types'
import { verifyTokenFromRequest } from '@/lib/auth-middleware-api'

export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> } // milestoneId
) {
    try {
        const { id: milestoneId } = await params
        const payload = verifyTokenFromRequest(request)
        if (!payload?.userId) return NextResponse.json(createErrorResponse('Unauthorized', 'UNAUTHORIZED'), { status: 401 })

        const body = await request.json()
        const { action, evidenceImage, evidenceNote } = body

        const milestone = await prisma.paymentMilestone.findUnique({
            where: { id: milestoneId },
            include: { quote: true }
        })

        if (!milestone) return NextResponse.json(createErrorResponse('Không tìm thấy giai đoạn', 'NOT_FOUND'), { status: 404 })

        const quote = milestone.quote

        // Find customer and contractor profiles to check permissions
        const customer = await prisma.customer.findFirst({ where: { userId: payload.userId } })

        if (action === 'COMPLETE') {
            // Only contractor can complete
            if (quote.contractorId !== customer?.id) {
                return NextResponse.json(createErrorResponse('Chỉ nhà thầu mới có thể báo cáo hoàn thành', 'FORBIDDEN'), { status: 403 })
            }

            const updated = await prisma.paymentMilestone.update({
                where: { id: milestoneId },
                data: {
                    status: 'COMPLETED',
                    evidenceUrl: evidenceImage || null,
                    evidenceNotes: evidenceNote || null
                } as any
            }) as any

            // Notification to Owner
            await prisma.notification.create({
                data: {
                    type: 'ORDER_UPDATE',
                    title: '📸 Nghiệm thu giai đoạn: ' + milestone.name,
                    message: `Nhà thầu đã gửi ảnh nghiệm thu cho giai đoạn "${milestone.name}". Vui lòng kiểm tra và giải ngân.`,
                    priority: 'HIGH',
                    userId: quote.customerId, // Send to project owner
                    metadata: { milestoneId, quoteId: quote.id }
                }
            })

            return NextResponse.json(createSuccessResponse(updated, 'Đã gửi báo cáo hoàn thành'))
        }

        if (action === 'RELEASE') {
            // Only owner can release
            if (quote.customerId !== customer?.id) {
                return NextResponse.json(createErrorResponse('Chỉ chủ nhà mới có thể giải ngân', 'FORBIDDEN'), { status: 403 })
            }

            if (milestone.status !== 'ESCROW_PAID' && milestone.status !== 'COMPLETED') {
                return NextResponse.json(createErrorResponse('Giai đoạn này chưa được ký quỹ hoặc chưa hoàn thành', 'VALIDATION_ERROR'), { status: 400 })
            }

            const updated = await prisma.paymentMilestone.update({
                where: { id: milestoneId },
                data: {
                    status: 'RELEASED',
                    paidAt: new Date()
                }
            })

            // Update contractor trust score or balance
            await prisma.contractorProfile.update({
                where: { customerId: quote.contractorId || '' },
                data: { trustScore: { increment: 1 } } // Small boost for each released milestone
            })

            return NextResponse.json(createSuccessResponse(updated, 'Đã giải ngân thành công cho nhà thầu'))
        }

        return NextResponse.json(createErrorResponse('Hành động không hợp lệ', 'VALIDATION_ERROR'), { status: 400 })
    } catch (error) {
        console.error('Milestone action error:', error)
        return NextResponse.json(createErrorResponse('Lỗi xử lý', 'SERVER_ERROR'), { status: 500 })
    }
}
