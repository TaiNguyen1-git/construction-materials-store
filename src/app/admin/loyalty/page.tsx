'use client'

import { useState } from 'react'
import {
    BarChart3, Users, Settings, Ticket, ScrollText,
    Rocket, Brain, Trophy
} from 'lucide-react'
import LoyaltyDashboard from '@/app/admin/loyalty/components/LoyaltyDashboard'
import MembersList from '@/app/admin/loyalty/components/MembersList'
import RulesConfig from '@/app/admin/loyalty/components/RulesConfig'
import VoucherManagement from '@/app/admin/loyalty/components/VoucherManagement'
import TransactionHistory from '@/app/admin/loyalty/components/TransactionHistory'
import CampaignList from '@/app/admin/loyalty/components/CampaignList'
import AIAnalytics from '@/app/admin/loyalty/components/AIAnalytics'

const tabs = [
    { id: 'dashboard', label: 'Tổng Quan', icon: BarChart3 },
    { id: 'members', label: 'Thành Viên', icon: Users },
    { id: 'rules', label: 'Quy Tắc & Hạng', icon: Settings },
    { id: 'vouchers', label: 'Voucher', icon: Ticket },
    { id: 'transactions', label: 'Lịch Sử', icon: ScrollText },
    { id: 'campaigns', label: 'Chiến Dịch', icon: Rocket },
    { id: 'ai', label: 'Phân Tích AI', icon: Brain },
]

export default function AdminLoyaltyPage() {
    const [activeTab, setActiveTab] = useState('dashboard')

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h1 className="text-4xl font-black text-slate-900 tracking-tighter">
                        Chương Trình <span className="text-blue-600 italic">Thân Thiết</span>
                    </h1>
                    <p className="text-sm text-slate-400 font-bold mt-1 tracking-wide">
                        Quản lý điểm thưởng, hạng thành viên và chiến dịch ưu đãi
                    </p>
                </div>
                <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    <Trophy size={14} className="text-blue-600" />
                    SmartBuild Loyalty Engine
                </div>
            </div>

            {/* Tab Navigation */}
            <div className="bg-white rounded-[24px] border border-slate-200 p-1.5 shadow-sm flex gap-1 overflow-x-auto">
                {tabs.map((tab) => {
                    const isActive = activeTab === tab.id
                    return (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-2 px-5 py-3 rounded-[18px] text-sm font-bold whitespace-nowrap transition-all duration-300 ${isActive
                                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
                                : 'text-slate-500 hover:bg-slate-50 hover:text-blue-600'
                                }`}
                        >
                            <tab.icon size={16} />
                            {tab.label}
                        </button>
                    )
                })}
            </div>

            {/* Tab Content */}
            <div className="min-h-[600px]">
                {activeTab === 'dashboard' && <LoyaltyDashboard />}
                {activeTab === 'members' && <MembersList />}
                {activeTab === 'rules' && <RulesConfig />}
                {activeTab === 'vouchers' && <VoucherManagement />}
                {activeTab === 'transactions' && <TransactionHistory />}
                {activeTab === 'campaigns' && <CampaignList />}
                {activeTab === 'ai' && <AIAnalytics />}
            </div>
        </div>
    )
}
