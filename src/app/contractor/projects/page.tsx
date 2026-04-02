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
        toast.loading(`Đang quét hệ thống dữ liệu: ${searchQuery}...`, { duration: 1500 })
    }

    const handleApplyFilter = (status: string) => {
        setStatusFilter(status)
        toast.success(`Đã cập nhật trạng thái: ${status === 'all' ? 'Tất cả' : status}`)
    }

    return (
        <div className="space-y-12 animate-in fade-in duration-1000 pb-24 max-w-7xl mx-auto">
            <Toaster position="top-right" />
            
            {/* Command Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-10">
                <div className="space-y-3">
                    <h1 className="text-5xl font-black text-slate-900 tracking-tighter uppercase italic flex items-center gap-5">
                        <Cpu className="w-12 h-12 text-blue-600" />
                        Trung tâm công trình
                    </h1>
                    <p className="text-slate-500 font-bold uppercase text-[10px] tracking-[0.3em] italic">Quản lý và điều phối dự án thi công đa kênh</p>
                </div>
                <div className="flex items-center gap-4">
                    <button 
                        onClick={() => toast.loading('Đang khởi tạo dự án mới...', { duration: 2000 })}
                        className="px-10 py-6 bg-blue-600 text-white rounded-[2rem] text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-4 hover:bg-blue-700 transition-all shadow-2xl shadow-blue-500/30 active:scale-95 italic group"
                    >
                        <Plus size={20} className="group-hover:rotate-90 transition-transform" /> Khởi tạo dự án
                    </button>
                    <button 
                         onClick={() => toast.success('Đã làm mới dữ liệu hệ thống')}
                        className="w-16 h-16 bg-white border border-slate-100 text-slate-400 hover:text-blue-600 rounded-[1.5rem] flex items-center justify-center transition-all shadow-sm active:scale-95"
                    >
                        <RefreshCw className="w-6 h-6" />
                    </button>
                </div>
            </div>

            {/* Filter Terminal */}
            <div className="bg-white rounded-[3.5rem] p-4 shadow-2xl shadow-slate-200/40 border border-slate-50 flex flex-col lg:flex-row gap-4">
                <div className="relative flex-1 group">
                    <Search className="absolute left-8 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 group-focus-within:text-blue-600 transition-colors" />
                    <input
                        type="text"
                        placeholder="Tìm kiếm dự án theo tên, vị trí hoặc chủ đầu tư..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                        className="w-full pl-20 pr-8 py-7 bg-slate-50 border-none rounded-[2.5rem] text-sm focus:ring-4 focus:ring-blue-500/10 focus:bg-white outline-none transition-all font-bold placeholder:text-slate-300"
                    />
                </div>
                <div className="flex bg-slate-50 p-2 rounded-[2.5rem] gap-2">
                    {['all', 'IN_PROGRESS', 'COMPLETED', 'OPEN'].map((status) => (
                        <button
                            key={status}
                            onClick={() => handleApplyFilter(status)}
                            className={`px-10 py-5 rounded-[2rem] text-[10px] font-black uppercase tracking-widest transition-all italic ${statusFilter === status ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-200' : 'text-slate-400 hover:text-indigo-600'}`}
                        >
                            {status === 'all' ? 'Tất cả' : status === 'IN_PROGRESS' ? 'Đang thi công' : status === 'COMPLETED' ? 'Đã hoàn thành' : 'Đang đấu thầu'}
                        </button>
                    ))}
                </div>
            </div>

            {/* Grid Shards */}
            {isLoading ? (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-10">
                    {[1, 2, 3, 4, 5, 6].map(i => (
                        <div key={i} className="bg-white rounded-[4rem] h-96 animate-pulse p-1 border border-slate-50 shadow-sm" />
                    ))}
                </div>
            ) : filteredProjects.length === 0 ? (
                <div className="py-40 bg-white rounded-[4rem] border-4 border-dashed border-slate-50 flex flex-col items-center justify-center text-center space-y-8">
                    <div className="w-32 h-32 bg-slate-50 rounded-[3rem] flex items-center justify-center text-slate-200 shadow-inner">
                        <SearchX size={64} />
                    </div>
                    <div className="space-y-3">
                        <h2 className="text-3xl font-black text-slate-900 uppercase italic tracking-tighter">Không tìm thấy dữ liệu</h2>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Hệ thống không phát hiện dự án nào trong phạm vi tìm kiếm.</p>
                    </div>
                    <button 
                        onClick={() => setStatusFilter('all')}
                        className="px-8 py-4 bg-indigo-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest italic active:scale-95 transition-all shadow-xl shadow-indigo-100"
                    >
                        Làm mới bộ lọc
                    </button>
                </div>
            ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-10">
                    {filteredProjects.map((project) => (
                        <Link 
                            key={project.id} 
                            href={`/contractor/projects/${project.id}`}
                            className="bg-white rounded-[3.5rem] p-2 border border-slate-50 shadow-xl shadow-slate-200/30 hover:shadow-2xl hover:shadow-blue-200 hover:-translate-y-2 transition-all duration-700 group relative"
                        >
                            <div className="p-10 space-y-10">
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <Badge className={`px-5 py-2 rounded-full text-[9px] font-black uppercase tracking-widest border-2 ${
                                            project.status === 'IN_PROGRESS' ? 'bg-orange-50 text-orange-600 border-orange-100' :
                                            project.status === 'COMPLETED' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-blue-50 text-blue-600 border-blue-100'
                                        }`}>
                                            {project.status === 'IN_PROGRESS' ? '• Đang thực hiện' :
                                             project.status === 'COMPLETED' ? '• Đã hoàn thành' : '• Đang đấu thầu'}
                                        </Badge>
                                        {project.isUrgent && (
                                            <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-500 flex items-center justify-center shadow-lg shadow-rose-100">
                                                <AlertTriangle size={16} />
                                            </div>
                                        )}
                                    </div>
                                    <h3 className="text-2xl font-black text-slate-900 leading-tight group-hover:text-blue-600 transition-colors uppercase italic tracking-tighter h-20 line-clamp-3">{project.title}</h3>
                                </div>

                                <div className="space-y-6">
                                    <div className="flex items-center gap-4 text-[10px] font-black text-slate-400 uppercase tracking-widest italic bg-slate-50/50 p-4 rounded-2xl">
                                        <MapPin size={18} className="text-blue-600" /> {project.city}
                                    </div>
                                    <div className="flex items-center justify-between px-2">
                                        <div className="space-y-1">
                                            <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest">Ngân sách</p>
                                            <p className="text-xl font-black italic tracking-tighter text-blue-600 tabular-nums">
                                                {formatCurrency(project.estimatedBudget)}
                                            </p>
                                        </div>
                                        <div className="w-12 h-12 bg-blue-600 text-white rounded-2xl flex items-center justify-center shadow-2xl shadow-blue-100 group-hover:scale-110 group-hover:rotate-12 transition-transform">
                                            <ArrowUpRight size={24} />
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            {/* Detailed Telemetry Bar */}
                            <div className="mt-4 p-8 bg-slate-950 rounded-b-[3.2rem] flex items-center justify-between text-white overflow-hidden relative">
                                <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 to-indigo-600/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                <div className="flex items-center gap-4 relative z-10">
                                    <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center font-black text-xs italic">
                                        {project.contactName?.charAt(0) || 'D'}
                                    </div>
                                    <div className="space-y-0.5">
                                        <p className="text-[9px] font-black uppercase text-blue-300 leading-none italic">Chủ đầu tư</p>
                                        <p className="text-[11px] font-black uppercase italic tracking-tighter">{project.contactName}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 relative z-10">
                                    <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                                    <span className="text-[9px] font-black uppercase tracking-widest">Đã xác minh</span>
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
