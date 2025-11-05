/**
 * Analytics Engine - Advanced analytics queries for admin chatbot
 */

import { prisma } from '@/lib/prisma'
import { ExtractedEntities, extractDateRange } from './entity-extractor'

export interface AnalyticsQuery {
  metric: string
  timeFrame?: 'today' | 'yesterday' | 'this_week' | 'this_month' | 'this_year'
  dateRange?: { from: Date; to: Date }
  filters?: Record<string, any>
  groupBy?: string
}

export interface AnalyticsResult {
  success: boolean
  message: string
  data?: any
  charts?: Array<{ type: string; data: any }>
  error?: string
}

/**
 * Execute analytics query
 */
export async function executeAnalyticsQuery(
  query: string,
  entities: ExtractedEntities
): Promise<AnalyticsResult> {
  const lower = query.toLowerCase()
  
  try {
    // Report queries (Báo cáo) - general report including revenue
    if (lower.includes('báo cáo') || lower.includes('report')) {
      return await getRevenueAnalytics(query, entities)
    }
    
    // Revenue queries
    if (lower.includes('doanh thu') || lower.includes('revenue')) {
      return await getRevenueAnalytics(query, entities)
    }
    
    // Product sales queries
    if (lower.includes('bán') && (lower.includes('bao nhiêu') || lower.includes('how many'))) {
      return await getProductSalesAnalytics(query, entities)
    }
    
    // Employee queries
    if (lower.includes('ai nghỉ') || lower.includes('who is off') || lower.includes('absence')) {
      return await getEmployeeAbsenceAnalytics(query, entities)
    }
    
    // Payroll queries
    if (lower.includes('ứng lương') || lower.includes('salary advance')) {
      return await getPayrollAnalytics(query, entities)
    }
    
    // Top products
    if (lower.includes('top') || lower.includes('bán chạy') || lower.includes('best selling')) {
      return await getTopProductsAnalytics(query, entities)
    }
    
    // Customer analytics
    if (lower.includes('khách hàng') && (lower.includes('mới') || lower.includes('vip'))) {
      return await getCustomerAnalytics(query, entities)
    }
    
    // Order analytics
    if (lower.includes('đơn hàng') && entities.timeFrame) {
      return await getOrderAnalytics(query, entities)
    }
    
    // Inventory analytics
    if (lower.includes('tồn kho') || lower.includes('inventory')) {
      return await getInventoryAnalytics(query, entities)
    }
    
    // Default fallback
    return {
      success: false,
      message: '❓ Không hiểu query. Vui lòng thử:\n\n' +
               '- "Doanh thu hôm nay"\n' +
               '- "Báo cáo tuần này"\n' +
               '- "Bán bao nhiêu bao xi măng hôm nay"\n' +
               '- "Ai nghỉ hôm nay"\n' +
               '- "Tổng ứng lương tháng này"\n' +
               '- "Top 5 sản phẩm bán chạy"',
      error: 'UNKNOWN_QUERY'
    }
  } catch (error: any) {
    console.error('Analytics query error:', error)
    return {
      success: false,
      message: `❌ Lỗi khi truy vấn: ${error.message}`,
      error: 'QUERY_ERROR'
    }
  }
}

/**
 * Get revenue analytics
 */
