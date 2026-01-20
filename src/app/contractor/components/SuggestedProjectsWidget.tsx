'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { fetchWithAuth } from '@/lib/api-client'

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

export default function SuggestedProjectsWidget() {
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
        return (
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold text-gray-900">Dự án phù hợp với bạn</h2>
                </div>
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
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Dự án phù hợp với bạn</h2>
                <p className="text-gray-500 text-sm">{error}</p>
            </div>
        )
    }

    if (projects.length === 0) {
        return (
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Dự án phù hợp với bạn</h2>
                <div className="text-center py-6">
                    <p className="text-gray-500 text-sm mb-3">Chưa có dự án phù hợp</p>
                    <Link
                        href="/projects"
                        className="text-blue-600 text-sm font-medium hover:underline"
                    >
                        Xem tất cả dự án
                    </Link>
                </div>
            </div>
        )
    }

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
                <div>
                    <h2 className="text-lg font-semibold text-gray-900">Dự án phù hợp với bạn</h2>
                    <p className="text-sm text-gray-500 mt-0.5">{projects.length} dự án đang tuyển</p>
                </div>
                <Link
                    href="/projects"
                    className="text-sm text-blue-600 font-medium hover:text-blue-700"
                >
                    Xem tất cả
                </Link>
            </div>

            <div className="divide-y divide-gray-50">
                {projects.map((project) => (
                    <Link
                        key={project.id}
                        href={`/projects/${project.id}`}
                        className="block p-4 hover:bg-gray-50 transition-colors"
                    >
                        <div className="flex items-start gap-3">
                            <div className="flex-1 min-w-0">
                                {/* Header row */}
                                <div className="flex items-center gap-2 mb-1.5">
                                    {project.isUrgent && (
                                        <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide bg-red-100 text-red-700 rounded">
                                            Gấp
                                        </span>
                                    )}
                                    <span className="px-2 py-0.5 text-[10px] font-medium bg-gray-100 text-gray-600 rounded">
                                        {PROJECT_TYPE_LABELS[project.projectType] || project.projectType}
                                    </span>
                                    <span className="text-[11px] text-gray-400">
                                        {getTimeAgo(project.createdAt)}
                                    </span>
                                </div>

                                {/* Title */}
                                <h3 className="font-medium text-gray-900 text-sm truncate mb-1">
                                    {project.title}
                                </h3>

                                {/* Location & Budget */}
                                <div className="flex items-center gap-3 text-xs text-gray-500">
                                    <span>{project.location}, {project.city}</span>
                                    {project.estimatedBudget && project.estimatedBudget > 0 && (
                                        <>
                                            <span className="text-gray-300">•</span>
                                            <span className="font-medium text-gray-700">
                                                {formatCurrency(project.estimatedBudget)}
                                            </span>
                                        </>
                                    )}
                                </div>

                                {/* Match reason */}
                                {project.matchReasons.length > 0 && (
                                    <p className="text-[11px] text-blue-600 mt-1.5">
                                        {project.matchReasons[0]}
                                    </p>
                                )}
                            </div>

                            {/* Right side - Application count */}
                            <div className="text-right flex-shrink-0">
                                <div className="text-xs text-gray-400">
                                    {project.applicationCount} ứng tuyển
                                </div>
                            </div>
                        </div>
                    </Link>
                ))}
            </div>

            {/* Footer CTA */}
            <div className="p-4 bg-gray-50 border-t border-gray-100">
                <Link
                    href="/projects"
                    className="block w-full py-2.5 text-center text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
                >
                    Tìm thêm dự án mới
                </Link>
            </div>
        </div>
    )
}
