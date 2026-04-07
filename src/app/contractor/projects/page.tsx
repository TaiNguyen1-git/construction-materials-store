'use client'

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
    SearchX,
    Cpu,
    ArrowUpRight,
    LayoutGrid,
    Activity,
    Layers,
    Clock,
    Zap
} from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { fetchWithAuth } from '@/lib/api-client'
import { Badge } from '@/components/ui/badge'
import { useAuth } from '@/contexts/auth-context'
import toast, { Toaster } from 'react-hot-toast'

const formatCurrency = (val: number) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val)

interface Project {
    id: string
    title: string
    description: string
    status: string
    createdAt: string
    estimatedBudget: number
    contactName: string
    contactPhone: string
    location: string
    city: string
    isUrgent: boolean
}

export default function ContractorProjectsPage() {
    const { user, isAuthenticated } = useAuth()
    const [searchQuery, setSearchQuery] = useState('')
    const [statusFilter, setStatusFilter] = useState('all')

    const { data: projects, isLoading } = useQuery({
        queryKey: ['contractor-projects', statusFilter],
        queryFn: async () => {
            const res = await fetchWithAuth('/api/contractors/projects')
            const data = await res.json()
            return data.success ? data.data : []
        },
        enabled: isAuthenticated
    })

    const filteredProjects = (projects || []) as Project[]
    
    const handleSearch = () => {
        toast.loading(`Đang tìm kiếm: ${searchQuery}...`, { duration: 1000 })
    }

    const handleApplyFilter = (status: string) => {
        setStatusFilter(status)
    }

    return (
        <div className="space-y-8 pb-20 max-w-7xl mx-auto">
            <Toaster position="top-right" />
            
            {/* Standard Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 px-4 sm:px-0">
                <div className="space-y-1">
                    <h1 className="text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-3">
                        <Building2 className="w-8 h-8 text-blue-600" />
                        Danh sách công trình
                    </h1>
                    <p className="text-slate-500 text-sm font-medium">Quản lý và theo dõi tiến độ các dự án đang tham gia</p>
                </div>
                <div className="flex items-center gap-3">
                    <Link 
                        href="/contractor/projects/new"
                        className="px-6 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold flex items-center gap-2 hover:bg-blue-700 transition-all shadow-sm active:scale-95"
                    >
                        <Plus size={18} /> Khởi tạo dự án
                    </Link>
                    <button 
                         onClick={() => toast.success('Đã làm mới dữ liệu')}
                        className="w-10 h-10 bg-white border border-slate-200 text-slate-400 hover:text-blue-600 rounded-lg flex items-center justify-center transition-all shadow-sm active:scale-95"
                    >
                        <RefreshCw className="w-5 h-5" />
                    </button>
                </div>
            </div>

            {/* Filter Bar */}
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 flex flex-col lg:flex-row gap-4">
                <div className="relative flex-1 group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-blue-600 transition-colors" />
                    <input
                        type="text"
                        placeholder="Tìm dự án theo tên, vị trí hoặc chủ đầu tư..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                        className="w-full pl-11 pr-4 py-3 bg-slate-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-blue-100 focus:bg-white outline-none transition-all font-medium placeholder:text-slate-300"
                    />
                </div>
                <div className="flex bg-slate-50 p-1 rounded-xl gap-1">
                    {[
                        { id: 'all', label: 'Tất cả' },
                        { id: 'IN_PROGRESS', label: 'Đang thi công' },
                        { id: 'COMPLETED', label: 'Đã hoàn thành' },
                        { id: 'OPEN', label: 'Đang đấu thầu' }
                    ].map((status) => (
                        <button
                            key={status.id}
                            onClick={() => handleApplyFilter(status.id)}
                            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${statusFilter === status.id ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                        >
                            {status.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Project Grid */}
            {isLoading ? (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[1, 2, 3, 4, 5, 6].map(i => (
                        <div key={i} className="bg-white rounded-2xl h-80 animate-pulse border border-slate-50 shadow-sm" />
                    ))}
                </div>
            ) : filteredProjects.length === 0 ? (
                <div className="py-32 bg-white rounded-3xl border border-dashed border-slate-200 flex flex-col items-center justify-center text-center space-y-6">
                    <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center text-slate-200">
                        <SearchX size={40} />
                    </div>
                    <div className="space-y-1">
                        <h2 className="text-xl font-bold text-slate-900">Không tìm thấy công trình</h2>
                        <p className="text-sm text-slate-400 font-medium">Thử điều chỉnh bộ lọc hoặc từ khóa tìm kiếm</p>
                    </div>
                    <button 
                        onClick={() => setStatusFilter('all')}
                        className="px-6 py-2.5 bg-blue-600 text-white rounded-xl text-xs font-bold active:scale-95 shadow-lg shadow-blue-500/10 hover:bg-blue-700 transition-all"
                    >
                        Làm mới bộ lọc
                    </button>
                </div>
            ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredProjects.map((project) => (
                        <Link 
                            key={project.id} 
                            href={`/contractor/projects/${project.id}`}
                            className="bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md hover:border-blue-200 transition-all group overflow-hidden flex flex-col h-full"
                        >
                            <div className="p-6 space-y-6 flex-1">
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <Badge className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                                            project.status === 'IN_PROGRESS' ? 'bg-orange-50 text-orange-600 border-orange-100' :
                                            project.status === 'COMPLETED' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-blue-50 text-blue-600 border-blue-100'
                                        }`}>
                                            {project.status === 'IN_PROGRESS' ? 'Đang thực hiện' :
                                             project.status === 'COMPLETED' ? 'Hoàn thành' : 'Đang đấu thầu'}
                                        </Badge>
                                        {project.isUrgent && (
                                            <div className="px-2 py-1 bg-rose-50 text-rose-500 rounded-md text-[10px] font-bold flex items-center gap-1">
                                                <AlertTriangle size={12} /> Ưu tiên
                                            </div>
                                        )}
                                    </div>
                                    <h3 className="text-xl font-bold text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-2 h-14">{project.title}</h3>
                                </div>

                                <div className="space-y-4">
                                    <div className="flex items-center gap-2 text-xs font-medium text-slate-400">
                                        <MapPin size={16} className="text-blue-500/60" /> {project.city}
                                    </div>
                                    <div className="flex items-center justify-between pt-2">
                                        <div className="space-y-0.5">
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Ngân sách</p>
                                            <p className="text-lg font-bold text-blue-600">
                                                {formatCurrency(project.estimatedBudget)}
                                            </p>
                                        </div>
                                        <div className="w-10 h-10 bg-slate-50 text-slate-400 rounded-xl flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-all shadow-sm">
                                            <ArrowUpRight size={20} />
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            {/* Simple Footer Bar */}
                            <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-[10px]">
                                        {project.contactName?.charAt(0) || 'D'}
                                    </div>
                                    <p className="text-[11px] font-bold text-slate-600 truncate max-w-[120px]">{project.contactName}</p>
                                </div>
                                <div className="flex items-center gap-1.5 opacity-60">
                                    <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></div>
                                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Đã xác thực</span>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    )
}

const RefreshCw = ({ className }: { className?: string }) => (
    <svg className={className} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" /><path d="M21 3v5h-5" /><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" /><path d="M3 21v-5h5" /></svg>
)
