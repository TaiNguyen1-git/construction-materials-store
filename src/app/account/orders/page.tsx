'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Package, Search, ArrowLeft, ShoppingBag } from 'lucide-react'
import { useAuth } from '@/contexts/auth-context'
import { useRouter } from 'next/navigation'

export default function OrdersPage() {
  const { isAuthenticated, isLoading } = useAuth()
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

  if (!isAuthenticated) return null

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        {/* Header */}
        <div>
          <Link href="/account" className="inline-flex items-center text-gray-600 hover:text-primary-600 mb-4 transition-colors">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Quay lại tài khoản
          </Link>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary-600 to-secondary-600 bg-clip-text text-transparent">
            📦 Đơn Hàng Của Tôi
          </h1>
          <p className="text-gray-600 mt-2">Theo dõi và quản lý đơn hàng của bạn</p>
        </div>

        {/* Empty State */}
        <div className="bg-white rounded-2xl shadow-xl p-16 text-center">
          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary-100 to-secondary-100 flex items-center justify-center mx-auto mb-6">
            <ShoppingBag className="h-12 w-12 text-primary-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Chưa có đơn hàng nào
          </h2>
          <p className="text-gray-600 mb-8 max-w-md mx-auto">
            Bạn chưa có đơn hàng nào. Hãy khám phá và mua sắm những sản phẩm tuyệt vời của chúng tôi!
          </p>
          <Link
            href="/products"
            className="inline-block bg-gradient-to-r from-primary-600 to-secondary-600 text-white px-8 py-4 rounded-xl hover:from-primary-700 hover:to-secondary-700 transition-all font-bold shadow-lg hover:scale-105"
          >
            Bắt Đầu Mua Sắm
          </Link>
        </div>
      </div>
    </div>
  )
}
