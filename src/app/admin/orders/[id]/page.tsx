'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import {
    ArrowLeft,
    Package,
    Truck,
    CreditCard,
    Calendar,
    User,
    MapPin,
    Clock,
    CheckCircle,
    AlertCircle,
    ChevronRight,
    Printer,
    FileText,
    ExternalLink,
    Box,
    History,
    Loader2
} from 'lucide-react'
import { toast, Toaster } from 'react-hot-toast'
import { fetchWithAuth } from '@/lib/api-client'

interface OrderItem {
    id: string
    quantity: number
    unitPrice: number
    totalPrice: number
    product: {
        id: string
        name: string
        sku: string
        images?: string[]
    }
}

interface Order {
    id: string
    orderNumber: string
    status: string
    totalAmount: number
    shippingAddress: any // Can be string or object
    billingAddress?: any
    paymentMethod: string
    paymentStatus: string
    paymentType?: string
    depositAmount?: number
    remainingAmount?: number
    customerType: string
    guestName?: string
    guestEmail?: string
    guestPhone?: string
    customer?: {
        id: string
        user: {
            name: string
            email: string
            phone?: string
        }
    }
    orderItems: OrderItem[]
    createdAt: string
    updatedAt: string
    notes?: string
}

export default function OrderDetailPage() {
    const params = useParams()
    const router = useRouter()
    const orderId = params.id as string

    const [order, setOrder] = useState<Order | null>(null)
    const [loading, setLoading] = useState(true)
    const [currentTime, setCurrentTime] = useState<string>('')

    useEffect(() => {
        if (orderId) {
            fetchOrder()
        }
        // Set time on client side only to avoid hydration mismatch
        setCurrentTime(new Date().toLocaleString('vi-VN'))
    }, [orderId])

    const fetchOrder = async () => {
        try {
            setLoading(true)
            const res = await fetchWithAuth(`/api/orders/${orderId}`)
            if (res.ok) {
                const data = await res.json()
                const orderData = data.data || data
                setOrder(orderData)
            } else {
                toast.error('Không tìm thấy đơn hàng')
                router.push('/admin/orders')
            }
        } catch (error) {
            console.error('Error fetching order:', error)
            toast.error('Lỗi khi tải dữ liệu đơn hàng')
        } finally {
            setLoading(false)
        }
    }

    const formatAddress = (address: any): string => {
        if (!address) return 'Chưa cung cấp địa chỉ'
        if (typeof address === 'string') return address
        if (typeof address === 'object') {
            const parts = [
                address.street || address.address,
                address.ward,
                address.district,
                address.city || address.province
            ].filter(Boolean)
            return parts.length > 0 ? parts.join(', ') : JSON.stringify(address)
        }
        return String(address)
    }

    const getStatusConfig = (status: string) => {
        const configs: Record<string, { label: string; color: string; icon: any }> = {
            'PENDING_CONFIRMATION': { label: 'Chờ Xác Nhận', color: 'bg-orange-100 text-orange-700 border-orange-200', icon: Clock },
            'CONFIRMED_AWAITING_DEPOSIT': { label: 'Chờ Đặt Cọc', color: 'bg-amber-100 text-amber-700 border-amber-200', icon: CreditCard },
            'DEPOSIT_PAID': { label: 'Đã Cọc', color: 'bg-cyan-100 text-cyan-700 border-cyan-200', icon: CheckCircle },
            'PENDING': { label: 'Chờ Xử Lý', color: 'bg-yellow-100 text-yellow-700 border-yellow-200', icon: Clock },
            'CONFIRMED': { label: 'Đã Xác Nhận', color: 'bg-blue-100 text-blue-700 border-blue-200', icon: CheckCircle },
            'PROCESSING': { label: 'Đang Chuẩn Bị', color: 'bg-purple-100 text-purple-700 border-purple-200', icon: Box },
            'SHIPPED': { label: 'Đang Giao', color: 'bg-indigo-100 text-indigo-700 border-indigo-200', icon: Truck },
            'DELIVERED': { label: 'Đã Giao', color: 'bg-emerald-100 text-emerald-700 border-emerald-200', icon: CheckCircle },
            'COMPLETED': { label: 'Hoàn Thành', color: 'bg-green-100 text-green-700 border-green-200', icon: CheckCircle },
            'CANCELLED': { label: 'Đã Hủy', color: 'bg-red-100 text-red-700 border-red-200', icon: AlertCircle },
            'RETURNED': { label: 'Đã Trả Hàng', color: 'bg-slate-100 text-slate-700 border-slate-200', icon: History },
        }
        return configs[status] || { label: status, color: 'bg-slate-100 text-slate-700 border-slate-200', icon: Package }
    }

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
                <Loader2 className="w-12 h-12 animate-spin text-blue-600" />
                <p className="text-sm font-bold text-slate-400 animate-pulse uppercase tracking-widest">Đang tải dữ liệu...</p>
            </div>
        )
    }

    if (!order) return null

    const statusConfig = getStatusConfig(order.status)
    const StatusIcon = statusConfig.icon

    return (
        <div className="p-8 max-w-[1400px] mx-auto space-y-8 animate-in fade-in duration-500">
            <Toaster />

            {/* Breadcrumbs & Navigation */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => router.push('/admin/orders')}
                        className="w-10 h-10 flex items-center justify-center rounded-xl bg-white border border-slate-200 text-slate-400 hover:text-blue-600 hover:border-blue-100 transition-all active:scale-95"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div>
                        <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
                            <Link href="/admin/orders" className="hover:text-blue-600 transition-colors">Đơn Hàng</Link>
                            <ChevronRight className="w-3 h-3" />
                            <span className="text-slate-900">{order.orderNumber}</span>
                        </div>
                        <h1 className="text-2xl font-black text-slate-900 tracking-tight">Chi tiết đơn hàng</h1>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <button className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 transition-all">
                        <Printer className="w-4 h-4" /> In Hóa Đơn
                    </button>
                    <Link
                        href={`/admin/orders/${order.id}/phases`}
                        className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl text-xs font-black uppercase tracking-widest shadow-lg shadow-blue-500/20 hover:scale-[1.02] active:scale-95 transition-all"
                    >
                        <Truck className="w-4 h-4" /> Lập lịch giao hàng
                    </Link>
                </div>
            </div>

            {/* Header Summary Card */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                <div className="lg:col-span-3 bg-white rounded-[32px] p-8 border border-slate-100 shadow-sm relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 blur-[80px] pointer-events-none group-hover:bg-blue-500/10 transition-all duration-700"></div>

                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
                        <div className="flex items-center gap-6">
                            <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600">
                                <Package className="w-8 h-8" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-black text-slate-900 tracking-tighter mb-1">
                                    {order.orderNumber}
                                </h2>
                                <div className="flex items-center gap-3">
                                    <span className="text-xs font-bold text-slate-400">Ngày đặt: {new Date(order.createdAt).toLocaleDateString('vi-VN')}</span>
                                    <div className="w-1 h-1 rounded-full bg-slate-200"></div>
                                    <span className="text-xs font-bold text-slate-400">ID: {order.id.substring(0, 8)}...</span>
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-col items-end gap-2">
                            <div className={`flex items-center gap-2 px-4 py-2 rounded-full border ${statusConfig.color} font-black text-xs uppercase tracking-widest`}>
                                <StatusIcon className="w-4 h-4" />
                                {statusConfig.label}
                            </div>
                            <p className="text-3xl font-black text-slate-900 tracking-tight">
                                {Number(order.totalAmount || 0).toLocaleString()}đ
                            </p>
                        </div>
                    </div>
                </div>

                <div className="bg-gradient-to-br from-slate-900 to-indigo-950 rounded-[32px] p-8 shadow-xl shadow-slate-200 relative overflow-hidden text-white group">
                    <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.1),transparent)] pointer-events-none"></div>
                    <div className="relative z-10 flex flex-col h-full justify-between">
                        <div className="flex justify-between items-start mb-6">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Thanh Toán</span>
                            <CreditCard className="w-5 h-5 text-blue-400" />
                        </div>
                        <div>
                            <p className="text-xs font-bold text-slate-400 mb-1">{order.paymentMethod || 'N/A'}</p>
                            <p className="text-xl font-black mb-4">
                                {order.paymentStatus === 'PAID' ? 'Đã thanh toán' : 'Chưa thanh toán'}
                            </p>
                            {order.paymentType === 'DEPOSIT' && (
                                <div className="space-y-1 pt-4 border-t border-white/10 uppercase font-black text-[9px] tracking-widest text-slate-400">
                                    <div className="flex justify-between">
                                        <span>Đã cọc:</span>
                                        <span className="text-blue-400">{Number(order.depositAmount || 0).toLocaleString()}đ</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>Còn lại:</span>
                                        <span className="text-red-400">{Number(order.remainingAmount || 0).toLocaleString()}đ</span>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Order Items */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden">
                        <div className="px-8 py-6 border-b border-slate-50 flex items-center justify-between">
                            <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight flex items-center gap-2">
                                <Package className="w-4 h-4 text-blue-600" />
                                Danh sách sản phẩm
                            </h3>
                            <span className="bg-slate-100 px-3 py-1 rounded-lg text-xs font-black text-slate-500">
                                {order.orderItems?.length || 0} sản phẩm
                            </span>
                        </div>
                        <div className="divide-y divide-slate-50">
                            {order.orderItems?.map((item) => (
                                <div key={item.id} className="p-8 flex items-center gap-6 group hover:bg-slate-50/50 transition-all">
                                    <div className="w-16 h-16 bg-slate-100 rounded-2xl flex-shrink-0 flex items-center justify-center text-slate-300 font-bold overflow-hidden border border-slate-200">
                                        {item.product?.images && item.product.images.length > 0 ? (
                                            <img src={item.product.images[0]} alt={item.product.name} className="w-full h-full object-cover" />
                                        ) : (
                                            <Package className="w-6 h-6" />
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-black text-slate-900 truncate group-hover:text-blue-600 transition-colors mb-0.5">
                                            {item.product?.name || 'Sản phẩm không xác định'}
                                        </p>
                                        <div className="flex items-center gap-2">
                                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{item.product?.sku || 'N/A'}</span>
                                            <div className="w-1 h-1 rounded-full bg-slate-200"></div>
                                            <span className="text-[10px] font-bold text-slate-400">Đơn giá: {Number(item.unitPrice || 0).toLocaleString()}đ</span>
                                        </div>
                                    </div>
                                    <div className="text-right flex-shrink-0">
                                        <p className="text-[10px] font-black text-slate-400 mb-1">Số lượng: x{item.quantity}</p>
                                        <p className="text-sm font-black text-slate-900">{Number(item.totalPrice || 0).toLocaleString()}đ</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="p-8 bg-slate-50/50 border-t border-slate-100">
                            <div className="flex flex-col gap-3 max-w-[300px] ml-auto">
                                <div className="flex justify-between text-sm text-slate-500 font-bold">
                                    <span>Tạm tính:</span>
                                    <span>{Number(order.totalAmount || 0).toLocaleString()}đ</span>
                                </div>
                                <div className="flex justify-between text-sm text-slate-500 font-bold">
                                    <span>Giảm giá:</span>
                                    <span>0đ</span>
                                </div>
                                <div className="pt-3 border-t border-slate-200 flex justify-between items-center">
                                    <span className="text-sm font-black text-slate-900">Tổng cộng:</span>
                                    <span className="text-xl font-black text-blue-600">{Number(order.totalAmount || 0).toLocaleString()}đ</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Timeline / Status History */}
                    <div className="bg-white rounded-[32px] border border-slate-100 p-8 shadow-sm">
                        <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight flex items-center gap-2 mb-8">
                            <History className="w-4 h-4 text-emerald-500" />
                            Lịch sử trạng thái
                        </h3>
                        <div className="relative space-y-8 before:absolute before:inset-0 before:ml-4 before:-translate-x-px before:h-full before:w-0.5 before:bg-gradient-to-b before:from-blue-600 before:via-slate-200 before:to-slate-100">
                            <div className="relative flex items-center gap-6">
                                <div className="w-2 h-2 rounded-full bg-blue-600 ring-4 ring-blue-100 z-10"></div>
                                <div>
                                    <p className="text-xs font-black text-slate-900 lowercase first-letter:uppercase">{statusConfig.label}</p>
                                    <p className="text-[10px] text-slate-400 font-bold">{currentTime || '...'}</p>
                                </div>
                            </div>
                            <div className="relative flex items-center gap-6">
                                <div className="w-2 h-2 rounded-full bg-slate-200 z-10"></div>
                                <div>
                                    <p className="text-xs font-bold text-slate-500">Đơn hàng được khởi tạo</p>
                                    <p className="text-[10px] text-slate-400">{new Date(order.createdAt).toLocaleString('vi-VN')}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Customer & Shipping Info */}
                <div className="space-y-8">
                    {/* Customer Card */}
                    <div className="bg-white rounded-[32px] border border-slate-100 p-8 shadow-sm">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Khách hàng</h3>
                            <div className="p-2 bg-blue-50 rounded-xl">
                                <User className="w-4 h-4 text-blue-600" />
                            </div>
                        </div>
                        <div className="space-y-4">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center font-black text-slate-400">
                                    {(order.customer?.user?.name || order.guestName || 'U')[0]}
                                </div>
                                <div className="min-w-0">
                                    <p className="text-sm font-black text-slate-900 truncate">
                                        {order.customer?.user?.name || order.guestName}
                                    </p>
                                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                                        {order.customerType === 'REGISTERED' ? 'Khách đã đăng ký' : 'Khách vãng lai'}
                                    </p>
                                </div>
                            </div>
                            <div className="pt-4 space-y-3">
                                <div className="flex items-center gap-3 text-xs text-slate-600 font-bold">
                                    <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center flex-shrink-0">
                                        <ExternalLink className="w-4 h-4 text-slate-400" />
                                    </div>
                                    <span className="truncate">{order.customer?.user?.email || order.guestEmail || 'N/A'}</span>
                                </div>
                                <div className="flex items-center gap-3 text-xs text-slate-600 font-bold">
                                    <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center flex-shrink-0">
                                        <Clock className="w-4 h-4 text-slate-400" />
                                    </div>
                                    <span>{order.customer?.user?.phone || order.guestPhone || 'Không có SĐT'}</span>
                                </div>
                            </div>
                            {order.customer?.id && (
                                <Link
                                    href={`/admin/customers/${order.customer.id}`}
                                    className="block w-full text-center py-3 bg-slate-50 text-slate-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-100 transition-all mt-4"
                                >
                                    Xem hồ sơ khách hàng
                                </Link>
                            )}
                        </div>
                    </div>

                    {/* Shipping Card */}
                    <div className="bg-white rounded-[32px] border border-slate-100 p-8 shadow-sm">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Địa chỉ giao hàng</h3>
                            <div className="p-2 bg-emerald-50 rounded-xl">
                                <MapPin className="w-4 h-4 text-emerald-600" />
                            </div>
                        </div>
                        <div className="space-y-4">
                            <div className="flex gap-4">
                                <div className="flex-1">
                                    <p className="text-sm font-bold text-slate-700 leading-relaxed">
                                        {formatAddress(order.shippingAddress)}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Notes Card */}
                    <div className="bg-white rounded-[32px] border border-slate-100 p-8 shadow-sm">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Ghi chú</h3>
                            <div className="p-2 bg-slate-50 rounded-xl">
                                <FileText className="w-4 h-4 text-slate-400" />
                            </div>
                        </div>
                        <p className="text-sm font-medium text-slate-500 italic leading-relaxed">
                            {order.notes || 'Không có ghi chú nào cho đơn hàng này.'}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}
