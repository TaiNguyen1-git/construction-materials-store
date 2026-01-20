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

    const handleAIGenerate = async () => {
        setAiLoading(true)
        try {
            const res = await fetch('/api/ai/write', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    type: 'BIDDING_PROPOSAL',
                    prompt: 'Hãy giúp tôi viết thư ứng tuyển chuyên nghiệp cho dự án này.',
                    context: {
                        projectTitle,
                        experience: contractorName ? 'đã xác minh trên sàn' : 'nhiều năm kinh nghiệm'
                    }
                })
            })
            const data = await res.json()
            if (data.success) {
                setForm({ ...form, message: data.data.text })
                toast.success('AI đã soạn thảo thư cho bạn!')
            }
        } catch (err) {
            toast.error('Lỗi gọi AI')
        } finally {
            setAiLoading(false)
        }
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
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-100">
                    <div>
                        <h2 className="text-xl font-bold text-gray-900">Ứng tuyển dự án</h2>
                        <p className="text-sm text-gray-500 mt-0.5">{projectTitle}</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full">
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                </div>

                {/* Step Indicator */}
                <div className="flex items-center gap-2 px-6 py-4 bg-gray-50 border-b border-gray-100">
                    <div className={`flex items-center gap-2 ${step >= 1 ? 'text-blue-600' : 'text-gray-400'}`}>
                        <div className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-medium ${step >= 1 ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>1</div>
                        <span className="text-sm font-medium">Thông tin</span>
                    </div>
                    <div className="flex-1 h-px bg-gray-300" />
                    <div className={`flex items-center gap-2 ${step >= 2 ? 'text-blue-600' : 'text-gray-400'}`}>
                        <div className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-medium ${step >= 2 ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>2</div>
                        <span className="text-sm font-medium">Báo giá</span>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6">
                    {step === 1 && (
                        <div className="space-y-6">
                            {isLoggedIn ? (
                                <div className="p-4 bg-green-50 border border-green-200 rounded-xl">
                                    <div className="flex items-center gap-3">
                                        <CheckCircle className="w-5 h-5 text-green-600" />
                                        <div>
                                            <p className="font-medium text-green-800">Tài khoản đã xác minh</p>
                                            <p className="text-sm text-green-600">{contractorName || 'Nhà thầu đối tác'}</p>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl">
                                    <div className="flex items-start gap-3">
                                        <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                                        <div>
                                            <p className="font-medium text-amber-800">Hồ sơ Tự khai báo</p>
                                            <p className="text-sm text-amber-600">Thông tin chưa được xác minh. Chủ dự án sẽ thấy cảnh báo này.</p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {!isLoggedIn && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Họ và tên *</label>
                                        <input
                                            type="text"
                                            value={form.guestName}
                                            onChange={(e) => setForm({ ...form, guestName: e.target.value })}
                                            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Số điện thoại *</label>
                                        <input
                                            type="tel"
                                            value={form.guestPhone}
                                            onChange={(e) => setForm({ ...form, guestPhone: e.target.value })}
                                            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>
                                </div>
                            )}

                            <div>
                                <div className="flex items-center justify-between mb-1.5">
                                    <label className="block text-sm font-medium text-gray-700">Giới thiệu năng lực *</label>
                                    <button
                                        onClick={handleAIGenerate}
                                        disabled={aiLoading}
                                        className="text-xs font-semibold text-purple-600 flex items-center gap-1 hover:text-purple-700 disabled:opacity-50"
                                    >
                                        <Sparkles className="w-3.5 h-3.5" />
                                        {aiLoading ? 'Đang soạn...' : 'AI Soạn giúp tôi'}
                                    </button>
                                </div>
                                <textarea
                                    value={form.message}
                                    onChange={(e) => setForm({ ...form, message: e.target.value })}
                                    rows={5}
                                    placeholder="Kinh nghiệm, đội ngũ, các dự án tương tự..."
                                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 resize-none"
                                />
                            </div>
                        </div>
                    )}

                    {step === 2 && (
                        <div className="space-y-6">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Báo giá tổng (VNĐ)</label>
                                    <input
                                        type="number"
                                        value={form.proposedBudget}
                                        onChange={(e) => setForm({ ...form, proposedBudget: e.target.value })}
                                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Thời gian (ngày)</label>
                                    <input
                                        type="number"
                                        value={form.proposedDays}
                                        onChange={(e) => setForm({ ...form, proposedDays: e.target.value })}
                                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                            </div>

                            <div className="p-4 bg-purple-50 border border-purple-100 rounded-xl relative overflow-hidden">
                                <div className="flex items-center justify-between mb-3 relative z-10">
                                    <div className="flex items-center gap-2">
                                        <Sparkles className="w-4 h-4 text-purple-600" />
                                        <span className="text-sm font-bold text-purple-900">AI Phân tích mức báo giá</span>
                                    </div>
                                    <button
                                        onClick={handleAIAdvice}
                                        disabled={aiLoading || !form.proposedBudget}
                                        className="text-xs font-bold text-white bg-purple-600 px-3 py-1.5 rounded-lg hover:bg-purple-700 disabled:opacity-30"
                                    >
                                        {aiLoading ? 'Đang phân tích...' : 'Phân tích ngay'}
                                    </button>
                                </div>
                                {aiAdvice ? (
                                    <div className="text-sm text-purple-800 bg-white/50 p-3 rounded-lg border border-purple-100">
                                        {aiAdvice}
                                    </div>
                                ) : (
                                    <p className="text-xs text-purple-600">AI giúp bạn so sánh báo giá thị trường.</p>
                                )}

                                {aiProducts && (
                                    <div className="mt-4 pt-4 border-t border-purple-100">
                                        <div className="flex items-center gap-2 mb-2">
                                            <ShoppingCart className="w-4 h-4 text-purple-600" />
                                            <span className="text-xs font-bold text-purple-900 uppercase">Gợi ý vật tư tối ưu (Tiết kiệm 5%)</span>
                                        </div>
                                        <div className="text-xs text-purple-700 leading-relaxed bg-white/40 p-3 rounded-lg border border-dashed border-purple-200">
                                            {aiProducts}
                                            <div className="mt-2 text-[10px] text-purple-500 italic">* Các sản phẩm trên đều có sẵn tại hệ thống kho của SmartBuild.</div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* BoQ Materials Section */}
                            <div>
                                <div className="flex items-center justify-between mb-3">
                                    <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                                        <Package className="w-4 h-4" /> Báo giá vật tư
                                    </label>
                                    <button onClick={() => setShowSearch(!showSearch)} className="text-xs text-blue-600 font-medium">+ Thêm vật tư</button>
                                </div>
                                {showSearch && (
                                    <div className="mb-4 relative">
                                        <input
                                            type="text"
                                            value={searchTerm}
                                            onChange={(e) => { setSearchTerm(e.target.value); searchProducts(e.target.value); }}
                                            placeholder="Tìm sản phẩm..."
                                            className="w-full px-4 py-2.5 border border-gray-200 rounded-lg"
                                        />
                                        {searchResults.length > 0 && (
                                            <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10 max-h-48 overflow-y-auto">
                                                {searchResults.map(p => (
                                                    <button key={p.id} onClick={() => addMaterial(p)} className="w-full px-4 py-3 text-left hover:bg-gray-50 flex justify-between">
                                                        <span className="text-sm">{p.name}</span>
                                                        <span className="text-xs text-gray-500">{p.price.toLocaleString()}đ</span>
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )}
                                {materials.length > 0 && (
                                    <div className="border border-gray-200 rounded-xl overflow-hidden text-sm">
                                        <table className="w-full">
                                            <thead className="bg-gray-50 text-gray-600">
                                                <tr>
                                                    <th className="px-4 py-2 text-left">Vật tư</th>
                                                    <th className="px-4 py-2 text-center w-16">SL</th>
                                                    <th className="px-4 py-2 text-right">Tổng</th>
                                                    <th className="w-8"></th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-100">
                                                {materials.map(m => (
                                                    <tr key={m.id}>
                                                        <td className="px-4 py-2 font-medium">{m.name}</td>
                                                        <td className="px-4 py-2">
                                                            <input type="number" value={m.quantity} onChange={(e) => updateMaterialQty(m.id, parseInt(e.target.value))} className="w-full text-center border rounded" />
                                                        </td>
                                                        <td className="px-4 py-2 text-right">{(m.price * m.quantity).toLocaleString()}đ</td>
                                                        <td><button onClick={() => removeMaterial(m.id)} className="p-1 text-gray-400 hover:text-red-500"><Trash2 className="w-4 h-4" /></button></td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                            <tfoot className="bg-blue-50 font-bold text-blue-800">
                                                <tr>
                                                    <td colSpan={2} className="px-4 py-2">Tổng vật tư</td>
                                                    <td className="px-4 py-2 text-right">{totalMaterialCost.toLocaleString()}đ</td>
                                                    <td></td>
                                                </tr>
                                            </tfoot>
                                        </table>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-gray-100 flex gap-3">
                    {step === 1 ? (
                        <>
                            <button onClick={onClose} className="flex-1 py-3 border rounded-xl hover:bg-gray-50">Hủy</button>
                            <button onClick={() => setStep(2)} className="flex-1 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700">Tiếp theo</button>
                        </>
                    ) : (
                        <>
                            <button onClick={() => setStep(1)} className="flex-1 py-3 border rounded-xl hover:bg-gray-50">Quay lại</button>
                            <button onClick={handleSubmit} disabled={submitting} className="flex-1 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 disabled:opacity-50">
                                {submitting ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : 'Gửi ứng tuyển'}
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
