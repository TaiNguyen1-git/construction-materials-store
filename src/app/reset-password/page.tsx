'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Lock, ArrowLeft, CheckCircle, XCircle, Eye, EyeOff } from 'lucide-react'

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

        if (password.length < 6) {
            setError('Mật khẩu phải có ít nhất 6 ký tự')
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
        <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50 flex flex-col">
            {/* Header */}
            <div className="bg-white/80 backdrop-blur-md shadow-sm border-b border-gray-100">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between py-4">
                        <button
                            onClick={() => router.push('/login')}
                            className="flex items-center text-gray-700 hover:text-primary-600 font-medium transition-colors"
                        >
                            <ArrowLeft className="h-5 w-5 mr-2" />
                            Quay lại đăng nhập
                        </button>
                        <div className="flex items-center gap-2">
                            <div className="bg-gradient-to-r from-primary-600 to-secondary-600 p-2 rounded-xl">
                                <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                </svg>
                            </div>
                            <h1 className="text-2xl font-black bg-gradient-to-r from-primary-600 to-secondary-600 bg-clip-text text-transparent">SmartBuild</h1>
                        </div>
                        <div className="w-24"></div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
                <div className="max-w-md w-full">
                    {/* Card Container */}
                    <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
                        {isSuccess ? (
                            <div className="text-center">
                                <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-6">
                                    <CheckCircle className="h-12 w-12 text-green-600" />
                                </div>
                                <h2 className="text-2xl font-bold text-gray-900 mb-3">
                                    Đặt lại mật khẩu thành công! ✅
                                </h2>
                                <p className="text-base text-gray-600 mb-6">
                                    Mật khẩu của bạn đã được cập nhật. Bạn có thể đăng nhập với mật khẩu mới.
                                </p>
                                <button
                                    onClick={() => router.push('/login')}
                                    className="w-full py-3 px-4 bg-gradient-to-r from-green-500 to-blue-500 text-white rounded-xl font-semibold hover:from-green-600 hover:to-blue-600 transition-all"
                                >
                                    Đăng nhập ngay
                                </button>
                            </div>
                        ) : !token || !email ? (
                            <div className="text-center">
                                <div className="inline-flex items-center justify-center w-20 h-20 bg-red-100 rounded-full mb-6">
                                    <XCircle className="h-12 w-12 text-red-600" />
                                </div>
                                <h2 className="text-2xl font-bold text-gray-900 mb-3">
                                    Link không hợp lệ
                                </h2>
                                <p className="text-base text-gray-600 mb-6">
                                    Link đặt lại mật khẩu không hợp lệ hoặc đã hết hạn. Vui lòng yêu cầu đặt lại mật khẩu mới.
                                </p>
                                <button
                                    onClick={() => router.push('/forgot-password')}
                                    className="w-full py-3 px-4 bg-gradient-to-r from-green-500 to-blue-500 text-white rounded-xl font-semibold hover:from-green-600 hover:to-blue-600 transition-all"
                                >
                                    Yêu cầu đặt lại mật khẩu
                                </button>
                            </div>
                        ) : (
                            <>
                                <div className="text-center mb-8">
                                    <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-green-500 to-blue-500 rounded-2xl mb-4">
                                        <Lock className="h-8 w-8 text-white" />
                                    </div>
                                    <h2 className="text-3xl font-bold text-gray-900 mb-2">
                                        Đặt lại mật khẩu
                                    </h2>
                                    <p className="text-base text-gray-600">
                                        Nhập mật khẩu mới cho tài khoản <strong>{email}</strong>
                                    </p>
                                </div>

                                <form className="space-y-6" onSubmit={handleSubmit}>
                                    {error && (
                                        <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4">
                                            <p className="text-sm text-red-600 font-medium">{error}</p>
                                        </div>
                                    )}

                                    <div>
                                        <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-2">
                                            <Lock className="h-4 w-4 inline mr-1" />
                                            Mật khẩu mới
                                        </label>
                                        <div className="relative">
                                            <input
                                                id="password"
                                                name="password"
                                                type={showPassword ? 'text' : 'password'}
                                                required
                                                value={password}
                                                onChange={(e) => setPassword(e.target.value)}
                                                className="appearance-none relative block w-full px-4 py-3 border-2 border-gray-200 placeholder-gray-400 text-gray-900 text-base rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all pr-12"
                                                placeholder="Nhập mật khẩu mới"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowPassword(!showPassword)}
                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                            >
                                                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                            </button>
                                        </div>
                                    </div>

                                    <div>
                                        <label htmlFor="confirmPassword" className="block text-sm font-semibold text-gray-700 mb-2">
                                            <Lock className="h-4 w-4 inline mr-1" />
                                            Xác nhận mật khẩu
                                        </label>
                                        <input
                                            id="confirmPassword"
                                            name="confirmPassword"
                                            type={showPassword ? 'text' : 'password'}
                                            required
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            className="appearance-none relative block w-full px-4 py-3 border-2 border-gray-200 placeholder-gray-400 text-gray-900 text-base rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all"
                                            placeholder="Nhập lại mật khẩu mới"
                                        />
                                    </div>

                                    <div>
                                        <button
                                            type="submit"
                                            disabled={isLoading || !password || !confirmPassword}
                                            className="group relative w-full flex justify-center items-center gap-2 py-3.5 px-4 border border-transparent text-base font-semibold rounded-xl text-white bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transition-all transform hover:scale-[1.02]"
                                        >
                                            {isLoading ? (
                                                <>
                                                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                                    <span>Đang xử lý...</span>
                                                </>
                                            ) : (
                                                <>
                                                    <Lock className="h-5 w-5" />
                                                    <span>Đặt lại mật khẩu</span>
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </form>
                            </>
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
            <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="w-8 h-8 border-2 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-gray-600">Đang tải...</p>
                </div>
            </div>
        }>
            <ResetPasswordContent />
        </Suspense>
    )
}
