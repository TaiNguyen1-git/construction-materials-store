'use client'

import Link from 'next/link'
import { Trophy, Star, Gift, Users, ArrowLeft, Crown } from 'lucide-react'
import { useAuth } from '@/contexts/auth-context'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

const TIER_INFO = {
  BRONZE: {
    name: 'Đồng',
    icon: '🥉',
    color: 'from-amber-500 to-amber-600',
    bgColor: 'bg-amber-50',
    borderColor: 'border-amber-200',
    discount: '5%',
    pointsRequired: 0
  },
  SILVER: {
    name: 'Bạc',
    icon: '🥈',
    color: 'from-gray-400 to-gray-500',
    bgColor: 'bg-gray-50',
    borderColor: 'border-gray-200',
    discount: '10%',
    pointsRequired: 1000
  },
  GOLD: {
    name: 'Vàng',
    icon: '🥇',
    color: 'from-yellow-500 to-yellow-600',
    bgColor: 'bg-yellow-50',
    borderColor: 'border-yellow-200',
    discount: '15%',
    pointsRequired: 5000
  },
  PLATINUM: {
    name: 'Bạch Kim',
    icon: '💠',
    color: 'from-blue-500 to-blue-600',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    discount: '20%',
    pointsRequired: 15000
  },
  DIAMOND: {
    name: 'Kim Cương',
    icon: '💎',
    color: 'from-purple-500 to-purple-600',
    bgColor: 'bg-purple-50',
    borderColor: 'border-purple-200',
    discount: '25%',
    pointsRequired: 50000
  }
}

export default function LoyaltyPage() {
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

  if (!isAuthenticated) return null

  const currentTier = 'BRONZE'
  const currentPoints = 450
  const nextTier = 'SILVER'
  const pointsToNext = 550

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
            🏆 Chương Trình Thành Viên
          </h1>
          <p className="text-gray-600 mt-2">Tích điểm, đổi quà và nhận ưu đãi độc quyền</p>
        </div>

        {/* Current Tier Card */}
        <div className={`bg-gradient-to-br ${TIER_INFO[currentTier as keyof typeof TIER_INFO].color} rounded-2xl p-8 shadow-xl text-white`}>
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center">
              <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-3xl border-4 border-white/30">
                {TIER_INFO[currentTier as keyof typeof TIER_INFO].icon}
              </div>
              <div className="ml-4">
                <p className="text-white/80 text-sm">Hạng hiện tại</p>
                <h2 className="text-2xl font-bold">{TIER_INFO[currentTier as keyof typeof TIER_INFO].name}</h2>
              </div>
            </div>
            <div className="text-right">
              <p className="text-white/80 text-sm">Điểm tích lũy</p>
              <p className="text-4xl font-bold">{currentPoints}</p>
            </div>
          </div>

          {/* Progress */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-white/90">
              <span>Tiến độ lên hạng {TIER_INFO[nextTier as keyof typeof TIER_INFO].name}</span>
              <span>{pointsToNext} điểm nữa</span>
            </div>
            <div className="w-full bg-white/20 rounded-full h-3 backdrop-blur-sm">
              <div 
                className="bg-white h-3 rounded-full transition-all duration-500"
                style={{ width: `${(currentPoints / (currentPoints + pointsToNext)) * 100}%` }}
              />
            </div>
          </div>
        </div>

        {/* Benefits Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center mb-4">
              <Gift className="h-6 w-6 text-white" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">Ưu Đãi Hạng</h3>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Giảm giá</span>
                <span className="font-semibold text-gray-900">{TIER_INFO[currentTier as keyof typeof TIER_INFO].discount}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Miễn phí vận chuyển</span>
                <span className="font-semibold text-gray-900">✓</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Quà sinh nhật</span>
                <span className="font-semibold text-gray-900">✓</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-yellow-500 to-yellow-600 flex items-center justify-center mb-4">
              <Star className="h-6 w-6 text-white" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">Thống Kê</h3>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Tổng điểm đã tích</span>
                <span className="font-semibold text-gray-900">2,500</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Điểm đã đổi</span>
                <span className="font-semibold text-gray-900">2,050</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Tổng mua hàng</span>
                <span className="font-semibold text-gray-900">25,000,000đ</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center mb-4">
              <Users className="h-6 w-6 text-white" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">Giới Thiệu Bạn Bè</h3>
            <p className="text-sm text-gray-600 mb-4">Mời bạn bè và nhận 100 điểm cho mỗi người đăng ký thành công</p>
            <button className="w-full bg-gradient-to-r from-purple-600 to-purple-700 text-white px-4 py-2 rounded-lg hover:from-purple-700 hover:to-purple-800 transition-all font-semibold">
              Tạo mã giới thiệu
            </button>
          </div>
        </div>

        {/* All Tiers */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
            <Crown className="h-6 w-6 mr-2 text-yellow-500" />
            Các Hạng Thành Viên
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {Object.entries(TIER_INFO).map(([key, tier]) => (
              <div 
                key={key}
                className={`${tier.bgColor} ${tier.borderColor} border-2 rounded-xl p-4 ${key === currentTier ? 'ring-2 ring-offset-2 ring-primary-500' : ''}`}
              >
                <div className="text-center">
                  <div className="text-4xl mb-2">{tier.icon}</div>
                  <h3 className="font-bold text-gray-900 mb-1">{tier.name}</h3>
                  <p className="text-xs text-gray-600 mb-2">{tier.pointsRequired.toLocaleString()} điểm</p>
                  <div className="space-y-1">
                    <p className="text-sm font-semibold text-gray-900">Giảm {tier.discount}</p>
                    <p className="text-xs text-gray-600">+ Nhiều ưu đãi khác</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
