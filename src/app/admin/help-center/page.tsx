'use client'

import { useState, useEffect, useCallback } from 'react'
import {
    BookOpen,
    Plus,
    Search,
    Edit2,
    Trash2,
    Eye,
    EyeOff,
    ChevronRight,
    Clock,
    Filter,
    Save,
    X,
    Layout,
    Globe,
    Users,
    ShieldCheck,
    Truck,
    Loader2
} from 'lucide-react'
import toast from 'react-hot-toast'

interface HelpArticle {
    id: string
    title: string
    slug: string
    content: string
    category: string
    targetAudience: string[]
    isPublished: boolean
    sortOrder: number
    viewCount: number
    createdAt: string
    updatedAt: string
}

const AUDIENCES = [
    { value: 'CUSTOMER', label: 'Khách hàng', icon: Globe, color: 'text-blue-600', bgColor: 'bg-blue-50' },
    { value: 'CONTRACTOR', label: 'Nhà thầu', icon: ShieldCheck, color: 'text-orange-600', bgColor: 'bg-orange-50' },
    { value: 'SUPPLIER', label: 'Nhà cung cấp', icon: Truck, color: 'text-emerald-600', bgColor: 'bg-emerald-50' }
]

const CATEGORIES = [
    'Chính sách & Quy định',
    'Hướng dẫn mua hàng',
    'Thanh toán & Hoàn tiền',
    'Vận chuyển & Giao nhận',
    'Dành cho Nhà thầu',
    'Dành cho Nhà cung cấp',
    'Kỹ thuật & AI',
    'Khác'
]

