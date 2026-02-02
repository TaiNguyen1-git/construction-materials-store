'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Building2, Calendar, DollarSign, MapPin, Save, Loader2, Menu, User, LogOut, Search, Bell } from 'lucide-react'
import Sidebar from '../../components/Sidebar'
import toast from 'react-hot-toast'
import { VIETNAM_LOCATIONS } from '@/lib/vn-data'
import { fetchWithAuth } from '@/lib/api-client'
import ContractorHeader from '../../components/ContractorHeader'
import { useAuth } from '@/contexts/auth-context'

export default function NewProjectPage() {
    const { user, logout } = useAuth()
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [sidebarOpen, setSidebarOpen] = useState(true)

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

    // No basic useEffect needed as user is handled by useAuth

    const projectTypes = [
        { value: 'NEW_BUILD', label: 'Xây mới' },
        { value: 'RENOVATION', label: 'Cải tạo / Sửa chữa' },
        { value: 'INTERIOR', label: 'Thiết kế / Thi công nội thất' },
        { value: 'OTHER', label: 'Khác' }
    ]

    const handleLogout = async () => {
        await logout()
        router.push('/contractor')
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

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
                toast.success('Đã tạo dự án thành công')
                router.push('/contractor/projects')
            } else {
                const error = await res.json()
                toast.error(error.message || 'Lỗi khi tạo dự án')
            }
        } catch (err) {
            toast.error('Lỗi kết nối')
        } finally {
            setLoading(false)
        }
    }

    // Filter districts based on selected city
    const selectedCityData = VIETNAM_LOCATIONS.find(l => l.city === formData.city)
    const districts = selectedCityData ? selectedCityData.districts : []

    return (
        <div className="min-h-screen bg-gray-50">
            <ContractorHeader sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
            <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

            <main className={`flex-1 pt-[73px] transition-all duration-300 ${sidebarOpen ? 'lg:ml-64' : 'ml-0'}`}>
                <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <div className="flex items-center gap-4 mb-8">
                        <Link
                            href="/contractor/projects"
                            className="p-2 -ml-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-all"
                        >
                            <ArrowLeft className="w-5 h-5" />
                        </Link>
                        <h1 className="text-2xl font-bold text-gray-900">Tạo Dự Án Mới</h1>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-sm border border-gray-100 space-y-6">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">Tên dự án</label>
                                <input
                                    required
                                    type="text"
                                    value={formData.title}
                                    onChange={e => setFormData({ ...formData, title: e.target.value })}
                                    placeholder="VD: Xây biệt thự phố Nguyễn Xiển"
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:border-blue-500 outline-none transition-all"
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">Loại công trình</label>
                                    <select
                                        value={formData.projectType}
                                        onChange={e => setFormData({ ...formData, projectType: e.target.value })}
                                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:border-blue-500 outline-none"
                                    >
                                        {projectTypes.map(t => (
                                            <option key={t.value} value={t.value}>{t.label}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">Ngân sách dự kiến (đồng)</label>
                                    <div className="relative">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-bold">đ</span>
                                        <input
                                            type="text"
                                            value={formData.estimatedBudget}
                                            onChange={e => {
                                                const value = e.target.value.replace(/\D/g, '')
                                                const formatted = value.replace(/\B(?=(\d{3})+(?!\d))/g, '.')
                                                setFormData({ ...formData, estimatedBudget: formatted })
                                            }}
                                            placeholder="0"
                                            className="w-full pl-9 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:border-blue-500 outline-none"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">Tỉnh / Thành phố</label>
                                    <select
                                        value={formData.city}
                                        onChange={e => setFormData({ ...formData, city: e.target.value, district: '' })}
                                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:border-blue-500 outline-none"
                                    >
                                        {VIETNAM_LOCATIONS.map(l => (
                                            <option key={l.city} value={l.city}>{l.city}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">Quận / Huyện</label>
                                    <select
                                        required
                                        value={formData.district}
                                        onChange={e => setFormData({ ...formData, district: e.target.value })}
                                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:border-blue-500 outline-none"
                                    >
                                        <option value="">Chọn quận/huyện</option>
                                        {districts.map(d => (
                                            <option key={d} value={d}>{d}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">Địa chỉ chi tiết</label>
                                <div className="relative">
                                    <MapPin className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" />
                                    <input
                                        required
                                        type="text"
                                        value={formData.location}
                                        onChange={e => setFormData({ ...formData, location: e.target.value })}
                                        placeholder="Số nhà, tên đường, phường..."
                                        className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:border-blue-500 outline-none"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">Mô tả dự án</label>
                                <textarea
                                    value={formData.description}
                                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                                    rows={4}
                                    placeholder="Chi tiết về diện tích, số tầng, phong cách thiết kế..."
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:border-blue-500 outline-none resize-none"
                                />
                            </div>

                            <div className="space-y-4 pt-4 border-t border-gray-100">
                                <h3 className="font-bold text-gray-900">Thông tin liên hệ khách hàng</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-2">Tên khách hàng</label>
                                        <input
                                            required
                                            type="text"
                                            value={formData.contactName}
                                            onChange={e => setFormData({ ...formData, contactName: e.target.value })}
                                            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:border-blue-500 outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-2">Số điện thoại</label>
                                        <input
                                            required
                                            type="tel"
                                            value={formData.contactPhone}
                                            onChange={e => setFormData({ ...formData, contactPhone: e.target.value })}
                                            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:border-blue-500 outline-none"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-4 pt-4">
                            <Link
                                href="/contractor/projects"
                                className="flex-1 py-4 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200 transition-all text-center"
                            >
                                Hủy bỏ
                            </Link>
                            <button
                                type="submit"
                                disabled={loading}
                                className="flex-1 py-4 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-all shadow-xl shadow-blue-200 flex items-center justify-center gap-2"
                            >
                                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                                Tạo Dự Án
                            </button>
                        </div>
                    </form>
                </div>
            </main>
        </div>
    )
}
