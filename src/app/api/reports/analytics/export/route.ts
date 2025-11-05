import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import * as XLSX from 'xlsx'

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

    // Get orders in date range
    const orders = await prisma.order.findMany({
      where: {
        createdAt: {
          gte: start,
          lt: end
        },
        status: { not: 'CANCELLED' }
      },
      include: {
        orderItems: {
          include: {
            product: {
              select: {
                name: true,
                unit: true
              }
            }
          }
        },
        customer: {
          include: {
            user: {
              select: {
                name: true,
                email: true
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    const totalRevenue = orders.reduce((sum, order) => sum + order.netAmount, 0)
    const orderCount = orders.length
    const avgOrderValue = orderCount > 0 ? totalRevenue / orderCount : 0

    // Count by status
    const statusCounts: Record<string, number> = {}
    orders.forEach(order => {
      statusCounts[order.status] = (statusCounts[order.status] || 0) + 1
    })

    if (format === 'excel') {
      return exportToExcel(orders, {
        totalRevenue,
        orderCount,
        avgOrderValue,
        statusCounts,
        startDate,
        endDate
      })
    }

    return NextResponse.json(
      { success: false, error: 'Only Excel format is supported for analytics export' },
      { status: 400 }
    )
  } catch (error) {
    console.error('Error exporting analytics report:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to export report' },
      { status: 500 }
    )
  }
}

function exportToExcel(orders: any[], summary: any) {
  const workbook = XLSX.utils.book_new()

  // Summary sheet
  const summaryData = [
    ['BÁO CÁO DOANH THU'],
    [`Từ ngày: ${new Date(summary.startDate).toLocaleDateString('vi-VN')} - Đến ngày: ${new Date(summary.endDate).toLocaleDateString('vi-VN')}`],
    [],
    ['Chỉ Tiêu', 'Giá Trị'],
    ['Tổng Doanh Thu', summary.totalRevenue],
    ['Số Đơn Hàng', summary.orderCount],
    ['Giá Trị Trung Bình/Đơn', summary.avgOrderValue.toFixed(0)],
    [],
    ['**Trạng Thái Đơn Hàng**'],
  ]

  // Add status counts
  Object.entries(summary.statusCounts).forEach(([status, count]) => {
    const statusLabel = getStatusLabel(status)
    summaryData.push([statusLabel, count])
  })

  const summarySheet = XLSX.utils.aoa_to_sheet(summaryData)
  XLSX.utils.book_append_sheet(workbook, summarySheet, 'Tổng Quan')

  // Orders sheet
  const ordersData = [
    ['CHI TIẾT ĐƠN HÀNG'],
    [],
    ['Mã Đơn', 'Ngày Tạo', 'Khách Hàng', 'Số Lượng SP', 'Tổng Tiền (VNĐ)', 'Trạng Thái', 'Phương Thức TT']
  ]

  orders.forEach(order => {
    const customerName = order.customerType === 'GUEST' 
      ? order.guestName 
      : order.customer?.user?.name || 'N/A'
    
    ordersData.push([
      order.orderNumber,
      new Date(order.createdAt).toLocaleDateString('vi-VN'),
      customerName,
      order.orderItems.length,
      order.netAmount,
      getStatusLabel(order.status),
      order.paymentMethod || 'N/A'
    ])
  })

  ordersData.push([])
  ordersData.push(['TỔNG CỘNG', '', '', '', summary.totalRevenue, '', ''])

  const ordersSheet = XLSX.utils.aoa_to_sheet(ordersData)
  XLSX.utils.book_append_sheet(workbook, ordersSheet, 'Đơn Hàng')

  // Product sales sheet
  const productSales: Record<string, any> = {}
  
  orders.forEach(order => {
    order.orderItems.forEach((item: any) => {
      const productName = item.product.name
      if (!productSales[productName]) {
        productSales[productName] = {
          name: productName,
          unit: item.product.unit,
          quantity: 0,
          revenue: 0
        }
      }
      productSales[productName].quantity += item.quantity
      productSales[productName].revenue += item.totalPrice
    })
  })

  const productsData = [
    ['SẢN PHẨM BÁN CHẠY'],
    [],
    ['Tên Sản Phẩm', 'Đơn Vị', 'Số Lượng', 'Doanh Thu (VNĐ)']
  ]

  Object.values(productSales)
    .sort((a: any, b: any) => b.revenue - a.revenue)
    .forEach((product: any) => {
      productsData.push([
        product.name,
        product.unit,
        product.quantity,
        product.revenue
      ])
    })

  const productsSheet = XLSX.utils.aoa_to_sheet(productsData)
  XLSX.utils.book_append_sheet(workbook, productsSheet, 'Sản Phẩm')

  // Generate Excel file
  const excelBuffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' })
  
  return new NextResponse(excelBuffer, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="bao-cao-doanh-thu-${summary.startDate.split('T')[0]}-${summary.endDate.split('T')[0]}.xlsx"`
    }
  })
}

function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    'PENDING': 'Chờ xử lý',
    'PENDING_CONFIRMATION': 'Chờ xác nhận',
    'CONFIRMED': 'Đã xác nhận',
    'PROCESSING': 'Đang xử lý',
    'SHIPPED': 'Đang giao',
    'DELIVERED': 'Đã giao',
    'COMPLETED': 'Hoàn thành',
    'CANCELLED': 'Đã hủy'
  }
  return labels[status] || status
}

