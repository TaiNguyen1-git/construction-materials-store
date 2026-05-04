'use client'

import { useState, useEffect, useRef } from 'react'
import {
    X, Send, User, Phone, Package,
    Plus, Search, Trash2, CheckCircle, AlertTriangle,
    Sparkles, Loader2, ArrowRight, ShoppingCart,
    Calendar, DollarSign, ListTodo, ShieldCheck,
    CreditCard, Clock, UploadCloud, Paperclip, FileText
} from 'lucide-react'
import toast from 'react-hot-toast'
import Image from 'next/image'

interface Product {
    id: string
    name: string
    price: number
    unit: string
    images?: string[]
    category?: { name: string }
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
    const [showSuggestions, setShowSuggestions] = useState(false)
    const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false)
    const containerRef = useRef<HTMLDivElement>(null)

    // Attachments
    const [attachments, setAttachments] = useState<{name: string, url: string}[]>([])
    const [uploadingFiles, setUploadingFiles] = useState(false)

    // Milestones
    const [milestones, setMilestones] = useState<Milestone[]>([
        { name: 'Tạm ứng đợt 1', percentage: 30 },
        { name: 'Hoàn thành 50% khối lượng', percentage: 40 },
        { name: 'Nghiệm thu & Bàn giao', percentage: 30 }
    ])

    // Restore draft from localStorage
    useEffect(() => {
        const draftKey = `bidding_draft_${projectId}`
        const savedDraft = localStorage.getItem(draftKey)
        if (savedDraft) {
            try {
                const parsed = JSON.parse(savedDraft)
                if (parsed.form) setForm(parsed.form)
                if (parsed.boq) setBoq(parsed.boq)
                if (parsed.milestones) setMilestones(parsed.milestones)
                if (parsed.attachments) setAttachments(parsed.attachments)
                if (parsed.step) setStep(parsed.step)
            } catch (e) {
                console.error("Failed to parse draft", e)
            }
        }
    }, [projectId])

    // Auto-save to localStorage whenever data changes
    useEffect(() => {
        const draftKey = `bidding_draft_${projectId}`
        const draftData = { form, boq, milestones, attachments, step }
        localStorage.setItem(draftKey, JSON.stringify(draftData))
    }, [form, boq, milestones, attachments, step, projectId])

    useEffect(() => {
        const contId = localStorage.getItem('contractor_id')
        const userHintStr = localStorage.getItem('user_hint')
        
        let userId = contId
        
        if (!userId && userHintStr) {
            try {
                const userHint = JSON.parse(userHintStr)
                if (userHint && userHint.role === 'CONTRACTOR') {
                    userId = userHint.id
                    // Auto-repair missing contractor_id
                    localStorage.setItem('contractor_id', userHint.id)
                }
            } catch (e) {}
        }
        
        if (userId) {
            setIsLoggedIn(true)
            setContractorId(userId)
        }
    }, [])

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setShowSuggestions(false)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    useEffect(() => {
        const timer = setTimeout(() => {
            if (searchTerm.trim().length >= 2) {
                searchProducts(searchTerm)
            } else {
                setSearchResults([])
                setShowSuggestions(false)
            }
        }, 300)
        return () => clearTimeout(timer)
    }, [searchTerm])

    const searchProducts = async (term: string) => {
        setIsLoadingSuggestions(true)
        try {
            const res = await fetch(`/api/products?q=${encodeURIComponent(term)}&limit=5`)
            if (res.ok) {
                const data = await res.json()
                if (data.success) {
                    setSearchResults(data.data.data || [])
                    setShowSuggestions(true)
                }
            }
        } catch (err) { console.error(err) } finally {
            setIsLoadingSuggestions(false)
        }
    }

    const addMaterial = (p: Product) => {
        setBoq([...boq, { item: p.name, unit: p.unit, quantity: 1, price: p.price }])
        setSearchTerm('')
        setSearchResults([])
        setShowSearch(false)
        setShowSuggestions(false)
    }

    const updateBoq = (idx: number, field: keyof MaterialItem, val: any) => {
        const newBoq = [...boq]
        newBoq[idx] = { ...newBoq[idx], [field]: val }
        setBoq(newBoq)
    }

    const removeBoq = (idx: number) => {
        setBoq(boq.filter((_, i) => i !== idx))
    }

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files
        if (!files || files.length === 0) return
        
        setUploadingFiles(true)
        const newAttachments = [...attachments]

        for (let i = 0; i < files.length; i++) {
            const file = files[i]
            const formData = new FormData()
            formData.append('file', file)

            try {
                const res = await fetch('/api/upload', {
                    method: 'POST',
                    body: formData
                })
                const data = await res.json()
                if (data.success) {
                    newAttachments.push({ name: data.fileName || file.name, url: data.fileUrl })
                } else {
                    toast.error(data.error || 'Lỗi tải file')
                }
            } catch (error) {
                toast.error('Lỗi kết nối khi tải file')
            }
        }
        
        setAttachments(newAttachments)
        setUploadingFiles(false)
        if (e.target) e.target.value = ''
    }

    const removeAttachment = (idx: number) => {
        setAttachments(attachments.filter((_, i) => i !== idx))
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
                validUntil: form.validUntil || undefined,
                attachments: attachments.length > 0 ? attachments.map(a => a.url) : undefined
            }

            const res = await fetch(`/api/projects/${projectId}/bids`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            })

            const data = await res.json()
            if (data.success) {
                // Clean up draft after successful submission
                localStorage.removeItem(`bidding_draft_${projectId}`)
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
            <div className="bg-white rounded-3xl max-w-4xl w-full h-[95vh] max-h-[95vh] overflow-hidden flex flex-col shadow-2xl animate-in zoom-in-95 duration-500">
                {/* Header */}
                <div className="flex items-center justify-between px-8 py-5 border-b border-slate-100 sticky top-0 bg-white z-10 shrink-0">
                    <div className="flex items-center gap-3">
                        <ShieldCheck className="w-6 h-6 text-blue-600" />
                        <h2 className="text-xl font-bold text-slate-900 tracking-tight uppercase">HỒ SƠ ĐẤU THẦU</h2>
                    </div>
                    <button onClick={onClose} className="p-2.5 bg-slate-50 hover:bg-slate-100 text-slate-400 hover:text-slate-600 rounded-full transition-all active:scale-90">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Vertical Progress Bar for Desktop / Horizontal for Mobile */}
                <div className="px-8 py-4 bg-slate-50/50 border-b border-slate-100 flex items-center justify-center gap-6 md:gap-12 shrink-0">
                     {[
                        { step: 1, label: 'ĐỊNH DANH' },
                        { step: 2, label: 'KĨ THUẬT & VẬT TƯ' },
                        { step: 3, label: 'TÀI CHÍNH & TIẾN ĐỘ' }
                     ].map((s) => (
                        <div key={s.step} className={`flex items-center gap-2 md:gap-3 transition-all ${step >= s.step ? 'text-blue-600' : 'text-slate-400'}`}>
                            <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold transition-all ${step === s.step ? 'bg-blue-600 text-white shadow-md' : step > s.step ? 'bg-emerald-500 text-white' : 'bg-white border border-slate-200'}`}>
                                {step > s.step ? <CheckCircle className="w-4 h-4" /> : s.step}
                            </div>
                            <span className="text-[10px] font-bold uppercase tracking-wider hidden sm:inline-block">{s.label}</span>
                        </div>
                     ))}
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-8 flex flex-col">
                    {step === 1 && (
                        <div className="flex flex-col flex-1 space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
                            <div className="p-4 bg-blue-50 border border-blue-100 rounded-2xl text-blue-800 flex items-start gap-3 shrink-0">
                                <ShieldCheck className="w-5 h-5 text-blue-600 mt-0.5 shrink-0" />
                                <div>
                                    <h4 className="text-sm font-bold mb-1">THỎA THUẬN CAM KẾT</h4>
                                    <p className="text-blue-700/80 text-xs font-medium leading-relaxed">
                                        Bằng cách gửi gói thầu này, bạn cam kết thực hiện công việc với tiêu chuẩn kĩ thuật cao nhất và tuân thủ các điều khoản bảo hành của SmartBuild.
                                    </p>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Thư ngỏ & Cam kết thi công</label>
                                <textarea
                                    value={form.message}
                                    onChange={(e) => setForm({ ...form, message: e.target.value })}
                                    rows={14}
                                    placeholder="Kính gửi Chủ thầu... Tôi cam kết..."
                                    className="w-full px-8 py-6 bg-slate-50 border border-slate-100 rounded-[24px] text-sm font-medium text-slate-900 focus:outline-none focus:ring-4 focus:ring-blue-50 focus:border-blue-400 transition-all resize-none shadow-inner flex-1"
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
                                <div ref={containerRef} className="relative animate-in zoom-in-95 duration-200 mb-6">
                                    <div className="relative">
                                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                                        <input
                                            type="text"
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                            onFocus={() => searchTerm.trim().length >= 2 && setShowSuggestions(true)}
                                            placeholder="Tìm vật tư: xi măng, thép, cát..."
                                            className="w-full pl-12 pr-12 py-4 bg-white border border-slate-200 rounded-2xl text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-50 transition-all shadow-sm"
                                            autoFocus
                                        />
                                        <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
                                            {searchTerm && !isLoadingSuggestions && (
                                                <button
                                                    type="button"
                                                    onClick={() => { setSearchTerm(''); setShowSuggestions(false); }}
                                                    className="p-1 hover:bg-slate-100 text-slate-400 hover:text-slate-600 rounded-lg transition-all"
                                                >
                                                    <X className="h-4 w-4" />
                                                </button>
                                            )}
                                            {isLoadingSuggestions && (
                                                <Loader2 className="h-4 w-4 text-blue-600 animate-spin" />
                                            )}
                                        </div>
                                    </div>
                                    
                                    {showSuggestions && searchResults.length > 0 && (
                                        <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-xl border border-slate-100 z-20 animate-in fade-in slide-in-from-top-2 duration-200 overflow-hidden">
                                            <div className="px-4 py-3 bg-slate-50 border-b border-slate-100 flex items-center gap-2">
                                                <Sparkles className="w-4 h-4 text-blue-500" />
                                                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Gợi ý từ hệ thống</span>
                                            </div>
                                            <div className="max-h-[300px] overflow-y-auto p-2">
                                                {searchResults.map(p => (
                                                    <button key={p.id} onClick={() => addMaterial(p)} className="w-full flex items-center gap-3 p-3 hover:bg-blue-50 rounded-xl transition-all text-left group">
                                                        <div className="flex-1">
                                                            <h5 className="text-sm font-bold text-slate-800 group-hover:text-blue-600 transition-colors line-clamp-1">{p.name}</h5>
                                                            {p.category?.name && <p className="text-[10px] text-slate-500 font-semibold">{p.category.name}</p>}
                                                        </div>
                                                        <div className="text-right flex items-center gap-3">
                                                            <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md">{p.price.toLocaleString()}đ/{p.unit}</span>
                                                            <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-blue-500 opacity-0 group-hover:translate-x-0 group-hover:opacity-100 -translate-x-2 transition-all" />
                                                        </div>
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {boq.length > 0 ? (
                                <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                                    <table className="w-full text-sm">
                                        <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
                                            <tr>
                                                <th className="px-6 py-4 text-left font-bold">Hạng mục / Vật tư</th>
                                                <th className="px-6 py-4 text-center w-32 font-bold">Đơn vị</th>
                                                <th className="px-6 py-4 text-center w-32 font-bold">SL</th>
                                                <th className="px-6 py-4 text-right w-48 font-bold">Đơn giá</th>
                                                <th className="w-16"></th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {boq.map((m, i) => (
                                                <tr key={i} className="hover:bg-slate-50 transition-colors">
                                                    <td className="px-6 py-4">
                                                        <input 
                                                            value={m.item} 
                                                            onChange={(e) => updateBoq(i, 'item', e.target.value)}
                                                            className="w-full bg-white border border-slate-200 rounded-lg px-4 py-2 text-sm font-semibold text-slate-800 outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-all"
                                                        />
                                                    </td>
                                                    <td className="px-6 py-4 text-center">
                                                        <input 
                                                            value={m.unit} 
                                                            onChange={(e) => updateBoq(i, 'unit', e.target.value)}
                                                            className="w-full bg-white border border-slate-200 rounded-lg px-4 py-2 text-sm text-center font-semibold text-slate-800 outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-all"
                                                        />
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <input
                                                            type="number"
                                                            value={m.quantity}
                                                            onChange={(e) => updateBoq(i, 'quantity', parseFloat(e.target.value) || 0)}
                                                            className="w-full text-center bg-white border border-slate-200 rounded-lg px-4 py-2 text-sm font-semibold text-blue-600 outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-all"
                                                        />
                                                    </td>
                                                    <td className="px-6 py-4 text-right">
                                                         <input
                                                            type="number"
                                                            value={m.price}
                                                            onChange={(e) => updateBoq(i, 'price', parseFloat(e.target.value) || 0)}
                                                            className="w-full text-right bg-white border border-slate-200 rounded-lg px-4 py-2 text-sm font-semibold text-emerald-600 outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-all"
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

                            <div className="mt-8 p-6 bg-slate-50 border border-slate-200 rounded-2xl">
                                <div className="flex items-center justify-between mb-4">
                                    <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                                        <Paperclip className="w-4 h-4 text-slate-400" /> Tài liệu đính kèm (Báo giá Excel, PDF, Bản vẽ...)
                                    </h4>
                                    <label className="cursor-pointer px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-semibold text-blue-600 hover:bg-blue-50 transition-all flex items-center gap-2">
                                        <UploadCloud className="w-4 h-4" /> {uploadingFiles ? 'Đang tải...' : 'Tải lên file'}
                                        <input type="file" multiple className="hidden" accept=".pdf,.doc,.docx,.xls,.xlsx,.zip,.rar" onChange={handleFileUpload} disabled={uploadingFiles} />
                                    </label>
                                </div>
                                {attachments.length > 0 && (
                                    <div className="space-y-2 mt-4">
                                        {attachments.map((file, idx) => (
                                            <div key={idx} className="flex items-center justify-between p-3 bg-white border border-slate-100 rounded-xl shadow-sm">
                                                <div className="flex items-center gap-3">
                                                    <FileText className="w-5 h-5 text-blue-500" />
                                                    <span className="text-sm font-medium text-slate-700 truncate max-w-xs">{file.name}</span>
                                                </div>
                                                <button onClick={() => removeAttachment(idx)} className="text-slate-400 hover:text-red-500 transition-colors">
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {step === 3 && (
                        <div className="space-y-10 animate-in fade-in slide-in-from-right-4 duration-500">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-3">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                                        <DollarSign className="w-4 h-4" /> TỔNG GIÁ TRỊ GÓI THẦU (VNĐ)
                                    </label>
                                    <div className="relative">
                                        <input
                                            type="number"
                                            value={form.amount}
                                            onChange={(e) => setForm({ ...form, amount: e.target.value })}
                                            placeholder="Gói thầu trọn gói..."
                                            className="w-full px-8 py-5 bg-slate-50 border border-slate-200 rounded-2xl text-2xl font-bold text-slate-900 outline-none focus:ring-4 focus:ring-blue-50 focus:border-blue-400 transition-all placeholder:text-slate-400"
                                        />
                                        <span className="absolute right-8 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400 uppercase">VND</span>
                                    </div>
                                </div>
                                <div className="space-y-3">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                                        <Clock className="w-4 h-4" /> THỜI GIAN THỰC HIỆN (NGÀY)
                                    </label>
                                    <div className="relative">
                                        <input
                                            type="number"
                                            value={form.completionDays}
                                            onChange={(e) => setForm({ ...form, completionDays: e.target.value })}
                                            placeholder="Dự kiến bao nhiêu ngày..."
                                            className="w-full px-8 py-5 bg-slate-50 border border-slate-200 rounded-2xl text-2xl font-bold text-slate-900 outline-none focus:ring-4 focus:ring-blue-50 focus:border-blue-400 transition-all placeholder:text-slate-400"
                                        />
                                        <span className="absolute right-8 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400 uppercase">NGÀY</span>
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
                <div className="px-8 py-5 border-t border-slate-100 bg-white sticky bottom-0 z-10 flex gap-6 shrink-0">
                    {step > 1 && (
                        <button
                            onClick={() => setStep(step - 1)}
                            className="flex-1 py-4 border border-slate-200 rounded-2xl font-bold text-slate-600 hover:bg-slate-50 hover:text-slate-800 transition-all active:scale-95"
                        >
                            Quay lại
                        </button>
                    )}
                    {step < 3 ? (
                        <button
                            onClick={() => setStep(step + 1)}
                            className="flex-[2] py-4 bg-blue-600 text-white font-bold rounded-2xl hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all active:scale-95 flex items-center justify-center gap-3"
                        >
                            Tiếp tục lộ trình <ArrowRight className="w-5 h-5" />
                        </button>
                    ) : (
                        <button
                            onClick={handleSubmit}
                            disabled={submitting}
                            className="flex-[2] py-4 bg-blue-600 text-white font-bold rounded-2xl hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all active:scale-95 disabled:opacity-50 disabled:shadow-none flex items-center justify-center gap-3"
                        >
                            {submitting ? <Loader2 className="w-6 h-6 animate-spin" /> : <> <Send className="w-5 h-5" /> NỘP HỒ SƠ ĐẤU THẦU </>}
                        </button>
                    )}
                </div>
            </div>
        </div>
    )
}
