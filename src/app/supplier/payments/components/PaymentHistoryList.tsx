import { History, CheckCircle2, Clock } from 'lucide-react'

interface PaymentHistoryListProps {
    paymentHistory: any[]
    formatCurrency: (amount: number) => string
}

export default function PaymentHistoryList({ paymentHistory, formatCurrency }: PaymentHistoryListProps) {
    return (
        <div className="space-y-6">
            <div className="flex items-center gap-3 px-2">
                <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
                    <History className="w-6 h-6" />
                </div>
                <div>
                    <h2 className="text-xl font-black text-slate-900 tracking-tight">Lịch sử rút tiền</h2>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Giao dịch gần đây</p>
                </div>
            </div>

            <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/40 divide-y divide-slate-100">
                {paymentHistory?.length > 0 ? (
                    paymentHistory.map((pm: any, idx: number) => (
                        <div key={idx} className={`p-8 hover:bg-slate-50/50 transition-all group first:rounded-t-[2.5rem] last:rounded-b-[2.5rem] ${pm.status === 'PENDING' ? 'bg-amber-50/50' : ''}`}>
                            <div className="flex justify-between items-start mb-4">
                                <div className={`w-12 h-12 border rounded-xl flex items-center justify-center transition-all shadow-sm ${pm.status === 'PENDING' ? 'bg-amber-100 border-amber-200' : 'bg-white border-slate-200 group-hover:bg-emerald-50 group-hover:border-emerald-100'}`}>
                                    {pm.status === 'PENDING' ? (
                                        <Clock className="w-6 h-6 text-amber-600" />
                                    ) : (
                                        <CheckCircle2 className="w-6 h-6 text-emerald-500" />
                                    )}
                                </div>
                                <div className="text-right">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{pm.status === 'PENDING' ? 'Đang chờ duyệt' : 'Đã nhận'}</p>
                                    <p className={`text-2xl font-black tracking-tighter ${pm.status === 'PENDING' ? 'text-amber-600' : 'text-emerald-600'}`}>{pm.amount > 0 ? '+' : ''}{formatCurrency(pm.amount)}</p>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span className="font-bold text-slate-900">{pm.paymentNumber}</span>
                                    <span className="font-medium text-slate-400">{new Date(pm.paymentDate).toLocaleDateString('vi-VN')}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className={`w-1.5 h-1.5 rounded-full ${pm.status === 'PENDING' ? 'bg-amber-500' : 'bg-emerald-500'}`} />
                                    <p className="text-xs font-medium text-slate-500 italic max-w-[200px] truncate">
                                        {pm.notes || `Từ đơn hàng: ${pm.invoice?.invoiceNumber || 'Yêu cầu rút tiền'}`}
                                    </p>
                                </div>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="flex flex-col items-center justify-center p-20 text-center">
                        <History className="w-12 h-12 text-slate-100 mb-4" />
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-300">Chưa có giao dịch</p>
                    </div>
                )}
                <button
                    className="w-full p-6 text-[10px] font-black uppercase tracking-[0.2em] text-blue-600 hover:bg-blue-50 transition-all rounded-b-[2.5rem]"
                >
                    Xem tất cả
                </button>
            </div>
        </div>
    )
}
