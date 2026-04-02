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
    city: string
    district: string
    progress?: number
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
            if (!response.ok) throw new Error('Fetch projects failure: Node unsynced')
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

    const getStatusStyle = (status: string) => {
        switch (status) {
            case 'PLANNING': return 'bg-blue-50 text-blue-600 border-blue-100 placeholder:Tracking-widest font-black uppercase italic text-[9px]'
            case 'IN_PROGRESS': return 'bg-orange-50 text-orange-600 border-orange-100 placeholder:Tracking-widest font-black uppercase italic text-[9px]'
            case 'COMPLETED': return 'bg-emerald-50 text-emerald-600 border-emerald-100 placeholder:Tracking-widest font-black uppercase italic text-[9px]'
            case 'ON_HOLD': return 'bg-rose-50 text-rose-600 border-rose-100 placeholder:Tracking-widest font-black uppercase italic text-[9px]'
            default: return 'bg-slate-50 text-slate-600 border-slate-100 placeholder:Tracking-widest font-black uppercase italic text-[9px]'
        }
    }

    return (
        <div className="space-y-12 animate-in fade-in duration-700 pb-24 max-w-7xl mx-auto">
            {/* Tactical Control Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
                <div className="space-y-2">
                    <h1 className="text-5xl font-black text-slate-900 tracking-tighter uppercase italic flex items-center gap-4">
                        <Layers className="w-12 h-12 text-blue-600" />
                        Project Command
                    </h1>
                    <p className="text-slate-500 font-bold uppercase text-[10px] tracking-[0.3em]">Quản lý và theo dõi tiến độ thi công toàn diện B2B</p>
                </div>
                <Link
                    href="/contractor/projects/new"
                    className="px-10 py-5 bg-slate-900 text-white rounded-[2rem] text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-3 hover:bg-black transition-all shadow-2xl shadow-slate-200 active:scale-95 group"
                >
                    <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform" />
                    Initialize New Node
                </Link>
            </div>

            {/* Precision Search & Filter Terminal */}
            <div className="bg-white p-6 rounded-[3rem] shadow-xl shadow-slate-100/50 border border-slate-50 flex flex-col lg:flex-row gap-6 items-center">
                <div className="relative flex-1 w-full group">
                    <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-6 h-6 text-slate-300 group-focus-within:text-blue-500 transition-colors" />
                    <input
                        type="text"
                        placeholder="Search Core Project Node / Principal Identity..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-16 pr-8 py-5 bg-slate-50 border-none rounded-[1.8rem] text-sm font-bold italic focus:bg-white focus:ring-4 focus:ring-blue-500/5 outline-none transition-all placeholder:text-slate-300"
                    />
                </div>
                <button className="flex items-center justify-center gap-3 px-10 py-5 bg-white border-2 border-slate-50 rounded-[1.8rem] hover:bg-slate-50 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-900 transition-all active:scale-95 w-full lg:w-auto">
                    <Filter className="w-4 h-4" />
                    <span>Filter Ops</span>
                </button>
            </div>

            {error ? (
                <div className="bg-white rounded-[4rem] p-24 text-center border-2 border-rose-50 shadow-2xl shadow-rose-200/20">
                    <div className="w-24 h-24 bg-rose-50 rounded-[2.5rem] flex items-center justify-center mx-auto mb-8 shadow-inner">
                        <AlertTriangle className="w-12 h-12 text-rose-500" />
                    </div>
                    <h3 className="font-black text-3xl text-slate-900 mb-2 uppercase italic tracking-tighter">Transmission Error</h3>
                    <p className="text-slate-500 font-bold uppercase text-[10px] tracking-[0.2em] mb-12 max-w-sm mx-auto">Critical failure in telemetry synchronization. Check network integrity.</p>
                    <button
                        onClick={() => refetch()}
                        className="px-12 py-5 bg-rose-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-rose-700 transition-all shadow-2xl shadow-rose-200 active:scale-95 flex items-center justify-center mx-auto gap-3"
                    >
                        <RefreshCw className="w-4 h-4" /> Reset Sync Protocol
                    </button>
                </div>
            ) : loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                    {[1, 2, 3, 4, 5, 6].map(i => (
                        <div key={i} className="h-[420px] bg-white rounded-[3.5rem] border border-slate-50 shadow-sm animate-pulse flex flex-col p-10 space-y-8">
                            <div className="flex justify-between">
                                <div className="w-16 h-16 bg-slate-50 rounded-2xl" />
                                <div className="w-24 h-8 bg-slate-50 rounded-xl" />
                            </div>
                            <div className="space-y-4">
                                <div className="w-3/4 h-8 bg-slate-50 rounded-lg" />
                                <div className="w-1/2 h-4 bg-slate-50 rounded-lg" />
                            </div>
                            <div className="mt-auto h-20 bg-slate-50 rounded-[2rem]" />
                        </div>
                    ))}
                </div>
            ) : filteredProjects.length === 0 ? (
                <div className="bg-white rounded-[4rem] p-32 text-center border border-slate-50 shadow-2xl shadow-slate-100/50 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/5 rounded-full blur-[100px] -mr-48 -mt-48 transition-all duration-1000 group-hover:scale-110"></div>
                    <div className="relative z-10">
                        <div className="w-32 h-32 bg-slate-50 rounded-[2.5rem] flex items-center justify-center mx-auto mb-10 shadow-inner group-hover:rotate-12 transition-transform duration-500">
                            <Building2 className="w-16 h-16 text-slate-200" />
                        </div>
                        <h3 className="text-3xl font-black text-slate-900 mb-2 uppercase italic tracking-tighter">No Active Nodes</h3>
                        <p className="text-slate-500 font-bold uppercase text-[10px] tracking-[0.3em] mb-12 max-w-sm mx-auto leading-relaxed">
                            No projects detected in the current matrix. Initializing the first node is required for fiscal operation.
                        </p>
                        <Link
                            href="/contractor/projects/new"
                            className="inline-flex items-center gap-4 px-12 py-6 bg-slate-900 text-white rounded-[2rem] text-[10px] font-black uppercase tracking-[0.3em] hover:bg-black transition-all shadow-2xl shadow-slate-200 active:scale-95 group/btn"
                        >
                            Initialize Node <ArrowRight className="w-5 h-5 group-hover/btn:translate-x-2 transition-transform" />
                        </Link>
                    </div>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {filteredProjects.map((project) => (
                        <Link
                            key={project.id}
                            href={`/contractor/projects/${project.id}`}
                            className="bg-white rounded-[3.5rem] p-10 shadow-sm border border-slate-100 hover:shadow-2xl hover:shadow-blue-200/50 hover:border-blue-200 transition-all duration-700 group flex flex-col justify-between h-[480px] relative overflow-hidden"
                        >
                            <div className="absolute top-0 right-0 w-48 h-48 bg-slate-50 rounded-full -mr-24 -mt-24 group-hover:scale-150 transition-transform duration-1000 opacity-40"></div>
                            
                            <div className="relative z-10 space-y-8">
                                <div className="flex justify-between items-start">
                                    <div className="w-16 h-16 bg-slate-950 text-white rounded-[1.5rem] flex items-center justify-center shadow-xl shadow-slate-200 group-hover:rotate-3 transition-transform">
                                        <Building2 size={32} />
                                    </div>
                                    <Badge className={`${getStatusStyle(project.status)} px-5 py-2 rounded-full border shadow-sm`}>
                                        {project.status === 'IN_PROGRESS' ? 'Operational' :
                                            project.status === 'PLANNING' ? 'Drafting' :
                                                project.status === 'COMPLETED' ? 'Finalized' : project.status}
                                    </Badge>
                                </div>

                                <div className="space-y-3">
                                    <h3 className="text-2xl font-black text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-2 leading-tight uppercase italic tracking-tighter">
                                        {project.title}
                                    </h3>
                                    <div className="flex items-center gap-3 text-[10px] font-black text-slate-400 uppercase tracking-widest italic">
                                        <div className="w-6 h-6 bg-slate-50 rounded-lg flex items-center justify-center">
                                            <User size={12} className="text-slate-300" />
                                        </div>
                                        {project.contactName}
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div className="flex justify-between text-[9px] font-black text-slate-400 uppercase tracking-widest italic">
                                        <span className="flex items-center gap-2">
                                            <Activity className="w-3.5 h-3.5 text-blue-500" />
                                            Site Telemetry
                                        </span>
                                        <span className="text-blue-600">{project.progress || 0}% Completion</span>
                                    </div>
                                    <div className="h-2.5 bg-slate-50 rounded-full overflow-hidden shadow-inner p-0.5 border border-slate-100">
                                        <div
                                            className="h-full bg-gradient-to-r from-blue-600 via-indigo-600 to-indigo-950 rounded-full transition-all duration-1000 group-hover:shadow-[0_0_15px_rgba(37,99,235,0.4)]"
                                            style={{ width: `${project.progress || 0}%` }}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="mt-auto pt-10 border-t border-slate-50 flex items-center justify-between relative z-10">
                                <div className="flex items-center gap-3 text-slate-500 font-black text-[9px] uppercase tracking-widest italic">
                                    <MapPin size={16} className="text-blue-400" />
                                    <span>{project.city}</span>
                                </div>
                                <div className="flex items-center gap-3 text-slate-900 font-black text-[10px] uppercase tracking-widest group-hover:translate-x-2 transition-transform italic bg-slate-50 px-6 py-3 rounded-2xl group-hover:bg-slate-950 group-hover:text-white">
                                    Audit Node <ArrowRight size={16} />
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
