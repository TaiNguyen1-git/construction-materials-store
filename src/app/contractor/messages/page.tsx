'use client'

import { useState, useEffect, Suspense, useRef, useCallback } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import {
    Send, Paperclip, MessageCircle,
    Search, User, MoreVertical,
    Phone, ArrowLeft, Loader2,
    Trash2, Flag, Info, Check, CheckCheck,
    Image as ImageIcon, FileText, X, Video, ChevronDown, Activity
} from 'lucide-react'
import { fetchWithAuth } from '@/lib/api-client'
import { getFirebaseDatabase } from '@/lib/firebase'
import { ref, onChildAdded, off, serverTimestamp } from 'firebase/database'
import toast from 'react-hot-toast'
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

    const scrollToBottom = (behavior: ScrollBehavior = 'smooth') => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior })
        }
    }

    useEffect(() => {
        scrollToBottom()
    }, [messages])

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
        setShowScrollButton(scrollHeight - scrollTop - clientHeight > 200)
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
            senderName: user?.name || 'Tôi',
            content: content,
            fileUrl: fileData?.fileUrl,
            fileName: fileData?.fileName,
            fileType: fileData?.fileType,
            createdAt: new Date().toISOString(),
            isSending: true
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

    const formatTime = (dateString: string) => {
        const date = new Date(dateString)
        return date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
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

    const renderMessageContent = (msg: any) => {
        if (msg.fileUrl) {
            const isImage = msg.fileType?.startsWith('image/')
            if (isImage) {
                return (
                    <div className="space-y-2">
                        <img
                            src={msg.fileUrl}
                            alt={msg.fileName}
                            className="max-w-[300px] rounded-xl cursor-pointer hover:opacity-90 transition-opacity border border-slate-200"
                            onClick={() => window.open(msg.fileUrl, '_blank')}
                        />
                        {msg.content && <p className="text-sm font-medium px-2">{msg.content}</p>}
                    </div>
                )
            }
            return (
                <a
                    href={msg.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl hover:bg-slate-100 transition-all border border-slate-200"
                >
                    <div className="bg-white p-3 rounded-lg border border-slate-100 shadow-sm">
                        <FileText className="w-6 h-6 text-blue-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold truncate text-slate-700">{msg.fileName}</p>
                        <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Tệp đính kèm</p>
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
                    <div className={`flex flex-col gap-4 min-w-[280px] p-2 ${isMe ? 'text-white' : 'text-slate-800'}`}>
                        <div className="flex items-center gap-6">
                            <div className={`w-14 h-14 flex items-center justify-center rounded-2xl shadow-sm ${isMe ? 'bg-white/20' : 'bg-blue-50 text-blue-600 border border-blue-100'}`}>
                                {isVideo ? <Video className="w-7 h-7" /> : <Phone className="w-7 h-7" />}
                            </div>
                            <div>
                                <h4 className="font-bold text-base">{isVideo ? 'Cuộc gọi video' : 'Cuộc gọi thoại'}</h4>
                                <div className="flex items-center gap-2 mt-1">
                                    <div className={`w-2 h-2 rounded-full ${isMe ? 'bg-white' : 'bg-blue-500'} animate-pulse`} />
                                    <p className="text-[10px] font-semibold opacity-80">{durationStr}</p>
                                </div>
                            </div>
                        </div>
                        <button
                            onClick={() => handleCall(isVideo ? 'video' : 'audio')}
                            className={`w-full py-4 rounded-xl text-xs font-bold transition-all hover:opacity-90 active:scale-[0.98] shadow-sm ${isMe ? 'bg-white text-blue-600' : 'bg-blue-600 text-white'}`}
                        >
                            Gọi lại ngay
                        </button>
                    </div>
                )
            } catch (e) {
                return <p className="text-sm font-medium leading-relaxed">{msg.content}</p>
            }
        }
        return <p className="text-sm font-medium leading-relaxed">{msg.content}</p>
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
                            const unread = user?.id === conv.participant1Id ? conv.unread1 : conv.unread2
                            const otherName = user?.id === conv.participant1Id ? conv.participant2Name : conv.participant1Name
                            const isActive = selectedId === conv.id

                            return (
                                <button
                                    key={conv.id}
                                    onClick={() => setSelectedId(conv.id)}
                                    className={`w-full p-4 rounded-xl flex items-center gap-4 hover:bg-slate-50 transition-all group relative border ${isActive ? 'bg-blue-50/60 border-blue-100' : 'bg-transparent border-transparent'}`}
                                >
                                    <div className="relative flex-shrink-0">
                                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-sm transition-all duration-300 ${isActive ? 'bg-blue-600' : 'bg-slate-200 text-slate-600 group-hover:bg-slate-300'}`}>
                                            {otherName.charAt(0).toUpperCase()}
                                        </div>
                                        <div className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-500 border-2 border-white rounded-full`}></div>
                                    </div>
                                    <div className="flex-1 text-left min-w-0">
                                        <div className="flex justify-between items-center mb-0.5">
                                            <h4 className={`text-sm font-bold truncate ${isActive ? 'text-blue-700' : 'text-slate-900'}`}>
                                                {otherName}
                                            </h4>
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
                                        className={`w-10 h-10 flex items-center justify-center rounded-xl transition-all border ${showMenu ? 'bg-slate-900 border-slate-900 text-white' : 'bg-slate-50 border-slate-100 text-slate-400 hover:bg-slate-100'}`}
                                    >
                                        <MoreVertical size={18} />
                                    </button>
                                    {showMenu && (
                                        <div className="absolute right-0 top-12 w-56 bg-white border border-slate-100 rounded-xl shadow-xl p-2 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                                            <button className="w-full text-left px-4 py-3 text-xs text-slate-600 hover:bg-slate-50 rounded-lg flex items-center gap-3 font-bold transition-all">
                                                <User size={16} /> Thông tin liên hệ
                                            </button>
                                            <div className="h-px bg-slate-100 my-1 mx-2" />
                                            <button className="w-full text-left px-4 py-3 text-xs text-rose-600 hover:bg-rose-50 rounded-lg flex items-center gap-3 font-bold transition-all">
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
                            className="flex-1 overflow-y-auto px-8 py-8 space-y-6 bg-slate-50/30 relative custom-scrollbar scroll-smooth"
                        >
                            {messages.map((msg, idx) => {
                                const isMe = msg.senderId === user?.id
                                const firstInGroup = idx === 0 || messages[idx - 1].senderId !== msg.senderId

                                return (
                                    <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'} items-end gap-3 animate-in fade-in slide-in-from-bottom-2 duration-300`}>
                                        {!isMe && (
                                            <div className="w-8 h-8 flex-shrink-0">
                                                {firstInGroup ? (
                                                    <div className="w-8 h-8 rounded-lg bg-slate-200 flex items-center justify-center text-[10px] font-bold text-slate-600 border border-slate-300">
                                                        {msg.senderName.charAt(0).toUpperCase()}
                                                    </div>
                                                ) : <div className="w-8" />}
                                            </div>
                                        )}

                                        <div className={`max-w-[75%] relative group`}>
                                            <div className={`px-5 py-3.5 rounded-2xl shadow-sm relative transition-all ${isMe
                                                ? 'bg-blue-600 text-white rounded-br-sm'
                                                : 'bg-white text-slate-900 rounded-bl-sm border border-slate-100'
                                                }`}>
                                                {renderMessageContent(msg)}
                                            </div>
                                            <div className={`flex items-center gap-2 mt-1.5 ${isMe ? 'justify-end pr-0.5' : 'justify-start pl-0.5'}`}>
                                                <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider opacity-0 group-hover:opacity-100 transition-opacity">
                                                    {formatTime(msg.createdAt)}
                                                </span>
                                                {isMe && (
                                                    <div className={`transition-colors ${msg.isRead ? 'text-blue-500' : 'text-slate-300'}`}>
                                                        {msg.isRead ? <CheckCheck size={12} /> : <Check size={12} />}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                )
                            })}
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

                        <div className="px-8 py-6 bg-white border-t border-slate-100">
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
                                    onChange={(e) => setNewMessage(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' && !e.shiftKey) {
                                            e.preventDefault()
                                            handleSendMessage()
                                        }
                                    }}
                                />

                                <button
                                    onClick={() => handleSendMessage()}
                                    disabled={sending || (!newMessage.trim() && !uploading)}
                                    className="w-10 h-10 flex items-center justify-center bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 shadow-md transition-all hover:scale-105 active:scale-95 shrink-0"
                                >
                                    {sending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send size={18} />}
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
