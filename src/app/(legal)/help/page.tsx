'use client'

import { useState } from 'react'
import { HelpCircle, Search, MessageSquare, Book, Settings, User, ChevronDown, Rocket, ShieldCheck, CreditCard } from 'lucide-react'
import Link from 'next/link'

export default function HelpPage() {
    const [expandedFaq, setExpandedFaq] = useState<number | null>(null)

    const categories = [
        {
            icon: User,
            title: "Dành cho Chủ nhà",
            desc: "Hướng dẫn tạo dự án, bóc tách vật tư và tìm kiếm nhà thầu uy tín.",
            href: "#owner"
        },
        {
            icon: Book,
            title: "Dành cho Nhà thầu",
            desc: "Cách quản lý tiến độ, báo cáo khối lượng và nhận thanh toán.",
            href: "#contractor"
        },
        {
            icon: Settings,
            title: "Quản lý Tài khoản",
            desc: "Cài đặt bảo mật 2FA, cập nhật hồ sơ năng lực và quản lý thông báo.",
            href: "#account"
        },
        {
            icon: MessageSquare,
            title: "Hỗ trợ trực tiếp",
            desc: "Chat trực tiếp với chuyên gia hoặc gửi yêu cầu hỗ trợ kỹ thuật.",
            href: "mailto:support@smartbuild.vn"
        }
    ]

    const faqs = [
        {
            q: "Làm thế nào để sử dụng AI bóc tách vật tư chính xác nhất?",
            a: "Để AI đạt độ chính xác cao nhất, bạn nên tải lên bản vẽ CAD sạch hoặc file PDF có kích thước rõ ràng. Hệ thống sẽ phân tích dựa trên TCVN và đưa ra bảng bóc tách khối lượng (BOQ) chi tiết."
        },
        {
            q: "Quy trình thanh toán an toàn qua giải pháp Escrow của SmartBuild?",
            a: "Khi bạn thanh toán, tiền sẽ được 'treo' tại hệ thống SmartBuild. Tiền chỉ được giải ngân cho nhà thầu hoặc nhà cung cấp sau khi bạn thực hiện bước 'Xác nhận nghiệm thu' trên ứng dụng."
        },
        {
            q: "Nhà cung cấp cần hồ sơ gì để được gắn mác 'Uy tín'?",
            a: "Nhà cung cấp cần cung cấp: GPKD, Chứng chỉ CO/CQ của sản phẩm, và có ít nhất 10 đơn hàng hoàn thành tốt mà không có khiếu nại về chất lượng."
        },
        {
            q: "Tôi có thể hủy dự án khi đang thi công không?",
            a: "Có, nhưng sẽ áp dụng quy trình tất toán dựa trên khối lượng thực tế đã thi công. Ban Pháp Chế của chúng tôi sẽ hỗ trợ giám sát việc tất toán này để đảm bảo công bằng cho cả hai bên."
        },
        {
            q: "SmartBuild bảo mật dữ liệu bản vẽ của tôi như thế nào?",
            a: "Bản vẽ của bạn được mã hóa AES-256 và lưu trữ trên hệ thống đám mây bảo mật. Chỉ những đối tác bạn cho phép (qua nút Share) mới có quyền xem bản vẽ trong thời gian giới hạn."
        }
    ]

    return (
        <div className="animate-fade-in-up space-y-24">
            {/* Header Section */}
            <section>
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-blue-50 border border-blue-100 mb-10 shadow-sm">
                    <HelpCircle className="h-4 w-4 text-blue-500" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-blue-600">SmartBuild Support Center</span>
                </div>

                <h1 className="text-5xl md:text-7xl font-black text-neutral-900 tracking-tighter leading-[1.05] mb-10">
                    Trung tâm <br /><span className="text-blue-500 drop-shadow-sm">Trợ giúp</span>
                </h1>

                <div className="relative max-w-2xl not-prose mb-12">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-neutral-400" />
                    <input
                        type="text"
                        placeholder="Bạn cần hỗ trợ điều gì?..."
                        className="w-full pl-12 pr-6 py-4 rounded-2xl border border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5 outline-none transition-all shadow-sm font-medium"
                    />
                </div>
            </section>

            {/* Categories Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 not-prose">
                {categories.map((cat, i) => (
                    <a
                        href={cat.href}
                        key={i}
                        className="group p-8 rounded-[32px] bg-slate-50 border border-slate-100 hover:bg-white hover:border-blue-500 hover:shadow-xl transition-all duration-300 cursor-pointer"
                    >
                        <div className="h-12 w-12 rounded-2xl bg-white flex items-center justify-center mb-6 shadow-sm group-hover:bg-blue-600 group-hover:text-white transition-all">
                            <cat.icon className="h-6 w-6" />
                        </div>
                        <h3 className="text-xl font-black text-neutral-900 mb-3 uppercase tracking-tight">{cat.title}</h3>
                        <p className="text-sm text-neutral-500 italic leading-relaxed">{cat.desc}</p>
                        <div className="mt-8 flex items-center text-xs font-black text-blue-600 uppercase tracking-widest gap-2 group-hover:gap-4 transition-all">
                            Xem chi tiết <div className="h-1 w-4 bg-blue-600 rounded-full"></div>
                        </div>
                    </a>
                ))}
            </div>

            {/* Detailed Content Sections */}
            <div className="prose prose-neutral prose-lg max-w-none">

                {/* Section: Chủ nhà */}
                <section id="owner" className="pt-12 border-t border-slate-100">
                    <h2 className="flex items-center gap-4 text-3xl font-black italic">
                        <Rocket className="h-8 w-8 text-blue-500" />
                        Dành cho Chủ nhà
                    </h2>
                    <div className="space-y-6">
                        <div className="p-6 rounded-2xl bg-blue-50/30 border border-blue-100">
                            <h4 className="text-blue-700 mt-0">Khởi tạo dự án đầu tiên</h4>
                            <p className="text-sm font-medium text-slate-600 italic">Bấm vào &apos;Tạo dự án mới&apos;, tải lên bản vẽ và AI sẽ tự động phân loại các hạng mục cần thi công.</p>
                        </div>
                        <div className="p-6 rounded-2xl bg-white border border-slate-100 italic">
                            <h4 className="mt-0">Tìm kiếm thầu thợ</h4>
                            <p className="text-sm text-slate-500 leading-relaxed">Sử dụng bộ lọc để chọn nhà thầu theo TrustScore, kinh nghiệm và vị trí dự án của bạn.</p>
                        </div>
                    </div>
                </section>

                {/* Section: Nhà thầu */}
                <section id="contractor" className="pt-24 border-t border-slate-100">
                    <h2 className="flex items-center gap-4 text-3xl font-black italic">
                        <ShieldCheck className="h-8 w-8 text-blue-500" />
                        Dành cho Nhà thầu
                    </h2>
                    <div className="space-y-6">
                        <div className="p-6 rounded-2xl bg-blue-50/30 border border-blue-100">
                            <h4 className="text-blue-700 mt-0">Nâng cao TrustScore</h4>
                            <p className="text-sm font-medium text-slate-600 italic">Cập nhật ảnh thi công định kỳ và hoàn thành dự án đúng hạn để nhận đánh giá 5 sao.</p>
                        </div>
                        <div className="p-6 rounded-2xl bg-white border border-slate-100 italic">
                            <h4 className="mt-0">Quản lý tài chính</h4>
                            <p className="text-sm text-slate-500">Xem lịch sử thanh toán và yêu cầu giải ngân theo từng giai đoạn nghiệm thu của chủ dự án.</p>
                        </div>
                    </div>
                </section>

                {/* Section: Tài khoản */}
                <section id="account" className="pt-24 border-t border-slate-100">
                    <h2 className="flex items-center gap-4 text-3xl font-black italic">
                        <Settings className="h-8 w-8 text-blue-500" />
                        Quản lý tài khoản
                    </h2>
                    <p>Bảo vệ tài sản số của bạn với các cài đặt bảo mật nâng cao:</p>
                    <ul className="grid md:grid-cols-2 gap-4 list-none pl-0">
                        <li className="flex gap-3 text-sm font-bold text-slate-600 italic">
                            <div className="h-5 w-5 bg-blue-100 rounded-full flex items-center justify-center shrink-0">
                                <CreditCard className="h-3 w-3 text-blue-600" />
                            </div>
                            Kích hoạt bảo mật 2 lớp (2FA) qua Google Authenticator.
                        </li>
                        <li className="flex gap-3 text-sm font-bold text-slate-600 italic">
                            <div className="h-5 w-5 bg-blue-100 rounded-full flex items-center justify-center shrink-0">
                                <User className="h-3 w-3 text-blue-600" />
                            </div>
                            Cập nhật Hồ sơ năng lực kèm theo ảnh các dự án đã thực hiện.
                        </li>
                    </ul>
                </section>

                {/* FAQ Section */}
                <section id="faq" className="pt-24 border-t border-slate-100">
                    <h2 className="flex items-center gap-3 text-3xl">
                        <span className="flex items-center justify-center h-10 w-10 rounded-xl bg-blue-600 text-white text-base font-black italic">!</span>
                        Câu hỏi thường gặp (FAQ)
                    </h2>
                    <div className="space-y-4 not-prose mt-8">
                        {faqs.map((faq, i) => (
                            <div
                                key={i}
                                className={`p-6 rounded-2xl border transition-all cursor-pointer ${expandedFaq === i
                                    ? 'bg-blue-50/30 border-blue-200'
                                    : 'bg-white border-slate-100 hover:border-blue-200 hover:bg-slate-50'
                                    }`}
                                onClick={() => setExpandedFaq(expandedFaq === i ? null : i)}
                            >
                                <div className="flex justify-between items-center gap-4">
                                    <span className={`font-bold italic transition-colors ${expandedFaq === i ? 'text-blue-700' : 'text-neutral-700'}`}>
                                        {faq.q}
                                    </span>
                                    <div className={`shrink-0 transition-transform duration-300 ${expandedFaq === i ? 'rotate-180' : ''}`}>
                                        <ChevronDown className={`h-5 w-5 ${expandedFaq === i ? 'text-blue-600' : 'text-neutral-300'}`} />
                                    </div>
                                </div>

                                {expandedFaq === i && (
                                    <div className="mt-4 pt-4 border-t border-blue-100 animate-fade-in">
                                        <p className="text-sm text-neutral-600 leading-relaxed font-medium italic">
                                            {faq.a}
                                        </p>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </section>
            </div>

            <footer className="pt-12 border-t border-neutral-200 mt-20">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <p className="text-xs text-neutral-400 font-bold uppercase tracking-widest leading-loose">
                        Nếu không tìm thấy câu trả lời? <br />
                        Email: <a href="mailto:support@smartbuild.vn" className="text-blue-500">support@smartbuild.vn</a>
                    </p>
                    <div className="flex gap-4">
                        <Link href="/contact" className="px-6 py-3 rounded-xl bg-blue-600 text-white font-black text-xs uppercase tracking-widest shadow-lg shadow-blue-500/20 hover:scale-105 transition-all text-center">Gửi Ticket hỗ trợ</Link>
                    </div>
                </div>
            </footer>
        </div>
    )
}
