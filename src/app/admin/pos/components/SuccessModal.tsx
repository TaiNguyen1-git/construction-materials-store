import React from 'react'
import { CheckCircle, X, Printer, Send, FileText, Plus } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { SuccessOrder } from '../types'

interface SuccessModalProps {
    successOrder: SuccessOrder | null
    onClose: () => void
    onPrintInvoice: () => void
    formatCurrency: (val: number) => string
}

export function SuccessModal({
    successOrder,
    onClose,
    onPrintInvoice,
    formatCurrency
}: SuccessModalProps) {
    if (!successOrder) return null

    return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[200] flex items-center justify-center p-4 animate-in fade-in duration-300">
            <div className="bg-white w-full max-w-3xl max-h-[90vh] rounded-[40px] shadow-2xl overflow-hidden border border-slate-100 animate-in zoom-in-95 duration-300 flex flex-col">
                {/* Header */}
                <div className="px-8 py-6 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white flex items-center gap-4">
                    <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-sm">
                        <CheckCircle className="w-8 h-8" />
                    </div>
                    <div className="flex-1">
                        <h3 className="text-xl font-black">Thanh toán thành công!</h3>
                        <p className="text-emerald-100 text-sm font-medium">Đơn hàng #{successOrder.orderNumber} đã được tạo</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-3 hover:bg-white/20 rounded-2xl transition-all"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto p-8">
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-8">
                        {/* Invoice Preview */}
                        <div className="md:col-span-3">
                            <div id="pos-invoice-preview" className="bg-white border border-slate-200 rounded-[24px] p-6 shadow-sm">
                                <h2 className="text-center text-lg font-black text-slate-900 mb-0.5">SmartBuild</h2>
                                <p className="text-center text-[10px] text-slate-400 font-medium mb-4">Hệ thống quản lý vật liệu xây dựng</p>

                                <div className="text-center text-xs text-slate-500 mb-4 space-y-0.5">
                                    <p className="font-black text-slate-700">HOÁ ĐƠN BÁN HÀNG</p>
                                    <p>Mã ĐH: <span className="font-bold text-blue-600">#{successOrder.orderNumber}</span></p>
                                    <p>Ngày: {new Date(successOrder.createdAt).toLocaleString('vi-VN')}</p>
                                    <p>Khách hàng: <span className="font-bold">{successOrder.customerName}</span>
                                        {successOrder.customerPhone && <span className="text-slate-400"> • {successOrder.customerPhone}</span>}
                                    </p>
                                    <p>Thanh toán: <span className="font-bold">{successOrder.paymentMethod}</span></p>
                                </div>

                                <div className="border-t border-dashed border-slate-200 my-3" />

                                {/* Items table */}
                                <table className="w-full text-xs mb-3">
                                    <thead>
                                        <tr className="text-[10px] uppercase text-slate-400 font-black">
                                            <th className="text-left pb-2">Sản phẩm</th>
                                            <th className="text-center pb-2">SL</th>
                                            <th className="text-right pb-2">Đ.Giá</th>
                                            <th className="text-right pb-2">T.Tiền</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {successOrder.items.map((item, i) => (
                                            <tr key={i} className="border-t border-slate-50">
                                                <td className="py-1.5 pr-2">
                                                    <span className="font-bold text-slate-700">{item.name}</span>
                                                    {item.discount && item.discount.value > 0 && (
                                                        <span className="ml-1 text-[9px] text-orange-500 font-black">(-{item.discount.type === 'percent' ? `${item.discount.value}%` : formatCurrency(item.discount.value)})</span>
                                                    )}
                                                </td>
                                                <td className="text-center py-1.5 font-bold">{item.quantity}</td>
                                                <td className="text-right py-1.5 text-slate-500">{formatCurrency(item.unitPrice)}</td>
                                                <td className="text-right py-1.5 font-black text-slate-800">{formatCurrency(item.total)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>

                                <div className="border-t border-dashed border-slate-200 my-3" />

                                {/* Summary */}
                                <div className="space-y-1">
                                    <div className="flex justify-between text-xs text-slate-500">
                                        <span>Tạm tính</span>
                                        <span className="font-bold">{formatCurrency(successOrder.subtotal)}</span>
                                    </div>
                                    {successOrder.itemDiscountTotal > 0 && (
                                        <div className="flex justify-between text-xs text-orange-500">
                                            <span>KM sản phẩm</span>
                                            <span className="font-bold">-{formatCurrency(successOrder.itemDiscountTotal)}</span>
                                        </div>
                                    )}
                                    {successOrder.orderDiscountAmount > 0 && (
                                        <div className="flex justify-between text-xs text-emerald-500">
                                            <span>KM đơn hàng</span>
                                            <span className="font-bold">-{formatCurrency(successOrder.orderDiscountAmount)}</span>
                                        </div>
                                    )}
                                    <div className="flex justify-between text-lg font-black text-slate-900 pt-2 border-t border-double border-slate-300">
                                        <span>TỔNG CỘNG</span>
                                        <span className="text-blue-600">{formatCurrency(successOrder.total)}</span>
                                    </div>
                                    {successOrder.totalDiscount > 0 && (
                                        <p className="text-right text-[10px] text-emerald-500 font-bold">Tiết kiệm {formatCurrency(successOrder.totalDiscount)}</p>
                                    )}
                                </div>

                                <p className="text-center text-[10px] text-slate-300 mt-4 italic">Cảm ơn quý khách • SmartBuild POS</p>
                            </div>
                        </div>

                        {/* Action buttons */}
                        <div className="md:col-span-2 flex flex-col gap-3">
                            <button
                                onClick={onPrintInvoice}
                                className="w-full py-4 bg-blue-600 text-white rounded-2xl font-black text-sm shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all active:scale-[0.98] flex items-center justify-center gap-3"
                            >
                                <Printer className="w-5 h-5" /> In Hoá Đơn
                            </button>
                            <button
                                onClick={() => {
                                    toast.success('Đã gửi hoá đơn cho khách hàng (demo)');
                                }}
                                className="w-full py-3.5 bg-slate-50 text-slate-700 rounded-2xl font-black text-sm border border-slate-200 hover:bg-slate-100 transition-all active:scale-[0.98] flex items-center justify-center gap-3"
                            >
                                <Send className="w-4 h-4" /> Gửi Zalo / Email
                            </button>
                            <button
                                onClick={() => {
                                    navigator.clipboard.writeText(successOrder.orderNumber)
                                    toast.success('Đã copy mã đơn hàng!')
                                }}
                                className="w-full py-3.5 bg-slate-50 text-slate-700 rounded-2xl font-black text-sm border border-slate-200 hover:bg-slate-100 transition-all active:scale-[0.98] flex items-center justify-center gap-3"
                            >
                                <FileText className="w-4 h-4" /> Copy Mã Đơn
                            </button>

                            <div className="flex-1" />

                            {/* Order summary card */}
                            <div className="bg-emerald-50 rounded-2xl p-4 border border-emerald-100">
                                <p className="text-[10px] font-black uppercase tracking-widest text-emerald-600 mb-2">Tóm tắt</p>
                                <div className="space-y-1 text-xs">
                                    <div className="flex justify-between">
                                        <span className="text-slate-500">Số SP</span>
                                        <span className="font-bold">{successOrder.items.length} mặt hàng</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-slate-500">Tổng SL</span>
                                        <span className="font-bold">{successOrder.items.reduce((s, i) => s + i.quantity, 0)}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-slate-500">Thanh toán</span>
                                        <span className="font-bold">{successOrder.paymentMethod}</span>
                                    </div>
                                    {successOrder.totalDiscount > 0 && (
                                        <div className="flex justify-between">
                                            <span className="text-emerald-500">Giảm giá</span>
                                            <span className="font-bold text-emerald-600">{formatCurrency(successOrder.totalDiscount)}</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* NEW ORDER — primary CTA */}
                            <button
                                onClick={onClose}
                                className="w-full py-5 bg-emerald-600 text-white rounded-2xl font-black text-base shadow-xl shadow-emerald-200 hover:bg-emerald-700 transition-all active:scale-[0.98] flex items-center justify-center gap-3"
                            >
                                <Plus className="w-6 h-6" /> TẠO ĐƠN MỚI
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
