'use client'

import { X, Plus, Minus, Trash2, ShoppingBag, ArrowRight } from 'lucide-react'
import { useCartStore } from '@/stores/cartStore'
import Link from 'next/link'
import Image from 'next/image'
import { useEffect } from 'react'

export default function CartDrawer() {
  const { items, isOpen, closeCart, updateQuantity, removeItem, getTotalPrice } = useCartStore()

  // Prevent body scroll when drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  if (!isOpen) return null

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-[45] transition-opacity duration-300 animate-fade-in"
        onClick={closeCart}
      />

      {/* Drawer */}
      <div className="fixed right-0 top-0 h-full w-full max-w-md bg-white shadow-2xl z-[60] flex flex-col animate-slide-in">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center gap-2">
            <ShoppingBag className="h-6 w-6 text-primary-600" />
            <h2 className="text-2xl font-bold text-gray-900">Giỏ Hàng</h2>
            {items.length > 0 && (
              <span className="bg-primary-100 text-primary-600 px-2 py-1 rounded-full text-sm font-semibold">
                {items.length}
              </span>
            )}
          </div>
          <button
            onClick={closeCart}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Đóng giỏ hàng"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Cart Items */}
        <div className="flex-1 overflow-y-auto p-6">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <ShoppingBag className="h-24 w-24 text-gray-300 mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Giỏ hàng trống
              </h3>
              <p className="text-gray-600 mb-6">
                Thêm sản phẩm vào giỏ hàng để tiếp tục mua sắm
              </p>
              <Link
                href="/products"
                onClick={closeCart}
                className="bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700 transition-colors font-semibold"
              >
                Khám Phá Sản Phẩm
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {items.map((item) => {
                // Validate item data
                if (!item || !item.productId) {
                  console.error('Invalid cart item:', item)
                  return null
                }

                return (
                  <div
                    key={item.productId}
                    className="flex gap-4 p-4 bg-gray-50 rounded-lg border border-gray-200 hover:border-primary-300 transition-colors"
                  >
                    {/* Product Image */}
                    <div className="relative w-20 h-20 bg-white rounded-lg overflow-hidden flex-shrink-0 border">
                      {item.image ? (
                        <Image
                          src={item.image}
                          alt={item.name || 'Product'}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                          <ShoppingBag className="h-8 w-8 text-gray-400" />
                        </div>
                      )}
                    </div>

                    {/* Product Info */}
                    <div className="flex-1 min-w-0 flex flex-col">
                      <h3 className="font-semibold text-gray-900 truncate mb-1">
                        {item.name || 'Tên sản phẩm'}
                      </h3>
                      <p className="text-sm text-gray-500 mb-2">
                        SKU: {item.sku || 'N/A'}
                      </p>
                      <div className="flex items-center gap-2 mb-3">
                        <p className="text-lg font-bold text-primary-600">
                          {(item.price || 0).toLocaleString()}đ
                        </p>
                        <p className="text-sm text-gray-500">
                          /{item.unit || 'cái'}
                        </p>
                      </div>

                      {/* Quantity Controls */}
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                          className="p-1 hover:bg-white rounded border border-gray-300 transition-colors"
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
                          className="w-16 text-center border border-gray-300 rounded py-1 font-semibold"
                          min="1"
                        />
                        <button
                          onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                          className="p-1 hover:bg-white rounded border border-gray-300 transition-colors"
                          aria-label="Tăng số lượng"
                        >
                          <Plus className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => removeItem(item.productId)}
                          className="ml-auto p-2 hover:bg-red-50 text-red-600 rounded transition-colors"
                          aria-label="Xóa sản phẩm"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>

                      {/* Subtotal & Upsell Suggestion */}
                      <div className="mt-2 flex flex-col gap-1">
                        <p className="text-sm text-gray-600">
                          Tổng: <span className="font-semibold text-gray-900">
                            {((item.price || 0) * (item.quantity || 0)).toLocaleString()}đ
                          </span>
                        </p>

                        {/* Feature 5: Bulk Discount Hint */}
                        {item.quantity >= 5 && item.quantity < 10 && (
                          <div className="p-1 px-2 bg-amber-50 rounded border border-amber-100 text-[10px] text-amber-700 font-bold flex items-center gap-1 animate-pulse">
                            <Plus className="w-3 h-3" />
                            MUA THÊM {10 - item.quantity} ĐỂ NHẬN GIÁ SĨ NHÀ THẦU (-15%)
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="border-t p-6 bg-gray-50">
            <div className="space-y-3 mb-4">
              <div className="flex justify-between text-gray-600">
                <span>Tạm tính:</span>
                <span className="font-semibold">{getTotalPrice().toLocaleString()}đ</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Phí vận chuyển:</span>
                <span className="font-semibold">Tính sau</span>
              </div>
              <div className="border-t pt-3 flex justify-between text-lg font-bold text-gray-900">
                <span>Tổng cộng:</span>
                <span className="text-primary-600">{getTotalPrice().toLocaleString()}đ</span>
              </div>
            </div>

            <Link
              href="/cart"
              onClick={closeCart}
              className="w-full bg-primary-600 text-white py-4 rounded-lg hover:bg-primary-700 transition-colors font-bold text-center flex items-center justify-center gap-2 shadow-lg hover:shadow-xl"
            >
              Xem Giỏ Hàng & Thanh Toán
              <ArrowRight className="h-5 w-5" />
            </Link>

            <Link
              href="/products"
              onClick={closeCart}
              className="w-full mt-3 bg-white text-primary-600 py-3 rounded-lg border-2 border-primary-600 hover:bg-primary-50 transition-colors font-semibold text-center block"
            >
              Tiếp Tục Mua Sắm
            </Link>
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes slide-in {
          from {
            transform: translateX(100%);
          }
          to {
            transform: translateX(0);
          }
        }
        @keyframes fade-in {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        .animate-slide-in {
          animation: slide-in 0.3s ease-out;
        }
        .animate-fade-in {
          animation: fade-in 0.3s ease-out;
        }
      `}</style>
    </>
  )
}
