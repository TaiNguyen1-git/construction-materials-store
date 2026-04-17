import Header from '@/components/Header'
import Link from 'next/link'
import { Calendar, Eye, ArrowRight, BookOpen, Sparkles, ChevronRight, Filter } from 'lucide-react'
import { format } from 'date-fns'
import { vi } from 'date-fns/locale'
import { getBlogPosts, getBlogCategories } from '@/lib/blog'
import BlogFilters from './components/BlogFilters'
import BlogPagination from './components/BlogPagination'
import { Suspense } from 'react'

export const revalidate = 3600 // Revalidate every hour

export default async function BlogListPage({
    searchParams
}: {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
    const resolvedSearchParams = await searchParams
    
    // Parse filters from URL
    const page = parseInt((resolvedSearchParams.page as string) || '1')
    const categoryId = resolvedSearchParams.categoryId as string
    const sortBy = (resolvedSearchParams.sortBy as string) || 'publishedAt'
    const search = resolvedSearchParams.search as string

    // Fetch categories only at top level (cached & fast)
    const categories = await getBlogCategories()

    return (
        <div className="min-h-screen bg-white">
            <Header />
            
            {/* Elegant Light Hero - Renders Instantly */}
            <div className="bg-gradient-to-b from-blue-50/50 to-white pt-24 pb-40 relative overflow-hidden">
                <div className="absolute inset-0 border-b border-blue-50/50">
                    <div className="absolute top-1/2 left-1/4 w-[600px] h-[600px] bg-blue-400/5 rounded-full blur-[120px] -translate-y-1/2"></div>
                    <div className="absolute top-1/2 right-0 w-[400px] h-[400px] bg-emerald-400/5 rounded-full blur-[100px] -translate-y-1/2"></div>
                </div>
                
                <div className="max-w-7xl mx-auto px-6 relative z-10 text-center">
                    <div className="inline-flex items-center gap-2 px-5 py-2.5 bg-white border border-blue-100 rounded-full shadow-sm text-blue-600 text-[10px] font-black uppercase tracking-[0.3em] mb-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
                        <Sparkles className="w-3.5 h-3.5" /> Blog & Kiến Thức Xây Dựng
                    </div>
                    <h1 className="text-6xl md:text-[100px] font-black text-neutral-900 tracking-tighter mb-8 leading-none">
                        SMART<span className="text-primary-600 italic">MAGAZINE</span>
                    </h1>
                    <p className="text-neutral-500 text-lg md:text-xl max-w-2xl mx-auto font-medium leading-relaxed">
                        Nơi chia sẻ những kỹ thuật xây dựng đột phá, xu hướng vật liệu bền vững và bí quyết tối ưu không gian sống.
                    </p>
                </div>
            </div>

            {/* Filter Bar - Renders Instantly */}
            <BlogFilters categories={categories} />

            <Suspense key={`${page}-${categoryId}-${sortBy}-${search}`} fallback={<BlogContentSkeleton />}>
                <BlogContent 
                    page={page} 
                    categoryId={categoryId} 
                    sortBy={sortBy} 
                    search={search} 
                />
            </Suspense>
        </div>
    )
}

// Separate component for streaming content
async function BlogContent({ 
    page, categoryId, sortBy, search 
}: { 
    page: number, categoryId: string, sortBy: string, search: string 
}) {
    const { posts, pagination } = await getBlogPosts({ page, categoryId, sortBy, search })

    const featuredPost = posts[0]
    const listPosts = posts.slice(1)

    if (posts.length === 0) {
        return (
            <main className="max-w-7xl mx-auto px-6 py-24">
                <div className="py-20 text-center">
                    <Filter className="w-16 h-16 text-slate-200 mx-auto mb-6" />
                    <h3 className="text-2xl font-black text-slate-900 mb-2">Chưa có bài viết nào</h3>
                    <p className="text-slate-500">Chủ đề này đang được SmartBuild biên soạn nội dung chất lượng.</p>
                </div>
            </main>
        )
    }

    return (
        <main className="max-w-7xl mx-auto px-6 py-24">
            <div className="space-y-24">
                {/* Featured Post Card */}
                {featuredPost && page === 1 && !categoryId && !search && (
                    <Link 
                        href={`/blog/${featuredPost.slug}`}
                        className="relative block group"
                    >
                        <div className="grid grid-cols-1 lg:grid-cols-2 bg-slate-50 rounded-[64px] overflow-hidden border border-slate-100 hover:ring-4 hover:ring-blue-500/10 transition-all duration-700">
                            <div className="h-[400px] lg:h-[600px] relative overflow-hidden">
                                <img 
                                    src={featuredPost.featuredImage || 'https://images.unsplash.com/photo-1541888946425-d81bb19480c5?q=80&w=2070&auto=format&fit=crop'} 
                                    alt={featuredPost.title}
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-[2s] ease-out"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
                            </div>
                            <div className="p-12 lg:p-20 flex flex-col justify-center">
                                <div className="flex items-center gap-3 mb-8">
                                    <span className="px-5 py-2 bg-blue-600 text-white rounded-full text-[10px] font-black uppercase tracking-[0.2em] shadow-xl shadow-blue-500/20">
                                        Nổi bật: {featuredPost.category?.name}
                                    </span>
                                    <span className="text-slate-400 font-black text-[10px] uppercase tracking-widest flex items-center gap-2">
                                        <Calendar className="w-3 h-3" /> {format(new Date(featuredPost.publishedAt || new Date()), 'dd MMMM, yyyy', { locale: vi })}
                                    </span>
                                </div>
                                <h2 className="text-4xl md:text-6xl font-black text-slate-900 leading-[1.1] mb-8 tracking-tighter group-hover:text-blue-600 transition-colors">
                                    {featuredPost.title}
                                </h2>
                                <p className="text-slate-500 text-lg md:text-xl font-medium leading-relaxed mb-10 line-clamp-3 italic decoration-blue-200">
                                    "{featuredPost.summary}"
                                </p>
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-full bg-white shadow-lg flex items-center justify-center text-blue-600 group-hover:translate-x-2 transition-transform">
                                        <ArrowRight className="w-6 h-6" />
                                    </div>
                                    <span className="text-sm font-black text-slate-900 uppercase tracking-[0.2em]">Khám phá bài viết ngay</span>
                                </div>
                            </div>
                        </div>
                    </Link>
                )}

                {/* Recent Posts Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
                    {(page === 1 && !categoryId && !search ? listPosts : posts).map((post, idx) => (
                        <Link 
                            href={`/blog/${post.slug}`}
                            key={post.id}
                            className="group flex flex-col h-full animate-in fade-in slide-in-from-bottom-8 duration-500"
                            style={{ animationDelay: `${idx * 100}ms` }}
                        >
                            <div className="h-80 relative rounded-[40px] overflow-hidden mb-8 border border-slate-100 shadow-sm transition-all duration-500 group-hover:-translate-y-2 group-hover:shadow-2xl">
                                <img 
                                    src={post.featuredImage || 'https://images.unsplash.com/photo-1503387762-592dea58ef23?q=80&w=2070&auto=format&fit=crop'} 
                                    alt={post.title}
                                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-[1s]"
                                />
                                <div className="absolute top-6 left-6 px-4 py-1.5 bg-white/95 backdrop-blur-md rounded-full text-[9px] font-black text-slate-900 uppercase tracking-widest shadow-lg">
                                    {post.category?.name}
                                </div>
                                <div className="absolute inset-0 bg-blue-600/0 group-hover:bg-blue-600/10 transition-colors duration-500"></div>
                            </div>
                            
                            <div className="flex flex-col flex-1 px-2">
                                <div className="flex items-center gap-4 text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">
                                    <span className="flex items-center gap-1.5 text-blue-600"><Calendar className="w-3 h-3" /> {format(new Date(post.publishedAt || new Date()), 'dd.MM.yyyy')}</span>
                                    <span className="w-1.5 h-1.5 rounded-full bg-slate-100"></span>
                                    <span className="flex items-center gap-1.5"><Eye className="w-3 h-3" /> {post.viewCount} Xem</span>
                                </div>
                                
                                <h3 className="text-2xl font-black text-slate-900 leading-[1.2] mb-4 tracking-tight group-hover:text-blue-600 transition-colors line-clamp-2">
                                    {post.title}
                                </h3>
                                
                                <p className="text-slate-500 text-sm font-medium leading-relaxed mb-8 line-clamp-3">
                                    {post.summary}
                                </p>
                                
                                <div className="mt-auto pt-6 border-t border-slate-50 flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 text-xs font-black ring-2 ring-white">
                                            {post.author.name.charAt(0)}
                                        </div>
                                        <span className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">{post.author.name}</span>
                                    </div>
                                    <div className="p-2.5 bg-slate-50 text-slate-300 group-hover:bg-blue-600 group-hover:text-white rounded-xl transition-all">
                                        <ChevronRight className="w-4 h-4" />
                                    </div>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>

                {/* Pagination (Client Component) */}
                <BlogPagination lastPage={pagination.lastPage} currentPage={page} />
            </div>
        </main>
    )
}

function BlogContentSkeleton() {
    return (
        <main className="max-w-7xl mx-auto px-6 py-24">
            <div className="space-y-20">
                    <div className="h-[600px] bg-slate-50 rounded-[48px] animate-pulse"></div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="space-y-6">
                            <div className="h-80 bg-slate-50 rounded-[40px] animate-pulse"></div>
                            <div className="h-4 w-1/4 bg-slate-50 rounded-full animate-pulse"></div>
                            <div className="h-8 w-3/4 bg-slate-50 rounded-xl animate-pulse"></div>
                            <div className="h-4 w-full bg-slate-50 rounded-full animate-pulse"></div>
                        </div>
                    ))}
                    </div>
            </div>
        </main>
    )
}
