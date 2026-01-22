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
  ArrowRight,
  AlertTriangle,
  Loader2,
  X
} from 'lucide-react'
import Link from 'next/link'
import toast, { Toaster } from 'react-hot-toast'

const QRPayment = dynamic(() => import('@/components/QRPayment'), { ssr: false })

interface OrderItem {
  id: string
  product: {
    name: string
    sku: string
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <Header />
      <Toaster />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-black text-gray-900 mb-2">📦 Tra Cứu Đơn Hàng</h1>
          <p className="text-gray-600">Nhập mã đơn hàng để theo dõi trạng thái</p>
        </div>

        {/* Search Form */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
          <div className="flex gap-3">
            <input
              type="text"
              value={orderInput}
              onChange={(e) => setOrderInput(e.target.value)}
              onKeyPress={(e) => { if (e.key === 'Enter') fetchOrder() }}
              placeholder="Nhập mã đơn hàng (VD: ORD-...) hoặc ID đơn hàng"
              className="flex-1 border-2 border-gray-300 rounded-lg px-4 py-3 text-gray-900 focus:border-primary-500 focus:outline-none"
            />
            <button
              onClick={fetchOrder}
              disabled={!orderInput || loading}
              className="bg-primary-600 text-white px-8 py-3 rounded-lg hover:bg-primary-700 font-bold disabled:opacity-50"
            >
              {loading ? 'Đang tìm...' : 'Tra cứu'}
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4 mb-8">
            <p className="text-red-800 text-center font-semibold">{error}</p>
          </div>
        )}

