'use client'

import { useState, useEffect } from 'react'
import { Ticket, Filter, ChevronLeft, ChevronRight } from 'lucide-react'
import { toast } from 'react-hot-toast'

const STATUS_MAP: Record<string, { label: string; style: string }> = {
    UNUSED: { label: 'Chưa dùng', style: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
    USED: { label: 'Đã dùng', style: 'bg-blue-50 text-blue-700 border-blue-200' },
    EXPIRED: { label: 'Hết hạn', style: 'bg-red-50 text-red-700 border-red-200' },
}

export default function VoucherManagement() {
    const [vouchers, setVouchers] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [statusFilter, setStatusFilter] = useState('')
    const [page, setPage] = useState(1)
    const [pagination, setPagination] = useState({ total: 0, totalPages: 1 })

    useEffect(() => { fetchVouchers() }, [statusFilter, page])

    const fetchVouchers = async () => {
        setLoading(true)
        try {
            const params = new URLSearchParams({ page: String(page), limit: '15' })
            if (statusFilter) params.set('status', statusFilter)
            const res = await fetch(`/api/admin/loyalty/vouchers?${params}`)
            const data = await res.json()
            if (data.success) {
                setVouchers(data.data.vouchers)
                setPagination(data.data.pagination)
            }
        } catch { toast.error('Lỗi tải voucher') }
        finally { setLoading(false) }
    }

    const fmt = (n: number) => new Intl.NumberFormat('vi-VN').format(n)

    return (
        <div className="space-y-6">
            {/* Header + Filter */}
            <div className="bg-white rounded-[24px] border border-slate-200 p-4 flex flex-col md:flex-row gap-4 items-center justify-between shadow-sm">
                <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-blue-50 rounded-2xl text-blue-600"><Ticket size={20} /></div>
                    <div>
                        <h3 className="text-sm font-black text-slate-900">Quản Lý Voucher</h3>
                        <p className="text-[10px] text-slate-400 font-bold">Tổng: {pagination.total} voucher</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <Filter size={14} className="text-slate-400" />
                    <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1) }} className="border border-slate-200 rounded-2xl px-4 py-2.5 text-sm font-bold focus:ring-2 focus:ring-blue-500">
                        <option value="">Tất cả trạng thái</option>
                        <option value="UNUSED">Chưa dùng</option>
                        <option value="USED">Đã dùng</option>
                        <option value="EXPIRED">Hết hạn</option>
                    </select>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-[24px] border border-slate-100 overflow-hidden shadow-sm">
                <table className="w-full text-left">
                    <thead>
                        <tr className="bg-slate-50/80 border-b border-slate-100 text-[10px] font-black text-slate-400 uppercase tracking-[0.15em]">
                            <th className="px-6 py-4">Mã voucher</th>
                            <th className="px-6 py-4">Khách hàng</th>
                            <th className="px-6 py-4">Giá trị</th>
                            <th className="px-6 py-4">Điểm đã đổi</th>
                            <th className="px-6 py-4">Trạng thái</th>
                            <th className="px-6 py-4">Ngày đổi</th>
                            <th className="px-6 py-4">Hạn dùng</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                        {loading ? (
                            <tr><td colSpan={7} className="px-6 py-12 text-center text-slate-400">
                                <div className="flex justify-center items-center gap-2"><div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600" /> Đang tải...</div>
                            </td></tr>
                        ) : vouchers.length === 0 ? (
                            <tr><td colSpan={7} className="px-6 py-12 text-center text-slate-400">
                                <Ticket className="w-10 h-10 mx-auto mb-2 text-slate-200" /><p>Chưa có voucher nào</p>
                            </td></tr>
                        ) : vouchers.map(v => (
                            <tr key={v.id} className="hover:bg-slate-50/50 transition-colors">
                                <td className="px-6 py-4"><span className="font-mono font-bold text-sm text-blue-600">{v.code}</span></td>
                                <td className="px-6 py-4">
                                    <p className="font-bold text-sm text-slate-900">{v.customerName}</p>
                                    <p className="text-xs text-slate-400">{v.customerEmail}</p>
                                </td>
                                <td className="px-6 py-4 font-bold text-sm text-slate-900">{fmt(v.value)}đ</td>
                                <td className="px-6 py-4 font-bold text-sm text-slate-600">{fmt(v.pointsUsed)}</td>
                                <td className="px-6 py-4">
                                    <span className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider border ${STATUS_MAP[v.status]?.style || ''}`}>
                                        {STATUS_MAP[v.status]?.label || v.status}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-xs font-bold text-slate-500">{new Date(v.redeemedAt).toLocaleDateString('vi-VN')}</td>
                                <td className="px-6 py-4 text-xs font-bold text-slate-500">{v.expiryDate ? new Date(v.expiryDate).toLocaleDateString('vi-VN') : '—'}</td>
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
