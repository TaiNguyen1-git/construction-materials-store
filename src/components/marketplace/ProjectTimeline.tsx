'use client'

/**
 * Project Tracking Timeline
 * Visual representation of milestones and their payment statuses
 */

import { useState } from 'react'
import { CheckCircle2, Circle, Clock, DollarSign, Image as ImageIcon, ArrowRight, ShieldCheck, Loader2, Send, X } from 'lucide-react'
import toast from 'react-hot-toast'

interface Milestone {
    id: string
    name: string
    percentage: number
    amount: number
    status: 'PENDING' | 'ESCROW_PAID' | 'COMPLETED' | 'RELEASED'
    paidAt: string | null
    evidenceUrl?: string | null
    evidenceNotes?: string | null
}

interface ProjectTimelineProps {
    milestones: Milestone[]
    onUpdate: () => void
    isOwner: boolean
}

export default function ProjectTimeline({ milestones, onUpdate, isOwner }: ProjectTimelineProps) {
    const [updating, setUpdating] = useState<string | null>(null)
    const [showEvidenceForm, setShowEvidenceForm] = useState<string | null>(null)
    const [evidenceNote, setEvidenceNote] = useState('')
    const [viewEvidence, setViewEvidence] = useState<Milestone | null>(null)

    const handleAction = async (milestoneId: string, action: 'RELEASE' | 'COMPLETE', data?: any) => {
        setUpdating(milestoneId)
        try {
            const token = localStorage.getItem('access_token')
            const res = await fetch(`/api/milestones/${milestoneId}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': token ? `Bearer ${token}` : ''
                },
                body: JSON.stringify({
                    action,
                    evidenceNote: data?.note,
                    evidenceImage: data?.image || 'https://picsum.photos/seed/' + milestoneId + '/600/400'
                })
            })

            if (res.ok) {
                toast.success(action === 'RELEASE' ? 'Đã giải ngân tiền cho thợ!' : 'Đã nộp bằng chứng nghiệm thu!')
                setShowEvidenceForm(null)
                setEvidenceNote('')
                onUpdate()
            } else {
                const data = await res.json()
                toast.error(data.error?.message || 'Có lỗi xảy ra')
            }
        } catch (err) {
            toast.error('Lỗi kết nối')
        } finally {
            setUpdating(null)
        }
    }

    const getStatusInfo = (status: string) => {
        switch (status) {
            case 'RELEASED': return { icon: <CheckCircle2 className="w-5 h-5 text-green-600" />, label: 'Đã thanh toán', color: 'text-green-600' }
            case 'COMPLETED': return { icon: <Clock className="w-5 h-5 text-blue-600" />, label: 'Chờ nghiệm thu', color: 'text-blue-600' }
            case 'ESCROW_PAID': return { icon: <ShieldCheck className="w-5 h-5 text-amber-600" />, label: 'Tiền đã ký quỹ', color: 'text-amber-600' }
            default: return { icon: <Circle className="w-5 h-5 text-gray-300" />, label: 'Chưa thực hiện', color: 'text-gray-400' }
        }
    }

    const formatCurrency = (amount: number) => new Intl.NumberFormat('vi-VN').format(amount) + 'đ'

    return (
        <div className="bg-white rounded-3xl border border-gray-100 shadow-xl overflow-hidden">
            <div className="p-6 border-b border-gray-50 bg-gray-50/50 flex items-center justify-between">
                <h3 className="font-bold text-gray-900 flex items-center gap-2 text-lg">
                    <Clock className="w-6 h-6 text-blue-600" />
                    Tiến độ hợp đồng & Giải ngân
                </h3>
                <div className="flex items-center gap-1 text-[10px] uppercase font-bold text-blue-600 tracking-wider bg-blue-50 px-3 py-1 rounded-full">
                    <ShieldCheck className="w-3 h-3" />
                    Bảo mật Escrow
                </div>
            </div>

            <div className="p-8 relative">
                <div className="absolute left-[2.75rem] top-12 bottom-12 w-0.5 bg-gradient-to-b from-blue-100 via-gray-100 to-transparent" />

                <div className="space-y-10">
                    {milestones.map((m) => {
                        const { icon, label, color } = getStatusInfo(m.status)
                        return (
                            <div key={m.id} className="relative flex items-start gap-6 group">
                                <div className="z-10 bg-white p-2 rounded-full border border-gray-50 shadow-sm group-hover:scale-110 transition-transform">
                                    {icon}
                                </div>
                                <div className="flex-1">
                                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2 mb-3">
                                        <div>
                                            <h4 className="font-bold text-gray-900 text-lg">{m.name}</h4>
                                            <div className="flex items-center gap-2">
                                                <span className={`text-xs font-bold uppercase tracking-wider ${color}`}>{label}</span>
                                                {m.evidenceUrl && (
                                                    <button
                                                        onClick={() => setViewEvidence(m)}
                                                        className="text-[10px] text-blue-600 hover:underline flex items-center gap-1 font-bold"
                                                    >
                                                        <ImageIcon className="w-3 h-3" /> Xem bằng chứng
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                        <div className="text-left sm:text-right">
                                            <p className="font-black text-gray-900 text-xl">{formatCurrency(m.amount)}</p>
                                            <p className="text-xs text-gray-400 font-medium">{m.percentage}% giá trị hợp đồng</p>
                                        </div>
                                    </div>

                                    <div className="mt-4">
                                        {!isOwner && m.status === 'ESCROW_PAID' && (
                                            showEvidenceForm === m.id ? (
                                                <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100">
                                                    <textarea
                                                        placeholder="Mô tả công việc đã làm..."
                                                        className="w-full bg-white border border-blue-200 rounded-xl p-3 text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-blue-400 transition-all"
                                                        rows={2}
                                                        value={evidenceNote}
                                                        onChange={(e) => setEvidenceNote(e.target.value)}
                                                    />
                                                    <div className="flex gap-2">
                                                        <button
                                                            onClick={() => handleAction(m.id, 'COMPLETE', { note: evidenceNote })}
                                                            disabled={updating === m.id}
                                                            className="flex-1 py-2 bg-blue-600 text-white text-xs font-bold rounded-xl hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2"
                                                        >
                                                            {updating === m.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                                                            Nộp bằng chứng & Gửi nghiệm thu
                                                        </button>
                                                        <button
                                                            onClick={() => setShowEvidenceForm(null)}
                                                            className="px-4 py-2 bg-white text-gray-500 text-xs font-bold rounded-xl border border-gray-200"
                                                        >
                                                            Hủy
                                                        </button>
                                                    </div>
                                                </div>
                                            ) : (
                                                <button
                                                    onClick={() => setShowEvidenceForm(m.id)}
                                                    className="px-4 py-2 bg-blue-600 text-white text-xs font-bold rounded-xl hover:bg-blue-700 transition-all flex items-center gap-2 shadow-lg shadow-blue-100"
                                                >
                                                    <ImageIcon className="w-4 h-4" /> Báo cáo hoàn thành (Nghiệm thu)
                                                </button>
                                            )
                                        )}

                                        {isOwner && m.status === 'COMPLETED' && (
                                            <div className="flex flex-col gap-3">
                                                <div className="bg-blue-50/50 p-3 rounded-xl border border-blue-100 flex items-center gap-3">
                                                    <Clock className="w-10 h-10 text-blue-200" />
                                                    <p className="text-xs text-blue-800 leading-relaxed font-medium">
                                                        Thợ đã xong việc. Hãy nhấn <span className="font-bold underline cursor-pointer" onClick={() => setViewEvidence(m)}>"Xem bằng chứng"</span> trước khi giải ngân.
                                                    </p>
                                                </div>
                                                <button
                                                    onClick={() => handleAction(m.id, 'RELEASE')}
                                                    disabled={updating === m.id}
                                                    className="w-full py-3 bg-green-600 text-white text-sm font-bold rounded-xl hover:bg-green-700 disabled:opacity-50 flex items-center justify-center gap-2 shadow-xl shadow-green-100"
                                                >
                                                    {updating === m.id ? <Loader2 className="w-5 h-5 animate-spin" /> : <DollarSign className="w-5 h-5" />}
                                                    Tất cả đã ổn, Giải ngân ngay cho thợ!
                                                </button>
                                            </div>
                                        )}

                                        {m.status === 'RELEASED' && (
                                            <div className="flex items-center gap-2 text-xs text-green-600 font-bold bg-green-50 px-3 py-2 rounded-xl border border-green-100 w-fit">
                                                <CheckCircle2 className="w-4 h-4" />
                                                Hoàn tất: Tiền đã được chuyển vào ví thợ
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )
                    })}
                </div>
            </div>

            {viewEvidence && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                    <div className="bg-white rounded-3xl w-full max-w-2xl overflow-hidden">
                        <div className="p-4 border-b flex items-center justify-between">
                            <h3 className="font-bold text-gray-900">Bằng chứng nghiệm thu: {viewEvidence.name}</h3>
                            <button onClick={() => setViewEvidence(null)} className="p-2 hover:bg-gray-100 rounded-full text-gray-500">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="p-6">
                            <img
                                src={viewEvidence.evidenceUrl || ''}
                                className="w-full h-80 object-cover rounded-2xl mb-4 border"
                                alt="Evidence"
                            />
                            <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Ghi chú từ thợ</p>
                                <p className="text-sm text-gray-700 leading-relaxed italic">
                                    "{viewEvidence.evidenceNotes || 'Không có ghi chú.'}"
                                </p>
                            </div>
                        </div>
                        <div className="p-4 bg-gray-50 text-center">
                            <button
                                onClick={() => setViewEvidence(null)}
                                className="px-8 py-2 bg-gray-900 text-white text-sm font-bold rounded-xl"
                            >
                                Đóng
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className="p-4 bg-amber-50 mx-6 mb-6 rounded-2xl border border-amber-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-amber-600" />
                    <span className="text-xs text-amber-800 font-medium tracking-tight">An tâm giao dịch với hệ thống Ký quỹ (Escrow) của SmartBuild</span>
                </div>
                <ArrowRight className="w-4 h-4 text-amber-300" />
            </div>
        </div>
    )
}
