'use client'

/**
 * Contractor Contracts Page - Light Theme
 * Contract management for contractors
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
    Eye,
    Calendar,
    CheckCircle,
    Clock,
    TrendingDown
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

interface Contract {
    id: string
    contractNumber: string
    name: string
    type: string
    status: 'ACTIVE' | 'EXPIRED' | 'PENDING'
    validFrom: string
    validTo: string
    creditLimit: number
    discountPercent: number
}

export default function ContractorContractsPage() {
    const [sidebarOpen, setSidebarOpen] = useState(false)
    const [contracts, setContracts] = useState<Contract[]>([])

    useEffect(() => {
        setContracts([
            {
                id: '1',
                contractNumber: 'HD-CONTRACTOR-001',
                name: 'Hợp đồng Giá ưu đãi 2025',
                type: 'DISCOUNT',
                status: 'ACTIVE',
                validFrom: '2025-01-01',
                validTo: '2025-12-31',
                creditLimit: 150000000,
                discountPercent: 15
            },
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
            case 'ACTIVE': return 'bg-green-100 text-green-700'
            case 'EXPIRED': return 'bg-gray-100 text-gray-700'
            case 'PENDING': return 'bg-orange-100 text-orange-700'
            default: return 'bg-gray-100 text-gray-700'
        }
    }

    const getStatusText = (status: string) => {
        switch (status) {
            case 'ACTIVE': return 'Đang hiệu lực'
            case 'EXPIRED': return 'Hết hạn'
            case 'PENDING': return 'Chờ ký'
            default: return status
        }
    }

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
                            <h1 className="text-2xl font-bold text-gray-900">Hợp đồng</h1>
                            <p className="text-gray-600">Xem các hợp đồng và ưu đãi của bạn</p>
                        </div>
                    </div>

                    {/* Contracts Grid */}
                    <div className="grid gap-6">
                        {contracts.map((contract) => (
                            <div key={contract.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                                <div className="p-6">
                                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
                                        <div className="flex items-start gap-4">
                                            <div className="w-14 h-14 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
                                                <FileText className="w-7 h-7 text-blue-600" />
                                            </div>
                                            <div>
                                                <h3 className="text-xl font-semibold text-gray-900">{contract.name}</h3>
                                                <p className="text-gray-500 text-sm">{contract.contractNumber}</p>
                                            </div>
                                        </div>
                                        <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium ${getStatusColor(contract.status)}`}>
                                            {contract.status === 'ACTIVE' && <CheckCircle className="w-4 h-4" />}
                                            {contract.status === 'PENDING' && <Clock className="w-4 h-4" />}
                                            {getStatusText(contract.status)}
                                        </span>
                                    </div>

                                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                                        <div className="bg-gray-50 rounded-xl p-4">
                                            <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
                                                <Calendar className="w-4 h-4" />
                                                Hiệu lực từ
                                            </div>
                                            <p className="font-semibold text-gray-900">{contract.validFrom}</p>
                                        </div>
                                        <div className="bg-gray-50 rounded-xl p-4">
                                            <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
                                                <Calendar className="w-4 h-4" />
                                                Đến ngày
                                            </div>
                                            <p className="font-semibold text-gray-900">{contract.validTo}</p>
                                        </div>
                                        <div className="bg-green-50 rounded-xl p-4">
                                            <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
                                                <TrendingDown className="w-4 h-4" />
                                                Chiết khấu
                                            </div>
                                            <p className="font-semibold text-green-600 text-xl">{contract.discountPercent}%</p>
                                        </div>
                                        <div className="bg-blue-50 rounded-xl p-4">
                                            <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
                                                <CreditCard className="w-4 h-4" />
                                                Hạn mức tín dụng
                                            </div>
                                            <p className="font-semibold text-blue-600">{formatCurrency(contract.creditLimit)}</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-gray-50 px-6 py-4 border-t border-gray-100 flex items-center justify-between">
                                    <p className="text-sm text-gray-500">
                                        Liên hệ <span className="text-blue-600 font-medium">0909 123 456</span> để gia hạn hoặc nâng cấp hợp đồng
                                    </p>
                                    <button className="flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium text-sm">
                                        <Download className="w-4 h-4" />
                                        Tải hợp đồng PDF
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Empty State */}
                    {contracts.length === 0 && (
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
                            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <FileText className="w-8 h-8 text-gray-400" />
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">Chưa có hợp đồng</h3>
                            <p className="text-gray-500 mb-6">Liên hệ với chúng tôi để được tư vấn và ký hợp đồng ưu đãi</p>
                            <Link
                                href="/contact"
                                className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold"
                            >
                                Liên hệ tư vấn
                            </Link>
                        </div>
                    )}

                    {/* Info Box */}
                    <div className="mt-8 bg-blue-50 rounded-xl p-6 border border-blue-100">
                        <h3 className="font-semibold text-blue-900 mb-2">Lợi ích khi có Hợp đồng</h3>
                        <ul className="space-y-2 text-blue-800 text-sm">
                            <li className="flex items-center gap-2">
                                <CheckCircle className="w-4 h-4 text-blue-600 flex-shrink-0" />
                                Giá cố định không bị ảnh hưởng bởi biến động thị trường
                            </li>
                            <li className="flex items-center gap-2">
                                <CheckCircle className="w-4 h-4 text-blue-600 flex-shrink-0" />
                                Hạn mức công nợ linh hoạt, thanh toán sau 30-60 ngày
                            </li>
                            <li className="flex items-center gap-2">
                                <CheckCircle className="w-4 h-4 text-blue-600 flex-shrink-0" />
                                Ưu tiên giao hàng và hỗ trợ chuyên viên riêng
                            </li>
                        </ul>
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
                    <Link href="/contractor/debt" className="flex flex-col items-center gap-1 py-2 px-3 text-gray-500">
                        <CreditCard className="w-6 h-6" />
                        <span className="text-xs">Công nợ</span>
                    </Link>
                </div>
            </nav>
        </div>
    )
}
