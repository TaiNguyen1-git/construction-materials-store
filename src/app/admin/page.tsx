'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { fetchWithAuth } from '@/lib/api-client'
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, AreaChart, Area,
  Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts'
import {
  Package, ShoppingCart, ClipboardList, FileText, AlertTriangle,
  Users, DollarSign, Clock, Star, RefreshCw, Sparkles,
  TrendingUp, ArrowUpRight, ArrowDownRight, Zap, Target,
  Calendar, Briefcase, Boxes, LayoutGrid, ChevronRight, ArrowRight
} from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'

interface DashboardStats {
  totalProducts: number
  totalOrders: number
  totalCustomers: number
  totalRevenue: number
  lowStockItems: number
  pendingOrders: number
}

interface DashboardData {
  kpis: DashboardStats
  revenueTrend: Array<{ date: string; revenue: number }>
  salesByCategory: Array<{ category: string; total: number; count: number }>
  topProducts: Array<{ name: string; quantity: number; revenue: number }>
  inventoryStatus: Array<{ product: string; category: string; available: number; min: number; max: number; status: string }>
  orderStatusDistribution: Array<{ status: string; count: number }>
  recentOrders: Array<{ id: string; orderNumber: string; customer: string; amount: number; status: string; date: string }>
  employeePerformance: Array<{ name: string; completed: number; total: number; rate: string }>
  predictive?: {
    next30DaysRevenue: number
    confidence: number
    trend: 'increasing' | 'decreasing' | 'stable'
    stockWarnings: Array<{
      product: string
      current: number
      min: number
      urgency: 'CRITICAL' | 'WARNING'
    }>
    reasoning?: string
  }
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316']

export default function AdminDashboard() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [isSendingReport, setIsSendingReport] = useState(false)
  const [aiSummary, setAISummary] = useState<string>('')
  const [aiSummaryLoading, setAISummaryLoading] = useState(true)

