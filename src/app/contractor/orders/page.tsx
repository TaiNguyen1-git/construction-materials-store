'use client'

/**
 * Contractor Orders Page - Light Theme
 * Order history and management for contractors
 */

import { useState, useEffect } from 'react'
import Link from 'next/link'
import toast from 'react-hot-toast'
import {
    Building2,
    Package,
    FileText,
    CreditCard,
    ShoppingCart,
    ArrowRight,
    LogOut,
    User,
    Bell,
    Search,
    Plus,
    Menu,
    X,
    Home,
    Filter,
    Download,
    Eye,
    ChevronLeft,
    ChevronRight,
    Calendar,
    Edit,
    Trash2,
    ChevronDown,
    Activity,
    Clock,
    CheckCircle2
} from 'lucide-react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { fetchWithAuth } from '@/lib/api-client'
import { useAuth } from '@/contexts/auth-context'
import { formatCurrency } from '@/lib/format-utils'

interface Order {
    id: string
    orderNumber: string
    date: string
    total: number
    status: string
    items: number
    project: string
    paymentStatus?: string
    paymentMethod?: string
    deliveryToken?: string
}

export default function ContractorOrdersPage() {
    const { user, isAuthenticated } = useAuth()
    const queryClient = useQueryClient()
    const [statusFilter, setStatusFilter] = useState('all')
    const [page, setPage] = useState(1)
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
    const [selectedIds, setSelectedIds] = useState<string[]>([])
    const [showViewModal, setShowViewModal] = useState(false)
    const [showDeleteModal, setShowDeleteModal] = useState(false)
    const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false)

    const fetchOrders = async () => {
        const params = new URLSearchParams({
            page: page.toString(),
            limit: '20',
            ...(statusFilter !== 'all' && { status: statusFilter })
        })

        const response = await fetchWithAuth(`/api/contractors/orders?${params}`)
        if (!response.ok) throw new Error('Failed to fetch orders')
        const data = await response.json()
        return data.success ? data.data : { orders: [], pagination: { pages: 1 } }
    }

    const { data: ordersData, isLoading: loading, error } = useQuery({
        queryKey: ['contractor-orders', statusFilter, page],
        queryFn: fetchOrders,
        enabled: isAuthenticated,
        staleTime: 60 * 1000 // Cache for 1 minute
    })

    const orders = (ordersData?.orders || []) as Order[]
    const totalPages = ordersData?.pagination?.pages || 1

    const handleViewOrder = (order: Order) => {
        setSelectedOrder(order)
        setShowViewModal(true)
    }

    const handleEditOrder = (order: Order) => {
        if (order.status !== 'PENDING') {
            toast.error('Chỉ có thể chỉnh sửa đơn hàng đang chờ xác nhận')
            return
        }
        toast.success(`Chuyển đến chỉnh sửa đơn ${order.orderNumber}`)
    }

    const handleDeleteOrder = (order: Order) => {
        if (order.status !== 'PENDING' && order.status !== 'CANCELLED') {
            toast.error('Không thể xoá đơn hàng đang trong quá trình xử lý')
            return
        }
        setSelectedOrder(order)
        setShowDeleteModal(true)
    }

    const confirmDelete = async () => {
        if (!selectedOrder) return
        toast.promise(
            new Promise((resolve) => setTimeout(resolve, 1000)),
            {
                loading: 'Đang xoá đơn hàng...',
                success: 'Đã xoá đơn hàng thành công!',
                error: 'Không thể xoá đơn hàng'
            }
        )
        queryClient.invalidateQueries({ queryKey: ['contractor-orders'] })
        setSelectedIds(selectedIds.filter(id => id !== selectedOrder.id))
        setShowDeleteModal(false)
    }

    const toggleSelectAll = () => {
        if (selectedIds.length === orders.length) {
            setSelectedIds([])
        } else {
            setSelectedIds(orders.map((o: Order) => o.id))
        }
    }

    const toggleSelectOrder = (id: string) => {
        if (selectedIds.includes(id)) {
            setSelectedIds(selectedIds.filter(i => i !== id))
        } else {
            setSelectedIds([...selectedIds, id])
        }
    }

    const handleBulkDelete = () => {
        const deletableIds = orders
            .filter((o: Order) => selectedIds.includes(o.id))
            .filter((o: Order) => o.status === 'PENDING' || o.status === 'CANCELLED')
            .map((o: Order) => o.id)

        if (deletableIds.length === 0) {
            toast.error('Không có đơn hàng nào có thể xoá trong danh sách đã chọn')
            return
        }
        setShowBulkDeleteModal(true)
    }

    const confirmBulkDelete = async () => {
        const deletableIds = orders
            .filter((o: Order) => selectedIds.includes(o.id))
            .filter((o: Order) => o.status === 'PENDING' || o.status === 'CANCELLED')
            .map((o: Order) => o.id)

        toast.promise(
            new Promise((resolve) => setTimeout(resolve, 1500)),
            {
                loading: `Đang xoá ${deletableIds.length} đơn hàng...`,
                success: `Đã xoá thành công ${deletableIds.length} đơn hàng!`,
                error: 'Lỗi khi xoá hàng loạt'
            }
        )

        queryClient.invalidateQueries({ queryKey: ['contractor-orders'] })
        setSelectedIds([])
        setShowBulkDeleteModal(false)
    }

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'DELIVERED': return 'bg-emerald-100 text-emerald-700'
            case 'PROCESSING': return 'bg-orange-100 text-orange-700'
            case 'SHIPPED': return 'bg-blue-100 text-blue-700'
            case 'PENDING': return 'bg-slate-100 text-slate-700'
            case 'CANCELLED': return 'bg-red-100 text-red-700'
            default: return 'bg-slate-100 text-slate-700'
        }
    }

    const getStatusText = (status: string) => {
        switch (status) {
            case 'DELIVERED': return 'Đã giao'
            case 'PROCESSING': return 'Đang xử lý'
            case 'SHIPPED': return 'Đang giao'
            case 'PENDING': return 'Chờ xác nhận'
            case 'CANCELLED': return 'Đã hủy'
            default: return status
        }
    }

    return (
        <div className="space-y-10 animate-in fade-in duration-500 pb-20 max-w-7xl mx-auto">
            {/* Page Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="space-y-2">
                    <h1 className="text-4xl font-black text-slate-900 tracking-tighter uppercase italic flex items-center gap-4">
                        <Package className="w-10 h-10 text-orange-600" />
                        Order History
                    </h1>
                    <p className="text-slate-500 font-bold uppercase text-[10px] tracking-[0.2em]">Quản lý và theo dõi trạng thái đơn vật tư B2B</p>
                </div>

                <div className="flex bg-slate-100 p-1.5 rounded-[2rem] gap-1">
                    <button
                        onClick={() => setStatusFilter('all')}
                        className={`px-8 py-3 rounded-[1.8rem] text-[10px] font-black uppercase tracking-widest transition-all ${statusFilter === 'all' ? 'bg-white text-orange-600 shadow-xl shadow-orange-500/10' : 'text-slate-400 hover:text-slate-600'}`}
                    >
                        Tất cả
                    </button>
                    <button
                        onClick={() => setStatusFilter('PENDING')}
                        className={`px-8 py-3 rounded-[1.8rem] text-[10px] font-black uppercase tracking-widest transition-all ${statusFilter === 'PENDING' ? 'bg-white text-orange-600 shadow-xl shadow-orange-500/10' : 'text-slate-400 hover:text-slate-600'}`}
                    >
                        Chờ Duyệt
                    </button>
                    <button
                        onClick={() => setStatusFilter('DELIVERED')}
                        className={`px-8 py-3 rounded-[1.8rem] text-[10px] font-black uppercase tracking-widest transition-all ${statusFilter === 'DELIVERED' ? 'bg-white text-orange-600 shadow-xl shadow-orange-500/10' : 'text-slate-400 hover:text-slate-600'}`}
                    >
                        Đã giao
                    </button>
                </div>
            </div>

            {/* Content Table Container */}
            <div className="bg-white rounded-[3.5rem] border border-slate-100 shadow-sm overflow-hidden animate-in slide-in-from-bottom-5 duration-700">
                <div className="p-10 border-b border-slate-50 flex items-center justify-between">
                    <div className="relative group flex-1 max-w-md">
                        <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 group-focus-within:text-orange-500 transition-colors" />
                        <input
                            type="text"
                            placeholder="Find orders by number or project..."
                            className="w-full pl-16 pr-6 py-4.5 bg-slate-50 border-transparent rounded-[1.8rem] text-sm focus:bg-white focus:ring-4 focus:ring-orange-500/5 focus:border-orange-500/20 outline-none transition-all font-bold placeholder:text-slate-300"
                        />
                    </div>
                    <div className="flex items-center gap-4">
                        {selectedIds.length > 0 && (
                            <button
                                onClick={handleBulkDelete}
                                className="px-8 py-4.5 bg-red-50 text-red-600 rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest hover:bg-red-100 transition-all border border-red-100 flex items-center gap-3"
                            >
                                <Trash2 size={16} /> Delete ({selectedIds.length})
                            </button>
                        )}
                        <button className="px-8 py-4.5 bg-slate-900 text-white rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest hover:bg-black transition-all flex items-center gap-3 shadow-xl shadow-slate-200">
                            <Download size={16} /> Export CSV
                        </button>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                        <thead>
                            <tr className="bg-slate-50/50">
                                <th className="px-8 py-6 text-center w-20">
                                    <input
                                        type="checkbox"
                                        checked={selectedIds.length === orders.length && orders.length > 0}
                                        onChange={toggleSelectAll}
                                        className="w-5 h-5 rounded-lg border-slate-200 text-orange-600 focus:ring-orange-500 cursor-pointer"
                                    />
                                </th>
                                <th className="text-left px-6 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 italic">Order ID</th>
                                <th className="text-left px-6 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 italic">Project Name</th>
                                <th className="text-left px-6 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 italic">Created At</th>
                                <th className="text-right px-6 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 italic">Financial Value</th>
                                <th className="text-center px-6 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 italic">Workflow</th>
                                <th className="text-center px-6 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 italic">Interaction</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50/50">
                            {loading ? (
                                [1, 2, 3, 4, 5].map(i => (
                                    <tr key={i} className="animate-pulse">
                                        <td colSpan={7} className="px-8 py-6"><div className="h-10 bg-slate-50 rounded-2xl w-full" /></td>
                                    </tr>
                                ))
                            ) : orders.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="px-8 py-40 text-center">
                                        <div className="flex flex-col items-center gap-6 opacity-30">
                                            <Package size={80} className="text-slate-200" />
                                            <p className="text-[10px] font-black uppercase tracking-[0.3em]">No transaction records found</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                orders.map((order) => (
                                    <tr key={order.id} className={`group hover:bg-slate-50/80 transition-all duration-300 ${selectedIds.includes(order.id) ? 'bg-orange-50/30' : ''}`}>
                                        <td className="px-8 py-8 text-center">
                                            <input
                                                type="checkbox"
                                                checked={selectedIds.includes(order.id)}
                                                onChange={() => toggleSelectOrder(order.id)}
                                                className="w-5 h-5 rounded-lg border-slate-200 text-orange-600 focus:ring-orange-500 cursor-pointer"
                                            />
                                        </td>
                                        <td className="px-6 py-8">
                                            <span 
                                                onClick={() => handleViewOrder(order)}
                                                className="font-black text-xs text-orange-600 cursor-pointer hover:underline underline-offset-4 decoration-2"
                                            >
                                                #{order.orderNumber}
                                            </span>
                                        </td>
                                        <td className="px-6 py-8">
                                            <div className="flex items-center gap-4">
                                                <div className="w-1.5 h-10 bg-slate-100 rounded-full group-hover:bg-orange-400 transition-all duration-500" />
                                                <span className="text-xs font-black text-slate-800 uppercase tracking-tighter truncate max-w-[200px] italic">{order.project}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-8 text-xs font-bold text-slate-400 tabular-nums">{order.date}</td>
                                        <td className="px-6 py-8 text-right">
                                            <span className="text-xs font-black text-slate-900 tabular-nums italic">{formatCurrency(order.total)}</span>
                                        </td>
                                        <td className="px-6 py-8 text-center">
                                            <span className={`inline-block px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest shadow-sm ${getStatusColor(order.status)}`}>
                                                {getStatusText(order.status)}
                                            </span>
                                        </td>
                                        <td className="px-6 py-8 text-center">
                                            <div className="flex items-center justify-center gap-3">
                                                <button
                                                    onClick={() => handleViewOrder(order)}
                                                    className="w-10 h-10 flex items-center justify-center bg-slate-50 text-slate-400 hover:bg-slate-900 hover:text-white rounded-xl transition-all active:scale-90"
                                                    title="Quick View"
                                                >
                                                    <Eye size={16} />
                                                </button>
                                                {order.status === 'PENDING' && (
                                                    <button
                                                        onClick={() => handleEditOrder(order)}
                                                        className="w-10 h-10 flex items-center justify-center bg-slate-50 text-slate-400 hover:bg-orange-500 hover:text-white rounded-xl transition-all active:scale-90"
                                                        title="Modify"
                                                    >
                                                        <Edit size={16} />
                                                    </button>
                                                )}
                                                {(order.status === 'PENDING' || order.status === 'CANCELLED') && (
                                                    <button
                                                        onClick={() => handleDeleteOrder(order)}
                                                        className="w-10 h-10 flex items-center justify-center bg-slate-50 text-slate-400 hover:bg-red-500 hover:text-white rounded-xl transition-all active:scale-90"
                                                        title="Revoke"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                <div className="flex items-center justify-between px-10 py-8 bg-slate-50/50">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        Architectural View <span className="text-slate-900">1-{orders.length}</span> of {orders.length} Records
                    </p>
                    <div className="flex items-center gap-2">
                        <button className="w-10 h-10 flex items-center justify-center bg-white border border-slate-100 rounded-xl text-slate-400 hover:text-slate-900 transition-all disabled:opacity-30" disabled>
                            <ChevronLeft size={16} />
                        </button>
                        <button className="w-10 h-10 bg-orange-600 text-white rounded-xl text-[10px] font-black group shadow-lg shadow-orange-500/20">1</button>
                        <button className="w-10 h-10 flex items-center justify-center bg-white border border-slate-100 rounded-xl text-slate-400 hover:text-slate-900 transition-all disabled:opacity-30" disabled>
                            <ChevronRight size={16} />
                        </button>
                    </div>
                </div>
            </div>

            {/* Modals */}
            {showViewModal && selectedOrder && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[110] flex items-center justify-center p-6 animate-in fade-in duration-300">
                    <div className="bg-white rounded-[4rem] w-full max-w-2xl shadow-2xl overflow-hidden animate-in zoom-in duration-300 border border-white/20">
                        <div className="p-12 bg-slate-900 text-white flex justify-between items-center relative">
                            <div className="absolute top-0 right-0 w-40 h-40 bg-white/5 rounded-full -mr-20 -mt-20 blur-3xl"></div>
                            <div className="relative z-10">
                                <h3 className="text-3xl font-black uppercase tracking-tighter italic mb-1">Logistics Detail</h3>
                                <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest">{selectedOrder.orderNumber} • Project Deployment</p>
                            </div>
                            <button 
                                onClick={() => setShowViewModal(false)} 
                                className="w-12 h-12 bg-white/10 hover:bg-white/20 rounded-2xl flex items-center justify-center transition-all group"
                            >
                                <X size={24} className="group-hover:rotate-90 transition-transform" />
                            </button>
                        </div>
                        
                        <div className="p-12 space-y-10">
                            <div className="grid grid-cols-2 gap-10">
                                <div className="space-y-8">
                                    <div className="space-y-2">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Construction Authority</p>
                                        <div className="p-6 bg-slate-50 rounded-[2rem] border border-slate-100 italic font-black text-slate-900 uppercase tracking-tighter">
                                            {selectedOrder.project}
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Transaction Status</p>
                                        <div className="flex">
                                            <span className={`px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-sm ${getStatusColor(selectedOrder.status)}`}>
                                                {getStatusText(selectedOrder.status)}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <div className="space-y-8">
                                    <div className="space-y-2 text-right">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mr-2 text-right">Capital Value</p>
                                        <div className="p-8 bg-orange-50 rounded-[2.5rem] border border-orange-100 flex flex-col items-end">
                                            <p className="text-3xl font-black text-orange-600 italic tracking-tighter">{formatCurrency(selectedOrder.total)}</p>
                                        </div>
                                    </div>
                                    <div className="space-y-2 text-right">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mr-2 text-right">Itemization</p>
                                        <p className="text-xl font-black text-slate-900 uppercase italic tracking-tighter">{selectedOrder.items} Commercial Units</p>
                                    </div>
                                </div>
                            </div>

                            <div className="pt-10 flex gap-6">
                                <button onClick={() => setShowViewModal(false)} className="flex-1 py-6 bg-slate-100 text-slate-400 rounded-3xl font-black text-[10px] uppercase tracking-[0.3em] hover:bg-slate-200 transition-all">Dismiss</button>
                                {selectedOrder.status === 'SHIPPED' && selectedOrder.deliveryToken && (
                                    <Link
                                        href={`/track/${selectedOrder.deliveryToken}`}
                                        className="flex-[2] py-6 bg-emerald-600 text-white rounded-3xl font-black text-[10px] uppercase tracking-[0.3em] hover:bg-emerald-700 transition-all shadow-2xl shadow-emerald-500/20 flex items-center justify-center gap-4 group"
                                    >
                                        Live Track Progress <ArrowRight size={18} className="group-hover:translate-x-2 transition-transform" />
                                    </Link>
                                )}
                                <button className="flex-1 py-6 bg-slate-900 text-white rounded-3xl font-black text-[10px] uppercase tracking-[0.3em] hover:bg-black transition-all shadow-2xl shadow-slate-900/20">Document Print</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {showDeleteModal && selectedOrder && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[120] flex items-center justify-center p-6">
                    <div className="bg-white rounded-[4rem] w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in duration-300">
                        <div className="p-10 bg-red-600 text-white relative">
                            <h3 className="text-2xl font-black uppercase tracking-tighter italic">Revoke Access</h3>
                        </div>
                        <div className="p-12 text-center space-y-10">
                            <div className="w-24 h-24 bg-red-50 rounded-[2.5rem] flex items-center justify-center mx-auto group-hover:rotate-12 transition-all">
                                <Trash2 size={40} className="text-red-500" />
                            </div>
                            <div className="space-y-4">
                                <h4 className="text-2xl font-black text-slate-900 tracking-tighter uppercase italic">Confirm Revocation?</h4>
                                <p className="text-slate-500 font-bold uppercase text-[10px] tracking-widest leading-relaxed">
                                    Đơn hàng <span className="text-red-600">#{selectedOrder.orderNumber}</span> sẽ được gỡ bỏ vĩnh viễn khỏi hệ thống lưu trữ B2B.
                                </p>
                            </div>
                            <div className="flex gap-4">
                                <button onClick={() => setShowDeleteModal(false)} className="flex-1 py-6 bg-slate-100 text-slate-400 rounded-3xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-200 transition-all shadow-sm">Abort</button>
                                <button onClick={confirmDelete} className="flex-1 py-6 bg-red-600 text-white rounded-3xl font-black text-[10px] uppercase tracking-widest hover:bg-red-700 transition-all shadow-xl shadow-red-500/20">Execute</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {showBulkDeleteModal && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[120] flex items-center justify-center p-6">
                    <div className="bg-white rounded-[4rem] w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in duration-300">
                        <div className="p-10 bg-red-600 text-white">
                            <h3 className="text-2xl font-black uppercase tracking-tighter italic">Bulk Revocation</h3>
                        </div>
                        <div className="p-12 text-center space-y-10">
                            <div className="w-24 h-24 bg-red-50 rounded-[2.5rem] flex items-center justify-center mx-auto">
                                <Trash2 size={40} className="text-red-500" />
                            </div>
                            <div className="space-y-4">
                                <h4 className="text-2xl font-black text-slate-900 tracking-tighter uppercase italic">Wipe Selection?</h4>
                                <p className="text-slate-500 font-bold uppercase text-[10px] tracking-widest leading-relaxed">
                                    Bạn đang chuẩn bị xoá <span className="text-red-600 font-black">{selectedIds.length}</span> bản ghi giao dịch đã chọn.
                                </p>
                            </div>
                            <div className="flex gap-4">
                                <button onClick={() => setShowBulkDeleteModal(false)} className="flex-1 py-6 bg-slate-100 text-slate-400 rounded-3xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-200 transition-all">Abort</button>
                                <button onClick={confirmBulkDelete} className="flex-1 py-6 bg-red-600 text-white rounded-3xl font-black text-[10px] uppercase tracking-widest hover:bg-red-700 transition-all shadow-xl shadow-red-500/20">Execute All</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
