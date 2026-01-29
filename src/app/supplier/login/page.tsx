'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Building2, Lock, Mail, ArrowLeft } from 'lucide-react'
import toast from 'react-hot-toast'

export default function SupplierLoginPage() {
    const router = useRouter()
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [loading, setLoading] = useState(false)

    // Handle "Go Back" button - clear stale auth and use replace() to avoid history loop
    const handleGoBack = () => {
        // Check if we came from a protected route (has callbackUrl in URL)
        const urlParams = new URLSearchParams(window.location.search)
        const callbackUrl = urlParams.get('callbackUrl')

        if (callbackUrl) {
            // Clear potentially stale auth data to break the redirect loop
            localStorage.removeItem('supplier_token')
            localStorage.removeItem('supplier_id')
            localStorage.removeItem('supplier_name')
            localStorage.removeItem('access_token')
            localStorage.removeItem('user')
            sessionStorage.removeItem('access_token')
            sessionStorage.removeItem('user')

            // Also clear the auth cookie
            document.cookie = 'auth_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT'

        }

        // Use replace() instead of href to prevent back button from returning to login loop
        window.location.replace('/')
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        try {
            const res = await fetch('/api/supplier/auth', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            })

            const data = await res.json()

            if (data.success) {
                // Store supplier info
                localStorage.setItem('supplier_token', data.data.token)
                localStorage.setItem('supplier_id', data.data.supplier.id)
                localStorage.setItem('supplier_name', data.data.supplier.name)

                // Set cookie for middleware
                document.cookie = `auth_token=${data.data.token}; path=/; max-age=604800; SameSite=Lax`

                toast.success('Đăng nhập thành công!')

                // Check for callbackUrl in URL params
                const urlParams = new URLSearchParams(window.location.search)
                const callbackUrl = urlParams.get('callbackUrl')

                // Validate callbackUrl is a supplier path
                if (callbackUrl && callbackUrl.startsWith('/supplier')) {
                    router.push(callbackUrl)
                } else {
                    router.push('/supplier/dashboard')
                }
            } else {
                toast.error(data.error?.message || 'Đăng nhập thất bại')
            }
        } catch (error) {
            toast.error('Lỗi kết nối server')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-8">
                {/* Back Button */}
                <button
                    onClick={handleGoBack}
                    className="flex items-center gap-2 text-gray-600 hover:text-blue-600 transition-colors font-medium mb-6"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Quay lại trang chủ
                </button>

                {/* Logo */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-2xl mb-4">
                        <Building2 className="w-8 h-8 text-white" />
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900">Cổng Nhà Cung Cấp</h1>
                    <p className="text-gray-500 mt-2">Đăng nhập để quản lý đơn hàng</p>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Email
                        </label>
                        <div className="relative">
                            <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder="ncc@example.com"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Mật khẩu
                        </label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder="••••••••"
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
                    </button>
                </form>


            </div>
        </div>
    )
}
