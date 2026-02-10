'use client'

import { useState, useEffect, useRef } from 'react'
import { Toaster, toast } from 'react-hot-toast'
import { AlertCircle, FileText, CheckCircle2, Clock, Plus, Camera, X, Building2, User, MessageSquare, Sparkles, ArrowRight, Scale, ThumbsUp, Loader2, ChevronRight } from 'lucide-react'
import { fetchWithAuth } from '@/lib/api-client'
import ContractorHeader from '../components/ContractorHeader'
import Sidebar from '../components/Sidebar'

const Spinner = () => (
    <div className="flex justify-center items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
    </div>
)

export default function ContractorDisputePage() {
    const fileInputRef = useRef<HTMLInputElement>(null)
    const [sidebarOpen, setSidebarOpen] = useState(true)
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
        fetchData()
    }, [])

    const fetchData = async () => {
        try {
            const meRes = await fetchWithAuth('/api/auth/me')
            const me = await meRes.json()
            const contractorId = me.contractorProfile?.id

            if (!contractorId) return

            const [disRes, ordRes] = await Promise.all([
                fetchWithAuth(`/api/disputes?contractorId=${contractorId}`),
                fetchWithAuth(`/api/contractors/orders`)
            ])

            if (disRes.ok) setDisputes(await disRes.json())
            if (ordRes.ok) {
                const ordData = await ordRes.json()
                setOrders(ordData.data || ordData.orders || [])
            }
        } catch (error) {
            console.error('Error fetching data:', error)
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
                toast.success('Đã tải lên hình ảnh')
            }
        } catch (error) {
            toast.error('Lỗi khi tải ảnh lên')
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

    // AI Mediation suggestions based on reason
    const MEDIATION_SUGGESTIONS: Record<string, string> = {
        'Vật tư kém chất lượng': '🔧 Giải pháp gợi ý:\n\n1. Chụp ảnh vật tư bị lỗi và gửi cho cửa hàng qua chat\n2. Yêu cầu đổi trả trong vòng 7 ngày kể từ ngày nhận\n3. Nếu vật tư đã sử dụng một phần, liên hệ yêu cầu credit/giảm giá cho đơn tiếp theo\n\n⏱ Thời gian xử lý trung bình: 2-3 ngày làm việc',
        'Giao thiếu vật tư': '📦 Giải pháp gợi ý:\n\n1. Kiểm tra phiếu giao hàng và đối chiếu với đơn đặt\n2. Liên hệ cửa hàng qua chat để xác nhận thiếu mặt hàng nào\n3. Cửa hàng sẽ giao bổ sung trong 24-48h nếu xác nhận thiếu\n\n💡 Tip: Luôn kiểm tra hàng trước mặt shipper khi nhận',
        'Giao hàng chậm': '🚛 Giải pháp gợi ý:\n\n1. Kiểm tra trạng thái đơn hàng trong trang "Đơn hàng đã đặt"\n2. Nếu chậm >2 ngày, bạn có quyền yêu cầu hoàn phí vận chuyển\n3. Liên hệ cửa hàng để thương lượng lịch giao mới\n\n⚠️ Nếu ảnh hưởng tiến độ thi công, đề nghị bồi thường chi phí nhân công chờ',
        'Sai quy cách vật tư': '📐 Giải pháp gợi ý:\n\n1. So sánh thông số vật tư thực tế với thông số trên đơn\n2. Yêu cầu đổi đúng quy cách trong vòng 7 ngày\n3. Không sử dụng vật tư sai quy cách — giữ nguyên trạng để đổi\n\n📋 Lưu ý: Giữ nguyên bao bì, tem mác để đảm bảo quyền đổi trả',
        'Chủ nhà không thanh toán': '💰 Giải pháp gợi ý:\n\n1. Gửi nhắc nhở thanh toán qua tin nhắn trong app\n2. Nếu có Escrow, tiền sẽ được giải ngân sau nghiệm thu milestone\n3. Nếu không có Escrow, gửi thông báo chính thức qua email\n\n⚖️ Sau 7 ngày không phản hồi, bạn có quyền mở tranh chấp chính thức',
        'Yêu cầu thay đổi ngoài hợp đồng': '📝 Giải pháp gợi ý:\n\n1. Lập phụ lục hợp đồng cho phần thay đổi\n2. Tính toán chi phí phát sinh và gửi báo giá bổ sung\n3. Chỉ thi công khi có xác nhận bằng văn bản (tin nhắn cũng được)\n\n🛡 Tip: Sử dụng tính năng "Sửa đổi hợp đồng" trong trang Hợp đồng',
    }

    const handleMediationCheck = (e: React.FormEvent) => {
        e.preventDefault()
        // Show mediation suggestion instead of submitting directly
        const suggestion = MEDIATION_SUGGESTIONS[form.reason] || `💬 Gợi ý chung:\n\n1. Liên hệ trực tiếp với đối tác qua chat để trao đổi\n2. Cung cấp đầy đủ bằng chứng (ảnh, video, biên bản)\n3. Đề xuất giải pháp cụ thể mà bạn mong muốn\n\nNếu không thể thỏa thuận, bạn có thể chuyển sang tranh chấp chính thức để Admin can thiệp.`
        setMediationSuggestion(suggestion)
        setMediationStep('suggestion')
    }

    const handleSubmit = async (e?: React.FormEvent) => {
        if (e) e.preventDefault()
        setSubmitting(true)

        try {
            const meRes = await fetchWithAuth('/api/auth/me')
            const me = await meRes.json()

            const type = form.targetType === 'CUSTOMER' ? 'CONTRACTOR_TO_CUSTOMER' : 'CONTRACTOR_TO_STORE'

            const res = await fetchWithAuth('/api/disputes', {
                method: 'POST',
                body: JSON.stringify({
                    orderId: form.orderId,
                    contractorId: me.contractorProfile?.id || me.id,
                    customerId: selectedOrder?.customerId,
                    type,
                    reason: form.reason,
                    description: form.description,
                    evidence: form.evidence
                })
            })

            if (res.ok) {
                toast.success('Đã gửi khiếu nại thành công!')
                setShowForm(false)
                setMediationStep('form')
                setForm({ orderId: '', targetType: 'STORE', reason: '', description: '', evidence: [] })
                fetchData()
            } else {
                toast.error('Có lỗi xảy ra')
            }
        } catch (error) {
            toast.error('Lỗi kết nối')
        } finally {
            setSubmitting(false)
        }
    }

    if (loading) return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            <ContractorHeader sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
            <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
            <main className={`flex-1 pt-[60px] transition-all duration-300 ${sidebarOpen ? 'lg:ml-64' : 'ml-0'}`}>
                <div className="flex justify-center p-20"><Spinner /></div>
            </main>
        </div>
    )

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            <Toaster position="top-right" />
            <ContractorHeader sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
            <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

            <main className={`flex-1 pt-[60px] transition-all duration-300 ${sidebarOpen ? 'lg:ml-64' : 'ml-0'}`}>
                <div className="p-4 lg:p-6 max-w-4xl mx-auto">
                    <div className="flex justify-between items-center mb-8">
                        <div>
                            <h1 className="text-2xl font-bold flex items-center gap-2 text-slate-900">
                                <AlertCircle className="text-primary-600" /> Trung tâm Tranh chấp Nhà thầu
                            </h1>
                            <p className="text-gray-500 font-medium text-sm">Phản hồi về vật tư hoặc vấn đề với đối tác</p>
                        </div>
                        <button
                            onClick={() => setShowForm(!showForm)}
                            className="bg-primary-600 text-white px-5 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-primary-700 transition-all shadow-md hover:shadow-lg active:scale-95"
                        >
                            {showForm ? 'Hủy' : <><Plus size={18} /> Gửi khiếu nại</>}
                        </button>
                    </div>

                    {showForm && (
                        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-xl mb-12 animate-in fade-in slide-in-from-top-4 duration-300">
                            {/* Mediation Steps Indicator */}
                            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-100">
                                <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold ${mediationStep === 'form' ? 'bg-primary-100 text-primary-700' : 'bg-gray-100 text-gray-400'}`}>
                                    <span className="w-5 h-5 rounded-full bg-current/20 flex items-center justify-center text-[10px]">1</span>
                                    Mô tả vấn đề
                                </div>
                                <ArrowRight size={14} className="text-gray-300" />
                                <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold ${mediationStep === 'suggestion' ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-400'}`}>
                                    <Sparkles className="w-3.5 h-3.5" />
                                    Gợi ý hòa giải
                                </div>
                                <ArrowRight size={14} className="text-gray-300" />
                                <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold ${mediationStep === 'escalate' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-400'}`}>
                                    <Scale className="w-3.5 h-3.5" />
                                    Tranh chấp
                                </div>
                            </div>

                            {/* Step 1: Form */}
                            {mediationStep === 'form' && (
                                <form onSubmit={handleMediationCheck} className="space-y-6">
                                    <div className="grid md:grid-cols-2 gap-6">
                                        <div>
                                            <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2 px-1">Đơn hàng liên quan</label>
                                            <select
                                                required
                                                value={form.orderId}
                                                onChange={e => setForm({ ...form, orderId: e.target.value })}
                                                className="w-full bg-slate-50 border border-slate-100 rounded-xl p-3 text-sm font-bold focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400 outline-none transition-all"
                                            >
                                                <option value="">-- Chọn đơn hàng --</option>
                                                {orders.map((o: any) => (
                                                    <option key={o.id} value={o.id}>#{o.orderNumber} - {o.customer?.user?.name || 'Khách hàng'}</option>
                                                ))}
                                            </select>
                                        </div>

                                        <div>
                                            <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2 px-1">Đối tượng khiếu nại</label>
                                            <div className="flex gap-2 p-1.5 bg-slate-50 rounded-xl border border-slate-100">
                                                <button
                                                    type="button"
                                                    onClick={() => setForm({ ...form, targetType: 'STORE' })}
                                                    className={`flex-1 py-1.5 rounded-lg text-xs font-black transition-all flex items-center justify-center gap-2 ${form.targetType === 'STORE' ? 'bg-white text-indigo-600 shadow-sm border border-slate-100' : 'text-slate-400'}`}
                                                >
                                                    <Building2 size={14} /> Cửa hàng
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => setForm({ ...form, targetType: 'CUSTOMER' })}
                                                    className={`flex-1 py-1.5 rounded-lg text-xs font-black transition-all flex items-center justify-center gap-2 ${form.targetType === 'CUSTOMER' ? 'bg-white text-indigo-600 shadow-sm border border-slate-100' : 'text-slate-400'}`}
                                                >
                                                    <User size={14} /> Chủ nhà
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2 px-1">Lý do khiếu nại</label>
                                        <select
                                            required
                                            value={form.reason}
                                            onChange={e => setForm({ ...form, reason: e.target.value })}
                                            className="w-full bg-slate-50 border border-slate-100 rounded-xl p-3 text-sm font-bold focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400 outline-none transition-all"
                                        >
                                            <option value="">-- Chọn lý do --</option>
                                            {form.targetType === 'STORE' ? (
                                                <>
                                                    <option value="Vật tư kém chất lượng">Vật tư kém chất lượng</option>
                                                    <option value="Giao thiếu vật tư">Giao thiếu vật tư</option>
                                                    <option value="Giao hàng chậm">Giao hàng chậm (Ảnh hưởng thợ)</option>
                                                    <option value="Sai quy cách vật tư">Sai quy cách vật tư</option>
                                                </>
                                            ) : (
                                                <>
                                                    <option value="Chủ nhà không thanh toán">Chủ nhà không thanh toán</option>
                                                    <option value="Yêu cầu thay đổi ngoài hợp đồng">Yêu cầu thay đổi ngoài hợp đồng</option>
                                                    <option value="Gây khó dễ thi công">Gây khó dễ thi công</option>
                                                    <option value="Vi phạm điều khoản an toàn">Vi phạm điều khoản an toàn</option>
                                                </>
                                            )}
                                            <option value="Khác">Khác</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2 px-1">Mô tả chi tiết</label>
                                        <textarea
                                            required
                                            value={form.description}
                                            onChange={e => setForm({ ...form, description: e.target.value })}
                                            rows={4}
                                            className="w-full bg-slate-50 border border-slate-100 rounded-xl p-3 text-sm font-medium focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400 outline-none transition-all"
                                            placeholder="Mô tả cụ thể sự việc và mong muốn giải quyết..."
                                        ></textarea>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2 px-1">Hình ảnh bằng chứng</label>
                                        <div className="flex flex-wrap gap-4">
                                            {form.evidence.map((url, idx) => (
                                                <div key={idx} className="relative w-24 h-24 group">
                                                    <img src={url} alt="Evidence" className="w-full h-full object-cover rounded-xl border border-gray-200" />
                                                    <button
                                                        type="button"
                                                        onClick={() => removeEvidence(idx)}
                                                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                                                    >
                                                        <X size={12} />
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
                                                className={`w-24 h-24 bg-slate-50 rounded-xl flex flex-col items-center justify-center border-2 border-dashed border-slate-200 text-slate-400 cursor-pointer hover:bg-slate-100 hover:border-primary-300 hover:text-primary-400 transition-all ${uploadingImage ? 'animate-pulse pointer-events-none' : ''}`}
                                            >
                                                {uploadingImage ? (
                                                    <Loader2 className="w-6 h-6 animate-spin text-primary-500" />
                                                ) : (
                                                    <>
                                                        <Camera size={24} />
                                                        <span className="text-[10px] mt-1 font-bold">Thêm ảnh</span>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex justify-end pt-4">
                                        <button
                                            type="submit"
                                            disabled={uploadingImage}
                                            className="bg-amber-500 text-white px-8 py-3 rounded-xl font-black text-sm hover:bg-amber-600 disabled:bg-gray-400 transition-all shadow-lg flex items-center gap-2 active:scale-95"
                                        >
                                            <Sparkles size={18} />
                                            Xem gợi ý hòa giải
                                        </button>
                                    </div>
                                </form>
                            )}

                            {/* Step 2: Mediation Suggestion */}
                            {mediationStep === 'suggestion' && (
                                <div className="space-y-6">
                                    <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6">
                                        <div className="flex items-center gap-3 mb-4">
                                            <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
                                                <Sparkles className="w-5 h-5 text-amber-600" />
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-amber-900">Gợi ý hòa giải — "{form.reason}"</h3>
                                                <p className="text-xs text-amber-600 font-bold uppercase tracking-widest">Hệ thống tư vấn tự động</p>
                                            </div>
                                        </div>
                                        <div className="bg-white rounded-xl p-5 border border-amber-100">
                                            <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{mediationSuggestion}</p>
                                        </div>
                                    </div>

                                    <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 px-1">Vấn đề của bạn:</p>
                                        <p className="text-sm text-slate-600 font-medium px-1">{form.description}</p>
                                    </div>

                                    <div className="flex flex-col sm:flex-row gap-4 pt-2">
                                        <button
                                            onClick={() => setMediationStep('form')}
                                            className="px-6 py-3 border border-slate-200 text-slate-500 rounded-xl font-bold text-xs hover:bg-slate-50 transition-colors uppercase tracking-widest"
                                        >
                                            ← Quay lại
                                        </button>
                                        <button
                                            onClick={() => {
                                                toast.success('Cảm ơn! Hãy thử liên hệ đối tác trước nhé.')
                                                setShowForm(false)
                                                setMediationStep('form')
                                                setForm({ orderId: '', targetType: 'STORE', reason: '', description: '', evidence: [] })
                                            }}
                                            className="flex-1 px-6 py-3 bg-emerald-600 text-white rounded-xl font-black text-xs hover:bg-emerald-700 transition-colors flex items-center justify-center gap-2 shadow-lg shadow-emerald-100 active:scale-95 uppercase tracking-widest"
                                        >
                                            <ThumbsUp size={16} />
                                            Giải quyết theo gợi ý
                                        </button>
                                        <button
                                            onClick={() => handleSubmit()}
                                            disabled={submitting}
                                            className="px-6 py-3 bg-red-600 text-white rounded-xl font-black text-xs hover:bg-red-700 disabled:bg-gray-400 transition-colors flex items-center gap-2 shadow-lg shadow-red-100 active:scale-95 uppercase tracking-widest"
                                        >
                                            <Scale size={16} />
                                            {submitting ? 'Đang gửi...' : 'Mở tranh chấp'}
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    <div className="space-y-6">
                        <h2 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Lịch sử khiếu nại & Tranh chấp</h2>
                        {disputes.length === 0 ? (
                            <div className="bg-white p-16 text-center rounded-[32px] border border-dashed border-slate-200 text-slate-400 shadow-sm">
                                <Scale className="mx-auto mb-4 opacity-20" size={56} />
                                <p className="font-bold text-slate-500">Bạn chưa có khiếu nại nào hiện tại</p>
                                <p className="text-xs text-slate-400 mt-1">Mọi vấn đề sẽ được Ban quản trị nỗ lực giải quyết minh bạch</p>
                            </div>
                        ) : (
                            <div className="grid gap-4">
                                {disputes.map((dis, i) => (
                                    <div key={i} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all group">
                                        <div className="flex justify-between items-start mb-4">
                                            <div>
                                                <div className="flex items-center gap-3 mb-2">
                                                    <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black tracking-widest uppercase ${dis.status === 'OPEN' ? 'bg-blue-50 text-blue-600 border border-blue-100' :
                                                        dis.status === 'UNDER_REVIEW' ? 'bg-orange-50 text-orange-600 border border-orange-100' :
                                                            dis.status === 'RESOLVED' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' :
                                                                'bg-slate-50 text-slate-600 border border-slate-100'
                                                        }`}>
                                                        {dis.status === 'OPEN' ? 'Mới' :
                                                            dis.status === 'UNDER_REVIEW' ? 'Đang duyệt' :
                                                                dis.status === 'RESOLVED' ? 'Đã xử lý' : 'Từ chối'}
                                                    </span>
                                                    <span className="text-sm font-black text-slate-900">{dis.reason}</span>
                                                    <span className="text-[10px] text-slate-400 font-bold bg-slate-50 px-2 py-0.5 rounded border border-slate-100">
                                                        {dis.type === 'CONTRACTOR_TO_STORE' ? 'VS Cửa hàng' : 'VS Chủ nhà'}
                                                    </span>
                                                </div>
                                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight flex items-center gap-1.5">
                                                    <Clock size={10} /> {new Date(dis.createdAt).toLocaleString('vi-VN')}
                                                </p>
                                            </div>
                                            <div className="p-2 bg-slate-50 rounded-xl group-hover:scale-110 transition-transform">
                                                <FileText size={20} className="text-slate-300 group-hover:text-indigo-500" />
                                            </div>
                                        </div>

                                        <p className="text-sm text-slate-600 mb-6 bg-slate-50/50 p-4 rounded-xl leading-relaxed font-medium">
                                            {dis.description}
                                        </p>

                                        {dis.evidence && dis.evidence.length > 0 && (
                                            <div className="flex gap-3 mb-6 overflow-x-auto pb-2 custom-scrollbar">
                                                {dis.evidence.map((ev: any, idx: number) => (
                                                    <img key={idx} src={ev.imageUrl} alt="Evidence" className="w-20 h-20 object-cover rounded-xl border border-slate-100 shadow-sm shrink-0 hover:scale-105 transition-transform" />
                                                ))}
                                            </div>
                                        )}

                                        {dis.resolution && (
                                            <div className="bg-emerald-50 border border-emerald-100/50 p-5 rounded-2xl flex gap-4 mb-6 shadow-sm">
                                                <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center shrink-0">
                                                    <CheckCircle2 className="text-emerald-600" size={20} />
                                                </div>
                                                <div>
                                                    <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-1">Quyết định Ban quản trị</p>
                                                    <p className="text-sm text-emerald-900 font-bold leading-relaxed italic">“{dis.resolution}”</p>
                                                </div>
                                            </div>
                                        )}

                                        <div className="border-t border-slate-100 pt-5">
                                            <details className="group/messages">
                                                <summary className="text-[10px] font-black text-slate-400 cursor-pointer list-none flex items-center gap-2 hover:text-indigo-600 transition-colors uppercase tracking-[0.2em]">
                                                    <MessageSquare size={14} /> Thảo luận ({dis.comments?.length || 0})
                                                    <ChevronRight size={10} className="ml-auto group-open/messages:rotate-90 transition-transform" />
                                                </summary>

                                                <div className="mt-5 space-y-4">
                                                    <div className="max-h-[300px] overflow-y-auto space-y-3 pr-2 custom-scrollbar">
                                                        {dis.comments?.map((comment: any, idx: number) => (
                                                            <div key={idx} className={`p-4 rounded-2xl border ${comment.author.role === 'ADMIN' ? 'bg-blue-50 border-blue-100/50 ml-6 shadow-sm shadow-blue-50' : 'bg-slate-50 border-slate-100 mr-6'}`}>
                                                                <div className="flex justify-between items-center mb-1.5">
                                                                    <span className={`text-[9px] font-black uppercase tracking-widest ${comment.author.role === 'ADMIN' ? 'text-blue-600' : 'text-slate-400'}`}>
                                                                        {comment.author.name} {comment.author.role === 'ADMIN' && '(Quản trị viên)'}
                                                                    </span>
                                                                    <span className="text-[9px] text-slate-300 font-bold">{new Date(comment.createdAt).toLocaleString('vi-VN')}</span>
                                                                </div>
                                                                <p className="text-xs text-slate-700 font-medium leading-relaxed">{comment.content}</p>
                                                            </div>
                                                        ))}
                                                    </div>

                                                    <div className="relative mt-3">
                                                        <input
                                                            type="text"
                                                            placeholder="Nhập phản hồi hoặc bằng chứng bổ sung..."
                                                            className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-xs font-medium focus:ring-2 focus:ring-primary-500/10 focus:border-primary-400 outline-none pr-12 transition-all shadow-inner"
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
                                                                        }
                                                                    } catch (err) {
                                                                        toast.error('Lỗi gửi phản hồi')
                                                                    }
                                                                }
                                                            }}
                                                        />
                                                        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5 pointer-events-none">
                                                            <span className="text-[8px] font-black text-slate-300 uppercase bg-slate-100 px-1 py-0.5 rounded">Enter</span>
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
            </main>
        </div>
    )
}

