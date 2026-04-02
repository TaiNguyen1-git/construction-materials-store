import React from 'react'
import { Plus, Edit, CheckCircle } from 'lucide-react'
import { DispatchOrder, Driver, getStatusInfo, formatCurrency } from '../../types'

interface OrderActionModalProps {
    order: DispatchOrder | null
    onClose: () => void
    mode: 'view' | 'edit'
    setMode: (mode: 'view' | 'edit') => void
    drivers: Driver[]
    onAssignDriver: (orderId: string, driverId: string | null) => void
}

const OrderActionModal: React.FC<OrderActionModalProps> = ({
    order,
    onClose,
    mode,
    setMode,
    drivers,
    onAssignDriver
}) => {
    if (!order) return null

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md" onClick={onClose}>
            <div className="bg-white w-full max-w-lg rounded-[32px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300" onClick={e => e.stopPropagation()}>
                <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-8 py-5 text-white">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-blue-200 text-[10px] font-black uppercase tracking-widest mb-1">
                                {mode === 'view' ? 'Chi tiết đơn hàng' : 'Chỉnh sửa đơn'}
                            </p>
                            <h2 className="text-xl font-black">{order.orderNumber}</h2>
                        </div>
                        <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-xl transition-colors">
                            <Plus className="w-5 h-5 rotate-45" />
                        </button>
                    </div>
                </div>
                <div className="p-8 space-y-5">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-slate-50 rounded-2xl p-4">
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Khách hàng</p>
                            <p className="font-bold text-slate-900 text-sm">{order.customerName || 'N/A'}</p>
                        </div>
                        <div className="bg-slate-50 rounded-2xl p-4">
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Tổng tiền</p>
                            <p className="font-black text-blue-600 text-lg">{formatCurrency(order.totalAmount)}</p>
                        </div>
                        <div className="bg-slate-50 rounded-2xl p-4">
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Trạng thái</p>
                            <span className={`text-xs px-2.5 py-1 rounded-lg font-black inline-block ${getStatusInfo(order.status).color}`}>
                                {getStatusInfo(order.status).label}
                            </span>
                        </div>
                        <div className="bg-slate-50 rounded-2xl p-4">
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Tài xế</p>
                            <p className="font-bold text-slate-900 text-sm">
                                {order.driverId ? drivers.find(d => d.id === order.driverId)?.user.name || 'Đã gán' : '— Chưa gán'}
                            </p>
                        </div>
                    </div>
                    {mode === 'edit' && (
                        <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Gán tài xế</p>
                            <div className="space-y-2">
                                <button
                                    onClick={() => onAssignDriver(order.id, null)}
                                    className={`w-full text-left px-4 py-3 rounded-xl border text-sm font-bold transition-all ${!order.driverId ? 'border-orange-400 bg-orange-50 text-orange-700' : 'border-slate-200 hover:border-slate-300 text-slate-600'}`}
                                >
                                    ← Bỏ gán (chuyển về chờ điều xe)
                                </button>
                                {drivers.map(d => (
                                    <button
                                        key={d.id}
                                        onClick={() => onAssignDriver(order.id, d.id)}
                                        className={`w-full text-left px-4 py-3 rounded-xl border text-sm font-bold transition-all flex items-center justify-between ${order.driverId === d.id ? 'border-blue-400 bg-blue-50 text-blue-700' : 'border-slate-200 hover:border-blue-300 text-slate-700'}`}
                                    >
                                        <span className="flex items-center gap-2">
                                            <span className={`w-7 h-7 rounded-lg flex items-center justify-center text-white text-xs font-black ${d.status === 'ON_TRIP' ? 'bg-orange-500' : 'bg-blue-600'}`}>{d.user.name.charAt(0)}</span>
                                            {d.user.name}
                                        </span>
                                        <span className={`text-[9px] font-bold uppercase ${d.status === 'ON_TRIP' ? 'text-orange-500' : 'text-emerald-500'}`}>
                                            {d.status === 'ON_TRIP' ? 'Đang giao' : 'Rảnh'}
                                        </span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                    <div className="flex gap-3 pt-2">
                        <button onClick={onClose} className="flex-1 py-3.5 bg-slate-100 text-slate-500 rounded-2xl font-bold hover:bg-slate-200 transition-all">Đóng</button>
                        {mode === 'view' ? (
                            <button onClick={() => setMode('edit')} className="flex-[2] py-3.5 bg-blue-600 text-white rounded-2xl font-black shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all flex items-center justify-center gap-2">
                                <Edit className="w-4 h-4" /> Chỉnh sửa
                            </button>
                        ) : (
                            <button onClick={() => setMode('view')} className="flex-[2] py-3.5 bg-emerald-600 text-white rounded-2xl font-black shadow-lg shadow-emerald-200 hover:bg-emerald-700 transition-all flex items-center justify-center gap-2">
                                <CheckCircle className="w-4 h-4" /> Xong
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}

export default OrderActionModal
