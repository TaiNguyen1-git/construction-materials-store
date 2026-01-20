'use client'

/**
 * Admin Contractor Detail Page
 * Deep-dive into a specific contractor's profile, history and metrics
 */

import { useState, useEffect, use } from 'react'
import Link from 'next/link'
import {
    ArrowLeft, ShieldCheck, Star, Briefcase,
    DollarSign, MapPin, Phone, Mail, Clock,
    CheckCircle2, AlertCircle, ExternalLink,
    Users, Building, LucideIcon, Loader2,
    Calendar, FileText, TrendingUp, Wallet
} from 'lucide-react'
import toast from 'react-hot-toast'

export default function AdminContractorDetail({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params)
    const [loading, setLoading] = useState(true)
    const [data, setData] = useState<any>(null)
    const [actionLoading, setActionLoading] = useState(false)

    useEffect(() => {
        fetchContractorDetails()
    }, [id])

    const fetchContractorDetails = async () => {
        setLoading(true)
        try {
            const res = await fetch(`/api/admin/contractors/${id}`)
            if (res.ok) {
                const result = await res.json()
                setData(result.data)
            } else {
                toast.error('Không tìm thấy nhà thầu')
            }
        } catch (err) {
            toast.error('Lỗi khi tải dữ liệu')
        } finally {
            setLoading(false)
        }
    }

    const handleVerify = async (status: 'VERIFIED' | 'REJECTED') => {
        setActionLoading(true)
        try {
            const res = await fetch(`/api/admin/contractors/verify`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ profileId: id, status })
            })

            if (res.ok) {
                toast.success('Đã cập nhật trạng thái xác thực')
                fetchContractorDetails()
            } else {
                toast.error('Lỗi khi cập nhật')
            }
        } catch (err) {
            toast.error('Lỗi kết nối')
        } finally {
            setActionLoading(false)
        }
    }

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50">
            <div className="text-center">
                <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
                <p className="text-slate-500 font-bold">Đang tải hồ sơ chuyên sâu...</p>
            </div>
        </div>
    )

    if (!data) return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50">
            <div className="text-center bg-white p-12 rounded-[40px] shadow-xl border border-slate-200">
                <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                <h2 className="text-2xl font-black text-slate-900">Không tìm thấy dữ liệu</h2>
                <Link href="/admin/contractors" className="mt-6 inline-block text-blue-600 font-bold">Quay lại danh sách</Link>
            </div>
        </div>
    )

    const { profile, projectHistory, summary } = data

    return (
        <div className="min-h-screen bg-[#F8FAFC] pb-24">
            {/* Top sticky header */}
            <div className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-slate-200">
                <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
                    <Link href="/admin/contractors" className="flex items-center gap-2 text-slate-500 hover:text-blue-600 font-bold transition-all">
                        <ArrowLeft className="w-5 h-5" />
                        Danh sách đối tác
                    </Link>
                    <div className="flex items-center gap-3">
                        {profile.onboardingStatus === 'PENDING_REVIEW' && (
                            <>
                                <button
                                    onClick={() => handleVerify('REJECTED')}
                                    disabled={actionLoading}
                                    className="px-6 py-2.5 bg-red-50 text-red-600 font-bold rounded-xl border border-red-100 hover:bg-red-100 transition-all text-sm"
                                >
                                    Từ chối
                                </button>
                                <button
                                    onClick={() => handleVerify('VERIFIED')}
                                    disabled={actionLoading}
                                    className="px-6 py-2.5 bg-blue-600 text-white font-bold rounded-xl shadow-lg shadow-blue-200 hover:scale-[1.02] active:scale-95 transition-all text-sm"
                                >
                                    Duyệt xác thực
                                </button>
                            </>
                        )}
                        {profile.isVerified && (
                            <span className="px-4 py-2 bg-emerald-50 text-emerald-600 font-black rounded-xl border border-emerald-100 flex items-center gap-2 text-sm uppercase tracking-tight">
                                <ShieldCheck className="w-4 h-4" />
                                Đối tác đã xác thực
                            </span>
                        )}
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-6 mt-10">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">

                    {/* Left Column: Profile Card */}
                    <div className="lg:col-span-4 space-y-8">
                        <div className="bg-white rounded-[40px] border border-slate-200 shadow-xl shadow-slate-200/50 overflow-hidden">
                            <div className="bg-gradient-to-br from-blue-600 to-indigo-700 p-10 text-white text-center">
                                <div className="w-24 h-24 bg-white/20 backdrop-blur-md border border-white/30 rounded-[32px] flex items-center justify-center text-4xl font-black mx-auto mb-6">
                                    {profile.displayName.charAt(0)}
                                </div>
                                <h2 className="text-2xl font-black mb-1">{profile.displayName}</h2>
                                <p className="text-blue-100 font-medium opacity-80">{profile.companyName || 'Đối tác cá nhân'}</p>

                                <div className="mt-8 flex items-center justify-center gap-6">
                                    <div className="text-center">
                                        <p className="text-2xl font-black">{profile.avgRating}</p>
                                        <p className="text-[10px] font-black uppercase tracking-widest opacity-60">Avg Rating</p>
                                    </div>
                                    <div className="w-px h-8 bg-white/20"></div>
                                    <div className="text-center">
                                        <p className="text-2xl font-black">{profile.trustScore}</p>
                                        <p className="text-[10px] font-black uppercase tracking-widest opacity-60">Trust Score</p>
                                    </div>
                                </div>
                            </div>

                            <div className="p-10 space-y-8">
                                <InfoItem icon={Mail} label="Email liên hệ" value={profile.email || profile.user.email} />
                                <InfoItem icon={Phone} label="Số điện thoại" value={profile.phone || profile.user.phone} />
                                <InfoItem icon={MapPin} label="Khu vực hoạt động" value={`${profile.district || 'N/A'}, ${profile.city || 'N/A'}`} />
                                <InfoItem icon={Briefcase} label="Kinh nghiệm" value={`${profile.experienceYears} năm làm nghề`} />

                                <div className="pt-8 border-t border-slate-100">
                                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[2px] mb-4">Kỹ năng chuyên môn</h4>
                                    <div className="flex flex-wrap gap-2">
                                        {profile.skills.map((s: string) => (
                                            <span key={s} className="px-3 py-1.5 bg-slate-50 text-slate-600 rounded-lg text-xs font-black border border-slate-100">
                                                {s}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Quick Actions Card */}
                        <div className="bg-white rounded-[32px] border border-slate-200 p-8 shadow-sm">
                            <h4 className="font-black text-slate-900 mb-6 flex items-center gap-2">
                                <TrendingUp className="w-5 h-5 text-blue-600" />
                                Thao tác nhanh
                            </h4>
                            <div className="grid grid-cols-1 gap-3">
                                <ActionButton icon={FileText} label="Xuất hồ sơ năng lực (PDF)" />
                                <ActionButton icon={DollarSign} label="Điều chỉnh hạn mức nợ" />
                                <ActionButton icon={AlertCircle} label="Gửi thông báo vi phạm" color="red" />
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Stats & Projects */}
                    <div className="lg:col-span-8 space-y-10">

                        {/* Stats Overview Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <HighlightCard
                                icon={DollarSign}
                                label="Tổng thu nhập"
                                value={summary.totalEarnings.toLocaleString('vi-VN')}
                                sub="VNĐ thực nhận"
                                color="emerald"
                            />
                            <HighlightCard
                                icon={Wallet}
                                label="Đang giữ Escrow"
                                value={summary.pendingEscrow.toLocaleString('vi-VN')}
                                sub="Chờ giải ngân"
                                color="amber"
                            />
                            <HighlightCard
                                icon={Calendar}
                                label="Dự án thực hiện"
                                value={summary.totalProjects}
                                sub={`${summary.activeProjects} đang chạy`}
                                color="blue"
                            />
                        </div>

                        {/* Project History */}
                        <div className="bg-white rounded-[40px] border border-slate-200 shadow-sm overflow-hidden">
                            <div className="px-10 py-8 border-b border-slate-100 flex items-center justify-between">
                                <h3 className="text-xl font-black text-slate-900 flex items-center gap-3">
                                    <Briefcase className="w-6 h-6 text-blue-600" />
                                    Lịch sử dự án & Công trình
                                </h3>
                            </div>
                            <div className="divide-y divide-slate-100">
                                {projectHistory.length === 0 ? (
                                    <div className="p-20 text-center">
                                        <p className="text-slate-400 font-bold">Chưa có dữ liệu dự án</p>
                                    </div>
                                ) : (
                                    projectHistory.map((p: any) => (
                                        <div key={p.id} className="p-8 hover:bg-slate-50/50 transition-all flex items-center justify-between group">
                                            <div className="flex items-center gap-6">
                                                <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 group-hover:bg-blue-50 group-hover:text-blue-600 transition-all">
                                                    <Building className="w-6 h-6" />
                                                </div>
                                                <div>
                                                    <h5 className="font-bold text-slate-900 text-lg">{p.title}</h5>
                                                    <p className="text-sm text-slate-500 font-medium mt-0.5">
                                                        Bắt đầu: {new Date(p.createdAt).toLocaleDateString('vi-VN')}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-12">
                                                <div className="text-right">
                                                    <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Dòng tiền</p>
                                                    <p className="font-black text-slate-900 text-base">
                                                        {(p.releasedAmount / 1000000).toFixed(1)}M
                                                        <span className="text-slate-400 font-medium ml-1">/ {(p.totalAmount / 1000000).toFixed(1)}M</span>
                                                    </p>
                                                </div>
                                                <div className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-tighter border ${p.status === 'COMPLETED' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                                                        p.status === 'ACCEPTED' ? 'bg-blue-50 text-blue-600 border-blue-100' :
                                                            'bg-slate-50 text-slate-500 border-slate-100'
                                                    }`}>
                                                    {p.status}
                                                </div>
                                                <Link href={`/admin/projects/${p.id}`} className="p-2 text-slate-300 hover:text-blue-600 transition-all">
                                                    <ExternalLink className="w-5 h-5" />
                                                </Link>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>

                        {/* Profile Bio / About */}
                        <div className="bg-white rounded-[40px] border border-slate-200 p-10 shadow-sm">
                            <h4 className="text-xl font-black text-slate-900 mb-6">Giới thiệu về đối tác</h4>
                            <p className="text-slate-600 leading-relaxed font-medium text-lg italic bg-slate-50 p-8 rounded-3xl border-l-4 border-blue-600">
                                "{profile.bio || 'Nhà thầu chưa cập nhật phần giới thiệu cá nhân.'}"
                            </p>
                        </div>

                    </div>
                </div>
            </div>
        </div>
    )
}

function InfoItem({ icon: Icon, label, value }: { icon: LucideIcon, label: string, value: string }) {
    return (
        <div className="flex items-start gap-4">
            <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center shrink-0">
                <Icon className="w-5 h-5 text-slate-400" />
            </div>
            <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{label}</p>
                <p className="text-slate-900 font-bold leading-tight">{value}</p>
            </div>
        </div>
    )
}

function HighlightCard({ icon: Icon, label, value, sub, color }: any) {
    const colors: any = {
        emerald: 'bg-emerald-600',
        amber: 'bg-amber-500',
        blue: 'bg-blue-600'
    }
    return (
        <div className="bg-white p-8 rounded-[40px] border border-slate-200 shadow-sm relative overflow-hidden group">
            <div className="p-3 bg-slate-50 rounded-2xl inline-block mb-6 group-hover:scale-110 transition-all">
                <Icon className={`w-6 h-6 text-slate-400`} />
            </div>
            <p className="text-slate-400 font-bold text-sm mb-1">{label}</p>
            <div className="flex items-baseline gap-1">
                <h4 className="text-2xl font-black text-slate-900">{value}</h4>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">VNĐ</span>
            </div>
            <p className="text-xs font-bold text-slate-500 mt-2">{sub}</p>
            <div className={`absolute top-0 right-0 w-2 h-full ${colors[color]}`}></div>
        </div>
    )
}

function ActionButton({ icon: Icon, label, color = 'blue' }: { icon: LucideIcon, label: string, color?: string }) {
    const colors: any = {
        blue: 'text-blue-600 bg-blue-50 border-blue-100 hover:bg-blue-100',
        red: 'text-red-600 bg-red-50 border-red-100 hover:bg-red-100'
    }
    return (
        <button className={`flex items-center gap-3 p-4 rounded-2xl border transition-all text-sm font-bold ${colors[color]}`}>
            <Icon className="w-5 h-5" />
            {label}
        </button>
    )
}
