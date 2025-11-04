import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import * as XLSX from 'xlsx'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const format = searchParams.get('format') || 'excel'

    if (!startDate || !endDate) {
      return NextResponse.json(
        { success: false, error: 'startDate and endDate are required' },
        { status: 400 }
      )
    }

    const start = new Date(startDate)
    const end = new Date(endDate)
    end.setHours(23, 59, 59, 999)

    // Fetch financial data
    const salesInvoices = await prisma.invoice.findMany({
      where: {
        invoiceType: 'SALES',
        status: { in: ['PAID', 'SENT'] },
        issueDate: { gte: start, lte: end }
      },
      include: {
        customer: { select: { user: { select: { name: true } } } },
        invoiceItems: { include: { product: true } }
      },
      orderBy: { issueDate: 'asc' }
    })

    const purchaseInvoices = await prisma.invoice.findMany({
      where: {
        invoiceType: 'PURCHASE',
        status: { in: ['PAID', 'SENT'] },
        issueDate: { gte: start, lte: end }
      },
      include: {
        supplier: true,
        invoiceItems: { include: { product: true } }
      },
      orderBy: { issueDate: 'asc' }
    })

    const totalRevenue = salesInvoices.reduce((sum, inv) => sum + inv.totalAmount, 0)
    const totalExpenses = purchaseInvoices.reduce((sum, inv) => sum + inv.totalAmount, 0)
    const netProfit = totalRevenue - totalExpenses
    const profitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0

    if (format === 'excel') {
      return exportToExcel(salesInvoices, purchaseInvoices, {
        totalRevenue,
        totalExpenses,
        netProfit,
        profitMargin,
        startDate,
        endDate
      })
    } else if (format === 'pdf') {
      return exportToPDF(salesInvoices, purchaseInvoices, {
        totalRevenue,
        totalExpenses,
        netProfit,
        profitMargin,
        startDate,
        endDate
      })
    }

    return NextResponse.json(
      { success: false, error: 'Invalid format' },
      { status: 400 }
    )
  } catch (error) {
    console.error('Error exporting financial report:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to export report' },
      { status: 500 }
    )
  }
}

