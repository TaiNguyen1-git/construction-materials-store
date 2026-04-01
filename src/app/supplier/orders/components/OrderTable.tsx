import { Eye, FileText } from 'lucide-react'
import { getStatusIcon, getStatusText } from '../utils/orderUtils'

interface OrderTableProps {
    orders: any[]
    handleUpdateStatus: (id: string, status: string) => void
    setSelectedOrder: (order: any) => void
}

export default function OrderTable({ orders, handleUpdateStatus, setSelectedOrder }: OrderTableProps) {
    return (
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
    )
}
