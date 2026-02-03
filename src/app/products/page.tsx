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

  const [allProducts, setAllProducts] = useState<Product[]>([]) // All products for local filtering
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]) // Results after filter/search
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [localQuery, setLocalQuery] = useState(searchParams.get('q') || '')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 12

  // Fetch everything once on mount (or major changes)
  useEffect(() => {
    fetchAllProducts()
    fetchCategories()
  }, [])

  // Sync local query with URL
  useEffect(() => {
    setLocalQuery(searchParams.get('q') || '')
  }, [searchParams])

  // Handle local filtering logic
  useEffect(() => {
    let result = [...allProducts]

    // 1. Search Query
    if (localQuery.trim()) {
      const q = localQuery.toLowerCase().trim()
      result = result.filter(p =>
        p.name.toLowerCase().includes(q) ||
        p.description?.toLowerCase().includes(q) ||
        p.sku?.toLowerCase().includes(q) ||
        p.category?.name.toLowerCase().includes(q)
      )
    }

    // 2. Category Filter
    const catId = searchParams.get('category')
    if (catId) {
      result = result.filter(p => p.category?.id === catId)
    }

    // 3. Price Filter
    const minP = searchParams.get('minPrice')
    const maxP = searchParams.get('maxPrice')
    if (minP) result = result.filter(p => p.price >= parseFloat(minP))
    if (maxP) result = result.filter(p => p.price <= parseFloat(maxP))

    // 4. Sorting
    const sort = searchParams.get('sort')
    if (sort === 'price-asc') result.sort((a, b) => a.price - b.price)
    else if (sort === 'price-desc') result.sort((a, b) => b.price - a.price)
    else if (sort === 'name-asc') result.sort((a, b) => a.name.localeCompare(b.name))
    else if (sort === 'name-desc') result.sort((a, b) => b.name.localeCompare(a.name))
    else if (sort === 'newest') result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

    setFilteredProducts(result)
    setCurrentPage(1) // Reset to first page on filter change
  }, [allProducts, localQuery, searchParams])

  const fetchAllProducts = async () => {
    try {
      setLoading(true)
      // Fetch a large batch since catalog is small
      const response = await fetch(`/api/products?limit=1000&isActive=true`)
      if (response.ok) {
        const result = await response.json()
        if (result.success && result.data) {
          setAllProducts(result.data.data || [])
        }
      }
    } catch (error) {
      console.error('Failed to fetch products:', error)
      toast.error('Không thể tải sản phẩm')
    } finally {
      setLoading(false)
    }
  }

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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <Toaster position="top-right" />
      <Header />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 pb-32">
        {/* Breadcrumb */}
        <div className="flex items-center mb-10 overflow-x-auto whitespace-nowrap pb-2 scrollbar-none">
          <Link href="/" className="text-slate-400 hover:text-indigo-600 flex items-center font-black text-[10px] uppercase tracking-widest bg-white px-4 py-2 rounded-xl shadow-sm border border-slate-50 transition-all">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Trang chủ
          </Link>
          <span className="mx-4 text-slate-300">/</span>
          <span className="text-slate-900 font-black text-[10px] uppercase tracking-widest">Tất cả sản phẩm</span>
        </div>

        {/* Page Header with Search */}
        <div className="mb-12">
          <h1 className="text-5xl font-black text-slate-900 mb-4 tracking-tighter uppercase italic leading-none">
            🏗️ Vật liệu <span className="text-indigo-600 font-black">xây dựng</span>
          </h1>
          <div className="max-w-3xl">
            <SearchBar />
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Filters Sidebar */}
          <div className="w-full lg:w-80 flex-shrink-0">
            <ProductFilters categories={categories} />
          </div>

          {/* Products Content */}
          <div className="flex-1">
            {/* View Controls & Active Tags */}
            <div className="bg-white rounded-[2rem] shadow-[0_20px_50px_rgba(0,0,0,0.03)] border border-slate-50 p-6 mb-8 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50/30 rounded-full blur-3xl -mr-10 -mt-10 group-hover:scale-110 transition-transform"></div>
              <div className="flex flex-col gap-4 relative z-10">
                <div className="flex items-center justify-between">
                  <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none flex items-center gap-2">
                    {loading ? (
                      'Đang tải...'
                    ) : (
                      <>
                        {localQuery && (
                          <span className="text-indigo-600">Kết quả cho "{localQuery}":</span>
                        )}
                        Hiển thị {filteredProducts.length} sản phẩm
                      </>
                    )}
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setViewMode('grid')}
                      className={`p-2.5 rounded-xl transition-all ${viewMode === 'grid'
                        ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-100'
                        : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'}`}
                    >
                      <Grid className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => setViewMode('list')}
                      className={`p-2.5 rounded-xl transition-all ${viewMode === 'list'
                        ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-100'
                        : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'}`}
                    >
                      <List className="h-5 w-5" />
                    </button>
                  </div>
                </div>

                {searchParams.get('q') && (
                  <div className="flex items-center gap-4 pt-3 border-t border-gray-50">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Từ khóa tìm kiếm:</span>
                    <div className="flex items-center gap-2">
                      <div className="bg-indigo-50 text-indigo-600 px-3 py-1 rounded-full text-xs font-bold border border-indigo-100 flex items-center gap-2">
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
                  </div>
                )}
              </div>
            </div>



            {/* Products Grid/List */}
            {loading ? (
              <div className={`grid gap-6 ${viewMode === 'grid'
                ? 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5'
                : 'grid-cols-1'}`}>
                {[...Array(12)].map((_, i) => (
                  <div key={i} className="bg-white rounded-[2rem] shadow-sm h-[400px] animate-pulse border border-slate-100"></div>
                ))}
              </div>
            ) : filteredProducts.length > 0 ? (
              <div className={`grid gap-8 transition-all duration-500 ${viewMode === 'grid'
                ? 'grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
                : 'grid-cols-1'}`}>
                {filteredProducts
                  .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
                  .map((product) => (
                    <ProductCard key={product.id} product={product as any} viewMode={viewMode} />
                  ))}
              </div>
            ) : (
              <div className="bg-white rounded-[2.5rem] shadow-xl p-20 text-center border border-slate-50">
                <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-8 text-slate-200">
                  <Package className="h-12 w-12" />
                </div>
                <h3 className="text-2xl font-black text-slate-900 mb-2 uppercase tracking-tight italic">Không tìm thấy sản phẩm</h3>
                <p className="text-slate-500 mb-10 font-medium">Thử điều chỉnh tìm kiếm hoặc tiêu chí lọc của bạn</p>
                <Link
                  href="/products"
                  className="inline-block bg-indigo-600 text-white px-10 py-5 rounded-2xl hover:bg-indigo-700 font-black text-xs uppercase tracking-[0.2em] transition-all shadow-2xl shadow-indigo-100 active:scale-95"
                >
                  Xem Tất Cả Sản Phẩm
                </Link>
              </div>
            )}

            {/* Pagination */}
            {!loading && filteredProducts.length > itemsPerPage && (
              <div className="mt-16 flex justify-center">
                <div className="bg-white rounded-2xl shadow-xl p-2.5 flex items-center space-x-1 border border-slate-50">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="px-5 py-3 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-indigo-600 rounded-xl hover:bg-indigo-50/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    ← Trước
                  </button>

                  {[...Array(Math.ceil(filteredProducts.length / itemsPerPage))].map((_, i) => (
                    <button
                      key={i + 1}
                      onClick={() => setCurrentPage(i + 1)}
                      className={`w-12 h-12 text-[11px] font-black rounded-xl transition-all ${currentPage === i + 1
                        ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-100'
                        : 'text-slate-600 hover:bg-slate-50 font-bold'
                        }`}
                    >
                      {i + 1}
                    </button>
                  ))}

                  <button
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, Math.ceil(filteredProducts.length / itemsPerPage)))}
                    disabled={currentPage === Math.ceil(filteredProducts.length / itemsPerPage)}
                    className="px-5 py-3 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-indigo-600 rounded-xl hover:bg-indigo-50/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
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
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <Header />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary-600 mx-auto"></div>
          <p className="text-gray-600 mt-4">Đang tải sản phẩm...</p>
        </div>
      </div>
    }>
      <ProductsPageContent />
    </Suspense>
  )
}
