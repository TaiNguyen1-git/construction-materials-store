import React from 'react'
import { History, X } from 'lucide-react'

interface HistoryModalProps {
    isOpen: boolean
    onClose: () => void
    recentOrders: any[]
    formatCurrency: (val: number) => string
}

export function HistoryModal({
    isOpen,
    onClose,
    recentOrders,
    formatCurrency
}: HistoryModalProps) {
    if (!isOpen) return null

    return (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-in fade-in duration-300">
            <div className="bg-white w-full max-w-2xl rounded-[40px] shadow-2xl overflow-hidden border border-slate-100 animate-in zoom-in-95 duration-300">
                <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                    <h3 className="text-xl font-black text-slate-900 flex items-center gap-3">
                        <History className="text-blue-600" /> Lịch sử đơn hàng POS
                    </h3>
                    <button onClick={onClose} className="p-3 hover:bg-white rounded-2xl transition-all shadow-sm border border-transparent hover:border-slate-100">
                        <X className="w-6 h-6 text-slate-400" />
                    </button>
                </div>
                <div className="p-8 max-h-[60vh] overflow-y-auto scrollbar-thin">
                    {recentOrders.length === 0 ? (
                        <div className="text-center py-12 text-slate-400 font-bold italic">Không có đơn hàng gần đây</div>
                    ) : (
                        <div className="space-y-4">
                            {recentOrders.map((order: any) => (
                                <div key={order.id} className="p-5 border border-slate-100 rounded-3xl hover:border-blue-200 transition-all flex flex-col md:flex-row justify-between gap-4 group">
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="text-[10px] font-black bg-blue-100 text-blue-600 px-2 py-0.5 rounded-lg uppercase">#{order.orderNumber || order.id.slice(-6)}</span>
                                            <span className="text-xs font-bold text-slate-900">{order.customer?.name || order.guestName || 'Khách lẻ'}</span>
                                        </div>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{new Date(order.createdAt).toLocaleString('vi-VN')}</p>
                                    </div>
                                    <div className="flex items-center justify-between md:justify-end gap-6">
                                        <div className="text-right">
                                            <p className="text-xs text-slate-400 font-bold">Tổng tiền</p>
                                            <p className="text-sm font-black text-blue-600">{formatCurrency(order.totalAmount)}</p>
                                        </div>
                                        <div className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase ${order.status === 'COMPLETED' ? 'bg-emerald-50 text-emerald-600' : 'bg-orange-50 text-orange-600'}`}>
                                            {order.status}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
                <div className="p-8 bg-slate-50 border-t border-slate-100 flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-8 py-3 bg-white border border-slate-200 rounded-2xl font-black text-sm text-slate-600 hover:bg-slate-100 transition-all"
                    >
                        ĐÓNG
                    </button>
                </div>
            </div>
        </div>
    )
}
