'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import SupplierChatSupport from '@/components/supplier/SupplierChatSupport'
import ChatCallManager from '@/components/ChatCallManager'
import {
    Building2,
    LayoutDashboard,
    Package,
    FileText,
    DollarSign,
    LogOut,
    Menu,
    X,
    BarChart3,
    Bell,
    LifeBuoy,
    Percent,
    RotateCcw,
    ShieldCheck,
    ChevronLeft,
    ChevronRight,
    ChevronDown
} from 'lucide-react'

export default function SupplierLayout({ children }: { children: React.ReactNode }) {
    const router = useRouter()
    const pathname = usePathname()
    const [supplierName, setSupplierName] = useState('')
    const [supplierId, setSupplierId] = useState<string | null>(null)
    const [sidebarOpen, setSidebarOpen] = useState(false)
    const [isCollapsed, setIsCollapsed] = useState(false)
    const [unreadCount, setUnreadCount] = useState(0)
    const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({})

    const toggleGroup = (groupName: string) => {
        setCollapsedGroups(prev => ({
            ...prev,
            [groupName]: !prev[groupName]
        }))
    }

    // Don't show authenticated layout on public pages
    const isPublicPage = pathname === '/supplier' ||
        pathname === '/supplier/login' ||
        pathname?.startsWith('/supplier/register')

    useEffect(() => {
        if (isPublicPage) return

        const token = localStorage.getItem('supplier_token')
        const id = localStorage.getItem('supplier_id')
        const name = localStorage.getItem('supplier_name')

        if (!token) {
            router.push('/supplier/login')
            return
        }

        if (name) setSupplierName(name)
        if (id) {
            setSupplierId(id)
            fetchUnreadCount(id)
        }
    }, [pathname, router, isPublicPage])

    const fetchUnreadCount = async (sid: string) => {
        try {
            const res = await fetch(`/api/supplier/notifications?supplierId=${sid}`)
            const data = await res.json()
            if (data.success) {
                setUnreadCount(data.data.unreadCount)
            }
        } catch (error) {
            console.error('Fetch unread notifications failed')
        }
    }

    const handleLogout = () => {
        localStorage.removeItem('supplier_token')
        localStorage.removeItem('supplier_id')
        localStorage.removeItem('supplier_name')
        router.push('/supplier/login')
    }

    if (isPublicPage) {
        return <>{children}</>
    }

    const menuItems = [
        {
            group: 'Tổng quan',
            items: [
                { name: 'Dashboard', href: '/supplier/dashboard', icon: LayoutDashboard },
                { name: 'Phân tích', href: '/supplier/analytics', icon: BarChart3 },
            ]
        },
        {
            group: 'Quản lý bán hàng',
            items: [
                { name: 'Sản phẩm', href: '/supplier/products', icon: Package },
                { name: 'Đơn hàng', href: '/supplier/orders', icon: FileText },
                { name: 'Khuyến mãi', href: '/supplier/promotions', icon: Percent },
                { name: 'Trả hàng', href: '/supplier/returns', icon: RotateCcw },
            ]
        },
        {
            group: 'Tài chính',
            items: [
                { name: 'Hóa đơn', href: '/supplier/invoices', icon: FileText },
                { name: 'Công nợ', href: '/supplier/payments', icon: DollarSign },
            ]
        },
        {
            group: 'Hệ thống',
            items: [
                { name: 'Thông báo', href: '/supplier/notifications', icon: Bell, count: unreadCount },
                { name: 'Hồ sơ pháp lý', href: '/supplier/documents', icon: ShieldCheck },
                { name: 'Thông tin NCC', href: '/supplier/profile', icon: Building2 },
                { name: 'Hỗ trợ', href: '/supplier/support', icon: LifeBuoy },
            ]
        }
    ]

    return (
        <div className="min-h-screen bg-[#F0F4F8] text-slate-900 font-sans selection:bg-indigo-100 selection:text-indigo-700">
            {/* Ambient Background Glows */}
            {/* ... (keep background) ... */}

            {/* Mobile Header - Keep same */}
            <div className="lg:hidden sticky top-0 bg-white/90 backdrop-blur-xl border-b border-indigo-100/50 text-slate-900 p-4 flex items-center justify-between z-[60] shadow-sm">
                {/* ... (keep mobile header content) ... */}
            </div>

            <div className="flex relative min-h-screen">
                {/* Sidebar */}
                <aside className={`
                    flex flex-col
                    fixed lg:sticky top-0 h-screen z-50
                    bg-white/80 backdrop-blur-2xl border-r border-indigo-50/60
                    shadow-[4px_0_24px_-12px_rgba(0,0,0,0.05)]
                    transform transition-all duration-300 ease-out
                    ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
                    ${isCollapsed ? 'w-20' : 'w-[280px]'}
                `}>
                    {/* Brand */}
                    <div className={`p-6 flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'}`}>
                        <div className={`flex items-center gap-4 group cursor-pointer ${isCollapsed ? 'justify-center' : ''}`}>
                            <div className="relative w-10 h-10 flex-shrink-0">
                                <div className="absolute inset-0 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-xl rotate-6 group-hover:rotate-12 transition-transform duration-300 opacity-20 blur-sm"></div>
                                <div className="relative w-full h-full bg-gradient-to-br from-blue-600 to-indigo-700 rounded-xl flex items-center justify-center shadow-xl shadow-blue-500/30 group-hover:scale-105 transition-all duration-300 border border-white/10">
                                    <Building2 className="w-5 h-5 text-white" />
                                </div>
                            </div>
                            {!isCollapsed && (
                                <div className="flex flex-col">
                                    <h1 className="font-bold text-slate-900 text-lg tracking-tight leading-none">SmartBuild</h1>
                                    <span className="text-[9px] font-bold text-indigo-500 uppercase tracking-widest mt-1 opacity-80">
                                        Supplier Hub
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Navigation */}
                    <div className="flex-1 px-3 py-2 space-y-6 overflow-y-auto custom-scrollbar hover:custom-scrollbar-visible">
                        {menuItems.map((group, groupIndex) => {
                            const isGroupCollapsed = collapsedGroups[group.group]

                            return (
                                <div key={groupIndex}>
                                    {!isCollapsed && (
                                        <button
                                            onClick={() => toggleGroup(group.group)}
                                            className="w-full flex items-center justify-between px-4 mb-2 group/header hover:bg-indigo-50/50 rounded-lg py-1 transition-colors"
                                        >
                                            <h3 className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest truncate group-hover/header:text-indigo-600 transition-colors">
                                                {group.group}
                                            </h3>
                                            <ChevronDown
                                                className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${isGroupCollapsed ? '-rotate-90' : 'rotate-0'}`}
                                            />
                                        </button>
                                    )}
                                    <div className={`space-y-1 transition-all duration-300 overflow-hidden ${isGroupCollapsed && !isCollapsed ? 'max-h-0 opacity-0' : 'max-h-[500px] opacity-100'}`}>
                                        {group.items.map((item) => {
                                            const isActive = pathname === item.href
                                            return (
                                                <Link
                                                    key={item.href}
                                                    href={item.href}
                                                    onClick={() => setSidebarOpen(false)}
                                                    className={`
                                                        group relative flex items-center ${isCollapsed ? 'justify-center px-1' : 'justify-between px-4'} py-2.5 rounded-xl transition-all duration-200
                                                        ${isActive
                                                            ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/25'
                                                            : 'text-slate-500 hover:bg-indigo-50 hover:text-indigo-700'
                                                        }
                                                    `}
                                                    title={isCollapsed ? item.name : ''}
                                                >
                                                    <div className="flex items-center gap-3 relative z-10">
                                                        <item.icon
                                                            strokeWidth={isActive ? 2.5 : 2}
                                                            className={`w-5 h-5 transition-transform duration-200 ${!isCollapsed && 'group-hover:scale-110'} ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-indigo-600'}`}
                                                        />
                                                        {!isCollapsed && (
                                                            <span className={`text-[13px] ${isActive ? 'font-semibold' : 'font-medium'}`}>{item.name}</span>
                                                        )}
                                                    </div>
                                                    {item.count !== undefined && item.count > 0 && (
                                                        <span className={`
                                                            ${isCollapsed ? 'absolute -top-1 -right-1 min-w-[16px] h-[16px] px-0.5' : 'px-1.5 py-0.5'}
                                                            flex items-center justify-center text-[9px] font-bold rounded-full shadow-sm
                                                            ${isActive ? 'bg-white/20 text-white backdrop-blur-sm' : 'bg-red-500 text-white'}
                                                        `}>
                                                            {item.count}
                                                        </span>
                                                    )}
                                                </Link>
                                            )
                                        })}
                                    </div>
                                </div>
                            )
                        })}
                    </div>

                    {/* Collapse Toggle & Logout */}
                    <div className="p-3 border-t border-indigo-50/60 space-y-2">
                        <button
                            onClick={() => setIsCollapsed(!isCollapsed)}
                            className={`w-full flex items-center ${isCollapsed ? 'justify-center' : 'gap-3 px-4'} py-2 rounded-xl text-slate-400 hover:bg-slate-50 hover:text-slate-600 transition-colors duration-200`}
                        >
                            {isCollapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
                            {!isCollapsed && <span className="text-[13px] font-medium">Thu gọn sidebar</span>}
                        </button>

                        <button
                            onClick={handleLogout}
                            className={`w-full group flex items-center ${isCollapsed ? 'justify-center' : 'gap-3 px-4'} py-2 rounded-xl text-slate-500 hover:bg-red-50 hover:text-red-600 transition-all duration-200`}
                            title={isCollapsed ? 'Đăng xuất' : ''}
                        >
                            <LogOut strokeWidth={2} className={`w-5 h-5 text-slate-400 group-hover:text-red-500 transition-transform duration-200 ${!isCollapsed && 'group-hover:scale-110'}`} />
                            {!isCollapsed && <span className="font-medium text-[13px]">Đăng xuất</span>}
                        </button>
                    </div>
                </aside>

                {/* Overlay for mobile */}
                {sidebarOpen && (
                    <div
                        className="fixed inset-0 bg-slate-900/40 backdrop-blur-md z-40 lg:hidden animate-in fade-in duration-300"
                        onClick={() => setSidebarOpen(false)}
                    />
                )}

                {/* Main Content */}
                <main className="flex-1 min-w-0 min-h-screen relative lg:p-8 p-4 overflow-x-hidden">
                    <div className="max-w-[1600px] mx-auto animate-in slide-in-from-bottom-2 duration-500 delay-100">
                        {children}
                    </div>
                </main>
            </div>

            <SupplierChatSupport />
            {supplierId && <ChatCallManager userId={supplierId} userName={supplierName} />}
        </div>
    )
}
