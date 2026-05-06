'use client'

import { useState, useEffect, Suspense, useRef, useCallback } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import {
    Loader2, AlertCircle, RefreshCw, Clock, CheckCircle, XCircle, AlertTriangle, ShieldAlert
} from 'lucide-react'
import { getAuthHeaders, fetchWithAuth } from '@/lib/api-client'
import { getFirebaseDatabase } from '@/lib/firebase'
import { ref, onChildAdded, onChildChanged, onValue, set, off, query, limitToLast } from 'firebase/database'
import { subscribeToTicketMessages } from '@/lib/firebase-notifications'
import toast, { Toaster } from 'react-hot-toast'
import ChatCallManager from '@/components/ChatCallManager'
import CustomerContextPanel from '@/components/chatbot/CustomerContextPanel'
import { useAuth } from '@/contexts/auth-context'

// Local Components
import UnifiedSidebar from './components/UnifiedSidebar'
import DirectChatView from './components/DirectChatView'
import TicketChatView from './components/TicketChatView'
import { SupportTicket, TicketMessage, ActiveTab, StatusConfig, PriorityConfig } from './types'
import { FileText, Phone, Video } from 'lucide-react'

// ─── Constants ──────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<string, StatusConfig> = {
    OPEN:             { label: 'Mới',        color: 'bg-blue-100 text-blue-700',   icon: AlertCircle },
    IN_PROGRESS:      { label: 'Đang xử lý', color: 'bg-yellow-100 text-yellow-700', icon: RefreshCw },
    WAITING_CUSTOMER: { label: 'Chờ KH',     color: 'bg-purple-100 text-purple-700', icon: Clock },
    WAITING_INTERNAL: { label: 'Chờ nội bộ', color: 'bg-orange-100 text-orange-700', icon: Clock },
    RESOLVED:         { label: 'Đã xử lý',  color: 'bg-green-100 text-green-700',  icon: CheckCircle },
    CLOSED:           { label: 'Đóng',       color: 'bg-slate-100 text-slate-700',  icon: XCircle },
    REOPENED:         { label: 'Mở lại',     color: 'bg-red-100 text-red-700',      icon: AlertTriangle },
}

const PRIORITY_CONFIG: Record<string, PriorityConfig> = {
    LOW:    { label: 'Thấp',       color: 'bg-slate-100 text-slate-600' },
    MEDIUM: { label: 'Trung bình', color: 'bg-blue-100 text-blue-600' },
    HIGH:   { label: 'Cao',        color: 'bg-orange-100 text-orange-700' },
    URGENT: { label: 'Khẩn cấp',  color: 'bg-red-100 text-red-700' },
}

const CATEGORY_LABELS: Record<string, string> = {
    GENERAL:      'Hỏi đáp chung',
    ORDER:        'Đơn hàng',
    SHIPPING:     'Vận chuyển',
    RETURN_REFUND:'Đổi trả',
    PRODUCT:      'Sản phẩm',
    PAYMENT:      'Thanh toán',
    TECHNICAL:    'Kỹ thuật',
    COMPLAINT:    'Khiếu nại',
    WARRANTY:     'Bảo hành',
}

// ─── Main unified content ─────────────────────────────────────────────────────

