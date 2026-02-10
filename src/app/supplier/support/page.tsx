'use client'

import { useState, useEffect, useCallback } from 'react'
import {
    LifeBuoy, Send, MessageCircle, Clock, AlertCircle, CheckCircle2,
    Plus, ArrowLeft, Search, Filter, Package, CreditCard, Database,
    Upload, FileText, Loader2, ChevronRight, RefreshCw, Star, X
} from 'lucide-react'
import toast from 'react-hot-toast'

interface SupplierTicket {
    id: string
    reason: string
    description: string
    category?: string
    orderId?: string
    status: string
    priority?: string
    comments?: TicketComment[]
    evidenceUrls?: string[]
    createdAt: string
    updatedAt?: string
}

interface TicketComment {
    id: string
    senderId?: string
    senderType: string
    senderName?: string
    content: string
    createdAt: string
}

const CATEGORIES: Record<string, { label: string; icon: React.ElementType; description: string }> = {
    INVENTORY_SYNC: { label: 'Đồng bộ tồn kho', icon: Database, description: 'Số liệu tồn kho sai lệch với thực tế' },
    PRODUCT_UPLOAD: { label: 'Lỗi upload sản phẩm', icon: Upload, description: 'Không thể tải lên/chỉnh sửa sản phẩm' },
    PAYMENT_MISMATCH: { label: 'Sai lệch đối soát', icon: CreditCard, description: 'Số tiền nhận về không khớp với báo cáo' },
    PURCHASE_ORDER: { label: 'Vấn đề đơn mua (PO)', icon: Package, description: 'Nhầm lẫn về PO, số lượng, đơn giá' },
    RETURN_ISSUE: { label: 'Trả hàng / Khiếu nại', icon: RefreshCw, description: 'Vấn đề về quy trình trả hàng từ cửa hàng' },
    GENERAL: { label: 'Vấn đề khác', icon: LifeBuoy, description: 'Thắc mắc chung hoặc góp ý cải thiện' },
}

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
    OPEN: { label: 'Mới gửi', color: 'bg-blue-100 text-blue-700 border-blue-200' },
    IN_PROGRESS: { label: 'Đang xử lý', color: 'bg-amber-100 text-amber-700 border-amber-200' },
    WAITING: { label: 'Chờ NCC phản hồi', color: 'bg-purple-100 text-purple-700 border-purple-200' },
    RESOLVED: { label: 'Đã giải quyết', color: 'bg-green-100 text-green-700 border-green-200' },
    CLOSED: { label: 'Đã đóng', color: 'bg-slate-100 text-slate-600 border-slate-200' },
}

const PRIORITY_CONFIG: Record<string, { label: string; color: string }> = {
    LOW: { label: 'Thấp', color: 'bg-slate-100 text-slate-600' },
    MEDIUM: { label: 'Trung bình', color: 'bg-blue-100 text-blue-600' },
    HIGH: { label: 'Cao', color: 'bg-orange-100 text-orange-700' },
    URGENT: { label: 'Khẩn cấp', color: 'bg-red-100 text-red-700' },
}

