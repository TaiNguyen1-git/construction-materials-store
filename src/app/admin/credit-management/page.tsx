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
    Briefcase,
    Trash2,
    RotateCcw
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
    maxOverdueDays: number
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
    const [showAdvancedFilters, setShowAdvancedFilters] = useState(false)
    const [filters, setFilters] = useState({
        customerType: 'ALL',
        status: 'ALL',
        minDebt: ''
    })

    const [selectedCustomer, setSelectedCustomer] = useState<DebtAgingReport | null>(null)
    const [isEditModalOpen, setIsEditModalOpen] = useState(false)
    const [editForm, setEditForm] = useState({
        creditLimit: 0,
        creditHold: false,
        maxOverdueDays: 0
    })

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

    const handleSaveAllConfigs = async () => {
        try {
            const savePromises = configurations.map(config =>
                fetch('/api/credit', {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        action: 'update-config',
                        configData: config
                    })
                })
            )
            await Promise.all(savePromises)
            toast.success('Đã lưu tất cả thay đổi cấu hình')
            loadData()
        } catch (error) {
            console.error('Error saving all configs:', error)
            toast.error('Lỗi khi lưu cấu hình')
        }
    }

    const handleResetConfigs = async () => {
        if (!confirm('Bạn có chắc chắn muốn đặt lại toàn bộ cấu hình về mặc định?')) return

        const defaultConfigs = [
            { name: 'Default', maxOverdueDays: 30, creditLimitPercent: 100, warningDays: 7 },
            { name: 'Contractor', maxOverdueDays: 45, creditLimitPercent: 120, warningDays: 14 },
            { name: 'Wholesale', maxOverdueDays: 30, creditLimitPercent: 110, warningDays: 7 },
            { name: 'Regular', maxOverdueDays: 15, creditLimitPercent: 80, warningDays: 5 }
        ]

        try {
            const resetPromises = defaultConfigs.map(config =>
                fetch('/api/credit', {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        action: 'update-config',
                        configData: config
                    })
                })
            )
            await Promise.all(resetPromises)
            toast.success('Đã đặt lại cấu hình mặc định')
            loadData()
        } catch (error) {
            console.error('Error resetting configs:', error)
            toast.error('Lỗi khi đặt lại cấu hình')
        }
    }

    const handleEditCustomer = (customer: DebtAgingReport) => {
        setSelectedCustomer(customer)
        setEditForm({
            creditLimit: customer.creditLimit,
            creditHold: customer.creditHold,
            maxOverdueDays: customer.maxOverdueDays || 0
        })
        setIsEditModalOpen(true)
    }

    const handleUpdateCustomerCredit = async () => {
        if (!selectedCustomer) return

        try {
            const res = await fetch('/api/credit', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'update-customer-credit',
                    customerId: selectedCustomer.customerId,
                    ...editForm
                })
            })

            if (res.ok) {
                toast.success('Cập nhật tín dụng thành công')
                setIsEditModalOpen(false)
                loadData()
            } else {
                toast.error('Lỗi khi cập nhật tín dụng')
            }
        } catch (error) {
            console.error('Update credit error:', error)
            toast.error('Lỗi máy chủ')
        }
    }

    const handleResetCustomerCredit = async (customerId: string, customerName: string) => {
        if (!confirm(`Bạn có chắc chắn muốn ĐẶT LẠI cấu hình tín dụng cho ${customerName}?\n\nHành động này sẽ reset hạn mức và trạng thái khóa của khách hàng này về mặc định.`)) return

        try {
            const res = await fetch('/api/credit', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'update-customer-credit',
                    customerId,
                    creditLimit: 0,
                    creditHold: false,
                    maxOverdueDays: 30
                })
            })

            if (res.ok) {
                toast.success(`Đã reset tín dụng cho ${customerName}`)
                loadData()
                if (selectedCustomer?.customerId === customerId) setIsEditModalOpen(false)
            } else {
                toast.error('Lỗi khi xử lý')
            }
        } catch (error) {
            console.error('Reset credit logic error:', error)
            toast.error('Lỗi máy chủ')
        }
    }

    const handleDeleteCustomerFromList = async (customerId: string, customerName: string) => {
        if (!confirm(`CẢNH BÁO: Bạn có chắc chắn muốn XÓA khách hàng ${customerName} khỏi danh sách tín dụng?\n\nDữ liệu sẽ bị ẩn khỏi báo cáo này.`)) return

        try {
            const res = await fetch('/api/credit', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'soft-delete-customer',
                    customerId
                })
            })

            if (res.ok) {
                toast.success(`Đã xóa ${customerName} khỏi danh sách`)
                loadData()
                if (selectedCustomer?.customerId === customerId) setIsEditModalOpen(false)
            } else {
                toast.error('Lỗi khi xóa khách hàng')
            }
        } catch (error) {
            console.error('Delete customer error:', error)
            toast.error('Lỗi máy chủ')
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

    const filteredReport = agingReport.filter(r => {
        const matchesSearch = r.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            r.customerId.toLowerCase().includes(searchTerm.toLowerCase())

        const matchesType = filters.customerType === 'ALL' || r.customerType === filters.customerType
        const matchesStatus = filters.status === 'ALL' ||
            (filters.status === 'BLOCK' ? r.creditHold : !r.creditHold)
        const matchesDebt = !filters.minDebt || r.totalDebt >= parseFloat(filters.minDebt)

        return matchesSearch && matchesType && matchesStatus && matchesDebt
    })

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
                        onClick={() => setActiveTab('config')}
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
                        <button
                            onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                            className={`flex items-center gap-2 px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${showAdvancedFilters ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' : 'bg-slate-50 text-slate-400 hover:bg-slate-100'
                                }`}
                        >
                            <Filter size={14} />
                            Bộ lọc nâng cao
                        </button>
                    </div>

                    {/* Advanced Filter Panel */}
                    {showAdvancedFilters && (
                        <div className="p-8 bg-slate-50/50 rounded-[32px] border border-slate-100 shadow-inner grid grid-cols-1 md:grid-cols-3 gap-6 animate-in slide-in-from-top-4 duration-300">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Loại khách hàng</label>
                                <select
                                    value={filters.customerType}
                                    onChange={(e) => setFilters({ ...filters, customerType: e.target.value })}
                                    className="w-full bg-white border-none rounded-xl px-4 py-3 text-xs font-bold shadow-sm focus:ring-2 focus:ring-blue-500/20"
                                >
                                    <option value="ALL">Tất cả đối tượng</option>
                                    <option value="CONTRACTOR">Nhà thầu (Contractor)</option>
                                    <option value="WHOLESALE">Đại lý sỉ (Wholesale)</option>
                                    <option value="REGULAR">Khách lẻ (Regular)</option>
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Trạng thái tín dụng</label>
                                <select
                                    value={filters.status}
                                    onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                                    className="w-full bg-white border-none rounded-xl px-4 py-3 text-xs font-bold shadow-sm focus:ring-2 focus:ring-blue-500/20"
                                >
                                    <option value="ALL">Tất cả trạng thái</option>
                                    <option value="ACTIVE">Đang hoạt động</option>
                                    <option value="BLOCK">Đã bị khóa (Hold)</option>
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Số nợ tối thiểu</label>
                                <div className="relative">
                                    <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-300" />
                                    <input
                                        type="number"
                                        placeholder="VD: 50.000.000"
                                        value={filters.minDebt}
                                        onChange={(e) => setFilters({ ...filters, minDebt: e.target.value })}
                                        className="w-full pl-10 pr-4 py-3 bg-white border-none rounded-xl text-xs font-bold shadow-sm focus:ring-2 focus:ring-blue-500/20"
                                    />
                                </div>
                            </div>
                            <div className="md:col-span-3 flex justify-end">
                                <button
                                    onClick={() => {
                                        setFilters({ customerType: 'ALL', status: 'ALL', minDebt: '' });
                                        setSearchTerm('');
                                    }}
                                    className="text-[10px] font-black text-blue-600 uppercase tracking-widest hover:underline"
                                >
                                    Xóa tất cả bộ lọc
                                </button>
                            </div>
                        </div>
                    )}

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
                                        <th className="px-4 py-4 text-center">Tình trạng</th>
                                        <th className="px-6 py-4 text-center">Thao tác</th>
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
                                                <td className="px-4 py-4 text-center">
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
                                                <td className="px-6 py-4 text-center">
                                                    <div className="flex items-center justify-center gap-2">
                                                        <button
                                                            onClick={() => handleEditCustomer(row)}
                                                            className="p-2 text-slate-400 hover:text-blue-600 hover:bg-white rounded-xl transition-all shadow-sm border border-transparent hover:border-slate-100"
                                                            title="Chỉnh sửa cấu hình"
                                                        >
                                                            <Settings size={16} />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDeleteCustomerFromList(row.customerId, row.customerName)}
                                                            className="p-2 text-slate-400 hover:text-red-600 hover:bg-white rounded-xl transition-all shadow-sm border border-transparent hover:border-red-100"
                                                            title="Xóa khỏi danh sách"
                                                        >
                                                            <Trash2 size={16} />
                                                        </button>
                                                    </div>
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

            {/* Edit Customer Credit Modal */}
            {isEditModalOpen && selectedCustomer && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-white w-full max-w-xl rounded-[40px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
                        {/* Modal Header */}
                        <div className="p-8 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-blue-600 text-white rounded-2xl shadow-lg shadow-blue-200">
                                    <Settings size={22} />
                                </div>
                                <div>
                                    <h3 className="text-xl font-black text-slate-900 uppercase tracking-tighter line-clamp-1">{selectedCustomer.customerName}</h3>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-0.5">Tùy chỉnh tín dụng cá nhân</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setIsEditModalOpen(false)}
                                className="p-2 text-slate-300 hover:text-slate-900 transition-colors"
                            >
                                <XCircle size={24} />
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div className="p-10 space-y-8">
                            {/* Current Debt Context */}
                            <div className="flex items-center justify-between p-6 bg-blue-50/50 rounded-3xl border border-blue-100">
                                <div>
                                    <span className="block text-[10px] font-black text-blue-400 uppercase tracking-widest mb-1">Dư nợ hiện tại</span>
                                    <span className="text-2xl font-black text-blue-600">{formatCurrency(selectedCustomer.totalDebt)}</span>
                                </div>
                                <div className="text-right">
                                    <span className="block text-[10px] font-black text-blue-400 uppercase tracking-widest mb-1">Loại tài khoản</span>
                                    <span className="px-3 py-1 bg-white text-blue-600 rounded-full text-[9px] font-black uppercase tracking-widest border border-blue-100 inline-block mt-1">
                                        {selectedCustomer.customerType}
                                    </span>
                                </div>
                            </div>

                            {/* Form Fields */}
                            <div className="grid gap-6">
                                {/* Credit Limit */}
                                <div className="space-y-3">
                                    <label className="text-[11px] font-black text-slate-900 uppercase tracking-widest ml-1">Hạn mức tín dụng cá nhân (VND)</label>
                                    <div className="relative group">
                                        <DollarSign className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-blue-600" />
                                        <input
                                            type="number"
                                            value={editForm.creditLimit}
                                            onChange={(e) => setEditForm({ ...editForm, creditLimit: parseFloat(e.target.value) || 0 })}
                                            className="w-full pl-14 pr-6 py-4 bg-slate-50 border-none rounded-2xl text-sm font-black text-slate-900 focus:ring-4 focus:ring-blue-500/10 transition-all outline-none"
                                        />
                                    </div>
                                    <p className="text-[9px] font-bold text-slate-400 pl-1 uppercase">Hạn mức tối đa khách hàng có thể nợ trước khi bị chặn đơn hàng.</p>
                                </div>

                                {/* Overdue Days Limit */}
                                <div className="space-y-3">
                                    <label className="text-[11px] font-black text-slate-900 uppercase tracking-widest ml-1">Kỳ hạn nợ tối đa (Ngày)</label>
                                    <div className="relative group">
                                        <Clock className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-blue-600" />
                                        <input
                                            type="number"
                                            value={editForm.maxOverdueDays}
                                            onChange={(e) => setEditForm({ ...editForm, maxOverdueDays: parseInt(e.target.value) || 0 })}
                                            className="w-full pl-14 pr-6 py-4 bg-slate-50 border-none rounded-2xl text-sm font-black text-slate-900 focus:ring-4 focus:ring-blue-500/10 transition-all outline-none"
                                        />
                                    </div>
                                    <p className="text-[9px] font-bold text-slate-400 pl-1 uppercase">Số ngày cho phép nợ trễ hạn trước khi hệ thống tự động khóa tín dụng.</p>
                                </div>

                                {/* Credit Hold Toggle */}
                                <div className="flex items-center justify-between p-6 bg-slate-50 rounded-3xl border border-slate-100">
                                    <div className="space-y-1">
                                        <span className="block text-[11px] font-black text-slate-900 uppercase tracking-widest">Trạng thái khóa tín dụng</span>
                                        <span className="text-[10px] font-bold text-slate-400 uppercase">Khóa thủ công toàn bộ giao dịch công nợ.</span>
                                    </div>
                                    <button
                                        onClick={() => setEditForm({ ...editForm, creditHold: !editForm.creditHold })}
                                        className={`w-16 h-8 rounded-full p-1.5 transition-all duration-300 flex items-center ${editForm.creditHold ? 'bg-red-500 flex-row-reverse' : 'bg-slate-200'
                                            }`}
                                    >
                                        <div className="w-5 h-5 bg-white rounded-full shadow-sm" />
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Modal Footer */}
                        <div className="p-8 bg-slate-50 flex gap-4">
                            <button
                                onClick={() => handleResetCustomerCredit(selectedCustomer.customerId, selectedCustomer.customerName)}
                                className="px-6 py-4 bg-slate-100 text-slate-500 rounded-2xl font-black text-[10px] uppercase tracking-widest border border-slate-200 hover:bg-slate-200 hover:text-slate-700 transition-all active:scale-95 flex items-center gap-2"
                                title="Reset về mặc định"
                            >
                                <RotateCcw size={14} />
                                Reset
                            </button>
                            <div className="flex-1 flex gap-3">

                                <button
                                    onClick={() => setIsEditModalOpen(false)}
                                    className="flex-1 py-4 bg-white text-slate-400 rounded-2xl font-black text-[10px] uppercase tracking-widest border border-slate-200 hover:bg-slate-100 transition-all active:scale-95"
                                >
                                    Hủy bỏ
                                </button>
                                <button
                                    onClick={handleUpdateCustomerCredit}
                                    className="flex-1 py-4 bg-blue-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-blue-500/20 hover:bg-blue-700 transition-all active:scale-95"
                                >
                                    Lưu thay đổi
                                </button>
                            </div>
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
                    <div className="p-10 border-b border-slate-50 bg-slate-50/50 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                        <div>
                            <div className="flex items-center gap-4 mb-2">
                                <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl">
                                    <Settings size={28} />
                                </div>
                                <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">Luật kiểm soát tín dụng</h2>
                            </div>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">System Credit & Risk Configuration</p>
                        </div>

                        <div className="flex items-center gap-3 w-full md:w-auto">
                            <button
                                onClick={handleResetConfigs}
                                className="flex-1 md:flex-none px-6 py-4 bg-white text-slate-500 rounded-2xl font-black text-[10px] uppercase tracking-widest border border-slate-200 hover:bg-slate-50 transition-all active:scale-95 flex items-center justify-center gap-2"
                            >
                                <RotateCcw size={14} />
                                Reset mặc định
                            </button>
                            <button
                                onClick={handleSaveAllConfigs}
                                className="flex-1 md:flex-none px-10 py-4 bg-blue-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-blue-500/20 hover:bg-blue-700 transition-all active:scale-95 flex items-center justify-center gap-2"
                            >
                                <CheckCircle size={14} />
                                Lưu tất cả cấu hình
                            </button>
                        </div>
                    </div>

                    <div className="p-10 grid gap-8 max-w-5xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            {configurations.map((config, idx) => (
                                <div key={config.name || idx} className="bg-white rounded-[32px] p-8 border border-slate-100 hover:border-blue-200 hover:shadow-2xl hover:shadow-blue-500/5 transition-all group">
                                    <div className="flex items-center gap-3 mb-6">
                                        <div className="w-10 h-10 bg-slate-50 text-slate-400 group-hover:bg-blue-600 group-hover:text-white rounded-xl flex items-center justify-center transition-all">
                                            <ShieldCheck size={20} />
                                        </div>
                                        <div>
                                            <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">{config.name}</h3>
                                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest italic">Nhóm quy tắc hệ thống</span>
                                        </div>
                                    </div>

                                    <div className="space-y-6">
                                        {/* Max Overdue Days */}
                                        <div className="space-y-2">
                                            <div className="flex justify-between items-center">
                                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                                    <Clock size={12} />
                                                    Số ngày quá hạn tối đa
                                                </label>
                                                <span className="text-[10px] font-black text-blue-600">{config.maxOverdueDays} Ngày</span>
                                            </div>
                                            <input
                                                type="number"
                                                className="w-full bg-slate-50 border-none rounded-2xl px-5 py-4 text-xs font-black text-slate-900 focus:ring-4 focus:ring-blue-500/10 transition-all outline-none"
                                                value={config.maxOverdueDays}
                                                onChange={(e) => {
                                                    const val = parseInt(e.target.value) || 0
                                                    const newConfigs = [...configurations]
                                                    newConfigs[idx] = { ...config, maxOverdueDays: val }
                                                    setConfigurations(newConfigs)
                                                }}
                                            />
                                        </div>

                                        {/* Credit Limit Percent */}
                                        <div className="space-y-2">
                                            <div className="flex justify-between items-center">
                                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                                    <TrendingUp size={12} />
                                                    Tỷ lệ hạn mức cho phép (%)
                                                </label>
                                                <span className="text-[10px] font-black text-emerald-600">{config.creditLimitPercent}%</span>
                                            </div>
                                            <input
                                                type="number"
                                                className="w-full bg-slate-50 border-none rounded-2xl px-5 py-4 text-xs font-black text-slate-900 focus:ring-4 focus:ring-blue-500/10 transition-all outline-none"
                                                value={config.creditLimitPercent}
                                                onChange={(e) => {
                                                    const val = parseFloat(e.target.value) || 0
                                                    const newConfigs = [...configurations]
                                                    newConfigs[idx] = { ...config, creditLimitPercent: val }
                                                    setConfigurations(newConfigs)
                                                }}
                                            />
                                        </div>

                                        {/* Warning Days */}
                                        <div className="space-y-2">
                                            <div className="flex justify-between items-center">
                                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                                    <AlertTriangle size={12} />
                                                    Ngày bắt đầu cảnh báo
                                                </label>
                                                <span className="text-[10px] font-black text-orange-600">{config.warningDays} Ngày</span>
                                            </div>
                                            <input
                                                type="number"
                                                className="w-full bg-slate-50 border-none rounded-2xl px-5 py-4 text-xs font-black text-slate-900 focus:ring-4 focus:ring-blue-500/10 transition-all outline-none"
                                                value={config.warningDays}
                                                onChange={(e) => {
                                                    const val = parseInt(e.target.value) || 0
                                                    const newConfigs = [...configurations]
                                                    newConfigs[idx] = { ...config, warningDays: val }
                                                    setConfigurations(newConfigs)
                                                }}
                                            />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {configurations.length === 0 && (
                            <div className="text-center py-24 bg-slate-50 rounded-[40px] border border-dashed border-slate-200">
                                <RefreshCw className="w-12 h-12 text-slate-200 animate-spin mx-auto mb-4" />
                                <p className="text-sm font-black text-slate-400 uppercase tracking-widest">Đang tải cấu hình...</p>
                            </div>
                        )}

                        <div className="p-8 bg-amber-50 rounded-[32px] border border-amber-100 flex items-start gap-4">
                            <div className="p-3 bg-white text-amber-500 rounded-2xl shadow-sm">
                                <AlertTriangle size={24} />
                            </div>
                            <div>
                                <h4 className="text-xs font-black text-amber-900 uppercase tracking-widest mb-1">Cảnh báo hệ thống</h4>
                                <p className="text-xs font-bold text-amber-600/80 leading-relaxed uppercase tracking-tighter">
                                    Mọi thay đổi cấu hình sẽ ảnh hưởng trực tiếp đến việc phê duyệt đơn hàng tự động và tính toán nợ xấu của toàn công ty. Vui lòng kiểm tra kỹ trước khi thoát.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
