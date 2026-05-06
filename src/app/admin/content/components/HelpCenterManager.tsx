'use client'

import { useState, useEffect, useCallback } from 'react'
import {
    BookOpen, Plus, Search, Edit2, Trash2, Eye, EyeOff,
    Filter, Save, X, Globe, ShieldCheck, Truck, Loader2
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

export default function HelpCenterManager() {
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
        <div className="space-y-6">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div>
                    <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">FAQ & Hướng Dẫn</h2>
                    <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mt-1">Cấu hình nội dung hỗ trợ khách hàng và đối tác</p>
                </div>
                <button
                    onClick={() => setEditingArticle({
                        title: '', slug: '', content: '', category: CATEGORIES[0],
                        targetAudience: ['CUSTOMER'], isPublished: true, sortOrder: articles.length
                    })}
                    className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white font-black text-[10px] uppercase tracking-widest rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/20"
                >
                    <Plus size={14} /> Thêm bài viết mới
                </button>
            </div>

            <div className="flex flex-wrap items-center gap-3 bg-white p-2.5 rounded-[24px] border border-slate-100 shadow-sm">
                <div className="relative flex-1 min-w-[200px]">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Tìm kiếm theo tiêu đề hoặc danh mục..."
                        className="w-full pl-11 pr-4 py-2 bg-slate-50 border-none rounded-xl text-xs font-bold focus:ring-2 focus:ring-blue-500/10 outline-none transition-all"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
                <div className="px-4 py-2 bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest rounded-xl border border-slate-100">
                    Tổng: {filteredArticles.length} bài viết
                </div>
            </div>

            <div className="bg-white rounded-[24px] border border-slate-100 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50/50">
                            <tr>
                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Bài viết</th>
                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Danh mục</th>
                                <th className="px-6 py-4 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">Đối tượng</th>
                                <th className="px-6 py-4 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">Trạng thái</th>
                                <th className="px-6 py-4 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">Thao tác</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {loading ? (
                                <tr><td colSpan={5} className="px-6 py-12 text-center"><Loader2 className="w-6 h-6 animate-spin text-blue-500 mx-auto" /></td></tr>
                            ) : filteredArticles.length === 0 ? (
                                <tr><td colSpan={5} className="px-6 py-12 text-center text-[11px] font-bold text-slate-400 italic">Không tìm thấy bài viết nào</td></tr>
                            ) : filteredArticles.map(article => (
                                <tr key={article.id} className="hover:bg-blue-50/20 transition-colors group">
                                    <td className="px-6 py-4">
                                        <div className="font-black text-slate-900 group-hover:text-blue-600 transition-colors text-sm">{article.title}</div>
                                        <div className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">/{article.slug}</div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="px-3 py-1 bg-slate-50 text-slate-500 rounded-lg text-[9px] font-black uppercase tracking-widest border border-slate-100">{article.category}</span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex justify-center gap-1.5">
                                            {article.targetAudience.map(aud => {
                                                const config = AUDIENCES.find(a => a.value === aud)
                                                return config && <div key={aud} className={`p-1.5 rounded-lg ${config.bgColor}`} title={config.label}><config.icon className={`w-3.5 h-3.5 ${config.color}`} /></div>
                                            })}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <span className={`text-[9px] font-black uppercase tracking-widest ${article.isPublished ? 'text-emerald-500' : 'text-slate-300'}`}>{article.isPublished ? 'CÔNG KHAI' : 'NHÁP'}</span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex justify-end gap-2">
                                            <button onClick={() => setEditingArticle(article)} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"><Edit2 size={14} /></button>
                                            <button onClick={() => handleDelete(article.id)} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"><Trash2 size={14} /></button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {editingArticle && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md">
                    <div className="bg-white w-full max-w-3xl max-h-[90vh] rounded-[32px] shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-300">
                        <div className="p-8 pb-4 border-b border-slate-50 flex items-center justify-between">
                            <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">{editingArticle.id ? 'Sửa bài viết' : 'Thêm bài viết mới'}</h2>
                            <button onClick={() => setEditingArticle(null)} className="p-2 border border-slate-100 hover:bg-red-50 hover:text-red-500 rounded-xl transition-all"><X size={18} /></button>
                        </div>
                        <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-8 space-y-6">
                            <div className="grid grid-cols-2 gap-6">
                                <div><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1 block mb-1.5">Tiêu đề bài viết</label><input required type="text" className="w-full px-4 py-2.5 bg-slate-50 border-none rounded-xl text-sm font-bold focus:ring-2 focus:ring-blue-500/10 outline-none" value={editingArticle.title} onChange={(e) => setEditingArticle({ ...editingArticle, title: e.target.value })} /></div>
                                <div><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1 block mb-1.5">Slug (Link)</label><input type="text" className="w-full px-4 py-2.5 bg-slate-50 border-none rounded-xl text-sm font-bold focus:ring-2 focus:ring-blue-500/10 outline-none" value={editingArticle.slug} onChange={(e) => setEditingArticle({ ...editingArticle, slug: e.target.value })} /></div>
                            </div>
                            <div className="grid grid-cols-3 gap-6">
                                <div><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1 block mb-1.5">Danh mục</label><select className="w-full px-4 py-2.5 bg-slate-50 border-none rounded-xl text-[11px] font-black uppercase tracking-widest outline-none cursor-pointer" value={editingArticle.category} onChange={(e) => setEditingArticle({ ...editingArticle, category: e.target.value })}>{CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}</select></div>
                                <div><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1 block mb-1.5">Thứ tự</label><input type="number" className="w-full px-4 py-2.5 bg-slate-50 border-none rounded-xl text-sm font-bold focus:ring-2 focus:ring-blue-500/10 outline-none" value={editingArticle.sortOrder} onChange={(e) => setEditingArticle({ ...editingArticle, sortOrder: parseInt(e.target.value) || 0 })} /></div>
                                <div className="flex items-center pt-6"><label className="flex items-center gap-2 cursor-pointer group"><input type="checkbox" className="w-5 h-5 rounded-lg border-2 border-slate-200 text-blue-600 focus:ring-blue-500/10" checked={editingArticle.isPublished} onChange={(e) => setEditingArticle({ ...editingArticle, isPublished: e.target.checked })} /><span className="text-[10px] font-black uppercase tracking-widest text-slate-400 group-hover:text-blue-600 transition-colors">Công khai ngay</span></label></div>
                            </div>
                            <div>
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1 block mb-1.5">Đối tượng</label>
                                <div className="grid grid-cols-3 gap-3">
                                    {AUDIENCES.map(aud => {
                                        const isSelected = editingArticle.targetAudience?.includes(aud.value)
                                        return <button key={aud.value} type="button" onClick={() => { const current = editingArticle.targetAudience || []; const next = isSelected ? current.filter(v => v !== aud.value) : [...current, aud.value]; setEditingArticle({ ...editingArticle, targetAudience: next }) }} className={`flex items-center gap-3 px-4 py-2.5 rounded-xl border transition-all ${isSelected ? `border-blue-200 ${aud.bgColor}` : 'border-slate-50 bg-slate-50'}`}><aud.icon className={`w-4 h-4 ${isSelected ? aud.color : 'text-slate-300'}`} /><span className={`text-[10px] font-black uppercase tracking-widest ${isSelected ? 'text-slate-900' : 'text-slate-400'}`}>{aud.label}</span></button>
                                    })}
                                </div>
                            </div>
                            <div><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1 block mb-1.5">Nội dung (Markdown)</label><textarea required rows={10} className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl text-sm font-medium focus:ring-2 focus:ring-blue-500/10 outline-none font-mono" value={editingArticle.content} onChange={(e) => setEditingArticle({ ...editingArticle, content: e.target.value })}></textarea></div>
                            <div className="flex justify-end gap-3 pt-4 border-t border-slate-50">
                                <button type="button" onClick={() => setEditingArticle(null)} className="px-6 py-2.5 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:bg-slate-50 rounded-xl transition-all">Hủy</button>
                                <button onClick={handleSave} disabled={isSaving} className="flex items-center gap-2 px-8 py-2.5 bg-blue-600 text-white font-black text-[10px] uppercase tracking-widest rounded-xl hover:bg-blue-700 shadow-xl shadow-blue-500/20 disabled:opacity-50">{isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}{editingArticle.id ? 'Cập Nhật' : 'Tạo Bài Viết'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}
