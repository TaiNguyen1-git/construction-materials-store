import { Wallet, TrendingUp, CreditCard, Clock } from 'lucide-react'

interface PaymentStatCardsProps {
    summary: any
    hasPending: boolean
    formatCurrency: (amount: number) => string
}

export default function PaymentStatCards({ summary, hasPending, formatCurrency }: PaymentStatCardsProps) {
    if (!summary) return null
    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Dư nợ card (Doanh thu chờ thu hồi) */}
            <div className="group relative bg-[#F0FDF4] border border-emerald-100 rounded-[2.5rem] p-8 overflow-hidden shadow-xl shadow-emerald-100/30 transition-all duration-500 hover:-translate-y-2">
                <div className="absolute top-0 right-0 w-40 h-40 bg-emerald-500/5 rounded-full blur-3xl -mr-20 -mt-20" />
                <div className="flex flex-col h-full min-h-[160px] justify-between relative z-10">
                    <div className="flex justify-between items-start">
                        <div className="w-14 h-14 bg-emerald-100/50 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-100 border border-emerald-200">
                            <Wallet className="w-7 h-7 text-emerald-600" />
                        </div>
                        <div className="flex flex-col items-end">
                            <span className="text-[10px] uppercase font-black tracking-widest text-emerald-400">Trạng thái ví</span>
                            <span className={`px-3 py-1 ${hasPending ? 'bg-amber-500' : summary.currentBalance > 0 ? 'bg-emerald-600' : 'bg-slate-600'} text-white shadow-lg rounded-full text-[10px] font-black uppercase mt-1`}>
                                {hasPending ? 'Chờ duyệt chi' : summary.currentBalance > 0 ? 'Sẵn sàng rút' : 'Đã tất toán'}
                            </span>
                        </div>
                    </div>
                    <div>
                        <p className="text-emerald-500 font-bold uppercase tracking-widest text-[10px] mb-2">Doanh thu chờ quyết toán</p>
                        <h3 className="text-3xl lg:text-4xl font-black tracking-tighter text-emerald-600 truncate">
                            {formatCurrency(summary.currentBalance)}
                        </h3>
                        {hasPending && (
                            <p className="mt-2 text-xs font-bold text-amber-500 flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                Đang có yêu cầu rút tiền...
                            </p>
                        )}
                    </div>
                </div>
            </div>

            {/* Hạn mức card & Khả dụng card (Keep as is) */}
            <div className="group relative bg-white rounded-[2.5rem] p-8 overflow-hidden shadow-xl shadow-slate-200/40 border border-slate-100 transition-all duration-500 hover:-translate-y-2">
                <div className="absolute top-0 right-0 w-40 h-40 bg-blue-500/5 rounded-full blur-3xl -mr-20 -mt-20" />
                <div className="flex flex-col h-full min-h-[160px] justify-between relative z-10">
                    <div className="flex justify-between items-start">
                        <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-100">
                            <CreditCard className="w-7 h-7 text-blue-600" />
                        </div>
                        <div className="text-right">
                            <p className="text-[10px] uppercase font-black tracking-widest text-slate-400">Hợp đồng năm</p>
                            <p className="text-[10px] font-black text-slate-900 mt-1 uppercase">2024 - 2025</p>
                        </div>
                    </div>
                    <div>
                        <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px] mb-2">Hạn mức cung ứng tối đa</p>
                        <h3 className="text-3xl lg:text-4xl font-black tracking-tighter text-slate-900 truncate">
                            {formatCurrency(summary.creditLimit)}
                        </h3>
                        <div className="mt-6 h-2 bg-slate-100 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-blue-600 rounded-full shadow-lg shadow-blue-200 transition-all duration-1000"
                                style={{ width: `${Math.min((summary.currentBalance / summary.creditLimit) * 100, 100) || 0}%` }}
                            />
                        </div>
                    </div>
                </div>
            </div>

            <div className="group relative bg-white border border-blue-100 rounded-[2.5rem] p-8 overflow-hidden shadow-xl shadow-blue-100/20 transition-all duration-500 hover:-translate-y-2">
                <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-indigo-50 rounded-full blur-3xl" />
                <div className="flex flex-col h-full min-h-[160px] justify-between relative z-10">
                    <div className="flex justify-between items-start">
                        <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-100">
                            <TrendingUp className="w-7 h-7 text-blue-600" />
                        </div>
                        <div className="flex flex-col items-end">
                            <span className="text-[10px] uppercase font-black tracking-widest text-slate-400">Chỉ số tin cậy</span>
                            <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full text-[10px] font-black uppercase mt-1 border border-emerald-100">
                                <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                                Tín nhiệm
                            </div>
                        </div>
                    </div>
                    <div>
                        <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px] mb-2">Khả năng cung ứng</p>
                        <h3 className="text-3xl lg:text-4xl font-black tracking-tighter text-blue-600 truncate">
                            {formatCurrency((summary.creditLimit || 0) - (summary.currentBalance || 0))}
                        </h3>
                    </div>
                </div>
            </div>
        </div>
    )
}
