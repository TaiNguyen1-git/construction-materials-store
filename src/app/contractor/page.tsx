'use client'

/**
 * Contractor Landing Page - Light Theme
 * Professional, clean design for B2B contractors
 * Color scheme: White, Light Blue, Green accents
 */

import Link from 'next/link'
import {
    Building2,
    FileText,
    CreditCard,
    Truck,
    Shield,
    Clock,
    CheckCircle,
    ArrowRight,
    Users,
    TrendingUp,
    Phone,
    Mail,
    MapPin
} from 'lucide-react'

export default function ContractorLandingPage() {
    return (
        <div className="min-h-screen bg-white">
            {/* Navigation */}
            <nav className="bg-white shadow-sm border-b border-gray-100 sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-6 py-4">
                    <div className="flex items-center justify-between">
                        <Link href="/" className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                                <Building2 className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <span className="text-xl font-bold text-gray-900">SmartBuild</span>
                                <span className="text-blue-600 font-semibold ml-1">PRO</span>
                            </div>
                        </Link>
                        <div className="hidden md:flex items-center gap-8">
                            <a href="#features" className="text-gray-600 hover:text-blue-600 transition-colors font-medium">Tính năng</a>
                            <a href="#benefits" className="text-gray-600 hover:text-blue-600 transition-colors font-medium">Lợi ích</a>
                            <a href="#process" className="text-gray-600 hover:text-blue-600 transition-colors font-medium">Quy trình</a>
                            <a href="#contact" className="text-gray-600 hover:text-blue-600 transition-colors font-medium">Liên hệ</a>
                        </div>
                        <div className="flex items-center gap-3">
                            <Link
                                href="/contractor/login"
                                className="text-gray-700 hover:text-blue-600 transition-colors font-medium px-4 py-2"
                            >
                                Đăng nhập
                            </Link>
                            <Link
                                href="/contractor/register"
                                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg font-semibold transition-all shadow-sm hover:shadow-md"
                            >
                                Đăng ký
                            </Link>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="bg-gradient-to-br from-blue-50 via-white to-green-50 py-20 px-6">
                <div className="max-w-7xl mx-auto">
                    <div className="grid lg:grid-cols-2 gap-12 items-center">
                        <div>
                            <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-700 rounded-full px-4 py-2 mb-6 text-sm font-medium">
                                <Building2 className="w-4 h-4" />
                                Dành riêng cho Nhà thầu & Doanh nghiệp
                            </div>

                            <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 leading-tight mb-6">
                                Giải pháp
                                <span className="text-blue-600"> Vật liệu Xây dựng</span>
                                <br />cho Doanh nghiệp
                            </h1>

                            <p className="text-lg text-gray-600 mb-8 leading-relaxed">
                                Tiết kiệm đến <span className="text-green-600 font-semibold">15%</span> chi phí với giá sỉ độc quyền.
                                Quản lý công nợ linh hoạt, giao hàng ưu tiên đến công trình.
                            </p>

                            <div className="flex flex-col sm:flex-row gap-4 mb-8">
                                <Link
                                    href="/contractor/register"
                                    className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-lg font-semibold text-lg transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2"
                                >
                                    Trở thành Đối tác
                                    <ArrowRight className="w-5 h-5" />
                                </Link>
                                <Link
                                    href="/contractor/login"
                                    className="bg-white border-2 border-gray-200 hover:border-blue-300 text-gray-700 px-8 py-4 rounded-lg font-semibold text-lg transition-all flex items-center justify-center"
                                >
                                    Đăng nhập
                                </Link>
                            </div>

                            {/* Trust Badges */}
                            <div className="flex flex-wrap items-center gap-6 text-sm text-gray-500">
                                <div className="flex items-center gap-2">
                                    <Shield className="w-5 h-5 text-green-500" />
                                    <span>Bảo mật cao</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Users className="w-5 h-5 text-blue-500" />
                                    <span>500+ Đối tác</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <TrendingUp className="w-5 h-5 text-green-500" />
                                    <span>Tăng trưởng 200%</span>
                                </div>
                            </div>
                        </div>

                        {/* Stats Card */}
                        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
                            <h3 className="text-lg font-semibold text-gray-900 mb-6">Ưu đãi dành cho Nhà thầu</h3>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-blue-50 rounded-xl p-5 text-center">
                                    <div className="text-3xl font-bold text-blue-600 mb-1">15%</div>
                                    <div className="text-gray-600 text-sm">Tiết kiệm chi phí</div>
                                </div>
                                <div className="bg-green-50 rounded-xl p-5 text-center">
                                    <div className="text-3xl font-bold text-green-600 mb-1">30</div>
                                    <div className="text-gray-600 text-sm">Ngày công nợ</div>
                                </div>
                                <div className="bg-orange-50 rounded-xl p-5 text-center">
                                    <div className="text-3xl font-bold text-orange-600 mb-1">24h</div>
                                    <div className="text-gray-600 text-sm">Giao hàng ưu tiên</div>
                                </div>
                                <div className="bg-purple-50 rounded-xl p-5 text-center">
                                    <div className="text-3xl font-bold text-purple-600 mb-1">1:1</div>
                                    <div className="text-gray-600 text-sm">Chuyên viên riêng</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section id="features" className="py-20 px-6 bg-gray-50">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl font-bold text-gray-900 mb-4">Tính năng Dành riêng cho Doanh nghiệp</h2>
                        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                            Hệ thống được thiết kế để tối ưu hóa quy trình mua sắm vật liệu cho các dự án xây dựng
                        </p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8">
                        {/* Feature 1 */}
                        <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                            <div className="w-14 h-14 bg-blue-100 rounded-xl flex items-center justify-center mb-6">
                                <FileText className="w-7 h-7 text-blue-600" />
                            </div>
                            <h3 className="text-xl font-semibold text-gray-900 mb-3">Hợp đồng Giá cố định</h3>
                            <p className="text-gray-600 leading-relaxed">
                                Ký hợp đồng dài hạn với giá cố định, bất chấp biến động thị trường. Bảo vệ ngân sách dự án của bạn.
                            </p>
                        </div>

                        {/* Feature 2 */}
                        <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                            <div className="w-14 h-14 bg-green-100 rounded-xl flex items-center justify-center mb-6">
                                <CreditCard className="w-7 h-7 text-green-600" />
                            </div>
                            <h3 className="text-xl font-semibold text-gray-900 mb-3">Công nợ Linh hoạt</h3>
                            <p className="text-gray-600 leading-relaxed">
                                Hạn mức công nợ lên đến 500 triệu đồng. Thanh toán sau 30-60 ngày. Theo dõi nợ trực tuyến 24/7.
                            </p>
                        </div>

                        {/* Feature 3 */}
                        <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                            <div className="w-14 h-14 bg-orange-100 rounded-xl flex items-center justify-center mb-6">
                                <Truck className="w-7 h-7 text-orange-600" />
                            </div>
                            <h3 className="text-xl font-semibold text-gray-900 mb-3">Giao hàng Ưu tiên</h3>
                            <p className="text-gray-600 leading-relaxed">
                                Đội xe chuyên dụng, giao hàng đến tận công trình. Lịch giao định kỳ theo tiến độ dự án.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Benefits Section */}
            <section id="benefits" className="py-20 px-6 bg-white">
                <div className="max-w-7xl mx-auto">
                    <div className="grid lg:grid-cols-2 gap-16 items-center">
                        <div>
                            <h2 className="text-3xl font-bold text-gray-900 mb-6">
                                Tại sao Nhà thầu chọn
                                <span className="text-blue-600"> SmartBuild PRO</span>?
                            </h2>
                            <p className="text-lg text-gray-600 mb-8">
                                Chúng tôi hiểu nhu cầu của doanh nghiệp xây dựng khác với khách hàng lẻ
                            </p>

                            <div className="space-y-5">
                                <div className="flex gap-4">
                                    <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                        <CheckCircle className="w-5 h-5 text-green-600" />
                                    </div>
                                    <div>
                                        <h4 className="font-semibold text-gray-900 mb-1">Giá sỉ độc quyền</h4>
                                        <p className="text-gray-600">Tiết kiệm 10-15% so với giá bán lẻ thông thường</p>
                                    </div>
                                </div>

                                <div className="flex gap-4">
                                    <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                        <CheckCircle className="w-5 h-5 text-green-600" />
                                    </div>
                                    <div>
                                        <h4 className="font-semibold text-gray-900 mb-1">Quản lý đơn hàng theo dự án</h4>
                                        <p className="text-gray-600">Phân bổ chi phí, theo dõi từng dự án riêng biệt</p>
                                    </div>
                                </div>

                                <div className="flex gap-4">
                                    <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                        <CheckCircle className="w-5 h-5 text-green-600" />
                                    </div>
                                    <div>
                                        <h4 className="font-semibold text-gray-900 mb-1">Báo cáo & Sao kê chi tiết</h4>
                                        <p className="text-gray-600">Xuất báo cáo công nợ, hóa đơn VAT đầy đủ</p>
                                    </div>
                                </div>

                                <div className="flex gap-4">
                                    <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                        <CheckCircle className="w-5 h-5 text-green-600" />
                                    </div>
                                    <div>
                                        <h4 className="font-semibold text-gray-900 mb-1">Chuyên viên tư vấn riêng</h4>
                                        <p className="text-gray-600">Hỗ trợ 1-1, giải quyết vấn đề nhanh chóng</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Testimonial */}
                        <div className="bg-gradient-to-br from-blue-50 to-green-50 rounded-2xl p-8 border border-gray-100">
                            <div className="text-5xl text-blue-400 mb-4">"</div>
                            <p className="text-lg text-gray-700 mb-6 italic leading-relaxed">
                                Từ khi hợp tác với SmartBuild PRO, chi phí vật liệu của chúng tôi giảm 12%.
                                Quan trọng hơn, công nợ linh hoạt giúp dòng tiền dự án ổn định hơn rất nhiều.
                            </p>
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold">
                                    HP
                                </div>
                                <div>
                                    <div className="font-semibold text-gray-900">Công ty XD Hoàng Phát</div>
                                    <div className="text-gray-500 text-sm">Đối tác từ năm 2023</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Process Section */}
            <section id="process" className="py-20 px-6 bg-gray-50">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl font-bold text-gray-900 mb-4">Quy trình Đăng ký Đối tác</h2>
                        <p className="text-lg text-gray-600">Chỉ 3 bước đơn giản để bắt đầu hợp tác</p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8">
                        {/* Step 1 */}
                        <div className="relative bg-white rounded-xl p-8 shadow-sm border border-gray-100">
                            <div className="absolute -top-4 -left-4 w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold">
                                1
                            </div>
                            <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-2">Đăng ký Online</h3>
                            <p className="text-gray-600 mb-4">
                                Điền thông tin doanh nghiệp, mã số thuế và upload giấy phép kinh doanh.
                            </p>
                            <div className="flex items-center text-blue-600 font-medium text-sm">
                                <Clock className="w-4 h-4 mr-2" />
                                5 phút
                            </div>
                        </div>

                        {/* Step 2 */}
                        <div className="relative bg-white rounded-xl p-8 shadow-sm border border-gray-100">
                            <div className="absolute -top-4 -left-4 w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold">
                                2
                            </div>
                            <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-2">Xác minh & Ký hợp đồng</h3>
                            <p className="text-gray-600 mb-4">
                                Đội ngũ sẽ xác minh thông tin và liên hệ tư vấn gói dịch vụ phù hợp.
                            </p>
                            <div className="flex items-center text-blue-600 font-medium text-sm">
                                <Clock className="w-4 h-4 mr-2" />
                                1-2 ngày làm việc
                            </div>
                        </div>

                        {/* Step 3 */}
                        <div className="relative bg-white rounded-xl p-8 shadow-sm border border-gray-100">
                            <div className="absolute -top-4 -left-4 w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center text-white font-bold">
                                3
                            </div>
                            <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-2">Bắt đầu Đặt hàng</h3>
                            <p className="text-gray-600 mb-4">
                                Truy cập portal riêng, xem giá ưu đãi và đặt hàng cho dự án của bạn.
                            </p>
                            <div className="flex items-center text-green-600 font-medium text-sm">
                                <CheckCircle className="w-4 h-4 mr-2" />
                                Sẵn sàng sử dụng
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-20 px-6 bg-blue-600">
                <div className="max-w-4xl mx-auto text-center">
                    <h2 className="text-3xl font-bold text-white mb-4">
                        Sẵn sàng Tối ưu Chi phí Vật liệu?
                    </h2>
                    <p className="text-xl text-blue-100 mb-8">
                        Đăng ký ngay hôm nay và nhận ưu đãi 5% cho đơn hàng đầu tiên
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Link
                            href="/contractor/register"
                            className="bg-white text-blue-600 hover:bg-gray-100 px-10 py-4 rounded-lg font-semibold text-lg transition-all shadow-md flex items-center justify-center gap-2"
                        >
                            Đăng ký Miễn phí
                            <ArrowRight className="w-5 h-5" />
                        </Link>
                        <Link
                            href="tel:0909123456"
                            className="bg-blue-700 hover:bg-blue-800 text-white px-10 py-4 rounded-lg font-semibold text-lg transition-all border border-blue-500 flex items-center justify-center gap-2"
                        >
                            <Phone className="w-5 h-5" />
                            0909 123 456
                        </Link>
                    </div>
                </div>
            </section>

            {/* Contact Section */}
            <section id="contact" className="py-16 px-6 bg-white">
                <div className="max-w-7xl mx-auto">
                    <div className="grid md:grid-cols-3 gap-8 text-center">
                        <div className="flex flex-col items-center">
                            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                                <Phone className="w-6 h-6 text-blue-600" />
                            </div>
                            <h3 className="font-semibold text-gray-900 mb-2">Hotline</h3>
                            <p className="text-gray-600">0909 123 456</p>
                        </div>
                        <div className="flex flex-col items-center">
                            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
                                <Mail className="w-6 h-6 text-green-600" />
                            </div>
                            <h3 className="font-semibold text-gray-900 mb-2">Email</h3>
                            <p className="text-gray-600">contractor@smartbuild.vn</p>
                        </div>
                        <div className="flex flex-col items-center">
                            <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mb-4">
                                <MapPin className="w-6 h-6 text-orange-600" />
                            </div>
                            <h3 className="font-semibold text-gray-900 mb-2">Địa chỉ</h3>
                            <p className="text-gray-600">123 Nguyễn Văn Linh, Biên Hòa</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="py-8 px-6 bg-gray-50 border-t border-gray-200">
                <div className="max-w-7xl mx-auto">
                    <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                                <Building2 className="w-5 h-5 text-white" />
                            </div>
                            <span className="font-bold text-gray-900">SmartBuild <span className="text-blue-600">PRO</span></span>
                        </div>
                        <div className="flex items-center gap-6 text-gray-600 text-sm">
                            <Link href="/" className="hover:text-blue-600 transition-colors">Trang chủ</Link>
                            <Link href="/products" className="hover:text-blue-600 transition-colors">Sản phẩm</Link>
                            <Link href="/contact" className="hover:text-blue-600 transition-colors">Liên hệ</Link>
                        </div>
                        <div className="text-gray-500 text-sm">
                            © 2025 SmartBuild. All rights reserved.
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    )
}
