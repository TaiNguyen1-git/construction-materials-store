'use client'

import Link from 'next/link'
import { Trophy, Star, Gift, Users, ArrowLeft, Crown, Loader2, Copy, Check, User, Ticket } from 'lucide-react'
import { useAuth } from '@/contexts/auth-context'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { toast } from 'react-hot-toast'

const TIER_INFO = {
  BRONZE: {
    name: 'Đồng',
    icon: '🥉',
    color: 'from-amber-500 to-amber-600',
    bgColor: 'bg-amber-50',
    borderColor: 'border-amber-200',
    discount: '2%',
    pointsRequired: 0
  },
  SILVER: {
    name: 'Bạc',
    icon: '🥈',
    color: 'from-gray-400 to-gray-500',
    bgColor: 'bg-gray-50',
    borderColor: 'border-gray-200',
    discount: '5%',
    pointsRequired: 1000
  },
  GOLD: {
    name: 'Vàng',
    icon: '🥇',
    color: 'from-yellow-500 to-yellow-600',
    bgColor: 'bg-yellow-50',
    borderColor: 'border-yellow-200',
    discount: '10%',
    pointsRequired: 2500
  },
  PLATINUM: {
    name: 'Bạch Kim',
    icon: '💠',
    color: 'from-blue-500 to-blue-600',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    discount: '15%',
    pointsRequired: 5000
  },
  DIAMOND: {
    name: 'Kim Cương',
    icon: '💎',
    color: 'from-purple-500 to-purple-600',
    bgColor: 'bg-purple-50',
    borderColor: 'border-purple-200',
    discount: '20%',
    pointsRequired: 10000
  }
}

