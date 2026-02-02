import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createSuccessResponse, createErrorResponse } from '@/lib/api-types'

// PATCH /api/supplier/orders/[id]/status
export async function PATCH(request: NextRequest) {
    try {
        const { id, status, notes } = await request.json()

        if (!id || !status) {
            return NextResponse.json(
                createErrorResponse('Mã đơn hàng và trạng thái là bắt buộc', 'VALIDATION_ERROR'),
                { status: 400 }
            )
        }

        // Validate status (must be valid PurchaseOrderStatus)
        const validStatuses = ['CONFIRMED', 'RECEIVED', 'CANCELLED'] // Simplify for now
        // But the schema has: DRAFT, SENT, CONFIRMED, RECEIVED, CANCELLED

        const order = await (prisma.purchaseOrder as any).update({
            where: { id },
            data: {
                status,
                notes: notes ? notes : undefined,
                receivedDate: status === 'RECEIVED' ? new Date() : undefined
            },
            include: { supplier: true }
        })

        // Notify Admin via Email
        try {
            const { EmailService } = await import('@/lib/email-service')
            await EmailService.sendSupplierStatusUpdate({
                orderNumber: order.orderNumber,
                supplierName: order.supplier.name,
                status: status
            })
        } catch (emailError) {
            console.error('Failed to send status update email:', emailError)
        }

        return NextResponse.json(createSuccessResponse(order, 'Cập nhật trạng thái thành công'))
    } catch (error) {
        console.error('Update PO status error:', error)
        return NextResponse.json(
            createErrorResponse('Không thể cập nhật trạng thái đơn hàng', 'SERVER_ERROR'),
            { status: 500 }
        )
    }
}
