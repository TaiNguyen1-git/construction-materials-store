'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { 
    ArrowLeft, 
    Bookmark, 
    Calendar, 
    Trash2, 
    ExternalLink, 
    BookOpen,
    Loader2,
    Search
} from 'lucide-react'
import { format } from 'date-fns'
import { vi } from 'date-fns/locale'
import toast from 'react-hot-toast'
import { fetchWithAuth } from '@/lib/api-client'
import { Skeleton } from '@/components/ui/skeleton'

export default function SavedPostsPage() {
    const [savedPosts, setSavedPosts] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')

    useEffect(() => {
        fetchSavedPosts()
    }, [])

    const fetchSavedPosts = async () => {
        setLoading(true)
        try {
            const res = await fetchWithAuth('/api/blog/public/saved-posts')
            const data = await res.json()
            if (data.success) {
                setSavedPosts(data.data)
            }
        } catch (error) {
            toast.error('Không thể tải danh sách bài viết')
        } finally {
            setLoading(false)
        }
    }

    const handleUnsave = async (postId: string) => {
        if (!window.confirm('Bạn có chắc chắn muốn bỏ lưu bài viết này?')) return

        try {
            const res = await fetchWithAuth('/api/blog/public/save', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ postId })
            })
            
            if (res.ok) {
                setSavedPosts(prev => prev.filter(item => item.postId !== postId))
                toast.success('Đã bỏ lưu bài viết')
            } else {
                toast.error('Có lỗi xảy ra, vui lòng thử lại')
            }
        } catch (error) {
            toast.error('Lỗi kết nối hệ thống')
        }
    }

    const filteredPosts = savedPosts.filter(item => 
        item.post.title.toLowerCase().includes(searchTerm.toLowerCase())
    )

    return (
        <div className="min-h-screen bg-[#F8FAFC] pb-20 font-sans">
            {/* Background Decor */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
                <div className="absolute top-[-10%] right-[-5%] w-[40%] h-[40%] bg-emerald-400/5 blur-[120px] rounded-full"></div>
                <div className="absolute bottom-[10%] left-[-5%] w-[35%] h-[35%] bg-blue-400/5 blur-[100px] rounded-full"></div>
            </div>

            <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 space-y-12">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
                    <div className="space-y-6">
                        <Link href="/account" className="group inline-flex items-center gap-3 bg-white border border-slate-200 px-5 py-2.5 rounded-2xl shadow-sm hover:border-blue-200 transition-all">
                            <ArrowLeft className="w-4 h-4 text-slate-400 group-hover:text-blue-600 transition-colors" />
                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Trở về tài khoản</span>
                        </Link>
                        
                        <div>
                            <div className="flex items-center gap-4 mb-3">
                                <div className="p-3 bg-emerald-50 rounded-2xl text-emerald-600 border border-emerald-100">
                                    <Bookmark className="w-6 h-6" fill="currentColor" />
                                </div>
                                <h1 className="text-4xl font-black text-slate-900 tracking-tighter uppercase leading-none">Bài viết đã lưu</h1>
                            </div>
                            <p className="text-slate-500 font-medium text-lg ml-1">Quản lý kho tàng kiến thức bạn đã tích lũy tại SmartBuild.</p>
                        </div>
                    </div>

                    {/* Search Bar */}
                    <div className="relative group w-full md:w-80">
                        <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
                        <input 
                            type="text" 
                            placeholder="Tìm kiếm bài viết..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-12 pr-6 py-4 bg-white border border-slate-200 rounded-[28px] outline-none focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500 transition-all font-bold text-slate-900 shadow-sm"
                        />
                    </div>
                </div>

                {/* List Container */}
                <div className="space-y-6">
                    {loading ? (
                        Array.from({ length: 3 }).map((_, i) => (
                            <div key={i} className="bg-white rounded-[40px] p-8 border border-slate-100 shadow-sm flex flex-col md:flex-row gap-8">
                                <Skeleton className="w-full md:w-64 h-40 rounded-3xl" />
                                <div className="flex-1 space-y-4">
                                    <Skeleton className="h-4 w-24" />
                                    <Skeleton className="h-8 w-full" />
                                    <Skeleton className="h-4 w-2/3" />
                                </div>
                            </div>
                        ))
                    ) : filteredPosts.length > 0 ? (
                        filteredPosts.map((item) => (
                            <div key={item.id} className="group bg-white rounded-[40px] p-6 border border-slate-100 hover:border-emerald-200 shadow-sm hover:shadow-2xl hover:shadow-emerald-500/5 transition-all relative overflow-hidden flex flex-col md:flex-row gap-8">
                                {/* Thumbnail */}
                                <Link href={`/blog/${item.post.slug}`} className="w-full md:w-64 h-44 rounded-3xl overflow-hidden shrink-0 relative block">
                                    <img 
                                        src={item.post.featuredImage || ''} 
                                        alt={item.post.title}
                                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                                    />
                                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all flex items-center justify-center">
                                        <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-white scale-0 group-hover:scale-100 transition-transform duration-300">
                                            <ExternalLink className="w-5 h-5" />
                                        </div>
                                    </div>
                                </Link>

                                {/* Content */}
                                <div className="flex-1 flex flex-col py-2">
                                    <div className="flex items-center gap-3 mb-4">
                                        <span className="px-3 py-1 bg-emerald-50 text-emerald-600 rounded-lg text-[9px] font-black uppercase tracking-widest border border-emerald-100">
                                            {item.post.author?.name || 'Tác giả'}
                                        </span>
                                        <span className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                            <Calendar className="w-3.5 h-3.5" />
                                            {format(new Date(item.post.publishedAt || new Date()), 'dd MMM, yyyy', { locale: vi })}
                                        </span>
                                    </div>

                                    <Link href={`/blog/${item.post.slug}`} className="block group/title">
                                        <h3 className="text-2xl font-black text-slate-900 tracking-tight leading-tight group-hover/title:text-blue-600 transition-colors mb-4 line-clamp-2">
                                            {item.post.title}
                                        </h3>
                                    </Link>

                                    <div className="mt-auto flex items-center justify-between pt-6 border-t border-slate-50">
                                        <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">
                                            Lưu vào {format(new Date(item.createdAt), 'dd MMMM', { locale: vi })}
                                        </p>
                                        
                                        <div className="flex gap-2">
                                            <button 
                                                onClick={() => handleUnsave(item.postId)}
                                                className="p-3 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-2xl transition-all active:scale-95"
                                                title="Bỏ lưu bài viết"
                                            >
                                                <Trash2 className="w-5 h-5" />
                                            </button>
                                            <Link 
                                                href={`/blog/${item.post.slug}`}
                                                className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-700 shadow-lg shadow-blue-500/20 transition-all active:scale-95"
                                            >
                                                Đọc ngay <BookOpen className="w-4 h-4" />
                                            </Link>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="py-24 flex flex-col items-center justify-center bg-white rounded-[48px] border border-dashed border-slate-200 text-center px-6">
                            <div className="w-24 h-24 bg-slate-50 rounded-[40px] flex items-center justify-center text-slate-200 mb-8">
                                <Bookmark className="w-12 h-12" />
                            </div>
                            <h3 className="text-2xl font-black text-slate-900 tracking-tight uppercase mb-4">Chưa có bài viết nào</h3>
                            <p className="text-slate-500 font-medium max-w-sm mb-10 leading-relaxed">
                                Bạn chưa lưu bài viết nào để xem lại. Hãy bắt đầu khám phá các bài viết hữu ích tại chuyên mục tin tức nhé!
                            </p>
                            <Link href="/blog" className="px-8 py-4 bg-emerald-600 text-white rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-emerald-700 shadow-xl shadow-emerald-500/20 transition-all active:scale-95">
                                Khám phá Blog ngay
                            </Link>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
