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

export default function ProductDetailClient({ params }: { params: Promise<{ id: string }> }) {
    const resolvedParams = use(params);
    const { addItem } = useCartStore();
    const productId = resolvedParams.id;

    const [product, setProduct] = useState<Product | null>(null)
    const [loading, setLoading] = useState(true)
    const [selectedImageIndex, setSelectedImageIndex] = useState(0)
    const [quantity, setQuantity] = useState(1)
    const [availableUnits, setAvailableUnits] = useState<UnitConversion[]>([])
    const [selectedUnit, setSelectedUnit] = useState<UnitConversion | null>(null)
    const [similarProducts, setSimilarProducts] = useState<Recommendation[]>([])
    const [loadingSimilar, setLoadingSimilar] = useState(false)

    useEffect(() => {
        if (productId) {
            fetchProduct()
        }
    }, [productId])

    useEffect(() => {
        if (product) {
            const units = getAvailableUnits(product.unit)
            setAvailableUnits(units)
            setSelectedUnit(units[0])
        }
    }, [product])

    const fetchProduct = async () => {
        try {
            setLoading(true)
            const response = await fetch(`/api/products/${productId}`)
            if (response.ok) {
                const result = await response.json()
                if (result.success && result.data) {
                    setProduct(result.data)
                    fetchSimilarProducts(productId)
                } else {
                    toast.error('Không thể tải sản phẩm')
                }
            } else {
                toast.error('Sản phẩm không tồn tại')
            }
        } catch (error) {
            console.error('Failed to fetch product:', error)
            toast.error('Không thể tải sản phẩm')
        } finally {
            setLoading(false)
        }
    }

    const fetchSimilarProducts = async (productId: string) => {
        try {
            setLoadingSimilar(true)
            const response = await fetch('/api/recommendations/similar', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ productId, limit: 6 })
            })

            if (response.ok) {
                const data = await response.json()
                setSimilarProducts(data.data.recommendations || [])
            }
        } catch (error) {
            console.error('Failed to fetch similar products:', error)
        } finally {
            setLoadingSimilar(false)
        }
    }

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
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
            <Toaster position="top-right" />
            <Header />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="flex items-center gap-2 text-[10px] text-gray-500 mb-4 opacity-80 uppercase tracking-wider font-bold">
                    <Link href="/" className="hover:text-primary-600 transition-colors">SmartBuild</Link>
                    <span>/</span>
                    <Link href="/products" className="hover:text-primary-600 transition-colors">Sản phẩm</Link>
                    <span>/</span>
                    <span className="text-gray-900 truncate max-w-[200px]">{product.name}</span>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-12">
                    <div className="lg:col-span-5 space-y-4">
                        <div className="relative aspect-square bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100 max-h-[480px] group">
                            {product.images && product.images.length > 0 && product.images[selectedImageIndex] ? (
                                <>
                                    <Image
                                        src={product.images[selectedImageIndex]}
                                        alt={product.name}
                                        fill
                                        className="object-contain p-4 group-hover:scale-105 transition-transform duration-700"
                                        priority
                                    />
                                    {product.images.length > 1 && (
                                        <>
                                            <button 
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    setSelectedImageIndex((prev) => (prev === 0 ? product.images.length - 1 : prev - 1));
                                                }}
                                                className="absolute left-4 top-1/2 -translate-y-1/2 p-2 bg-white/80 backdrop-blur-md rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-all hover:bg-white text-slate-800"
                                            >
                                                <ChevronLeft className="w-5 h-5" />
                                            </button>
                                            <button 
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    setSelectedImageIndex((prev) => (prev === product.images.length - 1 ? 0 : prev + 1));
                                                }}
                                                className="absolute right-4 top-1/2 -translate-y-1/2 p-2 bg-white/80 backdrop-blur-md rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-all hover:bg-white text-slate-800"
                                            >
                                                <ChevronRight className="w-5 h-5" />
                                            </button>
                                            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-3 py-1 bg-black/20 backdrop-blur-md rounded-full text-[10px] text-white font-black italic">
                                                {selectedImageIndex + 1} / {product.images.length}
                                            </div>
                                        </>
                                    )}
                                </>
                            ) : (
                                <div className="w-full h-full flex items-center justify-center bg-gray-50">
                                    <Package className="h-20 w-20 text-gray-300" />
                                </div>
                            )}
                        </div>

                        {/* Image Gallery Thumbnails */}
                        {product.images && product.images.length > 1 && (
                            <div className="flex gap-2.5 overflow-x-auto pb-2 scrollbar-hide">
                                {product.images.map((img, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => setSelectedImageIndex(idx)}
                                        className={`relative w-20 h-20 rounded-xl overflow-hidden shrink-0 border-2 transition-all ${
                                            selectedImageIndex === idx 
                                                ? 'border-primary-600 scale-95 shadow-md' 
                                                : 'border-white hover:border-primary-200'
                                        }`}
                                    >
                                        <Image src={img} alt={`${product.name} shadow-${idx}`} fill className="object-cover" />
                                        {selectedImageIndex === idx && <div className="absolute inset-0 bg-primary-600/10 backdrop-blur-[1px]"></div>}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="lg:col-span-7 space-y-4">
                        <div className="flex items-center justify-between">
                            <div className="inline-flex items-center px-3 py-1 bg-primary-50 text-primary-700 rounded-full text-[10px] font-black uppercase tracking-wider border border-primary-100">
                                {product.category?.name}
                            </div>
                            <div className="flex gap-2">
                                <ComparisonButton product={product} size="sm" />
                                <WishlistButton product={product} size="sm" />
                            </div>
                        </div>

                        <div>
                            <h1 className="text-2xl font-black text-gray-900 leading-tight mb-1">
                                {product.name}
                            </h1>
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                                SKU: <span className="text-gray-600">{product.sku}</span>
                            </span>
                        </div>

                        <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
                            <div className="flex items-baseline gap-2">
                                <span className="text-3xl font-black text-primary-600">
                                    {product.price?.toLocaleString()}đ
                                </span>
                                <span className="text-xs font-bold text-gray-400">/ {product.unit}</span>
                            </div>
                            <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black ${inStock
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                                : 'bg-red-50 text-red-700 border border-red-100'
                                }`}>
                                {inStock ? 'Sẵn hàng' : 'Hết hàng'}
                            </div>
                        </div>

                        <div className="space-y-2">
                            <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-1">Mô Tả Sản Phẩm</h3>
                            <div className="text-sm text-gray-600 leading-relaxed max-h-[100px] overflow-y-auto pr-2">
                                {product.description}
                            </div>
                        </div>

                        {inStock && (
                            <div className="space-y-6 pt-4 border-t border-slate-100">
                                {/* Unit Picker */}
                                {availableUnits.length > 1 && (
                                    <div className="space-y-3">
                                        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Đơn vị nhập hàng</h3>
                                        <div className="flex flex-wrap gap-2">
                                            {availableUnits.map((u) => {
                                                const maxBase = product.inventoryItem?.availableQuantity || 0;
                                                const maxForUnit = Math.floor(maxBase / u.factor);
                                                const isDisabled = maxForUnit === 0 && u.factor > 1; // Base unit (factor 1) should never be disabled unless stock is 0
                                                
                                                return (
                                                    <button
                                                        key={u.name}
                                                        disabled={isDisabled}
                                                        onClick={() => {
                                                            const currentBaseQty = quantity * (selectedUnit?.factor || 1);
                                                            const newQty = Math.floor(currentBaseQty / u.factor);
                                                            
                                                            setSelectedUnit(u);
                                                            
                                                            if (newQty * u.factor > maxBase) {
                                                                const capped = Math.floor(maxBase / u.factor);
                                                                setQuantity(capped || (maxBase > 0 ? 1 : 0));
                                                            } else {
                                                                setQuantity(newQty || (maxBase > 0 ? 1 : 0));
                                                            }
                                                        }}
                                                        className={`px-4 py-2 rounded-xl text-[11px] font-black uppercase tracking-wider transition-all border relative ${
                                                            isDisabled
                                                                ? 'bg-slate-50 text-slate-300 border-slate-100 cursor-not-allowed opacity-60 grayscale'
                                                                : selectedUnit?.name === u.name
                                                                    ? 'bg-primary-600 text-white border-primary-600 shadow-md shadow-primary-100 scale-105'
                                                                    : 'bg-white text-slate-500 border-slate-200 hover:border-primary-300 hover:text-primary-600'
                                                        }`}
                                                        title={isDisabled ? `Tồn kho (${maxBase}) không đủ 1 ${u.label}` : ''}
                                                    >
                                                        {u.label}
                                                        {maxForUnit > 0 && selectedUnit?.name !== u.name && (
                                                            <span className="absolute -top-2 -right-2 bg-emerald-500 text-[8px] text-white px-1.5 rounded-sm font-black shadow-sm z-10">
                                                                TỐI ĐA {maxForUnit}
                                                            </span>
                                                        )}
                                                        {isDisabled && (
                                                            <span className="absolute -bottom-1 -right-1 bg-red-400 w-2 h-2 rounded-full border border-white"></span>
                                                        )}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}

                                <div className="space-y-3">
                                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Số lượng đặt hàng</h3>
                                    <div className="grid grid-cols-12 gap-3 pb-2">
                                        <div className="col-span-12 sm:col-span-5 flex flex-col gap-2">
                                            <div className="flex items-center bg-slate-50 rounded-2xl border border-slate-200 h-16 shadow-inner-sm overflow-hidden group focus-within:border-primary-500 focus-within:ring-2 focus-within:ring-primary-100 transition-all">
                                                <button 
                                                    onClick={() => handleQuantityChange(-1)} 
                                                    disabled={quantity <= 1} 
                                                    className="w-12 h-full flex items-center justify-center text-slate-400 hover:text-primary-600 hover:bg-slate-100 disabled:opacity-30 disabled:hover:bg-transparent transition-colors font-black text-xl"
                                                >
                                                    <Minus size={18} />
                                                </button>
                                                <input 
                                                    type="number"
                                                    value={quantity}
                                                    onChange={(e) => {
                                                        const val = parseInt(e.target.value) || 0
                                                        const factor = selectedUnit?.factor || 1
                                                        const maxQuantityInBase = product?.inventoryItem?.availableQuantity || 0
                                                        
                                                        if ((val * factor) > maxQuantityInBase) {
                                                            const maxDisplay = Math.floor(maxQuantityInBase / factor)
                                                            setQuantity(maxDisplay)
                                                            toast.error(`Chỉ còn ${maxQuantityInBase} ${product?.unit} trong kho`, { id: 'max-stock' })
                                                        } else {
                                                            setQuantity(val)
                                                        }
                                                    }}
                                                    onBlur={() => {
                                                        if (quantity < 1) setQuantity(1)
                                                    }}
                                                    className="flex-1 min-w-0 h-full bg-transparent text-center font-black text-lg text-slate-800 outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                                />
                                                <button 
                                                    onClick={() => handleQuantityChange(1)} 
                                                    disabled={selectedUnit ? (quantity + 1) * selectedUnit.factor > (product?.inventoryItem?.availableQuantity || 0) : false}
                                                    className="w-12 h-full flex items-center justify-center text-slate-400 hover:text-primary-600 transition-colors hover:bg-slate-100 disabled:opacity-30 disabled:hover:bg-transparent font-black text-xl"
                                                >
                                                    <Plus size={18} />
                                                </button>
                                            </div>
                                            
                                            {selectedUnit && selectedUnit.factor > 1 && (
                                                <div className="px-2 text-[10px] font-bold text-primary-600 italic animate-in fade-in slide-in-from-left-2 duration-300">
                                                    = {(quantity * selectedUnit.factor).toLocaleString()} {product?.unit}
                                                </div>
                                            )}
                                        </div>

                                        <button
                                            onClick={handleAddToCart}
                                            className="col-span-12 sm:col-span-7 bg-gradient-to-r from-primary-600 to-indigo-600 text-white rounded-2xl font-black text-sm h-16 shadow-lg shadow-blue-200 hover:shadow-indigo-300 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3 uppercase tracking-widest"
                                        >
                                            <ShoppingCart size={20} />
                                            <span>MUA NGAY</span>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {similarProducts.length > 0 && (
                    <div className="mt-12">
                        <h2 className="text-sm font-black text-gray-900 uppercase mb-6 flex items-center gap-2">
                            <Sparkles size={14} className="text-primary-600" /> Combo Khuyên Dùng
                        </h2>
                        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                            {similarProducts.map(p => {
                                const imageSrc = p.images?.[0] || ''
                                return (
                                    <div key={p.id} className="bg-white p-2 rounded-xl shadow-sm border border-gray-100">
                                        <div className="aspect-square relative mb-2 bg-gray-50 rounded-lg overflow-hidden">
                                            {imageSrc ? (
                                                <Image 
                                                    src={imageSrc} 
                                                    alt={p.name} 
                                                    fill 
                                                    className="object-contain p-1" 
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center">
                                                    <Package className="w-8 h-8 text-gray-200" />
                                                </div>
                                            )}
                                        </div>
                                        <h3 className="text-[10px] font-bold line-clamp-1 text-gray-800">{p.name}</h3>
                                        <p className="text-xs font-black text-primary-600">{p.price.toLocaleString()}đ</p>
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                )}

                <ReviewsSection productId={product.id} productName={product.name} />
            </div>
            <ComparisonBar />
        </div>
    )
}
