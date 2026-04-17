'use client'

import React from 'react'
import { Sparkles, Ruler, Package, ArrowRight, FolderPlus, ShoppingCart, CheckCircle, TrendingUp, BarChart3 } from 'lucide-react'
import { EstimatorResult, formatCurrency, PROJECT_TYPES } from '../types'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'

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

const CHART_COLORS = ['#4f46e5', '#2563eb', '#0ea5e9', '#06b6d4', '#10b981', '#8b5cf6', '#f59e0b', '#ef4444']

export default function ResultDisplay({
    result, projectType,
    isAuthenticated, addingToCart,
    onShowDetailedModal, onShowProjectModal, onShowLoginModal,
    onAddAllToCart
}: ResultDisplayProps) {

    // Build chart data from top materials
    const chartData = result.materials
        .filter(m => m.price && m.price > 0)
        .slice(0, 7)
        .map(m => ({
            name: m.productName,
            value: Math.round(m.price! * m.quantity),
        }))

    const totalCost = result.totalEstimatedCost

    return (
        <div className="mb-12 space-y-6 animate-in slide-in-from-top-4 duration-700">
            {/* Success Banner */}
            <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-3xl px-8 py-5 flex items-center gap-4 shadow-sm">
                <div className="w-10 h-10 bg-emerald-500 rounded-2xl flex items-center justify-center shadow-md flex-shrink-0">
                    <CheckCircle className="w-5 h-5 text-white" />
                </div>
                <div>
                    <p className="text-[10px] text-emerald-600 font-black uppercase tracking-[0.25em]">Phân tích hoàn tất</p>
                    <h2 className="text-xl font-black text-slate-900 tracking-tight">Dự toán đã sẵn sàng</h2>
                </div>
            </div>

            {/* Bento Grid: Stats + Chart */}
            <div className="grid grid-cols-12 gap-4">
                {/* Total Area */}
                <div className="col-span-6 md:col-span-4 bg-white rounded-3xl border border-slate-100 p-6 shadow-sm hover:shadow-md transition-shadow group">
                    <div className="flex items-center justify-between mb-3">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Diện tích sàn</p>
                        <Ruler className="w-4 h-4 text-slate-300 group-hover:text-indigo-400 transition-colors" />
                    </div>
                    <div className="flex items-baseline gap-1.5">
                        <span className="text-4xl font-black text-slate-900 tracking-tight">{(result.totalArea || 0).toFixed(1)}</span>
                        <span className="text-sm font-black text-slate-400 uppercase">m²</span>
                    </div>
                </div>

                {/* Total Cost */}
                <div className="col-span-6 md:col-span-4 bg-gradient-to-br from-indigo-600 to-blue-600 rounded-3xl p-6 shadow-xl shadow-indigo-100 group relative overflow-hidden">
                    <div className="absolute -right-6 -top-6 w-24 h-24 bg-white/10 rounded-full"></div>
                    <div className="relative z-10">
                        <p className="text-[10px] font-black text-white/60 uppercase tracking-widest mb-3">Ngân sách dự kiến</p>
                        <div className="flex items-baseline gap-1.5">
                            <span className="text-3xl font-black text-white tracking-tight leading-none">
                                {totalCost > 0 ? formatCurrency(totalCost).replace(/\s*₫/, '') : '...'}
                            </span>
                        </div>
                        <span className="text-xs text-white/50 font-bold">VNĐ</span>
                    </div>
                </div>

                {/* Materials Count */}
                <div className="col-span-12 md:col-span-4 bg-white rounded-3xl border border-slate-100 p-6 shadow-sm hover:shadow-md transition-shadow group">
                    <div className="flex items-center justify-between mb-3">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Vật tư đề xuất</p>
                        <Package className="w-4 h-4 text-slate-300 group-hover:text-indigo-400 transition-colors" />
                    </div>
                    <div className="flex items-baseline gap-1.5">
                        <span className="text-4xl font-black text-slate-900 tracking-tight">{result.materials.length}</span>
                        <span className="text-sm font-black text-slate-400">loại</span>
                    </div>
                    <p className="text-[10px] text-slate-400 mt-2">{result.rooms.length} phòng · {projectType}</p>
                </div>

                {/* Cost Breakdown Chart */}
                {chartData.length > 0 && (
                    <div className="col-span-12 md:col-span-7 bg-white rounded-3xl border border-slate-100 p-6 shadow-sm">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-1 h-6 bg-indigo-500 rounded-full"></div>
                            <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight">Cơ cấu chi phí vật tư</h3>
                        </div>
                        <div className="flex gap-6 items-center">
                            <ResponsiveContainer width={160} height={160}>
                                <PieChart>
                                    <Pie
                                        data={chartData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={45}
                                        outerRadius={75}
                                        paddingAngle={3}
                                        dataKey="value"
                                    >
                                        {chartData.map((_, index) => (
                                            <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        formatter={(val: number) => [formatCurrency(val), '']}
                                        contentStyle={{ borderRadius: '12px', border: '1px solid #f1f5f9', fontSize: '11px', fontWeight: '700' }}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                            <div className="flex-1 space-y-2 overflow-hidden">
                                {chartData.slice(0, 5).map((item, i) => (
                                    <div key={i} className="flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }} />
                                        <p className="text-[10px] font-bold text-slate-600 truncate flex-1">{item.name}</p>
                                        <p className="text-[10px] font-black text-slate-500 flex-shrink-0">
                                            {totalCost > 0 ? ((item.value / totalCost) * 100).toFixed(1) : 0}%
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* Quick rooms list */}
                {result.rooms.length > 0 && (
                    <div className="col-span-12 md:col-span-5 bg-white rounded-3xl border border-slate-100 p-6 shadow-sm">
                        <div className="flex items-center gap-3 mb-5">
                            <div className="w-1 h-6 bg-emerald-500 rounded-full"></div>
                            <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight">Các phòng đã phân tích</h3>
                        </div>
                        <div className="space-y-2 max-h-36 overflow-y-auto">
                            {result.rooms.map((room, i) => (
                                <div key={i} className="flex items-center justify-between px-4 py-2.5 bg-slate-50 rounded-xl hover:bg-indigo-50/50 transition-colors">
                                    <span className="text-xs font-bold text-slate-700">{room.name}</span>
                                    <span className="text-[10px] font-black text-indigo-500 bg-indigo-50 px-2.5 py-1 rounded-full">
                                        {room.area ? room.area.toFixed(0) : '?'} m²
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* CTA Actions Panel */}
            <div className="bg-white rounded-3xl border border-slate-100 p-8 shadow-sm">
                <div className="flex flex-col md:flex-row gap-8 items-center justify-between">
                    <div className="space-y-2 text-center md:text-left">
                        <div className="inline-flex items-center gap-2 bg-indigo-50 px-3 py-1.5 rounded-xl text-[10px] font-black text-indigo-600 uppercase tracking-widest">
                            <Sparkles className="w-3.5 h-3.5" /> AI Hoàn tất
                        </div>
                        <h3 className="text-2xl font-black text-slate-900 tracking-tight">
                            Bảng khối lượng chi tiết đã sẵn sàng
                        </h3>
                        <p className="text-sm text-slate-500 font-medium">
                            <span className="text-indigo-600 font-bold">{result.materials.length} loại vật tư</span> đã được đề xuất và định giá
                        </p>
                    </div>

                    <div className="flex flex-col gap-3 w-full md:w-auto md:min-w-[280px]">
                        <button
                            onClick={onShowDetailedModal}
                            className="w-full px-8 py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-xl shadow-indigo-100 flex items-center justify-center gap-3 active:scale-[0.98]"
                        >
                            Xem chi tiết dự toán
                            <ArrowRight className="w-4 h-4" />
                        </button>

                        <div className="grid grid-cols-2 gap-3">
                            {isAuthenticated ? (
                                <button
                                    onClick={onShowProjectModal}
                                    className="flex items-center justify-center gap-2 px-5 py-3.5 bg-slate-50 hover:bg-white border-2 border-slate-100 hover:border-indigo-200 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-600 hover:text-indigo-600 transition-all shadow-sm flex-col"
                                >
                                    <FolderPlus className="w-5 h-5" />
                                    Lưu dự án
                                </button>
                            ) : (
                                <button
                                    onClick={onShowLoginModal}
                                    className="flex items-center justify-center gap-2 px-5 py-3.5 bg-indigo-50 hover:bg-white border-2 border-indigo-100 hover:border-indigo-400 rounded-2xl text-[10px] font-black uppercase tracking-widest text-indigo-600 transition-all shadow-sm flex-col"
                                >
                                    <Sparkles className="w-5 h-5" />
                                    Mở khóa
                                </button>
                            )}
                            <button
                                onClick={onAddAllToCart}
                                disabled={addingToCart || !result.materials.some(m => m.productId)}
                                className="flex items-center justify-center gap-2 px-5 py-3.5 bg-emerald-50 hover:bg-white border-2 border-emerald-100 hover:border-emerald-400 rounded-2xl text-[10px] font-black uppercase tracking-widest text-emerald-600 transition-all shadow-sm disabled:opacity-30 flex-col"
                            >
                                <ShoppingCart className="w-5 h-5" />
                                Giỏ hàng
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
