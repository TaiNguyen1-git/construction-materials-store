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
    Trash2
} from 'lucide-react'

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
    const [sidebarOpen, setSidebarOpen] = useState(true)
    const [user, setUser] = useState<any>(null)
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
        const userData = localStorage.getItem('user')
        if (userData) {
            setUser(JSON.parse(userData))
        }
        fetchOrders()
    }, [statusFilter, page])

    const fetchOrders = async () => {
        setLoading(true)
        setError(null)
        try {
            const token = localStorage.getItem('access_token')
            const userStored = localStorage.getItem('user')
            const userId = userStored ? JSON.parse(userStored).id : null

            const params = new URLSearchParams({
                page: page.toString(),
                limit: '20',
                ...(statusFilter !== 'all' && { status: statusFilter })
            })

            const response = await fetch(`/api/contractors/orders?${params}`, {
                headers: {
                    'Content-Type': 'application/json',
                    ...(token && { 'Authorization': `Bearer ${token}` }),
                    ...(userId && { 'x-user-id': userId })
                }
            })

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
            <ContractorHeader sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} user={user} />
            <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

            {/* Main Content */}
            <main className={`flex-1 pt-[73px] transition-all duration-300 ${sidebarOpen ? 'lg:ml-64' : 'ml-0'}`}>
                <div className="p-6 lg:p-8 max-w-7xl mx-auto">
                    {/* Header */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">Đơn hàng của tôi</h1>
                            <p className="text-gray-600">Quản lý và theo dõi tất cả đơn hàng</p>
                        </div>
                        <div className="flex gap-3">
                            {/* Removed redundant New Order button as users use Quick Order */}
                        </div>
                    </div>

                    {/* Filters */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-6">
                        <div className="flex flex-wrap gap-4 items-center">
                            <div className="flex items-center gap-2">
                                <Filter className="w-5 h-5 text-gray-400" />
                                <span className="text-gray-600 font-medium">Lọc theo:</span>
                            </div>
                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                                className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-2 text-gray-900 font-bold outline-none"
                            >
                                <option value="all">Tất cả trạng thái</option>
                                <option value="PENDING">Chờ xác nhận</option>
                                <option value="PROCESSING">Đang xử lý</option>
                                <option value="SHIPPED">Đang giao</option>
                                <option value="DELIVERED">Đã giao</option>
                                <option value="CANCELLED">Đã hủy</option>
                            </select>
                            <div className="flex-1" />
                            {selectedIds.length > 0 && (
                                <button
                                    onClick={handleBulkDelete}
                                    className="flex items-center gap-2 bg-red-50 text-red-600 px-4 py-2 rounded-lg font-black uppercase text-[10px] tracking-widest hover:bg-red-100 transition-all border border-red-100"
                                >
                                    <Trash2 className="w-4 h-4" />
                                    Xoá đã chọn ({selectedIds.length})
                                </button>
                            )}
                            <button className="flex items-center gap-2 text-gray-600 hover:text-blue-600 font-bold">
                                <Download className="w-5 h-5" />
                                Xuất Excel
                            </button>
                        </div>
                    </div>

                    {/* Orders Table */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50 border-b border-gray-100">
                                    <tr>
                                        <th className="px-6 py-4 text-center w-12">
                                            <input
                                                type="checkbox"
                                                checked={selectedIds.length === filteredOrders.length && filteredOrders.length > 0}
                                                onChange={toggleSelectAll}
                                                className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                                            />
                                        </th>
                                        <th className="text-left px-6 py-4 text-sm font-semibold text-gray-700">Mã đơn</th>
                                        <th className="text-left px-6 py-4 text-sm font-semibold text-gray-700">Ngày đặt</th>
                                        <th className="text-left px-6 py-4 text-sm font-semibold text-gray-700">Dự án</th>
                                        <th className="text-center px-6 py-4 text-sm font-semibold text-gray-700">SP</th>
                                        <th className="text-right px-6 py-4 text-sm font-semibold text-gray-700">Tổng tiền</th>
                                        <th className="text-center px-6 py-4 text-sm font-semibold text-gray-700">Trạng thái</th>
                                        <th className="text-center px-6 py-4 text-sm font-semibold text-gray-700"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {filteredOrders.map((order) => (
                                        <tr key={order.id} className={`hover:bg-gray-50 transition-colors ${selectedIds.includes(order.id) ? 'bg-blue-50/30' : ''}`}>
                                            <td className="px-6 py-4 text-center">
                                                <input
                                                    type="checkbox"
                                                    checked={selectedIds.includes(order.id)}
                                                    onChange={() => toggleSelectOrder(order.id)}
                                                    className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                                                />
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="font-semibold text-blue-600">{order.orderNumber}</span>
                                            </td>
                                            <td className="px-6 py-4 text-gray-600">{order.date}</td>
                                            <td className="px-6 py-4 text-gray-900">{order.project}</td>
                                            <td className="px-6 py-4 text-center text-gray-600">{order.items}</td>
                                            <td className="px-6 py-4 text-right font-semibold text-gray-900">
                                                {formatCurrency(order.total)}
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                                                    {getStatusText(order.status)}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <div className="flex items-center justify-center gap-1">
                                                    <button
                                                        onClick={() => handleViewOrder(order)}
                                                        className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                        title="Xem chi tiết"
                                                    >
                                                        <Eye className="w-5 h-5" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleEditOrder(order)}
                                                        className="p-2 text-gray-400 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                                                        title="Chỉnh sửa"
                                                    >
                                                        <Edit className="w-5 h-5" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteOrder(order)}
                                                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                        title="Xoá đơn"
                                                    >
                                                        <Trash2 className="w-5 h-5" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination */}
                        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100">
                            <p className="text-sm text-gray-600">
                                Hiển thị 1-{filteredOrders.length} của {filteredOrders.length} đơn hàng
                            </p>
                            <div className="flex items-center gap-2">
                                <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg" disabled>
                                    <ChevronLeft className="w-5 h-5" />
                                </button>
                                <button className="px-3 py-1 bg-blue-600 text-white rounded-lg text-sm font-medium">1</button>
                                <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg" disabled>
                                    <ChevronRight className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            {/* Mobile Bottom Navigation */}
            <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-30">
                <div className="flex items-center justify-around py-2">
                    <Link href="/contractor/dashboard" className="flex flex-col items-center gap-1 py-2 px-3 text-gray-500">
                        <Home className="w-6 h-6" />
                        <span className="text-xs">Tổng quan</span>
                    </Link>
                    <Link href="/contractor/orders" className="flex flex-col items-center gap-1 py-2 px-3 text-blue-600">
                        <ShoppingCart className="w-6 h-6" />
                        <span className="text-xs font-medium">Đơn hàng</span>
                    </Link>
                    <Link href="/products" className="flex flex-col items-center gap-1 py-2 px-3 text-gray-500">
                        <Package className="w-6 h-6" />
                        <span className="text-xs">Sản phẩm</span>
                    </Link>
                    <Link href="/contractor/debt" className="flex flex-col items-center gap-1 py-2 px-3 text-gray-500">
                        <CreditCard className="w-6 h-6" />
                        <span className="text-xs">Công nợ</span>
                    </Link>
                </div>
            </nav>

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
