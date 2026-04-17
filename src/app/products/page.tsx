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
import { Suspense } from 'react'

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
  
    // Fetch categories only at top level (cached & fast)
    const categories = await getCategories()
  
    return (
      <div className="min-h-screen bg-neutral-50 font-sans">
        <Toaster position="top-right" />
        <Header />
  
        {/* Page Header Banner - Renders Instantly */}
        <div className="bg-primary-600 relative overflow-hidden">
          <div className="absolute inset-0 opacity-10" style={{backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)', backgroundSize: '32px 32px'}} />
          <div className="absolute -right-20 -top-20 w-80 h-80 bg-white/10 rounded-full blur-3xl"></div>
          <div className="absolute -left-20 -bottom-20 w-80 h-80 bg-primary-400/20 rounded-full blur-3xl"></div>
          
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 relative z-10 text-center md:text-left">
            <div className="flex items-center justify-center md:justify-start gap-2 mb-6">
              <Link href="/" className="px-3 py-1.5 bg-white/10 backdrop-blur-md border border-white/20 rounded-full text-white text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-white/20 transition-all">
                <ArrowLeft className="h-3 w-3" /> Trang chủ
              </Link>
              <span className="w-1 h-1 rounded-full bg-primary-300"></span>
              <span className="text-primary-100 text-[10px] font-black uppercase tracking-widest">Sản phẩm</span>
            </div>
            
            <h1 className="text-4xl md:text-6xl font-black text-white mb-4 tracking-tighter leading-none">
              VẬT LIỆU <span className="text-primary-200">XÂY DỰNG</span>
            </h1>
            <p className="text-primary-100 text-sm md:text-base font-medium mb-10 max-w-xl opacity-90 mx-auto md:mx-0">
              Cung cấp giải pháp vật liệu toàn diện cho mọi quy mô công trình từ dân dụng đến công nghiệp.
            </p>
            
            <div className="max-w-xl mx-auto md:mx-0 shadow-2xl rounded-2xl overflow-hidden ring-4 ring-white/10">
              <SearchBar />
            </div>
          </div>
        </div>
  
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 pb-32">
          <div className="flex flex-col lg:flex-row gap-10">
            {/* Filters Sidebar - Renders Instantly */}
            <div className="w-full lg:w-80 flex-shrink-0">
              <div className="sticky top-24">
                <ProductFilters categories={categories} />
              </div>
            </div>
  
            {/* Products Content Container */}
            <div className="flex-1">
                <Suspense 
                    key={`${page}-${categoryId}-${minPrice}-${maxPrice}-${sort}-${q}-${viewMode}`} 
                    fallback={<ProductGridSkeleton viewMode={viewMode} />}
                >
                    <ProductContent 
                        page={page}
                        categoryId={categoryId}
                        minPrice={minPrice}
                        maxPrice={maxPrice}
                        sort={sort}
                        q={q}
                        viewMode={viewMode}
                        itemsPerPage={itemsPerPage}
                    />
                </Suspense>
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
  
  // Separate component for streaming product content
  async function ProductContent({
    page, categoryId, minPrice, maxPrice, sort, q, viewMode, itemsPerPage
  }: {
    page: number, categoryId: string, minPrice?: number, maxPrice?: number, sort: string, q: string, viewMode: 'grid' | 'list', itemsPerPage: number
  }) {
    const { products, pagination } = await getProducts({ 
        page, 
        categoryId, 
        minPrice, 
        maxPrice, 
        sort, 
        q, 
        limit: itemsPerPage 
    })
  
    return (
      <div className="animate-in fade-in duration-700">
        {/* View Controls & Info */}
        <div className="bg-white rounded-[2rem] border border-neutral-100 p-6 mb-8 shadow-sm flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-2 h-8 bg-primary-600 rounded-full"></div>
              <div className="text-[11px] font-black text-neutral-400 uppercase tracking-[0.2em]">
                {q && <span className="text-primary-600">Kết quả cho "{q}" · </span>}
                <span className="text-neutral-900">{pagination.total}</span> sản phẩm được tìm thấy
              </div>
            </div>
            <ProductViewControls viewMode={viewMode} />
          </div>
  
          {q && (
              <div className="flex items-center gap-3 pt-4 border-t border-neutral-50">
                  <span className="text-[9px] font-black text-neutral-400 uppercase tracking-widest">Đang tìm:</span>
                  <div className="bg-primary-50 text-primary-700 px-4 py-1.5 rounded-full text-[10px] font-black border border-primary-100 flex items-center gap-2 uppercase tracking-widest">
                  {q}
                  <Link href="/products" className="hover:text-red-500 transition-colors text-lg line-none leading-none">×</Link>
                  </div>
              </div>
          )}
        </div>
  
        {/* Products Grid/List */}
        {products.length > 0 ? (
          <div className={`grid gap-6 transition-all duration-500 ${viewMode === 'grid'
            ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
            : 'grid-cols-1'}`}>
            {products.map((product, idx) => (
              <div 
                key={product.id} 
                className="animate-in fade-in slide-in-from-bottom-4 duration-500 fill-mode-both"
                style={{ animationDelay: `${(idx % 8) * 50}ms` }}
              >
                <ProductCard product={product as any} viewMode={viewMode} />
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-[3rem] p-24 text-center border border-neutral-100 shadow-xl shadow-neutral-100/50">
            <div className="w-24 h-24 bg-neutral-50 rounded-full flex items-center justify-center mx-auto mb-8 ring-8 ring-neutral-50/50">
              <Package className="h-10 w-10 text-neutral-200" />
            </div>
            <h3 className="text-2xl font-black text-neutral-900 mb-3 tracking-tight">Không tìm thấy sản phẩm</h3>
            <p className="text-neutral-500 text-sm mb-10 font-medium">Chúng tôi không tìm thấy kết quả phù hợp. Hãy thử thay đổi bộ lọc hoặc từ khóa tìm kiếm.</p>
            <Link
              href="/products"
              className="inline-flex items-center gap-3 bg-primary-600 text-white px-10 py-4 rounded-2xl hover:bg-primary-700 font-black text-xs uppercase tracking-widest transition-all shadow-xl shadow-primary-200 active:scale-95"
            >
              Xem tất cả sản phẩm
            </Link>
          </div>
        )}
  
        {/* Pagination */}
        <div className="mt-16">
            <ProductPagination lastPage={pagination.lastPage} currentPage={page} />
        </div>
      </div>
    )
  }
  
  function ProductGridSkeleton({ viewMode }: { viewMode: 'grid' | 'list' }) {
    return (
      <div className="space-y-8 animate-pulse">
        <div className="h-24 bg-white rounded-[2rem] border border-neutral-100"></div>
        <div className={`grid gap-6 ${viewMode === 'grid'
            ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
            : 'grid-cols-1'}`}>
            {[1, 2, 3, 4, 5, 1, 7, 8].map(i => (
                <div key={i} className="bg-white rounded-3xl h-80 border border-neutral-100"></div>
            ))}
        </div>
      </div>
    )
  }
