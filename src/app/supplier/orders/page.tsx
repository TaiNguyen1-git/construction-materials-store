'use client'

import { useState, useEffect } from 'react'
import { FileText, Eye, CheckCircle, Truck, XCircle, Clock, X, Package, Check, Printer } from 'lucide-react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'

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

    const getStatusText = (status: string) => {
        switch (status) {
            case 'RECEIVED': return 'Đang giao hàng'
            case 'CONFIRMED': return 'Đã xác nhận'
            case 'SENT': return 'Chờ xử lý'
            case 'CANCELLED': return 'Đã hủy'
            default: return status
        }
    }

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'RECEIVED': return 'bg-emerald-100 text-emerald-800'
            case 'CONFIRMED': return 'bg-blue-100 text-blue-800'
            case 'SENT': return 'bg-amber-100 text-amber-800'
            case 'CANCELLED': return 'bg-rose-100 text-rose-800'
            default: return 'bg-gray-100 text-gray-800'
        }
    }

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'RECEIVED': return <Truck className="w-4 h-4" />
            case 'CONFIRMED': return <CheckCircle className="w-4 h-4" />
            case 'SENT': return <Clock className="w-4 h-4" />
            case 'CANCELLED': return <XCircle className="w-4 h-4" />
            default: return <FileText className="w-4 h-4" />
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

    const handlePrintOrder = (order: any) => {
        const printWindow = window.open('', '', 'width=800,height=600')
        if (!printWindow) return

        const itemsHtml = order.purchaseItems.map((item: any, idx: number) => `
            <tr>
                <td style="padding: 10px; border-bottom: 1px solid #ddd;">${idx + 1}</td>
                <td style="padding: 10px; border-bottom: 1px solid #ddd;">${item.product?.name || 'Sản phẩm'}</td>
                <td style="padding: 10px; border-bottom: 1px solid #ddd; text-align: center;">${item.quantity}</td>
                <td style="padding: 10px; border-bottom: 1px solid #ddd; text-align: right;">${new Intl.NumberFormat('vi-VN').format(item.unitPrice)} đ</td>
                <td style="padding: 10px; border-bottom: 1px solid #ddd; text-align: right;">${new Intl.NumberFormat('vi-VN').format(item.totalPrice)} đ</td>
            </tr>
        `).join('')

        printWindow.document.write(`
            <html>
                <head>
                    <title>Phiếu Giao Hàng - ${order.orderNumber}</title>
                    <style>
                        body { font-family: 'Times New Roman', serif; padding: 40px; }
                        .header { text-align: center; margin-bottom: 40px; }
                        .header h1 { margin: 0; font-size: 24px; text-transform: uppercase; }
                        .meta { margin-bottom: 30px; display: flex; justify-content: space-between; }
                        .table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
                        .table th { text-align: left; background: #f9f9f9; padding: 10px; border-bottom: 2px solid #000; font-size: 12px; text-transform: uppercase; }
                        .footer { margin-top: 50px; display: flex; justify-content: space-between; text-align: center; }
                        .sign-box { width: 200px; }
                        .sign-box p { font-weight: bold; margin-bottom: 60px; }
                    </style>
                </head>
                <body>
                    <div class="header">
                        <h1>Phiếu Giao Hàng</h1>
                        <p>Mã đơn: <strong>#${order.orderNumber}</strong></p>
                    </div>
                    
                    <div class="meta">
                        <div>
                            <strong>Người gửi:</strong><br>
                            SmartBuild Supplier System<br>
                            Hotline: 1900 1234
                        </div>
                        <div style="text-align: right;">
                            <strong>Ngày tạo:</strong> ${new Date().toLocaleDateString('vi-VN')}<br>
                            <strong>Trạng thái:</strong> ${order.status}
                        </div>
                    </div>

                    <table class="table">
                        <thead>
                            <tr>
                                <th style="width: 50px;">STT</th>
                                <th>Tên sản phẩm</th>
                                <th style="width: 80px; text-align: center;">SL</th>
                                <th style="width: 120px; text-align: right;">Đơn giá</th>
                                <th style="width: 120px; text-align: right;">Thành tiền</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${itemsHtml}
                        </tbody>
                        <tfoot>
                            <tr>
                                <td colspan="4" style="text-align: right; padding: 20px; font-weight: bold;">Tổng cộng:</td>
                                <td style="text-align: right; padding: 20px; font-weight: bold; font-size: 18px;">
                                    ${new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(order.totalAmount)}
                                </td>
                            </tr>
                        </tfoot>
                    </table>

                    <div class="footer">
                        <div class="sign-box">
                            <p>Người giao hàng</p>
                            <span>(Ký, họ tên)</span>
                        </div>
                        <div class="sign-box">
                            <p>Người nhận hàng</p>
                            <span>(Ký, họ tên)</span>
                        </div>
                    </div>

                    <script>
                        window.onload = function() { window.print(); }
                    </script>
                </body>
            </html>
        `)
        printWindow.document.close()
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

            {/* Orders Table Container */}
            <div className="bg-white rounded-[2.5rem] border border-slate-200/60 shadow-xl shadow-slate-200/40 overflow-hidden">
                <div className="overflow-x-auto custom-scrollbar">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-slate-50/50">
                            <tr>
                                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Mã Đơn / Ngày</th>
                                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Sản phẩm & Quy cách</th>
                                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Giá trị đơn</th>
                                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Trạng thái</th>
                                <th className="px-8 py-6 text-center text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Thao tác xử lý</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {orders.length > 0 ? (
                                orders.map((order) => (
                                    <tr key={order.id} className="group hover:bg-slate-50/50 transition-all duration-300">
                                        <td className="px-8 py-7">
                                            <div className="font-black text-blue-600 tracking-tight text-lg leading-none">#{order.orderNumber}</div>
                                            <div className="text-xs font-bold text-slate-400 mt-2 uppercase tracking-tighter">
                                                {new Date(order.createdAt).toLocaleDateString('vi-VN')}
                                            </div>
                                        </td>
                                        <td className="px-8 py-7">
                                            <div className="max-w-[300px]">
                                                <div className="text-sm font-bold text-slate-900 line-clamp-1">
                                                    {order.purchaseItems?.[0]?.product?.name || 'Sản phẩm không tên'}
                                                </div>
                                                {order.purchaseItems?.length > 1 && (
                                                    <div className="text-[10px] font-black text-blue-500 uppercase mt-1">
                                                        và {order.purchaseItems.length - 1} mặt hàng khác
                                                    </div>
                                                )}
                                                <div className="text-[10px] font-medium text-slate-400 mt-1 line-clamp-1">
                                                    Danh mục: {order.purchaseItems?.[0]?.product?.category?.name || 'N/A'}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-7">
                                            <div className="text-lg font-black text-slate-900 whitespace-nowrap">
                                                {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(order.totalAmount)}
                                            </div>
                                            <div className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest mt-1">Giao dịch an toàn</div>
                                        </td>
                                        <td className="px-8 py-7">
                                            <div className={`
                                                flex items-center gap-2 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest w-fit
                                                ${order.status === 'RECEIVED' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' :
                                                    order.status === 'CONFIRMED' ? 'bg-blue-50 text-blue-600 border border-blue-100' :
                                                        order.status === 'SENT' ? 'bg-amber-50 text-amber-600 border border-amber-100' :
                                                            'bg-slate-100 text-slate-500'}
                                            `}>
                                                {getStatusIcon(order.status)}
                                                {getStatusText(order.status)}
                                            </div>
                                        </td>
                                        <td className="px-8 py-7">
                                            <div className="flex items-center justify-center gap-3">
                                                {order.status === 'SENT' && (
                                                    <button
                                                        onClick={() => handleUpdateStatus(order.id, 'CONFIRMED')}
                                                        className="px-4 py-2 bg-blue-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-700 transition-all shadow-lg shadow-blue-100"
                                                    >
                                                        Xác nhận
                                                    </button>
                                                )}
                                                {order.status === 'CONFIRMED' && (
                                                    <button
                                                        onClick={() => handleUpdateStatus(order.id, 'RECEIVED')}
                                                        className="px-4 py-2 bg-emerald-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-100"
                                                    >
                                                        Giao hàng
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() => setSelectedOrder(order)}
                                                    className="w-10 h-10 bg-slate-50 text-slate-400 rounded-xl flex items-center justify-center hover:bg-blue-600 hover:text-white transition-all group-hover:shadow-lg shadow-blue-200"
                                                    title="Xem chi tiết"
                                                >
                                                    <Eye className="w-5 h-5" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={6} className="px-8 py-40 text-center">
                                        <div className="flex flex-col items-center justify-center grayscale opacity-10">
                                            <FileText className="w-24 h-24 mb-6" />
                                            <p className="text-xl font-black uppercase tracking-[0.4em] text-slate-400">Trống</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
            {/* Premium Detail Modal */}
            {selectedOrder && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 lg:p-10">
                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-fade-in" onClick={() => setSelectedOrder(null)} />
                    <div className="relative bg-white rounded-[2.5rem] w-full max-w-5xl max-h-[95vh] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300 flex flex-col mx-4">
                        {/* Modal Header */}
                        <div className="p-8 lg:p-10 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                            <div className="flex items-center gap-6">
                                <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center shadow-xl shadow-blue-200 rotate-3">
                                    <Package className="w-8 h-8 text-white" />
                                </div>
                                <div>
                                    <h2 className="text-2xl font-black text-slate-900 tracking-tight">Chi tiết đơn hàng #{selectedOrder.orderNumber}</h2>
                                    <p className="text-slate-500 font-medium text-sm mt-1">
                                        Ngày khởi tạo: {new Date(selectedOrder.createdAt).toLocaleString('vi-VN')}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <button
                                    onClick={() => handlePrintOrder(selectedOrder)}
                                    className="w-12 h-12 rounded-2xl bg-white border border-slate-200 flex items-center justify-center text-slate-400 hover:text-blue-600 hover:border-blue-100 hover:bg-blue-50 transition-all shadow-sm"
                                    title="In phiếu giao hàng"
                                >
                                    <Printer className="w-6 h-6" />
                                </button>
                                <button
                                    onClick={() => setSelectedOrder(null)}
                                    className="w-12 h-12 rounded-2xl bg-white border border-slate-200 flex items-center justify-center text-slate-400 hover:text-rose-500 hover:border-rose-100 hover:bg-rose-50 transition-all shadow-sm"
                                >
                                    <X className="w-6 h-6" />
                                </button>
                            </div>
                        </div>

                        {/* Modal Body */}
                        <div className="flex-1 overflow-y-auto p-8 lg:p-10 custom-scrollbar">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
                                {/* Order Info */}
                                <div className="md:col-span-2 space-y-8">
                                    <div>
                                        <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-6 px-1">Danh sách mặt hàng</h3>
                                        <div className="bg-slate-50 rounded-3xl border border-slate-100 overflow-hidden">
                                            <table className="w-full text-left border-collapse">
                                                <thead className="bg-white/50 border-b border-slate-100">
                                                    <tr>
                                                        <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Sản phẩm</th>
                                                        <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">SL</th>
                                                        <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Đơn giá</th>
                                                        <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Thành tiền</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-slate-100">
                                                    {selectedOrder.purchaseItems?.map((item: any, idx: number) => (
                                                        <tr key={idx} className="bg-white/30">
                                                            <td className="px-6 py-4 text-sm font-bold text-slate-900">{item.product?.name}</td>
                                                            <td className="px-6 py-4 text-sm font-black text-slate-900 text-center">x{item.quantity}</td>
                                                            <td className="px-6 py-4 text-sm font-medium text-slate-600 text-right">
                                                                {new Intl.NumberFormat('vi-VN').format(item.unitPrice || 0)}
                                                            </td>
                                                            <td className="px-6 py-4 text-sm font-black text-blue-600 text-right">
                                                                {new Intl.NumberFormat('vi-VN').format((item.unitPrice || 0) * (item.quantity || 0))}
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-6">
                                        <div className="p-6 bg-blue-50/50 rounded-3xl border border-blue-100">
                                            <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-2">Thông tin vận chuyển</p>
                                            <p className="text-sm font-bold text-slate-700 leading-relaxed">
                                                Tầng 4, Tòa nhà Bitexco, Q.1, TP.HCM
                                            </p>
                                        </div>
                                        <div className="p-6 bg-emerald-50/50 rounded-3xl border border-emerald-100">
                                            <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest mb-2">Ghi chú từ khách hàng</p>
                                            <p className="text-sm font-bold text-slate-700 leading-relaxed italic">
                                                "Giao hàng trong giờ hành chính, gọi trước 30p"
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Order Summary */}
                                <div className="space-y-6">
                                    <div className="p-8 bg-slate-900 rounded-[2.5rem] text-white shadow-2xl relative overflow-hidden">
                                        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl -mr-10 -mt-10" />
                                        <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-6">Tổng kết thanh toán</h3>

                                        <div className="space-y-4">
                                            <div className="flex justify-between items-center text-sm text-slate-400 font-medium">
                                                <span>Tạm tính</span>
                                                <span className="text-slate-200">{new Intl.NumberFormat('vi-VN').format(selectedOrder.totalAmount || 0)} đ</span>
                                            </div>
                                            <div className="flex justify-between items-center text-sm text-slate-400 font-medium">
                                                <span>Chiết khấu</span>
                                                <span className="text-emerald-400">0 đ</span>
                                            </div>
                                            <div className="pt-4 border-t border-slate-800 flex flex-col gap-2">
                                                <span className="text-xs font-black uppercase text-slate-500">Tổng cộng thanh toán</span>
                                                <span className="text-xl lg:text-3xl font-black text-blue-400 break-all">
                                                    {new Intl.NumberFormat('vi-VN').format(selectedOrder.totalAmount || 0)} đ
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="p-8 bg-white rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/40">
                                        <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-6">Trạng thái hiện tại</h3>
                                        <div className="flex items-center gap-4 mb-2">
                                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${selectedOrder.status === 'RECEIVED' ? 'bg-emerald-100 text-emerald-600' : 'bg-blue-100 text-blue-600'
                                                }`}>
                                                {getStatusIcon(selectedOrder.status)}
                                            </div>
                                            <div>
                                                <p className="text-lg font-black text-slate-900">{getStatusText(selectedOrder.status)}</p>
                                                <p className="text-[10px] font-bold text-slate-400 uppercase">Cập nhật lúc 10:45 AM</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Modal Footer */}
                        <div className="p-8 lg:p-10 border-t border-slate-100 bg-slate-50/50 flex items-center justify-end gap-4">
                            <button
                                onClick={() => setSelectedOrder(null)}
                                className="px-8 py-4 text-xs font-black text-slate-400 uppercase tracking-widest hover:text-slate-900 transition-colors"
                            >
                                Đóng lại
                            </button>
                            {selectedOrder.status === 'CONFIRMED' && (
                                <button
                                    onClick={() => {
                                        handleUpdateStatus(selectedOrder.id, 'RECEIVED');
                                        setSelectedOrder(null);
                                    }}
                                    className="px-8 py-4 bg-emerald-600 text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-xl shadow-emerald-200 hover:bg-emerald-700 active:scale-95 transition-all"
                                >
                                    Bắt đầu giao hàng
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