async function getRevenueAnalytics(query: string, entities: ExtractedEntities): Promise<AnalyticsResult> {
  const dateRange = getDateRangeFromEntities(entities)
  
  // Get orders in date range
  const orders = await prisma.order.findMany({
    where: {
      createdAt: {
        gte: dateRange.from,
        lt: dateRange.to
      },
      status: { not: 'CANCELLED' }
    },
    select: {
      netAmount: true,
      status: true,
      createdAt: true
    }
  })
  
  const totalRevenue = orders.reduce((sum, order) => sum + order.netAmount, 0)
  const orderCount = orders.length
  const avgOrderValue = orderCount > 0 ? totalRevenue / orderCount : 0
  
  // If no orders, return friendly message
  if (orderCount === 0) {
    const timeFrameLabel = getTimeFrameLabel(entities.timeFrame)
    const lower = query.toLowerCase()
    const isReport = lower.includes('báo cáo') || lower.includes('report')
    const title = isReport ? `Báo Cáo ${timeFrameLabel}` : `Doanh Thu ${timeFrameLabel}`
    
    let message = `📊 **${title}**\n\n`
    message += `❌ Không có dữ liệu bán hàng ${timeFrameLabel.toLowerCase()}.\n\n`
    message += `📅 Thời gian: ${dateRange.from.toLocaleDateString('vi-VN')} - ${dateRange.to.toLocaleDateString('vi-VN')}\n\n`
    message += `💡 **Gợi ý:**\n`
    message += `- Kiểm tra lại khoảng thời gian\n`
    message += `- Xem báo cáo tháng này hoặc năm nay\n`
    message += `- Kiểm tra đơn hàng đang chờ xử lý`
    
    return {
      success: true,
      message,
      data: {
        totalRevenue: 0,
        orderCount: 0,
        avgOrderValue: 0,
        revenueChange: 0,
        statusCounts: {},
        dateRange,
        hasData: false
      }
    }
  }
  
  // Count by status
  const statusCounts: Record<string, number> = {}
  orders.forEach(order => {
    statusCounts[order.status] = (statusCounts[order.status] || 0) + 1
  })
  
  // Compare with previous period
  const previousRange = getPreviousPeriod(dateRange)
  const previousOrders = await prisma.order.findMany({
    where: {
      createdAt: {
        gte: previousRange.from,
        lt: previousRange.to
      },
      status: { not: 'CANCELLED' }
    },
    select: { netAmount: true }
  })
  
  const previousRevenue = previousOrders.reduce((sum, order) => sum + order.netAmount, 0)
  const revenueChange = previousRevenue > 0 
    ? ((totalRevenue - previousRevenue) / previousRevenue) * 100 
    : 0
  
  const lower = query.toLowerCase()
  const isReport = lower.includes('báo cáo') || lower.includes('report')
  const title = isReport ? `Báo Cáo ${getTimeFrameLabel(entities.timeFrame)}` : `Doanh Thu ${getTimeFrameLabel(entities.timeFrame)}`
  
  let message = `📊 **${title}**\n\n`
  message += `💰 Tổng doanh thu: **${totalRevenue.toLocaleString('vi-VN')}đ**\n`
  
  if (revenueChange !== 0 && previousRevenue > 0) {
    const arrow = revenueChange > 0 ? '📈' : '📉'
    message += `${arrow} So với kỳ trước: ${revenueChange > 0 ? '+' : ''}${revenueChange.toFixed(1)}%\n`
  }
  
  message += `📦 Số đơn hàng: **${orderCount}** đơn\n`
  message += `💵 Giá trị TB/đơn: **${avgOrderValue.toLocaleString('vi-VN')}đ**\n\n`
  
  message += `📈 **Trạng thái đơn:**\n`
  Object.entries(statusCounts).forEach(([status, count]) => {
    const emoji = getStatusEmoji(status)
    message += `${emoji} ${getStatusLabel(status)}: ${count}\n`
  })
  
  return {
    success: true,
    message,
    data: {
      totalRevenue,
      orderCount,
      avgOrderValue,
      revenueChange,
      statusCounts,
      dateRange,
      hasData: true
    }
  }
}

/**
 * Get product sales analytics
 */
