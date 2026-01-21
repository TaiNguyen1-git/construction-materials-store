'use client'

/**
 * ContractorOnboardingFlow Component
 * Handles mandatory password change and profile completion on first login
 */

import { useState, useEffect } from 'react'
import {
    Lock, User, Camera, Building, MapPin,
    CheckCircle2, AlertCircle, Loader2, Save,
    X, Briefcase, Plus, Trash2, ChevronLeft, ChevronDown
} from 'lucide-react'
import toast from 'react-hot-toast'
import { VIETNAM_LOCATIONS, CONTRACTOR_SKILLS } from '@/lib/vn-data'

interface OnboardingProps {
    user: any
    initialProfile?: any
    onComplete: () => void
    onClose?: () => void
}

export default function ContractorOnboardingFlow({ user, initialProfile, onComplete, onClose }: OnboardingProps) {
    const [step, setStep] = useState<'PASSWORD' | 'PROFILE' | 'DOCUMENT'>(
        user.mustChangePassword ? 'PASSWORD' : 'PROFILE'
    )
    const [loading, setLoading] = useState(false)

    // States for Password Change
    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')

    // States for Profile Update
    // States for Profile Update
    const [profile, setProfile] = useState({
        displayName: initialProfile?.displayName || user.name || '',
        companyName: initialProfile?.companyName || '',
        bio: initialProfile?.bio || '',
        experienceYears: initialProfile?.experienceYears || 0,
        skills: Array.isArray(initialProfile?.skills) ? initialProfile.skills : ([] as string[]),
        city: initialProfile?.city || 'Hồ Chí Minh',
        district: initialProfile?.district || '',
        address: initialProfile?.address || ''
    })
    const [newSkill, setNewSkill] = useState('')

    // Get available districts based on selected city
    const availableDistricts = VIETNAM_LOCATIONS.find(l => l.city === profile.city)?.districts || []

    const handlePasswordChange = async () => {
        if (password !== confirmPassword) {
            toast.error('Mật khẩu xác nhận không khớp')
            return
        }
        if (password.length < 6) {
            toast.error('Mật khẩu phải từ 6 ký tự')
            return
        }

        setLoading(true)
        try {
            const res = await fetch('/api/auth/change-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ newPassword: password })
            })

            if (res.ok) {
                toast.success('Đã đổi mật khẩu thành công')
                setStep('PROFILE')
            } else {
                const error = await res.json()
                toast.error(error.message || 'Lỗi khi đổi mật khẩu')
            }
        } catch (err) {
            toast.error('Lỗi kết nối')
        } finally {
            setLoading(false)
        }
    }

    const handleProfileSubmit = async () => {
        setLoading(true)
        try {
            const res = await fetch('/api/contractor/profile/onboarding', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(profile)
            })

            if (res.ok) {
                toast.success('Đã cập nhật hồ sơ')
                setStep('DOCUMENT')
            } else {
                toast.error('Lỗi khi cập nhật hồ sơ')
            }
        } catch (err) {
            toast.error('Lỗi kết nối')
        } finally {
            setLoading(false)
        }
    }

    const addSkill = () => {
        const skillToAdd = newSkill.trim()
        console.log('Adding skill:', skillToAdd)

        if (!skillToAdd) return

        setProfile(prev => {
            const currentSkills = Array.isArray(prev.skills) ? prev.skills : []
            if (currentSkills.includes(skillToAdd)) return prev
            return {
                ...prev,
                skills: [...currentSkills, skillToAdd]
            }
        })
        setNewSkill('')
    }

    const removeSkill = (skill: string): void => {
        const currentSkills = Array.isArray(profile.skills) ? profile.skills : []
        setProfile({ ...profile, skills: currentSkills.filter((s: string) => s !== skill) })
    }

    const handleBack = () => {
        if (step === 'DOCUMENT') {
            setStep('PROFILE')
        } else if (step === 'PROFILE' && user.mustChangePassword) {
            setStep('PASSWORD')
        }
    }

    const startStep = user.mustChangePassword ? 'PASSWORD' : 'PROFILE'
    const totalSteps = startStep === 'PASSWORD' ? 3 : 2

    let currentStepNum = 1
    if (step === 'PASSWORD') currentStepNum = 1
    else if (step === 'PROFILE') currentStepNum = startStep === 'PASSWORD' ? 2 : 1
    else if (step === 'DOCUMENT') currentStepNum = startStep === 'PASSWORD' ? 3 : 2

    return (
        <div className="fixed inset-0 z-[60] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300">
                {/* Progress Header */}
                <div className="bg-gray-50 px-8 py-6 border-b border-gray-100">
                    <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                            {step !== startStep && (
                                <button
                                    onClick={handleBack}
                                    className="p-1 -ml-2 text-gray-400 hover:text-gray-600 hover:bg-gray-200 rounded-lg transition-all"
                                    title="Quay lại"
                                >
                                    <ChevronLeft className="w-6 h-6" />
                                </button>
                            )}
                            <h2 className="text-xl font-black text-gray-900">
                                {step === 'PASSWORD' ? 'Khởi tạo tài khoản' :
                                    step === 'PROFILE' ? 'Thông tin nhà thầu' : 'Xác thực hồ sơ'}
                            </h2>
                        </div>
                        <div className="flex items-center gap-3">
                            <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded-full uppercase tracking-wider">
                                Bước {currentStepNum}/{totalSteps}
                            </span>
                            {onClose && (
                                <button
                                    onClick={onClose}
                                    className="p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                                    title="Đóng"
                                >
                                    <X className="w-6 h-6" />
                                </button>
                            )}
                        </div>
                    </div>
                    <div className="h-1.5 w-full bg-gray-200 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-blue-600 transition-all duration-500"
                            style={{ width: `${(currentStepNum / totalSteps) * 100}%` }}
                        />
                    </div>
                </div>

                <div className="p-8">
                    {/* STEP 1: PASSWORD CHANGE */}
                    {step === 'PASSWORD' && (
                        <div className="space-y-6">
                            <div className="bg-blue-50 text-blue-700 p-4 rounded-2xl flex items-start gap-3">
                                <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                                <p className="text-sm font-medium">
                                    Vì lý do bảo mật, vui lòng thiết lập mật khẩu mới cho lần đầu đăng nhập.
                                </p>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">Mật khẩu mới</label>
                                    <div className="relative">
                                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                        <input
                                            type="password"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            placeholder="Nhập ít nhất 6 ký tự"
                                            className="w-full pl-12 pr-4 py-4 bg-gray-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-blue-500 transition-all outline-none"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">Xác nhận mật khẩu</label>
                                    <div className="relative">
                                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                        <input
                                            type="password"
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            placeholder="Nhập lại mật khẩu"
                                            className="w-full pl-12 pr-4 py-4 bg-gray-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-blue-500 transition-all outline-none"
                                        />
                                    </div>
                                </div>
                            </div>

                            <button
                                onClick={handlePasswordChange}
                                disabled={loading || !password || !confirmPassword}
                                className="w-full py-4 bg-blue-600 text-white font-black rounded-2xl shadow-xl shadow-blue-200 hover:shadow-blue-300 disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Tiếp tục'}
                            </button>
                        </div>
                    )}

                    {/* STEP 2: PROFILE INFO */}
                    {step === 'PROFILE' && (
                        <div className="space-y-6 overflow-y-auto max-h-[60vh] pr-2">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="col-span-2 md:col-span-1">
                                    <label className="block text-sm font-bold text-gray-700 mb-2">Tên hiển thị</label>
                                    <input
                                        type="text"
                                        value={profile.displayName}
                                        onChange={(e) => setProfile({ ...profile, displayName: e.target.value })}
                                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-blue-500"
                                    />
                                </div>
                                <div className="col-span-2 md:col-span-1">
                                    <label className="block text-sm font-bold text-gray-700 mb-2">Số năm kinh nghiệm</label>
                                    <input
                                        type="number"
                                        value={profile.experienceYears}
                                        onChange={(e) => setProfile({ ...profile, experienceYears: parseInt(e.target.value) })}
                                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-blue-500"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">Tên công ty (nếu có)</label>
                                <div className="relative">
                                    <Building className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                    <input
                                        type="text"
                                        value={profile.companyName}
                                        onChange={(e) => setProfile({ ...profile, companyName: e.target.value })}
                                        className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-blue-500"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">Chuyên môn / Kỹ năng</label>
                                <div className="flex gap-2 mb-3">
                                    <input
                                        type="text"
                                        value={newSkill}
                                        onChange={(e) => setNewSkill(e.target.value)}
                                        placeholder="VD: Xây thô, Sơn nước, Điện nước..."
                                        className="flex-1 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-blue-500"
                                        onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addSkill())}
                                    />
                                    <button
                                        type="button"
                                        onClick={addSkill}
                                        className="p-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 active:scale-95 transition-all"
                                    >
                                        <Plus className="w-5 h-5" />
                                    </button>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {(profile.skills as string[]).map((skill: string) => (
                                        <span
                                            key={skill}
                                            className="inline-flex items-center gap-1 px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm font-bold group"
                                        >
                                            {skill}
                                            <button type="button" onClick={() => removeSkill(skill)} className="hover:text-red-500">
                                                <X className="w-3 h-3" />
                                            </button>
                                        </span>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">Giới thiệu ngắn</label>
                                <textarea
                                    value={profile.bio}
                                    onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                                    placeholder="Chia sẻ kinh nghiệm và các công trình tâm đắc..."
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-blue-500 min-h-[100px]"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">Tỉnh / Thành phố</label>
                                    <div className="relative">
                                        <select
                                            value={profile.city}
                                            onChange={(e) => setProfile({ ...profile, city: e.target.value, district: '' })}
                                            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-blue-500 appearance-none"
                                        >
                                            <option value="">Chọn Tỉnh/Thành</option>
                                            {VIETNAM_LOCATIONS.map(loc => (
                                                <option key={loc.city} value={loc.city}>{loc.city}</option>
                                            ))}
                                        </select>
                                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">Quận / Huyện</label>
                                    <div className="relative">
                                        <select
                                            value={profile.district}
                                            onChange={(e) => setProfile({ ...profile, district: e.target.value })}
                                            disabled={!profile.city}
                                            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-blue-500 appearance-none disabled:bg-gray-100 disabled:text-gray-400"
                                        >
                                            <option value="">Chọn Quận/Huyện</option>
                                            {availableDistricts.map(dist => (
                                                <option key={dist} value={dist}>{dist}</option>
                                            ))}
                                        </select>
                                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                                    </div>
                                </div>
                            </div>

                            <button
                                onClick={handleProfileSubmit}
                                disabled={loading || !profile.displayName || profile.skills.length === 0}
                                className="w-full py-4 bg-blue-600 text-white font-black rounded-2xl shadow-xl shadow-blue-200 hover:shadow-blue-300 disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Lưu & Tiếp tục'}
                            </button>
                        </div>
                    )}

                    {/* STEP 3: DOCUMENT UPLOAD */}
                    {step === 'DOCUMENT' && (
                        <div className="space-y-6">
                            <div className="text-center">
                                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <CheckCircle2 className="w-10 h-10 text-green-600" />
                                </div>
                                <h3 className="text-xl font-bold text-gray-900">Thông tin cơ bản đã hoàn tất!</h3>
                                <p className="text-gray-500 mt-2">
                                    Để tham gia vào các dự án lớn, vui lòng nộp hồ sơ năng lực
                                    để ban quản trị xác thực danh tính.
                                </p>
                            </div>

                            <div className="border-2 border-dashed border-gray-200 rounded-2xl p-10 text-center hover:border-blue-400 hover:bg-blue-50 transition-all cursor-pointer group">
                                <Briefcase className="w-12 h-12 text-gray-400 mx-auto mb-4 group-hover:text-blue-500 transition-colors" />
                                <p className="font-bold text-gray-900 mb-1">Tải lên hồ sơ năng lực (Portfolio)</p>
                                <p className="text-sm text-gray-500">Chấp nhận PDF, JPG, PNG tối đa 10MB</p>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <button
                                    onClick={onComplete}
                                    className="w-full py-4 bg-gray-100 text-gray-700 font-bold rounded-2xl hover:bg-gray-200 transition-all"
                                >
                                    Để sau
                                </button>
                                <button
                                    onClick={onComplete}
                                    className="w-full py-4 bg-blue-600 text-white font-black rounded-2xl shadow-xl shadow-blue-200 hover:shadow-blue-300 transition-all"
                                >
                                    Hoàn tất
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
