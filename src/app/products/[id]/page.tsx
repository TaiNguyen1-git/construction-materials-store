'use client'

import { useState, useEffect } from 'react'
// import { use } from 'next/navigation'  // removed invalid import
import Link from 'next/link'
import Image from 'next/image'
import { Package, ShoppingCart, ArrowLeft, Truck, Shield, RotateCcw, Plus, Minus, Check, Heart, Scale, Sparkles, Star } from 'lucide-react'
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

export default function ProductDetailPage({ params }: { params: { id: string } }) {
  const resolvedParams = params;
  const { addItem } = useCartStore();

  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedImageIndex, setSelectedImageIndex] = useState(0)
  const [quantity, setQuantity] = useState(1)
  const [similarProducts, setSimilarProducts] = useState<Recommendation[]>([])
  const [loadingSimilar, setLoadingSimilar] = useState(false)

  useEffect(() => {
    if (resolvedParams.id) {
      fetchProduct()
    }
  }, [resolvedParams.id])

  const fetchProduct = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/products/${resolvedParams.id}`)
      if (response.ok) {
        const result = await response.json()
        if (result.success && result.data) {
          setProduct(result.data)
          // Fetch similar products after product is loaded
          fetchSimilarProducts(resolvedParams.id)
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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-40 mb-8"></div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
              <div className="bg-gray-200 h-96 rounded-2xl"></div>
              <div className="space-y-4">
                <div className="h-8 bg-gray-200 rounded w-3/4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                <div className="h-10 bg-gray-200 rounded w-1/4"></div>
                <div className="h-20 bg-gray-200 rounded"></div>
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
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-gray-600 mb-8">
          <Link href="/" className="hover:text-primary-600">Trang chủ</Link>
          <span>/</span>
          <Link href="/products" className="hover:text-primary-600">Sản phẩm</Link>
          <span>/</span>
          <span className="text-gray-900 font-semibold truncate">{product.name}</span>
        </div>

        {/* Product Detail */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-16">
          {/* Images */}
          <div className="space-y-4">
            <div className="relative aspect-square bg-white rounded-3xl shadow-2xl overflow-hidden border-2 border-gray-100">
              {product.images && product.images.length > 0 ? (
                <Image
                  src={product.images[selectedImageIndex]}
                  alt={product.name}
                  fill
                  className="object-cover"
                  priority
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
                  <Package className="h-32 w-32 text-gray-400" />
                </div>
              )}
            </div>

            {/* Thumbnails */}
            {product.images && product.images.length > 1 && (
              <div className="grid grid-cols-4 gap-4">
                {product.images.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImageIndex(index)}
                    className={`relative aspect-square rounded-xl overflow-hidden border-2 transition-all ${selectedImageIndex === index
                      ? 'border-primary-600 ring-2 ring-primary-200'
                      : 'border-gray-200 hover:border-primary-400'
                      }`}
                  >
                    <Image src={image} alt={`${product.name} ${index + 1}`} fill className="object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="space-y-6">
            {/* Category Badge */}
            <div className="inline-flex items-center px-4 py-2 bg-primary-100 text-primary-700 rounded-full text-sm font-bold">
              {product.category?.name}
            </div>

            {/* Title & Action Buttons */}
            <div className="flex items-start justify-between gap-4">
              <h1 className="text-4xl font-black text-gray-900 leading-tight">
                {product.name}
              </h1>
              <div className="flex gap-2">
                <ComparisonButton product={product} size="lg" />
                <WishlistButton product={product} size="lg" />
              </div>
            </div>

            {/* SKU */}
            <div className="text-sm text-gray-500">
              SKU: <span className="font-semibold text-gray-700">{product.sku}</span>
            </div>

            {/* Price */}
            <div className="flex items-baseline gap-4">
              <span className="text-5xl font-black text-primary-600">
                {product.price?.toLocaleString()}đ
              </span>
              <span className="text-lg text-gray-500">/ {product.unit}</span>
            </div>

            {/* Stock Status */}
            <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl font-bold ${inStock
              ? 'bg-green-100 text-green-700'
              : 'bg-red-100 text-red-700'
              }`}>
              {inStock ? (
                <>
                  <Check className="h-5 w-5" />
                  Còn hàng ({product.inventoryItem?.availableQuantity} sản phẩm)
                </>
              ) : (
                <>Hết hàng</>
              )}
            </div>

            {/* Description */}
            <div className="bg-white rounded-2xl p-6 border-2 border-gray-100">
              <h3 className="font-bold text-gray-900 mb-3">Mô Tả Sản Phẩm</h3>
              <p className="text-gray-700 leading-relaxed">{product.description}</p>
            </div>

            {/* Quantity Selector */}
            {inStock && (
              <div className="bg-white rounded-2xl p-6 border-2 border-gray-100">
                <label className="block font-bold text-gray-900 mb-3">Số Lượng</label>
                <div className="flex items-center gap-4">
                  <div className="flex items-center border-2 border-gray-300 rounded-xl overflow-hidden">
                    <button
                      onClick={() => handleQuantityChange(-1)}
                      disabled={quantity <= 1}
                      className="p-3 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <Minus className="h-5 w-5" />
                    </button>
                    <input
                      type="number"
                      value={quantity}
                      onChange={(e) => {
                        const val = parseInt(e.target.value) || 1
                        const maxQty = product.inventoryItem?.availableQuantity || 0
                        setQuantity(Math.min(Math.max(1, val), maxQty))
                      }}
                      className="w-20 text-center font-bold text-lg outline-none"
                    />
                    <button
                      onClick={() => handleQuantityChange(1)}
                      disabled={quantity >= (product.inventoryItem?.availableQuantity || 0)}
                      className="p-3 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <Plus className="h-5 w-5" />
                    </button>
                  </div>
                  <button
                    onClick={handleAddToCart}
                    className="flex-1 bg-primary-600 text-white px-8 py-4 rounded-xl hover:bg-primary-700 transition-colors font-bold text-lg flex items-center justify-center gap-2 shadow-lg"
                  >
                    <ShoppingCart className="h-6 w-6" />
                    Thêm Vào Giỏ Hàng
                  </button>
                </div>
              </div>
            )}

            {/* Features */}
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-white rounded-xl p-4 text-center border-2 border-gray-100">
                <Truck className="h-8 w-8 text-primary-600 mx-auto mb-2" />
                <p className="text-xs font-semibold text-gray-700">Giao Hàng Nhanh</p>
              </div>
              <div className="bg-white rounded-xl p-4 text-center border-2 border-gray-100">
                <Shield className="h-8 w-8 text-primary-600 mx-auto mb-2" />
                <p className="text-xs font-semibold text-gray-700">Chính Hãng 100%</p>
              </div>
              <div className="bg-white rounded-xl p-4 text-center border-2 border-gray-100">
                <RotateCcw className="h-8 w-8 text-primary-600 mx-auto mb-2" />
                <p className="text-xs font-semibold text-gray-700">Đổi Trả Dễ Dàng</p>
              </div>
            </div>
          </div>
        </div>

        {/* Similar Products Section */}
        {similarProducts.length > 0 && (
          <div className="mb-16">
            <div className="flex items-center gap-3 mb-6">
              <Sparkles className="h-7 w-7 text-primary-600" />
              <h2 className="text-3xl font-black text-gray-900">
                Sản Phẩm Tương Tự
              </h2>
            </div>

            {loadingSimilar ? (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="bg-white rounded-xl shadow-md p-4 animate-pulse">
                    <div className="aspect-square bg-gray-200 rounded-lg mb-3" />
                    <div className="h-4 bg-gray-200 rounded mb-2" />
                    <div className="h-4 bg-gray-200 rounded w-2/3" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {similarProducts.map((product) => (
                  <div
                    key={product.id}
                    className="relative bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100 group"
                  >
                    {/* Badge */}
                    {product.badge && (
                      <div className="absolute top-2 left-2 z-10 bg-gradient-to-r from-blue-500 to-purple-500 text-white text-xs font-bold px-2 py-1 rounded-full shadow-lg">
                        {product.badge}
                      </div>
                    )}

                    {/* Product Image */}
                    <Link href={`/products/${product.id}`} className="block relative">
                      <div className="relative aspect-square bg-gray-100 overflow-hidden">
                        {product.images && product.images.length > 0 ? (
                          <Image
                            src={product.images[0]}
                            alt={product.name}
                            fill
                            className="object-cover group-hover:scale-110 transition-transform duration-300"
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-blue-100 to-purple-200 flex items-center justify-center">
                            <Package className="h-16 w-16 text-gray-400" />
                          </div>
                        )}
                      </div>
                    </Link>

                    {/* Product Info */}
                    <div className="p-4">
                      <Link href={`/products/${product.id}`}>
                        <h3 className="font-bold text-gray-900 mb-2 line-clamp-2 hover:text-primary-600 transition-colors">
                          {product.name}
                        </h3>
                      </Link>

                      {/* Rating */}
                      {product.reviewCount > 0 && (
                        <div className="flex items-center gap-1 mb-2">
                          <div className="flex items-center">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                className={`h-3 w-3 ${i < Math.floor(product.rating)
                                  ? 'fill-yellow-400 text-yellow-400'
                                  : 'text-gray-300'
                                  }`}
                              />
                            ))}
                          </div>
                          <span className="text-xs text-gray-600">
                            ({product.reviewCount})
                          </span>
                        </div>
                      )}

                      {/* Price */}
                      <div className="mb-3">
                        <p className="text-xl font-black text-primary-600">
                          {product.price.toLocaleString()}đ
                        </p>
                        <p className="text-xs text-gray-500">/{product.unit}</p>
                      </div>

                      {/* View Button */}
                      <Link
                        href={`/products/${product.id}`}
                        className="w-full py-2 rounded-lg font-semibold text-sm transition-all bg-primary-600 text-white hover:bg-primary-700 hover:shadow-lg flex items-center justify-center gap-2"
                      >
                        Xem Chi Tiết
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Reviews Section */}
        <ReviewsSection productId={resolvedParams.id} productName={product.name} />
      </div>

      {/* Comparison Bar */}
      <ComparisonBar />
    </div>
  )
}
