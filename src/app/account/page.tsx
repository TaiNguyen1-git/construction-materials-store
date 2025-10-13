'use client'

import { useState, useEffect } from 'react'
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
  FileText
} from 'lucide-react'

interface UserData {
  name: string
  email: string
  phone: string
  address: string
  createdAt: string
}

export default function AccountPage() {
  const [user, setUser] = useState<UserData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // In a real implementation, this would fetch user data from an API
    // For now, we'll use mock data
    setTimeout(() => {
      setUser({
        name: 'Nguyễn Văn A',
        email: 'nguyenvana@example.com',
        phone: '0123456789',
        address: '123 Đường ABC, Quận XYZ, TP.HCM',
        createdAt: '2023-01-15T00:00:00Z'
      })
      setLoading(false)
    }, 500)
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Tài Khoản Của Tôi</h1>
        <p className="mt-1 text-sm text-gray-500">
          Quản lý thông tin tài khoản và cài đặt của bạn
        </p>
      </div>

      {/* Profile Card */}
      <div className="bg-white rounded-lg border p-6">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <div className="bg-gray-200 border-2 border-dashed rounded-xl w-16 h-16" />
          </div>
          <div className="ml-4 flex-1">
            <h2 className="text-xl font-bold text-gray-900">{user?.name}</h2>
            <p className="text-gray-500">{user?.email}</p>
            <div className="mt-2 flex flex-wrap gap-2">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                <User className="h-3 w-3 mr-1" />
                Khách hàng từ {user?.createdAt ? new Date(user.createdAt).getFullYear() : 'N/A'}
              </span>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                <Trophy className="h-3 w-3 mr-1" />
                Thành Viên Đồng
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Account Menu */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Link href="/account/profile" className="bg-white rounded-lg border p-4 hover:bg-gray-50 transition-colors">
          <div className="flex items-center">
            <User className="h-6 w-6 text-blue-500" />
            <h3 className="ml-3 text-lg font-medium text-gray-900">Thông Tin Cá Nhân</h3>
          </div>
          <p className="mt-2 text-sm text-gray-500">
            Cập nhật thông tin cá nhân và liên hệ của bạn
          </p>
        </Link>

        <Link href="/account/orders" className="bg-white rounded-lg border p-4 hover:bg-gray-50 transition-colors">
          <div className="flex items-center">
            <ShoppingBag className="h-6 w-6 text-green-500" />
            <h3 className="ml-3 text-lg font-medium text-gray-900">Lịch Sử Đơn Hàng</h3>
          </div>
          <p className="mt-2 text-sm text-gray-500">
            Xem các đơn hàng trước và theo dõi giao hàng hiện tại
          </p>
        </Link>

        <Link href="/account/loyalty" className="bg-white rounded-lg border p-4 hover:bg-gray-50 transition-colors">
          <div className="flex items-center">
            <Trophy className="h-6 w-6 text-yellow-500" />
            <h3 className="ml-3 text-lg font-medium text-gray-900">Chương Trình Thành Viên</h3>
          </div>
          <p className="mt-2 text-sm text-gray-500">
            Tích điểm, đổi quà và theo dõi hạng thành viên
          </p>
        </Link>

        <Link href="/account/wishlist" className="bg-white rounded-lg border p-4 hover:bg-gray-50 transition-colors">
          <div className="flex items-center">
            <Heart className="h-6 w-6 text-red-500" />
            <h3 className="ml-3 text-lg font-medium text-gray-900">Danh Sách Yêu Thích</h3>
          </div>
          <p className="mt-2 text-sm text-gray-500">
            Lưu các sản phẩm yêu thích để mua sau
          </p>
        </Link>

        <Link href="/account/addresses" className="bg-white rounded-lg border p-4 hover:bg-gray-50 transition-colors">
          <div className="flex items-center">
            <MapPin className="h-6 w-6 text-purple-500" />
            <h3 className="ml-3 text-lg font-medium text-gray-900">Địa Chỉ Đã Lưu</h3>
          </div>
          <p className="mt-2 text-sm text-gray-500">
            Quản lý địa chỉ giao hàng và thanh toán
          </p>
        </Link>

        <Link href="/account/payment-methods" className="bg-white rounded-lg border p-4 hover:bg-gray-50 transition-colors">
          <div className="flex items-center">
            <CreditCard className="h-6 w-6 text-indigo-500" />
            <h3 className="ml-3 text-lg font-medium text-gray-900">Phương Thức Thanh Toán</h3>
          </div>
          <p className="mt-2 text-sm text-gray-500">
            Thêm hoặc xóa phương thức thanh toán để thanh toán nhanh hơn
          </p>
        </Link>

        <Link href="/account/projects" className="bg-white rounded-lg border p-4 hover:bg-gray-50 transition-colors">
          <div className="flex items-center">
            <FileText className="h-6 w-6 text-purple-500" />
            <h3 className="ml-3 text-lg font-medium text-gray-900">Dự Án Của Tôi</h3>
          </div>
          <p className="mt-2 text-sm text-gray-500">
            Xem và quản lý các dự án xây dựng của bạn
          </p>
        </Link>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border p-4">
          <div className="flex items-center">
            <Package className="h-8 w-8 text-blue-500" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Tổng Đơn Hàng</p>
              <p className="text-2xl font-bold text-gray-900">12</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border p-4">
          <div className="flex items-center">
            <Star className="h-8 w-8 text-yellow-500" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Điểm Thành Viên</p>
              <p className="text-2xl font-bold text-gray-900">450</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border p-4">
          <div className="flex items-center">
            <Heart className="h-8 w-8 text-red-500" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Sản Phẩm Yêu Thích</p>
              <p className="text-2xl font-bold text-gray-900">8</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border p-4">
          <div className="flex items-center">
            <Calendar className="h-8 w-8 text-green-500" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Thành Viên Từ</p>
              <p className="text-2xl font-bold text-gray-900">2023</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
