'use client'

import { useState, useEffect } from 'react'
import { LifeBuoy, Send, MessageCircle, Clock, AlertCircle, CheckCircle2 } from 'lucide-react'
import toast from 'react-hot-toast'

export default function SupplierSupport() {
    const [tickets, setTickets] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [showNewModal, setShowNewModal] = useState(false)
    const [formData, setFormData] = useState({ reason: '', description: '', orderId: '' })

    useEffect(() => {
        fetchTickets()
    }, [])

    const fetchTickets = async () => {
        try {
            const supplierId = localStorage.getItem('supplier_id')
            const res = await fetch(`/api/supplier/support?supplierId=${supplierId}`)
            const data = await res.json()
            if (data.success) setTickets(data.data)
        } catch (error) {
            console.error('Fetch tickets failed')
        } finally {
            setLoading(false)
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        try {
            const supplierId = localStorage.getItem('supplier_id')
            const res = await fetch('/api/supplier/support', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...formData, supplierId })
            })
            const data = await res.json()
            if (data.success) {
                toast.success('Đã gửi yêu cầu hỗ trợ')
                setShowNewModal(false)
                fetchTickets()
            }
        } catch (error) {
            toast.error('Lỗi khi gửi yêu cầu')
        }
    }

    if (loading) return <div className="p-8 text-center">Đang tải...</div>

    return (
        <div className="space-y-10 pb-20">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight">Trung tâm hỗ trợ</h1>
                    <p className="text-slate-500 font-medium mt-1">Gửi yêu cầu hoặc khiếu nại trực tiếp tới đội ngũ quản trị SmartBuild.</p>
                </div>
                <button
                    onClick={() => setShowNewModal(true)}
                    className="group bg-blue-600 text-white px-6 py-3 rounded-2xl hover:bg-blue-700 flex items-center gap-3 transition-all shadow-xl shadow-blue-200 active:scale-95"
                >
                    <Send className="w-5 h-5 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                    <span className="font-bold uppercase tracking-widest text-xs">Mở yêu cầu mới</span>
                </button>
            </div>

            {/* Support Tickets Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {tickets.length > 0 ? (
                    tickets.map((t) => (
                        <div key={t.id} className="group relative bg-white p-8 rounded-[2.5rem] border border-slate-200/60 shadow-sm hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-slate-50 rounded-full -mr-12 -mt-12 blur-3xl opacity-60 group-hover:scale-150 transition-transform duration-700" />

                            <div className="relative">
                                <div className="flex justify-between items-start mb-6">
                                    <div className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest ${t.status === 'OPEN' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' :
                                            t.status === 'CLOSED' ? 'bg-slate-100 text-slate-500' :
                                                'bg-blue-50 text-blue-600 border border-blue-100'
                                        }`}>
                                        {t.status}
                                    </div>
                                    <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
                                        <Clock className="w-3.5 h-3.5" />
                                        {new Date(t.createdAt).toLocaleDateString('vi-VN')}
                                    </div>
                                </div>

                                <div className="space-y-3 mb-8">
                                    <h3 className="text-lg font-black text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-1">
                                        {t.reason}
                                    </h3>
                                    <p className="text-sm text-slate-500 line-clamp-2 leading-relaxed font-medium">
                                        {t.description}
                                    </p>
                                </div>

                                <div className="pt-6 border-t border-slate-50 flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400 font-black text-[10px]">
                                            ID
                                        </div>
                                        <span className="text-[10px] font-bold text-slate-400 uppercase">PO: {t.orderId || 'KHO'}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-blue-600">
                                        <MessageCircle className="w-5 h-5" />
                                        <span className="text-xs font-black">{t.comments?.length || 0}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="col-span-full py-32 flex flex-col items-center justify-center bg-slate-50/50 rounded-[3rem] border-4 border-dashed border-slate-100">
                        <div className="w-20 h-20 bg-white rounded-3xl shadow-xl flex items-center justify-center text-slate-200 mb-6 group hover:scale-110 transition-transform cursor-pointer">
                            <LifeBuoy className="w-10 h-10" />
                        </div>
                        <p className="text-xl font-black text-slate-300 uppercase tracking-[0.3em]">Không có yêu cầu</p>
                    </div>
                )}
            </div>

            {/* Premium Glassmorphism Modal */}
            {showNewModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 lg:p-10">
                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-fade-in" onClick={() => setShowNewModal(false)} />
                    <div className="relative bg-white/95 backdrop-blur-xl rounded-[2.5rem] w-full max-w-lg overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300">
                        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-600 via-indigo-600 to-emerald-600" />

                        <div className="p-10 lg:p-12">
                            <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 mb-8">
                                <MessageCircle className="w-9 h-9" />
                            </div>

                            <h2 className="text-3xl font-black text-slate-900 tracking-tight mb-2">Tạo yêu cầu mới</h2>
                            <p className="text-slate-500 font-medium mb-10">Vui lòng mô tả chi tiết vấn đề để chúng tôi hỗ trợ tốt nhất.</p>

                            <form onSubmit={handleSubmit} className="space-y-8">
                                <div className="space-y-6">
                                    <div>
                                        <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-3">Lý do / Chủ đề</label>
                                        <input
                                            required
                                            type="text"
                                            className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:bg-white focus:ring-4 focus:ring-blue-500/10 focus:border-blue-600 outline-none transition-all font-bold text-slate-900 placeholder:text-slate-300"
                                            placeholder="Ví dụ: Sai lệch thanh toán đơn PO-123"
                                            onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-3">Mã đơn hàng liên quan (nếu có)</label>
                                        <input
                                            type="text"
                                            className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:bg-white focus:ring-4 focus:ring-blue-500/10 focus:border-blue-600 outline-none transition-all font-black text-slate-900 placeholder:text-slate-300"
                                            placeholder="PO-XXXXXX"
                                            onChange={(e) => setFormData({ ...formData, orderId: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-3">Nội dung chi tiết</label>
                                        <textarea
                                            required
                                            rows={4}
                                            className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:bg-white focus:ring-4 focus:ring-blue-500/10 focus:border-blue-600 outline-none transition-all font-medium text-slate-700 placeholder:text-slate-300"
                                            placeholder="Mô tả cụ thể vấn đề hoặc thắc mắc của bạn..."
                                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        />
                                    </div>
                                </div>
                                <div className="flex gap-6 pt-6">
                                    <button
                                        type="button"
                                        onClick={() => setShowNewModal(false)}
                                        className="flex-1 px-8 py-4 border-2 border-slate-100 rounded-2xl font-black text-slate-400 uppercase tracking-widest text-xs hover:bg-slate-50 transition-all"
                                    >
                                        Hủy bỏ
                                    </button>
                                    <button
                                        type="submit"
                                        className="flex-1 px-8 py-4 bg-blue-600 text-white rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-blue-700 transition-all shadow-xl shadow-blue-200"
                                    >
                                        Gửi yêu cầu ngay
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
