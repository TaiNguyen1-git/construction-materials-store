'use client'

/**
 * Contractor Change Password Page
 * Allows contractors to change their password
 */

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Sidebar from '../components/Sidebar'
import ContractorHeader from '../components/ContractorHeader'
import { KeyRound, Eye, EyeOff, CheckCircle, AlertCircle, Loader2 } from 'lucide-react'
import toast, { Toaster } from 'react-hot-toast'

export default function ChangePasswordPage() {
    const router = useRouter()
    const [sidebarOpen, setSidebarOpen] = useState(true)
    const [user, setUser] = useState<any>(null)
    const [loading, setLoading] = useState(false)

    const [form, setForm] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    })

    const [showPasswords, setShowPasswords] = useState({
        current: false,
        new: false,
        confirm: false
    })

    useEffect(() => {
        const userData = localStorage.getItem('user')
        if (userData) {
            setUser(JSON.parse(userData))
        } else {
            router.push('/login')
        }
    }, [router])

    const validatePassword = (password: string) => {
        const checks = {
            length: password.length >= 6,
            hasNumber: /\d/.test(password),
            hasLetter: /[a-zA-Z]/.test(password)
        }
        return checks
    }

    const passwordChecks = validatePassword(form.newPassword)
    const isPasswordValid = passwordChecks.length && passwordChecks.hasNumber && passwordChecks.hasLetter
    const passwordsMatch = form.newPassword === form.confirmPassword && form.confirmPassword.length > 0

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!form.currentPassword) {
            toast.error('Vui lòng nhập mật khẩu hiện tại')
            return
        }

        if (!isPasswordValid) {
            toast.error('Mật khẩu mới không đáp ứng yêu cầu')
            return
        }

        if (!passwordsMatch) {
            toast.error('Mật khẩu xác nhận không khớp')
            return
        }

        setLoading(true)
        try {
            const token = localStorage.getItem('access_token')
            const res = await fetch('/api/auth/change-password', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    currentPassword: form.currentPassword,
                    newPassword: form.newPassword
                })
            })

            const data = await res.json()

            if (res.ok && data.success) {
                toast.success('Đổi mật khẩu thành công!')
                setForm({ currentPassword: '', newPassword: '', confirmPassword: '' })
            } else {
                toast.error(data.error || data.message || 'Đổi mật khẩu thất bại')
            }
        } catch (error) {
            toast.error('Lỗi kết nối server')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            <Toaster position="top-right" />
            <ContractorHeader sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} user={user} />
            <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

            <main className={`flex-1 pt-[73px] transition-all duration-300 ${sidebarOpen ? 'lg:ml-64' : 'ml-0'}`}>
                <div className="p-6 lg:p-8 max-w-2xl mx-auto">
                    {/* Header */}
                    <div className="mb-8">
                        <h1 className="text-2xl font-bold text-gray-900">Đổi mật khẩu</h1>
                        <p className="text-gray-600 mt-1">Cập nhật mật khẩu để bảo mật tài khoản của bạn</p>
                    </div>

                    {/* Form Card */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
                        <div className="flex items-center gap-4 mb-8 pb-6 border-b border-gray-100">
                            <div className="w-14 h-14 bg-blue-100 rounded-xl flex items-center justify-center">
                                <KeyRound className="w-7 h-7 text-blue-600" />
                            </div>
                            <div>
                                <h2 className="text-lg font-bold text-gray-900">Bảo mật tài khoản</h2>
                                <p className="text-sm text-gray-500">Thay đổi mật khẩu đăng nhập</p>
                            </div>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-6">
                            {/* Current Password */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Mật khẩu hiện tại
                                </label>
                                <div className="relative">
                                    <input
                                        type={showPasswords.current ? 'text' : 'password'}
                                        value={form.currentPassword}
                                        onChange={(e) => setForm({ ...form, currentPassword: e.target.value })}
                                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-100 focus:border-blue-400 outline-none transition-all"
                                        placeholder="Nhập mật khẩu hiện tại"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPasswords({ ...showPasswords, current: !showPasswords.current })}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                    >
                                        {showPasswords.current ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                    </button>
                                </div>
                            </div>

                            {/* New Password */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Mật khẩu mới
                                </label>
                                <div className="relative">
                                    <input
                                        type={showPasswords.new ? 'text' : 'password'}
                                        value={form.newPassword}
                                        onChange={(e) => setForm({ ...form, newPassword: e.target.value })}
                                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-100 focus:border-blue-400 outline-none transition-all"
                                        placeholder="Nhập mật khẩu mới"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPasswords({ ...showPasswords, new: !showPasswords.new })}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                    >
                                        {showPasswords.new ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                    </button>
                                </div>

                                {/* Password Requirements */}
                                {form.newPassword && (
                                    <div className="mt-3 space-y-1">
                                        <div className={`flex items-center gap-2 text-xs ${passwordChecks.length ? 'text-green-600' : 'text-gray-400'}`}>
                                            {passwordChecks.length ? <CheckCircle className="w-3.5 h-3.5" /> : <AlertCircle className="w-3.5 h-3.5" />}
                                            Ít nhất 6 ký tự
                                        </div>
                                        <div className={`flex items-center gap-2 text-xs ${passwordChecks.hasLetter ? 'text-green-600' : 'text-gray-400'}`}>
                                            {passwordChecks.hasLetter ? <CheckCircle className="w-3.5 h-3.5" /> : <AlertCircle className="w-3.5 h-3.5" />}
                                            Có chứa chữ cái
                                        </div>
                                        <div className={`flex items-center gap-2 text-xs ${passwordChecks.hasNumber ? 'text-green-600' : 'text-gray-400'}`}>
                                            {passwordChecks.hasNumber ? <CheckCircle className="w-3.5 h-3.5" /> : <AlertCircle className="w-3.5 h-3.5" />}
                                            Có chứa số
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Confirm Password */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Xác nhận mật khẩu mới
                                </label>
                                <div className="relative">
                                    <input
                                        type={showPasswords.confirm ? 'text' : 'password'}
                                        value={form.confirmPassword}
                                        onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                                        className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-100 outline-none transition-all ${form.confirmPassword && !passwordsMatch
                                                ? 'border-red-300 focus:border-red-400'
                                                : form.confirmPassword && passwordsMatch
                                                    ? 'border-green-300 focus:border-green-400'
                                                    : 'border-gray-200 focus:border-blue-400'
                                            }`}
                                        placeholder="Nhập lại mật khẩu mới"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPasswords({ ...showPasswords, confirm: !showPasswords.confirm })}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                    >
                                        {showPasswords.confirm ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                    </button>
                                </div>
                                {form.confirmPassword && !passwordsMatch && (
                                    <p className="mt-2 text-xs text-red-500 flex items-center gap-1">
                                        <AlertCircle className="w-3.5 h-3.5" />
                                        Mật khẩu không khớp
                                    </p>
                                )}
                                {passwordsMatch && (
                                    <p className="mt-2 text-xs text-green-600 flex items-center gap-1">
                                        <CheckCircle className="w-3.5 h-3.5" />
                                        Mật khẩu khớp
                                    </p>
                                )}
                            </div>

                            {/* Submit Button */}
                            <div className="pt-4">
                                <button
                                    type="submit"
                                    disabled={loading || !isPasswordValid || !passwordsMatch || !form.currentPassword}
                                    className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-bold rounded-xl transition-colors flex items-center justify-center gap-2"
                                >
                                    {loading ? (
                                        <>
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                            Đang xử lý...
                                        </>
                                    ) : (
                                        <>
                                            <KeyRound className="w-5 h-5" />
                                            Đổi mật khẩu
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>

                    {/* Security Tips */}
                    <div className="mt-6 bg-amber-50 border border-amber-100 rounded-xl p-5">
                        <h3 className="font-bold text-amber-800 mb-2">Lưu ý bảo mật</h3>
                        <ul className="text-sm text-amber-700 space-y-1">
                            <li>• Không chia sẻ mật khẩu với bất kỳ ai</li>
                            <li>• Sử dụng mật khẩu khác nhau cho các tài khoản khác nhau</li>
                            <li>• Đổi mật khẩu định kỳ để tăng cường bảo mật</li>
                        </ul>
                    </div>
                </div>
            </main>
        </div>
    )
}
