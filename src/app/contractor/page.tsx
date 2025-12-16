'use client'

/**
 * Contractor Landing Page
 * Professional, minimalist design for B2B contractors
 * Color scheme: Dark navy, white, gold accents
 */

import Link from 'next/link'
import {
    Building2,
    FileText,
    CreditCard,
    Truck,
    Shield,
    Clock,
    ChevronRight,
    CheckCircle,
    ArrowRight,
    Users,
    TrendingUp,
    Briefcase
} from 'lucide-react'

export default function ContractorLandingPage() {
    return (
        <div className="min-h-screen bg-slate-950 text-white">
            {/* Navigation */}
            <nav className="fixed top-0 left-0 right-0 z-50 bg-slate-950/95 backdrop-blur-md border-b border-slate-800">
                <div className="max-w-7xl mx-auto px-6 py-4">
                    <div className="flex items-center justify-between">
                        <Link href="/" className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-amber-600 rounded-lg flex items-center justify-center">
                                <Building2 className="w-6 h-6 text-slate-950" />
                            </div>
                            <div>
                                <span className="text-xl font-bold text-white">SmartBuild</span>
                                <span className="text-amber-500 font-semibold ml-2">PRO</span>
                            </div>
                        </Link>
                        <div className="hidden md:flex items-center gap-8">
                            <a href="#features" className="text-slate-300 hover:text-white transition-colors">Tính năng</a>
                            <a href="#benefits" className="text-slate-300 hover:text-white transition-colors">Lợi ích</a>
                            <a href="#process" className="text-slate-300 hover:text-white transition-colors">Quy trình</a>
                        </div>
                        <div className="flex items-center gap-4">
                            <Link
                                href="/contractor/login"
                                className="text-slate-300 hover:text-white transition-colors font-medium"
                            >
                                Đăng nhập
                            </Link>
                            <Link
                                href="/contractor/register"
                                className="bg-amber-500 hover:bg-amber-600 text-slate-950 px-6 py-2.5 rounded-lg font-semibold transition-all hover:shadow-lg hover:shadow-amber-500/25"
                            >
                                Đăng ký ngay
                            </Link>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="pt-32 pb-20 px-6 relative overflow-hidden">
                {/* Background Elements */}
                <div className="absolute inset-0 bg-gradient-to-b from-slate-900 to-slate-950" />
                <div className="absolute top-0 left-1/4 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl" />
                <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />

                <div className="max-w-7xl mx-auto relative">
                    <div className="grid lg:grid-cols-2 gap-16 items-center">
                        <div>
                            <div className="inline-flex items-center gap-2 bg-slate-800/50 border border-slate-700 rounded-full px-4 py-2 mb-8">
                                <span className="w-2 h-2 bg-amber-500 rounded-full animate-pulse" />
                                <span className="text-sm text-slate-300">Dành riêng cho Nhà thầu & Doanh nghiệp</span>
                            </div>

                            <h1 className="text-5xl lg:text-6xl font-bold leading-tight mb-6">
                                Giải pháp
                                <span className="block text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-amber-600">
                                    Vật liệu Xây dựng
                                </span>
                                cho Doanh nghiệp
                            </h1>

                            <p className="text-xl text-slate-400 mb-8 leading-relaxed">
                                Tiết kiệm đến <span className="text-amber-500 font-semibold">15%</span> chi phí với giá sỉ độc quyền.
                                Quản lý công nợ linh hoạt, giao hàng ưu tiên đến công trình.
                            </p>

                            <div className="flex flex-col sm:flex-row gap-4 mb-12">
                                <Link
                                    href="/contractor/register"
                                    className="group bg-amber-500 hover:bg-amber-600 text-slate-950 px-8 py-4 rounded-xl font-bold text-lg transition-all hover:shadow-xl hover:shadow-amber-500/25 flex items-center justify-center gap-2"
                                >
                                    Trở thành Đối tác
                                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                </Link>
                                <Link
                                    href="/contractor/login"
                                    className="bg-slate-800 hover:bg-slate-700 text-white px-8 py-4 rounded-xl font-semibold text-lg transition-all border border-slate-700 flex items-center justify-center"
                                >
                                    Đã có tài khoản? Đăng nhập
                                </Link>
                            </div>

                            {/* Trust Badges */}
                            <div className="flex items-center gap-8 text-sm text-slate-500">
                                <div className="flex items-center gap-2">
                                    <Shield className="w-5 h-5 text-green-500" />
                                    <span>Bảo mật cao</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Users className="w-5 h-5 text-blue-500" />
                                    <span>500+ Nhà thầu</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <TrendingUp className="w-5 h-5 text-amber-500" />
                                    <span>Tăng trưởng 200%</span>
                                </div>
                            </div>
                        </div>

                        {/* Stats Card */}
                        <div className="relative">
                            <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-3xl p-8 border border-slate-700 shadow-2xl">
                                <div className="grid grid-cols-2 gap-6">
                                    <div className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700/50">
                                        <div className="text-4xl font-bold text-white mb-2">15%</div>
                                        <div className="text-slate-400">Tiết kiệm chi phí</div>
                                    </div>
                                    <div className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700/50">
                                        <div className="text-4xl font-bold text-amber-500 mb-2">30</div>
                                        <div className="text-slate-400">Ngày công nợ</div>
                                    </div>
                                    <div className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700/50">
                                        <div className="text-4xl font-bold text-green-500 mb-2">24h</div>
                                        <div className="text-slate-400">Giao hàng ưu tiên</div>
                                    </div>
                                    <div className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700/50">
                                        <div className="text-4xl font-bold text-blue-500 mb-2">1:1</div>
                                        <div className="text-slate-400">Chuyên viên riêng</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section id="features" className="py-20 px-6 bg-slate-900/50">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl font-bold mb-4">Tính năng Dành riêng cho Doanh nghiệp</h2>
                        <p className="text-xl text-slate-400 max-w-2xl mx-auto">
                            Hệ thống được thiết kế để tối ưu hóa quy trình mua sắm vật liệu cho các dự án xây dựng lớn
                        </p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8">
                        {/* Feature 1 */}
                        <div className="group bg-slate-800/50 rounded-2xl p-8 border border-slate-700/50 hover:border-amber-500/50 transition-all hover:shadow-xl hover:shadow-amber-500/5">
                            <div className="w-14 h-14 bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                                <FileText className="w-7 h-7 text-slate-950" />
                            </div>
                            <h3 className="text-xl font-bold mb-3">Hợp đồng Giá cố định</h3>
                            <p className="text-slate-400 leading-relaxed">
                                Ký hợp đồng dài hạn với giá cố định, bất chấp biến động thị trường. Bảo vệ ngân sách dự án của bạn.
                            </p>
                        </div>

                        {/* Feature 2 */}
                        <div className="group bg-slate-800/50 rounded-2xl p-8 border border-slate-700/50 hover:border-amber-500/50 transition-all hover:shadow-xl hover:shadow-amber-500/5">
                            <div className="w-14 h-14 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                                <CreditCard className="w-7 h-7 text-white" />
                            </div>
                            <h3 className="text-xl font-bold mb-3">Công nợ Linh hoạt</h3>
                            <p className="text-slate-400 leading-relaxed">
                                Hạn mức công nợ lên đến 500 triệu đồng. Thanh toán sau 30-60 ngày. Theo dõi nợ trực tuyến 24/7.
                            </p>
                        </div>

                        {/* Feature 3 */}
                        <div className="group bg-slate-800/50 rounded-2xl p-8 border border-slate-700/50 hover:border-amber-500/50 transition-all hover:shadow-xl hover:shadow-amber-500/5">
                            <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                                <Truck className="w-7 h-7 text-white" />
                            </div>
                            <h3 className="text-xl font-bold mb-3">Giao hàng Ưu tiên</h3>
                            <p className="text-slate-400 leading-relaxed">
                                Đội xe chuyên dụng, giao hàng đến tận công trình. Lịch giao định kỳ theo tiến độ dự án.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Benefits Section */}
            <section id="benefits" className="py-20 px-6">
                <div className="max-w-7xl mx-auto">
                    <div className="grid lg:grid-cols-2 gap-16 items-center">
                        <div>
                            <h2 className="text-4xl font-bold mb-6">
                                Tại sao Nhà thầu chọn
                                <span className="text-amber-500"> SmartBuild PRO</span>?
                            </h2>
                            <p className="text-xl text-slate-400 mb-8">
                                Chúng tôi hiểu nhu cầu của doanh nghiệp xây dựng khác với khách hàng lẻ
                            </p>

                            <div className="space-y-6">
                                <div className="flex gap-4">
                                    <div className="w-8 h-8 bg-green-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                                        <CheckCircle className="w-5 h-5 text-green-500" />
                                    </div>
                                    <div>
                                        <h4 className="font-semibold mb-1">Giá sỉ độc quyền</h4>
                                        <p className="text-slate-400">Tiết kiệm 10-15% so với giá bán lẻ thông thường</p>
                                    </div>
                                </div>

                                <div className="flex gap-4">
                                    <div className="w-8 h-8 bg-green-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                                        <CheckCircle className="w-5 h-5 text-green-500" />
                                    </div>
                                    <div>
                                        <h4 className="font-semibold mb-1">Quản lý đơn hàng theo dự án</h4>
                                        <p className="text-slate-400">Phân bổ chi phí, theo dõi từng dự án riêng biệt</p>
                                    </div>
                                </div>

                                <div className="flex gap-4">
                                    <div className="w-8 h-8 bg-green-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                                        <CheckCircle className="w-5 h-5 text-green-500" />
                                    </div>
                                    <div>
                                        <h4 className="font-semibold mb-1">Báo cáo & Sao kê chi tiết</h4>
                                        <p className="text-slate-400">Xuất báo cáo công nợ, hóa đơn VAT đầy đủ</p>
                                    </div>
                                </div>

                                <div className="flex gap-4">
                                    <div className="w-8 h-8 bg-green-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                                        <CheckCircle className="w-5 h-5 text-green-500" />
                                    </div>
                                    <div>
                                        <h4 className="font-semibold mb-1">Chuyên viên tư vấn riêng</h4>
                                        <p className="text-slate-400">Hỗ trợ 1-1, giải quyết vấn đề nhanh chóng</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Testimonial */}
                        <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-3xl p-8 border border-slate-700">
                            <div className="text-6xl text-amber-500 mb-6">"</div>
                            <p className="text-xl text-slate-300 mb-8 italic leading-relaxed">
                                Từ khi hợp tác với SmartBuild PRO, chi phí vật liệu của chúng tôi giảm 12%.
                                Quan trọng hơn, công nợ linh hoạt giúp dòng tiền dự án ổn định hơn rất nhiều.
                            </p>
                            <div className="flex items-center gap-4">
                                <div className="w-14 h-14 bg-amber-500 rounded-full flex items-center justify-center">
                                    <Briefcase className="w-7 h-7 text-slate-950" />
                                </div>
                                <div>
                                    <div className="font-semibold">Công ty XD Hoàng Phát</div>
                                    <div className="text-slate-400">Đối tác từ năm 2023</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Process Section */}
            <section id="process" className="py-20 px-6 bg-slate-900/50">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl font-bold mb-4">Quy trình Trở thành Đối tác</h2>
                        <p className="text-xl text-slate-400">Chỉ 3 bước đơn giản để bắt đầu hợp tác</p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8">
                        {/* Step 1 */}
                        <div className="relative">
                            <div className="absolute -top-4 -left-4 w-12 h-12 bg-amber-500 rounded-xl flex items-center justify-center text-slate-950 font-bold text-xl">
                                1
                            </div>
                            <div className="bg-slate-800/50 rounded-2xl p-8 pt-10 border border-slate-700/50">
                                <h3 className="text-xl font-bold mb-3">Đăng ký Online</h3>
                                <p className="text-slate-400 mb-4">
                                    Điền thông tin doanh nghiệp, mã số thuế và upload giấy phép kinh doanh.
                                </p>
                                <div className="flex items-center text-amber-500 font-medium">
                                    <Clock className="w-4 h-4 mr-2" />
                                    5 phút
                                </div>
                            </div>
                        </div>

                        {/* Step 2 */}
                        <div className="relative">
                            <div className="absolute -top-4 -left-4 w-12 h-12 bg-amber-500 rounded-xl flex items-center justify-center text-slate-950 font-bold text-xl">
                                2
                            </div>
                            <div className="bg-slate-800/50 rounded-2xl p-8 pt-10 border border-slate-700/50">
                                <h3 className="text-xl font-bold mb-3">Xác minh & Ký hợp đồng</h3>
                                <p className="text-slate-400 mb-4">
                                    Đội ngũ của chúng tôi sẽ xác minh thông tin và liên hệ tư vấn gói dịch vụ phù hợp.
                                </p>
                                <div className="flex items-center text-amber-500 font-medium">
                                    <Clock className="w-4 h-4 mr-2" />
                                    1-2 ngày làm việc
                                </div>
                            </div>
                        </div>

                        {/* Step 3 */}
                        <div className="relative">
                            <div className="absolute -top-4 -left-4 w-12 h-12 bg-amber-500 rounded-xl flex items-center justify-center text-slate-950 font-bold text-xl">
                                3
                            </div>
                            <div className="bg-slate-800/50 rounded-2xl p-8 pt-10 border border-slate-700/50">
                                <h3 className="text-xl font-bold mb-3">Bắt đầu Đặt hàng</h3>
                                <p className="text-slate-400 mb-4">
                                    Truy cập portal riêng, xem giá ưu đãi và đặt hàng cho dự án của bạn.
                                </p>
                                <div className="flex items-center text-green-500 font-medium">
                                    <CheckCircle className="w-4 h-4 mr-2" />
                                    Sẵn sàng sử dụng
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-20 px-6">
                <div className="max-w-4xl mx-auto text-center">
                    <h2 className="text-4xl font-bold mb-6">
                        Sẵn sàng Tối ưu Chi phí Vật liệu?
                    </h2>
                    <p className="text-xl text-slate-400 mb-8">
                        Đăng ký ngay hôm nay và nhận ưu đãi 5% cho đơn hàng đầu tiên
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Link
                            href="/contractor/register"
                            className="group bg-amber-500 hover:bg-amber-600 text-slate-950 px-10 py-4 rounded-xl font-bold text-lg transition-all hover:shadow-xl hover:shadow-amber-500/25 flex items-center justify-center gap-2"
                        >
                            Đăng ký Miễn phí
                            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                        </Link>
                        <Link
                            href="tel:0909123456"
                            className="bg-slate-800 hover:bg-slate-700 text-white px-10 py-4 rounded-xl font-semibold text-lg transition-all border border-slate-700 flex items-center justify-center"
                        >
                            Gọi ngay: 0909 123 456
                        </Link>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="py-12 px-6 border-t border-slate-800">
                <div className="max-w-7xl mx-auto">
                    <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-amber-600 rounded-lg flex items-center justify-center">
                                <Building2 className="w-6 h-6 text-slate-950" />
                            </div>
                            <div>
                                <span className="text-xl font-bold text-white">SmartBuild</span>
                                <span className="text-amber-500 font-semibold ml-2">PRO</span>
                            </div>
                        </div>
                        <div className="flex items-center gap-8 text-slate-400">
                            <Link href="/" className="hover:text-white transition-colors">Trang chủ</Link>
                            <Link href="/products" className="hover:text-white transition-colors">Sản phẩm</Link>
                            <Link href="/contact" className="hover:text-white transition-colors">Liên hệ</Link>
                        </div>
                        <div className="text-slate-500">
                            © 2025 SmartBuild. All rights reserved.
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    )
}
