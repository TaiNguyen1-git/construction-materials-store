'use client'

import React, { useState } from 'react'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
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
        <div className="min-h-screen bg-slate-50">
            <Header />

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                {/* Breadcrumbs */}
                <nav className="flex mb-8 text-sm font-medium text-slate-500">
                    <span>Trang chủ</span>
                    <span className="mx-2">/</span>
                    <span className="text-blue-600">Thị trường</span>
                </nav>

                {/* Hero Section */}
                <div className="bg-white rounded-2xl shadow-xl p-8 mb-10 border border-slate-100 flex flex-col md:flex-row justify-between items-center bg-gradient-to-br from-white to-blue-50/30">
                    <div>
                        <h1 className="text-3xl font-black text-slate-900 mb-2">Trung Tâm Phân Tích Thị Trường</h1>
                        <p className="text-slate-500 max-w-xl">
                            Cung cấp dữ liệu thời gian thực về biến động giá vật liệu xây dựng, giúp nhà thầu và chủ đầu tư đưa ra quyết định mua hàng tối ưu nhất.
                        </p>
                    </div>
                    <div className="mt-6 md:mt-0 flex gap-3">
                        <button className="flex items-center gap-2 bg-slate-100 text-slate-700 px-4 py-2.5 rounded-lg font-bold hover:bg-slate-200 transition-all">
                            <Download className="w-4 h-4" /> Xuất báo cáo
                        </button>
                        <button className="flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-lg font-bold hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all">
                            <Activity className="w-4 h-4" /> Dự báo 2026
                        </button>
                    </div>
                </div>

                {/* Market Snippets */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                    {[
                        { label: 'Thép Pomina (kg)', price: '17.200đ', change: '+2.4%', up: true, icon: TrendingUp, color: 'text-green-600', bg: 'bg-green-50' },
                        { label: 'Xi măng Hà Tiên (bao)', price: '91.000đ', change: '+1.5%', up: true, icon: TrendingUp, color: 'text-green-600', bg: 'bg-green-50' },
                        { label: 'Gạch tuynel (viên)', price: '1.400đ', change: '-0.8%', up: false, icon: TrendingDown, color: 'text-red-600', bg: 'bg-red-50' },
                    ].map((item, i) => (
                        <div key={i} className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm flex items-center justify-between">
                            <div>
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">{item.label}</p>
                                <h4 className="text-2xl font-black text-slate-900">{item.price}</h4>
                                <div className={`flex items-center text-sm font-bold mt-1 ${item.color}`}>
                                    <item.icon className="w-4 h-4 mr-1" /> {item.change} <span className="text-slate-400 font-medium ml-2">trong 30 ngày</span>
                                </div>
                            </div>
                            <div className={`${item.bg} p-4 rounded-full`}>
                                <item.icon className={`w-8 h-8 ${item.color}`} />
                            </div>
                        </div>
                    ))}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Chart Section */}
                    <div className="lg:col-span-2 space-y-8">
                        <div className="bg-white p-8 rounded-2xl shadow-xl border border-slate-100">
                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
                                <h3 className="text-xl font-black text-slate-900 flex items-center gap-2">
                                    <Activity className="w-5 h-5 text-blue-600" /> Biểu Đồ Xu Hướng Giá
                                </h3>
                                <div className="flex bg-slate-100 p-1 rounded-lg">
                                    <button
                                        onClick={() => setActiveTab('steel')}
                                        className={`px-4 py-1.5 text-xs font-bold rounded-md transition-all ${activeTab === 'steel' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                                    >
                                        THÉP
                                    </button>
                                    <button
                                        onClick={() => setActiveTab('cement')}
                                        className={`px-4 py-1.5 text-xs font-bold rounded-md transition-all ${activeTab === 'cement' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                                    >
                                        XI MĂNG
                                    </button>
                                    <button
                                        onClick={() => setActiveTab('brick')}
                                        className={`px-4 py-1.5 text-xs font-bold rounded-md transition-all ${activeTab === 'brick' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                                    >
                                        GẠCH
                                    </button>
                                </div>
                            </div>

                            <div className="h-[400px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={marketData}>
                                        <defs>
                                            <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1} />
                                                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                        <XAxis
                                            dataKey="month"
                                            axisLine={false}
                                            tickLine={false}
                                            tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 600 }}
                                            dy={10}
                                        />
                                        <YAxis
                                            axisLine={false}
                                            tickLine={false}
                                            tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 600 }}
                                        />
                                        <Tooltip
                                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)' }}
                                            labelStyle={{ fontWeight: 800, marginBottom: '4px' }}
                                        />
                                        <Area
                                            type="monotone"
                                            dataKey={activeTab}
                                            stroke="#3b82f6"
                                            strokeWidth={4}
                                            fillOpacity={1}
                                            fill="url(#colorValue)"
                                            animationDuration={1500}
                                        />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>

                            <div className="mt-8 p-4 bg-blue-50 rounded-xl flex items-start gap-4">
                                <Info className="w-6 h-6 text-blue-600 mt-0.5" />
                                <div>
                                    <h5 className="font-bold text-blue-900 text-sm">Phân tích chuyên gia:</h5>
                                    <p className="text-blue-800/80 text-sm leading-relaxed">
                                        Dựa trên biểu đồ, giá <span className="font-bold uppercase">{activeTab === 'steel' ? 'Thép' : activeTab === 'cement' ? 'Xi Măng' : 'Gạch'}</span> đang có dấu hiệu tăng trưởng ổn định. Các nhà thầu nên cân nhắc chốt đơn hàng sớm trước khi bước vào cao điểm xây dựng sau Tết.
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
                        <div className="bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden">
                            <div className="p-6 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                                <h3 className="font-black text-slate-900 flex items-center gap-2">
                                    <Newspaper className="w-5 h-5 text-blue-600" /> TIN TỨC THỊ TRƯỜNG
                                </h3>
                            </div>
                            <div className="p-6 space-y-6">
                                {newsItems.map((item, i) => (
                                    <div key={i} className="group cursor-pointer">
                                        <div className="flex items-center gap-2 mb-2">
                                            <span className="text-[10px] font-bold bg-blue-100 text-blue-700 px-2 py-0.5 rounded">{item.source}</span>
                                            <span className="text-[10px] text-slate-400 font-bold uppercase">{item.date}</span>
                                        </div>
                                        <h5 className="text-[15px] font-bold text-slate-800 group-hover:text-blue-600 transition-colors mb-2 leading-snug">
                                            {item.title}
                                        </h5>
                                        <p className="text-xs text-slate-500 leading-relaxed line-clamp-2">
                                            {item.summary}
                                        </p>
                                        {i !== newsItems.length - 1 && <div className="mt-6 border-b border-slate-100" />}
                                    </div>
                                ))}
                            </div>
                            <button className="w-full py-4 text-xs font-black text-blue-600 bg-slate-50 hover:bg-slate-100 border-t border-slate-100 transition-all">
                                XEM TẤT CẢ TIN TỨC
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

            <Footer />
        </div>
    )
}
