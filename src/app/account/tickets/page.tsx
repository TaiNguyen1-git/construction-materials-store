'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
    Ticket,
    Search,
    Plus,
    Clock,
    CheckCircle,
    XCircle,
    AlertCircle,
    RefreshCw,
    Send,
    Star,
    ArrowLeft,
    MessageCircle,
    Package,
    ShieldAlert,
    CreditCard,
    Truck,
    HelpCircle,
    Wrench,
    ChevronRight,
    Loader2,
    Filter
} from 'lucide-react'
import toast from 'react-hot-toast'
import { fetchWithAuth } from '@/lib/api-client'

interface SupportTicket {
    id: string
    ticketNumber: string
    subject: string
    description: string
    category: string
    priority: string
    status: string
    orderId?: string
    slaDeadline?: string
    firstResponseAt?: string
    resolution?: string
    customerRating?: number
    customerFeedback?: string
    tags: string[]
    createdAt: string
    updatedAt: string
    messages?: TicketMessage[]
}

interface TicketMessage {
    id: string
    ticketId: string
    senderId?: string
    senderType: string
    senderName?: string
    content: string
    attachments: string[]
    isInternal: boolean
    createdAt: string
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bgColor: string; icon: React.ElementType }> = {
    OPEN: { label: 'Mới gửi', color: 'text-blue-700', bgColor: 'bg-blue-50 border-blue-200', icon: AlertCircle },
    IN_PROGRESS: { label: 'Đang xử lý', color: 'text-amber-700', bgColor: 'bg-amber-50 border-amber-200', icon: RefreshCw },
    WAITING_CUSTOMER: { label: 'Chờ phản hồi', color: 'text-purple-700', bgColor: 'bg-purple-50 border-purple-200', icon: Clock },
    WAITING_INTERNAL: { label: 'Đang kiểm tra', color: 'text-orange-700', bgColor: 'bg-orange-50 border-orange-200', icon: Clock },
    RESOLVED: { label: 'Đã giải quyết', color: 'text-green-700', bgColor: 'bg-green-50 border-green-200', icon: CheckCircle },
    CLOSED: { label: 'Đã đóng', color: 'text-slate-600', bgColor: 'bg-slate-50 border-slate-200', icon: XCircle },
    REOPENED: { label: 'Mở lại', color: 'text-red-700', bgColor: 'bg-red-50 border-red-200', icon: AlertCircle }
}

const PRIORITY_CONFIG: Record<string, { label: string; color: string }> = {
    LOW: { label: 'Thấp', color: 'bg-slate-100 text-slate-600' },
    MEDIUM: { label: 'Trung bình', color: 'bg-blue-100 text-blue-600' },
    HIGH: { label: 'Cao', color: 'bg-orange-100 text-orange-700' },
    URGENT: { label: 'Khẩn cấp', color: 'bg-red-100 text-red-700' }
}

const CATEGORY_CONFIG: Record<string, { label: string; icon: React.ElementType }> = {
    GENERAL: { label: 'Hỏi đáp chung', icon: HelpCircle },
    ORDER: { label: 'Đơn hàng', icon: Package },
    SHIPPING: { label: 'Vận chuyển', icon: Truck },
    RETURN_REFUND: { label: 'Đổi trả / Hoàn tiền', icon: RefreshCw },
    PRODUCT: { label: 'Sản phẩm', icon: Package },
    PAYMENT: { label: 'Thanh toán', icon: CreditCard },
    TECHNICAL: { label: 'Kỹ thuật', icon: Wrench },
    COMPLAINT: { label: 'Khiếu nại', icon: ShieldAlert },
    WARRANTY: { label: 'Bảo hành', icon: ShieldAlert }
}

