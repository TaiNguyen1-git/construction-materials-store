'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import Header from '@/components/Header'
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area,
    BarChart, Bar, Legend
} from 'recharts'
import {
    TrendingUp, TrendingDown, Info, Calendar, Download, Filter,
    ArrowUpRight, ArrowDownRight, Activity, Newspaper
} from 'lucide-react'

const marketData = [
    { month: 'Jan', steel: 15200, cement: 85000, brick: 1200 },
    { month: 'Feb', steel: 15800, cement: 84000, brick: 1250 },
    { month: 'Mar', steel: 16100, cement: 86000, brick: 1300 },
    { month: 'Apr', steel: 15900, cement: 87500, brick: 1280 },
    { month: 'May', steel: 16500, cement: 89000, brick: 1350 },
    { month: 'Jun', steel: 17200, cement: 91000, brick: 1400 },
    { month: 'Jul', steel: 16800, cement: 90000, brick: 1380 },
]

const newsItems = [
    {
        title: 'Giá thép xây dựng trong nước tăng mạnh cuối quý 2',
        date: '05/01/2026',
        summary: 'Sự phục hồi của thị trường bất động sản kéo quy mô tiêu thụ thép tăng đáng kể, đẩy giá thép cây lên mức cao nhất trong 6 tháng qua.',
        source: 'Báo Xây Dựng'
    },
    {
        title: 'Nguồn cung xi măng ổn định, giá dự kiến đi ngang',
        date: '03/01/2026',
        summary: 'Các nhà máy sản xuất lớn cam kết không tăng giá trong tháng 1 nhằm hỗ trợ các dự án hạ tầng trọng điểm đang trong giai đoạn nước rút.',
        source: 'Thị Trường VLXD'
    },
    {
        title: 'Xu hướng sử dụng gạch không nung tăng 25%',
        date: '01/01/2026',
        summary: 'Các quy định mới về bảo vệ môi trường đang thúc đẩy các chủ thầu chuyển dịch sang vật liệu xanh bền vững.',
        source: 'SmartBuild News'
    }
]

