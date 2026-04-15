'use client'

import { useState, useEffect } from 'react'
import { MessageSquare, Heart, Facebook, Twitter, Link as LinkIcon, User, X, Bookmark, Mail, Send } from 'lucide-react'
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
    const [showComments, setShowComments] = useState(false)
    const [showCommentModal, setShowCommentModal] = useState(false)
    
    // Save/Bookmark
    const [isSaving, setIsSaving] = useState(false)
    const [isSaved, setIsSaved] = useState(false)

    // Guest Modal
    const [guestAuth, setGuestAuth] = useState({ name: '', email: '' })
    const [showGuestModal, setShowGuestModal] = useState(false)
    const [pendingAction, setPendingAction] = useState<'LIKE' | 'COMMENT' | 'SAVE' | null>(null)

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
            setPendingAction('SAVE')
            setShowGuestModal(true)
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
            setPendingAction('SAVE')
            setShowGuestModal(true)
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
                setShowComments(true) // Show comments list to see the new one
            }
        } catch (error) { toast.error('Có lỗi xảy ra') }
        finally { setCommentLoading(false) }
    }

    const handleGuestSubmit = () => {
        if (!guestAuth.name) {
            toast.error('Vui lòng nhập tên của bạn')
            return
        }
        if (pendingAction === 'SAVE' && !guestAuth.email) {
            toast.error('Vui lòng nhập email để chúng mình gửi link bài viết nhé')
            return
        }

        localStorage.setItem('sb_guest_auth', JSON.stringify(guestAuth))
        setShowGuestModal(false)
        
        if (pendingAction === 'LIKE') executeLike()
        if (pendingAction === 'COMMENT') setShowCommentModal(true)
        if (pendingAction === 'SAVE') executeSave()
        
        setPendingAction(null)
    }

    return (
        <div className="mt-24">
            {/* Interaction Buttons */}
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
                        {isSaving ? 'Đang gửi...' : isSaved ? 'Đã lưu' : 'Lưu lại'}
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

            {/* Comments List Section */}
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

            {/* Comment Submission Modal */}
            {showCommentModal && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
                    <div className="bg-white rounded-[48px] p-8 md:p-12 max-w-2xl w-full shadow-2xl animate-in zoom-in-95 duration-300 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-full blur-3xl -mr-16 -mt-16 opacity-50"></div>
                        
                        <div className="flex justify-between items-center mb-10 relative z-10">
                            <div>
                                <h3 className="text-2xl font-black text-slate-900 tracking-tight mb-1">Gửi bình luận</h3>
                                <p className="text-xs font-bold text-neutral-400 uppercase tracking-widest">Chia sẻ suy nghĩ của bạn với cộng đồng</p>
                            </div>
                            <button onClick={() => setShowCommentModal(false)} className="p-3 bg-neutral-50 hover:bg-neutral-100 rounded-full transition-colors text-neutral-400 hover:text-neutral-900">
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        <form onSubmit={handleCommentSubmit} className="relative z-10">
                            <div className="mb-8 flex items-center gap-4 bg-neutral-50 p-4 rounded-3xl border border-neutral-100">
                                <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-black text-sm">
                                    {(user?.name || guestAuth.name || 'G').charAt(0).toUpperCase()}
                                </div>
                                <div>
                                    <div className="text-[10px] font-black text-neutral-400 uppercase tracking-[0.2em]">Bình luận với tên:</div>
                                    <div className="text-sm font-bold text-slate-900">{user?.name || guestAuth.name}</div>
                                </div>
                            </div>

                            <textarea 
                                placeholder="Viết ý kiến của bạn tại đây..." 
                                required 
                                rows={5}
                                autoFocus
                                value={commentContent} 
                                onChange={e => setCommentContent(e.target.value)}
                                className="w-full px-6 py-6 bg-slate-50 border border-slate-100 rounded-[32px] text-base font-medium outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all resize-none mb-8 placeholder:text-slate-300"
                            ></textarea>
                            
                            <div className="flex gap-4">
                                <button type="button" onClick={() => setShowCommentModal(false)} className="flex-1 py-5 bg-neutral-50 text-neutral-500 rounded-2xl font-black uppercase tracking-widest text-[11px] hover:bg-neutral-100 transition-all">
                                    Hủy bỏ
                                </button>
                                <button type="submit" disabled={commentLoading} className="flex-[2] py-5 bg-blue-600 text-white rounded-2xl font-black uppercase tracking-widest text-[11px] hover:bg-blue-700 transition-all shadow-xl shadow-blue-200 disabled:opacity-50 flex items-center justify-center gap-2">
                                    {commentLoading ? 'Đang gửi...' : 'Gửi bài bình luận'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Guest Info Modal */}
            {showGuestModal && (
                <div className="fixed inset-0 z-[201] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
                    <div className="bg-white rounded-[40px] p-10 max-w-md w-full shadow-2xl animate-in zoom-in-95 duration-300 relative">
                        <div className="flex justify-between items-center mb-8">
                            <div>
                                <h3 className="text-2xl font-black text-slate-900 tracking-tight mb-1">Chào bạn nhé!</h3>
                                <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest">Một chút thông tin để làm quen</p>
                            </div>
                            <button onClick={() => setShowGuestModal(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors"><X className="w-6 h-6" /></button>
                        </div>
                        <p className="text-slate-500 mb-8 font-medium text-sm leading-relaxed">
                            Bạn hiện chưa đăng nhập. Vui lòng điền một vài thông tin cơ bản để chúng mình có thể hiển thị danh tính của bạn trong các bình luận và lượt yêu thích bài viết nhé.
                        </p>
                        
                        <div className="space-y-4 mb-10">
                            <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-4">Biệt danh của bạn</label>
                                <input 
                                    type="text" 
                                    placeholder="VD: Anh Tuấn, Minh Thư..."
                                    value={guestAuth.name}
                                    onChange={e => setGuestAuth({ ...guestAuth, name: e.target.value })}
                                    className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 focus:bg-white transition-all font-bold text-slate-900"
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-4">Email (Nếu bạn muốn nhận thông báo)</label>
                                <input 
                                    type="email" 
                                    placeholder="email@vidu.com"
                                    value={guestAuth.email}
                                    onChange={e => setGuestAuth({ ...guestAuth, email: e.target.value })}
                                    className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 focus:bg-white transition-all font-bold text-slate-900"
                                />
                            </div>
                        </div>

                        <button 
                            onClick={handleGuestSubmit}
                            disabled={!guestAuth.name}
                            className="w-full py-5 bg-blue-600 text-white rounded-2xl font-black uppercase tracking-widest text-sm hover:bg-blue-700 transition-all shadow-xl shadow-blue-200 disabled:opacity-50"
                        >
                            Tiếp tục chia sẻ
                        </button>
                    </div>
                </div>
            )}
        </div>
    )
}
