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
  Loader2
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
    const tableColumn = ["STT", "TEN SAN PHAM", "DON VI", "SL", "DON GIA", "THANH TIEN"]
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
    <div className="min-h-screen bg-slate-50/50">
      <Header />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 pb-40">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400 mb-10">
          <Link href="/" className="hover:text-indigo-600 transition-colors">TRANG CHỦ</Link>
          <span className="text-slate-200">/</span>
          <span className="text-slate-900">GIỎ HÀNG THIẾT KẾ</span>
        </div>

        {/* Progress Bar */}
        <div className="mb-12">
          <div className="flex justify-between mb-4">
            <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest leading-none">1. Giỏ Hàng Elite</span>
            <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest leading-none">2. Thanh Toán An Toàn</span>
            <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest leading-none">3. Hoàn Tất</span>
          </div>
          <div className="h-2 bg-white rounded-full overflow-hidden border border-slate-100 shadow-inner">
            <div className="h-full w-1/3 bg-gradient-to-r from-indigo-500 to-blue-600 rounded-full shadow-[0_0_15px_rgba(79,70,229,0.3)]"></div>
          </div>
        </div>

        {/* Header - Compact */}
        <div className="flex items-center justify-between mb-12">
          <div className="flex items-center gap-6">
            <div className="w-16 h-16 bg-gradient-to-br from-indigo-600 to-blue-700 rounded-2xl flex items-center justify-center shadow-2xl shadow-indigo-100 relative group overflow-hidden">
              <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-500"></div>
              <ShoppingBag className="w-8 h-8 text-white relative z-10" />
            </div>
            <div>
              <h1 className="text-4xl font-black text-slate-900 leading-none tracking-tighter uppercase italic">DANH SÁCH <span className="text-indigo-600">VẬT TƯ</span></h1>
              <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.3em] mt-3">
                {items.length > 0 ? `${items.length} KIỆN HÀNG ĐANG CHỜ XỬ LÝ` : 'CHƯA CÓ VẬT TƯ TRONG GIỎ HÀNG'}
              </p>
            </div>
          </div>
          {items.length > 0 && (
            <button onClick={clearCart} className="text-[10px] font-black text-rose-500 hover:text-white bg-white hover:bg-rose-500 px-6 py-3 rounded-2xl transition-all border border-slate-100 hover:border-rose-500 shadow-sm flex items-center gap-2 group italic">
              <Trash2 className="h-3.5 w-3.5 group-hover:scale-110 transition-transform" /> XÓA TẤT CẢ
            </button>
          )}
        </div>

        {items.length === 0 ? (
          <div className="bg-white rounded-[2.5rem] shadow-[0_30px_60px_rgba(0,0,0,0.03)] border border-slate-50 p-24 text-center">
            <div className="w-24 h-24 bg-slate-50 rounded-[2rem] flex items-center justify-center mx-auto mb-8 border border-slate-100">
              <ShoppingBag className="h-10 w-10 text-slate-200" />
            </div>
            <h2 className="text-2xl font-black text-slate-900 mb-2 uppercase tracking-tighter italic">Giỏ hàng đang trống</h2>
            <p className="text-slate-500 mb-10 font-bold uppercase text-xs tracking-widest">Hãy bắt đầu thêm vật liệu vào dự án của bạn ngay hôm nay</p>
            <Link href="/products" className="inline-flex items-center gap-3 bg-indigo-600 text-white px-10 py-5 rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] shadow-2xl shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-95">
              <ArrowLeft className="h-4 w-4" /> BẮT ĐẦU MUA SẮM
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
            <div className="lg:col-span-2 space-y-6">
              <div className="space-y-4">
                {items.map((item) => (
                  <div key={item.productId} className="bg-white rounded-[2rem] shadow-[0_15px_40px_rgba(0,0,0,0.02)] p-6 flex gap-8 border border-slate-50 hover:border-indigo-100 hover:shadow-2xl hover:shadow-indigo-50/50 transition-all duration-500 group relative overflow-hidden">
                    <div className="relative w-32 h-32 bg-slate-50 rounded-2xl overflow-hidden shrink-0 border border-slate-100 group-hover:scale-105 transition-all duration-700 shadow-sm">
                      {item.image ? <Image src={item.image} alt={item.name} fill className="object-cover" /> : <Package className="h-10 w-10 text-slate-200 m-auto mt-11" />}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    </div>
                    <div className="flex-1 min-w-0 flex flex-col justify-between py-1">
                      <div className="flex justify-between items-start gap-4">
                        <div>
                          <h3 className="text-xl font-black text-slate-900 line-clamp-2 leading-tight group-hover:text-indigo-600 transition-colors uppercase italic">{item.name}</h3>
                          <p className="text-[10px] text-slate-400 font-black mt-2 uppercase tracking-[0.2em]">{item.sku || 'Mã SKU: N/A'}</p>
                        </div>
                        <button onClick={() => { removeItem(item.productId); toast.success('Đã xóa sản phẩm') }} className="w-10 h-10 rounded-xl bg-slate-50 text-slate-300 hover:text-rose-500 hover:bg-rose-50 transition-all flex items-center justify-center shrink-0 border border-transparent hover:border-rose-100 shadow-sm"><Trash2 size={18} /></button>
                      </div>

                      <div className="flex justify-between items-end">
                        <div className="flex items-center gap-4 bg-slate-50/50 rounded-2xl p-1.5 border border-slate-100 shadow-inner">
                          <button onClick={() => updateQuantity(item.productId, item.quantity - 1)} className="w-9 h-9 flex items-center justify-center rounded-xl bg-white text-slate-400 hover:text-indigo-600 shadow-sm border border-slate-100 text-lg font-black active:scale-90 transition-all">-</button>
                          <span className="font-black text-base w-8 text-center text-slate-900 italic">{item.quantity}</span>
                          <button onClick={() => updateQuantity(item.productId, item.quantity + 1)} className="w-9 h-9 flex items-center justify-center rounded-xl bg-white text-slate-400 hover:text-indigo-600 shadow-sm border border-slate-100 text-lg font-black active:scale-90 transition-all">+</button>
                        </div>
                        <div className="text-right">
                          <p className="text-3xl font-black text-indigo-600 leading-none tracking-tighter">{(item.price * item.quantity).toLocaleString()} <span className="text-xs font-black uppercase tracking-widest align-top mt-1 inline-block">VNĐ</span></p>
                          <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em] mt-2">{item.price.toLocaleString()} đ / {item.unit}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Recommendations */}
              <div className="mt-16">
                <h2 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.3em] mb-8 flex items-center gap-3">
                  <div className="h-[1px] w-12 bg-slate-100"></div>
                  GỢI Ý VẬT TƯ CÙNG HỆ THỐNG
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  {loadingRecommendations ? (
                    [...Array(4)].map((_, i) => (
                      <div key={i} className="bg-white rounded-[2rem] p-4 border border-slate-50 space-y-4 animate-pulse">
                        <Skeleton className="aspect-square rounded-2xl w-full" />
                        <Skeleton className="h-3 w-3/4 rounded-full" />
                        <div className="flex justify-between items-center pt-2">
                          <Skeleton className="h-5 w-16 rounded-full" />
                          <Skeleton className="h-10 w-10 rounded-xl" />
                        </div>
                      </div>
                    ))
                  ) : (
                    recommendations.map((p) => (
                      <div key={p.id} className="bg-white rounded-[2rem] shadow-[0_15px_40px_rgba(0,0,0,0.02)] p-4 border border-slate-50 group hover:border-indigo-100 hover:shadow-2xl transition-all duration-500 relative overflow-hidden">
                        <div className="relative aspect-square bg-slate-50 rounded-2xl overflow-hidden mb-4 border-b border-slate-50">
                          {p.images?.[0] ? <Image src={p.images[0]} alt={p.name} fill className="object-cover group-hover:scale-110 transition-transform duration-700" /> : <Package className="h-8 w-8 text-slate-200 m-auto mt-8" />}
                          <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <button onClick={() => handleAddToCart(p)} className="bg-white text-indigo-600 rounded-xl p-3 shadow-2xl transform translate-y-4 group-hover:translate-y-0 transition-all duration-500 hover:bg-indigo-600 hover:text-white">
                              <Plus size={20} strokeWidth={3} />
                            </button>
                          </div>
                        </div>
                        <h4 className="text-[11px] font-black text-slate-900 line-clamp-2 h-8 mb-3 uppercase tracking-tight leading-tight group-hover:text-indigo-600 transition-colors italic">{p.name}</h4>
                        <div className="flex items-center justify-between border-t border-slate-50 pt-3">
                          <p className="text-sm font-black text-indigo-600 tracking-tighter">{p.price.toLocaleString()}đ</p>
                          <div className="text-[9px] text-slate-400 font-black bg-slate-50 px-2 py-1 rounded inline-block uppercase tracking-widest">{p.unit}</div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-[2.5rem] shadow-[0_40px_80px_rgba(0,0,0,0.06)] p-10 sticky top-24 border border-slate-50 overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-indigo-600 to-blue-700"></div>
                <h2 className="text-2xl font-black mb-10 flex items-center gap-3 text-slate-900 border-b pb-8 border-slate-50 uppercase tracking-tighter italic">
                  <CreditCard size={24} className="text-indigo-600" /> TÓM TẮT DỰ TOÁN
                </h2>
                <div className="space-y-6 mb-12">
                  <div className="flex justify-between text-slate-500 text-[11px] font-black uppercase tracking-[0.2em]">
                    <span>TỔNG VẬT TƯ</span>
                    <span className="text-slate-900">{totalPrice.toLocaleString()} VNĐ</span>
                  </div>
                  <div className="flex justify-between text-slate-500 text-[11px] font-black uppercase tracking-[0.2em]">
                    <span>PHÍ VẬN CHUYỂN</span>
                    <span className="text-slate-900">{shippingFee.toLocaleString()} VNĐ</span>
                  </div>
                  <div className="border-t-2 border-dashed border-slate-100 pt-10 flex justify-between items-baseline">
                    <span className="text-lg font-black text-slate-900 uppercase italic tracking-tighter">THÀNH TIỀN</span>
                    <span className="text-4xl font-black text-indigo-600 tracking-tighter">{finalTotal.toLocaleString()}đ</span>
                  </div>
                  <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em] text-right leading-none">* ĐÃ BAO GỒM THUẾ GTGT</p>
                </div>

                <button
                  onClick={handleCheckout}
                  disabled={isProcessing}
                  className="w-full bg-indigo-600 text-white py-6 rounded-2xl font-black text-lg uppercase tracking-[0.3em] shadow-2xl shadow-indigo-100 hover:bg-indigo-700 transition-all flex items-center justify-center gap-3 active:scale-[0.98] group/btn"
                >
                  {isProcessing ? <Loader2 className="w-7 h-7 animate-spin" /> : <>THANH TOÁN <ArrowRight size={24} className="group-hover/btn:translate-x-1 transition-transform" /></>}
                </button>
                <button onClick={handleExportQuote} className="w-full mt-5 bg-white text-slate-400 py-4 rounded-2xl border border-slate-100 font-black text-[11px] uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-slate-50 hover:text-slate-900 transition-all">
                  <FileText size={18} /> XUẤT PHIẾU BÁO GIÁ (PDF)
                </button>

                {/* Info Card */}
                <div className="mt-12 p-8 bg-slate-900 rounded-[2.5rem] text-white shadow-2xl overflow-hidden relative group/contractor">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-600/20 rounded-full blur-3xl -mr-10 -mt-10 group-hover/contractor:scale-150 transition-transform duration-1000"></div>
                  <div className="relative z-10 text-center">
                    <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-6 backdrop-blur-xl border border-white/10">
                      <Building className="h-7 w-7 text-white" />
                    </div>
                    <h3 className="font-black text-xl mb-3 uppercase tracking-tighter italic">CẦN THỢ THI CÔNG?</h3>
                    <p className="text-[10px] text-slate-400 mb-10 font-black uppercase tracking-widest leading-relaxed">CHÚNG TÔI CÓ ĐỘI NGŨ NHÀ THẦU ELITE SẴN SÀNG PHỤC VỤ DỰ ÁN CỦA BẠN</p>
                    <Link href="/contractors" className="block w-full py-5 bg-indigo-600 text-white rounded-xl text-[11px] font-black uppercase tracking-[0.2em] hover:bg-indigo-500 transition-all shadow-xl active:scale-95">TÌM CHUYÊN GIA NGAY</Link>
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
