'use client'

/**
 * ProjectTimeline Component
 * Beautiful timeline view of project progress with photos and AI insights
 */

import { useState, useEffect } from 'react'
import {
    Camera, CheckCircle2, Clock, AlertCircle, ChevronDown, ChevronUp,
    Loader2, Calendar, User, MapPin, FileText, Download, Sparkles,
    Play, Pause, Image as ImageIcon, ExternalLink
} from 'lucide-react'
import { fetchWithAuth } from '@/lib/api-client'
import toast from 'react-hot-toast'

interface TimelineEvent {
    id: string
    type: 'REPORT' | 'MILESTONE' | 'STATUS_CHANGE' | 'MATERIAL_DELIVERY'
    date: string
    time: string
    title: string
    description?: string
    workerName?: string
    photoUrl?: string
    status?: string
    milestoneId?: string
}

interface TimelinePhase {
    id: string
    name: string
    status: 'COMPLETED' | 'IN_PROGRESS' | 'PENDING'
    progress: number
    startDate?: string
    endDate?: string
    events: TimelineEvent[]
    color: string
}

interface TimelineData {
    projectId: string
    projectName: string
    projectType: string
    location?: string
    status?: string
    overallProgress: number
    phases: TimelinePhase[]
    summary?: string
    totalReports: number
    totalMaterialRequests: number
    lastUpdated: string
}

interface ProjectTimelineProps {
    projectId: string
    showExportButton?: boolean
    compact?: boolean
}

