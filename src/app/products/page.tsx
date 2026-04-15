import Header from '@/components/Header'
import Link from 'next/link'
import { Package, ArrowLeft, Filter } from 'lucide-react'
import SearchBar from '@/components/SearchBar'
import ProductFilters from '@/components/ProductFilters'
import ComparisonBar from '@/components/ComparisonBar'
import SmartNudge from '@/components/SmartNudge'
import ProductCard from '@/components/marketplace/ProductCard'
import { Toaster } from 'react-hot-toast'
import { getProducts, getCategories } from '@/lib/products'

// Components
import ProductViewControls from './components/ProductViewControls'
import ProductPagination from './components/ProductPagination'

export const revalidate = 3600 // Cache for 1 hour

export default async function ProductsPage({
  searchParams
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const resolvedParams = await searchParams
  
  // Parse filters from URL
  const page = parseInt((resolvedParams.page as string) || '1')
  const categoryId = resolvedParams.category as string
  const minPrice = resolvedParams.minPrice ? parseInt(resolvedParams.minPrice as string) : undefined
  const maxPrice = resolvedParams.maxPrice ? parseInt(resolvedParams.maxPrice as string) : undefined
  const sort = (resolvedParams.sort as string) || 'newest'
  const q = resolvedParams.q as string
  const viewMode = (resolvedParams.view as 'grid' | 'list') || 'grid'

  const itemsPerPage = 12

  // Fetch data on server
  const [{ products, pagination }, categories] = await Promise.all([
    getProducts({ 
        page, 
        categoryId, 
        minPrice, 
        maxPrice, 
        sort, 
        q, 
        limit: itemsPerPage 
    }),
    getCategories()
  ])

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
          {/* Filters Sidebar (Client Component) */}
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
                    {q && (
                      <span className="text-primary-600">Kết quả cho "{q}" · </span>
                    )}
                    <span className="text-neutral-600 font-bold">{pagination.total}</span> sản phẩm
                  </div>
                  
                  {/* View Controls (Client Component) */}
                  <ProductViewControls viewMode={viewMode} />
                </div>

                {q && (
                    <div className="flex items-center gap-3 pt-3 border-t border-neutral-100">
                        <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Tìm kiếm:</span>
                        <div className="bg-primary-50 text-primary-600 px-3 py-1 rounded-full text-xs font-bold border border-primary-100 flex items-center gap-2">
                        {q}
                        <Link
                            href="/products"
                            className="hover:text-red-500 transition-colors"
                        >
                            ×
                        </Link>
                        </div>
                    </div>
                )}
              </div>
            </div>

            {/* Products Grid/List */}
            {products.length > 0 ? (
              <div className={`grid gap-5 transition-all duration-500 ${viewMode === 'grid'
                ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
                : 'grid-cols-1'}`}>
                {products.map((product) => (
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

            {/* Pagination (Client Component) */}
            <ProductPagination lastPage={pagination.lastPage} currentPage={page} />
          </div>
        </div>
      </div>

      {/* Comparison Bar */}
      <ComparisonBar />

      {/* Smart AI Nudge */}
      <SmartNudge
        pageType="products"
        contextData={{
          category: categoryId,
          searchQuery: q
        }}
      />
    </div>
  )
}
