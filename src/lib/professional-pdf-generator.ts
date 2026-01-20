/**
 * Professional PDF Generator
 * Generates beautiful PDF documents for quotes, reports, and invoices
 */

import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

interface CompanyInfo {
    name: string
    tagline?: string
    address?: string
    phone?: string
    email?: string
    logo?: string // Base64 or URL
}

interface QuoteItem {
    description: string
    quantity: number
    unit: string
    unitPrice: number
    totalPrice: number
    category?: string
}

interface QuoteData {
    quoteNumber: string
    date: string
    validUntil?: string
    customerName: string
    customerAddress?: string
    customerPhone?: string
    projectName?: string
    projectLocation?: string
    items: QuoteItem[]
    subtotal: number
    taxRate?: number
    taxAmount?: number
    discount?: number
    total: number
    notes?: string
    terms?: string[]
    milestones?: { name: string; percentage: number; amount: number }[]
}

interface ProgressReportData {
    projectName: string
    projectLocation?: string
    reportDate: string
    contractor: CompanyInfo
    customer: { name: string; phone?: string }
    phases: {
        name: string
        status: 'COMPLETED' | 'IN_PROGRESS' | 'PENDING'
        progress: number
        photos: { url: string; caption?: string; date?: string }[]
        notes?: string
    }[]
    summary?: string
    overallProgress: number
}

// Color palette
const COLORS = {
    primary: [37, 99, 235] as [number, number, number],      // Blue-600
    secondary: [249, 115, 22] as [number, number, number],   // Orange-500
    success: [34, 197, 94] as [number, number, number],      // Green-500
    warning: [234, 179, 8] as [number, number, number],      // Yellow-500
    danger: [239, 68, 68] as [number, number, number],       // Red-500
    dark: [31, 41, 55] as [number, number, number],          // Gray-800
    light: [249, 250, 251] as [number, number, number],      // Gray-50
    muted: [107, 114, 128] as [number, number, number],      // Gray-500
}

/**
 * Generate a professional quote PDF
 */
