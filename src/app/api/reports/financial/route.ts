import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    if (!startDate || !endDate) {
      return NextResponse.json(
        { success: false, error: 'startDate and endDate are required' },
        { status: 400 }
      )
    }

    const start = new Date(startDate)
    const end = new Date(endDate)
    end.setHours(23, 59, 59, 999)

    // Calculate total revenue from sales invoices
    const salesInvoices = await prisma.invoice.findMany({
      where: {
        type: 'SALES',
        status: { in: ['PAID', 'SENT'] },
        createdAt: { gte: start, lte: end }
      },
      select: {
        totalAmount: true,
        createdAt: true
      }
    })

    const totalRevenue = salesInvoices.reduce((sum, inv) => sum + inv.totalAmount, 0)

    // Calculate total expenses from purchase invoices
    const purchaseInvoices = await prisma.invoice.findMany({
      where: {
        type: 'PURCHASE',
        status: { in: ['PAID', 'SENT'] },
        createdAt: { gte: start, lte: end }
      },
      select: {
        totalAmount: true,
        createdAt: true
      }
    })

    const totalPurchaseExpenses = purchaseInvoices.reduce((sum, inv) => sum + inv.totalAmount, 0)

    // Calculate payroll expenses
    const payrollRecords = await prisma.payroll.findMany({
      where: {
        createdAt: { gte: start, lte: end }
      },
      select: {
        totalAmount: true
      }
    })

    const totalPayrollExpenses = payrollRecords.reduce((sum, p) => sum + p.totalAmount, 0)

    const totalExpenses = totalPurchaseExpenses + totalPayrollExpenses

    // Calculate net profit and margin
    const netProfit = totalRevenue - totalExpenses
    const profitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0

    // Revenue by month
    const revenueByMonth: { [key: string]: number } = {}
    salesInvoices.forEach(inv => {
      const monthKey = new Date(inv.createdAt).toLocaleDateString('vi-VN', { year: 'numeric', month: 'short' })
      revenueByMonth[monthKey] = (revenueByMonth[monthKey] || 0) + inv.totalAmount
    })

    // Expenses by category
    const expensesByCategory = [
      { category: 'Mua Hàng', amount: totalPurchaseExpenses },
      { category: 'Lương Nhân Viên', amount: totalPayrollExpenses }
    ]

    // Top revenue products
    const orderItems = await prisma.orderItem.findMany({
      where: {
        order: {
          status: 'COMPLETED',
          createdAt: { gte: start, lte: end }
        }
      },
      include: {
        product: {
          select: {
            id: true,
            name: true
          }
        }
      }
    })

    const productRevenueMap: { [key: string]: { name: string; revenue: number; quantity: number } } = {}
    orderItems.forEach(item => {
      const productId = item.product.id
      if (!productRevenueMap[productId]) {
        productRevenueMap[productId] = {
          name: item.product.name,
          revenue: 0,
          quantity: 0
        }
      }
      productRevenueMap[productId].revenue += item.price * item.quantity
      productRevenueMap[productId].quantity += item.quantity
    })

    const topRevenueProducts = Object.values(productRevenueMap)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10)

    return NextResponse.json({
      success: true,
      data: {
        totalRevenue,
        totalExpenses,
        netProfit,
        profitMargin,
        revenueByMonth: Object.entries(revenueByMonth).map(([month, revenue]) => ({
          month,
          revenue
        })),
        expensesByCategory,
        topRevenueProducts
      }
    })
  } catch (error) {
    console.error('Error fetching financial reports:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch financial reports' },
      { status: 500 }
    )
  }
}
