'use client'

import { useState, useEffect, Suspense } from 'react'
import { 
  Coins, TrendingUp, TrendingDown, FileText, 
  Download, Calendar, BarChart3, CreditCard, Briefcase, RefreshCw 
} from 'lucide-react'
import { useSearchParams } from 'next/navigation'
import { toast } from 'react-hot-toast'
import { StatsSkeleton, TableSkeleton } from '@/components/admin/skeletons/AdminSkeletons'
import { fetchWithAuth } from '@/lib/api-client'

// ... existing interfaces ... (preserved)
interface FinancialSummary {
  totalRevenue: number
  totalExpenses: number
  netProfit: number
  profitMargin: number
  revenueByMonth: Array<{ month: string; revenue: number }>
  expensesByCategory: Array<{ category: string; amount: number }>
  topRevenueProducts: Array<{ name: string; revenue: number; quantity: number }>
}

interface Invoice {
  id: string
  invoiceNumber: string
  type: 'SALES' | 'PURCHASE'
  totalAmount: number
  status: string
  createdAt: string
  customer?: { name: string }
  supplier?: { name: string }
}

function FinancialReportsContent() {
  const searchParams = useSearchParams()
  const [activeTab, setActiveTab] = useState<'reports' | 'credit' | 'contracts'>(
    (searchParams.get('tab') as any) || 'reports'
  )
  const [summary, setSummary] = useState<FinancialSummary | null>(null)
  const [recentInvoices, setRecentInvoices] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(true)
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  })

  // Sync tab with URL
  useEffect(() => {
    const tab = searchParams.get('tab')
    if (tab && ['reports', 'credit', 'contracts'].includes(tab)) {
      setActiveTab(tab as any)
    }
  }, [searchParams])

  useEffect(() => {
    if (activeTab === 'reports') fetchFinancialData()
  }, [dateRange, activeTab])

  const fetchFinancialData = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        startDate: dateRange.startDate,
        endDate: dateRange.endDate
      })

      const [summaryRes, invoicesRes] = await Promise.all([
        fetchWithAuth(`/api/reports/financial?${params}`),
        fetchWithAuth(`/api/invoices?${params}&limit=10`)
      ])

      if (summaryRes.ok) {
        const data = await summaryRes.json()
        setSummary(data.data || {
          totalRevenue: 0,
          totalExpenses: 0,
          netProfit: 0,
          profitMargin: 0,
          revenueByMonth: [],
          expensesByCategory: [],
          topRevenueProducts: []
        })
      }

      if (invoicesRes.ok) {
        const data = await invoicesRes.json()
        setRecentInvoices(data.data || [])
      }
    } catch (error) {
      console.error('Error fetching financial data:', error)
      toast.error('Không thể tải dữ liệu tài chính')
    } finally {
      setLoading(false)
    }
  }

  const exportReport = async (format: 'excel' | 'pdf') => {
    try {
      const params = new URLSearchParams({
        startDate: dateRange.startDate,
        endDate: dateRange.endDate,
        format
      })

      const response = await fetchWithAuth(`/api/reports/financial/export?${params}`)
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `bao-cao-tai-chinh-${dateRange.startDate}-${dateRange.endDate}.${format === 'excel' ? 'xlsx' : 'pdf'}`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
        toast.success(`Đã xuất báo cáo ${format.toUpperCase()}`)
      } else {
        toast.error('Không thể xuất báo cáo')
      }
    } catch (error) {
      console.error('Error exporting report:', error)
      toast.error('Không thể xuất báo cáo')
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount)
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
             <span className="bg-slate-900 text-white p-2 rounded-2xl shadow-lg shadow-slate-200">
               {activeTab === 'reports' && <BarChart3 size={24} />}
               {activeTab === 'credit' && <CreditCard size={24} />}
               {activeTab === 'contracts' && <Briefcase size={24} />}
             </span>
             {activeTab === 'reports' && 'Báo Cáo Tài Chính'}
             {activeTab === 'credit' && 'Theo Dõi Công Nợ'}
             {activeTab === 'contracts' && 'Hợp Đồng Kinh Tế'}
          </h1>
          <p className="text-sm font-bold text-slate-400 mt-1 uppercase tracking-widest">
            Module Tài Chính & Pháp Lý Tổng Hợp
          </p>
        </div>
        
        {activeTab === 'reports' && (
          <div className="flex gap-2">
            <button
              onClick={() => exportReport('excel')}
              className="flex items-center px-6 py-2.5 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-emerald-100 transition-all"
            >
              <Download className="h-4 w-4 mr-2" />
              Excel
            </button>
            <button
              onClick={() => exportReport('pdf')}
              className="flex items-center px-6 py-2.5 bg-red-50 text-red-600 border border-red-100 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-red-100 transition-all"
            >
              <FileText className="h-4 w-4 mr-2" />
              PDF
            </button>
          </div>
        )}
      </div>

      {/* Hub Tabs */}
      <div className="flex bg-slate-100 p-1.5 rounded-[22px] w-full border border-slate-200/50">
        <div className="flex gap-1">
          {[
            { id: 'reports', label: 'Báo Cáo Doanh Thu', icon: BarChart3 },
            { id: 'credit', label: 'Quản Lý Công Nợ', icon: CreditCard },
            { id: 'contracts', label: 'Hợp Đồng Kinh Tế', icon: Briefcase },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id as any)
                const url = new URL(window.location.href)
                url.searchParams.set('tab', tab.id)
                window.history.pushState({}, '', url.toString())
              }}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-[18px] text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === tab.id ? 'bg-white text-slate-900 shadow-sm ring-1 ring-slate-200' : 'text-slate-400 hover:text-slate-600'
                }`}
            >
              <tab.icon size={14} />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {activeTab === 'reports' ? (
        <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
          {loading || !summary ? (
             <div className="space-y-6">
                <div className="bg-white p-4 rounded-[32px] shadow h-16 animate-pulse" />
                <StatsSkeleton />
                <TableSkeleton rows={5} />
             </div>
          ) : (
            <>
              {/* Date Range Filter */}
              <div className="p-5 bg-white rounded-[32px] border border-slate-100 shadow-sm flex flex-col md:flex-row gap-6 items-center">
                <div className="flex items-center gap-3 text-slate-400">
                  <Calendar className="h-5 w-5" />
                  <span className="text-xs font-black uppercase tracking-widest">Thời gian</span>
                </div>
                <div className="flex items-center gap-4 flex-1">
                  <div className="flex flex-col gap-1 flex-1">
                    <span className="text-[9px] font-black uppercase text-slate-400 ml-2">Từ ngày</span>
                    <input
                      type="date"
                      value={dateRange.startDate}
                      onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
                      className="bg-slate-50 border-none rounded-2xl px-4 py-2 text-sm font-bold text-slate-900 focus:ring-2 focus:ring-blue-500/10"
                    />
                  </div>
                  <div className="flex flex-col gap-1 flex-1">
                    <span className="text-[9px] font-black uppercase text-slate-400 ml-2">Đến ngày</span>
                    <input
                      type="date"
                      value={dateRange.endDate}
                      onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
                      className="bg-slate-50 border-none rounded-2xl px-4 py-2 text-sm font-bold text-slate-900 focus:ring-2 focus:ring-blue-500/10"
                    />
                  </div>
                </div>
              </div>

              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-emerald-500 p-6 rounded-[32px] shadow-lg shadow-emerald-200 text-white group hover:scale-[1.02] transition-transform">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-black uppercase tracking-widest opacity-80">Doanh Thu</span>
                    <TrendingUp className="h-5 w-5 opacity-80" />
                  </div>
                  <div className="text-2xl font-black tracking-tighter">{formatCurrency(summary.totalRevenue)}</div>
                </div>

                <div className="bg-rose-500 p-6 rounded-[32px] shadow-lg shadow-rose-200 text-white group hover:scale-[1.02] transition-transform">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-black uppercase tracking-widest opacity-80">Chi Phí</span>
                    <TrendingDown className="h-5 w-5 opacity-80" />
                  </div>
                  <div className="text-2xl font-black tracking-tighter">{formatCurrency(summary.totalExpenses)}</div>
                </div>

                <div className={`p-6 rounded-[32px] shadow-lg text-white group hover:scale-[1.02] transition-transform ${summary.netProfit >= 0 ? 'bg-blue-600 shadow-blue-200' : 'bg-amber-600 shadow-amber-200'}`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-black uppercase tracking-widest opacity-80">Lợi Nhuận</span>
                    <Coins className="h-5 w-5 opacity-80" />
                  </div>
                  <div className="text-2xl font-black tracking-tighter">{formatCurrency(summary.netProfit)}</div>
                </div>

                <div className="bg-slate-900 p-6 rounded-[32px] shadow-lg shadow-slate-200 text-white group hover:scale-[1.02] transition-transform">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-black uppercase tracking-widest opacity-80">Tỷ Suất</span>
                    <BarChart3 className="h-5 w-5 opacity-80" />
                  </div>
                  <div className="text-2xl font-black tracking-tighter">{summary.profitMargin.toFixed(1)}%</div>
                </div>
              </div>

              {/* Data Lists */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                 {/* Top Products */}
                 <div className="lg:col-span-1 bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm">
                    <h3 className="text-sm font-black uppercase tracking-widest text-slate-900 mb-6 flex items-center gap-2">
                      🏆 Top Sản Phẩm
                    </h3>
                    <div className="space-y-4">
                      {summary.topRevenueProducts.map((p: { name: string; quantity: number; revenue: number }, i: number) => (
                        <div key={i} className="flex justify-between items-center p-3 hover:bg-slate-50 rounded-2xl transition-colors shrink-0">
                           <div className="flex items-center gap-3">
                              <span className="text-xs font-black text-slate-300">#0{i+1}</span>
                              <div className="max-w-[120px]">
                                <p className="text-xs font-black text-slate-800 line-clamp-1 uppercase">{p.name}</p>
                                <p className="text-[10px] font-bold text-slate-400 uppercase">SL: {p.quantity}</p>
                              </div>
                           </div>
                           <div className="text-xs font-black text-emerald-600">{formatCurrency(p.revenue)}</div>
                        </div>
                      ))}
                    </div>
                 </div>

                 {/* Recent Invoices */}
                 <div className="lg:col-span-2 bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm overflow-hidden">
                    <h3 className="text-sm font-black uppercase tracking-widest text-slate-900 mb-6 flex items-center gap-2">
                      📄 Hóa Đơn Mới
                    </h3>
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-slate-100">
                        <thead className="bg-slate-50/50">
                          <tr>
                            <th className="px-4 py-3 text-left text-[9px] font-black text-slate-400 uppercase">Số HĐ</th>
                            <th className="px-4 py-3 text-left text-[9px] font-black text-slate-400 uppercase">Đối Tác</th>
                            <th className="px-4 py-3 text-right text-[9px] font-black text-slate-400 uppercase">Giá Trị</th>
                            <th className="px-4 py-3 text-center text-[9px] font-black text-slate-400 uppercase">Trạng Thái</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                          {recentInvoices.map((invoice: Invoice) => (
                            <tr key={invoice.id} className="hover:bg-slate-50/50">
                              <td className="px-4 py-3 text-xs font-black text-slate-900 uppercase">#{invoice.invoiceNumber}</td>
                              <td className="px-4 py-3 text-xs font-bold text-slate-500">{invoice.customer?.name || invoice.supplier?.name || '-'}</td>
                              <td className="px-4 py-3 text-right text-xs font-black text-slate-900">{formatCurrency(invoice.totalAmount)}</td>
                              <td className="px-4 py-3 text-center">
                                <span className={`px-2 py-0.5 text-[9px] font-black rounded-full uppercase ${
                                  invoice.status === 'PAID' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-400'
                                }`}>
                                  {invoice.status}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                 </div>
              </div>
            </>
          )}
        </div>
      ) : (
        <div className="bg-white p-20 rounded-[32px] border border-slate-100 italic text-slate-400 text-center animate-in fade-in duration-500">
           {activeTab === 'credit' ? 'Hệ thống quản lý công nợ đang được đồng bộ...' : 'Hệ thống quản lý hợp đồng kinh tế đang được đồng bộ...'}
        </div>
      )}
    </div>
  )
}

export default function FinancialReportsPage() {
  return (
    <Suspense fallback={
      <div className="space-y-8 animate-in fade-in duration-500">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div className="h-10 w-64 bg-slate-100 animate-pulse rounded-xl" />
        </div>
        <div className="h-14 w-full bg-slate-100 animate-pulse rounded-[22px]" />
        <div className="space-y-6">
          <StatsSkeleton />
          <TableSkeleton rows={5} />
        </div>
      </div>
    }>
      <FinancialReportsContent />
    </Suspense>
  )
}
