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
  Package
} from 'lucide-react'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import toast, { Toaster } from 'react-hot-toast'

// Dynamically import QRPayment to avoid SSR issues
const QRPayment = dynamic(() => import('@/components/QRPayment'), { ssr: false })

type PaymentMethod = 'COD' | 'BANK_TRANSFER'
type PaymentType = 'FULL' | 'DEPOSIT'

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

  // Fetch contractor recommendations
  useEffect(() => {
    const fetchContractorRecs = async () => {
      if (items.length === 0) return
      setLoadingRecs(true)
      try {
        const response = await fetch('/api/recommendations/contractors', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            productNames: items.map(i => i.name),
            city: formData.city || 'all'
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

    const timer = setTimeout(fetchContractorRecs, 1000)
    return () => clearTimeout(timer)
  }, [items.length, formData.city])

  // Fetch product recommendations (ML-based)
  useEffect(() => {
    const fetchProductRecs = async () => {
      if (items.length === 0) return
      setLoadingProductRecs(true)
      try {
        const productIds = items.map(item => item.productId)
        const response = await fetch('/api/recommendations/cart', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ productIds, limit: 4 })
        })
        if (response.ok) {
          const data = await response.json()
          setProductRecs(data.data.recommendations || [])
        }
      } catch (error) {
        console.error('Failed to fetch product recs:', error)
      } finally {
        setLoadingProductRecs(false)
      }
    }

    fetchProductRecs()
  }, [items.length])

  const [paymentMethod] = useState<PaymentMethod>('BANK_TRANSFER')
  const [paymentType, setPaymentType] = useState<PaymentType>('FULL')
  const depositPercentage = 50
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
      alert(error.message || 'Có lỗi xảy ra khi đặt hàng. Vui lòng thử lại!')
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

        <h1 className="text-4xl font-black text-gray-900 mb-8">
          💳 Thanh Toán
        </h1>

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              {/* Customer Info */}
              <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
                <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                  <User className="h-6 w-6 text-primary-600" />
                  Thông Tin Khách Hàng
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Họ và Tên *</label>
                    <input type="text" name="fullName" value={formData.fullName} onChange={handleInputChange} className={`w-full border-2 ${errors.fullName ? 'border-red-500' : 'border-gray-300'} rounded-lg px-4 py-3 focus:border-primary-500 transition-all outline-none text-gray-900`} placeholder="Nguyễn Văn A" />
                    {errors.fullName && <p className="text-red-500 text-sm mt-1">{errors.fullName}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Email *</label>
                    <input type="email" name="email" value={formData.email} onChange={handleInputChange} className={`w-full border-2 ${errors.email ? 'border-red-500' : 'border-gray-300'} rounded-lg px-4 py-3 focus:border-primary-500 transition-all outline-none text-gray-900`} placeholder="email@example.com" />
                    {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Số Điện Thoại *</label>
                    <input type="tel" name="phone" value={formData.phone} onChange={handleInputChange} className={`w-full border-2 ${errors.phone ? 'border-red-500' : 'border-gray-300'} rounded-lg px-4 py-3 focus:border-primary-500 transition-all outline-none text-gray-900`} placeholder="0123456789" />
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
                  <input type="text" name="address" value={formData.address} onChange={handleInputChange} className={`w-full border-2 ${errors.address ? 'border-red-500' : 'border-gray-300'} rounded-lg px-4 py-3 focus:border-primary-500 transition-all outline-none text-gray-900`} placeholder="Số nhà, tên đường..." />
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <input type="text" name="ward" value={formData.ward} onChange={handleInputChange} className="w-full border-2 border-gray-300 rounded-lg px-4 py-3 outline-none text-gray-900" placeholder="Phường/Xã" />
                    <input type="text" name="district" value={formData.district} onChange={handleInputChange} className="w-full border-2 border-gray-300 rounded-lg px-4 py-3 outline-none text-gray-900" placeholder="Quận/Huyện" />
                    <input type="text" name="city" value={formData.city} onChange={handleInputChange} className={`w-full border-2 ${errors.city ? 'border-red-500' : 'border-gray-300'} rounded-lg px-4 py-3 outline-none text-gray-900`} placeholder="Tỉnh/Thành Phố *" />
                  </div>
                  <textarea name="notes" value={formData.notes} onChange={handleInputChange} rows={3} className="w-full border-2 border-gray-300 rounded-lg px-4 py-3 outline-none text-gray-900" placeholder="Ghi chú đơn hàng..." />
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
                  <div className="flex items-center justify-center py-10"><Loader2 className="h-8 w-8 animate-spin text-primary-200" /></div>
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
              {productRecs.length > 0 && (
                <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100 mt-8">
                  <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-amber-500" />
                    Có Thể Bạn Đang Thiếu?
                  </h2>
                  <p className="text-xs text-gray-500 mb-4 px-1 italic">Hệ thống ML gợi ý các vật tư thường mua cùng để tiết kiệm phí vận chuyển</p>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {productRecs.map((p: any) => (
                      <div key={p.id} className="group border border-gray-100 rounded-xl p-3 hover:border-primary-200 hover:shadow-md transition-all bg-slate-50/30">
                        <div className="relative aspect-square rounded-lg overflow-hidden mb-2 bg-white">
                          {p.images?.[0] ? (
                            <Image src={p.images[0]} alt={p.name} fill className="object-cover group-hover:scale-110 transition-transform" />
                          ) : (
                            <Package className="h-8 w-8 text-gray-200 m-auto mt-6" />
                          )}
                        </div>
                        <h4 className="text-[10px] font-bold text-gray-900 line-clamp-2 h-6 mb-1">{p.name}</h4>
                        <p className="text-xs font-black text-primary-600 mb-2">{p.price.toLocaleString()}đ</p>
                        <button
                          type="button"
                          onClick={() => {
                            addItem({
                              id: p.id,
                              productId: p.id,
                              name: p.name,
                              price: p.price,
                              quantity: 1,
                              image: p.images?.[0] || '',
                              sku: p.id.slice(0, 8).toUpperCase(),
                              unit: p.unit
                            });
                            toast.success(`Đã thêm ${p.name} vào đơn hàng`);
                          }}
                          className="w-full py-1.5 bg-white border border-primary-200 text-primary-600 rounded-lg text-[10px] font-black hover:bg-primary-600 hover:text-white transition-all"
                        >
                          + THÊM
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Right Column - Summary */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-2xl shadow-xl p-6 sticky top-24 border-2 border-primary-100">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Đơn Hàng</h2>
                <div className="space-y-3 mb-6 max-h-64 overflow-y-auto">
                  {items.map((item) => (
                    <div key={item.productId} className="flex justify-between text-sm">
                      <div className="flex-1"><p className="font-semibold text-gray-900">{item.name}</p><p className="text-gray-500">{item.quantity} x {item.price.toLocaleString()}đ</p></div>
                      <p className="font-semibold text-gray-900">{(item.price * item.quantity).toLocaleString()}đ</p>
                    </div>
                  ))}
                </div>
                <div className="border-t pt-4 space-y-2">
                  <div className="flex justify-between text-gray-600"><span>Tạm tính</span><span>{totalPrice.toLocaleString()}đ</span></div>
                  <div className="flex justify-between text-gray-600"><span>Vận chuyển</span><span>{shippingFee.toLocaleString()}đ</span></div>

                  {/* Selected Contractor Preview */}
                  {selectedContractorId && (() => {
                    const contractor = contractorRecs.find(c => c.id === selectedContractorId);
                    return contractor ? (
                      <div className="flex justify-between text-indigo-600 font-medium py-1">
                        <span className="flex items-center gap-1"><Building size={14} /> {contractor.displayName}</span>
                        <span className="text-xs italic bg-indigo-50 px-2 py-0.5 rounded">Báo giá sau</span>
                      </div>
                    ) : null;
                  })()}

                  <div className="border-t pt-2 flex justify-between text-xl font-black"><span>Tổng cộng</span><span className="text-primary-600">{finalTotal.toLocaleString()}đ</span></div>
                </div>
                <button type="submit" disabled={isProcessing} className="w-full mt-6 bg-primary-600 text-white py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-2 shadow-lg disabled:opacity-50">
                  {isProcessing ? <><Loader2 className="h-5 w-5 animate-spin" /> Đang xử lý...</> : <><CheckCircle size={20} /> Đặt Hàng</>}
                </button>
                <Link href="/cart" className="w-full mt-3 bg-white text-gray-700 py-3 rounded-xl border-2 border-slate-200 font-semibold text-center flex items-center justify-center gap-2"><ArrowLeft size={18} /> Quay Lại</Link>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
