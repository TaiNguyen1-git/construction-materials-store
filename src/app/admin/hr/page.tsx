'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { 
  Users, Banknote, ShieldCheck, 
  Sparkles, Layout, Settings
} from 'lucide-react'
import PersonnelManager from './components/PersonnelManager'
import PayrollManager from './components/PayrollManager'
import RoleManager from './components/RoleManager'

const tabs = [
  { id: 'personnel', label: 'Hồ Sơ Nhân Sự', icon: Users, description: 'Quản lý nhân viên, ca làm & công việc' },
  { id: 'payroll', label: 'Bảng Lương', icon: Banknote, description: 'Chi trả lương, thưởng & phúc lợi' },
  { id: 'roles', label: 'Vai Trò & Bảo Mật', icon: ShieldCheck, description: 'Phân quyền & truy cập hệ thống' },
]

export default function HRHubPage() {
  const searchParams = useSearchParams()
  const tabParam = searchParams.get('tab')
  const [activeTab, setActiveTab] = useState(tabParam || 'personnel')

  useEffect(() => {
    if (tabParam && tabs.some(t => t.id === tabParam)) {
      setActiveTab(tabParam)
    }
  }, [tabParam])

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <div className="px-2 py-0.5 bg-blue-100 text-blue-600 text-[9px] font-black uppercase tracking-widest rounded-md">
              HR Core
            </div>
            <div className="flex items-center gap-1 text-[9px] font-black text-slate-400 uppercase tracking-widest">
              <Sparkles size={12} className="text-amber-500" />
              SmartBuild Organization Hub
            </div>
          </div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tighter">
            Quản Trị <span className="text-blue-600 italic">Nhân Sự</span>
          </h1>
          <p className="text-sm text-slate-400 font-bold mt-1 tracking-wide uppercase">
            Hệ thống quản lý nguồn lực & tổ chức nội bộ
          </p>
        </div>

        <div className="flex items-center gap-4 text-slate-400">
            <div className="text-right hidden sm:block">
                <div className="text-[10px] font-black uppercase tracking-tighter text-slate-400">Trạng thái hệ thống</div>
                <div className="text-xl font-black text-emerald-500 uppercase">Ổn Định</div>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600 border border-blue-100">
                <Settings size={20} />
            </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {tabs.map((tab) => {
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
                  <div className={`text-sm font-black uppercase tracking-tight ${isActive ? 'text-white' : 'text-slate-900'}`}>
                    {tab.label}
                  </div>
                  <div className={`text-[9px] font-bold uppercase tracking-widest ${isActive ? 'text-white/70' : 'text-slate-400'}`}>
                    {tab.description}
                  </div>
                </div>
              </div>
              {isActive && (
                <div className="absolute top-0 right-0 -mr-8 -mt-8 w-32 h-32 bg-white/10 rounded-full blur-2xl transition-transform duration-700 group-hover:scale-150" />
              )}
            </button>
          )
        })}
      </div>

      {/* Content Hub Area */}
      <div className="bg-white/50 backdrop-blur-sm rounded-[40px] border border-white p-2 shadow-sm min-h-[600px]">
        <div className="bg-white rounded-[36px] border border-slate-100 p-8 shadow-sm">
          {activeTab === 'personnel' && <PersonnelManager />}
          {activeTab === 'payroll' && <PayrollManager />}
          {activeTab === 'roles' && <RoleManager />}
        </div>
      </div>

      {/* Footer Branding */}
      <div className="flex items-center justify-center gap-4 py-4">
        <div className="h-px bg-slate-100 flex-1" />
        <div className="flex items-center gap-2 text-[10px] font-black text-slate-300 uppercase tracking-[0.2em]">
          <Layout size={14} className="text-blue-400" />
          Personnel & Security System v3.1
        </div>
        <div className="h-px bg-slate-100 flex-1" />
      </div>
    </div>
  )
}
