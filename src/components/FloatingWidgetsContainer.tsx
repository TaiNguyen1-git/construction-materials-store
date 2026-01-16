'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { X, Send, Headset, User, Phone, Mail, Sparkles, Plus } from 'lucide-react'
import toast from 'react-hot-toast'
import { useAuth } from '@/contexts/auth-context'
import { usePathname } from 'next/navigation'

/**
 * FloatingWidgetsContainer
 * 
 * A unified floating action button that expands to show:
 * - Chat with AI option
 * - Contact Support option
 * 
 * Only one panel can be open at a time.
 */
export default function FloatingWidgetsContainer() {
    const pathname = usePathname()
    const [isExpanded, setIsExpanded] = useState(false)
    const [activePanel, setActivePanel] = useState<'none' | 'chat' | 'support'>('none')
    const [isHovered, setIsHovered] = useState(false)

    // Hide on admin pages
    if (pathname?.startsWith('/admin')) return null

    // Hide on certain pages where widgets are not needed
    const hiddenPages = ['/login', '/register', '/forgot-password', '/contractor/login', '/contractor/register']
    if (hiddenPages.some(page => pathname === page)) return null

    const openChat = () => {
        setActivePanel('chat')
        setIsExpanded(false)
    }

    const openSupport = () => {
        setActivePanel('support')
        setIsExpanded(false)
    }

    const closePanel = () => {
        setActivePanel('none')
    }

    return (
        <>
            {/* Main FAB Hub - visible when no panel is open */}
            {activePanel === 'none' && (
                <div className="fixed bottom-6 right-6 z-[55] flex flex-col items-end gap-3">
                    {/* Main FAB Button - at bottom */}
                    <button
                        onClick={() => setIsExpanded(!isExpanded)}
                        onMouseEnter={() => setIsHovered(true)}
                        onMouseLeave={() => setIsHovered(false)}
                        className={`relative w-14 h-14 rounded-full flex items-center justify-center shadow-2xl transition-all duration-300 hover:scale-110 border-2 border-white ${isExpanded
                            ? 'bg-gray-800 rotate-45'
                            : 'bg-gradient-to-r from-blue-600 to-indigo-600'
                            }`}
                        aria-label={isExpanded ? 'Đóng menu' : 'Mở menu hỗ trợ'}
                    >
                        {isExpanded ? (
                            <Plus className="w-6 h-6 text-white" />
                        ) : (
                            <div className="relative">
                                <Sparkles className="w-6 h-6 text-white" />
                                <span className="absolute -top-1 -right-1 flex h-3 w-3">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                                </span>
                            </div>
                        )}
                    </button>

                    {/* Expanded Options - appear ABOVE the FAB */}
                    <div
                        className={`absolute bottom-20 right-0 flex flex-col items-end gap-3 transition-all duration-300 ${isExpanded
                            ? 'opacity-100 translate-y-0 pointer-events-auto'
                            : 'opacity-0 translate-y-4 pointer-events-none'
                            }`}
                    >
                        {/* Support Option - appears first (bottom of stack) */}
                        <button
                            onClick={openSupport}
                            className="group flex items-center gap-3"
                        >
                            <span className="bg-white text-indigo-700 text-sm font-bold px-4 py-2 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-all whitespace-nowrap border border-indigo-100">
                                Liên hệ hỗ trợ
                            </span>
                            <div className="w-12 h-12 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg hover:shadow-xl hover:scale-110 hover:ring-4 hover:ring-purple-200 transition-all border-2 border-white">
                                <Headset className="w-5 h-5 text-white" />
                            </div>
                        </button>

                        {/* Chat AI Option - appears second (top of stack) */}
                        <button
                            onClick={openChat}
                            className="group flex items-center gap-3"
                        >
                            <span className="bg-white text-blue-700 text-sm font-bold px-4 py-2 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-all whitespace-nowrap border border-blue-100">
                                Chat với AI
                            </span>
                            <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center shadow-lg hover:shadow-xl hover:scale-110 hover:ring-4 hover:ring-blue-200 transition-all border-2 border-white overflow-hidden">
                                <img
                                    src="/images/smartbuild_bot.png"
                                    alt="SmartBuild AI"
                                    className="w-full h-full object-cover"
                                />
                            </div>
                        </button>
                    </div>

                    {/* Tooltip - appears above FAB when hovered and not expanded */}
                    {!isExpanded && isHovered && (
                        <div className="absolute bottom-16 right-0 bg-white text-gray-800 text-xs font-bold px-3 py-2 rounded-lg shadow-xl whitespace-nowrap border border-gray-100">
                            Cần hỗ trợ? ✨
                            <div className="absolute bottom-0 right-6 translate-y-full border-x-[6px] border-x-transparent border-t-[6px] border-t-white"></div>
                        </div>
                    )}

                    {/* Backdrop */}
                    {isExpanded && (
                        <div
                            className="fixed inset-0 z-[-1]"
                            onClick={() => setIsExpanded(false)}
                        />
                    )}
                </div>
            )}

            {/* Chat Panel */}
            {activePanel === 'chat' && (
                <div className="fixed bottom-6 right-6 z-50">
                    <ChatPanel onClose={closePanel} />
                </div>
            )}

            {/* Support Panel */}
            {activePanel === 'support' && (
                <div className="fixed bottom-6 right-6 z-[60]">
                    <SupportPanel onClose={closePanel} />
                </div>
            )}
        </>
    )
}

