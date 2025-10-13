'use client'

import { useComparisonStore } from '@/stores/comparisonStore'
import Link from 'next/link'
import Image from 'next/image'
import { Scale, X, Package } from 'lucide-react'

export default function ComparisonBar() {
  const { products, removeProduct, clearAll, getCount } = useComparisonStore()

  if (getCount() === 0) return null

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t-2 border-primary-500 shadow-2xl z-50">
      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="flex items-center justify-between gap-4">
          {/* Title */}
          <div className="flex items-center gap-2">
            <Scale className="h-5 w-5 text-primary-600" />
            <span className="font-bold text-gray-900">
              So sánh ({getCount()}/4)
            </span>
          </div>

          {/* Products */}
          <div className="flex-1 flex items-center gap-3 overflow-x-auto">
            {products.map((product) => (
              <div
                key={product.id}
                className="relative flex-shrink-0 bg-gray-50 rounded-lg p-2 flex items-center gap-2 border border-gray-200 hover:border-primary-500 transition-colors"
              >
                {product.images && product.images.length > 0 ? (
                  <Image
                    src={product.images[0]}
                    alt={product.name}
                    width={40}
                    height={40}
                    className="rounded object-cover"
                  />
                ) : (
                  <div className="w-10 h-10 bg-gray-200 rounded flex items-center justify-center">
                    <Package className="h-5 w-5 text-gray-400" />
                  </div>
                )}
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-gray-900 truncate max-w-[150px]">
                    {product.name}
                  </p>
                  <p className="text-xs text-primary-600 font-bold">
                    {product.price.toLocaleString()}đ
                  </p>
                </div>
                <button
                  onClick={() => removeProduct(product.id)}
                  className="ml-1 p-1 hover:bg-red-100 rounded-full transition-colors"
                >
                  <X className="h-4 w-4 text-gray-400 hover:text-red-600" />
                </button>
              </div>
            ))}

            {/* Empty slots */}
            {[...Array(Math.max(0, 4 - getCount()))].map((_, idx) => (
              <div
                key={`empty-${idx}`}
                className="flex-shrink-0 w-48 h-16 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center text-gray-400 text-xs"
              >
                Slot trống
              </div>
            ))}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={clearAll}
              className="text-sm text-gray-600 hover:text-red-600 font-semibold px-3 py-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              Xóa tất cả
            </button>
            <Link
              href="/comparison"
              className="bg-primary-600 text-white px-6 py-2 rounded-lg hover:bg-primary-700 transition-colors font-bold text-sm shadow-lg"
            >
              So sánh ngay
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
