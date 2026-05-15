'use client'

import { useState, useEffect } from 'react'
import { Clock, X } from 'lucide-react'
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

    const [showCancelModal, setShowCancelModal] = useState(false)
    const [cancelReason, setCancelReason] = useState('')
    const [targetReturnId, setTargetReturnId] = useState('')

    const handleUpdateReturnStatus = async (id: string, newStatus: string) => {
        if (newStatus === 'CANCELLED') {
            setTargetReturnId(id)
            setCancelReason('')
            setShowCancelModal(true)
            return
        }

        await processUpdateReturnStatus(id, newStatus, '')
    }

    const processUpdateReturnStatus = async (id: string, newStatus: string, note: string) => {
        try {
            const res = await fetch('/api/supplier/returns/status', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, status: newStatus, note })
            })
            const data = await res.json()
            if (data.success) {
                toast.success('Cập nhật trạng thái trả hàng thành công')
                fetchReturns()
                setShowCancelModal(false)
            } else {
                toast.error(data.message)
            }
        } catch (error) {
            toast.error('Có lỗi xảy ra')
        }
    }

    const handleConfirmCancel = () => {
        if (!cancelReason.trim()) {
            toast.error('Vui lòng nhập lý do hủy')
            return
        }
        processUpdateReturnStatus(targetReturnId, 'CANCELLED', cancelReason)
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
                <ReturnsList returns={returns} handleUpdateReturnStatus={handleUpdateReturnStatus} />
            )}

            {/* Cancel Reason Modal */}
            {showCancelModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-white w-full max-w-md rounded-[3rem] p-8 md:p-10 shadow-2xl animate-in zoom-in-95 duration-300 overflow-hidden">
                        <div className="flex justify-between items-start mb-6">
                            <div>
                                <h2 className="text-2xl font-black text-slate-900 tracking-tight">Hủy yêu cầu trả hàng</h2>
                                <p className="text-xs font-bold text-slate-400 mt-2 uppercase tracking-widest">Vui lòng cung cấp lý do từ chối</p>
                            </div>
                            <button onClick={() => setShowCancelModal(false)} className="p-2 bg-slate-100 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-full transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="space-y-6">
                            <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Lý do từ chối hoàn trả</label>
                                <textarea
                                    className="w-full p-5 bg-slate-50 border border-slate-100 rounded-3xl font-medium text-sm focus:bg-white focus:ring-4 focus:ring-rose-500/10 focus:border-rose-400 outline-none transition-all h-32 resize-none"
                                    placeholder="Ví dụ: Hàng đã bị khui seal, không còn nguyên vẹn..."
                                    value={cancelReason}
                                    onChange={(e) => setCancelReason(e.target.value)}
                                />
                            </div>

                            <div className="flex gap-4 pt-2">
                                <button
                                    onClick={() => setShowCancelModal(false)}
                                    className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-200 transition-all"
                                >
                                    Đóng
                                </button>
                                <button
                                    onClick={handleConfirmCancel}
                                    className="flex-[2] py-4 bg-rose-500 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-rose-600 shadow-xl shadow-rose-200 transition-all"
                                >
                                    Xác nhận hủy
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
