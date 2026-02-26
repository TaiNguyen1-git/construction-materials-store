import React from 'react'
import { CreditCard, CheckCircle } from 'lucide-react'

interface PendingTransferModalProps {
    pendingTransfer: any | null
    onCancel: () => void
    onConfirm: () => void
    loading: boolean
    BANK_INFO: any
    formatCurrency: (val: number) => string
}

export function PendingTransferModal({
    pendingTransfer,
    onCancel,
    onConfirm,
    loading,
    BANK_INFO,
    formatCurrency
}: PendingTransferModalProps) {
    if (!pendingTransfer) return null

    return (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-in fade-in duration-300">
            <div className="bg-white w-full max-w-lg rounded-[40px] shadow-2xl overflow-hidden border border-slate-100 animate-in zoom-in-95 duration-300">
                <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-blue-50/50">
                    <h3 className="text-xl font-black text-slate-900 flex items-center gap-3">
                        <CreditCard className="text-blue-600" /> Chờ chuyển khoản
                    </h3>
                    <div className="text-right">
                        <p className="text-2xl font-black text-blue-600">{formatCurrency(pendingTransfer.total)}</p>
                        <p className="text-[10px] text-slate-400 font-bold">Tổng thanh toán</p>
                    </div>
                </div>
                <div className="px-8 py-6 space-y-6">
                    {/* QR Code */}
                    <div className="flex justify-center">
                        <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-lg">
                            <img
                                src={`https://img.vietqr.io/image/${BANK_INFO.bankId}-${BANK_INFO.accountNumber}-compact2.png?amount=${Math.floor(pendingTransfer.total)}&addInfo=${encodeURIComponent('POS ' + Date.now().toString().slice(-6))}&accountName=${encodeURIComponent(BANK_INFO.accountName)}`}
                                alt="QR Payment"
                                className="w-52 h-52 rounded-xl"
                            />
                        </div>
                    </div>
                    {/* Bank Info */}
                    <div className="bg-slate-50 rounded-2xl p-4 space-y-2">
                        <div className="flex justify-between text-xs">
                            <span className="text-slate-400 font-bold">Ngân hàng</span>
                            <span className="font-black text-slate-700">{BANK_INFO.fullBankName}</span>
                        </div>
                        <div className="flex justify-between text-xs">
                            <span className="text-slate-400 font-bold">Số TK</span>
                            <span className="font-black text-blue-600 text-sm font-mono">{BANK_INFO.accountNumber}</span>
                        </div>
                        <div className="flex justify-between text-xs">
                            <span className="text-slate-400 font-bold">Chủ TK</span>
                            <span className="font-black text-slate-700">{BANK_INFO.accountName}</span>
                        </div>
                    </div>
                    {/* Customer info */}
                    <p className="text-center text-xs text-slate-400 font-bold">
                        Khách: <span className="text-slate-700">{pendingTransfer.customerName}</span>
                    </p>
                </div>
                <div className="px-8 pb-8 flex gap-3">
                    <button
                        onClick={onCancel}
                        className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-2xl font-black text-sm hover:bg-slate-200 transition-all"
                    >
                        Huỷ
                    </button>
                    <button
                        onClick={onConfirm}
                        disabled={loading}
                        className="flex-[2] py-4 bg-emerald-500 text-white rounded-2xl font-black text-sm shadow-xl shadow-emerald-200 hover:bg-emerald-600 transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                        <CheckCircle className="w-5 h-5" /> ĐÃ NHẬN TIỀN — XÁC NHẬN
                    </button>
                </div>
            </div>
        </div>
    )
}
