'use client'

/**
 * Contractor Login Page - Light Theme
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
import { User } from '@prisma/client'

interface ExtendedUser extends User {
    contractorId?: string;
}
import { toast, Toaster } from 'react-hot-toast'
import { getPostLoginRedirectUrl } from '@/lib/auth-redirect'
import authService from '@/lib/auth-service'

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

    const handleGoBack = () => {
        // Always clean up any half-started auth state when leaving the login form
        localStorage.removeItem('access_token')
        localStorage.removeItem('user')
        localStorage.removeItem('refresh_token')
        localStorage.removeItem('auth_active')
        sessionStorage.removeItem('access_token')
        sessionStorage.removeItem('user')

        // Clear provider tokens
        document.cookie = 'contractor_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT'
        document.cookie = 'auth_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT'

        window.location.replace('/contractor')
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError('')

        try {
            // 🛡️ Enhanced Login using centralized service
            const data = await authService.login(formData)

            if (!data.user) {
                if (data.twoFactorRequired || data.verificationRequired) {
                    // Handle 2FA or verification if implemented
                    toast.error('Tài khoản yêu cầu xác thực thêm. Vui lòng liên hệ hỗ trợ.')
                    setLoading(false)
                    return
                }
                throw new Error(data.error || 'Đăng nhập không thành công')
            }

            // At this point, TypeScript knows data.user is defined
            const loggedInUser = data.user;

            // Check if user is a contractor
            if (loggedInUser.role !== 'CONTRACTOR') {
                if (loggedInUser.role === 'MANAGER' || loggedInUser.role === 'EMPLOYEE') {
                    window.location.href = '/admin'
                    return
                } else {
                    // Rollback if role doesn't match this portal
                    await authService.logout()
                    throw new Error('Tài khoản này không phải là nhà thầu. Vui lòng sử dụng trang đăng nhập khách hàng.')
                }
            }

            // Handle Contractor specific storage for legacy support if needed
            if ((loggedInUser as ExtendedUser).contractorId) {
                localStorage.setItem('contractor_id', (loggedInUser as ExtendedUser).contractorId!)
            }

            // Redirect
            const redirectUrl = getPostLoginRedirectUrl(loggedInUser) || '/contractor'
            toast.success('Đăng nhập thành công!')
            window.location.href = redirectUrl

        } catch (err: unknown) {
            console.error('Login Error:', err)
            const message = err instanceof Error ? err.message : 'Đã có lỗi xảy ra'
            setError(message)
            toast.error(message)
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
            <Toaster position="top-center" />
            {/* Navigation */}
            <nav className="bg-white/80 backdrop-blur-sm border-b border-gray-100">
                <div className="max-w-7xl mx-auto px-6 py-4">
                    <div className="flex items-center justify-between">
                        <Link href="/contractor" className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                                <Building2 className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <span className="text-xl font-bold text-gray-900">SmartBuild</span>
                                <span className="text-blue-600 font-semibold ml-1">PRO</span>
                            </div>
                        </Link>
                        <button
                            onClick={handleGoBack}
                            className="flex items-center gap-2 text-gray-600 hover:text-blue-600 transition-colors font-medium"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            Quay lại
                        </button>
                    </div>
                </div>
            </nav>

            {/* Main Content */}
            <div className="flex items-center justify-center px-6 py-16">
                <div className="w-full max-w-md">
                    {/* Header */}
                    <div className="text-center mb-8">
                        <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
                            <Building2 className="w-8 h-8 text-white" />
                        </div>
                        <h1 className="text-3xl font-bold text-gray-900 mb-2">Đăng nhập Đối tác</h1>
                        <p className="text-gray-600">Truy cập portal dành riêng cho Nhà thầu</p>
                    </div>

                    {/* Form Card */}
                    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Email
                                </label>
                                <div className="relative">
                                    <div className="absolute left-3 top-1/2 -translate-y-1/2">
                                        <Mail className="w-5 h-5 text-gray-400" />
                                    </div>
                                    <input
                                        type="email"
                                        name="email"
                                        value={formData.email}
                                        onChange={handleInputChange}
                                        placeholder="email@company.com"
                                        className="w-full bg-gray-50 border border-gray-200 rounded-lg pl-11 pr-4 py-3 text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                        required
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Mật khẩu
                                </label>
                                <div className="relative">
                                    <div className="absolute left-3 top-1/2 -translate-y-1/2">
                                        <Lock className="w-5 h-5 text-gray-400" />
                                    </div>
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        name="password"
                                        value={formData.password}
                                        onChange={handleInputChange}
                                        placeholder="Nhập mật khẩu"
                                        className="w-full bg-gray-50 border border-gray-200 rounded-lg pl-11 pr-12 py-3 text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                        required
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                                    >
                                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                    </button>
                                </div>
                            </div>

                            <div className="flex items-center justify-between text-sm">
                                <label className="flex items-center gap-2 text-gray-600">
                                    <input
                                        type="checkbox"
                                        className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                    />
                                    Ghi nhớ đăng nhập
                                </label>
                                <Link href="#" className="text-blue-600 hover:underline font-medium">
                                    Quên mật khẩu?
                                </Link>
                            </div>

                            {/* Error Message */}
                            {error && (
                                <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3 text-red-600">
                                    <AlertCircle className="w-5 h-5 flex-shrink-0" />
                                    <span className="text-sm">{error}</span>
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white py-3 rounded-lg font-semibold transition-all flex items-center justify-center gap-2 shadow-md hover:shadow-lg"
                            >
                                {loading ? (
                                    <>
                                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
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
                    <p className="text-center mt-6 text-gray-600">
                        Chưa có tài khoản?{' '}
                        <Link href="/contractor/register" className="text-blue-600 hover:underline font-semibold">
                            Đăng ký ngay
                        </Link>
                    </p>

                    {/* Back to User Login */}
                    <p className="text-center mt-4 text-gray-500 text-sm">
                        Bạn là khách hàng lẻ?{' '}
                        <Link href="/login" className="text-gray-600 hover:text-blue-600 transition-colors">
                            Đăng nhập khách hàng
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    )
}
