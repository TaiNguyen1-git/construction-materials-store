'use client'

import { toast } from 'react-hot-toast'

/**
 * Credit Management Page - SME Feature 1
 * Trang quản lý công nợ và kiểm soát tín dụng
 */

import { useState, useEffect } from 'react'
import {
    CreditCard,
    AlertTriangle,
    CheckCircle,
    XCircle,
    Clock,
    DollarSign,
    Users,
    TrendingUp,
    Search,
    Filter,
    RefreshCw,
    ChevronRight,
    ArrowUpRight,
    ArrowDownRight,
    ShieldAlert,
    ShieldCheck,
    Settings,
    User,
    Calendar,
    Briefcase
} from 'lucide-react'

interface DebtAgingReport {
    customerId: string
    customerName: string
    customerType: string
    totalDebt: number
    current: number
    days1to30: number
    days31to60: number
    days61to90: number
    over90: number
    creditLimit: number
    creditHold: boolean
}

interface CreditApproval {
    id: string
    customerId: string
    customer: {
        user: { name: string }
    }
    requestedAmount: number
    currentDebt: number
    creditLimit: number
    reason: string
    status: string
    createdAt: string
}

export default function CreditManagementPage() {
    const [activeTab, setActiveTab] = useState<'aging' | 'approvals' | 'config'>('aging')
    const [agingReport, setAgingReport] = useState<DebtAgingReport[]>([])
    const [pendingApprovals, setPendingApprovals] = useState<CreditApproval[]>([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')

    const [configurations, setConfigurations] = useState<any[]>([])

    useEffect(() => {
        loadData()
    }, [activeTab])

    const loadData = async () => {
        setLoading(true)
        try {
            if (activeTab === 'aging') {
                const res = await fetch('/api/credit?type=aging-report')
                const data = await res.json()
                setAgingReport(data)
            } else if (activeTab === 'approvals') {
                const res = await fetch('/api/credit?type=pending-approvals')
                const data = await res.json()
                setPendingApprovals(data)
            } else if (activeTab === 'config') {
                const res = await fetch('/api/credit?type=configurations')
                const data = await res.json()
                // If no configs, seed some defaults for UI to show
                if (Array.isArray(data) && data.length === 0) {
                    setConfigurations([
                        { name: 'DEFAULT_CREDIT_LIMIT', value: '50000000', description: 'Hạn mức tín dụng mặc định (VND)' },
                        { name: 'MAX_OVERDUE_DAYS', value: '30', description: 'Số ngày quá hạn tối đa trước khi khóa (Ngày)' },
                        { name: 'INTEREST_RATE', value: '0.05', description: 'Lãi suất phạt quá hạn (%)' }
                    ])
                } else {
                    setConfigurations(data)
                }
            }
        } catch (error) {
            console.error('Error loading data:', error)
        }
        setLoading(false)
    }

    const handleApproval = async (approvalId: string, approved: boolean) => {
        try {
            const userDataStr = localStorage.getItem('user')
            const adminId = userDataStr ? JSON.parse(userDataStr).id : 'system'

            await fetch('/api/credit', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'process-approval',
                    approvalId,
                    approved,
                    approvedBy: adminId
                })
            })
            loadData()
        } catch (error) {
            console.error('Error processing approval:', error)
        }
    }

    const handleSaveConfig = async (config: any) => {
        try {
            await fetch('/api/credit', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'update-config',
                    configData: config
                })
            })
            loadData()
        } catch (error) {
            console.error('Error saving config:', error)
        }
    }

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND'
        }).format(amount)
    }

    // Calculate summary stats
    const totalDebt = agingReport.reduce((sum, r) => sum + r.totalDebt, 0)
    const overdueDebt = agingReport.reduce((sum, r) => sum + r.days1to30 + r.days31to60 + r.days61to90 + r.over90, 0)
    const criticalDebt = agingReport.reduce((sum, r) => sum + r.over90, 0)
    const holdCount = agingReport.filter(r => r.creditHold).length

    const filteredReport = agingReport.filter(r =>
        r.customerName.toLowerCase().includes(searchTerm.toLowerCase())
    )

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Premium Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight text-gradient bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-500">Tín Dụng & Công Nợ</h1>
                    <p className="text-sm font-bold text-slate-400 mt-1 uppercase tracking-widest">Kiểm Soát Tín Dụng & Danh Mục Nợ</p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={loadData}
                        className="bg-blue-100 text-blue-600 px-5 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest border border-blue-200 hover:bg-blue-200 transition-all flex items-center gap-2"
                    >
                        <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                        Làm mới
                    </button>
                    <button
                        className="bg-blue-600 text-white px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-blue-700 shadow-xl shadow-blue-500/20 transition-all active:scale-95 flex items-center gap-2"
                    >
                        <Settings className="w-3.5 h-3.5" />
                        Cấu hình mở rộng
                    </button>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {[
                    { label: 'Tổng công nợ hồ sơ', value: totalDebt, icon: CreditCard, color: 'bg-blue-50 text-blue-600', sub: 'Số Dư Danh Mục', up: true },
                    { label: 'Đang trễ hạn', value: overdueDebt, icon: Clock, color: 'bg-amber-50 text-amber-600', sub: 'Khối Lượng Quá Hạn', up: true },
                    { label: 'Nợ khó đòi (90+)', value: criticalDebt, icon: ShieldAlert, color: 'bg-red-50 text-red-600', sub: 'Khoản Vay Không Hiệu Quả', up: false },
                    { label: 'Khách hàng bị khóa', value: holdCount, icon: XCircle, color: 'bg-slate-50 text-slate-600', sub: 'Tài Khoản Bị Hạn Chế', up: false }
                ].map((stat, i) => (
                    <div key={i} className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex justify-between items-start mb-4">
                            <div className={`p-3 rounded-2xl ${stat.color}`}>
                                <stat.icon size={20} />
                            </div>
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{stat.sub}</span>
                        </div>
                        <div className="text-xl font-black text-slate-900">
                            {typeof stat.value === 'number' && i < 3 ? formatCurrency(stat.value) : `${stat.value} Tài khoản`}
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                            <div className="text-xs font-bold text-slate-400 uppercase tracking-tighter">{stat.label}</div>
                            {i < 3 && (
                                <div className={`flex items-center text-[9px] font-black uppercase ${stat.up ? 'text-emerald-500' : 'text-red-500'}`}>
                                    {stat.up ? <ArrowUpRight size={10} /> : <ArrowDownRight size={10} />}
                                    2.4%
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {/* Content Tabs */}
            <div className="flex bg-slate-100 p-1.5 rounded-[22px] w-full md:w-max border border-slate-200/50">
                {[
                    { id: 'aging', label: 'Báo cáo tuổi nợ', icon: TrendingUp },
                    { id: 'approvals', label: 'Duyệt hạn mức', icon: CheckCircle, count: pendingApprovals.length },
                    { id: 'config', label: 'Chính sách tín dụng', icon: Settings }
                ].map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as any)}
                        className={`flex items-center gap-2 px-6 py-2.5 rounded-[18px] text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === tab.id ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'
                            }`}
                    >
                        <tab.icon size={14} />
                        {tab.label}
                        {tab.count !== undefined && tab.count > 0 && (
                            <span className="ml-1 bg-red-500 text-white text-[9px] w-4 h-4 flex items-center justify-center rounded-full animate-pulse">
                                {tab.count}
                            </span>
                        )}
                    </button>
                ))}
            </div>

            {/* Dynamic Content */}
            {activeTab === 'aging' && (
                <div className="space-y-6">
                    {/* Filter Bar */}
                    <div className="p-4 bg-white rounded-[32px] border border-slate-100 shadow-sm flex flex-col md:flex-row gap-4 items-center">
                        <div className="relative flex-1 group">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                            <input
                                type="text"
                                placeholder="Tìm kiếm đối tác, mã khách hàng..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-12 pr-4 py-3 bg-slate-50 border-none rounded-2xl text-sm font-medium focus:ring-2 focus:ring-blue-500/20"
                            />
                        </div>
                        <button className="flex items-center gap-2 px-6 py-3 bg-slate-50 text-slate-400 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-100 transition-all">
                            <Filter size={14} />
                            Bộ lọc nâng cao
                        </button>
                    </div>

                    {/* Aging Table */}
                    <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-slate-100">
                                <thead className="bg-slate-50/50 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                    <tr>
                                        <th className="px-6 py-4 text-left">Hồ sơ khách hàng</th>
                                        <th className="px-4 py-4 text-right">Trong hạn</th>
                                        <th className="px-4 py-4 text-right">1-30 ngày</th>
                                        <th className="px-4 py-4 text-right">31-60 ngày</th>
                                        <th className="px-4 py-4 text-right">61-90 ngày</th>
                                        <th className="px-4 py-4 text-right text-red-600">Nợ xấu 90+</th>
                                        <th className="px-6 py-4 text-right">Tổng công nợ</th>
                                        <th className="px-6 py-4 text-center">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {loading ? (
                                        <tr>
                                            <td colSpan={8} className="px-6 py-12 text-center">
                                                <div className="w-8 h-8 border-4 border-blue-600/20 border-t-blue-600 rounded-full animate-spin mx-auto"></div>
                                            </td>
                                        </tr>
                                    ) : filteredReport.length === 0 ? (
                                        <tr>
                                            <td colSpan={8} className="px-6 py-12 text-center text-slate-400 font-bold italic">
                                                Hệ thống không ghi nhận dữ liệu công nợ phù hợp
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredReport.map((row) => (
                                            <tr key={row.customerId} className="hover:bg-blue-50/30 transition-colors group">
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-blue-600 group-hover:text-white transition-all">
                                                            <User size={18} />
                                                        </div>
                                                        <div>
                                                            <div className="text-sm font-black text-slate-900 group-hover:text-blue-600 transition-colors">{row.customerName}</div>
                                                            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{row.customerType}</div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-4 text-right text-xs font-bold text-emerald-600">{formatCurrency(row.current)}</td>
                                                <td className="px-4 py-4 text-right text-xs font-bold text-amber-500">{formatCurrency(row.days1to30)}</td>
                                                <td className="px-4 py-4 text-right text-xs font-bold text-orange-500">{formatCurrency(row.days31to60)}</td>
                                                <td className="px-4 py-4 text-right text-xs font-bold text-red-400">{formatCurrency(row.days61to90)}</td>
                                                <td className="px-4 py-4 text-right text-xs font-black text-red-700 bg-red-50/50">{formatCurrency(row.over90)}</td>
                                                <td className="px-6 py-4 text-right">
                                                    <div className="text-sm font-black text-slate-900">{formatCurrency(row.totalDebt)}</div>
                                                    <div className="text-[10px] text-slate-300 font-bold">Limit: {formatCurrency(row.creditLimit)}</div>
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    {row.creditHold ? (
                                                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-50 text-red-600 rounded-full text-[9px] font-black uppercase tracking-widest border border-red-100">
                                                            <ShieldAlert size={12} />
                                                            BLOCK
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-600 rounded-full text-[9px] font-black uppercase tracking-widest border border-emerald-100">
                                                            <ShieldCheck size={12} />
                                                            ACTIVE
                                                        </span>
                                                    )}
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'approvals' && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in slide-in-from-bottom-4 duration-500">
                    {pendingApprovals.length === 0 ? (
                        <div className="col-span-full py-24 text-center bg-white rounded-[40px] border border-slate-100">
                            <div className="w-16 h-16 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4">
                                <CheckCircle size={32} />
                            </div>
                            <h3 className="text-lg font-black text-slate-900 uppercase tracking-tighter">Hết hồ sơ tồn đọng</h3>
                            <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mt-1">Tất cả yêu cầu đã được xử lý</p>
                        </div>
                    ) : (
                        pendingApprovals.map((approval) => (
                            <div key={approval.id} className="bg-white rounded-[32px] p-8 shadow-sm border border-slate-100 hover:shadow-xl hover:-translate-y-1 transition-all group">
                                <div className="flex justify-between items-start mb-6">
                                    <div className="p-4 bg-slate-50 text-slate-400 group-hover:bg-blue-600 group-hover:text-white rounded-[22px] transition-colors">
                                        <Briefcase size={24} />
                                    </div>
                                    <div className="text-right">
                                        <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest mb-1 block">Request ID</span>
                                        <span className="text-xs font-black text-slate-900 break-all">{approval.id.substring(0, 8)}</span>
                                    </div>
                                </div>
                                <h3 className="text-xl font-black text-slate-900 group-hover:text-blue-600 transition-colors uppercase tracking-tight">{approval.customer.user.name}</h3>
                                <div className="mt-4 p-4 bg-slate-50 rounded-2xl border border-slate-100 text-xs font-bold text-slate-600 leading-relaxed italic">
                                    "{approval.reason}"
                                </div>
                                <div className="grid grid-cols-2 gap-4 mt-6 py-6 border-y border-slate-50">
                                    <div>
                                        <span className="block text-[9px] font-black text-slate-400 uppercase tracking-widest">Yêu cầu cấp thêm</span>
                                        <span className="text-sm font-black text-emerald-600">{formatCurrency(approval.requestedAmount)}</span>
                                    </div>
                                    <div className="text-right">
                                        <span className="block text-[9px] font-black text-slate-400 uppercase tracking-widest">Hạn mức hiện tại</span>
                                        <span className="text-sm font-black text-slate-900">{formatCurrency(approval.creditLimit)}</span>
                                    </div>
                                </div>
                                <div className="mt-4 flex items-center gap-2 text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                                    <Calendar size={12} />
                                    Submited: {new Date(approval.createdAt).toLocaleDateString('vi-VN')}
                                </div>
                                <div className="grid grid-cols-2 gap-3 mt-8">
                                    <button
                                        onClick={() => handleApproval(approval.id, true)}
                                        className="flex items-center justify-center gap-2 py-4 bg-emerald-600 text-white rounded-[20px] font-black text-[10px] uppercase tracking-widest hover:bg-emerald-700 shadow-lg shadow-emerald-50 transition-all active:scale-95"
                                    >
                                        <CheckCircle size={14} />
                                        Approve
                                    </button>
                                    <button
                                        onClick={() => handleApproval(approval.id, false)}
                                        className="flex items-center justify-center gap-2 py-4 bg-red-50 text-red-600 rounded-[20px] font-black text-[10px] uppercase tracking-widest hover:bg-red-600 hover:text-white transition-all active:scale-95"
                                    >
                                        <XCircle size={14} />
                                        Reject
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}

            {activeTab === 'config' && (
                <div className="bg-white rounded-[40px] shadow-sm border border-slate-100 overflow-hidden animate-in fade-in duration-500">
                    <div className="p-10 border-b border-slate-50 bg-slate-50/50">
                        <div className="flex items-center gap-4 mb-2">
                            <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl">
                                <Settings size={28} />
                            </div>
                            <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">Luật kiểm soát tín dụng</h2>
                        </div>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">System Credit & Risk Configuration</p>
                    </div>

                    <div className="p-10 grid gap-6 max-w-4xl mx-auto">
                        {configurations.map((config, idx) => (
                            <div key={config.name || idx} className="group flex flex-col md:flex-row items-start md:items-center justify-between gap-6 p-8 bg-slate-50/50 hover:bg-white rounded-[32px] border border-slate-100 hover:border-blue-100 transition-all">
                                <div className="space-y-1 flex-1">
                                    <label className="block text-[11px] font-black text-slate-900 uppercase tracking-widest mb-1">{config.name.replace(/_/g, ' ')}</label>
                                    <p className="text-xs font-bold text-slate-400 leading-relaxed uppercase tracking-tighter">{config.description}</p>
                                </div>
                                <div className="w-full md:w-64 flex items-center gap-3">
                                    <input
                                        type="text"
                                        className="flex-1 bg-white border-slate-100 rounded-2xl px-5 py-4 text-sm font-black text-blue-600 shadow-inner focus:ring-4 focus:ring-blue-500/10 transition-all outline-none"
                                        defaultValue={config.value}
                                        onBlur={(e) => {
                                            if (e.target.value !== config.value) {
                                                handleSaveConfig({ ...config, value: e.target.value })
                                                toast.success(`Đã cập nhật ${config.name}`)
                                            }
                                        }}
                                    />
                                    <div className="p-2 bg-slate-100 text-slate-400 rounded-lg group-focus-within:bg-blue-600 group-focus-within:text-white transition-all">
                                        <RefreshCw size={14} />
                                    </div>
                                </div>
                            </div>
                        ))}
                        {configurations.length === 0 && (
                            <div className="text-center py-12 text-slate-400 font-bold uppercase tracking-widest">
                                Loading configurations...
                            </div>
                        )}
                        <div className="mt-8 p-8 bg-amber-50 rounded-[32px] border border-amber-100 flex items-start gap-4">
                            <div className="p-3 bg-amber-100 text-amber-600 rounded-2xl">
                                <AlertTriangle size={24} />
                            </div>
                            <div>
                                <h4 className="text-xs font-black text-amber-900 uppercase tracking-widest mb-1">Cảnh báo hệ thống</h4>
                                <p className="text-xs font-bold text-amber-600/80 leading-relaxed uppercase tracking-tighter">Mọi thay đổi cấu hình sẽ ảnh hưởng trực tiếp đến việc phê duyệt đơn hàng tự động và tính toán nợ xấu của toàn công ty. Vui lòng kiểm tra kỹ trước khi thoát.</p>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
