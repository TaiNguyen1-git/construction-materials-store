'use client'

import { useState, useEffect } from 'react'
import { Plus, Tag, Calendar, Users, Percent, Gift, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'

export default function SupplierPromotions() {
    const [promotions, setPromotions] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [showModal, setShowModal] = useState(false)
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        discountPercent: 0,
        minOrderAmount: 0,
        startDate: '',
        endDate: ''
    })

    useEffect(() => {
        fetchPromos()
    }, [])

    const fetchPromos = async () => {
        try {
            const supplierId = localStorage.getItem('supplier_id')
            const res = await fetch(`/api/supplier/promotions?supplierId=${supplierId}`)
            const data = await res.json()
            if (data.success) setPromotions(data.data)
        } catch (error) {
            console.error('Fetch promos failed')
        } finally {
            setLoading(false)
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        try {
            const supplierId = localStorage.getItem('supplier_id')
            const res = await fetch('/api/supplier/promotions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...formData, supplierId })
            })
            if (res.ok) {
                toast.success('Đã gửi đề xuất chương trình')
                setShowModal(false)
                fetchPromos()
            }
        } catch (error) {
            toast.error('Lỗi khi lưu')
        }
    }

    if (loading) return <div className="p-8 text-center">Đang tải...</div>

    return (
        <div className="space-y-10 pb-20">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight">Chiến dịch ưu đãi</h1>
                    <p className="text-slate-500 font-medium mt-1">Đề xuất các chương trình khuyến mãi để thúc đẩy đơn hàng.</p>
                </div>
                <button
                    onClick={() => setShowModal(true)}
                    className="group bg-blue-600 text-white px-6 py-3 rounded-2xl hover:bg-blue-700 flex items-center gap-3 transition-all shadow-xl shadow-blue-200 active:scale-95"
                >
                    <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300" />
                    <span className="font-bold uppercase tracking-widest text-xs">Phát động KM mới</span>
                </button>
            </div>

            {/* Promotions Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {promotions.length > 0 ? (
                    promotions.map((p) => (
                        <div key={p.id} className="group relative bg-white rounded-[2.5rem] border border-slate-200/60 shadow-sm hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 overflow-hidden">
                            {/* Decorative Background */}
                            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-full -mr-12 -mt-12 blur-3xl opacity-60 group-hover:scale-150 transition-transform duration-700" />

                            <div className="relative">
                                {/* Banner Section */}
                                <div className="p-8 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                                    <div className="w-14 h-14 bg-white rounded-2xl shadow-lg border border-slate-100 flex items-center justify-center text-blue-600 group-hover:rotate-6 transition-transform">
                                        <Tag className="w-7 h-7" />
                                    </div>
                                    <div className="text-right">
                                        <div className="text-3xl font-black text-blue-600 leading-none">-{p.discountPercent}%</div>
                                        <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Giá trị ưu đãi</div>
                                    </div>
                                </div>

                                {/* Content Section */}
                                <div className="p-8 space-y-6">
                                    <div>
                                        <h3 className="text-lg font-black text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-1">{p.name}</h3>
                                        <p className="text-sm text-slate-500 mt-1 line-clamp-2 leading-relaxed">{p.description}</p>
                                    </div>

                                    <div className="space-y-3">
                                        <div className="flex items-center gap-3 text-xs font-bold text-slate-600">
                                            <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-500">
                                                <Calendar className="w-4 h-4" />
                                            </div>
                                            <span>{new Date(p.startDate).toLocaleDateString('vi-VN')} - {new Date(p.endDate).toLocaleDateString('vi-VN')}</span>
                                        </div>
                                        <div className="flex items-center gap-3 text-xs font-bold text-slate-600">
                                            <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-500">
                                                <Gift className="w-4 h-4" />
                                            </div>
                                            <span>Tối thiểu: {new Intl.NumberFormat('vi-VN').format(p.minOrderAmount)}đ</span>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                                        <span className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-[0.15em] ${p.status === 'APPROVED' ? 'bg-emerald-50 text-emerald-600' :
                                                p.status === 'REJECTED' ? 'bg-rose-50 text-rose-600' :
                                                    'bg-blue-50 text-blue-600'
                                            }`}>
                                            {p.status}
                                        </span>
                                        <button className="text-slate-300 hover:text-rose-500 transition-colors">
                                            <Trash2 className="w-5 h-5" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="col-span-full py-32 flex flex-col items-center justify-center bg-slate-50/50 rounded-[3rem] border-4 border-dashed border-slate-100">
                        <div className="w-20 h-20 bg-white rounded-3xl shadow-xl flex items-center justify-center text-slate-200 mb-6 group hover:scale-110 transition-transform cursor-pointer">
                            <Percent className="w-10 h-10" />
                        </div>
                        <p className="text-xl font-black text-slate-300 uppercase tracking-[0.3em]">Danh sách trống</p>
                    </div>
                )}
            </div>

            {/* Premium Glassmorphism Modal */}
            {showModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 lg:p-10">
                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-fade-in" onClick={() => setShowModal(false)} />
                    <div className="relative bg-white/95 backdrop-blur-xl rounded-[2.5rem] w-full max-w-2xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300">
                        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-600 via-indigo-600 to-emerald-600" />

                        <div className="p-10 lg:p-12">
                            <h2 className="text-3xl font-black text-slate-900 tracking-tight mb-2">Đề xuất khuyến mãi</h2>
                            <p className="text-slate-500 font-medium mb-10">Vui lòng điền chi tiết chương trình để quản trị viên phê duyệt.</p>

                            <form onSubmit={handleSubmit} className="space-y-8">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="md:col-span-2">
                                        <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-3">Tên chương trình</label>
                                        <input required type="text" className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:bg-white focus:ring-4 focus:ring-blue-500/10 focus:border-blue-600 outline-none transition-all font-bold text-slate-900 placeholder:text-slate-300"
                                            placeholder="Ví dụ: Siêu ưu đãi tháng 02" onChange={e => setFormData({ ...formData, name: e.target.value })} />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-3">% Giảm giá</label>
                                        <div className="relative">
                                            <input required type="number" className="w-full pl-6 pr-12 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:bg-white focus:ring-4 focus:ring-blue-500/10 focus:border-blue-600 outline-none transition-all font-black text-slate-900"
                                                onChange={e => setFormData({ ...formData, discountPercent: Number(e.target.value) })} />
                                            <span className="absolute right-6 top-1/2 -translate-y-1/2 font-black text-slate-400">%</span>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-3">Đơn hàng tối thiểu</label>
                                        <div className="relative">
                                            <input required type="number" className="w-full pl-6 pr-12 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:bg-white focus:ring-4 focus:ring-blue-500/10 focus:border-blue-600 outline-none transition-all font-black text-slate-900"
                                                onChange={e => setFormData({ ...formData, minOrderAmount: Number(e.target.value) })} />
                                            <span className="absolute right-6 top-1/2 -translate-y-1/2 font-black text-slate-400 text-xs">đ</span>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-3">Ngày bắt đầu</label>
                                        <input required type="date" className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:bg-white focus:ring-4 focus:ring-blue-500/10 focus:border-blue-600 outline-none transition-all font-bold text-slate-900"
                                            onChange={e => setFormData({ ...formData, startDate: e.target.value })} />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-3">Ngày kết thúc</label>
                                        <input required type="date" className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:bg-white focus:ring-4 focus:ring-blue-500/10 focus:border-blue-600 outline-none transition-all font-bold text-slate-900"
                                            onChange={e => setFormData({ ...formData, endDate: e.target.value })} />
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-3">Mô tả và điều kiện áp dụng</label>
                                        <textarea rows={3} className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:bg-white focus:ring-4 focus:ring-blue-500/10 focus:border-blue-600 outline-none transition-all font-medium text-slate-700 placeholder:text-slate-300"
                                            placeholder="Ghi chú thêm về chương trình (nếu có)..." onChange={e => setFormData({ ...formData, description: e.target.value })} />
                                    </div>
                                </div>
                                <div className="flex gap-6 pt-6">
                                    <button type="button" onClick={() => setShowModal(false)} className="flex-1 px-8 py-4 border-2 border-slate-100 rounded-2xl font-black text-slate-400 uppercase tracking-widest text-xs hover:bg-slate-50 transition-all">Hủy bỏ</button>
                                    <button type="submit" className="flex-1 px-8 py-4 bg-blue-600 text-white rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-blue-700 transition-all shadow-xl shadow-blue-200">Gửi đề xuất chiến dịch</button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
