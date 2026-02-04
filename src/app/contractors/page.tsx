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
        <div className="min-h-screen bg-slate-50 pb-24 selection:bg-primary-100 selection:text-primary-900">
            <Toaster position="top-right" />
            <Header />

            {/* 🚀 PREMIUM HERO SECTION: The "Awe" Factor */}
            <div className="relative pt-24 pb-56 overflow-hidden bg-slate-950">
                {/* Advanced Mesh Gradient Background */}
                <div className="absolute inset-0 z-0">
                    <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_20%_30%,#1e3a8a_0%,transparent_50%),radial-gradient(circle_at_80%_20%,#312e81_0%,transparent_50%),radial-gradient(circle_at_50%_80%,#164e63_0%,transparent_50%)] opacity-80"></div>
                </div>

                {/* High-Tech Blueprint Overlay */}
                <div className="absolute inset-0 opacity-[0.05] pointer-events-none z-[1]" style={{ backgroundImage: `linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)`, backgroundSize: '50px 50px' }}></div>

                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                    <div className="flex flex-col lg:flex-row items-center justify-between gap-16">
                        <div className="max-w-3xl lg:text-left text-center">
                            <div className="inline-flex items-center gap-3 px-5 py-2 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-300 mb-10 animate-fade-in-up backdrop-blur-md">
                                <ShieldCheck className="w-4 h-4" />
                                <span className="text-[10px] font-black uppercase tracking-[0.4em]">Đối tác tin cậy - Vững xây tương lai</span>
                            </div>

                            <h1 className="text-6xl md:text-8xl font-black text-white mb-8 tracking-tight leading-[1.2] animate-fade-in-up delay-100 uppercase">
                                Vươn Tầm <br />
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-cyan-200 to-blue-500 italic pr-4">Kiến Trúc</span>
                            </h1>

                            <p className="text-xl text-slate-300 font-medium leading-relaxed max-w-2xl mb-12 animate-fade-in-up delay-200 mx-auto lg:mx-0">
                                Đồng hành cùng những chuyên gia hàng đầu để biến ý tưởng thành hiện thực. Chúng tôi xác thực năng lực, bạn sở hữu những <span className="text-white font-bold border-b-2 border-blue-500">không gian đẳng cấp</span>.
                            </p>

                            {/* 🔎 UNIFIED SEARCH COMMANDER: DARK MODE EDITION */}
                            <div className="relative max-w-3xl animate-fade-in-up delay-300">
                                <div className="bg-white p-2 rounded-[32px] shadow-[0_32px_80px_rgba(0,0,0,0.5)] flex flex-col md:flex-row items-center gap-2">
                                    <div className="flex-1 flex items-center px-6 w-full">
                                        <Search className="w-5 h-5 text-blue-600 mr-4" />
                                        <input
                                            type="text"
                                            placeholder="Bạn đang cần tìm nhà thầu trong lĩnh vực gì?"
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                            className="w-full py-5 bg-transparent font-bold text-slate-800 outline-none placeholder:text-slate-400"
                                        />
                                    </div>
                                    <div className="h-10 w-[1px] bg-slate-100 hidden md:block"></div>
                                    <div className="w-full md:w-56 flex items-center px-6">
                                        <MapPin className="w-5 h-5 text-blue-600 mr-4" />
                                        <select
                                            value={cityFilter}
                                            onChange={(e) => setCityFilter(e.target.value)}
                                            className="w-full py-5 bg-transparent font-black text-slate-800 outline-none appearance-none cursor-pointer"
                                        >
                                            {CITIES.map(city => <option key={city} value={city}>{city}</option>)}
                                        </select>
                                    </div>
                                    <button className="w-full md:w-auto px-12 py-5 bg-blue-600 font-black text-white rounded-[24px] hover:bg-blue-500 transition-all shadow-xl shadow-blue-500/20 active:scale-95 uppercase tracking-widest text-xs">
                                        TÌM KIẾM
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Visual 3D Card Mockup */}
                        <div className="hidden lg:block relative w-full max-w-md perspective-1000">
                            <div className="relative transform rotate-y-6 rotate-x-6 bg-white/5 backdrop-blur-2xl p-1 rounded-[40px] border border-white/10 shadow-2xl animate-float">
                                <div className="bg-slate-900/40 rounded-[38px] p-8 overflow-hidden relative">
                                    <div className="flex flex-col gap-10">
                                        <div className="flex items-center gap-5">
                                            <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/20">
                                                <Trophy className="w-8 h-8 text-white" />
                                            </div>
                                            <div className="space-y-3">
                                                <div className="h-4 w-32 bg-white/20 rounded-full"></div>
                                                <div className="h-3 w-20 bg-white/10 rounded-full"></div>
                                            </div>
                                        </div>
                                        <div className="space-y-4">
                                            <div className="h-2 w-full bg-white/5 rounded-full"></div>
                                            <div className="h-2 w-4/5 bg-white/5 rounded-full"></div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="bg-white/5 p-4 rounded-2xl border border-white/5 text-center">
                                                <div className="text-xl font-bold text-blue-400">4.9/5</div>
                                                <div className="text-[8px] text-slate-400 uppercase font-black">Xếp hạng</div>
                                            </div>
                                            <div className="bg-white/5 p-4 rounded-2xl border border-white/5 text-center">
                                                <div className="text-xl font-bold text-cyan-400">12+</div>
                                                <div className="text-[8px] text-slate-400 uppercase font-black">Năm kinh nghiệm</div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Smooth Section Divider Bridge */}
                <div className="absolute bottom-0 left-0 w-full h-32 bg-gradient-to-t from-slate-50 to-transparent z-[5]"></div>
                <div className="absolute bottom-0 left-0 w-full overflow-hidden leading-[0] z-[6]">
                    <svg className="relative block w-full h-[60px]" viewBox="0 0 1200 120" preserveAspectRatio="none">
                        <path d="M321.39,56.44c125-9.33,260.67-17.33,485.39,15.17c224.72,32.5,302.44,19.33,403.22,1.33V120H0V95.33C0,95.33,196.39,65.77,321.39,56.44z" className="fill-slate-50"></path>
                    </svg>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-24 relative z-20">
                {/* 🏷️ BALANCED FILTER & SORT BAR */}
                <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-16 px-4 py-4 bg-white/80 backdrop-blur-2xl rounded-[32px] border border-white shadow-[0_20px_50px_rgba(0,0,0,0.05)]">
                    <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar max-w-full">
                        {CATEGORIES.map((cat) => (
                            <button
                                key={cat.id}
                                onClick={() => setFilter(cat.id)}
                                className={`flex items-center gap-2 px-6 py-3 rounded-[14px] text-xs font-black whitespace-nowrap transition-all duration-300 ${filter === cat.id ? 'bg-white text-blue-600 shadow-sm border border-slate-200/50 scale-105' : 'text-slate-400 hover:text-slate-600 hover:bg-white/50'}`}
                            >
                                <cat.icon className="w-4 h-4" />
                                {cat.name.toUpperCase()}
                            </button>
                        ))}
                    </div>

                    <div className="flex items-center gap-4 px-6 py-3 bg-white rounded-2xl border border-slate-100 shadow-sm group">
                        <div className="flex items-center gap-3">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-r border-slate-100 pr-4">Sắp xếp theo</span>
                            <div className="flex items-center gap-2">
                                <select className="bg-transparent text-xs font-black text-slate-900 outline-none cursor-pointer appearance-none pr-6 relative">
                                    <option>Nổi bật nhất</option>
                                    <option>Đánh giá khách hàng</option>
                                    <option>Kinh nghiệm lâu năm</option>
                                    <option>Nhiều dự án nhất</option>
                                </select>
                                <Filter className="w-4 h-4 text-slate-400 transition-colors group-hover:text-blue-600" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* 📉 SEARCH METRICS */}
                <div className="flex items-center justify-between mb-8 px-2">
                    <h2 className="text-sm font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-3">
                        Kết quả hiển thị
                        <span className="w-8 h-[1px] bg-slate-200"></span>
                        <span className="text-slate-900">{filteredContractors.length} đối tác</span>
                    </h2>
                </div>

                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {[1, 2, 3, 4, 5, 6].map((i) => (
                            <div key={i} className="bg-white rounded-[32px] shadow-sm p-8 animate-pulse border border-slate-100 h-96"></div>
                        ))}
                    </div>
                ) : filteredContractors.length === 0 ? (
                    <div className="bg-white rounded-[40px] py-20 text-center border-2 border-dashed border-slate-200">
                        <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
                            <Users className="h-10 w-10 text-slate-300" />
                        </div>
                        <h3 className="text-2xl font-black text-slate-900 mb-2">Không tìm thấy nhà thầu</h3>
                        <p className="text-slate-500 font-medium mb-8">Thử thay đổi từ khóa hoặc khu vực tìm kiếm của bạn</p>
                        <button
                            onClick={() => { setFilter('all'); setCityFilter('Toàn quốc'); setSearchTerm(''); }}
                            className="px-8 py-4 bg-blue-600 text-white font-black rounded-2xl hover:bg-blue-700 transition-all uppercase text-xs tracking-widest shadow-xl shadow-blue-100"
                        >
                            Đặt lại bộ lọc
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
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

                {/* Registration CTA - Modernized */}
                <div className="mt-24 relative rounded-[48px] overflow-hidden bg-white shadow-[0_40px_100px_rgba(0,0,0,0.08)] border border-slate-100">
                    <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-50/50 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
                    <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-indigo-50/50 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2"></div>

                    <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-12 p-12 md:p-20 items-center">
                        <div>
                            <div className="w-16 h-16 bg-blue-600 text-white rounded-[24px] flex items-center justify-center mb-8 shadow-xl shadow-blue-100">
                                <Trophy className="w-8 h-8" />
                            </div>
                            <h2 className="text-4xl md:text-5xl font-black text-slate-900 mb-6 leading-tight">
                                Trở thành đối tác <br /><span className="text-blue-600">SmartBuild Elite</span>
                            </h2>
                            <p className="text-slate-500 text-lg font-medium leading-relaxed mb-10">
                                Cam kết cung cấp dự án ổn định, hỗ trợ vật tư ưu đãi và giải pháp quản lý thi công chuyên nghiệp cho các nhà thầu xuất sắc.
                            </p>
                            <div className="flex flex-wrap gap-4">
                                <Link href="/contractor/login" className="inline-flex items-center gap-3 px-10 py-5 bg-blue-600 text-white font-black rounded-[24px] hover:bg-blue-700 transition-all shadow-2xl shadow-blue-200 group">
                                    ĐĂNG KÝ NGAY
                                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                </Link>
                                <Link href="/contact" className="inline-flex items-center gap-3 px-10 py-5 bg-white text-blue-600 font-black rounded-[24px] border-2 border-blue-50 hover:bg-blue-50 transition-all">
                                    LIÊN HỆ TƯ VẤN
                                </Link>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            {[
                                { label: 'Dự án mới mỗi ngày', icon: Building2, color: 'text-blue-600', bg: 'bg-blue-50' },
                                { label: 'Thanh toán minh bạch', icon: Calculator, color: 'text-emerald-600', bg: 'bg-emerald-50' },
                                { label: 'Hỗ trợ vật tư 24/7', icon: Truck, color: 'text-amber-600', bg: 'bg-amber-50' },
                                { label: 'Quản lý thông minh', icon: BadgeCheck, color: 'text-indigo-600', bg: 'bg-indigo-50' },
                            ].map((item, i) => (
                                <div key={i} className="bg-slate-50/50 p-6 rounded-[32px] border border-slate-100 hover:bg-white hover:shadow-xl hover:shadow-slate-100/50 transition-all duration-300">
                                    <div className={`${item.bg} ${item.color} w-12 h-12 rounded-2xl flex items-center justify-center mb-4`}>
                                        <item.icon className="w-6 h-6" />
                                    </div>
                                    <p className="font-bold text-slate-900 text-sm">{item.label}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Comparison Float Bar - Improved Bright Style */}
            {compareList.length > 0 && (
                <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[60] w-full max-w-2xl px-4">
                    <div className="bg-white/90 backdrop-blur-2xl rounded-[32px] p-2 pl-6 flex items-center justify-between shadow-[0_20px_50px_rgba(0,0,0,0.1)] border border-white">
                        <div className="flex items-center gap-4">
                            <span className="text-slate-400 font-black text-xs uppercase tracking-widest hidden sm:block">Đang chọn</span>
                            <div className="flex -space-x-3">
                                {compareList.map(c => (
                                    <div key={c.id} className="w-10 h-10 rounded-full border-2 border-white bg-blue-600 flex items-center justify-center text-xs font-black text-white shadow-lg relative group">
                                        {c.displayName[0]}
                                        <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-slate-900 text-white px-3 py-1.5 rounded-lg text-[10px] font-black opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none shadow-xl">
                                            {c.displayName}
                                        </div>
                                    </div>
                                ))}
                                {Array.from({ length: 3 - compareList.length }).map((_, i) => (
                                    <div key={i} className="w-10 h-10 rounded-full border-2 border-white bg-slate-50 flex items-center justify-center text-slate-300 text-xs border-dashed">
                                        +
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="flex gap-2">
                            <Link
                                href={`/contractors/compare?ids=${compareList.map(c => c.id).join(',')}`}
                                className="px-8 py-3 bg-blue-600 text-white font-black rounded-[24px] hover:bg-blue-500 transition-all text-xs flex items-center gap-2 shadow-lg shadow-blue-200"
                            >
                                SO SÁNH NGAY
                                <ArrowRight className="w-4 h-4" />
                            </Link>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal Components */}
            <LoginIncentiveModal
                isOpen={showLoginModal}
                onClose={() => setShowLoginModal(false)}
                feature="general"
                title="Lưu Hồ Sơ Nhà Thầu"
                description="Đăng nhập để lưu danh sách đối tác yêu thích, so sánh hồ sơ và nhận thông báo khi có dự án mới."
            />

            {showChatModal && <ChatModal onClose={() => setShowChatModal(false)} onSubmit={handleGuestSubmit} contact={guestContact} setContact={setGuestContact} />}
        </div>
    )
}

// Sub-components for better organization
// 🏗️ MODERN BENTO CONTRACTOR CARD
function ContractorCard({ contractor, onFavorite, onChat, onCompare, isComparing }: any) {
    const isTopRated = (contractor.avgRating || 0) >= 4.8
    const isAvailable = contractor.isAvailable !== false

    return (
        <div className={`group relative bg-white rounded-[32px] transition-all duration-500 flex flex-col h-full border ${isComparing ? 'border-blue-600 shadow-[0_0_0_4px_rgba(37,99,235,0.1)]' : 'border-slate-100/80 hover:border-blue-200 hover:shadow-[0_40px_100px_-20px_rgba(0,0,0,0.06)]'}`}>
            {/* Top Interactive Row */}
            <div className="p-6 flex items-center justify-between">
                <div className="flex gap-2">
                    {isTopRated && (
                        <div className="flex items-center gap-1.5 px-3 py-1 bg-amber-50 text-amber-600 rounded-full text-[9px] font-black uppercase tracking-wider border border-amber-100">
                            <Trophy className="w-2.5 h-2.5" />
                            DẪN ĐẦU
                        </div>
                    )}
                    {isAvailable && (
                        <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full text-[9px] font-black uppercase tracking-wider border border-emerald-100">
                            <div className="w-1 h-1 bg-emerald-500 rounded-full animate-pulse"></div>
                            SẮN SÀNG
                        </div>
                    )}
                </div>
                <div className="flex gap-2 translate-x-2">
                    <button
                        onClick={(e) => { e.preventDefault(); onCompare(); }}
                        className={`p-2.5 rounded-xl transition-all ${isComparing ? 'bg-blue-600 text-white' : 'bg-slate-50 text-slate-400 hover:text-blue-600 hover:bg-blue-50'}`}
                    >
                        <Scale className="w-4 h-4" />
                    </button>
                    <button
                        onClick={(e) => { e.preventDefault(); onFavorite(); }}
                        className="p-2.5 bg-slate-50 text-slate-400 rounded-xl hover:text-red-500 hover:bg-red-50 transition-all"
                    >
                        <Heart className="w-4 h-4" />
                    </button>
                </div>
            </div>

            <div className="px-6 pb-6 flex-1 flex flex-col">
                {/* Main Identity */}
                <div className="flex items-start gap-4 mb-8">
                    <div className="relative shrink-0">
                        <div className="w-20 h-20 rounded-[28px] bg-slate-100 flex items-center justify-center text-2xl font-black text-slate-900 border-2 border-white shadow-sm transition-transform duration-500 group-hover:scale-105 group-hover:rotate-2">
                            {contractor.displayName?.charAt(0) || 'N'}
                        </div>
                        <div className="absolute -bottom-1.5 -right-1.5 bg-white p-1 rounded-full shadow-md">
                            <ShieldCheck className="w-5 h-5 text-blue-600" />
                        </div>
                    </div>
                    <div className="flex-1 min-w-0 pt-2">
                        <h3 className="text-lg font-black text-slate-900 mb-1 leading-tight group-hover:text-blue-600 transition-colors">
                            {contractor.displayName}
                        </h3>
                        <p className="text-xs font-bold text-slate-400 truncate flex items-center gap-1.5">
                            <Building2 className="w-3.5 h-3.5" />
                            {contractor.companyName || 'Đối tác chiến lược'}
                        </p>
                    </div>
                </div>

                {/* Performance Bento */}
                <div className="grid grid-cols-3 gap-2 p-1.5 bg-slate-50/50 rounded-2xl mb-8 border border-slate-100/50">
                    <div className="bg-white py-3 rounded-[14px] text-center shadow-sm">
                        <div className="flex items-center justify-center gap-1 mb-0.5">
                            <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                            <span className="text-xs font-black text-slate-900">{contractor.avgRating || '5.0'}</span>
                        </div>
                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Đánh giá</p>
                    </div>
                    <div className="py-3 text-center">
                        <span className="text-xs font-black text-slate-900 block mb-0.5">{contractor.experienceYears || '0'}</span>
                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Năm KN</p>
                    </div>
                    <div className="py-3 text-center">
                        <span className="text-xs font-black text-slate-900 block mb-0.5">{contractor.totalProjectsCompleted || '0'}</span>
                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Dự án</p>
                    </div>
                </div>

                {/* Skills Cloud */}
                <div className="flex flex-wrap gap-1.5 mb-8">
                    {(contractor.skills || []).slice(0, 3).map((skill: string) => (
                        <span key={skill} className="px-3 py-1 bg-white text-slate-500 rounded-lg text-[10px] font-bold border border-slate-100">
                            {skill}
                        </span>
                    ))}
                    {(contractor.skills?.length > 3) && (
                        <span className="px-2 py-1 text-[10px] font-bold text-slate-400">+{contractor.skills.length - 3}</span>
                    )}
                </div>

                {/* Final CTA Area */}
                <div className="mt-auto flex gap-2 pt-4 border-t border-slate-50/80">
                    <Link
                        href={`/contractors/${contractor.id}`}
                        className="flex-1 bg-blue-600 text-white py-4 rounded-2xl font-black text-[10px] uppercase tracking-[0.1em] text-center shadow-lg shadow-blue-100 hover:bg-blue-700 hover:shadow-blue-200 transition-all active:scale-95 flex items-center justify-center gap-2"
                    >
                        Hồ sơ chi tiết
                        <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                    <button
                        onClick={(e) => { e.preventDefault(); onChat(); }}
                        className="px-5 bg-white text-slate-400 border border-slate-100 rounded-2xl hover:text-blue-600 hover:border-blue-200 hover:bg-blue-50 transition-all"
                    >
                        <MessageSquare className="w-5 h-5" />
                    </button>
                </div>
            </div>
        </div>
    )
}

function ChatModal({ onClose, onSubmit, contact, setContact }: any) {
    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md animate-fade-in">
            <div className="bg-white rounded-[40px] shadow-2xl max-w-lg w-full p-10 relative overflow-hidden animate-slide-in">
                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50/50 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2"></div>

                <button onClick={onClose} className="absolute top-8 right-8 p-2 text-slate-400 hover:text-slate-900 rounded-full hover:bg-slate-50 transition-all">
                    <X className="w-6 h-6" />
                </button>

                <div className="text-center mb-10">
                    <div className="w-20 h-20 bg-blue-50 rounded-[28px] flex items-center justify-center mx-auto mb-6 text-blue-600 shadow-inner">
                        <MessageSquare className="w-10 h-10" />
                    </div>
                    <h3 className="text-3xl font-black text-slate-900 mb-3 tracking-tight">Liên hệ nhà thầu</h3>
                    <p className="text-slate-500 font-medium">Để lại lời nhắn, nhà thầu sẽ phản hồi bạn sớm nhất có thể.</p>
                </div>

                <form onSubmit={onSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Họ tên</label>
                            <input
                                required
                                placeholder="Nguyễn Văn A"
                                className="w-full px-5 py-4 bg-slate-50 rounded-2xl border border-slate-100 font-bold text-sm outline-none focus:bg-white focus:border-blue-500 transition-all"
                                value={contact.name}
                                onChange={e => setContact({ ...contact, name: e.target.value })}
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Số điện thoại</label>
                            <input
                                required
                                placeholder="0901 xxx xxx"
                                className="w-full px-5 py-4 bg-slate-50 rounded-2xl border border-slate-100 font-bold text-sm outline-none focus:bg-white focus:border-blue-500 transition-all"
                                value={contact.phone}
                                onChange={e => setContact({ ...contact, phone: e.target.value })}
                            />
                        </div>
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nội dung trao đổi</label>
                        <textarea
                            required
                            placeholder="Mô tả sơ qua về nhu cầu của bạn..."
                            rows={4}
                            className="w-full px-5 py-4 bg-slate-50 rounded-2xl border border-slate-100 font-bold text-sm outline-none focus:bg-white focus:border-blue-500 transition-all resize-none"
                            value={contact.message}
                            onChange={e => setContact({ ...contact, message: e.target.value })}
                        />
                    </div>
                    <button type="submit" className="w-full py-5 bg-blue-600 text-white font-black rounded-3xl hover:bg-blue-700 transition-all shadow-xl shadow-blue-100 uppercase tracking-widest text-xs">
                        GỬI TIN NHẮN NGAY
                    </button>
                </form>

                <div className="mt-8 pt-8 border-t border-slate-50 text-center">
                    <Link href="/login" className="text-xs font-black text-blue-600 hover:text-blue-700 uppercase tracking-widest">
                        ĐÃ CÓ TÀI KHOẢN? ĐĂNG NHẬP ĐỂ CHAT TRỰC TIẾP
                    </Link>
                </div>
            </div>
        </div>
    )
}

function Truck(props: any) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2" />
            <path d="M15 18H9" />
            <path d="M19 18h2a1 1 0 0 0 1-1v-5h-7v7" />
            <path d="M16 8h4l3 3v2h-7V8z" />
            <circle cx="7.5" cy="18.5" r="2.5" />
            <circle cx="17.5" cy="18.5" r="2.5" />
        </svg>
    )
}

