'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import {
    ArrowLeft, MapPin, DollarSign, Calendar, Phone, Mail, User,
    Send, Clock, Users, Eye, CheckCircle, AlertTriangle, Settings, Share2, ShoppingBag
} from 'lucide-react'
import toast, { Toaster } from 'react-hot-toast'
import Header from '@/components/Header'
import ApplicationForm from '@/components/marketplace/ApplicationForm'
import ShareProjectModal from '@/components/marketplace/ShareProjectModal'
import ProjectActivityWidget from '@/components/marketplace/ProjectActivityWidget'
import VerifiedBenefitsBanner from '@/components/marketplace/VerifiedBenefitsBanner'
import AIMaterialStandards from '@/components/marketplace/AIMaterialStandards'
import Footer from '@/components/Footer'

interface Project {
    id: string
    title: string
    description: string
    projectType: string
    location: string
    district: string | null
    city: string
    estimatedBudget: number | null
    budgetType: string
    status: string
    requirements: string[]
    materialsNeeded: string[]
    contactName: string
    contactPhone: string
    contactEmail: string | null
    viewCount: number
    isUrgent: boolean
    createdAt: string
    customerId: string
    applications: any[]
}

export default function ProjectDetailPage() {
    const params = useParams()
    const router = useRouter()
    const [project, setProject] = useState<Project | null>(null)
    const [loading, setLoading] = useState(true)
    const [showApplyModal, setShowApplyModal] = useState(false)
    const [showShareModal, setShowShareModal] = useState(false)
    const [isOwner, setIsOwner] = useState(false)
    const [isLoggedIn, setIsLoggedIn] = useState(false)

    useEffect(() => {
        fetchProject()
    }, [params.id])

    const fetchProject = async () => {
        try {
            const res = await fetch(`/api/marketplace/projects/${params.id}`)
            if (res.ok) {
                const data = await res.json()
                if (data.success) {
                    setProject(data.data)
                    const customerId = localStorage.getItem('customer_id')
                    const token = localStorage.getItem('access_token')
                    if (token && customerId) {
                        setIsLoggedIn(true)
                        if (data.data.customerId === customerId) setIsOwner(true)
                    }
                }
            }
        } catch (error) {
            console.error('Failed to fetch project:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleApplyStandards = async (materials: string) => {
        try {
            const token = localStorage.getItem('access_token')
            const res = await fetch(`/api/marketplace/projects/${params.id}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': token ? `Bearer ${token}` : ''
                },
                body: JSON.stringify({ description: (project?.description || '') + '\n\n--- TIÊU CHUẨN VẬT TƯ YÊU CẦU ---\n' + materials })
            })
            if (res.ok) {
                toast.success('Đã cập nhật tiêu chuẩn vật tư')
                fetchProject()
            }
        } catch (err) {
            toast.error('Không thể cập nhật yêu cầu vật tư')
        }
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50">
                <Header />
                <div className="flex flex-col items-center justify-center pt-32 gap-4">
                    <div className="w-12 h-12 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin"></div>
                    <p className="text-gray-500 font-bold animate-pulse">Đang tải chi tiết dự án...</p>
                </div>
            </div>
        )
    }

    if (!project) {
        return (
            <div className="min-h-screen bg-slate-50">
                <Header />
                <div className="max-w-4xl mx-auto px-4 pt-32 text-center">
                    <div className="w-24 h-24 bg-red-50 rounded-[40px] flex items-center justify-center mx-auto mb-8">
                        <AlertTriangle className="w-12 h-12 text-red-400" />
                    </div>
                    <h2 className="text-3xl font-black text-gray-900 mb-4">Không tìm thấy dự án</h2>
                    <p className="text-gray-500 mb-10 max-w-sm mx-auto font-medium">
                        Dự án này không tồn tại hoặc đã được gỡ bỏ khỏi hệ thống marketplace.
                    </p>
                    <Link href="/projects" className="inline-flex items-center gap-3 px-10 py-5 bg-blue-600 text-white font-black rounded-2xl hover:bg-blue-700 transition-all shadow-xl shadow-blue-100 italic">
                        <ArrowLeft className="w-5 h-5" />
                        Quay lại danh sách
                    </Link>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <Toaster position="top-right" />
            <Header />
            <div className="py-12 px-4 sm:px-6 lg:px-8">
                <div className="max-w-5xl mx-auto">
                    <Link href="/projects" className="inline-flex items-center text-gray-500 hover:text-gray-700 mb-6">
                        <ArrowLeft className="w-4 h-4 mr-2" /> Quay lại danh sách
                    </Link>

                    {/* AI & Status Banner */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                        <div className="lg:col-span-1 bg-white rounded-3xl p-6 shadow-sm border border-gray-100 flex flex-col justify-center">
                            <p className="text-gray-500 text-sm mb-1">Trạng thái dự án</p>
                            <div className="flex items-center gap-2">
                                <span className="text-xl font-bold text-gray-900">
                                    {project.status === 'OPEN' ? 'Đang nhận hồ sơ' : 'Đã đóng'}
                                </span>
                                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                            </div>
                        </div>
                        {isOwner && (
                            <div className="lg:col-span-2">
                                <AIMaterialStandards
                                    projectId={project.id}
                                    projectTitle={project.title}
                                    onApplyStandards={handleApplyStandards}
                                />
                            </div>
                        )}
                    </div>

                    <div className="bg-white rounded-3xl shadow-sm overflow-hidden border border-gray-100">
                        <div className="p-8">
                            <h1 className="text-3xl font-bold text-gray-900 mb-4">{project.title}</h1>
                            <div className="flex flex-wrap gap-4 mb-8 text-sm text-gray-500">
                                <span className="flex items-center gap-1"><MapPin className="w-4 h-4" /> {project.city}</span>
                                <span className="flex items-center gap-1 font-bold text-blue-600"><DollarSign className="w-4 h-4" /> {project.estimatedBudget?.toLocaleString()}đ</span>
                                <span className="flex items-center gap-1"><Calendar className="w-4 h-4" /> {new Date(project.createdAt).toLocaleDateString('vi-VN')}</span>
                            </div>

                            <div className="prose max-w-none text-gray-700 mb-8 whitespace-pre-wrap">
                                <h3 className="text-lg font-bold mb-2">Mô tả dự án</h3>
                                {project.description}
                            </div>

                            {!isOwner && (
                                <button
                                    onClick={() => setShowApplyModal(true)}
                                    className="w-full sm:w-auto px-8 py-4 bg-blue-600 text-white rounded-2xl font-bold hover:bg-blue-700 transition-all shadow-xl shadow-blue-100 flex items-center justify-center gap-2"
                                >
                                    <Send className="w-5 h-5" /> Ứng tuyển ngay
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {showApplyModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                        <div className="bg-white rounded-3xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
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
            </div>
            <Footer />
        </div>
    )
}
