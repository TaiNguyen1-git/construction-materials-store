'use client'

import { useState } from 'react'
import {
    BarChart3, Users, Settings, Ticket, ScrollText,
    Rocket, Brain
} from 'lucide-react'
import LoyaltyDashboard from './loyalty/LoyaltyDashboard'
import MembersList from './loyalty/MembersList'
import RulesConfig from './loyalty/RulesConfig'
import VoucherManagement from './loyalty/VoucherManagement'
import TransactionHistory from './loyalty/TransactionHistory'
import CampaignList from './loyalty/CampaignList'
import AIAnalytics from './loyalty/AIAnalytics'

const tabs = [
    { id: 'dashboard', label: 'Tổng Quan', icon: BarChart3 },
    { id: 'members', label: 'Thành Viên', icon: Users },
    { id: 'rules', label: 'Quy Tắc & Hạng', icon: Settings },
    { id: 'vouchers', label: 'Voucher', icon: Ticket },
    { id: 'transactions', label: 'Lịch Sử', icon: ScrollText },
    { id: 'campaigns', label: 'Chiến Dịch', icon: Rocket },
    { id: 'ai', label: 'Phân Tích AI', icon: Brain },
]

export default function LoyaltyHub() {
    const [activeTab, setActiveTab] = useState('dashboard')

    return (
        <div className="space-y-6">
            {/* Tab Navigation */}
            <div className="bg-white rounded-[24px] border border-slate-100 p-1.5 shadow-sm flex gap-1 overflow-x-auto no-scrollbar">
                {tabs.map((tab) => {
                    const isActive = activeTab === tab.id
                    return (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-2 px-5 py-2.5 rounded-[18px] text-[11px] font-black uppercase tracking-widest whitespace-nowrap transition-all duration-300 ${isActive
                                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
                                : 'text-slate-400 hover:bg-slate-50 hover:text-blue-600'
                                }`}
                        >
                            <tab.icon size={14} />
                            {tab.label}
                        </button>
                    )
                })}
            </div>

            {/* Tab Content */}
            <div className="min-h-[500px]">
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
