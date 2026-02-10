'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
    Ticket,
    Search,
    Filter,
    ChevronRight,
    Clock,
    User,
    MessageCircle,
    AlertCircle,
    CheckCircle,
    XCircle,
    RefreshCw,
    Send,
    Paperclip,
    AlertTriangle,
    ArrowUpRight
} from 'lucide-react'
import toast from 'react-hot-toast'
import { fetchWithAuth } from '@/lib/api-client'

interface SupportTicket {
    id: string
    ticketNumber: string
    customerId?: string
    guestName?: string
    guestEmail?: string
    guestPhone?: string
    subject: string
    description: string
    category: string
    priority: string
    status: string
    orderId?: string
    assignedTo?: string
    slaDeadline?: string
    firstResponseAt?: string
    resolution?: string
    customerRating?: number
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

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ElementType }> = {
    OPEN: { label: 'Mới', color: 'bg-blue-100 text-blue-700', icon: AlertCircle },
    IN_PROGRESS: { label: 'Đang xử lý', color: 'bg-yellow-100 text-yellow-700', icon: RefreshCw },
    WAITING_CUSTOMER: { label: 'Chờ KH', color: 'bg-purple-100 text-purple-700', icon: Clock },
    WAITING_INTERNAL: { label: 'Chờ nội bộ', color: 'bg-orange-100 text-orange-700', icon: Clock },
    RESOLVED: { label: 'Đã xử lý', color: 'bg-green-100 text-green-700', icon: CheckCircle },
    CLOSED: { label: 'Đóng', color: 'bg-slate-100 text-slate-700', icon: XCircle },
    REOPENED: { label: 'Mở lại', color: 'bg-red-100 text-red-700', icon: AlertTriangle }
}

const PRIORITY_CONFIG: Record<string, { label: string; color: string }> = {
    LOW: { label: 'Thấp', color: 'bg-slate-100 text-slate-600' },
    MEDIUM: { label: 'Trung bình', color: 'bg-blue-100 text-blue-600' },
    HIGH: { label: 'Cao', color: 'bg-orange-100 text-orange-700' },
    URGENT: { label: 'Khẩn cấp', color: 'bg-red-100 text-red-700' }
}

const CATEGORY_LABELS: Record<string, string> = {
    GENERAL: 'Hỏi đáp chung',
    ORDER: 'Đơn hàng',
    SHIPPING: 'Vận chuyển',
    RETURN_REFUND: 'Đổi trả',
    PRODUCT: 'Sản phẩm',
    PAYMENT: 'Thanh toán',
    TECHNICAL: 'Kỹ thuật',
    COMPLAINT: 'Khiếu nại',
    WARRANTY: 'Bảo hành'
}

