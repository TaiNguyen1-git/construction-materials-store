'use client'

import { useState, useEffect, use } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import Image from 'next/image'
import { Package, ShoppingCart, ArrowLeft, Truck, Shield, RotateCcw, Plus, Minus, Check } from 'lucide-react'
import Header from '@/components/Header'
import WishlistButton from '@/components/WishlistButton'
import ComparisonButton from '@/components/ComparisonButton'
import ComparisonBar from '@/components/ComparisonBar'
import ReviewList from '@/components/ReviewList'
import ReviewForm from '@/components/ReviewForm'
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

export default function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params)
  const { addItem } = useCartStore()
  
  const [product, setProduct] = useState<Product | null>(null)
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedImageIndex, setSelectedImageIndex] = useState(0)
  const [quantity, setQuantity] = useState(1)

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
        const productData = result.data || result
        setProduct(productData)
        
        if (productData.category?.id) {
          fetchRelatedProducts(productData.category.id)
        }
      }
    } catch (error) {
      console.error('Failed to fetch product:', error)
      toast.error('Không thể tải sản phẩm')
    } finally {
      setLoading(false)
    }
  }

  const fetchRelatedProducts = async (categoryId: string) => {
    try {
      const response = await fetch(`/api/products?categoryId=${categoryId}&limit=4`)
      if (response.ok) {
        const data = await response.json()
        const related = (data.data?.items || data.data || []).filter((p: Product) => p.id !== resolvedParams.id)
        setRelatedProducts(related.slice(0, 4))
      }
    } catch (error) {
      console.error('Failed to fetch related products:', error)
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
      image: product.images?.[0]
    }, quantity)
    
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

  // Generate structured data for SEO
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Product",
    "name": product.name,
    "description": product.description || "",
    "sku": product.sku,
    "image": product.images && product.images.length > 0 ? product.images : [],
    "offers": {
      "@type": "Offer",
      "url": `https://smartbuild.vn/products/${product.id}`,
      "priceCurrency": "VND",
      "price": product.price,
      "availability": inStock ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      "seller": {
        "@type": "Organization",
        "name": "SmartBuild Materials Store"
      }
    },
    "brand": {
      "@type": "Brand",
      "name": "SmartBuild"
    },
    "category": product.category?.name || "Construction Materials"
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* SEO: Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      
      <Toaster position="top-right" />
      <Header />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-gray-600 mb-8">
          <Link href="/" className="hover:text-primary-600">Trang chủ</Link>
          <span>/</span>
          <Link href="/products" className="hover:text-primary-600">Sản phẩm</Link>
          <span>/</span>
          <Link href={`/categories/${product.category?.id}`} className="hover:text-primary-600">
            {product.category?.name}
          </Link>
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
                    className={`relative aspect-square rounded-xl overflow-hidden border-2 transition-all ${
                      selectedImageIndex === index
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
                <ComparisonButton product={product} size="lg" showText={false} />
                <WishlistButton product={product} size="lg" showText={false} />
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
            <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl font-bold ${
              inStock
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

        {/* Reviews Section */}
        <div className="mb-16">
          <h2 className="text-3xl font-black text-gray-900 mb-8">⭐ Đánh Giá Sản Phẩm</h2>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Review Form */}
            <div className="lg:col-span-1">
              <ReviewForm
                productId={product.id}
                customerId={undefined} // TODO: Get from auth context
                onSuccess={() => {
                  // Refresh reviews
                }}
              />
            </div>

            {/* Review List */}
            <div className="lg:col-span-2">
              <ReviewList productId={product.id} />
            </div>
          </div>
        </div>

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <div>
            <h2 className="text-3xl font-black text-gray-900 mb-8">🔥 Sản Phẩm Liên Quan</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {relatedProducts.map((relatedProduct) => (
                <Link
                  key={relatedProduct.id}
                  href={`/products/${relatedProduct.id}`}
                  className="bg-white rounded-2xl shadow-lg border border-gray-100 hover:shadow-xl transition-all overflow-hidden group"
                >
                  <div className="relative aspect-square bg-gradient-to-br from-gray-100 to-gray-200">
                    {relatedProduct.images?.[0] ? (
                      <Image
                        src={relatedProduct.images[0]}
                        alt={relatedProduct.name}
                        fill
                        className="object-cover group-hover:scale-110 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Package className="h-12 w-12 text-gray-400" />
                      </div>
                    )}
                  </div>
                  <div className="p-4">
                    <h3 className="font-bold text-gray-900 mb-2 line-clamp-2">
                      {relatedProduct.name}
                    </h3>
                    <p className="text-xl font-black text-primary-600">
                      {relatedProduct.price?.toLocaleString()}đ
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Comparison Bar */}
      <ComparisonBar />
    </div>
  )
}
