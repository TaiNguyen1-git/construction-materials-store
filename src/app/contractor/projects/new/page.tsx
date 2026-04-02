'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Building2, MapPin, Save, Loader2 } from 'lucide-react'
import toast, { Toaster } from 'react-hot-toast'
import { VIETNAM_LOCATIONS } from '@/lib/vn-data'
import { fetchWithAuth } from '@/lib/api-client'
import { useAuth } from '@/contexts/auth-context'

export default function NewProjectPage() {
    const { user } = useAuth()
    const router = useRouter()
    const [loading, setLoading] = useState(false)

    const [formData, setFormData] = useState({
        title: '',
        description: '',
        projectType: 'NEW_BUILD',
        location: '',
        city: 'Hồ Chí Minh',
        district: '',
        estimatedBudget: '',
        startDate: '',
        contactName: '',
        contactPhone: ''
    })

    const projectTypes = [
        { value: 'NEW_BUILD', label: 'Xây mới hoàn toàn' },
        { value: 'RENOVATION', label: 'Cải tạo & Sửa chữa' },
        { value: 'INTERIOR', label: 'Thi công nội thất' },
        { value: 'OTHER', label: 'Dự án đặc thù khác' }
    ]

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        const toastId = toast.loading('Đang khởi tạo dự án trên hệ thống...')

        try {
            const res = await fetchWithAuth('/api/contractors/projects', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...formData,
                    estimatedBudget: parseFloat(formData.estimatedBudget.replace(/\./g, '')) || 0
                })
            })

            if (res.ok) {
                toast.success('Dự án đã được tạo thành công!', { id: toastId })
                router.push('/contractor/projects')
            } else {
                const error = await res.json()
                toast.error(error.message || 'Lỗi: Không thể khởi tạo dự án.', { id: toastId })
            }
        } catch (err) {
            toast.error('Lỗi kết nối: Vui lòng kiểm tra lại đường truyền.', { id: toastId })
        } finally {
            setLoading(false)
        }
    }

    const selectedCityData = VIETNAM_LOCATIONS.find(l => l.city === formData.city)
    const districts = selectedCityData ? selectedCityData.districts : []

    return (
        <div className="animate-in fade-in slide-in-from-bottom-6 duration-1000 max-w-4xl mx-auto space-y-12 pb-24">
            <Toaster position="top-right" />
            
            {/* Header / Navigation Navigation */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-10">
                <div className="space-y-4">
                    <div className="flex items-center gap-6">
                        <Link
                            href="/contractor/projects"
                            className="w-14 h-14 flex items-center justify-center bg-white border border-slate-100 text-slate-400 hover:text-blue-600 rounded-[1.5rem] transition-all shadow-sm active:scale-90"
                        >
                            <ArrowLeft className="w-6 h-6" />
                        </Link>
                        <h1 className="text-5xl font-black text-slate-900 tracking-tighter uppercase italic flex items-center gap-5">
                            <Building2 className="w-12 h-12 text-blue-600" />
                            Tạo Dự Án Mới
                        </h1>
                    </div>
                    <p className="text-slate-500 font-bold uppercase text-[10px] tracking-[0.3em] italic ml-20">Khởi tạo hồ sơ công trình & Quản lý tiến độ tập trung</p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-10">
                <div className="bg-white rounded-[3.5rem] p-10 lg:p-14 shadow-2xl shadow-slate-200/40 border border-slate-50 space-y-12 relative overflow-hidden group">
                    {/* Decorative Background */}
                    <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/5 rounded-full blur-[100px] -mr-48 -mt-48"></div>

                    <div className="relative z-10 space-y-12">
                        {/* Core Info Section */}
                        <div className="space-y-8">
                            <div className="flex items-center gap-5">
                                <div className="w-2 h-10 bg-blue-600 rounded-full"></div>
                                <h2 className="text-2xl font-black text-slate-900 uppercase italic tracking-tighter">Thông tin cơ bản</h2>
                            </div>

                            <div className="space-y-6">
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4 italic">Tên dự án thi công</label>
                                    <input
                                        required
                                        type="text"
                                        value={formData.title}
                                        onChange={e => setFormData({ ...formData, title: e.target.value })}
                                        placeholder="Vd: Xây biệt thự phố Nguyễn Xiển"
                                        className="w-full px-10 py-6 bg-slate-50 border-none rounded-[2rem] text-sm focus:ring-4 focus:ring-blue-500/10 focus:bg-white transition-all font-black uppercase italic outline-none placeholder:text-slate-200"
                                    />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4 italic">Loại công trình</label>
                                        <select
                                            value={formData.projectType}
                                            onChange={e => setFormData({ ...formData, projectType: e.target.value })}
                                            className="w-full px-8 py-5 bg-slate-50 border-none rounded-[1.8rem] text-sm font-black uppercase italic outline-none focus:ring-4 focus:ring-blue-500/10 focus:bg-white transition-all text-slate-700"
                                        >
                                            {projectTypes.map(t => (
                                                <option key={t.value} value={t.value}>{t.label}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4 italic">Ngân sách dự kiến (đ)</label>
                                        <div className="relative group/input">
                                            <div className="absolute left-6 top-1/2 -translate-y-1/2 font-black text-slate-300 transition-colors group-focus-within/input:text-blue-600 italic">đ</div>
                                            <input
                                                type="text"
                                                value={formData.estimatedBudget}
                                                onChange={e => {
                                                    const value = e.target.value.replace(/\D/g, '')
                                                    const formatted = value.replace(/\B(?=(\d{3})+(?!\d))/g, '.')
                                                    setFormData({ ...formData, estimatedBudget: formatted })
                                                }}
                                                placeholder="0"
                                                className="w-full pl-14 pr-8 py-5 bg-slate-50 border-none rounded-[1.8rem] text-sm font-black tabular-nums outline-none focus:ring-4 focus:ring-blue-500/10 focus:bg-white transition-all"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Location Section */}
                        <div className="space-y-8">
                            <div className="flex items-center gap-5">
                                <div className="w-2 h-10 bg-indigo-600 rounded-full"></div>
                                <h2 className="text-2xl font-black text-slate-900 uppercase italic tracking-tighter">Địa điểm thi công</h2>
                            </div>

                            <div className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4 italic">Tỉnh / Thành phố</label>
                                        <select
                                            value={formData.city}
                                            onChange={e => setFormData({ ...formData, city: e.target.value, district: '' })}
                                            className="w-full px-8 py-5 bg-slate-50 border-none rounded-[1.8rem] text-sm font-black italic outline-none focus:ring-4 focus:ring-blue-500/10 focus:bg-white transition-all text-slate-700"
                                        >
                                            {VIETNAM_LOCATIONS.map(l => (
                                                <option key={l.city} value={l.city}>{l.city}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4 italic">Quận / Huyện</label>
                                        <select
                                            required
                                            value={formData.district}
                                            onChange={e => setFormData({ ...formData, district: e.target.value })}
                                            className="w-full px-8 py-5 bg-slate-50 border-none rounded-[1.8rem] text-sm font-black italic outline-none focus:ring-4 focus:ring-blue-500/10 focus:bg-white transition-all text-slate-700"
                                        >
                                            <option value="">Chọn quận/huyện</option>
                                            {districts.map(d => (
                                                <option key={d} value={d}>{d}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4 italic">Địa chỉ chi tiết</label>
                                    <div className="relative group/loc">
                                        <MapPin className="absolute left-8 top-1/2 -translate-y-1/2 w-6 h-6 text-slate-300 transition-colors group-focus-within/loc:text-indigo-600" />
                                        <input
                                            required
                                            type="text"
                                            value={formData.location}
                                            onChange={e => setFormData({ ...formData, location: e.target.value })}
                                            placeholder="Số nhà, tên đường, phường..."
                                            className="w-full pl-20 pr-8 py-6 bg-slate-50 border-none rounded-[2rem] text-sm font-black italic outline-none focus:ring-4 focus:ring-indigo-500/10 focus:bg-white transition-all"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Customer Info Section */}
                        <div className="pt-10 border-t border-slate-50 space-y-8">
                            <div className="flex items-center gap-5">
                                <div className="w-2 h-10 bg-emerald-600 rounded-full"></div>
                                <h2 className="text-2xl font-black text-slate-900 uppercase italic tracking-tighter">Liên hệ khách hàng</h2>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4 italic">Họ và tên khách hàng</label>
                                    <input
                                        required
                                        type="text"
                                        value={formData.contactName}
                                        onChange={e => setFormData({ ...formData, contactName: e.target.value })}
                                        className="w-full px-8 py-5 bg-slate-50 border-none rounded-[1.8rem] text-sm font-black uppercase italic outline-none focus:ring-4 focus:ring-emerald-500/10 focus:bg-white transition-all"
                                    />
                                </div>
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4 italic">Số điện thoại liên lạc</label>
                                    <input
                                        required
                                        type="tel"
                                        value={formData.contactPhone}
                                        onChange={e => setFormData({ ...formData, contactPhone: e.target.value })}
                                        className="w-full px-8 py-5 bg-slate-50 border-none rounded-[1.8rem] text-sm font-black tabular-nums outline-none focus:ring-4 focus:ring-emerald-500/10 focus:bg-white transition-all"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex flex-col md:flex-row gap-6 pt-4">
                    <Link
                        href="/contractor/projects"
                        className="flex-1 py-10 bg-white text-slate-400 rounded-[2.5rem] font-black text-[11px] uppercase tracking-[0.3em] hover:bg-slate-50 transition-all text-center italic border border-slate-100 shadow-sm"
                    >
                        Hủy bỏ hồ sơ
                    </Link>
                    <button
                        type="submit"
                        disabled={loading}
                        className="flex-[2] py-10 bg-blue-600 text-white rounded-[2.5rem] font-black text-[11px] uppercase tracking-[0.3em] hover:bg-blue-700 transition-all shadow-2xl shadow-blue-500/40 flex items-center justify-center gap-6 active:scale-95 italic group"
                    >
                        {loading ? <Loader2 className="w-8 h-8 animate-spin" /> : <Save className="w-8 h-8 group-hover:scale-125 transition-transform" />}
                        Phê duyệt & Khởi tạo dự án
                    </button>
                </div>
            </form>
        </div>
    )
}
