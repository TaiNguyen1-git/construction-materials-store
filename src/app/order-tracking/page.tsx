'use client'

import React, { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Header from '@/components/Header'
import dynamic from 'next/dynamic'
import {
  CheckCircle,
  Clock,
  Package,
  Truck,
  Home,
  XCircle,
  User,
  Building,
  Star,
  AlertTriangle,
  Loader2,
  X,
  Sparkles,
  Info,
  Shield,
  ArrowRight,
  Calendar,
  CreditCard
} from 'lucide-react'
import Link from 'next/link'
import toast, { Toaster } from 'react-hot-toast'

const QRPayment = dynamic(() => import('@/components/QRPayment'), { ssr: false })

interface OrderItem {
  id: string
  product: {
    name: string
    sku: string
    images?: string[]
    unit?: string
  }
  quantity: number
  unitPrice: number
  totalPrice: number
}

interface Order {
  id: string
  orderNumber: string
  status: string
  customerType?: string
  totalAmount: number
  shippingAmount: number
  netAmount: number
  paymentMethod: string
  paymentStatus: string
  paymentType?: string
  depositPercentage?: number
  depositAmount?: number
  remainingAmount?: number
  depositPaidAt?: string
  qrExpiresAt?: string
  guestName?: string
  guestEmail?: string
  guestPhone?: string
  customer?: {
    user?: {
      name?: string
      phone?: string
      email?: string
    }
  }
  shippingAddress?: any
  notes?: string
  selectedContractorId?: string | null
  contractorChangeCount: number
  contractor?: {
    id: string
    displayName: string
    avgRating: number
    city: string
    skills: string[]
  } | null
  createdAt: string
  updatedAt: string
  orderItems: OrderItem[]
  deliveryPhases?: any[]
}

function OrderTrackingContent() {
  const searchParams = useSearchParams()
  const [orderInput, setOrderInput] = useState(searchParams?.get('orderNumber') || searchParams?.get('orderId') || '')
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [isListening, setIsListening] = useState(false)

  // Contractor change state
  const [showContractorModal, setShowContractorModal] = useState(false)
  const [contractorRecs, setContractorRecs] = useState<any[]>([])
  const [loadingRecs, setLoadingRecs] = useState(false)
  const [isUpdatingContractor, setIsUpdatingContractor] = useState(false)

  const orderInputRef = React.useRef(orderInput)
  React.useEffect(() => {
    orderInputRef.current = orderInput
  }, [orderInput])

  useEffect(() => {
    if (orderInput) {
      fetchOrder()
    }
  }, [orderInput])

  useEffect(() => {
    if (!order?.id) return

    const activeStatuses = ['PENDING', 'PENDING_CONFIRMATION', 'CONFIRMED', 'CONFIRMED_AWAITING_DEPOSIT', 'DEPOSIT_PAID', 'PROCESSING', 'SHIPPED']
    if (!activeStatuses.includes(order.status)) {
      return
    }

    let unsubscribe: (() => void) | undefined
    const currentOrderId = order.id
    let lastFirebaseStatus: string | null = null
    let isFirstCallback = true

    const setupFirebaseSubscription = async () => {
      try {
        const { subscribeToOrderStatus } = await import('@/lib/firebase-notifications')
        setIsListening(true)
        unsubscribe = subscribeToOrderStatus(currentOrderId, (newStatus) => {
          if (isFirstCallback) {
            isFirstCallback = false
            lastFirebaseStatus = newStatus
            if (newStatus && newStatus !== order.status) {
              fetchOrderSilent()
            }
            return
          }
          if (newStatus && newStatus !== lastFirebaseStatus) {
            lastFirebaseStatus = newStatus
            fetchOrderSilent()
          }
        })
      } catch (e) {
        setIsListening(false)
      }
    }
    setupFirebaseSubscription()
    return () => {
      if (unsubscribe) unsubscribe()
      setIsListening(false)
    }
  }, [order?.id])

  const fetchOrderSilent = async () => {
    const currentInput = orderInputRef.current
    if (!currentInput) return
    try {
      let response = await fetch(`/api/orders/by-number/${encodeURIComponent(currentInput)}`)
      if (!response.ok && !currentInput.includes('ORD-')) {
        response = await fetch(`/api/orders/${currentInput}`)
      }
      if (response.ok) {
        const data = await response.json()
        const newOrder = data.data || data
        setOrder(newOrder)
      }
    } catch (err) { }
  }

  const fetchOrder = async () => {
    if (!orderInput) return
    setLoading(true)
    setError('')
    try {
      let response = await fetch(`/api/orders/by-number/${encodeURIComponent(orderInput)}`)
      if (!response.ok && !orderInput.includes('ORD-')) {
        response = await fetch(`/api/orders/${orderInput}`)
      }
      if (response.ok) {
        const data = await response.json()
        setOrder(data.data || data)
      } else {
        setError('Không tìm thấy đơn hàng. Vui lòng kiểm tra lại mã đơn hàng.')
      }
    } catch (err) {
      setError('Có lỗi xảy ra khi tải thông tin đơn hàng')
    } finally {
      setLoading(false)
    }
  }

  const fetchContractorRecs = async () => {
    if (!order) return
    setLoadingRecs(true)
    try {
      const response = await fetch('/api/recommendations/contractors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productNames: order.orderItems.map(i => i.product.name),
          city: order.shippingAddress?.city || 'all'
        })
      })
      if (response.ok) {
        const data = await response.json()
        setContractorRecs(data.data.contractors || [])
      }
    } catch (error) {
      console.error('Failed to fetch contractor recs:', error)
    } finally {
      setLoadingRecs(false)
    }
  }

  const handleUpdateContractor = async (contractorId: string | null) => {
    if (!order) return
    setIsUpdatingContractor(true)
    try {
      const response = await fetch(`/api/orders/${order.id}/change-contractor`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contractorId })
      })
      const result = await response.json()
      if (response.ok) {
        toast.success(result.message || 'Cập nhật nhà thầu thành công')
        setShowContractorModal(false)
        fetchOrder() // Refresh order data
      } else {
        toast.error(result.error?.message || 'Không thể cập nhật nhà thầu')
      }
    } catch (error) {
      toast.error('Có lỗi xảy ra khi cập nhật')
    } finally {
      setIsUpdatingContractor(false)
    }
  }

  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'PENDING_CONFIRMATION':
        return { icon: <Clock className="h-12 w-12" />, color: 'text-orange-600', bg: 'bg-orange-100', label: 'Chờ Xác Nhận', desc: 'Đơn hàng đang chờ admin xác nhận' }
      case 'CONFIRMED_AWAITING_DEPOSIT':
        return { icon: <Clock className="h-12 w-12" />, color: 'text-amber-600', bg: 'bg-amber-100', label: 'Chờ Thanh Toán Cọc', desc: 'Đơn hàng đã được xác nhận, vui lòng thanh toán tiền cọc' }
      case 'DEPOSIT_PAID':
        return { icon: <CheckCircle className="h-12 w-12" />, color: 'text-cyan-600', bg: 'bg-cyan-100', label: 'Đã Nhận Cọc', desc: 'Chúng tôi đã nhận tiền cọc, đang chuẩn bị hàng' }
      case 'PENDING':
        return { icon: <Clock className="h-12 w-12" />, color: 'text-yellow-600', bg: 'bg-yellow-100', label: 'Chờ Xử Lý', desc: 'Đơn hàng đang được xử lý' }
      case 'CONFIRMED':
        return { icon: <CheckCircle className="h-12 w-12" />, color: 'text-blue-600', bg: 'bg-blue-100', label: 'Đã Xác Nhận', desc: 'Đơn hàng đã được xác nhận, vui lòng thanh toán' }
      case 'PROCESSING':
        return { icon: <Package className="h-12 w-12" />, color: 'text-purple-600', bg: 'bg-purple-100', label: 'Đang Xử Lý', desc: 'Đang chuẩn bị hàng' }
      case 'SHIPPED':
        return { icon: <Truck className="h-12 w-12" />, color: 'text-indigo-600', bg: 'bg-indigo-100', label: 'Đang Giao Hàng', desc: 'Đơn hàng đang được giao đến bạn' }
      case 'DELIVERED':
        return { icon: <Home className="h-12 w-12" />, color: 'text-green-600', bg: 'bg-green-100', label: 'Đã Giao Hàng', desc: 'Đơn hàng đã được giao thành công' }
      case 'COMPLETED':
        return { icon: <CheckCircle className="h-12 w-12" />, color: 'text-green-600', bg: 'bg-green-100', label: 'Hoàn Thành', desc: 'Đơn hàng hoàn tất' }
      case 'CANCELLED':
        return { icon: <XCircle className="h-12 w-12" />, color: 'text-red-600', bg: 'bg-red-100', label: 'Đã Hủy', desc: 'Đơn hàng đã bị hủy' }
      default:
        return { icon: <Clock className="h-12 w-12" />, color: 'text-gray-600', bg: 'bg-gray-100', label: status, desc: '' }
    }
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] font-sans selection:bg-blue-100 selection:text-blue-900">
      <Header />
      <Toaster />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-black text-slate-900 mb-4 tracking-tighter uppercase leading-none">THEO DÕI HÀNH TRÌNH</h1>
          <p className="text-slate-500 font-medium tracking-tight">Cập nhật mọi chuyển động của đơn hàng từ nhà máy đến công trình.</p>
        </div>

        {/* Search Form - Premium Glassmorphism */}
        <div className="bg-white rounded-[32px] shadow-[0_20px_50px_rgba(0,0,0,0.03)] p-10 mb-12 border border-slate-100">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative group">
              <Package className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 group-focus-within:text-blue-500 transition-colors" />
              <input
                type="text"
                value={orderInput}
                onChange={(e) => setOrderInput(e.target.value)}
                onKeyPress={(e) => { if (e.key === 'Enter') fetchOrder() }}
                placeholder="Nhập mã đơn hàng (ORD-...) hoặc ID..."
                className="w-full bg-slate-50 border border-slate-100 rounded-[20px] pl-12 pr-4 py-4 text-slate-900 font-bold placeholder-slate-300 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5 transition-all outline-none"
              />
            </div>
            <button
              onClick={fetchOrder}
              disabled={!orderInput || loading}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-10 py-4 rounded-[20px] hover:from-blue-700 hover:to-indigo-700 font-black text-[11px] uppercase tracking-[0.2em] disabled:from-slate-200 disabled:to-slate-200 shadow-2xl shadow-blue-500/20 transition-all active:scale-95"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'TRA CỨU NGAY'}
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4 mb-8">
            <p className="text-red-800 text-center font-semibold">{error}</p>
          </div>
        )}

        {order && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* LEFT COLUMN: MAIN TRACKING JOURNEY */}
            <div className="lg:col-span-8 space-y-8">
              {/* JOURNEY TIMELINE */}
              <div className="bg-white rounded-[32px] shadow-[0_20px_40px_rgba(0,0,0,0.03)] border border-slate-100 p-8 overflow-hidden relative">
                <div className="absolute top-0 left-0 w-1.5 h-full bg-blue-600"></div>
                <div className="flex items-center justify-between mb-10">
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 ${getStatusInfo(order.status).bg} ${getStatusInfo(order.status).color} rounded-xl flex items-center justify-center`}>
                      {React.cloneElement(getStatusInfo(order.status).icon as React.ReactElement<any>, { className: 'w-6 h-6' })}
                    </div>
                    <div>
                      <h3 className="text-xl font-black text-slate-900 tracking-tighter uppercase leading-none mb-1">{getStatusInfo(order.status).label}</h3>
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">{getStatusInfo(order.status).desc}</p>
                    </div>
                  </div>
                  {['PENDING', 'PENDING_CONFIRMATION', 'CONFIRMED', 'CONFIRMED_AWAITING_DEPOSIT'].includes(order.status) && (
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 text-emerald-600 rounded-full border border-emerald-100 border-dashed">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                      <span className="text-[9px] font-black uppercase tracking-widest">Live Updates</span>
                    </div>
                  )}
                </div>

                {/* Visual Timeline Bar */}
                <div className="relative pb-6">
                  <div className="absolute left-0 top-[1.4rem] w-full h-[2px] bg-slate-50"></div>
                  <div
                    className="absolute left-0 top-[1.4rem] h-[3px] -mt-[0.5px] bg-blue-600 transition-all duration-1000 rounded-full"
                    style={{
                      width: order.status === 'PENDING_CONFIRMATION' ? '12.5%' :
                        order.status === 'CONFIRMED_AWAITING_DEPOSIT' ? '25%' :
                          order.status === 'DEPOSIT_PAID' ? '37.5%' :
                            order.status === 'CONFIRMED' ? '50%' :
                              order.status === 'PROCESSING' ? '62.5%' :
                                order.status === 'SHIPPED' ? '75%' :
                                  order.status === 'DELIVERED' ? '90%' :
                                    order.status === 'COMPLETED' ? '100%' : '5%'
                    }}
                  ></div>

                  <div className="flex justify-between relative z-10">
                    {[
                      { s: 'PENDING_CONFIRMATION', i: Clock },
                      { s: 'DEPOSIT_PAID', i: CheckCircle },
                      { s: 'PROCESSING', i: Package },
                      { s: 'SHIPPED', i: Truck },
                      { s: 'DELIVERED', i: Home }
                    ].map((step, idx) => {
                      const isActive = getStatusPriority(order.status) >= getStatusPriority(step.s);
                      return (
                        <div key={idx} className="flex flex-col items-center group">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all border-2 ${isActive ? 'bg-blue-600 border-white text-white shadow-lg scale-110 ring-4 ring-blue-500/5' : 'bg-white border-slate-50 text-slate-200'}`}>
                            <step.i className="w-3.5 h-3.5" />
                          </div>
                          <span className={`mt-3 text-[8px] font-black uppercase tracking-tight ${isActive ? 'text-blue-600' : 'text-slate-300'}`}>
                            {getStatusLabel(step.s)}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>

              {/* DETAILED DELIVERY PHASES */}
              {order.deliveryPhases && order.deliveryPhases.length > 0 ? (
                <div className="bg-white rounded-[32px] shadow-[0_20px_40px_rgba(0,0,0,0.03)] p-10 border border-slate-100 relative overflow-hidden">
                  <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-4">
                      <div className="w-1 h-6 bg-blue-600 rounded-full"></div>
                      <h3 className="text-xl font-black text-slate-900 tracking-tighter uppercase leading-none">Kế hoạch giao hàng</h3>
                    </div>
                    <div className="bg-blue-50 px-3 py-1.5 rounded-xl flex items-center gap-2">
                      <Truck size={14} className="text-blue-600" />
                      <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest">{order.deliveryPhases.length} Đợt</span>
                    </div>
                  </div>

                  <div className="relative space-y-6">
                    {order.deliveryPhases.map((phase: any, idx: number) => (
                      <div key={idx} className="bg-slate-50/30 rounded-2xl p-6 border border-slate-100/50 group hover:bg-white hover:border-blue-100 transition-all duration-300">
                        <div className="flex justify-between items-center mb-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center font-black text-sm">
                              {phase.phaseNumber}
                            </div>
                            <div>
                              <h4 className="text-sm font-black text-slate-900 uppercase">Đợt {phase.phaseNumber}</h4>
                              <div className="flex items-center gap-2 text-slate-400">
                                <Calendar size={12} />
                                <span className="text-[10px] font-bold uppercase">{new Date(phase.scheduledDate).toLocaleDateString('vi-VN')}</span>
                              </div>
                            </div>
                          </div>
                          <span className={`text-[8px] px-2 py-1 rounded-full font-black uppercase tracking-widest ${phase.status === 'PENDING' ? 'bg-amber-50 text-amber-600' :
                            phase.status === 'PREPARING' || phase.status === 'READY' ? 'bg-indigo-50 text-indigo-600' :
                              phase.status === 'IN_TRANSIT' ? 'bg-blue-50 text-blue-600' :
                                phase.status === 'DELIVERED' || phase.status === 'CONFIRMED' ? 'bg-emerald-50 text-emerald-600' :
                                  'bg-red-50 text-red-600'
                            }`}>
                            {phase.status === 'PENDING' ? 'Chờ xử lý' :
                              phase.status === 'PREPARING' ? 'Đang soạn hàng' :
                                phase.status === 'READY' ? 'Sẵn sàng' :
                                  phase.status === 'IN_TRANSIT' ? 'Đang giao' :
                                    phase.status === 'DELIVERED' ? 'Đã giao' :
                                      phase.status === 'CONFIRMED' ? 'Đã nhận' : 'Đã hủy'}
                          </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 opacity-80 group-hover:opacity-100 transition-opacity">
                          {Array.isArray(phase.items) && phase.items
                            .filter((item: any) => item.quantity > 0)
                            .map((item: any, iidx: number) => {
                              const orderItem = order.orderItems.find((oi: any) => oi.id === item.orderItemId);
                              return (
                                <div key={iidx} className="flex justify-between items-center py-1.5 border-b border-slate-100/50 last:border-0 md:last:border-b">
                                  <span className="text-[11px] font-bold text-slate-500 truncate pr-4">{orderItem?.product?.name}</span>
                                  <span className="text-[10px] font-black text-slate-900 bg-white px-2 py-0.5 rounded-md shadow-sm border border-slate-50 shrink-0">
                                    {item.quantity} SP
                                  </span>
                                </div>
                              );
                            })}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                (order.status !== 'CANCELLED' && order.status !== 'COMPLETED') && (
                  <div className="bg-white rounded-[32px] shadow-[0_20px_40px_rgba(0,0,0,0.03)] p-10 border border-slate-100 text-center">
                    <Truck size={32} className="text-blue-500 opacity-20 mx-auto mb-4" />
                    <h3 className="text-base font-black text-slate-900 uppercase mb-2">Đang lập kế hoạch giao hàng</h3>
                    <p className="text-xs text-slate-400 font-medium">Lịch trình chi tiết sẽ tự động xuất hiện tại đây.</p>
                  </div>
                )
              )}

              {/* ALL PRODUCTS LIST - Moved from Sidebar to Main Column for better balance */}
              <div className="bg-white rounded-[32px] shadow-[0_20px_40px_rgba(0,0,0,0.03)] p-10 border border-slate-100 relative overflow-hidden">
                <div className="flex items-center gap-4 mb-8">
                  <div className="w-1 h-6 bg-emerald-500 rounded-full"></div>
                  <h3 className="text-xl font-black text-slate-900 tracking-tighter uppercase leading-none">Chi tiết vật tư</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="text-left border-b border-slate-100">
                        <th className="pb-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Sản phẩm</th>
                        <th className="pb-4 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">Số lượng</th>
                        <th className="pb-4 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">Thành tiền</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {order.orderItems.map((item) => (
                        <tr key={item.id} className="group">
                          <td className="py-5">
                            <div className="flex items-center gap-4">
                              <div className="w-12 h-12 bg-slate-50 rounded-xl flex items-center justify-center p-2 group-hover:bg-blue-50 transition-colors">
                                {item.product.images?.[0] ? (
                                  <img src={item.product.images[0]} alt={item.product.name} className="max-w-full max-h-full object-contain" />
                                ) : (
                                  <Package className="w-5 h-5 text-slate-300" />
                                )}
                              </div>
                              <div>
                                <p className="font-bold text-slate-900 text-sm uppercase tracking-tight leading-tight mb-1">{item.product.name}</p>
                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{item.unitPrice.toLocaleString()}₫ / {item.product.unit || 'Đơn vị'}</p>
                              </div>
                            </div>
                          </td>
                          <td className="py-5 text-center">
                            <span className="inline-block px-3 py-1 bg-slate-50 rounded-lg font-black text-slate-700 text-xs">
                              {item.quantity}
                            </span>
                          </td>
                          <td className="py-5 text-right font-black text-slate-900 text-sm">
                            {item.totalPrice.toLocaleString()}₫
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN: SIDEBAR INFO */}
            <div className="lg:col-span-4 space-y-8">
              {/* Payment Status & QR Card - Priority 1 (Actionable) */}
              {order.paymentMethod === 'BANK_TRANSFER' && order.paymentStatus !== 'PAID' && order.qrExpiresAt && (
                (order.status === 'CONFIRMED_AWAITING_DEPOSIT' || order.status === 'PENDING_CONFIRMATION') && (
                  <div className="bg-white rounded-[32px] shadow-[0_30px_60px_rgba(59,130,246,0.1)] p-8 border border-blue-200 relative overflow-hidden ring-4 ring-blue-500/5">
                    <div className="absolute top-0 right-0 p-4 opacity-5">
                      <Shield size={60} className="text-blue-600" />
                    </div>
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg">
                        <CreditCard size={20} />
                      </div>
                      <h4 className="text-lg font-black text-slate-900 uppercase tracking-tighter">
                        Thanh toán
                      </h4>
                    </div>
                    <QRPayment
                      amount={order.paymentType === 'DEPOSIT' ? (order.depositAmount || 0) : order.netAmount}
                      orderId={order.orderNumber}
                      description={order.paymentType === 'DEPOSIT' ? `Coc ${order.depositPercentage}% ${order.orderNumber}` : `Full ${order.orderNumber}`}
                      expiresAt={order.qrExpiresAt}
                    />
                  </div>
                )
              )}

              {/* Billing Summary - Priority 2 (Financial Overview) */}
              <div className="bg-white rounded-[32px] shadow-[0_20px_40px_rgba(0,0,0,0.03)] border border-slate-100 p-8">
                <div className="space-y-4">
                  <div className="flex justify-between items-center text-xs font-bold text-slate-500">
                    <span className="uppercase tracking-widest">Tạm tính:</span>
                    <span className="tracking-tight">{order.totalAmount.toLocaleString()}₫</span>
                  </div>
                  <div className="flex justify-between items-center text-xs font-bold text-slate-500">
                    <span className="uppercase tracking-widest">Vận chuyển:</span>
                    <span className="tracking-tight">{order.shippingAmount.toLocaleString()}₫</span>
                  </div>
                  <div className="pt-4 mt-2 border-t border-slate-50">
                    <div className="flex justify-between items-end">
                      <div>
                        <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest mb-1.5">Tổng cộng đơn hàng</p>
                        <span className="text-3xl font-black text-slate-900 tracking-tighter leading-none">{order.netAmount.toLocaleString()}<span className="text-xs ml-0.5">₫</span></span>
                      </div>
                      <div className="text-right">
                        <span className={`text-[9px] font-black px-3 py-1.5 rounded-xl uppercase tracking-widest border ${order.paymentStatus === 'PAID' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-slate-50 text-slate-400 border-slate-100'
                          }`}>
                          {order.paymentStatus === 'PAID' ? 'Đã Thanh Toán' : 'Chờ tất toán'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>


              {/* Administrative Info Card */}
              <div className="bg-white rounded-[32px] shadow-[0_20px_40px_rgba(0,0,0,0.03)] border border-slate-100 p-8">
                <h4 className="text-xs font-black text-slate-400 mb-6 uppercase tracking-widest flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-blue-500 rounded-full"></span>
                  Thông tin đơn hàng
                </h4>
                <div className="space-y-6">
                  <div className="flex justify-between items-start">
                    <div className="space-y-1">
                      <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest leading-none">Mã định danh</p>
                      <p className="text-lg font-black text-slate-900 tracking-tight">{order.orderNumber}</p>
                    </div>
                    <button
                      onClick={() => { navigator.clipboard.writeText(order.orderNumber); toast.success('Đã sao chép'); }}
                      className="p-2 bg-slate-50 rounded-lg text-slate-400 hover:text-blue-600 transition-all active:scale-90"
                    >
                      <Package size={14} />
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-50">
                    <div className="space-y-1">
                      <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest leading-none">Ngày đặt</p>
                      <p className="text-xs font-black text-slate-600">{new Date(order.createdAt).toLocaleDateString('vi-VN')}</p>
                    </div>
                    <div className="space-y-1 text-right">
                      <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest leading-none">Khách hàng</p>
                      <p className="text-xs font-black text-slate-600 truncate">{order.customerType === 'GUEST' ? order.guestName : (order.customer?.user?.name || 'N/A')}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Contractor Section */}
              <div className="bg-white rounded-[32px] shadow-[0_20px_40px_rgba(0,0,0,0.03)] border border-slate-100 p-8 overflow-hidden relative">
                <div className="flex items-center justify-between mb-6">
                  <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">Kiến trúc sư / Thợ</h4>
                  {order.contractorChangeCount < 1 && (order.status === 'PENDING' || order.status === 'PENDING_CONFIRMATION') && (
                    <button
                      onClick={() => { setShowContractorModal(true); fetchContractorRecs(); }}
                      className="text-[9px] font-black bg-blue-50 text-blue-600 px-3 py-1.5 rounded-lg uppercase tracking-widest hover:bg-blue-600 hover:text-white transition-all shadow-sm"
                    >
                      {order.contractor ? 'Đổi mới' : 'Kết nối'}
                    </button>
                  )}
                </div>

                {order.contractor ? (
                  <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-5 relative group overflow-hidden">
                    <div className="relative z-10 flex items-center gap-4">
                      <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center text-white font-black text-xl shadow-lg uppercase">
                        {order.contractor.displayName[0]}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h5 className="font-black text-white text-sm uppercase truncate">{order.contractor.displayName}</h5>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="flex items-center gap-1 text-[10px] text-amber-400 font-bold"><Star size={10} fill="currentColor" /> {order.contractor.avgRating}</span>
                          <span className="text-[10px] text-slate-400 font-bold uppercase truncate opacity-60">Expert • {order.contractor.city}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-slate-50 border-2 border-dashed border-slate-100 rounded-2xl p-6 text-center group cursor-pointer hover:border-blue-400 transition-colors" onClick={() => { if (order.contractorChangeCount < 1) setShowContractorModal(true) }}>
                    <Building className="w-6 h-6 text-slate-300 mx-auto mb-2 opacity-50" />
                    <p className="text-slate-400 text-[9px] font-black uppercase tracking-widest">Kết nối chuyên gia thi công</p>
                  </div>
                )}
              </div>

              {/* Quick Actions Buttons */}
              <div className="flex flex-col gap-3">
                <button
                  onClick={() => window.print()}
                  className="w-full bg-slate-900 text-white px-6 py-4 rounded-[20px] font-black text-[10px] uppercase tracking-widest hover:bg-slate-800 transition-all active:scale-95 flex items-center justify-center gap-2"
                >
                  Tải hóa đơn (PDF)
                </button>
                <button
                  onClick={() => { navigator.clipboard.writeText(order.orderNumber); toast.success('Đã sao chép mã đơn'); }}
                  className="w-full bg-white text-slate-400 border border-slate-200 px-6 py-4 rounded-[20px] font-black text-[10px] uppercase tracking-widest hover:bg-slate-50 transition-all active:scale-95 flex items-center justify-center gap-2"
                >
                  Sao chép mã đơn
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Change Contractor Modal */}
        {showContractorModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-white rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl animate-in zoom-in-95 duration-200">
              <div className="p-6 border-b flex justify-between items-center bg-primary-600 text-white">
                <div>
                  <h3 className="text-2xl font-black">🏗️ Cập Nhật Nhà Thầu</h3>
                  <p className="text-primary-100 text-xs mt-1">Lưu ý: Bạn chỉ được thay đổi duy nhất 1 lần</p>
                </div>
                <button onClick={() => setShowContractorModal(false)} className="p-2 hover:bg-white/10 rounded-full transition-colors"><X size={24} /></button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                <div className="bg-amber-50 border-2 border-amber-200 rounded-2xl p-4 flex gap-3 text-amber-800">
                  <AlertTriangle className="shrink-0" />
                  <p className="text-sm font-bold leading-tight">
                    CẢNH BÁO: Đây là lượt thay đổi cuối cùng của bạn cho đơn hàng này. Hãy kiểm tra kỹ trước khi xác nhận.
                  </p>
                </div>

                {loadingRecs ? (
                  <div className="py-20 flex flex-col items-center justify-center gap-4">
                    <Loader2 className="h-10 w-10 animate-spin text-primary-600" />
                    <p className="text-gray-500 font-bold">Đang tìm chuyên gia phù hợp...</p>
                  </div>
                ) : contractorRecs.length > 0 ? (
                  <div className="grid grid-cols-1 gap-4">
                    {contractorRecs.map((c) => (
                      <div key={c.id} className="p-4 bg-white rounded-2xl border-2 border-gray-100 hover:border-primary-600 transition-all group shadow-sm flex items-center gap-4">
                        <div className="flex-1 min-w-0">
                          <h4 className="font-bold text-gray-900 truncate">{c.displayName}</h4>
                          <div className="flex items-center gap-3 mt-1">
                            <span className="flex items-center gap-1 text-xs text-amber-500 font-bold"><Star size={12} fill="currentColor" /> {c.avgRating}</span>
                            <span className="text-xs text-gray-400"># {c.city}</span>
                          </div>
                          <div className="flex flex-wrap gap-1 mt-2">
                            {c.skills?.slice(0, 3).map((s: string) => (
                              <span key={s} className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-bold">{s}</span>
                            ))}
                          </div>
                        </div>
                        <button
                          disabled={isUpdatingContractor}
                          onClick={() => handleUpdateContractor(c.id)}
                          className="bg-primary-600 text-white px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-primary-700 transition-all flex items-center gap-2 disabled:opacity-50"
                        >
                          Chọn
                          <ArrowRight size={16} />
                        </button>
                      </div>
                    ))}
                    <button
                      onClick={() => handleUpdateContractor(null)}
                      className="w-full py-3 bg-red-50 text-red-600 rounded-xl font-bold text-sm hover:bg-red-100 transition-all mt-4"
                    >
                      Bỏ chọn tất cả nhà thầu
                    </button>
                  </div>
                ) : (
                  <div className="text-center py-10"><p className="text-gray-400 italic">Không tìm thấy thợ phù hợp tại khu vực này.</p></div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

// Utility functions for timeline
const getStatusPriority = (status: string) => {
  const priorities: Record<string, number> = {
    'PENDING_CONFIRMATION': 1,
    'CONFIRMED_AWAITING_DEPOSIT': 2,
    'DEPOSIT_PAID': 3,
    'PROCESSING': 4,
    'SHIPPED': 5,
    'DELIVERED': 6,
    'COMPLETED': 7
  }
  return priorities[status] || 0
}

const getStatusLabel = (status: string) => {
  const labels: Record<string, string> = {
    'PENDING_CONFIRMATION': 'Đã đặt hàng',
    'DEPOSIT_PAID': 'Đã nhận cọc',
    'PROCESSING': 'Đang sx/Lưu kho',
    'SHIPPED': 'Đang vận chuyển',
    'DELIVERED': 'Giao thành công'
  }
  return labels[status] || status
}

export default function OrderTrackingPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-50 flex items-center justify-center font-bold">Đang tải...</div>}>
      <OrderTrackingContent />
    </Suspense>
  )
}
