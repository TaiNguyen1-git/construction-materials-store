'use client'

import React, { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
    Menu,
    Building2,
    Search,
    User,
    LogOut,
    ChevronDown,
    KeyRound,
    Settings,
    ShieldCheck,
    Bell,
    LifeBuoy,
    MessageSquare
} from 'lucide-react'

interface SupplierHeaderProps {
    sidebarOpen: boolean
    setSidebarOpen: (open: boolean) => void
    supplierName: string
    unreadCount: number
    isCollapsed: boolean
}

export default function SupplierHeader({ 
    sidebarOpen, 
    setSidebarOpen, 
    supplierName,
    unreadCount,
    isCollapsed
}: SupplierHeaderProps) {
    const router = useRouter()
    const [profileDropdownOpen, setProfileDropdownOpen] = useState(false)
    const dropdownRef = useRef<HTMLDivElement>(null)
    const [searchQuery, setSearchQuery] = useState('')

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setProfileDropdownOpen(false)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

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

    return (
        <nav className="sticky top-0 z-40 bg-white/60 backdrop-blur-xl border-b border-indigo-50/60 px-8 flex items-center justify-between gap-8 h-20 flex-shrink-0 transition-all duration-500">
            {/* Left: Mobile Toggle & Brand */}
            <div className={`flex items-center gap-4 flex-shrink-0 ${sidebarOpen ? 'lg:hidden' : 'flex'}`}>
                <button
                    onClick={() => setSidebarOpen(!sidebarOpen)}
                    className="p-2 text-slate-500 hover:bg-slate-50 hover:text-indigo-600 rounded-xl transition-all border border-transparent hover:border-indigo-100"
                >
                    <Menu className="w-5 h-5" />
                </button>
                <Link href="/supplier/dashboard" className="flex items-center gap-3 group">
                    <div className="w-9 h-9 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20 group-hover:scale-105 transition-transform">
                        <Building2 className="w-5 h-5 text-white" />
                    </div>
                    <div className="hidden sm:flex flex-col">
                        <span className="font-bold text-slate-900 text-sm tracking-tight leading-none">SmartBuild</span>
                        <span className="text-[9px] font-bold text-indigo-500 uppercase tracking-widest mt-0.5 opacity-80">Supplier Hub</span>
                    </div>
                </Link>
            </div>

            {/* Middle: Global Search (Expands) */}
            <div className="hidden md:flex flex-1 max-w-2xl relative group">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <Search className="h-4 w-4 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
                </div>
                <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Tìm kiếm đơn hàng, sản phẩm..."
                    className="w-full bg-slate-100/50 border border-transparent rounded-2xl pl-10 pr-4 py-2.5 text-sm text-gray-900 placeholder-slate-400 outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-600 focus:bg-white transition-all"
                />
            </div>

            {/* Right: Actions & Profile */}
            <div className="flex items-center gap-3 flex-shrink-0">
                <div className="flex items-center gap-1.5 p-1 bg-slate-100/50 rounded-2xl border border-slate-200/50">
                    <Link 
                        href="/supplier/notifications"
                        className="p-2 text-slate-500 hover:bg-white hover:text-indigo-600 rounded-xl transition-all relative"
                    >
                        <Bell className="w-5 h-5" />
                        {unreadCount > 0 && (
                            <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center border-2 border-white">
                                {unreadCount}
                            </span>
                        )}
                    </Link>

                    <div className="w-px h-6 bg-slate-200/60 mx-1 hidden sm:block"></div>

                    {/* Profile Dropdown */}
                    <div className="relative" ref={dropdownRef}>
                        <button
                            onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                            className="flex items-center gap-3 pl-2 pr-4 py-1.5 rounded-xl hover:bg-white transition-all group"
                        >
                            <div className="w-8 h-8 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center group-hover:scale-105 transition-transform">
                                <User className="w-4 h-4 text-indigo-600" />
                            </div>
                            <span className="hidden sm:inline font-bold text-xs text-slate-700 max-w-[120px] truncate group-hover:text-indigo-700 transition-colors">
                                {supplierName || 'Nhà cung cấp'}
                            </span>
                            <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-300 ${profileDropdownOpen ? 'rotate-180' : ''}`} />
                        </button>

                        {profileDropdownOpen && (
                            <div className="absolute right-0 mt-3 w-64 bg-white rounded-2xl shadow-2xl border border-indigo-50/60 py-2 z-50 animate-in fade-in zoom-in-95 duration-200">
                                <div className="px-5 py-4 border-b border-slate-50 mb-1">
                                    <p className="text-sm font-black text-slate-900 truncate">{supplierName || 'Nhà cung cấp'}</p>
                                    <p className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest mt-1 opacity-70">Quản trị viên</p>
                                </div>

                                <div className="p-2 space-y-1">
                                    <Link href="/supplier/profile" className="flex items-center gap-3 px-3 py-2.5 text-[13px] font-semibold text-slate-600 hover:bg-indigo-50 hover:text-indigo-700 rounded-xl transition-all">
                                        <Building2 className="w-4 h-4 text-slate-400" />
                                        Thông tin NCC
                                    </Link>
                                    <Link href="/supplier/documents" className="flex items-center gap-3 px-3 py-2.5 text-[13px] font-semibold text-slate-600 hover:bg-indigo-50 hover:text-indigo-700 rounded-xl transition-all">
                                        <ShieldCheck className="w-4 h-4 text-slate-400" />
                                        Hồ sơ pháp lý
                                    </Link>
                                    <button
                                        onClick={handleLogout}
                                        className="flex items-center gap-3 w-full px-3 py-2.5 text-[13px] font-bold text-red-500 hover:bg-red-50 rounded-xl transition-all mt-1 pt-3 border-t border-slate-50"
                                    >
                                        <LogOut className="w-4 h-4" />
                                        Đăng xuất tài khoản
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </nav>
    )
}
