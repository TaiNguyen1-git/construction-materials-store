'use client'

import React from 'react'
import { CheckCircle, X, Plus, FileText, Building2 } from 'lucide-react'
import { SuccessOrderData } from '../types'

interface SuccessModalProps {
    order: SuccessOrderData | null
    onClose: () => void
    formatCurrency: (val: number) => string
}

export default function SuccessModal({ order, onClose, formatCurrency }: SuccessModalProps) {
    if (!order) return null

    return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[200] flex items-center justify-center p-4 animate-in fade-in duration-300">
            <div className="bg-white w-full max-w-2xl max-h-[90vh] rounded-[36px] shadow-2xl overflow-hidden border border-slate-100 animate-in zoom-in-95 duration-300 flex flex-col">
                {/* Header */}
                <div className="px-8 py-6 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white flex items-center gap-4">
                    <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-sm">
                        <CheckCircle className="w-8 h-8" />
                    </div>
                    <div className="flex-1">
                        <h3 className="text-xl font-black">Đặt hàng thành công!</h3>
                        <p className="text-emerald-100 text-sm font-medium">
                            Đơn hàng #{order.orderNumber} đã được tạo
                        </p>
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
                        {/* Order Details */}
                        <div className="md:col-span-3">
                            <div className="bg-white border border-slate-200 rounded-[20px] p-6 shadow-sm">
                                <h2 className="text-center text-lg font-black text-slate-900 mb-0.5">SmartBuild</h2>
                                <p className="text-center text-[10px] text-slate-400 font-medium mb-4">
                                    Đơn hàng Nhà thầu B2B
                                </p>

                                <div className="text-center text-xs text-slate-500 mb-4 space-y-0.5">
                                    <p className="font-black text-slate-700">ĐƠN ĐẶT HÀNG</p>
                                    <p>Mã ĐH: <span className="font-bold text-blue-600">#{order.orderNumber}</span></p>
                                    <p>Ngày: {new Date(order.createdAt).toLocaleString('vi-VN')}</p>
                                    {order.projectName && (
                                        <p className="flex items-center justify-center gap-1">
                                            <Building2 className="w-3 h-3" />
                                            Dự án: <span className="font-bold">{order.projectName}</span>
                                        </p>
                                    )}
                                </div>

                                <div className="border-t border-dashed border-slate-200 my-3" />

                                {/* Items */}
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
                                        {order.items.map((item, i) => (
                                            <tr key={i} className="border-t border-slate-50">
                                                <td className="py-1.5 pr-2">
                                                    <span className="font-bold text-slate-700">{item.name}</span>
                                                    {item.effectivePrice < item.unitPrice && (
                                                        <span className="ml-1 text-[9px] text-emerald-500 font-black">
                                                            B2B
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="text-center py-1.5 font-bold">{item.quantity}</td>
                                                <td className="text-right py-1.5 text-slate-500">
                                                    {formatCurrency(item.effectivePrice)}
                                                </td>
                                                <td className="text-right py-1.5 font-black text-slate-800">
                                                    {formatCurrency(item.total)}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>

                                <div className="border-t border-dashed border-slate-200 my-3" />

                                {/* Summary */}
                                <div className="space-y-1">
                                    <div className="flex justify-between text-xs text-slate-500">
                                        <span>Tạm tính</span>
                                        <span className="font-bold">{formatCurrency(order.subtotal)}</span>
                                    </div>
                                    {order.discountTotal > 0 && (
                                        <div className="flex justify-between text-xs text-emerald-500">
                                            <span>Chiết khấu B2B</span>
                                            <span className="font-bold">-{formatCurrency(order.discountTotal)}</span>
                                        </div>
                                    )}
                                    {order.shippingFee > 0 && (
                                        <div className="flex justify-between text-xs text-slate-500">
                                            <span>🚚 Vận chuyển</span>
                                            <span className="font-bold">+{formatCurrency(order.shippingFee)}</span>
                                        </div>
                                    )}
                                    {order.shippingFee === 0 && (
                                        <div className="flex justify-between text-xs text-emerald-500">
                                            <span>🚚 Vận chuyển</span>
                                            <span className="font-bold">Miễn phí</span>
                                        </div>
                                    )}
                                    <div className="flex justify-between text-lg font-black text-slate-900 pt-2 border-t border-double border-slate-300">
                                        <span>TỔNG CỘNG</span>
                                        <span className="text-blue-600">{formatCurrency(order.total)}</span>
                                    </div>
                                    {order.discountTotal > 0 && (
                                        <p className="text-right text-[10px] text-emerald-500 font-bold">
                                            Tiết kiệm {formatCurrency(order.discountTotal)}
                                        </p>
                                    )}
                                </div>

                                <p className="text-center text-[10px] text-slate-300 mt-4 italic">
                                    Thanh toán công nợ • SmartBuild B2B
                                </p>
                            </div>
                        </div>

                        {/* Action buttons */}
                        <div className="md:col-span-2 flex flex-col gap-3">
                            <button
                                onClick={() => {
                                    navigator.clipboard.writeText(order.orderNumber)
                                }}
                                className="w-full py-3.5 bg-slate-50 text-slate-700 rounded-2xl font-black text-sm border border-slate-200 hover:bg-slate-100 transition-all active:scale-[0.98] flex items-center justify-center gap-3"
                            >
                                <FileText className="w-4 h-4" /> Copy Mã Đơn
                            </button>

                            <div className="flex-1" />

                            {/* Order summary card */}
                            <div className="bg-emerald-50 rounded-2xl p-4 border border-emerald-100">
                                <p className="text-[10px] font-black uppercase tracking-widest text-emerald-600 mb-2">
                                    Tóm tắt
                                </p>
                                <div className="space-y-1 text-xs">
                                    <div className="flex justify-between">
                                        <span className="text-slate-500">Số SP</span>
                                        <span className="font-bold">{order.items.length} mặt hàng</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-slate-500">Tổng SL</span>
                                        <span className="font-bold">
                                            {order.items.reduce((s, i) => s + i.quantity, 0)}
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-slate-500">Thanh toán</span>
                                        <span className="font-bold">Công nợ B2B</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-slate-500">Vận chuyển</span>
                                        <span className="font-bold">
                                            {order.shippingFee > 0 ? formatCurrency(order.shippingFee) : 'Miễn phí'}
                                        </span>
                                    </div>
                                    {order.discountTotal > 0 && (
                                        <div className="flex justify-between">
                                            <span className="text-emerald-500">Chiết khấu</span>
                                            <span className="font-bold text-emerald-600">
                                                {formatCurrency(order.discountTotal)}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* NEW ORDER CTA */}
                            <button
                                onClick={onClose}
                                className="w-full py-5 bg-emerald-600 text-white rounded-2xl font-black text-base shadow-xl shadow-emerald-200 hover:bg-emerald-700 transition-all active:scale-[0.98] flex items-center justify-center gap-3"
                            >
                                <Plus className="w-6 h-6" /> ĐẶT ĐƠN MỚI
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
