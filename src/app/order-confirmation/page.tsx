'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import Header from '@/components/Header'
import { CheckCircle, Package, Truck, Mail, Phone, MapPin, Calendar, CreditCard } from 'lucide-react'

interface OrderDetails {
  id: string
  orderNumber: string
  status: string
  totalAmount: number
  shippingAmount: number
  netAmount: number
  paymentMethod: string
  paymentStatus: string
  guestName: string
  guestEmail: string
  guestPhone: string
  shippingAddress: any
  createdAt: string
  items: Array<{
    productId: string
    quantity: number
    unitPrice: number
    totalPrice: number
  }>
}

function OrderConfirmationContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const orderId = searchParams.get('orderId')
  
  const [order, setOrder] = useState<OrderDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!orderId) {
      setError('Không tìm thấy thông tin đơn hàng')
      setLoading(false)
      return
    }

    fetchOrderDetails()
  }, [orderId])

  const fetchOrderDetails = async () => {
    try {
      const response = await fetch(`/api/orders/${orderId}`)
      const result = await response.json()

      if (response.ok && result.success) {
        setOrder(result.data)
      } else {
        setError('Không thể tải thông tin đơn hàng')
      }
    } catch (error) {
      setError('Đã có lỗi xảy ra')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Đang tải...</p>
        </div>
      </div>
    )
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <Header />
        <div className="max-w-2xl mx-auto px-4 py-20 text-center">
          <div className="bg-white rounded-3xl shadow-xl p-16">
            <div className="bg-red-100 rounded-full w-24 h-24 flex items-center justify-center mx-auto mb-6">
              <Package className="h-12 w-12 text-red-600" />
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Không Tìm Thấy Đơn Hàng</h2>
            <p className="text-gray-600 mb-8">{error}</p>
            <Link
              href="/"
              className="inline-block bg-primary-600 text-white px-8 py-4 rounded-xl hover:bg-primary-700 transition-colors font-bold shadow-lg"
            >
              Về Trang Chủ
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <Header />
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Success Message */}
        <div className="text-center mb-12">
          <div className="bg-gradient-to-r from-green-400 to-green-600 rounded-full w-24 h-24 flex items-center justify-center mx-auto mb-6 animate-bounce">
            <CheckCircle className="h-16 w-16 text-white" />
          </div>
          <h1 className="text-4xl font-black text-gray-900 mb-4">
            🎉 Đặt Hàng Thành Công!
          </h1>
          <p className="text-xl text-gray-600 mb-2">
            Cảm ơn bạn đã đặt hàng tại SmartBuild
          </p>
          <p className="text-lg text-gray-500">
            Mã đơn hàng: <span className="font-bold text-primary-600">{order.orderNumber}</span>
          </p>
        </div>

        {/* Order Status */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-6 border-2 border-green-100">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Trạng Thái Đơn Hàng</h2>
            <span className="bg-yellow-100 text-yellow-800 px-4 py-2 rounded-full font-bold text-sm">
              {order.status === 'PENDING' ? '⏳ Chờ xác nhận' : order.status}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex items-start gap-3">
              <div className="bg-primary-100 p-3 rounded-xl">
                <Package className="h-6 w-6 text-primary-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">Đơn hàng</p>
                <p className="font-bold text-gray-900">Đang xử lý</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="bg-blue-100 p-3 rounded-xl">
                <Truck className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">Giao hàng</p>
                <p className="font-bold text-gray-900">Đang chuẩn bị</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="bg-green-100 p-3 rounded-xl">
                <CreditCard className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">Thanh toán</p>
                <p className="font-bold text-gray-900">
                  {order.paymentStatus === 'PAID' ? 'Đã thanh toán' : 'Chưa thanh toán'}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Customer Info */}
          <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Thông Tin Khách Hàng</h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="bg-gray-100 p-2 rounded-lg">
                  <Mail className="h-4 w-4 text-gray-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Tên</p>
                  <p className="font-semibold text-gray-900">{order.guestName}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="bg-gray-100 p-2 rounded-lg">
                  <Mail className="h-4 w-4 text-gray-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Email</p>
                  <p className="font-semibold text-gray-900">{order.guestEmail}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="bg-gray-100 p-2 rounded-lg">
                  <Phone className="h-4 w-4 text-gray-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Số điện thoại</p>
                  <p className="font-semibold text-gray-900">{order.guestPhone}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Shipping Address */}
          <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Địa Chỉ Giao Hàng</h3>
            <div className="flex items-start gap-3">
              <div className="bg-gray-100 p-2 rounded-lg">
                <MapPin className="h-4 w-4 text-gray-600" />
              </div>
              <div>
                <p className="font-semibold text-gray-900 mb-1">
                  {order.shippingAddress?.address}
                </p>
                <p className="text-gray-600">
                  {order.shippingAddress?.ward && `${order.shippingAddress.ward}, `}
                  {order.shippingAddress?.district && `${order.shippingAddress.district}, `}
                  {order.shippingAddress?.city}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Order Summary */}
        <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100">
          <h3 className="text-xl font-bold text-gray-900 mb-4">Chi Tiết Đơn Hàng</h3>
          
          <div className="border-t border-gray-200 pt-4 space-y-3">
            <div className="flex justify-between text-gray-600">
              <span>Tạm tính:</span>
              <span className="font-semibold">{order.totalAmount.toLocaleString()}đ</span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>Phí vận chuyển:</span>
              <span className="font-semibold">{order.shippingAmount.toLocaleString()}đ</span>
            </div>
            <div className="border-t border-gray-200 pt-3 flex justify-between text-xl font-black">
              <span>Tổng cộng:</span>
              <span className="text-primary-600">{order.netAmount.toLocaleString()}đ</span>
            </div>
          </div>

          <div className="mt-6 bg-blue-50 border-2 border-blue-200 rounded-xl p-4">
            <p className="text-sm text-blue-900">
              <span className="font-bold">Phương thức thanh toán:</span>{' '}
              {order.paymentMethod === 'COD' && 'Thanh toán khi nhận hàng (COD)'}
              {order.paymentMethod === 'VNPAY' && 'VNPay'}
              {order.paymentMethod === 'MOMO' && 'Ví MoMo'}
              {order.paymentMethod === 'BANK_TRANSFER' && 'Chuyển khoản ngân hàng'}
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/products"
            className="bg-primary-600 text-white px-8 py-4 rounded-xl hover:bg-primary-700 transition-colors font-bold text-center shadow-lg hover:shadow-xl"
          >
            Tiếp Tục Mua Sắm
          </Link>
          <Link
            href="/"
            className="bg-white text-gray-700 px-8 py-4 rounded-xl border-2 border-gray-300 hover:bg-gray-50 transition-colors font-bold text-center"
          >
            Về Trang Chủ
          </Link>
        </div>

        {/* Additional Info */}
        <div className="mt-8 bg-gradient-to-r from-green-50 to-blue-50 border-2 border-green-200 rounded-2xl p-6">
          <h4 className="font-bold text-gray-900 mb-3 text-lg">📧 Thông Tin Quan Trọng</h4>
          <ul className="space-y-2 text-gray-700">
            <li className="flex items-start gap-2">
              <span className="text-green-600 font-bold">✓</span>
              <span>Chúng tôi đã gửi email xác nhận đơn hàng đến <strong>{order.guestEmail}</strong></span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-600 font-bold">✓</span>
              <span>Đơn hàng sẽ được giao trong vòng 2-3 ngày làm việc</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-600 font-bold">✓</span>
              <span>Bạn có thể theo dõi đơn hàng qua email hoặc số điện thoại đã đăng ký</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-600 font-bold">✓</span>
              <span>Liên hệ hotline: <strong>1900-xxxx</strong> nếu cần hỗ trợ</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  )
}

export default function OrderConfirmationPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Đang tải...</p>
        </div>
      </div>
    }>
      <OrderConfirmationContent />
    </Suspense>
  )
}
