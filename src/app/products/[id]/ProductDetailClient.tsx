'use client'

import { useState, useEffect, use } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Package, ShoppingCart, Truck, Shield, RotateCcw, Plus, Minus, Star, Sparkles, ChevronLeft, ChevronRight } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import Header from '@/components/Header'
import WishlistButton from '@/components/WishlistButton'
import ComparisonButton from '@/components/ComparisonButton'
import ComparisonBar from '@/components/ComparisonBar'
import ReviewsSection from '@/components/ReviewsSection'
import { useCartStore } from '@/stores/cartStore'
import toast, { Toaster } from 'react-hot-toast'
import { getAvailableUnits, UnitConversion, convertToBase } from '@/utils/unitConverter'

interface Product {
    id: string
    name: string
    price: number
    description: string
    sku: string
    unit: string
    images: string[]
    tags: string[]
    category: {
        id: string
        name: string
    }
    inventoryItem?: {
        availableQuantity: number
    }
}

interface Recommendation {
    id: string
    name: string
    price: number
    unit: string
    images: string[]
    category: string
    inStock: boolean
    rating: number
    reviewCount: number
    reason: string
    badge: string
}

interface ProductDetailClientProps {
    initialProduct: Product
    initialSimilarProducts: Recommendation[]
}

export default function ProductDetailClient({ initialProduct, initialSimilarProducts }: ProductDetailClientProps) {
    const { addItem } = useCartStore();
    const productId = initialProduct.id;

    const [product] = useState<Product>(initialProduct)
    const [loading] = useState(false)
    const [selectedImageIndex, setSelectedImageIndex] = useState(0)
    const [quantity, setQuantity] = useState(1)
    const [availableUnits, setAvailableUnits] = useState<UnitConversion[]>([])
    const [selectedUnit, setSelectedUnit] = useState<UnitConversion | null>(null)
    const [similarProducts] = useState<Recommendation[]>(initialSimilarProducts)
    const [loadingSimilar] = useState(false)

    // No need to fetch on client anymore as we get data from props
    useEffect(() => {
        if (product) {
            const units = getAvailableUnits(product.unit)
            setAvailableUnits(units)
            setSelectedUnit(units[0])
        }
    }, [product])

    const handleQuantityChange = (change: number) => {
        const newQuantity = quantity + change
        const factor = selectedUnit?.factor || 1
        const maxQuantityInBase = product?.inventoryItem?.availableQuantity || 0
        
        if (newQuantity >= 1 && (newQuantity * factor) <= maxQuantityInBase) {
            setQuantity(newQuantity)
        } else if ((newQuantity * factor) > maxQuantityInBase) {
            const maxDisplay = Math.floor(maxQuantityInBase / factor)
            setQuantity(maxDisplay)
            toast.error(`Chỉ còn ${maxQuantityInBase} ${product?.unit} trong kho`, { id: 'max-stock' })
        }
    }

    const handleAddToCart = () => {
        if (!product || !selectedUnit) return

        const baseQuantity = convertToBase(quantity, selectedUnit.factor)

        if (!product.inventoryItem?.availableQuantity || product.inventoryItem.availableQuantity < baseQuantity) {
            toast.error('Sản phẩm đã hết hàng hoặc không đủ số lượng!')
            return
        }

        addItem({
            id: product.id,
            productId: product.id,
            name: product.name,
            price: product.price,
            sku: product.sku,
            unit: product.unit || 'pcs',
            image: product.images?.[0],
            maxStock: product.inventoryItem?.availableQuantity,
            quantity: baseQuantity,
            selectedUnit: selectedUnit.label,
            conversionFactor: selectedUnit.factor
        })

        toast.success(`Đã thêm ${quantity} ${selectedUnit.label} vào giỏ hàng!`)
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
                <Toaster position="top-right" />
                <Header />
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-pulse">
                    <Skeleton className="h-4 w-48 mb-8 rounded" />
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-12">
                        <div className="lg:col-span-5 space-y-3">
                            <Skeleton className="aspect-square w-full rounded-2xl" />
                        </div>
                        <div className="lg:col-span-7 space-y-6">
                            <Skeleton className="h-10 w-3/4 mb-2 rounded" />
                            <Skeleton className="h-24 w-full rounded-2xl" />
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    if (!product) return null

    const inStock = (product.inventoryItem?.availableQuantity || 0) > 0

    return (
        <div className="min-h-screen bg-neutral-50">
            <Toaster position="top-right" />
            <Header />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
                {/* Breadcrumbs - Cleaned up */}
                <nav className="flex items-center gap-2 text-xs text-neutral-400 mb-8 font-medium">
                    <Link href="/" className="hover:text-primary-600 transition-colors">Trang chủ</Link>
                    <span>/</span>
                    <Link href="/products" className="hover:text-primary-600 transition-colors">Sản phẩm</Link>
                    <span>/</span>
                    <span className="text-neutral-900 truncate max-w-[200px]">{product.name}</span>
                </nav>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 mb-16">
                    {/* Left: Product Images */}
                    <div className="lg:col-span-5 space-y-6">
                        <div className="relative aspect-square bg-white rounded-2xl shadow-sm overflow-hidden border border-neutral-200 group">
                            {product.images && product.images.length > 0 && product.images[selectedImageIndex] ? (
                                <>
                                    <Image
                                        src={product.images[selectedImageIndex]}
                                        alt={product.name}
                                        fill
                                        className="object-contain p-6 transition-transform duration-500 hover:scale-105"
                                        priority
                                    />
                                    {product.images.length > 1 && (
                                        <>
                                            <button 
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    setSelectedImageIndex((prev) => (prev === 0 ? product.images.length - 1 : prev - 1));
                                                }}
                                                className="absolute left-4 top-1/2 -translate-y-1/2 p-2.5 bg-white/90 backdrop-blur-sm rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-all hover:bg-white text-neutral-800 border border-neutral-100"
                                            >
                                                <ChevronLeft className="w-5 h-5" />
                                            </button>
                                            <button 
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    setSelectedImageIndex((prev) => (prev === product.images.length - 1 ? 0 : prev + 1));
                                                }}
                                                className="absolute right-4 top-1/2 -translate-y-1/2 p-2.5 bg-white/90 backdrop-blur-sm rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-all hover:bg-white text-neutral-800 border border-neutral-100"
                                            >
                                                <ChevronRight className="w-5 h-5" />
                                            </button>
                                        </>
                                    )}
                                </>
                            ) : (
                                <div className="w-full h-full flex items-center justify-center bg-neutral-50">
                                    <Package className="h-16 w-16 text-neutral-200" />
                                </div>
                            )}
                        </div>

                        {/* Thumbnails - Tighter Gallery */}
                        {product.images && product.images.length > 1 && (
                            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                                {product.images.map((img, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => setSelectedImageIndex(idx)}
                                        className={`relative w-18 h-18 rounded-xl overflow-hidden shrink-0 border-2 transition-all ${
                                            selectedImageIndex === idx 
                                                ? 'border-primary-500 shadow-sm' 
                                                : 'border-white hover:border-neutral-200'
                                        }`}
                                    >
                                        <Image src={img} alt={`${product.name} thumb-${idx}`} fill className="object-cover" />
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Right: Product Details */}
                    <div className="lg:col-span-7 flex flex-col">
                        <div className="mb-6">
                            <div className="flex items-center justify-between mb-4">
                                <span className="inline-block px-3 py-1 bg-primary-50 text-primary-600 rounded-lg text-[11px] font-semibold uppercase tracking-wider">
                                    {product.category?.name}
                                </span>
                                <div className="flex gap-3">
                                    <ComparisonButton product={product} size="sm" />
                                    <WishlistButton product={product} size="sm" />
                                </div>
                            </div>
                            <h1 className="text-3xl font-bold text-neutral-900 mb-2 leading-tight">
                                {product.name}
                            </h1>
                            <div className="text-xs text-neutral-400 font-medium">
                                SKU: <span className="text-neutral-600">{product.sku}</span>
                            </div>
                        </div>

                        <div className="flex items-center gap-4 mb-8">
                            <span className="text-3xl font-bold text-primary-600">
                                {product.price?.toLocaleString()}đ
                            </span>
                            <span className="text-lg text-neutral-400 font-medium">/ {product.unit}</span>
                            <div className={`ml-auto px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider ${inStock
                                ? 'bg-green-50 text-green-700 border border-green-100'
                                : 'bg-red-50 text-red-700 border border-red-100'
                                }`}>
                                {inStock ? 'Còn hàng' : 'Hết hàng'}
                            </div>
                        </div>

                        {/* Description Box */}
                        <div className="p-6 bg-white rounded-2xl border border-neutral-100 shadow-sm mb-8">
                            <h3 className="text-xs font-bold text-neutral-400 uppercase tracking-widest mb-3">Thông tin sản phẩm</h3>
                            <div className="text-neutral-600 text-sm leading-relaxed">
                                {product.description}
                            </div>
                        </div>

                        {inStock && (
                            <div className="space-y-8">
                                {/* Unit Picker - Simplified */}
                                {availableUnits.length > 1 && (
                                    <div className="space-y-3">
                                        <h3 className="text-xs font-bold text-neutral-400 uppercase tracking-widest">Chọn quy cách</h3>
                                        <div className="flex flex-wrap gap-2">
                                            {availableUnits.map((u) => {
                                                const maxBase = product.inventoryItem?.availableQuantity || 0;
                                                const maxForUnit = Math.floor(maxBase / u.factor);
                                                const isDisabled = maxForUnit === 0 && u.factor > 1;
                                                
                                                return (
                                                    <button
                                                        key={u.name}
                                                        disabled={isDisabled}
                                                        onClick={() => {
                                                            const currentBaseQty = quantity * (selectedUnit?.factor || 1);
                                                            const newQty = Math.floor(currentBaseQty / u.factor);
                                                            setSelectedUnit(u);
                                                            setQuantity(Math.min(newQty || 1, Math.floor(maxBase / u.factor)));
                                                        }}
                                                        className={`px-5 py-2.5 rounded-xl text-xs font-semibold transition-all border ${
                                                            isDisabled
                                                                ? 'bg-neutral-50 text-neutral-300 border-neutral-100 cursor-not-allowed'
                                                                : selectedUnit?.name === u.name
                                                                    ? 'bg-primary-600 text-white border-primary-600'
                                                                    : 'bg-white text-neutral-500 border-neutral-200 hover:border-primary-200 hover:text-primary-600'
                                                        }`}
                                                    >
                                                        {u.label}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}

                                {/* Action Bar - Minimalist Grid */}
                                <div className="flex flex-wrap gap-4 items-end">
                                    <div className="flex flex-col gap-3">
                                        <h3 className="text-xs font-bold text-neutral-400 uppercase tracking-widest">Số lượng</h3>
                                        <div className="flex items-center h-12 bg-white rounded-xl border border-neutral-200 overflow-hidden min-w-[140px]">
                                            <button 
                                                onClick={() => handleQuantityChange(-1)} 
                                                disabled={quantity <= 1} 
                                                className="w-10 h-full flex items-center justify-center text-neutral-400 hover:text-primary-600 hover:bg-neutral-50 disabled:opacity-20 transition-all font-bold"
                                            >
                                                <Minus size={16} />
                                            </button>
                                            <input 
                                                type="number"
                                                value={quantity}
                                                onChange={(e) => {
                                                    const val = parseInt(e.target.value) || 0
                                                    const factor = selectedUnit?.factor || 1
                                                    const maxBase = product?.inventoryItem?.availableQuantity || 0
                                                    setQuantity(Math.min(val, Math.floor(maxBase / factor)))
                                                }}
                                                className="w-12 h-full bg-transparent text-center font-bold text-sm text-neutral-800 outline-none"
                                            />
                                            <button 
                                                onClick={() => handleQuantityChange(1)} 
                                                disabled={selectedUnit ? (quantity + 1) * selectedUnit.factor > (product?.inventoryItem?.availableQuantity || 0) : false}
                                                className="w-10 h-full flex items-center justify-center text-neutral-400 hover:text-primary-600 hover:bg-neutral-50 disabled:opacity-20 transition-all font-bold"
                                            >
                                                <Plus size={16} />
                                            </button>
                                        </div>
                                    </div>

                                    <button
                                        onClick={handleAddToCart}
                                        className="flex-1 min-w-[200px] h-12 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 shadow-sm shadow-primary-200 active:scale-95 uppercase tracking-wide"
                                    >
                                        <ShoppingCart size={18} />
                                        <span>Thêm vào giỏ</span>
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Recommendations - Cleaner Grid */}
                {similarProducts.length > 0 && (
                    <div className="mt-20">
                        <div className="flex items-center justify-between mb-8">
                            <h2 className="text-xl font-bold text-neutral-900">Sản phẩm tương tự</h2>
                            <Link href="/products" className="text-xs font-semibold text-primary-600 hover:underline">Xem thêm</Link>
                        </div>
                        <div className="grid grid-cols-2 lg:grid-cols-6 gap-6">
                            {similarProducts.map(p => {
                                const imageSrc = p.images?.[0] || ''
                                return (
                                    <Link key={p.id} href={`/products/${p.id}`} className="group block">
                                        <div className="aspect-square relative mb-3 bg-white rounded-xl border border-neutral-200 overflow-hidden">
                                            {imageSrc ? (
                                                <Image 
                                                    src={imageSrc} 
                                                    alt={p.name} 
                                                    fill 
                                                    className="object-contain p-4 group-hover:scale-110 transition-transform duration-500" 
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center">
                                                    <Package className="w-10 h-10 text-neutral-100" />
                                                </div>
                                            )}
                                        </div>
                                        <h3 className="text-xs font-semibold text-neutral-800 line-clamp-1 mb-1">{p.name}</h3>
                                        <p className="text-sm font-bold text-primary-600">{p.price.toLocaleString()}đ</p>
                                    </Link>
                                )
                            })}
                        </div>
                    </div>
                )}

                <div className="mt-20 pt-16 border-t border-neutral-100">
                    <ReviewsSection productId={product.id} productName={product.name} />
                </div>
            </div>
            <ComparisonBar />
        </div>
    )

}
