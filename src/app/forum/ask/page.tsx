"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import toast, { Toaster } from 'react-hot-toast'
import { useAuth } from '@/contexts/auth-context'

export default function AskQuestionPage() {
    const router = useRouter()
    const { user, isAuthenticated } = useAuth()
    
    // Form States
    const [title, setTitle] = useState('')
    const [content, setContent] = useState('')
    const [categoryId, setCategoryId] = useState('')
    const [tagsInput, setTagsInput] = useState('')
    const [isAnonymous, setIsAnonymous] = useState(false)
    
    // Data States
    const [categories, setCategories] = useState([])
    const [loading, setLoading] = useState(false)
    const [fetchingCats, setFetchingCats] = useState(true)

    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const res = await fetch('/api/forum/categories')
                const data = await res.json()
                if (data.success) {
                    setCategories(data.data)
                }
            } catch (err) {
                console.error(err)
            } finally {
                setFetchingCats(false)
            }
        }
        fetchCategories()
    }, [])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        
        if (!title.trim() || !content.trim() || !categoryId) {
            toast.error('Vui lòng điền Tiêu đề, Nội dung và Chọn danh mục!')
            return
        }

        setLoading(true)
        
        // Custom tag processing: split by comma, trim whitespace
        const parsedTags = tagsInput
            .split(',')
            .map(tag => tag.trim())
            .filter(tag => tag.length > 0)

        try {
            const res = await fetch('/api/forum/discussions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title,
                    content,
                    categoryId,
                    tags: parsedTags,
                    isAnonymous
                })
            })

            const data = await res.json()

            if (!res.ok) {
                toast.error(data.error || 'Có lỗi xảy ra!')
                return
            }

            toast.success('Đã đăng chủ đề thành công!')
            router.push(`/forum/discussion/${data.data.id}`)
            
        } catch (error) {
            console.error('Submit Error:', error)
            toast.error('Không kết nối được đến máy chủ.')
        } finally {
            setLoading(false)
        }
    }

    if (!isAuthenticated) {
        return (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 md:p-8 max-w-4xl mx-auto mt-10 text-center py-20">
                <div className="w-16 h-16 bg-blue-50 text-blue-600 flex flex-col items-center justify-center rounded-3xl mx-auto mb-6 text-2xl">🔒</div>
                <h2 className="text-2xl font-black text-gray-900 mb-3">Khu Vực Dành Cho Thành Viên</h2>
                <p className="text-gray-500 mb-8 max-w-md mx-auto">Hệ thống đang thắt chặt an ninh nhằm loại bỏ tin rác. Vui lòng đăng nhập để bắt đầu đặt câu hỏi tới các Chuyên gia.</p>
                <Link href="/login" className="px-10 py-3.5 bg-gray-900 hover:bg-black text-white rounded-xl font-bold transition-all shadow-md">
                    Đăng Nhập Hoặc Đăng Ký
                </Link>
                <div className="mt-8">
                     <Link href="/forum" className="text-sm font-medium text-gray-500 hover:text-gray-800">
                        ← Trở về trang trước
                    </Link>
                </div>
            </div>
        )
    }

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 md:p-8 max-w-4xl mx-auto">
            <Toaster position="top-right" />
            
            <div className="mb-8 border-b pb-4">
                <Link href="/forum" className="text-sm font-medium text-gray-500 hover:text-gray-800 mb-4 inline-block">
                    ← Trở về diễn đàn
                </Link>
                <h2 className="text-2xl font-bold text-gray-900 mt-2">Đặt Câu Hỏi Mới</h2>
                <p className="text-sm text-gray-500 mt-1">Nêu rõ vấn đề bạn đang gặp phải để các Chuyên gia tư vấn chính xác nhất.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                
                {/* Tiêu đề */}
                <div>
                    <label className="block text-sm font-bold text-gray-900 mb-2">
                        Tiêu đề vấn đề <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="text"
                        placeholder="Ví dụ: Làm sao để xử lý vết nứt móng nhà cấp 4 hiệu quả?"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
                    />
                    <p className="mt-1 text-xs text-gray-500">Mô tả tóm tắt ý chính của vấn đề (tối đa 150 ký tự).</p>
                </div>

                {/* Danh mục & Tag */}
                <div className="flex flex-col md:flex-row gap-6">
                    <div className="flex-1">
                        <label className="block text-sm font-bold text-gray-900 mb-2">
                            Chuyên mục kỹ thuật <span className="text-red-500">*</span>
                        </label>
                        <select
                            value={categoryId}
                            onChange={(e) => setCategoryId(e.target.value)}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                            disabled={fetchingCats}
                        >
                            <option value="">-- Lựa chọn chuyên mục --</option>
                            {categories.map((cat: any) => (
                                <option key={cat.id} value={cat.id}>{cat.name}</option>
                            ))}
                        </select>
                    </div>
                    
                    <div className="flex-1">
                        <label className="block text-sm font-bold text-gray-900 mb-2">
                            Từ khóa tìm kiếm (Tags)
                        </label>
                        <input
                            type="text"
                            placeholder="Ví dụ: sơn, chống thấm, sàn bê tông..."
                            value={tagsInput}
                            onChange={(e) => setTagsInput(e.target.value)}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <p className="mt-1 text-xs text-gray-500">Phân cách các thẻ bằng dấu phẩy (,)</p>
                    </div>
                </div>

                {/* Nội dung chi tiết */}
                <div>
                    <label className="block text-sm font-bold text-gray-900 mb-2">
                        Nội dung chi tiết <span className="text-red-500">*</span>
                    </label>
                    <textarea
                        rows={8}
                        placeholder="Hãy miêu tả chi tiết tình trạng hiện tại, vật liệu đang sử dụng, và khu vực bạn sinh sống để thợ dễ tư vấn..."
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y"
                    ></textarea>
                </div>

                {/* Ẩn danh */}
                <div className="flex items-center gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200/60">
                    <input 
                        type="checkbox" 
                        id="anon" 
                        checked={isAnonymous} 
                        onChange={(e) => setIsAnonymous(e.target.checked)} 
                        className="w-5 h-5 text-blue-600 rounded bg-white focus:ring-blue-500" 
                    />
                    <div>
                        <label htmlFor="anon" className="text-sm font-bold text-gray-900 cursor-pointer block">
                            Đăng bài ẩn danh (Giấu tên của tôi)
                        </label>
                        <p className="text-xs text-gray-500 mt-0.5">Tên hiển thị của bạn sẽ là "Cư dân ẩn danh".</p>
                    </div>
                </div>

                {/* Buttons box */}
                <div className="flex items-center justify-end gap-4 border-t pt-6">
                    <Link
                        href="/forum"
                        className="px-6 py-2.5 font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        Hủy bỏ
                    </Link>
                    <button
                        type="submit"
                        disabled={loading}
                        className={`px-8 py-2.5 font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-sm ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                        {loading ? 'Đang Đăng Bài...' : 'Đăng Câu Hỏi Mới'}
                    </button>
                </div>
                
            </form>
        </div>
    )
}
