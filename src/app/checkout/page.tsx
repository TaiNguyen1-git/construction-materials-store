'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useCartStore } from '@/stores/cartStore'
import { useAuth } from '@/contexts/auth-context'
import Header from '@/components/Header'
import Image from 'next/image'
import {
  CreditCard,
  MapPin,
  User,
  ArrowLeft,
  Loader2,
  ShieldCheck,
  ShoppingBag,
  Ticket,
  X
} from 'lucide-react'
import Link from 'next/link'
import toast, { Toaster } from 'react-hot-toast'

type PaymentMethod = 'COD' | 'BANK_TRANSFER'
type PaymentType = 'FULL' | 'DEPOSIT' | 'CREDIT'

export default function CheckoutPage() {
  const router = useRouter()
  const { items, getTotalPrice, clearCart } = useCartStore()
  const { user, isAuthenticated } = useAuth()
  const [isProcessing, setIsProcessing] = useState(false)
  const [selectedContractorId, setSelectedContractorId] = useState<string | null>(null)

  // Credit Check State
  const [checkingCredit, setCheckingCredit] = useState(false)
  const [creditEligible, setCreditEligible] = useState<{ eligible: boolean, available?: number, reason?: string }>({ eligible: false })

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

      // Check credit eligibility
      checkCredit()
    }
  }, [isAuthenticated, user])

  const [promoCode, setPromoCode] = useState('')
  const [isApplyingPromo, setIsApplyingPromo] = useState(false)
  const [appliedPromotion, setAppliedPromotion] = useState<{ id: string, code: string, discountAmount: number } | null>(null)

  const handleApplyPromo = async () => {
    if (!promoCode.trim()) return
    setIsApplyingPromo(true)
    try {
      const res = await fetch('/api/promotions/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: promoCode, orderAmount: totalPrice })
      })
      const data = await res.json()
      if (data.success) {
        setAppliedPromotion(data.data)
        toast.success(`Áp dụng mã ${data.data.code} thành công!`)
      } else {
        toast.error(data.message)
      }
    } catch (err) {
      toast.error('Lỗi khi áp dụng mã')
    } finally {
      setIsApplyingPromo(false)
    }
  }

  const removePromo = () => {
    setAppliedPromotion(null)
    setPromoCode('')
  }

  const totalPrice = getTotalPrice()
  const shippingFee = (items.length > 0 && totalPrice < 5000000) ? 50000 : 0
  const discountAmount = appliedPromotion ? appliedPromotion.discountAmount : 0
  const finalTotal = totalPrice + shippingFee - discountAmount

  const checkCredit = async () => {
    if (!user) return
    setCheckingCredit(true)
    try {
      const creditRes = await fetch('/api/user/credit-wallet')
      if (creditRes.ok) {
        const data = await creditRes.json()
        const { summary } = data.data
        const available = summary.creditLimit - summary.totalDebt
        const isEligible = available >= finalTotal
        setCreditEligible({
          eligible: isEligible,
          available,
          reason: isEligible ? undefined : `Hạn mức khả dụng (${available.toLocaleString()}đ) không đủ thanh toán đơn hàng này.`
        })
      }
    } catch (err) {
      console.error(err)
    } finally {
      setCheckingCredit(false)
    }
  }

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('COD')
  const [paymentType, setPaymentType] = useState<PaymentType>('FULL')
  const depositPercentage = 50
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Reload credit check when total changes
  useEffect(() => {
    if (isAuthenticated) {
      checkCredit()
    }
  }, [finalTotal, isAuthenticated])

  useEffect(() => {
    if (paymentMethod === 'COD' && paymentType !== 'FULL') {
      setPaymentType('FULL')
    }
  }, [paymentMethod, paymentType])

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

    if (totalPrice < 500000) {
      toast.error('Đơn hàng chưa đạt mức tối thiểu 500.000đ. Vui lòng quay lại giỏ hàng mua thêm.')
      return
    }

    if (!validateForm()) {
      return
    }

    setIsProcessing(true)

    try {
      const orderData = {
        customerType: isAuthenticated && user ? 'REGISTERED' : 'GUEST',
        guestName: formData.fullName,
        guestEmail: formData.email,
        guestPhone: formData.phone,
        items: items.map(item => {
          const isWholesale = item.wholesalePrice && item.minWholesaleQty && item.quantity >= item.minWholesaleQty;
          const actualPrice = isWholesale ? item.wholesalePrice! : item.price;
          return {
            productId: item.productId,
            quantity: item.quantity,
            unitPrice: actualPrice,
            totalPrice: actualPrice * item.quantity,
            selectedUnit: item.selectedUnit || null,
            conversionFactor: item.conversionFactor || 1
          }
        }),
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
        discountAmount: discountAmount,
        promotionId: appliedPromotion?.id || null,
        netAmount: finalTotal,
        selectedContractorId: selectedContractorId
      }

      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      }

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
        clearCart()
        router.push(`/order-tracking?orderId=${result.data.id}`)
      } else {
        throw new Error(result.error?.message || 'Đặt hàng thất bại')
      }
    } catch (error: any) {
      toast.error(error.message || 'Có lỗi xảy ra khi đặt hàng. Vui lòng thử lại!')
    } finally {
      setIsProcessing(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }))
    }
  }

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-neutral-50">
        <Header />
        <div className="max-w-4xl mx-auto px-4 py-20 text-center">
            <div className="bg-white rounded-2xl shadow-sm p-16 border border-neutral-200">
              <ShoppingBag className="h-20 w-20 text-neutral-100 mx-auto mb-6" />
              <h2 className="text-2xl font-bold text-neutral-900 mb-2">Giỏ hàng trống</h2>
              <p className="text-neutral-500 mb-10">Vui lòng thêm sản phẩm vào giỏ hàng trước khi thanh toán</p>
              <Link
                href="/products"
                className="inline-flex items-center gap-2 bg-primary-600 text-white px-10 py-4 rounded-xl font-bold transition-all hover:bg-primary-700"
              >
                <ArrowLeft size={18} /> Quay lại cửa hàng
              </Link>
            </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      <Header />
      <Toaster />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <nav className="flex items-center gap-2 text-xs font-medium text-neutral-400 mb-8">
          <Link href="/" className="hover:text-primary-600 transition-colors">Trang chủ</Link>
          <span className="text-neutral-300">/</span>
          <Link href="/cart" className="hover:text-primary-600 transition-colors">Giỏ hàng</Link>
          <span className="text-neutral-300">/</span>
          <span className="text-neutral-900">Thanh toán</span>
        </nav>

        <div className="flex items-center gap-4 mb-10">
          <div className="p-3 bg-primary-600 rounded-xl text-white shadow-sm">
            <CreditCard size={24} />
          </div>
          <h1 className="text-3xl font-bold text-neutral-900">Thông tin thanh toán</h1>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            <div className="lg:col-span-2 space-y-8">
              {/* Customer Info */}
              <div className="bg-white rounded-2xl shadow-sm p-8 border border-neutral-200">
                <h2 className="text-lg font-bold text-neutral-900 mb-8 border-b border-neutral-50 pb-4 flex items-center gap-3">
                  <User size={20} className="text-primary-600" /> Thông tin liên hệ
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider">Họ và tên *</label>
                    <input name="fullName" value={formData.fullName} onChange={handleInputChange} className={`w-full bg-neutral-50 border ${errors.fullName ? 'border-red-500' : 'border-neutral-200'} rounded-xl px-5 py-3 text-sm focus:border-primary-500 transition-all outline-none`} placeholder="Nhập họ và tên" />
                    {errors.fullName && <p className="text-red-500 text-[10px] font-bold mt-1 px-1">{errors.fullName}</p>}
                  </div>
                  <div className="space-y-2">
                    <label className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider">Địa chỉ Email *</label>
                    <input name="email" value={formData.email} onChange={handleInputChange} className={`w-full bg-neutral-50 border ${errors.email ? 'border-red-500' : 'border-neutral-200'} rounded-xl px-5 py-3 text-sm focus:border-primary-500 transition-all outline-none`} placeholder="email@example.com" />
                    {errors.email && <p className="text-red-500 text-[10px] font-bold mt-1 px-1">{errors.email}</p>}
                  </div>
                  <div className="md:col-span-2 space-y-2">
                    <label className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider">Số điện thoại *</label>
                    <input name="phone" value={formData.phone} onChange={handleInputChange} className={`w-full bg-neutral-50 border ${errors.phone ? 'border-red-500' : 'border-neutral-200'} rounded-xl px-5 py-3 text-sm focus:border-primary-500 transition-all outline-none`} placeholder="0123 456 789" />
                    {errors.phone && <p className="text-red-500 text-[10px] font-bold mt-1 px-1">{errors.phone}</p>}
                  </div>
                </div>
              </div>

              {/* Shipping Address */}
              <div className="bg-white rounded-2xl shadow-sm p-8 border border-neutral-200">
                <h2 className="text-lg font-bold text-neutral-900 mb-8 border-b border-neutral-50 pb-4 flex items-center gap-3">
                  <MapPin size={20} className="text-primary-600" /> Địa chỉ giao hàng
                </h2>
                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider">Địa chỉ cụ thể *</label>
                    <input name="address" value={formData.address} onChange={handleInputChange} className={`w-full bg-neutral-50 border ${errors.address ? 'border-red-500' : 'border-neutral-200'} rounded-xl px-5 py-3 text-sm focus:border-primary-500 transition-all outline-none`} placeholder="Số nhà, tên đường..." />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <label className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider">Phường / Xã</label>
                      <input name="ward" value={formData.ward} onChange={handleInputChange} className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-5 py-3 text-sm outline-none focus:border-primary-500" placeholder="Phường/Xã" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider">Quận / Huyện</label>
                      <input name="district" value={formData.district} onChange={handleInputChange} className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-5 py-3 text-sm outline-none focus:border-primary-500" placeholder="Quận/Huyện" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider">Thành phố *</label>
                      <input name="city" value={formData.city} onChange={handleInputChange} className={`w-full bg-neutral-50 border ${errors.city ? 'border-red-500' : 'border-neutral-200'} rounded-xl px-5 py-3 text-sm outline-none focus:border-primary-500`} placeholder="Tỉnh/Thành phố" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider">Ghi chú (Tùy chọn)</label>
                    <textarea name="notes" value={formData.notes} onChange={handleInputChange} rows={3} className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-5 py-3 text-sm outline-none focus:border-primary-500 resize-none" placeholder="Lưu ý cho đội ngũ vận chuyển..." />
                  </div>
                </div>
              </div>

              {/* Payment Methods */}
              <div className="bg-white rounded-2xl shadow-sm p-8 border border-neutral-200">
                <h2 className="text-lg font-bold text-neutral-900 mb-8 border-b border-neutral-50 pb-4 flex items-center gap-3">
                  <CreditCard size={20} className="text-primary-600" /> Phương thức và loại thanh toán
                </h2>
                
                <div className="space-y-8">
                  <div className="space-y-4">
                    <h3 className="text-xs font-bold text-neutral-400 uppercase tracking-widest">Phương thức thanh toán</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <label className={`flex items-center p-5 border rounded-xl cursor-pointer transition-all ${paymentMethod === 'COD' ? 'border-primary-600 bg-primary-50/30' : 'bg-white border-neutral-200 hover:border-primary-200'}`}>
                        <input type="radio" name="paymentMethod" value="COD" checked={paymentMethod === 'COD'} onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)} className="w-4 h-4 text-primary-600" />
                        <div className="ml-4">
                          <span className="font-bold text-neutral-900 block text-sm">Thanh toán khi nhận hàng (COD)</span>
                        </div>
                      </label>
                      <label className={`flex items-center p-5 border rounded-xl cursor-pointer transition-all ${paymentMethod === 'BANK_TRANSFER' ? 'border-primary-600 bg-primary-50/30' : 'bg-white border-neutral-200 hover:border-primary-200'}`}>
                        <input type="radio" name="paymentMethod" value="BANK_TRANSFER" checked={paymentMethod === 'BANK_TRANSFER'} onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)} className="w-4 h-4 text-primary-600" />
                        <div className="ml-4">
                          <span className="font-bold text-neutral-900 block text-sm">Chuyển khoản ngân hàng</span>
                        </div>
                      </label>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-xs font-bold text-neutral-400 uppercase tracking-widest">Loại thanh toán</h3>
                    <div className="grid grid-cols-1 gap-3">
                      <label className={`flex items-center p-4 border rounded-xl cursor-pointer transition-all ${paymentType === 'FULL' ? 'border-primary-600 bg-primary-50/30' : 'border-neutral-200 hover:border-primary-200'}`}>
                        <input type="radio" name="paymentType" value="FULL" checked={paymentType === 'FULL'} onChange={(e) => setPaymentType(e.target.value as PaymentType)} className="w-4 h-4 text-primary-600" />
                        <div className="ml-4 flex-1">
                          <div className="flex justify-between items-center">
                            <span className="font-bold text-neutral-800 text-sm">Thanh toán đầy đủ (100%)</span>
                            <span className="text-sm font-bold text-primary-600">{finalTotal.toLocaleString()}đ</span>
                          </div>
                        </div>
                      </label>

                      {paymentMethod !== 'COD' && (
                        <>
                          <label className={`flex items-center p-4 border rounded-xl cursor-pointer transition-all ${paymentType === 'DEPOSIT' ? 'border-primary-600 bg-primary-50/30' : 'border-neutral-200 hover:border-primary-200'}`}>
                            <input type="radio" name="paymentType" value="DEPOSIT" checked={paymentType === 'DEPOSIT'} onChange={(e) => setPaymentType(e.target.value as PaymentType)} className="w-4 h-4 text-primary-600" />
                            <div className="ml-4 flex-1">
                              <div className="flex justify-between items-center mb-1">
                                <span className="font-bold text-neutral-800 text-sm">Đặt cọc 50%</span>
                                <span className="text-sm font-bold text-primary-600">{depositAmount.toLocaleString()}đ</span>
                              </div>
                              <p className="text-[11px] text-neutral-500 font-medium">Bạn thanh toán {remainingAmount.toLocaleString()}đ còn lại khi nhận hàng</p>
                            </div>
                          </label>

                          {checkingCredit ? (
                            <div className="p-4 bg-neutral-50 border border-neutral-100 rounded-xl flex items-center gap-2 text-neutral-400 text-xs">
                              <Loader2 className="w-3 h-3 animate-spin" /> Kiểm tra tín dụng...
                            </div>
                          ) : creditEligible.eligible ? (
                            <label className={`flex items-center p-4 border rounded-xl cursor-pointer transition-all ${paymentType === 'CREDIT' ? 'border-primary-600 bg-primary-50/30' : 'border-neutral-200 hover:border-primary-200'}`}>
                                <input type="radio" name="paymentType" value="CREDIT" checked={paymentType === 'CREDIT'} onChange={(e) => setPaymentType(e.target.value as PaymentType)} className="w-4 h-4 text-primary-600" />
                                <div className="ml-4 flex-1">
                                  <div className="flex justify-between items-center">
                                    <span className="font-bold text-neutral-800 text-sm">Mua trước trả sau (SmartBuild Credit)</span>
                                    <span className="text-xs font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded border border-green-100 uppercase">Khả dụng</span>
                                  </div>
                                  <p className="text-[11px] text-neutral-500 mt-1 font-medium italic">Hạn mức khả dụng: {creditEligible.available?.toLocaleString()}đ</p>
                                </div>
                            </label>
                          ) : isAuthenticated && (
                            <div className="p-4 bg-neutral-50 border border-neutral-100 rounded-xl opacity-60">
                                <div className="flex justify-between items-center">
                                  <span className="text-xs font-bold text-neutral-400">Mua trước trả sau</span>
                                  <span className="text-[10px] font-bold text-neutral-400 uppercase">Không đủ điều kiện</span>
                                </div>
                                <p className="text-[10px] text-neutral-400 mt-1 font-medium">{creditEligible.reason || 'Hạn mức không đủ để thanh toán'}</p>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Order Summary Sidebar */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-2xl shadow-sm border border-neutral-200 p-8 sticky top-24">
                <h2 className="text-lg font-bold text-neutral-900 mb-6 pb-4 border-b border-neutral-100">Đơn hàng của bạn</h2>
                
                <div className="space-y-4 mb-8 max-h-[40vh] overflow-y-auto pr-2 custom-scrollbar">
                  {items.map((item) => {
                    const isWholesale = item.wholesalePrice && item.minWholesaleQty && item.quantity >= item.minWholesaleQty;
                    const actualPrice = isWholesale ? item.wholesalePrice! : item.price;
                    return (
                      <div key={item.productId} className="flex gap-4">
                        <div className="w-14 h-14 bg-neutral-50 rounded-lg border border-neutral-100 flex-shrink-0 relative overflow-hidden">
                          {item.image && <Image src={item.image} alt={item.name} fill className="object-cover" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-neutral-900 line-clamp-1">{item.name}</p>
                          <p className="text-[10px] text-neutral-400 font-medium mt-1">
                            {item.quantity / (item.conversionFactor || 1)} {item.selectedUnit || item.unit} x {(actualPrice * (item.conversionFactor || 1)).toLocaleString()}đ
                          </p>
                        </div>
                        <p className="text-xs font-bold text-neutral-900">{(actualPrice * item.quantity).toLocaleString()}đ</p>
                      </div>
                    )
                  })}
                </div>

                {/* Voucher Section */}
                <div className="py-6 border-t border-neutral-100">
                  <div className="flex items-center gap-2 mb-3">
                    <Ticket size={16} className="text-primary-600" />
                    <span className="text-xs font-bold text-neutral-900 uppercase tracking-wider">Mã giảm giá</span>
                  </div>
                  {!appliedPromotion ? (
                    <div className="flex gap-2">
                       <input 
                         type="text" 
                         value={promoCode}
                         onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                         placeholder="Nhập mã ưu đãi..."
                         className="flex-1 bg-neutral-50 border border-neutral-200 rounded-xl px-4 py-2.5 text-xs outline-none focus:border-primary-500 font-bold"
                       />
                       <button 
                         type="button"
                         onClick={handleApplyPromo}
                         disabled={isApplyingPromo || !promoCode}
                         className="bg-neutral-900 text-white px-4 py-2.5 rounded-xl text-xs font-bold hover:bg-black transition-all disabled:opacity-50"
                       >
                         {isApplyingPromo ? <Loader2 size={16} className="animate-spin" /> : 'Áp dụng'}
                       </button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between bg-primary-50 border border-primary-200 rounded-xl p-3">
                      <div className="flex items-center gap-2">
                        <div className="bg-white p-1.5 rounded-lg shadow-sm">
                          <Ticket size={14} className="text-primary-600" />
                        </div>
                        <span className="text-sm font-black text-primary-700">{appliedPromotion.code}</span>
                      </div>
                      <button 
                        type="button"
                        onClick={removePromo}
                        className="text-primary-400 hover:text-red-500 transition-colors"
                      >
                        <X size={18} />
                      </button>
                    </div>
                  )}
                </div>

                <div className="space-y-3 pt-6 border-t border-neutral-100 mb-10">
                  <div className="flex justify-between text-xs font-medium text-neutral-500">
                    <span>Tạm tính</span>
                    <span className="text-neutral-900">{totalPrice.toLocaleString()}đ</span>
                  </div>
                  <div className="flex justify-between text-xs font-medium text-neutral-500">
                    <span>Phí vận chuyển</span>
                    <span className="text-neutral-900">{shippingFee.toLocaleString()}đ</span>
                  </div>
                  {appliedPromotion && (
                    <div className="flex justify-between text-xs font-bold text-green-600">
                      <span>Giảm giá ({appliedPromotion.code})</span>
                      <span>-{appliedPromotion.discountAmount.toLocaleString()}đ</span>
                    </div>
                  )}
                  <div className="pt-4 mt-2 border-t border-dashed border-neutral-200 flex justify-between items-baseline">
                    <span className="text-sm font-bold text-neutral-900">Tổng cộng</span>
                    <span className="text-2xl font-bold text-primary-600">{finalTotal.toLocaleString()}đ</span>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isProcessing}
                  className="w-full h-14 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-bold text-sm shadow-md shadow-primary-100 transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isProcessing ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Xác nhận đặt hàng'}
                </button>

                <Link
                  href="/cart"
                  className="w-full mt-4 h-12 flex items-center justify-center text-xs font-semibold text-neutral-400 hover:text-primary-600 transition-colors"
                >
                  <ArrowLeft size={14} className="mr-2" /> Quay lại giỏ hàng
                </Link>

                {/* Secure Badge */}
                <div className="mt-8 flex items-center justify-center gap-2 text-neutral-100">
                  <ShieldCheck size={16} className="text-neutral-300" />
                  <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Thanh toán bảo mật an toàn</span>
                </div>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
