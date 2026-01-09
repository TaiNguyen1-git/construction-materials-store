/**
 * PDF Service - Generate professional PDF documents
 * Supports: Quotes (BoQ), Invoices, Contracts
 */

// Using jspdf for server-side PDF generation
import { jsPDF } from 'jspdf'
import 'jspdf-autotable'

// Extend jsPDF type for autotable
declare module 'jspdf' {
    interface jsPDF {
        autoTable: (options: any) => jsPDF
        lastAutoTable: { finalY: number }
    }
}

interface CompanyInfo {
    name: string
    address: string
    phone: string
    email: string
    taxId?: string
    logo?: string
}

interface QuoteData {
    quoteId: string
    quoteNumber: string
    date: string
    validUntil?: string
    customer: {
        name: string
        phone?: string
        email?: string
        address?: string
    }
    contractor: {
        name: string
        company?: string
        phone?: string
        email?: string
    }
    project?: {
        name: string
        location?: string
    }
    items: Array<{
        description: string
        quantity: number
        unit: string
        unitPrice: number
        totalPrice: number
        category?: string
    }>
    milestones?: Array<{
        name: string
        percentage: number
        amount: number
    }>
    subtotal: number
    tax?: number
    total: number
    notes?: string
}

const STORE_INFO: CompanyInfo = {
    name: 'Cửa hàng Vật liệu Xây dựng ABC',
    address: '123 Đường ABC, Phường XYZ, TP. Biên Hòa, Đồng Nai',
    phone: '0901 234 567',
    email: 'contact@vlxd-abc.vn',
    taxId: '3600000000'
}

/**
 * Format Vietnamese currency
 */
function formatCurrency(amount: number): string {
    return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND',
        minimumFractionDigits: 0
    }).format(amount)
}

/**
 * Format date to Vietnamese format
 */
function formatDate(date: string | Date): string {
    return new Date(date).toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    })
}

/**
 * Generate Quote PDF (Báo giá)
 */
