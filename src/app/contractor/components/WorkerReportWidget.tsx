'use client'

/**
 * Worker Report Manager Widget
 * Allows contractors to generate magic links and approve site reports
 */

import { useState, useEffect } from 'react'
import { Link2, Copy, CheckCircle2, Clock, Eye, Trash2, Camera, QrCode, ExternalLink, Loader2, AlertTriangle } from 'lucide-react'
import toast from 'react-hot-toast'
import { Badge } from '@/components/ui/badge'

interface WorkerReportWidgetProps {
    projectId: string
}

export default function WorkerReportWidget({ projectId }: WorkerReportWidgetProps) {
    const [tokens, setTokens] = useState<any[]>([])
    const [reports, setReports] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [generating, setGenerating] = useState(false)
    const [activeTab, setActiveTab] = useState<'LINKS' | 'REPORTS'>('REPORTS')

    const fetchData = async () => {
        setLoading(true)
        try {
            const token = localStorage.getItem('access_token')
            // Fetch reports waiting for approval for this project
            const repRes = await fetch(`/api/contractors/projects/${projectId}/reports`, {
                headers: { 'Authorization': `Bearer ${token}` }
            })
            const repData = await repRes.json()
            if (repRes.ok) setReports(repData.data || [])

            // Fetch active links for this project
            const tokRes = await fetch(`/api/contractors/projects/${projectId}/report-token`, {
                headers: { 'Authorization': `Bearer ${token}` }
            })
            const tokData = await tokRes.json()
            if (tokRes.ok) {
                const tokensArr = Array.isArray(tokData.data?.tokens) ? tokData.data.tokens : (tokData.data?.token ? [tokData.data] : [])
                setTokens(tokensArr)
            }
        } catch (err) {
            console.error('Fetch error:', err)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchData()
    }, [projectId])

    const generateLink = async () => {
        setGenerating(true)
        try {
            const token = localStorage.getItem('access_token')
            const res = await fetch(`/api/contractors/projects/${projectId}/report-token`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            })
            if (res.ok) {
                toast.success('Đã tạo link báo cáo mới')
                fetchData()
            }
        } catch (err) {
            toast.error('Lỗi tạo link')
        } finally {
            setGenerating(false)
        }
    }

    const copyLink = (url: string) => {
        navigator.clipboard.writeText(url)
        toast.success('Đã sao chép link')
    }

    const handleReportAction = async (reportId: string, status: 'APPROVED' | 'REJECTED') => {
        try {
            const token = localStorage.getItem('access_token')
            const res = await fetch(`/api/contractors/reports/${reportId}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ status })
            })
            if (res.ok) {
                toast.success(status === 'APPROVED' ? 'Đã duyệt báo cáo' : 'Đã từ chối báo cáo')
                fetchData()
            }
        } catch (err) {
            toast.error('Lỗi xử lý')
        }
    }

    return (
        <div className="bg-white rounded-3xl border border-gray-100 shadow-xl overflow-hidden h-full flex flex-col">
            <div className="p-6 border-b border-gray-50 bg-gray-50/50 flex items-center justify-between">
                <div>
                    <h3 className="font-bold text-gray-900 flex items-center gap-2">
                        <Camera className="w-5 h-5 text-blue-600" />
                        Nghiệm thu báo cáo ảnh
                    </h3>
                    <p className="text-[10px] text-gray-500 font-medium uppercase mt-1">Từ thợ tại công trường</p>
                </div>
                <div className="flex bg-gray-200/50 p-1 rounded-xl">
                    <button
                        onClick={() => setActiveTab('REPORTS')}
                        className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${activeTab === 'REPORTS' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500'}`}
                    >
                        Chờ duyệt ({reports.length})
                    </button>
                    <button
                        onClick={() => setActiveTab('LINKS')}
                        className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${activeTab === 'LINKS' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500'}`}
                    >
                        Gửi thợ
                    </button>
                </div>
            </div>

            <div className="p-6 flex-1 overflow-y-auto max-h-[400px]">
                {loading ? (
                    <div className="flex items-center justify-center h-40">
                        <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
                    </div>
                ) : activeTab === 'REPORTS' ? (
                    <div className="space-y-4">
                        {reports.length === 0 ? (
                            <div className="text-center py-10">
                                <CheckCircle2 className="w-10 h-10 text-gray-200 mx-auto mb-2" />
                                <p className="text-sm text-gray-400 font-medium">Chưa có báo cáo mới nào cần duyệt</p>
                            </div>
                        ) : (
                            reports.map(r => (
                                <div key={r.id} className={`bg-gray-50 rounded-2xl p-4 border group animate-in slide-in-from-right-2 ${r.customerStatus === 'DISPUTED' ? 'border-red-200 bg-red-50/30' : 'border-gray-100'}`}>
                                    <div className="flex gap-4">
                                        <div className="relative w-24 h-24 rounded-xl overflow-hidden border border-gray-200 flex-shrink-0">
                                            <img src={r.photoUrl} className="w-full h-full object-cover" />
                                            {r.imageHash && reports.filter(other => other.imageHash === r.imageHash && other.id !== r.id).length > 0 && (
                                                <div className="absolute inset-0 bg-red-500/80 backdrop-blur-sm flex flex-col items-center justify-center text-white p-2">
                                                    <AlertTriangle className="w-5 h-5 mb-1" />
                                                    <span className="text-[8px] font-black text-center leading-tight uppercase">Ảnh trùng lặp (Cẩn thận!)</span>
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between mb-1">
                                                <h4 className="font-bold text-gray-900 truncate">Thợ: {r.workerName}</h4>
                                                <span className="text-[10px] text-gray-400 font-bold">{new Date(r.createdAt).toLocaleTimeString('vi-VN')}</span>
                                            </div>

                                            {r.customerStatus === 'DISPUTED' ? (
                                                <div className="mb-3">
                                                    <Badge className="bg-red-500 text-white mb-1">KHÁCH KHIẾU NẠI</Badge>
                                                    <p className="text-[10px] text-red-600 font-bold italic">Lý do: {r.rejectionReason}</p>
                                                </div>
                                            ) : (
                                                <p className="text-xs text-gray-600 line-clamp-2 italic mb-3">"{r.notes || 'Không có ghi chú'}"</p>
                                            )}

                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => handleReportAction(r.id, 'APPROVED')}
                                                    className="flex-1 py-1.5 bg-blue-600 text-white text-[10px] font-bold rounded-lg hover:bg-blue-700 font-black shadow-lg shadow-blue-100"
                                                >
                                                    Duyệt
                                                </button>
                                                <button
                                                    onClick={() => handleReportAction(r.id, 'REJECTED')}
                                                    className="flex-1 py-1.5 bg-white text-red-500 border border-red-100 text-[10px] font-bold rounded-lg hover:bg-red-50"
                                                >
                                                    Hủy
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                ) : (
                    <div className="space-y-4">
                        <button
                            onClick={generateLink}
                            disabled={generating}
                            className="w-full py-3 bg-blue-50 text-blue-600 border border-blue-100 border-dashed rounded-2xl flex items-center justify-center gap-2 text-xs font-bold hover:bg-blue-100 transition-all font-sans"
                        >
                            {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <QrCode className="w-4 h-4" />}
                            Tạo Link/QR Cho Công Trường
                        </button>

                        <div className="space-y-3">
                            {tokens.map(t => (
                                <div key={t.token} className="p-4 bg-white border border-gray-100 rounded-2xl flex items-center justify-between hover:shadow-md transition-all">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center">
                                            <QrCode className="w-5 h-5 text-gray-400" />
                                        </div>
                                        <div>
                                            <p className="text-xs font-bold text-gray-900">Token: {t.token}</p>
                                            <p className="text-[10px] text-gray-400">Hết hạn sau 7 ngày</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-1">
                                        <button
                                            onClick={() => copyLink(`${window.location.protocol}//${window.location.host}/report/${t.token}`)}
                                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                                            title="Copy Link"
                                        >
                                            <Copy className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            <div className="p-4 bg-gray-50 border-t border-gray-100 text-[10px] text-center font-bold text-gray-400 uppercase tracking-widest">
                Đảm bảo minh bạch cho khách hàng
            </div>
        </div>
    )
}
