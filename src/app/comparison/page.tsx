'use client'

import { useComparisonStore } from '@/stores/comparisonStore'
import Header from '@/components/Header'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowLeft, Package, ShoppingCart, X, Check, Minus } from 'lucide-react'
import { useCartStore } from '@/stores/cartStore'
import toast, { Toaster } from 'react-hot-toast'

export default function ComparisonPage() {
  const { products, removeProduct, clearAll } = useComparisonStore()
  const { addItem } = useCartStore()

  const handleAddToCart = (product: typeof products[0]) => {
    if (!product.inventoryItem?.availableQuantity || product.inventoryItem.availableQuantity <= 0) {
      toast.error('Sản phẩm đã hết hàng')
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
    })
    
    toast.success('Đã thêm vào giỏ hàng!')
  }

  if (products.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <Toaster position="top-right" />
        <Header />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
          <Package className="h-32 w-32 text-gray-300 mx-auto mb-6" />
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Chưa có sản phẩm nào để so sánh
          </h2>
          <p className="text-gray-600 mb-8 text-lg">
            Thêm sản phẩm vào danh sách so sánh để xem chi tiết!
          </p>
          <Link
            href="/products"
            className="inline-flex items-center gap-2 bg-primary-600 text-white px-8 py-4 rounded-xl hover:bg-primary-700 transition-colors font-bold text-lg shadow-lg"
          >
            <ArrowLeft className="h-5 w-5" />
            Khám Phá Sản Phẩm
          </Link>
        </div>
      </div>
    )
  }

  // Get all unique attributes
  const attributes = [
    { key: 'price', label: 'Giá', format: (val: number) => `${val.toLocaleString()}đ` },
    { key: 'category', label: 'Danh mục', format: (val: any) => val?.name || '-' },
    { key: 'sku', label: 'Mã SKU', format: (val: string) => val },
    { key: 'unit', label: 'Đơn vị', format: (val: string) => val || '-' },
    { key: 'stock', label: 'Tồn kho', format: (val: any) => val?.availableQuantity ? `${val.availableQuantity} sản phẩm` : 'Hết hàng' },
    { key: 'weight', label: 'Khối lượng', format: (val: number) => val ? `${val} kg` : '-' },
    { key: 'dimensions', label: 'Kích thước', format: (val: string) => val || '-' },
    { key: 'description', label: 'Mô tả', format: (val: string) => val },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <Toaster position="top-right" />
      <Header />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-gray-600 mb-8">
          <Link href="/" className="hover:text-primary-600">Trang chủ</Link>
          <span>/</span>
          <span className="text-gray-900 font-semibold">So sánh sản phẩm</span>
        </div>

        {/* Page Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-black text-gray-900 mb-2 flex items-center gap-3">
              ⚖️ So Sánh Sản Phẩm
            </h1>
            <p className="text-gray-600">
              Đang so sánh {products.length} sản phẩm
            </p>
          </div>
          <div className="flex gap-3">
            <Link
              href="/products"
              className="text-gray-600 hover:text-primary-600 font-semibold flex items-center gap-2 px-4"
            >
              <ArrowLeft className="h-5 w-5" />
              Thêm sản phẩm
            </Link>
            <button
              onClick={() => {
                if (confirm('Bạn có chắc muốn xóa tất cả sản phẩm khỏi danh sách so sánh?')) {
                  clearAll()
                  toast.success('Đã xóa tất cả')
                }
              }}
              className="text-red-600 hover:text-red-700 font-semibold flex items-center gap-2 px-4"
            >
              Xóa tất cả
            </button>
          </div>
        </div>

        {/* Comparison Table */}
        <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gradient-to-r from-primary-600 to-secondary-600">
                  <th className="w-48 px-6 py-4 text-left text-white font-bold sticky left-0 bg-gradient-to-r from-primary-600 to-secondary-600 z-10">
                    Thuộc tính
                  </th>
                  {products.map((product) => (
                    <th key={product.id} className="px-6 py-4 text-white min-w-[250px]">
                      <div className="relative">
                        <button
                          onClick={() => {
                            removeProduct(product.id)
                            toast.success('Đã xóa khỏi so sánh')
                          }}
                          className="absolute -top-2 -right-2 p-1 bg-white rounded-full hover:bg-red-50 transition-colors"
                        >
                          <X className="h-4 w-4 text-gray-600 hover:text-red-600" />
                        </button>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {/* Product Images & Names */}
                <tr className="border-b border-gray-200 bg-gray-50">
                  <td className="px-6 py-4 font-semibold text-gray-700 sticky left-0 bg-gray-50 z-10">
                    Sản phẩm
                  </td>
                  {products.map((product) => (
                    <td key={product.id} className="px-6 py-4">
                      <Link href={`/products/${product.id}`} className="block">
                        <div className="aspect-square bg-white rounded-xl overflow-hidden mb-3 border border-gray-200">
                          {product.images && product.images.length > 0 ? (
                            <Image
                              src={product.images[0]}
                              alt={product.name}
                              width={200}
                              height={200}
                              className="w-full h-full object-cover hover:scale-110 transition-transform"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-gray-100">
                              <Package className="h-16 w-16 text-gray-400" />
                            </div>
                          )}
                        </div>
                        <h3 className="font-bold text-gray-900 line-clamp-2 hover:text-primary-600 transition-colors">
                          {product.name}
                        </h3>
                      </Link>
                    </td>
                  ))}
                </tr>

                {/* Attributes */}
                {attributes.map((attr, idx) => (
                  <tr key={attr.key} className={`border-b border-gray-100 ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                    <td className={`px-6 py-4 font-semibold text-gray-700 sticky left-0 z-10 ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                      {attr.label}
                    </td>
                    {products.map((product) => {
                      let value: any = product[attr.key as keyof typeof product]
                      if (attr.key === 'stock') value = product.inventoryItem
                      if (attr.key === 'category') value = product.category

                      return (
                        <td key={product.id} className="px-6 py-4">
                          <div className={`${attr.key === 'price' ? 'text-2xl font-black text-primary-600' : 'text-gray-700'} ${attr.key === 'description' ? 'text-sm' : ''}`}>
                            {attr.format(value)}
                          </div>
                        </td>
                      )
                    })}
                  </tr>
                ))}

                {/* Tags */}
                <tr className="border-b border-gray-100">
                  <td className="px-6 py-4 font-semibold text-gray-700 sticky left-0 bg-white z-10">
                    Tags
                  </td>
                  {products.map((product) => (
                    <td key={product.id} className="px-6 py-4">
                      <div className="flex flex-wrap gap-1">
                        {product.tags && product.tags.length > 0 ? (
                          product.tags.map((tag, idx) => (
                            <span
                              key={idx}
                              className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-semibold"
                            >
                              {tag}
                            </span>
                          ))
                        ) : (
                          <span className="text-gray-400 text-sm">-</span>
                        )}
                      </div>
                    </td>
                  ))}
                </tr>

                {/* Actions */}
                <tr className="bg-gray-50">
                  <td className="px-6 py-4 font-semibold text-gray-700 sticky left-0 bg-gray-50 z-10">
                    Hành động
                  </td>
                  {products.map((product) => (
                    <td key={product.id} className="px-6 py-4">
                      <div className="flex flex-col gap-2">
                        <button
                          onClick={() => handleAddToCart(product)}
                          disabled={!product.inventoryItem?.availableQuantity || product.inventoryItem.availableQuantity <= 0}
                          className="w-full bg-primary-600 text-white py-2 rounded-lg hover:bg-primary-700 transition-colors font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <ShoppingCart className="h-4 w-4" />
                          Thêm vào giỏ
                        </button>
                        <Link
                          href={`/products/${product.id}`}
                          className="w-full border-2 border-primary-600 text-primary-600 py-2 rounded-lg hover:bg-primary-50 transition-colors font-bold text-sm text-center"
                        >
                          Xem chi tiết
                        </Link>
                      </div>
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Add More Products */}
        {products.length < 4 && (
          <div className="mt-8 text-center">
            <Link
              href="/products"
              className="inline-flex items-center gap-2 bg-white text-primary-600 px-8 py-4 rounded-xl border-2 border-primary-600 hover:bg-primary-50 transition-colors font-bold shadow-lg"
            >
              Thêm sản phẩm khác ({products.length}/4)
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
