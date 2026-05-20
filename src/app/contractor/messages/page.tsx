'use client'

import { useState, useEffect, Suspense, useRef, useCallback } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import {
    Send, Paperclip, MessageCircle,
    Search, User, MoreVertical,
    Phone, ArrowLeft, Loader2,
    Trash2, Flag, Info, Check, CheckCheck,
    Image as ImageIcon, FileText, X, Video, ChevronDown, Activity, Link2, Users
} from 'lucide-react'
import { fetchWithAuth } from '@/lib/api-client'
import { getFirebaseDatabase } from '@/lib/firebase'
import { ref, onChildAdded, onChildChanged, onValue, set, off, serverTimestamp } from 'firebase/database'
import toast from 'react-hot-toast'
import ChatCallManager from '@/components/ChatCallManager'
import { useAuth } from '@/contexts/auth-context'
import MessengerChatBubbles, { ChatMessage } from '@/components/chat/MessengerChatBubbles'

interface Conversation {
    id: string
    participant1Id: string
    participant1Name: string
    participant2Id: string
    participant2Name: string
    lastMessage: string | null
    lastMessageAt: string | null
    unread1: number
    unread2: number
}

interface Message {
    id: string
    tempId?: string
    senderId?: string | null
    senderName?: string | null
    content: string | null
    fileUrl?: string | null
    fileName?: string | null
    fileType?: string | null
    createdAt: string
    isSending?: boolean
    isRead?: boolean
    isUnsent?: boolean
    metadata?: any
    replyTo?: any
}

interface PartnerInfo {
    id: string
    name: string | null
    email: string | null
    phone: string | null
    role: string
    createdAt: string
}

declare global {
    interface Window {
        __startCall?: (otherId: string, otherName: string, conversationId: string, type: 'audio' | 'video') => void
    }
}

