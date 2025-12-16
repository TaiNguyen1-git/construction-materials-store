'use client'

/**
 * Registration Success Page
 * Shows after successful contractor registration
 */

import Link from 'next/link'
import {
    Building2,
    CheckCircle,
    Clock,
    Mail,
    Phone,
    ArrowRight
} from 'lucide-react'

export default function RegistrationSuccessPage() {
    return (
        <div className="min-h-screen bg-slate-950 text-white flex flex-col">
            {/* Navigation */}
            <nav className="bg-slate-950/95 backdrop-blur-md border-b border-slate-800">
                <div className="max-w-7xl mx-auto px-6 py-4">
                    <div className="flex items-center">
                        <Link href="/contractor" className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-amber-600 rounded-lg flex items-center justify-center">
                                <Building2 className="w-6 h-6 text-slate-950" />
                            </div>
                            <div>
                                <span className="text-xl font-bold text-white">SmartBuild</span>
                                <span className="text-amber-500 font-semibold ml-2">PRO</span>
                            </div>
                        </Link>
                    </div>
                </div>
            </nav>

            {/* Main Content */}
            <div className="flex-1 flex items-center justify-center px-6 py-12">
                <div className="w-full max-w-xl text-center">
                    {/* Success Icon */}
                    <div className="mb-8">
                        <div className="w-24 h-24 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6 ring-4 ring-green-500/30">
                            <CheckCircle className="w-12 h-12 text-green-500" />
                        </div>
                        <h1 className="text-4xl font-bold mb-4">Đăng ký Thành công!</h1>
                        <p className="text-xl text-slate-400">
                            Chúng tôi đã nhận được thông tin của bạn
                        </p>
                    </div>

                    {/* Status Card */}
                    <div className="bg-slate-900 rounded-3xl border border-slate-800 p-8 mb-8">
                        <div className="flex items-center justify-center gap-3 mb-6">
                            <div className="w-3 h-3 bg-amber-500 rounded-full animate-pulse" />
                            <span className="text-amber-500 font-semibold">Đang chờ Xác minh</span>
                        </div>

                        <h2 className="text-2xl font-bold mb-4">Bước tiếp theo?</h2>

                        <div className="space-y-4 text-left">
                            <div className="flex gap-4 bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
                                <div className="w-10 h-10 bg-amber-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                                    <Clock className="w-5 h-5 text-amber-500" />
                                </div>
                                <div>
                                    <h3 className="font-semibold mb-1">Đợi xác minh (1-2 ngày)</h3>
                                    <p className="text-sm text-slate-400">
                                        Đội ngũ sẽ xác minh thông tin doanh nghiệp và Mã số thuế của bạn
                                    </p>
                                </div>
                            </div>

                            <div className="flex gap-4 bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
                                <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                                    <Phone className="w-5 h-5 text-blue-500" />
                                </div>
                                <div>
                                    <h3 className="font-semibold mb-1">Liên hệ tư vấn</h3>
                                    <p className="text-sm text-slate-400">
                                        Chúng tôi sẽ gọi điện để tư vấn gói dịch vụ phù hợp với quy mô dự án của bạn
                                    </p>
                                </div>
                            </div>

                            <div className="flex gap-4 bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
                                <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                                    <Mail className="w-5 h-5 text-green-500" />
                                </div>
                                <div>
                                    <h3 className="font-semibold mb-1">Email xác nhận</h3>
                                    <p className="text-sm text-slate-400">
                                        Bạn sẽ nhận email khi tài khoản được duyệt, kèm hướng dẫn sử dụng portal
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Link
                            href="/"
                            className="bg-slate-800 hover:bg-slate-700 text-white px-8 py-3 rounded-xl font-semibold transition-all border border-slate-700"
                        >
                            Về Trang chủ
                        </Link>
                        <Link
                            href="/contractor/login"
                            className="bg-amber-500 hover:bg-amber-600 text-slate-950 px-8 py-3 rounded-xl font-bold transition-all flex items-center justify-center gap-2"
                        >
                            Đăng nhập
                            <ArrowRight className="w-5 h-5" />
                        </Link>
                    </div>

                    {/* Contact Info */}
                    <div className="mt-12 text-slate-500">
                        <p>Có thắc mắc? Liên hệ ngay:</p>
                        <p className="text-amber-500 font-semibold">0909 123 456 | contractor@smartbuild.vn</p>
                    </div>
                </div>
            </div>
        </div>
    )
}