async function getProductSalesAnalytics(query: string, entities: ExtractedEntities): Promise<AnalyticsResult> {
  const dateRange = getDateRangeFromEntities(entities)
  
  // Detect product category/name from query
  let productFilter: any = {}
  
  if (entities.productCategory) {
    productFilter.product = {
      category: entities.productCategory.toUpperCase()
    }
  } else if (entities.productName) {
    productFilter.product = {
      name: { contains: entities.productName, mode: 'insensitive' }
    }
  }
  
  // Get order items
  const orderItems = await prisma.orderItem.findMany({
    where: {
      ...productFilter,
      order: {
        createdAt: {
          gte: dateRange.from,
          lt: dateRange.to
        },
        status: { not: 'CANCELLED' }
      }
    },
    include: {
      product: { select: { name: true, unit: true, category: true } }
    }
  })
  
  if (orderItems.length === 0) {
    return {
      success: true,
      message: `📊 Không có dữ liệu bán hàng ${entities.productName || entities.productCategory || ''} ${getTimeFrameLabel(entities.timeFrame)}`,
      data: { totalQuantity: 0, totalRevenue: 0 }
    }
  }
  
  // Aggregate by product
  const productStats: Record<string, any> = {}
  
  orderItems.forEach(item => {
    const key = item.product.name
    if (!productStats[key]) {
      productStats[key] = {
        name: item.product.name,
        unit: item.product.unit,
        category: item.product.category,
        totalQuantity: 0,
        totalRevenue: 0,
        orderCount: 0
      }
    }
    
    productStats[key].totalQuantity += item.quantity
    productStats[key].totalRevenue += item.totalPrice
    productStats[key].orderCount += 1
  })
  
  // Sort by quantity
  const sorted = Object.values(productStats).sort((a: any, b: any) => b.totalQuantity - a.totalQuantity)
  
  let message = `📊 **Doanh Số ${entities.productName || entities.productCategory || 'Sản Phẩm'}**\n`
  message += `⏰ ${getTimeFrameLabel(entities.timeFrame)}\n\n`
  
  if (sorted.length === 1) {
    const stats = sorted[0]
    message += `📦 Sản phẩm: **${stats.name}**\n`
    message += `📈 Đã bán: **${stats.totalQuantity} ${stats.unit}**\n`
    message += `💰 Doanh thu: **${stats.totalRevenue.toLocaleString('vi-VN')}đ**\n`
    message += `🛒 Số đơn: ${stats.orderCount}\n`
  } else {
    message += `📋 Tìm thấy ${sorted.length} sản phẩm:\n\n`
    
    sorted.slice(0, 5).forEach((stats: any, idx) => {
      message += `${idx + 1}. **${stats.name}**\n`
      message += `   Bán: ${stats.totalQuantity} ${stats.unit} | `
      message += `Doanh thu: ${stats.totalRevenue.toLocaleString('vi-VN')}đ\n`
    })
    
    if (sorted.length > 5) {
      message += `\n... và ${sorted.length - 5} sản phẩm khác`
    }
    
    // Total
    const totalQuantity = sorted.reduce((sum: number, s: any) => sum + s.totalQuantity, 0)
    const totalRevenue = sorted.reduce((sum: number, s: any) => sum + s.totalRevenue, 0)
    message += `\n\n📊 **Tổng cộng:**\n`
    message += `Số lượng: ${totalQuantity} | Doanh thu: ${totalRevenue.toLocaleString('vi-VN')}đ`
  }
  
  return {
    success: true,
    message,
    data: { products: sorted, dateRange }
  }
}

/**
 * Get employee absence analytics
 */
async function getEmployeeAbsenceAnalytics(query: string, entities: ExtractedEntities): Promise<AnalyticsResult> {
  const dateRange = getDateRangeFromEntities(entities)
  
  // Get work shifts for the date range
  const shifts = await prisma.workShift.findMany({
    where: {
      date: {
        gte: dateRange.from,
        lt: dateRange.to
      }
    },
    include: {
      employee: {
        include: { user: true }
      }
    },
    orderBy: { date: 'desc' }
  })
  
  // Filter absent employees
  const absentShifts = shifts.filter(shift => !shift.clockIn || shift.status === 'ABSENT')
  
  let message = `👥 **Nhân Viên Nghỉ ${getTimeFrameLabel(entities.timeFrame)}**\n\n`
  
  if (absentShifts.length === 0) {
    message += `✅ Không có nhân viên nào nghỉ!\n\nTất cả nhân viên đều có mặt.`
  } else {
    message += `🔴 Có **${absentShifts.length}** ca nghỉ:\n\n`
    
    absentShifts.forEach((shift, idx) => {
      message += `${idx + 1}. **${shift.employee.user.name}**\n`
      message += `   Ca: ${shift.shiftType} | Ngày: ${shift.date.toLocaleDateString('vi-VN')}\n`
      if (shift.notes) {
        message += `   Lý do: ${shift.notes}\n`
      }
    })
  }
  
  // Count working employees
  const workingShifts = shifts.filter(shift => shift.clockIn && shift.status !== 'ABSENT')
  message += `\n✅ Đang làm việc: ${workingShifts.length} ca`
  
  return {
    success: true,
    message,
    data: {
      absentCount: absentShifts.length,
      workingCount: workingShifts.length,
      absentEmployees: absentShifts.map(s => ({
        name: s.employee.user.name,
        shiftType: s.shiftType,
        date: s.date,
        notes: s.notes
      }))
    }
  }
}

