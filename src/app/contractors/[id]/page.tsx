'use client'

/**
 * Public Contractor Portfolio Page
 * Detailed view of a contractor's skills, experience and ratings
 */

import { useState, useEffect, use } from 'react'
import Link from 'next/link'
import {
    ShieldCheck, Star, MapPin, Award,
    Briefcase, CheckCircle2, ArrowLeft,
    Mail, Phone, ExternalLink, Loader2,
    Hammer, Wrench, HardHat, Paintbrush, Zap
} from 'lucide-react'
import toast from 'react-hot-toast'

export default function ContractorPortfolio({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params)
    const [loading, setLoading] = useState(true)
    const [contractor, setContractor] = useState<any>(null)

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
        <div className="min-h-screen flex items-center justify-center bg-white">
            <Loader2 className="w-12 h-12 animate-spin text-blue-600" />
        </div>
    )

    if (!contractor) return (
        <div className="min-h-screen flex items-center justify-center bg-white">
            <div className="text-center">
                <h2 className="text-2xl font-black mb-4">Không tìm thấy đối tác</h2>
                <Link href="/contractors" className="text-blue-600 font-bold">Quay lại danh sách</Link>
            </div>
        </div>
    )

    return (
        <div className="min-h-screen bg-slate-50 pb-24">
            {/* Header Banner */}
            <div className="bg-slate-900 pt-20 pb-40 relative">
                <div className="max-w-7xl mx-auto px-6">
                    <Link href="/contractors" className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-12 font-bold">
                        <ArrowLeft className="w-5 h-5" />
                        Quay lại mạng lưới đối tác
                    </Link>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-6 -mt-32">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">

                    {/* Main Info Card */}
                    <div className="lg:col-span-8 space-y-10">
                        <div className="bg-white rounded-[48px] p-10 md:p-16 shadow-2xl shadow-slate-200/50 relative overflow-hidden">
                            {/* Profile Header */}
                            <div className="flex flex-col md:flex-row gap-10 items-center md:items-start mb-16">
                                <div className="w-40 h-40 bg-blue-50 rounded-[56px] flex items-center justify-center text-6xl font-black text-blue-600 shadow-xl shadow-blue-100/50">
                                    {contractor.displayName.charAt(0)}
                                </div>
                                <div className="flex-1 text-center md:text-left">
                                    <div className="flex flex-wrap justify-center md:justify-start items-center gap-4 mb-3">
                                        <h1 className="text-4xl md:text-5xl font-black text-slate-900">{contractor.displayName}</h1>
                                        <div className="px-5 py-2 bg-emerald-50 text-emerald-600 rounded-full text-xs font-black uppercase tracking-widest border border-emerald-100 flex items-center gap-2">
                                            <ShieldCheck className="w-4 h-4" />
                                            Đối tác xác thực
                                        </div>
                                    </div>
                                    <p className="text-xl text-slate-500 font-bold mb-8">
                                        {contractor.companyName || 'Nhà thầu xây dựng tự do'}
                                    </p>

                                    <div className="flex flex-wrap justify-center md:justify-start gap-8">
                                        <div className="text-center md:text-left">
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Kinh nghiệm</p>
                                            <p className="text-2xl font-black text-slate-900">{contractor.experienceYears} Năm</p>
                                        </div>
                                        <div className="w-px h-10 bg-slate-100 hidden md:block"></div>
                                        <div className="text-center md:text-left">
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Dự án hệ thống</p>
                                            <p className="text-2xl font-black text-slate-900">{contractor.totalProjectsCompleted || 0} Dự án</p>
                                        </div>
                                        <div className="w-px h-10 bg-slate-100 hidden md:block"></div>
                                        <div className="text-center md:text-left">
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Đánh giá TB</p>
                                            <div className="flex items-center gap-2 text-2xl font-black text-slate-900">
                                                <Star className="w-6 h-6 text-amber-500 fill-current" />
                                                {contractor.avgRating}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-12">
                                <div>
                                    <h3 className="text-2xl font-black text-slate-900 mb-6 flex items-center gap-3">
                                        <Briefcase className="w-6 h-6 text-blue-600" />
                                        Hồ sơ năng lực
                                    </h3>
                                    <p className="text-lg text-slate-600 leading-relaxed font-medium bg-slate-50 p-8 rounded-3xl italic">
                                        "{contractor.bio || 'Chưa cập nhật thông tin giới thiệu.'}"
                                    </p>
                                </div>

                                <div>
                                    <h3 className="text-2xl font-black text-slate-900 mb-6">Lĩnh vực chuyên môn</h3>
                                    <div className="flex flex-wrap gap-4">
                                        {contractor.skills.map((skill: string) => (
                                            <div key={skill} className="px-6 py-4 bg-white border-2 border-slate-100 rounded-2xl flex items-center gap-3 hover:border-blue-600 transition-all font-black text-slate-700">
                                                <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                                                {skill}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Achievement / Trust section */}
                        <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-[48px] p-16 text-white shadow-2xl shadow-blue-200">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
                                <div>
                                    <Award className="w-16 h-16 text-blue-300 mb-8" />
                                    <h3 className="text-3xl font-black mb-6">Cam kết chất lượng <br />từ SmartBuild</h3>
                                    <p className="text-blue-100 font-medium leading-relaxed">
                                        Đây là đối tác thuộc danh sách ưu tú của chúng tôi.
                                        Tất cả các thanh toán qua hệ thống được bảo vệ bởi Escrow,
                                        đảm bảo quyền lợi tuyệt đối cho khách hàng.
                                    </p>
                                </div>
                                <div className="bg-white/10 backdrop-blur-xl rounded-[32px] p-10 border border-white/20">
                                    <div className="flex items-center gap-4 mb-6 text-blue-200 font-black text-sm uppercase tracking-widest">
                                        Chỉ số tín nhiệm
                                    </div>
                                    <div className="space-y-6">
                                        <ScoreItem label="Đúng tiến độ" score="98%" />
                                        <ScoreItem label="Hài lòng khách hàng" score="4.9/5" />
                                        <ScoreItem label="Phản hồi nhanh" score="< 2h" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Sidebar: Call to action */}
                    <div className="lg:col-span-4 space-y-10">
                        <div className="bg-white rounded-[40px] p-10 border border-slate-100 shadow-xl shadow-slate-200/50 sticky top-10">
                            <h4 className="text-xl font-black text-slate-900 mb-8">Liên hệ trực tiếp</h4>

                            <div className="space-y-6 mb-10">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400">
                                        <MapPin className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Văn phòng tại</p>
                                        <p className="text-slate-900 font-bold">{contractor.address}, {contractor.city}</p>
                                    </div>
                                </div>
                                {/* We usually don't show real phone/email here unless logged in or through system */}
                                <div className="flex items-center gap-4 p-4 bg-blue-50 rounded-2xl border border-blue-100">
                                    <AlertCircle className="w-6 h-6 text-blue-600 shrink-0" />
                                    <p className="text-xs font-bold text-blue-700 leading-tight">
                                        Sử dụng hệ thống báo giá của SmartBuild để được bảo vệ quyền lợi và bảo hiểm công trình.
                                    </p>
                                </div>
                            </div>

                            <button className="w-full py-6 bg-blue-600 text-white font-black rounded-[24px] shadow-2xl shadow-blue-200 hover:scale-[1.02] active:scale-95 transition-all text-lg mb-4">
                                Yêu cầu báo giá ngay
                            </button>
                            <button className="w-full py-6 bg-white text-slate-600 font-black rounded-[24px] border-2 border-slate-100 hover:bg-slate-50 transition-all text-lg">
                                Gửi tin nhắn
                            </button>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    )
}

function ScoreItem({ label, score }: { label: string, score: string }) {
    return (
        <div className="flex justify-between items-center">
            <span className="font-bold opacity-80">{label}</span>
            <span className="text-xl font-black">{score}</span>
        </div>
    )
}

function AlertCircle({ className }: any) {
    return (
        <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
    )
}
