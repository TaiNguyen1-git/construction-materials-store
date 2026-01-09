'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Sidebar from '../components/Sidebar'
import {
    Building2,
    Calendar,
    Clock,
    ChevronRight,
    Search,
    Menu,
    Bell,
    User,
    LogOut,
    CheckCircle,
    Plus,
    Filter
} from 'lucide-react'
import { fetchWithAuth } from '@/lib/api-client'
import { Badge } from '@/components/ui/badge'

interface Project {
    id: string
    name: string
    description: string
    status: string
    startDate: string
    endDate: string | null
    taskCompletion: number
    totalTasks: number
    completedTasks: number
    customer: {
        user: {
            name: string
        }
    }
}

export default function ContractorProjectsPage() {
    const [sidebarOpen, setSidebarOpen] = useState(false)
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
            const response = await fetchWithAuth('/api/projects')
            if (response.ok) {
                const result = await response.json()
                setProjects(result.data || [])
            }
        } catch (error) {
            console.error('Error fetching projects:', error)
        } finally {
            setLoading(false)
        }
    }

    const filteredProjects = projects.filter(p =>
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.customer.user.name.toLowerCase().includes(search.toLowerCase())
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

    const handleLogout = () => {
        localStorage.removeItem('access_token')
        localStorage.removeItem('user')
        window.location.href = '/contractor'
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Top Navigation */}
            <nav className="fixed top-0 left-0 right-0 z-30 bg-white border-b border-gray-200 shadow-sm">
                <div className="px-4 lg:px-6 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => setSidebarOpen(true)}
                                className="lg:hidden p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                            >
                                <Menu className="w-6 h-6" />
                            </button>
                            <Link href="/contractor/dashboard" className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                                    <Building2 className="w-6 h-6 text-white" />
                                </div>
                                <div className="hidden sm:block">
                                    <span className="text-xl font-bold text-gray-900">SmartBuild</span>
                                    <span className="text-blue-600 font-semibold ml-1">PRO</span>
                                </div>
                            </Link>
                        </div>

                        <div className="flex items-center gap-3">
                            <div className="hidden sm:flex items-center gap-2 text-gray-700 px-3 py-2 bg-gray-50 rounded-lg">
                                <User className="w-4 h-4 text-blue-600" />
                                <span className="font-medium text-sm">{user?.name}</span>
                            </div>
                            <button
                                onClick={handleLogout}
                                className="p-2 text-gray-500 hover:text-red-600 rounded-lg"
                            >
                                <LogOut className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                </div>
            </nav>

            <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

            <main className="lg:ml-64 pt-[73px]">
                <div className="p-6 lg:p-8 max-w-7xl mx-auto">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">Quản lý Công trình</h1>
                            <p className="text-gray-500">Theo dõi tiến độ các công trình đang thực hiện</p>
                        </div>
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
                            <p className="text-gray-500 mb-6">Bạn chưa được phân công vào công trình nào của cửa hàng.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {filteredProjects.map((project) => (
                                <Link
                                    key={project.id}
                                    href={`/contractor/projects/${project.id}`}
                                    className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow group"
                                >
                                    <div className="flex justify-between items-start mb-4">
                                        <div>
                                            <h3 className="text-lg font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
                                                {project.name}
                                            </h3>
                                            <div className="flex items-center gap-2 mt-1">
                                                <User className="w-4 h-4 text-gray-400" />
                                                <span className="text-sm text-gray-500">{project.customer.user.name}</span>
                                            </div>
                                        </div>
                                        <Badge className={getStatusColor(project.status)}>
                                            {project.status === 'IN_PROGRESS' ? 'Đang thi công' :
                                                project.status === 'PLANNING' ? 'Đang chuẩn bị' :
                                                    project.status === 'COMPLETED' ? 'Hoàn thành' : project.status}
                                        </Badge>
                                    </div>

                                    <div className="space-y-4">
                                        <div>
                                            <div className="flex justify-between text-sm mb-1">
                                                <span className="text-gray-500 font-bold flex items-center gap-1">
                                                    <CheckCircle className="w-4 h-4 text-green-500" />
                                                    Tiến độ: {project.completedTasks}/{project.totalTasks} đầu việc
                                                </span>
                                                <span className="font-bold text-blue-600">{project.taskCompletion}%</span>
                                            </div>
                                            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-blue-600 rounded-full transition-all duration-500"
                                                    style={{ width: `${project.taskCompletion}%` }}
                                                />
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-between text-sm text-gray-500 pt-4 border-t border-gray-50 font-bold">
                                            <div className="flex items-center gap-4">
                                                <div className="flex items-center gap-1">
                                                    <Calendar className="w-4 h-4" />
                                                    <span>{new Date(project.startDate).toLocaleDateString('vi-VN')}</span>
                                                </div>
                                                {project.endDate && (
                                                    <div className="flex items-center gap-1">
                                                        <Clock className="w-4 h-4" />
                                                        <span>HT: {new Date(project.endDate).toLocaleDateString('vi-VN')}</span>
                                                    </div>
                                                )}
                                            </div>
                                            <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-blue-600 transition-colors" />
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