export default function AdminHelpCenterPage() {
    const [articles, setArticles] = useState<HelpArticle[]>([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState('')
    const [editingArticle, setEditingArticle] = useState<Partial<HelpArticle> | null>(null)
    const [isSaving, setIsSaving] = useState(false)

    const fetchArticles = useCallback(async () => {
        try {
            setLoading(true)
            const res = await fetch('/api/admin/help-center')
            if (res.ok) {
                const data = await res.json()
                setArticles(data)
            }
        } catch (error) {
            console.error('Fetch articles error:', error)
            toast.error('Không thể tải danh sách bài viết')
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => {
        fetchArticles()
    }, [fetchArticles])

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!editingArticle?.title || !editingArticle?.content || !editingArticle?.category) {
            toast.error('Vui lòng điền đầy đủ các trường bắt buộc')
            return
        }

        // Generate slug if mission
        const slug = editingArticle.slug || editingArticle.title.toLowerCase()
            .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
            .replace(/[^\w\s-]/g, '')
            .replace(/[\s_-]+/g, '-')
            .replace(/^-+|-+$/g, '')

        try {
            setIsSaving(true)
            const res = await fetch('/api/admin/help-center', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...editingArticle, slug })
            })

            if (res.ok) {
                toast.success(editingArticle.id ? 'Đã cập nhật bài viết' : 'Đã tạo bài viết mới')
                setEditingArticle(null)
                fetchArticles()
            } else {
                const error = await res.json()
                toast.error(error.error || 'Lỗi khi lưu bài viết')
            }
        } catch (error) {
            toast.error('Lỗi kết nối server')
        } finally {
            setIsSaving(false)
        }
    }

    const handleDelete = async (id: string) => {
        if (!confirm('Bạn có chắc chắn muốn xóa bài viết này?')) return

        try {
            const res = await fetch(`/api/admin/help-center?id=${id}`, {
                method: 'DELETE'
            })
            if (res.ok) {
                toast.success('Đã xóa bài viết')
                fetchArticles()
            }
        } catch (error) {
            toast.error('Lỗi khi xóa bài viết')
        }
    }

    const filteredArticles = articles.filter(a =>
        a.title.toLowerCase().includes(search.toLowerCase()) ||
        a.category.toLowerCase().includes(search.toLowerCase())
    )

    return (
        <div className="p-6 max-w-[1600px] mx-auto">
            {/* Header */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-8">
                <div className="flex items-center gap-4">
                    <div className="p-3.5 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl shadow-lg shadow-indigo-200">
                        <BookOpen className="w-7 h-7 text-white" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-black text-slate-900">Quản lý FAQ & Hướng dẫn</h1>
                        <p className="text-sm text-slate-500 font-medium">Tùy chỉnh nội dung Trung tâm hỗ trợ</p>
                    </div>
                </div>
                <button
                    onClick={() => setEditingArticle({
                        title: '',
                        slug: '',
                        content: '',
                        category: CATEGORIES[0],
                        targetAudience: ['CUSTOMER'],
                        isPublished: true,
                        sortOrder: articles.length
                    })}
                    className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white font-bold rounded-2xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200"
                >
                    <Plus className="w-5 h-5" /> Thêm bài viết mới
                </button>
            </div>

            {/* Filters */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="relative md:col-span-2">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Tìm kiếm theo tiêu đề hoặc danh mục..."
                        className="w-full pl-12 pr-4 py-3.5 bg-white border border-slate-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 transition-all shadow-sm"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
                <div className="flex gap-2">
                    <div className="flex-1 px-4 py-3.5 bg-white border border-slate-200 rounded-2xl flex items-center gap-2 text-sm font-bold text-slate-600 shadow-sm">
                        <Filter className="w-4 h-4 text-slate-400" />
                        <span>Tổng: {filteredArticles.length} bài viết</span>
                    </div>
                </div>
            </div>

            {/* Main List */}
            <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50/50">
                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Bài viết</th>
                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Danh mục</th>
                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Đối tượng</th>
                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Trạng thái</th>
                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Lượt xem</th>
                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 text-right">Thao tác</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {loading ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center">
                                        <Loader2 className="w-8 h-8 animate-spin text-indigo-500 mx-auto" />
                                    </td>
                                </tr>
                            ) : filteredArticles.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center">
                                        <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300">
                                            <BookOpen className="w-8 h-8" />
                                        </div>
                                        <p className="font-bold text-slate-400 italic">Chưa có bài viết nào được tìm thấy</p>
                                    </td>
                                </tr>
                            ) : filteredArticles.map(article => (
                                <tr key={article.id} className="hover:bg-slate-50/50 transition-colors group">
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col">
                                            <span className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors line-clamp-1">{article.title}</span>
                                            <span className="text-[10px] text-slate-400 font-medium">/{article.slug}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="px-3 py-1 bg-slate-100 text-slate-600 rounded-lg text-[11px] font-bold border border-slate-200">{article.category}</span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex gap-1.5">
                                            {article.targetAudience.map(aud => {
                                                const config = AUDIENCES.find(a => a.value === aud)
                                                if (!config) return null
                                                return (
                                                    <div key={aud} className={`p-1.5 rounded-lg ${config.bgColor}`} title={config.label}>
                                                        <config.icon className={`w-3.5 h-3.5 ${config.color}`} />
                                                    </div>
                                                )
                                            })}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        {article.isPublished ? (
                                            <span className="flex items-center gap-1.5 text-emerald-600 text-[11px] font-black">
                                                <Eye className="w-3.5 h-3.5" /> XUẤT BẢN
                                            </span>
                                        ) : (
                                            <span className="flex items-center gap-1.5 text-slate-400 text-[11px] font-black">
                                                <EyeOff className="w-3.5 h-3.5" /> NHÁP
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="text-sm font-bold text-slate-600">{article.viewCount}</span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <button
                                                onClick={() => setEditingArticle(article)}
                                                className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"
                                                title="Chỉnh sửa"
                                            >
                                                <Edit2 className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(article.id)}
                                                className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                                                title="Xóa"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Edit Modal */}
            {editingArticle && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
                    <div className="bg-white w-full max-w-4xl max-h-[90vh] rounded-[40px] shadow-2xl overflow-hidden flex flex-col scale-in-center">
                        <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-white sticky top-0">
                            <div className="flex items-center gap-4">
                                <div className="p-2.5 bg-indigo-50 rounded-2xl">
                                    <Edit2 className="w-6 h-6 text-indigo-600" />
                                </div>
                                <h2 className="text-xl font-black text-slate-900">
                                    {editingArticle.id ? 'Chỉnh sửa bài viết' : 'Tạo bài viết mới'}
                                </h2>
                            </div>
                            <button onClick={() => setEditingArticle(null)} className="p-2 border border-slate-100 hover:bg-red-50 hover:text-red-500 rounded-xl transition-all">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-8 space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest px-1">Tiêu đề bài viết *</label>
                                    <input
                                        required
                                        type="text"
                                        className="w-full px-4 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 transition-all"
                                        placeholder="Ví dụ: Quy trình đổi trả hàng hóa"
                                        value={editingArticle.title}
                                        onChange={(e) => setEditingArticle({ ...editingArticle, title: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest px-1">Slug (Đường dẫn)</label>
                                    <input
                                        type="text"
                                        className="w-full px-4 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 transition-all"
                                        placeholder="quy-trinh-doi-tra (Để trống để tự tạo)"
                                        value={editingArticle.slug}
                                        onChange={(e) => setEditingArticle({ ...editingArticle, slug: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="space-y-2">
                                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest px-1">Danh mục *</label>
                                    <select
                                        className="w-full px-4 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 transition-all cursor-pointer"
                                        value={editingArticle.category}
                                        onChange={(e) => setEditingArticle({ ...editingArticle, category: e.target.value })}
                                    >
                                        {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest px-1">Sắp xếp</label>
                                    <input
                                        type="number"
                                        className="w-full px-4 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 transition-all"
                                        value={editingArticle.sortOrder}
                                        onChange={(e) => setEditingArticle({ ...editingArticle, sortOrder: parseInt(e.target.value) || 0 })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest px-1">Chế độ hiển thị</label>
                                    <div className="flex items-center gap-4 py-3">
                                        <label className="flex items-center gap-2 cursor-pointer group">
                                            <input
                                                type="checkbox"
                                                className="w-5 h-5 rounded-lg border-2 border-slate-200 text-indigo-600 focus:ring-indigo-500/20"
                                                checked={editingArticle.isPublished}
                                                onChange={(e) => setEditingArticle({ ...editingArticle, isPublished: e.target.checked })}
                                            />
                                            <span className="text-sm font-bold text-slate-600 group-hover:text-indigo-600 transition-colors">Công khai bài viết</span>
                                        </label>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-black text-slate-400 uppercase tracking-widest px-1">Đối tượng áp dụng</label>
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                    {AUDIENCES.map(aud => {
                                        const isSelected = editingArticle.targetAudience?.includes(aud.value)
                                        return (
                                            <button
                                                key={aud.value}
                                                type="button"
                                                onClick={() => {
                                                    const current = editingArticle.targetAudience || []
                                                    const next = isSelected
                                                        ? current.filter(v => v !== aud.value)
                                                        : [...current, aud.value]
                                                    setEditingArticle({ ...editingArticle, targetAudience: next })
                                                }}
                                                className={`flex items-center gap-3 px-4 py-3 rounded-2xl border transition-all ${isSelected
                                                        ? `border-indigo-200 ${aud.bgColor} shadow-sm translate-y-[-2px]`
                                                        : 'border-slate-100 bg-white hover:border-slate-200 hover:bg-slate-50'
                                                    }`}
                                            >
                                                <aud.icon className={`w-5 h-5 ${isSelected ? aud.color : 'text-slate-400'}`} />
                                                <span className={`text-xs font-bold ${isSelected ? 'text-slate-900' : 'text-slate-500'}`}>{aud.label}</span>
                                                {isSelected && <div className="ml-auto w-2 h-2 rounded-full bg-indigo-500"></div>}
                                            </button>
                                        )
                                    })}
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-black text-slate-400 uppercase tracking-widest px-1 flex items-center justify-between">
                                    Nội dung (Markdown) *
                                    <span className="text-[10px] lowercase normal-case text-slate-400 font-medium italic">Hỗ trợ định dạng văn bản nâng cao</span>
                                </label>
                                <textarea
                                    required
                                    rows={12}
                                    className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-[24px] text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 transition-all font-mono"
                                    placeholder="### Nhập tiêu đề nội dung...
- Danh sách 1
- Danh sách 2
**Văn bản đậm**..."
                                    value={editingArticle.content}
                                    onChange={(e) => setEditingArticle({ ...editingArticle, content: e.target.value })}
                                ></textarea>
                            </div>
                        </form>

                        <div className="p-8 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between">
                            <p className="text-xs text-slate-400 font-medium italic">* Vui lòng kiểm tra kỹ nội dung trước khi xuất bản</p>
                            <div className="flex items-center gap-3">
                                <button
                                    type="button"
                                    onClick={() => setEditingArticle(null)}
                                    className="px-6 py-3 border border-slate-200 text-slate-600 font-bold rounded-2xl hover:bg-white transition-all shadow-sm"
                                >
                                    Hủy bỏ
                                </button>
                                <button
                                    onClick={handleSave}
                                    disabled={isSaving}
                                    className="flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white font-black rounded-2xl hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl shadow-indigo-200 disabled:opacity-50"
                                >
                                    {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                                    {editingArticle.id ? 'Lưu thay đổi' : 'Tạo bài viết'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <style jsx global>{`
                @keyframes scale-in-center {
                    0% { transform: scale(0.5); opacity: 0; }
                    100% { transform: scale(1); opacity: 1; }
                }
                .scale-in-center {
                    animation: scale-in-center 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94) both;
                }
            `}</style>
        </div>
    )
}
