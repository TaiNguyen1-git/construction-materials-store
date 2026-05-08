'use client'

/**
 * Public Contractor Marketplace - Premium Master-Detail Layout
 */

import { useState, useEffect, Suspense, use } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import {
    Users, MapPin, Star, ShieldCheck,
    Search, ArrowRight, ArrowLeft,
    Briefcase, Wrench, Paintbrush,
    Zap, HardHat, Building2,
    Heart, CheckCircle2, X, Filter,
    Scale, AlertCircle, Check,
    Clock, Trophy, BadgeCheck,
    MessageSquare, Calculator, Camera,
    ArrowUpRight, Phone, Mail, Info
} from 'lucide-react'
import { encodeId } from '@/lib/id-utils'
import toast, { Toaster } from 'react-hot-toast'
import Header from '@/components/Header'
import LoginIncentiveModal from '@/components/LoginIncentiveModal'

const SKILL_MAP: Record<string, string> = {
    'all': 'Tất cả',
    'rough_construction': 'Xây thô',
    'mep': 'Điện nước',
    'painting': 'Sơn bả',
    'interior': 'Nội thất',
    'repair': 'Sửa chữa',
    'flooring': 'Lát nền',
    'tiling': 'Ốp lát',
    'roofing': 'Làm mái',
    'renovation': 'Cải tạo',
    'plumbing': 'Điện nước',
    'electrical': 'Hệ thống điện',
    'landscaping': 'Cảnh quan'
}

const getSkillName = (skill: string | null | undefined) => {
    if (!skill) return 'Chuyên gia'
    const normalizedSkill = skill.toLowerCase()
    if (SKILL_MAP[normalizedSkill]) return SKILL_MAP[normalizedSkill]
    return skill
}

const CATEGORIES = [
    { id: 'all', name: 'Tất cả', icon: Users },
    { id: 'rough_construction', name: 'Xây thô', icon: HardHat, dbValue: 'Xây thô' },
    { id: 'mep', name: 'Điện nước', icon: Zap, dbValue: 'Điện nước' },
    { id: 'painting', name: 'Sơn bả', icon: Paintbrush, dbValue: 'Sơn bả' },
    { id: 'interior', name: 'Nội thất', icon: Briefcase, dbValue: 'Nội thất' },
    { id: 'repair', name: 'Sửa chữa', icon: Wrench, dbValue: 'Sửa chữa' },
]

const CITIES = ['Toàn quốc', 'Hồ Chí Minh', 'Hà Nội', 'Đà Nẵng', 'Hải Phòng', 'Cần Thơ', 'Biên Hòa']

