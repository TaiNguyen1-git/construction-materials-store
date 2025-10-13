'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

interface DashboardStats {
  totalProducts: number
  totalOrders: number
  totalCustomers: number
  totalRevenue: number
  lowStockItems: number
  pendingOrders: number
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalProducts: 450,
    totalOrders: 1254,
    totalCustomers: 387,
    totalRevenue: 125400,
    lowStockItems: 12,
    pendingOrders: 23
  })
  const [loading, setLoading] = useState(false)
  useEffect(() => {
    // In a real app, you would fetch this data from your API
    // fetchDashboardStats()
  }, [])

  const quickActions = [
    { name: 'Thêm Sản Phẩm', href: '/admin/products', icon: '📦', color: 'bg-blue-500' },
    { name: 'Xem Đơn Hàng', href: '/admin/orders', icon: '🛒', color: 'bg-green-500' },
    { name: 'Quản Lý Kho', href: '/admin/inventory', icon: '📋', color: 'bg-orange-500' },
    { name: 'Tạo Hóa Đơn', href: '/admin/invoices', icon: '🧾', color: 'bg-purple-500' },
  ]

  const statCards = [
    {
      title: 'Tổng Sản Phẩm',
      value: stats.totalProducts,
      icon: '📦',
      color: 'bg-blue-100 text-blue-800',
      bgColor: 'bg-blue-500'
    },
    {
      title: 'Sản Phẩm Sắp Hết',
      value: stats.lowStockItems,
      icon: '⚠️',
      color: 'bg-yellow-100 text-yellow-800',
      bgColor: 'bg-yellow-500'
    },
    {
      title: 'Tổng Đơn Hàng',
      value: stats.totalOrders,
      icon: '🛒',
      color: 'bg-green-100 text-green-800',
      bgColor: 'bg-green-500'
    },
    {
      title: 'Tổng Khách Hàng',
      value: stats.totalCustomers,
      icon: '👥',
      color: 'bg-purple-100 text-purple-800',
      bgColor: 'bg-purple-500'
    },
    {
      title: 'Tổng Doanh Thu',
      value: `${stats.totalRevenue.toLocaleString()}đ`,
      icon: '💰',
      color: 'bg-green-100 text-green-800',
      bgColor: 'bg-green-600'
    },
    {
      title: 'Đơn Hàng Chờ',
      value: stats.pendingOrders,
      icon: '🕐',
      color: 'bg-orange-100 text-orange-800',
      bgColor: 'bg-orange-500'
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
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Bảng Điều Khiển</h1>
        <p className="text-gray-600">Chào mừng đến với bảng quản trị Cửa Hàng Vật Liệu Xây Dựng</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {statCards.map((stat, index) => (
          <div key={index} className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className={`flex-shrink-0 w-12 h-12 ${stat.bgColor} rounded-lg flex items-center justify-center`}>
                <span className="text-white text-xl">{stat.icon}</span>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">{stat.title}</dt>
                  <dd className="text-2xl font-bold text-gray-900">{stat.value}</dd>
                </dl>
              </div>
            </div>
          </div>
        ))}
      </div>

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
                    <span className="text-white text-xl">{action.icon}</span>
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

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Low Stock Alert */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">Cảnh Báo Hết Hàng</h2>
          </div>
          <div className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                  <span className="text-red-600">⚠️</span>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-900">
                    {stats.lowStockItems} sản phẩm sắp hết hàng
                  </p>
                  <p className="text-sm text-gray-500">
                    Kiểm tra kho để nhập thêm hàng
                  </p>
                </div>
              </div>
              <Link
                href="/admin/inventory"
                className="text-primary-600 hover:text-primary-800 text-sm font-medium"
              >
                Xem Tất Cả
              </Link>
            </div>
          </div>
        </div>

        {/* Pending Orders */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">Đơn Hàng Chờ Xử Lý</h2>
          </div>
          <div className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                  <span className="text-orange-600">🕐</span>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-900">
                    {stats.pendingOrders} đơn hàng cần xử lý
                  </p>
                  <p className="text-sm text-gray-500">
                    Xử lý các đơn hàng đang chờ
                  </p>
                </div>
              </div>
              <Link
                href="/admin/orders"
                className="text-primary-600 hover:text-primary-800 text-sm font-medium"
              >
                Xem Tất Cả
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* System Info */}
      <div className="bg-primary-50 border border-primary-200 rounded-lg p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <span className="text-primary-400 text-lg">ℹ️</span>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-primary-800">
              Hệ Thống Quản Lý Cửa Hàng Vật Liệu Xây Dựng
            </h3>
            <div className="mt-2 text-sm text-primary-700">
              <p>
                Hệ thống đang hoạt động ổn định. Tất cả các tính năng cốt lõi đều hoạt động bình thường bao gồm quản lý kho, 
                xử lý đơn hàng, quản lý lương và dịch vụ khách hàng.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}