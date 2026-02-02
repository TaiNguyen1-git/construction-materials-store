'use client'

import { useState, useEffect, Suspense, useRef } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import {
    Send, Paperclip, MessageCircle,
    Search, User, MoreVertical,
    Phone, ArrowLeft, Loader2,
    Trash2, Flag, Check, CheckCheck,
    Image as ImageIcon, FileText, X, Video, ChevronDown
} from 'lucide-react'
import { getAuthHeaders } from '@/lib/api-client'
import { getFirebaseDatabase } from '@/lib/firebase'
import { ref, onChildAdded, off } from 'firebase/database'
import toast, { Toaster } from 'react-hot-toast'
import ChatCallManager from '@/components/ChatCallManager'
import { useAuth } from '@/contexts/auth-context'

function MessagesContent() {
    const searchParams = useSearchParams()
    const { user } = useAuth()
    const [conversations, setConversations] = useState<any[]>([])
    const [selectedId, setSelectedId] = useState<string | null>(searchParams.get('id'))
    const [loading, setLoading] = useState(true)
    const [messages, setMessages] = useState<any[]>([])
    const [newMessage, setNewMessage] = useState('')
    const [sending, setSending] = useState(false)
    const [uploading, setUploading] = useState(false)

    // Menu Dropdown State
    const [showMenu, setShowMenu] = useState(false)
    const [showScrollButton, setShowScrollButton] = useState(false)
    const menuRef = useRef<HTMLDivElement>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)
    const messagesEndRef = useRef<HTMLDivElement>(null)
    const scrollContainerRef = useRef<HTMLDivElement>(null)

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
        }
    }, [searchParams])

    // Real-time Firebase Listener
    useEffect(() => {
        if (!selectedId) return

        const db = getFirebaseDatabase()
        const messagesRef = ref(db, `conversations/${selectedId}/messages`)

        // Fetch initial messages from API first
        fetchMessages(selectedId)

        // Then listen for new ones
        onChildAdded(messagesRef, (snapshot) => {
            const newMsg = snapshot.val()
            if (newMsg) {
                setMessages(prev => {
                    // Prevent duplicates
                    if (prev.some(m => m.id === newMsg.id || (m.tempId && m.tempId === newMsg.tempId))) {
                        return prev.map(m => (m.tempId === newMsg.tempId ? newMsg : m))
                    }
                    return [...prev, newMsg]
                })
            }
        })

        return () => {
            off(messagesRef)
        }
    }, [selectedId])

    // Auto-scroll to bottom
    const scrollToBottom = (behavior: ScrollBehavior = 'smooth') => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior })
        }
    }

    // Scroll when messages change
    useEffect(() => {
        scrollToBottom()
    }, [messages])

    // Click outside listener for menu
    useEffect(() => {
        function handleClickOutside(event: any) {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setShowMenu(false)
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const fetchConversations = async () => {
        try {
            const res = await fetch('/api/chat/conversations', {
                headers: getAuthHeaders()
            })
            if (res.ok) {
                const json = await res.json()
                setConversations(json.data)
                // If no conversation is selected but we have some, and no ID in URL
                const urlId = searchParams.get('id')
                if (!selectedId && !urlId && json.data.length > 0) {
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
            const res = await fetch(`/api/chat/conversations/${convId}/messages`, {
                headers: getAuthHeaders()
            })
            if (res.ok) {
                const json = await res.json()
                if (json.data.length !== messages.length || !quiet) {
                    setMessages(json.data)
                    if (!quiet) setTimeout(scrollToBottom, 100)
                }
            }
        } catch (err) {
            console.error('Fetch messages error:', err)
        }
    }

    const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
        const { scrollTop, scrollHeight, clientHeight } = e.currentTarget
        setShowScrollButton(scrollHeight - scrollTop - clientHeight > 400)
    }

    const handleSendMessage = async (e?: React.FormEvent, fileData?: any) => {
        if (e) e.preventDefault()

        const content = newMessage.trim()
        if (!content && !fileData) return

        const tempId = 'temp-' + Date.now()
        const optimisticMsg = {
            id: tempId,
            tempId: tempId,
            senderId: user?.id,
            senderName: user?.name || 'Admin',
            content: content,
            fileUrl: fileData?.fileUrl,
            fileName: fileData?.fileName,
            fileType: fileData?.fileType,
            createdAt: new Date().toISOString(),
            isSending: true
        }

        // 1. Optimistic Update
        setMessages(prev => [...prev, optimisticMsg])
        setNewMessage('')
        scrollToBottom()

        try {
            const headers = getAuthHeaders()
            const res = await fetch('/api/chat/messages', {
                method: 'POST',
                headers: {
                    ...headers,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    conversationId: selectedId,
                    content: content,
                    fileUrl: fileData?.fileUrl,
                    fileName: fileData?.fileName,
                    fileType: fileData?.fileType,
                    tempId: tempId
                })
            })

            if (!res.ok) {
                toast.error('Gửi tin nhắn thất bại')
                setMessages(prev => prev.filter(m => m.id !== tempId))
                setNewMessage(content)
            } else {
                fetchConversations()
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

    const selectedConv = conversations.find(c => c.id === selectedId)
    const displayName = selectedConv
        ? (user?.id === selectedConv.participant1Id ? selectedConv.participant2Name : selectedConv.participant1Name)
        : ''

    const handleCall = (type: 'audio' | 'video' = 'audio') => {
        if (!selectedConv) return

        const otherUserId = user?.id === selectedConv.participant1Id ? selectedConv.participant2Id : selectedConv.participant1Id
        const otherUserName = user?.id === selectedConv.participant1Id ? selectedConv.participant2Name : selectedConv.participant1Name

        if ((window as any).__startCall) {
            (window as any).__startCall(otherUserId, otherUserName, selectedConv.id, type)
        } else {
            toast.error('Hệ thống gọi chưa sẵn sàng')
        }
    }

    const handleMenuAction = async (action: string) => {
        if (!selectedConv || !selectedId) return
        setShowMenu(false)

        if (action === 'info') {
            const otherUserName = user?.id === selectedConv.participant1Id ? selectedConv.participant2Name : selectedConv.participant1Name
            const otherUserId = user?.id === selectedConv.participant1Id ? selectedConv.participant2Id : selectedConv.participant1Id
            toast.success(`Thông tin: ${otherUserName}\nID: ${otherUserId}`, {
                duration: 4000,
                icon: '👤'
            })
        } else if (action === 'report') {
            toast.success('Cảm ơn bạn đã báo cáo. Chúng tôi sẽ xem xét nội dung này sớm nhất có thể.', {
                duration: 4000,
                icon: '🚩'
            })
        } else if (action === 'delete') {
            if (confirm('Bạn có chắc muốn xóa vĩnh viễn cuộc hội thoại này? Dữ liệu không thể khôi phục.')) {
                try {
                    const res = await fetch(`/api/chat/conversations/${selectedId}`, {
                        method: 'DELETE',
                        headers: getAuthHeaders()
                    })

                    if (res.ok) {
                        toast.success('Đã xóa hội thoại')
                        setSelectedId(null)
                        setMessages([])
                        fetchConversations()
                    } else {
                        const err = await res.json()
                        toast.error(err.message || 'Lỗi khi xóa hội thoại')
                    }
                } catch (err) {
                    console.error('Delete conversation error:', err)
                    toast.error('Có lỗi xảy ra khi xóa')
                }
            }
        }
    }

    const formatTime = (dateString: string) => {
        const date = new Date(dateString)
        return date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
    }

    const formatLastMessage = (content: string) => {
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

    const renderMessageContent = (msg: any) => {
        if (msg.fileUrl) {
            const isImage = msg.fileType?.startsWith('image/')
            if (isImage) {
                return (
                    <div className="space-y-2">
                        <img
                            src={msg.fileUrl}
                            alt={msg.fileName}
                            className="max-w-[240px] max-h-[320px] w-auto h-auto rounded-xl cursor-pointer hover:scale-[1.02] transition-transform duration-200 border border-black/5 shadow-sm bg-gray-50"
                            onClick={() => window.open(msg.fileUrl, '_blank')}
                        />
                        {msg.content && <p className="text-sm">{msg.content}</p>}
                    </div>
                )
            }
            return (
                <a
                    href={msg.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 p-3 bg-white/10 rounded-lg hover:bg-white/20 transition-colors"
                >
                    <div className="bg-white/20 p-2 rounded">
                        <FileText className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold truncate">{msg.fileName}</p>
                        <p className="text-[10px] opacity-70 uppercase">Tệp đính kèm</p>
                    </div>
                </a>
            )
        }
        if (msg.content?.startsWith('[CALL_LOG]:')) {
            try {
                const log = JSON.parse(msg.content.replace('[CALL_LOG]:', ''))
                const mins = Math.floor(log.duration / 60)
                const secs = log.duration % 60
                const durationStr = mins > 0 ? `${mins}ph ${secs}s` : `${secs}s`
                const isVideo = log.type === 'video'
                const isMe = msg.senderId === user?.id

                return (
                    <div className={`flex flex-col gap-3 min-w-[220px] ${isMe ? 'text-white' : 'text-gray-800'}`}>
                        <div className="flex items-center gap-4">
                            <div className={`w-12 h-12 flex items-center justify-center rounded-2xl shadow-inner ${isMe ? 'bg-white/10 backdrop-blur-md' : 'bg-indigo-50 text-indigo-600'}`}>
                                {isVideo ? <Video className="w-6 h-6" /> : <Phone className="w-6 h-6" />}
                            </div>
                            <div>
                                <h4 className="font-black text-sm tracking-tight">{isVideo ? 'CUỘC GỌI VIDEO' : 'CUỘC GỌI THOẠI'}</h4>
                                <div className="flex items-center gap-1.5">
                                    <div className={`w-1.5 h-1.5 rounded-full ${isMe ? 'bg-green-300' : 'bg-green-500'}`} />
                                    <p className="text-[11px] opacity-80 font-bold uppercase tracking-widest">{durationStr}</p>
                                </div>
                            </div>
                        </div>
                        <button
                            onClick={() => handleCall(isVideo ? 'video' : 'audio')}
                            className={`w-full py-3 rounded-xl text-[10px] font-black uppercase tracking-[0.15em] transition-all hover:scale-[1.02] active:scale-[0.98] shadow-sm ${isMe ? 'bg-white text-indigo-600 hover:bg-white/90' : 'bg-indigo-600 text-white hover:bg-indigo-700'
                                }`}
                        >
                            GỌI LẠI NGAY
                        </button>
                    </div>
                )
            } catch (e) {
                return <p className="text-sm leading-relaxed">{msg.content}</p>
            }
        }
        return <p className="text-sm leading-relaxed">{msg.content}</p>
    }

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex h-[calc(100vh-160px)]">
            <Toaster position="top-right" />

            {user && <ChatCallManager userId={user.id} userName={user.name || 'Admin'} listenAdminSupport={true} />}

            {/* Sidebar: Conversations List */}
            <div className="w-80 border-r border-gray-100 flex flex-col bg-white overflow-hidden">
                <div className="p-4 border-b border-gray-50">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xl font-black text-gray-900">Hội thoại</h2>
                        <button className="p-2 bg-gray-50 rounded-full hover:bg-gray-100 transition-colors">
                            <MessageCircle className="w-5 h-5 text-gray-600" />
                        </button>
                    </div>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Tìm kiếm..."
                            className="w-full pl-10 pr-4 py-2 bg-gray-100 border-none rounded-2xl text-sm focus:ring-2 focus:ring-indigo-500"
                        />
                    </div>
                </div>
                <div className="flex-1 overflow-y-auto custom-scrollbar">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center p-8 text-gray-400 gap-3">
                            <Loader2 className="w-6 h-6 animate-spin" />
                            <span className="text-xs font-bold uppercase tracking-wider text-[10px]">Đang tải...</span>
                        </div>
                    ) : conversations.length === 0 ? (
                        <div className="p-8 text-center text-gray-400 text-sm italic">
                            Chưa có hội thoại nào
                        </div>
                    ) : (
                        conversations.map(conv => (
                            <button
                                key={conv.id}
                                onClick={() => setSelectedId(conv.id)}
                                className={`w-full p-4 flex items-center gap-3 hover:bg-gray-50 transition-colors border-r-4 ${selectedId === conv.id ? 'bg-indigo-50/50 border-indigo-600' : 'border-transparent'}`}
                            >
                                <div className="relative flex-shrink-0">
                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm shadow-sm">
                                        {(user?.id === conv.participant1Id ? conv.participant2Name : conv.participant1Name).charAt(0)}
                                    </div>
                                    <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
                                </div>
                                <div className="flex-1 text-left min-w-0">
                                    <div className="flex justify-between items-baseline mb-0.5">
                                        <h4 className="font-bold text-gray-900 truncate text-[13px]">
                                            {user?.id === conv.participant1Id ? conv.participant2Name : conv.participant1Name}
                                        </h4>
                                        <span className="text-[9px] text-gray-400 whitespace-nowrap ml-2">
                                            {conv.lastMessageAt ? new Date(conv.lastMessageAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : ''}
                                        </span>
                                    </div>
                                    <p className={`text-[11px] truncate ${conv.unread1 > 0 || conv.unread2 > 0 ? 'font-bold text-indigo-900' : 'text-gray-500'}`}>
                                        {formatLastMessage(conv.lastMessage)}
                                    </p>
                                </div>
                            </button>
                        ))
                    )}
                </div>
            </div>

            {/* Chat Area */}
            <div className="flex-1 flex flex-col bg-white relative">
                {selectedConv ? (
                    <>
                        {/* Chat Header */}
                        <div className="sticky top-0 px-6 py-4 bg-white/95 backdrop-blur-sm border-b border-gray-100 flex items-center justify-between z-20">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold shadow-sm">
                                    {displayName.charAt(0)}
                                </div>
                                <div>
                                    <h3 className="font-bold text-gray-900 text-sm">{displayName}</h3>
                                    <div className="flex items-center gap-1.5">
                                        <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                                        <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Đang xem yêu cầu</p>
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-1" ref={menuRef}>
                                <button onClick={() => handleCall('audio')} className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-full transition-all" title="Gọi thoại">
                                    <Phone className="w-5 h-5" />
                                </button>
                                <button onClick={() => handleCall('video')} className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-full transition-all" title="Gọi video">
                                    <Video className="w-5 h-5" />
                                </button>
                                <button onClick={() => setShowMenu(!showMenu)} className={`p-2 rounded-full transition-all ${showMenu ? 'bg-gray-100 text-gray-900' : 'text-gray-400 hover:bg-gray-100'}`}>
                                    <MoreVertical className="w-5 h-5" />
                                </button>

                                {showMenu && (
                                    <div className="absolute right-6 top-[60px] w-56 bg-white rounded-2xl shadow-2xl border border-gray-100 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                                        <button onClick={() => handleMenuAction('info')} className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-3 font-medium">
                                            <User className="w-4 h-4 text-gray-400" /> Xem thông tin
                                        </button>
                                        <button onClick={() => handleMenuAction('report')} className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-3 font-medium">
                                            <Flag className="w-4 h-4 text-gray-400" /> Báo cáo
                                        </button>
                                        <div className="h-px bg-gray-50 my-2 mx-2" />
                                        <button onClick={() => handleMenuAction('delete')} className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 flex items-center gap-3 font-bold">
                                            <Trash2 className="w-4 h-4" /> Xóa hội thoại
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Messages Container */}
                        <div
                            ref={scrollContainerRef}
                            onScroll={handleScroll}
                            className="flex-1 overflow-y-auto px-6 py-6 space-y-4 bg-gray-50/50 custom-scrollbar relative"
                        >
                            {messages.map((msg, idx) => {
                                const isMe = msg.senderId === user?.id
                                const showAvatar = !isMe && (idx === 0 || messages[idx - 1].senderId !== msg.senderId)

                                return (
                                    <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'} items-end gap-2`}>
                                        {!isMe && (
                                            <div className="w-8 h-8 flex-shrink-0">
                                                {showAvatar ? (
                                                    <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-[10px] font-bold text-gray-600">
                                                        {msg.senderName.charAt(0)}
                                                    </div>
                                                ) : <div className="w-8" />}
                                            </div>
                                        )}

                                        <div className="max-w-[70%] group relative">
                                            <div className={`p-3.5 rounded-2xl shadow-sm border ${isMe
                                                ? 'bg-indigo-600 text-white border-indigo-500 rounded-br-none'
                                                : 'bg-white text-gray-800 border-gray-100 rounded-bl-none'
                                                }`}>
                                                {renderMessageContent(msg)}
                                            </div>
                                            <div className={`flex items-center gap-1.5 mt-1 ${isMe ? 'justify-end' : 'justify-start'}`}>
                                                <span className="text-[9px] text-gray-400 font-bold uppercase">
                                                    {formatTime(msg.createdAt)}
                                                </span>
                                                {isMe && (msg.isRead ? <CheckCheck className="w-3 h-3 text-indigo-500" /> : <Check className="w-3 h-3 text-gray-300" />)}
                                            </div>
                                        </div>
                                    </div>
                                )
                            })}
                            <div ref={messagesEndRef} className="h-2" />

                        </div>

                        {/* Scroll to Bottom Button */}
                        {showScrollButton && (
                            <button
                                onClick={() => scrollToBottom()}
                                className="absolute bottom-28 right-8 p-4 bg-white text-indigo-600 rounded-full shadow-2xl border border-indigo-50 animate-bounce animate-in fade-in zoom-in duration-300 hover:scale-110 active:scale-95 transition-all z-40 group"
                            >
                                <ChevronDown className="w-6 h-6" />
                                <span className="absolute -top-10 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-[10px] py-1.5 px-3 rounded-lg opacity-0 group-hover:opacity-100 transition-all scale-75 group-hover:scale-100 whitespace-nowrap font-black shadow-lg">
                                    XUỐNG DƯỚI
                                </span>
                            </button>
                        )}

                        {/* Chat Input */}
                        <div className="p-4 bg-white border-t border-gray-100">
                            <div className="max-w-4xl mx-auto flex items-end gap-2 bg-gray-100 p-2 rounded-3xl">
                                <button
                                    onClick={() => fileInputRef.current?.click()}
                                    disabled={uploading}
                                    className="p-3 text-gray-500 hover:text-indigo-600 hover:bg-white rounded-full transition-all"
                                >
                                    {uploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Paperclip className="w-5 h-5" />}
                                </button>
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    onChange={handleFileUpload}
                                    className="hidden"
                                />

                                <div className="flex-1">
                                    <textarea
                                        rows={1}
                                        placeholder="Nhập tin nhắn..."
                                        className="w-full p-3 bg-transparent border-none rounded-2xl text-sm focus:ring-0 resize-none max-h-32"
                                        value={newMessage}
                                        onChange={(e) => setNewMessage(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter' && !e.shiftKey) {
                                                e.preventDefault()
                                                handleSendMessage()
                                            }
                                        }}
                                    />
                                </div>

                                <button
                                    onClick={() => handleSendMessage()}
                                    disabled={sending || (!newMessage.trim() && !uploading)}
                                    className="p-3 bg-indigo-600 text-white rounded-full hover:bg-indigo-700 disabled:opacity-50 shadow-lg shadow-indigo-100 transition-all hover:scale-105"
                                >
                                    {sending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                                </button>
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center p-12 text-center bg-gray-50/20">
                        <div className="w-24 h-24 bg-indigo-50 rounded-full flex items-center justify-center mb-6 shadow-inner">
                            <MessageCircle className="w-10 h-10 text-indigo-300" />
                        </div>
                        <h3 className="text-2xl font-black text-gray-900 mb-2">Trung tâm Hỗ trợ</h3>
                        <p className="text-gray-500 max-w-sm text-xs font-medium leading-relaxed">Chọn cuộc hội thoại từ danh sách bên trái để bắt đầu hỗ trợ khách hàng và nhà thầu.</p>
                        <button onClick={fetchConversations} className="mt-8 px-8 py-3 bg-indigo-600 text-white rounded-full font-black text-xs shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all">LÀM MỚI DANH SÁCH</button>
                    </div>
                )}
            </div>
        </div>
    )
}

export default function AdminMessagesPage() {
    return (
        <Suspense fallback={
            <div className="h-96 flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
            </div>
        }>
            <MessagesContent />
        </Suspense>
    )
}
