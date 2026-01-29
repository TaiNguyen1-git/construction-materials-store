'use client'

import Link from 'next/link'
import { Trophy, Star, Gift, Users, ArrowLeft, Crown, Loader2, Copy, Check, User, Ticket, Info, X, Truck, Headphones, ChevronRight, LogOut, Settings } from 'lucide-react'
import { useAuth } from '@/contexts/auth-context'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { toast } from 'react-hot-toast'
import { fetchWithAuth } from '@/lib/api-client'

const TIER_INFO = {
  BRONZE: {
    name: 'Đồng',
    icon: '🥉',
    color: 'from-amber-600 to-amber-700',
    bgColor: 'bg-amber-50',
    borderColor: 'border-amber-200',
    discount: '2%',
    pointsRequired: 0,
    benefits: [
      'Giảm giá 2% trên mọi đơn hàng',
      'Miễn phí vận chuyển cho đơn hàng từ 500.000đ',
      'Hỗ trợ khách hàng tiêu chuẩn 8/7'
    ]
  },
  SILVER: {
    name: 'Bạc',
    icon: '🥈',
    color: 'from-slate-400 to-slate-600',
    bgColor: 'bg-slate-50',
    borderColor: 'border-slate-200',
    discount: '5%',
    pointsRequired: 1000,
    benefits: [
      'Giảm giá 5% trên mọi đơn hàng',
      'Miễn phí vận chuyển cho đơn hàng từ 300.000đ',
      'Voucher sinh nhật đặc biệt 100.000đ',
      'Ưu tiên xử lý lỗi đơn hàng'
    ]
  },
  GOLD: {
    name: 'Vàng',
    icon: '🥇',
    color: 'from-yellow-500 to-yellow-600',
    bgColor: 'bg-yellow-50',
    borderColor: 'border-yellow-200',
    discount: '10%',
    pointsRequired: 2500,
    benefits: [
      'Giảm giá 10% trên mọi đơn hàng',
      'Miễn phí vận chuyển cho đơn hàng từ 200.000đ',
      'Voucher sinh nhật cao cấp 200.000đ',
      'Chuyên viên hỗ trợ riêng trong giờ hành chính'
    ]
  },
  PLATINUM: {
    name: 'Bạch Kim',
    icon: '💠',
    color: 'from-blue-500 to-blue-600',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    discount: '15%',
    pointsRequired: 5000,
    benefits: [
      'Giảm giá 15% trên mọi đơn hàng',
      'Miễn phí vận chuyển 100% mọi đơn hàng',
      'Voucher sinh nhật trị giá 500.000đ',
      'Hỗ trợ VIP 24/7 ưu tiên cao'
    ]
  },
  DIAMOND: {
    name: 'Kim Cương',
    icon: '💎',
    color: 'from-purple-600 to-purple-800',
    bgColor: 'bg-purple-50',
    borderColor: 'border-purple-200',
    discount: '20%',
    pointsRequired: 10000,
    benefits: [
      'Giảm giá 20% trên mọi đơn hàng',
      'Miễn phí vận chuyển & bốc xếp tận công trình',
      'Voucher sinh nhật cao cấp bậc nhất 1.000.000đ',
      'Quà tặng bất ngờ định kỳ 3 tháng/lần',
      'Mời tham gia các sự kiện xây dựng độc quyền'
    ]
  }
}

