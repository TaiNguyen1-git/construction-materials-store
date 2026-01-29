'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Package, Search, ArrowLeft, ShoppingBag, ChevronRight } from 'lucide-react'
import { useAuth } from '@/contexts/auth-context'
import { useRouter } from 'next/navigation'

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

export default function OrdersPage() {
  const { isAuthenticated, isLoading: authLoading, user } = useAuth()
  const router = useRouter()
  const [orders, setOrders] = useState<any[]>([])
  const [dataLoading, setDataLoading] = useState(true)

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login')
    }
  }, [authLoading, isAuthenticated, router])

  useEffect(() => {
    const fetchOrders = async () => {
      if (!user) return
      setDataLoading(true)
      try {
        const res = await fetch('/api/orders?limit=50')
        const data = await res.json()
        if (data.success) {
          setOrders(data.data.orders)
        }
      } catch (error) {
        console.error('Error fetching orders:', error)
      } finally {
        setDataLoading(false)
      }
    }

    if (user && isAuthenticated) {
      fetchOrders()
    }
  }, [user, isAuthenticated])

  if (authLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  if (!isAuthenticated) return null

  return (
    <div className="min-h-screen bg-[#F8FAFC] py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        {/* Header */}
        <div>
          <Link href="/account" className="inline-flex items-center text-gray-500 hover:text-blue-600 mb-6 group transition-all">
            <div className="p-2 bg-white rounded-lg shadow-sm mr-3 group-hover:bg-blue-600 group-hover:text-white transition-colors">
              <ArrowLeft className="h-4 w-4" />
            </div>
            <span className="font-bold text-sm uppercase tracking-widest">Quay lại tài khoản</span>
          </Link>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight">
            📦 Đơn Hàng Của Tôi
          </h1>
          <p className="text-slate-500 mt-2 font-medium">Theo dõi và quản lý đơn hàng của bạn</p>
        </div>

        {dataLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-32 bg-white rounded-3xl animate-pulse shadow-sm border border-slate-100"></div>
            ))}
          </div>
        ) : orders.length === 0 ? (
          /* Empty State */
          <div className="bg-white rounded-[40px] shadow-sm border border-slate-100 p-20 text-center">
            <div className="w-24 h-24 rounded-full bg-blue-50 flex items-center justify-center mx-auto mb-8">
              <ShoppingBag className="h-12 w-12 text-blue-600" />
            </div>
            <h2 className="text-3xl font-black text-slate-900 mb-4 tracking-tight">
              Chưa có đơn hàng nào
            </h2>
            <p className="text-slate-500 mb-10 max-w-md mx-auto font-medium">
              Bạn chưa có đơn hàng nào trong tài khoản. Hãy bắt đầu chọn những vật liệu tốt nhất cho công trình của mình ngay!
            </p>
            <Link
              href="/products"
              className="inline-block bg-blue-600 text-white px-10 py-5 rounded-2xl hover:bg-blue-700 transition-all font-black shadow-xl shadow-blue-200 hover:-translate-y-1"
            >
              Bắt Đầu Mua Sắm
            </Link>
          </div>
        ) : (
          /* Orders List */
          <div className="grid gap-6">
            {orders.map((order) => (
              <div key={order.id} className="bg-white rounded-[32px] p-8 border border-slate-100 shadow-[0_10px_40px_-15px_rgba(0,0,0,0.05)] hover:border-blue-200 transition-all group">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-slate-50">
                  <div className="space-y-1">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Mã đơn hàng</p>
                    <h3 className="text-xl font-black text-slate-900 tracking-tight">#{order.orderNumber}</h3>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Trạng thái</p>
                      <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border ${order.status === 'DELIVERED' || order.status === 'COMPLETED'
                        ? 'bg-emerald-50 text-emerald-600 border-emerald-100'
                        : order.status === 'CANCELLED'
                          ? 'bg-rose-50 text-rose-600 border-rose-100'
                          : 'bg-blue-50 text-blue-600 border-blue-100'
                        }`}>
                        {translateStatus(order.status)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pt-6">
                  <div className="flex gap-10">
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Ngày đặt</p>
                      <p className="text-sm font-bold text-slate-700">{new Date(order.createdAt).toLocaleDateString('vi-VN')}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Tổng cộng</p>
                      <p className="text-sm font-black text-blue-600">{(order.totalAmount || 0).toLocaleString()}đ</p>
                    </div>
                  </div>
                  <Link
                    href={`/account/orders/${order.id}`}
                    className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-blue-600 transition-colors"
                  >
                    Xem chi tiết <ChevronRight className="h-4 w-4" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
