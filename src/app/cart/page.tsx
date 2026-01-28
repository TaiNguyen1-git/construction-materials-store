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
  ShieldCheck
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

  const shippingFee = items.length > 0 ? 50000 : 0
  const totalPrice = getTotalPrice()
  const finalTotal = totalPrice + shippingFee

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
    setIsProcessing(true)
    await new Promise(resolve => setTimeout(resolve, 800))
    router.push('/checkout')
  }

  const handleExportQuote = () => {
    const doc = new jsPDF()
    doc.setFontSize(22)
    doc.setTextColor(41, 128, 185)
    doc.text("SMARTBUILD - BAO GIA", 105, 20, { align: 'center' })
    doc.text("SMARTBUILD - BAO GIA", 105, 20, { align: 'center' })
    const tableColumn = ["STT", "TEN SAN PHAM", "TRA THAI", "SL", "DON GIA", "THANH TIEN"]
    const tableRows = items.map((item, index) => {
      const isWholesale = item.wholesalePrice && item.minWholesaleQty && item.quantity >= item.minWholesaleQty
      const unitPrice = isWholesale ? item.wholesalePrice! : item.price
      return [
        index + 1,
        item.name.normalize("NFD").replace(/[\u0300-\u036f]/g, ""),
        item.unit.normalize("NFD").replace(/[\u0300-\u036f]/g, ""),
        item.quantity,
        unitPrice.toLocaleString('vi-VN'),
        (unitPrice * item.quantity).toLocaleString('vi-VN')
      ]
    })
    autoTable(doc, { head: [tableColumn], body: tableRows, startY: 45, theme: 'grid' })
    doc.save(`Bao_Gia_${Date.now()}.pdf`)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <Header />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex items-center gap-2 text-sm text-gray-600 mb-8">
          <Link href="/" className="hover:text-primary-600">Trang chủ</Link>
          <span>/</span>
          <span className="text-gray-900 font-semibold">Giỏ hàng</span>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between mb-2">
            <span className="text-xs font-bold text-primary-600">1. Giỏ Hàng</span>
            <span className="text-xs font-bold text-gray-400">2. Thanh Toán</span>
            <span className="text-xs font-bold text-gray-400">3. Hoàn Tất</span>
          </div>
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full w-1/3 bg-primary-600 rounded-full"></div>
          </div>
        </div>

        {/* Header - Compact */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-primary-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-primary-200">
              <ShoppingBag className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-black text-gray-900 leading-none">GIỎ HÀNG CỦA BẠN</h1>
              <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-1">
                {items.length > 0 ? `${items.length} sản phẩm` : 'Chưa có sản phẩm'}
              </p>
            </div>
          </div>
          {items.length > 0 && (
            <button onClick={clearCart} className="text-[10px] font-bold text-red-500 hover:text-red-700 bg-red-50 hover:bg-red-100 px-4 py-2 rounded-lg transition-colors flex items-center gap-1.5 shadow-sm">
              <Trash2 className="h-3 w-3" /> XÓA TẤT CẢ
            </button>
          )}
        </div>

        {items.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
            <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <ShoppingBag className="h-8 w-8 text-gray-300" />
            </div>
            <h2 className="text-lg font-bold text-gray-900 mb-1">Giỏ hàng đang trống</h2>
            <p className="text-xs text-gray-500 mb-6">Hãy thêm vật liệu vào dự án của bạn</p>
            <Link href="/products" className="inline-flex items-center gap-2 bg-primary-600 text-white px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider shadow-lg shadow-primary-100 hover:bg-primary-700 transition-all">
              <ArrowLeft className="h-3.5 w-3.5" /> Mua Sắm Ngay
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <div className="space-y-3">
                {items.map((item) => (
                  <div key={item.productId} className="bg-white rounded-2xl shadow-sm p-4 flex gap-5 border border-gray-100 hover:border-primary-200 hover:shadow-md transition-all group">
                    <div className="relative w-20 h-20 bg-gray-50 rounded-xl overflow-hidden shrink-0 border border-gray-100 group-hover:scale-105 transition-transform">
                      {item.image ? <Image src={item.image} alt={item.name} fill className="object-cover" /> : <Package className="h-8 w-8 text-gray-300 m-auto mt-6" />}
                    </div>
                    <div className="flex-1 min-w-0 flex flex-col justify-between">
                      <div className="flex justify-between items-start gap-4">
                        <div>
                          <h3 className="text-sm font-bold text-gray-900 line-clamp-2 leading-snug group-hover:text-primary-600 transition-colors">{item.name}</h3>
                          <p className="text-[10px] text-gray-400 font-medium mt-1 uppercase tracking-wider">{item.sku || 'Mã: Đang cập nhật'}</p>
                        </div>
                        <button onClick={() => { removeItem(item.productId); toast.success('Đã xóa sản phẩm') }} className="text-gray-300 hover:text-red-500 transition-colors p-1 hover:bg-red-50 rounded-lg"><Trash2 size={16} /></button>
                      </div>

                      <div className="flex justify-between items-end mt-3">
                        <div className="flex items-center gap-3 bg-gray-50 rounded-xl p-1 border border-gray-100">
                          <button onClick={() => updateQuantity(item.productId, item.quantity - 1)} className="w-7 h-7 flex items-center justify-center rounded-lg bg-white text-gray-500 hover:text-primary-600 shadow-sm border border-gray-100 text-sm font-bold active:scale-95 transition-transform">-</button>
                          <span className="font-bold text-sm w-6 text-center text-gray-900">{item.quantity}</span>
                          <button onClick={() => updateQuantity(item.productId, item.quantity + 1)} className="w-7 h-7 flex items-center justify-center rounded-lg bg-white text-gray-500 hover:text-primary-600 shadow-sm border border-gray-100 text-sm font-bold active:scale-95 transition-transform">+</button>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-black text-primary-600 leading-none">{(item.price * item.quantity).toLocaleString()} <span className="text-xs text-primary-400 font-bold align-top">đ</span></p>
                          <p className="text-[10px] text-gray-400 font-medium">{item.price.toLocaleString()} đ / {item.unit}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Recruitment Banner */}
              {/* Recruitment Banner - Compact */}
              <div className="mt-8 bg-gradient-to-r from-slate-900 to-slate-800 rounded-xl p-4 text-white relative overflow-hidden group">
                <div className="flex items-center justify-between relative z-10">
                  <div className="flex items-center gap-3">
                    <div className="bg-white/10 p-2 rounded-lg backdrop-blur-sm">
                      <Building className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <h2 className="text-xs font-black uppercase tracking-wider mb-0.5">Cần Chuyên Gia Thi Công?</h2>
                      <p className="text-[10px] text-gray-400">Kết nối ngay với mạng lưới thầu thợ Elite</p>
                    </div>
                  </div>
                  <Link href="/contractors" className="bg-primary-600 hover:bg-primary-500 text-white px-4 py-2 rounded-lg font-black text-[10px] uppercase tracking-wider shadow-lg transition-all flex items-center gap-2">
                    Tìm thợ <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
              </div>

              {/* Recommendations */}
              {/* Recommendations - Grid 4 */}
              <div className="mt-8">
                <h2 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2"><Sparkles className="w-3.5 h-3.5 text-primary-600" /> Có Thể Bạn Cần</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {loadingRecommendations ? (
                    // Skeleton Loading for Recommendations
                    [...Array(4)].map((_, i) => (
                      <div key={i} className="bg-white rounded-xl p-3 border border-gray-100 space-y-2">
                        <Skeleton className="aspect-square rounded-lg w-full" />
                        <Skeleton className="h-3 w-3/4 rounded" />
                        <div className="flex justify-between items-center pt-1">
                          <Skeleton className="h-4 w-12 rounded" />
                          <Skeleton className="h-6 w-6 rounded" />
                        </div>
                      </div>
                    ))
                  ) : (
                    recommendations.map((p) => (
                      <div key={p.id} className="bg-white rounded-xl shadow-sm p-3 border border-gray-100 group hover:border-primary-200 hover:shadow-md transition-all relative overflow-hidden">
                        <div className="relative aspect-square bg-gray-50 rounded-lg overflow-hidden mb-3 border-b border-gray-50">
                          {p.images?.[0] ? <Image src={p.images[0]} alt={p.name} fill className="object-cover group-hover:scale-110 transition-transform duration-500" /> : <Package className="h-6 w-6 text-gray-200 m-auto mt-4" />}
                          {/* Action overlay */}
                          <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <button onClick={() => handleAddToCart(p)} className="bg-white text-primary-600 rounded-full p-2 shadow-lg transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300 hover:bg-primary-600 hover:text-white">
                              <Plus size={16} strokeWidth={3} />
                            </button>
                          </div>
                        </div>
                        <h4 className="text-[10px] font-bold text-gray-900 line-clamp-2 h-7 mb-2 leading-snug group-hover:text-primary-600 transition-colors">{p.name}</h4>
                        <div className="flex items-center justify-between border-t border-gray-50 pt-2">
                          <p className="text-xs font-black text-primary-600">{p.price.toLocaleString()}đ</p>
                          <div className="text-[9px] text-gray-400 font-bold bg-gray-50 px-1.5 py-0.5 rounded">{p.unit}</div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-2xl shadow-xl p-6 sticky top-24 border-2 border-primary-100">
                <h2 className="text-xl font-bold mb-6 flex items-center gap-2 text-gray-800 border-b pb-4 border-gray-100"><CreditCard size={20} className="text-primary-600" /> Tóm Tắt Đơn Hàng</h2>
                <div className="space-y-4 mb-8">
                  <div className="flex justify-between text-gray-600 text-sm font-medium"><span>Tạm tính</span><span className="font-bold">{totalPrice.toLocaleString()}đ</span></div>
                  <div className="flex justify-between text-gray-600 text-sm font-medium"><span>Vận chuyển (Tiêu chuẩn)</span><span className="font-bold">{shippingFee.toLocaleString()}đ</span></div>
                  <div className="border-t border-dashed border-gray-200 pt-4 flex justify-between items-baseline">
                    <span className="text-base font-black text-gray-900 uppercase">Tổng cộng</span>
                    <span className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-primary-600 to-indigo-600">{finalTotal.toLocaleString()}đ</span>
                  </div>
                  <p className="text-[10px] text-gray-400 italic text-right">*Đã bao gồm VAT</p>
                </div>
                <button onClick={handleCheckout} disabled={isProcessing} className="w-full bg-primary-600 text-white py-4 rounded-xl font-black text-lg shadow-lg hover:shadow-2xl disabled:opacity-50 transition-all flex items-center justify-center gap-2">
                  {isProcessing ? 'Đang xử lý...' : <>Thanh Toán <ArrowRight size={20} /></>}
                </button>
                <button onClick={handleExportQuote} className="w-full mt-3 bg-white text-slate-700 py-3 rounded-xl border border-slate-200 font-bold text-sm flex items-center justify-center gap-2"><FileText size={16} /> Xuất Báo Giá (PDF)</button>

                {/* Contractor Sidebar Widget */}
                <div className="mt-8 p-5 bg-gradient-to-br from-primary-600 to-indigo-700 rounded-2xl text-white shadow-lg overflow-hidden relative">
                  <div className="absolute -right-4 -top-4 w-20 h-20 bg-white/10 rounded-full blur-2xl" />
                  <div className="relative z-10 text-center">
                    <Building className="h-8 w-8 mx-auto mb-3 text-white" />
                    <h3 className="font-black text-lg mb-1 leading-tight">Cần Thợ Thi Công?</h3>
                    <p className="text-[10px] text-blue-100 mb-4 font-medium italic">Chúng tôi có đội ngũ nhà thầu elite sẵn sàng phục vụ bạn</p>
                    <Link href="/contractors" className="block w-full py-2.5 bg-white text-primary-700 rounded-lg text-xs font-black hover:bg-blue-50 transition-colors shadow-md uppercase tracking-wider">Tìm thợ ngay</Link>
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
