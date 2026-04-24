'use client'

import dynamic from 'next/dynamic'
import { useState, useCallback, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { ShoppingCart, Building2, RotateCcw, Layers, ChevronRight, Zap, Package } from 'lucide-react'
import Header from '@/components/Header'
import { mergeBoQ, type BoQResult } from '@/lib/tcvn-calculator'
import { useCartStore } from '@/stores/cartStore'
import toast from 'react-hot-toast'
import Link from 'next/link'

import { RoomDimension } from '@/app/estimator/types'

// Define props interface for dynamic import
interface ThreeViewerProps {
  onBoQChange: (results: BoQResult[]) => void
  buildingStyle?: string
  totalArea?: number
  roofType?: string
  rooms?: RoomDimension[]
}

// Dynamic import - không SSR (Three.js cần browser)
const ThreeViewer = dynamic<ThreeViewerProps>(() => import('@/components/estimator/ThreeViewer'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-slate-900">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-slate-400 font-medium">Khởi tạo môi trường 3D...</p>
      </div>
    </div>
  ),
})

const ELEMENT_ICONS: Record<string, string> = {
  brick_wall: '🧱',
  concrete_slab: '🏗️',
  plaster: '🪣',
  tile_floor: '🔲',
  paint: '🎨',
  roof_ton: '🏠',
}

export default function BIM3DViewerPage() {
  return (
    <Suspense fallback={<div>Loading Viewer...</div>}>
      <BIM3DViewerContent />
    </Suspense>
  )
}

