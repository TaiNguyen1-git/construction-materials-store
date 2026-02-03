'use client'

import React from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { ShoppingCart, Package, Heart, BarChart2 } from 'lucide-react'
import { useCartStore } from '@/stores/cartStore'
import toast from 'react-hot-toast'
import WishlistButton from '@/components/WishlistButton'
import ComparisonButton from '@/components/ComparisonButton'
import { getUnitFromProductName } from '@/lib/unit-utils'
import { formatNumber } from '@/lib/utils'

interface ProductCardProps {
    product: {
        id: string
        name: string
        price: number
        images?: string[]
        sku?: string
        unit?: string
        category?: { name: string }
        inventoryItem?: { availableQuantity: number }
    }
    viewMode?: 'grid' | 'list'
}

export default function ProductCard({ product, viewMode = 'grid' }: ProductCardProps) {
    const { addItem, openCart } = useCartStore()

    const handleAddToCart = (e: React.MouseEvent) => {
        e.preventDefault()
        e.stopPropagation()

        const dynamicUnit = product.unit && product.unit !== 'pcs'
            ? product.unit
            : getUnitFromProductName(product.name)

        addItem({
            id: product.id,
            productId: product.id,
            name: product.name,
            price: product.price,
            sku: product.sku || '',
            unit: dynamicUnit,
            image: product.images?.[0],
            maxStock: product.inventoryItem?.availableQuantity || 999
        })

        toast.success(`Đã thêm vào giỏ hàng (${dynamicUnit})`)
        openCart()
    }

    if (viewMode === 'list') {
        return (
            <div className="bg-white rounded-[2.5rem] border border-slate-100/50 hover:shadow-[0_30px_60px_-15px_rgba(0,0,0,0.05)] hover:border-indigo-100 transition-all duration-700 overflow-hidden group relative">
                <div className="flex flex-col sm:flex-row gap-6 p-5">
                    {/* Image Section */}
                    <div className="relative w-full sm:w-40 h-40 bg-slate-50/50 rounded-[1.8rem] overflow-hidden flex-shrink-0 group/img">
                        <div className="absolute inset-0 bg-gradient-to-tr from-white/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
                        {product.images?.[0] ? (
                            <Image
                                src={product.images[0]}
                                alt={product.name}
                                fill
                                className="object-contain group-hover/img:scale-110 transition-transform duration-700 p-6 relative z-10"
                            />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-slate-200 relative z-10">
                                <Package className="h-10 w-10 opacity-20" />
                            </div>
                        )}

                        {/* Status Badge */}
                        <div className="absolute top-3 left-3 z-20">
                            <span className="backdrop-blur-md bg-white/70 text-[8px] font-black text-slate-800 uppercase tracking-widest px-2 py-1 rounded-md border border-white/40 shadow-sm">
                                {product.category?.name || 'Vật liệu'}
                            </span>
                        </div>
                    </div>

                    {/* Content Section */}
                    <div className="flex-1 flex flex-col justify-between py-1">
                        <div>
                            <div className="flex items-start justify-between gap-4 mb-2">
                                <Link href={`/products/${product.id}`} className="flex-1">
                                    <h3 className="text-base font-bold text-slate-900 group-hover:text-indigo-600 transition-colors leading-tight line-clamp-2">
                                        {product.name}
                                    </h3>
                                </Link>
                                <div className="flex items-center gap-1.5 flex-shrink-0">
                                    <div className="backdrop-blur-xl bg-slate-50 p-0.5 rounded-full border border-slate-100">
                                        <ComparisonButton product={product as any} size="sm" />
                                    </div>
                                    <div className="backdrop-blur-xl bg-slate-50 p-0.5 rounded-full border border-slate-100">
                                        <WishlistButton product={product as any} size="sm" />
                                    </div>
                                </div>
                            </div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest opacity-60 mb-4">SKU: {product.sku || '---'}</p>

                            <div className="flex flex-wrap gap-4 items-end">
                                <div>
                                    <p className="text-[9px] font-black text-indigo-400 uppercase tracking-[0.2em] mb-0.5">Giá tốt nhất</p>
                                    <span className="text-xl font-black text-slate-900 tracking-tighter flex items-center gap-1 leading-none">
                                        {formatNumber(product.price)}
                                        <span className="text-[10px] font-black uppercase text-slate-400">VND</span>
                                    </span>
                                </div>
                                <span className={`text-[10px] font-bold px-3 py-1 rounded-lg border ${(!product.inventoryItem || product.inventoryItem.availableQuantity > 0) ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-rose-50 text-rose-600 border-rose-100'}`}>
                                    {(!product.inventoryItem || product.inventoryItem.availableQuantity > 0)
                                        ? `Sẵn kho: ${product.inventoryItem?.availableQuantity || 'Nhiều'}`
                                        : 'Liên hệ đặt hàng'}
                                </span>
                            </div>
                        </div>

                        <div className="mt-6 sm:mt-0 flex justify-end">
                            <button
                                onClick={handleAddToCart}
                                className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3 rounded-2xl font-bold text-xs transition-all shadow-xl shadow-indigo-100 flex items-center justify-center gap-2 group/btn"
                            >
                                <ShoppingCart size={16} className="group-hover/btn:scale-110 transition-transform" />
                                Thêm vào giỏ
                            </button>
                        </div>
                    </div>
                </div>
                {/* Hover overlay hint */}
                <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-transparent via-indigo-600 to-transparent scale-x-0 group-hover:scale-x-100 transition-transform duration-700"></div>
            </div>
        )
    }

    return (
        <div className="bg-white rounded-[2.5rem] border border-slate-100/50 hover:shadow-[0_40px_80px_-15px_rgba(0,0,0,0.08)] hover:border-indigo-200 transition-all duration-700 overflow-hidden group flex flex-col h-full relative hover:z-30">
            {/* Image Container with advanced backdrop */}
            <div className="relative aspect-square bg-[#f8fafc] overflow-hidden group/img p-6">
                <div className="absolute inset-0 bg-gradient-to-tr from-white/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>

                {product.images?.[0] ? (
                    <Image
                        src={product.images[0]}
                        alt={product.name}
                        fill
                        className="object-contain group-hover/img:scale-105 group-hover/img:-rotate-1 transition-all duration-1000 ease-out p-8 relative z-10"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-200 relative z-10">
                        <Package className="h-16 w-16 opacity-20" />
                    </div>
                )}

                {/* Glass actions */}
                <div className="absolute top-5 right-5 z-20 flex flex-col gap-2.5 translate-x-12 group-hover:translate-x-0 transition-transform duration-700 delay-75">
                    <div className="backdrop-blur-xl bg-white/60 p-0.5 rounded-full shadow-lg border border-white/20">
                        <WishlistButton product={product as any} size="sm" />
                    </div>
                </div>

                {/* Elite Badges */}
                <div className="absolute bottom-5 left-5 z-20 flex flex-wrap gap-2 translate-y-2 group-hover:translate-y-0 transition-transform duration-500">
                    <span className="backdrop-blur-xl bg-white/80 text-[9px] font-black text-slate-800 uppercase tracking-widest px-3 py-1.5 rounded-lg border border-white/40 shadow-sm">
                        {product.category?.name || 'Vật liệu'}
                    </span>
                    {product.inventoryItem?.availableQuantity && product.inventoryItem.availableQuantity <= 10 && product.inventoryItem.availableQuantity > 0 && (
                        <span className="backdrop-blur-xl bg-rose-500/90 text-white text-[9px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg shadow-lg animate-pulse border border-rose-400">
                            LOW STOCK
                        </span>
                    )}
                </div>
            </div>

            {/* Content with high-end typography */}
            <div className="p-7 flex-1 flex flex-col relative bg-white">
                <div className="mb-3">
                    <Link href={`/products/${product.id}`}>
                        <h3 className="text-sm font-bold text-slate-900 leading-[1.6] line-clamp-2 min-h-[2.8rem] group-hover:text-indigo-600 transition-colors tracking-tight">
                            {product.name}
                        </h3>
                    </Link>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1 opacity-60">SKU: {product.sku || '---'}</p>
                </div>

                <div className="mt-auto pt-6 flex items-end justify-between border-t border-slate-50/80">
                    <div>
                        <p className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em] mb-1">Giá tốt nhất</p>
                        <span className="text-xl font-black text-slate-900 tracking-tighter flex items-center gap-1">
                            {formatNumber(product.price)}
                            <span className="text-[10px] font-black uppercase text-slate-400">VND</span>
                        </span>
                    </div>

                    <button
                        onClick={handleAddToCart}
                        className="relative w-11 h-11 bg-white border border-slate-100 hover:border-indigo-600 hover:bg-indigo-600 hover:text-white text-slate-900 rounded-2xl transition-all duration-500 flex items-center justify-center shadow-sm group/btn"
                        title="Thêm vào giỏ"
                    >
                        <ShoppingCart size={18} className="group-hover/btn:scale-110 transition-transform" />
                        <div className="absolute -top-1 -right-1 w-3 h-3 bg-indigo-500 rounded-full scale-0 group-hover:scale-100 transition-transform border-2 border-white"></div>
                    </button>
                </div>
            </div>

            {/* Hover overlay hint */}
            <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-transparent via-indigo-600 to-transparent scale-x-0 group-hover:scale-x-100 transition-transform duration-700"></div>
        </div>
    )
}
