'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Eye, EyeOff, Mail, Lock, User, Phone, ArrowLeft, Sparkles, ShieldCheck, CheckCircle2, Building2, HardHat, Construction, Check } from 'lucide-react'
import { useAuth } from '@/contexts/auth-context'
import { toast } from 'react-hot-toast'

export default function RegisterPage() {
  const router = useRouter()
  const { register, isLoading, error } = useAuth()
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [guestId, setGuestId] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: ''
  })
  const [localErrors, setLocalErrors] = useState<Record<string, string>>({})
  const [verificationData, setVerificationData] = useState<{
    required: boolean
    email: string
    token: string
  } | null>(null)
  const [otpValue, setOtpValue] = useState('')
  const [isResending, setIsResending] = useState(false)
  const [resendSuccess, setResendSuccess] = useState(false)

  // Check for existing guest session
  useEffect(() => {
    const storedGuestId = localStorage.getItem('user_id')
    if (storedGuestId && storedGuestId.startsWith('guest_')) {
      setGuestId(storedGuestId)
    }
  }, [])

  const validateForm = () => {
    const newErrors: Record<string, string> = {}
    if (!formData.fullName.trim()) newErrors.fullName = 'Vui lòng nhập họ tên'
    if (!formData.email.trim()) newErrors.email = 'Vui lòng nhập email'
    else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Email không hợp lệ'
    if (!formData.phone.trim()) newErrors.phone = 'Vui lòng nhập số điện thoại'
    else if (!/^(0|\+84)[0-9]{9,10}$/.test(formData.phone)) newErrors.phone = 'Số điện thoại không hợp lệ'
    if (!formData.password) newErrors.password = 'Vui lòng nhập mật khẩu'
    else if (formData.password.length < 8) newErrors.password = 'Mật khẩu phải có ít nhất 8 ký tự'
    else if (!/[A-Z]/.test(formData.password)) newErrors.password = 'Mật khẩu phải có ít nhất 1 chữ hoa'
    else if (!/[a-z]/.test(formData.password)) newErrors.password = 'Mật khẩu phải có ít nhất 1 chữ thường'
    else if (!/[0-9]/.test(formData.password)) newErrors.password = 'Mật khẩu phải có ít nhất 1 số'
    if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = 'Mật khẩu xác nhận không khớp'

    setLocalErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateForm()) return
    try {
      const response = await register({
        fullName: formData.fullName,
        email: formData.email,
        phone: formData.phone,
        password: formData.password,
        guestId: guestId || undefined
      }) as any

      if (response?.verificationRequired) {
        setVerificationData({
          required: true,
          email: response.email,
          token: response.verificationToken
        })
        return
      }

      if (guestId) {
        localStorage.removeItem('user_id')
        localStorage.removeItem('user_name')
        localStorage.removeItem('user_phone')
        localStorage.removeItem('user_email')
      }
      toast.success('Đăng ký thành công!')
      router.push('/account')
    } catch (error: any) {
      setLocalErrors({ general: error.message || 'Đăng ký thất bại' })
    }
  }

  const { verifyOTP, resendOTP } = useAuth()

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    if (otpValue.length !== 6) return
    try {
      if (!verificationData?.token) return
      await verifyOTP(otpValue, verificationData.token)
      if (guestId) {
        localStorage.removeItem('user_id')
        localStorage.removeItem('user_name')
        localStorage.removeItem('user_phone')
        localStorage.removeItem('user_email')
      }
      toast.success('Xác thực thành công!')
      router.push('/account')
    } catch (err: any) {
      setLocalErrors({ otp: err.message || 'Xác thực thất bại' })
    }
  }

  const handleResendOtp = async () => {
    if (!verificationData?.token || isResending) return
    setIsResending(true)
    try {
      await resendOTP(verificationData.token)
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
      {/* Left: Visuals (Desktop) */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-neutral-900">
        <div className="absolute inset-0 z-0 scale-105 animate-slow-zoom">
          <img
            src="https://images.unsplash.com/photo-1504307651254-35680f356dfd?q=80&w=2070&auto=format&fit=crop"
            alt="Construction Team Meeting"
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
              Bắt đầu hành trình <span className="text-primary-400">xây dựng</span> chuyên nghiệp.
            </h2>
            <p className="text-lg text-slate-300 font-medium leading-relaxed">
              Trở thành một phần của cộng đồng SmartBuild để tiếp cận nguồn cung vật liệu uy tín và đội ngũ nhà thầu chất lượng nhất.
            </p>

            <div className="space-y-4 pt-4">
              <div className="flex items-center gap-4 bg-white/5 backdrop-blur-sm p-5 rounded-[24px] border border-white/10 group hover:bg-white/10 transition-all cursor-default">
                <div className="h-14 w-14 rounded-2xl bg-blue-500/20 flex items-center justify-center border border-blue-500/30 shrink-0 group-hover:scale-110 transition-transform">
                  <HardHat className="h-7 w-7 text-blue-400" />
                </div>
                <div>
                  <h4 className="font-black text-white uppercase tracking-tight">Dành cho Nhà thầu</h4>
                  <p className="text-xs text-slate-400 font-medium leading-relaxed mt-1">Quản lý dự án, báo giá và tìm kiếm khách hàng tiềm năng chuyên nghiệp.</p>
                </div>
              </div>
              <div className="flex items-center gap-4 bg-white/5 backdrop-blur-sm p-5 rounded-[24px] border border-white/10 group hover:bg-white/10 transition-all cursor-default">
                <div className="h-14 w-14 rounded-2xl bg-emerald-500/20 flex items-center justify-center border border-emerald-500/30 shrink-0 group-hover:scale-110 transition-transform">
                  <Construction className="h-7 w-7 text-emerald-400" />
                </div>
                <div>
                  <h4 className="font-black text-white uppercase tracking-tight">Dành cho Chủ nhà</h4>
                  <p className="text-xs text-slate-400 font-medium leading-relaxed mt-1">Mua sắm vật liệu, theo dõi tiến độ và tối ưu ngân sách công trình.</p>
                </div>
              </div>
            </div>
          </div>

          <p className="text-sm text-slate-500 font-medium animate-fade-in">
            © 2026 SmartBuild ERP. Giải pháp số cho ngành xây dựng.
          </p>
        </div>
      </div>

      {/* Right: Register Form */}
      <div className="flex-1 flex flex-col overflow-y-auto">
        {/* Mobile Header */}
        <div className="flex lg:hidden items-center justify-between p-4 border-b border-neutral-100 bg-white sticky top-0 z-50">
          <div className="flex items-center gap-2">
            <Building2 className="h-6 w-6 text-primary-600" />
            <span className="text-xl font-black tracking-tighter text-neutral-900">SmartBuild</span>
          </div>
          <button onClick={() => router.push('/')} className="p-2 hover:bg-neutral-100 rounded-full transition-colors">
            <ArrowLeft className="h-5 w-5 text-neutral-600" />
          </button>
        </div>

        <div className="flex-1 flex flex-col justify-center px-6 sm:px-12 lg:px-20 py-8 lg:py-12">
          <div className="w-full max-w-md mx-auto">
            <button
              onClick={() => router.push('/')}
              className="hidden lg:flex items-center text-neutral-500 hover:text-primary-600 font-medium transition-all mb-6 group"
            >
              <ArrowLeft className="h-4 w-4 mr-2 group-hover:-translate-x-1 transition-transform" />
              Về trang chủ
            </button>

            <div className="mb-8">
              <div className="w-12 h-1.5 bg-blue-600 rounded-full mb-6"></div>
              <h1 className="text-4xl font-black text-slate-900 mb-3 tracking-tighter uppercase whitespace-nowrap">Tạo tài khoản mới</h1>
              <p className="text-slate-500 font-medium text-sm">Gia nhập hệ sinh thái SmartBuild ngay hôm nay.</p>
            </div>

            {/* Guest Data Migration Notice */}
            {guestId && (
              <div className="mb-6 bg-indigo-50/50 p-4 rounded-3xl border border-indigo-100 flex items-start gap-4 animate-pulse-gentle">
                <div className="bg-indigo-600 p-2 rounded-2xl shadow-lg shadow-indigo-200 shrink-0">
                  <Sparkles className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-indigo-900 text-sm">Dữ liệu của bạn đã sẵn sàng!</h3>
                  <p className="text-[11px] text-indigo-700 mt-0.5 leading-relaxed font-medium">
                    Chúng tôi sẽ tự động kết nối lịch sử chat và báo giá tạm thời vào tài khoản mới của bạn.
                  </p>
                </div>
              </div>
            )}

            {verificationData?.required ? (
              <div className="animate-slide-in space-y-6">
                <div className="bg-primary-50 p-6 rounded-3xl border border-primary-100 text-center">
                  <div className="mx-auto flex items-center justify-center h-14 w-14 rounded-full bg-white shadow-sm mb-4">
                    <ShieldCheck className="h-7 w-7 text-primary-600" />
                  </div>
                  <h3 className="text-xl font-bold text-neutral-900">Xác minh danh tính</h3>
                  <p className="mt-2 text-sm text-neutral-600">
                    Mã 6 chữ số đã được gửi đến:<br />
                    <span className="font-bold text-neutral-900">{verificationData.email}</span>
                  </p>
                </div>

                <form onSubmit={handleVerifyOtp} className="space-y-6">
                  <input
                    type="text"
                    maxLength={6}
                    value={otpValue}
                    onChange={(e) => setOtpValue(e.target.value.replace(/\D/g, ''))}
                    className="block w-full text-center text-3xl tracking-[1rem] font-bold py-5 bg-neutral-50 border-2 border-neutral-100 rounded-2xl focus:bg-white focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 transition-all outline-none"
                    placeholder="000000"
                    required
                  />
                  {localErrors.otp && (
                    <p className="mt-2 text-sm text-red-600 text-center font-bold">{localErrors.otp}</p>
                  )}

                  <button
                    type="submit"
                    disabled={isLoading || otpValue.length !== 6}
                    className="w-full py-4 px-4 rounded-2xl shadow-xl text-base font-bold text-white bg-primary-600 hover:bg-primary-700 transition-all disabled:opacity-50"
                  >
                    {isLoading ? 'Đang xác thực...' : 'Kích hoạt tài khoản'}
                  </button>
                </form>

                <div className="text-center pt-4">
                  <p className="text-sm text-neutral-500">
                    Chưa nhận được mã?{' '}
                    <button
                      onClick={handleResendOtp}
                      disabled={isResending}
                      className="font-bold text-primary-600 hover:underline"
                    >
                      {isResending ? 'Hệ thống đang gửi...' : 'Gửi lại ngay'}
                    </button>
                  </p>
                  {resendSuccess && (
                    <div className="mt-4 inline-flex items-center gap-2 bg-green-50 text-green-700 px-4 py-2 rounded-full text-xs font-bold">
                      <CheckCircle2 className="h-3 w-3" /> Mã mới đã được gửi!
                    </div>
                  )}
                  <button
                    onClick={() => setVerificationData(null)}
                    className="block w-full mt-6 text-sm text-neutral-400 hover:text-neutral-600 transition-colors font-medium"
                  >
                    Quay lại bước đăng ký
                  </button>
                </div>
              </div>
            ) : (
              <form className="space-y-4" onSubmit={handleSubmit}>
                {(error || localErrors.general) && (
                  <div className="bg-red-50 border border-red-100 rounded-2xl p-3 text-red-600 text-sm font-medium flex items-center gap-3">
                    <div className="h-2 w-2 rounded-full bg-red-600 animate-pulse" />
                    {error || localErrors.general}
                  </div>
                )}

                <div className="grid grid-cols-1 gap-4">
                  <div className="space-y-1 ml-1">
                    <label htmlFor="fullName" className="block text-xs font-bold text-neutral-500 uppercase tracking-wider">Họ và tên *</label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-neutral-400 group-focus-within:text-primary-500">
                        <User className="h-5 w-5" />
                      </div>
                      <input
                        id="fullName"
                        name="fullName"
                        type="text"
                        required
                        value={formData.fullName}
                        onChange={handleChange}
                        className={`block w-full pl-12 pr-4 py-4 bg-slate-50 border ${localErrors.fullName ? 'border-red-300' : 'border-slate-100'} rounded-2xl focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5 transition-all outline-none font-bold text-sm`}
                        placeholder="Nguyễn Văn A"
                      />
                    </div>
                    {localErrors.fullName && <p className="text-red-500 text-[10px] font-bold uppercase ml-2">{localErrors.fullName}</p>}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1 ml-1">
                      <label htmlFor="email" className="block text-xs font-bold text-neutral-500 uppercase tracking-wider">Email *</label>
                      <div className="relative group">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-neutral-400 group-focus-within:text-primary-500">
                          <Mail className="h-5 w-5" />
                        </div>
                        <input
                          id="email"
                          name="email"
                          type="email"
                          required
                          value={formData.email}
                          onChange={handleChange}
                          className={`block w-full pl-12 pr-4 py-4 bg-slate-50 border ${localErrors.email ? 'border-red-300' : 'border-slate-100'} rounded-2xl focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5 transition-all outline-none font-bold text-sm`}
                          placeholder="email@vidu.com"
                        />
                      </div>
                      {localErrors.email && <p className="text-red-500 text-[10px] font-bold uppercase ml-2">{localErrors.email}</p>}
                    </div>

                    <div className="space-y-1 ml-1">
                      <label htmlFor="phone" className="block text-xs font-bold text-neutral-500 uppercase tracking-wider">Số điện thoại *</label>
                      <div className="relative group">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-neutral-400 group-focus-within:text-primary-500">
                          <Phone className="h-5 w-5" />
                        </div>
                        <input
                          id="phone"
                          name="phone"
                          type="tel"
                          required
                          value={formData.phone}
                          onChange={handleChange}
                          className={`block w-full pl-12 pr-4 py-4 bg-slate-50 border ${localErrors.phone ? 'border-red-300' : 'border-slate-100'} rounded-2xl focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5 transition-all outline-none font-bold text-sm`}
                          placeholder="09xx xxx xxx"
                        />
                      </div>
                      {localErrors.phone && <p className="text-red-500 text-[10px] font-bold uppercase ml-2">{localErrors.phone}</p>}
                    </div>
                  </div>

                  <div className="space-y-1 ml-1">
                    <label htmlFor="password" className="block text-xs font-bold text-neutral-500 uppercase tracking-wider">Mật khẩu *</label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-neutral-400 group-focus-within:text-primary-500">
                        <Lock className="h-5 w-5" />
                      </div>
                      <input
                        id="password"
                        name="password"
                        type={showPassword ? 'text' : 'password'}
                        required
                        value={formData.password}
                        onChange={handleChange}
                        className={`block w-full pl-12 pr-12 py-4 bg-slate-50 border ${localErrors.password ? 'border-red-300' : 'border-slate-100'} rounded-2xl focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5 transition-all outline-none font-bold text-sm`}
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
                    {localErrors.password && <p className="text-red-500 text-[10px] font-bold uppercase ml-2">{localErrors.password}</p>}
                  </div>

                  <div className="space-y-1 ml-1">
                    <label htmlFor="confirmPassword" className="block text-xs font-bold text-neutral-500 uppercase tracking-wider">Xác nhận mật khẩu *</label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-neutral-400 group-focus-within:text-primary-500">
                        <Lock className="h-5 w-5" />
                      </div>
                      <input
                        id="confirmPassword"
                        name="confirmPassword"
                        type={showConfirmPassword ? 'text' : 'password'}
                        required
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        className={`block w-full pl-12 pr-12 py-4 bg-slate-50 border ${localErrors.confirmPassword ? 'border-red-300' : 'border-slate-100'} rounded-2xl focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5 transition-all outline-none font-bold text-sm`}
                        placeholder="Nhập lại mật khẩu"
                      />
                      <button
                        type="button"
                        className="absolute inset-y-0 right-0 pr-4 flex items-center text-neutral-400 hover:text-neutral-600"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      >
                        {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </button>
                    </div>
                    {localErrors.confirmPassword && <p className="text-red-500 text-[10px] font-bold uppercase ml-2">{localErrors.confirmPassword}</p>}
                  </div>
                </div>

                <div className="pt-2">
                  <label className="flex items-start gap-3 cursor-pointer group select-none">
                    <div className="relative flex items-center justify-center mt-0.5">
                      <input
                        type="checkbox"
                        required
                        className="peer sr-only"
                      />
                      <div className="h-5 w-5 rounded-md border-2 border-neutral-300 bg-white shadow-sm ring-offset-2 peer-focus:ring-2 peer-focus:ring-primary-500/20 peer-checked:border-primary-600 peer-checked:bg-primary-600 transition-all duration-200 ease-out group-hover:border-primary-400" />
                      <Check className="absolute h-3.5 w-3.5 text-white opacity-0 transform scale-50 peer-checked:opacity-100 peer-checked:scale-100 transition-all duration-200 ease-out pointer-events-none stroke-[3]" />
                    </div>
                    <span className="text-[13px] text-neutral-500 font-medium leading-relaxed group-hover:text-neutral-700 transition-colors">
                      Tôi đồng ý với các <Link href="/terms" className="font-bold text-blue-600 hover:text-blue-700 hover:underline hover:underline-offset-2 transition-all">Điều khoản dịch vụ</Link> và <Link href="/privacy" className="font-bold text-blue-600 hover:text-blue-700 hover:underline hover:underline-offset-2 transition-all">Chính sách bảo mật</Link> của SmartBuild.
                    </span>
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-5 px-4 rounded-2xl shadow-2xl shadow-blue-500/20 text-xs font-black uppercase tracking-[0.2em] text-white bg-blue-600 hover:bg-blue-700 transition-all transform active:scale-[0.98] disabled:opacity-50 flex justify-center items-center gap-3"
                >
                  {isLoading ? (
                    <div className="w-5 h-5 border-3 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <span>Tạo tài khoản SmartBuild</span>
                  )}
                </button>

                <p className="text-center text-sm font-bold text-neutral-400 pt-4">
                  Đã có tài khoản?{' '}
                  <Link href="/login" className="text-primary-600 hover:underline underline-offset-4 decoration-2">
                    Đăng nhập tại đây
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
