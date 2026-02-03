'use client'

import React from 'react'
import { LayoutGrid, ShieldCheck, CreditCard } from 'lucide-react'

interface Stats {
    totalProducts: number
    totalCustomers: number
    activeOrders: number
}

interface StatsSectionProps {
    stats: Stats
    loading: boolean
}

export default function StatsSection({ stats, loading }: StatsSectionProps) {
    const items = [
        { label: 'Sản phẩm đa dạng', value: `${stats.totalProducts}+`, icon: LayoutGrid, color: 'text-indigo-600', bg: 'bg-indigo-50', border: 'border-indigo-100' },
        { label: 'Khách hàng tin dùng', value: `${stats.totalCustomers}+`, icon: ShieldCheck, color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-100' },
        { label: 'Đơn hàng thành công', value: `${stats.activeOrders}+`, icon: CreditCard, color: 'text-sky-600', bg: 'bg-sky-50', border: 'border-sky-100' },
    ]

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-16 relative z-30 mb-20">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {items.map((item, idx) => (
                    <div
                        key={idx}
                        className="group bg-white rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.05)] border border-slate-50 p-8 flex items-center hover:shadow-2xl hover:-translate-y-2 transition-all duration-500"
                    >
                        <div className={`w-20 h-20 rounded-3xl ${item.bg} flex items-center justify-center mr-8 border ${item.border} group-hover:scale-110 transition-transform duration-500`}>
                            <item.icon className={`h-10 w-10 ${item.color}`} strokeWidth={1.5} />
                        </div>
                        <div>
                            <div className="text-4xl font-black text-slate-900 tracking-tighter leading-none mb-2">
                                {loading ? '...' : item.value}
                            </div>
                            <div className="text-[11px] font-black text-slate-400 uppercase tracking-widest leading-none">
                                {item.label}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}
