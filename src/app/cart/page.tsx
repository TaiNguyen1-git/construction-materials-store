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
  CheckCircle
} from 'lucide-react'

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
    const tableColumn = ["STT", "Ten San Pham", "Don Vi", "SL", "Don Gia", "Thanh Tien"]
    const tableRows = items.map((item, index) => {
      const isWholesale = item.wholesalePrice && item.minWholesaleQty && item.quantity >= item.minWholesaleQty
      const unitPrice = isWholesale ? item.wholesalePrice! : item.price
      return [index + 1, item.name.normalize("NFD").replace(/[\u0300-\u036f]/g, ""), item.unit, item.quantity, unitPrice.toLocaleString('vi-VN'), (unitPrice * item.quantity).toLocaleString('vi-VN')]
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

        {/* Header - Compact */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-primary-600 to-indigo-600 rounded-lg flex items-center justify-center">
              <ShoppingBag className="w-4 h-4 text-white" />
            </div>
            <div>
              <h1 className="text-sm font-black text-gray-900 leading-none">SHOPPING CART</h1>
              <p className="text-[10px] text-gray-500 font-bold uppercase tracking-tighter">
                {items.length > 0 ? `${items.length} items` : 'Empty'}
              </p>
            </div>
          </div>
          {items.length > 0 && (
            <button onClick={clearCart} className="text-[10px] font-bold text-red-500 hover:text-red-700 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5">
              <Trash2 className="h-3 w-3" /> CLEAR ALL
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
                  <div key={item.productId} className="bg-white rounded-xl shadow-sm p-3 flex gap-4 border border-gray-100 hover:border-primary-100 transition-colors">
                    <div className="relative w-16 h-16 bg-gray-50 rounded-lg overflow-hidden shrink-0 border border-gray-100">
                      {item.image ? <Image src={item.image} alt={item.name} fill className="object-cover" /> : <Package className="h-6 w-6 text-gray-300 m-auto mt-5" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start">
                        <h3 className="text-sm font-bold text-gray-900 line-clamp-1">{item.name}</h3>
                        <button onClick={() => removeItem(item.productId)} className="text-gray-400 hover:text-red-500 transition-colors"><Trash2 size={14} /></button>
                      </div>
                      <div className="flex justify-between items-end mt-2">
                        <div className="flex items-center gap-2 bg-gray-50 rounded-lg p-1 border border-gray-100">
                          <button onClick={() => updateQuantity(item.productId, item.quantity - 1)} className="w-5 h-5 flex items-center justify-center rounded bg-white text-gray-500 hover:text-primary-600 shadow-sm border border-gray-100 text-xs font-bold">-</button>
                          <span className="font-bold text-xs w-4 text-center">{item.quantity}</span>
                          <button onClick={() => updateQuantity(item.productId, item.quantity + 1)} className="w-5 h-5 flex items-center justify-center rounded bg-white text-gray-500 hover:text-primary-600 shadow-sm border border-gray-100 text-xs font-bold">+</button>
                        </div>
                        <p className="text-sm font-black text-primary-600">{(item.price * item.quantity).toLocaleString()} <span className="text-[10px] text-gray-400 font-medium underline">đ</span></p>
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
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {recommendations.map((p) => (
                    <div key={p.id} className="bg-white rounded-xl shadow-sm p-3 border border-gray-100 group hover:border-primary-200 transition-colors">
                      <div className="relative aspect-square bg-gray-50 rounded-lg overflow-hidden mb-2">
                        {p.images?.[0] ? <Image src={p.images[0]} alt={p.name} fill className="object-cover group-hover:scale-110 transition-transform" /> : <Package className="h-6 w-6 text-gray-200 m-auto mt-4" />}
                      </div>
                      <h4 className="text-[10px] font-bold text-gray-900 line-clamp-2 h-7 mb-1.5 leading-snug">{p.name}</h4>
                      <div className="flex items-end justify-between">
                        <p className="text-xs font-black text-primary-600">{p.price.toLocaleString()}đ</p>
                        <button onClick={() => handleAddToCart(p)} className="w-6 h-6 bg-primary-50 text-primary-600 rounded-md flex items-center justify-center hover:bg-primary-600 hover:text-white transition-all">
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-2xl shadow-xl p-6 sticky top-24 border-2 border-primary-100">
                <h2 className="text-xl font-bold mb-6 flex items-center gap-2"><CreditCard size={20} className="text-primary-600" /> Tóm Tắt</h2>
                <div className="space-y-4 mb-6">
                  <div className="flex justify-between text-gray-600 text-sm"><span>Tạm tính</span><span>{totalPrice.toLocaleString()}đ</span></div>
                  <div className="flex justify-between text-gray-600 text-sm"><span>Vận chuyển</span><span>{shippingFee.toLocaleString()}đ</span></div>
                  <div className="border-t pt-4 flex justify-between text-lg font-black"><span className="text-gray-900">Tổng cộng</span><span className="text-primary-600">{finalTotal.toLocaleString()}đ</span></div>
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
