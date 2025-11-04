'use client'

import { useState } from 'react'
import { Star } from 'lucide-react'

interface ReviewFormProps {
  productId: string
  productName: string
  orderId?: string
  onSuccess?: () => void
  customerId: string
}

export default function ReviewForm({ productId, productName, orderId, customerId, onSuccess }: ReviewFormProps) {
  const [rating, setRating] = useState(5)
  const [hoveredRating, setHoveredRating] = useState(0)
  const [title, setTitle] = useState('')
  const [review, setReview] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (review.length < 10) {
      setError('Đánh giá phải có ít nhất 10 ký tự')
      return
    }

    setSubmitting(true)
    setError('')

    try {
      const response = await fetch(`/api/products/${productId}/reviews`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          rating,
          title,
          review,
          customerId,
          orderId
        })
      })

      if (response.ok) {
        alert('Đánh giá của bạn đã được gửi thành công!')
        setRating(5)
        setTitle('')
        setReview('')
        if (onSuccess) onSuccess()
      } else {
        setError(data.message || 'Không thể gửi đánh giá')
      }
    } catch (error) {
      setError('Đã có lỗi xảy ra. Vui lòng thử lại.')
    } finally {
      setSubmitting(false)
    }
  }

  const renderStars = () => {
    return Array.from({ length: 5 }).map((_, i) => {
      const starValue = i + 1
      const filled = hoveredRating ? starValue <= hoveredRating : starValue <= rating
      
      return (
        <button
          key={i}
          type="button"
          onClick={() => setRating(starValue)}
          onMouseEnter={() => setHoveredRating(starValue)}
          onMouseLeave={() => setHoveredRating(0)}
          className="focus:outline-none transition-transform hover:scale-110"
        >
          <Star
            className={`h-8 w-8 ${
              filled ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'
            }`}
          />
        </button>
      )
    })
  }

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <h3 className="text-xl font-bold text-gray-900 mb-4">
        Đánh giá sản phẩm: {productName}
      </h3>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Rating */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Đánh giá của bạn <span className="text-red-500">*</span>
          </label>
          <div className="flex gap-2">
            {renderStars()}
          </div>
          <p className="text-sm text-gray-500 mt-2">
            {rating === 5 && 'Tuyệt vời!'}
            {rating === 4 && 'Rất tốt'}
            {rating === 3 && 'Tốt'}
            {rating === 2 && 'Bình thường'}
            {rating === 1 && 'Tệ'}
          </p>
        </div>

        {/* Title */}
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
            Tiêu đề (Tùy chọn)
          </label>
          <input
            id="title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Tóm tắt đánh giá của bạn"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            maxLength={100}
          />
        </div>

        {/* Review */}
        <div>
          <label htmlFor="review" className="block text-sm font-medium text-gray-700 mb-2">
            Đánh giá chi tiết <span className="text-red-500">*</span>
          </label>
          <textarea
            id="review"
            value={review}
            onChange={(e) => setReview(e.target.value)}
            placeholder="Chia sẻ trải nghiệm của bạn về sản phẩm này..."
            rows={5}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            required
            minLength={10}
          />
          <p className="text-sm text-gray-500 mt-1">
            Tối thiểu 10 ký tự ({review.length}/10)
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={submitting || review.length < 10}
          className="w-full bg-gradient-to-r from-primary-600 to-secondary-600 text-white py-3 rounded-lg font-semibold hover:from-primary-700 hover:to-secondary-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {submitting ? 'Đang gửi...' : 'Gửi Đánh Giá'}
        </button>
      </form>
    </div>
  )
}
