'use client'

import React from 'react'
import { CheckCircle, Search, ChevronLeft, ChevronRight } from 'lucide-react'
import { CashItem, formatCurrency } from '../types'

interface CashTabProps {
    cashItems: CashItem[]
    cashHistoryItems: CashItem[]
    cashSearchTerm: string
    setCashSearchTerm: (v: string) => void
    cashPage: number
    setCashPage: React.Dispatch<React.SetStateAction<number>>
    cashHistoryPage: number
    setCashHistoryPage: React.Dispatch<React.SetStateAction<number>>
    onConfirmCash: (id: string) => void
    ITEMS_PER_PAGE: number
}

function buildPageRange(currentPage: number, totalPages: number): (number | '...')[] {
    const delta = 1
    const range: (number | '...')[] = []
    for (let i = Math.max(2, currentPage - delta); i <= Math.min(totalPages - 1, currentPage + delta); i++) {
        range.push(i)
    }
    if (currentPage - delta > 2) range.unshift('...')
    range.unshift(1)
    if (currentPage + delta < totalPages - 1) range.push('...')
    if (totalPages > 1) range.push(totalPages)
    return range
}

export default function CashTab({
    cashItems, cashHistoryItems,
    cashSearchTerm, setCashSearchTerm,
    cashPage, setCashPage,
    cashHistoryPage, setCashHistoryPage,
    onConfirmCash,
    ITEMS_PER_PAGE,
}: CashTabProps) {
    const filteredPending = cashItems.filter(item =>
        item.orderNumber.toLowerCase().includes(cashSearchTerm.toLowerCase()) ||
        item.customerName.toLowerCase().includes(cashSearchTerm.toLowerCase())
    )
    const paginatedPending = filteredPending.slice((cashPage - 1) * ITEMS_PER_PAGE, cashPage * ITEMS_PER_PAGE)
    const totalPendingPages = Math.ceil(filteredPending.length / ITEMS_PER_PAGE)

    const filteredHistory = cashHistoryItems.filter(item =>
        item.orderNumber.toLowerCase().includes(cashSearchTerm.toLowerCase()) ||
        item.customerName.toLowerCase().includes(cashSearchTerm.toLowerCase())
    )
    const paginatedHistory = filteredHistory.slice((cashHistoryPage - 1) * ITEMS_PER_PAGE, cashHistoryPage * ITEMS_PER_PAGE)
    const totalHistoryPages = Math.ceil(filteredHistory.length / ITEMS_PER_PAGE)

    const pendingPages = buildPageRange(cashPage, totalPendingPages)
    const historyPages = buildPageRange(cashHistoryPage, totalHistoryPages)

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Search & Summary bar */}
            <div className="flex flex-col md:flex-row gap-6 justify-between items-center bg-white/50 backdrop-blur-md p-6 rounded-[32px] border border-white shadow-sm ring-1 ring-slate-100">
                <div className="relative w-full md:w-[450px] group">
                    <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-500 transition-colors">
                        <Search className="w-4 h-4" />
                    </div>
                    <input
                        type="text"
                        placeholder="Tìm theo mã đơn hoặc tên khách..."
                        value={cashSearchTerm}
                        onChange={(e) => setCashSearchTerm(e.target.value)}
                        className="w-full pl-12 pr-4 py-4 bg-white border border-slate-100 rounded-2xl text-[13px] font-bold text-slate-700 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5 transition-all outline-none shadow-sm"
                    />
                </div>
                <div className="flex items-center gap-3 shrink-0">
                    <div className="px-5 py-3 bg-blue-50 rounded-2xl text-[10px] font-black text-blue-600 uppercase tracking-widest ring-1 ring-blue-100 shadow-sm shadow-blue-500/5">
                        Tổng cộng: {cashItems.length} đơn chờ đối soát
                    </div>
                </div>
            </div>

            {/* Pending table */}
            <div className="space-y-4">
                <div className="flex items-center justify-between px-2">
                    <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-3">
                        <div className="w-2 h-6 bg-blue-600 rounded-full shadow-lg shadow-blue-500/20" />
                        Chờ nộp tiền mặt (COD)
                    </h3>
                </div>
                <div className="overflow-hidden rounded-[32px] border border-white bg-white/80 backdrop-blur-sm shadow-xl shadow-slate-200/40 ring-1 ring-slate-200/50">
                    <table className="w-full text-left table-fixed">
                        <thead className="bg-slate-50/80 border-b border-slate-100/60">
                            <tr>
                                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest w-[45%]">Đơn hàng & Khách hàng</th>
                                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right w-[25%]">Số tiền thu</th>
                                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center w-[30%]">Thao tác đối soát</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100/60">
                            {filteredPending.length === 0 ? (
                                <tr>
                                    <td colSpan={3} className="py-24 text-center">
                                        <div className="flex flex-col items-center gap-4">
                                            <div className="w-20 h-20 bg-slate-50 rounded-[28px] flex items-center justify-center text-slate-200 shadow-inner">
                                                <Search className="w-8 h-8" />
                                            </div>
                                            <p className="text-xs font-black text-slate-400 uppercase tracking-widest italic">
                                                {cashSearchTerm ? 'Không tìm thấy dữ liệu phù hợp' : 'Hôm nay đã đối soát hoàn tất!'}
                                            </p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                <>
                                    {paginatedPending.map(item => (
                                        <tr key={item.id} className="hover:bg-blue-50/30 transition-all group">
                                            <td className="px-8 py-6">
                                                <div className="flex flex-col gap-1.5">
                                                    <span className="text-blue-600 font-black tracking-widest uppercase text-[9px] bg-blue-50 px-2 py-0.5 rounded-md self-start ring-1 ring-blue-100 shadow-sm">
                                                        #{item.orderNumber}
                                                    </span>
                                                    <span className="text-sm font-black text-slate-900 truncate tracking-tight">{item.customerName}</span>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6 text-right">
                                                <p className="text-lg font-black text-slate-900 tracking-tighter">{formatCurrency(item.amount)}</p>
                                            </td>
                                            <td className="px-8 py-6 text-center">
                                                <button
                                                    onClick={() => onConfirmCash(item.id)}
                                                    className="bg-emerald-600 text-white px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-emerald-500/20 hover:bg-emerald-700 hover:-translate-y-0.5 transition-all flex items-center gap-2 mx-auto ring-1 ring-white/20"
                                                >
                                                    <CheckCircle className="w-4 h-4" />
                                                    <span>Xác nhận nộp tiền</span>
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                    {totalPendingPages > 1 && (
                                        <tr>
                                            <td colSpan={3} className="px-8 py-5 bg-slate-50/30">
                                                <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
                                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em]">
                                                        Trang <span className="text-blue-600 uppercase tracking-widest">{cashPage}</span> trên {totalPendingPages} ({filteredPending.length} bản ghi)
                                                    </p>
                                                    <div className="flex items-center gap-2">
                                                        <button disabled={cashPage === 1} onClick={() => setCashPage(p => p - 1)} className="p-2.5 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 disabled:opacity-30 transition-all shadow-sm">
                                                            <ChevronLeft className="w-4 h-4 text-slate-600" />
                                                        </button>
                                                        <div className="flex items-center gap-1.5">
                                                            {pendingPages.map((p, idx) => (
                                                                p === '...'
                                                                    ? <span key={`gap-${idx}`} className="px-2 text-slate-300 font-black text-xs">...</span>
                                                                    : <button key={`page-${p}`} onClick={() => setCashPage(p as number)} className={`w-9 h-9 rounded-xl text-[11px] font-black transition-all ${cashPage === p ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'bg-white text-slate-500 hover:text-blue-600 border border-slate-200'}`}>{p}</button>
                                                            ))}
                                                        </div>
                                                        <button disabled={cashPage === totalPendingPages} onClick={() => setCashPage(p => p + 1)} className="p-2.5 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 disabled:opacity-30 transition-all shadow-sm">
                                                            <ChevronRight className="w-4 h-4 text-slate-600" />
                                                        </button>
                                                    </div>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* History table */}
            {cashHistoryItems.length > 0 && (
                <div className="space-y-4">
                    <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-3 px-2">
                        <div className="w-2 h-6 bg-emerald-500 rounded-full shadow-lg shadow-emerald-500/20" />
                        Lịch sử đối soát (Đã nhận tiền)
                    </h3>
                    <div className="overflow-hidden rounded-[32px] border border-slate-100 bg-white shadow-sm ring-1 ring-slate-100 opacity-90">
                        <table className="w-full text-left table-fixed">
                            <thead className="bg-slate-50/50 border-b border-slate-100">
                                <tr>
                                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest w-[40%]">Đơn hàng</th>
                                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest w-[25%]">Tài xế giao</th>
                                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right w-[15%]">Số tiền</th>
                                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center w-[20%]">Thời gian nộp</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 italic font-medium">
                                {filteredHistory.length === 0 ? (
                                    <tr><td colSpan={4} className="py-12 text-center text-slate-300 font-bold italic">Không tìm thấy lịch sử phù hợp</td></tr>
                                ) : (
                                    <>
                                        {paginatedHistory.map(item => (
                                            <tr key={item.id} className="bg-slate-50/30 opacity-70 hover:opacity-100 transition-opacity group">
                                                <td className="px-8 py-5">
                                                    <span className="text-[10px] font-black mr-2 text-slate-400">#{item.orderNumber}</span>
                                                    <span className="text-xs font-bold text-slate-600 truncate">{item.customerName}</span>
                                                </td>
                                                <td className="px-8 py-5 text-slate-500 text-xs truncate font-bold">{item.driverName}</td>
                                                <td className="px-8 py-5 text-right font-black text-slate-600 text-sm tracking-tight">{formatCurrency(item.amount)}</td>
                                                <td className="px-8 py-5 text-center text-[10px] text-slate-400 font-black uppercase tracking-wider">
                                                    {item.cashHandedOverAt
                                                        ? new Date(item.cashHandedOverAt).toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' })
                                                        : 'N/A'}
                                                </td>
                                            </tr>
                                        ))}
                                    </>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    )
}
