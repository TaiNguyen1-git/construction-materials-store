'use client'

import React from 'react'
import { Brain, Sparkles, Cpu, TrendingUp } from 'lucide-react'

export default function EstimatorHeader() {
    return (
        <div className="mb-16 text-center space-y-6 animate-in fade-in slide-in-from-top-4 duration-700">
            {/* Icon */}
            <div className="flex items-center justify-center">
                <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-br from-indigo-400 to-blue-400 blur-2xl rounded-full opacity-20 scale-150"></div>
                    <div className="relative w-20 h-20 bg-gradient-to-br from-indigo-600 to-blue-600 rounded-3xl flex items-center justify-center shadow-2xl shadow-indigo-200 border border-indigo-500/20">
                        <Brain className="w-10 h-10 text-white" />
                    </div>
                </div>
            </div>

            {/* Title */}
            <div className="space-y-3">
                <h1 className="text-5xl md:text-6xl font-black tracking-tight text-slate-900 leading-none">
                    AI Material{' '}
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-blue-600 to-cyan-500">
                        Estimator
                    </span>
                </h1>
                <p className="text-slate-500 text-lg font-medium max-w-xl mx-auto leading-relaxed">
                    Phân tích bản vẽ · Bóc tách vật tư · Dự toán chi phí chính xác đến từng hạng mục
                </p>
            </div>

            {/* Feature Pills */}
            <div className="flex flex-wrap justify-center gap-3 pt-2">
                {[
                    { icon: Cpu, label: 'Phân tích bản vẽ kỹ thuật' },
                    { icon: Sparkles, label: 'Tiêu chuẩn TCVN' },
                    { icon: TrendingUp, label: 'Giá thị trường thực tế' },
                ].map((item, i) => (
                    <div key={i} className="inline-flex items-center gap-2 bg-white border border-slate-200 px-4 py-2 rounded-full shadow-sm hover:shadow-md hover:border-indigo-200 transition-all">
                        <item.icon className="w-3.5 h-3.5 text-indigo-500" />
                        <span className="text-xs text-slate-600 font-semibold">{item.label}</span>
                    </div>
                ))}
            </div>
        </div>
    )
}
