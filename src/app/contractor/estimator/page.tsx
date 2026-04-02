'use client'

import React, { useState } from 'react'
import {
    Sparkles,
    FileText,
    Calculator,
    Zap,
    Cpu,
    ArrowRight,
    CheckCircle2,
    Clock,
    ShieldCheck,
    Coins,
    Building2,
    Layers,
    Activity,
    BrainCircuit,
    Download,
    Share2,
    LayoutGrid,
    Trash2,
    Plus,
    History
} from 'lucide-react'
import { Toaster, toast } from 'react-hot-toast'
import Link from 'next/link'

interface EstimationResult {
    id: string
    title: string
    projectName: string
    date: string
    status: string
    totalCost: number
    margin: number
}

export default function AIEstimatorPage() {
    const [isAnalyzing, setIsAnalyzing] = useState(false)
    const [predictionDone, setPredictionDone] = useState(false)
    const [results, setResults] = useState<EstimationResult[]>([
        { id: '1', title: 'Hạng mục hoàn thiện tầng 04', projectName: 'Vinhomes Central Park', date: '2026-04-01', status: 'PAID', totalCost: 450000000, margin: 12.5 },
        { id: '2', title: 'Bốc tách vật tư thô lô B', projectName: 'Thủ Thiêm Zeit River', date: '2026-03-28', status: 'PENDING', totalCost: 1200000000, margin: 8.2 },
        { id: '3', title: 'Gói thầu thiết bị Zone-C', projectName: 'Sunwah Pearl', date: '2026-03-15', status: 'DRAFT', totalCost: 850000000, margin: 10.1 }
    ])

    const handleAIPrediction = () => {
        setIsAnalyzing(true)
        toast.loading('Đang khởi động lõi AI xử lý dữ liệu...', { duration: 3000 })
        
        setTimeout(() => {
            setIsAnalyzing(false)
            setPredictionDone(true)
            toast.success('Dự đoán ngân sách thành công!')
        }, 3000)
    }

    const formatCurrency = (val: number) =>
        new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val)

    return (
        <div className="space-y-12 animate-in fade-in duration-1000 pb-24 max-w-7xl mx-auto">
            <Toaster position="top-right" />
            
            {/* AI Command Center Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-10">
                <div className="space-y-3">
                    <h1 className="text-5xl font-black text-slate-900 tracking-tighter uppercase italic flex items-center gap-5">
                        <BrainCircuit className="w-12 h-12 text-blue-600" />
                        Trợ lý AI bóc tách
                    </h1>
                    <p className="text-slate-500 font-bold uppercase text-[10px] tracking-[0.3em] italic">Hệ thống dự báo ngân sách & tối ưu hóa nguồn lực B2B</p>
                </div>
                <div className="flex items-center gap-4">
                    <button 
                        onClick={handleAIPrediction}
                        className="px-10 py-6 bg-blue-600 text-white rounded-[2.5rem] text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-4 hover:bg-blue-700 transition-all shadow-2xl shadow-blue-500/30 active:scale-95 italic group"
                    >
                        <Sparkles className="w-5 h-5 group-hover:scale-125 transition-transform" /> Khởi tạo bản thảo AI
                    </button>
                    <button 
                         onClick={() => toast.success('Đang mở thư viện bản thảo lịch sử...')}
                        className="w-16 h-16 bg-white border border-slate-100 text-slate-400 hover:text-blue-600 rounded-[1.5rem] flex items-center justify-center transition-all shadow-sm active:scale-95"
                    >
                        <History className="w-6 h-6" />
                    </button>
                </div>
            </div>

            {/* Tactical Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                {/* AI Input Form Shard */}
                <div className="lg:col-span-8 space-y-10">
                    <div className="bg-white rounded-[3.5rem] p-12 lg:p-16 shadow-2xl shadow-slate-200/40 border border-slate-50 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/5 rounded-full blur-[100px] -mr-48 -mt-48 transition-all duration-1000 group-hover:scale-110"></div>
                        
                        <div className="relative z-10 space-y-12">
                            <div className="flex items-center gap-5">
                                <div className="w-12 h-12 bg-blue-600 text-white rounded-2xl flex items-center justify-center shadow-xl shadow-blue-100">
                                    <FileText size={24} />
                                </div>
                                <h2 className="text-2xl font-black text-slate-900 uppercase italic tracking-tighter">Tham số đầu vào bản thảo</h2>
                            </div>

                            <div className="grid md:grid-cols-2 gap-10">
                                <div className="space-y-4">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4 italic">Loại dự án thi công</label>
                                    <select className="w-full px-8 py-5 bg-slate-50 border-none rounded-[1.8rem] text-sm focus:ring-4 focus:ring-blue-500/10 focus:bg-white transition-all font-black uppercase italic outline-none text-slate-700">
                                        <option>Dân dụng - Chung cư cao cấp</option>
                                        <option>Công nghiệp - Nhà xưởng</option>
                                        <option>Thương mại - Trung tâm mua sắm</option>
                                        <option>Dự án hạ tầng - Đường xá</option>
                                    </select>
                                </div>
                                <div className="space-y-4">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4 italic">Diện tích sàn ước tính (m²)</label>
                                    <input type="number" placeholder="Vd: 4500" className="w-full px-8 py-5 bg-slate-50 border-none rounded-[1.8rem] text-sm focus:ring-4 focus:ring-blue-500/10 focus:bg-white transition-all font-black placeholder:text-slate-200 outline-none" />
                                </div>
                                <div className="space-y-4 md:col-span-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4 italic">Mô tả tóm tắt kỹ thuật & Yêu cầu vật tư chủ đạo</label>
                                    <textarea rows={6} placeholder="Nhập tóm tắt yêu cầu hoặc kéo thả file thiết kế cơ sở..." className="w-full px-10 py-8 bg-slate-50 border-none rounded-[2.5rem] text-sm focus:ring-4 focus:ring-blue-500/10 focus:bg-white transition-all font-bold placeholder:text-slate-200 outline-none resize-none italic" />
                                </div>
                            </div>

                            <button 
                                onClick={handleAIPrediction}
                                disabled={isAnalyzing}
                                className="w-full py-8 bg-indigo-600 text-white rounded-[2.5rem] text-[11px] font-black uppercase tracking-[0.3em] shadow-2xl shadow-indigo-200 hover:bg-indigo-700 transition-all flex items-center justify-center gap-5 active:scale-95 italic disabled:opacity-50 group/ana"
                            >
                                {isAnalyzing ? <Loader2 className="w-6 h-6 animate-spin text-white" /> : <BrainCircuit size={24} className="group-hover/ana:scale-125 transition-transform" />}
                                {isAnalyzing ? 'Đang phân tích cấu trúc dữ liệu...' : 'Phát lệnh AI bóc tách khối lượng'}
                            </button>
                        </div>
                    </div>

                    {/* Result Matrix Panel */}
                    <div className="bg-white rounded-[3.5rem] p-12 lg:p-16 shadow-2xl shadow-slate-200/40 border border-slate-50 space-y-12">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-5">
                                <div className="w-12 h-12 bg-emerald-600 text-white rounded-2xl flex items-center justify-center shadow-xl shadow-emerald-100">
                                    <Layers size={24} />
                                </div>
                                <h2 className="text-2xl font-black text-slate-900 uppercase italic tracking-tighter">Bản thảo lưu trữ</h2>
                            </div>
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic opacity-50">Lịch sử 30 ngày gần nhất</span>
                        </div>

                        <div className="grid gap-6">
                            {results.map((res) => (
                                <div key={res.id} className="p-8 bg-slate-50/50 hover:bg-white hover:shadow-2xl hover:shadow-blue-100 border border-transparent hover:border-blue-50 transition-all duration-700 rounded-[2.5rem] flex flex-col md:flex-row items-center justify-between gap-8 group">
                                    <div className="flex items-center gap-8">
                                        <div className="w-16 h-16 bg-white shadow-sm rounded-2xl flex items-center justify-center text-blue-600 group-hover:scale-110 group-hover:rotate-6 transition-transform">
                                            <Calculator size={32} />
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none italic">{res.projectName}</p>
                                            <h4 className="text-lg font-black text-slate-900 uppercase italic tracking-tighter group-hover:text-blue-600 transition-colors uppercase">{res.title}</h4>
                                            <p className="text-[10px] font-bold text-slate-300 italic">{res.date}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-10 w-full md:w-auto">
                                        <div className="text-right">
                                            <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest leading-none italic">Ngân sách AI</p>
                                            <p className="text-2xl font-black italic tracking-tighter text-blue-600 tabular-nums">{formatCurrency(res.totalCost)}</p>
                                        </div>
                                        <div className="flex gap-4">
                                            <button 
                                                onClick={() => toast.success('Đã gửi liên kết báo cáo!')}
                                                className="w-12 h-12 flex items-center justify-center bg-white shadow-sm hover:bg-blue-600 hover:text-white rounded-2xl transition-all active:scale-90"
                                            >
                                                <Share2 size={20} />
                                            </button>
                                            <button 
                                                onClick={() => toast.loading('Đang chuẩn bị bản in...', { duration: 1500 })}
                                                className="w-12 h-12 flex items-center justify-center bg-white shadow-sm hover:bg-indigo-600 hover:text-white rounded-2xl transition-all active:scale-90"
                                            >
                                                <Download size={20} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Performance Analytics Sidebar */}
                <div className="lg:col-span-4 space-y-10">
                    <div className="bg-indigo-600 rounded-[3.5rem] p-12 text-white relative overflow-hidden shadow-2xl shadow-indigo-200 group">
                        <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full -mr-24 -mt-24 transition-all duration-[1500ms] group-hover:scale-150"></div>
                        <div className="relative z-10 space-y-10">
                            <div className="space-y-4">
                                <h3 className="text-[10px] font-black text-blue-100 uppercase tracking-widest flex items-center gap-3 italic leading-none opacity-80">
                                    <Zap className="w-4 h-4 text-yellow-300" /> Tối ưu hóa lợi nhuận
                                </h3>
                                <p className="text-3xl font-black italic tracking-tighter uppercase leading-tight">Phân tích rủi ro & tỷ suất lợi nhuận</p>
                            </div>
                            
                            <div className="space-y-8">
                                <div className="space-y-4">
                                    <div className="flex justify-between items-end">
                                        <span className="text-[10px] font-black uppercase tracking-widest text-indigo-100 italic">Biên lợi nhuận an toàn</span>
                                        <span className="text-2xl font-black text-emerald-400 italic">15.2%</span>
                                    </div>
                                    <div className="h-2 bg-white/10 rounded-full overflow-hidden p-0.5">
                                        <div className="h-full bg-emerald-400 w-[65%] rounded-full shadow-[0_0_15px_rgba(52,211,153,0.5)]"></div>
                                    </div>
                                </div>
                                <div className="space-y-4 opacity-60">
                                    <div className="flex justify-between items-end">
                                        <span className="text-[10px] font-black uppercase tracking-widest text-indigo-100 italic">Rủi ro trượt giá vật tư</span>
                                        <span className="text-2xl font-black text-rose-400 italic">3.8%</span>
                                    </div>
                                    <div className="h-2 bg-white/10 rounded-full overflow-hidden p-0.5">
                                        <div className="h-full bg-rose-400 w-[22%] rounded-full"></div>
                                    </div>
                                </div>
                            </div>

                            <button
                                onClick={() => toast.success('Mô phỏng dữ liệu thị trường vận hành...')}
                                className="w-full py-7 bg-white text-indigo-600 rounded-[2rem] font-black text-[11px] uppercase tracking-[0.2em] hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-black/20 flex items-center justify-center gap-4 italic"
                            >
                                <Cpu size={20} /> Chạy mô phỏng Market-Ops
                            </button>
                        </div>
                    </div>

                    {/* Tactical Info Cards */}
                    <div className="bg-white rounded-[3.5rem] p-12 border border-slate-50 shadow-2xl shadow-slate-200/40 space-y-10">
                        <div className="space-y-3 px-2">
                             <h4 className="text-[10px] font-black text-slate-950 uppercase tracking-[0.3em] italic leading-none">Tham chiếu thị thực</h4>
                             <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest italic opacity-70 leading-relaxed">Bộ dữ liệu AI sử dụng nguồn chính thống từ kho dữ liệu B2B quốc gia.</p>
                        </div>
                        <div className="space-y-4">
                            {[
                                { title: 'Dữ liệu giá vật tư', status: 'CẬP NHẬT: 15 PHÚT TRƯỚC', icon: Coins, color: 'text-emerald-500', bg: 'bg-emerald-50' },
                                { title: 'Chỉ số nhân công khu vực', status: 'CẬP NHẬT: HÔM NAY', icon: Activity, color: 'text-blue-500', bg: 'bg-blue-50' },
                                { title: 'Giao thức bảo mật lõi', status: 'KÍCH HOẠT: 24/7', icon: ShieldCheck, color: 'text-indigo-500', bg: 'bg-indigo-50' }
                            ].map((item, i) => (
                                <div key={i} className="flex items-center gap-6 p-6 bg-slate-50/80 rounded-[2rem] group cursor-default">
                                    <div className={`w-12 h-12 ${item.bg} ${item.color} rounded-2xl flex items-center justify-center shadow-sm`}>
                                        <item.icon size={24} />
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-[11px] font-black uppercase text-slate-900 tracking-tight italic">{item.title}</p>
                                        <p className="text-[8px] font-bold text-slate-400 tracking-[0.1em]">{item.status}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

const Loader2 = ({ className }: { className?: string }) => (
    <svg className={className} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a9 9 0 1 1-6.219-8.56" /></svg>
)
