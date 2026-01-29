'use client'

/**
 * User Credit Wallet Page (Lite Version of Contractor Financial Hub)
 * Allows users to view their debt, credit limit, and pay outstanding invoices.
 */

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
    Wallet,
    ArrowLeft,
    CreditCard,
    DollarSign,
    Clock,
    CheckCircle,
    AlertCircle,
    ChevronRight,
    QrCode,
    Loader2,
    Calendar,
    TrendingUp,
    ShoppingBag,
    FileText,
    CheckCircle2,
    X
} from 'lucide-react'
import { toast } from 'react-hot-toast'
import QRPayment from '@/components/QRPayment'
import { formatCurrency } from '@/lib/utils'
import { useAuth } from '@/contexts/auth-context'

export default function UserCreditPage() {
    const { user, isAuthenticated, isLoading: authLoading } = useAuth()
    const router = useRouter()
    const [loading, setLoading] = useState(true)
    const [data, setData] = useState<any>(null)
    const [showPaymentModal, setShowPaymentModal] = useState(false)
    const [selectedInvoice, setSelectedInvoice] = useState<any>(null)

    useEffect(() => {
        if (!authLoading && !isAuthenticated) {
            router.push('/login')
        }
        if (user) {
            fetchCreditData()
        }
    }, [user, isAuthenticated, authLoading])

    const fetchCreditData = async () => {
        setLoading(true)
        try {
            const res = await fetch('/api/user/credit-wallet')
            if (res.ok) {
                const result = await res.json()
                setData(result.data)
            } else {
                setData(MOCK_USER_DATA)
            }
        } catch (error) {
            console.error('Error fetching credit data:', error)
            setData(MOCK_USER_DATA)
        } finally {
            setLoading(false)
        }
    }

    if (loading && !data) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC]">
                <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
            </div>
        )
    }

    const summary = data?.summary || MOCK_USER_DATA.summary
    const invoices = data?.invoices || MOCK_USER_DATA.invoices
    const availableCredit = summary.creditLimit - summary.totalDebt
    const usagePercent = summary.creditLimit > 0 ? (summary.totalDebt / summary.creditLimit) * 100 : 0

    return (
        <div className="min-h-screen bg-[#F8FAFC] pb-20">
            {/* Header Area */}
            <div className="bg-white border-b border-slate-100 sticky top-0 z-20 backdrop-blur-md bg-white/80">
                <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link href="/account" className="p-2.5 text-slate-400 hover:text-slate-900 hover:bg-slate-50 rounded-xl transition-all border border-transparent hover:border-slate-200">
                            <ArrowLeft size={20} />
                        </Link>
                        <div>
                            <h1 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                                <Wallet className="w-6 h-6 text-blue-600" />
                                Ví Tín Dụng
                            </h1>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">SmartBuild Finance</p>
                        </div>
                    </div>
                    <div className="hidden sm:flex items-center gap-2">
                        <span className={`w-2.5 h-2.5 rounded-full ${summary.totalDebt > 0 ? 'bg-amber-400 animate-pulse' : 'bg-emerald-400'}`}></span>
                        <span className="text-[11px] font-black text-slate-600 uppercase tracking-wider">
                            {summary.totalDebt > 0 ? 'Có dư nợ cần trả' : 'Tài chính ổn định'}
                        </span>
                    </div>
                </div>
            </div>

            <div className="max-w-5xl mx-auto px-6 py-8 space-y-8">
                {/* Bento Grid Layout */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Main Credit Card - High End Gradient */}
                    <div className="lg:col-span-2 relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 rounded-[40px] p-10 text-white shadow-2xl shadow-indigo-100 group">
                        {/* Decorative elements */}
                        <div className="absolute top-0 right-0 p-32 bg-blue-500 rounded-full blur-[120px] opacity-20 group-hover:opacity-30 transition-opacity"></div>
                        <div className="absolute -left-16 -bottom-16 w-64 h-64 border-[40px] border-white/5 rounded-full"></div>

                        <div className="relative z-10">
                            <div className="flex justify-between items-start mb-16">
                                <div className="flex items-center gap-3 px-4 py-2 bg-white/10 rounded-2xl border border-white/10 backdrop-blur-md">
                                    <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                                        <QrCode size={18} className="text-white" />
                                    </div>
                                    <span className="text-xs font-black uppercase tracking-widest text-blue-100">SmartBuild Premium</span>
                                </div>
                                <div className="text-right">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Tổng hạn mức</p>
                                    <p className="text-2xl font-black tracking-tight text-white">{formatCurrency(summary.creditLimit)}</p>
                                </div>
                            </div>

                            <div className="mb-10">
                                <p className="text-sm font-bold text-blue-300 uppercase tracking-widest mb-2 flex items-center gap-2">
                                    <CheckCircle size={16} />
                                    Số dư khả dụng
                                </p>
                                <h2 className="text-5xl md:text-6xl font-black tracking-tighter text-white">
                                    {formatCurrency(availableCredit)}
                                </h2>
                            </div>

                            {/* Custom Progress Bar */}
                            <div className="space-y-3">
                                <div className="flex justify-between text-xs font-bold uppercase tracking-wider text-slate-400">
                                    <span className="flex items-center gap-2">
                                        <TrendingUp className="w-4 h-4 text-amber-400" />
                                        Đã dùng: {formatCurrency(summary.totalDebt)}
                                    </span>
                                    <span>{usagePercent.toFixed(1)}%</span>
                                </div>
                                <div className="h-4 bg-white/10 rounded-full overflow-hidden p-1 border border-white/5 backdrop-blur-sm">
                                    <div
                                        className={`h-full rounded-full transition-all duration-1000 ${usagePercent > 80 ? 'bg-gradient-to-r from-amber-400 to-red-500' : 'bg-gradient-to-r from-blue-400 to-indigo-400'}`}
                                        style={{ width: `${usagePercent}%` }}
                                    ></div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Quick Stats Bento Part */}
                    <div className="flex flex-col gap-6">
                        <div className="flex-1 bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm flex flex-col justify-between group hover:border-red-100 transition-all">
                            <div className="flex justify-between items-start">
                                <div className="p-4 bg-red-50 text-red-600 rounded-2xl group-hover:scale-110 transition-transform">
                                    <Clock size={24} />
                                </div>
                                <span className="bg-red-50 text-red-600 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wide">
                                    Sắp hết hạn
                                </span>
                            </div>
                            <div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Nợ đến hạn (7 ngày)</p>
                                <p className="text-3xl font-black text-slate-900">{formatCurrency(summary.dueThisWeek)}</p>
                            </div>
                        </div>

                        <div className="flex-1 bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm flex flex-col justify-between group hover:border-emerald-100 transition-all border-l-4 border-l-emerald-500">
                            <div className="flex justify-between items-start">
                                <div className="p-4 bg-emerald-50 text-emerald-600 rounded-2xl group-hover:scale-110 transition-transform">
                                    <CreditCard size={24} />
                                </div>
                                <div className="w-3 h-3 bg-emerald-400 rounded-full animate-pulse"></div>
                            </div>
                            <div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Trạng thái ví</p>
                                <p className="text-2xl font-black text-slate-900">Hoạt động tốt</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Quick Actions Bar */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <button
                        onClick={() => {
                            if (summary.totalDebt > 0) {
                                setSelectedInvoice({ amount: summary.totalDebt, invoiceNumber: 'ALL-DEBT' })
                                setShowPaymentModal(true)
                            } else {
                                toast.success('Bạn không có dư nợ cần thanh toán!')
                            }
                        }}
                        className="p-6 bg-blue-600 text-white rounded-[32px] hover:bg-blue-700 transition-all flex items-center justify-between group shadow-xl shadow-blue-100"
                    >
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-white/20 rounded-2xl">
                                <QrCode size={24} />
                            </div>
                            <div className="text-left">
                                <p className="text-sm font-black uppercase tracking-tight">Thanh toán tất cả</p>
                                <p className="text-[10px] font-bold text-blue-100">Quét mã QR chuyển khoản nhanh</p>
                            </div>
                        </div>
                        <ChevronRight className="w-5 h-5 opacity-50 group-hover:translate-x-1 transition-transform" />
                    </button>

                    <Link href="/products" className="p-6 bg-white border border-slate-200 text-slate-900 rounded-[32px] hover:border-blue-400 hover:bg-blue-50 transition-all flex items-center justify-between group">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-slate-100 rounded-2xl group-hover:bg-blue-100 transition-colors text-slate-600 group-hover:text-blue-600">
                                <ShoppingBag size={24} />
                            </div>
                            <div className="text-left">
                                <p className="text-sm font-black uppercase tracking-tight">Về trang sản phẩm</p>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Tiếp tục mua hàng</p>
                            </div>
                        </div>
                        <ChevronRight className="w-5 h-5 opacity-50 text-slate-300 group-hover:translate-x-1 transition-transform" />
                    </Link>
                </div>

                {/* Due Bills List - Modern Table Style */}
                <div className="bg-white rounded-[40px] border border-slate-200 shadow-sm overflow-hidden">
                    <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                        <h3 className="text-lg font-black text-slate-900 flex items-center gap-3">
                            <FileText size={22} className="text-blue-600" />
                            Hóa đơn chưa thanh toán
                        </h3>
                        {invoices.length > 0 && (
                            <span className="bg-blue-600 text-white px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">
                                {invoices.length} Hóa đơn
                            </span>
                        )}
                    </div>

                    <div className="divide-y divide-slate-50">
                        {invoices.length === 0 ? (
                            <div className="text-center py-20 bg-white">
                                <div className="w-20 h-20 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6">
                                    <CheckCircle2 size={40} />
                                </div>
                                <h4 className="text-xl font-black text-slate-900 mb-2">Tuyệt vời!</h4>
                                <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Bác không có hóa đơn nợ nào cần xử lý</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead>
                                        <tr className="bg-slate-50/50 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                            <th className="px-8 py-4">Mã hóa đơn</th>
                                            <th className="px-8 py-4">Ngày hết hạn</th>
                                            <th className="px-8 py-4 text-right">Số tiền</th>
                                            <th className="px-8 py-4 text-center">Hành động</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {invoices.map((inv: any) => (
                                            <tr key={inv.id} className="group hover:bg-blue-50/30 transition-all">
                                                <td className="px-8 py-6">
                                                    <p className="font-black text-slate-900 text-sm group-hover:text-blue-600 transition-colors uppercase">{inv.invoiceNumber}</p>
                                                    <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-widest group-hover:text-blue-300">SmartBuild Order</p>
                                                </td>
                                                <td className="px-8 py-6">
                                                    <span className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border ${inv.status === 'OVERDUE'
                                                        ? 'bg-red-50 text-red-600 border-red-100'
                                                        : 'bg-slate-100 text-slate-600 border-slate-200'
                                                        }`}>
                                                        {inv.dueDate}
                                                    </span>
                                                </td>
                                                <td className="px-8 py-6 text-right font-black text-slate-900 text-base">
                                                    {formatCurrency(inv.amount)}
                                                </td>
                                                <td className="px-8 py-6 text-center">
                                                    <button
                                                        onClick={() => {
                                                            setSelectedInvoice(inv)
                                                            setShowPaymentModal(true)
                                                        }}
                                                        className="px-6 py-2.5 bg-blue-600/10 text-blue-600 hover:bg-blue-600 hover:text-white font-black text-[10px] uppercase tracking-widest rounded-xl transition-all active:scale-95"
                                                    >
                                                        Thanh toán
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* QR Payment Modal - Premium Redesign */}
            {showPaymentModal && selectedInvoice && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-[48px] w-full max-w-md shadow-2xl animate-in fade-in zoom-in duration-300 relative overflow-hidden flex flex-col max-h-[95vh]">
                        {/* Header Section */}
                        <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50 relative z-10">
                            <div>
                                <h3 className="text-2xl font-black text-slate-900 tracking-tight">Thanh toán</h3>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Invoice: {selectedInvoice.invoiceNumber}</p>
                            </div>
                            <button
                                onClick={() => setShowPaymentModal(false)}
                                className="w-12 h-12 flex items-center justify-center bg-white rounded-full text-slate-400 hover:text-slate-900 border border-slate-200 shadow-sm transition-all hover:scale-110 active:scale-90"
                            >
                                <X size={24} />
                            </button>
                        </div>

                        {/* QR Payment Component Wrapper */}
                        <div className="flex-1 overflow-y-auto p-8 scroll-smooth scrollbar-hide">
                            <div className="bg-white rounded-[32px] p-2 border border-slate-100">
                                <QRPayment
                                    amount={selectedInvoice.amount}
                                    orderId={selectedInvoice.invoiceNumber}
                                    description={`Thanh toan no ${selectedInvoice.invoiceNumber}`}
                                />
                            </div>

                            <div className="mt-8 p-6 bg-blue-50 rounded-[32px] border border-blue-100/50">
                                <p className="text-center text-[11px] text-blue-600 font-black uppercase tracking-widest">
                                    Hệ thống tự động duyệt sau khi nhận được chuyển khoản
                                </p>
                                <p className="text-center text-[10px] text-slate-400 mt-2 font-medium"> Vui lòng giữ đúng nội dung chuyển khoản để được duyệt tự động nhanh nhất (1-3 phút).</p>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

const MOCK_USER_DATA = {
    summary: {
        totalDebt: 5500000,
        creditLimit: 20000000,
        dueThisWeek: 3000000
    },
    invoices: [
        { id: '1', invoiceNumber: 'INV-SB-0021', amount: 2500000, dueDate: '2026-02-15', status: 'PENDING' },
        { id: '2', invoiceNumber: 'INV-SB-0018', amount: 3000000, dueDate: '2026-01-20', status: 'OVERDUE' }
    ]
}

