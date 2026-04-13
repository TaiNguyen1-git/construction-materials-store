'use client'

import { useState, useEffect } from 'react'
import {
    X, Send, User, Phone, Package,
    Plus, Search, Trash2, CheckCircle, AlertTriangle,
    Sparkles, Loader2, ArrowRight, ShoppingCart,
    Calendar, DollarSign, ListTodo, ShieldCheck,
    CreditCard, Clock
} from 'lucide-react'
import toast from 'react-hot-toast'

interface Product {
    id: string
    name: string
    price: number
    unit: string
}

interface MaterialItem {
    item: string
    unit: string
    quantity: number
    price: number
}

interface Milestone {
    name: string
    percentage: number
}

interface BiddingFormProps {
    projectId: string
    projectTitle: string
    isOpen: boolean
    onClose: () => void
    onSuccess: () => void
}

export default function BiddingForm({
    projectId,
    projectTitle,
    onClose,
    onSuccess
}: BiddingFormProps) {
    const [step, setStep] = useState(1)
    const [submitting, setSubmitting] = useState(false)
    const [isLoggedIn, setIsLoggedIn] = useState(false)
    const [contractorId, setContractorId] = useState<string | null>(null)

    // Form data
    const [form, setForm] = useState({
        message: '',
        amount: '',
        completionDays: '',
        validUntil: ''
    })

    // BoQ Materials
    const [boq, setBoq] = useState<MaterialItem[]>([])
    const [searchTerm, setSearchTerm] = useState('')
    const [searchResults, setSearchResults] = useState<Product[]>([])
    const [showSearch, setShowSearch] = useState(false)

    // Milestones
    const [milestones, setMilestones] = useState<Milestone[]>([
        { name: 'Tạm ứng đợt 1', percentage: 30 },
        { name: 'Hoàn thành 50% khối lượng', percentage: 40 },
        { name: 'Nghiệm thu & Bàn giao', percentage: 30 }
    ])

    useEffect(() => {
        const custId = localStorage.getItem('customer_id')
        if (custId) {
            setIsLoggedIn(true)
            setContractorId(custId)
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
        } catch (err) { console.error(err) }
    }

    const addMaterial = (p: Product) => {
        setBoq([...boq, { item: p.name, unit: p.unit, quantity: 1, price: p.price }])
        setSearchTerm('')
        setSearchResults([])
        setShowSearch(false)
    }

    const updateBoq = (idx: number, field: keyof MaterialItem, val: any) => {
        const newBoq = [...boq]
        newBoq[idx] = { ...newBoq[idx], [field]: val }
        setBoq(newBoq)
    }

    const removeBoq = (idx: number) => {
        setBoq(boq.filter((_, i) => i !== idx))
    }

    const addMilestone = () => {
        setMilestones([...milestones, { name: 'Giai đoạn mới', percentage: 0 }])
    }

    const updateMilestone = (idx: number, field: keyof Milestone, val: any) => {
        const newMilestones = [...milestones]
        newMilestones[idx] = { ...newMilestones[idx], [field]: val }
        setMilestones(newMilestones)
    }

    const totalPercentage = milestones.reduce((sum, m) => sum + m.percentage, 0)

    const handleSubmit = async () => {
        if (!isLoggedIn) {
            toast.error('Vui lòng đăng nhập để đấu thầu chuyên nghiệp')
            return
        }
        if (totalPercentage !== 100) {
            toast.error('Tổng tỷ lệ thanh toán các giai đoạn phải bằng 100%')
            return
        }

        setSubmitting(true)
        try {
            const payload = {
                contractorId,
                amount: parseFloat(form.amount),
                completionDays: parseInt(form.completionDays),
                message: form.message,
                boq: boq.length > 0 ? boq : undefined,
                milestones: milestones.length > 0 ? milestones : undefined,
                validUntil: form.validUntil || undefined
            }

            const res = await fetch(`/api/projects/${projectId}/bids`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            })

            const data = await res.json()
            if (data.success) {
                toast.success('Gửi gói thầu thành công!')
                onSuccess()
            } else {
                toast.error(data.error?.message || 'Có lỗi xảy ra')
            }
        } catch (err) {
            toast.error('Lỗi kết nối')
        } finally {
            setSubmitting(false)
        }
    }

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-[200] p-4">
            <div className="bg-white rounded-[40px] max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col shadow-2xl animate-in zoom-in-95 duration-500">
                {/* Header */}
                <div className="flex items-center justify-between px-10 py-8 border-b border-slate-100 sticky top-0 bg-white z-10">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <ShieldCheck className="w-5 h-5 text-blue-600" />
                            <h2 className="text-2xl font-black text-slate-900 tracking-tight uppercase italic underline underline-offset-8 decoration-blue-200">HỒ SƠ ĐẤU THẦU</h2>
                        </div>
                        <p className="text-sm text-slate-500 font-medium truncate max-w-xl">{projectTitle}</p>
                    </div>
                    <button onClick={onClose} className="p-3 bg-slate-50 hover:bg-slate-100 text-slate-400 hover:text-slate-600 rounded-full transition-all active:scale-90">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Vertical Progress Bar for Desktop / Horizontal for Mobile */}
                <div className="px-10 py-6 bg-slate-50/50 border-b border-slate-100 flex items-center justify-center gap-12">
                     {[
                        { step: 1, label: 'ĐỊNH DANH', icon: User },
                        { step: 2, label: 'KĨ THUẬT & VẬT TƯ', icon: Package },
                        { step: 3, label: 'TÀI CHÍNH & TIẾN ĐỘ', icon: DollarSign }
                     ].map((s) => (
                        <div key={s.step} className={`flex items-center gap-3 transition-all ${step >= s.step ? 'text-blue-600' : 'text-slate-300'}`}>
                            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center text-sm font-black shadow-lg transition-all ${step === s.step ? 'bg-blue-600 text-white scale-125 rotate-6' : step > s.step ? 'bg-emerald-500 text-white' : 'bg-white border-2 border-slate-100 text-slate-300'}`}>
                                {step > s.step ? <CheckCircle className="w-5 h-5" /> : s.step}
                            </div>
                            <span className="text-[10px] font-black uppercase tracking-widest hidden sm:inline-block">{s.label}</span>
                        </div>
                     ))}
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-10">
                    {step === 1 && (
                        <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
                            <div className="p-8 bg-blue-600 rounded-[32px] text-white relative overflow-hidden group">
                                <div className="relative z-10">
                                    <h4 className="text-xl font-black mb-2 flex items-center gap-2">
                                        <ShieldCheck className="w-6 h-6" /> THỎA THUẬN CAM KẾT
                                    </h4>
                                    <p className="text-blue-100 text-xs font-medium leading-relaxed max-w-lg">
                                        Bằng cách gửi gói thầu này, bạn cam kết thực hiện công việc với tiêu chuẩn kĩ thuật cao nhất và tuân thủ các điều khoản bảo hành của SmartBuild.
                                    </p>
                                </div>
                                <Sparkles className="absolute top-1/2 right-4 -translate-y-1/2 w-32 h-32 text-white/10 rotate-12 group-hover:scale-110 transition-transform duration-1000" />
                            </div>

                            <div className="space-y-4">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Thư ngỏ & Cam kết thi công</label>
                                <textarea
                                    value={form.message}
                                    onChange={(e) => setForm({ ...form, message: e.target.value })}
                                    rows={8}
                                    placeholder="Kính gửi Chủ thầu... Tôi cam kết..."
                                    className="w-full px-8 py-6 bg-slate-50 border border-slate-100 rounded-[24px] text-sm font-medium text-slate-900 focus:outline-none focus:ring-4 focus:ring-blue-50 focus:border-blue-400 transition-all resize-none shadow-inner"
                                />
                            </div>
                        </div>
                    )}

                    {step === 2 && (
                        <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
                             <div className="flex items-center justify-between">
                                <h3 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
                                    <ListTodo className="text-blue-600" /> CHI TIẾT KHỐI LƯỢNG (BoQ)
                                </h3>
                                <button
                                    onClick={() => setShowSearch(!showSearch)}
                                    className="px-6 py-2.5 bg-blue-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-700 transition-all shadow-xl shadow-blue-200"
                                >
                                    + Thêm vật tư
                                </button>
                            </div>

                            {showSearch && (
                                <div className="relative animate-in zoom-in-95 duration-200">
                                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                                    <input
                                        type="text"
                                        value={searchTerm}
                                        onChange={(e) => { setSearchTerm(e.target.value); searchProducts(e.target.value); }}
                                        placeholder="Tìm vật tư trong kho SmartBuild để có giá gốc ưu đãi..."
                                        className="w-full pl-12 pr-4 py-4 bg-white border-2 border-blue-100 rounded-2xl text-sm outline-none focus:border-blue-500 shadow-xl"
                                        autoFocus
                                    />
                                    {searchResults.length > 0 && (
                                        <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-100 rounded-2xl shadow-2xl z-20 overflow-hidden ring-1 ring-slate-900/5">
                                            {searchResults.map(p => (
                                                <button key={p.id} onClick={() => addMaterial(p)} className="w-full px-6 py-4 text-left hover:bg-blue-50 flex justify-between items-center group transition-all border-b border-slate-50 last:border-0">
                                                    <span className="text-sm font-black text-slate-700 group-hover:text-blue-600">{p.name}</span>
                                                    <span className="text-xs font-black text-blue-600 bg-blue-50 px-3 py-1.5 rounded-full">{p.price.toLocaleString()}đ</span>
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}

                            {boq.length > 0 ? (
                                <div className="border border-slate-100 rounded-[32px] overflow-hidden shadow-2xl">
                                    <table className="w-full text-sm">
                                        <thead className="bg-[#0c0f17] text-white">
                                            <tr>
                                                <th className="px-6 py-5 text-left text-[10px] font-black uppercase tracking-widest">Hạng mục / Vật tư</th>
                                                <th className="px-6 py-5 text-center w-32 text-[10px] font-black uppercase tracking-widest">Đơn vị</th>
                                                <th className="px-6 py-5 text-center w-24 text-[10px] font-black uppercase tracking-widest">SL</th>
                                                <th className="px-6 py-5 text-right w-40 text-[10px] font-black uppercase tracking-widest">Đơn giá</th>
                                                <th className="w-16"></th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-50">
                                            {boq.map((m, i) => (
                                                <tr key={i} className="hover:bg-slate-50 transition-colors">
                                                    <td className="px-6 py-4">
                                                        <input 
                                                            value={m.item} 
                                                            onChange={(e) => updateBoq(i, 'item', e.target.value)}
                                                            className="w-full bg-transparent font-bold text-slate-800 outline-none"
                                                        />
                                                    </td>
                                                    <td className="px-6 py-4 text-center">
                                                        <input 
                                                            value={m.unit} 
                                                            onChange={(e) => updateBoq(i, 'unit', e.target.value)}
                                                            className="w-full bg-transparent text-center font-bold text-slate-400 outline-none"
                                                        />
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <input
                                                            type="number"
                                                            value={m.quantity}
                                                            onChange={(e) => updateBoq(i, 'quantity', parseFloat(e.target.value) || 0)}
                                                            className="w-full text-center bg-slate-100 rounded-xl py-2 font-black text-blue-600 outline-none"
                                                        />
                                                    </td>
                                                    <td className="px-6 py-4 text-right">
                                                         <input
                                                            type="number"
                                                            value={m.price}
                                                            onChange={(e) => updateBoq(i, 'price', parseFloat(e.target.value) || 0)}
                                                            className="w-full text-right bg-slate-100 rounded-xl py-2 px-3 font-black text-emerald-600 outline-none"
                                                        />
                                                    </td>
                                                    <td className="text-center">
                                                        <button onClick={() => removeBoq(i)} className="text-slate-300 hover:text-red-500 transition-colors p-2">
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <div className="py-20 text-center bg-slate-50 rounded-[40px] border-2 border-dashed border-slate-200 group hover:border-blue-400 transition-all">
                                    <Package className="w-16 h-16 text-slate-200 mx-auto mb-4 group-hover:rotate-12 transition-transform" />
                                    <p className="text-slate-400 font-black uppercase tracking-widest text-xs">Phác thảo bảng BoQ ngay để tăng tính chuyên nghiệp</p>
                                </div>
                            )}
                        </div>
                    )}

                    {step === 3 && (
                        <div className="space-y-10 animate-in fade-in slide-in-from-right-4 duration-500">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                                        <DollarSign className="w-3 h-3" /> TỔNG GIÁ TRỊ GÓI THẦU (VNĐ)
                                    </label>
                                    <div className="relative">
                                        <input
                                            type="number"
                                            value={form.amount}
                                            onChange={(e) => setForm({ ...form, amount: e.target.value })}
                                            placeholder="Gói thầu trọn gói..."
                                            className="w-full px-8 py-5 bg-[#0c0f17] text-blue-400 rounded-3xl text-2xl font-black outline-none ring-4 ring-blue-500/10 focus:ring-blue-500/30 transition-all placeholder:text-slate-700"
                                        />
                                        <span className="absolute right-8 top-1/2 -translate-y-1/2 text-xs font-black text-slate-500 uppercase">VND</span>
                                    </div>
                                </div>
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                                        <Clock className="w-3 h-3" /> THỜI GIAN THỰC HIỆN (NGÀY)
                                    </label>
                                    <div className="relative">
                                        <input
                                            type="number"
                                            value={form.completionDays}
                                            onChange={(e) => setForm({ ...form, completionDays: e.target.value })}
                                            placeholder="Dự kiến bao nhiêu ngày..."
                                            className="w-full px-8 py-5 bg-slate-50 border border-slate-100 rounded-3xl text-2xl font-black outline-none focus:border-blue-400 transition-all placeholder:text-slate-300"
                                        />
                                        <span className="absolute right-8 top-1/2 -translate-y-1/2 text-xs font-black text-slate-400 uppercase">NGÀY</span>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-6">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
                                        <CreditCard className="text-blue-600" /> KẾ HOẠCH THANH TOÁN (MILESTONES)
                                    </h3>
                                    <div className={`text-xs font-black px-4 py-2 rounded-full transition-all ${totalPercentage === 100 ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600 animate-pulse'}`}>
                                        Tổng: {totalPercentage}% {totalPercentage !== 100 && '(Phải = 100%)'}
                                    </div>
                                </div>

                                <div className="bg-slate-50 p-8 rounded-[40px] space-y-4 shadow-inner">
                                    {milestones.map((m, i) => (
                                        <div key={i} className="flex gap-4 items-center animate-in slide-in-from-left-4 duration-300" style={{ animationDelay: `${i*100}ms` }}>
                                            <div className="flex-1">
                                                <input
                                                    value={m.name}
                                                    onChange={(e) => updateMilestone(i, 'name', e.target.value)}
                                                    className="w-full px-6 py-4 bg-white rounded-2xl text-sm font-bold text-slate-800 outline-none border-2 border-transparent focus:border-blue-400 transition-all shadow-sm"
                                                    placeholder="Tên giai đoạn..."
                                                />
                                            </div>
                                            <div className="w-32 relative">
                                                <input
                                                    type="number"
                                                    value={m.percentage}
                                                    onChange={(e) => updateMilestone(i, 'percentage', parseInt(e.target.value) || 0)}
                                                    className="w-full px-6 py-4 bg-white rounded-2xl text-sm font-black text-center text-blue-600 outline-none shadow-sm"
                                                />
                                                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] text-slate-300">%</span>
                                            </div>
                                            <button onClick={() => setMilestones(milestones.filter((_, idx) => idx !== i))} className="p-3 text-slate-300 hover:text-red-500 transition-colors">
                                                <Trash2 className="w-5 h-5" />
                                            </button>
                                        </div>
                                    ))}
                                    <button 
                                        onClick={addMilestone}
                                        className="w-full py-4 border-2 border-dashed border-slate-200 rounded-2xl text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] hover:bg-white hover:border-blue-400 hover:text-blue-600 transition-all"
                                    >
                                        + Thêm giai đoạn thanh toán
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="px-10 py-8 border-t border-slate-100 bg-white sticky bottom-0 z-10 flex gap-6">
                    {step > 1 && (
                        <button
                            onClick={() => setStep(step - 1)}
                            className="flex-1 py-4 border-2 border-slate-100 rounded-3xl font-black text-xs uppercase tracking-widest text-slate-400 hover:bg-slate-50 hover:text-slate-600 transition-all active:scale-95"
                        >
                            Quay lại
                        </button>
                    )}
                    {step < 3 ? (
                        <button
                            onClick={() => setStep(step + 1)}
                            className="flex-[2] py-4 bg-[#0c0f17] text-white font-black text-xs uppercase tracking-[0.3em] rounded-3xl hover:bg-slate-800 shadow-2xl shadow-slate-900/20 transition-all active:scale-95 flex items-center justify-center gap-3"
                        >
                            Tiếp tục lộ trình <ArrowRight className="w-5 h-5" />
                        </button>
                    ) : (
                        <button
                            onClick={handleSubmit}
                            disabled={submitting}
                            className="flex-[2] py-4 bg-blue-600 text-white font-black text-xs uppercase tracking-[0.3em] rounded-3xl hover:bg-blue-700 shadow-2xl shadow-blue-500/30 transition-all active:scale-95 disabled:opacity-50 disabled:shadow-none flex items-center justify-center gap-3"
                        >
                            {submitting ? <Loader2 className="w-6 h-6 animate-spin" /> : <> <Send className="w-5 h-5" /> NỘP HỒ SƠ ĐẤU THẦU </>}
                        </button>
                    )}
                </div>
            </div>
        </div>
    )
}
