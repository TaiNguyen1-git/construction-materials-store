
'use client'

import { useState, useEffect, useRef } from 'react'
import { Toaster, toast } from 'react-hot-toast'
import { AlertCircle, FileText, CheckCircle2, Clock, Plus, Camera, X, MessageSquare } from 'lucide-react'
import { fetchWithAuth } from '@/lib/api-client'

const Spinner = () => (
    <div className="flex justify-center items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
    </div>
)

export default function CustomerDisputePage() {
    const fileInputRef = useRef<HTMLInputElement>(null)
    const [disputes, setDisputes] = useState<any[]>([])
    const [orders, setOrders] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [showForm, setShowForm] = useState(false)
    const [submitting, setSubmitting] = useState(false)
    const [uploadingImage, setUploadingImage] = useState(false)

    const [form, setForm] = useState({
        orderId: '',
        targetType: 'STORE' as 'STORE' | 'CONTRACTOR',
        reason: '',
        description: '',
        evidence: [] as string[]
    })

    useEffect(() => {
        fetchData()
    }, [])

    const fetchData = async () => {
        try {
            const customerRes = await fetchWithAuth('/api/auth/me')
            const customer = await customerRes.json()
            const customerId = customer.customer?.id

            if (!customerId) return

            const [disRes, ordRes] = await Promise.all([
                fetchWithAuth(`/api/disputes?customerId=${customerId}`),
                fetchWithAuth(`/api/account/orders`)
            ])

            if (disRes.ok) setDisputes(await disRes.json())
            if (ordRes.ok) {
                const ordData = await ordRes.json()
                setOrders(ordData.orders || [])
            }
        } catch (error) {
            console.error('Error fetching data:', error)
        } finally {
            setLoading(false)
        }
    }

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

    const selectedOrder = orders.find(o => o.id === form.orderId)
    const hasContractor = !!selectedOrder?.contractorId

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setSubmitting(true)

        try {
            const customerRes = await fetchWithAuth('/api/auth/me')
            const customer = await customerRes.json()

            const type = form.targetType === 'CONTRACTOR' ? 'CUSTOMER_TO_CONTRACTOR' : 'CUSTOMER_TO_STORE'

            const res = await fetchWithAuth('/api/disputes', {
                method: 'POST',
                body: JSON.stringify({
                    orderId: form.orderId,
                    customerId: customer.customer.id,
                    contractorId: form.targetType === 'CONTRACTOR' ? selectedOrder?.contractorId : null,
                    type,
                    reason: form.reason,
                    description: form.description,
                    evidence: form.evidence
                })
            })

            if (res.ok) {
                toast.success('Đã gửi khiêu nại. Chúng tôi sẽ xem xét sớm nhất!')
                setShowForm(false)
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

    if (loading) return <div className="flex justify-center p-20"><Spinner /></div>

    return (
        <div className="max-w-4xl mx-auto p-6">
            <Toaster />
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        <AlertCircle className="text-red-500" /> Trung tâm Tranh chấp
                    </h1>
                    <p className="text-gray-500">Khiếu nại về đơn hàng hoặc thợ thi công</p>
                </div>
                <button
                    onClick={() => setShowForm(!showForm)}
                    className="bg-red-600 text-white px-6 py-2 rounded-lg font-semibold flex items-center gap-2 hover:bg-red-700 transition-colors shadow-lg"
                >
                    {showForm ? 'Hủy' : <><Plus size={18} /> Mở khiếu nại</>}
                </button>
            </div>

            {showForm && (
                <div className="bg-white p-6 rounded-2xl border-2 border-red-50 shadow-xl mb-12 animate-in fade-in slide-in-from-top-4 duration-300">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Chọn đơn hàng/dự án</label>
                                <select
                                    required
                                    value={form.orderId}
                                    onChange={e => setForm({ ...form, orderId: e.target.value, targetType: 'STORE' })}
                                    className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 focus:ring-2 focus:ring-red-500 outline-none transition-all"
                                >
                                    <option value="">-- Chọn đơn hàng --</option>
                                    {orders.map((o: any) => (
                                        <option key={o.id} value={o.id}>#{o.orderNumber} - {o.totalAmount.toLocaleString()}đ</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Đối tượng khiếu nại</label>
                                <div className="flex gap-2 p-1 bg-gray-100 rounded-xl">
                                    <button
                                        type="button"
                                        onClick={() => setForm({ ...form, targetType: 'STORE' })}
                                        className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${form.targetType === 'STORE' ? 'bg-white text-red-600 shadow-sm' : 'text-gray-500'}`}
                                    >
                                        Cửa hàng
                                    </button>
                                    <button
                                        type="button"
                                        disabled={!hasContractor}
                                        onClick={() => setForm({ ...form, targetType: 'CONTRACTOR' })}
                                        className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${form.targetType === 'CONTRACTOR' ? 'bg-white text-red-600 shadow-sm' : 'text-gray-500'} ${!hasContractor ? 'opacity-30 cursor-not-allowed' : ''}`}
                                    >
                                        Nhà thầu {hasContractor ? '' : '(N/A)'}
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="grid md:grid-cols-2 gap-6">
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-2">Lý do khiếu nại</label>
                                <select
                                    required
                                    value={form.reason}
                                    onChange={e => setForm({ ...form, reason: e.target.value })}
                                    className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 focus:ring-2 focus:ring-red-500 outline-none transition-all"
                                >
                                    <option value="">-- Chọn lý do --</option>
                                    {form.targetType === 'STORE' ? (
                                        <>
                                            <option value="Hàng hỏng hóc">Hàng hỏng hóc</option>
                                            <option value="Thiếu số lượng">Thiếu số lượng</option>
                                            <option value="Sai mẫu mã">Sai mẫu mã</option>
                                            <option value="Giao hàng chậm">Giao hàng chậm</option>
                                        </>
                                    ) : (
                                        <>
                                            <option value="Chất lượng thi công kém">Chất lượng thi công kém</option>
                                            <option value="Tiến độ chậm">Tiến độ chậm</option>
                                            <option value="Thái độ kém">Thái độ phục vụ kém</option>
                                            <option value="Không đúng cam kết">Không đúng cam kết kỹ thuật</option>
                                        </>
                                    )}
                                    <option value="Khác">Khác</option>
                                </select>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Mô tả chi tiết sự việc</label>
                            <textarea
                                required
                                value={form.description}
                                onChange={e => setForm({ ...form, description: e.target.value })}
                                rows={4}
                                className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 focus:ring-2 focus:ring-red-500 outline-none transition-all"
                                placeholder={`Hãy mô tả rõ vấn đề bạn gặp phải với ${form.targetType === 'STORE' ? 'đơn hàng' : 'nhà thầu'}...`}
                            ></textarea>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Bằng chứng hình ảnh</label>
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
                                    className={`w-24 h-24 bg-gray-100 rounded-xl flex flex-col items-center justify-center border-2 border-dashed border-gray-300 text-gray-400 cursor-pointer hover:bg-gray-200 hover:border-red-300 hover:text-red-400 transition-all ${uploadingImage ? 'animate-pulse pointer-events-none' : ''}`}
                                >
                                    {uploadingImage ? (
                                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-red-500"></div>
                                    ) : (
                                        <>
                                            <Camera size={28} />
                                            <span className="text-[10px] mt-1 font-medium">Thêm ảnh</span>
                                        </>
                                    )}
                                </div>
                                <p className="text-xs text-gray-400 flex items-center max-w-[200px]">
                                    Hãy tải lên hình ảnh sản phẩm hỏng hoặc hiện trạng lỗi để được hỗ trợ tốt nhất.
                                </p>
                            </div>
                        </div>

                        <div className="flex justify-end pt-4">
                            <button
                                type="submit"
                                disabled={submitting || uploadingImage}
                                className="bg-red-600 text-white px-10 py-4 rounded-xl font-bold hover:bg-red-700 disabled:bg-gray-400 transition-all shadow-xl hover:shadow-red-200"
                            >
                                {submitting ? 'Đang gửi...' : 'Gửi yêu cầu giải quyết'}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            <div className="space-y-4">
                <h2 className="text-lg font-semibold mb-2">Lịch sử khiếu nại</h2>
                {disputes.length === 0 ? (
                    <div className="bg-gray-50 p-12 text-center rounded-2xl border border-dashed border-gray-200 text-gray-400">
                        <Clock className="mx-auto mb-2 opacity-20" size={48} />
                        <p className="font-medium">Bạn chưa có khiếu nại nào</p>
                    </div>
                ) : (
                    disputes.map((dis, i) => (
                        <div key={i} className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all">
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase ${dis.status === 'OPEN' ? 'bg-blue-50 text-blue-600' :
                                            dis.status === 'UNDER_REVIEW' ? 'bg-orange-50 text-orange-600' :
                                                dis.status === 'RESOLVED' ? 'bg-green-50 text-green-600' :
                                                    'bg-gray-50 text-gray-600'
                                            }`}>
                                            {dis.status === 'OPEN' ? 'Đang mở' :
                                                dis.status === 'UNDER_REVIEW' ? 'Đang xem xét' :
                                                    dis.status === 'RESOLVED' ? 'Đã giải quyết' : 'Từ chối'}
                                        </span>
                                        <span className="text-sm font-bold text-gray-900">{dis.reason}</span>
                                    </div>
                                    <p className="text-xs text-gray-400">{new Date(dis.createdAt).toLocaleString('vi-VN')}</p>
                                </div>
                                <div className="text-right">
                                    <FileText size={18} className="text-gray-300" />
                                </div>
                            </div>

                            <p className="text-sm text-gray-600 mb-4 bg-gray-50 p-3 rounded-lg leading-relaxed">
                                {dis.description}
                            </p>

                            {dis.evidence && dis.evidence.length > 0 && (
                                <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
                                    {dis.evidence.map((ev: any, idx: number) => (
                                        <img key={idx} src={ev.imageUrl} alt="Evidence" className="w-16 h-16 object-cover rounded-lg border border-gray-100 shrink-0" />
                                    ))}
                                </div>
                            )}

                            {dis.resolution && (
                                <div className="bg-green-50 border border-green-100 p-4 rounded-xl flex gap-3 mb-4">
                                    <CheckCircle2 className="text-green-600 shrink-0" size={20} />
                                    <div>
                                        <p className="text-sm font-bold text-green-800 mb-1">Ban quản trị:</p>
                                        <p className="text-sm text-green-700 italic">“{dis.resolution}”</p>
                                    </div>
                                </div>
                            )}

                            <div className="border-t border-gray-100 pt-4">
                                <details className="group">
                                    <summary className="text-xs font-bold text-gray-500 cursor-pointer list-none flex items-center gap-1 hover:text-red-500 transition-colors uppercase tracking-widest">
                                        <MessageSquare size={14} /> Thảo luận ({dis.comments?.length || 0})
                                    </summary>

                                    <div className="mt-4 space-y-3">
                                        <div className="max-h-[250px] overflow-y-auto space-y-3 pr-2 custom-scrollbar">
                                            {dis.comments?.map((comment: any, idx: number) => (
                                                <div key={idx} className={`p-3 rounded-xl border ${comment.author.role === 'ADMIN' ? 'bg-blue-50 border-blue-100' : 'bg-gray-50 border-gray-100'}`}>
                                                    <div className="flex justify-between items-center mb-1">
                                                        <span className="text-[9px] font-black uppercase text-gray-400">{comment.author.name}</span>
                                                        <span className="text-[9px] text-gray-300">{new Date(comment.createdAt).toLocaleString('vi-VN')}</span>
                                                    </div>
                                                    <p className="text-xs text-gray-600">{comment.content}</p>
                                                </div>
                                            ))}
                                        </div>

                                        <div className="relative mt-2">
                                            <input
                                                type="text"
                                                placeholder="Nhập nội dung phản hồi..."
                                                className="w-full bg-gray-50 border border-gray-100 rounded-lg p-2 text-sm focus:ring-1 focus:ring-red-500 outline-none pr-10"
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
                                                            toast.error('Lỗi gửi tin')
                                                        }
                                                    }
                                                }}
                                            />
                                            <div className="absolute right-2 top-1/2 -translate-y-1/2 text-[9px] text-gray-300">Enter</div>
                                        </div>
                                    </div>
                                </details>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    )
}
