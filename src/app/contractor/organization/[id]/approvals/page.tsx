'use client'

import React, { useState, useEffect } from 'react'
import {
    ArrowLeft, CheckCircle, XCircle, Clock,
    Package, Loader2
} from 'lucide-react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { fetchWithAuth } from '../../../../../lib/api-client'
import { toast } from 'react-hot-toast'
import { useAuth } from '../../../../../contexts/auth-context'
import { formatCurrency } from '../../../../../lib/utils'

export default function ContractorOrganizationApprovalsPage() {
    const { id } = useParams()
    const { user, isAuthenticated, isLoading: authLoading } = useAuth()


    const [orders, setOrders] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [activeTab, setActiveTab] = useState<'pending' | 'all'>('pending')
    const [currentUserRole, setCurrentUserRole] = useState<string>('BUYER')
    const [processingId, setProcessingId] = useState<string | null>(null)

    useEffect(() => {
        if (id && !authLoading && isAuthenticated && user?.id) {
            checkRole()
            fetchOrders()
        }
    }, [id, activeTab, authLoading, isAuthenticated, user?.id])

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
        <div className="space-y-8 max-w-5xl mx-auto">
                    {/* Header */}
                    <Link href="/contractor/organization" className="inline-flex items-center text-slate-500 hover:text-blue-600 font-bold text-xs uppercase tracking-widest bg-white px-4 py-2 rounded-xl shadow-sm border border-slate-200 transition-all hover:border-blue-200 active:scale-95">
                        <ArrowLeft className="h-4 w-4 mr-2" /> Quay lại danh sách
                    </Link>
                    <div>
                        <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                            <Package className="w-8 h-8 text-blue-600" /> Duyệt Đơn Hàng
                        </h1>
                        <p className="text-slate-500 font-medium mt-1">Quản lý các yêu cầu mua hàng từ thành viên.</p>
                    </div>

                    {!isAuthenticated && !authLoading && (
                        <div className="bg-red-50 border border-red-100 rounded-2xl p-4 text-red-600 text-sm font-bold flex items-center gap-3">
                            <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                            Phiên đăng nhập đã hết hạn hoặc không khả dụng. Vui lòng đăng nhập lại để xem đơn hàng.
                            <Link href="/login" className="ml-auto underline decoration-2 underline-offset-4">Đăng nhập ngay</Link>
                        </div>
                    )}

                    {/* Tabs */}
                    <div className="flex bg-white p-1.5 rounded-2xl border border-slate-100 shadow-sm w-fit">
                        <button
                            onClick={() => setActiveTab('pending')}
                            className={`px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'pending' ? 'bg-blue-500 text-white shadow-lg shadow-blue-100' : 'text-slate-400 hover:bg-slate-50'}`}
                        >
                            Cần Duyệt
                        </button>
                        <button
                            onClick={() => setActiveTab('all')}
                            className={`px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'all' ? 'bg-blue-500 text-white shadow-lg shadow-blue-100' : 'text-slate-400 hover:bg-slate-50'}`}
                        >
                            Tất cả đơn hàng
                        </button>
                    </div>

                    {/* List */}
                    <div className="bg-white rounded-[40px] border border-slate-100 shadow-sm overflow-hidden min-h-[400px]">
                        {loading ? (
                            <div className="h-full flex items-center justify-center py-20">
                                <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
                            </div>
                        ) : orders.length > 0 ? (
                            <div className="divide-y divide-slate-50">
                                {orders.map((order) => (
                                    <div key={order.id} className="p-8 hover:bg-slate-50/50 transition-colors flex flex-col md:flex-row gap-6 md:items-center justify-between group">
                                        <div className="flex gap-4">
                                            <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 border border-blue-100 shrink-0">
                                                <Package size={24} />
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-3 mb-1">
                                                    <span className="font-black text-slate-900 text-lg">{order.orderNumber}</span>
                                                    <span className={`px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-widest ${order.b2bApprovalStatus === 'PENDING_APPROVAL' ? 'bg-amber-100 text-amber-600' :
                                                        order.b2bApprovalStatus === 'APPROVED' ? 'bg-green-100 text-green-600' :
                                                            order.b2bApprovalStatus === 'REJECTED' ? 'bg-red-100 text-red-600' :
                                                                'bg-slate-100 text-slate-500'
                                                        }`}>
                                                        {order.b2bApprovalStatus === 'PENDING_APPROVAL' ? 'Chờ duyệt' :
                                                            order.b2bApprovalStatus === 'APPROVED' ? 'Đã duyệt' :
                                                                order.b2bApprovalStatus === 'REJECTED' ? 'Đã từ chối' : 'Không yêu cầu'}
                                                    </span>
                                                </div>
                                                <div className="text-sm text-slate-500 font-medium space-y-1">
                                                    <p>Người tạo: <span className="text-slate-900 font-bold">{order.createdBy.name}</span></p>
                                                    <p>Ngày tạo: {new Date(order.createdAt).toLocaleDateString()} • {order.itemCount} sản phẩm</p>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-6 ml-auto">
                                            <div className="text-right">
                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Tổng tiền</p>
                                                <p className="text-xl font-black text-blue-600 tracking-tight">
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
    )
}
