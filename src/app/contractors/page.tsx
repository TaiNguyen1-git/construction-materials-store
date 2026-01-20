'use client'

/**
 * Public Contractor Marketplace
 * List all verified contractors for customers to browse
 */

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
    Users, MapPin, Star, ShieldCheck,
    Search, Filter, ArrowRight, Loader2,
    Briefcase, Award, Hammer, Wrench, Paintbrush,
    Zap, Droplets, HardHat
} from 'lucide-react'
import toast from 'react-hot-toast'

const CATEGORIES = [
    { id: 'all', name: 'Tất cả', icon: Users },
    { id: 'Xây thô', name: 'Xây thô', icon: HardHat },
    { id: 'Điện nước', name: 'Điện nước', icon: Zap },
    { id: 'Sơn bả', name: 'Sơn bả', icon: Paintbrush },
    { id: 'Nội thất', name: 'Nội thất', icon: Briefcase },
    { id: 'Sửa chữa', name: 'Sửa chữa', icon: Wrench },
]

export default function ContractorMarketplace() {
    const [loading, setLoading] = useState(true)
    const [contractors, setContractors] = useState<any[]>([])
    const [filter, setFilter] = useState('all')
    const [searchTerm, setSearchTerm] = useState('')

    useEffect(() => {
        fetchContractors()
    }, [filter])

    const fetchContractors = async () => {
        setLoading(true)
        try {
            const url = filter === 'all'
                ? '/api/contractors/public'
                : `/api/contractors/public?skill=${encodeURIComponent(filter)}`
            const res = await fetch(url)
            if (res.ok) {
                const data = await res.json()
                setContractors(data.data)
            }
        } catch (err) {
            toast.error('Lỗi khi tải danh sách đối tác')
        } finally {
            setLoading(false)
        }
    }

    const filteredContractors = contractors.filter(c =>
        c.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.companyName?.toLowerCase().includes(searchTerm.toLowerCase())
    )

    return (
        <div className="min-h-screen bg-[#FDFDFD]">
            {/* Hero Section */}
            <div className="bg-slate-900 pt-32 pb-24 relative overflow-hidden">
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10"></div>
                <div className="max-w-7xl mx-auto px-6 relative z-10 text-center">
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500/10 border border-blue-500/20 rounded-full text-blue-400 text-sm font-bold mb-6">
                        <Award className="w-4 h-4" />
                        Hệ thống đối tác chiến lược
                    </div>
                    <h1 className="text-4xl md:text-6xl font-black text-white mb-6 leading-tight">
                        Kết nối <span className="text-blue-500">Nhà thầu</span> <br />
                        Uy tín nhất cho công trình
                    </h1>
                    <p className="text-slate-400 text-lg max-w-2xl mx-auto mb-10 font-medium">
                        Tất cả đối tác đều được đội ngũ chuyên môn kiểm tra hồ sơ năng lực
                        và chứng chỉ hành nghề trước khi gia nhập hệ thống.
                    </p>

                    <div className="max-w-3xl mx-auto relative group">
                        <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-3xl blur opacity-30 group-hover:opacity-50 transition duration-1000"></div>
                        <div className="relative flex items-center bg-white rounded-2xl md:rounded-[32px] p-2 shadow-2xl">
                            <div className="flex-1 flex items-center px-4">
                                <Search className="w-6 h-6 text-slate-400" />
                                <input
                                    type="text"
                                    placeholder="Tìm nhà thầu, công ty xây dựng..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full px-4 py-4 md:py-6 outline-none text-slate-900 font-bold text-lg"
                                />
                            </div>
                            <button className="hidden md:block px-8 py-4 md:py-6 bg-blue-600 text-white font-black rounded-[24px] hover:bg-blue-700 transition-all">
                                Tìm ngay
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-6 -mt-10 mb-20 relative z-20">
                {/* Category Filters */}
                <div className="flex flex-wrap gap-4 mb-12">
                    {CATEGORIES.map((cat) => {
                        const Icon = cat.icon
                        return (
                            <button
                                key={cat.id}
                                onClick={() => setFilter(cat.id)}
                                className={`flex items-center gap-3 px-8 py-5 rounded-[24px] transition-all font-black border-2 ${filter === cat.id
                                        ? 'bg-white border-blue-600 text-blue-600 shadow-xl shadow-blue-50'
                                        : 'bg-white border-slate-100 text-slate-400 hover:border-slate-200 hover:text-slate-600 shadow-sm'
                                    }`}
                            >
                                <Icon className={`w-5 h-5 ${filter === cat.id ? 'text-blue-600' : 'text-slate-400'}`} />
                                {cat.name}
                            </button>
                        )
                    })}
                </div>

                {/* Listing Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {loading ? (
                        Array(6).fill(0).map((_, i) => (
                            <div key={i} className="bg-white rounded-[40px] h-96 animate-pulse border border-slate-100"></div>
                        ))
                    ) : filteredContractors.length === 0 ? (
                        <div className="col-span-full py-32 text-center bg-white rounded-[40px] border border-dashed border-slate-200">
                            <Users className="w-16 h-16 text-slate-200 mx-auto mb-4" />
                            <h3 className="text-2xl font-black text-slate-900">Không tìm thấy nhà thầu</h3>
                            <p className="text-slate-400 mt-2">Vui lòng thử lại với từ khóa hoặc danh mục khác.</p>
                        </div>
                    ) : (
                        filteredContractors.map((c) => (
                            <Link
                                href={`/contractors/${c.id}`}
                                key={c.id}
                                className="group bg-white rounded-[40px] border border-slate-100 p-8 shadow-sm hover:shadow-2xl hover:shadow-blue-900/5 transition-all hover:-translate-y-2 overflow-hidden relative"
                            >
                                {/* ID Badge */}
                                <div className="absolute top-8 right-8 flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full text-[10px] font-black uppercase tracking-widest border border-emerald-100">
                                    <ShieldCheck className="w-3 h-3" />
                                    Verified
                                </div>

                                <div className="flex flex-col items-center text-center">
                                    <div className="w-24 h-24 bg-blue-50 rounded-[32px] flex items-center justify-center text-3xl font-black text-blue-600 mb-6 group-hover:scale-110 transition-transform">
                                        {c.displayName.charAt(0)}
                                    </div>

                                    <h3 className="text-2xl font-black text-slate-900 group-hover:text-blue-600 transition-colors mb-2">
                                        {c.displayName}
                                    </h3>
                                    <p className="text-slate-500 font-bold mb-6">
                                        {c.companyName || 'Đối tác Xây dựng'}
                                    </p>

                                    <div className="grid grid-cols-3 w-full gap-4 mb-8">
                                        <div className="bg-slate-50 p-3 rounded-2xl">
                                            <p className="text-xs font-black text-slate-400 uppercase tracking-tighter mb-1">Rating</p>
                                            <div className="flex items-center justify-center gap-1 text-amber-500">
                                                <Star className="w-3 h-3 fill-current" />
                                                <span className="font-black text-slate-900 leading-none">{c.avgRating}</span>
                                            </div>
                                        </div>
                                        <div className="bg-slate-50 p-3 rounded-2xl">
                                            <p className="text-xs font-black text-slate-400 uppercase tracking-tighter mb-1">KN</p>
                                            <p className="font-black text-slate-900 leading-none">{c.experienceYears}y</p>
                                        </div>
                                        <div className="bg-slate-50 p-3 rounded-2xl">
                                            <p className="text-xs font-black text-slate-400 uppercase tracking-tighter mb-1">Dự án</p>
                                            <p className="font-black text-slate-900 leading-none">{c.totalProjectsCompleted || 0}</p>
                                        </div>
                                    </div>

                                    <div className="flex flex-wrap justify-center gap-2 mb-8">
                                        {c.skills.slice(0, 3).map((skill: string) => (
                                            <span key={skill} className="px-3 py-1 bg-slate-100 text-slate-600 rounded-lg text-[10px] font-black">
                                                {skill}
                                            </span>
                                        ))}
                                        {c.skills.length > 3 && (
                                            <span className="px-3 py-1 bg-slate-100 text-slate-400 rounded-lg text-[10px] font-black">
                                                +{c.skills.length - 3}
                                            </span>
                                        )}
                                    </div>

                                    <div className="w-full flex items-center gap-2 text-slate-500 font-bold mb-8">
                                        <MapPin className="w-5 h-5 text-blue-600 shrink-0" />
                                        <span className="text-sm truncate">{c.district || 'Toàn quốc'}, {c.city || 'Việt Nam'}</span>
                                    </div>

                                    <div className="w-full h-px bg-slate-100 mb-8"></div>

                                    <div className="w-full flex items-center justify-between group-hover:text-blue-600 transition-colors">
                                        <span className="font-black text-sm text-slate-400 group-hover:text-blue-400">Xem hồ sơ năng lực</span>
                                        <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-all">
                                            <ArrowRight className="w-5 h-5" />
                                        </div>
                                    </div>
                                </div>
                            </Link>
                        ))
                    )}
                </div>
            </div>
        </div>
    )
}
