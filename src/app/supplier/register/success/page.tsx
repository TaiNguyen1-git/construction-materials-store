'use client'

/**
 * Supplier Registration Success Page - Light Theme
 */

import Link from 'next/link'
import {
    Building2,
    CheckCircle,
    Clock,
    Mail,
    Phone,
    ArrowRight,
    ArrowLeft
} from 'lucide-react'

export default function SupplierRegistrationSuccessPage() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex flex-col selection:bg-blue-100 selection:text-blue-900">
            {/* Navigation */}
            <nav className="bg-white/80 backdrop-blur-xl border-b border-slate-100 sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-6 py-4">
                    <div className="flex items-center justify-between">
                        <Link href="/supplier" className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
                                <Building2 className="w-6 h-6 text-white" />
                            </div>
                            <div className="flex flex-col leading-none">
                                <span className="text-xl font-black text-slate-900 tracking-tighter uppercase italic">SmartBuild</span>
                                <span className="text-[10px] font-black text-blue-600 tracking-[0.2em] uppercase mt-0.5">Supplier Portal</span>
                            </div>
                        </Link>
                    </div>
                </div>
            </nav>

            {/* Main Content */}
            <div className="flex-1 flex items-center justify-center px-6 py-12">
                <div className="w-full max-w-xl text-center">
                    {/* Success Icon */}
                    <div className="mb-12">
                        <div className="w-32 h-32 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-8 shadow-inner">
                            <CheckCircle className="w-16 h-16 text-green-600" />
                        </div>
                        <h1 className="text-4xl font-black text-slate-900 tracking-tighter mb-4 uppercase">Đăng ký Hồ sơ Thành công!</h1>
                        <p className="text-lg text-slate-500 font-medium italic">
                            Hệ thống đã nhận được hồ sơ hợp tác của doanh nghiệp.
                        </p>
                    </div>

                    {/* Status Card */}
                    <div className="bg-white/80 backdrop-blur-xl rounded-[3rem] shadow-2xl shadow-blue-500/10 border border-white p-10 mb-12">
                        <div className="flex items-center justify-center gap-3 mb-8">
                            <div className="w-3 h-3 bg-blue-500 rounded-full animate-ping" />
                            <span className="text-[11px] font-black text-blue-600 uppercase tracking-[0.2em]">Hồ sơ đang được thẩm định</span>
                        </div>

                        <h2 className="text-xl font-black text-slate-900 mb-8 uppercase tracking-tight">Quy trình tiếp theo</h2>

                        <div className="space-y-6 text-left">
                            <div className="flex gap-6 p-6 bg-slate-50 rounded-3xl border border-slate-100">
                                <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center shrink-0 shadow-lg shadow-blue-200">
                                    <Clock className="w-6 h-6 text-white" />
                                </div>
                                <div className="flex-1">
                                    <h3 className="font-black text-slate-900 uppercase tracking-tight text-sm">Thẩm định hồ sơ (24h - 48h)</h3>
                                    <p className="text-xs text-slate-500 font-medium mt-1 leading-relaxed">
                                        Chúng tôi sẽ kiểm tra Mã số thuế và thông tin ngành hàng của doanh nghiệp.
                                    </p>
                                </div>
                            </div>

                            <div className="flex gap-6 p-6 bg-slate-50 rounded-3xl border border-slate-100">
                                <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center shrink-0 shadow-lg shadow-indigo-200">
                                    <Phone className="w-6 h-6 text-white" />
                                </div>
                                <div className="flex-1">
                                    <h3 className="font-black text-slate-900 uppercase tracking-tight text-sm">Liên hệ tư vấn vận hành</h3>
                                    <p className="text-xs text-slate-500 font-medium mt-1 leading-relaxed">
                                        Bộ phận quản lý nhà thầu sẽ gọi điện hướng dẫn quy trình đăng tải sản phẩm.
                                    </p>
                                </div>
                            </div>

                            <div className="flex gap-6 p-6 bg-slate-50 rounded-3xl border border-slate-100">
                                <div className="w-12 h-12 bg-emerald-600 rounded-2xl flex items-center justify-center shrink-0 shadow-lg shadow-emerald-200">
                                    <Mail className="w-6 h-6 text-white" />
                                </div>
                                <div className="flex-1">
                                    <h3 className="font-black text-slate-900 uppercase tracking-tight text-sm">Nhận thông tin kích hoạt</h3>
                                    <p className="text-xs text-slate-500 font-medium mt-1 leading-relaxed">
                                        Email hướng dẫn truy cập Dashboard NCC sẽ được gửi ngay sau khi duyệt.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col sm:flex-row gap-6 justify-center">
                        <Link
                            href="/supplier"
                            className="h-16 px-10 bg-slate-50 hover:bg-slate-100 text-slate-500 rounded-2xl font-black uppercase tracking-widest text-[10px] transition-all flex items-center justify-center gap-3 border border-slate-100 group"
                        >
                            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                            Về Trang giới thiệu
                        </Link>
                        <Link
                            href="/supplier/login"
                            className="h-16 px-10 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] transition-all flex items-center justify-center gap-3 shadow-xl shadow-blue-500/20 group"
                        >
                            Truy cập Portal NCC
                            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        </Link>
                    </div>

                    {/* Contact Info */}
                    <div className="mt-16 text-slate-400">
                        <p className="text-[10px] font-black uppercase tracking-widest mb-2">Hỗ trợ đối tác NCC:</p>
                        <p className="text-base font-black text-blue-600 tracking-tighter">1900 1234 | supplier-care@smartbuild.vn</p>
                    </div>
                </div>
            </div>

            {/* Simple Footer */}
            <footer className="py-12 bg-white/50 border-t border-slate-100">
                <div className="max-w-7xl mx-auto px-6 text-center">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest italic">
                        © 2026 SmartBuild Corporation - Hệ thống Cổng Đối Tác
                    </p>
                </div>
            </footer>
        </div>
    )
}
