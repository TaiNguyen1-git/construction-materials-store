'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/auth-context'
import Sidebar from '../../components/Sidebar'
import ContractorHeader from '../../components/ContractorHeader'
import {
    Search, Filter, MapPin, DollarSign, Calendar,
    Building2, LayoutGrid, List as ListIcon,
    ArrowUpRight, Clock, ShieldCheck, Zap,
    MoreVertical, Bookmark, Send, Eye, X
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
    { id: 'all', name: 'Tất cả' },
    { id: 'flooring', name: 'Lát nền' },
    { id: 'painting', name: 'Sơn tường' },
    { id: 'tiling', name: 'Ốp tường' },
    { id: 'general', name: 'Tổng quát' },
]

export default function FindProjectsPage() {
    const { user } = useAuth()
    const router = useRouter()
    const [sidebarOpen, setSidebarOpen] = useState(true)
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

        // Optimistic Update
        const isSaved = savedProjects.has(projectId)
        const newSaved = new Set(savedProjects)

        if (isSaved) {
            newSaved.delete(projectId)
            toast.success('Đã bỏ lưu dự án', { id: 'save-' + projectId })
        } else {
            newSaved.add(projectId)
            toast.success('Đã lưu dự án', { id: 'save-' + projectId })
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
            toast.error('Có lỗi xảy ra', { id: 'save-error' })
            // Revert
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
                className={`group bg-white border border-slate-100 rounded-2xl cursor-pointer hover:border-blue-500 hover:shadow-lg transition-all duration-300 relative overflow-hidden ${viewMode === 'list' ? 'flex items-center p-4 gap-6' : 'flex flex-col p-5 h-full'
                    }`}
            >
                {/* Status Badge */}
                {project.isUrgent && (
                    <div className="absolute top-0 left-0 bg-red-500 text-white text-[10px] font-bold px-3 py-1 rounded-br-xl z-10 flex items-center gap-1">
                        <Zap size={10} className="fill-current" /> GẤP
                    </div>
                )}

                {/* Avatar / Icon with Hover Preview */}
                <HoverCard.Root openDelay={200} closeDelay={100}>
                    <HoverCard.Trigger asChild>
                        <div className={`shrink-0 ${viewMode === 'list' ? 'w-16 h-16' : 'w-12 h-12 mb-4'} rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100 flex items-center justify-center text-blue-600 font-bold text-xl shadow-sm z-20 relative hover:scale-105 transition-transform`}>
                            {project.title.charAt(0)}
                        </div>
                    </HoverCard.Trigger>

                    <HoverCard.Portal>
                        <HoverCard.Content
                            className="w-[400px] bg-white rounded-3xl shadow-2xl p-0 border border-slate-100 animate-in fade-in zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=top]:slide-in-from-bottom-2 z-[999] overflow-hidden"
                            side="right"
                            sideOffset={20}
                            align="start"
                            alignOffset={-20}
                            collisionPadding={20}
                            avoidCollisions={true}
                        >
                            {/* Header */}
                            <div className="p-6 pb-4 bg-gradient-to-r from-slate-50 to-white border-b border-slate-100">
                                <div className="flex items-center gap-4 mb-4">
                                    <div className="w-14 h-14 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-black text-2xl shadow-inner uppercase">
                                        {project.contactName?.charAt(0) || 'K'}
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-slate-900 text-lg">{project.contactName || 'Khách hàng ẩn danh'}</h4>
                                        <p className="text-xs text-slate-500 font-medium">Đã tham gia: 2024 • 90% Phản hồi</p>
                                    </div>
                                    <button className="ml-auto text-blue-600 font-bold text-sm hover:underline">
                                        Xem hồ sơ
                                    </button>
                                </div>
                                <div className="flex gap-4 text-center">
                                    <div>
                                        <div className="font-black text-slate-900">12</div>
                                        <div className="text-[10px] text-slate-400 uppercase font-bold">Dự án đã đăng</div>
                                    </div>
                                    <div className="w-px h-8 bg-slate-200"></div>
                                    <div>
                                        <div className="font-black text-slate-900">4.8 <span className="text-yellow-500">★</span></div>
                                        <div className="text-[10px] text-slate-400 uppercase font-bold">Đánh giá</div>
                                    </div>
                                    <div className="w-px h-8 bg-slate-200"></div>
                                    <div>
                                        <div className="font-black text-emerald-600">Verified</div>
                                        <div className="text-[10px] text-slate-400 uppercase font-bold">Xác thực</div>
                                    </div>
                                </div>
                            </div>

                            {/* Quick Preview Body */}
                            <div className="p-6 space-y-4">
                                <div className="space-y-2">
                                    <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Tóm tắt dự án</h5>
                                    <p className="text-sm text-slate-600 font-medium line-clamp-3 leading-relaxed">
                                        {project.description || 'Chưa có mô tả chi tiết cho dự án này. Vui lòng xem chi tiết để biết thêm thông tin.'}
                                    </p>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                                        <div className="text-[10px] text-slate-400 uppercase font-bold mb-1">Ngân sách</div>
                                        <div className="font-bold text-slate-900 text-sm">{project.estimatedBudget ? formatCurrency(project.estimatedBudget) : 'Thỏa thuận'}</div>
                                    </div>
                                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                                        <div className="text-[10px] text-slate-400 uppercase font-bold mb-1">Địa điểm</div>
                                        <div className="font-bold text-slate-900 text-sm truncate">{project.location || 'Toàn quốc'}</div>
                                    </div>
                                </div>

                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        router.push(`/contractor/projects/${project.id}`);
                                    }}
                                    className="w-full py-4 bg-blue-600 text-white rounded-2xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 flex items-center justify-center gap-2 active:scale-95"
                                >
                                    <Send size={18} /> Gửi Báo Giá Ngay
                                </button>
                            </div>
                        </HoverCard.Content>
                    </HoverCard.Portal>
                </HoverCard.Root>

                {/* Content */}
                <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start mb-1">
                        <h3 className="font-bold text-slate-900 truncate pr-4 group-hover:text-blue-600 transition-colors text-base">
                            {project.title}
                        </h3>
                        {viewMode === 'list' && (
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1 whitespace-nowrap bg-slate-50 px-2 py-1 rounded-lg">
                                <Clock size={10} /> {new Date(project.createdAt).toLocaleDateString('vi-VN')}
                            </span>
                        )}
                    </div>

                    <div className={`flex flex-wrap gap-x-4 gap-y-2 text-sm text-slate-500 ${viewMode === 'grid' ? 'mb-4' : ''}`}>
                        <span className="flex items-center gap-1.5">
                            <MapPin size={14} className="text-slate-400 group-hover:text-red-500 transition-colors" />
                            {project.location || 'Toàn quốc'}
                        </span>
                        <span className="flex items-center gap-1.5 font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">
                            <DollarSign size={14} />
                            {project.estimatedBudget ? formatCurrency(project.estimatedBudget) : 'Thỏa thuận'}
                        </span>
                    </div>

                    {viewMode === 'grid' && (
                        <div className="mt-auto pt-4 border-t border-slate-50 flex justify-between items-center text-xs text-slate-400">
                            <span>{project.applicationCount} ứng tuyển</span>
                            <span>{project.viewCount} lượt xem</span>
                        </div>
                    )}
                </div>

                {/* Actions (List View Only) */}
                {viewMode === 'list' && (
                    <div className="flex items-center gap-3 shrink-0">
                        <button
                            onClick={(e) => handleToggleSave(e, project.id)}
                            className={`p-2 rounded-xl transition-all ${isSaved ? 'text-blue-600 bg-blue-50 hover:bg-blue-100' : 'text-slate-400 hover:text-blue-600 hover:bg-blue-50'}`}
                        >
                            <Bookmark size={18} className={isSaved ? "fill-current" : ""} />
                        </button>
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                router.push(`/contractor/projects/${project.id}`);
                            }}
                            className="bg-blue-600 text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-lg shadow-blue-200 hover:bg-blue-700 hover:shadow-blue-300 transition-all flex items-center gap-2"
                        >
                            Ứng tuyển <ArrowUpRight size={16} />
                        </button>
                    </div>
                )}
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col">
            <ContractorHeader sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} user={user} />
            <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

            <main className={`flex-1 transition-all duration-300 ${sidebarOpen ? 'lg:ml-64' : 'ml-0'} bg-slate-50 relative z-0`}>
                <div className="h-24 w-full" /> {/* Spacer for Fixed Header */}
                <div className="p-6 md:p-8 max-w-6xl mx-auto space-y-8">

                    {/* Header Section */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                            <h1 className="text-3xl font-black text-slate-900 tracking-tight mb-2">Tìm kiếm cơ hội mới 🚀</h1>
                            <p className="text-slate-500 font-medium text-sm">Khám phá các dự án tiềm năng và mở rộng mạng lưới kinh doanh của bạn.</p>
                        </div>
                        <div className="flex items-center gap-2 bg-white p-1.5 rounded-xl border border-slate-200 shadow-sm">
                            <button
                                onClick={() => setViewMode('list')}
                                className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-slate-100 text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                            >
                                <ListIcon size={20} />
                            </button>
                            <button
                                onClick={() => setViewMode('grid')}
                                className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-slate-100 text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                            >
                                <LayoutGrid size={20} />
                            </button>
                        </div>
                    </div>

                    {/* Search & Filter Bar */}
                    <div className="bg-white p-4 rounded-3xl shadow-sm border border-slate-200 flex flex-col lg:flex-row gap-4 items-center relative z-20">
                        <div className="relative flex-1 w-full">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={20} />
                            <input
                                type="text"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Tìm theo tên dự án, địa điểm, từ khóa..."
                                className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border-none rounded-2xl font-medium outline-none focus:ring-2 focus:ring-blue-500/20 transition-all placeholder:text-slate-400 text-slate-900"
                            />
                        </div>
                        <div className="w-px h-10 bg-slate-100 hidden lg:block"></div>
                        <div className="flex items-center gap-2 w-full lg:w-auto overflow-x-auto no-scrollbar">
                            {CATEGORIES.map(cat => (
                                <button
                                    key={cat.id}
                                    onClick={() => setActiveCategory(cat.id)}
                                    className={`whitespace-nowrap px-4 py-2.5 rounded-xl text-sm font-bold border transition-all ${activeCategory === cat.id
                                        ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-200'
                                        : 'bg-white text-slate-500 border-slate-200 hover:border-blue-200 hover:text-blue-600 hover:bg-slate-50'
                                        }`}
                                >
                                    {cat.name}
                                </button>
                            ))}
                            <button
                                onClick={() => setShowFilters(!showFilters)}
                                className={`whitespace-nowrap px-4 py-2.5 rounded-xl text-sm font-bold border transition-all flex items-center gap-2 ${showFilters ? 'bg-blue-50 border-blue-200 text-blue-600' : 'border-slate-200 text-slate-500 hover:bg-slate-50 hover:border-blue-200 hover:text-blue-600'}`}
                            >
                                <Filter size={16} /> Lọc nâng cao
                            </button>
                        </div>
                    </div>

                    {/* Advanced Filter Panel */}
                    {showFilters && (
                        <div className="bg-white p-6 rounded-3xl shadow-lg border border-slate-200 animate-in slide-in-from-top-2 fade-in duration-200 relative z-10">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="font-bold text-slate-900 text-lg flex items-center gap-2">
                                    <Filter size={20} className="text-blue-600" /> Bộ lọc nâng cao
                                </h3>
                                <button onClick={() => setShowFilters(false)} className="p-2 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 transition-colors">
                                    <X size={20} />
                                </button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                                {/* Budget */}
                                <div className="space-y-3">
                                    <label className="text-xs font-black text-slate-400 uppercase tracking-wider">Ngân sách dự kiến</label>
                                    <div className="flex items-center gap-3">
                                        <div className="relative flex-1">
                                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs">₫</span>
                                            <input type="number" placeholder="Min" className="w-full pl-6 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 outline-none focus:border-blue-500 transition-colors" />
                                        </div>
                                        <span className="text-slate-300 font-bold">-</span>
                                        <div className="relative flex-1">
                                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs">₫</span>
                                            <input type="number" placeholder="Max" className="w-full pl-6 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 outline-none focus:border-blue-500 transition-colors" />
                                        </div>
                                    </div>
                                </div>

                                {/* Location */}
                                <div className="space-y-3">
                                    <label className="text-xs font-black text-slate-400 uppercase tracking-wider">Địa điểm</label>
                                    <select className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 outline-none focus:border-blue-500 transition-colors appearance-none cursor-pointer">
                                        <option>Toàn quốc</option>
                                        <option>Hồ Chí Minh</option>
                                        <option>Hà Nội</option>
                                        <option>Đà Nẵng</option>
                                        <option>Đồng Nai</option>
                                        <option>Bình Dương</option>
                                    </select>
                                </div>

                                {/* Type */}
                                <div className="space-y-3">
                                    <label className="text-xs font-black text-slate-400 uppercase tracking-wider">Độ khẩn cấp</label>
                                    <div className="flex gap-3">
                                        <button className="flex-1 py-2.5 border border-slate-200 rounded-xl text-sm font-bold text-slate-600 hover:border-blue-500 hover:text-blue-600 hover:bg-blue-50 transition-all">Tất cả</button>
                                        <button className="flex-1 py-2.5 border border-red-200 bg-red-50 text-red-600 rounded-xl text-sm font-bold hover:bg-red-100 transition-all flex items-center justify-center gap-1">
                                            <Zap size={14} className="fill-current" /> Gấp
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <div className="flex justify-end gap-3 mt-8 pt-6 border-t border-slate-100">
                                <button
                                    onClick={() => setShowFilters(false)}
                                    className="px-6 py-3 text-slate-500 font-bold hover:bg-slate-50 rounded-xl transition-all"
                                >
                                    Đặt lại
                                </button>
                                <button
                                    onClick={() => { toast.success('Đã áp dụng bộ lọc'); setShowFilters(false) }}
                                    className="px-8 py-3 bg-blue-600 text-white font-bold rounded-xl shadow-lg shadow-blue-200 hover:bg-blue-700 hover:shadow-blue-300 transition-all"
                                >
                                    Áp dụng bộ lọc
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Projects List */}
                    <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' : 'space-y-4'}>
                        {loading ? (
                            // Skeletons
                            Array.from({ length: 6 }).map((_, i) => (
                                <div key={i} className="bg-white rounded-2xl p-4 border border-slate-100 h-32 animate-pulse"></div>
                            ))
                        ) : filteredProjects.length > 0 ? (
                            filteredProjects.map((project) => (
                                <ProjectCard key={project.id} project={project} />
                            ))
                        ) : (
                            <div className="col-span-full py-20 text-center">
                                <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6 text-slate-300">
                                    <Search size={40} />
                                </div>
                                <h3 className="text-xl font-bold text-slate-900">Không tìm thấy dự án nào</h3>
                                <p className="text-slate-500 mt-2">Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm của bạn.</p>
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    )
}
