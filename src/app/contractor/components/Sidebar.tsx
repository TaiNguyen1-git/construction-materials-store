'use client'

/**
 * Shared Sidebar Component for Contractor Pages
 * Includes navigation links with cart badge
 */

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
    Home,
    ClipboardList,
    ShoppingCart,
    Package,
    CreditCard,
    FileText,
    Building2,
    X,
    User,
    PenTool,
    Briefcase
} from 'lucide-react'
import { useContractorCartStore } from '@/stores/contractorCartStore'

interface SidebarProps {
    isOpen: boolean
    onClose: () => void
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
    const pathname = usePathname()
    const { getTotalItems } = useContractorCartStore()
    const cartItemCount = getTotalItems()

    const navItems = [
        { href: '/contractor/dashboard', icon: Home, label: 'Tổng quan' },
        { href: '/projects', icon: Briefcase, label: 'Tìm việc' },
        { href: '/contractor/quick-order', icon: ClipboardList, label: 'Đặt hàng nhanh' },
        { href: '/contractor/cart', icon: ShoppingCart, label: 'Giỏ hàng', badge: cartItemCount },
        { href: '/contractor/orders', icon: Package, label: 'Đơn hàng' },
        { href: '/contractor/projects', icon: Building2, label: 'Công trình' },
        { href: '/contractor/quotes', icon: PenTool, label: 'Báo giá' },
        { href: '/contractor/debt', icon: CreditCard, label: 'Công nợ' },
        { href: '/contractor/contracts', icon: FileText, label: 'Hợp đồng' },
        { href: '/contractor/profile', icon: User, label: 'Hồ sơ' },
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
                                <span className="flex-1">{item.label}</span>
                                {item.badge !== undefined && item.badge > 0 && (
                                    <span className="bg-blue-600 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                                        {item.badge}
                                    </span>
                                )}
                            </Link>
                        )
                    })}
                </nav>
            </aside>
        </>
    )
}
