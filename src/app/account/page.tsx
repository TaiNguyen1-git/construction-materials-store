'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
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
  PenTool,
  ArrowLeft,
  ChevronRight,
  Bell,
  Settings,
  QrCode,
  Zap,
  TrendingUp,
  Clock,
  LogOut,
  Building,
  History as HistoryIcon
} from 'lucide-react'
import { useAuth } from '@/contexts/auth-context'
import { Skeleton } from '@/components/ui/skeleton'
import { useWishlistStore } from '@/stores/wishlistStore'
import { fetchWithAuth } from '@/lib/api-client'

const translateStatus = (status: string) => {
  const statuses: Record<string, string> = {
    'PENDING_CONFIRMATION': 'Đang chờ xác nhận',
    'CONFIRMED_AWAITING_DEPOSIT': 'Chờ đặt cọc',
    'DEPOSIT_PAID': 'Đã đặt cọc',
    'PENDING': 'Chờ xử lý',
    'CONFIRMED': 'Đã xác nhận',
    'PROCESSING': 'Đang xử lý',
    'SHIPPED': 'Đang giao hàng',
    'DELIVERED': 'Đã giao hàng',
    'CANCELLED': 'Đã hủy',
    'RETURNED': 'Đã trả hàng',
    'COMPLETED': 'Hoàn thành'
  }
  return statuses[status] || status
}

