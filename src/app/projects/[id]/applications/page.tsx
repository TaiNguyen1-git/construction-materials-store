'use client'

/**
 * Project Applications Management Page
 * For project owners to review, shortlist, and select contractors
 */

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import {
    ArrowLeft, User, Phone, Mail, Clock, Star, CheckCircle, XCircle,
    MessageSquare, Unlock, Flag, AlertTriangle, Award, Briefcase,
    ChevronDown, Filter, ShoppingCart
} from 'lucide-react'
import toast, { Toaster } from 'react-hot-toast'
import AIInsightsWidget from '@/components/marketplace/AIInsightsWidget'
import CreateContractModal from '@/components/marketplace/CreateContractModal'
import BoQToCartButton from '@/components/marketplace/BoQToCartButton'
import ReviewModal from '@/components/marketplace/ReviewModal'

interface Application {
    id: string
    contractorId: string | null
    isGuest: boolean
    guestName: string | null
    guestPhone: string | null
    guestEmail: string | null
    message: string
    proposedBudget: number | null
    proposedDays: number | null
    materials: any[] | null
    status: string
    isContactUnlocked: boolean
    createdAt: string
    tier: 'VERIFIED_PARTNER' | 'CERTIFIED_MEMBER' | 'PROVISIONAL'
    contractor?: {
        displayName: string
        phone: string | null
        isVerified: boolean
        trustScore: number
        avgRating: number
        totalProjectsCompleted: number
        skills: string[]
        highlightBio: string | null
        experienceYears: number | null
    } | null
}

interface ProjectData {
    id: string
    title: string
    status: string
    applications: Application[]
}

const STATUS_LABELS: Record<string, { label: string, color: string }> = {
    PENDING: { label: 'Đang chờ', color: 'bg-yellow-100 text-yellow-700' },
    NEGOTIATING: { label: 'Đang thương thảo', color: 'bg-blue-100 text-blue-700' },
    SHORTLISTED: { label: 'Danh sách ngắn', color: 'bg-purple-100 text-purple-700' },
    SELECTED: { label: 'Đã chọn', color: 'bg-green-100 text-green-700' },
    REJECTED: { label: 'Đã từ chối', color: 'bg-red-100 text-red-700' },
    CLOSED: { label: 'Đã đóng', color: 'bg-gray-100 text-gray-500' }
}

const TIER_BADGES: Record<string, { label: string, color: string, icon: any }> = {
    VERIFIED_PARTNER: { label: 'Đối tác Xác minh', color: 'bg-green-600 text-white', icon: CheckCircle },
    CERTIFIED_MEMBER: { label: 'Thành viên', color: 'bg-blue-600 text-white', icon: User },
    PROVISIONAL: { label: 'Hồ sơ tự khai', color: 'bg-gray-500 text-white', icon: AlertTriangle }
}

