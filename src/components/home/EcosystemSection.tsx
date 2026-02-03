'use client'

import React from 'react'
import Link from 'next/link'
import { ArrowRight, Building2, HardHat, ShieldCheck } from 'lucide-react'

export default function EcosystemSection() {
    return (
        <section className="relative py-32 bg-white overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent"></div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                <div className="text-center max-w-3xl mx-auto mb-20">
                    <h2 className="text-[11px] font-black text-indigo-600 uppercase tracking-[0.4em] mb-4">Hệ sinh thái SmartBuild</h2>
                    <h3 className="text-4xl md:text-5xl font-black text-slate-900 leading-tight tracking-tighter">
                        Kết nối <span className="text-indigo-600">Đối tác</span> chiến lược hiện đại
                    </h3>
                    <p className="mt-6 text-slate-500 font-medium text-lg leading-relaxed">
                        Chúng tôi xây dựng nền tảng minh bạch và hiệu quả cho tất cả các bên tham gia vào chuỗi cung ứng xây dựng Việt Nam.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                    {/* Supplier Card */}
                    <div className="group relative bg-slate-50/50 rounded-[3rem] p-12 border border-slate-100 overflow-hidden hover:shadow-[0_40px_100px_rgba(79,70,229,0.1)] transition-all duration-700">
                        <div className="absolute -right-20 -top-20 w-64 h-64 bg-indigo-500/5 rounded-full blur-[100px] group-hover:bg-indigo-500/10 transition-all duration-700"></div>

                        <div className="relative z-10">
                            <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center shadow-xl border border-slate-50 mb-10 group-hover:scale-110 group-hover:-rotate-3 transition-all duration-500">
                                <Building2 className="w-10 h-10 text-indigo-600" />
                            </div>
                            <h4 className="text-3xl font-black text-slate-900 mb-6 tracking-tighter uppercase">Dành Cho Nhà Cung Cấp</h4>
                            <p className="text-slate-500 font-medium mb-10 text-lg leading-relaxed">
                                Mở rộng thị trường, quản lý đơn hàng thông minh và tối ưu hóa quy trình phân phối sản phẩm đến trực tiếp các nhà thầu.
                            </p>

                            <ul className="space-y-4 mb-12">
                                {[
                                    "Phân phối hàng hóa 4.0",
                                    "Quản lý tồn kho Real-time",
                                    "Báo cáo phân tích AI",
                                    "Thanh toán bảo mật 100%"
                                ].map((item, i) => (
                                    <li key={i} className="flex items-center gap-3 text-sm font-bold text-slate-700">
                                        <div className="w-5 h-5 rounded-full bg-indigo-100 flex items-center justify-center">
                                            <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
                                        </div>
                                        {item}
                                    </li>
                                ))}
                            </ul>

                            <Link
                                href="/supplier"
                                className="inline-flex items-center gap-3 px-10 py-5 bg-indigo-600 text-white font-black text-xs uppercase tracking-widest rounded-2xl hover:bg-indigo-700 hover:gap-5 transition-all shadow-xl shadow-indigo-100"
                            >
                                Giải pháp NCC <ArrowRight className="w-4 h-4" />
                            </Link>
                        </div>
                    </div>

                    {/* Contractor Card */}
                    <div className="group relative bg-[#fffcf0] rounded-[3rem] p-12 border border-amber-100/50 overflow-hidden hover:shadow-[0_40px_100px_rgba(245,158,11,0.1)] transition-all duration-700">
                        <div className="absolute -right-20 -top-20 w-64 h-64 bg-amber-500/5 rounded-full blur-[100px] group-hover:bg-amber-500/10 transition-all duration-700"></div>

                        <div className="relative z-10">
                            <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center shadow-xl border border-amber-50 mb-10 group-hover:scale-110 group-hover:rotate-3 transition-all duration-500">
                                <HardHat className="w-10 h-10 text-amber-600" />
                            </div>
                            <h4 className="text-3xl font-black text-slate-900 mb-6 tracking-tighter uppercase">Dành Cho Nhà Thầu</h4>
                            <p className="text-slate-500 font-medium mb-10 text-lg leading-relaxed">
                                Xây dựng hồ sơ uy tín, nhận dự án mới mỗi ngày và quản lý vật tư công trình chuyên nghiệp với công cụ AI thông minh.
                            </p>

                            <ul className="space-y-4 mb-12">
                                {[
                                    "Tiếp cận hàng nghìn dự án",
                                    "Mua vật tư giá ưu đãi",
                                    "Công cụ dự toán thông minh",
                                    "Quản lý tiến độ thi công"
                                ].map((item, i) => (
                                    <li key={i} className="flex items-center gap-3 text-sm font-bold text-slate-700">
                                        <div className="w-5 h-5 rounded-full bg-amber-100 flex items-center justify-center">
                                            <ShieldCheck className="w-3.5 h-3.5 text-amber-600" />
                                        </div>
                                        {item}
                                    </li>
                                ))}
                            </ul>

                            <Link
                                href="/contractor"
                                className="inline-flex items-center gap-3 px-10 py-5 bg-white text-slate-900 font-black text-xs uppercase tracking-widest rounded-2xl border border-slate-200 hover:bg-slate-50 hover:gap-5 transition-all shadow-xl shadow-slate-100"
                            >
                                Giải pháp Nhà Thầu <ArrowRight className="w-4 h-4" />
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    )
}
