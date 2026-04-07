'use client'

import { useState, useEffect, useRef } from 'react'
import { Toaster, toast } from 'react-hot-toast'
import { AlertCircle, FileText, CheckCircle2, Clock, Plus, Camera, X, Building2, User, MessageSquare, Sparkles, ArrowRight, Scale, ThumbsUp, Loader2, ChevronRight, Gavel, ShieldAlert, History, MessageCircle } from 'lucide-react'
import { fetchWithAuth } from '@/lib/api-client'
import { useAuth } from '@/contexts/auth-context'

export default function ContractorDisputePage() {
    const fileInputRef = useRef<HTMLInputElement>(null)
    const { user } = useAuth()
    const [disputes, setDisputes] = useState<any[]>([])
    const [orders, setOrders] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [showForm, setShowForm] = useState(false)
    const [submitting, setSubmitting] = useState(false)
    const [uploadingImage, setUploadingImage] = useState(false)
    const [mediationStep, setMediationStep] = useState<'form' | 'suggestion' | 'escalate'>('form')
    const [mediationSuggestion, setMediationSuggestion] = useState('')

    const [form, setForm] = useState({
        orderId: '',
        targetType: 'STORE' as 'STORE' | 'CUSTOMER',
        reason: '',
        description: '',
        evidence: [] as string[]
    })

    useEffect(() => {
        if (user) {
            fetchData()
        }
    }, [user])

    const fetchData = async () => {
        try {
            setLoading(true)
            const profileRes = await fetchWithAuth('/api/contractors/profile')
            const profileJson = await profileRes.json()
            const contractorId = profileJson.data?.id

            if (!contractorId) {
                setLoading(false)
                return
            }

            const [disRes, ordRes] = await Promise.all([
                fetchWithAuth(`/api/disputes?contractorId=${contractorId}`),
                fetchWithAuth(`/api/contractors/orders`)
            ])

            if (disRes.ok) setDisputes(await disRes.json())
            
            if (ordRes.ok) {
                const ordData = await ordRes.json()
                // The API returns { success: true, data: { orders: [...], pagination: {...} } }
                const orderList = ordData.data?.orders || ordData.orders || []
                setOrders(orderList)
            }
        } catch (error) {
            console.error('Error fetching resolution data:', error)
        } finally {
            setLoading(false)
        }
    }

    const selectedOrder = orders.find(o => o.id === form.orderId)

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        setUploadingImage(true)
        const formData = new FormData()
        formData.append('file', file)

        try {
            const res = await fetchWithAuth('/api/upload', {
                method: 'POST',
                body: formData,
                headers: {}
            })

            const result = await res.json()
            if (result.success) {
                setForm(prev => ({
                    ...prev,
                    evidence: [...prev.evidence, result.data.url]
                }))
                toast.success('Evidence uploaded successfully')
            }
        } catch (error) {
            toast.error('Failed to transmit evidence')
        } finally {
            setUploadingImage(false)
        }
    }

    const removeEvidence = (index: number) => {
        setForm(prev => ({
            ...prev,
            evidence: prev.evidence.filter((_, i) => i !== index)
        }))
    }

    const MEDIATION_SUGGESTIONS: Record<string, string> = {
        'Vật tư kém chất lượng': '🔧 Operational Protocol Suggestion:\n\n1. Capture HD evidence of sub-standard assets and transmit via B2B Chat\n2. Invoke "Quality Assurance Recall" within 7 business days\n3. For partial asset consumption, negotiate "Commercial Credit" for upcoming procurement batches',
        'Giao thiếu vật tư': '📦 Logistics Audit Suggestion:\n\n1. Cross-reference digital delivery tokens with physical asset count\n2. Initiate "Logistics Reconciliation" via real-time vendor communications\n3. Request expedited re-delivery within 24-48h window upon confirmation',
        'Giao hàng chậm': '🚛 Scheduling Protocol Suggestion:\n\n1. Verify "Live Tracking" temporal data in Logistics Hub\n2. If delay exceeds >48h, claim "Performance Penalty" covering delivery overhead\n3. Negotiate new high-priority deployment slot with vendor project management',
        'Sai quy cách vật tư': '📐 Geometric Accuracy Suggestion:\n\n1. Contrast physical dimensions with digital procurement specifications\n2. Trigger "Asset Exchange Protocol" within 7-day liability window\n3. Ensure asset integrity remains intact — avoid deployment of incorrect units',
        'Chủ nhà không thanh toán': '💰 Revenue Recovery Suggestion:\n\n1. Transmit "Commercial Remittance Notice" via portal messaging system\n2. If Escrow is active, liquidity will be released post-milestone validation\n3. For non-Escrow transactions, issue formal "Institutional Recovery Notification" via verified channels',
        'Yêu cầu thay đổi ngoài hợp đồng': '📝 Project Variation Suggestion:\n\n1. Formalize "Change Order Appendix" for all architectural modifications\n2. Calculate additional fiscal impact and submit via "Dynamic Bidding" module\n3. Halt deployment until digital confirmation of the modified protocol is secured',
    }

    const handleMediationCheck = (e: React.FormEvent) => {
        e.preventDefault()
        const suggestion = MEDIATION_SUGGESTIONS[form.reason] || `💬 Strategic Overview:\n\n1. Initiate direct resolution dialogue via integrated B2B communication channels\n2. Provide comprehensive evidence vault (Imagery, Metadata, Field Reports)\n3. Propose a specific commercial resolution framework for evaluation`
        setMediationSuggestion(suggestion)
        setMediationStep('suggestion')
    }

    const handleSubmit = async (e?: React.FormEvent) => {
        if (e) e.preventDefault()
        setSubmitting(true)

        try {
            const profileRes = await fetchWithAuth('/api/contractors/profile')
            const profileJson = await profileRes.json()
            const contractorData = profileJson.data

            const type = form.targetType === 'CUSTOMER' ? 'CONTRACTOR_TO_CUSTOMER' : 'CONTRACTOR_TO_STORE'

            const res = await fetchWithAuth('/api/disputes', {
                method: 'POST',
                body: JSON.stringify({
                    orderId: form.orderId,
                    contractorId: contractorData?.id,
                    customerId: selectedOrder?.customerId,
                    type,
                    reason: form.reason,
                    description: form.description,
                    evidence: form.evidence
                })
            })

            if (res.ok) {
                toast.success('Dispute case successfully logged in the resolution vault')
                setShowForm(false)
                setMediationStep('form')
                setForm({ orderId: '', targetType: 'STORE', reason: '', description: '', evidence: [] })
                fetchData()
            } else {
                toast.error('Case registration failed')
            }
        } catch (error) {
            toast.error('Protocol transmission error')
        } finally {
            setSubmitting(false)
        }
    }

    return (
        <div className="space-y-10 animate-in fade-in duration-500 pb-20 max-w-7xl mx-auto">
            <Toaster position="top-right" />
            
            {/* High Impact Resolution Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="space-y-1">
                    <h1 className="text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-3">
                        <Gavel className="w-8 h-8 text-blue-600" />
                        Trung tâm hòa giải
                    </h1>
                    <p className="text-slate-500 text-sm font-medium">Hệ thống giải quyết tranh chấp & Trung tâm hòa giải B2B</p>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={() => {
                            setShowForm(!showForm)
                            if (showForm) setMediationStep('form')
                        }}
                        className={`px-6 py-2.5 ${showForm ? 'bg-slate-100 text-slate-500' : 'bg-blue-600 text-white shadow-md shadow-blue-500/10'} rounded-xl text-sm font-bold transition-all flex items-center gap-2 active:scale-95`}
                    >
                        {showForm ? <><X size={18} /> Hủy bỏ</> : <><ShieldAlert size={18} /> Khiếu nại mới</>}
                    </button>
                </div>
            </div>

            {showForm && (
                <div className="bg-white p-8 md:p-10 rounded-2xl border border-slate-100 shadow-sm mb-12 animate-in slide-in-from-top-5 duration-700 overflow-hidden relative">
                    {/* Resolution Progress Protocol */}
                    <div className="flex items-center gap-4 mb-10 pb-6 border-b border-slate-50 relative z-10">
                        {[
                            { step: 'form', label: 'Thông tin vụ việc', icon: FileText, color: 'text-blue-500', bg: 'bg-blue-50' },
                            { step: 'suggestion', label: 'Chiến lược AI', icon: Sparkles, color: 'text-amber-500', bg: 'bg-amber-50' },
                            { step: 'escalate', label: 'Phân xử', icon: Scale, color: 'text-blue-600', bg: 'bg-blue-50' }
                        ].map((m, i) => (
                            <div key={m.step} className="flex items-center gap-4">
                                <div className={`flex items-center gap-3 px-5 py-2.5 rounded-xl text-xs font-bold transition-all duration-500 ${mediationStep === m.step ? `${m.bg} ${m.color} shadow-sm` : 'bg-slate-50 text-slate-300'}`}>
                                    <m.icon size={16} />
                                    {m.label}
                                </div>
                                {i < 2 && <ArrowRight size={14} className="text-slate-100" />}
                            </div>
                        ))}
                    </div>

                    {/* Stage 01: Case Documentation */}
                    {mediationStep === 'form' && (
                        <form onSubmit={handleMediationCheck} className="space-y-8 relative z-10">
                            <div className="grid md:grid-cols-2 gap-8">
                                <div className="space-y-2">
                                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Giao dịch liên quan</label>
                                    <select
                                        required
                                        value={form.orderId}
                                        onChange={e => setForm({ ...form, orderId: e.target.value })}
                                        className="w-full bg-slate-50 border border-slate-100 rounded-xl px-6 py-3.5 text-sm font-bold focus:bg-white focus:ring-4 focus:ring-blue-600/5 outline-none transition-all"
                                    >
                                        <option value="">-- CHỌN MÃ ĐƠN HÀNG --</option>
                                        {orders.map((o: any) => (
                                            <option key={o.id} value={o.id}>#{o.orderNumber} - {o.customer?.user?.name || 'KHÁCH HÀNG RIÊNG'}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="space-y-2">
                                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Đối tượng khiếu nại</label>
                                    <div className="flex gap-2 p-1.5 bg-slate-50 rounded-xl border border-slate-100">
                                        <button
                                            type="button"
                                            onClick={() => setForm({ ...form, targetType: 'STORE' })}
                                            className={`flex-1 py-2 rounded-lg text-[10px] font-bold transition-all flex items-center justify-center gap-2 uppercase tracking-wider ${form.targetType === 'STORE' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400'}`}
                                        >
                                            <Building2 size={14} /> Nhà cung cấp
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setForm({ ...form, targetType: 'CUSTOMER' })}
                                            className={`flex-1 py-2 rounded-lg text-[10px] font-bold transition-all flex items-center justify-center gap-2 uppercase tracking-wider ${form.targetType === 'CUSTOMER' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400'}`}
                                        >
                                            <User size={14} /> Chủ đầu tư
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Lý do khiếu nại chính</label>
                                <select
                                    required
                                    value={form.reason}
                                    onChange={e => setForm({ ...form, reason: e.target.value })}
                                    className="w-full bg-slate-50 border border-slate-100 rounded-xl px-6 py-3.5 text-sm font-bold focus:bg-white focus:ring-4 focus:ring-blue-600/5 outline-none transition-all"
                                >
                                    <option value="">-- PHÂN LOẠI TRANH CHẤP --</option>
                                    {form.targetType === 'STORE' ? (
                                        <>
                                            <option value="Vật tư kém chất lượng">CHẤT LƯỢNG VẬT TƯ KHÔNG ĐẢM BẢO</option>
                                            <option value="Giao thiếu vật tư">GIAO THIẾU SỐ LƯỢNG</option>
                                            <option value="Giao hàng chậm">CHẬM TIẾN ĐỘ GIAO HÀNG</option>
                                            <option value="Sai quy cách vật tư">SAI QUY CÁCH KỸ THUẬT</option>
                                        </>
                                    ) : (
                                        <>
                                            <option value="Chủ nhà không thanh toán">CHỦ NHÀ CHẬM THANH TOÁN</option>
                                            <option value="Yêu cầu thay đổi ngoài hợp đồng">YÊU CẦU THAY ĐỔI NGOÀI PHẠM VI</option>
                                            <option value="Gây khó dễ thi công">CẢN TRỞ QUÁ TRÌNH THI CÔNG</option>
                                            <option value="Vi phạm điều khoản an toàn">VI PHẠM AN TOÀN LAO ĐỘNG</option>
                                        </>
                                    )}
                                    <option value="Khác">LÝ DO KHÁC</option>
                                </select>
                            </div>

                            <div className="space-y-2">
                                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Mô tả chi tiết sự việc</label>
                                <textarea
                                    required
                                    value={form.description}
                                    onChange={e => setForm({ ...form, description: e.target.value })}
                                    rows={5}
                                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 text-sm font-semibold leading-relaxed focus:bg-white focus:ring-4 focus:ring-blue-600/5 outline-none transition-all placeholder:text-slate-300"
                                    placeholder="Cung cấp chi tiết dòng thời gian xảy ra sự việc và mong muốn giải quyết của bạn..."
                                ></textarea>
                            </div>

                            <div className="space-y-4">
                                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Bằng chứng hình ảnh/tài liệu</label>
                                <div className="flex flex-wrap gap-4">
                                    {form.evidence.map((url, idx) => (
                                        <div key={idx} className="relative w-24 h-24 group">
                                            <img src={url} alt="Evidence" className="w-full h-full object-cover rounded-xl border border-slate-100" />
                                            <button
                                                type="button"
                                                onClick={() => removeEvidence(idx)}
                                                className="absolute -top-2 -right-2 bg-slate-900 text-white rounded-lg w-7 h-7 flex items-center justify-center shadow-lg opacity-0 group-hover:opacity-100 transition-all hover:bg-rose-600"
                                            >
                                                <X size={14} />
                                            </button>
                                        </div>
                                    ))}

                                    <input
                                        type="file"
                                        ref={fileInputRef}
                                        onChange={handleFileUpload}
                                        className="hidden"
                                        accept="image/*"
                                    />

                                    <div
                                        onClick={() => fileInputRef.current?.click()}
                                        className={`w-24 h-24 bg-slate-50 rounded-xl flex flex-col items-center justify-center border-2 border-dashed border-slate-200 text-slate-300 cursor-pointer hover:bg-white hover:border-blue-400 hover:text-blue-500 transition-all ${uploadingImage ? 'animate-pulse pointer-events-none' : ''}`}
                                    >
                                        {uploadingImage ? (
                                            <Loader2 className="6 h-6 animate-spin text-blue-500" />
                                        ) : (
                                            <>
                                                <Camera size={24} />
                                                <span className="text-[9px] mt-2 font-bold uppercase tracking-wider">Thêm ảnh</span>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="flex justify-end pt-6">
                                <button
                                    type="submit"
                                    disabled={uploadingImage}
                                    className="bg-amber-500 text-white px-8 py-4 rounded-xl font-bold text-xs uppercase tracking-wider hover:bg-amber-600 disabled:bg-slate-200 transition-all shadow-md shadow-amber-500/10 flex items-center gap-3 active:scale-95"
                                >
                                    <Sparkles size={18} />
                                    Tạo chiến lược giải quyết AI
                                </button>
                            </div>
                        </form>
                    )}

                    {/* Stage 02: AI Dynamic Strategy */}
                    {mediationStep === 'suggestion' && (
                        <div className="space-y-8 relative z-10 animate-in zoom-in duration-500">
                            <div className="bg-amber-50 rounded-2xl p-8 border border-amber-100">
                                <div className="flex items-center gap-4 mb-6">
                                    <div className="w-12 h-12 bg-amber-500 rounded-xl flex items-center justify-center text-white shadow-md">
                                        <Sparkles size={24} />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-bold text-amber-900">Chiến lược hỗ trợ AI</h3>
                                        <p className="text-[10px] text-amber-600 font-bold uppercase tracking-[0.2em]">Hệ thống xử lý tranh chấp thông minh</p>
                                    </div>
                                </div>
                                <div className="bg-white rounded-xl p-6 border border-amber-100 text-sm font-semibold text-slate-700 italic leading-relaxed whitespace-pre-wrap">
                                    “{mediationSuggestion}”
                                </div>
                            </div>

                            <div className="flex flex-col sm:flex-row gap-4">
                                <button
                                    onClick={() => setMediationStep('form')}
                                    className="px-6 py-3 border border-slate-200 text-slate-500 rounded-xl font-bold text-xs uppercase tracking-wider hover:bg-slate-50 transition-all active:scale-95"
                                >
                                    ← Thay đổi thông tin
                                </button>
                                <button
                                    onClick={() => {
                                        toast.success('Đã chấp nhận chiến lược. Bắt đầu đàm phán trực tiếp.')
                                        setShowForm(false)
                                        setMediationStep('form')
                                        setForm({ orderId: '', targetType: 'STORE', reason: '', description: '', evidence: [] })
                                    }}
                                    className="flex-1 px-6 py-3 bg-emerald-600 text-white rounded-xl font-bold text-xs uppercase tracking-wider hover:bg-emerald-700 transition-all flex items-center justify-center gap-2 shadow-md shadow-emerald-500/10 active:scale-95"
                                >
                                    <ThumbsUp size={18} /> Chấp nhận giải pháp
                                </button>
                                <button
                                    onClick={() => handleSubmit()}
                                    disabled={submitting}
                                    className="px-6 py-3 bg-blue-600 text-white rounded-xl font-bold text-xs uppercase tracking-wider hover:bg-blue-700 transition-all flex items-center gap-2 shadow-md shadow-blue-500/10 active:scale-95 disabled:opacity-30"
                                >
                                    <Scale size={18} />
                                    {submitting ? 'Đang gửi...' : 'Gửi yêu cầu phân xử'}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Historical Case Records - Bento Interaction */}
            <div className="space-y-6">
                <div className="flex items-center gap-4 px-2">
                    <History size={18} className="text-slate-300" />
                    <h2 className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.3em]">Lịch sử khiếu nại & Tranh chấp</h2>
                </div>
                
                {disputes.length === 0 ? (
                    <div className="bg-white p-24 text-center rounded-3xl border-2 border-dashed border-slate-50 text-slate-300 shadow-sm flex flex-col items-center gap-6">
                        <Scale size={80} className="text-slate-50" />
                        <div className="space-y-1">
                            <p className="font-bold text-slate-900 text-xl tracking-tight">Hệ thống đang ổn định</p>
                            <p className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider">Không có khiếu nại hay tranh chấp nào trong phiên làm việc hiện tại.</p>
                        </div>
                    </div>
                ) : (
                    <div className="grid gap-8">
                        {disputes.map((dis, i) => (
                            <div key={i} className="bg-white p-8 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all group overflow-hidden relative">
                                <div className="absolute top-0 right-0 w-1 h-full bg-slate-50 group-hover:bg-blue-500 transition-all duration-500"></div>
                                
                                <div className="flex justify-between items-start mb-6 pr-4">
                                    <div className="space-y-3">
                                        <div className="flex items-center gap-3">
                                            <span className={`px-3 py-1 rounded-lg text-[9px] font-bold tracking-wider uppercase ${dis.status === 'OPEN' ? 'bg-blue-500 text-white' :
                                                dis.status === 'UNDER_REVIEW' ? 'bg-amber-500 text-white' :
                                                    dis.status === 'RESOLVED' ? 'bg-emerald-500 text-white' :
                                                        'bg-slate-500 text-white'
                                                }`}>
                                                {dis.status === 'OPEN' ? 'Đã khởi tạo' :
                                                    dis.status === 'UNDER_REVIEW' ? 'Đang xác minh' :
                                                        dis.status === 'RESOLVED' ? 'Đã giải quyết' : 'Đã đóng'}
                                            </span>
                                            <h3 className="text-xl font-bold text-slate-900 tracking-tight">{dis.reason}</h3>
                                            <span className="text-[9px] text-slate-400 font-bold bg-slate-50 px-3 py-1 rounded-lg border border-slate-100 uppercase tracking-widest">
                                                Đối tượng: {dis.type === 'CONTRACTOR_TO_STORE' ? 'Nhà cung cấp' : 'Chủ đầu tư'}
                                            </span>
                                        </div>
                                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider flex items-center gap-2">
                                            <Clock size={12} className="text-blue-400" /> Ngày gửi: {new Date(dis.createdAt).toLocaleString('vi-VN')}
                                        </p>
                                    </div>
                                </div>

                                <div className="bg-slate-50/50 p-6 rounded-xl mb-8 border border-slate-100 relative group-hover:bg-white transition-all shadow-inner">
                                    <p className="text-sm text-slate-700 leading-relaxed font-semibold italic">
                                        “{dis.description}”
                                    </p>
                                </div>

                                {dis.evidence && dis.evidence.length > 0 && (
                                    <div className="flex gap-6 mb-10 overflow-x-auto pb-4 custom-scrollbar">
                                        {dis.evidence.map((ev: any, idx: number) => (
                                            <img key={idx} src={ev.imageUrl} alt="Evidence" className="w-24 h-24 object-cover rounded-[1.8rem] border border-slate-100 shadow-sm shrink-0 hover:scale-110 hover:-rotate-3 transition-all duration-500 cursor-zoom-in" />
                                        ))}
                                    </div>
                                )}

                                {dis.resolution && (
                                    <div className="bg-blue-50 border border-blue-100 p-8 rounded-xl flex gap-6 mb-8 shadow-sm">
                                        <div className="w-12 h-12 bg-blue-600 text-white rounded-xl flex items-center justify-center shrink-0">
                                            <CheckCircle2 size={24} />
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-[10px] font-bold text-blue-600 uppercase tracking-widest">Phán quyết cuối cùng từ quản trị viên</p>
                                            <p className="text-base text-blue-900 font-bold leading-relaxed italic">“{dis.resolution}”</p>
                                        </div>
                                    </div>
                                )}

                                <div className="border-t border-slate-50 pt-6 mt-4">
                                    <details className="group/messages">
                                        <summary className="text-[10px] font-bold text-slate-400 cursor-pointer list-none flex items-center gap-3 hover:text-blue-600 transition-all uppercase tracking-wider">
                                            <div className="w-8 h-8 bg-slate-50 rounded-lg flex items-center justify-center group-hover/messages:bg-blue-50 transition-colors">
                                                <MessageCircle size={16} />
                                            </div>
                                            Hội thoại giải quyết ({dis.comments?.length || 0} mục)
                                            <ChevronRight size={12} className="ml-auto group-open/messages:rotate-90 transition-transform duration-500" />
                                        </summary>

                                        <div className="mt-8 space-y-6">
                                            <div className="max-h-[300px] overflow-y-auto space-y-4 pr-4 custom-scrollbar">
                                                {dis.comments?.map((comment: any, idx: number) => (
                                                    <div key={idx} className={`p-6 rounded-2xl border ${comment.author.role === 'ADMIN' ? 'bg-blue-600 text-white border-transparent ml-8 shadow-md' : 'bg-slate-50 border-slate-100 mr-8'}`}>
                                                        <div className="flex justify-between items-center mb-2">
                                                            <span className={`text-[9px] font-bold uppercase tracking-wider ${comment.author.role === 'ADMIN' ? 'text-blue-100' : 'text-slate-400'}`}>
                                                                {comment.author.name} {comment.author.role === 'ADMIN' && '[QUẢN TRỊ VIÊN]'}
                                                            </span>
                                                            <span className={`text-[9px] font-semibold ${comment.author.role === 'ADMIN' ? 'text-blue-200' : 'text-slate-300'}`}>{new Date(comment.createdAt).toLocaleString('vi-VN')}</span>
                                                        </div>
                                                        <p className={`text-xs font-semibold leading-relaxed ${comment.author.role === 'ADMIN' ? 'italic' : ''}`}>{comment.content}</p>
                                                    </div>
                                                ))}
                                            </div>

                                            <div className="relative pt-4">
                                                <input
                                                    type="text"
                                                    placeholder="Nhập nội dung phản hồi hoặc bằng chứng bổ sung..."
                                                    className="w-full bg-slate-900 border-none rounded-xl px-6 py-4 text-xs font-bold text-white placeholder:text-slate-600 focus:ring-4 focus:ring-blue-600/10 outline-none transition-all shadow-lg shadow-black/10"
                                                    onKeyDown={async (e) => {
                                                        if (e.key === 'Enter') {
                                                            const content = e.currentTarget.value.trim()
                                                            if (!content) return
                                                            const input = e.currentTarget

                                                            try {
                                                                const meRes = await fetchWithAuth('/api/auth/me')
                                                                const me = await meRes.json()

                                                                const res = await fetchWithAuth('/api/disputes/comments', {
                                                                    method: 'POST',
                                                                    body: JSON.stringify({
                                                                        disputeId: dis.id,
                                                                        authorId: me.id,
                                                                        content
                                                                    })
                                                                })

                                                                if (res.ok) {
                                                                    input.value = ''
                                                                    fetchData()
                                                                    toast.success('Transmission confirmed')
                                                                }
                                                            } catch (err) {
                                                                toast.error('Transmission failure')
                                                            }
                                                        }
                                                    }}
                                                />
                                                <div className="absolute right-6 top-1/2 -translate-y-1/2 flex items-center gap-4 pointer-events-none opacity-40">
                                                    <span className="text-[10px] font-black text-white uppercase bg-white/10 px-3 py-1 rounded-lg">Execute Transaction</span>
                                                </div>
                                            </div>
                                        </div>
                                    </details>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}