function BIM3DViewerContent() {
  const [boqResults, setBoqResults] = useState<BoQResult[]>([])
  const { addItem } = useCartStore()
  const searchParams = useSearchParams()

  useEffect(() => {
    const area = searchParams.get('area')
    const type = searchParams.get('type')
    
    if (area) {
      toast.success(`Dựng mô hình 3D thành công từ bản vẽ ${area}m²!`, {
        icon: '🏠',
        duration: 5000,
      })
    }
  }, [searchParams])

  const handleBoQChange = useCallback((results: BoQResult[]) => {
    setBoqResults(results)
  }, [])

  const mergedMaterials = mergeBoQ(boqResults)
  const totalElements = boqResults.length

  function handleReset() {
    setBoqResults([])
    toast.success('Đã reset bảng vật liệu')
  }

  async function handleAddAllToCart() {
    if (mergedMaterials.length === 0) {
      toast.error('Chưa có vật liệu nào được chọn')
      return
    }

    // Fetch products để match với tên vật liệu
    try {
      const res = await fetch('/api/products?limit=100')
      const data = await res.json()
      const products = data.data?.data || data.data || []

      let addedCount = 0
      for (const mat of mergedMaterials) {
        if (!mat.searchKeyword) continue
        const match = products.find((p: { name: string; id: string; price: number; unit: string }) =>
          p.name.toLowerCase().includes(mat.searchKeyword.toLowerCase())
        )
        if (match) {
          addItem({
            id: crypto.randomUUID(), // For the cart item id
            productId: match.id,
            name: match.name,
            price: match.price,
            quantity: Math.ceil(mat.quantity),
            unit: mat.unit,
            image: match.images?.[0],
            sku: match.sku || `SKU-${match.id.slice(0, 5)}`,
          })
          addedCount++
        }
      }

      if (addedCount > 0) {
        toast.success(`Đã thêm ${addedCount} loại vật liệu vào giỏ hàng!`)
      } else {
        toast('Không tìm thấy sản phẩm phù hợp trong kho. Liên hệ để báo giá riêng.', { icon: 'ℹ️' })
      }
    } catch {
      toast.error('Lỗi khi kết nối. Thử lại sau!')
    }
  }

  const rawRooms = searchParams.get('rooms')
  const rooms = rawRooms ? JSON.parse(decodeURIComponent(rawRooms)) : []

  return (
    <div className="min-h-screen bg-slate-950 font-sans flex flex-col">
      <Header />

      {/* Page Header */}
      <div className="border-b border-white/5 bg-slate-900/50 backdrop-blur-sm px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center">
              <Building2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-white font-black text-lg">AI BIM Builder - Mô hình {rooms.length > 0 ? 'thực tế' : 'mẫu'}</h1>
              <p className="text-slate-500 text-xs">Dựng 3D dựa trên bóc tách {rooms.length} phòng từ AI Vision</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/estimator"
              className="flex items-center gap-2 px-4 py-2 border border-white/10 text-slate-400 font-bold text-xs rounded-xl hover:bg-white/5 transition-all"
            >
              <Zap className="w-3.5 h-3.5" /> AI Estimator 2D
            </Link>
          </div>
        </div>
      </div>

      {/* Main */}
      <div className="flex-1 flex overflow-hidden">
        {/* 3D Canvas */}
        <div className="flex-1 relative" style={{ minHeight: 'calc(100vh - 140px)' }}>
          <ThreeViewer 
            onBoQChange={handleBoQChange} 
            buildingStyle={searchParams.get('type') || undefined}
            totalArea={Number(searchParams.get('area')) || undefined}
            roofType={searchParams.get('roof') || undefined}
            rooms={rooms}
          />
        </div>

        {/* Right Panel - BoQ */}
        <div className="w-96 bg-slate-900 border-l border-white/5 flex flex-col overflow-hidden">
          {/* Panel Header */}
          <div className="p-5 border-b border-white/5">
            <div className="flex items-center justify-between mb-1">
              <h2 className="text-white font-black flex items-center gap-2">
                <Layers className="w-4 h-4 text-indigo-400" />
                Bảng Vật Liệu (BoQ)
              </h2>
              {totalElements > 0 && (
                <button onClick={handleReset} className="p-1.5 text-slate-500 hover:text-red-400 transition-colors">
                  <RotateCcw className="w-4 h-4" />
                </button>
              )}
            </div>
            <p className="text-xs text-slate-600">
              {totalElements === 0
                ? 'Chưa có phần tử nào. Click vào mô hình 3D.'
                : `${totalElements} bộ phận • ${mergedMaterials.length} loại vật liệu`}
            </p>
          </div>

          {/* Element chips */}
          {boqResults.length > 0 && (
            <div className="px-4 py-3 border-b border-white/5 flex flex-wrap gap-1.5">
              {boqResults.map((r) => (
                <span
                  key={r.elementName}
                  className="px-2.5 py-1 bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-[10px] font-bold rounded-lg"
                >
                  {ELEMENT_ICONS[r.elementType] || '📦'} {r.elementName}
                </span>
              ))}
            </div>
          )}

          {/* Material list */}
          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            {mergedMaterials.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center pb-8">
                <div className="w-20 h-20 rounded-3xl bg-white/5 flex items-center justify-center mb-4">
                  <Building2 className="w-10 h-10 text-slate-700" />
                </div>
                <p className="text-slate-600 font-medium text-sm">Chưa có dữ liệu</p>
                <p className="text-slate-700 text-xs mt-1">Hãy click vào các phần của mô hình 3D</p>

                {/* Tips */}
                <div className="mt-6 text-left space-y-2">
                  {[
                    { icon: '🧱', label: 'Click vào tường → Tính gạch, xi măng, cát' },
                    { icon: '🏗️', label: 'Click vào sàn → Tính bê tông cốt thép' },
                    { icon: '🏠', label: 'Click vào mái → Tính tôn + xà gồ' },
                    { icon: '🔲', label: 'Click vào nền → Tính gạch ốp lát' },
                  ].map((tip, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs text-slate-600">
                      <span>{tip.icon}</span>
                      <span>{tip.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              mergedMaterials.map((mat, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-3 bg-white/[0.03] border border-white/5 rounded-xl hover:bg-white/[0.06] transition-all"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center flex-shrink-0">
                      <Package className="w-4 h-4 text-indigo-400" />
                    </div>
                    <div>
                      <p className="text-white text-sm font-bold">{mat.name}</p>
                      <p className="text-[10px] text-slate-600 uppercase tracking-wider">{mat.category}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-indigo-300 font-black text-sm">{mat.quantity.toLocaleString('vi-VN')}</p>
                    <p className="text-slate-600 text-xs">{mat.unit}</p>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* CTA */}
          {mergedMaterials.length > 0 && (
            <div className="p-4 border-t border-white/5 space-y-2">
              <button
                onClick={handleAddAllToCart}
                className="w-full flex items-center justify-center gap-2 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-sm rounded-xl transition-all shadow-lg shadow-indigo-900/30"
              >
                <ShoppingCart className="w-4 h-4" />
                Thêm Tất Cả Vào Giỏ Hàng
              </button>
              <Link
                href="/contact"
                className="w-full flex items-center justify-center gap-2 py-3 border border-white/10 text-slate-400 font-bold text-sm rounded-xl hover:bg-white/5 transition-all"
              >
                Yêu cầu báo giá chi tiết <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
