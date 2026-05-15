import { X, Banknote, AlertCircle, CreditCard, Clock, ChevronRight, ShieldCheck, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { createPortal } from 'react-dom'
import { useEffect, useState } from 'react'

interface WithdrawModalProps {
    show: boolean
    step: number
    summary: any
    hasBankConfig: boolean
    lastPaymentId: string | null
    amount: number
    setAmount: (val: number) => void
    formatCurrency: (amount: number) => string
    onClose: () => void
    onProcess: () => void
}

export default function WithdrawModal({
    show, step, summary, hasBankConfig, lastPaymentId, amount, setAmount, formatCurrency, onClose, onProcess
}: WithdrawModalProps) {
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        setMounted(true)
        if (show) {
            document.body.style.overflow = 'hidden'
        } else {
            document.body.style.overflow = 'unset'
        }
        return () => {
            document.body.style.overflow = 'unset'
        }
    }, [show])

    if (!show || !mounted) return null

    return createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300" onClick={onClose} />
            
            <div className="relative bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 my-auto">
                {step === 1 && (
                    <div className="p-8 md:p-10 space-y-6">
                        {/* Header Section */}
                        <div className="flex justify-between items-center">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-100">
                                    <Banknote className="w-5 h-5 text-white" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-black text-slate-900 tracking-tight">Yêu cầu rút tiền</h2>
                                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Quyết toán doanh thu</p>
                                </div>
                            </div>
                            <button onClick={onClose} className="p-2 hover:bg-slate-50 rounded-full transition-colors text-slate-300 hover:text-slate-500">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {!hasBankConfig ? (
                            <div className="bg-rose-50/50 rounded-2xl p-6 border border-rose-100 space-y-4">
                                <div className="flex items-center gap-3 text-rose-600">
                                    <AlertCircle className="w-5 h-5" />
                                    <span className="text-xs font-black uppercase tracking-wider">Thông tin chưa đầy đủ</span>
                                </div>
                                <p className="text-xs text-rose-500 font-medium">Vui lòng cập nhật tài khoản ngân hàng trong hồ sơ.</p>
                                <Link href="/supplier/profile" className="flex items-center justify-center gap-2 w-full py-3 bg-white text-rose-600 font-bold text-[10px] uppercase tracking-widest rounded-xl border border-rose-200 hover:bg-rose-600 hover:text-white transition-all">
                                    Cập nhật ngay
                                </Link>
                            </div>
                        ) : (
                            <div className="space-y-6">
                                {/* Amount Section */}
                                <div className="space-y-3">
                                    <div className="flex justify-between items-end px-1">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Số tiền</label>
                                        <span className="text-[10px] font-bold text-slate-400">
                                            Số dư: <span className="text-slate-900 font-black">{formatCurrency(summary?.currentBalance || 0)}</span>
                                        </span>
                                    </div>
                                    
                                    <div className="relative group">
                                        <input
                                            type="text"
                                            value={amount ? new Intl.NumberFormat('vi-VN').format(amount) : ''}
                                            onChange={(e) => {
                                                const val = e.target.value.replace(/\D/g, '');
                                                setAmount(val ? parseInt(val) : 0);
                                            }}
                                            placeholder="0"
                                            className="w-full py-5 px-6 bg-slate-50 border border-slate-200 rounded-2xl font-black text-3xl text-emerald-600 outline-none focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/5 transition-all placeholder:text-slate-200"
                                        />
                                        <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-3">
                                            <span className="text-sm font-black text-slate-300">VNĐ</span>
                                            <button 
                                                onClick={() => setAmount(summary?.currentBalance || 0)}
                                                className="px-4 py-2 bg-emerald-500 text-white font-black text-[9px] uppercase tracking-widest rounded-lg hover:bg-emerald-600 transition-all shadow-md shadow-emerald-100"
                                            >
                                                Tối đa
                                            </button>
                                        </div>
                                    </div>

                                    <div className="flex gap-2">
                                        {[0.25, 0.5, 0.75, 1].map((percent) => {
                                            const targetAmount = Math.floor((summary?.currentBalance || 0) * percent);
                                            return (
                                                <button
                                                    key={percent}
                                                    onClick={() => setAmount(targetAmount)}
                                                    className={`px-3 py-1.5 rounded-lg font-black text-[9px] uppercase tracking-widest transition-all
                                                        ${amount === targetAmount
                                                            ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-100'
                                                            : 'bg-slate-100 text-slate-400 hover:bg-slate-200'
                                                        }`}
                                                >
                                                    {percent === 1 ? '100%' : `${percent * 100}%`}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* Bank Info Card */}
                                <div className="bg-slate-50 border border-slate-200/60 rounded-2xl p-6 space-y-4">
                                    <div className="flex justify-between items-center text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                        <p>Tài khoản nhận tiền</p>
                                        <div className="flex items-center gap-1.5 text-emerald-500">
                                            <ShieldCheck className="w-3.5 h-3.5" />
                                            <span>Đã xác thực</span>
                                        </div>
                                    </div>
                                    
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center border border-slate-200 shadow-sm">
                                            <CreditCard className="w-5 h-5 text-slate-700" />
                                        </div>
                                        <div>
                                            <p className="font-black text-slate-900 text-sm uppercase tracking-tight">{summary?.bankName}</p>
                                            <p className="text-[11px] font-mono font-bold text-slate-500">
                                                {summary?.bankAccountNumber} <span className="text-slate-300 mx-1">|</span> {summary?.bankAccountName}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Action Buttons */}
                                <div className="flex gap-3 pt-2">
                                    <button
                                        onClick={onClose}
                                        className="flex-1 py-4 bg-white border border-slate-200 text-slate-500 font-black text-[10px] uppercase tracking-widest rounded-xl hover:bg-slate-50 transition-all"
                                    >
                                        Hủy
                                    </button>
                                    <button
                                        onClick={onProcess}
                                        disabled={!hasBankConfig || amount <= 0}
                                        className="flex-[1.5] py-4 bg-emerald-600 text-white font-black text-[10px] uppercase tracking-widest rounded-xl hover:bg-emerald-700 transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-30 shadow-lg shadow-emerald-100"
                                    >
                                        Xác nhận rút tiền
                                        <ArrowRight className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        )}
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
                            className="w-full px-6 py-4 bg-emerald-600 text-white font-black text-[10px] uppercase tracking-widest rounded-2xl hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-100 active:scale-95"
                        >
                            Đã hiểu
                        </button>
                    </div>
                )}
            </div>
        </div>,
        document.body
    )
}
