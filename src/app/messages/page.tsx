'use client'

import { useState, useEffect, useRef, Suspense } from 'react'
import Header from '@/components/Header'
import ChatSummaryButton from '@/components/ChatSummaryButton'
import {
    Send, ArrowLeft, MessageCircle, Paperclip, Image as ImageIcon,
    FileText, Download, X, Sparkles, UserPlus, Phone, Video, ChevronDown, Search
} from 'lucide-react'
import { useAuth } from '@/contexts/auth-context'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { getFirebaseDatabase } from '@/lib/firebase'
import { ref, onChildAdded, off } from 'firebase/database'
import ChatCallManager from '@/components/ChatCallManager'
import toast, { Toaster } from 'react-hot-toast'

interface Conversation {
    id: string
    otherUserId: string
    otherUserName: string
    projectId: string | null
    projectTitle: string | null
    lastMessage: string | null
    unreadCount: number
    lastMessageAt: string | null
    createdAt: string
}

interface Message {
    id: string
    tempId?: string
    senderId: string
    senderName: string
    content: string | null
    fileUrl: string | null
    fileName: string | null
    fileType: string | null
    fileSize: number | null
    isRead: boolean
    createdAt: string
}

export default function MessagesPage() {
    return (
        <Suspense fallback={
            <div className="h-screen bg-gray-50 flex items-center justify-center font-bold text-gray-400">
                Đang khởi tạo ứng dụng tin nhắn...
            </div>
        }>
            <MessagesClient />
        </Suspense>
    )
}

