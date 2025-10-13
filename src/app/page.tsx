'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { ShoppingCart, Package, Truck, Users, Star, ArrowRight, Sparkles, Zap, Award } from 'lucide-react'
import Header from '@/components/Header'

interface Product {
  id: string
  name: string
  price: number
  description: string
  images: string[]
  category: {
    name: string
  }
}

interface Stats {
  totalProducts: number
  totalCategories: number
  activeOrders: number
  totalCustomers: number
}

export default function HomePage() {
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([])
  const [stats, setStats] = useState<Stats>({
    totalProducts: 0,
    totalCategories: 0,
    activeOrders: 0,
    totalCustomers: 0
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchFeaturedProducts()
    fetchStats()
  }, [])

  const fetchFeaturedProducts = async () => {
    try {
      const response = await fetch('/api/products?featured=true&limit=6')
      if (response.ok) {
        const data = await response.json()
        setFeaturedProducts(data.data || [])
      } else {
        setFeaturedProducts([])
      }
    } catch (error) {
      console.error('Failed to fetch featured products:', error)
      setFeaturedProducts([])
    }
  }

  const fetchStats = async () => {
    try {
      // Mock stats for now
      setStats({
        totalProducts: 150,
        totalCategories: 12,
        activeOrders: 45,
        totalCustomers: 320
      })
    } catch (error) {
      console.error('Failed to fetch stats:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Header */}
      <Header />

      {/* Hero Section */}
      <section className="relative gradient-primary text-white overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width=%2240%22 height=%2240%22 viewBox=%220 0 40 40%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cg fill=%22%23ffffff%22 fill-opacity=%220.05%22%3E%3Cpath d=%22M20 20c0-11.046-8.954-20-20-20s-20 8.954-20 20 8.954 20 20 20 20-8.954 20-20zm-30 0c0-5.523 4.477-10 10-10s10 4.477 10 10-4.477 10-10 10-10-4.477-10-10z%22/%3E%3C/g%3E%3C/svg%3E')] animate-pulse"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 relative">
          <div className="text-center">
            <div className="flex justify-center mb-8">
              <div className="bg-white/10 backdrop-blur-md rounded-2xl px-6 py-3 border border-white/20">
                <span className="text-lg font-semibold">🔥 Vật Liệu Xây Dựng Chất Lượng Cao #1 Việt Nam</span>
              </div>
            </div>
            <h1 className="text-5xl md:text-7xl font-black mb-8 leading-tight">
              <span className="text-gradient-accent">
                Xây Dựng
              </span>
              <br />
              <span className="text-white">Ước Mơ Của Bạn</span> 
              <Sparkles className="inline-block ml-4 h-12 w-12 text-yellow-300 animate-spin" />
            </h1>
            <p className="text-xl md:text-3xl mb-12 text-blue-100 font-medium">
              🚀 Từ xi măng đến thép - Tất cả trong tầm tay! 
              <br />
              💎 Chất lượng đỉnh, giá cả thân thiện GenZ
            </p>
            <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
              <Link href="/products" className="group gradient-accent text-gray-900 px-10 py-4 rounded-2xl font-black hover:from-accent-400 hover:to-warning-400 transition-all duration-300 hover:scale-110 shadow-2xl inline-flex items-center text-lg">
                🛒 Mua Ngay
                <Zap className="ml-3 h-6 w-6 group-hover:animate-bounce" />
              </Link>
            </div>
            <div className="mt-12 flex justify-center space-x-8 text-sm font-semibold">
              <div className="flex items-center">
                <Award className="h-5 w-5 text-yellow-300 mr-2" />
                Top #1 VN
              </div>
              <div className="flex items-center">
                <Truck className="h-5 w-5 text-green-300 mr-2" />
                Giao hàng 24h
              </div>
              <div className="flex items-center">
                <Star className="h-5 w-5 text-pink-300 mr-2" />
                4.9⭐ (2.1k reviews)
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 bg-gradient-to-r from-white via-blue-50 to-purple-50 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width=%2260%22 height=%2260%22 viewBox=%220 0 60 60%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cg fill=%22%23f1f5f9%22 fill-opacity=%220.4%22%3E%3Ccircle cx=%2230%22 cy=%2230%22 r=%222%22/%3E%3C/g%3E%3C/svg%3E')]"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-black text-gray-900 mb-4">
              📈 Thống Kê Ấn Tượng 
              <span className="text-gradient-primary">Làm Nên Thương Hiệu</span>
            </h2>
            <p className="text-xl text-gray-600 font-medium">Con số không nói dối - Chúng tôi là những gì GenZ cần! 🔥</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="text-center group hover:scale-110 transition-all duration-300">
              <div className="bg-gradient-to-br from-primary-400 to-primary-600 w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-xl group-hover:shadow-2xl group-hover:rotate-3 transition-all duration-300">
                <Package className="h-10 w-10 text-white" />
              </div>
              <div className="text-4xl font-black text-gray-900 mb-2">{stats.totalProducts}+</div>
              <div className="text-lg font-semibold text-gray-600">📦 Sản Phẩm</div>
              <div className="text-sm text-blue-600 font-medium">Đa dạng & chất lượng</div>
            </div>
            <div className="text-center group hover:scale-110 transition-all duration-300">
              <div className="bg-gradient-to-br from-success-400 to-success-600 w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-xl group-hover:shadow-2xl group-hover:rotate-3 transition-all duration-300">
                <Users className="h-10 w-10 text-white" />
              </div>
              <div className="text-4xl font-black text-gray-900 mb-2">{stats.totalCustomers}+</div>
              <div className="text-lg font-semibold text-gray-600">😊 Khách Hàng</div>
              <div className="text-sm text-success-600 font-medium">Yêu thích & tin tưởng</div>
            </div>
            <div className="text-center group hover:scale-110 transition-all duration-300">
              <div className="bg-gradient-to-br from-accent-400 to-warning-500 w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-xl group-hover:shadow-2xl group-hover:rotate-3 transition-all duration-300">
                <Truck className="h-10 w-10 text-white" />
              </div>
              <div className="text-4xl font-black text-gray-900 mb-2">{stats.activeOrders}+</div>
              <div className="text-lg font-semibold text-gray-600">🚛 Đơn Hàng</div>
              <div className="text-sm text-warning-600 font-medium">Đang xử lý tích cực</div>
            </div>
            <div className="text-center group hover:scale-110 transition-all duration-300">
              <div className="bg-gradient-to-br from-secondary-400 to-accent-500 w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-xl group-hover:shadow-2xl group-hover:rotate-3 transition-all duration-300">
                <Star className="h-10 w-10 text-white" />
              </div>
              <div className="text-4xl font-black text-gray-900 mb-2">4.9</div>
              <div className="text-lg font-semibold text-gray-600">⭐ Đánh Giá</div>
              <div className="text-sm text-secondary-600 font-medium">Gần như hoàn hảo!</div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-20 bg-gradient-to-br from-gray-900 via-primary-900 to-secondary-900 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width=%2280%22 height=%2280%22 viewBox=%220 0 80 80%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cg fill=%22%23ffffff%22 fill-opacity=%220.03%22%3E%3Cpath d=%22M40 40c0-22.091-17.909-40-40-40s-40 17.909-40 40 17.909 40 40 40 40-17.909 40-40zm-20 0a20 20 0 1 1-40 0 20 20 0 0 1 40 0z%22/%3E%3C/g%3E%3C/svg%3E')]"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="text-center mb-16">
            <div className="inline-block gradient-accent text-gray-900 px-6 py-2 rounded-full font-bold text-sm mb-6 animate-bounce">
              🔥 HOT TREND 2024
            </div>
            <h2 className="text-5xl font-black text-white mb-6">
              <span className="text-gradient-accent">
                Sản Phẩm Bán Chạy
              </span>
              <br />
              <span className="text-white">Được GenZ Yêu Thích Nhất</span> ✨
            </h2>
            <p className="text-xl text-blue-200 font-medium">Những món đồ "xịn sò" mà mọi dự án đều cần! 🚀</p>
          </div>
          
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-white/10 backdrop-blur-md rounded-3xl border border-white/20 p-6 animate-pulse">
                  <div className="bg-white/20 h-48 rounded-2xl mb-4"></div>
                  <div className="bg-white/20 h-4 rounded mb-2"></div>
                  <div className="bg-white/20 h-4 rounded w-3/4 mb-4"></div>
                  <div className="bg-white/20 h-8 rounded w-1/2"></div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {Array.isArray(featuredProducts) && featuredProducts.length > 0 ? (
                featuredProducts.slice(0, 6).map((product) => (
                  <div key={product.id} className="group bg-white/10 backdrop-blur-md rounded-3xl border border-white/20 shadow-2xl hover:shadow-3xl transition-all duration-500 overflow-hidden hover:scale-105 hover:rotate-1">
                    <div className="relative bg-gradient-to-br from-blue-200 to-purple-300">
                      {product.images && product.images.length > 0 ? (
                        <Image 
                          src={product.images[0]} 
                          alt={product.name}
                          width={400}
                          height={192}
                          className="w-full h-48 object-cover group-hover:scale-110 transition-transform duration-500"
                          loading="lazy"
                        />
                      ) : (
                        <div className="w-full h-48 bg-gradient-to-br from-blue-200 to-purple-300 flex items-center justify-center">
                          <Package className="h-16 w-16 text-white animate-bounce" />
                        </div>
                      )}
                      <div className="absolute top-4 right-4 bg-gradient-to-r from-pink-500 to-orange-500 text-white px-3 py-1 rounded-full text-xs font-bold">
                        🔥 HOT
                      </div>
                    </div>
                    <div className="p-6 text-white">
                      <div className="text-sm text-blue-200 mb-2 font-semibold">📂 {product.category?.name}</div>
                      <h3 className="text-xl font-black text-white mb-3 group-hover:text-yellow-300 transition-colors">{product.name}</h3>
                      <p className="text-blue-100 text-sm mb-6 line-clamp-2">{product.description}</p>
                      <div className="flex items-center justify-between">
                        <span className="text-3xl font-black bg-gradient-to-r from-yellow-300 to-orange-400 bg-clip-text text-transparent">
                          {product.price?.toLocaleString()}đ
                        </span>
                        <Link 
                          href={`/products/${product.id}`}
                          className="gradient-accent text-gray-900 px-6 py-3 rounded-2xl hover:from-accent-400 hover:to-warning-400 font-black transition-all duration-300 hover:scale-110 shadow-lg"
                        >
                          🛒 Mua Ngay
                        </Link>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="col-span-full text-center py-16">
                  <div className="bg-white/10 backdrop-blur-md rounded-3xl border border-white/20 p-12">
                    <Package className="h-20 w-20 text-white/60 mx-auto mb-6 animate-pulse" />
                    <h3 className="text-2xl font-black text-white mb-4">🔍 Không Có Sản Phẩm</h3>
                    <p className="text-blue-200 text-lg">Sản phẩm sẽ được hiển thị ở đây khi được thêm vào hệ thống! 🚀</p>
                  </div>
                </div>
              )}
            </div>
          )}
          
          <div className="text-center mt-16">
            <Link href="/products" className="group gradient-accent text-gray-900 px-12 py-4 rounded-2xl hover:from-accent-400 hover:to-warning-400 font-black text-xl transition-all duration-300 hover:scale-110 shadow-2xl inline-flex items-center">
              🚀 Xem Tất Cả Sản Phẩm
              <ArrowRight className="ml-3 h-6 w-6 group-hover:animate-bounce" />
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Tại Sao Chọn SmartBuild?</h2>
            <p className="text-gray-600">Chúng tôi cung cấp vật liệu xây dựng chất lượng cao với dịch vụ xuất sắc</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="bg-primary-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Package className="h-8 w-8 text-primary-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Vật Liệu Chất Lượng</h3>
              <p className="text-gray-600">Chúng tôi chỉ cung cấp vật liệu xây dựng chất lượng cao nhất từ các nhà cung cấp uy tín.</p>
            </div>
            <div className="text-center">
              <div className="bg-success-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Truck className="h-8 w-8 text-success-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Giao Hàng Nhanh</h3>
              <p className="text-gray-600">Giao hàng nhanh chóng và đáng tin cậy đến công trình của bạn khi bạn cần.</p>
            </div>
            <div className="text-center">
              <div className="bg-warning-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="h-8 w-8 text-warning-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Hỗ Trợ Chuyên Nghiệp</h3>
              <p className="text-gray-600">Đội ngũ chuyên gia của chúng tôi sẵn sàng giúp bạn chọn vật liệu phù hợp cho dự án.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center mb-4">
                <Package className="h-8 w-8 text-primary-400" />
                <span className="ml-2 text-xl font-bold">SmartBuild</span>
              </div>
              <p className="text-gray-400">
                Đối tác tin cậy của bạn cho vật liệu xây dựng chất lượng và dịch vụ xuất sắc.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Sản Phẩm</h3>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="/products" className="hover:text-white">Xi măng</Link></li>
                <li><Link href="/products" className="hover:text-white">Thép</Link></li>
                <li><Link href="/products" className="hover:text-white">Gạch</Link></li>
                <li><Link href="/products" className="hover:text-white">Công cụ</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Công Ty</h3>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="/about" className="hover:text-white">Về chúng tôi</Link></li>
                <li><Link href="/contact" className="hover:text-white">Liên hệ</Link></li>
                <li><Link href="#" className="hover:text-white">Tuyển dụng</Link></li>
                <li><Link href="#" className="hover:text-white">Blog</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Hỗ Trợ</h3>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="#" className="hover:text-white">Trung tâm trợ giúp</Link></li>
                <li><Link href="#" className="hover:text-white">Thông tin vận chuyển</Link></li>
                <li><Link href="#" className="hover:text-white">Đổi trả hàng</Link></li>
                <li><Link href="#" className="hover:text-white">Bảo hành</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2024 SmartBuild. Bản quyền thuộc về SmartBuild.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}