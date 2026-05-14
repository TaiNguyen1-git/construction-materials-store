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
    Map,
    ChevronDown,
    ChevronRight,
    ChevronLeft,
    Wallet,
    Receipt,
    Shield,
    HelpCircle,
    MessageSquare,
    Sparkles,
    LifeBuoy,
    LucideIcon,
    PanelLeftClose,
    PanelLeftOpen,
    ArrowRight
} from 'lucide-react'
import { useContractorCartStore } from '@/stores/contractorCartStore'

interface SidebarProps {
    isOpen: boolean
    onClose: () => void
    onToggle?: () => void
    isCollapsed?: boolean
    setIsCollapsed?: (collapsed: boolean) => void
}

export default function Sidebar({ isOpen, onClose, onToggle, isCollapsed, setIsCollapsed }: SidebarProps) {
    const pathname = usePathname()
    const { getTotalItems } = useContractorCartStore()
    const cartItemCount = getTotalItems()

    // Grouped navigation items for better organization
    const navGroups: { title: string; items: { href: string; icon: LucideIcon; label: string; badge?: number }[] }[] = [
        {
            title: 'Tổng quan',
            items: [
                { href: '/contractor/dashboard', icon: Home, label: 'Dashboard' },
                { href: '/contractor/estimator', icon: Sparkles, label: 'Bóc Tách AI' },
                { href: '/contractor/messages', icon: MessageSquare, label: 'Tin nhắn' },
                { href: '/contractor/projects/find', icon: Briefcase, label: 'Tìm việc mới' },
            ]
        },
        {
            title: 'Quản lý dự án',
            items: [
                { href: '/contractor/projects', icon: Building2, label: 'Quản lý Thi công' },
                { href: '/contractor/team', icon: Users, label: 'Đội ngũ & Nhân sự' },
                { href: '/contractor/quotes', icon: PenTool, label: 'Đấu thầu & Hợp đồng' },
            ]
        },
        {
            title: 'Mua sắm & Tài chính',
            items: [
                { href: '/contractor/orders', icon: Package, label: 'Quản lý Đơn hàng' },
                { href: '/contractor/debt', icon: CreditCard, label: 'Tài chính & Ví' },
                { href: '/contractor/insurance', icon: Shield, label: 'Dịch vụ & Bảo hiểm' },
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
                <div 
                    className="lg:hidden fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[60] animate-in fade-in duration-300"
                    onClick={onClose} 
                />
            )}

            {/* Sidebar */}
            <aside className={`
                hidden lg:flex flex-col
                transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)]
                ${isOpen ? (isCollapsed ? 'w-24 px-2' : 'w-72 px-4') : 'w-0 overflow-hidden px-0'}
            `}>
                <div className="flex-1 flex flex-col min-h-0 border-r border-gray-100/60 bg-white/80 backdrop-blur-2xl shadow-[0_20px_50px_rgba(0,0,0,0.04)] my-4 rounded-[32px] overflow-hidden">
                    <div className="flex-1 flex flex-col pt-8 pb-4 overflow-y-auto overflow-x-hidden custom-scrollbar">
                        {/* Brand Section */}
                        <div className={`flex items-center flex-shrink-0 px-6 mb-10 transition-all duration-500 ${isCollapsed ? 'justify-center px-0' : ''}`}>
                            <div className="relative group cursor-pointer" onClick={() => (window.location.href = '/contractor/dashboard')}>
                                <div className="absolute -inset-1.5 bg-gradient-to-r from-primary-600 to-indigo-600 rounded-xl blur opacity-20 group-hover:opacity-40 transition duration-1000"></div>
                                <div className="relative p-2.5 bg-gradient-to-br from-primary-600 to-indigo-700 rounded-xl shadow-xl shadow-primary-500/20 transform group-hover:scale-105 transition-transform">
                                    <Building2 className="h-5 w-5 text-white" />
                                </div>
                            </div>
                            {!isCollapsed && (
                                <div className="ml-4 min-w-0 flex flex-col">
                                    <h1 className="text-xl font-black text-slate-900 tracking-tighter leading-none mb-1">SmartBuild</h1>
                                    <span className="text-[9px] text-primary-500 font-black uppercase tracking-widest opacity-70">PRO Contractor</span>
                                </div>
                            )}
                        </div>

                        <nav className="flex-1 space-y-8">
                            {navGroups.map((group, groupIndex) => (
                                <div key={groupIndex} className="space-y-1">
                                    {!isCollapsed && (
                                        <button
                                            onClick={() => toggleGroup(group.title)}
                                            className="w-full flex items-center justify-between px-6 py-1 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] hover:text-primary-600 transition-colors group/header"
                                        >
                                            <span>{group.title}</span>
                                            <div className={`transition-transform duration-300 ${!expandedGroups[group.title] ? '-rotate-90' : ''}`}>
                                                <ChevronDown className="h-3.5 w-3.5 opacity-50" />
                                            </div>
                                        </button>
                                    )}
                                    {isCollapsed && <div className="h-px bg-slate-100 mx-4 my-6 opacity-60" />}

                                    <div className={`space-y-1 transition-all duration-300 overflow-hidden ${!expandedGroups[group.title] && !isCollapsed ? 'max-h-0 opacity-0' : 'max-h-[500px] opacity-100'}`}>
                                        {group.items.map((item) => {
                                            const isActive = pathname === item.href
                                            return (
                                                <Link
                                                    key={item.href}
                                                    href={item.href}
                                                    onClick={handleLinkClick}
                                                    className={`
                                                        group relative flex items-center ${isCollapsed ? 'justify-center px-0 mx-auto w-12 h-12' : 'px-4 mx-2'} py-3 rounded-2xl transition-all duration-300
                                                        ${isActive
                                                            ? 'bg-primary-600 text-white shadow-lg shadow-primary-600/20 ring-1 ring-primary-600/10'
                                                            : 'text-slate-600 hover:bg-slate-50 hover:text-primary-600'
                                                        }
                                                    `}
                                                    title={isCollapsed ? item.label : ''}
                                                >
                                                    <item.icon
                                                        strokeWidth={isActive ? 2.5 : 2}
                                                        className={`flex-shrink-0 h-5 w-5 transition-all duration-300 group-hover:scale-110 ${!isCollapsed && 'mr-3'} ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-primary-500'}`}
                                                    />
                                                    {!isCollapsed && <span className="truncate font-bold text-sm tracking-tight">{item.label}</span>}
                                                    {item.badge !== undefined && item.badge > 0 && (
                                                        <span className={`
                                                            ${isCollapsed ? 'absolute -top-1 -right-1 min-w-[16px] h-[16px]' : 'ml-auto px-1.5 py-0.5'}
                                                            flex items-center justify-center text-[9px] font-black rounded-full shadow-sm
                                                            ${isActive ? 'bg-white/20 text-white backdrop-blur-sm' : 'bg-red-500 text-white'}
                                                        `}>
                                                            {item.badge}
                                                        </span>
                                                    )}
                                                    {isActive && !isCollapsed && (
                                                        <ArrowRight className="ml-auto w-4 h-4 opacity-70 group-hover:translate-x-1 transition-transform" />
                                                    )}
                                                </Link>
                                            )
                                        })}
                                    </div>
                                </div>
                            ))}
                        </nav>
                    </div>

                    {/* Sidebar Footer */}
                    <div className="p-4 border-t border-slate-100/60 bg-slate-50/50">
                        <button
                            onClick={() => setIsCollapsed && setIsCollapsed(!isCollapsed)}
                            className="w-full flex items-center justify-center h-10 rounded-xl bg-white border border-slate-100 text-slate-400 hover:text-primary-600 hover:border-primary-100 hover:shadow-sm transition-all group"
                        >
                            {isCollapsed ? (
                                <PanelLeftOpen className="h-5 w-5" />
                            ) : (
                                <div className="flex items-center gap-2">
                                    <PanelLeftClose className="h-5 w-5" />
                                    <span className="text-[10px] font-black uppercase tracking-widest">Thu gọn menu</span>
                                </div>
                            )}
                        </button>
                    </div>
                </div>
            </aside>

            {/* Mobile Sidebar */}
            <aside className={`
                fixed top-0 left-0 bottom-0 w-72 bg-white z-[70] lg:hidden
                transform transition-transform duration-300 ease-out
                ${isOpen ? 'translate-x-0' : '-translate-x-full'}
            `}>
                <div className="flex flex-col h-full">
                    <div className="p-6 flex items-center justify-between border-b border-slate-50">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
                                <Building2 className="w-5 h-5 text-white" />
                            </div>
                            <span className="font-bold text-slate-900 text-lg tracking-tighter">SmartBuild</span>
                        </div>
                        <button onClick={onClose} className="p-2 text-slate-400 hover:bg-slate-50 rounded-xl">
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                    <nav className="flex-1 p-4 space-y-6 overflow-y-auto">
                        {navGroups.map((group, groupIndex) => (
                            <div key={groupIndex} className="space-y-1">
                                <h3 className="px-4 py-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">{group.title}</h3>
                                {group.items.map((item) => (
                                    <Link
                                        key={item.href}
                                        href={item.href}
                                        onClick={onClose}
                                        className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${pathname === item.href ? 'bg-primary-600 text-white shadow-lg shadow-primary-500/30' : 'text-slate-600 hover:bg-slate-50'}`}
                                    >
                                        <item.icon className="w-5 h-5" />
                                        {item.label}
                                    </Link>
                                ))}
                            </div>
                        ))}
                    </nav>
                </div>
            </aside>
        </>
    )
}
