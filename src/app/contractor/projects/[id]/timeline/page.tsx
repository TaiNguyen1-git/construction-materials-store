'use client'

import { use, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Building2, Clock, Activity, Layers, Cpu, Sparkles } from 'lucide-react'
import ProjectTimeline from '@/components/ProjectTimeline'
import { useAuth } from '@/contexts/auth-context'

export default function ContractorProjectTimelinePage({
    params
}: {
    params: Promise<{ id: string }>
}) {
    const { user } = useAuth()
    const { id } = use(params)

    return (
        <div className="space-y-12 animate-in fade-in duration-700 pb-24 max-w-5xl mx-auto">
            {/* Tactical Timeline Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
                <div className="space-y-2">
                    <button
                        onClick={() => window.history.back()}
                        className="flex items-center gap-4 text-slate-400 hover:text-slate-900 font-black text-[10px] uppercase tracking-widest transition-all group italic mb-4"
                    >
                        <div className="w-10 h-10 rounded-[1rem] bg-white border border-slate-100 flex items-center justify-center group-hover:bg-slate-900 group-hover:text-white transition-all shadow-sm">
                            <ArrowLeft size={16} />
                        </div>
                        Return to Node Detail
                    </button>
                    <h1 className="text-4xl font-black text-slate-900 tracking-tighter uppercase italic flex items-center gap-4">
                        <Clock className="w-10 h-10 text-blue-600" />
                        Operational Timeline
                    </h1>
                    <p className="text-slate-500 font-bold uppercase text-[10px] tracking-[0.2em]">Theo dõi tiến độ chi tiết qua các giai đoạn thi công B2B</p>
                </div>

                <div className="hidden md:flex items-center gap-3 text-blue-600 font-black text-[9px] uppercase tracking-widest bg-blue-50 px-4 py-2 rounded-full border border-blue-100 italic">
                    <Activity size={14} className="animate-pulse" /> Telemetry: Synchronized
                </div>
            </div>

            {/* Main Timeline Terminal */}
            <div className="bg-white rounded-[3.5rem] p-10 lg:p-16 shadow-2xl shadow-slate-200/50 border border-slate-50 relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-80 h-80 bg-blue-600/5 rounded-full blur-[80px] -mr-32 -mt-32 transition-all duration-1000 group-hover:scale-110"></div>
                
                <div className="relative z-10">
                    <div className="flex items-center gap-6 mb-12 pb-10 border-b border-slate-50">
                        <div className="w-16 h-16 bg-slate-950 text-white rounded-[1.5rem] flex items-center justify-center shadow-xl shadow-slate-200">
                            <Layers size={32} />
                        </div>
                        <div className="space-y-1">
                            <h2 className="text-2xl font-black uppercase italic tracking-tight text-slate-900">Sequence Analysis</h2>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Shard: {id}</p>
                        </div>
                    </div>

                    <div className="px-2">
                        <ProjectTimeline projectId={id} showExportButton={true} />
                    </div>
                </div>
            </div>

            {/* Tactical Advisor */}
            <div className="bg-slate-950 rounded-[3.5rem] p-12 text-white relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-48 h-48 bg-blue-500/10 rounded-full blur-3xl"></div>
                <div className="flex items-center gap-8">
                    <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center flex-shrink-0 border border-white/5 group-hover:rotate-12 transition-transform">
                        <Cpu size={32} className="text-blue-400" />
                    </div>
                    <div className="space-y-1">
                        <h3 className="text-xl font-black italic tracking-tighter uppercase whitespace-nowrap">Timeline Integrity Protocol</h3>
                        <p className="text-xs font-bold text-slate-500 italic leading-relaxed">System automates sequential shifts based on field telemetry. Discrepancies require immediate principal override.</p>
                    </div>
                </div>
            </div>
        </div>
    )
}
