'use client'

import { Heart } from 'lucide-react'
import { useWishlistStore } from '@/stores/wishlistStore'
import toast from 'react-hot-toast'

interface WishlistButtonProps {
  product: {
    id: string
    name: string
    price: number
    sku: string
    images?: string[]
    inventoryItem?: {
      availableQuantity: number
    }
  }
  size?: 'sm' | 'md' | 'lg'
  showText?: boolean
}

export default function WishlistButton({ product, size = 'md', showText = false }: WishlistButtonProps) {
  const { addItem, removeItem, isInWishlist } = useWishlistStore()
  const inWishlist = isInWishlist(product.id)

  const sizeClasses = {
    sm: 'p-1.5',
    md: 'p-2',
    lg: 'p-3'
  }

  const iconSizes = {
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-6 w-6'
  }

  const handleToggle = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    if (inWishlist) {
      removeItem(product.id)
      toast.success('Đã xóa khỏi yêu thích')
    } else {
      addItem({
        id: product.id,
        productId: product.id,
        name: product.name,
        price: product.price,
        sku: product.sku,
        image: product.images?.[0],
        inStock: (product.inventoryItem?.availableQuantity || 0) > 0
      })
      toast.success('Đã thêm vào yêu thích!', {
        icon: '❤️'
      })
    }
  }

  return (
    <button
      onClick={handleToggle}
      className={`${sizeClasses[size]} rounded-lg transition-all hover:scale-110 ${
        inWishlist
          ? 'bg-red-50 text-red-600 hover:bg-red-100'
          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
      } ${showText ? 'flex items-center gap-2 px-4' : ''}`}
      title={inWishlist ? 'Xóa khỏi yêu thích' : 'Thêm vào yêu thích'}
    >
      <Heart
        className={`${iconSizes[size]} ${inWishlist ? 'fill-current' : ''} transition-all`}
      />
      {showText && (
        <span className="font-semibold text-sm">
          {inWishlist ? 'Đã yêu thích' : 'Yêu thích'}
        </span>
      )}
    </button>
  )
}
