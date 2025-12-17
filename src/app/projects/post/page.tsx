'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, MapPin, DollarSign, Calendar, FileText, Phone, Mail, User } from 'lucide-react'
import toast from 'react-hot-toast'
import Link from 'next/link'
import Header from '@/components/Header'

const PROJECT_TYPES = [
    { value: 'NEW_CONSTRUCTION', label: 'Xây mới' },
    { value: 'RENOVATION', label: 'Cải tạo/Sửa chữa' },
    { value: 'INTERIOR', label: 'Nội thất' },
    { value: 'EXTERIOR', label: 'Ngoại thất' },
    { value: 'FLOORING', label: 'Lát sàn/gạch' },
    { value: 'PAINTING', label: 'Sơn' },
    { value: 'PLUMBING', label: 'Ống nước' },
    { value: 'ELECTRICAL', label: 'Điện' },
    { value: 'ROOFING', label: 'Mái' },
    { value: 'OTHER', label: 'Khác' }
]

const BUDGET_TYPES = [
    { value: 'FIXED', label: 'Cố định' },
    { value: 'NEGOTIABLE', label: 'Thương lượng' },
    { value: 'PER_SQM', label: 'Theo m²' },
    { value: 'UNKNOWN', label: 'Chưa xác định' }
]

export default function PostProjectPage() {
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [form, setForm] = useState({
        title: '',
        description: '',
        projectType: 'RENOVATION',
        location: '',
        district: '',
        city: 'Biên Hòa',
        estimatedBudget: '',
        budgetType: 'NEGOTIABLE',
        requirements: '',
        materialsNeeded: '',
        contactName: '',
        contactPhone: '',
        contactEmail: '',
        isUrgent: false
    })

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        try {
            // Get customer ID from localStorage or create guest identity from form
            let customerId = localStorage.getItem('user_id')

            if (!customerId) {
                // Auto create guest identity from form data
                customerId = 'guest_' + Date.now()
                localStorage.setItem('user_id', customerId)
                if (form.contactName) localStorage.setItem('user_name', form.contactName)
                if (form.contactPhone) localStorage.setItem('user_phone', form.contactPhone)
                if (form.contactEmail) localStorage.setItem('user_email', form.contactEmail)
            }

            const res = await fetch('/api/marketplace/projects', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...form,
                    estimatedBudget: form.estimatedBudget ? parseFloat(form.estimatedBudget) : null,
                    requirements: form.requirements.split('\n').filter(r => r.trim()),
                    materialsNeeded: form.materialsNeeded.split(',').map(m => m.trim()).filter(Boolean),
                    customerId
                })
            })

            const data = await res.json()

            if (data.success) {
                toast.success('Đăng dự án thành công!')
                router.push('/projects')
            } else {
                toast.error(data.error?.message || 'Đăng dự án thất bại')
            }
        } catch (error) {
            toast.error('Lỗi kết nối server')
        } finally {
            setLoading(false)
        }
    }

    return (
        <>
            <Header />
            <div className="min-h-screen bg-gray-50 py-8">
                <div className="max-w-3xl mx-auto px-4">
                    {/* Header */}
                    <div className="mb-8">
                        <Link href="/projects" className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-4">
                            <ArrowLeft className="w-5 h-5 mr-2" />
                            Quay lại
                        </Link>
                        <h1 className="text-3xl font-bold text-gray-900">Đăng Dự Án Mới</h1>
                        <p className="text-gray-500 mt-2">Mô tả dự án của bạn để nhà thầu có thể ứng tuyển</p>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Basic Info */}
                        <div className="bg-white rounded-xl shadow-sm p-6">
                            <h2 className="text-lg font-semibold text-gray-900 mb-4">Thông tin cơ bản</h2>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Tên dự án *
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={form.title}
                                        onChange={(e) => setForm({ ...form, title: e.target.value })}
                                        placeholder="VD: Sửa chữa nhà 3 tầng, lát gạch sân..."
                                        className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Loại công trình *
                                    </label>
                                    <select
                                        required
                                        value={form.projectType}
                                        onChange={(e) => setForm({ ...form, projectType: e.target.value })}
                                        className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
                                    >
                                        {PROJECT_TYPES.map(type => (
                                            <option key={type.value} value={type.value}>{type.label}</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Mô tả chi tiết *
                                    </label>
                                    <textarea
                                        required
                                        rows={4}
                                        value={form.description}
                                        onChange={(e) => setForm({ ...form, description: e.target.value })}
                                        placeholder="Mô tả công việc cần làm, diện tích, tình trạng hiện tại..."
                                        className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>

                                <div className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        id="urgent"
                                        checked={form.isUrgent}
                                        onChange={(e) => setForm({ ...form, isUrgent: e.target.checked })}
                                        className="w-4 h-4 text-blue-600 rounded"
                                    />
                                    <label htmlFor="urgent" className="text-sm text-gray-700">
                                        Dự án gấp (cần hoàn thành sớm)
                                    </label>
                                </div>
                            </div>
                        </div>

                        {/* Location */}
                        <div className="bg-white rounded-xl shadow-sm p-6">
                            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                <MapPin className="w-5 h-5 text-gray-400" />
                                Địa điểm
                            </h2>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Địa chỉ *
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={form.location}
                                        onChange={(e) => setForm({ ...form, location: e.target.value })}
                                        placeholder="Số nhà, đường..."
                                        className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Quận/Huyện
                                    </label>
                                    <input
                                        type="text"
                                        value={form.district}
                                        onChange={(e) => setForm({ ...form, district: e.target.value })}
                                        placeholder="VD: Biên Hòa, Long Khánh..."
                                        className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Budget */}
                        <div className="bg-white rounded-xl shadow-sm p-6">
                            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                <DollarSign className="w-5 h-5 text-gray-400" />
                                Ngân sách
                            </h2>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Ngân sách dự kiến (VNĐ)
                                    </label>
                                    <input
                                        type="number"
                                        value={form.estimatedBudget}
                                        onChange={(e) => setForm({ ...form, estimatedBudget: e.target.value })}
                                        placeholder="VD: 50000000"
                                        className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Loại ngân sách
                                    </label>
                                    <select
                                        value={form.budgetType}
                                        onChange={(e) => setForm({ ...form, budgetType: e.target.value })}
                                        className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
                                    >
                                        {BUDGET_TYPES.map(type => (
                                            <option key={type.value} value={type.value}>{type.label}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* Requirements */}
                        <div className="bg-white rounded-xl shadow-sm p-6">
                            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                <FileText className="w-5 h-5 text-gray-400" />
                                Yêu cầu
                            </h2>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Yêu cầu cụ thể (mỗi dòng 1 yêu cầu)
                                    </label>
                                    <textarea
                                        rows={3}
                                        value={form.requirements}
                                        onChange={(e) => setForm({ ...form, requirements: e.target.value })}
                                        placeholder="VD:&#10;Có kinh nghiệm 3 năm&#10;Có đội ngũ thợ từ 5 người&#10;Bảo hành 1 năm"
                                        className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Vật liệu cần thiết (phân cách bằng dấu phẩy)
                                    </label>
                                    <input
                                        type="text"
                                        value={form.materialsNeeded}
                                        onChange={(e) => setForm({ ...form, materialsNeeded: e.target.value })}
                                        placeholder="VD: Gạch lát, xi măng, cát, sơn..."
                                        className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Contact */}
                        <div className="bg-white rounded-xl shadow-sm p-6">
                            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                <User className="w-5 h-5 text-gray-400" />
                                Thông tin liên hệ
                            </h2>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Họ tên *
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={form.contactName}
                                        onChange={(e) => setForm({ ...form, contactName: e.target.value })}
                                        className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Số điện thoại *
                                    </label>
                                    <input
                                        type="tel"
                                        required
                                        value={form.contactPhone}
                                        onChange={(e) => setForm({ ...form, contactPhone: e.target.value })}
                                        className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Email
                                    </label>
                                    <input
                                        type="email"
                                        value={form.contactEmail}
                                        onChange={(e) => setForm({ ...form, contactEmail: e.target.value })}
                                        className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Submit */}
                        <div className="flex gap-4">
                            <button
                                type="button"
                                onClick={() => router.back()}
                                className="flex-1 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                            >
                                Hủy
                            </button>
                            <button
                                type="submit"
                                disabled={loading}
                                className="flex-1 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50"
                            >
                                {loading ? 'Đang đăng...' : 'Đăng dự án'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </>
    )
}
