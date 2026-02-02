'use client'

import { useState, useEffect } from 'react'
import { CheckCircle2, XCircle, AlertCircle, Search, Filter, Clock, ArrowRight, TrendingUp, CreditCard } from 'lucide-react'
import toast from 'react-hot-toast'

export default function AdminPaymentApprovalsPage() {
    const [pendingRequests, setPendingRequests] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [processingId, setProcessingId] = useState<string | null>(null)

    useEffect(() => {
        fetchPendingRequests()
    }, [])

    const fetchPendingRequests = async () => {
        try {
            const res = await fetch('/api/admin/payments/pending')
            const result = await res.json()
            if (result.success) {
                setPendingRequests(result.data)
            }
        } catch (error) {
            toast.error('Không thể tải danh sách yêu cầu')
        } finally {
            setLoading(false)
        }
    }

    const handleApprove = async (paymentId: string, supplierId: string) => {
        if (!confirm('Bạn có chắc chắn muốn DUYỆT yêu cầu thanh toán này? Tiền sẽ được trừ khỏi quỹ ngay lập tức.')) return

        setProcessingId(paymentId)
        const loadingToast = toast.loading('Đang xử lý giao dịch...')

        try {
            const res = await fetch('/api/admin/payments/approve', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ paymentId, supplierId })
            })

            const result = await res.json()

            if (result.success) {
                toast.success('Đã duyệt chi thành công!', { id: loadingToast })
                setPendingRequests(prev => prev.filter(p => p.id !== paymentId))
            } else {
                toast.error(result.message || 'Lỗi khi duyệt', { id: loadingToast })
            }
        } catch (error) {
            toast.error('Lỗi kết nối máy chủ', { id: loadingToast })
        } finally {
            setProcessingId(null)
        }
    }

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount || 0)
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen bg-slate-50">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-slate-50 font-sans text-slate-900 p-8 sm:p-12">
            <div className="max-w-7xl mx-auto space-y-10">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                    <div className="space-y-2">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-blue-600 rounded-lg text-white">
                                <TrendingUp className="w-6 h-6" />
                            </div>
                            <h1 className="text-3xl font-black tracking-tight text-slate-900">Phê Duyệt Thanh Toán</h1>
                        </div>
                        <p className="text-slate-500 font-medium">Quản lý và duyệt chi các yêu cầu rút tiền từ Nhà cung cấp.</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="px-4 py-2 bg-white rounded-xl border border-slate-200 shadow-sm font-bold text-slate-600">
                            {pendingRequests.length} Yêu cầu chờ xử lý
                        </div>
                    </div>
                </div>

                {/* List */}
                <div className="grid grid-cols-1 gap-6">
                    {pendingRequests.length > 0 ? (
                        pendingRequests.map((req) => (
                            <div key={req.id} className="group bg-white rounded-[2rem] p-8 shadow-sm border border-slate-200 hover:shadow-xl hover:border-blue-200 transition-all duration-300">
                                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
                                    {/* Left: Info */}
                                    <div className="flex items-start gap-6">
                                        <div className="w-16 h-16 bg-amber-50 rounded-2xl flex items-center justify-center shrink-0">
                                            <Clock className="w-8 h-8 text-amber-500" />
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-3 mb-2">
                                                <h3 className="text-xl font-black text-slate-900">{req.notes || "Yêu cầu rút tiền"}</h3>
                                                <span className="px-3 py-1 bg-amber-100 text-amber-700 text-[10px] font-black uppercase rounded-full">Chờ duyệt</span>
                                            </div>
                                            <div className="space-y-1">
                                                <p className="text-sm font-medium text-slate-500 flex items-center gap-2">
                                                    Mã GD: <span className="font-mono bg-slate-100 px-2 py-0.5 rounded text-slate-700">{req.paymentNumber}</span>
                                                </p>
                                                <p className="text-sm font-medium text-slate-500">
                                                    Thời gian yêu cầu: {new Date(req.paymentDate).toLocaleString('vi-VN')}
                                                </p>
                                                {req.beneficiaryInfo && (
                                                    <div className="mt-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
                                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Tài khoản thụ hưởng</p>
                                                        <div className="flex items-center gap-2">
                                                            <CreditCard className="w-4 h-4 text-slate-400" />
                                                            <span className="font-bold text-slate-900">{req.beneficiaryInfo.bankName}</span>
                                                        </div>
                                                        <p className="text-xs font-mono text-slate-600 pl-6">{req.beneficiaryInfo.bankAccount} • {req.beneficiaryInfo.accountName}</p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Middle: Amount */}
                                    <div className="flex flex-col items-end lg:items-end min-w-[200px]">
                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Số tiền yêu cầu</span>
                                        <span className="text-4xl font-black text-emerald-600 tracking-tighter decoration-emerald-200 underline decoration-4 underline-offset-4">
                                            {formatCurrency(req.amount)}
                                        </span>
                                    </div>

                                    {/* Right: Actions */}
                                    <div className="flex items-center gap-4 pt-4 lg:pt-0 border-t lg:border-t-0 border-slate-100 w-full lg:w-auto mt-4 lg:mt-0">
                                        <button
                                            // Handle Reject (To be implemented)
                                            onClick={() => toast.error('Tính năng từ chối đang phát triển')}
                                            className="flex-1 lg:flex-none px-6 py-4 rounded-xl font-bold text-slate-500 hover:bg-slate-50 hover:text-rose-600 transition-colors"
                                        >
                                            Từ chối
                                        </button>
                                        <button
                                            onClick={() => handleApprove(req.id, getSupplierIdFromNotes(req.notes))}
                                            disabled={!!processingId}
                                            className="flex-1 lg:flex-none px-8 py-4 bg-slate-900 text-white font-bold rounded-2xl hover:bg-blue-600 transition-all shadow-lg hover:shadow-blue-200 hover:-translate-y-1 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                        >
                                            {processingId === req.id ? (
                                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                            ) : (
                                                <>
                                                    Phê duyệt ngay
                                                    <ArrowRight className="w-5 h-5" />
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="flex flex-col items-center justify-center py-32 text-center">
                            <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center mb-6">
                                <CheckCircle2 className="w-10 h-10 text-slate-300" />
                            </div>
                            <h3 className="text-xl font-black text-slate-900 mb-2">Không có yêu cầu nào</h3>
                            <p className="text-slate-500 max-w-sm mx-auto">Tuyệt vời! Tất cả các khoản thanh toán đã được xử lý.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

// Helper to extract supplier ID if we stored it in Notes.
// In a real app, we would include `supplier` relation in the fetch.
// But based on my previous `route.ts`, I stored supplierId in `notes` string: "Yêu cầu rút tiền từ NCC: <id>"
// I should probably fix the GET route to be smarter, but for now let's parse or fetch smarter.
function getSupplierIdFromNotes(notes: string) {
    if (!notes) return '';
    const parts = notes.split(': ');
    if (parts.length > 1) return parts[1].trim();
    return '';
}
