'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useCartStore } from '@/stores/cartStore'
import Header from '@/components/Header'
import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import {
  ShoppingBag,
  Plus,
  Minus,
  Trash2,
  ArrowLeft,
  ArrowRight,
  Package,
  Truck,
  CreditCard,
  Star,
  Sparkles,
  FileText
} from 'lucide-react'

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

export default function CartPage() {
  const router = useRouter()
  const { items, updateQuantity, removeItem, clearCart, getTotalPrice, addItem } = useCartStore()
  const [isProcessing, setIsProcessing] = useState(false)
  const [recommendations, setRecommendations] = useState<Recommendation[]>([])
  const [loadingRecommendations, setLoadingRecommendations] = useState(false)

  const shippingFee = items.length > 0 ? 50000 : 0 // 50k shipping fee
  const totalPrice = getTotalPrice()
  const finalTotal = totalPrice + shippingFee

  // Fetch recommendations when cart items change
  useEffect(() => {
    if (items.length > 0) {
      fetchRecommendations()
    } else {
      setRecommendations([])
    }
  }, [items.length])

  const fetchRecommendations = async () => {
    try {
      setLoadingRecommendations(true)
      const productIds = items.map(item => item.productId)

      const response = await fetch('/api/recommendations/cart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productIds, limit: 8 })
      })

      if (response.ok) {
        const data = await response.json()
        setRecommendations(data.data.recommendations || [])
      }
    } catch (error) {
      console.error('Failed to fetch recommendations:', error)
    } finally {
      setLoadingRecommendations(false)
    }
  }

  const handleAddToCart = (product: Recommendation) => {
    addItem({
      id: product.id,
      productId: product.id,
      name: product.name,
      price: product.price,
      quantity: 1,
      image: product.images[0] || '',
      sku: product.id.slice(0, 8).toUpperCase(),
      unit: product.unit
    })
  }

  const handleCheckout = async () => {
    if (items.length === 0) return

    setIsProcessing(true)
    // Simulate processing
    await new Promise(resolve => setTimeout(resolve, 1000))

    // Redirect to checkout page
    router.push('/checkout')
  }

  const handleExportQuote = () => {
    const doc = new jsPDF()

    // Header
    doc.setFontSize(22)
    doc.setTextColor(41, 128, 185)
    doc.text("SMARTBUILD - BAO GIA", 105, 20, { align: 'center' })

    doc.setFontSize(10)
    doc.setTextColor(100)
    doc.text(`Ngay: ${new Date().toLocaleDateString('vi-VN')}`, 20, 30)
    doc.text(`Khach hang: Quy khach`, 20, 35)

    // Table
    const tableColumn = ["STT", "Ten San Pham", "Don Vi", "SL", "Don Gia", "Thanh Tien"]
    const tableRows = items.map((item, index) => {
      const isWholesale = item.wholesalePrice && item.minWholesaleQty && item.quantity >= item.minWholesaleQty
      const unitPrice = isWholesale ? item.wholesalePrice! : item.price

      return [
        index + 1,
        item.name.normalize("NFD").replace(/[\u0300-\u036f]/g, ""), // Remove accents for basic PDF support
        item.unit,
        item.quantity,
        unitPrice.toLocaleString('vi-VN'),
        (unitPrice * item.quantity).toLocaleString('vi-VN')
      ]
    })

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 45,
      theme: 'grid',
      headStyles: { fillColor: [41, 128, 185] },
      styles: { font: 'helvetica', fontSize: 10 }
    })

    // Footer
    const finalY = (doc as any).lastAutoTable.finalY || 45
    doc.setFontSize(12)
    doc.setTextColor(0)
    doc.text(`Tong cong: ${finalTotal.toLocaleString('vi-VN')} VND`, 140, finalY + 15)

    doc.setFontSize(10)
    doc.setTextColor(150)
    doc.text(`* Bao gia co hieu luc trong 3 ngay ke tu ngay xuat.`, 20, finalY + 25)
    doc.text(`* Mien phi van chuyen cho don hang tren 50 trieu.`, 20, finalY + 30)

    doc.save(`Bao_Gia_SmartBuild_${Date.now()}.pdf`)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <Header />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-gray-600 mb-8">
          <Link href="/" className="hover:text-primary-600">Trang chủ</Link>
          <span>/</span>
          <span className="text-gray-900 font-semibold">Giỏ hàng</span>
        </div>

        {/* Page Title */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-black text-gray-900 mb-2">
              🛒 Giỏ Hàng Của Bạn
            </h1>
            <p className="text-gray-600">
              {items.length > 0 ? `Bạn có ${items.length} sản phẩm trong giỏ hàng` : 'Giỏ hàng của bạn đang trống'}
            </p>
          </div>
          {items.length > 0 && (
            <button
              onClick={() => {
                if (confirm('Bạn có chắc muốn xóa tất cả sản phẩm trong giỏ hàng?')) {
                  clearCart()
                }
              }}
              className="text-red-600 hover:text-red-700 font-semibold flex items-center gap-2"
            >
              <Trash2 className="h-5 w-5" />
              Xóa tất cả
            </button>
          )}
        </div>

        {items.length === 0 ? (
          /* Empty Cart State */
          <div className="bg-white rounded-3xl shadow-xl p-16 text-center">
            <ShoppingBag className="h-32 w-32 text-gray-300 mx-auto mb-6" />
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Giỏ hàng trống
            </h2>
            <p className="text-gray-600 mb-8 text-lg">
              Hãy thêm sản phẩm vào giỏ hàng để tiếp tục mua sắm!
            </p>
            <Link
              href="/products"
              className="inline-flex items-center gap-2 bg-primary-600 text-white px-8 py-4 rounded-xl hover:bg-primary-700 transition-colors font-bold text-lg shadow-lg hover:shadow-xl"
            >
              <ArrowLeft className="h-5 w-5" />
              Khám Phá Sản Phẩm
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Cart Items */}
            <div className="lg:col-span-2 space-y-6">
              {/* Products List */}
              <div className="space-y-4">
                {items.map((item) => {
                  const isWholesale = item.wholesalePrice && item.minWholesaleQty && item.quantity >= item.minWholesaleQty
                  const unitPrice = isWholesale ? item.wholesalePrice! : item.price

                  return (
                    <div
                      key={item.productId}
                      className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-shadow border border-gray-100"
                    >
                      <div className="flex gap-6">
                        {/* Product Image */}
                        <div className="relative w-32 h-32 bg-gray-100 rounded-xl overflow-hidden flex-shrink-0 border-2 border-gray-200">
                          {item.image ? (
                            <Image
                              src={item.image}
                              alt={item.name}
                              fill
                              className="object-cover"
                            />
                          ) : (
                            <div className="w-full h-full bg-gradient-to-br from-blue-100 to-purple-200 flex items-center justify-center">
                              <Package className="h-16 w-16 text-gray-400" />
                            </div>
                          )}
                        </div>

                        {/* Product Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-start mb-3">
                            <div>
                              <h3 className="text-xl font-bold text-gray-900 mb-1">
                                {item.name}
                              </h3>
                              <p className="text-sm text-gray-500">
                                SKU: {item.sku} • Đơn vị: {item.unit}
                              </p>
                              {isWholesale && (
                                <span className="inline-block mt-1 bg-green-100 text-green-700 text-xs font-bold px-2 py-0.5 rounded-full">
                                  Giá sỉ áp dụng
                                </span>
                              )}
                            </div>
                            <button
                              onClick={() => removeItem(item.productId)}
                              className="p-2 hover:bg-red-50 text-red-600 rounded-lg transition-colors"
                              aria-label="Xóa sản phẩm"
                            >
                              <Trash2 className="h-5 w-5" />
                            </button>
                          </div>

                          <div className="flex items-center justify-between">
                            {/* Quantity Controls */}
                            <div className="flex items-center gap-3">
                              <button
                                onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                                className="w-10 h-10 flex items-center justify-center border-2 border-gray-300 rounded-lg hover:bg-gray-100 transition-colors text-gray-700 hover:text-gray-900"
                                aria-label="Giảm số lượng"
                              >
                                <Minus className="h-4 w-4" />
                              </button>
                              <input
                                type="number"
                                value={item.quantity}
                                onChange={(e) => {
                                  const value = parseInt(e.target.value) || 0
                                  updateQuantity(item.productId, value)
                                }}
                                className="w-20 text-center border-2 border-gray-300 rounded-lg py-2 font-bold text-lg text-gray-900 focus:border-primary-500 focus:outline-none"
                                min="1"
                              />
                              <button
                                onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                                className="w-10 h-10 flex items-center justify-center border-2 border-gray-300 rounded-lg hover:bg-gray-100 transition-colors text-gray-700 hover:text-gray-900"
                                aria-label="Tăng số lượng"
                              >
                                <Plus className="h-4 w-4" />
                              </button>
                            </div>

                            {/* Price */}
                            <div className="text-right">
                              <p className="text-sm text-gray-500 mb-1">
                                {unitPrice.toLocaleString()}đ x {item.quantity}
                              </p>
                              <p className="text-2xl font-black text-primary-600">
                                {(unitPrice * item.quantity).toLocaleString()}đ
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Recommendations Section - Right after cart items */}
              <div className="mt-8">
                <div className="flex items-center gap-3 mb-6">
                  <Sparkles className="h-7 w-7 text-primary-600" />
                  <h2 className="text-3xl font-black text-gray-900">
                    Có Thể Bạn Cũng Thích
                  </h2>
                </div>

                {loadingRecommendations ? (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {[...Array(6)].map((_, i) => (
                      <div key={i} className="bg-white rounded-xl shadow-md p-4 animate-pulse">
                        <div className="aspect-square bg-gray-200 rounded-lg mb-3" />
                        <div className="h-4 bg-gray-200 rounded mb-2" />
                        <div className="h-4 bg-gray-200 rounded w-2/3" />
                      </div>
                    ))}
                  </div>
                ) : recommendations.length > 0 ? (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {recommendations.map((product) => (
                      <div
                        key={product.id}
                        className="relative bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100 group"
                      >
                        {/* Badge */}
                        {product.badge && (
                          <div className="absolute top-2 left-2 z-10 bg-gradient-to-r from-orange-500 to-red-500 text-white text-xs font-bold px-2 py-1 rounded-full shadow-lg">
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

                          {/* Reason */}
                          <p className="text-xs text-gray-600 mb-3 line-clamp-1">
                            {product.reason}
                          </p>

                          {/* Add to Cart Button */}
                          <button
                            onClick={() => handleAddToCart(product)}
                            disabled={!product.inStock}
                            className={`w-full py-2 rounded-lg font-semibold text-sm transition-all ${product.inStock
                              ? 'bg-primary-600 text-white hover:bg-primary-700 hover:shadow-lg'
                              : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                              }`}
                          >
                            {product.inStock ? (
                              <>
                                <Plus className="h-4 w-4 inline mr-1" />
                                Thêm vào giỏ
                              </>
                            ) : (
                              'Hết hàng'
                            )}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : null}
              </div>
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-2xl shadow-xl p-6 sticky top-24 border-2 border-primary-100">
                <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                  <CreditCard className="h-6 w-6 text-primary-600" />
                  Tóm Tắt Đơn Hàng
                </h2>

                <div className="space-y-4 mb-6">
                  <div className="flex justify-between text-gray-600">
                    <span>Tạm tính:</span>
                    <span className="font-semibold">{totalPrice.toLocaleString()}đ</span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <div className="flex items-center gap-2">
                      <Truck className="h-4 w-4" />
                      <span>Phí vận chuyển:</span>
                    </div>
                    <span className="font-semibold">{shippingFee.toLocaleString()}đ</span>
                  </div>
                  <div className="border-t-2 border-gray-200 pt-4 flex justify-between text-xl font-black">
                    <span>Tổng cộng:</span>
                    <span className="text-primary-600">{finalTotal.toLocaleString()}đ</span>
                  </div>
                </div>

                <button
                  onClick={handleCheckout}
                  disabled={isProcessing}
                  className="w-full bg-gradient-to-r from-primary-600 to-secondary-600 text-white py-4 rounded-xl hover:from-primary-700 hover:to-secondary-700 transition-all duration-300 font-bold text-lg flex items-center justify-center gap-2 shadow-lg hover:shadow-2xl disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isProcessing ? (
                    <>Đang xử lý...</>
                  ) : (
                    <>
                      Tiến Hành Thanh Toán
                      <ArrowRight className="h-5 w-5" />
                    </>
                  )}
                </button>

                <button
                  onClick={handleExportQuote}
                  className="w-full mt-3 bg-white text-slate-700 py-3 rounded-xl border-2 border-slate-200 hover:bg-slate-50 transition-colors font-bold text-center flex items-center justify-center gap-2"
                >
                  <FileText className="h-5 w-5 text-slate-500" />
                  Xuất Báo Giá (PDF)
                </button>

                <Link
                  href="/products"
                  className="w-full mt-3 bg-white text-primary-600 py-3 rounded-xl border-2 border-primary-600 hover:bg-primary-50 transition-colors font-bold text-center flex items-center justify-center gap-2"
                >
                  <ArrowLeft className="h-5 w-5" />
                  Tiếp Tục Mua Sắm
                </Link>

                {/* Trust Badges */}
                <div className="mt-6 pt-6 border-t border-gray-200 space-y-3">
                  <div className="flex items-center gap-3 text-sm text-gray-600">
                    <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Truck className="h-4 w-4 text-green-600" />
                    </div>
                    <span>Giao hàng nhanh chóng 24h</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-gray-600">
                    <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <CreditCard className="h-4 w-4 text-blue-600" />
                    </div>
                    <span>Thanh toán an toàn & bảo mật</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-gray-600">
                    <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Package className="h-4 w-4 text-purple-600" />
                    </div>
                    <span>Đổi trả miễn phí trong 7 ngày</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
