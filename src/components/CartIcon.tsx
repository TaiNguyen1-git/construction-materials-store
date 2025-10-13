'use client'

import { ShoppingCart } from 'lucide-react'
import { useCartStore } from '@/stores/cartStore'

export default function CartIcon() {
  const { getTotalItems, toggleCart } = useCartStore()
  const totalItems = getTotalItems()

  return (
    <button
      onClick={toggleCart}
      className="relative p-2 hover:bg-gray-100 rounded-lg transition-colors"
      aria-label="Giỏ hàng"
    >
      <ShoppingCart className="h-6 w-6 text-gray-700" />
      {totalItems > 0 && (
        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center animate-bounce">
          {totalItems > 99 ? '99+' : totalItems}
        </span>
      )}
    </button>
  )
}
