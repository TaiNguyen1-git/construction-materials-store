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
    ArrowLeft
} from 'lucide-react'
import Link from 'next/link'
import ContractorHeader from '../components/ContractorHeader'
import Sidebar from '../components/Sidebar'
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
        title: 'Hạn mức tín dụng',
        icon: CreditCard,
        color: 'from-blue-500 to-indigo-500',
        faqs: [
            {
                question: 'Làm sao để nâng hạn mức tín dụng?',
                answer: 'Bạn cần duy trì lịch sử thanh toán đúng hạn trong ít nhất 3 tháng và có doanh thu mua hàng ổn định. Truy cập trang Công nợ → "Yêu cầu nâng hạn mức" để gửi đề nghị. Hạn mức sẽ được xem xét trong 2-3 ngày làm việc.'
            },
            {
                question: 'Tại sao hạn mức tín dụng của tôi bị giảm?',
                answer: 'Hạn mức có thể bị điều chỉnh nếu: (1) Thanh toán trễ hạn nhiều lần, (2) Tỷ lệ trả hàng cao, (3) Tài khoản không hoạt động quá 60 ngày. Liên hệ hỗ trợ để biết chi tiết cụ thể.'
            },
            {
                question: 'Hạn mức tín dụng được tính thế nào?',
                answer: 'Hạn mức được tính dựa trên: Doanh thu trung bình 3 tháng, lịch sử thanh toán, quy mô dự án hiện tại, và xếp hạng nhà thầu. Hạn mức mặc định cho nhà thầu mới là 50 triệu VNĐ.'
            }
        ]
    },
    {
        title: 'Quy trình giải ngân Escrow',
        icon: Banknote,
        color: 'from-emerald-500 to-green-500',
        faqs: [
            {
                question: 'Tiền Escrow được giải ngân khi nào?',
                answer: 'Tiền Escrow được giải ngân sau khi: (1) Milestone được nghiệm thu bởi chủ đầu tư, (2) Không có tranh chấp mở trong 48h, (3) Admin phê duyệt giải ngân. Thời gian chuyển tiền: 1-3 ngày làm việc sau khi giải ngân.'
            },
            {
                question: 'Tại sao tiền Escrow bị giữ lâu?',
                answer: 'Các lý do thường gặp: (1) Milestone chưa được nghiệm thu, (2) Đang có tranh chấp liên quan, (3) Thiếu hồ sơ/bằng chứng hoàn thành, (4) Chủ đầu tư chưa xác nhận. Kiểm tra trang Dự án để biết trạng thái cụ thể.'
            },
            {
                question: 'Phí Escrow là bao nhiêu?',
                answer: 'Phí dịch vụ Escrow là 2% giá trị giao dịch, trừ trực tiếp khi giải ngân. Nhà thầu hạng Vàng trở lên được giảm còn 1.5%. Không thu phí nếu giao dịch bị hủy trước khi giải ngân.'
            }
        ]
    },
    {
        title: 'Chính sách chiết khấu',
        icon: Wallet,
        color: 'from-purple-500 to-violet-500',
        faqs: [
            {
                question: 'Tôi được chiết khấu bao nhiêu phần trăm?',
                answer: 'Chiết khấu phụ thuộc vào: (1) Hạng thành viên: Bạc 3-5%, Vàng 5-8%, Kim Cương 8-12%, (2) Volume mua hàng tháng, (3) Chương trình khuyến mãi đang diễn ra. Xem chi tiết trong trang Công nợ.'
            },
            {
                question: 'Hoa hồng Affiliate được tính thế nào?',
                answer: 'Bạn nhận 2-5% giá trị đơn hàng đầu tiên của mỗi nhà thầu bạn giới thiệu. Hoa hồng được ghi nhận trong Ví hoa hồng và có thể rút về tài khoản ngân hàng sau 30 ngày.'
            }
        ]
    },
    {
        title: 'Bảo hiểm công trình',
        icon: Shield,
        color: 'from-amber-500 to-orange-500',
        faqs: [
            {
                question: 'Bảo hiểm công trình bao gồm những gì?',
                answer: 'Gói bảo hiểm cơ bản bao gồm: (1) Bảo hiểm tai nạn lao động cho thợ, (2) Bảo hiểm cháy nổ tại công trường, (3) Bảo hiểm hư hỏng vật tư do thiên tai. Phí bảo hiểm tùy thuộc quy mô dự án.'
            },
            {
                question: 'Làm sao để mua bảo hiểm?',
                answer: 'Truy cập menu "Bảo hiểm công trình" trong sidebar → chọn gói phù hợp → nhập thông tin dự án → thanh toán trực tuyến. Bảo hiểm có hiệu lực ngay sau khi thanh toán thành công.'
            }
        ]
    },
    {
        title: 'Quy trình nghiệm thu',
        icon: FileText,
        color: 'from-rose-500 to-pink-500',
        faqs: [
            {
                question: 'Quy trình nghiệm thu milestone hoạt động ra sao?',
                answer: 'Bước 1: Hoàn thành công việc → Bước 2: Upload ảnh/video bằng chứng → Bước 3: Chủ đầu tư kiểm tra và phê duyệt → Bước 4: Admin xác nhận → Bước 5: Giải ngân Escrow. Nếu bị từ chối, bạn có thể bổ sung bằng chứng hoặc mở hòa giải.'
            },
            {
                question: 'Nếu chủ đầu tư không đồng ý nghiệm thu?',
                answer: 'Bạn có thể: (1) Bổ sung ảnh/video bằng chứng hoàn thành, (2) Gửi yêu cầu hòa giải qua trang Tranh chấp, (3) Liên hệ Admin can thiệp nếu hòa giải không thành công.'
            }
        ]
    }
]

