'use client'

/**
 * Contractor Dashboard
 * Main dashboard for verified contractors
 */

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
    Building2,
    Package,
    FileText,
    CreditCard,
    TrendingUp,
    Clock,
    ShoppingCart,
    ArrowRight,
    LogOut,
    User,
    Bell,
    Search,
    Plus,
    DollarSign,
    Calendar,
    AlertCircle,
    CheckCircle
} from 'lucide-react'

interface DashboardStats {
    totalOrders: number
    currentDebt: number
    creditLimit: number
    pendingOrders: number
}

interface RecentOrder {
    id: string
    orderNumber: string
    date: string
    total: number
    status: string
}

export default function ContractorDashboardPage() {
    const [stats, setStats] = useState<DashboardStats>({
        totalOrders: 12,
        currentDebt: 45000000,
        creditLimit: 100000000,
        pendingOrders: 2
    })
    const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([])
    const [loading, setLoading] = useState(false)
    const [user, setUser] = useState<any>(null)

    useEffect(() => {
        // Get user from localStorage
        const userData = localStorage.getItem('user')
        if (userData) {
            setUser(JSON.parse(userData))
        }

        // Fetch dashboard data
        // For now, using mock data
        setRecentOrders([
            { id: '1', orderNumber: 'ORD-001', date: '2025-12-15', total: 15000000, status: 'DELIVERED' },
            { id: '2', orderNumber: 'ORD-002', date: '2025-12-14', total: 8500000, status: 'PROCESSING' },
            { id: '3', orderNumber: 'ORD-003', date: '2025-12-13', total: 22000000, status: 'SHIPPED' },
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
            case 'DELIVERED': return 'bg-green-500/20 text-green-400'
            case 'PROCESSING': return 'bg-amber-500/20 text-amber-400'
            case 'SHIPPED': return 'bg-blue-500/20 text-blue-400'
            case 'PENDING': return 'bg-slate-500/20 text-slate-400'
            default: return 'bg-slate-500/20 text-slate-400'
        }
    }

    const getStatusText = (status: string) => {
        switch (status) {
            case 'DELIVERED': return 'Đã giao'
            case 'PROCESSING': return 'Đang xử lý'
            case 'SHIPPED': return 'Đang giao'
            case 'PENDING': return 'Chờ xác nhận'
            default: return status
        }
    }

    const creditUsage = (stats.currentDebt / stats.creditLimit) * 100

    const handleLogout = () => {
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        window.location.href = '/contractor'
    }

    return (
        <div className="min-h-screen bg-slate-950 text-white">
            {/* Top Navigation */}
            <nav className="fixed top-0 left-0 right-0 z-50 bg-slate-900/95 backdrop-blur-md border-b border-slate-800">
                <div className="max-w-7xl mx-auto px-6 py-4">
                    <div className="flex items-center justify-between">
                        <Link href="/contractor/dashboard" className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-amber-600 rounded-lg flex items-center justify-center">
                                <Building2 className="w-6 h-6 text-slate-950" />
                            </div>
                            <div>
                                <span className="text-xl font-bold text-white">SmartBuild</span>
                                <span className="text-amber-500 font-semibold ml-2">PRO</span>
                            </div>
                        </Link>

                        {/* Search */}
                        <div className="hidden md:flex flex-1 max-w-md mx-8">
                            <div className="relative w-full">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                <input
                                    type="text"
                                    placeholder="Tìm kiếm sản phẩm..."
                                    className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-white placeholder-slate-500 focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                                />
                            </div>
                        </div>

                        {/* Right Actions */}
                        <div className="flex items-center gap-4">
                            <button className="relative p-2 text-slate-400 hover:text-white transition-colors">
                                <Bell className="w-6 h-6" />
                                <span className="absolute top-0 right-0 w-2 h-2 bg-amber-500 rounded-full" />
                            </button>
                            <button className="flex items-center gap-2 text-slate-300 hover:text-white transition-colors">
                                <div className="w-8 h-8 bg-slate-700 rounded-full flex items-center justify-center">
                                    <User className="w-4 h-4" />
                                </div>
                                <span className="hidden md:inline">{user?.name || 'Đối tác'}</span>
                            </button>
                            <button
                                onClick={handleLogout}
                                className="p-2 text-slate-400 hover:text-red-400 transition-colors"
                                title="Đăng xuất"
                            >
                                <LogOut className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Sidebar */}
            <aside className="hidden lg:block fixed left-0 top-[73px] bottom-0 w-64 bg-slate-900 border-r border-slate-800 overflow-y-auto">
                <nav className="p-4 space-y-2">
                    <Link href="/contractor/dashboard" className="flex items-center gap-3 px-4 py-3 bg-amber-500/10 text-amber-500 rounded-xl font-medium">
                        <TrendingUp className="w-5 h-5" />
                        Tổng quan
                    </Link>
                    <Link href="/contractor/orders" className="flex items-center gap-3 px-4 py-3 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors">
                        <ShoppingCart className="w-5 h-5" />
                        Đơn hàng
                    </Link>
                    <Link href="/products" className="flex items-center gap-3 px-4 py-3 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors">
                        <Package className="w-5 h-5" />
                        Sản phẩm
                    </Link>
                    <Link href="/contractor/debt" className="flex items-center gap-3 px-4 py-3 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors">
                        <CreditCard className="w-5 h-5" />
                        Công nợ
                    </Link>
                    <Link href="/contractor/contracts" className="flex items-center gap-3 px-4 py-3 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors">
                        <FileText className="w-5 h-5" />
                        Hợp đồng
                    </Link>
                </nav>

                {/* Quick Actions */}
                <div className="p-4 border-t border-slate-800">
                    <Link
                        href="/products"
                        className="flex items-center justify-center gap-2 w-full bg-amber-500 hover:bg-amber-600 text-slate-950 py-3 rounded-xl font-bold transition-all"
                    >
                        <Plus className="w-5 h-5" />
                        Đặt hàng mới
                    </Link>
                </div>
            </aside>

            {/* Main Content */}
            <main className="lg:ml-64 pt-[73px]">
                <div className="p-6 lg:p-8 max-w-7xl mx-auto">
                    {/* Welcome Banner */}
                    <div className="bg-gradient-to-r from-amber-500 to-amber-600 rounded-2xl p-6 mb-8">
                        <h1 className="text-2xl font-bold text-slate-950 mb-2">
                            Chào mừng trở lại{user?.name ? `, ${user.name.split(' ').pop()}` : ''}! 👋
                        </h1>
                        <p className="text-slate-800">
                            Quản lý đơn hàng và theo dõi công nợ tại đây
                        </p>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                        <div className="bg-slate-900 rounded-2xl p-6 border border-slate-800">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center">
                                    <ShoppingCart className="w-6 h-6 text-blue-500" />
                                </div>
                                <div>
                                    <p className="text-slate-400 text-sm">Tổng đơn hàng</p>
                                    <p className="text-2xl font-bold">{stats.totalOrders}</p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-slate-900 rounded-2xl p-6 border border-slate-800">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-amber-500/20 rounded-xl flex items-center justify-center">
                                    <Clock className="w-6 h-6 text-amber-500" />
                                </div>
                                <div>
                                    <p className="text-slate-400 text-sm">Đang xử lý</p>
                                    <p className="text-2xl font-bold">{stats.pendingOrders}</p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-slate-900 rounded-2xl p-6 border border-slate-800">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-red-500/20 rounded-xl flex items-center justify-center">
                                    <DollarSign className="w-6 h-6 text-red-500" />
                                </div>
                                <div>
                                    <p className="text-slate-400 text-sm">Công nợ hiện tại</p>
                                    <p className="text-2xl font-bold">{formatCurrency(stats.currentDebt)}</p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-slate-900 rounded-2xl p-6 border border-slate-800">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center">
                                    <CreditCard className="w-6 h-6 text-green-500" />
                                </div>
                                <div>
                                    <p className="text-slate-400 text-sm">Hạn mức còn lại</p>
                                    <p className="text-2xl font-bold">{formatCurrency(stats.creditLimit - stats.currentDebt)}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Credit Usage */}
                    <div className="bg-slate-900 rounded-2xl p-6 border border-slate-800 mb-8">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-semibold">Hạn mức Tín dụng</h2>
                            <span className="text-sm text-slate-400">
                                {formatCurrency(stats.currentDebt)} / {formatCurrency(stats.creditLimit)}
                            </span>
                        </div>
                        <div className="h-3 bg-slate-800 rounded-full overflow-hidden">
                            <div
                                className={`h-full rounded-full transition-all ${creditUsage > 80 ? 'bg-red-500' :
                                        creditUsage > 60 ? 'bg-amber-500' : 'bg-green-500'
                                    }`}
                                style={{ width: `${creditUsage}%` }}
                            />
                        </div>
                        <div className="flex justify-between mt-2 text-sm">
                            <span className={creditUsage > 80 ? 'text-red-400' : 'text-slate-400'}>
                                Đã sử dụng: {creditUsage.toFixed(1)}%
                            </span>
                            <span className="text-slate-400">
                                Còn lại: {(100 - creditUsage).toFixed(1)}%
                            </span>
                        </div>
                    </div>

                    {/* Two Columns */}
                    <div className="grid lg:grid-cols-2 gap-8">
                        {/* Recent Orders */}
                        <div className="bg-slate-900 rounded-2xl border border-slate-800">
                            <div className="flex items-center justify-between p-6 border-b border-slate-800">
                                <h2 className="text-lg font-semibold">Đơn hàng Gần đây</h2>
                                <Link href="/contractor/orders" className="text-amber-500 hover:text-amber-400 text-sm font-medium flex items-center gap-1">
                                    Xem tất cả
                                    <ArrowRight className="w-4 h-4" />
                                </Link>
                            </div>
                            <div className="p-6">
                                <div className="space-y-4">
                                    {recentOrders.map((order) => (
                                        <div key={order.id} className="flex items-center justify-between p-4 bg-slate-800/50 rounded-xl">
                                            <div>
                                                <p className="font-medium">{order.orderNumber}</p>
                                                <p className="text-sm text-slate-400">{order.date}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="font-semibold">{formatCurrency(order.total)}</p>
                                                <span className={`inline-block px-2 py-1 rounded-full text-xs ${getStatusColor(order.status)}`}>
                                                    {getStatusText(order.status)}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Quick Actions & Notifications */}
                        <div className="space-y-8">
                            {/* Quick Actions */}
                            <div className="bg-slate-900 rounded-2xl border border-slate-800 p-6">
                                <h2 className="text-lg font-semibold mb-4">Thao tác Nhanh</h2>
                                <div className="grid grid-cols-2 gap-4">
                                    <Link
                                        href="/products"
                                        className="flex flex-col items-center gap-2 p-4 bg-slate-800/50 rounded-xl hover:bg-slate-800 transition-colors"
                                    >
                                        <Package className="w-8 h-8 text-amber-500" />
                                        <span className="text-sm font-medium">Xem Sản phẩm</span>
                                    </Link>
                                    <Link
                                        href="/contractor/debt"
                                        className="flex flex-col items-center gap-2 p-4 bg-slate-800/50 rounded-xl hover:bg-slate-800 transition-colors"
                                    >
                                        <CreditCard className="w-8 h-8 text-green-500" />
                                        <span className="text-sm font-medium">Thanh toán</span>
                                    </Link>
                                    <Link
                                        href="/contractor/contracts"
                                        className="flex flex-col items-center gap-2 p-4 bg-slate-800/50 rounded-xl hover:bg-slate-800 transition-colors"
                                    >
                                        <FileText className="w-8 h-8 text-blue-500" />
                                        <span className="text-sm font-medium">Xem Hợp đồng</span>
                                    </Link>
                                    <Link
                                        href="#"
                                        className="flex flex-col items-center gap-2 p-4 bg-slate-800/50 rounded-xl hover:bg-slate-800 transition-colors"
                                    >
                                        <Calendar className="w-8 h-8 text-purple-500" />
                                        <span className="text-sm font-medium">Lịch Giao hàng</span>
                                    </Link>
                                </div>
                            </div>

                            {/* Notifications */}
                            <div className="bg-slate-900 rounded-2xl border border-slate-800 p-6">
                                <h2 className="text-lg font-semibold mb-4">Thông báo</h2>
                                <div className="space-y-3">
                                    <div className="flex items-start gap-3 p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl">
                                        <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                                        <div>
                                            <p className="text-sm">Hóa đơn #INV-2024-001 sắp đến hạn thanh toán</p>
                                            <p className="text-xs text-slate-400 mt-1">2 ngày nữa</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-3 p-3 bg-green-500/10 border border-green-500/30 rounded-xl">
                                        <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                                        <div>
                                            <p className="text-sm">Đơn hàng #ORD-001 đã giao thành công</p>
                                            <p className="text-xs text-slate-400 mt-1">Hôm qua</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            {/* Mobile Bottom Navigation */}
            <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-slate-900 border-t border-slate-800 z-50">
                <div className="flex items-center justify-around py-3">
                    <Link href="/contractor/dashboard" className="flex flex-col items-center gap-1 text-amber-500">
                        <TrendingUp className="w-6 h-6" />
                        <span className="text-xs">Tổng quan</span>
                    </Link>
                    <Link href="/contractor/orders" className="flex flex-col items-center gap-1 text-slate-400">
                        <ShoppingCart className="w-6 h-6" />
                        <span className="text-xs">Đơn hàng</span>
                    </Link>
                    <Link href="/products" className="flex flex-col items-center gap-1 text-slate-400">
                        <Package className="w-6 h-6" />
                        <span className="text-xs">Sản phẩm</span>
                    </Link>
                    <Link href="/contractor/debt" className="flex flex-col items-center gap-1 text-slate-400">
                        <CreditCard className="w-6 h-6" />
                        <span className="text-xs">Công nợ</span>
                    </Link>
                </div>
            </nav>
        </div>
    )
}
