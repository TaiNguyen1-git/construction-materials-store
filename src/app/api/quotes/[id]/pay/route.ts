import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createSuccessResponse, createErrorResponse } from '@/lib/api-types'
import { z } from 'zod'
import { saveNotificationForUser } from '@/lib/notification-service'

const payMilestoneSchema = z.object({
    milestoneId: z.string(),
    paymentMethod: z.enum(['VNPAY', 'MOMO', 'BANK_TRANSFER'])
})

// POST /api/quotes/[id]/pay - Escrow Payment logic
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: quoteId } = await params
        const userId = request.headers.get('x-user-id')
        if (!userId) {
            return NextResponse.json(createErrorResponse('Unauthorized', 'UNAUTHORIZED'), { status: 401 })
        }

        const body = await request.json()
        const validation = payMilestoneSchema.safeParse(body)

        if (!validation.success) {
            return NextResponse.json(createErrorResponse('Dữ liệu không hợp lệ', 'VALIDATION_ERROR'), { status: 400 })
        }

        const { milestoneId, paymentMethod } = validation.data

        const quote = await prisma.quoteRequest.findUnique({
            where: { id: quoteId },
            include: { customer: true, contractor: true }
        })

        if (!quote || quote.customer.userId !== userId) {
            return NextResponse.json(createErrorResponse('Không tìm thấy báo giá hoặc quyền truy cập', 'FORBIDDEN'), { status: 403 })
        }

        const milestone = await (prisma as any).paymentMilestone.findFirst({
            where: { id: milestoneId, quoteId }
        })

        if (!milestone) {
            return NextResponse.json(createErrorResponse('Mốc thanh toán không tồn tại', 'NOT_FOUND'), { status: 404 })
        }

        if (milestone.status !== 'PENDING') {
            return NextResponse.json(createErrorResponse('Mốc thanh toán đã được xử lý trước đó', 'INVALID_OPERATION'), { status: 400 })
        }

        // Logic Escrow: Cập nhật trạng thái thành ESCROW_PAID
        const result = await (prisma as any).paymentMilestone.update({
            where: { id: milestoneId },
            data: {
                status: 'ESCROW_PAID',
                paidAt: new Date()
            }
        })

        // Log vào lịch sử báo giá
        await (prisma as any).quoteStatusHistory.create({
            data: {
                quoteId,
                userId,
                newStatus: quote.status,
                notes: `Khách hàng đã thanh toán ${(milestone.amount).toLocaleString()}đ qua ${paymentMethod}. Tiền đang được hệ thống giữ (Escrow).`
            }
        })

        // Thông báo cho nhà thầu
        await saveNotificationForUser({
            type: 'INFO' as any,
            priority: 'HIGH',
            title: 'Tiền tạm ứng đã sẵn sàng',
            message: `Khách hàng đã nạp tiền vào hệ thống cho mốc "${milestone.name}". Bạn có thể bắt đầu thi công.`,
            data: { quoteId, amount: milestone.amount }
        }, quote.contractor.userId)

        return NextResponse.json(createSuccessResponse(result, 'Thanh toán cọc thành công. Hệ thống đang giữ hộ tiền cho bạn.'))

    } catch (error: any) {
        console.error('Payment error:', error)
        return NextResponse.json(createErrorResponse('Lỗi máy chủ nội bộ', 'INTERNAL_ERROR'), { status: 500 })
    }
}
