'use client'

import { useState, useEffect, use } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Package, ShoppingCart, Truck, Shield, RotateCcw, Plus, Minus, Star, Sparkles } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import Header from '@/components/Header'
import WishlistButton from '@/components/WishlistButton'
import ComparisonButton from '@/components/ComparisonButton'
import ComparisonBar from '@/components/ComparisonBar'
import ReviewsSection from '@/components/ReviewsSection'
import { useCartStore } from '@/stores/cartStore'
import toast, { Toaster } from 'react-hot-toast'
import { formatNumber } from '@/lib/utils'

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

export default function ProductDetailView({ params }: { params: Promise<{ id: string }> }) {
    const resolvedParams = use(params);
    const { addItem } = useCartStore();
    const productId = resolvedParams.id;

    const [product, setProduct] = useState<Product | null>(null)
    const [loading, setLoading] = useState(true)
    const [selectedImageIndex, setSelectedImageIndex] = useState(0)
    const [quantity, setQuantity] = useState(1)
    const [similarProducts, setSimilarProducts] = useState<Recommendation[]>([])
    const [loadingSimilar, setLoadingSimilar] = useState(false)

    useEffect(() => {
        if (productId) {
            fetchProduct()
        }
    }, [productId])

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
        const maxQuantity = product?.inventoryItem?.availableQuantity || 0
        if (newQuantity >= 1 && newQuantity <= maxQuantity) {
            setQuantity(newQuantity)
        }
    }

    const handleAddToCart = () => {
        if (!product) return

        if (!product.inventoryItem?.availableQuantity || product.inventoryItem.availableQuantity <= 0) {
            toast.error('Sản phẩm đã hết hàng!')
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
            quantity,
        })

        toast.success(`Đã thêm ${quantity} ${product.name} vào giỏ hàng!`)
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
                    <div className="lg:col-span-5 space-y-3">
                        <div className="relative aspect-square bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100 max-h-[480px]">
                            {product.images && product.images.length > 0 ? (
                                <Image
                                    src={product.images[selectedImageIndex]}
                                    alt={product.name}
                                    fill
                                    className="object-contain p-2"
                                    priority
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center bg-gray-50">
                                    <Package className="h-20 w-20 text-gray-300" />
                                </div>
                            )}
                        </div>
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
                                    {formatNumber(product.price)}đ
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
                            <div className="space-y-3">
                                <div className="grid grid-cols-12 gap-3 pb-2 border-b border-gray-100">
                                    <div className="col-span-4 flex items-center bg-gray-50 rounded-xl border border-gray-200 h-14">
                                        <button onClick={() => handleQuantityChange(-1)} disabled={quantity <= 1} className="flex-1 text-center">-</button>
                                        <span className="w-10 text-center font-bold">{quantity}</span>
                                        <button onClick={() => handleQuantityChange(1)} className="flex-1 text-center">+</button>
                                    </div>
                                    <button
                                        onClick={handleAddToCart}
                                        className="col-span-8 bg-primary-600 text-white rounded-xl font-black text-sm h-14"
                                    >
                                        MUA NGAY
                                    </button>
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
                            {similarProducts.map(p => (
                                <div key={p.id} className="bg-white p-2 rounded-xl shadow-sm border border-gray-100">
                                    <div className="aspect-square relative mb-2">
                                        <Image src={p.images?.[0]} alt={p.name} fill className="object-contain" />
                                    </div>
                                    <h3 className="text-[10px] font-bold line-clamp-1">{p.name}</h3>
                                    <p className="text-xs font-black text-primary-600">{formatNumber(p.price)}đ</p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                <ReviewsSection productId={product.id} productName={product.name} />
            </div>
            <ComparisonBar />
        </div>
    )
}
