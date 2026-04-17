'use client'

import React from 'react'
import { X, Package, ShoppingCart, Download, Sparkles } from 'lucide-react'
import { EstimatorResult, formatCurrency } from '../types'

interface DetailedEstimateModalProps {
    result: EstimatorResult
    onClose: () => void
    onAddToCart: () => void
}

const categoryColors: Record<string, string> = {
    'xi_mang': 'bg-slate-100 text-slate-600',
    'sat_thep': 'bg-orange-50 text-orange-600',
    'gach': 'bg-red-50 text-red-600',
    'cat': 'bg-yellow-50 text-yellow-700',
    'son': 'bg-green-50 text-green-600',
}

export default function DetailedEstimateModal({ result, onClose, onAddToCart }: DetailedEstimateModalProps) {
    const totalLinked = result.materials.filter(m => m.productId).length

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-md p-4 md:p-10 animate-in fade-in duration-300">
            <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden border border-slate-100 animate-in zoom-in-95 duration-500 flex flex-col">
                {/* Header */}
                <div className="bg-gradient-to-r from-indigo-600 to-blue-600 p-8 text-white flex justify-between items-center relative overflow-hidden flex-shrink-0">
                    <div className="absolute -right-16 -top-16 w-64 h-64 bg-white/5 rounded-full" />
                    <div className="absolute right-10 bottom-0 w-32 h-32 bg-white/5 rounded-full" />
                    <div className="relative z-10 flex gap-4 items-center">
                        <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm border border-white/20">
                            <Package className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-black tracking-tight">Bảng Khối Lượng Chi Tiết</h2>
                            <p className="text-white/60 text-[10px] font-black uppercase tracking-[0.3em] mt-0.5">
                                AI-Generated · {result.materials.length} hạng mục · {totalLinked} sản phẩm liên kết
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center transition-colors relative z-10 border border-white/20"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto">
                    <div className="grid grid-cols-1 lg:grid-cols-12 min-h-full">
                        {/* Sidebar */}
                        <div className="lg:col-span-4 p-6 border-b lg:border-b-0 lg:border-r border-slate-100 space-y-4 bg-slate-50/50">
                            {/* Summary Card */}
                            <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm space-y-3">
                                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Tổng quan dự án</h3>
                                <div className="space-y-2.5">
                                    <div className="flex justify-between items-center">
                                        <span className="text-xs text-slate-500">Diện tích sàn</span>
                                        <span className="font-black text-slate-900 text-sm">{result.totalArea.toFixed(1)} m²</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-xs text-slate-500">Số hạng mục</span>
                                        <span className="font-black text-slate-900 text-sm">{result.materials.length} loại</span>
                                    </div>
                                    <div className="h-px bg-slate-100" />
                                    <div className="flex justify-between items-center">
                                        <span className="text-xs text-slate-500 font-bold">Dự toán ngân sách</span>
                                        <span className="font-black text-indigo-600 text-base">{formatCurrency(result.totalEstimatedCost)}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Tip Card */}
                            <div className="bg-gradient-to-br from-indigo-50 to-blue-50 rounded-2xl p-5 border border-indigo-100">
                                <div className="flex items-center gap-2 mb-2">
                                    <Sparkles className="w-4 h-4 text-indigo-500" />
                                    <h3 className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">Lời khuyên chuyên gia</h3>
                                </div>
                                <p className="text-xs text-indigo-800/70 leading-relaxed italic">
                                    "Kết quả bóc tách dựa trên trung bình thị trường. Nên đặt dư ra khoảng 5–7% để trừ hao lãng phí trong thi công."
                                </p>
                            </div>

                            {/* Progress bar for linked products */}
                            <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm space-y-3">
                                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Sản phẩm liên kết</h3>
                                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full transition-all duration-700"
                                        style={{ width: `${(totalLinked / result.materials.length) * 100}%` }}
                                    />
                                </div>
                                <p className="text-xs text-slate-500">
                                    <span className="font-black text-emerald-600">{totalLinked}</span> / {result.materials.length} sản phẩm có thể thêm vào giỏ hàng
                                </p>
                            </div>
                        </div>

                        {/* Table */}
                        <div className="lg:col-span-8 overflow-auto">
                            <table className="w-full text-left border-collapse">
                                <thead className="sticky top-0 z-10">
                                    <tr className="bg-slate-50 border-b border-slate-100">
                                        <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Hạng mục</th>
                                        <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Khối lượng</th>
                                        <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Thành tiền</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {result.materials.map((m, i) => (
                                        <tr key={i} className="hover:bg-indigo-50/30 transition-colors group">
                                            <td className="px-6 py-4">
                                                <div className="flex items-start gap-3">
                                                    <div className="w-1.5 h-1.5 mt-1.5 rounded-full bg-indigo-400 flex-shrink-0 opacity-60 group-hover:opacity-100 transition-opacity"></div>
                                                    <div>
                                                        <div className="font-black text-slate-800 text-xs tracking-tight group-hover:text-indigo-700 transition-colors">{m.productName}</div>
                                                        {m.reason && (
                                                            <div className="text-[10px] text-slate-400 mt-0.5 line-clamp-1 italic">{m.reason}</div>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="font-black text-slate-900 text-sm">{m.quantity.toLocaleString('vi-VN')}</div>
                                                <div className="text-[10px] text-slate-400 font-bold uppercase">{m.unit}</div>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                {m.price ? (
                                                    <div className="font-black text-indigo-600 text-sm">{formatCurrency(m.price * m.quantity)}</div>
                                                ) : (
                                                    <div className="text-[10px] font-black text-slate-300 uppercase italic">Liên Hệ</div>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                                <tfoot>
                                    <tr className="bg-indigo-50/50 border-t-2 border-indigo-100">
                                        <td className="px-6 py-4 font-black text-slate-900 text-xs uppercase tracking-widest">Tổng cộng</td>
                                        <td></td>
                                        <td className="px-6 py-4 text-right font-black text-indigo-700 text-base">{formatCurrency(result.totalEstimatedCost)}</td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-slate-100 bg-white flex flex-col sm:flex-row justify-between items-center gap-4 flex-shrink-0">
                    <p className="text-slate-400 text-xs italic font-medium">
                        Báo giá mang tính tham khảo, chưa bao gồm phí vận chuyển và nhân công.
                    </p>
                    <div className="flex gap-3 w-full sm:w-auto">
                        <button
                            onClick={onAddToCart}
                            className="flex-1 sm:flex-none px-8 py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-lg shadow-emerald-100 flex items-center justify-center gap-2"
                        >
                            <ShoppingCart className="w-4 h-4" /> Thêm vào giỏ
                        </button>
                        <button
                            onClick={() => window.print()}
                            className="flex-1 sm:flex-none px-8 py-3.5 bg-white text-slate-700 border-2 border-slate-200 hover:border-slate-300 rounded-2xl font-black text-xs uppercase tracking-widest transition-all hover:bg-slate-50 flex items-center justify-center gap-2"
                        >
                            <Download className="w-4 h-4" /> Tải PDF
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}
