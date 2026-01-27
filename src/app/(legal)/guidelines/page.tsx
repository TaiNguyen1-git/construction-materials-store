import { Scale, Heart, ShieldCheck, Users, Ban, CheckCircle2 } from 'lucide-react'
import Link from 'next/link'

export default function GuidelinesPage() {
    return (
        <div className="animate-fade-in-up space-y-16">
            {/* Header Section */}
            <section className="mb-16">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-blue-50 border border-blue-100 mb-10 shadow-sm">
                    <Scale className="h-4 w-4 text-blue-500" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-blue-600">SmartBuild Community</span>
                </div>

                <h1 className="text-5xl md:text-7xl font-black text-neutral-900 tracking-tighter leading-[1.05] mb-10">
                    Nguyên tắc <br /><span className="text-blue-500 drop-shadow-sm">Cộng đồng</span>
                </h1>

                <div className="flex flex-col sm:flex-row sm:items-center gap-6 text-neutral-500 border-l-4 border-blue-500 pl-6 py-2 bg-blue-50/50 rounded-r-2xl">
                    <div>
                        <span className="block text-[10px] font-black uppercase tracking-widest text-neutral-400 mb-1">Phiên bản</span>
                        <span className="text-sm font-bold text-neutral-900">v1.0 (2026)</span>
                    </div>
                    <div className="hidden sm:block w-px h-8 bg-neutral-200"></div>
                    <p className="max-w-md text-sm leading-relaxed font-medium italic">
                        "Vì một môi trường kinh doanh vật liệu xây dựng tử tế, minh bạch và chuyên nghiệp."
                    </p>
                </div>
            </section>

            {/* Main Content */}
            <div className="prose prose-neutral prose-lg max-w-none prose-headings:font-black prose-headings:tracking-tight prose-a:text-blue-500 no-underline">
                <div className="space-y-12">

                    <section id="values">
                        <h2 className="flex items-center gap-3 text-3xl">
                            <span className="flex items-center justify-center h-10 w-10 rounded-xl bg-blue-600 text-white text-base font-black italic shadow-[0_10px_20px_rgba(37,99,235,0.3)]">01</span>
                            Giá trị cốt lõi
                        </h2>
                        <p>
                            Cộng đồng SmartBuild được xây dựng dựa trên 3 trụ cột chính: <strong>Minh bạch - Đúng hạn - Chất lượng</strong>. Chúng tôi kỳ vọng mọi thành viên (Chủ nhà, Nhà thầu, Nhà cung cấp) đều hành xử dựa trên các giá trị này.
                        </p>
                        <div className="grid md:grid-cols-3 gap-6 not-prose my-10">
                            {[
                                { icon: ShieldCheck, title: "Trung thực", desc: "Thông tin dự án và chất lượng vật tư phải tuyệt đối trung thực." },
                                { icon: Heart, title: "Tử tế", desc: "Giao tiếp lịch sự, hỗ trợ lẫn nhau trong suốt quá trình thi công." },
                                { icon: Users, title: "Hợp tác", desc: "Cùng nhau giải quyết vấn đề trên tinh thần xây dựng và chuyên nghiệp." }
                            ].map((item, i) => (
                                <div key={i} className="p-6 rounded-3xl bg-white border border-slate-100 shadow-sm hover:border-blue-500 transition-all text-center">
                                    <div className="mx-auto h-12 w-12 rounded-2xl bg-blue-50 flex items-center justify-center mb-4">
                                        <item.icon className="h-6 w-6 text-blue-600" />
                                    </div>
                                    <h4 className="font-black text-neutral-900 text-sm uppercase mb-2">{item.title}</h4>
                                    <p className="text-xs text-neutral-500 italic leading-relaxed">{item.desc}</p>
                                </div>
                            ))}
                        </div>
                    </section>

                    <section id="standard">
                        <h2 className="flex items-center gap-3 text-3xl text-neutral-900">
                            <span className="flex items-center justify-center h-10 w-10 rounded-xl bg-blue-600 text-white text-base font-black italic shadow-[0_10px_20px_rgba(37,99,235,0.3)]">02</span>
                            Tiêu chuẩn hành vi
                        </h2>
                        <div className="space-y-6">
                            <div className="p-8 rounded-[32px] bg-blue-50/30 border border-blue-100">
                                <h3 className="text-blue-700 mt-0">Nên làm:</h3>
                                <ul className="space-y-3 list-none pl-0">
                                    {["Giao hàng đúng tiến độ đã xác nhận.", "Phản hồi báo giá trong vòng 24h.", "Cung cấp ảnh thực tế sản phẩm/công trình.", "Tuân thủ an toàn lao động tại công trường."].map((text, i) => (
                                        <li key={i} className="flex gap-3 text-sm font-bold text-neutral-700 italic">
                                            <CheckCircle2 className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
                                            {text}
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            <div className="p-8 rounded-[32px] bg-red-50/30 border border-red-100">
                                <h3 className="text-red-700 mt-0">Tuyệt đối cấm:</h3>
                                <ul className="space-y-3 list-none pl-0 font-medium text-neutral-600">
                                    {["Thay đổi chủng loại vật tư mà không có sự đồng ý của chủ đầu tư.", "Sử dụng ngôn ngữ thiếu văn hóa trong các bình luận/trao đổi dự án.", "Gian lận về khối lượng hoặc giá cả.", "Quảng cáo rác (spam) trong các hội nhóm dự án."].map((text, i) => (
                                        <li key={i} className="flex gap-3 text-sm italic">
                                            <Ban className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
                                            {text}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    </section>

                    <section id="reputation">
                        <h2 className="flex items-center gap-3 text-3xl text-neutral-900">
                            <span className="flex items-center justify-center h-10 w-10 rounded-xl bg-blue-600 text-white text-base font-black italic shadow-[0_10px_20px_rgba(37,99,235,0.3)]">03</span>
                            Hệ thống uy tín (TrustScore)
                        </h2>
                        <p>
                            Mỗi thành viên trên SmartBuild đều sở hữu một chỉ số <strong>TrustScore</strong>. Chỉ số này phản ánh mức độ tuân thủ các nguyên tắc cộng đồng và chất lượng công việc thông qua đánh giá thực tế từ các đối tác đã làm việc cùng.
                        </p>
                        <div className="p-8 rounded-3xl bg-neutral-900 text-white relative overflow-hidden group">
                            <div className="absolute top-0 right-0 w-1/2 h-full bg-blue-600/10 skew-x-12 translate-x-1/2"></div>
                            <div className="relative z-10 flex flex-col md:flex-row gap-8 items-center">
                                <div className="text-4xl font-black italic text-blue-500">9.8/10</div>
                                <div className="text-sm italic text-neutral-400">
                                    Hơn 95% dự án hoàn thành trên hệ thống đều được đánh giá cao nhờ tuân thủ nguyên tắc cộng đồng. Hãy bảo vệ chỉ số uy tín của bạn.
                                </div>
                            </div>
                        </div>
                    </section>

                    <footer className="pt-12 border-t border-neutral-200 mt-20">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                            <div>
                                <p className="text-xs text-neutral-400 font-bold uppercase tracking-widest leading-loose">
                                    Nguyên tắc này giúp bảo vệ quyền lợi của chính bạn.<br />
                                    Góp ý xây dựng cộng đồng: <a href="mailto:community@smartbuild.vn" className="text-blue-500">community@smartbuild.vn</a>
                                </p>
                            </div>
                            <div className="flex gap-4">
                                <Link href="/terms" className="text-sm font-black text-neutral-900 hover:text-blue-500 transition-colors underline decoration-blue-500/30 underline-offset-4">Xem Điều khoản</Link>
                            </div>
                        </div>
                    </footer>

                </div>
            </div>
        </div>
    )
}
