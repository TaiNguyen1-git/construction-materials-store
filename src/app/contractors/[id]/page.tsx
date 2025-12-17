'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import Header from '@/components/Header'
import GuestInfoModal from '@/components/GuestInfoModal'
import { Star, MapPin, Phone, Mail, CheckCircle, Briefcase, Users, ArrowLeft, Calendar, MessageCircle } from 'lucide-react'

interface Contractor {
    id: string
    displayName: string
    bio: string | null
    avatar: string | null
    city: string
    district: string | null
    phone: string | null
    email: string | null
    skills: string[]
    experienceYears: number
    teamSize: number
    isVerified: boolean
    avgRating: number
    totalReviews: number
    completedJobs: number
    isAvailable: boolean
    createdAt: string
}

interface Review {
    id: string
    rating: number
    title: string | null
    comment: string
    createdAt: string
}

const SKILL_LABELS: Record<string, string> = {
    CONSTRUCTION: 'Xây dựng',
    RENOVATION: 'Cải tạo',
    INTERIOR: 'Nội thất',
    FLOORING: 'Lát gạch/sàn',
    PAINTING: 'Sơn',
    PLUMBING: 'Ống nước',
    ELECTRICAL: 'Điện',
    ROOFING: 'Mái',
    CARPENTRY: 'Mộc',
    WELDING: 'Hàn',
    MASONRY: 'Xây',
    TILING: 'Ốp lát'
}

