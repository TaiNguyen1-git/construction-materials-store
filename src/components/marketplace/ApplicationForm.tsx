'use client'

/**
 * Enhanced Application Form Component
 * Supports: Guest/Verified, BoQ Materials, AI Assistant
 */

import { useState, useEffect } from 'react'
import {
    X, Send, User, Phone, Mail, Clock, DollarSign, Package,
    Plus, Search, Trash2, CheckCircle, AlertTriangle, ChevronRight,
    Sparkles, Loader2, ArrowRight, ShoppingCart
} from 'lucide-react'
import toast from 'react-hot-toast'
import QuickRegisterModal from './QuickRegisterModal'

interface Product {
    id: string
    name: string
    price: number
    unit: string
}

interface MaterialItem {
    id: string
    productId: string
    name: string
    quantity: number
    unit: string
    price: number
}

interface ApplicationFormProps {
    projectId: string
    projectTitle: string
    isOpen: boolean
    onClose: () => void
    onSuccess: () => void
}

export default function ApplicationForm({
    projectId,
    projectTitle,
    isOpen,
    onClose,
    onSuccess
}: ApplicationFormProps) {
    const [step, setStep] = useState(1)
    const [submitting, setSubmitting] = useState(false)

    // Check login status
    const [isLoggedIn, setIsLoggedIn] = useState(false)
    const [contractorId, setContractorId] = useState<string | null>(null)
    const [contractorName, setContractorName] = useState('')

    // Form data
    const [form, setForm] = useState({
        message: '',
        proposedBudget: '',
        proposedDays: '',
        // Guest fields
        guestName: '',
        guestPhone: '',
        guestEmail: ''
    })

    // BoQ Materials
    const [materials, setMaterials] = useState<MaterialItem[]>([])
    const [searchTerm, setSearchTerm] = useState('')
    const [searchResults, setSearchResults] = useState<Product[]>([])
    const [showSearch, setShowSearch] = useState(false)

    // AI States
    const [showQuickRegister, setShowQuickRegister] = useState(false)
    const [aiLoading, setAiLoading] = useState(false)
    const [aiAdvice, setAiAdvice] = useState<string | null>(null)
    const [aiProducts, setAiProducts] = useState<string | null>(null)

    // Template-based proposal generator (no API call, instant, free)
    const PROPOSAL_TEMPLATES = [
        // Template 1: Professional formal
        (name: string, project: string, isVerified: boolean) => `Kính gửi Quý Chủ đầu tư,

Tôi là ${name}${isVerified ? ' - Đối tác xác minh trên SmartBuild' : ''}. Sau khi xem xét yêu cầu của dự án "${project}", tôi xin gửi đến Quý vị lời đề nghị hợp tác.

**Cam kết của tôi:**
• Thi công đúng tiến độ, đảm bảo chất lượng
• Sử dụng vật tư chính hãng, có nguồn gốc rõ ràng
• Báo giá minh bạch, không phát sinh chi phí ẩn
• Bảo hành công trình theo thỏa thuận

Rất mong có cơ hội được trao đổi thêm với Quý Chủ đầu tư.

Trân trọng,
${name}`,

        // Template 2: Friendly but professional
        (name: string, project: string, isVerified: boolean) => `Chào anh/chị,

Em là ${name}${isVerified ? ' (Nhà thầu xác minh)' : ''}, chuyên nhận các công trình xây dựng và hoàn thiện nội thất.

Em rất quan tâm đến dự án "${project}" của anh/chị. Với kinh nghiệm thực tế, em cam kết:
✓ Thi công đúng kỹ thuật, đảm bảo tiến độ
✓ Vật tư sử dụng đều có chứng từ rõ ràng
✓ Giá cả hợp lý, thanh toán linh hoạt

Anh/chị có thể liên hệ để em báo giá chi tiết ạ!

Cảm ơn anh/chị,
${name}`,

        // Template 3: Experience-focused
        (name: string, project: string, isVerified: boolean) => `Kính chào Quý Chủ đầu tư,

${name} xin giới thiệu năng lực thực hiện dự án "${project}"${isVerified ? ' (Đã xác minh trên SmartBuild)' : ''}.

**Điểm mạnh của chúng tôi:**
→ Đội ngũ thợ lành nghề, có chứng chỉ nghề
→ Máy móc thiết bị đầy đủ, hiện đại
→ Cam kết tiến độ và chất lượng công trình
→ Hỗ trợ tư vấn vật tư phù hợp ngân sách

Chúng tôi sẵn sàng khảo sát và báo giá miễn phí. Rất mong được phục vụ!

Trân trọng,
${name}`
    ]

    const handleAIGenerate = () => {
        // Validate: Guest must fill in name first
        if (!isLoggedIn && !form.guestName.trim()) {
            toast.error('Vui lòng nhập Họ tên trước để tạo mẫu thư')
            return
        }

        // Get user name
        const userName = isLoggedIn ? (contractorName || 'Nhà thầu') : form.guestName.trim()
        const isVerified = isLoggedIn

        // Pick a random template or cycle through them
        const templateIndex = Math.floor(Math.random() * PROPOSAL_TEMPLATES.length)
        const template = PROPOSAL_TEMPLATES[templateIndex]
        const generatedText = template(userName, projectTitle, isVerified)

        setForm({ ...form, message: generatedText })
        toast.success('Đã tạo mẫu thư! Hãy chỉnh sửa cho phù hợp với bạn.')
    }

    const handleAIAdvice = async () => {
        if (!form.proposedBudget) {
            toast.error('Vui lòng nhập báo giá để AI phân tích')
            return
        }
        setAiLoading(true)
        try {
            // First call for advice
            const resAdvice = await fetch('/api/ai/write', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    type: 'BIDDING_ADVICE',
                    projectId,
                    prompt: 'Phân tích báo giá của tôi.',
                    context: {
                        proposedPrice: parseFloat(form.proposedBudget),
                        projectTitle
                    }
                })
            })
            const dataAdvice = await resAdvice.json()
            if (dataAdvice.success) setAiAdvice(dataAdvice.data.text)

            // Second call for product upsell
            const resUpsell = await fetch('/api/ai/write', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    type: 'PRODUCT_UPSELL',
                    projectId,
                    prompt: 'Gợi ý vật tư phù hợp.'
                })
            })
            const dataUpsell = await resUpsell.json()
            if (dataUpsell.success) setAiProducts(dataUpsell.data.text)

        } catch (err) {
            toast.error('Lỗi gọi AI')
        } finally {
            setAiLoading(false)
        }
    }

    useEffect(() => {
        const token = localStorage.getItem('access_token')
        const custId = localStorage.getItem('customer_id')
        const userStr = localStorage.getItem('user')

        if (token && custId) {
            setIsLoggedIn(true)
            setContractorId(custId)
            if (userStr) {
                try {
                    const userData = JSON.parse(userStr)
                    setContractorName(userData.name || '')
                } catch { }
            }
        }
    }, [])

    const searchProducts = async (term: string) => {
        if (term.length < 2) {
            setSearchResults([])
            return
        }
        try {
            const res = await fetch(`/api/products/search?q=${encodeURIComponent(term)}&limit=5`)
            if (res.ok) {
                const data = await res.json()
                if (data.success) setSearchResults(data.data.products || [])
            }
        } catch (err) {
            console.error('Search failed:', err)
        }
    }

    const addMaterial = (product: Product) => {
        if (materials.find(m => m.productId === product.id)) {
            toast.error('Sản phẩm đã có trong danh sách')
            return
        }
        setMaterials([
            ...materials,
            {
                id: Date.now().toString(),
                productId: product.id,
                name: product.name,
                quantity: 1,
                unit: product.unit,
                price: product.price
            }
        ])
        setSearchTerm('')
        setSearchResults([])
        setShowSearch(false)
    }

    const updateMaterialQty = (id: string, qty: number) => {
        setMaterials(materials.map(m => m.id === id ? { ...m, quantity: qty } : m))
    }

    const removeMaterial = (id: string) => {
        setMaterials(materials.filter(m => m.id !== id))
    }

    const totalMaterialCost = materials.reduce((sum, m) => sum + (m.price * m.quantity), 0)

    const handleSubmit = async () => {
        if (!form.message.trim()) {
            toast.error('Vui lòng nhập lời giới thiệu')
            return
        }
        if (!isLoggedIn && (!form.guestName.trim() || !form.guestPhone.trim())) {
            toast.error('Vui lòng nhập họ tên và số điện thoại')
            return
        }

        setSubmitting(true)
        try {
            const payload = {
                message: form.message,
                proposedBudget: form.proposedBudget ? parseFloat(form.proposedBudget) : null,
                proposedDays: form.proposedDays ? parseInt(form.proposedDays) : null,
                isGuest: !isLoggedIn,
                contractorId: isLoggedIn ? contractorId : null,
                guestName: !isLoggedIn ? form.guestName : null,
                guestPhone: !isLoggedIn ? form.guestPhone : null,
                guestEmail: !isLoggedIn ? form.guestEmail : null,
                materials: materials.length > 0 ? materials : null
            }

            const res = await fetch(`/api/marketplace/projects/${projectId}/apply`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            })

            const data = await res.json()
            if (data.success) {
                toast.success('Gửi ứng tuyển thành công!')
                onSuccess()
                if (!isLoggedIn) setShowQuickRegister(true)
                else onClose()
            } else {
                toast.error(data.error?.message || 'Có lỗi xảy ra')
            }
        } catch (err) {
            toast.error('Lỗi kết nối')
        } finally {
            setSubmitting(false)
        }
    }

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 bg-black/25 backdrop-blur-[2px] flex items-center justify-center z-[200] p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[85vh] overflow-hidden flex flex-col shadow-2xl animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="flex items-center justify-between px-8 py-6 border-b border-slate-100 bg-white sticky top-0 z-10">
                    <div>
                        <h2 className="text-2xl font-black text-slate-900 tracking-tight">Ứng tuyển dự án</h2>
                        <p className="text-sm text-slate-500 font-medium mt-1 pr-8 truncate max-w-md">{projectTitle}</p>
                    </div>
                    <button onClick={onClose} className="p-2.5 bg-slate-50 hover:bg-slate-100 text-slate-400 hover:text-slate-600 rounded-full transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Step Indicator */}
                <div className="px-8 py-4 bg-slate-50/50 border-b border-slate-100">
                    <div className="flex items-center gap-4">
                        <div className={`flex items-center gap-3 ${step >= 1 ? 'text-blue-600' : 'text-slate-400'}`}>
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shadow-sm transition-all ${step >= 1 ? 'bg-blue-600 text-white ring-4 ring-blue-50' : 'bg-white border border-slate-200 text-slate-400'}`}>1</div>
                            <span className="text-sm font-bold hidden sm:inline-block">Thông tin cơ bản</span>
                        </div>
                        <div className="flex-1 h-1 rounded-full bg-slate-200 overflow-hidden">
                            <div className={`h-full bg-blue-600 transition-all duration-300 ${step === 2 ? 'w-full' : 'w-0'}`} />
                        </div>
                        <div className={`flex items-center gap-3 ${step >= 2 ? 'text-blue-600' : 'text-slate-400'}`}>
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shadow-sm transition-all ${step >= 2 ? 'bg-blue-600 text-white ring-4 ring-blue-50' : 'bg-white border border-slate-200 text-slate-400'}`}>2</div>
                            <span className="text-sm font-bold hidden sm:inline-block">Báo giá chi tiết</span>
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-8">
                    {step === 1 && (
                        <div className="space-y-6">
                            {isLoggedIn ? (
                                <div className="p-5 bg-emerald-50 border border-emerald-100 rounded-2xl flex items-center gap-4">
                                    <div className="w-10 h-10 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center shrink-0">
                                        <CheckCircle className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <p className="font-bold text-emerald-900 text-sm">Tài khoản đã xác minh</p>
                                        <p className="text-xs font-medium text-emerald-700 mt-0.5">Hồ sơ ứng tuyển của bạn sẽ được đánh dấu uy tín.</p>
                                    </div>
                                    <div className="ml-auto text-xs font-bold text-emerald-700 bg-white px-3 py-1.5 rounded-full shadow-sm border border-emerald-100">
                                        {contractorName || 'Nhà thầu đối tác'}
                                    </div>
                                </div>
                            ) : (
                                <div className="p-5 bg-amber-50 border border-amber-100 rounded-2xl flex items-start gap-4">
                                    <div className="w-10 h-10 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center shrink-0">
                                        <AlertTriangle className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <p className="font-bold text-amber-900 text-sm">Hồ sơ chưa xác minh</p>
                                        <p className="text-xs font-medium text-amber-700 mt-1 leading-relaxed">Bạn đang ứng tuyển với tư cách Khách. Hãy đăng ký tài khoản sau khi gửi để tăng độ uy tín cho hồ sơ.</p>
                                    </div>
                                </div>
                            )}

                            {!isLoggedIn && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Họ và tên <span className="text-red-500">*</span></label>
                                        <input
                                            type="text"
                                            value={form.guestName}
                                            onChange={(e) => setForm({ ...form, guestName: e.target.value })}
                                            placeholder="Nguyễn Văn A"
                                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all placeholder:text-slate-400"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Số điện thoại <span className="text-red-500">*</span></label>
                                        <input
                                            type="tel"
                                            value={form.guestPhone}
                                            onChange={(e) => setForm({ ...form, guestPhone: e.target.value })}
                                            placeholder="0912..."
                                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all placeholder:text-slate-400"
                                        />
                                    </div>
                                </div>
                            )}

                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Thư giới thiệu <span className="text-red-500">*</span></label>
                                    <button
                                        onClick={handleAIGenerate}
                                        className="text-xs font-bold text-purple-600 hover:text-purple-700 hover:bg-purple-50 px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5"
                                    >
                                        <Sparkles className="w-3.5 h-3.5" />
                                        Viết hộ tôi bằng AI
                                    </button>
                                </div>
                                <div className="relative">
                                    <textarea
                                        value={form.message}
                                        onChange={(e) => setForm({ ...form, message: e.target.value })}
                                        rows={6}
                                        placeholder="Hãy giới thiệu ngắn gọn về kinh nghiệm và lý do bạn phù hợp với dự án này..."
                                        className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all resize-none placeholder:text-slate-400 leading-relaxed"
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {step === 2 && (
                        <div className="space-y-8">
                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Tổng ngân sách (VNĐ)</label>
                                    <div className="relative">
                                        <input
                                            type="number"
                                            value={form.proposedBudget}
                                            onChange={(e) => setForm({ ...form, proposedBudget: e.target.value })}
                                            placeholder="0"
                                            className="w-full pl-5 pr-12 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all placeholder:text-slate-400"
                                        />
                                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">VNĐ</span>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Thời gian thi công</label>
                                    <div className="relative">
                                        <input
                                            type="number"
                                            value={form.proposedDays}
                                            onChange={(e) => setForm({ ...form, proposedDays: e.target.value })}
                                            placeholder="0"
                                            className="w-full pl-5 pr-12 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all placeholder:text-slate-400"
                                        />
                                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">Ngày</span>
                                    </div>
                                </div>
                            </div>

                            {/* AI Analysis Box */}
                            <div className="bg-gradient-to-br from-purple-50 to-indigo-50 border border-purple-100 rounded-2xl p-5 relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-purple-100/50 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
                                <div className="flex items-center justify-between mb-4 relative z-10">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-white shadow-sm flex items-center justify-center">
                                            <Sparkles className="w-4 h-4 text-purple-600" />
                                        </div>
                                        <div>
                                            <h4 className="text-sm font-bold text-slate-900">Trợ lý AI phân tích</h4>
                                            <p className="text-[10px] text-slate-500 font-medium">So sánh giá và gợi ý vật tư</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={handleAIAdvice}
                                        disabled={aiLoading || !form.proposedBudget}
                                        className="text-xs font-bold text-white bg-purple-600 shadow-lg shadow-purple-200 px-4 py-2 rounded-xl hover:bg-purple-700 transition-all disabled:opacity-50 disabled:shadow-none active:scale-95"
                                    >
                                        {aiLoading ? 'Đang suy nghĩ...' : 'Phân tích ngay'}
                                    </button>
                                </div>

                                {(aiAdvice || aiProducts) ? (
                                    <div className="space-y-3 animate-in fade-in slide-in-from-bottom-2">
                                        {aiAdvice && (
                                            <div className="bg-white/60 backdrop-blur-sm p-3 rounded-xl border border-purple-100 text-xs font-medium text-slate-700 leading-relaxed">
                                                {aiAdvice}
                                            </div>
                                        )}
                                        {aiProducts && (
                                            <div className="bg-white/80 backdrop-blur-sm p-4 rounded-xl border border-dashed border-purple-200">
                                                <div className="flex items-center gap-2 mb-2 text-purple-700 font-bold text-xs uppercase tracking-wider">
                                                    <ShoppingCart className="w-3.5 h-3.5" /> Gợi ý tối ưu chi phí
                                                </div>
                                                <p className="text-xs text-slate-600 leading-relaxed mb-2">{aiProducts}</p>
                                                <p className="text-[10px] text-purple-400 font-medium italic">* Sản phẩm có sẵn tại kho SmartBuild</p>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <p className="text-xs text-slate-400 italic text-center py-2">Nhập ngân sách và bấm phân tích để nhận lời khuyên.</p>
                                )}
                            </div>

                            {/* BoQ Materials Section */}
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                                        <Package className="w-4 h-4" /> Bảng kê vật tư (Tùy chọn)
                                    </label>
                                    <button
                                        onClick={() => setShowSearch(!showSearch)}
                                        className="text-xs font-bold text-blue-600 hover:text-blue-700 hover:bg-blue-50 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1"
                                    >
                                        <Plus className="w-3.5 h-3.5" /> Thêm vật tư
                                    </button>
                                </div>

                                {showSearch && (
                                    <div className="relative animate-in fade-in slide-in-from-top-2">
                                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                                        <input
                                            type="text"
                                            value={searchTerm}
                                            onChange={(e) => { setSearchTerm(e.target.value); searchProducts(e.target.value); }}
                                            placeholder="Nhập tên vật tư (ví dụ: Xi măng, Gạch...)"
                                            className="w-full pl-10 pr-4 py-3 bg-white border border-blue-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-100 outline-none shadow-sm"
                                            autoFocus
                                        />
                                        {searchResults.length > 0 && (
                                            <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-100 rounded-xl shadow-xl z-20 max-h-60 overflow-y-auto overflow-hidden ring-1 ring-slate-900/5">
                                                {searchResults.map(p => (
                                                    <button key={p.id} onClick={() => addMaterial(p)} className="w-full px-4 py-3 text-left hover:bg-slate-50 flex justify-between items-center group transition-colors border-b border-slate-50 last:border-0">
                                                        <span className="text-sm font-medium text-slate-700 group-hover:text-blue-600">{p.name}</span>
                                                        <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2 py-1 rounded-lg group-hover:bg-blue-50 group-hover:text-blue-600">{p.price.toLocaleString()}đ</span>
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )}

                                {materials.length > 0 ? (
                                    <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                                        <table className="w-full text-sm">
                                            <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
                                                <tr>
                                                    <th className="px-4 py-3 text-left text-xs uppercase tracking-wider">Vật tư</th>
                                                    <th className="px-2 py-3 text-center w-20 text-xs uppercase tracking-wider">SL</th>
                                                    <th className="px-4 py-3 text-right text-xs uppercase tracking-wider">Thành tiền</th>
                                                    <th className="w-10"></th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100">
                                                {materials.map(m => (
                                                    <tr key={m.id} className="bg-white hover:bg-slate-50/50 transition-colors">
                                                        <td className="px-4 py-3 font-medium text-slate-800">{m.name}</td>
                                                        <td className="px-2 py-3">
                                                            <input
                                                                type="number"
                                                                value={m.quantity}
                                                                onChange={(e) => updateMaterialQty(m.id, parseInt(e.target.value) || 0)}
                                                                className="w-full text-center bg-slate-50 border border-slate-200 rounded-lg py-1 text-slate-700 font-bold focus:border-blue-500 focus:outline-none"
                                                            />
                                                        </td>
                                                        <td className="px-4 py-3 text-right font-bold text-slate-600">{(m.price * m.quantity).toLocaleString()}đ</td>
                                                        <td className="text-center">
                                                            <button onClick={() => removeMaterial(m.id)} className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all">
                                                                <Trash2 className="w-4 h-4" />
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                            <tfoot className="bg-blue-50/50 border-t border-blue-100">
                                                <tr>
                                                    <td colSpan={2} className="px-4 py-3 font-bold text-slate-700">Tổng chi phí vật tư dự kiến</td>
                                                    <td className="px-4 py-3 text-right font-black text-blue-600">{totalMaterialCost.toLocaleString()}đ</td>
                                                    <td></td>
                                                </tr>
                                            </tfoot>
                                        </table>
                                    </div>
                                ) : (
                                    <div className="text-center py-8 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                                        <Package className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                                        <p className="text-xs text-slate-400">Chưa có vật tư nào được chọn</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-slate-100 bg-white sticky bottom-0 z-10 flex gap-4">
                    {step === 1 ? (
                        <>
                            <button
                                onClick={onClose}
                                className="flex-1 py-3.5 border border-slate-200 rounded-2xl font-bold text-slate-600 hover:bg-slate-50 hover:text-slate-800 transition-all"
                            >
                                Hủy bỏ
                            </button>
                            <button
                                onClick={() => setStep(2)}
                                className="flex-1 py-3.5 bg-blue-600 text-white font-bold rounded-2xl hover:bg-blue-700 shadow-lg shadow-blue-200 hover:shadow-blue-300 transition-all active:scale-95 flex items-center justify-center gap-2"
                            >
                                Tiếp tục <ArrowRight className="w-4 h-4" />
                            </button>
                        </>
                    ) : (
                        <>
                            <button
                                onClick={() => setStep(1)}
                                className="flex-1 py-3.5 border border-slate-200 rounded-2xl font-bold text-slate-600 hover:bg-slate-50 hover:text-slate-800 transition-all"
                            >
                                Quay lại
                            </button>
                            <button
                                onClick={handleSubmit}
                                disabled={submitting}
                                className="flex-1 py-3.5 bg-blue-600 text-white font-bold rounded-2xl hover:bg-blue-700 shadow-lg shadow-blue-200 hover:shadow-blue-300 transition-all active:scale-95 disabled:opacity-70 disabled:shadow-none flex items-center justify-center gap-2"
                            >
                                {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <> <Send className="w-4 h-4" /> Gửi ứng tuyển </>}
                            </button>
                        </>
                    )}
                </div>
            </div>

            {showQuickRegister && (
                <QuickRegisterModal
                    isOpen={showQuickRegister}
                    onClose={() => { setShowQuickRegister(false); onClose(); }}
                    guestData={{ name: form.guestName, phone: form.guestPhone, email: form.guestEmail || undefined }}
                    onSuccess={() => window.location.reload()}
                />
            )}
        </div>
    )
}
