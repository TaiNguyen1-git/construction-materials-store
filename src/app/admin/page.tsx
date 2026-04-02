'use client'

import { useQuery, useQueryClient } from '@tanstack/react-query'
import { fetchWithAuth } from '@/lib/api-client'

// Components
import DashboardSkeleton from './components/dashboard/DashboardSkeleton'
import DashboardHeader from './components/dashboard/DashboardHeader'
import AISummarySection from './components/dashboard/AISummarySection'
import QuickActionsGrid from './components/dashboard/QuickActionsGrid'
import DashboardStatsGrid from './components/dashboard/DashboardStatsGrid'
import RevenueAnalytics from './components/dashboard/RevenueAnalytics'
import OperationalLayer from './components/dashboard/OperationalLayer'
import RegionalSalesAnalytics from './components/dashboard/RegionalSalesAnalytics'

interface DashboardData {
  kpis: {
    totalProducts: number
    totalOrders: number
    totalCustomers: number
    totalRevenue: number
    lowStockItems: number
    pendingOrders: number
  }
  revenueTrend: any[]
  salesByCategory: any[]
  topProducts: any[]
  predictive?: any
  recentOrders: any[]
}

export default function AdminDashboard() {
  const queryClient = useQueryClient()

  // Fetch Dashboard Data with TanStack Query
  const { data: dashboardData, isLoading: dashboardLoading } = useQuery({
    queryKey: ['admin-dashboard'],
    queryFn: async () => {
      const resp = await fetchWithAuth('/api/analytics/dashboard?days=30')
      if (!resp.ok) throw new Error('Failed to fetch dashboard data')
      const result = await resp.json()
      return result.data as DashboardData
    },
    staleTime: 5 * 60000, // 5 minutes
    refetchInterval: 60000 // Refresh every minute in background
  })

  // Fetch AI Summary with TanStack Query
  const { data: aiSummaryData, isLoading: aiSummaryLoading, refetch: refetchAISummary } = useQuery({
    queryKey: ['admin-ai-summary'],
    queryFn: async () => {
      const resp = await fetchWithAuth('/api/admin/ai-summary')
      if (!resp.ok) throw new Error('Failed to fetch AI summary')
      const result = await resp.json()
      return result.data?.summary || ''
    },
    staleTime: 10 * 60000 
  })

  const handleSendReport = async () => {
    try {
      const res = await fetchWithAuth('/api/admin/reports/trigger?type=DAILY')
      if (res.ok) alert('📊 Báo cáo ngày đã được gửi tới email!')
      else alert('❌ Lỗi khi gửi báo cáo')
    } catch (e) {}
  }

  const formatCurrency = (v: number) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', minimumFractionDigits: 0 }).format(v)
  const formatNumber = (v: number) => new Intl.NumberFormat('vi-VN').format(v)

  if (dashboardLoading) return <DashboardSkeleton />

  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-1000">
      <DashboardHeader 
        onSendReport={handleSendReport} 
        onRefresh={() => queryClient.invalidateQueries({ queryKey: ['admin-dashboard'] })}
        isSendingReport={false} 
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
        <AISummarySection 
          aiSummary={aiSummaryData || ''} 
          aiSummaryLoading={aiSummaryLoading}
          onFetchAISummary={() => refetchAISummary()} 
          predictive={dashboardData?.predictive}
          formatCurrency={formatCurrency}
        />
        <QuickActionsGrid />
      </div>

      <DashboardStatsGrid 
        stats={dashboardData?.kpis || { totalProducts: 0, totalOrders: 0, totalCustomers: 0, totalRevenue: 0, lowStockItems: 0, pendingOrders: 0 }}
        formatCurrency={formatCurrency} formatNumber={formatNumber}
      />

      <RegionalSalesAnalytics formatCurrency={formatCurrency} />

      <RevenueAnalytics 
        revenueTrend={dashboardData?.revenueTrend || []} 
        salesByCategory={dashboardData?.salesByCategory || []}
        formatCurrency={formatCurrency} formatNumber={formatNumber}
      />

      <OperationalLayer 
        recentOrders={dashboardData?.recentOrders || []} 
        topProducts={dashboardData?.topProducts || []}
        stockWarnings={dashboardData?.predictive?.stockWarnings || []}
        lowStockCount={dashboardData?.kpis?.lowStockItems || 0}
        formatCurrency={formatCurrency} formatNumber={formatNumber}
      />
    </div>
  )
}