export function generateQuotePDF(
    quote: QuoteData,
    contractor: CompanyInfo
): jsPDF {
    const doc = new jsPDF('p', 'mm', 'a4')
    const pageWidth = doc.internal.pageSize.getWidth()
    const pageHeight = doc.internal.pageSize.getHeight()
    const margin = 15
    let y = margin

    // === HEADER SECTION ===
    // Gradient header bar
    doc.setFillColor(...COLORS.primary)
    doc.rect(0, 0, pageWidth, 45, 'F')

    // Company name
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(24)
    doc.setFont('helvetica', 'bold')
    doc.text(contractor.name.toUpperCase(), margin, 20)

    // Tagline
    if (contractor.tagline) {
        doc.setFontSize(10)
        doc.setFont('helvetica', 'normal')
        doc.text(contractor.tagline, margin, 28)
    }

    // Quote badge
    doc.setFillColor(255, 255, 255)
    doc.roundedRect(pageWidth - margin - 50, 10, 50, 25, 3, 3, 'F')
    doc.setTextColor(...COLORS.primary)
    doc.setFontSize(8)
    doc.setFont('helvetica', 'bold')
    doc.text('BÁO GIÁ', pageWidth - margin - 25, 18, { align: 'center' })
    doc.setFontSize(12)
    doc.text(`#${quote.quoteNumber}`, pageWidth - margin - 25, 28, { align: 'center' })

    y = 55

    // === CONTACT INFO BAR ===
    doc.setFillColor(...COLORS.light)
    doc.rect(0, 45, pageWidth, 20, 'F')

    doc.setTextColor(...COLORS.muted)
    doc.setFontSize(9)
    doc.setFont('helvetica', 'normal')

    const contactParts = []
    if (contractor.phone) contactParts.push(`📞 ${contractor.phone}`)
    if (contractor.email) contactParts.push(`✉️ ${contractor.email}`)
    if (contractor.address) contactParts.push(`📍 ${contractor.address}`)

    doc.text(contactParts.join('  |  '), pageWidth / 2, 56, { align: 'center' })

    y = 75

    // === CUSTOMER & PROJECT INFO ===
    doc.setTextColor(...COLORS.dark)
    doc.setFontSize(11)
    doc.setFont('helvetica', 'bold')
    doc.text('THÔNG TIN KHÁCH HÀNG', margin, y)

    y += 8
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10)
    doc.text(`Khách hàng: ${quote.customerName}`, margin, y)
    if (quote.customerAddress) {
        y += 5
        doc.text(`Địa chỉ: ${quote.customerAddress}`, margin, y)
    }
    if (quote.customerPhone) {
        y += 5
        doc.text(`Điện thoại: ${quote.customerPhone}`, margin, y)
    }

    // Project info on right side
    if (quote.projectName) {
        doc.setFont('helvetica', 'bold')
        doc.text('THÔNG TIN CÔNG TRÌNH', pageWidth / 2, 75)
        doc.setFont('helvetica', 'normal')
        doc.text(`Công trình: ${quote.projectName}`, pageWidth / 2, 83)
        if (quote.projectLocation) {
            doc.text(`Địa điểm: ${quote.projectLocation}`, pageWidth / 2, 88)
        }
    }

    // Date info
    doc.setFont('helvetica', 'bold')
    doc.text(`Ngày lập: ${quote.date}`, pageWidth - margin - 50, 75)
    if (quote.validUntil) {
        doc.setFont('helvetica', 'normal')
        doc.text(`Hiệu lực đến: ${quote.validUntil}`, pageWidth - margin - 50, 82)
    }

    y += 20

    // === ITEMS TABLE ===
    doc.setFillColor(...COLORS.primary)
    doc.rect(margin, y, pageWidth - 2 * margin, 8, 'F')
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(10)
    doc.setFont('helvetica', 'bold')
    doc.text('BẢNG KÊ CHI TIẾT', margin + 5, y + 5.5)

    y += 12

    // Group items by category
    const groupedItems: { [key: string]: QuoteItem[] } = {}
    quote.items.forEach(item => {
        const cat = item.category || 'Khác'
        if (!groupedItems[cat]) groupedItems[cat] = []
        groupedItems[cat].push(item)
    })

    // Table data
    const tableBody: any[][] = []
    let stt = 1

    Object.entries(groupedItems).forEach(([category, items]) => {
        // Category header row
        tableBody.push([
            { content: category.toUpperCase(), colSpan: 5, styles: { fillColor: COLORS.light, fontStyle: 'bold', textColor: COLORS.primary } }
        ])

        items.forEach(item => {
            tableBody.push([
                stt++,
                item.description,
                `${item.quantity.toLocaleString('vi-VN')} ${item.unit}`,
                item.unitPrice.toLocaleString('vi-VN') + 'đ',
                item.totalPrice.toLocaleString('vi-VN') + 'đ'
            ])
        })
    })

    autoTable(doc, {
        startY: y,
        head: [['STT', 'Mô tả', 'Số lượng', 'Đơn giá', 'Thành tiền']],
        body: tableBody,
        theme: 'grid',
        headStyles: {
            fillColor: COLORS.dark,
            textColor: [255, 255, 255],
            fontStyle: 'bold',
            halign: 'center'
        },
        columnStyles: {
            0: { halign: 'center', cellWidth: 12 },
            1: { cellWidth: 80 },
            2: { halign: 'center', cellWidth: 25 },
            3: { halign: 'right', cellWidth: 30 },
            4: { halign: 'right', cellWidth: 35 }
        },
        styles: {
            fontSize: 9,
            cellPadding: 3
        },
        alternateRowStyles: {
            fillColor: [250, 250, 250]
        }
    })

    y = (doc as any).lastAutoTable.finalY + 10

    // === TOTALS SECTION ===
    const totalsX = pageWidth - margin - 80

    doc.setFillColor(...COLORS.light)
    doc.roundedRect(totalsX - 5, y - 2, 85, 50, 3, 3, 'F')

    doc.setTextColor(...COLORS.dark)
    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')

    doc.text('Tạm tính:', totalsX, y + 5)
    doc.text(quote.subtotal.toLocaleString('vi-VN') + 'đ', pageWidth - margin, y + 5, { align: 'right' })

    if (quote.discount) {
        y += 7
        doc.setTextColor(...COLORS.success)
        doc.text('Chiết khấu:', totalsX, y + 5)
        doc.text('-' + quote.discount.toLocaleString('vi-VN') + 'đ', pageWidth - margin, y + 5, { align: 'right' })
    }

    if (quote.taxAmount) {
        y += 7
        doc.setTextColor(...COLORS.dark)
        doc.text(`VAT (${quote.taxRate || 10}%):`, totalsX, y + 5)
        doc.text(quote.taxAmount.toLocaleString('vi-VN') + 'đ', pageWidth - margin, y + 5, { align: 'right' })
    }

    y += 10
    doc.setDrawColor(...COLORS.primary)
    doc.line(totalsX, y + 5, pageWidth - margin, y + 5)

    y += 5
    doc.setFillColor(...COLORS.primary)
    doc.roundedRect(totalsX - 5, y + 2, 85, 12, 2, 2, 'F')
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(12)
    doc.setFont('helvetica', 'bold')
    doc.text('TỔNG CỘNG:', totalsX, y + 10)
    doc.text(quote.total.toLocaleString('vi-VN') + 'đ', pageWidth - margin, y + 10, { align: 'right' })

    y += 25

    // === MILESTONES (if any) ===
    if (quote.milestones && quote.milestones.length > 0) {
        doc.setTextColor(...COLORS.dark)
        doc.setFont('helvetica', 'bold')
        doc.setFontSize(11)
        doc.text('📅 TIẾN ĐỘ THANH TOÁN', margin, y)
        y += 8

        quote.milestones.forEach((ms, idx) => {
            doc.setFont('helvetica', 'normal')
            doc.setFontSize(10)
            const msText = `${idx + 1}. ${ms.name} (${ms.percentage}%): ${ms.amount.toLocaleString('vi-VN')}đ`
            doc.text(msText, margin + 5, y)
            y += 6
        })
        y += 5
    }

    // === NOTES ===
    if (quote.notes) {
        doc.setTextColor(...COLORS.muted)
        doc.setFont('helvetica', 'italic')
        doc.setFontSize(9)
        doc.text(`Ghi chú: ${quote.notes}`, margin, y)
        y += 8
    }

    // === TERMS ===
    if (quote.terms && quote.terms.length > 0) {
        doc.setTextColor(...COLORS.dark)
        doc.setFont('helvetica', 'bold')
        doc.setFontSize(10)
        doc.text('ĐIỀU KHOẢN & ĐIỀU KIỆN:', margin, y)
        y += 6

        doc.setFont('helvetica', 'normal')
        doc.setFontSize(9)
        quote.terms.forEach((term, idx) => {
            doc.text(`${idx + 1}. ${term}`, margin + 3, y)
            y += 5
        })
    }

    // === FOOTER ===
    const footerY = pageHeight - 20
    doc.setDrawColor(...COLORS.light)
    doc.line(margin, footerY - 5, pageWidth - margin, footerY - 5)

    doc.setTextColor(...COLORS.muted)
    doc.setFontSize(8)
    doc.setFont('helvetica', 'normal')
    doc.text('Báo giá được tạo bởi SmartBuild Pro', pageWidth / 2, footerY, { align: 'center' })
    doc.text('www.smartbuild.vn', pageWidth / 2, footerY + 4, { align: 'center' })

    // === SIGNATURE SECTION ===
    y = footerY - 35
    doc.setTextColor(...COLORS.dark)
    doc.setFontSize(10)
    doc.setFont('helvetica', 'bold')

    // Left: Customer signature
    doc.text('KHÁCH HÀNG', margin + 20, y, { align: 'center' })
    doc.setFont('helvetica', 'italic')
    doc.setFontSize(8)
    doc.text('(Ký và ghi rõ họ tên)', margin + 20, y + 5, { align: 'center' })

    // Right: Contractor signature
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(10)
    doc.text('ĐẠI DIỆN NHÀ THẦU', pageWidth - margin - 30, y, { align: 'center' })
    doc.setFont('helvetica', 'italic')
    doc.setFontSize(8)
    doc.text('(Ký và ghi rõ họ tên)', pageWidth - margin - 30, y + 5, { align: 'center' })

    return doc
}