export default function AccountTicketsPage() {
    const router = useRouter()
    const [tickets, setTickets] = useState<SupportTicket[]>([])
    const [loading, setLoading] = useState(true)
    const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null)
    const [messages, setMessages] = useState<TicketMessage[]>([])
    const [newMessage, setNewMessage] = useState('')
    const [sending, setSending] = useState(false)
    const [statusFilter, setStatusFilter] = useState('')
    const [showCreateModal, setShowCreateModal] = useState(false)
    const [creating, setCreating] = useState(false)

    // Rating state
    const [showRating, setShowRating] = useState(false)
    const [ratingValue, setRatingValue] = useState(0)
    const [ratingFeedback, setRatingFeedback] = useState('')
    const [ratingHover, setRatingHover] = useState(0)

    // Create form
    const [createForm, setCreateForm] = useState({
        subject: '',
        description: '',
        category: 'GENERAL',
        priority: 'MEDIUM',
        orderId: ''
    })

    const fetchTickets = useCallback(async () => {
        try {
            setLoading(true)
            const params = new URLSearchParams()
            if (statusFilter) params.set('status', statusFilter)
            const res = await fetchWithAuth(`/api/account/tickets?${params}`)
            if (res.ok) {
                const data = await res.json()
                setTickets(data.tickets || [])
            }
        } catch (error) {
            console.error('Error fetching tickets:', error)
            toast.error('Không thể tải danh sách yêu cầu')
        } finally {
            setLoading(false)
        }
    }, [statusFilter])

    const fetchTicketDetails = async (ticketId: string) => {
        try {
            const res = await fetchWithAuth(`/api/account/tickets/${ticketId}`)
            if (res.ok) {
                const data = await res.json()
                setSelectedTicket(data.ticket)
                setMessages(data.ticket.messages || [])
            }
        } catch (error) {
            console.error('Error fetching ticket:', error)
        }
    }

    const handleCreateTicket = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!createForm.subject.trim() || !createForm.description.trim()) return

        setCreating(true)
        try {
            const res = await fetchWithAuth('/api/account/tickets', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(createForm)
            })

            if (res.ok) {
                toast.success('Đã gửi yêu cầu hỗ trợ thành công!')
                setShowCreateModal(false)
                setCreateForm({ subject: '', description: '', category: 'GENERAL', priority: 'MEDIUM', orderId: '' })
                fetchTickets()
            } else {
                toast.error('Không thể gửi yêu cầu')
            }
        } catch (error) {
            toast.error('Lỗi kết nối')
        } finally {
            setCreating(false)
        }
    }

    const sendMessage = async () => {
        if (!selectedTicket || !newMessage.trim()) return

        setSending(true)
        try {
            const res = await fetchWithAuth(`/api/account/tickets/${selectedTicket.id}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ content: newMessage })
            })

            if (res.ok) {
                const data = await res.json()
                setMessages(prev => [...prev, data.message])
                setNewMessage('')
                toast.success('Đã gửi tin nhắn')
                fetchTickets()
            }
        } catch (error) {
            toast.error('Không thể gửi tin nhắn')
        } finally {
            setSending(false)
        }
    }

    const submitRating = async () => {
        if (!selectedTicket || ratingValue === 0) return

        try {
            const res = await fetchWithAuth(`/api/account/tickets/${selectedTicket.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ rating: ratingValue, feedback: ratingFeedback })
            })

            if (res.ok) {
                toast.success('Cảm ơn bạn đã đánh giá!')
                setShowRating(false)
                setRatingValue(0)
                setRatingFeedback('')
                fetchTicketDetails(selectedTicket.id)
            }
        } catch (error) {
            toast.error('Không thể gửi đánh giá')
        }
    }

    useEffect(() => {
        fetchTickets()
    }, [fetchTickets])

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('vi-VN', {
            day: '2-digit', month: '2-digit', year: 'numeric',
            hour: '2-digit', minute: '2-digit'
        })
    }

    const formatRelative = (dateStr: string) => {
        const diff = Date.now() - new Date(dateStr).getTime()
        const mins = Math.floor(diff / 60000)
        if (mins < 60) return `${mins} phút trước`
        const hours = Math.floor(mins / 60)
        if (hours < 24) return `${hours} giờ trước`
        const days = Math.floor(hours / 24)
        return `${days} ngày trước`
    }

    // Detail view
    if (selectedTicket) {
        const statusCfg = STATUS_CONFIG[selectedTicket.status] || STATUS_CONFIG.OPEN
        const StatusIcon = statusCfg.icon
        const categoryCfg = CATEGORY_CONFIG[selectedTicket.category] || CATEGORY_CONFIG.GENERAL
        const CategoryIcon = categoryCfg.icon
        const canRate = (selectedTicket.status === 'RESOLVED' || selectedTicket.status === 'CLOSED') && !selectedTicket.customerRating

        return (
            <div className="max-w-4xl mx-auto space-y-6">
                {/* Back button */}
                <button
                    onClick={() => { setSelectedTicket(null); setMessages([]) }}
                    className="flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-slate-900 transition-colors"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Quay lại danh sách
                </button>

                {/* Ticket Header Card */}
                <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="p-6 md:p-8">
                        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-4">
                            <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                    <span className="text-xs font-black text-indigo-600 bg-indigo-50 px-3 py-1 rounded-lg">
                                        {selectedTicket.ticketNumber}
                                    </span>
                                    <span className={`text-xs font-bold px-3 py-1 rounded-lg border ${statusCfg.bgColor} ${statusCfg.color}`}>
                                        <StatusIcon className="w-3 h-3 inline mr-1" />
                                        {statusCfg.label}
                                    </span>
                                </div>
                                <h1 className="text-xl md:text-2xl font-black text-slate-900 mb-2">
                                    {selectedTicket.subject}
                                </h1>
                                <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500">
                                    <span className="flex items-center gap-1">
                                        <CategoryIcon className="w-3.5 h-3.5" />
                                        {categoryCfg.label}
                                    </span>
                                    <span className="flex items-center gap-1">
                                        <Clock className="w-3.5 h-3.5" />
                                        {formatDate(selectedTicket.createdAt)}
                                    </span>
                                    {selectedTicket.orderId && (
                                        <button
                                            onClick={() => router.push(`/account/orders/${selectedTicket.orderId}`)}
                                            className="flex items-center gap-1 text-blue-600 hover:underline font-bold"
                                        >
                                            <Package className="w-3.5 h-3.5" />
                                            Xem đơn hàng
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* Rating section */}
                            {canRate && !showRating && (
                                <button
                                    onClick={() => setShowRating(true)}
                                    className="px-5 py-2.5 bg-amber-50 text-amber-700 border border-amber-200 rounded-xl font-bold text-sm hover:bg-amber-100 transition-colors flex items-center gap-2"
                                >
                                    <Star className="w-4 h-4" />
                                    Đánh giá hỗ trợ
                                </button>
                            )}

                            {selectedTicket.customerRating && (
                                <div className="flex items-center gap-1 px-4 py-2 bg-amber-50 rounded-xl border border-amber-100">
                                    {Array.from({ length: 5 }).map((_, i) => (
                                        <Star key={i} className={`w-4 h-4 ${i < selectedTicket.customerRating! ? 'text-amber-500 fill-amber-500' : 'text-slate-200'}`} />
                                    ))}
                                    <span className="text-xs font-bold text-amber-700 ml-2">{selectedTicket.customerRating}/5</span>
                                </div>
                            )}
                        </div>

                        {/* Rating form */}
                        {showRating && (
                            <div className="mt-4 p-5 bg-amber-50/50 rounded-2xl border border-amber-100">
                                <p className="text-sm font-bold text-slate-700 mb-3">Bạn đánh giá chất lượng hỗ trợ thế nào?</p>
                                <div className="flex items-center gap-2 mb-4">
                                    {Array.from({ length: 5 }).map((_, i) => (
                                        <button
                                            key={i}
                                            onMouseEnter={() => setRatingHover(i + 1)}
                                            onMouseLeave={() => setRatingHover(0)}
                                            onClick={() => setRatingValue(i + 1)}
                                            className="transition-transform hover:scale-125"
                                        >
                                            <Star className={`w-8 h-8 ${(ratingHover || ratingValue) > i ? 'text-amber-500 fill-amber-500' : 'text-slate-200'}`} />
                                        </button>
                                    ))}
                                    <span className="text-sm font-bold text-amber-700 ml-3">
                                        {ratingValue === 1 ? 'Rất tệ' : ratingValue === 2 ? 'Tệ' : ratingValue === 3 ? 'Bình thường' : ratingValue === 4 ? 'Tốt' : ratingValue === 5 ? 'Tuyệt vời!' : ''}
                                    </span>
                                </div>
                                <textarea
                                    rows={2}
                                    placeholder="Góp ý thêm (không bắt buộc)..."
                                    value={ratingFeedback}
                                    onChange={(e) => setRatingFeedback(e.target.value)}
                                    className="w-full p-3 bg-white border border-amber-200 rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                                />
                                <div className="flex gap-3 mt-3">
                                    <button onClick={() => setShowRating(false)} className="px-4 py-2 text-sm text-slate-500 hover:bg-slate-100 rounded-lg">Bỏ qua</button>
                                    <button onClick={submitRating} disabled={ratingValue === 0} className="px-5 py-2 bg-amber-500 text-white font-bold text-sm rounded-lg hover:bg-amber-600 disabled:opacity-50 transition-colors">Gửi đánh giá</button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Messages */}
                <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="p-4 md:p-6 border-b border-slate-100">
                        <h3 className="font-bold text-slate-700 flex items-center gap-2">
                            <MessageCircle className="w-4 h-4" />
                            Lịch sử trao đổi ({messages.length})
                        </h3>
                    </div>

                    <div className="max-h-[500px] overflow-y-auto p-4 md:p-6 space-y-4 bg-slate-50/50">
                        {messages.map((msg) => (
                            <div
                                key={msg.id}
                                className={`flex ${msg.senderType === 'CUSTOMER' ? 'justify-end' : 'justify-start'}`}
                            >
                                <div className={`max-w-[80%] md:max-w-[70%] ${msg.senderType === 'CUSTOMER'
                                        ? 'bg-indigo-600 text-white rounded-2xl rounded-br-md'
                                        : msg.senderType === 'SYSTEM'
                                            ? 'bg-slate-100 text-slate-600 rounded-2xl border border-slate-200'
                                            : 'bg-white border border-slate-200 rounded-2xl rounded-bl-md shadow-sm'
                                    } p-4`}>
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className={`text-xs font-bold ${msg.senderType === 'CUSTOMER' ? 'text-indigo-200' : 'text-slate-400'}`}>
                                            {msg.senderName || (msg.senderType === 'CUSTOMER' ? 'Bạn' : msg.senderType === 'SYSTEM' ? 'Hệ thống' : 'Nhân viên hỗ trợ')}
                                        </span>
                                        <span className={`text-[10px] ${msg.senderType === 'CUSTOMER' ? 'text-indigo-300' : 'text-slate-400'}`}>
                                            {formatRelative(msg.createdAt)}
                                        </span>
                                    </div>
                                    <p className={`text-sm whitespace-pre-wrap ${msg.senderType === 'CUSTOMER' ? 'text-white' : 'text-slate-700'}`}>
                                        {msg.content}
                                    </p>
                                </div>
                            </div>
                        ))}

                        {messages.length === 0 && (
                            <div className="text-center py-8 text-slate-400">
                                <MessageCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
                                <p className="text-sm">Chưa có tin nhắn</p>
                            </div>
                        )}
                    </div>

                    {/* Reply input */}
                    {selectedTicket.status !== 'CLOSED' && (
                        <div className="p-4 border-t border-slate-100 bg-white">
                            <div className="flex gap-3">
                                <input
                                    type="text"
                                    placeholder="Nhập tin nhắn phản hồi..."
                                    value={newMessage}
                                    onChange={(e) => setNewMessage(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                                    className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400"
                                />
                                <button
                                    onClick={sendMessage}
                                    disabled={sending || !newMessage.trim()}
                                    className="px-5 py-3 bg-indigo-600 text-white rounded-xl font-bold text-sm flex items-center gap-2 hover:bg-indigo-700 disabled:opacity-50 transition-colors"
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
        <div className="max-w-5xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl md:text-3xl font-black text-slate-900 flex items-center gap-3">
                        <div className="p-2.5 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-2xl shadow-lg shadow-indigo-200">
                            <Ticket className="w-6 h-6 text-white" />
                        </div>
                        Hỗ trợ của tôi
                    </h1>
                    <p className="text-slate-500 mt-1 font-medium">Theo dõi và quản lý các yêu cầu hỗ trợ</p>
                </div>
                <button
                    onClick={() => setShowCreateModal(true)}
                    className="px-6 py-3 bg-indigo-600 text-white rounded-2xl font-bold text-sm hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition-all flex items-center gap-2 active:scale-95"
                >
                    <Plus className="w-4 h-4" />
                    Tạo yêu cầu mới
                </button>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                    { label: 'Tổng yêu cầu', value: tickets.length, color: 'from-slate-500 to-slate-600' },
                    { label: 'Đang xử lý', value: tickets.filter(t => ['OPEN', 'IN_PROGRESS', 'REOPENED'].includes(t.status)).length, color: 'from-amber-500 to-orange-500' },
                    { label: 'Chờ phản hồi', value: tickets.filter(t => t.status === 'WAITING_CUSTOMER').length, color: 'from-purple-500 to-indigo-500' },
                    { label: 'Đã giải quyết', value: tickets.filter(t => ['RESOLVED', 'CLOSED'].includes(t.status)).length, color: 'from-green-500 to-emerald-500' },
                ].map((stat, i) => (
                    <div key={i} className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{stat.label}</p>
                        <p className={`text-2xl font-black bg-gradient-to-r ${stat.color} bg-clip-text text-transparent`}>{stat.value}</p>
                    </div>
                ))}
            </div>

            {/* Filters */}
            <div className="bg-white rounded-2xl border border-slate-100 p-3 shadow-sm flex items-center gap-3 overflow-x-auto">
                <Filter className="w-4 h-4 text-slate-400 flex-shrink-0" />
                <button
                    onClick={() => setStatusFilter('')}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors whitespace-nowrap ${!statusFilter ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:bg-slate-100'}`}
                >
                    Tất cả
                </button>
                {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
                    <button
                        key={key}
                        onClick={() => setStatusFilter(key)}
                        className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors whitespace-nowrap ${statusFilter === key ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:bg-slate-100'}`}
                    >
                        {cfg.label}
                    </button>
                ))}
            </div>

            {/* Tickets List */}
            {loading ? (
                <div className="flex items-center justify-center py-20">
                    <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
                </div>
            ) : tickets.length === 0 ? (
                <div className="bg-white rounded-3xl border border-slate-100 p-16 text-center shadow-sm">
                    <div className="w-20 h-20 bg-slate-50 rounded-3xl flex items-center justify-center mx-auto mb-6">
                        <Ticket className="w-10 h-10 text-slate-200" />
                    </div>
                    <h3 className="font-black text-lg text-slate-400 mb-2">Chưa có yêu cầu hỗ trợ</h3>
                    <p className="text-sm text-slate-400 mb-6">Bạn có thể tạo yêu cầu mới khi cần hỗ trợ về đơn hàng, sản phẩm hoặc bất kỳ vấn đề nào.</p>
                    <button
                        onClick={() => setShowCreateModal(true)}
                        className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold text-sm hover:bg-indigo-700 transition-colors"
                    >
                        Tạo yêu cầu đầu tiên
                    </button>
                </div>
            ) : (
                <div className="space-y-3">
                    {tickets.map((ticket) => {
                        const statusCfg = STATUS_CONFIG[ticket.status] || STATUS_CONFIG.OPEN
                        const categoryCfg = CATEGORY_CONFIG[ticket.category] || CATEGORY_CONFIG.GENERAL
                        const StatusIcon = statusCfg.icon
                        const CategoryIcon = categoryCfg.icon
                        const lastMessage = ticket.messages?.[0]

                        return (
                            <button
                                key={ticket.id}
                                onClick={() => {
                                    setSelectedTicket(ticket)
                                    fetchTicketDetails(ticket.id)
                                }}
                                className="w-full bg-white rounded-2xl border border-slate-100 p-5 text-left hover:shadow-md hover:border-indigo-200 transition-all group"
                            >
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-3 mb-2">
                                            <span className="text-xs font-black text-indigo-600">{ticket.ticketNumber}</span>
                                            <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-lg border ${statusCfg.bgColor} ${statusCfg.color}`}>
                                                {statusCfg.label}
                                            </span>
                                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${PRIORITY_CONFIG[ticket.priority]?.color}`}>
                                                {PRIORITY_CONFIG[ticket.priority]?.label}
                                            </span>
                                        </div>
                                        <h3 className="font-bold text-slate-900 mb-1 truncate group-hover:text-indigo-600 transition-colors">
                                            {ticket.subject}
                                        </h3>
                                        <div className="flex items-center gap-4 text-xs text-slate-400">
                                            <span className="flex items-center gap-1">
                                                <CategoryIcon className="w-3 h-3" />
                                                {categoryCfg.label}
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <Clock className="w-3 h-3" />
                                                {formatRelative(ticket.createdAt)}
                                            </span>
                                            {lastMessage && (
                                                <span className="flex items-center gap-1 text-slate-400 truncate max-w-[200px]">
                                                    <MessageCircle className="w-3 h-3" />
                                                    {lastMessage.content?.substring(0, 50)}...
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-indigo-500 transition-colors flex-shrink-0 mt-2" />
                                </div>
                            </button>
                        )
                    })}
                </div>
            )}

            {/* Create Ticket Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl w-full max-w-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        <div className="bg-gradient-to-r from-indigo-600 to-blue-600 p-6 text-white">
                            <h2 className="text-xl font-black flex items-center gap-3">
                                <Plus className="w-6 h-6" />
                                Tạo yêu cầu hỗ trợ mới
                            </h2>
                            <p className="text-indigo-200 text-sm mt-1">Mô tả chi tiết vấn đề để chúng tôi hỗ trợ nhanh nhất</p>
                        </div>

                        <form onSubmit={handleCreateTicket} className="p-6 space-y-5">
                            <div>
                                <label className="block text-xs font-black text-slate-500 uppercase tracking-wider mb-2">Danh mục *</label>
                                <div className="grid grid-cols-3 gap-2">
                                    {Object.entries(CATEGORY_CONFIG).map(([key, cfg]) => {
                                        const Icon = cfg.icon
                                        return (
                                            <button
                                                key={key}
                                                type="button"
                                                onClick={() => setCreateForm(prev => ({ ...prev, category: key }))}
                                                className={`p-3 rounded-xl border text-xs font-bold flex flex-col items-center gap-1.5 transition-all ${createForm.category === key
                                                        ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                                                        : 'border-slate-200 text-slate-500 hover:border-slate-300'
                                                    }`}
                                            >
                                                <Icon className="w-4 h-4" />
                                                {cfg.label}
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
                                    value={createForm.subject}
                                    onChange={(e) => setCreateForm(prev => ({ ...prev, subject: e.target.value }))}
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400"
                                    placeholder="Ví dụ: Không nhận được hàng đơn #ORD-12345"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-black text-slate-500 uppercase tracking-wider mb-2">Mô tả chi tiết *</label>
                                <textarea
                                    required
                                    rows={4}
                                    value={createForm.description}
                                    onChange={(e) => setCreateForm(prev => ({ ...prev, description: e.target.value }))}
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400"
                                    placeholder="Mô tả vấn đề bạn đang gặp phải..."
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-black text-slate-500 uppercase tracking-wider mb-2">Mã đơn hàng</label>
                                    <input
                                        type="text"
                                        value={createForm.orderId}
                                        onChange={(e) => setCreateForm(prev => ({ ...prev, orderId: e.target.value }))}
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                                        placeholder="ORD-XXXXX (nếu có)"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-black text-slate-500 uppercase tracking-wider mb-2">Mức độ</label>
                                    <select
                                        value={createForm.priority}
                                        onChange={(e) => setCreateForm(prev => ({ ...prev, priority: e.target.value }))}
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                                    >
                                        {Object.entries(PRIORITY_CONFIG).map(([key, cfg]) => (
                                            <option key={key} value={key}>{cfg.label}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="flex gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setShowCreateModal(false)}
                                    className="flex-1 px-4 py-3 border border-slate-200 text-slate-600 font-bold rounded-xl hover:bg-slate-50 transition-colors"
                                >
                                    Hủy
                                </button>
                                <button
                                    type="submit"
                                    disabled={creating}
                                    className="flex-1 px-4 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                                    {creating ? 'Đang gửi...' : 'Gửi yêu cầu'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}
