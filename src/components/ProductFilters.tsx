'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Filter, X, SlidersHorizontal, ArrowRight, ChevronDown } from 'lucide-react'

interface Category {
  id: string
  name: string
}

interface ProductFiltersProps {
  categories: Category[]
}

// Category emoji map for visual richness
const categoryEmojis: Record<string, string> = {
  'gạch': '🧱',
  'xi măng': '⚙️',
  'thép': '🔩',
  'cát': '🏔️',
  'sơn': '🎨',
  'vật liệu lợp mái': '🏠',
  'kính': '🪟',
  'ống': '🔧',
  'điện': '⚡',
  'nước': '💧',
}

function getCategoryEmoji(name: string): string {
  const key = Object.keys(categoryEmojis).find(k =>
    name.toLowerCase().includes(k)
  )
  return key ? categoryEmojis[key] : '📦'
}

// Price quick-select presets
const PRICE_PRESETS = [
  { label: 'Dưới 50k', min: '', max: '50000' },
  { label: '50k – 200k', min: '50000', max: '200000' },
  { label: '200k – 1tr', min: '200000', max: '1000000' },
  { label: 'Trên 1tr', min: '1000000', max: '' },
]

const SORT_OPTIONS = [
  { value: '', label: 'Mặc định', icon: '↕️' },
  { value: 'price-asc', label: 'Giá thấp → cao', icon: '📈' },
  { value: 'price-desc', label: 'Giá cao → thấp', icon: '📉' },
  { value: 'name-asc', label: 'Tên: A → Z', icon: '🔤' },
  { value: 'name-desc', label: 'Tên: Z → A', icon: '🔡' },
  { value: 'newest', label: 'Mới nhất', icon: '🆕' },
]

