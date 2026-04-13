'use client'

import { useState, useEffect } from 'react'
import { 
  Plus, Search, Edit, Trash2, BookOpen, 
  Calendar, Eye, Globe, Lock, ChevronRight,
  Filter, Tag, User as UserIcon, Image as ImageIcon
} from 'lucide-react'
import { fetchWithAuth } from '@/lib/api-client'
import { format } from 'date-fns'
import { vi } from 'date-fns/locale'

interface BlogPost {
  id: string
  title: string
  slug: string
  summary?: string
  featuredImage?: string
  author: { name: string }
  category?: { name: string }
  isPublished: boolean
  viewCount: number
  publishedAt?: string
  createdAt: string
}

export default function BlogManagementPage() {
  const [posts, setPosts] = useState<BlogPost[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingPost, setEditingPost] = useState<BlogPost | null>(null)
  const [categories, setCategories] = useState<{id: string, name: string}[]>([])

  // Form State
  const [formData, setFormData] = useState({
    title: '',
    summary: '',
    content: '',
    featuredImage: '',
    categoryId: '',
    tags: [] as string[],
    isPublished: false
  })

  useEffect(() => {
    fetchPosts()
    fetchCategories()
  }, [])

  const fetchPosts = async () => {
    try {
      const response = await fetchWithAuth('/api/blog')
      const data = await response.json()
      if (data.success) {
        setPosts(data.data)
      }
    } catch (error) {
      console.error('Failed to fetch posts', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchCategories = async () => {
    try {
      const response = await fetchWithAuth('/api/blog/categories')
      const data = await response.json()
      if (data.success) {
        setCategories(data.data)
      }
    } catch (error) {
      console.error('Failed to fetch categories', error)
    }
  }

  const handleOpenModal = (post?: any) => {
    if (post) {
      // For editing, we might need a full GET for content if not in list
      setEditingPost(post)
      setFormData({
        title: post.title,
        summary: post.summary || '',
        content: post.content || '',
        featuredImage: post.featuredImage || '',
        categoryId: post.categoryId || '',
        tags: post.tags || [],
        isPublished: post.isPublished
      })
    } else {
      setEditingPost(null)
      setFormData({
        title: '',
        summary: '',
        content: '',
        featuredImage: '',
        categoryId: '',
        tags: [],
        isPublished: false
      })
    }
    setIsModalOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const url = editingPost ? `/api/blog/${editingPost.id}` : '/api/blog'
      const method = editingPost ? 'PUT' : 'POST'

      const res = await fetchWithAuth(url, {
        method,
        body: JSON.stringify(formData)
      })

      const data = await res.json()
      if (!data.success) throw new Error(data.message)

      fetchPosts()
      setIsModalOpen(false)
    } catch (error: any) {
      alert(error.message)
    }
  }

  const filteredPosts = posts.filter(p =>
    p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.author.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-4xl font-black text-slate-900 tracking-tighter">Bài Viết & Kiến Thức</h2>
          <p className="text-slate-500 font-medium">Xây dựng thư viện kiến thức và tin tức cho cộng đồng SmartBuild</p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="bg-slate-900 text-white px-8 py-4 rounded-2xl flex items-center gap-2 font-black shadow-xl shadow-slate-200 hover:scale-105 active:scale-95 transition-all"
        >
          <Plus className="w-5 h-5" />
          Viết Bài Mới
        </button>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center gap-4 bg-white p-4 rounded-[24px] border border-slate-100 shadow-sm">
         <div className="relative flex-1 min-w-[300px]">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
            <input 
               type="text"
               placeholder="Tìm theo tiêu đề bài viết..."
               className="w-full pl-12 pr-6 py-3.5 bg-slate-50 rounded-2xl border-none focus:ring-2 focus:ring-slate-900 outline-none font-medium transition-all"
               value={searchTerm}
               onChange={(e) => setSearchTerm(e.target.value)}
            />
         </div>
         <div className="flex gap-2">
            <button className="px-5 py-3.5 bg-slate-50 text-slate-600 rounded-2xl font-bold flex items-center gap-2 hover:bg-slate-100">
                <Filter className="w-4 h-4" />
                Lọc
            </button>
            <button className="px-5 py-3.5 bg-slate-50 text-slate-600 rounded-2xl font-bold flex items-center gap-2 hover:bg-slate-100">
                <Tag className="w-4 h-4" />
                Danh mục
            </button>
         </div>
      </div>

      {/* Blog Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
        {filteredPosts.map((post) => (
          <div key={post.id} className="bg-white rounded-[32px] overflow-hidden border border-slate-100 shadow-sm group hover:shadow-2xl hover:border-slate-200 transition-all duration-500 flex flex-col">
             {/* Thumbnail */}
             <div className="h-56 relative overflow-hidden bg-slate-100">
                {post.featuredImage ? (
                    <img 
                        src={post.featuredImage} 
                        alt={post.title} 
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-300">
                        <ImageIcon className="w-12 h-12" />
                    </div>
                )}
                <div className="absolute top-4 left-4">
                    <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg ${
                        post.isPublished ? 'bg-green-500 text-white' : 'bg-slate-900 text-white'
                    }`}>
                        {post.isPublished ? 'Đã đăng' : 'Bản nháp'}
                    </span>
                </div>
                {post.category && (
                    <div className="absolute bottom-4 left-4">
                        <span className="px-4 py-1.5 bg-white/90 backdrop-blur-md rounded-full text-[10px] font-black text-slate-900 uppercase tracking-widest shadow-sm">
                            {post.category.name}
                        </span>
                    </div>
                )}
             </div>

             {/* Content */}
             <div className="p-8 flex-1 flex flex-col">
                <div className="flex items-center gap-3 mb-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    <span className="flex items-center gap-1.5"><UserIcon className="w-3 h-3" /> {post.author.name}</span>
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-200"></span>
                    <span className="flex items-center gap-1.5"><Calendar className="w-3 h-3" /> {format(new Date(post.createdAt), 'dd MMM, yyyy', { locale: vi })}</span>
                </div>
                
                <h3 className="text-xl font-black text-slate-900 leading-tight mb-4 group-hover:text-blue-600 transition-colors line-clamp-2">
                    {post.title}
                </h3>
                
                <p className="text-slate-500 text-sm font-medium line-clamp-3 mb-6 flex-1">
                    {post.summary || "Bài viết này chưa có nội dung mô tả ngắn."}
                </p>

                <div className="flex items-center justify-between pt-6 border-t border-slate-50">
                    <div className="flex items-center gap-4 text-slate-400">
                        <span className="flex items-center gap-1.5 text-xs font-bold"><Eye className="w-4 h-4" /> {post.viewCount}</span>
                    </div>
                    <div className="flex gap-2">
                        <button 
                            onClick={() => handleOpenModal(post)}
                            className="p-3 bg-slate-50 hover:bg-slate-900 hover:text-white rounded-2xl transition-all"
                        >
                            <Edit className="w-4 h-4" />
                        </button>
                        <button className="p-3 bg-slate-50 hover:bg-red-500 hover:text-white rounded-2xl transition-all">
                            <Trash2 className="w-4 h-4" />
                        </button>
                    </div>
                </div>
             </div>
          </div>
        ))}

        {filteredPosts.length === 0 && !loading && (
            <div className="col-span-full py-20 text-center">
                <BookOpen className="w-16 h-16 text-slate-100 mx-auto mb-6" />
                <h3 className="text-xl font-bold text-slate-900">Chưa có bài viết nào</h3>
                <p className="text-slate-500 mt-2">Hãy bắt đầu viết nội dung đầu tiên cho trang web của bạn.</p>
            </div>
        )}
      </div>

      {/* Editor Modal (Full Screen feel) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-0 md:p-8 bg-slate-900/60 backdrop-blur-xl animate-in fade-in duration-300">
            <div className="bg-white w-full max-w-6xl h-full md:h-auto md:max-h-[95vh] md:rounded-[40px] shadow-2xl overflow-hidden flex flex-col animate-in slide-in-from-bottom-10 duration-500">
                {/* Header */}
                <div className="px-10 py-6 border-b border-slate-100 flex items-center justify-between">
                    <div>
                        <h2 className="text-2xl font-black text-slate-900 tracking-tighter">
                            {editingPost ? 'Chỉnh Sửa Bài Viết' : 'Tạo Bài Viết Mới'}
                        </h2>
                        <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">NỘI DUNG BLOG</span>
                            <ChevronRight className="w-4 h-4 text-slate-200" />
                            <span className="text-xs font-black text-blue-600 uppercase tracking-widest">{formData.isPublished ? 'CÔNG KHAI' : 'LƯU NHÁP'}</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <button onClick={() => setIsModalOpen(false)} className="px-6 py-3 text-slate-500 font-bold hover:text-slate-900 transition-colors">
                            Hủy bỏ
                        </button>
                        <button 
                            onClick={handleSubmit}
                            className="px-10 py-3.5 bg-slate-900 text-white rounded-2xl font-black shadow-lg shadow-slate-200 hover:scale-105 transition-all"
                        >
                            {editingPost ? 'Cập Nhật' : 'Đăng Bài'}
                        </button>
                    </div>
                </div>

                {/* Editor Content */}
                <div className="flex-1 overflow-y-auto p-10 bg-slate-50">
                    <div className="max-w-4xl mx-auto space-y-10">
                        {/* Title & Stats */}
                        <div className="space-y-4">
                             <input 
                                type="text"
                                className="w-full bg-transparent border-none text-4xl font-black text-slate-900 placeholder:text-slate-200 focus:ring-0 outline-none p-0"
                                placeholder="Tiêu đề bài viết của bạn..."
                                value={formData.title}
                                onChange={e => setFormData({...formData, title: e.target.value})}
                             />
                             <div className="flex flex-wrap gap-4 pt-4 border-t border-slate-100">
                                <select 
                                    className="px-4 py-2 bg-white rounded-xl border-none shadow-sm font-bold text-xs text-slate-600 outline-none focus:ring-2 focus:ring-blue-500"
                                    value={formData.categoryId}
                                    onChange={e => setFormData({...formData, categoryId: e.target.value})}
                                >
                                    <option value="">Chọn danh mục</option>
                                    {categories.map(cat => (
                                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                                    ))}
                                </select>
                                
                                <div className="flex items-center p-1 bg-white rounded-xl shadow-sm">
                                    <button 
                                        type="button"
                                        onClick={() => setFormData({...formData, isPublished: true})}
                                        className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all ${formData.isPublished ? 'bg-green-500 text-white shadow-md' : 'text-slate-400 hover:text-slate-600'}`}
                                    >
                                        <Globe className="w-3.5 h-3.5" /> Công khai
                                    </button>
                                    <button 
                                        type="button"
                                        onClick={() => setFormData({...formData, isPublished: false})}
                                        className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all ${!formData.isPublished ? 'bg-slate-900 text-white shadow-md' : 'text-slate-400 hover:text-slate-600'}`}
                                    >
                                        <Lock className="w-3.5 h-3.5" /> Riêng tư
                                    </button>
                                </div>
                             </div>
                        </div>

                        {/* Image & Summary */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            <div className="md:col-span-1 space-y-3">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Ảnh bìa (URL)</label>
                                <div className="aspect-video bg-white rounded-3xl border-2 border-dashed border-slate-200 overflow-hidden relative group">
                                    {formData.featuredImage ? (
                                        <img src={formData.featuredImage} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex flex-col items-center justify-center text-slate-300">
                                            <ImageIcon className="w-10 h-10 mb-2" />
                                            <span className="text-[10px] font-bold">CHƯA CÓ ẢNH</span>
                                        </div>
                                    )}
                                    <div className="absolute inset-0 bg-slate-900/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity p-4">
                                        <input 
                                            type="text" 
                                            placeholder="Dán link ảnh vào đây..."
                                            className="w-full px-4 py-2 rounded-lg text-xs outline-none"
                                            value={formData.featuredImage}
                                            onChange={e => setFormData({...formData, featuredImage: e.target.value})}
                                        />
                                    </div>
                                </div>
                            </div>
                            <div className="md:col-span-2 space-y-3">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Mô tả ngắn (Summary)</label>
                                <textarea 
                                    rows={5}
                                    className="w-full p-6 bg-white rounded-3xl border-none shadow-sm focus:ring-2 focus:ring-blue-500 outline-none font-medium text-slate-700 resize-none"
                                    placeholder="Viết một đoạn ngắn tóm tắt nội dung bài bài viết này để hiển thị ở trang danh sách..."
                                    value={formData.summary}
                                    onChange={e => setFormData({...formData, summary: e.target.value})}
                                />
                            </div>
                        </div>

                        {/* Main Content Body */}
                        <div className="space-y-3">
                            <div className="flex items-center justify-between pl-1">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Nội dung bài viết (Main Content)</label>
                                <span className="text-[10px] font-bold text-slate-300 uppercase italic">Hỗ trợ định dạng HTML cơ bản</span>
                            </div>
                            <textarea 
                                rows={20}
                                className="w-full p-10 bg-white rounded-[40px] border-none shadow-2xl focus:ring-2 focus:ring-blue-500 outline-none font-medium text-lg leading-relaxed text-slate-700 resize-none"
                                placeholder="Bắt đầu viết những kiến thức tuyệt vời của bạn ở đây..."
                                value={formData.content}
                                onChange={e => setFormData({...formData, content: e.target.value})}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
      )}
    </div>
  )
}
