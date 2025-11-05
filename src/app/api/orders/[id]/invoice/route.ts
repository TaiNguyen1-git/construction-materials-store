import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

// GET /api/orders/[id]/invoice - Export order invoice as PDF (public, no auth required)
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

    // Generate PDF invoice
    const doc = new jsPDF()
    
    // Company info
    doc.setFontSize(20)
    doc.text('VIETHOA CONSTRUCTION MATERIALS', 105, 20, { align: 'center' })
    doc.setFontSize(14)
    doc.text('HOA DON BAN HANG', 105, 30, { align: 'center' })
    
    // Order info
    doc.setFontSize(10)
    doc.text(`Ma don hang: ${order.orderNumber}`, 14, 45)
    doc.text(`Ngay dat: ${new Date(order.createdAt).toLocaleDateString('vi-VN')}`, 14, 52)
    doc.text(`Trang thai: ${getStatusLabel(order.status)}`, 14, 59)
    
    // Customer info
    const customerName = order.customerType === 'GUEST' 
      ? order.guestName 
      : order.customer?.user?.name || 'N/A'
    const customerPhone = order.customerType === 'GUEST'
      ? order.guestPhone
      : order.customer?.user?.phone || 'N/A'
    const customerAddress = order.shippingAddress 
      ? (order.shippingAddress as any).address || 'N/A'
      : order.customer?.user?.address || 'N/A'
    
    doc.text('Thong tin khach hang:', 14, 70)
    doc.text(`Ten: ${customerName}`, 14, 77)
    doc.text(`SDT: ${customerPhone}`, 14, 84)
    doc.text(`Dia chi: ${customerAddress}`, 14, 91)
    
    // Order items table
    const tableData = order.orderItems.map((item, idx) => [
      idx + 1,
      item.product.name,
      item.product.sku || 'N/A',
      `${item.quantity} ${item.product.unit}`,
      item.unitPrice.toLocaleString('vi-VN'),
      item.totalPrice.toLocaleString('vi-VN')
    ])
    
    autoTable(doc, {
      startY: 100,
      head: [['STT', 'San pham', 'SKU', 'So luong', 'Don gia', 'Thanh tien']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [41, 128, 185] },
      styles: { fontSize: 9 }
    })
    
    // Price summary
    const finalY = (doc as any).lastAutoTable.finalY + 10
    doc.setFontSize(10)
    
    doc.text('Tong cong:', 140, finalY)
    doc.text(`${order.totalAmount.toLocaleString('vi-VN')}đ`, 170, finalY, { align: 'right' })
    
    if (order.shippingAmount > 0) {
      doc.text('Phi van chuyen:', 140, finalY + 7)
      doc.text(`${order.shippingAmount.toLocaleString('vi-VN')}đ`, 170, finalY + 7, { align: 'right' })
    }
    
    if (order.discountAmount > 0) {
      doc.text('Giam gia:', 140, finalY + 14)
      doc.text(`-${order.discountAmount.toLocaleString('vi-VN')}đ`, 170, finalY + 14, { align: 'right' })
    }
    
    doc.setFontSize(12)
    doc.setFont('helvetica', 'bold')
    doc.text('TONG TIEN:', 140, finalY + 23)
    doc.text(`${order.netAmount.toLocaleString('vi-VN')}đ`, 170, finalY + 23, { align: 'right' })
    
    // Deposit info if applicable
    if (order.paymentType === 'DEPOSIT') {
      doc.setFontSize(10)
      doc.setFont('helvetica', 'normal')
      doc.text(`Dat coc: ${order.depositAmount?.toLocaleString('vi-VN')}đ (${order.depositPercentage}%)`, 14, finalY + 30)
      doc.text(`Con lai: ${order.remainingAmount?.toLocaleString('vi-VN')}đ`, 14, finalY + 37)
    }
    
    // Footer
    doc.setFontSize(8)
    doc.text('Cam on quy khach da su dung dich vu!', 105, 280, { align: 'center' })
    doc.text('Hotline: 1900-xxxx | Email: support@viethoa.com', 105, 287, { align: 'center' })
    
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
      { success: false, error: 'Failed to generate invoice' },
      { status: 500 }
    )
  }
}

function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    'PENDING': 'Cho xu ly',
    'PENDING_CONFIRMATION': 'Cho xac nhan',
    'CONFIRMED': 'Da xac nhan',
    'PROCESSING': 'Dang xu ly',
    'SHIPPED': 'Dang giao',
    'DELIVERED': 'Da giao',
    'COMPLETED': 'Hoan thanh',
    'CANCELLED': 'Da huy'
  }
  return labels[status] || status
}

