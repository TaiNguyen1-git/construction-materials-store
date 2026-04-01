import { Package, Printer, X } from 'lucide-react'
import { getStatusIcon, getStatusText, handlePrintOrder } from '../utils/orderUtils'

interface OrderDetailModalProps {
    selectedOrder: any
    setSelectedOrder: (order: any) => void
    handleUpdateStatus: (id: string, status: string) => void
}

export default function OrderDetailModal({
    selectedOrder,
    setSelectedOrder,
    handleUpdateStatus
}: OrderDetailModalProps) {
    if (!selectedOrder) return null

    return (
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
    )
}
