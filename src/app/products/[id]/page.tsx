'use client'

import { useState, useEffect, use } from 'react'
// import { use } from 'next/navigation'  // removed invalid import
import Link from 'next/link'
import Image from 'next/image'
import { Package, ShoppingCart, ArrowLeft, ArrowRight, Truck, Shield, RotateCcw, Plus, Minus, Check, Heart, Scale, Sparkles, Star, Building, ExternalLink } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import Header from '@/components/Header'
import WishlistButton from '@/components/WishlistButton'
import ComparisonButton from '@/components/ComparisonButton'
import ComparisonBar from '@/components/ComparisonBar'
import ReviewsSection from '@/components/ReviewsSection'
import { useCartStore } from '@/stores/cartStore'
import toast, { Toaster } from 'react-hot-toast'

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

export default function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  // Unwrap params Promise using React.use() for Next.js 15 compatibility
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
          // Fetch similar products after product is loaded
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
          {/* Breadcrumb Skeleton */}
          <Skeleton className="h-4 w-48 mb-8 rounded" />

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-12">
            {/* Image Skeleton */}
            <div className="lg:col-span-5 space-y-3">
              <Skeleton className="aspect-square w-full rounded-2xl" />
              <div className="flex gap-2">
                <Skeleton className="w-16 h-16 rounded-lg" />
                <Skeleton className="w-16 h-16 rounded-lg" />
                <Skeleton className="w-16 h-16 rounded-lg" />
              </div>
            </div>

            {/* Info Skeleton */}
            <div className="lg:col-span-7 space-y-6">
              <div className="flex justify-between">
                <Skeleton className="h-6 w-24 rounded-full" />
                <div className="flex gap-2">
                  <Skeleton className="h-8 w-8 rounded-full" />
                  <Skeleton className="h-8 w-8 rounded-full" />
                </div>
              </div>
              <div>
                <Skeleton className="h-10 w-3/4 mb-2 rounded" />
                <Skeleton className="h-4 w-24 rounded" />
              </div>

              <Skeleton className="h-24 w-full rounded-2xl" />

              <div className="space-y-2">
                <Skeleton className="h-4 w-32 rounded" />
                <Skeleton className="h-20 w-full rounded" />
              </div>

              <div className="grid grid-cols-12 gap-3">
                <Skeleton className="col-span-4 h-14 rounded-xl" />
                <Skeleton className="col-span-8 h-14 rounded-xl" />
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <Toaster position="top-right" />
        <Header />
        <div className="max-w-4xl mx-auto px-4 py-20 text-center">
          <Package className="h-32 w-32 text-gray-300 mx-auto mb-6" />
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Không Tìm Thấy Sản Phẩm</h2>
          <Link href="/products" className="text-primary-600 hover:underline font-semibold text-lg">
            ← Quay lại danh sách sản phẩm
          </Link>
        </div>
      </div>
    )
  }

  const inStock = (product.inventoryItem?.availableQuantity || 0) > 0

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <Toaster position="top-right" />
      <Header />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb - Reduced Margin */}
        <div className="flex items-center gap-2 text-[10px] text-gray-500 mb-4 opacity-80 uppercase tracking-wider font-bold">
          <Link href="/" className="hover:text-primary-600 transition-colors">SmartBuild</Link>
          <span>/</span>
          <Link href="/products" className="hover:text-primary-600 transition-colors">Sản phẩm</Link>
          <span>/</span>
          <span className="text-gray-900 truncate max-w-[200px]">{product.name}</span>
        </div>

        {/* Product Detail - Optimized Grid Ratio & Spacing */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-12">
          {/* Images - Left Column (5/12) */}
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

            {/* Thumbnails - Smaller */}
            {product.images && product.images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
                {product.images.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImageIndex(index)}
                    className={`relative w-16 h-16 shrink-0 rounded-lg overflow-hidden border-2 transition-all ${selectedImageIndex === index
                      ? 'border-primary-600 shadow-md'
                      : 'border-gray-100 hover:border-primary-300'
                      }`}
                  >
                    <Image src={image} alt={`${product.name} ${index + 1}`} fill className="object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Info - Right Column (7/12) */}
          <div className="lg:col-span-7 space-y-4">
            {/* Header: Category + Action Buttons */}
            <div className="flex items-center justify-between">
              <div className="inline-flex items-center px-3 py-1 bg-primary-50 text-primary-700 rounded-full text-[10px] font-black uppercase tracking-wider border border-primary-100">
                {product.category?.name}
              </div>
              <div className="flex gap-2">
                <ComparisonButton product={product} size="sm" />
                <WishlistButton product={product} size="sm" />
              </div>
            </div>

            {/* Title & SKU - Reduced Sizes */}
            <div>
              <h1 className="text-2xl font-black text-gray-900 leading-tight mb-1">
                {product.name}
              </h1>
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                SKU: <span className="text-gray-600">{product.sku}</span>
              </span>
            </div>

            {/* Price & Stock - Combined for Density */}
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
                {inStock ? (
                  <>
                    <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Sẵn hàng ({product.inventoryItem?.availableQuantity})
                  </>
                ) : (
                  <>Hết hàng</>
                )}
              </div>
            </div>

            {/* Description - Compact with scroll */}
            <div className="space-y-2">
              <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-1">Mô Tả Sản Phẩm</h3>
              <div className="text-sm text-gray-600 leading-relaxed max-h-[100px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-200">
                {product.description}
              </div>
            </div>

            {/* Action Zone - Compact One-Row Hero */}
            {inStock && (
              <div className="space-y-3">
                <div className="grid grid-cols-12 gap-3 pb-2 border-b border-gray-100">
                  <div className="col-span-4 flex items-center bg-gray-50 rounded-xl border border-gray-200 h-14">
                    <button
                      onClick={() => handleQuantityChange(-1)}
                      disabled={quantity <= 1}
                      className="flex-1 h-full flex items-center justify-center hover:bg-gray-200 rounded-l-xl transition-colors disabled:opacity-30"
                    >
                      <Minus size={14} />
                    </button>
                    <input
                      type="number"
                      value={quantity}
                      onChange={(e) => {
                        const val = parseInt(e.target.value) || 1
                        const maxQty = product.inventoryItem?.availableQuantity || 0
                        setQuantity(Math.min(Math.max(1, val), maxQty))
                      }}
                      className="w-10 bg-transparent text-center font-bold text-sm outline-none"
                    />
                    <button
                      onClick={() => handleQuantityChange(1)}
                      disabled={quantity >= (product.inventoryItem?.availableQuantity || 0)}
                      className="flex-1 h-full flex items-center justify-center hover:bg-gray-200 rounded-r-xl transition-colors disabled:opacity-30"
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                  <button
                    onClick={handleAddToCart}
                    className="col-span-8 bg-primary-600 text-white rounded-xl font-black text-sm shadow-lg shadow-primary-200 hover:bg-primary-700 hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center gap-2 h-14"
                  >
                    <ShoppingCart size={18} />
                    MUA NGAY
                  </button>
                </div>

                {/* Contractor Widget - Leaner Design */}
                <div className="bg-gradient-to-r from-indigo-600 to-primary-600 rounded-2xl p-4 text-white relative overflow-hidden shadow-lg shadow-indigo-100 group">
                  <div className="relative z-10 flex items-center justify-between gap-4">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="flex items-center gap-1 text-[8px] bg-white/20 px-1.5 py-0.5 rounded uppercase font-black tracking-tighter border border-white/30">Verified</span>
                        <h4 className="font-bold text-xs">Cần thợ thi công?</h4>
                      </div>
                      <p className="text-[10px] text-indigo-50 line-clamp-1 opacity-90">Kết nối đội ngũ chuyên gia lắp đặt SmartBuild ngay.</p>
                    </div>
                    <Link href="/contractors" className="shrink-0 bg-white text-indigo-600 px-4 py-2 rounded-lg text-[10px] font-black hover:bg-indigo-50 transition-colors shadow-sm whitespace-nowrap">
                      XEM THỢ
                    </Link>
                  </div>
                </div>
              </div>
            )}

            {/* Trust Badges - Horizontal & Smaller */}
            <div className="flex items-center justify-between gap-1 overflow-x-auto py-1 scrollbar-none">
              <div className="flex-1 flex flex-col items-center gap-1 p-2 bg-white rounded-xl border border-gray-100 opacity-80">
                <Truck className="h-4 w-4 text-primary-600" />
                <p className="text-[8px] font-bold text-gray-500 uppercase">Giao Nhanh</p>
              </div>
              <div className="flex-1 flex flex-col items-center gap-1 p-2 bg-white rounded-xl border border-gray-100 opacity-80">
                <Shield className="h-4 w-4 text-primary-600" />
                <p className="text-[8px] font-bold text-gray-500 uppercase">Chất Lượng</p>
              </div>
              <div className="flex-1 flex flex-col items-center gap-1 p-2 bg-white rounded-xl border border-gray-100 opacity-80">
                <RotateCcw className="h-4 w-4 text-primary-600" />
                <p className="text-[8px] font-bold text-gray-500 uppercase">Đổi Trả</p>
              </div>
            </div>
          </div>
        </div>

        {/* Similar Products Section */}
        {similarProducts.length > 0 && (
          <div className="mb-16">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 mb-6">
              <div className="flex items-center gap-2">
                <div className="p-1 bg-primary-600 rounded shadow-sm">
                  <Sparkles size={14} className="text-white" />
                </div>
                <div>
                  <h2 className="text-sm font-black text-gray-900 uppercase tracking-tight">Combo Khuyên Dùng</h2>
                  <p className="text-[8px] text-gray-400 font-bold uppercase tracking-tighter">ML Powered suggestions</p>
                </div>
              </div>
              <div className="hidden md:flex items-center gap-1.5 px-2 py-1 bg-amber-50 rounded-md border border-amber-100">
                <span className="flex h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse"></span>
                <span className="text-[8px] font-black text-amber-700 uppercase">Ưu đãi Combo</span>
              </div>
            </div>

            {loadingSimilar ? (
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="bg-white rounded-xl shadow-md p-2 space-y-2 border border-gray-100">
                    <Skeleton className="aspect-[3/2] w-full rounded-lg" />
                    <Skeleton className="h-3 w-3/4 rounded" />
                    <Skeleton className="h-3 w-1/2 rounded" />
                    <div className="flex justify-between items-center pt-2 border-t border-gray-50">
                      <Skeleton className="h-4 w-16 rounded" />
                      <Skeleton className="h-5 w-8 rounded" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
                {similarProducts.map((product) => (
                  <div
                    key={product.id}
                    className="relative bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100 group"
                  >
                    {/* Badge */}
                    {product.badge && (
                      <div className={`absolute top-2 left-2 z-10 bg-gradient-to-r ${product.badge.includes('ML') ? 'from-amber-500 to-orange-600' : 'from-blue-500 to-purple-500'} text-white text-[10px] font-black px-2 py-1 rounded-full shadow-lg flex items-center gap-1`}>
                        {product.badge.includes('ML') && <Sparkles size={10} />}
                        {product.badge}
                      </div>
                    )}

                    {/* Product Image - Shallow Aspect & Smaller */}
                    <Link href={`/products/${product.id}`} className="block relative">
                      <div className="relative aspect-[3/2] bg-gray-50 overflow-hidden border-b border-gray-100">
                        {product.images && product.images.length > 0 ? (
                          <Image
                            src={product.images[0]}
                            alt={product.name}
                            fill
                            className="object-contain p-2 group-hover:scale-105 transition-transform duration-300"
                          />
                        ) : (
                          <div className="w-full h-full bg-gray-50 flex items-center justify-center">
                            <Package className="h-8 w-8 text-gray-300" />
                          </div>
                        )}
                      </div>
                    </Link>

                    {/* Product Info - Ultra Compact */}
                    <div className="p-2 space-y-1">
                      <Link href={`/products/${product.id}`}>
                        <h3 className="font-bold text-gray-900 text-[10px] line-clamp-2 hover:text-primary-600 transition-colors h-6 leading-tight">
                          {product.name}
                        </h3>
                      </Link>

                      {/* Rating - Smaller */}
                      {product.reviewCount > 0 && (
                        <div className="flex items-center gap-1 mb-1">
                          <div className="flex items-center">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                className={`h-2.5 w-2.5 ${i < Math.floor(product.rating)
                                  ? 'fill-yellow-400 text-yellow-400'
                                  : 'text-gray-300'
                                  }`}
                              />
                            ))}
                          </div>
                          <span className="text-[9px] text-gray-500">
                            ({product.reviewCount})
                          </span>
                        </div>
                      )}

                      {/* Price & Action - Single Row / Tight */}
                      <div className="flex items-center justify-between gap-1 pt-1 border-t border-gray-50">
                        <p className="text-sm font-black text-primary-600 truncate">
                          {product.price.toLocaleString()}đ
                        </p>
                        <Link
                          href={`/products/${product.id}`}
                          className="px-2 py-1 rounded bg-slate-100 text-slate-700 text-[8px] font-black hover:bg-primary-600 hover:text-white transition-colors"
                        >
                          XEM
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Reviews Section */}
        <ReviewsSection productId={productId} productName={product.name} />
      </div>

      {/* Comparison Bar */}
      <ComparisonBar />
    </div>
  )
}
