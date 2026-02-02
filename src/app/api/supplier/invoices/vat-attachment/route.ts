import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createSuccessResponse, createErrorResponse } from '@/lib/api-types'

// PATCH /api/supplier/invoices/vat-attachment
export async function PATCH(request: NextRequest) {
    try {
        const { id, vatInvoiceUrl } = await request.json()

        if (!id || !vatInvoiceUrl) {
            return NextResponse.json(
                createErrorResponse('Mã hóa đơn và đường dẫn ảnh là bắt buộc', 'VALIDATION_ERROR'),
                { status: 400 }
            )
        }

        const invoice = await (prisma.invoice as any).update({
            where: { id },
            data: { vatInvoiceUrl }
        })

        return NextResponse.json(createSuccessResponse(invoice, 'Đã tải lên hóa đơn VAT'))
    } catch (error) {
        console.error('Update VAT invoice error:', error)
        return NextResponse.json(
            createErrorResponse('Không thể cập nhật hóa đơn VAT', 'SERVER_ERROR'),
            { status: 500 }
        )
    }
}