export default function ProjectApplicationsPage() {
    const params = useParams()
    const router = useRouter()
    const projectId = params.id as string

    const [loading, setLoading] = useState(true)
    const [project, setProject] = useState<ProjectData | null>(null)
    const [applications, setApplications] = useState<Application[]>([])
    const [selectedApp, setSelectedApp] = useState<Application | null>(null)
    const [showReportModal, setShowReportModal] = useState(false)
    const [filterTier, setFilterTier] = useState<string>('ALL')
    const [showContractModal, setShowContractModal] = useState(false)
    const [showReviewModal, setShowReviewModal] = useState(false)
    const [selectedForContract, setSelectedForContract] = useState<Application | null>(null)

    useEffect(() => {
        fetchData()
    }, [projectId])

    const fetchData = async () => {
        try {
            // Get project
            const projRes = await fetch(`/api/marketplace/projects/${projectId}`)
            if (projRes.ok) {
                const projData = await projRes.json()
                if (projData.success) {
                    setProject(projData.data)
                }
            }

            // Get applications
            const appRes = await fetch(`/api/marketplace/projects/${projectId}/apply`)
            if (appRes.ok) {
                const appData = await appRes.json()
                if (appData.success) {
                    setApplications(appData.data.applications || [])
                }
            }
        } catch (error) {
            console.error('Failed to fetch:', error)
            toast.error('Lỗi tải dữ liệu')
        } finally {
            setLoading(false)
        }
    }

    const updateApplication = async (appId: string, action: string) => {
        try {
            const res = await fetch(`/api/marketplace/projects/${projectId}/apply`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ applicationId: appId, action })
            })

            const data = await res.json()
            if (data.success) {
                toast.success(data.message || 'Cập nhật thành công')
                fetchData()
            } else {
                toast.error(data.error?.message || 'Có lỗi xảy ra')
            }
        } catch (error) {
            toast.error('Lỗi kết nối')
        }
    }

    const submitReport = async (reason: string, description: string) => {
        if (!selectedApp) return

        try {
            const res = await fetch(`/api/marketplace/projects/${projectId}/report`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    applicationId: selectedApp.id,
                    reason,
                    description
                })
            })

            const data = await res.json()
            if (data.success) {
                toast.success('Đã gửi báo cáo')
                setShowReportModal(false)
                setSelectedApp(null)
            } else {
                toast.error(data.error?.message || 'Có lỗi xảy ra')
            }
        } catch (error) {
            toast.error('Lỗi kết nối')
        }
    }

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', minimumFractionDigits: 0 }).format(amount)
    }

    const filteredApps = filterTier === 'ALL'
        ? applications
        : applications.filter(a => a.tier === filterTier)

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <Toaster position="top-right" />

            {/* Header */}
            <div className="bg-white border-b border-gray-200 sticky top-0 z-20">
                <div className="max-w-6xl mx-auto px-4 py-4">
                    <Link href={`/projects/${projectId}`} className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-3">
                        <ArrowLeft className="w-5 h-5 mr-2" />
                        Quay lại dự án
                    </Link>
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-xl font-bold text-gray-900">{project?.title}</h1>
                            <p className="text-sm text-gray-500">{applications.length} hồ sơ ứng tuyển</p>
                        </div>
                        <div className="flex items-center gap-2">
                            <select
                                value={filterTier}
                                onChange={(e) => setFilterTier(e.target.value)}
                                className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="ALL">Tất cả hồ sơ</option>
                                <option value="VERIFIED_PARTNER">Đối tác xác minh</option>
                                <option value="CERTIFIED_MEMBER">Thành viên</option>
                                <option value="PROVISIONAL">Hồ sơ tự khai</option>
                            </select>
                        </div>
                    </div>
                </div>
            </div>

            {/* AI Insights Widget */}
            <div className="max-w-6xl mx-auto px-4 py-4">
                <AIInsightsWidget
                    projectId={projectId}
                    onSelectApplication={(id) => {
                        const app = applications.find(a => a.id === id)
                        if (app) {
                            document.getElementById(`app-${id}`)?.scrollIntoView({ behavior: 'smooth' })
                        }
                    }}
                />
            </div>

            {/* Applications Grid */}
            <div className="max-w-6xl mx-auto px-4 py-6">
                {filteredApps.length === 0 ? (
                    <div className="text-center py-16">
                        <User className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                        <h2 className="text-lg font-medium text-gray-600">Chưa có hồ sơ ứng tuyển</h2>
                        <p className="text-gray-400">Các nhà thầu quan tâm sẽ gửi hồ sơ tại đây</p>
                    </div>
                ) : (
                    <div className="grid gap-4">
                        {filteredApps.map((app) => {
                            const tierInfo = TIER_BADGES[app.tier]
                            const statusInfo = STATUS_LABELS[app.status] || STATUS_LABELS.PENDING
                            const TierIcon = tierInfo.icon

                            return (
                                <div key={app.id} className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition-shadow">
                                    <div className="flex items-start gap-4">
                                        {/* Avatar */}
                                        <div className={`w-14 h-14 rounded-xl flex items-center justify-center ${app.tier === 'VERIFIED_PARTNER' ? 'bg-green-100' : app.tier === 'CERTIFIED_MEMBER' ? 'bg-blue-100' : 'bg-gray-100'}`}>
                                            <User className={`w-7 h-7 ${app.tier === 'VERIFIED_PARTNER' ? 'text-green-600' : app.tier === 'CERTIFIED_MEMBER' ? 'text-blue-600' : 'text-gray-400'}`} />
                                        </div>

                                        {/* Info */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1">
                                                <h3 className="font-semibold text-gray-900">
                                                    {app.isGuest ? app.guestName : app.contractor?.displayName || 'Nhà thầu'}
                                                </h3>
                                                <span className={`px-2 py-0.5 text-[10px] font-bold rounded ${tierInfo.color} flex items-center gap-1`}>
                                                    <TierIcon className="w-3 h-3" />
                                                    {tierInfo.label}
                                                </span>
                                                <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${statusInfo.color}`}>
                                                    {statusInfo.label}
                                                </span>
                                            </div>

                                            {/* Contractor highlights */}
                                            {app.contractor && (
                                                <div className="flex items-center gap-4 text-sm text-gray-500 mb-2">
                                                    {app.contractor.avgRating > 0 && (
                                                        <span className="flex items-center gap-1">
                                                            <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                                                            {app.contractor.avgRating.toFixed(1)}
                                                        </span>
                                                    )}
                                                    {app.contractor.experienceYears && (
                                                        <span>{app.contractor.experienceYears} năm KN</span>
                                                    )}
                                                    {app.contractor.totalProjectsCompleted > 0 && (
                                                        <span>{app.contractor.totalProjectsCompleted} dự án</span>
                                                    )}
                                                    {app.contractor.trustScore && (
                                                        <span className={`${app.contractor.trustScore >= 70 ? 'text-green-600' : app.contractor.trustScore >= 40 ? 'text-yellow-600' : 'text-red-600'}`}>
                                                            Tin cậy: {app.contractor.trustScore}%
                                                        </span>
                                                    )}
                                                </div>
                                            )}

                                            {/* Slogan */}
                                            {app.contractor?.highlightBio && (
                                                <p className="text-sm text-blue-600 italic mb-2">&ldquo;{app.contractor.highlightBio}&rdquo;</p>
                                            )}

                                            {/* Skills */}
                                            {app.contractor?.skills && app.contractor.skills.length > 0 && (
                                                <div className="flex flex-wrap gap-1 mb-2">
                                                    {app.contractor.skills.slice(0, 4).map((skill, i) => (
                                                        <span key={i} className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded">
                                                            {skill}
                                                        </span>
                                                    ))}
                                                </div>
                                            )}

                                            {/* Message preview */}
                                            <p className="text-sm text-gray-600 line-clamp-2 mb-3">{app.message}</p>

                                            {/* Budget & Timeline */}
                                            <div className="flex items-center gap-4 text-sm">
                                                {app.proposedBudget && (
                                                    <span className="font-semibold text-green-700">
                                                        {formatCurrency(app.proposedBudget)}
                                                    </span>
                                                )}
                                                {app.proposedDays && (
                                                    <span className="text-gray-500 flex items-center gap-1">
                                                        <Clock className="w-4 h-4" />
                                                        {app.proposedDays} ngày
                                                    </span>
                                                )}
                                                {app.materials && app.materials.length > 0 && (
                                                    <span className="text-blue-600 text-xs font-medium">
                                                        + {app.materials.length} vật tư từ SmartBuild
                                                    </span>
                                                )}
                                            </div>

                                            {/* Contact (masked or unlocked) */}
                                            <div className="mt-3 pt-3 border-t border-gray-100 flex items-center gap-4 text-sm">
                                                {app.isContactUnlocked ? (
                                                    <>
                                                        <a href={`tel:${app.isGuest ? app.guestPhone : app.contractor?.phone}`}
                                                            className="text-blue-600 flex items-center gap-1 hover:underline">
                                                            <Phone className="w-4 h-4" />
                                                            {app.isGuest ? app.guestPhone : app.contractor?.phone}
                                                        </a>
                                                        {app.guestEmail && (
                                                            <a href={`mailto:${app.guestEmail}`} className="text-blue-600 flex items-center gap-1 hover:underline">
                                                                <Mail className="w-4 h-4" />
                                                                {app.guestEmail}
                                                            </a>
                                                        )}
                                                    </>
                                                ) : (
                                                    <span className="text-gray-400 flex items-center gap-1">
                                                        <Phone className="w-4 h-4" />
                                                        {app.isGuest ? app.guestPhone : app.contractor?.phone}
                                                        <span className="text-xs">(đã che)</span>
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        {/* Actions */}
                                        <div className="flex flex-col gap-2">
                                            {!app.isContactUnlocked && app.status !== 'REJECTED' && app.status !== 'CLOSED' && (
                                                <button
                                                    onClick={() => updateApplication(app.id, 'UNLOCK_CONTACT')}
                                                    className="px-3 py-2 text-xs font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 flex items-center gap-1"
                                                >
                                                    <Unlock className="w-4 h-4" />
                                                    Mở khóa SĐT
                                                </button>
                                            )}

                                            {app.status === 'PENDING' && (
                                                <>
                                                    <button
                                                        onClick={() => updateApplication(app.id, 'SHORTLIST')}
                                                        className="px-3 py-2 text-xs font-medium text-purple-600 bg-purple-50 rounded-lg hover:bg-purple-100"
                                                    >
                                                        Danh sách ngắn
                                                    </button>
                                                    <button
                                                        onClick={() => updateApplication(app.id, 'NEGOTIATE')}
                                                        className="px-3 py-2 text-xs font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
                                                    >
                                                        Thương thảo
                                                    </button>
                                                </>
                                            )}

                                            {(app.status === 'NEGOTIATING' || app.status === 'SHORTLISTED') && (
                                                <button
                                                    onClick={() => {
                                                        setSelectedForContract(app)
                                                        setShowContractModal(true)
                                                    }}
                                                    className="px-3 py-2 text-xs font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 flex items-center gap-1"
                                                >
                                                    <CheckCircle className="w-4 h-4" />
                                                    Chọn & Tạo hợp đồng
                                                </button>
                                            )}

                                            {app.status !== 'REJECTED' && app.status !== 'CLOSED' && app.status !== 'SELECTED' && (
                                                <button
                                                    onClick={() => updateApplication(app.id, 'REJECT')}
                                                    className="px-3 py-2 text-xs font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100"
                                                >
                                                    Từ chối
                                                </button>
                                            )}

                                            <button
                                                onClick={() => { setSelectedApp(app); setShowReportModal(true) }}
                                                className="px-3 py-2 text-xs font-medium text-gray-500 hover:text-red-600 flex items-center gap-1"
                                            >
                                                <Flag className="w-4 h-4" />
                                                Báo cáo
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                )}
            </div>

            {/* Report Modal */}
            {showReportModal && selectedApp && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl max-w-md w-full p-6">
                        <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                            <Flag className="w-5 h-5 text-red-500" />
                            Báo cáo vi phạm
                        </h2>
                        <p className="text-sm text-gray-500 mb-4">
                            Báo cáo hồ sơ: <strong>{selectedApp.isGuest ? selectedApp.guestName : selectedApp.contractor?.displayName}</strong>
                        </p>

                        <ReportForm
                            onSubmit={submitReport}
                            onCancel={() => { setShowReportModal(false); setSelectedApp(null) }}
                        />
                    </div>
                </div>
            )}

            {/* Create Contract Modal */}
            {showContractModal && selectedForContract && (
                <CreateContractModal
                    isOpen={showContractModal}
                    onClose={() => {
                        setShowContractModal(false)
                        setSelectedForContract(null)
                    }}
                    projectId={projectId}
                    projectTitle={project?.title || ''}
                    applicationId={selectedForContract.id}
                    contractorName={selectedForContract.isGuest
                        ? selectedForContract.guestName || 'Khách'
                        : selectedForContract.contractor?.displayName || 'Nhà thầu'}
                    proposedBudget={selectedForContract.proposedBudget}
                    onSuccess={fetchData}
                />
            )}

            {/* Review Modal */}
            {showReviewModal && selectedApp && selectedApp.contractorId && (
                <ReviewModal
                    isOpen={showReviewModal}
                    onClose={() => {
                        setShowReviewModal(false)
                        setSelectedApp(null)
                    }}
                    projectId={projectId}
                    projectTitle={project?.title || ''}
                    contractorId={selectedApp.contractorId}
                    contractorName={selectedApp.contractor?.displayName || 'Nhà thầu'}
                    onSuccess={fetchData}
                />
            )}
        </div>
    )
}

function ReportForm({ onSubmit, onCancel }: { onSubmit: (reason: string, desc: string) => void, onCancel: () => void }) {
    const [reason, setReason] = useState('')
    const [description, setDescription] = useState('')

    const reasons = [
        { value: 'FAKE_INFO', label: 'Thông tin sai sự thật' },
        { value: 'HARASSMENT', label: 'Quấy rối' },
        { value: 'FRAUD', label: 'Gian lận tài chính' },
        { value: 'IMPERSONATION', label: 'Mạo danh doanh nghiệp' },
        { value: 'SPAM', label: 'Spam/Quảng cáo' },
        { value: 'OTHER', label: 'Lý do khác' }
    ]

    return (
        <div className="space-y-4">
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Lý do báo cáo *</label>
                <div className="space-y-2">
                    {reasons.map(r => (
                        <label key={r.value} className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="radio"
                                name="reason"
                                value={r.value}
                                checked={reason === r.value}
                                onChange={(e) => setReason(e.target.value)}
                                className="text-blue-600"
                            />
                            <span className="text-sm">{r.label}</span>
                        </label>
                    ))}
                </div>
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Chi tiết (không bắt buộc)</label>
                <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={3}
                    placeholder="Mô tả thêm về vi phạm..."
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
            </div>

            <div className="flex gap-3 pt-2">
                <button
                    onClick={onCancel}
                    className="flex-1 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                    Hủy
                </button>
                <button
                    onClick={() => onSubmit(reason, description)}
                    disabled={!reason}
                    className="flex-1 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                >
                    Gửi báo cáo
                </button>
            </div>
        </div>
    )
}
