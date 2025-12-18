import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import fs from 'fs'
import path from 'path'

// Format currency in Vietnamese style
function formatCurrency(amount: number): string {
  return amount.toLocaleString('vi-VN') + 'đ'
}

function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    'PENDING': 'Chờ xử lý',
    'PENDING_CONFIRMATION': 'Chờ xác nhận',
    'CONFIRMED': 'Đã xác nhận',
    'CONFIRMED_AWAITING_DEPOSIT': 'Chờ đặt cọc',
    'DEPOSIT_PAID': 'Đã đặt cọc',
    'PROCESSING': 'Đang xử lý',
    'SHIPPED': 'Đang giao hàng',
    'DELIVERED': 'Đã giao hàng',
    'COMPLETED': 'Hoàn thành',
    'CANCELLED': 'Đã hủy',
    'RETURNED': 'Đã trả hàng'
  }
  return labels[status] || status
}

// Load and register Roboto font for Vietnamese support
async function registerVietnameseFont(doc: jsPDF): Promise<boolean> {
  try {
    const fontPath = path.join(process.cwd(), 'public', 'roboto.ttf')

    if (fs.existsSync(fontPath)) {
      const fontBuffer = fs.readFileSync(fontPath)
      const fontBase64 = fontBuffer.toString('base64')

      // Add font to jsPDF virtual file system
      doc.addFileToVFS('Roboto-Regular.ttf', fontBase64)
      doc.addFont('Roboto-Regular.ttf', 'Roboto', 'normal')

      return true
    }

    console.warn('Roboto font not found at:', fontPath)
    return false
  } catch (error) {
    console.error('Error loading Roboto font:', error)
    return false
  }
}

