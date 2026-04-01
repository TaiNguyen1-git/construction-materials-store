'use client'

import { useState, useEffect } from 'react'
import { Clock } from 'lucide-react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import OrderTable from './components/OrderTable'
import OrderDetailModal from './components/OrderDetailModal'

export default function SupplierOrdersPage() {
    const router = useRouter()
    const [orders, setOrders] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [selectedOrder, setSelectedOrder] = useState<any>(null)

    useEffect(() => {
        fetchOrders()
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
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight">Đơn đặt hàng (PO)</h1>
                    <p className="text-slate-500 font-medium mt-1">Theo dõi và cập nhật trạng thái cung ứng vật tư.</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="bg-blue-50 text-blue-600 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest border border-blue-100 flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        Trung bình xử lý: 2.5h
                    </div>
                </div>
            </div>

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
        </div>
    )
}
