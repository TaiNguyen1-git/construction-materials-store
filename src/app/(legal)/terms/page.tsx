import { ScrollText, Check, AlertCircle, Info, ArrowUpRight, Building2 } from 'lucide-react'
import Link from 'next/link'

export default function TermsPage() {
    return (
        <div className="animate-fade-in-up space-y-16">
            {/* Header Section */}
            <section className="mb-16">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-blue-50 border border-blue-100 mb-10 shadow-sm">
                    <ScrollText className="h-4 w-4 text-blue-500" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-blue-600">SmartBuild Legality & Terms</span>
                </div>

                <h1 className="text-5xl md:text-7xl font-black text-neutral-900 tracking-tighter leading-[0.85] mb-10">
                    Điều khoản <br /><span className="text-blue-500 drop-shadow-sm">Dịch vụ</span>
                </h1>

                <div className="flex flex-col sm:flex-row sm:items-center gap-6 text-neutral-500 border-l-4 border-blue-500 pl-6 py-2 bg-blue-50/50 rounded-r-2xl">
                    <div>
                        <span className="block text-[10px] font-black uppercase tracking-widest text-neutral-400 mb-1">Cập nhật lần cuối</span>
                        <span className="text-sm font-bold text-neutral-900">27 Tháng 01, 2026</span>
                    </div>
                    <div className="hidden sm:block w-px h-8 bg-neutral-200"></div>
                    <p className="max-w-md text-sm leading-relaxed font-medium italic">
                        "Chúng tôi cam kết xây dựng một nền tảng minh bạch và tin cậy cho mọi dự án xây dựng của bạn."
                    </p>
                </div>
            </section>

            {/* Main Content */}
            <div className="prose prose-neutral prose-lg max-w-none prose-headings:font-black prose-headings:tracking-tight prose-a:text-blue-500 no-underline">
                <div className="space-y-12">

                    <section id="introduction">
                        <h2 className="flex items-center gap-3 text-3xl">
                            <span className="flex items-center justify-center h-10 w-10 rounded-xl bg-blue-600 text-white text-base font-black italic shadow-[0_10px_20px_rgba(37,99,235,0.3)]">01</span>
                            Giới thiệu chung
                        </h2>
                        <p>
                            Chào mừng bạn đến với <strong>SmartBuild</strong>. Hệ thống quản trị nguồn lực (ERP) chuyên sâu được thiết kế dành riêng cho thị trường xây dựng Việt Nam. Bằng việc truy cập hoặc sử dụng bất kỳ phần nào của hệ thống, bạn xác nhận rằng mình đã đọc, hiểu và đồng ý bị ràng buộc bởi các điều khoản này.
                        </p>
                    </section>

                    <section id="accounts">
                        <h2 className="flex items-center gap-3 text-3xl">
                            <span className="flex items-center justify-center h-10 w-10 rounded-xl bg-blue-600 text-white text-base font-black italic shadow-[0_10px_20px_rgba(37,99,235,0.3)]">02</span>
                            Tài khoản & Bảo mật
                        </h2>
                        <p>
                            Để sử dụng đầy đủ các tính năng của SmartBuild, bạn cần khởi tạo tài khoản dựa trên vai trò cụ thể:
                        </p>
                        <div className="grid md:grid-cols-2 gap-4 not-prose my-8">
                            <div className="p-6 rounded-2xl bg-white border border-neutral-200 shadow-sm hover:border-blue-500 transition-colors">
                                <h4 className="font-black text-neutral-900 uppercase tracking-tight mb-2">Thông tin cá nhân</h4>
                                <p className="text-sm text-neutral-500 leading-relaxed italic">Bạn có trách nhiệm cung cấp thông tin chính xác về tên, số điện thoại và email pháp lý.</p>
                            </div>
                            <div className="p-6 rounded-2xl bg-white border border-neutral-200 shadow-sm hover:border-blue-500 transition-colors">
                                <h4 className="font-black text-neutral-900 uppercase tracking-tight mb-2">Bảo mật mật khẩu</h4>
                                <p className="text-sm text-neutral-500 leading-relaxed italic">Chúng tôi khuyến nghị sử dụng xác thực 2 lớp (2FA) để đảm bảo an toàn cho dữ liệu dự án.</p>
                            </div>
                        </div>
                        <div className="p-4 rounded-xl bg-amber-50 border border-amber-100 flex gap-4 text-amber-900 italic text-sm font-medium">
                            <AlertCircle className="h-5 w-5 text-amber-600 shrink-0" />
                            <span>SmartBuild có quyền đình chỉ tài khoản nếu phát hiện hành vi truy cập trái phép hoặc vi phạm tiêu chuẩn cộng đồng.</span>
                        </div>
                    </section>

                    <section id="responsibilities">
                        <h2 className="flex items-center gap-3 text-3xl">
                            <span className="flex items-center justify-center h-10 w-10 rounded-xl bg-blue-600 text-white text-base font-black italic shadow-[0_10px_20px_rgba(37,99,235,0.3)]">03</span>
                            Quyền & Trách nhiệm
                        </h2>
                        <p>Hệ sinh thái SmartBuild vận hành dựa trên sự minh bạch giữa các bên:</p>
                        <div className="space-y-4 not-prose">
                            {[
                                { title: "Nhà Thầu / Công Ty Xây Dựng", content: "Đảm bảo chất lượng thi công theo đúng bản vẽ hồ sơ kỹ thuật đã phê duyệt trên hệ thống." },
                                { title: "Nhà Cung Cấp Vật Tư", content: "Đảm bảo nguồn gốc xuất xứ CO/CQ và tiến độ giao hàng tới chân công trình." },
                                { title: "Chủ Đầu Tư / Chủ Nhà", content: "Minh bạch trong các yêu cầu thay đổi (V.O) và thanh toán định kỳ theo khối lượng nghiệm thu." }
                            ].map((item, i) => (
                                <div key={i} className="flex items-start gap-4 p-5 rounded-2xl border border-neutral-100 bg-white hover:shadow-md transition-all group">
                                    <div className="mt-1 h-6 w-6 rounded-full bg-blue-50 flex items-center justify-center shrink-0 group-hover:bg-blue-500 transition-colors">
                                        <Check className="h-3.5 w-3.5 text-blue-500 group-hover:text-white" />
                                    </div>
                                    <div>
                                        <h5 className="font-black text-neutral-900 text-sm uppercase tracking-tight">{item.title}</h5>
                                        <p className="text-sm text-neutral-500 mt-1 italic">{item.content}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>

                    <section id="payment">
                        <h2 className="flex items-center gap-3 text-3xl">
                            <span className="flex items-center justify-center h-10 w-10 rounded-xl bg-blue-600 text-white text-base font-black italic shadow-[0_10px_20px_rgba(37,99,235,0.3)]">04</span>
                            Thanh toán & Phí dịch vụ
                        </h2>
                        <p>
                            SmartBuild áp dụng mô hình phí dịch vụ dựa trên giá trị giao dịch hoặc gói thuê bao hàng tháng (SaaS).
                        </p>
                        <div className="p-6 rounded-2xl bg-blue-600 text-white shadow-[0_20px_40px_rgba(37,99,235,0.2)] border border-blue-400/30 relative overflow-hidden group">
                            <div className="absolute right-0 top-0 opacity-10 group-hover:scale-150 transition-transform duration-700">
                                <Building2 className="h-40 w-40" />
                            </div>
                            <div className="relative z-10">
                                <h4 className="text-blue-100 font-black uppercase tracking-[0.2em] text-xs mb-4">Lưu ý quan trọng</h4>
                                <p className="text-blue-50 text-sm leading-relaxed mb-6 font-medium italic">Mọi giao dịch thanh toán đều qua cổng kết nối VNPay/ZaloPay. Chúng tôi không lưu trữ thông tin thẻ thanh toán của bạn.</p>
                                <Link href="/about" className="inline-flex items-center text-xs font-bold text-white hover:text-blue-200 transition-colors bg-blue-700/50 px-4 py-2 rounded-lg border border-white/10">
                                    Xem biểu phí chi tiết <ArrowUpRight className="ml-1 h-3 w-3" />
                                </Link>
                            </div>
                        </div>
                    </section>

                    <section id="disclaimer">
                        <h2 className="flex items-center gap-3 text-3xl">
                            <span className="flex items-center justify-center h-10 w-10 rounded-xl bg-blue-600 text-white text-base font-black italic shadow-[0_10px_20px_rgba(37,99,235,0.3)]">05</span>
                            Giới hạn trách nhiệm
                        </h2>
                        <p>
                            Chúng tôi nỗ lực tối đa để đảm bảo hệ thống vận hành 24/7. Tuy nhiên, SmartBuild không chịu trách nhiệm đối với các tổn thất trực tiếp hoặc gián tiếp phát sinh từ việc sử dụng sai mục đích hệ thống hoặc các sự cố kỹ thuật bất khả kháng.
                        </p>
                    </section>

                    <footer className="pt-12 border-t border-neutral-200 mt-20">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                            <div>
                                <p className="text-xs text-neutral-400 font-bold uppercase tracking-widest leading-loose">
                                    Văn kiện này có hiệu lực từ ngày khởi tạo và có thể thay đổi.<br />
                                    Liên hệ hỗ trợ: <a href="mailto:support@smartbuild.vn" className="text-blue-600">support@smartbuild.vn</a>
                                </p>
                            </div>
                            <div className="flex gap-4">
                                <Link href="/privacy" className="text-sm font-black text-neutral-900 hover:text-blue-500 transition-colors underline decoration-blue-500/30 underline-offset-4">Chính sách bảo mật</Link>
                            </div>
                        </div>
                    </footer>

                </div>
            </div>
        </div>
    )
}
