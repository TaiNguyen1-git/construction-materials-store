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
    History,
    X
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

    const [safeMargin, setSafeMargin] = useState(15.2)
    const [marketRisk, setMarketRisk] = useState(3.8)
    const [confidenceScore, setConfidenceScore] = useState(94)
    const [area, setArea] = useState<string>('')
    const [projectType, setProjectType] = useState('Dân dụng - Chung cư cao cấp')
    const [uploadedFiles, setUploadedFiles] = useState<{name: string, size: string}[]>([])
    const [analysisMode, setAnalysisMode] = useState<'manual' | 'blueprint'>('manual')
    const [isSimulating, setIsSimulating] = useState(false)
    const [isHistoryOpen, setIsHistoryOpen] = useState(false)

    const handleAIPrediction = () => {
        if (analysisMode === 'manual' && !area) {
            toast.error('Vui lòng nhập diện tích dự án để AI tính toán.')
            return
        }
        if (analysisMode === 'blueprint' && uploadedFiles.length === 0) {
            toast.error('Vui lòng tải lên bản vẽ để AI phân tích.')
            return
        }

        setIsAnalyzing(true)
        toast.loading(analysisMode === 'blueprint' ? 'Đang trích xuất tọa độ bản vẽ & Tài chính...' : 'Thu thập dữ liệu thị trường & Tài chính...', { duration: 3000 })
        
        setTimeout(() => {
            setIsAnalyzing(false)
            setPredictionDone(true)
            
            // Professional Deterministic Logic
            const parsedArea = parseFloat(area) || 5000 // default if blueprint and no area
            let baseMargin = 16.5
            let baseRisk = 2.4
            let baseConfidence = 92
            let costPerM2 = 8500000

            if (projectType.includes('Công nghiệp')) {
                baseMargin -= 2.5
                baseRisk += 1.8
                costPerM2 = 6200000
            }

            if (parsedArea > 10000) {
                baseMargin -= 1.2
                baseRisk += 1.5
                baseConfidence -= 2
            } else if (parsedArea < 1000) {
                baseMargin += 1.5
                baseConfidence += 3
            }

            const calculatedCost = parsedArea * costPerM2

            const newResult: EstimationResult = {
                id: Date.now().toString(),
                title: analysisMode === 'blueprint' ? `Bóc tách bản vẽ ${uploadedFiles[0]?.name || 'Dự án'}` : `Bóc tách: ${projectType} ${parsedArea}m²`,
                projectName: 'Dự án mới phân tích',
                date: new Date().toISOString().split('T')[0],
                status: 'DRAFT',
                totalCost: calculatedCost,
                margin: baseMargin
            }

            setResults(prev => [newResult, ...prev])
            setSafeMargin(baseMargin)
            setMarketRisk(baseRisk)
            setConfidenceScore(baseConfidence + Math.floor(Math.random() * 3))

            toast.success(`Bản thảo AI đã sẵn sàng với độ tin cậy ${baseConfidence}%`)
        }, 3000)
    }

    const handleSimulation = () => {
        setIsSimulating(true)
        toast.loading('Giả lập kịch bản rủi ro trượt giá vật tư...', { duration: 2500 })

        setTimeout(() => {
            setIsSimulating(false)
            
            const newMargin = Math.max(0, safeMargin - 8.5)
            const newRisk = marketRisk + 12.4
            const newConfidence = Math.max(50, confidenceScore - 15)

            setSafeMargin(newMargin)
            setMarketRisk(newRisk)
            setConfidenceScore(newConfidence)

            if (results.length > 0) {
                setResults(prev => {
                    const updated = [...prev]
                    updated[0].totalCost = updated[0].totalCost * 1.15 
                    updated[0].margin = newMargin
                    return updated
                })
            }

            toast.error(`CẢNH BÁO: Rủi ro xảy ra làm dự toán tăng 15%, Biên lợi nhuận sụt giảm còn ${newMargin.toFixed(1)}%.`, { duration: 5000, icon: '⚠️' })
        }, 2500)
    }

    const formatCurrency = (val: number) =>
        new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val)

    return (
        <div className="space-y-12 animate-in fade-in duration-1000 pb-24 max-w-7xl mx-auto">
            <Toaster position="top-right" />
            
            {/* AI Command Center Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-slate-100">
                <div className="space-y-1">
                    <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                        <BrainCircuit className="w-6 h-6 text-blue-600" />
                        Trợ lý AI bóc tách
                    </h1>
                    <p className="text-slate-500 text-sm">Hệ thống dự báo ngân sách & tối ưu hóa nguồn lực B2B</p>
                </div>
                <div className="flex items-center gap-3">
                    <button 
                         onClick={() => setIsHistoryOpen(true)}
                        className="p-2 bg-white border border-slate-200 text-slate-600 hover:text-blue-600 rounded-lg flex items-center justify-center transition-all shadow-sm"
                    >
                        <History className="w-4 h-4" />
                    </button>
                    <button 
                        onClick={handleAIPrediction}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm flex items-center gap-2 hover:bg-blue-700 transition-all shadow-sm"
                    >
                        <Sparkles className="w-4 h-4" /> Bóc tách mới
                    </button>
                </div>
            </div>

            {/* Tactical Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* AI Input Form Shard */}
                <div className="lg:col-span-8 space-y-8">
                    <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-200">
                        <div className="space-y-8">
                            <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                                <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center">
                                    <FileText size={20} />
                                </div>
                                <h2 className="text-lg font-bold text-slate-900">Tham số đầu vào bản thảo</h2>
                            </div>

                            <div className="grid md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Loại dự án thi công</label>
                                    <select 
                                        value={projectType}
                                        onChange={(e) => setProjectType(e.target.value)}
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 outline-none text-slate-700"
                                    >
                                        <option>Dân dụng - Chung cư cao cấp</option>
                                        <option>Công nghiệp - Nhà xưởng</option>
                                        <option>Thương mại - Trung tâm mua sắm</option>
                                        <option>Dự án hạ tầng - Đường xá</option>
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Diện tích sàn ước tính (m²)</label>
                                    <input 
                                        type="number" 
                                        placeholder="Vd: 4500" 
                                        value={area}
                                        onChange={(e) => setArea(e.target.value)}
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 outline-none text-slate-700" 
                                    />
                                </div>
                            </div>

                            <div className="space-y-6 pt-2">
                                <div className="flex bg-slate-100 p-1 rounded-xl w-fit">
                                    <button 
                                        onClick={() => setAnalysisMode('manual')}
                                        className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${analysisMode === 'manual' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                                    >
                                        <FileText size={16} /> Nhập tóm tắt mô tả
                                    </button>
                                    <button 
                                        onClick={() => setAnalysisMode('blueprint')}
                                        className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${analysisMode === 'blueprint' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                                    >
                                        <Layers size={16} /> Phân tích Bản vẽ
                                    </button>
                                </div>

                                {analysisMode === 'manual' ? (
                                    <div className="space-y-2 animate-in slide-in-from-left-2 duration-300">
                                        <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Mô tả kỹ thuật & Yêu cầu vật tư</label>
                                        <textarea rows={4} placeholder="Nhập tóm tắt yêu cầu hoặc ghi chú cụ thể cho AI bóc tách khối lượng..." className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 outline-none resize-none" />
                                    </div>
                                ) : (
                                    <div className="space-y-4 animate-in slide-in-from-right-2 duration-300">
                                        <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Tài liệu thiết kế & Blueprint (AI sẽ tự đọc dữ liệu)</label>
                                        <div className="relative group cursor-pointer">
                                            <input 
                                                type="file" 
                                                multiple 
                                                className="absolute inset-0 w-full h-full opacity-0 z-20 cursor-pointer" 
                                                onChange={(e) => {
                                                    const files = Array.from(e.target.files || [])
                                                    setUploadedFiles(prev => [...prev, ...files.map(f => ({ name: f.name, size: (f.size / 1024 / 1024).toFixed(1) + 'MB' }))])
                                                }}
                                            />
                                            <div className="border border-dashed border-slate-300 rounded-xl p-8 bg-slate-50 group-hover:bg-white group-hover:border-blue-400 transition-all text-center space-y-3">
                                                <div className="w-12 h-12 bg-white rounded-lg border border-slate-100 flex items-center justify-center mx-auto shadow-sm group-hover:text-blue-600 transition-all">
                                                    <Download className="w-5 h-5" />
                                                </div>
                                                <div className="space-y-1">
                                                    <p className="text-sm font-bold text-slate-900">Tải ảnh hoặc file bản vẽ</p>
                                                    <p className="text-xs text-slate-500">Kéo thả PDF, DWG, PNG để AI tự quét tọa độ</p>
                                                </div>
                                            </div>
                                        </div>

                                        {uploadedFiles.length > 0 && (
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                                                {uploadedFiles.map((file, idx) => (
                                                    <div key={idx} className="flex items-center justify-between p-3 bg-white border border-slate-200 rounded-xl shadow-sm group">
                                                        <div className="flex items-center gap-3 overflow-hidden">
                                                            <div className="w-8 h-8 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
                                                                <FileText size={16} />
                                                            </div>
                                                            <div className="min-w-0">
                                                                <p className="text-sm font-medium text-slate-900 truncate">{file.name}</p>
                                                                <p className="text-xs text-slate-500">{file.size}</p>
                                                            </div>
                                                        </div>
                                                        <button 
                                                            onClick={(e) => {
                                                                e.stopPropagation()
                                                                setUploadedFiles(prev => prev.filter((_, i) => i !== idx))
                                                            }}
                                                            className="w-8 h-8 rounded-lg hover:bg-rose-50 hover:text-rose-600 text-slate-400 transition-all flex items-center justify-center"
                                                        >
                                                            <Trash2 size={16} />
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                            <button 
                                onClick={handleAIPrediction}
                                disabled={isAnalyzing}
                                className="w-full py-4 bg-blue-600 text-white rounded-xl text-sm font-bold shadow-sm hover:bg-blue-700 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                            >
                                {isAnalyzing ? <Loader2 className="w-5 h-5 animate-spin text-white" /> : <BrainCircuit size={20} />}
                                {isAnalyzing ? 'Đang phân tích cấu trúc dữ liệu...' : 'Phân tích vật tư AI'}
                            </button>
                        </div>
                    </div>

                    {/* Result Matrix Panel */}
                    <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-200 space-y-6">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-lg flex items-center justify-center">
                                    <Layers size={20} />
                                </div>
                                <h2 className="text-lg font-bold text-slate-900">Bản thảo lưu trữ</h2>
                            </div>
                            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Lịch sử 30 ngày gần nhất</span>
                        </div>

                        <div className="grid gap-4">
                            {results.map((res, idx) => (
                                <div key={res.id} className="relative p-6 bg-slate-50 hover:bg-white hover:shadow-md border border-slate-100 hover:border-blue-100 transition-all duration-300 rounded-xl flex flex-col md:flex-row items-center justify-between gap-6 group overflow-hidden">
                                    {idx === 0 && predictionDone && (
                                        <div className="absolute top-0 left-0 bg-blue-600 text-white text-[10px] font-bold px-3 py-1 rounded-br-lg uppercase tracking-wider animate-in slide-in-from-top-4 duration-500">
                                            Vừa bóc tách
                                        </div>
                                    )}
                                    <div className="flex items-center gap-5">
                                        <div className="w-12 h-12 bg-white shadow-sm rounded-lg flex items-center justify-center text-blue-600 group-hover:scale-105 transition-transform">
                                            <Calculator size={24} />
                                        </div>
                                        <div className="space-y-0.5">
                                            <p className="text-xs font-medium text-slate-500">{res.projectName}</p>
                                            <h4 className="text-sm font-bold text-slate-900 group-hover:text-blue-600 transition-colors">{res.title}</h4>
                                            <p className="text-xs text-slate-400">{res.date}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-8 w-full md:w-auto">
                                        <div className="text-right">
                                            <p className="text-[10px] font-bold text-blue-500 uppercase tracking-widest">Ngân sách AI</p>
                                            <p className="text-xl font-bold text-blue-600 tabular-nums">{formatCurrency(res.totalCost)}</p>
                                        </div>
                                        <div className="flex gap-2">
                                            <button 
                                                onClick={() => toast.success('Đã gửi liên kết báo cáo!')}
                                                className="w-10 h-10 flex items-center justify-center bg-white border border-slate-200 shadow-sm hover:bg-blue-50 text-slate-500 hover:text-blue-600 rounded-lg transition-all"
                                            >
                                                <Share2 size={18} />
                                            </button>
                                            <button 
                                                onClick={() => toast.loading('Đang chuẩn bị bản in...', { duration: 1500 })}
                                                className="w-10 h-10 flex items-center justify-center bg-white border border-slate-200 shadow-sm hover:bg-blue-50 text-slate-500 hover:text-blue-600 rounded-lg transition-all"
                                            >
                                                <Download size={18} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Performance Analytics Sidebar */}
                <div className="lg:col-span-4 space-y-8">
                    <div className="bg-blue-600 rounded-2xl p-8 text-white relative overflow-hidden shadow-sm group">
                        <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full -mr-24 -mt-24 transition-all duration-1000 group-hover:scale-110"></div>
                        <div className="relative z-10 space-y-8">
                            <div className="space-y-2">
                                <h3 className="text-xs font-bold text-blue-100 uppercase tracking-widest flex items-center gap-2">
                                    <Zap className="w-4 h-4 text-amber-400" /> Tối ưu hóa lợi nhuận
                                </h3>
                                <p className="text-xl font-bold">Phân tích rủi ro & Tỷ suất</p>
                            </div>
                            
                            <div className="space-y-6">
                                <div className="space-y-3">
                                    <div className="flex justify-between items-end">
                                        <span className="text-xs font-medium text-blue-100">Biên lợi nhuận an toàn</span>
                                        {isAnalyzing || isSimulating ? (
                                            <div className="h-6 w-16 bg-white/20 animate-pulse rounded-md"></div>
                                        ) : (
                                            <span className="text-xl font-bold text-emerald-400 tabular-nums">{safeMargin.toFixed(1)}%</span>
                                        )}
                                    </div>
                                    <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                                        <div 
                                            className="h-full bg-emerald-400 rounded-full transition-all duration-[2000ms] ease-out shadow-[0_0_10px_rgba(52,211,153,0.3)]"
                                            style={{ width: isAnalyzing || isSimulating ? '10%' : `${Math.min((safeMargin / 25) * 100, 100)}%` }}
                                        ></div>
                                    </div>
                                </div>
                                <div className="space-y-3">
                                    <div className="flex justify-between items-end">
                                        <span className="text-xs font-medium text-blue-100">Rủi ro trượt giá vật tư</span>
                                        {isAnalyzing || isSimulating ? (
                                            <div className="h-6 w-16 bg-white/20 animate-pulse rounded-md"></div>
                                        ) : (
                                            <span className="text-xl font-bold text-rose-400 tabular-nums">{marketRisk.toFixed(1)}%</span>
                                        )}
                                    </div>
                                    <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                                        <div 
                                            className="h-full bg-rose-400 rounded-full transition-all duration-[2000ms] ease-out"
                                            style={{ width: isAnalyzing || isSimulating ? '50%' : `${Math.min((marketRisk / 20) * 100, 100)}%` }}
                                        ></div>
                                    </div>
                                </div>

                                <div className="pt-4 border-t border-white/10 flex items-center justify-between">
                                    <div className="space-y-1">
                                        <p className="text-[10px] font-bold text-blue-200 uppercase tracking-widest">Độ tin cậy thuật toán</p>
                                        <p className="text-sm font-bold text-white flex items-center gap-1">
                                            {isAnalyzing || isSimulating ? 'Đang thẩm định...' : `${confidenceScore}% Confidence`}
                                        </p>
                                    </div>
                                    {!(isAnalyzing || isSimulating) && <div className="w-8 h-8 rounded-lg border border-white/20 flex items-center justify-center text-[10px] font-bold">AI</div>}
                                </div>
                            </div>

                            <button
                                onClick={handleSimulation}
                                disabled={isSimulating || isAnalyzing}
                                className="w-full py-4 bg-white text-blue-600 rounded-xl font-bold text-xs uppercase tracking-wider hover:bg-slate-50 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                            >
                                {isSimulating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Cpu size={16} />}
                                {isSimulating ? 'Đang mô phỏng...' : 'Chạy mô phỏng Market-Ops'}
                            </button>
                        </div>
                    </div>

                    {/* Tactical Info Cards */}
                    <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-6">
                        <div className="space-y-1">
                             <h4 className="text-sm font-bold text-slate-900">Tham chiếu thị thực</h4>
                             <p className="text-xs text-slate-500">Bộ dữ liệu AI sử dụng nguồn chính thống từ kho dữ liệu B2B quốc gia.</p>
                        </div>
                        <div className="space-y-3">
                            {[
                                { title: 'Dữ liệu giá vật tư', status: 'CẬP NHẬT: 15 PHÚT TRƯỚC', icon: Coins, color: 'text-emerald-600', bg: 'bg-emerald-50' },
                                { title: 'Chỉ số nhân công', status: 'CẬP NHẬT: HÔM NAY', icon: Activity, color: 'text-blue-600', bg: 'bg-blue-50' },
                                { title: 'Bảo mật lõi', status: 'KÍCH HOẠT: 24/7', icon: ShieldCheck, color: 'text-indigo-600', bg: 'bg-indigo-50' }
                            ].map((item, i) => (
                                <div key={i} className="flex items-center gap-4 p-3 bg-slate-50 rounded-xl border border-slate-100">
                                    <div className={`w-10 h-10 ${item.bg} ${item.color} rounded-lg flex items-center justify-center flex-shrink-0`}>
                                        <item.icon size={20} />
                                    </div>
                                    <div className="space-y-0.5">
                                        <p className="text-sm font-bold text-slate-900">{item.title}</p>
                                        <p className="text-[10px] font-bold text-slate-500 tracking-wider">{item.status}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* History Slide-over Drawer */}
            {isHistoryOpen && (
                <div className="fixed inset-0 z-50 flex justify-end">
                    <div className="absolute inset-0 bg-slate-900/20 backdrop-blur-sm transition-opacity" onClick={() => setIsHistoryOpen(false)} />
                    <div className="relative w-full max-w-md bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-300 border-l border-slate-200">
                        <div className="flex items-center justify-between p-6 border-b border-slate-100 bg-white">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center">
                                    <History size={20} />
                                </div>
                                <div>
                                    <h3 className="font-bold text-slate-900">Thư viện Bản thảo</h3>
                                    <p className="text-xs text-slate-500">Toàn bộ lịch sử bóc tách</p>
                                </div>
                            </div>
                            <button onClick={() => setIsHistoryOpen(false)} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-all">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="p-6 overflow-y-auto flex-1 space-y-4 bg-slate-50/50">
                            {results.map(res => (
                                <div key={res.id} className="p-4 bg-white border border-slate-200 rounded-xl shadow-sm hover:shadow-md transition-all space-y-3 group cursor-pointer">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{res.date}</p>
                                            <p className="text-sm font-bold text-slate-900 mt-1 group-hover:text-blue-600 transition-colors">{res.title}</p>
                                        </div>
                                        <span className={`px-2 py-1 text-[10px] font-bold rounded uppercase tracking-wider ${res.status === 'PAID' ? 'bg-emerald-100 text-emerald-700' : res.status === 'PENDING' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-700'}`}>
                                            {res.status === 'DRAFT' ? 'Nháp' : res.status === 'PENDING' ? 'Chờ duyệt' : 'Đã chốt'}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-end pt-3 border-t border-slate-100">
                                        <div className="space-y-1">
                                            <p className="text-[10px] font-medium text-slate-500">Margin an toàn</p>
                                            <p className="text-xs font-bold text-emerald-600">+{res.margin.toFixed(1)}%</p>
                                        </div>
                                        <div className="text-right space-y-1">
                                            <p className="text-[10px] font-medium text-slate-500">Ngân sách dự tính</p>
                                            <p className="text-sm font-bold text-blue-600 tabular-nums">{formatCurrency(res.totalCost)}</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

const Loader2 = ({ className }: { className?: string }) => (
    <svg className={className} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a9 9 0 1 1-6.219-8.56" /></svg>
)
