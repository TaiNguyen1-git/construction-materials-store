/**
 * API: Export Quote as PDF
 * GET - Generate and download quote PDF
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { generateQuotePDF, generateQuoteNumber } from '@/lib/pdf-service'

interface RouteParams {
    params: Promise<{ id: string }>
}

// GET /api/quotes/[id]/export/pdf - Download quote as PDF
export async function GET(request: NextRequest, { params }: RouteParams) {
    try {
        const userId = request.headers.get('x-user-id')
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { id: quoteId } = await params

        // Fetch quote with all related data
        const quote = await prisma.quoteRequest.findUnique({
            where: { id: quoteId },
            include: {
                customer: {
                    include: { user: true }
                },
                contractor: {
                    include: { user: true }
                },
                project: true,
                items: true,
                milestones: {
                    orderBy: { order: 'asc' }
                }
            }
        })

        if (!quote) {
            return NextResponse.json({ error: 'Quote not found' }, { status: 404 })
        }

        // Verify access - either customer or contractor can download
        const customerRecord = await prisma.customer.findFirst({
            where: { userId }
        })

        if (!customerRecord) {
            return NextResponse.json({ error: 'Customer profile not found' }, { status: 404 })
        }

        const hasAccess = quote.customerId === customerRecord.id || quote.contractorId === customerRecord.id
        if (!hasAccess) {
            return NextResponse.json({ error: 'Access denied' }, { status: 403 })
        }

        // Prepare data for PDF
        const quoteNumber = generateQuoteNumber(quote.id, quote.createdAt)

        const subtotal = quote.items.reduce((sum, item) => sum + item.totalPrice, 0)
        const total = quote.priceQuote || subtotal

        const pdfData = {
            quoteId: quote.id,
            quoteNumber,
            date: quote.createdAt.toISOString(),
            validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
            customer: {
                name: quote.customer.user.name || 'Khách hàng',
                phone: quote.customer.user.phone || undefined,
                email: quote.customer.user.email || undefined,
                address: quote.location || undefined
            },
            contractor: {
                name: quote.contractor.user.name || 'Nhà thầu',
                company: quote.contractor.companyName || undefined,
                phone: quote.contractor.user.phone || undefined,
                email: quote.contractor.user.email || undefined
            },
            project: quote.project ? {
                name: quote.project.name,
                location: quote.project.location || undefined
            } : undefined,
            items: quote.items.map(item => ({
                description: item.description,
                quantity: item.quantity,
                unit: item.unit,
                unitPrice: item.unitPrice,
                totalPrice: item.totalPrice,
                category: item.category || undefined
            })),
            milestones: quote.milestones.length > 0 ? quote.milestones.map(m => ({
                name: m.name,
                percentage: m.percentage,
                amount: m.amount
            })) : undefined,
            subtotal,
            tax: Math.round(subtotal * 0.1), // 10% VAT
            total: total + Math.round(subtotal * 0.1),
            notes: quote.response || undefined
        }

        // Generate PDF
        const pdfBuffer = await generateQuotePDF(pdfData)

        // Return PDF as download
        const filename = `bao-gia-${quoteNumber}.pdf`

        return new NextResponse(new Uint8Array(pdfBuffer), {
            status: 200,
            headers: {
                'Content-Type': 'application/pdf',
                'Content-Disposition': `attachment; filename="${filename}"`,
                'Content-Length': pdfBuffer.length.toString()
            }
        })

    } catch (error: any) {
        console.error('Export PDF error:', error)
        return NextResponse.json({
            error: 'Failed to generate PDF',
            details: error.message
        }, { status: 500 })
    }
}
