'use client'

/**
 * Public Contractor Portfolio Page - Standard Premium Design (Vietnamized)
 */

import { useState, useEffect, use } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
    ShieldCheck, Star, MapPin,
    Briefcase, CheckCircle2, ArrowLeft, ArrowRight,
    HardHat, MessageCircle, FileText,
    Heart, Share2, Info, AlertCircle, X,
    Camera, Image as ImageIcon, MessageSquare,
    Clock, Trophy, BadgeCheck, Check,
    Building2, Users, Calendar, ArrowUpRight,
    Calculator
} from 'lucide-react'
import toast, { Toaster } from 'react-hot-toast'
import Header from '@/components/Header'

export default function ContractorDetailView({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params)
    const [loading, setLoading] = useState(true)
    const [contractor, setContractor] = useState<any>(null)
    const [showLoginModal, setShowLoginModal] = useState(false)
    const [showQuoteModal, setShowQuoteModal] = useState(false)
    const [showChatModal, setShowChatModal] = useState(false)
    const [guestContact, setGuestContact] = useState({ name: '', phone: '', message: '' })
    const [activeTab, setActiveTab] = useState('about')
    const router = useRouter()

    const handleChatClick = () => {
        const token = typeof window !== 'undefined' ? (localStorage.getItem('access_token') || sessionStorage.getItem('access_token')) : null

        if (token) {
            router.push(`/messages?partnerId=${id}`)
        } else {
            setShowChatModal(true)
        }
    }

    const handleGuestSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!guestContact.name || !guestContact.phone) {
            toast.error('Vui lòng nhập đầy đủ tên và số điện thoại')
            return
        }

        try {
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
                    recipientId: contractor.id,
                    recipientName: contractor.displayName,
                    initialMessage: guestContact.message || `Tôi quan tâm đến dịch vụ của bạn. SĐT liên hệ: ${guestContact.phone}`
                })
            })

            if (res.ok) {
                toast.success('Đang kết nối với nhà thầu...')
                setShowChatModal(false)
                router.push(`/messages?partnerId=${contractor.id}`)
            } else {
                toast.error('Không thể khởi tạo cuộc trò chuyện. Vui lòng thử lại.')
            }
        } catch (error) {
            console.error('Guest chat error:', error)
            toast.error('Lỗi hệ thống khi kết nối')
        }
    }

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
            }
        } catch (err) {
            toast.error('Lỗi khi tải hồ sơ đối tác')
        } finally {
            setLoading(false)
        }
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-[4px] border-primary-100 border-t-primary-600 rounded-full animate-spin"></div>
                    <p className="text-gray-500 font-bold animate-pulse">Đang tải hồ sơ chuyên gia...</p>
                </div>
            </div>
        )
    }

    if (!contractor) return null

    const isTopRated = (contractor.avgRating || 0) >= 4.8
    const isExpert = (contractor.experienceYears || 0) >= 10
    const isAvailable = contractor.isAvailable !== false

    return (
        <div className="min-h-screen bg-slate-50 pb-20 font-sans">
            <Header />

            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Breadcrumb */}
                <div className="flex items-center gap-2 mb-8 text-xs font-bold uppercase tracking-wider text-gray-400">
                    <Link href="/" className="hover:text-primary-600 transition-colors">Trang chủ</Link>
                    <ArrowRight className="w-3 h-3" />
                    <Link href="/contractors" className="hover:text-primary-600 transition-colors">Nhà thầu</Link>
                    <ArrowRight className="w-3 h-3" />
                    <span className="text-gray-900 truncate max-w-[200px]">{contractor.displayName}</span>
                </div>

                {/* Hero Header Card */}
                <div className="bg-white rounded-[32px] shadow-xl border border-gray-100 p-8 md:p-10 mb-8 relative overflow-hidden">
                    <div className="flex flex-col md:flex-row gap-10 items-center md:items-start relative z-10">
                        {/* Avatar Section */}
                        <div className="relative group">
                            <div className="w-32 h-32 md:w-36 md:h-36 bg-gradient-to-br from-primary-600 to-indigo-600 rounded-[32px] flex items-center justify-center text-4xl font-black text-white shadow-2xl transition-transform duration-500">
                                {contractor.displayName?.charAt(0) || 'N'}
                            </div>
                            {isTopRated && (
                                <div className="absolute -top-3 -right-3 w-10 h-10 bg-amber-500 text-white rounded-full flex items-center justify-center border-4 border-white shadow-xl">
                                    <Trophy className="w-5 h-5" />
                                </div>
                            )}
                        </div>

                        {/* Info Section */}
                        <div className="flex-1 text-center md:text-left">
                            <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 mb-3">
                                <h1 className="text-3xl md:text-4xl font-black text-gray-900">{contractor.displayName}</h1>
                                <div className="flex items-center gap-1.5 px-3 py-1 bg-blue-50 text-blue-600 rounded-lg text-[10px] font-black uppercase tracking-widest border border-blue-100 shadow-sm">
                                    <ShieldCheck className="w-4 h-4" />
                                    Đã xác thực
                                </div>
                                {isAvailable && (
                                    <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-600 rounded-lg text-[10px] font-black uppercase tracking-widest border border-emerald-100 shadow-sm">
                                        <div className="w-1.5 h-1.5 bg-emerald-600 rounded-full animate-pulse"></div>
                                        Sẵn sàng làm việc
                                    </div>
                                )}
                            </div>

                            <p className="text-lg text-gray-400 font-bold mb-8 flex items-center justify-center md:justify-start gap-2">
                                <Building2 className="w-5 h-5" />
                                {contractor.companyName || 'Đối tác SmartBuild chuyên nghiệp'}
                            </p>

                            {/* Stats Grid */}
                            <div className="flex flex-wrap justify-center md:justify-start gap-8 border-t border-gray-50 pt-8">
                                <SummaryStat label="Đánh giá" value={contractor.avgRating || 0} icon={<Star className="w-5 h-5 fill-amber-400 text-amber-400" />} />
                                <SummaryStat label="Kinh nghiệm" value={`${contractor.experienceYears || 0} Năm`} icon={<Clock className="w-5 h-5 text-blue-500" />} />
                                <SummaryStat label="Dự án" value={contractor.totalProjectsCompleted || 0} icon={<CheckCircle2 className="w-5 h-5 text-emerald-500" />} />
                            </div>
                        </div>

                        {/* Action Buttons Column */}
                        <div className="flex flex-col gap-3 w-full md:w-auto">
                            <button
                                onClick={handleChatClick}
                                className="flex items-center justify-center gap-2 px-8 py-4 bg-primary-600 hover:bg-primary-700 text-white rounded-2xl font-black uppercase tracking-widest transform transition-all active:scale-95 shadow-lg shadow-primary-200"
                            >
                                <MessageCircle className="w-5 h-5" />
                                Nhận tư vấn ngay
                            </button>
                            <button
                                onClick={() => {
                                    const token = typeof window !== 'undefined' ? (localStorage.getItem('access_token') || sessionStorage.getItem('access_token')) : null
                                    if (token) {
                                        // User logged in, go to messages with quote request message
                                        router.push(`/messages?partnerId=${id}&message=${encodeURIComponent('Xin chào, tôi muốn yêu cầu báo giá cho dự án của mình. Vui lòng liên hệ lại sớm nhất có thể.')}`)
                                    } else {
                                        // Not logged in, show guest modal with preset message
                                        setGuestContact(prev => ({
                                            ...prev,
                                            message: 'Xin chào, tôi muốn yêu cầu báo giá cho dự án của mình.'
                                        }))
                                        setShowChatModal(true)
                                    }
                                }}
                                className="flex items-center justify-center gap-2 px-8 py-4 bg-white hover:bg-gray-50 text-gray-900 border-2 border-gray-100 rounded-2xl font-black uppercase tracking-widest transition-all"
                            >
                                <Calculator className="w-5 h-5 text-primary-600" />
                                Yêu cầu báo giá
                            </button>
                        </div>
                    </div>
                </div>

                {/* Content Layout */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* Main Content Column (8/12) */}
                    <div className="lg:col-span-8 space-y-8 min-h-[500px]">
                        {/* Tabs Navigation */}
                        <div className="flex bg-white rounded-2xl shadow-sm border border-gray-100 p-1.5 gap-2">
                            <TabButton active={activeTab === 'about'} label="Giới thiệu hồ sơ" onClick={() => setActiveTab('about')} />
                            <TabButton active={activeTab === 'projects'} label="Công trình thực tế" onClick={() => setActiveTab('projects')} />
                            <TabButton active={activeTab === 'reviews'} label={`Nhận xét khách hàng (${contractor.reviewCount || 0})`} onClick={() => setActiveTab('reviews')} />
                        </div>

                        {/* Tab Content Rendering */}
                        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                            {activeTab === 'about' && (
                                <div className="bg-white rounded-[32px] shadow-sm border border-gray-100 p-10">
                                    <h3 className="text-xl font-black text-gray-900 mb-6 flex items-center gap-3">
                                        <Info className="w-6 h-6 text-blue-600" />
                                        Tiểu sử chuyên môn
                                    </h3>
                                    <div className="text-gray-600 leading-relaxed space-y-4 font-medium whitespace-pre-line text-lg">
                                        {contractor.bio || "Chúng tôi là đội ngũ thầu xây dựng chuyên nghiệp với cam kết cao về chất lượng và tiến độ thi công công trình."}
                                    </div>

                                    <div className="mt-10 pt-10 border-t border-gray-100 flex flex-wrap gap-2">
                                        {contractor.skills?.map((skill: string) => (
                                            <span key={skill} className="px-5 py-2.5 bg-blue-50 text-blue-600 rounded-2xl text-xs font-black whitespace-nowrap shadow-sm border border-blue-100">
                                                {skill}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {activeTab === 'projects' && (
                                <div className="bg-white rounded-[32px] shadow-sm border border-gray-100 p-10 flex flex-col items-center justify-center text-center py-20">
                                    <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-6">
                                        <HardHat className="w-10 h-10 text-gray-300" />
                                    </div>
                                    <h3 className="text-xl font-black text-gray-900 mb-2">Các dự án thực tế đang được cập nhật</h3>
                                    <p className="text-gray-400 font-medium max-w-xs leading-relaxed">
                                        Hình ảnh và thông tin chi tiết các công trình {contractor.displayName} đã thực hiện sẽ sớm được hiển thị tại đây.
                                    </p>
                                </div>
                            )}

                            {activeTab === 'reviews' && (
                                <div className="bg-white rounded-[32px] shadow-sm border border-gray-100 p-10 flex flex-col items-center justify-center text-center py-20">
                                    <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-6">
                                        <MessageSquare className="w-10 h-10 text-gray-300" />
                                    </div>
                                    <h3 className="text-xl font-black text-gray-900 mb-2">Chưa có nhận xét nào</h3>
                                    <p className="text-gray-400 font-medium max-w-xs leading-relaxed">
                                        Trở thành khách hàng đầu tiên nhận xét về dịch vụ của {contractor.displayName}.
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Sidebar Column (4/12) */}
                    <div className="lg:col-span-4 space-y-6">
                        <div className="bg-white rounded-[32px] shadow-sm border border-gray-100 p-8">
                            <h3 className="text-lg font-black text-gray-900 mb-6 uppercase tracking-wider">Thông tin liên hệ</h3>
                            <div className="space-y-4">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center">
                                        <MapPin className="w-5 h-5 text-gray-400" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Khu vực</p>
                                        <p className="font-bold text-gray-900">{contractor.city || 'Toàn quốc'}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center">
                                        <Clock className="w-5 h-5 text-gray-400" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Thời gian làm việc</p>
                                        <p className="font-bold text-gray-900">Thứ 2 - Thứ 7 (8:00 - 18:00)</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-gradient-to-br from-primary-600 to-indigo-700 rounded-[32px] shadow-xl p-8 text-white relative overflow-hidden group">
                            <div className="absolute top-0 right-0 -mr-8 -mt-8 w-40 h-40 bg-white/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700"></div>
                            <h3 className="text-xl font-black mb-4 relative z-10">Cam kết chất lượng SmartBuild</h3>
                            <p className="text-white/80 text-sm font-medium leading-relaxed mb-6 relative z-10">
                                Mọi giao dịch qua hệ thống đều được bảo vệ và giám sát bởi SmartBuild để đảm bảo quyền lợi tốt nhất cho bạn.
                            </p>
                            <Link href="/about" className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-widest bg-white text-primary-600 px-6 py-3 rounded-xl hover:shadow-xl transition-all relative z-10">
                                Tìm hiểu thêm
                            </Link>
                        </div>
                    </div>
                </div>
            </div>

            {/* Guest Chat Modal */}
            {showChatModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-white rounded-[32px] shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-300">
                        <div className="relative h-32 bg-gradient-to-r from-primary-600 to-indigo-700 flex items-center justify-center text-white">
                            <button
                                onClick={() => setShowChatModal(false)}
                                className="absolute top-4 right-4 p-2 bg-black/10 hover:bg-black/20 rounded-full transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                            <div className="text-center">
                                <h3 className="text-2xl font-black uppercase tracking-widest">Tư vấn trực tiếp</h3>
                                <p className="text-blue-100 text-xs font-medium">Kết nối ngay với {contractor.displayName}</p>
                            </div>
                        </div>

                        <form onSubmit={handleGuestSubmit} className="p-8 space-y-5">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Họ tên của bạn</label>
                                <input
                                    required
                                    type="text"
                                    value={guestContact.name}
                                    onChange={e => setGuestContact({ ...guestContact, name: e.target.value })}
                                    placeholder="Ví dụ: Nguyễn Văn A"
                                    className="w-full px-5 py-4 bg-gray-50 border-2 border-transparent focus:border-primary-500 focus:bg-white rounded-2xl outline-none transition-all font-bold text-gray-900"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Số điện thoại liên hệ</label>
                                <input
                                    required
                                    type="tel"
                                    value={guestContact.phone}
                                    onChange={e => setGuestContact({ ...guestContact, phone: e.target.value })}
                                    placeholder="Ví dụ: 090xxxxxxx"
                                    className="w-full px-5 py-4 bg-gray-50 border-2 border-transparent focus:border-primary-500 focus:bg-white rounded-2xl outline-none transition-all font-bold text-gray-900"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Lời nhắn (Tùy chọn)</label>
                                <textarea
                                    value={guestContact.message}
                                    onChange={e => setGuestContact({ ...guestContact, message: e.target.value })}
                                    placeholder="Tôi cần tư vấn về công trình..."
                                    rows={3}
                                    className="w-full px-5 py-4 bg-gray-50 border-2 border-transparent focus:border-primary-500 focus:bg-white rounded-2xl outline-none transition-all font-bold text-gray-900 resize-none"
                                />
                            </div>

                            <button
                                type="submit"
                                className="w-full py-5 bg-primary-600 hover:bg-primary-700 text-white rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-primary-100 transition-all active:scale-[0.98] flex items-center justify-center gap-3"
                            >
                                <MessageCircle className="w-6 h-6" />
                                Bắt đầu trò chuyện
                            </button>

                            <p className="text-center text-[10px] text-gray-400 font-medium">
                                Thông tin của bạn được bảo mật và chỉ dùng để nhà thầu liên hệ tư vấn.
                            </p>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}

function SummaryStat({ label, value, icon }: { label: string, value: any, icon: any }) {
    return (
        <div className="flex flex-col items-center md:items-start group">
            <div className="flex items-center gap-3 mb-1">
                <div className="p-2.5 bg-gray-50 rounded-xl group-hover:bg-white group-hover:shadow-md transition-all">
                    {icon}
                </div>
                <span className="text-2xl font-black text-gray-900">{value}</span>
            </div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">{label}</p>
        </div>
    )
}

function TabButton({ active, label, onClick }: { active: boolean, label: string, onClick: () => void }) {
    return (
        <button
            onClick={onClick}
            className={`flex-1 py-4 px-2 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${active ? 'bg-blue-600 text-white shadow-xl scale-[1.02]' : 'text-gray-400 hover:text-blue-600 hover:bg-blue-50'
                }`}
        >
            {label}
        </button>
    )
}

