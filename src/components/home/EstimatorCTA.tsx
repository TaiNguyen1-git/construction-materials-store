'use client'

import React from 'react'
import Link from 'next/link'
import { Brain, ShieldCheck, Plus } from 'lucide-react'

export default function EstimatorCTA() {
    const actions = [
        {
            title: 'Báo giá vật liệu AI',
            desc: 'Tính khối lượng tự động',
            icon: Brain,
            color: 'from-indigo-600 to-blue-700',
            shadow: 'shadow-indigo-100',
            link: '/estimator'
        },
        {
            title: 'Nhà thầu uy tín',
            desc: 'Kết nối thợ tay nghề cao',
            icon: ShieldCheck,
            color: 'from-emerald-500 to-teal-600',
            shadow: 'shadow-emerald-100',
            link: '/contractors'
        },
        {
            title: 'Đăng tin dự án',
            desc: 'Nhận báo giá ngay lập tức',
            icon: Plus,
            color: 'from-orange-500 to-amber-600',
            shadow: 'shadow-orange-100',
            link: '/projects/post'
        }
    ]

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6">
            {actions.map((action, i) => (
                <Link
                    key={i}
                    href={action.link}
                    className={`group flex items-center justify-between p-6 rounded-[2rem] bg-gradient-to-r ${action.color} text-white shadow-xl ${action.shadow} hover:shadow-2xl transition-all hover:-translate-y-1 active:scale-[0.98] cursor-pointer relative overflow-hidden`}
                >
                    <div className="relative z-10">
                        <p className="text-[10px] font-black opacity-80 uppercase tracking-[0.2em] mb-1.5">{action.desc}</p>
                        <h4 className="font-black text-lg tracking-tight uppercase leading-none">{action.title}</h4>
                    </div>
                    <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                        <action.icon className="w-6 h-6 text-white" />
                    </div>

                    {/* Decorative shapes */}
                    <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-white/10 rounded-full blur-2xl group-hover:bg-white/20 transition-all"></div>
                </Link>
            ))}
        </div>
    )
}
