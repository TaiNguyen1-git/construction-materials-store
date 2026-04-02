import React from 'react'
import { Plus, FileText } from 'lucide-react'
import { QuickQuote, formatCurrency } from '../../types'

interface QuoteDetailModalProps {
    quote: QuickQuote | null
    isOpen: boolean
    onClose: () => void
    onAccept: (id: string) => void
}

const QuoteDetailModal: React.FC<QuoteDetailModalProps> = ({
    quote,
    isOpen,
    onClose,
    onAccept
}) => {
    if (!isOpen || !quote) return null

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md" onClick={onClose}>
            <div className="bg-white w-full max-w-lg rounded-[40px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300" onClick={e => e.stopPropagation()}>
                <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-8 text-white relative">
                    <button onClick={onClose} className="absolute top-6 right-6 p-2 hover:bg-white/20 rounded-full transition-colors">
                        <Plus className="w-6 h-6 rotate-45" />
                    </button>
                    <div className="flex items-center gap-4 mb-2">
                        <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-sm">
                            <FileText className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-white/60 text-[10px] font-black uppercase tracking-widest">Chi tiết báo giá</p>
                            <h3 className="text-2xl font-black">{quote.customerName}</h3>
                        </div>
                    </div>
                </div>
                <div className="p-8 space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 bg-slate-50 rounded-3xl border border-slate-100">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Số điện thoại</p>
                            <p className="text-lg font-black text-slate-900">{quote.customerPhone || '—'}</p>
                        </div>
                        <div className="p-4 bg-blue-50 rounded-3xl border border-blue-100">
                            <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-1">Tổng tiền</p>
                            <p className="text-lg font-black text-blue-600">{formatCurrency(quote.totalAmount)}</p>
                        </div>
                    </div>
                    <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Ghi chú mặt hàng</p>
                        <p className="text-slate-600 font-medium whitespace-pre-wrap leading-relaxed">
                            {quote.notes || 'Không có ghi chú bổ sung.'}
                        </p>
                    </div>
                    <div className="flex items-center justify-between text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">
                        <div className="flex flex-col gap-1">
                            <span>Trạng thái: <span className={quote.status === 'ACCEPTED' ? 'text-emerald-500' : 'text-orange-500'}>{quote.status}</span></span>
                            <span>Nhân viên: <span className="text-slate-600">{quote.staffName || 'Hệ thống'}</span></span>
                        </div>
                        <span>Ngày tạo: {new Date(quote.createdAt).toLocaleDateString('vi-VN')}</span>
                    </div>
                    <div className="flex gap-3 pt-2">
                        <button onClick={onClose} className="flex-1 py-4 bg-slate-100 text-slate-500 rounded-2xl font-bold hover:bg-slate-200 transition-all">Đóng</button>
                        {quote.status !== 'ACCEPTED' && (
                            <button
                                onClick={() => { onAccept(quote.id); onClose() }}
                                className="flex-[2] py-4 bg-blue-600 text-white rounded-2xl font-black shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all"
                            >
                                Chấp nhận báo giá
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}

export default QuoteDetailModal
