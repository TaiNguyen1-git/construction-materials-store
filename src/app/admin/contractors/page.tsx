'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Users, Building2, ShieldCheck, Plus, ChevronRight } from 'lucide-react'
import ContractorList from './components/ContractorList'
import SupplierList from './components/SupplierList'
import PartnerVerification from './components/PartnerVerification'
import OrganizationList from './components/OrganizationList'

const TABS = [
    {
        id: 'contractors',
        label: 'Nhà thầu',
        icon: Users,
        description: 'Quản lý & giám sát hiệu suất',
        color: 'blue',
    },
    {
        id: 'organizations',
        label: 'Tổ chức B2B',
        icon: Building2,
        description: 'Công ty & đội nhóm doanh nghiệp',
        color: 'purple',
    },
    {
        id: 'suppliers',
        label: 'Nhà cung cấp',
        icon: Building2,
        description: 'Đối tác cung ứng & phân phối',
        color: 'indigo',
    },
    {
        id: 'verification',
        label: 'Phê duyệt hồ sơ',
        icon: ShieldCheck,
        description: 'Xác thực & kích hoạt đối tác',
        color: 'emerald',
    },
] as const

type TabId = typeof TABS[number]['id']

export default function PartnerHubPage() {
    const [activeTab, setActiveTab] = useState<TabId>('contractors')

    const activeTabMeta = TABS.find((t: any) => t.id === activeTab)!

    return (
        <div className="min-h-screen bg-[#F8FAFC]">
            {/* Page Header */}
            <div className="bg-white border-b border-slate-200 px-8 py-8">
                <div className="max-w-[1600px] mx-auto">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                        <div>
                            <h1 className="text-3xl font-black text-slate-900 flex items-center gap-3">
                                <div className="p-2.5 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl shadow-xl shadow-blue-500/20">
                                    <Users className="w-7 h-7 text-white" />
                                </div>
                                Quản lý Đối Tác
                            </h1>
                            <p className="text-slate-500 mt-1.5 font-medium">
                                Trung tâm quản lý đối tác, tổ chức B2B, nhà cung cấp và xác thực đối tác
                            </p>
                        </div>
                        {activeTab === 'contractors' && (
                            <Link
                                href="/admin/onboarding"
                                className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white font-bold rounded-2xl shadow-xl shadow-blue-100 hover:scale-[1.02] active:scale-95 transition-all text-sm"
                            >
                                <Plus className="w-4 h-4" /> Thêm nhà thầu mới
                            </Link>
                        )}
                    </div>

                    {/* Tab Navigation */}
                    <div className="flex gap-2">
                        {TABS.map((tab) => {
                            const Icon = tab.icon
                            const isActive = activeTab === tab.id
                            
                            const activeColors: Record<TabId, string> = {
                                contractors: 'bg-blue-600 text-white shadow-xl shadow-blue-200 border-blue-600',
                                organizations: 'bg-purple-600 text-white shadow-xl shadow-purple-200 border-purple-600',
                                suppliers: 'bg-indigo-600 text-white shadow-xl shadow-indigo-200 border-indigo-600',
                                verification: 'bg-emerald-600 text-white shadow-xl shadow-emerald-200 border-emerald-600'
                            }
                            
                            const inactiveColors: Record<TabId, string> = {
                                contractors: 'bg-white text-slate-600 border-slate-200 hover:border-blue-300 hover:text-blue-600',
                                organizations: 'bg-white text-slate-600 border-slate-200 hover:border-purple-300 hover:text-purple-600',
                                suppliers: 'bg-white text-slate-600 border-slate-200 hover:border-indigo-300 hover:text-indigo-600',
                                verification: 'bg-white text-slate-600 border-slate-200 hover:border-emerald-300 hover:text-emerald-600'
                            }

                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`flex items-center gap-3 px-6 py-3.5 rounded-2xl border-2 font-bold text-sm transition-all ${
                                        isActive ? activeColors[tab.id] : inactiveColors[tab.id]
                                    }`}
                                >
                                    <Icon className="w-5 h-5" />
                                    <span>{tab.label}</span>
                                </button>
                            )
                        })}
                    </div>
                </div>
            </div>

            {/* Tab Content */}
            <div className="max-w-[1600px] mx-auto px-8 py-8">
                <div key={activeTab} className="animate-in fade-in duration-200">
                    {activeTab === 'contractors' && <ContractorList />}
                    {activeTab === 'organizations' && <OrganizationList />}
                    {activeTab === 'suppliers' && <SupplierList />}
                    {activeTab === 'verification' && <PartnerVerification />}
                </div>
            </div>
        </div>
    )
}
