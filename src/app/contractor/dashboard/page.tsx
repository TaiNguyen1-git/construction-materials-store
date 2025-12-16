'use client'

/**
 * Contractor Dashboard - Light Theme
 * Main dashboard for verified contractors
 */

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
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
    CheckCircle,
    Menu,
    X,
    Home
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

// Sidebar Navigation Component
function Sidebar({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
    const pathname = usePathname()

    const navItems = [
        { href: '/contractor/dashboard', icon: Home, label: 'Tổng quan' },
        { href: '/contractor/orders', icon: ShoppingCart, label: 'Đơn hàng' },
        { href: '/products', icon: Package, label: 'Sản phẩm' },
        { href: '/contractor/debt', icon: CreditCard, label: 'Công nợ' },
        { href: '/contractor/contracts', icon: FileText, label: 'Hợp đồng' },
    ]

    return (
        <>
            {/* Mobile Overlay */}
            {isOpen && (
                <div className="lg:hidden fixed inset-0 bg-black/50 z-40" onClick={onClose} />
            )}

            {/* Sidebar */}
            <aside className={`
        fixed top-0 left-0 bottom-0 w-64 bg-white border-r border-gray-200 z-50
        transform transition-transform duration-300 lg:translate-x-0
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:top-[73px]
      `}>
                {/* Mobile Header */}
                <div className="lg:hidden flex items-center justify-between p-4 border-b border-gray-100">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                            <Building2 className="w-5 h-5 text-white" />
                        </div>
                        <span className="font-bold text-gray-900">SmartBuild PRO</span>
                    </div>
                    <button onClick={onClose} className="p-2 text-gray-500">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <nav className="p-4 space-y-1">
                    {navItems.map((item) => {
                        const isActive = pathname === item.href
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                onClick={onClose}
                                className={`flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-colors ${isActive
                                        ? 'bg-blue-50 text-blue-600'
                                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                                    }`}
                            >
                                <item.icon className="w-5 h-5" />
                                {item.label}
                            </Link>
                        )
                    })}
                </nav>

                {/* Quick Action */}
                <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-100">
                    <Link
                        href="/products"
                        className="flex items-center justify-center gap-2 w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-semibold transition-all"
                    >
                        <Plus className="w-5 h-5" />
                        Đặt hàng mới
                    </Link>
                </div>
            </aside>
        </>
    )
}