export default function ProjectTimeline({
    projectId,
    showExportButton = true,
    compact = false
}: ProjectTimelineProps) {
    const [data, setData] = useState<TimelineData | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [expandedPhases, setExpandedPhases] = useState<Set<string>>(new Set())
    const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null)
    const [exporting, setExporting] = useState(false)
    const [showAISummary, setShowAISummary] = useState(false)
    const [aiLoading, setAiLoading] = useState(false)

    useEffect(() => {
        fetchTimeline()
    }, [projectId])

    const fetchTimeline = async (withAI = false) => {
        try {
            setLoading(true)
            if (withAI) setAiLoading(true)

            const url = `/api/projects/${projectId}/timeline${withAI ? '?ai=true' : ''}`
            const res = await fetch(url)

            if (!res.ok) throw new Error('Failed to fetch timeline')

            const json = await res.json()
            setData(json.data)

            // Auto-expand in-progress phases
            const inProgress = json.data.phases
                .filter((p: TimelinePhase) => p.status === 'IN_PROGRESS')
                .map((p: TimelinePhase) => p.id)
            setExpandedPhases(new Set(inProgress))


        } catch (err) {
            setError(err instanceof Error ? err.message : 'Unknown error')
        } finally {

            setLoading(false)
            setAiLoading(false)
        }
    }

    const togglePhase = (phaseId: string) => {
        setExpandedPhases(prev => {
            const next = new Set(prev)
            if (next.has(phaseId)) {
                next.delete(phaseId)
            } else {
                next.add(phaseId)
            }
            return next
        })
    }

    const handleExportPDF = async () => {
        try {
            setExporting(true)
            const res = await fetch(`/api/projects/${projectId}/export-report`, {
                method: 'POST'
            })

            if (!res.ok) throw new Error('Export failed')

            const blob = await res.blob()
            const url = window.URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = `bao-cao-tien-do-${projectId.slice(-6)}.pdf`
            a.click()
            window.URL.revokeObjectURL(url)

            toast.success('Đã tải xuống báo cáo PDF!')
        } catch (err) {
            toast.error('Lỗi khi xuất báo cáo')
        } finally {
            setExporting(false)
        }
    }

    const handleGetAISummary = () => {
        setShowAISummary(true)
        fetchTimeline(true)
    }

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'COMPLETED':
                return <CheckCircle2 className="w-5 h-5 text-green-500" />
            case 'IN_PROGRESS':
                return <Play className="w-5 h-5 text-orange-500" />
            default:
                return <Clock className="w-5 h-5 text-gray-400" />
        }
    }

    const getStatusLabel = (status: string) => {
        switch (status) {
            case 'COMPLETED': return 'Hoàn thành'
            case 'IN_PROGRESS': return 'Đang thực hiện'
            default: return 'Chờ thực hiện'
        }
    }

    if (loading && !data) {
        return (
            <div className="flex items-center justify-center py-20">
                <div className="text-center">
                    <Loader2 className="w-10 h-10 animate-spin text-blue-600 mx-auto mb-4" />
                    <p className="text-gray-500 font-medium">Đang tải timeline...</p>
                </div>
            </div>
        )
    }

    if (error) {
        return (
            <div className="flex items-center justify-center py-20">
                <div className="text-center">
                    <AlertCircle className="w-10 h-10 text-red-500 mx-auto mb-4" />
                    <p className="text-gray-900 font-bold">Không thể tải timeline</p>
                    <p className="text-gray-500 text-sm">{error}</p>
                </div>
            </div>
        )
    }

    if (!data) return null

    return (
        <div className={`bg-white rounded-2xl shadow-xl overflow-hidden ${compact ? '' : 'p-6'}`}>
            {/* Header */}
            <div className={`${compact ? 'p-4' : 'mb-6'}`}>
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h2 className="text-xl font-black text-gray-900">{data.projectName}</h2>
                        {data.location && (
                            <p className="text-gray-500 text-sm flex items-center gap-1 mt-1">
                                <MapPin className="w-4 h-4" /> {data.location}
                            </p>
                        )}
                    </div>

                    <div className="flex items-center gap-3">
                        {!showAISummary && (
                            <button
                                onClick={handleGetAISummary}
                                disabled={aiLoading}
                                className="flex items-center gap-2 px-4 py-2 bg-purple-50 text-purple-700 rounded-xl hover:bg-purple-100 transition-colors font-bold text-sm"
                            >
                                {aiLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                                AI Tóm tắt
                            </button>
                        )}

                        {showExportButton && (
                            <button
                                onClick={handleExportPDF}
                                disabled={exporting}
                                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-bold text-sm shadow-lg shadow-blue-200"
                            >
                                {exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                                Xuất PDF
                            </button>
                        )}
                    </div>
                </div>

                {/* Overall Progress */}
                <div className="mt-6 bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-5">
                    <div className="flex items-center justify-between mb-3">
                        <span className="text-sm font-bold text-gray-600">Tiến độ tổng thể</span>
                        <span className="text-2xl font-black text-blue-600">{data.overallProgress}%</span>
                    </div>
                    <div className="h-4 bg-white rounded-full overflow-hidden shadow-inner">
                        <div
                            className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full transition-all duration-1000 ease-out"
                            style={{ width: `${data.overallProgress}%` }}
                        />
                    </div>
                    <div className="flex items-center justify-between mt-3 text-xs text-gray-500">
                        <span>📷 {data.totalReports} báo cáo</span>
                        <span>📅 Cập nhật: {new Date(data.lastUpdated).toLocaleDateString('vi-VN')}</span>
                    </div>
                </div>

                {/* AI Summary */}
                {showAISummary && data.summary && (
                    <div className="mt-4 bg-gradient-to-r from-purple-500 to-indigo-600 rounded-2xl p-5 text-white">
                        <div className="flex items-center gap-2 mb-3">
                            <Sparkles className="w-5 h-5" />
                            <span className="font-bold">AI Phân tích</span>
                        </div>
                        <div className="text-sm font-medium opacity-95 whitespace-pre-line">
                            {data.summary.replace(/\*\*/g, '')}
                        </div>
                    </div>
                )}
            </div>

            {/* Timeline Phases */}
            <div className={`space-y-4 ${compact ? 'px-4 pb-4' : ''}`}>
                {data.phases.map((phase, idx) => (
                    <div
                        key={phase.id}
                        className={`border-2 rounded-2xl overflow-hidden transition-all duration-300 ${phase.status === 'IN_PROGRESS'
                            ? 'border-orange-200 bg-orange-50/30'
                            : phase.status === 'COMPLETED'
                                ? 'border-green-200 bg-green-50/30'
                                : 'border-gray-100 bg-gray-50/30'
                            }`}
                    >
                        {/* Phase Header */}
                        <button
                            onClick={() => togglePhase(phase.id)}
                            className="w-full px-5 py-4 flex items-center justify-between hover:bg-white/50 transition-colors"
                        >
                            <div className="flex items-center gap-4">
                                {/* Timeline connector */}
                                <div className="relative flex flex-col items-center">
                                    <div
                                        className="w-10 h-10 rounded-full flex items-center justify-center text-white font-black text-sm shadow-lg"
                                        style={{ backgroundColor: phase.color }}
                                    >
                                        {idx + 1}
                                    </div>
                                    {idx < data.phases.length - 1 && (
                                        <div className="absolute top-10 w-0.5 h-8 bg-gray-200" />
                                    )}
                                </div>

                                <div className="text-left">
                                    <h3 className="font-bold text-gray-900">{phase.name}</h3>
                                    <div className="flex items-center gap-3 mt-1">
                                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${phase.status === 'COMPLETED' ? 'bg-green-100 text-green-700' :
                                            phase.status === 'IN_PROGRESS' ? 'bg-orange-100 text-orange-700' :
                                                'bg-gray-100 text-gray-500'
                                            }`}>
                                            {getStatusLabel(phase.status)}
                                        </span>
                                        {phase.events.length > 0 && (
                                            <span className="text-xs text-gray-400 flex items-center gap-1">
                                                <Camera className="w-3 h-3" /> {phase.events.length} báo cáo
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center gap-4">
                                {/* Mini progress */}
                                <div className="hidden md:flex items-center gap-2">
                                    <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                                        <div
                                            className="h-full rounded-full transition-all"
                                            style={{
                                                width: `${phase.progress}%`,
                                                backgroundColor: phase.color
                                            }}
                                        />
                                    </div>
                                    <span className="text-sm font-bold text-gray-600">{phase.progress}%</span>
                                </div>

                                {expandedPhases.has(phase.id)
                                    ? <ChevronUp className="w-5 h-5 text-gray-400" />
                                    : <ChevronDown className="w-5 h-5 text-gray-400" />
                                }
                            </div>
                        </button>

                        {/* Phase Events */}
                        {expandedPhases.has(phase.id) && phase.events.length > 0 && (
                            <div className="px-5 pb-5 pt-2">
                                <div className="ml-14 space-y-4 border-l-2 border-dashed border-gray-200 pl-6">
                                    {phase.events.map((event, eventIdx) => (
                                        <div
                                            key={event.id}
                                            className="relative bg-white rounded-xl p-4 shadow-sm border border-gray-100"
                                        >
                                            {/* Timeline dot */}
                                            <div
                                                className="absolute -left-9 top-4 w-4 h-4 rounded-full border-2 border-white shadow"
                                                style={{ backgroundColor: phase.color }}
                                            />

                                            <div className="flex items-start gap-4">
                                                {/* Photo thumbnail */}
                                                {event.photoUrl && (
                                                    <button
                                                        onClick={() => setSelectedPhoto(event.photoUrl!)}
                                                        className="shrink-0 w-20 h-20 rounded-xl overflow-hidden bg-gray-100 hover:opacity-80 transition-opacity relative group"
                                                    >
                                                        <img
                                                            src={event.photoUrl}
                                                            alt=""
                                                            className="w-full h-full object-cover"
                                                        />
                                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                            <ExternalLink className="w-5 h-5 text-white" />
                                                        </div>
                                                    </button>
                                                )}

                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <span className="font-bold text-gray-900 text-sm">{event.title}</span>
                                                        {event.status === 'APPROVED' && (
                                                            <CheckCircle2 className="w-4 h-4 text-green-500" />
                                                        )}
                                                    </div>

                                                    {event.description && (
                                                        <p className="text-gray-600 text-sm mb-2">{event.description}</p>
                                                    )}

                                                    <div className="flex items-center gap-3 text-xs text-gray-400">
                                                        <span className="flex items-center gap-1">
                                                            <Calendar className="w-3 h-3" /> {event.date}
                                                        </span>
                                                        <span>{event.time}</span>
                                                        {event.workerName && (
                                                            <span className="flex items-center gap-1">
                                                                <User className="w-3 h-3" /> {event.workerName}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Empty state for pending phases */}
                        {expandedPhases.has(phase.id) && phase.events.length === 0 && (
                            <div className="px-5 pb-5 pt-2">
                                <div className="ml-14 text-center py-8 bg-white rounded-xl border-2 border-dashed border-gray-200">
                                    <Clock className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                                    <p className="text-gray-400 font-medium">Chưa có báo cáo cho giai đoạn này</p>
                                </div>
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {/* Photo Modal */}
            {selectedPhoto && (
                <div
                    className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
                    onClick={() => setSelectedPhoto(null)}
                >
                    <button
                        className="absolute top-4 right-4 text-white p-2 hover:bg-white/20 rounded-full"
                        onClick={() => setSelectedPhoto(null)}
                    >
                        ✕
                    </button>
                    <img
                        src={selectedPhoto}
                        alt="Full size"
                        className="max-w-full max-h-[85vh] rounded-lg shadow-2xl"
                        onClick={(e) => e.stopPropagation()}
                    />
                </div>
            )}
        </div>
    )
}
