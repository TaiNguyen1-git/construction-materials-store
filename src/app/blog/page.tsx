'use client'

import { useState, useEffect } from 'react'
import Header from '@/components/Header'
import Link from 'next/link'
import { Calendar, User, Eye, ArrowRight, BookOpen, Search, Filter, Sparkles, Loader2, ChevronRight } from 'lucide-react'
import { format } from 'date-fns'
import { vi } from 'date-fns/locale'
import Footer from '@/components/Footer'

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

    useEffect(() => {
        fetchCategories()
    }, [])

    useEffect(() => {
        fetchPosts()
    }, [selectedCategory])

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
            const url = selectedCategory 
                ? `/api/blog/public?categoryId=${selectedCategory}` 
                : '/api/blog/public'
            const res = await fetch(url)
            const data = await res.json()
            if (data.success) setPosts(data.data)
        } catch (err) {
            console.error(err)
        } finally {
            setLoading(false)
        }
    }

    const featuredPost = posts[0]
    const remainingPosts = posts.slice(1)
    
    // Filter by search term
    const filteredPosts = remainingPosts.filter(p => 
        p.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
        p.summary.toLowerCase().includes(searchTerm.toLowerCase())
    )

    return (
        <div className="min-h-screen bg-white">
            <Header />
            
            {/* Elegant Hero */}
            <div className="bg-[#0c0f17] pt-32 pb-48 relative overflow-hidden">
                <div className="absolute inset-0">
                    <div className="absolute top-1/2 left-1/4 w-[600px] h-[600px] bg-blue-600/10 rounded-full blur-[120px] -translate-y-1/2"></div>
                    <div className="absolute top-1/2 right-0 w-[400px] h-[400px] bg-emerald-600/5 rounded-full blur-[100px] -translate-y-1/2"></div>
                </div>
                
                <div className="max-w-7xl mx-auto px-6 relative z-10 text-center">
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500/10 border border-blue-500/20 rounded-full text-blue-400 text-[10px] font-black uppercase tracking-[0.3em] mb-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                        <Sparkles className="w-3 h-3" /> Blog & Kiến Thức Xây Dựng
                    </div>
                    <h1 className="text-6xl md:text-8xl font-black text-white tracking-tighter mb-8 leading-none">
                        SMART<span className="text-blue-500 italic">MAGAZINE</span>
                    </h1>
                    <p className="text-slate-400 text-lg md:text-xl max-w-2xl mx-auto font-medium leading-relaxed">
                        Nơi chia sẻ những kỹ thuật xây dựng đột phá, xu hướng vật liệu bền vững và bí quyết tối ưu không gian sống.
                    </p>
                </div>
            </div>

            {/* Sticky Category Bar */}
            <div className="max-w-7xl mx-auto px-6 -mt-16 relative z-20">
                <div className="bg-white/80 backdrop-blur-2xl border border-slate-100 p-4 rounded-[32px] shadow-2xl flex flex-col md:flex-row items-center justify-between gap-6 ring-1 ring-slate-900/5">
                    <div className="flex items-center gap-2 overflow-x-auto no-scrollbar w-full md:w-auto pb-2 md:pb-0">
                        <button 
                            onClick={() => setSelectedCategory(null)}
                            className={`px-8 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all whitespace-nowrap ${!selectedCategory ? 'bg-slate-900 text-white shadow-xl scale-105' : 'bg-slate-50 text-slate-400 hover:bg-slate-100 hover:text-slate-600'}`}
                        >
                            Tất cả
                        </button>
                        {categories.map(cat => (
                            <button 
                                key={cat.id}
                                onClick={() => setSelectedCategory(cat.id)}
                                className={`px-8 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all whitespace-nowrap ${selectedCategory === cat.id ? 'bg-blue-600 text-white shadow-xl scale-105 shadow-blue-500/30' : 'bg-slate-50 text-slate-400 hover:bg-slate-100 hover:text-slate-600'}`}
                            >
                                {cat.name} ({cat._count.posts})
                            </button>
                        ))}
                    </div>
                    <div className="relative w-full md:w-80 group">
                        <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-blue-500 transition-colors" />
                        <input 
                            type="text"
                            placeholder="Tìm kiếm bài viết..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-14 pr-6 py-4 bg-slate-50 border border-transparent rounded-[20px] text-sm focus:bg-white focus:border-blue-100 outline-none transition-all font-medium"
                        />
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
                            {(selectedCategory || searchTerm ? posts : remainingPosts).map((post, idx) => (
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
                    </div>
                )}
            </main>
            <Footer />
        </div>
    )
}
