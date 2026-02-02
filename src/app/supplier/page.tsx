'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import {
    Building2,
    Package,
    TrendingUp,
    BarChart3,
    Truck,
    ShieldCheck,
    ArrowRight,
    Users,
    Zap,
    Clock,
    CheckCircle2,
    LayoutGrid,
    Globe,
    Award,
    ChevronRight,
    Phone,
    Mail,
    MapPin
} from 'lucide-react'

// Mock data for supplier ecosystem
const benefits = [
    {
        icon: Globe,
        title: "Mở Rộng Thị Trường",
        desc: "Tiếp cận trực tiếp hàng ngàn nhà thầu và dự án xây dựng trên toàn quốc.",
        color: "bg-blue-50 text-blue-600"
    },
    {
        icon: BarChart3,
        title: "Quản Lý Thông Minh",
        desc: "Hệ thống quản lý đơn hàng, kho bãi và công nợ tập trung, hiện đại.",
        color: "bg-indigo-50 text-indigo-600"
    },
    {
        icon: TrendingUp,
        title: "Tối Ưu Doanh Thu",
        desc: "Phân tích xu hướng thị trường bằng AI để tối ưu hóa giá bán và tồn kho.",
        color: "bg-emerald-50 text-emerald-600"
    }
]

const features = [
    {
        title: "Quản lý đơn hàng dự án",
        desc: "Xử lý hàng loạt đơn hàng từ các dự án lớn với quy trình xác nhận tự động.",
        icon: Package
    },
    {
        title: "Logistics tích hợp",
        desc: "Kết nối hệ thống vận tải riêng hoặc sử dụng đối tác giao hàng của SmartBuild.",
        icon: Truck
    },
    {
        title: "Báo cáo phân tích AI",
        desc: "Dự báo nhu cầu thị trường và hiệu suất kinh doanh chi tiết theo thời gian thực.",
        icon: Zap
    }
]

const testimonials = [
    {
        id: 1,
        content: "SmartBuild giúp chúng tôi số hóa toàn bộ quy trình phân phối. Doanh số tăng 25% sau 6 tháng tham gia hệ thống.",
        author: "Nguyễn Văn Hùng",
        role: "GĐ Kinh doanh - Thép Hòa Phát",
        initials: "HP"
    },
    {
        id: 2,
        content: "Hệ thống thanh toán và đối soát cực kỳ minh bạch. Chúng tôi không còn lo lắng về việc chậm trễ công nợ.",
        author: "Trần Thị Lan",
        role: "Trưởng phòng CC - Xi măng Hà Tiên",
        initials: "HT"
    }
]

