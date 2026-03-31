'use client'

import React from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { ShoppingCart, Package, Zap, Star, TrendingDown } from 'lucide-react'
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
        wholesalePrice?: number
        minWholesaleQty?: number
        isFeatured?: boolean
    }
    viewMode?: 'grid' | 'list'
}

// Premium gradient placeholder based on category name
function getPlaceholderGradient(name: string): string {
    const gradients = [
        'from-indigo-500 via-purple-500 to-pink-500',
        'from-blue-600 via-cyan-500 to-teal-400',
        'from-orange-500 via-amber-500 to-yellow-400',
        'from-slate-600 via-slate-500 to-slate-400',
        'from-emerald-600 via-green-500 to-teal-400',
        'from-rose-500 via-red-500 to-orange-400',
    ]
    const idx = name.charCodeAt(0) % gradients.length
    return gradients[idx]
}

export default function ProductCard({ product, viewMode = 'grid' }: ProductCardProps) {
    const { addItem, openCart } = useCartStore()
    const isOutOfStock = product.inventoryItem?.availableQuantity === 0
    const isLowStock = product.inventoryItem?.availableQuantity !== undefined &&
        product.inventoryItem.availableQuantity > 0 &&
        product.inventoryItem.availableQuantity <= 10
    const hasWholesale = !!product.wholesalePrice
    const gradientClass = getPlaceholderGradient(product.name)

    const handleAddToCart = (e: React.MouseEvent) => {
        e.preventDefault()
        e.stopPropagation()

        if (isOutOfStock) {
            toast.error('Sản phẩm đã hết hàng!')
            return
        }

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
            maxStock: product.inventoryItem?.availableQuantity || 999,
            wholesalePrice: product.wholesalePrice,
            minWholesaleQty: product.minWholesaleQty,
        })

        toast.success(`Đã thêm vào giỏ hàng (${dynamicUnit})`)
        openCart()
    }

    // ───── LIST MODE ─────
    if (viewMode === 'list') {
        return (
            <div className="group relative bg-white rounded-3xl border border-slate-100 hover:border-indigo-200 hover:shadow-[0_20px_60px_-10px_rgba(79,70,229,0.12)] transition-all duration-500 overflow-hidden">
                {/* Accent line */}
                <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-indigo-600 via-violet-500 to-purple-600 scale-x-0 group-hover:scale-x-100 transition-transform duration-500" />

                <div className="flex flex-col sm:flex-row gap-0 p-0 overflow-hidden">
                    {/* Image */}
                    <Link href={`/products/${product.id}`} className="relative w-full sm:w-52 h-48 sm:h-auto bg-gradient-to-br from-slate-50 to-slate-100 flex-shrink-0 overflow-hidden">
                        {product.images?.[0] ? (
                            <Image src={product.images[0]} alt={product.name} fill
                                className="object-contain p-6 group-hover:scale-110 transition-transform duration-700" />
                        ) : (
                            <div className={`w-full h-full flex flex-col items-center justify-center bg-gradient-to-br ${gradientClass} gap-2`}>
                                <Package className="h-10 w-10 text-white/60" />
                                <span className="text-white/80 text-[10px] font-black uppercase tracking-widest px-4 text-center line-clamp-2">{product.name}</span>
                            </div>
                        )}
                        {/* Category pill */}
                        <div className="absolute top-3 left-3">
                            <span className="backdrop-blur-md bg-white/80 text-[9px] font-black text-slate-700 uppercase tracking-widest px-2.5 py-1 rounded-full border border-white/60 shadow-sm">
                                {product.category?.name || 'Vật liệu'}
                            </span>
                        </div>
                    </Link>

                    {/* Content */}
                    <div className="flex-1 flex flex-col justify-between p-6 gap-4">
                        <div>
                            <div className="flex items-start justify-between gap-3 mb-2">
                                <Link href={`/products/${product.id}`} className="flex-1">
                                    <h3 className="text-base font-bold text-slate-900 group-hover:text-indigo-600 transition-colors leading-tight line-clamp-2">
                                        {product.name}
                                    </h3>
                                </Link>
                                <div className="flex items-center gap-1.5 shrink-0">
                                    <div className="bg-slate-50 rounded-full p-0.5 border border-slate-100">
                                        <ComparisonButton product={product as any} size="sm" />
                                    </div>
                                    <div className="bg-slate-50 rounded-full p-0.5 border border-slate-100">
                                        <WishlistButton product={product as any} size="sm" />
                                    </div>
                                </div>
                            </div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">SKU: {product.sku || '---'}</p>

                            <div className="flex flex-wrap gap-2 mb-4">
                                {isLowStock && (
                                    <span className="bg-orange-50 text-orange-600 text-[9px] font-black uppercase tracking-wide px-2.5 py-1 rounded-full border border-orange-100">
                                        ⚡ Sắp hết hàng
                                    </span>
                                )}
                                {isOutOfStock && (
                                    <span className="bg-rose-50 text-rose-600 text-[9px] font-black uppercase tracking-wide px-2.5 py-1 rounded-full border border-rose-100">
                                        🚫 Hết hàng
                                    </span>
                                )}
                                {hasWholesale && (
                                    <span className="bg-emerald-50 text-emerald-700 text-[9px] font-black uppercase tracking-wide px-2.5 py-1 rounded-full border border-emerald-100">
                                        💰 Có giá sỉ
                                    </span>
                                )}
                                {product.isFeatured && (
                                    <span className="bg-amber-50 text-amber-600 text-[9px] font-black uppercase tracking-wide px-2.5 py-1 rounded-full border border-amber-100">
                                        ⭐ Nổi bật
                                    </span>
                                )}
                            </div>
                        </div>

                        <div className="flex items-center justify-between gap-4 pt-4 border-t border-slate-50">
                            <div>
                                {hasWholesale && (
                                    <p className="text-[9px] font-black text-emerald-600 uppercase tracking-widest mb-0.5 flex items-center gap-1">
                                        <TrendingDown size={10} /> Từ {formatNumber(product.wholesalePrice!)} VND/sỉ
                                    </p>
                                )}
                                <div className="flex items-baseline gap-1.5">
                                    <span className="text-2xl font-black text-slate-900 tracking-tighter">{formatNumber(product.price)}</span>
                                    <span className="text-[10px] font-black uppercase text-slate-400">VND</span>
                                </div>
                            </div>
                            <button
                                onClick={handleAddToCart}
                                disabled={isOutOfStock}
                                className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-wider transition-all duration-300 shadow-lg group/btn ${isOutOfStock
                                    ? 'bg-slate-100 text-slate-400 cursor-not-allowed shadow-none'
                                    : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-200 hover:shadow-xl hover:scale-105 active:scale-95'
                                    }`}
                            >
                                <ShoppingCart size={15} className="group-hover/btn:scale-110 transition-transform" />
                                {isOutOfStock ? 'Hết hàng' : 'Thêm vào giỏ'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    // ───── GRID MODE ─────
    return (
        <div className="group relative bg-white rounded-3xl border border-slate-100 hover:border-indigo-200 hover:shadow-[0_30px_70px_-15px_rgba(79,70,229,0.15)] transition-all duration-500 overflow-hidden flex flex-col h-full hover:-translate-y-1">
            {/* Top accent */}
            <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-indigo-600 via-violet-500 to-purple-600 scale-x-0 group-hover:scale-x-100 transition-transform duration-500 z-10" />

            {/* Image area */}
            <div className="relative aspect-square overflow-hidden bg-gradient-to-br from-slate-50 to-slate-100">
                <Link href={`/products/${product.id}`} className="block w-full h-full">
                    {product.images?.[0] ? (
                        <Image
                            src={product.images[0]}
                            alt={product.name}
                            fill
                            className="object-contain p-8 group-hover:scale-110 transition-transform duration-700 ease-out"
                        />
                    ) : (
                        <div className={`w-full h-full flex flex-col items-center justify-center bg-gradient-to-br ${gradientClass} gap-3`}>
                            <Package className="h-12 w-12 text-white/60" />
                            <span className="text-white/80 text-[10px] font-black uppercase tracking-widest px-6 text-center line-clamp-3 leading-relaxed">{product.name}</span>
                        </div>
                    )}
                </Link>

                {/* Actions (Wishlist & Comparison) - Top Right */}
                <div className="absolute top-3 right-3 z-20 flex flex-col gap-2 opacity-0 group-hover:opacity-100 translate-x-4 group-hover:translate-x-0 transition-all duration-300">
                    <div className="backdrop-blur-xl bg-white/90 rounded-full p-1 shadow-sm border border-slate-100 text-slate-400 hover:text-rose-500 transition-colors">
                        <WishlistButton product={product as any} size="sm" />
                    </div>
                    <div className="backdrop-blur-xl bg-white/90 rounded-full p-1 shadow-sm border border-slate-100 text-slate-400 hover:text-indigo-600 transition-colors">
                        <ComparisonButton product={product as any} size="sm" />
                    </div>
                </div>

                {/* Dynamic Badges - Top Left to avoid overlap */}
                <div className="absolute top-3 left-3 z-20 flex flex-col items-start gap-1.5 pointer-events-none">
                    {isLowStock && (
                        <span className="bg-orange-500 text-white text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-md shadow-sm shadow-orange-200 animate-pulse flex items-center gap-1">
                            <Zap size={10} /> SẮP HẾT
                        </span>
                    )}
                    {isOutOfStock && (
                        <span className="bg-rose-500 text-white text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-md shadow-sm shadow-rose-200 flex items-center gap-1">
                            🚫 HẾT HÀNG
                        </span>
                    )}
                    {hasWholesale && (
                        <span className="bg-emerald-500 text-white text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-md shadow-sm shadow-emerald-200 flex items-center gap-1">
                            💰 GIÁ SỈ
                        </span>
                    )}
                    {product.isFeatured && (
                        <span className="bg-gradient-to-r from-amber-500 to-orange-500 text-white text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-md shadow-sm shadow-amber-200 flex items-center gap-1">
                            <Star size={10} fill="currentColor" /> NỔI BẬT
                        </span>
                    )}
                </div>
            </div>

            {/* Content */}
            <div className="p-5 flex-1 flex flex-col">
                {/* Category chip */}
                <span className="inline-block text-[9px] font-black text-indigo-500 uppercase tracking-widest bg-indigo-50 px-2.5 py-1.5 rounded-md mb-3 self-start border border-indigo-100">
                    {product.category?.name || 'Vật liệu'}
                </span>

                <Link href={`/products/${product.id}`} className="flex-1">
                    <h3 className="text-sm font-bold text-slate-900 leading-snug line-clamp-2 min-h-[2.6rem] group-hover:text-indigo-600 transition-colors mb-1">
                        {product.name}
                    </h3>
                </Link>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4 opacity-70">
                    SKU: {product.sku || '---'}
                </p>

                {/* Price & Cart button */}
                <div className="mt-auto flex items-end justify-between gap-2 pt-4 border-t border-slate-50">
                    <div>
                        {hasWholesale && (
                            <p className="text-[10px] font-black text-emerald-600 flex items-center gap-1 mb-1 bg-emerald-50 px-2 py-0.5 rounded-md w-fit">
                                <TrendingDown size={11} /> Sỉ từ {formatNumber(product.wholesalePrice!)}đ
                            </p>
                        )}
                        <div className="flex items-baseline gap-1">
                            <span className="text-xl font-black text-slate-900 tracking-tighter leading-none">
                                {formatNumber(product.price)}
                            </span>
                            <span className="text-[10px] font-black uppercase text-slate-400 leading-none">VND</span>
                        </div>
                    </div>

                    <button
                        onClick={handleAddToCart}
                        disabled={isOutOfStock}
                        title={isOutOfStock ? 'Hết hàng' : 'Thêm vào giỏ'}
                        className={`relative w-11 h-11 rounded-xl flex items-center justify-center transition-all duration-300 border group/btn shrink-0 ${isOutOfStock
                            ? 'bg-slate-50 border-slate-100 text-slate-300 cursor-not-allowed'
                            : 'bg-white border-slate-200 text-slate-700 hover:bg-indigo-600 hover:border-indigo-600 hover:text-white hover:shadow-lg hover:shadow-indigo-200 active:scale-90'
                            }`}
                    >
                        <ShoppingCart size={18} className="group-hover/btn:scale-110 transition-transform" />
                        {!isOutOfStock && (
                            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-indigo-500 rounded-full scale-0 group-hover/btn:scale-100 transition-transform border-2 border-white" />
                        )}
                    </button>
                </div>
            </div>
        </div>
    )
}
