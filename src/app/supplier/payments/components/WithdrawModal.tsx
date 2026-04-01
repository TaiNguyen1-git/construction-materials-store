import { X, Banknote, AlertCircle, CreditCard, Clock, ChevronRight, ShieldCheck } from 'lucide-react'
import Link from 'next/link'

interface WithdrawModalProps {
    show: boolean
    step: number
    summary: any
    hasBankConfig: boolean
    lastPaymentId: string | null
    formatCurrency: (amount: number) => string
    onClose: () => void
    onProcess: () => void
}

export default function WithdrawModal({
    show, step, summary, hasBankConfig, lastPaymentId, formatCurrency, onClose, onProcess
}: WithdrawModalProps) {
    if (!show) return null

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300" onClick={onClose} />

            <div className="relative bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
                {step === 1 && (
                    <div className="p-10 space-y-8">
                        <div className="flex justify-between items-start">
                            <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-100">
                                <Banknote className="w-8 h-8 text-emerald-600" />
                            </div>
                            <button onClick={onClose} className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-slate-100 transition-colors">
                                <X className="w-5 h-5 text-slate-400" />
                            </button>
                        </div>

                        <div className="space-y-2">
                            <h2 className="text-3xl font-black text-slate-900 tracking-tight">Yêu cầu quyết toán</h2>
                            <p className="text-slate-500 font-medium tracking-tight">Hệ thống sẽ chuyển toàn bộ doanh thu đang treo vào tài khoản ngân hàng của bạn.</p>
                        </div>

                        {!hasBankConfig ? (
                            <div className="bg-rose-50 rounded-3xl p-6 space-y-4 border border-rose-100">
                                <div className="flex items-center gap-3 text-rose-600">
                                    <AlertCircle className="w-6 h-6" />
                                    <span className="font-bold">Chưa cấu hình tài khoản</span>
                                </div>
                                <p className="text-sm text-rose-800">Bạn chưa cập nhật thông tin ngân hàng để nhận tiền. Vui lòng cài đặt trước khi rút.</p>
                                <Link href="/supplier/profile" className="block w-full py-3 bg-white text-rose-600 font-bold text-center rounded-xl border border-rose-200 hover:bg-rose-50 transition-colors">
                                    Cập nhật ngay
                                </Link>
                            </div>
                        ) : (
                            <div className="bg-slate-50 rounded-3xl p-6 space-y-4">
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-slate-500 font-bold uppercase tracking-widest text-[10px]">Số tiền quyết toán</span>
                                    <span className="text-2xl font-black text-emerald-600 tracking-tighter">{formatCurrency(summary?.currentBalance || 0)}</span>
                                </div>
                                <div className="pt-4 border-t border-slate-200">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Chuyển về tài khoản</p>
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center border border-slate-200 shadow-sm">
                                            <CreditCard className="w-5 h-5 text-slate-700" />
                                        </div>
                                        <div>
                                            <p className="font-bold text-slate-900">{summary?.bankName}</p>
                                            <p className="text-xs font-mono text-slate-500">{summary?.bankAccountNumber} • {summary?.bankAccountName}</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 p-3 bg-amber-50 text-amber-700 text-xs font-medium rounded-xl border border-amber-100">
                                    <Clock className="w-4 h-4 flex-shrink-0" />
                                    <span>Yêu cầu sẽ được chuyển đến bộ phận Admin phê duyệt trong vòng 24h.</span>
                                </div>
                            </div>
                        )}

                        <div className="flex gap-4">
                            <button
                                onClick={onClose}
                                className="flex-1 px-6 py-4 bg-slate-100 text-slate-600 font-bold rounded-2xl hover:bg-slate-200 transition-all active:scale-95"
                            >
                                Hủy
                            </button>
                            <button
                                onClick={onProcess}
                                disabled={!hasBankConfig}
                                className={`flex-[2] px-6 py-4 font-bold rounded-2xl transition-all shadow-lg active:scale-95 flex items-center justify-center gap-2 cursor-pointer
                                    ${!hasBankConfig
                                        ? 'bg-slate-300 text-slate-500 shadow-none hover:bg-slate-400 cursor-not-allowed'
                                        : 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-emerald-200'
                                    }`}
                            >
                                Gửi yêu cầu
                                <ChevronRight className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                )}

                {step === 2 && (
                    <div className="p-20 flex flex-col items-center justify-center space-y-8 text-center">
                        <div className="relative">
                            <div className="w-24 h-24 border-4 border-emerald-100 rounded-full" />
                            <div className="absolute inset-0 w-24 h-24 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin" />
                            <Banknote className="absolute inset-0 m-auto w-10 h-10 text-emerald-600 animate-pulse" />
                        </div>
                        <div className="space-y-2">
                            <h3 className="text-2xl font-black text-slate-900 tracking-tight">Đang gửi yêu cầu</h3>
                            <p className="text-slate-500 font-medium">Hệ thống đang tạo phiếu yêu cầu...</p>
                        </div>
                    </div>
                )}

                {step === 3 && (
                    <div className="p-10 space-y-8 text-center flex flex-col items-center">
                        <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center shadow-xl shadow-amber-200 animate-bounce-short">
                            <Clock className="w-10 h-10 text-amber-600" />
                        </div>
                        <div className="space-y-2">
                            <h3 className="text-3xl font-black text-slate-900 tracking-tight">Đang chờ duyệt!</h3>
                            <p className="text-slate-500 font-medium italic">Yêu cầu rút tiền của bạn đã được gửi thành công và đang chờ Admin phê duyệt.</p>
                        </div>
                        <div className="bg-slate-50 rounded-3xl p-6 w-full flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <ShieldCheck className="w-6 h-6 text-slate-400" />
                                <span className="text-sm font-bold text-slate-600">Mã yêu cầu</span>
                            </div>
                            <span className="text-xs font-black text-slate-800 uppercase tracking-widest">{lastPaymentId?.slice(-8).toUpperCase() || 'UNKNOWN'}</span>
                        </div>
                        <button
                            onClick={onClose}
                            className="w-full px-6 py-4 bg-slate-900 text-white font-bold rounded-2xl hover:bg-slate-800 transition-all shadow-lg active:scale-95"
                        >
                            Đã hiểu
                        </button>
                    </div>
                )}
            </div>
        </div>
    )
}
