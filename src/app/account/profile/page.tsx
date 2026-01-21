'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import toast, { Toaster } from 'react-hot-toast'
import {
    ArrowLeft,
    User,
    Mail,
    Phone,
    MapPin,
    Save,
    Loader2,
    Camera,
    Shield,
    Eye,
    EyeOff,
    CheckCircle
} from 'lucide-react'
import { useAuth } from '@/contexts/auth-context'

export default function ProfilePage() {
    const router = useRouter()
    const { user, isAuthenticated, isLoading: authLoading, refreshUser } = useAuth()
    const [loading, setLoading] = useState(false)
    const [saving, setSaving] = useState(false)

    const [profile, setProfile] = useState({
        name: '',
        email: '',
        phone: '',
        address: ''
    })

    const [passwordForm, setPasswordForm] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    })
    const [showPasswords, setShowPasswords] = useState({
        current: false,
        new: false,
        confirm: false
    })
    const [changingPassword, setChangingPassword] = useState(false)

    useEffect(() => {
        if (!authLoading && !isAuthenticated) {
            router.push('/login')
        }
    }, [authLoading, isAuthenticated, router])

    useEffect(() => {
        if (user) {
            setProfile({
                name: user.name || '',
                email: user.email || '',
                phone: user.phone || '',
                address: user.address || ''
            })
        }
    }, [user])

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target
        setProfile(prev => ({ ...prev, [name]: value }))
    }

    const handleSaveProfile = async () => {
        if (!profile.name.trim()) {
            toast.error('Vui lòng nhập họ tên')
            return
        }

        setSaving(true)
        try {
            const token = localStorage.getItem('access_token')
            const res = await fetch('/api/auth/update-profile', {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    name: profile.name,
                    phone: profile.phone,
                    address: profile.address
                })
            })

            if (res.ok) {
                toast.success('Cập nhật thông tin thành công!')
                refreshUser?.()
            } else {
                const error = await res.json()
                toast.error(error.message || 'Cập nhật thất bại')
            }
        } catch (error) {
            toast.error('Lỗi kết nối server')
        } finally {
            setSaving(false)
        }
    }

    const handleChangePassword = async () => {
        if (!passwordForm.currentPassword) {
            toast.error('Vui lòng nhập mật khẩu hiện tại')
            return
        }
        if (passwordForm.newPassword.length < 6) {
            toast.error('Mật khẩu mới phải có ít nhất 6 ký tự')
            return
        }
        if (passwordForm.newPassword !== passwordForm.confirmPassword) {
            toast.error('Mật khẩu xác nhận không khớp')
            return
        }

        setChangingPassword(true)
        try {
            const token = localStorage.getItem('access_token')
            const res = await fetch('/api/auth/change-password', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    currentPassword: passwordForm.currentPassword,
                    newPassword: passwordForm.newPassword
                })
            })

            const data = await res.json()
            if (res.ok && data.success) {
                toast.success('Đổi mật khẩu thành công!')
                setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' })
            } else {
                toast.error(data.error || 'Đổi mật khẩu thất bại')
            }
        } catch (error) {
            toast.error('Lỗi kết nối server')
        } finally {
            setChangingPassword(false)
        }
    }

    if (authLoading) {
        return (
            <div className="flex items-center justify-center h-screen bg-gray-50">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
            </div>
        )
    }

    if (!user) return null

    return (
        <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 py-8">
            <Toaster position="top-right" />
            <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="mb-8">
                    <Link href="/account" className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-4">
                        <ArrowLeft className="w-5 h-5 mr-2" />
                        Quay lại
                    </Link>
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-primary-600 to-secondary-600 bg-clip-text text-transparent">
                        Thông Tin Cá Nhân
                    </h1>
                    <p className="mt-2 text-gray-600">Cập nhật thông tin và bảo mật tài khoản của bạn</p>
                </div>

                {/* Avatar Section */}
                <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-6 mb-6">
                    <div className="flex items-center gap-6">
                        <div className="relative">
                            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center text-white text-3xl font-bold">
                                {user.name?.charAt(0).toUpperCase()}
                            </div>
                            <button className="absolute bottom-0 right-0 w-8 h-8 bg-white rounded-full shadow-lg flex items-center justify-center border border-gray-200 hover:bg-gray-50">
                                <Camera className="w-4 h-4 text-gray-600" />
                            </button>
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-gray-900">{user.name}</h2>
                            <p className="text-gray-500">{user.email}</p>
                            <div className="mt-2 flex items-center gap-2">
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                    <CheckCircle className="w-3 h-3 mr-1" />
                                    Đã xác thực
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Profile Form */}
                <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-6 mb-6">
                    <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                        <User className="w-5 h-5 text-blue-600" />
                        Thông tin cơ bản
                    </h3>
                    <div className="space-y-5">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Họ và tên
                            </label>
                            <div className="relative">
                                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                <input
                                    type="text"
                                    name="name"
                                    value={profile.name}
                                    onChange={handleChange}
                                    className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-100 focus:border-blue-400 outline-none transition-all"
                                    placeholder="Nhập họ và tên"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Email
                            </label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                <input
                                    type="email"
                                    name="email"
                                    value={profile.email}
                                    disabled
                                    className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl bg-gray-50 text-gray-500 cursor-not-allowed"
                                />
                            </div>
                            <p className="mt-1 text-xs text-gray-500">Email không thể thay đổi</p>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Số điện thoại
                            </label>
                            <div className="relative">
                                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                <input
                                    type="tel"
                                    name="phone"
                                    value={profile.phone}
                                    onChange={handleChange}
                                    className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-100 focus:border-blue-400 outline-none transition-all"
                                    placeholder="Nhập số điện thoại"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Địa chỉ
                            </label>
                            <div className="relative">
                                <MapPin className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                                <textarea
                                    name="address"
                                    value={profile.address}
                                    onChange={handleChange}
                                    rows={2}
                                    className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-100 focus:border-blue-400 outline-none transition-all resize-none"
                                    placeholder="Nhập địa chỉ"
                                />
                            </div>
                        </div>

                        <button
                            onClick={handleSaveProfile}
                            disabled={saving}
                            className="w-full py-3.5 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 disabled:from-gray-300 disabled:to-gray-400 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2"
                        >
                            {saving ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    Đang lưu...
                                </>
                            ) : (
                                <>
                                    <Save className="w-5 h-5" />
                                    Lưu thay đổi
                                </>
                            )}
                        </button>
                    </div>
                </div>

                {/* Password Section */}
                <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-6">
                    <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                        <Shield className="w-5 h-5 text-orange-600" />
                        Bảo mật tài khoản
                    </h3>
                    <div className="space-y-5">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Mật khẩu hiện tại
                            </label>
                            <div className="relative">
                                <input
                                    type={showPasswords.current ? 'text' : 'password'}
                                    value={passwordForm.currentPassword}
                                    onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
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

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Mật khẩu mới
                            </label>
                            <div className="relative">
                                <input
                                    type={showPasswords.new ? 'text' : 'password'}
                                    value={passwordForm.newPassword}
                                    onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-100 focus:border-blue-400 outline-none transition-all"
                                    placeholder="Nhập mật khẩu mới (ít nhất 6 ký tự)"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPasswords({ ...showPasswords, new: !showPasswords.new })}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                >
                                    {showPasswords.new ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                </button>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Xác nhận mật khẩu mới
                            </label>
                            <div className="relative">
                                <input
                                    type={showPasswords.confirm ? 'text' : 'password'}
                                    value={passwordForm.confirmPassword}
                                    onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-100 focus:border-blue-400 outline-none transition-all"
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
                        </div>

                        <button
                            onClick={handleChangePassword}
                            disabled={changingPassword}
                            className="w-full py-3.5 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 disabled:from-gray-300 disabled:to-gray-400 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2"
                        >
                            {changingPassword ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    Đang xử lý...
                                </>
                            ) : (
                                <>
                                    <Shield className="w-5 h-5" />
                                    Đổi mật khẩu
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}
