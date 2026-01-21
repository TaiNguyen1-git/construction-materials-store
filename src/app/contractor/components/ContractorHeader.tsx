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
    Settings
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

    // Close dropdown when clicking outside
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
        localStorage.removeItem('access_token')
        localStorage.removeItem('user')
        window.location.href = '/contractor'
    }

    return (
        <nav className="fixed top-0 left-0 right-0 z-30 bg-white border-b border-gray-200 shadow-sm">
            <div className="px-4 lg:px-6 py-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => setSidebarOpen(!sidebarOpen)}
                            className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
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

                    <div className="hidden md:flex flex-1 max-w-md mx-8">
                        <div className="relative w-full">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Tìm kiếm sản phẩm, dự án..."
                                className="w-full bg-gray-50 border border-gray-200 rounded-lg pl-10 pr-4 py-2.5 text-gray-900 placeholder-gray-400 outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300 transition-all"
                            />
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <MessagingDropdown />
                        <NotificationBell />
                        <div className="h-6 w-[1px] bg-gray-200 mx-2" />

                        {/* Profile Dropdown */}
                        <div className="relative" ref={dropdownRef}>
                            <button
                                onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                                className="hidden sm:flex items-center gap-2 text-gray-700 px-3 py-2 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                                    <User className="w-4 h-4 text-blue-600" />
                                </div>
                                <span className="font-medium text-sm max-w-[120px] truncate">{user?.name || 'Đối tác'}</span>
                                <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${profileDropdownOpen ? 'rotate-180' : ''}`} />
                            </button>

                            {/* Dropdown Menu */}
                            {profileDropdownOpen && (
                                <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-gray-100 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                                    <div className="px-4 py-3 border-b border-gray-100">
                                        <p className="text-sm font-bold text-gray-900 truncate">{user?.name || 'Đối tác'}</p>
                                        <p className="text-xs text-gray-500 truncate">{user?.email || ''}</p>
                                    </div>

                                    <div className="py-1">
                                        <Link
                                            href="/contractor/profile"
                                            onClick={() => setProfileDropdownOpen(false)}
                                            className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                                        >
                                            <Settings className="w-4 h-4 text-gray-400" />
                                            Hồ sơ doanh nghiệp
                                        </Link>
                                        <Link
                                            href="/contractor/change-password"
                                            onClick={() => setProfileDropdownOpen(false)}
                                            className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                                        >
                                            <KeyRound className="w-4 h-4 text-gray-400" />
                                            Đổi mật khẩu
                                        </Link>
                                    </div>

                                    <div className="border-t border-gray-100 pt-1">
                                        <button
                                            onClick={handleLogout}
                                            className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                                        >
                                            <LogOut className="w-4 h-4" />
                                            Đăng xuất
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Mobile Logout */}
                        <button
                            onClick={handleLogout}
                            className="sm:hidden p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                            <LogOut className="w-6 h-6" />
                        </button>
                    </div>
                </div>
            </div>
        </nav>
    )
}
