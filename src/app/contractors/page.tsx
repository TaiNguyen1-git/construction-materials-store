'use client'

/**
 * Public Contractor Marketplace - Enhanced with 7 Premium Features
 */

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
    Users, MapPin, Star, ShieldCheck,
    Search, ArrowRight, ArrowLeft,
    Briefcase, Wrench, Paintbrush,
    Zap, HardHat, Building2,
    Heart, CheckCircle2, X, Filter,
    Scale, AlertCircle, Check,
    Clock, Trophy, BadgeCheck,
    MessageSquare, Calculator, Camera
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

const CITIES = ['Toàn quốc', 'Hồ Chí Minh', 'Hà Nội', 'Đà Nẵng', 'Hải Phòng', 'Cần Thơ', 'Biên Hòa']

export default function ContractorMarketplace() {
    const [loading, setLoading] = useState(true)
    const [contractors, setContractors] = useState<any[]>([])
    const [filter, setFilter] = useState('all')
    const [cityFilter, setCityFilter] = useState('Toàn quốc')
    const [searchTerm, setSearchTerm] = useState('')
    const [showLoginModal, setShowLoginModal] = useState(false)

    // Feature 7: Comparison State
    const [compareList, setCompareList] = useState<any[]>([])

    useEffect(() => {
        fetchContractors()
    }, [filter, cityFilter])

    const fetchContractors = async () => {
        setLoading(true)
        try {
            let url = '/api/contractors/public?'
            if (filter !== 'all') url += `skill=${encodeURIComponent(filter)}&`
            if (cityFilter !== 'Toàn quốc') url += `city=${encodeURIComponent(cityFilter)}&`

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

    const toggleCompare = (contractor: any) => {
        if (compareList.find(c => c.id === contractor.id)) {
            setCompareList(compareList.filter(c => c.id !== contractor.id))
        } else {
            if (compareList.length >= 3) {
                toast.error('Chỉ có thể so sánh tối đa 3 nhà thầu')
                return
            }
            setCompareList([...compareList, contractor])
        }
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 pb-24">
            <Toaster position="top-right" />
            <Header />

            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
                        <div>
                            <h1 className="text-4xl font-black text-gray-900 mb-2">
                                👷 Mạng Lưới Nhà Thầu
                            </h1>
                            <p className="text-gray-600 text-lg">
                                Tìm kiếm và chuyên nghiệp hóa quy trình xây dựng cùng SmartBuild
                            </p>
                        </div>
                        <div className="flex items-center gap-2 text-sm font-bold text-primary-600 bg-white px-4 py-2 rounded-xl shadow-sm border border-primary-100">
                            <Users className="w-5 h-5" />
                            {filteredContractors.length} Đối tác sẵn sàng
                        </div>
                    </div>

                    {/* Search & Location Filter */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                        <div className="md:col-span-3 relative">
                            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Tìm nhà thầu theo tên hoặc công ty..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-12 pr-4 py-3.5 bg-white border border-gray-200 rounded-2xl shadow-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all font-medium"
                            />
                        </div>
                        <div className="relative">
                            <MapPin className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                            <select
                                value={cityFilter}
                                onChange={(e) => setCityFilter(e.target.value)}
                                className="w-full pl-12 pr-4 py-3.5 bg-white border border-gray-200 rounded-2xl shadow-sm focus:ring-2 focus:ring-primary-500 outline-none appearance-none font-bold text-gray-700 cursor-pointer"
                            >
                                {CITIES.map(city => (
                                    <option key={city} value={city}>{city}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>

                {/* Category Filters */}
                <div className="flex items-center gap-4 mb-8 overflow-x-auto pb-2 scrollbar-hide">
                    <div className="flex p-1.5 bg-white rounded-2xl shadow-md border border-gray-100 gap-1">
                        {CATEGORIES.map((cat) => {
                            const Icon = cat.icon
                            const isActive = filter === cat.id
                            return (
                                <button
                                    key={cat.id}
                                    onClick={() => setFilter(cat.id)}
                                    className={`
                                        flex items-center gap-2 px-5 py-2.5 rounded-xl transition-all font-bold text-sm whitespace-nowrap
                                        ${isActive
                                            ? 'bg-primary-600 text-white shadow-lg shadow-primary-200 scale-105'
                                            : 'text-gray-500 hover:bg-gray-50 hover:text-primary-600'
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
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {[1, 2, 3, 4, 5, 6].map((i) => (
                            <div key={i} className="bg-white rounded-3xl shadow-lg p-6 animate-pulse border border-gray-50">
                                <div className="flex justify-between mb-6">
                                    <div className="bg-gray-200 h-16 w-16 rounded-2xl"></div>
                                    <div className="bg-gray-200 h-6 w-24 rounded-full"></div>
                                </div>
                                <div className="bg-gray-200 h-6 w-3/4 rounded-lg mb-4"></div>
                                <div className="grid grid-cols-3 gap-3 mb-6">
                                    <div className="bg-gray-100 h-10 rounded-xl"></div>
                                    <div className="bg-gray-100 h-10 rounded-xl"></div>
                                    <div className="bg-gray-100 h-10 rounded-xl"></div>
                                </div>
                                <div className="bg-gray-200 h-12 rounded-2xl"></div>
                            </div>
                        ))}
                    </div>
                ) : filteredContractors.length === 0 ? (
                    <div className="bg-white rounded-3xl shadow-xl p-16 text-center border border-gray-100">
                        <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
                            <Users className="h-12 w-12 text-gray-300" />
                        </div>
                        <h3 className="text-2xl font-black text-gray-900 mb-2">Không tìm thấy nhà thầu phù hợp</h3>
                        <p className="text-gray-500 mb-8 max-w-md mx-auto">Thử điều chỉnh bộ lọc hoặc tìm kiếm theo từ khóa khác</p>
                        <button
                            onClick={() => { setFilter('all'); setCityFilter('Toàn quốc'); setSearchTerm(''); }}
                            className="inline-flex items-center gap-2 px-8 py-3.5 bg-primary-600 text-white font-black rounded-2xl hover:bg-primary-700 transition-all shadow-lg shadow-primary-100"
                        >
                            Thiết lập lại bộ lọc
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {filteredContractors.map((c) => (
                            <ContractorCard
                                key={c.id}
                                contractor={c}
                                onFavorite={() => setShowLoginModal(true)}
                                onCompare={() => toggleCompare(c)}
                                isComparing={compareList.some(item => item.id === c.id)}
                            />
                        ))}
                    </div>
                )}

                {/* Bottom Registration Section */}
                <div className="mt-16 bg-white rounded-[40px] shadow-2xl border border-gray-100 p-10 md:p-16 text-center relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-primary-50 rounded-full -translate-y-1/2 translate-x-1/2 opacity-50 group-hover:scale-110 transition-transform duration-700"></div>
                    <div className="absolute bottom-0 left-0 w-48 h-48 bg-secondary-50 rounded-full translate-y-1/2 -translate-x-1/2 opacity-50 group-hover:scale-110 transition-transform duration-700"></div>

                    <div className="relative z-10">
                        <BadgeCheck className="w-16 h-16 text-primary-600 mx-auto mb-6" />
                        <h2 className="text-3xl md:text-4xl font-black text-gray-900 mb-6">Bạn là nhà thầu chuyên nghiệp?</h2>
                        <p className="text-gray-600 text-lg mb-10 max-w-2xl mx-auto leading-relaxed font-medium">
                            Gia nhập <strong>SmartBuild Elite</strong> để tiếp cận hàng ngàn dự án tiềm năng và nhận hỗ trợ tài chính đặc biệt cho đối tác chiến lược.
                        </p>
                        <div className="flex flex-wrap justify-center gap-4">
                            <Link href="/contractor/login" className="inline-flex items-center gap-3 px-10 py-4 bg-primary-600 text-white font-black rounded-2xl hover:bg-primary-700 transition-all shadow-xl shadow-primary-100 hover:-translate-y-1">
                                Đăng ký đối tác ngay
                                <ArrowRight className="w-5 h-5" />
                            </Link>
                            <Link href="/contact" className="inline-flex items-center gap-3 px-10 py-4 bg-white text-gray-700 font-black rounded-2xl border-2 border-gray-100 hover:border-primary-600 hover:text-primary-600 transition-all hover:-translate-y-1">
                                Tìm hiểu thêm
                            </Link>
                        </div>
                    </div>
                </div>
            </div>

            {/* Feature 7: Comparison Bar */}
            {compareList.length > 0 && (
                <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[60] w-full max-w-4xl px-4 animate-in slide-in-from-bottom duration-500">
                    <div className="bg-blue-600/90 backdrop-blur-xl rounded-[32px] p-4 flex items-center justify-between shadow-2xl border border-blue-500">
                        <div className="flex items-center gap-4">
                            <div className="hidden sm:flex items-center justify-center w-12 h-12 bg-primary-600 rounded-2xl text-white">
                                <Scale className="w-6 h-6" />
                            </div>
                            <div>
                                <h4 className="text-white font-black text-sm sm:text-base">So sánh nhà thầu</h4>
                                <p className="text-blue-200 text-[10px] sm:text-xs">Đang chọn {compareList.length}/3 đối tác</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <div className="flex -space-x-3">
                                {compareList.map(c => (
                                    <div key={c.id} className="w-10 h-10 rounded-full border-2 border-blue-600 bg-white flex items-center justify-center text-xs font-black text-primary-600 shadow-lg">
                                        {c.displayName[0]}
                                    </div>
                                ))}
                                {[...Array(3 - compareList.length)].map((_, i) => (
                                    <div key={i} className="w-10 h-10 rounded-full border-2 border-blue-600 bg-blue-500 flex items-center justify-center text-blue-300 text-xs italic">
                                        +
                                    </div>
                                ))}
                            </div>

                            <div className="flex gap-2">
                                <button
                                    onClick={() => setCompareList([])}
                                    className="px-4 py-2 text-blue-200 hover:text-white font-black text-xs transition-colors"
                                >
                                    Xóa hết
                                </button>
                                <Link
                                    href={`/contractors/compare?ids=${compareList.map(c => c.id).join(',')}`}
                                    className="px-6 py-2 bg-primary-600 text-white font-black rounded-xl hover:bg-primary-500 transition-all text-xs flex items-center gap-2"
                                >
                                    So sánh ngay
                                    <ArrowRight className="w-4 h-4" />
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Login Modal */}
            {showLoginModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
                    <div className="bg-white rounded-[40px] shadow-2xl max-w-md w-full p-8 sm:p-12 animate-in fade-in zoom-in duration-300 relative">
                        <button
                            onClick={() => setShowLoginModal(false)}
                            className="absolute top-6 right-6 p-2 text-gray-400 hover:text-gray-900 rounded-full hover:bg-gray-100 transition-all"
                        >
                            <X className="w-5 h-5" />
                        </button>

                        <div className="text-center mb-10">
                            <div className="w-20 h-20 bg-red-50 rounded-[32px] flex items-center justify-center mx-auto mb-6">
                                <Heart className="w-10 h-10 text-red-500 fill-red-500" />
                            </div>
                            <h3 className="text-2xl font-black text-gray-900 mb-3">Đăng nhập để lưu đối tác</h3>
                            <p className="text-gray-500 font-medium">
                                Hãy đăng nhập để lưu danh sách nhà thầu yêu thích và nhận thông báo về dự án mới nhất.
                            </p>
                        </div>

                        <div className="space-y-4">
                            <Link
                                href="/login"
                                className="w-full py-4 bg-primary-600 text-white font-black rounded-2xl hover:bg-primary-700 transition-all flex items-center justify-center gap-3 shadow-xl shadow-primary-100"
                            >
                                Đăng nhập ngay
                                <ArrowRight className="w-5 h-5" />
                            </Link>
                            <div className="text-center">
                                <p className="text-sm text-gray-400 font-bold">
                                    Chưa có tài khoản?{' '}
                                    <Link href="/register" className="text-primary-600 font-black hover:underline underline-offset-4">
                                        Đăng ký ngay
                                    </Link>
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

function ContractorCard({ contractor, onFavorite, onCompare, isComparing }: any) {
    // Feature 5 & 6: Badge logic
    const isTopRated = (contractor.avgRating || 0) >= 4.8
    const isExpert = (contractor.experienceYears || 0) >= 10
    const isAvailable = contractor.isAvailable !== false

    return (
        <div className={`bg-white rounded-[32px] shadow-lg border-2 transition-all duration-500 overflow-hidden group/card relative ${isComparing ? 'border-primary-600 ring-4 ring-primary-50' : 'border-gray-50 hover:border-primary-100 hover:-translate-y-1 hover:shadow-2xl'}`}>
            <div className="p-6">
                {/* Header: Verified & Favorite */}
                <div className="flex items-center justify-between mb-5">
                    <div className="flex flex-wrap gap-1.5">
                        <div className="flex items-center gap-1 px-2 py-1 bg-emerald-50 text-emerald-600 rounded-lg text-[9px] font-black uppercase tracking-widest border border-emerald-100">
                            <ShieldCheck className="w-3 h-3" />
                            Đã xác thực
                        </div>
                        {isAvailable ? (
                            <div className="flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-600 rounded-lg text-[9px] font-black uppercase tracking-widest border border-blue-100">
                                <div className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-pulse"></div>
                                Sẵn sàng
                            </div>
                        ) : (
                            <div className="flex items-center gap-1 px-2 py-1 bg-gray-50 text-gray-400 rounded-lg text-[9px] font-black uppercase tracking-widest border border-gray-100">
                                Đang bận
                            </div>
                        )}
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={(e) => { e.preventDefault(); onCompare(); }}
                            className={`p-2 rounded-xl transition-all ${isComparing ? 'bg-primary-600 text-white shadow-lg' : 'bg-gray-50 text-gray-400 hover:text-primary-600 hover:bg-primary-50'}`}
                        >
                            <Scale className="w-4 h-4" />
                        </button>
                        <button
                            onClick={(e) => { e.preventDefault(); onFavorite(); }}
                            className="p-2 bg-gray-50 text-gray-400 rounded-xl hover:text-red-500 hover:bg-red-50 transition-all"
                        >
                            <Heart className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                {/* Avatar & Professional Title */}
                <div className="flex items-center gap-4 mb-5">
                    <div className="relative shrink-0">
                        <div className="w-16 h-16 bg-gradient-to-br from-primary-600 to-indigo-600 rounded-2xl flex items-center justify-center text-2xl font-black text-white shadow-lg group-hover/card:scale-105 transition-transform duration-500 relative z-10">
                            {contractor.displayName?.charAt(0) || 'N'}
                        </div>
                        {isTopRated && (
                            <div className="absolute -top-2 -right-2 w-7 h-7 bg-amber-500 text-white rounded-full flex items-center justify-center border-2 border-white z-20 shadow-lg">
                                <Trophy className="w-3.5 h-3.5" />
                            </div>
                        )}
                    </div>
                    <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-black text-gray-900 truncate mb-0.5 group-hover/card:text-blue-600 transition-colors">
                            {contractor.displayName}
                        </h3>
                        <p className="text-xs text-gray-400 font-bold truncate flex items-center gap-1">
                            <Building2 className="w-3.5 h-3.5" />
                            {contractor.companyName || 'Đối tác chiến lược'}
                        </p>
                    </div>
                </div>

                {/* Performance Stats */}
                <div className="grid grid-cols-3 gap-2 mb-5">
                    <StatBox label="Đánh giá" val={contractor.avgRating || 0} icon={<Star className="w-3 h-3 fill-current text-amber-500" />} />
                    <StatBox label="Kinh nghiệm" val={`${contractor.experienceYears || 0}n`} icon={<Clock className="w-3 h-3 text-blue-500" />} />
                    <StatBox label="Dự án" val={contractor.totalProjectsCompleted || 0} icon={<CheckCircle2 className="w-3 h-3 text-emerald-500" />} />
                </div>

                {/* Skills/Specialties */}
                <div className="flex flex-wrap gap-1.5 mb-5">
                    {contractor.skills?.slice(0, 3).map((skill: string) => (
                        <span key={skill} className="px-2.5 py-1 bg-gray-50 text-gray-600 rounded-lg text-[10px] font-bold border border-gray-100">
                            {skill}
                        </span>
                    ))}
                </div>

                {/* Trust Badges - Feature 5 */}
                {(isTopRated || isExpert) && (
                    <div className="flex gap-2 mb-5 pt-4 border-t border-gray-50 overflow-x-auto scrollbar-hide">
                        {isTopRated && <TrustBadge label="Đối tác Tin cậy" icon={<BadgeCheck className="w-3.5 h-3.5" />} color="bg-amber-50 text-amber-700 border-amber-100" />}
                        {isExpert && <TrustBadge label="Chuyên gia Bậc thầy" icon={<Trophy className="w-3.5 h-3.5" />} color="bg-purple-50 text-purple-700 border-purple-100" />}
                        <TrustBadge label="Đúng tiến độ" icon={<Clock className="w-3.5 h-3.5" />} color="bg-blue-50 text-blue-700 border-blue-100" />
                    </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-2 mt-auto">
                    <Link
                        href={`/contractors/${contractor.id}`}
                        className="flex-1 bg-blue-600 text-white py-3 rounded-[14px] font-black text-xs text-center shadow-lg hover:bg-blue-700 transition-all hover:shadow-xl hover:-translate-y-0.5 flex items-center justify-center gap-2"
                    >
                        Chi tiết hồ sơ
                        <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                    <Link
                        href={`/contact?contractor=${contractor.displayName}`}
                        className="p-3 bg-white text-gray-500 font-bold rounded-[14px] border border-gray-200 hover:border-blue-600 hover:text-blue-600 transition-all"
                    >
                        <MessageSquare className="w-4 h-4" />
                    </Link>
                </div>
            </div>
        </div>
    )
}

function StatBox({ label, val, icon }: { label: string, val: string | number, icon: any }) {
    return (
        <div className="bg-slate-50/50 p-3 rounded-2xl border border-gray-50 text-center">
            <div className="flex items-center justify-center gap-1.5 mb-1">
                {icon}
                <span className="text-sm font-black text-gray-900">{val}</span>
            </div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{label}</p>
        </div>
    )
}

function TrustBadge({ label, icon, color }: { label: string, icon: any, color: string }) {
    return (
        <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider border whitespace-nowrap ${color}`}>
            {icon}
            {label}
        </div>
    )
}
