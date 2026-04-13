'use client'

import { useState, useEffect, use } from 'react'
import Header from '@/components/Header'
import Link from 'next/link'
import { 
    Calendar, User, Eye, ArrowLeft, Share2, Facebook, 
    Twitter, Link as LinkIcon, BookOpen, Clock, 
    ChevronRight, Sparkles, MessageSquare, Heart
} from 'lucide-react'
import { format } from 'date-fns'
import { vi } from 'date-fns/locale'
import Footer from '@/components/Footer'
import toast, { Toaster } from 'react-hot-toast'

interface Post {
    id: string
    title: string
    slug: string
    summary: string
    content: string
    featuredImage: string
    author: { name: string, id: string }
    category?: { id: string, name: string }
    publishedAt: string
    viewCount: number
}

export default function BlogDetailPage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = use(params)
    const [post, setPost] = useState<Post | null>(null)
    const [relatedPosts, setRelatedPosts] = useState<Post[]>([])
    const [loading, setLoading] = useState(true)
    const [readingProgress, setReadingProgress] = useState(0)

    useEffect(() => {
        const handleScroll = () => {
            const totalHeight = document.documentElement.scrollHeight - window.innerHeight
            const progress = (window.scrollY / totalHeight) * 100
            setReadingProgress(progress)
        }
        window.addEventListener('scroll', handleScroll)
        return () => window.removeEventListener('scroll', handleScroll)
    }, [])

    useEffect(() => {
        const fetchPost = async () => {
            try {
                const res = await fetch(`/api/blog/public/${slug}`)
                const data = await res.json()
                if (data.success) {
                    setPost(data.data)
                    // Fetch related posts
                    if (data.data.category?.id) {
                        fetchRelated(data.data.category.id, data.data.id)
                    }
                }
            } catch (err) {
                console.error(err)
            } finally {
                setLoading(false)
            }
        }
        fetchPost()
    }, [slug])

    const fetchRelated = async (categoryId: string, excludeId: string) => {
        try {
            const res = await fetch(`/api/blog/public?categoryId=${categoryId}&limit=4`)
            const data = await res.json()
            if (data.success) {
                setRelatedPosts(data.data.filter((p: any) => p.id !== excludeId).slice(0, 3))
            }
        } catch (err) { console.error(err) }
    }

    const copyToClipboard = () => {
        navigator.clipboard.writeText(window.location.href)
        toast.success('Đã sao chép liên kết bài viết!')
    }

    if (loading) return (
        <div className="min-h-screen bg-white">
            <Header />
            <div className="max-w-4xl mx-auto px-6 py-32 space-y-12 animate-pulse">
                <div className="h-4 bg-slate-100 rounded-full w-24 mx-auto"></div>
                <div className="h-16 bg-slate-100 rounded-3xl w-full"></div>
                <div className="h-6 bg-slate-100 rounded-full w-1/3 mx-auto"></div>
                <div className="aspect-[21/9] bg-slate-100 rounded-[48px] w-full"></div>
                <div className="space-y-6">
                    <div className="h-4 bg-slate-100 rounded-full w-full"></div>
                    <div className="h-4 bg-slate-100 rounded-full w-full"></div>
                    <div className="h-4 bg-slate-100 rounded-full w-5/6"></div>
                </div>
            </div>
        </div>
    )

    if (!post) return <div className="p-32 text-center text-slate-400 font-black uppercase tracking-widest italic">404 - Post Not Found</div>

    return (
        <div className="min-h-screen bg-white selection:bg-blue-100 selection:text-blue-900">
            <Toaster position="bottom-center" />
            <Header />

            {/* Reading Progress Indicator */}
            <div className="fixed top-0 left-0 w-full h-[6px] z-[100] bg-slate-100/20 backdrop-blur-sm">
                <div 
                    className="h-full bg-gradient-to-r from-blue-600 to-indigo-600 shadow-[0_0_15px_rgba(37,99,235,0.5)] transition-all duration-100 ease-out rounded-r-full" 
                    style={{ width: `${readingProgress}%` }}
                ></div>
            </div>

            {/* Back Button sticky */}
            <div className="sticky top-24 left-0 w-full z-40 h-0 px-6 max-w-7xl mx-auto hidden xl:block">
                <Link 
                    href="/blog"
                    className="group bg-white border border-slate-100 p-4 rounded-3xl shadow-xl hover:shadow-2xl hover:-translate-x-2 transition-all inline-flex items-center gap-2 text-slate-400 hover:text-blue-600"
                >
                    <ArrowLeft className="w-5 h-5" />
                    <span className="text-[10px] font-black uppercase tracking-widest mr-2">Trở về</span>
                </Link>
            </div>

            <article className="max-w-4xl mx-auto px-6 pt-32 pb-48">
                {/* Header Section */}
                <header className="mb-20 text-center animate-in fade-in slide-in-from-bottom-8 duration-700">
                    {post.category && (
                        <div className="inline-flex items-center gap-2 px-6 py-2 bg-blue-50 text-blue-600 rounded-full text-[10px] font-black uppercase tracking-[0.2em] mb-10 shadow-sm border border-blue-100">
                            <Sparkles className="w-3 h-3" /> {post.category.name}
                        </div>
                    )}
                    <h1 className="text-4xl md:text-7xl font-black text-slate-900 leading-[1.05] tracking-tight mb-12">
                        {post.title}
                    </h1>

                    <div className="flex flex-wrap items-center justify-center gap-10 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-2xl bg-slate-900 text-white flex items-center justify-center shadow-lg">
                                {post.author.name.charAt(0)}
                            </div>
                            <span className="text-slate-900">{post.author.name}</span>
                        </div>
                        <div className="flex items-center gap-2 border-l border-slate-100 pl-10">
                            <Calendar className="w-4 h-4 text-blue-500" /> 
                            {format(new Date(post.publishedAt), 'dd MMMM, yyyy', { locale: vi })}
                        </div>
                        <div className="flex items-center gap-2 border-l border-slate-100 pl-10">
                            <Clock className="w-4 h-4 text-emerald-500" /> 
                            {Math.ceil(post.content.length / 1000)} phút đọc
                        </div>
                        <div className="flex items-center gap-2 border-l border-slate-100 pl-10">
                            <Eye className="w-4 h-4 text-purple-500" /> {post.viewCount} Xem
                        </div>
                    </div>
                </header>

                {/* Hero Image */}
                {post.featuredImage && (
                    <div className="aspect-[21/9] rounded-[64px] overflow-hidden shadow-2xl mb-24 border-8 border-slate-50 relative group animate-in zoom-in duration-1000">
                        <img 
                            src={post.featuredImage} 
                            alt={post.title} 
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-[3s]" 
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
                    </div>
                )}

                {/* Article Body */}
                <div className="max-w-3xl mx-auto">
                    <div 
                        className="prose prose-blue prose-2xl max-w-none prose-headings:font-black prose-headings:tracking-tight prose-headings:text-slate-900 prose-p:font-medium prose-p:text-slate-600 prose-p:leading-[1.8] prose-img:rounded-[40px] prose-img:shadow-2xl prose-blockquote:border-blue-600 prose-blockquote:bg-blue-50 prose-blockquote:p-10 prose-blockquote:rounded-[40px] prose-blockquote:not-italic prose-blockquote:font-bold prose-strong:text-slate-900 transition-all"
                        dangerouslySetInnerHTML={{ __html: post.content }} 
                    />

                    {/* Interaction Buttons (Post Content) */}
                    <div className="mt-24 pt-10 border-t border-slate-100 flex flex-wrap items-center justify-between gap-8">
                        <div className="flex items-center gap-4">
                            <button className="flex items-center gap-2 px-8 py-4 bg-slate-50 hover:bg-red-50 hover:text-red-500 rounded-3xl text-sm font-black uppercase tracking-widest transition-all group">
                                <Heart className="w-5 h-5 group-hover:fill-red-500 transition-all" /> Thả tim
                            </button>
                            <button className="flex items-center gap-2 px-8 py-4 bg-slate-50 hover:bg-blue-50 hover:text-blue-600 rounded-3xl text-sm font-black uppercase tracking-widest transition-all group">
                                <MessageSquare className="w-5 h-5" /> Bình luận
                            </button>
                        </div>

                        <div className="flex items-center gap-4">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Lan tỏa bài viết:</span>
                            <div className="flex gap-2">
                                <button className="p-4 bg-slate-50 hover:bg-[#1877F2] hover:text-white rounded-2xl transition-all shadow-sm"><Facebook className="w-5 h-5" /></button>
                                <button className="p-4 bg-slate-50 hover:bg-[#1DA1F2] hover:text-white rounded-2xl transition-all shadow-sm"><Twitter className="w-5 h-5" /></button>
                                <button onClick={copyToClipboard} className="p-4 bg-slate-50 hover:bg-emerald-500 hover:text-white rounded-2xl transition-all shadow-sm"><LinkIcon className="w-5 h-5" /></button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Author Bio Section */}
                <div className="mt-32 p-12 bg-[#0c0f17] rounded-[56px] text-white flex flex-col md:flex-row items-center gap-10 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/10 rounded-full blur-[100px]"></div>
                    <div className="w-32 h-32 rounded-[40px] bg-blue-600 flex items-center justify-center text-5xl font-black shrink-0 shadow-2xl rotate-3 group-hover:rotate-0 transition-transform">
                        {post.author.name.charAt(0)}
                    </div>
                    <div className="text-center md:text-left">
                        <p className="text-[10px] font-black text-blue-400 uppercase tracking-[0.3em] mb-2">Thông tin tác giả</p>
                        <h4 className="text-3xl font-black tracking-tight mb-4">{post.author.name}</h4>
                        <p className="text-slate-400 text-lg font-medium leading-relaxed max-w-xl">
                            Chuyên gia tư vấn kỹ thuật tại SmartBuild, đam mê chia sẻ kiến thức về vật liệu xây dựng thông minh và kiến trúc bền vững.
                        </p>
                    </div>
                </div>

                {/* Related Posts Section */}
                {relatedPosts.length > 0 && (
                    <div className="mt-48 space-y-12">
                         <div className="flex items-center justify-between">
                            <h3 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-4">
                                <BookOpen className="text-blue-600 w-8 h-8" /> 
                                BÀI VIẾT LIÊN QUAN
                            </h3>
                            <Link href="/blog" className="text-[10px] font-black text-blue-600 uppercase tracking-widest hover:translate-x-2 transition-transform flex items-center gap-2">
                                Xem tất cả <ChevronRight className="w-4 h-4" />
                            </Link>
                         </div>
                         <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
                            {relatedPosts.map(rp => (
                                <Link 
                                    href={`/blog/${rp.slug}`} 
                                    key={rp.id}
                                    className="group flex flex-col"
                                >
                                    <div className="aspect-square rounded-[40px] overflow-hidden mb-6 border border-slate-100 shadow-sm transition-all group-hover:-translate-y-2 group-hover:shadow-xl">
                                        <img src={rp.featuredImage} alt={rp.title} className="w-full h-full object-cover" />
                                    </div>
                                    <h4 className="text-xl font-black text-slate-900 leading-tight line-clamp-2 group-hover:text-blue-600 transition-colors">
                                        {rp.title}
                                    </h4>
                                    <p className="text-xs font-bold text-slate-400 mt-3 uppercase tracking-widest">
                                        {format(new Date(rp.publishedAt), 'dd MMM, yyyy', { locale: vi })}
                                    </p>
                                </Link>
                            ))}
                         </div>
                    </div>
                )}
            </article>
            <Footer />
        </div>
    )
}
