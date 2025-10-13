'use client'

import { Scale } from 'lucide-react'
import { useComparisonStore } from '@/stores/comparisonStore'
import toast from 'react-hot-toast'

interface ComparisonButtonProps {
  product: {
    id: string
    name: string
    price: number
    sku: string
    description: string
    images?: string[]
    category?: {
      id: string
      name: string
    }
    inventoryItem?: {
      availableQuantity: number
    }
    unit?: string
    weight?: number
    dimensions?: string
    tags?: string[]
  }
  size?: 'sm' | 'md' | 'lg'
  showText?: boolean
}

export default function ComparisonButton({ product, size = 'md', showText = false }: ComparisonButtonProps) {
  const { addProduct, removeProduct, isInComparison, canAddMore } = useComparisonStore()
  const inComparison = isInComparison(product.id)

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

    if (inComparison) {
      removeProduct(product.id)
      toast.success('Đã xóa khỏi so sánh')
    } else {
      if (!canAddMore()) {
        toast.error('Chỉ có thể so sánh tối đa 4 sản phẩm')
        return
      }

      const success = addProduct({
        id: product.id,
        name: product.name,
        price: product.price,
        sku: product.sku,
        description: product.description,
        images: product.images || [],
        category: product.category,
        inventoryItem: product.inventoryItem,
        unit: product.unit,
        weight: product.weight,
        dimensions: product.dimensions,
        tags: product.tags
      })

      if (success) {
        toast.success('Đã thêm vào so sánh!', {
          icon: '⚖️'
        })
      } else {
        toast.error('Sản phẩm đã có trong danh sách so sánh')
      }
    }
  }

  return (
    <button
      onClick={handleToggle}
      className={`${sizeClasses[size]} rounded-lg transition-all hover:scale-110 ${
        inComparison
          ? 'bg-blue-50 text-blue-600 hover:bg-blue-100'
          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
      } ${showText ? 'flex items-center gap-2 px-4' : ''}`}
      title={inComparison ? 'Xóa khỏi so sánh' : 'Thêm vào so sánh'}
    >
      <Scale
        className={`${iconSizes[size]} ${inComparison ? '' : ''} transition-all`}
      />
      {showText && (
        <span className="font-semibold text-sm">
          {inComparison ? 'Đang so sánh' : 'So sánh'}
        </span>
      )}
    </button>
  )
}