export default function AccountPage() {
  const { user, isAuthenticated, isLoading: authLoading, logout } = useAuth()
  const router = useRouter()
  const { items: wishlistItems } = useWishlistStore()
  const [dataLoading, setDataLoading] = useState(true)
  const [stats, setStats] = useState({
    orderCount: 0,
    loyaltyPoints: 0,
    totalPoints: 0,
    wishlistCount: 0,
    projectCount: 0,
    recentOrders: [] as any[]
  })

  // Dynamic Tier Calculation
  const getTierInfo = (points: number) => {
    if (points >= 10000) return { current: 'Kim cương', next: 'MAX', threshold: 10000, prevThreshold: 5000 }
    if (points >= 5000) return { current: 'Bạch kim', next: 'Kim cương', threshold: 10000, prevThreshold: 5000 }
    if (points >= 2500) return { current: 'Vàng', next: 'Bạch kim', threshold: 5000, prevThreshold: 2500 }
    if (points >= 1000) return { current: 'Bạc', next: 'Vàng', threshold: 2500, prevThreshold: 1000 }
    return { current: 'Đồng', next: 'Bạc', threshold: 1000, prevThreshold: 0 }
  }

  const tier = getTierInfo(stats.totalPoints)
  const progressPercent = tier.next === 'MAX'
    ? 100
    : Math.round(((stats.totalPoints - tier.prevThreshold) / (tier.threshold - tier.prevThreshold)) * 100)

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login')
    }
  }, [authLoading, isAuthenticated, router])

  useEffect(() => {
    const fetchStats = async () => {
      if (!user) return

      setDataLoading(true)
      try {
        // Fetch all data in parallel
        const [ordersRes, loyaltyRes, projectsRes] = await Promise.all([
          fetchWithAuth('/api/orders?limit=5'),
          fetchWithAuth('/api/loyalty'),
          fetchWithAuth('/api/projects?limit=1')
        ])

        const ordersData = await ordersRes.json()
        const loyaltyData = await loyaltyRes.json()
        const projectsData = await projectsRes.json()

        setStats({
          orderCount: ordersData?.data?.pagination?.total || 0,
          loyaltyPoints: loyaltyData?.data?.currentPoints || 0,
          totalPoints: loyaltyData?.data?.totalPointsEarned || 0,
          wishlistCount: wishlistItems.length,
          projectCount: projectsData?.pagination?.total || 0,
          recentOrders: ordersData?.data?.orders?.slice(0, 2).map((o: any) => ({
            number: o.orderNumber,
            status: translateStatus(o.status),
            date: new Date(o.createdAt).toLocaleDateString('vi-VN')
          })) || []
        })
      } catch (error) {
        console.error('Error fetching account stats:', error)
      } finally {
        setDataLoading(false)
      }
    }

    if (user && isAuthenticated) {
      fetchStats()
    }
  }, [user, isAuthenticated, wishlistItems.length])

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="relative w-16 h-16">
            <div className="absolute inset-0 border-4 border-blue-100 rounded-full"></div>
            <div className="absolute inset-0 border-4 border-blue-600 rounded-full border-t-transparent animate-spin"></div>
          </div>
          <p className="text-slate-400 font-black text-[10px] uppercase tracking-[0.2em] animate-pulse">Đang định danh...</p>
        </div>
      </div>
    )
  }

  if (!user) return null

  return (
    <div className="min-h-screen bg-[#F1F5F9] font-sans selection:bg-blue-100 selection:text-blue-900 pb-20">
      {/* Background Decorative Elements */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-blue-400/5 blur-[120px] rounded-full"></div>
        <div className="absolute top-[20%] -right-[5%] w-[35%] h-[35%] bg-indigo-400/5 blur-[100px] rounded-full"></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-8">
        {/* Navigation Header */}
        <div className="flex items-center justify-between">
          <Link href="/" className="group flex items-center gap-3 bg-white/70 hover:bg-white backdrop-blur-md px-5 py-2.5 rounded-2xl border border-slate-200/60 transition-all active:scale-95 shadow-sm">
            <div className="p-1.5 bg-slate-100 rounded-lg text-slate-400 group-hover:bg-blue-600 group-hover:text-white transition-colors">
              <ArrowLeft className="w-4 h-4" />
            </div>
            <span className="text-xs font-black text-slate-500 uppercase tracking-widest group-hover:text-slate-900 transition-colors">Về trang chủ</span>
          </Link>

          <div className="flex gap-3">
            <Link href="/account/notifications">
              <button className="p-3 bg-white/70 backdrop-blur-md rounded-2xl border border-slate-200 text-slate-400 hover:text-blue-600 hover:border-blue-100 transition-all shadow-sm active:scale-90">
                <Bell size={18} />
              </button>
            </Link>
            <Link href="/account/profile">
              <button className="p-3 bg-white/70 backdrop-blur-md rounded-2xl border border-slate-200 text-slate-400 hover:text-indigo-600 hover:border-indigo-100 transition-all shadow-sm active:scale-90">
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

        {/* HERO BANNER SECTION - Refined LIGHT Design */}
        <div className="relative bg-white rounded-[40px] p-8 md:p-12 overflow-hidden shadow-[0_20px_50px_-12px_rgba(0,0,0,0.05)] border border-slate-100">
          {/* Subtle Mesh Background for Light Mode */}
          <div className="absolute inset-0">
            <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[80%] bg-blue-50 blur-[100px] rounded-full opacity-60"></div>
            <div className="absolute bottom-[-10%] right-[-5%] w-[50%] h-[70%] bg-indigo-50 blur-[100px] rounded-full opacity-40"></div>
          </div>

          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-10">
            <div className="flex flex-col md:flex-row items-center gap-8 text-center md:text-left">
              <div className="relative group">
                <div className="absolute -inset-4 bg-blue-100/50 rounded-full blur-xl group-hover:bg-blue-500/10 transition-all"></div>
                <div className="relative w-32 h-32 rounded-full border-4 border-white bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-4xl font-black text-white shadow-2xl">
                  {user?.name?.charAt(0).toUpperCase()}
                  <div className="absolute -bottom-1 -right-1 w-10 h-10 bg-emerald-500 border-4 border-white rounded-full flex items-center justify-center shadow-lg">
                    <Zap className="w-5 h-5 text-white" fill="currentColor" />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex flex-wrap justify-center md:justify-start gap-3 mb-2">
                  <span className="px-3 py-1 bg-blue-50 rounded-full text-[9px] font-black text-blue-600 uppercase tracking-widest border border-blue-100">
                    Khách hàng Ưu tiên
                  </span>
                  <span className="px-3 py-1 bg-slate-50 rounded-full text-[9px] font-black text-slate-400 uppercase tracking-widest border border-slate-200">
                    ID: {user?.id?.slice(-6).toUpperCase()}
                  </span>
                </div>
                <h2 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tighter leading-none mb-1">{user?.name}</h2>
                <div className="flex items-center justify-center md:justify-start gap-4 text-slate-500">
                  <span className="text-sm font-bold flex items-center gap-2">
                    <Calendar size={14} className="text-blue-500" />
                    Tham gia từ {user?.createdAt ? new Date(user.createdAt).getFullYear() : '2023'}
                  </span>
                  <span className="w-1.5 h-1.5 bg-slate-200 rounded-full"></span>
                  <span className="text-sm font-bold flex items-center gap-2">
                    <Star size={14} className="text-amber-500" fill="currentColor" />
                    Thành viên {dataLoading ? <Skeleton className="h-4 w-12" /> : tier.current}
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Action Cards in Hero - Light Mode */}
            <div className="flex gap-4">
              <div className="bg-slate-50/50 backdrop-blur-sm border border-slate-100 rounded-3xl p-6 text-center group hover:bg-blue-50/50 hover:border-blue-100 transition-all cursor-pointer">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Tích lũy</p>
                <div className="text-2xl font-black text-slate-900 mb-1">
                  {dataLoading ? <Skeleton className="h-8 w-16 mx-auto" /> : stats.loyaltyPoints.toLocaleString()}
                </div>
                <p className="text-[10px] font-bold text-blue-600 uppercase">Điểm thưởng</p>
              </div>
              <div className="bg-slate-50/50 backdrop-blur-sm border border-slate-100 rounded-3xl p-6 text-center group hover:bg-blue-50/50 hover:border-blue-100 transition-all cursor-pointer">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Đã đặt</p>
                <div className="text-2xl font-black text-slate-900 mb-1">
                  {dataLoading ? <Skeleton className="h-8 w-12 mx-auto" /> : stats.orderCount}
                </div>
                <p className="text-[10px] font-bold text-indigo-600 uppercase">Đơn hàng</p>
              </div>
            </div>
          </div>
        </div>

        {/* ACCOUNT DASHBOARD - Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-12 gap-6 pb-12">

          {/* Lịch Sử Đơn Hàng - Large Bento Card */}
          <Link href="/account/orders" className="md:col-span-2 lg:col-span-8 bg-white rounded-[40px] p-10 border border-slate-200 group hover:border-blue-400 transition-all shadow-[0_20px_60px_-15px_rgba(0,0,0,0.03)] overflow-hidden relative">
            <div className="relative z-10 flex flex-col h-full">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-5">
                  <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 transition-all group-hover:bg-blue-600 group-hover:text-white group-hover:scale-110 group-hover:rotate-6">
                    <ShoppingBag size={24} />
                  </div>
                  <div>
                    <h3 className="text-2xl font-black text-slate-900 tracking-tighter uppercase leading-none">Lịch sử đơn hàng</h3>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">
                      {dataLoading ? 'Đang tải...' : (stats.orderCount > 0 ? `${stats.orderCount} đơn hàng đã đặt` : 'Chưa có đơn hàng nào')}
                    </p>
                  </div>
                </div>
                <div className="w-10 h-10 rounded-full border border-slate-100 flex items-center justify-center text-slate-300 group-hover:text-blue-600 group-hover:border-blue-200 transition-all">
                  <ChevronRight size={20} />
                </div>
              </div>

              {/* Recent Activity Mini-Preview */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-auto">
                {dataLoading ? (
                  [1, 2].map(i => <Skeleton key={i} className="h-20 rounded-[28px]" />)
                ) : stats.orderCount > 0 ? (
                  stats.recentOrders.map((order, idx) => (
                    <div key={idx} className="bg-slate-50 border border-slate-100 rounded-[28px] p-5 flex items-center gap-4">
                      <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm">
                        <TrendingUp size={16} className="text-emerald-500" />
                      </div>
                      <div>
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider mb-0.5">#{order.number}</p>
                        <p className="text-sm font-black text-slate-900 leading-none">{order.status}</p>
                        <p className="text-[8px] font-bold text-blue-500 uppercase mt-1">{order.date}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="col-span-2 py-8 bg-slate-50/50 rounded-[28px] border border-dashed border-slate-200 flex flex-col items-center justify-center text-center">
                    <div className="p-3 bg-white rounded-full text-slate-200 mb-2">
                      <ShoppingBag size={20} />
                    </div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Sẵn sàng phục vụ bạn cho đơn hàng đầu tiên</p>
                  </div>
                )}
              </div>
            </div>
          </Link>

          {/* Chương Trình Thành Viên - Feature Card */}
          <Link href="/account/loyalty" className={`md:col-span-2 lg:col-span-4 rounded-[40px] p-10 border transition-all shadow-lg overflow-hidden relative group ${tier.current === 'Bạc' ? 'bg-gradient-to-br from-slate-50 to-gray-100 border-slate-200 hover:border-slate-400' :
            tier.current === 'Vàng' ? 'bg-gradient-to-br from-amber-50 to-yellow-100 border-amber-200 hover:border-yellow-400' :
              tier.current === 'Bạch kim' ? 'bg-gradient-to-br from-blue-50 to-indigo-100 border-blue-200 hover:border-blue-400' :
                tier.current === 'Kim cương' ? 'bg-gradient-to-br from-purple-50 to-fuchsia-100 border-purple-200 hover:border-purple-400' :
                  'bg-gradient-to-br from-orange-50 to-amber-100 border-orange-200 hover:border-orange-400'
            }`}>
            <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-all group-hover:rotate-12">
              <Trophy size={140} className={
                tier.current === 'Bạc' ? 'text-slate-400' :
                  tier.current === 'Vàng' ? 'text-yellow-500' :
                    tier.current === 'Bạch kim' ? 'text-blue-500' :
                      tier.current === 'Kim cương' ? 'text-purple-500' :
                        'text-orange-500'
              } />
            </div>
            <div className="relative z-10 flex flex-col h-full">
              <div className={`w-14 h-14 bg-white rounded-2xl flex items-center justify-center shadow-sm mb-6 group-hover:scale-110 transition-transform ${tier.current === 'Bạc' ? 'text-slate-400' :
                tier.current === 'Vàng' ? 'text-yellow-500' :
                  tier.current === 'Bạch kim' ? 'text-blue-500' :
                    tier.current === 'Kim cương' ? 'text-purple-500' :
                      'text-orange-500'
                }`}>
                <Trophy size={24} fill="currentColor" />
              </div>
              <h3 className="text-2xl font-black text-slate-900 tracking-tighter uppercase leading-none mb-2">Thẻ thành viên</h3>
              <p className="text-sm text-slate-600 font-medium mb-8">
                {tier.next === 'MAX'
                  ? 'Bạn đã đạt hạng cao nhất!'
                  : `Bạn đang ở hạng ${tier.current}. Tích lũy thêm để lên hạng ${tier.next}!`}
              </p>

              <div className="mt-auto">
                <div className="flex justify-between items-end mb-2">
                  <span className={`text-[10px] font-black uppercase tracking-widest ${tier.current === 'Bạc' ? 'text-slate-500' :
                    tier.current === 'Vàng' ? 'text-yellow-600' :
                      tier.current === 'Bạch kim' ? 'text-blue-600' :
                        tier.current === 'Kim cương' ? 'text-purple-600' :
                          'text-orange-600'
                    }`}>Tiến độ lên {tier.next === 'MAX' ? 'Kim cương' : tier.next}</span>
                  <span className="text-lg font-black text-slate-900 leading-none">
                    {dataLoading ? '--' : progressPercent}%
                  </span>
                </div>
                <div className={`h-3 bg-white rounded-full overflow-hidden border p-0.5 ${tier.current === 'Bạc' ? 'border-slate-200' :
                  tier.current === 'Vàng' ? 'border-yellow-200' :
                    tier.current === 'Bạch kim' ? 'border-blue-200' :
                      tier.current === 'Kim cương' ? 'border-purple-200' :
                        'border-orange-200'
                  }`}>
                  <div
                    className={`h-full rounded-full transition-all duration-1000 ${tier.current === 'Bạc' ? 'bg-gradient-to-r from-slate-400 to-gray-500' :
                      tier.current === 'Vàng' ? 'bg-gradient-to-r from-yellow-400 to-amber-500' :
                        tier.current === 'Bạch kim' ? 'bg-gradient-to-r from-blue-400 to-indigo-500' :
                          tier.current === 'Kim cương' ? 'bg-gradient-to-r from-purple-400 to-fuchsia-500' :
                            'bg-gradient-to-r from-orange-400 to-amber-500'
                      }`}
                    style={{ width: `${dataLoading ? 0 : progressPercent}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </Link>

          {/* DỰ ÁN CỦA TÔI - Wide Bento Card */}
          <Link href="/account/projects" className="md:col-span-2 lg:col-span-5 bg-white rounded-[40px] p-8 border border-slate-200 group hover:border-pink-400 transition-all shadow-sm relative overflow-hidden">
            <div className="flex flex-col h-full">
              <div className="flex items-center justify-between mb-6">
                <div className="w-12 h-12 bg-pink-50 rounded-2xl flex items-center justify-center text-pink-600 transition-colors group-hover:bg-pink-600 group-hover:text-white">
                  <FileText size={20} />
                </div>
                <span className="text-[10px] font-black text-pink-500 uppercase tracking-widest">
                  {dataLoading ? '--' : stats.projectCount} Dự án
                </span>
              </div>
              <h3 className="text-xl font-black text-slate-900 tracking-tight uppercase mb-2">Dự án công trình</h3>
              <p className="text-xs text-slate-500 font-medium mb-6">Quản lý định mức vật tư và tiến độ công trình của bạn.</p>
              <div className="mt-auto pt-4 border-t border-slate-50 flex items-center justify-between">
                <div className="flex -space-x-2">
                  {stats.projectCount > 0 ? (
                    Array.from({ length: Math.min(3, stats.projectCount) }).map((_, i) => (
                      <div key={i} className="w-8 h-8 rounded-lg border-2 border-white bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-400">P{i + 1}</div>
                    ))
                  ) : (
                    <div className="w-8 h-8 rounded-lg border-2 border-white bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-300">0</div>
                  )}
                </div>
                <Zap size={16} className="text-pink-400 animate-pulse" />
              </div>
            </div>
          </Link>

          {/* DANH SÁCH YÊU THÍCH - Square Bento Card */}
          <Link href="/wishlist" className="md:col-span-1 lg:col-span-3 bg-white rounded-[40px] p-8 border border-slate-200 group hover:border-rose-400 transition-all shadow-sm">
            <div className="flex flex-col h-full">
              <div className="w-12 h-12 bg-rose-50 rounded-2xl flex items-center justify-center text-rose-600 mb-6 group-hover:scale-110 transition-transform">
                <Heart size={20} />
              </div>
              <h3 className="text-xl font-black text-slate-900 tracking-tight uppercase mb-1">Yêu thích</h3>
              <p className="text-xs text-slate-400 font-bold uppercase tracking-widest leading-none mb-6">
                {dataLoading ? '--' : stats.wishlistCount} Sản phẩm
              </p>
              <div className="mt-auto text-rose-500 p-2 bg-rose-50 rounded-xl w-fit group-hover:bg-rose-600 group-hover:text-white transition-all">
                <QrCode size={18} />
              </div>
            </div>
          </Link>

          {/* QUẢN LÝ TỔ CHỨC B2B - NEW Bento Card */}
          <Link href="/account/organization" className="md:col-span-2 lg:col-span-4 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-[40px] p-8 border border-blue-500 group hover:scale-[1.02] transition-all shadow-xl shadow-blue-200 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-all group-hover:rotate-12">
              <Building size={120} className="text-white" />
            </div>
            <div className="relative z-10 flex flex-col h-full text-white">
              <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center text-white mb-6 group-hover:bg-white group-hover:text-blue-600 transition-all border border-white/20">
                <Building size={20} />
              </div>
              <h3 className="text-xl font-black tracking-tight uppercase mb-1">Tổ chức B2B</h3>
              <p className="text-xs text-blue-100 font-medium">Mua hàng cho doanh nghiệp và quản lý đội ngũ của bạn.</p>
              <div className="mt-auto flex items-center gap-2">
                <span className="px-3 py-1 bg-white/10 rounded-full text-[9px] font-black uppercase tracking-widest border border-white/10">Trực tuyến</span>
                <span className="text-[9px] font-black uppercase tracking-widest text-blue-200">Quản lý ngay</span>
              </div>
            </div>
          </Link>

          {/* THÔNG TIN CÁ NHÂN - Medium Bento Card */}
          <Link href="/account/profile" className="md:col-span-1 lg:col-span-4 bg-white rounded-[40px] p-8 border border-slate-200 group hover:border-indigo-400 transition-all shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-all">
              <User size={100} className="text-indigo-600" />
            </div>
            <div className="flex flex-col h-full">
              <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 mb-6 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                <User size={20} />
              </div>
              <h3 className="text-xl font-black text-slate-900 tracking-tight uppercase mb-1">Hồ sơ</h3>
              <p className="text-xs text-slate-500 font-medium">Cập nhật định danh và thông tin liên hệ bảo mật.</p>

              {/* Dynamic Profile Progress */}
              <div className="mt-6 space-y-2">
                {(() => {
                  const fields = [user?.name, user?.email, (user as any)?.phone, (user as any)?.address]
                  const completed = fields.filter(Boolean).length
                  const percent = Math.round((completed / fields.length) * 100)
                  const isVerified = (user as any)?.isVerified || false

                  return (
                    <>
                      <div className="h-1.5 bg-slate-100 rounded-full w-3/4 overflow-hidden">
                        <div
                          className={`h-full transition-all duration-1000 ${percent === 100 ? 'bg-emerald-500' : 'bg-indigo-500'}`}
                          style={{ width: `${percent}%` }}
                        ></div>
                      </div>
                      <div className="flex items-center gap-2">
                        <p className={`text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-lg ${isVerified ? 'bg-emerald-50 text-emerald-500' : 'bg-amber-50 text-amber-500'
                          }`}>
                          {isVerified ? 'Đã chứng thực' : 'Chưa chứng thực'}
                        </p>
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                          Hoàn thiện {percent}%
                        </span>
                      </div>
                    </>
                  )
                })()}
              </div>
            </div>
          </Link>

          {/* OTHER SMALL CARDS */}
          {[
            {
              label: 'Địa chỉ',
              icon: MapPin,
              href: '/account/addresses',
              count: 'Địa chỉ nhận',
              iconBg: 'bg-purple-50',
              iconColor: 'text-purple-600',
              hoverBg: 'group-hover:bg-purple-600'
            },
            {
              label: 'Thanh toán',
              icon: CreditCard,
              href: '/account/payment-methods',
              count: 'Phương thức',
              iconBg: 'bg-blue-50',
              iconColor: 'text-blue-600',
              hoverBg: 'group-hover:bg-blue-600'
            },
            {
              label: 'Báo giá',
              icon: PenTool,
              href: '/account/quotes',
              count: 'Yêu cầu',
              iconBg: 'bg-orange-50',
              iconColor: 'text-orange-600',
              hoverBg: 'group-hover:bg-orange-600'
            },
            {
              label: 'Ví tín dụng',
              icon: CreditCard,
              href: '/account/credit',
              count: 'Mua trước trả sau',
              iconBg: 'bg-emerald-50',
              iconColor: 'text-emerald-600',
              hoverBg: 'group-hover:bg-emerald-600'
            },
            {
              label: 'Hỗ trợ',
              icon: Shield,
              href: '/account/disputes',
              count: 'Hỗ trợ 24/7',
              iconBg: 'bg-rose-50',
              iconColor: 'text-rose-600',
              hoverBg: 'group-hover:bg-rose-600'
            },
            {
              label: 'Trả hàng',
              icon: HistoryIcon,
              href: '/account/returns',
              count: 'Lịch sử đổi trả',
              iconBg: 'bg-orange-50',
              iconColor: 'text-orange-600',
              hoverBg: 'group-hover:bg-orange-600'
            },
          ].map((item) => (
            <Link key={item.label} href={item.href} className="md:col-span-1 lg:col-span-3 bg-white rounded-[40px] p-8 border border-slate-200 group hover:border-slate-400 transition-all shadow-sm">
              <div className="flex flex-col h-full items-center text-center">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-4 transition-all group-hover:scale-110 group-hover:text-white ${item.iconBg} ${item.iconColor} ${item.hoverBg}`}>
                  <item.icon size={22} />
                </div>
                <h3 className="text-base font-black text-slate-900 tracking-tight uppercase leading-none mb-1">{item.label}</h3>
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{item.count}</p>
              </div>
            </Link>
          ))}
        </div>

        {/* PREMIUM LOGOUT SECTION */}
        <div className="flex flex-col items-center justify-center pt-8 pb-12">
          <button
            onClick={() => {
              if (window.confirm('Bạn có chắc chắn muốn đăng xuất?')) {
                logout()
              }
            }}
            className="group flex items-center gap-4 bg-white hover:bg-rose-50 px-10 py-5 rounded-[32px] border border-slate-200 hover:border-rose-200 transition-all active:scale-95 shadow-sm hover:shadow-xl hover:shadow-rose-500/5"
          >
            <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 group-hover:bg-rose-600 group-hover:text-white group-hover:rotate-12 transition-all">
              <LogOut size={22} />
            </div>
            <div className="text-left">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] group-hover:text-rose-400 transition-colors">Kết thúc phiên</p>
              <h3 className="text-lg font-black text-slate-900 group-hover:text-rose-700 transition-colors tracking-tight">Đăng xuất ngay</h3>
            </div>
          </button>
          <p className="mt-6 text-[10px] font-bold text-slate-400 uppercase tracking-widest opacity-50">Phiên bản 2.5.0 • SmartBuild ERP Client</p>
        </div>
      </div >
    </div >
  )
}
