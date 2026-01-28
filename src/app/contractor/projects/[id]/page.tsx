'use client'

import React, { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import {
    ArrowLeft, MapPin, DollarSign, Calendar,
    Send, Clock, Users, Eye, CheckCircle,
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
    createdAt: string
    isUrgent: boolean
    applicationCount: number
    viewCount: number
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
            const res = await fetchWithAuth(`/api/marketplace/projects/${id}`)
            if (res.ok) {
                const data = await res.json()
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
                <ContractorHeader sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} user={user} />
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
            <ContractorHeader sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} user={user} />
            <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

            <main className={`flex-1 transition-all duration-300 ${sidebarOpen ? 'lg:ml-64' : 'ml-0'} bg-slate-50 relative z-0`}>
                <div className="h-20 w-full" /> {/* Spacer */}

                <div className="max-w-5xl mx-auto p-6 md:p-8 space-y-6">
                    {/* Breadcrumbs / Back */}
                    <button
                        onClick={() => router.back()}
                        className="flex items-center text-slate-500 hover:text-blue-600 font-bold text-sm transition-colors group"
                    >
                        <div className="w-8 h-8 rounded-full bg-white border border-slate-200 flex items-center justify-center mr-2 group-hover:border-blue-200 group-hover:bg-blue-50">
                            <ArrowLeft className="w-4 h-4" />
                        </div>
                        Quay lại tìm kiếm
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
