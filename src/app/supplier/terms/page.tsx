'use client'

import Link from 'next/link'
import { ArrowLeft, FileText, CheckCircle, Shield, Scale, Clock } from 'lucide-react'

export default function SupplierTermsPage() {
    return (
        <div className="min-h-screen bg-white text-slate-900 font-sans selection:bg-blue-100 selection:text-blue-900">
            {/* Header */}
            <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-100">
                <div className="max-w-4xl mx-auto px-6 h-16 flex items-center justify-between">
                    <Link href="/supplier/register" className="flex items-center gap-2 text-slate-500 hover:text-blue-600 transition-colors font-bold text-sm uppercase tracking-wider group">
                        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                        Quay lại đăng ký
                    </Link>
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                            <FileText className="w-4 h-4 text-white" />
                        </div>
                        <span className="font-black text-slate-900 uppercase tracking-tighter">SmartBuild Policy</span>
                    </div>
                </div>
            </header>

            <main className="max-w-4xl mx-auto px-6 py-12 md:py-20">
                <div className="mb-12 text-center">
                    <p className="text-blue-600 font-bold uppercase tracking-widest text-xs mb-3">Văn bản pháp lý</p>
                    <h1 className="text-3xl md:text-5xl font-black text-slate-900 tracking-tighter mb-6">
                        Điều khoản & Thỏa thuận <br /> Hợp tác Nhà Cung Cấp
                    </h1>
                    <p className="text-slate-500 text-lg max-w-2xl mx-auto">
                        Cập nhật lần cuối: 01/02/2026. Vui lòng đọc kỹ các điều khoản dưới đây trước khi đăng ký trở thành đối tác của SmartBuild.
                    </p>
                </div>

                <div className="prose prose-slate prose-lg max-w-none">
                    <div className="bg-slate-50 rounded-3xl p-8 border border-slate-100 mb-12">
                        <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                            <CheckCircle className="w-6 h-6 text-green-500" />
                            Tóm tắt nội dung chính
                        </h3>
                        <ul className="space-y-3 text-base text-slate-600 list-none pl-0">
                            <li className="flex items-start gap-3">
                                <span className="w-1.5 h-1.5 bg-slate-400 rounded-full mt-2.5 shrink-0" />
                                SmartBuild là nền tảng trung gian kết nối Nhà cung cấp và Khách hàng (Nhà thầu, Chủ đầu tư).
                            </li>
                            <li className="flex items-start gap-3">
                                <span className="w-1.5 h-1.5 bg-slate-400 rounded-full mt-2.5 shrink-0" />
                                Nhà cung cấp chịu trách nhiệm hoàn toàn về chất lượng, nguồn gốc và tính pháp lý của sản phẩm.
                            </li>
                            <li className="flex items-start gap-3">
                                <span className="w-1.5 h-1.5 bg-slate-400 rounded-full mt-2.5 shrink-0" />
                                Phí dịch vụ và chiết khấu sẽ được quy định cụ thể trong Phụ lục Hợp đồng sau khi thẩm định.
                            </li>
                        </ul>
                    </div>

                    <section className="mb-12">
                        <h2 className="text-2xl font-black text-slate-900 flex items-center gap-3 mb-6">
                            <span className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm">1</span>
                            Quy định chung
                        </h2>
                        <p>
                            Bằng việc đăng ký tài khoản Nhà cung cấp ("NCC"), bạn đồng ý tuân thủ các quy định vận hành của Sàn TMĐT Xây dựng SmartBuild. Chúng tôi có quyền sửa đổi, bổ sung các điều khoản này và sẽ thông báo trước 07 ngày làm việc.
                        </p>
                    </section>

                    <section className="mb-12">
                        <h2 className="text-2xl font-black text-slate-900 flex items-center gap-3 mb-6">
                            <span className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm">2</span>
                            Trách nhiệm của Nhà cung cấp
                        </h2>
                        <div className="grid md:grid-cols-2 gap-6 my-6 not-prose">
                            <div className="p-6 bg-white rounded-2xl border border-slate-200 hover:border-blue-300 transition-colors">
                                <Shield className="w-8 h-8 text-blue-600 mb-4" />
                                <h4 className="font-bold text-slate-900 mb-2">Chất lượng sản phẩm</h4>
                                <p className="text-sm text-slate-500">Cam kết hàng chính hãng, mới 100%, đúng quy cách và tiêu chuẩn đã công bố.</p>
                            </div>
                            <div className="p-6 bg-white rounded-2xl border border-slate-200 hover:border-blue-300 transition-colors">
                                <Clock className="w-8 h-8 text-blue-600 mb-4" />
                                <h4 className="font-bold text-slate-900 mb-2">Thời gian giao hàng</h4>
                                <p className="text-sm text-slate-500">Đảm bảo giao hàng đúng tiến độ cam kết trong đơn đặt hàng (PO).</p>
                            </div>
                            <div className="p-6 bg-white rounded-2xl border border-slate-200 hover:border-blue-300 transition-colors">
                                <Scale className="w-8 h-8 text-blue-600 mb-4" />
                                <h4 className="font-bold text-slate-900 mb-2">Minh bạch giá cả</h4>
                                <p className="text-sm text-slate-500">Niêm yết giá công khai, cập nhật biến động giá kịp thời trên hệ thống.</p>
                            </div>
                            <div className="p-6 bg-white rounded-2xl border border-slate-200 hover:border-blue-300 transition-colors">
                                <FileText className="w-8 h-8 text-blue-600 mb-4" />
                                <h4 className="font-bold text-slate-900 mb-2">Chứng từ hóa đơn</h4>
                                <p className="text-sm text-slate-500">Cung cấp đầy đủ hóa đơn VAT và CO/CQ khi giao hàng.</p>
                            </div>
                        </div>
                    </section>

                    <section className="mb-12">
                        <h2 className="text-2xl font-black text-slate-900 flex items-center gap-3 mb-6">
                            <span className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm">3</span>
                            Chính sách thanh toán & Đối soát
                        </h2>
                        <p>
                            - SmartBuild thực hiện đối soát công nợ định kỳ vào ngày 15 và 30 hàng tháng.<br />
                            - Thanh toán được thực hiện qua chuyển khoản ngân hàng trong vòng 03 ngày làm việc sau khi đối soát thành công.<br />
                            - NCC có trách nhiệm cung cấp thông tin tài khoản ngân hàng chính xác (trùng tên với Đăng ký kinh doanh).
                        </p>
                    </section>

                    <section className="mb-12">
                        <h2 className="text-2xl font-black text-slate-900 flex items-center gap-3 mb-6">
                            <span className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm">4</span>
                            Xử lý vi phạm
                        </h2>
                        <p>
                            Trường hợp NCC vi phạm cam kết (giao hàng giả, chậm giao hàng quá 3 lần/tháng, tự ý hủy đơn), SmartBuild có quyền:
                        </p>
                        <ul className="list-disc pl-6 space-y-2">
                            <li>Hạ điểm uy tín của gian hàng.</li>
                            <li>Tạm khóa tài khoản trong 07-30 ngày.</li>
                            <li>Chấm dứt hợp tác vĩnh viễn và yêu cầu bồi thường thiệt hại (nếu có).</li>
                        </ul>
                    </section>

                    <div className="mt-16 pt-8 border-t border-slate-200 text-center">
                        <p className="text-slate-500 italic mb-6">
                            Mọi thắc mắc về điều khoản, vui lòng liên hệ bộ phận pháp chế: <span className="text-blue-600 font-bold">legal@smartbuild.vn</span>
                        </p>
                        <Link
                            href="/supplier/register"
                            className="inline-flex items-center justify-center px-8 py-4 bg-blue-600 text-white font-black text-sm uppercase tracking-widest rounded-2xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/20"
                        >
                            Tôi đã hiểu & Đồng ý
                        </Link>
                    </div>
                </div>
            </main>
        </div>
    )
}
