'use client'

import { useState, useEffect } from 'react'
import { Star, Search, Eye, EyeOff, CheckCircle, Trash2, BarChart3 } from 'lucide-react'
import Link from 'next/link'

interface Review {
  id: string
  rating: number
  title?: string
  review: string
  isVerified: boolean
  isPublished: boolean
  helpfulCount: number
  createdAt: string
  customerName: string
  customerEmail: string
  product: {
    id: string
    name: string
    images: string[]
    price: number
  }
}

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterRating, setFilterRating] = useState<string>('')
  const [filterPublished, setFilterPublished] = useState<string>('')
  const [filterVerified, setFilterVerified] = useState<string>('')
  const [selectedReviews, setSelectedReviews] = useState<string[]>([])
  const [stats, setStats] = useState({
    averageRating: 0,
    totalReviews: 0,
    ratingDistribution: [] as { rating: number; count: number }[]
  })

  useEffect(() => {
    fetchReviews()
  }, [search, filterRating, filterPublished, filterVerified])

  const fetchReviews = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (search) params.append('search', search)
      if (filterRating) params.append('rating', filterRating)
      if (filterPublished) params.append('isPublished', filterPublished)
      if (filterVerified) params.append('isVerified', filterVerified)

      const response = await fetch(`/api/admin/reviews?${params.toString()}`, {
        headers: {
          'x-user-role': 'MANAGER'
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        setReviews(data.data?.data || [])
        setStats(data.data?.stats || {
          averageRating: 0,
          totalReviews: 0,
          ratingDistribution: []
        })
      }
    } catch (error) {
      console.error('Error fetching reviews:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleBulkAction = async (action: string) => {
    if (selectedReviews.length === 0) {
      alert('Vui lòng chọn ít nhất một đánh giá')
      return
    }

    if (!confirm(`Bạn có chắc muốn ${action === 'delete' ? 'xóa' : 'cập nhật'} ${selectedReviews.length} đánh giá?`)) {
      return
    }

    try {
      if (action === 'delete') {
        // Delete each review individually
        await Promise.all(
          selectedReviews.map(id =>
            fetch(`/api/reviews/${id}`, {
              method: 'DELETE',
              headers: { 'x-user-role': 'MANAGER' }
            })
          )
        )
      } else {
        // Bulk update
        const response = await fetch('/api/admin/reviews', {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'x-user-role': 'MANAGER'
          },
          body: JSON.stringify({
            reviewIds: selectedReviews,
            action
          })
        })

        if (!response.ok) {
          alert('Không thể cập nhật đánh giá')
          return
        }
      }

      setSelectedReviews([])
      fetchReviews()
    } catch (error) {
      console.error('Error performing bulk action:', error)
      alert('Đã có lỗi xảy ra')
    }
  }

  const toggleSelectReview = (reviewId: string) => {
    setSelectedReviews(prev =>
      prev.includes(reviewId)
        ? prev.filter(id => id !== reviewId)
        : [...prev, reviewId]
    )
  }

  const toggleSelectAll = () => {
    if (selectedReviews.length === reviews.length) {
      setSelectedReviews([])
    } else {
      setSelectedReviews(reviews.map(r => r.id))
    }
  }

  const renderStars = (rating: number) => {
    return (
      <div className="flex gap-1">
        {Array.from({ length: 5 }).map((_, i) => (
          <Star
            key={i}
            className={`h-4 w-4 ${
              i < rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'
            }`}
          />
        ))}
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Tổng đánh giá</p>
              <p className="text-3xl font-bold text-gray-900">{stats.totalReviews}</p>
            </div>
            <BarChart3 className="h-12 w-12 text-primary-600" />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Đánh giá trung bình</p>
              <div className="flex items-center gap-2">
                <p className="text-3xl font-bold text-gray-900">{stats.averageRating.toFixed(1)}</p>
                <Star className="h-6 w-6 text-yellow-400 fill-yellow-400" />
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6">
          <p className="text-sm text-gray-600 mb-3">Phân bố đánh giá</p>
          <div className="space-y-1">
            {stats.ratingDistribution.map(({ rating, count }) => (
              <div key={rating} className="flex items-center gap-2 text-sm">
                <span className="w-8">{rating}★</span>
                <div className="flex-1 h-2 bg-gray-200 rounded-full">
                  <div
                    className="h-full bg-yellow-400 rounded-full"
                    style={{ width: `${(count / stats.totalReviews) * 100}%` }}
                  />
                </div>
                <span className="w-8 text-right text-gray-600">{count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Tìm kiếm..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>

          <select
            value={filterRating}
            onChange={(e) => setFilterRating(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          >
            <option value="">Tất cả đánh giá</option>
            <option value="5">5 sao</option>
            <option value="4">4 sao</option>
            <option value="3">3 sao</option>
            <option value="2">2 sao</option>
            <option value="1">1 sao</option>
          </select>

          <select
            value={filterPublished}
            onChange={(e) => setFilterPublished(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          >
            <option value="">Trạng thái xuất bản</option>
            <option value="true">Đã xuất bản</option>
            <option value="false">Chưa xuất bản</option>
          </select>

          <select
            value={filterVerified}
            onChange={(e) => setFilterVerified(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          >
            <option value="">Trạng thái xác minh</option>
            <option value="true">Đã xác minh</option>
            <option value="false">Chưa xác minh</option>
          </select>
        </div>
      </div>

      {/* Bulk Actions */}
      {selectedReviews.length > 0 && (
        <div className="bg-primary-50 border border-primary-200 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-gray-700">
              Đã chọn {selectedReviews.length} đánh giá
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => handleBulkAction('publish')}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-semibold"
              >
                Xuất bản
              </button>
              <button
                onClick={() => handleBulkAction('unpublish')}
                className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors text-sm font-semibold"
              >
                Ẩn
              </button>
              <button
                onClick={() => handleBulkAction('verify')}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-semibold"
              >
                Xác minh
              </button>
              <button
                onClick={() => handleBulkAction('delete')}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-semibold"
              >
                Xóa
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reviews Table */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-4 text-left">
                  <input
                    type="checkbox"
                    checked={selectedReviews.length === reviews.length && reviews.length > 0}
                    onChange={toggleSelectAll}
                    className="rounded border-gray-300"
                  />
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Sản phẩm</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Khách hàng</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Đánh giá</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Nội dung</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Trạng thái</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Ngày</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {reviews.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                    Không có đánh giá nào
                  </td>
                </tr>
              ) : (
                reviews.map((review) => (
                  <tr key={review.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <input
                        type="checkbox"
                        checked={selectedReviews.includes(review.id)}
                        onChange={() => toggleSelectReview(review.id)}
                        className="rounded border-gray-300"
                      />
                    </td>
                    <td className="px-6 py-4">
                      <Link
                        href={`/products/${review.product.id}`}
                        className="flex items-center gap-3 hover:text-primary-600"
                      >
                        <img
                          src={review.product.images[0] || '/placeholder-product.png'}
                          alt={review.product.name}
                          className="w-12 h-12 object-cover rounded-lg"
                        />
                        <div>
                          <p className="font-semibold text-sm">{review.product.name}</p>
                          <p className="text-xs text-gray-500">{review.product.price.toLocaleString()}đ</p>
                        </div>
                      </Link>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-semibold text-sm">{review.customerName}</p>
                      <p className="text-xs text-gray-500">{review.customerEmail}</p>
                    </td>
                    <td className="px-6 py-4">
                      {renderStars(review.rating)}
                    </td>
                    <td className="px-6 py-4 max-w-xs">
                      {review.title && <p className="font-semibold text-sm mb-1">{review.title}</p>}
                      <p className="text-sm text-gray-600 line-clamp-2">{review.review}</p>
                      <p className="text-xs text-gray-500 mt-1">👍 {review.helpfulCount} hữu ích</p>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        <span className={`inline-flex items-center text-xs px-2 py-1 rounded ${
                          review.isPublished 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {review.isPublished ? <Eye className="h-3 w-3 mr-1" /> : <EyeOff className="h-3 w-3 mr-1" />}
                          {review.isPublished ? 'Xuất bản' : 'Ẩn'}
                        </span>
                        {review.isVerified && (
                          <span className="inline-flex items-center text-xs px-2 py-1 rounded bg-blue-100 text-blue-800 ml-1">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Xác minh
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {new Date(review.createdAt).toLocaleDateString('vi-VN')}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
