'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Eye, EyeOff, Mail, Lock, ArrowLeft } from 'lucide-react'
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

        // Call our backend to verify and log in
        const res = await fetch('/api/auth/google', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            access_token: tokenResponse.access_token,
          }),
        })

        const data = await res.json()

        if (data.success) {

          // Store data just like normal login
          if (typeof window !== 'undefined') {
            localStorage.setItem('access_token', data.token)
            localStorage.setItem('user', JSON.stringify(data.user))
            localStorage.setItem('remember_me', 'true')
          }

          toast.success('Đăng nhập Google thành công!')

          // Redirect with callback support
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
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          accessToken: authResponse.accessToken,
        }),
      })

      const data = await res.json()

      if (data.success) {
        if (typeof window !== 'undefined') {
          localStorage.setItem('access_token', data.token)
          localStorage.setItem('user', JSON.stringify(data.user))
          localStorage.setItem('remember_me', 'true')
        }

        toast.success('Đăng nhập Facebook thành công!')

        // Redirect with callback support
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

  // Handle "Go Home" button - clear stale auth and use replace() to avoid history loop
  const handleGoHome = () => {
    // Check if we came from a protected route (has callbackUrl)
    const urlParams = new URLSearchParams(window.location.search)
    const callbackUrl = urlParams.get('callbackUrl')

    if (callbackUrl) {
      // Clear potentially stale auth data to break the redirect loop
      localStorage.removeItem('access_token')
      localStorage.removeItem('user')
      sessionStorage.removeItem('access_token')
      sessionStorage.removeItem('user')

      // Also clear the auth cookie by setting it to expire
      document.cookie = 'auth_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT'

    }

    // Use replace() instead of href to prevent back button from returning to login
    window.location.replace('/')
  }

  const [formData, setFormData] = useState({
    email: '',
    password: ''
  })
  const [rememberMe, setRememberMe] = useState(true)
  const [localErrors, setLocalErrors] = useState<Record<string, string>>({})

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLocalErrors({})

    try {
      // Login returns user data directly
      await login({
        email: formData.email,
        password: formData.password
      }, rememberMe)

      // Wait a tick to ensure auth state is updated
      await new Promise(resolve => setTimeout(resolve, 50))

      // Get user from localStorage (auth service stores it there)
      const userData = localStorage.getItem('user')

      if (userData) {
        const user = JSON.parse(userData)
        console.log('[LOGIN] User logged in:', {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role
        })

        // Use the utility function for redirect (handles callback URL)
        performPostLoginRedirect(user)
      } else {
        // This shouldn't happen, but fallback just in case
        console.error('[LOGIN] User data not found in localStorage after successful login')
        // Try to get from auth response directly via context
        // For now, redirect to home
        window.location.href = '/'
      }
    } catch (error: any) {
      console.error('[LOGIN] Login error:', error)
      setLocalErrors({ general: error.message || 'Đăng nhập thất bại' })
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
    if (localErrors[e.target.name]) {
      setLocalErrors({ ...localErrors, [e.target.name]: '' })
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex flex-col">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-md shadow-sm border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4">
            <button
              onClick={handleGoHome}
              className="flex items-center text-gray-700 hover:text-primary-600 font-medium transition-colors"
            >
              <ArrowLeft className="h-5 w-5 mr-2" />
              Về trang chủ
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
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-primary-600 to-secondary-600 rounded-2xl mb-4">
                <Lock className="h-8 w-8 text-white" />
              </div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">
                Đăng nhập
              </h2>
              <p className="text-base text-gray-600 mb-3">
                Chào mừng bạn trở lại! 👋
              </p>
              <p className="text-sm text-gray-500">
                Chưa có tài khoản?{' '}
                <Link href="/register" className="font-semibold text-primary-600 hover:text-primary-700 underline">
                  Đăng ký ngay
                </Link>
              </p>
            </div>

            <form className="space-y-5" onSubmit={handleSubmit}>
              {(error || localErrors.general) && (
                <div className="bg-red-50 border border-red-200 rounded-md p-4">
                  <p className="text-sm text-red-600">{error || localErrors.general}</p>
                </div>
              )}

              <div className="space-y-5">
                <div>
                  <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">
                    <Mail className="h-4 w-4 inline mr-1" />
                    Email
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    className="appearance-none relative block w-full px-4 py-3 border-2 border-gray-200 placeholder-gray-400 text-gray-900 text-base rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
                    placeholder="example@email.com"
                  />
                </div>

                <div>
                  <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-2">
                    <Lock className="h-4 w-4 inline mr-1" />
                    Mật khẩu
                  </label>
                  <div className="relative">
                    <input
                      id="password"
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="current-password"
                      required
                      value={formData.password}
                      onChange={handleChange}
                      className="appearance-none relative block w-full px-4 py-3 pr-12 border-2 border-gray-200 placeholder-gray-400 text-gray-900 text-base rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 pr-4 flex items-center hover:text-primary-600 transition-colors"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="h-5 w-5 text-gray-400" />
                      ) : (
                        <Eye className="h-5 w-5 text-gray-400" />
                      )}
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <input
                    id="remember-me"
                    name="remember-me"
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded cursor-pointer"
                  />
                  <label htmlFor="remember-me" className="ml-2 block text-sm font-medium text-gray-700 cursor-pointer">
                    Ghi nhớ đăng nhập
                  </label>
                </div>

                <div className="text-sm">
                  <Link href="/forgot-password" className="font-semibold text-primary-600 hover:text-primary-700 underline">
                    Quên mật khẩu?
                  </Link>
                </div>
              </div>

              <div>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="group relative w-full flex justify-center items-center gap-2 py-3.5 px-4 border border-transparent text-base font-semibold rounded-xl text-white bg-gradient-to-r from-primary-600 to-secondary-600 hover:from-primary-700 hover:to-secondary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transition-all transform hover:scale-[1.02]"
                >
                  {isLoading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Đang đăng nhập...</span>
                    </>
                  ) : (
                    <>
                      <Lock className="h-5 w-5" />
                      <span>Đăng nhập</span>
                    </>
                  )}
                </button>
              </div>

              <div className="mt-6">
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-200" />
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-4 bg-white text-gray-500 font-medium">Hoặc đăng nhập với</span>
                  </div>
                </div>

                <div className="mt-6 grid grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={() => handleGoogleLogin()}
                    disabled={isLoading || googleLoading}
                    className="w-full inline-flex justify-center items-center gap-2 py-3 px-4 border-2 border-gray-200 rounded-xl shadow-sm bg-white text-sm font-semibold text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-all disabled:opacity-50"
                  >
                    {googleLoading ? (
                      <div className="w-5 h-5 border-2 border-primary-600 border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      <svg className="w-5 h-5" viewBox="0 0 24 24">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                      </svg>
                    )}
                    <span>Google</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleFacebookLogin()}
                    disabled={isLoading || googleLoading || fbLoading}
                    className="w-full inline-flex justify-center items-center gap-2 py-3 px-4 border-2 border-gray-200 rounded-xl shadow-sm bg-white text-sm font-semibold text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-all disabled:opacity-50"
                  >
                    {fbLoading ? (
                      <div className="w-5 h-5 border-2 border-[#1877F2] border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      <svg className="w-5 h-5" fill="#1877F2" viewBox="0 0 24 24">
                        <path fillRule="evenodd" d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" clipRule="evenodd" />
                      </svg>
                    )}
                    <span>Facebook</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}