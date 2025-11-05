'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Package, Grid3X3, List } from 'lucide-react'
import Header from '@/components/Header'

interface Category {
  id: string
  name: string
  description?: string
  productCount?: number
  _count?: {
    products: number
  }
  image?: string
  subcategories?: Category[]
  children?: Category[]
  isActive?: boolean
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')

  useEffect(() => {
    fetchCategories()
  }, [])

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/categories')
      if (response.ok) {
        const data = await response.json()
        const categoriesData = data.data || []
        
        // Map API response to match frontend interface
        const mappedCategories = categoriesData
          .filter((cat: Category) => cat.isActive !== false) // Only show active categories
          .map((cat: Category) => ({
            id: cat.id,
            name: cat.name,
            description: cat.description || '',
            productCount: cat._count?.products || 0,
            children: cat.children || [],
            isActive: cat.isActive
          }))
        
        setCategories(mappedCategories)
      } else {
        setCategories([])
      }
    } catch (error) {
      console.error('Failed to fetch categories:', error)
      setCategories([])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <Header />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Danh mục sản phẩm</h1>
            <p className="text-gray-600">Khám phá các danh mục vật liệu xây dựng</p>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-md ${viewMode === 'grid' ? 'bg-blue-100 text-blue-600' : 'text-gray-600 hover:bg-gray-100'}`}
            >
              <Grid3X3 className="h-5 w-5" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-md ${viewMode === 'list' ? 'bg-blue-100 text-blue-600' : 'text-gray-600 hover:bg-gray-100'}`}
            >
              <List className="h-5 w-5" />
            </button>
          </div>
        </div>
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">Khám phá sản phẩm theo danh mục</h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Tìm kiếm vật liệu xây dựng chất lượng cao theo từng danh mục cụ thể
          </p>
        </div>

        {loading ? (
          <div className={`grid gap-6 ${viewMode === 'grid' ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'}`}>
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-white rounded-xl shadow-lg p-6 animate-pulse border border-gray-100">
                <div className="bg-gradient-to-br from-blue-100 to-blue-200 h-40 rounded-xl mb-4"></div>
                <div className="bg-gray-200 h-5 rounded mb-2"></div>
                <div className="bg-gray-200 h-4 rounded w-3/4 mb-4"></div>
                <div className="bg-gray-200 h-4 rounded w-1/3"></div>
              </div>
            ))}
          </div>
        ) : categories.length > 0 ? (
          <div className={`grid gap-6 ${viewMode === 'grid' ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'}`}>
            {categories.map((category) => (
              <Link
                key={category.id}
                href={`/products?category=${category.id}`}
                className="group bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100 hover:border-primary-300 hover:scale-105"
              >
                <div className="relative bg-gradient-to-br from-primary-100 via-primary-200 to-secondary-200 h-40 flex items-center justify-center overflow-hidden">
                  {category.image ? (
                    <img
                      src={category.image}
                      alt={category.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Package className="h-16 w-16 text-primary-600 group-hover:scale-110 transition-transform duration-300" />
                    </div>
                  )}
                  {category.productCount !== undefined && category.productCount > 0 && (
                    <div className="absolute top-3 right-3 bg-primary-600 text-white px-3 py-1 rounded-full text-xs font-bold">
                      {category.productCount} sản phẩm
                    </div>
                  )}
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-primary-600 transition-colors">
                    {category.name}
                  </h3>
                  <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                    {category.description || 'Khám phá các sản phẩm trong danh mục này'}
                  </p>
                  <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                    <span className="text-sm font-semibold text-gray-600">
                      {category.productCount !== undefined ? `${category.productCount} sản phẩm` : 'Xem sản phẩm'}
                    </span>
                    <span className="text-primary-600 text-sm font-bold group-hover:text-primary-700 transition-colors flex items-center gap-1">
                      Xem tất cả
                      <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </span>
                  </div>
                  {category.children && category.children.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-gray-100">
                      <p className="text-xs text-gray-500 mb-2">Danh mục con:</p>
                      <div className="flex flex-wrap gap-2">
                        {category.children.slice(0, 3).map((child: Category) => (
                          <span key={child.id} className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                            {child.name}
                          </span>
                        ))}
                        {category.children.length > 3 && (
                          <span className="text-xs text-gray-500">+{category.children.length - 3} khác</span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <Package className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Chưa có danh mục nào</h3>
            <p className="text-gray-600 mb-8">
              Các danh mục sản phẩm sẽ được hiển thị tại đây khi được thêm vào hệ thống.
            </p>
            <Link
              href="/products"
              className="inline-block px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Xem tất cả sản phẩm
            </Link>
          </div>
        )}

        {/* Popular Categories */}
        <div className="mt-16">
          <h3 className="text-2xl font-bold text-gray-900 mb-8 text-center">Danh mục phổ biến</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { name: 'Xi măng', icon: '🏗️', href: '/products?search=xi+măng' },
              { name: 'Thép xây dựng', icon: '🔩', href: '/products?search=thép' },
              { name: 'Gạch ốp lát', icon: '🧱', href: '/products?search=gạch' },
              { name: 'Sơn tường', icon: '🎨', href: '/products?search=sơn' },
              { name: 'Ống nước', icon: '🚰', href: '/products?search=ống' },
              { name: 'Điện tử', icon: '⚡', href: '/products?search=điện' },
              { name: 'Dụng cụ', icon: '🔨', href: '/products?search=dụng+cụ' },
              { name: 'Khác', icon: '📦', href: '/products' }
            ].map((item, index) => (
              <Link
                key={index}
                href={item.href}
                className="bg-white rounded-lg p-4 text-center hover:shadow-md transition-shadow"
              >
                <div className="text-3xl mb-2">{item.icon}</div>
                <p className="text-sm font-medium text-gray-900">{item.name}</p>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}