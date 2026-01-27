import { ShieldCheck, CreditCard, Banknote, RefreshCcw, AlertTriangle, CheckCircle2 } from 'lucide-react'
import Link from 'next/link'

export default function PaymentPolicyPage() {
    return (
        <div className="animate-fade-in-up space-y-16">
            {/* Header Section */}
            <section className="mb-16">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-blue-50 border border-blue-100 mb-10 shadow-sm">
                    <ShieldCheck className="h-4 w-4 text-blue-500" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-blue-600">SmartBuild Secure Payment</span>
                </div>

                <h1 className="text-5xl md:text-7xl font-black text-neutral-900 tracking-tighter leading-[1.05] mb-10">
                    Thanh toán & <br /><span className="text-blue-500 drop-shadow-sm">Hoàn trả</span>
                </h1>

                <div className="flex flex-col sm:flex-row sm:items-center gap-6 text-neutral-500 border-l-4 border-blue-500 pl-6 py-2 bg-blue-50/50 rounded-r-2xl">
                    <div>
                        <span className="block text-[10px] font-black uppercase tracking-widest text-neutral-400 mb-1">Cập nhật</span>
                        <span className="text-sm font-bold text-neutral-900">v1.2 (2026)</span>
                    </div>
                    <div className="hidden sm:block w-px h-8 bg-neutral-200"></div>
                    <p className="max-w-md text-sm leading-relaxed font-medium italic">
                        "Giải pháp thanh toán trung gian đảm bảo an toàn cho túi tiền của bạn và tiến độ công trình."
                    </p>
                </div>
            </section>

            {/* Main Content */}
            <div className="prose prose-neutral prose-lg max-w-none prose-headings:font-black prose-headings:tracking-tight prose-a:text-blue-500 no-underline">
                <div className="space-y-12">

                    <section id="flow">
                        <h2 className="flex items-center gap-3 text-3xl">
                            <span className="flex items-center justify-center h-10 w-10 rounded-xl bg-blue-600 text-white text-base font-black italic">01</span>
                            Quy trình thanh toán an toàn
                        </h2>
                        <p>
                            SmartBuild áp dụng cơ chế <strong>Thanh toán tạm giữ (Escrow)</strong> để bảo vệ cả Chủ đầu tư và Nhà thầu. Tiền chỉ được chuyển đi khi công việc đã được nghiệm thu.
                        </p>
                        <div className="space-y-4 not-prose my-10">
                            {[
                                { title: "Đặt cọc dự án", content: "Chủ đầu tư nạp tiền vào hệ thống để kích hoạt dự án. Tiền được SmartBuild tạm giữ.", icon: CreditCard },
                                { title: "Nghiệm thu giai đoạn", content: "Sau khi hoàn thành từng hạng mục, Nhà thầu gửi báo cáo và ảnh chụp để nghiệm thu.", icon: ShieldCheck },
                                { title: "Giải ngân tự động", content: "Sau khi Chủ đầu tư xác nhận, hệ thống tự động giải ngân tiền cho Nhà thầu và Nhà cung cấp.", icon: Banknote }
                            ].map((step, i) => (
                                <div key={i} className="flex gap-6 p-6 rounded-3xl bg-slate-50 border border-slate-100 italic transition-all">
                                    <div className="h-12 w-12 rounded-2xl bg-white shadow-sm flex items-center justify-center shrink-0">
                                        <step.icon className="h-6 w-6 text-blue-600" />
                                    </div>
                                    <div>
                                        <h4 className="text-lg font-black text-neutral-900 uppercase tracking-tight mb-1">{step.title}</h4>
                                        <p className="text-sm text-neutral-500 font-bold">{step.content}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>

                    <section id="refund">
                        <h2 className="flex items-center gap-3 text-3xl text-neutral-900">
                            <span className="flex items-center justify-center h-10 w-10 rounded-xl bg-blue-600 text-white text-base font-black italic shadow-[0_10px_20px_rgba(37,99,235,0.3)]">02</span>
                            Chính sách hoàn phí
                        </h2>
                        <p>Chúng tôi cam kết minh bạch trong việc hoàn trả phí nếu có sự cố xảy ra:</p>
                        <div className="grid md:grid-cols-2 gap-6 not-prose">
                            <div className="p-8 rounded-[32px] bg-blue-50/50 border border-blue-100">
                                <div className="h-10 w-10 rounded-xl bg-blue-600 text-white flex items-center justify-center mb-6">
                                    <RefreshCcw className="h-5 w-5" />
                                </div>
                                <h3 className="text-xl font-black text-blue-900 mb-4">Hoàn trả 100% khi:</h3>
                                <ul className="space-y-3 list-none pl-0 italic font-bold text-sm text-neutral-700">
                                    <li className="flex gap-2"><CheckCircle2 className="h-4 w-4 text-blue-600" />Dự án bị hủy trước khi thầu thợ bắt đầu.</li>
                                    <li className="flex gap-2"><CheckCircle2 className="h-4 w-4 text-blue-600" />Sản phẩm giao bị lỗi, sai chủng loại.</li>
                                    <li className="flex gap-2"><CheckCircle2 className="h-4 w-4 text-blue-600" />Lỗi hệ thống trong quá trình giao dịch.</li>
                                </ul>
                            </div>
                            <div className="p-8 rounded-[32px] bg-red-50/30 border border-red-100">
                                <div className="h-10 w-10 rounded-xl bg-red-500 text-white flex items-center justify-center mb-6">
                                    <AlertTriangle className="h-5 w-5" />
                                </div>
                                <h3 className="text-xl font-black text-red-900 mb-4">Các trường hợp loại trừ:</h3>
                                <ul className="space-y-3 list-none pl-0 italic font-bold text-sm text-neutral-700">
                                    <li className="flex gap-2"><span className="text-red-500">✕</span>Đã ký biên bản nghiệm thu hạng mục.</li>
                                    <li className="flex gap-2"><span className="text-red-500">✕</span>Hủy đơn vật tư khi hàng đang trên đường.</li>
                                    <li className="flex gap-2"><span className="text-red-500">✕</span>Cố tình gian lận thông tin thanh toán.</li>
                                </ul>
                            </div>
                        </div>
                    </section>

                    <footer className="pt-12 border-t border-neutral-200 mt-20">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                            <div>
                                <p className="text-xs text-neutral-400 font-bold uppercase tracking-widest leading-loose">
                                    Trung tâm giải quyết tranh chấp: <a href="mailto:billing@smartbuild.vn" className="text-blue-500">billing@smartbuild.vn</a>
                                </p>
                            </div>
                            <div className="flex gap-4">
                                <Link href="/terms" className="text-sm font-black text-neutral-900 hover:text-blue-500 transition-colors underline decoration-blue-500/30 underline-offset-4">Xem Điều khoản sử dụng</Link>
                            </div>
                        </div>
                    </footer>

                </div>
            </div>
        </div>
    )
}
