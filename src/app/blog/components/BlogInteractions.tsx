'use client'

import { useState, useEffect } from 'react'
import { MessageSquare, Heart, Facebook, Twitter, Link as LinkIcon, User, X, Bookmark, Mail, Send, Star, Shield } from 'lucide-react'
import Link from 'next/link'
import { format } from 'date-fns'
import toast from 'react-hot-toast'
import { useAuth } from '@/contexts/auth-context'

interface BlogInteractionsProps {
    slug: string
    title: string // Added title to props
    initialLikes: number
}

export default function BlogInteractions({ slug, title, initialLikes }: BlogInteractionsProps) {
    const { user, isAuthenticated } = useAuth()
    
    // Likes
    const [likes, setLikes] = useState(initialLikes)
    const [hasLiked, setHasLiked] = useState(false)
    
    // Comments
    const [comments, setComments] = useState<any[]>([])
    const [commentContent, setCommentContent] = useState('')
    const [loadingComments, setLoadingComments] = useState(true)
    const [commentLoading, setCommentLoading] = useState(false)
    
    // Save/Bookmark
    const [isSaving, setIsSaving] = useState(false)
    const [isSaved, setIsSaved] = useState(false)

    // Modals
    const [showComments, setShowComments] = useState(false)
    const [showCommentModal, setShowCommentModal] = useState(false)
    const [showGuestModal, setShowGuestModal] = useState(false)
    const [showSaveModal, setShowSaveModal] = useState(false)
    
    // Auth States
    const [guestAuth, setGuestAuth] = useState({ name: '', email: '' })
    const [pendingAction, setPendingAction] = useState<'LIKE' | 'COMMENT' | null>(null)

    useEffect(() => {
        fetchComments()
        const saved = localStorage.getItem('sb_guest_auth')
        if (saved) setGuestAuth(JSON.parse(saved))
    }, [slug])

    const fetchComments = async () => {
        try {
            const res = await fetch(`/api/blog/public/${slug}/comments`)
            const data = await res.json()
            if (data.success) setComments(data.data)
        } catch (error) { console.error(error) }
        finally { setLoadingComments(false) }
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

    const handleSave = async () => {
        if (!isAuthenticated && (!guestAuth.name || !guestAuth.email)) {
            setShowSaveModal(true)
            return
        }
        executeSave()
    }

    const executeSave = async () => {
        setIsSaving(true)
        const emailToUse = isAuthenticated ? user?.email : guestAuth.email
        const nameToUse = isAuthenticated ? user?.name : guestAuth.name

        if (!emailToUse) {
            toast.error('Vui lòng cung cấp email để nhận link bài viết')
            setShowSaveModal(true)
            setIsSaving(false)
            return
        }

        try {
            const res = await fetch('/api/blog/public/save', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: emailToUse,
                    name: nameToUse,
                    postTitle: title,
                    postUrl: window.location.href
                })
            })
            
            if (res.ok) {
                setIsSaved(true)
                toast.success('Đã gửi link bài viết về email của bạn!', { duration: 5000 })
            } else {
                toast.error('Gửi email không thành công. Thử lại sau nhé!')
            }
        } catch (error) {
            toast.error('Đã có lỗi xảy ra khi gửi email')
        } finally {
            setIsSaving(false)
        }
    }

    const handleCommentClick = () => {
        if (!isAuthenticated && !guestAuth.name) {
            setPendingAction('COMMENT')
            setShowGuestModal(true)
            return
        }
        setShowCommentModal(true)
    }

    const handleCommentSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!commentContent.trim()) {
            toast.error('Vui lòng điền nội dung bình luận')
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
                body: JSON.stringify({ name: nameToUse, email: emailToUse, content: commentContent })
            })
            const data = await res.json()
            if (data.success) {
                toast.success('Gửi bình luận thành công!')
                setComments([data.data, ...comments])
                setCommentContent('')
                setShowCommentModal(false)
                setShowComments(true)
            }
        } catch (error) { toast.error('Có lỗi xảy ra') }
        finally { setCommentLoading(false) }
    }

    const handleGuestSubmit = () => {
        if (!guestAuth.name) {
            toast.error('Vui lòng nhập họ tên của bạn')
            return
        }
        localStorage.setItem('sb_guest_auth', JSON.stringify(guestAuth))
        setShowGuestModal(false)
        if (pendingAction === 'LIKE') executeLike()
        if (pendingAction === 'COMMENT') setShowCommentModal(true)
        setPendingAction(null)
    }

    const handleSaveAsGuest = () => {
        if (!guestAuth.name || !guestAuth.email) {
            toast.error('Vui lòng nhập đầy đủ họ tên và email')
            return
        }
        localStorage.setItem('sb_guest_auth', JSON.stringify(guestAuth))
        setShowSaveModal(false)
        executeSave()
    }

    return (
        <div className="mt-24">
            <div className="pt-12 border-t border-neutral-100 flex flex-wrap items-center justify-between gap-8">
                <div className="flex items-center gap-3">
                    <button 
                        onClick={handleLike} 
                        className={`flex items-center gap-2 px-8 py-3.5 rounded-full text-xs font-black uppercase tracking-widest transition-all group border ${hasLiked ? 'bg-rose-50 border-rose-200 text-rose-500' : 'bg-neutral-50 border-neutral-100 hover:bg-rose-50 hover:border-rose-100 hover:text-rose-500'}`}
                    >
                        <Heart className={`w-4 h-4 transition-all ${hasLiked ? 'fill-rose-500' : 'group-hover:fill-rose-500'}`} /> 
                        {likes > 0 ? `${likes} Lượt thích` : 'Thả tim'}
                    </button>

                    <button 
                        onClick={handleSave}
                        disabled={isSaving}
                        className={`flex items-center gap-2 px-8 py-3.5 rounded-full text-xs font-black uppercase tracking-widest transition-all group border ${isSaved ? 'bg-emerald-50 border-emerald-200 text-emerald-600' : 'bg-neutral-50 border-neutral-100 hover:bg-emerald-50 hover:border-emerald-100 hover:text-emerald-500'}`}
                    >
                        {isSaving ? (
                            <Send className="w-4 h-4 animate-pulse" />
                        ) : (
                            <Bookmark className={`w-4 h-4 transition-all ${isSaved ? 'fill-emerald-600' : 'group-hover:fill-emerald-500'}`} />
                        )}
                        {isSaving ? 'Đang gửi...' : isSaved ? 'Đã lưu' : 'Lưu bài viết'}
                    </button>
                    
                    <div className="h-10 w-px bg-neutral-100 mx-2 hidden md:block"></div>

                    <div className="flex items-center gap-2 bg-neutral-50 p-1.5 rounded-full border border-neutral-100">
                        <button 
                            onClick={() => setShowComments(!showComments)}
                            className={`flex items-center gap-2 px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${showComments ? 'bg-white text-blue-600 shadow-sm' : 'text-neutral-400 hover:text-neutral-600'}`}
                        >
                            <MessageSquare className="w-3.5 h-3.5" /> 
                            {comments.length}
                        </button>
                        <button 
                            onClick={handleCommentClick}
                            className="flex items-center gap-2 px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-500/20"
                        >
                            Viết bình luận
                        </button>
                    </div>
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

            {showComments && (
                <div className="mt-12 animate-in fade-in slide-in-from-top-4 duration-500 bg-neutral-50/50 p-8 md:p-12 rounded-[48px] border border-neutral-100">
                    <h3 className="text-xl font-black text-slate-900 mb-10 pb-4 border-b border-neutral-200 flex items-center justify-between">
                       <span className="flex items-center gap-3">
                           <MessageSquare className="w-5 h-5 text-blue-600" /> Thảo luận bài viết
                       </span>
                       <span className="bg-white px-4 py-1.5 rounded-full text-xs text-neutral-400 border border-neutral-100">{comments.length} bình luận</span>
                    </h3>
                    
                    <div className="space-y-8">
                        {comments.map((comment: any) => (
                            <div key={comment.id} className="flex gap-5 group">
                                <div className="w-12 h-12 shrink-0 bg-white border border-neutral-100 rounded-2xl flex items-center justify-center text-sm font-black text-blue-600 shadow-sm group-hover:scale-110 transition-transform">
                                    {comment.name.charAt(0).toUpperCase()}
                                </div>
                                <div className="flex-1 bg-white p-6 md:p-8 rounded-[32px] border border-neutral-100 shadow-sm group-hover:shadow-md transition-all">
                                    <div className="flex items-center justify-between mb-3">
                                        <span className="font-black text-sm text-neutral-900 uppercase tracking-wide">{comment.name}</span>
                                        <span className="text-[10px] text-neutral-400 font-bold uppercase tracking-widest">
                                            {format(new Date(comment.createdAt), 'dd MMM, yyyy')}
                                        </span>
                                    </div>
                                    <p className="text-neutral-600 text-[15px] leading-relaxed font-medium">
                                        {comment.content}
                                    </p>
                                </div>
                            </div>
                        ))}
                        {comments.length === 0 && !loadingComments && (
                            <div className="py-20 text-center">
                                <MessageSquare className="w-12 h-12 text-neutral-100 mx-auto mb-4" />
                                <p className="text-sm text-neutral-400 font-bold uppercase tracking-widest italic">Hãy là người đầu tiên chia sẻ ý kiến!</p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {showCommentModal && (
                <div className="fixed inset-0 z-[201] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
                    <div className="bg-white rounded-[40px] p-10 max-w-2xl w-full shadow-2xl animate-in zoom-in-95 duration-300 relative">
                        <div className="flex justify-between items-center mb-10">
                            <div>
                                <h3 className="text-3xl font-black text-slate-900 tracking-tight mb-2">Chia sẻ cảm nghĩ</h3>
                                <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest flex items-center gap-2">
                                    <User className="w-3.5 h-3.5 text-blue-600" /> Đăng bài với tên: <span className="text-blue-600">{isAuthenticated ? user?.name : guestAuth.name}</span>
                                </p>
                            </div>
                            <button onClick={() => setShowCommentModal(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors"><X className="w-6 h-6" /></button>
                        </div>
                        
                        <form onSubmit={handleCommentSubmit} className="space-y-8">
                            <textarea 
                                value={commentContent}
                                onChange={e => setCommentContent(e.target.value)}
                                placeholder="Viết bình luận của bạn tại đây..."
                                className="w-full h-40 px-8 py-6 bg-slate-50 border border-slate-100 rounded-[32px] outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 focus:bg-white transition-all font-medium text-slate-800 text-lg shadow-inner"
                                autoFocus
                            ></textarea>

                            <div className="flex items-center justify-between gap-4">
                                <p className="text-[11px] font-bold text-neutral-400 italic">Bình luận của bạn sẽ được kiểm duyệt trước khi hiển thị công khai.</p>
                                <button
                                    type="submit"
                                    disabled={commentLoading}
                                    className="px-12 py-5 bg-blue-600 text-white rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-blue-700 transition-all shadow-xl shadow-blue-200 flex items-center gap-3 disabled:opacity-50"
                                >
                                    {commentLoading ? 'Đang gửi...' : 'Gửi bài đăng'}
                                    <Send className="w-4 h-4" />
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {showSaveModal && (
                <div className="fixed inset-0 z-[201] flex items-center justify-center p-4 md:p-6 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
                    <div className="bg-white rounded-[48px] max-w-4xl w-full shadow-2xl animate-in zoom-in-95 duration-300 relative overflow-hidden flex flex-col md:flex-row">
                        <div className="md:w-5/12 bg-gradient-to-br from-emerald-600 to-teal-700 p-10 md:p-14 text-white flex flex-col justify-between relative order-2 md:order-1">
                            <div className="absolute top-0 right-0 p-8 opacity-10">
                                <Bookmark className="w-32 h-32" fill="currentColor" />
                            </div>
                            
                            <div className="relative z-10">
                                <h3 className="text-3xl font-black tracking-tighter mb-6 leading-tight">Lưu trữ chuyên nghiệp</h3>
                                <ul className="space-y-6">
                                    {[
                                        { icon: Mail, text: 'Nhận link bài viết ngay qua Email cá nhân' },
                                        { icon: Star, text: 'Tài liệu kỹ thuật luôn sẵn sàng khi cần' },
                                        { icon: Shield, text: 'Thông tin hoàn toàn bảo mật và riêng tư' }
                                    ].map((item, i) => (
                                        <li key={i} className="flex items-center gap-4 group">
                                            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center group-hover:bg-white/20 transition-all">
                                                <item.icon className="w-5 h-5" />
                                            </div>
                                            <span className="text-sm font-bold opacity-90">{item.text}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            <div className="mt-12 space-y-3 relative z-10">
                                <Link 
                                    href={`/login?returnTo=/blog/${slug}`}
                                    className="block w-full py-4 bg-white text-emerald-600 rounded-2xl font-black uppercase tracking-widest text-xs text-center hover:bg-slate-50 transition-all shadow-lg shadow-black/10 active:scale-95"
                                >
                                    Đăng nhập ngay
                                </Link>
                                <Link 
                                    href={`/register?returnTo=/blog/${slug}`}
                                    className="block w-full py-4 bg-white/10 text-white border border-white/20 rounded-2xl font-black uppercase tracking-widest text-xs text-center hover:bg-white/20 transition-all active:scale-95"
                                >
                                    Tạo tài khoản mới
                                </Link>
                            </div>
                        </div>

                        <div className="md:w-7/12 p-10 md:p-14 bg-white order-1 md:order-2">
                            <div className="flex justify-between items-start mb-8">
                                <div>
                                    <h3 className="text-2xl font-black text-slate-900 tracking-tight mb-2">Lưu bài viết này</h3>
                                    <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest">Chúng tôi sẽ gửi link bài viết vào hòm thư của bạn</p>
                                </div>
                                <button onClick={() => setShowSaveModal(false)} className="p-3 hover:bg-slate-100 rounded-full transition-all active:scale-90"><X className="w-6 h-6" /></button>
                            </div>

                            <p className="text-slate-500 mb-8 font-medium text-sm leading-relaxed">
                                Hãy cho chúng tôi biết thông tin để có thể gửi lại tài liệu cho bạn một cách chính xác nhất nhé.
                            </p>
                            
                            <div className="space-y-4 mb-10">
                                <div className="group">
                                    <label className="block text-[10px] font-black text-slate-400 group-focus-within:text-emerald-600 uppercase tracking-[0.2em] mb-3 ml-4 transition-colors">Họ và tên của bạn</label>
                                    <div className="relative">
                                        <User className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 group-focus-within:text-emerald-500 transition-colors" />
                                        <input 
                                            type="text" 
                                            placeholder="VD: Nguyễn Văn Anh..."
                                            value={guestAuth.name}
                                            onChange={e => setGuestAuth({ ...guestAuth, name: e.target.value })}
                                            className="w-full pl-16 pr-6 py-5 bg-slate-50 border border-slate-100 rounded-[24px] outline-none focus:ring-4 focus:ring-emerald-500/5 focus:border-emerald-500 focus:bg-white transition-all font-bold text-slate-900 shadow-sm"
                                        />
                                    </div>
                                </div>
                                <div className="group">
                                    <label className="block text-[10px] font-black text-slate-400 group-focus-within:text-emerald-600 uppercase tracking-[0.2em] mb-3 ml-4 transition-colors">Email nhận bài viết</label>
                                    <div className="relative">
                                        <Mail className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 group-focus-within:text-emerald-500 transition-colors" />
                                        <input 
                                            type="email" 
                                            placeholder="email@example.com"
                                            value={guestAuth.email}
                                            onChange={e => setGuestAuth({ ...guestAuth, email: e.target.value })}
                                            className="w-full pl-16 pr-6 py-5 bg-slate-50 border border-slate-100 rounded-[24px] outline-none focus:ring-4 focus:ring-emerald-500/5 focus:border-emerald-500 focus:bg-white transition-all font-bold text-slate-900 shadow-sm"
                                        />
                                    </div>
                                </div>
                            </div>

                            <button 
                                onClick={handleSaveAsGuest}
                                className="w-full py-5 bg-emerald-600 text-white rounded-[24px] font-black uppercase tracking-[0.2em] text-xs hover:bg-emerald-700 transition-all shadow-xl shadow-emerald-200 active:scale-[0.98]"
                            >
                                Gửi tài liệu cho tôi
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {showGuestModal && (
                <div className="fixed inset-0 z-[201] flex items-center justify-center p-4 md:p-6 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
                    <div className="bg-white rounded-[48px] max-w-4xl w-full shadow-2xl animate-in zoom-in-95 duration-300 relative overflow-hidden flex flex-col md:flex-row">
                        <div className="md:w-5/12 bg-gradient-to-br from-blue-600 to-indigo-700 p-10 md:p-14 text-white flex flex-col justify-between relative order-2 md:order-1">
                            <div className="absolute top-0 right-0 p-8 opacity-10">
                                <User className="w-32 h-32" fill="currentColor" />
                            </div>
                            
                            <div className="relative z-10">
                                <h3 className="text-3xl font-black tracking-tighter mb-6 leading-tight">Tham gia cộng đồng SmartBuild</h3>
                                <ul className="space-y-6">
                                    {[
                                        { icon: Heart, text: 'Quản lý danh sách yêu thích cá nhân' },
                                        { icon: MessageSquare, text: 'Thảo luận cùng cộng đồng chuyên gia' },
                                        { icon: Star, text: 'Nhận đặc quyền tri ân từ hệ thống' }
                                    ].map((item, i) => (
                                        <li key={i} className="flex items-center gap-4 group">
                                            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center group-hover:bg-white/20 transition-all">
                                                <item.icon className="w-5 h-5" />
                                            </div>
                                            <span className="text-sm font-bold opacity-90">{item.text}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            <div className="mt-12 space-y-3 relative z-10">
                                <Link 
                                    href={`/login?returnTo=/blog/${slug}`}
                                    className="block w-full py-4 bg-white text-blue-600 rounded-2xl font-black uppercase tracking-widest text-xs text-center hover:bg-slate-50 transition-all shadow-lg shadow-black/10 active:scale-95"
                                >
                                    Đăng nhập ngay
                                </Link>
                                <Link 
                                    href={`/register?returnTo=/blog/${slug}`}
                                    className="block w-full py-4 bg-white/10 text-white border border-white/20 rounded-2xl font-black uppercase tracking-widest text-xs text-center hover:bg-white/20 transition-all active:scale-95"
                                >
                                    Tạo tài khoản mới
                                </Link>
                            </div>
                        </div>

                        <div className="md:w-7/12 p-10 md:p-14 bg-white order-1 md:order-2">
                            <div className="flex justify-between items-start mb-8">
                                <div>
                                    <h3 className="text-2xl font-black text-slate-900 tracking-tight mb-2">Thông tin phản hồi</h3>
                                    <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest">Chào mừng bạn ghé thăm bài viết</p>
                                </div>
                                <button onClick={() => setShowGuestModal(false)} className="p-3 hover:bg-slate-100 rounded-full transition-all active:scale-90"><X className="w-6 h-6" /></button>
                            </div>

                            <p className="text-slate-500 mb-8 font-medium text-sm leading-relaxed">
                                Bạn hiện chưa đăng nhập. Để cuộc thảo luận thêm chuyên nghiệp, hãy điền họ tên của bạn bên dưới nhé.
                            </p>
                            
                            <div className="space-y-4 mb-10">
                                <div className="group">
                                    <label className="block text-[10px] font-black text-slate-400 group-focus-within:text-blue-600 uppercase tracking-[0.2em] mb-3 ml-4 transition-colors">Họ và tên của bạn</label>
                                    <div className="relative">
                                        <User className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 group-focus-within:text-blue-500 transition-colors" />
                                        <input 
                                            type="text" 
                                            placeholder="VD: Nguyễn Văn Anh..."
                                            value={guestAuth.name}
                                            onChange={e => setGuestAuth({ ...guestAuth, name: e.target.value })}
                                            className="w-full pl-16 pr-6 py-5 bg-slate-50 border border-slate-100 rounded-[24px] outline-none focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500 focus:bg-white transition-all font-bold text-slate-900 shadow-sm"
                                        />
                                    </div>
                                </div>
                                <div className="group">
                                    <label className="block text-[10px] font-black text-slate-400 group-focus-within:text-blue-600 uppercase tracking-[0.2em] mb-3 ml-4 transition-colors">Email (Tùy chọn)</label>
                                    <div className="relative">
                                        <Mail className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 group-focus-within:text-blue-500 transition-colors" />
                                        <input 
                                            type="email" 
                                            placeholder="email@vidu.com"
                                            value={guestAuth.email}
                                            onChange={e => setGuestAuth({ ...guestAuth, email: e.target.value })}
                                            className="w-full pl-16 pr-6 py-5 bg-slate-50 border border-slate-100 rounded-[24px] outline-none focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500 focus:bg-white transition-all font-bold text-slate-900 shadow-sm"
                                        />
                                    </div>
                                </div>
                            </div>

                            <button 
                                onClick={handleGuestSubmit}
                                disabled={!guestAuth.name}
                                className="w-full py-5 bg-blue-600 text-white rounded-[24px] font-black uppercase tracking-[0.2em] text-xs hover:bg-blue-700 transition-all shadow-xl shadow-blue-200 active:scale-[0.98]"
                            >
                                Tiếp tục tương tác
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
