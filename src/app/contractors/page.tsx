'use client'

/**
 * Public Contractor Marketplace - Enhanced with 7 Premium Features
 */

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
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
import LoginIncentiveModal from '@/components/LoginIncentiveModal'

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

    // Chat Feature
    const [showChatModal, setShowChatModal] = useState(false)
    const [guestContact, setGuestContact] = useState({ name: '', phone: '', message: '' })
    const [chatContractorId, setChatContractorId] = useState<string | null>(null)
    const router = useRouter()

    const handleChatClick = (id: string) => {
        const token = typeof window !== 'undefined' ? (localStorage.getItem('access_token') || sessionStorage.getItem('access_token')) : null

        if (token) {
            router.push(`/messages?partnerId=${id}`)
        } else {
            setChatContractorId(id)
            setShowChatModal(true)
        }
    }

    const handleGuestSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!guestContact.name || !guestContact.phone || !chatContractorId) return

        try {
            // Find contractor name
            const contractor = contractors.find(c => c.id === chatContractorId)

            // Generate or get guest ID
            let guestId = localStorage.getItem('user_id')
            if (!guestId || !guestId.startsWith('guest_')) {
                guestId = 'guest_' + Math.random().toString(36).substr(2, 9)
                localStorage.setItem('user_id', guestId)
            }
            localStorage.setItem('user_name', guestContact.name)
            localStorage.setItem('user_phone', guestContact.phone)

            // Auto-create/ensure conversation exists via API
            const res = await fetch('/api/chat/conversations', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    senderId: guestId,
                    senderName: guestContact.name,
                    recipientId: chatContractorId,
                    recipientName: contractor?.displayName || 'Nhà thầu',
                    initialMessage: guestContact.message || `Tôi quan tâm đến dịch vụ của bạn. SĐT liên hệ: ${guestContact.phone}`
                })
            })

            if (res.ok) {
                toast.success('Đang kết nối với nhà thầu...')
                setShowChatModal(false)
                router.push(`/messages?partnerId=${chatContractorId}`)
            } else {
                toast.error('Không thể khởi tạo cuộc trò chuyện')
            }
        } catch (error) {
            console.error('Guest chat error:', error)
            toast.error('Lỗi hệ thống khi kết nối')
        }
    }

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

                {/* Page Header & Filters */}
                <div className="mb-6">
                    <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 mb-6">
                        <div>
                            <h1 className="text-2xl font-black text-gray-900 mb-1 flex items-center gap-2">
                                <span className="p-1.5 bg-gradient-to-br from-primary-600 to-indigo-600 rounded-lg text-white">
                                    <Users className="w-5 h-5" />
                                </span>
                                MẠNG LƯỚI NHÀ THẦU
                            </h1>
                            <p className="text-[11px] text-gray-500 font-bold uppercase tracking-widest pl-10">
                                KẾT NỐI CHUYÊN GIA - XÂY DỰNG NIỀM TIN
                            </p>
                        </div>
                        <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-wider text-primary-600 bg-white px-3 py-1.5 rounded-lg shadow-sm border border-primary-100">
                            <BadgeCheck className="w-4 h-4" />
                            {filteredContractors.length} Đối tác sẵn sàng
                        </div>
                    </div>

                    {/* Compact Search & Filter Bar */}
                    <div className="grid grid-cols-12 gap-3 mb-6">
                        <div className="col-span-12 md:col-span-5 relative group">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 group-focus-within:text-primary-500 transition-colors" />
                            <input
                                type="text"
                                placeholder="Tìm theo tên, công ty..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-9 pr-3 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-medium focus:ring-1 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all"
                            />
                        </div>
                        <div className="col-span-12 md:col-span-3 relative group">
                            <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 group-focus-within:text-primary-500 transition-colors" />
                            <select
                                value={cityFilter}
                                onChange={(e) => setCityFilter(e.target.value)}
                                className="w-full pl-9 pr-8 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-bold text-gray-700 cursor-pointer focus:ring-1 focus:ring-primary-500 outline-none appearance-none"
                            >
                                {CITIES.map(city => (
                                    <option key={city} value={city}>{city}</option>
                                ))}
                            </select>
                        </div>
                        <div className="col-span-12 md:col-span-4 overflow-x-auto">
                            <div className="flex bg-white p-1 rounded-xl border border-gray-200 gap-1 h-full items-center">
                                {CATEGORIES.slice(0, 4).map((cat) => (
                                    <button
                                        key={cat.id}
                                        onClick={() => setFilter(cat.id)}
                                        className={`flex-1 py-1.5 px-2 rounded-lg text-[10px] font-bold uppercase transition-all whitespace-nowrap text-center ${filter === cat.id ? 'bg-primary-50 text-primary-700 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                                    >
                                        {cat.name}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Contractor Grid - High Density */}
                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                            <div key={i} className="bg-white rounded-2xl shadow-sm p-4 animate-pulse border border-gray-100 h-64"></div>
                        ))}
                    </div>
                ) : filteredContractors.length === 0 ? (
                    <div className="bg-white rounded-2xl shadow py-12 text-center border-2 border-dashed border-gray-200">
                        <Users className="h-10 w-10 text-gray-300 mx-auto mb-4" />
                        <h3 className="font-bold text-gray-900 mb-1">Không tìm thấy nhà thầu</h3>
                        <p className="text-xs text-gray-500 mb-4">Thử điều chỉnh bộ lọc của bạn</p>
                        <button
                            onClick={() => { setFilter('all'); setCityFilter('Toàn quốc'); setSearchTerm(''); }}
                            className="text-xs font-bold text-primary-600 hover:underline"
                        >
                            Xóa bộ lọc
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {filteredContractors.map((c) => (
                            <ContractorCard
                                key={c.id}
                                contractor={c}
                                onFavorite={() => setShowLoginModal(true)}
                                onChat={() => handleChatClick(c.id)}
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

            {/* Login Modal Integration */}
            <LoginIncentiveModal
                isOpen={showLoginModal}
                onClose={() => setShowLoginModal(false)}
                feature="general"
                title="Lưu Hồ Sơ Nhà Thầu"
                description="Đăng nhập để lưu danh sách đối tác yêu thích, so sánh hồ sơ và nhận thông báo khi có dự án mới."
            />

            {/* Chat Modal */}
            {showChatModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
                    <div className="bg-white rounded-[32px] shadow-2xl max-w-lg w-full p-8 animate-in fade-in zoom-in duration-300 relative">
                        <button onClick={() => setShowChatModal(false)} className="absolute top-6 right-6 p-2 text-gray-400 hover:text-gray-900 rounded-full hover:bg-gray-100 transition-all"><X className="w-5 h-5" /></button>

                        <div className="text-center mb-8">
                            <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-4 text-blue-600">
                                <MessageSquare className="w-8 h-8" />
                            </div>
                            <h3 className="text-2xl font-black text-gray-900">Liên hệ nhà thầu</h3>
                            <p className="text-gray-500 mt-2 font-medium">Vui lòng đăng nhập để chat trực tiếp hoặc để lại thông tin.</p>
                        </div>

                        <div className="space-y-6">
                            <Link
                                href="/login"
                                className="w-full py-4 bg-blue-600 text-white font-black rounded-2xl shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all flex items-center justify-center gap-2"
                            >
                                <ArrowRight className="w-5 h-5" />
                                Đăng nhập để Chat ngay
                            </Link>

                            <div className="relative">
                                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-100"></div></div>
                                <div className="relative flex justify-center text-xs uppercase"><span className="bg-white px-2 text-gray-400 font-bold tracking-widest">Hoặc để lại tin nhắn</span></div>
                            </div>

                            <form onSubmit={handleGuestSubmit} className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <input
                                        required
                                        placeholder="Họ tên của bạn"
                                        className="w-full p-3 bg-gray-50 rounded-xl border border-gray-100 font-bold text-sm outline-none focus:border-blue-500"
                                        value={guestContact.name}
                                        onChange={e => setGuestContact({ ...guestContact, name: e.target.value })}
                                    />
                                    <input
                                        required
                                        placeholder="Số điện thoại"
                                        className="w-full p-3 bg-gray-50 rounded-xl border border-gray-100 font-bold text-sm outline-none focus:border-blue-500"
                                        value={guestContact.phone}
                                        onChange={e => setGuestContact({ ...guestContact, phone: e.target.value })}
                                    />
                                </div>
                                <textarea
                                    required
                                    placeholder="Nội dung cần trao đổi..."
                                    rows={3}
                                    className="w-full p-3 bg-gray-50 rounded-xl border border-gray-100 font-bold text-sm outline-none focus:border-blue-500 resize-none"
                                    value={guestContact.message}
                                    onChange={e => setGuestContact({ ...guestContact, message: e.target.value })}
                                />
                                <button type="submit" className="w-full py-3 bg-blue-600 text-white font-black rounded-xl hover:bg-blue-700 transition-all shadow-lg">
                                    Gửi tin nhắn liên hệ
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

function ContractorCard({ contractor, onFavorite, onChat, onCompare, isComparing }: any) {
    const isTopRated = (contractor.avgRating || 0) >= 4.8
    const isAvailable = contractor.isAvailable !== false

    return (
        <div className={`bg-white rounded-2xl shadow-sm border transition-all duration-300 group/card relative flex flex-col ${isComparing ? 'border-primary-500 ring-2 ring-primary-50' : 'border-gray-100 hover:border-primary-200 hover:shadow-lg'}`}>
            <div className="p-4 flex-1">
                {/* Header: Verified & Favorite */}
                <div className="flex items-center justify-between mb-3">
                    <div className="flex flex-wrap gap-1.5">
                        <div className="flex items-center gap-0.5 px-1.5 py-0.5 bg-emerald-50 text-emerald-700 rounded text-[9px] font-black uppercase tracking-tight border border-emerald-100">
                            <ShieldCheck className="w-2.5 h-2.5" />
                            VERIFIED
                        </div>
                        {isAvailable && (
                            <div className="flex items-center gap-0.5 px-1.5 py-0.5 bg-blue-50 text-blue-700 rounded text-[9px] font-black uppercase tracking-tight border border-blue-100">
                                <div className="w-1 h-1 bg-blue-600 rounded-full animate-pulse"></div>
                                OPEN
                            </div>
                        )}
                    </div>
                    <div className="flex items-center gap-1">
                        <button
                            onClick={(e) => { e.preventDefault(); onCompare(); }}
                            className={`p-1.5 rounded-lg transition-all ${isComparing ? 'bg-primary-600 text-white shadow-sm' : 'bg-gray-50 text-gray-400 hover:text-primary-600 hover:bg-primary-50'}`}
                        >
                            <Scale className="w-3.5 h-3.5" />
                        </button>
                        <button
                            onClick={(e) => { e.preventDefault(); onFavorite(); }}
                            className="p-1.5 bg-gray-50 text-gray-400 rounded-lg hover:text-red-500 hover:bg-red-50 transition-all"
                        >
                            <Heart className="w-3.5 h-3.5" />
                        </button>
                    </div>
                </div>

                {/* Avatar & Professional Title */}
                <div className="flex items-start gap-3 mb-4">
                    <div className="relative shrink-0">
                        <div className="w-12 h-12 bg-gradient-to-br from-primary-600 to-indigo-600 rounded-xl flex items-center justify-center text-lg font-black text-white shadow-md">
                            {contractor.displayName?.charAt(0) || 'N'}
                        </div>
                        {isTopRated && (
                            <div className="absolute -top-1 -right-1 w-5 h-5 bg-amber-500 text-white rounded-full flex items-center justify-center border border-white z-20 shadow-sm">
                                <Trophy className="w-2.5 h-2.5" />
                            </div>
                        )}
                    </div>
                    <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-black text-gray-900 truncate mb-0.5 group-hover/card:text-primary-700 transition-colors uppercase tracking-tight">
                            {contractor.displayName}
                        </h3>
                        <p className="text-[10px] text-gray-500 font-bold truncate flex items-center gap-1">
                            <Building2 className="w-3 h-3" />
                            {contractor.companyName || 'Đối tác chiến lược'}
                        </p>
                        <div className="flex flex-wrap gap-1 mt-1.5">
                            {contractor.skills?.slice(0, 2).map((skill: string) => (
                                <span key={skill} className="px-1.5 py-0.5 bg-gray-50 text-gray-600 rounded text-[9px] font-bold border border-gray-100">
                                    {skill}
                                </span>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Performance Stats */}
                <div className="grid grid-cols-3 gap-1.5 mb-4">
                    <div className="bg-gray-50 p-2 rounded-lg text-center border border-gray-100">
                        <div className="flex justify-center items-center gap-1">
                            <Star className="w-3 h-3 text-amber-500 fill-current" />
                            <span className="text-xs font-black text-gray-900">{contractor.avgRating || 0}</span>
                        </div>
                        <p className="text-[9px] text-gray-400 font-bold uppercase">Rating</p>
                    </div>
                    <div className="bg-gray-50 p-2 rounded-lg text-center border border-gray-100">
                        <div className="flex justify-center items-center gap-1">
                            <Clock className="w-3 h-3 text-blue-500" />
                            <span className="text-xs font-black text-gray-900">{contractor.experienceYears || 0}</span>
                        </div>
                        <p className="text-[9px] text-gray-400 font-bold uppercase">Năm KN</p>
                    </div>
                    <div className="bg-gray-50 p-2 rounded-lg text-center border border-gray-100">
                        <div className="flex justify-center items-center gap-1">
                            <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                            <span className="text-xs font-black text-gray-900">{contractor.totalProjectsCompleted || 0}</span>
                        </div>
                        <p className="text-[9px] text-gray-400 font-bold uppercase">Dự án</p>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2 mt-auto">
                    <Link
                        href={`/contractors/${contractor.id}`}
                        className="flex-1 bg-primary-600 hover:bg-primary-700 text-white py-2 rounded-lg font-black text-[10px] uppercase text-center shadow-sm transition-all flex items-center justify-center gap-1.5"
                    >
                        HỒ SƠ
                        <ArrowRight className="w-3 h-3" />
                    </Link>
                    <button
                        onClick={(e) => { e.preventDefault(); onChat(); }}
                        className="p-2 bg-white text-gray-400 font-bold rounded-lg border border-gray-200 hover:border-blue-600 hover:text-blue-600 transition-all"
                    >
                        <MessageSquare className="w-3.5 h-3.5" />
                    </button>
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