function ContractorMarketplaceContent() {
    const [loading, setLoading] = useState(true)
    const [contractors, setContractors] = useState<any[]>([])
    const [filter, setFilter] = useState('all')
    const [cityFilter, setCityFilter] = useState('Toàn quốc')
    const [searchTerm, setSearchTerm] = useState('')
    const [showLoginModal, setShowLoginModal] = useState(false)
    const [selectedContractorId, setSelectedContractorId] = useState<string | null>(null)
    const searchParams = useSearchParams()

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
            const contractor = contractors.find(c => c.id === chatContractorId)
            let guestId = localStorage.getItem('user_id')
            if (!guestId || !guestId.startsWith('guest_')) {
                guestId = 'guest_' + Math.random().toString(36).substr(2, 9)
                localStorage.setItem('user_id', guestId)
            }
            localStorage.setItem('user_name', guestContact.name)
            localStorage.setItem('user_phone', guestContact.phone)

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
        const q = searchParams.get('q')
        const location = searchParams.get('location')
        if (q) setSearchTerm(q)
        if (location) setCityFilter(location)
    }, [searchParams])

    useEffect(() => {
        fetchContractors()
    }, [filter, cityFilter])

    const fetchContractors = async () => {
        setLoading(true)
        try {
            let url = '/api/contractors/public?'
            if (filter !== 'all') {
                const category = CATEGORIES.find(c => c.id === filter)
                const skillQuery = category?.dbValue || filter
                url += `skill=${encodeURIComponent(skillQuery)}&`
            }
            if (cityFilter !== 'Toàn quốc') url += `city=${encodeURIComponent(cityFilter)}&`

            const res = await fetch(url)
            if (res.ok) {
                const data = await res.json()
                const list = data.data || []
                setContractors(list)
                if (list.length > 0 && !selectedContractorId) {
                    setSelectedContractorId(list[0].id)
                }
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

    const selectedContractor = contractors.find(c => c.id === selectedContractorId)

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

            {/* 🚀 PREMIUM HERO SECTION */}
            <div className="relative pt-24 pb-48 overflow-hidden bg-slate-950">
                <div className="absolute inset-0 z-0">
                    <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_20%_30%,#1e3a8a_0%,transparent_50%),radial-gradient(circle_at_80%_20%,#312e81_0%,transparent_50%),radial-gradient(circle_at_50%_80%,#164e63_0%,transparent_50%)] opacity-80"></div>
                </div>
                <div className="max-w-[1400px] mx-auto px-4 relative z-10">
                    <div className="max-w-4xl">
                        <div className="inline-flex items-center gap-3 px-5 py-2 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-300 mb-8 backdrop-blur-md">
                            <ShieldCheck className="w-4 h-4" />
                            <span className="text-[10px] font-black uppercase tracking-[0.4em]">Hệ thống nhà thầu chuyên nghiệp SmartBuild</span>
                        </div>
                        <h1 className="text-5xl md:text-7xl font-black text-white mb-8 tracking-tight uppercase">
                            Tìm Kiếm <span className="text-blue-400 italic">Đối Tác</span> <br /> Thi Công Tin Cậy
                        </h1>
                        <div className="relative max-w-2xl">
                            <div className="bg-white p-2 rounded-3xl shadow-2xl flex flex-col md:flex-row items-center gap-2">
                                <div className="flex-1 flex items-center px-4 w-full">
                                    <Search className="w-5 h-5 text-blue-600 mr-3" />
                                    <input
                                        type="text"
                                        placeholder="Nhà thầu xây dựng, điện nước..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="w-full py-4 bg-transparent font-bold text-slate-800 outline-none"
                                    />
                                </div>
                                <div className="w-full md:w-48 flex items-center px-4 border-l border-slate-100">
                                    <MapPin className="w-5 h-5 text-blue-600 mr-2" />
                                    <select
                                        value={cityFilter}
                                        onChange={(e) => setCityFilter(e.target.value)}
                                        className="w-full py-4 bg-transparent font-black text-slate-800 outline-none appearance-none cursor-pointer"
                                    >
                                        {CITIES.map(city => <option key={city} value={city}>{city}</option>)}
                                    </select>
                                </div>
                                <button className="w-full md:w-auto px-8 py-4 bg-blue-600 font-black text-white rounded-2xl hover:bg-blue-700 transition-all uppercase tracking-widest text-xs">
                                    TÌM KIẾM
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-[1400px] mx-auto px-4 -mt-12 relative z-20">
                <div className="bg-white/80 backdrop-blur-2xl rounded-3xl p-4 border border-white shadow-xl flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
                        {CATEGORIES.map((cat) => (
                            <button
                                key={cat.id}
                                onClick={() => setFilter(cat.id)}
                                className={`flex items-center gap-2 px-6 py-3 rounded-xl text-xs font-black whitespace-nowrap transition-all ${filter === cat.id ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'}`}
                            >
                                <cat.icon className="w-4 h-4" />
                                {cat.name.toUpperCase()}
                            </button>
                        ))}
                    </div>
                    <div className="flex items-center gap-4 px-4 py-2 bg-slate-50 rounded-xl border border-slate-100">
                        <span className="text-[10px] font-black text-slate-400 uppercase">Sắp xếp:</span>
                        <select className="bg-transparent text-xs font-black text-slate-900 outline-none cursor-pointer">
                            <option>Mặc định</option>
                            <option>Đánh giá cao nhất</option>
                            <option>Kinh nghiệm lâu năm</option>
                        </select>
                    </div>
                </div>
            </div>

            <main className="max-w-[1400px] mx-auto px-4 py-12">
                <div className="flex flex-col lg:flex-row gap-8">
                    {/* Left Column: List */}
                    <div className="w-full lg:w-[450px] space-y-4">
                        <h2 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-6">
                            Kết quả tìm kiếm ({filteredContractors.length})
                        </h2>

                        {loading ? (
                            <div className="space-y-4">
                                {[1, 2, 3, 4].map(i => (
                                    <div key={i} className="h-40 bg-white rounded-3xl animate-pulse border border-slate-100"></div>
                                ))}
                            </div>
                        ) : filteredContractors.length === 0 ? (
                            <div className="bg-white rounded-[40px] p-12 text-center border-2 border-dashed border-slate-200">
                                <Users className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                                <p className="text-slate-500 font-bold">Không tìm thấy nhà thầu phù hợp</p>
                            </div>
                        ) : (
                            <div className="space-y-4 max-h-[1200px] overflow-y-auto no-scrollbar pr-2">
                                {filteredContractors.map((c) => (
                                    <div
                                        key={c.id}
                                        onClick={() => setSelectedContractorId(c.id)}
                                        className={`group relative p-6 rounded-[32px] border-2 transition-all cursor-pointer ${selectedContractorId === c.id 
                                            ? 'bg-white border-blue-500 shadow-2xl shadow-blue-100' 
                                            : 'bg-white border-slate-100 hover:border-slate-200 hover:shadow-xl'}`}
                                    >
                                        <div className="flex gap-4 items-start mb-4">
                                            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-xl font-black transition-colors ${selectedContractorId === c.id ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-900 group-hover:bg-blue-50 group-hover:text-blue-600'}`}>
                                                {c.displayName?.charAt(0)}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h3 className="font-black text-slate-900 group-hover:text-blue-600 transition-colors uppercase truncate">
                                                    {c.displayName}
                                                </h3>
                                                <p className="text-xs font-bold text-slate-400 truncate">
                                                    {c.companyName || 'Đối tác chiến lược'} • {c.city || 'Toàn quốc'}
                                                </p>
                                            </div>
                                            <div className="flex gap-1">
                                                <button 
                                                    onClick={(e) => { e.stopPropagation(); toggleCompare(c); }}
                                                    className={`p-2 rounded-xl transition-all ${compareList.some(item => item.id === c.id) ? 'bg-blue-600 text-white' : 'bg-slate-50 text-slate-400 hover:text-blue-600 hover:bg-blue-50'}`}
                                                >
                                                    <Scale className="w-3.5 h-3.5" />
                                                </button>
                                                <button 
                                                    onClick={(e) => { e.stopPropagation(); setShowLoginModal(true); }}
                                                    className="p-2 bg-slate-50 text-slate-400 rounded-xl hover:text-red-500 hover:bg-red-50 transition-all"
                                                >
                                                    <Heart className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                        </div>

                                        <div className="flex flex-wrap gap-1.5 mb-6">
                                            {c.skills?.slice(0, 2).map((s: string) => (
                                                <span key={s} className="px-2.5 py-1 bg-slate-50 text-slate-500 rounded-lg text-[9px] font-black uppercase tracking-wider">
                                                    {getSkillName(s)}
                                                </span>
                                            ))}
                                        </div>

                                        <div className="flex items-center justify-between mt-auto">
                                            <div className="flex items-center gap-1.5 px-3 py-1 bg-amber-50 text-amber-600 rounded-full text-[10px] font-black border border-amber-100">
                                                <Star className="w-3 h-3 fill-current" />
                                                {c.avgRating || '5.0'}
                                            </div>
                                            <div className="text-[10px] font-black text-blue-600 uppercase tracking-widest flex items-center gap-1 group-hover:gap-2 transition-all">
                                                Chi tiết <ArrowRight className="w-4 h-4" />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Right Column: Detail View */}
                    <div className="flex-1 hidden lg:block">
                        {selectedContractor ? (
                            <div className="sticky top-24 bg-white rounded-[40px] border border-slate-100 shadow-2xl shadow-slate-200/40 overflow-hidden h-[calc(100vh-120px)] flex flex-col">
                                <div className="flex-1 overflow-y-auto no-scrollbar pb-12">
                                    {/* Header Section Inside Scrollable */}
                                    <div className="h-28 bg-gradient-to-r from-blue-600 to-indigo-700 relative shrink-0">
                                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(255,255,255,0.1)_0%,transparent_50%)]"></div>
                                    </div>
                                    
                                    <div className="px-10 -mt-12 relative z-10">
                                        <div className="flex justify-between items-end mb-6">
                                            <div className="relative">
                                                <div className="w-24 h-24 rounded-[32px] bg-white p-1 shadow-xl">
                                                    <div className="w-full h-full rounded-[28px] bg-slate-100 flex items-center justify-center text-3xl font-black text-slate-900 border border-slate-50">
                                                        {selectedContractor.displayName?.charAt(0)}
                                                    </div>
                                                </div>
                                                <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-emerald-500 rounded-full border-2 border-white flex items-center justify-center shadow-lg">
                                                    <BadgeCheck className="w-4 h-4 text-white" />
                                                </div>
                                            </div>
                                            <div className="flex gap-2 mb-1">
                                                <button 
                                                    onClick={() => setShowLoginModal(true)}
                                                    className="p-3 bg-white/10 backdrop-blur-md text-white rounded-xl hover:bg-white/20 transition-all border border-white/20 sm:bg-slate-50 sm:text-slate-400 sm:border-slate-100 sm:hover:text-red-500 sm:hover:bg-red-50"
                                                >
                                                    <Heart className="w-4 h-4" />
                                                </button>
                                                <button 
                                                    onClick={() => toggleCompare(selectedContractor)}
                                                    className={`p-3 backdrop-blur-md rounded-xl transition-all border ${compareList.some(item => item.id === selectedContractor.id) 
                                                        ? 'bg-blue-600 text-white border-blue-600' 
                                                        : 'bg-white/10 text-white border-white/20 sm:bg-slate-50 sm:text-slate-400 sm:border-slate-100 sm:hover:text-blue-600 sm:hover:bg-blue-50'}`}
                                                >
                                                    <Scale className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>

                                        <div className="mb-8">
                                            <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tight mb-1">
                                                {selectedContractor.displayName}
                                            </h2>
                                            <p className="text-sm font-bold text-slate-500 flex items-center gap-2">
                                                {selectedContractor.companyName || 'Đối tác chiến lược'} <span className="w-1 h-1 rounded-full bg-slate-300"></span> {selectedContractor.city || 'Toàn quốc'}
                                            </p>
                                        </div>

                                        <div className="grid grid-cols-4 gap-3 mb-8">
                                            {[
                                                { label: 'Đánh giá', value: `${selectedContractor.avgRating || '5.0'} ⭐`, color: 'text-amber-600', bg: 'bg-amber-50' },
                                                { label: 'Kinh nghiệm', value: `${selectedContractor.experienceYears || '0'} Năm`, color: 'text-blue-600', bg: 'bg-blue-50' },
                                                { label: 'Dự án', value: `${selectedContractor.totalProjectsCompleted || '0'} C.Trình`, color: 'text-emerald-600', bg: 'bg-emerald-50' },
                                                { label: 'Đội ngũ', value: `${selectedContractor.teamSize || '1'} N.Sự`, color: 'text-indigo-600', bg: 'bg-indigo-50' }
                                            ].map((stat, i) => (
                                                <div key={i} className={`${stat.bg} p-3 rounded-2xl border border-white shadow-sm text-center`}>
                                                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-0.5">{stat.label}</p>
                                                    <p className={`text-[11px] font-black ${stat.color}`}>{stat.value}</p>
                                                </div>
                                            ))}
                                        </div>

                                        <div className="flex gap-3 mb-10">
                                            <button 
                                                onClick={() => handleChatClick(selectedContractor.id)}
                                                className="flex-[2] py-4 bg-blue-600 text-white rounded-2xl font-black uppercase tracking-[0.15em] text-[10px] shadow-xl shadow-blue-100 hover:bg-blue-700 transition-all active:scale-95 flex items-center justify-center gap-2"
                                            >
                                                Nhắn tin ngay <MessageSquare className="w-4 h-4" />
                                            </button>
                                            <Link 
                                                href={`/contractors/${encodeId(selectedContractor.id)}`}
                                                className="flex-1 py-4 bg-white text-slate-900 border border-slate-200 rounded-2xl font-black uppercase tracking-[0.15em] text-[10px] hover:bg-slate-50 transition-all flex items-center justify-center"
                                            >
                                                Hồ sơ
                                            </Link>
                                        </div>

                                        <div className="space-y-8">
                                            <div>
                                                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                                                    <Info className="w-3.5 h-3.5" /> Giới thiệu đối tác
                                                </h3>
                                                <p className="text-slate-600 font-medium leading-relaxed text-base">
                                                    {selectedContractor.bio || 'Chưa có thông tin giới thiệu chi tiết cho đối tác này.'}
                                                </p>
                                            </div>

                                            <div>
                                                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                                                    <Wrench className="w-3.5 h-3.5" /> Chuyên môn chính
                                                </h3>
                                                <div className="flex flex-wrap gap-1.5">
                                                    {selectedContractor.skills?.map((s: string) => (
                                                        <span key={s} className="px-4 py-2 bg-slate-50 text-slate-600 rounded-xl text-[10px] font-black border border-slate-100 uppercase tracking-widest">
                                                            {getSkillName(s)}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>

                                            {/* 🤝 SIMILAR CONTRACTORS SECTION */}
                                            <div className="pt-8 border-t border-slate-100">
                                                <div className="flex items-center justify-between mb-6">
                                                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                                                        <Users className="w-3.5 h-3.5" /> Đối tác tương tự
                                                    </h3>
                                                </div>
                                                <div className="space-y-3">
                                                    {contractors
                                                        .filter(c => c.id !== selectedContractor.id)
                                                        .slice(0, 3)
                                                        .map(similar => (
                                                            <div 
                                                                key={similar.id}
                                                                onClick={() => setSelectedContractorId(similar.id)}
                                                                className="group/item flex items-center gap-4 p-4 rounded-2xl border border-slate-50 hover:border-blue-100 hover:bg-blue-50/30 transition-all cursor-pointer"
                                                            >
                                                                <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center text-lg font-black text-slate-400 group-hover/item:bg-blue-600 group-hover/item:text-white transition-colors shrink-0">
                                                                    {similar.displayName?.charAt(0)}
                                                                </div>
                                                                <div className="flex-1 min-w-0">
                                                                    <h4 className="text-xs font-black text-slate-900 uppercase truncate mb-0.5 group-hover/item:text-blue-600 transition-colors">
                                                                        {similar.displayName}
                                                                    </h4>
                                                                    <div className="flex items-center gap-2">
                                                                        <div className="flex items-center gap-1 text-[10px] font-bold text-amber-500">
                                                                            <Star className="w-3 h-3 fill-current" /> {similar.avgRating || '5.0'}
                                                                        </div>
                                                                        <span className="w-1 h-1 rounded-full bg-slate-200"></span>
                                                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">
                                                                            {similar.experienceYears || '0'} năm kinh nghiệm
                                                                        </p>
                                                                    </div>
                                                                </div>
                                                                <ArrowUpRight className="w-4 h-4 text-slate-300 group-hover/item:text-blue-500 group-hover/item:translate-x-0.5 group-hover/item:-translate-y-0.5 transition-all" />
                                                            </div>
                                                        ))}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="sticky top-24 bg-white rounded-[40px] border-2 border-dashed border-slate-100 h-[600px] flex flex-col items-center justify-center p-12 text-center">
                                <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-5 text-slate-200">
                                    <Users className="w-10 h-10" />
                                </div>
                                <h3 className="text-xl font-black text-slate-900 mb-2 uppercase">Chọn nhà thầu</h3>
                                <p className="text-slate-400 font-medium text-sm max-w-xs">Chọn một đối tác từ danh sách bên trái để xem hồ sơ năng lực chi tiết</p>
                            </div>
                        )}
                    </div>
                </div>
            </main>

            {/* Comparison Float Bar - Improved Bright Style */}
            {compareList.length > 0 && (
                <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[60] w-full max-w-2xl px-4">
                    <div className="bg-white/90 backdrop-blur-2xl rounded-[32px] p-2 pl-6 flex items-center justify-between shadow-[0_20px_50px_rgba(0,0,0,0.15)] border border-white">
                        <div className="flex items-center gap-4">
                            <span className="text-slate-400 font-black text-[10px] uppercase tracking-widest hidden sm:block">Đang chọn</span>
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
                            <button 
                                onClick={() => setCompareList([])}
                                className="px-6 py-3 bg-slate-50 text-slate-400 font-black rounded-[20px] hover:text-slate-600 transition-all text-[10px] uppercase tracking-widest"
                            >
                                Xóa hết
                            </button>
                            <Link
                                href={`/contractors/compare?ids=${compareList.map(c => encodeId(c.id)).join(',')}`}
                                className="px-8 py-3 bg-blue-600 text-white font-black rounded-[20px] hover:bg-blue-500 transition-all text-[10px] flex items-center gap-2 shadow-lg shadow-blue-200 uppercase tracking-widest"
                            >
                                So sánh ngay
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

export default function ContractorMarketplace() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-slate-50 flex items-center justify-center font-black text-blue-600 uppercase tracking-[0.3em]">Đang tải dữ liệu...</div>}>
            <ContractorMarketplaceContent />
        </Suspense>
    )
}

function ChatModal({ onClose, onSubmit, contact, setContact }: any) {
    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-fade-in">
            <div className="bg-white rounded-[48px] shadow-2xl max-w-xl w-full p-12 relative overflow-hidden animate-slide-in border border-white">
                <div className="absolute top-0 right-0 w-48 h-48 bg-blue-50/50 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>

                <button onClick={onClose} className="absolute top-10 right-10 p-3 text-slate-400 hover:text-slate-900 rounded-full hover:bg-slate-50 transition-all border border-slate-100">
                    <X className="w-6 h-6" />
                </button>

                <div className="text-center mb-10">
                    <div className="w-24 h-24 bg-blue-50 rounded-[32px] flex items-center justify-center mx-auto mb-6 text-blue-600 shadow-inner">
                        <MessageSquare className="w-12 h-12" />
                    </div>
                    <h3 className="text-4xl font-black text-slate-900 mb-3 tracking-tight uppercase">Kết nối đối tác</h3>
                    <p className="text-slate-500 font-medium">Để lại lời nhắn, nhà thầu sẽ phản hồi bạn sớm nhất có thể.</p>
                </div>

                <form onSubmit={onSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Họ và tên</label>
                            <input
                                required
                                placeholder="Nguyễn Văn A"
                                className="w-full px-6 py-5 bg-slate-50 rounded-[24px] border border-slate-100 font-bold text-sm outline-none focus:bg-white focus:border-blue-500 transition-all shadow-sm"
                                value={contact.name}
                                onChange={e => setContact({ ...contact, name: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Số điện thoại</label>
                            <input
                                required
                                placeholder="0901 xxx xxx"
                                className="w-full px-6 py-5 bg-slate-50 rounded-[24px] border border-slate-100 font-bold text-sm outline-none focus:bg-white focus:border-blue-500 transition-all shadow-sm"
                                value={contact.phone}
                                onChange={e => setContact({ ...contact, phone: e.target.value })}
                            />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Nội dung trao đổi</label>
                        <textarea
                            required
                            placeholder="Mô tả sơ qua về nhu cầu của bạn..."
                            rows={4}
                            className="w-full px-6 py-5 bg-slate-50 rounded-[24px] border border-slate-100 font-bold text-sm outline-none focus:bg-white focus:border-blue-500 transition-all shadow-sm resize-none"
                            value={contact.message}
                            onChange={e => setContact({ ...contact, message: e.target.value })}
                        />
                    </div>
                    <button type="submit" className="w-full py-6 bg-blue-600 text-white font-black rounded-[28px] hover:bg-blue-700 transition-all shadow-2xl shadow-blue-100 uppercase tracking-[0.2em] text-xs active:scale-95">
                        GỬI TIN NHẮN NGAY
                    </button>
                </form>

                <div className="mt-10 pt-8 border-t border-slate-100 text-center">
                    <Link href="/login" className="text-xs font-black text-blue-600 hover:text-blue-700 uppercase tracking-widest flex items-center justify-center gap-2">
                        Đã có tài khoản? <span className="underline">Đăng nhập để chat trực tiếp</span>
                    </Link>
                </div>
            </div>
        </div>
    )
}
