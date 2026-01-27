'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Lock, ArrowLeft, CheckCircle2, XCircle, Eye, EyeOff, Building2, ShieldCheck, KeyRound } from 'lucide-react'

function ResetPasswordContent() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [showPassword, setShowPassword] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [isSuccess, setIsSuccess] = useState(false)
    const [error, setError] = useState('')

    const token = searchParams?.get('token') || ''
    const email = searchParams?.get('email') || ''

    useEffect(() => {
        if (!token || !email) {
            setError('Link đặt lại mật khẩu không hợp lệ.')
        }
    }, [token, email])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')

        if (password.length < 8) {
            setError('Mật khẩu phải có ít nhất 8 ký tự')
            return
        }

        if (password !== confirmPassword) {
            setError('Mật khẩu xác nhận không khớp')
            return
        }

        setIsLoading(true)

        try {
            const response = await fetch('/api/auth/reset-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token, email, newPassword: password })
            })

            const data = await response.json()
            if (data.success) {
                setIsSuccess(true)
            } else {
                setError(data.error || 'Có lỗi xảy ra. Vui lòng thử lại.')
            }
        } catch (err) {
            setError('Có lỗi xảy ra. Vui lòng thử lại.')
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="min-h-screen flex bg-white font-sans selection:bg-primary-100 selection:text-primary-900">
            {/* Left: Branding & Visuals (Desktop) */}
            <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-neutral-900">
                <div className="absolute inset-0 z-0 scale-105 animate-slow-zoom">
                    <img
                        src="https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=2070&auto=format&fit=crop"
                        alt="Skyscraper Architecture"
                        className="w-full h-full object-cover opacity-60"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-neutral-900 via-neutral-900/40 to-transparent" />
                </div>

                <div className="relative z-10 w-full flex flex-col justify-between p-12 text-white">
                    <div className="flex items-center gap-2 animate-fade-in">
                        <div className="bg-white/10 backdrop-blur-md p-2.5 rounded-2xl border border-white/20 shadow-2xl">
                            <Building2 className="h-7 w-7 text-white" />
                        </div>
                        <span className="text-2xl font-black tracking-tighter">SmartBuild</span>
                    </div>

                    <div className="max-w-lg space-y-8 animate-fade-in-up">
                        <h2 className="text-5xl font-bold leading-tight">
                            Khôi phục <span className="text-primary-400">quyền lực</span> quản lý.
                        </h2>
                        <p className="text-lg text-neutral-300 font-medium">
                            Hoàn tất việc đặt lại mật khẩu để tiếp tục điều hành các dự án và tối ưu hóa quy trình xây dựng của bạn.
                        </p>

                        <div className="space-y-4 pt-4">
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-full bg-primary-500/20 flex items-center justify-center border border-primary-500/30">
                                    <ShieldCheck className="h-5 w-5 text-primary-400" />
                                </div>
                                <span className="text-sm font-semibold">Bảo mật đa lớp</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-full bg-secondary-500/20 flex items-center justify-center border border-secondary-500/30">
                                    <KeyRound className="h-5 w-5 text-secondary-400" />
                                </div>
                                <span className="text-sm font-semibold">Quản lý định danh</span>
                            </div>
                        </div>
                    </div>

                    <p className="text-sm text-neutral-400 animate-fade-in">
                        © 2026 SmartBuild ERP. Giải pháp số cho ngành xây dựng.
                    </p>
                </div>
            </div>

            {/* Right: Reset Form */}
            <div className="flex-1 flex flex-col">
                {/* Mobile Header */}
                <div className="flex lg:hidden items-center justify-between p-4 border-b border-neutral-100 bg-white sticky top-0 z-50">
                    <div className="flex items-center gap-2">
                        <Building2 className="h-6 w-6 text-primary-600" />
                        <span className="text-xl font-black tracking-tighter text-neutral-900">SmartBuild</span>
                    </div>
                    <button onClick={() => router.push('/login')} className="p-2 hover:bg-neutral-100 rounded-full transition-colors">
                        <ArrowLeft className="h-5 w-5 text-neutral-600" />
                    </button>
                </div>

                <div className="flex-1 flex flex-col justify-center px-6 sm:px-12 lg:px-20 py-12">
                    <div className="w-full max-w-md mx-auto">
                        <button
                            onClick={() => router.push('/login')}
                            className="hidden lg:flex items-center text-neutral-500 hover:text-primary-600 font-medium transition-all mb-12 group"
                        >
                            <ArrowLeft className="h-4 w-4 mr-2 group-hover:-translate-x-1 transition-transform" />
                            Quay lại đăng nhập
                        </button>

                        {isSuccess ? (
                            <div className="text-center animate-slide-in">
                                <div className="inline-flex items-center justify-center w-20 h-20 bg-green-50 rounded-full mb-8">
                                    <CheckCircle2 className="h-10 w-10 text-green-600" />
                                </div>
                                <h2 className="text-3xl font-bold text-neutral-900 mb-3">Thành công!</h2>
                                <p className="text-neutral-500 font-medium mb-8">
                                    Mật khẩu của bạn đã được cập nhật. Bây giờ bạn có thể đăng nhập bằng mật khẩu mới này.
                                </p>
                                <button
                                    onClick={() => router.push('/login')}
                                    className="w-full py-4 px-4 bg-primary-600 text-white font-bold rounded-2xl shadow-xl shadow-primary-500/20 hover:bg-primary-700 transition-all transform active:scale-[0.98]"
                                >
                                    Đăng nhập ngay
                                </button>
                            </div>
                        ) : !token || !email ? (
                            <div className="text-center animate-fade-in">
                                <div className="inline-flex items-center justify-center w-20 h-20 bg-red-50 rounded-full mb-8">
                                    <XCircle className="h-10 w-10 text-red-600" />
                                </div>
                                <h2 className="text-3xl font-bold text-neutral-900 mb-3">Link không hợp lệ</h2>
                                <p className="text-neutral-500 font-medium mb-8">
                                    Link này đã hết hạn hoặc không tồn tại trong hệ thống. Vui lòng yêu cầu link mới.
                                </p>
                                <button
                                    onClick={() => router.push('/forgot-password')}
                                    className="w-full py-4 px-4 bg-primary-600 text-white font-bold rounded-2xl shadow-xl shadow-primary-500/20 hover:bg-primary-700 transition-all"
                                >
                                    Yêu cầu lại link mới
                                </button>
                            </div>
                        ) : (
                            <div className="animate-fade-in">
                                <div className="mb-8">
                                    <h1 className="text-3xl font-bold text-neutral-900 mb-2">Đặt lại mật khẩu</h1>
                                    <p className="text-neutral-500 font-medium leading-relaxed">
                                        Đang thiết đặt mật khẩu mới cho tài khoản:<br />
                                        <span className="text-neutral-900 font-bold">{email}</span>
                                    </p>
                                </div>

                                <form className="space-y-6" onSubmit={handleSubmit}>
                                    {error && (
                                        <div className="bg-red-50 border border-red-100 rounded-2xl p-4 text-red-600 text-sm font-bold flex items-center gap-3">
                                            <div className="h-2 w-2 rounded-full bg-red-600 animate-pulse" />
                                            {error}
                                        </div>
                                    )}

                                    <div className="space-y-1.5 ml-1">
                                        <label htmlFor="password" className="block text-sm font-bold text-neutral-700">Mật khẩu mới</label>
                                        <div className="relative group">
                                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-neutral-400 group-focus-within:text-primary-500">
                                                <Lock className="h-5 w-5" />
                                            </div>
                                            <input
                                                id="password"
                                                name="password"
                                                type={showPassword ? 'text' : 'password'}
                                                required
                                                value={password}
                                                onChange={(e) => setPassword(e.target.value)}
                                                className="block w-full pl-11 pr-12 py-3.5 bg-neutral-50 border border-neutral-200 placeholder-neutral-400 text-neutral-900 text-base rounded-2xl focus:bg-white focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 transition-all outline-none"
                                                placeholder="••••••••"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowPassword(!showPassword)}
                                                className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
                                            >
                                                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                            </button>
                                        </div>
                                    </div>

                                    <div className="space-y-1.5 ml-1">
                                        <label htmlFor="confirmPassword" className="block text-sm font-bold text-neutral-700">Xác nhận mật khẩu</label>
                                        <div className="relative">
                                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-neutral-400">
                                                <Lock className="h-5 w-5" />
                                            </div>
                                            <input
                                                id="confirmPassword"
                                                name="confirmPassword"
                                                type={showPassword ? 'text' : 'password'}
                                                required
                                                value={confirmPassword}
                                                onChange={(e) => setConfirmPassword(e.target.value)}
                                                className="block w-full pl-11 pr-4 py-3.5 bg-neutral-50 border border-neutral-200 placeholder-neutral-400 text-neutral-900 text-base rounded-2xl focus:bg-white focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 transition-all outline-none"
                                                placeholder="Nhập lại mật khẩu mới"
                                            />
                                        </div>
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={isLoading || !password || !confirmPassword}
                                        className="w-full flex justify-center items-center gap-3 py-4 px-4 rounded-2xl shadow-xl shadow-primary-500/20 text-base font-bold text-white bg-primary-600 hover:bg-primary-700 transition-all transform active:scale-[0.98] disabled:opacity-50"
                                    >
                                        {isLoading ? (
                                            <div className="w-6 h-6 border-3 border-white/30 border-t-white rounded-full animate-spin" />
                                        ) : (
                                            <>
                                                <ShieldCheck className="h-5 w-5" />
                                                <span>Cập nhật mật khẩu</span>
                                            </>
                                        )}
                                    </button>
                                </form>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}

export default function ResetPasswordPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-neutral-900 flex items-center justify-center">
                <div className="text-center">
                    <div className="w-10 h-10 border-4 border-primary-500/30 border-t-primary-500 rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-neutral-400 font-bold">SmartBuild...</p>
                </div>
            </div>
        }>
            <ResetPasswordContent />
        </Suspense>
    )
}
