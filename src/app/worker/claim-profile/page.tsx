
'use client'

import { useState, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { HardHat, User, Phone, Lock, CheckCircle, ChevronRight, Loader2, Award, Briefcase } from 'lucide-react'
import { useAuth } from '@/contexts/auth-context'
import toast, { Toaster } from 'react-hot-toast'

// Wrap content in Suspense because we use useSearchParams
function ClaimProfileContent() {
    const searchParams = useSearchParams()
    const router = useRouter()
    const { login } = useAuth() // Assuming we might auto-login or redirect

    // Get info from URL (passed from report page)
    const token = searchParams.get('token')
    const initialName = searchParams.get('name') || ''

    const [name, setName] = useState(initialName)
    const [phone, setPhone] = useState('')
    const [password, setPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const [step, setStep] = useState(1) // 1: Input, 2: Success

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!phone || !password || !name) {
            toast.error('Vui lòng điền đầy đủ thông tin')
            return
        }

        setLoading(true)
        try {
            // 1. Register User & Contractor Profile
            const res = await fetch('/api/auth/register-worker', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name,
                    phone,
                    password,
                    claimToken: token // Critical: Link past reports to this new user
                })
            })

            const data = await res.json()

            if (res.ok) {
                setStep(2)
                toast.success('Tạo hồ sơ thành công!')
            } else {
                toast.error(data.error?.message || 'Lỗi đăng ký')
            }
        } catch (error) {
            toast.error('Lỗi kết nối')
        } finally {
            setLoading(false)
        }
    }

    if (step === 2) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-600 to-purple-700 flex flex-col items-center justify-center p-6 text-center text-white">
                <div className="bg-white/10 backdrop-blur-lg p-8 rounded-3xl border border-white/20 shadow-2xl max-w-sm w-full">
                    <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-green-500/30">
                        <Award className="w-10 h-10 text-white" />
                    </div>
                    <h1 className="text-2xl font-black mb-2">CHÀO MỪNG THỢ XỊN!</h1>
                    <p className="text-blue-100 mb-8 text-sm">
                        Hồ sơ của bạn đã được tạo và tự động cập nhật các dự án bạn vừa báo cáo.
                    </p>

                    <div className="bg-white/5 rounded-xl p-4 mb-6 border border-white/10">
                        <div className="flex items-center gap-3 mb-2">
                            <Briefcase className="w-5 h-5 text-yellow-400" />
                            <span className="font-bold text-sm">Kinh nghiệm đã xác thực:</span>
                        </div>
                        <p className="text-3xl font-black text-white">1 <span className="text-sm font-normal text-blue-200">Dự án</span></p>
                    </div>

                    <Link
                        href="/login"
                        className="w-full py-4 bg-white text-blue-700 font-bold rounded-xl shadow-lg flex items-center justify-center gap-2 hover:bg-blue-50 transition-colors"
                    >
                        Đăng nhập ngay <ChevronRight className="w-4 h-4" />
                    </Link>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
            <Toaster position="top-center" />
            <div className="bg-white rounded-[2rem] shadow-2xl overflow-hidden max-w-md w-full border border-gray-100">
                {/* Header */}
                <div className="bg-blue-600 p-8 text-center relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-8 opacity-10">
                        <HardHat className="w-32 h-32 text-white" />
                    </div>
                    <h1 className="text-2xl font-black text-white relative z-10">TẠO HỒ SƠ THỢ</h1>
                    <p className="text-blue-100 text-sm mt-2 relative z-10">Chuyển đổi lịch sử làm việc thành uy tín</p>
                </div>

                <div className="p-8">
                    {token && (
                        <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 mb-6 flex items-start gap-3">
                            <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
                            <div>
                                <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">Đã tìm thấy báo cáo</p>
                                <p className="font-bold text-gray-900 text-sm">Hệ thống sẽ tự động đồng bộ huy hiệu làm việc của bạn vào hồ sơ này.</p>
                            </div>
                        </div>
                    )}

                    <form onSubmit={handleRegister} className="space-y-4">
                        <div>
                            <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5">Họ và tên</label>
                            <div className="relative">
                                <User className="w-5 h-5 text-gray-400 absolute left-3 top-3.5" />
                                <input
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none font-bold text-gray-800 transition-all"
                                    placeholder="Nguyễn Văn A"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5">Số điện thoại</label>
                            <div className="relative">
                                <Phone className="w-5 h-5 text-gray-400 absolute left-3 top-3.5" />
                                <input
                                    type="tel"
                                    value={phone}
                                    onChange={(e) => setPhone(e.target.value)}
                                    className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none font-bold text-gray-800 transition-all"
                                    placeholder="0912..."
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5">Mật khẩu</label>
                            <div className="relative">
                                <Lock className="w-5 h-5 text-gray-400 absolute left-3 top-3.5" />
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none font-bold text-gray-800 transition-all"
                                    placeholder="••••••"
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full mt-4 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-black rounded-xl shadow-lg shadow-blue-200 flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50"
                        >
                            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'HOÀN TẤT ĐĂNG KÝ'}
                        </button>
                    </form>

                    <p className="text-center text-xs text-gray-400 mt-6">
                        Bằng việc đăng ký, bạn đồng ý tham gia mạng lưới thợ uy tín của SmartBuild.
                    </p>
                </div>
            </div>
        </div>
    )
}

export default function ClaimProfilePage() {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Đang tải...</div>}>
            <ClaimProfileContent />
        </Suspense>
    )
}