export default function MarketPage() {
    const [activeTab, setActiveTab] = useState('steel')

    return (
        <div className="min-h-screen bg-[#f8fafc] font-sans selection:bg-blue-100 selection:text-blue-900">
            <Header />

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                {/* Premium Breadcrumbs */}
                <nav className="flex items-center gap-3 mb-12 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 border-b border-slate-100 pb-6">
                    <Link href="/" className="hover:text-blue-600 transition-colors">TRANG CHỦ</Link>
                    <div className="w-1 h-1 rounded-full bg-slate-300"></div>
                    <span className="text-blue-600">THỊ TRƯỜNG</span>
                </nav>

                {/* Hero Section - Premium Financial Header */}
                <div className="bg-[#0c0f17] rounded-[32px] shadow-2xl p-10 mb-10 border border-white/5 relative overflow-hidden group">
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 to-transparent"></div>
                    <div className="absolute -right-20 -top-20 w-64 h-64 bg-blue-500/10 blur-[100px] pointer-events-none group-hover:bg-blue-500/20 transition-all duration-1000"></div>

                    <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-8">
                        <div>
                            <div className="flex items-center gap-2 px-3 py-1 bg-blue-500/10 text-blue-400 rounded-full border border-blue-500/20 w-fit mb-4">
                                <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></span>
                                <span className="text-[9px] font-black uppercase tracking-widest leading-none">Real-time Data Stream</span>
                            </div>
                            <h1 className="text-4xl font-black text-white tracking-tighter uppercase leading-none mb-4 italic">
                                THỊ TRƯỜNG <span className="text-blue-500">QUANTUM</span>
                            </h1>
                            <p className="text-slate-400 text-xs max-w-lg font-medium leading-relaxed uppercase tracking-wide">
                                Hệ thống dự báo biến động giá vật liệu xây dựng 24/7. Cập nhật trực tiếp từ mạng lưới cung ứng toàn cầu.
                            </p>
                        </div>
                        <div className="flex gap-4">
                            <button className="flex items-center gap-2 bg-white/5 text-white border border-white/10 hover:bg-white/10 px-6 py-3 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all backdrop-blur-md">
                                <Download className="w-4 h-4" /> Xuất báo cáo PDF
                            </button>
                            <button className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-2xl text-[11px] font-black uppercase tracking-widest hover:bg-blue-700 shadow-2xl shadow-blue-500/30 transition-all active:scale-95">
                                <Activity className="w-4 h-4" /> Dự báo quý 1/2026
                            </button>
                        </div>
                    </div>
                </div>

                {/* Market Snippets - Bento Style Ticker */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                    {[
                        { label: 'Thép Pomina (kg)', price: '17.200đ', change: '2.4%', up: true, icon: TrendingUp, color: 'text-emerald-500', bg: 'bg-emerald-50' },
                        { label: 'Xi măng Hà Tiên (bao)', price: '91.000đ', change: '1.5%', up: true, icon: TrendingUp, color: 'text-emerald-500', bg: 'bg-emerald-50' },
                        { label: 'Gạch tuynel (viên)', price: '1.400đ', change: '0.8%', up: false, icon: TrendingDown, color: 'text-rose-500', bg: 'bg-rose-50' },
                    ].map((item, i) => (
                        <div key={i} className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-[0_15px_40px_rgba(0,0,0,0.02)] hover:border-blue-300 hover:shadow-2xl hover:shadow-blue-500/10 transition-all duration-300 flex items-center justify-between group">
                            <div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">{item.label}</p>
                                <div className="flex items-baseline gap-2">
                                    <h4 className="text-3xl font-black text-slate-900 leading-none tracking-tighter">{item.price}</h4>
                                    <span className="text-xs font-black text-slate-300">VND</span>
                                </div>
                                <div className={`flex items-center gap-1.5 mt-4 p-1 px-3 rounded-full inline-flex ${item.bg}`}>
                                    <item.icon className={`w-3 h-3 ${item.color}`} />
                                    <span className={`text-[10px] font-black ${item.color}`}>
                                        {item.up ? '+' : '-'}{item.change}
                                    </span>
                                </div>
                            </div>
                            <div className={`${item.bg} w-16 h-16 rounded-[24px] flex items-center justify-center group-hover:rotate-6 transition-transform group-hover:scale-110`}>
                                <item.icon className={`w-8 h-8 ${item.color}`} />
                            </div>
                        </div>
                    ))}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Chart Section */}
                    <div className="lg:col-span-2 space-y-8">
                        <div className="bg-white p-10 rounded-[40px] shadow-[0_30px_60px_rgba(0,0,0,0.04)] border border-slate-100 overflow-hidden relative">
                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-10 gap-6">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center">
                                        <Activity className="w-6 h-6 text-blue-600" />
                                    </div>
                                    <div>
                                        <h3 className="text-2xl font-black text-slate-900 tracking-tighter uppercase leading-none mb-1">Xu hướng giá</h3>
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Thời hạn 7 tháng gần nhất</p>
                                    </div>
                                </div>
                                <div className="flex bg-slate-50 p-1.5 rounded-2xl border border-slate-100">
                                    {['steel', 'cement', 'brick'].map((tab) => (
                                        <button
                                            key={tab}
                                            onClick={() => setActiveTab(tab)}
                                            className={`px-6 py-2.5 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${activeTab === tab ? 'bg-white text-blue-600 shadow-lg border border-slate-100' : 'text-slate-400 hover:text-slate-600'}`}
                                        >
                                            {tab === 'steel' ? 'Thép' : tab === 'cement' ? 'Xi măng' : 'Gạch'}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="h-[400px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={marketData}>
                                        <defs>
                                            <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#2563eb" stopOpacity={0.2} />
                                                <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="5 5" vertical={false} stroke="#f1f5f9" />
                                        <XAxis
                                            dataKey="month"
                                            axisLine={false}
                                            tickLine={false}
                                            tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 800 }}
                                            dy={20}
                                        />
                                        <YAxis
                                            axisLine={false}
                                            tickLine={false}
                                            tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 800 }}
                                            tickFormatter={(val) => `${(val / 1000).toFixed(0)}k`}
                                        />
                                        <Tooltip
                                            content={({ active, payload, label }) => {
                                                if (active && payload && payload.length) {
                                                    return (
                                                        <div className="bg-[#0c0f17] p-4 rounded-[20px] shadow-2xl border border-white/10 text-white animate-in zoom-in-95">
                                                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">{label}</p>
                                                            <p className="text-xl font-black text-blue-400">{payload[0].value.toLocaleString('vi-VN')}đ</p>
                                                        </div>
                                                    );
                                                }
                                                return null;
                                            }}
                                        />
                                        <Area
                                            type="monotone"
                                            dataKey={activeTab}
                                            stroke="#2563eb"
                                            strokeWidth={6}
                                            fillOpacity={1}
                                            fill="url(#colorPrice)"
                                            animationDuration={2000}
                                        />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>

                            <div className="mt-12 p-8 bg-blue-50/50 rounded-[32px] border border-blue-100 flex items-start gap-6 relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-4 opacity-5">
                                    <TrendingUp className="w-16 h-16 text-blue-600" />
                                </div>
                                <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center border border-blue-100 shadow-lg shrink-0">
                                    <Activity className="w-7 h-7 text-blue-600" />
                                </div>
                                <div className="relative z-10">
                                    <h5 className="font-black text-blue-900 text-xs uppercase tracking-widest mb-2 flex items-center gap-2">
                                        <Info className="w-3 h-3" /> Phân tích thị trường kĩ thuật
                                    </h5>
                                    <p className="text-blue-800/80 text-sm leading-relaxed font-medium">
                                        Dựa trên dữ liệu chuỗi thời gian, giá <span className="font-bold text-blue-600 underline underline-offset-4 uppercase">{activeTab === 'steel' ? 'Thép Pomina' : activeTab === 'cement' ? 'Xi măng Hà Tiên' : 'Gạch Tuynel'}</span> đang duy trì xu hướng <span className="text-emerald-600 font-bold italic">Tăng ổn định (MA20 Support)</span>. Khuyến nghị cho các chủ thầu: Chốt khối lượng ngay để hưởng chính sách giá tốt.
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Comparisons or other info */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="bg-white p-6 rounded-2xl shadow-xl border border-slate-100">
                                <h4 className="font-black text-slate-800 mb-6 flex items-center gap-2">
                                    <ArrowUpRight className="w-5 h-5 text-blue-600" /> Tăng giá lớn nhất
                                </h4>
                                <div className="space-y-4">
                                    {[
                                        { name: 'Sắt cây Hòa Phát 10mm', val: '+5.2%', trend: 'up' },
                                        { name: 'Sơn Dulux ngoại thất', val: '+4.8%', trend: 'up' },
                                        { name: 'Dây điện Cadivi', val: '+3.9%', trend: 'up' },
                                    ].map((item, i) => (
                                        <div key={i} className="flex justify-between items-center py-2 border-b border-slate-50 last:border-0">
                                            <span className="text-sm font-medium text-slate-600">{item.name}</span>
                                            <span className="text-sm font-black text-green-600">{item.val}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div className="bg-white p-6 rounded-2xl shadow-xl border border-slate-100">
                                <h4 className="font-black text-slate-800 mb-6 flex items-center gap-2">
                                    <ArrowDownRight className="w-5 h-5 text-red-600" /> Giảm giá nhiều nhất
                                </h4>
                                <div className="space-y-4">
                                    {[
                                        { name: 'Cát xây tô (m3)', val: '-2.1%', trend: 'down' },
                                        { name: 'Đá 1x2 (m3)', val: '-1.5%', trend: 'down' },
                                        { name: 'Ngói đất nung', val: '-1.2%', trend: 'down' },
                                    ].map((item, i) => (
                                        <div key={i} className="flex justify-between items-center py-2 border-b border-slate-50 last:border-0">
                                            <span className="text-sm font-medium text-slate-600">{item.name}</span>
                                            <span className="text-sm font-black text-red-600">{item.val}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Sidebar: News & Insights */}
                    <div className="space-y-8">
                        {/* News Feed */}
                        {/* News Feed - Premium Card List */}
                        <div className="bg-white rounded-[40px] shadow-[0_30px_60px_rgba(0,0,0,0.04)] border border-slate-100 overflow-hidden">
                            <div className="p-8 bg-slate-50/50 border-b border-slate-100 flex items-center justify-between">
                                <h3 className="font-black text-slate-900 flex items-center gap-3">
                                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>
                                    <span className="uppercase tracking-tighter">TIN TIÊU ĐIỂM</span>
                                </h3>
                                <span className="text-[10px] font-black text-blue-600 bg-blue-50 px-3 py-1 rounded-full border border-blue-100 uppercase tracking-widest">LIVE</span>
                            </div>
                            <div className="p-8 space-y-10">
                                {newsItems.map((item, i) => (
                                    <div key={i} className="group cursor-pointer relative">
                                        <div className="flex items-center gap-3 mb-4">
                                            <span className="text-[9px] font-black bg-[#0c0f17] text-white px-3 py-1 rounded-lg uppercase tracking-widest">{item.source}</span>
                                            <div className="h-1 w-1 rounded-full bg-slate-200"></div>
                                            <span className="flex items-center gap-1.5 text-[10px] text-slate-400 font-black uppercase tracking-widest">
                                                <Calendar className="w-3 h-3" /> {item.date}
                                            </span>
                                        </div>
                                        <h5 className="text-xl font-black text-slate-800 group-hover:text-blue-600 transition-colors mb-4 leading-tight tracking-tight">
                                            {item.title}
                                        </h5>
                                        <p className="text-xs text-slate-500 leading-relaxed font-medium line-clamp-3">
                                            {item.summary}
                                        </p>
                                        <div className="mt-6 flex items-center gap-2 text-[10px] font-black text-blue-600 uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-all transform translate-x-[-10px] group-hover:translate-x-0">
                                            Đọc chi tiết <ArrowUpRight className="w-3 h-3" />
                                        </div>
                                        {i !== newsItems.length - 1 && <div className="mt-10 border-b border-slate-100" />}
                                    </div>
                                ))}
                            </div>
                            <button className="w-full py-6 text-[10px] font-black text-slate-400 bg-slate-50/50 hover:bg-slate-100 hover:text-blue-600 border-t border-slate-100 transition-all uppercase tracking-[0.3em]">
                                TẤT CẢ TIN THỊ TRƯỜNG
                            </button>
                        </div>

                        {/* Price Alert Signup */}
                        <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl shadow-xl p-8 text-white relative overflow-hidden">
                            <div className="relative z-10">
                                <h3 className="text-xl font-black mb-4 leading-tight">Nhận Thông Báo Biến Động Giá!</h3>
                                <p className="text-blue-100 text-xs mb-6 leading-relaxed">
                                    Chúng tôi sẽ gửi mail cho bạn ngay khi thị trường có biến động lớn về giá các loại vật liệu bạn quan tâm.
                                </p>
                                <div className="space-y-3">
                                    <input
                                        type="email"
                                        placeholder="Email của bạn..."
                                        className="w-full bg-white/10 border border-white/20 rounded-lg py-3 px-4 text-sm placeholder:text-white/60 outline-none focus:bg-white/20 transition-all font-medium"
                                    />
                                    <button className="w-full bg-white text-blue-700 py-3 rounded-lg font-black text-sm hover:bg-blue-50 transition-all active:scale-95">
                                        ĐĂNG KÝ NGAY
                                    </button>
                                </div>
                            </div>
                            <Activity className="absolute -bottom-4 -right-4 w-32 h-32 text-white/10 rotate-12" />
                        </div>

                        {/* Quick Connect */}
                        <div className="bg-slate-900 rounded-2xl shadow-xl p-8 text-white">
                            <h4 className="font-black text-lg mb-2">Cần Báo Giá Gốc?</h4>
                            <p className="text-slate-400 text-xs mb-6">Liên hệ trực tiếp với bộ phận cung ứng dự án để nhận giá chiết khấu đặc biệt.</p>
                            <button className="w-full bg-blue-600 text-white py-3 rounded-lg font-black text-sm hover:bg-blue-700 transition-all">
                                GỌI 1900 8888
                            </button>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    )
}
