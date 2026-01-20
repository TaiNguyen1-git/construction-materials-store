
'use client'

import { useState, useEffect } from 'react'
import { Megaphone, Plus, Trash2, Power, Calendar, AlignLeft, Tag, X, Image as ImageIcon, Link as LinkIcon, Monitor, MapPin, ChevronDown, Search } from 'lucide-react'
import toast, { Toaster } from 'react-hot-toast'
import { getGroupedTargets, getTargetLabel, MAINTENANCE_TARGETS } from '@/lib/maintenance-targets'

export default function AdminAnnouncementsPage() {
    const [announcements, setAnnouncements] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [showForm, setShowForm] = useState(false)
    const [showTargetPicker, setShowTargetPicker] = useState(false)
    const [searchTarget, setSearchTarget] = useState('')

    // Form State
    const [formData, setFormData] = useState({
        title: '',
        content: '',
        type: 'INFO',
        displayMode: 'MODAL',
        imageUrl: '',
        actionLabel: '',
        actionUrl: '',
        targetPath: '', // Will store the KEY like 'FEATURE_CHATBOT'
        startTime: new Date().toISOString().slice(0, 16),
        endTime: '',
        isActive: true
    })

    const groupedTargets = getGroupedTargets()

    const fetchAnnouncements = async () => {
        setLoading(true)
        try {
            const res = await fetch('/api/admin/announcements')
            const json = await res.json()
            if (res.ok) setAnnouncements(json.data || [])
        } catch (err) {
            toast.error('Lỗi tải dữ liệu')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchAnnouncements()
    }, [])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        try {
            const res = await fetch('/api/admin/announcements', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            })
            if (res.ok) {
                toast.success('Đã tạo thông báo mới')
                setShowForm(false)
                fetchAnnouncements()
                setFormData({
                    title: '', content: '', type: 'INFO', displayMode: 'MODAL',
                    imageUrl: '', actionLabel: '', actionUrl: '', targetPath: '',
                    startTime: new Date().toISOString().slice(0, 16), endTime: '', isActive: true
                })
            } else {
                toast.error('Lỗi khi tạo')
            }
        } catch (e) {
            toast.error('Lỗi kết nối')
        }
    }

    const toggleStatus = async (id: string, currentStatus: boolean) => {
        try {
            const res = await fetch('/api/admin/announcements', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, isActive: !currentStatus })
            })
            if (res.ok) {
                toast.success('Đã cập nhật')
                fetchAnnouncements()
            }
        } catch (e) {
            toast.error('Lỗi cập nhật')
        }
    }

    const handleDelete = async (id: string) => {
        if (!confirm('Bạn chắc chắn muốn xóa?')) return
        try {
            const res = await fetch(`/api/admin/announcements?id=${id}`, { method: 'DELETE' })
            if (res.ok) {
                toast.success('Đã xóa')
                fetchAnnouncements()
            }
        } catch (e) {
            toast.error('Lỗi xóa')
        }
    }

    // Filter targets by search
    const filteredGroups = Object.entries(groupedTargets).reduce((acc, [group, items]) => {
        const filtered = items.filter(item =>
            item.label.toLowerCase().includes(searchTarget.toLowerCase())
        )
        if (filtered.length > 0) acc[group] = filtered
        return acc
    }, {} as Record<string, typeof groupedTargets[string]>)

    return (
        <div className="p-8 max-w-7xl mx-auto">
            <Toaster position="top-right" />
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-black text-gray-900 flex items-center gap-3">
                        <Megaphone className="w-8 h-8 text-blue-600" />
                        Quản lý Thông Báo Hệ Thống
                    </h1>
                    <p className="text-gray-500 mt-2">Tạo thông báo bảo trì, tin tức, hoặc giới thiệu tính năng mới.</p>
                </div>
                <button
                    onClick={() => setShowForm(true)}
                    className="bg-black text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-gray-800 transition-all shadow-lg"
                >
                    <Plus className="w-5 h-5" /> Tạo Thông Báo
                </button>
            </div>

            {/* FORM MODAL */}
            {showForm && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl w-full max-w-2xl p-8 shadow-2xl relative max-h-[90vh] overflow-y-auto">
                        <button onClick={() => setShowForm(false)} className="absolute top-6 right-6 text-gray-400 hover:text-black bg-gray-100 p-2 rounded-full">
                            <X className="w-5 h-5" />
                        </button>
                        <h2 className="text-2xl font-black mb-6">Cấu hình thông báo mới</h2>

                        <form onSubmit={handleSubmit} className="space-y-6">
                            {/* Title */}
                            <div>
                                <label className="block text-xs font-black text-gray-400 uppercase mb-2 tracking-widest">Tiêu đề</label>
                                <input
                                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 font-bold text-gray-900 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                                    placeholder="Vd: Bảo trì tính năng Chatbot AI"
                                    value={formData.title}
                                    onChange={e => setFormData({ ...formData, title: e.target.value })}
                                    required
                                />
                            </div>

                            {/* Type & Display Mode */}
                            <div className="grid grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-xs font-black text-gray-400 uppercase mb-2 tracking-widest">Loại thông báo</label>
                                    <select
                                        className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 font-bold text-sm outline-none"
                                        value={formData.type}
                                        onChange={e => setFormData({ ...formData, type: e.target.value })}
                                    >
                                        <option value="INFO">📢 Tin Tức</option>
                                        <option value="MAINTENANCE">🔧 Bảo Trì (Chặn)</option>
                                        <option value="FEATURE">✨ Tính Năng Mới</option>
                                        <option value="POLICY">📜 Chính Sách</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-black text-gray-400 uppercase mb-2 tracking-widest">Kiểu hiển thị</label>
                                    <select
                                        className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 font-bold text-sm outline-none"
                                        value={formData.displayMode}
                                        onChange={e => setFormData({ ...formData, displayMode: e.target.value })}
                                    >
                                        <option value="MODAL">🖼️ Modal (Giữa màn hình)</option>
                                        <option value="BANNER">📍 Banner (Dải thông báo)</option>
                                    </select>
                                </div>
                            </div>

                            {/* TARGET PICKER - User Friendly */}
                            <div>
                                <label className="block text-xs font-black text-gray-400 uppercase mb-2 tracking-widest">
                                    Trang / Tính năng bị ảnh hưởng
                                </label>
                                <div className="relative">
                                    <button
                                        type="button"
                                        onClick={() => setShowTargetPicker(!showTargetPicker)}
                                        className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 font-bold text-sm text-left flex items-center justify-between hover:border-blue-400 transition-colors"
                                    >
                                        <span className={formData.targetPath ? 'text-gray-900' : 'text-gray-400'}>
                                            {formData.targetPath ? getTargetLabel(formData.targetPath) : 'Chọn trang hoặc tính năng...'}
                                        </span>
                                        <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${showTargetPicker ? 'rotate-180' : ''}`} />
                                    </button>

                                    {showTargetPicker && (
                                        <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-2xl shadow-2xl z-50 max-h-80 overflow-hidden">
                                            {/* Search */}
                                            <div className="p-3 border-b border-gray-100 sticky top-0 bg-white">
                                                <div className="relative">
                                                    <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
                                                    <input
                                                        type="text"
                                                        placeholder="Tìm kiếm..."
                                                        className="w-full bg-gray-50 rounded-lg pl-10 pr-3 py-2 text-sm outline-none font-medium"
                                                        value={searchTarget}
                                                        onChange={e => setSearchTarget(e.target.value)}
                                                    />
                                                </div>
                                            </div>

                                            {/* Options */}
                                            <div className="overflow-y-auto max-h-60">
                                                {/* Clear Selection */}
                                                <button
                                                    type="button"
                                                    onClick={() => { setFormData({ ...formData, targetPath: '' }); setShowTargetPicker(false); }}
                                                    className="w-full px-4 py-2 text-left text-sm font-medium text-gray-400 hover:bg-gray-50"
                                                >
                                                    ❌ Bỏ chọn (Áp dụng toàn bộ)
                                                </button>

                                                {Object.entries(filteredGroups).map(([group, items]) => (
                                                    <div key={group}>
                                                        <div className="px-4 py-2 bg-gray-50 text-[10px] font-black text-gray-400 uppercase tracking-widest sticky top-0">
                                                            {group}
                                                        </div>
                                                        {items.map(item => (
                                                            <button
                                                                key={item.key}
                                                                type="button"
                                                                onClick={() => {
                                                                    setFormData({ ...formData, targetPath: item.key });
                                                                    setShowTargetPicker(false);
                                                                    setSearchTarget('');
                                                                }}
                                                                className={`w-full px-4 py-3 text-left text-sm font-bold hover:bg-blue-50 flex items-center gap-2 transition-colors ${formData.targetPath === item.key ? 'bg-blue-100 text-blue-700' : 'text-gray-700'
                                                                    }`}
                                                            >
                                                                {item.label}
                                                            </button>
                                                        ))}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                                <p className="text-[10px] text-gray-400 mt-1 font-medium">
                                    Để trống = Áp dụng cho toàn bộ hệ thống. Chọn cụ thể = Chỉ áp dụng cho trang/tính năng đó.
                                </p>
                            </div>

                            {/* Content */}
                            <div>
                                <label className="block text-xs font-black text-gray-400 uppercase mb-2 tracking-widest">Nội dung chi tiết</label>
                                <textarea
                                    className="w-full bg-gray-50 border border-gray-200 rounded-xl p-4 font-medium text-sm outline-none h-24 resize-none"
                                    placeholder="Mô tả chi tiết cho người dùng..."
                                    value={formData.content}
                                    onChange={e => setFormData({ ...formData, content: e.target.value })}
                                    required
                                />
                            </div>

                            {/* Image & CTA */}
                            <div className="grid grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-xs font-black text-gray-400 uppercase mb-2 tracking-widest">Hình ảnh (URL)</label>
                                    <input
                                        className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-medium outline-none"
                                        placeholder="https://..."
                                        value={formData.imageUrl}
                                        onChange={e => setFormData({ ...formData, imageUrl: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-black text-gray-400 uppercase mb-2 tracking-widest">Nút hành động</label>
                                    <div className="flex gap-2">
                                        <input
                                            className="flex-1 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm font-bold outline-none"
                                            placeholder="Nhãn nút"
                                            value={formData.actionLabel}
                                            onChange={e => setFormData({ ...formData, actionLabel: e.target.value })}
                                        />
                                        <input
                                            className="flex-1 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm font-medium outline-none"
                                            placeholder="Link"
                                            value={formData.actionUrl}
                                            onChange={e => setFormData({ ...formData, actionUrl: e.target.value })}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Time */}
                            <div className="grid grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-xs font-black text-gray-400 uppercase mb-2 tracking-widest">Bắt đầu</label>
                                    <input
                                        type="datetime-local"
                                        className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-sm font-bold outline-none"
                                        value={formData.startTime}
                                        onChange={e => setFormData({ ...formData, startTime: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-black text-gray-400 uppercase mb-2 tracking-widest">Kết thúc</label>
                                    <input
                                        type="datetime-local"
                                        className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-sm font-bold outline-none"
                                        value={formData.endTime}
                                        onChange={e => setFormData({ ...formData, endTime: e.target.value })}
                                    />
                                </div>
                            </div>

                            {/* Active Toggle */}
                            <label className="flex items-center gap-3 cursor-pointer">
                                <div className={`w-12 h-6 rounded-full transition-colors relative ${formData.isActive ? 'bg-green-500' : 'bg-gray-200'}`}>
                                    <input
                                        type="checkbox"
                                        className="sr-only"
                                        checked={formData.isActive}
                                        onChange={e => setFormData({ ...formData, isActive: e.target.checked })}
                                    />
                                    <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${formData.isActive ? 'left-7' : 'left-1'}`}></div>
                                </div>
                                <span className="font-bold text-sm text-gray-700">Kích hoạt ngay</span>
                            </label>

                            <button type="submit" className="w-full bg-blue-600 text-white font-black py-4 rounded-2xl hover:bg-blue-700 shadow-xl shadow-blue-200 transition-all">
                                ĐĂNG THÔNG BÁO
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* LIST */}
            <div className="grid gap-6">
                {announcements.map((ann: any) => (
                    <div key={ann.id} className={`bg-white p-6 rounded-3xl shadow-sm border transition-all hover:shadow-xl ${ann.isActive ? 'border-gray-100' : 'opacity-60 bg-gray-50'}`}>
                        <div className="flex justify-between items-start">
                            <div className="flex gap-6 w-full">
                                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center shrink-0 ${ann.type === 'MAINTENANCE' ? 'bg-yellow-100 text-yellow-600' :
                                        ann.type === 'FEATURE' ? 'bg-purple-100 text-purple-600' :
                                            ann.type === 'POLICY' ? 'bg-blue-100 text-blue-600' :
                                                'bg-gray-100 text-gray-500'
                                    }`}>
                                    <Megaphone className="w-7 h-7" />
                                </div>
                                <div className="flex-grow">
                                    <div className="flex items-center gap-3 mb-2 flex-wrap">
                                        <span className={`text-[10px] font-black px-3 py-1 rounded-full uppercase ${ann.type === 'MAINTENANCE' ? 'bg-yellow-500 text-white' : 'bg-gray-800 text-white'
                                            }`}>
                                            {ann.type}
                                        </span>
                                        <span className="text-[10px] font-black px-3 py-1 rounded-full bg-blue-50 text-blue-600 border border-blue-100">
                                            {ann.displayMode}
                                        </span>
                                        {ann.targetPath && (
                                            <span className="text-[10px] font-black px-3 py-1 rounded-full bg-orange-50 text-orange-600 border border-orange-100 flex items-center gap-1">
                                                <MapPin className="w-3 h-3" /> {getTargetLabel(ann.targetPath)}
                                            </span>
                                        )}
                                        {ann.isActive && <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>}
                                    </div>
                                    <h3 className="font-black text-xl text-gray-900">{ann.title}</h3>
                                    <p className="text-gray-500 text-sm mt-2 line-clamp-2">{ann.content}</p>

                                    <div className="flex items-center gap-6 mt-4 text-xs font-bold text-gray-400">
                                        <span className="flex items-center gap-2">
                                            <Calendar className="w-4 h-4 text-blue-500" />
                                            {new Date(ann.startTime).toLocaleString('vi-VN')}
                                        </span>
                                        {ann.endTime && (
                                            <span>→ {new Date(ann.endTime).toLocaleString('vi-VN')}</span>
                                        )}
                                    </div>
                                </div>
                            </div>
                            <div className="flex flex-col gap-2 ml-4">
                                <button
                                    onClick={() => toggleStatus(ann.id, ann.isActive)}
                                    className={`p-3 rounded-2xl transition-all ${ann.isActive ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-500'}`}
                                >
                                    <Power className="w-5 h-5" />
                                </button>
                                <button
                                    onClick={() => handleDelete(ann.id)}
                                    className="p-3 bg-red-50 text-red-500 rounded-2xl hover:bg-red-500 hover:text-white transition-all"
                                >
                                    <Trash2 className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                    </div>
                ))}

                {!loading && announcements.length === 0 && (
                    <div className="text-center py-20 bg-gray-50 rounded-3xl border border-dashed border-gray-200">
                        <Megaphone className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                        <p className="text-gray-400 font-bold">Chưa có thông báo nào</p>
                    </div>
                )}
            </div>
        </div>
    )
}
