'use client'

import { useState, useEffect, useRef, Suspense } from 'react'
import Header from '@/components/Header'
import { Toaster, toast } from 'react-hot-toast'
import { ChevronDown, Loader2, X, Users, Image as ImageIcon, FileText, Link2 } from 'lucide-react'
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
    const [showGroupModal, setShowGroupModal] = useState(false)
    const [groupMembers, setGroupMembers] = useState<any[]>([])
    const [fetchingMembers, setFetchingMembers] = useState(false)
    const [activeModalTab, setActiveModalTab] = useState<'members' | 'media'>('members')
    const [mediaSubTab, setMediaSubTab] = useState<'media' | 'files'>('media')
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

    const handleStartDirectChat = async (recipientId: string, recipientName: string) => {
        if (recipientId === userId) {
            toast.error('Không thể nhắn tin cho chính mình')
            return
        }
        
        try {
            const res = await fetch('/api/chat/conversations', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'x-guest-id': userId
                },
                body: JSON.stringify({ recipientId, recipientName })
            })
            if (res.ok) {
                const json = await res.json()
                if (json.success && json.data) {
                    const newConv = json.data
                    setConversations(prev => {
                        if (prev.some(c => c.id === newConv.id)) return prev
                        return [newConv, ...prev]
                    })
                    setSelectedConv(newConv.id)
                    setShowGroupModal(false)
                }
            } else {
                toast.error('Không thể bắt đầu chat riêng')
            }
        } catch (err) {
            console.error('Start direct chat error:', err)
            toast.error('Lỗi khi bắt đầu chat riêng')
        }
    }

    const handleShowGroupInfo = async () => {
        const conv = conversations.find(c => c.id === selectedConv)
        if (!conv) return
        
        setShowGroupModal(true)
        setFetchingMembers(true)
        setGroupMembers([])
        
        try {
            const ids = conv.participantIds || []
            const details = await Promise.all(
                ids.map(async (id: string) => {
                    try {
                        const res = await fetch(`/api/users/${id}/contact`, {
                            headers: { 'x-guest-id': userId }
                        })
                        if (res.ok) {
                            const json = await res.json()
                            return json.data
                        }
                    } catch (e) {
                        console.error(`Failed to fetch contact details for ${id}`, e)
                    }
                    const idx = ids.indexOf(id)
                    const name = conv.participantNames?.[idx] || 'Thành viên'
                    return { id, name, role: id.startsWith('guest_') ? 'GUEST' : 'USER' }
                })
            )
            setGroupMembers(details.filter(Boolean))
        } catch (err) {
            console.error('Fetch group members contact info error:', err)
        } finally {
            setFetchingMembers(false)
        }
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

        // Reset unread count locally in frontend state immediately
        setConversations(prev => prev.map(c => {
            if (c.id === convId) {
                const next = { ...c }
                if (next.isGroup) {
                    if (next.unreadByUser && typeof next.unreadByUser === 'object') {
                        next.unreadByUser = { ...next.unreadByUser, [userId || '']: 0 }
                    }
                } else {
                    const isP1 = next.participant1Id === userId
                    const isP2 = next.participant2Id === userId
                    if (isP1) next.unread1 = 0
                    if (isP2) next.unread2 = 0
                    next.unreadCount = 0
                }
                return next
            }
            return c
        }))

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
                                    {(() => {
                                        const currentConversation = conversations.find(c => c.id === selectedConv);
                                        return (
                                            <ChatHeader 
                                                partnerName={currentConversation?.otherUserName || 'Đối tác'}
                                                userId={userId}
                                                selectedConv={selectedConv}
                                                onCall={handleCall}
                                                isGroup={currentConversation?.isGroup}
                                                participantNames={currentConversation?.participantNames}
                                                onShowInfo={currentConversation?.isGroup ? handleShowGroupInfo : undefined}
                                            />
                                        );
                                    })()}

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
                                            showSenderNames={!!(conversations.find(c => c.id === selectedConv) as any)?.isGroup}
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
            {showGroupModal && (
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
                        <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
                            <div className="bg-white rounded-3xl p-8 max-w-lg w-full shadow-2xl animate-in zoom-in-95 duration-200 relative overflow-hidden flex flex-col max-h-[85vh]">
                                <button 
                                    onClick={() => setShowGroupModal(false)}
                                    className="absolute top-6 right-6 p-2 text-slate-400 hover:text-slate-900 transition-colors z-10"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                                
                                <div className="flex flex-col items-center mb-4">
                                    <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 text-white rounded-2xl flex items-center justify-center text-2xl font-bold mb-3 shadow-xl">
                                        {conversations.find(c => c.id === selectedConv)?.groupTitle?.charAt(0).toUpperCase() || 'G'}
                                    </div>
                                    <h3 className="text-lg font-bold text-slate-900 truncate max-w-full">
                                        {conversations.find(c => c.id === selectedConv)?.groupTitle || 'Trò chuyện nhóm'}
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
                                            {fetchingMembers ? (
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
                                                    const isMe = member.id === userId
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
                                                                        setShowGroupModal(false)
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

                                <div className="mt-6 flex-shrink-0">
                                    <button 
                                        onClick={() => setShowGroupModal(false)}
                                        className="w-full py-4 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-xl font-bold transition-all active:scale-[0.98]"
                                    >
                                        Đóng
                                    </button>
                                </div>
                            </div>
                        </div>
                    )
                })()
            )}
        </div>
    )
}
