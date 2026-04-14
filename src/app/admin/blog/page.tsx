'use client'

import { useState, useEffect } from 'react'
import { 
  Plus, Search, Edit, Trash2, BookOpen, 
  Calendar, Eye, Globe, Lock, ChevronRight,
  Filter, Tag, User as UserIcon, Image as ImageIcon, Sparkles,
  Bold, Italic, Type, Link as LinkIcon, List, Layout, EyeOff
} from 'lucide-react'
import { fetchWithAuth } from '@/lib/api-client'
import { format } from 'date-fns'
import { vi } from 'date-fns/locale'
import toast, { Toaster } from 'react-hot-toast'
import ConfirmDialog from '@/components/ConfirmDialog'
import RichTextEditor from '@/components/common/RichTextEditor'

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
  const [page, setPage] = useState(1)
  const [sortBy, setBy] = useState('createdAt')
  const [pagination, setPagination] = useState({ total: 0, lastPage: 1 })
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingPost, setEditingPost] = useState<BlogPost | null>(null)
  const [categories, setCategories] = useState<{id: string, name: string, _count?: {posts: number}}[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string>('all')

  // UI State
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [postToDelete, setPostToDelete] = useState<string | null>(null)
  
  // Category Form State
  const [newCategory, setNewCategory] = useState({ name: '', description: '' })
  const [isAddingCategory, setIsAddingCategory] = useState(false)

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

  const [isPreviewMode, setIsPreviewMode] = useState(false)
  const [uploadingImage, setUploadingImage] = useState(false)

  useEffect(() => {
    fetchPosts()
  }, [page, sortBy, selectedCategory])

  useEffect(() => {
    fetchCategories()
  }, [])

  // Bounce search to avoid too many requests
  useEffect(() => {
    const timer = setTimeout(() => {
      if (page !== 1) setPage(1)
      else fetchPosts()
    }, 500)
    return () => clearTimeout(timer)
  }, [searchTerm])

  const fetchPosts = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      params.append('page', page.toString())
      params.append('limit', '9')
      params.append('sortBy', sortBy)
      params.append('search', searchTerm)
      if (selectedCategory !== 'all') {
          const cat = categories.find(c => c.name === selectedCategory)
          if (cat) params.append('categoryId', cat.id)
      }

      const response = await fetchWithAuth(`/api/blog?${params.toString()}`)
      const data = await response.json()
      if (data.success) {
        setPosts(data.data.posts)
        setPagination(data.data.pagination)
      }
    } catch (error) {
      console.error('Failed to fetch posts', error)
      toast.error('Lỗi khi tải danh sách bài viết')
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

      toast.success(editingPost ? 'Đã cập nhật bài viết' : 'Đã đăng bài viết mới')
      fetchPosts()
      setIsModalOpen(false)
    } catch (error: any) {
      toast.error(error.message)
    }
  }

  const handleDeletePost = async () => {
    if (!postToDelete) return
    setIsDeleting(true)
    try {
      const res = await fetchWithAuth(`/api/blog/${postToDelete}`, { method: 'DELETE' })
      const data = await res.json()
      if (!data.success) throw new Error(data.message)
      toast.success('Đã xóa bài viết thành công')
      fetchPosts()
      setPostToDelete(null)
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setIsDeleting(false)
    }
  }

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newCategory.name) return
    setIsAddingCategory(true)
    try {
      const res = await fetchWithAuth('/api/blog/categories', {
        method: 'POST',
        body: JSON.stringify(newCategory)
      })
      const data = await res.json()
      if (!data.success) throw new Error(data.message)
      toast.success('Đã thêm danh mục mới')
      setNewCategory({ name: '', description: '' })
      fetchCategories()
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setIsAddingCategory(false)
    }
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingImage(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      const res = await fetchWithAuth('/api/upload', {
        method: 'POST',
        body: formData,
      })
      const data = await res.json()
      if (data.fileUrl) {
          setFormData(f => ({ ...f, featuredImage: data.fileUrl }))
          toast.success('Đã tải ảnh lên thành công!')
      }
    } catch { toast.error('Lỗi khi tải ảnh lên') }
    finally { setUploadingImage(false) }
  }


  const filteredPosts = posts // Now handled by server

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Quản Lý Bài Viết & Kiến Thức</h1>
          <p className="text-sm text-neutral-500 mt-1">Xây dựng thư viện kiến thức và tin tức cho cộng đồng SmartBuild</p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="bg-primary-600 text-white px-6 py-3 rounded-xl flex items-center gap-2 font-bold shadow-lg shadow-primary-200 hover:shadow-primary-300 hover:-translate-y-0.5 transition-all"
        >
          <Plus className="w-5 h-5 transition-transform group-hover:rotate-90" />
          Viết Bài Mới
        </button>
      </div>

      {/* Admin Stats Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-neutral-100 flex items-center justify-between group hover:border-primary-200 transition-colors">
          <div>
            <div className="text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-1">Tổng Bài Viết</div>
            <div className="text-2xl font-black text-neutral-900">{posts.length}</div>
          </div>
          <div className="w-12 h-12 bg-primary-50 rounded-xl flex items-center justify-center text-primary-600 group-hover:scale-110 transition-transform">
            <BookOpen className="w-6 h-6" />
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-neutral-100 flex items-center justify-between group hover:border-emerald-200 transition-colors">
          <div>
            <div className="text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-1">Đã Công Khai</div>
            <div className="text-2xl font-black text-emerald-600">{posts.filter(p => p.isPublished).length}</div>
          </div>
          <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600 group-hover:scale-110 transition-transform">
            <Globe className="w-6 h-6" />
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-neutral-100 flex items-center justify-between group hover:border-purple-200 transition-colors">
          <div>
            <div className="text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-1">Tổng Lượt Xem</div>
            <div className="text-2xl font-black text-purple-600">
              {posts.reduce((acc, p) => acc + p.viewCount, 0).toLocaleString()}
            </div>
          </div>
          <div className="w-12 h-12 bg-purple-50 rounded-xl flex items-center justify-center text-purple-600 group-hover:scale-110 transition-transform">
            <Eye className="w-6 h-6" />
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-neutral-100 flex items-center justify-between group hover:border-amber-200 transition-colors">
          <div>
            <div className="text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-1">Danh Mục</div>
            <div className="text-2xl font-black text-amber-600">{categories.length}</div>
          </div>
          <div className="w-12 h-12 bg-amber-50 rounded-xl flex items-center justify-center text-amber-600 group-hover:scale-110 transition-transform">
            <Tag className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Filter & Action Bar */}
      <div className="flex flex-wrap items-center gap-4 bg-white p-3 rounded-2xl border border-neutral-100 shadow-sm">
         <div className="relative flex-1 min-w-[280px]">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400 w-4 h-4" />
            <input 
               type="text"
               placeholder="Tìm theo tiêu đề bài viết hoặc tác giả..."
               className="w-full pl-11 pr-4 py-2.5 bg-neutral-50 rounded-xl border-none focus:ring-2 focus:ring-primary-500/20 focus:bg-white outline-none font-medium transition-all text-sm"
               value={searchTerm}
               onChange={(e) => setSearchTerm(e.target.value)}
            />
         </div>
         <div className="flex gap-2">
            <select 
                className="px-4 py-2.5 bg-neutral-50 text-neutral-600 rounded-xl font-bold text-sm border border-neutral-200/50 outline-none focus:ring-2 focus:ring-primary-500/10 cursor-pointer"
                value={sortBy}
                onChange={(e) => setBy(e.target.value)}
            >
                <option value="createdAt">Mới nhất</option>
                <option value="viewCount">Xem nhiều nhất</option>
                <option value="updatedAt">Vừa cập nhật</option>
            </select>
            <select 
                className="px-4 py-2.5 bg-neutral-50 text-neutral-600 rounded-xl font-bold text-sm border border-neutral-200/50 outline-none focus:ring-2 focus:ring-primary-500/10 cursor-pointer"
                value={selectedCategory}
                onChange={(e) => {
                    setSelectedCategory(e.target.value)
                    setPage(1)
                }}
            >
                <option value="all">Tất cả danh mục</option>
                {categories.map(cat => (
                    <option key={cat.id} value={cat.name}>{cat.name}</option>
                ))}
            </select>
            <button 
                onClick={() => setIsCategoryModalOpen(true)}
                className="px-4 py-2.5 bg-neutral-50 text-neutral-600 rounded-xl font-bold flex items-center gap-2 hover:bg-neutral-100 transition-colors text-sm border border-neutral-200/50"
            >
                <Tag className="w-4 h-4" />
                Quản lý danh mục
            </button>
      </div>
      </div>

      {/* Blog Grid */}
      {/* Blog Grid - Airy Redesign */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredPosts.map((post) => (
          <div key={post.id} className="bg-white rounded-3xl overflow-hidden border border-neutral-100 shadow-sm hover:shadow-xl hover:border-primary-100 transition-all duration-300 flex flex-col group">
             {/* Thumbnail with Overlay actions */}
             <div className="h-48 relative overflow-hidden bg-neutral-100">
                {post.featuredImage ? (
                    <img 
                        src={post.featuredImage} 
                        alt={post.title} 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-neutral-300">
                        <ImageIcon className="w-10 h-10" />
                    </div>
                )}
                <div className="absolute top-3 right-3 flex gap-2">
                    <button 
                        onClick={() => handleOpenModal(post)}
                        className="p-2.5 bg-white/90 backdrop-blur-md text-neutral-600 rounded-xl shadow-lg hover:bg-primary-600 hover:text-white transition-all scale-90 group-hover:scale-100"
                    >
                        <Edit className="w-4 h-4" />
                    </button>
                    <button 
                        onClick={() => setPostToDelete(post.id)}
                        className="p-2.5 bg-white/90 backdrop-blur-md text-rose-500 rounded-xl shadow-lg hover:bg-rose-500 hover:text-white transition-all scale-90 group-hover:scale-100"
                    >
                        <Trash2 className="w-4 h-4" />
                    </button>
                </div>
                <div className="absolute top-3 left-3">
                    <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest shadow-md ${
                        post.isPublished ? 'bg-emerald-500 text-white' : 'bg-primary-500 text-white'
                    }`}>
                        {post.isPublished ? 'Đã đăng' : 'Bản nháp'}
                    </span>
                </div>
             </div>

             {/* Content */}
             <div className="p-6 flex-1 flex flex-col">
                <div className="flex items-center gap-2 mb-3">
                    {post.category && (
                        <span className="text-[10px] font-black text-primary-600 uppercase tracking-widest px-2 py-0.5 bg-primary-50 rounded-md">
                            {post.category.name}
                        </span>
                    )}
                    <span className="w-1 h-1 rounded-full bg-neutral-200"></span>
                    <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">{format(new Date(post.createdAt), 'dd.MM.yyyy')}</span>
                </div>
                
                <h3 className="text-lg font-black text-neutral-900 leading-tight mb-3 group-hover:text-primary-600 transition-colors line-clamp-2">
                    {post.title}
                </h3>
                
                <p className="text-neutral-500 text-xs font-medium line-clamp-2 mb-5 leading-relaxed">
                    {post.summary || "Bài viết này chưa có nội dung mô tả ngắn."}
                </p>

                <div className="mt-auto pt-4 border-t border-neutral-50 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-neutral-400">
                        <div className="w-6 h-6 rounded-full bg-neutral-100 flex items-center justify-center text-[10px] font-black text-neutral-600 uppercase">
                            {post.author.name.charAt(0)}
                        </div>
                        <span className="text-[10px] font-bold text-neutral-600 uppercase tracking-wider">{post.author.name}</span>
                    </div>
                    <div className="flex items-center gap-3 text-neutral-400">
                        <span className="flex items-center gap-1 text-[10px] font-bold tracking-wider"><Eye className="w-3.5 h-3.5" /> {post.viewCount}</span>
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

      {/* Pagination View */}
      {pagination.lastPage > 1 && (
        <div className="flex items-center justify-center gap-2 mt-12 pb-10">
            <button 
                disabled={page === 1}
                onClick={() => setPage(page - 1)}
                className="w-12 h-12 flex items-center justify-center rounded-2xl bg-white border border-neutral-100 text-neutral-600 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-neutral-50 transition-all font-black"
            >
                ←
            </button>
            {[...Array(pagination.lastPage)].map((_, i) => (
                <button
                    key={i + 1}
                    onClick={() => setPage(i + 1)}
                    className={`w-12 h-12 flex items-center justify-center rounded-2xl font-black text-sm transition-all ${
                        page === i + 1 
                        ? 'bg-primary-600 text-white shadow-lg shadow-primary-200' 
                        : 'bg-white border border-neutral-100 text-neutral-600 hover:bg-neutral-50'
                    }`}
                >
                    {i + 1}
                </button>
            ))}
            <button 
                disabled={page === pagination.lastPage}
                onClick={() => setPage(page + 1)}
                className="w-12 h-12 flex items-center justify-center rounded-2xl bg-white border border-neutral-100 text-neutral-600 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-neutral-50 transition-all font-black"
            >
                →
            </button>
        </div>
      )}

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
                    <div className="flex items-center gap-3">
                        <button onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 text-neutral-500 font-bold hover:text-neutral-900 hover:bg-neutral-50 rounded-xl transition-all text-sm">
                            Hủy bỏ
                        </button>
                        <button 
                            onClick={handleSubmit}
                            className="px-8 py-3 bg-primary-600 text-white rounded-xl font-bold shadow-lg shadow-primary-200 hover:shadow-primary-300 hover:-translate-y-0.5 transition-all text-sm"
                        >
                            {editingPost ? 'Cập Nhật Bài Viết' : 'Xuất Bản Ngay'}
                        </button>
                    </div>
                </div>

                {/* Editor Content */}
                <div className="flex-1 overflow-y-auto p-12 bg-neutral-50/50">
                    <div className="max-w-4xl mx-auto space-y-12">
                        {/* Title Section */}
                        <div className="space-y-6">
                             <div className="relative group">
                                <div className="flex items-center justify-between mb-2">
                                    <label className="text-[10px] font-black text-neutral-400 uppercase tracking-[0.2em] pl-1">Tiêu đề SEO</label>
                                    <span className={`text-[10px] font-black uppercase tracking-widest ${formData.title.length > 60 ? 'text-rose-500' : 'text-emerald-500'}`}>
                                        {formData.title.length}/60 Ký tự
                                    </span>
                                </div>
                                <input 
                                    type="text"
                                    className="w-full bg-transparent border-none text-5xl font-black text-neutral-900 placeholder:text-neutral-200 focus:ring-0 outline-none p-0 tracking-tight"
                                    placeholder="Tiêu đề tập trung từ khóa..."
                                    value={formData.title}
                                    onChange={e => setFormData({...formData, title: e.target.value})}
                                />
                                <div className="absolute -bottom-2 left-0 w-24 h-1.5 bg-primary-600 rounded-full scale-x-0 group-focus-within:scale-x-100 transition-transform origin-left"></div>
                             </div>

                             <div className="flex flex-wrap items-center gap-4 pt-6">
                                <div className="flex items-center gap-3 px-4 py-2 bg-white rounded-2xl shadow-sm border border-neutral-100">
                                    <Tag className="w-4 h-4 text-primary-500" />
                                    <select 
                                        className="bg-transparent border-none font-bold text-xs text-neutral-600 outline-none focus:ring-0 cursor-pointer pr-8"
                                        value={formData.categoryId}
                                        onChange={e => setFormData({...formData, categoryId: e.target.value})}
                                    >
                                        <option value="">Chọn danh mục bài viết</option>
                                        {categories.map(cat => (
                                            <option key={cat.id} value={cat.id}>{cat.name}</option>
                                        ))}
                                    </select>
                                </div>
                                
                                <div className="flex items-center p-1 bg-white rounded-2xl shadow-sm border border-neutral-100">
                                    <button 
                                        type="button"
                                        onClick={() => setFormData({...formData, isPublished: true})}
                                        className={`flex items-center gap-2 px-6 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${formData.isPublished ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-100' : 'text-neutral-400 hover:text-neutral-600'}`}
                                    >
                                        <Globe className="w-3.5 h-3.5" /> Công khai
                                    </button>
                                    <button 
                                        type="button"
                                        onClick={() => setFormData({...formData, isPublished: false})}
                                        className={`flex items-center gap-2 px-6 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${!formData.isPublished ? 'bg-primary-600 text-white shadow-lg shadow-primary-100' : 'text-neutral-400 hover:text-neutral-600'}`}
                                    >
                                        <Lock className="w-3.5 h-3.5" /> Lưu bản nháp
                                    </button>
                                </div>
                             </div>
                        </div>

                        {/* Image & Summary */}
                        <div className="grid grid-cols-1 md:grid-cols-12 gap-10">
                            <div className="md:col-span-4 space-y-4">
                                <label className="text-[10px] font-black text-neutral-400 uppercase tracking-[0.2em] pl-1">Ảnh bìa bài viết</label>
                                <div className="aspect-[4/3] bg-white rounded-[32px] border-2 border-dashed border-neutral-100 overflow-hidden relative group shadow-sm transition-all hover:border-primary-300">
                                    {formData.featuredImage ? (
                                        <img src={formData.featuredImage} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                                    ) : (
                                        <div className="w-full h-full flex flex-col items-center justify-center text-neutral-300">
                                            {uploadingImage ? (
                                                <div className="w-10 h-10 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin"></div>
                                            ) : (
                                                <>
                                                    <div className="w-12 h-12 bg-neutral-50 rounded-2xl flex items-center justify-center mb-3">
                                                        <ImageIcon className="w-6 h-6" />
                                                    </div>
                                                    <span className="text-[10px] font-black uppercase tracking-widest">Tải ảnh hoặc dán link</span>
                                                </>
                                            )}
                                        </div>
                                    )}
                                    <div className="absolute inset-x-4 bottom-4 translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all flex flex-col gap-2">
                                        <input 
                                            type="text" 
                                            placeholder="https://images.unsplash.com/..."
                                            className="w-full px-4 py-3 bg-white rounded-xl text-xs outline-none shadow-2xl border border-neutral-100 font-medium"
                                            value={formData.featuredImage}
                                            onChange={e => setFormData({...formData, featuredImage: e.target.value})}
                                        />
                                        <label className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-primary-600 text-white rounded-xl text-xs font-black uppercase tracking-widest shadow-2xl cursor-pointer hover:bg-primary-700 transition-colors">
                                            <Plus className="w-3.5 h-3.5" />
                                            Tải ảnh từ máy tính
                                            <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
                                        </label>
                                    </div>
                                </div>
                            </div>
                            <div className="md:col-span-8 space-y-4">
                                <div className="flex items-center justify-between px-1">
                                    <label className="text-[10px] font-black text-neutral-400 uppercase tracking-[0.2em]">Mô tả tóm tắt (Meta Description)</label>
                                    <span className={`text-[10px] font-black uppercase tracking-widest ${formData.summary.length > 160 ? 'text-rose-500' : 'text-emerald-500'}`}>
                                        {formData.summary.length}/160 Ký tự
                                    </span>
                                </div>
                                <textarea 
                                    rows={7}
                                    className="w-full p-8 bg-white rounded-[32px] border border-neutral-100 shadow-sm focus:ring-4 focus:ring-primary-500/10 focus:border-primary-300 outline-none font-medium text-neutral-600 resize-none transition-all"
                                    placeholder="Đoạn mô tả ngắn này sẽ hiển thị trên Google, hãy viết thật thu hút khách hàng..."
                                    value={formData.summary}
                                    onChange={e => setFormData({...formData, summary: e.target.value})}
                                />
                            </div>
                        </div>

                        {/* Main Editor Section */}
                        <div className="space-y-4 pt-4">
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 px-1">
                                <label className="text-[10px] font-black text-neutral-400 uppercase tracking-[0.2em]">Nội dung chi tiết (Visual Editor)</label>
                                <div className="flex items-center gap-4">
                                    <span className="text-[9px] font-bold text-neutral-300 uppercase tracking-widest flex items-center gap-1.5"><Sparkles className="w-3 h-3 text-primary-400" /> TỰ ĐỘNG LƯU TRẠNG THÁI</span>
                                </div>
                            </div>
                            
                            <div className="min-h-[600px] flex flex-col">
                                <RichTextEditor 
                                    content={formData.content}
                                    onChange={(content) => setFormData({...formData, content})}
                                />
                                <div className="px-8 py-4 flex items-center justify-between text-neutral-400">
                                    <span className="text-[10px] font-black uppercase tracking-widest">
                                        Khoảng {Math.ceil(formData.content.replace(/<[^>]*>/g, '').length / 5)} Từ | {formData.content.replace(/<[^>]*>/g, '').length} Ký tự thực tế
                                    </span>
                                    <div className="flex items-center gap-4">
                                        <span className="text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5">
                                            <Layout className="w-3 h-3" /> WYSIWYG ACTIVE
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
      )}

      {/* Category Management Modal */}
      {isCategoryModalOpen && (
          <div className="fixed inset-0 z-[105] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
              <div className="bg-white w-full max-w-xl rounded-[40px] shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-300">
                  <div className="px-8 py-6 border-b border-slate-50 flex items-center justify-between">
                      <h2 className="text-xl font-black text-slate-900 tracking-tight">QUẢN LÝ DANH MỤC</h2>
                      <button onClick={() => setIsCategoryModalOpen(false)} className="w-10 h-10 flex items-center justify-center rounded-xl bg-slate-50 text-slate-400 hover:text-slate-600 font-black">✕</button>
                  </div>
                  <div className="p-8 space-y-8">
                      {/* Add Category Form */}
                      <form onSubmit={handleAddCategory} className="space-y-4">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Thêm Danh Mục Mới</label>
                          <div className="flex gap-2">
                              <input 
                                  className="flex-1 px-5 py-3 bg-slate-50 rounded-2xl border-none outline-none font-bold text-sm focus:ring-2 focus:ring-primary-500/20 transition-all"
                                  placeholder="Tên danh mục..."
                                  value={newCategory.name}
                                  onChange={e => setNewCategory({...newCategory, name: e.target.value})}
                              />
                              <button 
                                  disabled={isAddingCategory}
                                  className="px-6 py-3 bg-primary-600 text-white rounded-2xl font-black text-[11px] uppercase tracking-widest shadow-lg shadow-primary-100 hover:shadow-primary-200 transition-all disabled:opacity-50"
                              >
                                  {isAddingCategory ? '...' : 'Thêm'}
                              </button>
                          </div>
                      </form>

                      {/* Category List */}
                      <div className="space-y-3">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Danh mục hiện có</label>
                          <div className="max-h-[300px] overflow-y-auto space-y-2 pr-2">
                              {categories.map(cat => (
                                  <div key={cat.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl group hover:bg-white hover:shadow-md transition-all border border-transparent hover:border-slate-100">
                                      <div>
                                          <div className="font-extrabold text-sm text-slate-900">{cat.name}</div>
                                          <div className="text-[10px] font-bold text-slate-400 uppercase">{cat._count?.posts || 0} bài viết</div>
                                      </div>
                                      {/* No delete category implemented in API yet, skipping UI button for now */}
                                  </div>
                              ))}
                          </div>
                      </div>
                  </div>
              </div>
          </div>
      )}

      {/* Confirmation Dialogs */}
      <ConfirmDialog 
        isOpen={!!postToDelete}
        onClose={() => setPostToDelete(null)}
        onConfirm={handleDeletePost}
        title="XÓA BÀI VIẾT"
        message="Bạn có chắc chắn muốn xóa bài viết này không? Hành động này không thể hoàn tác."
        confirmText="Xác nhận xóa"
        loading={isDeleting}
      />

      <Toaster position="bottom-right" />
    </div>
  )
}
