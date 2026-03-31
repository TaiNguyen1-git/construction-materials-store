import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createSuccessResponse, createErrorResponse } from '@/lib/api-types'

// PATCH /api/supplier/invoices/cancel
export async function PATCH(request: NextRequest) {
    try {
        const { invoiceId, reason } = await request.json()

        if (!invoiceId) {
            return NextResponse.json(
                createErrorResponse('Mã hóa đơn là bắt buộc', 'VALIDATION_ERROR'),
                { status: 400 }
            )
        }

        if (!reason || !reason.trim()) {
            return NextResponse.json(
                createErrorResponse('Lý do hủy là bắt buộc', 'VALIDATION_ERROR'),
                { status: 400 }
            )
        }

        // Fetch current invoice
        const invoice = await (prisma.invoice as any).findUnique({
            where: { id: invoiceId }
        })

        if (!invoice) {
            return NextResponse.json(
                createErrorResponse('Không tìm thấy hóa đơn', 'NOT_FOUND'),
                { status: 404 }
            )
        }

        if (invoice.status === 'PAID') {
            return NextResponse.json(
                createErrorResponse('Không thể hủy hóa đơn đã thanh toán đầy đủ', 'VALIDATION_ERROR'),
                { status: 400 }
            )
        }

        if (invoice.status === 'CANCELLED') {
            return NextResponse.json(
                createErrorResponse('Hóa đơn này đã bị hủy trước đó', 'VALIDATION_ERROR'),
                { status: 400 }
            )
        }

        // Update invoice to cancelled
        const updatedInvoice = await (prisma.invoice as any).update({
            where: { id: invoiceId },
            data: {
                status: 'CANCELLED',
                notes: invoice.notes
                    ? `${invoice.notes}\n\n[HỦY] ${new Date().toLocaleString('vi-VN')}: ${reason}`
                    : `[HỦY] ${new Date().toLocaleString('vi-VN')}: ${reason}`,
            }
        })

        return NextResponse.json(
            createSuccessResponse(updatedInvoice, 'Đã hủy hóa đơn thành công')
        )
    } catch (error) {
        console.error('Cancel invoice error:', error)
        return NextResponse.json(
            createErrorResponse('Không thể hủy hóa đơn', 'SERVER_ERROR'),
            { status: 500 }
        )
    }
}
