'use client'

/**
 * Project Review Modal
 * Allows project owner to review contractor after project completion
 */

import { useState } from 'react'
import { X, Star, Camera, Upload, Loader2, CheckCircle, MessageSquare } from 'lucide-react'
import toast from 'react-hot-toast'

interface ReviewModalProps {
    isOpen: boolean
    onClose: () => void
    projectId: string
    projectTitle: string
    contractorId: string
    contractorName: string
    onSuccess?: () => void
}

export default function ReviewModal({
    isOpen,
    onClose,
    projectId,
    projectTitle,
    contractorId,
    contractorName,
    onSuccess
}: ReviewModalProps) {
    const [rating, setRating] = useState(0)
    const [hoverRating, setHoverRating] = useState(0)
    const [comment, setComment] = useState('')
    const [qualityRating, setQualityRating] = useState(0)
    const [communicationRating, setCommunicationRating] = useState(0)
    const [timelinessRating, setTimelinessRating] = useState(0)
    const [images, setImages] = useState<string[]>([])
    const [submitting, setSubmitting] = useState(false)

    const handleSubmit = async () => {
        if (rating === 0) {
            toast.error('Vui lòng chọn số sao đánh giá')
            return
        }

        setSubmitting(true)

        try {
            const token = localStorage.getItem('access_token')
            const res = await fetch(`/api/marketplace/projects/${projectId}/review`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': token ? `Bearer ${token}` : ''
                },
                body: JSON.stringify({
                    contractorId,
                    rating,
                    comment,
                    qualityRating: qualityRating || rating,
                    communicationRating: communicationRating || rating,
                    timelinessRating: timelinessRating || rating,
                    projectImages: images
                })
            })

            const data = await res.json()

            if (data.success) {
                toast.success('Cảm ơn bạn đã đánh giá!')
                onSuccess?.()
                onClose()
            } else {
                toast.error(data.error?.message || 'Có lỗi xảy ra')
            }
        } catch (err) {
            toast.error('Lỗi kết nối')
        } finally {
            setSubmitting(false)
        }
    }

    const StarRating = ({
        value,
        onChange,
        size = 'lg'
    }: {
        value: number
        onChange: (v: number) => void
        size?: 'sm' | 'lg'
    }) => {
        const [hover, setHover] = useState(0)
        const sizeClass = size === 'lg' ? 'w-10 h-10' : 'w-6 h-6'

        return (
            <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                    <button
                        key={star}
                        type="button"
                        onClick={() => onChange(star)}
                        onMouseEnter={() => setHover(star)}
                        onMouseLeave={() => setHover(0)}
                        className="focus:outline-none"
                    >
                        <Star
                            className={`${sizeClass} transition-colors ${star <= (hover || value)
                                    ? 'text-yellow-400 fill-yellow-400'
                                    : 'text-gray-300'
                                }`}
                        />
                    </button>
                ))}
            </div>
        )
    }

    const getRatingText = (r: number) => {
        if (r === 5) return 'Xuất sắc'
        if (r === 4) return 'Tốt'
        if (r === 3) return 'Bình thường'
        if (r === 2) return 'Chưa hài lòng'
        if (r === 1) return 'Rất tệ'
        return ''
    }

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-hidden flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-100">
                    <div>
                        <h2 className="text-xl font-bold text-gray-900">Đánh giá nhà thầu</h2>
                        <p className="text-sm text-gray-500 mt-0.5">{projectTitle}</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full">
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6">
                    {/* Contractor info */}
                    <div className="p-4 bg-gray-50 rounded-xl mb-6">
                        <p className="text-sm text-gray-500">Nhà thầu thực hiện</p>
                        <p className="font-semibold text-gray-900">{contractorName}</p>
                    </div>

                    {/* Overall rating */}
                    <div className="text-center mb-6">
                        <p className="text-sm font-medium text-gray-700 mb-3">Đánh giá tổng thể</p>
                        <StarRating value={rating} onChange={setRating} size="lg" />
                        {rating > 0 && (
                            <p className={`mt-2 font-semibold ${rating >= 4 ? 'text-green-600' :
                                    rating >= 3 ? 'text-yellow-600' : 'text-red-600'
                                }`}>
                                {getRatingText(rating)}
                            </p>
                        )}
                    </div>

                    {/* Detailed ratings */}
                    <div className="space-y-3 mb-6">
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600">Chất lượng công trình</span>
                            <StarRating value={qualityRating} onChange={setQualityRating} size="sm" />
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600">Giao tiếp, phối hợp</span>
                            <StarRating value={communicationRating} onChange={setCommunicationRating} size="sm" />
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600">Đúng tiến độ</span>
                            <StarRating value={timelinessRating} onChange={setTimelinessRating} size="sm" />
                        </div>
                    </div>

                    {/* Comment */}
                    <div className="mb-6">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            <MessageSquare className="w-4 h-4 inline mr-1" />
                            Nhận xét (không bắt buộc)
                        </label>
                        <textarea
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            rows={4}
                            placeholder="Chia sẻ trải nghiệm của bạn với nhà thầu này..."
                            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 resize-none"
                        />
                    </div>

                    {/* Image upload placeholder */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            <Camera className="w-4 h-4 inline mr-1" />
                            Hình ảnh công trình (không bắt buộc)
                        </label>
                        <div className="border-2 border-dashed border-gray-200 rounded-xl p-6 text-center">
                            <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                            <p className="text-sm text-gray-500">
                                Tải lên hình ảnh công trình thực tế
                            </p>
                            <p className="text-xs text-gray-400 mt-1">
                                Ảnh sẽ được hiển thị trong hồ sơ nhà thầu
                            </p>
                        </div>
                    </div>

                    {/* Benefit notice */}
                    {rating >= 4 && (
                        <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-xl">
                            <p className="text-sm text-green-700 flex items-center gap-2">
                                <CheckCircle className="w-4 h-4" />
                                Đánh giá tích cực giúp nhà thầu tăng điểm tin cậy!
                            </p>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-gray-100 flex gap-3">
                    <button
                        onClick={onClose}
                        className="flex-1 py-3 border border-gray-300 text-gray-700 font-medium rounded-xl hover:bg-gray-50"
                    >
                        Để sau
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={submitting || rating === 0}
                        className="flex-1 py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                        {submitting ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                            <>
                                <Star className="w-5 h-5" />
                                Gửi đánh giá
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    )
}
