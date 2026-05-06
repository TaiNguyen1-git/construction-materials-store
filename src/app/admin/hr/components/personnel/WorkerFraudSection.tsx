'use client'

import { AlertCircle, CheckCircle2, ChevronDown, ChevronUp, ExternalLink, ShieldAlert } from 'lucide-react'

interface WorkerFraudReport {
    id: string
    workerName: string
    workerEmail: string
    projectName: string
    activityType: string
    photoUrl: string
    riskScore: number
    status: string
    createdAt: string
    rejectionReason?: string
}

interface WorkerFraudSectionProps {
    reports: WorkerFraudReport[]
    loading: boolean
    expanded: boolean
    onToggle: () => void
    onApprove: (id: string) => void
    onReject: (id: string) => void
}

export default function WorkerFraudSection({
    reports,
    loading,
    expanded,
    onToggle,
    onApprove,
    onReject
}: WorkerFraudSectionProps) {
    return (
        <div className="bg-white rounded-lg shadow overflow-hidden">
            <button
                onClick={onToggle}
                className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
            >
                <div className="flex items-center gap-3">
                    <ShieldAlert className="w-5 h-5 text-orange-600" />
                    <h2 className="text-lg font-bold text-gray-900">Giám Sát Gian Lận Thợ (AI-Pilot)</h2>
                    {reports.length > 0 && (
                        <span className="bg-orange-100 text-orange-700 text-xs font-bold px-2.5 py-0.5 rounded-full">
                            {reports.length} báo cáo
                        </span>
                    )}
                </div>
                {expanded ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
            </button>

            {expanded && (
                <div className="p-6 border-t border-gray-100 space-y-6 bg-slate-50/30">
                    <div className="bg-gradient-to-r from-orange-50 to-rose-50 border border-orange-100 p-4 rounded-xl flex items-center gap-4">
                        <AlertCircle className="w-6 h-6 text-orange-600 shrink-0" />
                        <div>
                            <h4 className="font-bold text-orange-900 text-sm">Hệ thống AI giám sát thi công</h4>
                            <p className="text-xs text-orange-800">Tự động phát hiện gian lận GPS, Check-in giả mạo và Photo-fraud tại công trường.</p>
                        </div>
                    </div>

                    {loading ? (
                        <div className="flex justify-center py-10">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
                        </div>
                    ) : reports.length === 0 ? (
                        <div className="text-center py-12 bg-white rounded-xl border border-dashed border-gray-200">
                            <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2 opacity-50" />
                            <p className="text-gray-500 font-medium italic">Hiện không có báo cáo gian lận nào cần xử lý</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 gap-4">
                            {reports.map(report => (
                                <div key={report.id} className="bg-white rounded-xl p-5 shadow-sm border border-gray-200 flex flex-col md:flex-row gap-6 hover:border-orange-200 transition-colors group">
                                    <div className="w-full md:w-48 h-48 bg-gray-100 rounded-lg overflow-hidden relative border border-gray-100">
                                        <img src={report.photoUrl} alt="Fraud report" className="w-full h-full object-cover" />
                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                            <a href={report.photoUrl} target="_blank" className="bg-white/90 p-2 rounded-full text-gray-900 hover:bg-white">
                                                <ExternalLink className="w-5 h-5" />
                                            </a>
                                        </div>
                                    </div>
                                    <div className="flex-1 space-y-3">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <h4 className="font-bold text-gray-900 text-lg">{report.workerName}</h4>
                                                <p className="text-xs text-gray-500">{report.workerEmail}</p>
                                            </div>
                                            <div className={`px-3 py-1 rounded-full text-xs font-black tracking-wider ${
                                                report.riskScore > 80 ? 'bg-red-100 text-red-700' : 'bg-orange-100 text-orange-700'
                                            }`}>
                                                RISK: {report.riskScore}%
                                            </div>
                                        </div>
                                        
                                        <div className="grid grid-cols-2 gap-4 text-sm">
                                            <div className="bg-gray-50 p-2 rounded-lg">
                                                <span className="text-gray-500 block text-[10px] uppercase font-bold">Dự án</span>
                                                <span className="font-medium text-gray-800">{report.projectName}</span>
                                            </div>
                                            <div className="bg-gray-50 p-2 rounded-lg">
                                                <span className="text-gray-500 block text-[10px] uppercase font-bold">Hành vi</span>
                                                <span className="font-medium text-gray-800">{report.activityType}</span>
                                            </div>
                                        </div>

                                        <p className="text-xs text-gray-400 font-medium pt-2">
                                            🕒 Phát hiện lúc: {new Date(report.createdAt).toLocaleString('vi-VN')}
                                        </p>
                                    </div>
                                    <div className="flex flex-col gap-2 min-w-[140px] justify-center">
                                        <button
                                            onClick={() => onApprove(report.id)}
                                            className="w-full py-2.5 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition-all text-sm shadow-sm"
                                        >
                                            Xác nhận Gian lận
                                        </button>
                                        <button
                                            onClick={() => onReject(report.id)}
                                            className="w-full py-2.5 bg-gray-100 text-gray-700 font-bold rounded-lg hover:bg-gray-200 transition-all text-sm"
                                        >
                                            Bỏ qua / Nhầm lẫn
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}