// GET /api/orders/[id]/invoice - Export order invoice as PDF with Vietnamese support
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Try to find by orderId first, then by orderNumber
    let order = await prisma.order.findUnique({
      where: { id },
      include: {
        customer: {
          include: {
            user: {
              select: {
                name: true,
                email: true,
                phone: true,
                address: true
              }
            }
          }
        },
        orderItems: {
          include: {
            product: {
              select: {
                name: true,
                sku: true,
                unit: true
              }
            }
          }
        }
      }
    })

    // If not found by id, try by orderNumber
    if (!order) {
      order = await prisma.order.findUnique({
        where: { orderNumber: id },
        include: {
          customer: {
            include: {
              user: {
                select: {
                  name: true,
                  email: true,
                  phone: true,
                  address: true
                }
              }
            }
          },
          orderItems: {
            include: {
              product: {
                select: {
                  name: true,
                  sku: true,
                  unit: true
                }
              }
            }
          }
        }
      })
    }

    if (!order) {
      return NextResponse.json(
        { success: false, error: 'Order not found' },
        { status: 404 }
      )
    }

    // Generate PDF invoice with improved design
    const doc = new jsPDF()
    const pageWidth = doc.internal.pageSize.getWidth()

    // Register Vietnamese font
    const hasVietnameseFont = await registerVietnameseFont(doc)
    const fontName = hasVietnameseFont ? 'Roboto' : 'helvetica'

    // ===== HEADER SECTION =====
    // Company logo placeholder (blue rectangle)
    doc.setFillColor(37, 99, 235) // Primary blue
    doc.rect(14, 10, 40, 15, 'F')
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(12)
    doc.setFont(fontName, 'normal')
    doc.text('SMARTBUILD', 34, 20, { align: 'center' })

    // Company info on the right
    doc.setTextColor(0, 0, 0)
    doc.setFontSize(10)
    doc.text('SMARTBUILD CONSTRUCTION MATERIALS', pageWidth - 14, 12, { align: 'right' })
    doc.setFontSize(8)
    doc.text('Địa chỉ: 123 Nguyễn Văn Linh, Biên Hòa, Đồng Nai', pageWidth - 14, 18, { align: 'right' })
    doc.text('Hotline: 1900-xxxx | Email: support@smartbuild.com', pageWidth - 14, 24, { align: 'right' })

    // Divider line
    doc.setDrawColor(37, 99, 235)
    doc.setLineWidth(0.5)
    doc.line(14, 30, pageWidth - 14, 30)

    // ===== INVOICE TITLE =====
    doc.setFontSize(18)
    doc.setFont(fontName, 'normal')
    doc.setTextColor(37, 99, 235)
    doc.text('HÓA ĐƠN BÁN HÀNG', pageWidth / 2, 42, { align: 'center' })
    doc.setFontSize(10)
    doc.setTextColor(100, 100, 100)
    doc.text('(Sales Invoice)', pageWidth / 2, 48, { align: 'center' })

    // ===== ORDER INFO BOX =====
    doc.setDrawColor(200, 200, 200)
    doc.setFillColor(248, 250, 252)
    doc.roundedRect(14, 54, pageWidth - 28, 22, 2, 2, 'FD')

    doc.setTextColor(0, 0, 0)
    doc.setFontSize(9)
    doc.setFont(fontName, 'normal')
    doc.text(`Mã đơn hàng: ${order.orderNumber}`, 20, 62)
    doc.text(`Ngày đặt: ${new Date(order.createdAt).toLocaleDateString('vi-VN')}`, 20, 70)
    doc.text(`Trạng thái: ${getStatusLabel(order.status)}`, pageWidth / 2, 62)
    doc.text(`Phương thức: ${order.paymentMethod === 'COD' ? 'Thanh toán khi nhận hàng' : 'Chuyển khoản'}`, pageWidth / 2, 70)

    // ===== CUSTOMER INFO =====
    const customerName = order.customerType === 'GUEST'
      ? order.guestName
      : order.customer?.user?.name || 'N/A'
    const customerPhone = order.customerType === 'GUEST'
      ? order.guestPhone
      : order.customer?.user?.phone || 'N/A'
    const customerEmail = order.customerType === 'GUEST'
      ? order.guestEmail
      : order.customer?.user?.email || ''
    const customerAddress = order.shippingAddress
      ? (order.shippingAddress as any).address || 'N/A'
      : order.customer?.user?.address || 'N/A'

    doc.setFontSize(11)
    doc.setFont(fontName, 'normal')
    doc.setTextColor(37, 99, 235)
    doc.text('THÔNG TIN KHÁCH HÀNG', 14, 86)

    doc.setFontSize(9)
    doc.setTextColor(0, 0, 0)
    doc.text(`Họ tên: ${customerName || 'N/A'}`, 14, 94)
    doc.text(`Số điện thoại: ${customerPhone}`, 14, 101)
    if (customerEmail) {
      doc.text(`Email: ${customerEmail}`, 14, 108)
    }
    doc.text(`Địa chỉ: ${customerAddress}`, 14, customerEmail ? 115 : 108)

    // ===== ORDER ITEMS TABLE =====
    const tableStartY = customerEmail ? 122 : 115

    const tableData = order.orderItems.map((item, idx) => [
      (idx + 1).toString(),
      item.product.name,
      item.product.sku || '-',
      `${item.quantity} ${item.product.unit || 'cái'}`,
      formatCurrency(item.unitPrice),
      formatCurrency(item.totalPrice)
    ])

    autoTable(doc, {
      startY: tableStartY,
      head: [['STT', 'Sản phẩm', 'Mã SP', 'Số lượng', 'Đơn giá', 'Thành tiền']],
      body: tableData,
      theme: 'striped',
      styles: {
        font: fontName,
        fontSize: 9
      },
      headStyles: {
        fillColor: [37, 99, 235],
        textColor: [255, 255, 255],
        fontStyle: 'normal',
        halign: 'center'
      },
      columnStyles: {
        0: { halign: 'center', cellWidth: 15 },
        1: { cellWidth: 55 },
        2: { halign: 'center', cellWidth: 25 },
        3: { halign: 'center', cellWidth: 25 },
        4: { halign: 'right', cellWidth: 30 },
        5: { halign: 'right', cellWidth: 32 }
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252]
      }
    })

    // ===== PRICE SUMMARY =====
    const finalY = (doc as any).lastAutoTable.finalY + 8

    // Summary box
    doc.setDrawColor(200, 200, 200)
    doc.setFillColor(248, 250, 252)
    const boxHeight = order.paymentType === 'DEPOSIT' ? 60 : 45
    doc.roundedRect(pageWidth - 90, finalY, 76, boxHeight, 2, 2, 'FD')

    let summaryY = finalY + 10
    doc.setFontSize(9)
    doc.setFont(fontName, 'normal')

    doc.text('Tạm tính:', pageWidth - 85, summaryY)
    doc.text(formatCurrency(order.totalAmount), pageWidth - 18, summaryY, { align: 'right' })

    summaryY += 8
    doc.text('Phí vận chuyển:', pageWidth - 85, summaryY)
    doc.text(formatCurrency(order.shippingAmount || 0), pageWidth - 18, summaryY, { align: 'right' })

    if (order.discountAmount > 0) {
      summaryY += 8
      doc.setTextColor(34, 197, 94)
      doc.text('Giảm giá:', pageWidth - 85, summaryY)
      doc.text('-' + formatCurrency(order.discountAmount), pageWidth - 18, summaryY, { align: 'right' })
      doc.setTextColor(0, 0, 0)
    }

    // Total line
    summaryY += 10
    doc.setDrawColor(37, 99, 235)
    doc.line(pageWidth - 85, summaryY - 3, pageWidth - 18, summaryY - 3)

    doc.setFontSize(11)
    doc.setFont(fontName, 'normal')
    doc.setTextColor(37, 99, 235)
    doc.text('TỔNG CỘNG:', pageWidth - 85, summaryY + 3)
    doc.text(formatCurrency(order.netAmount), pageWidth - 18, summaryY + 3, { align: 'right' })

    // Deposit info if applicable
    if (order.paymentType === 'DEPOSIT') {
      summaryY += 12
      doc.setFontSize(9)
      doc.setTextColor(0, 0, 0)
      doc.text(`Đặt cọc (${order.depositPercentage}%):`, pageWidth - 85, summaryY)
      doc.text(formatCurrency(order.depositAmount || 0), pageWidth - 18, summaryY, { align: 'right' })

      summaryY += 8
      doc.setTextColor(220, 38, 38)
      doc.text('Còn phải trả:', pageWidth - 85, summaryY)
      doc.text(formatCurrency(order.remainingAmount || 0), pageWidth - 18, summaryY, { align: 'right' })
    }

    // ===== PAYMENT INFO (Left side) =====
    doc.setFontSize(10)
    doc.setFont(fontName, 'normal')
    doc.setTextColor(37, 99, 235)
    doc.text('THÔNG TIN THANH TOÁN', 14, finalY + 5)

    doc.setFontSize(9)
    doc.setTextColor(0, 0, 0)
    doc.text('Ngân hàng: Vietcombank', 14, finalY + 13)
    doc.text('STK: 1234567890123', 14, finalY + 20)
    doc.text('Chủ TK: SMARTBUILD CO., LTD', 14, finalY + 27)
    doc.text(`Nội dung CK: ${order.orderNumber}`, 14, finalY + 34)

    // ===== FOOTER =====
    const footerY = 275
    doc.setDrawColor(37, 99, 235)
    doc.setLineWidth(0.3)
    doc.line(14, footerY - 5, pageWidth - 14, footerY - 5)

    doc.setFontSize(9)
    doc.setTextColor(100, 100, 100)
    doc.text('Cảm ơn quý khách đã tin tưởng và sử dụng dịch vụ của chúng tôi!', pageWidth / 2, footerY, { align: 'center' })
    doc.setFontSize(8)
    doc.text('Mọi thắc mắc xin liên hệ: Hotline 1900-xxxx | Email: support@smartbuild.com', pageWidth / 2, footerY + 6, { align: 'center' })
    doc.text(`In ngày: ${new Date().toLocaleString('vi-VN')}`, pageWidth / 2, footerY + 12, { align: 'center' })

    const pdfBuffer = Buffer.from(doc.output('arraybuffer'))

    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename=hoa-don-${order.orderNumber}.pdf`
      }
    })

  } catch (error: any) {
    console.error('Error generating invoice:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to generate invoice: ' + error.message },
      { status: 500 }
    )
  }
}
