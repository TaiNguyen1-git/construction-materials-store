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

            <main className={`flex-1 pt-[73px] transition-all duration-300 ${sidebarOpen ? 'lg:ml-64' : 'ml-0'}`}>
                <div className="p-6 lg:p-8 max-w-7xl mx-auto">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">Quản lý Công trình</h1>
                            <p className="text-gray-500">Theo dõi tiến độ các công trình đang thực hiện</p>
                        </div>
                        <Link
                            href="/contractor/projects/new"
                            className="bg-blue-600 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2 hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200"
                        >
                            <Plus className="w-5 h-5" />
                            Tạo Dự Án Mới
                        </Link>
                    </div>

                    {/* Filters */}
                    <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 mb-6 font-bold">
                        <div className="flex flex-col md:flex-row gap-4">
                            <div className="relative flex-1">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Tìm theo tên công trình, khách hàng..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                />
                            </div>
                            <button className="flex items-center justify-center gap-2 px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 font-bold">
                                <Filter className="w-5 h-5 text-gray-500" />
                                <span>Bộ lọc</span>
                            </button>
                        </div>
                    </div>

                    {loading ? (
                        <div className="flex justify-center py-12">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                        </div>
                    ) : projects.length === 0 ? (
                        <div className="bg-white rounded-2xl p-12 text-center border border-dashed border-gray-300">
                            <Building2 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                            <h3 className="text-lg font-bold text-gray-900">Chưa có công trình nào</h3>
                            <p className="text-gray-500 mb-6">Bạn chưa tạo công trình nào.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {filteredProjects.map((project) => (
                                <Link
                                    key={project.id}
                                    href={`/contractor/projects/${project.id}`}
                                    className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow group flex flex-col justify-between"
                                >
                                    <div>
                                        <div className="flex justify-between items-start mb-4">
                                            <div>
                                                <h3 className="text-lg font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
                                                    {project.title}
                                                </h3>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <User className="w-4 h-4 text-gray-400" />
                                                    <span className="text-sm text-gray-500">{project.contactName} - {project.contactPhone}</span>
                                                </div>
                                            </div>
                                            <Badge className={getStatusColor(project.status)}>
                                                {project.status === 'IN_PROGRESS' ? 'Đang thi công' :
                                                    project.status === 'PLANNING' ? 'Đang chuẩn bị' :
                                                        project.status === 'COMPLETED' ? 'Hoàn thành' : project.status}
                                            </Badge>
                                        </div>

                                        <div className="space-y-4 mb-4">
                                            <div>
                                                <div className="flex justify-between text-sm mb-1">
                                                    <span className="text-gray-500 font-bold flex items-center gap-1">
                                                        <CheckCircle className="w-4 h-4 text-green-500" />
                                                        Tiến độ
                                                    </span>
                                                    <span className="font-bold text-blue-600">--%</span>
                                                </div>
                                                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                                                    <div
                                                        className="h-full bg-blue-600 rounded-full transition-all duration-500"
                                                        style={{ width: `0%` }}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <div className="flex items-center text-sm text-gray-600 gap-2">
                                            <MapPin className="w-4 h-4 text-gray-400" />
                                            <span>{project.city}{project.district ? `, ${project.district}` : ''}</span>
                                        </div>
                                        <div className="flex items-center justify-between text-sm text-gray-500 pt-4 border-t border-gray-50 font-bold">
                                            <div className="flex items-center gap-4">
                                                <div className="flex items-center gap-1">
                                                    <Calendar className="w-4 h-4" />
                                                    <span>{new Date(project.createdAt).toLocaleDateString('vi-VN')}</span>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-1 text-blue-600">
                                                <span>Chi tiết</span>
                                                <ChevronRight className="w-4 h-4" />
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
