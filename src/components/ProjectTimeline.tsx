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

            if (!res.ok) {
                const errorData = await res.json()
                throw new Error(errorData.error?.message || 'Lỗi khi tải dòng thời gian')
            }

            const json = await res.json()
            setData(json.data)

            // Auto-expand in-progress phases
            const inProgress = json.data.phases
                .filter((p: TimelinePhase) => p.status === 'IN_PROGRESS')
                .map((p: TimelinePhase) => p.id)
            setExpandedPhases(new Set(inProgress))


        } catch (err: any) {
            setError(err instanceof Error ? err.message : 'Lỗi không xác định')
            console.error('Fetch timeline error:', err)
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
            <div className="flex items-center justify-center py-20 bg-white rounded-2xl border border-slate-100">
                <div className="text-center">
                    <Loader2 className="w-10 h-10 animate-spin text-blue-600 mx-auto mb-4" />
                    <p className="text-slate-500 font-bold text-sm uppercase tracking-widest animate-pulse">Phân tích dữ liệu...</p>
                </div>
            </div>
        )
    }

    if (error) {
        return (
            <div className="flex items-center justify-center py-20 bg-white rounded-2xl border border-slate-100">
                <div className="text-center group">
                    <div className="w-20 h-20 bg-rose-50 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                        <AlertCircle className="w-10 h-10 text-rose-500" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 mb-2">Không thể tải timeline</h3>
                    <p className="text-slate-400 text-sm max-w-sm mx-auto font-medium">{error}</p>
                    <button 
                        onClick={() => fetchTimeline()}
                        className="mt-8 px-6 py-2.5 bg-slate-900 text-white rounded-xl text-xs font-bold active:scale-95 transition-all"
                    >
                        Thử lại ngay
                    </button>
                </div>
            </div>
        )
    }

    if (!data) return null

    return (
        <div className={`bg-transparent ${compact ? '' : 'p-0'}`}>
            {/* Header Area */}
            <div className={`${compact ? 'p-4' : 'mb-8'}`}>
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="space-y-1">
                        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">{data.projectName}</h2>
                        {data.location && (
                            <p className="text-slate-500 text-sm font-medium flex items-center gap-1.5 mt-1">
                                <MapPin className="w-4 h-4 text-blue-400" /> {data.location}
                            </p>
                        )}
                    </div>

                    <div className="flex items-center gap-3">
                        {!showAISummary && (
                            <button
                                onClick={handleGetAISummary}
                                disabled={aiLoading}
                                className="flex items-center gap-2 px-5 py-2.5 bg-indigo-50 text-indigo-700 rounded-xl hover:bg-indigo-100 transition-all font-bold text-sm shadow-sm active:scale-95 border border-indigo-100"
                            >
                                {aiLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                                Phân tích bằng AI
                            </button>
                        )}

                        {showExportButton && (
                            <button
                                onClick={handleExportPDF}
                                disabled={exporting}
                                className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all font-bold text-sm shadow-lg shadow-blue-500/20 active:scale-95"
                            >
                                {exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                                Xuất biểu đồ
                            </button>
                        )}
                    </div>
                </div>

                {/* Overall Progress Widget */}
                <div className="mt-8 bg-slate-50 rounded-2xl p-6 border border-slate-100">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex flex-col">
                            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Tiến độ tổng thể</span>
                            <span className="text-xs font-medium text-slate-500 mt-1 uppercase tracking-tight">Cập nhật: {new Date(data.lastUpdated).toLocaleDateString('vi-VN')}</span>
                        </div>
                        <span className="text-3xl font-bold text-blue-600 tracking-tighter">{data.overallProgress}%</span>
                    </div>
                    <div className="h-4 bg-slate-200 rounded-full overflow-hidden shadow-inner">
                        <div
                            className="h-full bg-blue-600 rounded-full transition-all duration-1000 ease-out shadow-[0_0_15px_rgba(37,99,235,0.3)]"
                            style={{ width: `${data.overallProgress}%` }}
                        />
                    </div>
                    <div className="flex items-center justify-between mt-4">
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-white rounded-xl border border-slate-100 shadow-sm">
                            <ImageIcon className="w-3.5 h-3.5 text-blue-500" />
                            <span className="text-[11px] font-bold text-slate-600">{data.totalReports} báo cáo hiện trường</span>
                        </div>
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-white rounded-xl border border-slate-100 shadow-sm">
                            <FileText className="w-3.5 h-3.5 text-blue-500" />
                            <span className="text-[11px] font-bold text-slate-600">{data.totalMaterialRequests} yêu cầu vật tư</span>
                        </div>
                    </div>
                </div>

                {/* AI Insight Box */}
                {showAISummary && data.summary && (
                    <div className="mt-6 bg-slate-900 rounded-2xl p-6 text-white relative overflow-hidden group">
                         <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-[40px] -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-1000"></div>
                        <div className="flex items-center gap-3 mb-3 relative z-10">
                            <Sparkles className="w-5 h-5 text-blue-400" />
                            <span className="font-bold text-sm uppercase tracking-widest">Tóm tắt tiến độ AI</span>
                        </div>
                        <div className="text-sm font-medium text-slate-300 leading-relaxed relative z-10">
                            {data.summary.replace(/\*\*/g, '')}
                        </div>
                    </div>
                )}
            </div>

            {/* Timeline Stages List */}
            <div className={`space-y-4 ${compact ? 'px-4 pb-6' : ''}`}>
                {data.phases.map((phase, idx) => (
                    <div
                        key={phase.id}
                        className={`border rounded-2xl overflow-hidden transition-all duration-300 ${phase.status === 'IN_PROGRESS'
                            ? 'border-blue-200 bg-blue-50/20'
                            : phase.status === 'COMPLETED'
                                ? 'border-emerald-100 bg-emerald-50/20'
                                : 'border-slate-100 bg-slate-50/20'
                            }`}
                    >
                        {/* Stage Header */}
                        <button
                            onClick={() => togglePhase(phase.id)}
                            className="w-full px-6 py-5 flex items-center justify-between hover:bg-white/60 transition-all active:scale-[0.995]"
                        >
                            <div className="flex items-center gap-5">
                                <div className="relative flex flex-col items-center">
                                    <div
                                        className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm shadow-md"
                                        style={{ backgroundColor: phase.color }}
                                    >
                                        {idx + 1}
                                    </div>
                                    {idx < data.phases.length - 1 && (
                                        <div className="absolute top-10 w-0.5 h-10 bg-slate-200/50" />
                                    )}
                                </div>

                                <div className="text-left">
                                    <h3 className="font-bold text-slate-900 text-base">{phase.name}</h3>
                                    <div className="flex items-center gap-3 mt-1.5">
                                        <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-lg border ${phase.status === 'COMPLETED' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                                            phase.status === 'IN_PROGRESS' ? 'bg-blue-50 text-blue-600 border-blue-100' :
                                                'bg-slate-100 text-slate-500 border-slate-200 shadow-sm'
                                            }`}>
                                            {getStatusLabel(phase.status)}
                                        </span>
                                        {phase.events.length > 0 && (
                                            <span className="text-[11px] text-slate-400 font-bold flex items-center gap-1">
                                                <ImageIcon className="w-3.5 h-3.5" /> {phase.events.length} đầu việc
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center gap-5">
                                <div className="hidden md:flex flex-col items-end gap-1.5">
                                    <div className="w-24 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                                        <div
                                            className="h-full rounded-full transition-all"
                                            style={{
                                                width: `${phase.progress}%`,
                                                backgroundColor: phase.color
                                            }}
                                        />
                                    </div>
                                    <span className="text-[10px] font-bold text-slate-400">{phase.progress}% Hoàn tất</span>
                                </div>

                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${expandedPhases.has(phase.id) ? 'bg-slate-900 text-white' : 'bg-white border border-slate-100 text-slate-400'}`}>
                                    {expandedPhases.has(phase.id)
                                        ? <ChevronUp className="w-4 h-4" />
                                        : <ChevronDown className="w-4 h-4" />
                                    }
                                </div>
                            </div>
                        </button>

                        {/* Stage Event Details */}
                        {expandedPhases.has(phase.id) && phase.events.length > 0 && (
                            <div className="px-6 pb-6 pt-2">
                                <div className="ml-14 space-y-4 border-l-2 border-slate-200 border-dashed pl-6 relative">
                                    {phase.events.map((event, eventIdx) => (
                                        <div
                                            key={event.id}
                                            className="relative bg-white rounded-2xl p-5 shadow-sm border border-slate-100 hover:border-blue-200 transition-all group"
                                        >
                                            <div
                                                className="absolute -left-8 top-6 w-4 h-4 rounded-full border-4 border-white shadow-md active:scale-90 transition-transform"
                                                style={{ backgroundColor: phase.color }}
                                            />

                                            <div className="flex items-start gap-5">
                                                {event.photoUrl && (
                                                    <button
                                                        onClick={() => setSelectedPhoto(event.photoUrl!)}
                                                        className="shrink-0 w-24 h-24 rounded-xl overflow-hidden bg-slate-50 border border-slate-100 group-hover:scale-105 transition-all shadow-sm relative group/btn"
                                                    >
                                                        <img
                                                            src={event.photoUrl}
                                                            alt=""
                                                            className="w-full h-full object-cover"
                                                        />
                                                        <div className="absolute inset-0 bg-blue-600/20 opacity-0 group-hover/btn:opacity-100 transition-opacity flex items-center justify-center">
                                                            <ExternalLink className="w-6 h-6 text-white" />
                                                        </div>
                                                    </button>
                                                )}

                                                <div className="flex-1 min-w-0 py-1">
                                                    <div className="flex items-center gap-3 mb-2">
                                                        <h4 className="font-bold text-slate-900 text-sm">{event.title}</h4>
                                                        {event.status === 'APPROVED' && (
                                                            <div className="p-0.5 bg-emerald-50 rounded-full border border-emerald-100">
                                                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                                                            </div>
                                                        )}
                                                    </div>

                                                    {event.description && (
                                                        <p className="text-slate-500 text-sm mb-4 leading-relaxed font-medium">{event.description}</p>
                                                    )}

                                                    <div className="flex flex-wrap items-center gap-4">
                                                        <div className="flex items-center gap-1.5 px-3 py-1 bg-slate-50 rounded-lg text-slate-400 font-bold text-[10px] uppercase border border-slate-100">
                                                            <Calendar className="w-3.5 h-3.5" /> {event.date}
                                                        </div>
                                                        <div className="flex items-center gap-1.5 px-3 py-1 bg-slate-50 rounded-lg text-slate-400 font-bold text-[10px] uppercase border border-slate-100">
                                                            <Clock className="w-3.5 h-3.5" /> {event.time}
                                                        </div>
                                                        {event.workerName && (
                                                            <div className="flex items-center gap-1.5 px-3 py-1 bg-blue-50 text-blue-600 rounded-lg font-bold text-[10px] uppercase border border-blue-100">
                                                                <User className="w-3.5 h-3.5" /> {event.workerName}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {expandedPhases.has(phase.id) && phase.events.length === 0 && (
                            <div className="px-6 pb-8 pt-2">
                                <div className="ml-14 text-center py-10 bg-white rounded-2xl border-2 border-dashed border-slate-100">
                                    <Clock className="w-10 h-10 text-slate-200 mx-auto mb-3" />
                                    <p className="text-slate-400 font-bold text-sm">Hệ thống đang chờ dữ liệu báo cáo...</p>
                                </div>
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {/* Expanded Modal for High-Res Photos */}
            {selectedPhoto && (
                <div
                    className="fixed inset-0 z-50 bg-slate-900/95 backdrop-blur-sm flex items-center justify-center p-6 animate-in fade-in duration-300"
                    onClick={() => setSelectedPhoto(null)}
                >
                    <button
                        className="absolute top-6 right-6 text-white p-2.5 bg-white/10 hover:bg-white/20 rounded-full transition-all active:scale-90"
                        onClick={() => setSelectedPhoto(null)}
                    >
                        <ExternalLink className="w-6 h-6 rotate-45" />
                    </button>
                    <img
                        src={selectedPhoto}
                        alt="View Details"
                        className="max-w-full max-h-[90vh] rounded-2xl shadow-2xl ring-1 ring-white/10"
                        onClick={(e) => e.stopPropagation()}
                    />
                </div>
            )}
        </div>
    )
}
