'use client'

/**
 * Contractor Debt Management Page - Light Theme
 * Debt/Credit management for contractors
 */

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
    Building2,
    Package,
    FileText,
    CreditCard,
    ShoppingCart,
    LogOut,
    Bell,
    Plus,
    Menu,
    X,
    Home,
    Download,
    DollarSign,
    Clock,
    AlertCircle,
    CheckCircle,
    Calendar
} from 'lucide-react'

// Sidebar Component
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
            {isOpen && (
                <div className="lg:hidden fixed inset-0 bg-black/50 z-40" onClick={onClose} />
            )}

            <aside className={`
        fixed top-0 left-0 bottom-0 w-64 bg-white border-r border-gray-200 z-50
        transform transition-transform duration-300 lg:translate-x-0
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:top-[73px]
      `}>
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

interface Invoice {
    id: string
    invoiceNumber: string
    date: string
    dueDate: string
    amount: number
    paid: number
    status: 'PAID' | 'PENDING' | 'OVERDUE'
}

export default function ContractorDebtPage() {
    const [sidebarOpen, setSidebarOpen] = useState(false)
    const [invoices, setInvoices] = useState<Invoice[]>([])
    const [stats, setStats] = useState({
        totalDebt: 45000000,
        creditLimit: 100000000,
        overdue: 0,
        dueThisWeek: 15000000
    })

    useEffect(() => {
        setInvoices([
            { id: '1', invoiceNumber: 'INV-2024-001', date: '2025-12-01', dueDate: '2025-12-31', amount: 15000000, paid: 0, status: 'PENDING' },
            { id: '2', invoiceNumber: 'INV-2024-002', date: '2025-11-15', dueDate: '2025-12-15', amount: 8500000, paid: 0, status: 'PENDING' },
            { id: '3', invoiceNumber: 'INV-2024-003', date: '2025-11-01', dueDate: '2025-12-01', amount: 22000000, paid: 22000000, status: 'PAID' },
            { id: '4', invoiceNumber: 'INV-2024-004', date: '2025-10-15', dueDate: '2025-11-15', amount: 12500000, paid: 12500000, status: 'PAID' },
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
            case 'PAID': return 'bg-green-100 text-green-700'
            case 'PENDING': return 'bg-orange-100 text-orange-700'
            case 'OVERDUE': return 'bg-red-100 text-red-700'
            default: return 'bg-gray-100 text-gray-700'
        }
    }

    const getStatusText = (status: string) => {
        switch (status) {
            case 'PAID': return 'Đã thanh toán'
            case 'PENDING': return 'Chờ thanh toán'
            case 'OVERDUE': return 'Quá hạn'
            default: return status
        }
    }

    const creditUsage = (stats.totalDebt / stats.creditLimit) * 100

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
                            <h1 className="text-2xl font-bold text-gray-900">Quản lý Công nợ</h1>
                            <p className="text-gray-600">Theo dõi và thanh toán hóa đơn</p>
                        </div>
                        <div className="flex gap-3">
                            <button className="flex items-center gap-2 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 px-4 py-2 rounded-lg font-medium">
                                <Download className="w-5 h-5" />
                                Xuất sao kê
                            </button>
                        </div>
                    </div>

                    {/* Stats Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
                                    <DollarSign className="w-6 h-6 text-red-600" />
                                </div>
                                <div>
                                    <p className="text-gray-500 text-sm">Tổng công nợ</p>
                                    <p className="text-xl font-bold text-gray-900">{formatCurrency(stats.totalDebt)}</p>
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
                                    <p className="text-xl font-bold text-gray-900">{formatCurrency(stats.creditLimit - stats.totalDebt)}</p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
                                    <Clock className="w-6 h-6 text-orange-600" />
                                </div>
                                <div>
                                    <p className="text-gray-500 text-sm">Đến hạn tuần này</p>
                                    <p className="text-xl font-bold text-gray-900">{formatCurrency(stats.dueThisWeek)}</p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                                    <AlertCircle className="w-6 h-6 text-purple-600" />
                                </div>
                                <div>
                                    <p className="text-gray-500 text-sm">Quá hạn</p>
                                    <p className="text-xl font-bold text-gray-900">{formatCurrency(stats.overdue)}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Credit Usage */}
                    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 mb-8">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-semibold text-gray-900">Hạn mức Tín dụng</h2>
                            <span className="text-sm text-gray-500">
                                {formatCurrency(stats.totalDebt)} / {formatCurrency(stats.creditLimit)}
                            </span>
                        </div>
                        <div className="h-4 bg-gray-100 rounded-full overflow-hidden">
                            <div
                                className={`h-full rounded-full transition-all ${creditUsage > 80 ? 'bg-red-500' :
                                        creditUsage > 60 ? 'bg-orange-500' : 'bg-green-500'
                                    }`}
                                style={{ width: `${creditUsage}%` }}
                            />
                        </div>
                        <div className="flex justify-between mt-2 text-sm">
                            <span className="text-gray-500">Đã sử dụng: {creditUsage.toFixed(1)}%</span>
                            <span className="text-gray-500">Còn lại: {(100 - creditUsage).toFixed(1)}%</span>
                        </div>
                    </div>

                    {/* Invoices Table */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="p-6 border-b border-gray-100">
                            <h2 className="text-lg font-semibold text-gray-900">Danh sách Hóa đơn</h2>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50 border-b border-gray-100">
                                    <tr>
                                        <th className="text-left px-6 py-4 text-sm font-semibold text-gray-700">Số HĐ</th>
                                        <th className="text-left px-6 py-4 text-sm font-semibold text-gray-700">Ngày lập</th>
                                        <th className="text-left px-6 py-4 text-sm font-semibold text-gray-700">Hạn thanh toán</th>
                                        <th className="text-right px-6 py-4 text-sm font-semibold text-gray-700">Số tiền</th>
                                        <th className="text-right px-6 py-4 text-sm font-semibold text-gray-700">Đã thanh toán</th>
                                        <th className="text-center px-6 py-4 text-sm font-semibold text-gray-700">Trạng thái</th>
                                        <th className="text-center px-6 py-4 text-sm font-semibold text-gray-700"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {invoices.map((invoice) => (
                                        <tr key={invoice.id} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-6 py-4">
                                                <span className="font-semibold text-blue-600">{invoice.invoiceNumber}</span>
                                            </td>
                                            <td className="px-6 py-4 text-gray-600">{invoice.date}</td>
                                            <td className="px-6 py-4 text-gray-600">{invoice.dueDate}</td>
                                            <td className="px-6 py-4 text-right font-semibold text-gray-900">
                                                {formatCurrency(invoice.amount)}
                                            </td>
                                            <td className="px-6 py-4 text-right text-gray-600">
                                                {formatCurrency(invoice.paid)}
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(invoice.status)}`}>
                                                    {getStatusText(invoice.status)}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                {invoice.status !== 'PAID' && (
                                                    <button className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm rounded-lg font-medium transition-colors">
                                                        Thanh toán
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
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
                    <Link href="/contractor/orders" className="flex flex-col items-center gap-1 py-2 px-3 text-gray-500">
                        <ShoppingCart className="w-6 h-6" />
                        <span className="text-xs">Đơn hàng</span>
                    </Link>
                    <Link href="/products" className="flex flex-col items-center gap-1 py-2 px-3 text-gray-500">
                        <Package className="w-6 h-6" />
                        <span className="text-xs">Sản phẩm</span>
                    </Link>
                    <Link href="/contractor/debt" className="flex flex-col items-center gap-1 py-2 px-3 text-blue-600">
                        <CreditCard className="w-6 h-6" />
                        <span className="text-xs font-medium">Công nợ</span>
                    </Link>
                </div>
            </nav>
        </div>
    )
}
