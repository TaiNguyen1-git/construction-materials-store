
'use client'

import { useState, useEffect } from 'react'
import { Truck, Map, Package, CheckCircle, ExternalLink, RefreshCw, Copy, Smartphone } from 'lucide-react'
import Link from 'next/link'
import toast from 'react-hot-toast'

export default function AdminDeliveryPage() {
    const [stats, setStats] = useState({ ready: 0, active: 0, completed: 0 })
    const [readyOrders, setReadyOrders] = useState<any[]>([])
    const [activeDeliveries, setActiveDeliveries] = useState<any[]>([])
    const [completedDeliveries, setCompletedDeliveries] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [assigning, setAssigning] = useState<string | null>(null)

    const fetchData = async () => {
        setLoading(true)
        try {
            const res = await fetch('/api/admin/delivery-dashboard')
            const data = await res.json()
            if (res.ok) {
                setReadyOrders(data.data.readyOrders)
                setActiveDeliveries(data.data.activeDeliveries)
                setCompletedDeliveries(data.data.history)
                setStats({
                    ready: data.data.readyOrders.length,
                    active: data.data.activeDeliveries.length,
                    completed: data.data.history.length
                })
            }
        } catch (error) {
            toast.error('Lỗi tải dữ liệu')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchData()
        const interval = setInterval(fetchData, 30000) // Auto-refresh every 30s
        return () => clearInterval(interval)
    }, [])

    const handleAssign = async (orderId: string) => {
        setAssigning(orderId)
        try {
            const res = await fetch('/api/admin/delivery/assign', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ orderId })
            })
            const data = await res.json()
            if (res.ok) {
                toast.success('Đã tạo vận đơn!')
                // Copy link to clipboard
                navigator.clipboard.writeText(data.data.magicLink)
                toast('Đã copy Link gửi tài xế!', { icon: '📋' })
                fetchData()
            } else {
                toast.error(data.error?.message || 'Lỗi')
            }
        } catch (e) {
            toast.error('Lỗi kết nối')
        } finally {
            setAssigning(null)
        }
    }

    const copyLink = (token: string) => {
        const link = `${window.location.origin}/delivery/${token}`
        navigator.clipboard.writeText(link)
        toast.success('Đã copy Link!')
    }

    return (
        <div className="p-6 max-w-[1600px] mx-auto">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Điều phối Vận chuyển</h1>
                    <p className="text-sm text-gray-500">Quản lý giao hàng và theo dõi tài xế thời gian thực</p>
                </div>
                <button
                    onClick={fetchData}
                    className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
                >
                    <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                    Làm mới
                </button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-sm font-medium text-gray-500 mb-1">Cần giao ngay</p>
                        <h3 className="text-3xl font-bold text-gray-900">{stats.ready}</h3>
                    </div>
                    <div className="bg-orange-100 p-3 rounded-lg text-orange-600">
                        <Package className="w-6 h-6" />
                    </div>
                </div>
                <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-sm font-medium text-gray-500 mb-1">Đang trên đường</p>
                        <h3 className="text-3xl font-bold text-blue-600">{stats.active}</h3>
                    </div>
                    <div className="bg-blue-100 p-3 rounded-lg text-blue-600">
                        <Truck className="w-6 h-6" />
                    </div>
                </div>
                <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-sm font-medium text-gray-500 mb-1">Giao thành công</p>
                        <h3 className="text-3xl font-bold text-green-600">{stats.completed}</h3>
                    </div>
                    <div className="bg-green-100 p-3 rounded-lg text-green-600">
                        <CheckCircle className="w-6 h-6" />
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                {/* Left: Orders Ready */}
                <div className="xl:col-span-1 space-y-6">
                    <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                        <Package className="w-5 h-5" />
                        Đơn chờ giao ({readyOrders.length})
                    </h2>
                    <div className="space-y-4">
                        {readyOrders.length === 0 ? (
                            <div className="bg-gray-50 rounded-xl p-8 text-center text-gray-500 text-sm">
                                Không có đơn hàng nào cần giao
                            </div>
                        ) : (
                            readyOrders.map(order => (
                                <div key={order.id} className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                                    <div className="flex justify-between items-start mb-3">
                                        <div>
                                            <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">#{order.orderNumber}</span>
                                            <h3 className="font-bold text-gray-900">{order.customerName}</h3>
                                        </div>
                                        <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded text-xs font-bold">
                                            {order.status}
                                        </span>
                                    </div>
                                    <div className="space-y-2 mb-4">
                                        <p className="text-sm text-gray-600 flex items-start gap-2">
                                            <Map className="w-4 h-4 mt-0.5 shrink-0" />
                                            {typeof order.address === 'string' ? order.address : (order.address?.street + ', ' + order.address?.city)}
                                        </p>
                                        <p className="text-sm text-gray-500">
                                            {order.itemsCount} sản phẩm • {(order.totalAmount || 0).toLocaleString()}đ
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => handleAssign(order.id)}
                                        disabled={assigning === order.id}
                                        className="w-full py-2.5 bg-black text-white rounded-lg text-sm font-bold hover:bg-gray-800 transition-colors flex items-center justify-center gap-2"
                                    >
                                        {assigning === order.id ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Smartphone className="w-4 h-4" />}
                                        Tạo Link Giao Hàng
                                    </button>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Right: Active Deliveries */}
                <div className="xl:col-span-2 space-y-6">
                    <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                        <Truck className="w-5 h-5" />
                        Đang vận chuyển ({activeDeliveries.length})
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {activeDeliveries.length === 0 ? (
                            <div className="col-span-full bg-gray-50 rounded-xl p-12 text-center text-gray-500">
                                Chưa có xe nào đang chạy
                            </div>
                        ) : (
                            activeDeliveries.map(delivery => (
                                <div key={delivery.id} className="bg-white p-5 rounded-xl border border-blue-100 shadow-sm relative overflow-hidden">
                                    <div className="absolute top-0 right-0 p-2 opacity-10">
                                        <Truck className="w-24 h-24" />
                                    </div>
                                    <div className="flex justify-between items-start mb-4 relative z-10">
                                        <div>
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">#{delivery.orderNumber}</span>
                                                <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded text-[10px] font-black uppercase flex items-center gap-1">
                                                    <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse"></span>
                                                    {delivery.status === 'ASSIGNED' ? 'Đã gán xe' : 'Đang chạy'}
                                                </span>
                                            </div>
                                            <h3 className="font-bold text-lg text-gray-900">{delivery.driverName}</h3>
                                        </div>
                                        <button
                                            onClick={() => copyLink(delivery.token)}
                                            className="p-2 hover:bg-gray-100 rounded-lg text-gray-500 transition-colors"
                                            title="Copy Link cho tài xế"
                                        >
                                            <Copy className="w-5 h-5" />
                                        </button>
                                    </div>

                                    {/* Location Info (Simulation) */}
                                    <div className="bg-gray-50 rounded-lg p-3 mb-4 relative z-10">
                                        <p className="text-xs text-gray-500 font-bold uppercase mb-1">Vị trí hiện tại</p>
                                        {delivery.lastLocation ? (
                                            <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                                                <Map className="w-4 h-4 text-green-500" />
                                                GPS: {delivery.lastLocation.lat.toFixed(4)}, {delivery.lastLocation.lng.toFixed(4)}
                                                <span className="text-xs text-gray-400 font-normal ml-auto">
                                                    Vừa cập nhật
                                                </span>
                                            </div>
                                        ) : (
                                            <div className="text-sm text-gray-400 italic flex items-center gap-2">
                                                <RefreshCw className="w-3 h-3 animate-spin" /> Đang chờ tín hiệu GPS...
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex gap-2 relative z-10">
                                        <Link
                                            href={`/delivery/${delivery.token}`}
                                            target="_blank"
                                            className="flex-1 py-2 bg-white border border-gray-200 text-gray-700 font-bold rounded-lg text-xs hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
                                        >
                                            <ExternalLink className="w-3 h-3" /> Xem như Tài xế
                                        </Link>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    {/* Simple History List */}
                    {completedDeliveries.length > 0 && (
                        <div className="mt-8 pt-8 border-t border-gray-100">
                            <h2 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4">Giao gần đây</h2>
                            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                                {completedDeliveries.map((d, i) => (
                                    <div key={d.id} className={`p-4 flex items-center justify-between ${i !== completedDeliveries.length - 1 ? 'border-b border-gray-100' : ''}`}>
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center text-green-600">
                                                <CheckCircle className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <p className="font-bold text-gray-900 text-sm">#{d.orderNumber}</p>
                                                <p className="text-xs text-gray-500">{new Date(d.deliveredAt).toLocaleString('vi-VN')}</p>
                                            </div>
                                        </div>
                                        {d.proof && (
                                            <a href={d.proof} target="_blank" className="text-xs text-blue-600 font-medium hover:underline">
                                                Xem ảnh
                                            </a>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
