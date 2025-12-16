'use client'

/**
 * Contractor Login Page
 * Professional login form for B2B contractors
 */

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
    Building2,
    Mail,
    Lock,
    ArrowLeft,
    ArrowRight,
    AlertCircle,
    Eye,
    EyeOff
} from 'lucide-react'

export default function ContractorLoginPage() {
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [showPassword, setShowPassword] = useState(false)
    const [formData, setFormData] = useState({
        email: '',
        password: ''
    })

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target
        setFormData(prev => ({ ...prev, [name]: value }))
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError('')

        try {
            const res = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            })

            const data = await res.json()

            if (!res.ok) {
                throw new Error(data.error || 'Đăng nhập thất bại')
            }

            // Store token
            if (data.token) {
                localStorage.setItem('token', data.token)
                localStorage.setItem('user', JSON.stringify(data.user))
            }

            // Check if user is a verified contractor
            // For now, redirect to dashboard
            router.push('/contractor/dashboard')
        } catch (err: any) {
            setError(err.message || 'Đã có lỗi xảy ra')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-slate-950 text-white flex flex-col">
            {/* Navigation */}
            <nav className="bg-slate-950/95 backdrop-blur-md border-b border-slate-800">
                <div className="max-w-7xl mx-auto px-6 py-4">
                    <div className="flex items-center justify-between">
                        <Link href="/contractor" className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-amber-600 rounded-lg flex items-center justify-center">
                                <Building2 className="w-6 h-6 text-slate-950" />
                            </div>
                            <div>
                                <span className="text-xl font-bold text-white">SmartBuild</span>
                                <span className="text-amber-500 font-semibold ml-2">PRO</span>
                            </div>
                        </Link>
                        <Link
                            href="/contractor"
                            className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            Quay lại
                        </Link>
                    </div>
                </div>
            </nav>

            {/* Main Content */}
            <div className="flex-1 flex items-center justify-center px-6 py-12">
                <div className="w-full max-w-md">
                    {/* Header */}
                    <div className="text-center mb-8">
                        <div className="w-16 h-16 bg-gradient-to-br from-amber-500 to-amber-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
                            <Building2 className="w-8 h-8 text-slate-950" />
                        </div>
                        <h1 className="text-3xl font-bold mb-2">Đăng nhập Đối tác</h1>
                        <p className="text-slate-400">Truy cập portal dành riêng cho Nhà thầu</p>
                    </div>

                    {/* Form Card */}
                    <div className="bg-slate-900 rounded-3xl border border-slate-800 p-8">
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">
                                    <Mail className="w-4 h-4 inline mr-2" />
                                    Email
                                </label>
                                <input
                                    type="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleInputChange}
                                    placeholder="email@company.com"
                                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">
                                    <Lock className="w-4 h-4 inline mr-2" />
                                    Mật khẩu
                                </label>
                                <div className="relative">
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        name="password"
                                        value={formData.password}
                                        onChange={handleInputChange}
                                        placeholder="Nhập mật khẩu"
                                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all pr-12"
                                        required
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
                                    >
                                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                    </button>
                                </div>
                            </div>

                            <div className="flex items-center justify-between text-sm">
                                <label className="flex items-center gap-2 text-slate-400">
                                    <input
                                        type="checkbox"
                                        className="w-4 h-4 rounded border-slate-600 bg-slate-800 text-amber-500 focus:ring-amber-500"
                                    />
                                    Ghi nhớ đăng nhập
                                </label>
                                <Link href="#" className="text-amber-500 hover:underline">
                                    Quên mật khẩu?
                                </Link>
                            </div>

                            {/* Error Message */}
                            {error && (
                                <div className="bg-red-500/10 border border-red-500/50 rounded-xl p-4 flex items-center gap-3 text-red-400">
                                    <AlertCircle className="w-5 h-5 flex-shrink-0" />
                                    {error}
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-amber-500 hover:bg-amber-600 disabled:bg-slate-700 disabled:text-slate-400 text-slate-950 px-6 py-3 rounded-xl font-bold transition-all flex items-center justify-center gap-2"
                            >
                                {loading ? (
                                    <>
                                        <div className="w-5 h-5 border-2 border-slate-950/30 border-t-slate-950 rounded-full animate-spin" />
                                        Đang đăng nhập...
                                    </>
                                ) : (
                                    <>
                                        Đăng nhập
                                        <ArrowRight className="w-5 h-5" />
                                    </>
                                )}
                            </button>
                        </form>
                    </div>

                    {/* Register Link */}
                    <p className="text-center mt-6 text-slate-400">
                        Chưa có tài khoản?{' '}
                        <Link href="/contractor/register" className="text-amber-500 hover:underline font-medium">
                            Đăng ký ngay
                        </Link>
                    </p>

                    {/* Back to User Login */}
                    <p className="text-center mt-4 text-slate-500 text-sm">
                        Bạn là khách hàng lẻ?{' '}
                        <Link href="/login" className="text-slate-400 hover:text-white transition-colors">
                            Đăng nhập khách hàng
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    )
}
