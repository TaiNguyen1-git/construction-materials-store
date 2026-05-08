'use client'

/**
 * Public Contractor Portfolio Page - Standard Premium Design (Vietnamized)
 */

import { useState, useEffect, use } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { encodeId } from '@/lib/id-utils'
import {
    ShieldCheck, Star, MapPin,
    Briefcase, CheckCircle2, ArrowLeft, ArrowRight,
    HardHat, MessageCircle, FileText,
    Heart, Share2, Info, AlertCircle, X,
    Camera, Image as ImageIcon, MessageSquare,
    Clock, Trophy, BadgeCheck, Check,
    Building2, Users, Calendar, ArrowUpRight,
    Calculator, Phone, Mail, EyeOff
} from 'lucide-react'
import toast, { Toaster } from 'react-hot-toast'
import Header from '@/components/Header'
import LoginIncentiveModal from '@/components/LoginIncentiveModal'
import { useAuth } from '@/contexts/auth-context'

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
    
    // First try direct match
    if (SKILL_MAP[normalizedSkill]) return SKILL_MAP[normalizedSkill]
    
    // Then try mapping from DB values to localized labels if they are different
    return skill
}

export default function ContractorDetailView({ params, initialContractor }: { params: Promise<{ id: string }>, initialContractor?: any }) {
    const { id } = use(params)
    const [loading, setLoading] = useState(!initialContractor)
    const [contractor, setContractor] = useState<any>(initialContractor || null)
    const [showLoginModal, setShowLoginModal] = useState(false)
    const [showQuoteModal, setShowQuoteModal] = useState(false)
    const [showChatModal, setShowChatModal] = useState(false)
    const { user } = useAuth()
    const [showReviewModal, setShowReviewModal] = useState(false)
    const [guestContact, setGuestContact] = useState({ name: '', phone: '', message: '', rating: 5, isAnonymous: false })
    const [localReviews, setLocalReviews] = useState<any[]>([])
    const [activeTab, setActiveTab] = useState('about')
    const router = useRouter()

    useEffect(() => {
        if (showReviewModal && user) {
            setGuestContact(prev => ({ ...prev, name: (user as any).name || (user as any).displayName || '' }))
        }
    }, [showReviewModal, user])

    useEffect(() => {
        // Auto-open review modal if coming back from login
        if (typeof window !== 'undefined') {
            const params = new URLSearchParams(window.location.search)
            if (params.get('openReview') === 'true' && user) {
                setShowReviewModal(true)
                // Clean up URL
                const newUrl = window.location.pathname
                window.history.replaceState({}, '', newUrl)
            }
        }
    }, [user])

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
                headers: { 
                    'Content-Type': 'application/json',
                    'x-guest-id': guestId
                },
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
        if (!initialContractor) setLoading(true)
        try {
            const res = await fetch(`/api/contractors/public/${id}`)
            if (res.ok) {
                const data = await res.json()
                setContractor(data.data)
            }
        } catch (err) {
            if (!initialContractor) toast.error('Lỗi khi tải hồ sơ đối tác')
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
                                            <span key={skill} className="px-5 py-2.5 bg-blue-50 text-blue-600 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-sm border border-blue-100">
                                                {getSkillName(skill)}
                                            </span>
                                        ))}
                                    </div>

                                    {/* 🤝 NEW: Integrated Similar Partners Section */}
                                    <div className="mt-16 pt-10 border-t border-slate-100">
                                        <SimilarContractors 
                                            contractorId={contractor.id} 
                                            skills={contractor.skills || []} 
                                        />
                                    </div>
                                </div>
                            )}

                            {activeTab === 'projects' && (
                                <div className="space-y-8">
                                    {/* Portfolio Gallery */}
                                    <div className="bg-white rounded-[32px] shadow-sm border border-gray-100 p-10">
                                        <h3 className="text-xl font-black text-gray-900 mb-8 flex items-center gap-3">
                                            <Camera className="w-6 h-6 text-blue-600" />
                                            Hình ảnh thực tế từ hồ sơ
                                        </h3>
                                        
                                        {contractor.portfolioImages && contractor.portfolioImages.length > 0 ? (
                                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                                {contractor.portfolioImages.map((img: string, idx: number) => (
                                                    <div key={idx} className="aspect-[4/3] rounded-2xl overflow-hidden border border-gray-100 group relative">
                                                        <img src={img} alt={`Portfolio ${idx}`} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                                                        <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                            <ImageIcon className="text-white w-8 h-8" />
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="bg-slate-50 rounded-3xl p-10 text-center">
                                                <ImageIcon className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                                                <p className="text-slate-400 font-bold">Chưa có hình ảnh trong hồ sơ</p>
                                            </div>
                                        )}
                                    </div>

                                    {/* Project Showcase */}
                                    <div className="bg-white rounded-[32px] shadow-sm border border-gray-100 p-10">
                                        <h3 className="text-xl font-black text-gray-900 mb-8 flex items-center gap-3">
                                            <Briefcase className="w-6 h-6 text-blue-600" />
                                            Công trình tiêu biểu
                                        </h3>
                                        
                                        {(contractor.featuredProjects as any)?.length > 0 ? (
                                            <div className="space-y-6">
                                                {(contractor.featuredProjects as any[]).map((proj: any, idx: number) => (
                                                    <div key={idx} className="flex flex-col md:flex-row gap-6 p-6 bg-slate-50/50 rounded-3xl border border-slate-100 group hover:bg-white hover:shadow-xl transition-all">
                                                        <div className="w-full md:w-48 h-32 rounded-2xl overflow-hidden flex-shrink-0">
                                                            <img src={proj.image} alt={proj.title} className="w-full h-full object-cover" />
                                                        </div>
                                                        <div className="flex-1">
                                                            <div className="flex items-center justify-between mb-2">
                                                                <h4 className="font-black text-lg text-gray-900">{proj.title}</h4>
                                                                <span className="px-3 py-1 bg-white text-blue-600 rounded-lg text-[10px] font-black border border-blue-50">{proj.year}</span>
                                                            </div>
                                                            <p className="text-gray-500 font-medium text-sm leading-relaxed mb-4">{proj.desc}</p>
                                                            <div className="flex items-center gap-2 text-blue-600 text-xs font-black uppercase tracking-wider group-hover:gap-3 transition-all">
                                                                Xem chi tiết <ArrowUpRight className="w-3.5 h-3.5" />
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="text-center py-10">
                                                <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
                                                    <HardHat className="w-10 h-10 text-gray-300" />
                                                </div>
                                                <h3 className="text-xl font-black text-gray-900 mb-2">Dự án thực tế đang được cập nhật</h3>
                                                <p className="text-gray-400 font-medium max-w-xs mx-auto leading-relaxed">
                                                    Thông tin chi tiết các công trình {contractor.displayName} đã thực hiện sẽ sớm được hiển thị tại đây.
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {activeTab === 'reviews' && (
                                <div className="space-y-6">
                                    <div className="bg-white rounded-[32px] shadow-sm border border-gray-100 p-8 flex items-center justify-between">
                                        <div>
                                            <h3 className="text-xl font-black text-gray-900 mb-1">Đánh giá & Nhận xét</h3>
                                            <p className="text-sm text-gray-400 font-medium">Chia sẻ trải nghiệm của bạn về đối tác này</p>
                                        </div>
                                        <button 
                                            onClick={() => {
                                                if (!user) {
                                                    setShowLoginModal(true)
                                                } else {
                                                    setShowReviewModal(true)
                                                }
                                            }}
                                            className="px-6 py-3 bg-blue-600 text-white rounded-xl font-black text-xs uppercase tracking-widest hover:bg-blue-700 transition-all shadow-lg shadow-blue-100 flex items-center gap-2"
                                        >
                                            <Star className="w-4 h-4 fill-current" /> Viết nhận xét
                                        </button>
                                    </div>

                                    <div className="bg-white rounded-[32px] shadow-sm border border-gray-100 p-10 flex flex-col items-center justify-center text-center py-12">
                                        {localReviews.length === 0 ? (
                                            <>
                                                <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-6">
                                                    <MessageSquare className="w-10 h-10 text-gray-300" />
                                                </div>
                                                <h3 className="text-xl font-black text-gray-900 mb-2">Chưa có nhận xét nào</h3>
                                                <p className="text-gray-400 font-medium max-w-xs leading-relaxed">
                                                    Trở thành khách hàng đầu tiên nhận xét về dịch vụ của {contractor.displayName}.
                                                </p>
                                            </>
                                        ) : (
                                            <div className="w-full space-y-6 text-left">
                                                {localReviews.map((rev, idx) => (
                                                    <div key={idx} className="p-6 bg-slate-50/50 rounded-3xl border border-slate-100 animate-in slide-in-from-bottom-4 duration-500">
                                                        <div className="flex justify-between items-start mb-4">
                                                            <div className="flex items-center gap-3">
                                                                <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-black text-xs">
                                                                    {rev.isAnonymous ? '?' : rev.name?.charAt(0)}
                                                                </div>
                                                                <div>
                                                                    <h4 className="font-black text-sm text-slate-900">
                                                                        {rev.isAnonymous ? 'Người dùng ẩn danh' : rev.name}
                                                                    </h4>
                                                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Vừa xong</p>
                                                                </div>
                                                            </div>
                                                            <div className="flex gap-0.5">
                                                                {[...Array(5)].map((_, i) => (
                                                                    <Star key={i} className={`w-3 h-3 ${i < rev.rating ? 'text-amber-400 fill-current' : 'text-slate-200'}`} />
                                                                ))}
                                                            </div>
                                                        </div>
                                                        <p className="text-sm text-slate-600 font-medium leading-relaxed italic">"{rev.message}"</p>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Sidebar Column (4/12) */}
                    <div className="lg:col-span-4">
                        <div className="sticky top-24 space-y-6">
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
                                        <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
                                            <Phone className="w-5 h-5 text-blue-500" />
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Số điện thoại</p>
                                            {contractor.phone ? (
                                                <p className="font-bold text-gray-900">{contractor.phone}</p>
                                            ) : (
                                                <button 
                                                    onClick={() => setShowLoginModal(true)}
                                                    className="text-xs font-bold text-blue-600 hover:text-blue-700 bg-blue-50 px-3 py-1.5 rounded-lg mt-1 transition-all active:scale-95 shadow-sm border border-blue-100"
                                                >
                                                     Đăng nhập để xem
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center">
                                            <Mail className="w-5 h-5 text-indigo-500" />
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Email</p>
                                            {contractor.email ? (
                                                <p className="font-bold text-gray-900">{contractor.email}</p>
                                            ) : (
                                                <p className="text-xs font-medium text-gray-400 italic">Đã được ẩn bảo mật</p>
                                            )}
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

            {/* Login Modal for retrieving contact info */}
            <LoginIncentiveModal
                isOpen={showLoginModal}
                onClose={() => setShowLoginModal(false)}
                feature="general"
                title="Bảo mật thông tin Nhà Thầu"
                description="Hệ thống đã ẩn tự động Số điện thoại và Email để bảo vệ Nhà thầu khỏi SPAM. Bạn vui lòng Đăng nhập tài khoản để xem được thông tin liên hệ trực tiếp nhé!"
            />

            {/* Review Form Modal */}
            {showReviewModal && (
                <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-white rounded-[40px] shadow-2xl w-full max-w-xl overflow-hidden animate-in zoom-in-95 duration-300">
                        <div className="p-8 border-b border-gray-50 flex justify-between items-center bg-slate-50/50">
                            <div>
                                <h3 className="text-xl font-black text-gray-900 uppercase tracking-tight">Đánh giá dịch vụ</h3>
                                <p className="text-xs text-gray-400 font-bold mt-0.5">Đối tác: {contractor.displayName}</p>
                            </div>
                            <button 
                                onClick={() => setShowReviewModal(false)}
                                className="p-2.5 hover:bg-white rounded-2xl transition-all text-gray-400 hover:text-gray-900 shadow-sm border border-transparent hover:border-gray-100"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="p-8 space-y-8">
                            {/* Star Rating Selector */}
                            <div className="flex flex-col items-center gap-4 py-4 bg-primary-50/30 rounded-[32px] border border-primary-50">
                                <p className="text-[10px] font-black text-primary-600 uppercase tracking-[0.2em]">Chọn mức độ hài lòng</p>
                                <div className="flex gap-3">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                        <button
                                            key={star}
                                            onClick={() => setGuestContact(prev => ({ ...prev, rating: star } as any))}
                                            className="transform transition-all active:scale-90 hover:scale-110"
                                        >
                                            <Star 
                                                className={`w-10 h-10 ${(guestContact as any).rating >= star ? 'text-amber-400 fill-current' : 'text-gray-200'}`} 
                                            />
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-5">
                                {!user && (
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Tên của bạn (hoặc Biệt danh)</label>
                                        <input
                                            type="text"
                                            placeholder="Nguyễn Văn A"
                                            className="w-full px-5 py-4 bg-gray-50 border-2 border-transparent focus:border-primary-500 rounded-2xl outline-none transition-all font-bold text-sm"
                                            onChange={(e) => setGuestContact(prev => ({ ...prev, name: e.target.value }))}
                                        />
                                    </div>
                                )}

                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Nội dung nhận xét</label>
                                    <textarea
                                        rows={4}
                                        placeholder="Hãy chia sẻ trải nghiệm thực tế của bạn về chất lượng thi công, thái độ làm việc..."
                                        className="w-full px-5 py-4 bg-gray-50 border-2 border-transparent focus:border-primary-500 rounded-2xl outline-none transition-all font-bold text-sm resize-none"
                                        onChange={(e) => setGuestContact(prev => ({ ...prev, message: e.target.value }))}
                                    />
                                </div>

                                {/* Anonymous Toggle */}
                                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100 group hover:border-blue-200 transition-all cursor-pointer" onClick={() => setGuestContact(prev => ({ ...prev, isAnonymous: !prev.isAnonymous }))}>
                                    <div className="flex items-center gap-3">
                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${guestContact.isAnonymous ? 'bg-blue-600 text-white shadow-lg' : 'bg-white text-slate-400'}`}>
                                            <EyeOff className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <p className="text-[11px] font-black text-slate-900 uppercase tracking-tight">Đăng ẩn danh</p>
                                            <p className="text-[10px] text-slate-400 font-bold italic">Tên của bạn sẽ được ẩn đối với công chúng</p>
                                        </div>
                                    </div>
                                    <div className={`w-12 h-6 rounded-full relative transition-all ${guestContact.isAnonymous ? 'bg-blue-600' : 'bg-slate-200'}`}>
                                        <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${guestContact.isAnonymous ? 'left-7' : 'left-1'}`}></div>
                                    </div>
                                </div>
                            </div>

                            <button
                                onClick={() => {
                                    if (!guestContact.name || !guestContact.message) {
                                        toast.error('Vui lòng nhập tên và nội dung nhận xét!')
                                        return
                                    }
                                    const newReview = { ...guestContact, date: new Date().toISOString() }
                                    setLocalReviews([newReview, ...localReviews])
                                    toast.success('Gửi nhận xét thành công! Cảm ơn bạn.')
                                    setShowReviewModal(false)
                                    setGuestContact({ name: '', phone: '', message: '', rating: 5, isAnonymous: false })
                                }}
                                className="w-full py-5 bg-blue-600 text-white rounded-[24px] font-black uppercase tracking-[0.2em] text-[11px] shadow-xl shadow-blue-100 hover:bg-blue-700 transition-all flex items-center justify-center gap-3 active:scale-[0.98]"
                            >
                                Gửi nhận xét ngay <ArrowRight className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}


function SimilarContractors({ contractorId, skills }: { contractorId: string, skills: string[] }) {
    const [contractors, setContractors] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchSimilar = async () => {
            try {
                setLoading(true)
                const res = await fetch(`/api/contractors/public?limit=10`)
                const result = await res.json()
                const list = result.data || []
                const filtered = list.filter((c: any) => c.id !== contractorId)
                setContractors(filtered.slice(0, 3))
            } catch (err) {
                console.error('Failed to fetch similar contractors:', err)
            } finally {
                setLoading(false)
            }
        }
        fetchSimilar()
    }, [contractorId])

    if (loading) return null
    if (contractors.length === 0) return null

    return (
        <div>
            <div className="flex items-center justify-between mb-10">
                <div>
                    <h3 className="text-2xl font-black text-gray-900 mb-2 uppercase tracking-tight">Đối tác tương tự</h3>
                    <p className="text-gray-400 font-medium">Khám phá thêm các chuyên gia trong cùng lĩnh vực</p>
                </div>
                <Link href="/contractors" className="text-sm font-black text-blue-600 hover:text-blue-700 uppercase tracking-widest flex items-center gap-2 group">
                    Xem tất cả
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {contractors.map((c) => (
                    <Link key={c.id} href={`/contractors/${encodeId(c.id)}`} className="group">
                        <div className="bg-white rounded-3xl p-6 border border-gray-100 hover:border-blue-200 hover:shadow-xl transition-all duration-500 h-full flex flex-col">
                            <div className="flex items-center gap-4 mb-6">
                                <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center text-xl font-black text-slate-900 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                                    {c.displayName?.charAt(0)}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h4 className="font-bold text-gray-900 truncate group-hover:text-blue-600 transition-colors">{c.displayName}</h4>
                                    <div className="flex items-center gap-1 text-amber-400">
                                        <Star className="w-3 h-3 fill-current" />
                                        <span className="text-xs font-black text-gray-900">{c.avgRating || '5.0'}</span>
                                    </div>
                                </div>
                            </div>
                            <div className="flex flex-wrap gap-1.5 mb-6">
                                {c.skills?.slice(0, 2).map((s: string) => (
                                    <span key={s} className="px-2 py-1 bg-gray-50 text-gray-500 rounded-lg text-[9px] font-bold uppercase tracking-wider">
                                        {getSkillName(s)}
                                    </span>
                                ))}
                            </div>
                            <div className="mt-auto flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-blue-600">
                                <span>Xem hồ sơ</span>
                                <ArrowUpRight className="w-4 h-4 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                            </div>
                        </div>
                    </Link>
                ))}
            </div>
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