/**
 * Generate a progress report PDF with photos
 */
export function generateProgressReportPDF(
    report: ProgressReportData
): jsPDF {
    const doc = new jsPDF('p', 'mm', 'a4')
    const pageWidth = doc.internal.pageSize.getWidth()
    const margin = 15
    let y = margin

    // === HEADER ===
    doc.setFillColor(...COLORS.primary)
    doc.rect(0, 0, pageWidth, 40, 'F')

    doc.setTextColor(255, 255, 255)
    doc.setFontSize(20)
    doc.setFont('helvetica', 'bold')
    doc.text('BÁO CÁO TIẾN ĐỘ THI CÔNG', pageWidth / 2, 18, { align: 'center' })

    doc.setFontSize(12)
    doc.setFont('helvetica', 'normal')
    doc.text(report.projectName, pageWidth / 2, 28, { align: 'center' })

    doc.setFontSize(10)
    doc.text(`Ngày: ${report.reportDate}`, pageWidth / 2, 35, { align: 'center' })

    y = 50

    // === PROJECT INFO ===
    doc.setTextColor(...COLORS.dark)
    doc.setFillColor(...COLORS.light)
    doc.roundedRect(margin, y, pageWidth - 2 * margin, 25, 3, 3, 'F')

    y += 8
    doc.setFontSize(10)
    doc.setFont('helvetica', 'bold')
    doc.text('Nhà thầu:', margin + 5, y)
    doc.setFont('helvetica', 'normal')
    doc.text(report.contractor.name, margin + 30, y)

    doc.setFont('helvetica', 'bold')
    doc.text('Khách hàng:', pageWidth / 2, y)
    doc.setFont('helvetica', 'normal')
    doc.text(report.customer.name, pageWidth / 2 + 30, y)

    y += 7
    if (report.projectLocation) {
        doc.setFont('helvetica', 'bold')
        doc.text('Địa điểm:', margin + 5, y)
        doc.setFont('helvetica', 'normal')
        doc.text(report.projectLocation, margin + 30, y)
    }

    if (report.customer.phone) {
        doc.setFont('helvetica', 'bold')
        doc.text('SĐT:', pageWidth / 2, y)
        doc.setFont('helvetica', 'normal')
        doc.text(report.customer.phone, pageWidth / 2 + 30, y)
    }

    y += 15

    // === OVERALL PROGRESS ===
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(12)
    doc.text('TIẾN ĐỘ TỔNG THỂ', margin, y)

    y += 8
    // Progress bar
    const barWidth = pageWidth - 2 * margin - 40
    const progress = report.overallProgress

    doc.setFillColor(229, 231, 235) // gray-200
    doc.roundedRect(margin, y, barWidth, 10, 2, 2, 'F')

    if (progress > 0) {
        const progressColor = progress >= 80 ? COLORS.success : progress >= 50 ? COLORS.warning : COLORS.primary
        doc.setFillColor(...progressColor)
        doc.roundedRect(margin, y, barWidth * (progress / 100), 10, 2, 2, 'F')
    }

    doc.setTextColor(...COLORS.dark)
    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.text(`${progress}%`, pageWidth - margin - 30, y + 8)

    y += 20

    // === PHASES ===
    doc.setFontSize(12)
    doc.text('CHI TIẾT CÁC GIAI ĐOẠN', margin, y)
    y += 8

    report.phases.forEach((phase, idx) => {
        // Check if we need a new page
        if (y > 250) {
            doc.addPage()
            y = margin
        }

        // Phase header
        const statusColors: { [key: string]: [number, number, number] } = {
            'COMPLETED': COLORS.success,
            'IN_PROGRESS': COLORS.warning,
            'PENDING': COLORS.muted
        }
        const statusLabels: { [key: string]: string } = {
            'COMPLETED': '✓ Hoàn thành',
            'IN_PROGRESS': '⚡ Đang thực hiện',
            'PENDING': '○ Chờ thực hiện'
        }

        doc.setFillColor(...statusColors[phase.status])
        doc.roundedRect(margin, y, pageWidth - 2 * margin, 10, 2, 2, 'F')
        doc.setTextColor(255, 255, 255)
        doc.setFontSize(10)
        doc.setFont('helvetica', 'bold')
        doc.text(`${idx + 1}. ${phase.name}`, margin + 5, y + 7)
        doc.text(statusLabels[phase.status], pageWidth - margin - 35, y + 7)

        y += 14

        // Phase progress
        doc.setTextColor(...COLORS.dark)
        doc.setFont('helvetica', 'normal')
        doc.setFontSize(9)
        doc.text(`Tiến độ: ${phase.progress}%`, margin + 5, y)

        // Mini progress bar
        doc.setFillColor(229, 231, 235)
        doc.roundedRect(margin + 35, y - 3, 50, 5, 1, 1, 'F')
        if (phase.progress > 0) {
            doc.setFillColor(...statusColors[phase.status])
            doc.roundedRect(margin + 35, y - 3, 50 * (phase.progress / 100), 5, 1, 1, 'F')
        }

        y += 8

        // Notes
        if (phase.notes) {
            doc.setTextColor(...COLORS.muted)
            doc.setFont('helvetica', 'italic')
            doc.text(`Ghi chú: ${phase.notes}`, margin + 5, y)
            y += 6
        }

        // Photos placeholder (in real implementation, would add actual images)
        if (phase.photos.length > 0) {
            doc.setTextColor(...COLORS.dark)
            doc.setFont('helvetica', 'normal')
            doc.text(`📷 ${phase.photos.length} ảnh minh chứng`, margin + 5, y)
            y += 5

            // Photo grid placeholder
            phase.photos.slice(0, 3).forEach((photo, pIdx) => {
                const photoX = margin + 5 + (pIdx * 55)
                doc.setFillColor(243, 244, 246)
                doc.roundedRect(photoX, y, 50, 35, 2, 2, 'F')
                doc.setTextColor(...COLORS.muted)
                doc.setFontSize(8)
                doc.text(photo.caption || `Ảnh ${pIdx + 1}`, photoX + 25, y + 20, { align: 'center' })
                if (photo.date) {
                    doc.text(photo.date, photoX + 25, y + 28, { align: 'center' })
                }
            })
            y += 42
        }

        y += 5
    })

    // === AI SUMMARY ===
    if (report.summary) {
        if (y > 230) {
            doc.addPage()
            y = margin
        }

        doc.setFillColor(...COLORS.primary)
        doc.setTextColor(255, 255, 255)
        doc.roundedRect(margin, y, pageWidth - 2 * margin, 8, 2, 2, 'F')
        doc.setFontSize(10)
        doc.setFont('helvetica', 'bold')
        doc.text('🤖 TÓM TẮT AI', margin + 5, y + 5.5)

        y += 12
        doc.setTextColor(...COLORS.dark)
        doc.setFont('helvetica', 'normal')
        doc.setFontSize(9)

        // Word wrap the summary
        const summaryLines = doc.splitTextToSize(report.summary, pageWidth - 2 * margin - 10)
        doc.text(summaryLines, margin + 5, y)
        y += summaryLines.length * 5 + 5
    }

    // === FOOTER ===
    const footerY = doc.internal.pageSize.getHeight() - 15
    doc.setTextColor(...COLORS.muted)
    doc.setFontSize(8)
    doc.text(`Báo cáo được tạo tự động bởi SmartBuild Pro - ${new Date().toLocaleDateString('vi-VN')}`, pageWidth / 2, footerY, { align: 'center' })

    return doc
}

/**
 * Helper to download PDF
 */
export function downloadPDF(doc: jsPDF, filename: string) {
    doc.save(filename)
}

/**
 * Helper to get PDF as base64
 */
export function getPDFBase64(doc: jsPDF): string {
    return doc.output('datauristring')
}
