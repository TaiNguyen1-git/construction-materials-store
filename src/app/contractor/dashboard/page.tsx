'use client'

/**
 * Contractor Dashboard
 * Main dashboard for verified contractors with Financial Insights
 */

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import Sidebar from '../components/Sidebar'
import SuggestedProjectsWidget from '../components/SuggestedProjectsWidget'
import NotificationPrefsWidget from '../components/NotificationPrefsWidget'
import WorkerReportWidget from '../components/WorkerReportWidget'
import FinancialDashboard from '@/components/contractor/FinancialDashboard'
import {
    Building2,
    Bell,
    Search,
    User,
    Menu,
    LogOut
} from 'lucide-react'

export default function ContractorDashboardPage() {
    const [sidebarOpen, setSidebarOpen] = useState(false)
    const [user, setUser] = useState<any>(null)
    const router = useRouter()

    useEffect(() => {
        const userData = localStorage.getItem('user')
        if (userData) {
            setUser(JSON.parse(userData))
        } else {
            router.push('/login')
        }
    }, [router])

    const handleLogout = () => {
        localStorage.clear()
        router.push('/login')
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Top Navigation */}
            <nav className="fixed top-0 left-0 right-0 z-30 bg-white border-b border-gray-200 shadow-sm">
                <div className="px-4 lg:px-6 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => setSidebarOpen(true)}
                                className="lg:hidden p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
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
                                    className="w-full bg-gray-50 border border-gray-200 rounded-lg pl-10 pr-4 py-2.5 text-gray-900 placeholder-gray-400"
                                />
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <button className="relative p-2 text-gray-500 hover:bg-gray-100 rounded-lg">
                                <Bell className="w-6 h-6" />
                                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
                            </button>
                            <div className="hidden sm:flex items-center gap-2 text-gray-700 px-3 py-2 bg-gray-50 rounded-lg">
                                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                                    <User className="w-4 h-4 text-blue-600" />
                                </div>
                                <span className="font-medium">{user?.name || 'Đối tác'}</span>
                            </div>
                            <button
                                onClick={handleLogout}
                                className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            >
                                <LogOut className="w-6 h-6" />
                            </button>
                        </div>
                    </div>
                </div>
            </nav>

            <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

            {/* Main Content */}
            <main className="lg:ml-64 pt-[73px]">
                <div className="p-6 lg:p-8 max-w-7xl mx-auto">
                    {/* Welcome Banner */}
                    <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-3xl p-8 mb-8 text-white relative overflow-hidden">
                        <div className="relative z-10">
                            <h1 className="text-3xl font-bold mb-2 text-white">
                                Chào mừng quay trở lại{user?.name ? `, ${user.name.split(' ').pop()}` : ''}! 👋
                            </h1>
                            <p className="text-blue-100 max-w-md">
                                Hệ thống đã tự động cập nhật dòng tiền và các dự án mới phù hợp với chuyên môn của bạn.
                            </p>
                        </div>
                        {/* Background Decor */}
                        <div className="absolute top-0 right-0 p-8 opacity-20">
                            <Building2 className="w-32 h-32" />
                        </div>
                    </div>

                    {/* Financial Dashboard (AI-Powered) */}
                    <div className="mb-8">
                        <FinancialDashboard />
                    </div>

                    {/* Preferences, Suggestions and Worker Reports */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8">
                        <WorkerReportWidget />
                        <NotificationPrefsWidget />
                        <SuggestedProjectsWidget />
                    </div>
                </div>
            </main>
        </div>
    )
}
