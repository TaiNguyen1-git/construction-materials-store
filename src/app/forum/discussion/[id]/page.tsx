"use client"

import { use, useState, useEffect } from 'react'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'
import { vi } from 'date-fns/locale'
import toast, { Toaster } from 'react-hot-toast'
import { useAuth } from '@/contexts/auth-context'

export default function DiscussionDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params)
    const { user } = useAuth()
    
    const [discussion, setDiscussion] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    
    // Comment state
    const [commentText, setCommentText] = useState('')
    const [isAnonymous, setIsAnonymous] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)

    useEffect(() => {
        fetchDiscussionDetail()
    }, [id])

    const fetchDiscussionDetail = async () => {
        try {
            const res = await fetch(`/api/forum/discussions/${id}`)
            const data = await res.json()
            if (data.success) {
                setDiscussion(data.data)
            }
        } catch (error) {
            console.error(error)
        } finally {
            setLoading(false)
        }
    }

    const handlePostComment = async () => {
        if (!commentText.trim()) return

        if (!user) {
            toast.error('Vui lòng Đăng nhập để phản hồi chuyên gia!')
            return
        }

        setIsSubmitting(true)
        try {
            const res = await fetch(`/api/forum/discussions/${id}/comments`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ content: commentText, isAnonymous })
            })
            const data = await res.json()
            
            if (data.success) {
                toast.success('Gửi bình luận thành công!')
                setCommentText('')
                // Reload list
                fetchDiscussionDetail()
            } else {
                toast.error(data.error || 'Lỗi gửi bình luận')
            }
        } catch (error) {
            toast.error('Lỗi máy chủ nội bộ')
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleAcceptAnswer = async (commentId: string) => {
        try {
            const res = await fetch(`/api/forum/discussions/${id}/resolve`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ commentId })
            })
            const data = await res.json()
            if (data.success) {
                toast.success('Đã vinh danh giải pháp tốt nhất!')
                fetchDiscussionDetail() // Reload layout with accepted mark
            } else {
                toast.error(data.error)
            }
        } catch (error) {
            toast.error('Lỗi không thể thực hiện')
        }
    }

    const handleVote = async (targetId: string, targetType: "DISCUSSION" | "COMMENT", value: number) => {
        if (!user) {
             toast.error('Đăng nhập để bình chọn bài viết!')
             return
        }
        try {
            const res = await fetch('/api/forum/vote', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ targetId, targetType, value })
            })
            const data = await res.json()
            if (data.success) {
                fetchDiscussionDetail() // Reload to get fresh count
            }
        } catch (e) {
            toast.error('Có lỗi lúc vote')
        }
    }

    if (loading) return <div className="p-12 text-center text-gray-500">Đang tải chủ đề...</div>
    if (!discussion) return <div className="p-12 text-center text-red-500">Bài viết không tồn tại.</div>

    return (
        <div className="space-y-6 max-w-5xl mx-auto">
            <Toaster position="top-right"/>
            <div className="mb-2">
                <Link href="/forum" className="text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors">
                    ← Diễn đàn
                </Link>
            </div>

            {/* Chủ đề Câu Hỏi Chính */}
            <div className={`bg-white rounded-xl shadow-sm border ${discussion.isResolved ? 'border-green-200 border-l-4 border-l-green-500' : 'border-gray-100'}`}>
                <div className="p-6 md:p-8 flex gap-6">
                    {/* Hộp Vote Cột Trái */}
                    <div className="flex flex-col items-center gap-1 shrink-0 w-12 text-gray-400">
                        <button onClick={() => handleVote(discussion.id, 'DISCUSSION', 1)} className="hover:text-blue-600 hover:bg-blue-50 rounded p-1 transition-colors text-xl font-black">
                            ▲
                        </button>
                        <span className={`text-lg font-bold ${discussion.upvotes > 0 ? 'text-gray-900' : 'text-gray-500'}`}>
                            {discussion.upvotes}
                        </span>
                        <button onClick={() => handleVote(discussion.id, 'DISCUSSION', -1)} className="hover:text-red-500 hover:bg-red-50 rounded p-1 transition-colors text-xl font-black">
                            ▼
                        </button>
                    </div>

                    {/* Nội dung Cột Phải */}
                    <div className="flex-1 min-w-0">
                        <div className="mb-4 flex items-center gap-3 text-xs">
                            <span className="font-bold text-gray-900 uppercase tracking-wide bg-gray-100 px-3 py-1 rounded-full">
                                {discussion.category?.name}
                            </span>
                            <span className="text-gray-400">• Đã theo dõi được {discussion.views} lượt xem</span>
                        </div>
                        
                        <h1 className="text-2xl font-black text-gray-900 mb-4 leading-snug">
                            {discussion.title}
                        </h1>

                        <div className="text-gray-700 whitespace-pre-wrap leading-relaxed mb-6 font-medium">
                            {discussion.content}
                        </div>

                        {/* Footer Câu Hỏi */}
                        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 border-t pt-4">
                            <div className="flex gap-2">
                                {discussion.tags?.map((tag: string) => (
                                    <span key={tag} className="px-2 py-1 bg-blue-50/50 text-blue-600 rounded border border-blue-100 text-xs">
                                        #{tag}
                                    </span>
                                ))}
                            </div>

                            <div className="flex items-center gap-3 bg-gray-50 px-4 py-2 rounded-lg">
                                {/* Dùng CSS vẽ hình hộp đại diện thay cho Avatar/Icon */}
                                <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center">
                                    {discussion.author?.name?.charAt(0) || 'U'}
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-gray-900">{discussion.author?.name}</p>
                                    <p className="text-xs text-gray-500">
                                        Đăng lúc {formatDistanceToNow(new Date(discussion.createdAt), { addSuffix: true, locale: vi })}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* List Trả Lời (Comments) */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 flex flex-col pt-2">
                <div className="px-6 py-4 border-b font-black text-lg text-gray-900 flex justify-between items-center">
                    <span>{discussion.comments?.length || 0} Nhận định / Tư vấn</span>
                </div>

                <div className="divide-y divide-gray-100">
                    {discussion.comments?.map((comment: any) => {
                        const isContractor = comment.author?.role === 'CONTRACTOR'
                        const isSupplier = comment.author?.role === 'SUPPLIER'
                        const isAdmin = comment.author?.role === 'ADMIN'
                        
                        return (
                            <div key={comment.id} className={`p-6 md:p-8 flex gap-6 ${comment.isAccepted ? 'bg-green-50/30' : ''}`}>
                                {/* Cột Left (Vote) */}
                                <div className="flex flex-col items-center gap-1 shrink-0 w-12 text-gray-400">
                                    <button onClick={() => handleVote(comment.id, 'COMMENT', 1)} className="hover:text-blue-600 rounded p-1 text-lg font-black font-mono">▲</button>
                                    <span className="font-bold text-gray-700">{comment.upvotes}</span>
                                    <button onClick={() => handleVote(comment.id, 'COMMENT', -1)} className="hover:text-red-500 rounded p-1 text-lg font-black font-mono">▼</button>
                                    
                                    {/* Tick xanh nếu đc Accept */}
                                    {comment.isAccepted && (
                                        <div className="mt-4 w-10 h-10 rounded-full bg-green-500 flex items-center justify-center text-white font-black text-xl shadow-sm" title="Câu Trả Lời Chuẩn Xác Nhất">
                                            ✓
                                        </div>
                                    )}
                                </div>

                                {/* Cột Right (Nội dung câu trả lời) */}
                                <div className="flex-1 min-w-0">
                                    {comment.isAccepted && (
                                        <div className="inline-block bg-green-100 text-green-800 px-3 py-1 rounded text-xs font-bold mb-3 uppercase tracking-wider">
                                            Pháp Đồ Giải Quyết Đặc Trị
                                        </div>
                                    )}

                                    <div className="text-gray-800 whitespace-pre-wrap leading-relaxed">
                                        {comment.content}
                                    </div>

                                    {/* Action Footers của Cmt */}
                                    <div className="mt-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                                        
                                        {/* Hiển thị Nút Chấp nhận nếu là Chủ Topic */}
                                        <div className="flex items-center gap-3">
                                             {user?.id === discussion.authorId && !comment.isAccepted && (
                                                 <button
                                                    onClick={() => handleAcceptAnswer(comment.id)} 
                                                    className="text-xs font-bold bg-green-50 border border-green-200 text-green-700 hover:bg-green-100 px-3 py-1.5 rounded-md transition-colors shadow-sm"
                                                 >
                                                    Chốt Phương Án Này
                                                 </button>
                                             )}
                                             
                                             {/* Simulated "Contact Expert" button for Guests reading */}
                                             {/* Giả lập cho UI. Nếu người đăng Cmt là KHÔNG phải User hiện tại, tạo nút IB */}
                                             {isContractor && user?.id !== comment.authorId && (
                                                 <button className="text-xs font-bold bg-blue-50 border border-blue-200 text-blue-700 hover:bg-blue-100 px-3 py-1.5 rounded-md transition-colors shadow-sm">
                                                    Liên Hệ Mời Thầu
                                                 </button>
                                             )}
                                        </div>

                                        {/* Avatar Bảng Tên */}
                                        <div className={`flex items-center gap-3 px-4 py-3 rounded-lg border ${
                                            isContractor ? 'bg-amber-50/50 border-amber-100' : 
                                            isSupplier ? 'bg-indigo-50/50 border-indigo-100' : 
                                            'bg-gray-50 border-gray-100'
                                        }`}>
                                            <div className="w-10 h-10 rounded bg-white shadow-sm font-bold flex items-center justify-center text-gray-700 border border-gray-100">
                                                {comment.author?.name?.charAt(0) || 'U'}
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <p className="text-sm font-bold text-gray-900">{comment.author?.name}</p>
                                                    
                                                    {isContractor && <span className="text-[10px] font-bold px-1.5 py-0.5 bg-amber-500 text-white rounded">Chuyên Gia</span>}
                                                    {isSupplier && <span className="text-[10px] font-bold px-1.5 py-0.5 bg-indigo-500 text-white rounded">Hãng Sản Xuất</span>}
                                                    {isAdmin && <span className="text-[10px] font-bold px-1.5 py-0.5 bg-gray-900 text-white rounded">Admin Cấp Cao</span>}
                                                </div>
                                                <p className="text-xs text-gray-500 mt-0.5">
                                                    Giải đáp lúc {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true, locale: vi })}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )
                    })}
                </div>

                {/* Khung Viết Bình luận của mình (Ngăn chặn Guest) */}
                <div className="p-6 md:p-8 bg-gray-50 border-t border-gray-200 rounded-b-xl">
                    <h3 className="text-lg font-black text-gray-900 mb-4 tracking-tight">Cung cấp giải pháp của bạn</h3>
                    
                    {!user ? (
                        <div className="text-center p-8 bg-white border border-gray-200 border-dashed rounded-lg space-y-3 shadow-sm">
                            <p className="text-gray-500 font-medium">Diễn đàn kỹ thuật cao đang chặn Spam. Bạn cần là Sinh viên, Thợ Thầu, hoặc Kỹ Sư để tham gia.</p>
                            <Link href="/login" className="inline-block px-6 py-2.5 font-bold text-white bg-gray-900 hover:bg-black rounded-lg transition-colors shadow">
                                Đăng Nhập Hệ Thống
                            </Link>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <textarea
                                value={commentText}
                                onChange={(e) => setCommentText(e.target.value)}
                                rows={5}
                                placeholder="Trình bày giải pháp kỹ thuật, đính kèm tên hãng xi măng/sơn lót mà bạn khuyên dùng..."
                                className="w-full px-5 py-4 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white resize-y shadow-sm"
                            />
                            
                            <div className="flex justify-between items-center flex-wrap gap-4 border-t border-gray-100 pt-4">
                                <div className="flex items-center gap-3 bg-gray-100/50 px-3 py-1.5 rounded-lg border border-gray-200">
                                    <input 
                                        type="checkbox" 
                                        id="anonComment"
                                        checked={isAnonymous}
                                        onChange={(e) => setIsAnonymous(e.target.checked)}
                                        className="w-4 h-4 text-gray-900 rounded bg-white focus:ring-gray-900"
                                    />
                                    <label htmlFor="anonComment" className="text-xs font-semibold text-gray-600 cursor-pointer">
                                        Trả lời ẩn danh
                                    </label>
                                </div>
                                
                                <button
                                    onClick={handlePostComment}
                                    disabled={isSubmitting || !commentText.trim()}
                                    className={`px-8 py-3 font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-all shadow ${
                                        isSubmitting || !commentText.trim() ? 'opacity-50 cursor-not-allowed' : 'active:scale-95'
                                    }`}
                                >
                                    {isSubmitting ? 'Đường truyền...' : 'Công Bố Phác Đồ'}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
            <div className="pb-16" /> {/* Margin dưới */}
        </div>
    )
}