// Pre-built AI responses for common questions
const AI_QUICK_REPLIES: Record<string, string> = {
    'hạn mức': 'Hạn mức tín dụng của bạn phụ thuộc vào lịch sử thanh toán, doanh thu mua hàng và xếp hạng nhà thầu. Bạn có thể yêu cầu nâng hạn mức tại trang Công nợ → "Yêu cầu nâng hạn mức". Thời gian xem xét: 2-3 ngày làm việc.',
    'giải ngân': 'Tiền Escrow được giải ngân sau khi milestone được nghiệm thu và không có tranh chấp mở. Quy trình: Nghiệm thu → Xác nhận Admin → Giải ngân (1-3 ngày). Kiểm tra trang Dự án để theo dõi trạng thái.',
    'chiết khấu': 'Mức chiết khấu phụ thuộc vào hạng thành viên: Bạc (3-5%), Vàng (5-8%), Kim Cương (8-12%). Volume mua hàng tháng càng cao, chiết khấu càng tốt.',
    'trả hàng': 'Chính sách trả hàng: Trong 7 ngày kể từ ngày nhận, sản phẩm chưa sử dụng, còn nguyên đai kiện. Liên hệ trang Đơn hàng → chọn đơn → "Yêu cầu trả hàng".',
    'bảo hiểm': 'SmartBuild cung cấp bảo hiểm công trình gồm: tai nạn lao động, cháy nổ, hư hỏng vật tư thiên tai. Truy cập menu "Bảo hiểm công trình" để đăng ký.',
    'hoa hồng': 'Hoa hồng Affiliate: 2-5% đơn hàng đầu tiên của nhà thầu bạn giới thiệu. Tiền vào Ví hoa hồng, rút được sau 30 ngày. Xem chi tiết tại trang Ví.',
    'phí': 'Phí nền tảng: (1) Phí Escrow: 2% (VIP: 1.5%), (2) Phí rút tiền: 10.000đ/lần, (3) Không có phí duy trì tài khoản hàng tháng.',
    'thanh toán': 'Các hình thức thanh toán: (1) Chuyển khoản ngân hàng, (2) Thanh toán bằng Ví, (3) Mua trả chậm (theo hạn mức tín dụng). QR thanh toán có sẵn tại trang Công nợ.',
}

