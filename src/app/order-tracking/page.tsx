'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Header from '@/components/Header'
import dynamic from 'next/dynamic'
import { CheckCircle, Clock, Package, Truck, Home, XCircle } from 'lucide-react'

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

  useEffect(() => {
    if (orderInput) {
      fetchOrder()
    }
  }, [orderInput])

  const fetchOrder = async () => {
    if (!orderInput) return

    setLoading(true)
    setError('')

    try {
      // Try to fetch by orderNumber first (public endpoint)
      let response = await fetch(`/api/orders/by-number/${encodeURIComponent(orderInput)}`)
      
      // If not found by orderNumber, try orderId
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
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-black text-gray-900 mb-2">
            📦 Tra Cứu Đơn Hàng
          </h1>
          <p className="text-gray-600">
            Nhập mã đơn hàng để theo dõi trạng thái
          </p>
        </div>

        {/* Search Form */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
          <div className="flex gap-3">
            <input
              type="text"
              value={orderInput}
              onChange={(e) => setOrderInput(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  fetchOrder()
                }
              }}
              placeholder="Nhập mã đơn hàng (VD: ORD-...) hoặc ID đơn hàng"
              className="flex-1 border-2 border-gray-300 rounded-lg px-4 py-3 text-gray-900 focus:border-primary-500 focus:outline-none"
            />
            <button
              onClick={fetchOrder}
              disabled={!orderInput || loading}
              className="bg-primary-600 text-white px-8 py-3 rounded-lg hover:bg-primary-700 transition-colors font-bold disabled:opacity-50"
            >
              {loading ? 'Đang tìm...' : 'Tra cứu'}
            </button>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4 mb-8">
            <p className="text-red-800 text-center font-semibold">{error}</p>
          </div>
        )}

        {/* Order Details */}
        {order && (
          <div className="space-y-6">
            {/* Status Card */}
            <div className={`${getStatusInfo(order.status).bg} rounded-2xl p-8 text-center border-2 border-${getStatusInfo(order.status).color.replace('text-', '')}`}>
              <div className={`${getStatusInfo(order.status).color} mx-auto mb-4`}>
                {getStatusInfo(order.status).icon}
              </div>
              <h2 className={`text-3xl font-black ${getStatusInfo(order.status).color} mb-2`}>
                {getStatusInfo(order.status).label}
              </h2>
              <p className="text-gray-700 text-lg">
                {getStatusInfo(order.status).desc}
              </p>
            </div>

            {/* Payment Section for Bank Transfer */}
            {order.paymentMethod === 'BANK_TRANSFER' && order.qrExpiresAt && (
              (order.status === 'CONFIRMED_AWAITING_DEPOSIT' || order.status === 'CONFIRMED') && (
                <div className="bg-white rounded-2xl shadow-lg p-6 border-2 border-amber-200">
                  <h3 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <span className="text-3xl">💳</span>
                    {order.paymentType === 'DEPOSIT' ? 'Thanh Toán Tiền Cọc' : 'Thanh Toán Đơn Hàng'}
                  </h3>
                  
                  {order.paymentType === 'DEPOSIT' ? (
                    // Deposit payment info
                    <div className="mb-6 p-4 bg-amber-50 rounded-xl border border-amber-200">
                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <div>
                          <p className="text-sm text-gray-600">Tỷ lệ cọc:</p>
                          <p className="text-xl font-bold text-gray-900">{order.depositPercentage}%</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Số tiền cần cọc:</p>
                          <p className="text-2xl font-black text-green-600">{order.depositAmount?.toLocaleString()}đ</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Còn lại khi nhận hàng:</p>
                          <p className="text-xl font-bold text-blue-600">{order.remainingAmount?.toLocaleString()}đ</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Tổng đơn hàng:</p>
                          <p className="text-xl font-bold text-gray-900">{order.netAmount.toLocaleString()}đ</p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    // Full payment info
                    <div className="mb-6 p-4 bg-green-50 rounded-xl border border-green-200">
                      <div className="text-center">
                        <p className="text-sm text-gray-600 mb-2">Số tiền cần thanh toán:</p>
                        <p className="text-4xl font-black text-green-600">{order.netAmount.toLocaleString()}đ</p>
                        <p className="text-sm text-gray-500 mt-2">Thanh toán đầy đủ đơn hàng</p>
                      </div>
                    </div>
                  )}

                  <QRPayment
                    amount={order.paymentType === 'DEPOSIT' ? (order.depositAmount || 0) : order.netAmount}
                    orderId={order.orderNumber}
                    description={order.paymentType === 'DEPOSIT' 
                      ? `Coc ${order.depositPercentage}% don hang ${order.orderNumber}`
                      : `Thanh toan don hang ${order.orderNumber}`
                    }
                    expiresAt={order.qrExpiresAt}
                  />
                </div>
              )
            )}

            {/* Order Info */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Thông Tin Đơn Hàng</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div>
                  <p className="text-sm text-gray-600">Mã đơn hàng:</p>
                  <p className="text-lg font-bold text-gray-900">{order.orderNumber}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Ngày đặt:</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {new Date(order.createdAt).toLocaleString('vi-VN')}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Khách hàng:</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {order.customerType === 'GUEST' 
                      ? order.guestName 
                      : order.customer?.user?.name || 'N/A'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Số điện thoại:</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {order.customerType === 'GUEST' 
                      ? order.guestPhone 
                      : order.customer?.user?.phone || 'N/A'}
                  </p>
                </div>
              </div>

              {/* Order Items */}
              <div className="border-t pt-4">
                <h4 className="font-bold text-gray-900 mb-3">Sản phẩm:</h4>
                <div className="space-y-2">
                  {order.orderItems.map((item) => (
                    <div key={item.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-semibold text-gray-900">{item.product.name}</p>
                        <p className="text-sm text-gray-600">Số lượng: {item.quantity}</p>
                      </div>
                      <p className="font-bold text-primary-600">{item.totalPrice.toLocaleString()}đ</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Price Summary */}
              <div className="border-t mt-4 pt-4 space-y-2">
                <div className="flex justify-between text-gray-600">
                  <span>Tạm tính:</span>
                  <span className="font-semibold">{order.totalAmount.toLocaleString()}đ</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Phí vận chuyển:</span>
                  <span className="font-semibold">{order.shippingAmount.toLocaleString()}đ</span>
                </div>
                <div className="flex justify-between text-xl font-black pt-2 border-t">
                  <span>Tổng cộng:</span>
                  <span className="text-primary-600">{order.netAmount.toLocaleString()}đ</span>
                </div>
              </div>

              {/* Deposit Info (if deposit order) */}
              {order.paymentType === 'DEPOSIT' && (
                <div className="mt-4 pt-4 border-t bg-yellow-50 -mx-6 -mb-6 px-6 py-4 rounded-b-2xl">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Đã thanh toán:</p>
                      <p className="text-lg font-bold text-green-600">
                        {order.status === 'DEPOSIT_PAID' || order.status === 'PROCESSING' || order.status === 'SHIPPED' || order.status === 'DELIVERED'
                          ? `${order.depositAmount?.toLocaleString()}đ (Cọc ${order.depositPercentage}%)`
                          : '0đ'}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Còn phải trả:</p>
                      <p className="text-lg font-bold text-blue-600">
                        {order.status === 'DEPOSIT_PAID' || order.status === 'PROCESSING' || order.status === 'SHIPPED' || order.status === 'DELIVERED'
                          ? `${order.remainingAmount?.toLocaleString()}đ`
                          : `${order.netAmount.toLocaleString()}đ`}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-200">
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={async () => {
                    try {
                      const response = await fetch(`/api/orders/${order.id}/invoice`)
                      if (response.ok) {
                        const blob = await response.blob()
                        const url = window.URL.createObjectURL(blob)
                        const a = document.createElement('a')
                        a.href = url
                        a.download = `hoa-don-${order.orderNumber}.pdf`
                        document.body.appendChild(a)
                        a.click()
                        window.URL.revokeObjectURL(url)
                        document.body.removeChild(a)
                      } else {
                        alert('Không thể tải hóa đơn. Vui lòng thử lại.')
                      }
                    } catch (error) {
                      console.error('Error downloading invoice:', error)
                      alert('Lỗi khi tải hóa đơn')
                    }
                  }}
                  className="flex-1 bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700 transition-colors font-semibold flex items-center justify-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Tải Hóa Đơn PDF
                </button>
                <button
                  onClick={() => {
                    if (navigator.clipboard) {
                      navigator.clipboard.writeText(order.orderNumber)
                      alert(`Đã sao chép mã đơn: ${order.orderNumber}`)
                    }
                  }}
                  className="flex-1 bg-gray-100 text-gray-900 px-6 py-3 rounded-lg hover:bg-gray-200 transition-colors font-semibold flex items-center justify-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  Sao Chép Mã Đơn
                </button>
              </div>
            </div>

            {/* Support */}
            <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
              <p className="text-sm text-blue-900 text-center">
                ℹ️ Cần hỗ trợ? Vui lòng liên hệ: <strong>hotline@smartbuild.com</strong> hoặc <strong>1900-xxxx</strong>
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default function OrderTrackingPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <Header />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <p className="text-gray-600">Đang tải...</p>
          </div>
        </div>
      </div>
    }>
      <OrderTrackingContent />
    </Suspense>
  )
}
