'use client'

import { useState } from 'react'
import StarRating from './StarRating'
import { MessageSquare, Send } from 'lucide-react'
import toast from 'react-hot-toast'

interface ReviewFormProps {
  productId: string
  customerId?: string
  orderId?: string
  onSuccess?: () => void
}

export default function ReviewForm({ productId, customerId, orderId, onSuccess }: ReviewFormProps) {
  const [rating, setRating] = useState(0)
  const [title, setTitle] = useState('')
  const [review, setReview] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!customerId) {
      toast.error('Bạn cần đăng nhập để đánh giá')
      return
    }

    if (rating === 0) {
      toast.error('Vui lòng chọn số sao')
      return
    }

    if (review.length < 10) {
      toast.error('Đánh giá phải có ít nhất 10 ký tự')
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch(`/api/products/${productId}/reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rating,
          title: title || undefined,
          review,
          customerId,
          orderId
        })
      })

      const result = await response.json()

      if (response.ok && result.success) {
        toast.success('Cảm ơn bạn đã đánh giá!')
        setRating(0)
        setTitle('')
        setReview('')
        if (onSuccess) onSuccess()
      } else {
        throw new Error(result.error?.message || 'Failed to submit review')
      }
    } catch (error: any) {
      toast.error(error.message || 'Có lỗi xảy ra khi gửi đánh giá')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
      <div className="flex items-center gap-2 mb-6">
        <MessageSquare className="h-6 w-6 text-primary-600" />
        <h3 className="text-xl font-bold text-gray-900">Viết Đánh Giá</h3>
      </div>

      {/* Rating */}
      <div className="mb-6">
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          Đánh Giá Của Bạn *
        </label>
        <StarRating
          rating={rating}
          onRatingChange={setRating}
          size="lg"
        />
        {rating > 0 && (
          <p className="text-sm text-gray-600 mt-2">
            {rating === 5 && '⭐ Tuyệt vời!'}
            {rating === 4 && '👍 Rất tốt!'}
            {rating === 3 && '😊 Tốt'}
            {rating === 2 && '😐 Tạm được'}
            {rating === 1 && '😞 Không tốt'}
          </p>
        )}
      </div>

      {/* Title */}
      <div className="mb-4">
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          Tiêu Đề (Tùy chọn)
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Tóm tắt đánh giá của bạn"
          className="w-full border-2 border-gray-300 rounded-lg px-4 py-2 focus:border-primary-500 focus:ring-2 focus:ring-primary-200 transition-all outline-none"
          maxLength={100}
        />
      </div>

      {/* Review Text */}
      <div className="mb-6">
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          Đánh Giá Chi Tiết *
        </label>
        <textarea
          value={review}
          onChange={(e) => setReview(e.target.value)}
          placeholder="Chia sẻ trải nghiệm của bạn về sản phẩm này..."
          rows={5}
          className="w-full border-2 border-gray-300 rounded-lg px-4 py-3 focus:border-primary-500 focus:ring-2 focus:ring-primary-200 transition-all outline-none resize-none"
          minLength={10}
          maxLength={1000}
        />
        <div className="flex justify-between text-xs text-gray-500 mt-1">
          <span>Tối thiểu 10 ký tự</span>
          <span>{review.length}/1000</span>
        </div>
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={isSubmitting || rating === 0 || review.length < 10}
        className="w-full bg-primary-600 text-white py-3 rounded-lg hover:bg-primary-700 transition-colors font-bold flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isSubmitting ? (
          <>Đang gửi...</>
        ) : (
          <>
            <Send className="h-5 w-5" />
            Gửi Đánh Giá
          </>
        )}
      </button>
    </form>
  )
}
