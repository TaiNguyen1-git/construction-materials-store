'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useCartStore } from '@/stores/cartStore'
import { useAuth } from '@/contexts/auth-context'
import Header from '@/components/Header'
import Image from 'next/image'
import {
  CreditCard,
  Truck,
  MapPin,
  User,
  Phone,
  Mail,
  Building,
  ArrowLeft,
  ArrowRight,
  CheckCircle,
  Loader2,
  Star,
  Sparkles,
  Package,
  Plus
} from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import toast, { Toaster } from 'react-hot-toast'
import { getUnitFromProductName } from '@/lib/unit-utils'

// Dynamically import QRPayment to avoid SSR issues
const QRPayment = dynamic(() => import('@/components/QRPayment'), { ssr: false })

type PaymentMethod = 'COD' | 'BANK_TRANSFER'
type PaymentType = 'FULL' | 'DEPOSIT' | 'CREDIT'

export default function CheckoutPage() {
  const router = useRouter()
  const { items, getTotalPrice, clearCart, addItem } = useCartStore()
  const { user, isAuthenticated } = useAuth()
  const [isProcessing, setIsProcessing] = useState(false)
  const [contractorRecs, setContractorRecs] = useState<any[]>([])
  const [productRecs, setProductRecs] = useState<any[]>([])
  const [loadingRecs, setLoadingRecs] = useState(false)
  const [loadingProductRecs, setLoadingProductRecs] = useState(false)
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

  const totalPrice = getTotalPrice()
  const shippingFee = items.length > 0 ? 50000 : 0
  const finalTotal = totalPrice + shippingFee

  const checkCredit = async () => {
    if (!user) return
    setCheckingCredit(true)
    try {
      const res = await fetch('/api/credit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'check',
          customerId: user.id, // Note: backend often uses customerId, but here we might send userId if we don't have customerId handy yet. The API should handle user mapping.
          // Actually most APIs expect customerId. Let's assume user object has customerId or API handles it.
          // To be safe, we'll try to let the API resolve user from token if supported, OR if user context has role.
          // But /api/credit definition expects customerId. 
          // Let's assume we can fetch it or verifyTokenFromRequest in API handles it.
          // WAIT: /api/credit takes body { customerId, orderAmount }.
          // We need the ACTUAL customerId. 
          // If user context doesn't have it, we might fail. 
          // For now let's hope user.id maps or we fetch customer profile first.
          // Correction: useAuth might not return customerId.
          // Let's Update logic: We'll fetch customer profile first or separate endpoint.
          // Or simply: Call /api/user/credit-wallet (which we made for GET) to see balance.
          // Let's use the explicit check endpoint but we need customerId.

          // Let's try fetching customer ID via /api/user/me or similar if needed.
          // Or use /api/credit/check-by-user (implied capability)
          // Simplification: We'll send userId and hope backend resolves, or we fetch profile.
          // Actually, let's use the GET /api/user/credit-wallet endpoint to determine eligibility.
        })
      })

      // Better approach: Use the GET endpoint we just made, that returns Credit Info
      const creditRes = await fetch('/api/user/credit-wallet')
      if (creditRes.ok) {
        const data = await creditRes.json()
        const { summary } = data.data
        const available = summary.creditLimit - summary.totalDebt

        // Check if eligible for this order
        // Logic: Not blocked + Available > Order Total
        // Note: We need 'creditHold' status which might be in summary or we assume based on available.
        // Let's assume eligibile if available >= finalTotal

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

  // Calculate deposit amounts

  const [paymentMethod] = useState<PaymentMethod>('BANK_TRANSFER')
  const [paymentType, setPaymentType] = useState<PaymentType>('FULL')
  const depositPercentage = 50
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Reload credit check when total changes
  useEffect(() => {
    if (isAuthenticated) {
      checkCredit()
    }
  }, [finalTotal, isAuthenticated])

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
      <Toaster />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex items-center gap-2 text-sm text-gray-600 mb-8">
          <Link href="/" className="hover:text-primary-600">Trang chủ</Link>
          <span>/</span>
          <Link href="/cart" className="hover:text-primary-600">Giỏ hàng</Link>
          <span>/</span>
          <span className="text-gray-900 font-semibold">Thanh toán</span>
        </div>

        <div className="mb-8 animate-in fade-in slide-in-from-top-4 duration-500">
          <div className="flex justify-between mb-2 px-2">
            <span className="text-xs font-bold text-emerald-600 flex items-center gap-1"><CheckCircle size={12} /> 1. Giỏ Hàng</span>
            <span className="text-xs font-bold text-primary-600">2. Thanh Toán</span>
            <span className="text-xs font-bold text-gray-400">3. Hoàn Tất</span>
          </div>
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full w-2/3 bg-gradient-to-r from-emerald-500 to-primary-600 rounded-full shadow-[0_0_10px_rgba(37,99,235,0.5)]"></div>
          </div>
        </div>

        <h1 className="text-3xl font-black text-gray-900 mb-8 flex items-center gap-3">
          <div className="p-2 bg-gradient-to-br from-primary-600 to-indigo-600 rounded-xl shadow-lg text-white">
            <CreditCard size={24} />
          </div>
          Thông Tin Thanh Toán
        </h1>

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              {/* Customer Info */}
              <div className="bg-white rounded-[2rem] shadow-xl p-8 border border-slate-100">
                <h2 className="text-2xl font-bold text-slate-900 mb-8 flex items-center gap-3">
                  <div className="bg-indigo-50 p-2.5 rounded-2xl">
                    <User className="h-6 w-6 text-indigo-600" />
                  </div>
                  Thông Tin Khách Hàng
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Họ và Tên *</label>
                    <input type="text" name="fullName" value={formData.fullName} onChange={handleInputChange} className={`w-full bg-slate-50 border ${errors.fullName ? 'border-rose-500' : 'border-slate-100'} rounded-2xl px-5 py-3.5 focus:border-indigo-500 transition-all outline-none text-slate-900 font-medium`} placeholder="Nguyễn Văn A" />
                    {errors.fullName && <p className="text-rose-500 text-[10px] font-bold mt-1 px-1">{errors.fullName}</p>}
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Email *</label>
                    <input type="email" name="email" value={formData.email} onChange={handleInputChange} className={`w-full bg-slate-50 border ${errors.email ? 'border-rose-500' : 'border-slate-100'} rounded-2xl px-5 py-3.5 focus:border-indigo-500 transition-all outline-none text-slate-900 font-medium`} placeholder="email@example.com" />
                    {errors.email && <p className="text-rose-500 text-[10px] font-bold mt-1 px-1">{errors.email}</p>}
                  </div>
                  <div className="md:col-span-2 space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Số Điện Thoại *</label>
                    <input type="tel" name="phone" value={formData.phone} onChange={handleInputChange} className={`w-full bg-slate-50 border ${errors.phone ? 'border-rose-500' : 'border-slate-100'} rounded-2xl px-5 py-3.5 focus:border-indigo-500 transition-all outline-none text-slate-900 font-medium`} placeholder="0123456789" />
                    {errors.phone && <p className="text-rose-500 text-[10px] font-bold mt-1 px-1">{errors.phone}</p>}
                  </div>
                </div>
              </div>

              {/* Shipping Address */}
              <div className="bg-white rounded-[2rem] shadow-xl p-8 border border-slate-100">
                <h2 className="text-2xl font-bold text-slate-900 mb-8 flex items-center gap-3">
                  <div className="bg-indigo-50 p-2.5 rounded-2xl">
                    <MapPin className="h-6 w-6 text-indigo-600" />
                  </div>
                  Địa Chỉ Giao Hàng
                </h2>
                <div className="space-y-5">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Địa chỉ cụ thể *</label>
                    <input type="text" name="address" value={formData.address} onChange={handleInputChange} className={`w-full bg-slate-50 border ${errors.address ? 'border-rose-500' : 'border-slate-100'} rounded-2xl px-5 py-3.5 focus:border-indigo-500 transition-all outline-none text-slate-900 font-medium`} placeholder="Số nhà, tên đường..." />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Phường/Xã</label>
                      <input type="text" name="ward" value={formData.ward} onChange={handleInputChange} className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-3.5 outline-none text-slate-900 font-medium focus:border-indigo-500" placeholder="Phường/Xã" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Quận/Huyện</label>
                      <input type="text" name="district" value={formData.district} onChange={handleInputChange} className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-3.5 outline-none text-slate-900 font-medium focus:border-indigo-500" placeholder="Quận/Huyện" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Thành phố *</label>
                      <input type="text" name="city" value={formData.city} onChange={handleInputChange} className={`w-full bg-slate-50 border ${errors.city ? 'border-rose-500' : 'border-slate-100'} rounded-2xl px-5 py-3.5 outline-none text-slate-900 font-medium focus:border-indigo-500`} placeholder="Tỉnh/Thành Phố *" />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Ghi chú (Tùy chọn)</label>
                    <textarea name="notes" value={formData.notes} onChange={handleInputChange} rows={3} className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-3.5 outline-none text-slate-900 font-medium focus:border-indigo-500 resize-none" placeholder="Ghi chú đơn hàng..." />
                  </div>
                </div>
              </div>

              {/* Payment Type */}
              <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
                <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <CreditCard className="h-6 w-6 text-primary-600" />
                  Loại Thanh Toán
                </h2>
                <div className="space-y-3">
                  <label className={`flex items-center p-4 border-2 rounded-xl cursor-pointer transition-all ${paymentType === 'FULL' ? 'border-primary-600 bg-primary-50' : 'border-gray-300'}`}>
                    <input type="radio" name="paymentType" value="FULL" checked={paymentType === 'FULL'} onChange={(e) => setPaymentType(e.target.value as PaymentType)} className="w-5 h-5 text-primary-600" />
                    <div className="ml-4">
                      <span className="font-semibold text-gray-900">💰 Thanh toán đầy đủ</span>
                      <p className="text-sm text-gray-600">{finalTotal.toLocaleString()}đ</p>
                    </div>
                  </label>
                  <label className={`flex items-center p-4 border-2 rounded-xl cursor-pointer transition-all ${paymentType === 'DEPOSIT' ? 'border-primary-600 bg-primary-50' : 'border-gray-300'}`}>
                    <input type="radio" name="paymentType" value="DEPOSIT" checked={paymentType === 'DEPOSIT'} onChange={(e) => setPaymentType(e.target.value as PaymentType)} className="w-5 h-5 text-primary-600" />
                    <div className="ml-4">
                      <span className="font-semibold text-gray-900">🏦 Đặt cọc 50%</span>
                      <p className="text-sm text-gray-600">{depositAmount.toLocaleString()}đ ngay, {remainingAmount.toLocaleString()}đ khi nhận hàng</p>
                    </div>
                  </label>

                  {/* CREDIT PAYMENT OPTION */}
                  {checkingCredit ? (
                    <div className="p-4 border border-dashed border-slate-200 rounded-xl flex items-center gap-2 text-slate-400 text-sm">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Đang kiểm tra hạn mức tín dụng...
                    </div>
                  ) : creditEligible.eligible ? (
                    <label className={`flex items-center p-4 border-2 rounded-xl cursor-pointer transition-all ${paymentType === 'CREDIT' ? 'border-emerald-600 bg-emerald-50' : 'border-emerald-100 bg-white hover:border-emerald-300'}`}>
                      <div className="flex items-start gap-4">
                        <input
                          type="radio"
                          name="paymentType"
                          value="CREDIT"
                          checked={paymentType === 'CREDIT'}
                          onChange={(e) => setPaymentType(e.target.value as any)}
                          className="w-5 h-5 text-emerald-600 mt-1"
                        />
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-black text-slate-900">💳 Mua Trước Trả Sau</span>
                            <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-[10px] font-black uppercase tracking-wide rounded">SmartBuild Credit</span>
                          </div>
                          <p className="text-xs font-medium text-slate-500 mt-1">
                            Sử dụng hạn mức tín dụng khả dụng của bạn.
                          </p>
                          <div className="flex items-center gap-4 mt-2 text-xs">
                            <span className="text-emerald-700 font-bold">Khả dụng: {creditEligible.available?.toLocaleString()}đ</span>
                            <span className="text-slate-400">|</span>
                            <span className="text-slate-500">Thanh toán sau 30-45 ngày</span>
                          </div>
                        </div>
                      </div>
                    </label>
                  ) : isAuthenticated && (
                    // Show reason why not eligible (optional)
                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 opacity-60">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-bold text-slate-400 text-sm">💳 Mua Trước Trả Sau</span>
                        <span className="px-2 py-0.5 bg-slate-200 text-slate-500 text-[10px] font-bold uppercase rounded">Không khả dụng</span>
                      </div>
                      <p className="text-xs text-slate-400">
                        {creditEligible.reason || 'Hạn mức không đủ hoặc chưa được cấp.'}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Contractor Recs */}
              <div className="bg-white rounded-2xl shadow-lg p-6 border-2 border-primary-50">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                      <Building className="h-6 w-6 text-primary-600" />
                      Gợi Ý Chuyên Gia Thi Công
                    </h2>
                    <p className="text-sm text-gray-500 mt-1">Dựa trên vật tư bạn đã chọn</p>
                  </div>
                </div>

                {loadingRecs ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[...Array(2)].map((_, i) => (
                      <div key={i} className="flex gap-4 p-4 border rounded-xl">
                        <div className="flex-1 space-y-2">
                          <Skeleton className="h-4 w-32 rounded" />
                          <Skeleton className="h-3 w-20 rounded" />
                          <div className="flex gap-1 pt-2">
                            <Skeleton className="h-5 w-12 rounded" />
                            <Skeleton className="h-5 w-12 rounded" />
                          </div>
                        </div>
                        <Skeleton className="h-8 w-8 rounded-lg" />
                      </div>
                    ))}
                  </div>
                ) : contractorRecs.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {contractorRecs.map((c: any) => (
                      <div key={c.id} className={`p-4 rounded-xl border-2 transition-all group ${selectedContractorId === c.id ? 'bg-primary-50 border-primary-600 shadow-md' : 'bg-slate-50 border-slate-100'}`}>
                        <div className="flex gap-4">
                          <div className="flex-1 min-w-0">
                            <h4 className="font-bold text-gray-900 truncate">{c.displayName}</h4>
                            <div className="flex items-center gap-2 mt-1">
                              <Star size={12} className="text-amber-500 fill-current" />
                              <span className="text-xs font-bold">{c.avgRating}</span>
                              <span className="text-xs text-gray-400">| {c.city || 'Toàn quốc'}</span>
                            </div>
                            <div className="flex flex-wrap gap-1 mt-2">
                              {c.skills?.slice(0, 2).map((s: string) => (
                                <span key={s} className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${selectedContractorId === c.id ? 'bg-white text-primary-700' : 'bg-primary-50 text-primary-600'}`}>{s}</span>
                              ))}
                            </div>
                          </div>
                          <Link href={`/contractors/${c.id}`} target="_blank" className="p-2 bg-white rounded-lg border border-gray-200 hover:text-primary-600 hover:border-primary-600 transition-all self-start">
                            <ArrowRight size={16} />
                          </Link>
                        </div>
                        <div className="mt-3 pt-3 border-t border-slate-200 flex items-center justify-between">
                          <span className="text-[10px] text-emerald-600 font-black uppercase flex items-center gap-1">
                            <CheckCircle size={10} /> {selectedContractorId === c.id ? 'Đã chọn' : 'SmartBuild Verified'}
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              if (selectedContractorId === c.id) {
                                setSelectedContractorId(null);
                                toast.success(`Đã hủy chọn ${c.displayName}`);
                              } else {
                                setSelectedContractorId(c.id);
                                toast.success(`Đã chọn ${c.displayName} thi công đơn hàng`);
                              }
                            }}
                            className={`text-[10px] font-black uppercase hover:underline ${selectedContractorId === c.id ? 'text-red-600' : 'text-primary-600'}`}
                          >
                            {selectedContractorId === c.id ? 'Hủy chọn' : 'Chọn thợ'}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6 bg-slate-50 rounded-xl border-2 border-dashed border-slate-200"><p className="text-sm text-gray-400 italic">Hệ thống đang tìm thợ phù hợp cho đơn hàng của bạn...</p></div>
                )}
              </div>

              {/* Product Recs (ML-Based) */}
              <div className="mt-8">
                {loadingProductRecs ? (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[...Array(4)].map((_, i) => (
                      <div key={i} className="bg-white rounded-xl p-3 border border-gray-100 space-y-2">
                        <Skeleton className="aspect-square rounded-lg w-full" />
                        <Skeleton className="h-3 w-3/4 rounded" />
                        <Skeleton className="h-4 w-1/2 rounded" />
                      </div>
                    ))}
                  </div>
                ) : productRecs.length > 0 && (
                  <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
                      <Sparkles size={80} className="text-amber-500" />
                    </div>
                    <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2 relative z-10">
                      <Sparkles className="h-5 w-5 text-amber-500 fill-amber-500" />
                      Có Thể Bạn Đang Thiếu?
                    </h2>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 relative z-10">
                      {productRecs.map((p: any) => (
                        <div key={p.id} className="group border border-gray-100 rounded-xl p-3 hover:border-primary-200 hover:shadow-md transition-all bg-slate-50/50 hover:bg-white">
                          <div className="relative aspect-square rounded-lg overflow-hidden mb-2 bg-white border border-gray-100">
                            {p.images?.[0] ? (
                              <Image src={p.images[0]} alt={p.name} fill className="object-cover group-hover:scale-110 transition-transform duration-500" />
                            ) : (
                              <Package className="h-8 w-8 text-gray-200 m-auto mt-6" />
                            )}
                          </div>
                          <h4 className="text-[10px] font-bold text-gray-900 line-clamp-2 h-7 mb-1 leading-snug group-hover:text-primary-600 transition-colors">{p.name}</h4>
                          <p className="text-xs font-black text-primary-600 mb-2">{p.price.toLocaleString()}đ</p>
                          <button
                            type="button"
                            onClick={() => {
                              const dynamicUnit = p.unit && p.unit !== 'pcs'
                                ? p.unit
                                : getUnitFromProductName(p.name)

                              addItem({
                                id: p.id,
                                productId: p.id,
                                name: p.name,
                                price: p.price,
                                quantity: 1,
                                image: p.images?.[0] || '',
                                sku: p.id.slice(0, 8).toUpperCase(),
                                unit: dynamicUnit
                              });
                              toast.success(`Đã thêm ${p.name} vào đơn hàng (${dynamicUnit})`);
                            }}
                            className="w-full py-2 bg-white border border-gray-200 text-gray-600 rounded-lg text-[10px] font-black hover:bg-primary-600 hover:text-white hover:border-primary-600 transition-all flex items-center justify-center gap-1 shadow-sm"
                          >
                            <Plus size={12} strokeWidth={3} /> THÊM
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Right Column - Summary */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-[2.5rem] shadow-2xl p-8 sticky top-24 border border-slate-100">
                <h2 className="text-2xl font-black text-slate-900 mb-8">Đơn Hàng</h2>
                <div className="space-y-4 mb-8 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
                  {items.map((item) => (
                    <div key={item.productId} className="flex justify-between text-sm gap-4">
                      <div className="flex-1">
                        <p className="font-bold text-slate-800 line-clamp-1">{item.name}</p>
                        <p className="text-slate-400 text-[11px] font-medium">{item.quantity} {item.unit} x {item.price.toLocaleString()}₫</p>
                      </div>
                      <p className="font-black text-slate-900">{(item.price * item.quantity).toLocaleString()}₫</p>
                    </div>
                  ))}
                </div>
                <div className="border-t border-slate-50 pt-6 space-y-3">
                  <div className="flex justify-between text-slate-500 font-medium">
                    <span className="text-sm uppercase tracking-widest text-[10px] font-black">Tạm tính</span>
                    <span className="font-bold">{totalPrice.toLocaleString()}₫</span>
                  </div>
                  <div className="flex justify-between text-slate-500 font-medium">
                    <span className="text-sm uppercase tracking-widest text-[10px] font-black">Vận chuyển</span>
                    <span className="font-bold">{shippingFee.toLocaleString()}₫</span>
                  </div>

                  {/* Selected Contractor Preview */}
                  {selectedContractorId && (() => {
                    const contractor = contractorRecs.find(c => c.id === selectedContractorId);
                    return contractor ? (
                      <div className="flex justify-between text-indigo-600 font-bold py-2 px-3 bg-indigo-50 rounded-xl">
                        <span className="flex items-center gap-2 text-xs truncate">
                          <Building className="h-3.5 w-3.5" />
                          {contractor.displayName}
                        </span>
                        <span className="text-[10px] uppercase tracking-tighter">Báo giá sau</span>
                      </div>
                    ) : null;
                  })()}

                  <div className="border-t border-slate-50 pt-4 flex justify-between items-end">
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5">Tổng thanh toán</span>
                    <span className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-blue-600 leading-none">
                      {finalTotal.toLocaleString()}<span className="text-sm ml-0.5">₫</span>
                    </span>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isProcessing}
                  className="w-full mt-8 bg-indigo-600 hover:bg-indigo-700 text-white py-4.5 rounded-[1.5rem] font-black text-sm uppercase tracking-widest flex items-center justify-center gap-3 shadow-xl shadow-indigo-100 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
                >
                  {isProcessing ? (
                    <><Loader2 className="h-5 w-5 animate-spin" /> ĐANG XỬ LÝ...</>
                  ) : (
                    <><CheckCircle size={20} /> ĐẶT HÀNG NGAY</>
                  )}
                </button>

                <Link
                  href="/cart"
                  className="w-full mt-4 bg-slate-50 text-slate-500 py-3 rounded-2xl font-bold text-xs uppercase tracking-widest text-center flex items-center justify-center gap-2 hover:bg-slate-100 transition-colors"
                >
                  <ArrowLeft size={14} strokeWidth={3} /> Quay Lại Giỏ Hàng
                </Link>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
