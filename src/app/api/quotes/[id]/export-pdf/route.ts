/**
 * API: Export Quote to PDF
 * POST /api/quotes/[id]/export-pdf
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { generateQuotePDF, downloadPDF } from '@/lib/professional-pdf-generator'

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params

        // Fetch quote with all related data
        const quote = await prisma.quoteRequest.findUnique({
            where: { id },
            include: {
                customer: {
                    include: {
                        user: { select: { name: true, phone: true, address: true } }
                    }
                },
                contractor: {
                    include: {
                        user: { select: { name: true, phone: true, address: true } }
                    }
                },
                items: true,
                milestones: true,
                project: true
            }
        })

        if (!quote) {
            return NextResponse.json(
                { error: { message: 'Không tìm thấy báo giá' } },
                { status: 404 }
            )
        }

        // Get contractor profile for company info
        const contractorProfile = await prisma.contractorProfile.findFirst({
            where: { customerId: quote.contractorId }
        })

        // Build company info
        const companyInfo = {
            name: contractorProfile?.companyName || contractorProfile?.displayName || quote.contractor.user.name,
            tagline: contractorProfile?.bio?.substring(0, 100) || 'Nhà thầu uy tín - Chất lượng hàng đầu',
            phone: contractorProfile?.phone || quote.contractor.user.phone || '',
            email: contractorProfile?.email || '',
            address: contractorProfile?.address || quote.contractor.user.address || ''
        }

        // Calculate totals
        const subtotal = quote.items.reduce((sum, item) => sum + item.totalPrice, 0)
        const total = quote.priceQuote || subtotal

        // Build quote data
        const quoteData = {
            quoteNumber: `QT-${quote.id.slice(-6).toUpperCase()}`,
            date: new Date(quote.createdAt).toLocaleDateString('vi-VN'),
            validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString('vi-VN'),
            customerName: quote.customer.user.name,
            customerAddress: quote.customer.user.address || quote.location || '',
            customerPhone: quote.customer.user.phone || '',
            projectName: quote.project?.name || 'Dự án xây dựng',
            projectLocation: quote.location || '',
            items: quote.items.map(item => ({
                description: item.description,
                quantity: item.quantity,
                unit: item.unit,
                unitPrice: item.unitPrice,
                totalPrice: item.totalPrice,
                category: item.category || 'Vật tư'
            })),
            subtotal,
            total,
            notes: quote.response || '',
            terms: [
                'Giá trên chưa bao gồm VAT (nếu có)',
                'Báo giá có hiệu lực trong vòng 30 ngày',
                'Thanh toán theo tiến độ thỏa thuận',
                'Bảo hành công trình theo quy định'
            ],
            milestones: quote.milestones.map(ms => ({
                name: ms.name,
                percentage: ms.percentage,
                amount: ms.amount
            }))
        }

        // Generate PDF
        const doc = generateQuotePDF(quoteData, companyInfo)

        // Get PDF as base64
        const pdfBase64 = doc.output('datauristring')

        // Also return download-ready blob
        const pdfBlob = doc.output('blob')
        const pdfBuffer = await pdfBlob.arrayBuffer()

        return new NextResponse(pdfBuffer, {
            headers: {
                'Content-Type': 'application/pdf',
                'Content-Disposition': `attachment; filename="bao-gia-${quote.id.slice(-6)}.pdf"`
            }
        })

    } catch (error) {
        console.error('Error generating quote PDF:', error)
        return NextResponse.json(
            { error: { message: 'Lỗi khi tạo PDF báo giá' } },
            { status: 500 }
        )
    }
}