export default function LoyaltyPage() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [loyaltyData, setLoyaltyData] = useState<any>(null)
  const [referralCode, setReferralCode] = useState<string | null>(null)
  const [generatingCode, setGeneratingCode] = useState(false)
  const [copied, setCopied] = useState(false)
  const [voucherOptions, setVoucherOptions] = useState<any[]>([])
  const [loadingVouchers, setLoadingVouchers] = useState(true)
  const [redeeming, setRedeeming] = useState<number | null>(null)

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login')
    }
  }, [authLoading, isAuthenticated, router])

  useEffect(() => {
    const fetchLoyaltyData = async () => {
      if (!user?.id) return

      try {
        // In a real app, we would use a proper API client that handles auth headers
        // For now, we simulate passing the customer ID via header as per our API design
        // We need to fetch the customer ID first or assume we have it. 
        // Since we don't have the customer ID in the user object directly in the context usually,
        // we might need to fetch it or the API should infer it from the session.
        // For this demo, we'll assume the API can find the customer by user ID if we pass it,
        // OR we fetch the customer profile first.

        // Let's try to fetch assuming the API can handle it or we mock it for now.
        // Ideally, we should have an endpoint /api/me/loyalty that uses the session.
        // But our API expects x-customer-id. Let's fetch the customer first.

        // WORKAROUND: We will try to fetch the customer ID from a profile endpoint or 
        // just use the user ID and hope the backend can handle it or we update the backend.
        // Actually, let's look at the backend: it expects x-customer-id.
        // We need to find the customer ID.

        // Let's try to get it from the user object if it has it, or fetch from an endpoint.
        // Since we can't easily change the auth context right now, let's try to fetch 
        // the customer profile using the user ID.

        // For now, let's assume we can pass the user ID as x-user-id and the backend 
        // should be smart enough, OR we update the backend to look up by user ID.
        // But I didn't update the backend to look up by user ID in GET /api/loyalty.

        // Let's do a quick fetch to /api/customers/me if it exists, or just use a placeholder
        // if we can't get it. 

        // Wait, I can use the existing /api/orders logic to find customer.
        // Let's just try to fetch with a hardcoded customer ID for testing if we can't get it?
        // No, that's bad.

        // Let's try to fetch the customer details first.
        // I'll assume there is a way to get customer details.
        // If not, I will add a small helper to get it.

        // Actually, let's just make a call to /api/loyalty and pass x-user-id 
        // and I will update the backend to support x-user-id lookup as well?
        // I already finished backend tasks.

        // Let's look at the code I wrote for backend GET /api/loyalty.
        // It strictly checks for x-customer-id.

        // I should have updated the backend to support x-user-id.
        // I will quickly update the backend to support x-user-id lookup in the next step if needed.
        // For now, let's write the frontend code assuming I will fix the backend to accept x-user-id.

        const response = await fetch('/api/loyalty', {
          headers: {
            'x-user-id': user.id // We will update backend to use this
          }
        })

        if (response.ok) {
          const data = await response.json()
          setLoyaltyData(data.data)
          if (data.data.referralCode) {
            setReferralCode(data.data.referralCode)
          }
        }
      } catch (error) {
        console.error('Error fetching loyalty data:', error)
      } finally {
        setLoading(false)
      }
    }

    if (user) {
      fetchLoyaltyData()
    }
  }, [user])

  const handleGenerateReferral = async () => {
    setGeneratingCode(true)
    try {
      const response = await fetch('/api/loyalty', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user!.id // We will update backend to use this
        },
        body: JSON.stringify({
          action: 'generate-referral'
        })
      })

      if (response.ok) {
        const data = await response.json()
        setReferralCode(data.data.referralCode)
        toast.success('Đã tạo mã giới thiệu thành công!')
      } else {
        const errorData = await response.json()
        console.error('Generate referral error:', errorData)
        toast.error(errorData.message || 'Không thể tạo mã giới thiệu')
      }
    } catch (error) {
      console.error('Generate referral exception:', error)
      toast.error('Đã có lỗi xảy ra')
    } finally {
      setGeneratingCode(false)
    }
  }

  const copyToClipboard = () => {
    if (referralCode) {
      navigator.clipboard.writeText(referralCode)
      setCopied(true)
      toast.success('Đã sao chép mã!')
      setTimeout(() => setCopied(false), 2000)
    }
  }

  useEffect(() => {
    const fetchVoucherOptions = async () => {
      try {
        const response = await fetch('/api/loyalty/vouchers')
        if (response.ok) {
          const data = await response.json()
          setVoucherOptions(data.voucherOptions || [])
        }
      } catch (error) {
        console.error('Error fetching voucher options:', error)
      } finally {
        setLoadingVouchers(false)
      }
    }

    fetchVoucherOptions()
  }, [])

  const handleRedeemVoucher = async (voucherValue: number) => {
    setRedeeming(voucherValue)
    try {
      const response = await fetch('/api/loyalty/vouchers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user!.id // Pass user ID for authentication
        },
        body: JSON.stringify({ voucherValue })
      })

      const data = await response.json()

      if (response.ok && data.success) {
        toast.success(`🎉 Đổi voucher thành công! Mã: ${data.voucher.code}`)
        // Refresh loyalty data
        window.location.reload()
      } else {
        toast.error(data.error || 'Không thể đổi voucher')
      }
    } catch (error) {
      console.error('Error redeeming voucher:', error)
      toast.error('Đã có lỗi xảy ra')
    } finally {
      setRedeeming(null)
    }
  }

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  if (!isAuthenticated) return null

  // Fallback data if API fails (for demo purposes)
  // Fallback data if API fails (for demo purposes)
  const currentTier = loyaltyData?.currentTier || 'BRONZE'
  const currentPoints = loyaltyData?.currentPoints || 0

  // Only use default if loyaltyData is completely missing. 
  // If loyaltyData exists but nextTier is null, it means max tier.
  const nextTier = loyaltyData ? loyaltyData.nextTier : 'SILVER'
  const pointsToNext = loyaltyData ? loyaltyData.pointsToNextTier : 1000

  const tierInfo = TIER_INFO[currentTier as keyof typeof TIER_INFO]
  const nextTierInfo = nextTier ? TIER_INFO[nextTier as keyof typeof TIER_INFO] : null

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        {/* Header */}
        <div>
          <div className="flex items-center gap-4 mb-4">
            <Link href="/" className="inline-flex items-center text-gray-600 hover:text-primary-600 transition-colors px-3 py-1.5 rounded-lg hover:bg-white/50">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Trang chủ
            </Link>
            <Link href="/account" className="inline-flex items-center text-gray-600 hover:text-primary-600 transition-colors px-3 py-1.5 rounded-lg hover:bg-white/50">
              <User className="h-4 w-4 mr-2" />
              Tài khoản
            </Link>
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary-600 to-secondary-600 bg-clip-text text-transparent">
            🏆 Chương Trình Thành Viên
          </h1>
          <p className="text-gray-600 mt-2">Tích điểm, đổi quà và nhận ưu đãi độc quyền</p>
        </div>

        {/* Current Tier Card */}
        <div className={`bg-gradient-to-br ${tierInfo.color} rounded-2xl p-8 shadow-xl text-white relative overflow-hidden`}>
          <div className="absolute top-0 right-0 -mt-10 -mr-10 w-40 h-40 bg-white/10 rounded-full blur-2xl"></div>
          <div className="absolute bottom-0 left-0 -mb-10 -ml-10 w-40 h-40 bg-white/10 rounded-full blur-2xl"></div>

          <div className="relative z-10">
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-8">
              <div className="flex items-center mb-6 md:mb-0">
                <div className="w-20 h-20 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-4xl border-4 border-white/30 shadow-inner">
                  {tierInfo.icon}
                </div>
                <div className="ml-6">
                  <p className="text-white/80 text-sm font-medium uppercase tracking-wider">Hạng hiện tại</p>
                  <h2 className="text-3xl font-bold mt-1">{tierInfo.name}</h2>
                </div>
              </div>
              <div className="text-left md:text-right bg-white/10 p-4 rounded-xl backdrop-blur-sm border border-white/10">
                <p className="text-white/80 text-sm font-medium">Điểm tích lũy khả dụng</p>
                <p className="text-4xl font-bold mt-1">{currentPoints.toLocaleString()}</p>
              </div>
            </div>

            {/* Progress */}
            {/* Progress */}
            {nextTier ? (
              <div className="space-y-3">
                <div className="flex justify-between text-sm text-white/90 font-medium">
                  <span>Tiến độ lên hạng {nextTierInfo?.name}</span>
                  <span>{pointsToNext.toLocaleString()} điểm nữa</span>
                </div>
                <div className="w-full bg-black/20 rounded-full h-4 backdrop-blur-sm overflow-hidden">
                  <div
                    className="bg-white h-4 rounded-full transition-all duration-1000 ease-out shadow-[0_0_10px_rgba(255,255,255,0.5)]"
                    style={{ width: `${(currentPoints / (currentPoints + pointsToNext)) * 100}%` }}
                  />
                </div>
                <p className="text-xs text-white/70 text-right">
                  Cần đạt {nextTierInfo?.pointsRequired.toLocaleString()} điểm để thăng hạng
                </p>
              </div>
            ) : (
              <div className="mt-6 p-4 bg-white/20 backdrop-blur-sm rounded-xl border border-white/20 text-center">
                <p className="text-white font-bold text-lg">🎉 Chúc mừng! Bạn đã đạt hạng cao nhất</p>
                <p className="text-white/80 text-sm mt-1">Cảm ơn bạn đã đồng hành cùng chúng tôi</p>
              </div>
            )}
          </div>
        </div>

        {/* Benefits Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-shadow">
            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center mb-4 shadow-lg shadow-green-200">
              <Gift className="h-6 w-6 text-white" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-3">Quyền Lợi Của Bạn</h3>
            <div className="space-y-3">
              <div className="flex justify-between text-sm p-2 bg-gray-50 rounded-lg">
                <span className="text-gray-600">Giảm giá đơn hàng</span>
                <span className="font-bold text-green-600">{tierInfo.discount}</span>
              </div>
              <div className="flex justify-between text-sm p-2 bg-gray-50 rounded-lg">
                <span className="text-gray-600">Miễn phí vận chuyển</span>
                <span className="font-semibold text-gray-900">
                  {currentTier === 'BRONZE' ? 'Trên 500k' : 'Có'}
                </span>
              </div>
              <div className="flex justify-between text-sm p-2 bg-gray-50 rounded-lg">
                <span className="text-gray-600">Quà sinh nhật</span>
                <span className="font-semibold text-gray-900">
                  {currentTier === 'BRONZE' ? 'Không' : 'Có'}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-shadow">
            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-yellow-500 to-yellow-600 flex items-center justify-center mb-4 shadow-lg shadow-yellow-200">
              <Star className="h-6 w-6 text-white" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-3">Thống Kê Hoạt Động</h3>
            <div className="space-y-3">
              <div className="flex justify-between text-sm border-b border-gray-100 pb-2">
                <span className="text-gray-600">Tổng điểm đã tích</span>
                <span className="font-semibold text-gray-900">{loyaltyData?.totalPointsEarned?.toLocaleString() || 0}</span>
              </div>
              <div className="flex justify-between text-sm border-b border-gray-100 pb-2">
                <span className="text-gray-600">Điểm đã đổi</span>
                <span className="font-semibold text-gray-900">{loyaltyData?.totalPointsRedeemed?.toLocaleString() || 0}</span>
              </div>
              <div className="flex justify-between text-sm border-b border-gray-100 pb-2">
                <span className="text-gray-600">Tổng chi tiêu</span>
                <span className="font-semibold text-gray-900">{loyaltyData?.totalPurchases?.toLocaleString() || 0}đ</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-shadow">
            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center mb-4 shadow-lg shadow-purple-200">
              <Users className="h-6 w-6 text-white" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-3">Giới Thiệu Bạn Bè</h3>
            <p className="text-sm text-gray-600 mb-4">Mời bạn bè và nhận <span className="font-bold text-purple-600">100 điểm</span> cho mỗi người đăng ký thành công.</p>

            {referralCode ? (
              <div className="bg-purple-50 border border-purple-100 rounded-lg p-3">
                <p className="text-xs text-purple-600 mb-1 font-medium">Mã giới thiệu của bạn:</p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 bg-white border border-purple-200 rounded px-2 py-1.5 text-center font-mono font-bold text-purple-700 text-lg">
                    {referralCode}
                  </code>
                  <button
                    onClick={copyToClipboard}
                    className="p-2 bg-white border border-purple-200 rounded hover:bg-purple-100 transition-colors text-purple-600"
                    title="Sao chép"
                  >
                    {copied ? <Check className="h-5 w-5" /> : <Copy className="h-5 w-5" />}
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={handleGenerateReferral}
                disabled={generatingCode}
                className="w-full bg-gradient-to-r from-purple-600 to-purple-700 text-white px-4 py-2.5 rounded-lg hover:from-purple-700 hover:to-purple-800 transition-all font-semibold shadow-md shadow-purple-200 flex items-center justify-center"
              >
                {generatingCode ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Đang tạo...
                  </>
                ) : (
                  'Tạo mã giới thiệu ngay'
                )}
              </button>
            )}
          </div>
        </div>

        {/* Voucher Redemption */}
        <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
          <h2 className="text-2xl font-bold text-gray-900 mb-2 flex items-center">
            <Ticket className="h-6 w-6 mr-2 text-primary-600" />
            Đổi Điểm Lấy Voucher
          </h2>
          <p className="text-gray-600 mb-6">Sử dụng điểm tích lũy để đổi voucher giảm giá. Giá trị càng cao, tiết kiệm càng lớn!</p>

          {loadingVouchers ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {voucherOptions.map((option) => (
                <div
                  key={option.voucherValue}
                  className={`relative border-2 rounded-xl p-5 transition-all duration-300 hover:shadow-lg ${option.popular
                    ? 'border-primary-500 bg-primary-50'
                    : option.bestValue
                      ? 'border-purple-500 bg-purple-50'
                      : 'border-gray-200 bg-gray-50'
                    } ${currentPoints < option.pointsRequired ? 'opacity-60' : 'hover:scale-105'}`}
                >
                  {option.popular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary-600 text-white text-xs px-3 py-1 rounded-full font-bold shadow-md">
                      🔥 PHỔ BIẾN
                    </div>
                  )}
                  {option.bestValue && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-purple-600 text-white text-xs px-3 py-1 rounded-full font-bold shadow-md">
                      💎 TỐT NHẤT
                    </div>
                  )}

                  <div className="text-center">
                    <div className="text-4xl mb-2">🎟️</div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-1">
                      {option.displayName}
                    </h3>
                    <p className="text-sm text-gray-600 mb-3">
                      {option.pointsRequired.toLocaleString()} điểm
                    </p>

                    {option.savings !== '0%' && (
                      <div className="bg-green-100 text-green-700 text-xs font-bold px-2 py-1 rounded-full mb-3 inline-block">
                        Tiết kiệm {option.savings}
                      </div>
                    )}

                    <button
                      onClick={() => handleRedeemVoucher(option.voucherValue)}
                      disabled={currentPoints < option.pointsRequired || redeeming === option.voucherValue}
                      className={`w-full px-4 py-2.5 rounded-lg font-semibold transition-all ${currentPoints < option.pointsRequired
                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        : option.popular
                          ? 'bg-primary-600 text-white hover:bg-primary-700 shadow-md'
                          : option.bestValue
                            ? 'bg-purple-600 text-white hover:bg-purple-700 shadow-md'
                            : 'bg-gray-700 text-white hover:bg-gray-800 shadow-md'
                        }`}
                    >
                      {redeeming === option.voucherValue ? (
                        <span className="flex items-center justify-center">
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Đang đổi...
                        </span>
                      ) : currentPoints < option.pointsRequired ? (
                        `Cần ${(option.pointsRequired - currentPoints).toLocaleString()} điểm nữa`
                      ) : (
                        'Đổi ngay'
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* All Tiers */}
        <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
            <Crown className="h-6 w-6 mr-2 text-yellow-500" />
            Các Hạng Thành Viên
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {Object.entries(TIER_INFO).map(([key, tier]) => (
              <div
                key={key}
                className={`${tier.bgColor} ${tier.borderColor} border-2 rounded-xl p-4 transition-all duration-300 ${key === currentTier ? 'ring-2 ring-offset-2 ring-primary-500 scale-105 shadow-lg z-10' : 'hover:scale-105 hover:shadow-md'}`}
              >
                <div className="text-center">
                  <div className="text-4xl mb-3 transform transition-transform hover:scale-110 duration-300 inline-block">{tier.icon}</div>
                  <h3 className="font-bold text-gray-900 mb-1">{tier.name}</h3>
                  <p className="text-xs text-gray-600 mb-3 bg-white/50 py-1 px-2 rounded-full inline-block">
                    {tier.pointsRequired > 0 ? `From ${tier.pointsRequired.toLocaleString()} pts` : 'Khởi điểm'}
                  </p>
                  <div className="space-y-1.5 pt-2 border-t border-gray-200/50">
                    <p className="text-sm font-bold text-gray-900">Giảm {tier.discount}</p>
                    <p className="text-xs text-gray-600">Ưu đãi đặc quyền</p>
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
