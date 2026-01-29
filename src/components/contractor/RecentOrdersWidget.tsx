'use client'

import { ShoppingBag, ArrowRight, Package, Clock, CheckCircle, XCircle, Plus } from 'lucide-react'
import Link from 'next/link'

interface Order {
    id: string
    code: string
    total: number
    status: string
    date: string
    itemCount: number
    firstItem: string
}

interface RecentOrdersWidgetProps {
    orders: Order[]
}

export default function RecentOrdersWidget({ orders }: RecentOrdersWidgetProps) {
    const formatCurrency = (val: number) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val)

    // Status color mapping
    const getStatusColor = (status: string) => {
        switch (status) {
            case 'COMPLETED':
            case 'DELIVERED':
                return { bg: 'bg-green-50', text: 'text-green-700', icon: CheckCircle }
            case 'PENDING':
                return { bg: 'bg-yellow-50', text: 'text-yellow-700', icon: Clock }
            case 'CANCELLED':
                return { bg: 'bg-red-50', text: 'text-red-700', icon: XCircle }
            default:
                return { bg: 'bg-blue-50', text: 'text-blue-700', icon: ShoppingBag }
        }
    }

    if (!orders || orders.length === 0) {
        return (
            <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm h-full">
                <div className="flex items-center justify-between mb-6">
                    <h3 className="font-bold text-gray-900 flex items-center gap-2">
                        <ShoppingBag className="w-5 h-5 text-gray-400" />
                        Đơn hàng gần đây
                    </h3>
                </div>
                <div className="flex flex-col items-center justify-center h-40 text-gray-400">
                    <Package className="w-10 h-10 mb-2 opacity-50" />
                    <p className="text-sm">Chưa có đơn hàng nào</p>
                </div>
            </div>
        )
    }

    return (
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm h-full flex flex-col">
            <div className="flex items-center justify-between mb-6">
                <h3 className="font-bold text-gray-900 flex items-center gap-2">
                    <ShoppingBag className="w-5 h-5 text-gray-400" />
                    Đơn hàng gần đây
                </h3>
                <Link href="/contractor/orders" className="text-blue-600 text-sm font-medium hover:underline flex items-center gap-1">
                    Xem tất cả <ArrowRight className="w-4 h-4" />
                </Link>
            </div>

            <div className="space-y-4 flex-1">
                {orders.map((order) => {
                    const statusStyle = getStatusColor(order.status)
                    const StatusIcon = statusStyle.icon

                    return (
                        <div key={order.id} className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 transition-colors border border-transparent hover:border-gray-100 group cursor-pointer">
                            <div className="flex items-center gap-3">
                                <div className={`w-10 h-10 rounded-lg ${statusStyle.bg} flex items-center justify-center flex-shrink-0`}>
                                    <StatusIcon className={`w-5 h-5 ${statusStyle.text}`} />
                                </div>
                                <div>
                                    <p className="font-semibold text-gray-900 text-sm">{order.firstItem} {order.itemCount > 1 && <span className="text-gray-400 font-normal">+{order.itemCount - 1} khác</span>}</p>
                                    <p className="text-xs text-gray-500">#{order.code} • {new Date(order.date).toLocaleDateString('vi-VN')}</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="font-bold text-gray-900 text-sm">{formatCurrency(order.total)}</p>
                                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${statusStyle.bg} ${statusStyle.text}`}>
                                    {order.status}
                                </span>
                            </div>
                        </div>
                    )
                })}
            </div>

            <Link
                href="/contractor/quick-order"
                className="w-full mt-4 py-2 bg-gray-50 text-gray-600 font-medium text-sm rounded-lg hover:bg-gray-100 transition-colors flex items-center justify-center gap-2"
            >
                <Plus className="w-4 h-4" />
                Tạo đơn hàng mới
            </Link>
        </div>
    )
}
