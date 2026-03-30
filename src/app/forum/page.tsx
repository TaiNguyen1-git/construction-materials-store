"use client"

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'
import { vi } from 'date-fns/locale'

export default function ForumHomePage() {
    const [discussions, setDiscussions] = useState([])
    const [loading, setLoading] = useState(true)
    const [tab, setTab] = useState('newest')

    useEffect(() => {
        fetchDiscussions(tab)
    }, [tab])

    const fetchDiscussions = async (currentTab: string) => {
        setLoading(true)
        try {
            const res = await fetch(`/api/forum/discussions?sort=${currentTab}`)
            const data = await res.json()
            if (data.success) {
                setDiscussions(data.data)
            }
        } catch (error) {
            console.error('Lỗi khi tải danh sách bài viết:', error)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="space-y-6">
            {/* Thanh Tab Chuyển Đổi */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-2 flex flex-wrap gap-2">
                <button
                    onClick={() => setTab('newest')}
                    className={`px-5 py-2.5 rounded-lg text-sm font-semibold transition-colors ${tab === 'newest' ? 'bg-blue-600 text-white shadow-md shadow-blue-500/30' : 'text-gray-600 hover:bg-gray-100'}`}
                >
                    Mới nhất
                </button>
                <button
                    onClick={() => setTab('trending')}
                    className={`px-5 py-2.5 rounded-lg text-sm font-semibold transition-colors ${tab === 'trending' ? 'bg-blue-600 text-white shadow-md shadow-blue-500/30' : 'text-gray-600 hover:bg-gray-100'}`}
                >
                    Đang quan tâm / Tranh luận
                </button>
                <button
                    onClick={() => setTab('most_upvoted')}
                    className={`px-5 py-2.5 rounded-lg text-sm font-semibold transition-colors ${tab === 'most_upvoted' ? 'bg-blue-600 text-white shadow-md shadow-blue-500/30' : 'text-gray-600 hover:bg-gray-100'}`}
                >
                    Câu hỏi chất lượng
                </button>
                <button
                    onClick={() => setTab('unanswered')}
                    className={`px-5 py-2.5 rounded-lg text-sm font-semibold transition-colors ${tab === 'unanswered' ? 'bg-blue-600 text-white shadow-md shadow-blue-500/30' : 'text-gray-600 hover:bg-gray-100'}`}
                >
                    Cần giải đáp (Chưa có đáp án)
                </button>
            </div>

            {/* Danh Sách Bài Viết Cốt Lõi */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                {loading ? (
                    <div className="p-12 text-center text-gray-500 font-medium">Đang kết nối tải dữ liệu diễn đàn...</div>
                ) : discussions.length === 0 ? (
                    <div className="p-12 text-center text-gray-400">Không tìm thấy chủ đề nào tương ứng với bộ lọc của bạn.</div>
                ) : (
                    <div className="divide-y divide-gray-100">
                        {discussions.map((item: any) => (
                            <div key={item.id} className="p-6 hover:bg-gray-50 transition-colors">
                                <div className="flex flex-col sm:flex-row gap-5">
                                    {/* Cột Chỉ Số (Stats) */}
                                    <div className="flex sm:flex-col gap-4 sm:gap-2 text-center text-xs text-gray-500 sm:w-20 shrink-0">
                                        {/* Trạng thái Giải quyết & Số câu trả lời */}
                                        <div className={`p-2 rounded-lg border flex-1 sm:flex-none ${
                                                item.isResolved 
                                                    ? 'bg-green-50 text-green-700 border-green-200' 
                                                    : item._count?.comments > 0 
                                                        ? 'bg-blue-50 text-blue-700 border-blue-200' 
                                                        : 'bg-white border-gray-200 text-gray-600'
                                            }`}
                                        >
                                            <span className="block text-lg font-bold">
                                                {item._count?.comments || 0}
                                            </span>
                                            {item.isResolved ? 'Đã giải quyết' : 'Trả lời'}
                                        </div>

                                        {/* Số Vote */}
                                        <div className={`p-1.5 flex-1 sm:flex-none ${item.upvotes > 0 ? 'text-gray-900 font-semibold' : ''}`}>
                                            <span className="sm:block mr-1 sm:mr-0">{item.upvotes}</span>
                                            vote
                                        </div>
                                        
                                        {/* Số View */}
                                        <div className="p-1.5 flex-1 sm:flex-none">
                                            <span className="sm:block mr-1 sm:mr-0">{item.views}</span>
                                            xem
                                        </div>
                                    </div>

                                    {/* Cột Nội Dung (Content) */}
                                    <div className="flex-1 min-w-0">
                                        {/* Tiêu đề & Tag Phân Miền */}
                                        <div className="mb-1">
                                            {item.category?.name && (
                                                <span className="inline-block px-2.5 py-1 bg-gray-100 text-gray-600 rounded-md text-[10px] font-bold uppercase tracking-wider mb-2">
                                                    {item.category.name}
                                                </span>
                                            )}
                                        </div>
                                        
                                        <Link href={`/forum/discussion/${item.id}`} className="block group">
                                            <h3 className="text-xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-2 leading-snug">
                                                {item.title}
                                            </h3>
                                        </Link>
                                        
                                        <div className="mt-2 text-sm text-gray-600 line-clamp-2 leading-relaxed">
                                            {item.content}
                                        </div>
                                        
                                        {/* Tag từ khóa & Người Đăng */}
                                        <div className="mt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-gray-500">
                                            <div className="flex flex-wrap gap-2">
                                                {item.tags?.map((tag: string) => (
                                                    <span key={tag} className="px-2 py-0.5 bg-blue-50/50 text-blue-600 rounded border border-blue-100/50">
                                                        #{tag}
                                                    </span>
                                                ))}
                                            </div>
                                            
                                            <div className="flex items-center gap-2 shrink-0 bg-gray-50 px-3 py-1.5 rounded-full">
                                                <span>Bởi <strong className="text-gray-800 font-medium">{item.author?.name}</strong></span>
                                                <span className="text-gray-300">•</span>
                                                <span>
                                                    {formatDistanceToNow(new Date(item.createdAt), { addSuffix: true, locale: vi })}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}
