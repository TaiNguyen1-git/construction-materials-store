'use client'

import { useState } from 'react'
import { 
  Users, Trophy, Ticket, HeartHandshake,
  BarChart3, Settings, ShieldCheck
} from 'lucide-react'
import CustomerManagement from './components/CustomerManagement'
import LoyaltyHub from './components/LoyaltyHub'
import PromotionManagement from './components/PromotionManagement'

const mainTabs = [
  { id: 'customers', label: 'Khách Hàng', icon: Users, description: 'Quản lý hồ sơ & lịch sử' },
  { id: 'loyalty', label: 'Loyalty', icon: Trophy, description: 'Điểm thưởng & Thành viên' },
  { id: 'promotions', label: 'Khuyến Mãi', icon: Ticket, description: 'Voucher & Chiến dịch' },
]

export default function CRMHubPage() {
  const [activeTab, setActiveTab] = useState('customers')

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Premium Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <div className="px-2 py-0.5 bg-blue-100 text-blue-600 text-[9px] font-black uppercase tracking-widest rounded-md">
              Marketing Suite
            </div>
            <div className="flex items-center gap-1 text-[9px] font-black text-slate-400 uppercase tracking-widest">
              <ShieldCheck size={12} className="text-emerald-500" />
              Verified CRM Data
            </div>
          </div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tighter">
            Trung Tâm <span className="text-blue-600 italic">Khách Hàng</span>
          </h1>
          <p className="text-sm text-slate-400 font-bold mt-1 tracking-wide uppercase">
            Hệ thống quản trị Quan Hệ Khách Hàng & Tiếp Thị Tập Trung
          </p>
        </div>
        
        <div className="flex items-center gap-3 p-2 bg-slate-100 rounded-2xl border border-slate-200 shadow-inner">
          <div className="flex -space-x-2">
            {[1,2,3,4].map(i => (
              <div key={i} className="w-8 h-8 rounded-full border-2 border-white bg-slate-300 flex items-center justify-center text-[10px] font-bold text-white shadow-sm">
                {String.fromCharCode(64 + i)}
              </div>
            ))}
          </div>
          <div className="text-[10px] font-black text-slate-500 uppercase tracking-tighter">
            <span className="text-blue-600">5.2k+</span> Khách hàng hoạt động
          </div>
        </div>
      </div>

      {/* Main Tab Navigation */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {mainTabs.map((tab) => {
          const isActive = activeTab === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`relative group p-6 rounded-[32px] border transition-all duration-500 overflow-hidden ${
                isActive 
                ? 'bg-blue-600 border-blue-600 shadow-2xl shadow-blue-500/30' 
                : 'bg-white border-slate-100 hover:border-blue-200 shadow-sm'
              }`}
            >
              <div className="relative z-10 flex items-center gap-4">
                <div className={`p-3 rounded-2xl transition-colors duration-500 ${
                  isActive ? 'bg-white/20 text-white' : 'bg-blue-50 text-blue-600 group-hover:bg-blue-100'
                }`}>
                  <tab.icon size={24} />
                </div>
                <div className="text-left">
                  <div className={`text-lg font-black uppercase tracking-tight ${isActive ? 'text-white' : 'text-slate-900'}`}>
                    {tab.label}
                  </div>
                  <div className={`text-[10px] font-bold uppercase tracking-widest ${isActive ? 'text-white/70' : 'text-slate-400'}`}>
                    {tab.description}
                  </div>
                </div>
              </div>

              {/* Decorative elements */}
              {isActive && (
                <div className="absolute top-0 right-0 -mr-8 -mt-8 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
              )}
              {!isActive && (
                <div className="absolute bottom-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity p-4">
                  <BarChart3 size={40} className="text-blue-50" />
                </div>
              )}
            </button>
          )
        })}
      </div>

      {/* Content Area */}
      <div className="bg-white/50 backdrop-blur-sm rounded-[40px] border border-white p-2 shadow-sm min-h-[600px]">
        <div className="bg-white rounded-[36px] border border-slate-100 p-8 shadow-sm">
          {activeTab === 'customers' && <CustomerManagement />}
          {activeTab === 'loyalty' && <LoyaltyHub />}
          {activeTab === 'promotions' && <PromotionManagement />}
        </div>
      </div>

      {/* Footer Insight */}
      <div className="flex items-center justify-center gap-4 py-4">
        <div className="h-px bg-slate-100 flex-1" />
        <div className="flex items-center gap-2 text-[10px] font-black text-slate-300 uppercase tracking-[0.2em]">
          <HeartHandshake size={14} className="text-blue-400" />
          SmartBuild CRM Engine v2.0
        </div>
        <div className="h-px bg-slate-100 flex-1" />
      </div>
    </div>
  )
}