export default function SupplierSupportUpgraded() {
    const [tickets, setTickets] = useState<SupplierTicket[]>([])
    const [loading, setLoading] = useState(true)
    const [showNewModal, setShowNewModal] = useState(false)
    const [selectedTicket, setSelectedTicket] = useState<SupplierTicket | null>(null)
    const [newComment, setNewComment] = useState('')
    const [sending, setSending] = useState(false)
    const [statusFilter, setStatusFilter] = useState('')
    const [search, setSearch] = useState('')

    // Create form
    const [formData, setFormData] = useState({
        reason: '',
        description: '',
        category: '',
        orderId: '',
        priority: 'MEDIUM'
    })

    const fetchTickets = useCallback(async () => {
        try {
            setLoading(true)
            const supplierId = localStorage.getItem('supplier_id')
            const params = new URLSearchParams()
            if (supplierId) params.set('supplierId', supplierId)
            if (statusFilter) params.set('status', statusFilter)
            const res = await fetch(`/api/supplier/support?${params}`)
            const data = await res.json()
            if (data.success) setTickets(data.data || [])
        } catch (error) {
            console.error('Fetch tickets failed')
        } finally {
            setLoading(false)
        }
    }, [statusFilter])

    const fetchTicketDetails = async (id: string) => {
        try {
            const supplierId = localStorage.getItem('supplier_id')
            const res = await fetch(`/api/supplier/support/${id}?supplierId=${supplierId}`)
            const data = await res.json()
            if (data.success) {
                setSelectedTicket(data.data)
            }
        } catch (error) {
            console.error('Fetch ticket details failed')
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        try {
            const supplierId = localStorage.getItem('supplier_id')
            const res = await fetch('/api/supplier/support', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...formData, supplierId })
            })
            const data = await res.json()
            if (data.success) {
                toast.success('Đã gửi yêu cầu hỗ trợ!')
                setShowNewModal(false)
                setFormData({ reason: '', description: '', category: '', orderId: '', priority: 'MEDIUM' })
                fetchTickets()
            }
        } catch (error) {
            toast.error('Lỗi khi gửi yêu cầu')
        }
    }

    const sendComment = async () => {
        if (!selectedTicket || !newComment.trim()) return
        setSending(true)
        try {
            const supplierId = localStorage.getItem('supplier_id')
            const res = await fetch(`/api/supplier/support/${selectedTicket.id}/comment`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ content: newComment, supplierId })
            })
            const data = await res.json()
            if (data.success) {
                toast.success('Đã gửi phản hồi')
                setNewComment('')
                fetchTicketDetails(selectedTicket.id)
            }
        } catch (error) {
            toast.error('Không thể gửi phản hồi')
        } finally {
            setSending(false)
        }
    }

    useEffect(() => { fetchTickets() }, [fetchTickets])

    const formatRelative = (dateStr: string) => {
        const diff = Date.now() - new Date(dateStr).getTime()
        const mins = Math.floor(diff / 60000)
        if (mins < 60) return `${mins} phút trước`
        const hours = Math.floor(mins / 60)
        if (hours < 24) return `${hours} giờ trước`
        const days = Math.floor(hours / 24)
        return `${days} ngày trước`
    }

    const filteredTickets = tickets.filter(t => {
        if (search) {
            const q = search.toLowerCase()
            if (!t.reason.toLowerCase().includes(q) && !t.description?.toLowerCase().includes(q)) return false
        }
        return true
    })

    // Detail view
    if (selectedTicket) {
        const statusCfg = STATUS_CONFIG[selectedTicket.status] || STATUS_CONFIG.OPEN
        const categoryCfg = CATEGORIES[selectedTicket.category || 'GENERAL'] || CATEGORIES.GENERAL
        const CategoryIcon = categoryCfg.icon

        return (
            <div className="space-y-6 pb-20">
                <button
                    onClick={() => setSelectedTicket(null)}
                    className="flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-slate-900 transition-colors"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Quay lại danh sách
                </button>

                {/* Ticket Header */}
                <div className="bg-white rounded-3xl border border-slate-200 p-6 md:p-8 shadow-sm">
                    <div className="flex items-start justify-between mb-4">
                        <div>
                            <div className="flex items-center gap-3 mb-2">
                                <span className={`text-xs font-bold px-3 py-1 rounded-lg border ${statusCfg.color}`}>
                                    {statusCfg.label}
                                </span>
                                {selectedTicket.priority && (
                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${PRIORITY_CONFIG[selectedTicket.priority]?.color}`}>
                                        {PRIORITY_CONFIG[selectedTicket.priority]?.label}
                                    </span>
                                )}
                            </div>
                            <h2 className="text-xl font-black text-slate-900 mb-1">{selectedTicket.reason}</h2>
                            <div className="flex items-center gap-3 text-xs text-slate-400">
                                <span className="flex items-center gap-1">
                                    <CategoryIcon className="w-3.5 h-3.5" />
                                    {categoryCfg.label}
                                </span>
                                <span className="flex items-center gap-1">
                                    <Clock className="w-3.5 h-3.5" />
                                    {formatRelative(selectedTicket.createdAt)}
                                </span>
                                {selectedTicket.orderId && (
                                    <span className="flex items-center gap-1 text-blue-600 font-bold">
                                        <Package className="w-3.5 h-3.5" />
                                        PO: {selectedTicket.orderId}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="mt-4 p-4 bg-slate-50 rounded-xl">
                        <p className="text-sm text-slate-700 whitespace-pre-wrap">{selectedTicket.description}</p>
                    </div>
                </div>

                {/* Conversation */}
                <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="p-4 border-b border-slate-100">
                        <h3 className="font-bold text-slate-700 flex items-center gap-2">
                            <MessageCircle className="w-4 h-4" />
                            Trao đổi ({selectedTicket.comments?.length || 0})
                        </h3>
                    </div>

                    <div className="max-h-[400px] overflow-y-auto p-4 space-y-3 bg-slate-50/50">
                        {selectedTicket.comments?.map((comment) => (
                            <div
                                key={comment.id}
                                className={`flex ${comment.senderType === 'SUPPLIER' ? 'justify-end' : 'justify-start'}`}
                            >
                                <div className={`max-w-[75%] rounded-2xl p-4 ${comment.senderType === 'SUPPLIER'
                                    ? 'bg-blue-600 text-white rounded-br-md'
                                    : 'bg-white border border-slate-200 rounded-bl-md shadow-sm'
                                    }`}>
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className={`text-xs font-bold ${comment.senderType === 'SUPPLIER' ? 'text-blue-200' : 'text-slate-400'}`}>
                                            {comment.senderName || (comment.senderType === 'SUPPLIER' ? 'Bạn' : 'Admin')}
                                        </span>
                                        <span className={`text-[10px] ${comment.senderType === 'SUPPLIER' ? 'text-blue-300' : 'text-slate-300'}`}>
                                            {formatRelative(comment.createdAt)}
                                        </span>
                                    </div>
                                    <p className={`text-sm whitespace-pre-wrap ${comment.senderType === 'SUPPLIER' ? 'text-white' : 'text-slate-700'}`}>
                                        {comment.content}
                                    </p>
                                </div>
                            </div>
                        ))}

                        {(!selectedTicket.comments || selectedTicket.comments.length === 0) && (
                            <div className="text-center py-8 text-slate-400">
                                <MessageCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
                                <p className="text-sm">Chưa có trao đổi</p>
                            </div>
                        )}
                    </div>

                    {/* Reply */}
                    {selectedTicket.status !== 'CLOSED' && (
                        <div className="p-4 border-t border-slate-100 bg-white">
                            <div className="flex gap-3">
                                <input
                                    type="text"
                                    placeholder="Nhập phản hồi cho Admin..."
                                    value={newComment}
                                    onChange={(e) => setNewComment(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && sendComment()}
                                    className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                                />
                                <button
                                    onClick={sendComment}
                                    disabled={sending || !newComment.trim()}
                                    className="px-5 py-3 bg-blue-600 text-white rounded-xl font-bold text-sm flex items-center gap-2 hover:bg-blue-700 disabled:opacity-50 transition-colors"
                                >
                                    <Send className="w-4 h-4" />
                                    {sending ? '...' : 'Gửi'}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        )
    }

    // List view
    return (
        <div className="space-y-8 pb-20">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                        <div className="p-2.5 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl shadow-lg shadow-blue-200">
                            <LifeBuoy className="w-6 h-6 text-white" />
                        </div>
                        Trung tâm Hỗ trợ NCC
                    </h1>
                    <p className="text-slate-500 font-medium mt-1">Gửi yêu cầu hoặc khiếu nại trực tiếp tới SmartBuild</p>
                </div>
                <button
                    onClick={() => setShowNewModal(true)}
                    className="group bg-blue-600 text-white px-6 py-3 rounded-2xl hover:bg-blue-700 flex items-center gap-3 transition-all shadow-xl shadow-blue-200 active:scale-95"
                >
                    <Plus className="w-5 h-5" />
                    <span className="font-bold text-sm">Mở yêu cầu mới</span>
                </button>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                    { label: 'Tổng yêu cầu', value: tickets.length, color: 'text-slate-700' },
                    { label: 'Đang xử lý', value: tickets.filter(t => ['OPEN', 'IN_PROGRESS'].includes(t.status)).length, color: 'text-amber-600' },
                    { label: 'Chờ phản hồi', value: tickets.filter(t => t.status === 'WAITING').length, color: 'text-purple-600' },
                    { label: 'Đã xử lý', value: tickets.filter(t => ['RESOLVED', 'CLOSED'].includes(t.status)).length, color: 'text-green-600' },
                ].map((stat, i) => (
                    <div key={i} className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{stat.label}</p>
                        <p className={`text-2xl font-black ${stat.color}`}>{stat.value}</p>
                    </div>
                ))}
            </div>

            {/* Filters */}
            <div className="bg-white rounded-2xl border border-slate-100 p-3 shadow-sm flex items-center gap-3 overflow-x-auto">
                <Filter className="w-4 h-4 text-slate-400 flex-shrink-0" />
                <button
                    onClick={() => setStatusFilter('')}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors whitespace-nowrap ${!statusFilter ? 'bg-blue-600 text-white' : 'text-slate-500 hover:bg-slate-100'}`}
                >
                    Tất cả
                </button>
                {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
                    <button
                        key={key}
                        onClick={() => setStatusFilter(key)}
                        className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors whitespace-nowrap ${statusFilter === key ? 'bg-blue-600 text-white' : 'text-slate-500 hover:bg-slate-100'}`}
                    >
                        {cfg.label}
                    </button>
                ))}
            </div>

            {/* Search */}
            <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                    type="text"
                    placeholder="Tìm kiếm yêu cầu..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 shadow-sm"
                />
            </div>

            {/* Tickets Grid */}
            {loading ? (
                <div className="flex items-center justify-center py-20">
                    <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                </div>
            ) : filteredTickets.length === 0 ? (
                <div className="col-span-full py-24 flex flex-col items-center justify-center bg-slate-50/50 rounded-3xl border-4 border-dashed border-slate-100">
                    <div className="w-20 h-20 bg-white rounded-3xl shadow-xl flex items-center justify-center text-slate-200 mb-6">
                        <LifeBuoy className="w-10 h-10" />
                    </div>
                    <p className="text-lg font-black text-slate-300 uppercase tracking-widest">Không có yêu cầu nào</p>
                    <p className="text-sm text-slate-400 mt-2">Gửi yêu cầu mới khi gặp vấn đề cần hỗ trợ</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {filteredTickets.map((t) => {
                        const statusCfg = STATUS_CONFIG[t.status] || STATUS_CONFIG.OPEN
                        const categoryCfg = CATEGORIES[t.category || 'GENERAL'] || CATEGORIES.GENERAL
                        const CategoryIcon = categoryCfg.icon

                        return (
                            <button
                                key={t.id}
                                onClick={() => {
                                    setSelectedTicket(t)
                                    fetchTicketDetails(t.id)
                                }}
                                className="w-full bg-white rounded-2xl border border-slate-100 p-5 text-left hover:shadow-md hover:border-blue-200 transition-all group"
                            >
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex items-start gap-4 flex-1 min-w-0">
                                        <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:bg-blue-50 transition-colors">
                                            <CategoryIcon className="w-5 h-5 text-slate-400 group-hover:text-blue-600 transition-colors" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${statusCfg.color}`}>
                                                    {statusCfg.label}
                                                </span>
                                                {t.priority && (
                                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${PRIORITY_CONFIG[t.priority]?.color}`}>
                                                        {PRIORITY_CONFIG[t.priority]?.label}
                                                    </span>
                                                )}
                                                <span className="text-[10px] text-slate-400">{categoryCfg.label}</span>
                                            </div>
                                            <h3 className="font-bold text-slate-900 truncate group-hover:text-blue-600 transition-colors">
                                                {t.reason}
                                            </h3>
                                            <p className="text-xs text-slate-400 truncate mt-0.5">{t.description}</p>
                                            <div className="flex items-center gap-3 mt-2 text-[10px] text-slate-400">
                                                <span className="flex items-center gap-1">
                                                    <Clock className="w-3 h-3" />
                                                    {formatRelative(t.createdAt)}
                                                </span>
                                                {t.orderId && (
                                                    <span className="flex items-center gap-1 text-blue-500 font-bold">
                                                        <Package className="w-3 h-3" />
                                                        PO: {t.orderId}
                                                    </span>
                                                )}
                                                <span className="flex items-center gap-1">
                                                    <MessageCircle className="w-3 h-3" />
                                                    {t.comments?.length || 0} phản hồi
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-blue-500 transition-colors flex-shrink-0 mt-2" />
                                </div>
                            </button>
                        )
                    })}
                </div>
            )}

            {/* Create Ticket Modal */}
            {showNewModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setShowNewModal(false)} />
                    <div className="relative bg-white rounded-3xl w-full max-w-xl max-h-[95vh] md:max-h-[90vh] flex flex-col overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
                        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-5 md:p-6 text-white flex justify-between items-start flex-shrink-0">
                            <div>
                                <h2 className="text-xl font-black flex items-center gap-3">
                                    <Plus className="w-6 h-6" />
                                    Tạo yêu cầu hỗ trợ
                                </h2>
                                <p className="text-blue-200 text-sm mt-1">Chọn danh mục phù hợp để được hỗ trợ nhanh nhất</p>
                            </div>
                            <button onClick={() => setShowNewModal(false)} className="p-1 hover:bg-white/20 rounded-lg">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
                            <div className="p-5 md:p-6 space-y-6 overflow-y-auto flex-1 custom-scrollbar">
                                {/* Category Selection */}
                                <div>
                                    <label className="block text-xs font-black text-slate-500 uppercase tracking-wider mb-3">Danh mục vấn đề *</label>
                                    <div className="grid grid-cols-2 gap-3">
                                        {Object.entries(CATEGORIES).map(([key, cfg]) => {
                                            const Icon = cfg.icon
                                            return (
                                                <button
                                                    key={key}
                                                    type="button"
                                                    onClick={() => setFormData(prev => ({ ...prev, category: key }))}
                                                    className={`p-3 rounded-xl border text-left transition-all ${formData.category === key
                                                        ? 'border-blue-500 bg-blue-50/50 ring-2 ring-blue-500/10'
                                                        : 'border-slate-200 hover:border-slate-300 bg-slate-50/30'
                                                        }`}
                                                >
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <Icon className={`w-4 h-4 ${formData.category === key ? 'text-blue-600' : 'text-slate-400'}`} />
                                                        <span className={`text-xs font-bold ${formData.category === key ? 'text-blue-700' : 'text-slate-700'}`}>
                                                            {cfg.label}
                                                        </span>
                                                    </div>
                                                    <p className="text-[10px] text-slate-400 line-clamp-1">{cfg.description}</p>
                                                </button>
                                            )
                                        })}
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-black text-slate-500 uppercase tracking-wider mb-2">Tiêu đề *</label>
                                    <input
                                        required
                                        type="text"
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
                                        placeholder="Ví dụ: Sai lệch thanh toán PO-123"
                                        value={formData.reason}
                                        onChange={(e) => setFormData(prev => ({ ...prev, reason: e.target.value }))}
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-black text-slate-500 uppercase tracking-wider mb-2">Mã PO (nếu có)</label>
                                        <input
                                            type="text"
                                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                                            placeholder="PO-XXXXX"
                                            value={formData.orderId}
                                            onChange={(e) => setFormData(prev => ({ ...prev, orderId: e.target.value }))}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-black text-slate-500 uppercase tracking-wider mb-2">Mức độ</label>
                                        <select
                                            value={formData.priority}
                                            onChange={(e) => setFormData(prev => ({ ...prev, priority: e.target.value }))}
                                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                                        >
                                            {Object.entries(PRIORITY_CONFIG).map(([key, cfg]) => (
                                                <option key={key} value={key}>{cfg.label}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-black text-slate-500 uppercase tracking-wider mb-2">Mô tả chi tiết *</label>
                                    <textarea
                                        required
                                        rows={4}
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                                        placeholder="Mô tả cụ thể vấn đề bạn đang gặp..."
                                        value={formData.description}
                                        onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                                    />
                                </div>
                            </div>

                            <div className="p-5 md:p-6 bg-slate-50/50 border-t border-slate-100 flex gap-4 flex-shrink-0">
                                <button
                                    type="button"
                                    onClick={() => setShowNewModal(false)}
                                    className="flex-1 px-4 py-3 border border-slate-200 rounded-xl font-bold text-slate-500 text-sm hover:bg-white hover:text-slate-700 transition-all shadow-sm"
                                >
                                    Hủy bỏ
                                </button>
                                <button
                                    type="submit"
                                    className="flex-[1.5] px-4 py-3 bg-blue-600 text-white rounded-xl font-bold text-sm hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 flex items-center justify-center gap-2 active:scale-95"
                                >
                                    <Send className="w-4 h-4" />
                                    Gửi yêu cầu ngay
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}
