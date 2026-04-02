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
    ChevronRight, Wallet, TrendingUp, AlertCircle
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
            toast.loading('Đang khởi tạo kênh hỗ trợ kỹ thuật...', { duration: 1500 })
            const res = await fetchWithAuth('/api/conversations/support', {
                method: 'POST'
            })
            const data = await res.json()
            if (data.success && data.conversationId) {
                setTimeout(() => router.push(`/contractor/messages?id=${data.conversationId}`), 1500)
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
        toast.loading('Đang thiết lập thông số dự án mới...', { duration: 1500 })
        setTimeout(() => router.push('/contractor/projects/new'), 1500)
    }

    return (
        <div className="space-y-12 animate-in fade-in duration-1000 pb-24 max-w-7xl mx-auto">
            <Toaster position="top-right" />

            {/* Command Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-10">
                <div className="space-y-3">
                    <h1 className="text-5xl font-black text-slate-900 tracking-tighter uppercase italic flex items-center gap-5">
                        <Cpu className="w-12 h-12 text-blue-600" />
                        Điều phối tác vụ
                    </h1>
                    <p className="text-slate-500 font-bold uppercase text-[10px] tracking-[0.3em] italic">Hệ thống Quản trị & Điều phối Công trình B2B</p>
                </div>
                <div className="flex items-center gap-4">
                    <div className="hidden lg:flex items-center gap-4 bg-white border border-slate-100 px-8 py-4 rounded-[2rem] shadow-sm italic">
                        <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.5)]"></div>
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Hệ thống bảo mật 100%</span>
                    </div>
                    <button 
                        onClick={handleInitializeNode}
                        className="px-10 py-6 bg-blue-600 text-white rounded-[2.5rem] text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-4 hover:bg-blue-700 transition-all shadow-2xl shadow-blue-500/30 active:scale-95 italic group"
                    >
                        <Zap className="w-5 h-5 group-hover:scale-125 transition-transform" /> Khởi tạo dự án
                    </button>
                </div>
            </div>

            {/* Tier-1 Metrics */}
            <StatsOverview 
                stats={stats || { activeProjects: 0, pendingOrders: 0, unreadNotifications: 0, totalSpent: 0, thisMonthSpent: 0 }} 
                loading={statsLoading} 
            />

            <div className="grid grid-cols-1 xl:grid-cols-12 gap-12 items-start">
                <div className="xl:col-span-8 space-y-16">
                    {/* Project Opportunity Matrix */}
                    <section className="space-y-8">
                        <div className="flex items-center justify-between px-6">
                            <h3 className="text-xl font-black text-slate-900 uppercase italic tracking-widest flex items-center gap-5 leading-none">
                                <div className="w-2 h-7 bg-blue-600 rounded-full"></div>
                                Cơ hội thầu dự án
                            </h3>
                            <Link href="/contractor/projects/find" className="text-[10px] font-black text-slate-400 hover:text-blue-600 uppercase tracking-widest transition-colors flex items-center gap-3 italic">
                                Quét toàn bộ <ChevronRight size={16} />
                            </Link>
                        </div>
                        <SuggestedProjectsWidget displayMode="grid" />
                    </section>

                    {/* Financial Ledger Shard */}
                    <section className="space-y-8">
                        <div className="flex items-center justify-between px-6">
                            <h3 className="text-xl font-black text-slate-900 uppercase italic tracking-widest flex items-center gap-5 leading-none">
                                <div className="w-2 h-7 bg-indigo-600 rounded-full"></div>
                                Tài chính & Công nợ
                            </h3>
                        </div>
                        <div className="bg-white rounded-[4rem] p-2 border border-slate-50 shadow-2xl shadow-slate-200/40 relative overflow-hidden group">
                           <FinancialDashboard />
                        </div>
                    </section>

                    {/* Procurement Log */}
                    <section className="space-y-8">
                        <div className="flex items-center justify-between px-6">
                            <h3 className="text-xl font-black text-slate-900 uppercase italic tracking-widest flex items-center gap-5 leading-none">
                                <div className="w-2 h-7 bg-emerald-600 rounded-full"></div>
                                Logistics & Vật tư
                            </h3>
                            <Link href="/contractor/orders" className="text-[10px] font-black text-slate-400 hover:text-emerald-600 uppercase tracking-widest transition-colors flex items-center gap-3 italic">
                                Xem lịch sử <ChevronRight size={16} />
                            </Link>
                        </div>
                        <div className="bg-white rounded-[4rem] p-2 border border-slate-50 shadow-2xl shadow-slate-200/40">
                            <RecentOrdersWidget orders={recentOrders} />
                        </div>
                    </section>
                </div>

                {/* Right Tactical Sidebar */}
                <div className="xl:col-span-4 space-y-10">
                    {/* Live Operations Widget */}
                    <div className="bg-indigo-600 rounded-[4rem] p-12 text-white relative overflow-hidden shadow-2xl shadow-indigo-200 group">
                        <div className="absolute top-0 right-0 w-40 h-40 bg-white/5 rounded-full -mr-20 -mt-20 group-hover:scale-150 transition-transform duration-1000"></div>
                        <div className="relative z-10 space-y-10">
                            <div className="space-y-3">
                                <h3 className="text-[10px] font-black text-blue-300 uppercase tracking-widest italic flex items-center gap-3">
                                    <Activity className="w-4 h-4 animate-pulse" /> Giám sát công trình
                                </h3>
                                <p className="text-3xl font-black italic tracking-tighter uppercase leading-tight">Quản lý đội nhóm & thợ</p>
                            </div>
                            <div className="space-y-6">
                                <div className="p-7 bg-white/10 border border-white/10 rounded-[2.5rem] space-y-3">
                                    <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-blue-100">
                                        <span>Hiệu suất thực địa</span>
                                        <span className="text-emerald-400">Đang bật</span>
                                    </div>
                                    <div className="h-2 bg-white/10 rounded-full overflow-hidden p-0.5">
                                        <div className="h-full bg-blue-400 w-[78%] rounded-full shadow-[0_0_10px_rgba(96,165,250,0.5)]"></div>
                                    </div>
                                </div>
                            </div>
                            <Link href="/contractor/monitoring" className="w-full py-7 bg-white text-indigo-600 rounded-[2rem] font-black text-[11px] uppercase tracking-widest hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-black/20 flex items-center justify-center gap-4 italic">
                                Truy cập giám sát <ArrowUpRight size={20} />
                            </Link>
                        </div>
                    </div>

                    <NotificationPrefsWidget />

                    {/* B2B Structural Module */}
                    <div className="bg-white rounded-[4rem] p-12 border border-slate-50 shadow-2xl shadow-slate-200/40 relative overflow-hidden group">
                        <div className="absolute -bottom-16 -right-16 w-56 h-56 bg-blue-50 rounded-full group-hover:scale-125 transition-transform duration-1000"></div>
                        <div className="relative z-10 space-y-10">
                            <div className="space-y-2">
                                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] italic leading-none">Quản trị cấu trúc</h3>
                                <p className="text-3xl font-black text-slate-900 tracking-tighter uppercase italic">Tổ chức B2B</p>
                            </div>
                            <div className="space-y-4">
                                <Link href="/contractor/organization" className="flex items-center justify-between p-7 bg-slate-50/50 hover:bg-blue-600 hover:text-white rounded-[2.5rem] transition-all duration-500 group/item border border-slate-100">
                                    <div className="flex items-center gap-5">
                                        <div className="w-12 h-12 bg-white shadow-sm rounded-2xl flex items-center justify-center text-slate-400 group-hover/item:text-blue-600 transition-colors">
                                            <Building2 size={24} />
                                        </div>
                                        <span className="text-[12px] font-black uppercase tracking-tight italic">Tổ chức & Công ty</span>
                                    </div>
                                    <ChevronRight size={20} className="text-slate-300 group-hover/item:text-white" />
                                </Link>
                                <Link href="/contractor/team" className="flex items-center justify-between p-7 bg-slate-50/50 hover:bg-blue-600 hover:text-white rounded-[2.5rem] transition-all duration-500 group/item border border-slate-100">
                                    <div className="flex items-center gap-5">
                                        <div className="w-12 h-12 bg-white shadow-sm rounded-2xl flex items-center justify-center text-slate-400 group-hover/item:text-blue-600 transition-colors">
                                            <UsersIcon size={24} />
                                        </div>
                                        <span className="text-[12px] font-black uppercase tracking-tight italic">Quản lý đội thợ</span>
                                    </div>
                                    <ChevronRight size={20} className="text-slate-300 group-hover/item:text-white" />
                                </Link>
                            </div>
                        </div>
                    </div>

                    {/* Operational Support Shard */}
                    <div className="bg-blue-600 rounded-[4rem] p-12 text-white relative overflow-hidden shadow-2xl shadow-blue-200 group">
                        <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full blur-2xl transition-all duration-1000 group-hover:scale-150"></div>
                        <div className="relative z-10 space-y-12 text-center">
                            <div className="space-y-6">
                                <div className="w-24 h-24 bg-white/10 rounded-[2.5rem] flex items-center justify-center mx-auto border border-white/10 shadow-inner group-hover:rotate-12 transition-transform shadow-blue-500">
                                    <Sparkles size={40} className="text-blue-100" />
                                </div>
                                <div className="space-y-2">
                                    <h3 className="text-2xl font-black uppercase italic tracking-tighter leading-tight">Hỗ trợ kỹ thuật</h3>
                                    <p className="text-[10px] font-black text-blue-100 uppercase tracking-widest opacity-80 leading-relaxed italic px-4">
                                        Kết nối trực tiếp với trung tâm hỗ trợ B2B để xử lý các tác vụ khẩn cấp 24/7.
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={handleContactSupport}
                                className="w-full py-7 bg-white text-blue-600 rounded-[2rem] font-black text-[11px] uppercase tracking-[0.2em] shadow-2xl shadow-blue-800/10 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-4 italic"
                            >
                                <MessageSquare size={20} /> Chat ngay với tổng đài
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
