'use client'

import React from 'react'
import { Ruler, ImageIcon, Upload, X, Plus, Sparkles, Loader2, Zap } from 'lucide-react'
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
        <div className="space-y-4 animate-in fade-in slide-in-from-left-4 duration-500">
            {/* Project Type Selection */}
            <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm hover:shadow-md transition-shadow">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.25em] mb-5 flex items-center gap-2">
                    <span className="w-1 h-4 bg-indigo-500 rounded-full inline-block"></span>
                    Bước 1 · Loại công việc
                </p>
                <div className="grid grid-cols-2 gap-3">
                    {PROJECT_TYPES.map((type) => (
                        <button
                            key={type.id}
                            onClick={() => setProjectType(type.id)}
                            className={`p-4 rounded-2xl border-2 transition-all duration-200 flex flex-col items-center gap-3 group ${
                                projectType === type.id
                                    ? 'border-indigo-500 bg-indigo-50 shadow-md shadow-indigo-100'
                                    : 'border-slate-100 hover:border-slate-200 hover:bg-slate-50'
                            }`}
                        >
                            <div className={`w-10 h-10 ${type.color} rounded-xl flex items-center justify-center shadow-md transition-transform group-hover:scale-110`}>
                                <type.icon className="w-5 h-5 text-white" />
                            </div>
                            <span className={`text-[10px] font-black uppercase tracking-tight ${
                                projectType === type.id ? 'text-indigo-700' : 'text-slate-500'
                            }`}>
                                {type.name}
                            </span>
                            {projectType === type.id && (
                                <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full"></span>
                            )}
                        </button>
                    ))}
                </div>
            </div>

            {/* Input Mode & Content */}
            <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm hover:shadow-md transition-shadow space-y-5">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.25em] flex items-center gap-2">
                    <span className="w-1 h-4 bg-indigo-500 rounded-full inline-block"></span>
                    Bước 2 · Dữ liệu đầu vào
                </p>

                {/* Tab Toggle */}
                <div className="flex gap-2 bg-slate-100 p-1.5 rounded-2xl">
                    <button
                        onClick={() => setInputMode('text')}
                        className={`flex-1 py-2.5 px-4 rounded-xl text-[10px] font-black transition-all flex items-center justify-center gap-2 uppercase tracking-widest ${
                            inputMode === 'text'
                                ? 'bg-white text-indigo-600 shadow-md border border-slate-100'
                                : 'text-slate-400 hover:text-slate-600'
                        }`}
                    >
                        <Ruler className="w-3.5 h-3.5" />
                        Mô tả dự án
                    </button>
                    <button
                        onClick={() => setInputMode('image')}
                        className={`flex-1 py-2.5 px-4 rounded-xl text-[10px] font-black transition-all flex items-center justify-center gap-2 uppercase tracking-widest ${
                            inputMode === 'image'
                                ? 'bg-white text-indigo-600 shadow-md border border-slate-100'
                                : 'text-slate-400 hover:text-slate-600'
                        }`}
                    >
                        <ImageIcon className="w-3.5 h-3.5" />
                        Tải bản vẽ
                    </button>
                </div>

                {inputMode === 'text' ? (
                    <div className="animate-in fade-in duration-300 space-y-3">
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Mô tả dự án của bạn (VD: Lát sân vườn 6x8m, xây tường rào dài 20m cao 2.5m, nhà 3 tầng 5x20m...)"
                            className="w-full h-36 bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-sm text-slate-800 placeholder-slate-400 focus:ring-2 focus:ring-indigo-400 focus:border-indigo-300 focus:bg-white outline-none transition-all resize-none leading-relaxed font-medium"
                        />
                        <p className="text-[10px] text-slate-400 font-bold flex items-center gap-2">
                            <Sparkles className="w-3 h-3 text-indigo-400" />
                            Mẹo: Mô tả chi tiết diện tích để AI tính chính xác hơn
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
                            <div className="grid grid-cols-3 gap-2">
                                {imagesPreview.map((src, idx) => (
                                    <div key={idx} className="relative group aspect-square">
                                        <img
                                            src={src}
                                            alt={`Preview ${idx + 1}`}
                                            className="w-full h-full object-cover rounded-xl border border-slate-200"
                                        />
                                        <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl flex items-center justify-center">
                                            <button
                                                onClick={() => onRemoveImage(idx)}
                                                className="bg-red-500 text-white w-7 h-7 rounded-full flex items-center justify-center shadow-lg"
                                            >
                                                <X className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                                <button
                                    onClick={() => fileInputRef.current?.click()}
                                    className="aspect-square border-2 border-dashed border-slate-200 rounded-xl flex items-center justify-center hover:bg-indigo-50 hover:border-indigo-300 transition-all text-slate-400 hover:text-indigo-500"
                                >
                                    <Plus className="w-5 h-5" />
                                </button>
                            </div>
                        ) : (
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                className="w-full h-44 border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center gap-4 hover:border-indigo-400 hover:bg-indigo-50/40 transition-all group"
                            >
                                <div className="w-14 h-14 bg-indigo-50 border border-indigo-100 rounded-2xl flex items-center justify-center group-hover:scale-110 group-hover:bg-indigo-600 group-hover:border-indigo-600 transition-all">
                                    <Upload className="w-6 h-6 text-indigo-500 group-hover:text-white transition-colors" />
                                </div>
                                <div className="text-center">
                                    <p className="text-xs font-black text-slate-700 uppercase tracking-widest">Bấm để tải bản vẽ lên</p>
                                    <p className="text-[10px] text-slate-400 font-bold mt-1">Nhận diện mặt bằng kỹ thuật & ảnh thực tế</p>
                                </div>
                            </button>
                        )}
                    </div>
                )}

                {/* CTA Button */}
                <button
                    onClick={onEstimate}
                    disabled={loading}
                    className="w-full relative overflow-hidden group bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 disabled:from-slate-300 disabled:to-slate-300 text-white py-4 rounded-2xl text-xs font-black transition-all duration-300 flex items-center justify-center gap-3 shadow-xl shadow-indigo-200 disabled:shadow-none active:scale-[0.98]"
                >
                    <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    {loading ? (
                        <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span className="uppercase tracking-widest">Đang phân tích...</span>
                        </>
                    ) : (
                        <>
                            <Zap className="w-4 h-4" />
                            <span className="uppercase tracking-widest">Phân tích vật liệu AI</span>
                        </>
                    )}
                </button>
            </div>
        </div>
    )
}
