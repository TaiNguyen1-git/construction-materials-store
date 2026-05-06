'use client'

import { useState, useEffect } from 'react'
import { 
  Plus, Search, Edit, Trash2, BookOpen, 
  Calendar, Eye, Globe, Lock, ChevronRight,
  Tag, Image as ImageIcon, Sparkles, Layout
} from 'lucide-react'
import { fetchWithAuth } from '@/lib/api-client'
import { format } from 'date-fns'
import toast from 'react-hot-toast'
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

export default function BlogManager() {
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

  const [isDeleting, setIsDeleting] = useState(false)
  const [postToDelete, setPostToDelete] = useState<string | null>(null)
  
  const [formData, setFormData] = useState({
    title: '',
    summary: '',
    content: '',
    featuredImage: '',
    categoryId: '',
    tags: [] as string[],
    isPublished: false
  })

  const [uploadingImage, setUploadingImage] = useState(false)
  const [appliedSearch, setAppliedSearch] = useState('')

  useEffect(() => {
    fetchCategories()
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchTerm !== appliedSearch) {
        setAppliedSearch(searchTerm)
        setPage(1)
      }
    }, 500)
    return () => clearTimeout(timer)
  }, [searchTerm, appliedSearch])

  useEffect(() => {
    fetchPosts()
  }, [page, sortBy, selectedCategory, appliedSearch])

  const fetchPosts = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      params.append('page', page.toString())
      params.append('limit', '9')
      params.append('sortBy', sortBy)
      params.append('search', appliedSearch)
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

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-neutral-900 uppercase tracking-tight">Tin Tức & Blog</h2>
          <p className="text-[10px] text-neutral-400 font-black uppercase tracking-widest mt-1">Xây dựng thư viện kiến thức và tin tức SmartBuild</p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="bg-blue-600 text-white px-5 py-2.5 rounded-xl flex items-center gap-2 font-black text-[10px] uppercase tracking-widest shadow-lg shadow-blue-500/20 hover:-translate-y-0.5 transition-all"
        >
          <Plus size={14} />
          Viết Bài Mới
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: 'Tổng Bài Viết', value: posts.length, icon: BookOpen, color: 'bg-blue-50 text-blue-600' },
          { label: 'Đã Công Khai', value: posts.filter(p => p.isPublished).length, icon: Globe, color: 'bg-emerald-50 text-emerald-600' },
          { label: 'Lượt Xem', value: posts.reduce((acc, p) => acc + p.viewCount, 0).toLocaleString(), icon: Eye, color: 'bg-purple-50 text-purple-600' },
          { label: 'Danh Mục', value: categories.length, icon: Tag, color: 'bg-amber-50 text-amber-600' }
        ].map((stat, i) => (
          <div key={i} className="bg-white p-4 rounded-[24px] border border-neutral-100 shadow-sm flex items-center justify-between">
            <div>
              <div className="text-[9px] font-black text-neutral-400 uppercase tracking-widest mb-1">{stat.label}</div>
              <div className={`text-lg font-black ${stat.color.split(' ')[1]}`}>{stat.value}</div>
            </div>
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${stat.color}`}>
              <stat.icon size={16} />
            </div>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-3 bg-white p-2.5 rounded-[24px] border border-neutral-100 shadow-sm">
         <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-300 w-4 h-4" />
            <input 
               type="text"
               placeholder="Tìm theo tiêu đề hoặc tác giả..."
               className="w-full pl-11 pr-4 py-2 bg-neutral-50 rounded-xl border-none focus:ring-2 focus:ring-blue-500/10 outline-none text-xs font-bold transition-all"
               value={searchTerm}
               onChange={(e) => setSearchTerm(e.target.value)}
            />
         </div>
         <select 
            className="px-4 py-2 bg-neutral-50 text-neutral-600 rounded-xl font-black text-[10px] uppercase tracking-widest border-none outline-none focus:ring-2 focus:ring-blue-500/10 cursor-pointer"
            value={sortBy}
            onChange={(e) => setBy(e.target.value)}
        >
            <option value="createdAt">Mới nhất</option>
            <option value="viewCount">Xem nhiều nhất</option>
        </select>
        <select 
            className="px-4 py-2 bg-neutral-50 text-neutral-600 rounded-xl font-black text-[10px] uppercase tracking-widest border-none outline-none focus:ring-2 focus:ring-blue-500/10 cursor-pointer"
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
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {posts.map((post) => (
          <div key={post.id} className="bg-white rounded-[28px] overflow-hidden border border-neutral-100 shadow-sm hover:shadow-xl hover:border-blue-100 transition-all duration-300 flex flex-col group">
             <div className="h-40 relative overflow-hidden bg-neutral-50">
                {post.featuredImage ? (
                    <img src={post.featuredImage} alt={post.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-neutral-200">
                        <ImageIcon size={32} />
                    </div>
                )}
                <div className="absolute top-3 right-3 flex gap-2">
                    <button onClick={() => handleOpenModal(post)} className="p-2 bg-white/90 backdrop-blur-md text-slate-400 rounded-xl shadow-lg hover:text-blue-600 transition-all"><Edit size={14} /></button>
                    <button onClick={() => setPostToDelete(post.id)} className="p-2 bg-white/90 backdrop-blur-md text-rose-400 rounded-xl shadow-lg hover:text-rose-600 transition-all"><Trash2 size={14} /></button>
                </div>
                <div className="absolute top-3 left-3">
                    <span className={`px-2.5 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest shadow-md ${post.isPublished ? 'bg-emerald-500 text-white' : 'bg-blue-500 text-white'}`}>
                        {post.isPublished ? 'Đã đăng' : 'Bản nháp'}
                    </span>
                </div>
             </div>

             <div className="p-5 flex-1 flex flex-col">
                <div className="flex items-center gap-2 mb-2">
                    {post.category && <span className="text-[9px] font-black text-blue-600 uppercase tracking-widest px-2 py-0.5 bg-blue-50 rounded-md">{post.category.name}</span>}
                    <span className="text-[9px] font-bold text-neutral-400 uppercase">{format(new Date(post.createdAt), 'dd.MM.yyyy')}</span>
                </div>
                <h3 className="text-md font-black text-neutral-900 leading-tight mb-2 line-clamp-2">{post.title}</h3>
                <p className="text-neutral-500 text-[11px] font-medium line-clamp-2 mb-4 italic">{post.summary || "Chưa có mô tả ngắn."}</p>
                <div className="mt-auto pt-3 border-t border-neutral-50 flex items-center justify-between text-[10px] font-bold text-neutral-400">
                    <div className="flex items-center gap-2">
                        <div className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 uppercase">{post.author.name.charAt(0)}</div>
                        <span className="uppercase tracking-wider">{post.author.name}</span>
                    </div>
                    <span className="flex items-center gap-1"><Eye size={12} /> {post.viewCount}</span>
                </div>
             </div>
          </div>
        ))}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8 bg-slate-900/40 backdrop-blur-md">
            <div className="bg-white w-full max-w-5xl h-full md:max-h-[90vh] md:rounded-[32px] shadow-2xl overflow-hidden flex flex-col animate-in slide-in-from-bottom-8 duration-500">
                <div className="px-8 py-4 border-b border-slate-100 flex items-center justify-between">
                    <div>
                        <h2 className="text-lg font-black text-slate-900 uppercase tracking-tight">{editingPost ? 'Chỉnh Sửa Bài Viết' : 'Tạo Bài Viết Mới'}</h2>
                        <div className="flex items-center gap-2 mt-0.5 text-[9px] font-black uppercase tracking-widest text-blue-600">
                            {formData.isPublished ? <Globe size={12} /> : <Lock size={12} />} {formData.isPublished ? 'CÔNG KHAI' : 'LƯU NHÁP'}
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <button onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-neutral-400 font-black text-[10px] uppercase tracking-widest hover:bg-neutral-50 rounded-xl transition-all">Hủy</button>
                        <button onClick={handleSubmit} className="px-6 py-2 bg-blue-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-blue-500/20 transition-all">Lưu & Đăng</button>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-8 space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
                        <div className="md:col-span-8 space-y-6">
                            <div>
                                <label className="text-[9px] font-black text-neutral-400 uppercase tracking-widest mb-1.5 block">Tiêu đề bài viết</label>
                                <input type="text" className="w-full bg-slate-50 border-none text-2xl font-black text-neutral-900 placeholder:text-neutral-200 rounded-xl px-5 py-3 outline-none" placeholder="Tiêu đề bài viết..." value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} />
                            </div>
                            <RichTextEditor content={formData.content} onChange={(content) => setFormData({...formData, content})} />
                        </div>
                        <div className="md:col-span-4 space-y-6">
                            <div>
                                <label className="text-[9px] font-black text-neutral-400 uppercase tracking-widest mb-1.5 block">Mô tả tóm tắt</label>
                                <textarea rows={4} className="w-full p-4 bg-slate-50 border-none rounded-xl text-xs font-medium text-neutral-600 outline-none resize-none" placeholder="Tóm tắt bài viết..." value={formData.summary} onChange={e => setFormData({...formData, summary: e.target.value})} />
                            </div>
                            <div>
                                <label className="text-[9px] font-black text-neutral-400 uppercase tracking-widest mb-1.5 block">Ảnh bìa (URL hoặc Tải lên)</label>
                                <div className="aspect-video bg-slate-50 rounded-xl border-2 border-dashed border-slate-100 flex flex-col items-center justify-center relative overflow-hidden group">
                                    {formData.featuredImage ? (
                                        <img src={formData.featuredImage} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="flex flex-col items-center gap-2 text-neutral-300">
                                            {uploadingImage ? <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div> : <ImageIcon size={24} />}
                                            <span className="text-[8px] font-black uppercase tracking-widest">Tải ảnh</span>
                                        </div>
                                    )}
                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-all flex flex-col items-center justify-center p-4 gap-2">
                                        <input type="text" className="w-full px-3 py-1.5 bg-white rounded-lg text-[10px] outline-none" placeholder="Dán link ảnh..." value={formData.featuredImage} onChange={e => setFormData({...formData, featuredImage: e.target.value})} />
                                        <label className="px-4 py-2 bg-blue-600 text-white rounded-lg text-[9px] font-black uppercase cursor-pointer">Chọn tệp<input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} /></label>
                                    </div>
                                </div>
                            </div>
                            <div>
                                <label className="text-[9px] font-black text-neutral-400 uppercase tracking-widest mb-1.5 block">Danh mục</label>
                                <select className="w-full px-4 py-2.5 bg-slate-50 border-none rounded-xl text-[11px] font-black uppercase tracking-widest outline-none" value={formData.categoryId} onChange={e => setFormData({...formData, categoryId: e.target.value})}>
                                    <option value="">Chọn danh mục</option>
                                    {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                                </select>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
      )}

      <ConfirmDialog isOpen={!!postToDelete} onClose={() => setPostToDelete(null)} onConfirm={handleDeletePost} title="XÓA BÀI VIẾT" message="Bạn có chắc muốn xóa bài viết này không?" loading={isDeleting} />
    </div>
  )
}
