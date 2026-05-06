'use client'

import { useState, Suspense } from 'react'
import { 
    Wallet, CreditCard, ShoppingCart, Briefcase, BarChart3, TrendingUp, ShieldCheck, Zap
} from 'lucide-react'
import { useSearchParams } from 'next/navigation'
import CreditManager from './components/CreditManager'
import ProcurementManager from './components/ProcurementManager'
import ContractManager from './components/ContractManager'
import RevenueManager from './components/RevenueManager'

type FinanceTab = 'revenue' | 'credit' | 'procurement' | 'contracts'

function FinanceHubContent() {
    const searchParams = useSearchParams()
    const [activeTab, setActiveTab] = useState<FinanceTab>(
        (searchParams.get('tab') as FinanceTab) || 'revenue'
    )

    const tabs = [
        { id: 'revenue', label: 'Báo cáo doanh thu', icon: BarChart3, color: 'text-emerald-600', bg: 'bg-emerald-50' },
        { id: 'credit', label: 'Công nợ & Tín dụng', icon: CreditCard, color: 'text-blue-600', bg: 'bg-blue-50' },
        { id: 'procurement', label: 'Nhập hàng AI', icon: ShoppingCart, color: 'text-amber-600', bg: 'bg-amber-50' },
        { id: 'contracts', label: 'Hợp đồng & B2B', icon: Briefcase, color: 'text-purple-600', bg: 'bg-purple-50' },
    ]

    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            {/* Premium Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <h1 className="text-4xl font-black text-slate-900 tracking-tight flex items-center gap-4">
                        <div className="p-3 bg-gradient-to-br from-blue-600 to-indigo-700 text-white rounded-[24px] shadow-2xl shadow-blue-200">
                            <Wallet size={32} />
                        </div>
                        Trung Tâm Tài Chính
                    </h1>
                    <p className="text-sm font-bold text-slate-400 mt-2 uppercase tracking-[0.2em] ml-1">
                        Hệ Thống Quản Trị Tài Chính & Dòng Tiền Hợp Nhất
                    </p>
                </div>
                
                <div className="flex items-center gap-4 p-2 bg-white rounded-[24px] border border-slate-100 shadow-sm">
                    <div className="flex -space-x-2">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="w-8 h-8 rounded-full border-2 border-white bg-slate-100 flex items-center justify-center">
                                <ShieldCheck size={14} className="text-blue-500" />
                            </div>
                        ))}
                    </div>
                    <div className="pr-4">
                        <div className="text-[10px] font-black text-slate-900 uppercase">Hệ thống bảo mật</div>
                        <div className="text-[9px] font-bold text-emerald-500 uppercase flex items-center gap-1">
                            <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></div>
                            Hoạt động ổn định
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Navigation Hub */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => {
                            setActiveTab(tab.id as FinanceTab)
                            const url = new URL(window.location.href)
                            url.searchParams.set('tab', tab.id)
                            window.history.pushState({}, '', url.toString())
                        }}
                        className={`group relative p-6 rounded-[32px] border transition-all duration-500 text-left overflow-hidden ${
                            activeTab === tab.id 
                            ? 'bg-white border-slate-200 shadow-xl shadow-slate-100 ring-2 ring-slate-900/5' 
                            : 'bg-slate-50 border-transparent hover:bg-white hover:border-slate-100'
                        }`}
                    >
                        {activeTab === tab.id && (
                            <div className="absolute top-0 right-0 p-4">
                                <Zap size={14} className="text-amber-400 fill-amber-400" />
                            </div>
                        )}
                        <div className={`p-3 rounded-2xl w-max mb-4 transition-transform duration-500 group-hover:scale-110 ${tab.bg} ${tab.color}`}>
                            <tab.icon size={20} />
                        </div>
                        <h3 className={`text-xs font-black uppercase tracking-widest ${activeTab === tab.id ? 'text-slate-900' : 'text-slate-400'}`}>
                            {tab.label}
                        </h3>
                        <p className="text-[9px] font-bold text-slate-400 uppercase mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            Quản lý {tab.label.toLowerCase()}
                        </p>
                    </button>
                ))}
            </div>

            {/* Module Container */}
            <div className="bg-white rounded-[48px] border border-slate-100 p-8 shadow-sm min-h-[600px] relative overflow-hidden">
                {/* Decorative background elements */}
                <div className="absolute -top-24 -right-24 w-96 h-96 bg-slate-50 rounded-full blur-3xl opacity-50 pointer-events-none"></div>
                <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-blue-50/50 rounded-full blur-3xl opacity-50 pointer-events-none"></div>
                
                <div className="relative z-10">
                    {activeTab === 'revenue' && <RevenueManager />}
                    {activeTab === 'credit' && <CreditManager />}
                    {activeTab === 'procurement' && <ProcurementManager />}
                    {activeTab === 'contracts' && <ContractManager />}
                </div>
            </div>
        </div>
    )
}

export default function FinanceHubPage() {
    return (
        <Suspense fallback={
            <div className="space-y-8 p-12">
                <div className="h-16 w-64 bg-slate-100 animate-pulse rounded-2xl"></div>
                <div className="grid grid-cols-4 gap-4">
                    {[1, 2, 3, 4].map(i => <div key={i} className="h-32 bg-slate-100 animate-pulse rounded-[32px]"></div>)}
                </div>
                <div className="h-[600px] bg-slate-50 animate-pulse rounded-[48px]"></div>
            </div>
        }>
            <FinanceHubContent />
        </Suspense>
    )
}
