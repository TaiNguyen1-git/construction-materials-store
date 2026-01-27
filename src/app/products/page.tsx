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

// Disable static generation for this page
export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store'

interface Product {
  id: string
  name: string
  price: number
  description: string
  sku: string
  images: string[]
  category: {
    id: string
    name: string
  }
  inventoryItem?: {
    availableQuantity: number
  }
}

interface Category {
  id: string
  name: string
  description: string
}

function ProductsPageContent() {
  const searchParams = useSearchParams()
  const { addItem } = useCartStore()

  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalProducts, setTotalProducts] = useState(0)
  const itemsPerPage = 12

  useEffect(() => {
    fetchProducts()
    fetchCategories()
  }, [searchParams, currentPage])

  const fetchProducts = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams(searchParams.toString())
      params.set('page', currentPage.toString())
      params.set('limit', itemsPerPage.toString())

      const response = await fetch(`/api/products?${params}`)
      if (response.ok) {
        const result = await response.json()
        console.log('API Response:', result) // Debug log
        if (result.success && result.data) {
          setProducts(result.data.data || [])
          setTotalPages(result.data.pagination?.totalPages || 1)
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

    addItem({
      id: product.id,
      productId: product.id,
      name: product.name,
      price: product.price,
      sku: product.sku,
      unit: 'pcs',
      image: product.images?.[0],
      maxStock: product.inventoryItem?.availableQuantity
    })

    toast.success('Đã thêm vào giỏ hàng!', {
      duration: 2000,
    })
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <Toaster position="top-right" />
      <Header />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb */}
        <div className="flex items-center mb-6">
          <Link href="/" className="text-gray-500 hover:text-primary-600 flex items-center">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Trang chủ
          </Link>
          <span className="mx-2 text-gray-500">/</span>
          <span className="text-gray-900 font-medium">Sản phẩm</span>
        </div>

        {/* Page Header with Search */}
        <div className="mb-8">
          <h1 className="text-4xl font-black text-gray-900 mb-4">
            🏗️ Vật Liệu Xây Dựng
          </h1>
          <p className="text-gray-600 mb-6 text-lg">
            Duyệt qua bộ sưu tập đầy đủ các vật liệu xây dựng chất lượng của chúng tôi
          </p>

          <div className="flex justify-center mb-6">
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
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-4 mb-6">
              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-semibold text-gray-700">
                    {loading ? 'Đang tải...' : `Hiển thị ${products.length} / ${totalProducts} sản phẩm`}
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setViewMode('grid')}
                      className={`p-2 rounded-lg transition-colors ${viewMode === 'grid'
                        ? 'bg-primary-600 text-white'
                        : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'}`}
                    >
                      <Grid className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => setViewMode('list')}
                      className={`p-2 rounded-lg transition-colors ${viewMode === 'list'
                        ? 'bg-primary-600 text-white'
                        : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'}`}
                    >
                      <List className="h-5 w-5" />
                    </button>
                  </div>
                </div>

                {searchParams.get('tags') && (
                  <div className="flex items-center gap-2 pt-3 border-t border-gray-50">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Thẻ đang lọc:</span>
                    <div className="flex flex-wrap gap-2">
                      {searchParams.get('tags')?.split(',').map(tag => (
                        <div key={tag} className="bg-blue-50 text-blue-600 px-3 py-1 rounded-full text-xs font-bold border border-blue-100 flex items-center gap-2">
                          {tag}
                          <Link
                            href={`/products?${(() => {
                              const p = new URLSearchParams(searchParams.toString());
                              const currentTags = p.get('tags')?.split(',') || [];
                              const newTags = currentTags.filter(t => t !== tag).join(',');
                              if (newTags) p.set('tags', newTags); else p.delete('tags');
                              return p.toString();
                            })()}`}
                            className="hover:text-red-500 transition-colors"
                          >
                            ×
                          </Link>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Products Grid/List */}
            {loading ? (
              <div className={`grid gap-4 ${viewMode === 'grid'
                ? 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5'
                : 'grid-cols-1'}`}>
                {[...Array(10)].map((_, i) => (
                  <div key={i} className="bg-white rounded-xl shadow-sm h-64 animate-pulse border border-gray-100"></div>
                ))}
              </div>
            ) : products.length > 0 ? (
              <div className={`grid gap-4 ${viewMode === 'grid'
                ? 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5'
                : 'grid-cols-1'}`}>
                {products.map((product) => (
                  <div key={product.id} className="bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-xl hover:border-primary-200 transition-all duration-300 overflow-hidden group">
                    {viewMode === 'grid' ? (
                      <>
                        <div className="relative aspect-[4/3] bg-gray-50 p-2 overflow-hidden group/img">
                          {product.images && product.images.length > 0 ? (
                            <Image
                              src={product.images[0]}
                              alt={product.name}
                              width={300}
                              height={225}
                              className="w-full h-full object-contain group-hover/img:scale-110 transition-transform duration-700"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-200">
                              <Package className="h-10 w-10" />
                            </div>
                          )}

                          {/* Top Actions */}
                          <div className="absolute top-2 right-2 z-10 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-[-10px] group-hover:translate-y-0">
                            <ComparisonButton product={product} size="sm" />
                            <WishlistButton product={product} size="sm" />
                          </div>

                          {/* Quick Add Overlay */}
                          <div className="absolute inset-x-0 bottom-0 p-2 translate-y-full group-hover/img:translate-y-0 transition-transform duration-300 z-20">
                            <button
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                addToCart(product);
                              }}
                              disabled={!product.inventoryItem?.availableQuantity || product.inventoryItem.availableQuantity <= 0}
                              className="w-full bg-slate-900/90 backdrop-blur-sm text-white py-2 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-blue-600 transition-all flex items-center justify-center gap-2 shadow-xl"
                            >
                              <ShoppingCart size={12} />
                              Thêm vào giỏ
                            </button>
                          </div>

                          {product.inventoryItem?.availableQuantity && product.inventoryItem.availableQuantity <= 10 && (
                            <div className="absolute top-2 left-2 bg-red-600 text-white px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-tighter shadow-sm z-10">
                              CÒN {product.inventoryItem.availableQuantity}
                            </div>
                          )}
                        </div>
                        <div className="p-4">
                          <div className="text-[9px] font-black text-blue-600 mb-1.5 uppercase tracking-tighter opacity-70 group-hover:opacity-100 transition-opacity">{product.category?.name}</div>
                          <Link href={`/products/${product.id}`}>
                            <h3 className="text-[11px] font-bold text-gray-900 mb-3 line-clamp-2 h-8 group-hover:text-blue-600 transition-colors leading-tight">
                              {product.name}
                            </h3>
                          </Link>
                          <div className="flex items-center justify-between pt-3 border-t border-slate-50">
                            <span className="text-sm font-black text-slate-900 tracking-tight">
                              {product.price?.toLocaleString()}<span className="text-[10px] ml-0.5 opacity-50 font-medium">₫</span>
                            </span>
                            <div className="w-1.5 h-1.5 rounded-full bg-slate-100 group-hover:bg-blue-400 transition-colors"></div>
                          </div>
                        </div>
                      </>
                    ) : (
                      <div className="flex p-6">
                        <div className="relative w-32 h-32 bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl mr-6 flex-shrink-0 overflow-hidden">
                          {product.images && product.images.length > 0 ? (
                            <Image
                              src={product.images[0]}
                              alt={product.name}
                              fill
                              loading="lazy"
                              className="object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Package className="h-8 w-8 text-gray-400" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <div className="text-sm font-semibold text-primary-600 mb-1">{product.category?.name}</div>
                              <h3 className="text-xl font-bold text-gray-900">{product.name}</h3>
                              <p className="text-gray-500 text-xs mb-2">SKU: {product.sku}</p>
                            </div>
                            <div className="text-right">
                              <div className="text-2xl font-black text-primary-600 mb-1">
                                {product.price?.toLocaleString()}đ
                              </div>
                              <div className={`text-sm font-semibold ${(product.inventoryItem?.availableQuantity || 0) > 0
                                ? 'text-green-600'
                                : 'text-red-600'
                                }`}>
                                {(product.inventoryItem?.availableQuantity || 0) > 0
                                  ? `Kho: ${product.inventoryItem?.availableQuantity}`
                                  : 'Hết hàng'}
                              </div>
                            </div>
                          </div>
                          <p className="text-gray-600 mb-4 line-clamp-2">{product.description}</p>
                          <div className="flex gap-2">
                            <Link
                              href={`/products/${product.id}`}
                              className="bg-primary-600 text-white px-6 py-2 rounded-xl hover:bg-primary-700 text-sm font-bold transition-colors"
                            >
                              Xem Chi Tiết
                            </Link>
                            <button
                              onClick={() => addToCart(product)}
                              disabled={!product.inventoryItem?.availableQuantity || product.inventoryItem.availableQuantity <= 0}
                              className="px-6 py-2 border-2 border-primary-600 text-primary-600 rounded-xl hover:bg-primary-50 text-sm font-bold inline-flex items-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              <ShoppingCart className="h-4 w-4 mr-2" />
                              Thêm Vào Giỏ
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
                <Package className="h-24 w-24 text-gray-300 mx-auto mb-6" />
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Không tìm thấy sản phẩm</h3>
                <p className="text-gray-600 mb-6">Thử điều chỉnh tìm kiếm hoặc tiêu chí lọc của bạn</p>
                <Link
                  href="/products"
                  className="inline-block bg-primary-600 text-white px-6 py-3 rounded-xl hover:bg-primary-700 font-bold transition-colors"
                >
                  Xem Tất Cả Sản Phẩm
                </Link>
              </div>
            )}

            {/* Pagination */}
            {!loading && totalPages > 1 && (
              <div className="mt-8 flex justify-center">
                <div className="bg-white rounded-xl shadow-lg p-2 flex items-center space-x-1">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="px-4 py-2 text-sm font-semibold text-gray-600 hover:text-primary-600 rounded-lg hover:bg-primary-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    ← Trước
                  </button>

                  {[...Array(Math.min(totalPages, 7))].map((_, i) => {
                    let page
                    if (totalPages <= 7) {
                      page = i + 1
                    } else if (currentPage <= 4) {
                      page = i + 1
                    } else if (currentPage >= totalPages - 3) {
                      page = totalPages - 6 + i
                    } else {
                      page = currentPage - 3 + i
                    }

                    if (page > totalPages || page < 1) return null

                    return (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`px-4 py-2 text-sm font-bold rounded-lg transition-colors ${currentPage === page
                          ? 'bg-primary-600 text-white shadow-md'
                          : 'text-gray-700 hover:bg-gray-100'
                          }`}
                      >
                        {page}
                      </button>
                    )
                  })}

                  <button
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="px-4 py-2 text-sm font-semibold text-gray-600 hover:text-primary-600 rounded-lg hover:bg-primary-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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
