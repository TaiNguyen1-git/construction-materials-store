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

export default function ContractorPortfolio({ params }: { params: Promise<{ id: string }> }) {
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

    const handleGuestSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        toast.success('Đã gửi tin nhắn đến nhà thầu!')
        setShowChatModal(false)
        setGuestContact({ name: '', phone: '', message: '' })
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

    if (!contractor) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
                <div className="bg-white p-12 rounded-3xl shadow-xl text-center max-w-md border border-gray-100">
                    <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-6" />
                    <h2 className="text-2xl font-black text-gray-900 mb-2">Không tìm thấy hồ sơ</h2>
                    <p className="text-gray-500 mb-8 font-medium">Hồ sơ này không tồn tại hoặc đã bị ẩn khỏi hệ thống.</p>
                    <Link href="/contractors" className="inline-flex items-center gap-2 px-8 py-4 bg-primary-600 text-white font-black rounded-xl hover:bg-primary-700 transition-all shadow-lg shadow-primary-100">
                        <ArrowLeft className="w-5 h-5" />
                        Quay lại danh sách
                    </Link>
                </div>
            </div>
        )
    }

    const isTopRated = (contractor.avgRating || 0) >= 4.8
    const isExpert = (contractor.experienceYears || 0) >= 10
    const isAvailable = contractor.isAvailable !== false

    return (
        <div className="min-h-screen bg-slate-50 pb-20 font-sans">
            <Toaster position="top-right" />
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
                    </div>
                </div>

                {/* Content Layout */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* Main Content Column (8/12) */}
                    <div className="lg:col-span-8 space-y-8">
                        {/* Tabs Navigation */}
                        <div className="flex bg-white rounded-2xl shadow-sm border border-gray-100 p-1.5 gap-2">
                            <TabButton active={activeTab === 'about'} label="Giới thiệu hồ sơ" onClick={() => setActiveTab('about')} />
                            <TabButton active={activeTab === 'projects'} label="Công trình thực tế" onClick={() => setActiveTab('projects')} />
                            <TabButton active={activeTab === 'reviews'} label={`Nhận xét khách hàng (${contractor.reviewCount || 0})`} onClick={() => setActiveTab('reviews')} />
                        </div>

                        {/* About Content */}
                        {activeTab === 'about' && (
                            <div className="space-y-8 animate-in fade-in slide-in-from-left duration-500">
                                <div className="bg-white rounded-[32px] shadow-sm border border-gray-100 p-8 md:p-10">
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

                                {/* Trust Banner */}
                                <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-[32px] shadow-2xl p-10 text-white relative overflow-hidden group">
                                    <div className="absolute -right-20 -bottom-20 w-80 h-80 bg-white/10 rounded-full group-hover:scale-110 transition-transform duration-700"></div>
                                    <div className="relative z-10 flex flex-col md:flex-row items-center gap-10">
                                        <div className="flex-1 text-center md:text-left">
                                            <h3 className="text-2xl font-black mb-4 flex items-center justify-center md:justify-start gap-4">
                                                <ShieldCheck className="w-8 h-8 text-blue-200" />
                                                Bảo đảm quyền lợi khách hàng
                                            </h3>
                                            <p className="text-base opacity-90 font-medium max-w-xl mb-8 leading-relaxed">
                                                Dịch vụ được SmartBuild bảo trợ 100%. Mọi tranh chấp về chất lượng và tiến độ sẽ được chúng tôi đứng ra xử lý và đền bù thỏa đáng.
                                            </p>
                                            <div className="flex flex-wrap justify-center md:justify-start gap-4">
                                                <Bullet label="Thanh toàn bảo đảm" />
                                                <Bullet label="Vật tư đúng cam kết" />
                                                <Bullet label="Giám sát 24/7" />
                                            </div>
                                        </div>
                                        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 text-center border border-white/20 min-w-[160px]">
                                            <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-80 mb-2">Trạng thái</p>
                                            <div className="text-3xl font-black text-white px-2">CHUYÊN GIA</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Projects Content */}
                        {activeTab === 'projects' && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in slide-in-from-right duration-500">
                                {contractor.portfolioImages?.length > 0 ? (
                                    contractor.portfolioImages.map((img: string, idx: number) => (
                                        <div key={idx} className="relative aspect-video rounded-[32px] overflow-hidden group shadow-lg border border-gray-100 bg-gray-50">
                                            <img src={img} alt="Dự án mẫu" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex flex-col justify-end p-6">
                                                <h4 className="text-white font-black text-lg mb-1">
                                                    {contractor.portfolioDesc?.[idx] || "Dự án thi công thực tế"}
                                                </h4>
                                                <p className="text-white/60 text-xs font-bold uppercase tracking-widest">Xem chi tiết</p>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="col-span-full py-24 text-center bg-white rounded-[32px] border-2 border-dashed border-gray-100">
                                        <ImageIcon className="w-16 h-16 text-gray-200 mx-auto mb-4" />
                                        <h4 className="text-xl font-black text-gray-400 uppercase tracking-widest">Đang cập nhật hình ảnh dự án</h4>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Reviews Content */}
                        {activeTab === 'reviews' && (
                            <div className="space-y-6 animate-in fade-in slide-in-from-bottom duration-500">
                                {contractor.reviews?.length > 0 ? (
                                    contractor.reviews.map((review: any) => (
                                        <div key={review.id} className="p-8 bg-white rounded-[32px] border border-gray-100 shadow-sm hover:shadow-md transition-all">
                                            <div className="flex justify-between items-start mb-6">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-12 h-12 bg-slate-900 text-white rounded-xl flex items-center justify-center font-black shadow-lg">KH</div>
                                                    <div>
                                                        <h5 className="font-black text-gray-900">Khách hàng ẩn danh</h5>
                                                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                                                            Ngày: {new Date(review.createdAt).toLocaleDateString('vi-VN')}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="flex gap-1 text-amber-500">
                                                    {[...Array(5)].map((_, i) => (
                                                        <Star key={i} className={`w-4 h-4 ${i < review.rating ? 'fill-current' : 'opacity-20'}`} />
                                                    ))}
                                                </div>
                                            </div>
                                            <p className="text-gray-600 font-medium leading-relaxed italic text-lg border-l-4 border-blue-100 pl-6">
                                                "{review.comment}"
                                            </p>
                                        </div>
                                    ))
                                ) : (
                                    <div className="py-24 bg-white rounded-[32px] text-center border border-gray-100">
                                        <Users className="w-16 h-16 text-gray-200 mx-auto mb-4" />
                                        <h4 className="text-xl font-black text-gray-300 uppercase tracking-widest">Chưa có đánh giá nào</h4>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Sidebar Column (4/12) */}
                    <div className="lg:col-span-4">
                        <div className="sticky top-8 space-y-8">
                            {/* Sidebar Action Center */}
                            <div className="bg-white rounded-[32px] shadow-2xl border border-gray-100 p-8">
                                <h4 className="text-lg font-black text-gray-900 uppercase tracking-widest mb-8 border-b border-gray-50 pb-4">Liên kết nhanh</h4>

                                <div className="space-y-4 mb-8">
                                    <button
                                        onClick={() => setShowQuoteModal(true)}
                                        className="w-full py-5 bg-primary-600 text-white font-black rounded-2xl hover:bg-primary-700 transition-all shadow-xl shadow-primary-100 flex items-center justify-center gap-3 group"
                                    >
                                        <Calculator className="w-6 h-6" />
                                        Yêu cầu báo giá
                                        <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                    </button>
                                    <button
                                        onClick={handleChatClick}
                                        className="w-full py-5 bg-white text-slate-700 font-black rounded-2xl border-2 border-gray-100 hover:border-blue-600 hover:text-blue-600 transition-all flex items-center justify-center gap-3 shadow-md group"
                                    >
                                        <MessageSquare className="w-6 h-6 group-hover:fill-blue-100" />
                                        Gửi tin nhắn trực tiếp
                                    </button>
                                </div>

                                <div className="space-y-5 mb-8">
                                    <SideInfoItem icon={<MapPin className="w-5 h-5 text-primary-600" />} label="Khu vực thi công" val={contractor.city || 'Toàn quốc'} />
                                    <SideInfoItem icon={<Users className="w-5 h-5 text-primary-600" />} label="Quy mô nhân lực" val={`${contractor.teamSize || 1} Thành viên`} />
                                    <SideInfoItem icon={<Calendar className="w-5 h-5 text-primary-600" />} label="Tham gia từ năm" val={new Date(contractor.createdAt).getFullYear().toString()} />
                                </div>

                                <div className="flex gap-3 pt-6 border-t border-gray-50">
                                    <button
                                        onClick={() => setShowLoginModal(true)}
                                        className="flex-1 py-4 bg-red-50 text-red-500 rounded-2xl hover:bg-red-500 hover:text-white transition-all flex items-center justify-center shadow-sm"
                                    >
                                        <Heart className="w-6 h-6" />
                                    </button>
                                    <button
                                        onClick={async () => {
                                            await navigator.clipboard.writeText(window.location.href)
                                            toast.success('Đã sao chép link hồ sơ!')
                                        }}
                                        className="flex-1 py-4 bg-slate-50 text-slate-900 rounded-2xl hover:bg-primary-600 hover:text-white transition-all flex items-center justify-center shadow-sm"
                                    >
                                        <Share2 className="w-6 h-6" />
                                    </button>
                                </div>
                            </div>

                            {/* Trust Badge Card */}
                            <div className="bg-emerald-600 rounded-[32px] p-10 text-white text-center shadow-xl relative overflow-hidden group">
                                <div className="absolute -top-10 -left-10 w-32 h-32 bg-white/20 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700"></div>
                                <BadgeCheck className="w-20 h-20 mx-auto mb-4" />
                                <h5 className="text-xl font-black uppercase tracking-widest mb-2">SmartBuild Certified</h5>
                                <p className="text-sm font-bold opacity-80 italic leading-relaxed">Đối tác hạng Bạch kim đã qua các bước thẩm định khắt khe của hệ thống SmartBuild.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Modals */}
            {showQuoteModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
                    <div className="bg-white rounded-[32px] shadow-2xl max-w-2xl w-full p-10 md:p-12 animate-in fade-in zoom-in duration-300 relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-primary-600 to-indigo-600"></div>
                        <button onClick={() => setShowQuoteModal(false)} className="absolute top-8 right-8 p-3 text-gray-400 hover:text-gray-900 rounded-2xl hover:bg-gray-100 transition-all z-10"><X className="w-6 h-6" /></button>
                        <h3 className="text-3xl font-black text-gray-900 mb-2">Gửi yêu cầu báo giá</h3>
                        <p className="text-gray-500 font-bold mb-10 italic">Nhà thầu sẽ phản hồi trong vòng 24 giờ làm việc.</p>
                        <form className="space-y-8" onSubmit={(e) => { e.preventDefault(); toast.success('Đã gửi yêu cầu báo giá!'); setShowQuoteModal(false); }}>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Hạng mục xây dựng</label>
                                    <select className="w-full p-4 bg-gray-50 rounded-2xl border border-gray-100 font-bold text-gray-700 outline-none"><option>Xây thô & Nhân công</option><option>Hoàn thiện nội thất</option><option>Sửa chữa & Cải tạo</option></select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Diện tích công trình (m²)</label>
                                    <input type="number" placeholder="Nhập diện tích..." className="w-full p-4 bg-gray-50 rounded-2xl border border-gray-100 font-bold text-gray-700 outline-none" />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Chi tiết yêu cầu bổ sung</label>
                                <textarea className="w-full p-6 bg-gray-50 rounded-[28px] border border-gray-100 font-bold text-gray-700 outline-none resize-none" rows={4} placeholder="Ví dụ: Cần thi công gấp trong tháng sau, có kèm vật tư..."></textarea>
                            </div>
                            <button type="submit" className="w-full py-5 bg-primary-600 text-white font-black rounded-2xl hover:bg-primary-700 transition-all shadow-2xl flex items-center justify-center gap-3">
                                <Check className="w-6 h-6" />
                                Xác nhận gửi yêu cầu
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {showLoginModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
                    <div className="bg-white rounded-[40px] shadow-2xl max-w-md w-full p-12 text-center animate-in scale-95 duration-200">
                        <div className="w-24 h-24 bg-red-50 rounded-[32px] flex items-center justify-center mx-auto mb-8"><Heart className="w-12 h-12 text-red-500 fill-red-500" /></div>
                        <h3 className="text-3xl font-black text-gray-900 mb-4">Đăng nhập tài khoản</h3>
                        <p className="text-lg text-gray-500 font-medium mb-10 leading-relaxed">Bạn cần đăng nhập để lưu nhà thầu vào danh sách yêu thích và theo dõi tiến độ công trình.</p>
                        <Link href="/login" className="block w-full py-5 bg-blue-600 text-white font-black rounded-2xl mb-4 shadow-xl shadow-blue-200 hover:bg-blue-700 transition-colors">Đăng nhập ngay</Link>
                        <button onClick={() => setShowLoginModal(false)} className="text-sm font-black text-gray-400 hover:text-gray-900 border-b-2 border-transparent hover:border-gray-900 transition-all">Đóng lại</button>
                    </div>
                </div>
            )}

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
            className={`flex-1 py-4 text-xs font-black uppercase tracking-widest rounded-xl transition-all ${active ? 'bg-blue-600 text-white shadow-xl scale-[1.02]' : 'text-gray-400 hover:text-blue-600 hover:bg-blue-50'
                }`}
        >
            {label}
        </button>
    )
}

function Bullet({ label }: { label: string }) {
    return (
        <div className="flex items-center gap-2 text-xs font-black bg-white/5 px-4 py-2 rounded-xl border border-white/5">
            <Check className="w-4 h-4 text-emerald-400" />
            {label}
        </div>
    )
}

function SideInfoItem({ icon, label, val }: { icon: any, label: string, val: string }) {
    return (
        <div className="flex items-center gap-5 p-5 bg-gray-50 rounded-2xl border border-gray-100 group hover:bg-white hover:shadow-lg transition-all">
            <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                {icon}
            </div>
            <div>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1.5">{label}</p>
                <p className="text-base font-black text-gray-900 truncate">{val}</p>
            </div>
        </div>
    )
}
