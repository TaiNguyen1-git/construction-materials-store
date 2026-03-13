'use client'

import React from 'react'
import { Search, Package, Plus, Loader2 } from 'lucide-react'
import { Product } from '../types'

interface ProductGridProps {
    products: Product[]
    loading: boolean
    searchQuery: string
    onSearchChange: (q: string) => void
    categories: { id: string; name: string }[]
    selectedCategory: string
    onCategoryChange: (cat: string) => void
    onAddToCart: (product: Product) => void
    hasMore: boolean
    onLoadMore: () => void
    cartQuantities: Record<string, number>
}

const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount)

export default function ProductGrid({
    products,
    loading,
    searchQuery,
    onSearchChange,
    categories,
    selectedCategory,
    onCategoryChange,
    onAddToCart,
    hasMore,
    onLoadMore,
    cartQuantities
}: ProductGridProps) {
    return (
        <div className="flex-1 flex flex-col overflow-hidden">
            {/* Search & Category Filter */}
            <div className="bg-white p-5 rounded-[28px] shadow-sm border border-slate-100 flex flex-col gap-3 shrink-0">
                <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                    <input
                        type="text"
                        placeholder="Tìm sản phẩm theo tên hoặc SKU..."
                        value={searchQuery}
                        onChange={(e) => onSearchChange(e.target.value)}
                        className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-500 font-bold text-slate-700 text-sm"
                    />
                </div>
                <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
                    <button
                        onClick={() => onCategoryChange('all')}
                        className={`px-4 py-2 rounded-xl text-xs font-black whitespace-nowrap transition-all ${selectedCategory === 'all'
                            ? 'bg-blue-600 text-white shadow-lg shadow-blue-100'
                            : 'bg-slate-50 text-slate-500 hover:bg-slate-100'
                            }`}
                    >
                        Tất cả
                    </button>
                    {categories.map(cat => (
                        <button
                            key={cat.id}
                            onClick={() => onCategoryChange(cat.id)}
                            className={`px-4 py-2 rounded-xl text-xs font-black whitespace-nowrap transition-all ${selectedCategory === cat.id
                                ? 'bg-blue-600 text-white shadow-lg shadow-blue-100'
                                : 'bg-slate-50 text-slate-500 hover:bg-slate-100'
                                }`}
                        >
                            {cat.name}
                        </button>
                    ))}
                </div>
            </div>

            {/* Product Grid */}
            <div className="flex-1 overflow-y-auto mt-4 pr-1 scrollbar-thin scrollbar-thumb-slate-200">
                {loading && products.length === 0 ? (
                    <div className="flex items-center justify-center h-64">
                        <div className="flex flex-col items-center gap-3">
                            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                            <p className="text-xs font-bold text-slate-400">Đang tải sản phẩm...</p>
                        </div>
                    </div>
                ) : (
                    <>
                        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
                            {products.map(product => {
                                const imgSrc = product.images?.[0] || product.image
                                const stock = product.inventoryItem?.availableQuantity ?? product.stock ?? 0
                                const inCart = cartQuantities[product.id] || 0

                                return (
                                    <div
                                        key={product.id}
                                        onClick={() => onAddToCart(product)}
                                        className="group bg-white p-4 rounded-[24px] border border-slate-100 shadow-sm hover:shadow-xl hover:border-blue-200 transition-all cursor-pointer active:scale-[0.97] relative overflow-hidden"
                                    >
                                        {/* In-cart badge */}
                                        {inCart > 0 && (
                                            <div className="absolute top-3 left-3 z-10 w-7 h-7 bg-blue-600 text-white rounded-full flex items-center justify-center text-[11px] font-black shadow-lg shadow-blue-200 animate-in zoom-in duration-200">
                                                {inCart}
                                            </div>
                                        )}

                                        <div className="flex justify-between items-start mb-3">
                                            {/* Product image/icon */}
                                            <div className="p-2.5 bg-blue-50 text-blue-600 rounded-2xl group-hover:bg-blue-600 group-hover:text-white transition-colors overflow-hidden">
                                                {imgSrc ? (
                                                    <img src={imgSrc} alt="" className="w-7 h-7 object-cover rounded-lg" />
                                                ) : (
                                                    <Package className="w-7 h-7" />
                                                )}
                                            </div>
                                            {/* Stock badge */}
                                            <span className={`text-[10px] font-black uppercase text-white px-2 py-1 rounded-lg ${stock > 0 ? 'bg-emerald-400' : 'bg-red-400'}`}>
                                                Tồn: {stock}
                                            </span>
                                        </div>

                                        <h3 className="font-bold text-slate-900 leading-tight mb-1 line-clamp-2 min-h-[40px] text-sm">
                                            {product.name}
                                        </h3>
                                        <p className="text-[10px] text-slate-400 font-black tracking-widest uppercase mb-3">
                                            {product.sku}
                                        </p>

                                        <div className="flex items-end justify-between">
                                            <div>
                                                <p className="text-[10px] text-slate-400 font-bold">Giá bán</p>
                                                <p className="text-base font-black text-blue-600">
                                                    {formatCurrency(product.price)}
                                                </p>
                                            </div>
                                            <div className="p-2 bg-slate-50 rounded-xl group-hover:bg-blue-600 group-hover:text-white transition-all text-slate-400">
                                                <Plus className="w-5 h-5" />
                                            </div>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>

                        {products.length === 0 && !loading && (
                            <div className="flex flex-col items-center justify-center py-20 opacity-40">
                                <Search className="w-16 h-16 text-slate-300 mb-4" />
                                <p className="font-black text-slate-400 uppercase tracking-widest text-sm">Không tìm thấy sản phẩm</p>
                            </div>
                        )}

                        {hasMore && !loading && (
                            <div className="mt-6 mb-4 flex justify-center">
                                <button
                                    onClick={onLoadMore}
                                    className="px-6 py-2.5 bg-blue-50 text-blue-600 rounded-xl font-bold text-sm hover:bg-blue-100 transition-colors"
                                >
                                    Xem thêm sản phẩm
                                </button>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    )
}
