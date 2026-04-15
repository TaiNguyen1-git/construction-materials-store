'use client'

import { useState, useEffect } from 'react'
import { MessageSquare, Heart, Facebook, Twitter, Link as LinkIcon, User, X } from 'lucide-react'
import { format } from 'date-fns'
import toast from 'react-hot-toast'
import { useAuth } from '@/contexts/auth-context'

interface BlogInteractionsProps {
    slug: string
    initialLikes: number
}

export default function BlogInteractions({ slug, initialLikes }: BlogInteractionsProps) {
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
    
    // Guest Modal
    const [guestAuth, setGuestAuth] = useState({ name: '', email: '' })
    const [showGuestModal, setShowGuestModal] = useState(false)
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

    const handleCommentSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!commentContent.trim()) {
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
                body: JSON.stringify({ name: nameToUse, email: emailToUse, content: commentContent })
            })
            const data = await res.json()
            if (data.success) {
                toast.success('Gửi bình luận thành công!')
                setComments([data.data, ...comments])
                setCommentContent('')
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
                    
                    <form onSubmit={handleCommentSubmit} className="mb-12 bg-white p-6 rounded-[24px] shadow-sm border border-neutral-100">
                        {((isAuthenticated && user) || guestAuth.name) && (
                            <div className="flex items-center gap-3 mb-6 px-2">
                                <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center font-black text-xs">
                                    {(user?.name || guestAuth.name || 'G').charAt(0).toUpperCase()}
                                </div>
                                <div>
                                    <div className="text-[11px] font-black text-neutral-400 uppercase tracking-widest">Đang bình luận với tên</div>
                                    <div className="text-sm font-bold text-neutral-900">{user?.name || guestAuth.name}</div>
                                </div>
                            </div>
                        )}
                        <textarea 
                            placeholder="Ý kiến của bạn về bài viết..." required rows={3}
                            value={commentContent} onChange={e => setCommentContent(e.target.value)}
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
                        {comments.length === 0 && !loadingComments && (
                            <p className="text-center text-sm text-neutral-400 font-medium py-8 italic">Chưa có bình luận nào. Hãy là người đầu tiên chia sẻ ý kiến!</p>
                        )}
                    </div>
                </div>
            )}

            {/* Guest Info Modal */}
            {showGuestModal && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-white rounded-[40px] p-10 max-w-md w-full shadow-2xl animate-in zoom-in-95 duration-300">
                        <div className="flex justify-between items-center mb-8">
                            <h3 className="text-2xl font-black text-slate-900 tracking-tight">Thông tin phản hồi</h3>
                            <button onClick={() => setShowGuestModal(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors"><X className="w-6 h-6" /></button>
                        </div>
                        <p className="text-slate-500 mb-8 font-medium italic">Bạn chưa đăng nhập. Vui lòng cho biết tên để tiếp tục tương tác bài viết.</p>
                        
                        <div className="space-y-4 mb-10">
                            <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-4">Họ và tên của bạn</label>
                                <input 
                                    type="text" 
                                    placeholder="VD: Anh Tuấn"
                                    value={guestAuth.name}
                                    onChange={e => setGuestAuth({ ...guestAuth, name: e.target.value })}
                                    className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-2 focus:ring-primary-500/20 focus:bg-white transition-all font-bold text-slate-900"
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-4">Email (Tùy chọn)</label>
                                <input 
                                    type="email" 
                                    placeholder="tuankt@gmail.com"
                                    value={guestAuth.email}
                                    onChange={e => setGuestAuth({ ...guestAuth, email: e.target.value })}
                                    className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-2 focus:ring-primary-500/20 focus:bg-white transition-all font-bold text-slate-900"
                                />
                            </div>
                        </div>

                        <button 
                            onClick={handleGuestSubmit}
                            disabled={!guestAuth.name}
                            className="w-full py-5 bg-primary-600 text-white rounded-2xl font-black uppercase tracking-widest text-sm hover:bg-primary-700 transition-all shadow-xl shadow-primary-200 disabled:opacity-50"
                        >
                            Tiếp tục tương tác
                        </button>
                    </div>
                </div>
            )}
        </div>
    )
}
