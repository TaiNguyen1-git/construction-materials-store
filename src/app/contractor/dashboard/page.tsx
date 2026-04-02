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
            const res = await fetchWithAuth('/api/conversations/support', {
                method: 'POST'
            })
            const data = await res.json()
            if (data.success && data.conversationId) {
                router.push(`/contractor/messages?id=${data.conversationId}`)
            } else {
                toast.error('Tactical Support: Bandwidth Constrained')
            }
        } catch (err) {
            console.error('Support connection failed:', err)
            toast.error('Support Sync Failed')
            router.push('/contractor/messages')
        }
    }

    return (
        <div className="space-y-12 animate-in fade-in duration-700 pb-24 max-w-7xl mx-auto">
            <Toaster position="top-right" />

            {/* Command Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
                <div className="space-y-2">
                    <h1 className="text-5xl font-black text-slate-900 tracking-tighter uppercase italic flex items-center gap-4">
                        <Cpu className="w-12 h-12 text-blue-600" />
                        Operation Command
                    </h1>
                    <p className="text-slate-500 font-bold uppercase text-[10px] tracking-[0.3em]">Hệ thống Quản trị & Điều phối Công trình B2B</p>
                </div>
                <div className="flex items-center gap-4">
                    <div className="hidden lg:flex items-center gap-3 bg-white border border-slate-100 px-6 py-3 rounded-2xl shadow-sm italic">
                        <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">System Integrity: 100% Secure</span>
                    </div>
                    <Link 
                        href="/contractor/projects/new"
                        className="px-8 py-4 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-3 hover:bg-black transition-all shadow-2xl shadow-slate-200 active:scale-95 group"
                    >
                        <Zap className="w-4 h-4 group-hover:scale-125 transition-transform" /> Initialize Node
                    </Link>
                </div>
            </div>

            {/* Tier-1 Metrics */}
            <StatsOverview 
                stats={stats || { activeProjects: 0, pendingOrders: 0, unreadNotifications: 0, totalSpent: 0, thisMonthSpent: 0 }} 
                loading={statsLoading} 
            />

            <div className="grid grid-cols-1 xl:grid-cols-12 gap-10 items-start">
                <div className="xl:col-span-8 space-y-12">
                    {/* Project Opportunity Matrix */}
                    <section className="space-y-6">
                        <div className="flex items-center justify-between px-4">
                            <h3 className="text-lg font-black text-slate-900 uppercase italic tracking-widest flex items-center gap-4 leading-none">
                                <div className="w-1.5 h-6 bg-blue-600 rounded-full"></div>
                                Project Opportunities
                            </h3>
                            <Link href="/contractor/projects/find" className="text-[10px] font-black text-slate-400 hover:text-blue-600 uppercase tracking-widest transition-colors flex items-center gap-2 italic">
                                Scan Matrix <ChevronRight size={14} />
                            </Link>
                        </div>
                        <SuggestedProjectsWidget displayMode="grid" />
                    </section>

                    {/* Financial Ledger Shard */}
                    <section className="space-y-6">
                        <div className="flex items-center justify-between px-4">
                            <h3 className="text-lg font-black text-slate-900 uppercase italic tracking-widest flex items-center gap-4 leading-none">
                                <div className="w-1.5 h-6 bg-indigo-600 rounded-full"></div>
                                Fiscal Intelligence
                            </h3>
                        </div>
                        <div className="bg-white rounded-[3.5rem] p-2 border border-slate-50 shadow-xl shadow-slate-200/40 relative overflow-hidden group">
                           <FinancialDashboard />
                        </div>
                    </section>

                    {/* Procurement Log */}
                    <section className="space-y-6">
                        <div className="flex items-center justify-between px-4">
                            <h3 className="text-lg font-black text-slate-900 uppercase italic tracking-widest flex items-center gap-4 leading-none">
                                <div className="w-1.5 h-6 bg-emerald-600 rounded-full"></div>
                                Procurement Stream
                            </h3>
                            <Link href="/contractor/orders" className="text-[10px] font-black text-slate-400 hover:text-emerald-600 uppercase tracking-widest transition-colors flex items-center gap-2 italic">
                                Full Registry <ChevronRight size={14} />
                            </Link>
                        </div>
                        <div className="bg-white rounded-[3.5rem] p-2 border border-slate-50 shadow-xl shadow-slate-200/40">
                            <RecentOrdersWidget orders={recentOrders} />
                        </div>
                    </section>
                </div>

                {/* Right Tactical Sidebar */}
                <div className="xl:col-span-4 space-y-8">
                    {/* Live Operations Widget */}
                    <div className="bg-slate-900 rounded-[3.5rem] p-10 text-white relative overflow-hidden shadow-2xl shadow-slate-900/40 group">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-1000"></div>
                        <div className="relative z-10 space-y-8">
                            <div className="space-y-1">
                                <h3 className="text-sm font-black text-blue-400 uppercase tracking-widest italic flex items-center gap-3">
                                    <Activity className="w-4 h-4 animate-pulse" /> Live Telemetry
                                </h3>
                                <p className="text-2xl font-black italic tracking-tighter uppercase">Team Monitoring</p>
                            </div>
                            <div className="space-y-4">
                                <div className="p-5 bg-white/5 border border-white/10 rounded-[1.8rem] space-y-2">
                                    <div className="flex justify-between items-center text-[9px] font-black uppercase tracking-widest text-slate-400">
                                        <span>Field Unit Activity</span>
                                        <span className="text-emerald-400">Active</span>
                                    </div>
                                    <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                                        <div className="h-full bg-blue-500 w-[78%] rounded-full shadow-[0_0_10px_rgba(59,130,246,0.5)]"></div>
                                    </div>
                                </div>
                            </div>
                            <Link href="/contractor/monitoring" className="w-full py-5 bg-white text-slate-900 rounded-[1.5rem] font-black text-[10px] uppercase tracking-widest hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-black/20 flex items-center justify-center gap-3 italic">
                                Access Surveillance <ArrowUpRight size={16} />
                            </Link>
                        </div>
                    </div>

                    <NotificationPrefsWidget />

                    {/* B2B Structural Module */}
                    <div className="bg-white rounded-[3.5rem] p-10 border border-slate-50 shadow-xl shadow-slate-200/40 relative overflow-hidden group">
                        <div className="absolute -bottom-12 -right-12 w-48 h-48 bg-slate-50 rounded-full group-hover:scale-125 transition-transform duration-1000"></div>
                        <div className="relative z-10 space-y-8">
                            <div className="space-y-1">
                                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] italic">Structural Control</h3>
                                <p className="text-2xl font-black text-slate-900 tracking-tighter uppercase italic">Institutional Nodes</p>
                            </div>
                            <div className="space-y-3">
                                <Link href="/contractor/organization" className="flex items-center justify-between p-5 bg-slate-50/50 hover:bg-slate-950 hover:text-white rounded-[1.8rem] transition-all duration-500 group/item">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 bg-white shadow-sm rounded-xl flex items-center justify-center text-slate-400 group-hover/item:text-blue-500 transition-colors">
                                            <Building2 size={20} />
                                        </div>
                                        <span className="text-[11px] font-black uppercase tracking-tight italic">Organization</span>
                                    </div>
                                    <ChevronRight size={18} className="text-slate-300 group-hover/item:text-white" />
                                </Link>
                                <Link href="/contractor/team" className="flex items-center justify-between p-5 bg-slate-50/50 hover:bg-slate-950 hover:text-white rounded-[1.8rem] transition-all duration-500 group/item">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 bg-white shadow-sm rounded-xl flex items-center justify-center text-slate-400 group-hover/item:text-blue-500 transition-colors">
                                            <UsersIcon size={20} />
                                        </div>
                                        <span className="text-[11px] font-black uppercase tracking-tight italic">Team Assets</span>
                                    </div>
                                    <ChevronRight size={18} className="text-slate-300 group-hover/item:text-white" />
                                </Link>
                            </div>
                        </div>
                    </div>

                    {/* Operational Support Shard */}
                    <div className="bg-indigo-600 rounded-[3.5rem] p-12 text-white relative overflow-hidden shadow-2xl shadow-indigo-200 group">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
                        <div className="relative z-10 space-y-10 text-center">
                            <div className="space-y-4">
                                <div className="w-20 h-20 bg-white/10 rounded-[2.2rem] flex items-center justify-center mx-auto border border-white/10 shadow-inner group-hover:rotate-12 transition-transform">
                                    <Sparkles size={36} className="text-indigo-200" />
                                </div>
                                <h3 className="text-2xl font-black uppercase italic tracking-tighter">Tactical Advisory</h3>
                                <p className="text-[10px] font-black text-indigo-200 uppercase tracking-widest opacity-80 leading-relaxed italic">
                                    Synchronize with our core support network for critical node assistance 24/7.
                                </p>
                            </div>
                            <button
                                onClick={handleContactSupport}
                                className="w-full py-6 bg-white text-indigo-600 rounded-[1.8rem] font-black text-[10px] uppercase tracking-[0.2em] shadow-2xl shadow-indigo-800/10 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-4 italic"
                            >
                                <MessageSquare size={18} /> Initialize Comms Shard
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