// ============ CHAT PANEL ============
function ChatPanel({ onClose }: { onClose: () => void }) {
    const { user, isAuthenticated } = useAuth()
    const pathname = usePathname()
    const [messages, setMessages] = useState<any[]>([])
    const [currentMessage, setCurrentMessage] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [sessionId] = useState(() => `chat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`)
    const messagesEndRef = useRef<HTMLDivElement>(null)

    const isAdminRoute = pathname?.startsWith('/admin')
    const isAdminByRole = isAuthenticated && user && (user.role === 'MANAGER' || user.role === 'EMPLOYEE')
    const isAdmin = isAdminRoute || isAdminByRole

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }

    useEffect(() => {
        scrollToBottom()
    }, [messages])

    useEffect(() => {
        if (messages.length === 0) {
            const welcomeMsg = isAdmin ? 'admin_hello' : 'hello'
            sendMessage(welcomeMsg)
        }
    }, [])

    const sendMessage = async (message: string, useCurrentMessage = false) => {
        const messageToSend = useCurrentMessage ? currentMessage : message
        if (!messageToSend.trim()) return

        setCurrentMessage('')
        setIsLoading(true)

        try {
            const response = await fetch('/api/chatbot', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: messageToSend,
                    sessionId,
                    userRole: user?.role || 'CUSTOMER',
                    isAdmin,
                    context: { currentPage: window.location.pathname }
                })
            })

            const data = await response.json()
            if (data.success) {
                setMessages(prev => [...prev, {
                    id: Date.now().toString(),
                    userMessage: messageToSend,
                    botMessage: data.data.message,
                    suggestions: data.data.suggestions || [],
                    timestamp: data.data.timestamp
                }])
            }
        } catch (error) {
            toast.error('Lỗi kết nối. Vui lòng thử lại.')
        } finally {
            setIsLoading(false)
        }
    }

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            sendMessage('', true)
        }
    }

    const formatTime = (timestamp: string) => {
        return new Date(timestamp).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
    }

    return (
        <div className="w-96 bg-white rounded-lg shadow-2xl border flex flex-col max-h-[600px]">
            {/* Header */}
            <div className={`${isAdmin ? 'bg-gradient-to-r from-indigo-600 to-blue-600' : 'bg-blue-600'} text-white p-4 rounded-t-lg flex justify-between items-center`}>
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white rounded-full overflow-hidden border-2 border-blue-400">
                        <img src="/images/smartbuild_bot.png" alt="SmartBuild AI" className="w-full h-full object-cover" />
                    </div>
                    <div>
                        <div className="font-semibold">{isAdmin ? '🎯 SmartBuild Admin' : '🤖 SmartBuild AI'}</div>
                        <div className="text-xs opacity-90">{isAdmin ? 'Trợ lý quản trị' : 'Trợ lý thông minh'}</div>
                    </div>
                </div>
                <button onClick={onClose} className="text-white hover:bg-white/20 p-1 rounded">
                    <X className="w-5 h-5" />
                </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-[300px]">
                {messages.map((msg) => (
                    <div key={msg.id} className="space-y-3">
                        {msg.userMessage !== 'hello' && msg.userMessage !== 'admin_hello' && (
                            <div className="flex justify-end">
                                <div className="bg-blue-600 text-white p-3 rounded-lg max-w-xs">
                                    <div className="text-sm">{msg.userMessage}</div>
                                    <div className="text-xs opacity-75 mt-1">{formatTime(msg.timestamp)}</div>
                                </div>
                            </div>
                        )}
                        <div className="flex justify-start">
                            <div className="bg-gray-100 p-4 rounded-lg max-w-2xl border border-gray-200">
                                <div className="flex items-start gap-3">
                                    <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0 border border-gray-200 bg-white">
                                        <img src="/images/smartbuild_bot.png" alt="AI" className="w-full h-full object-cover" />
                                    </div>
                                    <div className="flex-1">
                                        <div className="text-sm text-gray-950 whitespace-pre-wrap">{msg.botMessage}</div>
                                        <div className="text-xs text-gray-500 mt-2">{formatTime(msg.timestamp)}</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        {msg.suggestions?.length > 0 && (
                            <div className="flex flex-wrap gap-2">
                                {msg.suggestions.map((s: string, i: number) => (
                                    <button key={i} onClick={() => sendMessage(s)} disabled={isLoading}
                                        className="text-xs bg-blue-100 text-blue-900 font-semibold px-3 py-1.5 rounded-full hover:bg-blue-200 disabled:opacity-50">
                                        {s}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                ))}
                {isLoading && (
                    <div className="flex justify-start">
                        <div className="bg-gray-100 p-3 rounded-lg">
                            <div className="flex space-x-1">
                                <div className="h-2 w-2 bg-blue-600 rounded-full animate-bounce"></div>
                                <div className="h-2 w-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                                <div className="h-2 w-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                            </div>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-4 border-t">
                <div className="flex gap-2">
                    <input
                        type="text"
                        value={currentMessage}
                        onChange={(e) => setCurrentMessage(e.target.value)}
                        onKeyDown={handleKeyPress}
                        placeholder="Nhập tin nhắn..."
                        className="flex-1 border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        disabled={isLoading}
                    />
                    <button
                        onClick={() => sendMessage('', true)}
                        disabled={isLoading || !currentMessage.trim()}
                        className="bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
                    >
                        <Send className="w-5 h-5" />
                    </button>
                </div>
            </div>
        </div>
    )
}

// ============ SUPPORT PANEL ============
function SupportPanel({ onClose }: { onClose: () => void }) {
    const { user } = useAuth()
    const [step, setStep] = useState(1)
    const [loading, setLoading] = useState(false)
    const [form, setForm] = useState({
        name: user?.name || '',
        phone: user?.phone || '',
        email: user?.email || '',
        message: ''
    })

    useEffect(() => {
        if (user) {
            setForm(prev => ({
                ...prev,
                name: user.name || prev.name,
                email: user.email || prev.email,
                phone: user.phone || prev.phone
            }))
            if (user.name && user.phone) setStep(2)
        }
    }, [user])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!form.name || !form.phone || !form.message) {
            toast.error('Vui lòng điền đầy đủ thông tin')
            return
        }
        setLoading(true)
        try {
            const res = await fetch('/api/support', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...form, pageUrl: window.location.href })
            })
            const data = await res.json()
            if (data.success) setStep(3)
            else toast.error(data.error?.message || 'Có lỗi xảy ra')
        } catch {
            toast.error('Lỗi kết nối server')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="w-80 md:w-96 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-indigo-600 to-blue-600 p-5 text-white flex justify-between items-center">
                <div className="flex items-center gap-3">
                    <div className="bg-white/20 p-2 rounded-xl">
                        <Headset className="w-6 h-6" />
                    </div>
                    <div>
                        <h3 className="font-bold text-base">Trung tâm Hỗ trợ</h3>
                        <p className="text-xs opacity-80">Liên hệ trong 5-10 phút</p>
                    </div>
                </div>
                <button onClick={onClose} className="hover:bg-white/20 p-2 rounded-full">
                    <X className="w-5 h-5" />
                </button>
            </div>

            <div className="p-6 max-h-[400px] overflow-y-auto">
                {step === 1 && (
                    <div className="space-y-4">
                        <p className="text-center text-sm text-gray-600 mb-4">Vui lòng để lại thông tin để bắt đầu.</p>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Tên *</label>
                            <div className="relative">
                                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <input type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Nguyễn Văn A"
                                    className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none" />
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Số điện thoại *</label>
                            <div className="relative">
                                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <input type="tel" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="0912345678"
                                    className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none" />
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Email</label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="email@example.com"
                                    className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none" />
                            </div>
                        </div>
                        <button type="button" onClick={() => form.name && form.phone ? setStep(2) : toast.error('Vui lòng nhập tên và SĐT')}
                            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-xl font-bold text-sm mt-2">
                            Tiếp tục
                        </button>
                    </div>
                )}

                {step === 2 && (
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Nội dung yêu cầu *</label>
                            <textarea rows={4} value={form.message} onChange={e => setForm({ ...form, message: e.target.value })} placeholder="Mô tả chi tiết vấn đề..."
                                className="w-full px-4 py-3 bg-gray-50 border rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none resize-none" />
                        </div>
                        <div className="flex gap-3">
                            <button type="button" onClick={() => setStep(1)} className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-3 rounded-xl font-bold text-sm">
                                Quay lại
                            </button>
                            <button type="submit" disabled={loading}
                                className="flex-[2] bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-xl font-bold text-sm disabled:opacity-50 flex items-center justify-center gap-2">
                                {loading ? <div className="w-5 h-5 border-2 border-white border-t-transparent animate-spin rounded-full" /> : <>Gửi <Send className="w-4 h-4" /></>}
                            </button>
                        </div>
                    </form>
                )}

                {step === 3 && (
                    <div className="text-center py-8 space-y-5">
                        <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto">
                            <Headset className="w-10 h-10" />
                        </div>
                        <div>
                            <h4 className="font-extrabold text-xl text-gray-900">Yêu cầu đã gửi!</h4>
                            <p className="text-xs text-gray-500 mt-2 px-4">Đội ngũ sẽ gọi lại qua số {form.phone}.</p>
                        </div>
                        <button onClick={onClose} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-xl font-bold text-sm">
                            Đã hiểu
                        </button>
                    </div>
                )}
            </div>
        </div>
    )
}
