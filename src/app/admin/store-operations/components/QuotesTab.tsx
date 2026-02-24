'use client'

import React from 'react'
import { Trash2 } from 'lucide-react'
import { QuickQuote, formatCurrency } from '../types'

interface QuotesTabProps {
    quotes: QuickQuote[]
    onAcceptQuote: (id: string) => void
    onDeleteQuote: (id: string) => void
    onViewDetail: (quote: QuickQuote) => void
}

export default function QuotesTab({ quotes, onAcceptQuote, onDeleteQuote, onViewDetail }: QuotesTabProps) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {quotes.map(quote => (
                <div key={quote.id} className="group p-6 bg-white rounded-[32px] border border-slate-100 shadow-sm hover:shadow-xl hover:border-blue-200 transition-all">
                    <div className="flex justify-between items-start mb-4">
                        <h4 className="text-lg font-black text-slate-900 leading-tight">{quote.customerName}</h4>
                        <span className={`text-[10px] font-black uppercase px-2 py-1 rounded-lg ${quote.status === 'PENDING' ? 'bg-orange-50 text-orange-600' : 'bg-emerald-50 text-emerald-600'}`}>
                            {quote.status}
                        </span>
                    </div>
                    <p className="text-2xl font-black text-blue-600 mb-6">{formatCurrency(quote.totalAmount)}</p>

                    <div className="flex gap-2">
                        <button
                            onClick={() => onAcceptQuote(quote.id)}
                            disabled={quote.status === 'ACCEPTED'}
                            className={`flex-1 py-3 rounded-2xl text-xs font-black shadow-lg transition-all ${quote.status === 'ACCEPTED'
                                ? 'bg-emerald-500 text-white cursor-default'
                                : 'bg-blue-600 text-white shadow-blue-100 hover:scale-[1.02]'
                                }`}
                        >
                            {quote.status === 'ACCEPTED' ? 'Đã chấp nhận' : 'Chấp nhận'}
                        </button>
                        <button
                            onClick={() => onDeleteQuote(quote.id)}
                            className="p-3 bg-slate-50 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-2xl transition-all"
                        >
                            <Trash2 className="w-4 h-4" />
                        </button>
                    </div>
                    <button
                        onClick={() => onViewDetail(quote)}
                        className="w-full mt-2 py-2 text-slate-400 hover:text-blue-600 text-[10px] font-black uppercase tracking-widest"
                    >
                        Xem chi tiết
                    </button>
                </div>
            ))}
            {quotes.length === 0 && (
                <div className="col-span-3 py-20 text-center border-2 border-dashed border-slate-100 rounded-[40px]">
                    <p className="text-slate-400 font-bold italic">Chưa có báo giá nào được tạo.</p>
                </div>
            )}
        </div>
    )
}
