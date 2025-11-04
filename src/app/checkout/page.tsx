'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useCartStore } from '@/stores/cartStore'
import { useAuth } from '@/contexts/auth-context'
import Header from '@/components/Header'
import { 
  CreditCard, 
  Truck, 
  MapPin, 
  User, 
  Phone, 
  Mail,
  Building,
  ArrowLeft,
  CheckCircle,
  Loader2
} from 'lucide-react'
import Link from 'next/link'
import dynamic from 'next/dynamic'

// Dynamically import QRPayment to avoid SSR issues
const QRPayment = dynamic(() => import('@/components/QRPayment'), { ssr: false })

type PaymentMethod = 'COD' | 'BANK_TRANSFER'
type PaymentType = 'FULL' | 'DEPOSIT'
type DepositPercentage = 30 | 40 | 50

export default function CheckoutPage() {
  const router = useRouter()
  const { items, getTotalPrice, clearCart } = useCartStore()
  const { user, isAuthenticated } = useAuth()
  const [isProcessing, setIsProcessing] = useState(false)
  
  // Form state
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    district: '',
    ward: '',
    notes: '',
  })

  // Auto-fill form when user is logged in
  useEffect(() => {
    if (isAuthenticated && user) {
      setFormData(prev => ({
        ...prev,
        fullName: user.name || prev.fullName,
        email: user.email || prev.email,
        phone: user.phone || prev.phone,
        address: user.address || prev.address,
      }))
    }
  }, [isAuthenticated, user])

  const [paymentMethod] = useState<PaymentMethod>('BANK_TRANSFER') // Auto set to bank transfer
  const [paymentType, setPaymentType] = useState<PaymentType>('FULL')
  const depositPercentage = 50 // Fixed at 50%
  const [errors, setErrors] = useState<Record<string, string>>({})

  const shippingFee = items.length > 0 ? 50000 : 0
  const totalPrice = getTotalPrice()
  const finalTotal = totalPrice + shippingFee
  
  // Calculate deposit amounts
  const depositAmount = paymentType === 'DEPOSIT' 
    ? Math.round(finalTotal * (depositPercentage / 100)) 
    : finalTotal
  const remainingAmount = paymentType === 'DEPOSIT' 
    ? finalTotal - depositAmount 
    : 0

  const validateForm = () => {
    const newErrors: Record<string, string> = {}
    
    if (!formData.fullName.trim()) newErrors.fullName = 'Vui lòng nhập họ tên'
    if (!formData.email.trim()) newErrors.email = 'Vui lòng nhập email'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Email không hợp lệ'
    }
    if (!formData.phone.trim()) newErrors.phone = 'Vui lòng nhập số điện thoại'
    else if (!/^[0-9]{10}$/.test(formData.phone.replace(/\s/g, ''))) {
      newErrors.phone = 'Số điện thoại không hợp lệ'
    }
    if (!formData.address.trim()) newErrors.address = 'Vui lòng nhập địa chỉ'
    if (!formData.city.trim()) newErrors.city = 'Vui lòng nhập tỉnh/thành phố'
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (items.length === 0) {
      alert('Giỏ hàng trống!')
      return
    }

    if (!validateForm()) {
      return
    }

    setIsProcessing(true)

    try {
      // Create order - handle both guest and logged-in users
      const orderData = {
        customerType: isAuthenticated && user ? 'REGISTERED' : 'GUEST',
        guestName: formData.fullName,
        guestEmail: formData.email,
        guestPhone: formData.phone,
        items: items.map(item => ({
          productId: item.productId,
          quantity: item.quantity,
          unitPrice: item.price,
          totalPrice: item.price * item.quantity
        })),
        shippingAddress: {
          address: formData.address,
          city: formData.city,
          district: formData.district,
          ward: formData.ward,
        },
        notes: formData.notes,
        paymentMethod: paymentMethod,
        paymentType: paymentType,
        depositPercentage: paymentType === 'DEPOSIT' ? depositPercentage : null,
        depositAmount: paymentType === 'DEPOSIT' ? depositAmount : null,
        remainingAmount: paymentType === 'DEPOSIT' ? remainingAmount : null,
        totalAmount: totalPrice,
        shippingAmount: shippingFee,
        netAmount: finalTotal,
      }

      // Prepare headers - include auth token if user is logged in
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      }
      
      // Add auth token for logged-in users
      if (isAuthenticated && typeof window !== 'undefined') {
        const token = sessionStorage.getItem('access_token')
        if (token) {
          headers['Authorization'] = `Bearer ${token}`
        }
      }

      const response = await fetch('/api/orders', {
        method: 'POST',
        headers,
        body: JSON.stringify(orderData),
      })

      const result = await response.json()

      if (response.ok && result.success) {
        // Redirect to order tracking page
        clearCart()
        router.push(`/order-tracking?orderId=${result.data.id}`)
      } else {
        throw new Error(result.error?.message || 'Đặt hàng thất bại')
      }
    } catch (error: any) {
      alert(error.message || 'Có lỗi xảy ra khi đặt hàng. Vui lòng thử lại!')
    } finally {
      setIsProcessing(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }))
    }
  }

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <Header />
        <div className="max-w-4xl mx-auto px-4 py-20 text-center">
          <div className="bg-white rounded-3xl shadow-xl p-16">
            <CreditCard className="h-32 w-32 text-gray-300 mx-auto mb-6" />
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Giỏ hàng trống
            </h2>
            <p className="text-gray-600 mb-8 text-lg">
              Vui lòng thêm sản phẩm vào giỏ hàng trước khi thanh toán
            </p>
            <Link
              href="/products"
              className="inline-flex items-center gap-2 bg-primary-600 text-white px-8 py-4 rounded-xl hover:bg-primary-700 transition-colors font-bold shadow-lg"
            >
              <ArrowLeft className="h-5 w-5" />
              Quay Lại Mua Sắm
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <Header />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-gray-600 mb-8">
          <Link href="/" className="hover:text-primary-600">Trang chủ</Link>
          <span>/</span>
          <Link href="/cart" className="hover:text-primary-600">Giỏ hàng</Link>
          <span>/</span>
          <span className="text-gray-900 font-semibold">Thanh toán</span>
        </div>

        {/* Page Title */}
        <h1 className="text-4xl font-black text-gray-900 mb-8">
          💳 Thanh Toán
        </h1>

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column - Forms */}
            <div className="lg:col-span-2 space-y-6">
              {/* Customer Information */}
              <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                    <User className="h-6 w-6 text-primary-600" />
                    Thông Tin Khách Hàng
                  </h2>
                  {isAuthenticated && user && (
                    <div className="flex items-center gap-2 bg-green-100 text-green-800 px-4 py-2 rounded-lg">
                      <CheckCircle className="h-4 w-4" />
                      <span className="text-sm font-semibold">Đã đăng nhập</span>
                    </div>
                  )}
                </div>
                
                {isAuthenticated && user && (
                  <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-sm text-blue-900">
                      ℹ️ Thông tin đã được tự động điền từ tài khoản của bạn. Bạn có thể chỉnh sửa nếu muốn giao hàng đến địa chỉ khác.
                    </p>
                  </div>
                )}

                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Họ và Tên *
                    </label>
                    <input
                      type="text"
                      name="fullName"
                      value={formData.fullName}
                      onChange={handleInputChange}
                      className={`w-full border-2 ${errors.fullName ? 'border-red-500' : 'border-gray-300'} rounded-lg px-4 py-3 focus:border-primary-500 focus:ring-2 focus:ring-primary-200 transition-all outline-none text-gray-900`}
                      placeholder="Nguyễn Văn A"
                    />
                    {errors.fullName && <p className="text-red-500 text-sm mt-1">{errors.fullName}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Email *
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className={`w-full border-2 ${errors.email ? 'border-red-500' : 'border-gray-300'} rounded-lg px-4 py-3 focus:border-primary-500 focus:ring-2 focus:ring-primary-200 transition-all outline-none text-gray-900`}
                      placeholder="email@example.com"
                    />
                    {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Số Điện Thoại *
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      className={`w-full border-2 ${errors.phone ? 'border-red-500' : 'border-gray-300'} rounded-lg px-4 py-3 focus:border-primary-500 focus:ring-2 focus:ring-primary-200 transition-all outline-none text-gray-900`}
                      placeholder="0123456789"
                    />
                    {errors.phone && <p className="text-red-500 text-sm mt-1">{errors.phone}</p>}
                  </div>
                </div>
              </div>

              {/* Shipping Address */}
              <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
                <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                  <MapPin className="h-6 w-6 text-primary-600" />
                  Địa Chỉ Giao Hàng
                </h2>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Địa Chỉ Chi Tiết *
                    </label>
                    <input
                      type="text"
                      name="address"
                      value={formData.address}
                      onChange={handleInputChange}
                      className={`w-full border-2 ${errors.address ? 'border-red-500' : 'border-gray-300'} rounded-lg px-4 py-3 focus:border-primary-500 focus:ring-2 focus:ring-primary-200 transition-all outline-none text-gray-900`}
                      placeholder="Số nhà, tên đường..."
                    />
                    {errors.address && <p className="text-red-500 text-sm mt-1">{errors.address}</p>}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Phường/Xã
                      </label>
                      <input
                        type="text"
                        name="ward"
                        value={formData.ward}
                        onChange={handleInputChange}
                        className="w-full border-2 border-gray-300 rounded-lg px-4 py-3 focus:border-primary-500 focus:ring-2 focus:ring-primary-200 transition-all outline-none text-gray-900"
                        placeholder="Phường 1"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Quận/Huyện
                      </label>
                      <input
                        type="text"
                        name="district"
                        value={formData.district}
                        onChange={handleInputChange}
                        className="w-full border-2 border-gray-300 rounded-lg px-4 py-3 focus:border-primary-500 focus:ring-2 focus:ring-primary-200 transition-all outline-none text-gray-900"
                        placeholder="Quận 1"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Tỉnh/Thành Phố *
                      </label>
                      <input
                        type="text"
                        name="city"
                        value={formData.city}
                        onChange={handleInputChange}
                        className={`w-full border-2 ${errors.city ? 'border-red-500' : 'border-gray-300'} rounded-lg px-4 py-3 focus:border-primary-500 focus:ring-2 focus:ring-primary-200 transition-all outline-none text-gray-900`}
                        placeholder="TP. Hồ Chí Minh"
                      />
                      {errors.city && <p className="text-red-500 text-sm mt-1">{errors.city}</p>}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Ghi Chú Đơn Hàng
                    </label>
                    <textarea
                      name="notes"
                      value={formData.notes}
                      onChange={handleInputChange}
                      rows={3}
                      className="w-full border-2 border-gray-300 rounded-lg px-4 py-3 focus:border-primary-500 focus:ring-2 focus:ring-primary-200 transition-all outline-none text-gray-900"
                      placeholder="Ghi chú về đơn hàng (tùy chọn)..."
                    />
                  </div>
                </div>
              </div>

              {/* Payment Type Selection */}
              <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
                <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <CreditCard className="h-6 w-6 text-primary-600" />
                  Loại Thanh Toán
                </h2>
                
                {/* Bank Transfer Notice */}
                <div className="mb-6 p-4 bg-green-50 border-2 border-green-200 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Building className="h-5 w-5 text-green-600" />
                    <span className="font-bold text-green-900">Phương thức: Chuyển khoản ngân hàng</span>
                  </div>
                  <p className="text-sm text-green-800">
                    Tất cả đơn hàng sẽ được thanh toán qua chuyển khoản ngân hàng. Bạn sẽ nhận mã QR thanh toán sau khi đặt hàng.
                  </p>
                </div>
                
                <div className="space-y-3 mb-6">
                  {/* Full Payment */}
                  <label className={`flex items-center p-4 border-2 rounded-xl cursor-pointer transition-all ${paymentType === 'FULL' ? 'border-primary-600 bg-primary-50' : 'border-gray-300 hover:border-primary-300'}`}>
                    <input
                      type="radio"
                      name="paymentType"
                      value="FULL"
                      checked={paymentType === 'FULL'}
                      onChange={(e) => setPaymentType(e.target.value as PaymentType)}
                      className="w-5 h-5 text-primary-600"
                    />
                    <div className="ml-4 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-gray-900">💰 Thanh toán đầy đủ</span>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">
                        Thanh toán toàn bộ giá trị đơn hàng: <span className="font-bold text-primary-600">{finalTotal.toLocaleString()}đ</span>
                      </p>
                    </div>
                  </label>

                  {/* Deposit Payment */}
                  <label className={`flex items-center p-4 border-2 rounded-xl cursor-pointer transition-all ${paymentType === 'DEPOSIT' ? 'border-primary-600 bg-primary-50' : 'border-gray-300 hover:border-primary-300'}`}>
                    <input
                      type="radio"
                      name="paymentType"
                      value="DEPOSIT"
                      checked={paymentType === 'DEPOSIT'}
                      onChange={(e) => setPaymentType(e.target.value as PaymentType)}
                      className="w-5 h-5 text-primary-600"
                    />
                    <div className="ml-4 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-gray-900">🏦 Đặt cọc trước</span>
                        <span className="bg-yellow-100 text-yellow-800 text-xs font-bold px-2 py-1 rounded">
                          KHUYẾN NGHỊ ĐƠN LỚN
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">
                        Chỉ cần thanh toán trước một phần, phần còn lại khi nhận hàng
                      </p>
                    </div>
                  </label>

                  {/* Deposit Info - Fixed 50% */}
                  {paymentType === 'DEPOSIT' && (
                    <div className="ml-6 p-4 bg-blue-50 rounded-xl border-2 border-blue-200">
                      <div className="text-center mb-4">
                        <p className="text-sm font-semibold text-gray-900 mb-2">Tỷ lệ đặt cọc:</p>
                        <div className="inline-flex items-center justify-center p-4 bg-primary-100 border-2 border-primary-600 rounded-lg">
                          <span className="text-4xl font-black text-primary-600">50%</span>
                        </div>
                        <p className="text-xs text-gray-600 mt-2">
                          {Math.round(finalTotal * 0.5).toLocaleString()}đ
                        </p>
                      </div>
                      
                      {/* Deposit Summary */}
                      <div className="mt-4 p-3 bg-white rounded-lg border border-gray-200 space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Cần thanh toán trước:</span>
                          <span className="font-bold text-green-600">{depositAmount.toLocaleString()}đ</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Thanh toán khi nhận hàng:</span>
                          <span className="font-bold text-blue-600">{remainingAmount.toLocaleString()}đ</span>
                        </div>
                      </div>
                      
                      <div className="mt-3 p-3 bg-green-50 rounded-lg border border-green-200">
                        <p className="text-xs text-green-900">
                          <strong>💡 Lưu ý:</strong> Sau khi admin xác nhận đơn hàng, bạn có thể quay lại trang tra cứu đơn hàng để thanh toán tiền cọc qua QR code.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>


            </div>

            {/* Right Column - Order Summary */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-2xl shadow-xl p-6 sticky top-24 border-2 border-primary-100">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">
                  Đơn Hàng Của Bạn
                </h2>

                {/* Order Items */}
                <div className="space-y-3 mb-6 max-h-64 overflow-y-auto">
                  {items.map((item) => (
                    <div key={item.productId} className="flex gap-3 text-sm">
                      <div className="flex-1">
                        <p className="font-semibold text-gray-900">{item.name}</p>
                        <p className="text-gray-500">SL: {item.quantity} x {item.price.toLocaleString()}đ</p>
                      </div>
                      <p className="font-semibold text-gray-900">
                        {(item.price * item.quantity).toLocaleString()}đ
                      </p>
                    </div>
                  ))}
                </div>

                <div className="border-t pt-4 space-y-3">
                  <div className="flex justify-between text-gray-600">
                    <span>Tạm tính:</span>
                    <span className="font-semibold">{totalPrice.toLocaleString()}đ</span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>Phí vận chuyển:</span>
                    <span className="font-semibold">{shippingFee.toLocaleString()}đ</span>
                  </div>
                  <div className="border-t pt-3 flex justify-between text-xl font-black">
                    <span>Tổng cộng:</span>
                    <span className="text-primary-600">{finalTotal.toLocaleString()}đ</span>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isProcessing}
                  className="w-full mt-6 bg-gradient-to-r from-primary-600 to-secondary-600 text-white py-4 rounded-xl hover:from-primary-700 hover:to-secondary-700 transition-all duration-300 font-bold text-lg flex items-center justify-center gap-2 shadow-lg hover:shadow-2xl disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      Đang xử lý...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-5 w-5" />
                      Đặt Hàng
                    </>
                  )}
                </button>

                <Link
                  href="/cart"
                  className="w-full mt-3 bg-white text-gray-700 py-3 rounded-xl border-2 border-gray-300 hover:bg-gray-50 transition-colors font-semibold text-center flex items-center justify-center gap-2"
                >
                  <ArrowLeft className="h-5 w-5" />
                  Quay Lại Giỏ Hàng
                </Link>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
