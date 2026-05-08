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
}

export default function SupplierHeader({ 
    sidebarOpen, 
    setSidebarOpen, 
    supplierName,
    unreadCount 
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
        localStorage.removeItem('supplier_token')
        localStorage.removeItem('supplier_id')
        localStorage.removeItem('supplier_name')
        document.cookie = 'supplier_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT'
        router.push('/supplier/login')
    }

    return (
        <nav className="sticky top-0 z-40 w-full bg-white/80 backdrop-blur-xl border-b border-indigo-50/60 shadow-sm px-4 py-2.5">
            <div className="flex items-center justify-between gap-4">
                {/* Left: Toggle & Brand */}
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => setSidebarOpen(!sidebarOpen)}
                        className="p-2 text-slate-500 hover:bg-slate-50 hover:text-indigo-600 rounded-xl transition-all"
                    >
                        <Menu className="w-5 h-5" />
                    </button>
                    <Link href="/supplier/dashboard" className="hidden sm:flex items-center gap-3 group">
                        <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-lg flex items-center justify-center shadow-lg shadow-blue-500/20 group-hover:scale-105 transition-transform">
                            <Building2 className="w-4 h-4 text-white" />
                        </div>
                        <div className="flex flex-col">
                            <span className="font-bold text-slate-900 text-sm tracking-tight leading-none">SmartBuild</span>
                            <span className="text-[9px] font-bold text-indigo-500 uppercase tracking-widest mt-0.5 opacity-80">
                                Supplier Hub
                            </span>
                        </div>
                    </Link>
                </div>

                {/* Middle: Search */}
                <div className="hidden md:flex flex-1 max-w-md relative">
                    <div className="relative w-full group">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Tìm kiếm đơn hàng, sản phẩm..."
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2 text-sm text-slate-900 placeholder-slate-400 outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-600 focus:bg-white transition-all shadow-sm"
                        />
                    </div>
                </div>

                {/* Right: Actions */}
                <div className="flex items-center gap-1.5">
                    <Link 
                        href="/supplier/notifications"
                        className="p-2.5 text-slate-500 hover:bg-slate-50 hover:text-indigo-600 rounded-xl transition-all relative"
                    >
                        <Bell className="w-5 h-5" />
                        {unreadCount > 0 && (
                            <span className="absolute top-2 right-2 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center border-2 border-white">
                                {unreadCount}
                            </span>
                        )}
                    </Link>

                    <div className="h-6 w-px bg-slate-200 mx-1 hidden sm:block" />

                    {/* Profile Dropdown */}
                    <div className="relative" ref={dropdownRef}>
                        <button
                            onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                            className="flex items-center gap-2.5 pl-1.5 pr-3 py-1.5 bg-white hover:bg-slate-50 border border-slate-100 hover:border-indigo-100 rounded-full transition-all group"
                        >
                            <div className="w-7 h-7 bg-indigo-50 rounded-full flex items-center justify-center border border-indigo-100">
                                <User className="w-4 h-4 text-indigo-600" />
                            </div>
                            <span className="hidden sm:inline font-bold text-xs text-slate-700 max-w-[120px] truncate group-hover:text-indigo-700 transition-colors">
                                {supplierName || 'Nhà cung cấp'}
                            </span>
                            <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${profileDropdownOpen ? 'rotate-180' : ''}`} />
                        </button>

                        {profileDropdownOpen && (
                            <div className="absolute right-0 mt-3 w-64 bg-white rounded-2xl shadow-2xl border border-indigo-50/60 py-2 z-50 animate-in fade-in zoom-in-95 duration-200">
                                <div className="px-5 py-4 border-b border-slate-50 mb-1">
                                    <p className="text-sm font-black text-slate-900 truncate">{supplierName || 'Nhà cung cấp'}</p>
                                    <p className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest mt-1 opacity-70">Quản trị viên</p>
                                </div>

                                <div className="p-2 space-y-1">
                                    <Link
                                        href="/supplier/profile"
                                        onClick={() => setProfileDropdownOpen(false)}
                                        className="flex items-center gap-3 px-3 py-2.5 text-[13px] font-semibold text-slate-600 hover:bg-indigo-50 hover:text-indigo-700 rounded-xl transition-all"
                                    >
                                        <Building2 className="w-4 h-4 text-slate-400" />
                                        Thông tin NCC
                                    </Link>
                                    <Link
                                        href="/supplier/documents"
                                        onClick={() => setProfileDropdownOpen(false)}
                                        className="flex items-center gap-3 px-3 py-2.5 text-[13px] font-semibold text-slate-600 hover:bg-indigo-50 hover:text-indigo-700 rounded-xl transition-all"
                                    >
                                        <ShieldCheck className="w-4 h-4 text-slate-400" />
                                        Hồ sơ pháp lý
                                    </Link>
                                    <Link
                                        href="/supplier/change-password"
                                        onClick={() => setProfileDropdownOpen(false)}
                                        className="flex items-center gap-3 px-3 py-2.5 text-[13px] font-semibold text-slate-600 hover:bg-indigo-50 hover:text-indigo-700 rounded-xl transition-all"
                                    >
                                        <KeyRound className="w-4 h-4 text-slate-400" />
                                        Đổi mật khẩu
                                    </Link>
                                    <Link
                                        href="/supplier/support"
                                        onClick={() => setProfileDropdownOpen(false)}
                                        className="flex items-center gap-3 px-3 py-2.5 text-[13px] font-semibold text-slate-600 hover:bg-indigo-50 hover:text-indigo-700 rounded-xl transition-all"
                                    >
                                        <LifeBuoy className="w-4 h-4 text-slate-400" />
                                        Hỗ trợ trực tuyến
                                    </Link>
                                </div>

                                <div className="border-t border-slate-50 mt-1 p-2">
                                    <button
                                        onClick={handleLogout}
                                        className="flex items-center gap-3 w-full px-3 py-2.5 text-[13px] font-bold text-red-500 hover:bg-red-50 rounded-xl transition-all"
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
