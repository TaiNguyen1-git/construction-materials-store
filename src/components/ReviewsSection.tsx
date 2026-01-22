'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Star, ThumbsUp, CheckCircle, X } from 'lucide-react'
import { useAuth } from '@/contexts/auth-context'
import ReviewForm from './ReviewForm'
import LoginIncentiveModal from './LoginIncentiveModal'

interface Review {
  id: string
  rating: number
  title?: string
  review: string
  isVerified: boolean
  helpfulCount: number
  createdAt: string
  customerName: string
}

interface ReviewsSectionProps {
  productId: string
  productName: string
}

export default function ReviewsSection({ productId, productName }: ReviewsSectionProps) {
  const { user, isAuthenticated } = useAuth()
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)
  const [showWriteReview, setShowWriteReview] = useState(false)
  const [stats, setStats] = useState({
    average: 0,
    total: 0,
    distribution: [
      { rating: 5, count: 0 },
      { rating: 4, count: 0 },
      { rating: 3, count: 0 },
      { rating: 2, count: 0 },
      { rating: 1, count: 0 },
    ]
  })
  const [filterRating, setFilterRating] = useState<number | null>(null)
  const [customerId, setCustomerId] = useState<string>('')
  const [showLoginModal, setShowLoginModal] = useState(false)

  useEffect(() => {
    fetchReviews()
    if (isAuthenticated && user) {
      fetchCustomerId()
    }
  }, [productId, filterRating, isAuthenticated, user])

  const fetchCustomerId = async () => {
    try {
      const response = await fetch('/api/customers', {
        headers: {
          'x-user-id': user?.id || '',
          'x-user-role': user?.role || ''
        }
      })
      if (response.ok) {
        const data = await response.json()
        if (data.data?.customers?.[0]) {
          setCustomerId(data.data.customers[0].id)
        }
      }
    } catch (error) {
      console.error('Error fetching customer:', error)
    }
  }

  const fetchReviews = async () => {
    try {
      setLoading(true)
      const url = filterRating
        ? `/api/products/${productId}/reviews?rating=${filterRating}`
        : `/api/products/${productId}/reviews`

      const response = await fetch(url)
      if (response.ok) {
        const data = await response.json()
        const reviewsData = data.data?.data || []
        setReviews(reviewsData)

        // Calculate stats
        if (reviewsData.length > 0) {
          const avgRating = reviewsData.reduce((acc: number, r: Review) => acc + r.rating, 0) / reviewsData.length
          const distribution = [5, 4, 3, 2, 1].map(rating => ({
            rating,
            count: reviewsData.filter((r: Review) => r.rating === rating).length
          }))

          setStats({
            average: avgRating,
            total: reviewsData.length,
            distribution
          })
        }
      }
    } catch (error) {
      console.error('Error fetching reviews:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleHelpful = async (reviewId: string) => {
    try {
      const response = await fetch(`/api/reviews/${reviewId}/helpful`, {
        method: 'PUT'
      })
      if (response.ok) {
        fetchReviews()
      }
    } catch (error) {
      console.error('Error marking helpful:', error)
    }
  }

  const renderStars = (rating: number, size = 'h-5 w-5') => {
    return (
      <div className="flex gap-1">
        {Array.from({ length: 5 }).map((_, i) => (
          <Star
            key={i}
            className={`${size} ${i < rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'
              }`}
          />
        ))}
      </div>
    )
  }

  const getPercentage = (count: number) => {
    return stats.total > 0 ? (count / stats.total) * 100 : 0
  }

  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow-lg p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="h-20 bg-gray-200 rounded"></div>
          <div className="h-40 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6 space-y-6">
      <h2 className="text-xl font-black text-gray-900">Đánh Giá Sản Phẩm</h2>

      {/* Overall Rating */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-4 border-b">
        <div className="text-center md:border-r md:border-gray-50 pr-4">
          <div className="text-2xl font-black text-primary-600 mb-0.5">
            {stats.average.toFixed(1)}
          </div>
          <div className="flex justify-center mb-1">
            {renderStars(Math.round(stats.average), 'h-4 w-4')}
          </div>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">{stats.total} đánh giá</p>
        </div>

        <div className="space-y-1">
          {stats.distribution.map(({ rating, count }) => (
            <button
              key={rating}
              onClick={() => setFilterRating(filterRating === rating ? null : rating)}
              className={`w-full flex items-center gap-2 hover:bg-gray-50 px-2 py-1 rounded transition-colors ${filterRating === rating ? 'bg-primary-50' : ''
                }`}
            >
              <div className="flex items-center gap-1 min-w-[50px]">
                <span className="text-[10px] font-bold">{rating}</span>
                <Star className="h-3 w-3 text-yellow-400 fill-yellow-400" />
              </div>
              <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-yellow-400"
                  style={{ width: `${getPercentage(count)}%` }}
                />
              </div>
              <span className="text-[10px] font-bold text-gray-400 min-w-[30px] text-right">{count}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Write Review Section */}
      <div className="border-b pb-6">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-6">
          <div className="flex-1">
            <h3 className="text-sm font-bold text-gray-900 mb-0.5">Bạn có đánh giá về sản phẩm?</h3>
            <p className="text-[10px] text-gray-500">Chia sẻ trải nghiệm của bạn để giúp khách hàng khác có sự lựa chọn tốt hơn.</p>
          </div>
          <button
            onClick={() => {
              if (!isAuthenticated) {
                setShowLoginModal(true)
              } else {
                setShowWriteReview(!showWriteReview)
              }
            }}
            className="w-full md:w-auto bg-gradient-to-r from-primary-600 to-indigo-600 text-white px-6 py-2.5 rounded-xl text-xs font-black shadow-md hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-2"
          >
            {showWriteReview ? (
              <>
                <X className="h-4 w-4" />
                Hủy Bỏ
              </>
            ) : (
              <>
                <Star className="h-4 w-4 fill-white" />
                Viết Đánh Giá Của Bạn
              </>
            )}
          </button>
        </div>

        {showWriteReview && isAuthenticated && (
          <div className="animate-in fade-in slide-in-from-top-4 duration-500">
            <ReviewForm
              productId={productId}
              productName={productName}
              customerId={customerId}
              onSuccess={() => {
                setShowWriteReview(false)
                fetchReviews()
              }}
            />
          </div>
        )}
      </div>

      <LoginIncentiveModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        feature="review"
        title="Đánh giá sản phẩm"
        description="Chia sẻ kinh nghiệm sử dụng vật tư của bạn để nhận thêm điểm thưởng và ưu đãi từ SmartBuild."
      />

      {/* Reviews List */}
      {reviews.length === 0 ? (
        <div className="text-center py-12">
          <Star className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-600 text-lg">
            {filterRating
              ? `Chưa có đánh giá ${filterRating} sao`
              : 'Chưa có đánh giá nào. Hãy là người đầu tiên đánh giá!'
            }
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {reviews.map((review) => (
            <div key={review.id} className="border-b pb-6 last:border-0">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-bold text-gray-900">{review.customerName}</span>
                    {review.isVerified && (
                      <span className="flex items-center text-[10px] text-emerald-600 font-bold bg-emerald-50 px-1.5 py-0.5 rounded">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Đã mua hàng
                      </span>
                    )}
                  </div>
                  {renderStars(review.rating, 'h-3 w-3')}
                </div>
                <span className="text-[10px] text-gray-400">
                  {new Date(review.createdAt).toLocaleDateString('vi-VN')}
                </span>
              </div>

              {review.title && (
                <h4 className="text-sm font-bold text-gray-900 mb-1">{review.title}</h4>
              )}
              <p className="text-xs text-gray-600 mb-2 leading-relaxed">{review.review}</p>

              <button
                onClick={() => handleHelpful(review.id)}
                className="flex items-center gap-2 text-sm text-gray-600 hover:text-primary-600 transition-colors"
              >
                <ThumbsUp className="h-4 w-4" />
                Hữu ích ({review.helpfulCount})
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Clear Filter */}
      {filterRating && (
        <div className="text-center">
          <button
            onClick={() => setFilterRating(null)}
            className="text-primary-600 hover:text-primary-700 font-semibold"
          >
            Xem tất cả đánh giá
          </button>
        </div>
      )}
    </div>
  )
}
