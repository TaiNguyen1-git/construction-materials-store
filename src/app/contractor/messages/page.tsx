'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import {
    Send, Paperclip, MessageCircle,
    Search, User, MoreVertical,
    Phone, ArrowLeft, Loader2
} from 'lucide-react'
import Sidebar from '../components/Sidebar'
import ContractorHeader from '../components/ContractorHeader'
import { getAuthHeaders } from '@/lib/api-client'
import toast, { Toaster } from 'react-hot-toast'

function MessagesContent() {
    const searchParams = useSearchParams()
    const [sidebarOpen, setSidebarOpen] = useState(true)
    const [user, setUser] = useState<any>(null)
    const [conversations, setConversations] = useState<any[]>([])
    const [selectedId, setSelectedId] = useState<string | null>(searchParams.get('id'))
    const [loading, setLoading] = useState(true)
    const [messages, setMessages] = useState<any[]>([])
    const [newMessage, setNewMessage] = useState('')

    useEffect(() => {
        const userData = localStorage.getItem('user')
        if (userData) {
            setUser(JSON.parse(userData))
        }
        fetchConversations()
    }, [])

    const fetchConversations = async () => {
        try {
            const res = await fetch('/api/chat/conversations', {
                headers: getAuthHeaders()
            })
            if (res.ok) {
                const json = await res.json()
                setConversations(json.data)
                if (!selectedId && json.data.length > 0) {
                    setSelectedId(json.data[0].id)
                }
            }
        } catch (err) {
            console.error(err)
        } finally {
            setLoading(false)
        }
    }

    const selectedConv = conversations.find(c => c.id === selectedId)

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            <Toaster position="top-right" />
            <ContractorHeader sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} user={user} />
            <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

            <main className={`flex-1 pt-[73px] transition-all duration-300 ${sidebarOpen ? 'lg:ml-64' : 'ml-0'} h-screen flex flex-col`}>
                <div className="flex-1 flex overflow-hidden">
                    {/* Sidebar: Conversations List */}
                    <div className="w-80 border-r border-gray-100 bg-white flex flex-col hidden md:flex">
                        <div className="p-4 border-b border-gray-50">
                            <h2 className="text-xl font-black text-gray-900 mb-4">Hội thoại</h2>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Tìm kiếm khách hàng..."
                                    className="w-full pl-10 pr-4 py-2 bg-gray-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                        </div>
                        <div className="flex-1 overflow-y-auto">
                            {conversations.map(conv => (
                                <button
                                    key={conv.id}
                                    onClick={() => setSelectedId(conv.id)}
                                    className={`w-full p-4 flex items-center gap-3 hover:bg-gray-50 transition-colors border-l-4 ${selectedId === conv.id ? 'bg-blue-50 border-blue-500' : 'border-transparent'}`}
                                >
                                    <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600 font-bold">
                                        {(user?.id === conv.participant1Id ? conv.participant2Name : conv.participant1Name).charAt(0)}
                                    </div>
                                    <div className="flex-1 text-left min-w-0">
                                        <h4 className="font-bold text-gray-900 truncate">
                                            {user?.id === conv.participant1Id ? conv.participant2Name : conv.participant1Name}
                                        </h4>
                                        <p className="text-xs text-gray-500 truncate">{conv.lastMessage || 'Bắt đầu trò chuyện'}</p>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Chat Area */}
                    <div className="flex-1 flex flex-col bg-gray-50 relative">
                        {selectedConv ? (
                            <>
                                {/* Chat Header */}
                                <div className="p-4 bg-white border-b border-gray-100 flex items-center justify-between shadow-sm sticky top-0 z-10">
                                    <div className="flex items-center gap-3">
                                        <button className="md:hidden p-2 -ml-2 text-gray-400"><ArrowLeft className="w-5 h-5" /></button>
                                        <div className="w-10 h-10 rounded-xl bg-blue-500 flex items-center justify-center text-white font-bold">
                                            {(user?.id === selectedConv.participant1Id ? selectedConv.participant2Name : selectedConv.participant1Name).charAt(0)}
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-gray-900 leading-tight">
                                                {user?.id === selectedConv.participant1Id ? selectedConv.participant2Name : selectedConv.participant1Name}
                                            </h3>
                                            <p className="text-[10px] text-green-500 font-black uppercase tracking-widest">Đang trực tuyến</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <button className="p-2 text-gray-400 hover:bg-gray-100 rounded-lg transition-colors"><Phone className="w-5 h-5" /></button>
                                        <button className="p-2 text-gray-400 hover:bg-gray-100 rounded-lg transition-colors"><MoreVertical className="w-5 h-5" /></button>
                                    </div>
                                </div>

                                {/* Messages Container */}
                                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                                    <div className="text-center">
                                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-3 py-1 bg-white rounded-full border border-gray-100 shadow-sm">Hôm nay</span>
                                    </div>

                                    {/* Mock Messages */}
                                    <div className="flex justify-start">
                                        <div className="max-w-[70%] bg-white p-4 rounded-2xl rounded-tl-none shadow-sm border border-gray-100">
                                            <p className="text-sm text-gray-800 leading-relaxed">Chào bạn, tôi muốn hỏi về báo giá dự án xây nhà ở Biên Hòa.</p>
                                            <span className="text-[9px] text-gray-400 font-bold mt-2 block">09:15 AM</span>
                                        </div>
                                    </div>

                                    <div className="flex justify-end">
                                        <div className="max-w-[70%] bg-blue-600 p-4 rounded-2xl rounded-tr-none shadow-xl shadow-blue-100">
                                            <p className="text-sm text-white leading-relaxed">Chào anh, tôi đã nhận được yêu cầu. Anh có thể gửi thêm bản vẽ chi tiết không ạ?</p>
                                            <span className="text-[9px] text-blue-100 font-bold mt-2 block text-right">09:17 AM • Đã xem</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Chat Input */}
                                <div className="p-4 bg-white border-t border-gray-100">
                                    <div className="max-w-4xl mx-auto flex items-end gap-3">
                                        <button className="p-3 text-gray-400 hover:text-blue-600 transition-colors">
                                            <Paperclip className="w-5 h-5" />
                                        </button>
                                        <div className="flex-1 relative">
                                            <textarea
                                                rows={1}
                                                placeholder="Nhập tin nhắn..."
                                                className="w-full p-3 pr-12 bg-gray-50 border-none rounded-2xl text-sm focus:ring-2 focus:ring-blue-500 resize-none max-h-32"
                                                value={newMessage}
                                                onChange={(e) => setNewMessage(e.target.value)}
                                            />
                                            <button className="absolute right-2 bottom-2 p-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all">
                                                <Send className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </>
                        ) : (
                            <div className="flex-1 flex flex-col items-center justify-center p-12 text-center">
                                <div className="w-24 h-24 bg-blue-50 rounded-full flex items-center justify-center mb-6">
                                    <MessageCircle className="w-12 h-12 text-blue-200" />
                                </div>
                                <h3 className="text-2xl font-black text-gray-900 mb-2">Trung tâm Tin nhắn</h3>
                                <p className="text-gray-500 max-w-sm">Chọn một cuộc hội thoại từ danh sách bên trái để bắt đầu trao đổi với khách hàng.</p>
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    )
}

export default function MessagesPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
        }>
            <MessagesContent />
        </Suspense>
    )
}
