'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Header from '@/components/Header'
import { MapPin, Calendar, DollarSign, Users, Search, Filter, Plus, Briefcase, Clock } from 'lucide-react'

interface Project {
    id: string
    title: string
    description: string
    projectType: string
    location: string
    city: string
    estimatedBudget: number | null
    budgetType: string
    status: string
    contactName: string
    viewCount: number
    isUrgent: boolean
    applicationCount: number
    createdAt: string
}

const PROJECT_TYPE_LABELS: Record<string, string> = {
    NEW_CONSTRUCTION: 'Xây mới',
    RENOVATION: 'Cải tạo/Sửa chữa',
    INTERIOR: 'Nội thất',
    EXTERIOR: 'Ngoại thất',
    FLOORING: 'Lát sàn/gạch',
    PAINTING: 'Sơn',
    PLUMBING: 'Ống nước',
    ELECTRICAL: 'Điện',
    ROOFING: 'Mái',
    OTHER: 'Khác'
}

export default function ProjectsPage() {
    const [projects, setProjects] = useState<Project[]>([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState('')
    const [filterType, setFilterType] = useState('')

    useEffect(() => {
        fetchProjects()
    }, [filterType])

    const fetchProjects = async () => {
        try {
            setLoading(true)
            const params = new URLSearchParams()
            if (filterType) params.append('type', filterType)

            const res = await fetch(`/api/marketplace/projects?${params.toString()}`)
            if (res.ok) {
                const data = await res.json()
                if (data.success) {
                    setProjects(data.data.projects)
                }
            }
        } catch (error) {
            console.error('Failed to fetch projects:', error)
        } finally {
            setLoading(false)
        }
    }

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND',
            minimumFractionDigits: 0
        }).format(amount)
    }

    const formatDate = (date: string) => {
        return new Date(date).toLocaleDateString('vi-VN')
    }

    const filteredProjects = projects.filter(p =>
        p.title.toLowerCase().includes(search.toLowerCase()) ||
        p.location.toLowerCase().includes(search.toLowerCase())
    )

    return (
        <div className="min-h-screen bg-gray-50">
            <Header />
            {/* Header Section - Clean white */}
            <div className="bg-white border-b border-gray-200 py-8">
                <div className="max-w-6xl mx-auto px-4">
                    <h1 className="text-2xl font-bold text-gray-800 mb-2">Tìm Thầu Xây Dựng</h1>
                    <p className="text-gray-500 mb-6">
                        Kết nối khách hàng với nhà thầu uy tín tại Đồng Nai
                    </p>

                    {/* Search Bar */}
                    <div className="flex gap-3 flex-wrap">
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Tìm theo tên dự án, địa điểm..."
                            className="flex-1 min-w-[250px] px-4 py-2.5 rounded border border-gray-300 text-gray-700 focus:border-blue-500 focus:outline-none"
                        />
                        <select
                            value={filterType}
                            onChange={(e) => setFilterType(e.target.value)}
                            className="px-4 py-2.5 rounded border border-gray-300 text-gray-700 min-w-[160px]"
                        >
                            <option value="">Tất cả loại</option>
                            {Object.entries(PROJECT_TYPE_LABELS).map(([key, label]) => (
                                <option key={key} value={key}>{label}</option>
                            ))}
                        </select>
                        <Link
                            href="/projects/post"
                            className="px-5 py-2.5 bg-blue-600 text-white font-medium rounded hover:bg-blue-700"
                        >
                            + Đăng dự án
                        </Link>
                    </div>
                </div>
            </div>

            {/* Projects List */}
            <div className="max-w-6xl mx-auto px-4 py-8">
                {loading ? (
                    <div className="flex justify-center py-12">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    </div>
                ) : filteredProjects.length === 0 ? (
                    <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
                        <h2 className="text-xl font-semibold text-gray-700 mb-2">Chưa có dự án nào</h2>
                        <p className="text-gray-500 mb-6">Bạn có thể đăng dự án hoặc tìm nhà thầu</p>

                        <div className="flex justify-center gap-4 flex-wrap">
                            <Link
                                href="/projects/post"
                                className="px-6 py-3 bg-blue-600 text-white font-medium rounded hover:bg-blue-700"
                            >
                                Đăng Dự Án
                            </Link>
                            <Link
                                href="/contractors"
                                className="px-6 py-3 border border-gray-300 text-gray-700 font-medium rounded hover:bg-gray-50"
                            >
                                Tìm Nhà Thầu
                            </Link>
                        </div>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredProjects.map((project) => (
                            <Link
                                key={project.id}
                                href={`/projects/${project.id}`}
                                className="bg-white rounded-xl shadow-sm hover:shadow-lg transition-shadow overflow-hidden group"
                            >
                                {/* Card Header */}
                                <div className="p-6">
                                    <div className="flex items-start justify-between mb-3">
                                        <span className="px-3 py-1 bg-blue-100 text-blue-700 text-sm font-medium rounded-full">
                                            {PROJECT_TYPE_LABELS[project.projectType] || project.projectType}
                                        </span>
                                        {project.isUrgent && (
                                            <span className="px-3 py-1 bg-red-100 text-red-700 text-sm font-medium rounded-full">
                                                Gấp
                                            </span>
                                        )}
                                    </div>

                                    <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors mb-2">
                                        {project.title}
                                    </h3>

                                    <p className="text-gray-500 text-sm line-clamp-2 mb-4">
                                        {project.description}
                                    </p>

                                    {/* Info */}
                                    <div className="space-y-2">
                                        <div className="flex items-center text-gray-600 text-sm">
                                            <MapPin className="w-4 h-4 mr-2 text-gray-400" />
                                            {project.location}, {project.city}
                                        </div>
                                        {project.estimatedBudget && (
                                            <div className="flex items-center text-gray-600 text-sm">
                                                {formatCurrency(project.estimatedBudget)}
                                            </div>
                                        )}
                                        <div className="flex items-center text-gray-600 text-sm">
                                            <Clock className="w-4 h-4 mr-2 text-gray-400" />
                                            {formatDate(project.createdAt)}
                                        </div>
                                    </div>
                                </div>

                                {/* Card Footer */}
                                <div className="px-6 py-4 bg-gray-50 border-t flex justify-between items-center">
                                    <div className="flex items-center text-sm text-gray-500">
                                        <Users className="w-4 h-4 mr-1" />
                                        {project.applicationCount} ứng tuyển
                                    </div>
                                    <span className="text-blue-600 text-sm font-medium group-hover:underline">
                                        Xem chi tiết →
                                    </span>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}
