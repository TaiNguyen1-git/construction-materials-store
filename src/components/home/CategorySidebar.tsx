'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { LayoutGrid, ChevronRight, Package, TrendingUp, ArrowRight } from 'lucide-react'

interface Category {
    id: string
    name: string
    children?: { name: string }[]
}

interface CategorySidebarProps {
    categories: Category[]
    getSubCategories: (cat: Category) => string[]
    getSuggestedProducts: (cat: Category) => { name: string; price: string }[]
    selectedSubCategories: string[]
    setSelectedSubCategories: React.Dispatch<React.SetStateAction<string[]>>
}

export default function CategorySidebar({
    categories,
    getSubCategories,
    getSuggestedProducts,
    selectedSubCategories,
    setSelectedSubCategories
}: CategorySidebarProps) {
    const [hoveredCategory, setHoveredCategory] = useState<Category | null>(null)
    const [isClosing, setIsClosing] = useState<NodeJS.Timeout | null>(null)

    const handleMouseEnter = (cat: Category) => {
        if (isClosing) {
            clearTimeout(isClosing)
            setIsClosing(null)
        }
        setHoveredCategory(cat)
    }

    const handleMouseLeave = () => {
        const timeout = setTimeout(() => {
            setHoveredCategory(null)
        }, 150) // Small delay to allow moving to the mega menu
        setIsClosing(timeout)
    }

    return (
        <div
            className="lg:col-span-3 bg-white rounded-[2rem] shadow-xl self-start border border-slate-100 relative group/sidebar"
            onMouseLeave={handleMouseLeave}
        >
            <div className="bg-slate-50/50 px-6 py-5 border-b border-slate-100 flex items-center justify-between rounded-t-[2rem]">
                <span className="font-black text-slate-800 flex items-center gap-3 text-sm uppercase tracking-widest">
                    <LayoutGrid className="w-5 h-5 text-indigo-600" /> Ngành Hàng
                </span>
            </div>

            <div className="py-2">
                {(categories.length > 0 ? categories : [
                    { id: '1', name: 'Xi măng - Bê tông' },
                    { id: '2', name: 'Sắt thép xây dựng' },
                    { id: '3', name: 'Gạch - Cát - Đá' },
                    { id: '4', name: 'Sơn - Chống thấm' },
                    { id: '5', name: 'Điện - Nước' }
                ]).map((cat) => (
                    <div
                        key={cat.id}
                        onMouseEnter={() => handleMouseEnter(cat)}
                        className="relative"
                    >
                        <Link
                            href={`/products?category=${cat.id}`}
                            className={`flex items-center justify-between px-6 py-4 transition-all border-b border-slate-50 last:border-0 group/item
                ${hoveredCategory?.id === cat.id ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:text-indigo-600'}
              `}
                        >
                            <span className="text-sm font-bold">{cat.name}</span>
                            <ChevronRight className={`w-4 h-4 transition-all ${hoveredCategory?.id === cat.id ? 'text-indigo-400 translate-x-1' : 'text-slate-300'}`} />
                        </Link>
                    </div>
                ))}
            </div>

            {/* Mega Menu Panel */}
            {hoveredCategory && (
                <div
                    className="absolute top-0 left-full ml-4 w-[700px] min-h-[450px] bg-white shadow-[0_30px_100px_rgba(0,0,0,0.15)] border border-slate-50 rounded-[2.5rem] p-10 z-50 animate-in fade-in slide-in-from-left-4 duration-500"
                    onMouseEnter={() => {
                        if (isClosing) {
                            clearTimeout(isClosing)
                            setIsClosing(null)
                        }
                    }}
                >
                    {/* Invisible bridge to prevent menu from closing when moving mouse from sidebar */}
                    <div className="absolute top-0 -left-6 w-6 h-full bg-transparent z-[-1]" />

                    <div className="flex flex-col h-full">
                        <div className="flex items-center justify-between mb-8 border-b border-slate-50 pb-6">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center">
                                    <Package className="w-6 h-6 text-indigo-600" />
                                </div>
                                <div>
                                    <h4 className="text-lg font-black text-slate-900 tracking-tight">{hoveredCategory.name}</h4>
                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">Vật liệu thi công & hoàn thiện</p>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-12">
                            <div>
                                <p className="text-[10px] font-black text-indigo-600 mb-5 uppercase tracking-[0.2em]">Phân loại sản phẩm</p>
                                <div className="flex flex-wrap gap-2.5">
                                    {getSubCategories(hoveredCategory).map((sub, idx) => {
                                        const isSelected = selectedSubCategories.includes(sub)
                                        return (
                                            <button
                                                key={idx}
                                                onClick={(e) => {
                                                    e.preventDefault()
                                                    e.stopPropagation()
                                                    setSelectedSubCategories(prev =>
                                                        isSelected ? prev.filter(i => i !== sub) : [...prev, sub]
                                                    )
                                                }}
                                                className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all border ${isSelected
                                                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-lg shadow-indigo-100'
                                                    : 'bg-slate-50 text-slate-600 border-slate-100 hover:border-indigo-200 hover:text-indigo-600'
                                                    }`}
                                            >
                                                {sub}
                                            </button>
                                        )
                                    })}
                                </div>
                            </div>

                            <div className="bg-slate-50/50 rounded-3xl p-6 border border-slate-100">
                                <p className="text-[10px] font-black text-indigo-600 mb-5 uppercase tracking-[0.2em]">Sản phẩm tiêu biểu</p>
                                <div className="space-y-3">
                                    {getSuggestedProducts(hoveredCategory).map((prod, idx) => (
                                        <Link
                                            key={idx}
                                            href={`/products?q=${prod.name}`}
                                            className="group/prod flex items-center justify-between p-3 rounded-2xl hover:bg-white transition-all border border-transparent hover:border-slate-100 hover:shadow-sm"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-xl bg-white flex items-center justify-center text-indigo-400 group-hover/prod:bg-indigo-600 group-hover/prod:text-white transition-all shadow-sm">
                                                    <TrendingUp className="w-4 h-4" />
                                                </div>
                                                <span className="text-xs font-bold text-slate-700">{prod.name}</span>
                                            </div>
                                            <span className="text-[11px] font-black text-indigo-600">{prod.price}</span>
                                        </Link>
                                    ))}

                                    <Link
                                        href={`/products?category=${hoveredCategory.id}`}
                                        className="flex items-center justify-center gap-2 mt-6 text-[10px] font-black text-indigo-600 hover:gap-3 transition-all uppercase tracking-widest"
                                    >
                                        Xem tất cả sản phẩm <ArrowRight className="w-3 h-3" />
                                    </Link>
                                </div>
                            </div>
                        </div>

                        {selectedSubCategories.length > 0 && (
                            <div className="mt-auto pt-8 flex items-center justify-between border-t border-slate-50">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                    Đã chọn {selectedSubCategories.length} phân loại
                                </span>
                                <div className="flex gap-4">
                                    <button onClick={() => setSelectedSubCategories([])} className="text-[10px] font-black text-rose-500 uppercase hover:underline">Xóa lọc</button>
                                    <Link
                                        href={`/products?category=${hoveredCategory.id}&tags=${selectedSubCategories.join(',')}`}
                                        className="bg-indigo-600 text-white px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100"
                                    >
                                        Áp dụng lọc ngay
                                    </Link>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}
