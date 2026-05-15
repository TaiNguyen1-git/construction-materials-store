import React from 'react'
import { RotateCcw, AlertCircle, XCircle } from 'lucide-react'

interface ReturnItem {
    id: string
    quantity: number
    product: {
        name: string
        sku: string
    }
}

interface PurchaseReturn {
    id: string
    createdAt: string
    reason: string
    status: string
    totalRefundAmount: number
    purchaseOrder: {
        orderNumber: string
    } | null
    items: ReturnItem[]
    supplierNote?: string
}

interface ReturnsListProps {
    returns: PurchaseReturn[]
    handleUpdateReturnStatus: (id: string, status: string) => void
}

export default function ReturnsList({ returns, handleUpdateReturnStatus }: ReturnsListProps) {
    return (
        <div className="bg-white rounded-[2.5rem] border border-slate-200/60 shadow-xl shadow-slate-200/40 overflow-hidden">
            <div className="overflow-x-auto custom-scrollbar">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-slate-50/50">
                        <tr>
                            <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Mã Đơn / Ngày Hoàn</th>
                            <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Lý do chi tiết</th>
                            <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Sản phẩm & Khối lượng</th>
                            <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Giá trị khấu trừ</th>
                            <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Trạng thái</th>
                            <th className="px-8 py-6 text-center text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Thao tác</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {returns.length > 0 ? (
                            returns.map((rt) => (
                                <tr key={rt.id} className="group hover:bg-slate-50/50 transition-all duration-300">
                                    <td className="px-8 py-7">
                                        <div className="font-black text-slate-900 tracking-tight text-lg">#{rt.purchaseOrder?.orderNumber ?? 'N/A'}</div>
                                        <div className="text-[10px] font-bold text-slate-400 mt-2 uppercase tracking-tighter">
                                            {new Date(rt.createdAt).toLocaleString('vi-VN')}
                                        </div>
                                    </td>
                                    <td className="px-8 py-7">
                                        <div className="max-w-[250px]">
                                            <div className="flex items-center gap-2 mb-2">
                                                <div className="w-6 h-6 rounded-lg bg-orange-100 flex items-center justify-center text-orange-600">
                                                    <AlertCircle className="w-3.5 h-3.5" />
                                                </div>
                                                <span className="text-sm font-bold text-slate-700">Thông tin lỗi</span>
                                            </div>
                                            <p className="text-xs text-slate-500 leading-relaxed italic line-clamp-2">
                                                "{rt.reason}"
                                            </p>
                                            {rt.supplierNote && (
                                                <div className="mt-3 p-3 bg-rose-50 border border-rose-100 rounded-xl">
                                                    <p className="text-[10px] font-black text-rose-500 uppercase tracking-widest mb-1">Lý do từ NCC:</p>
                                                    <p className="text-xs font-bold text-rose-700">"{rt.supplierNote}"</p>
                                                </div>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-8 py-7">
                                        <div className="space-y-2">
                                            {rt.items?.map((item, idx) => (
                                                <div key={idx} className="flex flex-col gap-0.5">
                                                    <div className="flex items-center justify-between gap-4">
                                                        <span className="text-xs font-bold text-slate-700">{item.product?.name ?? 'Sản phẩm đã xóa'}</span>
                                                        <span className="text-[10px] font-black text-rose-500 bg-rose-50 px-2 py-0.5 rounded-md">x{item.quantity}</span>
                                                    </div>
                                                    <div className="text-[10px] text-slate-400 font-medium">SKU: {item.product?.sku ?? 'N/A'}</div>
                                                </div>
                                            ))}
                                        </div>
                                    </td>
                                    <td className="px-8 py-7">
                                        <div className="text-lg font-black text-rose-600 whitespace-nowrap">
                                            -{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(rt.totalRefundAmount || 0)}
                                        </div>
                                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Khấu trừ công nợ</div>
                                    </td>
                                    <td className="px-8 py-7">
                                        <div className={`
                                            px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest w-fit
                                            ${rt.status === 'RECEIVED' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' :
                                                rt.status === 'CANCELLED' ? 'bg-slate-100 text-slate-500' :
                                                    'bg-amber-50 text-amber-600 border border-amber-100'}
                                        `}>
                                            {rt.status === 'RECEIVED' ? 'Đã nhận lại' :
                                                rt.status === 'CANCELLED' ? 'Đã hủy' :
                                                    rt.status === 'PENDING' ? 'Đang xử lý' :
                                                        rt.status === 'REFUNDED' ? 'Đã hoàn tiền' : rt.status}
                                        </div>
                                    </td>
                                    <td className="px-8 py-7">
                                        <div className="flex items-center justify-center gap-3">
                                            {rt.status === 'PENDING' && (
                                                <button
                                                    onClick={() => handleUpdateReturnStatus(rt.id, 'RECEIVED')}
                                                    className="px-4 py-2 bg-blue-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-700 transition-all shadow-lg shadow-blue-100"
                                                >
                                                    Nhận hàng
                                                </button>
                                            )}
                                            {rt.status === 'RECEIVED' && (
                                                <button
                                                    onClick={() => handleUpdateReturnStatus(rt.id, 'REFUNDED')}
                                                    className="px-4 py-2 bg-emerald-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-100"
                                                >
                                                    Hoàn tiền
                                                </button>
                                            )}
                                            {rt.status !== 'REFUNDED' && rt.status !== 'CANCELLED' && (
                                                <button
                                                    onClick={() => handleUpdateReturnStatus(rt.id, 'CANCELLED')}
                                                    className="p-2 bg-slate-50 text-slate-400 rounded-xl hover:bg-rose-50 hover:text-rose-500 transition-all"
                                                    title="Hủy yêu cầu"
                                                >
                                                    <XCircle className="w-5 h-5" />
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={6} className="px-8 py-40 text-center">
                                    <div className="flex flex-col items-center justify-center grayscale opacity-10">
                                        <RotateCcw className="w-24 h-24 mb-6" />
                                        <p className="text-xl font-black uppercase tracking-[0.4em] text-slate-400">Không có dữ liệu</p>
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
