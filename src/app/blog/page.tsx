'use client'

import { useState, useEffect } from 'react'
import Header from '@/components/Header'
import Link from 'next/link'
import { Calendar, User, Eye, ArrowRight, BookOpen, Search, Filter, Sparkles, Loader2, ChevronRight, ChevronDown } from 'lucide-react'
import { format } from 'date-fns'
import { vi } from 'date-fns/locale'

interface Post {
    id: string
    title: string
    slug: string
    summary: string
    featuredImage: string
    author: { name: string }
    category?: { id: string, name: string }
    publishedAt: string
    viewCount: number
}

interface Category {
    id: string
    name: string
    slug: string
    _count: { posts: number }
}

export default function BlogListPage() {
    const [posts, setPosts] = useState<Post[]>([])
    const [categories, setCategories] = useState<Category[]>([])
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')
    const [page, setPage] = useState(1)
    const [sortBy, setSortBy] = useState('publishedAt')
    const [isSortOpen, setIsSortOpen] = useState(false)
    const [pagination, setPagination] = useState({ total: 0, lastPage: 1 })

    useEffect(() => {
        fetchCategories()
    }, [])

    useEffect(() => {
        fetchPosts()
    }, [selectedCategory, page, sortBy])

    // Debounce search
    useEffect(() => {
        const timer = setTimeout(() => {
            if (page !== 1) setPage(1)
            else fetchPosts()
        }, 500)
        return () => clearTimeout(timer)
    }, [searchTerm])

    const fetchCategories = async () => {
        try {
            const res = await fetch('/api/blog/categories')
            const data = await res.json()
            if (data.success) setCategories(data.data)
        } catch (err) { console.error(err) }
    }

    const fetchPosts = async () => {
        setLoading(true)
        try {
            const params = new URLSearchParams()
            params.append('page', page.toString())
            params.append('limit', '10')
            params.append('sortBy', sortBy)
            params.append('search', searchTerm)
            if (selectedCategory) params.append('categoryId', selectedCategory)

            const res = await fetch(`/api/blog/public?${params.toString()}`)
            const data = await res.json()
            if (data.success) {
                if (typeof data.data === 'object' && !Array.isArray(data.data)) {
                    setPosts(data.data.posts)
                    setPagination(data.data.pagination)
                } else {
                    setPosts(data.data) // Fallback for old API structure
                }
            }
        } catch (err) {
            console.error(err)
        } finally {
            setLoading(false)
        }
    }

    const featuredPost = posts[0]
    const listPosts = posts.slice(1)
    
    // Server-side filtering now
    const filteredPosts = listPosts

    return (
        <div className="min-h-screen bg-white">
            <Header />
            
            {/* Elegant Light Hero */}
            <div className="bg-gradient-to-b from-blue-50/50 to-white pt-24 pb-40 relative overflow-hidden">
                <div className="absolute inset-0">
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

            {/* Sticky Category Bar - Redesigned */}
            <div className="max-w-7xl mx-auto px-6 -mt-12 relative z-20">
                <div className="bg-white/90 backdrop-blur-xl border border-neutral-100 p-2.5 rounded-[2rem] shadow-2xl flex flex-col md:flex-row items-center gap-4 ring-1 ring-black/5">
                    <div className="flex items-center gap-2 overflow-x-auto w-full md:flex-1 p-1 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                        <button 
                            onClick={() => {
                                setSelectedCategory(null)
                                setPage(1)
                            }}
                            className={`px-8 py-3 rounded-full text-[11px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${!selectedCategory ? 'bg-primary-600 text-white shadow-lg shadow-primary-200' : 'text-neutral-400 hover:text-neutral-900 hover:bg-neutral-50'}`}
                        >
                            Tất cả
                        </button>
                        {categories.map(cat => (
                            <button 
                                key={cat.id}
                                onClick={() => {
                                    setSelectedCategory(cat.id)
                                    setPage(1)
                                }}
                                className={`px-8 py-3 rounded-full text-[11px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${selectedCategory === cat.id ? 'bg-primary-600 text-white shadow-lg shadow-primary-200' : 'text-neutral-400 hover:text-neutral-900 hover:bg-neutral-50'}`}
                            >
                                {cat.name}
                            </button>
                        ))}
                    </div>
                    <div className="flex gap-2 w-full md:w-auto mt-2 md:mt-0">
                        <div className="relative z-50">
                            <button 
                                onClick={() => setIsSortOpen(!isSortOpen)}
                                className="px-6 py-3.5 bg-white border border-blue-100 rounded-full text-[11px] font-black uppercase tracking-widest text-blue-600 flex items-center justify-between gap-3 w-40 hover:bg-blue-50 transition-all shadow-sm"
                            >
                                {sortBy === 'publishedAt' ? 'Mới nhất' : 'Xem nhiều'}
                                <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isSortOpen ? 'rotate-180' : ''}`} />
                            </button>
                            
                            {isSortOpen && (
                                <>
                                    <div className="fixed inset-0 z-40" onClick={() => setIsSortOpen(false)}></div>
                                    <div className="absolute top-full mt-2 w-full bg-white rounded-2xl shadow-xl border border-blue-100 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                                        <button 
                                            onClick={() => { setSortBy('publishedAt'); setPage(1); setIsSortOpen(false); }}
                                            className={`w-full text-left px-5 py-3 text-[11px] font-black uppercase tracking-widest transition-colors ${sortBy === 'publishedAt' ? 'bg-blue-600 text-white' : 'text-neutral-500 hover:bg-neutral-50 hover:text-blue-600'}`}
                                        >
                                            Mới nhất
                                        </button>
                                        <button 
                                            onClick={() => { setSortBy('viewCount'); setPage(1); setIsSortOpen(false); }}
                                            className={`w-full text-left px-5 py-3 text-[11px] font-black uppercase tracking-widest transition-colors ${sortBy === 'viewCount' ? 'bg-blue-600 text-white' : 'text-neutral-500 hover:bg-neutral-50 hover:text-blue-600'}`}
                                        >
                                            Xem nhiều
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>
                        <div className="relative flex-1 md:w-72">
                            <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-300 group-focus-within:text-primary-600 transition-colors" />
                            <input 
                                type="text"
                                placeholder="Tìm bài viết..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-14 pr-6 py-3.5 bg-neutral-50/50 border border-neutral-100 rounded-full text-sm outline-none focus:bg-white focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all font-medium"
                            />
                        </div>
                    </div>
                </div>
            </div>

            <main className="max-w-7xl mx-auto px-6 py-24">
                {loading ? (
                    <div className="space-y-20">
                         <div className="h-[600px] bg-slate-50 rounded-[48px] animate-pulse"></div>
                         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
                            {[1,2,3].map(i => <div key={i} className="h-96 bg-slate-50 rounded-[40px] animate-pulse"></div>)}
                         </div>
                    </div>
                ) : posts.length === 0 ? (
                    <div className="py-20 text-center">
                        <Filter className="w-16 h-16 text-slate-200 mx-auto mb-6" />
                        <h3 className="text-2xl font-black text-slate-900 mb-2">Chưa có bài viết nào</h3>
                        <p className="text-slate-500">Chủ đề này đang được SmartBuild biên soạn nội dung chất lượng.</p>
                    </div>
                ) : (
                    <div className="space-y-24">
                        {/* Featured Post Card */}
                        {featuredPost && !selectedCategory && !searchTerm && (
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
                                                <Calendar className="w-3 h-3" /> {format(new Date(featuredPost.publishedAt), 'dd MMMM, yyyy', { locale: vi })}
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
                            {filteredPosts.map((post, idx) => (
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
                                            <span className="flex items-center gap-1.5 text-blue-600"><Calendar className="w-3 h-3" /> {format(new Date(post.publishedAt), 'dd.MM.yyyy')}</span>
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

                        {/* Pagination View */}
                        {pagination.lastPage > 1 && (
                            <div className="flex items-center justify-center gap-3 mt-32">
                                <button 
                                    disabled={page === 1}
                                    onClick={() => setPage(page - 1)}
                                    className="w-14 h-14 flex items-center justify-center rounded-3xl bg-neutral-50 text-slate-400 border border-slate-100 disabled:opacity-20 hover:bg-primary-600 hover:text-white transition-all shadow-xl shadow-slate-200/50"
                                >
                                    ←
                                </button>
                                {[...Array(pagination.lastPage)].map((_, i) => (
                                    <button
                                        key={i + 1}
                                        onClick={() => setPage(i + 1)}
                                        className={`w-14 h-14 flex items-center justify-center rounded-3xl font-black text-sm transition-all shadow-xl ${
                                            page === i + 1 
                                            ? 'bg-primary-600 text-white shadow-primary-200/50' 
                                            : 'bg-white border border-slate-100 text-slate-400 hover:bg-slate-50 shadow-slate-100'
                                        }`}
                                    >
                                        {i + 1}
                                    </button>
                                ))}
                                <button 
                                    disabled={page === pagination.lastPage}
                                    onClick={() => setPage(page + 1)}
                                    className="w-14 h-14 flex items-center justify-center rounded-3xl bg-neutral-50 text-slate-400 border border-slate-100 disabled:opacity-20 hover:bg-primary-600 hover:text-white transition-all shadow-xl shadow-slate-200/50"
                                >
                                    →
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </main>
        </div>
    )
}
