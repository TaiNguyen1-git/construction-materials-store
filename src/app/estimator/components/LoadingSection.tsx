'use client'

import React from 'react'
import { LOADING_PHASES, LOADING_TIPS } from '../types'

interface LoadingSectionProps {
    loadingPhase: number
    loadingTip: number
}

export default function LoadingSection({ loadingPhase, loadingTip }: LoadingSectionProps) {
    return (
        <div className="bg-white rounded-[3rem] shadow-2xl border border-slate-50 p-12 text-center h-[500px] flex flex-col items-center justify-center relative overflow-hidden animate-in fade-in duration-500">
            {/* Cinematic Background Scan Effect */}
            <div className="absolute inset-0 z-0 opacity-5 pointer-events-none">
                <div className="w-full h-1 bg-gradient-to-r from-transparent via-indigo-600 to-transparent absolute top-0 animate-[scan_3s_ease-in-out_infinite]"></div>
                <div className="w-full h-[1px] bg-slate-200 absolute top-1/4"></div>
                <div className="w-full h-[1px] bg-slate-200 absolute top-1/2"></div>
                <div className="w-full h-[1px] bg-slate-200 absolute top-3/4"></div>
                <div className="h-full w-[1px] bg-slate-200 absolute left-1/4"></div>
                <div className="h-full w-[1px] bg-slate-200 absolute left-1/2"></div>
                <div className="h-full w-[1px] bg-slate-200 absolute left-3/4"></div>
            </div>

            <div className="relative z-10 w-full space-y-12">
                {/* Phase Text */}
                <div className="space-y-4">
                    <h3 className="text-3xl font-black text-slate-900 tracking-tighter uppercase animate-pulse">
                        {LOADING_PHASES[loadingPhase] || 'Đang xử lý...'}
                    </h3>
                    <div className="w-48 h-1 bg-slate-100 mx-auto rounded-full overflow-hidden">
                        <div
                            className="h-full bg-indigo-600 transition-all duration-1000 ease-out shadow-[0_0_10px_rgba(79,70,229,0.5)]"
                            style={{ width: `${((loadingPhase + 1) / LOADING_PHASES.length) * 100}%` }}
                        ></div>
                    </div>
                </div>

                {/* Expert Tip Section */}
                <div className="max-w-md mx-auto space-y-3">
                    <p className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.3em] opacity-60">Có thể bạn chưa biết</p>
                    <div className="h-20 flex items-center justify-center">
                        <p
                            key={loadingTip}
                            className="text-slate-500 text-sm font-medium italic leading-relaxed animate-in slide-in-from-bottom-2 duration-1000"
                        >
                            "{LOADING_TIPS[loadingTip]}"
                        </p>
                    </div>
                </div>

                <style jsx>{`
                    @keyframes scan {
                        0% { top: -10%; }
                        100% { top: 110%; }
                    }
                `}</style>
            </div>
        </div>
    )
}