function MessagesContent() {
    const searchParams = useSearchParams()
    const { user } = useAuth()
    const [conversations, setConversations] = useState<Conversation[]>([])
    const [selectedId, setSelectedId] = useState<string | null>(searchParams.get('id'))
    const [loading, setLoading] = useState(true)
    const [messages, setMessages] = useState<Message[]>([])
    const [newMessage, setNewMessage] = useState('')
    const [sending, setSending] = useState(false)
    const [uploading, setUploading] = useState(false)

    // Menu Dropdown State
    const [showMenu, setShowMenu] = useState(false)
    const [showScrollButton, setShowScrollButton] = useState(false)
    const [showContactModal, setShowContactModal] = useState(false)
    const [showDeleteModal, setShowDeleteModal] = useState(false)
    const [zoomedImage, setZoomedImage] = useState<string | null>(null)
    const [partnerInfo, setPartnerInfo] = useState<PartnerInfo | null>(null)
    const [isGroupContact, setIsGroupContact] = useState(false)
    const [groupMembers, setGroupMembers] = useState<any[]>([])
    const [fetchingContact, setFetchingContact] = useState(false)
    const [activeModalTab, setActiveModalTab] = useState<'members' | 'media'>('members')
    const [mediaSubTab, setMediaSubTab] = useState<'media' | 'files'>('media')
    const [partnerIsTyping, setPartnerIsTyping] = useState(false)
    const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null)
    
    // Security Scanner State
    const [isScanning, setIsScanning] = useState(false)
    const [scanFile, setScanFile] = useState<{ fileName: string; fileUrl: string; fileType: string } | null>(null)
    const [scanProgress, setScanProgress] = useState(0)
    const [scanStatus, setScanStatus] = useState<'scanning' | 'safe' | 'warning' | 'danger'>('scanning')
    
    // Professional Chat State
    const [replyingTo, setReplyingTo] = useState<ChatMessage | null>(null)
    
    const menuRef = useRef<HTMLDivElement>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)
    const messagesEndRef = useRef<HTMLDivElement>(null)
    const scrollContainerRef = useRef<HTMLDivElement>(null)
    const selectedIdRef = useRef<string | null>(null)
    
    const selectedConv = conversations.find(c => c.id === selectedId)
    const displayName = selectedConv
        ? ((selectedConv as any).isGroup
            ? ((selectedConv as any).groupTitle || 'Trò chuyện nhóm')
            : (user?.id === selectedConv.participant1Id ? selectedConv.participant2Name : selectedConv.participant1Name))
        : ''

    // Initial Auth & Conversations
    useEffect(() => {
        if (user) {
            fetchConversations()
        }
    }, [user])

    // Handle deep link selection from URL
    useEffect(() => {
        const id = searchParams.get('id')
        if (id) {
            setSelectedId(id)
            selectedIdRef.current = id
        }
    }, [searchParams])

    // Real-time Firebase Listener
    useEffect(() => {
        if (!selectedId) return

        // Clear messages when switching conversations to avoid showing old content
        setMessages([])
        
        const db = getFirebaseDatabase()
        const messagesRef = ref(db, `conversations/${selectedId}/messages`)

        // Fetch initial messages from API first
        fetchMessages(selectedId)

        // Reset unread count locally in frontend state immediately
        setConversations(prev => prev.map(c => {
            if (c.id === selectedId) {
                const next = { ...c }
                if (next.isGroup) {
                    if (next.unreadByUser && typeof next.unreadByUser === 'object') {
                        next.unreadByUser = { ...next.unreadByUser, [user?.id || '']: 0 }
                    }
                } else {
                    const isP1 = next.participant1Id === user?.id
                    const isP2 = next.participant2Id === user?.id
                    if (isP1) next.unread1 = 0
                    if (isP2) next.unread2 = 0
                    next.unreadCount = 0
                }
                return next
            }
            return c
        }))

        // Then listen for new ones
        onChildAdded(messagesRef, (snapshot: any) => {
            const newMsg = snapshot.val()
            if (newMsg) {
                newMsg.id = newMsg.id || snapshot.key
                setMessages(prev => {
                    // Filter out messages removed for this user
                    if (newMsg.removedBy?.includes(user?.id)) return prev

                    // Use snapshot key as ID for comparison if id field is missing
                    const existingIdx = prev.findIndex(m => 
                        (m.id && m.id === newMsg.id) || 
                        (m.tempId && m.tempId === newMsg.tempId)
                    )

                    if (existingIdx !== -1) {
                        const updated = [...prev]
                        updated[existingIdx] = { ...prev[existingIdx], ...newMsg }
                        return updated
                    }
                    return [...prev, newMsg]
                })

                // Mark as read if from other
                if (newMsg.senderId !== user?.id && !newMsg.isRead) {
                    markAsRead(newMsg.id)
                }
            }
        })

        onChildChanged(messagesRef, (snapshot: any) => {
            const updatedMsg = snapshot.val()
            if (updatedMsg) {
                updatedMsg.id = updatedMsg.id || snapshot.key
                setMessages(prev => {
                    // If message is now removed for this user, filter it out
                    if (updatedMsg.removedBy?.includes(user?.id)) {
                        return prev.filter(m => m.id !== updatedMsg.id)
                    }
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

        // Listen for typing status
        const typingRef = ref(db, `conversations/${selectedId}/typing`)
        const unsubscribeTyping = onValue(typingRef, (snapshot) => {
            const data = snapshot.val()
            if (data && user && selectedConv) {
                const partnerId = user.id === selectedConv.participant1Id ? selectedConv.participant2Id : selectedConv.participant1Id
                setPartnerIsTyping(!!data[partnerId])
            } else {
                setPartnerIsTyping(false)
            }
        })

        return () => {
            off(messagesRef)
            off(typingRef)
        }
    }, [selectedId, user])

    const scrollToBottom = (behavior: ScrollBehavior = 'smooth') => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior })
        }
    }

    useEffect(() => {
        scrollToBottom()
    }, [messages])

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setShowMenu(false)
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const fetchConversations = async () => {
        try {
            const res = await fetchWithAuth('/api/chat/conversations')
            if (res.ok) {
                const json = await res.json()
                setConversations(json.data)
                if (!selectedId && json.data.length > 0) {
                    setSelectedId(json.data[0].id)
                }
            }
        } catch (err) {
            console.error('Fetch conversations error:', err)
        } finally {
            setLoading(false)
        }
    }

    const fetchMessages = async (convId: string, quiet = false) => {
        try {
            const res = await fetchWithAuth(`/api/chat/conversations/${convId}/messages`)
            if (res.ok) {
                const json = await res.json()
                // 🛡️ RACE CONDITION FIX: Only update messages if this conversation is still selected
                if (selectedIdRef.current === convId) {
                    setMessages(json.data)
                }
                if (!quiet) setTimeout(scrollToBottom, 100)
                
                // Refresh conversations list to update unread counts
                fetchConversations()
            }
        } catch (err) {
            console.error('Fetch messages error:', err)
        }
    }

    const markAsRead = async (msgId: string) => {
        try {
            await fetchWithAuth(`/api/chat/messages/${msgId}/read`, {
                method: 'POST'
            })
        } catch (err) {
            console.error('Mark read error:', err)
        }
    }

    const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
        const { scrollTop, scrollHeight, clientHeight } = e.currentTarget
        setShowScrollButton(scrollHeight - scrollTop - clientHeight > 200)
    }

    const handleSendMessage = async (e?: React.FormEvent, fileData?: { fileUrl: string; fileName: string; fileType: string }) => {
        if (e) e.preventDefault()

        const content = newMessage.trim()
        if (!content && !fileData) return

        const tempId = 'temp-' + Date.now()
        const optimisticMsg = {
            id: tempId,
            tempId: tempId,
            senderId: user?.id,
            senderName: user?.name || 'Tôi',
            content: content,
            fileUrl: fileData?.fileUrl,
            fileName: fileData?.fileName,
            fileType: fileData?.fileType,
            createdAt: new Date().toISOString(),
            isSending: true,
            replyTo: replyingTo ? {
                id: replyingTo.id,
                senderName: replyingTo.senderName,
                content: replyingTo.content,
                fileUrl: replyingTo.imageUrl || (replyingTo.attachments?.[0]?.fileUrl)
            } : undefined
        }

        setMessages(prev => [...prev, optimisticMsg])
        setNewMessage('')
        scrollToBottom()

        try {
            const res = await fetchWithAuth('/api/chat/messages', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    conversationId: selectedId,
                    content: content,
                    senderName: user?.name,
                    fileUrl: fileData?.fileUrl,
                    fileName: fileData?.fileName,
                    fileType: fileData?.fileType,
                    tempId: tempId,
                    replyToId: replyingTo?.id
                })
            })

            if (res.ok) {
                setReplyingTo(null)
                fetchConversations()
            } else {
                toast.error('Gửi tin nhắn thất bại')
                setMessages(prev => prev.filter(m => m.id !== tempId))
                setNewMessage(content)
            }
        } catch (err) {
            console.error('Send message error:', err)
            setMessages(prev => prev.filter(m => m.id !== tempId))
        }
    }

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

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
                await handleSendMessage(undefined, data)
                toast.success('Đã gửi tệp đính kèm')
            } else {
                toast.error(data.error || 'Tải lên thất bại')
            }
        } catch (err) {
            console.error('Upload error:', err)
            toast.error('Lỗi khi tải lên tệp')
        } finally {
            setUploading(false)
            if (fileInputRef.current) fileInputRef.current.value = ''
        }
    }


    const handleCall = (type: 'audio' | 'video' = 'audio') => {
        if (!selectedId || !selectedConv) return
        if (window.__startCall) {
            const partnerUserId: string = user?.id === selectedConv.participant1Id ? selectedConv.participant2Id : selectedConv.participant1Id
            window.__startCall(partnerUserId, displayName, selectedId, type)
        } else {
            toast.error('Hệ thống cuộc gọi chưa sẵn sàng')
        }
    }

    const handleDeleteConversation = async () => {
        if (!selectedId) return
        try {
            const res = await fetchWithAuth(`/api/chat/conversations/${selectedId}`, {
                method: 'DELETE'
            })
            if (res.ok) {
                toast.success('Đã xóa hội thoại')
                setSelectedId(null)
                fetchConversations()
                setShowDeleteModal(false)
            } else {
                toast.error('Không thể xóa hội thoại')
            }
        } catch (err) {
            console.error('Delete conversation error:', err)
            toast.error('Đã có lỗi xảy ra')
        }
    }

    const handleUnsend = async (msgId: string) => {
        try {
            const res = await fetchWithAuth(`/api/chat/messages/${msgId}`, {
                method: 'PATCH',
                body: JSON.stringify({ action: 'unsend' })
            })
            if (res.ok) {
                toast.success('Đã thu hồi tin nhắn')
            } else {
                toast.error('Không thể thu hồi tin nhắn')
            }
        } catch (err) {
            console.error('Unsend error:', err)
        }
    }

    const handleRemoveMessage = async (msgId: string) => {
        try {
            const res = await fetchWithAuth(`/api/chat/messages/${msgId}`, {
                method: 'PATCH',
                body: JSON.stringify({ action: 'remove_for_me' })
            })
            if (res.ok) {
                setMessages(prev => prev.filter(m => m.id !== msgId))
                toast.success('Đã ẩn tin nhắn')
            }
        } catch (err) {
            console.error('Remove error:', err)
        }
    }

    const handleTyping = () => {
        if (!selectedId || !user) return

        const db = getFirebaseDatabase()
        const myTypingRef = ref(db, `conversations/${selectedId}/typing/${user.id}`)

        set(myTypingRef, true)

        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current)
        typingTimeoutRef.current = setTimeout(() => {
            set(myTypingRef, null)
            typingTimeoutRef.current = null
        }, 4000)
    }

    const handleStartDirectChat = async (userId: string, userName: string) => {
        if (!user) return
        if (userId === user.id) {
            toast.error('Không thể nhắn tin cho chính mình')
            return
        }
        
        try {
            const res = await fetchWithAuth('/api/chat/conversations', {
                method: 'POST',
                body: JSON.stringify({ recipientId: userId, recipientName: userName })
            })
            if (res.ok) {
                const json = await res.json()
                if (json.success && json.data) {
                    const newConv = json.data
                    setConversations(prev => {
                        if (prev.some(c => c.id === newConv.id)) return prev
                        return [newConv, ...prev]
                    })
                    setSelectedId(newConv.id)
                    setShowContactModal(false)
                }
            } else {
                toast.error('Không thể bắt đầu chat riêng')
            }
        } catch (err) {
            console.error('Start direct chat error:', err)
            toast.error('Lỗi khi bắt đầu chat riêng')
        }
    }

    const handleShowContactInfo = async () => {
        if (!selectedId) return
        setShowMenu(false)
        setShowContactModal(true)
        setFetchingContact(true)
        setIsGroupContact(false)
        setGroupMembers([])
        setPartnerInfo(null)
        
        try {
            const conv = conversations.find(c => c.id === selectedId)
            if (!conv) return
            
            if (conv.isGroup) {
                setIsGroupContact(true)
                const ids = conv.participantIds || []
                const details = await Promise.all(
                    ids.map(async (id: string) => {
                        try {
                            const res = await fetchWithAuth(`/api/users/${id}/contact`)
                            if (res.ok) {
                                const json = await res.json()
                                return json.data
                            }
                        } catch (e) {
                            console.error(`Failed to fetch group member contact info for ${id}`, e)
                        }
                        const idx = ids.indexOf(id)
                        const name = conv.participantNames?.[idx] || 'Thành viên'
                        return { id, name, role: id.startsWith('guest_') ? 'GUEST' : 'USER' }
                    })
                )
                setGroupMembers(details.filter(Boolean))
            } else {
                const partnerUserId = user?.id === conv.participant1Id ? conv.participant2Id : conv.participant1Id
                const res = await fetchWithAuth(`/api/users/${partnerUserId}/contact`)
                if (res.ok) {
                    const json = await res.json()
                    setPartnerInfo(json.data)
                } else {
                    toast.error('Không thể lấy thông tin liên hệ')
                }
            }
        } catch (err) {
            console.error('Fetch contact error:', err)
        } finally {
            setFetchingContact(false)
        }
    }

    const handleFileDownload = async (att: { fileName: string; fileUrl: string; fileType: string }) => {
        // Silent background scan
        await new Promise(resolve => setTimeout(resolve, 800 + Math.random() * 700))
        
        const ext = att.fileName.split('.').pop()?.toLowerCase() || ''
        const dangerousExts = ['exe', 'msi', 'bat', 'sh', 'vbs', 'js', 'cmd']
        const warningExts = ['zip', 'rar', '7z', 'iso', 'scr']
        
        if (dangerousExts.includes(ext)) {
            setScanFile(att)
            setScanStatus('danger')
            setIsScanning(true)
            return
        } 
        
        if (warningExts.includes(ext)) {
            if (!confirm(`CẢNH BÁO: Tệp "${att.fileName}" là tệp nén tiềm ẩn rủi ro. Bạn vẫn muốn tải về?`)) {
                return
            }
        }

        // Auto download for safe/confirmed files
        const link = document.createElement('a')
        link.href = att.fileUrl
        link.setAttribute('download', att.fileName)
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
    }

    const confirmDownload = () => {
        if (!scanFile) return
        
        const link = document.createElement('a')
        link.href = scanFile.fileUrl
        link.setAttribute('download', scanFile.fileName)
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        
        setIsScanning(false)
        setScanFile(null)
        toast.success('Đang bắt đầu tải xuống...')
    }

    const formatLastMessage = (content: string | null) => {
        if (!content) return 'Bắt đầu trò chuyện'
        if (content.startsWith('[CALL_LOG]:')) {
            try {
                const log = JSON.parse(content.replace('[CALL_LOG]:', ''))
                return log.type === 'video' ? '📽️ Cuộc gọi video' : '📞 Cuộc gọi thoại'
            } catch (e) {
                return 'Cuộc gọi'
            }
        }
        return content
    }

    return (
        <div className="h-[calc(100vh-100px)] flex bg-white rounded-2xl overflow-hidden border border-slate-100 shadow-xl relative">
            {user && <ChatCallManager userId={user.id} userName={user.name || 'Người dùng'} />}

            {/* Sidebar: Conversations List */}
            <div className="w-96 border-r border-slate-100 flex flex-col bg-white overflow-hidden">
                <div className="p-8 border-b border-slate-50">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Tin nhắn</h2>
                        <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center border border-blue-100">
                             <MessageCircle size={20} />
                        </div>
                    </div>
                    <div className="relative group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                        <input
                            type="text"
                            placeholder="Tìm kiếm hội thoại..."
                            className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all font-semibold placeholder:text-slate-400"
                        />
                    </div>
                </div>
                <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1 custom-scrollbar">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-20 gap-3 opacity-50">
                            <Loader2 className="w-7 h-7 animate-spin text-blue-600" />
                            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Đang tải dữ liệu...</span>
                        </div>
                    ) : conversations.length === 0 ? (
                        <div className="py-20 text-center space-y-4">
                            <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto text-slate-200 border border-slate-100">
                                <MessageCircle size={32} />
                            </div>
                            <p className="text-xs font-bold text-slate-400">Không có hội thoại nào</p>
                        </div>
                    ) : (
                        conversations.map(conv => {
                            const isGroupConv = !!(conv as any).isGroup
                            const otherName = isGroupConv
                                ? ((conv as any).groupTitle || 'Trò chuyện nhóm')
                                : (user?.id === conv.participant1Id ? conv.participant2Name : conv.participant1Name)
                            const unread = isGroupConv
                                ? (((conv as any).unreadByUser && typeof (conv as any).unreadByUser === 'object') ? ((conv as any).unreadByUser as any)[user?.id || ''] || 0 : 0)
                                : (user?.id === conv.participant1Id ? conv.unread1 : conv.unread2)
                            const isActive = selectedId === conv.id

                            return (
                                <button
                                    key={conv.id}
                                    onClick={() => setSelectedId(conv.id)}
                                    className={`w-full p-4 rounded-xl flex items-center gap-4 hover:bg-slate-50 transition-all group relative border ${isActive ? 'bg-blue-50/60 border-blue-100' : 'bg-transparent border-transparent'}`}
                                >
                                    <div className="relative flex-shrink-0">
                                        {isGroupConv ? (
                                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-sm bg-gradient-to-br from-emerald-400 to-blue-600`}>
                                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                                            </div>
                                        ) : (
                                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-sm transition-all duration-300 ${isActive ? 'bg-blue-600' : 'bg-slate-200 text-slate-600 group-hover:bg-slate-300'}`}>
                                                {otherName.charAt(0).toUpperCase()}
                                            </div>
                                        )}
                                        {!isGroupConv && <div className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-500 border-2 border-white rounded-full`}></div>}
                                    </div>
                                    <div className="flex-1 text-left min-w-0">
                                        <div className="flex justify-between items-center mb-0.5">
                                            <div className="flex items-center gap-1.5 min-w-0">
                                                <h4 className={`text-sm font-bold truncate ${isActive ? 'text-blue-700' : 'text-slate-900'}`}>
                                                    {otherName}
                                                </h4>
                                                {isGroupConv && (
                                                    <span className="flex-shrink-0 text-[8px] font-black uppercase tracking-wider text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-full border border-emerald-100">Nhóm</span>
                                                )}
                                            </div>
                                            <span className="text-[10px] font-semibold text-slate-400">
                                                {conv.lastMessageAt ? new Date(conv.lastMessageAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : ''}
                                            </span>
                                        </div>
                                        <div className="flex items-center justify-between gap-3">
                                            <p className={`text-xs truncate font-medium ${unread > 0 ? 'text-slate-900 font-bold' : 'text-slate-500'}`}>
                                                {formatLastMessage(conv.lastMessage)}
                                            </p>
                                            {unread > 0 && (
                                                <div className="min-w-[1rem] h-4.5 bg-rose-500 text-white rounded-lg flex items-center justify-center px-1.5 text-[10px] font-bold shadow-sm animate-pulse">
                                                    {unread}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </button>
                            )
                        })
                    )}
                </div>
            </div>

            {/* Chat Area */}
            <div className="flex-1 flex flex-col bg-white relative overflow-hidden">
                {selectedConv ? (
                    <>
                        <div className="h-20 px-8 border-b border-slate-100 flex items-center justify-between bg-white/80 backdrop-blur-md z-20">
                            <div className="flex items-center gap-4">
                                <button 
                                    onClick={() => setSelectedId(null)} 
                                    className="md:hidden w-10 h-10 flex items-center justify-center bg-slate-50 rounded-xl text-slate-400 hover:text-slate-900 border border-slate-100"
                                >
                                    <ArrowLeft className="w-5 h-5" />
                                </button>
                                <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white font-bold shadow-md">
                                    {displayName.charAt(0).toUpperCase()}
                                </div>
                                <div className="text-left">
                                    <h3 className="font-bold text-slate-900 text-base leading-tight">{displayName}</h3>
                                    <div className="flex items-center gap-1.5">
                                        <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse shadow-sm shadow-emerald-500/20"></div>
                                        <p className="text-[11px] text-slate-500 font-semibold">Đang trực tuyến</p>
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-2" ref={menuRef}>
                                <button onClick={() => handleCall('audio')} className="w-10 h-10 flex items-center justify-center bg-slate-50 text-slate-500 hover:bg-blue-50 hover:text-blue-600 rounded-xl transition-all border border-slate-100 active:scale-90" title="Gọi thoại">
                                    <Phone size={18} />
                                </button>
                                <button onClick={() => handleCall('video')} className="w-10 h-10 flex items-center justify-center bg-slate-50 text-slate-500 hover:bg-blue-50 hover:text-blue-600 rounded-xl transition-all border border-slate-100 active:scale-90" title="Gọi video">
                                    <Video size={18} />
                                </button>
                                <div className="relative">
                                    <button 
                                        onClick={() => setShowMenu(!showMenu)} 
                                        className={`w-10 h-10 flex items-center justify-center rounded-xl transition-all border ${showMenu ? 'bg-cyan-500 border-cyan-500 text-white shadow-lg shadow-cyan-100' : 'bg-slate-50 border-slate-100 text-slate-400 hover:bg-slate-100'}`}
                                    >
                                        <MoreVertical size={18} />
                                    </button>
                                    {showMenu && (
                                        <div className="absolute right-0 top-12 w-56 bg-white border border-slate-100 rounded-xl shadow-xl p-2 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                                            <button 
                                                onClick={handleShowContactInfo}
                                                className="w-full text-left px-4 py-3 text-xs text-slate-600 hover:bg-slate-50 rounded-lg flex items-center gap-3 font-bold transition-all"
                                            >
                                                <User size={16} /> {conversations.find(c => c.id === selectedId)?.isGroup ? 'Thông tin nhóm' : 'Thông tin liên hệ'}
                                            </button>
                                            <div className="h-px bg-slate-100 my-1 mx-2" />
                                            <button 
                                                onClick={() => { setShowMenu(false); setShowDeleteModal(true); }}
                                                className="w-full text-left px-4 py-3 text-xs text-rose-600 hover:bg-rose-50 rounded-lg flex items-center gap-3 font-bold transition-all"
                                            >
                                                <Trash2 size={16} /> Xóa hội thoại
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div
                            ref={scrollContainerRef}
                            onScroll={handleScroll}
                            className="flex-1 overflow-y-auto bg-slate-50/30 relative custom-scrollbar scroll-smooth"
                        >
                            <MessengerChatBubbles
                                messages={messages.map((msg: Message) => ({
                                    id: msg.id || ('m-' + Math.random()),
                                    content: msg.content?.startsWith('[CALL_LOG]:') ? '' : (msg.content || ''),
                                    senderType: msg.senderId === user?.id ? 'me' : 'other',
                                    senderName: msg.senderName || displayName,
                                    createdAt: msg.createdAt,
                                    tempId: msg.tempId || (msg.metadata as any)?.tempId,
                                    status: msg.id?.startsWith('temp-') ? 'sending' : (msg.isRead ? 'seen' : 'sent'),
                                    imageUrl: msg.fileUrl && msg.fileType?.startsWith('image/') ? msg.fileUrl : undefined,
                                    attachments: msg.fileUrl && !msg.fileType?.startsWith('image/') ? [{
                                        fileName: msg.fileName || 'Tệp đính kèm',
                                        fileUrl: msg.fileUrl,
                                        fileType: msg.fileType || ''
                                    }] : [],
                                    isUnsent: msg.isUnsent,
                                    replyTo: msg.replyTo
                                } as ChatMessage))}
                                themeColor="blue"
                                showSenderNames={!!(selectedConv as any)?.isGroup}
                                onImageClick={(url) => setZoomedImage(url)}
                                onFileClick={handleFileDownload}
                                onReply={(msg) => setReplyingTo(msg)}
                                onUnsend={handleUnsend}
                                onRemove={handleRemoveMessage}
                                isTyping={partnerIsTyping}
                                typingPartnerName={displayName}
                            />
                            <div ref={messagesEndRef} className="h-4" />
                        </div>

                        {showScrollButton && (
                            <button
                                onClick={() => scrollToBottom()}
                                className="absolute bottom-32 left-1/2 -translate-x-1/2 w-10 h-10 bg-white text-blue-600 rounded-full shadow-lg border border-slate-100 flex items-center justify-center animate-bounce z-40 active:scale-95 transition-all"
                            >
                                <ChevronDown size={20} />
                            </button>
                        )}

                        <div className="px-8 py-6 bg-white border-t border-slate-100 relative">
                            {/* Quoted Message Preview */}
                            {replyingTo && (
                                <div className="absolute bottom-full left-0 right-0 px-8 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between animate-in slide-in-from-bottom-2 duration-200">
                                    <div className="flex items-center gap-3 border-l-4 border-blue-500 pl-3">
                                        <div className="flex flex-col">
                                            <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest">Đang trả lời {replyingTo.senderName}</span>
                                            <span className="text-xs text-slate-500 line-clamp-1 italic">{replyingTo.content || 'Tệp đính kèm'}</span>
                                        </div>
                                    </div>
                                    <button 
                                        onClick={() => setReplyingTo(null)}
                                        className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-full transition-all"
                                    >
                                        <X size={16} />
                                    </button>
                                </div>
                            )}
                            <div className="max-w-4xl mx-auto flex items-end gap-3 bg-slate-50 p-2 rounded-2xl border border-slate-200/50 shadow-inner group focus-within:bg-white focus-within:border-blue-300 focus-within:ring-4 focus-within:ring-blue-50 transition-all">
                                <button
                                    onClick={() => fileInputRef.current?.click()}
                                    disabled={uploading}
                                    className="w-10 h-10 flex items-center justify-center text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all shrink-0 active:scale-90"
                                >
                                    {uploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Paperclip size={20} />}
                                </button>
                                <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" />

                                <textarea
                                    rows={1}
                                    placeholder="Soạn tin nhắn mới..."
                                    className="flex-1 py-3 bg-transparent border-none rounded-xl text-sm font-semibold focus:ring-0 resize-none max-h-40 placeholder:text-slate-400"
                                    value={newMessage}
                                    onChange={(e) => {
                                        setNewMessage(e.target.value)
                                        handleTyping()
                                    }}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' && !e.shiftKey) {
                                            e.preventDefault()
                                            handleSendMessage()
                                        } else {
                                            handleTyping()
                                        }
                                    }}
                                />

                                <button
                                    onClick={() => handleSendMessage()}
                                    disabled={!newMessage.trim() && !uploading}
                                    className="w-10 h-10 flex items-center justify-center bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 shadow-md transition-all hover:scale-105 active:scale-95 shrink-0"
                                >
                                    {uploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send size={18} />}
                                </button>
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center p-12 text-center bg-slate-50/20">
                        <div className="w-32 h-32 bg-white rounded-3xl flex items-center justify-center mb-8 border border-slate-100 shadow-sm transition-transform duration-500 hover:scale-110">
                            <MessageCircle size={48} className="text-blue-100" />
                        </div>
                        <h3 className="text-2xl font-bold text-slate-900 mb-2">Chọn cuộc hội thoại</h3>
                        <p className="text-slate-500 max-w-sm text-sm font-medium leading-relaxed">
                            Liên hệ với nhà cung cấp, khách hàng và quản lý dự án để trao đổi thông tin thi công và vật liệu.
                        </p>
                    </div>
                )}
            </div>

            {/* Modals & Overlays */}
            {/* Image Zoom Modal */}
            {zoomedImage && (
                <div 
                    className="fixed inset-0 z-[100] bg-slate-900/95 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-300"
                    onClick={() => setZoomedImage(null)}
                >
                    <button className="absolute top-6 right-6 p-2 text-white/50 hover:text-white transition-colors">
                        <X size={32} />
                    </button>
                    <img 
                        src={zoomedImage} 
                        className="max-w-full max-h-full rounded-lg shadow-2xl animate-in zoom-in-95 duration-300" 
                        alt="Zoomed"
                        onClick={(e) => e.stopPropagation()} 
                    />
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {showDeleteModal && (
                <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
                    <div className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl animate-in zoom-in-95 duration-200">
                        <div className="w-16 h-16 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center mb-6 mx-auto">
                            <Trash2 size={32} />
                        </div>
                        <h3 className="text-xl font-bold text-slate-900 text-center mb-2">Xóa hội thoại?</h3>
                        <p className="text-slate-500 text-center text-sm font-medium mb-8">
                            Hành động này sẽ xóa toàn bộ lịch sử tin nhắn và không thể hoàn tác. Bạn có chắc chắn muốn tiếp tục?
                        </p>
                        <div className="grid grid-cols-2 gap-3">
                            <button 
                                onClick={() => setShowDeleteModal(false)}
                                className="py-3 px-4 bg-slate-50 text-slate-600 rounded-xl font-bold hover:bg-slate-100 transition-all active:scale-95"
                            >
                                Hủy bỏ
                            </button>
                            <button 
                                onClick={handleDeleteConversation}
                                className="py-3 px-4 bg-rose-600 text-white rounded-xl font-bold hover:bg-rose-700 transition-all shadow-lg shadow-rose-100 active:scale-95"
                            >
                                Xác nhận xóa
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Contact Info Modal */}
            {showContactModal && (
                <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
                    <div className="bg-white rounded-3xl p-8 max-w-lg w-full shadow-2xl animate-in zoom-in-95 duration-200 relative overflow-hidden flex flex-col max-h-[85vh]">
                        <button 
                            onClick={() => setShowContactModal(false)}
                            className="absolute top-6 right-6 p-2 text-slate-400 hover:text-slate-900 transition-colors z-10"
                        >
                            <X size={20} />
                        </button>
                        
                        {isGroupContact ? (
                            (() => {
                                const sharedMedia = messages
                                    .filter(m => m.fileUrl && (m.fileType?.startsWith('image/') || m.fileType?.startsWith('video/')))
                                    .map(m => ({
                                        id: m.id,
                                        url: m.fileUrl!,
                                        type: m.fileType || 'image/jpeg',
                                        name: m.fileName || 'Ảnh/Video',
                                        date: m.createdAt
                                    }))
                                    .reverse()

                                const sharedFiles = messages
                                    .filter(m => m.fileUrl && !m.fileType?.startsWith('image/') && !m.fileType?.startsWith('video/'))
                                    .map(m => ({
                                        id: m.id,
                                        url: m.fileUrl!,
                                        name: m.fileName || 'Tài liệu',
                                        isLink: false,
                                        date: m.createdAt
                                    }))

                                const sharedLinks: any[] = []
                                messages.forEach(m => {
                                    if (m.content && !m.fileUrl && (m.content.includes('http://') || m.content.includes('https://'))) {
                                        const urlRegex = /(https?:\/\/[^\s]+)/g
                                        const urls = m.content.match(urlRegex)
                                        if (urls) {
                                            urls.forEach((url: string) => {
                                                sharedLinks.push({
                                                    id: m.id + '-' + url,
                                                    url: url,
                                                    name: url,
                                                    isLink: true,
                                                    date: m.createdAt
                                                })
                                            })
                                        }
                                    }
                                })

                                const allFilesAndLinks = [...sharedFiles, ...sharedLinks].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

                                return (
                                    <>
                                        <div className="flex flex-col items-center mb-4">
                                            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 text-white rounded-2xl flex items-center justify-center text-2xl font-bold mb-3 shadow-xl">
                                                {conversations.find(c => c.id === selectedId)?.groupTitle?.charAt(0).toUpperCase() || 'G'}
                                            </div>
                                            <h3 className="text-lg font-bold text-slate-900 truncate max-w-full">
                                                {conversations.find(c => c.id === selectedId)?.groupTitle || 'Trò chuyện nhóm'}
                                            </h3>
                                            <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mt-1">
                                                {groupMembers.length} thành viên
                                            </p>
                                        </div>

                                        {/* Modal Tabs */}
                                        <div className="flex border-b border-gray-100 mb-4">
                                            <button
                                                onClick={() => setActiveModalTab('members')}
                                                className={`flex-1 py-3 text-xs font-bold transition-all border-b-2 ${
                                                    activeModalTab === 'members'
                                                        ? 'border-blue-600 text-blue-600 bg-blue-50/10'
                                                        : 'border-transparent text-gray-500 hover:text-gray-900'
                                                }`}
                                            >
                                                Thành viên
                                            </button>
                                            <button
                                                onClick={() => setActiveModalTab('media')}
                                                className={`flex-1 py-3 text-xs font-bold transition-all border-b-2 ${
                                                    activeModalTab === 'media'
                                                        ? 'border-blue-600 text-blue-600 bg-blue-50/10'
                                                        : 'border-transparent text-gray-500 hover:text-gray-900'
                                                }`}
                                            >
                                                Kho lưu trữ
                                            </button>
                                        </div>

                                        {/* Modal Tab Contents */}
                                        <div className="flex-1 overflow-y-auto custom-scrollbar pr-1">
                                            {activeModalTab === 'members' ? (
                                                <div className="space-y-3">
                                                    {fetchingContact ? (
                                                        <div className="py-12 flex flex-col items-center gap-4">
                                                            <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
                                                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Đang tải thành viên...</span>
                                                        </div>
                                                    ) : (
                                                        groupMembers.map((member) => {
                                                            const roleLabels: Record<string, string> = {
                                                                'MANAGER': 'Quản trị viên',
                                                                'ADMIN': 'Quản trị viên',
                                                                'EMPLOYEE': 'Nhân viên',
                                                                'CONTRACTOR': 'Nhà thầu',
                                                                'CUSTOMER': 'Khách hàng',
                                                                'SUPPLIER': 'Nhà cung cấp',
                                                                'GUEST': 'Khách vãng lai',
                                                            }
                                                            const isMe = member.id === user?.id
                                                            return (
                                                                <div key={member.id} className="p-3 bg-slate-50 rounded-2xl border border-slate-100 flex items-center gap-3">
                                                                    <div className="w-9 h-9 bg-blue-100 text-blue-700 rounded-xl flex items-center justify-center font-bold text-sm">
                                                                        {member.name?.charAt(0).toUpperCase()}
                                                                    </div>
                                                                    <div className="flex-1 min-w-0">
                                                                        <h4 className="font-bold text-slate-900 text-sm truncate flex items-center gap-1.5">
                                                                            {member.name}
                                                                            {isMe && <span className="text-[9px] text-gray-400 font-medium">(Bạn)</span>}
                                                                        </h4>
                                                                        <p className="text-[10px] font-semibold text-blue-600">{roleLabels[member.role || ''] || 'Thành viên'}</p>
                                                                        {(member.phone && member.phone !== 'Chưa cập nhật') && (
                                                                            <p className="text-[10px] text-slate-500 mt-0.5">SĐT: {member.phone}</p>
                                                                        )}
                                                                    </div>
                                                                    {!isMe && (
                                                                        <button
                                                                            onClick={() => {
                                                                                handleStartDirectChat(member.id, member.name)
                                                                                setShowContactModal(false)
                                                                            }}
                                                                            className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-xl text-[10px] font-bold transition"
                                                                        >
                                                                            Chat riêng
                                                                        </button>
                                                                    )}
                                                                </div>
                                                            )
                                                        })
                                                    )}
                                                </div>
                                            ) : (
                                                <div className="flex flex-col space-y-4">
                                                    {/* Sub-tabs */}
                                                    <div className="flex bg-slate-100 p-0.5 rounded-xl border border-slate-200 text-xs font-semibold">
                                                        <button
                                                            onClick={() => setMediaSubTab('media')}
                                                            className={`flex-1 py-1.5 rounded-lg transition ${
                                                                mediaSubTab === 'media'
                                                                    ? 'bg-white text-slate-900 shadow-sm'
                                                                    : 'text-slate-500 hover:text-slate-800'
                                                            }`}
                                                        >
                                                            Ảnh & Video
                                                        </button>
                                                        <button
                                                            onClick={() => setMediaSubTab('files')}
                                                            className={`flex-1 py-1.5 rounded-lg transition ${
                                                                mediaSubTab === 'files'
                                                                    ? 'bg-white text-slate-900 shadow-sm'
                                                                    : 'text-slate-500 hover:text-slate-800'
                                                            }`}
                                                        >
                                                            Tệp & Link
                                                        </button>
                                                    </div>

                                                    {/* Media / Files Content */}
                                                    <div>
                                                        {mediaSubTab === 'media' ? (
                                                            sharedMedia.length === 0 ? (
                                                                <div className="text-center py-12 text-slate-400 text-xs flex flex-col items-center gap-2">
                                                                    <ImageIcon className="w-8 h-8 opacity-30" />
                                                                    <span>Không có ảnh hoặc video</span>
                                                                </div>
                                                            ) : (
                                                                <div className="grid grid-cols-4 gap-2">
                                                                    {sharedMedia.map((media) => (
                                                                        <a
                                                                            key={media.id}
                                                                            href={media.url}
                                                                            target="_blank"
                                                                            rel="noopener noreferrer"
                                                                            className="aspect-square bg-slate-100 rounded-xl overflow-hidden relative border border-slate-100 hover:opacity-90 transition group"
                                                                            title={media.name}
                                                                        >
                                                                            {media.type.startsWith('video/') ? (
                                                                                <video src={media.url} className="w-full h-full object-cover pointer-events-none" />
                                                                            ) : (
                                                                                <img src={media.url} alt={media.name} className="w-full h-full object-cover" />
                                                                            )}
                                                                        </a>
                                                                    ))}
                                                                </div>
                                                            )
                                                        ) : (
                                                            allFilesAndLinks.length === 0 ? (
                                                                <div className="text-center py-12 text-slate-400 text-xs flex flex-col items-center gap-2">
                                                                    <FileText className="w-8 h-8 opacity-30" />
                                                                    <span>Không có tệp hoặc liên kết</span>
                                                                </div>
                                                            ) : (
                                                                <div className="space-y-2">
                                                                    {allFilesAndLinks.map((file) => (
                                                                        <a
                                                                            key={file.id}
                                                                            href={file.url}
                                                                            target="_blank"
                                                                            rel="noopener noreferrer"
                                                                            className="p-3 bg-slate-50 border border-slate-100 rounded-2xl flex items-center gap-3 hover:bg-slate-100 transition min-w-0"
                                                                        >
                                                                            {file.isLink ? (
                                                                                <Link2 className="w-4 h-4 text-blue-500 flex-shrink-0" />
                                                                            ) : (
                                                                                <FileText className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                                                                            )}
                                                                            <div className="min-w-0 flex-1">
                                                                                <p className="text-xs text-slate-800 font-bold truncate">{file.name}</p>
                                                                                <p className="text-[9px] text-slate-400 font-semibold uppercase mt-0.5">
                                                                                    {file.isLink ? 'Liên kết' : 'Tài liệu'} • {new Date(file.date).toLocaleDateString('vi-VN')}
                                                                                </p>
                                                                            </div>
                                                                        </a>
                                                                    ))}
                                                                </div>
                                                            )
                                                        )}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </>
                                )
                            })()
                        ) : (
                            <>
                                <div className="flex flex-col items-center mb-8">
                                    <div className="w-20 h-20 bg-blue-600 text-white rounded-2xl flex items-center justify-center text-3xl font-bold mb-4 shadow-xl shadow-blue-100">
                                        {partnerInfo?.name?.charAt(0).toUpperCase() || '?'}
                                    </div>
                                    <h3 className="text-xl font-bold text-slate-900">{partnerInfo?.name || 'Đang tải...'}</h3>
                                    <p className="text-xs font-bold text-blue-600 uppercase tracking-widest mt-1">
                                        {partnerInfo?.role === 'CUSTOMER' ? 'Khách hàng' : 'Nhà thầu/Đối tác'}
                                    </p>
                                </div>

                                {fetchingContact ? (
                                    <div className="py-12 flex flex-col items-center gap-4">
                                        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Đang truy xuất thông tin...</span>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                                                <Phone size={12} className="text-blue-500" /> Số điện thoại
                                            </div>
                                            <p className="text-slate-900 font-bold">{partnerInfo?.phone || 'Chưa cập nhật'}</p>
                                        </div>
                                        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                                                <Info size={12} className="text-blue-500" /> Email liên hệ
                                            </div>
                                            <p className="text-slate-900 font-bold">{partnerInfo?.email || 'Chưa cập nhật'}</p>
                                        </div>
                                        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                                                <Activity size={12} className="text-blue-500" /> Ngày tham gia
                                            </div>
                                            <p className="text-slate-900 font-bold">
                                                {partnerInfo?.createdAt ? new Date(partnerInfo.createdAt).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '---'}
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </>
                        )}

                        <div className="mt-6 flex-shrink-0">
                            <button 
                                onClick={() => setShowContactModal(false)}
                                className="w-full py-4 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-xl font-bold transition-all active:scale-[0.98]"
                            >
                                Đóng
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Security Warning Modal (Only for dangerous files) */}
            {isScanning && scanStatus === 'danger' && (
                <div className="fixed inset-0 z-[110] bg-slate-900/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-300">
                    <div className="bg-white rounded-[2rem] p-10 max-w-lg w-full shadow-2xl animate-in zoom-in-95 duration-300 relative overflow-hidden">
                        <div className="flex flex-col items-center text-center">
                            <div className="w-24 h-24 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center mb-8 shadow-inner">
                                <X size={48} />
                            </div>

                            <h3 className="text-2xl font-black text-slate-900 mb-2">Cảnh báo nguy hiểm</h3>
                            
                            <div className="bg-slate-50 px-4 py-2 rounded-xl border border-slate-100 mb-6 max-w-full">
                                <p className="text-xs font-bold text-slate-500 truncate">{scanFile?.fileName}</p>
                            </div>

                            <div className="text-left w-full space-y-4 mb-8">
                                <div className="bg-rose-50/50 border border-rose-100 p-4 rounded-2xl text-rose-700">
                                    <p className="text-sm font-semibold leading-relaxed">
                                        CẢNH BÁO: Tệp này có định dạng thực thi cực kỳ nguy hiểm. Nó có thể thay đổi dữ liệu hoặc chiếm quyền điều khiển máy tính của bạn.
                                    </p>
                                </div>
                            </div>

                            <div className="flex gap-3 w-full">
                                <button 
                                    onClick={() => { setIsScanning(false); setScanFile(null); }}
                                    className="flex-1 py-4 bg-slate-50 text-slate-600 rounded-2xl font-bold hover:bg-slate-100 transition-all active:scale-95"
                                >
                                    Hủy bỏ
                                </button>
                                <button 
                                    onClick={confirmDownload}
                                    className="flex-[2] py-4 bg-rose-600 text-white rounded-2xl font-bold shadow-lg shadow-rose-100 hover:bg-rose-700 transition-all active:scale-95"
                                >
                                    Vẫn tải xuống
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

export default function MessagesPage() {
    return (
        <div className="h-full animate-in fade-in duration-500">
            <Suspense fallback={
                <div className="h-[calc(100vh-120px)] bg-white rounded-2xl border border-slate-100 flex items-center justify-center">
                    <div className="flex flex-col items-center gap-4">
                        <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-widest animate-pulse">Đang kết nối hệ thống...</span>
                    </div>
                </div>
            }>
                <MessagesContent />
            </Suspense>
        </div>
    )
}
