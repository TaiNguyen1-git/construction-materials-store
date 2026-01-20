'use client'

/**
 * Public Contractor Marketplace - Matching Project Design System
 * Light theme with project colors, includes Header
 */

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
    Users, MapPin, Star, ShieldCheck,
    Search, ArrowRight, ArrowLeft,
    Briefcase, Wrench, Paintbrush,
    Zap, HardHat, Building2,
    Heart, CheckCircle2, X
} from 'lucide-react'
import toast, { Toaster } from 'react-hot-toast'
import Header from '@/components/Header'

const CATEGORIES = [
    { id: 'all', name: 'Tất cả', icon: Users },
    { id: 'Xây thô', name: 'Xây thô', icon: HardHat },
    { id: 'Điện nước', name: 'Điện nước', icon: Zap },
    { id: 'Sơn bả', name: 'Sơn bả', icon: Paintbrush },
    { id: 'Nội thất', name: 'Nội thất', icon: Briefcase },
    { id: 'Sửa chữa', name: 'Sửa chữa', icon: Wrench },
]

export default function ContractorMarketplace() {
    const [loading, setLoading] = useState(true)
    const [contractors, setContractors] = useState<any[]>([])
    const [filter, setFilter] = useState('all')
    const [searchTerm, setSearchTerm] = useState('')
    const [showLoginModal, setShowLoginModal] = useState(false)

    useEffect(() => {
        fetchContractors()
    }, [filter])

    const fetchContractors = async () => {
        setLoading(true)
        try {
            const url = filter === 'all'
                ? '/api/contractors/public'
                : `/api/contractors/public?skill=${encodeURIComponent(filter)}`
            const res = await fetch(url)
            if (res.ok) {
                const data = await res.json()
                setContractors(data.data || [])
            }
        } catch (err) {
            toast.error('Lỗi khi tải danh sách đối tác')
        } finally {
            setLoading(false)
        }
    }

    const filteredContractors = contractors.filter(c =>
        c.displayName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.companyName?.toLowerCase().includes(searchTerm.toLowerCase())
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
                    <span className="text-gray-900 font-medium">Nhà Thầu</span>
                </div>

                {/* Page Header */}
                <div className="mb-8">
                    <h1 className="text-4xl font-black text-gray-900 mb-4">
                        👷 Mạng Lưới Nhà Thầu
                    </h1>
                    <p className="text-gray-600 mb-6 text-lg">
                        Tìm kiếm và kết nối với các nhà thầu xây dựng uy tín, được xác minh bởi SmartBuild
                    </p>

                    {/* Search Bar */}
                    <div className="flex justify-center mb-6">
                        <div className="relative w-full max-w-2xl">
                            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Tìm nhà thầu theo tên hoặc công ty..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-12 pr-4 py-3 bg-white border border-gray-200 rounded-xl shadow-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all"
                            />
                        </div>
                    </div>
                </div>

                {/* Category Filters */}
                <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-4 mb-8">
                    <div className="flex flex-wrap gap-2">
                        {CATEGORIES.map((cat) => {
                            const Icon = cat.icon
                            const isActive = filter === cat.id
                            return (
                                <button
                                    key={cat.id}
                                    onClick={() => setFilter(cat.id)}
                                    className={`
                                        flex items-center gap-2 px-4 py-2 rounded-lg transition-all font-semibold text-sm
                                        ${isActive
                                            ? 'bg-primary-600 text-white shadow-md'
                                            : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                                        }
                                    `}
                                >
                                    <Icon className="w-4 h-4" />
                                    {cat.name}
                                </button>
                            )
                        })}
                    </div>
                </div>

                {/* Contractor Grid */}
                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[1, 2, 3, 4, 5, 6].map((i) => (
                            <div key={i} className="bg-white rounded-2xl shadow-lg p-6 animate-pulse">
                                <div className="bg-gray-200 h-16 w-16 rounded-xl mb-4"></div>
                                <div className="bg-gray-200 h-4 rounded mb-2"></div>
                                <div className="bg-gray-200 h-4 rounded w-3/4 mb-4"></div>
                                <div className="bg-gray-200 h-8 rounded w-1/2"></div>
                            </div>
                        ))}
                    </div>
                ) : filteredContractors.length === 0 ? (
                    <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
                        <Users className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-xl font-bold text-gray-900 mb-2">Không tìm thấy nhà thầu</h3>
                        <p className="text-gray-600 mb-6">Thử đổi từ khóa hoặc danh mục tìm kiếm</p>
                        <button
                            onClick={() => { setFilter('all'); setSearchTerm(''); }}
                            className="inline-block bg-primary-600 text-white px-6 py-3 rounded-xl hover:bg-primary-700 font-bold transition-colors"
                        >
                            Xem Tất Cả
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredContractors.map((c) => (
                            <div key={c.id} className="bg-white rounded-2xl shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300 overflow-hidden group hover:scale-[1.02]">
                                <div className="p-6">
                                    {/* Header with badge */}
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="flex items-center gap-1.5 px-2 py-1 bg-green-50 text-green-600 rounded-full text-[10px] font-bold uppercase tracking-wide border border-green-100">
                                            <ShieldCheck className="w-3 h-3" />
                                            Đã xác minh
                                        </div>
                                        <button
                                            onClick={(e) => {
                                                e.preventDefault()
                                                e.stopPropagation()
                                                setShowLoginModal(true)
                                            }}
                                            className="p-2 bg-gray-50 text-gray-400 rounded-full hover:text-red-500 transition-all"
                                        >
                                            <Heart className="w-4 h-4" />
                                        </button>
                                    </div>

                                    {/* Avatar & Name */}
                                    <div className="flex items-center gap-4 mb-4">
                                        <div className="w-14 h-14 bg-gradient-to-br from-primary-100 to-secondary-100 rounded-xl flex items-center justify-center text-2xl font-black text-primary-600 group-hover:scale-105 transition-transform">
                                            {c.displayName?.charAt(0) || 'N'}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h3 className="text-lg font-bold text-gray-900 truncate group-hover:text-primary-600 transition-colors">
                                                {c.displayName}
                                            </h3>
                                            <p className="text-sm text-gray-500 truncate flex items-center gap-1">
                                                <Building2 className="w-3 h-3" />
                                                {c.companyName || 'Đối tác SmartBuild'}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Stats */}
                                    <div className="grid grid-cols-3 gap-2 mb-4">
                                        <div className="bg-gray-50 p-2 rounded-lg text-center">
                                            <div className="flex items-center justify-center gap-1 text-amber-500">
                                                <Star className="w-3 h-3 fill-current" />
                                                <span className="text-sm font-bold text-gray-900">{c.avgRating || 0}</span>
                                            </div>
                                            <p className="text-[10px] font-semibold text-gray-500 uppercase">Rating</p>
                                        </div>
                                        <div className="bg-gray-50 p-2 rounded-lg text-center">
                                            <p className="text-sm font-bold text-gray-900">{c.experienceYears || 0}y</p>
                                            <p className="text-[10px] font-semibold text-gray-500 uppercase">K.Nghiệm</p>
                                        </div>
                                        <div className="bg-gray-50 p-2 rounded-lg text-center">
                                            <p className="text-sm font-bold text-gray-900">{c.totalProjectsCompleted || 0}</p>
                                            <p className="text-[10px] font-semibold text-gray-500 uppercase">Dự án</p>
                                        </div>
                                    </div>

                                    {/* Skills */}
                                    <div className="flex flex-wrap gap-1 mb-4 h-8 overflow-hidden">
                                        {c.skills?.slice(0, 3).map((skill: string) => (
                                            <span key={skill} className="px-2 py-1 bg-primary-50 text-primary-600 rounded-md text-[10px] font-bold">
                                                {skill}
                                            </span>
                                        ))}
                                    </div>

                                    {/* Location */}
                                    <div className="flex items-center gap-2 text-sm text-gray-500 mb-4 pb-4 border-b border-gray-100">
                                        <MapPin className="w-4 h-4 text-primary-600" />
                                        <span>{c.district || 'Hỗ trợ'}, {c.city || 'Toàn quốc'}</span>
                                    </div>

                                    {/* CTA */}
                                    <div className="flex gap-2">
                                        <Link
                                            href={`/contractors/${c.id}`}
                                            className="flex-1 bg-primary-600 text-white px-4 py-2 rounded-xl hover:bg-primary-700 text-sm font-bold text-center transition-colors"
                                        >
                                            Xem hồ sơ
                                        </Link>
                                        <Link
                                            href={`/contractors/${c.id}`}
                                            className="px-4 py-2 border-2 border-primary-600 text-primary-600 rounded-xl hover:bg-primary-50 text-sm font-bold transition-colors flex items-center justify-center"
                                        >
                                            <ArrowRight className="h-4 w-4" />
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* CTA Section */}
                <div className="mt-12 bg-white rounded-2xl shadow-lg border border-gray-100 p-8 text-center">
                    <h2 className="text-2xl font-black text-gray-900 mb-4">Bạn là nhà thầu chuyên nghiệp?</h2>
                    <p className="text-gray-600 mb-6 max-w-xl mx-auto">
                        Gia nhập mạng lưới của SmartBuild để tiếp cận dự án chất lượng và nhận hỗ trợ tài chính từ chúng tôi.
                    </p>
                    <Link href="/contractor/login" className="inline-flex items-center gap-2 px-6 py-3 bg-primary-600 text-white font-bold rounded-xl hover:bg-primary-700 transition-colors">
                        Đăng ký đối tác
                        <ArrowRight className="w-4 h-4" />
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
