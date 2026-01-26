'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import Header from '@/components/Header'
import {
    Send, Sparkles, MapPin, Calendar,
    DollarSign, User, Phone, Mail,
    CheckCircle, Loader2, Info, ArrowRight,
    Hammer, Paintbrush, Grid3X3, Briefcase, Wrench
} from 'lucide-react'
import toast, { Toaster } from 'react-hot-toast'
import { useAuth } from '@/contexts/auth-context'

const PROJECT_CATEGORIES = [
    { id: 'flooring', name: 'Lát nền', icon: Grid3X3, color: 'bg-blue-500' },
    { id: 'painting', name: 'Sơn tường', icon: Paintbrush, color: 'bg-green-500' },
    { id: 'tiling', name: 'Ốp tường', icon: Grid3X3, color: 'bg-purple-500' },
    { id: 'general', name: 'Tổng quát', icon: Hammer, color: 'bg-orange-500' },
    { id: 'repair', name: 'Sửa chữa', icon: Wrench, color: 'bg-red-500' },
]

export default function PostProjectPage() {
    const router = useRouter()
    const { isAuthenticated, user } = useAuth()
    const [loading, setLoading] = useState(false)
    const [success, setSuccess] = useState(false)

    const [formData, setFormData] = useState({
        name: '',
        description: '',
        category: 'general',
        budget: '',
        location: '',
        startDate: new Date().toISOString().split('T')[0],
        guestName: '',
        guestPhone: '',
        guestEmail: '',
        isPublic: true
    })

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target
        setFormData(prev => ({ ...prev, [name]: value }))
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!formData.name || !formData.budget || !formData.startDate) {
            toast.error('Vui lòng điền đầy đủ thông tin bắt buộc')
            return
        }

        if (!isAuthenticated && (!formData.guestName || !formData.guestPhone)) {
            toast.error('Quý khách vui lòng để lại tên và số điện thoại liên hệ')
            return
        }

        setLoading(true)
        try {
            const res = await fetch('/api/projects', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...formData,
                    budget: parseFloat(formData.budget),
                    isPublic: true
                })
            })

            if (res.ok) {
                setSuccess(true)
                toast.success('Đăng tin thành công! Tin của bạn đang chờ duyệt.')
                setTimeout(() => {
                    router.push('/market')
                }, 3000)
            } else {
                const err = await res.json()
                toast.error(err.error || 'Có lỗi xảy ra')
            }
        } catch (error) {
            toast.error('Lỗi kết nối server')
        } finally {
            setLoading(false)
        }
    }

    if (success) {
        return (
            <div className="min-h-screen bg-slate-50 flex flex-col">
                <Header />
                <div className="flex-1 flex items-center justify-center p-4">
                    <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl p-8 text-center border border-emerald-100 animate-in zoom-in-95 duration-500">
                        <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-6">
                            <CheckCircle className="w-10 h-10 text-emerald-500" />
                        </div>
                        <h2 className="text-2xl font-black text-gray-900 mb-2">ĐĂNG TIN THÀNH CÔNG!</h2>
                        <p className="text-gray-500 text-sm mb-8">
                            Cảm ơn bạn đã tin tưởng SmartBuild. Đội ngũ quản trị sẽ duyệt tin của bạn trong vòng 24h tới.
                        </p>
                        <button
                            onClick={() => router.push('/market')}
                            className="w-full py-4 bg-emerald-600 text-white rounded-2xl font-black text-sm hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-100"
                        >
                            VỀ TRANG THỊ TRƯỜNG
                        </button>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-slate-50">
            <Toaster position="top-right" />
            <Header />

            <main className="max-w-4xl mx-auto px-4 py-12">
                <div className="mb-10 text-center">
                    <h1 className="text-3xl font-black text-gray-900 mb-2 uppercase tracking-tight">Đăng Tin Tìm Nhà Thầu</h1>
                    <p className="text-gray-500 font-medium italic">Kết nối với mạng lưới nhà thầu chuyên nghiệp chỉ trong vài phút.</p>
                </div>

                <div className="grid lg:grid-cols-3 gap-8">
                    {/* Left: Tips & AI Prompt */}
                    <div className="lg:col-span-1 space-y-6">
                        <div className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-3xl p-6 text-white shadow-xl">
                            <Sparkles className="w-8 h-8 mb-4 text-indigo-200" />
                            <h3 className="text-lg font-black mb-3">Chưa có bản dự toán?</h3>
                            <p className="text-indigo-100 text-xs leading-relaxed mb-6 font-medium">
                                Sử dụng AI Estimator để tự động tính toán khối lượng vật liệu từ ảnh mặt bằng hoặc mô tả.
                            </p>
                            <button
                                onClick={() => router.push('/estimator')}
                                className="w-full py-3 bg-white text-indigo-700 rounded-xl font-black text-[11px] uppercase tracking-wider hover:bg-indigo-50 transition-all flex items-center justify-center gap-2"
                            >
                                Thử AI Estimator <ArrowRight className="w-3.5 h-3.5" />
                            </button>
                        </div>

                        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                            <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Mẹo đăng tin hiệu quả</h4>
                            <ul className="space-y-4">
                                {[
                                    'Mô tả chi tiết hạng mục cần làm.',
                                    'Nêu rõ địa điểm thi công.',
                                    'Dự chi ngân sách thực tế.',
                                    'Để lại thông tin liên lạc chính xác.'
                                ].map((tip, i) => (
                                    <li key={i} className="flex gap-3 items-start text-xs font-semibold text-gray-600 leading-snug">
                                        <div className="w-5 h-5 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center text-[10px] shrink-0 font-black">
                                            {i + 1}
                                        </div>
                                        {tip}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>

                    {/* Right: The Form */}
                    <div className="lg:col-span-2">
                        <form onSubmit={handleSubmit} className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
                            <div className="bg-slate-900 p-6 text-white flex items-center justify-between">
                                <span className="text-[11px] font-black uppercase tracking-[0.2em]">Thông tin dự án</span>
                                <div className="flex items-center gap-1.5 px-2 py-1 bg-white/10 rounded text-[9px] font-bold text-white/60">
                                    <Info className="w-3 h-3" /> TRÊN MARKETPLACE
                                </div>
                            </div>

                            <div className="p-8 space-y-6">
                                {/* Basic Info */}
                                <div className="space-y-4">
                                    <div>
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 block">Tên dự án *</label>
                                        <input
                                            name="name"
                                            value={formData.name}
                                            onChange={handleInputChange}
                                            placeholder="VD: Cải tạo phòng khách chung cư"
                                            className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:ring-2 focus:ring-primary-500 font-bold text-gray-700 transition-all"
                                            required
                                        />
                                    </div>

                                    <div>
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 block">Loại công việc</label>
                                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                            {PROJECT_CATEGORIES.map(cat => (
                                                <button
                                                    key={cat.id}
                                                    type="button"
                                                    onClick={() => setFormData(prev => ({ ...prev, category: cat.id }))}
                                                    className={`p-2 rounded-xl border flex items-center gap-2 transition-all ${formData.category === cat.id
                                                        ? 'bg-primary-50 border-primary-500 text-primary-700'
                                                        : 'bg-white border-gray-100 text-gray-500 hover:border-gray-200'}`}
                                                >
                                                    <cat.icon className={`w-4 h-4 ${formData.category === cat.id ? 'text-primary-600' : 'text-gray-400'}`} />
                                                    <span className="text-xs font-bold">{cat.name}</span>
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 block flex items-center gap-1.5">
                                                <DollarSign className="w-3 h-3" /> Ngân sách dự kiến (VNĐ)
                                            </label>
                                            <input
                                                name="budget"
                                                type="number"
                                                value={formData.budget}
                                                onChange={handleInputChange}
                                                placeholder="VD: 50000000"
                                                className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:ring-2 focus:ring-primary-500 font-bold text-gray-700 transition-all"
                                                required
                                            />
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 block flex items-center gap-1.5">
                                                <Calendar className="w-3 h-3" /> Ngày thi công
                                            </label>
                                            <input
                                                name="startDate"
                                                type="date"
                                                value={formData.startDate}
                                                onChange={handleInputChange}
                                                className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:ring-2 focus:ring-primary-500 font-bold text-gray-700 transition-all"
                                                required
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 block flex items-center gap-1.5">
                                            <MapPin className="w-3 h-3" /> Khu vực thi công
                                        </label>
                                        <input
                                            name="location"
                                            value={formData.location}
                                            onChange={handleInputChange}
                                            placeholder="Quận/Huyện, Tỉnh/Thành phố"
                                            className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:ring-2 focus:ring-primary-500 font-bold text-gray-700 transition-all"
                                        />
                                    </div>

                                    <div>
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 block">Mô tả chi tiết</label>
                                        <textarea
                                            name="description"
                                            value={formData.description}
                                            onChange={handleInputChange}
                                            rows={4}
                                            placeholder="Mô tả cụ thể khối lượng công việc, vật liệu yêu cầu (nếu có)..."
                                            className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:ring-2 focus:ring-primary-500 font-bold text-gray-700 transition-all resize-none leading-relaxed"
                                        />
                                    </div>
                                </div>

                                {/* Contact Info (For Guests) */}
                                {!isAuthenticated && (
                                    <div className="bg-amber-50 rounded-2xl p-6 border border-amber-100 space-y-4">
                                        <div className="flex items-center gap-2 mb-2">
                                            <User className="w-4 h-4 text-amber-600" />
                                            <span className="text-xs font-black text-amber-900 uppercase">Thông tin liên hệ (Dành cho Guest)</span>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <label className="text-[9px] font-black text-amber-700/60 uppercase tracking-widest mb-1 block">Họ và tên *</label>
                                                <input
                                                    name="guestName"
                                                    value={formData.guestName}
                                                    onChange={handleInputChange}
                                                    className="w-full px-4 py-2 bg-white border border-amber-200 rounded-lg outline-none focus:ring-2 focus:ring-amber-500 font-bold text-gray-700 text-sm"
                                                    required
                                                />
                                            </div>
                                            <div>
                                                <label className="text-[9px] font-black text-amber-700/60 uppercase tracking-widest mb-1 block">Số điện thoại *</label>
                                                <input
                                                    name="guestPhone"
                                                    value={formData.guestPhone}
                                                    onChange={handleInputChange}
                                                    className="w-full px-4 py-2 bg-white border border-amber-200 rounded-lg outline-none focus:ring-2 focus:ring-amber-500 font-bold text-gray-700 text-sm"
                                                    required
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="text-[9px] font-black text-amber-700/60 uppercase tracking-widest mb-1 block">Email (Không bắt buộc)</label>
                                            <input
                                                name="guestEmail"
                                                type="email"
                                                value={formData.guestEmail}
                                                onChange={handleInputChange}
                                                className="w-full px-4 py-2 bg-white border border-amber-200 rounded-lg outline-none focus:ring-2 focus:ring-amber-500 font-bold text-gray-700 text-sm"
                                            />
                                        </div>
                                    </div>
                                )}

                                <div className="pt-4">
                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="w-full py-5 bg-gradient-to-r from-primary-600 to-indigo-600 hover:from-primary-700 hover:to-indigo-700 disabled:from-gray-300 disabled:to-gray-300 text-white rounded-2xl font-black text-sm uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-3 shadow-xl shadow-primary-100"
                                    >
                                        {loading ? (
                                            <>
                                                <Loader2 className="w-5 h-5 animate-spin" />
                                                Đang xử lý...
                                            </>
                                        ) : (
                                            <>
                                                <Send className="w-5 h-5" />
                                                Đăng tin ngay
                                            </>
                                        )}
                                    </button>
                                    <p className="text-center text-[10px] text-gray-400 mt-4 font-bold italic">
                                        * Tin đăng sẽ được hiển thị công khai sau khi admin kiểm duyệt nội dung.
                                    </p>
                                </div>
                            </div>
                        </form>
                    </div>
                </div>
            </main>
        </div>
    )
}