export default function ContractorDashboardPage() {
    const [sidebarOpen, setSidebarOpen] = useState(false)
    const [stats, setStats] = useState<DashboardStats>({
        totalOrders: 12,
        currentDebt: 45000000,
        creditLimit: 100000000,
        pendingOrders: 2
    })
    const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([])
    const [user, setUser] = useState<any>(null)

    useEffect(() => {
        const userData = localStorage.getItem('user')
        if (userData) {
            setUser(JSON.parse(userData))
        }

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
            case 'DELIVERED': return 'bg-green-100 text-green-700'
            case 'PROCESSING': return 'bg-orange-100 text-orange-700'
            case 'SHIPPED': return 'bg-blue-100 text-blue-700'
            default: return 'bg-gray-100 text-gray-700'
        }
    }

    const getStatusText = (status: string) => {
        switch (status) {
            case 'DELIVERED': return 'Đã giao'
            case 'PROCESSING': return 'Đang xử lý'
            case 'SHIPPED': return 'Đang giao'
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

                        {/* Search */}
                        <div className="hidden md:flex flex-1 max-w-md mx-8">
                            <div className="relative w-full">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Tìm kiếm sản phẩm..."
                                    className="w-full bg-gray-50 border border-gray-200 rounded-lg pl-10 pr-4 py-2.5 text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>
                        </div>

                        {/* Right Actions */}
                        <div className="flex items-center gap-3">
                            <button className="relative p-2 text-gray-500 hover:bg-gray-100 rounded-lg">
                                <Bell className="w-6 h-6" />
                                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
                            </button>
                            <div className="hidden sm:flex items-center gap-2 text-gray-700 px-3 py-2 bg-gray-50 rounded-lg">
                                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                                    <User className="w-4 h-4 text-blue-600" />
                                </div>
                                <span className="font-medium">{user?.name || 'Đối tác'}</span>
                            </div>
                            <button
                                onClick={handleLogout}
                                className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                title="Đăng xuất"
                            >
                                <LogOut className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Sidebar */}
            <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

            {/* Main Content */}
            <main className="lg:ml-64 pt-[73px]">
                <div className="p-6 lg:p-8 max-w-7xl mx-auto">
                    {/* Welcome Banner */}
                    <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl p-6 mb-8 text-white">
                        <h1 className="text-2xl font-bold mb-2">
                            Chào mừng{user?.name ? `, ${user.name.split(' ').pop()}` : ''}! 👋
                        </h1>
                        <p className="text-blue-100">
                            Quản lý đơn hàng và theo dõi công nợ tại đây
                        </p>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                                    <ShoppingCart className="w-6 h-6 text-blue-600" />
                                </div>
                                <div>
                                    <p className="text-gray-500 text-sm">Tổng đơn hàng</p>
                                    <p className="text-2xl font-bold text-gray-900">{stats.totalOrders}</p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
                                    <Clock className="w-6 h-6 text-orange-600" />
                                </div>
                                <div>
                                    <p className="text-gray-500 text-sm">Đang xử lý</p>
                                    <p className="text-2xl font-bold text-gray-900">{stats.pendingOrders}</p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
                                    <DollarSign className="w-6 h-6 text-red-600" />
                                </div>
                                <div>
                                    <p className="text-gray-500 text-sm">Công nợ hiện tại</p>
                                    <p className="text-xl font-bold text-gray-900">{formatCurrency(stats.currentDebt)}</p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                                    <CreditCard className="w-6 h-6 text-green-600" />
                                </div>
                                <div>
                                    <p className="text-gray-500 text-sm">Hạn mức còn lại</p>
                                    <p className="text-xl font-bold text-gray-900">{formatCurrency(stats.creditLimit - stats.currentDebt)}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Credit Usage */}
                    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 mb-8">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-semibold text-gray-900">Hạn mức Tín dụng</h2>
                            <span className="text-sm text-gray-500">
                                {formatCurrency(stats.currentDebt)} / {formatCurrency(stats.creditLimit)}
                            </span>
                        </div>
                        <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                            <div
                                className={`h-full rounded-full transition-all ${creditUsage > 80 ? 'bg-red-500' :
                                        creditUsage > 60 ? 'bg-orange-500' : 'bg-green-500'
                                    }`}
                                style={{ width: `${creditUsage}%` }}
                            />
                        </div>
                        <div className="flex justify-between mt-2 text-sm">
                            <span className={creditUsage > 80 ? 'text-red-600' : 'text-gray-500'}>
                                Đã sử dụng: {creditUsage.toFixed(1)}%
                            </span>
                            <span className="text-gray-500">
                                Còn lại: {(100 - creditUsage).toFixed(1)}%
                            </span>
                        </div>
                    </div>

                    {/* Two Columns */}
                    <div className="grid lg:grid-cols-2 gap-8">
                        {/* Recent Orders */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
                            <div className="flex items-center justify-between p-6 border-b border-gray-100">
                                <h2 className="text-lg font-semibold text-gray-900">Đơn hàng Gần đây</h2>
                                <Link href="/contractor/orders" className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center gap-1">
                                    Xem tất cả
                                    <ArrowRight className="w-4 h-4" />
                                </Link>
                            </div>
                            <div className="p-6">
                                <div className="space-y-4">
                                    {recentOrders.map((order) => (
                                        <div key={order.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                                            <div>
                                                <p className="font-medium text-gray-900">{order.orderNumber}</p>
                                                <p className="text-sm text-gray-500">{order.date}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="font-semibold text-gray-900">{formatCurrency(order.total)}</p>
                                                <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
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
                            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                                <h2 className="text-lg font-semibold text-gray-900 mb-4">Thao tác Nhanh</h2>
                                <div className="grid grid-cols-2 gap-4">
                                    <Link
                                        href="/products"
                                        className="flex flex-col items-center gap-2 p-4 bg-blue-50 rounded-xl hover:bg-blue-100 transition-colors"
                                    >
                                        <Package className="w-8 h-8 text-blue-600" />
                                        <span className="text-sm font-medium text-gray-700">Xem Sản phẩm</span>
                                    </Link>
                                    <Link
                                        href="/contractor/debt"
                                        className="flex flex-col items-center gap-2 p-4 bg-green-50 rounded-xl hover:bg-green-100 transition-colors"
                                    >
                                        <CreditCard className="w-8 h-8 text-green-600" />
                                        <span className="text-sm font-medium text-gray-700">Thanh toán</span>
                                    </Link>
                                    <Link
                                        href="/contractor/contracts"
                                        className="flex flex-col items-center gap-2 p-4 bg-purple-50 rounded-xl hover:bg-purple-100 transition-colors"
                                    >
                                        <FileText className="w-8 h-8 text-purple-600" />
                                        <span className="text-sm font-medium text-gray-700">Xem Hợp đồng</span>
                                    </Link>
                                    <Link
                                        href="/contractor/orders"
                                        className="flex flex-col items-center gap-2 p-4 bg-orange-50 rounded-xl hover:bg-orange-100 transition-colors"
                                    >
                                        <Calendar className="w-8 h-8 text-orange-600" />
                                        <span className="text-sm font-medium text-gray-700">Lịch sử ĐH</span>
                                    </Link>
                                </div>
                            </div>

                            {/* Notifications */}
                            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                                <h2 className="text-lg font-semibold text-gray-900 mb-4">Thông báo</h2>
                                <div className="space-y-3">
                                    <div className="flex items-start gap-3 p-3 bg-orange-50 border border-orange-100 rounded-xl">
                                        <AlertCircle className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
                                        <div>
                                            <p className="text-sm text-gray-700">Hóa đơn #INV-2024-001 sắp đến hạn</p>
                                            <p className="text-xs text-gray-500 mt-1">2 ngày nữa</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-3 p-3 bg-green-50 border border-green-100 rounded-xl">
                                        <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                                        <div>
                                            <p className="text-sm text-gray-700">Đơn hàng #ORD-001 đã giao thành công</p>
                                            <p className="text-xs text-gray-500 mt-1">Hôm qua</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            {/* Mobile Bottom Navigation */}
            <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-30">
                <div className="flex items-center justify-around py-2">
                    <Link href="/contractor/dashboard" className="flex flex-col items-center gap-1 py-2 px-3 text-blue-600">
                        <Home className="w-6 h-6" />
                        <span className="text-xs font-medium">Tổng quan</span>
                    </Link>
                    <Link href="/contractor/orders" className="flex flex-col items-center gap-1 py-2 px-3 text-gray-500">
                        <ShoppingCart className="w-6 h-6" />
                        <span className="text-xs">Đơn hàng</span>
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
