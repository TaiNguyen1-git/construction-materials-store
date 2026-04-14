'use client'

import React from 'react'
import { Ruler, ImageIcon, Upload, X, Plus, Sparkles, Calculator, Loader2 } from 'lucide-react'
import { PROJECT_TYPES } from '../types'

interface InputPanelProps {
    projectType: string
    setProjectType: (val: any) => void
    inputMode: 'text' | 'image'
    setInputMode: (val: 'text' | 'image') => void
    description: string
    setDescription: (val: string) => void
    imagesPreview: string[]
    onImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => void
    onRemoveImage: (idx: number) => void
    onEstimate: () => void
    loading: boolean
    fileInputRef: React.RefObject<HTMLInputElement | null>
}

export default function InputPanel({
    projectType, setProjectType,
    inputMode, setInputMode,
    description, setDescription,
    imagesPreview, onImageUpload, onRemoveImage,
    onEstimate, loading,
    fileInputRef
}: InputPanelProps) {
    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-left-4 duration-500">
            {/* Project Type Selection */}
            <div className="bg-white rounded-[2rem] shadow-xl border border-slate-50 p-8">
                <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-6">Bước 1: Chọn quy mô công việc</h2>
                <div className="grid grid-cols-4 gap-3">
                    {PROJECT_TYPES.map((type) => (
                        <button
                            key={type.id}
                            onClick={() => setProjectType(type.id)}
                            className={`p-3 rounded-2xl border transition-all flex flex-col items-center gap-2.5 ${projectType === type.id
                                ? 'border-indigo-600 bg-indigo-50 shadow-lg shadow-indigo-100/50'
                                : 'border-slate-50 hover:border-indigo-200 hover:bg-slate-50'
                                }`}
                        >
                            <div className={`w-10 h-10 ${type.color} rounded-xl flex items-center justify-center shadow-md`}>
                                <type.icon className="w-5 h-5 text-white" />
                            </div>
                            <span className={`text-[10px] font-black uppercase tracking-tighter ${projectType === type.id ? 'text-indigo-700' : 'text-slate-500'}`}>
                                {type.name}
                            </span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Input Mode Toggle */}
            <div className="bg-white rounded-[2rem] shadow-xl border border-slate-50 p-8">
                <div className="flex gap-2 mb-6 bg-slate-50 p-1.5 rounded-2xl border border-slate-100">
                    <button
                        onClick={() => setInputMode('text')}
                        className={`flex-1 py-3 px-4 rounded-xl text-[10px] font-black transition-all flex items-center justify-center gap-2 uppercase tracking-widest ${inputMode === 'text'
                            ? 'bg-white text-indigo-600 shadow-xl'
                            : 'text-slate-400 hover:text-slate-600'
                            }`}
                    >
                        <Ruler className="w-4 h-4" />
                        MÔ TẢ DỰ ÁN
                    </button>
                    <button
                        onClick={() => setInputMode('image')}
                        className={`flex-1 py-3 px-4 rounded-xl text-[10px] font-black transition-all flex items-center justify-center gap-2 uppercase tracking-widest ${inputMode === 'image'
                            ? 'bg-white text-indigo-600 shadow-xl'
                            : 'text-slate-400 hover:text-slate-600'
                            }`}
                    >
                        <ImageIcon className="w-4 h-4" />
                        TẢI BẢN VẼ
                    </button>
                </div>

                {inputMode === 'text' ? (
                    <div className="animate-in fade-in duration-500">
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Mô tả dự án của bạn (VD: Lát sân vườn 6x8m, xây tường rào dài 20m cao 2.5m...)"
                            className="w-full h-32 bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 text-sm text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition-all resize-none leading-relaxed font-medium"
                        />
                        <p className="text-[10px] text-slate-400 mt-4 font-black uppercase tracking-widest flex items-center gap-2">
                            <Sparkles className="w-3 h-3 text-indigo-400" /> 💡 Mẹo: Mô tả chi tiết diện tích để AI tính chính xác hơn.
                        </p>
                    </div>
                ) : (
                    <div className="animate-in fade-in duration-300">
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            multiple
                            onChange={onImageUpload}
                            className="hidden"
                        />

                        {imagesPreview.length > 0 ? (
                            <div className="space-y-2">
                                <div className="grid grid-cols-3 gap-2">
                                    {imagesPreview.map((src, idx) => (
                                        <div key={idx} className="relative group aspect-square">
                                            <img
                                                src={src}
                                                alt={`Preview ${idx + 1}`}
                                                className="w-full h-full object-cover bg-gray-50 rounded-lg border border-gray-100"
                                            />
                                            <button
                                                onClick={() => onRemoveImage(idx)}
                                                className="absolute -top-1.5 -right-1.5 bg-red-500 text-white w-5 h-5 rounded-full hover:bg-red-600 flex items-center justify-center text-xs shadow-lg transition-transform group-hover:scale-110"
                                            >
                                                <X className="w-3 h-3" />
                                            </button>
                                        </div>
                                    ))}
                                    <button
                                        onClick={() => fileInputRef.current?.click()}
                                        className="aspect-square border-2 border-dashed border-gray-100 rounded-lg flex items-center justify-center hover:bg-blue-50 hover:border-blue-300 transition-all font-black text-slate-300"
                                    >
                                        <Plus className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                className="w-full h-48 border-2 border-dashed border-slate-200 rounded-[2rem] flex flex-col items-center justify-center gap-4 hover:border-indigo-400 hover:bg-indigo-50/30 transition-all group overflow-hidden relative"
                            >
                                <div className="w-16 h-16 bg-indigo-50 rounded-3xl flex items-center justify-center group-hover:scale-110 group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-lg border border-indigo-100 group-hover:border-indigo-600">
                                    <Upload className="w-7 h-7" />
                                </div>
                                <div className="text-center">
                                    <p className="text-xs font-black text-slate-700 uppercase tracking-widest">Bấm để tải bản vẽ lên</p>
                                    <p className="text-[10px] text-slate-400 font-bold mt-1">Hệ thống nhận diện mặt bằng & ảnh chụp</p>
                                </div>
                            </button>
                        )}
                    </div>
                )}



                <button
                    onClick={onEstimate}
                    disabled={loading}
                    className="w-full mt-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:from-gray-300 disabled:to-gray-300 text-white py-3 rounded-lg text-sm font-black transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-100"
                >
                    {loading ? (
                        <span className="flex items-center gap-2">
                            <Loader2 className="w-4 h-4 animate-spin" />
                            ĐANG PHÂN TÍCH...
                        </span>
                    ) : (
                        <span className="flex items-center gap-2">
                            <Calculator className="w-4 h-4" />
                            PHÂN TÍCH VẬT LIỆU AI
                        </span>
                    )}
                </button>
            </div>
        </div>
    )
}
