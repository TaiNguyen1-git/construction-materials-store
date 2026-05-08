'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import QRPayment from '@/components/QRPayment'
import { useAuth } from '@/contexts/auth-context'
import { fetchWithAuth } from '@/lib/api-client'
import {
    LayoutDashboard,
    TrendingUp,
    CreditCard,
    AlertCircle,
    Building2,
    Clock,
    Coins,
    ChevronRight,
    Download,
    Wallet,
    PieChart,
    ArrowUpRight,
    Calendar,
    FileText,
    CheckCircle2,
    X,
    Loader2,
    ShieldCheck,
    Zap,
    Scale,
    History,
    FileSearch,
    RefreshCw
} from 'lucide-react'
import { toast, Toaster } from 'react-hot-toast'
import React from 'react'
import { Badge } from '@/components/ui/badge'

interface FinancialSummary {
    totalDebt: number
    creditLimit: number
    escrowBalance: number
    dueThisWeek: number
}

interface FinancialProject {
    id: string
    name: string
    startDate: string
    debtAmount: number
    nextDueDate: string
    daysLeft: number
    hasOverdue: boolean
}

interface FinancialInvoice {
    id?: string
    invoiceNumber: string
    projectName?: string
    dueDate?: string
    amount: number
    paid?: number
    status?: string
}

interface FinancialData {
    summary: FinancialSummary
    projects: FinancialProject[]
    invoices: FinancialInvoice[]
}

const formatCurrency = (val: number) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val)

