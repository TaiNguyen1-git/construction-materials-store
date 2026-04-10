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
  CreditCard,
  Search,
  Copy,
  Download,
  Phone
} from 'lucide-react'
import Link from 'next/link'
import toast, { Toaster } from 'react-hot-toast'
import { Skeleton } from '@/components/ui/skeleton'

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
  driverId?: string | null
  driver?: {
    id: string
    user: {
      name: string
      phone?: string
      email?: string
    }
  } | null
  orderTracking: any[]
}

function getStatusPriority(status: string): number {
  const priorities: Record<string, number> = {
    'PENDING_CONFIRMATION': 1,
    'CONFIRMED': 2,
    'CONFIRMED_AWAITING_DEPOSIT': 2,
    'DEPOSIT_PAID': 3,
    'PROCESSING': 4,
    'SHIPPED': 5,
    'DELIVERED': 6,
    'COMPLETED': 7,
    'CANCELLED': 0
  };
  return priorities[status] || 0;
}

function getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      'PENDING_CONFIRMATION': 'Chờ xác nhận',
      'CONFIRMED': 'Đã xác nhận',
      'CONFIRMED_AWAITING_DEPOSIT': 'Chờ cọc',
      'DEPOSIT_PAID': 'Đã nhận cọc',
      'PROCESSING': 'Đang sản xuất',
      'SHIPPED': 'Đang giao hàng',
      'DELIVERED': 'Đã giao hàng',
      'COMPLETED': 'Hoàn thành',
      'CANCELLED': 'Đã hủy'
    };
    return labels[status] || status;
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
  const [suggestions, setSuggestions] = useState<any[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)

  const orderInputRef = React.useRef(orderInput)
  React.useEffect(() => {
    orderInputRef.current = orderInput
  }, [orderInput])

  useEffect(() => {
    const fetchSuggestions = async () => {
      if (orderInput.length < 2) {
        setSuggestions([])
        setShowSuggestions(false)
        return
      }

      try {
        const response = await fetch(`/api/orders/suggestions?query=${encodeURIComponent(orderInput)}`)
        if (response.ok) {
          const result = await response.json()
          setSuggestions(result.data || [])
          setShowSuggestions(result.data?.length > 0)
        }
      } catch (err) {
        console.error('Failed to fetch suggestions:', err)
      }
    }

    const timer = setTimeout(fetchSuggestions, 300)
    return () => clearTimeout(timer)
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
        return { icon: <Clock size={20} />, color: 'text-amber-600', bg: 'bg-amber-50', label: 'Chờ xác nhận', desc: 'Đơn hàng đang chờ quản trị viên xác nhận' }
      case 'CONFIRMED_AWAITING_DEPOSIT':
        return { icon: <CreditCard size={20} />, color: 'text-primary-600', bg: 'bg-primary-50', label: 'Chờ đặt cọc', desc: 'Vui lòng hoàn tất thanh toán tiền cọc' }
      case 'DEPOSIT_PAID':
        return { icon: <CheckCircle size={20} />, color: 'text-green-600', bg: 'bg-green-50', label: 'Đã nhận cọc', desc: 'Hệ thống đã ghi nhận cọc, đang chuẩn bị hàng' }
      case 'PROCESSING':
        return { icon: <Package size={20} />, color: 'text-blue-600', bg: 'bg-blue-50', label: 'Đang xử lý', desc: 'Vật liệu đang được chuẩn bị và kiểm tra' }
      case 'SHIPPED':
        return { icon: <Truck size={20} />, color: 'text-indigo-600', bg: 'bg-indigo-50', label: 'Đang giao hàng', desc: 'Đơn hàng đang trên đường đến công trình' }
      case 'DELIVERED':
        return { icon: <Home size={20} />, color: 'text-green-600', bg: 'bg-green-50', label: 'Đã giao hàng', desc: 'Vật tư đã được bàn giao thành công' }
      case 'COMPLETED':
        return { icon: <CheckCircle size={20} />, color: 'text-green-600', bg: 'bg-green-50', label: 'Hoàn thành', desc: 'Đơn hàng đã hoàn tất tất cả các bước' }
      case 'CANCELLED':
        return { icon: <XCircle size={20} />, color: 'text-red-600', bg: 'bg-red-50', label: 'Đã hủy', desc: 'Đơn hàng đã bị hủy bỏ' }
      default:
        return { icon: <Info size={20} />, color: 'text-neutral-500', bg: 'bg-neutral-50', label: status, desc: '' }
    }
  }

  if (loading && !order) {
    return (
      <div className="min-h-screen bg-neutral-50">
        <Header />
        <main className="max-w-7xl mx-auto px-4 py-16">
          <Skeleton className="h-10 w-64 mb-8 mx-auto" />
          <Skeleton className="h-64 w-full rounded-2xl mb-12" />
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      <Header />
      <Toaster />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold text-neutral-900 mb-2">Theo dõi đơn hàng</h1>
          <p className="text-sm text-neutral-500 font-medium">Cập nhật hành trình vật tư từ kho bãi đến công trình của bạn</p>
        </div>

        {/* Search Bar */}
        <div className="bg-white rounded-2xl shadow-sm border border-neutral-200 p-6 mb-12 max-w-3xl mx-auto">
          <div className="flex gap-3 relative">
            <div className="flex-1 relative">
              <input
                type="text"
                value={orderInput}
                onChange={(e) => setOrderInput(e.target.value)}
                onKeyPress={(e) => { if (e.key === 'Enter') fetchOrder() }}
                placeholder="Nhập mã đơn hàng (ORD-...) hoặc ID..."
                className="w-full bg-neutral-50 border border-neutral-200 rounded-xl pl-12 pr-4 py-3.5 text-sm font-semibold focus:border-primary-500 transition-all outline-none"
              />
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
              
              {showSuggestions && suggestions.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-lg border border-neutral-200 overflow-hidden z-50">
                  {suggestions.map((s) => (
                    <button
                      key={s.id}
                      onClick={() => { setOrderInput(s.orderNumber); setShowSuggestions(false); setTimeout(() => fetchOrder(), 10); }}
                      className="w-full px-5 py-3.5 text-left hover:bg-neutral-50 border-b border-neutral-100 last:border-0 flex justify-between items-center group"
                    >
                      <div>
                        <p className="text-sm font-bold text-neutral-900">{s.orderNumber}</p>
                        <p className="text-[10px] text-neutral-400 font-bold uppercase">{getStatusLabel(s.status)}</p>
                      </div>
                      <ArrowRight size={14} className="text-neutral-300 group-hover:text-primary-600 transition-colors" />
                    </button>
                  ))}
                </div>
              )}
            </div>
            <button
              onClick={fetchOrder}
              disabled={!orderInput || loading}
              className="bg-primary-600 text-white px-8 py-3.5 rounded-xl font-bold text-sm shadow-sm hover:bg-primary-700 transition-all disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Tra cứu'}
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-8 p-4 bg-red-50 border border-red-100 rounded-xl text-red-600 text-center text-sm font-bold">
            {error}
          </div>
        )}

        {order && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Main Journey */}
            <div className="lg:col-span-8 space-y-8">
              <div className="bg-white rounded-2xl shadow-sm border border-neutral-200 p-8">
                <div className="flex items-center gap-4 mb-12">
                   <div className={`p-3 rounded-xl ${getStatusInfo(order.status).bg} ${getStatusInfo(order.status).color}`}>
                      {getStatusInfo(order.status).icon}
                   </div>
                   <div>
                      <h2 className="text-lg font-bold text-neutral-900">{getStatusInfo(order.status).label}</h2>
                      <p className="text-xs text-neutral-500 font-medium">{getStatusInfo(order.status).desc}</p>
                   </div>
                </div>

                {/* Tracking Progress Bar */}
                <div className="relative mb-16 px-2">
                  <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-1 bg-neutral-100 rounded-full"></div>
                  <div 
                    className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-primary-600 rounded-full transition-all duration-1000"
                    style={{ 
                        width: `${Math.max(10, Math.min(100, (getStatusPriority(order.status) / 6) * 100))}%` 
                    }}
                  ></div>
                  
                  <div className="flex justify-between relative z-10">
                    {[
                      { s: 'PENDING_CONFIRMATION', i: Clock, l: 'Đã đặt' },
                      { s: 'DEPOSIT_PAID', i: CreditCard, l: 'Đã cọc' },
                      { s: 'PROCESSING', i: Package, l: 'Chuẩn bị' },
                      { s: 'SHIPPED', i: Truck, l: 'Giao hàng' },
                      { s: 'DELIVERED', i: Home, l: 'Đã nhận' }
                    ].map((step, idx) => {
                      const isActive = getStatusPriority(order.status) >= getStatusPriority(step.s)
                      return (
                        <div key={idx} className="flex flex-col items-center">
                          <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all duration-500 ${
                            isActive ? 'bg-primary-600 border-primary-600 text-white shadow-sm' : 'bg-white border-neutral-200 text-neutral-300'
                          }`}>
                            <step.i size={14} />
                          </div>
                          <span className={`mt-3 text-[10px] font-bold uppercase tracking-wider ${isActive ? 'text-primary-600' : 'text-neutral-400'}`}>
                            {step.l}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* Driver Info */}
                {order.driver && (
                  <div className="bg-neutral-50 rounded-xl p-5 border border-neutral-200 flex items-center justify-between mb-8">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-white rounded-lg border border-neutral-200 flex items-center justify-center text-primary-600 shadow-sm">
                        <User size={24} />
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Tài xế phụ trách</p>
                        <h4 className="text-sm font-bold text-neutral-900">{order.driver.user.name}</h4>
                        {order.driver.user.phone && <p className="text-xs text-neutral-500 font-medium">{order.driver.user.phone}</p>}
                      </div>
                    </div>
                    {order.driver.user.phone && (
                      <a href={`tel:${order.driver.user.phone}`} className="p-3 bg-white text-primary-600 rounded-lg shadow-sm border border-neutral-200 hover:bg-primary-600 hover:text-white transition-all">
                        <Phone size={18} />
                      </a>
                    )}
                  </div>
                )}

                {/* Tracking History */}
                <div className="space-y-6 pt-6 border-t border-neutral-100">
                   <h3 className="text-xs font-bold text-neutral-400 uppercase tracking-widest">Lịch sử cập nhật</h3>
                   <div className="space-y-6 pl-4 border-l-2 border-neutral-100 ml-2">
                      {order.orderTracking.map((event: any, idx: number) => (
                        <div key={idx} className="relative">
                          <div className="absolute -left-[23px] top-1 w-3 h-3 bg-white border-2 border-primary-600 rounded-full"></div>
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                             <div>
                                <p className="text-sm font-bold text-neutral-900 capitalize">{getStatusLabel(event.status)}</p>
                                <p className="text-xs text-neutral-500 font-medium">{event.description}</p>
                             </div>
                             <div className="text-left sm:text-right">
                                <p className="text-[10px] font-bold text-neutral-400 uppercase">{new Date(event.timestamp).toLocaleDateString('vi-VN')}</p>
                                <p className="text-[10px] text-neutral-300">{new Date(event.timestamp).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</p>
                             </div>
                          </div>
                        </div>
                      ))}
                   </div>
                </div>
              </div>

              {/* Delivery Phases */}
              {order.deliveryPhases && order.deliveryPhases.length > 0 && (
                <div className="bg-white rounded-2xl shadow-sm border border-neutral-200 p-8">
                   <div className="flex items-center justify-between mb-8">
                      <h3 className="text-lg font-bold text-neutral-900">Kế hoạch giao nhận</h3>
                      <div className="bg-primary-50 px-3 py-1 rounded-lg text-primary-600 text-[10px] font-bold uppercase border border-primary-100">
                        {order.deliveryPhases.length} đợt giao
                      </div>
                   </div>
                   <div className="space-y-4">
                      {order.deliveryPhases.map((phase: any, idx: number) => (
                        <div key={idx} className="bg-neutral-50 rounded-xl p-5 border border-neutral-100">
                           <div className="flex justify-between items-start mb-4">
                              <div className="flex items-center gap-3">
                                 <div className="w-8 h-8 bg-white rounded-lg border border-neutral-200 flex items-center justify-center text-xs font-bold text-neutral-900 shadow-sm">{phase.phaseNumber}</div>
                                 <div>
                                    <h4 className="text-sm font-bold text-neutral-900">Đợt giao {phase.phaseNumber}</h4>
                                    <p className="text-[10px] text-neutral-400 font-medium italic">Ngày dự kiến: {new Date(phase.scheduledDate).toLocaleDateString('vi-VN')}</p>
                                 </div>
                              </div>
                              <span className="text-[10px] px-2 py-0.5 rounded font-bold uppercase bg-white border border-neutral-200 text-neutral-500">{phase.status}</span>
                           </div>
                           <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2 opacity-70">
                              {phase.items.filter((i:any) => i.quantity > 0).map((item:any, iidx:number) => {
                                 const product = order.orderItems.find(oi => oi.id === item.orderItemId)?.product
                                 return (
                                   <div key={iidx} className="flex justify-between items-center text-[11px] border-b border-neutral-200/50 pb-1">
                                      <span className="font-medium text-neutral-600 truncate mr-2">{product?.name}</span>
                                      <span className="font-bold text-neutral-900">{item.quantity} {product?.unit || 'cái'}</span>
                                   </div>
                                 )
                              })}
                           </div>
                        </div>
                      ))}
                   </div>
                </div>
              )}
            </div>

            {/* Sidebar Summary */}
            <div className="lg:col-span-4 space-y-8">
              {/* Payment Action */}
              {order.paymentMethod === 'BANK_TRANSFER' && order.paymentStatus !== 'PAID' && order.qrExpiresAt && (
                <div className="bg-white rounded-2xl shadow-sm border-2 border-primary-100 p-8">
                  <h3 className="text-lg font-bold text-neutral-900 mb-6 flex items-center gap-2">
                    <Shield className="text-primary-600" size={20} /> Thanh toán bảo mật
                  </h3>
                  {new Date(order.qrExpiresAt) < new Date() ? (
                    <div className="text-center py-6">
                      <AlertTriangle className="mx-auto text-amber-500 mb-3" size={32} />
                      <p className="text-sm font-bold text-neutral-800 mb-1">Mã thanh toán hết hạn</p>
                      <p className="text-xs text-neutral-500 mb-6">Vui lòng tải lại trang hoặc liên hệ hỗ trợ</p>
                      <button onClick={fetchOrder} className="text-xs font-bold text-primary-600 hover:underline">Lấy mã mới</button>
                    </div>
                  ) : (
                    <QRPayment 
                      amount={order.paymentType === 'DEPOSIT' ? (order.depositAmount || 0) : order.netAmount}
                      orderId={order.orderNumber}
                      description={`Thanh toan don hang ${order.orderNumber}`}
                      expiresAt={order.qrExpiresAt}
                    />
                  )}
                </div>
              )}

              {/* Order Essentials */}
              <div className="bg-white rounded-2xl shadow-sm border border-neutral-200 p-8">
                 <h3 className="text-xs font-bold text-neutral-400 uppercase tracking-widest mb-6">Thông tin đơn hàng</h3>
                 <div className="space-y-6">
                    <div className="flex justify-between items-start">
                       <div>
                          <p className="text-[10px] font-bold text-neutral-400 uppercase">Mã đơn hàng</p>
                          <p className="text-xl font-bold text-neutral-900">{order.orderNumber}</p>
                       </div>
                       <button onClick={() => { navigator.clipboard.writeText(order.orderNumber); toast.success('Đã sao chép'); }} className="p-2 text-neutral-400 hover:text-primary-600 transition-colors">
                          <Copy size={16} />
                       </button>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 h-full">
                       <div className="border-r border-neutral-100">
                          <p className="text-[10px] font-bold text-neutral-400 uppercase">Ngày đặt</p>
                          <p className="text-xs font-bold text-neutral-700">{new Date(order.createdAt).toLocaleDateString('vi-VN')}</p>
                       </div>
                       <div className="pl-4">
                          <p className="text-[10px] font-bold text-neutral-400 uppercase">Khách hàng</p>
                          <p className="text-xs font-bold text-neutral-700 truncate">{order.customerType === 'GUEST' ? order.guestName : (order.customer?.user?.name || 'Thành viên')}</p>
                       </div>
                    </div>

                    <div className="pt-6 border-t border-neutral-100 flex justify-between items-baseline">
                        <span className="text-xs font-bold text-neutral-400 uppercase">Tổng cộng</span>
                        <span className="text-2xl font-bold text-primary-600">{order.netAmount.toLocaleString()}đ</span>
                    </div>
                 </div>
              </div>

              {/* Connected Contractor */}
              <div className="bg-white rounded-2xl shadow-sm border border-neutral-200 p-8">
                 <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xs font-bold text-neutral-400 uppercase tracking-widest">Nhà thầu phụ trách</h3>
                    {!order.contractor && (
                      <Link href="/contractors" className="text-[10px] font-bold text-primary-600 hover:underline tracking-tight">TÌM KIẾM</Link>
                    )}
                 </div>
                 {order.contractor ? (
                   <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-primary-600 rounded-lg flex items-center justify-center text-white font-bold text-xl">{order.contractor.displayName[0]}</div>
                      <div>
                         <h4 className="text-sm font-bold text-neutral-900">{order.contractor.displayName}</h4>
                         <div className="flex items-center gap-2">
                            <Star size={12} className="text-amber-500 fill-current" />
                            <span className="text-xs font-bold">{order.contractor.avgRating}</span>
                            <span className="text-xs text-neutral-400">| {order.contractor.city}</span>
                         </div>
                      </div>
                   </div>
                 ) : (
                   <div className="py-4 text-center border-2 border-dashed border-neutral-100 rounded-xl">
                      <Building className="mx-auto text-neutral-200 mb-2" size={20} />
                      <p className="text-[10px] font-medium text-neutral-400">Chưa kết nối nhà thầu thi công</p>
                   </div>
                 )}
              </div>

              {/* Action Buttons */}
              <div className="space-y-3">
                 <button onClick={() => window.print()} className="w-full py-4 bg-white border border-neutral-200 rounded-xl text-xs font-bold text-neutral-600 flex items-center justify-center gap-2 hover:border-primary-600 hover:text-primary-600 transition-all">
                    <Download size={16} /> Xuất PDF đơn hàng
                 </button>
                 <Link href="/products" className="w-full py-4 bg-primary-600 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 hover:bg-primary-700 transition-all shadow-sm shadow-primary-100 uppercase tracking-wide">
                    Tiếp tục mua sắm <ArrowRight size={16} />
                 </Link>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

export default function OrderTrackingPage() {
  return (
    <Suspense fallback={<div className="p-20 text-center text-sm font-medium text-neutral-400">Đang tải dữ liệu tra cứu...</div>}>
      <OrderTrackingContent />
    </Suspense>
  )
}
