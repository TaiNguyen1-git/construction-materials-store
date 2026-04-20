'use client'

import { useState, useEffect, Suspense, useRef, useCallback } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import {
    Loader2, AlertCircle, RefreshCw, Clock, CheckCircle, XCircle, AlertTriangle
} from 'lucide-react'
import { getAuthHeaders, fetchWithAuth } from '@/lib/api-client'
import { getFirebaseDatabase } from '@/lib/firebase'
import { ref, onChildAdded, off } from 'firebase/database'
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

    const menuRef = useRef<HTMLDivElement>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)
    const messagesEndRef = useRef<HTMLDivElement>(null)
    const scrollContainerRef = useRef<HTMLDivElement>(null)

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

    // Sync with URL
    useEffect(() => {
        const tab = searchParams.get('tab')
        if (tab === 'tickets') setActiveTab('tickets')
        else setActiveTab('chat')
        const id = searchParams.get('id')
        if (id) {
            if (tab === 'tickets') fetchTicketDetails(id)
            else setSelectedId(id)
        }
    }, [searchParams])

    // Load Chat Data
    useEffect(() => { if (user) fetchConversations() }, [user])

    useEffect(() => {
        if (!selectedId) return
        const db = getFirebaseDatabase()
        const messagesRef = ref(db, `conversations/${selectedId}/messages`)
        fetchMessages(selectedId)
        const unsub = onChildAdded(messagesRef, (snapshot) => {
            const newMsg = snapshot.val()
            if (newMsg) {
                newMsg.id = newMsg.id || snapshot.key
                setMessages(prev => {
                    if (prev.some(m => m.id === newMsg.id || (m.tempId && m.tempId === newMsg.tempId))) {
                        return prev.map(m => (m.tempId === newMsg.tempId ? newMsg : m))
                    }
                    return [...prev, newMsg]
                })
            }
        })
        return () => off(messagesRef)
    }, [selectedId])

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
                if (json.data.length !== messages.length || !quiet) {
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

    const handleSendMessage = async (e?: any, fileData?: any) => {
        if (e) e.preventDefault()
        const content = newMessage.trim()
        if (!content && !fileData) return
        const tempId = 'temp-' + Date.now()
        setMessages(prev => [...prev, { id: tempId, tempId, senderId: user?.id, senderName: user?.name || 'Admin', content, fileUrl: fileData?.fileUrl, createdAt: new Date().toISOString(), isSending: true }])
        setNewMessage(''); scrollToBottom()
        try {
            const res = await fetch('/api/chat/messages', {
                method: 'POST',
                headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
                body: JSON.stringify({ conversationId: selectedId, content, fileUrl: fileData?.fileUrl, fileName: fileData?.fileName, fileType: fileData?.fileType, tempId, senderId: user?.id })
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

    // Shared Helpers
    const isSlaBreached = (ticket: SupportTicket): boolean => !!(ticket.slaDeadline && ticket.status !== 'RESOLVED' && ticket.status !== 'CLOSED' && new Date(ticket.slaDeadline) < new Date())
    const formatDate = (date: string) => new Date(date).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
    const formatTime = (date: string) => new Date(date).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })

    const mapTicketsToChatMessages = (msgs: TicketMessage[]) => msgs.map(m => ({
        id: m.id, content: m.content, senderType: m.senderType === 'SYSTEM' ? 'system' : (m.senderType === 'STAFF' ? 'me' : 'other'),
        senderName: m.senderName || 'Người dùng', createdAt: m.createdAt, status: m.id.startsWith('temp-') ? 'sending' : 'sent',
        attachments: (m.attachments || []).map(a => ({ fileName: 'Đính kèm', fileUrl: a, fileType: '' })), isInternal: m.isInternal, internalLabel: 'Ghi chú nội bộ'
    }))

    const selectedConv = conversations.find(c => c.id === selectedId)
    const displayName = selectedConv ? (user?.id === selectedConv.participant1Id ? selectedConv.participant2Name : selectedConv.participant1Name) : ''
    const otherParticipantId = selectedConv ? (user?.id === selectedConv.participant1Id ? selectedConv.participant2Id : selectedConv.participant1Id) : null

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
                    router.push(`/admin/messages?tab=${t}`, { scroll: false })
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
                    handleMenuAction={a => { if (a === 'info') setShowCustomerPanel(!showCustomerPanel) }}
                    scrollToBottom={scrollToBottom} renderMessageContent={renderMessageContent} formatTime={formatTime}
                    messagesEndRef={messagesEndRef} scrollContainerRef={scrollContainerRef} fileInputRef={fileInputRef} menuRef={menuRef}
                    user={user} setSmartReplies={setSmartReplies} setHideSmartReplies={setHideSmartReplies} selectedId={selectedId} fetchConversations={fetchConversations}
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
