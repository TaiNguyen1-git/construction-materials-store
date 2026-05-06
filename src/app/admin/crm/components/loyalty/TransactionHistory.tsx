'use client'

import { useState, useEffect } from 'react'
import { ScrollText, Filter, ChevronLeft, ChevronRight } from 'lucide-react'
import { toast } from 'react-hot-toast'

const TYPE_MAP: Record<string, { label: string; style: string }> = {
    EARN: { label: 'Tích điểm', style: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
    REDEEM: { label: 'Đổi quà', style: 'bg-blue-50 text-blue-700 border-blue-200' },
    ADJUST: { label: 'Điều chỉnh', style: 'bg-amber-50 text-amber-700 border-amber-200' },
    EXPIRE: { label: 'Hết hạn', style: 'bg-red-50 text-red-700 border-red-200' },
    REFERRAL: { label: 'Giới thiệu', style: 'bg-purple-50 text-purple-700 border-purple-200' },
    CAMPAIGN: { label: 'Chiến dịch', style: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
    EARLY_PAYMENT: { label: 'Trả sớm', style: 'bg-teal-50 text-teal-700 border-teal-200' },
}

export default function TransactionHistory() {
    const [transactions, setTransactions] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [typeFilter, setTypeFilter] = useState('')
    const [page, setPage] = useState(1)
    const [pagination, setPagination] = useState({ total: 0, totalPages: 1 })

    useEffect(() => { fetchTransactions() }, [typeFilter, page])

    const fetchTransactions = async () => {
        setLoading(true)
        try {
            const params = new URLSearchParams({ page: String(page), limit: '20' })
            if (typeFilter) params.set('type', typeFilter)
            const res = await fetch(`/api/admin/loyalty/transactions?${params}`)
            const data = await res.json()
            if (data.success) {
                setTransactions(data.data.transactions)
                setPagination(data.data.pagination)
            }
        } catch { toast.error('Lỗi tải lịch sử') }
        finally { setLoading(false) }
    }

    const fmt = (n: number) => new Intl.NumberFormat('vi-VN').format(n)

    return (
        <div className="space-y-6">
            {/* Header + Filter */}
            <div className="bg-white rounded-[24px] border border-slate-200 p-4 flex flex-col md:flex-row gap-4 items-center justify-between shadow-sm">
                <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-blue-50 rounded-2xl text-blue-600"><ScrollText size={20} /></div>
                    <div>
                        <h3 className="text-sm font-black text-slate-900">Nhật Ký Giao Dịch Điểm</h3>
                        <p className="text-[10px] text-slate-400 font-bold">Tổng: {pagination.total} giao dịch</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <Filter size={14} className="text-slate-400" />
                    <select value={typeFilter} onChange={(e) => { setTypeFilter(e.target.value); setPage(1) }} className="border border-slate-200 rounded-2xl px-4 py-2.5 text-sm font-bold focus:ring-2 focus:ring-blue-500">
                        <option value="">Tất cả loại</option>
                        {Object.entries(TYPE_MAP).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                    </select>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-[24px] border border-slate-100 overflow-hidden shadow-sm">
                <table className="w-full text-left">
                    <thead>
                        <tr className="bg-slate-50/80 border-b border-slate-100 text-[10px] font-black text-slate-400 uppercase tracking-[0.15em]">
                            <th className="px-6 py-4">Khách hàng</th>
                            <th className="px-6 py-4">Loại</th>
                            <th className="px-6 py-4">Điểm</th>
                            <th className="px-6 py-4">Số dư sau</th>
                            <th className="px-6 py-4">Mô tả</th>
                            <th className="px-6 py-4">Thời gian</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                        {loading ? (
                            <tr><td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                                <div className="flex justify-center items-center gap-2"><div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600" /> Đang tải...</div>
                            </td></tr>
                        ) : transactions.length === 0 ? (
                            <tr><td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                                <ScrollText className="w-10 h-10 mx-auto mb-2 text-slate-200" /><p>Chưa có giao dịch nào</p>
                            </td></tr>
                        ) : transactions.map(t => (
                            <tr key={t.id} className="hover:bg-slate-50/50 transition-colors">
                                <td className="px-6 py-4">
                                    <p className="text-sm font-bold text-slate-900">{t.customerName}</p>
                                    <p className="text-xs text-slate-400">{t.customerEmail}</p>
                                </td>
                                <td className="px-6 py-4">
                                    <span className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider border ${TYPE_MAP[t.type]?.style || ''}`}>
                                        {TYPE_MAP[t.type]?.label || t.type}
                                    </span>
                                </td>
                                <td className="px-6 py-4">
                                    <span className={`text-sm font-black ${t.points > 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                                        {t.points > 0 ? '+' : ''}{fmt(t.points)}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-sm font-bold text-slate-600">{fmt(t.balanceAfter)}</td>
                                <td className="px-6 py-4 text-sm text-slate-600 max-w-[200px] truncate">{t.description}</td>
                                <td className="px-6 py-4 text-xs font-bold text-slate-500">{new Date(t.createdAt).toLocaleString('vi-VN')}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
                <div className="flex justify-center items-center gap-4">
                    <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="p-2.5 rounded-xl border border-slate-200 disabled:opacity-30 hover:bg-slate-50"><ChevronLeft size={16} /></button>
                    <span className="text-sm font-bold text-slate-600">Trang {page} / {pagination.totalPages}</span>
                    <button disabled={page >= pagination.totalPages} onClick={() => setPage(p => p + 1)} className="p-2.5 rounded-xl border border-slate-200 disabled:opacity-30 hover:bg-slate-50"><ChevronRight size={16} /></button>
                </div>
            )}
        </div>
    )
}
