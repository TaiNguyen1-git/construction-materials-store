'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { fetchWithAuth } from '@/lib/api-client'
import { LineChart, Line, BarChart, Bar, PieChart, Pie, AreaChart, Area, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { Package, ShoppingCart, ClipboardList, FileText, AlertTriangle, Users, DollarSign, Clock, Star, RefreshCw, Brain, TrendingUp } from 'lucide-react'

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
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316']

export default function AdminDashboard() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [isSendingReport, setIsSendingReport] = useState(false)
  const [predictions, setPredictions] = useState<any>(null)
  const [showReorderModal, setShowReorderModal] = useState(false)

  useEffect(() => {
    fetchDashboardData(true)
    fetchPredictions()

    // Auto-refresh every 30 seconds (without showing loading spinner)
    const interval = setInterval(() => {
      fetchDashboardData(false)
    }, 30000)

    return () => clearInterval(interval)
  }, [])

  const fetchPredictions = async () => {
    try {
      const response = await fetchWithAuth('/api/dashboard/predictions')
      if (response.ok) {
        const result = await response.json()
        setPredictions(result.data)
      }
    } catch (error) {
      console.error('Failed to fetch predictions:', error)
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
    { name: 'Thêm Sản Phẩm', href: '/admin/products', icon: Package, color: 'bg-blue-500' },
    { name: 'Xem Đơn Hàng', href: '/admin/orders', icon: ShoppingCart, color: 'bg-green-500' },
    { name: 'Quản Lý Kho', href: '/admin/inventory', icon: ClipboardList, color: 'bg-orange-500' },
    { name: 'Tạo Hóa Đơn', href: '/admin/invoices', icon: FileText, color: 'bg-purple-500' },
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
      title: 'Tổng Sản Phẩm',
      value: formatNumber(stats.totalProducts),
      icon: Package,
      color: 'bg-blue-100 text-blue-800',
      bgColor: 'bg-blue-500',
      trend: '+12%'
    },
    {
      title: 'Sản Phẩm Sắp Hết',
      value: formatNumber(stats.lowStockItems),
      icon: AlertTriangle,
      color: 'bg-yellow-100 text-yellow-800',
      bgColor: 'bg-yellow-500',
      trend: stats.lowStockItems > 10 ? 'Cảnh báo' : 'OK'
    },
    {
      title: 'Tổng Đơn Hàng',
      value: formatNumber(stats.totalOrders),
      icon: ShoppingCart,
      color: 'bg-green-100 text-green-800',
      bgColor: 'bg-green-500',
      trend: '+8%'
    },
    {
      title: 'Tổng Khách Hàng',
      value: formatNumber(stats.totalCustomers),
      icon: Users,
      color: 'bg-purple-100 text-purple-800',
      bgColor: 'bg-purple-500',
      trend: '+15%'
    },
    {
      title: 'Tổng Doanh Thu',
      value: formatCurrency(stats.totalRevenue),
      icon: DollarSign,
      color: 'bg-green-100 text-green-800',
      bgColor: 'bg-green-600',
      trend: '+23%'
    },
    {
      title: 'Đơn Hàng Chờ',
      value: formatNumber(stats.pendingOrders),
      icon: Clock,
      color: 'bg-orange-100 text-orange-800',
      bgColor: 'bg-orange-500',
      trend: stats.pendingOrders > 20 ? 'Cao' : 'Bình thường'
    }
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Bảng Điều Khiển</h1>
          <p className="text-gray-600">Chào mừng đến với bảng quản trị Cửa Hàng Vật Liệu Xây Dựng</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleSendReport}
            disabled={isSendingReport}
            className={`px-4 py-2 border border-blue-600 ${isSendingReport ? 'bg-blue-50 text-blue-300' : 'text-blue-600 hover:bg-blue-50'} rounded-lg transition-colors flex items-center gap-2`}
          >
            {isSendingReport ? <RefreshCw className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
            <span>Gửi báo cáo Email</span>
          </button>
          <button
            onClick={() => fetchDashboardData(false)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Làm mới</span>
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {statCards.map((stat, index) => (
          <div key={index} className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between">
              <div className="flex items-center flex-1">
                <div className={`flex-shrink-0 w-12 h-12 ${stat.bgColor} rounded-lg flex items-center justify-center`}>
                  <stat.icon className="w-6 h-6 text-white" />
                </div>
                <div className="ml-4 flex-1">
                  <dt className="text-sm font-medium text-gray-500">{stat.title}</dt>
                  <dd className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</dd>
                </div>
              </div>
              <div className="text-right">
                <span className="text-xs font-semibold text-green-600 bg-green-50 px-2 py-1 rounded">
                  {stat.trend}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Trend Chart */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Xu Hướng Doanh Thu (30 ngày)</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data?.revenueTrend || []}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip
                formatter={(value: number) => formatCurrency(value)}
                contentStyle={{ backgroundColor: '#fff', border: '1px solid #ccc' }}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="revenue"
                stroke="#3b82f6"
                strokeWidth={2}
                name="Doanh thu"
                dot={{ fill: '#3b82f6' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Sales by Category Chart */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Doanh Thu Theo Danh Mục (30 ngày)</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={data?.salesByCategory || []}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={(props: any) => {
                  const { category, percent } = props
                  return `${category} (${((percent || 0) * 100).toFixed(1)}%)`
                }}
                outerRadius={80}
                fill="#8884d8"
                dataKey="total"
              >
                {data?.salesByCategory.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value: number) => formatCurrency(value)} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Top Products Chart */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Top 10 Sản Phẩm Bán Chạy (30 ngày)</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data?.topProducts || []} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" tick={{ fontSize: 12 }} />
              <YAxis dataKey="name" type="category" width={150} tick={{ fontSize: 11 }} />
              <Tooltip formatter={(value: number) => formatCurrency(value)} />
              <Legend />
              <Bar dataKey="revenue" fill="#10b981" name="Doanh thu" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Inventory Status Chart */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Tình Trạng Tồn Kho (Hiện tại)</h3>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={data?.inventoryStatus.slice(0, 10) || []}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="product" tick={{ fontSize: 10 }} angle={-45} textAnchor="end" height={100} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Legend />
              <Area type="monotone" dataKey="available" stackId="1" stroke="#3b82f6" fill="#3b82f6" name="Tồn kho" />
              <Area type="monotone" dataKey="min" stackId="2" stroke="#ef4444" fill="#ef4444" name="Mức tối thiểu" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* AI Predictions Widget */}
      {predictions && (
        <div className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-lg shadow-lg p-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                <Brain className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">AI Predictions Dashboard</h3>
                <p className="text-purple-200 text-sm">Dự đoán thông minh bằng Prophet ML</p>
              </div>
            </div>
            <Link href="/admin/ml-training" className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg text-sm transition-colors">
              Quản lý Model
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white/10 rounded-lg p-4">
              <p className="text-purple-200 text-sm">Sản phẩm dự đoán</p>
              <p className="text-2xl font-bold">{predictions.summary?.totalProducts || 0}</p>
            </div>
            <div className="bg-white/10 rounded-lg p-4">
              <p className="text-purple-200 text-sm">Độ tin cậy TB</p>
              <p className="text-2xl font-bold">{predictions.summary?.avgConfidence || 0}%</p>
            </div>
            <div className="bg-white/10 rounded-lg p-4">
              <p className="text-purple-200 text-sm">Độ chính xác TB</p>
              <p className="text-2xl font-bold">{predictions.summary?.avgAccuracy || 'N/A'}%</p>
            </div>
            <div className="bg-white/10 rounded-lg p-4">
              <p className="text-purple-200 text-sm">Cần nhập hàng</p>
              <p className="text-2xl font-bold">{predictions.summary?.productsNeedingReorder || 0}</p>
            </div>
          </div>

          {predictions.needReorder?.length > 0 && (
            <div className="bg-white/10 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold flex items-center gap-2">
                  <TrendingUp className="w-4 h-4" />
                  Gợi ý Nhập Hàng Thông Minh
                </h4>
                <button
                  onClick={() => setShowReorderModal(true)}
                  className="text-sm underline hover:no-underline"
                >
                  Xem tất cả
                </button>
              </div>
              <div className="space-y-2">
                {predictions.needReorder.slice(0, 3).map((item: any, idx: number) => (
                  <div key={idx} className="flex items-center justify-between py-2 border-b border-white/10 last:border-0">
                    <div>
                      <p className="font-medium">{item.productName}</p>
                      <p className="text-sm text-purple-200">Tồn: {item.currentStock} | Dự đoán: {item.predictedDemand} {item.unit}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-yellow-300">+{item.recommendedOrder} {item.unit}</p>
                      <p className="text-xs text-purple-200">{item.confidence}% tin cậy</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Reorder Modal */}
      {showReorderModal && predictions?.needReorder && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[80vh] overflow-hidden">
            <div className="p-4 border-b flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Gợi ý Nhập Hàng Thông Minh</h3>
              <button onClick={() => setShowReorderModal(false)} className="text-gray-500 hover:text-gray-700">✕</button>
            </div>
            <div className="p-4 overflow-y-auto max-h-96">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2">Sản phẩm</th>
                    <th className="text-right py-2">Tồn kho</th>
                    <th className="text-right py-2">Dự đoán</th>
                    <th className="text-right py-2">Đề xuất</th>
                  </tr>
                </thead>
                <tbody>
                  {predictions.needReorder.map((item: any, idx: number) => (
                    <tr key={idx} className="border-b">
                      <td className="py-2">{item.productName}</td>
                      <td className="text-right py-2">{item.currentStock} {item.unit}</td>
                      <td className="text-right py-2">{item.predictedDemand} {item.unit}</td>
                      <td className="text-right py-2 font-bold text-green-600">+{item.recommendedOrder}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="p-4 border-t bg-gray-50 flex justify-end gap-2">
              <button onClick={() => setShowReorderModal(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">Đóng</button>
              <Link href="/admin/inventory" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Quản lý Kho</Link>
            </div>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">Thao Tác Nhanh</h2>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {quickActions.map((action, index) => (
              <Link
                key={index}
                href={action.href}
                className="group relative bg-white p-6 rounded-lg border-2 border-gray-200 hover:border-primary-500 transition-colors"
              >
                <div className="flex flex-col items-center text-center">
                  <div className={`w-12 h-12 ${action.color} rounded-lg flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}>
                    <action.icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-sm font-medium text-gray-900 group-hover:text-primary-600">
                    {action.name}
                  </h3>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Activity & Additional Info */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Orders */}
        <div className="lg:col-span-2 bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">Đơn Hàng Gần Đây</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Mã ĐH</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Khách hàng</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Số tiền</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Trạng thái</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {data?.recentOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {order.orderNumber}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {order.customer}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatCurrency(order.amount)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${order.status === 'DELIVERED' ? 'bg-green-100 text-green-800' :
                        order.status === 'SHIPPED' ? 'bg-blue-100 text-blue-800' :
                          order.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-gray-100 text-gray-800'
                        }`}>
                        {order.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="space-y-4">
          {/* Low Stock Alert */}
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-gray-900">Cảnh Báo Hết Hàng</h3>
              <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-red-600" />
              </div>
            </div>
            <p className="text-2xl font-bold text-gray-900">{stats.lowStockItems}</p>
            <p className="text-sm text-gray-500 mt-1">sản phẩm sắp hết</p>
            <Link href="/admin/inventory" className="text-xs text-blue-600 hover:underline mt-2 inline-block">
              Xem chi tiết →
            </Link>
          </div>

          {/* Pending Orders */}
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-gray-900">Đơn Chờ Xử Lý</h3>
              <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                <Clock className="w-5 h-5 text-orange-600" />
              </div>
            </div>
            <p className="text-2xl font-bold text-gray-900">{stats.pendingOrders}</p>
            <p className="text-sm text-gray-500 mt-1">đơn hàng cần xử lý</p>
            <Link href="/admin/orders" className="text-xs text-blue-600 hover:underline mt-2 inline-block">
              Xem chi tiết →
            </Link>
          </div>

          {/* Employee Performance */}
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-gray-900">Nhân Viên Xuất Sắc</h3>
              <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                <Star className="w-5 h-5 text-green-600" />
              </div>
            </div>
            {data?.employeePerformance.slice(0, 3).map((emp, idx) => (
              <div key={idx} className="flex items-center justify-between py-2 border-b last:border-0">
                <span className="text-sm text-gray-900">{emp.name}</span>
                <span className="text-xs font-semibold text-green-600">{emp.rate}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

    </div>
  )
}