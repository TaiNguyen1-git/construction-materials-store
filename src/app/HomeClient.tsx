'use client'

import React, { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { ArrowRight, Zap, TrendingUp, ShieldCheck, PenTool, Brain, Package, UserPlus, Sparkles, Clock, ShoppingCart } from 'lucide-react'
import dynamic from 'next/dynamic'
import { Toaster } from 'react-hot-toast'
import toast from 'react-hot-toast'
import Image from 'next/image'

// Components
import Header from '@/components/Header'
import Hero from '@/components/home/Hero'
import CategorySidebar from '@/components/home/CategorySidebar'
import BannerCarousel from '@/components/home/BannerCarousel'
import EstimatorCTA from '@/components/home/EstimatorCTA'
import StatsSection from '@/components/home/StatsSection'
import FeaturedProducts from '@/components/home/FeaturedProducts'
import FeaturedBrands from '@/components/home/FeaturedBrands'
import ContractorReviewCarousel from '@/components/home/ContractorReviewCarousel'
import EcosystemSection from '@/components/home/EcosystemSection'

// Hooks & Store
import { useAuth } from '@/contexts/auth-context'
import { useCartStore } from '@/stores/cartStore'
import { getUnitFromProductName } from '@/lib/unit-utils'
import {
  FALLBACK_PRODUCTS,
  FALLBACK_SUB_CATEGORIES,
  DEFAULT_BANNERS,
  PARTNERS
} from '@/config/home-data'

// Types
interface FeaturedProduct {
  id: string
  name: string
  price: number
  images?: string[]
  sku: string
  unit?: string
  category?: { name: string }
  inventoryItem?: { availableQuantity: number }
}

interface Category {
  id: string
  name: string
  children?: { name: string }[]
}

interface Stats {
  totalProducts: number
  totalCustomers: number
  activeOrders: number
}

interface Banner {
  image: string
  tag: string
  title: string
  sub: string
  link?: string
}

interface Contractor {
  id: string
  displayName: string
  avgRating?: number
  isVerified?: boolean
  city?: string
  skills?: string[]
}

interface HomeClientProps {
  initialFeaturedProducts?: FeaturedProduct[]
  initialCategories?: Category[]
  initialStats?: Stats
  initialBanners?: Banner[]
  initialFeaturedContractors?: Contractor[]
}

export default function HomeClient({
  initialFeaturedProducts = [],
  initialCategories = [],
  initialStats,
  initialBanners = [],
  initialFeaturedContractors = []
}: HomeClientProps) {
  const { user, isAuthenticated } = useAuth()
  const { addItem } = useCartStore()

  // State
  const [featuredProducts, setFeaturedProducts] = useState<FeaturedProduct[]>(initialFeaturedProducts)
  const [aiRecommendedProducts, setAiRecommendedProducts] = useState<(FeaturedProduct & { recommendationScore?: number })[]>([])
  const [categories, setCategories] = useState<Category[]>(initialCategories)
  const [stats, setStats] = useState<Stats>(initialStats || { totalProducts: 850, totalCustomers: 1500, activeOrders: 45 })
  const [banners, setBanners] = useState<Banner[]>(initialBanners.length > 0 ? initialBanners : DEFAULT_BANNERS)
  const [featuredContractors, setFeaturedContractors] = useState<Contractor[]>(initialFeaturedContractors)

  const [loading, setLoading] = useState(!initialStats)
  const [featuredLoading, setFeaturedLoading] = useState(initialFeaturedProducts.length === 0)

  // Search state
  const [searchQuery, setSearchQuery] = useState('')
  const [isSearchFocused, setIsSearchFocused] = useState(false)
  const [activeSearchTab, setActiveSearchTab] = useState<'products' | 'contractors'>('products')
  const [selectedLocation, setSelectedLocation] = useState('Toàn quốc')
  const [selectedSubCategories, setSelectedSubCategories] = useState<string[]>([])
  const [searchSuggestions, setSearchSuggestions] = useState<{ name: string, price: string }[]>([])

  // Helper Functions
  const removeAccents = (str: string) => str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D')

  const getSubCategories = (cat: Category) => {
    if (cat.children && cat.children.length > 0) return cat.children.map(c => c.name)
    const catNameLower = cat.name.toLowerCase()
    const key = Object.keys(FALLBACK_SUB_CATEGORIES).find(k => catNameLower.includes(k))
    return key ? FALLBACK_SUB_CATEGORIES[key] : ['Bán chạy', 'Mới về', 'Khuyến mãi']
  }

  const getSuggestedProducts = (cat: Category) => {
    const catNameLower = cat.name.toLowerCase()
    const key = Object.keys(FALLBACK_PRODUCTS).find(k => catNameLower.includes(k))
    return key ? FALLBACK_PRODUCTS[key] : [
      { name: `${cat.name} Loại 1`, price: '120.000₫' },
      { name: `${cat.name} Dự án`, price: '115.000₫' }
    ]
  }

  // Fetching Logic
  useEffect(() => {
    if (searchQuery.length > 0) {
      const normalizedQuery = removeAccents(searchQuery.toLowerCase())
      const allProducts = Object.values(FALLBACK_PRODUCTS).flat()
      setSearchSuggestions(allProducts.filter(p => removeAccents(p.name.toLowerCase()).includes(normalizedQuery)).slice(0, 5))
    } else {
      setSearchSuggestions([])
    }
  }, [searchQuery])

  const fetchData = useCallback(async () => {
    try {
      // Parallel fetching for performance
      const [statsRes, productsRes, categoriesRes, bannersRes] = await Promise.all([
        fetch('/api/stats'),
        fetch('/api/products?featured=true&limit=10'),
        fetch('/api/categories?limit=8'),
        fetch('/api/banners')
      ])

      if (statsRes.ok) {
        const data = await statsRes.json()
        setStats(data.data || { totalProducts: 850, totalCustomers: 1500, activeOrders: 45 })
      }

      if (productsRes.ok) {
        const data = await productsRes.json()
        setFeaturedProducts(data.data?.data || data.data || [])
        setFeaturedLoading(false)
      }

      if (categoriesRes.ok) {
        const data = await categoriesRes.json()
        setCategories(data.data?.data || data.data || [])
      }

      if (bannersRes.ok) {
        const data = await bannersRes.json()
        if (data.length > 0) setBanners(data.map((b: any) => ({
          image: b.imageUrl,
          tag: b.tag,
          title: b.title,
          sub: b.description,
          link: b.link
        })))
      }
    } catch (error) {
      console.error('Failed to fetch home data:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  return (
    <div className="min-h-screen bg-white font-sans text-slate-900 flex flex-col">
      <Toaster position="top-right" />
      <Header />

      <main className="flex-1">
        <Hero
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          activeSearchTab={activeSearchTab}
          setActiveSearchTab={setActiveSearchTab}
          isSearchFocused={isSearchFocused}
          setIsSearchFocused={setIsSearchFocused}
          searchSuggestions={searchSuggestions}
          contractorSuggestions={[]}
          featuredContractors={featuredContractors}
          contractorSearchLoading={false}
          selectedLocation={selectedLocation}
          setSelectedLocation={setSelectedLocation}
        />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
            {/* Sidebar Categories */}
            <CategorySidebar
              categories={categories}
              getSubCategories={getSubCategories}
              getSuggestedProducts={getSuggestedProducts}
              selectedSubCategories={selectedSubCategories}
              setSelectedSubCategories={setSelectedSubCategories}
            />

            {/* Main Content Area */}
            <div className="lg:col-span-9 space-y-10">
              <BannerCarousel banners={banners} />
              <EstimatorCTA />
            </div>
          </div>
        </div>

        <StatsSection stats={stats} loading={loading} />

        <FeaturedProducts
          products={featuredProducts}
          loading={featuredLoading}
        />

        {/* Tools & AI Section */}
        <section className="py-24 bg-slate-900 overflow-hidden relative">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,#1e1b4b_0%,transparent_50%)]"></div>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
              <div className="space-y-10">
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-500/10 border border-indigo-500/20 rounded-full text-indigo-400 text-[11px] font-black uppercase tracking-widest">
                  <Zap className="w-3 h-3" /> Công cụ thông minh
                </div>
                <h2 className="text-4xl md:text-5xl font-black text-white tracking-tighter leading-tight">
                  Tối Ưu Hoá <span className="text-indigo-400">Chi Phí</span> <br />
                  Bằng Trợ Lý AI
                </h2>
                <p className="text-slate-400 text-lg leading-relaxed max-w-xl">
                  Hệ thống AI của chúng tôi giúp bạn tính toán khối lượng vật liệu chính xác dựa trên bản vẽ, giảm thiểu lãng phí và quản lý ngân sách hiệu quả hơn.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                  <div className="flex gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center flex-shrink-0 border border-indigo-500/20">
                      <PenTool className="w-6 h-6 text-indigo-400" />
                    </div>
                    <div>
                      <h4 className="font-black text-white mb-2 uppercase text-sm tracking-tight">Dự toán tự động</h4>
                      <p className="text-xs text-slate-500 leading-relaxed font-medium">Bóc tách vật liệu từ ảnh chụp bản vẽ chỉ trong 30 giây.</p>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center flex-shrink-0 border border-indigo-500/20">
                      <ShieldCheck className="w-6 h-6 text-indigo-400" />
                    </div>
                    <div>
                      <h4 className="font-black text-white mb-2 uppercase text-sm tracking-tight">Xác minh chất lượng</h4>
                      <p className="text-xs text-slate-500 leading-relaxed font-medium">Mọi nhà thầu đều được kiểm chứng năng lực thực tế.</p>
                    </div>
                  </div>
                </div>

                <div className="pt-6">
                  <Link href="/estimator" className="inline-flex items-center gap-3 px-10 py-5 bg-white text-slate-900 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-slate-100 transition-all shadow-xl shadow-indigo-900/40">
                    <Brain className="w-5 h-5 text-indigo-600" /> Thử ngay AI Estimator
                  </Link>
                </div>
              </div>

              <div className="relative group">
                <div className="absolute -inset-4 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-[3rem] opacity-20 blur-2xl group-hover:opacity-30 transition-opacity"></div>
                <div className="relative bg-white/5 backdrop-blur-xl border border-white/10 rounded-[3rem] p-10 shadow-2xl overflow-hidden">
                  <div className="flex items-center justify-between mb-10 border-b border-white/5 pb-6">
                    <span className="text-sm font-black text-white flex items-center gap-3 uppercase tracking-widest">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                      Dự toán mẫu từ AI
                    </span>
                    <span className="text-[10px] text-white/40 font-bold uppercase tracking-widest">Version 2.0</span>
                  </div>

                  <div className="space-y-5">
                    {[
                      { name: 'Thép Hòa Phát Φ10', qty: '2.5 Tấn', price: '45.000.000₫' },
                      { name: 'Xi măng Hà Tiên', qty: '150 Bao', price: '13.500.000₫' },
                      { name: 'Gạch tuynel đặc', qty: '12.000 Viên', price: '18.000.000₫' }
                    ].map((item, i) => (
                      <div key={i} className="flex justify-between items-center p-4 bg-white/5 rounded-2xl border border-white/5 hover:bg-white/10 transition-colors">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-xl bg-indigo-500/20 flex items-center justify-center">
                            <Package className="w-5 h-5 text-indigo-400" />
                          </div>
                          <div>
                            <p className="text-sm font-bold text-white tracking-tight">{item.name}</p>
                            <p className="text-[10px] text-white/40 font-black uppercase tracking-widest">{item.qty}</p>
                          </div>
                        </div>
                        <p className="text-sm font-black text-indigo-400">{item.price}</p>
                      </div>
                    ))}
                  </div>

                  <div className="mt-10 pt-8 border-t border-white/10 flex justify-between items-end">
                    <div>
                      <p className="text-[10px] text-white/40 font-black uppercase tracking-widest mb-1">Tổng dự kiến</p>
                      <p className="text-3xl font-black text-white tracking-tighter">76.500.000<span className="text-xs ml-1">₫</span></p>
                    </div>
                    <div className="flex flex-col items-end">
                      <p className="text-[10px] text-emerald-400 font-black uppercase tracking-widest mb-1">Độ chính xác</p>
                      <p className="text-xl font-black text-white tracking-tighter">98.5%</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <ContractorReviewCarousel />

        <FeaturedBrands partners={PARTNERS} />

        <EcosystemSection />

        {/* Member Incentive */}
        {!isAuthenticated && (
          <section className="pb-32 bg-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="bg-gradient-to-br from-indigo-600 to-blue-700 rounded-[4rem] p-16 md:p-24 relative overflow-hidden shadow-2xl">
                <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 w-[600px] h-[600px] bg-white/10 rounded-full blur-[120px]"></div>
                <div className="absolute bottom-0 left-0 translate-y-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-sky-400/20 rounded-full blur-[120px]"></div>

                <div className="relative z-10 grid lg:grid-cols-2 gap-20 items-center">
                  <div className="space-y-10">
                    <div className="inline-flex items-center gap-3 px-6 py-2 bg-white/10 backdrop-blur-md rounded-full text-white text-[11px] font-black uppercase tracking-[0.2em] border border-white/20">
                      <Sparkles className="w-4 h-4 text-yellow-300" /> Ưu đãi độc quyền
                    </div>
                    <h2 className="text-5xl md:text-6xl font-black text-white leading-[0.95] tracking-tighter">
                      Xây Dựng <br />
                      <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-orange-300">Thông Minh</span> <br />
                      Hơn Mỗi Ngày
                    </h2>
                    <p className="text-indigo-100 text-xl font-medium leading-relaxed opacity-90 max-w-lg">
                      Tham gia cộng đồng SmartBuild để nhận báo giá ưu đãi, lưu trữ lịch sự dự toán AI và quản lý tiến độ vật tư chuyên nghiệp.
                    </p>

                    <div className="flex flex-wrap gap-6 pt-6">
                      <Link href="/register" className="inline-flex items-center gap-4 px-10 py-5 bg-white text-indigo-700 rounded-2xl font-black text-lg tracking-tight hover:bg-slate-50 transition-all shadow-2xl shadow-indigo-900/20 hover:-translate-y-1">
                        <UserPlus className="w-6 h-6" /> Đăng Ký Ngay
                      </Link>
                      <Link href="/login" className="inline-flex items-center gap-4 px-10 py-5 bg-transparent text-white border-2 border-white/20 rounded-2xl font-black text-lg tracking-tight hover:bg-white/10 transition-all">
                        Đăng Nhập
                      </Link>
                    </div>
                  </div>

                  <div className="hidden lg:block">
                    <div className="bg-white/5 backdrop-blur-2xl border border-white/10 rounded-[3rem] p-10 transform rotate-3 shadow-2xl space-y-8">
                      <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-2xl bg-white flex items-center justify-center shadow-xl">
                          <Clock className="w-8 h-8 text-indigo-600" />
                        </div>
                        <h4 className="font-extrabold text-white text-xl">Member Benefits</h4>
                      </div>

                      <div className="space-y-4">
                        {[
                          { title: 'Lưu trữ dự toán', icon: Brain },
                          { title: 'Báo giá đặc quyền', icon: TrendingUp },
                          { title: 'Quản lý dự án', icon: Package },
                          { title: 'Hỗ trợ 24/7', icon: ShieldCheck }
                        ].map((item, i) => (
                          <div key={i} className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5">
                            <span className="text-white font-bold flex items-center gap-3">
                              <item.icon className="w-5 h-5 text-indigo-400" />
                              {item.title}
                            </span>
                            <div className="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center shadow-lg shadow-emerald-500/30">
                              <ArrowRight className="w-3.5 h-3.5 text-white" />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Final Footer CTA */}
        <section className="bg-slate-900 text-white py-24 border-t border-white/5">
          <div className="max-w-4xl mx-auto text-center px-4 space-y-8">
            <h2 className="text-4xl font-black tracking-tighter">Bắt đầu dự án xây dựng của bạn ngay hôm nay</h2>
            <p className="text-slate-400 text-lg font-medium">Tham gia cùng hàng nghìn nhà thầu và kiến trúc sư đang thay đổi cách xây dựng tại Việt Nam.</p>
            <div className="flex flex-wrap gap-6 justify-center pt-6">
              <Link href="/products" className="px-10 py-4 bg-white text-slate-900 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-100 transition-all shadow-xl shadow-slate-950">
                Khám phá vật liệu
              </Link>
              <Link href="/contractors" className="px-10 py-4 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-900/40">
                Tìm kiếm đối tác
              </Link>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}