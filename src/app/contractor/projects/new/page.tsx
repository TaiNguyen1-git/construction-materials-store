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
        const toastId = toast.loading('Đang khởi tạo dự án...')

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
            toast.error('Lỗi kết nối vệ tinh', { id: toastId })
        } finally {
            setLoading(false)
        }
    }

    const selectedCityData = VIETNAM_LOCATIONS.find(l => l.city === formData.city)
    const districts = selectedCityData ? selectedCityData.districts : []

    return (
        <div className="max-w-4xl mx-auto space-y-8 pb-24">
            <Toaster position="top-right" />
            
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 px-4 sm:px-0">
                <div className="flex items-center gap-4">
                    <Link
                        href="/contractor/projects"
                        className="w-10 h-10 flex items-center justify-center bg-white border border-slate-200 text-slate-400 hover:text-blue-600 rounded-xl transition-all shadow-sm active:scale-90"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </Link>
                    <div className="space-y-0.5">
                        <h1 className="text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-3">
                            <Building2 className="w-8 h-8 text-blue-600" />
                            Tạo Dự Án Mới
                        </h1>
                        <p className="text-slate-500 text-sm font-medium">Khởi tạo hồ sơ công trình & quản lý tiến độ</p>
                    </div>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="bg-white rounded-2xl p-6 lg:p-8 shadow-sm border border-slate-100 space-y-10">
                    {/* Basic Info */}
                    <div className="space-y-6">
                        <div className="flex items-center gap-3">
                            <div className="w-1.5 h-6 bg-blue-600 rounded-full"></div>
                            <h2 className="text-lg font-bold text-slate-900">Thông tin cơ bản</h2>
                        </div>

                        <div className="space-y-4">
                            <div className="space-y-1.5 px-1">
                                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Tên dự án</label>
                                <input
                                    required
                                    type="text"
                                    value={formData.title}
                                    onChange={e => setFormData({ ...formData, title: e.target.value })}
                                    placeholder="Vd: Xây biệt thự phố Nguyễn Xiển"
                                    className="w-full px-5 py-3.5 bg-slate-50 border-none rounded-xl text-sm font-semibold focus:ring-2 focus:ring-blue-600/10 focus:bg-white outline-none transition-all placeholder:text-slate-300"
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-1.5 px-1">
                                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Loại công trình</label>
                                    <select
                                        value={formData.projectType}
                                        onChange={e => setFormData({ ...formData, projectType: e.target.value })}
                                        className="w-full px-5 py-3.5 bg-slate-50 border-none rounded-xl text-sm font-semibold outline-none focus:ring-2 focus:ring-primary/10 focus:bg-white transition-all text-slate-700"
                                    >
                                        {projectTypes.map(t => (
                                            <option key={t.value} value={t.value}>{t.label}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="space-y-1.5 px-1">
                                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Ngân sách dự kiến</label>
                                    <div className="relative group/input">
                                        <div className="absolute right-5 top-1/2 -translate-y-1/2 font-bold text-slate-300 text-xs">VND</div>
                                        <input
                                            type="text"
                                            value={formData.estimatedBudget}
                                            onChange={e => {
                                                const value = e.target.value.replace(/\D/g, '')
                                                const formatted = value.replace(/\B(?=(\d{3})+(?!\d))/g, '.')
                                                setFormData({ ...formData, estimatedBudget: formatted })
                                            }}
                                            placeholder="0"
                                            className="w-full pl-5 pr-14 py-3.5 bg-slate-50 border-none rounded-xl text-sm font-semibold tabular-nums outline-none focus:ring-2 focus:ring-blue-600/10 focus:bg-white transition-all"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Location */}
                    <div className="space-y-6 pt-6 border-t border-slate-50">
                        <div className="flex items-center gap-3">
                            <div className="w-1.5 h-6 bg-indigo-600 rounded-full"></div>
                            <h2 className="text-lg font-bold text-slate-900">Địa điểm thi công</h2>
                        </div>

                        <div className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-1.5 px-1">
                                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Tỉnh / Thành phố</label>
                                    <select
                                        value={formData.city}
                                        onChange={e => setFormData({ ...formData, city: e.target.value, district: '' })}
                                        className="w-full px-5 py-3.5 bg-slate-50 border-none rounded-xl text-sm font-semibold outline-none focus:ring-2 focus:ring-blue-600/10 focus:bg-white transition-all text-slate-700"
                                    >
                                        {VIETNAM_LOCATIONS.map(l => (
                                            <option key={l.city} value={l.city}>{l.city}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="space-y-1.5 px-1">
                                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Quận / Huyện</label>
                                    <select
                                        required
                                        value={formData.district}
                                        onChange={e => setFormData({ ...formData, district: e.target.value })}
                                        className="w-full px-5 py-3.5 bg-slate-50 border-none rounded-xl text-sm font-semibold outline-none focus:ring-2 focus:ring-blue-600/10 focus:bg-white transition-all text-slate-700"
                                    >
                                        <option value="">Chọn quận/huyện</option>
                                        {districts.map(d => (
                                            <option key={d} value={d}>{d}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="space-y-1.5 px-1">
                                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Địa chỉ chi tiết</label>
                                <div className="relative">
                                    <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                                    <input
                                        required
                                        type="text"
                                        value={formData.location}
                                        onChange={e => setFormData({ ...formData, location: e.target.value })}
                                        placeholder="Số nhà, tên đường, phường..."
                                        className="w-full pl-11 pr-5 py-3.5 bg-slate-50 border-none rounded-xl text-sm font-semibold outline-none focus:ring-2 focus:ring-blue-600/10 focus:bg-white transition-all placeholder:text-slate-300"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Contact */}
                    <div className="space-y-6 pt-6 border-t border-slate-50">
                        <div className="flex items-center gap-3">
                            <div className="w-1.5 h-6 bg-emerald-600 rounded-full"></div>
                            <h2 className="text-lg font-bold text-slate-900">Liên hệ khách hàng</h2>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-1.5 px-1">
                                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Họ tên khách hàng</label>
                                <input
                                    required
                                    type="text"
                                    value={formData.contactName}
                                    onChange={e => setFormData({ ...formData, contactName: e.target.value })}
                                    placeholder="Tên chủ nhà/chủ đầu tư"
                                    className="w-full px-5 py-3.5 bg-slate-50 border-none rounded-xl text-sm font-semibold focus:ring-2 focus:ring-blue-600/10 focus:bg-white transition-all"
                                />
                            </div>
                            <div className="space-y-1.5 px-1">
                                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Số điện thoại</label>
                                <input
                                    required
                                    type="tel"
                                    value={formData.contactPhone}
                                    onChange={e => setFormData({ ...formData, contactPhone: e.target.value })}
                                    placeholder="09xxx"
                                    className="w-full px-5 py-3.5 bg-slate-50 border-none rounded-xl text-sm font-semibold tabular-nums outline-none focus:ring-2 focus:ring-blue-600/10 focus:bg-white transition-all"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 pt-4">
                    <Link
                        href="/contractor/projects"
                        className="flex-1 py-4 bg-slate-100 text-slate-500 rounded-xl font-bold text-xs uppercase tracking-wider hover:bg-slate-200 transition-all text-center"
                    >
                        Hủy bỏ
                    </Link>
                    <button
                        type="submit"
                        disabled={loading}
                        className="flex-[2] py-4 bg-blue-600 text-white rounded-xl font-bold text-xs uppercase tracking-wider hover:bg-blue-700 transition-all shadow-lg flex items-center justify-center gap-2 active:scale-95"
                    >
                        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                        Tạo dự án mới
                    </button>
                </div>
            </form>
        </div>
    )
}
