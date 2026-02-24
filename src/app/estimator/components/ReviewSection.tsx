'use client'

import React from 'react'
import { CheckCircle, Plus, Loader2 } from 'lucide-react'
import { RoomDimension } from '../types'

interface ReviewSectionProps {
    imagesPreview: string[]
    reviewStyle: string
    setReviewStyle: (val: any) => void
    reviewRoofType: string
    setReviewRoofType: (val: string) => void
    reviewArea: number
    setReviewArea: (val: number) => void
    reviewRooms: RoomDimension[]
    setReviewRooms: (val: RoomDimension[]) => void
    onRecalculate: () => void
    onBack: () => void
    loading: boolean
}

export default function ReviewSection({
    imagesPreview,
    reviewStyle, setReviewStyle,
    reviewRoofType, setReviewRoofType,
    reviewArea, setReviewArea,
    reviewRooms, setReviewRooms,
    onRecalculate, onBack,
    loading
}: ReviewSectionProps) {
    return (
        <div className="bg-white rounded-xl shadow-xl border-2 border-slate-100 p-6 animate-in slide-in-from-right-4 duration-500 space-y-6">
            <div className="flex items-start gap-4 border-b border-gray-100 pb-4">
                <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <CheckCircle className="w-6 h-6 text-indigo-600" />
                </div>
                <div>
                    <h2 className="text-base font-black text-slate-800 uppercase tracking-tight">Xác nhận thông số bản vẽ</h2>
                    <p className="text-xs text-slate-500">AI đã bóc tách xong, quý khách vui lòng kiểm tra và sửa lại con số nếu cần để dự toán chính xác nhất.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Building Info */}
                <div className="space-y-4">
                    <div className="flex gap-3">
                        {imagesPreview.length > 0 && (
                            <div className="w-1/3 aspect-[4/3] rounded-xl overflow-hidden border border-gray-100 shadow-inner bg-gray-50 flex-shrink-0">
                                <img src={imagesPreview[0]} className="w-full h-full object-cover" alt="Floor plan reference" />
                                <div className="text-[8px] bg-black/50 text-white text-center py-0.5 mt-[-16px] relative z-10 font-bold uppercase">Bản vẽ gốc</div>
                            </div>
                        )}
                        <div className={imagesPreview.length > 0 ? "w-2/3" : "w-full"}>
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">Loại hình công trình</label>
                            <div className="grid grid-cols-1 gap-2">
                                {[
                                    { id: 'nhà_cấp_4', label: 'Nhà cấp 4' },
                                    { id: 'nhà_phố', label: 'Nhà phố' },
                                    { id: 'biệt_thự', label: 'Biệt thự' }
                                ].map((style) => (
                                    <button
                                        key={style.id}
                                        onClick={() => setReviewStyle(style.id)}
                                        className={`text-left px-4 py-2 rounded-xl border text-xs font-bold transition-all ${reviewStyle === style.id
                                            ? 'border-indigo-500 bg-indigo-50 text-indigo-700 shadow-sm'
                                            : 'border-gray-100 hover:border-gray-200 text-slate-500'
                                            }`}
                                    >
                                        {style.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div>
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">Loại mái & Kết cấu</label>
                        <select
                            value={reviewRoofType}
                            onChange={(e) => setReviewRoofType(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-bold text-slate-700 bg-white"
                        >
                            <option value="mái_tôn">Mái tôn (Tiết kiệm)</option>
                            <option value="bê_tông">Mái bê tông phẳng (Sân thượng)</option>
                            <option value="mái_thái">Mái Thái / Mái ngói (Sang trọng)</option>
                        </select>
                    </div>
                    <div className="bg-indigo-600 p-5 rounded-2xl shadow-xl shadow-indigo-100">
                        <label className="text-[10px] font-black text-white/70 uppercase tracking-widest block mb-1">Tổng diện tích xây dựng (m²)</label>
                        <div className="flex items-baseline gap-2">
                            <input
                                type="number"
                                value={reviewArea}
                                onChange={(e) => setReviewArea(Number(e.target.value))}
                                className="w-full bg-transparent text-4xl font-black text-white outline-none border-none focus:ring-0 p-0"
                            />
                            <span className="text-white/50 font-black text-xl">m²</span>
                        </div>
                        <p className="text-[9px] text-white/60 mt-2 font-medium italic">* Diện tích bao gồm tất cả các mặt sàn và ban công.</p>
                    </div>
                </div>

                {/* Rooms List */}
                <div className="space-y-3">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">Chi tiết các phòng detected</label>
                    <div className="max-h-[300px] overflow-y-auto space-y-2 pr-2 scrollbar-thin scrollbar-thumb-gray-200">
                        {reviewRooms.map((room, idx) => (
                            <div key={idx} className="flex items-center gap-2 bg-gray-50 p-2 rounded-lg border border-gray-100 group">
                                <span className="text-[10px] font-bold text-gray-400 w-4">{idx + 1}.</span>
                                <input
                                    className="flex-grow bg-transparent text-xs font-bold text-slate-700 outline-none"
                                    value={room.name}
                                    onChange={(e) => {
                                        const newRooms = [...reviewRooms]
                                        newRooms[idx].name = e.target.value
                                        setReviewRooms(newRooms)
                                    }}
                                />
                                <div className="flex items-center gap-1">
                                    <input
                                        type="number"
                                        className="w-12 bg-white border border-gray-200 rounded px-1 py-0.5 text-xs font-black text-right outline-none"
                                        value={room.area}
                                        onChange={(e) => {
                                            const newRooms = [...reviewRooms]
                                            newRooms[idx].area = Number(e.target.value)
                                            setReviewRooms(newRooms)
                                        }}
                                    />
                                    <span className="text-[9px] font-bold text-gray-400">m²</span>
                                </div>
                            </div>
                        ))}
                    </div>
                    <button
                        onClick={() => setReviewRooms([...reviewRooms, { name: 'Phòng mới', area: 15, length: 0, width: 0 }])}
                        className="w-full py-2 border-2 border-dashed border-gray-200 rounded-lg text-[10px] font-bold text-gray-400 hover:border-indigo-300 hover:text-indigo-500 transition-all flex items-center justify-center gap-2"
                    >
                        <Plus className="w-3 h-3" /> THÊM PHÒNG
                    </button>
                </div>
            </div>

            <div className="pt-4 border-t border-gray-100 flex gap-3">
                <button
                    onClick={onBack}
                    className="flex-shrink-0 px-6 py-3 rounded-xl border border-gray-200 text-[11px] font-black text-gray-400 hover:bg-gray-50 uppercase tracking-tight"
                >
                    Quay lại
                </button>
                <button
                    onClick={onRecalculate}
                    disabled={loading}
                    className="flex-grow bg-white hover:bg-slate-50 text-slate-900 border border-slate-200 py-4 rounded-xl text-xs font-black uppercase tracking-widest shadow-xl shadow-slate-100 flex items-center justify-center gap-2 transition-all active:scale-95"
                >
                    {loading ? (
                        <Loader2 className="w-5 h-5 animate-spin text-indigo-600" />
                    ) : (
                        <>
                            <CheckCircle className="w-5 h-5 text-emerald-600" />
                            Xác nhận & Tính toán vật liệu
                        </>
                    )}
                </button>
            </div>
        </div>
    )
}
