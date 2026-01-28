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
    Package
} from 'lucide-react'
import NotificationBell from '@/components/NotificationBell'
import MessagingDropdown from '@/components/MessagingDropdown'

interface ContractorHeaderProps {
    sidebarOpen: boolean
    setSidebarOpen: (open: boolean) => void
    user: any
}

export default function ContractorHeader({ sidebarOpen, setSidebarOpen, user }: ContractorHeaderProps) {
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
                    const token = localStorage.getItem('access_token')
                    const userStr = localStorage.getItem('user')
                    const userId = userStr ? JSON.parse(userStr).id : ''

                    const res = await fetch(`/api/contractors/search?q=${encodeURIComponent(searchQuery)}`, {
                        headers: {
                            'Authorization': `Bearer ${token}`,
                            'x-user-id': userId
                        }
                    })
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

    const handleLogout = () => {
        localStorage.removeItem('access_token')
        localStorage.removeItem('user')
        window.location.href = '/contractor'
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
        <nav className="fixed top-0 left-0 right-0 z-30 bg-white/95 backdrop-blur-sm border-b border-gray-100 shadow-sm">
            <div className="px-4 py-3">
                <div className="flex items-center justify-between gap-4 h-10">
                    {/* Left: Logo & Sidebar Toggle */}
                    <div className="flex items-center gap-3 flex-shrink-0">
                        <button
                            onClick={() => setSidebarOpen(!sidebarOpen)}
                            className="p-1.5 text-gray-500 hover:bg-gray-50 hover:text-primary-600 rounded-lg transition-colors border border-transparent hover:border-gray-100 md:hidden"
                        >
                            <Menu className="w-5 h-5" />
                        </button>
                        <Link href="/contractor/dashboard" className="flex items-center gap-2.5">
                            <div className="w-9 h-9 bg-gradient-to-br from-primary-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-primary-100">
                                <Building2 className="w-5 h-5 text-white" />
                            </div>
                            <div className="hidden sm:block">
                                <span className="text-lg font-black text-gray-900 leading-none block">SmartBuild</span>
                                <span className="text-[10px] font-black text-primary-600 uppercase tracking-widest leading-none block">PRO CONTRACTOR</span>
                            </div>
                        </Link>
                    </div>

                    {/* Middle: Enhanced Live Search */}
                    <div className="hidden md:flex flex-1 max-w-lg mx-auto relative" ref={searchRef}>
                        <div className="relative w-full group z-50">
                            <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors ${searchFocused ? 'text-primary-600' : 'text-gray-400'}`} />
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
                                className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-9 pr-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 outline-none focus:ring-2 focus:ring-primary-100 focus:border-primary-500 focus:bg-white transition-all shadow-sm"
                            />
                            {/* Spinner */}
                            {searchLoading && (
                                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                    <div className="w-4 h-4 border-2 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
                                </div>
                            )}
                        </div>

                        {/* Search Dropdown Results */}
                        {searchFocused && searchQuery.length >= 2 && searchResults && (
                            <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                                <div className="max-h-[60vh] overflow-y-auto py-2">
                                    {(!searchResults.projects.length && !searchResults.orders.length && !searchResults.products.length) && (
                                        <div className="p-8 text-center text-gray-500 text-xs">
                                            Không tìm thấy kết quả nào cho <span className="font-bold text-gray-900">"{searchQuery}"</span>
                                        </div>
                                    )}

                                    {/* Projects */}
                                    {searchResults.projects.length > 0 && (
                                        <div className="mb-2">
                                            <h3 className="px-4 py-2 text-[10px] font-bold text-gray-400 uppercase tracking-wider bg-gray-50/50">Dự án Marketplace</h3>
                                            {searchResults.projects.map((item: any) => (
                                                <div key={item.id} className="px-2 pt-1">
                                                    <SearchResultItem item={item} icon={Building2} />
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {/* Orders */}
                                    {searchResults.orders.length > 0 && (
                                        <div className="mb-2">
                                            <h3 className="px-4 py-2 text-[10px] font-bold text-gray-400 uppercase tracking-wider bg-gray-50/50 border-t border-gray-100">Đơn hàng của tôi</h3>
                                            {searchResults.orders.map((item: any) => (
                                                <div key={item.id} className="px-2 pt-1">
                                                    <SearchResultItem item={item} icon={ShoppingBag} />
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {/* Products */}
                                    {searchResults.products.length > 0 && (
                                        <div className="mb-2">
                                            <h3 className="px-4 py-2 text-[10px] font-bold text-gray-400 uppercase tracking-wider bg-gray-50/50 border-t border-gray-100">Vật tư</h3>
                                            {searchResults.products.map((item: any) => (
                                                <div key={item.id} className="px-2 pt-1">
                                                    <SearchResultItem item={item} icon={Package} />
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                                <div className="bg-gray-50 px-4 py-3 text-center border-t border-gray-100">
                                    <button
                                        onClick={() => {
                                            router.push(`/projects?search=${encodeURIComponent(searchQuery)}`)
                                            setSearchFocused(false)
                                        }}
                                        className="text-xs font-bold text-primary-600 hover:text-primary-700 w-full flex items-center justify-center gap-1"
                                    >
                                        <Search className="w-3 h-3" />
                                        Xem tất cả kết quả
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Right: Actions */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                        <MessagingDropdown />
                        <NotificationBell />

                        <div className="h-6 w-[1px] bg-gray-100 mx-2 hidden sm:block" />

                        {/* Profile Dropdown */}
                        <div className="relative" ref={dropdownRef}>
                            <button
                                onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                                className="hidden sm:flex items-center gap-2.5 pl-1 pr-3 py-1 bg-white hover:bg-gray-50 border border-gray-100 hover:border-gray-200 rounded-full transition-all group"
                            >
                                <div className="w-7 h-7 bg-primary-50 rounded-full flex items-center justify-center ring-2 ring-white">
                                    <User className="w-4 h-4 text-primary-600" />
                                </div>
                                <span className="font-bold text-xs text-gray-700 max-w-[100px] truncate group-hover:text-primary-700 transition-colors">{user?.name || 'Đối tác'}</span>
                                <ChevronDown className={`w-3.5 h-3.5 text-gray-400 transition-transform duration-200 ${profileDropdownOpen ? 'rotate-180' : ''}`} />
                            </button>

                            {/* Dropdown Menu - Standardized */}
                            {profileDropdownOpen && (
                                <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-2xl border border-gray-100 py-2 z-50 animate-in fade-in zoom-in-95 duration-200">
                                    <div className="px-5 py-3 border-b border-gray-50 bg-gray-50/50">
                                        <p className="text-sm font-black text-gray-900 truncate">{user?.name || 'Đối tác'}</p>
                                        <p className="text-[11px] font-medium text-gray-500 truncate mt-0.5">{user?.email || ''}</p>
                                    </div>

                                    <div className="p-2 space-y-1">
                                        <Link
                                            href="/contractor/profile"
                                            onClick={() => setProfileDropdownOpen(false)}
                                            className="flex items-center gap-3 px-3 py-2 text-xs font-bold text-gray-700 hover:bg-primary-50 hover:text-primary-700 rounded-lg transition-colors"
                                        >
                                            <Settings className="w-4 h-4" />
                                            Hồ sơ doanh nghiệp
                                        </Link>
                                        <Link
                                            href="/contractor/change-password"
                                            onClick={() => setProfileDropdownOpen(false)}
                                            className="flex items-center gap-3 px-3 py-2 text-xs font-bold text-gray-700 hover:bg-primary-50 hover:text-primary-700 rounded-lg transition-colors"
                                        >
                                            <KeyRound className="w-4 h-4" />
                                            Đổi mật khẩu
                                        </Link>
                                    </div>

                                    <div className="border-t border-gray-100 mt-1 p-2">
                                        <button
                                            onClick={handleLogout}
                                            className="flex items-center gap-3 w-full px-3 py-2 text-xs font-bold text-red-600 hover:bg-red-50 to-red-600 rounded-lg transition-colors"
                                        >
                                            <LogOut className="w-4 h-4" />
                                            Đăng xuất
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Mobile Logout (Visible only on small screens) */}
                        <button
                            onClick={handleLogout}
                            className="sm:hidden p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                            <LogOut className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </div>
        </nav>
    )
}
