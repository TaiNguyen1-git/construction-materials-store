'use client'

import React from 'react'
import { CheckCircle, Plus, Loader2, Home, Layers, Compass } from 'lucide-react'
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

const BUILD_STYLES = [
    { id: 'nhà_cấp_4', label: 'Nhà cấp 4', icon: Home, color: 'text-emerald-600 bg-emerald-50 border-emerald-200' },
    { id: 'nhà_phố', label: 'Nhà phố', icon: Layers, color: 'text-blue-600 bg-blue-50 border-blue-200' },
    { id: 'biệt_thự', label: 'Biệt thự', icon: Compass, color: 'text-purple-600 bg-purple-50 border-purple-200' },
]

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
        <div className="bg-white rounded-3xl shadow-xl border border-slate-100 p-8 animate-in slide-in-from-right-4 duration-500 space-y-8">
            {/* Header */}
            <div className="flex items-center gap-4 pb-6 border-b border-slate-100">
                <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-200 flex-shrink-0">
                    <CheckCircle className="w-6 h-6 text-white" />
                </div>
                <div>
                    <h2 className="text-lg font-black text-slate-900 tracking-tight">Xác nhận thông số bản vẽ</h2>
                    <p className="text-xs text-slate-500 mt-0.5 font-medium">AI đã bóc tách xong — kiểm tra và sửa lại nếu cần để dự toán chính xác nhất</p>
                </div>
            </div>

            {/* Image preview if available */}
            {imagesPreview.length > 0 && (
                <div className="relative h-40 w-full rounded-2xl overflow-hidden border border-slate-100">
                    <img src={imagesPreview[0]} className="w-full h-full object-cover" alt="Bản vẽ gốc" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent flex items-end p-4">
                        <span className="text-[10px] font-black text-white uppercase tracking-widest bg-black/30 backdrop-blur-sm px-3 py-1.5 rounded-full border border-white/20">
                            Bản vẽ gốc
                        </span>
                    </div>
                </div>
            )}

            {/* Main area input */}
            <div className="bg-gradient-to-br from-indigo-600 to-blue-600 rounded-2xl p-6 shadow-xl shadow-indigo-100">
                <p className="text-[10px] font-black text-white/60 uppercase tracking-widest mb-2">Tổng diện tích xây dựng</p>
                <div className="flex items-baseline gap-3">
                    <input
                        type="number"
                        value={reviewArea}
                        onChange={(e) => setReviewArea(Number(e.target.value))}
                        className="w-full bg-transparent text-5xl font-black text-white outline-none border-none focus:ring-0 p-0 placeholder-white/30"
                    />
                    <span className="text-white/50 font-black text-2xl flex-shrink-0">m²</span>
                </div>
                <p className="text-[10px] text-white/50 mt-2 font-medium italic">* Bao gồm tất cả các mặt sàn và ban công</p>
            </div>

            {/* Build Style */}
            <div className="space-y-3">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.25em] flex items-center gap-2">
                    <span className="w-1 h-4 bg-indigo-500 rounded-full inline-block"></span>
                    Loại hình công trình
                </p>
                <div className="grid grid-cols-3 gap-3">
                    {BUILD_STYLES.map((style) => (
                        <button
                            key={style.id}
                            onClick={() => setReviewStyle(style.id)}
                            className={`flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all ${
                                reviewStyle === style.id
                                    ? style.color + ' shadow-md'
                                    : 'border-slate-100 text-slate-400 hover:border-slate-200 hover:bg-slate-50'
                            }`}
                        >
                            <style.icon className="w-5 h-5" />
                            <span className="text-[10px] font-black uppercase tracking-tight">{style.label}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Roof Type */}
            <div className="space-y-3">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.25em] flex items-center gap-2">
                    <span className="w-1 h-4 bg-blue-500 rounded-full inline-block"></span>
                    Loại mái & Kết cấu
                </p>
                <select
                    value={reviewRoofType}
                    onChange={(e) => setReviewRoofType(e.target.value)}
                    className="w-full px-4 py-3 border-2 border-slate-100 rounded-2xl focus:ring-2 focus:ring-indigo-400 focus:border-indigo-300 outline-none text-sm font-bold text-slate-700 bg-white transition-all appearance-none"
                >
                    <option value="mái_tôn">Mái tôn (Tiết kiệm)</option>
                    <option value="bê_tông">Mái bê tông phẳng (Sân thượng)</option>
                    <option value="mái_thái">Mái Thái / Mái ngói (Sang trọng)</option>
                </select>
            </div>

            {/* Rooms List */}
            <div className="space-y-3">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.25em] flex items-center gap-2">
                    <span className="w-1 h-4 bg-emerald-500 rounded-full inline-block"></span>
                    Chi tiết các phòng
                </p>
                <div className="max-h-[220px] overflow-y-auto space-y-2 pr-1">
                    {reviewRooms.map((room, idx) => (
                        <div key={idx} className="flex items-center gap-3 bg-slate-50 border border-slate-100 px-4 py-3 rounded-xl group hover:border-indigo-200 hover:bg-indigo-50/30 transition-all">
                            <span className="text-[10px] font-black text-slate-300 w-5 flex-shrink-0">{idx + 1}</span>
                            <input
                                className="flex-grow bg-transparent text-sm font-bold text-slate-700 outline-none"
                                value={room.name}
                                onChange={(e) => {
                                    const newRooms = [...reviewRooms]
                                    newRooms[idx].name = e.target.value
                                    setReviewRooms(newRooms)
                                }}
                            />
                            <div className="flex items-center gap-1.5 flex-shrink-0">
                                <input
                                    type="number"
                                    className="w-14 bg-white border-2 border-slate-100 rounded-lg px-2 py-1 text-xs font-black text-right outline-none focus:border-indigo-300 focus:ring-1 focus:ring-indigo-200 transition-all"
                                    value={room.area}
                                    onChange={(e) => {
                                        const newRooms = [...reviewRooms]
                                        newRooms[idx].area = Number(e.target.value)
                                        setReviewRooms(newRooms)
                                    }}
                                />
                                <span className="text-[9px] font-bold text-slate-400">m²</span>
                            </div>
                        </div>
                    ))}
                </div>
                <button
                    onClick={() => setReviewRooms([...reviewRooms, { name: 'Phòng mới', area: 15, length: 0, width: 0 }])}
                    className="w-full py-2.5 border-2 border-dashed border-slate-200 rounded-xl text-[10px] font-black text-slate-400 hover:border-indigo-400 hover:text-indigo-500 hover:bg-indigo-50/30 transition-all flex items-center justify-center gap-2"
                >
                    <Plus className="w-3.5 h-3.5" /> Thêm phòng
                </button>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-2 border-t border-slate-100">
                <button
                    onClick={onBack}
                    className="flex-shrink-0 px-6 py-3 rounded-2xl border-2 border-slate-200 text-[11px] font-black text-slate-500 hover:bg-slate-50 hover:border-slate-300 uppercase tracking-tight transition-all"
                >
                    Quay lại
                </button>
                <button
                    onClick={onRecalculate}
                    disabled={loading}
                    className="flex-grow bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white py-4 rounded-2xl text-xs font-black uppercase tracking-widest shadow-xl shadow-indigo-100 flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-50"
                >
                    {loading ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                        <>
                            <CheckCircle className="w-4 h-4" />
                            Xác nhận & Tính vật liệu
                        </>
                    )}
                </button>
            </div>
        </div>
    )
}
