'use client'

import { useState, useEffect } from 'react'
import { X, Headset, User, Phone, Sparkles, Plus, ArrowRight, ShieldCheck, Clock, BookOpen } from 'lucide-react'
import toast from 'react-hot-toast'
import { useAuth } from '@/contexts/auth-context'
import { usePathname } from 'next/navigation'
import ChatbotPremium from './chatbot/ChatbotPremium'
import Link from 'next/link'

// Số điện thoại Zalo từ biến môi trường
const ZALO_PHONE = process.env.NEXT_PUBLIC_CONTACT_PHONE || '0987654321'

export default function FloatingWidgetsContainer() {
    const pathname = usePathname()
    const [isExpanded, setIsExpanded] = useState(false)
    const [activePanel, setActivePanel] = useState<'none' | 'chat' | 'support'>('none')
    const [isHovered, setIsHovered] = useState(false)
    const [adminStatus, setAdminStatus] = useState<'online' | 'away' | 'offline'>('online')

    // Fetch admin status
    useEffect(() => {
        const checkStatus = async () => {
            try {
                const res = await fetch('/api/support/status')
                if (res.ok) {
                    const data = await res.json()
                    setAdminStatus(data.status || 'online')
                }
            } catch {
                setAdminStatus('online')
            }
        }
        checkStatus()
        const interval = setInterval(checkStatus, 60000) // Check every minute
        return () => clearInterval(interval)
    }, [])

    // Hide logic
    if (pathname?.startsWith('/admin')) return null
    if (pathname?.startsWith('/contractor')) return null
    if (pathname?.startsWith('/supplier')) return null
    if (pathname?.startsWith('/ncc')) return null // Alias for supplier

    const hiddenPatterns = ['/login', '/register', '/forgot-password', '/messages', '/negotiate']
    if (hiddenPatterns.some(pattern => pathname?.includes(pattern))) return null

    const closePanel = () => setActivePanel('none')

    const getStatusColor = () => {
        switch (adminStatus) {
            case 'online': return 'bg-emerald-500'
            case 'away': return 'bg-amber-500'
            default: return 'bg-slate-400'
        }
    }

    const getStatusText = () => {
        switch (adminStatus) {
            case 'online': return 'Đang trực tuyến'
            case 'away': return 'Phản hồi trong 5p'
            default: return 'Để lại tin nhắn'
        }
    }

    const zaloLink = `https://zalo.me/${ZALO_PHONE.replace(/[^0-9]/g, '')}`

    return (
        <>
            {/* Main Premium Hub Control */}
            {activePanel === 'none' && (
                <div className="fixed bottom-8 right-8 z-[55] flex flex-col items-end pointer-events-none">
                    {/* Bento Hub Menu */}
                    <div className={`
                        mb-6 transition-all duration-500 origin-bottom-right
                        ${isExpanded ? 'scale-100 opacity-100 translate-y-0 pointer-events-auto' : 'scale-75 opacity-0 translate-y-10 pointer-events-none'}
                    `}>
                        <div className="glass-morphism p-3 rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.15)] flex flex-col gap-3 w-[300px]">
                            {/* Header with Status */}
                            <div className="px-4 py-2 border-b border-white/20 mb-1 flex items-center justify-between">
                                <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em]">SmartBuild Hub</h4>
                                <div className="flex items-center gap-1.5">
                                    <span className={`w-2 h-2 rounded-full ${getStatusColor()} animate-pulse`} />
                                    <span className="text-[9px] font-bold text-gray-500">{getStatusText()}</span>
                                </div>
                            </div>

                            {/* Option: Chat AI */}
                            <button
                                onClick={() => { setActivePanel('chat'); setIsExpanded(false); }}
                                className="group relative overflow-hidden bg-white/40 hover:bg-blue-600/90 p-4 rounded-3xl transition-all duration-300 flex items-center gap-4 text-left"
                            >
                                <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform duration-300 overflow-hidden">
                                    <img src="/images/smartbuild_bot.png" alt="AI" className="w-full h-full object-cover" />
                                </div>
                                <div className="flex-1">
                                    <h5 className="font-bold text-gray-900 group-hover:text-white text-sm transition-colors">Chat với AI</h5>
                                    <p className="text-[10px] text-gray-500 group-hover:text-blue-100 transition-colors">Tư vấn vật liệu ngay lập tức</p>
                                </div>
                                <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-white transform translate-x-0 group-hover:translate-x-1 transition-all" />
                            </button>

                            {/* Option: Zalo */}
                            <a
                                href={zaloLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="group relative overflow-hidden bg-white/40 hover:bg-blue-500/90 p-4 rounded-3xl transition-all duration-300 flex items-center gap-4 text-left"
                            >
                                <div className="w-12 h-12 bg-blue-500 rounded-2xl flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform duration-300">
                                    {/* Zalo Icon */}
                                    <svg viewBox="0 0 48 48" className="w-7 h-7" fill="white">
                                        <path d="M24 4C12.954 4 4 12.954 4 24s8.954 20 20 20 20-8.954 20-20S35.046 4 24 4zm9.8 28.8c-.3.4-.8.6-1.3.6H14.2c-.9 0-1.4-1-1-1.7l3.4-5.6c.2-.3.5-.5.9-.5h12.1c.4 0 .7.2.9.5l3.4 5.6c.2.4.2.8-.1 1.1zm-1.5-8.8H15.7c-.6 0-1-.4-1-1v-8c0-.6.4-1 1-1h16.6c.6 0 1 .4 1 1v8c0 .6-.4 1-1 1z" />
                                    </svg>
                                </div>
                                <div className="flex-1">
                                    <h5 className="font-bold text-gray-900 group-hover:text-white text-sm transition-colors">Nhắn qua Zalo</h5>
                                    <p className="text-[10px] text-gray-500 group-hover:text-blue-100 transition-colors">Tiện lợi trên điện thoại</p>
                                </div>
                                <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-white transform translate-x-0 group-hover:translate-x-1 transition-all" />
                            </a>

                            {/* Option: Support */}
                            <button
                                onClick={() => { setActivePanel('support'); setIsExpanded(false); }}
                                className="group relative overflow-hidden bg-white/40 hover:bg-indigo-600/90 p-4 rounded-3xl transition-all duration-300 flex items-center gap-4 text-left"
                            >
                                <div className="w-12 h-12 bg-indigo-100 rounded-2xl flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform duration-300">
                                    <Headset className="w-6 h-6 text-indigo-600" />
                                </div>
                                <div className="flex-1">
                                    <h5 className="font-bold text-gray-900 group-hover:text-white text-sm transition-colors">Yêu cầu hỗ trợ</h5>
                                    <p className="text-[10px] text-gray-500 group-hover:text-indigo-100 transition-colors">Kết nối chuyên viên (5-10p)</p>
                                </div>
                                <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-white transform translate-x-0 group-hover:translate-x-1 transition-all" />
                            </button>

                            {/* Help Center Link */}
                            <Link
                                href="/help"
                                onClick={() => setIsExpanded(false)}
                                className="flex items-center justify-center gap-2 py-3 text-gray-500 hover:text-blue-600 transition-colors text-xs font-bold border-t border-white/20 mt-1"
                            >
                                <BookOpen className="w-4 h-4" />
                                <span>Xem Trung tâm trợ giúp</span>
                            </Link>
                        </div>
                    </div>

                    {/* Main Pulse FAB */}
                    <button
                        onClick={() => setIsExpanded(!isExpanded)}
                        onMouseEnter={() => setIsHovered(true)}
                        onMouseLeave={() => setIsHovered(false)}
                        className={`
                            relative group w-16 h-16 rounded-[2rem] flex items-center justify-center 
                            shadow-[0_10px_30px_rgba(79,70,229,0.3)] hover:shadow-[0_15px_40px_rgba(79,70,229,0.4)]
                            transition-all duration-300 hover:scale-105 active:scale-95 pointer-events-auto
                            ${isExpanded ? 'bg-indigo-600 rotate-90' : 'bg-gradient-to-br from-indigo-600 to-blue-700'}
                        `}
                    >
                        {/* Inner icons */}
                        {isExpanded ? (
                            <Plus className="w-8 h-8 text-white rotate-45" />
                        ) : (
                            <div className="relative">
                                <Sparkles className="w-7 h-7 text-white animate-pulse" />
                                <span className={`absolute -top-1 -right-1 block w-3 h-3 ${getStatusColor()} rounded-full border-2 border-indigo-600`} />
                            </div>
                        )}

                        {/* Hover Tooltip */}
                        {!isExpanded && isHovered && (
                            <div className="absolute right-20 bg-indigo-600 text-white text-[10px] font-bold px-3 py-2 rounded-xl whitespace-nowrap animate-scaleIn shadow-2xl">
                                TRUNG TÂM HỖ TRỢ ✨
                                <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 w-2 h-2 bg-indigo-600 rotate-45" />
                            </div>
                        )}
                    </button>
                </div>
            )}

            {/* Panels */}
            {activePanel === 'chat' && <ChatbotPremium onClose={closePanel} />}
            {activePanel === 'support' && (
                <div className="fixed bottom-8 right-8 z-[60] animate-scaleIn pointer-events-none">
                    <div className="pointer-events-auto">
                        <SupportPanel onClose={closePanel} />
                    </div>
                </div>
            )}

            {/* Backdrop for Hub */}
            {isExpanded && (
                <div
                    className="fixed inset-0 z-[50] bg-black/5 backdrop-blur-sm transition-all duration-500"
                    onClick={() => setIsExpanded(false)}
                />
            )}
        </>
    )
}

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

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!form.name || !form.phone || !form.message) {
            toast.error('Vui lòng điền đủ thông tin')
            return
        }

        setLoading(true)
        try {
            const res = await fetch('/api/support/tickets', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    subject: `Hỗ trợ từ Hub: ${form.name}`,
                    description: form.message,
                    guestName: form.name,
                    guestPhone: form.phone,
                    category: 'GENERAL',
                    priority: 'MEDIUM'
                })
            })

            if (res.ok) {
                setStep(3)
            } else {
                const data = await res.json()
                toast.error(data.error || 'Không thể gửi yêu cầu')
            }
        } catch (error) {
            console.error('Error submitting ticket:', error)
            toast.error('Lỗi kết nối máy chủ')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="w-[380px] bg-white rounded-[2.5rem] shadow-[0_30px_70px_rgba(0,0,0,0.2)] overflow-hidden border border-gray-100">
            {/* Header */}
            <div className="bg-gradient-to-r from-indigo-600 to-blue-700 p-6 text-white overflow-hidden relative">
                <div className="absolute top-[-20px] right-[-20px] w-32 h-32 bg-white/10 rounded-full blur-2xl" />
                <div className="flex items-center justify-between relative z-10">
                    <div className="flex items-center gap-4">
                        <div className="bg-white/20 p-3 rounded-2xl backdrop-blur-md">
                            <Headset className="w-6 h-6" />
                        </div>
                        <div>
                            <h3 className="font-bold text-lg leading-tight">Gửi yêu cầu</h3>
                            <p className="text-[10px] opacity-80 uppercase tracking-wider font-semibold">Tư vấn viên sẵn sàng</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="bg-black/10 hover:bg-black/20 p-2 rounded-full transition-colors">
                        <X className="w-4 h-4" />
                    </button>
                </div>
            </div>

            <div className="p-6">
                {step === 1 && (
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 mb-2">
                            <div className="h-1 flex-1 bg-indigo-600 rounded-full" />
                            <div className="h-1 flex-1 bg-gray-200 rounded-full" />
                        </div>
                        <p className="text-xs text-gray-500 font-medium leading-relaxed">Để bắt đầu, vui lòng xác nhận thông tin liên lạc của bạn.</p>

                        <div className="space-y-3">
                            <div className="group">
                                <label className="text-[10px] font-bold text-gray-400 uppercase mb-1 block px-1">Họ và tên</label>
                                <div className="relative">
                                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-indigo-500 transition-colors" />
                                    <input
                                        type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                                        className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl text-sm outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-medium"
                                        placeholder="Nguyễn Văn A"
                                    />
                                </div>
                            </div>
                            <div className="group">
                                <label className="text-[10px] font-bold text-gray-400 uppercase mb-1 block px-1">Số điện thoại</label>
                                <div className="relative">
                                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-indigo-500 transition-colors" />
                                    <input
                                        type="tel" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })}
                                        className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl text-sm outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-medium"
                                        placeholder="09xx xxx xxx"
                                    />
                                </div>
                            </div>
                        </div>

                        <button
                            onClick={() => (form.name && form.phone) ? setStep(2) : toast.error('Điền đủ tên và SĐT')}
                            className="w-full bg-indigo-600 text-white py-4 rounded-3xl font-bold text-sm hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100"
                        >
                            Tiếp theo
                        </button>
                    </div>
                )}

                {step === 2 && (
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="flex items-center gap-2 mb-2">
                            <div className="h-1 flex-1 bg-indigo-600 rounded-full" />
                            <div className="h-1 flex-1 bg-indigo-600 rounded-full" />
                        </div>
                        <div>
                            <label className="text-[10px] font-bold text-gray-400 uppercase mb-1 block px-1">Nội dung cần hỗ trợ</label>
                            <textarea
                                rows={4} value={form.message} onChange={e => setForm({ ...form, message: e.target.value })}
                                className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-sm outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-medium resize-none shadow-inner"
                                placeholder="Hãy cho chúng tôi biết bạn cần hỗ trợ về sản phẩm hay đơn hàng nào..."
                            />
                        </div>

                        <div className="flex gap-3">
                            <button type="button" onClick={() => setStep(1)} className="flex-1 py-4 text-sm font-bold text-gray-500 hover:text-gray-900 transition-colors">Quay lại</button>
                            <button
                                type="submit" disabled={loading}
                                className="flex-[2] bg-indigo-600 text-white py-4 rounded-3xl font-bold text-sm hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100 disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white animate-spin rounded-full" /> : 'Gửi yêu cầu'}
                            </button>
                        </div>
                    </form>
                )}

                {step === 3 && (
                    <div className="py-8 text-center space-y-6">
                        <div className="relative inline-block">
                            <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center animate-bounce">
                                <ShieldCheck className="w-10 h-10 text-green-500" />
                            </div>
                            <div className="absolute inset-0 bg-green-400 rounded-full blur-xl opacity-20" />
                        </div>
                        <div>
                            <h4 className="font-bold text-xl text-gray-900">Yêu cầu đã gửi!</h4>
                            <div className="flex flex-col gap-2 mt-4">
                                <div className="flex items-center gap-3 bg-gray-50 p-3 rounded-2xl text-left border border-gray-100">
                                    <Clock className="w-4 h-4 text-indigo-600" />
                                    <span className="text-[11px] font-medium text-gray-600">Thời gian phản hồi dự kiến: <strong className="text-gray-900">5 phút</strong></span>
                                </div>
                                <div className="flex items-center gap-3 bg-gray-50 p-3 rounded-2xl text-left border border-gray-100">
                                    <ShieldCheck className="w-4 h-4 text-green-600" />
                                    <span className="text-[11px] font-medium text-gray-600">Chúng tôi sẽ gọi lại qua số <strong className="text-gray-900">{form.phone}</strong></span>
                                </div>
                            </div>
                        </div>
                        <button onClick={onClose} className="w-full bg-indigo-600 text-white py-4 rounded-3xl font-bold text-sm shadow-xl shadow-indigo-100">Đã hiểu</button>
                    </div>
                )}
            </div>
        </div>
    )
}
