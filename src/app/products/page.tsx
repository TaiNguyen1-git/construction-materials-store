'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { Package, Grid, List, ShoppingCart, ArrowLeft } from 'lucide-react'
import Header from '@/components/Header'
import SearchBar from '@/components/SearchBar'
import ProductFilters from '@/components/ProductFilters'
import WishlistButton from '@/components/WishlistButton'
import ComparisonButton from '@/components/ComparisonButton'
import ComparisonBar from '@/components/ComparisonBar'
import SmartNudge from '@/components/SmartNudge'
import { useCartStore } from '@/stores/cartStore'
import toast, { Toaster } from 'react-hot-toast'
import ProductCard from '@/components/marketplace/ProductCard'


// Disable static generation for this page
export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store'

import { getUnitFromProductName } from '@/lib/unit-utils'
import { useRouter } from 'next/navigation'

interface Product {
  id: string
  name: string
  price: number
  description: string
  sku: string
  unit?: string
  images: string[]
  category: {
    id: string
    name: string
  }
  inventoryItem?: {
    availableQuantity: number
  }
  createdAt: string
}

interface Category {
  id: string
  name: string
  description: string
}

function ProductsPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { addItem } = useCartStore()

  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]) // Results after filter/search
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [localQuery, setLocalQuery] = useState(searchParams.get('q') || '')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalProducts, setTotalProducts] = useState(0)
  const itemsPerPage = 12

  // Fetch categories once on mount
  useEffect(() => {
    fetchCategories()
  }, [])

  // Sync local query with URL and reset page
  useEffect(() => {
    setLocalQuery(searchParams.get('q') || '')
    setCurrentPage(1)
  }, [searchParams])

  // Handle server-side fetching logic
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true)

        const params = new URLSearchParams()
        params.append('limit', itemsPerPage.toString())
        params.append('page', currentPage.toString())
        params.append('isActive', 'true')

        const q = searchParams.get('q')
        if (q) params.append('q', q)

        const category = searchParams.get('category')
        if (category) params.append('category', category)

        const minPrice = searchParams.get('minPrice')
        if (minPrice) params.append('minPrice', minPrice)

        const maxPrice = searchParams.get('maxPrice')
        if (maxPrice) params.append('maxPrice', maxPrice)

        const sort = searchParams.get('sort')
        if (sort) params.append('sort', sort)

        const response = await fetch(`/api/products?${params.toString()}`)
        if (response.ok) {
          const result = await response.json()
          if (result.success && result.data) {
            setFilteredProducts(result.data.data || [])
            setTotalProducts(result.data.pagination?.total || 0)
          }
        }
      } catch (error) {
        console.error('Failed to fetch products:', error)
        toast.error('Không thể tải sản phẩm')
      } finally {
        setLoading(false)
      }
    }
    fetchProducts()
  }, [searchParams, currentPage])

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/categories')
      if (response.ok) {
        const data = await response.json()
        setCategories(data.data || [])
      }
    } catch (error) {
      console.error('Failed to fetch categories:', error)
    }
  }

  const addToCart = (product: Product) => {
    if (!product.inventoryItem?.availableQuantity || product.inventoryItem.availableQuantity <= 0) {
      toast.error('Sản phẩm đã hết hàng!')
      return
    }

    // Determine the unit: DB value -> Guess from name -> Default pcs
    const dynamicUnit = product.unit && product.unit !== 'pcs'
      ? product.unit
      : getUnitFromProductName(product.name)

    addItem({
      id: product.id,
      productId: product.id,
      name: product.name,
      price: product.price,
      sku: product.sku,
      unit: dynamicUnit,
      image: product.images?.[0],
      maxStock: product.inventoryItem?.availableQuantity
    })

    toast.success(`Đã thêm vào giỏ hàng (${dynamicUnit})`, {
      duration: 2000,
    })
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      <Toaster position="top-right" />
      <Header />

      {/* Page Header Banner */}
      <div className="bg-primary-600 relative overflow-hidden">
        <div className="absolute inset-0 opacity-5" style={{backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)', backgroundSize: '24px 24px'}} />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 relative z-10">
          <div className="flex items-center gap-2 mb-4">
            <Link href="/" className="text-primary-200 hover:text-white text-xs font-semibold flex items-center gap-1 transition-colors">
              <ArrowLeft className="h-3 w-3" /> Trang chủ
            </Link>
            <span className="text-primary-400 text-xs">/</span>
            <span className="text-white text-xs font-semibold">Sản phẩm</span>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">Vật liệu xây dựng</h1>
          <p className="text-primary-200 text-sm font-medium mb-6">Khám phá hàng ngàn sản phẩm chất lượng cho công trình của bạn</p>
          <div className="max-w-2xl">
            <SearchBar />
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-32">

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Filters Sidebar */}
          <div className="w-full lg:w-80 flex-shrink-0">
            <ProductFilters categories={categories} />
          </div>

          {/* Products Content */}
          <div className="flex-1">
            {/* View Controls & Active Tags */}
            <div className="bg-white rounded-2xl border border-neutral-200 p-5 mb-6 shadow-sm">
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-semibold text-neutral-400 uppercase tracking-widest">
                    {loading ? (
                      'Đang tải...'
                    ) : (
                      <>
                        {localQuery && (
                          <span className="text-primary-600">Kết quả cho "{localQuery}" · </span>
                        )}
                        <span className="text-neutral-600 font-bold">{totalProducts}</span> sản phẩm
                      </>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => setViewMode('grid')}
                      className={`p-2.5 rounded-xl transition-all ${viewMode === 'grid'
                        ? 'bg-primary-600 text-white shadow-sm shadow-primary-200'
                        : 'text-neutral-400 hover:text-neutral-600 hover:bg-neutral-50'}`}
                    >
                      <Grid className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => setViewMode('list')}
                      className={`p-2.5 rounded-xl transition-all ${viewMode === 'list'
                        ? 'bg-primary-600 text-white shadow-sm shadow-primary-200'
                        : 'text-neutral-400 hover:text-neutral-600 hover:bg-neutral-50'}`}
                    >
                      <List className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {searchParams.get('q') && (
                  <div className="flex items-center gap-3 pt-3 border-t border-neutral-100">
                    <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Tìm kiếm:</span>
                    <div className="bg-primary-50 text-primary-600 px-3 py-1 rounded-full text-xs font-bold border border-primary-100 flex items-center gap-2">
                      {searchParams.get('q')}
                      <button
                        onClick={() => {
                          const params = new URLSearchParams(searchParams.toString())
                          params.delete('q')
                          router.push(`/products?${params.toString()}`)
                        }}
                        className="hover:text-red-500 transition-colors"
                      >
                        ×
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>



            {/* Products Grid/List */}
            {loading ? (
              <div className={`grid gap-5 ${viewMode === 'grid'
                ? 'grid-cols-2 md:grid-cols-3 xl:grid-cols-4'
                : 'grid-cols-1'}`}>
                {[...Array(12)].map((_, i) => (
                  <div key={i} className="bg-white rounded-2xl h-[340px] animate-pulse border border-neutral-100"></div>
                ))}
              </div>
            ) : filteredProducts.length > 0 ? (
              <div className={`grid gap-5 transition-all duration-500 ${viewMode === 'grid'
                ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
                : 'grid-cols-1'}`}>
                {filteredProducts.map((product) => (
                  <ProductCard key={product.id} product={product as any} viewMode={viewMode} />
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-2xl p-20 text-center border border-neutral-200 shadow-sm">
                <div className="w-20 h-20 bg-neutral-50 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Package className="h-10 w-10 text-neutral-200" />
                </div>
                <h3 className="text-xl font-bold text-neutral-900 mb-2">Không tìm thấy sản phẩm</h3>
                <p className="text-neutral-500 text-sm mb-8">Thử điều chỉnh tìm kiếm hoặc bộ lọc của bạn</p>
                <Link
                  href="/products"
                  className="inline-flex items-center gap-2 bg-primary-600 text-white px-8 py-3.5 rounded-xl hover:bg-primary-700 font-bold text-sm transition-all shadow-sm shadow-primary-100 active:scale-[0.98]"
                >
                  Xem tất cả sản phẩm
                </Link>
              </div>
            )}

            {/* Pagination */}
            {!loading && totalProducts > itemsPerPage && (
              <div className="mt-12 flex justify-center">
                <div className="bg-white rounded-2xl shadow-sm p-2 flex items-center gap-1 border border-neutral-200">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="px-4 py-2.5 text-xs font-bold text-neutral-500 hover:text-primary-600 rounded-xl hover:bg-primary-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                  >
                    ← Trước
                  </button>

                  {[...Array(Math.min(10, Math.ceil(totalProducts / itemsPerPage)))].map((_, i) => (
                    <button
                      key={i + 1}
                      onClick={() => setCurrentPage(i + 1)}
                      className={`w-10 h-10 text-xs font-bold rounded-xl transition-all ${
                        currentPage === i + 1
                        ? 'bg-primary-600 text-white shadow-sm shadow-primary-200'
                        : 'text-neutral-600 hover:bg-neutral-50'
                      }`}
                    >
                      {i + 1}
                    </button>
                  ))}

                  <button
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, Math.ceil(totalProducts / itemsPerPage)))}
                    disabled={currentPage === Math.ceil(totalProducts / itemsPerPage)}
                    className="px-4 py-2.5 text-xs font-bold text-neutral-500 hover:text-primary-600 rounded-xl hover:bg-primary-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                  >
                    Sau →
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Comparison Bar */}
      <ComparisonBar />

      {/* Smart AI Nudge */}
      <SmartNudge
        pageType="products"
        contextData={{
          category: searchParams.get('category') || undefined,
          searchQuery: searchParams.get('search') || undefined
        }}
      />
    </div>
  )
}

export default function ProductsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-neutral-50">
        <Header />
        <div className="bg-primary-600 h-44" />
        <div className="max-w-7xl mx-auto px-4 py-20 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="text-neutral-500 text-sm mt-4 font-medium">Đang tải sản phẩm...</p>
        </div>
      </div>
    }>
      <ProductsPageContent />
    </Suspense>
  )
}
