import { BookOpen, CheckCircle, Scale, Building, HardHat, FileText } from 'lucide-react'
import Link from 'next/link'

export default function StandardsPage() {
    return (
        <div className="animate-fade-in-up space-y-16">
            {/* Header Section */}
            <section className="mb-16">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-blue-50 border border-blue-100 mb-10 shadow-sm">
                    <BookOpen className="h-4 w-4 text-blue-500" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-blue-600">SmartBuild Quality Standards</span>
                </div>

                <h1 className="text-5xl md:text-7xl font-black text-neutral-900 tracking-tighter leading-[1.05] mb-10">
                    Chất lượng <br /><span className="text-blue-500 drop-shadow-sm">Vật tư & Thi công</span>
                </h1>

                <div className="flex flex-col sm:flex-row sm:items-center gap-6 text-neutral-500 border-l-4 border-blue-500 pl-6 py-2 bg-blue-50/50 rounded-r-2xl">
                    <div>
                        <span className="block text-[10px] font-black uppercase tracking-widest text-neutral-400 mb-1">Dựa trên tiêu chuẩn</span>
                        <span className="text-sm font-bold text-neutral-900">TCVN & Eurocodes</span>
                    </div>
                    <div className="hidden sm:block w-px h-8 bg-neutral-200"></div>
                    <p className="max-w-md text-sm leading-relaxed font-medium italic">
                        "Chúng tôi nâng cao tiêu chuẩn sống thông qua việc kiểm soát khắt khe chất lượng đầu vào của mọi công trình."
                    </p>
                </div>
            </section>

            {/* Main Content */}
            <div className="prose prose-neutral prose-lg max-w-none prose-headings:font-black prose-headings:tracking-tight prose-a:text-blue-500 no-underline">
                <div className="space-y-12">

                    <section id="materials">
                        <h2 className="flex items-center gap-3 text-3xl">
                            <span className="flex items-center justify-center h-10 w-10 rounded-xl bg-blue-600 text-white text-base font-black italic shadow-[0_10px_20px_rgba(37,99,235,0.3)]">01</span>
                            Tiêu chuẩn vật tư đầu vào
                        </h2>
                        <p>
                            Mọi vật tư cung cấp qua hệ thống SmartBuild đều phải trải qua quy trình xác minh 3 lớp để đảm bảo không có hàng giả, hàng kém chất lượng.
                        </p>
                        <div className="grid md:grid-cols-2 gap-4 not-prose my-10">
                            {[
                                { title: "Chứng chỉ CO/CQ", content: "Mọi lô hàng đều phải có chứng nhận xuất xứ và chứng nhận chất lượng từ nhà máy.", icon: FileText },
                                { title: "Kiểm tra thực tế", content: "Đội ngũ kỹ thuật của SmartBuild lấy mẫu kiểm tra ngẫu nhiên tại kho nhà cung cấp.", icon: Scale },
                                { title: "Đánh giá từ thầu thợ", content: "Hệ thống tổng hợp đánh giá về độ bền và thực tế sử dụng từ hàng ngàn công trình.", icon: HardHat },
                                { title: "Bảo hành chính hãng", content: "Cam kết bảo hành theo đúng tiêu chuẩn công bố của nhà sản xuất.", icon: CheckCircle }
                            ].map((item, i) => (
                                <div key={i} className="p-6 rounded-3xl bg-slate-50 border border-slate-100 hover:border-blue-500 transition-all group">
                                    <div className="h-10 w-10 rounded-xl bg-white shadow-sm flex items-center justify-center mb-4 group-hover:bg-blue-600 group-hover:text-white transition-all">
                                        <item.icon className="h-5 w-5" />
                                    </div>
                                    <h4 className="font-black text-neutral-900 text-sm uppercase tracking-tight mb-2">{item.title}</h4>
                                    <p className="text-xs text-neutral-500 italic leading-relaxed font-bold">{item.content}</p>
                                </div>
                            ))}
                        </div>
                    </section>

                    <section id="execution">
                        <h2 className="flex items-center gap-3 text-3xl text-neutral-900">
                            <span className="flex items-center justify-center h-10 w-10 rounded-xl bg-blue-600 text-white text-base font-black italic shadow-[0_10px_20px_rgba(37,99,235,0.3)]">02</span>
                            Tiêu chuẩn kỹ thuật thi công
                        </h2>
                        <p>Đối với các nhà thầu thi công, SmartBuild yêu cầu tuân thủ các quy trình kỹ thuật tiêu chuẩn cho từng hạng mục:</p>
                        <div className="space-y-4 not-prose">
                            <div className="p-8 rounded-[40px] bg-neutral-900 text-white relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-64 h-full bg-blue-600/20 blur-[100px] pointer-events-none"></div>
                                <div className="relative z-10">
                                    <h3 className="text-2xl font-black italic uppercase tracking-tight mb-6 text-blue-400">Hạng mục phần thô:</h3>
                                    <ul className="grid md:grid-cols-2 gap-4 list-none pl-0">
                                        {["Cấp phối bê tông theo đúng mác thiết kế.", "Bố trí thép đúng quy cách, mật độ.", "Xây tường đúng kỹ thuật, thẳng hàng.", "Xử lý chống thầm sàn mái, WC triệt để."].map((text, i) => (
                                            <li key={i} className="flex gap-3 text-sm font-bold text-neutral-400 italic">
                                                <div className="h-5 w-5 rounded-full bg-blue-600/30 flex items-center justify-center shrink-0">
                                                    <div className="h-2 w-2 rounded-full bg-blue-500"></div>
                                                </div>
                                                {text}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </section>

                    <footer className="pt-12 border-t border-neutral-200 mt-20">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                            <div>
                                <p className="text-xs text-neutral-400 font-bold uppercase tracking-widest leading-loose">
                                    Dữ liệu tham chiếu: Niên giám xây dựng & TCVN hiện hành.<br />
                                    Email chuyên gia: <a href="mailto:engineer@smartbuild.vn" className="text-blue-500">engineer@smartbuild.vn</a>
                                </p>
                            </div>
                            <div className="flex gap-4">
                                <Link href="/help" className="text-sm font-black text-neutral-900 hover:text-blue-500 transition-colors underline decoration-blue-500/30 underline-offset-4">Trung tâm trợ giúp</Link>
                            </div>
                        </div>
                    </footer>

                </div>
            </div>
        </div>
    )
}
