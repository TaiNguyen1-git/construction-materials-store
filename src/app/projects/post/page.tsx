'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import Header from '@/components/Header'
import {
    Send, Sparkles, MapPin, Calendar,
    DollarSign, User, Phone, Mail,
    CheckCircle, Loader2, Info, ArrowRight, ArrowLeft,
    Hammer, Paintbrush, Grid3X3, Briefcase, Wrench,
    LayoutGrid, ClipboardList, HardHat, Zap, ShieldCheck
} from 'lucide-react'
import toast, { Toaster } from 'react-hot-toast'
import { useAuth } from '@/contexts/auth-context'
import Link from 'next/link'

const PROJECT_CATEGORIES = [
    { id: 'flooring', name: 'Lát nền', icon: Grid3X3, color: 'bg-blue-500' },
    { id: 'painting', name: 'Sơn tường', icon: Paintbrush, color: 'bg-green-500' },
    { id: 'tiling', name: 'Ốp tường', icon: LayoutGrid, color: 'bg-purple-500' },
    { id: 'general', name: 'Tổng quát', icon: Hammer, color: 'bg-orange-500' },
    { id: 'interior', name: 'Nội thất', icon: Briefcase, color: 'bg-indigo-500' },
    { id: 'repair', name: 'Sửa chữa', icon: Wrench, color: 'bg-red-500' },
]