function MessagesClient() {
    const { user, isAuthenticated, isLoading: authLoading } = useAuth()
    const [conversations, setConversations] = useState<Conversation[]>([])
    const [selectedConv, setSelectedConv] = useState<string | null>(null)
    const [messages, setMessages] = useState<Message[]>([])
    const [newMessage, setNewMessage] = useState('')
    const [loading, setLoading] = useState(true)
    const [sending, setSending] = useState(false)
    const [uploading, setUploading] = useState(false)
    const [selectedFile, setSelectedFile] = useState<{
        file: File;
        preview: string;
        type: string;
    } | null>(null)
    const [showScrollButton, setShowScrollButton] = useState(false)
    const messagesEndRef = useRef<HTMLDivElement>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)
    const isSendingRef = useRef(false)
    const messagesContainerRef = useRef<HTMLDivElement>(null)

    // Get current user from localStorage or AuthContext
    const [userId, setUserId] = useState<string>('')
    const [userName, setUserName] = useState<string>('')
    const searchParams = useSearchParams()
    const partnerId = searchParams.get('partnerId')

    useEffect(() => {
        if (!authLoading) {
            const uid = user?.id || localStorage.getItem('user_id') || 'guest_' + Date.now()
            const uname = user?.name || localStorage.getItem('user_name') || 'Khách'

            // Persist guest ID if newly generated
            if (!user && !localStorage.getItem('user_id')) {
                localStorage.setItem('user_id', uid)
            }

            setUserId(uid)
            setUserName(uname)
            fetchConversations(uid)
        }
    }, [user, authLoading])

    // Auto-select partner from URL
    useEffect(() => {
        if (partnerId && userId && conversations.length >= 0 && !loading) {
            handleAutoConnectPartner()
        }
    }, [partnerId, userId, conversations, loading])

    const handleAutoConnectPartner = async () => {
        // 1. Check if already have a conversation with this partner
        const existing = conversations.find(c => c.otherUserId === partnerId)
        if (existing) {
            if (selectedConv !== existing.id) {
                selectConversation(existing.id)
            }
            return
        }

        // 2. If not, try to create/ensure it exists
        try {
            const res = await fetch('/api/messages', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    senderId: userId,
                    senderName: userName,
                    recipientId: partnerId
                })
            })

            if (res.ok) {
                const data = await res.json()
                if (data.success) {
                    // Re-fetch conversations to include new one
                    await fetchConversations(userId)
                    selectConversation(data.data.conversationId)
                }
            }
        } catch (error) {
            console.error('Failed to auto-connect partner:', error)
        }
    }

    const scrollToBottom = (behavior: ScrollBehavior = 'smooth') => {
        if (messagesContainerRef.current) {
            const container = messagesContainerRef.current
            container.scrollTo({
                top: container.scrollHeight,
                behavior
            })
        }
    }

    useEffect(() => {
        if (messages.length === 0) return

        const container = messagesContainerRef.current
        if (!container) return

        const isAtBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 300

        if (isSendingRef.current || isAtBottom) {
            scrollToBottom(isSendingRef.current ? 'smooth' : 'auto')
            isSendingRef.current = false
        }
    }, [messages])

    const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
        const { scrollTop, scrollHeight, clientHeight } = e.currentTarget
        setShowScrollButton(scrollHeight - scrollTop - clientHeight > 300)
    }

    const handleCall = (type: 'audio' | 'video' = 'audio') => {
        if (!selectedConv) return
        const conv = conversations.find(c => c.id === selectedConv)
        if (!conv) return

        if ((window as any).__startCall) {
            (window as any).__startCall(conv.otherUserId, conv.otherUserName, conv.id, type)
        } else {
            toast.error('Hệ thống gọi chưa sẵn sàng')
        }
    }

    const fetchConversations = async (uid: string) => {
        try {
            const res = await fetch('/api/messages', {
                headers: { 'x-user-id': uid }
            })
            if (res.ok) {
                const data = await res.json()
                if (data.success) {
                    setConversations(data.data.conversations)
                }
            }
        } catch (error) {
            console.error('Failed to fetch conversations:', error)
        } finally {
            setLoading(false)
        }
    }

    const selectConversation = async (convId: string) => {
        setSelectedConv(convId)
        setMessages([])

        try {
            const res = await fetch(`/api/messages/${convId}`, {
                headers: { 'x-user-id': userId }
            })
            if (res.ok) {
                const data = await res.json()
                if (data.success) {
                    setMessages(data.data.messages)
                }
            }
        } catch (error) {
            console.error('Failed to fetch messages:', error)
        }
    }

    useEffect(() => {
        if (!selectedConv) return

        const db = getFirebaseDatabase()
        const messagesRef = ref(db, `conversations/${selectedConv}/messages`)

        const unsubscribe = onChildAdded(messagesRef, (snapshot) => {
            const newMsg = snapshot.val()
            if (newMsg) {
                setMessages(prev => {
                    // Check if message already exists by ID or tempId
                    const isDuplicate = prev.some(m =>
                        m.id === newMsg.id ||
                        (newMsg.tempId && m.tempId === newMsg.tempId)
                    )

                    if (isDuplicate) {
                        // Replace temp message with real one to update ID and remove sending state if any
                        return prev.map(m =>
                            (m.tempId && m.tempId === newMsg.tempId) ? newMsg : m
                        )
                    }
                    return [...prev, newMsg]
                })
            }
        })

        return () => {
            off(messagesRef, 'child_added', unsubscribe)
        }
    }, [selectedConv])

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        const type = file.type.startsWith('image/') ? 'image' : 'file'
        const preview = type === 'image' ? URL.createObjectURL(file) : ''

        setSelectedFile({ file, preview, type })
    }

    const uploadFileLoad = async (file: File): Promise<{ fileId: string; fileName: string; fileType: string; fileSize: number } | null> => {
        setUploading(true)
        try {
            const formData = new FormData()
            formData.append('file', file)

            const res = await fetch('/api/upload/secure', {
                method: 'POST',
                body: formData
            })

            if (res.ok) {
                const data = await res.json()
                return {
                    fileId: data.fileId,
                    fileName: data.originalName,
                    fileType: file.type.startsWith('image/') ? 'image' : 'document',
                    fileSize: data.size
                }
            }
            return null
        } catch (error) {
            console.error('Upload failed:', error)
            return null
        } finally {
            setUploading(false)
        }
    }

    const sendMessage = async () => {
        if ((!newMessage.trim() && !selectedFile) || !selectedConv) return

        const content = newMessage
        const fileToUpload = selectedFile?.file
        const tempId = 'temp-' + Date.now()

        // 1. Optimistic Update (Instant response)
        const optimisticMsg: Message = {
            id: tempId,
            tempId: tempId,
            senderId: userId,
            senderName: userName,
            content: content || null,
            fileUrl: selectedFile?.preview || null,
            fileName: selectedFile?.file.name || null,
            fileType: selectedFile?.type || null,
            fileSize: selectedFile?.file.size || 0,
            isRead: false,
            createdAt: new Date().toISOString()
        }
        setMessages(prev => [...prev, optimisticMsg])

        setNewMessage('')
        setSelectedFile(null)
        if (fileInputRef.current) fileInputRef.current.value = ''

        isSendingRef.current = true
        setSending(true)

        let fileData = null
        if (fileToUpload) {
            fileData = await uploadFileLoad(fileToUpload)
            if (!fileData) {
                alert('Tải file thất bại')
                setMessages(prev => prev.filter(m => m.tempId !== tempId)) // Rollback
                setSending(false)
                return
            }
        }

        try {
            await fetch(`/api/messages/${selectedConv}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    senderId: userId,
                    senderName: userName,
                    content: content || null,
                    fileUrl: fileData ? `/api/files/${fileData.fileId}` : null,
                    fileName: fileData?.fileName,
                    fileType: fileData?.fileType,
                    fileSize: fileData?.fileSize,
                    tempId: tempId // Pass tempId for sync
                })
            })
        } catch (error) {
            console.error('Failed to send message:', error)
            setMessages(prev => prev.filter(m => m.tempId !== tempId)) // Rollback
        } finally {
            setSending(false)
            if (isSendingRef.current) setTimeout(() => { isSendingRef.current = false }, 100)
        }
    }

    const formatTime = (dateStr: string) => {
        const date = new Date(dateStr)
        return date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
    }

    const formatFileSize = (bytes?: number) => {
        if (!bytes) return ''
        if (bytes < 1024) return bytes + ' B'
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
        return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
    }

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            <Toaster position="top-right" />
            {userId && <ChatCallManager userId={userId} userName={userName} />}
            <Header />

            <div className="flex-1 max-w-6xl w-full mx-auto px-1 sm:px-4 py-2 sm:py-4 flex flex-col min-h-0">
                <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden h-[calc(100vh-180px)] min-h-[500px] flex flex-col shadow-2xl mb-8 mt-2">
                    <div className="flex flex-1 min-h-0">
                        {/* Conversation List */}
                        <div className="w-80 border-r border-gray-100 overflow-y-auto bg-white flex-shrink-0 flex flex-col">
                            <div className="p-4 border-b border-gray-50 flex-shrink-0">
                                <div className="relative group mb-2">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-blue-600 transition-colors" />
                                    <input
                                        type="text"
                                        placeholder="Tìm cuộc hội thoại..."
                                        className="w-full pl-10 pr-4 py-2.5 bg-gray-100 border-none rounded-2xl text-xs font-bold focus:ring-2 focus:ring-blue-500 transition-all outline-none"
                                    />
                                </div>
                            </div>
                            <div className="flex-1 overflow-y-auto custom-scrollbar">
                                {loading ? (
                                    <div className="p-12 text-center text-gray-400 flex flex-col items-center gap-3">
                                        <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                                        <span className="text-[10px] font-black uppercase tracking-widest">Đang tải...</span>
                                    </div>
                                ) : conversations.length === 0 ? (
                                    <div className="p-12 text-center">
                                        <MessageCircle className="w-12 h-12 text-gray-200 mx-auto mb-3" />
                                        <p className="text-gray-400 text-xs font-bold uppercase tracking-widest">Chưa có tin nhắn</p>
                                    </div>
                                ) : (
                                    conversations.map(conv => (
                                        <button
                                            key={conv.id}
                                            onClick={() => selectConversation(conv.id)}
                                            className={`w-full p-4 text-left flex items-center gap-3 transition-all border-l-4 ${selectedConv === conv.id
                                                ? 'bg-blue-50/50 border-l-blue-600'
                                                : 'border-l-transparent hover:bg-gray-50'
                                                }`}
                                        >
                                            <div className="relative flex-shrink-0">
                                                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-white font-black text-sm shadow-md">
                                                    {conv.otherUserName.charAt(0)}
                                                </div>
                                                <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex justify-between items-baseline mb-0.5">
                                                    <span className="font-black text-gray-900 truncate text-[13px] tracking-tight">
                                                        {conv.otherUserName}
                                                    </span>
                                                    <span className="text-[9px] text-gray-400 font-bold ml-2">
                                                        {conv.lastMessageAt ? formatTime(conv.lastMessageAt) : ''}
                                                    </span>
                                                </div>
                                                <p className={`text-[11px] truncate ${conv.unreadCount > 0 ? 'font-black text-blue-700' : 'text-gray-400 font-medium'}`}>
                                                    {conv.lastMessage || 'Bắt đầu trò chuyện'}
                                                </p>
                                            </div>
                                            {conv.unreadCount > 0 && (
                                                <div className="w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center text-[10px] text-white font-black shadow-lg">
                                                    {conv.unreadCount}
                                                </div>
                                            )}
                                        </button>
                                    ))
                                )}
                            </div>
                        </div>

                        {/* Message Area */}
                        <div className="flex-1 flex flex-col bg-white min-w-0">
                            {selectedConv ? (
                                <>
                                    {/* Chat Header with Status and Call Buttons */}
                                    <div className="px-6 py-4 border-b bg-white flex items-center justify-between sticky top-0 z-20 shadow-sm">
                                        <div className="flex items-center gap-3">
                                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-white font-black shadow-md">
                                                {(conversations.find(c => c.id === selectedConv)?.otherUserName || 'U').charAt(0)}
                                            </div>
                                            <div className="min-w-0">
                                                <h3 className="font-black text-gray-900 truncate tracking-tight text-sm">
                                                    {conversations.find(c => c.id === selectedConv)?.otherUserName || 'Cuộc hội thoại'}
                                                </h3>
                                                <div className="flex items-center gap-1.5">
                                                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                                    <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest">Đang hoạt động</p>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <button onClick={() => handleCall('audio')} className="p-2.5 text-blue-600 hover:bg-blue-50 rounded-full transition-all" title="Gọi thoại">
                                                <Phone className="w-5 h-5" />
                                            </button>
                                            <button onClick={() => handleCall('video')} className="p-2.5 text-blue-600 hover:bg-blue-50 rounded-full transition-all" title="Gọi video">
                                                <Video className="w-5 h-5" />
                                            </button>
                                            <div className="w-px h-8 bg-gray-100 mx-1" />
                                            <ChatSummaryButton
                                                conversationId={selectedConv}
                                                currentUserId={userId}
                                            />
                                        </div>
                                    </div>

                                    {/* Messages Container */}
                                    <div
                                        ref={messagesContainerRef}
                                        onScroll={handleScroll}
                                        className="flex-1 overflow-y-auto px-6 py-6 bg-gray-50/30 custom-scrollbar relative"
                                    >
                                        {messages.map((msg, index) => (
                                            <div
                                                key={msg.id || `msg-${index}-${Date.now()}`}
                                                className={`flex w-full ${msg.senderId === userId ? 'justify-end' : 'justify-start'} mb-2`}
                                            >
                                                <div className={`max-w-[75%] rounded-[24px] px-5 py-3 shadow-sm ${msg.senderId === userId
                                                    ? 'bg-blue-600 text-white rounded-br-none'
                                                    : 'bg-white text-gray-800 rounded-bl-none border border-gray-100'
                                                    }`}>

                                                    {msg.fileUrl && msg.fileType === 'image' && (
                                                        <div className="mb-2 -mx-1 -mt-1 overflow-hidden rounded-xl border border-black/5 shadow-sm">
                                                            <Link href={msg.fileUrl} target="_blank">
                                                                <img
                                                                    src={msg.fileUrl}
                                                                    alt={msg.fileName || 'Image'}
                                                                    className="max-w-[240px] max-h-[320px] w-auto h-auto rounded-xl hover:scale-[1.02] transition-transform duration-200 cursor-pointer object-cover"
                                                                />
                                                            </Link>
                                                        </div>
                                                    )}

                                                    {msg.fileUrl && msg.fileType !== 'image' && (
                                                        <a
                                                            href={msg.fileUrl}
                                                            target="_blank"
                                                            download={msg.fileName || undefined}
                                                            className={`flex items-center gap-3 p-3 rounded-lg mb-2 transition-colors ${msg.senderId === userId ? 'bg-blue-700 hover:bg-blue-800' : 'bg-gray-50 hover:bg-gray-100'
                                                                }`}
                                                        >
                                                            <div className={`p-2 rounded-full ${msg.senderId === userId ? 'bg-blue-500' : 'bg-blue-100'}`}>
                                                                <FileText className={`w-5 h-5 ${msg.senderId === userId ? 'text-white' : 'text-blue-600'}`} />
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <p className="text-sm font-medium truncate">{msg.fileName}</p>
                                                                <p className={`text-[10px] ${msg.senderId === userId ? 'text-blue-200' : 'text-gray-400'}`}>
                                                                    {formatFileSize(msg.fileSize || 0)}
                                                                </p>
                                                            </div>
                                                            <Download className="w-4 h-4 opacity-50 flex-shrink-0" />
                                                        </a>
                                                    )}

                                                    {msg.content && <p className="text-sm whitespace-pre-wrap">{msg.content}</p>}

                                                    <div className={`flex items-center justify-end gap-1 mt-1 ${msg.senderId === userId ? 'text-blue-100' : 'text-gray-400'}`}>
                                                        <span className="text-[10px]">
                                                            {formatTime(msg.createdAt)}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                        <div ref={messagesEndRef} className="h-2" />
                                    </div>

                                    {/* Scroll to Bottom Button */}
                                    {showScrollButton && (
                                        <button
                                            onClick={() => scrollToBottom()}
                                            className="absolute bottom-24 right-8 p-4 bg-white text-primary-600 rounded-full shadow-2xl border border-primary-50 animate-bounce active:scale-110 transition-all z-30 group"
                                        >
                                            <ChevronDown className="w-6 h-6" />
                                            <span className="absolute -top-12 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-[10px] py-2 px-4 rounded-xl opacity-0 group-hover:opacity-100 transition-all whitespace-nowrap font-black shadow-2xl border border-white/10">
                                                MỚI NHẤT ↓
                                            </span>
                                        </button>
                                    )}

                                    {/* Input Area */}
                                    <div className="p-4 bg-white border-t border-gray-100">
                                        {selectedFile && (
                                            <div className="mb-3 p-3 bg-gray-50 rounded-2xl flex items-center justify-between border-2 border-dashed border-gray-200 animate-in slide-in-from-bottom duration-300">
                                                <div className="flex items-center gap-3">
                                                    {selectedFile.type === 'image' ? (
                                                        <img src={selectedFile.preview} className="w-12 h-12 object-cover rounded-xl shadow-sm" />
                                                    ) : (
                                                        <div className="w-12 h-12 bg-blue-100 flex items-center justify-center rounded-xl">
                                                            <FileText className="text-blue-600 w-6 h-6" />
                                                        </div>
                                                    )}
                                                    <div>
                                                        <p className="text-xs font-black text-gray-800 max-w-[200px] truncate leading-tight mb-0.5">
                                                            {selectedFile.file.name}
                                                        </p>
                                                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">{formatFileSize(selectedFile.file.size)}</p>
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={() => setSelectedFile(null)}
                                                    className="p-1.5 hover:bg-gray-200 rounded-full text-gray-400 transition-colors"
                                                >
                                                    <X className="w-5 h-5" />
                                                </button>
                                            </div>
                                        )}
                                        <div className="flex items-center gap-3 bg-gray-100 p-2 rounded-[32px] focus-within:ring-2 focus-within:ring-blue-500 focus-within:bg-white transition-all shadow-inner">
                                            <button
                                                onClick={() => fileInputRef.current?.click()}
                                                disabled={sending || uploading}
                                                className="p-3 text-gray-500 hover:text-blue-600 hover:bg-white rounded-full transition-all disabled:opacity-50"
                                            >
                                                <Paperclip className="w-5 h-5" />
                                            </button>
                                            <input
                                                type="file"
                                                ref={fileInputRef}
                                                onChange={handleFileSelect}
                                                className="hidden"
                                                accept="image/*,application/pdf,.doc,.docx,.xls,.xlsx,.txt"
                                            />
                                            <textarea
                                                value={newMessage}
                                                onChange={e => setNewMessage(e.target.value)}
                                                onKeyDown={e => {
                                                    if (e.key === 'Enter' && !e.shiftKey) {
                                                        e.preventDefault()
                                                        sendMessage()
                                                    }
                                                }}
                                                placeholder="Nhập tin nhắn..."
                                                className="flex-1 bg-transparent border-none outline-none focus:ring-0 text-sm font-bold text-gray-800 placeholder:text-gray-400 py-3 resize-none max-h-32 leading-relaxed"
                                                rows={1}
                                            />
                                            <button
                                                onClick={sendMessage}
                                                disabled={sending || uploading || (!newMessage.trim() && !selectedFile)}
                                                className="p-3 bg-blue-600 text-white rounded-full hover:bg-blue-700 disabled:opacity-50 transition-all shadow-xl shadow-blue-200 active:scale-90"
                                            >
                                                {sending || uploading ? (
                                                    <div className="w-5 h-5 border-2 border-white border-t-transparent animate-spin rounded-full" />
                                                ) : (
                                                    <Send className="w-5 h-5" />
                                                )}
                                            </button>
                                        </div>
                                    </div>
                                </>
                            ) : (
                                <div className="flex-1 flex flex-col items-center justify-center text-gray-400 bg-gray-50">
                                    <div className="bg-white p-6 rounded-full shadow-sm mb-4">
                                        <MessageCircle className="w-12 h-12 text-blue-100" />
                                    </div>
                                    <p className="font-medium text-gray-600">Chọn một cuộc trò chuyện để bắt đầu</p>
                                    <p className="text-sm">Kết nối trực tiếp giữa nhà thầu và khách hàng</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
