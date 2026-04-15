import { use } from 'react'
import Header from '@/components/Header'
import Link from 'next/link'
import { 
    Calendar, Eye, ArrowLeft, BookOpen, Clock, 
    ChevronRight, Sparkles, TrendingUp, ShoppingCart, ArrowUpRight
} from 'lucide-react'
import ProductCard from '@/components/marketplace/ProductCard'
import { format } from 'date-fns'
import { vi } from 'date-fns/locale'
import { Toaster } from 'react-hot-toast'
import SmartInventoryNudge from '@/components/blog/SmartInventoryNudge'
import { getBlogPostBySlug, getRelatedPosts, getTrendingPosts, getBlogPosts } from '@/lib/blog'
import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'

// Components
import ReadingProgressBar from '../components/ReadingProgressBar'
import BlogInteractions from '../components/BlogInteractions'
import BlogSidebar from '../components/BlogSidebar'

export const revalidate = 3600 // Cache for 1 hour

// Generate static params for all published posts
export async function generateStaticParams() {
    const posts = await prisma.blogPost.findMany({
        where: { isPublished: true },
        select: { slug: true }
    })
    return posts.map((post) => ({
        slug: post.slug
    }))
}

export default async function BlogDetailPage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params
    
    // Fetch data concurrently on server
    const post = await getBlogPostBySlug(slug)
    
    if (!post) {
        notFound()
    }

    const [relatedPosts, trendingPosts, relatedProducts] = await Promise.all([
        post.categoryId ? getRelatedPosts(post.categoryId, post.id) : Promise.resolve([]),
        getTrendingPosts(5),
        post.categoryId ? prisma.product.findMany({
            where: { categoryId: post.categoryId, isActive: true },
            take: 4
        }) : Promise.resolve([])
    ])

    const readingTime = Math.ceil(post.content.length / 1000)

    // Add anchors to content headings on server if possible, 
    // but for now, we'll let the TOC link to them as it expects "heading-i"
    const processedContent = post.content.replace(/<h([1-3])>(.*?)<\/h\1>/gi, (match, level, text, offset) => {
        // This is a bit naive but matches what the original Client side generation did
        // Actually, the original one used DOMParser which is better. 
        // For server side, we can just inject IDs based on index.
        return match // We'll keep it simple for now, as DOMParser was used in the Component
    })
    
    // Note: To match the original "heading-0" IDs, we'll need to inject them into the HTML content
    let headingIndex = 0
    const contentWithIds = post.content.replace(/<h([1-3])>/gi, () => `<h$1 id="heading-${headingIndex++}">`)

    return (
        <div className="min-h-screen bg-white font-sans selection:bg-primary-100 selection:text-primary-900">
            <Header />
            <Toaster position="bottom-right" />

            <ReadingProgressBar />

            <article className="max-w-7xl mx-auto px-6 pt-32 pb-40">
                {/* Modern SEO Breadcrumbs */}
                <nav className="mb-12 flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.2em] text-neutral-400">
                    <Link href="/" className="hover:text-primary-600 transition-colors">Trang chủ</Link>
                    <ChevronRight className="w-3 h-3" />
                    <Link href="/blog" className="hover:text-primary-600 transition-colors text-neutral-900">Kiến thức</Link>
                    <ChevronRight className="w-3 h-3" />
                    <span className="text-primary-600 truncate max-w-[200px]">{post.category?.name}</span>
                </nav>

                {/* Modern Article Header */}
                <header className="mb-16">
                    <div className="flex flex-col items-center text-center">
                        {post.category && (
                            <Link 
                                href={`/blog?categoryId=${post.category.id}`}
                                className="inline-flex items-center gap-2 px-4 py-1.5 bg-blue-50 text-blue-600 rounded-full text-[10px] font-black uppercase tracking-[0.2em] mb-8 hover:bg-blue-100 transition-colors border border-blue-100/50"
                            >
                                <Sparkles className="w-3 h-3" /> {post.category.name}
                            </Link>
                        )}
                        <h1 className="text-4xl md:text-6xl lg:text-7xl font-black text-neutral-900 leading-[1.1] tracking-tight mb-10 max-w-4xl">
                            {post.title}
                        </h1>

                        <div className="flex flex-wrap items-center justify-center gap-6 md:gap-8 text-[11px] font-bold text-neutral-400 uppercase tracking-widest bg-neutral-50/50 px-8 py-4 rounded-full border border-neutral-100">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-primary-600 text-white flex items-center justify-center text-[12px] font-black shadow-lg shadow-primary-200">
                                    {post.author.name.charAt(0)}
                                </div>
                                <span className="text-neutral-900">{post.author.name}</span>
                            </div>
                            <span className="w-1 h-1 rounded-full bg-neutral-200 hidden md:block"></span>
                            <div className="flex items-center gap-2">
                                <Calendar className="w-3.5 h-3.5" /> 
                                {format(new Date(post.publishedAt || new Date()), 'dd MMMM, yyyy', { locale: vi })}
                            </div>
                            <span className="w-1 h-1 rounded-full bg-neutral-200 hidden md:block"></span>
                            <div className="flex items-center gap-2">
                                <Clock className="w-3.5 h-3.5 text-emerald-500" /> 
                                {readingTime} phút đọc
                            </div>
                            <span className="w-1 h-1 rounded-full bg-neutral-200 hidden md:block"></span>
                            <div className="flex items-center gap-2">
                                <Eye className="w-3.5 h-3.5 text-purple-500" /> {post.viewCount} lượt xem
                            </div>
                        </div>
                    </div>
                </header>

                {/* Refined Hero Image */}
                {post.featuredImage && (
                    <div className="relative group mb-20">
                        <div className="aspect-[21/10] rounded-[48px] overflow-hidden shadow-[0_32px_64px_-16px_rgba(0,0,0,0.1)] border-b border-neutral-100">
                            <img 
                                src={post.featuredImage} 
                                alt={post.title} 
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-[4s]" 
                            />
                        </div>
                        <div className="absolute inset-0 rounded-[48px] ring-1 ring-inset ring-black/5 pointer-events-none"></div>
                    </div>
                )}

                {/* Reader-Friendly Article Body with Sidebar */}
                <div className="flex flex-col lg:flex-row gap-20">
                    <aside className="hidden xl:block w-64 shrink-0">
                        <div className="sticky top-32 space-y-10">
                            <Link 
                                href="/blog"
                                className="group inline-flex items-center gap-3 bg-white border border-neutral-100 px-6 py-4 rounded-full shadow-sm hover:shadow-md hover:-translate-x-2 transition-all text-neutral-400 hover:text-blue-600"
                            >
                                <ArrowLeft className="w-4 h-4" />
                                <span className="text-[10px] font-black uppercase tracking-widest">Trở về blog</span>
                            </Link>

                            {/* TOC and Newsletter Sidebar (Client) */}
                            <BlogSidebar content={post.content} />
                        </div>
                    </aside>

                    <div className="flex-1 max-w-4xl">
                        <div 
                            className="prose prose-neutral prose-xl md:prose-2xl max-w-none 
                            prose-headings:text-neutral-900 prose-headings:font-black prose-headings:tracking-tight 
                            prose-p:text-neutral-600 prose-p:leading-[1.8] prose-p:font-medium
                            prose-strong:text-neutral-900 prose-strong:font-black
                            prose-blockquote:border-l-4 prose-blockquote:border-primary-600 prose-blockquote:bg-primary-50/30 prose-blockquote:py-6 prose-blockquote:px-8 prose-blockquote:rounded-r-3xl prose-blockquote:not-italic prose-blockquote:font-bold prose-blockquote:text-neutral-800
                            prose-img:rounded-3xl prose-img:shadow-xl prose-img:my-12
                            prose-a:text-primary-600 prose-a:no-underline hover:prose-a:underline
                            transition-all"
                            dangerouslySetInnerHTML={{ __html: contentWithIds }} 
                        />

                        {/* Likes and Comments (Client) */}
                        <BlogInteractions slug={post.slug} initialLikes={post.likesCount || 0} />
                    </div>

                    <aside className="w-full lg:w-96 space-y-12">
                        <div className="sticky top-24 p-8 bg-neutral-50 rounded-[40px] border border-neutral-100/80 shadow-sm">
                            <h3 className="text-sm font-black text-slate-900 tracking-widest uppercase mb-8 flex items-center gap-3">
                                <TrendingUp className="w-4 h-4 text-rose-500" /> Xu hướng
                            </h3>
                            <div className="space-y-8">
                                {trendingPosts.map((tp, idx) => (
                                    <Link 
                                        href={`/blog/${tp.slug}`} 
                                        key={tp.id} 
                                        className="group flex gap-4 items-start"
                                    >
                                        <span className="text-4xl font-black text-slate-300 group-hover:text-primary-600 transition-colors leading-none">
                                            0{idx + 1}
                                        </span>
                                        <div className="space-y-2">
                                            <h4 className="text-sm font-bold text-slate-800 leading-tight group-hover:text-primary-600 transition-colors line-clamp-2">
                                                {tp.title}
                                            </h4>
                                            <div className="flex items-center gap-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                                <span>{format(new Date(tp.publishedAt || new Date()), 'dd MMM')}</span>
                                                <span className="w-1 h-1 rounded-full bg-slate-200"></span>
                                                <span>{tp.viewCount} Views</span>
                                            </div>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        </div>
                    </aside>
                </div>

                {/* Author Bio Section */}
                <div className="mt-32 p-10 md:p-14 bg-neutral-50 rounded-[56px] border border-neutral-100 flex flex-col md:flex-row items-center gap-10 relative overflow-hidden group">
                    <div className="absolute -top-24 -right-24 w-64 h-64 bg-blue-100/50 rounded-full blur-[80px]"></div>
                    <div className="w-32 h-32 rounded-[40px] bg-white shadow-2xl shadow-blue-500/10 flex items-center justify-center text-5xl font-black shrink-0 relative z-10 text-primary-600 rotate-3 group-hover:rotate-0 transition-transform border border-blue-50">
                        {post.author.name.charAt(0)}
                    </div>
                    <div className="text-center md:text-left relative z-10">
                        <p className="text-[11px] font-black text-primary-600 uppercase tracking-[0.3em] mb-3">Thông tin tác giả</p>
                        <h4 className="text-3xl font-black text-neutral-900 tracking-tight mb-4">{post.author.name}</h4>
                        <p className="text-neutral-500 text-lg font-medium leading-relaxed max-w-xl">
                            Chuyên gia tư vấn kỹ thuật tại SmartBuild, đam mê chia sẻ kiến thức về vật liệu xây dựng thông minh và kiến trúc bền vững.
                        </p>
                    </div>
                </div>

                {/* Recommended Products */}
                {relatedProducts.length > 0 && (
                    <div className="mt-48 pt-24 border-t border-slate-100">
                        <div className="mb-16">
                            <h3 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-4">
                                <ShoppingCart className="text-emerald-500 w-8 h-8" /> 
                                VẬT TƯ ĐƯỢC KHUYÊN DÙNG
                            </h3>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                            {relatedProducts.map(product => (
                                <ProductCard 
                                    key={product.id} 
                                    product={product as any} 
                                />
                            ))}
                        </div>
                    </div>
                )}

                {/* Related Posts */}
                {relatedPosts.length > 0 && (
                    <div className="mt-48 pt-24 border-t border-slate-100 space-y-16">
                         <div className="flex items-center justify-between">
                            <h3 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-4">
                                <BookOpen className="text-blue-600 w-8 h-8" /> 
                                KIẾN THỨC LIÊN QUAN
                            </h3>
                            <Link href="/blog" className="px-6 py-2.5 bg-neutral-50 text-[10px] font-black text-slate-600 uppercase tracking-widest rounded-full hover:bg-primary-600 hover:text-white transition-all flex items-center gap-2">
                                Xem tất cả <ArrowUpRight className="w-4 h-4" />
                            </Link>
                         </div>
                         <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
                            {relatedPosts.map(rp => (
                                <Link 
                                    href={`/blog/${rp.slug}`} 
                                    key={rp.id}
                                    className="group flex flex-col"
                                >
                                    <div className="aspect-[16/10] rounded-[40px] overflow-hidden mb-8 border border-slate-100 shadow-sm transition-all group-hover:-translate-y-2 group-hover:shadow-2xl">
                                        <img src={rp.featuredImage || ''} alt={rp.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000" />
                                    </div>
                                    <h4 className="text-xl font-black text-slate-900 leading-tight line-clamp-2 group-hover:text-primary-600 transition-colors">
                                        {rp.title}
                                    </h4>
                                    <div className="flex items-center gap-3 mt-4">
                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                            {format(new Date(rp.publishedAt || new Date()), 'dd MMM, yyyy', { locale: vi })}
                                        </span>
                                    </div>
                                </Link>
                            ))}
                         </div>
                    </div>
                )}
            </article>

            {/* AI-Driven Inventory Nudge */}
            <SmartInventoryNudge categoryId={post.category?.id} />
        </div>
    )
}
