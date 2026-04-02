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
            <div className="text-center space-y-8 py-12">
                <div className="inline-flex p-6 bg-slate-900 text-white rounded-[2.5rem] shadow-2xl shadow-slate-200 relative group overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 to-purple-600/20 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    <HelpCircle className="w-12 h-12 relative z-10" />
                    <div className="absolute -top-2 -right-2 p-2 bg-blue-500 rounded-full animate-pulse shadow-lg shadow-blue-500/50"></div>
                </div>
                
                <div className="space-y-4">
                    <h1 className="text-5xl font-black text-slate-900 tracking-tighter uppercase italic">Institutional Knowledge Hub</h1>
                    <p className="text-slate-500 font-bold uppercase text-[10px] tracking-[0.3em] max-w-xl mx-auto leading-relaxed">
                        Giải đáp thắc mắc về tài chính, chính sách chiết khấu, Escrow, bảo hiểm và quy trình nghiệm thu B2B
                    </p>
                </div>

                <div className="relative max-w-2xl mx-auto flex items-center gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-6 h-6 text-slate-300" />
                        <input
                            type="text"
                            placeholder="Search Knowledge Base Protocol..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-16 pr-8 py-6 bg-white border border-slate-100 rounded-[2rem] text-sm font-bold shadow-xl shadow-slate-100 focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500 outline-none transition-all placeholder:text-slate-300 italic"
                        />
                    </div>
                    <button className="w-20 h-20 bg-slate-900 text-white rounded-[1.8rem] flex items-center justify-center hover:bg-black transition-all shadow-xl shadow-slate-200 active:scale-90">
                        <Cpu size={24} />
                    </button>
                </div>
            </div>

            {/* Tactical Quick Links */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                {[
                    { label: 'Debt Center', href: '/contractor/debt', icon: CreditCard, color: 'bg-blue-50 text-blue-600 border-blue-100 hover:bg-blue-600 hover:text-white' },
                    { label: 'Risk Vault', href: '/contractor/disputes', icon: ShieldAlert, color: 'bg-rose-50 text-rose-600 border-rose-100 hover:bg-rose-600 hover:text-white' },
                    { label: 'Liquidity Hub', href: '/contractor/wallet', icon: Wallet, color: 'bg-emerald-50 text-emerald-600 border-emerald-100 hover:bg-emerald-600 hover:text-white' },
                    { label: 'Risk Mitigation', href: '/contractor/insurance', icon: ShieldCheck, color: 'bg-amber-50 text-amber-600 border-amber-100 hover:bg-amber-600 hover:text-white' },
                ].map((link, i) => (
                    <Link
                        key={i}
                        href={link.href}
                        className={`p-8 rounded-[2.5rem] border-2 ${link.color} flex flex-col items-center gap-6 transition-all duration-500 group relative overflow-hidden`}
                    >
                        <div className="p-4 bg-white/20 rounded-2xl group-hover:scale-110 transition-transform">
                            <link.icon className="w-8 h-8" />
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] italic">{link.label}</span>
                        <ExternalLink className="absolute bottom-4 right-4 w-4 h-4 opacity-0 group-hover:opacity-40 transition-opacity" />
                    </Link>
                ))}
            </div>

            {/* FAQ Matrix - High Density */}
            <div className="grid gap-8">
                {filteredFAQs.map((category, catIdx) => {
                    const CategoryIcon = category.icon
                    const isExpanded = expandedCategory === catIdx

                    return (
                        <div key={catIdx} className={`bg-white rounded-[3.5rem] border ${isExpanded ? 'border-slate-200 shadow-2xl shadow-slate-200/50' : 'border-slate-100 shadow-sm'} overflow-hidden transition-all duration-700`}>
                            <button
                                onClick={() => setExpandedCategory(isExpanded ? null : catIdx)}
                                className="w-full flex items-center gap-8 p-10 text-left hover:bg-slate-50/50 transition-all"
                            >
                                <div className={`w-16 h-16 rounded-[1.8rem] bg-gradient-to-br ${category.color} flex items-center justify-center shadow-xl shadow-slate-200`}>
                                    <CategoryIcon className="w-8 h-8 text-white" />
                                </div>
                                <div className="flex-1 space-y-1">
                                    <h3 className="text-2xl font-black text-slate-900 uppercase italic tracking-tighter">{category.title}</h3>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">{category.faqs.length} Protocols Documented</p>
                                </div>
                                <div className={`w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center transition-transform duration-500 ${isExpanded ? 'rotate-180 bg-slate-900 text-white' : 'text-slate-300'}`}>
                                    <ChevronDown className="w-6 h-6" />
                                </div>
                            </button>

                            {isExpanded && (
                                <div className="px-10 pb-10 space-y-4 animate-in slide-in-from-top-4 duration-500">
                                    {category.faqs.map((faq, faqIdx) => {
                                        const faqKey = `${catIdx}-${faqIdx}`
                                        const isFaqExpanded = expandedFaq === faqKey

                                        return (
                                            <div key={faqIdx} className="bg-slate-50 rounded-[2rem] overflow-hidden group">
                                                <button
                                                    onClick={() => setExpandedFaq(isFaqExpanded ? null : faqKey)}
                                                    className="w-full flex items-center gap-6 px-8 py-6 text-left transition-colors"
                                                >
                                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${isFaqExpanded ? 'bg-slate-900 text-white' : 'bg-white text-slate-300'}`}>
                                                        <Lightbulb className="w-5 h-5" />
                                                    </div>
                                                    <span className={`text-sm font-black uppercase italic tracking-tight flex-1 ${isFaqExpanded ? 'text-slate-900' : 'text-slate-600 opacity-60'}`}>
                                                        {faq.question}
                                                    </span>
                                                    <ChevronRight className={`w-5 h-5 text-slate-200 transition-transform ${isFaqExpanded ? 'rotate-90 text-slate-900' : ''}`} />
                                                </button>
                                                {isFaqExpanded && (
                                                    <div className="px-8 pb-8 pl-24">
                                                        <div className="bg-white p-8 rounded-[1.8rem] border border-slate-100 shadow-inner">
                                                            <p className="text-sm font-bold text-slate-600 leading-relaxed italic">
                                                                {faq.answer}
                                                            </p>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        )
                                    })}
                                </div>
                            )}
                        </div>
                    )
                })}
            </div>

            {/* Corporate Emergency Contact */}
            <div className="bg-slate-900 rounded-[3.5rem] p-12 text-white relative overflow-hidden group shadow-2xl shadow-slate-300">
                <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-[100px] -mr-48 -mt-48 transition-all duration-1000 group-hover:scale-150"></div>
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-500/10 rounded-full blur-[80px] -ml-32 -mb-32"></div>

                <div className="relative z-10 flex flex-col lg:flex-row items-center gap-12 text-center lg:text-left">
                    <div className="flex-1 space-y-4">
                        <h3 className="text-4xl font-black italic tracking-tighter uppercase">Protocol Failure?</h3>
                        <p className="text-slate-400 font-bold uppercase text-[10px] tracking-[0.3em] max-w-xl">Our Institutional Elite Support units are active and awaiting transmission for high-priority escalations.</p>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-6">
                        <Link
                            href="/contractor/disputes"
                            className="px-10 py-5 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-black text-[10px] uppercase tracking-[0.2em] rounded-2xl flex items-center justify-center gap-3 transition-all active:scale-95 backdrop-blur-md"
                        >
                            <Scale size={18} /> Initialize Mediation
                        </Link>
                        <a
                            href="tel:1900xxxx"
                            className="px-10 py-5 bg-blue-600 text-white font-black text-[10px] uppercase tracking-[0.2em] rounded-2xl hover:bg-blue-700 transition-all flex items-center justify-center gap-3 shadow-2xl shadow-blue-500/20 active:scale-95"
                        >
                            <AlertCircle size={18} /> Direct Tactical Link
                        </a>
                    </div>
                </div>
            </div>

            {/* AI Assistant Widget - Standardized Placement */}
            {!showChat ? (
                <button
                    onClick={() => setShowChat(true)}
                    className="fixed bottom-10 right-10 z-[100] w-20 h-20 bg-slate-900 text-white rounded-[2rem] shadow-2xl shadow-slate-400 hover:bg-black hover:scale-110 transition-all flex items-center justify-center group border-2 border-white/20"
                >
                    <Bot className="w-8 h-8 group-hover:rotate-12 transition-transform" />
                    <div className="absolute -top-1 -right-1 w-6 h-6 bg-blue-500 rounded-full border-4 border-white animate-bounce shadow-lg shadow-blue-500/50"></div>
                </button>
            ) : (
                <div className="fixed bottom-10 right-10 z-[100] w-[450px] bg-white rounded-[3.5rem] shadow-[0_50px_100px_rgba(0,0,0,0.15)] border border-slate-100 overflow-hidden flex flex-col animate-in slide-in-from-bottom-10 duration-500" style={{ maxHeight: '650px' }}>
                    <div className="bg-slate-900 p-8 text-white flex items-center justify-between relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl"></div>
                        <div className="flex items-center gap-5 relative z-10">
                            <div className="w-14 h-14 bg-white/5 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/10 group-hover:scale-110 transition-transform">
                                <Bot className="w-7 h-7 text-blue-400" />
                            </div>
                            <div>
                                <h4 className="text-lg font-black uppercase italic tracking-tighter">AI Core Assistant</h4>
                                <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                                    <Activity className="w-3 h-3 text-emerald-500" /> Protocol Active • V-3.5
                                </p>
                            </div>
                        </div>
                        <button onClick={() => setShowChat(false)} className="w-10 h-10 bg-white/5 hover:bg-white/10 rounded-xl flex items-center justify-center transition-colors relative z-10">
                            <ChevronDown size={20} />
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-8 space-y-6 bg-slate-50/30 scrollbar-hide" style={{ height: '400px' }}>
                        {chatMessages.map((msg, i) => (
                            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[85%] rounded-[2rem] p-6 shadow-sm border ${msg.role === 'user' 
                                    ? 'bg-slate-900 text-white rounded-br-none border-slate-800' 
                                    : 'bg-white text-slate-800 rounded-bl-none border-slate-100'
                                }`}>
                                    <div className="flex items-center gap-3 mb-3">
                                        {msg.role === 'assistant' ? (
                                            <Sparkles className="w-3.5 h-3.5 text-blue-500" />
                                        ) : (
                                            <User className="w-3.5 h-3.5 text-slate-400" />
                                        )}
                                        <span className={`text-[10px] font-black uppercase tracking-widest ${msg.role === 'user' ? 'text-slate-500' : 'text-slate-400'}`}>
                                            {msg.role === 'user' ? 'Operator' : 'AI Core'}
                                        </span>
                                    </div>
                                    <p className="text-xs font-bold leading-relaxed italic whitespace-pre-wrap">{msg.content}</p>
                                </div>
                            </div>
                        ))}
                        {chatLoading && (
                            <div className="flex justify-start">
                                <div className="bg-white border border-slate-100 rounded-[2rem] rounded-bl-none p-6 shadow-sm flex items-center gap-4">
                                    <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
                                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-300">Processing Knowledge...</span>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="p-8 bg-white border-t border-slate-50 space-y-6">
                        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                            {['Limit Audit', 'Disbursement', 'Commissions', 'Risk mitigation'].map(q => (
                                <button
                                    key={q}
                                    onClick={() => { setChatInput(q); }}
                                    className="px-5 py-2.5 bg-slate-50 text-slate-400 hover:bg-slate-900 hover:text-white rounded-full text-[9px] font-black uppercase tracking-widest whitespace-nowrap transition-all border border-slate-100"
                                >
                                    {q}
                                </button>
                            ))}
                        </div>
                        <div className="flex gap-4">
                            <input
                                type="text"
                                placeholder="Present query to AI core..."
                                value={chatInput}
                                onChange={(e) => setChatInput(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleAIChat()}
                                className="flex-1 px-8 py-5 bg-slate-50 border-none rounded-[1.5rem] text-sm font-bold italic focus:ring-4 focus:ring-blue-500/10 outline-none"
                            />
                            <button
                                onClick={handleAIChat}
                                disabled={chatLoading || !chatInput.trim()}
                                className="w-16 h-16 bg-blue-600 text-white rounded-[1.5rem] disabled:opacity-30 hover:bg-blue-700 transition-all flex items-center justify-center active:scale-90"
                            >
                                <Send className="w-6 h-6" />
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
