'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Mail, ArrowLeft, CheckCircle } from 'lucide-react'

export default function ForgotPasswordPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    // Simulate API call
    setTimeout(() => {
      setIsLoading(false)
      setIsSuccess(true)
    }, 1500)
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
            {!isSuccess ? (
              <>
                <div className="text-center mb-8">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-green-500 to-blue-500 rounded-2xl mb-4">
                    <Mail className="h-8 w-8 text-white" />
                  </div>
                  <h2 className="text-3xl font-bold text-gray-900 mb-2">
                    Quên mật khẩu?
                  </h2>
                  <p className="text-base text-gray-600">
                    Đừng lo! Chúng tôi sẽ gửi hướng dẫn đặt lại mật khẩu qua email của bạn 📧
                  </p>
                </div>

                <form className="space-y-6" onSubmit={handleSubmit}>
                  {error && (
                    <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4">
                      <p className="text-sm text-red-600 font-medium">{error}</p>
                    </div>
                  )}

                  <div>
                    <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">
                      <Mail className="h-4 w-4 inline mr-1" />
                      Email đã đăng ký
                    </label>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="appearance-none relative block w-full px-4 py-3 border-2 border-gray-200 placeholder-gray-400 text-gray-900 text-base rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all"
                      placeholder="example@email.com"
                    />
                    <p className="mt-2 text-xs text-gray-500">
                      Nhập email bạn đã sử dụng để đăng ký tài khoản
                    </p>
                  </div>

                  <div>
                    <button
                      type="submit"
                      disabled={isLoading || !email.trim()}
                      className="group relative w-full flex justify-center items-center gap-2 py-3.5 px-4 border border-transparent text-base font-semibold rounded-xl text-white bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transition-all transform hover:scale-[1.02]"
                    >
                      {isLoading ? (
                        <>
                          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          <span>Đang gửi...</span>
                        </>
                      ) : (
                        <>
                          <Mail className="h-5 w-5" />
                          <span>Gửi hướng dẫn đặt lại</span>
                        </>
                      )}
                    </button>
                  </div>

                  <div className="text-center">
                    <p className="text-sm text-gray-600">
                      Nhớ mật khẩu rồi?{' '}
                      <Link href="/login" className="font-semibold text-primary-600 hover:text-primary-700 underline">
                        Đăng nhập ngay
                      </Link>
                    </p>
                  </div>
                </form>
              </>
            ) : (
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-6">
                  <CheckCircle className="h-12 w-12 text-green-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-3">
                  Email đã được gửi! ✅
                </h2>
                <p className="text-base text-gray-600 mb-6">
                  Chúng tôi đã gửi hướng dẫn đặt lại mật khẩu đến email:
                </p>
                <p className="text-lg font-semibold text-primary-600 mb-6 bg-primary-50 py-3 px-4 rounded-xl">
                  {email}
                </p>
                <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4 mb-6 text-left">
                  <p className="text-sm text-gray-700 mb-2">
                    <strong>📌 Lưu ý:</strong>
                  </p>
                  <ul className="text-sm text-gray-600 space-y-1 list-disc list-inside">
                    <li>Kiểm tra cả hộp thư spam/junk</li>
                    <li>Link có hiệu lực trong 24 giờ</li>
                    <li>Nếu không nhận được, thử gửi lại sau 5 phút</li>
                  </ul>
                </div>
                <div className="space-y-3">
                  <button
                    onClick={() => router.push('/login')}
                    className="w-full py-3 px-4 border-2 border-primary-600 rounded-xl text-primary-600 font-semibold hover:bg-primary-50 transition-all"
                  >
                    Quay lại đăng nhập
                  </button>
                  <button
                    onClick={() => {
                      setIsSuccess(false)
                      setEmail('')
                    }}
                    className="w-full py-3 px-4 text-gray-600 font-medium hover:text-gray-900 transition-colors"
                  >
                    Gửi lại email
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Help Section */}
          {!isSuccess && (
            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                Cần hỗ trợ?{' '}
                <Link href="/contact" className="font-semibold text-primary-600 hover:text-primary-700 underline">
                  Liên hệ với chúng tôi
                </Link>
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
