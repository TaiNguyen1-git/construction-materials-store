'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/auth-context'
import {
    Search, Filter, MapPin, Coins,
    LayoutGrid, List as ListIcon,
    ArrowUpRight, Clock, Zap,
    Bookmark, Send, X,
    ChevronRight, Star, User
} from 'lucide-react'
import toast, { Toaster } from 'react-hot-toast'
import { formatCurrency } from '@/utils/formatters'
import * as HoverCard from '@radix-ui/react-hover-card'
import { fetchWithAuth } from '@/lib/api-client'
import { Badge } from '@/components/ui/badge'

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
            toast.error('Không thể cập nhật trạng thái lưu.', { id: 'save-error' })
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
                className={`group bg-white rounded-2xl cursor-pointer hover:shadow-md hover:border-primary/20 bg-white transition-all duration-300 relative border border-slate-100 p-6 ${viewMode === 'list' ? 'flex flex-col sm:flex-row sm:items-center gap-6' : 'flex flex-col h-full'
                    }`}
            >
                {/* Status Badge */}
                    <div className="absolute top-0 left-0 bg-rose-600 text-white text-[10px] font-bold px-3 py-1.5 rounded-br-xl z-10 flex items-center gap-1.5 shadow-sm">
                        <Zap size={10} className="fill-current text-white" /> GẤP
                    </div>

                {/* Content */}
                <div className="flex-1 min-w-0 space-y-4">
                    <div className="flex justify-between items-start gap-4">
                        <h3 className="font-bold text-slate-900 line-clamp-1 group-hover:text-blue-600 transition-all text-xl">
                            {project.title}
                        </h3>
                        {viewMode === 'list' && (
                            <div className="hidden sm:flex items-center gap-1.5 text-[10px] text-slate-400 font-bold whitespace-nowrap bg-slate-50 px-3 py-1 rounded-full">
                                <Clock size={12} /> {new Date(project.createdAt).toLocaleDateString('vi-VN')}
                            </div>
                        )}
                    </div>

                    <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-slate-500 font-semibold items-center">
                        <span className="flex items-center gap-2">
                            <MapPin size={16} className="text-blue-600/60" />
                            {project.location || 'Toàn quốc'}
                        </span>
                        <span className="flex items-center gap-2 text-blue-600 font-bold">
                            <Coins size={16} />
                            {project.estimatedBudget ? formatCurrency(project.estimatedBudget) : 'Thỏa thuận'}
                        </span>
                        {viewMode === 'list' && (
                            <span className="flex items-center gap-2 text-slate-400">
                                <User size={16} /> {project.applicationCount} ứng tuyển
                            </span>
                        )}
                    </div>

                    {viewMode === 'grid' && (
                        <div className="pt-4 border-t border-slate-50 flex justify-between items-center text-[11px] font-bold text-slate-400">
                            <span>{project.applicationCount} ứng tuyển</span>
                            <span>{project.viewCount} lượt xem</span>
                        </div>
                    )}
                </div>

                {/* Actions (List View Only) */}
                {viewMode === 'list' && (
                    <div className="flex items-center gap-3 shrink-0 sm:ml-4 pt-4 sm:pt-0 border-t sm:border-t-0 border-slate-50">
                        <button
                            onClick={(e) => handleToggleSave(e, project.id)}
                            className={`p-3 rounded-xl transition-all ${isSaved ? 'text-blue-600 bg-blue-50' : 'text-slate-300 hover:text-blue-600 hover:bg-slate-50 bg-white border border-slate-100'}`}
                        >
                            <Bookmark size={20} className={isSaved ? "fill-current" : ""} />
                        </button>
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                router.push(`/contractor/projects/${project.id}`);
                            }}
                            className="bg-blue-600 text-white px-6 py-3 rounded-xl text-xs font-bold shadow-md hover:bg-blue-700 transition-all flex items-center gap-2 active:scale-95"
                        >
                            Xem chi tiết <ArrowUpRight size={16} />
                        </button>
                    </div>
                )}
            </div>
        )
    }

    return (
        <div className="max-w-7xl mx-auto space-y-8 pb-24">
            <Toaster position="top-right" />
            
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 px-4 sm:px-0">
                <div className="space-y-1">
                    <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
                        Cơ hội thầu dự án
                    </h1>
                    <p className="text-slate-500 text-sm font-medium">Khám phá và thầu các dự án tiềm năng trên Marketplace</p>
                </div>
                <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl shadow-inner">
                    <button
                        onClick={() => setViewMode('list')}
                        className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                    >
                        <ListIcon size={20} />
                    </button>
                    <button
                        onClick={() => setViewMode('grid')}
                        className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                    >
                        <LayoutGrid size={20} />
                    </button>
                </div>
            </div>

            {/* Marketplace Controls */}
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col xl:flex-row gap-4 items-center">
                <div className="relative flex-1 w-full group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-blue-600 transition-colors" size={20} />
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Tìm kiếm theo tên dự án, vị trí hoặc từ khóa..."
                        className="w-full pl-12 pr-4 py-3 bg-slate-50 border-none rounded-xl font-semibold outline-none focus:ring-4 focus:ring-blue-600/5 focus:bg-white transition-all placeholder:text-slate-300 text-slate-900 shadow-inner"
                    />
                </div>
                
                <div className="flex items-center gap-2 w-full xl:w-auto overflow-x-auto no-scrollbar py-1">
                    {CATEGORIES.map(cat => (
                        <button
                            key={cat.id}
                            onClick={() => setActiveCategory(cat.id)}
                            className={`whitespace-nowrap px-5 py-2.5 rounded-xl text-xs font-bold transition-all border ${activeCategory === cat.id
                                ? 'bg-blue-600 text-white border-blue-600 shadow-md'
                                : 'bg-white text-slate-500 border-slate-200 hover:border-blue-600/40 hover:text-blue-600'
                                }`}
                        >
                            {cat.name}
                        </button>
                    ))}
                    <button
                        onClick={() => setShowFilters(!showFilters)}
                        className={`whitespace-nowrap px-5 py-2.5 rounded-xl text-xs font-bold transition-all border flex items-center gap-2  ${showFilters ? 'bg-slate-900 border-slate-900 text-white' : 'bg-white border-slate-200 text-slate-500 hover:border-primary'}`}
                    >
                        <Filter size={16} /> Lọc
                    </button>
                </div>
            </div>

            {/* Results */}
            <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 px-4 sm:px-0' : 'space-y-4 px-4 sm:px-0'}>
                {loading ? (
                    Array.from({ length: 6 }).map((_, i) => (
                        <div key={i} className="bg-white rounded-2xl p-8 border border-slate-50 h-56 animate-pulse"></div>
                    ))
                ) : filteredProjects.length > 0 ? (
                    filteredProjects.map((project) => (
                        <ProjectCard key={project.id} project={project} />
                    ))
                ) : (
                    <div className="col-span-full py-32 text-center space-y-6 bg-white rounded-3xl border border-dashed border-slate-200">
                        <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto text-slate-200">
                            <Search size={40} />
                        </div>
                        <div className="space-y-1">
                            <h3 className="text-xl font-bold text-slate-900">Không tìm thấy dự án phù hợp</h3>
                            <p className="text-slate-400 font-medium text-sm">Thử thay đổi từ khóa hoặc bộ lọc của bạn.</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
