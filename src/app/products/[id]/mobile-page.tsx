'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { toast } from 'react-hot-toast'
import { 
  ShoppingCart, 
  Heart, 
  Share2, 
  Package, 
  Truck, 
  Shield, 
  Star,
  Minus,
  Plus,
  ChevronLeft
} from 'lucide-react'
import Link from 'next/link'

interface Product {
  id: string
  name: string
  description: string
  price: number
  images: string[]
  category: {
    name: string
  }
  inventoryItem?: {
    availableQuantity: number
  }
}

export default function MobileProductDetail() {
  const params = useParams()
  const productId = params.id as string
  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const [quantity, setQuantity] = useState(1)
  const [selectedImage, setSelectedImage] = useState(0)
  const [isWishlisted, setIsWishlisted] = useState(false)

  useEffect(() => {
    fetchProduct()
  }, [productId])

  const fetchProduct = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/products/${productId}`)
      
      if (response.ok) {
        const data = await response.json()
        setProduct(data.data)
      } else {
        toast.error('Failed to load product')
      }
    } catch (error) {
      console.error('Error fetching product:', error)
      toast.error('Failed to load product')
    } finally {
      setLoading(false)
    }
  }

  const handleAddToCart = () => {
    toast.success(`${product?.name} added to cart!`)
    // In a real implementation, this would add to the actual cart
  }

  const handleToggleWishlist = () => {
    setIsWishlisted(!isWishlisted)
    toast.success(
      isWishlisted 
        ? 'Removed from wishlist' 
        : 'Added to wishlist'
    )
  }

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: product?.name,
        text: product?.description,
        url: window.location.href,
      }).catch(console.error)
    } else {
      // Fallback for browsers that don't support Web Share API
      navigator.clipboard.writeText(window.location.href)
      toast.success('Link copied to clipboard!')
    }
  }

  const isInStock = (product?.inventoryItem?.availableQuantity || 0) > 0

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="bg-white animate-pulse">
          <div className="w-full h-96 bg-gray-200"></div>
          <div className="p-4">
            <div className="h-6 bg-gray-200 rounded mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
            <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
            <div className="space-y-2">
              <div className="h-4 bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-1">Product not found</h3>
          <p className="text-gray-500 mb-4">The product you're looking for doesn't exist</p>
          <Link 
            href="/products"
            className="text-blue-600 hover:text-blue-800 font-medium"
          >
            Browse all products
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-20">
        <div className="flex items-center justify-between p-4">
          <Link href="/products" className="p-2 -ml-2">
            <ChevronLeft className="h-6 w-6 text-gray-600" />
          </Link>
          <h1 className="text-lg font-semibold text-gray-900 truncate flex-1 px-4">
            {product.name}
          </h1>
          <div className="flex space-x-3">
            <button
              onClick={handleShare}
              className="p-2 text-gray-600"
              aria-label="Chia sẻ"
            >
              <Share2 className="h-5 w-5" />
            </button>
            <button
              onClick={handleToggleWishlist}
              className={`p-2 ${isWishlisted ? 'text-red-500' : 'text-gray-600'}`}
              aria-label="Thêm vào danh sách yêu thích"
            >
              <Heart className="h-5 w-5" fill={isWishlisted ? 'currentColor' : 'none'} />
            </button>
          </div>
        </div>
      </div>

      {/* Image Gallery */}
      <div className="bg-white">
        {product.images && product.images.length > 0 ? (
          <div className="relative">
            <img 
              src={product.images[selectedImage]} 
              alt={product.name}
              className="w-full h-96 object-cover"
            />
            {product.images.length > 1 && (
              <div className="absolute bottom-4 left-0 right-0 flex justify-center space-x-2">
                {product.images.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImage(index)}
                    className={`w-2 h-2 rounded-full ${
                      index === selectedImage ? 'bg-white' : 'bg-white/50'
                    }`}
                    aria-label={`Xem hình ${index + 1}`}
                  />
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="w-full h-96 bg-gray-200 flex items-center justify-center">
            <Package className="h-16 w-16 text-gray-400" />
          </div>
        )}
      </div>

      {/* Product Info */}
      <div className="bg-white mt-2 p-4">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-xl font-bold text-gray-900">{product.name}</h1>
            <p className="text-sm text-gray-500 mt-1">{product.category?.name}</p>
          </div>
          <p className="text-2xl font-bold text-gray-900">
            {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(product.price)}
          </p>
        </div>

        <div className="mt-4 flex items-center">
          <div className="flex items-center">
            {[...Array(5)].map((_, i) => (
              <Star 
                key={i} 
                className={`h-5 w-5 ${i < 4 ? 'text-yellow-400 fill-current' : 'text-gray-300'}`} 
              />
            ))}
            <span className="ml-2 text-sm text-gray-600">(128 đánh giá)</span>
          </div>
        </div>

        {isInStock ? (
          <div className="mt-4 flex items-center text-sm text-green-600">
            <Shield className="h-5 w-5 mr-1" />
            <span>Còn Hàng ({product.inventoryItem?.availableQuantity} có sẵn)</span>
          </div>
        ) : (
          <div className="mt-4 flex items-center text-sm text-red-600">
            <Shield className="h-5 w-5 mr-1" />
            <span>Hết Hàng</span>
          </div>
        )}
      </div>

      {/* Description */}
      <div className="bg-white mt-2 p-4">
        <h2 className="text-lg font-semibold text-gray-900 mb-2">Mô Tả</h2>
        <p className="text-gray-600 text-sm leading-relaxed">
          {product.description || 'Không có mô tả cho sản phẩm này.'}
        </p>
      </div>

      {/* Features */}
      <div className="bg-white mt-2 p-4">
        <h2 className="text-lg font-semibold text-gray-900 mb-3">Tính Năng</h2>
        <div className="grid grid-cols-2 gap-3">
          <div className="flex items-center">
            <Truck className="h-5 w-5 text-blue-500 mr-2" />
            <span className="text-sm text-gray-600">Giao Hàng Nhanh</span>
          </div>
          <div className="flex items-center">
            <Shield className="h-5 w-5 text-green-500 mr-2" />
            <span className="text-sm text-gray-600">Bảo Hành Chất Lượng</span>
          </div>
        </div>
      </div>

      {/* Thêm Vào Giỏ */}
      <div className="bg-white border-t border-gray-200 sticky bottom-0 z-20">
        <div className="p-4">
          {isInStock ? (
            <div className="flex items-center space-x-3">
              <div className="flex items-center border border-gray-300 rounded-lg">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="p-2 text-gray-600"
                  aria-label="Giảm số lượng"
                >
                  <Minus className="h-4 w-4" />
                </button>
                <span className="px-3 py-2 text-gray-900">{quantity}</span>
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  className="p-2 text-gray-600"
                  aria-label="Tăng số lượng"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
              <button
                onClick={handleAddToCart}
                className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-medium flex items-center justify-center"
              >
                <ShoppingCart className="h-5 w-5 mr-2" />
                Thêm Vào Giỏ
              </button>
            </div>
          ) : (
            <button
              disabled
              className="w-full bg-gray-300 text-gray-500 py-3 rounded-lg font-medium cursor-not-allowed"
            >
              Hết Hàng
            </button>
          )}
        </div>
      </div>
    </div>
  )
}