export default function ContractorHelpHub() {
    const [sidebarOpen, setSidebarOpen] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')
    const [expandedCategory, setExpandedCategory] = useState<number | null>(null)
    const [expandedFaq, setExpandedFaq] = useState<string | null>(null)
    const [showChat, setShowChat] = useState(false)
    const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
        {
            role: 'assistant',
            content: 'Xin chào! Tôi là trợ lý tài chính của SmartBuild. Tôi có thể giúp bạn giải đáp thắc mắc về hạn mức tín dụng, giải ngân Escrow, chiết khấu, và các chính sách tài chính khác. Hãy đặt câu hỏi!',
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

        // Simulate AI response with keyword matching
        setTimeout(() => {
            let response = 'Cảm ơn câu hỏi! Tôi chưa có thông tin cụ thể về vấn đề này. Bạn có thể:\n• Xem FAQ bên dưới để tìm câu trả lời\n• Tạo yêu cầu hỗ trợ tại trang Tranh chấp\n• Liên hệ hotline: 1900 xxxx\n\nBạn cần hỗ trợ thêm về vấn đề nào?'

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
        <div className="min-h-screen bg-[#F8FAFC]">
            <Toaster position="top-right" />
            <ContractorHeader sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
            <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

            <main className={`pt-[60px] transition-all duration-300 ${sidebarOpen ? 'lg:ml-64' : 'ml-0'}`}>
                <div className="p-4 lg:p-6 max-w-5xl mx-auto space-y-8">
                    {/* Header */}
                    <div className="text-center py-8">
                        <div className="inline-flex p-3.5 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl shadow-lg shadow-indigo-200 mb-4">
                            <HelpCircle className="w-8 h-8 text-white" />
                        </div>
                        <h1 className="text-3xl font-black text-slate-900 mt-4">Trung tâm Hỗ trợ Nhà thầu</h1>
                        <p className="text-slate-500 font-medium mt-2 max-w-lg mx-auto">
                            Giải đáp thắc mắc về tài chính, chính sách chiết khấu, Escrow, bảo hiểm và quy trình nghiệm thu
                        </p>

                        {/* Search */}
                        <div className="relative max-w-md mx-auto mt-6">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Tìm kiếm câu hỏi..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-12 pr-4 py-3.5 bg-white border border-slate-200 rounded-2xl text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400"
                            />
                        </div>
                    </div>

                    {/* Quick Links */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {[
                            { label: 'Xem Công nợ', href: '/contractor/debt', icon: CreditCard, color: 'bg-blue-50 text-blue-600 border-blue-100' },
                            { label: 'Tạo Tranh chấp', href: '/contractor/disputes', icon: Scale, color: 'bg-red-50 text-red-600 border-red-100' },
                            { label: 'Ví hoa hồng', href: '/contractor/wallet', icon: Wallet, color: 'bg-emerald-50 text-emerald-600 border-emerald-100' },
                            { label: 'Bảo hiểm', href: '/contractor/insurance', icon: Shield, color: 'bg-amber-50 text-amber-600 border-amber-100' },
                        ].map((link, i) => (
                            <Link
                                key={i}
                                href={link.href}
                                className={`p-4 rounded-2xl border ${link.color} flex items-center gap-3 hover:shadow-md transition-all group`}
                            >
                                <link.icon className="w-5 h-5" />
                                <span className="text-sm font-bold">{link.label}</span>
                                <ExternalLink className="w-3.5 h-3.5 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                            </Link>
                        ))}
                    </div>

                    {/* FAQ Accordion */}
                    <div className="space-y-4">
                        {filteredFAQs.map((category, catIdx) => {
                            const CategoryIcon = category.icon
                            const isExpanded = expandedCategory === catIdx

                            return (
                                <div key={catIdx} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                                    <button
                                        onClick={() => setExpandedCategory(isExpanded ? null : catIdx)}
                                        className="w-full flex items-center gap-4 p-5 text-left hover:bg-slate-50 transition-colors"
                                    >
                                        <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${category.color} flex items-center justify-center shadow-sm`}>
                                            <CategoryIcon className="w-5 h-5 text-white" />
                                        </div>
                                        <div className="flex-1">
                                            <h3 className="font-bold text-slate-900">{category.title}</h3>
                                            <p className="text-xs text-slate-400 mt-0.5">{category.faqs.length} câu hỏi</p>
                                        </div>
                                        <div className={`transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}>
                                            <ChevronDown className="w-5 h-5 text-slate-400" />
                                        </div>
                                    </button>

                                    {isExpanded && (
                                        <div className="border-t border-slate-50 divide-y divide-slate-50">
                                            {category.faqs.map((faq, faqIdx) => {
                                                const faqKey = `${catIdx}-${faqIdx}`
                                                const isFaqExpanded = expandedFaq === faqKey

                                                return (
                                                    <div key={faqIdx}>
                                                        <button
                                                            onClick={() => setExpandedFaq(isFaqExpanded ? null : faqKey)}
                                                            className="w-full flex items-center gap-3 px-5 py-4 text-left hover:bg-slate-50/50 transition-colors"
                                                        >
                                                            <Lightbulb className={`w-4 h-4 flex-shrink-0 ${isFaqExpanded ? 'text-amber-500' : 'text-slate-300'}`} />
                                                            <span className={`text-sm font-medium ${isFaqExpanded ? 'text-slate-900' : 'text-slate-600'}`}>
                                                                {faq.question}
                                                            </span>
                                                            <ChevronRight className={`w-4 h-4 text-slate-300 ml-auto flex-shrink-0 transition-transform ${isFaqExpanded ? 'rotate-90' : ''}`} />
                                                        </button>
                                                        {isFaqExpanded && (
                                                            <div className="px-5 pb-4 pl-12">
                                                                <p className="text-sm text-slate-600 leading-relaxed bg-slate-50 p-4 rounded-xl">
                                                                    {faq.answer}
                                                                </p>
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

                    {/* AI Chat Widget - Fixed Bottom Right */}
                    {!showChat ? (
                        <button
                            onClick={() => setShowChat(true)}
                            className="fixed bottom-6 right-6 z-50 bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-4 rounded-full shadow-xl shadow-indigo-200 hover:shadow-2xl hover:scale-105 transition-all group"
                        >
                            <Bot className="w-6 h-6 group-hover:rotate-12 transition-transform" />
                        </button>
                    ) : (
                        <div className="fixed bottom-6 right-6 z-50 w-[380px] bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col" style={{ maxHeight: '500px' }}>
                            {/* Chat Header */}
                            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-4 text-white flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center">
                                        <Bot className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-sm">AI Tư vấn Tài chính</h4>
                                        <p className="text-[10px] text-indigo-200">Hỗ trợ 24/7 • Phản hồi nhanh</p>
                                    </div>
                                </div>
                                <button onClick={() => setShowChat(false)} className="p-1 hover:bg-white/20 rounded-lg">
                                    <ChevronDown className="w-5 h-5" />
                                </button>
                            </div>

                            {/* Chat Messages */}
                            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50/50" style={{ maxHeight: '300px' }}>
                                {chatMessages.map((msg, i) => (
                                    <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                        <div className={`max-w-[85%] rounded-2xl p-3 ${msg.role === 'user'
                                            ? 'bg-indigo-600 text-white rounded-br-md'
                                            : 'bg-white border border-slate-200 rounded-bl-md shadow-sm'
                                            }`}>
                                            <div className="flex items-center gap-1.5 mb-1">
                                                {msg.role === 'assistant' ? (
                                                    <Bot className="w-3 h-3 text-indigo-500" />
                                                ) : (
                                                    <User className="w-3 h-3 text-indigo-200" />
                                                )}
                                                <span className={`text-[10px] font-bold ${msg.role === 'user' ? 'text-indigo-200' : 'text-slate-400'}`}>
                                                    {msg.role === 'user' ? 'Bạn' : 'AI SmartBuild'}
                                                </span>
                                            </div>
                                            <p className={`text-xs whitespace-pre-wrap leading-relaxed ${msg.role === 'user' ? 'text-white' : 'text-slate-700'}`}>
                                                {msg.content}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                                {chatLoading && (
                                    <div className="flex justify-start">
                                        <div className="bg-white border border-slate-200 rounded-2xl rounded-bl-md p-3 shadow-sm">
                                            <div className="flex items-center gap-2">
                                                <Loader2 className="w-3 h-3 animate-spin text-indigo-500" />
                                                <span className="text-xs text-slate-400">Đang trả lời...</span>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Quick Suggestions */}
                            <div className="px-4 py-2 flex gap-2 overflow-x-auto border-t border-slate-50">
                                {['Hạn mức', 'Giải ngân', 'Chiết khấu', 'Phí'].map(q => (
                                    <button
                                        key={q}
                                        onClick={() => { setChatInput(q); }}
                                        className="px-3 py-1.5 bg-indigo-50 text-indigo-600 rounded-full text-[10px] font-bold whitespace-nowrap hover:bg-indigo-100 transition-colors"
                                    >
                                        {q}
                                    </button>
                                ))}
                            </div>

                            {/* Chat Input */}
                            <div className="p-3 border-t border-slate-100 bg-white">
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        placeholder="Hỏi về tài chính..."
                                        value={chatInput}
                                        onChange={(e) => setChatInput(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && handleAIChat()}
                                        className="flex-1 px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                                    />
                                    <button
                                        onClick={handleAIChat}
                                        disabled={chatLoading || !chatInput.trim()}
                                        className="px-3 py-2.5 bg-indigo-600 text-white rounded-xl disabled:opacity-50 hover:bg-indigo-700 transition-colors"
                                    >
                                        <Send className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Contact Section */}
                    <div className="bg-gradient-to-r from-slate-900 to-slate-800 rounded-3xl p-8 text-white">
                        <div className="flex flex-col md:flex-row items-center gap-6">
                            <div className="flex-1">
                                <h3 className="text-xl font-black mb-2">Không tìm thấy câu trả lời?</h3>
                                <p className="text-slate-400 text-sm">Đội ngũ tư vấn tài chính của SmartBuild luôn sẵn sàng hỗ trợ bạn.</p>
                            </div>
                            <div className="flex gap-3">
                                <Link
                                    href="/contractor/disputes"
                                    className="px-6 py-3 bg-white text-slate-900 font-bold text-sm rounded-xl hover:bg-slate-100 transition-colors flex items-center gap-2"
                                >
                                    <MessageSquare className="w-4 h-4" />
                                    Tạo tranh chấp
                                </Link>
                                <a
                                    href="tel:1900xxxx"
                                    className="px-6 py-3 bg-indigo-600 text-white font-bold text-sm rounded-xl hover:bg-indigo-700 transition-colors flex items-center gap-2"
                                >
                                    <AlertCircle className="w-4 h-4" />
                                    Gọi 1900 xxxx
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    )
}
