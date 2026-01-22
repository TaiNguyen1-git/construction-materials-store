'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import {
    ArrowLeft, Scale, Star, Clock,
    CheckCircle2, ShieldCheck, MapPin,
    ArrowRight, Zap
} from 'lucide-react'
import Header from '@/components/Header'
import toast, { Toaster } from 'react-hot-toast'

// Loading component for Suspense fallback
function CompareLoading() {
    return (
        <div className="min-h-screen bg-slate-50">
            <Header />
            <div className="flex flex-col items-center justify-center pt-32 gap-4">
                <div className="w-12 h-12 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin"></div>
                <p className="text-gray-500 font-bold animate-pulse">Đang tải dữ liệu...</p>
            </div>
        </div>
    )
}

// Main component that uses useSearchParams
function ContractorCompareContent() {
    const searchParams = useSearchParams()
    const idsString = searchParams.get('ids') || ''
    const ids = idsString.split(',').filter(id => id.length > 0)

    const [contractors, setContractors] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (ids.length > 0) {
            fetchContractors()
        } else {
            setLoading(false)
        }
    }, [idsString])

    const fetchContractors = async () => {
        setLoading(true)
        try {
            const results = await Promise.all(
                ids.map(async (id) => {
                    const res = await fetch(`/api/contractors/public/${id}`)
                    if (res.ok) {
                        const data = await res.json()
                        return data.data
                    }
                    return null
                })
            )
            setContractors(results.filter(c => c !== null))
        } catch (err) {
            toast.error('Lỗi khi tải dữ liệu so sánh')
        } finally {
            setLoading(false)
        }
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50">
                <Header />
                <div className="flex flex-col items-center justify-center pt-32 gap-4">
                    <div className="w-12 h-12 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin"></div>
                    <p className="text-gray-500 font-bold animate-pulse">Đang đối soát dữ liệu...</p>
                </div>
            </div>
        )
    }

    if (contractors.length === 0) {
        return (
            <div className="min-h-screen bg-slate-50">
                <Header />
                <div className="max-w-4xl mx-auto px-4 pt-20 text-center">
                    <div className="w-24 h-24 bg-blue-50 rounded-[40px] flex items-center justify-center mx-auto mb-8 shadow-inner">
                        <Scale className="w-12 h-12 text-blue-200" />
                    </div>
                    <h2 className="text-3xl font-black text-gray-900 mb-4">Chưa chọn đối tác so sánh</h2>
                    <p className="text-gray-500 mb-10 max-w-sm mx-auto font-medium">Hãy chọn ít nhất 2 nhà thầu để chúng tôi giúp bạn phân tích năng lực chi tiết.</p>
                    <Link href="/contractors" className="inline-flex items-center gap-3 px-10 py-5 bg-blue-600 text-white font-black rounded-2xl hover:bg-blue-700 transition-all shadow-xl shadow-blue-100 italic">
                        <ArrowLeft className="w-5 h-5" />
                        Quay lại danh sách
                    </Link>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-slate-50 pb-32">
            <Toaster position="top-right" />
            <Header />

            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                {/* Modern Header Section */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 mb-16">
                    <div className="space-y-4">
                        <Link href="/contractors" className="group inline-flex items-center gap-2 text-gray-400 hover:text-blue-600 font-black text-xs uppercase tracking-widest transition-all">
                            <div className="p-2 bg-white rounded-xl shadow-sm group-hover:bg-blue-50 transition-colors">
                                <ArrowLeft className="w-4 h-4" />
                            </div>
                            Quay lại tìm kiếm
                        </Link>
                        <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight flex items-center gap-4">
                            So sánh nhà thầu
                            <Zap className="w-8 h-8 text-blue-600 fill-blue-600" />
                        </h1>
                        <p className="text-gray-400 font-bold max-w-md uppercase text-[10px] tracking-[0.2em]">Bảng phân tích đối soát năng lực thi công dựa trên dữ liệu thực tế</p>
                    </div>
                </div>

                {/* Modern Table Layout */}
                <div className="grid grid-cols-1 lg:grid-cols-4 bg-white rounded-[48px] shadow-2xl border border-gray-200 overflow-hidden">
                    {/* Labels Column */}
                    <div className="hidden lg:block bg-slate-50/50 border-r border-gray-200">
                        <div className="h-[320px] p-10 flex items-center border-b border-gray-200">
                            <div className="p-6 bg-white rounded-3xl shadow-sm border border-gray-200">
                                <Scale className="w-10 h-10 text-blue-600" />
                                <p className="mt-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Tiêu chí đối soát</p>
                            </div>
                        </div>
                        <div className="divide-y divide-gray-200">
                            {[
                                "Khu vực thi công",
                                "Điểm đánh giá",
                                "Kinh nghiệm thực tế",
                                "Số lượng công trình",
                                "Kỹ năng chuyên biệt",
                                "Trạng thái sẵn sàng"
                            ].map((label, idx) => (
                                <div key={idx} className="h-28 px-10 flex items-center">
                                    <span className="text-xs font-black text-gray-900 uppercase tracking-widest">{label}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Contractors Columns */}
                    <div className={`lg:col-span-3 grid grid-cols-1 md:grid-cols-${contractors.length} divide-x divide-gray-200`}>
                        {contractors.map((c, idx) => (
                            <div key={c.id} className="group hover:bg-blue-50/10 transition-colors">
                                {/* Contractor Header Card */}
                                <div className="h-[320px] p-8 text-center flex flex-col items-center justify-center border-b border-gray-200 relative">
                                    <div className="absolute top-6 right-6">
                                        <div className="px-3 py-1 bg-blue-50 text-blue-600 rounded-lg text-[9px] font-black uppercase tracking-widest border border-blue-200">#{idx + 1}</div>
                                    </div>
                                    <div className="relative group/avatar mb-6">
                                        <div className="w-24 h-24 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-[32px] flex items-center justify-center text-4xl font-black text-white shadow-2xl group-hover/avatar:scale-110 transition-transform duration-500">
                                            {c.displayName?.charAt(0)}
                                        </div>
                                        <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-white rounded-2xl flex items-center justify-center shadow-lg border border-gray-50">
                                            <ShieldCheck className="w-6 h-6 text-emerald-500" />
                                        </div>
                                    </div>
                                    <h3 className="text-xl font-black text-gray-900 mb-1 leading-tight">{c.displayName}</h3>
                                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-6">{c.companyName || 'SmartBuild Partner'}</p>
                                    <Link href={`/contractors/${c.id}`} className="px-6 py-2.5 bg-gray-50 text-gray-500 hover:bg-blue-600 hover:text-white rounded-xl text-[10px] font-black uppercase tracking-widest border border-gray-200 transition-all shadow-sm">
                                        Xem hồ sơ chi tiết
                                    </Link>
                                </div>

                                {/* Comparison Rows */}
                                <div className="divide-y divide-gray-200">
                                    {/* Khu vực */}
                                    <CompareCell mobileLabel="Khu vực thi công">
                                        <div className="flex flex-col items-center gap-2">
                                            <MapPin className="w-5 h-5 text-blue-500" />
                                            <p className="font-black text-gray-700">{c.city || 'Toàn quốc'}</p>
                                        </div>
                                    </CompareCell>

                                    {/* Đánh giá */}
                                    <CompareCell mobileLabel="Điểm đánh giá">
                                        <div className="flex flex-col items-center">
                                            <div className="flex gap-1 text-amber-500 mb-2">
                                                {[...Array(5)].map((_, i) => (
                                                    <Star key={i} className={`w-3.5 h-3.5 ${i < Math.floor(c.avgRating || 0) ? 'fill-current' : 'opacity-20'}`} />
                                                ))}
                                            </div>
                                            <span className="text-3xl font-black text-gray-900">{c.avgRating || 0}</span>
                                            <p className="text-[9px] text-gray-400 font-semibold uppercase tracking-[0.2em] mt-1">{c.reviewCount || 0} Nhận xét</p>
                                        </div>
                                    </CompareCell>

                                    {/* Kinh nghiệm */}
                                    <CompareCell mobileLabel="Kinh nghiệm thực tế">
                                        <div className="flex flex-col items-center">
                                            <span className="text-3xl font-black text-blue-600 italic">{(c.experienceYears || 0)}+</span>
                                            <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest">Năm thâm niên</p>
                                        </div>
                                    </CompareCell>

                                    {/* Công trình */}
                                    <CompareCell mobileLabel="Số lượng công trình">
                                        <div className="flex flex-col items-center">
                                            <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center mb-2 shadow-inner border border-emerald-200">
                                                <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                                            </div>
                                            <span className="text-2xl font-black text-gray-900">{c.totalProjectsCompleted || 0}</span>
                                            <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest">Dự án hoàn tất</p>
                                        </div>
                                    </CompareCell>


                                    {/* Kỹ năng */}
                                    <CompareCell mobileLabel="Kỹ năng chuyên biệt">
                                        <div className="flex flex-wrap justify-center gap-1.5 px-4 h-full content-center">
                                            {c.skills?.slice(0, 4).map((skill: string) => (
                                                <span key={skill} className="px-3 py-1 bg-white text-gray-500 text-[10px] font-bold uppercase rounded-lg border border-gray-200 shadow-sm">
                                                    {skill}
                                                </span>
                                            ))}
                                        </div>
                                    </CompareCell>

                                    {/* Sẵn sàng */}
                                    <CompareCell mobileLabel="Trạng thái hiện tại">
                                        <div className="flex flex-col items-center">
                                            {c.isAvailable !== false ? (
                                                <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-600 rounded-full text-[10px] font-black uppercase tracking-widest border border-emerald-200 shadow-sm animate-pulse">
                                                    <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                                                    Đang sẵn sàng
                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-400 rounded-full text-[10px] font-black uppercase tracking-widest">
                                                    <Clock className="w-4 h-4" />
                                                    Đang bận
                                                </div>
                                            )}
                                        </div>
                                    </CompareCell>
                                </div>

                                {/* Bottom CTA Area */}
                                <div className="p-8 pb-12 bg-slate-50/30">
                                    <Link
                                        href={`/contact?contractor=${c.displayName}`}
                                        className="w-full flex items-center justify-center gap-3 py-5 bg-blue-600 text-white font-black rounded-3xl hover:bg-blue-700 transition-all shadow-xl shadow-blue-100 group/btn"
                                    >
                                        Liên hệ báo giá
                                        <ArrowRight className="w-5 h-5 group-hover/btn:translate-x-1 transition-transform" />
                                    </Link>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )
}

function CompareCell({ children, mobileLabel }: { children: React.ReactNode, mobileLabel: string }) {
    return (
        <div className="h-28 flex flex-col items-center justify-center px-4 relative">
            <span className="lg:hidden absolute top-4 text-[8px] font-black text-gray-300 uppercase tracking-widest">{mobileLabel}</span>
            {children}
        </div>
    )
}

// Default export with Suspense boundary
export default function ContractorCompare() {
    return (
        <Suspense fallback={<CompareLoading />}>
            <ContractorCompareContent />
        </Suspense>
    )
}
