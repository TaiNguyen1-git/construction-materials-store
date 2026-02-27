'use client'

import { useState, useEffect } from 'react'
import {
    Zap, Package, TrendingDown, Clock, Search,
    ArrowRight, CheckCircle2, AlertCircle, ShoppingCart,
    DollarSign, BarChart3, ChevronRight, Filter
} from 'lucide-react'
import toast from 'react-hot-toast'

interface Bid {
    id: string
    supplierId: string
    bidPrice: number
    deliveryDays: number
    status: string
}

interface Opportunity {
    id: string
    requestNumber: string
    productId: string
    requestedQty: number
    priority: string
    createdAt: string
    product?: {
        name: string
        sku: string
    }
    bids: Bid[]
}

export default function SupplierOpportunities() {
    const [opportunities, setOpportunities] = useState<Opportunity[]>([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')
    const [selectedRequest, setSelectedRequest] = useState<Opportunity | null>(null)
    const [bidPrice, setBidPrice] = useState<number>(0)
    const [deliveryDays, setDeliveryDays] = useState<number>(3)
    const [notes, setNotes] = useState('')
    const [submitting, setSubmitting] = useState(false)

    useEffect(() => {
        fetchOpportunities()
    }, [])

    const fetchOpportunities = async () => {
        setLoading(true)
        try {
            const res = await fetch('/api/supplier/bids')
            const data = await res.json()
            if (data.success) {
                setOpportunities(data.data)
            }
        } catch (error) {
            toast.error('Không thể tải dữ liệu cơ hội')
        } finally {
            setLoading(false)
        }
    }

    const handleSubmitBid = async () => {
        if (!selectedRequest || bidPrice <= 0) {
            toast.error('Vui lòng nhập giá đấu thầu hợp lệ')
            return
        }

        const supplierId = localStorage.getItem('supplier_id')
        if (!supplierId) {
            toast.error('Vui lòng đăng nhập với tư cách Nhà cung cấp')
            return
        }

        setSubmitting(true)
        try {
            const res = await fetch('/api/supplier/bids', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    purchaseRequestId: selectedRequest.id,
                    supplierId,
                    bidPrice,
                    deliveryDays,
                    notes
                })
            })

            if (res.ok) {
                toast.success('Đã gửi báo giá đấu thầu thành công!')
                setSelectedRequest(null)
                fetchOpportunities()
            } else {
                toast.error('Gửi báo giá thất bại')
            }
        } catch (error) {
            toast.error('Lỗi kết nối')
        } finally {
            setSubmitting(false)
        }
    }

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND',
            minimumFractionDigits: 0
        }).format(amount)
    }

    const filteredOpportunities = opportunities.filter(op =>
        op.product?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        op.requestNumber.toLowerCase().includes(searchTerm.toLowerCase())
    )

    return (
        <div className="space-y-8 pb-20">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                        <TrendingDown className="text-blue-600" size={32} />
                        Cơ hội cung ứng
                    </h1>
                    <p className="text-sm font-bold text-slate-400 mt-1 uppercase tracking-widest">
                        Đấu thầu ngược & Cung cấp vật tư cho hệ thống
                    </p>
                </div>
                <div className="flex bg-white p-1 rounded-2xl border border-slate-200 shadow-sm">
                    <div className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-xl">
                        <Zap size={16} className="fill-current" />
                        <span className="text-[10px] font-black uppercase tracking-widest">Đang mở: {opportunities.length}</span>
                    </div>
                </div>
            </div>

            {/* Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                    { label: 'Tổng giá trị thầu', value: '850M+', icon: DollarSign, color: 'bg-emerald-50 text-emerald-600' },
                    { label: 'Tỷ lệ thắng thầu', value: '24%', icon: BarChart3, color: 'bg-blue-50 text-blue-600' },
                    { label: 'Thời gian phản hồi', value: '< 2h', icon: Clock, color: 'bg-purple-50 text-purple-600' }
                ].map((stat, i) => (
                    <div key={i} className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
                        <div className="flex justify-between items-center mb-4">
                            <div className={`p-3 rounded-2xl ${stat.color}`}>
                                <stat.icon size={20} />
                            </div>
                        </div>
                        <div className="text-2xl font-black text-slate-900">{stat.value}</div>
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">{stat.label}</div>
                    </div>
                ))}
            </div>

            {/* Search & Filter */}
            <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input
                        type="text"
                        placeholder="Tìm theo sản phẩm hoặc mã thầu..."
                        className="w-full pl-12 pr-4 py-4 bg-white border border-slate-200 rounded-[1.5rem] focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all font-medium"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <button className="px-6 py-4 bg-white border border-slate-200 rounded-[1.5rem] text-slate-600 font-bold flex items-center gap-2 hover:bg-slate-50">
                    <Filter size={18} />
                    Bộ lọc
                </button>
            </div>

            {/* Opportunities List */}
            {loading ? (
                <div className="py-20 text-center">
                    <div className="w-12 h-12 border-4 border-blue-600/20 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
                    <span className="text-xs font-black text-slate-400 uppercase tracking-widest italic">Đang quét cơ hội mới...</span>
                </div>
            ) : filteredOpportunities.length === 0 ? (
                <div className="py-20 text-center bg-white rounded-[3rem] border border-slate-100">
                    <Package size={48} className="text-slate-200 mx-auto mb-4" />
                    <h3 className="text-xl font-black text-slate-900 uppercase">Chưa có nhu cầu mới</h3>
                    <p className="text-sm text-slate-400 font-medium italic mt-2">Toàn bộ kho hàng hiện đang ở mức ổn định.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {filteredOpportunities.map((op) => (
                        <div key={op.id} className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all group">
                            <div className="flex justify-between items-start mb-6">
                                <div>
                                    <span className="px-3 py-1 bg-slate-100 text-slate-500 rounded-full text-[9px] font-black uppercase tracking-widest">{op.requestNumber}</span>
                                    <h3 className="text-xl font-black text-slate-900 mt-2 line-clamp-1">{op.product?.name || 'Sản phẩm chưa xác định'}</h3>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">SKU: {op.product?.sku}</p>
                                </div>
                                <div className={`px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest ${op.priority === 'URGENT' ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-blue-600'
                                    }`}>
                                    {op.priority === 'URGENT' ? 'Cần gấp' : 'Tiêu chuẩn'}
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4 mb-8">
                                <div className="p-4 bg-slate-50 rounded-2xl">
                                    <span className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Số lượng cần</span>
                                    <span className="text-lg font-black text-slate-900">{op.requestedQty}</span>
                                    <span className="ml-1 text-[10px] text-slate-500 font-bold uppercase">Cái</span>
                                </div>
                                <div className="p-4 bg-slate-50 rounded-2xl">
                                    <span className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Số thầu hiện tại</span>
                                    <span className="text-lg font-black text-blue-600">{op.bids?.length || 0}</span>
                                    <span className="ml-1 text-[10px] text-slate-400 font-bold uppercase">Báo giá</span>
                                </div>
                            </div>

                            <button
                                onClick={() => setSelectedRequest(op)}
                                className="w-full flex items-center justify-between px-6 py-4 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-blue-600 transition-all group shadow-lg shadow-slate-200"
                            >
                                Tham gia đấu giá
                                <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {/* Bid Modal (Simulated overlay) */}
            {selectedRequest && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-white w-full max-w-lg rounded-[3rem] p-10 shadow-2xl animate-in zoom-in-95 duration-300">
                        <div className="flex justify-between items-start mb-8">
                            <div>
                                <h2 className="text-2xl font-black text-slate-900 tracking-tight">Gửi báo giá thầu</h2>
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">{selectedRequest.product?.name}</p>
                            </div>
                            <button onClick={() => setSelectedRequest(null)} className="p-2 hover:bg-slate-100 rounded-full">
                                <Filter className="rotate-45" />
                            </button>
                        </div>

                        <div className="space-y-6">
                            <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Giá cung ứng mỗi đơn vị (VNĐ)</label>
                                <div className="relative">
                                    <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                                    <input
                                        type="number"
                                        className="w-full pl-12 pr-4 py-4 bg-slate-50 border-none rounded-2xl font-black text-lg focus:ring-2 focus:ring-blue-500/20"
                                        placeholder="0"
                                        value={bidPrice}
                                        onChange={(e) => setBidPrice(Number(e.target.value))}
                                    />
                                </div>
                                <p className="text-[10px] font-bold text-emerald-600 mt-2 italic">Tổng thầu dự kiến: {formatCurrency(bidPrice * selectedRequest.requestedQty)}</p>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Ngày giao hàng (số ngày)</label>
                                    <div className="relative">
                                        <Clock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                                        <input
                                            type="number"
                                            className="w-full pl-12 pr-4 py-4 bg-slate-50 border-none rounded-2xl font-black text-lg focus:ring-2 focus:ring-blue-500/20"
                                            value={deliveryDays}
                                            onChange={(e) => setDeliveryDays(Number(e.target.value))}
                                        />
                                    </div>
                                </div>
                                <div className="flex items-end">
                                    <p className="text-[10px] font-bold text-slate-400 leading-tight italic">
                                        Thời gian giao hàng nhanh là một lợi thế cạnh tranh lớn.
                                    </p>
                                </div>
                            </div>

                            <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Ghi chú thêm cho Admin</label>
                                <textarea
                                    className="w-full p-4 bg-slate-50 border-none rounded-2xl font-medium text-sm focus:ring-2 focus:ring-blue-500/20 h-24 resize-none"
                                    placeholder="Cam kết chất lượng, bảo hành..."
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 mt-10">
                            <button
                                onClick={() => setSelectedRequest(null)}
                                className="py-4 bg-slate-100 text-slate-600 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-200 transition-all"
                            >
                                Hủy bỏ
                            </button>
                            <button
                                onClick={handleSubmitBid}
                                disabled={submitting}
                                className="py-4 bg-blue-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-blue-700 shadow-xl shadow-blue-100 transition-all disabled:opacity-50"
                            >
                                {submitting ? 'Đang gửi...' : 'Gửi thầu ngay'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
