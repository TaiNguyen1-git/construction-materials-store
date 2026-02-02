'use client'

/**
 * Supplier Registration Page - Professional Theme
 * Tailored for material suppliers and distributors
 */

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
    Building2,
    Mail,
    Phone,
    MapPin,
    FileText,
    Upload,
    CheckCircle,
    ArrowLeft,
    ArrowRight,
    User,
    Lock,
    AlertCircle,
    Package,
    Shield
} from 'lucide-react'

interface FormData {
    email: string
    password: string
    confirmPassword: string
    fullName: string
    phone: string
    companyName: string
    taxId: string
    companyAddress: string
    city: string
    businessLicense: File | null
    supplyingCategories: string
}

export default function SupplierRegisterPage() {
    const router = useRouter()
    const [step, setStep] = useState(1)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [formData, setFormData] = useState<FormData>({
        email: '',
        password: '',
        confirmPassword: '',
        fullName: '',
        phone: '',
        companyName: '',
        taxId: '',
        companyAddress: '',
        city: '',
        businessLicense: null,
        supplyingCategories: ''
    })

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target
        setFormData(prev => ({ ...prev, [name]: value }))
    }

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFormData(prev => ({ ...prev, businessLicense: e.target.files![0] }))
        }
    }

    const validateStep1 = () => {
        if (!formData.email || !formData.password || !formData.confirmPassword) {
            setError('Vui lòng điền đầy đủ thông tin')
            return false
        }
        if (formData.password !== formData.confirmPassword) {
            setError('Mật khẩu không khớp')
            return false
        }
        if (formData.password.length < 6) {
            setError('Mật khẩu phải có ít nhất 6 ký tự')
            return false
        }
        return true
    }

    const validateStep2 = () => {
        if (!formData.fullName || !formData.phone || !formData.companyName || !formData.taxId) {
            setError('Vui lòng điền đầy đủ thông tin')
            return false
        }
        if (!/^\d{10,13}$/.test(formData.taxId.replace(/-/g, ''))) {
            setError('Mã số thuế không hợp lệ')
            return false
        }
        return true
    }

    const nextStep = () => {
        setError('')
        if (step === 1 && !validateStep1()) return
        if (step === 2 && !validateStep2()) return
        setStep(prev => prev + 1)
    }

    const prevStep = () => {
        setError('')
        setStep(prev => prev - 1)
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError('')

        try {
            // Register as SUPPLIER
            const registerRes = await fetch('/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: formData.fullName,
                    email: formData.email,
                    password: formData.password,
                    phone: formData.phone,
                    role: 'SUPPLIER'
                })
            })

            if (!registerRes.ok) {
                const data = await registerRes.json()
                throw new Error(data.error || 'Đăng ký thất bại')
            }

            const userData = await registerRes.json()
            const userId = userData.user?.id || userData.data?.id

            // Create supplier profile via API
            await fetch('/api/supplier/profile', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId,
                    name: formData.companyName,
                    taxId: formData.taxId,
                    email: formData.email,
                    phone: formData.phone,
                    address: formData.companyAddress,
                    city: formData.city,
                    categories: formData.supplyingCategories
                })
            })

            router.push('/supplier/register/success')
        } catch (err: any) {
            setError(err.message || 'Đã có lỗi xảy ra, vui lòng thử lại')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 selection:bg-blue-100 selection:text-blue-900">
            {/* Navigation */}
            <nav className="bg-white/80 backdrop-blur-xl border-b border-slate-100 sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-6 py-4">
                    <div className="flex items-center justify-between">
                        <Link href="/supplier" className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
                                <Building2 className="w-6 h-6 text-white" />
                            </div>
                            <div className="flex flex-col leading-none">
                                <span className="text-xl font-black text-slate-900 tracking-tighter uppercase italic">SmartBuild</span>
                                <span className="text-[10px] font-black text-blue-600 tracking-[0.2em] uppercase mt-0.5">Supplier Portal</span>
                            </div>
                        </Link>
                        <Link
                            href="/supplier"
                            className="flex items-center gap-2 text-slate-500 hover:text-blue-600 transition-all font-bold uppercase tracking-widest text-[11px]"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            Về Landing Page
                        </Link>
                    </div>
                </div>
            </nav>

            {/* Main Content */}
            <div className="py-20 px-6">
                <div className="max-w-3xl mx-auto">
                    {/* Progress Steps */}
                    <div className="mb-16">
                        <div className="flex items-center justify-between relative max-w-lg mx-auto">
                            <div className="absolute left-0 right-0 top-1/2 h-1 bg-slate-100 -translate-y-1/2 z-0 rounded-full" />
                            <div
                                className="absolute left-0 top-1/2 h-1 bg-blue-600 -translate-y-1/2 z-0 transition-all duration-700 rounded-full shadow-[0_0_15px_rgba(37,99,235,0.4)]"
                                style={{ width: `${((step - 1) / 2) * 100}%` }}
                            />

                            {[1, 2, 3].map((s) => (
                                <div key={s} className="relative z-10 flex flex-col items-center">
                                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-black text-lg transition-all shadow-xl ${s < step ? 'bg-blue-600 text-white' :
                                        s === step ? 'bg-blue-600 text-white ring-8 ring-blue-50 scale-110' :
                                            'bg-white text-slate-300 border border-slate-100 group-hover:border-blue-200'
                                        }`}>
                                        {s < step ? <CheckCircle className="w-7 h-7" /> : s}
                                    </div>
                                    <div className={`mt-4 text-[10px] font-black uppercase tracking-[0.2em] ${s <= step ? 'text-blue-600' : 'text-slate-400'}`}>
                                        {s === 1 ? 'Tài khoản' : s === 2 ? 'Doanh nghiệp' : 'Hoàn tất'}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Header */}
                    <div className="text-center mb-12">
                        <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tighter mb-4">
                            Đăng Ký Đối Tác <br /> <span className="text-blue-600">Nhà Cung Cấp</span>
                        </h1>
                        <p className="text-slate-500 font-medium">Khởi tạo gian hàng và tiếp cận hàng ngàn dự án xây dựng ngay hôm nay.</p>
                    </div>

                    {/* Form Card */}
                    <div className="bg-white/80 backdrop-blur-xl rounded-[3rem] shadow-2xl shadow-blue-500/10 border border-white p-8 md:p-12 relative overflow-hidden">
                        {/* Static Background element */}
                        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-50 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl opacity-50" />

                        <form onSubmit={handleSubmit} className="relative z-10">
                            {/* Step 1: Account Info */}
                            {step === 1 && (
                                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                    <div className="grid md:grid-cols-1 gap-6">
                                        <div>
                                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-1">
                                                Địa chỉ Email Doanh nghiệp <span className="text-red-500">*</span>
                                            </label>
                                            <div className="relative">
                                                <Mail className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300" />
                                                <input
                                                    type="email"
                                                    name="email"
                                                    value={formData.email}
                                                    onChange={handleInputChange}
                                                    placeholder="supplier@company.com"
                                                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl pl-16 pr-6 py-5 text-slate-900 placeholder-slate-300 font-bold focus:ring-4 focus:ring-blue-500/10 focus:border-blue-600 focus:bg-white outline-none transition-all"
                                                    required
                                                />
                                            </div>
                                        </div>

                                        <div className="grid md:grid-cols-2 gap-6">
                                            <div>
                                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-1">
                                                    Mật khẩu truy cập <span className="text-red-500">*</span>
                                                </label>
                                                <div className="relative">
                                                    <Lock className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300" />
                                                    <input
                                                        type="password"
                                                        name="password"
                                                        value={formData.password}
                                                        onChange={handleInputChange}
                                                        placeholder="Tối thiểu 6 ký tự"
                                                        className="w-full bg-slate-50 border border-slate-100 rounded-2xl pl-16 pr-6 py-5 text-slate-900 placeholder-slate-300 font-bold focus:ring-4 focus:ring-blue-500/10 focus:border-blue-600 focus:bg-white outline-none transition-all"
                                                        required
                                                    />
                                                </div>
                                            </div>
                                            <div>
                                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-1">
                                                    Xác nhận mật khẩu <span className="text-red-500">*</span>
                                                </label>
                                                <div className="relative">
                                                    <Lock className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300" />
                                                    <input
                                                        type="password"
                                                        name="confirmPassword"
                                                        value={formData.confirmPassword}
                                                        onChange={handleInputChange}
                                                        placeholder="Nhập lại mật khẩu"
                                                        className="w-full bg-slate-50 border border-slate-100 rounded-2xl pl-16 pr-6 py-5 text-slate-900 placeholder-slate-300 font-bold focus:ring-4 focus:ring-blue-500/10 focus:border-blue-600 focus:bg-white outline-none transition-all"
                                                        required
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                </div>
                            )}

                            {/* Step 2: Company Info */}
                            {step === 2 && (
                                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                    <div className="grid md:grid-cols-2 gap-6">
                                        <div>
                                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-1">
                                                Họ và tên người đại diện <span className="text-red-500">*</span>
                                            </label>
                                            <div className="relative">
                                                <User className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300" />
                                                <input
                                                    type="text"
                                                    name="fullName"
                                                    value={formData.fullName}
                                                    onChange={handleInputChange}
                                                    placeholder="Nguyễn Văn A"
                                                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl pl-16 pr-6 py-5 text-slate-900 placeholder-slate-300 font-bold focus:ring-4 focus:ring-blue-500/10 focus:border-blue-600 focus:bg-white outline-none transition-all"
                                                    required
                                                />
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-1">
                                                Số điện thoại liên hệ <span className="text-red-500">*</span>
                                            </label>
                                            <div className="relative">
                                                <Phone className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300" />
                                                <input
                                                    type="tel"
                                                    name="phone"
                                                    value={formData.phone}
                                                    onChange={handleInputChange}
                                                    placeholder="09xx xxx xxx"
                                                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl pl-16 pr-6 py-5 text-slate-900 placeholder-slate-300 font-bold focus:ring-4 focus:ring-blue-500/10 focus:border-blue-600 focus:bg-white outline-none transition-all"
                                                    required
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-1">
                                            Tên doanh nghiệp / Kho hàng <span className="text-red-500">*</span>
                                        </label>
                                        <div className="relative">
                                            <Building2 className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300" />
                                            <input
                                                type="text"
                                                name="companyName"
                                                value={formData.companyName}
                                                onChange={handleInputChange}
                                                placeholder="CÔNG TY TNHH VẬT LIỆU XÂY DỰNG ABC"
                                                className="w-full bg-slate-50 border border-slate-100 rounded-2xl pl-16 pr-6 py-5 text-slate-900 placeholder-slate-300 font-bold focus:ring-4 focus:ring-blue-500/10 focus:border-blue-600 focus:bg-white outline-none transition-all"
                                                required
                                            />
                                        </div>
                                    </div>

                                    <div className="grid md:grid-cols-2 gap-6">
                                        <div>
                                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-1">
                                                Mã số thuế <span className="text-red-500">*</span>
                                            </label>
                                            <div className="relative">
                                                <FileText className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300" />
                                                <input
                                                    type="text"
                                                    name="taxId"
                                                    value={formData.taxId}
                                                    onChange={handleInputChange}
                                                    placeholder="0123456789"
                                                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl pl-16 pr-6 py-5 text-slate-900 placeholder-slate-300 font-bold focus:ring-4 focus:ring-blue-500/10 focus:border-blue-600 focus:bg-white outline-none transition-all"
                                                    required
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-1">
                                                Thành phố hoạt động chính
                                            </label>
                                            <select
                                                name="city"
                                                value={formData.city}
                                                onChange={handleInputChange}
                                                className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-5 text-slate-900 font-bold focus:ring-4 focus:ring-blue-500/10 focus:border-blue-600 outline-none appearance-none"
                                            >
                                                <option value="">Chọn khu vực</option>
                                                <option value="TP.HCM">TP. Hồ Chí Minh</option>
                                                <option value="Hà Nội">Hà Nội</option>
                                                <option value="Đà Nẵng">Đà Nẵng</option>
                                                <option value="Bình Dương">Bình Dương</option>
                                                <option value="Đồng Nai">Đồng Nai</option>
                                                <option value="Long An">Long An</option>
                                                <option value="Cần Thơ">Cần Thơ</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-1">
                                            Địa chỉ chi tiết văn phòng / kho
                                        </label>
                                        <div className="relative">
                                            <MapPin className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300" />
                                            <input
                                                type="text"
                                                name="companyAddress"
                                                value={formData.companyAddress}
                                                onChange={handleInputChange}
                                                placeholder="Số nhà, Tên đường, Phường/Xã..."
                                                className="w-full bg-slate-50 border border-slate-100 rounded-2xl pl-16 pr-6 py-5 text-slate-900 placeholder-slate-300 font-bold focus:ring-4 focus:ring-blue-500/10 focus:border-blue-600 focus:bg-white outline-none transition-all"
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Step 3: Confirmation */}
                            {step === 3 && (
                                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                    <div className="bg-slate-50 rounded-[2rem] p-8 border border-slate-100">
                                        <div className="flex items-center gap-4 mb-8">
                                            <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm">
                                                <Package className="w-6 h-6 text-blue-600" />
                                            </div>
                                            <div>
                                                <h3 className="text-lg font-black text-slate-900 tracking-tight">Xác nhận ngành hàng</h3>
                                                <p className="text-xs text-slate-500 font-medium">Chọn các loại vật tư bạn đang cung cấp</p>
                                            </div>
                                        </div>

                                        <textarea
                                            name="supplyingCategories"
                                            value={formData.supplyingCategories}
                                            onChange={handleInputChange}
                                            rows={3}
                                            placeholder="Ví dụ: Thép xây dựng, Xi măng, Gạch ốp lát, Thiết bị vệ sinh..."
                                            className="w-full p-6 bg-white border border-slate-200 rounded-3xl text-sm font-bold text-slate-900 placeholder:text-slate-300 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-600 outline-none transition-all resize-none"
                                        />
                                    </div>

                                    <div className="grid md:grid-cols-2 gap-6">
                                        <div className="p-6 bg-white border border-slate-100 rounded-3xl shadow-sm">
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Dữ liệu tài khoản</p>
                                            <p className="font-bold text-slate-900 truncate">{formData.email}</p>
                                            <p className="text-xs text-slate-500 mt-1">Đại diện: {formData.fullName}</p>
                                        </div>
                                        <div className="p-6 bg-white border border-slate-100 rounded-3xl shadow-sm">
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Thông tin pháp lý</p>
                                            <p className="font-bold text-slate-900 truncate">{formData.companyName}</p>
                                            <p className="text-xs text-slate-500 mt-1">MST: {formData.taxId}</p>
                                        </div>
                                    </div>

                                    {/* Upload GPKD */}
                                    <div className="p-1 text-center">
                                        <input
                                            type="file"
                                            name="businessLicense"
                                            onChange={handleFileChange}
                                            accept=".pdf,.jpg,.jpeg,.png"
                                            className="hidden"
                                            id="file-upload"
                                        />
                                        <label
                                            htmlFor="file-upload"
                                            className="block cursor-pointer p-10 border-2 border-dashed border-slate-200 rounded-[2.5rem] hover:border-blue-500 hover:bg-blue-50/50 transition-all duration-300"
                                        >
                                            {formData.businessLicense ? (
                                                <div className="flex flex-col items-center gap-2">
                                                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-2">
                                                        <CheckCircle className="w-8 h-8 text-green-600" />
                                                    </div>
                                                    <p className="font-black text-slate-900">{formData.businessLicense.name}</p>
                                                    <p className="text-xs text-slate-400 uppercase tracking-widest">Nhấp để thay đổi file</p>
                                                </div>
                                            ) : (
                                                <div className="flex flex-col items-center gap-4">
                                                    <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-300">
                                                        <Upload className="w-8 h-8" />
                                                    </div>
                                                    <div>
                                                        <p className="font-black text-slate-900 uppercase tracking-tight">Upload Giấy phép kinh doanh</p>
                                                        <p className="text-xs text-slate-400 mt-1 italic">PDF, JPG, PNG (Tối đa 5MB) - Không bắt buộc</p>
                                                    </div>
                                                </div>
                                            )}
                                        </label>
                                    </div>

                                    {/* Terms */}
                                    <label className="flex items-start gap-4 cursor-pointer p-4 hover:bg-slate-50 rounded-2xl transition-colors">
                                        <input
                                            type="checkbox"
                                            id="terms"
                                            className="mt-1 w-5 h-5 rounded-lg border-slate-300 text-blue-600 focus:ring-blue-500"
                                            required
                                        />
                                        <span className="text-xs text-slate-500 font-medium leading-relaxed">
                                            Tôi cam kết các thông tin cung cấp là hoàn toàn chính xác và đồng ý với <Link href="/supplier/terms" target="_blank" className="font-bold text-blue-600 hover:underline">Điều khoản đối tác NCC</Link> của SmartBuild.
                                        </span>
                                    </label>
                                </div>
                            )}

                            {/* Error Message */}
                            {error && (
                                <div className="mt-8 bg-red-50 border border-red-100 rounded-2xl p-5 flex items-center gap-4 text-red-600 animate-shake">
                                    <AlertCircle className="w-5 h-5 flex-shrink-0" />
                                    <span className="text-xs font-bold uppercase tracking-tight">{error}</span>
                                </div>
                            )}

                            {/* Navigation Buttons */}
                            <div className="flex gap-4 mt-12 pt-8 border-t border-slate-50">
                                {step > 1 && (
                                    <button
                                        type="button"
                                        onClick={prevStep}
                                        className="flex-1 bg-slate-50 hover:bg-slate-100 text-slate-500 h-16 rounded-2xl font-black uppercase tracking-widest text-[10px] transition-all flex items-center justify-center gap-3"
                                    >
                                        <ArrowLeft className="w-4 h-4" />
                                        Quay lại
                                    </button>
                                )}

                                {step < 3 ? (
                                    <button
                                        type="button"
                                        onClick={nextStep}
                                        className="flex-[2] bg-blue-600 hover:bg-blue-700 text-white h-16 rounded-2xl font-black uppercase tracking-widest text-[10px] transition-all flex items-center justify-center gap-3 shadow-xl shadow-blue-500/20 active:scale-95"
                                    >
                                        Tiếp tục hồ sơ
                                        <ArrowRight className="w-4 h-4" />
                                    </button>
                                ) : (
                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="flex-[2] bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 text-white h-16 rounded-2xl font-black uppercase tracking-widest text-[10px] transition-all flex items-center justify-center gap-3 shadow-xl shadow-blue-500/20 active:scale-95"
                                    >
                                        {loading ? (
                                            <>
                                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                                Đang xử lý hồ sơ...
                                            </>
                                        ) : (
                                            <>
                                                Gửi Hồ Sơ Hợp Tác
                                                <CheckCircle className="w-5 h-5" />
                                            </>
                                        )}
                                    </button>
                                )}
                            </div>
                        </form>
                    </div>

                    {/* Login Link */}
                    <div className="mt-12 text-center">
                        <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">
                            Đã có tài khoản đối tác?{' '}
                            <Link href="/supplier/login" className="text-blue-600 hover:text-blue-700 hover:underline underline-offset-4 ml-2 transition-colors">
                                Đăng nhập ngay
                            </Link>
                        </p>
                    </div>
                </div>
            </div>

            {/* Simple Footer */}
            <footer className="py-12 bg-white/50 border-t border-slate-100">
                <div className="max-w-7xl mx-auto px-6 text-center">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest italic">
                        © 2026 SmartBuild Corporation - Hệ thống Quản trị Cung ứng NCC
                    </p>
                </div>
            </footer>
        </div>
    )
}
