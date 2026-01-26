'use client'

import React, { useState } from 'react'
import { Sparkles, Compass, Calendar, Loader2, RefreshCcw, Send } from 'lucide-react'
import toast from 'react-hot-toast'

export default function FengshuiConsultant({ projectType }: { projectType: string }) {
    const [year, setYear] = useState('')
    const [direction, setDirection] = useState('Đông Nam')
    const [loading, setLoading] = useState(false)
    const [advice, setAdvice] = useState('')

    const DIRECTIONS = [
        'Đông', 'Tây', 'Nam', 'Bắc',
        'Đông Nam', 'Đông Bắc', 'Tây Nam', 'Tây Bắc'
    ]

    const handleConsult = async () => {
        if (!year) {
            toast.error('Vui lòng nhập năm sinh của bạn')
            return
        }

        setLoading(true)
        try {
            const res = await fetch('/api/fengshui', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ year, direction, projectType })
            })
            const data = await res.json()
            if (data.success) {
                setAdvice(data.data.advice)
            } else {
                toast.error(data.message || 'Không thể lấy lời khuyên lúc này')
            }
        } catch (err) {
            toast.error('Lỗi kết nối AI')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-amber-100 overflow-hidden">
            <div className="bg-gradient-to-r from-amber-500 to-orange-600 p-4 text-white flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5" />
                    <span className="font-bold tracking-tight italic">AI Tư Vấn Phong Thủy</span>
                </div>
                {advice && (
                    <button
                        onClick={() => { setAdvice(''); setYear('') }}
                        className="p-1 hover:bg-white/20 rounded-full transition-colors"
                    >
                        <RefreshCcw className="w-4 h-4" />
                    </button>
                )}
            </div>

            {!advice ? (
                <div className="p-6 space-y-4">
                    <p className="text-xs text-gray-500 italic mb-2">
                        Nhập thông tin bên dưới để AI gợi ý màu sắc & vật liệu phù hợp với cung mệnh của bạn.
                    </p>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-gray-400 uppercase flex items-center gap-1.5">
                                <Calendar className="w-3 h-3" /> Năm sinh
                            </label>
                            <input
                                type="number"
                                value={year}
                                onChange={(e) => setYear(e.target.value)}
                                placeholder="VD: 1992"
                                className="w-full px-3 py-2 bg-amber-50/30 border border-amber-100 rounded-xl outline-none focus:ring-1 focus:ring-amber-500 font-bold text-gray-700"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-gray-400 uppercase flex items-center gap-1.5">
                                <Compass className="w-3 h-3" /> Hướng nhà
                            </label>
                            <select
                                value={direction}
                                onChange={(e) => setDirection(e.target.value)}
                                className="w-full px-3 py-2 bg-amber-50/30 border border-amber-100 rounded-xl outline-none focus:ring-1 focus:ring-amber-500 font-bold text-gray-700 appearance-none"
                            >
                                {DIRECTIONS.map(d => <option key={d} value={d}>{d}</option>)}
                            </select>
                        </div>
                    </div>

                    <button
                        onClick={handleConsult}
                        disabled={loading}
                        className="w-full py-3 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-black text-[11px] uppercase tracking-widest transition-all flex items-center justify-center gap-2 shadow-lg shadow-amber-100 disabled:bg-gray-200"
                    >
                        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                        {loading ? 'Đang "Xem Quẻ"...' : 'Nhận lời khuyên từ Chuyên Gia'}
                    </button>
                </div>
            ) : (
                <div className="p-6 animate-in fade-in slide-in-from-top-4 duration-500">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center overflow-hidden border-2 border-amber-200">
                            <img src="https://images.unsplash.com/photo-1544161515-4af6b1d462c2?q=80&w=100&auto=format&fit=crop" className="w-full h-full object-cover" />
                        </div>
                        <div>
                            <p className="text-xs font-black text-gray-900 leading-none">Chuyên Gia Tư Vấn</p>
                            <p className="text-[10px] text-amber-600 font-bold italic uppercase">Vật liệu & Phong thủy</p>
                        </div>
                    </div>

                    <div className="text-sm text-gray-700 leading-relaxed font-medium space-y-4 prose prose-amber">
                        {advice.split('\n').map((para, i) => (
                            para.trim() && <p key={i}>{para}</p>
                        ))}
                    </div>

                    <button
                        onClick={() => setAdvice('')}
                        className="mt-6 w-full py-2 bg-gray-50 border border-gray-100 text-gray-400 font-bold text-[10px] uppercase rounded-lg hover:bg-gray-100 transition-colors"
                    >
                        Tư vấn lại với thông tin khác
                    </button>
                </div>
            )}
        </div>
    )
}
