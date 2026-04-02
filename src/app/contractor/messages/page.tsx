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
                            className="max-w-[300px] rounded-3xl cursor-pointer hover:opacity-90 transition-opacity border border-white/10"
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
                    className="flex items-center gap-4 p-4 bg-white/10 rounded-3xl hover:bg-white/20 transition-all"
                >
                    <div className="bg-white/20 p-3 rounded-2xl">
                        <FileText className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-xs font-black truncate uppercase tracking-widest">{msg.fileName}</p>
                        <p className="text-[10px] opacity-70 uppercase font-black mt-1 tracking-widest">Document File</p>
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
                            <div className={`w-16 h-16 flex items-center justify-center rounded-[2rem] shadow-inner ${isMe ? 'bg-white/10 backdrop-blur-md' : 'bg-blue-50 text-blue-600'}`}>
                                {isVideo ? <Video className="w-8 h-8" /> : <Phone className="w-8 h-8" />}
                            </div>
                            <div>
                                <h4 className="font-black text-lg tracking-tighter uppercase italic">{isVideo ? 'Video Engagement' : 'Voice Interaction'}</h4>
                                <div className="flex items-center gap-2 mt-1">
                                    <div className={`w-2 h-2 rounded-full ${isMe ? 'bg-green-300' : 'bg-green-500'} animate-pulse`} />
                                    <p className="text-[10px] opacity-80 font-black uppercase tracking-[0.2em]">{durationStr}</p>
                                </div>
                            </div>
                        </div>
                        <button
                            onClick={() => handleCall(isVideo ? 'video' : 'audio')}
                            className={`w-full py-5 rounded-3xl text-[10px] font-black uppercase tracking-[0.3em] transition-all hover:scale-[1.02] active:scale-[0.98] shadow-xl ${isMe ? 'bg-white text-blue-600 hover:bg-slate-50 shadow-blue-900/10' : 'bg-blue-600 text-white hover:bg-blue-700 shadow-blue-500/20'}`}
                        >
                            Connect Again
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
        <div className="h-[calc(100vh-100px)] flex bg-white rounded-[3rem] overflow-hidden border border-slate-100 shadow-2xl relative shadow-slate-200/50">
            {user && <ChatCallManager userId={user.id} userName={user.name || 'Người dùng'} />}

            {/* Sidebar: Conversations List */}
            <div className="w-96 border-r border-slate-50 flex flex-col bg-white overflow-hidden">
                <div className="p-10 pb-6">
                    <h2 className="text-3xl font-black text-slate-900 tracking-tighter uppercase italic mb-8">Hub</h2>
                    <div className="relative group">
                        <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                        <input
                            type="text"
                            placeholder="Find connections..."
                            className="w-full pl-14 pr-6 py-4.5 bg-slate-50 border-transparent rounded-[1.8rem] text-sm focus:bg-white focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500/20 outline-none transition-all font-bold placeholder:text-slate-300"
                        />
                    </div>
                </div>
                <div className="flex-1 overflow-y-auto px-4 pb-10 space-y-2 custom-scrollbar">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-20 gap-4 opacity-50">
                            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Syncing database...</span>
                        </div>
                    ) : conversations.length === 0 ? (
                        <div className="py-20 text-center space-y-4">
                            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto text-slate-200">
                                <MessageCircle size={32} />
                            </div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">No active threads found</p>
                        </div>
                    ) : (
                        conversations.map(conv => {
                            const unread = user?.id === conv.participant1Id ? conv.unread1 : conv.unread2
                            const otherName = user?.id === conv.participant1Id ? conv.participant2Name : conv.participant1Name
                            return (
                                <button
                                    key={conv.id}
                                    onClick={() => setSelectedId(conv.id)}
                                    className={`w-full p-6 rounded-[2rem] flex items-center gap-5 hover:bg-slate-50 transition-all group overflow-hidden relative ${selectedId === conv.id ? 'bg-blue-50/50' : ''}`}
                                >
                                    {selectedId === conv.id && (
                                        <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-blue-600 rounded-r-full shadow-[0_0_15px_rgba(37,99,235,0.4)]"></div>
                                    )}
                                    <div className="relative flex-shrink-0">
                                        <div className={`w-14 h-14 rounded-[1.5rem] flex items-center justify-center text-white font-black text-xl shadow-lg transition-transform duration-500 group-hover:scale-110 ${selectedId === conv.id ? 'bg-blue-600 shadow-blue-500/20' : 'bg-slate-900 shadow-slate-200'}`}>
                                            {otherName.charAt(0).toUpperCase()}
                                        </div>
                                        <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-emerald-500 border-4 border-white rounded-full shadow-sm"></div>
                                    </div>
                                    <div className="flex-1 text-left min-w-0 space-y-1">
                                        <div className="flex justify-between items-baseline mb-0.5">
                                            <h4 className="font-black text-slate-900 truncate uppercase tracking-tighter text-sm italic">
                                                {otherName}
                                            </h4>
                                            <span className="text-[9px] font-black text-slate-400 whitespace-nowrap ml-3 uppercase">
                                                {conv.lastMessageAt ? new Date(conv.lastMessageAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : ''}
                                            </span>
                                        </div>
                                        <div className="flex items-center justify-between gap-3">
                                            <p className={`text-xs truncate ${unread > 0 ? 'font-black text-slate-900' : 'text-slate-400 font-medium'}`}>
                                                {formatLastMessage(conv.lastMessage)}
                                            </p>
                                            {unread > 0 && (
                                                <div className="min-w-[1.2rem] h-5 bg-red-500 text-white rounded-full flex items-center justify-center px-1.5 text-[8px] font-black shadow-lg shadow-red-500/30 animate-pulse">
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
                        <div className="h-24 px-10 border-b border-slate-50 flex items-center justify-between bg-white/80 backdrop-blur-xl z-20 sticky top-0">
                            <div className="flex items-center gap-6">
                                <button 
                                    onClick={() => setSelectedId(null)} 
                                    className="md:hidden w-10 h-10 flex items-center justify-center bg-slate-50 rounded-2xl text-slate-400 hover:text-slate-900"
                                >
                                    <ArrowLeft className="w-5 h-5" />
                                </button>
                                <div className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center text-white font-black shadow-xl shadow-blue-500/20">
                                    {displayName.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                    <h3 className="font-black text-slate-900 truncate uppercase tracking-tighter italic text-lg">{displayName}</h3>
                                    <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse shadow-sm shadow-emerald-500/50"></div>
                                        <p className="text-[9px] text-slate-400 font-black uppercase tracking-[0.2em]">Active Communication Portal</p>
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-3" ref={menuRef}>
                                <button onClick={() => handleCall('audio')} className="w-12 h-12 flex items-center justify-center bg-slate-50 text-slate-400 hover:bg-blue-600 hover:text-white rounded-2xl transition-all shadow-sm active:scale-90" title="Audio Call">
                                    <Phone size={20} />
                                </button>
                                <button onClick={() => handleCall('video')} className="w-12 h-12 flex items-center justify-center bg-slate-50 text-slate-400 hover:bg-blue-600 hover:text-white rounded-2xl transition-all shadow-sm active:scale-90" title="Video Meeting">
                                    <Video size={20} />
                                </button>
                                <div className="relative">
                                    <button 
                                        onClick={() => setShowMenu(!showMenu)} 
                                        className={`w-12 h-12 flex items-center justify-center rounded-2xl transition-all shadow-sm ${showMenu ? 'bg-slate-900 text-white' : 'bg-slate-50 text-slate-400 hover:bg-slate-100'}`}
                                    >
                                        <MoreVertical size={20} />
                                    </button>
                                    {showMenu && (
                                        <div className="absolute right-0 top-16 w-64 bg-slate-900 rounded-[2rem] shadow-2xl p-3 z-50 animate-in fade-in slide-in-from-top-4 duration-300">
                                            <button className="w-full text-left px-5 py-4 text-[10px] text-white/70 hover:text-white hover:bg-white/10 rounded-2xl flex items-center gap-4 font-black uppercase tracking-widest transition-all">
                                                <User size={16} /> Connection Space
                                            </button>
                                            <div className="h-px bg-white/5 my-2 mx-3" />
                                            <button className="w-full text-left px-5 py-4 text-[10px] text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-2xl flex items-center gap-4 font-black uppercase tracking-widest transition-all">
                                                <Trash2 size={16} /> Discard Thread
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div
                            ref={scrollContainerRef}
                            onScroll={handleScroll}
                            className="flex-1 overflow-y-auto px-10 py-10 space-y-8 bg-white relative custom-scrollbar scroll-smooth"
                        >
                            {messages.map((msg, idx) => {
                                const isMe = msg.senderId === user?.id
                                const firstInGroup = idx === 0 || messages[idx - 1].senderId !== msg.senderId

                                return (
                                    <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'} items-end gap-5 animate-in fade-in slide-in-from-bottom-2 duration-300`}>
                                        {!isMe && (
                                            <div className="w-12 h-12 flex-shrink-0">
                                                {firstInGroup ? (
                                                    <div className="w-12 h-12 rounded-2xl bg-slate-900 flex items-center justify-center text-[10px] font-black text-white shadow-xl">
                                                        {msg.senderName.charAt(0).toUpperCase()}
                                                    </div>
                                                ) : <div className="w-12" />}
                                            </div>
                                        )}

                                        <div className={`max-w-[75%] relative group`}>
                                            <div className={`px-8 py-6 rounded-[2.5rem] shadow-sm relative transition-transform duration-300 ${isMe
                                                ? 'bg-blue-600 text-white shadow-blue-500/10 rounded-br-none'
                                                : 'bg-slate-50 text-slate-900 rounded-bl-none'
                                                }`}>
                                                {renderMessageContent(msg)}
                                            </div>
                                            <div className={`flex items-center gap-2.5 mt-2 ${isMe ? 'justify-end pr-1' : 'justify-start pl-1'}`}>
                                                <span className="text-[8px] text-slate-300 font-black uppercase tracking-[0.2em] group-hover:opacity-100 transition-opacity">
                                                    {formatTime(msg.createdAt)}
                                                </span>
                                                {isMe && (
                                                    <div className={msg.isRead ? 'text-blue-500' : 'text-slate-200'}>
                                                        <CheckCheck size={12} />
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
                                className="absolute bottom-32 right-10 w-16 h-16 bg-white text-blue-600 rounded-[1.8rem] shadow-2xl border border-blue-50 flex items-center justify-center animate-bounce z-40 active:scale-90 transition-all"
                            >
                                <ChevronDown size={28} />
                            </button>
                        )}

                        <div className="px-10 py-10 bg-white border-t border-slate-50">
                            <div className="max-w-5xl mx-auto flex items-end gap-4 bg-slate-50 p-3 rounded-[2.8rem] border border-slate-200/50 shadow-sm transition-all focus-within:bg-white focus-within:shadow-2xl focus-within:shadow-slate-200/50 focus-within:border-blue-500/20">
                                <button
                                    onClick={() => fileInputRef.current?.click()}
                                    disabled={uploading}
                                    className="w-14 h-14 flex items-center justify-center text-slate-400 hover:text-blue-600 hover:bg-white rounded-full transition-all shrink-0 active:scale-90"
                                >
                                    {uploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Paperclip size={24} />}
                                </button>
                                <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" />

                                <textarea
                                    rows={1}
                                    placeholder="Type high-priority message..."
                                    className="flex-1 py-4 bg-transparent border-none rounded-2xl text-sm font-bold focus:ring-0 resize-none max-h-40 placeholder:text-slate-300"
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
                                    className="w-14 h-14 flex items-center justify-center bg-blue-600 text-white rounded-[1.8rem] hover:bg-blue-700 disabled:opacity-50 shadow-xl shadow-blue-500/30 transition-all hover:scale-105 active:scale-95 shrink-0"
                                >
                                    {sending ? <Loader2 className="w-6 h-6 animate-spin" /> : <Send size={22} />}
                                </button>
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center p-20 text-center animate-in fade-in duration-700">
                        <div className="w-48 h-48 bg-slate-50 rounded-[4rem] flex items-center justify-center mb-10 group hover:rotate-12 transition-all duration-700 shadow-inner">
                            <MessageCircle size={80} className="text-slate-200 group-hover:text-blue-600 transition-colors" />
                        </div>
                        <h3 className="text-4xl font-black text-slate-900 mb-4 uppercase tracking-tighter italic">Select Thread</h3>
                        <p className="text-slate-400 max-w-sm font-bold uppercase text-[10px] tracking-[0.2em] leading-relaxed">Kết nối trực tiếp với nhà cung cấp, khách hàng & đội ngũ thi công của bạn ngay bây giờ.</p>
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
                <div className="h-[calc(100vh-120px)] bg-white rounded-[3rem] border border-slate-100 flex items-center justify-center">
                    <div className="flex flex-col items-center gap-6">
                        <div className="w-16 h-16 border-4 border-slate-100 border-t-blue-600 rounded-full animate-spin"></div>
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic animate-pulse">Syncing Encrypted Channel...</span>
                    </div>
                </div>
            }>
                <MessagesContent />
            </Suspense>
        </div>
    )
}
