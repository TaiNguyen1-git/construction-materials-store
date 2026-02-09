'use client'

import { useState, useEffect } from 'react'
import { ShoppingBag, Phone, Mail, Crown, Clock, Package, ChevronRight, User, AlertCircle } from 'lucide-react'
import { getAuthHeaders } from '@/lib/api-client'
import { CustomerContext, CustomerOrder } from './types'

interface CustomerContextPanelProps {
    customerId: string;
    isGuest: boolean;
    onClose?: () => void;
}

export default function CustomerContextPanel({
    customerId,
    isGuest,
    onClose
}: CustomerContextPanelProps) {
    const [customer, setCustomer] = useState<CustomerContext | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        if (isGuest) {
            setCustomer({
                id: customerId,
                name: `Khách #${customerId.replace('guest_', '')}`,
                isGuest: true,
                totalSpent: 0,
                totalOrders: 0,
                recentOrders: []
            })
            setLoading(false)
            return
        }

        fetchCustomerContext()
    }, [customerId, isGuest])

    const fetchCustomerContext = async () => {
        try {
            setLoading(true)
            const res = await fetch(`/api/customers/${customerId}/context`, {
                headers: getAuthHeaders()
            })
            if (!res.ok) throw new Error('Failed to fetch')
            const data = await res.json()
            setCustomer(data.data)
        } catch (err) {
            setError('Không thể tải thông tin khách hàng')
            console.error(err)
        } finally {
            setLoading(false)
        }
    }

    const getMembershipBadge = (tier?: string) => {
        const badges: Record<string, { bg: string, text: string, label: string }> = {
            'PLATINUM': { bg: 'bg-gradient-to-r from-purple-500 to-pink-500', text: 'text-white', label: 'Platinum' },
            'GOLD': { bg: 'bg-gradient-to-r from-yellow-400 to-orange-400', text: 'text-white', label: 'Vàng' },
            'SILVER': { bg: 'bg-gradient-to-r from-gray-300 to-gray-400', text: 'text-gray-800', label: 'Bạc' },
            'BRONZE': { bg: 'bg-gradient-to-r from-orange-300 to-amber-400', text: 'text-white', label: 'Đồng' },
        }
        return badges[tier || ''] || { bg: 'bg-gray-100', text: 'text-gray-600', label: 'Thường' }
    }

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount)
    }

    const getStatusColor = (status: string) => {
        const colors: Record<string, string> = {
            'PENDING': 'bg-yellow-100 text-yellow-800',
            'CONFIRMED': 'bg-blue-100 text-blue-800',
            'PROCESSING': 'bg-indigo-100 text-indigo-800',
            'SHIPPED': 'bg-purple-100 text-purple-800',
            'DELIVERED': 'bg-green-100 text-green-800',
            'CANCELLED': 'bg-red-100 text-red-800',
        }
        return colors[status] || 'bg-gray-100 text-gray-800'
    }

    const getStatusLabel = (status: string) => {
        const labels: Record<string, string> = {
            'PENDING': 'Chờ xử lý',
            'CONFIRMED': 'Đã xác nhận',
            'PROCESSING': 'Đang xử lý',
            'SHIPPED': 'Đang giao',
            'DELIVERED': 'Đã giao',
            'CANCELLED': 'Đã hủy',
        }
        return labels[status] || status
    }

    if (loading) {
        return (
            <div className="w-80 border-l border-gray-200 bg-white p-4 animate-pulse">
                <div className="h-6 bg-gray-200 rounded w-3/4 mb-4"></div>
                <div className="space-y-3">
                    <div className="h-4 bg-gray-200 rounded"></div>
                    <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                    <div className="h-20 bg-gray-200 rounded"></div>
                </div>
            </div>
        )
    }

    if (error || !customer) {
        return (
            <div className="w-80 border-l border-gray-200 bg-white p-4">
                <div className="flex items-center gap-2 text-red-500">
                    <AlertCircle className="w-5 h-5" />
                    <span className="text-sm">{error || 'Không có dữ liệu'}</span>
                </div>
            </div>
        )
    }

    const badge = getMembershipBadge(customer.membershipTier)

    return (
        <div className="w-80 border-l border-gray-200 bg-white flex flex-col h-full">
            {/* Header */}
            <div className="p-4 border-b border-gray-100">
                <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">
                    Hồ sơ khách hàng
                </h3>
            </div>

            {/* Customer Info */}
            <div className="p-4 border-b border-gray-100">
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                        {customer.isGuest ? (
                            <User className="w-6 h-6" />
                        ) : (
                            customer.name.charAt(0).toUpperCase()
                        )}
                    </div>
                    <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-gray-900 truncate">{customer.name}</h4>
                        {!customer.isGuest && (
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${badge.bg} ${badge.text}`}>
                                <Crown className="w-3 h-3" />
                                {badge.label}
                            </span>
                        )}
                        {customer.isGuest && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-gray-100 text-gray-600">
                                Khách vãng lai
                            </span>
                        )}
                    </div>
                </div>

                {/* Contact Info */}
                {!customer.isGuest && (
                    <div className="space-y-2 text-sm">
                        {customer.phone && (
                            <div className="flex items-center gap-2 text-gray-600">
                                <Phone className="w-4 h-4 text-gray-400" />
                                <span>{customer.phone}</span>
                            </div>
                        )}
                        {customer.email && (
                            <div className="flex items-center gap-2 text-gray-600">
                                <Mail className="w-4 h-4 text-gray-400" />
                                <span className="truncate">{customer.email}</span>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Stats */}
            <div className="p-4 border-b border-gray-100">
                <div className="grid grid-cols-2 gap-3">
                    <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-lg p-3">
                        <div className="text-xs text-emerald-600 font-medium mb-1">Tổng chi tiêu</div>
                        <div className="text-lg font-bold text-emerald-700">
                            {formatCurrency(customer.totalSpent)}
                        </div>
                    </div>
                    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-3">
                        <div className="text-xs text-blue-600 font-medium mb-1">Số đơn hàng</div>
                        <div className="text-lg font-bold text-blue-700">
                            {customer.totalOrders}
                        </div>
                    </div>
                </div>
            </div>

            {/* Recent Orders */}
            <div className="flex-1 overflow-y-auto p-4">
                <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                    <Package className="w-4 h-4" />
                    Đơn hàng gần đây
                </h4>

                {customer.recentOrders.length === 0 ? (
                    <div className="text-center py-6 text-gray-400">
                        <ShoppingBag className="w-10 h-10 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">Chưa có đơn hàng</p>
                    </div>
                ) : (
                    <div className="space-y-2">
                        {customer.recentOrders.map((order) => (
                            <div
                                key={order.id}
                                className="bg-gray-50 hover:bg-gray-100 rounded-lg p-3 cursor-pointer transition-colors group"
                            >
                                <div className="flex items-center justify-between mb-1">
                                    <span className="font-medium text-sm text-gray-900">
                                        #{order.orderNumber}
                                    </span>
                                    <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-gray-600 transition-colors" />
                                </div>
                                <div className="flex items-center justify-between text-xs">
                                    <span className={`px-2 py-0.5 rounded-full font-medium ${getStatusColor(order.status)}`}>
                                        {getStatusLabel(order.status)}
                                    </span>
                                    <span className="text-gray-500 flex items-center gap-1">
                                        <Clock className="w-3 h-3" />
                                        {new Date(order.createdAt).toLocaleDateString('vi-VN')}
                                    </span>
                                </div>
                                <div className="mt-2 text-sm font-semibold text-gray-700">
                                    {formatCurrency(order.totalAmount)}
                                    <span className="text-gray-400 font-normal ml-1">
                                        ({order.itemCount} sản phẩm)
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}
