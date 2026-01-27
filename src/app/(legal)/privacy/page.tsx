import { Shield, Lock, Eye, Server, Cookie, ShieldCheck, Heart, Mail, Check } from 'lucide-react'
import Link from 'next/link'

export default function PrivacyPage() {
    return (
        <div className="animate-fade-in-up space-y-16">
            {/* Header Section */}
            <section>
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-blue-50 border border-blue-100 mb-8 shadow-sm">
                    <ShieldCheck className="h-4 w-4 text-blue-500" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-blue-600">SmartBuild Privacy & Security</span>
                </div>

                <h1 className="text-5xl md:text-6xl font-black text-neutral-900 tracking-tighter leading-[0.9] mb-8">
                    Chính sách <br /><span className="text-blue-500">Bảo mật</span>
                </h1>

                <div className="flex flex-col sm:flex-row sm:items-center gap-6 text-neutral-500 border-l-4 border-blue-500 pl-6 py-2 bg-blue-50/50 rounded-r-2xl">
                    <div>
                        <span className="block text-[10px] font-black uppercase tracking-widest text-neutral-400 mb-1">Phiên bản hiện tại</span>
                        <span className="text-sm font-bold text-neutral-900">v2.0 - 27/01/2026</span>
                    </div>
                    <div className="hidden sm:block w-px h-8 bg-neutral-200"></div>
                    <p className="max-w-md text-sm leading-relaxed font-medium italic">
                        "Sự tin tưởng của bạn là ưu tiên hàng đầu của chúng tôi. Dữ liệu của bạn được bảo mật theo tiêu chuẩn ISO."
                    </p>
                </div>
            </section>

            {/* Main Content */}
            <div className="prose prose-neutral prose-lg max-w-none prose-headings:font-black prose-headings:tracking-tight prose-a:text-blue-500 no-underline">
                <div className="space-y-12">

                    <section id="collection">
                        <h2 className="flex items-center gap-3 text-3xl text-neutral-900">
                            <span className="flex items-center justify-center h-10 w-10 rounded-xl bg-blue-500 text-white text-base font-black italic shadow-[0_5px_15px_rgba(59,130,246,0.3)]">01</span>
                            Dữ liệu thu thập
                        </h2>
                        <p>
                            SmartBuild chỉ thu thập dữ liệu cần thiết để vận hành các tính năng ERP và đảm bảo quyền lợi cho các bên trong dự án:
                        </p>

                        <div className="grid sm:grid-cols-2 gap-4 not-prose my-10">
                            {[
                                { icon: Eye, title: "Định danh cá nhân", desc: "Tên, CMND/CCCD (cho nhà thầu), email, số điện thoại." },
                                { icon: Server, title: "Dữ liệu dự án", desc: "Bản vẽ CAD, bảng bóc tách khối lượng, tiến độ thi công." },
                                { icon: Cookie, title: "Cookie & Trình duyệt", desc: "Lịch sử truy cập, loại thiết bị và vị trí IP." },
                                { icon: Lock, title: "Xác thực bảo mật", desc: "Mã OTP, phím bảo vệ (U2F) và dữ liệu 2FA." }
                            ].map((item, i) => (
                                <div key={i} className="p-6 rounded-2xl bg-white border border-neutral-100 hover:border-blue-500 hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                                    <div className="h-12 w-12 rounded-xl bg-neutral-50 flex items-center justify-center mb-4 group-hover:bg-blue-50 transition-colors">
                                        <item.icon className="h-6 w-6 text-neutral-400" />
                                    </div>
                                    <h5 className="font-black text-neutral-900 text-sm uppercase mb-2">{item.title}</h5>
                                    <p className="text-xs text-neutral-500 leading-relaxed font-medium italic">{item.desc}</p>
                                </div>
                            ))}
                        </div>
                    </section>

                    <section id="usage">
                        <h2 className="flex items-center gap-3 text-3xl text-neutral-900">
                            <span className="flex items-center justify-center h-10 w-10 rounded-xl bg-blue-500 text-white text-base font-black italic shadow-[0_5px_15px_rgba(59,130,246,0.3)]">02</span>
                            Mục đích sử dụng
                        </h2>
                        <p>
                            Dữ liệu của bạn được sử dụng một cách minh bạch và chỉ phục vụ cho lợi ích của bạn:
                        </p>
                        <ul className="space-y-4 font-medium text-neutral-600">
                            <li className="flex gap-4">
                                <div className="shrink-0 h-6 w-6 rounded-full bg-blue-50 flex items-center justify-center mt-1">
                                    <Check className="h-3.5 w-3.5 text-blue-500" />
                                </div>
                                <span>Xử lý yêu cầu báo giá và đơn hàng vật tư một cách tự động.</span>
                            </li>
                            <li className="flex gap-4">
                                <div className="shrink-0 h-6 w-6 rounded-full bg-blue-50 flex items-center justify-center mt-1">
                                    <Check className="h-3.5 w-3.5 text-blue-500" />
                                </div>
                                <span>Cảnh báo rủi ro về tiến độ và rò rỉ ngân sách dự án.</span>
                            </li>
                            <li className="flex gap-4">
                                <div className="shrink-0 h-6 w-6 rounded-full bg-blue-50 flex items-center justify-center mt-1">
                                    <Check className="h-3.5 w-3.5 text-blue-500" />
                                </div>
                                <span>Nâng cấp thuật toán AI SmartEstimator để dự toán chính xác hơn.</span>
                            </li>
                        </ul>
                    </section>

                    <section id="sharing" className="not-prose bg-neutral-900 rounded-[32px] p-8 md:p-12 text-white relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/20 blur-[100px] rounded-full"></div>
                        <div className="relative z-10 flex flex-col md:flex-row gap-8 items-center">
                            <div className="shrink-0 h-24 w-24 rounded-[32px] bg-blue-500/20 border border-blue-500/30 flex items-center justify-center">
                                <Shield className="h-10 w-10 text-blue-400" />
                            </div>
                            <div>
                                <h3 className="text-2xl font-black uppercase tracking-tight mb-3 italic">Cam kết không chia sẻ</h3>
                                <p className="text-neutral-400 text-lg leading-relaxed max-w-xl">
                                    SmartBuild cam kết <span className="text-white font-bold underline decoration-blue-500">KHÔNG BÁN</span> dữ liệu cá nhân của bạn cho các bên quảng cáo. Dữ liệu chỉ được chia sẻ cho Nhà thầu/Nhà cung cấp khi có sự cho phép cụ thể từ bạn qua các thao tác trên ứng dụng.
                                </p>
                            </div>
                        </div>
                    </section>

                    <section id="rights">
                        <h2 className="flex items-center gap-3 text-3xl text-neutral-900">
                            <span className="flex items-center justify-center h-10 w-10 rounded-xl bg-blue-500 text-white text-base font-black italic shadow-[0_5px_15px_rgba(59,130,246,0.3)]">03</span>
                            Quyền quản lý của bạn
                        </h2>
                        <p>Bạn luôn có quyền kiểm soát tuyệt đối đối với "tài sản số" của mình:</p>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 not-prose my-8">
                            {[
                                { label: "Truy cập", content: "Xem lại toàn bộ dữ liệu đã cung cấp bất cứ lúc nào." },
                                { label: "Chỉnh sửa", content: "Cập nhật thông tin nhanh chóng qua trang cá nhân." },
                                { icon: Heart, label: "Xóa dữ liệu", content: "Yêu cầu xóa vĩnh viễn tài khoản và mọi dữ liệu liên quan." }
                            ].map((item, i) => (
                                <div key={i} className="p-6 rounded-2xl bg-neutral-50 border border-neutral-100 italic transition-all">
                                    <h4 className="font-black text-neutral-900 text-xs uppercase mb-2 tracking-widest">{item.label}</h4>
                                    <p className="text-sm text-neutral-500 leading-relaxed font-bold">{item.content}</p>
                                </div>
                            ))}
                        </div>
                    </section>

                    <footer className="pt-12 border-t border-neutral-200 mt-20">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                            <div className="flex items-center gap-4">
                                <div className="h-10 w-10 rounded-full bg-neutral-100 flex items-center justify-center shrink-0">
                                    <Mail className="h-4 w-4 text-neutral-600" />
                                </div>
                                <div>
                                    <span className="block text-[10px] font-black text-neutral-400 uppercase tracking-widest">Trung tâm dữ liệu</span>
                                    <span className="text-sm font-bold text-neutral-900">privacy@smartbuild.vn</span>
                                </div>
                            </div>
                            <div className="flex gap-4">
                                <Link href="/terms" className="text-sm font-black text-neutral-900 hover:text-blue-500 transition-colors underline decoration-blue-500/30 underline-offset-4">Điều khoản dịch vụ</Link>
                            </div>
                        </div>
                    </footer>

                </div>
            </div>
        </div>
    )
}
