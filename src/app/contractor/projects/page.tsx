'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Sidebar from '../components/Sidebar'
import ContractorHeader from '../components/ContractorHeader'
import {
    Building2,
    Calendar,
    Clock,
    ChevronRight,
    Search,
    User,
    CheckCircle,
    Plus,
    Filter,
    MapPin
} from 'lucide-react'
import { fetchWithAuth } from '@/lib/api-client'
import { Badge } from '@/components/ui/badge'

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
    // Optional derived fields for UI if we want to keep structure similar
    taskCompletion?: number
    totalTasks?: number
    completedTasks?: number
}

export default function ContractorProjectsPage() {
    const [sidebarOpen, setSidebarOpen] = useState(true)
    const [projects, setProjects] = useState<Project[]>([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState('')
    const [user, setUser] = useState<any>(null)

    useEffect(() => {
        const userData = localStorage.getItem('user')
        if (userData) {
            setUser(JSON.parse(userData))
        }
        fetchProjects()
    }, [])

    const fetchProjects = async () => {
        setLoading(true)
        try {
            const response = await fetchWithAuth('/api/contractors/projects')
            if (response.ok) {
                const result = await response.json()
                setProjects(result.data || [])
            }
        } catch (error) {
            console.error('Fetch projects error:', error)
        } finally {
            setLoading(false)
        }
    }

    const filteredProjects = projects.filter(p =>
        p.title.toLowerCase().includes(search.toLowerCase()) ||
        p.description.toLowerCase().includes(search.toLowerCase())
    )

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'PLANNING': return 'bg-blue-100 text-blue-700'
            case 'IN_PROGRESS': return 'bg-orange-100 text-orange-700'
            case 'COMPLETED': return 'bg-green-100 text-green-700'
            case 'ON_HOLD': return 'bg-red-100 text-red-700'
            default: return 'bg-gray-100 text-gray-700'
        }
    }

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount)
    }

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            <ContractorHeader sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} user={user} />

            <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

            <main className={`flex-1 pt-[60px] transition-all duration-300 ${sidebarOpen ? 'lg:ml-64' : 'ml-0'}`}>
                <div className="p-4 lg:p-6 max-w-7xl mx-auto">
                    {/* Header - Compact */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                        <div>
                            <h1 className="text-xl font-black text-gray-900 uppercase tracking-tight">Quản lý Công trình</h1>
                            <p className="text-xs text-gray-500 font-medium mt-1">Theo dõi tiến độ và trạng thái các dự án</p>
                        </div>
                        <Link
                            href="/contractor/projects/new"
                            className="bg-primary-600 text-white px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest flex items-center gap-2 hover:bg-primary-700 transition-all shadow-lg shadow-primary-200"
                        >
                            <Plus className="w-4 h-4" />
                            Tạo Dự Án Mới
                        </Link>
                    </div>

                    {/* Filters - High Density */}
                    <div className="bg-white p-3 rounded-xl shadow-sm border border-gray-100 mb-6 flex flex-col md:flex-row gap-3">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Tìm theo tên công trình, khách hàng..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-100 rounded-lg text-sm text-gray-900 focus:ring-2 focus:ring-primary-100 focus:border-primary-500 outline-none transition-all"
                            />
                        </div>
                        <button className="flex items-center justify-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 text-xs font-bold uppercase tracking-wide text-gray-600 transition-colors">
                            <Filter className="w-4 h-4" />
                            <span>Bộ lọc</span>
                        </button>
                    </div>

                    {loading ? (
                        <div className="flex justify-center py-12">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                        </div>
                    ) : projects.length === 0 ? (
                        <div className="bg-white rounded-2xl p-12 text-center border border-dashed border-gray-200">
                            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Building2 className="w-8 h-8 text-gray-300" />
                            </div>
                            <h3 className="text-sm font-black text-gray-900 uppercase mb-1">Chưa có công trình</h3>
                            <p className="text-xs text-gray-500">Bạn chưa tạo công trình nào trong hệ thống.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                            {filteredProjects.map((project) => (
                                <Link
                                    key={project.id}
                                    href={`/contractor/projects/${project.id}`}
                                    className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 hover:shadow-md hover:border-primary-100 transition-all group flex flex-col justify-between h-full"
                                >
                                    <div>
                                        <div className="flex justify-between items-start mb-3">
                                            <div className="flex-1 pr-2">
                                                <h3 className="text-sm font-black text-gray-900 group-hover:text-primary-600 transition-colors line-clamp-1 mb-1">
                                                    {project.title}
                                                </h3>
                                                <div className="flex items-center gap-1.5 text-gray-500">
                                                    <User className="w-3.5 h-3.5" />
                                                    <span className="text-[11px] font-medium truncate">{project.contactName}</span>
                                                </div>
                                            </div>
                                            <Badge className={`${getStatusColor(project.status)} px-2 py-1 text-[10px] font-black uppercase tracking-wider border-0 rounded-lg`}>
                                                {project.status === 'IN_PROGRESS' ? 'Đang thi công' :
                                                    project.status === 'PLANNING' ? 'Chuẩn bị' :
                                                        project.status === 'COMPLETED' ? 'Hoàn thành' : project.status}
                                            </Badge>
                                        </div>

                                        <div className="mb-4">
                                            <div className="flex justify-between text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">
                                                <span className="flex items-center gap-1">
                                                    <CheckCircle className="w-3 h-3 text-emerald-500" />
                                                    Tiến độ
                                                </span>
                                                <span className="text-primary-600">--%</span>
                                            </div>
                                            <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-gradient-to-r from-primary-500 to-indigo-500 rounded-full transition-all duration-500"
                                                    style={{ width: `0%` }}
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="mt-auto pt-3 border-t border-gray-50">
                                        <div className="flex items-center justify-between text-[11px]">
                                            <div className="flex items-center gap-1.5 text-gray-500 font-medium">
                                                <MapPin className="w-3.5 h-3.5 text-gray-400" />
                                                <span className="truncate max-w-[120px]">{project.city}</span>
                                            </div>
                                            <div className="flex items-center gap-1 text-primary-600 font-bold group-hover:underline">
                                                Chi tiết <ChevronRight className="w-3.5 h-3.5" />
                                            </div>
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    )}
                </div>
            </main>
        </div>
    )
}
