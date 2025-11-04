'use client'

import Link from 'next/link'
import { ArrowLeft, Plus, Folder, Calendar, DollarSign, TrendingUp } from 'lucide-react'
import { useAuth } from '@/contexts/auth-context'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function ProjectsPage() {
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
        <div className="flex items-center justify-between">
          <div>
            <Link href="/account" className="inline-flex items-center text-gray-600 hover:text-primary-600 mb-4 transition-colors">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Quay lại tài khoản
            </Link>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-primary-600 to-secondary-600 bg-clip-text text-transparent">
              📁 Dự Án Của Tôi
            </h1>
            <p className="text-gray-600 mt-2">Quản lý các dự án xây dựng của bạn</p>
          </div>
          <button className="bg-gradient-to-r from-primary-600 to-secondary-600 text-white px-6 py-3 rounded-xl hover:from-primary-700 hover:to-secondary-700 transition-all font-semibold shadow-lg hover:scale-105 flex items-center">
            <Plus className="h-5 w-5 mr-2" />
            Tạo Dự Án Mới
          </button>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 shadow-lg text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-100">Tổng Dự Án</p>
                <p className="text-3xl font-bold mt-1">5</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                <Folder className="h-6 w-6" />
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-6 shadow-lg text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-100">Đang Tiến Hành</p>
                <p className="text-3xl font-bold mt-1">3</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                <TrendingUp className="h-6 w-6" />
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-6 shadow-lg text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-100">Hoàn Thành</p>
                <p className="text-3xl font-bold mt-1">2</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                <Calendar className="h-6 w-6" />
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl p-6 shadow-lg text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-orange-100">Tổng Ngân Sách</p>
                <p className="text-3xl font-bold mt-1">1.2B</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                <DollarSign className="h-6 w-6" />
              </div>
            </div>
          </div>
        </div>

        {/* Empty State */}
        <div className="bg-white rounded-2xl shadow-xl p-16 text-center">
          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary-100 to-secondary-100 flex items-center justify-center mx-auto mb-6">
            <Folder className="h-12 w-12 text-primary-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Chưa có dự án nào
          </h2>
          <p className="text-gray-600 mb-8 max-w-md mx-auto">
            Bắt đầu tạo dự án đầu tiên của bạn để quản lý vật liệu xây dựng, ngân sách và tiến độ một cách hiệu quả!
          </p>
          <button className="inline-flex items-center bg-gradient-to-r from-primary-600 to-secondary-600 text-white px-8 py-4 rounded-xl hover:from-primary-700 hover:to-secondary-700 transition-all font-bold shadow-lg hover:scale-105">
            <Plus className="h-5 w-5 mr-2" />
            Tạo Dự Án Đầu Tiên
          </button>
        </div>
      </div>
    </div>
  )
}
