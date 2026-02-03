'use client'

import React, { useState, useEffect } from 'react'
import {
    ArrowLeft, CheckCircle, XCircle, Clock,
    Package, Filter, Search, ChevronRight, Loader2
} from 'lucide-react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { fetchWithAuth } from '../../../../../lib/api-client'
import { toast } from 'react-hot-toast'
import { useAuth } from '../../../../../contexts/auth-context'
import { formatCurrency } from '../../../../../lib/utils'

export default function OrganizationApprovalsPage() {
    // Force rebuild: 2024-02-03
    const { id } = useParams()
    const { user } = useAuth()
    const [orders, setOrders] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [activeTab, setActiveTab] = useState<'pending' | 'all'>('pending')
    const [currentUserRole, setCurrentUserRole] = useState<string>('BUYER')
    const [processingId, setProcessingId] = useState<string | null>(null)

    useEffect(() => {
        if (id) {
            checkRole()
            fetchOrders()
        }
    }, [id, activeTab])

    const checkRole = async () => {
        try {
            const res = await fetchWithAuth(`/api/organizations/${id}`)
            if (res.ok) {
                const data = await res.json()
                const me = data.data.members.find((m: any) => m.userId === user?.id)
                if (me) setCurrentUserRole(me.role)
            }
        } catch (error) {
            console.error(error)
        }
    }

    const fetchOrders = async () => {
        try {
            setLoading(true)
            const statusParam = activeTab === 'pending' ? 'PENDING_APPROVAL' : ''
            const res = await fetchWithAuth(`/api/organizations/${id}/orders?status=${statusParam}`)
            const data = await res.json()
            if (res.ok) {
                setOrders(data.data || [])
            }
        } catch (err) {
            toast.error('Lỗi khi tải đơn hàng')
        } finally {
            setLoading(false)
        }
    }

    const handleAction = async (orderId: string, action: 'approve' | 'reject') => {
        if (!window.confirm(action === 'approve' ? 'Duyệt đơn hàng này?' : 'Từ chối đơn hàng này?')) return

        setProcessingId(orderId)
        try {
            const res = await fetchWithAuth(`/api/organizations/${id}/orders/${orderId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action })
            })

            if (res.ok) {
                toast.success(action === 'approve' ? 'Đã duyệt đơn hàng' : 'Đã từ chối đơn hàng')
                fetchOrders()
            } else {
                toast.error('Có lỗi xảy ra')
            }
        } catch (err) {
            toast.error('Lỗi kết nối')
        } finally {
            setProcessingId(null)
        }
    }

    const isAdmin = currentUserRole === 'OWNER' || currentUserRole === 'ADMIN'

    return (
        <div className="min-h-screen bg-slate-50/50 py-20 pb-40">
            <div className="max-w-6xl mx-auto px-6 space-y-12">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
                    <div className="space-y-6">
                        <Link href={`/account/organization/${id}`} className="inline-flex items-center text-slate-400 hover:text-indigo-600 font-black text-[10px] uppercase tracking-[0.2em] bg-white px-5 py-2.5 rounded-2xl shadow-sm border border-slate-100 transition-all hover:gap-3">
                            <ArrowLeft className="h-4 w-4 mr-1 transition-all" /> Quay lại tổ chức
                        </Link>
                        <div>
                            <h1 className="text-5xl font-black text-slate-900 tracking-tighter uppercase italic leading-none mb-4">
                                📦 PHÊ DUYỆT <span className="text-indigo-600">ĐƠN HÀNG</span>
                            </h1>
                            <p className="text-slate-500 font-medium text-lg">Quản lý và xét duyệt các yêu cầu mua vật tư từ đội ngũ của bạn.</p>
                        </div>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex bg-white p-2 rounded-[1.5rem] border border-slate-100 shadow-sm w-fit">
                    <button
                        onClick={() => setActiveTab('pending')}
                        className={`px-8 py-3.5 rounded-[1.25rem] text-[11px] font-black uppercase tracking-widest transition-all ${activeTab === 'pending' ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-100' : 'text-slate-400 hover:bg-slate-50'}`}
                    >
                        Đang Chờ Duyệt
                    </button>
                    <button
                        onClick={() => setActiveTab('all')}
                        className={`px-8 py-3.5 rounded-[1.25rem] text-[11px] font-black uppercase tracking-widest transition-all ${activeTab === 'all' ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-100' : 'text-slate-400 hover:bg-slate-50'}`}
                    >
                        Lịch Sử Tất Cả
                    </button>
                </div>

                {/* List */}
                <div className="bg-white rounded-[2.5rem] border border-slate-50 shadow-[0_20px_50px_rgba(0,0,0,0.03)] overflow-hidden min-h-[500px]">
                    {loading ? (
                        <div className="h-full flex items-center justify-center py-40">
                            <Loader2 className="w-12 h-12 animate-spin text-indigo-600" />
                        </div>
                    ) : orders.length > 0 ? (
                        <div className="divide-y divide-slate-50">
                            {orders.map((order) => (
                                <div key={order.id} className="p-10 hover:bg-slate-50/50 transition-all duration-300 flex flex-col md:flex-row gap-8 md:items-center justify-between group">
                                    <div className="flex gap-6">
                                        <div className="w-20 h-20 bg-indigo-50/50 rounded-[1.5rem] flex items-center justify-center text-indigo-600 border border-indigo-100 shrink-0 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                                            <Package size={30} />
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-4 mb-2">
                                                <span className="font-black text-slate-900 text-xl tracking-tight italic">{order.orderNumber}</span>
                                                <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${order.b2bApprovalStatus === 'PENDING_APPROVAL' ? 'bg-amber-100 text-amber-600' :
                                                    order.b2bApprovalStatus === 'APPROVED' ? 'bg-emerald-100 text-emerald-600' :
                                                        order.b2bApprovalStatus === 'REJECTED' ? 'bg-rose-100 text-rose-600' :
                                                            'bg-slate-100 text-slate-500'
                                                    }`}>
                                                    {order.b2bApprovalStatus === 'PENDING_APPROVAL' ? 'Chờ duyệt' :
                                                        order.b2bApprovalStatus === 'APPROVED' ? 'Đã duyệt' :
                                                            order.b2bApprovalStatus === 'REJECTED' ? 'Đã từ chối' : 'Không yêu cầu'}
                                                </span>
                                            </div>
                                            <div className="text-sm text-slate-500 font-bold space-y-1">
                                                <p className="uppercase tracking-tight">Người tạo: <span className="text-slate-900">{order.createdBy.name}</span></p>
                                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest flex items-center gap-2">
                                                    <Clock size={12} /> {new Date(order.createdAt).toLocaleDateString('vi-VN')} • {order.itemCount} sản phẩm
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-8 ml-auto">
                                        <div className="text-right">
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 leading-none">Tổng ngân sách</p>
                                            <p className="text-2xl font-black text-indigo-600 tracking-tighter">
                                                {formatCurrency(order.totalAmount)}
                                            </p>
                                        </div>

                                        {activeTab === 'pending' && isAdmin && (
                                            <div className="flex gap-2 pl-6 border-l border-slate-100">
                                                <button
                                                    onClick={() => handleAction(order.id, 'approve')}
                                                    disabled={!!processingId}
                                                    className="w-10 h-10 rounded-xl bg-green-50 text-green-600 flex items-center justify-center hover:bg-green-500 hover:text-white transition-all shadow-sm active:scale-95 disabled:opacity-50"
                                                    title="Duyệt đơn"
                                                >
                                                    {processingId === order.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle size={20} />}
                                                </button>
                                                <button
                                                    onClick={() => handleAction(order.id, 'reject')}
                                                    disabled={!!processingId}
                                                    className="w-10 h-10 rounded-xl bg-red-50 text-red-600 flex items-center justify-center hover:bg-red-500 hover:text-white transition-all shadow-sm active:scale-95 disabled:opacity-50"
                                                    title="Từ chối"
                                                >
                                                    <XCircle size={20} />
                                                </button>
                                            </div>
                                        )}
                                        {activeTab === 'all' && (
                                            <div className="pl-6 border-l border-slate-100">
                                                <span className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest ${order.status === 'CANCELLED' ? 'bg-red-50 text-red-500' :
                                                    order.status === 'PENDING' ? 'bg-blue-50 text-blue-500' :
                                                        'bg-slate-100 text-slate-500'
                                                    }`}>
                                                    {order.status}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-20 text-center">
                            <Clock size={48} className="text-slate-200 mb-4" />
                            <h3 className="text-slate-900 font-bold uppercase tracking-tight">Không có đơn hàng nào</h3>
                            <p className="text-slate-400 text-sm mt-1">Danh sách đang trống.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
