'use client'

/**
 * Public Contractor Portfolio Page - Matching Project Design System
 * Light theme, includes Header, consistent with products page styling
 */

import { useState, useEffect, use } from 'react'
import Link from 'next/link'
import {
    ShieldCheck, Star, MapPin,
    Briefcase, CheckCircle2, ArrowLeft, ArrowRight,
    HardHat, MessageCircle, FileText,
    Heart, Share2, Info, AlertCircle, X
} from 'lucide-react'
import toast, { Toaster } from 'react-hot-toast'
import Header from '@/components/Header'

export default function ContractorPortfolio({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params)
    const [loading, setLoading] = useState(true)
    const [contractor, setContractor] = useState<any>(null)
    const [showLoginModal, setShowLoginModal] = useState(false)

    useEffect(() => {
        fetchContractor()
    }, [id])

    const fetchContractor = async () => {
        setLoading(true)
        try {
            const res = await fetch(`/api/contractors/public/${id}`)
            if (res.ok) {
                const data = await res.json()
                setContractor(data.data)
            } else {
                toast.error('Không tìm thấy thông tin đối tác')
            }
        } catch (err) {
            toast.error('Lỗi kết nối hệ thống')
        } finally {
            setLoading(false)
        }
    }

    if (loading) return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
            <Header />
            <div className="max-w-7xl mx-auto px-4 py-20 text-center">
                <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary-600 mx-auto"></div>
                <p className="text-gray-600 mt-4">Đang tải hồ sơ nhà thầu...</p>
            </div>
        </div>
    )

    if (!contractor) return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
            <Header />
            <div className="max-w-7xl mx-auto px-4 py-20">
                <div className="bg-white rounded-2xl shadow-lg p-12 text-center max-w-lg mx-auto">
                    <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Info className="w-8 h-8" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-3">Không tìm thấy đối tác</h2>
                    <p className="text-gray-500 mb-6">Có thể đối tác này không còn hoạt động trên hệ thống.</p>
                    <Link href="/contractors" className="inline-flex items-center gap-2 px-6 py-3 bg-primary-600 text-white font-bold rounded-xl hover:bg-primary-700 transition-colors">
                        <ArrowLeft className="w-4 h-4" />
                        Quay lại danh sách
                    </Link>
                </div>
            </div>
        </div>
    )

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
            <Toaster position="top-right" />
            <Header />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Breadcrumb */}
                <div className="flex items-center mb-6">
                    <Link href="/" className="text-gray-500 hover:text-primary-600 flex items-center">
                        <ArrowLeft className="h-4 w-4 mr-1" />
                        Trang chủ
                    </Link>
                    <span className="mx-2 text-gray-500">/</span>
                    <Link href="/contractors" className="text-gray-500 hover:text-primary-600">Nhà Thầu</Link>
                    <span className="mx-2 text-gray-500">/</span>
                    <span className="text-gray-900 font-medium truncate max-w-[200px]">{contractor.displayName}</span>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Main Profile Section */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Profile Card */}
                        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 md:p-8">
                            <div className="flex flex-col md:flex-row gap-6 items-start mb-6">
                                <div className="w-24 h-24 bg-gradient-to-br from-primary-100 to-secondary-100 rounded-2xl flex items-center justify-center text-5xl font-black text-primary-600 shadow-lg">
                                    {contractor.displayName?.charAt(0) || 'N'}
                                </div>
                                <div className="flex-1">
                                    <div className="flex flex-wrap items-center gap-3 mb-2">
                                        <h1 className="text-3xl font-black text-gray-900">{contractor.displayName}</h1>
                                        <div className="flex items-center gap-1.5 px-3 py-1 bg-green-50 text-green-600 rounded-full text-xs font-bold uppercase tracking-wide border border-green-100">
                                            <ShieldCheck className="w-3.5 h-3.5" />
                                            Đã xác minh
                                        </div>
                                    </div>
                                    <p className="text-lg text-gray-500 font-medium flex items-center gap-2">
                                        <Briefcase className="w-5 h-5 text-primary-600" />
                                        {contractor.companyName || 'Đối tác SmartBuild'}
                                    </p>
                                </div>
                            </div>

                            {/* Stats Grid */}
                            <div className="grid grid-cols-3 gap-4 mb-6 p-4 bg-gray-50 rounded-xl">
                                <div className="text-center">
                                    <div className="flex items-center justify-center gap-1 text-amber-500 mb-1">
                                        <Star className="w-5 h-5 fill-current" />
                                        <span className="text-2xl font-black text-gray-900">{contractor.avgRating || 0}</span>
                                    </div>
                                    <p className="text-xs font-semibold text-gray-500 uppercase">Đánh giá</p>
                                </div>
                                <div className="text-center border-x border-gray-200">
                                    <p className="text-2xl font-black text-gray-900">{contractor.experienceYears || 0}</p>
                                    <p className="text-xs font-semibold text-gray-500 uppercase">Năm KN</p>
                                </div>
                                <div className="text-center">
                                    <p className="text-2xl font-black text-gray-900">{contractor.totalProjectsCompleted || 0}</p>
                                    <p className="text-xs font-semibold text-gray-500 uppercase">Dự án</p>
                                </div>
                            </div>

                            {/* Bio */}
                            <div className="mb-6">
                                <h3 className="text-lg font-bold text-gray-900 mb-3">Giới thiệu</h3>
                                <p className="text-gray-600 leading-relaxed bg-blue-50/50 p-4 rounded-xl border-l-4 border-primary-600 italic">
                                    "{contractor.bio || 'Chưa cập nhật thông tin giới thiệu chi tiết.'}"
                                </p>
                            </div>

                            {/* Skills */}
                            <div>
                                <h3 className="text-lg font-bold text-gray-900 mb-3">Lĩnh vực chuyên môn</h3>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                    {contractor.skills?.map((skill: string) => (
                                        <div key={skill} className="flex items-center gap-2 px-4 py-3 bg-white border-2 border-gray-100 rounded-xl hover:border-primary-600 hover:shadow-md transition-all">
                                            <div className="w-8 h-8 bg-primary-50 text-primary-600 rounded-lg flex items-center justify-center">
                                                <HardHat className="w-4 h-4" />
                                            </div>
                                            <span className="font-bold text-gray-700 text-sm">{skill}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Trust Banner */}
                        <div className="bg-gradient-to-r from-primary-600 to-secondary-600 rounded-2xl shadow-lg p-6 md:p-8 text-white">
                            <div className="flex flex-col md:flex-row gap-6 items-center">
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-3">
                                        <ShieldCheck className="w-5 h-5" />
                                        <span className="text-xs font-bold uppercase tracking-widest opacity-80">SmartBuild Protection</span>
                                    </div>
                                    <h3 className="text-2xl font-black mb-4">Bảo vệ quyền lợi khách hàng</h3>
                                    <ul className="space-y-2">
                                        <li className="flex items-center gap-2 text-sm font-medium opacity-90">
                                            <CheckCircle2 className="w-4 h-4" />
                                            Thanh toán có bảo đảm - chỉ giải ngân khi bạn hài lòng
                                        </li>
                                        <li className="flex items-center gap-2 text-sm font-medium opacity-90">
                                            <CheckCircle2 className="w-4 h-4" />
                                            Chất lượng vật liệu được kiểm soát
                                        </li>
                                        <li className="flex items-center gap-2 text-sm font-medium opacity-90">
                                            <CheckCircle2 className="w-4 h-4" />
                                            Bảo hiểm cho mọi dự án
                                        </li>
                                    </ul>
                                </div>
                                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 text-center border border-white/20">
                                    <p className="text-xs font-bold uppercase tracking-widest opacity-70 mb-2">Điểm Tín Nhiệm</p>
                                    <p className="text-5xl font-black">{contractor.trustScore || 100}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-6">
                        {/* Contact Card */}
                        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
                            <div className="flex items-center justify-between mb-6">
                                <h4 className="text-lg font-bold text-gray-900">Liên hệ</h4>
                                <button
                                    onClick={() => setShowLoginModal(true)}
                                    className="p-2 bg-red-50 text-red-400 rounded-full hover:text-red-500 transition-all"
                                >
                                    <Heart className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="space-y-4 mb-6">
                                <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl">
                                    <div className="w-10 h-10 bg-white text-primary-600 rounded-lg flex items-center justify-center shadow-sm">
                                        <MapPin className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <p className="text-xs font-semibold text-gray-500 uppercase">Khu vực</p>
                                        <p className="text-gray-900 font-bold">{contractor.city || 'Việt Nam'}</p>
                                    </div>
                                </div>

                                <div className="p-4 bg-blue-50 rounded-xl border border-blue-100">
                                    <div className="flex gap-3 items-start">
                                        <AlertCircle className="w-5 h-5 text-primary-600 shrink-0 mt-0.5" />
                                        <p className="text-xs font-medium text-primary-700 leading-relaxed">
                                            Hãy yêu cầu báo giá qua hệ thống để được bảo hiểm quyền lợi.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <button
                                    onClick={() => {
                                        toast.success('Đã gửi yêu cầu báo giá! Nhà thầu sẽ liên hệ lại trong 24h.')
                                    }}
                                    className="w-full py-3 bg-primary-600 text-white font-bold rounded-xl hover:bg-primary-700 transition-all flex items-center justify-center gap-2"
                                >
                                    <FileText className="w-5 h-5" />
                                    Yêu cầu báo giá
                                </button>
                                <Link
                                    href={`/contact?contractor=${contractor.displayName}`}
                                    className="w-full py-3 bg-white text-gray-700 font-bold rounded-xl border-2 border-gray-200 hover:border-primary-600 hover:text-primary-600 transition-all flex items-center justify-center gap-2"
                                >
                                    <MessageCircle className="w-5 h-5" />
                                    Gửi tin nhắn
                                </Link>
                                <button
                                    onClick={async () => {
                                        try {
                                            if (navigator.clipboard && window.isSecureContext) {
                                                await navigator.clipboard.writeText(window.location.href)
                                                toast.success('Đã sao chép link hồ sơ vào clipboard!')
                                            } else {
                                                // Fallback for insecure context
                                                const textArea = document.createElement('textarea')
                                                textArea.value = window.location.href
                                                document.body.appendChild(textArea)
                                                textArea.select()
                                                document.execCommand('copy')
                                                document.body.removeChild(textArea)
                                                toast.success('Đã sao chép link hồ sơ!')
                                            }
                                        } catch (err) {
                                            toast.error('Không thể sao chép. Hãy copy thủ công từ thanh địa chỉ.')
                                        }
                                    }}
                                    className="w-full py-2 text-gray-400 font-semibold text-sm hover:text-gray-700 transition-all flex items-center justify-center gap-2"
                                >
                                    <Share2 className="w-4 h-4" />
                                    Chia sẻ hồ sơ
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Bottom CTA */}
                <div className="mt-12 bg-white rounded-2xl shadow-lg border border-gray-100 p-8 text-center">
                    <h3 className="text-xl font-bold text-gray-900 mb-3">Bạn chưa thấy phù hợp?</h3>
                    <p className="text-gray-600 mb-6">Chúng tôi còn nhiều đối tác khác trong cùng lĩnh vực.</p>
                    <Link href="/contractors" className="inline-flex items-center gap-2 text-primary-600 font-bold text-lg hover:gap-3 transition-all">
                        Khám phá thêm
                        <ArrowRight className="w-5 h-5" />
                    </Link>
                </div>
            </div>

            {/* Login Modal */}
            {showLoginModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 animate-in fade-in zoom-in duration-300">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-xl font-bold text-gray-900">Đăng nhập để tiếp tục</h3>
                            <button
                                onClick={() => setShowLoginModal(false)}
                                className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-all"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="text-center mb-6">
                            <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Heart className="w-8 h-8 text-red-500" />
                            </div>
                            <p className="text-gray-600">
                                Bạn cần đăng nhập để lưu nhà thầu yêu thích và nhận thông báo khi có ưu đãi mới.
                            </p>
                        </div>

                        <div className="space-y-3">
                            <Link
                                href="/login"
                                className="w-full py-3 bg-primary-600 text-white font-bold rounded-xl hover:bg-primary-700 transition-all flex items-center justify-center gap-2"
                            >
                                Đăng nhập ngay
                            </Link>
                            <div className="text-center text-sm text-gray-500 py-2">
                                Chưa có tài khoản?{' '}
                                <Link href="/register" className="text-primary-600 font-bold hover:underline">
                                    Đăng ký ngay
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
