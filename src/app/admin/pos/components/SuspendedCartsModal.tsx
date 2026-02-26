import React from 'react'
import { Pause, X, Play, Trash2, Save } from 'lucide-react'
import { SuspendedCart } from '../types'

interface SuspendedCartsModalProps {
    isOpen: boolean
    onClose: () => void
    suspendedCarts: SuspendedCart[]
    cartLength: number
    onSuspendCurrent: () => void
    onResume: (cart: SuspendedCart) => void
    onDelete: (id: string) => void
}

export function SuspendedCartsModal({
    isOpen,
    onClose,
    suspendedCarts,
    cartLength,
    onSuspendCurrent,
    onResume,
    onDelete
}: SuspendedCartsModalProps) {
    if (!isOpen) return null

    return (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-in fade-in duration-300">
            <div className="bg-white w-full max-w-md rounded-[40px] shadow-2xl overflow-hidden border border-slate-100 animate-in zoom-in-95 duration-300">
                <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-orange-50/50">
                    <h3 className="text-xl font-black text-slate-900 flex items-center gap-3">
                        <Pause className="text-orange-500" /> Đơn tạm ({suspendedCarts.length})
                    </h3>
                    <button onClick={onClose} className="p-3 hover:bg-white rounded-2xl transition-all">
                        <X className="w-6 h-6 text-slate-400" />
                    </button>
                </div>
                <div className="p-6 max-h-[50vh] overflow-y-auto space-y-3 scrollbar-thin">
                    {suspendedCarts.length === 0 ? (
                        <p className="text-center py-8 text-slate-400 font-bold italic">Không có đơn tạm nào</p>
                    ) : suspendedCarts.map(s => (
                        <div key={s.id} className="p-4 border border-slate-100 rounded-2xl hover:border-orange-200 transition-all">
                            <div className="flex items-center justify-between mb-2">
                                <p className="text-sm font-black text-slate-900">{s.label}</p>
                                <span className="text-[10px] font-bold text-slate-400">
                                    {new Date(s.savedAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                                </span>
                            </div>
                            <p className="text-xs text-slate-400 mb-3">{s.cart.length} sản phẩm • {s.cart.reduce((sum, i) => sum + i.quantity, 0)} SL</p>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => onResume(s)}
                                    className="flex-1 py-2 bg-orange-500 text-white text-xs font-black rounded-xl hover:bg-orange-600 transition-all flex items-center justify-center gap-1.5"
                                >
                                    <Play className="w-3.5 h-3.5" /> Mở lại
                                </button>
                                <button
                                    onClick={() => onDelete(s.id)}
                                    className="py-2 px-3 bg-slate-100 text-slate-500 text-xs font-black rounded-xl hover:bg-red-50 hover:text-red-500 transition-all"
                                >
                                    <Trash2 className="w-3.5 h-3.5" />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
                <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-between">
                    <button
                        onClick={onSuspendCurrent}
                        disabled={cartLength === 0}
                        className="px-5 py-3 bg-orange-500 text-white rounded-2xl font-black text-sm hover:bg-orange-600 transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                        <Save className="w-4 h-4" /> Lưu đơn hiện tại
                    </button>
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