function MessagesContent() {
    const searchParams = useSearchParams()
    const router = useRouter()
    const { user } = useAuth()

    const [activeTab, setActiveTab] = useState<ActiveTab>(
        searchParams.get('tab') === 'tickets' ? 'tickets' : 'chat'
    )

    // Direct Chat state
    const [conversations, setConversations] = useState<any[]>([])
    const [selectedId, setSelectedId] = useState<string | null>(
        activeTab === 'chat' ? searchParams.get('id') : null
    )
    const [chatLoading, setChatLoading] = useState(true)
    const [messages, setMessages] = useState<any[]>([])
    const [newMessage, setNewMessage] = useState('')
    const [sending, setSending] = useState(false)
    const [uploading, setUploading] = useState(false)
    const [smartReplies, setSmartReplies] = useState<string[]>([])
    const [smartReplyLoading, setSmartReplyLoading] = useState(false)
    const [showMenu, setShowMenu] = useState(false)
    const [showScrollButton, setShowScrollButton] = useState(false)
    const [showCustomerPanel, setShowCustomerPanel] = useState(true)
    const [searchQuery, setSearchQuery] = useState('')
    const [searchResults, setSearchResults] = useState<any[]>([])
    const [isSearching, setIsSearching] = useState(false)
    const [highlightId, setHighlightId] = useState<string | null>(null)
    const [hideSmartReplies, setHideSmartReplies] = useState(false)
    const [partnerIsTyping, setPartnerIsTyping] = useState(false)
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
    const [showReportModal, setShowReportModal] = useState(false)
    const [showBanModal, setShowBanModal] = useState(false)
    const [reportReason, setReportReason] = useState('')
    const [customReason, setCustomReason] = useState('')
    const [banReason, setBanReason] = useState('')
    const [banDuration, setBanDuration] = useState<number | null>(null) // null = Permanent
    const [banTarget, setBanTarget] = useState<'ACCOUNT' | 'IP'>('ACCOUNT')
    const [isRestricted, setIsRestricted] = useState(false)
    const [activeRestrictionId, setActiveRestrictionId] = useState<string | null>(null)
    const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null)

    const menuRef = useRef<HTMLDivElement>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)
    const messagesEndRef = useRef<HTMLDivElement>(null)
    const scrollContainerRef = useRef<HTMLDivElement>(null)
    const selectedIdRef = useRef<string | null>(null)

    const selectedConv = conversations.find(c => c.id === selectedId)
    const otherParticipantId = selectedConv ? (user?.id === selectedConv.participant1Id ? selectedConv.participant2Id : selectedConv.participant1Id) : null

    // Ticket state
    const [tickets, setTickets] = useState<SupportTicket[]>([])
    const [ticketsLoading, setTicketsLoading] = useState(true)
    const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null)
    const [ticketMessages, setTicketMessages] = useState<TicketMessage[]>([])
    const [ticketNewMessage, setTicketNewMessage] = useState('')
    const [isInternal, setIsInternal] = useState(false)
    const [ticketAttachments, setTicketAttachments] = useState<any[]>([])
    const [ticketUploading, setTicketUploading] = useState(false)
    const [dismissGuestWarning, setDismissGuestWarning] = useState(false)
    const [statusFilter, setStatusFilter] = useState('')
    const [priorityFilter, setPriorityFilter] = useState('')
    const [ticketSearch, setTicketSearch] = useState('')
    const [ticketPage, setTicketPage] = useState(1)
    const [ticketTotalPages, setTicketTotalPages] = useState(1)
    const ticketFileInputRef = useRef<HTMLInputElement>(null)

    // Sync with URL on initial load only (searchParams changes)
    useEffect(() => {
        const tab = searchParams.get('tab')
        if (tab === 'tickets') setActiveTab('tickets')
        else setActiveTab('chat')
        const id = searchParams.get('id')
        if (id) {
            if (tab === 'tickets') fetchTicketDetails(id)
            else {
                setSelectedId(id)
            }
        }
    }, [searchParams])

    // Check restriction status separately to avoid loop
    useEffect(() => {
        if (otherParticipantId && !otherParticipantId.startsWith('guest_')) {
            checkRestrictionStatus(otherParticipantId)
        }
    }, [otherParticipantId])

    // Immediately sync selectedIdRef when selectedId changes
    useEffect(() => {
        selectedIdRef.current = selectedId
    }, [selectedId])

    const checkRestrictionStatus = async (customerId: string) => {
        try {
            const res = await fetch(`/api/admin/integrity/restrictions?customerId=${customerId}`, {
                headers: getAuthHeaders()
            })
            const data = await res.json()
            if (data.success && data.data.restrictions && data.data.restrictions.length > 0) {
                setIsRestricted(true)
                setActiveRestrictionId(data.data.restrictions[0].id)
            } else {
                setIsRestricted(false)
                setActiveRestrictionId(null)
            }
        } catch (err) {
            console.error('Check restriction error:', err)
        }
    }

    // Load Chat Data
    useEffect(() => { if (user) fetchConversations() }, [user])

    // Sync state to URL for Service Worker notification suppression
    useEffect(() => {
        if (activeTab === 'chat' && selectedId) {
            const params = new URLSearchParams(window.location.search)
            if (params.get('id') !== selectedId || params.get('tab') !== 'chat') {
                params.set('id', selectedId)
                params.set('tab', 'chat')
                window.history.replaceState(null, '', `/admin/messages?${params.toString()}`)
            }
        }
    }, [selectedId, activeTab])

    useEffect(() => {
        if (!selectedId) return
        setMessages([]) // Clear old messages immediately for responsive UI
        const db = getFirebaseDatabase()
        const messagesRef = ref(db, `conversations/${selectedId}/messages`)
        const recentMessagesQuery = query(messagesRef, limitToLast(20))
        fetchMessages(selectedId)
        const unsub = onChildAdded(recentMessagesQuery, (snapshot) => {
            const newMsg = snapshot.val()
            if (newMsg) {
                newMsg.id = newMsg.id || snapshot.key
                setMessages(prev => {
                    const existingIdx = prev.findIndex(m => 
                        (m.id && m.id === newMsg.id) || 
                        (m.tempId && m.tempId === newMsg.tempId)
                    )

                    if (existingIdx !== -1) {
                        const next = [...prev]
                        next[existingIdx] = { ...prev[existingIdx], ...newMsg }
                        return next
                    }
                    return [...prev, newMsg]
                })

                // Mark as read if from other
                const isMe = newMsg.senderId === 'admin_support' || (newMsg.realSenderId ? String(newMsg.realSenderId) === String(user?.id) : String(newMsg.senderId) === String(user?.id))
                if (!isMe && !newMsg.isRead) {
                    markAsRead(newMsg.id)
                }
            }
        })

        const unsubChanged = onChildChanged(messagesRef, (snapshot) => {
            const updatedMsg = snapshot.val()
            if (updatedMsg) {
                updatedMsg.id = updatedMsg.id || snapshot.key
                setMessages(prev => {
                    const existingIdx = prev.findIndex(m => m.id === updatedMsg.id)
                    if (existingIdx !== -1) {
                        const next = [...prev]
                        next[existingIdx] = { ...prev[existingIdx], ...updatedMsg }
                        return next
                    }
                    return prev
                })
            }
        })

        // Typing indicator listener
        const typingRef = ref(db, `conversations/${selectedId}/typing`)
        onValue(typingRef, (snapshot) => {
            const data = snapshot.val()
            if (data && user) {
                // Read selectedConv from ref to avoid stale closure & prevent re-running effect
                const convParticipant1Id = selectedIdRef.current ? conversations.find(c => c.id === selectedIdRef.current)?.participant1Id : null
                const convParticipant2Id = selectedIdRef.current ? conversations.find(c => c.id === selectedIdRef.current)?.participant2Id : null
                const partnerId = user.id === convParticipant1Id ? convParticipant2Id : convParticipant1Id
                if (partnerId) {
                    const status = data[partnerId]
                    if (typeof status === 'boolean') {
                        setPartnerIsTyping(status)
                    } else if (status && typeof status === 'object') {
                        const isTyping = status.isTyping && (Date.now() - (status.timestamp || 0) < 5000)
                        setPartnerIsTyping(isTyping)
                    } else {
                        setPartnerIsTyping(false)
                    }
                }
            } else {
                setPartnerIsTyping(false)
            }
        })

        // Mark Admin Presence in this conversation
        if (user && (user.role === 'MANAGER' || user.role === 'EMPLOYEE')) {
            const statusRef = ref(db, `conversations/${selectedId}/status`)
            set(statusRef, {
                activeAdmin: {
                    id: user.id,
                    name: user.name || 'Nhân viên'
                },
                lastActiveAt: new Date().toISOString()
            })
        }

        return () => {
            off(messagesRef)
            off(typingRef)
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedId, user])

    // Load Ticket Data
    const fetchTickets = useCallback(async () => {
        try {
            setTicketsLoading(true)
            const params = new URLSearchParams()
            params.set('page', String(ticketPage))
            params.set('limit', '20')
            if (statusFilter) params.set('status', statusFilter)
            if (priorityFilter) params.set('priority', priorityFilter)
            if (ticketSearch) params.set('search', ticketSearch)
            const res = await fetchWithAuth(`/api/support/tickets?${params}`)
            if (res.ok) {
                const data = await res.json()
                setTickets(data.tickets || [])
                setTicketTotalPages(data.totalPages || 1)
            }
        } catch { toast.error('Không thể tải danh sách ticket') } finally { setTicketsLoading(false) }
    }, [ticketPage, statusFilter, priorityFilter, ticketSearch])

    useEffect(() => { if (activeTab === 'tickets') fetchTickets() }, [fetchTickets, activeTab])

    useEffect(() => {
        if (!selectedTicket) return
        return subscribeToTicketMessages(selectedTicket.id, (newMsg) => {
            setTicketMessages(prev => {
                const isTemp = newMsg.id?.startsWith('temp-')
                if (!isTemp && prev.some(m => m.id === newMsg.id)) return prev
                const tempIdx = prev.findIndex(m => m.id.startsWith('temp-') && m.content === newMsg.content)
                if (tempIdx !== -1) {
                    const next = [...prev]
                    next[tempIdx] = newMsg
                    return next
                }
                return [...prev, newMsg]
            })
        })
    }, [selectedTicket])

    // Direct Chat Logic
    const fetchConversations = async () => {
        try {
            const res = await fetch('/api/chat/conversations', { headers: getAuthHeaders() })
            if (res.ok) {
                const json = await res.json()
                setConversations(json.data)
                const urlId = searchParams.get('id')
                const tab = searchParams.get('tab')
                if (!selectedId && !urlId && json.data.length > 0 && tab !== 'tickets') setSelectedId(json.data[0].id)
            }
        } catch (err) { console.error('Fetch error:', err) } finally { setChatLoading(false) }
    }

    const fetchMessages = async (convId: string, quiet = false) => {
        try {
            const res = await fetch(`/api/chat/conversations/${convId}/messages`, { headers: getAuthHeaders() })
            if (res.ok) {
                const json = await res.json()
                if (selectedIdRef.current === convId) {
                    setMessages(json.data)
                    if (!quiet) setTimeout(scrollToBottom, 100)
                }
            }
        } catch (err) { console.error('Fetch messages error:', err) }
    }

    const handleSearch = async (val: string) => {
        setSearchQuery(val)
        if (val.length < 2) { setSearchResults([]); setIsSearching(false); return }
        setIsSearching(true)
        try {
            const res = await fetch(`/api/chat/search?q=${encodeURIComponent(val)}`, { headers: getAuthHeaders() })
            if (res.ok) {
                const json = await res.json()
                setSearchResults(json.data)
            }
        } catch { setIsSearching(false) }
    }

    const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })

    const markAsRead = async (msgId: string) => {
        try {
            await fetchWithAuth(`/api/chat/messages/${msgId}/read`, {
                method: 'POST',
                body: JSON.stringify({ conversationId: selectedId })
            })
        } catch (err) {
            console.error('Mark read error:', err)
        }
    }

    const handleTyping = useCallback(() => {
        if (!selectedId || !user) return

        const db = getFirebaseDatabase()
        const myTypingRef = ref(db, `conversations/${selectedId}/typing/${user.id}`)

        set(myTypingRef, {
            isTyping: true,
            userName: user.name || 'Nhân viên',
            timestamp: Date.now()
        })

        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current)
        typingTimeoutRef.current = setTimeout(() => {
            set(myTypingRef, {
                isTyping: false,
                userName: user.name || 'Nhân viên',
                timestamp: Date.now()
            })
            typingTimeoutRef.current = null
        }, 4000)
    }, [selectedId, user])

    const handleSendMessage = async (e?: any, fileData?: any, replyToId?: string) => {
        if (e) e.preventDefault()
        const content = newMessage.trim()
        if (!content && !fileData) return
        const tempId = 'temp-' + Date.now()
        const replyMsg = replyToId ? messages.find(m => m.id === replyToId) : null
        setMessages(prev => [...prev, { 
            id: tempId, 
            tempId, 
            senderId: user?.id, 
            senderName: user?.name || 'Admin', 
            content, 
            fileUrl: fileData?.fileUrl, 
            createdAt: new Date().toISOString(), 
            isSending: true,
            replyTo: replyMsg ? {
                id: replyMsg.id,
                senderName: replyMsg.senderName,
                content: replyMsg.content,
                fileUrl: replyMsg.fileUrl,
                fileType: replyMsg.fileType
            } : undefined
        }])
        setNewMessage(''); scrollToBottom()
        try {
            const res = await fetch('/api/chat/messages', {
                method: 'POST',
                headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
                body: JSON.stringify({ conversationId: selectedId, content, fileUrl: fileData?.fileUrl, fileName: fileData?.fileName, fileType: fileData?.fileType, tempId, senderId: user?.id, replyToId })
            })
            if (!res.ok) { toast.error('Lỗi gửi'); setMessages(prev => prev.filter(m => m.id !== tempId)); setNewMessage(content) }
        } catch { setMessages(prev => prev.filter(m => m.id !== tempId)) }
    }

    const handleFileUpload = async (e: any) => {
        const file = e.target.files?.[0]
        if (!file) return
        setUploading(true)
        const formData = new FormData(); formData.append('file', file)
        try {
            const res = await fetch('/api/upload', { method: 'POST', body: formData })
            const data = await res.json()
            if (data.success) await handleSendMessage(undefined, data)
        } catch { toast.error('Lỗi upload') } finally { setUploading(false); if (fileInputRef.current) fileInputRef.current.value = '' }
    }

    // Ticket Logic 
    const fetchTicketDetails = async (ticketId: string) => {
        try {
            const res = await fetchWithAuth(`/api/support/tickets/${ticketId}`)
            if (res.ok) {
                const data = await res.json()
                setSelectedTicket(data.ticket)
                setTicketMessages(data.ticket.messages || [])
            }
        } catch (err) { console.error('Error fetching ticket:', err) }
    }

    const sendTicketMessage = async () => {
        if (!selectedTicket || (!ticketNewMessage.trim() && ticketAttachments.length === 0)) return
        const content = ticketNewMessage.trim()
        const internal = !selectedTicket.customerId ? true : isInternal
        const attachments = [...ticketAttachments]
        setTicketNewMessage(''); setTicketAttachments([])
        const tempId = 'temp-' + Date.now()
        setTicketMessages(prev => [...prev, { id: tempId, ticketId: selectedTicket.id, senderType: 'STAFF', senderName: 'Đang gửi...', content, attachments: attachments.map(a => a.fileUrl), isInternal: internal, createdAt: new Date().toISOString() }])
        try {
            const res = await fetchWithAuth(`/api/support/tickets/${selectedTicket.id}/messages`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ content, isInternal: internal, attachments })
            })
            if (!res.ok) { setTicketMessages(prev => prev.filter(m => m.id !== tempId)); setTicketNewMessage(content); setTicketAttachments(attachments) }
        } catch { setTicketMessages(prev => prev.filter(m => m.id !== tempId)) }
    }

    const handleTicketFileUpload = async (e: any) => {
        const file = e.target.files?.[0]
        if (!file) return
        setTicketUploading(true)
        const formData = new FormData(); formData.append('file', file)
        try {
            const res = await fetch('/api/upload', { method: 'POST', body: formData })
            const data = await res.json()
            if (data.success) setTicketAttachments(prev => [...prev, { fileName: data.fileName, fileUrl: data.fileUrl, fileType: data.fileType }])
        } finally { setTicketUploading(false); if (ticketFileInputRef.current) ticketFileInputRef.current.value = '' }
    }

    const updateTicketStatus = async (ticketId: string, status: string) => {
        try {
            const res = await fetchWithAuth(`/api/support/tickets/${ticketId}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status }) })
            if (res.ok) { toast.success('Đã cập nhật'); fetchTickets(); if (selectedTicket?.id === ticketId) fetchTicketDetails(ticketId) }
        } catch { toast.error('Lỗi cập nhật') }
    }

    const deleteConversation = async (convId: string) => {
        try {
            const res = await fetch(`/api/chat/conversations/${convId}`, {
                method: 'DELETE',
                headers: getAuthHeaders()
            })
            if (res.ok) {
                toast.success('Đã xóa cuộc hội thoại')
                setSelectedId(null)
                fetchConversations()
            } else {
                toast.error('Không thể xóa cuộc hội thoại')
            }
        } catch (err) {
            console.error('Delete error:', err)
            toast.error('Lỗi khi xóa cuộc hội thoại')
        }
    }

    const reportConversation = async (reason: string) => {
        if (!selectedId || !selectedConv) return
        const finalReason = reason === 'Lý do khác' ? customReason : reason
        if (!finalReason.trim()) {
            toast.error('Vui lòng nhập lý do')
            return
        }
        
        try {
            toast.loading('Đang gửi báo cáo...', { id: 'report' })
            
            // Get recent messages as evidence
            const recentMessages = messages.slice(-10).map(m => 
                `[${new Date(m.createdAt).toLocaleTimeString()}] ${m.senderName}: ${m.content || (m.fileUrl ? '[Tệp đính kèm]' : '')}`
            ).join('\n')

            // Get current admin info
            const meRes = await fetch('/api/auth/me', { headers: getAuthHeaders() })
            const me = await meRes.json()

            // Send to Dispute Center API
            const response = await fetch('/api/disputes', {
                method: 'POST',
                headers: {
                    ...getAuthHeaders(),
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    customerId: otherParticipantId?.startsWith('guest_') ? null : otherParticipantId,
                    type: 'CUSTOMER_TO_STORE',
                    reason: reason,
                    description: `Báo cáo từ Chat Admin${otherParticipantId?.startsWith('guest_') ? ` (GUEST ID: ${otherParticipantId})` : ''}: ${finalReason}\n\n--- BẰNG CHỨNG HỘI THOẠI ---\n${recentMessages}`,
                    evidence: [], // Can be extended to include real image URLs if needed
                    reporterId: me.id
                })
            })

            if (response.ok) {
                toast.success('Cảm ơn bạn! Báo cáo đã được gửi tới Trung tâm Khiếu nại & Báo cáo.', { id: 'report' })
                setShowReportModal(false)
                setReportReason('')
                setCustomReason('')
            } else {
                toast.error('Không thể gửi báo cáo. Vui lòng thử lại sau.', { id: 'report' })
            }
        } catch (err) {
            console.error('Report error:', err)
            toast.error('Lỗi khi gửi báo cáo', { id: 'report' })
        }
    }

    const banUser = async () => {
        if (!selectedId || !otherParticipantId) return
        if (!banReason.trim()) {
            toast.error('Vui lòng nhập lý do khóa')
            return
        }

        try {
            toast.loading('Đang xử lý khóa tài khoản...', { id: 'ban' })

            // Real ban for all users (Registered or Guest) via Restriction API
            const response = await fetch('/api/admin/integrity/restrictions', {
                method: 'POST',
                headers: {
                    ...getAuthHeaders(),
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    customerId: otherParticipantId,
                    type: banTarget === 'IP' ? 'IP_BAN' : 'FULL_BAN',
                    reason: banReason,
                    durationDays: banDuration
                })
            })

            if (response.ok) {
                const result = await response.json()
                toast.success('Đã khóa người dùng thành công.', { id: 'ban' })
                
                // Cập nhật UI ngay lập tức
                setIsRestricted(true)
                if (result.data?.id) {
                    setActiveRestrictionId(result.data.id)
                }
            } else {
                toast.error('Lỗi khi thực hiện lệnh khóa.', { id: 'ban' })
            }
            
            setShowBanModal(false)
            setBanReason('')
        } catch (err) {
            console.error('Ban error:', err)
            toast.error('Lỗi hệ thống khi thực hiện lệnh khóa', { id: 'ban' })
        }
    }

    const liftBan = async () => {
        // Nếu không có ID lệnh khóa nhưng đang bị restricted (có thể là Guest hoặc vừa khóa xong)
        // thì ta vẫn cho phép gỡ trạng thái UI
        if (!activeRestrictionId) {
            setIsRestricted(false)
            toast.success('Đã gỡ bỏ hạn chế tạm thời.', { id: 'unban' })
            return
        }
        
        try {
            toast.loading('Đang gỡ bỏ hạn chế...', { id: 'unban' })

            const response = await fetch('/api/admin/integrity/restrictions', {
                method: 'PATCH',
                headers: {
                    ...getAuthHeaders(),
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    restrictionId: activeRestrictionId,
                    action: 'LIFT',
                    reason: 'Admin gỡ khóa trực tiếp từ khung Chat'
                })
            })

            if (response.ok) {
                toast.success('Đã gỡ khóa tài khoản thành công.', { id: 'unban' })
                setIsRestricted(false)
                setActiveRestrictionId(null)
            } else {
                toast.error('Lỗi khi gỡ khóa tài khoản.', { id: 'unban' })
            }
        } catch (err) {
            console.error('Unban error:', err)
            toast.error('Lỗi hệ thống khi thực hiện lệnh gỡ khóa', { id: 'unban' })
        }
    }

    // Shared Helpers
    const isSlaBreached = (ticket: SupportTicket): boolean => !!(ticket.slaDeadline && ticket.status !== 'RESOLVED' && ticket.status !== 'CLOSED' && new Date(ticket.slaDeadline) < new Date())
    const formatDate = (date: string) => new Date(date).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
    const formatTime = (date: string) => new Date(date).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })

    const mapTicketsToChatMessages = (msgs: TicketMessage[]) => msgs.map(m => ({
        id: m.id, content: m.content, senderType: m.senderType === 'SYSTEM' ? 'system' : (m.senderType === 'STAFF' ? 'me' : 'other'),
        senderName: m.senderName || 'Người dùng', createdAt: m.createdAt, status: m.id.startsWith('temp-') ? 'sending' : 'sent',
        attachments: (m.attachments || []).map(a => ({ fileName: 'Đính kèm', fileUrl: a, fileType: '' })), isInternal: m.isInternal, internalLabel: 'Ghi chú nội bộ'
    }))

    const displayName = selectedConv ? (user?.id === selectedConv.participant1Id ? selectedConv.participant2Name : selectedConv.participant1Name) : ''

    // Render logic for messages
    const renderMessageContent = (msg: any) => {
        if (msg.fileUrl) {
            const isImage = msg.fileType?.startsWith('image/')
            if (isImage) return <div className="space-y-2"><img src={msg.fileUrl} className="max-w-[240px] rounded-xl cursor-pointer" onClick={() => window.open(msg.fileUrl, '_blank')} />{msg.content && <p className="text-sm">{msg.content}</p>}</div>
            return <a href={msg.fileUrl} target="_blank" className="flex items-center gap-3 p-3 bg-white/10 rounded-lg"><div className="bg-white/20 p-2 rounded"><FileText className="w-5 h-5 text-white" /></div><div className="flex-1 min-w-0"><p className="text-sm font-bold truncate">{msg.fileName}</p></div></a>
        }
        if (msg.content?.startsWith('[CALL_LOG]:')) {
            try {
                const log = JSON.parse(msg.content.replace('[CALL_LOG]:', ''))
                return <div className="flex flex-col gap-3 min-w-[220px]"><div className="flex items-center gap-4"><div className="w-12 h-12 flex justify-center items-center rounded-2xl bg-indigo-50 text-indigo-600">{log.type === 'video' ? <Video /> : <Phone />}</div><div><h4 className="font-black text-sm">{log.type === 'video' ? 'VIDEO CALL' : 'VOICE CALL'}</h4><p className="text-[11px] opacity-80">{Math.floor(log.duration / 60)}m {log.duration % 60}s</p></div></div></div>
            } catch { return <p className="text-sm">{msg.content}</p> }
        }
        return <p className="text-sm leading-relaxed">{msg.content}</p>
    }

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex h-[calc(100vh-160px)]">
            <Toaster position="top-right" />
            {user && <ChatCallManager userId={user.id} userName={user.name || 'Admin'} listenAdminSupport={true} />}

            <UnifiedSidebar 
                activeTab={activeTab} setActiveTab={(t) => {
                    setActiveTab(t); 
                    window.history.replaceState(null, '', `/admin/messages?tab=${t}`)
                }} 
                searchQuery={searchQuery} setSearchQuery={setSearchQuery}
                isSearching={isSearching} searchResults={searchResults} chatLoading={chatLoading} conversations={conversations}
                selectedId={selectedId} setSelectedId={setSelectedId} jumpToMessage={(cid, mid) => { setSelectedId(cid); setHighlightId(mid) }}
                handleSearch={handleSearch} formatLastMessage={c => c || 'Bắt đầu trò chuyện'} user={user}
                ticketSearch={ticketSearch} setTicketSearch={setTicketSearch} statusFilter={statusFilter} setStatusFilter={setStatusFilter}
                priorityFilter={priorityFilter} setPriorityFilter={setPriorityFilter} tickets={tickets} ticketsLoading={ticketsLoading}
                selectedTicketId={selectedTicket?.id} onSelectTicket={t => { setSelectedTicket(t); fetchTicketDetails(t.id) }} 
                fetchTickets={fetchTickets} statusConfig={STATUS_CONFIG} priorityConfig={PRIORITY_CONFIG} isSlaBreached={isSlaBreached}
            />

            {activeTab === 'chat' ? (
                <DirectChatView 
                    selectedConv={selectedConv} displayName={displayName} otherParticipantId={otherParticipantId} isGuestChat={!!otherParticipantId?.startsWith('guest_')}
                    messages={messages} newMessage={newMessage} setNewMessage={setNewMessage} sending={sending} uploading={uploading}
                    smartReplies={smartReplies} smartReplyLoading={smartReplyLoading} showMenu={showMenu} setShowMenu={setShowMenu}
                    showScrollButton={showScrollButton} setShowCustomerPanel={setShowCustomerPanel} showCustomerPanel={showCustomerPanel}
                    highlightId={highlightId} handleSendMessage={handleSendMessage} handleFileUpload={handleFileUpload} 
                    handleCall={t => { if ((window as any).__startCall) (window as any).__startCall(otherParticipantId, displayName, selectedId, t) }}
                    handleMenuAction={a => { 
                        if (a === 'info') setShowCustomerPanel(!showCustomerPanel)
                        if (a === 'delete') setShowDeleteConfirm(true)
                        if (a === 'report') setShowReportModal(true)
                        if (a === 'ban') {
                            const isGuest = !!otherParticipantId?.startsWith('guest_')
                            setBanTarget(isGuest ? 'IP' : 'ACCOUNT')
                            setShowBanModal(true)
                        }
                        if (a === 'unban') liftBan()
                    }} 
                    scrollToBottom={scrollToBottom} renderMessageContent={renderMessageContent} formatTime={formatTime}
                    messagesEndRef={messagesEndRef} scrollContainerRef={scrollContainerRef} fileInputRef={fileInputRef} menuRef={menuRef}
                    user={user} setSmartReplies={setSmartReplies} setHideSmartReplies={setHideSmartReplies} selectedId={selectedId} fetchConversations={fetchConversations}
                    handleTyping={handleTyping} partnerIsTyping={partnerIsTyping}
                    isRestricted={isRestricted}
                />
            ) : (
                <TicketChatView 
                    selectedTicket={selectedTicket} ticketMessages={ticketMessages} ticketNewMessage={ticketNewMessage} setTicketNewMessage={setTicketNewMessage}
                    isInternal={isInternal} setIsInternal={setIsInternal} ticketAttachments={ticketAttachments} setTicketAttachments={setTicketAttachments}
                    ticketUploading={ticketUploading} dismissGuestWarning={dismissGuestWarning} setDismissGuestWarning={setDismissGuestWarning}
                    updateTicketStatus={updateTicketStatus} sendTicketMessage={sendTicketMessage} handleTicketFileUpload={handleTicketFileUpload}
                    isSlaBreached={isSlaBreached} formatDate={formatDate} mapTicketsToChatMessages={mapTicketsToChatMessages}
                    statusConfig={STATUS_CONFIG} categoryLabels={CATEGORY_LABELS} ticketFileInputRef={ticketFileInputRef}
                />
            )}

            {activeTab === 'chat' && selectedConv && showCustomerPanel && otherParticipantId && (
                <CustomerContextPanel customerId={otherParticipantId} isGuest={!!otherParticipantId.startsWith('guest_')} onClose={() => setShowCustomerPanel(false)} />
            )}

            {/* Delete Confirmation Modal */}
            {showDeleteConfirm && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white rounded-3xl p-6 max-w-[360px] w-full shadow-2xl animate-in zoom-in-95 duration-200">
                        <div className="w-16 h-16 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mb-4 mx-auto">
                            <XCircle size={32} />
                        </div>
                        <h3 className="text-xl font-black text-slate-900 text-center mb-2">Xóa cuộc hội thoại?</h3>
                        <p className="text-slate-500 text-center text-xs font-medium mb-8 leading-relaxed">
                            Hành động này sẽ xóa toàn bộ lịch sử chat của <strong>{displayName}</strong>. Thao tác này không thể hoàn tác.
                        </p>
                        <div className="flex flex-col gap-2">
                            <button 
                                onClick={() => {
                                    if (selectedId) deleteConversation(selectedId)
                                    setShowDeleteConfirm(false)
                                }}
                                className="py-4 bg-rose-600 text-white rounded-2xl font-black text-xs hover:bg-rose-700 transition-all active:scale-95 shadow-lg shadow-rose-100"
                            >
                                XÁC NHẬN XÓA
                            </button>
                            <button 
                                onClick={() => setShowDeleteConfirm(false)}
                                className="py-4 bg-slate-50 text-slate-600 rounded-2xl font-black text-xs hover:bg-slate-100 transition-all active:scale-95"
                            >
                                HỦY BỎ
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Report Modal */}
            {showReportModal && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white rounded-3xl p-6 max-w-[400px] w-full shadow-2xl animate-in zoom-in-95 duration-200">
                        <div className="w-16 h-16 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-4 mx-auto">
                            <AlertTriangle size={32} />
                        </div>
                        <h3 className="text-xl font-black text-slate-900 text-center mb-2">Báo cáo vi phạm</h3>
                        <p className="text-slate-500 text-center text-xs font-medium mb-6 leading-relaxed">
                            Hãy chọn lý do bạn báo cáo cuộc hội thoại với <strong>{displayName}</strong>.
                        </p>
                        
                        <div className="grid grid-cols-1 gap-2 mb-4">
                            {['Spam / Quảng cáo', 'Ngôn từ không phù hợp', 'Quấy rối / Đe dọa', 'Vấn đề kỹ thuật', 'Lý do khác'].map(reason => (
                                <button 
                                    key={reason}
                                    onClick={() => setReportReason(reason)}
                                    className={`text-left px-4 py-3 rounded-xl text-xs font-bold transition-all border ${
                                        reportReason === reason 
                                        ? 'bg-indigo-50 text-indigo-600 border-indigo-200' 
                                        : 'bg-slate-50 text-slate-700 border-transparent hover:bg-slate-100'
                                    }`}
                                >
                                    {reason}
                                </button>
                            ))}
                        </div>

                        {reportReason === 'Lý do khác' && (
                            <div className="mb-6 animate-in slide-in-from-top-2 duration-200">
                                <textarea
                                    value={customReason}
                                    onChange={(e) => setCustomReason(e.target.value)}
                                    placeholder="Nhập lý do cụ thể của bạn..."
                                    className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-medium focus:bg-white focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all resize-none h-24"
                                    autoFocus
                                />
                            </div>
                        )}
                        
                        <div className="flex flex-col gap-2">
                            <button 
                                onClick={() => reportConversation(reportReason)}
                                disabled={!reportReason || (reportReason === 'Lý do khác' && !customReason.trim())}
                                className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black text-xs hover:bg-indigo-700 transition-all active:scale-95 shadow-lg shadow-indigo-100 disabled:bg-slate-200 disabled:text-slate-400 disabled:shadow-none"
                            >
                                GỬI BÁO CÁO
                            </button>
                            <button 
                                onClick={() => {
                                    setShowReportModal(false)
                                    setReportReason('')
                                    setCustomReason('')
                                }}
                                className="w-full py-4 bg-white text-slate-400 rounded-2xl font-black text-xs hover:text-slate-600 transition-all border border-slate-100"
                            >
                                HỦY BỎ
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {/* Ban Modal */}
            {showBanModal && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white rounded-3xl p-6 max-w-[400px] w-full shadow-2xl animate-in zoom-in-95 duration-200">
                        <div className="w-16 h-16 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mb-4 mx-auto">
                            <ShieldAlert size={32} />
                        </div>
                        <h3 className="text-xl font-black text-slate-900 text-center mb-2">Khóa tài khoản</h3>
                        <div className="flex items-center gap-4 mb-4">
                            <label className="text-xs font-bold text-slate-600">Đối tượng:</label>
                            <div className="flex bg-slate-50 p-1 rounded-xl border border-slate-100">
                                <button
                                    onClick={() => setBanTarget('ACCOUNT')}
                                    className={`px-4 py-1.5 rounded-lg text-[10px] font-black transition-all ${
                                        banTarget === 'ACCOUNT' ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-md shadow-indigo-200' : 'text-slate-400 hover:text-slate-600'
                                    }`}
                                >
                                    TÀI KHOẢN
                                </button>
                                <button
                                    onClick={() => setBanTarget('IP')}
                                    className={`px-4 py-1.5 rounded-lg text-[10px] font-black transition-all ${
                                        banTarget === 'IP' ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-md shadow-indigo-200' : 'text-slate-400 hover:text-slate-600'
                                    }`}
                                >
                                    ĐỊA CHỈ IP
                                </button>
                            </div>
                        </div>

                        {otherParticipantId?.startsWith('guest_') && banTarget === 'IP' && (
                            <div className="mt-3 mb-4 p-3 bg-amber-50 rounded-xl border border-amber-100 flex items-start gap-3 animate-in slide-in-from-top-1">
                                <AlertCircle size={14} className="text-amber-600 mt-0.5 flex-shrink-0" />
                                <p className="text-[10px] text-amber-700 font-medium leading-relaxed">
                                    <strong>Gợi ý:</strong> Đối với khách vãng lai, chặn IP là phương pháp triệt để nhất để ngăn họ quay lại.
                                </p>
                            </div>
                        )}

                        <p className="text-slate-500 text-center text-xs font-medium mb-6 leading-relaxed">
                            Chọn thời hạn và lý do khóa tài khoản của <strong>{displayName}</strong>.
                        </p>

                        <div className="grid grid-cols-3 gap-2 mb-4">
                            {[
                                { label: '24 Giờ', value: 1 },
                                { label: '7 Ngày', value: 7 },
                                { label: 'Vĩnh viễn', value: null }
                            ].map(opt => (
                                <button
                                    key={String(opt.value)}
                                    onClick={() => setBanDuration(opt.value)}
                                    className={`py-2.5 rounded-xl text-xs font-bold transition-all border ${
                                        banDuration === opt.value 
                                        ? 'bg-rose-600 text-white border-rose-600 shadow-md shadow-rose-100' 
                                        : 'bg-slate-50 text-slate-600 border-transparent hover:bg-slate-100'
                                    }`}
                                >
                                    {opt.label}
                                </button>
                            ))}
                        </div>

                        <div className="mb-6">
                            <textarea
                                value={banReason}
                                onChange={(e) => setBanReason(e.target.value)}
                                placeholder="Nhập lý do khóa tài khoản..."
                                className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-medium focus:bg-white focus:ring-2 focus:ring-rose-500/10 focus:border-rose-500 outline-none transition-all resize-none h-24"
                            />
                        </div>
                        
                        <div className="flex flex-col gap-2">
                            <button 
                                onClick={() => banUser()}
                                disabled={!banReason.trim()}
                                className="w-full py-4 bg-rose-600 text-white rounded-2xl font-black text-xs hover:bg-rose-700 transition-all active:scale-95 shadow-lg shadow-rose-100 disabled:bg-slate-200 disabled:text-slate-400 disabled:shadow-none"
                            >
                                XÁC NHẬN KHÓA
                            </button>
                            <button 
                                onClick={() => {
                                    setShowBanModal(false)
                                    setBanReason('')
                                }}
                                className="w-full py-4 bg-white text-slate-400 rounded-2xl font-black text-xs hover:text-slate-600 transition-all border border-slate-100"
                            >
                                HỦY BỎ
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

export default function AdminMessagesPage() {
    return (
        <Suspense fallback={<div className="h-96 flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-indigo-600" /></div>}>
            <MessagesContent />
        </Suspense>
    )
}
