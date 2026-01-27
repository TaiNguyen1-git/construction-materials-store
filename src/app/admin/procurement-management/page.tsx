'use client'

/**
 * Procurement Management Page - SME Feature 2
 * Trang quản lý nhập hàng thông minh
 */

import { useState, useEffect } from 'react'
import {
    Package,
    TrendingUp,
    AlertTriangle,
    CheckCircle,
    XCircle,
    Clock,
    Truck,
    ShoppingCart,
    RefreshCw,
    Plus,
    ArrowRight,
    Search,
    ChevronRight,
    Cpu,
    Boxes,
    BarChart3,
    ArrowUpRight,
    Zap,
    History,
    FileText
} from 'lucide-react'

interface PurchaseSuggestion {
    productId: string
    productName: string
    productSku: string
    categoryName: string
    currentStock: number
    reorderPoint: number
    suggestedQty: number
    avgDailySales: number
    daysUntilStockout: number
    priority: 'URGENT' | 'HIGH' | 'MEDIUM' | 'LOW'
    bestSupplier?: {
        id: string
        name: string
        unitPrice: number
        leadTimeDays: number
    }
    estimatedCost: number
}

interface PurchaseRequest {
    id: string
    requestNumber: string
    productId: string
    productName?: string
    productSku?: string
    supplierId?: string
    supplierName?: string
    requestedQty: number
    currentStock: number
    estimatedCost?: number
    source: string
    status: string
    priority: string
    createdAt: string
}