export default function ProductFilters({ categories }: ProductFiltersProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || '')
  const [minPrice, setMinPrice] = useState(searchParams.get('minPrice') || '')
  const [maxPrice, setMaxPrice] = useState(searchParams.get('maxPrice') || '')
  const [sortBy, setSortBy] = useState(searchParams.get('sort') || '')
  const [activePreset, setActivePreset] = useState<string | null>(null)
  const [isCategoryOpen, setIsCategoryOpen] = useState(true)
  const [isPriceOpen, setIsPriceOpen] = useState(true)
  const [isSortOpen, setIsSortOpen] = useState(true)

  useEffect(() => {
    setSelectedCategory(searchParams.get('category') || '')
    setMinPrice(searchParams.get('minPrice') || '')
    setMaxPrice(searchParams.get('maxPrice') || '')
    setSortBy(searchParams.get('sort') || '')
    setActivePreset(null)
  }, [searchParams])

  const applyFilters = () => {
    const params = new URLSearchParams(searchParams.toString())
    selectedCategory ? params.set('category', selectedCategory) : params.delete('category')
    minPrice ? params.set('minPrice', minPrice) : params.delete('minPrice')
    maxPrice ? params.set('maxPrice', maxPrice) : params.delete('maxPrice')
    sortBy ? params.set('sort', sortBy) : params.delete('sort')
    router.push(`/products?${params.toString()}`)
  }

  const clearFilters = () => {
    setSelectedCategory('')
    setMinPrice('')
    setMaxPrice('')
    setSortBy('')
    setActivePreset(null)
    router.push('/products')
  }

  const applyPreset = (preset: typeof PRICE_PRESETS[0]) => {
    setMinPrice(preset.min)
    setMaxPrice(preset.max)
    setActivePreset(preset.label)
  }

  const hasActiveFilters = selectedCategory || minPrice || maxPrice || sortBy

  const activeFilterCount = [
    selectedCategory,
    (minPrice || maxPrice),
    sortBy
  ].filter(Boolean).length

  return (
    <div className="bg-white rounded-3xl shadow-[0_10px_40px_rgba(0,0,0,0.04)] border border-slate-100 sticky top-24 flex flex-col overflow-hidden max-h-[calc(100vh-7rem)]">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-violet-600 p-5 shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-white/20 backdrop-blur-md rounded-xl flex items-center justify-center border border-white/30">
              <SlidersHorizontal className="h-4 w-4 text-white" />
            </div>
            <div>
              <h2 className="text-sm font-black text-white uppercase tracking-widest leading-none">Bộ Lọc</h2>
              <p className="text-[9px] font-bold text-white/60 uppercase tracking-wider mt-0.5">Lọc sản phẩm</p>
            </div>
          </div>
          {activeFilterCount > 0 && (
            <div className="flex items-center gap-2">
              <span className="bg-white text-indigo-600 text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center shadow-lg">
                {activeFilterCount}
              </span>
            </div>
          )}
        </div>
      </div>

      <div className="p-5 space-y-2 flex-1 overflow-y-auto custom-scrollbar">

        {/* ── Category Section ── */}
        <div className="rounded-2xl border border-slate-100 overflow-hidden">
          <button
            onClick={() => setIsCategoryOpen(!isCategoryOpen)}
            className="w-full flex items-center justify-between px-4 py-3.5 hover:bg-slate-50 transition-colors"
          >
            <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest flex items-center gap-2">
              🏷️ Danh Mục
            </span>
            <ChevronDown className={`h-3.5 w-3.5 text-slate-400 transition-transform duration-300 ${isCategoryOpen ? 'rotate-180' : ''}`} />
          </button>

          {isCategoryOpen && (
            <div className="px-3 pb-3 space-y-1">
              <button
                onClick={() => setSelectedCategory('')}
                className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-left text-xs font-bold transition-all ${selectedCategory === ''
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200'
                  : 'text-slate-600 hover:bg-slate-50'
                  }`}
              >
                <span>📋</span> Tất cả danh mục
              </button>
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-left text-xs font-bold transition-all ${selectedCategory === cat.id
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200'
                    : 'text-slate-600 hover:bg-slate-50'
                    }`}
                >
                  <span>{getCategoryEmoji(cat.name)}</span>
                  <span className="truncate">{cat.name}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* ── Price Section ── */}
        <div className="rounded-2xl border border-slate-100 overflow-hidden">
          <button
            onClick={() => setIsPriceOpen(!isPriceOpen)}
            className="w-full flex items-center justify-between px-4 py-3.5 hover:bg-slate-50 transition-colors"
          >
            <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest flex items-center gap-2">
              💰 Khoảng Giá
            </span>
            <ChevronDown className={`h-3.5 w-3.5 text-slate-400 transition-transform duration-300 ${isPriceOpen ? 'rotate-180' : ''}`} />
          </button>

          {isPriceOpen && (
            <div className="px-3 pb-4">
              {/* Quick presets */}
              <div className="grid grid-cols-2 gap-1.5 mb-4">
                {PRICE_PRESETS.map((preset) => (
                  <button
                    key={preset.label}
                    onClick={() => applyPreset(preset)}
                    className={`px-2 py-2 rounded-xl text-[10px] font-black uppercase tracking-tight border transition-all ${activePreset === preset.label
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-200'
                      : 'bg-slate-50 text-slate-600 border-slate-100 hover:border-indigo-200 hover:text-indigo-600'
                      }`}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>

              {/* Manual inputs */}
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={minPrice}
                  onChange={(e) => { setMinPrice(e.target.value); setActivePreset(null) }}
                  placeholder="Từ"
                  className="flex-1 w-full min-w-0 bg-slate-50 border border-slate-100 rounded-xl px-3 py-2.5 text-xs font-bold text-slate-900 placeholder-slate-300 focus:bg-white focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all outline-none"
                  min="0"
                />
                <div className="h-px w-3 bg-slate-200 shrink-0" />
                <input
                  type="number"
                  value={maxPrice}
                  onChange={(e) => { setMaxPrice(e.target.value); setActivePreset(null) }}
                  placeholder="Đến"
                  className="flex-1 w-full min-w-0 bg-slate-50 border border-slate-100 rounded-xl px-3 py-2.5 text-xs font-bold text-slate-900 placeholder-slate-300 focus:bg-white focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all outline-none"
                  min="0"
                />
              </div>
            </div>
          )}
        </div>

        {/* ── Sort Section ── */}
        <div className="rounded-2xl border border-slate-100 overflow-hidden">
          <button
            onClick={() => setIsSortOpen(!isSortOpen)}
            className="w-full flex items-center justify-between px-4 py-3.5 hover:bg-slate-50 transition-colors"
          >
            <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest flex items-center gap-2">
              ↕️ Sắp Xếp
            </span>
            <ChevronDown className={`h-3.5 w-3.5 text-slate-400 transition-transform duration-300 ${isSortOpen ? 'rotate-180' : ''}`} />
          </button>

          {isSortOpen && (
            <div className="px-3 pb-3 space-y-1">
              {SORT_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setSortBy(opt.value)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-left text-xs font-bold transition-all ${sortBy === opt.value
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200'
                    : 'text-slate-600 hover:bg-slate-50'
                    }`}
                >
                  <span>{opt.icon}</span> {opt.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Action Buttons (Pinned to bottom) ── */}
      <div className="p-5 border-t border-slate-100 bg-slate-50/50 shrink-0 space-y-2">
        <button
          onClick={applyFilters}
          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-4 rounded-2xl font-black text-[11px] uppercase tracking-widest shadow-xl shadow-indigo-200 transition-all active:scale-95 flex items-center justify-center gap-2 group"
        >
          ÁP DỤNG BỘ LỌC
          <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
        </button>

        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="w-full bg-white text-rose-500 py-3 rounded-2xl border border-rose-100 hover:bg-rose-50 transition-all font-black text-[11px] uppercase tracking-widest flex items-center justify-center gap-2 active:scale-95"
          >
            <X className="h-3.5 w-3.5" />
            Xóa Bộ Lọc
          </button>
        )}
      </div>
    </div>
  )
}
