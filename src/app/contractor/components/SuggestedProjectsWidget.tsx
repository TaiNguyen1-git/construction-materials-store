'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { fetchWithAuth } from '@/lib/api-client'
import { Briefcase, Target, ArrowRight, Zap, Clock, MapPin, DollarSign } from 'lucide-react'

interface SuggestedProject {
    id: string
    title: string
    description: string
    projectType: string
    location: string
    city: string
    estimatedBudget: number | null
    budgetType: string
    isUrgent: boolean
    applicationCount: number
    createdAt: string
    matchScore: number
    matchReasons: string[]
}

const PROJECT_TYPE_LABELS: Record<string, string> = {
    NEW_CONSTRUCTION: 'Xây mới',
    RENOVATION: 'Cải tạo',
    INTERIOR: 'Nội thất',
    EXTERIOR: 'Ngoại thất',
    FLOORING: 'Lát sàn',
    PAINTING: 'Sơn',
    PLUMBING: 'Ống nước',
    ELECTRICAL: 'Điện',
    ROOFING: 'Mái',
    OTHER: 'Khác'
}

interface SuggestedProjectsWidgetProps {
    displayMode?: 'list' | 'grid'
}

export default function SuggestedProjectsWidget({ displayMode = 'list' }: SuggestedProjectsWidgetProps) {
    const [projects, setProjects] = useState<SuggestedProject[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        fetchSuggestedProjects()
    }, [])

    const fetchSuggestedProjects = async () => {
        try {
            setLoading(true)
            const res = await fetchWithAuth('/api/marketplace/projects/suggested')

            if (res.ok) {
                const data = await res.json()
                if (data.success) {
                    // Combine urgent and matching, prioritize urgent
                    const combined = [
                        ...(data.data.urgent || []),
                        ...(data.data.matching || []),
                        ...(data.data.recent || [])
                    ].slice(0, 6)
                    setProjects(combined)
                }
            } else {
                setError('Không thể tải dữ liệu')
            }
        } catch (err) {
            console.error('Failed to fetch suggested projects:', err)
            setError('Lỗi kết nối')
        } finally {
            setLoading(false)
        }
    }

    const formatCurrency = (amount: number) => {
        if (amount >= 1000000000) {
            return `${(amount / 1000000000).toFixed(1)} tỷ`
        }
        if (amount >= 1000000) {
            return `${(amount / 1000000).toFixed(0)} tr`
        }
        return amount.toLocaleString('vi-VN') + 'đ'
    }

    const getTimeAgo = (date: string) => {
        const hours = Math.floor((Date.now() - new Date(date).getTime()) / (1000 * 60 * 60))
        if (hours < 1) return 'Vừa đăng'
        if (hours < 24) return `${hours}h trước`
        const days = Math.floor(hours / 24)
        if (days === 1) return 'Hôm qua'
        return `${days} ngày trước`
    }

    if (loading) {
        if (displayMode === 'grid') {
            return (
                <div className="mb-8">
                    <div className="flex items-center justify-between mb-4">
                        <div className="h-6 w-48 bg-gray-200 rounded animate-pulse" />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="h-48 bg-gray-100 rounded-xl animate-pulse" />
                        ))}
                    </div>
                </div>
            )
        }
        return (
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                <div className="space-y-3">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="h-20 bg-gray-100 rounded-lg animate-pulse" />
                    ))}
                </div>
            </div>
        )
    }

    if (error) {
        return (
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 text-center">
                <p className="text-gray-500 text-sm">{error}</p>
            </div>
        )
    }

    // LIST MODE (Fallback / Sidebar)
    if (displayMode === 'list') {
        if (projects.length === 0) {
            return (
                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100/50">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">Dự án phù hợp</h2>
                    <div className="text-center py-6">
                        <p className="text-gray-500 text-sm mb-3">Chưa có dự án mới</p>
                        <Link href="/projects" className="text-blue-600 text-sm font-medium hover:underline">
                            Tìm kiếm tất cả
                        </Link>
                    </div>
                </div>
            )
        }

        return (
            <div className="bg-white rounded-2xl shadow-sm border-2 border-primary-50 overflow-hidden h-full flex flex-col relative ring-1 ring-primary-100/50">
                <div className="flex items-center justify-between p-5 bg-gradient-to-r from-primary-50 to-white border-b border-primary-100">
                    <div className="flex items-center gap-3">
                        <div className="bg-white p-2 rounded-lg shadow-sm text-primary-600">
                            <Target className="w-5 h-5" />
                        </div>
                        <div>
                            <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
                                Dự án phù hợp
                                <span className="bg-primary-600 text-white text-[10px] px-2 py-0.5 rounded-full font-bold shadow-sm shadow-primary-200">MỚI</span>
                            </h2>
                            <p className="text-xs text-gray-500 font-medium">{projects.length} cơ hội tiềm năng</p>
                        </div>
                    </div>
                </div>

                <div className="divide-y divide-gray-50 flex-1 overflow-auto max-h-[400px]">
                    {projects.map((project) => (
                        <Link key={project.id} href={`/projects/${project.id}`} className="block p-4 hover:bg-gray-50 transition-colors">
                            <div className="flex items-start gap-3">
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1.5">
                                        {project.isUrgent && (
                                            <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide bg-red-100 text-red-700 rounded">Gấp</span>
                                        )}
                                        <span className="text-[11px] text-gray-400">{getTimeAgo(project.createdAt)}</span>
                                    </div>
                                    <h3 className="font-medium text-gray-900 text-sm truncate mb-1">{project.title}</h3>
                                    <div className="flex items-center gap-3 text-xs text-gray-500">
                                        <span>{project.city}</span>
                                        {project.estimatedBudget && project.estimatedBudget > 0 && (
                                            <span className="font-medium text-gray-700">{formatCurrency(project.estimatedBudget)}</span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            </div>
        )
    }

    // GRID MODE (Hero Section)
    return (
        <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                    <Zap className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                    Cơ hội dành riêng cho bạn
                    <span className="bg-primary-100 text-primary-700 text-xs px-2 py-0.5 rounded-full font-medium shadow-sm">
                        {projects.length} dự án mới
                    </span>
                </h2>
                <Link href="/projects" className="text-sm font-medium text-primary-600 hover:text-primary-700 flex items-center gap-1">
                    Xem tất cả <ArrowRight className="w-4 h-4" />
                </Link>
            </div>

            {projects.length === 0 ? (
                <div className="bg-white rounded-xl p-8 text-center border border-dashed border-gray-300">
                    <p className="text-gray-500 mb-2">Chưa có dự án phù hợp tiêu chí của bạn</p>
                    <Link href="/contractor/profile" className="text-primary-600 hover:underline">Cập nhật hồ sơ năng lực</Link>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {projects.slice(0, 3).map((project) => (
                        <Link key={project.id} href={`/projects/${project.id}`}
                            className="group bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-xl hover:shadow-primary-100/50 hover:border-primary-200 transition-all duration-300 relative overflow-hidden flex flex-col h-full">

                            {/* Urgent Badge */}
                            {project.isUrgent && (
                                <div className="absolute top-0 right-0 bg-red-500 text-white text-[10px] font-bold px-3 py-1 rounded-bl-xl z-10 shadow-sm">
                                    GẤP
                                </div>
                            )}

                            {/* Card Header */}
                            <div className="flex items-start justify-between mb-4">
                                <div className="p-2.5 bg-primary-50 text-primary-600 rounded-xl group-hover:bg-primary-600 group-hover:text-white transition-colors duration-300 shadow-sm">
                                    <Briefcase className="w-5 h-5" />
                                </div>
                                <span className="text-xs text-gray-400 font-medium px-2 py-1 bg-gray-50 rounded-lg">{getTimeAgo(project.createdAt)}</span>
                            </div>

                            {/* Card Content */}
                            <div className="flex-1">
                                <h3 className="font-bold text-gray-900 mb-3 text-base line-clamp-2 group-hover:text-primary-700 transition-colors">
                                    {project.title}
                                </h3>

                                <div className="space-y-2 mb-4">
                                    <div className="flex items-center text-xs text-gray-600 bg-gray-50 p-2 rounded-lg">
                                        <DollarSign className="w-4 h-4 text-gray-400 mr-2" />
                                        <span className="font-semibold text-gray-900">
                                            {project.estimatedBudget ? formatCurrency(project.estimatedBudget) : 'Thỏa thuận'}
                                        </span>
                                    </div>
                                    <div className="flex items-center text-xs text-gray-600 bg-gray-50 p-2 rounded-lg">
                                        <MapPin className="w-4 h-4 text-gray-400 mr-2" />
                                        <span className="truncate">{project.location}, {project.city}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Footer */}
                            <div className="pt-4 border-t border-gray-100 mt-auto flex items-center justify-between">
                                <div className="flex items-center gap-1">
                                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                                    <span className="text-xs font-bold text-gray-700">
                                        {project.matchScore}% phù hợp
                                    </span>
                                </div>
                                <span className="text-xs text-primary-600 font-medium group-hover:translate-x-1 transition-transform inline-flex items-center">
                                    Xem chi tiết <ArrowRight className="w-3 h-3 ml-1" />
                                </span>
                            </div>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    )
}
