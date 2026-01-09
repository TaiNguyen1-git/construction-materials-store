'use client'

import Link from 'next/link'
import {
  User,
  ShoppingBag,
  CreditCard,
  MapPin,
  Shield,
  Heart,
  Trophy,
  Star,
  Package,
  Calendar,
  FileText,
  PenTool
} from 'lucide-react'
import { useAuth } from '@/contexts/auth-context'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function AccountPage() {
  const { user, isAuthenticated, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login')
    }
  }, [isLoading, isAuthenticated, router])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary-600 to-secondary-600 bg-clip-text text-transparent">
            Tài Khoản Của Tôi
          </h1>
          <p className="mt-2 text-gray-600">
            Quản lý thông tin tài khoản và cài đặt của bạn
          </p>
        </div>

        {/* Profile Card */}
        <div className="bg-gradient-to-br from-primary-600 to-secondary-600 rounded-2xl p-8 shadow-xl text-white">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <div className="w-20 h-20 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-3xl font-bold border-4 border-white/30">
                {user?.name?.charAt(0).toUpperCase()}
              </div>
            </div>
            <div className="ml-6 flex-1">
              <h2 className="text-2xl font-bold">{user?.name}</h2>
              <p className="text-white/90 mt-1">{user?.email}</p>
              {user?.phone && (
                <p className="text-white/80 mt-0.5">📱 {user?.phone}</p>
              )}
              <div className="mt-4 flex flex-wrap gap-2">
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-white/20 backdrop-blur-sm border border-white/30">
                  <User className="h-4 w-4 mr-1.5" />
                  Khách hàng từ {user?.createdAt ? new Date(user.createdAt).getFullYear() : '2023'}
                </span>
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-white/20 backdrop-blur-sm border border-white/30">
                  <Trophy className="h-4 w-4 mr-1.5" />
                  Thành Viên Đồng
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Account Menu */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Link href="/account/profile" className="group bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 p-6 border border-gray-100 hover:border-blue-200 hover:scale-105">
            <div className="flex items-center mb-3">
              <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                <User className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="ml-3 text-lg font-semibold text-gray-900">Thông Tin Cá Nhân</h3>
            </div>
            <p className="text-sm text-gray-600">
              Cập nhật thông tin cá nhân và liên hệ của bạn
            </p>
          </Link>

          <Link href="/account/orders" className="group bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 p-6 border border-gray-100 hover:border-green-200 hover:scale-105">
            <div className="flex items-center mb-3">
              <div className="w-12 h-12 rounded-lg bg-green-100 flex items-center justify-center group-hover:bg-green-200 transition-colors">
                <ShoppingBag className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="ml-3 text-lg font-semibold text-gray-900">Lịch Sử Đơn Hàng</h3>
            </div>
            <p className="text-sm text-gray-600">
              Xem các đơn hàng trước và theo dõi giao hàng hiện tại
            </p>
          </Link>

          <Link href="/account/loyalty" className="group bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 p-6 border border-gray-100 hover:border-yellow-200 hover:scale-105">
            <div className="flex items-center mb-3">
              <div className="w-12 h-12 rounded-lg bg-yellow-100 flex items-center justify-center group-hover:bg-yellow-200 transition-colors">
                <Trophy className="h-6 w-6 text-yellow-600" />
              </div>
              <h3 className="ml-3 text-lg font-semibold text-gray-900">Chương Trình Thành Viên</h3>
            </div>
            <p className="text-sm text-gray-600">
              Tích điểm, đổi quà và theo dõi hạng thành viên
            </p>
          </Link>

          <Link href="/wishlist" className="group bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 p-6 border border-gray-100 hover:border-red-200 hover:scale-105">
            <div className="flex items-center mb-3">
              <div className="w-12 h-12 rounded-lg bg-red-100 flex items-center justify-center group-hover:bg-red-200 transition-colors">
                <Heart className="h-6 w-6 text-red-600" />
              </div>
              <h3 className="ml-3 text-lg font-semibold text-gray-900">Danh Sách Yêu Thích</h3>
            </div>
            <p className="text-sm text-gray-600">
              Lưu các sản phẩm yêu thích để mua sau
            </p>
          </Link>

          <Link href="/account/addresses" className="group bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 p-6 border border-gray-100 hover:border-purple-200 hover:scale-105">
            <div className="flex items-center mb-3">
              <div className="w-12 h-12 rounded-lg bg-purple-100 flex items-center justify-center group-hover:bg-purple-200 transition-colors">
                <MapPin className="h-6 w-6 text-purple-600" />
              </div>
              <h3 className="ml-3 text-lg font-semibold text-gray-900">Địa Chỉ Đã Lưu</h3>
            </div>
            <p className="text-sm text-gray-600">
              Quản lý địa chỉ giao hàng và thanh toán
            </p>
          </Link>

          <Link href="/account/payment-methods" className="group bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 p-6 border border-gray-100 hover:border-indigo-200 hover:scale-105">
            <div className="flex items-center mb-3">
              <div className="w-12 h-12 rounded-lg bg-indigo-100 flex items-center justify-center group-hover:bg-indigo-200 transition-colors">
                <CreditCard className="h-6 w-6 text-indigo-600" />
              </div>
              <h3 className="ml-3 text-lg font-semibold text-gray-900">Phương Thức Thanh Toán</h3>
            </div>
            <p className="text-sm text-gray-600">
              Thêm hoặc xóa phương thức thanh toán để thanh toán nhanh hơn
            </p>
          </Link>

          <Link href="/account/projects" className="group bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 p-6 border border-gray-100 hover:border-pink-200 hover:scale-105">
            <div className="flex items-center mb-3">
              <div className="w-12 h-12 rounded-lg bg-pink-100 flex items-center justify-center group-hover:bg-pink-200 transition-colors">
                <FileText className="h-6 w-6 text-pink-600" />
              </div>
              <h3 className="ml-3 text-lg font-semibold text-gray-900">Dự Án Của Tôi</h3>
            </div>
            <p className="text-sm text-gray-600">
              Xem và quản lý các dự án xây dựng của bạn
            </p>
          </Link>

          <Link href="/account/quotes" className="group bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 p-6 border border-gray-100 hover:border-orange-200 hover:scale-105">
            <div className="flex items-center mb-3">
              <div className="w-12 h-12 rounded-lg bg-orange-100 flex items-center justify-center group-hover:bg-orange-200 transition-colors">
                <PenTool className="h-6 w-6 text-orange-600" />
              </div>
              <h3 className="ml-3 text-lg font-semibold text-gray-900">Báo Giá & Thương Thảo</h3>
            </div>
            <p className="text-sm text-gray-600">
              Theo dõi các yêu cầu báo giá vật tư và thi công
            </p>
          </Link>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 shadow-lg text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-100">Tổng Đơn Hàng</p>
                <p className="text-3xl font-bold mt-1">12</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                <Package className="h-6 w-6" />
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-xl p-6 shadow-lg text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-yellow-100">Điểm Thành Viên</p>
                <p className="text-3xl font-bold mt-1">450</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                <Star className="h-6 w-6" />
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-xl p-6 shadow-lg text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-red-100">Sản Phẩm Yêu Thích</p>
                <p className="text-3xl font-bold mt-1">8</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                <Heart className="h-6 w-6" />
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-6 shadow-lg text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-100">Thành Viên Từ</p>
                <p className="text-3xl font-bold mt-1">{user?.createdAt ? new Date(user.createdAt).getFullYear() : '2023'}</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                <Calendar className="h-6 w-6" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
