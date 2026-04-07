'use client'

import { useQuery } from '@tanstack/react-query'
import { useAuth } from '@/contexts/auth-context'
import { fetchWithAuth } from '@/lib/api-client'
import { useRouter } from 'next/navigation'
import toast, { Toaster } from 'react-hot-toast'
import Link from 'next/link'
import { 
    Building2, Users as UsersIcon, LayoutGrid, 
    Zap, Activity, Layers, Cpu, Sparkles, 
    ArrowUpRight, Clock, ShieldCheck, MessageSquare,
    ChevronRight, Wallet, TrendingUp, AlertCircle,
    Package
} from 'lucide-react'

// Components
import SuggestedProjectsWidget from '../components/SuggestedProjectsWidget'
import NotificationPrefsWidget from '../components/NotificationPrefsWidget'
import FinancialDashboard from '@/components/contractor/FinancialDashboard'
import StatsOverview from '@/components/contractor/StatsOverview'
import RecentOrdersWidget from '@/components/contractor/RecentOrdersWidget'

export default function ContractorDashboardPage() {
    const { isAuthenticated, user } = useAuth()
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
            toast.loading('Đang kết nối trung tâm hỗ trợ...', { duration: 1500 })
            const res = await fetchWithAuth('/api/conversations/support', {
                method: 'POST'
            })
            const data = await res.json()
            if (data.success && data.conversationId) {
                setTimeout(() => router.push(`/contractor/messages?id=${data.conversationId}`), 1000)
            } else {
                toast.error('Hệ thống hỗ trợ đang bận, vui lòng thử lại sau.')
            }
        } catch (err) {
            console.error('Support connection failed:', err)
            toast.error('Không thể kết nối với trung tâm hỗ trợ.')
            router.push('/contractor/messages')
        }
    }

    const handleInitializeNode = () => {
        router.push('/contractor/projects/new')
    }

    return (
        <div className="space-y-8 pb-20 max-w-7xl mx-auto">
            <Toaster position="top-right" />

            {/* Simple Dashboard Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 px-4 sm:px-0">
                <div className="space-y-1">
                    <h1 className="text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-3">
                        <LayoutGrid className="w-8 h-8 text-blue-600" />
                        Dashboard Nhà Thầu
                    </h1>
                    <p className="text-slate-500 text-sm font-medium">Quản lý dự án, vật tư và tài chính tập trung</p>
                </div>
                <div className="flex items-center gap-3">
                    <button 
                        onClick={handleInitializeNode}
                        className="px-6 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold flex items-center gap-2 hover:bg-blue-700 transition-all shadow-md active:scale-95"
                    >
                        <Zap className="w-4 h-4" /> Khởi tạo dự án mới
                    </button>
                </div>
            </div>

            {/* Main Stats Hub */}
            <StatsOverview 
                stats={stats || { activeProjects: 0, pendingOrders: 0, unreadNotifications: 0, totalSpent: 0, thisMonthSpent: 0 }} 
                loading={statsLoading} 
            />

            <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
                {/* Left Column: Primary Operations */}
                <div className="xl:col-span-8 space-y-10">
                    {/* Project Opportunities */}
                    <section className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm overflow-hidden">
                        <div className="flex items-center justify-between mb-6 px-2">
                            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                <Briefcase className="w-5 h-5 text-blue-600" />
                                Cơ hội thầu dự án
                            </h3>
                            <Link href="/contractor/projects/find" className="text-xs font-bold text-blue-600 hover:underline flex items-center gap-1">
                                Xem tất cả <ChevronRight size={14} />
                            </Link>
                        </div>
                        <SuggestedProjectsWidget displayMode="grid" />
                    </section>

                    {/* Financial & Invoices */}
                    <section className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm overflow-hidden">
                        <div className="flex items-center mb-6 px-2">
                            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                <Wallet className="w-5 h-5 text-indigo-600" />
                                Tài chính & Công nợ
                            </h3>
                        </div>
                        <FinancialDashboard />
                    </section>

                    {/* Order History Log */}
                    <section className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm overflow-hidden">
                        <div className="flex items-center justify-between mb-6 px-2">
                            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                <Package className="w-5 h-5 text-emerald-600" />
                                Logistics & Vật tư
                            </h3>
                            <Link href="/contractor/orders" className="text-xs font-bold text-blue-600 hover:underline flex items-center gap-1">
                                Lịch sử đơn hàng <ChevronRight size={14} />
                            </Link>
                        </div>
                        <RecentOrdersWidget orders={recentOrders} />
                    </section>
                </div>

                {/* Right Column: Auxiliary Widgets */}
                <div className="xl:col-span-4 space-y-8">
                    {/* Monitoring Quick Link */}
                    <div className="bg-indigo-600 rounded-3xl p-8 text-white relative overflow-hidden shadow-xl shadow-indigo-100 group">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 group-hover:scale-125 transition-transform duration-700"></div>
                        <div className="relative z-10 space-y-6">
                            <div className="space-y-1">
                                <h3 className="text-xs font-bold text-indigo-100 uppercase tracking-widest flex items-center gap-2">
                                    <Activity className="w-3 h-3" /> Trạng thái hiện trường
                                </h3>
                                <p className="text-xl font-bold">Giám sát công trình & Đội thợ</p>
                            </div>
                            <Link href="/contractor/monitoring" className="w-full py-4 bg-white text-indigo-600 rounded-2xl font-bold text-sm hover:bg-slate-50 transition-all flex items-center justify-center gap-2 shadow-lg">
                                Truy cập giám sát <ArrowUpRight size={18} />
                            </Link>
                        </div>
                    </div>

                    <NotificationPrefsWidget />

                    {/* Management Links */}
                    <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm space-y-6">
                        <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider px-2">Quản trị nội bộ</h3>
                        <div className="space-y-3">
                            <Link href="/contractor/organization" className="flex items-center justify-between p-4 bg-slate-50 hover:bg-slate-100 rounded-xl transition-all group">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-white border border-slate-200 rounded-lg flex items-center justify-center text-slate-500">
                                        <Building2 size={20} />
                                    </div>
                                    <span className="text-sm font-semibold text-slate-700">Công ty & Tổ chức</span>
                                </div>
                                <ChevronRight size={16} className="text-slate-300 group-hover:translate-x-1 transition-all" />
                            </Link>
                            <Link href="/contractor/team" className="flex items-center justify-between p-4 bg-slate-50 hover:bg-slate-100 rounded-xl transition-all group">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-white border border-slate-200 rounded-lg flex items-center justify-center text-slate-500">
                                        <UsersIcon size={20} />
                                    </div>
                                    <span className="text-sm font-semibold text-slate-700">Quản lý đội ngũ thợ</span>
                                </div>
                                <ChevronRight size={16} className="text-slate-300 group-hover:translate-x-1 transition-all" />
                            </Link>
                        </div>
                    </div>

                    {/* Support Feature */}
                    <div className="bg-blue-600 rounded-3xl p-8 text-white text-center space-y-6 shadow-xl shadow-blue-500/20">
                        <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto">
                            <Sparkles size={28} />
                        </div>
                        <div className="space-y-2">
                            <h3 className="text-xl font-bold">Hỗ trợ kỹ thuật 24/7</h3>
                            <p className="text-xs text-blue-100 font-medium leading-relaxed">
                                Đội ngũ chuyên gia SmartBuild luôn sẵn sàng hỗ trợ bạn xử lý các tác vụ khẩn cấp.
                            </p>
                        </div>
                        <button
                            onClick={handleContactSupport}
                            className="w-full py-4 bg-white text-blue-600 rounded-2xl font-bold text-sm shadow-xl hover:bg-slate-50 transition-all flex items-center justify-center gap-2 active:scale-95"
                        >
                            <MessageSquare size={18} /> Chat với chúng tôi
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}

const Briefcase = ({ className, size }: { className?: string, size?: number }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" width={size || 24} height={size || 24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="14" x="2" y="7" rx="2" ry="2"></rect><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path></svg>
)