export default function ContractorFinancialHub() {
    const pathname = usePathname()
    const { user } = useAuth()
    const [loading, setLoading] = useState(true)
    const [data, setData] = useState<FinancialData | null>(null)

    // Modal States
    const [showPaymentModal, setShowPaymentModal] = useState(false)
    const [selectedInvoice, setSelectedInvoice] = useState<FinancialInvoice | null>(null)
    const [showCreditRequestModal, setShowCreditRequestModal] = useState(false)
    const [creditRequestAmount, setCreditRequestAmount] = useState('')
    const [creditRequestReason, setCreditRequestReason] = useState('')
    const [requestLoading, setRequestLoading] = useState(false)

    useEffect(() => {
        if (user) {
            fetchFinancialData()
        }
    }, [user])

    const fetchFinancialData = async () => {
        setLoading(true)
        try {
            const res = await fetchWithAuth('/api/contractor/financial-hub')
            if (res.ok) {
                const result = await res.json()
                setData(result.data)
            } else {
                toast.error('Không thể tải dữ liệu tài chính.')
                setData({
                    summary: { totalDebt: 0, creditLimit: 0, escrowBalance: 0, dueThisWeek: 0 },
                    projects: [],
                    invoices: []
                })
            }
        } catch (error) {
            toast.error('Lỗi kết nối máy chủ.')
            setData({
                summary: { totalDebt: 0, creditLimit: 0, escrowBalance: 0, dueThisWeek: 0 },
                projects: [],
                invoices: []
            })
        } finally {
            setLoading(false)
        }
    }

    const handleRequestCreditIncrease = async (e: React.FormEvent) => {
        e.preventDefault()
        setRequestLoading(true)
        try {
            const res = await fetchWithAuth('/api/credit/request-increase', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    amount: parseFloat(creditRequestAmount),
                    reason: creditRequestReason
                })
            })

            if (res.ok) {
                toast.success('Đã gửi yêu cầu nâng hạn mức tín dụng!')
                setShowCreditRequestModal(false)
                setCreditRequestAmount('')
                setCreditRequestReason('')
            } else {
                toast.error('Yêu cầu bị từ chối hoặc có lỗi xảy ra.')
            }
        } catch (error) {
            toast.error('Lỗi kết nối.')
        } finally {
            setRequestLoading(false)
        }
    }

    if (loading && !data) {
        return (
            <div className="h-[400px] flex flex-col items-center justify-center gap-4">
                <Loader2 className="w-8 h-8 text-blue-600 animate-spin opacity-40" />
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest px-1">Đang đồng bộ dữ liệu tài chính...</p>
            </div>
        )
    }

    const summary = data?.summary || { totalDebt: 0, creditLimit: 0, escrowBalance: 0, dueThisWeek: 0 }
    const projects = data?.projects || []
    const creditUsage = summary.creditLimit > 0 ? (summary.totalDebt / summary.creditLimit) * 100 : 0

    return (
        <div className="space-y-8 pb-20 max-w-7xl mx-auto px-4 sm:px-0">
            <Toaster position="top-right" />
            
            {/* Standard Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="space-y-1">
                    <h1 className="text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-3">
                        <Wallet className="w-8 h-8 text-blue-600" />
                        Quản lý Công nợ
                    </h1>
                    <p className="text-slate-500 text-sm font-medium">Hạn mức tín dụng và thanh toán dự án B2B</p>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setShowCreditRequestModal(true)}
                        className="px-6 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-slate-50 transition-all shadow-sm active:scale-95"
                    >
                        <ArrowUpRight size={18} /> Nâng hạn mức
                    </button>
                    <button
                        onClick={() => {
                            toast.success('Đang chuẩn bị báo cáo tài chính...')
                        }}
                        className="px-6 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-blue-700 transition-all shadow-md active:scale-95"
                    >
                        <Download size={18} /> Tải báo cáo
                    </button>
                </div>
            </div>

            {/* Tab Navigation */}
            <div className="flex border-b border-slate-200 gap-8">
                <Link 
                    href="/contractor/debt"
                    className={`pb-4 text-sm font-bold transition-all border-b-2 ${pathname === '/contractor/debt' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
                >
                    Công nợ đối tác
                </Link>
                <Link 
                    href="/contractor/wallet"
                    className={`pb-4 text-sm font-bold transition-all border-b-2 ${pathname === '/contractor/wallet' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
                >
                    Ví hoa hồng
                </Link>
                <Link 
                    href="/contractor/invoices"
                    className={`pb-4 text-sm font-bold transition-all border-b-2 ${pathname === '/contractor/invoices' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
                >
                    Hóa đơn VAT
                </Link>
            </div>

            {/* Financial Status Banner */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Credit Limits Card */}
                <div className="lg:col-span-2 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl p-8 text-white shadow-xl shadow-indigo-100 flex flex-col justify-between relative overflow-hidden group min-h-[220px]">
                    <div className="relative z-10">
                        <p className="text-xs font-bold text-blue-100 uppercase tracking-wider mb-2">Hạn mức khả dụng</p>
                        <h2 className="text-4xl font-bold tracking-tight">
                            {formatCurrency(summary.creditLimit - summary.totalDebt)}
                        </h2>
                    </div>

                    <div className="relative z-10 space-y-4 mt-8 pt-6 border-t border-white/10">
                        <div className="flex justify-between items-end">
                            <div className="space-y-0.5">
                                <p className="text-[10px] font-bold text-blue-100 uppercase tracking-wider opacity-60">Hạn mức tín dụng</p>
                                <p className="text-xl font-bold">{formatCurrency(summary.creditLimit)}</p>
                            </div>
                            <div className="text-right space-y-0.5">
                                <p className="text-[10px] font-bold text-blue-100 uppercase tracking-wider opacity-60">Tỷ lệ sử dụng</p>
                                <p className="text-xl font-bold tracking-tight">{creditUsage.toFixed(1)}%</p>
                            </div>
                        </div>
                        <div className="h-2 bg-black/10 rounded-full overflow-hidden">
                            <div
                                className={`h-full rounded-full transition-all duration-1000 ${creditUsage > 80 ? 'bg-rose-400' : 'bg-emerald-400'}`}
                                style={{ width: `${creditUsage}%` }}
                            ></div>
                        </div>
                    </div>
                </div>

                {/* Quick Alerts */}
                <div className="flex flex-col gap-4">
                    <div className="flex-1 bg-white rounded-2xl p-6 border border-slate-100 shadow-sm flex flex-col justify-between">
                        <div className="flex justify-between items-start">
                            <div className="space-y-1">
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Đến hạn tuần này</p>
                                <h3 className="text-2xl font-bold text-rose-600 tabular-nums">{formatCurrency(summary.dueThisWeek)}</h3>
                            </div>
                            <div className="p-3 bg-rose-50 text-rose-600 rounded-xl">
                                <Clock size={20} />
                            </div>
                        </div>
                        <p className="text-[11px] font-bold text-slate-400 italic">Vui lòng thanh toán trước ngày đến hạn.</p>
                    </div>

                    <div className="flex-1 bg-blue-600 rounded-2xl p-6 text-white flex flex-col justify-between shadow-md">
                        <div className="flex justify-between items-start">
                            <div className="space-y-1">
                                <p className="text-[10px] font-bold text-blue-100 uppercase tracking-wider">Tiền ký quỹ (Escrow)</p>
                                <h3 className="text-2xl font-bold text-white tabular-nums">{formatCurrency(summary.escrowBalance)}</h3>
                            </div>
                            <div className="p-3 bg-white/10 text-white rounded-xl border border-white/10">
                                <Scale size={20} />
                            </div>
                        </div>
                        <p className="text-[11px] font-bold text-blue-100 italic">Số tiền đang giữ hộ cho các cột mốc.</p>
                    </div>
                </div>
            </div>

            {/* Project Debt List */}
            <div className="space-y-6">
                <div className="flex items-center gap-3 px-1">
                    <PieChart size={20} className="text-blue-600" />
                    <h2 className="text-xl font-bold text-slate-900">Chi tiết nợ theo dự án</h2>
                </div>

                {projects.length === 0 ? (
                    <div className="bg-white p-20 text-center rounded-3xl border-2 border-dashed border-slate-100 text-slate-300">
                        <Building2 size={64} className="mx-auto mb-4 opacity-20" />
                        <p className="text-sm font-bold uppercase tracking-widest">Không có dư nợ dự án</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {projects.map((project: FinancialProject) => (
                            <div key={project.id} className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm hover:shadow-md transition-all flex flex-col h-full">
                                <div className="space-y-6 flex-1">
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="w-12 h-12 bg-slate-50 rounded-xl flex items-center justify-center text-slate-300 border border-slate-100">
                                                <Building2 size={24} />
                                            </div>
                                            <div className="space-y-0.5">
                                                <h4 className="text-base font-bold text-slate-900 line-clamp-1">{project.name}</h4>
                                                <p className="text-[10px] font-bold text-slate-400 uppercase">Bắt đầu: {project.startDate}</p>
                                            </div>
                                        </div>
                                        {project.hasOverdue && (
                                            <Badge className="bg-rose-50 text-rose-600 text-[9px] font-bold uppercase border-rose-100 shadow-none px-2 py-0.5">Overdue</Badge>
                                        )}
                                    </div>

                                    <div className="space-y-4 py-4 border-y border-slate-50">
                                        <div className="flex justify-between items-end">
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Tổng nợ dự án</p>
                                            <p className="text-lg font-bold text-slate-900">{formatCurrency(project.debtAmount)}</p>
                                        </div>
                                        <div className="flex justify-between items-end">
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Hạn thanh toán</p>
                                            <div className="text-right">
                                                <p className={`text-xs font-bold ${project.hasOverdue ? 'text-rose-500' : 'text-slate-700'}`}>{project.nextDueDate}</p>
                                                <p className="text-[9px] font-bold text-slate-400">
                                                    {project.daysLeft < 0 ? `Trễ ${Math.abs(project.daysLeft)} ngày` : `Còn ${project.daysLeft} ngày`}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="pt-6 flex gap-2 mt-auto">
                                    <Link
                                        href={`/contractor/projects/${project.id}`}
                                        className="flex-1 py-2.5 bg-slate-50 text-slate-500 hover:bg-slate-100 rounded-xl text-[11px] font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all active:scale-95 border border-slate-200"
                                    >
                                        Chi tiết
                                    </Link>
                                    <button
                                        onClick={() => {
                                            setSelectedInvoice({ amount: project.debtAmount, invoiceNumber: `PAY-PROJ-${project.id}` })
                                            setShowPaymentModal(true)
                                        }}
                                        className="flex-1 py-2.5 bg-blue-600 text-white rounded-xl text-[11px] font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all active:scale-95 shadow-sm hover:bg-blue-700"
                                    >
                                        Thanh toán
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Invoices Ledger Table */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-slate-50 flex items-center gap-3">
                    <History size={20} className="text-blue-600" />
                    <h2 className="text-lg font-bold text-slate-900">Danh sách hóa đơn tồn</h2>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="bg-slate-50/50">
                                <th className="px-6 py-4 text-left text-[10px] font-bold uppercase tracking-wider text-slate-400">Mã hóa đơn</th>
                                <th className="px-6 py-4 text-left text-[10px] font-bold uppercase tracking-wider text-slate-400">Dự án</th>
                                <th className="px-6 py-4 text-center text-[10px] font-bold uppercase tracking-wider text-slate-400">Ngày đến hạn</th>
                                <th className="px-6 py-4 text-right text-[10px] font-bold uppercase tracking-wider text-slate-400">Còn lại</th>
                                <th className="px-6 py-4 text-right text-[10px] font-bold uppercase tracking-wider text-slate-400">Thao tác</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {(!data?.invoices || data.invoices.length === 0) ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-10 text-center text-xs font-bold text-slate-400 uppercase tracking-widest">
                                        Không có hóa đơn tồn đọng
                                    </td>
                                </tr>
                            ) : (
                                data.invoices.map((inv: FinancialInvoice) => (
                                    <tr key={inv.id} className="hover:bg-slate-50 transition-all duration-300">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className="text-xs font-bold text-blue-600">{inv.invoiceNumber}</span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-xs font-bold text-slate-700">{inv.projectName || 'Mua lẻ'}</span>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <Badge className={`px-2 py-0.5 rounded-lg text-[9px] font-bold uppercase shadow-none border-none ${inv.status === 'OVERDUE' ? 'bg-rose-50 text-rose-600' : 'bg-slate-100 text-slate-500'}`}>
                                                {inv.dueDate}
                                            </Badge>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <span className="text-sm font-bold text-slate-900">{formatCurrency(inv.amount - (inv.paid || 0))}</span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button
                                                onClick={() => {
                                                    setSelectedInvoice(inv)
                                                    setShowPaymentModal(true)
                                                }}
                                                className="px-4 py-2 bg-blue-600 text-white rounded-lg text-[10px] font-bold uppercase tracking-wider hover:bg-blue-700 transition-all active:scale-95 shadow-sm"
                                            >
                                                Trả nợ
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Credit Escalation Modal */}
            {showCreditRequestModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm animate-in fade-in" onClick={() => setShowCreditRequestModal(false)}></div>
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-300 relative z-10">
                        <div className="bg-blue-600 p-6 text-white flex justify-between items-center">
                            <h2 className="text-lg font-bold uppercase tracking-tight flex items-center gap-2">
                                <ArrowUpRight className="w-5 h-5" />
                                Nâng hạn mức tín dụng
                            </h2>
                            <button onClick={() => setShowCreditRequestModal(false)} className="text-white/60 hover:text-white transition-colors"><X size={20} /></button>
                        </div>
                        <form onSubmit={handleRequestCreditIncrease} className="p-6 space-y-6">
                            <div className="space-y-2">
                                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest px-1">Số tiền mong muốn (VNĐ)</label>
                                <input
                                    type="number"
                                    required
                                    value={creditRequestAmount}
                                    onChange={(e) => setCreditRequestAmount(e.target.value)}
                                    className="w-full px-5 py-4 bg-slate-50 border-none rounded-xl text-2xl font-bold focus:ring-2 focus:ring-primary/10 outline-none transition-all placeholder:text-slate-200"
                                    placeholder="50.000.000"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest px-1">Lý do yêu cầu</label>
                                <textarea
                                    required
                                    rows={4}
                                    value={creditRequestReason}
                                    onChange={(e) => setCreditRequestReason(e.target.value)}
                                    className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl text-sm font-semibold leading-relaxed focus:ring-2 focus:ring-primary/10 outline-none transition-all"
                                    placeholder="Ví dụ: Cần nhập hàng cho dự án mới tại Quận 2..."
                                />
                            </div>
                             <button
                                type="submit"
                                disabled={requestLoading}
                                className="w-full py-3.5 bg-blue-600 text-white font-bold rounded-xl text-xs uppercase tracking-wider hover:bg-blue-700 transition-all flex items-center justify-center gap-2 shadow-lg active:scale-95"
                            >
                                {requestLoading ? <Loader2 size={16} className="animate-spin text-white" /> : 'Gửi yêu cầu xét duyệt'}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* Payment Modal */}
            {showPaymentModal && selectedInvoice && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm animate-in fade-in" onClick={() => setShowPaymentModal(false)}></div>
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-300 relative z-10 flex flex-col">
                        <div className="bg-blue-600 p-6 text-white flex justify-between items-center">
                            <h2 className="text-lg font-bold uppercase tracking-tight flex items-center gap-2">
                                <Zap className="w-5 h-5 text-amber-500" />
                                Thanh toán nhanh
                            </h2>
                            <button onClick={() => setShowPaymentModal(false)} className="text-white/60 hover:text-white transition-all"><X size={20} /></button>
                        </div>

                        <div className="p-6 space-y-6">
                            <div className="text-center space-y-1">
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Số tiền thanh toán</p>
                                <p className="text-3xl font-bold text-slate-900">{formatCurrency(selectedInvoice.amount)}</p>
                            </div>
                            <div className="flex justify-center p-2 bg-white rounded-xl border border-slate-100 shadow-inner">
                                <QRPayment
                                    amount={selectedInvoice.amount}
                                    orderId={selectedInvoice.invoiceNumber}
                                    description={`Tra no invoice ${selectedInvoice.invoiceNumber}`}
                                />
                            </div>
                            <div className="flex items-center gap-2 justify-center py-2 opacity-60">
                                <RefreshCw className="w-4 h-4 text-emerald-500 animate-spin" />
                                <p className="text-[10px] font-bold text-slate-400 uppercase">Đang chờ xác nhận từ ngân hàng...</p>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
