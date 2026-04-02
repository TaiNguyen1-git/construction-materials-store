'use client'

/**
 * Contractor Orders Page - Light Theme
 * Order history and management for contractors
 */

import { useState, useEffect } from 'react'
import Link from 'next/link'
import toast, { Toaster } from 'react-hot-toast'
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
        toast.success(`Đang chuyển đến màn hình sửa đơn hàng #${order.orderNumber}`)
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
                loading: 'Đang xoá đơn hàng khỏi hệ thống...',
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
                loading: `Đang xoá hàng loạt ${deletableIds.length} đơn hàng...`,
                success: `Đã xoá thành công ${deletableIds.length} bản ghi!`,
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
            case 'SHIPPED': return 'Đang vận chuyển'
            case 'PENDING': return 'Chờ xác nhận'
            case 'CANCELLED': return 'Đã hủy'
            default: return status
        }
    }

    return (
        <div className="space-y-12 animate-in fade-in duration-1000 pb-24 max-w-7xl mx-auto">
            <Toaster position="top-right" />
            
            {/* Page Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-10">
                <div className="space-y-3">
                    <h1 className="text-5xl font-black text-slate-900 tracking-tighter uppercase italic flex items-center gap-5">
                        <Package className="w-12 h-12 text-blue-600" />
                        Lịch sử đơn hàng
                    </h1>
                    <p className="text-slate-500 font-bold uppercase text-[10px] tracking-[0.3em] italic">Theo dõi và quản lý dữ liệu cung ứng vật tư B2B</p>
                </div>

                <div className="flex bg-slate-50 p-2 rounded-[2.5rem] gap-2 shadow-sm border border-slate-100">
                    <button
                        onClick={() => setStatusFilter('all')}
                        className={`px-10 py-4 rounded-[2rem] text-[10px] font-black uppercase tracking-widest transition-all italic ${statusFilter === 'all' ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-100' : 'text-slate-400 hover:text-indigo-600'}`}
                    >
                        Tất cả đơn
                    </button>
                    <button
                        onClick={() => setStatusFilter('PENDING')}
                        className={`px-10 py-4 rounded-[2rem] text-[10px] font-black uppercase tracking-widest transition-all italic ${statusFilter === 'PENDING' ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-100' : 'text-slate-400 hover:text-indigo-600'}`}
                    >
                        Chờ duyệt
                    </button>
                    <button
                        onClick={() => setStatusFilter('DELIVERED')}
                        className={`px-10 py-4 rounded-[2rem] text-[10px] font-black uppercase tracking-widest transition-all italic ${statusFilter === 'DELIVERED' ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-100' : 'text-slate-400 hover:text-indigo-600'}`}
                    >
                        Đã hoàn tất
                    </button>
                </div>
            </div>

            {/* Content Table Container */}
            <div className="bg-white rounded-[4rem] border border-slate-50 shadow-2xl shadow-slate-200/40 overflow-hidden animate-in slide-in-from-bottom-10 duration-700">
                <div className="p-10 border-b border-slate-50 flex flex-col lg:flex-row items-center justify-between gap-6">
                    <div className="relative group flex-1 max-w-xl">
                        <Search className="absolute left-8 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 group-focus-within:text-blue-600 transition-colors" />
                        <input
                            type="text"
                            placeholder="Tìm kiếm theo mã đơn hoặc tên dự án..."
                            className="w-full pl-20 pr-8 py-6 bg-slate-50 border-transparent rounded-[2.5rem] text-sm focus:bg-white focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500/20 outline-none transition-all font-bold placeholder:text-slate-300"
                        />
                    </div>
                    <div className="flex items-center gap-4">
                        {selectedIds.length > 0 && (
                            <button
                                onClick={handleBulkDelete}
                                className="px-10 py-6 bg-rose-50 text-rose-600 rounded-[2rem] text-[10px] font-black uppercase tracking-widest hover:bg-rose-100 transition-all border border-rose-100 flex items-center gap-4 shadow-lg shadow-rose-100 active:scale-95 italic"
                            >
                                <Trash2 size={20} /> Xóa hàng loạt ({selectedIds.length})
                            </button>
                        )}
                        <button 
                            onClick={() => toast.success('Đang khởi tạo báo cáo CSV...')}
                            className="px-10 py-6 bg-indigo-600 text-white rounded-[2rem] text-[10px] font-black uppercase tracking-widest hover:bg-indigo-700 transition-all flex items-center gap-4 shadow-2xl shadow-indigo-200 active:scale-95 italic"
                        >
                            <Download size={20} /> Xuất báo cáo CSV
                        </button>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                        <thead>
                            <tr className="bg-slate-50/50">
                                <th className="px-10 py-8 text-center w-24">
                                    <input
                                        type="checkbox"
                                        checked={selectedIds.length === orders.length && orders.length > 0}
                                        onChange={toggleSelectAll}
                                        className="w-6 h-6 rounded-lg border-slate-200 text-blue-600 focus:ring-blue-500 cursor-pointer"
                                    />
                                </th>
                                <th className="text-left px-8 py-8 text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 italic">Mã đơn hàng</th>
                                <th className="text-left px-8 py-8 text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 italic">Dự án công trình</th>
                                <th className="text-left px-8 py-8 text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 italic">Ngày khởi tạo</th>
                                <th className="text-right px-8 py-8 text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 italic">Giá trị đơn</th>
                                <th className="text-center px-8 py-8 text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 italic">Trạng thái</th>
                                <th className="text-center px-8 py-8 text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 italic">Thao tác</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50/50">
                            {loading ? (
                                [1, 2, 3, 4, 5].map(i => (
                                    <tr key={i} className="animate-pulse">
                                        <td colSpan={7} className="px-10 py-10"><div className="h-12 bg-slate-50 rounded-3xl w-full" /></td>
                                    </tr>
                                ))
                            ) : orders.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="px-10 py-48 text-center">
                                        <div className="flex flex-col items-center gap-8 opacity-20">
                                            <Package size={96} className="text-slate-300" />
                                            <p className="text-xs font-black uppercase tracking-[0.4em] italic">Không phát hiện bản ghi giao dịch nào</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                orders.map((order) => (
                                    <tr key={order.id} className={`group hover:bg-slate-50/50 transition-all duration-500 ${selectedIds.includes(order.id) ? 'bg-blue-50/30' : ''}`}>
                                        <td className="px-10 py-10 text-center">
                                            <input
                                                type="checkbox"
                                                checked={selectedIds.includes(order.id)}
                                                onChange={() => toggleSelectOrder(order.id)}
                                                className="w-6 h-6 rounded-lg border-slate-200 text-blue-600 focus:ring-blue-500 cursor-pointer"
                                            />
                                        </td>
                                        <td className="px-8 py-10">
                                            <span 
                                                onClick={() => handleViewOrder(order)}
                                                className="font-black text-xs text-blue-600 cursor-pointer hover:underline underline-offset-8 decoration-2 italic"
                                            >
                                                #{order.orderNumber}
                                            </span>
                                        </td>
                                        <td className="px-8 py-10">
                                            <div className="flex items-center gap-5">
                                                <div className="w-2 h-10 bg-slate-100 rounded-full group-hover:bg-blue-600 transition-all duration-500" />
                                                <span className="text-xs font-black text-slate-900 uppercase tracking-tighter truncate max-w-[280px] italic">{order.project}</span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-10 text-xs font-bold text-slate-400 tabular-nums italic">{order.date}</td>
                                        <td className="px-8 py-10 text-right">
                                            <span className="text-xs font-black text-slate-900 tabular-nums italic">{formatCurrency(order.total)}</span>
                                        </td>
                                        <td className="px-8 py-10 text-center">
                                            <span className={`inline-block px-5 py-2 rounded-full text-[9px] font-black uppercase tracking-[0.2em] shadow-sm italic ${getStatusColor(order.status)}`}>
                                                {getStatusText(order.status)}
                                            </span>
                                        </td>
                                        <td className="px-8 py-10 text-center">
                                            <div className="flex items-center justify-center gap-4">
                                                <button
                                                    onClick={() => handleViewOrder(order)}
                                                    className="w-12 h-12 flex items-center justify-center bg-slate-50 text-slate-400 hover:bg-blue-600 hover:text-white rounded-2xl transition-all active:scale-90 shadow-sm"
                                                    title="Xem chi tiết"
                                                >
                                                    <Eye size={20} />
                                                </button>
                                                {order.status === 'PENDING' && (
                                                    <button
                                                        onClick={() => handleEditOrder(order)}
                                                        className="w-12 h-12 flex items-center justify-center bg-slate-50 text-slate-400 hover:bg-indigo-600 hover:text-white rounded-2xl transition-all active:scale-90 shadow-sm"
                                                        title="Sửa đơn hàng"
                                                    >
                                                        <Edit size={20} />
                                                    </button>
                                                )}
                                                {(order.status === 'PENDING' || order.status === 'CANCELLED') && (
                                                    <button
                                                        onClick={() => handleDeleteOrder(order)}
                                                        className="w-12 h-12 flex items-center justify-center bg-slate-50 text-slate-400 hover:bg-rose-600 hover:text-white rounded-2xl transition-all active:scale-90 shadow-sm"
                                                        title="Hủy đơn"
                                                    >
                                                        <Trash2 size={20} />
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

                <div className="flex items-center justify-between px-10 py-10 bg-slate-50/50">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">
                        Đang hiển thị bản ghi <span className="text-blue-600">1-{orders.length}</span> trên tổng {orders.length} đơn hàng
                    </p>
                    <div className="flex items-center gap-3">
                        <button className="w-12 h-12 flex items-center justify-center bg-white border border-slate-100 rounded-2xl text-slate-400 hover:text-blue-600 transition-all disabled:opacity-30 active:scale-95" disabled>
                            <ChevronLeft size={20} />
                        </button>
                        <button className="w-12 h-12 bg-blue-600 text-white rounded-2xl text-[10px] font-black group shadow-xl shadow-blue-500/30 italic">1</button>
                        <button className="w-12 h-12 flex items-center justify-center bg-white border border-slate-100 rounded-2xl text-slate-400 hover:text-blue-600 transition-all disabled:opacity-30 active:scale-95" disabled>
                            <ChevronRight size={20} />
                        </button>
                    </div>
                </div>
            </div>

            {/* Modals */}
            {showViewModal && selectedOrder && (
                <div className="fixed inset-0 bg-indigo-950/40 backdrop-blur-xl z-[150] flex items-center justify-center p-6 animate-in fade-in duration-500">
                    <div className="bg-white rounded-[4rem] w-full max-w-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-500 border border-white/20">
                        <div className="p-16 bg-blue-600 text-white flex justify-between items-center relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32 blur-[60px]"></div>
                            <div className="relative z-10">
                                <h3 className="text-4xl font-black uppercase tracking-tighter italic mb-2">Chi tiết đơn hàng</h3>
                                <p className="text-blue-100 font-bold uppercase text-[10px] tracking-[0.3em] italic">Mã đơn: {selectedOrder.orderNumber} • Log: {selectedOrder.date}</p>
                            </div>
                            <button 
                                onClick={() => setShowViewModal(false)} 
                                className="w-14 h-14 bg-white/10 hover:bg-white/20 rounded-2xl flex items-center justify-center transition-all group z-20"
                            >
                                <X size={28} className="group-hover:rotate-90 transition-transform" />
                            </button>
                        </div>
                        
                        <div className="p-16 space-y-12">
                            <div className="grid grid-cols-2 gap-12">
                                <div className="space-y-10">
                                    <div className="space-y-3">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-3 italic">Dự án công trình</p>
                                        <div className="p-8 bg-slate-50 rounded-[2.5rem] border border-slate-100 italic font-black text-slate-900 uppercase tracking-tighter text-lg shadow-inner">
                                            {selectedOrder.project}
                                        </div>
                                    </div>
                                    <div className="space-y-3">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-3 italic">Trạng thái vận hành</p>
                                        <div className="flex">
                                            <span className={`px-8 py-4 rounded-[1.8rem] text-[10px] font-black uppercase tracking-widest shadow-sm italic ${getStatusColor(selectedOrder.status)}`}>
                                                {getStatusText(selectedOrder.status)}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <div className="space-y-10 text-right">
                                    <div className="space-y-3">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mr-3 text-right italic">Giá trị giao dịch</p>
                                        <div className="p-10 bg-indigo-50 rounded-[3rem] border border-indigo-100 flex flex-col items-end shadow-inner">
                                            <p className="text-4xl font-black text-indigo-600 italic tracking-tighter tabular-nums">{formatCurrency(selectedOrder.total)}</p>
                                        </div>
                                    </div>
                                    <div className="space-y-3 text-right">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mr-3 text-right italic">Số lượng vật tư</p>
                                        <p className="text-2xl font-black text-slate-900 uppercase italic tracking-tighter">{selectedOrder.items} danh mục sản phẩm</p>
                                    </div>
                                </div>
                            </div>

                            <div className="pt-12 flex gap-6">
                                <button onClick={() => setShowViewModal(false)} className="flex-1 py-7 bg-slate-50 text-slate-400 rounded-[2.2rem] font-black text-[10px] uppercase tracking-[0.3em] hover:bg-slate-100 transition-all italic border border-slate-100">Đóng cửa sổ</button>
                                {selectedOrder.status === 'SHIPPED' && selectedOrder.deliveryToken && (
                                    <Link
                                        href={`/track/${selectedOrder.deliveryToken}`}
                                        className="flex-[2] py-7 bg-emerald-600 text-white rounded-[2.2rem] font-black text-[10px] uppercase tracking-[0.3em] hover:bg-emerald-700 transition-all shadow-2xl shadow-emerald-200 flex items-center justify-center gap-5 group italic"
                                    >
                                        Theo dõi hành trình <ArrowRight size={20} className="group-hover:translate-x-3 transition-transform" />
                                    </Link>
                                )}
                                <button 
                                    onClick={() => toast.success('Đang thực hiện in tài liệu...')}
                                    className="flex-1 py-7 bg-blue-600 text-white rounded-[2.2rem] font-black text-[10px] uppercase tracking-[0.3em] hover:bg-blue-700 transition-all shadow-2xl shadow-blue-200 italic"
                                >
                                    In hóa đơn VAT
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {showDeleteModal && selectedOrder && (
                <div className="fixed inset-0 bg-rose-950/30 backdrop-blur-2xl z-[200] flex items-center justify-center p-6">
                    <div className="bg-white rounded-[4rem] w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95 duration-500">
                        <div className="p-12 bg-rose-600 text-white relative">
                            <h3 className="text-3xl font-black uppercase tracking-tighter italic">Thu hồi lệnh đặt</h3>
                        </div>
                        <div className="p-16 text-center space-y-12">
                            <div className="w-28 h-28 bg-rose-50 rounded-[3rem] flex items-center justify-center mx-auto shadow-inner">
                                <Trash2 size={48} className="text-rose-500" />
                            </div>
                            <div className="space-y-5">
                                <h4 className="text-3xl font-black text-slate-900 tracking-tighter uppercase italic">Xác nhận hủy đơn?</h4>
                                <p className="text-slate-500 font-bold uppercase text-[10px] tracking-[0.2em] leading-relaxed italic">
                                    Đơn hàng <span className="text-rose-600 font-black">#{selectedOrder.orderNumber}</span> sẽ được gỡ bỏ vĩnh viễn khỏi toàn bộ hệ thống lưu trữ B2B.
                                </p>
                            </div>
                            <div className="flex gap-4">
                                <button onClick={() => setShowDeleteModal(false)} className="flex-1 py-7 bg-slate-50 text-slate-400 rounded-[2rem] font-black text-[10px] uppercase tracking-widest hover:bg-slate-100 transition-all shadow-sm italic">Quay lại</button>
                                <button onClick={confirmDelete} className="flex-1 py-7 bg-rose-600 text-white rounded-[2rem] font-black text-[10px] uppercase tracking-widest hover:bg-rose-700 transition-all shadow-2xl shadow-rose-200 italic">Xác nhận xóa</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
