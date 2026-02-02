'use client'

import { useState, useEffect } from 'react'
import { User, Building, CreditCard, Save, Loader2, Info, Lock } from 'lucide-react'
import toast from 'react-hot-toast'

export default function SupplierProfilePage() {
    const [profile, setProfile] = useState<any>({
        name: '',
        contactPerson: '',
        email: '',
        phone: '',
        address: '',
        taxId: '',
        bankName: '',
        bankAccountNumber: '',
        bankAccountName: '',
    })
    const [passwords, setPasswords] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    })
    const [loading, setLoading] = useState(true)
    const [isSaving, setIsSaving] = useState(false)

    useEffect(() => {
        const fetchProfile = async () => {
            const supplierId = localStorage.getItem('supplier_id')
            if (!supplierId) return

            try {
                const res = await fetch(`/api/supplier/profile?supplierId=${supplierId}`)
                const result = await res.json()
                if (result.success) {
                    setProfile(result.data)
                }
            } catch (error) {
                toast.error('Lỗi tải thông tin')
            } finally {
                setLoading(false)
            }
        }
        fetchProfile()
    }, [])

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setProfile({ ...profile, [e.target.name]: e.target.value })
    }

    const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setPasswords({ ...passwords, [e.target.name]: e.target.value })
    }

    const handleChangePasswordSubmit = async () => {
        if (passwords.newPassword !== passwords.confirmPassword) {
            toast.error('Mật khẩu mới không khớp')
            return
        }
        if (!passwords.currentPassword) {
            toast.error('Vui lòng nhập mật khẩu hiện tại')
            return
        }

        setIsSaving(true)
        const supplierId = localStorage.getItem('supplier_id')

        try {
            const res = await fetch('/api/supplier/profile', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    supplierId,
                    currentPassword: passwords.currentPassword,
                    newPassword: passwords.newPassword
                })
            })

            const result = await res.json()
            if (result.success) {
                toast.success('Đổi mật khẩu thành công')
                setPasswords({ currentPassword: '', newPassword: '', confirmPassword: '' })
            } else {
                toast.error(result.message || 'Lỗi đổi mật khẩu')
            }
        } catch (error) {
            toast.error('Lỗi kết nối')
        } finally {
            setIsSaving(false)
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsSaving(true)
        const supplierId = localStorage.getItem('supplier_id')

        try {
            const res = await fetch('/api/supplier/profile', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...profile, supplierId })
            })

            const result = await res.json()
            if (result.success) {
                toast.success('Cập nhật thông tin thành công')
            } else {
                toast.error(result.message || 'Lỗi cập nhật')
            }
        } catch (error) {
            toast.error('Lỗi kết nối')
        } finally {
            setIsSaving(false)
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-900"></div>
            </div>
        )
    }

    return (
        <div className="max-w-4xl mx-auto pb-20 space-y-8">
            <div className="space-y-2">
                <h1 className="text-3xl font-black text-slate-900 tracking-tight">Hồ Sơ Nhà Cung Cấp</h1>
                <p className="text-slate-500 font-medium">Quản lý thông tin doanh nghiệp và tài khoản nhận thanh toán.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8">
                {/* General Info */}
                <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-slate-200">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 bg-slate-100 rounded-lg">
                            <Building className="w-5 h-5 text-slate-700" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">Thông tin chung</h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Tên doanh nghiệp</label>
                            <input
                                name="name"
                                value={profile.name || ''}
                                onChange={handleChange}
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Mã số thuế</label>
                            <input
                                name="taxId"
                                value={profile.taxId || ''}
                                onChange={handleChange}
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Người liên hệ</label>
                            <input
                                name="contactPerson"
                                value={profile.contactPerson || ''}
                                onChange={handleChange}
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Email</label>
                            <input
                                name="email"
                                value={profile.email || ''}
                                onChange={handleChange}
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
                            />
                        </div>
                    </div>
                </div>

                {/* Bank Info */}
                <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-slate-200">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 bg-emerald-100 rounded-lg">
                            <CreditCard className="w-5 h-5 text-emerald-700" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">Tài khoản nhận tiền</h2>
                    </div>

                    <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-4 mb-6 flex items-start gap-3">
                        <Info className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
                        <p className="text-sm text-indigo-800 font-medium">Đây là tài khoản mặc định để nhận các khoản thanh toán từ hệ thống. Vui lòng kiểm tra kỹ.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Ngân hàng</label>
                            <input
                                name="bankName"
                                placeholder="VD: Vietcombank, Techcombank..."
                                value={profile.bankName || ''}
                                onChange={handleChange}
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Số tài khoản</label>
                            <input
                                name="bankAccountNumber"
                                value={profile.bankAccountNumber || ''}
                                onChange={handleChange}
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                            />
                        </div>
                        <div className="space-y-2 md:col-span-2">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Tên chủ tài khoản</label>
                            <input
                                name="bankAccountName"
                                value={profile.bankAccountName || ''}
                                onChange={handleChange}
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 uppercase"
                            />
                        </div>
                    </div>
                </div>

                {/* Security Info */}
                <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-slate-200">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 bg-rose-100 rounded-lg">
                            <Lock className="w-5 h-5 text-rose-700" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">Bảo mật tài khoản</h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Mật khẩu hiện tại</label>
                            <input
                                type="password"
                                name="currentPassword"
                                placeholder="••••••••"
                                value={passwords.currentPassword}
                                onChange={handlePasswordChange}
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-500"
                            />
                        </div>
                        <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-100">
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Mật khẩu mới</label>
                                <input
                                    type="password"
                                    name="newPassword"
                                    placeholder="Nhập mật khẩu mới"
                                    value={passwords.newPassword}
                                    onChange={handlePasswordChange}
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-500"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Xác nhận mật khẩu mới</label>
                                <input
                                    type="password"
                                    name="confirmPassword"
                                    placeholder="Nhập lại mật khẩu mới"
                                    value={passwords.confirmPassword}
                                    onChange={handlePasswordChange}
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-500"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex justify-end gap-4">
                    <button
                        type="button"
                        onClick={handleChangePasswordSubmit}
                        disabled={isSaving || !passwords.newPassword}
                        className="px-6 py-4 bg-white text-rose-600 font-bold rounded-2xl border border-rose-200 hover:bg-rose-50 transition-all active:scale-95 disabled:opacity-50"
                    >
                        Đổi mật khẩu
                    </button>
                    <button
                        type="submit"
                        disabled={isSaving}
                        className="flex items-center gap-2 px-8 py-4 bg-slate-900 text-white font-bold rounded-2xl hover:bg-slate-800 transition-all shadow-xl active:scale-95 disabled:opacity-70"
                    >
                        {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                        Lưu thông tin
                    </button>
                </div>
            </form>
        </div>
    )
}
