'use client'

import { useState, useEffect, use } from 'react'
import Header from '@/components/Header'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { 
    Calendar, User, Eye, ArrowLeft, Share2, Facebook, 
    Twitter, Link as LinkIcon, BookOpen, Clock, 
    ChevronRight, Sparkles, MessageSquare, Heart,
    TrendingUp, ShoppingCart, ArrowUpRight, List, Mail
} from 'lucide-react'
import ProductCard from '@/components/marketplace/ProductCard'
import { format } from 'date-fns'
import { vi } from 'date-fns/locale'
import toast, { Toaster } from 'react-hot-toast'
import SmartInventoryNudge from '@/components/blog/SmartInventoryNudge'
import { useAuth } from '@/contexts/auth-context'

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
    likesCount: number
}

export default function BlogDetailPage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = use(params)
    const [post, setPost] = useState<Post | null>(null)
    const [relatedPosts, setRelatedPosts] = useState<Post[]>([])
    const [relatedProducts, setRelatedProducts] = useState<any[]>([])
    const [trendingPosts, setTrendingPosts] = useState<Post[]>([])
    const [toc, setToc] = useState<{ id: string, text: string, level: number }[]>([])
    const [loading, setLoading] = useState(true)
    const [readingProgress, setReadingProgress] = useState(0)

    const router = useRouter()
    const { user, isAuthenticated } = useAuth()

    // Interaction states
    const [likes, setLikes] = useState(0)
    const [hasLiked, setHasLiked] = useState(false)
    const [emailSub, setEmailSub] = useState('')
    const [subLoading, setSubLoading] = useState(false)
    
    // Guest Interaction states
    const [guestAuth, setGuestAuth] = useState({ name: '', email: '' })
    const [showGuestModal, setShowGuestModal] = useState(false)
    const [pendingAction, setPendingAction] = useState<'LIKE' | 'COMMENT' | null>(null)

    // Comments
    const [comments, setComments] = useState<any[]>([])
    const [commentData, setCommentData] = useState({ content: '' })
    const [commentLoading, setCommentLoading] = useState(false)
    const [showComments, setShowComments] = useState(false)

    useEffect(() => {
        if (!isAuthenticated) {
            const saved = localStorage.getItem('sb_guest_auth')
            if (saved) setGuestAuth(JSON.parse(saved))
        }
    }, [isAuthenticated])

    useEffect(() => {
        if (isAuthenticated && user) {
            setEmailSub(user.email || '')
            setCommentData(prev => ({ ...prev, name: user.name || '', email: user.email || '' }))
        }
    }, [isAuthenticated, user])

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
        // Fire independent fetches concurrently to avoid waterfall latency
        fetchTrending()
        fetchComments()

        const fetchPost = async () => {
            try {
                const res = await fetch(`/api/blog/public/${slug}`)
                const data = await res.json()
                if (data.success) {
                    setPost(data.data)
                    setLikes(data.data.likesCount || 0)
                    generateToC(data.data.content)
                    // Fetch related posts ONLY AFTER we have the category
                    if (data.data.category?.id) {
                        fetchRelated(data.data.category.id, data.data.id)
                        fetchRelatedProducts(data.data.category.id)
                    }
                }
            } catch (err) {
                console.error(err)
            } finally {
                setLoading(false)
            }
        }
        fetchPost()
    }, [slug]) // Include slug in dependencies as both fetchPost and fetchComments rely on it

    const fetchTrending = async () => {
        try {
            const res = await fetch('/api/blog/public?limit=5&sortBy=viewCount')
            const data = await res.json()
            if (data.success) {
                const postsList = Array.isArray(data.data) ? data.data : (data.data.posts || [])
                setTrendingPosts(postsList)
            }
        } catch (err) { console.error(err) }
    }

    const fetchRelatedProducts = async (categoryId: string) => {
        try {
            const res = await fetch(`/api/products/related?categoryId=${categoryId}&limit=4`)
            const data = await res.json()
            if (data.success) {
                setRelatedProducts(data.data)
            }
        } catch (err) { console.error(err) }
    }

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

    const handleLike = async () => {
        if (!isAuthenticated && !guestAuth.name) {
            setPendingAction('LIKE')
            setShowGuestModal(true)
            return
        }
        executeLike()
    }

    const executeLike = async () => {
        if (hasLiked) {
            toast.success('Bạn đã thả tim bài viết này rồi!')
            return
        }
        try {
            setLikes(prev => prev + 1)
            setHasLiked(true)
            await fetch(`/api/blog/public/${slug}/like`, { method: 'POST' })
            toast.success('Cảm ơn bạn đã yêu thích bài viết!')
        } catch (error) { console.error(error) }
    }

    const handleSubscribe = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!emailSub) return
        setSubLoading(true)
        try {
            const res = await fetch('/api/newsletter/subscribe', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: emailSub })
            })
            if (res.ok) {
                toast.success('Đăng ký nhận cẩm nang thành công!')
                setEmailSub('')
            }
        } catch (error) { toast.error('Lỗi khi đăng ký') }
        finally { setSubLoading(false) }
    }

    const fetchComments = async () => {
        try {
            const res = await fetch(`/api/blog/public/${slug}/comments`)
            const data = await res.json()
            if (data.success) setComments(data.data)
        } catch (error) { console.error(error) }
    }

    const submitComment = async (e?: React.FormEvent) => {
        if (e) e.preventDefault()
        if (!commentData.content) {
            toast.error('Vui lòng điền nội dung bình luận')
            return
        }
        if (!isAuthenticated && !guestAuth.name) {
            setPendingAction('COMMENT')
            setShowGuestModal(true)
            return
        }
        executeComment()
    }

    const executeComment = async () => {
        setCommentLoading(true)
        const nameToUse = isAuthenticated ? user?.name : guestAuth.name
        const emailToUse = isAuthenticated ? user?.email : guestAuth.email
        
        try {
            const res = await fetch(`/api/blog/public/${slug}/comments`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: nameToUse, email: emailToUse, content: commentData.content })
            })
            const data = await res.json()
            if (data.success) {
                toast.success('Gửi bình luận thành công!')
                setComments([data.data, ...comments])
                setCommentData({ content: '' })
            }
        } catch (error) { toast.error('Có lỗi xảy ra') }
        finally { setCommentLoading(false) }
    }

    const handleGuestSubmit = () => {
        if (!guestAuth.name) return
        localStorage.setItem('sb_guest_auth', JSON.stringify(guestAuth))
        setShowGuestModal(false)
        if (pendingAction === 'LIKE') executeLike()
        if (pendingAction === 'COMMENT') executeComment()
        setPendingAction(null)
    }

    const generateToC = (content: string) => {
        const doc = new DOMParser().parseFromString(content, 'text/html')
        const headings = Array.from(doc.querySelectorAll('h1, h2, h3'))
        const tocData = headings.map((h, i) => {
            const id = `heading-${i}`
            return { id, text: h.textContent || '', level: parseInt(h.tagName[1]) }
        })
        setToc(tocData)
    }

    const calculateReadingTime = (content: string) => {
        const wordsPerMinute = 200
        const text = content.replace(/<[^>]*>/g, '')
        const words = text.split(/\s+/).length
        return Math.ceil(words / wordsPerMinute)
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
        <div className="min-h-screen bg-white font-sans selection:bg-primary-100 selection:text-primary-900">
            <Header />
            <Toaster position="bottom-right" />

            {/* Reading Progress Indicator */}
            <div 
                className="fixed top-0 left-0 h-1.5 bg-primary-600 z-[100] transition-all duration-300 shadow-[0_0_10px_rgba(37,99,235,0.3)]"
                style={{ width: `${readingProgress}%` }}
            />

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
                <header className="mb-16 animate-in fade-in slide-in-from-bottom-8 duration-700">
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
                                {format(new Date(post.publishedAt), 'dd MMMM, yyyy', { locale: vi })}
                            </div>
                            <span className="w-1 h-1 rounded-full bg-neutral-200 hidden md:block"></span>
                            <div className="flex items-center gap-2">
                                <Clock className="w-3.5 h-3.5 text-emerald-500" /> 
                                {Math.ceil(post.content.length / 1000)} phút đọc
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
                    <div className="relative group mb-20 animate-in zoom-in-95 duration-1000">
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
                    {/* Left Sticky Sidebar (ToC) */}
                    <aside className="hidden xl:block w-64 shrink-0">
                        <div className="sticky top-32 space-y-10">

                            {/* Back Button Integrated into Sidebar */}
                            <Link 
                                href="/blog"
                                className="group inline-flex items-center gap-3 bg-white border border-neutral-100 px-6 py-4 rounded-full shadow-sm hover:shadow-md hover:-translate-x-2 transition-all text-neutral-400 hover:text-blue-600"
                            >
                                <ArrowLeft className="w-4 h-4" />
                                <span className="text-[10px] font-black uppercase tracking-widest">Trở về bài viết</span>
                            </Link>

                            {toc.length > 0 && (
                                <div className="space-y-6">
                                    <h3 className="text-[10px] font-black text-neutral-400 uppercase tracking-[0.3em] flex items-center gap-3">
                                        <List className="w-3.5 h-3.5" /> MỤC LỤC
                                    </h3>
                                    <div className="space-y-4">
                                        {toc.map((item) => (
                                            <a 
                                                key={item.id}
                                                href={`#${item.id}`}
                                                className={`block text-xs font-bold leading-relaxed transition-all hover:text-primary-600 ${item.level === 3 ? 'pl-4 text-neutral-400' : 'text-neutral-600'}`}
                                            >
                                                {item.text}
                                            </a>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Newsletter Mini Widget */}
                            <form onSubmit={handleSubscribe} className="p-8 bg-blue-50 border border-blue-100 rounded-[32px] text-blue-900 shadow-sm">
                                <Mail className="w-6 h-6 text-blue-600 mb-6" />
                                <h4 className="text-sm font-black mb-4 leading-tight">Nhận cẩm nang xây dựng</h4>
                                <p className="text-[10px] text-blue-600/70 font-medium leading-relaxed mb-6">Mẹo tối ưu chi phí và kỹ thuật mới mỗi tuần.</p>
                                
                                {isAuthenticated && user ? (
                                    <div className="mb-4">
                                        <div className="w-full bg-white border border-blue-100 rounded-xl px-4 py-3 text-[11px] font-bold text-blue-900 flex items-center justify-between">
                                            <span className="truncate">{user.email}</span>
                                            <Sparkles className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                                        </div>
                                    </div>
                                ) : (
                                    <input 
                                        type="email" 
                                        required
                                        value={emailSub}
                                        onChange={(e) => setEmailSub(e.target.value)}
                                        placeholder="Email của bạn..." 
                                        className="w-full bg-white border border-blue-200 rounded-xl px-4 py-3 text-[11px] outline-none focus:ring-2 focus:ring-blue-500 mb-4 transition-all" 
                                    />
                                )}
                                
                                <button type="submit" disabled={subLoading} className="w-full py-3 bg-blue-600 rounded-xl text-[10px] font-black uppercase text-white tracking-widest hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/30 disabled:opacity-50">
                                    {subLoading ? 'Đang gửi...' : 'Đăng ký nhận'}
                                </button>
                            </form>
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
                            dangerouslySetInnerHTML={{ __html: post.content }} 
                        />

                        {/* Interaction Buttons (Post Content) */}
                        <div className="mt-24 pt-12 border-t border-neutral-100 flex flex-wrap items-center justify-between gap-8">
                            <div className="flex items-center gap-3">
                                <button 
                                    onClick={handleLike} 
                                    className={`flex items-center gap-2 px-8 py-3.5 rounded-full text-xs font-black uppercase tracking-widest transition-all group border ${hasLiked ? 'bg-rose-50 border-rose-200 text-rose-500' : 'bg-neutral-50 border-neutral-100 hover:bg-rose-50 hover:border-rose-100 hover:text-rose-500'}`}
                                >
                                    <Heart className={`w-4 h-4 transition-all ${hasLiked ? 'fill-rose-500' : 'group-hover:fill-rose-500'}`} /> 
                                    {likes > 0 ? `${likes} Lượt thích` : 'Thả tim'}
                                </button>
                                <button 
                                    onClick={() => setShowComments(!showComments)}
                                    className={`flex items-center gap-2 px-8 py-3.5 rounded-full text-xs font-black uppercase tracking-widest transition-all border ${showComments ? 'bg-blue-50 border-blue-200 text-blue-600' : 'bg-neutral-50 border-neutral-100 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-100'}`}
                                >
                                    <MessageSquare className="w-4 h-4" /> 
                                    {comments.length > 0 ? `${comments.length} Bình luận` : 'Bình luận'}
                                </button>
                            </div>

                            <div className="flex items-center gap-6">
                                <span className="text-[10px] font-black text-neutral-400 uppercase tracking-[0.2em]">Chia sẻ:</span>
                                <div className="flex gap-2.5">
                                    <button className="w-11 h-11 flex items-center justify-center bg-neutral-50 hover:bg-[#1877F2] hover:text-white rounded-full transition-all border border-neutral-100"><Facebook className="w-4 h-4" /></button>
                                    <button className="w-11 h-11 flex items-center justify-center bg-neutral-50 hover:bg-[#1DA1F2] hover:text-white rounded-full transition-all border border-neutral-100"><Twitter className="w-4 h-4" /></button>
                                    <button onClick={copyToClipboard} className="w-11 h-11 flex items-center justify-center bg-neutral-50 hover:bg-emerald-500 hover:text-white rounded-full transition-all border border-neutral-100"><LinkIcon className="w-4 h-4" /></button>
                                </div>
                            </div>
                        </div>

                        {/* Comments Section */}
                        {showComments && (
                            <div className="mt-12 animate-in fade-in slide-in-from-top-4 duration-500 bg-neutral-50/50 p-8 rounded-[40px] border border-neutral-100">
                                <h3 className="text-xl font-black text-slate-900 mb-8 border-b border-neutral-200 pb-4 flex items-center gap-3">
                                    <MessageSquare className="w-5 h-5 text-blue-600" /> Thảo luận ({comments.length})
                                </h3>
                                
                                <form onSubmit={submitComment} className="mb-12 bg-white p-6 rounded-[24px] shadow-sm border border-neutral-100">
                                    {(isAuthenticated && user) || guestAuth.name ? (
                                        <div className="flex items-center gap-3 mb-6 px-2">
                                            <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center font-black text-xs">
                                                {(user?.name || guestAuth.name || 'G').charAt(0).toUpperCase()}
                                            </div>
                                            <div>
                                                <div className="text-[11px] font-black text-neutral-400 uppercase tracking-widest">Đang bình luận với tên</div>
                                                <div className="text-sm font-bold text-neutral-900">{user?.name || guestAuth.name}</div>
                                            </div>
                                        </div>
                                    ) : null}
                                    <textarea 
                                        placeholder="Ý kiến của bạn về bài viết..." required rows={3}
                                        value={commentData.content} onChange={e => setCommentData({...commentData, content: e.target.value})}
                                        className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl text-sm outline-none focus:ring-2 focus:border-blue-500 transition-all resize-none mb-4"
                                    ></textarea>
                                    <div className="flex justify-end">
                                        <button type="submit" disabled={commentLoading} className="px-8 py-3 bg-blue-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-700 transition-all shadow-md disabled:opacity-50">
                                            {commentLoading ? 'Đang gửi...' : 'Gửi bình luận'}
                                        </button>
                                    </div>
                                </form>

                                <div className="space-y-6">
                                    {comments.map((comment: any) => (
                                        <div key={comment.id} className="flex gap-4">
                                            <div className="w-10 h-10 shrink-0 bg-neutral-200 rounded-full flex items-center justify-center text-sm font-black text-neutral-500">
                                                {comment.name.charAt(0).toUpperCase()}
                                            </div>
                                            <div className="flex-1 bg-white p-5 rounded-[24px] border border-neutral-100 shadow-sm">
                                                <div className="flex items-center gap-3 mb-2">
                                                    <span className="font-bold text-sm text-neutral-900">{comment.name}</span>
                                                    <span className="text-[10px] text-neutral-400 font-medium">
                                                        {format(new Date(comment.createdAt), 'dd/MM/yyyy HH:mm')}
                                                    </span>
                                                </div>
                                                <p className="text-sm text-neutral-600 leading-relaxed font-medium">
                                                    {comment.content}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                    {comments.length === 0 && (
                                        <p className="text-center text-sm text-neutral-400 font-medium py-8 italic">Chưa có bình luận nào. Hãy là người đầu tiên chia sẻ ý kiến!</p>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Sidebar Content */}
                    <aside className="w-full lg:w-96 space-y-12">
                        {/* Trending Section */}
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
                                                <span>{format(new Date(tp.publishedAt), 'dd MMM')}</span>
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

                {/* Author Bio Section - Redesigned for Light Theme */}
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

                {/* Recommended Products for Conversion */}
                {relatedProducts.length > 0 && (
                    <div className="mt-48 pt-24 border-t border-slate-100">
                        <div className="mb-16">
                            <h3 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-4">
                                <ShoppingCart className="text-emerald-500 w-8 h-8" /> 
                                VẬT TƯ ĐƯỢC KHUYÊN DÙNG
                            </h3>
                            <p className="text-slate-500 font-medium mt-3 max-w-2xl">
                                Dựa trên nội dung bài viết, chúng tôi gợi ý các loại vật liệu xây dựng chính hãng đang có sẵn tại kho với mức giá ưu đãi nhất.
                            </p>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                            {relatedProducts.map(product => (
                                <ProductCard 
                                    key={product.id} 
                                    product={product} 
                                />
                            ))}
                        </div>
                    </div>
                )}

                {/* Related Posts Section */}
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
                                        <img src={rp.featuredImage} alt={rp.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000" />
                                    </div>
                                    <h4 className="text-xl font-black text-slate-900 leading-tight line-clamp-2 group-hover:text-primary-600 transition-colors">
                                        {rp.title}
                                    </h4>
                                    <div className="flex items-center gap-3 mt-4">
                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                            {format(new Date(rp.publishedAt), 'dd MMM, yyyy', { locale: vi })}
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