export default function ProcurementManagementPage() {
    const [activeTab, setActiveTab] = useState<'suggestions' | 'requests'>('suggestions')
    const [suggestions, setSuggestions] = useState<PurchaseSuggestion[]>([])
    const [requests, setRequests] = useState<PurchaseRequest[]>([])
    const [loading, setLoading] = useState(true)
    const [suppliers, setSuppliers] = useState<{ id: string, name: string }[]>([])
    const [searchTerm, setSearchTerm] = useState('')

    useEffect(() => {
        loadData()
    }, [activeTab])

    const loadData = async () => {
        setLoading(true)
        try {
            if (activeTab === 'suggestions') {
                const res = await fetch('/api/procurement?type=suggestions')
                const data = await res.json()
                setSuggestions(data)
            } else {
                const res = await fetch('/api/procurement?type=requests')
                const data = await res.json()
                setRequests(data)
            }

            try {
                const sRes = await fetch('/api/suppliers?limit=100')
                const sData = await sRes.json()
                if (sData.data && Array.isArray(sData.data)) {
                    setSuppliers(sData.data)
                }
            } catch (err) {
                console.error('Failed to fetch suppliers', err)
            }
        } catch (error) {
            console.error('Error loading data:', error)
        }
        setLoading(false)
    }

    const handleAssignSupplier = async (requestId: string, supplierId: string) => {
        try {
            await fetch('/api/procurement', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'assign-supplier',
                    requestId,
                    supplierId
                })
            })
            loadData()
        } catch (error) {
            console.error('Error assigning supplier:', error)
        }
    }

    const handleCreateRequest = async (suggestion: PurchaseSuggestion) => {
        try {
            await fetch('/api/procurement', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'create-request',
                    productId: suggestion.productId,
                    requestedQty: suggestion.suggestedQty,
                    supplierId: suggestion.bestSupplier?.id
                })
            })
            loadData()
            alert('Đã tạo yêu cầu nhập hàng!')
        } catch (error) {
            console.error('Error creating request:', error)
        }
    }

    const handleApproveRequest = async (requestId: string) => {
        try {
            await fetch('/api/procurement', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'approve',
                    requestId,
                    approvedBy: 'admin'
                })
            })
            loadData()
        } catch (error) {
            console.error('Error approving request:', error)
        }
    }

    const handleAutoGenerate = async () => {
        try {
            const res = await fetch('/api/procurement', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'auto-generate' })
            })
            const data = await res.json()
            alert(data.message)
            loadData()
        } catch (error) {
            console.error('Error auto-generating:', error)
        }
    }

    const handleConvertToPO = async (requestId: string) => {
        try {
            const res = await fetch('/api/procurement', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'convert-to-po',
                    requestId,
                    approvedBy: 'admin'
                })
            })
            const data = await res.json()
            if (data.error) {
                alert(data.error)
            } else {
                alert(`Đã tạo Đơn đặt hàng: ${data.orderNumber}`)
                loadData()
            }
        } catch (error) {
            console.error('Error converting to PO:', error)
            alert('Lỗi khi tạo đơn đặt hàng')
        }
    }

    const formatCurrency = (amount: number | undefined | null) => {
        if (amount === undefined || amount === null) return '-'
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND'
        }).format(amount)
    }

    const getPriorityStyle = (priority: string) => {
        switch (priority) {
            case 'URGENT': return 'bg-red-50 text-red-600 border-red-100'
            case 'HIGH': return 'bg-orange-50 text-orange-600 border-orange-100'
            case 'MEDIUM': return 'bg-blue-50 text-blue-600 border-blue-100'
            case 'LOW': return 'bg-slate-50 text-slate-500 border-slate-100'
            default: return 'bg-gray-50 text-gray-700 border-gray-100'
        }
    }

    const getPriorityLabel = (priority: string) => {
        switch (priority) {
            case 'URGENT': return 'Khẩn cấp'
            case 'HIGH': return 'Ưu tiên cao'
            case 'MEDIUM': return 'Trung bình'
            case 'LOW': return 'Tiêu chuẩn'
            default: return priority
        }
    }

    const getStatusStyle = (status: string) => {
        switch (status) {
            case 'PENDING': return 'bg-amber-50 text-amber-600 border-amber-100'
            case 'APPROVED': return 'bg-emerald-50 text-emerald-600 border-emerald-100'
            case 'REJECTED': return 'bg-red-50 text-red-600 border-red-100'
            case 'CONVERTED': return 'bg-blue-50 text-blue-600 border-blue-100'
            default: return 'bg-slate-50 text-slate-500 border-slate-100'
        }
    }

    const getStatusLabel = (status: string) => {
        switch (status) {
            case 'PENDING': return 'Chờ duyệt'
            case 'APPROVED': return 'Đã phê duyệt'
            case 'REJECTED': return 'Từ chối'
            case 'CONVERTED': return 'Đã lên PO'
            default: return status
        }
    }

    // Stats
    const urgentCount = suggestions.filter(s => s.priority === 'URGENT').length
    const highCount = suggestions.filter(s => s.priority === 'HIGH').length
    const totalEstimatedCost = suggestions.reduce((sum, s) => sum + s.estimatedCost, 0)
    const pendingRequests = requests.filter(r => r.status === 'PENDING').length

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                        <Cpu className="text-blue-600" size={32} />
                        Nhập hàng AI & Tự động
                    </h1>
                    <p className="text-sm font-bold text-slate-400 mt-1 uppercase tracking-widest">Quản Lý Chuỗi Cung Ứng & Nhập Hàng Thông Minh</p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={handleAutoGenerate}
                        className="bg-blue-600 text-white px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-blue-700 shadow-xl shadow-blue-500/20 transition-all active:scale-95 flex items-center gap-2"
                    >
                        <Zap size={14} className="fill-current" />
                        AI Tự Động Tạo
                    </button>
                    <button
                        onClick={loadData}
                        className="bg-blue-100 text-blue-600 px-5 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest border border-blue-200 hover:bg-blue-200 transition-all flex items-center gap-2"
                    >
                        <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                    </button>
                </div>
            </div>

            {/* Metrics Overview */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {[
                    { label: 'Cần Nhập Khẩn Cấp', value: urgentCount, icon: AlertTriangle, color: 'bg-red-50 text-red-600', sub: 'Cảnh Báo Hết Hàng', trend: 'Mức Báo Động' },
                    { label: 'Yêu Cầu Chờ Duyệt', value: pendingRequests, icon: Clock, color: 'bg-amber-50 text-amber-600', sub: 'Chờ Phê Duyệt', trend: 'Thời Gian Xử Lý: 2h' },
                    { label: 'Ngân Sách Dự Kiến', value: totalEstimatedCost, icon: ShoppingCart, color: 'bg-blue-50 text-blue-600', sub: 'Chi Tiêu Dự Tính', trend: '+12% so với tháng trước' },
                    { label: 'Sản Phẩm Dưới Hạn', value: suggestions.length, icon: Boxes, color: 'bg-purple-50 text-purple-600', sub: 'Tồn Kho Thấp', trend: 'Chỉ Theo Dõi' }
                ].map((stat, i) => (
                    <div key={i} className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex justify-between items-start mb-4">
                            <div className={`p-3 rounded-2xl ${stat.color}`}>
                                <stat.icon size={20} />
                            </div>
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{stat.sub}</span>
                        </div>
                        <div className="text-2xl font-black text-slate-900">
                            {typeof stat.value === 'number' && i === 2 ? formatCurrency(stat.value) : stat.value}
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                            <div className="text-xs font-bold text-slate-400 uppercase tracking-tighter">{stat.label}</div>
                            <div className="text-[9px] font-black text-emerald-500 uppercase flex items-center gap-1">
                                <ArrowUpRight size={10} />
                                {stat.trend}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Navigation Tabs */}
            <div className="flex bg-slate-100 p-1.5 rounded-[22px] w-full md:w-max border border-slate-200/50">
                <button
                    onClick={() => setActiveTab('suggestions')}
                    className={`flex items-center gap-2 px-6 py-2.5 rounded-[18px] text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'suggestions' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'
                        }`}
                >
                    <BarChart3 size={14} />
                    Gợi ý AI tối ưu tồn kho
                </button>
                <button
                    onClick={() => setActiveTab('requests')}
                    className={`flex items-center gap-2 px-6 py-2.5 rounded-[18px] text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'requests' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'
                        }`}
                >
                    <FileText size={14} />
                    Lịch sử yêu cầu nhập
                    {pendingRequests > 0 && <span className="ml-2 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-[9px] animate-pulse">{pendingRequests}</span>}
                </button>
            </div>

            {/* Active Content */}
            {loading ? (
                <div className="py-24 text-center">
                    <div className="w-12 h-12 border-4 border-blue-600/20 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
                    <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Analyzing Inventory Data...</span>
                </div>
            ) : (
                <>
                    {activeTab === 'suggestions' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in slide-in-from-bottom-4 duration-500">
                            {suggestions.length === 0 ? (
                                <div className="col-span-full py-24 text-center bg-white rounded-[40px] border border-slate-100">
                                    <CheckCircle size={48} className="text-emerald-500 mx-auto mb-4" />
                                    <h3 className="text-xl font-black text-slate-900 uppercase tracking-tighter">Hàng hóa ổn định</h3>
                                    <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mt-1">Không có sản phẩm nào cần nhập thêm tại thời điểm này</p>
                                </div>
                            ) : (
                                suggestions.map((suggestion) => (
                                    <div key={suggestion.productId} className="bg-white rounded-[32px] p-8 shadow-sm border border-slate-100 hover:shadow-xl hover:-translate-y-1 transition-all group overflow-hidden relative">
                                        <div className="absolute top-0 right-0 p-4">
                                            <span className={`px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest ${getPriorityStyle(suggestion.priority)} border`}>
                                                {getPriorityLabel(suggestion.priority)}
                                            </span>
                                        </div>

                                        <div className="mb-6">
                                            <div className="text-[10px] font-black text-slate-300 uppercase tracking-widest group-hover:text-blue-600 transition-colors">{suggestion.categoryName}</div>
                                            <h3 className="text-xl font-black text-slate-900 tracking-tight mt-1 line-clamp-1">{suggestion.productName}</h3>
                                            <div className="inline-block px-2 py-0.5 bg-slate-100 text-slate-400 text-[9px] font-bold rounded uppercase mt-2 tracking-tighter">SKU: {suggestion.productSku}</div>
                                        </div>

                                        <div className="space-y-4 mb-8">
                                            <div className="flex justify-between items-end">
                                                <div>
                                                    <span className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Tồn hiện tại</span>
                                                    <span className={`text-2xl font-black ${suggestion.currentStock <= suggestion.reorderPoint ? 'text-red-600' : 'text-slate-900'}`}>{suggestion.currentStock}</span>
                                                </div>
                                                <div className="text-right">
                                                    <span className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Điểm đặt hàng</span>
                                                    <span className="text-sm font-black text-slate-500">{suggestion.reorderPoint}</span>
                                                </div>
                                            </div>

                                            {/* Logic Progress Bar */}
                                            <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                                                <div
                                                    className={`h-full rounded-full transition-all duration-1000 ${suggestion.currentStock <= suggestion.reorderPoint ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]' : 'bg-blue-500'}`}
                                                    style={{ width: `${Math.min(100, (suggestion.currentStock / suggestion.reorderPoint) * 50)}%` }}
                                                ></div>
                                            </div>

                                            <div className="grid grid-cols-2 gap-4 py-4 border-y border-slate-50">
                                                <div>
                                                    <span className="block text-[9px] font-black text-slate-400 uppercase tracking-widest">Sức mua TB/Ngày</span>
                                                    <span className="text-xs font-black text-slate-600">{suggestion.avgDailySales.toFixed(1)} ĐV</span>
                                                </div>
                                                <div className="text-right">
                                                    <span className="block text-[9px] font-black text-slate-400 uppercase tracking-widest">Hết hàng sau</span>
                                                    <span className={`text-xs font-black ${suggestion.daysUntilStockout <= 7 ? 'text-red-600' : 'text-emerald-600'}`}>{suggestion.daysUntilStockout} Ngày</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100 mb-6">
                                            <div className="flex justify-between items-center mb-3">
                                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">Tối Ưu Hóa Bởi AI</span>
                                                <Zap size={14} className="text-blue-600 fill-current" />
                                            </div>
                                            <div className="flex justify-between items-center">
                                                <span className="text-xs font-bold text-slate-600 uppercase">Khuyên nhập:</span>
                                                <span className="text-lg font-black text-blue-600">+{suggestion.suggestedQty} <span className="text-[10px]">CÁI</span></span>
                                            </div>
                                            <div className="flex justify-between items-center mt-1">
                                                <span className="text-xs font-bold text-slate-600 uppercase">Ước tính:</span>
                                                <span className="text-xs font-black text-slate-900">{formatCurrency(suggestion.estimatedCost)}</span>
                                            </div>
                                        </div>

                                        <button
                                            onClick={() => handleCreateRequest(suggestion)}
                                            className="w-full flex items-center justify-center gap-2 py-4 bg-blue-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all active:scale-95"
                                        >
                                            <Plus size={16} />
                                            Khởi tạo yêu cầu
                                        </button>
                                    </div>
                                ))
                            )}
                        </div>
                    )}

                    {activeTab === 'requests' && (
                        <div className="space-y-6">
                            {/* Filter Bar */}
                            <div className="p-4 bg-white rounded-[32px] border border-slate-100 shadow-sm flex flex-col md:flex-row gap-4 items-center">
                                <div className="relative flex-1 group">
                                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                                    <input
                                        type="text"
                                        placeholder="Tìm mã yêu cầu, tên sản phẩm..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="w-full pl-12 pr-4 py-3 bg-slate-50 border-none rounded-2xl text-sm font-medium focus:ring-2 focus:ring-blue-500/20"
                                    />
                                </div>
                                <div className="flex items-center gap-2">
                                    <select className="px-6 py-3 bg-slate-50 border-none rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-400 focus:ring-2 focus:ring-blue-500/20">
                                        <option>Mọi trạng thái</option>
                                        <option>Đang chờ</option>
                                        <option>Đã duyệt</option>
                                    </select>
                                </div>
                            </div>

                            <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden">
                                <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-slate-100">
                                        <thead className="bg-slate-50/50">
                                            <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                                <th className="px-6 py-4 text-left">Phiếu yêu cầu</th>
                                                <th className="px-6 py-4 text-left">Sản phẩm</th>
                                                <th className="px-6 py-4 text-left">Đối tác cung ứng</th>
                                                <th className="px-4 py-4 text-right">Số lượng</th>
                                                <th className="px-4 py-4 text-right">Dự chi</th>
                                                <th className="px-4 py-4 text-center">Nguồn</th>
                                                <th className="px-4 py-4 text-center">Status</th>
                                                <th className="px-6 py-4 text-right">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-50">
                                            {requests.length === 0 ? (
                                                <tr>
                                                    <td colSpan={8} className="px-6 py-12 text-center text-slate-400 font-bold italic uppercase tracking-widest">Chưa có bản ghi nào lưu chuyển</td>
                                                </tr>
                                            ) : (
                                                requests.map((request) => (
                                                    <tr key={request.id} className="hover:bg-blue-50/30 transition-colors group">
                                                        <td className="px-6 py-4 whitespace-nowrap">
                                                            <div className="text-sm font-black text-slate-900 group-hover:text-blue-600 transition-colors uppercase tracking-tight">{request.requestNumber}</div>
                                                            <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Initiated: {new Date(request.createdAt).toLocaleDateString('vi-VN')}</div>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <div className="text-sm font-black text-slate-900">{request.productName}</div>
                                                            <div className="inline-block px-1.5 py-0.5 bg-slate-100 text-slate-400 text-[9px] font-bold rounded uppercase mt-1">SKU: {request.productSku}</div>
                                                        </td>
                                                        <td className="px-6 py-4 min-w-[200px]">
                                                            {request.supplierName ? (
                                                                <div className="flex items-center gap-2">
                                                                    <Truck size={12} className="text-blue-500" />
                                                                    <span className="text-xs font-bold text-slate-600">{request.supplierName}</span>
                                                                </div>
                                                            ) : (
                                                                <select
                                                                    className="w-full bg-slate-50 border-none rounded-xl px-3 py-2 text-[10px] font-black uppercase tracking-widest text-slate-400 focus:ring-2 focus:ring-blue-500/20"
                                                                    onChange={(e) => handleAssignSupplier(request.id, e.target.value)}
                                                                    value=""
                                                                >
                                                                    <option value="" disabled>-- Assign NCC --</option>
                                                                    {suppliers.map(s => (
                                                                        <option key={s.id} value={s.id}>{s.name}</option>
                                                                    ))}
                                                                </select>
                                                            )}
                                                        </td>
                                                        <td className="px-4 py-4 text-right">
                                                            <div className="text-sm font-black text-slate-900">{request.requestedQty}</div>
                                                            <div className="text-[9px] text-slate-300 font-bold uppercase tracking-widest">Units</div>
                                                        </td>
                                                        <td className="px-4 py-4 text-right">
                                                            <div className="text-sm font-black text-emerald-600">{formatCurrency(request.estimatedCost)}</div>
                                                        </td>
                                                        <td className="px-4 py-4 text-center">
                                                            <span className={`px-2 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${request.source === 'SYSTEM' ? 'bg-purple-50 text-purple-600 border-purple-100' : 'bg-slate-50 text-slate-500 border-slate-200'}`}>
                                                                {request.source === 'SYSTEM' ? 'AUTO' : 'MANUAL'}
                                                            </span>
                                                        </td>
                                                        <td className="px-4 py-4 text-center whitespace-nowrap">
                                                            <span className={`px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border ${getStatusStyle(request.status)}`}>
                                                                {getStatusLabel(request.status)}
                                                            </span>
                                                        </td>
                                                        <td className="px-6 py-4 text-right whitespace-nowrap">
                                                            {request.status === 'PENDING' && (
                                                                <div className="flex gap-2 justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                                                                    <button
                                                                        onClick={() => handleApproveRequest(request.id)}
                                                                        className="p-2 bg-emerald-50 text-emerald-600 rounded-xl hover:bg-emerald-600 hover:text-white transition-all shadow-sm"
                                                                    >
                                                                        <CheckCircle size={18} />
                                                                    </button>
                                                                    <button className="p-2 bg-red-50 text-red-500 rounded-xl hover:bg-red-600 hover:text-white transition-all shadow-sm">
                                                                        <XCircle size={18} />
                                                                    </button>
                                                                </div>
                                                            )}
                                                            {request.status === 'APPROVED' && (
                                                                <button
                                                                    onClick={() => handleConvertToPO(request.id)}
                                                                    disabled={!request.supplierId}
                                                                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${!request.supplierId ? 'bg-slate-100 text-slate-300 cursor-not-allowed' : 'bg-blue-600 text-white hover:bg-slate-900 shadow-lg shadow-blue-100'}`}
                                                                >
                                                                    Create PO
                                                                    <ArrowRight size={14} />
                                                                </button>
                                                            )}
                                                            {request.status === 'CONVERTED' && (
                                                                <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest flex items-center justify-end gap-1">
                                                                    <History size={12} />
                                                                    Log Fixed
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
                </>
            )}
        </div>
    )
}
