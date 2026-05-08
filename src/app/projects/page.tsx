'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import Header from '@/components/Header'
import { 
    Search, Filter, MapPin, Coins, Calendar, Clock, 
    ArrowRight, Bookmark, Share2, Zap, Info, ChevronDown, 
    ChevronRight, ExternalLink, ShieldCheck, Star, 
    Award, CheckCircle2, DollarSign, Users, Target, Package,
    X, Check, LayoutGrid, List, Briefcase, AlertCircle
} from 'lucide-react'
import { Toaster, toast } from 'react-hot-toast'
import ApplicationForm from '@/components/marketplace/ApplicationForm'
import GuestLeadModal from '@/components/marketplace/GuestLeadModal'

interface Project {
    id: string
    title: string
    description: string | null
    status: string
    createdAt: string
    estimatedBudget: number | null
    location: string | null
    projectType: string | null
    contactName?: string
    applicationCount: number
    viewCount: number
    isUrgent: boolean
}

const PROJECT_TYPE_MAP: Record<string, string> = {
    'all': 'Tất cả',
    'general': 'Xây dựng chung',
    'new_build': 'Xây mới',
    'flooring': 'Lát nền',
    'painting': 'Sơn tường',
    'tiling': 'Ốp lát',
    'roofing': 'Làm mái',
    'renovation': 'Cải tạo',
    'plumbing': 'Điện nước',
    'electrical': 'Hệ thống điện',
    'interior': 'Nội thất',
    'landscaping': 'Cảnh quan'
}

const getProjectTypeName = (type: string | null) => {
    if (!type) return 'Xây dựng'
    const normalizedType = type.toLowerCase()
    return PROJECT_TYPE_MAP[normalizedType] || type
}

const CATEGORIES = [
    { id: 'all', name: 'Tất cả', icon: LayoutGrid },
    { id: 'flooring', name: 'Lát nền', icon: Zap },
    { id: 'painting', name: 'Sơn tường', icon: Award },
    { id: 'tiling', name: 'Ốp tường', icon: CheckCircle2 },
    { id: 'general', name: 'Tổng quát', icon: Briefcase },
]

