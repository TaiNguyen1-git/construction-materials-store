'use client'

import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import {
    X, Mail, Lock, Eye, EyeOff, User, Phone, ShieldCheck,
    ArrowRight, Loader2, Building2, UserCircle, Sparkles, CheckCircle2
} from 'lucide-react'
import { toast } from 'react-hot-toast'
import { useAuth } from '@/contexts/auth-context'
import { useGoogleLogin } from '@react-oauth/google'
import { useFacebookSDK, loginWithFacebook } from '@/lib/facebook-sdk'

interface EstimatorAuthModalProps {
    isOpen: boolean
    onClose: () => void
    onAuthSuccess: () => void
}

type ModalView = 'login' | 'register' | 'otp'
type UserRoleChoice = 'CUSTOMER' | 'CONTRACTOR'

export default function EstimatorAuthModal({ isOpen, onClose, onAuthSuccess }: EstimatorAuthModalProps) {
    const { login, verifyOTP, resendOTP, refreshUser } = useAuth()
    const [mounted, setMounted] = useState(false)
    const [view, setView] = useState<ModalView>('login')
    const [showPassword, setShowPassword] = useState(false)
    const [loading, setLoading] = useState(false)
    const [googleLoading, setGoogleLoading] = useState(false)
    const [fbLoading, setFbLoading] = useState(false)
    const [roleChoice, setRoleChoice] = useState<UserRoleChoice>('CUSTOMER')

    // Login form
    const [loginEmail, setLoginEmail] = useState('')
    const [loginPassword, setLoginPassword] = useState('')

    // Register form
    const [regName, setRegName] = useState('')
    const [regEmail, setRegEmail] = useState('')
    const [regPhone, setRegPhone] = useState('')
    const [regPassword, setRegPassword] = useState('')

    // OTP
    const [otpValue, setOtpValue] = useState('')
    const [otpToken, setOtpToken] = useState('')
    const [otpEmail, setOtpEmail] = useState('')
    const [isResending, setIsResending] = useState(false)

    const [error, setError] = useState('')

    // Initialize Facebook SDK
    useFacebookSDK()

    useEffect(() => { setMounted(true) }, [])

    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden'
        } else {
            document.body.style.overflow = ''
            // Reset state on close
            setView('login')
            setError('')
            setOtpValue('')
        }
        return () => { document.body.style.overflow = '' }
    }, [isOpen])

    // ========== SUCCESS HANDLER ==========
    const handleSuccess = async (user: any, skipRedirect = true) => {
        // Set auth hints for EnhancedAuthService
        localStorage.setItem('auth_active', 'true')
        localStorage.setItem('user_hint', JSON.stringify({
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role
        }))

        // Refresh AuthContext so isAuthenticated flips to true
        await refreshUser()

        toast.success('Đăng nhập thành công! Bạn có thể lưu dự án ngay.')
        onAuthSuccess()
        onClose()
    }

    // ========== EMAIL LOGIN ==========
    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')
        setLoading(true)

        try {
            const response = await login({ email: loginEmail, password: loginPassword }) as any

            if (response?.verificationRequired || response?.twoFactorRequired) {
                // Need OTP verification
                setOtpToken(response.verificationToken)
                setOtpEmail(response.email || loginEmail)
                setView('otp')
                setLoading(false)
                return
            }

            if (response?.user) {
                await handleSuccess(response.user)
            }
        } catch (err: any) {
            let msg = err.message || 'Đăng nhập thất bại'
            if (err.status === 429) {
                const retryAfterTimestamp = err.retryAfter || (Date.now() / 1000 + 900)
                const currentTimestamp = Math.floor(Date.now() / 1000)
                const minutesRemaining = Math.max(1, Math.ceil((retryAfterTimestamp - currentTimestamp) / 60))
                msg = `Bạn đã thử quá nhiều lần. Vui lòng thử lại sau ${minutesRemaining} phút.`
            }
            setError(msg)
        } finally {
            setLoading(false)
        }
    }

    // ========== EMAIL REGISTER ==========
    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')

        if (regPassword.length < 6) {
            setError('Mật khẩu cần ít nhất 6 ký tự')
            return
        }

        setLoading(true)
        try {
            const res = await fetch('/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    fullName: regName,
                    email: regEmail,
                    phone: regPhone,
                    password: regPassword,
                    role: roleChoice,
                })
            })

            const data = await res.json()

            if (!res.ok) {
                throw new Error(data.error || data.details?.map((d: any) => d.message).join(', ') || 'Đăng ký thất bại')
            }

            if (data.verificationRequired) {
                setOtpToken(data.verificationToken)
                setOtpEmail(data.email || regEmail)
                setView('otp')
                toast.success('Mã xác thực đã được gửi đến email của bạn!')
            }
        } catch (err: any) {
            setError(err.message || 'Đăng ký thất bại')
        } finally {
            setLoading(false)
        }
    }

    // ========== OTP VERIFY ==========
    const handleOTPVerify = async (e: React.FormEvent) => {
        e.preventDefault()
        if (otpValue.length !== 6) return

        setLoading(true)
        setError('')
        try {
            const response = await verifyOTP(otpValue, otpToken) as any
            if (response?.user) {
                await handleSuccess(response.user)
            } else {
                // Fallback: refresh and close
                await refreshUser()
                toast.success('Xác thực thành công!')
                onAuthSuccess()
                onClose()
            }
        } catch (err: any) {
            setError(err.message || 'Mã OTP không hợp lệ')
        } finally {
            setLoading(false)
        }
    }

    const handleResendOTP = async () => {
        if (!otpToken || isResending) return
        setIsResending(true)
        try {
            await resendOTP(otpToken)
            toast.success('Đã gửi lại mã xác thực!')
        } catch {
            toast.error('Không thể gửi lại mã')
        } finally {
            setIsResending(false)
        }
    }

    // ========== GOOGLE LOGIN ==========
    const handleGoogleLogin = useGoogleLogin({
        onSuccess: async (tokenResponse) => {
            try {
                setGoogleLoading(true)
                const res = await fetch('/api/auth/google', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ access_token: tokenResponse.access_token }),
                })
                const data = await res.json()
                if (data.success && data.user) {
                    await handleSuccess(data.user)
                } else {
                    throw new Error(data.error || 'Đăng nhập Google thất bại')
                }
            } catch (err: any) {
                setError(err.message || 'Đăng nhập Google lỗi')
            } finally {
                setGoogleLoading(false)
            }
        },
        onError: () => {
            setError('Đăng nhập Google thất bại')
        }
    })

    // ========== FACEBOOK LOGIN ==========
    const handleFacebookLogin = async () => {
        try {
            setFbLoading(true)
            const authResponse = await loginWithFacebook()
            const res = await fetch('/api/auth/facebook', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ accessToken: authResponse.accessToken }),
            })
            const data = await res.json()
            if (data.success && data.user) {
                await handleSuccess(data.user)
            } else {
                throw new Error(data.error || 'Đăng nhập Facebook thất bại')
            }
        } catch (err: any) {
            if (!err.message?.includes('cancelled')) {
                setError(err.message || 'Đăng nhập Facebook lỗi')
            }
        } finally {
            setFbLoading(false)
        }
    }

    if (!isOpen || !mounted) return null

    const socialLoading = googleLoading || fbLoading

    // ========== RENDER ==========
    const modalContent = (
        <div className="fixed inset-0 flex items-center justify-center z-[9999] p-4 animate-in fade-in duration-300">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

            {/* Modal */}
            <div
                className="bg-white rounded-[2rem] max-w-lg w-full overflow-hidden shadow-2xl relative z-10 animate-in zoom-in-95 slide-in-from-bottom-4 duration-300 max-h-[90vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Close */}
                <button onClick={onClose} className="absolute right-4 top-4 p-2 hover:bg-gray-100 rounded-full transition-colors z-20">
                    <X size={20} className="text-gray-400" />
                </button>

                {/* ===== OTP View ===== */}
                {view === 'otp' && (
                    <div className="p-8">
                        <div className="text-center mb-8">
                            <div className="w-16 h-16 bg-indigo-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                <ShieldCheck className="w-8 h-8 text-indigo-600" />
                            </div>
                            <h2 className="text-2xl font-black text-gray-900 mb-2">Xác thực Email</h2>
                            <p className="text-sm text-gray-500">
                                Nhập mã 6 số đã gửi đến <span className="font-bold text-gray-900">{otpEmail}</span>
                            </p>
                        </div>

                        {error && (
                            <div className="bg-red-50 border border-red-100 rounded-xl p-3 mb-4 text-sm text-red-600 font-medium">
                                {error}
                            </div>
                        )}

                        <form onSubmit={handleOTPVerify} className="space-y-6">
                            <input
                                type="text"
                                maxLength={6}
                                value={otpValue}
                                onChange={(e) => setOtpValue(e.target.value.replace(/\D/g, ''))}
                                className="block w-full text-center text-3xl tracking-[1rem] font-bold py-4 bg-gray-50 border-2 border-gray-100 rounded-2xl focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all outline-none"
                                placeholder="000000"
                                autoFocus
                            />
                            <button
                                type="submit"
                                disabled={loading || otpValue.length !== 6}
                                className="w-full py-4 rounded-2xl text-white bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 font-bold text-sm transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle2 className="w-5 h-5" />}
                                {loading ? 'Đang xác thực...' : 'Xác nhận mã OTP'}
                            </button>
                        </form>

                        <div className="text-center mt-6 space-y-3">
                            <p className="text-sm text-gray-500">
                                Không nhận được mã?{' '}
                                <button onClick={handleResendOTP} disabled={isResending} className="font-bold text-indigo-600 hover:text-indigo-700 disabled:opacity-50">
                                    {isResending ? 'Đang gửi...' : 'Gửi lại'}
                                </button>
                            </p>
                            <button onClick={() => { setView('login'); setError('') }} className="text-xs text-gray-400 hover:text-gray-600 font-medium">
                                ← Quay lại đăng nhập
                            </button>
                        </div>
                    </div>
                )}

                {/* ===== Login / Register Views ===== */}
                {view !== 'otp' && (
                    <>
                        {/* Header with gradient */}
                        <div className="bg-gradient-to-br from-indigo-600 via-blue-600 to-purple-700 p-8 text-center relative overflow-hidden">
                            <div className="absolute top-0 left-0 w-full h-full opacity-10 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-white via-transparent to-transparent" />
                            <div className="relative z-10">
                                <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center mx-auto mb-4 border border-white/20">
                                    <Sparkles className="w-7 h-7 text-white" />
                                </div>
                                <h2 className="text-xl font-black text-white mb-1">
                                    {view === 'login' ? 'Đăng nhập để lưu kết quả' : 'Tạo tài khoản miễn phí'}
                                </h2>
                                <p className="text-indigo-100 text-xs">
                                    Lưu dự toán AI, nhận ưu đãi 5% và theo dõi dự án
                                </p>
                            </div>
                        </div>

                        <div className="p-6 sm:p-8">
                            {/* Social Login Buttons */}
                            <div className="grid grid-cols-2 gap-3 mb-6">
                                <button
                                    type="button"
                                    onClick={() => handleGoogleLogin()}
                                    disabled={loading || socialLoading}
                                    className="flex items-center justify-center gap-2.5 py-3.5 px-4 border border-gray-100 rounded-2xl bg-gray-50 hover:bg-white hover:border-blue-200 hover:shadow-md transition-all disabled:opacity-50"
                                >
                                    {googleLoading ? (
                                        <div className="w-5 h-5 border-2 border-gray-200 border-t-gray-600 rounded-full animate-spin" />
                                    ) : (
                                        <svg className="w-5 h-5" viewBox="0 0 24 24">
                                            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                                            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                                        </svg>
                                    )}
                                    <span className="text-[10px] font-black uppercase tracking-widest text-gray-700">Google</span>
                                </button>

                                <button
                                    type="button"
                                    onClick={handleFacebookLogin}
                                    disabled={loading || socialLoading}
                                    className="flex items-center justify-center gap-2.5 py-3.5 px-4 border border-gray-100 rounded-2xl bg-gray-50 hover:bg-white hover:border-blue-200 hover:shadow-md transition-all disabled:opacity-50"
                                >
                                    {fbLoading ? (
                                        <div className="w-5 h-5 border-2 border-gray-200 border-t-[#1877F2] rounded-full animate-spin" />
                                    ) : (
                                        <svg className="w-5 h-5" fill="#1877F2" viewBox="0 0 24 24">
                                            <path fillRule="evenodd" d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" clipRule="evenodd" />
                                        </svg>
                                    )}
                                    <span className="text-[10px] font-black uppercase tracking-widest text-[#1877F2]">Facebook</span>
                                </button>
                            </div>

                            {/* Divider */}
                            <div className="relative mb-6">
                                <div className="absolute inset-0 flex items-center">
                                    <div className="w-full border-t border-gray-100" />
                                </div>
                                <div className="relative flex justify-center">
                                    <span className="px-4 bg-white text-[10px] font-bold text-gray-400 uppercase tracking-widest">Hoặc dùng email</span>
                                </div>
                            </div>

                            {error && (
                                <div className="bg-red-50 border border-red-100 rounded-xl p-3 mb-4 text-sm text-red-600 font-medium flex items-center gap-2">
                                    <span className="w-5 h-5 bg-red-100 rounded-full flex items-center justify-center text-[10px] font-black shrink-0">!</span>
                                    {error}
                                </div>
                            )}

                            {/* ===== LOGIN FORM ===== */}
                            {view === 'login' && (
                                <form onSubmit={handleLogin} className="space-y-4">
                                    <div>
                                        <label className="block text-xs font-bold text-gray-600 mb-1.5 ml-1">Email</label>
                                        <div className="relative">
                                            <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                            <input
                                                type="email"
                                                value={loginEmail}
                                                onChange={(e) => setLoginEmail(e.target.value)}
                                                placeholder="ten@email.com"
                                                className="w-full pl-11 pr-4 py-3.5 bg-gray-50 border border-gray-100 rounded-xl text-sm font-medium focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 outline-none transition-all"
                                                required
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-gray-600 mb-1.5 ml-1">Mật khẩu</label>
                                        <div className="relative">
                                            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                            <input
                                                type={showPassword ? 'text' : 'password'}
                                                value={loginPassword}
                                                onChange={(e) => setLoginPassword(e.target.value)}
                                                placeholder="••••••••"
                                                className="w-full pl-11 pr-11 py-3.5 bg-gray-50 border border-gray-100 rounded-xl text-sm font-medium focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 outline-none transition-all"
                                                required
                                            />
                                            <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                                                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                            </button>
                                        </div>
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="w-full py-4 rounded-2xl text-white bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 font-bold text-sm transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-indigo-100"
                                    >
                                        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <ArrowRight className="w-5 h-5" />}
                                        {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
                                    </button>

                                    <p className="text-center text-sm text-gray-500 pt-2">
                                        Chưa có tài khoản?{' '}
                                        <button type="button" onClick={() => { setView('register'); setError('') }} className="text-indigo-600 font-bold hover:underline">
                                            Tạo ngay
                                        </button>
                                    </p>
                                </form>
                            )}

                            {/* ===== REGISTER FORM ===== */}
                            {view === 'register' && (
                                <form onSubmit={handleRegister} className="space-y-4">
                                    {/* Role Choice */}
                                    <div>
                                        <label className="block text-xs font-bold text-gray-600 mb-2 ml-1">Bạn là</label>
                                        <div className="grid grid-cols-2 gap-2">
                                            <button
                                                type="button"
                                                onClick={() => setRoleChoice('CUSTOMER')}
                                                className={`flex items-center gap-2.5 p-3.5 rounded-xl border-2 transition-all ${roleChoice === 'CUSTOMER'
                                                    ? 'border-indigo-500 bg-indigo-50 shadow-md shadow-indigo-100/50'
                                                    : 'border-gray-100 hover:border-gray-200 bg-gray-50'
                                                    }`}
                                            >
                                                <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${roleChoice === 'CUSTOMER' ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-500'}`}>
                                                    <UserCircle className="w-5 h-5" />
                                                </div>
                                                <div className="text-left">
                                                    <p className={`text-xs font-black ${roleChoice === 'CUSTOMER' ? 'text-indigo-700' : 'text-gray-600'}`}>Chủ nhà</p>
                                                    <p className="text-[10px] text-gray-400">Cá nhân</p>
                                                </div>
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setRoleChoice('CONTRACTOR')}
                                                className={`flex items-center gap-2.5 p-3.5 rounded-xl border-2 transition-all ${roleChoice === 'CONTRACTOR'
                                                    ? 'border-blue-500 bg-blue-50 shadow-md shadow-blue-100/50'
                                                    : 'border-gray-100 hover:border-gray-200 bg-gray-50'
                                                    }`}
                                            >
                                                <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${roleChoice === 'CONTRACTOR' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-500'}`}>
                                                    <Building2 className="w-5 h-5" />
                                                </div>
                                                <div className="text-left">
                                                    <p className={`text-xs font-black ${roleChoice === 'CONTRACTOR' ? 'text-blue-700' : 'text-gray-600'}`}>Thợ thầu</p>
                                                    <p className="text-[10px] text-gray-400">Chuyên gia</p>
                                                </div>
                                            </button>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-gray-600 mb-1.5 ml-1">Họ và tên</label>
                                        <div className="relative">
                                            <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                            <input
                                                type="text"
                                                value={regName}
                                                onChange={(e) => setRegName(e.target.value)}
                                                placeholder="Nguyễn Văn A"
                                                className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm font-medium focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 outline-none transition-all"
                                                required
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="block text-xs font-bold text-gray-600 mb-1.5 ml-1">Email</label>
                                            <div className="relative">
                                                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                                <input
                                                    type="email"
                                                    value={regEmail}
                                                    onChange={(e) => setRegEmail(e.target.value)}
                                                    placeholder="email@mail.com"
                                                    className="w-full pl-11 pr-3 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm font-medium focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 outline-none transition-all"
                                                    required
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-gray-600 mb-1.5 ml-1">Số điện thoại</label>
                                            <div className="relative">
                                                <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                                <input
                                                    type="tel"
                                                    value={regPhone}
                                                    onChange={(e) => setRegPhone(e.target.value)}
                                                    placeholder="0901234567"
                                                    className="w-full pl-11 pr-3 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm font-medium focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 outline-none transition-all"
                                                    required
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-gray-600 mb-1.5 ml-1">Mật khẩu</label>
                                        <div className="relative">
                                            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                            <input
                                                type={showPassword ? 'text' : 'password'}
                                                value={regPassword}
                                                onChange={(e) => setRegPassword(e.target.value)}
                                                placeholder="Tối thiểu 6 ký tự"
                                                className="w-full pl-11 pr-11 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm font-medium focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 outline-none transition-all"
                                                required
                                                minLength={6}
                                            />
                                            <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                                                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                            </button>
                                        </div>
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="w-full py-4 rounded-2xl text-white bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 font-bold text-sm transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-indigo-100"
                                    >
                                        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <ArrowRight className="w-5 h-5" />}
                                        {loading ? 'Đang đăng ký...' : 'Tạo tài khoản'}
                                    </button>

                                    <p className="text-center text-sm text-gray-500 pt-2">
                                        Đã có tài khoản?{' '}
                                        <button type="button" onClick={() => { setView('login'); setError('') }} className="text-indigo-600 font-bold hover:underline">
                                            Đăng nhập
                                        </button>
                                    </p>
                                </form>
                            )}
                        </div>
                    </>
                )}
            </div>
        </div>
    )

    return createPortal(modalContent, document.body)
}
