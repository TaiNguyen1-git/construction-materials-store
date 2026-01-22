'use client'

import { useState } from 'react'
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
    PenTool,
    Briefcase,
    Plus,
    Users,
    ChevronDown,
    ChevronRight
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


    // Grouped navigation items for better organization
    const navGroups = [
        {
            title: 'Tổng quan',
            items: [
                { href: '/contractor/dashboard', icon: Home, label: 'Dashboard' },
                { href: '/projects', icon: Briefcase, label: 'Tìm việc mới' },
            ]
        },
        {
            title: 'Quản lý dự án',
            items: [
                { href: '/contractor/projects', icon: Building2, label: 'Công trình của tôi' },
                { href: '/contractor/team', icon: Users, label: 'Đội ngũ thợ' },
                { href: '/contractor/quotes', icon: PenTool, label: 'Báo giá & Đấu thầu' },
                { href: '/contractor/contracts', icon: FileText, label: 'Hợp đồng' },
            ]
        },
        {
            title: 'Mua sắm & Tài chính',
            items: [
                { href: '/contractor/quick-order', icon: ClipboardList, label: 'Đặt hàng nhanh' },
                { href: '/contractor/cart', icon: ShoppingCart, label: 'Giỏ hàng', badge: cartItemCount },
                { href: '/contractor/orders', icon: Package, label: 'Đơn hàng đã đặt' },
                { href: '/contractor/debt', icon: CreditCard, label: 'Công nợ' },
            ]
        }
    ]

    const handleLinkClick = () => {
        if (typeof window !== 'undefined' && window.innerWidth < 1024) {
            onClose()
        }
    }

    const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({
        'Tổng quan': true,
        'Quản lý dự án': true,
        'Mua sắm & Tài chính': true
    })

    const toggleGroup = (title: string) => {
        setExpandedGroups(prev => ({
            ...prev,
            [title]: !prev[title]
        }))
    }

    return (
        <>
            {/* Mobile Overlay */}
            {isOpen && (
                <div className="lg:hidden fixed inset-0 bg-black/50 z-40" onClick={onClose} />
            )}

            {/* Sidebar */}
            <aside className={`
                fixed top-0 left-0 bottom-0 w-64 bg-white border-r border-gray-200 z-50
                transform transition-transform duration-300
                ${isOpen ? 'translate-x-0' : '-translate-x-full'}
                lg:top-[60px]
            `}>
                {/* Mobile Header */}
                <div className="lg:hidden flex items-center justify-between p-3 border-b border-gray-100">
                    <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 bg-gradient-to-br from-primary-600 to-indigo-600 rounded-lg flex items-center justify-center shadow-lg shadow-primary-100">
                            <Building2 className="w-5 h-5 text-white" />
                        </div>
                        <span className="font-black text-gray-900 text-lg tracking-tight">SmartBuild PRO</span>
                    </div>
                    <button onClick={onClose} className="p-1.5 text-gray-500 hover:bg-gray-100 rounded-lg">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <nav className="p-4 space-y-2 overflow-y-auto h-[calc(100vh-140px)]">
                    {navGroups.map((group, groupIndex) => (
                        <div key={groupIndex} className="mb-2">
                            <button
                                onClick={() => toggleGroup(group.title)}
                                className="w-full flex items-center justify-between px-4 py-2 text-xs font-bold text-gray-400 uppercase tracking-wider hover:text-gray-600 transition-colors"
                            >
                                <span>{group.title}</span>
                                {expandedGroups[group.title] ? (
                                    <ChevronDown className="w-3 h-3" />
                                ) : (
                                    <ChevronRight className="w-3 h-3" />
                                )}
                            </button>

                            {expandedGroups[group.title] && (
                                <div className="space-y-1 mt-1 animate-in slide-in-from-top-1 duration-200">
                                    {group.items.map((item) => {
                                        const isActive = pathname === item.href
                                        return (
                                            <Link
                                                key={item.href}
                                                href={item.href}
                                                onClick={handleLinkClick}
                                                className={`flex items-center gap-2.5 px-4 py-2 rounded-lg font-bold transition-all text-xs ${isActive
                                                    ? 'bg-primary-50 text-primary-700'
                                                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                                                    }`}
                                            >
                                                <item.icon className={`w-4 h-4 ${isActive ? 'text-primary-600' : 'text-gray-400'}`} />
                                                <span className="flex-1">{item.label}</span>
                                                {item.badge !== undefined && item.badge > 0 && (
                                                    <span className="bg-red-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-md min-w-[18px] text-center shadow-sm shadow-red-200">
                                                        {item.badge}
                                                    </span>
                                                )}
                                            </Link>
                                        )
                                    })}
                                </div>
                            )}
                        </div>
                    ))}
                </nav>
            </aside>
        </>
    )
}