export default function AdminTicketsPage() {
    const router = useRouter()
    const [tickets, setTickets] = useState<SupportTicket[]>([])
    const [loading, setLoading] = useState(true)
    const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null)
    const [messages, setMessages] = useState<TicketMessage[]>([])
    const [newMessage, setNewMessage] = useState('')
    const [isInternal, setIsInternal] = useState(false)
    const [sending, setSending] = useState(false)

    // Filters
    const [statusFilter, setStatusFilter] = useState('')
    const [priorityFilter, setPriorityFilter] = useState('')
    const [search, setSearch] = useState('')

    // Pagination
    const [page, setPage] = useState(1)
    const [totalPages, setTotalPages] = useState(1)

    const fetchTickets = useCallback(async () => {
        try {
            setLoading(true)
            const params = new URLSearchParams()
            params.set('page', String(page))
            params.set('limit', '20')
            if (statusFilter) params.set('status', statusFilter)
            if (priorityFilter) params.set('priority', priorityFilter)
            if (search) params.set('search', search)

            const res = await fetchWithAuth(`/api/support/tickets?${params}`)
            if (res.ok) {
                const data = await res.json()
                setTickets(data.tickets || [])
                setTotalPages(data.totalPages || 1)
            }
        } catch (error) {
            console.error('Error fetching tickets:', error)
            toast.error('Không thể tải danh sách ticket')
        } finally {
            setLoading(false)
        }
    }, [page, statusFilter, priorityFilter, search])

    const fetchTicketDetails = async (ticketId: string) => {
        try {
            const res = await fetchWithAuth(`/api/support/tickets/${ticketId}`)
            if (res.ok) {
                const data = await res.json()
                setSelectedTicket(data.ticket)
                setMessages(data.ticket.messages || [])
            }
        } catch (error) {
            console.error('Error fetching ticket:', error)
        }
    }

    const sendMessage = async () => {
        if (!selectedTicket || !newMessage.trim()) return

        setSending(true)
        try {
            const res = await fetchWithAuth(`/api/support/tickets/${selectedTicket.id}/messages`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    content: newMessage,
                    isInternal
                })
            })

            if (res.ok) {
                const data = await res.json()
                setMessages([...messages, data.message])
                setNewMessage('')
                toast.success(isInternal ? 'Đã thêm ghi chú nội bộ' : 'Đã gửi tin nhắn')
                fetchTickets() // Refresh list
            }
        } catch (error) {
            console.error('Error sending message:', error)
            toast.error('Không thể gửi tin nhắn')
        } finally {
            setSending(false)
        }
    }

    const updateTicketStatus = async (ticketId: string, status: string) => {
        try {
            const res = await fetchWithAuth(`/api/support/tickets/${ticketId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status })
            })

            if (res.ok) {
                toast.success('Đã cập nhật trạng thái')
                fetchTickets()
                if (selectedTicket?.id === ticketId) {
                    fetchTicketDetails(ticketId)
                }
            }
        } catch (error) {
            console.error('Error updating ticket:', error)
            toast.error('Không thể cập nhật')
        }
    }

    useEffect(() => {
        fetchTickets()
    }, [fetchTickets])

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('vi-VN', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        })
    }

    const isSlaBreached = (ticket: SupportTicket) => {
        if (!ticket.slaDeadline || ticket.status === 'RESOLVED' || ticket.status === 'CLOSED') return false
        return new Date(ticket.slaDeadline) < new Date()
    }

    return (
        <div className="p-6 max-w-[1600px] mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className="p-3 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-2xl shadow-lg">
                        <Ticket className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-black text-slate-900">Quản lý Ticket</h1>
                        <p className="text-sm text-slate-500 font-medium">Phiếu hỗ trợ khách hàng</p>
                    </div>
                </div>

                <button
                    onClick={() => fetchTickets()}
                    className="p-2 hover:bg-slate-100 rounded-xl transition-colors"
                >
                    <RefreshCw className="w-5 h-5 text-slate-500" />
                </button>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4 mb-6">
                <div className="flex flex-wrap gap-4">
                    {/* Search */}
                    <div className="flex-1 min-w-[200px] relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Tìm theo mã ticket, nội dung..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                        />
                    </div>

                    {/* Status Filter */}
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    >
                        <option value="">Tất cả trạng thái</option>
                        {Object.entries(STATUS_CONFIG).map(([key, val]) => (
                            <option key={key} value={key}>{val.label}</option>
                        ))}
                    </select>

                    {/* Priority Filter */}
                    <select
                        value={priorityFilter}
                        onChange={(e) => setPriorityFilter(e.target.value)}
                        className="px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    >
                        <option value="">Tất cả độ ưu tiên</option>
                        {Object.entries(PRIORITY_CONFIG).map(([key, val]) => (
                            <option key={key} value={key}>{val.label}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Main Content - Split View */}
            <div className="flex gap-6 h-[calc(100vh-280px)]">
                {/* Tickets List */}
                <div className="w-[400px] bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden flex flex-col">
                    <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                        <span className="text-sm font-bold text-slate-600">{tickets.length} ticket</span>
                        <Filter className="w-4 h-4 text-slate-400" />
                    </div>

                    <div className="flex-1 overflow-y-auto">
                        {loading ? (
                            <div className="p-8 text-center text-slate-500">Đang tải...</div>
                        ) : tickets.length === 0 ? (
                            <div className="p-8 text-center text-slate-500">
                                Không có ticket nào
                            </div>
                        ) : (
                            tickets.map((ticket) => {
                                const statusCfg = STATUS_CONFIG[ticket.status] || STATUS_CONFIG.OPEN
                                const priorityCfg = PRIORITY_CONFIG[ticket.priority] || PRIORITY_CONFIG.MEDIUM
                                const StatusIcon = statusCfg.icon

                                return (
                                    <button
                                        key={ticket.id}
                                        onClick={() => {
                                            setSelectedTicket(ticket)
                                            fetchTicketDetails(ticket.id)
                                        }}
                                        className={`w-full p-4 border-b border-slate-50 text-left hover:bg-slate-50 transition-colors ${selectedTicket?.id === ticket.id ? 'bg-indigo-50 border-l-4 border-l-indigo-500' : ''
                                            }`}
                                    >
                                        <div className="flex items-start justify-between gap-2 mb-2">
                                            <span className="text-xs font-bold text-indigo-600">{ticket.ticketNumber}</span>
                                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${priorityCfg.color}`}>
                                                {priorityCfg.label}
                                            </span>
                                        </div>

                                        <h4 className="font-bold text-sm text-slate-900 mb-1 line-clamp-1">
                                            {ticket.subject}
                                        </h4>

                                        <p className="text-xs text-slate-500 line-clamp-2 mb-2">
                                            {ticket.description}
                                        </p>

                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-1.5">
                                                <StatusIcon className="w-3 h-3" />
                                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${statusCfg.color}`}>
                                                    {statusCfg.label}
                                                </span>
                                            </div>

                                            <div className="flex items-center gap-2 text-[10px] text-slate-400">
                                                {isSlaBreached(ticket) && (
                                                    <span className="text-red-500 font-bold">⚠️ SLA</span>
                                                )}
                                                <Clock className="w-3 h-3" />
                                                {formatDate(ticket.createdAt)}
                                            </div>
                                        </div>
                                    </button>
                                )
                            })
                        )}
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="p-3 border-t border-slate-100 flex items-center justify-center gap-2">
                            <button
                                onClick={() => setPage(p => Math.max(1, p - 1))}
                                disabled={page === 1}
                                className="px-3 py-1 text-sm rounded-lg hover:bg-slate-100 disabled:opacity-50"
                            >
                                ←
                            </button>
                            <span className="text-sm text-slate-600">{page} / {totalPages}</span>
                            <button
                                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                disabled={page === totalPages}
                                className="px-3 py-1 text-sm rounded-lg hover:bg-slate-100 disabled:opacity-50"
                            >
                                →
                            </button>
                        </div>
                    )}
                </div>

                {/* Ticket Detail */}
                <div className="flex-1 bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden flex flex-col">
                    {selectedTicket ? (
                        <>
                            {/* Detail Header */}
                            <div className="p-4 border-b border-slate-100">
                                <div className="flex items-start justify-between mb-3">
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <h2 className="text-lg font-black text-slate-900">{selectedTicket.ticketNumber}</h2>
                                            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${STATUS_CONFIG[selectedTicket.status]?.color}`}>
                                                {STATUS_CONFIG[selectedTicket.status]?.label}
                                            </span>
                                        </div>
                                        <p className="text-sm text-slate-600">{selectedTicket.subject}</p>
                                    </div>

                                    {/* Quick Actions */}
                                    <div className="flex items-center gap-2">
                                        {selectedTicket.orderId && (
                                            <button
                                                onClick={() => router.push(`/admin/orders/${selectedTicket.orderId}`)}
                                                className="flex items-center gap-1 px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg text-xs font-bold hover:bg-blue-100"
                                            >
                                                <ArrowUpRight className="w-3 h-3" />
                                                Xem đơn hàng
                                            </button>
                                        )}
                                        <select
                                            value={selectedTicket.status}
                                            onChange={(e) => updateTicketStatus(selectedTicket.id, e.target.value)}
                                            className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold"
                                        >
                                            {Object.entries(STATUS_CONFIG).map(([key, val]) => (
                                                <option key={key} value={key}>{val.label}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                {/* Meta Info */}
                                <div className="flex flex-wrap gap-4 text-xs text-slate-500">
                                    <div className="flex items-center gap-1">
                                        <User className="w-3 h-3" />
                                        {selectedTicket.guestName || 'Khách hàng đăng ký'}
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <Ticket className="w-3 h-3" />
                                        {CATEGORY_LABELS[selectedTicket.category] || selectedTicket.category}
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <Clock className="w-3 h-3" />
                                        {formatDate(selectedTicket.createdAt)}
                                    </div>
                                    {isSlaBreached(selectedTicket) && (
                                        <span className="text-red-600 font-bold">⚠️ Vi phạm SLA</span>
                                    )}
                                </div>
                            </div>

                            {/* Messages */}
                            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
                                {messages.map((msg) => (
                                    <div
                                        key={msg.id}
                                        className={`flex ${msg.senderType === 'STAFF' ? 'justify-end' : 'justify-start'}`}
                                    >
                                        <div className={`max-w-[70%] ${msg.isInternal
                                            ? 'bg-amber-50 border-2 border-dashed border-amber-200'
                                            : msg.senderType === 'STAFF'
                                                ? 'bg-indigo-600 text-white'
                                                : 'bg-white border border-slate-200'
                                            } rounded-2xl p-4`}>
                                            {msg.isInternal && (
                                                <div className="text-[10px] uppercase tracking-wider font-bold text-amber-600 mb-1">
                                                    🔒 Ghi chú nội bộ
                                                </div>
                                            )}
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className={`text-xs font-bold ${msg.senderType === 'STAFF' && !msg.isInternal ? 'text-indigo-100' : 'text-slate-500'}`}>
                                                    {msg.senderName || (msg.senderType === 'STAFF' ? 'Nhân viên' : 'Khách')}
                                                </span>
                                                <span className={`text-[10px] ${msg.senderType === 'STAFF' && !msg.isInternal ? 'text-indigo-200' : 'text-slate-400'}`}>
                                                    {formatDate(msg.createdAt)}
                                                </span>
                                            </div>
                                            <p className={`text-sm whitespace-pre-wrap ${msg.senderType === 'STAFF' && !msg.isInternal ? 'text-white' : 'text-slate-700'}`}>
                                                {msg.content}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Message Input */}
                            <div className="p-4 border-t border-slate-100 bg-white">
                                <div className="flex items-center gap-2 mb-2">
                                    <label className="flex items-center gap-2 text-xs">
                                        <input
                                            type="checkbox"
                                            checked={isInternal}
                                            onChange={(e) => setIsInternal(e.target.checked)}
                                            className="w-4 h-4 rounded border-slate-300"
                                        />
                                        <span className="text-slate-600 font-medium">Ghi chú nội bộ (KH không thấy)</span>
                                    </label>
                                </div>
                                <div className="flex gap-2">
                                    <button className="p-2.5 hover:bg-slate-100 rounded-xl transition-colors">
                                        <Paperclip className="w-5 h-5 text-slate-400" />
                                    </button>
                                    <input
                                        type="text"
                                        placeholder={isInternal ? "Nhập ghi chú nội bộ..." : "Nhập tin nhắn phản hồi..."}
                                        value={newMessage}
                                        onChange={(e) => setNewMessage(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                                        className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                                    />
                                    <button
                                        onClick={sendMessage}
                                        disabled={sending || !newMessage.trim()}
                                        className={`px-4 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 transition-colors disabled:opacity-50 ${isInternal
                                            ? 'bg-amber-500 text-white hover:bg-amber-600'
                                            : 'bg-indigo-600 text-white hover:bg-indigo-700'
                                            }`}
                                    >
                                        <Send className="w-4 h-4" />
                                        {sending ? 'Đang gửi...' : 'Gửi'}
                                    </button>
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="flex-1 flex items-center justify-center text-slate-400">
                            <div className="text-center">
                                <MessageCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
                                <p className="font-medium">Chọn một ticket để xem chi tiết</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
