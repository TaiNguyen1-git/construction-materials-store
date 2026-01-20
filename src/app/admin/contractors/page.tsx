'use client'

/**
 * Admin Contractor Management Dashboard
 * Overview of all contractors with key metrics
 */

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
    Users, Briefcase, TrendingUp, Star,
    Search, Filter, ExternalLink, ShieldCheck,
    AlertCircle, ChevronRight, Loader2,
    MapPin, DollarSign, CheckCircle2, UserX
} from 'lucide-react'
import toast from 'react-hot-toast'

export default function AdminContractorDashboard() {
    const [loading, setLoading] = useState(true)
    const [contractors, setContractors] = useState<any[]>([])
    const [searchTerm, setSearchTerm] = useState('')
    const [statusFilter, setStatusFilter] = useState('ALL')

    useEffect(() => {
        fetchContractors()
    }, [])

    const fetchContractors = async () => {
        setLoading(true)
        try {
            const res = await fetch('/api/admin/contractors')
            if (res.ok) {
                const data = await res.json()
                setContractors(data.data)
            }
        } catch (err) {
            toast.error('Lỗi khi tải danh sách nhà thầu')
        } finally {
            setLoading(false)
        }
    }

    const filteredContractors = contractors.filter(c => {
        const matchesSearch =
            c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            c.companyName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            c.email.toLowerCase().includes(searchTerm.toLowerCase())

        if (statusFilter === 'ALL') return matchesSearch
        if (statusFilter === 'VERIFIED') return matchesSearch && c.isVerified
        if (statusFilter === 'PENDING') return matchesSearch && c.onboardingStatus === 'PENDING_REVIEW'
        if (statusFilter === 'INCOMPLETE') return matchesSearch && c.onboardingStatus === 'INCOMPLETE'

        return matchesSearch
    })

    // Calculate summary stats
    const totalContractors = contractors.length
    const activeProjects = contractors.reduce((sum, c) => sum + c.stats.activeProjects, 0)
    const totalRevenue = contractors.reduce((sum, c) => sum + c.stats.totalEarnings, 0)
    const avgRating = contractors.length > 0
        ? (contractors.reduce((sum, c) => sum + c.avgRating, 0) / contractors.length).toFixed(1)
        : 0

    return (
        <div className="min-h-screen bg-[#F8FAFC] pb-20">
            {/* Header & Stats Banner */}
            <div className="bg-white border-b border-slate-200">
                <div className="max-w-[1600px] mx-auto px-6 py-8">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
                        <div>
                            <h1 className="text-3xl font-black text-slate-900 flex items-center gap-3">
                                <Users className="w-8 h-8 text-blue-600" />
                                Quản lý Nhà thầu
                            </h1>
                            <p className="text-slate-500 mt-1 font-medium text-lg">Hệ thống giám sát hiệu suất và tài chính đối tác</p>
                        </div>
                        <div className="flex items-center gap-3">
                            <Link
                                href="/admin/onboarding"
                                className="px-6 py-3 bg-blue-600 text-white font-bold rounded-2xl shadow-xl shadow-blue-100 hover:scale-[1.02] active:scale-95 transition-all text-sm"
                            >
                                + Thêm thầu mới
                            </Link>
                            <button className="p-3 bg-slate-50 text-slate-400 rounded-2xl border border-slate-100 hover:text-blue-600 transition-all">
                                <Filter className="w-5 h-5" />
                            </button>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <StatCard
                            icon={<Users className="w-6 h-6 text-blue-600" />}
                            label="Tổng số đối tác"
                            value={totalContractors}
                            trend="+12% tháng này"
                            color="blue"
                        />
                        <StatCard
                            icon={<Briefcase className="w-6 h-6 text-indigo-600" />}
                            label="Dự án đang chạy"
                            value={activeProjects}
                            trend="Tăng 5 dự án"
                            color="indigo"
                        />
                        <StatCard
                            icon={<TrendingUp className="w-6 h-6 text-emerald-600" />}
                            label="Doanh thu tích lũy"
                            value={`${(totalRevenue / 1000000).toFixed(1)}M`}
                            trend="VNĐ"
                            color="emerald"
                        />
                        <StatCard
                            icon={<Star className="w-6 h-6 text-amber-500" />}
                            label="Rating trung bình"
                            value={avgRating}
                            trend="Trên 5.0"
                            color="amber"
                        />
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-[1600px] mx-auto px-6 mt-10">
                {/* Filters & Search */}
                <div className="flex flex-col md:flex-row items-center justify-between gap-6 bg-white p-6 rounded-[32px] border border-slate-200 mb-8 shadow-sm">
                    <div className="relative flex-1 w-full">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Tìm kiếm theo tên, công ty, email..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-12 pr-6 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:bg-white focus:border-blue-500 transition-all font-medium"
                        />
                    </div>
                    <div className="flex items-center gap-2 bg-slate-50 p-1.5 rounded-2xl border border-slate-100">
                        {['ALL', 'VERIFIED', 'PENDING', 'INCOMPLETE'].map((s) => (
                            <button
                                key={s}
                                onClick={() => setStatusFilter(s)}
                                className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${statusFilter === s
                                        ? 'bg-white text-blue-600 shadow-sm border border-slate-200'
                                        : 'text-slate-500 hover:text-slate-800'
                                    }`}
                            >
                                {s === 'ALL' ? 'Tất cả' : s === 'VERIFIED' ? 'Đã xác thực' : s === 'PENDING' ? 'Chờ duyệt' : 'Chưa xong'}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Table Section */}
                <div className="bg-white rounded-[40px] border border-slate-200 overflow-hidden shadow-xl shadow-slate-200/50">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50/50">
                                    <th className="px-8 py-6 text-sm font-black text-slate-400 uppercase tracking-wider">Thông tin nhà thầu</th>
                                    <th className="px-6 py-6 text-sm font-black text-slate-400 uppercase tracking-wider text-center">Trạng thái</th>
                                    <th className="px-6 py-6 text-sm font-black text-slate-400 uppercase tracking-wider text-center">Hiệu suất</th>
                                    <th className="px-6 py-6 text-sm font-black text-slate-400 uppercase tracking-wider text-right">Dòng tiền</th>
                                    <th className="px-8 py-6 text-sm font-black text-slate-400 uppercase tracking-wider"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {loading ? (
                                    <tr>
                                        <td colSpan={5} className="py-20 text-center">
                                            <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto" />
                                            <p className="text-slate-500 mt-4 font-bold">Đang tải dữ liệu thầu...</p>
                                        </td>
                                    </tr>
                                ) : filteredContractors.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="py-20 text-center">
                                            <UserX className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                                            <p className="text-slate-500 font-bold">Không tìm thấy nhà thầu nào</p>
                                        </td>
                                    </tr>
                                ) : (
                                    filteredContractors.map((c) => (
                                        <tr key={c.id} className="hover:bg-slate-50/50 transition-all group">
                                            <td className="px-8 py-6">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-14 h-14 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-[22px] flex items-center justify-center text-blue-600 font-black text-xl border border-blue-100/50 shadow-sm relative group-hover:scale-105 transition-all">
                                                        {c.name.charAt(0)}
                                                        {c.isVerified && (
                                                            <div className="absolute -top-1 -right-1 w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center border-2 border-white shadow-sm">
                                                                <CheckCircle2 className="w-3 h-3 text-white" />
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div>
                                                        <div className="flex items-center gap-2">
                                                            <h4 className="font-bold text-slate-900 text-lg">{c.name}</h4>
                                                        </div>
                                                        <div className="flex flex-col gap-0.5">
                                                            <p className="text-sm text-slate-500 font-medium">{c.companyName || 'Đối tác cá nhân'}</p>
                                                            <div className="flex items-center gap-3 text-xs text-slate-400 mt-1">
                                                                <span className="flex items-center gap-1">
                                                                    <MapPin className="w-3 h-3" /> {c.city || 'N/A'}
                                                                </span>
                                                                <span className="flex items-center gap-1">
                                                                    <AlertCircle className="w-3 h-3" /> Score: {c.trustScore}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-6 text-center">
                                                <StatusBadge status={c.onboardingStatus} isVerified={c.isVerified} />
                                            </td>
                                            <td className="px-6 py-6 text-center">
                                                <div className="flex flex-col items-center">
                                                    <div className="flex items-center gap-1 text-amber-500 mb-1">
                                                        <Star className="w-4 h-4 fill-current" />
                                                        <span className="font-black text-slate-900">{c.avgRating}</span>
                                                    </div>
                                                    <p className="text-xs text-slate-400 font-bold">{c.stats.completedProjects} dự án xong</p>
                                                </div>
                                            </td>
                                            <td className="px-6 py-6 text-right">
                                                <div>
                                                    <p className="font-black text-slate-900 text-lg">
                                                        {c.stats.totalEarnings.toLocaleString('vi-VN')}
                                                        <span className="text-slate-400 text-xs ml-1">đ</span>
                                                    </p>
                                                    <p className="text-xs text-emerald-600 font-bold">
                                                        {c.stats.activeProjects} dự án đang chạy
                                                    </p>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6 text-right">
                                                <Link
                                                    href={`/admin/contractors/${c.id}`}
                                                    className="inline-flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 text-slate-600 rounded-xl font-bold text-sm hover:bg-slate-900 hover:text-white hover:border-slate-900 transition-all active:scale-95"
                                                >
                                                    Chi tiết
                                                    <ChevronRight className="w-4 h-4" />
                                                </Link>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    )
}

function StatCard({ icon, label, value, trend, color }: any) {
    const colors: any = {
        blue: 'bg-blue-50 text-blue-600',
        indigo: 'bg-indigo-50 text-indigo-600',
        emerald: 'bg-emerald-50 text-emerald-600',
        amber: 'bg-amber-50 text-amber-500'
    }
    return (
        <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm hover:shadow-md transition-all group overflow-hidden relative">
            <div className="flex items-center gap-4 mb-4 relative z-10">
                <div className={`p-3 rounded-2xl ${colors[color]} group-hover:scale-110 transition-all`}>
                    {icon}
                </div>
                <p className="text-slate-500 font-bold text-sm uppercase tracking-wider">{label}</p>
            </div>
            <div className="flex items-baseline gap-3 relative z-10">
                <h3 className="text-3xl font-black text-slate-900">{value}</h3>
                <span className={`text-xs font-black ${color === 'amber' ? 'text-amber-600' : 'text-emerald-500'}`}>{trend}</span>
            </div>
            <div className={`absolute -right-6 -bottom-6 w-24 h-24 ${colors[color]} rounded-full opacity-5 scale-150`}></div>
        </div>
    )
}

function StatusBadge({ status, isVerified }: any) {
    if (isVerified) {
        return (
            <span className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-emerald-50 text-emerald-700 rounded-full text-xs font-black border border-emerald-100 uppercase tracking-tighter">
                <ShieldCheck className="w-3 h-3" />
                Xác thực
            </span>
        )
    }

    if (status === 'PENDING_REVIEW') {
        return (
            <span className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-blue-50 text-blue-700 rounded-full text-xs font-black border border-blue-100 uppercase tracking-tighter">
                <Loader2 className="w-3 h-3 animate-spin" />
                Chờ duyệt
            </span>
        )
    }

    if (status === 'REJECTED') {
        return (
            <span className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-red-50 text-red-700 rounded-full text-xs font-black border border-red-100 uppercase tracking-tighter">
                <XCircle className="w-3 h-3" />
                Từ chối
            </span>
        )
    }

    return (
        <span className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-slate-100 text-slate-500 rounded-full text-xs font-black border border-slate-200 uppercase tracking-tighter">
            Chưa xong
        </span>
    )
}

function XCircle({ className }: any) {
    return (
        <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" /><path d="m15 9-6 6" /><path d="m9 9 6 6" />
        </svg>
    )
}
