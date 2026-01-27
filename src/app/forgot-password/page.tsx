'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Mail, ArrowLeft, CheckCircle2, Building2, HelpCircle, ShieldAlert } from 'lucide-react'

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

    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
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
      {/* Left: Branding & Visuals (Desktop Only) */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-slate-900">
        <div className="absolute inset-0 z-0 scale-105 animate-slow-zoom">
          <img
            src="https://images.unsplash.com/photo-1581092160562-40aa08e78837?q=80&w=2070&auto=format&fit=crop"
            alt="Safety First"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-slate-900/50" />
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
              An tâm <span className="text-primary-400">bảo mật</span> tài khoản.
            </h2>
            <p className="text-lg text-neutral-300 font-medium">
              Chúng tôi luôn đồng hành cùng bạn để bảo vệ quyền truy cập và dữ liệu quan trọng của công trình.
            </p>

            <div className="space-y-4 pt-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-primary-500/20 flex items-center justify-center border border-primary-500/30">
                  <ShieldAlert className="h-5 w-5 text-primary-400" />
                </div>
                <span className="text-sm font-semibold">Khôi phục nhanh chóng</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-secondary-500/20 flex items-center justify-center border border-secondary-500/30">
                  <HelpCircle className="h-5 w-5 text-secondary-400" />
                </div>
                <span className="text-sm font-semibold">Hỗ trợ kỹ thuật 24/7</span>
              </div>
            </div>
          </div>

          <p className="text-sm text-neutral-400 animate-fade-in">
            © 2026 SmartBuild ERP. Trung tâm hỗ trợ khách hàng.
          </p>
        </div>
      </div>

      {/* Right: Forgot Password Form */}
      <div className="flex-1 flex flex-col">
        {/* Mobile Header */}
        <div className="flex lg:hidden items-center justify-between p-4 border-b border-neutral-100">
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
            {/* Back Button */}
            <button
              onClick={() => router.push('/login')}
              className="hidden lg:flex items-center text-neutral-500 hover:text-primary-600 font-medium transition-all mb-12 group"
            >
              <ArrowLeft className="h-4 w-4 mr-2 group-hover:-translate-x-1 transition-transform" />
              Quay lại đăng nhập
            </button>

            {!isSuccess ? (
              <div className="animate-fade-in">
                <div className="mb-8">
                  <h1 className="text-3xl font-bold text-neutral-900 mb-2">Quên mật khẩu?</h1>
                  <p className="text-neutral-500 font-medium">Đừng lo lắng! Chúng tôi sẽ gửi hướng dẫn khôi phục qua email của bạn.</p>
                </div>

                <form className="space-y-6" onSubmit={handleSubmit}>
                  {error && (
                    <div className="bg-red-50 border border-red-100 rounded-2xl p-4 text-red-600 text-sm font-bold flex items-center gap-3">
                      <div className="h-2 w-2 rounded-full bg-red-600 animate-pulse" />
                      {error}
                    </div>
                  )}

                  <div className="space-y-1.5 ml-1">
                    <label htmlFor="email" className="block text-sm font-bold text-neutral-700">Email đã đăng ký</label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-neutral-400 group-focus-within:text-primary-500">
                        <Mail className="h-5 w-5" />
                      </div>
                      <input
                        id="email"
                        name="email"
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="block w-full pl-11 pr-4 py-3.5 bg-neutral-50 border border-neutral-200 placeholder-neutral-400 text-neutral-900 text-base rounded-2xl focus:bg-white focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 transition-all outline-none"
                        placeholder="ten@congty.com"
                      />
                    </div>
                    <p className="mt-2 text-xs text-neutral-400 font-medium">Nhập email bạn đã sử dụng để đăng ký tài khoản.</p>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading || !email.trim()}
                    className="w-full flex justify-center items-center gap-3 py-4 px-4 rounded-2xl shadow-xl shadow-primary-500/20 text-base font-bold text-white bg-primary-600 hover:bg-primary-700 transition-all transform active:scale-[0.98] disabled:opacity-50"
                  >
                    {isLoading ? (
                      <div className="w-6 h-6 border-3 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        <Mail className="h-5 w-5" />
                        <span>Gửi link khôi phục</span>
                      </>
                    )}
                  </button>
                </form>

                <div className="text-center mt-8">
                  <p className="text-sm font-medium text-neutral-500">
                    Bạn cần hỗ trợ thêm?{' '}
                    <Link href="/contact" className="text-primary-600 font-bold hover:underline">
                      Liên hệ CSKH
                    </Link>
                  </p>
                </div>
              </div>
            ) : (
              <div className="text-center animate-slide-in">
                <div className="inline-flex items-center justify-center w-20 h-20 bg-green-50 rounded-full mb-8">
                  <CheckCircle2 className="h-10 w-10 text-green-600" />
                </div>
                <h2 className="text-3xl font-bold text-neutral-900 mb-3">Kiểm tra email của bạn</h2>
                <p className="text-neutral-500 font-medium mb-8">
                  Chúng tôi đã gửi hướng dẫn đặt lại mật khẩu đến:
                  <br />
                  <span className="text-neutral-900 font-bold underline decoration-primary-500 decoration-2 underline-offset-4">{email}</span>
                </p>

                <div className="bg-neutral-50 border border-neutral-100 rounded-3xl p-6 text-left mb-8">
                  <h4 className="font-bold text-neutral-900 text-sm mb-3">Các bước tiếp theo:</h4>
                  <ul className="text-sm text-neutral-600 space-y-3 font-medium">
                    <li className="flex items-start gap-3">
                      <div className="h-5 w-5 rounded-full bg-white flex items-center justify-center border border-neutral-200 shrink-0 text-[10px] font-black">1</div>
                      Kiểm tra cả hộp thư Spam nếu bạn không thấy email trong Inbox.
                    </li>
                    <li className="flex items-start gap-3">
                      <div className="h-5 w-5 rounded-full bg-white flex items-center justify-center border border-neutral-200 shrink-0 text-[10px] font-black">2</div>
                      Link khôi phục có hiệu lực trong vòng 24 giờ tới.
                    </li>
                    <li className="flex items-start gap-3">
                      <div className="h-5 w-5 rounded-full bg-white flex items-center justify-center border border-neutral-200 shrink-0 text-[10px] font-black">3</div>
                      Nếu vẫn không nhận được, hãy thử gửi lại sau 5 phút.
                    </li>
                  </ul>
                </div>

                <div className="space-y-4">
                  <button
                    onClick={() => router.push('/login')}
                    className="w-full py-4 px-4 bg-primary-600 text-white font-bold rounded-2xl shadow-xl shadow-primary-500/20 hover:bg-primary-700 transition-all"
                  >
                    Quay lại Trang Đăng nhập
                  </button>
                  <button
                    onClick={() => setIsSuccess(false)}
                    className="w-full py-4 px-4 text-neutral-500 font-bold hover:text-neutral-900 transition-colors"
                  >
                    Thử lại với email khác
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
