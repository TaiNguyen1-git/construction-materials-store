'use client'

import { useState } from 'react'
import {
    HelpCircle,
    CreditCard,
    Wallet,
    Shield,
    FileText,
    AlertCircle,
    ChevronDown,
    ChevronRight,
    ExternalLink,
    MessageSquare,
    Banknote,
    Scale,
    Clock,
    Search,
    BookOpen,
    Lightbulb,
    Send,
    Loader2,
    Bot,
    User,
    ArrowLeft,
    Building2,
    Truck,
    Gavel,
    LifeBuoy,
    Phone,
    ShieldCheck,
    Zap,
    Cpu,
    Sparkles,
    Activity,
    ShieldAlert
} from 'lucide-react'
import Link from 'next/link'
import { Toaster, toast } from 'react-hot-toast'

interface FAQItem {
    question: string
    answer: string
}

interface FAQCategory {
    title: string
    icon: React.ElementType
    color: string
    faqs: FAQItem[]
}

interface ChatMessage {
    role: 'user' | 'assistant'
    content: string
    timestamp: Date
}

const FAQ_DATA: FAQCategory[] = [
    {
        title: 'Credit Limit Protocol',
        icon: CreditCard,
        color: 'from-blue-600 to-indigo-700',
        faqs: [
            {
                question: 'How do I elevate my institutional credit ceiling?',
                answer: 'Maintain a 100% on-time settlement record for at least 3 fiscal cycles with consistent procurement volume. Submit a formal request via Debt Center → "Elevate Limit". Review cycle: 48-72 operational hours.'
            },
            {
                question: 'Why was my liquid credit retracted?',
                answer: 'Credit retraction occurs due to: (1) Multiple settlement delays, (2) Excessive asset returns, (3) Account inactivity exceeding 60 cycles. Consult our risk audit team for specific telemetry.'
            }
        ]
    },
    {
        title: 'Escrow Disbursement',
        icon: Banknote,
        color: 'from-emerald-600 to-green-700',
        faqs: [
            {
                question: 'When is the Escrow liquidity released?',
                answer: 'Disbursement triggers upon: (1) Milestone verification by Principal, (2) Zero dispute flags for 48h, (3) Institutional audit approval. Transmission window: 1-3 operational cycles.'
            },
            {
                question: 'Why is my Escrow capital restricted?',
                answer: 'Restrictions apply if: (1) Milestone lacks verification evidence, (2) Active dispute protocols exist, (3) Insufficient completion documentation, (4) Principal hasn\'t authorized release. Verify project telemetry for status.'
            }
        ]
    },
    {
        title: 'Residual Commissions',
        icon: Wallet,
        color: 'from-purple-600 to-violet-700',
        faqs: [
            {
                question: 'What is my current commission multiplier?',
                answer: 'Multipliers scale with tier: Silver (3-5%), Gold (5-8%), Elite/Diamond (8-12%). Your effective rate is dynamically calculated based on monthly aggregate procurement volume.'
            },
            {
                question: 'How is Affiliate revenue calculated?',
                answer: 'You capture 2.0% residual commission on all successful procurement phases from entities onboarded via your protocol token. Revenue matures in the Liquid Wallet post 30-day clearing window.'
            }
        ]
    }
]

const AI_QUICK_REPLIES: Record<string, string> = {
    'limit': 'Credit ceiling is determined by settlement history and procurement volume. Access Debt Center → "Elevate Limit" to initialize the audit protocol.',
    'escrow': 'Escrow disbursement triggers post-milestone verification. Current transmission window: 24-72h post-audit.',
    'commission': 'Tier-based multipliers range from 3% to 12%. Check your Corporate Matrix to view active commission strategy.',
    'insurance': 'SmartBuild deploys high-integrity risk mitigation for vertical builds, transit, and personnel. Reference the Risk Vault for active protocols.',
}

