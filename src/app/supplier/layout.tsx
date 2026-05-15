'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import SupplierChatSupport from '@/components/supplier/SupplierChatSupport'
import ProfileHealthModal from '@/components/supplier/ProfileHealthModal'
import ChatCallManager from '@/components/ChatCallManager'
import SupplierHeader from './components/SupplierHeader'
import {
    Building2,
    LayoutDashboard,
    Package,
    FileText,
    Wallet,
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
    ChevronDown,
    TrendingDown,
    PanelLeftClose,
    PanelLeftOpen,
    ArrowRight
} from 'lucide-react'

interface MenuItem {
    name: string
    href: string
    icon: React.ComponentType<any>
    count?: number
}

interface MenuGroup {
    group: string
    items: MenuItem[]
}

export default function SupplierLayout({ children }: { children: React.ReactNode }) {
    const router = useRouter()
    const pathname = usePathname()
    const [supplierName, setSupplierName] = useState('')
    const [supplierId, setSupplierId] = useState<string | null>(null)
    const [sidebarOpen, setSidebarOpen] = useState(true)
    const [isCollapsed, setIsCollapsed] = useState(false)
    const [unreadCount, setUnreadCount] = useState(0)
    const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({})

    const toggleGroup = (groupName: string) => {
        setCollapsedGroups(prev => ({
            ...prev,
            [groupName]: !prev[groupName]
        }))
    }

    const isPublicPage = pathname === '/supplier' ||
        pathname === '/supplier/login' ||
        pathname?.startsWith('/supplier/register') ||
        pathname === '/supplier/change-password'

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
        // Clear all possible tokens and identifiers
        localStorage.removeItem('supplier_token')
        localStorage.removeItem('supplier_id')
        localStorage.removeItem('supplier_name')
        localStorage.removeItem('auth_active')
        localStorage.removeItem('user_hint')
        
        // Clear cookies with all possible variations
        const cookies = ['supplier_token', 'auth_token', 'admin_token', 'contractor_token', 'refresh_token']
        cookies.forEach(name => {
            document.cookie = `${name}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax`
            document.cookie = `${name}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`
        })

        // Force a full page reload to the login page to clear all memory states
        window.location.href = '/supplier/login'
    }

    if (isPublicPage) {
        return <>{children}</>
    }

    const menuItems: MenuGroup[] = [
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
                { name: 'Sản phẩm & Ưu đãi', href: '/supplier/products', icon: Package },
                { name: 'Thị trường & Đấu thầu', href: '/supplier/opportunities', icon: TrendingDown },
                { name: 'Quản lý Đơn hàng', href: '/supplier/orders', icon: FileText },
            ]
        },
        {
            group: 'Tài chính',
            items: [
                { name: 'Hóa đơn', href: '/supplier/invoices', icon: FileText },
                { name: 'Công nợ', href: '/supplier/payments', icon: Wallet },
            ]
        }
    ]

    return (
        <div className="flex h-screen bg-[#F0F4F8] text-slate-900 font-sans overflow-hidden selection:bg-indigo-100 selection:text-indigo-700">
            {/* Ambient Background Glows */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
                <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-100/30 rounded-full blur-[120px] animate-pulse"></div>
                <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-100/30 rounded-full blur-[120px] animate-pulse delay-1000"></div>
            </div>

            <aside className={`
                hidden lg:flex flex-col
                transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)]
                ${sidebarOpen ? (isCollapsed ? 'w-24 px-2' : 'w-72 px-4') : 'w-0 overflow-hidden px-0'}
            `}>
                <div className="flex-1 flex flex-col min-h-0 border-r border-indigo-100/60 bg-white/80 backdrop-blur-2xl shadow-[0_20px_50px_rgba(0,0,0,0.04)] my-4 rounded-[32px] overflow-hidden">
                    <div className="flex-1 flex flex-col pt-8 pb-4 overflow-y-auto overflow-x-hidden custom-scrollbar">
                        {/* Logo Section */}
                        <div className={`flex items-center flex-shrink-0 px-6 mb-10 transition-all duration-500 ${isCollapsed ? 'justify-center px-0' : ''}`}>
                            <div className="relative group cursor-pointer" onClick={() => router.push('/supplier/dashboard')}>
                                <div className="absolute -inset-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl blur opacity-20 group-hover:opacity-40 transition duration-1000"></div>
                                <div className="relative p-2.5 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-xl shadow-xl shadow-blue-500/20 transform group-hover:scale-105 transition-transform">
                                    <Building2 className="h-5 w-5 text-white" />
                                </div>
                            </div>
                            {!isCollapsed && (
                                <div className="ml-4 min-w-0 flex flex-col">
                                    <h1 className="text-xl font-black text-slate-900 tracking-tighter leading-none mb-1">SmartBuild</h1>
                                    <span className="text-[9px] text-indigo-500 font-black uppercase tracking-widest opacity-70">Supplier Hub</span>
                                </div>
                            )}
                        </div>

                        <nav className="flex-1 space-y-8">
                            {menuItems.map((group) => {
                                const isGroupCollapsed = collapsedGroups[group.group]
                                return (
                                    <div key={group.group} className="space-y-1">
                                        {!isCollapsed && (
                                            <button
                                                onClick={() => toggleGroup(group.group)}
                                                className="w-full flex items-center justify-between px-6 py-1 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] hover:text-indigo-600 transition-colors group/header"
                                            >
                                                <span>{group.group}</span>
                                                <div className={`transition-transform duration-300 ${isGroupCollapsed ? '-rotate-90' : ''}`}>
                                                    <ChevronDown className="h-3.5 w-3.5 opacity-50" />
                                                </div>
                                            </button>
                                        )}
                                        {isCollapsed && <div className="h-px bg-slate-100 mx-4 my-6 opacity-60" />}

                                        <div className={`space-y-1 transition-all duration-300 overflow-hidden ${isGroupCollapsed && !isCollapsed ? 'max-h-0 opacity-0' : 'max-h-[500px] opacity-100'}`}>
                                            {group.items.map((item) => {
                                                const isActive = pathname === item.href
                                                return (
                                                    <Link
                                                        key={item.href}
                                                        href={item.href}
                                                        className={`
                                                            group relative flex items-center ${isCollapsed ? 'justify-center px-0 mx-auto w-12 h-12' : 'px-4 mx-2'} py-3 rounded-2xl transition-all duration-300
                                                            ${isActive
                                                                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20 ring-1 ring-indigo-600/10'
                                                                : 'text-slate-600 hover:bg-slate-50 hover:text-indigo-600'
                                                            }
                                                        `}
                                                        title={isCollapsed ? item.name : ''}
                                                    >
                                                        <item.icon
                                                            strokeWidth={isActive ? 2.5 : 2}
                                                            className={`flex-shrink-0 h-5 w-5 transition-all duration-300 group-hover:scale-110 ${!isCollapsed && 'mr-3'} ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-indigo-500'}`}
                                                        />
                                                        {!isCollapsed && <span className="truncate font-bold text-sm tracking-tight">{item.name}</span>}
                                                        {item.count !== undefined && item.count > 0 && (
                                                            <span className={`
                                                                ${isCollapsed ? 'absolute -top-1 -right-1 min-w-[16px] h-[16px]' : 'ml-auto px-1.5 py-0.5'}
                                                                flex items-center justify-center text-[9px] font-black rounded-full shadow-sm
                                                                ${isActive ? 'bg-white/20 text-white backdrop-blur-sm' : 'bg-red-500 text-white'}
                                                            `}>
                                                                {item.count}
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
                                )
                            })}
                        </nav>
                    </div>

                    {/* Sidebar Footer */}
                    <div className="p-4 border-t border-slate-100/60 bg-slate-50/50 space-y-2">
                        <button
                            onClick={handleLogout}
                            className={`
                                w-full flex items-center h-11 rounded-xl transition-all group
                                ${isCollapsed ? 'justify-center bg-rose-50 text-rose-500 hover:bg-rose-100' : 'px-4 bg-white border border-slate-100 text-slate-500 hover:text-rose-600 hover:border-rose-100 hover:bg-rose-50/50'}
                            `}
                        >
                            <LogOut className={`h-5 w-5 ${isCollapsed ? '' : 'mr-3'} transition-transform group-hover:-translate-x-1`} />
                            {!isCollapsed && <span className="text-[10px] font-black uppercase tracking-widest">Đăng xuất</span>}
                        </button>

                        <button
                            onClick={() => setIsCollapsed(!isCollapsed)}
                            className="w-full flex items-center justify-center h-10 rounded-xl bg-white border border-slate-100 text-slate-400 hover:text-indigo-600 hover:border-indigo-100 hover:shadow-sm transition-all group"
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

            {/* Mobile Sidebar Overlay */}
            {sidebarOpen && (
                <div 
                    className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[60] lg:hidden animate-in fade-in duration-300"
                    onClick={() => setSidebarOpen(false)}
                />
            )}
            
            {/* Mobile Sidebar */}
            <aside className={`
                fixed top-0 left-0 bottom-0 w-72 bg-white z-[70] lg:hidden
                transform transition-transform duration-300 ease-out
                ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
            `}>
                <div className="flex flex-col h-full">
                    <div className="p-6 flex items-center justify-between border-b border-slate-50">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
                                <Building2 className="w-5 h-5 text-white" />
                            </div>
                            <span className="font-bold text-slate-900">SmartBuild</span>
                        </div>
                        <button onClick={() => setSidebarOpen(false)} className="p-2 text-slate-400 hover:bg-slate-50 rounded-xl">
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                    <nav className="flex-1 p-4 space-y-6 overflow-y-auto">
                        {menuItems.map((group) => (
                            <div key={group.group} className="space-y-1">
                                <h3 className="px-4 py-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">{group.group}</h3>
                                {group.items.map((item) => (
                                    <Link
                                        key={item.href}
                                        href={item.href}
                                        onClick={() => setSidebarOpen(false)}
                                        className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${pathname === item.href ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30' : 'text-slate-600 hover:bg-slate-50'}`}
                                    >
                                        <item.icon className="w-5 h-5" />
                                        {item.name}
                                    </Link>
                                ))}
                            </div>
                        ))}
                    </nav>
                </div>
            </aside>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col h-full overflow-hidden relative z-10">
                <SupplierHeader 
                    sidebarOpen={sidebarOpen}
                    setSidebarOpen={setSidebarOpen}
                    supplierName={supplierName}
                    unreadCount={unreadCount}
                    isCollapsed={isCollapsed}
                />

                <main className="flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar">
                    <div className="p-4 lg:p-10 animate-in fade-in slide-in-from-bottom-2 duration-500">
                        <div className="max-w-[1600px] mx-auto">
                            {children}
                        </div>
                    </div>
                </main>
            </div>

            <ProfileHealthModal />
            <SupplierChatSupport />
            {supplierId && <ChatCallManager userId={supplierId} userName={supplierName} />}
        </div>
    )
}
