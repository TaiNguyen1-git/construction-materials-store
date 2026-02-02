'use client'

import React, { useState, useEffect } from 'react'
import {
    ArrowLeft, Package, Trash2, Camera,
    AlertTriangle, CheckCircle2, Loader2, Info,
    History, Clock, CheckCircle, XCircle
} from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { fetchWithAuth } from '@/lib/api-client'
import { toast } from 'react-hot-toast'
import Image from 'next/image'

const translateReturnStatus = (status: string) => {
    const statuses: Record<string, any> = {
        'PENDING': { label: 'Chờ xử lý', color: 'bg-amber-100 text-amber-600 border-amber-200', icon: Clock },
        'REVIEWING': { label: 'Đang xem xét', color: 'bg-blue-100 text-blue-600 border-blue-200', icon: Info },
        'APPROVED': { label: 'Chấp nhận', color: 'bg-emerald-100 text-emerald-600 border-emerald-200', icon: CheckCircle },
        'REJECTED': { label: 'Bị từ chối', color: 'bg-rose-100 text-rose-600 border-rose-200', icon: XCircle },
        'COMPLETED': { label: 'Đã hoàn tất', color: 'bg-emerald-100 text-emerald-600 border-emerald-200', icon: CheckCircle },
        'CANCELLED': { label: 'Đã hủy', color: 'bg-slate-100 text-slate-400 border-slate-200', icon: XCircle },
    }
    return statuses[status] || { label: status, color: 'bg-slate-100 text-slate-600 border-slate-200', icon: Info }
}

export default function ReturnsListPage() {
    const [returns, setReturns] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchReturns()
    }, [])

    const fetchReturns = async () => {
        try {
            setLoading(true)
            const res = await fetchWithAuth('/api/returns/customer')
            const data = await res.json()
            if (res.ok) {
                setReturns(data.data || [])
            }
        } catch (err) {
            toast.error('Không thể tải lịch sử trả hàng')
        } finally {
            setLoading(false)
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
            <div className="max-w-5xl mx-auto px-6 space-y-8">
                <div className="space-y-4">
                    <Link href="/account" className="inline-flex items-center text-slate-400 hover:text-blue-600 font-black text-[10px] uppercase tracking-widest bg-white px-4 py-2 rounded-xl shadow-sm border border-slate-100 transition-all">
                        <ArrowLeft className="h-4 w-4 mr-2" /> Quay lại tài khoản
                    </Link>
                    <h1 className="text-4xl font-black text-slate-900 tracking-tighter uppercase leading-none">
                        🔄 Lịch Sử Trả Hàng
                    </h1>
                    <p className="text-slate-500 font-medium pt-1">Theo dõi các yêu cầu đổi trả và hoàn tiền của bạn.</p>
                </div>

                <div className="space-y-6">
                    {returns.length > 0 ? (
                        returns.map((entry) => {
                            const status = translateReturnStatus(entry.status)
                            return (
                                <div key={entry.id} className="bg-white rounded-[40px] p-8 border border-slate-100 shadow-sm hover:shadow-xl hover:border-blue-200 transition-all group overflow-hidden relative">
                                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-slate-50">
                                        <div className="space-y-1">
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Số đơn hàng: #{entry.order.orderNumber}</p>
                                            <h3 className="text-xl font-black text-slate-900 tracking-tighter mt-1">Yêu cầu trả hàng ngày {new Date(entry.createdAt).toLocaleDateString()}</h3>
                                        </div>
                                        <div>
                                            <span className={`flex items-center gap-2 px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest border ${status.color}`}>
                                                <status.icon size={14} />
                                                {status.label}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="pt-6 space-y-4">
                                        <p className="text-sm font-bold text-slate-500 uppercase tracking-tight">Sản phẩm trả:</p>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            {entry.items.map((item: any, idx: number) => (
                                                <div key={idx} className="flex items-center gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                                                    <div className="relative w-12 h-12 bg-white rounded-xl overflow-hidden border border-slate-100">
                                                        {item.product.images?.[0] ? (
                                                            <Image src={item.product.images[0]} alt={item.product.name} fill className="object-cover" />
                                                        ) : (
                                                            <div className="w-full h-full flex items-center justify-center text-slate-300"><Package size={16} /></div>
                                                        )}
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-black text-slate-900 leading-tight">{item.product.name}</p>
                                                        <p className="text-[10px] font-bold text-slate-400 uppercase mt-1">Số lượng: {item.quantity}</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>

                                        <div className="mt-6 p-6 bg-slate-50 rounded-3xl border border-slate-100">
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Lý do từ khách hàng</p>
                                            <p className="text-sm font-bold text-slate-900">{entry.reason}</p>
                                            {entry.description && <p className="text-sm text-slate-500 mt-2 font-medium">{entry.description}</p>}
                                        </div>

                                        {entry.adminNotes && (
                                            <div className="mt-4 p-6 bg-blue-50 rounded-3xl border border-blue-100">
                                                <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-2">Phản hồi từ cửa hàng</p>
                                                <p className="text-sm font-bold text-blue-900">{entry.adminNotes}</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )
                        })
                    ) : (
                        <div className="py-20 bg-white rounded-[40px] border border-dashed border-slate-200 flex flex-col items-center justify-center text-center space-y-6">
                            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center text-slate-400 shadow-inner">
                                <History size={32} />
                            </div>
                            <div>
                                <h3 className="text-xl font-black text-slate-900 uppercase">Chưa có yêu cầu trả hàng nào</h3>
                                <p className="text-slate-500 font-medium mt-1">Mọi yêu cầu trả hàng của bạn sẽ được hiển thị và theo dõi tại đây.</p>
                            </div>
                            <Link href="/account/orders">
                                <button className="bg-blue-600 text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-blue-700 shadow-xl shadow-blue-100 transition-all active:scale-95">
                                    Xem danh sách đơn hàng
                                </button>
                            </Link>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
