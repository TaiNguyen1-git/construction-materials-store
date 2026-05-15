'use client'

import React from 'react'
import Link from 'next/link'
import { TrendingUp, TrendingDown, ArrowRight, BarChart3, Activity } from 'lucide-react'

import Image from 'next/image'

export default function MarketHighlights() {
    const data = [
        { name: 'Thép Pomina', price: '17.200đ', change: '+2.4%', up: true, unit: 'kg' },
        { name: 'Xi măng Hà Tiên', price: '91.000đ', change: '+1.5%', up: true, unit: 'bao' },
        { name: 'Gạch tuynel', price: '1.400đ', change: '-0.8%', up: false, unit: 'viên' },
    ]

    return (
        <section className="py-24 relative overflow-hidden group">
            {/* Background Image with Overlay */}
            <div className="absolute inset-0 z-0">
                <Image 
                    src="/images/market_bg.png" 
                    alt="Market Background" 
                    fill 
                    className="object-cover transition-transform duration-1000 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-slate-900 via-slate-900/90 to-slate-900/40"></div>
                <div className="absolute inset-0 bg-blue-900/20 mix-blend-overlay"></div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                <div className="flex flex-col lg:flex-row justify-between items-end gap-10 mb-16">
                    <div className="space-y-4">
                        <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500/20 border border-blue-400/30 backdrop-blur-md rounded-full text-blue-300 text-[11px] font-black uppercase tracking-widest">
                            <Activity className="w-3 h-3" /> Xu hướng thị trường
                        </div>
                        <h2 className="text-4xl md:text-5xl font-black text-white tracking-tighter leading-tight">
                            Theo Dõi Biến Động <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-300 to-cyan-200">Giá Vật Tư</span> 24/7
                        </h2>
                        <p className="text-slate-300 text-lg leading-relaxed max-w-xl opacity-90">
                            Cập nhật liên tục dữ liệu giá từ các nhà cung cấp lớn, giúp bạn tối ưu hóa thời điểm nhập hàng và quản lý ngân sách dự án.
                        </p>
                    </div>
                    
                    <Link 
                        href="/market" 
                        className="group flex items-center gap-3 px-8 py-4 bg-white text-slate-900 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-blue-50 transition-all shadow-2xl"
                    >
                        Xem chi tiết thị trường <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </Link>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {data.map((item, idx) => (
                        <div 
                            key={idx}
                            className="bg-white/10 backdrop-blur-xl p-8 rounded-[2.5rem] border border-white/10 hover:border-blue-400/50 hover:bg-white/20 transition-all duration-500 group shadow-2xl"
                        >
                            <div className="flex justify-between items-start mb-8">
                                <div className={`w-14 h-14 rounded-2xl ${item.up ? 'bg-emerald-500/20' : 'bg-rose-500/20'} flex items-center justify-center group-hover:scale-110 transition-transform border ${item.up ? 'border-emerald-500/30' : 'border-rose-500/30'}`}>
                                    {item.up ? (
                                        <TrendingUp className="w-7 h-7 text-emerald-400" />
                                    ) : (
                                        <TrendingDown className="w-7 h-7 text-rose-400" />
                                    )}
                                </div>
                                <div className={`px-4 py-1.5 rounded-full text-[11px] font-black tracking-widest uppercase ${item.up ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'}`}>
                                    {item.change}
                                </div>
                            </div>
                            
                            <div className="space-y-1">
                                <p className="text-[11px] font-black text-blue-200 uppercase tracking-widest opacity-60">{item.name}</p>
                                <div className="flex items-baseline gap-2">
                                    <h4 className="text-4xl font-black text-white tracking-tighter">{item.price}</h4>
                                    <span className="text-xs font-black text-blue-200 uppercase tracking-widest opacity-60">/{item.unit}</span>
                                </div>
                            </div>

                            <div className="mt-8 pt-8 border-t border-white/10 flex items-center justify-between text-[11px] font-black uppercase tracking-widest text-slate-400">
                                <span>Cập nhật: Hôm nay</span>
                                <BarChart3 className="w-4 h-4 opacity-40" />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    )
}
