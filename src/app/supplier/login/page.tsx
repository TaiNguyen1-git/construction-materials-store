'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
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
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 relative overflow-hidden">
            {/* Ambient Background Glows */}
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-400/10 rounded-full blur-[120px] animate-pulse" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-400/10 rounded-full blur-[120px] animate-pulse" />

            <div className="relative w-full max-w-lg">
                {/* Back Button */}
                <button
                    onClick={handleGoBack}
                    className="group absolute -top-16 left-0 flex items-center gap-3 text-slate-400 hover:text-blue-600 transition-all font-bold uppercase tracking-widest text-[10px]"
                >
                    <div className="w-8 h-8 rounded-full border border-slate-200 flex items-center justify-center group-hover:border-blue-200 group-hover:bg-blue-50 transition-all">
                        <ArrowLeft className="w-4 h-4" />
                    </div>
                    Quay lại trang chủ
                </button>

                {/* Login Card */}
                <div className="bg-white/80 backdrop-blur-2xl rounded-[3rem] shadow-2xl shadow-slate-200/50 border border-white p-10 lg:p-14">
                    {/* Header */}
                    <div className="text-center mb-12">
                        <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-[2rem] shadow-xl shadow-blue-200 mb-8 rotate-3 hover:rotate-0 transition-transform duration-500">
                            <Building2 className="w-10 h-10 text-white" />
                        </div>
                        <h1 className="text-3xl font-black text-slate-900 tracking-tight">Cổng Nhà Cung Cấp</h1>
                        <p className="text-slate-400 font-medium mt-3 uppercase tracking-widest text-[10px]">SmartBuild Premium NCC</p>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="space-y-8">
                        <div className="space-y-6">
                            <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-1">
                                    Địa chỉ Email
                                </label>
                                <div className="relative group">
                                    <div className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-blue-600 transition-colors">
                                        <Mail className="w-full h-full" />
                                    </div>
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                        className="w-full pl-16 pr-6 py-5 bg-slate-50 border border-slate-200 rounded-2xl focus:bg-white focus:ring-4 focus:ring-blue-500/10 focus:border-blue-600 outline-none transition-all font-bold text-slate-900 placeholder:text-slate-300"
                                        placeholder="ncc@example.com"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-1">
                                    Mật khẩu truy cập
                                </label>
                                <div className="relative group">
                                    <div className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-blue-600 transition-colors">
                                        <Lock className="w-full h-full" />
                                    </div>
                                    <input
                                        type="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                        className="w-full pl-16 pr-6 py-5 bg-slate-50 border border-slate-200 rounded-2xl focus:bg-white focus:ring-4 focus:ring-blue-500/10 focus:border-blue-600 outline-none transition-all font-bold text-slate-900 placeholder:text-slate-300"
                                        placeholder="••••••••"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="pt-4">
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full py-5 bg-blue-600 text-white font-black uppercase tracking-widest text-xs rounded-2xl hover:bg-blue-700 transition-all shadow-xl shadow-blue-200 active:scale-95 disabled:opacity-50 disabled:active:scale-100"
                            >
                                {loading ? (
                                    <div className="flex items-center justify-center gap-3">
                                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        <span>Đang xác thực...</span>
                                    </div>
                                ) : (
                                    'Xác nhận đăng nhập'
                                )}
                            </button>
                        </div>

                        <div className="text-center">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter mb-4">
                                Bảo mật bởi hệ thống SmartBuild Authentication
                            </p>

                            <p className="text-sm font-medium text-slate-500">
                                Chưa có tài khoản đối tác?{' '}
                                <Link href="/supplier/register" className="text-blue-600 font-bold hover:underline underline-offset-4 decoration-2">
                                    Đăng ký cung ứng ngay
                                </Link>
                            </p>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    )
}
