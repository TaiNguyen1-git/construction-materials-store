'use client'

import { useWishlistStore } from '@/stores/wishlistStore'
import { useCartStore } from '@/stores/cartStore'
import Header from '@/components/Header'
import Link from 'next/link'
import Image from 'next/image'
import { Heart, ShoppingCart, Trash2, ArrowLeft, Package } from 'lucide-react'
import toast, { Toaster } from 'react-hot-toast'

export default function WishlistPage() {
  const { items, removeItem, clearWishlist } = useWishlistStore()
  const { addItem: addToCart } = useCartStore()

  const handleAddToCart = (item: typeof items[0]) => {
    if (!item.inStock) {
      toast.error('Sản phẩm hiện đã hết hàng')
      return
    }

    addToCart({
      id: item.id,
      productId: item.productId,
      name: item.name,
      price: item.price,
      sku: item.sku,
      unit: 'pcs',
      image: item.image
    })
    
    toast.success('Đã thêm vào giỏ hàng!')
  }

  const handleAddAllToCart = () => {
    const inStockItems = items.filter(item => item.inStock)
    
    if (inStockItems.length === 0) {
      toast.error('Không có sản phẩm nào còn hàng')
      return
    }

    inStockItems.forEach(item => {
      addToCart({
        id: item.id,
        productId: item.productId,
        name: item.name,
        price: item.price,
        sku: item.sku,
        unit: 'pcs',
        image: item.image
      })
    })

    toast.success(`Đã thêm ${inStockItems.length} sản phẩm vào giỏ hàng!`)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <Toaster position="top-right" />
      <Header />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-gray-600 mb-8">
          <Link href="/" className="hover:text-primary-600">Trang chủ</Link>
          <span>/</span>
          <span className="text-gray-900 font-semibold">Yêu thích</span>
        </div>

        {/* Page Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-black text-gray-900 mb-2 flex items-center gap-3">
              <Heart className="h-10 w-10 text-red-500 fill-current" />
              Sản Phẩm Yêu Thích
            </h1>
            <p className="text-gray-600">
              {items.length > 0 ? `Bạn có ${items.length} sản phẩm yêu thích` : 'Danh sách yêu thích của bạn đang trống'}
            </p>
          </div>
          {items.length > 0 && (
            <div className="flex gap-3">
              <button
                onClick={handleAddAllToCart}
                className="bg-primary-600 text-white px-6 py-3 rounded-xl hover:bg-primary-700 transition-colors font-bold flex items-center gap-2"
              >
                <ShoppingCart className="h-5 w-5" />
                Thêm Tất Cả Vào Giỏ
              </button>
              <button
                onClick={() => {
                  if (confirm('Bạn có chắc muốn xóa tất cả sản phẩm yêu thích?')) {
                    clearWishlist()
                    toast.success('Đã xóa tất cả')
                  }
                }}
                className="text-red-600 hover:text-red-700 font-semibold flex items-center gap-2 px-4"
              >
                <Trash2 className="h-5 w-5" />
                Xóa tất cả
              </button>
            </div>
          )}
        </div>

        {items.length === 0 ? (
          /* Empty State */
          <div className="bg-white rounded-3xl shadow-xl p-16 text-center">
            <Heart className="h-32 w-32 text-gray-300 mx-auto mb-6" />
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Chưa có sản phẩm yêu thích
            </h2>
            <p className="text-gray-600 mb-8 text-lg">
              Khám phá và thêm những sản phẩm bạn yêu thích vào đây!
            </p>
            <Link
              href="/products"
              className="inline-flex items-center gap-2 bg-primary-600 text-white px-8 py-4 rounded-xl hover:bg-primary-700 transition-colors font-bold text-lg shadow-lg"
            >
              <ArrowLeft className="h-5 w-5" />
              Khám Phá Sản Phẩm
            </Link>
          </div>
        ) : (
          /* Wishlist Grid */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {items.map((item) => (
              <div
                key={item.productId}
                className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden group border border-gray-100"
              >
                {/* Image */}
                <Link href={`/products/${item.productId}`} className="relative block aspect-square bg-gradient-to-br from-gray-100 to-gray-200">
                  {item.image ? (
                    <Image
                      src={item.image}
                      alt={item.name}
                      fill
                      className="object-cover group-hover:scale-110 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Package className="h-16 w-16 text-gray-400" />
                    </div>
                  )}
                  
                  {/* Remove Button */}
                  <button
                    onClick={(e) => {
                      e.preventDefault()
                      removeItem(item.productId)
                      toast.success('Đã xóa khỏi yêu thích')
                    }}
                    className="absolute top-2 right-2 p-2 bg-white/90 backdrop-blur-sm rounded-lg hover:bg-red-50 hover:text-red-600 transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>

                  {/* Stock Badge */}
                  <div className={`absolute top-2 left-2 px-3 py-1 rounded-lg text-xs font-bold ${
                    item.inStock
                      ? 'bg-green-500 text-white'
                      : 'bg-red-500 text-white'
                  }`}>
                    {item.inStock ? 'Còn hàng' : 'Hết hàng'}
                  </div>
                </Link>

                {/* Info */}
                <div className="p-4">
                  <Link href={`/products/${item.productId}`}>
                    <h3 className="font-bold text-gray-900 mb-2 line-clamp-2 hover:text-primary-600 transition-colors">
                      {item.name}
                    </h3>
                  </Link>
                  <p className="text-sm text-gray-500 mb-3">SKU: {item.sku}</p>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-2xl font-black text-primary-600">
                      {item.price.toLocaleString()}đ
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleAddToCart(item)}
                      disabled={!item.inStock}
                      className="flex-1 bg-primary-600 text-white py-2 rounded-lg hover:bg-primary-700 transition-colors font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <ShoppingCart className="h-4 w-4" />
                      Thêm Vào Giỏ
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Continue Shopping */}
        {items.length > 0 && (
          <div className="mt-12 text-center">
            <Link
              href="/products"
              className="inline-flex items-center gap-2 bg-white text-primary-600 px-8 py-4 rounded-xl border-2 border-primary-600 hover:bg-primary-50 transition-colors font-bold shadow-lg"
            >
              <ArrowLeft className="h-5 w-5" />
              Tiếp Tục Khám Phá
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
