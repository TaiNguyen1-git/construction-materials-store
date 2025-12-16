'use client'

/**
 * Registration Success Page - Light Theme
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
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 flex flex-col">
            {/* Navigation */}
            <nav className="bg-white/80 backdrop-blur-sm border-b border-gray-100">
                <div className="max-w-7xl mx-auto px-6 py-4">
                    <div className="flex items-center">
                        <Link href="/contractor" className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                                <Building2 className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <span className="text-xl font-bold text-gray-900">SmartBuild</span>
                                <span className="text-blue-600 font-semibold ml-1">PRO</span>
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
                        <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6 ring-4 ring-green-50">
                            <CheckCircle className="w-12 h-12 text-green-600" />
                        </div>
                        <h1 className="text-3xl font-bold text-gray-900 mb-2">Đăng ký Thành công!</h1>
                        <p className="text-lg text-gray-600">
                            Chúng tôi đã nhận được thông tin của bạn
                        </p>
                    </div>

                    {/* Status Card */}
                    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8 mb-8">
                        <div className="flex items-center justify-center gap-3 mb-6">
                            <div className="w-3 h-3 bg-orange-500 rounded-full animate-pulse" />
                            <span className="text-orange-600 font-semibold">Đang chờ Xác minh</span>
                        </div>

                        <h2 className="text-xl font-bold text-gray-900 mb-6">Bước tiếp theo</h2>

                        <div className="space-y-4 text-left">
                            <div className="flex gap-4 bg-orange-50 rounded-xl p-4 border border-orange-100">
                                <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                    <Clock className="w-5 h-5 text-orange-600" />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-gray-900 mb-1">Xác minh (1-2 ngày)</h3>
                                    <p className="text-sm text-gray-600">
                                        Đội ngũ sẽ xác minh thông tin doanh nghiệp và Mã số thuế
                                    </p>
                                </div>
                            </div>

                            <div className="flex gap-4 bg-blue-50 rounded-xl p-4 border border-blue-100">
                                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                    <Phone className="w-5 h-5 text-blue-600" />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-gray-900 mb-1">Tư vấn</h3>
                                    <p className="text-sm text-gray-600">
                                        Chúng tôi sẽ gọi điện tư vấn gói dịch vụ phù hợp
                                    </p>
                                </div>
                            </div>

                            <div className="flex gap-4 bg-green-50 rounded-xl p-4 border border-green-100">
                                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                    <Mail className="w-5 h-5 text-green-600" />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-gray-900 mb-1">Email xác nhận</h3>
                                    <p className="text-sm text-gray-600">
                                        Bạn sẽ nhận email khi tài khoản được duyệt
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Link
                            href="/"
                            className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-8 py-3 rounded-lg font-semibold transition-all"
                        >
                            Về Trang chủ
                        </Link>
                        <Link
                            href="/contractor/login"
                            className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-semibold transition-all flex items-center justify-center gap-2 shadow-md"
                        >
                            Đăng nhập
                            <ArrowRight className="w-5 h-5" />
                        </Link>
                    </div>

                    {/* Contact Info */}
                    <div className="mt-12 text-gray-500">
                        <p>Có thắc mắc? Liên hệ:</p>
                        <p className="text-blue-600 font-semibold">0909 123 456 | contractor@smartbuild.vn</p>
                    </div>
                </div>
            </div>
        </div>
    )
}
