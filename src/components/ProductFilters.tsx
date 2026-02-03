'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Filter, X, ChevronDown, ArrowRight } from 'lucide-react'

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
    <div className="bg-white rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.03)] p-8 border border-slate-50 sticky top-24">
      {/* Header */}
      <div className="flex items-center justify-between mb-10 pb-6 border-b border-slate-50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600">
            <Filter className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-sm font-black text-slate-900 uppercase tracking-widest leading-none mb-1">Bộ Lọc</h2>
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">Tối ưu tìm kiếm</p>
          </div>
        </div>
        {hasActiveFilters && (
          <div className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse"></div>
        )}
      </div>

      {/* Filters */}
      <div className={`space-y-8 ${!showFilters ? 'hidden lg:block' : ''}`}>
        {/* Category Filter */}
        <div>
          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3 ml-1">
            Danh Mục
          </label>
          <div className="relative group">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full appearance-none bg-slate-50/50 border border-slate-100 rounded-2xl px-5 py-3.5 text-sm font-bold text-slate-900 focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/5 transition-all outline-none cursor-pointer"
            >
              <option value="">Tất cả danh mục</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none group-hover:text-indigo-500 transition-colors" />
          </div>
        </div>

        {/* Price Range Filter */}
        <div>
          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3 ml-1">
            Khoảng Giá (VND)
          </label>
          <div className="flex items-center gap-3">
            <div className="flex-1">
              <input
                type="number"
                value={minPrice}
                onChange={(e) => setMinPrice(e.target.value)}
                placeholder="Từ"
                className="w-full bg-slate-50/50 border border-slate-100 rounded-2xl px-4 py-3.5 text-sm font-bold text-slate-900 placeholder-slate-300 focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/5 transition-all outline-none"
                min="0"
              />
            </div>
            <div className="h-[1px] w-4 bg-slate-200"></div>
            <div className="flex-1">
              <input
                type="number"
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
                placeholder="Đến"
                className="w-full bg-slate-50/50 border border-slate-100 rounded-2xl px-4 py-3.5 text-sm font-bold text-slate-900 placeholder-slate-300 focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/5 transition-all outline-none"
                min="0"
              />
            </div>
          </div>
        </div>

        {/* Sort By */}
        <div>
          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3 ml-1">
            Sắp Xếp Theo
          </label>
          <div className="relative group">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full appearance-none bg-slate-50/50 border border-slate-100 rounded-2xl px-5 py-3.5 text-sm font-bold text-slate-900 focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/5 transition-all outline-none cursor-pointer"
            >
              <option value="">Mặc định</option>
              <option value="price-asc">Giá: Thấp đến Cao</option>
              <option value="price-desc">Giá: Cao đến Thấp</option>
              <option value="name-asc">Tên: A-Z</option>
              <option value="name-desc">Tên: Z-A</option>
              <option value="newest">Mới nhất</option>
            </select>
            <ChevronDown className="absolute right-5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none group-hover:text-indigo-500 transition-colors" />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3 pt-6">
          <button
            onClick={applyFilters}
            className="w-full bg-white text-indigo-600 border border-indigo-100 py-4 rounded-2xl hover:bg-indigo-50 transition-all font-black text-[11px] uppercase tracking-[0.2em] shadow-xl shadow-indigo-100/20 active:scale-95 flex items-center justify-center gap-2 group"
          >
            ÁP DỤNG BỘ LỌC
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </button>
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="w-full bg-white text-rose-500 py-4 rounded-2xl border border-rose-100 hover:bg-rose-50 transition-all font-black text-[11px] uppercase tracking-[0.2em] flex items-center justify-center gap-2"
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
