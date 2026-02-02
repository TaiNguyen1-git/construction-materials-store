'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { User, Mail, Phone, MapPin, Lock, Save, Eye, EyeOff, AlertCircle, CheckCircle, Shield, ShieldCheck, Loader2 } from 'lucide-react'
import { fetchWithAuth } from '@/lib/api-client'
import OTPModal from '@/components/auth/OTPModal'
import toast, { Toaster } from 'react-hot-toast'

export default function AdminProfilePage() {
    const { user, refreshUser } = useAuth()
    const [isLoading, setIsLoading] = useState(false)
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

    // 2FA State
    const [otpModal, setOtpModal] = useState({ isOpen: false, updateToken: '' })
    const [otpLoading, setOtpLoading] = useState(false)
    const [highlight2FA, setHighlight2FA] = useState(false)

    // Profile form
    const [profileData, setProfileData] = useState({
        name: '',
        email: '',
        phone: '',
        address: ''
    })

    // Password form
    const [passwordData, setPasswordData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    })
    const [showPasswords, setShowPasswords] = useState(false)

    useEffect(() => {
        if (user) {
            setProfileData({
                name: user.name || '',
                email: user.email || '',
                phone: user.phone || '',
                address: user.address || ''
            })
        }
    }, [user])

    // Handle setup2fa query param
    useEffect(() => {
        if (typeof window === 'undefined') return
        const urlParams = new URLSearchParams(window.location.search)
        if (urlParams.get('setup2fa') === 'true' && user && !user.is2FAEnabled) {
            setHighlight2FA(true)
            const securitySection = document.getElementById('security-section')
            securitySection?.scrollIntoView({ behavior: 'smooth' })
            setTimeout(() => setHighlight2FA(false), 5000)
        }
    }, [user])

    const handleProfileSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)
        setMessage(null)

        try {
            const response = await fetch('/api/admin/profile', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(profileData)
            })

            const data = await response.json()

            if (data.success) {
                setMessage({ type: 'success', text: 'Cập nhật thông tin thành công!' })
                refreshUser?.()
            } else {
                setMessage({ type: 'error', text: data.error || 'Có lỗi xảy ra' })
            }
        } catch (err) {
            setMessage({ type: 'error', text: 'Có lỗi xảy ra. Vui lòng thử lại.' })
        } finally {
            setIsLoading(false)
        }
    }

    const handlePasswordSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)
        setMessage(null)

        if (passwordData.newPassword !== passwordData.confirmPassword) {
            setMessage({ type: 'error', text: 'Mật khẩu xác nhận không khớp' })
            setIsLoading(false)
            return
        }

        if (passwordData.newPassword.length < 6) {
            setMessage({ type: 'error', text: 'Mật khẩu mới phải có ít nhất 6 ký tự' })
            setIsLoading(false)
            return
        }

        try {
            const response = await fetch('/api/admin/profile/password', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    currentPassword: passwordData.currentPassword,
                    newPassword: passwordData.newPassword
                })
            })

            const data = await response.json()

            if (data.success) {
                setMessage({ type: 'success', text: 'Đổi mật khẩu thành công!' })
                setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' })
            } else {
                setMessage({ type: 'error', text: data.error || 'Có lỗi xảy ra' })
            }
        } catch (err) {
            setMessage({ type: 'error', text: 'Có lỗi xảy ra. Vui lòng thử lại.' })
        } finally {
            setIsLoading(false)
        }
    }

    const handleToggle2FA = async (otp?: string) => {
        const isEnabling = !user?.is2FAEnabled

        if (otp) setOtpLoading(true)
        else setIsLoading(true)

        try {
            const res = await fetchWithAuth('/api/auth/profile/toggle-2fa', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ enabled: isEnabling, otp })
            })

            const data = await res.json()

            if (res.ok && data.success) {
                if (data.requiresOtp) {
                    setOtpModal({
                        isOpen: true,
                        updateToken: 'toggle-2fa'
                    })
                } else {
                    toast.success(data.message)
                    setOtpModal({ isOpen: false, updateToken: '' })
                    refreshUser?.()
                }
            } else {
                toast.error(data.error || 'Thao tác thất bại')
                if (otp) throw new Error(data.error)
            }
        } catch (error: any) {
            if (!otp) toast.error('Lỗi kết nối server')
            throw error
        } finally {
            if (otp) setOtpLoading(false)
            else setIsLoading(false)
        }
    }

    const getRoleName = (role: string) => {
        const roles: Record<string, string> = {
            'MANAGER': 'Quản lý',
            'EMPLOYEE': 'Nhân viên',
            'CUSTOMER': 'Khách hàng'
        }
        return roles[role] || role
    }

    return (
        <div className="space-y-6">
            <Toaster position="top-right" />
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Hồ Sơ Cá Nhân</h1>
                <p className="text-gray-600">Quản lý thông tin tài khoản của bạn</p>
            </div>

            {/* Message */}
            {message && (
                <div className={`p-4 rounded-xl flex items-center gap-3 ${message.type === 'success'
                    ? 'bg-green-50 border-2 border-green-200 text-green-700'
                    : 'bg-red-50 border-2 border-red-200 text-red-700'
                    }`}>
                    {message.type === 'success' ? (
                        <CheckCircle className="h-5 w-5" />
                    ) : (
                        <AlertCircle className="h-5 w-5" />
                    )}
                    <p className="font-medium">{message.text}</p>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Profile Info Card */}
                <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="bg-gradient-to-r from-primary-500 to-secondary-500 p-3 rounded-xl">
                            <User className="h-6 w-6 text-white" />
                        </div>
                        <div>
                            <h2 className="text-lg font-semibold text-gray-900">Thông Tin Cơ Bản</h2>
                            <p className="text-sm text-gray-500">Cập nhật thông tin cá nhân</p>
                        </div>
                    </div>

                    <form onSubmit={handleProfileSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                <User className="h-4 w-4 inline mr-1" /> Họ tên
                            </label>
                            <input
                                type="text"
                                value={profileData.name}
                                onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                                className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                <Mail className="h-4 w-4 inline mr-1" /> Email
                            </label>
                            <input
                                type="email"
                                value={profileData.email}
                                onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                                className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                <Phone className="h-4 w-4 inline mr-1" /> Số điện thoại
                            </label>
                            <input
                                type="tel"
                                value={profileData.phone}
                                onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                                className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                <MapPin className="h-4 w-4 inline mr-1" /> Địa chỉ
                            </label>
                            <textarea
                                value={profileData.address}
                                onChange={(e) => setProfileData({ ...profileData, address: e.target.value })}
                                rows={2}
                                className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                            />
                        </div>

                        <div className="pt-2">
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-gradient-to-r from-primary-500 to-secondary-500 text-white rounded-xl font-semibold hover:from-primary-600 hover:to-secondary-600 transition-all disabled:opacity-50"
                            >
                                <Save className="h-5 w-5" />
                                {isLoading ? 'Đang lưu...' : 'Lưu thay đổi'}
                            </button>
                        </div>
                    </form>
                </div>

                {/* Password Change Card */}
                <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="bg-gradient-to-r from-orange-500 to-red-500 p-3 rounded-xl">
                            <Lock className="h-6 w-6 text-white" />
                        </div>
                        <div>
                            <h2 className="text-lg font-semibold text-gray-900">Đổi Mật Khẩu</h2>
                            <p className="text-sm text-gray-500">Cập nhật mật khẩu đăng nhập</p>
                        </div>
                    </div>

                    <form onSubmit={handlePasswordSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Mật khẩu hiện tại
                            </label>
                            <div className="relative">
                                <input
                                    type={showPasswords ? 'text' : 'password'}
                                    value={passwordData.currentPassword}
                                    onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                                    className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 pr-12"
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPasswords(!showPasswords)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                >
                                    {showPasswords ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                </button>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Mật khẩu mới
                            </label>
                            <input
                                type={showPasswords ? 'text' : 'password'}
                                value={passwordData.newPassword}
                                onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                                className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                                required
                                minLength={6}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Xác nhận mật khẩu mới
                            </label>
                            <input
                                type={showPasswords ? 'text' : 'password'}
                                value={passwordData.confirmPassword}
                                onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                                className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                                required
                            />
                        </div>

                        <div className="pt-2">
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl font-semibold hover:from-orange-600 hover:to-red-600 transition-all disabled:opacity-50"
                            >
                                <Lock className="h-5 w-5" />
                                {isLoading ? 'Đang xử lý...' : 'Đổi mật khẩu'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>

            {/* Two-Factor Authentication Card */}
            <div id="security-section">
                <div className={`bg-white rounded-xl shadow-lg border transition-all duration-500 p-6 ${highlight2FA ? 'ring-4 ring-indigo-500 ring-opacity-30 border-indigo-500 animate-pulse-gentle' : 'border-gray-100'}`}>
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                            <div className="bg-gradient-to-r from-indigo-500 to-primary-500 p-3 rounded-xl shadow-md">
                                <ShieldCheck className="h-6 w-6 text-white" />
                            </div>
                            <div>
                                <h2 className="text-lg font-semibold text-gray-900">Xác thực 2 lớp (2FA)</h2>
                                <p className="text-sm text-gray-500">Tăng cường bảo mật đăng nhập</p>
                            </div>
                        </div>
                        <div className="flex items-center">
                            <button
                                onClick={() => handleToggle2FA()}
                                disabled={isLoading}
                                className={`relative inline-flex h-7 w-12 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${user?.is2FAEnabled ? 'bg-indigo-600' : 'bg-gray-200'}`}
                            >
                                <span
                                    className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${user?.is2FAEnabled ? 'translate-x-5' : 'translate-x-0'}`}
                                />
                            </button>
                        </div>
                    </div>

                    <div className="bg-indigo-50/50 border border-indigo-100 rounded-xl p-5 flex gap-4">
                        <div className="bg-white p-2 rounded-lg h-fit shadow-sm border border-indigo-100">
                            <Shield className="w-5 h-5 text-indigo-600" />
                        </div>
                        <div className="flex-1">
                            <p className="text-sm font-bold text-indigo-900 mb-1">
                                {user?.is2FAEnabled ? 'Tài khoản của bạn đang được bảo vệ!' : 'Kích hoạt lớp bảo mật bổ sung'}
                            </p>
                            <p className="text-xs text-indigo-700 leading-relaxed max-w-2xl">
                                Khi kích hoạt 2FA, hệ thống sẽ yêu cầu một mã OTP được gửi qua email của bạn mỗi khi thực hiện đăng nhập. Điều này giúp ngăn chặn truy cập trái phép ngay cả khi mật khẩu của bạn bị lộ.
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Account Info */}
            <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Thông Tin Tài Khoản</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div className="bg-gray-50 rounded-xl p-4">
                        <p className="text-gray-500 mb-1">ID Tài khoản</p>
                        <p className="font-medium text-gray-900 font-mono text-xs">{user?.id}</p>
                    </div>
                    <div className="bg-gray-50 rounded-xl p-4">
                        <p className="text-gray-500 mb-1">Vai trò</p>
                        <p className="font-medium text-gray-900">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-medium ${user?.role === 'MANAGER' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'
                                }`}>
                                {getRoleName(user?.role || '')}
                            </span>
                        </p>
                    </div>
                    <div className="bg-gray-50 rounded-xl p-4">
                        <p className="text-gray-500 mb-1">Trạng thái</p>
                        <p className="font-medium text-green-600">✓ Đang hoạt động</p>
                    </div>
                </div>
            </div>

            {user && (
                <OTPModal
                    isOpen={otpModal.isOpen}
                    email={user.email}
                    title="Xác thực bảo mật 2 lớp"
                    description="Vui lòng nhập mã OTP để xác nhận thay đổi cài đặt bảo mật cho email:"
                    isLoading={otpLoading}
                    onClose={() => setOtpModal({ ...otpModal, isOpen: false })}
                    onVerify={handleToggle2FA}
                />
            )}
        </div>
    )
}
