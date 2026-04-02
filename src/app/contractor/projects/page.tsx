'use client'

/**
 * Contractor Projects Page
 * High-density project management for B2B contractors
 */

import { useState } from 'react'
import Link from 'next/link'
import {
    Building2,
    Search,
    User,
    CheckCircle,
    Plus,
    Filter,
    MapPin,
    AlertTriangle,
    ArrowRight,
    SearchX
} from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { fetchWithAuth } from '@/lib/api-client'
import { Badge } from '@/components/ui/badge'
import { useAuth } from '@/contexts/auth-context'
import { formatCurrency } from '@/lib/format-utils'

interface Project {
    id: string
    title: string
    description: string
    status: string
    createdAt: string
    estimatedBudget: number
    contactName: string
    contactPhone: string
    city: string
    district: string
    taskCompletion?: number
    totalTasks?: number
    completedTasks?: number
    organization?: {
        id: string
        name: string
    }
}

export default function ContractorProjectsPage() {
    const { isAuthenticated } = useAuth()
    const [search, setSearch] = useState('')

    const { data: projects = [], isLoading: loading, error, refetch } = useQuery({
        queryKey: ['contractor-projects'],
        queryFn: async () => {
            const response = await fetchWithAuth('/api/contractors/projects')
            if (!response.ok) throw new Error('Fetch projects failed')
            const result = await response.json()
            return (result.data || []) as Project[]
        },
        enabled: isAuthenticated,
        staleTime: 5 * 60 * 1000
    })

    const filteredProjects = projects.filter((p: Project) => {
        const searchLower = search.toLowerCase()
        const title = (p.title || '').toLowerCase()
        const description = (p.description || '').toLowerCase()
        const contactName = (p.contactName || '').toLowerCase()
        
        return title.includes(searchLower) || 
               description.includes(searchLower) || 
               contactName.includes(searchLower)
    })

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'PLANNING': return 'bg-blue-100 text-blue-700'
            case 'IN_PROGRESS': return 'bg-orange-100 text-orange-700'
            case 'COMPLETED': return 'bg-emerald-100 text-emerald-700'
            case 'ON_HOLD': return 'bg-red-100 text-red-700'
            default: return 'bg-slate-100 text-slate-700'
        }
    }

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight">Quản lý Công trình</h1>
                    <p className="text-sm text-slate-500 font-medium mt-1">Quản lý và theo dõi tiến độ thi công thời gian thực</p>
                </div>
                <Link
                    href="/contractor/projects/new"
                    className="bg-primary-600 text-white px-8 py-3.5 rounded-2xl text-xs font-black uppercase tracking-[0.2em] flex items-center gap-2 hover:bg-primary-700 transition-all shadow-xl shadow-primary-100 active:scale-95"
                >
                    <Plus className="w-4 h-4" />
                    Tạo Dự Án Mới
                </Link>
            </div>

            {/* Filter Bar */}
            <div className="bg-white p-4 rounded-[2rem] shadow-sm border border-slate-100 flex flex-col md:flex-row gap-4 items-center">
                <div className="relative flex-1 w-full">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Tìm theo tên công trình, khách hàng..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-12 pr-6 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm text-slate-900 focus:ring-2 focus:ring-primary-100 focus:border-primary-500 outline-none transition-all placeholder:text-slate-400 font-medium"
                    />
                </div>
                <button className="flex items-center justify-center gap-2 px-8 py-3 bg-white border border-slate-100 rounded-2xl hover:bg-slate-50 text-[11px] font-black uppercase tracking-widest text-slate-600 transition-all active:scale-95 w-full md:w-auto">
                    <Filter className="w-4 h-4" />
                    <span>Bộ lọc</span>
                </button>
            </div>

            {error ? (
                <div className="bg-white rounded-[2.5rem] p-20 text-center border border-red-50 shadow-xl shadow-red-50/50">
                    <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
                        <AlertTriangle className="w-10 h-10 text-red-500" />
                    </div>
                    <h3 className="font-black text-2xl text-slate-900 mb-2">Đã xảy ra lỗi</h3>
                    <p className="text-slate-500 text-sm mb-10 max-w-md mx-auto">{(error as Error)?.message || 'Không thể tải danh sách công trình vào lúc này.'}</p>
                    <button
                        onClick={() => refetch()}
                        className="px-10 py-4 bg-red-600 text-white rounded-2xl text-[11px] font-black uppercase tracking-widest hover:bg-red-700 transition-all shadow-lg shadow-red-100"
                    >
                        Thử lại ngay
                    </button>
                </div>
            ) : loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {[1, 2, 3, 4, 5, 6].map(i => (
                        <div key={i} className="h-[280px] bg-white rounded-[2.5rem] border border-slate-100 shadow-sm animate-pulse" />
                    ))}
                </div>
            ) : filteredProjects.length === 0 ? (
                /* Improved Empty State with Professional Illustration feel */
                <div className="bg-white rounded-[3rem] p-24 text-center border border-slate-100 shadow-xl shadow-slate-200/20 relative overflow-hidden">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(99,102,241,0.05)_0%,transparent_50%)]"></div>
                    <div className="relative z-10">
                        <div className="w-32 h-32 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-8 ring-8 ring-white shadow-inner">
                            <Building2 className="w-16 h-16 text-slate-200" />
                        </div>
                        <h3 className="text-2xl font-black text-slate-900 mb-2 uppercase tracking-tight">Chưa có dự án nào</h3>
                        <p className="text-slate-500 font-medium mb-12 max-w-md mx-auto leading-relaxed">
                            Bắt đầu hành trình quản lý chuyên nghiệp bằng cách tạo dự án đầu tiên của bạn để bóc tách vật tư và theo dõi tiến độ.
                        </p>
                        <Link
                            href="/contractor/projects/new"
                            className="inline-flex items-center gap-3 px-10 py-5 bg-slate-900 text-white rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] hover:bg-black transition-all shadow-2xl shadow-slate-200 active:scale-95 group"
                        >
                            Khởi tạo dự án ngay <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        </Link>
                    </div>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {filteredProjects.map((project) => (
                        <Link
                            key={project.id}
                            href={`/contractor/projects/${project.id}`}
                            className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-100 hover:shadow-xl hover:shadow-indigo-50/50 hover:border-primary-100 transition-all group flex flex-col justify-between h-full relative overflow-hidden"
                        >
                            <div className="absolute top-0 right-0 w-32 h-32 bg-slate-50 rounded-full -mr-16 -mt-16 group-hover:scale-125 transition-transform duration-1000 opacity-60"></div>
                            
                            <div className="relative z-10">
                                <div className="flex justify-between items-start mb-6">
                                    <div className="flex-1 pr-4">
                                        <h3 className="text-xl font-black text-slate-900 group-hover:text-primary-600 transition-colors line-clamp-2 mb-2 leading-tight">
                                            {project.title}
                                        </h3>
                                        <div className="flex items-center gap-2 text-slate-400 font-bold uppercase tracking-widest text-[9px]">
                                            <User className="w-3.5 h-3.5" />
                                            {project.contactName}
                                        </div>
                                    </div>
                                    <Badge className={`${getStatusColor(project.status)} px-3 py-1.5 text-[9px] font-black uppercase tracking-widest border-0 rounded-xl shadow-sm`}>
                                        {project.status === 'IN_PROGRESS' ? 'Đang thi công' :
                                            project.status === 'PLANNING' ? 'Chuẩn bị' :
                                                project.status === 'COMPLETED' ? 'Hoàn thành' : project.status}
                                    </Badge>
                                </div>

                                {project.organization && (
                                    <div className="mb-4 inline-flex items-center gap-2 px-3 py-1.5 bg-indigo-50/50 rounded-xl border border-indigo-100/50">
                                        <Building2 className="w-3.5 h-3.5 text-indigo-600" />
                                        <span className="text-[10px] font-black text-indigo-700 uppercase tracking-widest truncate max-w-[180px]">
                                            {project.organization.name}
                                        </span>
                                    </div>
                                )}

                                <div className="mb-8">
                                    <div className="flex justify-between text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                                        <span className="flex items-center gap-2">
                                            <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                                            Tiến độ thi công
                                        </span>
                                        <span className="text-primary-600">--%</span>
                                    </div>
                                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden shadow-inner">
                                        <div
                                            className="h-full bg-gradient-to-r from-primary-500 to-indigo-600 rounded-full transition-all duration-1000 group-hover:shadow-[0_0_12px_rgba(79,70,229,0.4)]"
                                            style={{ width: `0%` }}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="mt-auto pt-6 border-t border-slate-50 flex items-center justify-between relative z-10">
                                <div className="flex items-center gap-2 text-slate-500 font-bold">
                                    <MapPin className="w-4 h-4 text-slate-400" />
                                    <span className="text-xs">{project.city}</span>
                                </div>
                                <div className="flex items-center gap-2 text-primary-600 font-black text-[11px] uppercase tracking-widest group-hover:translate-x-1 transition-transform">
                                    Chi tiết <ArrowRight className="w-4 h-4" />
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    )
}
