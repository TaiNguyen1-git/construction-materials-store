'use client'

import { useState, useEffect } from 'react'
import { DollarSign, TrendingUp, AlertCircle, CreditCard, ChevronRight, CheckCircle2, Wallet, ArrowUpRight, History, Calendar, Receipt, Search, Filter, X, Loader2, Banknote, ShieldCheck, Download, Clock, Lock } from 'lucide-react'
import Link from 'next/link'
import toast from 'react-hot-toast'

export default function SupplierPaymentsPage() {
    const [data, setData] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')
    const [isFilterOpen, setIsFilterOpen] = useState(false)
    const [reconcilingId, setReconcilingId] = useState<string | null>(null)
    const [isRequesting, setIsRequesting] = useState(false)
    const [showWithdrawModal, setShowWithdrawModal] = useState(false)
    const [withdrawStep, setWithdrawStep] = useState(1) // 1: Confirm, 2: Processing, 3: Success

    // Developer Tool State
    const [lastPaymentId, setLastPaymentId] = useState<string | null>(null)

    useEffect(() => {
        fetchPayments()
    }, [])

    const fetchPayments = async () => {
        try {
            const supplierId = localStorage.getItem('supplier_id')
            if (!supplierId) return;
            const res = await fetch(`/api/supplier/payments?supplierId=${supplierId}`)
            const result = await res.json()

            if (result.success) {
                setData(result.data)
            }
        } catch (error) {
            toast.error('Không thể tải thông tin công nợ')
        } finally {
            setLoading(false)
        }
    }

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount || 0)
    }

    const handleReconcile = async (orderId: string, orderNumber: string) => {
        setReconcilingId(orderId)
        const loadingToast = toast.loading(`Đang xác nhận đối soát đơn #${orderNumber}...`)

        try {
            const res = await fetch('/api/supplier/orders/status', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: orderId,
                    status: 'CONFIRMED',
                    notes: 'Nhà cung cấp đã đối soát thành công đơn hàng.'
                })
            })

            const result = await res.json()

            if (result.success) {
                toast.success(`Đã đối soát thành công đơn #${orderNumber}`, { id: loadingToast })
                fetchPayments()
            } else {
                toast.error(result.message || 'Lỗi khi đối soát', { id: loadingToast })
            }
        } catch (error) {
            toast.error('Lỗi kết nối máy chủ', { id: loadingToast })
        } finally {
            setReconcilingId(null)
        }
    }

    const handleExport = async () => {
        const supplierId = localStorage.getItem('supplier_id')
        if (!supplierId) return;

        const loadingToast = toast.loading('Đang chuẩn bị sao kê...')
        try {
            const res = await fetch(`/api/supplier/payments/export?supplierId=${supplierId}`)
            if (!res.ok) throw new Error('Export failed')

            const blob = await res.blob()
            const url = window.URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = `sao-ke-doanh-thu-${new Date().toISOString().split('T')[0]}.xlsx`
            document.body.appendChild(a)
            a.click()
            window.URL.revokeObjectURL(url)

            toast.success('Đã tải xuống sao kê thành công!', { id: loadingToast })
        } catch (error) {
            toast.error('Lỗi khi xuất sao kê', { id: loadingToast })
        }
    }

    const processWithdrawRequest = async () => {
        const supplierId = localStorage.getItem('supplier_id')
        if (!supplierId || !data?.summary?.currentBalance) return;

        // Validation: Check for bank account configuration
        if (!data?.summary?.bankAccountNumber || !data?.summary?.bankName) {
            toast.error('Vui lòng cập nhật thông tin ngân hàng đầy đủ trong Hồ sơ trước khi rút tiền', {
                duration: 4000,
                icon: '🏦'
            })
            return
        }

        setIsRequesting(true)
        setWithdrawStep(2)

        try {
            const res = await fetch('/api/supplier/payments', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    supplierId,
                    amount: data.summary.currentBalance
                })
            })

            const result = await res.json()
            if (result.success) {
                setLastPaymentId(result.data.id) // Save ID for dev tool
                setWithdrawStep(3)
                fetchPayments()
            } else {
                toast.error(result.message || 'Lỗi khi gửi yêu cầu')
                setWithdrawStep(1)
            }
        } catch (error) {
            toast.error('Lỗi kết nối máy chủ')
            setWithdrawStep(1)
        } finally {
            setIsRequesting(false)
        }
    }



    const closeWithdrawModal = () => {
        setShowWithdrawModal(false)
        setWithdrawStep(1)
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        )
    }

    const summary = data?.summary || {}
    const transactions = data?.unpaidTransactions || []
    const filteredTransactions = transactions.filter((tx: any) =>
        tx.orderNumber.toLowerCase().includes(searchTerm.toLowerCase())
    )

    // Check if there are any pending withdrawals
    const pendingWithdrawals = data?.paymentHistory?.filter((pm: any) => pm.status === 'PENDING') || []
    const hasPending = pendingWithdrawals.length > 0

    // Bank configured check
    const hasBankConfig = summary.bankAccountNumber && summary.bankName

    return (
        <div className="space-y-10 pb-20 relative">
            {/* Withdraw Modal Overlay */}
            {showWithdrawModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300" onClick={closeWithdrawModal} />

                    <div className="relative bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
                        {withdrawStep === 1 && (
                            <div className="p-10 space-y-8">
                                <div className="flex justify-between items-start">
                                    <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-100">
                                        <Banknote className="w-8 h-8 text-emerald-600" />
                                    </div>
                                    <button onClick={closeWithdrawModal} className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-slate-100 transition-colors">
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
                                            <span className="text-2xl font-black text-emerald-600 tracking-tighter">{formatCurrency(summary.currentBalance)}</span>
                                        </div>
                                        <div className="pt-4 border-t border-slate-200">
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Chuyển về tài khoản</p>
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center border border-slate-200 shadow-sm">
                                                    <CreditCard className="w-5 h-5 text-slate-700" />
                                                </div>
                                                <div>
                                                    <p className="font-bold text-slate-900">{summary.bankName}</p>
                                                    <p className="text-xs font-mono text-slate-500">{summary.bankAccountNumber} • {summary.bankAccountName}</p>
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
                                        onClick={closeWithdrawModal}
                                        className="flex-1 px-6 py-4 bg-slate-100 text-slate-600 font-bold rounded-2xl hover:bg-slate-200 transition-all active:scale-95"
                                    >
                                        Hủy
                                    </button>
                                    <button
                                        onClick={processWithdrawRequest}
                                        className={`flex-[2] px-6 py-4 font-bold rounded-2xl transition-all shadow-lg active:scale-95 flex items-center justify-center gap-2 cursor-pointer
                                            ${!hasBankConfig
                                                ? 'bg-slate-300 text-slate-500 shadow-none hover:bg-slate-400'
                                                : 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-emerald-200'
                                            }`}
                                    >
                                        Gửi yêu cầu
                                        <ChevronRight className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>
                        )}

                        {withdrawStep === 2 && (
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

                        {withdrawStep === 3 && (
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
                                    onClick={closeWithdrawModal}
                                    className="w-full px-6 py-4 bg-slate-900 text-white font-bold rounded-2xl hover:bg-slate-800 transition-all shadow-lg active:scale-95"
                                >
                                    Đã hiểu
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="space-y-1">
                    <h1 className="text-4xl font-black text-slate-900 tracking-tight">Quản Lý Doanh Thu</h1>
                    <p className="text-slate-500 font-medium italic">Theo dõi tài chính, công nợ và lịch sử nhận tiền thanh toán từ hệ thống.</p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={handleExport}
                        className="flex items-center gap-2 px-6 py-3 bg-white border border-slate-200 text-slate-700 font-bold rounded-2xl hover:bg-slate-50 transition-all shadow-sm active:scale-95"
                    >
                        <Download className="w-4 h-4" />
                        Tải sao kê
                    </button>
                    <button
                        onClick={() => {
                            if (hasPending) {
                                toast.error('Bạn đang có yêu cầu rút tiền chờ duyệt. Vui lòng đợi.')
                            } else if (summary.currentBalance > 0) {
                                setShowWithdrawModal(true)
                            } else {
                                toast.success('Bạn không có doanh thu chờ quyết toán')
                            }
                        }}
                        disabled={loading || summary.currentBalance === 0}
                        className={`flex items-center gap-2 px-6 py-3 font-bold rounded-2xl transition-all shadow-lg active:scale-95 disabled:opacity-50 ${hasPending ? 'bg-amber-100 text-amber-700 shadow-amber-100 hover:bg-amber-200 cursor-not-allowed' : 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-emerald-200'}`}
                    >
                        {hasPending ? <Clock className="w-4 h-4" /> : <Banknote className="w-4 h-4" />}
                        {hasPending ? 'Đang chờ duyệt...' : 'Yêu cầu nhận tiền'}
                    </button>
                </div>
            </div>

            {/* Premium Stat Bento Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Dư nợ card (Doanh thu chờ thu hồi) */}
                <div className="group relative bg-[#F0FDF4] border border-emerald-100 rounded-[2.5rem] p-8 overflow-hidden shadow-xl shadow-emerald-100/30 transition-all duration-500 hover:-translate-y-2">
                    <div className="absolute top-0 right-0 w-40 h-40 bg-emerald-500/5 rounded-full blur-3xl -mr-20 -mt-20" />
                    <div className="flex flex-col h-full min-h-[160px] justify-between relative z-10">
                        <div className="flex justify-between items-start">
                            <div className="w-14 h-14 bg-emerald-100/50 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-100 border border-emerald-200">
                                <DollarSign className="w-7 h-7 text-emerald-600" />
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

            {/* Detailed Tables Section */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-10">
                <div className="xl:col-span-2 space-y-6">
                    <div className="flex items-center justify-between px-2">
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl">
                                <AlertCircle className="w-6 h-6" />
                            </div>
                            <div>
                                <h2 className="text-xl font-black text-slate-900 tracking-tight">Đơn hàng chờ quyết toán</h2>
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Danh sách các khoản tiền hệ thống đang treo</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            {/* Keep filters as is */}
                            <div className="flex items-center bg-white border border-slate-200 rounded-xl transition-all duration-300 px-3 w-64 focus-within:border-emerald-400 focus-within:shadow-md focus-within:ring-2 focus-within:ring-emerald-50">
                                <Search className="w-4 h-4 flex-shrink-0 text-slate-400" />
                                <input
                                    type="text"
                                    placeholder="Tìm theo mã đơn (PO)..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="ml-2 bg-transparent border-none outline-none text-sm w-full font-medium h-10"
                                />
                                {searchTerm && <X className="w-3 h-3 text-slate-300 hover:text-slate-500 cursor-pointer" onClick={() => setSearchTerm('')} />}
                            </div>
                            <button
                                onClick={() => setIsFilterOpen(!isFilterOpen)}
                                className={`w-10 h-10 flex items-center justify-center bg-white border rounded-xl transition-all shadow-sm ${isFilterOpen ? 'border-emerald-600 text-emerald-600 bg-emerald-50' : 'border-slate-200 text-slate-400 hover:text-emerald-600'}`}
                            >
                                <Filter className="w-4 h-4" />
                            </button>
                        </div>
                    </div>

                    {/* Filter Dropdown */}
                    {isFilterOpen && (
                        <div className="p-6 bg-emerald-50/50 border border-emerald-100 rounded-[2rem] animate-in fade-in slide-in-from-top-2 duration-300">
                            <div className="flex flex-wrap gap-4">
                                <span className="text-[10px] font-black uppercase text-emerald-600 tracking-widest w-full">Lọc nhanh theo trạng thái</span>
                                {['Tất cả', 'Đã giao hàng', 'Chờ xác nhận'].map((f) => (
                                    <button
                                        key={f}
                                        className={`px-4 py-2 bg-white border border-emerald-100 rounded-xl text-xs font-bold text-slate-600 hover:border-emerald-400 hover:text-emerald-600 transition-all ${f === 'Tất cả' ? 'border-emerald-400 text-emerald-600' : ''}`}
                                    >
                                        {f}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/40 overflow-hidden">
                        <div className="overflow-x-auto custom-scrollbar">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-slate-50/50">
                                        <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] border-b border-slate-100">Đơn hàng (PO)</th>
                                        <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] border-b border-slate-100">Ngày tạo</th>
                                        <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] border-b border-slate-100 text-right">Doanh thu (VNĐ)</th>
                                        <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] border-b border-slate-100 text-center">Tác vụ</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {filteredTransactions.length > 0 ? (
                                        filteredTransactions.map((tx: any, idx: number) => (
                                            <tr key={idx} className="group hover:bg-slate-50/50 transition-all">
                                                <td className="px-8 py-6 font-black text-blue-600 text-lg">#{tx.orderNumber}</td>
                                                <td className="px-8 py-6">
                                                    <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
                                                        <Calendar className="w-4 h-4 text-slate-300" />
                                                        {new Date(tx.createdAt).toLocaleDateString('vi-VN')}
                                                    </div>
                                                </td>
                                                <td className="px-8 py-6 text-right">
                                                    <div className="text-lg font-black text-emerald-600">
                                                        {formatCurrency(tx.totalAmount)}
                                                    </div>
                                                </td>
                                                <td className="px-8 py-6 text-center">
                                                    <button
                                                        onClick={() => handleReconcile(tx.id, tx.orderNumber)}
                                                        disabled={reconcilingId === tx.id}
                                                        className="min-w-[120px] px-6 py-2.5 bg-white border border-slate-200 text-slate-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:border-emerald-600 hover:text-emerald-600 transition-all shadow-sm active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
                                                    >
                                                        {reconcilingId === tx.id ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Đối soát'}
                                                    </button>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan={4} className="px-8 py-32 text-center grayscale opacity-10">
                                                <div className="flex flex-col items-center">
                                                    <Banknote className="w-20 h-20 mb-4" />
                                                    <p className="text-xl font-black uppercase tracking-[0.4em] text-slate-400">Không có doanh thu chờ</p>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {/* Right: Payment History */}
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
                        {data?.paymentHistory?.length > 0 ? (
                            data.paymentHistory.map((pm: any, idx: number) => (
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
            </div>
        </div>
    )
}
