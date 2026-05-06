'use client'

import { useState, useEffect } from 'react'
import { Plus, Edit, Trash2, Search, Image as ImageIcon, ExternalLink, CheckCircle, XCircle } from 'lucide-react'

interface Banner {
    id: string
    title: string
    description: string
    imageUrl: string
    tag?: string
    link?: string
    order: number
    isActive: boolean
    createdAt: string
    updatedAt: string
}

export default function BannerManager() {
    const [banners, setBanners] = useState<Banner[]>([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [editingBanner, setEditingBanner] = useState<Banner | null>(null)
    const [previewImage, setPreviewImage] = useState<string | null>(null)

    const [formData, setFormData] = useState({
        title: '',
        description: '',
        imageUrl: '',
        tag: '',
        link: '',
        order: 0,
        isActive: true
    })

    useEffect(() => {
        fetchBanners()
    }, [])

    const fetchBanners = async () => {
        try {
            setLoading(true)
            const response = await fetch('/api/banners')
            const data = await response.json()
            setBanners(Array.isArray(data) ? data : [])
        } catch (error) {
            console.error('Failed to fetch banners', error)
        } finally {
            setLoading(false)
        }
    }

    const handleOpenModal = (banner?: Banner) => {
        if (banner) {
            setEditingBanner(banner)
            setFormData({
                title: banner.title,
                description: banner.description,
                imageUrl: banner.imageUrl,
                tag: banner.tag || '',
                link: banner.link || '',
                order: banner.order,
                isActive: banner.isActive
            })
        } else {
            setEditingBanner(null)
            setFormData({
                title: '',
                description: '',
                imageUrl: '',
                tag: '',
                link: '',
                order: 0,
                isActive: true
            })
        }
        setIsModalOpen(true)
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        try {
            const url = editingBanner ? `/api/banners/${editingBanner.id}` : '/api/banners'
            const method = editingBanner ? 'PUT' : 'POST'

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            })

            if (!res.ok) throw new Error('Failed to save banner')

            fetchBanners()
            setIsModalOpen(false)
        } catch (error) {
            console.error('Error saving banner:', error)
            alert('Có lỗi xảy ra khi lưu banner!')
        }
    }

    const handleDelete = async (id: string) => {
        if (!confirm('Bạn có chắc chắn muốn xóa banner này không?')) return
        try {
            const res = await fetch(`/api/banners/${id}`, { method: 'DELETE' })
            if (!res.ok) throw new Error('Failed to delete banner')
            fetchBanners()
        } catch (error) {
            console.error('Error deleting banner:', error)
        }
    }

    const filteredBanners = banners.filter(b =>
        b.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        b.description?.toLowerCase().includes(searchTerm.toLowerCase())
    )

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">Quản Lý Banner</h2>
                    <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-1">Quản trị nội dung quảng bá trang chủ</p>
                </div>
                <button
                    onClick={() => handleOpenModal()}
                    className="bg-blue-600 text-white px-5 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-blue-700 shadow-lg shadow-blue-500/20 transition-all flex items-center gap-2"
                >
                    <Plus size={14} /> Thêm Banner Mới
                </button>
            </div>

            <div className="relative max-w-md">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                <input
                    type="text"
                    placeholder="Tìm kiếm banner..."
                    className="w-full pl-12 pr-4 py-3 bg-slate-50 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-blue-500/10 outline-none"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-slate-50/50">
                        <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                            <th className="px-6 py-4 w-16 text-center">STT</th>
                            <th className="px-6 py-4">Hình Ảnh Preview</th>
                            <th className="px-6 py-4">Thông Tin Nội Dung</th>
                            <th className="px-6 py-4">Trạng Thái</th>
                            <th className="px-6 py-4 text-right">Thao Tác</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                        {loading ? (
                          <tr><td colSpan={5} className="px-6 py-12 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">Đang tải...</td></tr>
                        ) : filteredBanners.map((banner) => (
                            <tr key={banner.id} className="hover:bg-slate-50/50 transition-colors group">
                                <td className="px-6 py-4 text-xs font-black text-slate-900 text-center">{banner.order}</td>
                                <td className="px-6 py-4">
                                    <div
                                        className="h-16 w-36 relative rounded-xl overflow-hidden bg-slate-100 border border-slate-100 cursor-zoom-in group/img shadow-inner"
                                        onClick={() => setPreviewImage(banner.imageUrl)}
                                    >
                                        <img src={banner.imageUrl} alt={banner.title} className="w-full h-full object-cover group-hover/img:scale-110 transition-transform duration-500" />
                                        <div className="absolute inset-0 bg-blue-600/0 group-hover/img:bg-blue-600/10 transition-colors flex items-center justify-center">
                                            <Search className="text-white opacity-0 group-hover/img:opacity-100 w-5 h-5 drop-shadow-md" />
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="text-sm font-black text-slate-900 uppercase tracking-tight">{banner.title}</div>
                                    <div className="text-[10px] text-slate-400 font-bold line-clamp-1 mt-0.5">{banner.description}</div>
                                    {banner.tag && <span className="inline-block px-1.5 py-0.5 bg-blue-50 text-blue-600 rounded text-[8px] font-black uppercase tracking-widest mt-1.5 border border-blue-100">{banner.tag}</span>}
                                </td>
                                <td className="px-6 py-4">
                                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${banner.isActive ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-slate-100 text-slate-500 border-slate-200'}`}>
                                        {banner.isActive ? <CheckCircle size={10} /> : <XCircle size={10} />}
                                        {banner.isActive ? 'Đang hiển thị' : 'Đã ẩn'}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button onClick={() => handleOpenModal(banner)} className="p-2 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-600 hover:text-white transition-all shadow-sm"><Edit size={16} /></button>
                                        <button onClick={() => handleDelete(banner.id)} className="p-2 bg-red-50 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all shadow-sm"><Trash2 size={16} /></button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {previewImage && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-950/90 backdrop-blur-sm p-10 cursor-zoom-out" onClick={() => setPreviewImage(null)}>
                    <img src={previewImage} alt="Full Preview" className="max-w-full max-h-full object-contain shadow-2xl rounded-2xl animate-in zoom-in-95 duration-300" />
                    <button className="absolute top-8 right-8 text-white/50 hover:text-white transition-colors"><XCircle size={32} /></button>
                </div>
            )}

            {isModalOpen && (
                <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md">
                    <div className="bg-white w-full max-w-2xl rounded-[40px] shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-300">
                        <div className="p-6 bg-blue-600 text-white flex justify-between items-center">
                            <div><h3 className="text-xl font-black uppercase tracking-tight">{editingBanner ? 'Cập Nhật Banner' : 'Thiết Kế Banner Mới'}</h3><p className="text-[10px] font-black uppercase opacity-70 mt-1.5 tracking-widest">Cấu hình hiển thị nội dung quảng bá</p></div>
                            <button onClick={() => setIsModalOpen(false)} className="p-3 bg-white/10 rounded-2xl hover:rotate-90 transition-all"><XCircle size={20} /></button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-8 space-y-5">
                            <div className="grid grid-cols-2 gap-5">
                                <div className="col-span-2">
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Tiêu Đề Banner</label>
                                    <input type="text" required className="w-full px-4 py-3 bg-slate-50 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-blue-500/10 outline-none" value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} />
                                </div>
                                <div className="col-span-2">
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Mô Tả Hiển Thị</label>
                                    <textarea required rows={3} className="w-full px-4 py-3 bg-slate-50 border-none rounded-2xl text-sm font-medium text-slate-600 outline-none resize-none" value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} />
                                </div>
                                <div className="col-span-2">
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">URL Hình Ảnh</label>
                                    <input type="url" required className="w-full px-4 py-3 bg-slate-50 border-none rounded-2xl text-sm font-bold outline-none mb-3" value={formData.imageUrl} onChange={e => setFormData({ ...formData, imageUrl: e.target.value })} />
                                    {formData.imageUrl && <div className="h-32 bg-slate-100 rounded-2xl overflow-hidden border border-slate-200"><img src={formData.imageUrl} className="w-full h-full object-cover" /></div>}
                                </div>
                                <div><label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Tag / Badge</label><input type="text" className="w-full px-4 py-3 bg-slate-50 border-none rounded-2xl text-sm font-bold outline-none" value={formData.tag} onChange={e => setFormData({ ...formData, tag: e.target.value })} /></div>
                                <div><label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Thứ Tự Hiển Thị</label><input type="number" className="w-full px-4 py-3 bg-slate-50 border-none rounded-2xl text-sm font-bold outline-none" value={formData.order} onChange={e => setFormData({ ...formData, order: parseInt(e.target.value) || 0 })} /></div>
                                <div className="col-span-2"><label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Link Điều Hướng</label><input type="text" className="w-full px-4 py-3 bg-slate-50 border-none rounded-2xl text-sm font-bold outline-none" value={formData.link} onChange={e => setFormData({ ...formData, link: e.target.value })} /></div>
                                <div className="col-span-2"><label className="flex items-center gap-3 cursor-pointer p-4 bg-slate-50 rounded-2xl"><input type="checkbox" className="w-4 h-4 text-blue-600 rounded-lg border-slate-300" checked={formData.isActive} onChange={e => setFormData({ ...formData, isActive: e.target.checked })} /><span className="text-xs font-black text-slate-600 uppercase tracking-widest">Kích hoạt hiển thị banner</span></label></div>
                            </div>
                            <div className="flex justify-end gap-3 pt-4"><button type="button" onClick={() => setIsModalOpen(false)} className="px-6 py-3 text-slate-500 font-black text-[10px] uppercase tracking-widest hover:bg-slate-100 rounded-2xl transition-all">Hủy Bỏ</button><button type="submit" className="px-8 py-3 bg-blue-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-700 shadow-xl shadow-blue-500/20 transition-all">{editingBanner ? 'Cập Nhật' : 'Tạo Mới'}</button></div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}
