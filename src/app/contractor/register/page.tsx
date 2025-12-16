'use client'

/**
 * Contractor Registration Page
 * Professional registration form for B2B contractors
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
    Briefcase,
    AlertCircle
} from 'lucide-react'

interface FormData {
    // Account Info
    email: string
    password: string
    confirmPassword: string

    // Personal Info
    fullName: string
    phone: string

    // Company Info
    companyName: string
    taxId: string
    companyAddress: string
    city: string

    // Documents
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
            // Step 1: Create user account
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

            // Step 2: Create customer with CONTRACTOR type request
            // Note: Customer type will be REGULAR initially, admin will approve to CONTRACTOR
            const customerRes = await fetch('/api/customers', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId,
                    customerType: 'REGULAR', // Will be upgraded to CONTRACTOR after admin approval
                    companyName: formData.companyName,
                    taxId: formData.taxId,
                    companyAddress: formData.companyAddress,
                    contractorVerified: false, // Pending verification
                    notes: `[CONTRACTOR REQUEST] Company: ${formData.companyName}, Tax ID: ${formData.taxId}, City: ${formData.city}`
                })
            })

            // Redirect to success page or dashboard
            router.push('/contractor/register/success')
        } catch (err: any) {
            setError(err.message || 'Đã có lỗi xảy ra, vui lòng thử lại')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-slate-950 text-white">
            {/* Navigation */}
            <nav className="fixed top-0 left-0 right-0 z-50 bg-slate-950/95 backdrop-blur-md border-b border-slate-800">
                <div className="max-w-7xl mx-auto px-6 py-4">
                    <div className="flex items-center justify-between">
                        <Link href="/contractor" className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-amber-600 rounded-lg flex items-center justify-center">
                                <Building2 className="w-6 h-6 text-slate-950" />
                            </div>
                            <div>
                                <span className="text-xl font-bold text-white">SmartBuild</span>
                                <span className="text-amber-500 font-semibold ml-2">PRO</span>
                            </div>
                        </Link>
                        <Link
                            href="/contractor"
                            className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            Quay lại
                        </Link>
                    </div>
                </div>
            </nav>

            {/* Main Content */}
            <div className="pt-24 pb-12 px-6">
                <div className="max-w-2xl mx-auto">
                    {/* Progress Steps */}
                    <div className="mb-12">
                        <div className="flex items-center justify-between relative">
                            {/* Progress Line */}
                            <div className="absolute left-0 right-0 top-1/2 h-0.5 bg-slate-700 -translate-y-1/2 z-0" />
                            <div
                                className="absolute left-0 top-1/2 h-0.5 bg-amber-500 -translate-y-1/2 z-0 transition-all duration-500"
                                style={{ width: `${((step - 1) / 2) * 100}%` }}
                            />

                            {/* Step Indicators */}
                            {[1, 2, 3].map((s) => (
                                <div key={s} className="relative z-10 flex flex-col items-center">
                                    <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg transition-all ${s < step ? 'bg-amber-500 text-slate-950' :
                                            s === step ? 'bg-amber-500 text-slate-950 ring-4 ring-amber-500/30' :
                                                'bg-slate-800 text-slate-400 border border-slate-700'
                                        }`}>
                                        {s < step ? <CheckCircle className="w-6 h-6" /> : s}
                                    </div>
                                    <div className={`mt-2 text-sm font-medium ${s <= step ? 'text-amber-500' : 'text-slate-500'}`}>
                                        {s === 1 ? 'Tài khoản' : s === 2 ? 'Doanh nghiệp' : 'Xác nhận'}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Form Card */}
                    <div className="bg-slate-900 rounded-3xl border border-slate-800 p-8">
                        <form onSubmit={handleSubmit}>
                            {/* Step 1: Account Info */}
                            {step === 1 && (
                                <div className="space-y-6">
                                    <div className="text-center mb-8">
                                        <h1 className="text-3xl font-bold mb-2">Tạo Tài khoản</h1>
                                        <p className="text-slate-400">Thông tin đăng nhập của bạn</p>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-slate-300 mb-2">
                                            <Mail className="w-4 h-4 inline mr-2" />
                                            Email
                                        </label>
                                        <input
                                            type="email"
                                            name="email"
                                            value={formData.email}
                                            onChange={handleInputChange}
                                            placeholder="email@company.com"
                                            className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
                                            required
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-slate-300 mb-2">
                                            <Lock className="w-4 h-4 inline mr-2" />
                                            Mật khẩu
                                        </label>
                                        <input
                                            type="password"
                                            name="password"
                                            value={formData.password}
                                            onChange={handleInputChange}
                                            placeholder="Tối thiểu 6 ký tự"
                                            className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
                                            required
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-slate-300 mb-2">
                                            <Lock className="w-4 h-4 inline mr-2" />
                                            Xác nhận Mật khẩu
                                        </label>
                                        <input
                                            type="password"
                                            name="confirmPassword"
                                            value={formData.confirmPassword}
                                            onChange={handleInputChange}
                                            placeholder="Nhập lại mật khẩu"
                                            className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
                                            required
                                        />
                                    </div>
                                </div>
                            )}

                            {/* Step 2: Company Info */}
                            {step === 2 && (
                                <div className="space-y-6">
                                    <div className="text-center mb-8">
                                        <h1 className="text-3xl font-bold mb-2">Thông tin Doanh nghiệp</h1>
                                        <p className="text-slate-400">Để chúng tôi xác minh và tạo hợp đồng</p>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="col-span-2 sm:col-span-1">
                                            <label className="block text-sm font-medium text-slate-300 mb-2">
                                                <User className="w-4 h-4 inline mr-2" />
                                                Họ và tên
                                            </label>
                                            <input
                                                type="text"
                                                name="fullName"
                                                value={formData.fullName}
                                                onChange={handleInputChange}
                                                placeholder="Nguyễn Văn A"
                                                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
                                                required
                                            />
                                        </div>

                                        <div className="col-span-2 sm:col-span-1">
                                            <label className="block text-sm font-medium text-slate-300 mb-2">
                                                <Phone className="w-4 h-4 inline mr-2" />
                                                Số điện thoại
                                            </label>
                                            <input
                                                type="tel"
                                                name="phone"
                                                value={formData.phone}
                                                onChange={handleInputChange}
                                                placeholder="0909 123 456"
                                                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
                                                required
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-slate-300 mb-2">
                                            <Building2 className="w-4 h-4 inline mr-2" />
                                            Tên Công ty / Doanh nghiệp
                                        </label>
                                        <input
                                            type="text"
                                            name="companyName"
                                            value={formData.companyName}
                                            onChange={handleInputChange}
                                            placeholder="Công ty TNHH Xây dựng ABC"
                                            className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
                                            required
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-slate-300 mb-2">
                                            <FileText className="w-4 h-4 inline mr-2" />
                                            Mã số thuế
                                        </label>
                                        <input
                                            type="text"
                                            name="taxId"
                                            value={formData.taxId}
                                            onChange={handleInputChange}
                                            placeholder="0123456789"
                                            className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
                                            required
                                        />
                                        <p className="text-xs text-slate-500 mt-1">
                                            Mã số thuế dùng để xác minh doanh nghiệp và xuất hóa đơn VAT
                                        </p>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-slate-300 mb-2">
                                            <MapPin className="w-4 h-4 inline mr-2" />
                                            Địa chỉ Công ty
                                        </label>
                                        <input
                                            type="text"
                                            name="companyAddress"
                                            value={formData.companyAddress}
                                            onChange={handleInputChange}
                                            placeholder="123 Đường ABC, Phường XYZ"
                                            className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-slate-300 mb-2">
                                            Thành phố
                                        </label>
                                        <select
                                            name="city"
                                            value={formData.city}
                                            onChange={handleInputChange}
                                            className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
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
                                        <h1 className="text-3xl font-bold mb-2">Xác nhận Thông tin</h1>
                                        <p className="text-slate-400">Kiểm tra lại thông tin trước khi đăng ký</p>
                                    </div>

                                    <div className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700 space-y-4">
                                        <h3 className="font-semibold text-amber-500 flex items-center gap-2">
                                            <User className="w-5 h-5" />
                                            Thông tin Tài khoản
                                        </h3>
                                        <div className="grid grid-cols-2 gap-4 text-sm">
                                            <div>
                                                <span className="text-slate-400">Email:</span>
                                                <p className="font-medium">{formData.email}</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700 space-y-4">
                                        <h3 className="font-semibold text-amber-500 flex items-center gap-2">
                                            <Building2 className="w-5 h-5" />
                                            Thông tin Doanh nghiệp
                                        </h3>
                                        <div className="grid grid-cols-2 gap-4 text-sm">
                                            <div>
                                                <span className="text-slate-400">Họ tên:</span>
                                                <p className="font-medium">{formData.fullName}</p>
                                            </div>
                                            <div>
                                                <span className="text-slate-400">Điện thoại:</span>
                                                <p className="font-medium">{formData.phone}</p>
                                            </div>
                                            <div className="col-span-2">
                                                <span className="text-slate-400">Công ty:</span>
                                                <p className="font-medium">{formData.companyName}</p>
                                            </div>
                                            <div>
                                                <span className="text-slate-400">Mã số thuế:</span>
                                                <p className="font-medium">{formData.taxId}</p>
                                            </div>
                                            <div>
                                                <span className="text-slate-400">Thành phố:</span>
                                                <p className="font-medium">{formData.city || 'Chưa chọn'}</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Upload GPKD */}
                                    <div>
                                        <label className="block text-sm font-medium text-slate-300 mb-2">
                                            <Upload className="w-4 h-4 inline mr-2" />
                                            Giấy phép Kinh doanh (Không bắt buộc)
                                        </label>
                                        <div className="border-2 border-dashed border-slate-700 rounded-xl p-6 text-center hover:border-amber-500/50 transition-colors">
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
                                                    <div className="flex items-center justify-center gap-2 text-green-500">
                                                        <CheckCircle className="w-5 h-5" />
                                                        {formData.businessLicense.name}
                                                    </div>
                                                ) : (
                                                    <>
                                                        <Upload className="w-8 h-8 text-slate-500 mx-auto mb-2" />
                                                        <p className="text-slate-400">Click để upload hoặc kéo thả file</p>
                                                        <p className="text-xs text-slate-500 mt-1">PDF, JPG, PNG (Max 5MB)</p>
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
                                            className="mt-1 w-4 h-4 rounded border-slate-600 bg-slate-800 text-amber-500 focus:ring-amber-500"
                                            required
                                        />
                                        <label htmlFor="terms" className="text-sm text-slate-400">
                                            Tôi đồng ý với <a href="#" className="text-amber-500 hover:underline">Điều khoản sử dụng</a> và <a href="#" className="text-amber-500 hover:underline">Chính sách bảo mật</a> của SmartBuild PRO
                                        </label>
                                    </div>
                                </div>
                            )}

                            {/* Error Message */}
                            {error && (
                                <div className="mt-6 bg-red-500/10 border border-red-500/50 rounded-xl p-4 flex items-center gap-3 text-red-400">
                                    <AlertCircle className="w-5 h-5 flex-shrink-0" />
                                    {error}
                                </div>
                            )}

                            {/* Navigation Buttons */}
                            <div className="flex gap-4 mt-8">
                                {step > 1 && (
                                    <button
                                        type="button"
                                        onClick={prevStep}
                                        className="flex-1 bg-slate-800 hover:bg-slate-700 text-white px-6 py-3 rounded-xl font-semibold transition-all border border-slate-700 flex items-center justify-center gap-2"
                                    >
                                        <ArrowLeft className="w-4 h-4" />
                                        Quay lại
                                    </button>
                                )}

                                {step < 3 ? (
                                    <button
                                        type="button"
                                        onClick={nextStep}
                                        className="flex-1 bg-amber-500 hover:bg-amber-600 text-slate-950 px-6 py-3 rounded-xl font-bold transition-all flex items-center justify-center gap-2"
                                    >
                                        Tiếp tục
                                        <ArrowRight className="w-4 h-4" />
                                    </button>
                                ) : (
                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="flex-1 bg-amber-500 hover:bg-amber-600 disabled:bg-slate-700 disabled:text-slate-400 text-slate-950 px-6 py-3 rounded-xl font-bold transition-all flex items-center justify-center gap-2"
                                    >
                                        {loading ? (
                                            <>
                                                <div className="w-5 h-5 border-2 border-slate-950/30 border-t-slate-950 rounded-full animate-spin" />
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
                    <p className="text-center mt-6 text-slate-400">
                        Đã có tài khoản?{' '}
                        <Link href="/contractor/login" className="text-amber-500 hover:underline font-medium">
                            Đăng nhập
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    )
}
