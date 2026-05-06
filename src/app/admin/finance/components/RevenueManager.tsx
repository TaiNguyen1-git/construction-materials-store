'use client'

import { useState, useEffect } from 'react'
import {
  Coins, TrendingUp, TrendingDown, FileText, Download, Calendar, BarChart3, RefreshCw
} from 'lucide-react'
import { toast } from 'react-hot-toast'
import { fetchWithAuth } from '@/lib/api-client'

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

export default function RevenueManager() {
  const [summary, setSummary] = useState<FinancialSummary | null>(null)
  const [recentInvoices, setRecentInvoices] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(true)
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  })

  useEffect(() => { fetchFinancialData() }, [dateRange])

  const fetchFinancialData = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({ startDate: dateRange.startDate, endDate: dateRange.endDate })
      const [summaryRes, invoicesRes] = await Promise.all([
        fetchWithAuth(`/api/reports/financial?${params}`),
        fetchWithAuth(`/api/invoices?${params}&limit=10`)
      ])

      if (summaryRes.ok) {
        const data = await summaryRes.json()
        setSummary(data.data || { totalRevenue: 0, totalExpenses: 0, netProfit: 0, profitMargin: 0, revenueByMonth: [], expensesByCategory: [], topRevenueProducts: [] })
      }
      if (invoicesRes.ok) {
        const data = await invoicesRes.json()
        setRecentInvoices(data.data || [])
      }
    } catch (error) { toast.error('Không thể tải dữ liệu') }
    finally { setLoading(false) }
  }

  const exportReport = async (format: 'excel' | 'pdf') => {
    try {
      const params = new URLSearchParams({ startDate: dateRange.startDate, endDate: dateRange.endDate, format })
      const response = await fetchWithAuth(`/api/reports/financial/export?${params}`)
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a'); a.href = url; a.download = `finance-report.${format === 'excel' ? 'xlsx' : 'pdf'}`
        document.body.appendChild(a); a.click(); window.URL.revokeObjectURL(url); document.body.removeChild(a)
        toast.success(`Đã xuất báo cáo ${format.toUpperCase()}`)
      }
    } catch (error) { toast.error('Lỗi xuất báo cáo') }
  }

  const formatCurrency = (amount: number) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount)

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-3 p-4 bg-white rounded-3xl border border-slate-100 shadow-sm flex-1 w-full">
          <Calendar className="h-5 w-5 text-slate-400" />
          <div className="flex gap-2 flex-1">
            <input type="date" value={dateRange.startDate} onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })} className="bg-slate-50 border-none rounded-xl px-4 py-2 text-[10px] font-black uppercase flex-1 outline-none" />
            <input type="date" value={dateRange.endDate} onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })} className="bg-slate-50 border-none rounded-xl px-4 py-2 text-[10px] font-black uppercase flex-1 outline-none" />
          </div>
          <button onClick={fetchFinancialData} className="p-2 text-slate-400 hover:text-blue-600 transition-all"><RefreshCw size={16} className={loading ? 'animate-spin' : ''} /></button>
        </div>
        <div className="flex gap-2 shrink-0">
          <button onClick={() => exportReport('excel')} className="px-5 py-2.5 bg-emerald-50 text-emerald-600 rounded-xl font-black text-[10px] uppercase tracking-widest border border-emerald-100 hover:bg-emerald-600 hover:text-white transition-all">Excel</button>
          <button onClick={() => exportReport('pdf')} className="px-5 py-2.5 bg-rose-50 text-rose-600 rounded-xl font-black text-[10px] uppercase tracking-widest border border-rose-100 hover:bg-rose-600 hover:text-white transition-all">PDF</button>
        </div>
      </div>

      {loading || !summary ? (
        <div className="py-24 text-center text-[10px] font-black text-slate-300 uppercase tracking-widest animate-pulse">Đang tổng hợp báo cáo tài chính...</div>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: 'Doanh Thu', value: summary.totalRevenue, color: 'bg-emerald-500 shadow-emerald-200', icon: TrendingUp },
              { label: 'Chi Phí', value: summary.totalExpenses, color: 'bg-rose-500 shadow-rose-200', icon: TrendingDown },
              { label: 'Lợi Nhuận', value: summary.netProfit, color: 'bg-blue-600 shadow-blue-200', icon: Coins },
              { label: 'Tỷ Suất', value: `${summary.profitMargin.toFixed(1)}%`, color: 'bg-gradient-to-br from-indigo-500 to-purple-600 shadow-indigo-200', icon: BarChart3, raw: true }
            ].map((stat, i) => (
              <div key={i} className={`${stat.color} p-6 rounded-[32px] shadow-lg text-white group hover:scale-[1.02] transition-transform`}>
                <div className="flex items-center justify-between mb-2"><span className="text-[9px] font-black uppercase tracking-widest opacity-80">{stat.label}</span><stat.icon size={16} className="opacity-80" /></div>
                <div className="text-xl font-black tracking-tighter">{stat.raw ? stat.value : formatCurrency(stat.value as number)}</div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm h-full">
              <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-6 flex items-center gap-2"><TrendingUp size={14} className="text-blue-500" /> Top Sản Phẩm Doanh Thu</h3>
              <div className="space-y-4">
                {summary.topRevenueProducts.map((p, i) => (
                  <div key={i} className="flex justify-between items-center p-3 hover:bg-slate-50 rounded-2xl transition-colors shrink-0 border border-transparent hover:border-slate-100">
                    <div className="flex items-center gap-3">
                      <span className="text-[10px] font-black text-slate-200">#0{i + 1}</span>
                      <div className="max-w-[140px]"><p className="text-[10px] font-black text-slate-900 line-clamp-1 uppercase tracking-tight">{p.name}</p><p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Q: {p.quantity}</p></div>
                    </div>
                    <div className="text-[10px] font-black text-blue-600">{formatCurrency(p.revenue)}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="lg:col-span-2 bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm overflow-hidden">
              <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-6 flex items-center gap-2"><FileText size={14} className="text-blue-500" /> Hóa Đơn Phát Sinh Gần Đây</h3>
              <div className="overflow-x-auto"><table className="min-w-full divide-y divide-slate-100">
                <thead className="bg-slate-50/50 text-[9px] font-black text-slate-400 uppercase tracking-widest"><tr><th className="px-4 py-3 text-left">Số HĐ</th><th className="px-4 py-3 text-left">Đối Tác</th><th className="px-4 py-3 text-right">Giá Trị</th><th className="px-4 py-3 text-center">Trạng Thái</th></tr></thead>
                <tbody className="divide-y divide-slate-50">{recentInvoices.map(inv => (
                  <tr key={inv.id} className="hover:bg-slate-50/50 group"><td className="px-4 py-3 text-[10px] font-black text-slate-900 uppercase tracking-tight">#{inv.invoiceNumber}</td><td className="px-4 py-3 text-[10px] font-bold text-slate-500">{inv.customer?.name || inv.supplier?.name || '-'}</td><td className="px-4 py-3 text-right text-[10px] font-black text-slate-900">{formatCurrency(inv.totalAmount)}</td><td className="px-4 py-3 text-center"><span className={`px-2 py-0.5 text-[8px] font-black rounded-md uppercase ${inv.status === 'PAID' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-400'}`}>{inv.status}</span></td></tr>
                ))}</tbody>
              </table></div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
