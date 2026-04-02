'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/auth-context'
import {
    Search, Filter, MapPin, Coins,
    LayoutGrid, List as ListIcon,
    ArrowUpRight, Clock, Zap,
    Bookmark, Send, X
} from 'lucide-react'
import toast, { Toaster } from 'react-hot-toast'
import { formatCurrency } from '@/utils/formatters'
import * as HoverCard from '@radix-ui/react-hover-card'
import { fetchWithAuth } from '@/lib/api-client'

// Interfaces
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

const CATEGORIES = [
    { id: 'all', name: 'Tất cả lĩnh vực' },
    { id: 'flooring', name: 'Lát nền & Sàn' },
    { id: 'painting', name: 'Sơn bả & Trang trí' },
    { id: 'tiling', name: 'Ốp lát tường' },
    { id: 'general', name: 'Xây dựng tổng hợp' },
]

export default function FindProjectsPage() {
    const { user } = useAuth()
    const router = useRouter()
    const [projects, setProjects] = useState<Project[]>([])
    const [loading, setLoading] = useState(true)
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('list')
    const [search, setSearch] = useState('')
    const [activeCategory, setActiveCategory] = useState('all')
    const [showFilters, setShowFilters] = useState(false)
    const [savedProjects, setSavedProjects] = useState<Set<string>>(new Set())

    useEffect(() => {
        const loadSaved = async () => {
            if (!user) return
            try {
                const res = await fetchWithAuth('/api/contractor/saved-projects')
                if (res.ok) {
                    const data = await res.json()
                    if (data.success) {
                        setSavedProjects(new Set(data.data))
                    }
                }
            } catch (err) {
                console.error('Failed to load saved projects', err)
            }
        }
        loadSaved()
    }, [user])

    const handleToggleSave = async (e: React.MouseEvent, projectId: string) => {
        e.stopPropagation()
        e.preventDefault()

        const isSaved = savedProjects.has(projectId)
        const newSaved = new Set(savedProjects)

        if (isSaved) {
            newSaved.delete(projectId)
            toast.success('Đã gỡ dự án khỏi danh sách lưu trữ', { id: 'save-' + projectId })
        } else {
            newSaved.add(projectId)
            toast.success('Đã lưu dự án vào kho lưu trữ cá nhân', { id: 'save-' + projectId })
        }
        setSavedProjects(newSaved)

        try {
            await fetchWithAuth('/api/contractor/saved-projects', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ projectId })
            })
        } catch (err) {
            console.error(err)
            toast.error('Lỗi giao thức: Không thể cập nhật trạng thái lưu.', { id: 'save-error' })
            setSavedProjects(prev => {
                const revert = new Set(prev)
                if (isSaved) revert.add(projectId)
                else revert.delete(projectId)
                return revert
            })
        }
    }

    useEffect(() => {
        fetchProjects()
    }, [activeCategory])

    const fetchProjects = async () => {
        try {
            setLoading(true)
            const res = await fetchWithAuth(`/api/marketplace/projects`)
            if (res.ok) {
                const data = await res.json()
                if (data.success) {
                    setProjects(data.data.projects || [])
                }
            }
        } catch (error) {
            console.error('Failed to fetch projects:', error)
        } finally {
            setLoading(false)
        }
    }

    const filteredProjects = projects.filter(p => {
        const matchesSearch = p.title.toLowerCase().includes(search.toLowerCase()) ||
            (p.location && p.location.toLowerCase().includes(search.toLowerCase()))
        const matchesCategory = activeCategory === 'all' || p.projectType === activeCategory
        return matchesSearch && matchesCategory
    })

    const ProjectCard = ({ project }: { project: Project }) => {
        const isSaved = savedProjects.has(project.id)

        return (
            <div
                onClick={() => router.push(`/contractor/projects/${project.id}`)}
                className={`group bg-white rounded-3xl cursor-pointer hover:shadow-2xl hover:shadow-blue-200/50 transition-all duration-500 relative overflow-hidden border border-slate-50 ${viewMode === 'list' ? 'flex items-center p-8 gap-10' : 'flex flex-col p-8 h-full'
                    }`}
            >
                {/* Status Badge */}
                {project.isUrgent && (
                    <div className="absolute top-0 left-0 bg-rose-600 text-white text-[9px] font-black px-5 py-2 rounded-br-2xl z-10 flex items-center gap-2 uppercase italic tracking-widest shadow-lg">
                        <Zap size={10} className="fill-current" /> Yêu cầu Gấp
                    </div>
                )}

                {/* Avatar / Icon with Hover Preview */}
                <HoverCard.Root openDelay={200} closeDelay={100}>
                    <HoverCard.Trigger asChild>
                        <div className={`shrink-0 ${viewMode === 'list' ? 'w-20 h-20' : 'w-16 h-16 mb-8'} rounded-[2rem] bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-700 font-black text-2xl shadow-sm z-20 relative hover:scale-110 group-hover:rotate-6 transition-all duration-500`}>
                            {project.title.charAt(0)}
                        </div>
                    </HoverCard.Trigger>

                    <HoverCard.Portal>
                        <HoverCard.Content
                            className="w-[450px] bg-white rounded-[3.5rem] shadow-2xl p-0 border border-slate-100 animate-in fade-in zoom-in-95 z-[999] overflow-hidden"
                            side="right"
                            sideOffset={30}
                            align="start"
                        >
                            {/* Header */}
                            <div className="p-10 pb-8 bg-slate-50/50 border-b border-slate-100">
                                <div className="flex items-center gap-6 mb-6">
                                    <div className="w-20 h-20 rounded-3xl bg-blue-600 text-white flex items-center justify-center font-black text-3xl shadow-2xl shadow-blue-200 uppercase italic">
                                        {project.contactName?.charAt(0) || 'K'}
                                    </div>
                                    <div className="space-y-1">
                                        <h4 className="font-black text-slate-900 text-2xl italic tracking-tighter uppercase">{project.contactName || 'Chủ đầu tư'}</h4>
                                        <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest italic">Xác thực bởi SmartBuild • 2024</p>
                                    </div>
                                    <button className="ml-auto p-4 bg-white hover:bg-slate-50 border border-slate-100 rounded-2xl text-blue-600 transition-all font-black text-[10px] uppercase tracking-widest italic">
                                        Chi tiết hồ sơ
                                    </button>
                                </div>
                                <div className="flex gap-8 px-4 justify-between items-center bg-white p-6 rounded-[2rem] border border-slate-50 shadow-sm">
                                    <div className="text-center">
                                        <div className="font-black text-slate-900 text-xl italic tracking-tighter">12</div>
                                        <div className="text-[9px] text-slate-400 uppercase font-black italic tracking-widest">Dự án</div>
                                    </div>
                                    <div className="w-px h-8 bg-slate-100"></div>
                                    <div className="text-center">
                                        <div className="font-black text-slate-900 text-xl italic tracking-tighter">4.9 <span className="text-yellow-500 text-sm">★</span></div>
                                        <div className="text-[9px] text-slate-400 uppercase font-black italic tracking-widest">Uy tín</div>
                                    </div>
                                    <div className="w-px h-8 bg-slate-100"></div>
                                    <div className="text-center">
                                        <div className="font-black text-emerald-600 text-xl italic tracking-tighter">Verified</div>
                                        <div className="text-[9px] text-slate-400 uppercase font-black italic tracking-widest">Hợp pháp</div>
                                    </div>
                                </div>
                            </div>

                            <div className="p-10 space-y-8">
                                <div className="space-y-3">
                                    <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic ml-2">Yêu cầu tóm tắt</h5>
                                    <p className="text-sm text-slate-600 font-bold leading-relaxed italic line-clamp-3">
                                        {project.description || 'Chưa có mô tả kỹ thuật chi tiết. Vui lòng truy cập trang chi tiết để xem toàn bộ hồ sơ mời thầu.'}
                                    </p>
                                </div>

                                <div className="grid grid-cols-2 gap-6">
                                    <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-100 italic">
                                        <div className="text-[9px] text-slate-400 uppercase font-black tracking-widest mb-2">Ngân sách</div>
                                        <div className="font-black text-blue-600 text-lg tabular-nums tracking-tighter">{project.estimatedBudget ? formatCurrency(project.estimatedBudget) : 'Thỏa thuận'}</div>
                                    </div>
                                    <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-100 italic">
                                        <div className="text-[9px] text-slate-400 uppercase font-black tracking-widest mb-2">Đất thi công</div>
                                        <div className="font-black text-slate-900 text-lg truncate tracking-tighter uppercase">{project.location || 'Toàn quốc'}</div>
                                    </div>
                                </div>

                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        router.push(`/contractor/projects/${project.id}`);
                                    }}
                                    className="w-full py-8 bg-blue-600 text-white rounded-[2.5rem] font-black text-[11px] uppercase tracking-[0.3em] hover:bg-blue-700 transition-all shadow-2xl shadow-blue-500/30 flex items-center justify-center gap-4 active:scale-95 italic group"
                                >
                                    <Send size={24} className="group-hover:translate-x-2 group-hover:-translate-y-2 transition-transform" /> Gửi Báo Giá Đấu Thầu
                                </button>
                            </div>
                        </HoverCard.Content>
                    </HoverCard.Portal>
                </HoverCard.Root>

                {/* Content */}
                <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start mb-2">
                        <h3 className="font-black text-slate-900 truncate pr-6 group-hover:text-blue-600 transition-all text-2xl uppercase italic tracking-tighter">
                            {project.title}
                        </h3>
                        {viewMode === 'list' && (
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 whitespace-nowrap bg-slate-50 px-4 py-2 rounded-2xl italic">
                                <Clock size={14} /> {new Date(project.createdAt).toLocaleDateString('vi-VN')}
                            </span>
                        )}
                    </div>

                    <div className={`flex flex-wrap gap-x-8 gap-y-3 text-sm text-slate-500 font-bold italic ${viewMode === 'grid' ? 'mb-8' : ''}`}>
                        <span className="flex items-center gap-3">
                            <MapPin size={18} className="text-rose-500" />
                            {project.location || 'Toàn quốc'}
                        </span>
                        <span className="flex items-center gap-3 text-blue-600 tabular-nums">
                            <Coins size={18} />
                            {project.estimatedBudget ? formatCurrency(project.estimatedBudget) : 'Thỏa thuận'}
                        </span>
                    </div>

                    {viewMode === 'grid' && (
                        <div className="mt-auto pt-6 border-t border-slate-50 flex justify-between items-center text-[10px] font-black text-slate-400 uppercase tracking-widest italic">
                            <span>{project.applicationCount} Đã ứng tuyển</span>
                            <span>{project.viewCount} Lượt xem</span>
                        </div>
                    )}
                </div>

                {/* Actions (List View Only) */}
                {viewMode === 'list' && (
                    <div className="flex items-center gap-6 shrink-0">
                        <button
                            onClick={(e) => handleToggleSave(e, project.id)}
                            className={`p-5 rounded-3xl transition-all shadow-sm ${isSaved ? 'text-blue-600 bg-blue-50 hover:bg-blue-100' : 'text-slate-400 hover:text-blue-600 hover:bg-blue-50 bg-white border border-slate-100'}`}
                        >
                            <Bookmark size={24} className={isSaved ? "fill-current" : ""} />
                        </button>
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                router.push(`/contractor/projects/${project.id}`);
                            }}
                            className="bg-indigo-600 text-white px-10 py-5 rounded-[2rem] text-[10px] font-black uppercase tracking-widest italic shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all flex items-center gap-4 active:scale-95 group/app"
                        >
                            Chi tiết thầu <ArrowUpRight size={20} className="group-hover/app:translate-x-2 group-hover/app:-translate-y-2 transition-transform" />
                        </button>
                    </div>
                )}
            </div>
        )
    }

    return (
        <div className="animate-in fade-in slide-in-from-bottom-8 duration-1000 space-y-12 pb-24">
            <Toaster position="top-right" />
            
            {/* Header / Stats Navigation Section */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-10">
                <div className="space-y-3">
                    <h1 className="text-5xl font-black text-slate-900 tracking-tighter uppercase italic flex items-center gap-5">
                        Tìm kiếm cơ hội mới
                    </h1>
                    <p className="text-slate-500 font-bold uppercase text-[10px] tracking-[0.3em] italic">Khám phá và thầu các dự án tiềm năng trên toàn quốc</p>
                </div>
                <div className="flex items-center gap-4 bg-slate-50 p-2 rounded-[2.2rem] shadow-inner border border-slate-100">
                    <button
                        onClick={() => setViewMode('list')}
                        className={`p-4 rounded-[1.8rem] transition-all ${viewMode === 'list' ? 'bg-white text-blue-600 shadow-xl' : 'text-slate-400 hover:text-slate-600'}`}
                    >
                        <ListIcon size={24} />
                    </button>
                    <button
                        onClick={() => setViewMode('grid')}
                        className={`p-4 rounded-[1.8rem] transition-all ${viewMode === 'grid' ? 'bg-white text-blue-600 shadow-xl' : 'text-slate-400 hover:text-slate-600'}`}
                    >
                        <LayoutGrid size={24} />
                    </button>
                </div>
            </div>

            {/* Smart Search & Filter Command Center */}
            <div className="bg-white p-6 rounded-[3.5rem] shadow-2xl shadow-slate-200/50 border border-slate-50 flex flex-col xl:flex-row gap-6 items-center relative z-20">
                <div className="relative flex-1 w-full group">
                    <Search className="absolute left-10 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none group-focus-within:text-blue-600 transition-colors" size={24} />
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Tìm theo tên dự án, địa điểm hoặc từ khóa thi công..."
                        className="w-full pl-24 pr-8 py-8 bg-slate-50 border-none rounded-[2.5rem] font-bold italic outline-none focus:ring-4 focus:ring-blue-500/10 focus:bg-white transition-all placeholder:text-slate-300 text-slate-900"
                    />
                </div>
                
                <div className="flex items-center gap-3 w-full xl:w-auto overflow-x-auto no-scrollbar py-2">
                    {CATEGORIES.map(cat => (
                        <button
                            key={cat.id}
                            onClick={() => setActiveCategory(cat.id)}
                            className={`whitespace-nowrap px-8 py-5 rounded-[1.8rem] text-[10px] font-black uppercase tracking-widest transition-all border italic ${activeCategory === cat.id
                                ? 'bg-blue-600 text-white border-blue-600 shadow-2xl shadow-blue-200'
                                : 'bg-white text-slate-500 border-slate-100 hover:border-blue-200 hover:text-blue-600 hover:bg-slate-50'
                                }`}
                        >
                            {cat.name}
                        </button>
                    ))}
                    <button
                        onClick={() => setShowFilters(!showFilters)}
                        className={`whitespace-nowrap px-8 py-5 rounded-[1.8rem] text-[10px] font-black uppercase tracking-widest transition-all border flex items-center gap-3 italic ${showFilters ? 'bg-indigo-50 border-indigo-200 text-indigo-600' : 'bg-white border-slate-100 text-slate-500 hover:bg-slate-50 hover:border-indigo-200 hover:text-indigo-600'}`}
                    >
                        <Filter size={18} /> Lọc nâng cao
                    </button>
                </div>
            </div>

            {/* Advanced Filters Panel */}
            {showFilters && (
                <div className="bg-white rounded-[3.5rem] p-12 shadow-2xl border border-slate-50 animate-in slide-in-from-top-6 fade-in duration-500 relative z-10 space-y-12">
                    <div className="flex justify-between items-center">
                        <h3 className="text-2xl font-black text-slate-900 uppercase italic tracking-tighter flex items-center gap-4">
                            <Filter size={28} className="text-blue-600" /> Cấu hình bộ lọc thầu
                        </h3>
                        <button onClick={() => setShowFilters(false)} className="w-12 h-12 flex items-center justify-center bg-slate-50 text-slate-400 hover:bg-rose-50 hover:text-rose-600 rounded-2xl transition-all">
                            <X size={24} />
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
                        <div className="space-y-4">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic ml-4">Khoảng ngân sách khả dụng</label>
                            <div className="flex items-center gap-4">
                                <input type="number" placeholder="Tối thiểu" className="w-full px-8 py-5 bg-slate-50 border-none rounded-[1.5rem] text-sm font-black italic outline-none focus:bg-white focus:ring-4 focus:ring-blue-500/5 transition-all" />
                                <span className="text-slate-200 font-bold">~</span>
                                <input type="number" placeholder="Tối đa" className="w-full px-8 py-5 bg-slate-50 border-none rounded-[1.5rem] text-sm font-black italic outline-none focus:bg-white focus:ring-4 focus:ring-blue-500/5 transition-all" />
                            </div>
                        </div>

                        <div className="space-y-4">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic ml-4">Khu vực địa lý</label>
                            <select className="w-full px-8 py-5 bg-slate-50 border-none rounded-[1.5rem] text-sm font-black italic uppercase outline-none focus:bg-white focus:ring-4 focus:ring-blue-500/5 transition-all appearance-none cursor-pointer text-slate-700">
                                <option>Toàn quốc (Tất cả)</option>
                                <option>TP. Hồ Chí Minh</option>
                                <option>TP. Hà Nội</option>
                                <option>TP. Đà Nẵng</option>
                                <option>Tỉnh Bình Dương</option>
                            </select>
                        </div>

                        <div className="space-y-4">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic ml-4">Mức độ ưu tiên</label>
                            <div className="flex gap-4">
                                <button className="flex-1 py-5 bg-slate-50 text-slate-500 rounded-[1.5rem] text-[10px] font-black tracking-widest uppercase italic hover:bg-slate-100 transition-all">Thông thường</button>
                                <button className="flex-1 py-5 bg-rose-50 text-rose-600 rounded-[1.5rem] text-[10px] font-black tracking-widest uppercase italic border border-rose-100 flex items-center justify-center gap-2 hover:bg-rose-100">
                                    <Zap size={14} className="fill-current" /> Đấu thầu gấp
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end gap-6 pt-10 border-t border-slate-50">
                        <button
                            onClick={() => setShowFilters(false)}
                            className="px-10 py-6 text-slate-400 font-black text-[10px] uppercase tracking-widest hover:bg-slate-50 rounded-[2rem] transition-all italic"
                        >
                            Làm sạch bộ lọc
                        </button>
                        <button
                            onClick={() => { toast.success('Đã áp dụng các tiêu chí thầu mới'); setShowFilters(false) }}
                            className="px-12 py-6 bg-blue-600 text-white rounded-[2rem] font-black text-[10px] uppercase tracking-widest italic shadow-2xl shadow-blue-500/20 hover:bg-blue-700 transition-all"
                        >
                            Kích hoạt bộ lọc
                        </button>
                    </div>
                </div>
            )}

            {/* Opportunity Marketplace Grid */}
            <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10' : 'space-y-8'}>
                {loading ? (
                    Array.from({ length: 6 }).map((_, i) => (
                        <div key={i} className="bg-white rounded-[3rem] p-10 border border-slate-50 h-64 animate-pulse shadow-sm"></div>
                    ))
                ) : filteredProjects.length > 0 ? (
                    filteredProjects.map((project) => (
                        <ProjectCard key={project.id} project={project} />
                    ))
                ) : (
                    <div className="col-span-full py-48 text-center space-y-8 bg-white rounded-[4rem] shadow-sm border border-slate-50">
                        <div className="w-32 h-32 bg-slate-50 rounded-[3rem] flex items-center justify-center mx-auto text-slate-200">
                            <Search size={64} />
                        </div>
                        <div className="space-y-4">
                            <h3 className="text-3xl font-black text-slate-900 uppercase italic tracking-tighter">Không tìm thấy cơ hội thi công</h3>
                            <p className="text-slate-400 font-bold text-sm uppercase italic tracking-widest">Thử thay đổi từ khóa hoặc mở rộng bộ lọc địa lý của bạn.</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