export default function LoyaltyPage() {
  const { user, isAuthenticated, isLoading: authLoading, logout } = useAuth()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [loyaltyData, setLoyaltyData] = useState<any>(null)
  const [referralCode, setReferralCode] = useState<string | null>(null)
  const [generatingCode, setGeneratingCode] = useState(false)
  const [copied, setCopied] = useState(false)
  const [voucherOptions, setVoucherOptions] = useState<any[]>([])
  const [loadingVouchers, setLoadingVouchers] = useState(true)
  const [redeeming, setRedeeming] = useState<number | null>(null)
  const [showTierModal, setShowTierModal] = useState(false)
  const [selectedTierKey, setSelectedTierKey] = useState<string | null>(null)

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login')
    }
  }, [authLoading, isAuthenticated, router])

  useEffect(() => {
    const fetchLoyaltyData = async () => {
      if (!user?.id) return

      try {
        const response = await fetchWithAuth('/api/loyalty')
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
      const response = await fetchWithAuth('/api/loyalty', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
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
        toast.error(errorData.error?.message || errorData.message || 'Không thể tạo mã giới thiệu')
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
        const response = await fetchWithAuth('/api/loyalty/vouchers')
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
      const response = await fetchWithAuth('/api/loyalty/vouchers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ voucherValue })
      })

      const data = await response.json()

      if (response.ok && data.success) {
        toast.success(`🎉 Đổi voucher thành công! Mã: ${data.voucherCode}`, {
          duration: 10000, // Show longer so they can copy it if needed
          icon: '🎁'
        })

        // Refresh loyalty data without full page reload for better UX
        const statsRes = await fetchWithAuth('/api/loyalty')
        if (statsRes.ok) {
          const statsData = await statsRes.json()
          setLoyaltyData(statsData.data)
        }
      } else {
        toast.error(data.error?.message || data.error || 'Đổi điểm thất bại. Vui lòng thử lại.')
      }
    } catch (error) {
      console.error('Error redeeming voucher:', error)
      toast.error('Đã có lỗi xảy ra khi kết nối máy chủ')
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

  // Use consistent tier logic with Account page
  const getTierInfo = (points: number) => {
    if (points >= 10000) return { currentKey: 'DIAMOND', current: 'Kim Cương', nextKey: null, next: 'MAX', threshold: 10000, prevThreshold: 5000 }
    if (points >= 5000) return { currentKey: 'PLATINUM', current: 'Bạch Kim', nextKey: 'DIAMOND', next: 'Kim Cương', threshold: 10000, prevThreshold: 5000 }
    if (points >= 2500) return { currentKey: 'GOLD', current: 'Vàng', nextKey: 'PLATINUM', next: 'Bạch Kim', threshold: 5000, prevThreshold: 2500 }
    if (points >= 1000) return { currentKey: 'SILVER', current: 'Bạc', nextKey: 'GOLD', next: 'Vàng', threshold: 2500, prevThreshold: 1000 }
    return { currentKey: 'BRONZE', current: 'Đồng', nextKey: 'SILVER', next: 'Bạc', threshold: 1000, prevThreshold: 0 }
  }

  const totalPoints = loyaltyData?.totalPointsEarned || 0
  const currentPoints = loyaltyData?.currentPoints || 0
  const tier = getTierInfo(totalPoints)
  const tierInfo = TIER_INFO[tier.currentKey as keyof typeof TIER_INFO]
  const nextTierInfo = tier.nextKey ? TIER_INFO[tier.nextKey as keyof typeof TIER_INFO] : null

  const progressPercent = tier.next === 'MAX'
    ? 100
    : Math.round(((totalPoints - tier.prevThreshold) / (tier.threshold - tier.prevThreshold)) * 100)

  const pointsToNext = tier.next === 'MAX' ? 0 : tier.threshold - totalPoints

  return (
    <div className="min-h-screen bg-[#F8FAFC] py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="flex-1">
            <div className="flex items-center justify-between gap-4 mb-4">
              <Link href="/account" className="inline-flex items-center text-gray-500 hover:text-blue-600 transition-all font-bold text-sm uppercase tracking-widest bg-white px-4 py-2 rounded-xl shadow-sm border border-slate-100">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Tài khoản
              </Link>
              <div className="flex gap-2">
                <Link href="/account/profile">
                  <button className="p-3 bg-white/70 backdrop-blur-md rounded-2xl border border-slate-200 text-slate-400 hover:text-indigo-600 hover:border-indigo-100 transition-all shadow-sm active:scale-90" title="Cài đặt">
                    <Settings size={18} />
                  </button>
                </Link>
                <button
                  onClick={() => {
                    if (window.confirm('Bạn có chắc chắn muốn đăng xuất?')) {
                      logout()
                    }
                  }}
                  className="p-3 bg-white/70 backdrop-blur-md rounded-2xl border border-slate-200 text-slate-400 hover:text-rose-600 hover:border-rose-100 transition-all shadow-sm active:scale-90"
                  title="Đăng xuất"
                >
                  <LogOut size={18} />
                </button>
              </div>
            </div>
            <h1 className="text-4xl font-black text-slate-900 tracking-tight">
              🏆 Chương Trình Thành Viên
            </h1>
            <p className="text-slate-500 mt-2 font-medium">Tích điểm, đổi quà và nhận ưu đãi độc quyền</p>
          </div>
          <div className="bg-white px-8 py-5 rounded-[28px] shadow-sm border border-slate-100 text-right">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Điểm hiện có</p>
            <p className="text-3xl font-black text-blue-600 tracking-tighter">{currentPoints.toLocaleString()}</p>
          </div>
        </div>

        {/* Current Tier Card - Refined */}
        <div className={`bg-gradient-to-br ${tierInfo.color} rounded-[40px] p-10 md:p-12 shadow-2xl text-white relative overflow-hidden group border-4 border-white/20`}>
          <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 bg-white/10 rounded-full blur-[100px] group-hover:bg-white/20 transition-all duration-700"></div>
          <div className="absolute bottom-0 left-0 -mb-10 -ml-10 w-64 h-64 bg-white/10 rounded-full blur-[100px] group-hover:bg-white/20 transition-all duration-700"></div>

          <div className="relative z-10">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-10 mb-12">
              <div className="flex items-center">
                <div className="w-28 h-28 rounded-[38px] bg-white/20 backdrop-blur-xl flex items-center justify-center text-5xl border-2 border-white/30 shadow-2xl transform transition-transform group-hover:rotate-12 duration-500">
                  {tierInfo.icon}
                </div>
                <div className="ml-8">
                  <p className="text-white/70 text-[10px] font-black uppercase tracking-[0.3em]">Hạng hiện tại</p>
                  <h2 className="text-5xl font-black mt-2 tracking-tighter">{tierInfo.name}</h2>
                  <div className="flex items-center gap-2 mt-3 mb-1">
                    <span className="px-3 py-1 bg-white/10 backdrop-blur-md rounded-lg text-[10px] font-black uppercase tracking-widest border border-white/10">
                      Ưu đãi {tierInfo.discount}
                    </span>
                  </div>
                </div>
              </div>

              <div className="lg:w-1/2">
                {tier.nextKey ? (
                  <div className="space-y-4">
                    <div className="flex justify-between items-end">
                      <div className="space-y-1">
                        <p className="text-white/70 text-[10px] font-black uppercase tracking-widest">Tiến độ lên hạng {tier.next}</p>
                        <p className="text-2xl font-black tracking-tight">{pointsToNext.toLocaleString()} điểm nữa</p>
                      </div>
                      <p className="text-3xl font-black opacity-40">{progressPercent}%</p>
                    </div>
                    <div className="w-full bg-black/10 rounded-full h-4 backdrop-blur-md border border-white/10 p-1">
                      <div
                        className="bg-white h-2 rounded-full transition-all duration-1000 ease-out shadow-[0_0_20px_rgba(255,255,255,0.8)]"
                        style={{ width: `${progressPercent}%` }}
                      />
                    </div>
                    <p className="text-[10px] font-bold text-white/50 text-right uppercase tracking-widest">
                      Cần đạt {tier.threshold.toLocaleString()} điểm để thăng hạng {tier.next}
                    </p>
                  </div>
                ) : (
                  <div className="p-8 bg-white/10 backdrop-blur-md rounded-[32px] border border-white/20 text-center">
                    <Crown className="w-10 h-10 mx-auto mb-3 text-yellow-300" />
                    <p className="text-xl font-black">🎉 CHÚC MỪNG! HẠNG CAO NHẤT</p>
                    <p className="text-white/60 text-sm font-medium mt-1">Bạn đang tận hưởng những ưu đãi đặc quyền nhất.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Benefits Grid - Refined */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-[32px] shadow-sm p-8 border border-slate-100 hover:border-blue-200 transition-all group">
            <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-6 group-hover:bg-emerald-600 group-hover:text-white transition-all shadow-sm">
              <Gift className="h-6 w-6" />
            </div>
            <h3 className="text-xl font-black text-slate-900 tracking-tight mb-6">Quyền Lợi Của Bạn</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <span className="text-slate-500 font-bold text-xs uppercase tracking-widest">Giảm giá đơn hàng</span>
                <span className="font-black text-emerald-600 text-lg">{tierInfo.discount}</span>
              </div>
              <div className="flex justify-between items-center p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <span className="text-slate-500 font-bold text-xs uppercase tracking-widest">Vận chuyển</span>
                <span className="font-black text-slate-900">
                  {tier.currentKey === 'BRONZE' ? 'Mặc định' : 'Ưu tiên'}
                </span>
              </div>
              <div className="flex justify-between items-center p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <span className="text-slate-500 font-bold text-xs uppercase tracking-widest">Quà tặng</span>
                <span className="font-black text-slate-900">
                  {tier.currentKey === 'BRONZE' ? 'Không' : 'Có'}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-[32px] shadow-sm p-8 border border-slate-100 hover:border-blue-200 transition-all group">
            <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mb-6 group-hover:bg-amber-600 group-hover:text-white transition-all shadow-sm">
              <Star className="h-6 w-6" />
            </div>
            <h3 className="text-xl font-black text-slate-900 tracking-tight mb-6">Thống Kê Hoạt Động</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center border-b border-slate-50 pb-4">
                <span className="text-slate-500 font-bold text-xs uppercase tracking-widest">Tổng điểm tích lũy (Hạng)</span>
                <span className="font-black text-slate-900">{loyaltyData?.totalPointsEarned?.toLocaleString() || 0} điểm</span>
              </div>
              <div className="flex justify-between items-center border-b border-slate-50 pb-4">
                <span className="text-slate-500 font-bold text-xs uppercase tracking-widest">Điểm đã sử dụng</span>
                <span className="font-black text-slate-900">{loyaltyData?.totalPointsRedeemed?.toLocaleString() || 0} điểm</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-bold text-xs uppercase tracking-widest">Tổng chi tiêu</span>
                <span className="font-black text-blue-600 text-lg">{(loyaltyData?.totalPurchases || 0).toLocaleString()}đ</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-[32px] shadow-sm p-8 border border-slate-100 hover:border-blue-200 transition-all group relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-all">
              <Users size={80} className="text-purple-600" />
            </div>
            <div className="w-14 h-14 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center mb-6 group-hover:bg-purple-600 group-hover:text-white transition-all shadow-sm">
              <Users className="h-6 w-6" />
            </div>
            <h3 className="text-xl font-black text-slate-900 tracking-tight mb-3">Giới Thiệu Bạn Bè</h3>
            <p className="text-sm text-slate-500 font-medium mb-6">Mời bạn bè và nhận ngay <span className="text-purple-600 font-black">100 điểm</span> khi họ đăng ký thành công.</p>

            {referralCode ? (
              <div className="bg-purple-50/50 border border-purple-100 rounded-2xl p-4">
                <p className="text-[10px] font-black text-purple-400 uppercase tracking-widest mb-2">Mã của bạn</p>
                <div className="flex items-center gap-3">
                  <code className="flex-1 bg-white border border-purple-100 rounded-xl px-4 py-3 font-mono font-black text-purple-600 text-lg">
                    {referralCode}
                  </code>
                  <button
                    onClick={copyToClipboard}
                    className="p-3 bg-white border border-purple-100 rounded-xl hover:bg-purple-600 hover:text-white transition-all text-purple-600 shadow-sm active:scale-90"
                  >
                    {copied ? <Check className="h-5 w-5" /> : <Copy className="h-5 w-5" />}
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={handleGenerateReferral}
                disabled={generatingCode}
                className="w-full bg-purple-600 text-white px-6 py-4 rounded-2xl hover:bg-purple-700 transition-all font-black shadow-lg shadow-purple-100 flex items-center justify-center disabled:opacity-50"
              >
                {generatingCode ? (
                  <>
                    <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                    Đang tạo...
                  </>
                ) : (
                  'Tạo mã giới thiệu'
                )}
              </button>
            )}
          </div>
        </div>

        {/* My Vouchers Section - New Section to show redeemed vouchers */}
        {loyaltyData?.vouchers?.length > 0 && (
          <div className="bg-white rounded-[40px] shadow-sm p-10 border border-slate-100">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-purple-50 rounded-2xl flex items-center justify-center text-purple-600">
                  <Gift size={24} />
                </div>
                <div>
                  <h2 className="text-2xl font-black text-slate-900 tracking-tight uppercase">Kho Voucher Của Bạn</h2>
                  <p className="text-slate-500 font-medium text-sm">Danh sách các mã ưu đãi bạn đã đổi thành công.</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {loyaltyData.vouchers.map((voucher: any) => (
                <div
                  key={voucher.id}
                  className={`p-6 rounded-3xl border-2 border-dashed transition-all relative overflow-hidden ${voucher.status === 'UNUSED' ? 'border-purple-200 bg-purple-50/20' : 'border-slate-100 bg-slate-50 grayscale opacity-60'
                    }`}
                >
                  <div className="flex justify-between items-start mb-4 relative z-10">
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Trị giá</p>
                      <p className="text-2xl font-black text-purple-600">{voucher.value.toLocaleString()}đ</p>
                    </div>
                    <div className={`px-3 py-1 rounded-full text-[10px] font-black tracking-widest uppercase ${voucher.status === 'UNUSED' ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-200 text-slate-500'
                      }`}>
                      {voucher.status === 'UNUSED' ? 'Chưa dùng' : 'Đã dùng'}
                    </div>
                  </div>

                  <div className="mt-6 flex items-center gap-3 relative z-10">
                    <div className="flex-1 bg-white border border-purple-100 rounded-xl px-4 py-3 font-mono font-black text-purple-700 text-center select-all shadow-sm">
                      {voucher.code}
                    </div>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(voucher.code)
                        toast.success('Đã sao chép mã voucher!', { icon: '📋' })
                      }}
                      className="p-3 bg-white border border-purple-100 rounded-xl hover:bg-purple-600 hover:text-white transition-all text-purple-600 shadow-sm"
                    >
                      <Copy size={18} />
                    </button>
                  </div>
                  <p className="mt-4 text-[10px] text-slate-400 font-bold uppercase text-center tracking-widest relative z-10">
                    Hết hạn: {new Date(voucher.expiryDate).toLocaleDateString('vi-VN')}
                  </p>

                  {/* Decorative element */}
                  <div className="absolute -bottom-4 -right-4 text-purple-100 opacity-20">
                    <Ticket size={80} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Voucher Redemption - Refined */}
        <div className="bg-white rounded-[40px] shadow-sm p-10 border border-slate-100">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600">
              <Ticket size={24} />
            </div>
            <div>
              <h2 className="text-2xl font-black text-slate-900 tracking-tight uppercase">Đổi điểm lấy Voucher</h2>
              <p className="text-slate-500 font-medium text-sm">Sử dụng điểm tích lũy để nhận ngay ưu đãi giảm giá đơn hàng.</p>
            </div>
          </div>

          {loadingVouchers ? (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {[1, 2, 3, 4].map(i => <div key={i} className="h-64 bg-slate-50 rounded-3xl animate-pulse" />)}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {voucherOptions.map((option) => (
                <div
                  key={option.voucherValue}
                  className={`relative group rounded-[32px] p-8 border-2 transition-all duration-500 hover:-translate-y-2 ${option.popular
                    ? 'border-blue-200 bg-blue-50/30'
                    : option.bestValue
                      ? 'border-purple-200 bg-purple-50/30'
                      : 'border-slate-100 bg-white'
                    } ${currentPoints < option.pointsRequired ? 'opacity-70' : 'hover:shadow-2xl'}`}
                >
                  {option.popular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-[10px] px-4 py-1.5 rounded-full font-black tracking-widest shadow-lg z-20">
                      PHỔ BIẾN
                    </div>
                  )}
                  {option.bestValue && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-[10px] px-4 py-1.5 rounded-full font-black tracking-widest shadow-lg z-20">
                      GIÁ TRỊ CAO NHẤT
                    </div>
                  )}

                  <div className="text-center relative z-10">
                    <div className="text-5xl mb-6 transform transition-transform group-hover:scale-125 duration-500">🎟️</div>
                    <h3 className="text-xl font-black text-slate-900 mb-2">
                      {option.displayName}
                    </h3>
                    <p className="text-sm font-bold text-slate-400 mb-6">
                      {option.pointsRequired.toLocaleString()} điểm
                    </p>

                    <button
                      onClick={() => handleRedeemVoucher(option.voucherValue)}
                      disabled={currentPoints < option.pointsRequired || redeeming === option.voucherValue}
                      className={`w-full px-6 py-3.5 rounded-2xl font-black text-sm transition-all active:scale-95 ${currentPoints < option.pointsRequired
                        ? 'bg-slate-50 text-slate-300 cursor-not-allowed'
                        : option.popular
                          ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-xl shadow-blue-100'
                          : option.bestValue
                            ? 'bg-purple-600 text-white hover:bg-purple-700 shadow-xl shadow-purple-100'
                            : 'bg-blue-500 text-white hover:bg-blue-600 shadow-lg shadow-blue-100'
                        }`}
                    >
                      {redeeming === option.voucherValue ? (
                        <div className="flex items-center justify-center gap-2">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          <span>Đang đổi...</span>
                        </div>
                      ) : currentPoints < option.pointsRequired ? (
                        `Cần thêm ${(option.pointsRequired - currentPoints).toLocaleString()} điểm`
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

        {/* All Tiers List - Refined */}
        <div className="bg-white rounded-[40px] shadow-sm p-10 border border-slate-100">
          <div className="flex items-center gap-4 mb-10">
            <div className="w-12 h-12 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-500">
              <Crown size={24} />
            </div>
            <div>
              <h2 className="text-2xl font-black text-slate-900 tracking-tight uppercase">Bảng xếp hạng thành viên</h2>
              <p className="text-slate-500 font-medium text-sm">Nhấn vào từng hạng để xem chi tiết đặc quyền.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
            {Object.entries(TIER_INFO).map(([key, tierItem]) => (
              <button
                key={key}
                onClick={() => {
                  setSelectedTierKey(key)
                  setShowTierModal(true)
                }}
                className={`relative group text-left rounded-[32px] p-8 border-2 transition-all duration-500 hover:scale-105 active:scale-95 ${key === tier.currentKey
                  ? 'border-blue-200 bg-blue-50/50 shadow-2xl z-10'
                  : 'border-slate-50 bg-slate-50/30'
                  }`}
              >
                {key === tier.currentKey && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-[9px] px-3 py-1 rounded-full font-black tracking-widest shadow-lg">
                    HẠNG CỦA BẠN
                  </div>
                )}

                {/* Mini Tooltip on Hover */}
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-4 w-48 opacity-0 group-hover:opacity-100 pointer-events-none transition-all duration-300 transform translate-y-2 group-hover:translate-y-0 z-50">
                  <div className="bg-slate-900/90 backdrop-blur-md text-white p-4 rounded-2xl shadow-2xl text-[10px] space-y-2 border border-white/10">
                    <p className="font-black uppercase tracking-widest text-blue-400 border-b border-white/10 pb-2">Ưu đãi {tierItem.name}</p>
                    <ul className="space-y-1.5 font-medium">
                      {(tierItem as any).benefits.slice(0, 2).map((b: string, i: number) => (
                        <li key={i} className="flex gap-2">
                          <Check className="w-3 h-3 text-emerald-400 shrink-0" />
                          <span>{b}</span>
                        </li>
                      ))}
                      <li className="text-blue-300 italic">... và {(tierItem as any).benefits.length - 2} đặc quyền khác</li>
                    </ul>
                    <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-slate-900/90 rotate-45 border-r border-b border-white/10"></div>
                  </div>
                </div>

                <div className="text-center">
                  <div className="text-4xl mb-4 transform transition-transform group-hover:scale-110 duration-500">{tierItem.icon}</div>
                  <h3 className="font-black text-slate-900 mb-1">{tierItem.name}</h3>
                  <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6">
                    {tierItem.pointsRequired > 0 ? `${tierItem.pointsRequired.toLocaleString()} điểm` : 'Khởi đầu'}
                  </div>
                  <div className="space-y-2 pt-6 border-t border-slate-200/50 relative">
                    <p className="text-sm font-black text-blue-600">Giảm {tierItem.discount}</p>
                    <div className="flex items-center justify-center gap-1.5">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.1em]">Đặc quyền riêng</p>
                      <Info size={10} className="text-blue-400" />
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Tier Benefits Comparison Modal */}
      {showTierModal && selectedTierKey && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
          <div
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
            onClick={() => setShowTierModal(false)}
          />

          <div className="relative bg-white w-full max-w-2xl rounded-[40px] shadow-2xl overflow-hidden border border-slate-100 animate-in fade-in zoom-in duration-300">
            {/* Modal Header */}
            <div className={`p-8 bg-gradient-to-br ${(TIER_INFO as any)[selectedTierKey].color} text-white relative`}>
              <div className="absolute top-0 right-0 p-8">
                <button
                  onClick={() => setShowTierModal(false)}
                  className="p-2 bg-white/10 hover:bg-white/20 rounded-xl transition-colors backdrop-blur-md border border-white/10"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="flex items-center gap-6">
                <div className="w-20 h-20 bg-white/20 backdrop-blur-md rounded-3xl flex items-center justify-center text-4xl border border-white/30 shadow-2xl">
                  {(TIER_INFO as any)[selectedTierKey].icon}
                </div>
                <div>
                  <h3 className="text-3xl font-black tracking-tighter uppercase">Hạng {(TIER_INFO as any)[selectedTierKey].name}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="bg-white/20 px-3 py-1 rounded-lg text-[10px] font-black tracking-widest uppercase backdrop-blur-md border border-white/10">
                      Giảm {(TIER_INFO as any)[selectedTierKey].discount} đơn hàng
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-8 space-y-8">
              <div>
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Danh sách đặc quyền</h4>
                <div className="grid grid-cols-1 gap-3">
                  {(TIER_INFO as any)[selectedTierKey].benefits.map((benefit: string, index: number) => (
                    <div key={index} className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100 group hover:border-blue-100 transition-all">
                      <div className="w-10 h-10 bg-white rounded-xl shadow-sm border border-slate-100 flex items-center justify-center shrink-0 text-blue-500 group-hover:scale-110 transition-transform">
                        {benefit.toLowerCase().includes('vận chuyển') ? <Truck size={18} /> :
                          benefit.toLowerCase().includes('sinh nhật') ? <Gift size={18} /> :
                            benefit.toLowerCase().includes('hỗ trợ') ? <Headphones size={18} /> :
                              <Star size={18} />}
                      </div>
                      <span className="font-bold text-slate-700">{benefit}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-blue-50 p-6 rounded-[32px] border border-blue-100 flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-1">Mục tiêu tiếp theo</p>
                  <p className="text-slate-700 text-sm font-bold">Tích lũy đủ <span className="text-blue-600">{(TIER_INFO as any)[selectedTierKey].pointsRequired.toLocaleString()} điểm</span> để đạt cột mốc này.</p>
                </div>
                <div className="p-3 bg-white rounded-2xl shadow-sm text-blue-600">
                  <ChevronRight size={24} />
                </div>
              </div>

              <button
                onClick={() => setShowTierModal(false)}
                className="w-full bg-slate-900 text-white py-5 rounded-[24px] font-black shadow-xl shadow-slate-100 hover:bg-slate-800 transition-all active:scale-95 tracking-wide"
              >
                ĐÃ HIỂU
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
