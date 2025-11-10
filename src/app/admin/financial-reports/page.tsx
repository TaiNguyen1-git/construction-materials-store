'use client'

import { useState, useEffect } from 'react'
import { fetchWithAuth } from '@/lib/api-client'
import { DollarSign, TrendingUp, TrendingDown, FileText, Download, Calendar } from 'lucide-react'
import { toast } from 'react-hot-toast'

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

export default function FinancialReportsPage() {
  const [summary, setSummary] = useState<FinancialSummary | null>(null)
  const [recentInvoices, setRecentInvoices] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(true)
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  })

  useEffect(() => {
    fetchFinancialData()
  }, [dateRange])

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

  if (loading || !summary) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Báo Cáo Tài Chính</h1>
        <div className="flex space-x-2">
          <button
            onClick={() => exportReport('excel')}
            className="flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm"
          >
            <Download className="h-4 w-4 mr-2" />
            Xuất Excel
          </button>
          <button
            onClick={() => exportReport('pdf')}
            className="flex items-center px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 text-sm"
          >
            <FileText className="h-4 w-4 mr-2" />
            Xuất PDF
          </button>
        </div>
      </div>

      {/* Date Range Filter */}
      <div className="bg-white p-4 rounded-lg shadow">
        <div className="flex items-center space-x-4">
          <Calendar className="h-5 w-5 text-gray-400" />
          <div className="flex items-center space-x-2">
            <label className="text-sm font-medium text-gray-700">Từ ngày:</label>
            <input
              type="date"
              value={dateRange.startDate}
              onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
              className="border border-gray-300 rounded-md px-3 py-2 text-gray-900 bg-white"
            />
          </div>
          <div className="flex items-center space-x-2">
            <label className="text-sm font-medium text-gray-700">Đến ngày:</label>
            <input
              type="date"
              value={dateRange.endDate}
              onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
              className="border border-gray-300 rounded-md px-3 py-2 text-gray-900 bg-white"
            />
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-gradient-to-br from-green-500 to-green-600 p-6 rounded-lg shadow text-white">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm opacity-90">Tổng Doanh Thu</div>
            <TrendingUp className="h-5 w-5 opacity-90" />
          </div>
          <div className="text-2xl font-bold">{formatCurrency(summary.totalRevenue)}</div>
        </div>

        <div className="bg-gradient-to-br from-red-500 to-red-600 p-6 rounded-lg shadow text-white">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm opacity-90">Tổng Chi Phí</div>
            <TrendingDown className="h-5 w-5 opacity-90" />
          </div>
          <div className="text-2xl font-bold">{formatCurrency(summary.totalExpenses)}</div>
        </div>

        <div className={`bg-gradient-to-br ${summary.netProfit >= 0 ? 'from-blue-500 to-blue-600' : 'from-orange-500 to-orange-600'} p-6 rounded-lg shadow text-white`}>
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm opacity-90">Lợi Nhuận Ròng</div>
            <DollarSign className="h-5 w-5 opacity-90" />
          </div>
          <div className="text-2xl font-bold">{formatCurrency(summary.netProfit)}</div>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-purple-600 p-6 rounded-lg shadow text-white">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm opacity-90">Tỷ Suất Lợi Nhuận</div>
            <FileText className="h-5 w-5 opacity-90" />
          </div>
          <div className="text-2xl font-bold">{summary.profitMargin.toFixed(1)}%</div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue by Month */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4 text-gray-900">Doanh Thu Theo Tháng</h3>
          <div className="space-y-3">
            {summary.revenueByMonth.map((item, index) => (
              <div key={index} className="flex items-center">
                <div className="w-24 text-sm text-gray-600">{item.month}</div>
                <div className="flex-1 mx-4">
                  <div className="bg-gray-200 rounded-full h-6 overflow-hidden">
                    <div
                      className="bg-blue-500 h-full flex items-center justify-end pr-2 text-xs text-white font-medium"
                      style={{
                        width: `${Math.min((item.revenue / Math.max(...summary.revenueByMonth.map(m => m.revenue))) * 100, 100)}%`
                      }}
                    >
                      {item.revenue > 0 && formatCurrency(item.revenue)}
                    </div>
                  </div>
                </div>
              </div>
            ))}
            {summary.revenueByMonth.length === 0 && (
              <div className="text-center text-gray-500 py-8">Chưa có dữ liệu</div>
            )}
          </div>
        </div>

        {/* Expenses by Category */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4 text-gray-900">Chi Phí Theo Danh Mục</h3>
          <div className="space-y-3">
            {summary.expensesByCategory.map((item, index) => (
              <div key={index} className="flex items-center">
                <div className="w-32 text-sm text-gray-600">{item.category}</div>
                <div className="flex-1 mx-4">
                  <div className="bg-gray-200 rounded-full h-6 overflow-hidden">
                    <div
                      className="bg-red-500 h-full flex items-center justify-end pr-2 text-xs text-white font-medium"
                      style={{
                        width: `${Math.min((item.amount / Math.max(...summary.expensesByCategory.map(e => e.amount))) * 100, 100)}%`
                      }}
                    >
                      {item.amount > 0 && formatCurrency(item.amount)}
                    </div>
                  </div>
                </div>
              </div>
            ))}
            {summary.expensesByCategory.length === 0 && (
              <div className="text-center text-gray-500 py-8">Chưa có dữ liệu</div>
            )}
          </div>
        </div>
      </div>

      {/* Top Revenue Products */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-4 text-gray-900">Top Sản Phẩm Doanh Thu</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">#</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Sản Phẩm</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Số Lượng Bán</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Doanh Thu</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {summary.topRevenueProducts.map((product, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{index + 1}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{product.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{product.quantity}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600">
                    {formatCurrency(product.revenue)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {summary.topRevenueProducts.length === 0 && (
            <div className="text-center text-gray-500 py-8">Chưa có dữ liệu</div>
          )}
        </div>
      </div>

      {/* Recent Invoices */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-4 text-gray-900">Hóa Đơn Gần Đây</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Mã HĐ</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Loại</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Đối Tác</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Số Tiền</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Trạng Thái</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ngày</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {recentInvoices.map((invoice) => (
                <tr key={invoice.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {invoice.invoiceNumber}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                      invoice.type === 'SALES' ? 'bg-green-100 text-green-800' : 'bg-purple-100 text-purple-800'
                    }`}>
                      {invoice.type === 'SALES' ? 'Bán' : 'Mua'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {invoice.customer?.name || invoice.supplier?.name || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {formatCurrency(invoice.totalAmount)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                      invoice.status === 'PAID' ? 'bg-green-100 text-green-800' :
                      invoice.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {invoice.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(invoice.createdAt).toLocaleDateString('vi-VN')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {recentInvoices.length === 0 && (
            <div className="text-center text-gray-500 py-8">Chưa có hóa đơn</div>
          )}
        </div>
      </div>
    </div>
  )
}
