'use client'

import { useState, useEffect } from 'react'
import { Rocket, Plus, X, Save, Trash2, Play, Pause } from 'lucide-react'
import { toast } from 'react-hot-toast'

const TYPE_MAP: Record<string, string> = { MULTIPLIER: 'Nhân hệ số', BONUS: 'Thêm điểm', BIRTHDAY: 'Sinh nhật', BULK_GRANT: 'Cộng hàng loạt' }
const STATUS_MAP: Record<string, { label: string; style: string }> = {
    DRAFT: { label: 'Nháp', style: 'bg-slate-50 text-slate-600 border-slate-200' },
    ACTIVE: { label: 'Đang chạy', style: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
    PAUSED: { label: 'Tạm dừng', style: 'bg-amber-50 text-amber-700 border-amber-200' },
    ENDED: { label: 'Kết thúc', style: 'bg-red-50 text-red-700 border-red-200' },
}
const TIER_NAMES: Record<string, string> = { BRONZE: 'Đồng', SILVER: 'Bạc', GOLD: 'Vàng', PLATINUM: 'Bạch Kim', DIAMOND: 'Kim Cương' }

export default function CampaignList() {
    const [campaigns, setCampaigns] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [showCreate, setShowCreate] = useState(false)
    const [form, setForm] = useState({ name: '', description: '', type: 'MULTIPLIER', multiplier: 2, bonusPoints: 0, targetTier: '', minOrderAmount: 0, startDate: '', endDate: '' })

    useEffect(() => { fetchCampaigns() }, [])

    const fetchCampaigns = async () => {
        try {
            const res = await fetch('/api/admin/loyalty/campaigns')
            const data = await res.json()
            if (data.success) setCampaigns(data.data)
        } catch { toast.error('Lỗi tải chiến dịch') }
        finally { setLoading(false) }
    }

    const handleCreate = async () => {
        if (!form.name || !form.startDate || !form.endDate) { toast.error('Vui lòng điền đầy đủ thông tin'); return }
        try {
            const res = await fetch('/api/admin/loyalty/campaigns', {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...form, targetTier: form.targetTier || null, minOrderAmount: form.minOrderAmount || null })
            })
            const data = await res.json()
            if (data.success) { toast.success('Tạo chiến dịch thành công'); setShowCreate(false); fetchCampaigns() }
            else toast.error(data.error || 'Lỗi')
        } catch { toast.error('Lỗi kết nối') }
    }

    const updateStatus = async (id: string, status: string) => {
        try {
            const res = await fetch(`/api/admin/loyalty/campaigns/${id}`, {
                method: 'PUT', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status })
            })
            if ((await res.json()).success) { toast.success('Cập nhật thành công'); fetchCampaigns() }
        } catch { toast.error('Lỗi') }
    }

    const deleteCampaign = async (id: string) => {
        if (!confirm('Bạn có chắc muốn xóa chiến dịch này?')) return
        try {
            const res = await fetch(`/api/admin/loyalty/campaigns/${id}`, { method: 'DELETE' })
            if ((await res.json()).success) { toast.success('Đã xóa'); fetchCampaigns() }
        } catch { toast.error('Lỗi') }
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="bg-white rounded-[24px] border border-slate-200 p-4 flex justify-between items-center shadow-sm">
                <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-blue-50 rounded-2xl text-blue-600"><Rocket size={20} /></div>
                    <div>
                        <h3 className="text-sm font-black text-slate-900">Chiến Dịch Ưu Đãi</h3>
                        <p className="text-[10px] text-slate-400 font-bold">{campaigns.length} chiến dịch</p>
                    </div>
                </div>
                <button onClick={() => setShowCreate(true)} className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white font-bold rounded-2xl hover:bg-blue-700 transition-all text-sm shadow-lg shadow-blue-600/20">
                    <Plus size={16} /> Tạo mới
                </button>
            </div>

            {/* Campaign Cards */}
            {loading ? (
                <div className="flex justify-center py-16"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" /></div>
            ) : campaigns.length === 0 ? (
                <div className="bg-white rounded-[24px] border border-slate-100 p-12 text-center shadow-sm">
                    <Rocket className="w-12 h-12 mx-auto mb-3 text-slate-200" />
                    <p className="text-slate-400 font-bold">Chưa có chiến dịch nào. Hãy tạo chiến dịch đầu tiên!</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {campaigns.map(c => (
                        <div key={c.id} className="bg-white rounded-[24px] border border-slate-100 p-6 shadow-sm hover:shadow-lg transition-all group">
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <h4 className="text-lg font-black text-slate-900">{c.name}</h4>
                                    <p className="text-xs text-slate-400 mt-1">{c.description || 'Không có mô tả'}</p>
                                </div>
                                <span className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider border ${STATUS_MAP[c.status]?.style}`}>
                                    {STATUS_MAP[c.status]?.label}
                                </span>
                            </div>
                            <div className="grid grid-cols-2 gap-3 mb-4">
                                <div className="p-3 bg-slate-50 rounded-xl">
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Loại</p>
                                    <p className="text-sm font-bold text-slate-700">{TYPE_MAP[c.type]}</p>
                                </div>
                                <div className="p-3 bg-slate-50 rounded-xl">
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Hạng áp dụng</p>
                                    <p className="text-sm font-bold text-slate-700">{c.targetTier ? TIER_NAMES[c.targetTier] : 'Tất cả'}</p>
                                </div>
                                <div className="p-3 bg-slate-50 rounded-xl">
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Bắt đầu</p>
                                    <p className="text-sm font-bold text-slate-700">{new Date(c.startDate).toLocaleDateString('vi-VN')}</p>
                                </div>
                                <div className="p-3 bg-slate-50 rounded-xl">
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Kết thúc</p>
                                    <p className="text-sm font-bold text-slate-700">{new Date(c.endDate).toLocaleDateString('vi-VN')}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 pt-3 border-t border-slate-100">
                                {c.status === 'DRAFT' && <button onClick={() => updateStatus(c.id, 'ACTIVE')} className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-xl text-xs font-bold hover:bg-emerald-100"><Play size={12} /> Kích hoạt</button>}
                                {c.status === 'ACTIVE' && <button onClick={() => updateStatus(c.id, 'PAUSED')} className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 text-amber-700 rounded-xl text-xs font-bold hover:bg-amber-100"><Pause size={12} /> Tạm dừng</button>}
                                {c.status === 'PAUSED' && <button onClick={() => updateStatus(c.id, 'ACTIVE')} className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-xl text-xs font-bold hover:bg-emerald-100"><Play size={12} /> Tiếp tục</button>}
                                {(c.status === 'ACTIVE' || c.status === 'PAUSED') && <button onClick={() => updateStatus(c.id, 'ENDED')} className="px-3 py-1.5 text-slate-500 rounded-xl text-xs font-bold hover:bg-slate-50">Kết thúc</button>}
                                <button onClick={() => deleteCampaign(c.id)} className="ml-auto p-1.5 text-red-400 hover:bg-red-50 rounded-xl"><Trash2 size={14} /></button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Create Modal */}
            {showCreate && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-[24px] shadow-2xl w-full max-w-lg overflow-hidden">
                        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                            <h3 className="text-lg font-black text-slate-900">Tạo Chiến Dịch Mới</h3>
                            <button onClick={() => setShowCreate(false)} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
                        </div>
                        <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1">Tên chiến dịch *</label>
                                <input value={form.name} onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))} className="w-full px-4 py-2.5 border border-slate-200 rounded-2xl text-sm focus:ring-2 focus:ring-blue-500" placeholder="VD: Nhân đôi điểm dịp Tết" />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1">Mô tả</label>
                                <textarea value={form.description} onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))} className="w-full px-4 py-2.5 border border-slate-200 rounded-2xl text-sm focus:ring-2 focus:ring-blue-500" rows={2} />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-1">Loại *</label>
                                    <select value={form.type} onChange={(e) => setForm(f => ({ ...f, type: e.target.value }))} className="w-full px-4 py-2.5 border border-slate-200 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-blue-500">
                                        {Object.entries(TYPE_MAP).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-1">Hạng áp dụng</label>
                                    <select value={form.targetTier} onChange={(e) => setForm(f => ({ ...f, targetTier: e.target.value }))} className="w-full px-4 py-2.5 border border-slate-200 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-blue-500">
                                        <option value="">Tất cả</option>
                                        {Object.entries(TIER_NAMES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                                    </select>
                                </div>
                            </div>
                            {form.type === 'MULTIPLIER' && (
                                <div><label className="block text-sm font-bold text-slate-700 mb-1">Hệ số nhân</label>
                                    <input type="number" step="0.5" min="1" value={form.multiplier} onChange={(e) => setForm(f => ({ ...f, multiplier: parseFloat(e.target.value) }))} className="w-full px-4 py-2.5 border border-slate-200 rounded-2xl text-sm focus:ring-2 focus:ring-blue-500" /></div>
                            )}
                            {(form.type === 'BONUS' || form.type === 'BIRTHDAY' || form.type === 'BULK_GRANT') && (
                                <div><label className="block text-sm font-bold text-slate-700 mb-1">Số điểm thưởng</label>
                                    <input type="number" min="1" value={form.bonusPoints} onChange={(e) => setForm(f => ({ ...f, bonusPoints: parseInt(e.target.value) }))} className="w-full px-4 py-2.5 border border-slate-200 rounded-2xl text-sm focus:ring-2 focus:ring-blue-500" /></div>
                            )}
                            <div className="grid grid-cols-2 gap-4">
                                <div><label className="block text-sm font-bold text-slate-700 mb-1">Bắt đầu *</label>
                                    <input type="date" value={form.startDate} onChange={(e) => setForm(f => ({ ...f, startDate: e.target.value }))} className="w-full px-4 py-2.5 border border-slate-200 rounded-2xl text-sm focus:ring-2 focus:ring-blue-500" /></div>
                                <div><label className="block text-sm font-bold text-slate-700 mb-1">Kết thúc *</label>
                                    <input type="date" value={form.endDate} onChange={(e) => setForm(f => ({ ...f, endDate: e.target.value }))} className="w-full px-4 py-2.5 border border-slate-200 rounded-2xl text-sm focus:ring-2 focus:ring-blue-500" /></div>
                            </div>
                        </div>
                        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
                            <button onClick={() => setShowCreate(false)} className="px-5 py-2.5 text-slate-600 font-bold hover:bg-slate-200 rounded-2xl text-sm">Hủy</button>
                            <button onClick={handleCreate} className="px-5 py-2.5 bg-blue-600 text-white font-bold rounded-2xl hover:bg-blue-700 flex items-center gap-2 text-sm shadow-lg shadow-blue-600/20">
                                <Save size={16} /> Tạo chiến dịch
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