function exportToExcel(salesInvoices: any[], purchaseInvoices: any[], summary: any) {
  const workbook = XLSX.utils.book_new()

  // Summary sheet
  const summaryData = [
    ['BÁO CÁO TÀI CHÍNH'],
    [`Từ ngày: ${new Date(summary.startDate).toLocaleDateString('vi-VN')} - Đến ngày: ${new Date(summary.endDate).toLocaleDateString('vi-VN')}`],
    [],
    ['Chỉ Tiêu', 'Giá Trị (VNĐ)'],
    ['Tổng Doanh Thu', summary.totalRevenue],
    ['Tổng Chi Phí', summary.totalExpenses],
    ['Lợi Nhuận Ròng', summary.netProfit],
    ['Tỷ Suất Lợi Nhuận (%)', summary.profitMargin.toFixed(2)],
  ]
  const summarySheet = XLSX.utils.aoa_to_sheet(summaryData)
  XLSX.utils.book_append_sheet(workbook, summarySheet, 'Tổng Quan')

  // Sales invoices sheet
  const salesData = [
    ['HÓA ĐƠN BÁN HÀNG'],
    [],
    ['Mã HĐ', 'Ngày', 'Khách Hàng', 'Tổng Tiền (VNĐ)', 'Trạng Thái']
  ]
  
  salesInvoices.forEach(inv => {
    salesData.push([
      inv.invoiceNumber,
      new Date(inv.issueDate).toLocaleDateString('vi-VN'),
      inv.customer?.user?.name || 'N/A',
      inv.totalAmount,
      inv.status
    ])
  })
  
  salesData.push([])
  salesData.push(['TỔNG DOANH THU', '', '', summary.totalRevenue, ''])

  const salesSheet = XLSX.utils.aoa_to_sheet(salesData)
  XLSX.utils.book_append_sheet(workbook, salesSheet, 'Hóa Đơn Bán')

  // Purchase invoices sheet
  const purchaseData = [
    ['HÓA ĐƠN MUA HÀNG'],
    [],
    ['Mã HĐ', 'Ngày', 'Nhà Cung Cấp', 'Tổng Tiền (VNĐ)', 'Trạng Thái']
  ]
  
  purchaseInvoices.forEach(inv => {
    purchaseData.push([
      inv.invoiceNumber,
      new Date(inv.issueDate).toLocaleDateString('vi-VN'),
      inv.supplier?.name || 'N/A',
      inv.totalAmount,
      inv.status
    ])
  })
  
  purchaseData.push([])
  purchaseData.push(['TỔNG CHI PHÍ', '', '', summary.totalExpenses, ''])

  const purchaseSheet = XLSX.utils.aoa_to_sheet(purchaseData)
  XLSX.utils.book_append_sheet(workbook, purchaseSheet, 'Hóa Đơn Mua')

  // Generate buffer
  const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' })

  return new NextResponse(buffer, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename=bao-cao-tai-chinh-${summary.startDate}-${summary.endDate}.xlsx`
    }
  })
}

function exportToPDF(salesInvoices: any[], purchaseInvoices: any[], summary: any) {
  const doc = new jsPDF()

  // Add Vietnamese font support (simplified - you may need to add proper font)
  doc.setFont('helvetica')
  
  // Title
  doc.setFontSize(18)
  doc.text('BAO CAO TAI CHINH', 105, 15, { align: 'center' })
  
  doc.setFontSize(10)
  doc.text(`Tu ngay: ${new Date(summary.startDate).toLocaleDateString('vi-VN')}`, 105, 22, { align: 'center' })
  doc.text(`Den ngay: ${new Date(summary.endDate).toLocaleDateString('vi-VN')}`, 105, 27, { align: 'center' })

  // Summary section
  doc.setFontSize(12)
  doc.text('TONG QUAN', 14, 40)
  
  autoTable(doc, {
    startY: 45,
    head: [['Chi Tieu', 'Gia Tri (VND)']],
    body: [
      ['Tong Doanh Thu', summary.totalRevenue.toLocaleString('vi-VN')],
      ['Tong Chi Phi', summary.totalExpenses.toLocaleString('vi-VN')],
      ['Loi Nhuan Rong', summary.netProfit.toLocaleString('vi-VN')],
      ['Ty Suat Loi Nhuan (%)', summary.profitMargin.toFixed(2) + '%'],
    ],
    theme: 'grid',
    headStyles: { fillColor: [41, 128, 185] }
  })

  // Sales invoices section
  const salesY = (doc as any).lastAutoTable.finalY + 15
  doc.setFontSize(12)
  doc.text('HOA DON BAN HANG', 14, salesY)

  const salesTableData = salesInvoices.slice(0, 10).map(inv => [
    inv.invoiceNumber,
    new Date(inv.issueDate).toLocaleDateString('vi-VN'),
    inv.customer?.user?.name || 'N/A',
    inv.totalAmount.toLocaleString('vi-VN'),
    inv.status
  ])

  autoTable(doc, {
    startY: salesY + 5,
    head: [['Ma HD', 'Ngay', 'Khach Hang', 'Tong Tien', 'Trang Thai']],
    body: salesTableData,
    theme: 'striped',
    headStyles: { fillColor: [46, 204, 113] }
  })

  // Add new page if needed
  if ((doc as any).lastAutoTable.finalY > 250) {
    doc.addPage()
  }

  // Purchase invoices section
  const purchaseY = doc.getNumberOfPages() > 1 ? 20 : (doc as any).lastAutoTable.finalY + 15
  doc.setFontSize(12)
  doc.text('HOA DON MUA HANG', 14, purchaseY)

  const purchaseTableData = purchaseInvoices.slice(0, 10).map(inv => [
    inv.invoiceNumber,
    new Date(inv.issueDate).toLocaleDateString('vi-VN'),
    inv.supplier?.name || 'N/A',
    inv.totalAmount.toLocaleString('vi-VN'),
    inv.status
  ])

  autoTable(doc, {
    startY: purchaseY + 5,
    head: [['Ma HD', 'Ngay', 'Nha Cung Cap', 'Tong Tien', 'Trang Thai']],
    body: purchaseTableData,
    theme: 'striped',
    headStyles: { fillColor: [231, 76, 60] }
  })

  // Footer
  const pageCount = doc.getNumberOfPages()
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)
    doc.setFontSize(8)
    doc.text(
      `Trang ${i} / ${pageCount}`,
      doc.internal.pageSize.getWidth() / 2,
      doc.internal.pageSize.getHeight() - 10,
      { align: 'center' }
    )
  }

  const pdfBuffer = Buffer.from(doc.output('arraybuffer'))

  return new NextResponse(pdfBuffer, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename=bao-cao-tai-chinh-${summary.startDate}-${summary.endDate}.pdf`
    }
  })
}
