/**
 * API: E-Invoice Management
 * POST - Create e-invoice
 * GET - List e-invoices
 */

import { NextRequest, NextResponse } from 'next/server'
import { EInvoiceService } from '@/lib/e-invoice-service'
import { createSuccessResponse, createErrorResponse } from '@/lib/api-types'
import { z } from 'zod'

const createInvoiceSchema = z.object({
    orderId: z.string().optional(),
    quoteId: z.string().optional(),
    buyerName: z.string().min(1),
    buyerTaxCode: z.string().optional(),
    buyerAddress: z.string().optional(),
    buyerEmail: z.string().email().optional(),
    items: z.array(z.object({
        name: z.string(),
        unit: z.string(),
        quantity: z.number().positive(),
        unitPrice: z.number().positive(),
        vatRate: z.number().min(0).max(10)
    }))
})

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const validation = createInvoiceSchema.safeParse(body)

        if (!validation.success) {
            return NextResponse.json(
                createErrorResponse('Dữ liệu không hợp lệ', 'VALIDATION_ERROR', validation.error.issues),
                { status: 400 }
            )
        }

        const result = await EInvoiceService.createInvoice(validation.data)

        if (!result.success) {
            return NextResponse.json(
                createErrorResponse(result.error || 'Lỗi tạo hóa đơn', 'INTERNAL_ERROR'),
                { status: 500 }
            )
        }

        return NextResponse.json(
            createSuccessResponse({
                invoiceId: result.invoiceId,
                invoiceNumber: result.invoiceNumber
            }, 'Đã tạo hóa đơn thành công'),
            { status: 201 }
        )
    } catch (error: any) {
        console.error('E-Invoice API error:', error)
        return NextResponse.json(
            createErrorResponse('Lỗi hệ thống', 'INTERNAL_ERROR'),
            { status: 500 }
        )
    }
}

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const orderId = searchParams.get('orderId')
        const status = searchParams.get('status')
        const limit = parseInt(searchParams.get('limit') || '50')

        const invoices = await EInvoiceService.listInvoices({
            orderId: orderId || undefined,
            status: status as any,
            limit
        })

        return NextResponse.json(createSuccessResponse({ invoices }))
    } catch (error: any) {
        return NextResponse.json(
            createErrorResponse('Lỗi hệ thống', 'INTERNAL_ERROR'),
            { status: 500 }
        )
    }
}
