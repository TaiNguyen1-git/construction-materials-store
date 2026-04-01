'use client'

import { useState, useEffect, useMemo } from 'react'
import {
    Zap, Package, TrendingDown, Clock, Search,
    ArrowRight, CheckCircle2, AlertCircle,
    DollarSign, BarChart3, Filter, MapPin, Calendar, FileText, CheckCircle
} from 'lucide-react'
import toast from 'react-hot-toast'

interface Bid {
    id: string
    supplierId: string
    bidPrice: number
    deliveryDays: number
    status: string // e.g. PENDING, ACCEPTED, REJECTED
}

interface Opportunity {
    id: string
    requestNumber: string
    productId: string
    requestedQty: number
    priority: string
    createdAt: string
    status?: string
    deadline?: string 
    deliveryAddress?: string
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
    const [activeTab, setActiveTab] = useState<'MARKET' | 'MY_BIDS'>('MARKET')
    const [supplierId, setSupplierId] = useState<string | null>(null)

    // Modal state
    const [selectedRequest, setSelectedRequest] = useState<Opportunity | null>(null)
    const [bidPrice, setBidPrice] = useState<number>(0)
    const [deliveryDays, setDeliveryDays] = useState<number>(3)
    const [notes, setNotes] = useState('')
    const [submitting, setSubmitting] = useState(false)