  useEffect(() => {
    fetchDashboardData(true)
    fetchAISummary()

    const interval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        fetchDashboardData(false)
      }
    }, 30000)

    return () => clearInterval(interval)
  }, [])

  const fetchAISummary = async () => {
    try {
      setAISummaryLoading(true)
      const response = await fetchWithAuth('/api/admin/ai-summary')
      if (response.ok) {
        const result = await response.json()
        setAISummary(result.data?.summary || '')
      }
    } catch (error) {
      console.error('Failed to fetch AI summary:', error)
    } finally {
      setAISummaryLoading(false)
    }
  }


  const handleSendReport = async () => {
    try {
      setIsSendingReport(true)
      const response = await fetchWithAuth('/api/admin/reports/trigger?type=DAILY')
      if (response.ok) {
        alert('📊 Báo cáo ngày đã được gửi tới email của bạn!')
      } else {
        alert('❌ Có lỗi khi gửi báo cáo')
      }
    } catch (error) {
      console.error('Report error:', error)
    } finally {
      setIsSendingReport(false)
    }
  }

  const fetchDashboardData = async (showLoading = true) => {
    try {
      if (showLoading) setLoading(true)
      const response = await fetchWithAuth('/api/analytics/dashboard?days=30')
      if (response.ok) {
        const result = await response.json()
        setData(result.data)
      }
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error)
    } finally {
      if (showLoading) setLoading(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      minimumFractionDigits: 0
    }).format(amount)
  }

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('vi-VN').format(num)
  }

  const quickActions = [
    { name: 'Thêm Sản Phẩm', href: '/admin/products', icon: Package, color: 'text-blue-600 bg-blue-50' },
    { name: 'Xem Đơn Hàng', href: '/admin/orders', icon: ShoppingCart, color: 'text-emerald-600 bg-emerald-50' },
    { name: 'Quản Lý Kho', href: '/admin/inventory', icon: Boxes, color: 'text-amber-600 bg-amber-50' },
    { name: 'Bảng Lương', href: '/admin/payroll', icon: Target, color: 'text-purple-600 bg-purple-50' },
  ]

  const stats = data?.kpis || {
    totalProducts: 0,
    totalOrders: 0,
    totalCustomers: 0,
    totalRevenue: 0,
    lowStockItems: 0,
    pendingOrders: 0
  }

  const statCards = [
    {
      title: 'Danh mục sản phẩm',
      value: formatNumber(stats.totalProducts),
      icon: Package,
      color: 'bg-blue-50 text-blue-600',
      trend: '+12%',
      sub: 'Mã SKU'
    },
    {
      title: 'Tồn kho cảnh báo',
      value: formatNumber(stats.lowStockItems),
      icon: AlertTriangle,
      color: 'bg-red-50 text-red-600',
      trend: stats.lowStockItems > 10 ? 'Urgent' : 'Low Risk',
      sub: 'Mức Quan Trọng'
    },
    {
      title: 'Thanh khoản đơn hàng',
      value: formatNumber(stats.totalOrders),
      icon: ShoppingCart,
      color: 'bg-emerald-50 text-emerald-600',
      trend: '+8%',
      sub: 'Khối Lượng'
    },
    {
      title: 'Cơ sở khách hàng',
      value: formatNumber(stats.totalCustomers),
      icon: Users,
      color: 'bg-indigo-50 text-indigo-600',
      trend: '+15%',
      sub: 'Người Dùng'
    },
    {
      title: 'Tổng doanh thu',
      value: formatCurrency(stats.totalRevenue),
      icon: DollarSign,
      color: 'bg-emerald-600 text-white',
      trend: '+23%',
      sub: 'Trong Tháng',
      isHero: true
    },
    {
      title: 'Đơn chờ xử lý',
      value: formatNumber(stats.pendingOrders),
      icon: Clock,
      color: 'bg-amber-50 text-amber-600',
      trend: 'Queued',
      sub: 'Chờ Xử Lý'
    }
  ]

  if (loading) {
    return (
      <div className="space-y-10 animate-pulse">
        {/* Header Skeleton */}
        <div className="flex flex-col lg:flex-row gap-6">
          <div className="flex-1 space-y-2 pt-4">
            <div className="flex gap-2">
              <Skeleton className="h-12 w-40 rounded-2xl" />
              <Skeleton className="h-12 w-16 rounded-2xl" />
            </div>
          </div>
          <Skeleton className="h-[200px] lg:w-[450px] rounded-[40px]" />
        </div>

        {/* Stat Cards Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className={`h-40 rounded-[40px] ${i === 4 ? 'lg:col-span-2' : ''}`} />
          ))}
        </div>

        {/* Charts Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <Skeleton className="lg:col-span-8 h-[450px] rounded-[40px]" />
          <Skeleton className="lg:col-span-4 h-[450px] rounded-[40px]" />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-1000">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-end gap-6 px-2">
        <div>
          <h1 className="text-5xl font-black text-slate-900 tracking-tighter mb-2">
            Hệ thống <span className="text-blue-600 italic">Vận hành</span>
          </h1>
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5 px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-[10px] font-black uppercase tracking-widest border border-blue-100/50">
              <Calendar size={12} />
              {new Date().toLocaleDateString('vi-VN', { day: 'numeric', month: 'long', year: 'numeric' })}
            </span>
            <span className="w-1 h-1 rounded-full bg-slate-300"></span>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
              <Clock size={12} /> Cập nhật: {new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={handleSendReport}
            disabled={isSendingReport}
            className="group flex items-center gap-3 bg-white hover:bg-slate-50 text-slate-700 px-6 py-3.5 rounded-2xl font-black text-[11px] uppercase tracking-widest border border-slate-200 transition-all active:scale-95 shadow-sm"
          >
            {isSendingReport ? <RefreshCw className="animate-spin text-blue-600" size={16} /> : <FileText className="text-blue-600 group-hover:scale-110 transition-transform" size={16} />}
            Xuất Báo Cáo
          </button>
          <button
            onClick={() => fetchDashboardData(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-3.5 rounded-2xl font-black transition-all active:rotate-180 shadow-lg shadow-blue-600/20"
            title="Làm mới dữ liệu"
          >
            <RefreshCw size={18} />
          </button>
        </div>
      </div>

      {/* Bento Grid Layer 1: AI & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
        {/* Left: AI Insight (Option 1 & 2 vibe) */}
        <div className="lg:col-span-7 bg-white rounded-[40px] p-10 relative overflow-hidden group border border-slate-200 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.05)]">
          <div className="absolute top-0 right-0 w-80 h-80 bg-blue-600/5 rounded-full -mr-20 -mt-20 blur-3xl transition-all duration-700 group-hover:bg-blue-600/10"></div>

          <div className="relative z-10 flex flex-col h-full">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-600/20">
                  <LayoutGrid size={20} className="text-white" />
                </div>
                <div>
                  <h3 className="text-[11px] font-black text-blue-600 uppercase tracking-[0.2em]">SmartBuild Analytics</h3>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Tóm lược vận hành hệ thống</p>
                </div>
              </div>
              <button
                onClick={fetchAISummary}
                className="p-2.5 rounded-xl bg-slate-50 text-slate-400 hover:bg-blue-50 hover:text-blue-600 transition-all border border-slate-100"
              >
                <Zap size={16} />
              </button>
            </div>

            <div className="bg-slate-50/50 rounded-3xl p-8 border border-slate-100/50 relative group/insight">
              <div className="absolute -top-3 -left-3">
                <div className="p-2 bg-white rounded-lg shadow-sm border border-slate-100">
                  <FileText size={14} className="text-blue-600" />
                </div>
              </div>
              <p className="text-lg font-bold text-slate-700 leading-relaxed">
                {aiSummaryLoading ? (
                  <span className="flex items-baseline gap-2">
                    <span className="h-4 w-4 bg-blue-600/20 rounded-full animate-ping"></span>
                    Đang tổng hợp dữ liệu...
                  </span>
                ) : (
                  aiSummary || 'Tín hiệu kinh doanh ổn định. Hệ thống không ghi nhận bất thường nào trong 24 giờ qua.'
                )}
              </p>
            </div>

            <div className="mt-8 grid grid-cols-2 gap-6">
              {data?.predictive && (
                <>
                  <div className="space-y-2">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Dự báo doanh thu (30d)</span>
                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl font-black text-slate-900 tracking-tighter">
                        {formatCurrency(data?.predictive?.next30DaysRevenue || 0)}
                      </span>
                      <div className={`flex items-center text-[10px] font-black ${data?.predictive?.trend === 'increasing' ? 'text-emerald-500' : 'text-amber-500'}`}>
                        {data?.predictive?.trend === 'increasing' ? <ArrowUpRight size={12} /> : <TrendingUp size={12} />}
                      </div>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between items-end">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Chỉ số tin cậy</span>
                      <span className={`text-xs font-black leading-none ${(data?.predictive?.confidence || 0) >= 0.7 ? 'text-emerald-500' :
                        (data?.predictive?.confidence || 0) >= 0.5 ? 'text-amber-500' : 'text-rose-500'
                        }`}>
                        {((data?.predictive?.confidence || 0) * 100).toFixed(0)}%
                      </span>
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-1000 ${(data?.predictive?.confidence || 0) >= 0.7 ? 'bg-emerald-500' :
                          (data?.predictive?.confidence || 0) >= 0.5 ? 'bg-amber-500' : 'bg-rose-500'
                          }`}
                        style={{ width: `${(data?.predictive?.confidence || 0) * 100}%` }}
                      ></div>
                    </div>
                    {data?.predictive?.reasoning && (
                      <p className="text-[8px] text-slate-400 font-bold uppercase tracking-tight truncate hover:whitespace-normal transition-all" title={data.predictive.reasoning as string}>
                        {data.predictive.reasoning as string}
                      </p>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Right: Quick Actions Grid */}
        <div className="lg:col-span-5 grid grid-cols-2 gap-6">
          {quickActions.map((action, i) => (
            <Link key={i} href={action.href} className="group relative bg-white hover:bg-blue-600 rounded-[40px] p-8 border border-slate-200 shadow-sm transition-all duration-500 flex flex-col justify-between overflow-hidden">
              <div className="absolute -right-4 -top-4 w-24 h-24 bg-blue-600/5 group-hover:bg-white/20 rounded-full blur-2xl transition-all"></div>

              <div className={`w-14 h-14 rounded-[20px] ${action.color} shadow-sm flex items-center justify-center transition-all duration-500 group-hover:scale-110 group-hover:bg-white`}>
                <action.icon size={26} className="group-hover:text-blue-600 transition-colors" />
              </div>

              <div>
                <h4 className="text-[11px] font-black text-slate-400 group-hover:text-white/60 uppercase tracking-[0.2em] mb-1 transition-colors">ERP Action</h4>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-black text-slate-900 group-hover:text-white transition-colors">{action.name}</span>
                  <div className="w-8 h-8 rounded-full border border-slate-200 group-hover:border-white/30 flex items-center justify-center opacity-0 group-hover:opacity-100 -translate-x-4 group-hover:translate-x-0 transition-all duration-500">
                    <ArrowRight size={14} className="text-white" />
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Stats Grid Layer - High Precision Bento */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-6">
        {statCards.map((stat, index) => (
          <div
            key={index}
            className={`bg-white rounded-[40px] border border-slate-100 p-8 shadow-[0_10px_40px_-15px_rgba(0,0,0,0.03)] hover:shadow-xl hover:-translate-y-1 transition-all group relative overflow-hidden ${stat.isHero ? 'md:col-span-2 lg:col-span-2 ring-2 ring-emerald-500/10' : 'lg:col-span-1'
              }`}
          >
            {stat.isHero && <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 blur-[60px] pointer-events-none"></div>}

            <div className="flex flex-col h-full justify-between gap-6">
              <div className="flex justify-between items-start">
                <div>
                  <dt className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">{stat.title}</dt>
                  <dd className={`font-extrabold text-slate-900 tracking-tighter ${stat.isHero ? 'text-4xl' : 'text-2xl line-clamp-1'}`}>
                    {stat.value}
                  </dd>
                </div>
                <div className={`p-4 rounded-2xl ${stat.color} transition-all duration-500 group-hover:rotate-12`}>
                  <stat.icon size={24} />
                </div>
              </div>

              <div className="flex items-center justify-between border-t border-slate-50 pt-4">
                <div className={`text-[10px] font-black px-2.5 py-1 rounded-lg uppercase tracking-widest ${stat.trend.includes('+') ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-50 text-slate-400'
                  }`}>
                  {stat.trend}
                </div>
                <div className="text-[10px] font-bold text-slate-300 uppercase italic tracking-tighter">{stat.sub}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Analytics Visualization Layer */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Main Revenue Chart */}
        <div className="lg:col-span-8 bg-white rounded-[40px] border border-slate-100 p-10 shadow-sm relative overflow-hidden">
          <div className="flex justify-between items-center mb-10">
            <div>
              <h3 className="text-xl font-black text-slate-900 uppercase tracking-tighter italic flex items-center gap-2">
                <TrendingUp className="text-blue-600" size={20} />
                Xu Hướng Dòng Tiền
              </h3>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Biểu đồ giao dịch 30 ngày qua</p>
            </div>
            <div className="flex gap-2">
              <div className="px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg text-[10px] font-black uppercase tracking-widest">Doanh Thu (VND)</div>
            </div>
          </div>
          <div className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data?.revenueTrend || []}>
                <defs>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }} />
                <YAxis hide />
                <Tooltip
                  contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', padding: '15px' }}
                  formatter={(value: number) => [formatCurrency(value), 'Doanh Thu']}
                />
                <Area type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={4} fillOpacity={1} fill="url(#colorRev)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Categories Distribution */}
        <div className="lg:col-span-4 bg-slate-50/50 rounded-[40px] border border-slate-100 p-10 shadow-sm flex flex-col items-center">
          <h3 className="text-xl font-black text-slate-900 uppercase tracking-tighter italic mb-6 w-full">Cơ Cấu Danh Mục</h3>
          <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data?.salesByCategory || []}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={8}
                  cornerRadius={10}
                  dataKey="total"
                >
                  {data?.salesByCategory?.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-2 gap-3 mt-6 w-full">
            {data?.salesByCategory?.slice(0, 4).map((cat, i) => (
              <div key={i} className="flex flex-col p-3 bg-white rounded-2xl border border-slate-100">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest line-clamp-1">{cat.category}</span>
                <span className="text-sm font-black text-slate-900 mt-1">{formatNumber(cat.total / 1000000)}M</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Operational Layer */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Transactions */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between px-2">
            <h3 className="text-xl font-black text-slate-900 uppercase tracking-tighter italic flex items-center gap-2">
              <ShoppingCart className="text-emerald-500" size={20} />
              Giao Dịch Gần Đây
            </h3>
            <Link href="/admin/orders" className="text-[10px] font-black text-blue-500 uppercase tracking-widest hover:underline">Xem Tất Cả</Link>
          </div>
          <div className="bg-white rounded-[40px] border border-slate-100 overflow-hidden shadow-sm">
            <table className="min-w-full divide-y divide-slate-50">
              <thead className="bg-slate-50/50">
                <tr className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                  <th className="px-6 py-4 text-left">Mã Đơn</th>
                  <th className="px-6 py-4 text-left">Khách Hàng</th>
                  <th className="px-4 py-4 text-right">Giá Trị (VND)</th>
                  <th className="px-6 py-4 text-center">Trạng Thái</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {data?.recentOrders?.map((order) => (
                  <tr key={order.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="text-xs font-black text-slate-900 group-hover:text-blue-600 transition-colors uppercase font-mono">{order.orderNumber}</div>
                      <div className="text-[9px] text-slate-300 font-bold uppercase tracking-widest mt-0.5">{order.date}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-black text-slate-400">{order.customer[0]}</div>
                        <span className="text-xs font-bold text-slate-600">{order.customer}</span>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-right">
                      <span className="text-xs font-black text-slate-900">{formatCurrency(order.amount)}</span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`px-2.5 py-1 rounded-full text-[8px] font-black uppercase tracking-widest border ${order.status === 'DELIVERED' || order.status === 'COMPLETED' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                          order.status === 'PENDING' || order.status === 'PENDING_CONFIRMATION' ? 'bg-amber-50 text-amber-600 border-amber-100' :
                            order.status === 'CANCELLED' ? 'bg-red-50 text-red-600 border-red-100' :
                              'bg-slate-50 text-slate-400 border-slate-100'
                        }`}>
                        {order.status === 'DELIVERED' ? 'Đã Giao' :
                          order.status === 'COMPLETED' ? 'Hoàn Tất' :
                            order.status === 'PENDING' ? 'Chờ Xử Lý' :
                              order.status === 'PENDING_CONFIRMATION' ? 'Chờ Xác Nhận' :
                                order.status === 'SHIPPED' ? 'Đang Giao' :
                                  order.status === 'CONFIRMED' ? 'Đã Xác Nhận' :
                                    order.status === 'CANCELLED' ? 'Đã Hủy' :
                                      order.status === 'PROCESSING' ? 'Đang Xử Lý' :
                                        order.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Quick Hub & Notifications */}
        <div className="space-y-6">
          <div className="bg-white rounded-[40px] border border-slate-100 p-8 shadow-sm relative overflow-hidden">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-black text-slate-900 uppercase tracking-tighter italic flex items-center gap-2">
                <Star className="text-yellow-500" size={18} />
                Top Bán Chạy
              </h3>
              <Link href="/admin/products" className="text-[9px] font-black text-blue-500 uppercase tracking-widest hover:underline">Chi Tiết</Link>
            </div>
            <div className="space-y-5">
              {data?.topProducts?.slice(0, 3).map((product, idx) => (
                <div key={idx} className="flex items-center justify-between group">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-black text-xs transition-colors ${idx === 0 ? 'bg-yellow-100 text-yellow-600' : 'bg-slate-100 text-slate-500'}`}>#{idx + 1}</div>
                    <div>
                      <div className="text-xs font-bold text-slate-900 line-clamp-1 group-hover:text-blue-600 transition-colors">{product.name}</div>
                      <div className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">Đã bán {product.quantity}</div>
                    </div>
                  </div>
                  <div className="text-xs font-black text-slate-900">{formatNumber(product.revenue / 1000000)}M</div>
                </div>
              ))}
              {(!data?.topProducts || data.topProducts.length === 0) && (
                <div className="text-center py-4">
                  <Package className="w-8 h-8 text-slate-200 mx-auto mb-2" />
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Chưa có dữ liệu</p>
                </div>
              )}
            </div>
          </div>

          <div className="bg-white rounded-[40px] p-8 space-y-6 shadow-xl border border-amber-100 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-amber-50 rounded-bl-[100px] pointer-events-none transition-transform group-hover:scale-110"></div>
            <div className="flex items-center justify-between relative z-10">
              <h4 className="text-[10px] font-black text-amber-600 uppercase tracking-widest">Cảnh Báo Tồn Kho</h4>
              <AlertTriangle className="text-amber-500" size={16} />
            </div>
            <div className="relative z-10 space-y-3">
              <div className="flex items-baseline gap-2">
                <div className="text-4xl font-black text-slate-900 tracking-tighter">{data?.predictive?.stockWarnings?.length || stats.lowStockItems}</div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Sản phẩm sắp hết hàng</p>
              </div>

              <div className="space-y-2 max-h-[120px] overflow-hidden">
                {data?.predictive?.stockWarnings?.slice(0, 3).map((w: any, idx: number) => (
                  <div key={idx} className="flex justify-between items-center text-[10px] font-bold">
                    <span className="text-slate-600 line-clamp-1 flex-1 mr-2">{w.product}</span>
                    <span className={`px-1.5 py-0.5 rounded ${w.urgency === 'CRITICAL' ? 'bg-red-50 text-red-500' : 'bg-amber-50 text-amber-500'}`}>
                      Còn {w.current} sản phẩm
                    </span>
                  </div>
                ))}
              </div>
            </div>
            <Link href="/admin/inventory" className="flex items-center justify-between p-4 bg-blue-500 rounded-2xl hover:bg-blue-600 transition-all text-white relative z-10 shadow-lg shadow-blue-500/30">
              <span className="text-[10px] font-black uppercase tracking-widest">Điều Chỉnh Kho</span>
              <ChevronRight size={14} />
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}