        {order && (
          <div className="space-y-6">
            <div className={`${getStatusInfo(order.status).bg} rounded-2xl p-8 text-center border-2 border-${getStatusInfo(order.status).color.replace('text-', '')}`}>
              <div className={`${getStatusInfo(order.status).color} mx-auto mb-4`}>{getStatusInfo(order.status).icon}</div>
              <h2 className={`text-3xl font-black ${getStatusInfo(order.status).color} mb-2`}>{getStatusInfo(order.status).label}</h2>
              <p className="text-gray-700 text-lg">{getStatusInfo(order.status).desc}</p>
              {['PENDING', 'PENDING_CONFIRMATION', 'CONFIRMED', 'CONFIRMED_AWAITING_DEPOSIT'].includes(order.status) && (
                <div className="mt-4 flex items-center justify-center gap-2 text-sm text-gray-500">
                  <div className={`w-2 h-2 rounded-full ${isListening ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`}></div>
                  <span>{isListening ? '🔴 Đang theo dõi - Cập nhật tự động' : 'Đang kết nối...'}</span>
                </div>
              )}
            </div>

            {/* Contractor Section - The "Full Package" post-order feature */}
            <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100 overflow-hidden relative">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                  <Building className="h-6 w-6 text-primary-600" />
                  Chuyên Gia Thi Công
                </h3>
                {order.contractorChangeCount < 1 && (order.status === 'PENDING' || order.status === 'PENDING_CONFIRMATION') && (
                  <button
                    onClick={() => { setShowContractorModal(true); fetchContractorRecs(); }}
                    className="text-xs font-bold text-primary-600 flex items-center gap-1 bg-primary-50 px-3 py-1.5 rounded-lg hover:bg-primary-100 transition-all"
                  >
                    <AlertTriangle size={14} className="text-amber-500" />
                    {order.contractor ? 'Đổi thợ (Chỉ 1 lần)' : 'Thêm thợ thi công'}
                  </button>
                )}
              </div>

              {order.contractor ? (
                <div className="bg-slate-50 rounded-xl p-4 flex gap-4 border border-slate-200">
                  <div className="w-14 h-14 bg-primary-600 rounded-lg flex items-center justify-center text-white font-bold text-2xl shrink-0">
                    {order.contractor.displayName[0]}
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-bold text-gray-900 text-lg">{order.contractor.displayName}</h4>
                        <div className="flex items-center gap-3 mt-1">
                          <span className="flex items-center gap-1 text-xs text-amber-500 font-bold"><Star size={12} fill="currentColor" /> {order.contractor.avgRating}</span>
                          <span className="text-xs text-gray-400">#{order.contractor.city}</span>
                        </div>
                      </div>
                      <span className="bg-emerald-100 text-emerald-700 text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-tighter">Verified</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-4 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
                  <p className="text-gray-500 text-sm italic">Bạn chưa chọn thợ thi công cho đơn hàng này</p>
                </div>
              )}

              {order.contractorChangeCount >= 1 && (
                <p className="text-[10px] text-gray-400 mt-2 italic">* Bạn đã sử dụng lượt thay đổi nhà thầu duy nhất cho đơn này.</p>
              )}
            </div>

            {/* Payment Section for Bank Transfer */}
            {order.paymentMethod === 'BANK_TRANSFER' && order.qrExpiresAt && (
              (order.status === 'CONFIRMED_AWAITING_DEPOSIT' || order.status === 'CONFIRMED') && (
                <div className="bg-white rounded-2xl shadow-lg p-6 border-2 border-amber-200">
                  <h3 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">💳 {order.paymentType === 'DEPOSIT' ? 'Thanh Toán Tiền Cọc' : 'Thanh Toán Đơn Hàng'}</h3>
                  <QRPayment
                    amount={order.paymentType === 'DEPOSIT' ? (order.depositAmount || 0) : order.netAmount}
                    orderId={order.orderNumber}
                    description={order.paymentType === 'DEPOSIT' ? `Coc ${order.depositPercentage}% ${order.orderNumber}` : `Full ${order.orderNumber}`}
                    expiresAt={order.qrExpiresAt}
                  />
                </div>
              )
            )}

            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Thông Tin Đơn Hàng</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div><p className="text-sm text-gray-600">Mã đơn:</p><p className="text-lg font-bold">{order.orderNumber}</p></div>
                <div><p className="text-sm text-gray-600">Ngày đặt:</p><p className="text-lg font-semibold">{new Date(order.createdAt).toLocaleString('vi-VN')}</p></div>
                <div><p className="text-sm text-gray-600">Khách hàng:</p><p className="text-lg font-semibold">{order.customerType === 'GUEST' ? order.guestName : order.customer?.user?.name || 'N/A'}</p></div>
                <div><p className="text-sm text-gray-600">Số điện thoại:</p><p className="text-lg font-semibold">{order.customerType === 'GUEST' ? order.guestPhone : order.customer?.user?.phone || 'N/A'}</p></div>
              </div>

              <div className="border-t pt-4">
                <h4 className="font-bold text-gray-900 mb-3">Sản phẩm:</h4>
                <div className="space-y-2">
                  {order.orderItems.map((item) => (
                    <div key={item.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <div className="flex-1"><p className="font-semibold text-gray-900 line-clamp-1">{item.product.name}</p><p className="text-xs text-gray-600">SL: {item.quantity}</p></div>
                      <p className="font-bold text-primary-600">{item.totalPrice.toLocaleString()}đ</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="border-t mt-4 pt-4 space-y-2">
                <div className="flex justify-between text-gray-600 text-sm"><span>Tạm tính:</span><span>{order.totalAmount.toLocaleString()}đ</span></div>
                <div className="flex justify-between text-gray-600 text-sm"><span>Phí vận chuyển:</span><span>{order.shippingAmount.toLocaleString()}đ</span></div>
                <div className="flex justify-between text-xl font-black pt-2 border-t text-primary-600"><span>Tổng cộng:</span><span>{order.netAmount.toLocaleString()}đ</span></div>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-200">
              <div className="flex flex-col sm:flex-row gap-3">
                <button onClick={() => window.print()} className="flex-1 bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700 font-semibold">In Hóa Đơn</button>
                <button
                  onClick={() => { navigator.clipboard.writeText(order.orderNumber); toast.success('Đã sao chép mã đơn'); }}
                  className="flex-1 bg-gray-100 text-gray-900 px-6 py-3 rounded-lg hover:bg-gray-200 font-semibold"
                >
                  Sao Chép Mã Đơn
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
      </div>
    </div>
  )
}

export default function OrderTrackingPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-50 flex items-center justify-center font-bold">Đang tải...</div>}>
      <OrderTrackingContent />
    </Suspense>
  )
}
