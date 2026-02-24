'use client'

import React from 'react'
import { X, Package, ShoppingCart, Upload } from 'lucide-react'
import { EstimatorResult, formatCurrency } from '../types'

interface DetailedEstimateModalProps {
    result: EstimatorResult
    onClose: () => void
    onAddToCart: () => void
}

export default function DetailedEstimateModal({ result, onClose, onAddToCart }: DetailedEstimateModalProps) {
    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-4 md:p-10 animate-in fade-in duration-300">
            <div className="bg-white rounded-[3rem] shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden border border-slate-100 animate-in zoom-in-95 duration-500 flex flex-col">
                <div className="bg-gradient-to-br from-slate-900 to-indigo-950 p-8 text-white flex justify-between items-center relative overflow-hidden flex-shrink-0">
                    <div className="absolute -right-20 -top-20 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl"></div>
                    <div className="relative z-10 flex gap-4 items-center">
                        <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center backdrop-blur-md">
                            <Package className="w-6 h-6 text-indigo-300" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-black uppercase italic tracking-tighter">Bảng Khối Lượng Chi Tiết</h2>
                            <p className="text-white/40 text-[10px] font-black uppercase tracking-[0.3em]">AI-Generated Material Breakdown #EST-{(result as any).id || 'PRO'}</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-12 h-12 bg-white/5 hover:bg-white/10 rounded-full flex items-center justify-center transition-colors group relative z-10"
                    >
                        <X className="w-6 h-6 group-hover:scale-110 transition-transform" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                        {/* Left Side: Summary info */}
                        <div className="lg:col-span-4 space-y-6">
                            <div className="bg-slate-50 rounded-[2rem] p-6 border border-slate-100">
                                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Thông tin dự án</h3>
                                <div className="space-y-3">
                                    <div className="flex justify-between items-center text-xs">
                                        <span className="text-slate-500">Diện tích sàn:</span>
                                        <span className="font-bold text-slate-900">{result.totalArea.toFixed(1)} m²</span>
                                    </div>
                                    <div className="flex justify-between items-center text-xs">
                                        <span className="text-slate-500">Dự toán ngân sách:</span>
                                        <span className="font-black text-indigo-600">{formatCurrency(result.totalEstimatedCost)}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-xs">
                                        <span className="text-slate-500">Số loại vật phẩm:</span>
                                        <span className="font-bold text-slate-900">{result.materials.length} mục</span>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-indigo-50/30 rounded-[2rem] p-6 border border-indigo-100">
                                <h3 className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-4">Mẹo chuyên gia</h3>
                                <p className="text-xs text-indigo-900/70 leading-relaxed italic">
                                    "Kết quả bóc tách dựa trên trung bình thị trường. Bạn nên đặt dư ra khoảng 5-7% so với con số này để trừ hao lãng phí trong quá trình thi công."
                                </p>
                            </div>
                        </div>

                        {/* Right Side: Table */}
                        <div className="lg:col-span-8">
                            <div className="rounded-[1.5rem] border border-slate-100 overflow-hidden shadow-sm bg-white">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-slate-50/80">
                                            <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Hạng mục</th>
                                            <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Khối lượng</th>
                                            <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Thành tiền</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50">
                                        {result.materials.map((m, i) => (
                                            <tr key={i} className="hover:bg-indigo-50/20 transition-colors group">
                                                <td className="px-6 py-5">
                                                    <div className="font-black text-slate-800 uppercase text-xs tracking-tight group-hover:text-indigo-600 transition-colors">{m.productName}</div>
                                                    <div className="text-[10px] text-slate-400 mt-1 line-clamp-1 italic">{m.reason}</div>
                                                </td>
                                                <td className="px-6 py-5 text-right">
                                                    <div className="font-black text-slate-900 text-sm">{m.quantity.toLocaleString('vi-VN')}</div>
                                                    <div className="text-[10px] text-slate-400 font-bold uppercase">{m.unit}</div>
                                                </td>
                                                <td className="px-6 py-5 text-right">
                                                    {m.price ? (
                                                        <div className="font-black text-indigo-600 text-sm">{formatCurrency(m.price * m.quantity)}</div>
                                                    ) : (
                                                        <div className="text-[10px] font-black text-slate-300 uppercase italic">Liên Hệ</div>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="p-8 border-t border-slate-50 bg-slate-50/50 flex flex-col sm:flex-row justify-between items-center gap-6 flex-shrink-0">
                    <div className="text-slate-400 text-xs italic font-medium">Báo giá mang tính chất tham khảo, chưa bao gồm phí vận chuyển và nhân công.</div>
                    <div className="flex gap-4 w-full sm:w-auto">
                        <button
                            onClick={onAddToCart}
                            className="flex-1 sm:flex-none px-8 py-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-xl shadow-emerald-100 flex items-center justify-center gap-3"
                        >
                            <ShoppingCart className="w-5 h-5" /> THÊM TẤT CẢ VÀO GIỎ
                        </button>
                        <button
                            onClick={() => window.print()}
                            className="flex-1 sm:flex-none px-8 py-4 bg-white text-slate-900 border border-slate-200 rounded-2xl font-black text-xs uppercase tracking-widest transition-all hover:bg-slate-50 flex items-center justify-center gap-3"
                        >
                            <Upload className="w-5 h-5 rotate-180" /> TẢI PDF
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}
