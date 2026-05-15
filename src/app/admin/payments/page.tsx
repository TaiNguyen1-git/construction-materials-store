'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { 
    CheckCircle2, XCircle, AlertCircle, Search, Filter, 
    Clock, ArrowRight, TrendingUp, CreditCard, Wallet,
    Building2, Calendar, ChevronRight, Ban, Check, ShieldCheck, ArrowLeft
} from 'lucide-react'
import toast from 'react-hot-toast'

export default function AdminPaymentApprovalsPage() {
    const [pendingRequests, setPendingRequests] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [processingId, setProcessingId] = useState<string | null>(null)
    const [searchQuery, setSearchQuery] = useState('')
    const router = useRouter()

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

    const totalPendingAmount = pendingRequests.reduce((sum, req) => sum + (req.amount || 0), 0)

    const filteredRequests = pendingRequests.filter(req => 
        req.notes?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        req.paymentNumber?.toLowerCase().includes(searchQuery.toLowerCase())
    )

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh]">
                <div className="w-12 h-12 border-4 border-blue-600/20 border-t-blue-600 rounded-full animate-spin mb-4" />
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Đang tải dữ liệu...</p>
            </div>
        )
    }

    return (
        <div className="space-y-10 animate-in fade-in duration-500">
            {/* Back Button */}
            <button 
                onClick={() => router.push('/admin/contractors')}
                className="group flex items-center gap-2 text-slate-400 hover:text-blue-600 transition-all"
            >
                <div className="w-8 h-8 rounded-full border border-slate-200 flex items-center justify-center group-hover:border-blue-200 group-hover:bg-blue-50 transition-all">
                    <ArrowLeft size={14} />
                </div>
                <span className="text-[10px] font-black uppercase tracking-widest">Quay lại quản lý đối tác</span>
            </button>

            {/* Page Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2.5 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl shadow-xl shadow-blue-500/20">
                            <Wallet className="w-6 h-6 text-white" />
                        </div>
                        <h1 className="text-3xl font-black text-slate-900 tracking-tight">Phê Duyệt Thanh Toán</h1>
                    </div>
                    <p className="text-slate-500 font-medium">Hệ thống quản lý và xử lý giao dịch chi hộ cho đối tác Nhà cung cấp.</p>
                </div>

                <div className="flex items-center gap-4">
                    <div className="relative group min-w-[300px]">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                        <input 
                            type="text" 
                            placeholder="Tìm mã GD, tên NCC..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm font-bold text-slate-700 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all outline-none"
                        />
                    </div>
                </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:scale-110 transition-transform duration-500">
                        <Clock className="w-24 h-24 text-blue-600" />
                    </div>
                    <div className="relative z-10">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Chờ xử lý</p>
                        <div className="flex items-baseline gap-2">
                            <span className="text-4xl font-black text-slate-900">{pendingRequests.length}</span>
                            <span className="text-sm font-bold text-slate-400">yêu cầu</span>
                        </div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:scale-110 transition-transform duration-500">
                        <TrendingUp className="w-24 h-24 text-emerald-600" />
                    </div>
                    <div className="relative z-10">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Tổng tiền cần duyệt</p>
                        <div className="text-3xl font-black text-emerald-600 tracking-tight">
                            {formatCurrency(totalPendingAmount)}
                        </div>
                    </div>
                </div>

                <div className="bg-blue-600 p-6 rounded-[32px] shadow-xl shadow-blue-500/20 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform duration-500">
                        <ShieldCheck className="w-24 h-24 text-white" />
                    </div>
                    <div className="relative z-10">
                        <p className="text-[10px] font-black text-white/60 uppercase tracking-widest mb-4">Trạng thái quỹ</p>
                        <div className="text-xl font-black text-white">Sẵn sàng chi trả</div>
                        <p className="text-[10px] font-bold text-white/80 mt-2">Hệ thống đã xác thực số dư</p>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="space-y-6">
                {filteredRequests.length > 0 ? (
                    filteredRequests.map((req) => (
                        <div key={req.id} className="group bg-white rounded-[32px] border border-slate-100 shadow-sm hover:shadow-xl hover:border-blue-200 transition-all duration-500 overflow-hidden">
                            <div className="flex flex-col lg:flex-row divide-y lg:divide-y-0 lg:divide-x divide-slate-50">
                                {/* Supplier Info Section */}
                                <div className="p-8 lg:w-1/3 space-y-6">
                                    <div className="flex items-center gap-4">
                                        <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 border border-blue-100 shadow-sm">
                                            <Building2 size={24} />
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-black text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-1">
                                                {req.notes?.split(': ')[1] || "Nhà cung cấp"}
                                            </h3>
                                            <div className="flex items-center gap-2 mt-1">
                                                <span className="px-2 py-0.5 bg-amber-50 text-amber-600 text-[9px] font-black uppercase rounded-md border border-amber-100">
                                                    Yêu cầu mới
                                                </span>
                                                <span className="text-[10px] font-bold text-slate-400 font-mono">{req.paymentNumber}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-3 bg-slate-50/50 p-4 rounded-2xl border border-slate-100">
                                        <div className="flex items-center justify-between text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                            <span>Tài khoản thụ hưởng</span>
                                            <CreditCard size={12} />
                                        </div>
                                        {req.beneficiaryInfo ? (
                                            <div className="space-y-1">
                                                <div className="text-sm font-black text-slate-900">{req.beneficiaryInfo.bankName}</div>
                                                <div className="text-xs font-mono text-slate-600">{req.beneficiaryInfo.bankAccount}</div>
                                                <div className="text-[10px] font-bold text-slate-400 uppercase">{req.beneficiaryInfo.accountName}</div>
                                            </div>
                                        ) : (
                                            <div className="text-xs font-bold text-slate-400 italic">Chưa cập nhật thông tin</div>
                                        )}
                                    </div>
                                </div>

                                {/* Amount & Timing Section */}
                                <div className="p-8 lg:w-1/3 flex flex-col justify-between bg-slate-50/30">
                                    <div className="space-y-6">
                                        <div>
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                                                <Calendar size={12} /> Thời gian yêu cầu
                                            </p>
                                            <p className="text-sm font-bold text-slate-700">
                                                {new Date(req.paymentDate).toLocaleString('vi-VN', {
                                                    weekday: 'long',
                                                    year: 'numeric',
                                                    month: 'long',
                                                    day: 'numeric',
                                                    hour: '2-digit',
                                                    minute: '2-digit'
                                                })}
                                            </p>
                                        </div>

                                        <div>
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                                                <AlertCircle size={12} /> Ghi chú yêu cầu
                                            </p>
                                            <p className="text-sm font-bold text-slate-600 line-clamp-2 italic">
                                                "{req.notes || 'Yêu cầu rút tiền từ ví NCC'}"
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Actions Section */}
                                <div className="p-8 lg:w-1/3 flex flex-col items-center justify-center space-y-6 text-center">
                                    <div className="space-y-1">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Số tiền quyết toán</p>
                                        <div className="text-4xl font-black text-emerald-600 tracking-tighter">
                                            {formatCurrency(req.amount)}
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3 w-full">
                                        <button
                                            onClick={() => toast.error('Tính năng từ chối đang phát triển')}
                                            className="flex-1 flex items-center justify-center gap-2 px-4 py-4 bg-white border border-slate-200 text-slate-500 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-rose-50 hover:text-rose-600 hover:border-rose-100 transition-all active:scale-95"
                                        >
                                            <Ban size={14} /> Từ chối
                                        </button>
                                        <button
                                            onClick={() => handleApprove(req.id, getSupplierIdFromNotes(req.notes))}
                                            disabled={!!processingId}
                                            className="flex-[2] flex items-center justify-center gap-2 px-6 py-4 bg-blue-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-wider whitespace-nowrap hover:bg-blue-700 shadow-xl shadow-blue-500/20 hover:shadow-blue-500/40 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            {processingId === req.id ? (
                                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                            ) : (
                                                <>
                                                    <Check size={16} /> Phê duyệt & Chi trả
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="flex flex-col items-center justify-center py-24 bg-white rounded-[40px] border border-slate-100 border-dashed">
                        <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-6">
                            <CheckCircle2 size={40} className="text-slate-200" />
                        </div>
                        <h3 className="text-xl font-black text-slate-900 mb-2">Đã giải quyết tất cả yêu cầu</h3>
                        <p className="text-slate-500 font-medium">Hệ thống hiện không có yêu cầu thanh toán nào cần xử lý.</p>
                    </div>
                )}
            </div>
        </div>
    )
}

function getSupplierIdFromNotes(notes: string) {
    if (!notes) return '';
    const parts = notes.split(': ');
    if (parts.length > 1) return parts[1].trim();
    return '';
}

