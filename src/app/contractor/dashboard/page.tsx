'use client'

/**
 * Contractor Dashboard
 * Main dashboard for verified contractors with Financial Insights
 */

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import Sidebar from '../components/Sidebar'
import ContractorHeader from '../components/ContractorHeader'
import SuggestedProjectsWidget from '../components/SuggestedProjectsWidget'
import NotificationPrefsWidget from '../components/NotificationPrefsWidget'
import FinancialDashboard from '@/components/contractor/FinancialDashboard'
import ContractorOnboardingBanner from '@/components/ContractorOnboardingBanner'
import StatsOverview from '@/components/contractor/StatsOverview'
import { Building2 } from 'lucide-react'
import RecentOrdersWidget from '@/components/contractor/RecentOrdersWidget'

export default function ContractorDashboardPage() {
    const [sidebarOpen, setSidebarOpen] = useState(true)
    const [user, setUser] = useState<any>(null)
    const [profile, setProfile] = useState<any>(null)
    const router = useRouter()

    const [stats, setStats] = useState<any>(null)
    const [statsLoading, setStatsLoading] = useState(true)
    const [recentOrders, setRecentOrders] = useState<any[]>([])

    useEffect(() => {
        const userData = localStorage.getItem('user')
        if (userData) {
            const parsedUser = JSON.parse(userData)
            setUser(parsedUser)
            fetchProfile()
            fetchStats()
        } else {
            router.push('/login')
        }
    }, [router])

    const fetchProfile = async () => {
        try {
            const token = localStorage.getItem('access_token')
            const userStored = localStorage.getItem('user')
            const userId = userStored ? JSON.parse(userStored).id : null

            const res = await fetch('/api/contractors/profile', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'x-user-id': userId || ''
                }
            })

            if (res.ok) {
                const result = await res.json()
                setProfile(result.data)
            }
        } catch (err) {
            console.error('Error fetching profile:', err)
        }
    }

    const fetchStats = async () => {
        try {
            const token = localStorage.getItem('access_token')
            const userStored = localStorage.getItem('user')
            const userId = userStored ? JSON.parse(userStored).id : null

            const res = await fetch('/api/contractors/dashboard-stats', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'x-user-id': userId || ''
                }
            })

            const data = await res.json()
            if (data.success) {
                setStats(data.stats)
                setRecentOrders(data.recentOrders || [])
            }
        } catch (err) {
            console.error('Error fetching stats:', err)
        } finally {
            setStatsLoading(false)
        }
    }

    const handleContactSupport = async () => {
        try {
            const token = localStorage.getItem('access_token')
            const userStored = localStorage.getItem('user')
            const userId = userStored ? JSON.parse(userStored).id : ''

            const res = await fetch('/api/conversations/support', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'x-user-id': userId
                }
            })

            const data = await res.json()
            if (data.success && data.conversationId) {
                // Redirect to messages page with specific conversation open
                router.push(`/contractor/messages?id=${data.conversationId}`)
            } else {
                alert('Hiện tại tổng đài đang bận, vui lòng thử lại sau.')
            }
        } catch (err) {
            console.error('Support connection failed:', err)
            // Fallback to general messages
            router.push('/contractor/messages')
        }
    }

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            <ContractorHeader sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} user={user} />
            <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

            {/* Main Content */}
            <main className={`flex-1 pt-[60px] transition-all duration-300 ${sidebarOpen ? 'lg:ml-64' : 'ml-0'}`}>
                <div className="p-4 lg:p-6 max-w-7xl mx-auto">
                    {/* Stats Overview */}
                    <StatsOverview stats={stats || { activeProjects: 0, pendingOrders: 0, unreadNotifications: 0, totalSpent: 0, thisMonthSpent: 0 }} loading={statsLoading} />

                    <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
                        {/* MAIN CONTENT (Chiếm 8/12 cột ~ 66%) */}
                        <div className="xl:col-span-8 space-y-8">
                            {/* 1. HERO: Dự án phù hợp - Ưu tiên số 1 */}
                            <section>
                                <SuggestedProjectsWidget displayMode="grid" />
                            </section>

                            {/* 2. Tài chính - Cần không gian rộng */}
                            <section>
                                <FinancialDashboard />
                            </section>

                            {/* 3. Đơn hàng - Xếp dưới cùng */}
                            <section>
                                <div className="bg-white rounded-2xl p-1 border border-gray-100 shadow-sm overflow-hidden">
                                    <RecentOrdersWidget orders={recentOrders} />
                                </div>
                            </section>
                        </div>

                        {/* RIGHT SIDEBAR (Chiếm 4/12 cột ~ 33%) - Sticky */}
                        <div className="xl:col-span-4 space-y-6 xl:sticky xl:top-[80px]">
                            {/* Thông báo - Luôn hiển thị ở trên cùng sidebar */}
                            <NotificationPrefsWidget />

                            {/* Banner hỗ trợ */}
                            <div className="bg-gradient-to-br from-indigo-900 to-primary-900 rounded-2xl p-6 text-white text-center shadow-lg relative overflow-hidden">
                                <div className="relative z-10">
                                    <h3 className="font-bold mb-2">Cần hỗ trợ?</h3>
                                    <p className="text-indigo-100 text-sm mb-4">Đội ngũ CSKH chuyên nghiệp luôn sẵn sàng 24/7</p>
                                    <button
                                        onClick={handleContactSupport}
                                        className="bg-white text-primary-900 text-sm font-bold py-2 px-4 rounded-lg hover:bg-indigo-50 transition-colors w-full shadow-md hover:shadow-lg active:scale-95 transform duration-150"
                                    >
                                        Chat ngay
                                    </button>
                                </div>
                                <div className="absolute top-0 right-0 p-4 opacity-10">
                                    <Building2 className="w-16 h-16" />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    )
}
