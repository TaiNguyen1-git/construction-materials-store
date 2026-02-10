import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createSuccessResponse, createErrorResponse } from '@/lib/api-types'

export async function GET(request: NextRequest) {
  try {
    // Aggregate customer loyalty data
    const customers = await prisma.customer.findMany({
      select: {
        id: true,
        loyaltyTier: true,
        loyaltyPoints: true,
        totalPointsEarned: true,
        totalPointsRedeemed: true,
        totalPurchases: true,
        lastPurchaseDate: true,
        createdAt: true,
      }
    })

    const totalMembers = customers.length
    const totalPointsInCirculation = customers.reduce((sum, c) => sum + (c.loyaltyPoints || 0), 0)
    const totalPointsEarned = customers.reduce((sum, c) => sum + (c.totalPointsEarned || 0), 0)
    const totalPointsRedeemed = customers.reduce((sum, c) => sum + (c.totalPointsRedeemed || 0), 0)
    const redemptionRate = totalPointsEarned > 0 ? Math.round((totalPointsRedeemed / totalPointsEarned) * 100) : 0
    const totalRevenueFromLoyalCustomers = customers.reduce((sum, c) => sum + (c.totalPurchases || 0), 0)

    // Tier distribution
    const tierDistribution = {
      BRONZE: 0,
      SILVER: 0,
      GOLD: 0,
      PLATINUM: 0,
      DIAMOND: 0,
    }
    customers.forEach(c => {
      const tier = c.loyaltyTier || 'BRONZE'
      tierDistribution[tier]++
    })

    // Voucher stats
    const voucherStats = await prisma.loyaltyVoucher.aggregate({
      _count: { id: true },
      _sum: { value: true },
    })
    const usedVouchers = await prisma.loyaltyVoucher.count({
      where: { status: 'USED' as any }
    })
    const totalVouchers = voucherStats._count.id || 0
    const voucherUsageRate = totalVouchers > 0 ? Math.round((usedVouchers / totalVouchers) * 100) : 0

    // Monthly growth (last 6 months)
    const sixMonthsAgo = new Date()
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)
    
    const monthlyGrowth: Array<{ month: string; count: number }> = []
    for (let i = 5; i >= 0; i--) {
      const date = new Date()
      date.setMonth(date.getMonth() - i)
      const startOfMonth = new Date(date.getFullYear(), date.getMonth(), 1)
      const endOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59)
      
      const count = customers.filter(c => {
        const created = new Date(c.createdAt)
        return created >= startOfMonth && created <= endOfMonth
      }).length

      monthlyGrowth.push({
        month: startOfMonth.toLocaleDateString('vi-VN', { month: 'short', year: 'numeric' }),
        count,
      })
    }

    // Churn risk: customers who haven't purchased in 60+ days
    const sixtyDaysAgo = new Date()
    sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60)
    const churnRiskCount = customers.filter(c => {
      if (!c.lastPurchaseDate) return true
      return new Date(c.lastPurchaseDate) < sixtyDaysAgo
    }).length

    return NextResponse.json(
      createSuccessResponse({
        totalMembers,
        totalPointsInCirculation,
        totalPointsEarned,
        totalPointsRedeemed,
        redemptionRate,
        totalRevenueFromLoyalCustomers,
        tierDistribution,
        voucherStats: {
          total: totalVouchers,
          used: usedVouchers,
          usageRate: voucherUsageRate,
          totalValue: voucherStats._sum.value || 0,
        },
        monthlyGrowth,
        churnRiskCount,
      }, 'Thống kê loyalty thành công'),
      { status: 200 }
    )
  } catch (error) {
    console.error('Error fetching loyalty stats:', error)
    return NextResponse.json(
      createErrorResponse('Lỗi hệ thống', 'INTERNAL_ERROR'),
      { status: 500 }
    )
  }
}
