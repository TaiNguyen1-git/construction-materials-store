'use client'

import React from 'react'
import { Trash2, Search, CheckCircle } from 'lucide-react'
import { QuickQuote, formatCurrency } from '../types'

interface QuotesTabProps {
    quotes: QuickQuote[]
    onAcceptQuote: (id: string) => void
    onDeleteQuote: (id: string) => void
    onViewDetail: (quote: QuickQuote) => void
}

export default function QuotesTab({ quotes, onAcceptQuote, onDeleteQuote, onViewDetail }: QuotesTabProps) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8 animate-in fade-in slide-in-from-bottom-6 duration-700">
            {quotes.map(quote => (
                <div key={quote.id} className="group relative bg-white/60 backdrop-blur-xl rounded-[40px] p-8 border border-white shadow-xl shadow-slate-200/50 hover:shadow-2xl hover:shadow-blue-500/10 hover:-translate-y-1.5 transition-all duration-500 ring-1 ring-slate-100">
                    <div className="flex justify-between items-start mb-6">
                        <div className="space-y-1">
                            <h4 className="text-xl font-black text-slate-900 leading-tight tracking-tight group-hover:text-blue-600 transition-colors">{quote.customerName}</h4>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-slate-300"></span>
                                {quote.staffName || 'Hệ thống'} • {new Date(quote.createdAt).toLocaleDateString('vi-VN')}
                            </p>
                        </div>
                        <span className={`text-[9px] font-black uppercase tracking-widest px-3 py-1.5 rounded-xl shadow-sm ring-1 ${quote.status === 'PENDING'
                            ? 'bg-orange-50 text-orange-600 ring-orange-100'
                            : quote.status === 'ACCEPTED'
                                ? 'bg-emerald-50 text-emerald-600 ring-emerald-100'
                                : 'bg-slate-50 text-slate-500 ring-slate-100'
                            }`}>
                            {quote.status === 'PENDING' ? 'Đang chờ' : quote.status === 'ACCEPTED' ? 'Đã duyệt' : quote.status}
                        </span>
                    </div>

                    <div className="mb-8 relative py-4 bg-slate-50/50 rounded-3xl px-6 border border-slate-100/50">
                        <p className="text-3xl font-black text-blue-600 tracking-tighter">
                            {formatCurrency(quote.totalAmount)}
                        </p>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mt-1">Tổng giá trị dự kiến</p>
                    </div>

                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => onAcceptQuote(quote.id)}
                            disabled={quote.status === 'ACCEPTED'}
                            className={`flex-1 flex items-center justify-center gap-3 py-4 rounded-2xl text-[11px] font-black uppercase tracking-widest shadow-lg transition-all ring-1 ring-white/20 ${quote.status === 'ACCEPTED'
                                ? 'bg-emerald-600 text-white shadow-emerald-500/10 cursor-default opacity-90'
                                : 'bg-blue-600 text-white shadow-blue-500/20 hover:bg-blue-700 hover:shadow-blue-500/40 active:scale-95'
                                }`}
                        >
                            {quote.status === 'ACCEPTED' ? (
                                <><CheckCircle className="w-4 h-4" /> Đã chấp nhận</>
                            ) : (
                                'Chấp nhận báo giá'
                            )}
                        </button>
                        <button
                            onClick={() => onDeleteQuote(quote.id)}
                            className="p-4 bg-white text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-2xl border border-slate-100 hover:border-red-100 transition-all shadow-sm active:scale-90"
                            title="Xóa bản thảo"
                        >
                            <Trash2 className="w-5 h-5" />
                        </button>
                    </div>

                    <button
                        onClick={() => onViewDetail(quote)}
                        className="w-full mt-6 py-2 text-slate-400 hover:text-blue-600 text-[10px] font-black uppercase tracking-[0.25em] transition-colors border-t border-slate-50 pt-4"
                    >
                        Xem chi tiết báo giá
                    </button>
                </div>
            ))}
            {quotes.length === 0 && (
                <div className="col-span-full py-32 text-center bg-white/50 border-2 border-dashed border-slate-100 rounded-[48px] backdrop-blur-sm opacity-60">
                    <div className="p-5 bg-slate-50 rounded-full w-fit mx-auto mb-6">
                        <Search className="w-10 h-10 text-slate-200" />
                    </div>
                    <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Chưa có bản thảo nào được tạo</p>
                </div>
            )}
        </div>
    )
}
