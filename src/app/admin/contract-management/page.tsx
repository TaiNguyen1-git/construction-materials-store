'use client'

/**
 * Contract Management Page - SME Feature 3
 * Trang quản lý hợp đồng và bảng giá B2B
 */

import { useState, useEffect } from 'react'
import {
    FileText,
    Plus,
    Edit,
    Trash2,
    CheckCircle,
    XCircle,
    Clock,
    DollarSign,
    Users,
    Calendar,
    RefreshCw,
    Search,
    Eye,
    Briefcase,
    ShieldCheck,
    AlertCircle,
    ChevronRight,
    Tag,
    BarChart,
    ChevronDown,
    MapPin,
    ArrowUpRight,
    LayoutGrid,
    List
} from 'lucide-react'

interface Contract {
    id: string
    contractNumber: string
    name: string
    customerId: string
    customer: {
        user: { name: string }
    }
    contractType: string
    status: string
    validFrom: string
    validTo: string
    creditTermDays: number
    specialCreditLimit?: number
    _count: {
        contractPrices: number
    }
    createdAt: string
}

interface PriceList {
    id: string
    code: string
    name: string
    description?: string
    discountPercent: number
    customerTypes: string[]
    priority: number
    isActive: boolean
}

export default function ContractManagementPage() {
    const [activeTab, setActiveTab] = useState<'contracts' | 'price-lists'>('contracts')
    const [contracts, setContracts] = useState<Contract[]>([])
    const [priceLists, setPriceLists] = useState<PriceList[]>([])
    const [loading, setLoading] = useState(true)
    const [showCreateModal, setShowCreateModal] = useState(false)
    const [searchTerm, setSearchTerm] = useState('')
    const [statusFilter, setStatusFilter] = useState('')

    useEffect(() => {
        loadData()
    }, [activeTab])

    const loadData = async () => {
        setLoading(true)
        try {
            if (activeTab === 'contracts') {
                const res = await fetch('/api/contracts')
                const data = await res.json()
                setContracts(data)
            } else {
                const res = await fetch('/api/price-lists')
                const data = await res.json()
                setPriceLists(data)
            }
        } catch (error) {
            console.error('Error loading data:', error)
        }
        setLoading(false)
    }

    const handleActivateContract = async (contractId: string) => {
        try {
            await fetch('/api/contracts', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'activate',
                    contractId,
                    approvedBy: 'admin'
                })
            })
            loadData()
        } catch (error) {
            console.error('Error activating contract:', error)
        }
    }

    const handleSeedPriceLists = async () => {
        try {
            const res = await fetch('/api/price-lists', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'seed-defaults' })
            })
            const data = await res.json()
            alert(data.message)
            loadData()
        } catch (error) {
            console.error('Error seeding price lists:', error)
        }
    }

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND'
        }).format(amount)
    }

    const formatDateArr = (dateStr: string) => {
        const d = new Date(dateStr)
        return {
            date: d.toLocaleDateString('vi-VN'),
            short: d.toLocaleDateString('vi-VN', { month: 'short', day: 'numeric' })
        }
    }

    const getStatusStyle = (status: string) => {
        switch (status) {
            case 'ACTIVE': return 'bg-emerald-50 text-emerald-600 border-emerald-100'
            case 'DRAFT': return 'bg-slate-50 text-slate-400 border-slate-100'
            case 'PENDING': return 'bg-amber-50 text-amber-600 border-amber-100'
            case 'EXPIRED': return 'bg-red-50 text-red-600 border-red-100'
            case 'CANCELLED': return 'bg-slate-100 text-slate-500 border-slate-200'
            default: return 'bg-gray-100 text-gray-700'
        }
    }

    const getStatusText = (status: string) => {
        switch (status) {
            case 'ACTIVE': return 'Đang Hiệu Lực'
            case 'DRAFT': return 'Bản Nháp'
            case 'PENDING': return 'Chờ Phê Duyệt'
            case 'EXPIRED': return 'Hết Hiệu Lực'
            case 'CANCELLED': return 'Đã Hủy Bỏ'
            default: return status
        }
    }

    // Stats
    const activeContracts = contracts.filter(c => c.status === 'ACTIVE').length
    const draftContracts = contracts.filter(c => c.status === 'DRAFT').length
    const expiringContracts = contracts.filter(c => {
        const validTo = new Date(c.validTo)
        const now = new Date()
        const diff = validTo.getTime() - now.getTime()
        return diff > 0 && diff < 7 * 24 * 60 * 60 * 1000 && c.status === 'ACTIVE'
    }).length

    const filteredContracts = contracts.filter(c => {
        const searchInput = searchTerm.toLowerCase()
        const matchSearch = c.name.toLowerCase().includes(searchInput) ||
            c.contractNumber.toLowerCase().includes(searchInput) ||
            c.customer.user.name.toLowerCase().includes(searchInput)
        const matchStatus = !statusFilter || c.status === statusFilter
        return matchSearch && matchStatus
    })

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                        <Briefcase className="text-blue-600" size={32} />
                        Hợp đồng & Bảng giá B2B
                    </h1>
                    <p className="text-sm font-bold text-slate-400 mt-1 uppercase tracking-widest">Quản Lý Vòng Đời Hợp Đồng Doanh Nghiệp</p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={() => setShowCreateModal(true)}
                        className="bg-blue-600 text-white px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-blue-700 shadow-xl shadow-blue-500/20 transition-all active:scale-95 flex items-center gap-2"
                    >
                        <Plus size={16} />
                        Soạn Thảo Hợp Đồng
                    </button>
                    <button
                        onClick={loadData}
                        className="bg-blue-100 text-blue-600 px-5 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest border border-blue-200 hover:bg-blue-200 transition-all flex items-center gap-2"
                    >
                        <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                    </button>
                </div>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {[
                    { label: 'Hợp Đồng Hiệu Lực', value: activeContracts, icon: ShieldCheck, color: 'bg-emerald-50 text-emerald-600', sub: 'Đang Hoạt Động', trend: 'Lưu Lượng Ổn Định' },
                    { label: 'Hợp Đồng Nháp', value: draftContracts, icon: FileText, color: 'bg-slate-100 text-slate-400', sub: 'Đang Soạn Thảo', trend: 'Chờ Xử Lý' },
                    { label: 'Sắp Hết Hạn (7 ngày)', value: expiringContracts, icon: AlertCircle, color: 'bg-red-50 text-red-600', sub: 'Cần Hành Động Ngay', trend: 'Cần Gia Hạn' },
                    { label: 'Bảng Giá Đặc Thù', value: priceLists.length, icon: Tag, color: 'bg-blue-50 text-blue-600', sub: 'Giá Đang Áp Dụng', trend: 'Định Giá Theo Bậc' }
                ].map((stat, i) => (
                    <div key={i} className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex justify-between items-start mb-4">
                            <div className={`p-3 rounded-2xl ${stat.color}`}>
                                <stat.icon size={20} />
                            </div>
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{stat.sub}</span>
                        </div>
                        <div className="text-2xl font-black text-slate-900">{stat.value}</div>
                        <div className="flex items-center gap-2 mt-1">
                            <div className="text-xs font-bold text-slate-400 uppercase tracking-tighter">{stat.label}</div>
                            <div className={`text-[9px] font-black uppercase ${i === 2 && expiringContracts > 0 ? 'text-red-500' : 'text-emerald-500'}`}>
                                {stat.trend}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Tab Navigation */}
            <div className="flex bg-slate-100 p-1.5 rounded-[22px] w-full md:w-max border border-slate-200/50">
                <button
                    onClick={() => setActiveTab('contracts')}
                    className={`flex items-center gap-2 px-6 py-2.5 rounded-[18px] text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'contracts' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'
                        }`}
                >
                    <Briefcase size={14} />
                    Danh sách hợp đồng
                </button>
                <button
                    onClick={() => setActiveTab('price-lists')}
                    className={`flex items-center gap-2 px-6 py-2.5 rounded-[18px] text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'price-lists' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'
                        }`}
                >
                    <Tag size={14} />
                    Bảng giá phân hạng
                </button>
            </div>

            {/* Content Area */}
            {loading ? (
                <div className="py-24 text-center">
                    <div className="w-12 h-12 border-4 border-blue-600/20 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
                    <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Loading Repository...</span>
                </div>
            ) : (
                <>
                    {activeTab === 'contracts' && (
                        <div className="space-y-6">
                            {/* Contract Filters */}
                            <div className="p-4 bg-white rounded-[32px] border border-slate-100 shadow-sm flex flex-col md:flex-row gap-4 items-center">
                                <div className="relative flex-1 group">
                                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                                    <input
                                        type="text"
                                        placeholder="Tìm số hợp đồng, tên khách hàng hoặc tiêu đề..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="w-full pl-12 pr-4 py-3 bg-slate-50 border-none rounded-2xl text-sm font-medium focus:ring-2 focus:ring-blue-500/20 transition-all"
                                    />
                                </div>
                                <div className="flex gap-2 w-full md:w-auto">
                                    <select
                                        value={statusFilter}
                                        onChange={(e) => setStatusFilter(e.target.value)}
                                        className="flex-1 md:w-48 px-4 py-3 bg-slate-50 border-none rounded-2xl text-[10px] font-black text-slate-500 uppercase tracking-widest focus:ring-2 focus:ring-blue-500/20"
                                    >
                                        <option value="">Tất cả trạng thái</option>
                                        <option value="ACTIVE">Hiệu lực</option>
                                        <option value="DRAFT">Nháp</option>
                                        <option value="PENDING">Chờ duyệt</option>
                                        <option value="EXPIRED">Hết hạn</option>
                                    </select>
                                </div>
                            </div>

                            {/* Contracts Table */}
                            <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden">
                                <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-slate-100">
                                        <thead className="bg-slate-50/50">
                                            <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                                <th className="px-6 py-4 text-left">Contract Info</th>
                                                <th className="px-6 py-4 text-left">Client Entity</th>
                                                <th className="px-4 py-4 text-center">Type</th>
                                                <th className="px-4 py-4 text-center">Validation Period</th>
                                                <th className="px-4 py-4 text-center">SKU Items</th>
                                                <th className="px-4 py-4 text-center">Lifecycle</th>
                                                <th className="px-6 py-4 text-right">Thao Tác</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-50">
                                            {filteredContracts.length === 0 ? (
                                                <tr>
                                                    <td colSpan={7} className="px-6 py-12 text-center text-slate-400 font-bold italic uppercase tracking-widest italic">No contracts matching your criteria</td>
                                                </tr>
                                            ) : (
                                                filteredContracts.map((contract) => (
                                                    <tr key={contract.id} className="hover:bg-blue-50/30 transition-colors group">
                                                        <td className="px-6 py-4 whitespace-nowrap">
                                                            <div className="flex items-center gap-3">
                                                                <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-emerald-600 group-hover:text-white transition-all">
                                                                    <FileText size={18} />
                                                                </div>
                                                                <div>
                                                                    <div className="text-sm font-black text-slate-900 group-hover:text-emerald-600 transition-colors uppercase tracking-tight">{contract.name}</div>
                                                                    <div className="text-[10px] font-mono text-slate-400 font-bold uppercase tracking-widest mt-0.5">#{contract.contractNumber}</div>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap">
                                                            <div className="flex items-center gap-2">
                                                                <Users size={12} className="text-blue-400" />
                                                                <span className="text-xs font-bold text-slate-600">{contract.customer.user.name}</span>
                                                            </div>
                                                        </td>
                                                        <td className="px-4 py-4 text-center">
                                                            <span className="px-2 py-0.5 bg-blue-50 text-blue-600 rounded-lg text-[10px] font-black uppercase tracking-tighter">
                                                                {contract.contractType}
                                                            </span>
                                                        </td>
                                                        <td className="px-4 py-4 text-center">
                                                            <div className="flex flex-col items-center">
                                                                <div className="text-[11px] font-bold text-slate-600">
                                                                    {formatDateArr(contract.validFrom).short} - {formatDateArr(contract.validTo).short}
                                                                </div>
                                                                <div className="text-[9px] text-slate-300 font-black uppercase tracking-widest mt-0.5 underline decoration-slate-200">
                                                                    {contract.creditTermDays} Days Net
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="px-4 py-4 text-center">
                                                            <div className="inline-flex items-center gap-1 px-2 py-1 bg-slate-50 rounded-lg">
                                                                <List size={10} className="text-slate-400" />
                                                                <span className="text-xs font-bold text-slate-600">{contract._count.contractPrices}</span>
                                                            </div>
                                                        </td>
                                                        <td className="px-4 py-4 text-center">
                                                            <span className={`px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border ${getStatusStyle(contract.status)}`}>
                                                                {getStatusText(contract.status)}
                                                            </span>
                                                        </td>
                                                        <td className="px-6 py-4 text-right">
                                                            <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                                <button className="p-2 bg-slate-50 text-slate-400 rounded-xl hover:bg-slate-900 hover:text-white transition-all shadow-sm">
                                                                    <Eye size={16} />
                                                                </button>
                                                                <button className="p-2 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-600 hover:text-white transition-all shadow-sm">
                                                                    <Edit size={16} />
                                                                </button>
                                                                {contract.status === 'DRAFT' && (
                                                                    <button
                                                                        onClick={() => handleActivateContract(contract.id)}
                                                                        className="p-2 bg-emerald-50 text-emerald-600 rounded-xl hover:bg-emerald-600 hover:text-white transition-all shadow-sm"
                                                                    >
                                                                        <CheckCircle size={16} />
                                                                    </button>
                                                                )}
                                                                <button className="p-2 bg-red-50 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all shadow-sm">
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

                    {activeTab === 'price-lists' && (
                        <div className="space-y-6 animate-in slide-in-from-right duration-500">
                            <div className="flex flex-col md:flex-row justify-between items-start md:items-center p-8 bg-purple-50 rounded-[40px] border border-purple-100 gap-6">
                                <div className="flex items-center gap-4">
                                    <div className="p-4 bg-white text-purple-600 rounded-[22px] shadow-sm">
                                        <BarChart size={24} />
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-black text-purple-900 uppercase tracking-tighter">Bảng giá bậc thang B2B</h2>
                                        <p className="text-[10px] font-black text-purple-400 uppercase tracking-widest mt-0.5">Multi-tier pricing architecture</p>
                                    </div>
                                </div>
                                <button
                                    onClick={handleSeedPriceLists}
                                    className="px-6 py-4 bg-white text-purple-600 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-purple-600 hover:text-white transition-all shadow-xl shadow-purple-100/50 flex items-center gap-2"
                                >
                                    <RefreshCw size={14} />
                                    Reset Default Price Lists
                                </button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
                                {priceLists.length === 0 ? (
                                    <div className="col-span-full py-24 text-center bg-white rounded-[40px] border border-slate-100">
                                        <DollarSign className="w-16 h-16 text-slate-200 mx-auto mb-4" />
                                        <p className="text-sm font-black text-slate-400 uppercase tracking-widest">Hệ thống chưa ghi nhận bảng giá nào</p>
                                        <button onClick={handleSeedPriceLists} className="mt-4 text-blue-600 font-bold uppercase text-[10px] tracking-widest hover:underline underline-offset-4">Tạo nhanh 3 cấp bậc giá mặc định</button>
                                    </div>
                                ) : (
                                    priceLists.map((priceList) => (
                                        <div key={priceList.id} className="bg-white rounded-[40px] p-8 shadow-sm border border-slate-100 hover:shadow-xl hover:-translate-y-1 transition-all group overflow-hidden relative">
                                            {/* Top Decorative Circle */}
                                            <div className="absolute -top-12 -right-12 w-32 h-32 bg-slate-50 rounded-full group-hover:bg-blue-50 transition-colors"></div>

                                            <div className="flex justify-between items-start mb-6 relative z-10">
                                                <div className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border ${priceList.isActive ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-slate-50 text-slate-400 border-slate-100'}`}>
                                                    {priceList.isActive ? 'Applied' : 'Hold'}
                                                </div>
                                                <div className="text-[10px] font-black text-slate-300 uppercase tracking-widest border-b-2 border-slate-100">Priority #{priceList.priority}</div>
                                            </div>

                                            <div className="mb-6 relative z-10">
                                                <h3 className="text-xl font-black text-slate-900 uppercase tracking-tighter line-clamp-1">{priceList.name}</h3>
                                                <div className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest mt-1">CODE: {priceList.code}</div>
                                            </div>

                                            <p className="text-[11px] font-bold text-slate-400 leading-relaxed mb-8 uppercase tracking-tighter h-12 line-clamp-3">
                                                {priceList.description || 'Hệ thống định giá tự động dựa trên phân khúc khách hàng mục tiêu.'}
                                            </p>

                                            <div className="p-6 bg-slate-50 rounded-[32px] border border-slate-100 relative z-10">
                                                <div className="flex justify-between items-center mb-4">
                                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">Contractual Discount</span>
                                                    <ArrowUpRight size={14} className="text-blue-500" />
                                                </div>
                                                <div className="flex items-baseline gap-1">
                                                    <span className="text-4xl font-black text-slate-900 tracking-tighter">{priceList.discountPercent}</span>
                                                    <span className="text-lg font-black text-blue-600">%</span>
                                                </div>
                                                <div className="mt-4 flex flex-wrap gap-1.5 pt-4 border-t border-slate-200/50">
                                                    {priceList.customerTypes.map((type, index) => (
                                                        <span key={index} className="px-2 py-0.5 bg-white text-slate-400 text-[9px] font-black border border-slate-100 rounded uppercase tracking-tighter">
                                                            {type}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-2 gap-3 mt-6">
                                                <button className="py-3.5 bg-blue-600 text-white rounded-[20px] font-black text-[10px] uppercase tracking-widest hover:bg-blue-700 transition-all flex items-center justify-center gap-2">
                                                    <Edit size={12} />
                                                    Cập nhật
                                                </button>
                                                <button className="py-3.5 bg-slate-100 text-slate-400 rounded-[20px] font-black text-[10px] uppercase tracking-widest hover:bg-red-50 hover:text-red-600 transition-all flex items-center justify-center gap-2">
                                                    <Trash2 size={12} />
                                                    Xóa bỏ
                                                </button>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    )
}
