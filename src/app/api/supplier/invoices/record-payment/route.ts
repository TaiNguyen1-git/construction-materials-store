import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createSuccessResponse, createErrorResponse } from '@/lib/api-types'

// POST /api/supplier/invoices/record-payment
export async function POST(request: NextRequest) {
    try {
        const { invoiceId, amount, paymentMethod, reference, notes } = await request.json()

        if (!invoiceId || !amount || amount <= 0) {
            return NextResponse.json(
                createErrorResponse('Mã hóa đơn và số tiền hợp lệ là bắt buộc', 'VALIDATION_ERROR'),
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
                createErrorResponse('Hóa đơn này đã được thanh toán đầy đủ', 'VALIDATION_ERROR'),
                { status: 400 }
            )
        }

        if (invoice.status === 'CANCELLED') {
            return NextResponse.json(
                createErrorResponse('Không thể ghi nhận thanh toán cho hóa đơn đã hủy', 'VALIDATION_ERROR'),
                { status: 400 }
            )
        }

        if (amount > invoice.balanceAmount) {
            return NextResponse.json(
                createErrorResponse('Số tiền vượt quá số nợ còn lại', 'VALIDATION_ERROR'),
                { status: 400 }
            )
        }

        const newPaidAmount = invoice.paidAmount + amount
        const newBalanceAmount = invoice.totalAmount - newPaidAmount
        const newStatus = newBalanceAmount <= 0 ? 'PAID' : invoice.status

        // Update invoice
        const updatedInvoice = await (prisma.invoice as any).update({
            where: { id: invoiceId },
            data: {
                paidAmount: newPaidAmount,
                balanceAmount: Math.max(0, newBalanceAmount),
                status: newStatus,
            }
        })

        // Create payment record
        const paymentNumber = `PAY-${Date.now()}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`
        
        try {
            await (prisma.payment as any).create({
                data: {
                    paymentNumber,
                    invoiceId,
                    paymentType: 'INCOMING',
                    paymentMethod: paymentMethod || 'BANK_TRANSFER',
                    amount,
                    status: 'PAID',
                    reference: reference || null,
                    notes: notes || null,
                    paymentDate: new Date(),
                }
            })
        } catch (paymentError) {
            // Payment record creation is non-critical, log and continue
            console.error('Failed to create payment record:', paymentError)
        }

        return NextResponse.json(
            createSuccessResponse(updatedInvoice, 'Đã ghi nhận thanh toán thành công')
        )
    } catch (error) {
        console.error('Record payment error:', error)
        return NextResponse.json(
            createErrorResponse('Không thể ghi nhận thanh toán', 'SERVER_ERROR'),
            { status: 500 }
        )
    }
}
