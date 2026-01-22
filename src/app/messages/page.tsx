'use client'

import { useState, useEffect, useRef } from 'react'
import Header from '@/components/Header'
import ChatSummaryButton from '@/components/ChatSummaryButton'
import {
    Send, ArrowLeft, MessageCircle, Paperclip, Image as ImageIcon,
    FileText, Download, X, Sparkles, UserPlus, Phone, Video, ChevronDown
} from 'lucide-react'
import { useAuth } from '@/contexts/auth-context'
import Link from 'next/link'
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
    lastMessageAt: string | null
    unreadCount: number
}

interface Message {
    id: string
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
    const { isAuthenticated, isLoading: authLoading } = useAuth()
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
    const messagesContainerRef = useRef<HTMLDivElement>(null)
    const messagesEndRef = useRef<HTMLDivElement>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)

    // Get current user from localStorage
    const [userId, setUserId] = useState<string>('')
    const [userName, setUserName] = useState<string>('')

    useEffect(() => {
        const uid = localStorage.getItem('user_id') || 'guest_' + Date.now()
        const uname = localStorage.getItem('user_name') || 'Khách'
        setUserId(uid)
        setUserName(uname)
        fetchConversations(uid)
    }, [])

    const scrollToBottom = (behavior: ScrollBehavior = 'smooth') => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior })
        }
    }

    useEffect(() => {
        scrollToBottom()
    }, [messages])

    const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
        const { scrollTop, scrollHeight, clientHeight } = e.currentTarget
        setShowScrollButton(scrollHeight - scrollTop - clientHeight > 200)
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
                    if (prev.some(m => m.id === newMsg.id)) return prev
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

        setSending(true)
        let fileData = null

        if (selectedFile) {
            fileData = await uploadFileLoad(selectedFile.file)
            if (!fileData) {
                alert('Tải file thất bại')
                setSending(false)
                return
            }
        }

        try {
            const res = await fetch(`/api/messages/${selectedConv}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    senderId: userId,
                    senderName: userName,
                    content: newMessage || null,
                    fileUrl: fileData ? `/api/files/${fileData.fileId}` : null,
                    fileName: fileData?.fileName,
                    fileType: fileData?.fileType,
                    fileSize: fileData?.fileSize
                })
            })

            if (res.ok) {
                const data = await res.json()
                if (data.success) {
                    setNewMessage('')
                    setSelectedFile(null)
                    if (fileInputRef.current) fileInputRef.current.value = ''
                }
            }
        } catch (error) {
            console.error('Failed to send message:', error)
        } finally {
            setSending(false)
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
        <div className="h-screen bg-gray-50 flex flex-col overflow-hidden">
            <Toaster position="top-right" />
            {userId && <ChatCallManager userId={userId} userName={userName} />}
            <Header />

            <div className="flex-1 max-w-6xl w-full mx-auto px-4 py-6 flex flex-col overflow-hidden">
                <h1 className="text-2xl font-bold text-gray-800 mb-6 flex-shrink-0">Tin nhắn</h1>

                <div className="bg-white rounded-lg border border-gray-200 overflow-hidden flex-1 flex flex-col shadow-sm min-h-0">
                    <div className="flex flex-1 min-h-0">
                        {/* Conversation List */}
                        <div className="w-1/3 border-r border-gray-200 overflow-y-auto bg-gray-50 flex-shrink-0">
                            {loading ? (
                                <div className="p-6 text-center text-gray-500">Đang tải...</div>
                            ) : conversations.length === 0 ? (
                                <div className="p-12 text-center">
                                    <MessageCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                                    <p className="text-gray-500">Chưa có tin nhắn</p>
                                </div>
                            ) : (
                                conversations.map(conv => (
                                    <button
                                        key={conv.id}
                                        onClick={() => selectConversation(conv.id)}
                                        className={`w-full p-4 text-left border-b border-gray-100 transition-colors hover:bg-white ${selectedConv === conv.id ? 'bg-white border-l-4 border-l-blue-500' : ''
                                            }`}
                                    >
                                        <div className="flex flex-col mb-1 w-full">
                                            <div className="flex items-center justify-between w-full">
                                                <span className="font-semibold text-gray-800 truncate mr-2">
                                                    {conv.otherUserName}
                                                </span>
                                                {conv.unreadCount > 0 && (
                                                    <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full flex-shrink-0">
                                                        {conv.unreadCount}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        {conv.projectTitle && (
                                            <p className="text-xs text-blue-600 font-medium truncate mb-1">
                                                Dự án: {conv.projectTitle}
                                            </p>
                                        )}
                                        <div className="flex justify-between items-center">
                                            <p className="text-sm text-gray-500 truncate flex-1">
                                                {conv.lastMessage || 'Bắt đầu trò chuyện'}
                                            </p>
                                            <span className="text-[10px] text-gray-400 ml-2">
                                                {conv.lastMessageAt ? formatTime(conv.lastMessageAt) : ''}
                                            </span>
                                        </div>
                                    </button>
                                ))
                            )}
                        </div>

                        {/* Message Area */}
                        <div className="flex-1 flex flex-col bg-white min-w-0">
                            {selectedConv ? (
                                <>
                                    {/* Guest Conversion Prompt */}
                                    {!isAuthenticated && (
                                        <div className="bg-gradient-to-r from-primary-600 to-indigo-700 p-4 text-white shadow-md relative z-10">
                                            <div className="flex items-center justify-between gap-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="bg-white/20 p-2 rounded-lg backdrop-blur-sm">
                                                        <Sparkles className="w-5 h-5 text-yellow-300" />
                                                    </div>
                                                    <div>
                                                        <p className="font-black text-sm uppercase tracking-wider">Bản tin khách (Guest Mode)</p>
                                                        <p className="text-xs text-blue-100 font-medium">Đăng ký tài khoản để lưu trữ lịch sử chat mãi mãi và quản lý dự án chuyên nghiệp hơn!</p>
                                                    </div>
                                                </div>
                                                <Link
                                                    href="/register"
                                                    className="bg-white text-primary-700 px-4 py-2 rounded-xl text-xs font-black shadow-lg hover:bg-gray-50 transition-all flex items-center gap-2 whitespace-nowrap"
                                                >
                                                    <UserPlus className="w-4 h-4" />
                                                    Đăng ký ngay
                                                </Link>
                                            </div>
                                        </div>
                                    )}

                                    {/* Chat Header with Status and Call Buttons */}
                                    <div className="px-6 py-3 border-b bg-white flex items-center justify-between sticky top-0 z-20 shadow-sm backdrop-blur-md bg-white/90">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-600 to-indigo-600 flex items-center justify-center text-white font-bold shadow-sm">
                                                {(conversations.find(c => c.id === selectedConv)?.otherUserName || 'U').charAt(0)}
                                            </div>
                                            <div className="min-w-0">
                                                <div className="font-bold text-gray-900 truncate">
                                                    {conversations.find(c => c.id === selectedConv)?.otherUserName || 'Cuộc hội thoại'}
                                                </div>
                                                <div className="flex items-center gap-1.5">
                                                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                                                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Đang hoạt động</p>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <button onClick={() => handleCall('audio')} className="p-2 text-primary-600 hover:bg-primary-50 rounded-full transition-all" title="Gọi thoại">
                                                <Phone className="w-5 h-5" />
                                            </button>
                                            <button onClick={() => handleCall('video')} className="p-2 text-primary-600 hover:bg-primary-50 rounded-full transition-all" title="Gọi video">
                                                <Video className="w-5 h-5" />
                                            </button>
                                            <div className="w-px h-6 bg-gray-100 mx-2" />
                                            <ChatSummaryButton
                                                conversationId={selectedConv}
                                                currentUserId={userId}
                                            />
                                        </div>
                                    </div>

                                    {/* Messages */}
                                    <div
                                        ref={messagesContainerRef}
                                        onScroll={handleScroll}
                                        className="flex-1 overflow-y-auto p-6 space-y-6 bg-gray-50/50 relative custom-scrollbar"
                                    >
                                        {messages.map((msg, index) => (
                                            <div
                                                key={msg.id || index}
                                                className={`flex w-full ${msg.senderId === userId ? 'justify-end' : 'justify-start'} mb-4`}
                                            >
                                                <div className={`max-w-[70%] rounded-2xl px-4 py-3 shadow-md ${msg.senderId === userId
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
                                    <div className="border-t border-gray-200 p-4 bg-white">
                                        {selectedFile && (
                                            <div className="mb-3 p-2 bg-gray-50 rounded-lg flex items-center justify-between border border-dashed border-gray-300">
                                                <div className="flex items-center gap-3">
                                                    {selectedFile.type === 'image' ? (
                                                        <img src={selectedFile.preview} className="w-12 h-12 object-cover rounded" />
                                                    ) : (
                                                        <div className="w-12 h-12 bg-blue-100 flex items-center justify-center rounded">
                                                            <FileText className="text-blue-600" />
                                                        </div>
                                                    )}
                                                    <div>
                                                        <p className="text-xs font-medium text-gray-700 max-w-[200px] truncate">
                                                            {selectedFile.file.name}
                                                        </p>
                                                        <p className="text-[10px] text-gray-400">{formatFileSize(selectedFile.file.size)}</p>
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={() => setSelectedFile(null)}
                                                    className="p-1 hover:bg-gray-200 rounded-full text-gray-400"
                                                >
                                                    <X className="w-4 h-4" />
                                                </button>
                                            </div>
                                        )}

                                        <div className="flex items-end gap-3">
                                            <button
                                                onClick={() => fileInputRef.current?.click()}
                                                disabled={sending || uploading}
                                                className="p-2.5 text-gray-500 hover:bg-gray-100 rounded-full transition-colors disabled:opacity-50"
                                                title="Gửi file hoặc ảnh"
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

                                            <div className="flex-1 relative">
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
                                                    className="w-full px-4 py-2.5 bg-gray-100 border-none rounded-2xl focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all resize-none max-h-32 text-sm"
                                                    rows={1}
                                                />
                                            </div>

                                            <button
                                                onClick={sendMessage}
                                                disabled={sending || uploading || (!newMessage.trim() && !selectedFile)}
                                                className="p-2.5 bg-blue-600 text-white rounded-full hover:bg-blue-700 disabled:opacity-50 transition-all shadow-md active:scale-95 flex-shrink-0"
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
