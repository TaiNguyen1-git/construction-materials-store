'use client'

import React from 'react'
import { LOADING_PHASES, LOADING_TIPS } from '../types'
import { Brain, Sparkles } from 'lucide-react'

interface LoadingSectionProps {
    loadingPhase: number
    loadingTip: number
}

export default function LoadingSection({ loadingPhase, loadingTip }: LoadingSectionProps) {
    return (
        <div className="bg-white rounded-[3rem] shadow-xl border border-slate-100 p-12 text-center h-[500px] flex flex-col items-center justify-center relative overflow-hidden animate-in fade-in duration-500">
            {/* Subtle grid background */}
            <div className="absolute inset-0 z-0 pointer-events-none opacity-[0.03]"
                style={{
                    backgroundImage: 'linear-gradient(#4f46e5 1px, transparent 1px), linear-gradient(90deg, #4f46e5 1px, transparent 1px)',
                    backgroundSize: '48px 48px'
                }}
            />

            {/* Animated scan line */}
            <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-transparent via-indigo-500 to-transparent animate-[scan_3s_ease-in-out_infinite] z-0 opacity-60" />

            {/* Background glow */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-indigo-100 rounded-full blur-3xl opacity-60 pointer-events-none" />

            <div className="relative z-10 w-full space-y-10">
                {/* Pulsing Icon */}
                <div className="flex items-center justify-center">
                    <div className="relative">
                        <div className="animate-ping absolute inset-0 w-20 h-20 bg-indigo-100 rounded-3xl opacity-60"></div>
                        <div className="relative w-20 h-20 bg-gradient-to-br from-indigo-600 to-blue-600 rounded-3xl flex items-center justify-center shadow-2xl shadow-indigo-200">
                            <Brain className="w-10 h-10 text-white" />
                        </div>
                    </div>
                </div>

                {/* Phase Text */}
                <div className="space-y-4">
                    <p className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.3em]">
                        Giai đoạn {loadingPhase + 1}/{LOADING_PHASES.length}
                    </p>
                    <h3 className="text-2xl font-black text-slate-900 tracking-tight">
                        {LOADING_PHASES[loadingPhase] || 'Đang xử lý...'}
                    </h3>

                    {/* Progress Bar */}
                    <div className="w-64 h-1.5 bg-slate-100 mx-auto rounded-full overflow-hidden">
                        <div
                            className="h-full bg-gradient-to-r from-indigo-500 to-blue-500 rounded-full transition-all duration-1000 ease-out"
                            style={{ width: `${((loadingPhase + 1) / LOADING_PHASES.length) * 100}%` }}
                        />
                    </div>
                </div>

                {/* Phase steps */}
                <div className="flex justify-center gap-2">
                    {LOADING_PHASES.map((_, i) => (
                        <div
                            key={i}
                            className={`h-1 rounded-full transition-all duration-500 ${
                                i <= loadingPhase ? 'bg-indigo-500 w-6' : 'bg-slate-200 w-2'
                            }`}
                        />
                    ))}
                </div>

                {/* Tip */}
                <div className="bg-indigo-50 border border-indigo-100 rounded-2xl px-6 py-4 max-w-sm mx-auto space-y-2">
                    <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest flex items-center justify-center gap-1.5">
                        <Sparkles className="w-3 h-3" /> Có thể bạn chưa biết
                    </p>
                    <p key={loadingTip} className="text-slate-600 text-sm font-medium italic leading-relaxed animate-in slide-in-from-bottom-2 duration-700">
                        "{LOADING_TIPS[loadingTip]}"
                    </p>
                </div>
            </div>

            <style jsx>{`
                @keyframes scan {
                    0% { top: -2px; }
                    100% { top: 100%; }
                }
            `}</style>
        </div>
    )
}
