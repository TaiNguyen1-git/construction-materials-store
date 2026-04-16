'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import {
    Ticket,
    Search,
    Filter,
    ChevronRight,
    Clock,
    User,
    Phone,
    MessageCircle,
    AlertCircle,
    CheckCircle,
    XCircle,
    RefreshCw,
    Send,
    Paperclip,
    AlertTriangle,
    ArrowUpRight,
    X
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
    const [attachments, setAttachments] = useState<{ fileName: string; fileUrl: string; fileType: string }[]>([])
    const [uploading, setUploading] = useState(false)
    const fileInputRef = useRef<HTMLInputElement>(null)

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

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        if (file.size > 10 * 1024 * 1024) {
            toast.error('File quá lớn. Tối đa 10MB.')
            return
        }

        setUploading(true)
        const formData = new FormData()
        formData.append('file', file)

        try {
            const res = await fetch('/api/upload', {
                method: 'POST',
                body: formData
            })
            const data = await res.json()
            if (data.success) {
                setAttachments(prev => [...prev, {
                    fileName: data.fileName,
                    fileUrl: data.fileUrl,
                    fileType: data.fileType
                }])
                toast.success('Đã tải lên tệp đính kèm')
            } else {
                toast.error(data.error || 'Lỗi tải lên tệp')
            }
        } catch (error) {
            console.error('Upload error:', error)
            toast.error('Lỗi tải lên tệp')
        } finally {
            setUploading(false)
            if (fileInputRef.current) fileInputRef.current.value = ''
        }
    }

    const removeAttachment = (index: number) => {
        setAttachments(prev => prev.filter((_, i) => i !== index))
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
                    isInternal: (!selectedTicket.customerId) ? true : isInternal,
                    attachments
                })
            })

            if (res.ok) {
                const data = await res.json()
                setMessages([...messages, data.message])
                setNewMessage('')
                setAttachments([])
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
                        <button 
                            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} 
                            title="Cuộn lên bộ lọc"
                            className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors text-slate-400 hover:text-indigo-600"
                        >
                            <Filter className="w-4 h-4" />
                        </button>
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
                                    {selectedTicket.guestPhone && (
                                        <div className="flex items-center gap-1">
                                            <Phone className="w-3 h-3 text-indigo-500" />
                                            <span className="font-bold text-slate-700">{selectedTicket.guestPhone}</span>
                                        </div>
                                    )}
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
                                            {msg.attachments && msg.attachments.length > 0 && (
                                                <div className="mt-2 flex flex-wrap gap-2">
                                                    {msg.attachments.map((att: any, i: number) => (
                                                        <a 
                                                            key={i} 
                                                            href={typeof att === 'string' ? att : att.fileUrl || att.url} 
                                                            target="_blank" 
                                                            rel="noopener noreferrer"
                                                            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${msg.senderType === 'STAFF' && !msg.isInternal ? 'bg-indigo-700 hover:bg-indigo-800 text-indigo-50' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'}`}
                                                        >
                                                            <Paperclip className="w-3.5 h-3.5" />
                                                            <span className="truncate max-w-[150px]">{typeof att === 'string' ? 'Đính kèm' : att.fileName || 'Tệp'}</span>
                                                        </a>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Message Input */}
                            <div className="p-4 border-t border-slate-100 bg-white">
                                {(!selectedTicket.customerId) && (
                                    <div className="mb-3 p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3">
                                        <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                                        <div>
                                            <p className="text-sm font-bold text-amber-800">Khách vãng lai đăng ký hỗ trợ!</p>
                                            <p className="text-xs text-amber-700 mt-1">Xin vui lòng gọi điện hoặc Zalo qua SĐT <strong>{selectedTicket.guestPhone}</strong> để xử lý. Khung dưới đây đã bị khóa thành chế độ <strong>"Chỉ Ghi Chú Nội Bộ"</strong>.</p>
                                        </div>
                                    </div>
                                )}
                                <div className="flex items-center gap-2 mb-2">
                                    <label className={`flex items-center gap-2 text-xs ${(!selectedTicket.customerId) ? 'opacity-50 cursor-not-allowed' : ''}`}>
                                        <input
                                            type="checkbox"
                                            checked={(!selectedTicket.customerId) ? true : isInternal}
                                            onChange={(e) => { if (selectedTicket.customerId) setIsInternal(e.target.checked) }}
                                            disabled={!selectedTicket.customerId}
                                            className="w-4 h-4 rounded border-slate-300 disabled:bg-slate-200"
                                        />
                                        <span className="text-slate-600 font-medium">Ghi chú nội bộ (KH không thấy)</span>
                                    </label>
                                </div>
                                {attachments.length > 0 && (
                                    <div className="flex flex-wrap gap-2 mb-3 bg-slate-50 p-2 rounded-xl border border-slate-100">
                                        {attachments.map((att, i) => (
                                            <div key={i} className="flex items-center gap-2 bg-white px-3 py-1.5 rounded border border-slate-200 text-xs shadow-sm">
                                                <span className="truncate max-w-[200px] font-medium text-slate-700">{att.fileName}</span>
                                                <button type="button" onClick={() => removeAttachment(i)} className="text-slate-400 hover:text-red-500 transition-colors">
                                                    <X className="w-3 h-3" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                                <div className="flex gap-2">
                                    <input 
                                        type="file" 
                                        ref={fileInputRef}
                                        onChange={handleFileUpload}
                                        className="hidden" 
                                        accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.zip,.rar"
                                    />
                                    <button 
                                        type="button"
                                        onClick={() => fileInputRef.current?.click()}
                                        disabled={uploading}
                                        className={`p-2.5 hover:bg-slate-100 rounded-xl transition-colors ${uploading ? 'opacity-50 animate-pulse' : ''}`}
                                    >
                                        <Paperclip className="w-5 h-5 text-slate-400" />
                                    </button>
                                    <input
                                        type="text"
                                        placeholder={((!selectedTicket.customerId) || isInternal) ? "Nhập ghi chú nội bộ..." : "Nhập tin nhắn phản hồi..."}
                                        value={newMessage}
                                        onChange={(e) => setNewMessage(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                                        className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                                    />
                                    <button
                                        onClick={sendMessage}
                                        disabled={sending || (!newMessage.trim() && attachments.length === 0) || uploading}
                                        className={`px-4 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 transition-colors disabled:opacity-50 ${((!selectedTicket.customerId) || isInternal)
                                            ? 'bg-amber-500 text-white hover:bg-amber-600'
                                            : 'bg-indigo-600 text-white hover:bg-indigo-700'
                                            }`}
                                    >
                                        <Send className="w-4 h-4" />
                                        {sending ? 'Đang gửi...' : (((!selectedTicket.customerId) || isInternal) ? 'Thêm ghi chú' : 'Gửi')}
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
