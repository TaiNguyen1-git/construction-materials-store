'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { KeyRound, Eye, EyeOff, CheckCircle, AlertCircle, Loader2, ShieldCheck, Lock, ShieldAlert, Cpu, Sparkles } from 'lucide-react'
import toast from 'react-hot-toast'
import { useAuth } from '@/contexts/auth-context'
import { fetchWithAuth } from '@/lib/api-client'

export default function ChangePasswordPage() {
    const { user } = useAuth()
    const router = useRouter()
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
            toast.error('Current verification token required')
            return
        }

        if (!isPasswordValid) {
            toast.error('New protocol criteria not satisfied')
            return
        }

        if (!passwordsMatch) {
            toast.error('Token synchronization failure: Confirm mismatch')
            return
        }

        setLoading(true)
        try {
            const res = await fetchWithAuth('/api/auth/change-password', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    currentPassword: form.currentPassword,
                    newPassword: form.newPassword
                })
            })

            const data = await res.json()

            if (res.ok && data.success) {
                toast.success('Security protocol updated successfully!')
                setForm({ currentPassword: '', newPassword: '', confirmPassword: '' })
            } else {
                toast.error(data.error || data.message || 'Escalation failed')
            }
        } catch (error) {
            toast.error('Network integrity failure')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="space-y-6 animate-in fade-in duration-500 pb-12 max-w-4xl mx-auto">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6 border-b border-slate-100">
                <div className="space-y-1">
                    <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                        <Lock className="w-6 h-6 text-blue-600" />
                        Đổi Mật Khẩu
                    </h1>
                    <p className="text-sm text-slate-500">Cập nhật mật khẩu & Bảo mật tài khoản</p>
                </div>

                <div className="hidden md:flex items-center gap-2 text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-100 text-sm font-medium">
                    <ShieldCheck size={16} /> Danh tính: {user?.name || 'Hệ thống'}
                </div>
            </div>

            {/* Main Security Console */}
            <div className="grid grid-cols-1 gap-6">
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden relative">
                    <div className="p-8">
                        <div className="flex items-center gap-4 mb-8 pb-6 border-b border-slate-100">
                            <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
                                <KeyRound size={24} />
                            </div>
                            <div>
                                <h2 className="text-lg font-bold text-slate-900">Thiết lập Mật khẩu mới</h2>
                                <p className="text-sm text-slate-500">Vui lòng nhập mật khẩu hiện tại để xác thực</p>
                            </div>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-6 max-w-xl">
                            {/* Current Password */}
                            <div className="space-y-2">
                                <label className="block text-sm font-bold text-slate-700">Mật khẩu hiện tại</label>
                                <div className="relative group">
                                    <input
                                        type={showPasswords.current ? 'text' : 'password'}
                                        value={form.currentPassword}
                                        onChange={(e) => setForm({ ...form, currentPassword: e.target.value })}
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 outline-none text-sm transition-all"
                                        placeholder="Nhập mật khẩu hiện tại..."
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPasswords({ ...showPasswords, current: !showPasswords.current })}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-slate-400 hover:text-blue-600 hover:bg-slate-100 rounded-lg transition-all"
                                    >
                                        {showPasswords.current ? <EyeOff size={16} /> : <Eye size={16} />}
                                    </button>
                                </div>
                            </div>

                            {/* New Password Matrix */}
                            <div className="space-y-2">
                                <label className="block text-sm font-bold text-slate-700">Mật khẩu mới</label>
                                <div className="relative group">
                                    <input
                                        type={showPasswords.new ? 'text' : 'password'}
                                        value={form.newPassword}
                                        onChange={(e) => setForm({ ...form, newPassword: e.target.value })}
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 outline-none text-sm transition-all"
                                        placeholder="Nhập mật khẩu mới..."
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPasswords({ ...showPasswords, new: !showPasswords.new })}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-slate-400 hover:text-blue-600 hover:bg-slate-100 rounded-lg transition-all"
                                    >
                                        {showPasswords.new ? <EyeOff size={16} /> : <Eye size={16} />}
                                    </button>
                                </div>

                                {/* Real-time Requirement Telemetry */}
                                {form.newPassword && (
                                    <div className="grid grid-cols-3 gap-3 mt-4">
                                        <div className={`p-3 rounded-xl flex items-center gap-2 transition-all ${passwordChecks.length ? 'bg-emerald-50 border border-emerald-100 text-emerald-600' : 'bg-slate-50 border border-slate-100 text-slate-400'}`}>
                                            {passwordChecks.length ? <CheckCircle size={14} /> : <AlertCircle size={14} />}
                                            <span className="text-xs font-semibold">Tối thiểu 6 ký tự</span>
                                        </div>
                                        <div className={`p-3 rounded-xl flex items-center gap-2 transition-all ${passwordChecks.hasLetter ? 'bg-emerald-50 border border-emerald-100 text-emerald-600' : 'bg-slate-50 border border-slate-100 text-slate-400'}`}>
                                            {passwordChecks.hasLetter ? <CheckCircle size={14} /> : <AlertCircle size={14} />}
                                            <span className="text-xs font-semibold">Chứa chữ cái</span>
                                        </div>
                                        <div className={`p-3 rounded-xl flex items-center gap-2 transition-all ${passwordChecks.hasNumber ? 'bg-emerald-50 border border-emerald-100 text-emerald-600' : 'bg-slate-50 border border-slate-100 text-slate-400'}`}>
                                            {passwordChecks.hasNumber ? <CheckCircle size={14} /> : <AlertCircle size={14} />}
                                            <span className="text-xs font-semibold">Chứa chữ số</span>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Confirm Password */}
                            <div className="space-y-2">
                                <label className="block text-sm font-bold text-slate-700">Xác nhận mật khẩu</label>
                                <div className="relative group">
                                    <input
                                        type={showPasswords.confirm ? 'text' : 'password'}
                                        value={form.confirmPassword}
                                        onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                                        className={`w-full px-4 py-3 bg-slate-50 border rounded-xl outline-none text-sm transition-all focus:bg-white focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 ${form.confirmPassword && !passwordsMatch
                                            ? 'border-rose-300'
                                            : form.confirmPassword && passwordsMatch
                                                ? 'border-emerald-300'
                                                : 'border-slate-200'
                                        }`}
                                        placeholder="Nhập lại mật khẩu mới..."
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPasswords({ ...showPasswords, confirm: !showPasswords.confirm })}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-slate-400 hover:text-blue-600 hover:bg-slate-100 rounded-lg transition-all"
                                    >
                                        {showPasswords.confirm ? <EyeOff size={16} /> : <Eye size={16} />}
                                    </button>
                                </div>
                                {form.confirmPassword && !passwordsMatch && (
                                    <p className="flex items-center gap-2 text-xs font-medium text-rose-600 mt-2">
                                        <ShieldAlert size={14} /> Mật khẩu xác nhận không khớp
                                    </p>
                                )}
                            </div>

                            {/* Execute Block */}
                            <div className="pt-4">
                                <button
                                    type="submit"
                                    disabled={loading || !isPasswordValid || !passwordsMatch || !form.currentPassword}
                                    className="w-full py-4 bg-blue-600 text-white rounded-xl text-sm font-bold shadow-sm hover:bg-blue-700 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed group/btn"
                                >
                                    {loading ? (
                                        <Loader2 size={18} className="animate-spin" />
                                    ) : (
                                        <CheckCircle size={18} />
                                    )}
                                    {loading ? 'Đang cập nhật mật khẩu...' : 'Xác nhận Đổi Mật khẩu'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>

            {/* Advisory */}
            <div className="bg-slate-50 rounded-2xl p-8 border border-slate-200">
                <div className="flex flex-col md:flex-row items-start gap-6">
                    <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center flex-shrink-0">
                        <ShieldCheck size={24} className="text-emerald-600" />
                    </div>
                    <div className="space-y-4">
                        <h3 className="text-lg font-bold text-slate-900">Khuyến nghị Bảo mật Hệ thống</h3>
                        <div className="grid md:grid-cols-3 gap-6">
                            <div className="space-y-1">
                                <p className="text-sm font-bold text-slate-700">Mật khẩu Độc lập</p>
                                <p className="text-xs text-slate-500">Sử dụng mật khẩu riêng biệt cho tài khoản Contractor để tránh rủi ro bảo mật chéo.</p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-sm font-bold text-slate-700">Chu kỳ Cập nhật</p>
                                <p className="text-xs text-slate-500">Khuyến cáo thay đổi mật khẩu định kỳ 90 ngày để đảm bảo an toàn cao nhất.</p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-sm font-bold text-slate-700">Quyền riêng tư</p>
                                <p className="text-xs text-slate-500">Hệ thống sẽ không bao giờ yêu cầu cung cấp mật khẩu qua email hay điện thoại.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
