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
        <div className="space-y-8 pb-20 max-w-7xl mx-auto px-4 sm:px-0">
            <Toaster position="top-right" />
            
            {/* Page Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="space-y-2">
                    <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
                        <Package className="w-7 h-7 text-blue-600" />
                        Lịch sử đơn hàng
                    </h1>
                    <p className="text-slate-500 text-sm">Theo dõi và quản lý dữ liệu cung ứng vật tư B2B</p>
                </div>

                <div className="flex bg-slate-100/50 p-1.5 rounded-xl gap-1">
                    <button
                        onClick={() => setStatusFilter('all')}
                        className={`px-6 py-2 rounded-lg text-xs font-bold transition-all ${statusFilter === 'all' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'}`}
                    >
                        Tất cả đơn
                    </button>
                    <button
                        onClick={() => setStatusFilter('PENDING')}
                        className={`px-6 py-2 rounded-lg text-xs font-bold transition-all ${statusFilter === 'PENDING' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'}`}
                    >
                        Chờ duyệt
                    </button>
                    <button
                        onClick={() => setStatusFilter('DELIVERED')}
                        className={`px-6 py-2 rounded-lg text-xs font-bold transition-all ${statusFilter === 'DELIVERED' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'}`}
                    >
                        Đã hoàn tất
                    </button>
                </div>
            </div>

            {/* Content Table Container */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-slate-50 flex flex-col md:flex-row items-center justify-between gap-4">
                    <div className="relative group w-full md:max-w-md">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
                        <input
                            type="text"
                            placeholder="Tìm kiếm theo mã đơn hoặc tên dự án..."
                            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-transparent rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-blue-100 focus:border-blue-200 outline-none transition-all placeholder:text-slate-400"
                        />
                    </div>
                    <div className="flex items-center gap-3 w-full md:w-auto">
                        {selectedIds.length > 0 && (
                            <button
                                onClick={handleBulkDelete}
                                className="px-5 py-2.5 bg-rose-50 text-rose-600 rounded-xl text-xs font-bold hover:bg-rose-100 transition-all border border-rose-100 flex items-center gap-2 active:scale-95"
                            >
                                <Trash2 size={16} /> Xóa ({selectedIds.length})
                            </button>
                        )}
                        <button 
                            onClick={() => toast.success('Đang khởi tạo báo cáo CSV...')}
                            className="px-5 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-50 hover:text-blue-600 transition-all flex items-center gap-2 shadow-sm active:scale-95"
                        >
                            <Download size={16} /> Xuất CSV
                        </button>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                        <thead>
                            <tr className="bg-slate-50/80 border-b border-slate-100">
                                <th className="px-6 py-4 text-center w-16">
                                    <input
                                        type="checkbox"
                                        checked={selectedIds.length === orders.length && orders.length > 0}
                                        onChange={toggleSelectAll}
                                        className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                                    />
                                </th>
                                <th className="text-left px-6 py-4 text-[11px] font-bold uppercase tracking-wider text-slate-500">Mã đơn hàng</th>
                                <th className="text-left px-6 py-4 text-[11px] font-bold uppercase tracking-wider text-slate-500">Dự án công trình</th>
                                <th className="text-left px-6 py-4 text-[11px] font-bold uppercase tracking-wider text-slate-500">Ngày khởi tạo</th>
                                <th className="text-right px-6 py-4 text-[11px] font-bold uppercase tracking-wider text-slate-500">Giá trị đơn</th>
                                <th className="text-center px-6 py-4 text-[11px] font-bold uppercase tracking-wider text-slate-500">Trạng thái</th>
                                <th className="text-center px-6 py-4 text-[11px] font-bold uppercase tracking-wider text-slate-500">Thao tác</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50/50">
                            {loading ? (
                                [1, 2, 3, 4, 5].map(i => (
                                    <tr key={i} className="animate-pulse">
                                        <td colSpan={7} className="px-6 py-8"><div className="h-10 bg-slate-50 rounded-xl w-full" /></td>
                                    </tr>
                                ))
                            ) : orders.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="px-6 py-32 text-center">
                                        <div className="flex flex-col items-center gap-4">
                                            <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center">
                                                <Package size={32} className="text-slate-300" />
                                            </div>
                                            <p className="text-sm font-bold text-slate-400">Không tìm thấy đơn hàng nào</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                orders.map((order) => (
                                    <tr key={order.id} className={`group hover:bg-slate-50 transition-colors border-b border-slate-50 last:border-0 ${selectedIds.includes(order.id) ? 'bg-blue-50/30' : ''}`}>
                                        <td className="px-6 py-4 text-center">
                                            <input
                                                type="checkbox"
                                                checked={selectedIds.includes(order.id)}
                                                onChange={() => toggleSelectOrder(order.id)}
                                                className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                                            />
                                        </td>
                                        <td className="px-6 py-4">
                                            <span 
                                                onClick={() => handleViewOrder(order)}
                                                className="font-bold text-sm text-blue-600 cursor-pointer hover:underline underline-offset-4"
                                            >
                                                #{order.orderNumber}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-sm font-bold text-slate-700 truncate max-w-[200px] block">{order.project}</span>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-slate-500">{order.date}</td>
                                        <td className="px-6 py-4 text-right">
                                            <span className="text-sm font-bold text-slate-900">{formatCurrency(order.total)}</span>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className={`inline-block px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${getStatusColor(order.status)}`}>
                                                {getStatusText(order.status)}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <div className="flex items-center justify-center gap-2">
                                                <button
                                                    onClick={() => handleViewOrder(order)}
                                                    className="p-1.5 text-slate-400 hover:bg-white hover:text-blue-600 rounded-lg transition-colors border border-transparent hover:border-slate-200 shadow-sm"
                                                    title="Xem chi tiết"
                                                >
                                                    <Eye size={16} />
                                                </button>
                                                {order.status === 'PENDING' && (
                                                    <button
                                                        onClick={() => handleEditOrder(order)}
                                                        className="p-1.5 text-slate-400 hover:bg-white hover:text-indigo-600 rounded-lg transition-colors border border-transparent hover:border-slate-200 shadow-sm"
                                                        title="Sửa đơn hàng"
                                                    >
                                                        <Edit size={16} />
                                                    </button>
                                                )}
                                                {(order.status === 'PENDING' || order.status === 'CANCELLED') && (
                                                    <button
                                                        onClick={() => handleDeleteOrder(order)}
                                                        className="p-1.5 text-slate-400 hover:bg-white hover:text-rose-600 rounded-lg transition-colors border border-transparent hover:border-slate-200 shadow-sm"
                                                        title="Hủy đơn"
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

                <div className="flex items-center justify-between px-6 py-4 bg-slate-50 border-t border-slate-100">
                    <p className="text-xs text-slate-500">
                        Đang hiển thị <span className="font-bold text-slate-900">1-{orders.length}</span> trên tổng {orders.length} đơn hàng
                    </p>
                    <div className="flex items-center gap-1">
                        <button className="w-8 h-8 flex items-center justify-center bg-white border border-slate-200 rounded-lg text-slate-400 hover:border-blue-200 hover:text-blue-600 transition-all disabled:opacity-50" disabled>
                            <ChevronLeft size={16} />
                        </button>
                        <button className="w-8 h-8 bg-blue-600 text-white rounded-lg text-xs font-bold disabled:opacity-50" disabled>1</button>
                        <button className="w-8 h-8 flex items-center justify-center bg-white border border-slate-200 rounded-lg text-slate-400 hover:border-blue-200 hover:text-blue-600 transition-all disabled:opacity-50" disabled>
                            <ChevronRight size={16} />
                        </button>
                    </div>
                </div>
            </div>

            {/* Modals */}
            {showViewModal && selectedOrder && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[150] flex items-center justify-center p-4 xl:p-6 animate-in fade-in duration-200">
                    <div className="bg-white rounded-2xl w-full max-w-2xl shadow-xl overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                            <div>
                                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                    Chi tiết đơn hàng <span className="text-blue-600">#{selectedOrder.orderNumber}</span>
                                </h3>
                                <p className="text-xs text-slate-500 mt-1">Khởi tạo: {selectedOrder.date}</p>
                            </div>
                            <button 
                                onClick={() => setShowViewModal(false)} 
                                className="w-8 h-8 hover:bg-slate-200 rounded-lg flex items-center justify-center text-slate-500 transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>
                        
                        <div className="p-6 space-y-6">
                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-4">
                                    <div>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Dự án công trình</p>
                                        <p className="font-bold text-slate-900">{selectedOrder.project}</p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Trạng thái vận hành</p>
                                        <span className={`inline-block px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${getStatusColor(selectedOrder.status)}`}>
                                            {getStatusText(selectedOrder.status)}
                                        </span>
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <div>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Giá trị giao dịch</p>
                                        <p className="text-2xl font-bold text-blue-600 tabular-nums">{formatCurrency(selectedOrder.total)}</p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Số lượng vật tư</p>
                                        <p className="font-bold text-slate-900">{selectedOrder.items} danh mục sản phẩm</p>
                                    </div>
                                </div>
                            </div>

                            <div className="pt-6 border-t border-slate-100 flex justify-end gap-3">
                                <button onClick={() => setShowViewModal(false)} className="px-6 py-2.5 bg-slate-100 text-slate-600 rounded-xl font-bold text-xs uppercase tracking-wider hover:bg-slate-200 transition-all">Đóng</button>
                                {selectedOrder.status === 'SHIPPED' && selectedOrder.deliveryToken && (
                                    <Link
                                        href={`/track/${selectedOrder.deliveryToken}`}
                                        className="px-6 py-2.5 bg-emerald-600 text-white rounded-xl font-bold text-xs uppercase tracking-wider hover:bg-emerald-700 transition-all flex items-center gap-2"
                                    >
                                        Theo dõi đơn hàng <ArrowRight size={16} />
                                    </Link>
                                )}
                                <button 
                                    onClick={() => toast.success('Đang thực hiện in tài liệu...')}
                                    className="px-6 py-2.5 bg-blue-600 text-white rounded-xl font-bold text-xs uppercase tracking-wider hover:bg-blue-700 transition-all"
                                >
                                    In hóa đơn
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {showDeleteModal && selectedOrder && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl w-full max-w-sm shadow-xl overflow-hidden animate-in zoom-in-95 duration-200 border border-slate-100">
                        <div className="p-6 text-center space-y-6">
                            <div className="w-16 h-16 bg-rose-50 rounded-full flex items-center justify-center mx-auto">
                                <Trash2 size={32} className="text-rose-500" />
                            </div>
                            <div className="space-y-2">
                                <h3 className="text-lg font-bold text-slate-900">Xác nhận hủy đơn?</h3>
                                <p className="text-sm text-slate-500">
                                    Đơn <span className="text-rose-600 font-bold">#{selectedOrder.orderNumber}</span> sẽ bị hủy và không thể khôi phục.
                                </p>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <button onClick={() => setShowDeleteModal(false)} className="py-2.5 bg-slate-100 text-slate-700 rounded-xl font-bold text-xs hover:bg-slate-200 transition-all">Hủy bỏ</button>
                                <button onClick={confirmDelete} className="py-2.5 bg-rose-600 text-white rounded-xl font-bold text-xs hover:bg-rose-700 transition-all">Xác nhận hủy</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {showBulkDeleteModal && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl w-full max-w-sm shadow-xl overflow-hidden animate-in zoom-in-95 duration-200 border border-slate-100">
                        <div className="p-6 text-center space-y-6">
                            <div className="w-16 h-16 bg-rose-50 rounded-full flex items-center justify-center mx-auto border border-rose-100">
                                <Trash2 size={32} className="text-rose-500" />
                            </div>
                            <div className="space-y-2">
                                <h3 className="text-lg font-bold text-slate-900">Xóa hàng loạt?</h3>
                                <p className="text-sm text-slate-500">
                                    Thao tác này sẽ hủy vĩnh viễn <span className="text-rose-600 font-bold">{selectedIds.length}</span> đơn hàng đã chọn.
                                </p>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <button onClick={() => setShowBulkDeleteModal(false)} className="py-2.5 bg-slate-100 text-slate-700 rounded-xl font-bold text-xs hover:bg-slate-200 transition-all">Trở lại</button>
                                <button onClick={confirmBulkDelete} className="py-2.5 bg-rose-600 text-white rounded-xl font-bold text-xs hover:bg-rose-700 transition-all">Đồng ý xóa</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
