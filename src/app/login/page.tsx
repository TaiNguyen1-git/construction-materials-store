'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Eye, EyeOff, Mail, Lock, ArrowLeft, ShieldCheck, CheckCircle2, Building2, Globe, Shield } from 'lucide-react'
import { useAuth } from '@/contexts/auth-context'
import { useGoogleLogin } from '@react-oauth/google'
import { toast } from 'react-hot-toast'
import { useFacebookSDK, loginWithFacebook } from '@/lib/facebook-sdk'
import { performPostLoginRedirect } from '@/lib/auth-redirect'

export default function LoginPage() {
  const router = useRouter()
  const { login, isLoading, error } = useAuth()
  const [googleLoading, setGoogleLoading] = useState(false)
  const [fbLoading, setFbLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  // Initialize Facebook SDK
  useFacebookSDK()

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
        if (data.success) {
          toast.success('Đăng nhập Google thành công!')
          performPostLoginRedirect(data.user)
        } else {
          throw new Error(data.error || 'Đăng nhập Google thất bại')
        }
      } catch (err: any) {
        console.error('[GOOGLE LOGIN] Error:', err)
        toast.error(err.message || 'Có lỗi xảy ra khi đăng nhập bằng Google')
      } finally {
        setGoogleLoading(false)
      }
    },
    onError: (error) => {
      console.error('[GOOGLE LOGIN] Failed:', error)
      toast.error('Đăng nhập Google thất bại')
    }
  })

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
      if (data.success) {
        toast.success('Đăng nhập Facebook thành công!')
        performPostLoginRedirect(data.user)
      } else {
        throw new Error(data.error || 'Đăng nhập Facebook thất bại')
      }
    } catch (err: any) {
      console.error('[FB LOGIN] Error:', err)
      if (!err.message.includes('cancelled')) {
        toast.error(err.message || 'Có lỗi xảy ra khi đăng nhập bằng Facebook')
      }
    } finally {
      setFbLoading(false)
    }
  }

  const handleGoHome = () => {
    const urlParams = new URLSearchParams(window.location.search)
    const callbackUrl = urlParams.get('callbackUrl')
    if (callbackUrl) {
      localStorage.removeItem('access_token')
      localStorage.removeItem('user')
      sessionStorage.removeItem('access_token')
      sessionStorage.removeItem('user')
      document.cookie = 'auth_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT'
    }
    window.location.replace('/')
  }

  const [formData, setFormData] = useState({ email: '', password: '' })
  const [rememberMe, setRememberMe] = useState(true)
  const [localErrors, setLocalErrors] = useState<Record<string, string>>({})
  const [twoFactorData, setTwoFactorData] = useState<{
    required: boolean
    email: string
    token: string
    type?: 'verification' | '2fa'
  } | null>(null)
  const [otpValue, setOtpValue] = useState('')
  const [isResending, setIsResending] = useState(false)
  const [resendSuccess, setResendSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLocalErrors({})
    try {
      const response = await login({
        email: formData.email,
        password: formData.password
      }) as any

      if (response?.twoFactorRequired || response?.verificationRequired) {
        setTwoFactorData({
          required: true,
          email: response.email,
          token: response.verificationToken,
          type: response.verificationRequired ? 'verification' : '2fa'
        })
        return
      }

      if (response?.user) {
        performPostLoginRedirect(response.user)
      } else {
        // Fallback or retry auth initialization
        window.location.href = '/'
      }
    } catch (error: any) {
      setLocalErrors({ general: error.message || 'Đăng nhập thất bại' })
    }
  }

  const { verifyOTP, resendOTP } = useAuth()

  const handleVerify2FA = async (e: React.FormEvent) => {
    e.preventDefault()
    if (otpValue.length !== 6) return
    try {
      if (!twoFactorData?.token) return
      const response = await verifyOTP(otpValue, twoFactorData.token) as any
      if (response?.user) {
        performPostLoginRedirect(response.user)
      } else {
        window.location.href = '/'
      }
    } catch (err: any) {
      setLocalErrors({ otp: err.message || 'Xác thực 2FA thất bại' })
    }
  }

  const handleResendOtp = async () => {
    if (!twoFactorData?.token || isResending) return
    setIsResending(true)
    try {
      await resendOTP(twoFactorData.token)
      setResendSuccess(true)
      setTimeout(() => setResendSuccess(false), 3000)
    } finally {
      setIsResending(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
    if (localErrors[e.target.name]) {
      setLocalErrors({ ...localErrors, [e.target.name]: '' })
    }
  }

  return (
    <div className="min-h-screen flex bg-white font-sans selection:bg-primary-100 selection:text-primary-900">
      {/* Left: Branding & Visuals (Desktop Only) */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-neutral-900">
        <div className="absolute inset-0 z-0 scale-105 animate-slow-zoom">
          <img
            src="https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=2070&auto=format&fit=crop"
            alt="Modern Construction"
            className="w-full h-full object-cover opacity-60"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-neutral-900 via-neutral-900/40 to-transparent" />
        </div>

        <div className="relative z-10 w-full flex flex-col justify-between p-12 text-white">
          <div className="flex items-center gap-3 animate-fade-in">
            <div className="bg-blue-500 p-3 rounded-[20px] shadow-2xl shadow-blue-500/50">
              <Building2 className="h-7 w-7 text-white" />
            </div>
            <span className="text-3xl font-black tracking-tighter uppercase italic">SmartBuild</span>
          </div>

          <div className="max-w-lg space-y-8 animate-fade-in-up">
            <h2 className="text-5xl font-bold leading-tight">
              Kiến tạo <span className="text-primary-400">tương lai</span> công trình của bạn.
            </h2>
            <p className="text-lg text-neutral-300 font-medium">
              Nền tảng quản lý vật liệu và thi công thông minh, giúp tối ưu hóa chi phí và đảm bảo chất lượng cho mọi dự án.
            </p>

            <div className="grid grid-cols-2 gap-6 pt-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-primary-500/20 flex items-center justify-center border border-primary-500/30">
                  <CheckCircle2 className="h-5 w-5 text-primary-400" />
                </div>
                <span className="text-sm font-semibold">Tín nhiệm cao</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-secondary-500/20 flex items-center justify-center border border-secondary-500/30">
                  <Globe className="h-5 w-5 text-secondary-400" />
                </div>
                <span className="text-sm font-semibold">Quy mô toàn quốc</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-accent-500/20 flex items-center justify-center border border-accent-500/30">
                  <Shield className="h-5 w-5 text-accent-400" />
                </div>
                <span className="text-sm font-semibold">Bảo mật tuyệt đối</span>
              </div>
            </div>
          </div>

          <p className="text-sm text-neutral-400 animate-fade-in">
            © 2026 SmartBuild ERP. All rights reserved.
          </p>
        </div>
      </div>

      {/* Right: Login Form */}
      <div className="flex-1 flex flex-col">
        {/* Mobile Header */}
        <div className="flex lg:hidden items-center justify-between p-4 border-b border-neutral-100">
          <div className="flex items-center gap-2">
            <Building2 className="h-6 w-6 text-primary-600" />
            <span className="text-xl font-black tracking-tighter text-neutral-900">SmartBuild</span>
          </div>
          <button onClick={handleGoHome} className="p-2 hover:bg-neutral-100 rounded-full transition-colors">
            <ArrowLeft className="h-5 w-5 text-neutral-600" />
          </button>
        </div>

        <div className="flex-1 flex flex-col justify-center px-6 sm:px-12 lg:px-20 py-12">
          <div className="w-full max-w-md mx-auto">
            {/* Desktop Back Button */}
            <button
              onClick={handleGoHome}
              className="hidden lg:flex items-center text-neutral-500 hover:text-primary-600 font-medium transition-all mb-12 group"
            >
              <ArrowLeft className="h-4 w-4 mr-2 group-hover:-translate-x-1 transition-transform" />
              Về trang chủ
            </button>

            <div className="mb-10">
              <div className="w-12 h-1.5 bg-blue-600 rounded-full mb-6"></div>
              <h1 className="text-4xl font-black text-slate-900 mb-3 tracking-tighter uppercase">Đăng nhập tài khoản</h1>
              <p className="text-slate-500 font-medium text-sm">Kiến tạo công trình thông minh cùng SmartBuild.</p>
            </div>

            {twoFactorData?.required ? (
              <div className="animate-slide-in space-y-6">
                <div className="bg-primary-50 p-6 rounded-2xl border border-primary-100 text-center">
                  <div className="mx-auto flex items-center justify-center h-14 w-14 rounded-full bg-white shadow-sm mb-4">
                    <ShieldCheck className="h-7 w-7 text-primary-600" />
                  </div>
                  <h3 className="text-xl font-bold text-neutral-900">
                    {twoFactorData.type === 'verification' ? 'Xác thực Email' : 'Xác thực 2 lớp'}
                  </h3>
                  <p className="mt-2 text-sm text-neutral-600">
                    {twoFactorData.type === 'verification'
                      ? 'Vui lòng nhập mã xác thực gửi đến:'
                      : 'Mã xác thực đã được gửi đến email:'}
                    <br />
                    <span className="font-bold text-neutral-900">{twoFactorData.email}</span>
                  </p>
                </div>

                <form onSubmit={handleVerify2FA} className="space-y-6">
                  <div>
                    <input
                      type="text"
                      maxLength={6}
                      value={otpValue}
                      onChange={(e) => setOtpValue(e.target.value.replace(/\D/g, ''))}
                      className="block w-full text-center text-3xl tracking-[1rem] font-bold py-4 bg-neutral-50 border-2 border-neutral-100 rounded-2xl focus:bg-white focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 transition-all"
                      placeholder="000000"
                      required
                      autoFocus
                    />
                    {localErrors.otp && (
                      <p className="mt-2 text-sm text-red-600 text-center font-medium">{localErrors.otp}</p>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading || otpValue.length !== 6}
                    className="w-full py-4 px-4 rounded-2xl shadow-xl text-base font-bold text-white bg-gradient-to-r from-primary-600 to-primary-500 hover:shadow-primary-500/25 transition-all transform hover:scale-[1.02] disabled:opacity-50"
                  >
                    {isLoading ? 'Đang xác thực...' : 'Xác nhận mã OTP'}
                  </button>
                </form>

                <div className="text-center space-y-4 pt-2">
                  <p className="text-sm text-neutral-500">
                    Không nhận được mã?{' '}
                    <button
                      onClick={handleResendOtp}
                      disabled={isResending}
                      className="font-bold text-primary-600 hover:text-primary-700 disabled:opacity-50"
                    >
                      {isResending ? 'Đang gửi...' : 'Gửi lại mã'}
                    </button>
                  </p>
                  {resendSuccess && (
                    <p className="text-xs text-green-600 font-bold bg-green-50 py-2 rounded-lg inline-block px-4">Đã gửi mã mới thành công!</p>
                  )}
                  <button
                    onClick={() => setTwoFactorData(null)}
                    className="block w-full text-sm text-neutral-400 hover:text-neutral-600 transition-colors font-medium"
                  >
                    Sử dụng tài khoản khác
                  </button>
                </div>
              </div>
            ) : (
              <form className="space-y-6" onSubmit={handleSubmit}>
                {(error || localErrors.general) && (
                  <div className="bg-red-50 border border-red-100 rounded-xl p-4 flex items-center gap-3 text-red-600">
                    <div className="p-1 px-2 border border-red-200 rounded-lg text-xs font-bold bg-white leading-none">!</div>
                    <p className="text-sm font-medium">{error || localErrors.general}</p>
                  </div>
                )}

                <div className="space-y-4">
                  <div>
                    <label htmlFor="email" className="block text-sm font-bold text-neutral-700 mb-1.5 ml-1">
                      Email
                    </label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-neutral-400 group-focus-within:text-primary-500 transition-colors">
                        <Mail className="h-5 w-5" />
                      </div>
                      <input
                        id="email"
                        name="email"
                        type="email"
                        autoComplete="email"
                        required
                        value={formData.email}
                        onChange={handleChange}
                        className="block w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 placeholder-slate-300 text-slate-900 text-sm font-bold rounded-2xl focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5 transition-all outline-none"
                        placeholder="ten@congty.com"
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1.5 ml-1">
                      <label htmlFor="password" className="text-sm font-bold text-neutral-700">
                        Mật khẩu
                      </label>
                      <Link href="/forgot-password" className="text-xs font-bold text-primary-600 hover:underline">
                        Quên mật khẩu?
                      </Link>
                    </div>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-neutral-400 group-focus-within:text-primary-500 transition-colors">
                        <Lock className="h-5 w-5" />
                      </div>
                      <input
                        id="password"
                        name="password"
                        type={showPassword ? 'text' : 'password'}
                        autoComplete="current-password"
                        required
                        value={formData.password}
                        onChange={handleChange}
                        className="block w-full pl-12 pr-12 py-4 bg-slate-50 border border-slate-100 placeholder-slate-300 text-slate-900 text-sm font-bold rounded-2xl focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5 transition-all outline-none"
                        placeholder="••••••••"
                      />
                      <button
                        type="button"
                        className="absolute inset-y-0 right-0 pr-4 flex items-center text-neutral-400 hover:text-neutral-600"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="flex items-center">
                  <input
                    id="remember-me"
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="h-5 w-5 text-primary-600 focus:ring-primary-500 border-neutral-300 rounded-lg cursor-pointer"
                  />
                  <label htmlFor="remember-me" className="ml-2.5 block text-sm font-semibold text-neutral-600 cursor-pointer">
                    Duy trì đăng nhập
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full flex justify-center items-center gap-3 py-5 px-4 rounded-2xl shadow-2xl shadow-blue-500/20 text-xs font-black uppercase tracking-[0.2em] text-white bg-blue-600 hover:bg-blue-700 transition-all transform active:scale-[0.98] disabled:opacity-50"
                >
                  {isLoading ? (
                    <div className="w-5 h-5 border-3 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <span>Đăng nhập hệ thống</span>
                  )}
                </button>

                <div className="relative py-4">
                  <div className="absolute inset-0 flex items-center px-2">
                    <div className="w-full border-t border-neutral-100" />
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-4 bg-white text-neutral-400 font-medium">Hoặc sử dụng</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={() => handleGoogleLogin()}
                    disabled={isLoading || googleLoading}
                    className="flex justify-center items-center gap-3 py-4 px-4 border border-slate-100 rounded-2xl bg-slate-50 hover:bg-white hover:border-blue-200 transition-all disabled:opacity-50"
                  >
                    {googleLoading ? (
                      <div className="w-5 h-5 border-2 border-slate-200 border-t-slate-600 rounded-full animate-spin" />
                    ) : (
                      <svg className="w-5 h-5" viewBox="0 0 24 24">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                      </svg>
                    )}
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-700">Google</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleFacebookLogin()}
                    disabled={isLoading || googleLoading || fbLoading}
                    className="flex justify-center items-center gap-3 py-4 px-4 border border-slate-100 rounded-2xl bg-slate-50 hover:bg-white hover:border-blue-200 transition-all disabled:opacity-50"
                  >
                    {fbLoading ? (
                      <div className="w-5 h-5 border-2 border-slate-200 border-t-[#1877F2] rounded-full animate-spin" />
                    ) : (
                      <svg className="w-5 h-5" fill="#1877F2" viewBox="0 0 24 24">
                        <path fillRule="evenodd" d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" clipRule="evenodd" />
                      </svg>
                    )}
                    <span className="text-[10px] font-black uppercase tracking-widest text-[#1877F2]">Facebook</span>
                  </button>
                </div>

                <p className="text-center text-sm font-medium text-neutral-500 pt-4">
                  Chưa có tài khoản?{' '}
                  <Link href="/register" className="text-primary-600 font-bold hover:underline underline-offset-4">
                    Tạo tài khoản mới
                  </Link>
                </p>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
