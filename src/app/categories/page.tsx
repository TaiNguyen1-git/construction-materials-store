'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Package, Grid3X3, List, Search, ArrowRight, ChevronRight, HardHat, Hammer, Paintbrush, Ruler } from 'lucide-react'
import Header from '@/components/Header'

interface Category {
  id: string
  name: string
  description?: string
  productCount?: number
  totalProducts?: number
  _count?: {
    products: number
  }
  image?: string
  subcategories?: Category[]
  children?: Category[]
  isActive?: boolean
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    fetchCategories()
  }, [])

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/categories')
      if (response.ok) {
        const data = await response.json()
        const categoriesData = data.data || []

        // Map API response to match frontend interface
        const mappedCategories = categoriesData
          .filter((cat: Category) => cat.isActive !== false) // Only show active categories
          .map((cat: Category) => ({
            id: cat.id,
            name: cat.name,
            description: cat.description || '',
            productCount: cat.totalProducts ?? (cat._count?.products || 0),
            children: cat.children || [],
            isActive: cat.isActive,
            image: cat.image
          }))

        setCategories(mappedCategories)
      } else {
        setCategories([])
      }
    } catch (error) {
      console.error('Failed to fetch categories:', error)
      setCategories([])
    } finally {
      setLoading(false)
    }
  }

  const filteredCategories = categories.filter(cat =>
    cat.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    cat.description?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="min-h-screen bg-neutral-50">
      <Header />

      {/* Modern Hero Section */}
      <section className="relative py-20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary-900 via-primary-800 to-secondary-900"></div>
        <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]"></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-blue-200 text-sm font-medium mb-6 animate-fade-in">
            <Package className="w-4 h-4" />
            Vật liệu xây dựng cao cấp
          </div>
          <h1 className="text-4xl md:text-6xl font-black text-white mb-6 tracking-tight animate-fade-in-up">
            Hệ Thống <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-300">Danh Mục</span>
          </h1>
          <p className="text-xl text-blue-100/80 max-w-2xl mx-auto mb-10 animate-fade-in-up delay-100">
            Khám phá hàng ngàn sản phẩm vật liệu xây dựng chất lượng cao, từ thô đến hoàn thiện, đáp ứng mọi quy mô công trình.
          </p>

          <div className="max-w-2xl mx-auto relative group animate-fade-in-up delay-200">
            <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Tìm kiếm danh mục..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-4 bg-white/95 backdrop-blur-sm border-none rounded-2xl shadow-2xl focus:ring-2 focus:ring-blue-500 transition-all text-gray-900 placeholder:text-gray-400"
            />
          </div>
        </div>
      </section>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8 pb-20 relative z-20">
        {/* Controls */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-8 bg-white/80 backdrop-blur-md p-4 rounded-2xl shadow-lg border border-white/20">
          <div className="flex items-center gap-4">
            <span className="text-sm font-semibold text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
              {filteredCategories.length} Danh mục tìm thấy
            </span>
          </div>

          <div className="flex items-center bg-gray-100 p-1 rounded-xl">
            <button
              onClick={() => setViewMode('grid')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${viewMode === 'grid'
                  ? 'bg-white text-primary-600 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
                }`}
            >
              <Grid3X3 className="h-4 w-4" />
              <span className="text-sm font-bold">Lưới</span>
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${viewMode === 'list'
                  ? 'bg-white text-primary-600 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
                }`}
            >
              <List className="h-4 w-4" />
              <span className="text-sm font-bold">Danh sách</span>
            </button>
          </div>
        </div>

        {loading ? (
          <div className={`grid gap-8 ${viewMode === 'grid' ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'}`}>
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-white rounded-3xl overflow-hidden shadow-sm border border-gray-100 p-6">
                <div className="aspect-[4/3] bg-gray-100 rounded-2xl mb-4 animate-pulse"></div>
                <div className="h-6 bg-gray-100 rounded-full w-2/3 mb-4 animate-pulse"></div>
                <div className="h-4 bg-gray-100 rounded-full w-full mb-2 animate-pulse"></div>
                <div className="h-4 bg-gray-100 rounded-full w-1/2 animate-pulse"></div>
              </div>
            ))}
          </div>
        ) : filteredCategories.length > 0 ? (
          <div className={`grid gap-8 ${viewMode === 'grid' ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'}`}>
            {filteredCategories.map((category) => (
              <Link
                key={category.id}
                href={`/products?category=${category.id}`}
                className={`group bg-white rounded-3xl overflow-hidden border border-gray-100 hover:border-primary-200 transition-all duration-500 shadow-sm hover:shadow-2xl hover:-translate-y-2 flex ${viewMode === 'list' ? 'flex-row items-center h-48' : 'flex-col'
                  }`}
              >
                <div className={`relative overflow-hidden ${viewMode === 'list' ? 'w-1/3 h-full' : 'aspect-[16/10]'
                  }`}>
                  {category.image ? (
                    <img
                      src={category.image}
                      alt={category.name}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-primary-50 to-secondary-50 flex items-center justify-center">
                      <Package className="h-16 w-16 text-primary-200 group-hover:rotate-12 transition-transform duration-500" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/20 group-hover:bg-black/0 transition-colors duration-500" />
                  <div className="absolute top-4 left-4">
                    <span className="bg-white/90 backdrop-blur-md text-primary-600 px-3 py-1 rounded-full text-xs font-black shadow-lg">
                      {category.productCount || 0} SẢN PHẨM
                    </span>
                  </div>
                </div>

                <div className={`p-8 flex-1 flex flex-col justify-between ${viewMode === 'list' ? 'h-full' : ''}`}>
                  <div>
                    <h3 className="text-2xl font-black text-gray-900 group-hover:text-primary-600 transition-colors mb-3">
                      {category.name}
                    </h3>
                    <p className="text-gray-500 text-sm leading-relaxed line-clamp-2">
                      {category.description || `Xem bộ sưu tập sản phẩm trong danh mục ${category.name} của chúng tôi.`}
                    </p>
                  </div>

                  <div className="mt-6 flex items-center justify-between">
                    <div className="flex -space-x-2">
                      {/* Sub-category badges/indicators */}
                      {category.children?.slice(0, 3).map((child, idx) => (
                        <div key={child.id} className="w-8 h-8 rounded-full bg-gray-50 border-2 border-white flex items-center justify-center text-[10px] font-bold text-gray-400" title={child.name}>
                          {child.name.charAt(0)}
                        </div>
                      ))}
                      {(category.children?.length ?? 0) > 3 && (
                        <div className="w-8 h-8 rounded-full bg-primary-50 border-2 border-white flex items-center justify-center text-[10px] font-bold text-primary-600">
                          +{(category.children?.length ?? 0) - 3}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-1 text-primary-600 font-black text-sm group-hover:gap-2 transition-all">
                      XEM NGAY
                      <ArrowRight className="w-4 h-4" />
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-white rounded-3xl border-2 border-dashed border-gray-200">
            <Package className="h-20 w-20 text-gray-200 mx-auto mb-6" />
            <h3 className="text-2xl font-black text-gray-900 mb-2">Không tìm thấy danh mục</h3>
            <p className="text-gray-500 mb-8 max-w-sm mx-auto">
              Thử tìm kiếm với từ khóa khác hoặc quay lại xem toàn bộ sản phẩm của chúng tôi.
            </p>
            <Link
              href="/products"
              className="inline-flex items-center gap-2 px-8 py-4 bg-primary-600 text-white rounded-2xl font-bold hover:bg-primary-700 transition-all shadow-xl hover:shadow-primary-600/20"
            >
              Xem tất cả sản phẩm
              <ChevronRight className="w-5 h-5" />
            </Link>
          </div>
        )}

        {/* Categories by Use Case */}
        <div className="mt-20">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-black text-gray-900 mb-4">Danh mục theo hạng mục công trình</h2>
            <div className="h-1.5 w-20 bg-primary-600 mx-auto rounded-full"></div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 hover:border-orange-200 transition-all group">
              <div className="w-14 h-14 bg-orange-100 rounded-2xl flex items-center justify-center text-orange-600 mb-6 group-hover:rotate-12 transition-transform">
                <HardHat className="w-8 h-8" />
              </div>
              <h4 className="text-lg font-black text-gray-900 mb-2">Vật liệu thô</h4>
              <p className="text-sm text-gray-500 mb-4">Cốt thép, xi măng, gạch xây, cát đá sỏi...</p>
              <Link href="/products?category=raw" className="text-orange-600 font-black text-sm hover:underline flex items-center gap-1">
                Xem thêm <ArrowRight className="w-3 h-3" />
              </Link>
            </div>

            <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 hover:border-blue-200 transition-all group">
              <div className="w-14 h-14 bg-blue-100 rounded-2xl flex items-center justify-center text-blue-600 mb-6 group-hover:rotate-12 transition-transform">
                <Paintbrush className="w-8 h-8" />
              </div>
              <h4 className="text-lg font-black text-gray-900 mb-2">Vật liệu hoàn thiện</h4>
              <p className="text-sm text-gray-500 mb-4">Sơn nước, gạch ốp lát, trần thạch cao...</p>
              <Link href="/products?category=finish" className="text-blue-600 font-black text-sm hover:underline flex items-center gap-1">
                Xem thêm <ArrowRight className="w-3 h-3" />
              </Link>
            </div>

            <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 hover:border-green-200 transition-all group">
              <div className="w-14 h-14 bg-green-100 rounded-2xl flex items-center justify-center text-green-600 mb-6 group-hover:rotate-12 transition-transform">
                <Hammer className="w-8 h-8" />
              </div>
              <h4 className="text-lg font-black text-gray-900 mb-2">Điện - Nước</h4>
              <p className="text-sm text-gray-500 mb-4">Ống nước, thiết bị vệ sinh, bồn nước...</p>
              <Link href="/products?category=mep" className="text-green-600 font-black text-sm hover:underline flex items-center gap-1">
                Xem thêm <ArrowRight className="w-3 h-3" />
              </Link>
            </div>

            <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 hover:border-purple-200 transition-all group">
              <div className="w-14 h-14 bg-purple-100 rounded-2xl flex items-center justify-center text-purple-600 mb-6 group-hover:rotate-12 transition-transform">
                <Ruler className="w-8 h-8" />
              </div>
              <h4 className="text-lg font-black text-gray-900 mb-2">Kiến trúc - NT</h4>
              <p className="text-sm text-gray-500 mb-4">Sàn gỗ, tấm trang trí, lam gỗ, vật liệu mới...</p>
              <Link href="/products?category=deco" className="text-purple-600 font-black text-sm hover:underline flex items-center gap-1">
                Xem thêm <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          </div>
        </div>
      </main>

      {/* Modern Newsletter/CTA */}
      <section className="bg-white border-t border-gray-100 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-gradient-to-r from-primary-600 to-secondary-600 rounded-[3rem] p-12 relative overflow-hidden">
            <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 bg-white/10 rounded-full blur-3xl"></div>
            <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-80 h-80 bg-white/10 rounded-full blur-3xl"></div>

            <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
              <div className="text-center md:text-left">
                <h3 className="text-3xl font-black text-white mb-4">Không tìm thấy vật liệu bạn cần?</h3>
                <p className="text-blue-100 text-lg">Gửi yêu cầu ngay, chúng tôi sẽ tìm kiếm nhà cung cấp phù hợp nhất cho bạn.</p>
              </div>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link href="/contact" className="px-8 py-4 bg-white text-primary-600 rounded-full font-bold hover:scale-105 transition-all shadow-xl text-center">
                  Gửi yêu cầu báo giá
                </Link>
                <Link href="/estimator" className="px-8 py-4 bg-primary-700/50 backdrop-blur-md text-white border border-white/20 rounded-full font-bold hover:bg-primary-700 transition-all text-center">
                  Dùng thử AI Dự toán
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}