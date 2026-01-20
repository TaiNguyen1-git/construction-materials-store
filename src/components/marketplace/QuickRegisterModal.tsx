'use client'

/**
 * Quick Registration Modal
 * Shows after guest application to convert them to registered users
 */

import { useState } from 'react'
import { X, UserPlus, Check, Gift, Bell, TrendingUp, Shield } from 'lucide-react'
import toast from 'react-hot-toast'

interface QuickRegisterModalProps {
    isOpen: boolean
    onClose: () => void
    guestData: {
        name: string
        phone: string
        email?: string
    }
    onSuccess?: () => void
}

export default function QuickRegisterModal({
    isOpen,
    onClose,
    guestData,
    onSuccess
}: QuickRegisterModalProps) {
    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [submitting, setSubmitting] = useState(false)
    const [agreed, setAgreed] = useState(false)

    const benefits = [
        { icon: Bell, text: 'Nhận thông báo khi có dự án mới phù hợp' },
        { icon: TrendingUp, text: 'Theo dõi trạng thái hồ sơ ứng tuyển' },
        { icon: Gift, text: 'Giảm 5% khi mua vật tư từ SmartBuild' },
        { icon: Shield, text: 'Hồ sơ được gắn nhãn "Thành viên" uy tín hơn' }
    ]

    const handleSubmit = async () => {
        if (!password) {
            toast.error('Vui lòng nhập mật khẩu')
            return
        }
        if (password.length < 6) {
            toast.error('Mật khẩu cần ít nhất 6 ký tự')
            return
        }
        if (password !== confirmPassword) {
            toast.error('Mật khẩu xác nhận không khớp')
            return
        }
        if (!agreed) {
            toast.error('Vui lòng đồng ý với điều khoản')
            return
        }

        setSubmitting(true)

        try {
            const res = await fetch('/api/auth/quick-register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: guestData.name,
                    phone: guestData.phone,
                    email: guestData.email,
                    password
                })
            })

            const data = await res.json()

            if (data.success) {
                // Store tokens
                if (data.data.accessToken) {
                    localStorage.setItem('access_token', data.data.accessToken)
                }
                if (data.data.user) {
                    localStorage.setItem('user', JSON.stringify(data.data.user))
                }
                if (data.data.customerId) {
                    localStorage.setItem('customer_id', data.data.customerId)
                }

                toast.success('Đăng ký thành công! Chào mừng bạn đến SmartBuild')
                onSuccess?.()
                onClose()
            } else {
                toast.error(data.error?.message || 'Đăng ký thất bại')
            }
        } catch (err) {
            toast.error('Lỗi kết nối')
        } finally {
            setSubmitting(false)
        }
    }

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl max-w-md w-full overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200">
                {/* Header with gradient */}
                <div className="bg-gradient-to-r from-green-500 to-emerald-600 text-white p-6">
                    <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-white/20 rounded-xl">
                                <UserPlus className="w-6 h-6" />
                            </div>
                            <h2 className="text-xl font-bold">Tạo tài khoản miễn phí!</h2>
                        </div>
                        <button onClick={onClose} className="p-1.5 hover:bg-white/20 rounded-full">
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                    <p className="text-green-100 text-sm">
                        Hồ sơ của bạn đã được gửi. Tạo tài khoản để theo dõi kết quả!
                    </p>
                </div>

                {/* Benefits */}
                <div className="p-5 bg-green-50 border-b border-green-100">
                    <p className="text-xs font-semibold text-green-700 mb-3">🎁 QUYỀN LỢI KHI ĐĂNG KÝ:</p>
                    <div className="space-y-2">
                        {benefits.map((benefit, i) => (
                            <div key={i} className="flex items-center gap-2 text-sm text-gray-700">
                                <benefit.icon className="w-4 h-4 text-green-600 flex-shrink-0" />
                                <span>{benefit.text}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Form */}
                <div className="p-5 space-y-4">
                    {/* Pre-filled info */}
                    <div className="p-3 bg-gray-50 rounded-xl border border-gray-200">
                        <p className="text-xs text-gray-500 mb-1">Thông tin của bạn</p>
                        <p className="font-medium text-gray-900">{guestData.name}</p>
                        <p className="text-sm text-gray-600">{guestData.phone}</p>
                        {guestData.email && <p className="text-sm text-gray-600">{guestData.email}</p>}
                    </div>

                    {/* Password */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                            Đặt mật khẩu *
                        </label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Ít nhất 6 ký tự"
                            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                            Xác nhận mật khẩu *
                        </label>
                        <input
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            placeholder="Nhập lại mật khẩu"
                            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        />
                    </div>

                    {/* Agreement */}
                    <label className="flex items-start gap-2 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={agreed}
                            onChange={(e) => setAgreed(e.target.checked)}
                            className="mt-1 w-4 h-4 text-green-600 rounded"
                        />
                        <span className="text-xs text-gray-600">
                            Tôi đồng ý với <a href="/terms" className="text-green-600 hover:underline">Điều khoản sử dụng</a> và <a href="/privacy" className="text-green-600 hover:underline">Chính sách bảo mật</a> của SmartBuild.
                        </span>
                    </label>
                </div>

                {/* Actions */}
                <div className="p-5 pt-0 flex gap-3">
                    <button
                        onClick={onClose}
                        className="flex-1 py-3 border border-gray-300 text-gray-700 font-medium rounded-xl hover:bg-gray-50"
                    >
                        Để sau
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={submitting}
                        className="flex-1 py-3 bg-green-600 text-white font-semibold rounded-xl hover:bg-green-700 disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                        {submitting ? (
                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                            <>
                                <Check className="w-5 h-5" />
                                Tạo tài khoản
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    )
}
