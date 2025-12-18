'use client'

import { useState } from 'react'
import { Star } from 'lucide-react'

interface ReviewFormProps {
  productId: string
  productName: string
  orderId?: string
  onSuccess?: () => void
  customerId?: string // Make optional for guest support
}

export default function ReviewForm({ productId, productName, orderId, customerId, onSuccess }: ReviewFormProps) {
  const [rating, setRating] = useState(5)
  const [hoveredRating, setHoveredRating] = useState(0)
  const [title, setTitle] = useState('')
  const [review, setReview] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  // Guest fields
  const [guestName, setGuestName] = useState('')
  const [guestEmail, setGuestEmail] = useState('')
  const [guestPhone, setGuestPhone] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (review.length < 10) {
      setError('Đánh giá phải có ít nhất 10 ký tự')
      return
    }

    if (!customerId) {
      if (!guestName || !guestEmail) {
        setError('Vui lòng nhập tên và email của bạn')
        return
      }
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
          orderId,
          guestInfo: !customerId ? {
            name: guestName,
            email: guestEmail,
            phone: guestPhone
          } : undefined
        })
      })

      const data = await response.json()

      if (response.ok) {
        alert('Đánh giá của bạn đã được gửi thành công!')
        setRating(5)
        setTitle('')
        setReview('')
        setGuestName('')
        setGuestEmail('')
        setGuestPhone('')
        if (onSuccess) onSuccess()
      } else {
        setError(data.error?.message || data.message || 'Không thể gửi đánh giá')
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
            className={`h-8 w-8 ${filled ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'
              }`}
          />
        </button>
      )
    })
  }

  return (
    <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center gap-4 mb-6">
        <div className="bg-primary-100 p-3 rounded-2xl">
          <Star className="h-6 w-6 text-primary-600 fill-primary-600" />
        </div>
        <h3 className="text-2xl font-black text-gray-900 leading-tight">
          Đánh giá sản phẩm: <span className="text-primary-600">{productName}</span>
        </h3>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Guest Information Section */}
        {!customerId && (
          <div className="bg-gray-50 rounded-2xl p-6 space-y-4 border border-gray-100">
            <h4 className="font-bold text-gray-800 flex items-center gap-2 mb-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary-600 text-[10px] text-white">1</span>
              Thông tin cá nhân
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1.5 ml-1">
                  Họ và tên <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                  placeholder="Nguyễn Văn A"
                  className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1.5 ml-1">
                  Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  required
                  value={guestEmail}
                  onChange={(e) => setGuestEmail(e.target.value)}
                  placeholder="example@gmail.com"
                  className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all outline-none"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1.5 ml-1">
                Số điện thoại (Tùy chọn)
              </label>
              <input
                type="tel"
                value={guestPhone}
                onChange={(e) => setGuestPhone(e.target.value)}
                placeholder="09xx xxx xxx"
                className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all outline-none"
              />
            </div>
          </div>
        )}

        {/* Rating Section */}
        <div className="space-y-4">
          <h4 className="font-bold text-gray-800 flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary-600 text-[10px] text-white">{!customerId ? '2' : '1'}</span>
            Mức độ hài lòng <span className="text-red-500">*</span>
          </h4>
          <div className="flex flex-col items-center gap-3 p-6 bg-gray-50 rounded-2xl border border-gray-100">
            <div className="flex gap-3">
              {renderStars()}
            </div>
            <p className="text-lg font-black bg-gradient-to-r from-primary-600 to-secondary-600 bg-clip-text text-transparent">
              {rating === 5 && 'Tuyệt vời! 🌟🌟🌟🌟🌟'}
              {rating === 4 && 'Rất tốt 👍'}
              {rating === 3 && 'Tốt 👌'}
              {rating === 2 && 'Bình thường 🙂'}
              {rating === 1 && 'Tệ 😞'}
            </p>
          </div>
        </div>

        {/* Details Section */}
        <div className="space-y-4">
          <h4 className="font-bold text-gray-800 flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary-600 text-[10px] text-white">{!customerId ? '3' : '2'}</span>
            Nội dung đánh giá
          </h4>

          <div className="space-y-4">
            <div>
              <label htmlFor="title" className="block text-sm font-bold text-gray-700 mb-1.5 ml-1">
                Tiêu đề (Tùy chọn)
              </label>
              <input
                id="title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Tóm tắt đánh giá của bạn..."
                className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all outline-none"
                maxLength={100}
              />
            </div>

            <div>
              <label htmlFor="review" className="block text-sm font-bold text-gray-700 mb-1.5 ml-1">
                Chia sẻ trải nghiệm <span className="text-red-500">*</span>
              </label>
              <textarea
                id="review"
                value={review}
                onChange={(e) => setReview(e.target.value)}
                placeholder="Sản phẩm này tuyệt vời ở chỗ nào? Bạn hài lòng nhất điều gì..."
                rows={4}
                className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all outline-none resize-none"
                required
                minLength={10}
              />
              <div className="flex justify-between mt-2 ml-1">
                <p className="text-xs text-gray-500">
                  Tối thiểu 10 ký tự
                </p>
                <p className={`text-xs font-bold ${review.length >= 10 ? 'text-green-500' : 'text-gray-400'}`}>
                  {review.length}/10
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 text-red-700 px-4 py-3 rounded-lg flex items-center gap-3 animate-in fade-in duration-300">
            <div className="bg-red-500 text-white rounded-full p-1">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <span className="font-medium">{error}</span>
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={submitting || review.length < 10 || (!customerId && (!guestName || !guestEmail))}
          className="w-full bg-gradient-to-r from-primary-600 to-secondary-600 text-white py-4 rounded-xl font-black text-lg hover:from-primary-700 hover:to-secondary-700 transition-all transform hover:scale-[1.02] active:scale-98 disabled:opacity-50 disabled:cursor-not-allowed shadow-xl shadow-primary-200 flex items-center justify-center gap-3"
        >
          {submitting ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-2 border-white/30 border-t-white"></div>
              Đang gửi đánh giá...
            </>
          ) : (
            <>
              Gửi Đánh Giá Ngay
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </>
          )}
        </button>
      </form>
    </div>
  )
}
