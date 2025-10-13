'use client'

import { useState, useEffect } from 'react'
import { use } from 'react'
import Header from '@/components/Header'
import Link from 'next/link'
import { ArrowLeft, Package, MapPin, CreditCard, Truck, Calendar, Clock, CheckCircle } from 'lucide-react'
import Image from 'next/image'

interface OrderDetail {
  id: string
  orderNumber: string
  status: string
  paymentStatus: string
  paymentMethod: string
  totalAmount: number
  shippingAmount: number
  netAmount: number
  guestName?: string
  guestEmail?: string
  guestPhone?: string
  shippingAddress: any
  notes?: string
  createdAt: string
  orderItems: Array<{
    id: string
    quantity: number
    unitPrice: number
    totalPrice: number
    product: {
      id: string
      name: string
      sku: string
      images: string[]
    }
  }>
}

export default function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params)
  const [order, setOrder] = useState<OrderDetail | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchOrderDetail()
  }, [resolvedParams.id])

  const fetchOrderDetail = async () => {
    try {
      const response = await fetch(`/api/orders/${resolvedParams.id}`)
      const result = await response.json()
      
      if (response.ok && result.success) {
        setOrder(result.data)
      }
    } catch (error) {
      console.error('Failed to fetch order:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusSteps = () => {
    const allSteps = [
      { key: 'PENDING', label: 'Chờ xác nhận', icon: Clock },
      { key: 'CONFIRMED', label: 'Đã xác nhận', icon: CheckCircle },
      { key: 'PROCESSING', label: 'Đang chuẩn bị', icon: Package },
      { key: 'SHIPPED', label: 'Đang giao', icon: Truck },
      { key: 'DELIVERED', label: 'Đã giao', icon: CheckCircle },
    ]

    const currentIndex = allSteps.findIndex(step => step.key === order?.status)
    
    return allSteps.map((step, index) => ({
      ...step,
      completed: index <= currentIndex,
      current: index === currentIndex
    }))
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <Header />
        <div className="max-w-7xl mx-auto px-4 py-20 text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary-600 mx-auto"></div>
          <p className="text-gray-600 mt-4">Đang tải...</p>
        </div>
      </div>
    )
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <Header />
        <div className="max-w-4xl mx-auto px-4 py-20 text-center">
          <Package className="h-24 w-24 text-gray-300 mx-auto mb-6" />
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Không Tìm Thấy Đơn Hàng</h2>
          <Link href="/account/orders" className="text-primary-600 hover:underline font-semibold">
            Quay lại danh sách đơn hàng
          </Link>
        </div>
      </div>
    )
  }

  const steps = getStatusSteps()

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <Header />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Back Button */}
        <Link
          href="/account/orders"
          className="inline-flex items-center gap-2 text-gray-600 hover:text-primary-600 mb-6 font-semibold"
        >
          <ArrowLeft className="h-5 w-5" />
          Quay lại danh sách đơn hàng
        </Link>

        {/* Order Header */}
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-6 border-2 border-primary-100">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-black text-gray-900 mb-2">
                Đơn Hàng: {order.orderNumber}
              </h1>
              <p className="text-gray-600">
                Đặt ngày {new Date(order.createdAt).toLocaleDateString('vi-VN', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </p>
            </div>
          </div>
        </div>

        {/* Order Progress */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-6 border border-gray-100">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Trạng Thái Đơn Hàng</h2>
          <div className="relative">
            {/* Progress Line */}
            <div className="absolute top-6 left-0 right-0 h-1 bg-gray-200">
              <div
                className="h-full bg-primary-600 transition-all duration-500"
                style={{ width: `${(steps.filter(s => s.completed).length - 1) / (steps.length - 1) * 100}%` }}
              ></div>
            </div>

            {/* Steps */}
            <div className="relative flex justify-between">
              {steps.map((step, index) => (
                <div key={step.key} className="flex flex-col items-center">
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center mb-2 transition-all ${
                      step.completed
                        ? 'bg-primary-600 text-white'
                        : 'bg-gray-200 text-gray-400'
                    } ${step.current ? 'ring-4 ring-primary-200 scale-110' : ''}`}
                  >
                    <step.icon className="h-6 w-6" />
                  </div>
                  <span className={`text-sm font-semibold text-center max-w-[100px] ${
                    step.completed ? 'text-gray-900' : 'text-gray-500'
                  }`}>
                    {step.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Order Items */}
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Sản Phẩm</h2>
              <div className="space-y-4">
                {order.orderItems.map((item) => (
                  <div key={item.id} className="flex gap-4 p-4 bg-gray-50 rounded-xl border border-gray-200">
                    <div className="relative w-24 h-24 bg-white rounded-lg overflow-hidden flex-shrink-0 border">
                      {item.product.images?.[0] ? (
                        <Image
                          src={item.product.images[0]}
                          alt={item.product.name}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
                          <Package className="h-8 w-8 text-gray-400" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <Link
                        href={`/products/${item.product.id}`}
                        className="font-bold text-gray-900 hover:text-primary-600 transition-colors"
                      >
                        {item.product.name}
                      </Link>
                      <p className="text-sm text-gray-500 mt-1">SKU: {item.product.sku}</p>
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-gray-600">x{item.quantity}</span>
                        <span className="font-bold text-primary-600">
                          {item.totalPrice.toLocaleString()}đ
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Order Info Sidebar */}
          <div className="space-y-6">
            {/* Customer Info */}
            <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
              <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                <MapPin className="h-5 w-5 text-primary-600" />
                Thông Tin Giao Hàng
              </h3>
              <div className="space-y-2 text-sm">
                <p className="font-semibold text-gray-900">{order.guestName}</p>
                <p className="text-gray-600">{order.guestPhone}</p>
                <p className="text-gray-600">{order.guestEmail}</p>
                <div className="pt-2 mt-2 border-t">
                  <p className="text-gray-700">
                    {order.shippingAddress?.address}, {order.shippingAddress?.ward && `${order.shippingAddress.ward}, `}
                    {order.shippingAddress?.district && `${order.shippingAddress.district}, `}
                    {order.shippingAddress?.city}
                  </p>
                </div>
              </div>
            </div>

            {/* Payment Info */}
            <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
              <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-primary-600" />
                Thanh Toán
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Tạm tính:</span>
                  <span className="font-semibold">{order.totalAmount.toLocaleString()}đ</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Phí vận chuyển:</span>
                  <span className="font-semibold">{order.shippingAmount.toLocaleString()}đ</span>
                </div>
                <div className="border-t pt-3 flex justify-between">
                  <span className="font-bold text-gray-900">Tổng cộng:</span>
                  <span className="text-xl font-black text-primary-600">
                    {order.netAmount.toLocaleString()}đ
                  </span>
                </div>
                <div className="pt-3 border-t">
                  <p className="text-sm text-gray-600">
                    <span className="font-semibold">Phương thức:</span>{' '}
                    {order.paymentMethod === 'COD' && 'Thanh toán khi nhận hàng'}
                    {order.paymentMethod === 'VNPAY' && 'VNPay'}
                    {order.paymentMethod === 'MOMO' && 'Ví MoMo'}
                    {order.paymentMethod === 'BANK_TRANSFER' && 'Chuyển khoản'}
                  </p>
                  <p className="text-sm mt-2">
                    <span className="font-semibold">Trạng thái:</span>{' '}
                    <span className={`${
                      order.paymentStatus === 'PAID' ? 'text-green-600' : 'text-yellow-600'
                    } font-semibold`}>
                      {order.paymentStatus === 'PAID' ? 'Đã thanh toán' : 'Chưa thanh toán'}
                    </span>
                  </p>
                </div>
              </div>
            </div>

            {/* Notes */}
            {order.notes && (
              <div className="bg-blue-50 rounded-2xl p-6 border-2 border-blue-200">
                <h3 className="font-bold text-gray-900 mb-2">Ghi chú</h3>
                <p className="text-sm text-gray-700">{order.notes}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