/**
 * Get payroll analytics
 */
async function getPayrollAnalytics(query: string, entities: ExtractedEntities): Promise<AnalyticsResult> {
  const dateRange = getDateRangeFromEntities(entities)
  
  // Get payroll records
  const payrolls = await prisma.payrollRecord.findMany({
    where: {
      paidAt: {
        gte: dateRange.from,
        lt: dateRange.to
      },
      isPaid: true
    },
    include: {
      employee: {
        include: { user: true }
      }
    }
  })
  
  const totalPaid = payrolls.reduce((sum, p) => sum + p.netPay, 0)
  const totalAdvances = payrolls.reduce((sum, p) => sum + p.totalAdvances, 0)
  const totalBonus = payrolls.reduce((sum, p) => sum + p.bonuses, 0)
  const totalDeductions = payrolls.reduce((sum, p) => sum + (p.penalties + p.taxDeductions + p.otherDeductions), 0)
  
  let message = `💰 **Báo Cáo Lương ${getTimeFrameLabel(entities.timeFrame)}**\n\n`
  message += `💵 Tổng chi trả: **${totalPaid.toLocaleString('vi-VN')}đ**\n`
  message += `📊 Số nhân viên: ${payrolls.length} người\n`
  message += `💸 Tổng ứng lương: ${totalAdvances.toLocaleString('vi-VN')}đ\n`
  
  if (totalBonus > 0) {
    message += `🎁 Tổng thưởng: ${totalBonus.toLocaleString('vi-VN')}đ\n`
  }
  
  if (totalDeductions > 0) {
    message += `⚠️ Tổng khấu trừ: ${totalDeductions.toLocaleString('vi-VN')}đ\n`
  }
  
  if (payrolls.length > 0) {
    const avgSalary = totalPaid / payrolls.length
    message += `\n📈 Lương TB: ${avgSalary.toLocaleString('vi-VN')}đ/người`
  }
  
  return {
    success: true,
    message,
    data: {
      totalPaid,
      totalAdvances,
      totalBonus,
      totalDeductions,
      employeeCount: payrolls.length,
      payrolls: payrolls.map(p => ({
        employeeName: p.employee.user.name,
        netPay: p.netPay,
        totalAdvances: p.totalAdvances,
        bonuses: p.bonuses,
        penalties: p.penalties,
        taxDeductions: p.taxDeductions,
        otherDeductions: p.otherDeductions
      }))
    }
  }
}

/**
 * Get top products analytics
 */
async function getTopProductsAnalytics(query: string, entities: ExtractedEntities): Promise<AnalyticsResult> {
  const dateRange = getDateRangeFromEntities(entities)
  const limit = 5 // Top 5 by default
  
  // Get order items
  const orderItems = await prisma.orderItem.findMany({
    where: {
      order: {
        createdAt: {
          gte: dateRange.from,
          lt: dateRange.to
        },
        status: { not: 'CANCELLED' }
      }
    },
    include: {
      product: { select: { name: true, unit: true } }
    }
  })
  
  // Aggregate by product
  const productStats: Record<string, any> = {}
  
  orderItems.forEach(item => {
    const key = item.product.name
    if (!productStats[key]) {
      productStats[key] = {
        name: item.product.name,
        unit: item.product.unit,
        totalQuantity: 0,
        totalRevenue: 0,
        orderCount: 0
      }
    }
    
    productStats[key].totalQuantity += item.quantity
    productStats[key].totalRevenue += item.totalPrice
    productStats[key].orderCount += 1
  })
  
  // Sort by revenue
  const sorted = Object.values(productStats)
    .sort((a: any, b: any) => b.totalRevenue - a.totalRevenue)
    .slice(0, limit)
  
  let message = `🏆 **Top ${limit} Sản Phẩm Bán Chạy**\n`
  message += `⏰ ${getTimeFrameLabel(entities.timeFrame)}\n\n`
  
  sorted.forEach((stats: any, idx) => {
    const medal = ['🥇', '🥈', '🥉', '4️⃣', '5️⃣'][idx]
    message += `${medal} **${stats.name}**\n`
    message += `   💰 Doanh thu: ${stats.totalRevenue.toLocaleString('vi-VN')}đ\n`
    message += `   📦 Số lượng: ${stats.totalQuantity} ${stats.unit}\n`
    message += `   🛒 Số đơn: ${stats.orderCount}\n\n`
  })
  
  return {
    success: true,
    message,
    data: { topProducts: sorted, dateRange }
  }
}