export default function PublicProjectsPage() {
    const [projects, setProjects] = useState<Project[]>([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState('')
    const [activeCategory, setActiveCategory] = useState('all')
    const [budgetRange, setBudgetRange] = useState('all')
    const [dateRange, setDateRange] = useState('all')
    const [sortBy, setSortBy] = useState('newest')
    const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null)
    const [showFilters, setShowFilters] = useState(false)
    const [showApplyModal, setShowApplyModal] = useState(false)
    const [showLeadModal, setShowLeadModal] = useState(false)
    
    const detailRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        fetchProjects()
    }, [activeCategory])

    const fetchProjects = async () => {
        try {
            setLoading(true)
            const res = await fetch(`/api/marketplace/projects`)
            if (res.ok) {
                const data = await res.json()
                const mappedProjects = (data.data?.projects || data.projects || []).map((p: any) => ({
                    id: p.id,
                    title: p.title,
                    description: p.description,
                    status: p.status,
                    createdAt: p.createdAt,
                    estimatedBudget: p.estimatedBudget,
                    location: p.location,
                    projectType: p.projectType || 'general',
                    contactName: p.contactName || 'Khách hàng',
                    applicationCount: p.applicationCount ?? 0,
                    viewCount: p.viewCount ?? 0,
                    isUrgent: p.isUrgent === true
                }))
                setProjects(mappedProjects)
                if (mappedProjects.length > 0 && !selectedProjectId) {
                    setSelectedProjectId(mappedProjects[0].id)
                }
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
        const matchesSearch = p.title.toLowerCase().includes(search.toLowerCase()) ||
            (p.location && p.location.toLowerCase().includes(search.toLowerCase()))
        const matchesCategory = activeCategory === 'all' || p.projectType === activeCategory
        
        let matchesBudget = true
        const budget = p.estimatedBudget || 0
        if (budgetRange === 'under50') matchesBudget = budget < 50000000
        else if (budgetRange === '50-200') matchesBudget = budget >= 50000000 && budget <= 200000000
        else if (budgetRange === 'above200') matchesBudget = budget > 200000000

        let matchesDate = true
        const createdAt = new Date(p.createdAt)
        const now = new Date()
        if (dateRange === 'today') {
            matchesDate = createdAt.toDateString() === now.toDateString()
        } else if (dateRange === 'week') {
            const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
            matchesDate = createdAt >= lastWeek
        } else if (dateRange === 'month') {
            const lastMonth = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
            matchesDate = createdAt >= lastMonth
        }

        return matchesSearch && matchesCategory && matchesBudget && matchesDate
    }).sort((a, b) => {
        if (sortBy === 'newest') return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        if (sortBy === 'oldest') return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        if (sortBy === 'budgetHigh') return (b.estimatedBudget || 0) - (a.estimatedBudget || 0)
        if (sortBy === 'budgetLow') return (a.estimatedBudget || 0) - (b.estimatedBudget || 0)
        return 0
    })

    const selectedProject = projects.find(p => p.id === selectedProjectId) || filteredProjects[0]

    const handleSelectProject = (id: string) => {
        setSelectedProjectId(id)
        if (window.innerWidth < 1024) {
            detailRef.current?.scrollIntoView({ behavior: 'smooth' })
        }
    }

    return (
        <div className="min-h-screen bg-white">
            <Toaster position="top-right" />
            <Header />

            <div className="bg-white border-b border-slate-100 sticky top-[64px] z-30 shadow-sm">
                <div className="max-w-[1400px] mx-auto px-4 py-4">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                        <div className="w-full md:w-[500px] relative">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input
                                type="text"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Tên dự án, kỹ năng hoặc địa điểm..."
                                className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
                            />
                        </div>
                        
                        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1 w-full md:w-auto">
                            {CATEGORIES.map(cat => (
                                <button
                                    key={cat.id}
                                    onClick={() => setActiveCategory(cat.id)}
                                    className={`px-4 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all whitespace-nowrap border ${activeCategory === cat.id
                                        ? 'bg-primary-600 border-primary-600 text-white shadow-lg shadow-primary-200'
                                        : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'}`}
                                >
                                    {cat.name}
                                </button>
                            ))}
                            <button 
                                onClick={() => setShowFilters(!showFilters)}
                                className={`p-2.5 rounded-xl border transition-all ${showFilters ? 'bg-slate-900 border-slate-900 text-white' : 'bg-white border-slate-200 text-slate-500'}`}
                            >
                                <Filter className="w-4 h-4" />
                            </button>
                        </div>
                    </div>

                    {showFilters && (
                        <div className="mt-4 pt-4 border-t border-slate-100 flex flex-wrap gap-4 animate-in slide-in-from-top-2 duration-300">
                             <div className="space-y-1.5">
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Ngân sách</span>
                                <div className="flex gap-2">
                                    {['all', 'under50', '50-200', 'above200'].map(b => (
                                        <button 
                                            key={b}
                                            onClick={() => setBudgetRange(b)}
                                            className={`px-3 py-1.5 rounded-lg text-[10px] font-bold border transition-all ${budgetRange === b ? 'bg-primary-50 border-primary-200 text-primary-700' : 'bg-white border-slate-200 text-slate-500'}`}
                                        >
                                            {b === 'all' ? 'Tất cả' : b === 'under50' ? '< 50Tr' : b === '50-200' ? '50-200Tr' : '> 200Tr'}
                                        </button>
                                    ))}
                                </div>
                             </div>
                             <div className="space-y-1.5">
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Thời gian</span>
                                <div className="flex gap-2">
                                    {['all', 'today', 'week', 'month'].map(d => (
                                        <button 
                                            key={d}
                                            onClick={() => setDateRange(d)}
                                            className={`px-3 py-1.5 rounded-lg text-[10px] font-bold border transition-all ${dateRange === d ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-white border-slate-200 text-slate-500'}`}
                                        >
                                            {d === 'all' ? 'Tất cả' : d === 'today' ? 'Hôm nay' : d === 'week' ? 'Tuần này' : 'Tháng này'}
                                        </button>
                                    ))}
                                </div>
                             </div>
                             <div className="ml-auto flex items-center gap-2 self-end mb-1">
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Sắp xếp:</span>
                                <select 
                                    value={sortBy}
                                    onChange={(e) => setSortBy(e.target.value)}
                                    className="text-[11px] font-bold text-primary-600 bg-transparent outline-none cursor-pointer"
                                >
                                    <option value="newest">Mới nhất</option>
                                    <option value="oldest">Cũ nhất</option>
                                    <option value="budgetHigh">Ngân sách cao</option>
                                    <option value="budgetLow">Ngân sách thấp</option>
                                </select>
                             </div>
                        </div>
                    )}
                </div>
            </div>

            <main className="max-w-[1400px] mx-auto px-4 py-8">
                <div className="flex flex-col lg:flex-row gap-8">
                    <div className="w-full lg:w-[450px] space-y-4">
                        <div className="mb-4 flex items-center justify-between">
                            <h2 className="text-sm font-black text-slate-900 uppercase tracking-tight">
                                Kết quả tìm kiếm ({filteredProjects.length})
                            </h2>
                        </div>

                        {loading ? (
                            <div className="space-y-4">
                                {[1, 2, 3, 4].map(i => (
                                    <div key={i} className="h-48 bg-slate-50 animate-pulse rounded-[32px]"></div>
                                ))}
                            </div>
                        ) : filteredProjects.length === 0 ? (
                            <div className="bg-slate-50 rounded-[40px] p-12 text-center border-2 border-dashed border-slate-200">
                                <Briefcase className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                                <p className="text-slate-500 font-bold">Không tìm thấy dự án phù hợp</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {filteredProjects.map((project) => (
                                    <div
                                        key={project.id}
                                        onClick={() => handleSelectProject(project.id)}
                                        className={`group relative p-6 rounded-[32px] border-2 transition-all cursor-pointer ${selectedProjectId === project.id 
                                            ? 'bg-white border-primary-500 shadow-2xl shadow-primary-100' 
                                            : 'bg-white border-slate-100 hover:border-slate-200 hover:shadow-xl'}`}
                                    >
                                        <div className="flex justify-between items-start mb-4">
                                            <div className="flex-1">
                                                <h3 className="text-lg font-black text-slate-900 group-hover:text-primary-600 transition-colors mb-1 line-clamp-1 uppercase">
                                                    {project.title}
                                                </h3>
                                                <p className="text-xs font-bold text-slate-500 flex items-center gap-1">
                                                    {project.contactName} • {project.location || 'Toàn quốc'}
                                                </p>
                                            </div>
                                            <button 
                                                onClick={(e) => {
                                                    e.stopPropagation()
                                                    const isLoggedIn = !!localStorage.getItem('contractor_id')
                                                    if (isLoggedIn) {
                                                        toast.success('Đã lưu vào danh sách quan tâm')
                                                    } else {
                                                        setSelectedProjectId(project.id)
                                                        setShowLeadModal(true)
                                                    }
                                                }}
                                                className="p-2 text-slate-400 hover:text-primary-600 transition-colors"
                                            >
                                                <Bookmark className="w-4 h-4" />
                                            </button>
                                        </div>

                                        <div className="bg-slate-50 rounded-xl px-4 py-2 mb-4 inline-block">
                                            <span className="text-xs font-black text-slate-700">
                                                {project.estimatedBudget ? formatCurrency(project.estimatedBudget) : 'Thỏa thuận'}
                                            </span>
                                        </div>

                                        <div className="flex flex-wrap gap-2 mb-4">
                                            <span className="px-3 py-1 bg-primary-50 text-primary-700 rounded-lg text-[9px] font-black uppercase tracking-widest">
                                                {getProjectTypeName(project.projectType)}
                                            </span>
                                            {project.isUrgent && (
                                                <span className="px-3 py-1 bg-red-50 text-red-700 rounded-lg text-[9px] font-black uppercase tracking-widest flex items-center gap-1">
                                                    <Zap className="w-2 h-2" /> Khẩn cấp
                                                </span>
                                            )}
                                        </div>

                                        <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                                            <div className="flex items-center gap-1 text-[10px] text-slate-400 font-bold uppercase">
                                                <Clock className="w-3 h-3" /> {new Date(project.createdAt).toLocaleDateString('vi-VN')}
                                            </div>
                                            <span className="text-[10px] font-black text-primary-600 flex items-center gap-1">
                                                CHI TIẾT <ArrowRight className="w-3 h-3" />
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="flex-1 hidden lg:block" ref={detailRef}>
                        {selectedProject ? (
                            <div className="sticky top-[140px] bg-white rounded-[40px] border border-slate-100 shadow-2xl shadow-slate-200/50 overflow-hidden h-[calc(100vh-180px)] flex flex-col">
                                <div className="p-6 pb-4 border-b border-slate-50 shrink-0">
                                    <div className="flex justify-between items-start mb-4">
                                        <div>
                                            <h1 className="text-xl font-black text-slate-900 mb-1 uppercase leading-tight">
                                                {selectedProject.title}
                                            </h1>
                                            <div className="flex items-center gap-3">
                                                <Link href="#" className="text-xs font-bold text-primary-600 hover:underline flex items-center gap-1 uppercase tracking-tight">
                                                    {selectedProject.contactName} <ExternalLink className="w-3 h-3" />
                                                </Link>
                                                <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                                                <p className="text-xs font-bold text-slate-500">{selectedProject.location || 'Toàn quốc'}</p>
                                            </div>
                                        </div>
                                        <div className="flex gap-2">
                                            <button 
                                                onClick={() => {
                                                    const isLoggedIn = !!localStorage.getItem('contractor_id')
                                                    if (isLoggedIn) {
                                                        toast.success('Đã lưu vào danh sách quan tâm')
                                                    } else {
                                                        setShowLeadModal(true)
                                                    }
                                                }}
                                                className="p-2 bg-slate-50 text-slate-500 rounded-xl hover:bg-slate-100 transition-all"
                                            >
                                                <Bookmark className="w-4 h-4" />
                                            </button>
                                            <button 
                                                onClick={() => {
                                                    navigator.clipboard.writeText(window.location.origin + `/projects/${selectedProject.id}`)
                                                    toast.success('Đã sao chép liên kết dự án')
                                                }}
                                                className="p-2 bg-slate-50 text-slate-500 rounded-xl hover:bg-slate-100 transition-all"
                                            >
                                                <Share2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>

                                    <div className="flex flex-wrap items-center gap-4">
                                        <div className="flex items-center gap-2">
                                            <div className="w-7 h-7 bg-emerald-50 rounded-lg flex items-center justify-center text-emerald-600">
                                                <Coins className="w-3.5 h-3.5" />
                                            </div>
                                            <div>
                                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">Ngân sách</p>
                                                <p className="text-xs font-black text-slate-900">
                                                    {selectedProject.estimatedBudget ? formatCurrency(selectedProject.estimatedBudget) : 'Thỏa thuận'}
                                                </p>
                                            </div>
                                        </div>
                                        
                                        <div className="flex items-center gap-2">
                                            <div className="w-7 h-7 bg-indigo-50 rounded-lg flex items-center justify-center text-indigo-600">
                                                <Users className="w-3.5 h-3.5" />
                                            </div>
                                            <div>
                                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">Ứng tuyển</p>
                                                <p className="text-xs font-black text-slate-900">{selectedProject.applicationCount || 0} Đối tác</p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            <div className="w-7 h-7 bg-blue-50 rounded-lg flex items-center justify-center text-blue-600">
                                                <ShieldCheck className="w-3.5 h-3.5" />
                                            </div>
                                            <div>
                                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">Trạng thái</p>
                                                <p className="text-xs font-black text-emerald-600">ĐÃ DUYỆT</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="mt-6 flex gap-3">
                                        <button 
                                            onClick={() => setShowApplyModal(true)}
                                            className="flex-[2] py-3 bg-primary-600 text-white rounded-xl font-black text-[11px] uppercase tracking-widest text-center shadow-lg shadow-primary-200 hover:bg-primary-700 transition-all flex items-center justify-center gap-2"
                                        >
                                            GỬI BÁO GIÁ NGAY <Zap className="w-3.5 h-3.5 fill-current" />
                                        </button>
                                        <Link
                                            href={`/projects/${selectedProject.id}`}
                                            className="flex-1 py-3 bg-white border border-slate-200 text-slate-700 rounded-xl font-black text-[11px] uppercase tracking-widest text-center hover:bg-slate-50 transition-all flex items-center justify-center gap-2"
                                        >
                                            XEM CHI TIẾT <ExternalLink className="w-3.5 h-3.5" />
                                        </Link>
                                    </div>
                                </div>

                                <div className="flex-1 overflow-y-auto custom-scrollbar p-8 space-y-8">
                                    <div>
                                        <h4 className="text-lg font-black text-slate-900 mb-4 uppercase flex items-center gap-2">
                                            <CheckCircle2 className="w-5 h-5 text-emerald-500" /> Mô tả công việc
                                        </h4>
                                        <div className="text-slate-600 font-medium leading-relaxed space-y-4">
                                            {selectedProject.description ? (
                                                selectedProject.description.split('\n').map((line, i) => (
                                                    <p key={i}>{line}</p>
                                                ))
                                            ) : (
                                                <p>Chưa có mô tả chi tiết cho dự án này...</p>
                                            )}
                                        </div>
                                    </div>

                                    <div>
                                        <h4 className="text-lg font-black text-slate-900 mb-4 uppercase flex items-center gap-2">
                                            <MapPin className="w-5 h-5 text-red-500" /> Địa điểm thi công
                                        </h4>
                                        <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100">
                                            <p className="text-slate-700 font-bold">{selectedProject.location || 'Toàn quốc'}</p>
                                            <p className="text-xs text-slate-400 mt-1 font-medium italic">Vui lòng liên hệ chủ nhà để biết vị trí chính xác</p>
                                        </div>
                                    </div>

                                    <div className="bg-indigo-50 p-6 rounded-3xl border border-indigo-100 flex items-start gap-4">
                                        <AlertCircle className="w-6 h-6 text-indigo-600 mt-1" />
                                        <div>
                                            <h5 className="text-sm font-black text-indigo-900 uppercase tracking-tight mb-1">Lưu ý bảo mật</h5>
                                            <p className="text-xs text-indigo-700 font-medium leading-relaxed">
                                                Tất cả giao dịch nên được thực hiện thông qua hệ thống SmartBuild để đảm bảo quyền lợi và bảo lãnh thanh toán. Tuyệt đối không chuyển khoản trước khi có hợp đồng.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="h-full flex items-center justify-center bg-slate-50 rounded-[40px] border-4 border-dashed border-slate-200">
                                <p className="text-slate-400 font-black uppercase tracking-widest">Chọn một dự án để xem chi tiết</p>
                            </div>
                        )}
                    </div>
                </div>
            </main>

            {selectedProject && showApplyModal && (
                <ApplicationForm
                    projectId={selectedProject.id}
                    projectTitle={selectedProject.title}
                    isOpen={showApplyModal}
                    onClose={() => setShowApplyModal(false)}
                    onSuccess={() => {
                        const isLoggedIn = !!localStorage.getItem('contractor_id')
                        if (isLoggedIn) {
                            setShowApplyModal(false)
                        }
                    }}
                />
            )}

            {selectedProject && (
                <GuestLeadModal 
                    isOpen={showLeadModal}
                    onClose={() => setShowLeadModal(false)}
                    projectTitle={selectedProject.title}
                />
            )}
        </div>
    )
}
