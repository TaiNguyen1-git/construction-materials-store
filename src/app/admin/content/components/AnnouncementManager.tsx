'use client'

import { useState, useEffect } from 'react'
import { Megaphone, Plus, Trash2, Power, Calendar, AlignLeft, X, Upload, Loader2, Search, ChevronDown, MapPin } from 'lucide-react'
import toast from 'react-hot-toast'
import { getGroupedTargets, getTargetLabel } from '@/lib/maintenance-targets'
import { getAuthHeaders } from '@/lib/api-client'

export default function AnnouncementManager() {
    const [announcements, setAnnouncements] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [showForm, setShowForm] = useState(false)
    const [showTargetPicker, setShowTargetPicker] = useState(false)
    const [searchTarget, setSearchTarget] = useState('')
    const [uploading, setUploading] = useState(false)
    const [editingId, setEditingId] = useState<string | null>(null)

    const [formData, setFormData] = useState({
        title: '',
        content: '',
        type: 'INFO',
        displayMode: 'MODAL',
        imageUrl: '',
        actionLabel: '',
        actionUrl: '',
        targetPath: '',
        startTime: new Date().toISOString().slice(0, 16),
        endTime: '',
        isActive: true
    })

    const groupedTargets = getGroupedTargets()

    useEffect(() => {
        fetchAnnouncements()
    }, [])

    const fetchAnnouncements = async () => {
        setLoading(true)
        try {
            const res = await fetch('/api/admin/announcements', { headers: getAuthHeaders() })
            const json = await res.json()
            if (res.ok) setAnnouncements(json.data || [])
        } catch (err) {
            toast.error('Lỗi tải dữ liệu')
        } finally {
            setLoading(false)
        }
    }

    const resetForm = () => {
        setFormData({
            title: '', content: '', type: 'INFO', displayMode: 'MODAL', imageUrl: '',
            actionLabel: '', actionUrl: '', targetPath: '',
            startTime: new Date().toISOString().slice(0, 16), endTime: '', isActive: true
        })
        setEditingId(null)
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        try {
            const isEditing = !!editingId
            const url = '/api/admin/announcements'
            const method = isEditing ? 'PUT' : 'POST'
            const body = isEditing ? { ...formData, id: editingId } : formData

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
                body: JSON.stringify(body)
            })

            if (res.ok) {
                toast.success(isEditing ? 'Đã cập nhật' : 'Đã tạo mới')
                setShowForm(false)
                fetchAnnouncements()
                resetForm()
            }
        } catch (e) {
            toast.error('Lỗi kết nối')
        }
    }

    const startEdit = (ann: any) => {
        setFormData({
            title: ann.title || '', content: ann.content || '', type: ann.type || 'INFO',
            displayMode: ann.displayMode || 'MODAL', imageUrl: ann.imageUrl || '',
            actionLabel: ann.actionLabel || '', actionUrl: ann.actionUrl || '', targetPath: ann.targetPath || '',
            startTime: ann.startTime ? new Date(ann.startTime).toISOString().slice(0, 16) : new Date().toISOString().slice(0, 16),
            endTime: ann.endTime ? new Date(ann.endTime).toISOString().slice(0, 16) : '',
            isActive: ann.isActive ?? true
        })
        setEditingId(ann.id)
        setShowForm(true)
    }

    const toggleStatus = async (id: string, currentStatus: boolean) => {
        try {
            const res = await fetch('/api/admin/announcements', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
                body: JSON.stringify({ id, isActive: !currentStatus })
            })
            if (res.ok) {
                toast.success('Đã cập nhật')
                fetchAnnouncements()
            }
        } catch (e) { toast.error('Lỗi cập nhật') }
    }

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]; if (!file) return
        setUploading(true); const toastId = toast.loading('Đang tải ảnh...')
        try {
            const uploadData = new FormData(); uploadData.append('file', file)
            const res = await fetch('/api/upload/secure', { method: 'POST', headers: getAuthHeaders(), body: uploadData })
            const result = await res.json()
            if (res.ok) {
                setFormData(prev => ({ ...prev, imageUrl: `/api/files/${result.fileId}` }))
                toast.success('Đã tải ảnh thành công', { id: toastId })
            }
        } catch (error) { toast.error('Lỗi tải ảnh', { id: toastId }) } finally { setUploading(false) }
    }

    const handleDelete = async (id: string) => {
        if (!confirm('Bạn chắc chắn muốn xóa?')) return
        try {
            const res = await fetch(`/api/admin/announcements?id=${id}`, { method: 'DELETE', headers: getAuthHeaders() })
            if (res.ok) { toast.success('Đã xóa'); fetchAnnouncements() }
        } catch (e) { toast.error('Lỗi xóa') }
    }

    const filteredGroups = Object.entries(groupedTargets).reduce((acc, [group, items]) => {
        const filtered = items.filter(item => item.label.toLowerCase().includes(searchTarget.toLowerCase()))
        if (filtered.length > 0) acc[group] = filtered; return acc
    }, {} as Record<string, any[]>)

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">Thông Báo Hệ Thống</h2>
                    <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-1">Quản trị truyền thông & bảo trì toàn trang</p>
                </div>
                <button onClick={() => { resetForm(); setShowForm(true); }} className="bg-blue-600 text-white px-5 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-blue-700 shadow-lg shadow-blue-500/20 transition-all flex items-center gap-2">
                    <Plus size={14} /> Tạo Thông Báo
                </button>
            </div>

            <div className="grid gap-4">
                {loading ? (
                    <div className="text-center py-12 text-[10px] font-black text-slate-400 uppercase tracking-widest">Đang tải...</div>
                ) : announcements.length === 0 ? (
                    <div className="text-center py-12 bg-slate-50 rounded-[32px] border border-dashed border-slate-200 font-black text-[11px] text-slate-400 uppercase">Chưa có thông báo nào</div>
                ) : announcements.map((ann) => (
                    <div key={ann.id} className={`bg-white p-6 rounded-[32px] border transition-all group hover:shadow-xl ${ann.isActive ? 'border-slate-100' : 'opacity-60 bg-slate-50 border-transparent'}`}>
                        <div className="flex justify-between items-start gap-6">
                            <div className="flex gap-6 flex-1">
                                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 shadow-inner ${
                                    ann.type === 'MAINTENANCE' ? 'bg-amber-100 text-amber-600' :
                                    ann.type === 'FEATURE' ? 'bg-purple-100 text-purple-600' :
                                    ann.type === 'POLICY' ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-500'
                                }`}>
                                    <Megaphone size={24} />
                                </div>
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                                        <span className="text-[8px] font-black px-2 py-0.5 rounded-md bg-slate-900 text-white uppercase tracking-widest">{ann.type}</span>
                                        <span className="text-[8px] font-black px-2 py-0.5 rounded-md bg-blue-50 text-blue-600 border border-blue-100 uppercase tracking-widest">{ann.displayMode}</span>
                                        {ann.targetPath && <span className="text-[8px] font-black px-2 py-0.5 rounded-md bg-amber-50 text-amber-600 border border-amber-100 flex items-center gap-1 uppercase tracking-widest"><MapPin size={10} /> {getTargetLabel(ann.targetPath)}</span>}
                                        {ann.isActive && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>}
                                    </div>
                                    <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">{ann.title}</h3>
                                    <p className="text-[10px] text-slate-400 font-bold mt-1 line-clamp-2 uppercase tracking-wide">{ann.content}</p>
                                    <div className="flex items-center gap-4 mt-3 text-[9px] font-black text-slate-400 uppercase tracking-widest">
                                        <div className="flex items-center gap-1.5"><Calendar size={12} className="text-blue-500" /> {new Date(ann.startTime).toLocaleString('vi-VN')}</div>
                                        {ann.endTime && <div>→ {new Date(ann.endTime).toLocaleString('vi-VN')}</div>}
                                    </div>
                                </div>
                            </div>
                            <div className="flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={() => toggleStatus(ann.id, ann.isActive)} className={`p-2 rounded-xl transition-all shadow-sm ${ann.isActive ? 'bg-emerald-500 text-white' : 'bg-white text-slate-300 border border-slate-100'}`}><Power size={18} /></button>
                                <button onClick={() => startEdit(ann)} className="p-2 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-600 hover:text-white transition-all shadow-sm"><AlignLeft size={18} /></button>
                                <button onClick={() => handleDelete(ann.id)} className="p-2 bg-red-50 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all shadow-sm"><Trash2 size={18} /></button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {showForm && (
                <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md">
                    <div className="bg-white w-full max-w-2xl rounded-[40px] shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-300 max-h-[90vh]">
                        <div className="p-6 bg-slate-900 text-white flex justify-between items-center">
                            <div><h3 className="text-xl font-black uppercase tracking-tight">{editingId ? 'Cập Nhật Thông Báo' : 'Cấu Hình Thông Báo Mới'}</h3><p className="text-[10px] font-black uppercase opacity-70 mt-1.5 tracking-widest">Quản trị sự kiện & trạng thái hệ thống</p></div>
                            <button onClick={() => setShowForm(false)} className="p-3 bg-white/10 rounded-2xl hover:rotate-90 transition-all"><X size={20} /></button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-8 space-y-5 overflow-y-auto">
                            <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Tiêu đề thông báo</label>
                                <input className="w-full px-4 py-3 bg-slate-50 border-none rounded-2xl text-sm font-black outline-none" placeholder="Vd: Bảo trì tính năng Chatbot AI" value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} required />
                            </div>

                            <div className="grid grid-cols-2 gap-5">
                                <div><label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Loại tin</label><select className="w-full px-4 py-3 bg-slate-50 border-none rounded-2xl text-[11px] font-black uppercase tracking-widest outline-none cursor-pointer" value={formData.type} onChange={e => setFormData({ ...formData, type: e.target.value })}><option value="INFO">📢 Tin Tức</option><option value="MAINTENANCE">🔧 Bảo Trì (Chặn)</option><option value="FEATURE">✨ Tính Năng Mới</option><option value="POLICY">📜 Chính Sách</option></select></div>
                                <div><label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Kiểu hiển thị</label><select className="w-full px-4 py-3 bg-slate-50 border-none rounded-2xl text-[11px] font-black uppercase tracking-widest outline-none cursor-pointer" value={formData.displayMode} onChange={e => setFormData({ ...formData, displayMode: e.target.value })}><option value="MODAL">🖼️ Modal (Giữa)</option><option value="BANNER">📍 Banner (Dải ngang)</option></select></div>
                            </div>

                            <div className="relative">
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Trang bị ảnh hưởng</label>
                                <button type="button" onClick={() => setShowTargetPicker(!showTargetPicker)} className="w-full px-4 py-3 bg-slate-50 rounded-2xl text-[11px] font-black uppercase text-left flex items-center justify-between">
                                    <span className={formData.targetPath ? 'text-slate-900' : 'text-slate-400'}>{formData.targetPath ? getTargetLabel(formData.targetPath) : 'Toàn bộ hệ thống'}</span>
                                    <ChevronDown size={18} className={`transition-transform ${showTargetPicker ? 'rotate-180' : ''}`} />
                                </button>
                                {showTargetPicker && (
                                    <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-100 rounded-3xl shadow-2xl z-50 max-h-60 overflow-y-auto p-2">
                                        <div className="p-2 sticky top-0 bg-white"><input type="text" placeholder="Tìm kiếm trang..." className="w-full bg-slate-50 rounded-xl px-4 py-2 text-[10px] font-black uppercase outline-none" value={searchTarget} onChange={e => setSearchTarget(e.target.value)} /></div>
                                        <button type="button" onClick={() => { setFormData({ ...formData, targetPath: '' }); setShowTargetPicker(false); }} className="w-full p-3 text-left text-[10px] font-black uppercase text-slate-400 hover:bg-slate-50 rounded-xl transition-colors">❌ Toàn bộ hệ thống</button>
                                        {Object.entries(filteredGroups).map(([group, items]) => (
                                            <div key={group}><div className="px-3 py-2 text-[8px] font-black text-slate-300 uppercase tracking-widest">{group}</div>
                                            {items.map(item => (<button key={item.key} type="button" onClick={() => { setFormData({ ...formData, targetPath: item.key }); setShowTargetPicker(false); setSearchTarget(''); }} className={`w-full p-3 text-left text-[10px] font-black uppercase rounded-xl transition-colors ${formData.targetPath === item.key ? 'bg-blue-50 text-blue-600' : 'text-slate-600 hover:bg-slate-50'}`}>{item.label}</button>))}</div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div><label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Nội dung chi tiết</label><textarea className="w-full px-4 py-3 bg-slate-50 border-none rounded-2xl text-sm font-medium text-slate-600 outline-none resize-none" rows={3} placeholder="Thông báo cho người dùng..." value={formData.content} onChange={e => setFormData({ ...formData, content: e.target.value })} required /></div>

                            <div className="grid grid-cols-2 gap-5">
                                <div><label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 flex justify-between"><span>Ảnh đính kèm</span> {uploading && <Loader2 size={12} className="animate-spin" />}</label>
                                <div className="flex gap-2"><input className="flex-1 bg-slate-50 rounded-xl px-3 py-2 text-[10px] font-bold outline-none" value={formData.imageUrl} onChange={e => setFormData({ ...formData, imageUrl: e.target.value })} placeholder="URL..." /><label className="p-2 bg-blue-50 text-blue-600 rounded-xl cursor-pointer hover:bg-blue-600 hover:text-white transition-all"><Upload size={14} /><input type="file" className="hidden" onChange={handleFileUpload} accept="image/*" disabled={uploading} /></label></div></div>
                                <div><label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Nút hành động (CTA)</label><div className="space-y-1.5"><input className="w-full bg-slate-50 rounded-xl px-3 py-2 text-[10px] font-black uppercase outline-none" placeholder="Nhãn: Xem ngay" value={formData.actionLabel} onChange={e => setFormData({ ...formData, actionLabel: e.target.value })} /><input className="w-full bg-slate-50 rounded-xl px-3 py-2 text-[10px] font-bold outline-none" placeholder="Link: /news/..." value={formData.actionUrl} onChange={e => setFormData({ ...formData, actionUrl: e.target.value })} /></div></div>
                            </div>

                            <div className="grid grid-cols-2 gap-5">
                                <div><label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Bắt đầu</label><input type="datetime-local" className="w-full px-4 py-2.5 bg-slate-50 border-none rounded-xl text-xs font-black outline-none" value={formData.startTime} onChange={e => setFormData({ ...formData, startTime: e.target.value })} /></div>
                                <div><label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Kết thúc</label><input type="datetime-local" className="w-full px-4 py-2.5 bg-slate-50 border-none rounded-xl text-xs font-black outline-none" value={formData.endTime} onChange={e => setFormData({ ...formData, endTime: e.target.value })} /></div>
                            </div>

                            <div className="flex justify-between items-center pt-4 border-t border-slate-50">
                                <label className="flex items-center gap-3 cursor-pointer"><div className={`w-10 h-5 rounded-full transition-colors relative ${formData.isActive ? 'bg-emerald-500' : 'bg-slate-200'}`}><input type="checkbox" className="sr-only" checked={formData.isActive} onChange={e => setFormData({ ...formData, isActive: e.target.checked })} /><div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-all ${formData.isActive ? 'left-5.5' : 'left-0.5'}`}></div></div><span className="text-[10px] font-black uppercase tracking-widest text-slate-600">Kích hoạt ngay</span></label>
                                <div className="flex gap-2"><button type="button" onClick={() => setShowForm(false)} className="px-6 py-3 text-slate-400 font-black text-[10px] uppercase tracking-widest hover:bg-slate-100 rounded-2xl transition-all">Hủy</button><button type="submit" className="px-8 py-3 bg-blue-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-700 shadow-xl shadow-blue-500/20 transition-all">{editingId ? 'Cập Nhật' : 'Đăng Tin'}</button></div>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}
