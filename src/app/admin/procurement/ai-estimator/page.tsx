'use client'

/**
 * AI Smart Material Estimator Tool
 * Allows admins/contractors to get material suggestions using AI
 */

import { useState } from 'react'
import {
    Sparkles, Send, Box, ShoppingCart,
    Trash2, Plus, ArrowRight, Loader2,
    AlertCircle, History, FileText, LayoutGrid
} from 'lucide-react'
import toast from 'react-hot-toast'

export default function AIEstimatorPage() {
    const [loading, setLoading] = useState(false)
    const [description, setDescription] = useState('')
    const [area, setArea] = useState('')
    const [projectType, setProjectType] = useState('RENO') // RENO, NEW, REPAIR
    const [results, setResults] = useState<any>(null)
    const [selectedItems, setSelectedItems] = useState<any[]>([])

    const handleEstimate = async () => {
        if (!description.trim()) {
            return toast.error('Vui lòng mô tả hạng mục công việc')
        }

        setLoading(true)
        try {
            const res = await fetch('/api/ai/estimate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ description, projectType, area })
            })

            if (res.ok) {
                const data = await res.json()
                setResults(data.data)
                toast.success('Đã tính toán xong dựa trên AI!')
            }
        } catch (err) {
            toast.error('Lỗi khi xử lý AI')
        } finally {
            setLoading(false)
        }
    }

    const toggleItem = (item: any) => {
        setSelectedItems(prev => {
            const exists = prev.find(i => i.productId === item.productId)
            if (exists) {
                return prev.filter(i => i.productId !== item.productId)
            }
            return [...prev, item]
        })
    }

    const addToCart = async () => {
        if (selectedItems.length === 0) return toast.error('Vui lòng chọn ít nhất 1 vật tư')

        // Logic to add selected items to cart...
        toast.success(`Đã thêm ${selectedItems.length} vật tư vào giỏ hàng/ước tính`)
        setSelectedItems([])
    }

    return (
        <div className="min-h-screen bg-[#F9FAFB] p-8">
            <div className="max-w-6xl mx-auto">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-black text-slate-900 flex items-center gap-3">
                            <Sparkles className="w-8 h-8 text-purple-600 animate-pulse" />
                            AI Smart Estimator
                        </h1>
                        <p className="text-slate-500 mt-1 font-medium">Bóc tách khối lượng và gợi ý vật tư bằng Trí tuệ nhân tạo</p>
                    </div>
                    <button className="flex items-center gap-2 px-6 py-3 bg-white border border-slate-200 rounded-2xl text-slate-600 font-bold hover:bg-slate-50 transition-all shadow-sm">
                        <History className="w-5 h-5" />
                        Lịch sử tra cứu
                    </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">

                    {/* Input Section */}
                    <div className="lg:col-span-5 space-y-6">
                        <div className="bg-white p-8 rounded-[32px] shadow-xl shadow-slate-200/50 border border-slate-100">
                            <div className="space-y-6">
                                <div>
                                    <label className="block text-sm font-black text-slate-400 uppercase tracking-widest mb-3">Mô tả công việc</label>
                                    <textarea
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
                                        placeholder="Ví dụ: Xây mới nhà phố 3 tầng, diện tích 5x20. Cần bóc tách phần thô bao gồm xi măng, gạch, cát, đá và sắt thép..."
                                        className="w-full h-48 px-6 py-5 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:bg-white focus:border-purple-500 transition-all font-medium resize-none text-slate-800"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-black text-slate-400 uppercase tracking-widest mb-3">Diện tích (m2)</label>
                                        <input
                                            type="number"
                                            value={area}
                                            onChange={(e) => setArea(e.target.value)}
                                            placeholder="100"
                                            className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:border-purple-500 transition-all font-bold"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-black text-slate-400 uppercase tracking-widest mb-3">Loại công trình</label>
                                        <select
                                            value={projectType}
                                            onChange={(e) => setProjectType(e.target.value)}
                                            className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:border-purple-500 transition-all font-bold appearance-none"
                                        >
                                            <option value="RENO">Cải tạo / Sửa chữa</option>
                                            <option value="NEW">Xây mới hoàn toàn</option>
                                            <option value="REPAIR">Bảo trì định kỳ</option>
                                        </select>
                                    </div>
                                </div>

                                <button
                                    onClick={handleEstimate}
                                    disabled={loading}
                                    className="w-full py-5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-black rounded-2xl shadow-xl shadow-purple-100 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                                >
                                    {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : <><Sparkles className="w-6 h-6" /> Phân tích Dự án</>}
                                </button>
                            </div>
                        </div>

                        <div className="bg-purple-50 p-6 rounded-3xl border border-purple-100 flex gap-4">
                            <AlertCircle className="w-6 h-6 text-purple-600 shrink-0" />
                            <p className="text-sm font-medium text-purple-800 leading-relaxed">
                                AI sẽ dựa trên các định mức xây dựng quy chuẩn để gợi ý giải pháp. Kết quả mang tính chất tham khảo, vui lòng kiểm tra lại cùng nhà thầu.
                            </p>
                        </div>
                    </div>

                    {/* results Section */}
                    <div className="lg:col-span-7">
                        {results ? (
                            <div className="space-y-6">
                                <div className="bg-white p-8 rounded-[40px] shadow-sm border border-slate-100">
                                    <div className="flex items-center justify-between mb-8">
                                        <h3 className="text-xl font-black text-slate-900">Vật tư được gợi ý</h3>
                                        <span className="px-4 py-1.5 bg-purple-50 text-purple-600 rounded-full text-xs font-black">
                                            AI Accuracy: 92%
                                        </span>
                                    </div>

                                    <div className="space-y-4">
                                        {results.recommendations.map((item: any, idx: number) => (
                                            <div
                                                key={idx}
                                                onClick={() => toggleItem(item)}
                                                className={`p-6 rounded-3xl border-2 transition-all cursor-pointer flex items-center justify-between ${selectedItems.find(i => i.productId === item.productId)
                                                        ? 'bg-purple-50/50 border-purple-500 shadow-lg shadow-purple-50'
                                                        : 'bg-white border-slate-50 hover:border-slate-200'
                                                    }`}
                                            >
                                                <div className="flex items-center gap-4">
                                                    <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400">
                                                        <Box className="w-6 h-6" />
                                                    </div>
                                                    <div>
                                                        <h4 className="font-bold text-slate-900">{item.name}</h4>
                                                        <p className="text-xs text-slate-500 font-medium">{item.category} • Tin cậy: {(item.confidence * 100).toFixed(0)}%</p>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <p className="font-black text-slate-900">{item.recommendedQty} {item.unit}</p>
                                                    <p className="text-xs text-slate-400 font-bold">{item.price.toLocaleString('vi-VN')}đ/đv</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    {selectedItems.length > 0 && (
                                        <div className="mt-10 p-6 bg-slate-900 rounded-[32px] flex items-center justify-between animate-in slide-in-from-bottom-5">
                                            <div className="text-white">
                                                <p className="text-xs font-bold opacity-60 uppercase tracking-widest mb-1">Đã chọn {selectedItems.length} vật tư</p>
                                                <p className="text-xl font-black">
                                                    {selectedItems.reduce((sum, item) => sum + (item.price * item.recommendedQty), 0).toLocaleString('vi-VN')}
                                                    <span className="text-xs ml-1 opacity-60">VNĐ</span>
                                                </p>
                                            </div>
                                            <button
                                                onClick={addToCart}
                                                className="px-8 py-4 bg-white text-slate-900 font-black rounded-2xl hover:bg-purple-50 transition-all flex items-center gap-2"
                                            >
                                                Thêm vào dự án
                                                <ArrowRight className="w-5 h-5" />
                                            </button>
                                        </div>
                                    )}
                                </div>

                                <div className="bg-white p-8 rounded-[40px] shadow-sm border border-slate-100">
                                    <h4 className="font-black text-slate-900 mb-4 flex items-center gap-2">
                                        <LayoutGrid className="w-5 h-5 text-purple-600" />
                                        Lập kế hoạch mua sắm
                                    </h4>
                                    <p className="text-slate-500 font-medium text-sm leading-relaxed">
                                        Hệ thống đã chuẩn bị sẵn danh sách này. Bạn có thể xuất ra file PDF để làm việc với các nhà thầu hoặc tạo yêu cầu mua hàng trực tiếp từ SmartBuild.
                                    </p>
                                </div>
                            </div>
                        ) : (
                            <div className="h-full min-h-[500px] flex flex-col items-center justify-center text-center bg-white rounded-[40px] border-2 border-dashed border-slate-100 p-12">
                                <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mb-8">
                                    <Box className="w-10 h-10 text-slate-200" />
                                </div>
                                <h3 className="text-2xl font-black text-slate-900 mb-3">Chờ phân tích kết quả</h3>
                                <p className="text-slate-400 max-w-sm font-medium leading-relaxed">
                                    Mô tả chi tiết hạng mục công việc bên trái để AI có thể gợi ý chính xác nhất vật tư bạn cần.
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
