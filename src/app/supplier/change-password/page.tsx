'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Lock, Save, AlertCircle } from 'lucide-react'
import toast from 'react-hot-toast'

export default function ChangePasswordPage() {
    const router = useRouter()
    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [loading, setLoading] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (password !== confirmPassword) {
            toast.error('Mật khẩu xác nhận không khớp')
            return
        }
        if (password.length < 6) {
            toast.error('Mật khẩu phải có ít nhất 6 ký tự')
            return
        }

        setLoading(true)
        try {
            const res = await fetch('/api/supplier/change-password', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('supplier_token')}`
                },
                body: JSON.stringify({ password })
            })
            const data = await res.json()

            if (data.success) {
                toast.success('Đổi mật khẩu thành công!')
                router.push('/supplier/dashboard')
            } else {
                toast.error(data.error?.message || 'Đổi mật khẩu thất bại')
            }
        } catch (error) {
            toast.error('Lỗi hệ thống')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
            <div className="w-full max-w-md bg-white rounded-3xl shadow-xl p-8 border border-slate-100">
                <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <Lock className="w-8 h-8" />
                    </div>
                    <h1 className="text-2xl font-black text-slate-900">Thiết Lập Mật Khẩu Mới</h1>
                    <p className="text-slate-500 text-sm mt-2">
                        Để bảo mật tài khoản, vui lòng đổi mật khẩu trong lần đăng nhập đầu tiên.
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Mật khẩu mới</label>
                        <input
                            type="password"
                            required
                            className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-blue-500/20 font-bold text-slate-900"
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Xác nhận mật khẩu</label>
                        <input
                            type="password"
                            required
                            className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-blue-500/20 font-bold text-slate-900"
                            placeholder="••••••••"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-4 bg-blue-600 text-white font-black uppercase tracking-widest rounded-xl hover:bg-blue-700 transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20"
                    >
                        {loading ? (
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                            <>
                                <Save size={18} />
                                Lưu Thay Đổi
                            </>
                        )}
                    </button>
                </form>
            </div>
        </div>
    )
}
