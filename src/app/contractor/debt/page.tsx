'use client'

/**
 * Contractor Financial Hub
 * Professional financial management dashboard for contractors.
 * Features: Debt by Project, Credit Limits, Escrow Tracking.
 */

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Sidebar from '../components/Sidebar'
import ContractorHeader from '../components/ContractorHeader'
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
    DollarSign,
    ChevronRight,
    Download,
    Wallet,
    PieChart,
    ArrowUpRight,
    Calendar,
    FileText,
    CheckCircle2,
    X,
    Loader2
} from 'lucide-react'
import { toast } from 'react-hot-toast'
import React from 'react'
import { formatCurrency } from '@/lib/utils'

export default function ContractorFinancialHub() {
    const { user } = useAuth()
    const [sidebarOpen, setSidebarOpen] = useState(true)
    const [loading, setLoading] = useState(true)
    const [data, setData] = useState<any>(null)

    // Modal States
    const [showPaymentModal, setShowPaymentModal] = useState(false)
    const [selectedInvoice, setSelectedInvoice] = useState<any>(null)
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
                // Fallback for demo if API not ready (using mock for immediate UI feedback)
                // This allows the UI to be reviewed even if backend logic is pending
                setData(MOCK_DATA)
                if (res.status !== 404) toast.error('Không thể tải dữ liệu tài chính chi tiết')
            }
        } catch (error) {
            console.error('Error fetching financial data:', error)
            setData(MOCK_DATA)
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
                toast.success('Gửi yêu cầu nâng hạn mức thành công!')
                setShowCreditRequestModal(false)
                setCreditRequestAmount('')
                setCreditRequestReason('')
            } else {
                toast.error('Gửi yêu cầu thất bại')
            }
        } catch (error) {
            toast.error('Lỗi kết nối')
        } finally {
            setRequestLoading(false)
        }
    }

    if (loading && !data) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <Loader2 className="w-12 h-12 animate-spin text-blue-600" />
            </div>
        )
    }

    // Safe access to data
    const summary = data?.summary || MOCK_DATA.summary
    const projects = data?.projects || MOCK_DATA.projects
    const creditUsage = (summary.totalDebt / summary.creditLimit) * 100

    return (
        <div className="min-h-screen bg-[#F8FAFC]">
            <ContractorHeader sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
            <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

            <main className={`transition-all duration-300 pt-[60px] ${sidebarOpen ? 'lg:ml-64' : 'ml-0'}`}>
                <div className="p-6 max-w-7xl mx-auto space-y-8">

                    {/* Header Section */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                            <h1 className="text-2xl font-black text-slate-900 flex items-center gap-3">
                                <Wallet className="w-8 h-8 text-blue-600" />
                                Trung tâm Tài chính
                            </h1>
                            <p className="text-slate-500 mt-1 font-medium">Quản lý dòng tiền, công nợ dự án và hạn mức tín dụng</p>
                        </div>
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => setShowCreditRequestModal(true)}
                                className="px-5 py-2.5 bg-white border border-blue-200 text-blue-600 font-bold rounded-xl shadow-sm hover:bg-blue-50 transition-all flex items-center gap-2"
                            >
                                <ArrowUpRight className="w-4 h-4" />
                                Nâng hạn mức
                            </button>
                            <button
                                onClick={() => {
                                    // Generate CSV Report
                                    const headers = ['Loại Báo Cáo', 'Ngày Xuất', 'Người Xuất'];
                                    const reportInfo = ['Báo cáo tài chính tháng', new Date().toLocaleDateString('vi-VN'), user?.name || 'Contractor'];

                                    const summaryHeaders = ['Tổng Hạn Mức', 'Đã Sử Dụng', 'Còn Lại', 'Nợ Đến Hạn (7 ngày)', 'Tạm Giữ (Escrow)'];
                                    const summaryRow = [
                                        summary.creditLimit,
                                        summary.totalDebt,
                                        summary.creditLimit - summary.totalDebt,
                                        summary.dueThisWeek,
                                        summary.escrowBalance
                                    ].map(v => v.toString());

                                    const projectHeaders = ['Dự Án', 'Ngày Bắt Đầu', 'Tổng Nợ', 'Nợ Quá Hạn', 'Hạn Thanh Toán', 'Trạng Thái'];
                                    const projectRows = projects.map((p: any) => [
                                        p.name,
                                        p.startDate,
                                        p.debtAmount,
                                        p.overdueAmount,
                                        p.nextDueDate || 'N/A',
                                        p.hasOverdue ? 'Quá hạn' : 'Đang thực hiện'
                                    ].map(v => v.toString()));

                                    const invoiceHeaders = ['Số HĐ', 'Dự Án', 'Hạn Chót', 'Số Tiền', 'Đã Trả', 'Trạng Thái'];
                                    const invoiceRows = (data?.invoices || []).map((inv: any) => [
                                        inv.invoiceNumber,
                                        inv.projectName,
                                        inv.dueDate,
                                        inv.amount,
                                        inv.paid,
                                        inv.status
                                    ].map((v: any) => v.toString()));

                                    // Combine into CSV content
                                    const csvContent = [
                                        '\ufeff' + headers.join(','),
                                        reportInfo.join(','),
                                        '',
                                        'TỔNG QUAN TÀI CHÍNH',
                                        summaryHeaders.join(','),
                                        summaryRow.join(','),
                                        '',
                                        'CHI TIẾT THEO DỰ ÁN',
                                        projectHeaders.join(','),
                                        ...projectRows.map((r: any[]) => r.join(',')),
                                        '',
                                        'DANH SÁCH HÓA ĐƠN',
                                        invoiceHeaders.join(','),
                                        ...invoiceRows.map((r: any[]) => r.join(','))
                                    ].join('\n');

                                    // Trigger Download
                                    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
                                    const link = document.createElement('a');
                                    const url = URL.createObjectURL(blob);
                                    link.setAttribute('href', url);
                                    link.setAttribute('download', `financial_report_${new Date().toISOString().split('T')[0]}.csv`);
                                    link.style.visibility = 'hidden';
                                    document.body.appendChild(link);
                                    link.click();
                                    document.body.removeChild(link);
                                    toast.success('Đã tải xuống báo cáo thành công!');
                                }}
                                className="px-5 py-2.5 bg-blue-600 text-white font-bold rounded-xl shadow-lg shadow-blue-200 hover:scale-[1.02] transition-all flex items-center gap-2">
                                <Download className="w-4 h-4" />
                                Báo cáo tháng
                            </button>
                        </div>
                    </div>

                    {/* Main Stats Grid (Bento Style) */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Credit Health Card */}
                        <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-[32px] p-8 text-white relative overflow-hidden shadow-xl shadow-blue-200 lg:col-span-2">
                            <div className="flex justify-between items-start relative z-10">
                                <div>
                                    <p className="text-blue-100 font-bold text-sm uppercase tracking-wider mb-2">Hạn mức khả dụng</p>
                                    <h2 className="text-5xl font-black mb-1 tracking-tight">
                                        {formatCurrency(summary.creditLimit - summary.totalDebt)}
                                    </h2>
                                    <p className="text-blue-200 text-sm font-medium mt-2 flex items-center gap-2">
                                        <CheckCircle2 className="w-4 h-4" />
                                        Đủ khả năng tài chính cho các dự án hiện tại
                                    </p>
                                </div>
                                <div className="text-right">
                                    <div className="inline-block bg-white/20 backdrop-blur-md border border-white/20 rounded-2xl px-4 py-3">
                                        <p className="text-[10px] font-black uppercase tracking-widest text-blue-100">Tổng hạn mức</p>
                                        <p className="text-xl font-black">{formatCurrency(summary.creditLimit)}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Circular Progress (Visual Decor) */}
                            <div className="absolute -right-16 -bottom-32 w-64 h-64 border-[32px] border-white/10 rounded-full"></div>
                            <div className="absolute -right-8 -bottom-24 w-48 h-48 border-[32px] border-white/20 rounded-full"></div>

                            {/* Usage Bar */}
                            <div className="mt-10 relative z-10">
                                <div className="flex justify-between text-xs font-bold text-blue-100 mb-2">
                                    <span>Đã sử dụng: {formatCurrency(summary.totalDebt)}</span>
                                    <span>{creditUsage.toFixed(1)}%</span>
                                </div>
                                <div className="h-3 bg-white/20 rounded-full overflow-hidden backdrop-blur-sm">
                                    <div
                                        className={`h-full rounded-full transition-all duration-1000 ${creditUsage > 80 ? 'bg-amber-400' : 'bg-emerald-400'}`}
                                        style={{ width: `${creditUsage}%` }}
                                    ></div>
                                </div>
                            </div>
                        </div>

                        {/* Quick Stats Column */}
                        <div className="space-y-6">
                            <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm flex items-center justify-between group hover:border-red-100 transition-all">
                                <div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Nợ đến hạn (7 ngày)</p>
                                    <p className="text-2xl font-black text-red-500">{formatCurrency(summary.dueThisWeek)}</p>
                                </div>
                                <div className="w-12 h-12 bg-red-50 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-all">
                                    <Clock className="w-6 h-6 text-red-500" />
                                </div>
                            </div>
                            <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm flex items-center justify-between group hover:border-amber-100 transition-all">
                                <div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Đang tạm giữ (Escrow)</p>
                                    <p className="text-2xl font-black text-amber-500">{formatCurrency(summary.escrowBalance)}</p>
                                </div>
                                <div className="w-12 h-12 bg-amber-50 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-all">
                                    <Building2 className="w-6 h-6 text-amber-500" />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Project-based Debt Section */}
                    <div>
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-xl font-black text-slate-900">Chi tiết theo Dự Án</h3>
                            <Link href="/contractor/projects" className="text-sm font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1">
                                Xem tất cả <ChevronRight className="w-4 h-4" />
                            </Link>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                            {projects.map((project: any) => (
                                <div key={project.id} className="bg-white rounded-[32px] border border-slate-200 p-6 hover:shadow-lg transition-all group">
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-500 group-hover:bg-blue-50 group-hover:text-blue-600 transition-all">
                                                <Building2 className="w-6 h-6" />
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-slate-900">{project.name}</h4>
                                                <p className="text-xs text-slate-500 font-medium">Bắt đầu: {project.startDate}</p>
                                            </div>
                                        </div>
                                        {project.hasOverdue && (
                                            <span className="bg-red-50 text-red-600 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wide flex items-center gap-1">
                                                <AlertCircle className="w-3 h-3" /> Quá hạn
                                            </span>
                                        )}
                                    </div>

                                    <div className="space-y-3 mb-6">
                                        <div className="flex justify-between items-center text-sm">
                                            <span className="text-slate-500 font-medium">Tổng nợ vật tư:</span>
                                            <span className="font-bold text-slate-900">{formatCurrency(project.debtAmount)}</span>
                                        </div>
                                        {project.overdueAmount > 0 && (
                                            <div className="flex justify-between items-center text-sm">
                                                <span className="text-red-500 font-bold">Nợ đã quá hạn:</span>
                                                <span className="font-black text-red-600">{formatCurrency(project.overdueAmount)}</span>
                                            </div>
                                        )}
                                        <div className="flex justify-between items-center text-sm">
                                            <span className="text-slate-500 font-medium">Hạn thanh toán:</span>
                                            <span className={`font-bold ${project.hasOverdue ? 'text-red-500' : 'text-slate-900'}`}>
                                                {project.nextDueDate} {project.daysLeft < 0 ? `(quá hạn ${Math.abs(project.daysLeft)} ngày)` : `(còn ${project.daysLeft} ngày)`}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="pt-4 border-t border-slate-100 flex gap-3">
                                        <Link
                                            href={`/contractor/projects/${project.id}`}
                                            className="flex-1 py-2.5 bg-slate-50 text-slate-600 font-bold rounded-xl text-xs hover:bg-slate-100 transition-all text-center flex items-center justify-center"
                                        >
                                            Chi tiết
                                        </Link>
                                        <button
                                            onClick={() => {
                                                setSelectedInvoice({ amount: project.debtAmount, invoiceNumber: `PROJECT-${project.id}` })
                                                setShowPaymentModal(true)
                                            }}
                                            className="flex-1 py-2.5 bg-blue-600 text-white font-bold rounded-xl text-xs hover:bg-blue-700 shadow-lg shadow-blue-100 transition-all"
                                        >
                                            Thanh toán
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Unpaid Invoices Table (Quick View) */}
                    <div className="bg-white rounded-[32px] border border-slate-200 overflow-hidden">
                        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                            <h3 className="text-lg font-black text-slate-900">Hóa đơn cần thanh toán</h3>
                            <div className="flex gap-2">
                                <span className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></span>
                                <span className="text-xs font-bold text-slate-500">{data?.invoices?.length || 0} hóa đơn chưa trả</span>
                            </div>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px] tracking-wider">
                                    <tr>
                                        <th className="px-6 py-4">Mã HĐ</th>
                                        <th className="px-6 py-4">Dự án</th>
                                        <th className="px-6 py-4 text-center">Hạn chót</th>
                                        <th className="px-6 py-4 text-right">Số tiền</th>
                                        <th className="px-6 py-4 text-center">Thao tác</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {data?.invoices?.map((inv: any) => (
                                        <tr key={inv.id} className="hover:bg-slate-50/50 transition-all">
                                            <td className="px-6 py-4 font-bold text-blue-600">{inv.invoiceNumber}</td>
                                            <td className="px-6 py-4 font-medium text-slate-700">{inv.projectName || 'Vật tư lẻ'}</td>
                                            <td className="px-6 py-4 text-center">
                                                <span className={`px-3 py-1 rounded-full text-[10px] font-black ${inv.status === 'OVERDUE' ? 'bg-red-50 text-red-600' : 'bg-slate-100 text-slate-600'
                                                    }`}>
                                                    {inv.dueDate}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right font-black text-slate-900">{formatCurrency(inv.amount - inv.paid)}</td>
                                            <td className="px-6 py-4 text-center">
                                                <button
                                                    onClick={() => {
                                                        setSelectedInvoice(inv)
                                                        setShowPaymentModal(true)
                                                    }}
                                                    className="text-blue-600 hover:text-blue-800 font-bold text-xs underline decoration-2"
                                                >
                                                    Thanh toán
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                </div>
            </main>

            {/* Credit Request Modal */}
            {showCreditRequestModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-[32px] w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
                        <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                            <h3 className="text-xl font-black text-slate-900">Yêu cầu nâng hạn mức</h3>
                            <button onClick={() => setShowCreditRequestModal(false)} className="p-2 hover:bg-slate-100 rounded-full transition-all">
                                <X className="w-5 h-5 text-slate-400" />
                            </button>
                        </div>
                        <form onSubmit={handleRequestCreditIncrease} className="p-8 space-y-6">
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">Số tiền muốn nâng thêm</label>
                                <div className="relative">
                                    <input
                                        type="number"
                                        required
                                        value={creditRequestAmount}
                                        onChange={(e) => setCreditRequestAmount(e.target.value)}
                                        className="w-full pl-4 pr-12 py-4 bg-slate-50 border border-slate-200 rounded-xl font-bold text-lg outline-none focus:border-blue-500 focus:bg-white transition-all"
                                        placeholder="Ví dụ: 50,000,000"
                                    />
                                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">VNĐ</span>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">Lý do / Dự án cần vốn</label>
                                <textarea
                                    required
                                    rows={3}
                                    value={creditRequestReason}
                                    onChange={(e) => setCreditRequestReason(e.target.value)}
                                    className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl font-medium outline-none focus:border-blue-500 focus:bg-white transition-all resize-none"
                                    placeholder="Nhập lý do cụ thể để Admin duyệt nhanh hơn..."
                                />
                            </div>
                            <button
                                type="submit"
                                disabled={requestLoading}
                                className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-xl shadow-lg shadow-blue-200 transition-all flex items-center justify-center gap-2"
                            >
                                {requestLoading ? <Loader2 className="animate-spin w-5 h-5" /> : 'Gửi yêu cầu'}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* QR Payment Modal */}
            {showPaymentModal && selectedInvoice && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-[32px] w-full max-w-md shadow-2xl animate-in fade-in zoom-in duration-200 relative flex flex-col max-h-[90vh]">
                        {/* Sticky Header with Close Button */}
                        <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-md px-6 py-4 border-b border-slate-100 flex justify-between items-center rounded-t-[32px]">
                            <h3 className="text-lg font-black text-slate-900">Thanh toán hóa đơn</h3>
                            <button
                                onClick={() => setShowPaymentModal(false)}
                                className="p-2 bg-slate-100/50 hover:bg-slate-100 rounded-full transition-all text-slate-500 hover:text-slate-900"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Scrollable Content */}
                        <div className="overflow-y-auto p-6 scroll-smooth">
                            <QRPayment
                                amount={selectedInvoice.amount}
                                orderId={selectedInvoice.invoiceNumber}
                                description={`Thanh toan ${selectedInvoice.invoiceNumber}`}
                            />
                            <p className="text-center text-[10px] text-slate-400 mt-6 font-medium uppercase tracking-wide">
                                Hệ thống tự động cập nhật sau 1-3 phút
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

// MOCK DATA used when API is not ready
const MOCK_DATA = {
    summary: {
        totalDebt: 45200000,
        creditLimit: 100000000,
        escrowBalance: 15000000,
        dueThisWeek: 8500000
    },
    projects: [
        {
            id: 'PROJ-001',
            name: 'Biệt thự Vườn Riverside',
            startDate: '2025-12-15',
            debtAmount: 32500000,
            nextDueDate: '2026-02-05',
            daysLeft: 5,
            hasOverdue: false
        },
        {
            id: 'PROJ-002',
            name: 'Showroom Nội thất Minh Long',
            startDate: '2026-01-10',
            debtAmount: 12700000,
            nextDueDate: '2026-01-28',
            daysLeft: -2,
            hasOverdue: true
        }
    ],
    invoices: [
        { id: 'INV-1021', invoiceNumber: 'INV-1021', projectName: 'Biệt thự Vườn Riverside', dueDate: '2026-02-05', amount: 15000000, paid: 0, status: 'PENDING' },
        { id: 'INV-1018', invoiceNumber: 'INV-1018', projectName: 'Showroom Minh Long', dueDate: '2026-01-28', amount: 8500000, paid: 0, status: 'OVERDUE' },
        { id: 'INV-1022', invoiceNumber: 'INV-1022', projectName: 'Biệt thự Vườn Riverside', dueDate: '2026-02-10', amount: 17500000, paid: 0, status: 'PENDING' }
    ]
}
