'use client'

/**
 * Contractor Dashboard
 * Main dashboard for verified contractors with Financial Insights
 */

import { useQuery } from '@tanstack/react-query'
import { useAuth } from '@/contexts/auth-context'
import { fetchWithAuth } from '@/lib/api-client'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'

// Components
import SuggestedProjectsWidget from '../components/SuggestedProjectsWidget'
import NotificationPrefsWidget from '../components/NotificationPrefsWidget'
import FinancialDashboard from '@/components/contractor/FinancialDashboard'
import StatsOverview from '@/components/contractor/StatsOverview'
import RecentOrdersWidget from '@/components/contractor/RecentOrdersWidget'
import { Building2, Users as UsersIcon } from 'lucide-react'
import Link from 'next/link'

export default function ContractorDashboardPage() {
    const { isAuthenticated } = useAuth()
    const router = useRouter()

    const { data: statsData, isLoading: statsLoading } = useQuery({
        queryKey: ['contractor-dashboard-stats'],
        queryFn: async () => {
            const res = await fetchWithAuth('/api/contractors/dashboard-stats')
            const data = await res.json()
            return data.success ? { stats: data.stats, recentOrders: data.recentOrders || [] } : null
        },
        enabled: isAuthenticated
    })

    const stats = statsData?.stats || null
    const recentOrders = statsData?.recentOrders || []

    const handleContactSupport = async () => {
        try {
            const res = await fetchWithAuth('/api/conversations/support', {
                method: 'POST'
            })

            const data = await res.json()
            if (data.success && data.conversationId) {
                router.push(`/contractor/messages?id=${data.conversationId}`)
            } else {
                toast.error('Hiện tại tổng đài đang bận, vui lòng thử lại sau.')
            }
        } catch (err) {
            console.error('Support connection failed:', err)
            toast.error('Không thể kết nối với hỗ trợ.')
            router.push('/contractor/messages')
        }
    }

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Stats Overview */}
            <StatsOverview 
                stats={stats || { activeProjects: 0, pendingOrders: 0, unreadNotifications: 0, totalSpent: 0, thisMonthSpent: 0 }} 
                loading={statsLoading} 
            />

            <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
                <div className="xl:col-span-8 space-y-8">
                    {/* 1. HERO: Dự án phù hợp */}
                    <section>
                        <SuggestedProjectsWidget displayMode="grid" />
                    </section>

                    {/* 2. Tài chính */}
                    <section>
                        <FinancialDashboard />
                    </section>

                    {/* 3. Đơn hàng */}
                    <section>
                        <div className="bg-white rounded-[2.5rem] p-2 border border-gray-100 shadow-sm overflow-hidden">
                            <RecentOrdersWidget orders={recentOrders} />
                        </div>
                    </section>
                </div>

                {/* Right Sidebar Widgets */}
                <div className="xl:col-span-4 space-y-6">
                    <NotificationPrefsWidget />

                    {/* B2B Organization */}
                    <div className="bg-gradient-to-br from-indigo-900 to-primary-900 rounded-[2.5rem] p-10 text-white relative overflow-hidden shadow-xl shadow-indigo-100 group">
                        <div className="relative z-10">
                            <h3 className="font-black text-xl mb-2 flex items-center gap-3">
                                <UsersIcon className="w-6 h-6 text-indigo-300" />
                                Tổ chức B2B
                            </h3>
                            <p className="text-indigo-100 text-[10px] mb-8 opacity-70 leading-relaxed uppercase tracking-[0.2em] font-black">Hợp tác & Quản trị thợ</p>
                            <Link href="/contractor/organization">
                                <button className="bg-white text-indigo-900 text-[11px] font-black py-4 px-6 rounded-2xl transition-all w-full shadow-lg hover:bg-slate-100 uppercase tracking-widest active:scale-95">
                                    Quản lý đội nhóm
                                </button>
                            </Link>
                        </div>
                        <div className="absolute top-[-20px] right-[-20px] opacity-10 group-hover:scale-125 transition-transform duration-1000">
                            <Building2 className="w-48 h-48" />
                        </div>
                    </div>

                    {/* Support Banner */}
                    <div className="bg-white rounded-[2.5rem] p-10 border border-gray-100 shadow-sm relative overflow-hidden group">
                        <div className="relative z-10">
                            <h3 className="font-black text-gray-900 text-xl mb-1">Cần hỗ trợ?</h3>
                            <p className="text-gray-500 text-xs mb-8 font-bold uppercase tracking-widest opacity-60">Đội ngũ chuyên nghiệp 24/7</p>
                            <button
                                onClick={handleContactSupport}
                                className="bg-slate-900 text-white text-[11px] font-black py-4 px-6 rounded-2xl hover:bg-black transition-all w-full shadow-lg uppercase tracking-widest active:scale-95"
                            >
                                Chat ngay
                            </button>
                        </div>
                        <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-indigo-50/50 rounded-full group-hover:scale-150 transition-transform duration-1000"></div>
                    </div>
                </div>
            </div>
        </div>
    )
}
