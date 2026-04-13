'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useCartStore } from '@/stores/cartStore'
import Header from '@/components/Header'
import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import {
  ShoppingBag,
  Plus,
  Minus,
  Trash2,
  ArrowLeft,
  ArrowRight,
  Package,
  Truck,
  CreditCard,
  Star,
  Sparkles,
  FileText,
  Building,
  CheckCircle,
  Clock,
  ShieldCheck,
  Loader2,
  ChevronDown,
  Gift
} from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import toast from 'react-hot-toast'

interface Recommendation {
  id: string
  name: string
  price: number
  unit: string
  images: string[]
  category: string
  inStock: boolean
  rating: number
  reviewCount: number
  reason: string
  badge: string
}

export default function CartPage() {
  const router = useRouter()
  const { items, updateQuantity, removeItem, clearCart, getTotalPrice, addItem } = useCartStore()
  const [isProcessing, setIsProcessing] = useState(false)
  const [recommendations, setRecommendations] = useState<Recommendation[]>([])
  const [loadingRecommendations, setLoadingRecommendations] = useState(false)
  const [showShippingRates, setShowShippingRates] = useState(false)

  const [voucherCode, setVoucherCode] = useState('')
  const [isApplyingVoucher, setIsApplyingVoucher] = useState(false)
  const { voucher, setVoucher } = useCartStore()

  const totalPrice = getTotalPrice()
  const shippingFee = (items.length > 0 && totalPrice < 5000000) ? 50000 : 0
  const discountAmount = voucher ? voucher.discountAmount : 0
  const finalTotal = Math.max(0, totalPrice + shippingFee - discountAmount)

  const handleApplyVoucher = async () => {
    if (!voucherCode) return
    setIsApplyingVoucher(true)
    try {
      const res = await fetch('/api/promotions/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: voucherCode, orderAmount: totalPrice })
      })
      const data = await res.json()
      if (data.success) {
        setVoucher(data.data)
        toast.success(`Đã áp dụng mã ${data.data.code}`)
        setVoucherCode('')
      } else {
        toast.error(data.error?.message || 'Mã không hợp lệ')
      }
    } catch (err) {
      toast.error('Lỗi khi kiểm tra mã')
    } finally {
      setIsApplyingVoucher(false)
    }
  }

  const handleRemoveVoucher = () => {
    setVoucher(null)
    toast.success('Đã gỡ mã giảm giá')
  }

  useEffect(() => {
    if (items.length > 0) {
      fetchRecommendations()
    } else {
      setRecommendations([])
    }
  }, [items.length])

  const fetchRecommendations = async () => {
    try {
      setLoadingRecommendations(true)
      const productIds = items.map(item => item.productId)
      const response = await fetch('/api/recommendations/cart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productIds, limit: 8 })
      })
      if (response.ok) {
        const data = await response.json()
        setRecommendations(data.data.recommendations || [])
      }
    } catch (error) {
      console.error('Failed to fetch recommendations:', error)
    } finally {
      setLoadingRecommendations(false)
    }
  }

  const handleAddToCart = (product: Recommendation) => {
    addItem({
      id: product.id,
      productId: product.id,
      name: product.name,
      price: product.price,
      quantity: 1,
      image: product.images[0] || '',
      sku: product.id.slice(0, 8).toUpperCase(),
      unit: product.unit
    })
    toast.success('Đã thêm vào giỏ hàng')
  }

  const handleCheckout = async () => {
    if (items.length === 0) return
    if (totalPrice < 500000) {
      toast.error('Đơn hàng chưa đạt mức tối thiểu 500.000đ')
      return
    }
    setIsProcessing(true)
    await new Promise(resolve => setTimeout(resolve, 800))
    router.push('/checkout')
  }

  const handleExportQuote = () => {
    const doc = new jsPDF()
    doc.setFontSize(22)
    doc.setTextColor(59, 130, 246)
    doc.text("SMARTBUILD - BAO GIA", 105, 20, { align: 'center' })
    const tableColumn = ["STT", "TEN SAN PHAM", "DON VI", "SL", "DON GIA", "THANH TIEN"]
    const tableRows = items.map((item, index) => {
      const isWholesale = item.wholesalePrice && item.minWholesaleQty && item.quantity >= item.minWholesaleQty
      const unitPrice = isWholesale ? item.wholesalePrice! : item.price
      const displayUnit = item.selectedUnit || item.unit
      const factor = item.conversionFactor || 1
      const displayQuantity = item.quantity / factor
      
      return [
        index + 1,
        item.name.normalize("NFD").replace(/[\u0300-\u036f]/g, ""),
        displayUnit.normalize("NFD").replace(/[\u0300-\u036f]/g, ""),
        displayQuantity,
        (unitPrice * factor).toLocaleString('vi-VN'),
        (unitPrice * item.quantity).toLocaleString('vi-VN')
      ]
    })
    autoTable(doc, { head: [tableColumn], body: tableRows, startY: 45, theme: 'grid' })
    doc.save(`Bao_Gia_${Date.now()}.pdf`)
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      <Header />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 pb-24">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-xs font-medium text-neutral-400 mb-8">
          <Link href="/" className="hover:text-primary-600 transition-colors">Trang chủ</Link>
          <span className="text-neutral-300">/</span>
          <span className="text-neutral-900">Giỏ hàng của bạn</span>
        </nav>

        {/* Header Section */}
        <div className="flex items-center justify-between mb-10 pb-6 border-b border-neutral-200">
            <div>
              <h1 className="text-3xl font-bold text-neutral-900 mb-2">Giỏ hàng</h1>
              <p className="text-sm text-neutral-500 font-medium">
                {items.length > 0 ? `Bạn đang có ${items.length} sản phẩm trong giỏ hàng` : 'Giỏ hàng của bạn đang trống'}
              </p>
            </div>
            {items.length > 0 && (
              <button 
                onClick={clearCart} 
                className="text-xs font-semibold text-red-500 hover:text-red-700 transition-colors flex items-center gap-2"
              >
                <Trash2 size={14} /> Xóa tất cả
              </button>
            )}
        </div>

        {items.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm border border-neutral-200 p-20 text-center">
            <div className="w-20 h-20 bg-neutral-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <ShoppingBag className="h-8 w-8 text-neutral-200" />
            </div>
            <h2 className="text-xl font-bold text-neutral-900 mb-2">Giỏ hàng đang trống</h2>
            <p className="text-neutral-500 mb-8 text-sm">Hãy khám phá các vật liệu chất lượng cho dự án của bạn.</p>
            <Link 
              href="/products" 
              className="inline-flex items-center gap-2 bg-primary-600 text-white px-8 py-3.5 rounded-xl text-sm font-bold shadow-sm hover:bg-primary-700 transition-all hover:scale-[1.02] active:scale-95"
            >
              <ArrowLeft size={16} /> Quay lại cửa hàng
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-4">
              {items.map((item) => (
                <div 
                  key={item.productId} 
                  className="bg-white rounded-2xl shadow-sm p-5 flex gap-6 border border-neutral-200 hover:border-primary-200 transition-all group"
                >
                  <div className="relative w-28 h-28 bg-neutral-50 rounded-xl overflow-hidden shrink-0 border border-neutral-100">
                    {item.image ? (
                      <Image src={item.image} alt={item.name} fill className="object-cover" />
                    ) : (
                      <Package className="h-8 w-8 text-neutral-200 m-auto mt-10" />
                    )}
                  </div>
                  
                  <div className="flex-1 flex flex-col justify-between">
                    <div className="flex justify-between items-start gap-4">
                      <div>
                        <h3 className="text-lg font-bold text-neutral-900 group-hover:text-primary-600 transition-colors line-clamp-1">{item.name}</h3>
                        <p className="text-[11px] text-neutral-400 font-bold uppercase tracking-wider mt-1">{item.sku || 'SKU: N/A'}</p>
                      </div>
                      <button 
                        onClick={() => { removeItem(item.productId); toast.success('Đã xóa sản phẩm') }} 
                        className="p-2 text-neutral-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>

                    <div className="flex justify-between items-end">
                      <div className="flex items-center h-10 bg-neutral-50 rounded-lg border border-neutral-200 overflow-hidden">
                        <button 
                          onClick={() => updateQuantity(item.productId, item.quantity - (item.conversionFactor || 1))} 
                          className="w-10 h-full flex items-center justify-center text-neutral-400 hover:text-primary-600 hover:bg-neutral-100 transition-all font-bold"
                        >
                          -
                        </button>
                        <div className="w-10 text-center flex flex-col items-center">
                          <span className="font-bold text-sm text-neutral-800">
                            {item.conversionFactor ? Math.round(item.quantity / item.conversionFactor) : item.quantity}
                          </span>
                        </div>
                        <button 
                          onClick={() => updateQuantity(item.productId, item.quantity + (item.conversionFactor || 1))} 
                          className="w-10 h-full flex items-center justify-center text-neutral-400 hover:text-primary-600 hover:bg-neutral-100 transition-all font-bold"
                        >
                          +
                        </button>
                        <span className="pr-3 text-[10px] font-bold text-neutral-400 uppercase">{item.selectedUnit || item.unit}</span>
                      </div>
                      
                      <div className="text-right">
                        {(() => {
                          const isWholesale = item.wholesalePrice && item.minWholesaleQty && item.quantity >= item.minWholesaleQty;
                          const actualPrice = isWholesale ? item.wholesalePrice! : item.price;
                          return (
                            <>
                              <div className="text-xl font-bold text-primary-600">{(actualPrice * item.quantity).toLocaleString()}đ</div>
                              {isWholesale && <span className="text-[10px] font-bold text-green-600 bg-green-50 px-1.5 py-0.5 rounded border border-green-100 uppercase tracking-tighter">Giá sỉ</span>}
                            </>
                          );
                        })()}
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {/* Recommendations - Clean Grid */}
              <div className="mt-16 pt-10 border-t border-neutral-200">
                <h2 className="text-sm font-bold text-neutral-400 uppercase tracking-widest mb-8">Gợi ý cho bạn</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  {loadingRecommendations ? (
                    [...Array(4)].map((_, i) => (
                      <Skeleton key={i} className="aspect-[4/5] rounded-2xl" />
                    ))
                  ) : (
                    recommendations.map((p) => (
                      <div key={p.id} className="group relative bg-white border border-neutral-200 rounded-2xl p-3 hover:border-primary-500 transition-all shadow-sm">
                        <div className="relative aspect-square bg-neutral-50 rounded-xl overflow-hidden mb-3">
                          {p.images?.[0] ? (
                            <Image src={p.images[0]} alt={p.name} fill className="object-cover group-hover:scale-110 transition-transform duration-500" />
                          ) : (
                            <Package className="h-6 w-6 text-neutral-200 m-auto mt-8" />
                          )}
                          <button 
                            onClick={() => handleAddToCart(p)} 
                            className="absolute bottom-2 right-2 bg-white text-primary-600 rounded-lg p-2 shadow-md opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all hover:bg-primary-600 hover:text-white"
                          >
                            <Plus size={16} />
                          </button>
                        </div>
                        <h4 className="text-[11px] font-bold text-neutral-800 line-clamp-1 mb-1">{p.name}</h4>
                        <div className="text-xs font-bold text-primary-600">{p.price.toLocaleString()}đ</div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Sidebar Summary */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-2xl shadow-sm border border-neutral-200 p-8 sticky top-24">
                <h2 className="text-lg font-bold text-neutral-900 mb-8 pb-4 border-b border-neutral-100">Chi tiết thanh toán</h2>
                
                {/* VOUCHER SECTION */}
                <div className="mb-8">
                  <div className="flex items-center gap-2 mb-4">
                    <Gift className="w-5 h-5 text-primary-600" />
                    <span className="text-sm font-bold text-neutral-800">Mã giảm giá</span>
                  </div>
                  {!voucher ? (
                    <div className="flex gap-2">
                      <input 
                        type="text"
                        placeholder="Nhập mã (Vd: SMART10)..."
                        value={voucherCode}
                        onChange={(e) => setVoucherCode(e.target.value)}
                        className="flex-1 px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl text-sm font-medium focus:bg-white focus:border-primary-500 outline-none transition-all uppercase"
                      />
                      <button 
                        onClick={handleApplyVoucher}
                        disabled={isApplyingVoucher || !voucherCode}
                        className="px-6 py-3 bg-neutral-900 text-white rounded-xl text-xs font-bold hover:bg-neutral-800 disabled:opacity-50 transition-all active:scale-95"
                      >
                        {isApplyingVoucher ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Áp dụng'}
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between p-4 bg-primary-50 border border-primary-200 rounded-xl animate-in zoom-in-95 duration-200">
                      <div className="flex items-center gap-3">
                        <CheckCircle className="w-5 h-5 text-primary-600" />
                        <div>
                          <p className="text-xs font-black text-primary-900 uppercase tracking-widest">Đã áp dụng: {voucher.code}</p>
                          <p className="text-[10px] font-bold text-primary-600">Giảm -{voucher.discountAmount.toLocaleString()}đ</p>
                        </div>
                      </div>
                      <button onClick={handleRemoveVoucher} className="p-2 text-primary-300 hover:text-red-500 transition-colors">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  )}
                </div>

                <div className="space-y-4 mb-8">
                  <div className="flex justify-between text-sm font-medium text-neutral-500">
                    <span>Tổng vật tư</span>
                    <span className="text-neutral-900">{totalPrice.toLocaleString()}đ</span>
                  </div>
                  <div className="flex justify-between text-sm font-medium text-neutral-500">
                    <span>Phí vận chuyển</span>
                    <span className="text-neutral-900">{shippingFee.toLocaleString()}đ</span>
                  </div>
                  {voucher && (
                    <div className="flex justify-between text-sm font-bold text-primary-600 animate-in slide-in-from-right-4">
                      <span>Giảm giá (Voucher)</span>
                      <span>-{voucher.discountAmount.toLocaleString()}đ</span>
                    </div>
                  )}
                  <div className="pt-6 border-t border-neutral-100 flex justify-between items-baseline">
                    <span className="text-sm font-bold text-neutral-900 uppercase">Thành tiền</span>
                    <span className="text-2xl font-bold text-primary-600">{finalTotal.toLocaleString()}đ</span>
                  </div>
                  <p className="text-[10px] text-neutral-400 font-medium text-right">* Đã bao gồm thuế GTGT</p>
                </div>

                {/* Status Notifications - Minimalist pill style */}
                <div className="mb-8">
                  {totalPrice < 500000 ? (
                    <div className="bg-red-50 border border-red-100 rounded-xl p-4">
                      <p className="text-xs font-bold text-red-600 mb-1">Cần tối thiểu 500.000đ để đặt hàng</p>
                      <div className="h-1.5 bg-red-100 rounded-full overflow-hidden">
                        <div className="h-full bg-red-500" style={{ width: `${Math.min((totalPrice / 500000) * 100, 100)}%` }}></div>
                      </div>
                    </div>
                  ) : totalPrice < 5000000 ? (
                    <div className="bg-primary-50 border border-primary-100 rounded-xl p-4">
                      <p className="text-[10px] font-semibold text-primary-600 mb-1">Thêm {(5000000 - totalPrice).toLocaleString()}đ để miễn phí vận chuyển</p>
                      <div className="h-1.5 bg-primary-100 rounded-full overflow-hidden">
                        <div className="h-full bg-primary-500" style={{ width: `${Math.min((totalPrice / 5000000) * 100, 100)}%` }}></div>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-green-50 border border-green-100 rounded-xl p-4 text-center">
                      <p className="text-[11px] font-bold text-green-600 uppercase">Được miễn phí vận chuyển</p>
                    </div>
                  )}
                </div>

                <button
                  onClick={handleCheckout}
                  disabled={isProcessing || totalPrice < 500000}
                  className={`w-full h-14 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 ${
                    totalPrice < 500000 
                      ? 'bg-neutral-100 text-neutral-400 cursor-not-allowed' 
                      : 'bg-primary-600 text-white shadow-md shadow-primary-100 hover:bg-primary-700 active:scale-[0.98]'
                  }`}
                >
                  {isProcessing ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Thanh toán ngay <ArrowRight size={18} /></>}
                </button>

                <button 
                  onClick={handleExportQuote} 
                  className="w-full mt-4 h-12 bg-white text-neutral-500 hover:text-primary-600 rounded-xl border border-neutral-200 font-semibold text-xs transition-colors flex items-center justify-center gap-2"
                >
                  <FileText size={16} /> Xuất báo giá PDF
                </button>

                {/* Help Card - Professional Branding */}
                <div className="mt-10 p-6 bg-primary-50 rounded-2xl border border-primary-100 relative overflow-hidden group">
                  <div className="absolute -right-4 -top-4 w-24 h-24 bg-primary-100/50 rounded-full blur-2xl group-hover:bg-primary-200/50 transition-colors"></div>
                  <div className="relative z-10">
                    <h3 className="font-bold text-sm text-primary-900 mb-2">Cần thợ thi công?</h3>
                    <p className="text-[11px] text-primary-700 mb-6 leading-relaxed">Chúng tôi có đội ngũ nhà thầu chuyên nghiệp sẵn sàng hỗ trợ bạn hoàn thiện công trình.</p>
                    <Link href="/contractors" className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary-600 text-white rounded-xl text-[11px] font-bold hover:bg-primary-700 transition-all shadow-sm shadow-primary-200 uppercase tracking-wider">
                      Tìm chuyên gia <ArrowRight size={14} />
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
