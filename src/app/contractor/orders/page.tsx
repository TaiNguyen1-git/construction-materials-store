'use client'

/**
 * Contractor Orders Page - Light Theme
 * Order history and management for contractors
 */

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Sidebar from '../components/Sidebar'
import {
    Building2,
    Package,
    FileText,
    CreditCard,
    ShoppingCart,
    ArrowRight,
    LogOut,
    User,
    Bell,
    Search,
    Plus,
    Menu,
    X,
    Home,
    Filter,
    Download,
    Eye,
    ChevronLeft,
    ChevronRight,
    Calendar
} from 'lucide-react'

interface Order {
    id: string
    orderNumber: string
    date: string
    total: number
    status: string
    items: number
    project: string
}

export default function ContractorOrdersPage() {
    const [sidebarOpen, setSidebarOpen] = useState(false)
    const [orders, setOrders] = useState<Order[]>([])
    const [statusFilter, setStatusFilter] = useState('all')

    useEffect(() => {
        // Mock data
        setOrders([
            { id: '1', orderNumber: 'ORD-2024-001', date: '2025-12-15', total: 15000000, status: 'DELIVERED', items: 5, project: 'Dự án Biên Hòa' },
            { id: '2', orderNumber: 'ORD-2024-002', date: '2025-12-14', total: 8500000, status: 'PROCESSING', items: 3, project: 'Dự án Biên Hòa' },
            { id: '3', orderNumber: 'ORD-2024-003', date: '2025-12-13', total: 22000000, status: 'SHIPPED', items: 8, project: 'Dự án Long Thành' },
            { id: '4', orderNumber: 'ORD-2024-004', date: '2025-12-12', total: 45000000, status: 'DELIVERED', items: 15, project: 'Dự án Long Thành' },
            { id: '5', orderNumber: 'ORD-2024-005', date: '2025-12-10', total: 12500000, status: 'DELIVERED', items: 6, project: 'Dự án Biên Hòa' },
        ])
    }, [])

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND'
        }).format(amount)
    }

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'DELIVERED': return 'bg-green-100 text-green-700'
            case 'PROCESSING': return 'bg-orange-100 text-orange-700'
            case 'SHIPPED': return 'bg-blue-100 text-blue-700'
            case 'PENDING': return 'bg-gray-100 text-gray-700'
            case 'CANCELLED': return 'bg-red-100 text-red-700'
            default: return 'bg-gray-100 text-gray-700'
        }
    }

    const getStatusText = (status: string) => {
        switch (status) {
            case 'DELIVERED': return 'Đã giao'
            case 'PROCESSING': return 'Đang xử lý'
            case 'SHIPPED': return 'Đang giao'
            case 'PENDING': return 'Chờ xác nhận'
            case 'CANCELLED': return 'Đã hủy'
            default: return status
        }
    }

    const filteredOrders = statusFilter === 'all'
        ? orders
        : orders.filter(o => o.status === statusFilter)

    const handleLogout = () => {
        localStorage.removeItem('access_token')
        localStorage.removeItem('user')
        window.location.href = '/contractor'
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Top Navigation */}
            <nav className="fixed top-0 left-0 right-0 z-30 bg-white border-b border-gray-200 shadow-sm">
                <div className="px-4 lg:px-6 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => setSidebarOpen(true)}
                                className="lg:hidden p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                            >
                                <Menu className="w-6 h-6" />
                            </button>
                            <Link href="/contractor/dashboard" className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                                    <Building2 className="w-6 h-6 text-white" />
                                </div>
                                <div className="hidden sm:block">
                                    <span className="text-xl font-bold text-gray-900">SmartBuild</span>
                                    <span className="text-blue-600 font-semibold ml-1">PRO</span>
                                </div>
                            </Link>
                        </div>

                        <div className="flex items-center gap-3">
                            <button className="relative p-2 text-gray-500 hover:bg-gray-100 rounded-lg">
                                <Bell className="w-6 h-6" />
                            </button>
                            <button
                                onClick={handleLogout}
                                className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg"
                            >
                                <LogOut className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                </div>
            </nav>

            <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

            <main className="lg:ml-64 pt-[73px]">
                <div className="p-6 lg:p-8 max-w-7xl mx-auto">
                    {/* Header */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">Đơn hàng của tôi</h1>
                            <p className="text-gray-600">Quản lý và theo dõi tất cả đơn hàng</p>
                        </div>
                        <div className="flex gap-3">
                            <Link
                                href="/products"
                                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-semibold flex items-center gap-2"
                            >
                                <Plus className="w-5 h-5" />
                                Đặt hàng mới
                            </Link>
                        </div>
                    </div>

                    {/* Filters */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-6">
                        <div className="flex flex-wrap gap-4 items-center">
                            <div className="flex items-center gap-2">
                                <Filter className="w-5 h-5 text-gray-400" />
                                <span className="text-gray-600 font-medium">Lọc theo:</span>
                            </div>
                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                                className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-2 text-gray-900"
                            >
                                <option value="all">Tất cả trạng thái</option>
                                <option value="PENDING">Chờ xác nhận</option>
                                <option value="PROCESSING">Đang xử lý</option>
                                <option value="SHIPPED">Đang giao</option>
                                <option value="DELIVERED">Đã giao</option>
                                <option value="CANCELLED">Đã hủy</option>
                            </select>
                            <div className="flex-1" />
                            <button className="flex items-center gap-2 text-gray-600 hover:text-blue-600 font-medium">
                                <Download className="w-5 h-5" />
                                Xuất Excel
                            </button>
                        </div>
                    </div>

                    {/* Orders Table */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50 border-b border-gray-100">
                                    <tr>
                                        <th className="text-left px-6 py-4 text-sm font-semibold text-gray-700">Mã đơn</th>
                                        <th className="text-left px-6 py-4 text-sm font-semibold text-gray-700">Ngày đặt</th>
                                        <th className="text-left px-6 py-4 text-sm font-semibold text-gray-700">Dự án</th>
                                        <th className="text-center px-6 py-4 text-sm font-semibold text-gray-700">SP</th>
                                        <th className="text-right px-6 py-4 text-sm font-semibold text-gray-700">Tổng tiền</th>
                                        <th className="text-center px-6 py-4 text-sm font-semibold text-gray-700">Trạng thái</th>
                                        <th className="text-center px-6 py-4 text-sm font-semibold text-gray-700"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {filteredOrders.map((order) => (
                                        <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-6 py-4">
                                                <span className="font-semibold text-blue-600">{order.orderNumber}</span>
                                            </td>
                                            <td className="px-6 py-4 text-gray-600">{order.date}</td>
                                            <td className="px-6 py-4 text-gray-900">{order.project}</td>
                                            <td className="px-6 py-4 text-center text-gray-600">{order.items}</td>
                                            <td className="px-6 py-4 text-right font-semibold text-gray-900">
                                                {formatCurrency(order.total)}
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                                                    {getStatusText(order.status)}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <button className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                                                    <Eye className="w-5 h-5" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination */}
                        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100">
                            <p className="text-sm text-gray-600">
                                Hiển thị 1-{filteredOrders.length} của {filteredOrders.length} đơn hàng
                            </p>
                            <div className="flex items-center gap-2">
                                <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg" disabled>
                                    <ChevronLeft className="w-5 h-5" />
                                </button>
                                <button className="px-3 py-1 bg-blue-600 text-white rounded-lg text-sm font-medium">1</button>
                                <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg" disabled>
                                    <ChevronRight className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            {/* Mobile Bottom Navigation */}
            <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-30">
                <div className="flex items-center justify-around py-2">
                    <Link href="/contractor/dashboard" className="flex flex-col items-center gap-1 py-2 px-3 text-gray-500">
                        <Home className="w-6 h-6" />
                        <span className="text-xs">Tổng quan</span>
                    </Link>
                    <Link href="/contractor/orders" className="flex flex-col items-center gap-1 py-2 px-3 text-blue-600">
                        <ShoppingCart className="w-6 h-6" />
                        <span className="text-xs font-medium">Đơn hàng</span>
                    </Link>
                    <Link href="/products" className="flex flex-col items-center gap-1 py-2 px-3 text-gray-500">
                        <Package className="w-6 h-6" />
                        <span className="text-xs">Sản phẩm</span>
                    </Link>
                    <Link href="/contractor/debt" className="flex flex-col items-center gap-1 py-2 px-3 text-gray-500">
                        <CreditCard className="w-6 h-6" />
                        <span className="text-xs">Công nợ</span>
                    </Link>
                </div>
            </nav>
        </div>
    )
}
