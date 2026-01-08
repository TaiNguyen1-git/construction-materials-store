'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Filter, X, ChevronDown } from 'lucide-react'

interface Category {
  id: string
  name: string
}

interface ProductFiltersProps {
  categories: Category[]
}

export default function ProductFilters({ categories }: ProductFiltersProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [showFilters, setShowFilters] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || '')
  const [minPrice, setMinPrice] = useState(searchParams.get('minPrice') || '')
  const [maxPrice, setMaxPrice] = useState(searchParams.get('maxPrice') || '')
  const [sortBy, setSortBy] = useState(searchParams.get('sort') || '')

  useEffect(() => {
    setSelectedCategory(searchParams.get('category') || '')
    setMinPrice(searchParams.get('minPrice') || '')
    setMaxPrice(searchParams.get('maxPrice') || '')
    setSortBy(searchParams.get('sort') || '')
  }, [searchParams])

  const applyFilters = () => {
    const params = new URLSearchParams(searchParams.toString())

    // Add or remove filters
    if (selectedCategory) {
      params.set('category', selectedCategory)
    } else {
      params.delete('category')
    }

    if (minPrice) {
      params.set('minPrice', minPrice)
    } else {
      params.delete('minPrice')
    }

    if (maxPrice) {
      params.set('maxPrice', maxPrice)
    } else {
      params.delete('maxPrice')
    }

    if (sortBy) {
      params.set('sort', sortBy)
    } else {
      params.delete('sort')
    }

    router.push(`/products?${params.toString()}`)
  }

  const clearFilters = () => {
    setSelectedCategory('')
    setMinPrice('')
    setMaxPrice('')
    setSortBy('')
    // Clear all params including tags
    router.push('/products')
  }

  const hasActiveFilters = selectedCategory || minPrice || maxPrice || sortBy

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Filter className="h-5 w-5 text-primary-600" />
          <h2 className="text-xl font-bold text-gray-900">Bộ Lọc</h2>
          {hasActiveFilters && (
            <span className="bg-primary-100 text-primary-600 px-2 py-1 rounded-full text-xs font-semibold">
              Đang lọc
            </span>
          )}
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="lg:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ChevronDown className={`h-5 w-5 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
        </button>
      </div>

      {/* Filters */}
      <div className={`space-y-6 ${!showFilters ? 'hidden lg:block' : ''}`}>
        {/* Category Filter */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Danh Mục
          </label>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full border-2 border-gray-300 rounded-lg px-4 py-2 text-gray-900 bg-white focus:border-primary-500 focus:ring-2 focus:ring-primary-200 transition-all outline-none"
          >
            <option value="" className="text-gray-900">Tất cả danh mục</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id} className="text-gray-900">
                {category.name}
              </option>
            ))}
          </select>
        </div>

        {/* Price Range Filter */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Khoảng Giá
          </label>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <input
                type="number"
                value={minPrice}
                onChange={(e) => setMinPrice(e.target.value)}
                placeholder="Từ"
                className="w-full border-2 border-gray-300 rounded-lg px-3 py-2 text-gray-900 bg-white placeholder-gray-400 focus:border-primary-500 focus:ring-2 focus:ring-primary-200 transition-all outline-none"
                min="0"
              />
            </div>
            <div>
              <input
                type="number"
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
                placeholder="Đến"
                className="w-full border-2 border-gray-300 rounded-lg px-3 py-2 text-gray-900 bg-white placeholder-gray-400 focus:border-primary-500 focus:ring-2 focus:ring-primary-200 transition-all outline-none"
                min="0"
              />
            </div>
          </div>
          <div className="mt-2 text-xs text-gray-500">
            Giá tính bằng VNĐ
          </div>
        </div>

        {/* Sort By */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Sắp Xếp Theo
          </label>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="w-full border-2 border-gray-300 rounded-lg px-4 py-2 text-gray-900 bg-white focus:border-primary-500 focus:ring-2 focus:ring-primary-200 transition-all outline-none"
          >
            <option value="" className="text-gray-900">Mặc định</option>
            <option value="price-asc" className="text-gray-900">Giá: Thấp đến Cao</option>
            <option value="price-desc" className="text-gray-900">Giá: Cao đến Thấp</option>
            <option value="name-asc" className="text-gray-900">Tên: A-Z</option>
            <option value="name-desc" className="text-gray-900">Tên: Z-A</option>
            <option value="newest" className="text-gray-900">Mới nhất</option>
          </select>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3 pt-4 border-t border-gray-200">
          <button
            onClick={applyFilters}
            className="w-full bg-primary-600 text-white py-3 rounded-lg hover:bg-primary-700 transition-colors font-semibold"
          >
            Áp Dụng Bộ Lọc
          </button>
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="w-full bg-white text-gray-700 py-3 rounded-lg border-2 border-gray-300 hover:bg-gray-50 transition-colors font-semibold flex items-center justify-center gap-2"
            >
              <X className="h-4 w-4" />
              Xóa Bộ Lọc
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
