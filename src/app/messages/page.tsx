'use client'

import { useState, useEffect, useRef, Suspense } from 'react'
import Header from '@/components/Header'
import { Toaster, toast } from 'react-hot-toast'
import { ChevronDown } from 'lucide-react'
import { useAuth } from '@/contexts/auth-context'
import { useSearchParams, useRouter } from 'next/navigation'
import { getFirebaseDatabase } from '@/lib/firebase'
import { ref, onChildAdded, onChildChanged, onValue, set, off } from 'firebase/database'
import ChatCallManager from '@/components/ChatCallManager'
import MessengerChatBubbles from '@/components/chat/MessengerChatBubbles'
import { decodeId } from '@/lib/id-utils'

// Refactored Components
import ChatSidebar from '@/components/chat/ChatSidebar'
import ChatHeader from '@/components/chat/ChatHeader'
import ChatInput from '@/components/chat/ChatInput'
import ChatEmptyState from '@/components/chat/ChatEmptyState'
import { Conversation, ChatMessage } from '@/components/chat/types'

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
    const { user, authLoading } = useAuth() as any
    const [conversations, setConversations] = useState<Conversation[]>([])
    const [selectedConv, setSelectedConv] = useState<string | null>(null)
    const [messages, setMessages] = useState<ChatMessage[]>([])
    const [newMessage, setNewMessage] = useState('')
    const [loading, setLoading] = useState(true)
    const [sending, setSending] = useState(false)
    const [uploading, setUploading] = useState(false)
    const [selectedFile, setSelectedFile] = useState<{ file: File; preview: string; type: string } | null>(null)
    const [showScrollButton, setShowScrollButton] = useState(false)
    const messagesEndRef = useRef<HTMLDivElement>(null)
    const isSendingRef = useRef(false)
    const messagesContainerRef = useRef<HTMLDivElement>(null)
    const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null)
    const [partnerIsTyping, setPartnerIsTyping] = useState(false)
    const [replyingTo, setReplyingTo] = useState<ChatMessage | null>(null)
    const hasAutoConnectedRef = useRef(false)
    const selectedConvRef = useRef<string | null>(null)

    const [userId, setUserId] = useState<string>('')
    const [userName, setUserName] = useState<string>('')
    const searchParams = useSearchParams()
    const router = useRouter()
    const partnerId = searchParams.get('partnerId') ? decodeId(searchParams.get('partnerId')!) : null

    useEffect(() => {
        if (!authLoading) {
            const uid = user?.id || localStorage.getItem('user_id') || 'guest_' + Date.now()
            const uname = user?.name || localStorage.getItem('user_name') || 'Khách'

            if (!user && !localStorage.getItem('user_id')) {
                localStorage.setItem('user_id', uid)
            }

            setUserId(uid)
            setUserName(uname)
            fetchConversations(uid)
        }
    }, [user, authLoading])

    useEffect(() => {
        if (partnerId && userId && conversations.length > 0 && !loading && !hasAutoConnectedRef.current) {
            hasAutoConnectedRef.current = true
            handleAutoConnectPartner()
        }
    }, [partnerId, userId, conversations, loading])

    const handleAutoConnectPartner = async () => {
        const existing = conversations.find(c => c.otherUserId === partnerId)
        if (existing) {
            if (selectedConv !== existing.id) selectConversation(existing.id)
            return
        }

        try {
            const res = await fetch('/api/chat/conversations', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'x-guest-id': userId },
                body: JSON.stringify({ recipientId: partnerId })
            })

            if (res.ok) {
                const data = await res.json()
                if (data.success) {
                    await fetchConversations(userId)
                    selectConversation(data.data.id)
                }
            }
        } catch (error) {
            console.error('Failed to auto-connect partner:', error)
        }
    }

    const scrollToBottom = (behavior: ScrollBehavior = 'smooth') => {
        if (messagesContainerRef.current) {
            messagesContainerRef.current.scrollTo({
                top: messagesContainerRef.current.scrollHeight,
                behavior
            })
        }
    }

    useEffect(() => {
        if (messages.length === 0) return
        const container = messagesContainerRef.current
        if (!container) return

        const isAtBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 150
        if (isSendingRef.current || isAtBottom) {
            const timeoutId = setTimeout(() => {
                scrollToBottom(isSendingRef.current ? 'smooth' : 'auto')
                isSendingRef.current = false
            }, 100)
            return () => clearTimeout(timeoutId)
        }
    }, [messages])

    const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
        const { scrollTop, scrollHeight, clientHeight } = e.currentTarget
        setShowScrollButton(scrollHeight - scrollTop - clientHeight > 300)
    }

    const fetchConversations = async (uid: string) => {
        try {
            const res = await fetch(`/api/chat/conversations?guestId=${uid}`, {
                headers: { 'x-guest-id': uid }
            })
            if (res.ok) {
                const data = await res.json()
                if (data.success) setConversations(data.data)
            }
        } catch (error) {
            console.error('Failed to fetch conversations:', error)
        } finally {
            setLoading(false)
        }
    }

    const selectConversation = async (convId: string) => {
        setSelectedConv(convId)
        selectedConvRef.current = convId
        setMessages([])

        try {
            const res = await fetch(`/api/chat/conversations/${convId}/messages`, {
                headers: { 'x-guest-id': userId }
            })
            if (res.ok) {
                const data = await res.json()
                if (data.success && selectedConvRef.current === convId) {
                    setMessages(data.data)
                    setTimeout(() => scrollToBottom('auto'), 100)
                    fetchConversations(userId)
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

        const unsubscribeAdded = onChildAdded(messagesRef, (snapshot) => {
            const newMsg = snapshot.val()
            if (newMsg) {
                setMessages(prev => {
                    const existingIdx = prev.findIndex(m => m.id === newMsg.id || (m.tempId && m.tempId === newMsg.tempId))
                    if (existingIdx !== -1) {
                        const updated = [...prev]
                        updated[existingIdx] = { ...prev[existingIdx], ...newMsg }
                        return updated
                    }
                    return [...prev, newMsg]
                })
                if (newMsg.senderId !== userId && !newMsg.isRead) markAsRead(selectedConv, newMsg.id)
            }
        })

        const unsubscribeChanged = onChildChanged(messagesRef, (snapshot) => {
            const updatedMsg = snapshot.val()
            if (updatedMsg) setMessages(prev => prev.map(m => m.id === updatedMsg.id ? updatedMsg : m))
        })

        return () => { off(messagesRef) }
    }, [selectedConv, userId])

    useEffect(() => {
        if (!selectedConv) return
        const db = getFirebaseDatabase()
        const typingRef = ref(db, `conversations/${selectedConv}/typing`)
        const currentConv = conversations.find(c => c.id === selectedConv)
        const realPartnerId = currentConv?.otherUserId || partnerId

        onValue(typingRef, (snapshot) => {
            const data = snapshot.val()
            setPartnerIsTyping(!!(data && userId && realPartnerId && data[realPartnerId]))
        })

        return () => { off(typingRef) }
    }, [selectedConv, userId, partnerId, conversations])

    const uploadFileLoad = async (file: File) => {
        setUploading(true)
        try {
            const formData = new FormData()
            formData.append('file', file)
            const res = await fetch('/api/upload/secure', { method: 'POST', body: formData })
            if (res.ok) {
                const data = await res.json()
                return { fileId: data.fileId, fileName: data.originalName, fileType: file.type.startsWith('image/') ? 'image' : 'document', fileSize: data.size }
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

        const optimisticMsg: ChatMessage = {
            id: tempId, 
            tempId, 
            senderId: userId, 
            senderName: userName,
            content: content || null, 
            fileUrl: selectedFile?.preview || null,
            fileName: selectedFile?.file.name || null, 
            fileType: selectedFile?.type || null,
            fileSize: selectedFile?.file.size || 0, 
            isRead: false,
            replyToId: replyingTo?.id, 
            replyTo: replyingTo ? { 
                id: replyingTo.id,
                senderName: replyingTo.senderName, 
                content: replyingTo.content, 
                fileUrl: replyingTo.fileUrl 
            } : null,
            createdAt: new Date().toISOString()
        }
        setMessages(prev => [...prev, optimisticMsg])
        setNewMessage(''); setSelectedFile(null); setReplyingTo(null)

        isSendingRef.current = true
        setSending(true)

        let fileData = null
        if (fileToUpload) {
            fileData = await uploadFileLoad(fileToUpload)
            if (!fileData) {
                toast.error('Tải file thất bại')
                setMessages(prev => prev.filter(m => m.tempId !== tempId))
                setSending(false); return
            }
        }

        try {
            await fetch('/api/chat/messages', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'x-guest-id': userId },
                body: JSON.stringify({ conversationId: selectedConv, content: content || null, senderName: userName, fileUrl: fileData ? `/api/files/${fileData.fileId}` : null, fileName: fileData?.fileName, fileType: fileData?.fileType, replyToId: replyingTo?.id, tempId })
            })
        } catch (error) {
            setMessages(prev => prev.filter(m => m.tempId !== tempId))
        } finally {
            setSending(false)
            if (isSendingRef.current) setTimeout(() => { isSendingRef.current = false }, 100)
        }
    }

    const handleTyping = () => {
        if (!selectedConv || !userId) return
        const db = getFirebaseDatabase()
        const myTypingRef = ref(db, `conversations/${selectedConv}/typing/${userId}`)
        set(myTypingRef, true)
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current)
        typingTimeoutRef.current = setTimeout(() => { set(myTypingRef, null); typingTimeoutRef.current = null }, 4000)
    }

    const markAsRead = async (convId: string, msgId: string) => {
        try { await fetch(`/api/chat/messages/${msgId}/read`, { method: 'POST', headers: { 'x-guest-id': userId } }) } catch (e) { }
    }

    const handleUnsend = async (msgId: string) => {
        if (!confirm('Xác nhận thu hồi tin nhắn?')) return
        try {
            const res = await fetch(`/api/chat/messages/${msgId}/unsend`, { method: 'POST', headers: { 'x-guest-id': userId } })
            if (res.ok) toast.success('Đã thu hồi')
        } catch (e) { toast.error('Lỗi thu hồi') }
    }

    const handleRemoveMessage = async (msgId: string) => {
        if (!confirm('Xác nhận xóa tin nhắn này?')) return
        try {
            const res = await fetch(`/api/chat/messages/${msgId}`, { method: 'DELETE', headers: { 'x-guest-id': userId } })
            if (res.ok) { setMessages(prev => prev.filter(m => m.id !== msgId)); toast.success('Đã xóa') }
        } catch (e) { toast.error('Lỗi xóa') }
    }

    const handleCall = (type: 'audio' | 'video') => {
        const conv = conversations.find(c => c.id === selectedConv)
        if (conv && (window as any).__startCall) (window as any).__startCall(conv.otherUserId, conv.otherUserName, conv.id, type)
        else toast.error('Hệ thống gọi chưa sẵn sàng')
    }

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            <Toaster position="top-right" />
            {userId && <ChatCallManager userId={userId} userName={userName} />}
            <Header />

            <div className="flex-1 max-w-6xl w-full mx-auto px-1 sm:px-4 py-2 sm:py-4 flex flex-col min-h-0">
                <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden h-[calc(100vh-180px)] min-h-[500px] flex flex-col shadow-2xl mb-8 mt-2">
                    <div className="flex flex-1 min-h-0">
                        <ChatSidebar 
                            conversations={conversations}
                            selectedConv={selectedConv}
                            loading={loading}
                            onSelect={selectConversation}
                            formatTime={(date) => new Date(date).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                            formatLastMessage={(content) => {
                                if (!content) return 'Bắt đầu trò chuyện'
                                if (content.startsWith('[CALL_LOG]:')) return '📞 Cuộc gọi'
                                return content
                            }}
                        />

                        <div className="flex-1 flex flex-col bg-white min-w-0">
                            {selectedConv ? (
                                <>
                                    <ChatHeader 
                                        partnerName={conversations.find(c => c.id === selectedConv)?.otherUserName || 'Đối tác'}
                                        userId={userId}
                                        selectedConv={selectedConv}
                                        onCall={handleCall}
                                    />

                                    <div ref={messagesContainerRef} onScroll={handleScroll} className="flex-1 overflow-y-auto bg-gray-50/30 custom-scrollbar relative">
                                        <MessengerChatBubbles
                                            messages={messages.map(msg => ({
                                                ...msg,
                                                id: msg.id || ('msg-' + Math.random()),
                                                content: msg.content || '',
                                                senderType: (msg as any).senderType || (msg.senderId === userId ? 'me' : 'other'),
                                                senderName: msg.senderName || 'Đối tác',
                                                createdAt: msg.createdAt,
                                                status: msg.isUnsent ? 'unsent' : (msg.isRead ? 'seen' : (msg.isDelivered ? 'delivered' : 'sent')),
                                                imageUrl: msg.imageUrl || (msg.fileUrl && msg.fileType === 'image' ? msg.fileUrl : undefined),
                                                attachments: msg.attachments || (msg.fileUrl && msg.fileType !== 'image' ? [{ fileName: msg.fileName || 'Tệp đính kèm', fileUrl: msg.fileUrl, fileType: msg.fileType || '' }] : [])
                                            } as ChatMessage))}
                                            themeColor="blue"
                                            showSenderNames={false}
                                            autoScroll={false}
                                            isTyping={partnerIsTyping}
                                            typingPartnerName={conversations.find(c => c.id === selectedConv)?.otherUserName || 'Đối tác'}
                                            onReply={(msg) => setReplyingTo(msg as any)}
                                            onUnsend={handleUnsend}
                                            onRemove={handleRemoveMessage}
                                        />
                                        <div ref={messagesEndRef} className="h-2" />
                                    </div>

                                    {showScrollButton && (
                                        <button onClick={() => scrollToBottom()} className="absolute bottom-24 right-8 p-4 bg-white text-primary-600 rounded-full shadow-2xl border border-primary-50 animate-bounce z-30 group">
                                            <ChevronDown className="w-6 h-6" />
                                        </button>
                                    )}

                                    <ChatInput 
                                        newMessage={newMessage}
                                        setNewMessage={setNewMessage}
                                        selectedFile={selectedFile}
                                        setSelectedFile={setSelectedFile}
                                        replyingTo={replyingTo}
                                        setReplyingTo={setReplyingTo}
                                        sending={sending}
                                        uploading={uploading}
                                        onSendMessage={sendMessage}
                                        onTyping={handleTyping}
                                        formatFileSize={(bytes) => {
                                            if (!bytes) return ''
                                            if (bytes < 1024) return bytes + ' B'
                                            if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
                                            return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
                                        }}
                                    />
                                </>
                            ) : (
                                <ChatEmptyState />
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
