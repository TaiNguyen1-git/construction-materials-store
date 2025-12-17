'use client'

import { useState, useEffect, useRef } from 'react'
import Header from '@/components/Header'
import { Send, ArrowLeft, MessageCircle } from 'lucide-react'
import Link from 'next/link'
import { getFirebaseDatabase } from '@/lib/firebase'
import { ref, onChildAdded, off } from 'firebase/database'

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
    content: string
    isRead: boolean
    createdAt: string
}

export default function MessagesPage() {
    const [conversations, setConversations] = useState<Conversation[]>([])
    const [selectedConv, setSelectedConv] = useState<string | null>(null)
    const [messages, setMessages] = useState<Message[]>([])
    const [newMessage, setNewMessage] = useState('')
    const [loading, setLoading] = useState(true)
    const [sending, setSending] = useState(false)
    const messagesEndRef = useRef<HTMLDivElement>(null)

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

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [messages])

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

        // 1. Fetch initial messages from API (History)
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

        // 2. Listen for new messages from Firebase (Real-time)
        // Note: In a real app, we should unsubscribe when switching conversations.
        // We'll use a useEffect for subscription to handle cleanup properly.
    }

    // Effect to handle Firebase subscription for selected conversation
    useEffect(() => {
        if (!selectedConv) return

        const db = getFirebaseDatabase()
        const messagesRef = ref(db, `conversations/${selectedConv}/messages`)

        // Listen for new child added
        const unsubscribe = onChildAdded(messagesRef, (snapshot) => {
            const newMsg = snapshot.val()
            if (newMsg) {
                setMessages(prev => {
                    // Avoid duplicates if message already exists (e.g. from initial fetch)
                    if (prev.some(m => m.id === newMsg.id)) return prev
                    return [...prev, newMsg]
                })
            }
        })

        return () => {
            // Cleanup listener
            off(messagesRef, 'child_added', unsubscribe)
        }
    }, [selectedConv])

    const sendMessage = async () => {
        if (!newMessage.trim() || !selectedConv) return

        setSending(true)
        try {
            const res = await fetch(`/api/messages/${selectedConv}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    senderId: userId,
                    senderName: userName,
                    content: newMessage
                })
            })

            if (res.ok) {
                const data = await res.json()
                if (data.success) {
                    setMessages([...messages, data.data.message])
                    setNewMessage('')
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

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr)
        return date.toLocaleDateString('vi-VN')
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <Header />

            <div className="max-w-6xl mx-auto px-4 py-6">
                <h1 className="text-2xl font-bold text-gray-800 mb-6">Tin nhắn</h1>

                <div className="bg-white rounded-lg border border-gray-200 overflow-hidden" style={{ height: '70vh' }}>
                    <div className="flex h-full">
                        {/* Conversation List */}
                        <div className="w-1/3 border-r border-gray-200 overflow-y-auto">
                            {loading ? (
                                <div className="p-6 text-center text-gray-500">Đang tải...</div>
                            ) : conversations.length === 0 ? (
                                <div className="p-6 text-center">
                                    <MessageCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                                    <p className="text-gray-500">Chưa có tin nhắn</p>
                                </div>
                            ) : (
                                conversations.map(conv => (
                                    <button
                                        key={conv.id}
                                        onClick={() => selectConversation(conv.id)}
                                        className={`w-full p-4 text-left border-b border-gray-100 hover:bg-gray-50 ${selectedConv === conv.id ? 'bg-blue-50' : ''
                                            }`}
                                    >
                                        <div className="flex items-center justify-between mb-1">
                                            <span className="font-medium text-gray-800 truncate">
                                                {conv.otherUserName}
                                            </span>
                                            {conv.unreadCount > 0 && (
                                                <span className="bg-blue-500 text-white text-xs px-2 py-0.5 rounded-full">
                                                    {conv.unreadCount}
                                                </span>
                                            )}
                                        </div>
                                        {conv.projectTitle && (
                                            <p className="text-xs text-blue-600 truncate mb-1">{conv.projectTitle}</p>
                                        )}
                                        <p className="text-sm text-gray-500 truncate">
                                            {conv.lastMessage || 'Cuộc trò chuyện mới'}
                                        </p>
                                    </button>
                                ))
                            )}
                        </div>

                        {/* Message Area */}
                        <div className="flex-1 flex flex-col">
                            {selectedConv ? (
                                <>
                                    {/* Messages */}
                                    <div className="flex-1 overflow-y-auto p-4 space-y-3">
                                        {messages.map(msg => (
                                            <div
                                                key={msg.id}
                                                className={`flex ${msg.senderId === userId ? 'justify-end' : 'justify-start'}`}
                                            >
                                                <div className={`max-w-[70%] rounded-lg px-4 py-2 ${msg.senderId === userId
                                                    ? 'bg-blue-500 text-white'
                                                    : 'bg-gray-100 text-gray-800'
                                                    }`}>
                                                    <p className="text-sm">{msg.content}</p>
                                                    <p className={`text-xs mt-1 ${msg.senderId === userId ? 'text-blue-100' : 'text-gray-400'
                                                        }`}>
                                                        {formatTime(msg.createdAt)}
                                                    </p>
                                                </div>
                                            </div>
                                        ))}
                                        <div ref={messagesEndRef} />
                                    </div>

                                    {/* Input */}
                                    <div className="border-t border-gray-200 p-4">
                                        <div className="flex gap-3">
                                            <input
                                                type="text"
                                                value={newMessage}
                                                onChange={e => setNewMessage(e.target.value)}
                                                onKeyPress={e => e.key === 'Enter' && sendMessage()}
                                                placeholder="Nhập tin nhắn..."
                                                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                                            />
                                            <button
                                                onClick={sendMessage}
                                                disabled={sending || !newMessage.trim()}
                                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                                            >
                                                <Send className="w-5 h-5" />
                                            </button>
                                        </div>
                                    </div>
                                </>
                            ) : (
                                <div className="flex-1 flex items-center justify-center text-gray-500">
                                    Chọn một cuộc trò chuyện để bắt đầu
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
