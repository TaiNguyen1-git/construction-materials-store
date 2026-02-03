import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createSuccessResponse, createErrorResponse } from '@/lib/api-types'
import { z } from 'zod'

const changeContractorSchema = z.object({
    contractorId: z.string().nullable()
})

/**
 * PATCH /api/orders/[id]/change-contractor
 * Change the selected contractor for an order (allowed only once, and only if order is PENDING)
 */
export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: orderId } = await params
        const body = await request.json()
        const { contractorId } = changeContractorSchema.parse(body)

        // 1. Fetch current order
        const order = await prisma.order.findUnique({
            where: { id: orderId }
        })

        if (!order) {
            return NextResponse.json(createErrorResponse('Order not found', 'NOT_FOUND'), { status: 404 })
        }

        // 2. Security/Business Logic Check
        // - Only 1 change allowed
        if (order.contractorChangeCount >= 1) {
            return NextResponse.json(
                createErrorResponse('Bạn chỉ có thể thay đổi nhà thầu duy nhất 1 lần cho đơn hàng này.', 'CHANGE_LIMIT_REACHED'),
                { status: 400 }
            )
        }

        // - Only allowed if order is PENDING or PENDING_CONFIRMATION
        const allowedStatuses = ['PENDING', 'PENDING_CONFIRMATION']
        if (!allowedStatuses.includes(order.status)) {
            return NextResponse.json(
                createErrorResponse(`Không thể đổi nhà thầu khi đơn hàng đang ở trạng thái ${order.status}`, 'INVALID_STATUS'),
                { status: 400 }
            )
        }

        // 3. Update order
        const updatedOrder = await prisma.order.update({
            where: { id: orderId },
            data: {
                selectedContractorId: contractorId,
                contractorChangeCount: { increment: 1 },
                notes: order.notes + (contractorId ? `\n(Ghi chú: Khách hàng đã cập nhật nhà thầu thi công)` : `\n(Ghi chú: Khách hàng đã bỏ chọn nhà thầu thi công)`)
            }
        })

        return NextResponse.json(createSuccessResponse(updatedOrder, 'Cập nhật nhà thầu thành công'))

    } catch (error: any) {
        console.error('Change contractor error:', error)
        if (error instanceof z.ZodError) {
            return NextResponse.json(createErrorResponse('Dữ liệu không hợp lệ', 'VALIDATION_ERROR', error.issues), { status: 400 })
        }
        return NextResponse.json(createErrorResponse('Internal server error', 'INTERNAL_ERROR'), { status: 500 })
    }
}