export default function ContractorHelpHub() {
    const [searchTerm, setSearchTerm] = useState('')
    const [expandedCategory, setExpandedCategory] = useState<number | null>(null)
    const [expandedFaq, setExpandedFaq] = useState<string | null>(null)
    const [showChat, setShowChat] = useState(false)
    const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
        {
            role: 'assistant',
            content: 'Institutional Protocol Active. I am the SmartBuild AI Core. I can assist with recursive logic regarding credit limits, Escrow disbursement cycles, and risk mitigation strategies. Present your query.',
            timestamp: new Date()
        }
    ])
    const [chatInput, setChatInput] = useState('')
    const [chatLoading, setChatLoading] = useState(false)

    const handleAIChat = () => {
        if (!chatInput.trim()) return

        const userMsg: ChatMessage = { role: 'user', content: chatInput.trim(), timestamp: new Date() }
        setChatMessages(prev => [...prev, userMsg])
        setChatLoading(true)

        const query = chatInput.toLowerCase()
        setChatInput('')

        setTimeout(() => {
            let response = 'Contextual mismatch: I lack specific telemetry on this query. Recommended actions:\n• Audit FAQ modules below\n• Initialize Dispute Protocol\n• Connect with Institutional Support: 1900 xxxx'

            for (const [keyword, reply] of Object.entries(AI_QUICK_REPLIES)) {
                if (query.includes(keyword)) {
                    response = reply
                    break
                }
            }

            const aiMsg: ChatMessage = { role: 'assistant', content: response, timestamp: new Date() }
            setChatMessages(prev => [...prev, aiMsg])
            setChatLoading(false)
        }, 800 + Math.random() * 700)
    }

    const filteredFAQs = searchTerm ? FAQ_DATA.map(category => ({
        ...category,
        faqs: category.faqs.filter(faq =>
            faq.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
            faq.answer.toLowerCase().includes(searchTerm.toLowerCase())
        )
    })).filter(cat => cat.faqs.length > 0) : FAQ_DATA

    return (
        <div className="space-y-12 animate-in fade-in duration-500 pb-24 max-w-7xl mx-auto">
            {/* High-Intelligence Header */}
            <div className="space-y-8 py-12">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="space-y-1">
                        <h1 className="text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-3">
                            <MessageSquare className="w-8 h-8 text-blue-600" />
                            Trung tâm hỗ trợ
                        </h1>
                        <p className="text-slate-500 text-sm font-medium">Tìm kiếm giải pháp & Kết nối với đội ngũ vận hành 24/7</p>
                    </div>

                    <div className="flex items-center gap-3">
                        <button className="px-6 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 transition-all flex items-center gap-2 shadow-md shadow-blue-500/10 active:scale-95">
                            <LifeBuoy size={18} /> Gửi yêu cầu hỗ trợ
                        </button>
                    </div>
                </div>

                <div className="bg-white p-6 md:p-8 rounded-2xl border border-slate-100 shadow-sm relative overflow-hidden">
                    <div className="relative z-10 space-y-6">
                        <div className="relative group max-w-2xl mx-auto">
                            <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 group-focus-within:text-blue-500 transition-colors" />
                            <input
                                type="text"
                                placeholder="Nhập vấn đề bạn đang gặp phải (ví dụ: thanh toán, vận chuyển...)"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-16 pr-8 py-5 bg-slate-50 border-none rounded-2xl text-base focus:bg-white focus:ring-4 focus:ring-blue-600/5 outline-none transition-all font-semibold placeholder:text-slate-400"
                            />
                        </div>
                        <div className="flex flex-wrap justify-center gap-2">
                            {['Thanh toán ví', 'Vận chuyển vật tư', 'Bảo hiểm dự án', 'Khiếu nại cửa hàng'].map(tag => (
                                <button key={tag} className="px-4 py-1.5 bg-slate-50 text-slate-500 rounded-full text-[11px] font-bold hover:bg-blue-50 hover:text-blue-600 transition-all">#{tag}</button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Tactical Quick Links */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                    { id: 'payment', label: 'Tài chính & Ví', icon: Wallet, color: 'text-blue-500', bg: 'bg-blue-50' },
                    { id: 'logistics', label: 'Vận chuyển vật tư', icon: Truck, color: 'text-amber-500', bg: 'bg-amber-50' },
                    { id: 'insurance', label: 'Bảo hiểm & Rủi ro', icon: ShieldCheck, color: 'text-emerald-500', bg: 'bg-emerald-50' },
                    { id: 'disputes', label: 'Khiếu nại B2B', icon: Gavel, color: 'text-purple-500', bg: 'bg-purple-50' }
                ].map(cat => (
                    <div key={cat.id} className="group bg-white p-8 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md hover:border-blue-100 transition-all cursor-pointer">
                        <div className={`w-14 h-14 ${cat.bg} ${cat.color} rounded-xl flex items-center justify-center mb-6 shadow-inner group-hover:scale-110 transition-transform`}>
                            <cat.icon size={28} />
                        </div>
                        <h3 className="text-lg font-bold text-slate-900 group-hover:text-blue-600 transition-colors">{cat.label}</h3>
                        <p className="text-xs font-semibold text-slate-400 mt-2">Xem 12 tài liệu liên quan</p>
                    </div>
                ))}
            </div>

            {/* FAQ Matrix */}
            <div className="grid gap-8">
                {filteredFAQs.map((category, catIdx) => {
                    const CategoryIcon = category.icon
                    const isExpanded = expandedCategory === catIdx

                    return (
                        <div key={catIdx} className={`bg-white rounded-2xl border ${isExpanded ? 'border-blue-200 shadow-lg shadow-blue-50' : 'border-slate-100 shadow-sm'} overflow-hidden transition-all duration-700`}>
                            <button
                                onClick={() => setExpandedCategory(isExpanded ? null : catIdx)}
                                className="w-full flex items-center gap-6 p-8 text-left hover:bg-slate-50/50 transition-all"
                            >
                                <div className={`w-14 h-14 rounded-xl bg-blue-50 flex items-center justify-center`}>
                                    <CategoryIcon className="w-7 h-7 text-blue-600" />
                                </div>
                                <div className="flex-1">
                                    <h3 className="text-xl font-bold text-slate-900">{category.title}</h3>
                                    <p className="text-xs font-semibold text-slate-400">{category.faqs.length} câu hỏi thường gặp</p>
                                </div>
                                <div className={`w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center transition-transform duration-500 ${isExpanded ? 'rotate-180 bg-blue-600 text-white' : 'text-slate-400'}`}>
                                    <ChevronDown className="w-5 h-5" />
                                </div>
                            </button>

                            {isExpanded && (
                                <div className="px-8 pb-8 space-y-4">
                                    {category.faqs.map((faq, faqIdx) => (
                                        <details key={faqIdx} className="group bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden transition-all hover:bg-slate-50">
                                            <summary className="p-6 cursor-pointer list-none flex items-center justify-between">
                                                <span className="text-base font-bold text-slate-900 pr-8">{faq.question}</span>
                                                <ChevronRight className="w-5 h-5 text-slate-300 group-open:rotate-90 transition-transform" />
                                            </summary>
                                            <div className="px-6 pb-6 pt-0 border-t border-slate-50 mt-1">
                                                <p className="text-sm font-semibold text-slate-600 leading-relaxed italic pt-4">“{faq.answer}”</p>
                                            </div>
                                        </details>
                                    ))}
                                </div>
                            )}
                        </div>
                    )
                })}
            </div>

            {/* Contact Support Channels */}
            <div className="space-y-8">
                <div className="flex items-center gap-4">
                    <div className="w-10 h-1 bg-blue-600 rounded-full"></div>
                    <h2 className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.3em]">Kết nối hỗ trợ trực tiếp</h2>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {[
                        { icon: MessageSquare, label: 'Chat trực tuyến', desc: 'Kết nối ngay với chuyên viên hỗ trợ', action: 'Bắt đầu chat', color: 'bg-blue-600', href: '#' },
                        { icon: Phone, label: 'Hotline 24/7', desc: 'Hỗ trợ khẩn cấp qua số điện thoại', action: '1900 xxxx', color: 'bg-slate-900', href: 'tel:1900xxxx' }
                    ].map((channel, i) => (
                        <div key={i} className="bg-white p-8 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all flex items-center gap-6 group">
                            <div className={`w-16 h-16 ${channel.color} text-white rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform`}>
                                <channel.icon size={28} />
                            </div>
                            <div className="flex-1 space-y-1">
                                <h3 className="text-lg font-bold text-slate-900">{channel.label}</h3>
                                <p className="text-xs font-semibold text-slate-500 italic">{channel.desc}</p>
                            </div>
                            {channel.href.startsWith('tel') ? (
                                <a href={channel.href} className={`px-6 py-2.5 rounded-xl text-xs font-bold text-white transition-all active:scale-95 ${channel.color}`}>
                                    {channel.action}
                                </a>
                            ) : (
                                <button onClick={() => setShowChat(true)} className={`px-6 py-2.5 rounded-xl text-xs font-bold text-white transition-all active:scale-95 ${channel.color}`}>
                                    {channel.action}
                                </button>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {/* AI Assistant Widget */}
            {!showChat ? (
                <button
                    onClick={() => setShowChat(true)}
                    className="fixed bottom-8 right-8 z-[100] w-16 h-16 bg-blue-600 text-white rounded-2xl shadow-xl shadow-blue-500/20 hover:bg-blue-700 hover:scale-110 transition-all flex items-center justify-center group border-2 border-white/20"
                >
                    <Bot className="w-8 h-8 group-hover:rotate-12 transition-transform" />
                    <div className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-white animate-pulse shadow-lg"></div>
                </button>
            ) : (
                <div className="fixed bottom-8 right-8 z-[100] w-[400px] bg-white rounded-3xl shadow-[0_30px_60px_rgba(0,0,0,0.12)] border border-slate-100 overflow-hidden flex flex-col animate-in slide-in-from-bottom-10 duration-500" style={{ maxHeight: '600px' }}>
                    <div className="bg-slate-900 p-6 text-white flex items-center justify-between relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/10 rounded-full blur-3xl"></div>
                        <div className="flex items-center gap-4 relative z-10">
                            <div className="w-12 h-12 bg-white/5 backdrop-blur-md rounded-xl flex items-center justify-center border border-white/10">
                                <Bot className="w-6 h-6 text-blue-400" />
                            </div>
                            <div>
                                <h4 className="text-base font-bold">Hỗ trợ thông minh</h4>
                                <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                                    <Activity className="w-3 h-3 text-emerald-500" /> System Online • v4.0
                                </p>
                            </div>
                        </div>
                        <button onClick={() => setShowChat(false)} className="w-10 h-10 bg-white/5 hover:bg-white/10 rounded-xl flex items-center justify-center transition-colors relative z-10">
                            <ChevronDown size={20} />
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-6 space-y-5 bg-slate-50/30 scrollbar-hide" style={{ height: '350px' }}>
                        {chatMessages.map((msg, i) => (
                            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[85%] rounded-2xl p-4 shadow-sm border ${msg.role === 'user' 
                                    ? 'bg-blue-600 text-white rounded-br-none border-blue-500' 
                                    : 'bg-white text-slate-800 rounded-bl-none border-slate-100'
                                }`}>
                                    <div className="flex items-center gap-3 mb-2">
                                        {msg.role === 'assistant' ? (
                                            <Sparkles className="w-3 h-3 text-blue-500" />
                                        ) : (
                                            <User className="w-3 h-3 text-slate-300" />
                                        )}
                                        <span className={`text-[9px] font-bold uppercase tracking-wider ${msg.role === 'user' ? 'text-blue-100' : 'text-slate-400'}`}>
                                            {msg.role === 'user' ? 'Bạn' : 'SmartBuild AI'}
                                        </span>
                                    </div>
                                    <p className="text-xs font-semibold leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                                </div>
                            </div>
                        ))}
                        {chatLoading && (
                            <div className="flex justify-start">
                                <div className="bg-white border border-slate-100 rounded-2xl rounded-bl-none p-6 shadow-sm flex items-center gap-4">
                                    <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
                                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-300">Processing Knowledge...</span>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="p-6 bg-white border-t border-slate-100 space-y-4">
                        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                            {['Nâng hạn mức', 'Giải ngân Escrow', 'Hoa hồng', 'Bảo hiểm công trình'].map(q => (
                                <button
                                    key={q}
                                    onClick={() => { setChatInput(q); }}
                                    className="px-4 py-1.5 bg-slate-50 text-slate-500 hover:bg-blue-600 hover:text-white rounded-full text-[10px] font-bold transition-all border border-slate-100 whitespace-nowrap"
                                >
                                    {q}
                                </button>
                            ))}
                        </div>
                        <div className="flex gap-3">
                            <input
                                type="text"
                                placeholder="Nhập câu hỏi của bạn..."
                                value={chatInput}
                                onChange={(e) => setChatInput(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleAIChat()}
                                className="flex-1 px-5 py-3 bg-slate-50 border-none rounded-xl text-xs font-bold focus:ring-2 focus:ring-blue-600/10 outline-none"
                            />
                            <button
                                onClick={handleAIChat}
                                disabled={chatLoading || !chatInput.trim()}
                                className="w-12 h-12 bg-blue-600 text-white rounded-xl disabled:opacity-30 hover:bg-blue-700 transition-all flex items-center justify-center active:scale-90"
                            >
                                <Send className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