export async function generateQuotePDF(data: QuoteData): Promise<Buffer> {
    const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
    })

    const pageWidth = doc.internal.pageSize.getWidth()
    const margin = 15
    let y = margin

    // Header with store info
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(18)
    doc.setTextColor(33, 37, 41)
    doc.text(STORE_INFO.name, pageWidth / 2, y, { align: 'center' })

    y += 8
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10)
    doc.setTextColor(100)
    doc.text(STORE_INFO.address, pageWidth / 2, y, { align: 'center' })

    y += 5
    doc.text(`Tel: ${STORE_INFO.phone} | Email: ${STORE_INFO.email}`, pageWidth / 2, y, { align: 'center' })

    // Divider
    y += 8
    doc.setDrawColor(200)
    doc.setLineWidth(0.5)
    doc.line(margin, y, pageWidth - margin, y)

    // Title
    y += 12
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(16)
    doc.setTextColor(25, 135, 84) // Green
    doc.text('BAO GIA CHI TIET', pageWidth / 2, y, { align: 'center' })

    // Quote info
    y += 10
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10)
    doc.setTextColor(33, 37, 41)

    const leftCol = margin
    const rightCol = pageWidth / 2 + 10

    // Left column - Customer info
    doc.setFont('helvetica', 'bold')
    doc.text('KHACH HANG:', leftCol, y)
    doc.setFont('helvetica', 'normal')
    y += 5
    doc.text(data.customer.name, leftCol, y)
    if (data.customer.phone) {
        y += 5
        doc.text(`Tel: ${data.customer.phone}`, leftCol, y)
    }
    if (data.customer.address) {
        y += 5
        doc.text(`Dia chi: ${data.customer.address}`, leftCol, y)
    }

    // Right column - Quote info
    let rightY = y - 15
    doc.setFont('helvetica', 'bold')
    doc.text(`So bao gia: ${data.quoteNumber}`, rightCol, rightY)
    rightY += 5
    doc.setFont('helvetica', 'normal')
    doc.text(`Ngay: ${formatDate(data.date)}`, rightCol, rightY)
    if (data.validUntil) {
        rightY += 5
        doc.text(`Co gia tri den: ${formatDate(data.validUntil)}`, rightCol, rightY)
    }

    // Contractor info
    y += 10
    doc.setFont('helvetica', 'bold')
    doc.text('NHA THAU:', leftCol, y)
    doc.setFont('helvetica', 'normal')
    y += 5
    doc.text(data.contractor.name, leftCol, y)
    if (data.contractor.company) {
        y += 5
        doc.text(data.contractor.company, leftCol, y)
    }

    // Project info
    if (data.project) {
        y += 8
        doc.setFont('helvetica', 'bold')
        doc.text('DU AN:', leftCol, y)
        doc.setFont('helvetica', 'normal')
        y += 5
        doc.text(data.project.name, leftCol, y)
        if (data.project.location) {
            y += 5
            doc.text(`Dia diem: ${data.project.location}`, leftCol, y)
        }
    }

    // Items table
    y += 12
    const tableData = data.items.map((item, index) => [
        (index + 1).toString(),
        item.description,
        item.quantity.toString(),
        item.unit,
        formatCurrency(item.unitPrice),
        formatCurrency(item.totalPrice)
    ])

    doc.autoTable({
        head: [['STT', 'Mo Ta', 'SL', 'DVT', 'Don gia', 'Thanh tien']],
        body: tableData,
        startY: y,
        margin: { left: margin, right: margin },
        styles: {
            fontSize: 9,
            cellPadding: 3
        },
        headStyles: {
            fillColor: [25, 135, 84],
            textColor: 255,
            fontStyle: 'bold'
        },
        alternateRowStyles: {
            fillColor: [248, 249, 250]
        },
        columnStyles: {
            0: { halign: 'center', cellWidth: 12 },
            1: { cellWidth: 60 },
            2: { halign: 'center', cellWidth: 15 },
            3: { halign: 'center', cellWidth: 15 },
            4: { halign: 'right', cellWidth: 30 },
            5: { halign: 'right', cellWidth: 35 }
        }
    })

    y = doc.lastAutoTable.finalY + 10

    // Totals
    const totalsX = pageWidth - margin - 60
    doc.setFont('helvetica', 'normal')
    doc.text('Tam tinh:', totalsX, y)
    doc.text(formatCurrency(data.subtotal), pageWidth - margin, y, { align: 'right' })

    if (data.tax) {
        y += 6
        doc.text('Thue VAT (10%):', totalsX, y)
        doc.text(formatCurrency(data.tax), pageWidth - margin, y, { align: 'right' })
    }

    y += 8
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(12)
    doc.text('TONG CONG:', totalsX, y)
    doc.setTextColor(25, 135, 84)
    doc.text(formatCurrency(data.total), pageWidth - margin, y, { align: 'right' })

    // Milestones (if any)
    if (data.milestones && data.milestones.length > 0) {
        y += 15
        doc.setTextColor(33, 37, 41)
        doc.setFontSize(11)
        doc.text('TIEN DO THANH TOAN:', margin, y)

        y += 3
        const milestoneData = data.milestones.map((m, i) => [
            `Dot ${i + 1}`,
            m.name,
            `${m.percentage}%`,
            formatCurrency(m.amount)
        ])

        doc.autoTable({
            head: [['Dot', 'Giai doan', 'Ty le', 'So tien']],
            body: milestoneData,
            startY: y,
            margin: { left: margin, right: margin },
            styles: { fontSize: 9 },
            headStyles: {
                fillColor: [108, 117, 125],
                textColor: 255
            }
        })

        y = doc.lastAutoTable.finalY + 5
    }

    // Notes
    if (data.notes) {
        y += 10
        doc.setFont('helvetica', 'bold')
        doc.setFontSize(10)
        doc.setTextColor(33, 37, 41)
        doc.text('Ghi chu:', margin, y)
        y += 5
        doc.setFont('helvetica', 'normal')
        doc.text(data.notes, margin, y, { maxWidth: pageWidth - 2 * margin })
    }

    // Footer
    const footerY = doc.internal.pageSize.getHeight() - 25
    doc.setDrawColor(200)
    doc.line(margin, footerY - 5, pageWidth - margin, footerY - 5)

    doc.setFontSize(9)
    doc.setTextColor(100)
    doc.text('Cam on quy khach da tin tuong su dung dich vu!', pageWidth / 2, footerY, { align: 'center' })
    doc.text('Moi thac mac vui long lien he hotline: ' + STORE_INFO.phone, pageWidth / 2, footerY + 5, { align: 'center' })

    return Buffer.from(doc.output('arraybuffer'))
}

/**
 * Generate simple quote number from ID
 */
export function generateQuoteNumber(quoteId: string, date: Date): string {
    const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '')
    const shortId = quoteId.slice(-6).toUpperCase()
    return `BG-${dateStr}-${shortId}`
}
