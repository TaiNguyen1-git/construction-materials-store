'use client'

/**
 * Contractor Orders Page - Light Theme
 * Order history and management for contractors
 */

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Sidebar from '../components/Sidebar'
import ContractorHeader from '../components/ContractorHeader'
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
    ChevronDown
} from 'lucide-react'
import { fetchWithAuth } from '@/lib/api-client'
import { useAuth } from '@/contexts/auth-context'

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
}

export default function ContractorOrdersPage() {
    const { user } = useAuth()
    const [sidebarOpen, setSidebarOpen] = useState(true)
    const [orders, setOrders] = useState<Order[]>([])
    const [statusFilter, setStatusFilter] = useState('all')
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [page, setPage] = useState(1)
    const [totalPages, setTotalPages] = useState(1)
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
    const [selectedIds, setSelectedIds] = useState<string[]>([])
    const [showViewModal, setShowViewModal] = useState(false)
    const [showDeleteModal, setShowDeleteModal] = useState(false)
    const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false)

    useEffect(() => {
        if (user) {
            fetchOrders()
        }
    }, [statusFilter, page, user])

    const fetchOrders = async () => {
        setLoading(true)
        setError(null)
        try {
            const params = new URLSearchParams({
                page: page.toString(),
                limit: '20',
                ...(statusFilter !== 'all' && { status: statusFilter })
            })

            const response = await fetchWithAuth(`/api/contractors/orders?${params}`)

            if (!response.ok) {
                throw new Error('Failed to fetch orders')
            }

            const data = await response.json()
            if (data.success && data.data) {
                setOrders(data.data.orders || [])
                setTotalPages(data.data.pagination?.pages || 1)
            }
        } catch (err: any) {
            console.error('Error fetching orders:', err)
            setError(err.message || 'Không thể tải đơn hàng')
        } finally {
            setLoading(false)
        }
    }

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
        // router.push(`/contractor/orders/${order.id}/edit`)
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
        setOrders(orders.filter(o => o.id !== selectedOrder.id))
        setSelectedIds(selectedIds.filter(id => id !== selectedOrder.id))
        setShowDeleteModal(false)
    }

    const toggleSelectAll = () => {
        if (selectedIds.length === filteredOrders.length) {
            setSelectedIds([])
        } else {
            setSelectedIds(filteredOrders.map(o => o.id))
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
            .filter(o => selectedIds.includes(o.id))
            .filter(o => o.status === 'PENDING' || o.status === 'CANCELLED')
            .map(o => o.id)

        if (deletableIds.length === 0) {
            toast.error('Không có đơn hàng nào có thể xoá trong danh sách đã chọn')
            return
        }

        if (deletableIds.length < selectedIds.length) {
            toast.error(`Chỉ có thể xoá ${deletableIds.length}/${selectedIds.length} đơn hàng đã chọn`)
        }

        setShowBulkDeleteModal(true)
    }

    const confirmBulkDelete = async () => {
        const deletableIds = orders
            .filter(o => selectedIds.includes(o.id))
            .filter(o => o.status === 'PENDING' || o.status === 'CANCELLED')
            .map(o => o.id)

        toast.promise(
            new Promise((resolve) => setTimeout(resolve, 1500)),
            {
                loading: `Đang xoá ${deletableIds.length} đơn hàng...`,
                success: `Đã xoá thành công ${deletableIds.length} đơn hàng!`,
                error: 'Lỗi khi xoá hàng loạt'
            }
        )

        setOrders(orders.filter(o => !deletableIds.includes(o.id)))
        setSelectedIds([])
        setShowBulkDeleteModal(false)
    }

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND'
        }).format(amount)
    }

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'DELIVERED': return 'bg-green-100 text-green-700'
            case 'PROCESSING': return 'bg-orange-100 text-orange-700'
            case 'SHIPPED': return 'bg-blue-100 text-blue-700'
            case 'PENDING': return 'bg-gray-100 text-gray-700'
            case 'CANCELLED': return 'bg-red-100 text-red-700'
            default: return 'bg-gray-100 text-gray-700'
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

    const filteredOrders = statusFilter === 'all'
        ? orders
        : orders.filter(o => o.status === statusFilter)

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            <ContractorHeader sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
            <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

            {/* Main Content */}
            <main className={`flex-1 pt-[60px] transition-all duration-300 ${sidebarOpen ? 'lg:ml-64' : 'ml-0'}`}>
                <div className="p-4 lg:p-6 max-w-7xl mx-auto">
                    {/* Header - Compact */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                        <div>
                            <h1 className="text-xl font-black text-gray-900 uppercase tracking-tight">Đơn hàng của tôi</h1>
                            <p className="text-xs text-gray-500 font-medium mt-1">Quản lý và theo dõi trạng thái đơn hàng</p>
                        </div>
                    </div>

                    {/* Filters - High Density */}
                    <div className="bg-white p-3 rounded-xl shadow-sm border border-gray-100 mb-6 font-medium">
                        <div className="flex flex-wrap gap-3 items-center">
                            <div className="flex items-center gap-2 px-2">
                                <Filter className="w-4 h-4 text-gray-400" />
                                <span className="text-xs font-bold text-gray-600 uppercase tracking-wide">Lọc theo:</span>
                            </div>
                            <div className="relative">
                                <select
                                    value={statusFilter}
                                    onChange={(e) => setStatusFilter(e.target.value)}
                                    className="appearance-none bg-gray-50 border border-gray-200 rounded-lg pl-3 pr-8 py-2 text-xs font-bold text-gray-700 outline-none focus:ring-2 focus:ring-primary-100 hover:bg-gray-100 transition-colors"
                                >
                                    <option value="all">Tất cả trạng thái</option>
                                    <option value="PENDING">Chờ xác nhận</option>
                                    <option value="PROCESSING">Đang xử lý</option>
                                    <option value="SHIPPED">Đang giao</option>
                                    <option value="DELIVERED">Đã giao</option>
                                    <option value="CANCELLED">Đã hủy</option>
                                </select>
                                <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
                            </div>

                            <div className="flex-1" />

                            {selectedIds.length > 0 && (
                                <button
                                    onClick={handleBulkDelete}
                                    className="flex items-center gap-1.5 bg-red-50 text-red-600 px-3 py-1.5 rounded-lg font-black uppercase text-[10px] tracking-widest hover:bg-red-100 transition-all border border-red-100 shadow-sm"
                                >
                                    <Trash2 className="w-3.5 h-3.5" />
                                    Xoá ({selectedIds.length})
                                </button>
                            )}
                            <button className="flex items-center gap-1.5 text-gray-500 hover:text-primary-600 px-3 py-1.5 border border-gray-200 rounded-lg hover:bg-primary-50 hover:border-primary-100 transition-all text-xs font-bold uppercase tracking-wide">
                                <Download className="w-3.5 h-3.5" />
                                Xuất Excel
                            </button>
                        </div>
                    </div>

                    {/* Orders Table - High Density */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50/50 border-b border-gray-100">
                                    <tr>
                                        <th className="px-4 py-3 text-center w-10">
                                            <input
                                                type="checkbox"
                                                checked={selectedIds.length === filteredOrders.length && filteredOrders.length > 0}
                                                onChange={toggleSelectAll}
                                                className="w-3.5 h-3.5 rounded border-gray-300 text-primary-600 focus:ring-primary-500 cursor-pointer"
                                            />
                                        </th>
                                        <th className="text-left px-4 py-3 text-[10px] font-black uppercase tracking-widest text-gray-500">Mã đơn</th>
                                        <th className="text-left px-4 py-3 text-[10px] font-black uppercase tracking-widest text-gray-500">Ngày đặt</th>
                                        <th className="text-left px-4 py-3 text-[10px] font-black uppercase tracking-widest text-gray-500">Dự án</th>
                                        <th className="text-center px-4 py-3 text-[10px] font-black uppercase tracking-widest text-gray-500">SP</th>
                                        <th className="text-right px-4 py-3 text-[10px] font-black uppercase tracking-widest text-gray-500">Thành tiền</th>
                                        <th className="text-center px-4 py-3 text-[10px] font-black uppercase tracking-widest text-gray-500">Trạng thái</th>
                                        <th className="text-center px-4 py-3 text-[10px] font-black uppercase tracking-widest text-gray-500">Thao tác</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {filteredOrders.map((order) => (
                                        <tr key={order.id} className={`hover:bg-primary-50/10 transition-colors group ${selectedIds.includes(order.id) ? 'bg-primary-50/30' : ''}`}>
                                            <td className="px-4 py-2.5 text-center">
                                                <input
                                                    type="checkbox"
                                                    checked={selectedIds.includes(order.id)}
                                                    onChange={() => toggleSelectOrder(order.id)}
                                                    className="w-3.5 h-3.5 rounded border-gray-300 text-primary-600 focus:ring-primary-500 cursor-pointer"
                                                />
                                            </td>
                                            <td className="px-4 py-2.5">
                                                <span className="font-bold text-xs text-primary-600 group-hover:underline cursor-pointer" onClick={() => handleViewOrder(order)}>{order.orderNumber}</span>
                                            </td>
                                            <td className="px-4 py-2.5 text-xs text-gray-500 font-medium">{order.date}</td>
                                            <td className="px-4 py-2.5">
                                                <div className="flex items-center gap-1.5">
                                                    <div className="w-1 h-4 bg-gray-200 rounded-full group-hover:bg-primary-400 transition-colors" />
                                                    <span className="text-xs font-semibold text-gray-700">{order.project}</span>
                                                </div>
                                            </td>
                                            <td className="px-4 py-2.5 text-center text-xs font-bold text-gray-500">{order.items}</td>
                                            <td className="px-4 py-2.5 text-right font-black text-xs text-gray-900">
                                                {formatCurrency(order.total)}
                                            </td>
                                            <td className="px-4 py-2.5 text-center">
                                                <span className={`inline-block px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider ${getStatusColor(order.status)}`}>
                                                    {getStatusText(order.status)}
                                                </span>
                                            </td>
                                            <td className="px-4 py-2.5 text-center">
                                                <div className="flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button
                                                        onClick={() => handleViewOrder(order)}
                                                        className="p-1.5 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                                                        title="Xem chi tiết"
                                                    >
                                                        <Eye className="w-4 h-4" />
                                                    </button>
                                                    {order.status === 'PENDING' && (
                                                        <button
                                                            onClick={() => handleEditOrder(order)}
                                                            className="p-1.5 text-gray-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                                                            title="Chỉnh sửa"
                                                        >
                                                            <Edit className="w-4 h-4" />
                                                        </button>
                                                    )}
                                                    {(order.status === 'PENDING' || order.status === 'CANCELLED') && (
                                                        <button
                                                            onClick={() => handleDeleteOrder(order)}
                                                            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                            title="Xoá đơn"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination - Compact */}
                        <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 bg-gray-50/30">
                            <p className="text-[11px] font-medium text-gray-500">
                                Hiển thị <span className="font-bold text-gray-900">1-{filteredOrders.length}</span> / {filteredOrders.length} đơn hàng
                            </p>
                            <div className="flex items-center gap-1.5">
                                <button className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md disabled:opacity-50" disabled>
                                    <ChevronLeft className="w-4 h-4" />
                                </button>
                                <button className="px-2.5 py-1 bg-primary-600 text-white rounded-md text-[11px] font-bold shadow-sm shadow-primary-200">1</button>
                                <button className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md disabled:opacity-50" disabled>
                                    <ChevronRight className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            {/* View Order Modal */}
            {showViewModal && selectedOrder && (
                <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4 backdrop-blur-sm">
                    <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200 text-gray-900 border border-gray-100">
                        <div className="p-6 bg-blue-600 text-white flex justify-between items-center">
                            <div>
                                <h3 className="font-black uppercase tracking-tight text-white">Chi tiết đơn hàng</h3>
                                <p className="text-xs text-blue-100">{selectedOrder.orderNumber} • {selectedOrder.date}</p>
                            </div>
                            <button onClick={() => setShowViewModal(false)} className="bg-white/10 hover:bg-white/20 p-2 rounded-full transition-colors text-white border-none cursor-pointer">
                                <X className="w-6 h-6" />
                            </button>
                        </div>
                        <div className="p-8 space-y-6">
                            <div className="grid grid-cols-2 gap-8">
                                <div className="space-y-4">
                                    <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                                        <p className="text-[10px] font-black text-gray-400 uppercase mb-1">Thông tin dự án</p>
                                        <p className="font-bold text-gray-900">{selectedOrder.project}</p>
                                    </div>
                                    <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                                        <p className="text-[10px] font-black text-gray-400 uppercase mb-1">Trạng thái vận chuyển</p>
                                        <span className={`inline-block px-3 py-1 rounded-full text-[10px] font-black uppercase ${getStatusColor(selectedOrder.status)}`}>
                                            {getStatusText(selectedOrder.status)}
                                        </span>
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100">
                                        <p className="text-[10px] font-black text-blue-400 uppercase mb-1">Tổng thanh toán</p>
                                        <p className="text-2xl font-black text-blue-600">{formatCurrency(selectedOrder.total)}</p>
                                    </div>
                                    <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                                        <p className="text-[10px] font-black text-gray-400 uppercase mb-1">Số lượng mặt hàng</p>
                                        <p className="font-bold text-gray-900">{selectedOrder.items} sản phẩm</p>
                                    </div>
                                </div>
                            </div>

                            <div className="pt-6 border-t border-gray-100 flex gap-4">
                                <button onClick={() => setShowViewModal(false)} className="flex-1 py-4 bg-gray-100 text-gray-600 rounded-2xl font-black uppercase tracking-widest hover:bg-gray-200 transition-all">Đóng</button>
                                <button className="flex-1 py-4 bg-blue-600 text-white rounded-2xl font-black uppercase tracking-widest hover:bg-blue-700 transition-all shadow-lg shadow-blue-100">In hóa đơn</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {showDeleteModal && selectedOrder && (
                <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4 backdrop-blur-sm">
                    <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
                        <div className="p-6 bg-red-600 text-white flex justify-between items-center text-white">
                            <h3 className="font-black uppercase tracking-tight text-white">Xác nhận xoá đơn</h3>
                            <button onClick={() => setShowDeleteModal(false)} className="text-white hover:bg-white/20 p-1 rounded-full border-none cursor-pointer"><X className="w-6 h-6" /></button>
                        </div>
                        <div className="p-8 text-center space-y-6">
                            <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto">
                                <Trash2 className="w-10 h-10 text-red-600" />
                            </div>
                            <div>
                                <h4 className="text-xl font-black text-gray-900 mb-2">Bạn chắc chắn muốn xoá?</h4>
                                <p className="text-gray-500 text-sm">Đơn hàng <span className="font-bold text-red-600">{selectedOrder.orderNumber}</span> sẽ được xoá vĩnh viễn và không thể khôi phục.</p>
                            </div>
                            <div className="flex gap-4">
                                <button onClick={() => setShowDeleteModal(false)} className="flex-1 py-4 bg-gray-100 text-gray-600 rounded-2xl font-black uppercase tracking-widest hover:bg-gray-200 transition-all border-none cursor-pointer">Hủy</button>
                                <button onClick={confirmDelete} className="flex-1 py-4 bg-red-600 text-white rounded-2xl font-black uppercase tracking-widest hover:bg-red-700 transition-all shadow-lg shadow-red-100 border-none cursor-pointer">Xác nhận xoá</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Bulk Delete Confirmation Modal */}
            {showBulkDeleteModal && (
                <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4 backdrop-blur-sm">
                    <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
                        <div className="p-6 bg-red-600 text-white flex justify-between items-center text-white">
                            <h3 className="font-black uppercase tracking-tight text-white">Xoá hàng loạt</h3>
                            <button onClick={() => setShowBulkDeleteModal(false)} className="text-white hover:bg-white/20 p-1 rounded-full border-none cursor-pointer"><X className="w-6 h-6" /></button>
                        </div>
                        <div className="p-8 text-center space-y-6">
                            <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto">
                                <Trash2 className="w-10 h-10 text-red-600" />
                            </div>
                            <div>
                                <h4 className="text-xl font-black text-gray-900 mb-2">Xác nhận xoá nhiều đơn?</h4>
                                <p className="text-gray-500 text-sm">Bạn đang chuẩn bị xoá <span className="font-bold text-red-600">{selectedIds.length}</span> đơn hàng đã chọn. Hành động này không thể khôi phục.</p>
                            </div>
                            <div className="flex gap-4">
                                <button onClick={() => setShowBulkDeleteModal(false)} className="flex-1 py-4 bg-gray-100 text-gray-600 rounded-2xl font-black uppercase tracking-widest hover:bg-gray-200 transition-all border-none cursor-pointer">Hủy</button>
                                <button onClick={confirmBulkDelete} className="flex-1 py-4 bg-red-600 text-white rounded-2xl font-black uppercase tracking-widest hover:bg-red-700 transition-all shadow-lg shadow-red-100 border-none cursor-pointer">Xoá tất cả</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
