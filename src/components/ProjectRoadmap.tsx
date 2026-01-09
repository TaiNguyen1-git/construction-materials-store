'use client'

import { useState, useEffect } from 'react'
import {
    Calendar, CheckCircle, Clock, AlertTriangle, ChevronRight,
    ShoppingCart, Loader2, Package, Play, Pause, RotateCcw,
    Bell, ArrowRight
} from 'lucide-react'
import Link from 'next/link'
import toast from 'react-hot-toast'

interface ProjectPhase {
    id: string
    name: string
    description?: string
    order: number
    status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'SKIPPED'
    estimatedStartDate?: string
    estimatedEndDate?: string
    actualStartDate?: string
    actualEndDate?: string
    purchaseDeadline?: string
    recommendedMaterials?: Array<{
        productId?: string
        name: string
        quantity: number
        unit?: string
        priority: string
    }>
    completionPercent: number
}

interface ProjectReminder {
    id: string
    title: string
    message: string
    type: string
    priority: string
    scheduledFor: string
    isRead: boolean
}

interface ProjectRoadmapProps {
    estimateId: string
    projectType: string
    area: number
    materials: any[]
    startDate?: string
    onPhaseUpdate?: (phase: ProjectPhase) => void
}

export default function ProjectRoadmap({
    estimateId,
    projectType,
    area,
    materials,
    startDate,
    onPhaseUpdate
}: ProjectRoadmapProps) {
    const [phases, setPhases] = useState<ProjectPhase[]>([])
    const [reminders, setReminders] = useState<ProjectReminder[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [isGenerating, setIsGenerating] = useState(false)
    const [expandedPhase, setExpandedPhase] = useState<string | null>(null)

    useEffect(() => {
        fetchRoadmap()
    }, [estimateId])

    const fetchRoadmap = async () => {
        try {
            const res = await fetch(`/api/projects/generate-roadmap?estimateId=${estimateId}`)
            if (res.ok) {
                const data = await res.json()
                setPhases(data.phases || [])
                setReminders(data.upcomingReminders || [])
            }
        } catch (error) {
            console.error('Error fetching roadmap:', error)
        } finally {
            setIsLoading(false)
        }
    }

    const generateRoadmap = async () => {
        setIsGenerating(true)
        try {
            const res = await fetch('/api/projects/generate-roadmap', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    estimateId,
                    projectType,
                    area,
                    materials,
                    startDate
                })
            })

            const data = await res.json()
            if (res.ok) {
                setPhases(data.phases || [])
                toast.success(data.message)
                fetchRoadmap() // Refresh to get reminders
            } else {
                toast.error(data.error || 'Không thể tạo lộ trình')
            }
        } catch (error) {
            toast.error('Lỗi kết nối server')
        } finally {
            setIsGenerating(false)
        }
    }

    const updatePhaseStatus = async (phaseId: string, newStatus: string) => {
        // This would call an API to update the phase status
        // For now, we'll just update locally
        setPhases(prev => prev.map(p =>
            p.id === phaseId ? { ...p, status: newStatus as any } : p
        ))
        toast.success('Đã cập nhật trạng thái giai đoạn')
    }

    const formatDate = (dateStr?: string) => {
        if (!dateStr) return 'Chưa xác định'
        return new Date(dateStr).toLocaleDateString('vi-VN', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        })
    }

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'COMPLETED': return 'bg-green-500'
            case 'IN_PROGRESS': return 'bg-blue-500'
            case 'SKIPPED': return 'bg-gray-400'
            default: return 'bg-gray-300'
        }
    }

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'COMPLETED': return <CheckCircle className="w-5 h-5 text-green-500" />
            case 'IN_PROGRESS': return <Play className="w-5 h-5 text-blue-500" />
            case 'SKIPPED': return <RotateCcw className="w-5 h-5 text-gray-400" />
            default: return <Clock className="w-5 h-5 text-gray-400" />
        }
    }

    const getDaysUntil = (dateStr?: string) => {
        if (!dateStr) return null
        const days = Math.ceil((new Date(dateStr).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
        return days
    }

    if (isLoading) {
        return (
            <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
                <Loader2 className="w-8 h-8 animate-spin text-blue-500 mx-auto mb-3" />
                <p className="text-gray-500">Đang tải lộ trình...</p>
            </div>
        )
    }

    if (phases.length === 0) {
        return (
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-8 text-center border border-blue-100">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Calendar className="w-8 h-8 text-blue-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-800 mb-2">Tạo Lộ Trình Xây Dựng</h3>
                <p className="text-gray-600 mb-6 max-w-md mx-auto">
                    AI sẽ phân tích dự toán của bạn và tạo ra lộ trình thi công chi tiết,
                    bao gồm thời gian mua vật tư và các mốc quan trọng.
                </p>
                <button
                    onClick={generateRoadmap}
                    disabled={isGenerating}
                    className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-bold hover:from-blue-700 hover:to-indigo-700 transition-all disabled:opacity-50 flex items-center gap-2 mx-auto"
                >
                    {isGenerating ? (
                        <>
                            <Loader2 className="w-5 h-5 animate-spin" />
                            AI đang phân tích...
                        </>
                    ) : (
                        <>
                            <Calendar className="w-5 h-5" />
                            Tạo Lộ Trình Thông Minh
                        </>
                    )}
                </button>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Upcoming Reminders */}
            {reminders.length > 0 && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                    <h4 className="font-bold text-amber-800 flex items-center gap-2 mb-3">
                        <Bell className="w-4 h-4" />
                        Nhắc nhở sắp tới
                    </h4>
                    <div className="space-y-2">
                        {reminders.slice(0, 3).map(reminder => {
                            const daysUntil = getDaysUntil(reminder.scheduledFor)
                            return (
                                <div key={reminder.id} className="flex items-start gap-3 bg-white rounded-lg p-3">
                                    <AlertTriangle className={`w-4 h-4 flex-shrink-0 mt-0.5 ${daysUntil && daysUntil <= 3 ? 'text-red-500' : 'text-amber-500'
                                        }`} />
                                    <div className="flex-1">
                                        <p className="text-sm font-medium text-gray-800">{reminder.title}</p>
                                        <p className="text-xs text-gray-500">{reminder.message}</p>
                                    </div>
                                    <span className={`text-xs font-bold px-2 py-1 rounded-full ${daysUntil && daysUntil <= 3
                                            ? 'bg-red-100 text-red-700'
                                            : 'bg-amber-100 text-amber-700'
                                        }`}>
                                        {daysUntil && daysUntil > 0 ? `${daysUntil} ngày` : 'Hôm nay'}
                                    </span>
                                </div>
                            )
                        })}
                    </div>
                </div>
            )}

            {/* Timeline */}
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
                <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4 text-white">
                    <h3 className="font-bold text-lg">Lộ Trình Thi Công</h3>
                    <p className="text-blue-100 text-sm">{phases.length} giai đoạn • {projectType}</p>
                </div>

                <div className="p-6">
                    <div className="relative">
                        {/* Timeline Line */}
                        <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200"></div>

                        {phases.map((phase, index) => (
                            <div key={phase.id} className="relative pl-12 pb-8 last:pb-0">
                                {/* Timeline Dot */}
                                <div className={`absolute left-2 w-5 h-5 rounded-full border-4 border-white shadow ${getStatusColor(phase.status)}`}></div>

                                {/* Phase Card */}
                                <div
                                    className={`bg-gray-50 rounded-xl p-4 cursor-pointer hover:bg-gray-100 transition-colors ${expandedPhase === phase.id ? 'ring-2 ring-blue-500' : ''
                                        }`}
                                    onClick={() => setExpandedPhase(expandedPhase === phase.id ? null : phase.id)}
                                >
                                    <div className="flex items-start justify-between mb-2">
                                        <div className="flex items-center gap-3">
                                            {getStatusIcon(phase.status)}
                                            <div>
                                                <h4 className="font-bold text-gray-800">{phase.name}</h4>
                                                <p className="text-xs text-gray-500">
                                                    {formatDate(phase.estimatedStartDate)} - {formatDate(phase.estimatedEndDate)}
                                                </p>
                                            </div>
                                        </div>
                                        <ChevronRight className={`w-5 h-5 text-gray-400 transition-transform ${expandedPhase === phase.id ? 'rotate-90' : ''
                                            }`} />
                                    </div>

                                    {phase.description && (
                                        <p className="text-sm text-gray-600 mb-3">{phase.description}</p>
                                    )}

                                    {/* Progress Bar */}
                                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden mb-3">
                                        <div
                                            className={`h-full transition-all ${getStatusColor(phase.status)}`}
                                            style={{ width: `${phase.completionPercent}%` }}
                                        ></div>
                                    </div>

                                    {/* Expanded Content */}
                                    {expandedPhase === phase.id && (
                                        <div className="mt-4 pt-4 border-t border-gray-200 space-y-4">
                                            {/* Status Actions */}
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); updatePhaseStatus(phase.id, 'IN_PROGRESS') }}
                                                    className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 ${phase.status === 'IN_PROGRESS'
                                                            ? 'bg-blue-500 text-white'
                                                            : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                                                        }`}
                                                >
                                                    <Play className="w-3 h-3" /> Đang làm
                                                </button>
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); updatePhaseStatus(phase.id, 'COMPLETED') }}
                                                    className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 ${phase.status === 'COMPLETED'
                                                            ? 'bg-green-500 text-white'
                                                            : 'bg-green-100 text-green-700 hover:bg-green-200'
                                                        }`}
                                                >
                                                    <CheckCircle className="w-3 h-3" /> Hoàn thành
                                                </button>
                                            </div>

                                            {/* Materials */}
                                            {phase.recommendedMaterials && phase.recommendedMaterials.length > 0 && (
                                                <div>
                                                    <h5 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                                                        Vật tư cần mua
                                                    </h5>
                                                    <div className="space-y-2">
                                                        {phase.recommendedMaterials.map((mat, i) => (
                                                            <div key={i} className="flex items-center justify-between bg-white rounded-lg p-2">
                                                                <div className="flex items-center gap-2">
                                                                    <Package className="w-4 h-4 text-gray-400" />
                                                                    <span className="text-sm text-gray-700">{mat.name}</span>
                                                                </div>
                                                                <span className="text-sm font-bold text-gray-600">
                                                                    {mat.quantity} {mat.unit || 'đơn vị'}
                                                                </span>
                                                            </div>
                                                        ))}
                                                    </div>

                                                    {phase.purchaseDeadline && (
                                                        <div className="flex items-center gap-2 mt-3 text-xs text-amber-700 bg-amber-50 rounded-lg p-2">
                                                            <AlertTriangle className="w-4 h-4" />
                                                            Nên đặt hàng trước: {formatDate(phase.purchaseDeadline)}
                                                        </div>
                                                    )}

                                                    <Link
                                                        href="/products"
                                                        className="mt-3 w-full py-2 bg-primary-600 text-white rounded-lg text-sm font-bold hover:bg-primary-700 transition-colors flex items-center justify-center gap-2"
                                                        onClick={(e) => e.stopPropagation()}
                                                    >
                                                        <ShoppingCart className="w-4 h-4" />
                                                        Mua vật tư ngay
                                                    </Link>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )
}