export default function SupplierLandingPage() {
    const [scrolled, setScrolled] = useState(false)

    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 20)
        }
        window.addEventListener('scroll', handleScroll)
        return () => window.removeEventListener('scroll', handleScroll)
    }, [])

    return (
        <div className="min-h-screen bg-white font-sans selection:bg-blue-100 selection:text-blue-900">
            {/* Header / Navigation */}
            <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'bg-white/80 backdrop-blur-xl border-b border-slate-100 py-4 shadow-sm' : 'bg-transparent py-6'}`}>
                <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
                    <Link href="/" className="flex items-center gap-3 group">
                        <div className="w-10 h-10 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-600/20 group-hover:scale-105 transition-transform">
                            <Building2 className="w-6 h-6 text-white" />
                        </div>
                        <div className="flex flex-col leading-none">
                            <span className="text-xl font-black text-slate-900 tracking-tighter uppercase">SmartBuild</span>
                            <span className="text-[10px] font-black text-blue-600 tracking-[0.2em] uppercase mt-0.5">Supplier Portal</span>
                        </div>
                    </Link>

                    <div className="hidden lg:flex items-center gap-10">
                        {['Lợi ích', 'Tính năng', 'Quy trình', 'Đối tác'].map((item) => (
                            <a key={item} href={`#${item.toLowerCase()}`} className="text-sm font-bold text-slate-600 hover:text-blue-600 transition-colors uppercase tracking-widest">{item}</a>
                        ))}
                    </div>

                    <div className="flex items-center gap-4">
                        <Link href="/supplier/login" className="text-sm font-black text-blue-600 hover:text-blue-700 transition-colors uppercase tracking-widest px-4 py-2">
                            Đăng nhập
                        </Link>
                        <Link href="/supplier/register" className="bg-blue-600 text-white px-6 py-3 rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] hover:bg-blue-700 transition-all transform active:scale-95 shadow-xl shadow-blue-500/20">
                            Hợp tác ngay
                        </Link>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <header className="relative pt-40 pb-32 overflow-hidden bg-slate-50">
                {/* Background Patterns */}
                <div className="absolute top-0 right-0 w-1/2 h-full bg-blue-600/5 -skew-x-12 translate-x-32" />
                <div className="absolute -top-24 -left-24 w-96 h-96 bg-indigo-600/5 rounded-full blur-[100px]" />

                <div className="max-w-7xl mx-auto px-6 relative z-10">
                    <div className="grid lg:grid-cols-2 gap-16 items-center">
                        <div className="animate-in fade-in slide-in-from-left duration-1000">
                            <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600/10 border border-blue-600/20 rounded-full text-blue-600 text-[10px] font-black uppercase tracking-widest mb-8">
                                <span className="relative flex h-2 w-2">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-600"></span>
                                </span>
                                Chuyển đổi số ngành cung ứng 2026
                            </div>
                            <h1 className="text-5xl md:text-6xl lg:text-7xl font-black text-slate-900 leading-[1.1] tracking-tighter mb-8">
                                Kênh Phân Phối <br />
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 italic">Vật Tư 4.0</span>
                            </h1>
                            <p className="text-xl text-slate-500 font-medium leading-relaxed max-w-xl mb-12">
                                Nền tảng kết nối trực tiếp Nhà cung cấp với hàng ngàn dự án xây dựng. Quản lý kinh doanh hiện đại và tối ưu hóa luồng hàng bằng công nghệ AI.
                            </p>
                            <div className="flex flex-col sm:flex-row gap-6">
                                <Link href="/supplier/register" className="flex items-center justify-center gap-3 px-10 py-5 bg-blue-600 text-white font-black rounded-[2rem] shadow-2xl shadow-blue-500/30 hover:bg-blue-700 transition-all group">
                                    BẮT ĐẦU HỢP TÁC <ArrowRight className="w-5 h-5 group-hover:translate-x-2 transition-transform" />
                                </Link>
                                <Link href="#liên-hệ" className="flex items-center justify-center px-10 py-5 bg-white border border-slate-200 text-slate-900 font-black rounded-[2rem] hover:bg-slate-50 transition-all shadow-sm">
                                    TÌM HIỂU THÊM
                                </Link>
                            </div>
                        </div>

                        <div className="relative animate-in fade-in slide-in-from-right duration-1000 delay-200">
                            <div className="relative bg-white rounded-[3rem] p-8 shadow-[0_50px_100px_-20px_rgba(0,0,0,0.1)] border border-white">
                                <div className="grid grid-cols-2 gap-6">
                                    <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100">
                                        <Users className="w-8 h-8 text-blue-600 mb-4" />
                                        <p className="text-3xl font-black text-slate-900">2.5k+</p>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Đối tác Nhà thầu</p>
                                    </div>
                                    <div className="p-6 bg-blue-600 rounded-3xl shadow-xl shadow-blue-500/20">
                                        <TrendingUp className="w-8 h-8 text-white mb-4" />
                                        <p className="text-3xl font-black text-white">40%</p>
                                        <p className="text-[10px] font-bold text-blue-100 uppercase tracking-widest mt-1">Tăng trưởng TB</p>
                                    </div>
                                    <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100">
                                        <Package className="w-8 h-8 text-indigo-600 mb-4" />
                                        <p className="text-3xl font-black text-slate-900">150k+</p>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Đơn hàng/Tháng</p>
                                    </div>
                                    <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100">
                                        <Globe className="w-8 h-8 text-teal-600 mb-4" />
                                        <p className="text-3xl font-black text-slate-900">63</p>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Tỉnh thành phủ sóng</p>
                                    </div>
                                </div>
                            </div>

                            {/* Floating Card */}
                            <div className="absolute -bottom-10 -left-10 bg-white p-6 rounded-3xl shadow-2xl border border-slate-100 flex items-center gap-4 animate-bounce-slow">
                                <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center">
                                    <CheckCircle2 className="w-6 h-6 text-white" />
                                </div>
                                <div>
                                    <p className="font-black text-slate-900">Xác thực 100%</p>
                                    <p className="text-xs text-slate-400">Đơn hàng thực từ dự án</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            {/* Benefits Section */}
            <section id="lợi ích" className="py-32 bg-white">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="text-center max-w-3xl mx-auto mb-20">
                        <h2 className="text-[11px] font-black text-blue-600 uppercase tracking-[0.3em] mb-4">Lợi thế cạnh tranh</h2>
                        <h3 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tighter">Vì sao các Nhà cung cấp hàng đầu chọn SmartBuild?</h3>
                    </div>

                    <div className="grid md:grid-cols-3 gap-12">
                        {benefits.map((item, i) => (
                            <div key={i} className="group p-10 rounded-[2.5rem] bg-slate-50 border border-slate-100 hover:bg-white hover:shadow-2xl hover:shadow-blue-500/10 transition-all duration-500">
                                <div className={`w-16 h-16 ${item.color} rounded-2xl flex items-center justify-center mb-10 group-hover:scale-110 group-hover:rotate-6 transition-transform`}>
                                    <item.icon className="w-8 h-8" />
                                </div>
                                <h4 className="text-2xl font-black text-slate-900 mb-4 tracking-tight uppercase">{item.title}</h4>
                                <p className="text-slate-500 font-medium leading-relaxed italic">{item.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Features Detail */}
            <section id="tính năng" className="py-32 bg-blue-50/50 text-slate-900 relative overflow-hidden">
                <div className="absolute inset-0 bg-blue-600/5 mix-blend-overlay" />
                <div className="max-w-7xl mx-auto px-6 relative z-10">
                    <div className="grid lg:grid-cols-2 gap-20 items-center">
                        <div>
                            <h3 className="text-3xl md:text-5xl font-black leading-tight tracking-tighter mb-10 italic">
                                Sức mạnh Công nghệ <br />
                                <span className="text-blue-600">Thay đổi cách thức</span> vận hành
                            </h3>
                            <div className="space-y-10">
                                {features.map((feature, i) => (
                                    <div key={i} className="flex gap-6 group">
                                        <div className="w-14 h-14 rounded-2xl bg-white shadow-sm flex items-center justify-center flex-shrink-0 group-hover:bg-blue-600 transition-colors">
                                            <feature.icon className="w-6 h-6 text-blue-600 group-hover:text-white transition-colors" />
                                        </div>
                                        <div>
                                            <h4 className="text-xl font-bold mb-2 uppercase tracking-wide text-slate-900">{feature.title}</h4>
                                            <p className="text-slate-500 font-medium leading-relaxed">{feature.desc}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="bg-white rounded-[3rem] p-10 shadow-xl border border-blue-100">
                            <div className="flex items-center justify-between mb-10">
                                <h4 className="text-xl font-black tracking-tighter text-slate-900">Báo cáo hiệu suất 2026</h4>
                                <BarChart3 className="text-blue-500" />
                            </div>
                            <div className="space-y-8">
                                {[
                                    { label: 'Doanh thu phân phối', val: 85, color: 'bg-blue-500' },
                                    { label: 'Tỉ lệ hoàn đơn', val: 3, color: 'bg-emerald-500' },
                                    { label: 'Sự hài lòng khách hàng', val: 92, color: 'bg-indigo-500' },
                                    { label: 'Hiệu quả kho', val: 78, color: 'bg-blue-400' }
                                ].map((stat, i) => (
                                    <div key={i} className="space-y-2">
                                        <div className="flex justify-between text-xs font-black uppercase tracking-widest text-slate-400">
                                            <span>{stat.label}</span>
                                            <span className="text-slate-900">{stat.val}%</span>
                                        </div>
                                        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                                            <div className={`h-full ${stat.color} rounded-full`} style={{ width: `${stat.val}%` }} />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Process Section */}
            <section id="quy trình" className="py-32 bg-slate-50">
                <div className="max-w-7xl mx-auto px-6 text-center">
                    <h2 className="text-[11px] font-black text-blue-600 uppercase tracking-[0.3em] mb-4">Quy trình tham gia</h2>
                    <h3 className="text-4xl md:text-5xl font-black text-blue-600 tracking-tighter mb-20">Trở thành đối tác sau 3 bước</h3>

                    <div className="grid md:grid-cols-3 gap-8">
                        {[
                            { step: '01', title: 'Đăng ký hồ sơ', desc: 'Cung cấp thông tin doanh nghiệp, danh mục sản phẩm và giấy phép kinh doanh.' },
                            { step: '02', title: 'Xác thực & Ký kết', desc: 'Đội ngũ SmartBuild thẩm định và ký kết hợp đồng hợp tác trực tuyến.' },
                            { step: '03', title: 'Bắt đầu phân phối', desc: 'Khởi tạo Dashboard NCC, đăng tải sản phẩm và nhận đơn từ hàng ngàn dự án.' }
                        ].map((item, i) => (
                            <div key={i} className="relative p-10 bg-white rounded-[2.5rem] border border-slate-200 text-center group hover:border-blue-500 transition-colors">
                                <div className="absolute -top-6 left-1/2 -translate-x-1/2 w-12 h-12 bg-blue-600 text-white flex items-center justify-center rounded-2xl font-black tracking-tighter shadow-lg shadow-blue-200">
                                    {item.step}
                                </div>
                                <h4 className="text-2xl font-black text-slate-900 mb-4 mt-6 uppercase">{item.title}</h4>
                                <p className="text-slate-500 font-medium leading-relaxed">{item.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Trust Badges / Partners */}
            <section className="py-20 border-y border-slate-100 bg-white">
                <p className="text-center text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-12">Hợp tác cùng 50+ Nhà cung cấp hàng đầu</p>
                <div className="flex flex-wrap justify-center items-center gap-12 md:gap-24 px-6">
                    {[
                        { name: 'HÀ TIÊN', color: 'text-blue-700' },
                        { name: 'HÒA PHÁT', color: 'text-slate-800' },
                        { name: 'DULUX', color: 'text-indigo-600' },
                        { name: 'VIGLACERA', color: 'text-blue-600' },
                        { name: 'SCG', color: 'text-red-600' },
                        { name: 'EUROTILE', color: 'text-amber-700' }
                    ].map((brand) => (
                        <span key={brand.name} className={`text-2xl md:text-4xl font-black ${brand.color} tracking-tighter hover:scale-110 cursor-default transition-all duration-300`}>
                            {brand.name}
                        </span>
                    ))}
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-32 px-6">
                <div className="max-w-7xl mx-auto">
                    <div className="bg-gradient-to-br from-blue-700 to-indigo-800 rounded-[4rem] p-12 md:p-24 text-center relative overflow-hidden shadow-2xl shadow-blue-500/40">
                        {/* Decorative background elements */}
                        <div className="absolute top-0 left-0 w-64 h-64 bg-white/5 rounded-full -translate-x-32 -translate-y-32 blur-[100px]" />
                        <div className="absolute bottom-0 right-0 w-64 h-64 bg-indigo-500/20 rounded-full translate-x-32 translate-y-32 blur-[100px]" />

                        <div className="relative z-10">
                            <h2 className="text-4xl md:text-7xl font-black text-white leading-tight tracking-tighter mb-8">
                                Sẵn Sàng Số Hóa <br /> Kênh Phân Phối Của Bạn?
                            </h2>
                            <p className="text-xl text-blue-100 max-w-2xl mx-auto mb-16 font-medium italic">
                                Hãy gia nhập cùng 25,000+ đối tác đang kiến tạo tương lai xây dựng Việt Nam.
                            </p>
                            <div className="flex flex-col sm:flex-row justify-center gap-6">
                                <Link href="/supplier/register" className="px-12 py-6 bg-white text-blue-600 font-black text-sm uppercase tracking-widest rounded-3xl hover:bg-slate-50 shadow-xl transform active:scale-95 transition-all">
                                    Đăng ký đối tác ngay
                                </Link>
                                <a href="tel:19001234" className="px-12 py-6 bg-blue-600/20 text-white border border-white/20 font-black text-sm uppercase tracking-widest rounded-3xl hover:bg-white/10 transition-all flex items-center justify-center gap-3">
                                    <Phone className="w-5 h-5" /> 1900 1234
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Simple Footer */}
            <footer className="py-12 bg-white border-t border-slate-100">
                <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-8">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-slate-900 rounded-xl flex items-center justify-center">
                            <Building2 className="w-4 h-4 text-white" />
                        </div>
                        <span className="font-black text-slate-900 tracking-tighter uppercase">SmartBuild <span className="text-blue-600">Supplier</span></span>
                    </div>

                    <div className="flex gap-8 text-[11px] font-black text-slate-400 uppercase tracking-widest">
                        <Link href="/terms" className="hover:text-blue-600">Điều khoản</Link>
                        <Link href="/privacy" className="hover:text-blue-600">Bảo mật</Link>
                        <Link href="/contact" className="hover:text-blue-600">Liên hệ</Link>
                    </div>

                    <p className="text-[11px] font-bold text-slate-400 italic">© 2026 SmartBuild Corporation. All rights reserved.</p>
                </div>
            </footer>
        </div>
    )
}
