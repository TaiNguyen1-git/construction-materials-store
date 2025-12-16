'use client'

/**
 * Contractor Registration Page - Light Theme
 * Professional multi-step registration form
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
    AlertCircle
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
}

export default function ContractorRegisterPage() {
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
        businessLicense: null
    })

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
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
            const registerRes = await fetch('/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: formData.fullName,
                    email: formData.email,
                    password: formData.password,
                    phone: formData.phone
                })
            })

            if (!registerRes.ok) {
                const data = await registerRes.json()
                throw new Error(data.error || 'Đăng ký thất bại')
            }

            const userData = await registerRes.json()
            const userId = userData.user?.id || userData.data?.id

            const customerRes = await fetch('/api/customers', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId,
                    customerType: 'REGULAR',
                    companyName: formData.companyName,
                    taxId: formData.taxId,
                    companyAddress: formData.companyAddress,
                    contractorVerified: false,
                    notes: `[CONTRACTOR REQUEST] Company: ${formData.companyName}, Tax ID: ${formData.taxId}, City: ${formData.city}`
                })
            })

            router.push('/contractor/register/success')
        } catch (err: any) {
            setError(err.message || 'Đã có lỗi xảy ra, vui lòng thử lại')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
            {/* Navigation */}
            <nav className="bg-white/80 backdrop-blur-sm border-b border-gray-100">
                <div className="max-w-7xl mx-auto px-6 py-4">
                    <div className="flex items-center justify-between">
                        <Link href="/contractor" className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                                <Building2 className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <span className="text-xl font-bold text-gray-900">SmartBuild</span>
                                <span className="text-blue-600 font-semibold ml-1">PRO</span>
                            </div>
                        </Link>
                        <Link
                            href="/contractor"
                            className="flex items-center gap-2 text-gray-600 hover:text-blue-600 transition-colors font-medium"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            Quay lại
                        </Link>
                    </div>
                </div>
            </nav>

            {/* Main Content */}
            <div className="py-12 px-6">
                <div className="max-w-2xl mx-auto">
                    {/* Progress Steps */}
                    <div className="mb-12">
                        <div className="flex items-center justify-between relative">
                            <div className="absolute left-0 right-0 top-1/2 h-1 bg-gray-200 -translate-y-1/2 z-0 rounded-full" />
                            <div
                                className="absolute left-0 top-1/2 h-1 bg-blue-600 -translate-y-1/2 z-0 transition-all duration-500 rounded-full"
                                style={{ width: `${((step - 1) / 2) * 100}%` }}
                            />

                            {[1, 2, 3].map((s) => (
                                <div key={s} className="relative z-10 flex flex-col items-center">
                                    <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg transition-all shadow-sm ${s < step ? 'bg-blue-600 text-white' :
                                            s === step ? 'bg-blue-600 text-white ring-4 ring-blue-100' :
                                                'bg-white text-gray-400 border-2 border-gray-200'
                                        }`}>
                                        {s < step ? <CheckCircle className="w-6 h-6" /> : s}
                                    </div>
                                    <div className={`mt-2 text-sm font-medium ${s <= step ? 'text-blue-600' : 'text-gray-400'}`}>
                                        {s === 1 ? 'Tài khoản' : s === 2 ? 'Doanh nghiệp' : 'Xác nhận'}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Form Card */}
                    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
                        <form onSubmit={handleSubmit}>
                            {/* Step 1: Account Info */}
                            {step === 1 && (
                                <div className="space-y-6">
                                    <div className="text-center mb-8">
                                        <h1 className="text-2xl font-bold text-gray-900 mb-2">Tạo Tài khoản</h1>
                                        <p className="text-gray-600">Thông tin đăng nhập của bạn</p>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Email <span className="text-red-500">*</span>
                                        </label>
                                        <div className="relative">
                                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                            <input
                                                type="email"
                                                name="email"
                                                value={formData.email}
                                                onChange={handleInputChange}
                                                placeholder="email@company.com"
                                                className="w-full bg-gray-50 border border-gray-200 rounded-lg pl-11 pr-4 py-3 text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                required
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Mật khẩu <span className="text-red-500">*</span>
                                        </label>
                                        <div className="relative">
                                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                            <input
                                                type="password"
                                                name="password"
                                                value={formData.password}
                                                onChange={handleInputChange}
                                                placeholder="Tối thiểu 6 ký tự"
                                                className="w-full bg-gray-50 border border-gray-200 rounded-lg pl-11 pr-4 py-3 text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                required
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Xác nhận Mật khẩu <span className="text-red-500">*</span>
                                        </label>
                                        <div className="relative">
                                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                            <input
                                                type="password"
                                                name="confirmPassword"
                                                value={formData.confirmPassword}
                                                onChange={handleInputChange}
                                                placeholder="Nhập lại mật khẩu"
                                                className="w-full bg-gray-50 border border-gray-200 rounded-lg pl-11 pr-4 py-3 text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                required
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Step 2: Company Info */}
                            {step === 2 && (
                                <div className="space-y-6">
                                    <div className="text-center mb-8">
                                        <h1 className="text-2xl font-bold text-gray-900 mb-2">Thông tin Doanh nghiệp</h1>
                                        <p className="text-gray-600">Để chúng tôi xác minh và tạo hợp đồng</p>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Họ và tên <span className="text-red-500">*</span>
                                            </label>
                                            <div className="relative">
                                                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                                <input
                                                    type="text"
                                                    name="fullName"
                                                    value={formData.fullName}
                                                    onChange={handleInputChange}
                                                    placeholder="Nguyễn Văn A"
                                                    className="w-full bg-gray-50 border border-gray-200 rounded-lg pl-11 pr-4 py-3 text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                    required
                                                />
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Số điện thoại <span className="text-red-500">*</span>
                                            </label>
                                            <div className="relative">
                                                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                                <input
                                                    type="tel"
                                                    name="phone"
                                                    value={formData.phone}
                                                    onChange={handleInputChange}
                                                    placeholder="0909 123 456"
                                                    className="w-full bg-gray-50 border border-gray-200 rounded-lg pl-11 pr-4 py-3 text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                    required
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Tên Công ty <span className="text-red-500">*</span>
                                        </label>
                                        <div className="relative">
                                            <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                            <input
                                                type="text"
                                                name="companyName"
                                                value={formData.companyName}
                                                onChange={handleInputChange}
                                                placeholder="Công ty TNHH Xây dựng ABC"
                                                className="w-full bg-gray-50 border border-gray-200 rounded-lg pl-11 pr-4 py-3 text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                required
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Mã số thuế <span className="text-red-500">*</span>
                                        </label>
                                        <div className="relative">
                                            <FileText className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                            <input
                                                type="text"
                                                name="taxId"
                                                value={formData.taxId}
                                                onChange={handleInputChange}
                                                placeholder="0123456789"
                                                className="w-full bg-gray-50 border border-gray-200 rounded-lg pl-11 pr-4 py-3 text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                required
                                            />
                                        </div>
                                        <p className="text-xs text-gray-500 mt-1">
                                            Dùng để xác minh doanh nghiệp và xuất hóa đơn VAT
                                        </p>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Địa chỉ Công ty
                                        </label>
                                        <div className="relative">
                                            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                            <input
                                                type="text"
                                                name="companyAddress"
                                                value={formData.companyAddress}
                                                onChange={handleInputChange}
                                                placeholder="123 Đường ABC, Phường XYZ"
                                                className="w-full bg-gray-50 border border-gray-200 rounded-lg pl-11 pr-4 py-3 text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Thành phố
                                        </label>
                                        <select
                                            name="city"
                                            value={formData.city}
                                            onChange={handleInputChange}
                                            className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        >
                                            <option value="">Chọn thành phố</option>
                                            <option value="Biên Hòa">Biên Hòa</option>
                                            <option value="Đồng Nai">Đồng Nai</option>
                                            <option value="TP.HCM">TP. Hồ Chí Minh</option>
                                            <option value="Bình Dương">Bình Dương</option>
                                            <option value="Khác">Khác</option>
                                        </select>
                                    </div>
                                </div>
                            )}

                            {/* Step 3: Confirmation */}
                            {step === 3 && (
                                <div className="space-y-6">
                                    <div className="text-center mb-8">
                                        <h1 className="text-2xl font-bold text-gray-900 mb-2">Xác nhận Thông tin</h1>
                                        <p className="text-gray-600">Kiểm tra lại trước khi đăng ký</p>
                                    </div>

                                    <div className="bg-blue-50 rounded-xl p-6 border border-blue-100">
                                        <h3 className="font-semibold text-blue-700 flex items-center gap-2 mb-4">
                                            <User className="w-5 h-5" />
                                            Thông tin Tài khoản
                                        </h3>
                                        <div className="text-sm text-gray-700">
                                            <p><span className="text-gray-500">Email:</span> {formData.email}</p>
                                        </div>
                                    </div>

                                    <div className="bg-green-50 rounded-xl p-6 border border-green-100">
                                        <h3 className="font-semibold text-green-700 flex items-center gap-2 mb-4">
                                            <Building2 className="w-5 h-5" />
                                            Thông tin Doanh nghiệp
                                        </h3>
                                        <div className="grid grid-cols-2 gap-3 text-sm text-gray-700">
                                            <p><span className="text-gray-500">Họ tên:</span> {formData.fullName}</p>
                                            <p><span className="text-gray-500">Điện thoại:</span> {formData.phone}</p>
                                            <p className="col-span-2"><span className="text-gray-500">Công ty:</span> {formData.companyName}</p>
                                            <p><span className="text-gray-500">MST:</span> {formData.taxId}</p>
                                            <p><span className="text-gray-500">Thành phố:</span> {formData.city || 'Chưa chọn'}</p>
                                        </div>
                                    </div>

                                    {/* Upload GPKD */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Giấy phép Kinh doanh (Không bắt buộc)
                                        </label>
                                        <div className="border-2 border-dashed border-gray-200 rounded-xl p-6 text-center hover:border-blue-300 transition-colors">
                                            <input
                                                type="file"
                                                name="businessLicense"
                                                onChange={handleFileChange}
                                                accept=".pdf,.jpg,.jpeg,.png"
                                                className="hidden"
                                                id="file-upload"
                                            />
                                            <label htmlFor="file-upload" className="cursor-pointer">
                                                {formData.businessLicense ? (
                                                    <div className="flex items-center justify-center gap-2 text-green-600">
                                                        <CheckCircle className="w-5 h-5" />
                                                        {formData.businessLicense.name}
                                                    </div>
                                                ) : (
                                                    <>
                                                        <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                                                        <p className="text-gray-600">Click để upload hoặc kéo thả</p>
                                                        <p className="text-xs text-gray-400 mt-1">PDF, JPG, PNG (Max 5MB)</p>
                                                    </>
                                                )}
                                            </label>
                                        </div>
                                    </div>

                                    {/* Terms */}
                                    <div className="flex items-start gap-3">
                                        <input
                                            type="checkbox"
                                            id="terms"
                                            className="mt-1 w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                            required
                                        />
                                        <label htmlFor="terms" className="text-sm text-gray-600">
                                            Tôi đồng ý với <a href="#" className="text-blue-600 hover:underline">Điều khoản sử dụng</a> và <a href="#" className="text-blue-600 hover:underline">Chính sách bảo mật</a>
                                        </label>
                                    </div>
                                </div>
                            )}

                            {/* Error Message */}
                            {error && (
                                <div className="mt-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3 text-red-600">
                                    <AlertCircle className="w-5 h-5 flex-shrink-0" />
                                    <span className="text-sm">{error}</span>
                                </div>
                            )}

                            {/* Navigation Buttons */}
                            <div className="flex gap-4 mt-8">
                                {step > 1 && (
                                    <button
                                        type="button"
                                        onClick={prevStep}
                                        className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 px-6 py-3 rounded-lg font-semibold transition-all flex items-center justify-center gap-2"
                                    >
                                        <ArrowLeft className="w-4 h-4" />
                                        Quay lại
                                    </button>
                                )}

                                {step < 3 ? (
                                    <button
                                        type="button"
                                        onClick={nextStep}
                                        className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition-all flex items-center justify-center gap-2 shadow-md"
                                    >
                                        Tiếp tục
                                        <ArrowRight className="w-4 h-4" />
                                    </button>
                                ) : (
                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-300 text-white px-6 py-3 rounded-lg font-semibold transition-all flex items-center justify-center gap-2 shadow-md"
                                    >
                                        {loading ? (
                                            <>
                                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                                Đang xử lý...
                                            </>
                                        ) : (
                                            <>
                                                Hoàn tất Đăng ký
                                                <CheckCircle className="w-5 h-5" />
                                            </>
                                        )}
                                    </button>
                                )}
                            </div>
                        </form>
                    </div>

                    {/* Login Link */}
                    <p className="text-center mt-6 text-gray-600">
                        Đã có tài khoản?{' '}
                        <Link href="/contractor/login" className="text-blue-600 hover:underline font-semibold">
                            Đăng nhập
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    )
}
