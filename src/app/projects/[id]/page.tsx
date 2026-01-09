'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import {
    ArrowLeft, MapPin, DollarSign, Calendar, Phone, Mail, User,
    Send, Clock, Users, Eye, CheckCircle, AlertTriangle
} from 'lucide-react'
import toast from 'react-hot-toast'

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
    applications: any[]
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

export default function ProjectDetailPage() {
    const params = useParams()
    const router = useRouter()
    const [project, setProject] = useState<Project | null>(null)
    const [loading, setLoading] = useState(true)
    const [showApplyModal, setShowApplyModal] = useState(false)
    const [applying, setApplying] = useState(false)
    const [application, setApplication] = useState({
        message: '',
        proposedBudget: '',
        proposedDays: ''
    })

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
                }
            }
        } catch (error) {
            console.error('Failed to fetch project:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleApply = async (e: React.FormEvent) => {
        e.preventDefault()
        setApplying(true)

        try {
            const contractorId = localStorage.getItem('customer_id') || 'guest'

            const res = await fetch(`/api/marketplace/projects/${params.id}/apply`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...application,
                    proposedBudget: application.proposedBudget ? parseFloat(application.proposedBudget) : null,
                    proposedDays: application.proposedDays ? parseInt(application.proposedDays) : null,
                    contractorId
                })
            })

            const data = await res.json()

            if (data.success) {
                toast.success('Ứng tuyển thành công!')
                setShowApplyModal(false)
                fetchProject()
            } else {
                toast.error(data.error?.message || 'Ứng tuyển thất bại')
            }
        } catch (error) {
            toast.error('Lỗi kết nối server')
        } finally {
            setApplying(false)
        }
    }

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND',
            minimumFractionDigits: 0
        }).format(amount)
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        )
    }

    if (!project) {
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center">
                <AlertTriangle className="w-16 h-16 text-gray-400 mb-4" />
                <h2 className="text-xl font-semibold text-gray-600">Không tìm thấy dự án</h2>
                <Link href="/projects" className="mt-4 text-blue-600 hover:underline">
                    ← Quay lại danh sách
                </Link>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-4xl mx-auto px-4">
                {/* Back Button */}
                <Link href="/projects" className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-6">
                    <ArrowLeft className="w-5 h-5 mr-2" />
                    Quay lại danh sách
                </Link>

                {/* Header */}
                <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
                    <div className="flex items-start justify-between mb-4">
                        <div className="flex gap-2">
                            <span className="px-3 py-1 bg-blue-100 text-blue-700 text-sm font-medium rounded-full">
                                {PROJECT_TYPE_LABELS[project.projectType] || project.projectType}
                            </span>
                            {project.isUrgent && (
                                <span className="px-3 py-1 bg-red-100 text-red-700 text-sm font-medium rounded-full">
                                    Gấp
                                </span>
                            )}
                            <span className={`px-3 py-1 text-sm font-medium rounded-full ${project.status === 'OPEN' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                                }`}>
                                {project.status === 'OPEN' ? 'Đang mở' : project.status}
                            </span>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-gray-500">
                            <span className="flex items-center gap-1">
                                <Eye className="w-4 h-4" /> {project.viewCount} lượt xem
                            </span>
                            <span className="flex items-center gap-1">
                                <Users className="w-4 h-4" /> {project.applications?.length || 0} ứng tuyển
                            </span>
                        </div>
                    </div>

                    <h1 className="text-2xl font-bold text-gray-900 mb-2">{project.title}</h1>

                    <div className="flex items-center gap-4 text-gray-600 mb-4">
                        <span className="flex items-center gap-1">
                            <MapPin className="w-4 h-4" />
                            {project.location}, {project.district && `${project.district}, `}{project.city}
                        </span>
                        <span className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            {new Date(project.createdAt).toLocaleDateString('vi-VN')}
                        </span>
                    </div>

                    {project.estimatedBudget && (
                        <div className="flex items-center gap-2 text-xl font-bold text-green-600">
                            {formatCurrency(project.estimatedBudget)}
                        </div>
                    )}
                </div>

                {/* Description */}
                <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">Mô tả dự án</h2>
                    <p className="text-gray-700 whitespace-pre-line">{project.description}</p>
                </div>

                {/* Requirements */}
                {project.requirements && project.requirements.length > 0 && (
                    <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
                        <h2 className="text-lg font-semibold text-gray-900 mb-4">Yêu cầu</h2>
                        <ul className="space-y-2">
                            {project.requirements.map((req, i) => (
                                <li key={i} className="flex items-start gap-2">
                                    <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                                    <span className="text-gray-700">{req}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}

                {/* Materials Needed */}
                {project.materialsNeeded && project.materialsNeeded.length > 0 && (
                    <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
                        <h2 className="text-lg font-semibold text-gray-900 mb-4">Vật liệu cần thiết</h2>
                        <div className="flex flex-wrap gap-2">
                            {project.materialsNeeded.map((mat, i) => (
                                <span key={i} className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-sm">
                                    {mat}
                                </span>
                            ))}
                        </div>
                        <Link
                            href="/products"
                            className="inline-block mt-4 text-blue-600 hover:underline text-sm"
                        >
                            Xem sản phẩm VLXD liên quan →
                        </Link>
                    </div>
                )}

                {/* Contact & Apply */}
                <div className="bg-white rounded-xl shadow-sm p-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">Liên hệ</h2>
                    <div className="flex flex-wrap gap-6 mb-6">
                        <div className="flex items-center gap-2 text-gray-700">
                            <User className="w-5 h-5 text-gray-400" />
                            {project.contactName}
                        </div>
                        <a href={`tel:${project.contactPhone}`} className="flex items-center gap-2 text-blue-600 hover:underline">
                            <Phone className="w-5 h-5" />
                            {project.contactPhone}
                        </a>
                        {project.contactEmail && (
                            <a href={`mailto:${project.contactEmail}`} className="flex items-center gap-2 text-blue-600 hover:underline">
                                <Mail className="w-5 h-5" />
                                {project.contactEmail}
                            </a>
                        )}
                    </div>

                    {project.status === 'OPEN' && (
                        <button
                            onClick={() => setShowApplyModal(true)}
                            className="w-full py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2"
                        >
                            <Send className="w-5 h-5" />
                            Ứng tuyển dự án này
                        </button>
                    )}
                </div>
            </div>

            {/* Apply Modal */}
            {showApplyModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl max-w-lg w-full p-6">
                        <h2 className="text-xl font-bold text-gray-900 mb-4">Ứng tuyển dự án</h2>

                        <form onSubmit={handleApply} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Lời nhắn cho chủ dự án *
                                </label>
                                <textarea
                                    required
                                    rows={4}
                                    value={application.message}
                                    onChange={(e) => setApplication({ ...application, message: e.target.value })}
                                    placeholder="Giới thiệu về kinh nghiệm, năng lực, đội ngũ của bạn..."
                                    className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Báo giá (VNĐ)
                                    </label>
                                    <input
                                        type="number"
                                        value={application.proposedBudget}
                                        onChange={(e) => setApplication({ ...application, proposedBudget: e.target.value })}
                                        placeholder="VD: 50000000"
                                        className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Thời gian (ngày)
                                    </label>
                                    <input
                                        type="number"
                                        value={application.proposedDays}
                                        onChange={(e) => setApplication({ ...application, proposedDays: e.target.value })}
                                        placeholder="VD: 30"
                                        className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                            </div>

                            <div className="flex gap-4 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowApplyModal(false)}
                                    className="flex-1 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                                >
                                    Hủy
                                </button>
                                <button
                                    type="submit"
                                    disabled={applying}
                                    className="flex-1 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50"
                                >
                                    {applying ? 'Đang gửi...' : 'Gửi ứng tuyển'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}
