'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Star, ArrowLeft, Trash2, CheckCircle } from 'lucide-react'
import { useAuth } from '@/contexts/auth-context'
import { useRouter } from 'next/navigation'

interface Review {
  id: string
  rating: number
  title?: string
  review: string
  isVerified: boolean
  isPublished: boolean
  helpfulCount: number
  createdAt: string
  product: {
    id: string
    name: string
    images: string[]
    price: number
  }
}

export default function MyReviewsPage() {
  const { isAuthenticated, isLoading, user } = useAuth()
  const router = useRouter()
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login')
    } else if (isAuthenticated) {
      fetchReviews()
    }
  }, [isLoading, isAuthenticated, router])

  const fetchReviews = async () => {
    try {
      const response = await fetch('/api/reviews', {
        headers: {
          'x-user-id': user?.id || '',
          'x-user-role': user?.role || ''
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        setReviews(data.data?.data || [])
      }
    } catch (error) {
      console.error('Error fetching reviews:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (reviewId: string) => {
    if (!confirm('Bạn có chắc muốn xóa đánh giá này?')) return
    
    try {
      const response = await fetch(`/api/reviews/${reviewId}`, {
        method: 'DELETE',
        headers: {
          'x-user-id': user?.id || '',
          'x-user-role': user?.role || ''
        }
      })
      
      if (response.ok) {
        setReviews(reviews.filter(r => r.id !== reviewId))
      } else {
        alert('Không thể xóa đánh giá')
      }
    } catch (error) {
      console.error('Error deleting review:', error)
      alert('Đã có lỗi xảy ra')
    }
  }

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }).map((_, i) => (
      <Star
        key={i}
        className={`h-4 w-4 ${
          i < rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'
        }`}
      />
    ))
  }

  if (isLoading || loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  if (!isAuthenticated) return null

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        {/* Header */}
        <div>
          <Link href="/account" className="inline-flex items-center text-gray-600 hover:text-primary-600 mb-4 transition-colors">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Quay lại tài khoản
          </Link>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary-600 to-secondary-600 bg-clip-text text-transparent">
            ⭐ Đánh Giá Của Tôi
          </h1>
          <p className="text-gray-600 mt-2">Quản lý các đánh giá bạn đã viết</p>
        </div>

        {/* Reviews List */}
        {reviews.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-xl p-16 text-center">
            <Star className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Chưa có đánh giá nào
            </h2>
            <p className="text-gray-600 mb-8">
              Hãy mua sắm và chia sẻ trải nghiệm của bạn!
            </p>
            <Link
              href="/products"
              className="inline-block bg-gradient-to-r from-primary-600 to-secondary-600 text-white px-8 py-4 rounded-xl hover:from-primary-700 hover:to-secondary-700 transition-all font-bold"
            >
              Khám Phá Sản Phẩm
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {reviews.map((review) => (
              <div key={review.id} className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow">
                <div className="flex gap-6">
                  {/* Product Image */}
                  <div className="flex-shrink-0">
                    <img
                      src={review.product.images[0] || '/placeholder-product.png'}
                      alt={review.product.name}
                      className="w-24 h-24 object-cover rounded-lg"
                    />
                  </div>

                  {/* Review Content */}
                  <div className="flex-grow">
                    <div className="flex items-start justify-between">
                      <div>
                        <Link 
                          href={`/products/${review.product.id}`}
                          className="text-lg font-semibold text-gray-900 hover:text-primary-600"
                        >
                          {review.product.name}
                        </Link>
                        <div className="flex items-center gap-2 mt-1">
                          <div className="flex gap-1">
                            {renderStars(review.rating)}
                          </div>
                          {review.isVerified && (
                            <span className="flex items-center text-xs text-green-600">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Đã mua hàng
                            </span>
                          )}
                          <span className={`text-xs px-2 py-1 rounded ${
                            review.isPublished 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {review.isPublished ? 'Đã xuất bản' : 'Chưa xuất bản'}
                          </span>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleDelete(review.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Xóa"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>

                    {review.title && (
                      <h4 className="font-semibold text-gray-900 mt-3">{review.title}</h4>
                    )}
                    <p className="text-gray-600 mt-2">{review.review}</p>
                    
                    <div className="flex items-center gap-4 mt-3 text-sm text-gray-500">
                      <span>{new Date(review.createdAt).toLocaleDateString('vi-VN')}</span>
                      <span>•</span>
                      <span>{review.helpfulCount} người thấy hữu ích</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
