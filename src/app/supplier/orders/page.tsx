'use client'

import { useState, useEffect } from 'react'
import { Clock } from 'lucide-react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import OrderTable from './components/OrderTable'
import OrderDetailModal from './components/OrderDetailModal'
import ReturnsList from './components/ReturnsList'

export default function SupplierOrdersPage() {
    const router = useRouter()
    const [activeTab, setActiveTab] = useState<'orders' | 'returns'>('orders')
    const [orders, setOrders] = useState<any[]>([])
    const [returns, setReturns] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [selectedOrder, setSelectedOrder] = useState<any>(null)

    useEffect(() => {
        fetchOrders()
        fetchReturns()
    }, [])

    const fetchOrders = async () => {
        try {
            const supplierId = localStorage.getItem('supplier_id')
            const res = await fetch(`/api/supplier/orders?supplierId=${supplierId}`)
            const data = await res.json()

            if (data.success) {
                setOrders(data.data || [])
            }
        } catch (error) {
            toast.error('Không thể tải danh sách đơn hàng')
        } finally {
            setLoading(false)
        }
    }

    const fetchReturns = async () => {
        try {
            const supplierId = localStorage.getItem('supplier_id')
            const res = await fetch(`/api/supplier/returns?supplierId=${supplierId}`)
            const data = await res.json()
            if (data.success) setReturns(data.data || [])
        } catch (error) {
            console.error('Fetch returns failed')
        }
    }

    const handleUpdateStatus = async (id: string, newStatus: string) => {
        try {
            const res = await fetch('/api/supplier/orders/status', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, status: newStatus })
            })
            const data = await res.json()
            if (data.success) {
                toast.success('Cập nhật trạng thái thành công')
                fetchOrders()
                if (selectedOrder && selectedOrder.id === id) {
                    setSelectedOrder({ ...selectedOrder, status: newStatus })
                }
            } else {
                toast.error(data.message)
            }
        } catch (error) {
            toast.error('Có lỗi xảy ra')
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        )
    }

    return (
        <div className="space-y-10 pb-20">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight">Quản lý Giao dịch</h1>
                    <p className="text-slate-500 font-medium mt-1">Theo dõi đơn hàng cung ứng và yêu cầu hoàn trả vật tư.</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="bg-white p-1 rounded-xl border border-slate-200 flex items-center shadow-sm">
                        <button
                            onClick={() => setActiveTab('orders')}
                            className={`px-6 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'orders' ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' : 'text-slate-400 hover:text-slate-600'}`}
                        >
                            Đơn hàng
                        </button>
                        <button
                            onClick={() => setActiveTab('returns')}
                            className={`px-6 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'returns' ? 'bg-rose-600 text-white shadow-lg shadow-rose-200' : 'text-slate-400 hover:text-slate-600'}`}
                        >
                            Trả hàng
                        </button>
                    </div>
                </div>
            </div>

            {activeTab === 'orders' ? (
                <>
                    <OrderTable 
                        orders={orders} 
                        handleUpdateStatus={handleUpdateStatus} 
                        setSelectedOrder={setSelectedOrder} 
                    />

                    <OrderDetailModal 
                        selectedOrder={selectedOrder} 
                        setSelectedOrder={setSelectedOrder} 
                        handleUpdateStatus={handleUpdateStatus} 
                    />
                </>
            ) : (
                <ReturnsList returns={returns} />
            )}
        </div>
    )
}