/**
 * Get customer analytics
 */
async function getCustomerAnalytics(query: string, entities: ExtractedEntities): Promise<AnalyticsResult> {
  const lower = query.toLowerCase()
  
  if (lower.includes('mới') || lower.includes('new')) {
    // New customers
    const dateRange = getDateRangeFromEntities(entities)
    
    const newCustomers = await prisma.customer.findMany({
      where: {
        createdAt: {
          gte: dateRange.from,
          lt: dateRange.to
        }
      },
      include: { user: true },
      orderBy: { createdAt: 'desc' }
    })
    
    let message = `👥 **Khách Hàng Mới ${getTimeFrameLabel(entities.timeFrame)}**\n\n`
    message += `📊 Tổng số: **${newCustomers.length}** khách hàng\n\n`
    
    if (newCustomers.length > 0) {
      newCustomers.slice(0, 10).forEach((customer, idx) => {
        message += `${idx + 1}. ${customer.user.name}\n`
        message += `   📧 ${customer.user.email}\n`
        message += `   📅 ${customer.createdAt.toLocaleDateString('vi-VN')}\n`
      })
      
      if (newCustomers.length > 10) {
        message += `\n... và ${newCustomers.length - 10} khách khác`
      }
    }
    
    return {
      success: true,
      message,
      data: { newCustomers: newCustomers.length }
    }
  } else if (lower.includes('vip') || lower.includes('top')) {
    // VIP customers
    const customers = await prisma.customer.findMany({
      orderBy: { totalPurchases: 'desc' },
      take: 10,
      include: { 
        user: true,
        orders: {
          where: { status: { not: 'CANCELLED' } },
          select: { netAmount: true }
        }
      }
    })
    
    let message = `👑 **Top 10 Khách Hàng VIP**\n\n`
    
    customers.forEach((customer, idx) => {
      const medal = idx < 3 ? ['🥇', '🥈', '🥉'][idx] : `${idx + 1}.`
      const totalOrders = customer.orders.length
      const totalSpent = customer.orders.reduce((sum, order) => sum + order.netAmount, 0)
      
      message += `${medal} **${customer.user.name}**\n`
      message += `   💰 Tổng chi: ${totalSpent.toLocaleString('vi-VN')}đ\n`
      message += `   📦 Đơn hàng: ${totalOrders}\n`
      message += `   ${customer.loyaltyTier} Tier\n\n`
    })
    
    return {
      success: true,
      message,
      data: { vipCustomers: customers }
    }
  }
  
  return {
    success: false,
    message: '❓ Query không được hỗ trợ. Thử: "Khách hàng mới hôm nay" hoặc "Khách VIP"',
    error: 'UNSUPPORTED_QUERY'
  }
}

/**
 * Get order analytics
 */
