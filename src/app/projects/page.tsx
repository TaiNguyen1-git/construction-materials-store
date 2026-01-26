'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Header from '@/components/Header'
import {
    MapPin, Calendar, DollarSign, Users,
    Search, Filter, Plus, Briefcase,
    Clock, ArrowRight, Star, ShieldCheck,
    Zap, HardHat, Building2, TrendingUp
} from 'lucide-react'
import { Toaster, toast } from 'react-hot-toast'

interface Project {
    id: string
    name: string
    description: string | null
    status: string
    startDate: string
    budget: number
    location: string | null
    category: string | null
    guestName?: string
    moderationStatus: string
    isPublic: boolean
    createdAt: string
    taskCompletion?: number
    totalTasks?: number
}

const CATEGORIES = [
    { id: 'all', name: 'Tất cả', icon: Building2 },
    { id: 'flooring', name: 'Lát nền', icon: Zap },
    { id: 'painting', name: 'Sơn tường', icon: Star },
    { id: 'tiling', name: 'Ốp tường', icon: ShieldCheck },
    { id: 'general', name: 'Tổng quát', icon: HardHat },
]

export default function PublicProjectsPage() {
    const [projects, setProjects] = useState<Project[]>([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState('')
    const [activeCategory, setActiveCategory] = useState('all')

    useEffect(() => {
        fetchProjects()
    }, [activeCategory])

    const fetchProjects = async () => {
        try {
            setLoading(true)
            // Using our new public projects API
            const res = await fetch(`/api/projects?isPublic=true`)
            if (res.ok) {
                const data = await res.json()
                console.log('Fetched projects:', data)
                setProjects(data.data || [])
            }
        } catch (error) {
            console.error('Failed to fetch projects:', error)
            toast.error('Không thể tải danh sách dự án')
        } finally {
            setLoading(false)
        }
    }

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND',
            maximumFractionDigits: 0
        }).format(amount)
    }

    const filteredProjects = projects.filter(p => {
        const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase()) ||
            (p.location && p.location.toLowerCase().includes(search.toLowerCase()))
        const matchesCategory = activeCategory === 'all' || p.category === activeCategory
        return matchesSearch && matchesCategory
    })

    return (
        <div className="min-h-screen bg-slate-50">
            <Toaster position="top-right" />
            <Header />

            {/* Hero Section - Pro Max Style */}
            <div className="bg-white border-b border-gray-100 overflow-hidden relative">
                <div className="absolute top-0 right-0 w-1/3 h-full bg-gradient-to-l from-primary-50/50 to-transparent pointer-events-none"></div>
                <div className="max-w-7xl mx-auto px-4 py-16 relative z-10">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-10">
                        <div className="max-w-2xl">
                            <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary-50 text-primary-700 rounded-full text-[10px] font-black uppercase tracking-widest mb-6">
                                <TrendingUp className="w-3 h-3" /> Marketplace Công Trình
                            </div>
                            <h1 className="text-4xl md:text-5xl font-black text-slate-900 mb-6 leading-tight">
                                TÌM KIẾM DỰ ÁN <span className="text-primary-600">TIỀM NĂNG</span>
                            </h1>
                            <p className="text-lg text-slate-500 font-medium mb-10 leading-relaxed">
                                Nơi kết nối Chủ nhà và các Nhà thầu chuyên nghiệp. Đăng tin dự án để nhận báo giá cạnh tranh nhất.
                            </p>

                            <div className="flex flex-wrap gap-4">
                                <Link
                                    href="/projects/post"
                                    className="px-8 py-4 bg-primary-600 text-white font-black rounded-2xl hover:bg-primary-700 transition-all shadow-xl shadow-primary-200 flex items-center gap-3 transform hover:-translate-y-1 active:scale-95"
                                >
                                    <Plus className="w-5 h-5" />
                                    ĐĂNG DỰ ÁN MỚI
                                </Link>
                                <div className="flex items-center gap-4 px-6 border-l border-gray-100">
                                    <div>
                                        <div className="text-xl font-black text-slate-900">{projects.length}+</div>
                                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Dự án sẵn sàng</div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="hidden lg:block w-full max-w-sm">
                            <div className="bg-white p-8 rounded-[40px] shadow-2xl shadow-slate-200 border border-slate-100 relative group">
                                <div className="absolute -top-6 -right-6 w-16 h-16 bg-indigo-600 rounded-2xl shadow-xl flex items-center justify-center text-white rotate-12 group-hover:rotate-0 transition-transform">
                                    <Zap className="w-8 h-8" />
                                </div>
                                <h4 className="text-xl font-black text-slate-900 mb-4">Dành cho Nhà Thầu</h4>
                                <ul className="space-y-4 mb-8">
                                    {['Tiếp cận khách hàng tại chỗ', 'Hệ thống báo giá minh bạch', 'Được bảo lãnh thanh toán'].map((item, i) => (
                                        <li key={i} className="flex items-center gap-3 text-sm font-bold text-slate-600">
                                            <div className="w-5 h-5 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center">
                                                <Star className="w-3 h-3 fill-current" />
                                            </div>
                                            {item}
                                        </li>
                                    ))}
                                </ul>
                                <Link href="/contractors/login" className="w-full py-4 bg-slate-900 text-white rounded-xl font-black text-xs text-center block hover:bg-slate-800 transition-all">
                                    ĐĂNG KÝ HÀNH NGHỀ
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Filter & Search Bar */}
            <div className="max-w-7xl mx-auto px-4 -mt-8 relative z-20">
                <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 p-4 border border-slate-100 grid grid-cols-1 md:grid-cols-12 gap-4">
                    <div className="md:col-span-12 lg:col-span-5 relative group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-primary-600 transition-colors" />
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Tìm kiếm dự án, địa điểm..."
                            className="w-full pl-12 pr-4 py-4 bg-slate-50 border-none rounded-2xl outline-none focus:ring-2 focus:ring-primary-500 font-bold text-slate-700 transition-all"
                        />
                    </div>
                    <div className="md:col-span-12 lg:col-span-7 flex flex-wrap items-center gap-2 overflow-x-auto pb-1 md:pb-0">
                        {CATEGORIES.map(cat => (
                            <button
                                key={cat.id}
                                onClick={() => setActiveCategory(cat.id)}
                                className={`flex items-center gap-2 px-6 py-4 rounded-2xl font-black text-xs uppercase tracking-wider transition-all whitespace-nowrap ${activeCategory === cat.id
                                    ? 'bg-primary-600 text-white shadow-lg shadow-primary-200 scale-105'
                                    : 'bg-white text-slate-500 hover:bg-slate-50 border border-slate-100'}`}
                            >
                                <cat.icon className="w-4 h-4" />
                                {cat.name}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            <main className="max-w-7xl mx-auto px-4 py-12">
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-24 gap-4">
                        <div className="w-12 h-12 border-4 border-primary-100 border-t-primary-600 rounded-full animate-spin"></div>
                        <p className="text-sm font-black text-slate-400 uppercase tracking-[0.2em]">Đang tải dữ liệu...</p>
                    </div>
                ) : filteredProjects.length === 0 ? (
                    <div className="bg-white rounded-[40px] border-4 border-dashed border-slate-100 p-20 text-center">
                        <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-8">
                            <Briefcase className="w-12 h-12 text-slate-200" />
                        </div>
                        <h2 className="text-2xl font-black text-slate-900 mb-4">Chưa có dự án nào phù hợp</h2>
                        <p className="text-slate-500 font-medium mb-10 max-w-sm mx-auto">
                            Hiện tại chưa có tin đăng nào trong danh mục này. Hãy là người đầu tiên đăng dự án!
                        </p>
                        <Link
                            href="/projects/post"
                            className="inline-flex items-center gap-3 px-10 py-5 bg-slate-900 text-white font-black rounded-2xl hover:bg-slate-800 transition-all shadow-xl shadow-slate-200"
                        >
                            ĐĂNG DỰ ÁN NGAY
                            <ArrowRight className="w-5 h-5" />
                        </Link>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {filteredProjects.map((project) => (
                            <Link
                                key={project.id}
                                href={`/projects/${project.id}`}
                                className="group bg-white rounded-[32px] border border-slate-100 shadow-sm hover:shadow-2xl hover:shadow-slate-200/50 transition-all duration-500 flex flex-col h-full overflow-hidden"
                            >
                                <div className="p-8 flex-1">
                                    <div className="flex items-start justify-between mb-6">
                                        <div className="flex items-center gap-2">
                                            <div className="w-10 h-10 bg-primary-50 rounded-xl flex items-center justify-center text-primary-600 font-black">
                                                {project.name.charAt(0)}
                                            </div>
                                            <div>
                                                <div className="text-xs font-black text-slate-900 truncate max-w-[150px] uppercase tracking-tight">
                                                    {project.guestName || 'Khách hàng'}
                                                </div>
                                                <div className="flex items-center gap-1 text-[10px] text-slate-400 font-bold uppercase">
                                                    <Clock className="w-3 h-3" /> {new Date(project.createdAt).toLocaleDateString('vi-VN')}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="px-3 py-1 bg-emerald-50 text-emerald-700 rounded-lg text-[9px] font-black uppercase tracking-widest flex items-center gap-1">
                                            <ShieldCheck className="w-3 h-3" /> Đã duyệt
                                        </div>
                                    </div>

                                    <h3 className="text-xl font-black text-slate-900 group-hover:text-primary-600 transition-colors mb-4 line-clamp-2 leading-tight">
                                        {project.name}
                                    </h3>

                                    <div className="space-y-4 mb-8">
                                        <div className="flex items-center gap-3 text-sm font-bold text-slate-500">
                                            <MapPin className="w-4 h-4 text-primary-500" />
                                            {project.location || 'Toàn quốc'}
                                        </div>
                                        <div className="flex items-center gap-3 text-sm font-black text-emerald-600">
                                            <DollarSign className="w-4 h-4" />
                                            {formatCurrency(project.budget)}
                                        </div>
                                    </div>

                                    <p className="text-sm text-slate-400 font-medium line-clamp-3 leading-relaxed">
                                        {project.description || 'Chưa có mô tả chi tiết...'}
                                    </p>
                                </div>

                                <div className="px-8 py-6 bg-slate-50 border-t border-slate-100 flex justify-between items-center group-hover:bg-primary-50 transition-colors">
                                    <div className="flex items-center gap-2">
                                        <div className="flex -space-x-2">
                                            {[1, 2].map(i => (
                                                <div key={i} className="w-6 h-6 rounded-full border-2 border-white bg-slate-200"></div>
                                            ))}
                                        </div>
                                        <span className="text-[10px] font-black text-slate-400 uppercase group-hover:text-primary-700">2 ứng tuyển</span>
                                    </div>
                                    <div className="text-xs font-black text-primary-600 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                                        XEM CHI TIẾT <ArrowRight className="w-3.5 h-3.5" />
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </main>
        </div>
    )
}
