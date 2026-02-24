'use client'

import React from 'react'
import { Sparkles, Ruler, Package, ArrowRight, FolderPlus, ShoppingCart, CheckCircle } from 'lucide-react'
import { EstimatorResult, formatCurrency, PROJECT_TYPES } from '../types'

interface ResultDisplayProps {
    result: EstimatorResult
    projectType: string
    isAuthenticated: boolean
    addingToCart: boolean
    onShowDetailedModal: () => void
    onShowProjectModal: () => void
    onShowLoginModal: () => void
    onAddAllToCart: () => void
}

export default function ResultDisplay({
    result, projectType,
    isAuthenticated, addingToCart,
    onShowDetailedModal, onShowProjectModal, onShowLoginModal,
    onAddAllToCart
}: ResultDisplayProps) {
    return (
        <div className="mb-12 space-y-8 animate-in slide-in-from-top-4 duration-700">
            {/* Summary Header */}
            <div className="flex flex-col md:flex-row gap-6 items-start justify-between">
                <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-emerald-100 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-100/50">
                        <CheckCircle className="w-7 h-7 text-emerald-600" />
                    </div>
                    <div>
                        <p className="text-[10px] text-emerald-600 font-black uppercase tracking-[0.3em] mb-1">Kết quả phân tích</p>
                        <h2 className="text-3xl font-black text-slate-900 tracking-tighter">DỰ TOÁN ĐÃ SẴN SÀNG</h2>
                    </div>
                </div>
            </div>

            {/* CTA: View Details Modal - Elite Redesign */}
            <div className="bg-white rounded-[3rem] p-8 md:p-12 border border-slate-100 shadow-[0_40px_100px_-20px_rgba(0,0,0,0.05)] relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-50/50 rounded-full blur-3xl -mr-48 -mt-48 group-hover:bg-indigo-100/50 transition-colors duration-1000"></div>
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-50/30 rounded-full blur-3xl -ml-32 -mb-32"></div>

                <div className="relative z-10 grid lg:grid-cols-12 gap-12 items-center">
                    {/* Left Side: Information */}
                    <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
                        <div className="inline-flex items-center gap-2.5 bg-indigo-50 px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest text-indigo-600 border border-indigo-100/50">
                            <Sparkles className="w-3.5 h-3.5" /> Phân tích AI hoàn tất
                        </div>
                        <h3 className="text-4xl md:text-5xl font-black leading-[1.4] tracking-tighter text-slate-900">
                            Bảng Phân Tích <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-blue-600 italic py-2 pr-6 inline-block">Khối Lượng Chi Tiết</span>
                        </h3>
                        <p className="text-slate-500 text-lg max-w-md leading-relaxed font-medium">
                            Hệ thống đã đề xuất <span className="text-indigo-600 font-bold">{result.materials.length} loại vật tư</span> tối ưu cho dự án của bạn.
                            Tất cả số liệu đã sẵn sàng để quý khách kiểm tra.
                        </p>

                        {/* Quick Stats Inline */}
                        <div className="flex flex-wrap justify-center lg:justify-start gap-4 pt-4">
                            <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 rounded-xl border border-slate-100">
                                <Ruler className="w-4 h-4 text-slate-400" />
                                <span className="text-xs font-bold text-slate-600">{result.totalArea.toFixed(1)} m² Sàn</span>
                            </div>
                            <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 rounded-xl border border-slate-100">
                                <Package className="w-4 h-4 text-slate-400" />
                                <span className="text-xs font-bold text-slate-600">{result.materials.length} Vật tư</span>
                            </div>
                        </div>
                    </div>

                    {/* Right Side: Actions */}
                    <div className="lg:col-span-5 flex flex-col gap-5 w-full">
                        <button
                            onClick={onShowDetailedModal}
                            className="w-full px-12 py-7 bg-white text-indigo-600 border-2 border-indigo-600/20 hover:border-indigo-600 rounded-[2.5rem] font-black text-sm uppercase tracking-[0.2em] transition-all shadow-[0_20px_50px_-15px_rgba(79,70,229,0.15)] hover:shadow-indigo-200/50 flex items-center justify-center gap-4 group/btn active:scale-95"
                        >
                            XEM CHI TIẾT DỰ TOÁN
                            <div className="w-8 h-8 bg-indigo-50 rounded-full flex items-center justify-center group-hover/btn:translate-x-1 group-hover/btn:bg-indigo-600 group-hover/btn:text-white transition-all">
                                <ArrowRight className="w-4 h-4" />
                            </div>
                        </button>

                        <div className="grid grid-cols-2 gap-4">
                            {isAuthenticated ? (
                                <button
                                    onClick={onShowProjectModal}
                                    className="px-6 py-4 bg-slate-50 hover:bg-white border border-slate-100 hover:border-indigo-200 rounded-3xl text-[10px] font-black uppercase tracking-widest text-slate-600 hover:text-indigo-600 transition-all flex flex-col items-center justify-center gap-2 shadow-sm"
                                >
                                    <FolderPlus className="w-6 h-6 mb-1 opacity-70" /> LƯU DỰ ÁN
                                </button>
                            ) : (
                                <button
                                    onClick={onShowLoginModal}
                                    className="px-6 py-4 bg-indigo-50/50 hover:bg-white border border-indigo-100 hover:border-indigo-400 rounded-3xl text-[10px] font-black uppercase tracking-widest text-indigo-600 transition-all flex flex-col items-center justify-center gap-2 shadow-sm"
                                >
                                    <Sparkles className="w-6 h-6 mb-1" /> MỞ KHÓA DỰ ÁN
                                </button>
                            )}
                            <button
                                onClick={onAddAllToCart}
                                disabled={addingToCart || !result.materials.some(m => m.productId)}
                                className="px-6 py-4 bg-emerald-50/50 hover:bg-white border border-emerald-100 hover:border-emerald-400 rounded-3xl text-[10px] font-black uppercase tracking-widest text-emerald-600 transition-all flex flex-col items-center justify-center gap-2 shadow-sm disabled:opacity-30"
                            >
                                <ShoppingCart className="w-6 h-6 mb-1" /> GIỎ HÀNG
                            </button>
                        </div>
                    </div>
                </div>

                {/* Decoration */}
                <div className="absolute left-1/2 bottom-0 -translate-x-1/2 w-1/3 h-1 bg-gradient-to-r from-transparent via-indigo-600/30 to-transparent"></div>
            </div>

            {/* Results Sidebar Details */}
            <div className="animate-in slide-in-from-right-4 duration-500 space-y-4">
                <div className="bg-white rounded-[2rem] shadow-xl border border-slate-50 p-8">
                    <div className="flex items-center justify-between mb-8">
                        <div className="flex items-center gap-3">
                            <div className="w-3 h-8 bg-indigo-600 rounded-full"></div>
                            <h2 className="text-xl font-black text-slate-900 tracking-tight uppercase tracking-tight">Cơ sở bốc tách</h2>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-8">
                        <div className="bg-indigo-50/50 p-6 rounded-3xl border border-indigo-100 shadow-sm group">
                            <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest mb-2 group-hover:translate-x-1 transition-transform">Diện tích sàn xây dựng</p>
                            <div className="flex items-baseline gap-2">
                                <span className="text-3xl font-black text-indigo-950">{(result.totalArea || 0).toFixed(1)}</span>
                                <span className="text-sm font-black text-indigo-400 uppercase">m² sàn</span>
                            </div>
                        </div>
                        <div className="bg-emerald-50/50 p-6 rounded-3xl border border-emerald-100 shadow-sm group">
                            <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-2 group-hover:translate-x-1 transition-transform">Ngân sách dự kiến</p>
                            <div className="flex items-baseline gap-2">
                                <span className="text-3xl font-black text-emerald-950">
                                    {result.totalEstimatedCost > 0
                                        ? formatCurrency(result.totalEstimatedCost).replace(/₫/g, '')
                                        : '...'}
                                </span>
                                <span className="text-sm font-black text-emerald-400 uppercase">VND</span>
                            </div>
                        </div>
                    </div>

                    {result.rooms.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 border-t border-gray-50 pt-3">
                            {result.rooms.map((room, i) => (
                                <span key={i} className="px-2 py-1 bg-gray-50 rounded text-[10px] text-gray-500 font-bold border border-gray-100">
                                    tầng {room.name?.toUpperCase().includes('TẦNG') ? '' : ''}{room.name?.toUpperCase()} ({room.area ? room.area.toFixed(0) : '?'}M²)
                                </span>
                            ))}
                        </div>
                    )}

                    {/* Feng Shui Advice Display */}
                    {result.fengShuiAdvice && (
                        <div className="mt-4 pt-4 border-t border-gray-100">
                            <div className="flex items-start gap-3 bg-gradient-to-br from-amber-50 to-orange-50 p-4 rounded-xl border border-amber-100">
                                <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                    <Sparkles className="w-5 h-5 text-amber-600" />
                                </div>
                                <div className="prose prose-sm prose-amber max-w-none">
                                    <p className="text-xs text-amber-900 leading-relaxed italic">
                                        {result.fengShuiAdvice}
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
