'use client'

import React, { useState, useEffect, use } from 'react'
import {
    ArrowLeft, Package, Trash2, Camera,
    AlertTriangle, CheckCircle2, Loader2, Info
} from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { fetchWithAuth } from '@/lib/api-client'
import { toast } from 'react-hot-toast'
import Image from 'next/image'

export default function OrderReturnPage({ params }: { params: Promise<{ id: string }> }) {
    const resolvedParams = use(params)
    const router = useRouter()
    const [order, setOrder] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [submitting, setSubmitting] = useState(false)

    const [selectedItems, setSelectedItems] = useState<any[]>([])
    const [reason, setReason] = useState('')
    const [description, setDescription] = useState('')
    const [evidenceUrls, setEvidenceUrls] = useState<string[]>([])

    useEffect(() => {
        fetchOrderDetail()
    }, [resolvedParams.id])

    const fetchOrderDetail = async () => {
        try {
            setLoading(true)
            const res = await fetchWithAuth(`/api/orders/${resolvedParams.id}`)
            const result = await res.json()
            if (res.ok && result.success) {
                setOrder(result.data)
            } else {
                toast.error('Không tìm thấy đơn hàng')
                router.push('/account/orders')
            }
        } catch (err) {
            toast.error('Lỗi kết nối')
        } finally {
            setLoading(false)
        }
    }

    const toggleItem = (item: any) => {
        const exists = selectedItems.find(i => i.id === item.id)
        if (exists) {
            setSelectedItems(selectedItems.filter(i => i.id !== item.id))
        } else {
            setSelectedItems([...selectedItems, {
                id: item.id,
                productId: item.product.id,
                name: item.product.name,
                quantity: item.quantity,
                unitPrice: item.unitPrice,
                image: item.product.images?.[0]
            }])
        }
    }

    const updateQuantity = (itemId: string, qty: number) => {
        const originalItem = order.orderItems.find((i: any) => i.id === itemId)
        if (qty < 1 || qty > originalItem.quantity) return

        setSelectedItems(selectedItems.map(i =>
            i.id === itemId ? { ...i, quantity: qty } : i
        ))
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (selectedItems.length === 0) {
            toast.error('Vui lòng chọn ít nhất một sản phẩm để trả')
            return
        }
        if (!reason) {
            toast.error('Vui lòng chọn lý do trả hàng')
            return
        }

        setSubmitting(true)
        try {
            const res = await fetchWithAuth('/api/returns/customer', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    orderId: resolvedParams.id,
                    reason,
                    description,
                    evidenceUrls,
                    items: selectedItems.map(i => ({
                        productId: i.productId,
                        quantity: i.quantity,
                        unitPrice: i.unitPrice
                    }))
                })
            })

            if (res.ok) {
                toast.success('Gửi yêu cầu trả hàng thành công!')
                router.push('/account/returns')
            } else {
                const err = await res.json()
                toast.error(err.error || 'Có lỗi xảy ra')
            }
        } catch (err) {
            toast.error('Lỗi kết nối')
        } finally {
            setSubmitting(false)
        }
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
                <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-[#F8FAFC] py-12">
            <div className="max-w-4xl mx-auto px-6 space-y-8">
                <div className="space-y-4">
                    <Link href={`/account/orders/${resolvedParams.id}`} className="inline-flex items-center text-slate-400 hover:text-blue-600 font-black text-[10px] uppercase tracking-widest bg-white px-4 py-2 rounded-xl shadow-sm border border-slate-100 transition-all">
                        <ArrowLeft className="h-4 w-4 mr-2" /> Quay lại đơn hàng
                    </Link>
                    <h1 className="text-4xl font-black text-slate-900 tracking-tighter uppercase">
                        📦 Yêu Cầu Trả Hàng
                    </h1>
                    <p className="text-slate-500 font-medium pt-1">Mã đơn hàng: <span className="text-slate-900 font-black">#{order?.orderNumber}</span></p>
                </div>

                <div className="bg-amber-50 border border-amber-100 rounded-[32px] p-6 flex gap-4 items-start">
                    <AlertTriangle className="text-amber-600 shrink-0 mt-1" size={20} />
                    <p className="text-amber-800 text-sm font-medium leading-relaxed">
                        Hệ thống chỉ hỗ trợ trả hàng cho các đơn hàng đã được giao thành công trong vòng 7 ngày. Các sản phẩm phải còn nguyên trạng hoặc có lỗi do nhà sản xuất/vận chuyển.
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-8 pb-20">
                    {/* Item Selection */}
                    <div className="bg-white rounded-[40px] p-10 border border-slate-100 shadow-sm">
                        <h3 className="text-xl font-black text-slate-900 tracking-tight uppercase mb-8">1. Chọn sản phẩm muốn trả</h3>
                        <div className="space-y-4">
                            {order?.orderItems.map((item: any) => {
                                const isSelected = !!selectedItems.find(i => i.id === item.id)
                                return (
                                    <div
                                        key={item.id}
                                        className={`flex items-center gap-6 p-6 rounded-3xl border-2 transition-all ${isSelected ? 'border-blue-600 bg-blue-50/20' : 'border-slate-50 bg-slate-50/30 grayscale opacity-60'
                                            }`}
                                    >
                                        <button
                                            type="button"
                                            onClick={() => toggleItem(item)}
                                            className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all ${isSelected ? 'bg-blue-600 border-blue-600 text-white' : 'bg-white border-slate-200 text-transparent'
                                                }`}
                                        >
                                            <CheckCircle2 size={16} />
                                        </button>

                                        <div className="relative w-20 h-20 bg-white rounded-2xl overflow-hidden border border-slate-100 shadow-sm">
                                            {item.product.images?.[0] ? (
                                                <Image src={item.product.images[0]} alt={item.product.name} fill className="object-cover" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-slate-300"><Package size={24} /></div>
                                            )}
                                        </div>

                                        <div className="flex-1">
                                            <p className="font-black text-slate-900 leading-tight">{item.product.name}</p>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Giao: {item.quantity} {item.unit || 'đv'}</p>
                                        </div>

                                        {isSelected && (
                                            <div className="flex items-center gap-3">
                                                <button
                                                    type="button"
                                                    onClick={() => updateQuantity(item.id, (selectedItems.find(i => i.id === item.id)?.quantity || 1) - 1)}
                                                    className="w-10 h-10 bg-white border border-slate-200 rounded-xl flex items-center justify-center font-black hover:bg-slate-50 active:scale-95"
                                                >-</button>
                                                <span className="w-8 text-center font-black text-slate-900">
                                                    {selectedItems.find(i => i.id === item.id)?.quantity}
                                                </span>
                                                <button
                                                    type="button"
                                                    onClick={() => updateQuantity(item.id, (selectedItems.find(i => i.id === item.id)?.quantity || 1) + 1)}
                                                    className="w-10 h-10 bg-white border border-slate-200 rounded-xl flex items-center justify-center font-black hover:bg-slate-50 active:scale-95"
                                                >+</button>
                                            </div>
                                        )}
                                    </div>
                                )
                            })}
                        </div>
                    </div>

                    {/* Reason Section */}
                    <div className="bg-white rounded-[40px] p-10 border border-slate-100 shadow-sm">
                        <h3 className="text-xl font-black text-slate-900 tracking-tight uppercase mb-8">2. Lý do trả hàng</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {[
                                'Sản phẩm bị lỗi / hư hỏng',
                                'Giao sai mẫu mã / số lượng',
                                'Vật liệu không đúng mô tả',
                                'Thay đổi nhu cầu công trình',
                                'Lý do khác'
                            ].map(r => (
                                <button
                                    key={r}
                                    type="button"
                                    onClick={() => setReason(r)}
                                    className={`p-5 rounded-2xl border text-left text-sm font-bold transition-all ${reason === r ? 'border-blue-600 bg-blue-50 text-blue-600' : 'border-slate-100 bg-slate-50 text-slate-500 hover:border-blue-200'
                                        }`}
                                >
                                    {r}
                                </button>
                            ))}
                        </div>

                        <div className="mt-8 space-y-4">
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Chi tiết thêm (không bắt buộc)</label>
                            <textarea
                                value={description}
                                onChange={e => setDescription(e.target.value)}
                                placeholder="Mô tả kỹ hơn về tình trạng sản phẩm..."
                                className="w-full bg-slate-50 border-none rounded-2xl px-6 py-5 text-sm font-bold text-slate-900 focus:ring-4 focus:ring-blue-500/10 transition-all outline-none min-h-[120px]"
                            />
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-4">
                        <button
                            type="button"
                            onClick={() => router.back()}
                            className="flex-1 py-5 bg-white border border-slate-200 text-slate-500 font-black rounded-3xl active:scale-[0.98] transition-all text-sm uppercase tracking-widest"
                        >
                            Hủy bỏ
                        </button>
                        <button
                            type="submit"
                            disabled={submitting || selectedItems.length === 0}
                            className="flex-[2] py-5 bg-blue-600 text-white font-black rounded-3xl shadow-xl shadow-blue-100 flex items-center justify-center gap-3 active:scale-[0.98] transition-all text-sm uppercase tracking-widest disabled:opacity-50"
                        >
                            {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Gửi yêu cầu hoàn tiền/trả hàng'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
