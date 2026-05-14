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
    ShoppingBag,
    Package,
    LifeBuoy
} from 'lucide-react'
import NotificationBell from '@/components/NotificationBell'
import MessagingDropdown from '@/components/MessagingDropdown'
import { useAuth } from '@/contexts/auth-context'

interface ContractorHeaderProps {
    sidebarOpen: boolean
    setSidebarOpen: (open: boolean) => void
    isCollapsed: boolean
    user?: any
}

export default function ContractorHeader({ sidebarOpen, setSidebarOpen, isCollapsed }: Omit<ContractorHeaderProps, 'user'>) {
    const { user, logout } = useAuth()
    const router = useRouter()
    const [profileDropdownOpen, setProfileDropdownOpen] = useState(false)
    const dropdownRef = useRef<HTMLDivElement>(null)

    // Search Stats
    const [searchQuery, setSearchQuery] = useState('')
    const [searchResults, setSearchResults] = useState<any>(null)
    const [searchLoading, setSearchLoading] = useState(false)
    const [searchFocused, setSearchFocused] = useState(false)
    const searchRef = useRef<HTMLDivElement>(null)

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setProfileDropdownOpen(false)
            }
            if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
                setSearchFocused(false)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    // Debounce Search
    useEffect(() => {
        const timer = setTimeout(async () => {
            if (searchQuery.length >= 2) {
                setSearchLoading(true)
                try {
                    const res = await fetch(`/api/contractors/search?q=${encodeURIComponent(searchQuery)}`)
                    const data = await res.json()
                    if (data.success) {
                        setSearchResults(data.results)
                    }
                } catch (err) {
                    console.error('Search failed', err)
                } finally {
                    setSearchLoading(false)
                }
            } else {
                setSearchResults(null)
            }
        }, 500)

        return () => clearTimeout(timer)
    }, [searchQuery])

    const handleLogout = async () => {
        try {
            await logout()
            document.cookie = 'contractor_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT'
        } catch (error) {
            console.error('Logout failed:', error)
            localStorage.removeItem('access_token')
            localStorage.removeItem('user')
            document.cookie = 'contractor_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT'
            window.location.href = '/login'
        }
    }

    const SearchResultItem = ({ item, icon: Icon }: any) => (
        <Link
            href={item.url}
            onClick={() => { setSearchFocused(false); setSearchQuery('') }}
            className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-xl group transition-colors cursor-pointer"
        >
            <div className="bg-white p-2 border border-gray-100 rounded-lg group-hover:border-primary-200 group-hover:bg-primary-50 transition-colors flex-shrink-0">
                <Icon className="w-4 h-4 text-gray-400 group-hover:text-primary-600" />
            </div>
            <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-gray-900 truncate">{item.title}</p>
                <p className="text-[10px] text-gray-500 truncate mt-0.5">{item.subtitle}</p>
            </div>
        </Link>
    )

    return (
        <nav className="sticky top-0 z-30 bg-white/60 backdrop-blur-xl border-b border-gray-100/60 px-8 flex items-center justify-between gap-8 h-20 flex-shrink-0 transition-all duration-500">
            {/* Left: Mobile Toggle & Brand */}
            <div className={`flex items-center gap-4 flex-shrink-0 ${sidebarOpen ? 'lg:hidden' : 'flex'}`}>
                <button
                    onClick={() => setSidebarOpen(!sidebarOpen)}
                    className="p-2 text-slate-500 hover:bg-slate-50 hover:text-primary-600 rounded-xl transition-all border border-transparent hover:border-gray-100"
                >
                    <Menu className="w-5 h-5" />
                </button>
                <Link href="/contractor/dashboard" className="flex items-center gap-3 group">
                    <div className="w-9 h-9 bg-gradient-to-br from-primary-600 to-indigo-700 rounded-xl flex items-center justify-center shadow-lg shadow-primary-500/20 group-hover:scale-105 transition-transform">
                        <Package className="w-5 h-5 text-white" />
                    </div>
                    <div className="hidden sm:flex flex-col">
                        <span className="font-bold text-slate-900 text-sm tracking-tight leading-none">SmartBuild</span>
                        <span className="text-[9px] font-bold text-primary-500 uppercase tracking-widest mt-0.5 opacity-80">Pro Contractor</span>
                    </div>
                </Link>
            </div>

            {/* Middle: Enhanced Live Search */}
            <div className="hidden md:flex flex-1 max-w-2xl relative" ref={searchRef}>
                <div className="relative w-full group">
                    <Search className={`absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors ${searchFocused ? 'text-primary-600' : 'text-gray-400'}`} />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onFocus={() => setSearchFocused(true)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                                router.push(`/projects?search=${encodeURIComponent(searchQuery)}`)
                                setSearchFocused(false)
                            }
                        }}
                        placeholder="Tìm dự án, đơn hàng, vật tư..."
                        className="w-full bg-slate-100/50 border border-transparent rounded-2xl pl-10 pr-4 py-2.5 text-sm text-gray-900 placeholder-slate-400 outline-none focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 focus:bg-white transition-all"
                    />
                    {searchLoading && (
                        <div className="absolute right-3.5 top-1/2 -translate-y-1/2">
                            <div className="w-3.5 h-3.5 border-2 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
                        </div>
                    )}
                </div>

                {/* Search Dropdown */}
                {searchFocused && searchQuery.length >= 2 && searchResults && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        <div className="max-h-[60vh] overflow-y-auto py-2">
                            {(!searchResults.projects.length && !searchResults.orders.length && !searchResults.products.length) && (
                                <div className="p-8 text-center text-gray-500 text-xs italic">
                                    Không tìm thấy kết quả nào cho "{searchQuery}"
                                </div>
                            )}

                            {searchResults.projects.length > 0 && (
                                <div className="mb-2">
                                    <h3 className="px-5 py-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest bg-gray-50/50">Dự án</h3>
                                    {searchResults.projects.map((item: any) => (
                                        <SearchResultItem key={item.id} item={item} icon={Building2} />
                                    ))}
                                </div>
                            )}

                            {searchResults.orders.length > 0 && (
                                <div className="mb-2 border-t border-gray-50">
                                    <h3 className="px-5 py-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest bg-gray-50/50">Đơn hàng</h3>
                                    {searchResults.orders.map((item: any) => (
                                        <SearchResultItem key={item.id} item={item} icon={ShoppingBag} />
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Right: Actions & Profile */}
            <div className="flex items-center gap-2 flex-shrink-0">
                <div className="flex items-center gap-1.5 p-1 bg-slate-100/50 rounded-2xl border border-slate-200/50">
                    <MessagingDropdown />
                    <div className="w-px h-6 bg-slate-200/60 mx-1"></div>
                    <NotificationBell />
                    
                    <div className="w-px h-6 bg-slate-200/60 mx-1 hidden sm:block"></div>
                    
                    {/* Profile Dropdown */}
                    <div className="relative" ref={dropdownRef}>
                        <button
                            onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                            className="flex items-center gap-3 pl-2 pr-4 py-1.5 rounded-xl hover:bg-white transition-all group"
                        >
                            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-primary-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-primary-500/20 group-hover:scale-105 transition-transform">
                                <User className="h-4 w-4 text-white" />
                            </div>
                            <div className="hidden sm:flex flex-col items-start leading-tight">
                                <span className="text-sm font-black text-slate-700">{user?.name || 'Nhà thầu'}</span>
                                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Tài khoản Pro</span>
                            </div>
                            <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-300 ${profileDropdownOpen ? 'rotate-180' : ''}`} />
                        </button>

                        {profileDropdownOpen && (
                            <div className="absolute right-0 mt-3 w-64 bg-white rounded-2xl shadow-2xl border border-gray-100 py-2 z-50 animate-in fade-in zoom-in-95 duration-200">
                                <div className="px-5 py-4 border-b border-gray-50 mb-1">
                                    <p className="text-sm font-black text-slate-900 truncate">{user?.name || 'Nhà thầu'}</p>
                                    <p className="text-[10px] font-bold text-primary-500 uppercase tracking-widest mt-1">Đối tác chiến lược</p>
                                </div>
                                
                                <div className="p-2 space-y-1">
                                    <Link href="/contractor/profile" className="flex items-center gap-3 px-3 py-2.5 text-[13px] font-semibold text-slate-600 hover:bg-slate-50 hover:text-primary-700 rounded-xl transition-all">
                                        <Settings className="w-4 h-4 text-slate-400" />
                                        Cài đặt tài khoản
                                    </Link>
                                    <Link href="/contractor/change-password" className="flex items-center gap-3 px-3 py-2.5 text-[13px] font-semibold text-slate-600 hover:bg-slate-50 hover:text-primary-700 rounded-xl transition-all">
                                        <KeyRound className="w-4 h-4 text-slate-400" />
                                        Đổi mật khẩu
                                    </Link>
                                    <button
                                        onClick={handleLogout}
                                        className="flex items-center gap-3 w-full px-3 py-2.5 text-[13px] font-bold text-red-500 hover:bg-red-50 rounded-xl transition-all mt-1 pt-3 border-t border-gray-50"
                                    >
                                        <LogOut className="w-4 h-4" />
                                        Đăng xuất
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