async function getOrderAnalytics(query: string, entities: ExtractedEntities): Promise<AnalyticsResult> {
  const dateRange = getDateRangeFromEntities(entities)
  
  const orders = await prisma.order.findMany({
    where: {
      createdAt: {
        gte: dateRange.from,
        lt: dateRange.to
      }
    },
    select: {
      status: true,
      netAmount: true,
      paymentMethod: true
    }
  })
  
  let message = `📦 **Đơn Hàng ${getTimeFrameLabel(entities.timeFrame)}**\n\n`
  message += `📊 Tổng đơn: **${orders.length}**\n\n`
  
  // Group by status
  const byStatus: Record<string, number> = {}
  orders.forEach(order => {
    byStatus[order.status] = (byStatus[order.status] || 0) + 1
  })
  
  message += `**Theo trạng thái:**\n`
  Object.entries(byStatus).forEach(([status, count]) => {
    message += `${getStatusEmoji(status)} ${getStatusLabel(status)}: ${count}\n`
  })
  
  return {
    success: true,
    message,
    data: { totalOrders: orders.length, byStatus }
  }
}

/**
 * Get inventory analytics
 */
async function getInventoryAnalytics(query: string, entities: ExtractedEntities): Promise<AnalyticsResult> {
  // This is already implemented in existing chatbot
  // We can call the existing logic or duplicate here
  return {
    success: false,
    message: '💡 Dùng query "Sản phẩm sắp hết" để xem cảnh báo tồn kho.',
    error: 'USE_EXISTING_QUERY'
  }
}

/**
 * Helper functions
 */

function getDateRangeFromEntities(entities: ExtractedEntities): { from: Date; to: Date } {
  if (entities.dateRange) {
    return entities.dateRange
  }
  
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  
  switch (entities.timeFrame) {
    case 'today':
      const tomorrow = new Date(today)
      tomorrow.setDate(tomorrow.getDate() + 1)
      return { from: today, to: tomorrow }
    
    case 'yesterday':
      const yesterday = new Date(today)
      yesterday.setDate(yesterday.getDate() - 1)
      return { from: yesterday, to: today }
    
    case 'this_week':
      const dayOfWeek = today.getDay()
      const monday = new Date(today)
      monday.setDate(today.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1))
      const sunday = new Date(monday)
      sunday.setDate(monday.getDate() + 7)
      return { from: monday, to: sunday }
    
    case 'this_month':
      const firstDay = new Date(today.getFullYear(), today.getMonth(), 1)
      const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0)
      lastDay.setHours(23, 59, 59, 999)
      return { from: firstDay, to: lastDay }
    
    case 'this_year':
      const jan1 = new Date(today.getFullYear(), 0, 1)
      const dec31 = new Date(today.getFullYear(), 11, 31, 23, 59, 59, 999)
      return { from: jan1, to: dec31 }
    
    default:
      // Default to today
      const tmrw = new Date(today)
      tmrw.setDate(tmrw.getDate() + 1)
      return { from: today, to: tmrw }
  }
}

function getPreviousPeriod(dateRange: { from: Date; to: Date }): { from: Date; to: Date } {
  const duration = dateRange.to.getTime() - dateRange.from.getTime()
  const previousFrom = new Date(dateRange.from.getTime() - duration)
  const previousTo = new Date(dateRange.to.getTime() - duration)
  return { from: previousFrom, to: previousTo }
}

function getTimeFrameLabel(timeFrame?: string): string {
  const labels: Record<string, string> = {
    'today': 'Hôm Nay',
    'yesterday': 'Hôm Qua',
    'this_week': 'Tuần Này',
    'this_month': 'Tháng Này',
    'this_year': 'Năm Nay'
  }
  return labels[timeFrame || 'today'] || 'Hôm Nay'
}

function getStatusEmoji(status: string): string {
  const emojis: Record<string, string> = {
    'PENDING': '⏰',
    'CONFIRMED': '✅',
    'PROCESSING': '🔄',
    'SHIPPED': '🚚',
    'COMPLETED': '✅',
    'CANCELLED': '❌'
  }
  return emojis[status] || '📦'
}

function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    'PENDING': 'Chờ xử lý',
    'CONFIRMED': 'Đã xác nhận',
    'PROCESSING': 'Đang xử lý',
    'SHIPPED': 'Đang giao',
    'COMPLETED': 'Hoàn thành',
    'CANCELLED': 'Đã hủy'
  }
  return labels[status] || status
}