    useEffect(() => {
        const id = localStorage.getItem('supplier_id')
        setSupplierId(id)
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
                fetchOpportunities() // refresh
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

    // Process lists
    const processedOps = useMemo(() => {
        // We add fake deadline & fallback address if they are missing from backend for UX purpose
        return opportunities.map(op => {
            const created = new Date(op.createdAt)
            const deadlineDate = new Date(created)
            deadlineDate.setDate(created.getDate() + 7) // Fake deadline = 7 days after creation

            return {
                ...op,
                deadline: op.deadline || deadlineDate.toISOString(),
                deliveryAddress: op.deliveryAddress || 'Kho Tổng SmartBuild, Khu CNC, TP.Thủ Đức, TP.HCM',
            }
        }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    }, [opportunities])

    const marketOps = processedOps.filter(op => !supplierId || !op.bids?.some(b => b.supplierId === supplierId))
    const myBidOps = processedOps.filter(op => supplierId && op.bids?.some(b => b.supplierId === supplierId))

    const filteredMarket = marketOps.filter(op => 
        op.product?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        op.requestNumber.toLowerCase().includes(searchTerm.toLowerCase())
    )

    const filteredMyBids = myBidOps.filter(op => 
        op.product?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        op.requestNumber.toLowerCase().includes(searchTerm.toLowerCase())
    )

    // Calculate real metrics based on myBidOps
    const stats = useMemo(() => {
        if (!supplierId) return { totalValue: 0, pending: 0, won: 0 }
        let totalValue = 0
        let pending = 0
        let won = 0
        myBidOps.forEach(op => {
            const myBid = op.bids.find(b => b.supplierId === supplierId)
            if (myBid) {
                totalValue += myBid.bidPrice * op.requestedQty
                if (myBid.status === 'PENDING') pending++
                if (myBid.status === 'ACCEPTED') won++
            }
        })
        return { totalValue, pending, won }
    }, [myBidOps, supplierId])

    const currentList = activeTab === 'MARKET' ? filteredMarket : filteredMyBids

    return (
        <div className="space-y-8 pb-20">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                        <TrendingDown className="text-blue-600" size={32} />
                        Sàn Đấu Thầu
                    </h1>
                    <p className="text-sm font-bold text-slate-400 mt-1 uppercase tracking-widest">
                        Tìm kiếm cơ hội và cung cấp vật tư cho SmartBuild
                    </p>
                </div>
            </div>

            {/* Smart Metrics (Replaced Faker Info with Real Stats) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex flex-col justify-between">
                    <div className="flex justify-between items-center mb-4">
                        <div className="p-3 rounded-2xl bg-emerald-50 text-emerald-600">
                            <DollarSign size={20} />
                        </div>
                    </div>
                    <div>
                        <div className="text-2xl font-black text-slate-900">{formatCurrency(stats.totalValue)}</div>
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Tổng Thầu Đã Báo Giá</div>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex flex-col justify-between">
                    <div className="flex justify-between items-center mb-4">
                        <div className="p-3 rounded-2xl bg-blue-50 text-blue-600">
                            <Clock size={20} />
                        </div>
                    </div>
                    <div>
                        <div className="text-2xl font-black text-slate-900">{stats.pending}</div>
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Gói Thầu Đang Xét Duyệt</div>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex flex-col justify-between">
                    <div className="flex justify-between items-center mb-4">
                        <div className="p-3 rounded-2xl bg-amber-50 text-amber-600">
                            <CheckCircle2 size={20} />
                        </div>
                    </div>
                    <div>
                        <div className="text-2xl font-black text-slate-900">{stats.won}</div>
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Thầu Đã Trúng</div>
                    </div>
                </div>
            </div>

            {/* Tabs & Search */}
            <div className="flex flex-col lg:flex-row gap-4 items-center justify-between bg-white p-2 rounded-[2rem] border border-slate-200 shadow-sm">
                <div className="flex w-full lg:w-auto p-1 bg-slate-50 rounded-[1.5rem]">
                    <button 
                        onClick={() => setActiveTab('MARKET')}
                        className={`flex-1 lg:flex-none px-8 py-3.5 rounded-[1.2rem] text-xs font-black uppercase tracking-widest transition-all ${
                            activeTab === 'MARKET' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'
                        }`}
                    >
                        Chợ Thầu Mở ({marketOps.length})
                    </button>
                    <button 
                        onClick={() => setActiveTab('MY_BIDS')}
                        className={`flex-1 lg:flex-none px-8 py-3.5 rounded-[1.2rem] text-xs font-black uppercase tracking-widest transition-all ${
                            activeTab === 'MY_BIDS' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'
                        }`}
                    >
                        Thầu Của Tôi ({myBidOps.length})
                    </button>
                </div>
                
                <div className="relative flex-1 w-full lg:max-w-md mr-1">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input
                        type="text"
                        placeholder="Tìm theo sản phẩm hoặc mã thầu..."
                        className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-transparent rounded-[1.5rem] focus:bg-white focus:border-blue-200 outline-none transition-all text-sm font-medium"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {/* Opportunities List */}
            {loading ? (
                <div className="py-20 text-center">
                    <div className="w-12 h-12 border-4 border-blue-600/20 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
                    <span className="text-xs font-black text-slate-400 uppercase tracking-widest italic">Đang tải dữ liệu...</span>
                </div>
            ) : currentList.length === 0 ? (
                <div className="py-20 text-center bg-white rounded-[3rem] border border-slate-100">
                    <Package size={48} className="text-slate-200 mx-auto mb-4" />
                    <h3 className="text-xl font-black text-slate-900 uppercase">Chưa có thông tin</h3>
                    <p className="text-sm text-slate-400 font-medium italic mt-2">
                        {activeTab === 'MARKET' ? 'Hiện tại hệ thống chưa phát sinh nhu cầu mua sắm mới.' : 'Bạn chưa nộp bất kỳ báo giá nào.'}
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                    {currentList.map((op) => {
                        const myBid = op.bids?.find(b => b.supplierId === supplierId)
                        const isClosingSoon = new Date(op.deadline!) < new Date(Date.now() + 2 * 24 * 60 * 60 * 1000)

                        return (
                            <div key={op.id} className="bg-white rounded-[2.5rem] p-7 border border-slate-100 shadow-sm hover:shadow-xl transition-all group flex flex-col">
                                {/* Badges */}
                                <div className="flex justify-between items-start mb-5">
                                    <span className="px-3 py-1.5 bg-slate-100 text-slate-500 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5">
                                        <FileText size={12} />
                                        {op.requestNumber}
                                    </span>
                                    {activeTab === 'MY_BIDS' && myBid ? (
                                        <div className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 ${
                                            myBid.status === 'ACCEPTED' ? 'bg-emerald-50 text-emerald-600' :
                                            myBid.status === 'REJECTED' ? 'bg-rose-50 text-rose-600' :
                                            'bg-amber-50 text-amber-600'
                                        }`}>
                                            {myBid.status === 'ACCEPTED' && <CheckCircle size={14} />}
                                            {myBid.status === 'REJECTED' && <AlertCircle size={14} />}
                                            {myBid.status === 'PENDING' && <Clock size={14} />}
                                            {myBid.status === 'ACCEPTED' ? 'Đã Trúng Thầu' : myBid.status === 'REJECTED' ? 'Rớt Thầu' : 'Đang Xét Duyệt'}
                                        </div>
                                    ) : (
                                        <div className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${
                                            op.priority === 'URGENT' ? 'bg-rose-50 text-rose-600 animate-pulse' : 'bg-blue-50 text-blue-600'
                                        }`}>
                                            {op.priority === 'URGENT' ? '🚨 Cần gấp' : 'Tiêu chuẩn'}
                                        </div>
                                    )}
                                </div>

                                {/* Content */}
                                <div className="mb-6 flex-1">
                                    <h3 className="text-xl font-black text-slate-900 line-clamp-2 leading-tight mb-2">
                                        {op.product?.name || 'Sản phẩm chưa xác định'}
                                    </h3>
                                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-4">SKU: {op.product?.sku}</p>
                                    
                                    <div className="space-y-3 p-4 bg-slate-50/50 rounded-2xl border border-slate-100/50">
                                        <div className="flex items-start gap-3">
                                            <MapPin size={16} className="text-slate-400 shrink-0 mt-0.5" />
                                            <div>
                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Địa điểm giao hàng</p>
                                                <p className="text-sm font-bold text-slate-700 mt-1 line-clamp-1">{op.deliveryAddress}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-start gap-3">
                                            <Calendar size={16} className={`shrink-0 mt-0.5 ${isClosingSoon ? 'text-rose-500' : 'text-slate-400'}`} />
                                            <div>
                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Thời hạn chốt thầu</p>
                                                <p className={`text-sm font-bold mt-1 ${isClosingSoon ? 'text-rose-600' : 'text-slate-700'}`}>
                                                    {new Date(op.deadline!).toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric' })}
                                                    {isClosingSoon && activeTab === 'MARKET' && <span className="ml-2 text-[10px] bg-rose-100 text-rose-700 px-2 py-0.5 rounded-full">Sắp đóng</span>}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Bottom Stats & Action */}
                                <div className="pt-6 border-t border-slate-100 flex items-end justify-between gap-4 mt-auto">
                                    <div className="flex gap-6">
                                        <div>
                                            <span className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Số lượng (Cái)</span>
                                            <span className="text-2xl font-black text-slate-900">{new Intl.NumberFormat('vi-VN').format(op.requestedQty)}</span>
                                        </div>
                                        {activeTab === 'MARKET' ? (
                                            <div>
                                                <span className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Số báo giá</span>
                                                <span className="text-2xl font-black text-blue-600">{op.bids?.length || 0}</span>
                                            </div>
                                        ) : (
                                            <div>
                                                <span className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Giá nộp (VNĐ)</span>
                                                <span className="text-2xl font-black text-blue-600">{myBid ? formatCurrency(myBid.bidPrice) : 0}</span>
                                            </div>
                                        )}
                                    </div>

                                    {activeTab === 'MARKET' ? (
                                        <button
                                            onClick={() => setSelectedRequest(op)}
                                            className="h-12 px-6 bg-sky-500 text-white rounded-xl font-black text-[11px] uppercase tracking-widest hover:bg-sky-400 transition-all flex items-center gap-2 shadow-lg shadow-sky-200 shrink-0"
                                        >
                                            Tham gia
                                            <ArrowRight size={16} />
                                        </button>
                                    ) : (
                                        <button 
                                            // Disabled for clarity
                                            className="h-12 px-6 bg-slate-100 text-slate-500 rounded-xl font-black text-[11px] uppercase tracking-widest cursor-default shrink-0"
                                        >
                                            Đã nộp
                                        </button>
                                    )}
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}

            {/* Bid Modal */}
            {selectedRequest && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-white w-full max-w-lg rounded-[3rem] p-8 md:p-10 shadow-2xl animate-in zoom-in-95 duration-300 overflow-y-auto max-h-[95vh]">
                        <div className="flex justify-between items-start mb-8">
                            <div>
                                <h2 className="text-2xl font-black text-slate-900 tracking-tight leading-tight">Gửi báo giá thầu</h2>
                                <p className="text-xs font-bold text-slate-500 mt-2 line-clamp-1">{selectedRequest.product?.name}</p>
                                <p className="text-[10px] font-bold text-blue-600 uppercase tracking-widest mt-1">Cần giao: {new Intl.NumberFormat('vi-VN').format(selectedRequest.requestedQty)} đơn vị</p>
                            </div>
                            <button onClick={() => setSelectedRequest(null)} className="p-2 bg-slate-100 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-full transition-colors shrink-0">
                                <Filter className="rotate-45 w-5 h-5" />
                            </button>
                        </div>

                        <div className="p-4 bg-blue-50 border border-blue-100 rounded-2xl mb-6">
                            <p className="text-xs font-bold text-blue-800 leading-relaxed">
                                💡 Nhập Đơn giá tính cho <span className="font-black">1 đơn vị</span> sản phẩm. Tổng thầu sẽ được tự động tính toán cho {selectedRequest.requestedQty} cái.
                            </p>
                        </div>

                        <div className="space-y-6">
                            <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Đơn giá cung ứng (VNĐ)</label>
                                <div className="relative">
                                    <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                    <input
                                        type="number"
                                        className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-black text-lg focus:bg-white focus:ring-2 focus:ring-sky-500/20 focus:border-sky-400 outline-none transition-all"
                                        placeholder="0"
                                        value={bidPrice || ''}
                                        onChange={(e) => setBidPrice(Number(e.target.value))}
                                    />
                                </div>
                                <div className="mt-3 flex items-center justify-between p-3 bg-blue-500 text-white rounded-xl shadow-inner">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-blue-100">Tổng thu dự kiến</span>
                                    <span className="text-lg font-black text-white">{formatCurrency(bidPrice * selectedRequest.requestedQty)}</span>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="col-span-2 sm:col-span-1">
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Ngày giao (số ngày)</label>
                                    <div className="relative">
                                        <Clock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                        <input
                                            type="number"
                                            className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-black text-lg focus:bg-white focus:ring-2 focus:ring-sky-500/20 focus:border-sky-400 outline-none transition-all"
                                            value={deliveryDays}
                                            onChange={(e) => setDeliveryDays(Number(e.target.value))}
                                        />
                                    </div>
                                </div>
                                <div className="col-span-2 sm:col-span-1 flex items-end">
                                    <p className="text-[10px] font-bold text-slate-400 leading-tight italic pb-2">
                                        * Giao hàng nhanh tăng tỷ lệ trúng thầu thêm 30%.
                                    </p>
                                </div>
                            </div>

                            <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Yêu cầu tiêu chuẩn & Ghi chú (Tùy chọn)</label>
                                <textarea
                                    className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl font-medium text-sm focus:bg-white focus:ring-2 focus:ring-sky-500/20 focus:border-sky-400 outline-none transition-all h-24 resize-none"
                                    placeholder="Cam kết chất lượng vật tư, hỗ trợ vận chuyển..."
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="flex gap-4 mt-8 pt-6 border-t border-slate-100">
                            <button
                                onClick={() => setSelectedRequest(null)}
                                className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-2xl font-black text-[11px] uppercase tracking-widest hover:bg-slate-200 transition-all"
                            >
                                Hủy bỏ
                            </button>
                            <button
                                onClick={handleSubmitBid}
                                disabled={submitting || bidPrice <= 0}
                                className="flex-[2] py-4 bg-sky-500 text-white rounded-2xl font-black text-[11px] uppercase tracking-widest hover:bg-sky-400 shadow-xl shadow-sky-200 transition-all disabled:opacity-50 disabled:shadow-none"
                            >
                                {submitting ? 'Đang nộp...' : 'Nộp Báo Giá'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
