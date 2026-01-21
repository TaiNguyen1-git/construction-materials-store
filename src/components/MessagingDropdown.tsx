'use client'

import { useState, useEffect, useRef } from 'react'
import { MessageCircle, Search, X, User, Clock, ArrowRight, Loader2 } from 'lucide-react'
import { getAuthHeaders } from '@/lib/api-client'
import { useAuth } from '@/contexts/auth-context'
import Link from 'next/link'

interface Conversation {
    id: string
    participant1Id: string
    participant1Name: string
    participant2Id: string
    participant2Name: string
    projectTitle?: string
    lastMessage?: string
    lastMessageAt?: string
    unread1: number
    unread2: number
}

export default function MessagingDropdown() {
    const { user } = useAuth()
    const [isOpen, setIsOpen] = useState(false)
    const [conversations, setConversations] = useState<Conversation[]>([])
    const [loading, setLoading] = useState(false)
    const dropdownRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    const fetchConversations = async () => {
        if (!isOpen) return
        setLoading(true)
        try {
            const res = await fetch('/api/chat/conversations', {
                headers: getAuthHeaders()
            })
            if (res.ok) {
                const json = await res.json()
                setConversations(json.data)
            }
        } catch (err) {
            console.error('Error fetching conversations:', err)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        if (isOpen) {
            fetchConversations()
        }
    }, [isOpen])

    const totalUnread = conversations.reduce((sum, conv) => {
        if (user?.id === conv.participant1Id) return sum + conv.unread1
        return sum + conv.unread2
    }, 0)

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-all duration-300 group"
            >
                <MessageCircle className={`w-6 h-6 ${isOpen ? 'text-blue-600 scale-110' : ''} group-hover:scale-110 transition-transform`} />
                {totalUnread > 0 && (
                    <span className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full border-2 border-white flex items-center justify-center animate-pulse">
                        {totalUnread > 9 ? '9+' : totalUnread}
                    </span>
                )}
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-3 w-80 sm:w-96 bg-white/95 backdrop-blur-xl border border-white/20 shadow-[0_20px_50px_rgba(0,0,0,0.15)] rounded-2xl z-50 overflow-hidden ring-1 ring-black/5 animate-in fade-in slide-in-from-top-4 duration-200">
                    <div className="p-4 border-b border-gray-100 bg-white/50 flex items-center justify-between">
                        <div>
                            <h3 className="font-bold text-gray-900 text-lg">Tin nhắn</h3>
                            <p className="text-xs text-gray-500 font-medium">Bạn có {totalUnread} tin nhắn chưa đọc</p>
                        </div>
                        <button
                            onClick={() => setIsOpen(false)}
                            className="p-1.5 hover:bg-gray-100 rounded-full text-gray-400 transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    <div className="max-h-[420px] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-200">
                        {loading ? (
                            <div className="p-12 flex flex-col items-center justify-center gap-3">
                                <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
                                <p className="text-sm text-gray-400 font-medium italic">Đang tải cuộc trò chuyện...</p>
                            </div>
                        ) : conversations.length === 0 ? (
                            <div className="p-12 text-center">
                                <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <MessageCircle className="w-8 h-8 text-blue-200" />
                                </div>
                                <p className="text-gray-900 font-bold mb-1">Chưa có hội thoại nào</p>
                                <p className="text-gray-500 text-sm">Bắt đầu trò chuyện với khách hàng ngay khi có dự án mới.</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-gray-50">
                                {conversations.map((conv) => {
                                    const isParticipant1 = user?.id === conv.participant1Id
                                    const otherName = isParticipant1 ? conv.participant2Name : conv.participant1Name
                                    const unreadCount = isParticipant1 ? conv.unread1 : conv.unread2

                                    return (
                                        <Link
                                            key={conv.id}
                                            href={`/contractor/messages?id=${conv.id}`}
                                            className={`flex items-start gap-4 p-4 hover:bg-blue-50 transition-all duration-200 group relative ${unreadCount > 0 ? 'bg-blue-50/30' : ''}`}
                                            onClick={() => setIsOpen(false)}
                                        >
                                            {unreadCount > 0 && (
                                                <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-500 rounded-r-full" />
                                            )}

                                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-blue-100 flex-shrink-0">
                                                {otherName.charAt(0)}
                                            </div>

                                            <div className="flex-1 min-w-0">
                                                <div className="flex justify-between items-start mb-1">
                                                    <h4 className={`font-bold text-gray-900 truncate pr-2 ${unreadCount > 0 ? 'text-blue-600' : ''}`}>
                                                        {otherName}
                                                    </h4>
                                                    {conv.lastMessageAt && (
                                                        <span className="text-[10px] text-gray-400 font-medium whitespace-nowrap pt-0.5">
                                                            {new Date(conv.lastMessageAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                        </span>
                                                    )}
                                                </div>

                                                {conv.projectTitle && (
                                                    <div className="flex items-center gap-1.5 mb-1.5">
                                                        <div className="p-0.5 bg-orange-50 rounded text-orange-600">
                                                            <ArrowRight className="w-3 h-3" />
                                                        </div>
                                                        <p className="text-[10px] text-orange-600 font-bold uppercase tracking-wider truncate">
                                                            Dự án: {conv.projectTitle}
                                                        </p>
                                                    </div>
                                                )}

                                                <p className={`text-sm line-clamp-1 ${unreadCount > 0 ? 'text-gray-900 font-semibold' : 'text-gray-500'}`}>
                                                    {conv.lastMessage || 'Chưa có tin nhắn nào...'}
                                                </p>
                                            </div>

                                            {unreadCount > 0 && (
                                                <div className="ml-2 w-2.5 h-2.5 bg-blue-500 rounded-full mt-2" />
                                            )}
                                        </Link>
                                    )
                                })}
                            </div>
                        )}
                    </div>

                    <Link
                        href="/contractor/messages"
                        className="p-4 text-center block text-sm font-bold text-blue-600 hover:bg-gray-50 border-t border-gray-100 transition-colors"
                        onClick={() => setIsOpen(false)}
                    >
                        Xem tất cả tin nhắn
                    </Link>
                </div>
            )}
        </div>
    )
}
