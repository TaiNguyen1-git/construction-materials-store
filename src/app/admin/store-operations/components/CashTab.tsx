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
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Search & Summary bar */}
            <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-white p-4 rounded-3xl border border-slate-100 shadow-sm">
                <div className="relative w-full md:w-96 group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-500 transition-colors">
                        <Search className="w-4 h-4" />
                    </div>
                    <input
                        type="text"
                        placeholder="Tìm theo mã đơn hoặc tên khách..."
                        value={cashSearchTerm}
                        onChange={(e) => setCashSearchTerm(e.target.value)}
                        className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-bold focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all outline-none"
                    />
                    {cashSearchTerm && (
                        <button
                            onClick={() => setCashSearchTerm('')}
                            className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-red-500 transition-colors"
                        >
                            <span className="text-[10px] font-black uppercase">Xóa</span>
                        </button>
                    )}
                </div>
                <div className="flex items-center gap-3 shrink-0">
                    <div className="px-4 py-2.5 bg-blue-50 rounded-xl text-[10px] font-black text-blue-600 uppercase tracking-widest leading-none">
                        Tổng cộng: {cashItems.length} đơn
                    </div>
                </div>
            </div>

            {/* Pending table */}
            <div className="space-y-4">
                <h3 className="text-base font-black text-slate-900 flex items-center gap-2 px-2">
                    <div className="w-2 h-6 bg-blue-500 rounded-full" />
                    Chờ nộp tiền mặt
                </h3>
                <div className="overflow-hidden rounded-[32px] border border-slate-100 bg-white shadow-sm">
                    <table className="w-full text-left table-fixed">
                        <thead className="bg-slate-50 border-b border-slate-100">
                            <tr>
                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest w-1/2">Đơn hàng</th>
                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right w-1/4">Số tiền</th>
                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center w-1/4">Hành động</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filteredPending.length === 0 ? (
                                <tr>
                                    <td colSpan={3} className="py-20 text-center">
                                        <div className="flex flex-col items-center gap-3">
                                            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center text-slate-300">
                                                <Search className="w-8 h-8" />
                                            </div>
                                            <p className="text-slate-400 font-bold italic">
                                                {cashSearchTerm ? 'Không tìm thấy đơn hàng phù hợp' : 'Hôm nay đã đối soát hết!'}
                                            </p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                <>
                                    {paginatedPending.map(item => (
                                        <tr key={item.id} className="hover:bg-slate-50/50 transition-colors group">
                                            <td className="px-6 py-5 font-bold text-slate-900 truncate">
                                                <div className="flex flex-col lg:flex-row lg:items-center gap-1 lg:gap-3">
                                                    <span className="text-blue-600 font-black tracking-wider uppercase text-[10px] bg-blue-50 px-2 py-0.5 rounded-md self-start shrink-0">
                                                        {item.orderNumber}
                                                    </span>
                                                    <span className="truncate">{item.customerName}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-5 text-right font-black text-slate-900 truncate">
                                                {formatCurrency(item.amount)}
                                            </td>
                                            <td className="px-6 py-5 text-center">
                                                <button
                                                    onClick={() => onConfirmCash(item.id)}
                                                    className="bg-emerald-500 text-white px-5 py-2.5 rounded-xl text-xs font-black shadow-lg shadow-emerald-200 hover:scale-105 transition-all active:scale-95 flex items-center gap-2 mx-auto"
                                                >
                                                    <CheckCircle className="w-4 h-4" />
                                                    <span className="hidden xl:inline">Xác nhận nhận tiền</span>
                                                    <span className="xl:hidden">Xác nhận</span>
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                    {totalPendingPages > 1 && (
                                        <tr>
                                            <td colSpan={3} className="px-6 py-4 bg-slate-50/50">
                                                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                                        Trang {cashPage} / {totalPendingPages} ({filteredPending.length} đơn)
                                                    </p>
                                                    <div className="flex items-center gap-1.5">
                                                        <button disabled={cashPage === 1} onClick={() => setCashPage(p => p - 1)} className="p-2 bg-white border border-slate-100 rounded-xl hover:bg-slate-50 disabled:opacity-30 transition-all shadow-sm">
                                                            <ChevronLeft className="w-3.5 h-3.5" />
                                                        </button>
                                                        <div className="flex items-center gap-1">
                                                            {pendingPages.map((p, idx) => (
                                                                p === '...'
                                                                    ? <span key={`gap-${idx}`} className="px-2 text-slate-300 font-black text-xs">...</span>
                                                                    : <button key={`page-${p}`} onClick={() => setCashPage(p as number)} className={`w-8 h-8 rounded-xl text-[10px] font-black transition-all ${cashPage === p ? 'bg-blue-600 text-white shadow-md shadow-blue-200 scale-110' : 'bg-white text-slate-400 hover:bg-slate-50 border border-slate-100'}`}>{p}</button>
                                                            ))}
                                                        </div>
                                                        <button disabled={cashPage === totalPendingPages} onClick={() => setCashPage(p => p + 1)} className="p-2 bg-white border border-slate-100 rounded-xl hover:bg-slate-50 disabled:opacity-30 transition-all shadow-sm">
                                                            <ChevronRight className="w-3.5 h-3.5" />
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
                    <h3 className="text-base font-black text-slate-900 flex items-center gap-2 px-2">
                        <div className="w-2 h-6 bg-emerald-500 rounded-full" />
                        Lịch sử nộp tiền mặt
                    </h3>
                    <div className="overflow-hidden rounded-[32px] border border-slate-100 bg-white shadow-sm">
                        <table className="w-full text-left table-fixed">
                            <thead className="bg-slate-50 border-b border-slate-100">
                                <tr>
                                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest w-[40%]">Đơn hàng</th>
                                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest w-[25%]">Tài xế giao</th>
                                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right w-[15%]">Số tiền</th>
                                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center w-[20%]">Thời gian nộp</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 italic">
                                {filteredHistory.length === 0 ? (
                                    <tr><td colSpan={4} className="py-10 text-center text-slate-300 font-bold italic">Không tìm thấy lịch sử phù hợp</td></tr>
                                ) : (
                                    <>
                                        {paginatedHistory.map(item => (
                                            <tr key={item.id} className="bg-slate-50/30 opacity-70">
                                                <td className="px-6 py-5 font-bold text-slate-500 text-sm truncate">{item.orderNumber} - {item.customerName}</td>
                                                <td className="px-6 py-5 text-slate-400 font-medium text-xs truncate">{item.driverName}</td>
                                                <td className="px-6 py-5 text-right font-black text-slate-400 text-sm">{formatCurrency(item.amount)}</td>
                                                <td className="px-6 py-5 text-center text-[10px] text-slate-400 font-black uppercase">
                                                    {item.cashHandedOverAt
                                                        ? new Date(item.cashHandedOverAt).toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' })
                                                        : 'N/A'}
                                                </td>
                                            </tr>
                                        ))}
                                        {totalHistoryPages > 1 && (
                                            <tr>
                                                <td colSpan={4} className="px-6 py-4 bg-slate-50/50">
                                                    <div className="flex items-center justify-between">
                                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                                            Trang {cashHistoryPage} / {totalHistoryPages}
                                                        </p>
                                                        <div className="flex items-center gap-1.5">
                                                            <button disabled={cashHistoryPage === 1} onClick={() => setCashHistoryPage(p => p - 1)} className="p-2 bg-white border border-slate-100 rounded-xl hover:bg-slate-50 disabled:opacity-30 transition-all shadow-sm">
                                                                <ChevronLeft className="w-3.5 h-3.5" />
                                                            </button>
                                                            <div className="flex items-center gap-1">
                                                                {historyPages.map((p, idx) => (
                                                                    p === '...'
                                                                        ? <span key={`h-gap-${idx}`} className="px-2 text-slate-300 font-black text-xs">...</span>
                                                                        : <button key={`h-page-${p}`} onClick={() => setCashHistoryPage(p as number)} className={`w-7 h-7 rounded-lg text-[10px] font-black transition-all ${cashHistoryPage === p ? 'bg-blue-600 text-white' : 'bg-white text-slate-400 hover:bg-slate-50 border border-slate-100'}`}>{p}</button>
                                                                ))}
                                                            </div>
                                                            <button disabled={cashHistoryPage === totalHistoryPages} onClick={() => setCashHistoryPage(p => p + 1)} className="p-2 bg-white border border-slate-100 rounded-xl hover:bg-slate-50 disabled:opacity-30 transition-all shadow-sm">
                                                                <ChevronRight className="w-3.5 h-3.5" />
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
            )}
        </div>
    )
}
