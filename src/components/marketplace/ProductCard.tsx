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

export default function ProductCard({ product, viewMode = 'grid' }: ProductCardProps) {
    const { addItem, openCart } = useCartStore()
    const isOutOfStock = product.inventoryItem?.availableQuantity === 0
    const isLowStock = product.inventoryItem?.availableQuantity !== undefined &&
        product.inventoryItem.availableQuantity > 0 &&
        product.inventoryItem.availableQuantity <= 10
    const hasWholesale = !!product.wholesalePrice

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
            <div className="group relative bg-white rounded-2xl border border-neutral-100 hover:border-primary-200 hover:shadow-md transition-all duration-300 overflow-hidden">
                <div className="flex flex-col sm:flex-row gap-0 p-0 overflow-hidden">
                    {/* Image */}
                    <Link href={`/products/${product.id}`} className="relative w-full sm:w-48 h-44 sm:h-auto bg-neutral-50 flex-shrink-0 overflow-hidden">
                        {product.images?.[0] ? (
                            <Image src={product.images[0]} alt={product.name} fill
                                className="object-contain p-6 group-hover:scale-105 transition-transform duration-500" />
                        ) : (
                            <div className="w-full h-full flex flex-col items-center justify-center gap-2 text-neutral-200">
                                <Package className="h-10 w-10" />
                            </div>
                        )}
                        {/* Category pill */}
                        <div className="absolute top-3 left-3">
                            <span className="bg-white text-[10px] font-bold text-neutral-600 uppercase tracking-wider px-2 py-0.5 rounded border border-neutral-100 shadow-sm">
                                {product.category?.name || 'Vật liệu'}
                            </span>
                        </div>
                    </Link>

                    {/* Content */}
                    <div className="flex-1 flex flex-col justify-between p-6 gap-4">
                        <div>
                            <div className="flex items-start justify-between gap-3 mb-2">
                                <Link href={`/products/${product.id}`} className="flex-1">
                                    <h3 className="text-base font-bold text-neutral-900 group-hover:text-primary-600 transition-colors leading-tight line-clamp-2">
                                        {product.name}
                                    </h3>
                                </Link>
                                <div className="flex items-center gap-1.5 shrink-0">
                                    <ComparisonButton product={product as any} size="sm" />
                                    <WishlistButton product={product as any} size="sm" />
                                </div>
                            </div>
                            <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider mb-4">SKU: {product.sku || '---'}</p>

                            <div className="flex flex-wrap gap-2 mb-4">
                                {isLowStock && (
                                    <span className="bg-amber-50 text-amber-600 text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded border border-amber-100">
                                        Sắp hết hàng
                                    </span>
                                )}
                                {isOutOfStock && (
                                    <span className="bg-red-50 text-red-600 text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded border border-red-100">
                                        Hết hàng
                                    </span>
                                )}
                                {hasWholesale && (
                                    <span className="bg-green-50 text-green-700 text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded border border-green-100">
                                        Có giá sỉ
                                    </span>
                                )}
                                {product.isFeatured && (
                                    <span className="bg-primary-50 text-primary-600 text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded border border-primary-100">
                                        Nổi bật
                                    </span>
                                )}
                            </div>
                        </div>

                        <div className="flex items-center justify-between gap-4 pt-4 border-t border-neutral-50">
                            <div>
                                {hasWholesale && (
                                    <p className="text-[10px] font-bold text-green-600 uppercase tracking-wide flex items-center gap-1 mb-0.5">
                                        <TrendingDown size={10} /> Sỉ từ {formatNumber(product.wholesalePrice!)}đ
                                    </p>
                                )}
                                <div className="flex items-baseline gap-1.5">
                                    <span className="text-2xl font-bold text-neutral-900">{formatNumber(product.price)}</span>
                                    <span className="text-[10px] font-bold uppercase text-neutral-400">VND</span>
                                </div>
                            </div>
                            <button
                                onClick={handleAddToCart}
                                disabled={isOutOfStock}
                                className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all duration-200 ${isOutOfStock
                                    ? 'bg-neutral-100 text-neutral-400 cursor-not-allowed'
                                    : 'bg-primary-600 hover:bg-primary-700 text-white shadow-sm active:scale-95'
                                    }`}
                            >
                                <ShoppingCart size={14} />
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
        <div className="group relative bg-white rounded-2xl border border-neutral-100 hover:border-primary-200 hover:shadow-md transition-all duration-300 overflow-hidden flex flex-col h-full hover:-translate-y-0.5">
            {/* Top accent line on hover */}
            <div className="absolute inset-x-0 top-0 h-0.5 bg-primary-600 scale-x-0 group-hover:scale-x-100 transition-transform duration-300 z-10" />

            {/* Image area */}
            <div className="relative aspect-square overflow-hidden bg-neutral-50">
                <Link href={`/products/${product.id}`} className="block w-full h-full">
                    {product.images?.[0] ? (
                        <Image
                            src={product.images[0]}
                            alt={product.name}
                            fill
                            className="object-contain p-8 group-hover:scale-105 transition-transform duration-500 ease-out"
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center">
                            <Package className="h-12 w-12 text-neutral-200" />
                        </div>
                    )}
                </Link>

                {/* Action Buttons (Wishlist & Comparison) */}
                <div className="absolute top-3 right-3 z-20 flex flex-col gap-1.5 opacity-0 group-hover:opacity-100 translate-y-1 group-hover:translate-y-0 transition-all duration-200">
                    <div className="bg-white rounded-full p-0.5 shadow-sm border border-neutral-100">
                        <WishlistButton product={product as any} size="sm" />
                    </div>
                    <div className="bg-white rounded-full p-0.5 shadow-sm border border-neutral-100">
                        <ComparisonButton product={product as any} size="sm" />
                    </div>
                </div>

                {/* Badges */}
                <div className="absolute top-3 left-3 z-20 flex flex-col items-start gap-1 pointer-events-none">
                    {isLowStock && (
                        <span className="bg-amber-500 text-white text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded flex items-center gap-1">
                            <Zap size={8} /> Sắp hết
                        </span>
                    )}
                    {isOutOfStock && (
                        <span className="bg-neutral-500 text-white text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded">
                            Hết hàng
                        </span>
                    )}
                    {hasWholesale && !isOutOfStock && (
                        <span className="bg-green-600 text-white text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded">
                            Có giá sỉ
                        </span>
                    )}
                    {product.isFeatured && (
                        <span className="bg-primary-600 text-white text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded flex items-center gap-1">
                            <Star size={8} fill="currentColor" /> Nổi bật
                        </span>
                    )}
                </div>
            </div>

            {/* Content */}
            <div className="p-5 flex-1 flex flex-col">
                {/* Category chip */}
                <span className="inline-block text-[10px] font-bold text-primary-600 uppercase tracking-wider bg-primary-50 px-2 py-0.5 rounded mb-3 self-start border border-primary-100">
                    {product.category?.name || 'Vật liệu'}
                </span>

                <Link href={`/products/${product.id}`} className="flex-1">
                    <h3 className="text-sm font-bold text-neutral-900 leading-snug line-clamp-2 min-h-[2.6rem] group-hover:text-primary-600 transition-colors mb-1">
                        {product.name}
                    </h3>
                </Link>
                <p className="text-[10px] font-medium text-neutral-300 uppercase tracking-wider mb-4">
                    SKU: {product.sku || '---'}
                </p>

                {/* Price & Cart button */}
                <div className="mt-auto flex items-end justify-between gap-2 pt-4 border-t border-neutral-50">
                    <div>
                        {hasWholesale && (
                            <p className="text-[10px] font-bold text-green-600 flex items-center gap-1 mb-0.5">
                                <TrendingDown size={10} /> Sỉ từ {formatNumber(product.wholesalePrice!)}đ
                            </p>
                        )}
                        <div className="flex items-baseline gap-1">
                            <span className="text-lg font-bold text-neutral-900 leading-none">
                                {formatNumber(product.price)}
                            </span>
                            <span className="text-[10px] font-bold uppercase text-neutral-400 leading-none">VND</span>
                        </div>
                    </div>

                    <button
                        onClick={handleAddToCart}
                        disabled={isOutOfStock}
                        title={isOutOfStock ? 'Hết hàng' : 'Thêm vào giỏ'}
                        className={`relative w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-200 border shrink-0 ${isOutOfStock
                            ? 'bg-neutral-50 border-neutral-100 text-neutral-300 cursor-not-allowed'
                            : 'bg-white border-neutral-200 text-neutral-600 hover:bg-primary-600 hover:border-primary-600 hover:text-white active:scale-90'
                            }`}
                    >
                        <ShoppingCart size={16} />
                    </button>
                </div>
            </div>
        </div>
    )
}
