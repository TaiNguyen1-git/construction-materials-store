'use client'

/**
 * Admin Onboarding Page
 * Support staff tool to create contractor accounts and help with onboarding
 */

import { useState } from 'react'
import Link from 'next/link'
import {
    UserPlus, ShieldCheck, Mail, Phone, Lock,
    Copy, Check, ArrowLeft, Loader2, Sparkles,
    RefreshCw, Key
} from 'lucide-react'
import toast from 'react-hot-toast'

export default function AdminOnboardingPage() {
    const [loading, setLoading] = useState(false)
    const [createdData, setCreatedData] = useState<any>(null)

    const [formData, setFormData] = useState({
        email: '',
        name: '',
        phone: '',
        initialPassword: ''
    })

    const [resetEmail, setResetEmail] = useState('')
    const [resetLoading, setResetLoading] = useState(false)

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        try {
            const res = await fetch('/api/admin/contractors/create', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            })

            const data = await res.json()
            if (res.ok) {
                setCreatedData(data.data)
                toast.success('Đã tạo tài khoản thầu thành công')
                setFormData({ email: '', name: '', phone: '', initialPassword: '' })
            } else {
                toast.error(data.error?.message || 'Lỗi khi tạo tài khoản')
            }
        } catch (err) {
            toast.error('Lỗi kết nối')
        } finally {
            setLoading(false)
        }
    }

    const handleGetResetLink = async () => {
        if (!resetEmail) {
            toast.error('Vui lòng nhập email')
            return
        }
        setResetLoading(true)
        try {
            // Mock API call to generate reset link
            const res = await fetch('/api/auth/reset-password-link', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: resetEmail })
            })

            const data = await res.json()
            if (res.ok) {
                toast.success('Đã gửi link reset vào clipboard')
                navigator.clipboard.writeText(data.resetLink)
            } else {
                toast.error(data.error?.message || 'Lỗi khi lấy link')
            }
        } catch (err) {
            toast.error('Lỗi kết nối')
        } finally {
            setResetLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <Link href="/admin" className="inline-flex items-center gap-2 text-gray-500 hover:text-blue-600 mb-2">
                            <ArrowLeft className="w-4 h-4" />
                            Quay lại Admin
                        </Link>
                        <h1 className="text-3xl font-black text-gray-900 flex items-center gap-3">
                            <UserPlus className="w-8 h-8 text-blue-600" />
                            Hỗ trợ Onboarding
                        </h1>
                    </div>
                    <div className="bg-blue-600 text-white px-4 py-2 rounded-xl font-bold text-sm shadow-lg shadow-blue-200 flex items-center gap-2">
                        <ShieldCheck className="w-4 h-4" />
                        Admin / Staff Mode
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Create Account Form */}
                    <div className="bg-white rounded-3xl shadow-xl p-8 border border-gray-100">
                        <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                            <Sparkles className="w-5 h-5 text-blue-500" />
                            Tạo tài khoản thầu mới
                        </h2>

                        <form onSubmit={handleCreate} className="space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Email</label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                    <input
                                        type="email"
                                        required
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-blue-500 transition-all outline-none"
                                        placeholder="example@gmail.com"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Họ tên</label>
                                <div className="relative">
                                    <UserPlus className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                    <input
                                        type="text"
                                        required
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-blue-500 transition-all outline-none"
                                        placeholder="Nguyễn Văn A"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">SĐT</label>
                                <div className="relative">
                                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                    <input
                                        type="tel"
                                        value={formData.phone}
                                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                        className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-blue-500 transition-all outline-none"
                                        placeholder="09xxx"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Mật khẩu (Tùy chọn)</label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                    <input
                                        type="text"
                                        value={formData.initialPassword}
                                        onChange={(e) => setFormData({ ...formData, initialPassword: e.target.value })}
                                        className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-blue-500 transition-all outline-none"
                                        placeholder="Trống = Tự động tạo"
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full py-4 bg-blue-600 text-white font-black rounded-2xl hover:bg-blue-700 transition-all flex items-center justify-center gap-2 mt-4"
                            >
                                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Tạo tài khoản'}
                            </button>
                        </form>
                    </div>

                    {/* Helper Tools */}
                    <div className="space-y-6">
                        {/* Success Card */}
                        {createdData && (
                            <div className="bg-green-50 border-2 border-green-200 rounded-3xl p-6 animate-in slide-in-from-right duration-500">
                                <h3 className="text-green-800 font-bold mb-4 flex items-center gap-2">
                                    <Check className="w-5 h-5" />
                                    Đã tạo tài khoản!
                                </h3>
                                <div className="bg-white rounded-2xl p-4 space-y-3 shadow-sm text-sm">
                                    <div>
                                        <p className="text-gray-500 font-medium">Email:</p>
                                        <p className="font-bold text-gray-900">{createdData.email}</p>
                                    </div>
                                    <div>
                                        <p className="text-gray-500 font-medium">Mật khẩu tạm thời:</p>
                                        <div className="flex items-center justify-between">
                                            <p className="font-mono font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded">
                                                {createdData.temporaryPassword}
                                            </p>
                                            <button
                                                onClick={() => {
                                                    navigator.clipboard.writeText(`Email: ${createdData.email}\nMật khẩu: ${createdData.temporaryPassword}`)
                                                    toast.success('Đã copy thông tin')
                                                }}
                                                className="text-gray-400 hover:text-blue-600"
                                            >
                                                <Copy className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                                <p className="text-xs text-green-600 mt-4 leading-relaxed">
                                    Nhà thầu sẽ được yêu cầu đổi mật khẩu và bổ sung hồ sơ trực tiếp trong lần đăng nhập đầu tiên.
                                </p>
                            </div>
                        )}

                        {/* Password Recovery Helper */}
                        <div className="bg-white rounded-3xl shadow-xl p-8 border border-gray-100">
                            <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                                <Key className="w-5 h-5 text-orange-500" />
                                Quên mật khẩu / Reset
                            </h2>
                            <p className="text-sm text-gray-500 mb-4">
                                Nhập email của thầu để lấy link reset mật khẩu trực tiếp (không cần check email).
                            </p>
                            <div className="space-y-4">
                                <input
                                    type="email"
                                    value={resetEmail}
                                    onChange={(e) => setResetEmail(e.target.value)}
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-blue-500"
                                    placeholder="thau@gmail.com"
                                />
                                <button
                                    onClick={handleGetResetLink}
                                    disabled={resetLoading}
                                    className="w-full py-3 bg-gray-900 text-white font-bold rounded-xl hover:bg-black transition-all flex items-center justify-center gap-2"
                                >
                                    {resetLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Lấy link Reset'}
                                </button>
                            </div>
                        </div>

                        {/* Guidelines */}
                        <div className="bg-blue-50 border border-blue-100 rounded-3xl p-6">
                            <h3 className="font-bold text-blue-800 mb-2">Quy trình Onboarding:</h3>
                            <ul className="text-sm text-blue-700 space-y-2">
                                <li className="flex gap-2">
                                    <div className="w-5 h-5 bg-blue-200 rounded-full flex items-center justify-center shrink-0 font-bold text-xs font-mono">1</div>
                                    Tạo TK & gửi mật khẩu cho thầu
                                </li>
                                <li className="flex gap-2">
                                    <div className="w-5 h-5 bg-blue-200 rounded-full flex items-center justify-center shrink-0 font-bold text-xs font-mono">2</div>
                                    Thầu đăng nhập thành công
                                </li>
                                <li className="flex gap-2">
                                    <div className="w-5 h-5 bg-blue-200 rounded-full flex items-center justify-center shrink-0 font-bold text-xs font-mono">3</div>
                                    Thầu đổi mật khẩu & điền profile
                                </li>
                                <li className="flex gap-2">
                                    <div className="w-5 h-5 bg-blue-200 rounded-full flex items-center justify-center shrink-0 font-bold text-xs font-mono">4</div>
                                    Admin xác thực & thầu bắt đầu nhận việc
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
