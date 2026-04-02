'use client'

import React, { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import {
    ArrowLeft, MapPin, Coins, Calendar,
    Send, Clock, User as UserIcon, Users, CheckCircle,
    AlertTriangle, Share2, Bookmark, Building2,
    FileText, Phone
} from 'lucide-react'
import toast, { Toaster } from 'react-hot-toast'
import { useAuth } from '@/contexts/auth-context'
import { fetchWithAuth } from '@/lib/api-client'
import Sidebar from '../../components/Sidebar'
import ContractorHeader from '../../components/ContractorHeader'
import ApplicationForm from '@/components/marketplace/ApplicationForm'
import { formatCurrency } from '@/utils/formatters'

interface Project {
    id: string
    title: string
    description: string
    projectType: string
    location: string
    city: string
    estimatedBudget: number | null
    status: string
    requirements: string[]
    contactName: string
    contactPhone?: string
    createdAt: string
    isUrgent: boolean
    applicationCount: number
    viewCount: number
    // Management fields
    milestones: any[]
    expenses: any[]
    progress: number
}

export default function ContractorProjectDetailPage() {
    const { id } = useParams()
    const router = useRouter()
    const { user } = useAuth()
    const [sidebarOpen, setSidebarOpen] = useState(true)
    const [project, setProject] = useState<Project | null>(null)
    const [loading, setLoading] = useState(true)
    const [showApplyModal, setShowApplyModal] = useState(false)
    const [isSaved, setIsSaved] = useState(false)

    useEffect(() => {
        if (id) fetchProject()
    }, [id])

    const fetchProject = async () => {
        try {
            setLoading(true)
            // Try management API first for contractor view
            const res = await fetchWithAuth(`/api/contractors/projects/${id}`)
            if (res.ok) {
                const data = await res.json()
                if (data.success) {
                    setProject(data.data)
                    return
                }
            }

            // Fallback to marketplace API
            const marketRes = await fetchWithAuth(`/api/marketplace/projects/${id}`)
            if (marketRes.ok) {
                const data = await marketRes.json()
                if (data.success) {
                    setProject(data.data)
                }
            } else {
                toast.error('Không thể tải thông tin dự án')
            }
        } catch (error) {
            console.error('Failed to fetch project:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleToggleSave = () => {
        setIsSaved(!isSaved)
        if (!isSaved) {
            toast.success('Đã lưu dự án vào danh sách quan tâm')
        } else {
            toast.success('Đã bỏ lưu dự án')
        }
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50 flex flex-col">
                <ContractorHeader sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
                <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
                <main className={`flex-1 transition-all duration-300 ${sidebarOpen ? 'lg:ml-64' : 'ml-0'} bg-slate-50 p-8 flex items-center justify-center`}>
                    <div className="w-12 h-12 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin"></div>
                </main>
            </div>
        )
    }

    if (!project) return null

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col">
            <Toaster position="top-right" />
            <ContractorHeader sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
            <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

            <main className={`flex-1 transition-all duration-300 ${sidebarOpen ? 'lg:ml-64' : 'ml-0'} bg-slate-50 relative z-0`}>
                <div className="h-20 w-full" /> {/* Spacer */}

                <div className="max-w-5xl mx-auto p-6 md:p-8 space-y-6">
                    {/* Branching UI based on status */}
                    {project.status !== 'OPEN' ? (
                        /* PROJECT MANAGEMENT DASHBOARD */
                        <div className="space-y-8 animate-in fade-in duration-500">
                            {/* Breadcrumbs / Back */}
                            <button
                                onClick={() => router.back()}
                                className="flex items-center text-slate-500 hover:text-blue-600 font-bold text-sm transition-colors group"
                            >
                                <div className="w-8 h-8 rounded-full bg-white border border-slate-200 flex items-center justify-center mr-2 group-hover:border-blue-200 group-hover:bg-blue-50">
                                    <ArrowLeft className="w-4 h-4" />
                                </div>
                                Quay lại danh sách công trình
                            </button>

                            {/* Header Stats Card */}
                            <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-100 relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-64 h-64 bg-slate-50 rounded-full -mr-32 -mt-32 opacity-50"></div>
                                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
                                    <div className="flex gap-6">
                                        <div className="w-20 h-20 rounded-3xl bg-blue-600 flex items-center justify-center shadow-xl shadow-blue-100 shrink-0">
                                            <Building2 className="w-10 h-10 text-white" />
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-3 mb-2">
                                                <h1 className="text-3xl font-black text-slate-900 tracking-tight">{project.title}</h1>
                                                <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${
                                                    project.status === 'IN_PROGRESS' ? 'bg-orange-100 text-orange-700 border border-orange-200' : 
                                                    project.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' : 
                                                    'bg-slate-100 text-slate-600 border border-slate-200'
                                                }`}>
                                                    {project.status === 'IN_PROGRESS' ? 'Đang thi công' : 
                                                     project.status === 'COMPLETED' ? 'Hoàn thành' : 
                                                     project.status === 'PLANNING' ? 'Chuẩn bị' : project.status}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-4 text-sm text-slate-500 font-medium">
                                                <span className="flex items-center gap-1.5"><MapPin size={16} className="text-slate-400" /> {project.city}</span>
                                                <span className="flex items-center gap-1.5"><UserIcon size={16} className="text-slate-400" /> {project.contactName}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex flex-wrap gap-3">
                                        <Link 
                                            href={`/contractor/projects/${project.id}/timeline`}
                                            className="px-6 py-4 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-black transition-all shadow-xl shadow-slate-200 active:scale-95 flex items-center gap-2"
                                        >
                                            <Clock className="w-4 h-4" /> Timeline
                                        </Link>
                                        <Link 
                                            href={`/contractor/quick-order?projectId=${project.id}`}
                                            className="px-6 py-4 bg-blue-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-blue-700 transition-all shadow-xl shadow-blue-200 active:scale-95 flex items-center gap-2"
                                        >
                                            <Coins className="w-4 h-4" /> Gọi Vật Tư
                                        </Link>
                                    </div>
                                </div>

                                {/* Progress Bar Mini */}
                                <div className="mt-10 pt-10 border-t border-slate-100">
                                    <div className="flex justify-between items-end mb-4">
                                        <div>
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Tiến độ tổng thể</p>
                                            <h3 className="text-2xl font-black text-slate-900">{Math.round(project.progress || 0)}%</h3>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Ngân sách đã dùng</p>
                                            <h3 className="text-lg font-black text-emerald-600 tracking-tight">~ 24%</h3>
                                        </div>
                                    </div>
                                    <div className="h-4 bg-slate-100 rounded-full overflow-hidden shadow-inner p-1">
                                        <div 
                                            className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full transition-all duration-1000 shadow-[0_0_15px_rgba(37,99,235,0.3)]"
                                            style={{ width: `${project.progress || 0}%` }}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                                {/* Milestones List */}
                                <div className="lg:col-span-2 space-y-6">
                                    <h3 className="text-xl font-black text-slate-900 flex items-center gap-3 px-2 leading-tight">
                                        <div className="w-1.5 h-6 bg-blue-600 rounded-full"></div>
                                        GIAI ĐOẠN THANH TOÁN & NGHIỆM THU
                                    </h3>
                                    
                                    <div className="space-y-4">
                                        {project.milestones?.length > 0 ? (
                                            project.milestones.map((ms, idx) => (
                                                <div key={ms.id} className="bg-white rounded-[2rem] p-6 shadow-sm border border-slate-100 hover:border-blue-200 transition-all group">
                                                    <div className="flex items-start justify-between gap-4">
                                                        <div className="flex gap-4">
                                                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${
                                                                ms.status === 'COMPLETED' ? 'bg-emerald-50 text-emerald-600' : 
                                                                ms.status === 'PAID' ? 'bg-blue-50 text-blue-600' : 'bg-slate-50 text-slate-400'
                                                            }`}>
                                                                {ms.status === 'COMPLETED' || ms.status === 'PAID' ? <CheckCircle className="w-6 h-6" /> : <Clock className="w-6 h-6" />}
                                                            </div>
                                                            <div>
                                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Giai đoạn {idx + 1}</p>
                                                                <h4 className="font-black text-slate-900 group-hover:text-blue-600 transition-colors leading-tight mb-2 tracking-tight">{ms.name}</h4>
                                                                <div className="flex items-center gap-3 text-xs text-slate-500 font-medium">
                                                                    <span className="bg-slate-50 px-2 py-1 rounded-lg border border-slate-100 text-slate-600 font-bold">{formatCurrency(ms.amount)}</span>
                                                                    <span className="flex items-center gap-1"><Calendar size={14} className="text-slate-400" /> {new Date(ms.dueDate).toLocaleDateString('vi-VN')}</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <span className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-sm ${
                                                            ms.status === 'COMPLETED' || ms.status === 'PAID' ? 'bg-emerald-500 text-white' : 
                                                            ms.status === 'IN_PROGRESS' ? 'bg-blue-600 text-white' : 'bg-white border border-slate-200 text-slate-400'
                                                        }`}>
                                                            {ms.status === 'PAID' ? 'Đã thanh toán' : 
                                                             ms.status === 'COMPLETED' ? 'Hoàn thành' : 
                                                             ms.status === 'PENDING' ? 'Chờ thanh toán' : 'Chưa đến hạn'}
                                                        </span>
                                                    </div>
                                                </div>
                                            ))
                                        ) : (
                                            <div className="bg-white rounded-[2rem] p-12 text-center border-2 border-dashed border-slate-100">
                                                <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                                    <FileText className="w-8 h-8 text-slate-200" />
                                                </div>
                                                <p className="text-slate-500 font-medium">Chưa có thông tin giai đoạn thanh toán cho dự án này.</p>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Right Sidebar - Dashboard bits */}
                                <div className="lg:col-span-1 space-y-6">
                                    <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white relative overflow-hidden shadow-2xl shadow-blue-900/20">
                                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16"></div>
                                        <h4 className="text-[11px] font-black text-indigo-300 uppercase tracking-[0.2em] mb-6">Liên hệ chủ đầu tư</h4>
                                        
                                        <div className="flex items-center gap-4 mb-8">
                                            <div className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center font-black text-2xl text-white">
                                                {project.contactName?.charAt(0) || 'K'}
                                            </div>
                                            <div>
                                                <p className="font-black text-lg tracking-tight mb-1">{project.contactName}</p>
                                                <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest flex items-center gap-1.5">
                                                    <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                                                    Đang trực tuyến
                                                </p>
                                            </div>
                                        </div>

                                        <div className="space-y-3">
                                            <button className="w-full py-4 bg-white text-slate-900 rounded-2xl font-black text-[11px] uppercase tracking-widest hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-black/20 flex items-center justify-center gap-2">
                                                <Send className="w-4 h-4 fill-current" /> Nhắn tin ngay
                                            </button>
                                            {project.contactPhone && (
                                                <a 
                                                    href={`tel:${project.contactPhone}`}
                                                    className="w-full py-4 bg-white/5 border border-white/10 text-white rounded-2xl font-black text-[11px] uppercase tracking-widest hover:bg-white/10 transition-all flex items-center justify-center gap-2"
                                                >
                                                    <Phone className="w-4 h-4" /> Gọi điện trực tiếp
                                                </a>
                                            )}
                                        </div>
                                    </div>

                                    {/* Task Widget Preview */}
                                    <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-100">
                                        <div className="flex items-center justify-between mb-6">
                                            <h4 className="text-xs font-black text-slate-900 uppercase tracking-widest">Việc cần làm</h4>
                                            <span className="w-6 h-6 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center font-black text-[10px]">3</span>
                                        </div>
                                        <div className="space-y-4">
                                            {[
                                                'Kiểm tra vật tư đợt 2',
                                                'Nghiệm thu phần thô tầng 1',
                                                'Liên hệ nhà thầu điện'
                                            ].map((task, i) => (
                                                <div key={i} className="flex items-center gap-3 group cursor-pointer">
                                                    <div className="w-5 h-5 rounded border-2 border-slate-200 group-hover:border-blue-500 transition-colors"></div>
                                                    <span className="text-xs font-medium text-slate-600 group-hover:text-slate-900">{task}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        /* MARKETPLACE LISTING VIEW (Status: OPEN) */
                        <div className="space-y-6 animate-in fade-in duration-500">
                            {/* Breadcrumbs / Back */}
                            <button
                                onClick={() => router.back()}
                                className="flex items-center text-slate-500 hover:text-blue-600 font-bold text-sm transition-colors group"
                            >
                                <div className="w-8 h-8 rounded-full bg-white border border-slate-200 flex items-center justify-center mr-2 group-hover:border-blue-200 group-hover:bg-blue-50">
                                    <ArrowLeft className="w-4 h-4" />
                                </div>
                                Quay lại tìm kiếm công trình
                            </button>

                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                                {/* Main Content */}
                                <div className="lg:col-span-2 space-y-6">
                                    {/* Title Card */}
                                    <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100 relative overflow-hidden">
                                        {project.isUrgent && (
                                            <div className="absolute top-0 right-0 bg-red-500 text-white text-xs font-bold px-4 py-1.5 rounded-bl-2xl">
                                                Cần gấp
                                            </div>
                                        )}

                                        <div className="flex gap-4 mb-6">
                                            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100 flex items-center justify-center shrink-0">
                                                <Building2 className="w-8 h-8 text-blue-600" />
                                            </div>
                                            <div>
                                                <h1 className="text-2xl font-black text-slate-900 mb-2 leading-tight">{project.title}</h1>
                                                <div className="flex flex-wrap gap-4 text-sm text-slate-500">
                                                    <span className="flex items-center gap-1.5 font-medium">
                                                        <MapPin size={16} className="text-slate-400" /> {project.city}
                                                    </span>
                                                    <span className="flex items-center gap-1.5 font-medium">
                                                        <Clock size={16} className="text-slate-400" /> {new Date(project.createdAt).toLocaleDateString('vi-VN')}
                                                    </span>
                                                    <span className="flex items-center gap-1.5 font-medium text-blue-600 bg-blue-50 px-2 py-0.5 rounded-lg">
                                                        <Users size={16} /> {project.applicationCount || 0} ứng tuyển
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="prose max-w-none text-slate-600">
                                            <h3 className="text-lg font-bold text-slate-900 mb-3">Mô tả chi tiết</h3>
                                            <p className="whitespace-pre-wrap leading-relaxed">{project.description}</p>
                                        </div>
                                    </div>

                                    {/* Requirements */}
                                    {project.requirements?.length > 0 && (
                                        <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100">
                                            <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                                                <CheckCircle className="text-emerald-500" size={20} />
                                                Yêu cầu công việc
                                            </h3>
                                            <ul className="space-y-3">
                                                {project.requirements.map((req, idx) => (
                                                    <li key={idx} className="flex items-start gap-3 bg-slate-50 p-4 rounded-xl border border-slate-100">
                                                        <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-2 shrink-0" />
                                                        <span className="text-slate-700 font-medium">{req}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                </div>

                                {/* Sidebar Info */}
                                <div className="lg:col-span-1 space-y-6">
                                    {/* Action Card */}
                                    <div className="bg-white rounded-3xl p-6 shadow-xl shadow-blue-50 border border-blue-100 sticky top-24">
                                        <div className="mb-6">
                                            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Ngân sách dự kiến</p>
                                            <p className="text-3xl font-black text-blue-600">
                                                {project.estimatedBudget ? formatCurrency(project.estimatedBudget) : 'Thỏa thuận'}
                                            </p>
                                        </div>

                                        <div className="space-y-3">
                                            <button
                                                onClick={() => setShowApplyModal(true)}
                                                className="w-full py-4 bg-blue-600 text-white rounded-2xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 flex items-center justify-center gap-2 active:scale-95 text-lg"
                                            >
                                                <Send size={20} /> Gửi Báo Giá Ngay
                                            </button>

                                            <button
                                                onClick={handleToggleSave}
                                                className={`w-full py-4 bg-white border border-slate-200 rounded-2xl font-bold transition-all flex items-center justify-center gap-2 hover:border-blue-300 hover:text-blue-600 ${isSaved ? 'text-blue-600 border-blue-200 bg-blue-50' : 'text-slate-600'}`}
                                            >
                                                <Bookmark size={20} className={isSaved ? "fill-current" : ""} />
                                                {isSaved ? 'Đã lưu dự án' : 'Lưu vào danh sách'}
                                            </button>
                                        </div>

                                        <div className="mt-6 pt-6 border-t border-slate-100">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-400">
                                                    {project.contactName?.charAt(0) || 'K'}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-slate-900">{project.contactName || 'Khách hàng ẩn danh'}</p>
                                                    <div className="flex items-center gap-1 text-xs text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded-full w-fit mt-1">
                                                        <CheckCircle size={10} /> Đã xác thực SĐT
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Apply Modal */}
                {showApplyModal && (
                    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
                        <div className="bg-white rounded-3xl w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl animate-in zoom-in-95 duration-200">
                            <ApplicationForm
                                projectId={project.id}
                                projectTitle={project.title}
                                isOpen={showApplyModal}
                                onClose={() => setShowApplyModal(false)}
                                onSuccess={() => {
                                    setShowApplyModal(false)
                                    fetchProject()
                                }}
                            />
                        </div>
                    </div>
                )}
            </main>
        </div>
    )
}