export default function ContractorDetailPage() {
    const params = useParams()
    const router = useRouter()
    const [contractor, setContractor] = useState<Contractor | null>(null)
    const [reviews, setReviews] = useState<Review[]>([])
    const [loading, setLoading] = useState(true)

    const [showGuestModal, setShowGuestModal] = useState(false)

    const [showReviewForm, setShowReviewForm] = useState(false)
    const [submitRating, setSubmitRating] = useState(5)
    const [submitComment, setSubmitComment] = useState('')
    const [submitLoading, setSubmitLoading] = useState(false)

    useEffect(() => {
        if (params.id) {
            fetchContractor()
        }
    }, [params.id])

    const fetchContractor = async () => {
        try {
            const res = await fetch(`/api/contractors/${params.id}`)
            if (res.ok) {
                const data = await res.json()
                if (data.success) {
                    setContractor(data.data.contractor)
                    setReviews(data.data.reviews || [])
                }
            }
        } catch (error) {
            console.error('Failed to fetch contractor:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleMessage = () => {
        const userId = localStorage.getItem('user_id')
        if (userId) {
            // Already identified
            createConversation(userId)
        } else {
            // Need guest info
            setShowGuestModal(true)
        }
    }

    const handleGuestSubmit = (info: { name: string; phone: string; email: string }) => {
        const guestId = 'guest_' + Date.now()
        localStorage.setItem('user_id', guestId)
        localStorage.setItem('user_name', info.name)
        localStorage.setItem('user_phone', info.phone)
        localStorage.setItem('user_email', info.email)

        setShowGuestModal(false)
        createConversation(guestId, info.name)
    }

    const createConversation = async (userId: string, userName?: string) => {
        if (!contractor) return

        try {
            const res = await fetch('/api/messages', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    senderId: userId,
                    senderName: userName || localStorage.getItem('user_name'),
                    recipientId: contractor.id,
                    recipientName: contractor.displayName,
                    initialMessage: `Chào ${contractor.displayName}, tôi quan tâm đến dịch vụ của bạn.`
                })
            })

            if (res.ok) {
                router.push('/messages')
            }
        } catch (error) {
            console.error('Failed to create conversation', error)
        }
    }

    const handleSubmitReview = async (e: React.FormEvent) => {
        e.preventDefault()
        setSubmitLoading(true)

        try {
            const res = await fetch(`/api/contractors/${params.id}/reviews`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-user-id': localStorage.getItem('user_id') || ''
                },
                body: JSON.stringify({
                    rating: submitRating,
                    comment: submitComment
                })
            })

            const data = await res.json()

            if (res.ok && data.success) {
                // Refresh reviews
                setReviews([data.data.review, ...reviews])
                // Update contractor stats
                if (contractor) {
                    setContractor({
                        ...contractor,
                        avgRating: data.data.newStats.avgRating,
                        totalReviews: data.data.newStats.totalReviews
                    })
                }
                // Reset form
                setShowReviewForm(false)
                setSubmitComment('')
                setSubmitRating(5)
                alert('Đánh giá thành công!')
            } else {
                alert(data.error?.message || 'Gửi đánh giá thất bại')
            }
        } catch (error) {
            console.error('Submit review error:', error)
            alert('Lỗi kết nối server')
        } finally {
            setSubmitLoading(false)
        }
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50">
                <Header />
                <div className="flex justify-center py-20">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
                </div>
            </div>
        )
    }

    if (!contractor) {
        return (
            <div className="min-h-screen bg-gray-50">
                <Header />
                <div className="max-w-4xl mx-auto px-4 py-12 text-center">
                    <h1 className="text-2xl font-bold text-gray-800">Không tìm thấy nhà thầu</h1>
                    <Link href="/contractors" className="text-blue-600 hover:underline mt-4 inline-block">
                        ← Quay lại danh sách
                    </Link>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <Header />

            <div className="max-w-4xl mx-auto px-4 py-8">
                {/* Back Link */}
                <Link href="/contractors" className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-6">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Quay lại danh sách
                </Link>

                {/* Profile Card */}
                <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
                    <div className="flex items-start gap-6">
                        {/* Avatar */}
                        <div className="w-24 h-24 rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 flex items-center justify-center text-white text-3xl font-bold flex-shrink-0">
                            {contractor.avatar ? (
                                <img src={contractor.avatar} alt="" className="w-full h-full rounded-full object-cover" />
                            ) : (
                                contractor.displayName.charAt(0).toUpperCase()
                            )}
                        </div>

                        {/* Info */}
                        <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                                <h1 className="text-2xl font-bold text-gray-900">{contractor.displayName}</h1>
                                {contractor.isVerified && (
                                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
                                        <CheckCircle className="w-3 h-3" />
                                        Đã xác minh
                                    </span>
                                )}
                            </div>

                            {/* Rating */}
                            <div className="flex items-center gap-4 mb-3">
                                <div className="flex items-center">
                                    <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" />
                                    <span className="ml-1 font-semibold text-gray-800">{contractor.avgRating.toFixed(1)}</span>
                                    <span className="ml-1 text-gray-500">({contractor.totalReviews} đánh giá)</span>
                                </div>
                                <span className={`px-2 py-1 text-xs rounded-full ${contractor.isAvailable ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                                    }`}>
                                    {contractor.isAvailable ? '✓ Đang nhận việc' : 'Đang bận'}
                                </span>
                            </div>

                            {/* Location */}
                            <div className="flex items-center text-gray-600 mb-3">
                                <MapPin className="w-4 h-4 mr-2" />
                                {contractor.district && `${contractor.district}, `}{contractor.city}
                            </div>

                            {/* Bio */}
                            {contractor.bio && (
                                <p className="text-gray-600">{contractor.bio}</p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-4 mb-6">
                    <div className="bg-white rounded-lg border border-gray-200 p-4 text-center">
                        <div className="text-2xl font-bold text-gray-800">{contractor.completedJobs}</div>
                        <div className="text-sm text-gray-500">Dự án hoàn thành</div>
                    </div>
                    <div className="bg-white rounded-lg border border-gray-200 p-4 text-center">
                        <div className="text-2xl font-bold text-gray-800">{contractor.experienceYears}</div>
                        <div className="text-sm text-gray-500">Năm kinh nghiệm</div>
                    </div>
                    <div className="bg-white rounded-lg border border-gray-200 p-4 text-center">
                        <div className="text-2xl font-bold text-gray-800">{contractor.teamSize}</div>
                        <div className="text-sm text-gray-500">Thành viên</div>
                    </div>
                </div>

                {/* Skills */}
                <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
                    <h2 className="text-lg font-semibold text-gray-800 mb-4">Chuyên môn</h2>
                    <div className="flex flex-wrap gap-2">
                        {contractor.skills.map((skill, i) => (
                            <span key={i} className="px-3 py-1.5 bg-blue-50 text-blue-700 rounded-full text-sm">
                                {SKILL_LABELS[skill] || skill}
                            </span>
                        ))}
                    </div>
                </div>

                {/* Contact */}
                <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
                    <h2 className="text-lg font-semibold text-gray-800 mb-4">Liên hệ</h2>
                    <div className="space-y-3">
                        {contractor.phone && (
                            <div className="flex items-center text-gray-700">
                                <Phone className="w-5 h-5 mr-3 text-gray-400" />
                                <a href={`tel:${contractor.phone}`} className="hover:text-blue-600">{contractor.phone}</a>
                            </div>
                        )}
                        {contractor.email && (
                            <div className="flex items-center text-gray-700">
                                <Mail className="w-5 h-5 mr-3 text-gray-400" />
                                <a href={`mailto:${contractor.email}`} className="hover:text-blue-600">{contractor.email}</a>
                            </div>
                        )}
                        <button
                            onClick={handleMessage}
                            className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-bold transition-all shadow-md mt-4"
                        >
                            <MessageCircle className="w-5 h-5" />
                            Nhắn tin
                        </button>
                    </div>
                </div>

                <GuestInfoModal
                    isOpen={showGuestModal}
                    onClose={() => setShowGuestModal(false)}
                    onSubmit={handleGuestSubmit}
                />

                {/* Reviews */}
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-lg font-semibold text-gray-800">
                            Đánh giá ({contractor.totalReviews})
                        </h2>
                        <button
                            onClick={() => setShowReviewForm(!showReviewForm)}
                            className="text-blue-600 font-medium hover:underline text-sm"
                        >
                            {showReviewForm ? 'Hủy' : 'Viết đánh giá'}
                        </button>
                    </div>

                    {showReviewForm && (
                        <form onSubmit={handleSubmitReview} className="mb-8 bg-gray-50 p-4 rounded-lg border border-gray-200">
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Đánh giá chung</label>
                                <div className="flex gap-1">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                        <button
                                            key={star}
                                            type="button"
                                            onClick={() => setSubmitRating(star)}
                                            className="focus:outline-none"
                                        >
                                            <Star
                                                className={`w-6 h-6 ${star <= submitRating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`}
                                            />
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Nội dung đánh giá</label>
                                <textarea
                                    required
                                    rows={3}
                                    value={submitComment}
                                    onChange={(e) => setSubmitComment(e.target.value)}
                                    placeholder="Chia sẻ trải nghiệm của bạn về nhà thầu này..."
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                                />
                            </div>

                            <div className="flex justify-end">
                                <button
                                    type="submit"
                                    disabled={submitLoading}
                                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm font-medium"
                                >
                                    {submitLoading ? 'Đang gửi...' : 'Gửi đánh giá'}
                                </button>
                            </div>
                        </form>
                    )}

                    {reviews.length === 0 ? (
                        <p className="text-gray-500 text-center py-6">Chưa có đánh giá nào</p>
                    ) : (
                        <div className="space-y-4">
                            {reviews.map(review => (
                                <div key={review.id} className="border-b border-gray-100 pb-4 last:border-0">
                                    <div className="flex items-center gap-2 mb-2">
                                        <div className="flex">
                                            {[...Array(5)].map((_, i) => (
                                                <Star
                                                    key={i}
                                                    className={`w-4 h-4 ${i < review.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`}
                                                />
                                            ))}
                                        </div>
                                        <span className="text-sm text-gray-500">
                                            {new Date(review.createdAt).toLocaleDateString('vi-VN')}
                                        </span>
                                    </div>
                                    {review.title && (
                                        <h4 className="font-medium text-gray-800">{review.title}</h4>
                                    )}
                                    <p className="text-gray-600 text-sm">{review.comment}</p>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
