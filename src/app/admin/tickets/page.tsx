'use client'

import { useState, useEffect, useCallback, useRef, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import {
    Ticket,
    RefreshCw,
    AlertCircle,
    CheckCircle,
    XCircle,
    Clock,
    AlertTriangle
} from 'lucide-react'
import toast from 'react-hot-toast'
import { fetchWithAuth } from '@/lib/api-client'
import { subscribeToTicketMessages } from '@/lib/firebase-notifications'

// Components
import TicketFilters from './components/TicketFilters'
import TicketList from './components/TicketList'
import TicketDetails from './components/TicketDetails'
import MessageInput from './components/MessageInput'

// Types
import { SupportTicket, TicketMessage, StatusConfig, PriorityConfig } from './types'

const STATUS_CONFIG: Record<string, StatusConfig> = {
    OPEN: { label: 'Mới', color: 'bg-blue-100 text-blue-700', icon: AlertCircle },
    IN_PROGRESS: { label: 'Đang xử lý', color: 'bg-yellow-100 text-yellow-700', icon: RefreshCw },
    WAITING_CUSTOMER: { label: 'Chờ KH', color: 'bg-purple-100 text-purple-700', icon: Clock },
    WAITING_INTERNAL: { label: 'Chờ nội bộ', color: 'bg-orange-100 text-orange-700', icon: Clock },
    RESOLVED: { label: 'Đã xử lý', color: 'bg-green-100 text-green-700', icon: CheckCircle },
    CLOSED: { label: 'Đóng', color: 'bg-slate-100 text-slate-700', icon: XCircle },
    REOPENED: { label: 'Mở lại', color: 'bg-red-100 text-red-700', icon: AlertTriangle }
}

const PRIORITY_CONFIG: Record<string, PriorityConfig> = {
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

function TicketsContent() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const ticketIdParam = searchParams.get('id')
    
    // State
    const [tickets, setTickets] = useState<SupportTicket[]>([])
    const [loading, setLoading] = useState(true)
    const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null)
    const [messages, setMessages] = useState<TicketMessage[]>([])
    const [newMessage, setNewMessage] = useState('')
    const [isInternal, setIsInternal] = useState(false)
    const [attachments, setAttachments] = useState<{ fileName: string; fileUrl: string; fileType: string }[]>([])
    const [uploading, setUploading] = useState(false)
    
    // Filters & Pagination
    const [statusFilter, setStatusFilter] = useState('')
    const [priorityFilter, setPriorityFilter] = useState('')
    const [search, setSearch] = useState('')
    const [dismissGuestWarning, setDismissGuestWarning] = useState(false)
    const [page, setPage] = useState(1)
    const [totalPages, setTotalPages] = useState(1)

    // Refs
    const fileInputRef = useRef<HTMLInputElement>(null)
    const messagesEndRef = useRef<HTMLDivElement>(null)

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

    // Silent fetch – updates sidebar without triggering loading state
    const fetchTicketsSilent = useCallback(async () => {
        try {
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
        } catch { /* silent */ }
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
        if (!selectedTicket || (!newMessage.trim() && attachments.length === 0)) return

        const contentToSend = newMessage.trim()
        const internalToSend = (!selectedTicket.customerId) ? true : isInternal
        const attachmentsToSend = [...attachments]

        // 1. Clear input immediately
        setNewMessage('')
        setAttachments([])
        
        // 2. Create optimistic message
        const tempId = 'temp-' + Date.now()
        const optimisticMsg: TicketMessage = {
            id: tempId,
            ticketId: selectedTicket.id,
            senderType: 'STAFF',
            senderName: 'Đang gửi...', // Visual hint
            content: contentToSend,
            attachments: attachmentsToSend.map(a => a.fileUrl),
            isInternal: internalToSend,
            createdAt: new Date().toISOString()
        }
        
        // 3. Add to UI immediately
        setMessages(prev => [...prev, optimisticMsg])

        try {
            const res = await fetchWithAuth(`/api/support/tickets/${selectedTicket.id}/messages`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    content: contentToSend,
                    isInternal: internalToSend,
                    attachments: attachmentsToSend
                })
            })

            if (res.ok) {
                // Remove temp message only – Firebase subscription will deliver the real message
                setMessages(prev => prev.filter(m => m.id !== tempId))
                fetchTicketsSilent() // silent: no loading flash
                if (internalToSend) toast.success('Đã thêm ghi chú nội bộ')
            } else {
                // Revert on error
                setMessages(prev => prev.filter(m => m.id !== tempId))
                setNewMessage(contentToSend)
                setAttachments(attachmentsToSend)
                toast.error('Không thể gửi tin nhắn')
            }
        } catch (error) {
            console.error('Error sending message:', error)
            setMessages(prev => prev.filter(m => m.id !== tempId))
            setNewMessage(contentToSend)
            setAttachments(attachmentsToSend)
            toast.error('Lỗi kết nối')
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

    useEffect(() => {
        if (ticketIdParam) {
            fetchTicketDetails(ticketIdParam)
        }
    }, [ticketIdParam])

    // Real-time Firebase subscription with smart dedup
    useEffect(() => {
        if (!selectedTicket) return
        const unsubscribe = subscribeToTicketMessages(selectedTicket.id, (newMsg) => {
            setMessages(prev => {
                // Skip if real message already in state
                if (prev.some(m => m.id === newMsg.id)) return prev

                // Replace any matching optimistic (temp) message in-place
                const tempIdx = prev.findIndex(m =>
                    m.id.startsWith('temp-') &&
                    m.content === newMsg.content &&
                    m.senderType === newMsg.senderType
                )
                if (tempIdx !== -1) {
                    const next = [...prev]
                    next[tempIdx] = newMsg
                    return next
                }

                return [...prev, newMsg]
            })
        })
        return () => unsubscribe()
    }, [selectedTicket])

    useEffect(() => {
        setDismissGuestWarning(false)
    }, [selectedTicket?.id])

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [messages])

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('vi-VN', {
            day: '2-digit', month: '2-digit', year: 'numeric',
            hour: '2-digit', minute: '2-digit'
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

            <TicketFilters 
                search={search}
                setSearch={setSearch}
                statusFilter={statusFilter}
                setStatusFilter={setStatusFilter}
                priorityFilter={priorityFilter}
                setPriorityFilter={setPriorityFilter}
                statusConfig={STATUS_CONFIG}
                priorityConfig={PRIORITY_CONFIG}
            />

            <div className="flex gap-6 h-[calc(100vh-240px)]">
                <TicketList 
                    tickets={tickets}
                    loading={loading}
                    selectedTicketId={selectedTicket?.id}
                    onSelectTicket={(ticket) => {
                        setSelectedTicket(ticket)
                        fetchTicketDetails(ticket.id)
                    }}
                    statusConfig={STATUS_CONFIG}
                    priorityConfig={PRIORITY_CONFIG}
                    formatDate={formatDate}
                    isSlaBreached={isSlaBreached}
                    page={page}
                    setPage={setPage}
                    totalPages={totalPages}
                />

                <div className="flex-1 bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden flex flex-col">
                    <TicketDetails 
                        selectedTicket={selectedTicket}
                        messages={messages}
                        statusConfig={STATUS_CONFIG}
                        categoryLabels={CATEGORY_LABELS}
                        formatDate={formatDate}
                        isSlaBreached={isSlaBreached}
                        updateTicketStatus={updateTicketStatus}
                        messagesEndRef={messagesEndRef}
                    />
                    
                    <MessageInput 
                        selectedTicket={selectedTicket}
                        dismissGuestWarning={dismissGuestWarning}
                        setDismissGuestWarning={setDismissGuestWarning}
                        isInternal={isInternal}
                        setIsInternal={setIsInternal}
                        attachments={attachments}
                        removeAttachment={removeAttachment}
                        fileInputRef={fileInputRef}
                        handleFileUpload={handleFileUpload}
                        uploading={uploading}
                        newMessage={newMessage}
                        setNewMessage={setNewMessage}
                        sendMessage={sendMessage}
                    />
                </div>
            </div>
        </div>
    )
}

export default function AdminTicketsPage() {
    return (
        <Suspense fallback={<div className="p-8 text-center">Đang tải cấu phần...</div>}>
            <TicketsContent />
        </Suspense>
    )
}
