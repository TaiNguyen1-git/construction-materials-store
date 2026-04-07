'use client'

import { use, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
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
    const router = useRouter()

    return (
        <div className="space-y-10 animate-in fade-in duration-700 pb-24 max-w-5xl mx-auto">
            {/* Professional Timeline Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 px-4 md:px-0">
                <div className="space-y-4">
                    <Link
                        href={`/contractor/projects/${id}`}
                        className="flex items-center gap-3 text-slate-500 hover:text-blue-600 font-bold text-xs transition-all group"
                    >
                        <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center group-hover:border-blue-200 group-active:scale-95 transition-all shadow-sm">
                            <ArrowLeft size={16} />
                        </div>
                        Quay lại
                    </Link>
                    <div className="space-y-1">
                        <h1 className="text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-3">
                            <Clock className="w-8 h-8 text-blue-600" />
                            Dòng thời gian dự án
                        </h1>
                        <p className="text-slate-500 font-medium text-sm">Theo dõi tiến độ chi tiết qua các giai đoạn thi công</p>
                    </div>
                </div>

                <div className="flex items-center gap-2 text-blue-600 font-bold text-[11px] bg-blue-50 px-4 py-2 rounded-xl border border-blue-100">
                    <Activity size={14} className="animate-pulse" /> Dữ liệu: Đã đồng bộ
                </div>
            </div>

            {/* Main Timeline Card */}
            <div className="bg-white rounded-3xl p-8 lg:p-12 shadow-xl shadow-slate-200/40 border border-slate-100 relative overflow-hidden">
                <div className="relative z-10">
                    <div className="flex items-center gap-5 mb-10 pb-8 border-b border-slate-50">
                        <div className="w-14 h-14 bg-indigo-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-200">
                            <Layers size={28} />
                        </div>
                        <div className="space-y-0.5">
                            <h2 className="text-xl font-bold text-slate-900">Phân tích tiến độ thi công</h2>
                            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Mã dự án: {id}</p>
                        </div>
                    </div>

                    <div>
                        <ProjectTimeline projectId={id} showExportButton={true} />
                    </div>
                </div>
            </div>

            {/* System Info */}
            <div className="bg-slate-900 rounded-3xl p-10 text-white relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl"></div>
                <div className="flex items-center gap-6">
                    <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center flex-shrink-0 border border-white/10 transition-transform group-hover:rotate-12">
                        <Cpu size={28} className="text-indigo-400" />
                    </div>
                    <div className="space-y-1">
                        <h3 className="text-lg font-bold">Quy trình kiểm soát tiến độ</h3>
                        <p className="text-sm font-medium text-slate-400 leading-relaxed">Hệ thống tự động cập nhật tiến độ dựa trên báo cáo thực tế và các mốc thanh toán đã giải ngân.</p>
                    </div>
                </div>
            </div>
        </div>
    )
}