export default function PostProjectPage() {
    const router = useRouter()
    const { isAuthenticated, user } = useAuth()
    const [loading, setLoading] = useState(false)
    const [success, setSuccess] = useState(false)
    const [verifying, setVerifying] = useState(false)
    const [otpCode, setOtpCode] = useState('')
    const [projectId, setProjectId] = useState('')

    const [formData, setFormData] = useState({
        name: '',
        description: '',
        category: 'general',
        budget: '',
        location: '',
        startDate: new Date().toISOString().split('T')[0],
        guestName: '',
        guestPhone: '',
        guestEmail: '',
        isPublic: true
    })

    // Template-based description generator
    const DESCRIPTION_TEMPLATES: Record<string, (name: string, location: string) => string> = {
        flooring: (name, location) => `📋 **Yêu cầu công việc:**
Lát gạch nền toàn bộ ${name ? `cho "${name}"` : 'khu vực'}.

📐 **Chi tiết:**
• Diện tích: [Nhập diện tích] m²
• Loại gạch yêu cầu: Gạch men 60x60cm / 80x80cm
• Tình trạng nền hiện tại: [Bê tông/Gạch cũ/Nền đất]

📍 **Địa điểm:** ${location || '[Nhập địa điểm]'}

✅ **Yêu cầu khác:**
• Nhà thầu tự cung cấp vật tư hoặc gia chủ cung cấp
• Hoàn thiện gọn gàng, vệ sinh sau thi công
• Bảo hành tối thiểu 12 tháng`,

        painting: (name, location) => `📋 **Yêu cầu công việc:**
Sơn tường ${name ? `cho "${name}"` : 'toàn bộ công trình'}.

📐 **Chi tiết:**
• Tổng diện tích tường: [Nhập diện tích] m²
• Loại sơn: Sơn nội thất / Sơn ngoại thất
• Màu sắc: [Trắng/Kem/Theo yêu cầu]
• Tình trạng tường: [Mới/Cũ cần cạo sơn/Bong tróc]

📍 **Địa điểm:** ${location || '[Nhập địa điểm]'}

✅ **Yêu cầu khác:**
• Sơn lót + 2 lớp sơn phủ
• Che chắn đồ đạc cẩn thận
• Dọn dẹp sạch sẽ sau thi công`,

        tiling: (name, location) => `📋 **Yêu cầu công việc:**
Ốp lát tường ${name ? `cho "${name}"` : 'khu vực'}.

📐 **Chi tiết:**
• Diện tích ốp: [Nhập diện tích] m²
• Vị trí: Nhà vệ sinh / Bếp / Phòng khách
• Loại gạch: Gạch men / Đá granite
• Kích thước gạch: [30x60cm / 40x80cm]

📍 **Địa điểm:** ${location || '[Nhập địa điểm]'}

✅ **Yêu cầu khác:**
• Chà ron màu phù hợp
• Căn chỉnh thẳng hàng, đều đẹp
• Bảo hành công trình`,

        general: (name, location) => `📋 **Yêu cầu công việc:**
${name || 'Công trình xây dựng / cải tạo nhà ở'}.

📐 **Phạm vi công việc:**
• [Liệt kê các hạng mục cần thi công]
• Diện tích: [Nhập diện tích] m²
• Số tầng / phòng: [Nếu có]

📍 **Địa điểm:** ${location || '[Nhập địa điểm]'}

⏰ **Thời gian mong muốn:**
• Khởi công: [Ngày bắt đầu]
• Hoàn thành dự kiến: [Số ngày / tuần]

✅ **Yêu cầu khác:**
• Có kinh nghiệm công trình tương tự
• Báo giá chi tiết theo từng hạng mục
• Cam kết tiến độ và chất lượng`,

        interior: (name, location) => `📋 **Yêu cầu công việc:**
Hoàn thiện nội thất ${name ? `cho "${name}"` : ''}.

📐 **Chi tiết:**
• Diện tích: [Nhập diện tích] m²
• Hạng mục: Trần thạch cao / Sàn gỗ / Tủ bếp / Cửa
• Phong cách: Hiện đại / Cổ điển / Tối giản

📍 **Địa điểm:** ${location || '[Nhập địa điểm]'}

✅ **Yêu cầu khác:**
• Thiết kế theo bản vẽ hoặc tư vấn
• Vật liệu chính hãng, có xuất xứ
• Bảo hành theo tiêu chuẩn`,

        repair: (name, location) => `📋 **Yêu cầu công việc:**
Sửa chữa ${name || 'công trình'}.

🔧 **Mô tả hiện trạng:**
• Vấn đề cần sửa: [Mô tả cụ thể]
• Nguyên nhân (nếu biết): [Thấm dột/Hư hỏng/Xuống cấp]
• Mức độ: [Nhẹ/Trung bình/Nặng]

📍 **Địa điểm:** ${location || '[Nhập địa điểm]'}

✅ **Yêu cầu:**
• Khảo sát và báo giá chi tiết trước thi công
• Sửa chữa triệt để, không tái phát
• Bảo hành sau sửa chữa`
    }

    const generateDescription = () => {
        const template = DESCRIPTION_TEMPLATES[formData.category] || DESCRIPTION_TEMPLATES.general
        const description = template(formData.name, formData.location)
        setFormData(prev => ({ ...prev, description }))
        toast.success('Đã tạo mẫu mô tả! Hãy điền thông tin chi tiết.')
    }

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target
        setFormData(prev => ({ ...prev, [name]: value }))
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!formData.name || !formData.budget || !formData.startDate) {
            toast.error('Vui lòng điền đầy đủ thông tin bắt buộc')
            return
        }

        if (!isAuthenticated && (!formData.guestName || !formData.guestPhone)) {
            toast.error('Quý khách vui lòng để lại tên và số điện thoại liên hệ')
            return
        }

        setLoading(true)
        try {
            const res = await fetch('/api/projects', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...formData,
                    budget: parseFloat(formData.budget),
                    isPublic: true
                })
            })

            if (res.status === 202) {
                const data = await res.json()
                if (data.requiresVerification) {
                    setProjectId(data.projectId)
                    setVerifying(true)
                    toast.success('Vui lòng kiểm tra mã xác thực gửi đến điện thoại')
                    return
                }
            }

            if (res.ok) {
                setSuccess(true)
                toast.success('Đăng dự án thành công!')
                setTimeout(() => {
                    router.push('/projects')
                }, 3000)
            } else {
                const err = await res.json()
                toast.error(err.error || 'Có lỗi xảy ra')
            }
        } catch (error) {
            toast.error('Lỗi kết nối server')
        } finally {
            setLoading(false)
        }
    }

    const handleVerify = async (e: React.FormEvent) => {
        e.preventDefault()
        if (otpCode.length < 6) {
            toast.error('Vui lòng nhập đủ 6 chữ số')
            return
        }

        setLoading(true)
        try {
            const res = await fetch('/api/projects/verify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ projectId, otpCode })
            })

            if (res.ok) {
                setSuccess(true)
                toast.success('Xác thực thành công!')
                setTimeout(() => {
                    router.push('/projects')
                }, 3000)
            } else {
                const err = await res.json()
                toast.error(err.error || 'Mã xác thực không hợp lệ')
            }
        } catch (error) {
            toast.error('Lỗi kết nối')
        } finally {
            setLoading(false)
        }
    }

    if (verifying) {
        return (
            <div className="min-h-screen bg-slate-50 flex flex-col">
                <Header />
                <div className="flex-1 flex items-center justify-center p-4">
                    <form onSubmit={handleVerify} className="max-w-md w-full bg-white rounded-[40px] shadow-2xl p-10 border border-primary-100 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="w-20 h-20 bg-primary-50 rounded-full flex items-center justify-center mx-auto mb-8">
                            <ShieldCheck className="w-10 h-10 text-primary-600" />
                        </div>
                        <h2 className="text-2xl font-black text-slate-900 mb-2 uppercase text-center">Xác thực chính chủ</h2>
                        <p className="text-slate-500 text-sm text-center mb-10 font-medium">
                            Chúng tôi đã gửi mã xác thực gồm 6 chữ số đến số điện thoại của bạn để tránh tin rác.
                        </p>

                        <div className="space-y-6">
                            <div>
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block text-center">Nhập mã OTP</label>
                                <input
                                    type="text"
                                    maxLength={6}
                                    value={otpCode}
                                    onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                                    placeholder="000000"
                                    className="w-full text-center text-4xl font-black tracking-[0.5em] py-5 bg-slate-50 border-2 border-transparent focus:border-primary-500 rounded-3xl outline-none text-slate-700 transition-all"
                                    required
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full py-5 bg-slate-900 text-white rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-primary-600 transition-all flex items-center justify-center gap-3 shadow-xl shadow-slate-200"
                            >
                                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Xác thực ngay'}
                            </button>

                            <button
                                type="button"
                                onClick={() => setVerifying(false)}
                                className="w-full text-xs font-bold text-slate-400 hover:text-slate-600 transition-colors"
                            >
                                Quay lại chỉnh sửa thông tin
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        )
    }

    if (success) {
        return (
            <div className="min-h-screen bg-slate-50 flex flex-col">
                <Header />
                <div className="flex-1 flex items-center justify-center p-4">
                    <div className="max-w-md w-full bg-white rounded-[40px] shadow-2xl p-10 text-center border border-emerald-100 animate-in zoom-in-95 duration-500">
                        <div className="w-24 h-24 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-8">
                            <CheckCircle className="w-12 h-12 text-emerald-500" />
                        </div>
                        <h2 className="text-3xl font-black text-slate-900 mb-4">TUYỆT VỜI!</h2>
                        <p className="text-slate-500 font-medium mb-10 leading-relaxed">
                            Dự án của bạn đã được gửi thành công. Đội ngũ SmartBuild sẽ duyệt tin và hiển thị lên marketplace trong giây lát.
                        </p>
                        <button
                            onClick={() => router.push('/projects')}
                            className="w-full py-5 bg-emerald-600 text-white rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-emerald-700 transition-all shadow-xl shadow-emerald-100"
                        >
                            XEM DANH SÁCH DỰ ÁN
                        </button>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-slate-50">
            <Toaster position="top-right" />
            <Header />

            <main className="max-w-5xl mx-auto px-4 py-12">
                <div className="mb-12">
                    <Link href="/projects" className="inline-flex items-center gap-2 text-slate-400 hover:text-primary-600 font-bold text-sm mb-6 transition-colors">
                        <ArrowLeft className="w-4 h-4" /> Quay lại Marketplace
                    </Link>
                    <h1 className="text-4xl font-black text-slate-900 mb-3 tracking-tight">ĐĂNG DỰ ÁN MỚI</h1>
                    <p className="text-slate-500 font-medium">Mô tả dự án của bạn để các nhà thầu chuyên nghiệp có thể ứng tuyển và báo giá.</p>
                </div>

                <div className="grid lg:grid-cols-3 gap-10">
                    <div className="lg:col-span-2">
                        <form onSubmit={handleSubmit} className="space-y-8">
                            {/* Section: Basic Info */}
                            <div className="bg-white rounded-[32px] shadow-xl shadow-slate-200/50 p-8 md:p-10 border border-slate-100">
                                <div className="flex items-center gap-3 mb-8">
                                    <div className="w-10 h-10 bg-primary-50 rounded-xl flex items-center justify-center text-primary-600">
                                        <ClipboardList className="w-5 h-5" />
                                    </div>
                                    <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">Thông tin cơ bản</h2>
                                </div>

                                <div className="space-y-6">
                                    <div>
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Tên dự án *</label>
                                        <input
                                            name="name"
                                            value={formData.name}
                                            onChange={handleInputChange}
                                            placeholder="VD: Cải tạo nhà xưởng, lát gạch sân vườn..."
                                            className="w-full px-5 py-4 bg-slate-50 border-2 border-transparent focus:border-primary-500 focus:bg-white rounded-2xl outline-none font-bold text-slate-700 transition-all"
                                            required
                                        />
                                    </div>

                                    <div>
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Loại công trình *</label>
                                        <select
                                            name="category"
                                            value={formData.category}
                                            onChange={handleInputChange}
                                            className="w-full px-5 py-4 bg-slate-50 border-2 border-transparent focus:border-primary-500 focus:bg-white rounded-2xl outline-none font-bold text-slate-700 transition-all appearance-none"
                                            required
                                        >
                                            {PROJECT_CATEGORIES.map(cat => (
                                                <option key={cat.id} value={cat.id}>{cat.name}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div>
                                        <div className="flex items-center justify-between mb-2">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Mô tả chi tiết *</label>
                                            <button
                                                type="button"
                                                onClick={generateDescription}
                                                className="text-xs font-bold text-purple-600 flex items-center gap-1 hover:text-purple-700 transition-colors"
                                            >
                                                <Sparkles className="w-3.5 h-3.5" />
                                                Tạo mẫu
                                            </button>
                                        </div>
                                        <textarea
                                            name="description"
                                            value={formData.description}
                                            onChange={handleInputChange}
                                            rows={8}
                                            placeholder="Mô tả công việc cần làm, diện tích, vật liệu yêu cầu..."
                                            className="w-full px-5 py-4 bg-slate-50 border-2 border-transparent focus:border-primary-500 focus:bg-white rounded-2xl outline-none font-medium text-slate-700 transition-all resize-none leading-relaxed"
                                            required
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Section: Budget & Time */}
                            <div className="bg-white rounded-[32px] shadow-xl shadow-slate-200/50 p-8 md:p-10 border border-slate-100">
                                <div className="flex items-center gap-3 mb-8">
                                    <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600">
                                        <DollarSign className="w-5 h-5" />
                                    </div>
                                    <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">Ngân sách & Thời gian</h2>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Ngân sách dự kiến (VNĐ) *</label>
                                        <div className="relative">
                                            <input
                                                name="budget"
                                                type="number"
                                                value={formData.budget}
                                                onChange={handleInputChange}
                                                placeholder="VD: 50000000"
                                                className="w-full pl-12 pr-5 py-4 bg-slate-50 border-2 border-transparent focus:border-emerald-500 focus:bg-white rounded-2xl outline-none font-bold text-slate-700 transition-all"
                                                required
                                            />
                                            <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300" />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Ngày dự định bắt đầu *</label>
                                        <div className="relative">
                                            <input
                                                name="startDate"
                                                type="date"
                                                value={formData.startDate}
                                                onChange={handleInputChange}
                                                className="w-full pl-12 pr-5 py-4 bg-slate-50 border-2 border-transparent focus:border-primary-500 focus:bg-white rounded-2xl outline-none font-bold text-slate-700 transition-all"
                                                required
                                            />
                                            <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300" />
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-6">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Địa điểm thi công</label>
                                    <div className="relative">
                                        <input
                                            name="location"
                                            value={formData.location}
                                            onChange={handleInputChange}
                                            placeholder="Phường/Xã, Quận/Huyện, Tỉnh/Thành phố"
                                            className="w-full pl-12 pr-5 py-4 bg-slate-50 border-2 border-transparent focus:border-primary-500 focus:bg-white rounded-2xl outline-none font-bold text-slate-700 transition-all"
                                        />
                                        <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300" />
                                    </div>
                                </div>
                            </div>

                            {/* Section: Contact (Optional for Authenticated, Required for Guests) */}
                            {!isAuthenticated && (
                                <div className="bg-white rounded-[32px] shadow-xl shadow-slate-200/50 p-8 md:p-10 border border-slate-100">
                                    <div className="flex items-center gap-3 mb-8">
                                        <div className="w-10 h-10 bg-primary-50 rounded-xl flex items-center justify-center text-primary-600">
                                            <User className="w-5 h-5" />
                                        </div>
                                        <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">Thông tin khách hàng</h2>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 block">Họ và tên *</label>
                                            <div className="relative">
                                                <input
                                                    name="guestName"
                                                    value={formData.guestName}
                                                    onChange={handleInputChange}
                                                    placeholder="Nhập đầy đủ họ tên của bạn"
                                                    className="w-full pl-12 pr-5 py-4 bg-slate-50 border-2 border-slate-100 focus:border-primary-500 focus:bg-white rounded-2xl outline-none font-bold text-slate-700 transition-all placeholder:font-medium placeholder:text-slate-300"
                                                    required
                                                />
                                                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 block">Số điện thoại *</label>
                                            <div className="relative">
                                                <input
                                                    name="guestPhone"
                                                    value={formData.guestPhone}
                                                    onChange={handleInputChange}
                                                    placeholder="Số điện thoại để nhà thầu liên hệ"
                                                    className="w-full pl-12 pr-5 py-4 bg-slate-50 border-2 border-slate-100 focus:border-primary-500 focus:bg-white rounded-2xl outline-none font-bold text-slate-700 transition-all placeholder:font-medium placeholder:text-slate-300"
                                                    required
                                                />
                                                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                            </div>
                                        </div>
                                    </div>
                                    <div className="mt-6">
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 block">Email (Không bắt buộc)</label>
                                        <div className="relative">
                                            <input
                                                name="guestEmail"
                                                type="email"
                                                value={formData.guestEmail}
                                                onChange={handleInputChange}
                                                placeholder="Để nhận báo giá qua email (Nếu có)"
                                                className="w-full pl-12 pr-5 py-4 bg-slate-50 border-2 border-slate-100 focus:border-primary-500 focus:bg-white rounded-2xl outline-none font-bold text-slate-700 transition-all placeholder:font-medium placeholder:text-slate-300"
                                            />
                                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div className="pt-6">
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="group w-full py-6 bg-primary-600 hover:bg-primary-700 disabled:bg-slate-300 text-white rounded-3xl font-black text-sm uppercase tracking-[0.3em] transition-all duration-500 flex items-center justify-center gap-4 shadow-2xl shadow-primary-200 mt-4"
                                >
                                    {loading ? (
                                        <>
                                            <Loader2 className="w-6 h-6 animate-spin" />
                                            Đang xử lý...
                                        </>
                                    ) : (
                                        <>
                                            Đăng dự án ngay
                                            <Send className="w-5 h-5 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                                        </>
                                    )}
                                </button>
                                <p className="text-center text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-6 italic">
                                    * Bằng cách đăng dự án, bạn đồng ý với các điều khoản bảo mật của SmartBuild.
                                </p>
                            </div>
                        </form>
                    </div>

                    <div className="hidden lg:block space-y-8">
                        <div className="bg-gradient-to-br from-indigo-600 to-primary-700 rounded-[32px] p-8 text-white shadow-2xl relative overflow-hidden group">
                            <Zap className="w-12 h-12 mb-6 text-indigo-300" />
                            <h3 className="text-xl font-black mb-4 leading-tight">Bạn muốn dự toán chính xác hơn?</h3>
                            <p className="text-indigo-100 text-sm font-bold mb-8 leading-relaxed opacity-80">
                                Hãy sử dụng AI Estimator để bóc tách khối lượng vật liệu từ ảnh mặt bằng của bạn trước khi đăng tin.
                            </p>
                            <Link
                                href="/estimator"
                                className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest bg-white text-indigo-700 px-6 py-3 rounded-xl hover:bg-indigo-50 transition-all"
                            >
                                Thử AI Estimator <ArrowRight className="w-3.5 h-3.5" />
                            </Link>
                            <Sparkles className="absolute -bottom-6 -right-6 w-32 h-32 text-white/10 rotate-12 group-hover:rotate-0 transition-transform duration-700" />
                        </div>

                        <div className="bg-white rounded-[32px] p-8 border border-slate-100 shadow-sm">
                            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6">Mẹo đăng tin nhanh</h4>
                            <div className="space-y-6">
                                {[
                                    { title: 'Tiêu đề cụ thể', desc: 'Chọn tiêu đề ngắn gọn nhưng bao quát công việc.' },
                                    { title: 'Mô tả rõ ràng', desc: 'Chi tiết diện tích và tình trạng hiện tại để nhà thầu dễ báo giá.' },
                                    { title: 'Ngân sách thực', desc: 'Giúp thu hút các nhà thầu phù hợp với tầm giá của bạn.' }
                                ].map((tip, i) => (
                                    <div key={i} className="flex gap-4">
                                        <div className="w-8 h-8 rounded-xl bg-slate-50 text-slate-900 flex items-center justify-center text-xs font-black shrink-0">
                                            {i + 1}
                                        </div>
                                        <div>
                                            <h5 className="text-sm font-black text-slate-900 mb-1">{tip.title}</h5>
                                            <p className="text-xs text-slate-400 font-medium leading-relaxed">{tip.desc}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="bg-primary-50 rounded-[32px] p-8 border border-primary-100 shadow-sm">
                            <div className="flex items-center gap-3 mb-4 text-primary-600">
                                <HardHat className="w-5 h-5" />
                                <span className="text-[10px] font-black uppercase tracking-widest">Hỗ trợ 24/7</span>
                            </div>
                            <h4 className="text-lg font-black mb-2 text-slate-900">Bạn cần trợ giúp?</h4>
                            <p className="text-slate-500 text-xs font-medium mb-6 leading-relaxed">Bộ phận kỹ thuật luôn sẵn sàng hỗ trợ bạn đăng dự án và tìm kiếm nhà thầu phù hợp.</p>
                            <a href="tel:19008888" className="text-xl font-black text-primary-700 hover:text-primary-800 transition-colors">1900 8888</a>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    )
}
