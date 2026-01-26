'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Search, MapPin, ArrowRight, Zap, TrendingUp, ShieldCheck, PenTool, LayoutGrid, Brain, CreditCard, Package, ChevronRight, UserPlus, ChevronDown, HardHat, Quote, Star, Sparkles, Clock, X, Plus } from 'lucide-react'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import WishlistButton from '@/components/WishlistButton'
import { useAuth } from '@/contexts/auth-context'

export default function HomePage() {
  const { user, isAuthenticated } = useAuth()
  const [featuredProducts, setFeaturedProducts] = useState<any[]>([])
  const [aiRecommendedProducts, setAiRecommendedProducts] = useState<any[]>([])
  const [stats, setStats] = useState({
    totalProducts: 850,
    totalCustomers: 1500,
    activeOrders: 45
  })
  const [loading, setLoading] = useState(true)
  const [featuredLoading, setFeaturedLoading] = useState(true)
  const [categories, setCategories] = useState<any[]>([])
  const [currentBanner, setCurrentBanner] = useState(0)
  const [contractorIndex, setContractorIndex] = useState(0)
  const [isLocationOpen, setIsLocationOpen] = useState(false)
  const [selectedLocation, setSelectedLocation] = useState('Toàn quốc')
  const [activeSearchTab, setActiveSearchTab] = useState<'products' | 'contractors'>('products')
  const [hoveredCategory, setHoveredCategory] = useState<any | null>(null)
  const [selectedSubCategories, setSelectedSubCategories] = useState<string[]>([])
  const [loadedLogos, setLoadedLogos] = useState<Set<string>>(new Set())
  const [failedLogos, setFailedLogos] = useState<Set<string>>(new Set())

  // Search state
  const [searchQuery, setSearchQuery] = useState('')
  const [isSearchFocused, setIsSearchFocused] = useState(false)
  const [searchSuggestions, setSearchSuggestions] = useState<any[]>([])
  const [contractorSuggestions, setContractorSuggestions] = useState<any[]>([])
  const [featuredContractors, setFeaturedContractors] = useState<any[]>([])
  const [contractorSearchLoading, setContractorSearchLoading] = useState(false)
  const [dropdownDirection, setDropdownDirection] = useState<'up' | 'down'>('down')
  const [locationDropdownDirection, setLocationDropdownDirection] = useState<'up' | 'down'>('down')
  const searchInputRef = useRef<HTMLInputElement>(null)
  const locationButtonRef = useRef<HTMLButtonElement>(null)

  // Calculate dropdown direction based on available viewport space
  const calculateDropdownDirection = useCallback(() => {
    if (searchInputRef.current) {
      const rect = searchInputRef.current.getBoundingClientRect()
      const spaceBelow = window.innerHeight - rect.bottom - 20
      const spaceAbove = rect.top - 20
      const dropdownHeight = 300

      if (spaceBelow < dropdownHeight && spaceAbove > spaceBelow) {
        setDropdownDirection('up')
      } else {
        setDropdownDirection('down')
      }
    }

    if (locationButtonRef.current) {
      const rect = locationButtonRef.current.getBoundingClientRect()
      const spaceBelow = window.innerHeight - rect.bottom - 20
      const spaceAbove = rect.top - 20
      const dropdownHeight = 250

      if (spaceBelow < dropdownHeight && spaceAbove > spaceBelow) {
        setLocationDropdownDirection('up')
      } else {
        setLocationDropdownDirection('down')
      }
    }
  }, [])

  // Recalculate on focus, scroll, or location dropdown open
  useEffect(() => {
    if (isSearchFocused || isLocationOpen) {
      calculateDropdownDirection()
      window.addEventListener('scroll', calculateDropdownDirection)
      window.addEventListener('resize', calculateDropdownDirection)
      return () => {
        window.removeEventListener('scroll', calculateDropdownDirection)
        window.removeEventListener('resize', calculateDropdownDirection)
      }
    }
  }, [isSearchFocused, isLocationOpen, calculateDropdownDirection])

  const topSearches = [
    { name: 'Sắt thép Hòa Phát', tag: 'Bán chạy' },
    { name: 'Xi măng Hà Tiên PCB40', tag: 'Dự án' },
    { name: 'Gạch ốp lát Prime', tag: 'Nổi bật' },
    { name: 'Sơn Dulux nội thất', tag: 'Khuyến mãi' }
  ]

  const partners = [
    { name: 'Hòa Phát', logo: 'https://www.hoaphat.com.vn/assets/images/logo.png', color: 'bg-blue-50', text: 'text-blue-700' },
    { name: 'Hoa Sen', logo: 'https://upload.wikimedia.org/wikipedia/vi/thumb/e/e0/Logo_T%E1%BA%ADp_%C4%91o%C3%A0n_Hoa_Sen.svg/512px-Logo_T%E1%BA%ADp_%C4%91o%C3%A0n_Hoa_Sen.svg.png', color: 'bg-red-50', text: 'text-red-700' },
    { name: 'Viglacera', logo: 'https://viglacera.com.vn/themes/viglacera/images/logo.png', color: 'bg-blue-50', text: 'text-blue-800' },
    { name: 'Dulux', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e3/Dulux_logo.svg/512px-Dulux_logo.svg.png', color: 'bg-blue-50', text: 'text-indigo-600' },
    { name: 'Inax', logo: 'https://www.inax.com.vn/images/logo.png', color: 'bg-blue-50', text: 'text-slate-800' },
    { name: 'Vicem Hà Tiên', logo: '', color: 'bg-orange-50', text: 'text-orange-700' },
    { name: 'Pomina', logo: '', color: 'bg-rose-50', text: 'text-rose-700' },
    { name: 'SCG Build', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e3/SCG_Logo.svg/512px-SCG_Logo.svg.png', color: 'bg-red-50', text: 'text-red-600' },
    { name: 'Prime Group', logo: 'https://prime.vn/Images/logo.png', color: 'bg-orange-50', text: 'text-orange-600' },
    { name: 'Tôn Đông Á', logo: 'https://www.tondonga.com.vn/vnt_upload/weblink/logo_tda_2.png', color: 'bg-sky-50', text: 'text-sky-600' }
  ]

  const locations = ['Toàn quốc', 'Hồ Chí Minh', 'Hà Nội', 'Đồng Nai', 'Bình Dương', 'Long An']

  const fallbackProducts: Record<string, { name: string, price: string }[]> = {
    'cát': [
      { name: 'Cát xây tô loại 1', price: '250.000₫/m3' },
      { name: 'Cát bê tông vàng', price: '380.000₫/m3' },
      { name: 'Cát san lấp', price: '180.000₫/m3' }
    ],
    'gạch': [
      { name: 'Gạch ống 4 lỗ (8x8x18)', price: '1.250₫/viên' },
      { name: 'Gạch thẻ xây dựng', price: '1.100₫/viên' },
      { name: 'Gạch block 190', price: '9.500₫/viên' }
    ],
    'xi măng': [
      { name: 'Xi măng Hà Tiên PCB40', price: '89.000₫/bao' },
      { name: 'Xi măng Insee Đa Dụng', price: '94.000₫/bao' },
      { name: 'Xi măng Holcim', price: '92.000₫/bao' }
    ],
    'thép': [
      { name: 'Thép Pomina CB300V', price: '15.800₫/kg' },
      { name: 'Thép Hòa Phát CB400V', price: '16.500₫/kg' },
      { name: 'Thép Miền Nam', price: '16.200₫/kg' }
    ],
    'sơn': [
      { name: 'Sơn nước Dulux nội thất 18L', price: '2.450.000₫' },
      { name: 'Sơn Jotun Essence 17L', price: '1.850.000₫' },
      { name: 'Sơn Nippon Vatex', price: '850.000₫' }
    ],
    'tôn': [
      { name: 'Tôn lạnh mạ kẽm (0.45mm)', price: '115.000₫/m' },
      { name: 'Tôn màu Đông Á', price: '125.000₫/m' },
      { name: 'Tôn cách nhiệt Hoa Sen', price: '165.000₫/m' }
    ],
    'đá': [
      { name: 'Đá 1x2 xanh Biên Hòa', price: '450.000₫/m3' },
      { name: 'Đá 4x6 đen', price: '380.000₫/m3' },
      { name: 'Đá mi sàng', price: '290.000₫/m3' }
    ]
  }

  const fallbackSubCategories: Record<string, string[]> = {
    'xi măng': ['Xi măng PCB30', 'Xi măng PCB40', 'Bê tông tươi', 'Bê tông nhựa', 'Phụ gia bê tông', 'Xi măng trắng'],
    'thép': ['Thép cuộn', 'Thép thanh vằn', 'Thép hình V/U/I', 'Thép tấm', 'Lưới thép B40', 'Dây thép buộc'],
    'gạch': ['Gạch ống 4 lỗ', 'Gạch thẻ', 'Cát xây tô', 'Cát bê tông vàng', 'Đá 1x2 xanh', 'Đá chẻ', 'Gạch block'],
    'sơn': ['Sơn nội thất', 'Sơn ngoại thất', 'Sơn lót kháng kiềm', 'Chống thấm sàn KOVA', 'Sika Latex', 'Bột trét tường'],
    'điện': ['Ống nhựa Tiền Phong', 'Dây điện Cadivi', 'Thiết bị vệ sinh Inax', 'Đèn LED âm trần', 'Bồn nước Tân Á', 'Máy bơm nước'],
    'nội thất': ['Gạch ốp lát 60x60', 'Sàn gỗ công nghiệp', 'Trần thạch cao Vĩnh Tường', 'Cửa nhôm Xingfa', 'Đá hoa cương Marble'],
    'công cụ': ['Máy khoan bê tông', 'Máy cắt sắt', 'Máy trộn bê tông 250L', 'Giàn giáo nêm', 'Xe rùa HK', 'Thước laser'],
    'cát': ['Cát xây tô', 'Cát bê tông', 'Cát san lấp'],
    'tôn': ['Tôn lạnh', 'Tôn màu', 'Tôn kẽm'],
    'đá': ['Đá 1x2', 'Đá 4x6', 'Đá mi']
  }

  const getSubCategories = (cat: any) => {
    // 1. If API has children (sub-categories), use them
    if (cat.children && cat.children.length > 0) {
      return cat.children.map((c: any) => c.name)
    }
    // 2. Try to match name with fallback map (lowercase, partial match)
    const catNameLower = cat.name.toLowerCase()
    const key = Object.keys(fallbackSubCategories).find(k => catNameLower.includes(k))
    if (key) return fallbackSubCategories[key]

    // 3. Last resort
    return ['Sản phẩm bán chạy', 'Hàng mới về', 'Đang khuyến mãi', 'Sản phẩm cao cấp']
  }

  const getSuggestedProducts = (cat: any) => {
    const catNameLower = cat.name.toLowerCase()
    const key = Object.keys(fallbackProducts).find(k => catNameLower.includes(k))
    if (key) return fallbackProducts[key]
    return [
      { name: `${cat.name} Loại 1`, price: '120.000₫' },
      { name: `${cat.name} Dự án`, price: '115.000₫' },
      { name: `${cat.name} Xuất khẩu`, price: '145.000₫' }
    ]
  }

  /* State for banners */
  const [dbBanners, setDbBanners] = useState<any[]>([])

  const defaultBanners = [
    {
      image: '/images/banner_1.png',
      tag: 'HOT DEAL',
      title: 'Hệ Thống Phân Phối Toàn Quốc',
      sub: 'Cung cấp vật liệu xây dựng chính hãng từ các nhà máy sản xuất lớn nhất Việt Nam.'
    },
    {
      image: '/images/banner_2.png',
      tag: 'UY TÍN',
      title: 'Ưu Đãi Đặc Biệt Mùa Xây Dựng 2026',
      sub: 'Chiết khấu lên đến 20% cho các đơn hàng thép và xi măng dự án quy mô lớn.'
    },
    {
      image: '/images/banner_3.png',
      tag: 'CÔNG NGHỆ',
      title: 'Giải Pháp Cung Ứng Dự Án Với AI',
      sub: 'Tối ưu hóa ngân sách và thời gian cung ứng với hệ thống dự toán thông minh của chúng tôi.'
    }
  ]

  const banners = dbBanners.length > 0 ? dbBanners : defaultBanners

  // Utility to remove Vietnamese accents
  const removeAccents = (str: string) => {
    return str.normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/đ/g, 'd')
      .replace(/Đ/g, 'D');
  }

  useEffect(() => {
    // Smart search filtering with accent-insensitivity
    if (searchQuery.length > 0) {
      const normalizedQuery = removeAccents(searchQuery.toLowerCase())
      const allProducts = Object.values(fallbackProducts).flat()

      const filtered = allProducts.filter(p => {
        const normalizedName = removeAccents(p.name.toLowerCase())
        return normalizedName.includes(normalizedQuery)
      }).slice(0, 5)

      setSearchSuggestions(filtered)
    } else {
      setSearchSuggestions([])
    }
  }, [searchQuery])
  // Fetch contractor suggestions when typing in contractor search
  useEffect(() => {
    if (activeSearchTab === 'contractors' && searchQuery.length > 0) {
      const timer = setTimeout(() => {
        fetchContractorSuggestions(searchQuery)
      }, 300)
      return () => clearTimeout(timer)
    } else if (activeSearchTab === 'contractors' && searchQuery.length === 0) {
      setContractorSuggestions([])
    }
  }, [searchQuery, activeSearchTab])

  const fetchContractorSuggestions = async (query: string) => {
    setContractorSearchLoading(true)
    try {
      const city = selectedLocation !== 'Toàn quốc' ? selectedLocation : ''
      const params = new URLSearchParams({ q: query, limit: '6' })
      if (city) params.append('city', city)

      const res = await fetch(`/api/contractors/search?${params.toString()}`)
      if (res.ok) {
        const data = await res.json()
        if (data.success) {
          setContractorSuggestions(data.data.contractors || [])
        }
      }
    } catch (error) {
      console.error('Failed to fetch contractor suggestions:', error)
    } finally {
      setContractorSearchLoading(false)
    }
  }

  const fetchFeaturedContractors = async () => {
    try {
      const res = await fetch('/api/contractors/search?featured=true&limit=5')
      if (res.ok) {
        const data = await res.json()
        if (data.success) {
          setFeaturedContractors(data.data.contractors || [])
        }
      }
    } catch (error) {
      console.error('Failed to fetch featured contractors:', error)
    }
  }

  useEffect(() => {
    fetchFeaturedProducts()
    fetchCategories()
    fetchStats()
    fetchAIRecommendations()
    fetchBanners()
    fetchFeaturedContractors()

    const bannerInterval = setInterval(() => {
      setCurrentBanner((prev) => (prev + 1) % (dbBanners.length > 0 ? dbBanners.length : defaultBanners.length))
    }, 5000)

    const reviewInterval = setInterval(() => {
      setContractorIndex((prev) => (prev + 1) % 6) // Scroll up to the 6th position (8 total - 3 visible)
    }, 5000)

    return () => {
      clearInterval(bannerInterval)
      clearInterval(reviewInterval)
    }
  }, [isAuthenticated, user])

  const fetchBanners = async () => {
    try {
      const res = await fetch('/api/banners')
      if (res.ok) {
        const data = await res.json()
        if (data.length > 0) {
          // Map API data to UI structure if needed (though we named fields consistently)
          const mapped = data.map((b: any) => ({
            image: b.imageUrl,
            tag: b.tag,
            title: b.title,
            sub: b.description, // Mapping description to 'sub' as used in UI
            link: b.link
          }))
          setDbBanners(mapped)
        }
      }
    } catch (error) {
      console.error('Failed to fetch banners')
    }
  }

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/categories?limit=8')
      if (response.ok) {
        const data = await response.json()
        setCategories(data.data?.data || data.data || [])
      }
    } catch (error) {
      console.error('Failed to fetch categories:', error)
    }
  }

  const fetchFeaturedProducts = async () => {
    setFeaturedLoading(true)
    try {
      let response = await fetch('/api/products?featured=true&limit=8')
      let resJson = await response.json()

      let products = resJson.data?.data && Array.isArray(resJson.data.data)
        ? resJson.data.data
        : (Array.isArray(resJson.data) ? resJson.data : [])

      if (products.length === 0) {
        response = await fetch('/api/products?limit=8&sort=createdAt&order=desc')
        resJson = await response.json()
        products = resJson.data?.data && Array.isArray(resJson.data.data)
          ? resJson.data.data
          : (Array.isArray(resJson.data) ? resJson.data : [])
      }

      setFeaturedProducts(products)
    } catch (error) {
      console.error('Failed to fetch featured products:', error)
      setFeaturedProducts([])
    } finally {
      setFeaturedLoading(false)
    }
  }

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/stats')
      if (response.ok) {
        const data = await response.json()
        setStats({
          totalProducts: data.data?.totalProducts || 850,
          totalCustomers: data.data?.totalCustomers || 1500,
          activeOrders: data.data?.activeOrders || 45
        })
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchAIRecommendations = async () => {
    if (!user) return
    try {
      let customerId = null
      if (user.role === 'CUSTOMER') {
        try {
          const customerResponse = await fetch(`/api/customers/by-user/${user.id}`)
          if (customerResponse.ok) {
            const customerData = await customerResponse.json()
            customerId = customerData.data?.id
          }
        } catch (e) {
          console.error('Failed to get customer id', e)
        }
      }

      const params = new URLSearchParams({ limit: '4' })
      if (customerId) params.append('customerId', customerId)

      const response = await fetch(`/api/recommendations/ai?${params}`)
      if (response.ok) {
        const data = await response.json()
        setAiRecommendedProducts(data.data?.products || [])
      }
    } catch (error) {
      console.error('Failed to fetch AI recommendations:', error)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800 flex flex-col">
      <Header />

      <main className="flex-1">
        {/* Hero Section - Compact & High Impact */}
        <section className="relative min-h-[550px] flex items-center pt-12 pb-20 z-40 overflow-hidden">
          {/* Background Image with Parallax-like effect */}
          <div className="absolute inset-0 z-0 overflow-hidden">
            <Image
              src="/images/hero_bg.png"
              alt="Construction Site"
              fill
              className="object-cover scale-105 animate-slow-zoom"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-r from-blue-900 via-blue-800 to-slate-900 opacity-90 z-10"></div>
            <div className="absolute inset-0 opacity-10 z-10" style={{ backgroundImage: 'radial-gradient(#ffffff 1px, transparent 1px)', backgroundSize: '30px 30px' }}></div>
          </div>

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="text-center max-w-5xl mx-auto">
              {/* Badge/Tag */}
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 border border-blue-400/20 backdrop-blur-md text-blue-300 text-[11px] font-bold mb-8 animate-fade-in-up">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                </span>
                HỆ THỐNG CUNG CẤP VẬT TƯ 4.0
              </div>

              <h1 className="text-4xl md:text-6xl font-black mb-6 leading-[1.1] tracking-tighter text-white animate-fade-in-up">
                Nền Tảng Cung Cấp <br className="hidden lg:block" />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-sky-300 to-indigo-300 animate-gradient-text">
                  Vật Liệu Xây Dựng
                </span> Tin Cậy
              </h1>
              <p className="text-base md:text-lg text-slate-200/90 mb-10 max-w-2xl mx-auto leading-relaxed font-medium animate-fade-in-up delay-100">
                Giải pháp cung ứng vật tư 4.0, kết nối trực tiếp chủ thầu với nhà sản xuất uy tín, tối ưu quy trình và chi phí dự án.
              </p>

              {/* Hybrid Search Tabs */}
              <div className="flex justify-center mb-0 translate-y-[1px] animate-fade-in-up delay-200">
                <div className="bg-blue-900/40 backdrop-blur-md p-1 rounded-t-xl flex gap-1 border-x border-t border-blue-100/10">
                  <button
                    onClick={() => setActiveSearchTab('products')}
                    className={`px-6 py-2.5 rounded-t-lg text-xs font-black transition-all flex items-center gap-2 ${activeSearchTab === 'products' ? 'bg-white text-blue-900 shadow-lg' : 'text-blue-200 hover:text-white hover:bg-white/10'}`}
                  >
                    <Package className="w-4 h-4" /> MUA VẬT TƯ
                  </button>
                  <button
                    onClick={() => setActiveSearchTab('contractors')}
                    className={`px-6 py-2.5 rounded-t-lg text-xs font-black transition-all flex items-center gap-2 ${activeSearchTab === 'contractors' ? 'bg-white text-blue-900 shadow-lg' : 'text-blue-200 hover:text-white hover:bg-white/10'}`}
                  >
                    <HardHat className="w-4 h-4" /> TÌM NHÀ THẦU
                  </button>
                </div>
              </div>

              {/* Main Search Bar - Compact & Smart */}
              <div className="bg-white p-1.5 rounded-xl rounded-tr-none shadow-2xl max-w-4xl mx-auto flex flex-col md:flex-row gap-1.5 border border-blue-100/50 relative z-30 animate-fade-in-up delay-300">
                <div className="flex-[2] relative flex items-center px-5 border-b md:border-b-0 md:border-r border-gray-100 group">
                  <Search className="h-5 w-5 text-blue-500 mr-3.5 group-focus-within:scale-110 transition-transform" />
                  <input
                    ref={searchInputRef}
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onFocus={() => setIsSearchFocused(true)}
                    onBlur={() => setTimeout(() => setIsSearchFocused(false), 200)}
                    placeholder={activeSearchTab === 'products' ? "Bạn đang tìm vật liệu gì?..." : "Tìm nhà thầu, thợ xây dựng..."}
                    className="w-full py-3 outline-none text-slate-700 placeholder-slate-400 font-bold text-base bg-transparent"
                  />

                  {/* Smart Suggestions Dropdown */}
                  {isSearchFocused && activeSearchTab === 'products' && (
                    <div className={`absolute left-0 right-0 bg-white/95 backdrop-blur-md rounded-xl shadow-[0_20px_50px_rgba(0,0,0,0.2)] border border-white/20 overflow-hidden z-50 animate-in fade-in duration-200 max-h-[300px] overflow-y-auto
                      ${dropdownDirection === 'up' ? 'bottom-full mb-2 slide-in-from-bottom-2' : 'top-full mt-2 slide-in-from-top-2'}
                    `}>
                      {searchQuery.length === 0 ? (
                        <div className="p-4">
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 px-2">Tìm kiếm phổ biến</p>
                          <div className="space-y-1">
                            {topSearches.map((item, idx) => (
                              <button key={idx} onClick={() => setSearchQuery(item.name)} className="w-full flex items-center justify-between px-3 py-2.5 hover:bg-blue-50 rounded-lg transition-colors group">
                                <span className="text-sm font-bold text-slate-600 group-hover:text-blue-700 flex items-center gap-2">
                                  <TrendingUp className="w-3.5 h-3.5 text-blue-400" /> {item.name}
                                </span>
                                <span className="text-[9px] px-1.5 py-0.5 bg-slate-100 text-slate-500 rounded font-black">{item.tag}</span>
                              </button>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <div className="p-2">
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 p-2">Kết quả gợi ý</p>
                          {searchSuggestions.length > 0 ? (
                            searchSuggestions.map((item, idx) => (
                              <button key={idx} className="w-full flex items-center justify-between px-4 py-3 hover:bg-blue-50 rounded-lg transition-colors group">
                                <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 rounded bg-slate-100 flex items-center justify-center">
                                    <Package className="w-4 h-4 text-slate-400" />
                                  </div>
                                  <div className="text-left">
                                    <p className="text-sm font-bold text-slate-700 group-hover:text-blue-700">{item.name}</p>
                                    <p className="text-[11px] text-blue-600 font-black">{item.price}</p>
                                  </div>
                                </div>
                                <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-blue-500 group-hover:translate-x-1 transition-all" />
                              </button>
                            ))
                          ) : (
                            <div className="p-4 text-center">
                              <p className="text-sm text-slate-400 font-medium italic">Không tìm thấy sản phẩm phù hợp</p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Contractor Suggestions Dropdown */}
                  {isSearchFocused && activeSearchTab === 'contractors' && (
                    <div className={`absolute left-0 right-0 bg-white/95 backdrop-blur-md rounded-xl shadow-[0_20px_50px_rgba(0,0,0,0.2)] border border-white/20 overflow-hidden z-50 animate-in fade-in duration-200 max-h-[350px] overflow-y-auto
                      ${dropdownDirection === 'up' ? 'bottom-full mb-2 slide-in-from-bottom-2' : 'top-full mt-2 slide-in-from-top-2'}
                    `}>
                      {searchQuery.length === 0 ? (
                        <div className="p-4">
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 px-2">Nhà thầu nổi bật</p>
                          {featuredContractors.length > 0 ? (
                            <div className="space-y-1">
                              {featuredContractors.map((contractor, idx) => (
                                <Link
                                  key={contractor.id || idx}
                                  href={`/contractors/${contractor.id}`}
                                  className="w-full flex items-center justify-between px-3 py-2.5 hover:bg-teal-50 rounded-lg transition-colors group"
                                >
                                  <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-gradient-to-r from-teal-500 to-emerald-500 flex items-center justify-center text-white font-bold text-sm">
                                      {contractor.displayName?.charAt(0)?.toUpperCase() || 'N'}
                                    </div>
                                    <div>
                                      <p className="text-sm font-bold text-slate-700 group-hover:text-teal-700 flex items-center gap-1">
                                        {contractor.displayName}
                                        {contractor.isVerified && (
                                          <ShieldCheck className="w-3.5 h-3.5 text-blue-500" />
                                        )}
                                      </p>
                                      <p className="text-[11px] text-slate-400 flex items-center gap-2">
                                        <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                                        {(contractor.avgRating || 0).toFixed(1)}
                                        {contractor.city && <span>• {contractor.city}</span>}
                                      </p>
                                    </div>
                                  </div>
                                  <span className="text-[9px] px-1.5 py-0.5 bg-teal-100 text-teal-600 rounded font-black">HOT</span>
                                </Link>
                              ))}
                            </div>
                          ) : (
                            <div className="text-center py-4">
                              <p className="text-sm text-slate-400 italic">Đang tải nhà thầu nổi bật...</p>
                            </div>
                          )}
                        </div>
                      ) : contractorSearchLoading ? (
                        <div className="p-6 text-center">
                          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-teal-600 mx-auto"></div>
                          <p className="text-sm text-slate-400 mt-2">Đang tìm kiếm...</p>
                        </div>
                      ) : (
                        <div className="p-2">
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 p-2">Kết quả gợi ý</p>
                          {contractorSuggestions.length > 0 ? (
                            contractorSuggestions.map((contractor, idx) => (
                              <Link
                                key={contractor.id || idx}
                                href={`/contractors/${contractor.id}`}
                                className="w-full flex items-center justify-between px-4 py-3 hover:bg-teal-50 rounded-lg transition-colors group"
                              >
                                <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 rounded-full bg-gradient-to-r from-teal-500 to-emerald-500 flex items-center justify-center text-white font-bold text-sm">
                                    {contractor.displayName?.charAt(0)?.toUpperCase() || 'N'}
                                  </div>
                                  <div className="text-left">
                                    <p className="text-sm font-bold text-slate-700 group-hover:text-teal-700 flex items-center gap-1">
                                      {contractor.displayName}
                                      {contractor.isVerified && (
                                        <ShieldCheck className="w-3.5 h-3.5 text-blue-500" />
                                      )}
                                    </p>
                                    <div className="flex items-center gap-2 text-[11px] text-slate-500">
                                      <span className="flex items-center gap-1">
                                        <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                                        {(contractor.avgRating || 0).toFixed(1)}
                                      </span>
                                      {contractor.skills?.slice(0, 2).map((skill: string, i: number) => (
                                        <span key={i} className="px-1.5 py-0.5 bg-slate-100 rounded text-[9px]">{skill}</span>
                                      ))}
                                    </div>
                                  </div>
                                </div>
                                <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-teal-500 group-hover:translate-x-1 transition-all" />
                              </Link>
                            ))
                          ) : (
                            <div className="p-4 text-center">
                              <HardHat className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                              <p className="text-sm text-slate-400 font-medium italic">Không tìm thấy nhà thầu phù hợp</p>
                              <p className="text-xs text-slate-300 mt-1">Thử từ khóa khác hoặc thay đổi khu vực</p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
                {activeSearchTab === 'contractors' && (
                  <div className="flex-1 relative">
                    <button
                      ref={locationButtonRef}
                      onClick={() => setIsLocationOpen(!isLocationOpen)}
                      className="w-full h-full flex items-center px-5 py-3 text-left outline-none cursor-pointer group"
                    >
                      <MapPin className="h-5 w-5 text-blue-400 mr-3 group-hover:scale-110 transition-transform" />
                      <span className="flex-1 text-slate-600 font-bold truncate text-sm">{selectedLocation}</span>
                      <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform duration-300 ${isLocationOpen ? 'rotate-180' : ''}`} />
                    </button>

                    {/* Custom Dropdown Menu - Smart Positioning */}
                    {isLocationOpen && (
                      <div className={`absolute left-0 w-full bg-white/95 backdrop-blur-md rounded-xl shadow-[0_20px_50px_rgba(0,0,0,0.2)] border border-white/20 overflow-hidden z-[100] animate-in fade-in duration-300 max-h-[250px] overflow-y-auto
                        ${locationDropdownDirection === 'up' ? 'bottom-full mb-2 slide-in-from-bottom-2' : 'top-full mt-2 slide-in-from-top-2'}
                      `}>
                        {locations.map((loc) => (
                          <button
                            key={loc}
                            onClick={() => {
                              setSelectedLocation(loc)
                              setIsLocationOpen(false)
                            }}
                            className={`w-full px-5 py-3.5 text-left text-sm font-bold transition-all flex items-center gap-3
                              ${selectedLocation === loc ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-50 hover:text-blue-600'}
                            `}
                          >
                            <MapPin className={`w-4 h-4 ${selectedLocation === loc ? 'text-blue-500' : 'text-slate-300'}`} />
                            {loc}
                          </button>
                        ))}
                      </div>
                    )}

                    {isLocationOpen && (
                      <div className="fixed inset-0 z-[90]" onClick={() => setIsLocationOpen(false)} />
                    )}
                  </div>
                )}
                <button className="bg-blue-600 hover:bg-blue-700 text-white font-black py-3.5 px-10 rounded-xl transition-all w-full md:w-auto shadow-lg shadow-blue-200 active:scale-95 flex items-center justify-center gap-2">
                  <Search className="w-4 h-4 md:hidden" />
                  TÌM KIẾM
                </button>
              </div>

              {/* Quick Stats Tags */}
              <div className="mt-12 flex flex-wrap justify-center gap-10 text-xs text-slate-300 font-bold animate-fade-in-up delay-400">
                <span className="flex items-center opacity-90 hover:text-white transition-colors cursor-default"><ShieldCheck className="w-5 h-5 mr-2 text-green-400" /> 100% Chính hãng</span>
                <span className="flex items-center opacity-90 hover:text-white transition-colors cursor-default"><TrendingUp className="w-5 h-5 mr-2 text-blue-400" /> Giá cạnh tranh</span>
                <span className="flex items-center opacity-90 hover:text-white transition-colors cursor-default"><Zap className="w-5 h-5 mr-2 text-yellow-400" /> Giao hàng 24h</span>
              </div>
            </div>
          </div>
        </section>

        {/* Content Section: Category Sidebar + Banner */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12 mb-16 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
            {/* Left: Category Sidebar with Mega Menu */}
            <div
              className="lg:col-span-3 bg-white rounded-xl shadow-xl self-start border border-slate-100 relative group/sidebar"
              onMouseLeave={() => setHoveredCategory(null)}
            >
              <div className="bg-slate-50 px-5 py-4 border-b border-slate-100 flex items-center justify-between rounded-t-xl">
                <span className="font-bold text-slate-800 flex items-center gap-2">
                  <LayoutGrid className="w-4 h-4 text-blue-600" /> NGÀNH HÀNG
                </span>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </div>
              <div className="py-2 relative">
                {(categories.length > 0 ? categories : [
                  { name: 'Xi măng - Bê tông' },
                  { name: 'Sắt thép xây dựng' },
                  { name: 'Gạch - Cát - Đá' },
                  { name: 'Sơn - Chống thấm' },
                  { name: 'Điện - Nước' },
                  { name: 'Nội thất - Trang trí' },
                  { name: 'Công cụ - Máy móc' }
                ]).map((cat, i) => (
                  <div
                    key={i}
                    onMouseEnter={() => setHoveredCategory(cat.name)}
                    className="relative"
                  >
                    <Link
                      href={`/products?category=${cat.id || ''}`}
                      onMouseEnter={() => setHoveredCategory(cat)}
                      className={`flex items-center justify-between px-5 py-3.5 transition-all border-b border-slate-50 last:border-0 group/item
                        ${hoveredCategory?.id === cat.id ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-50 hover:text-blue-700'}
                      `}
                    >
                      <span className="text-[14px] font-medium">{cat.name}</span>
                      <ChevronRight className={`w-4 h-4 transition-all ${hoveredCategory?.id === cat.id ? 'text-blue-400 translate-x-1' : 'text-slate-300'}`} />
                    </Link>
                  </div>
                ))}

                {/* Mega Menu Panel */}
                {hoveredCategory && (
                  <div className="absolute top-0 left-full ml-[1px] w-[650px] min-h-[400px] bg-white shadow-2xl border border-slate-100 rounded-r-xl p-8 z-50 animate-in fade-in slide-in-from-left-2 duration-200">
                    <div className="flex flex-col gap-8">
                      <div>
                        <div className="flex items-center justify-between mb-6">
                          <h4 className="text-sm font-black text-slate-800 uppercase tracking-tighter flex items-center gap-2">
                            <Package className="w-4 h-4 text-blue-600" />
                            {hoveredCategory.name}
                          </h4>
                          <span className="text-[10px] text-slate-400 font-bold uppercase">Phân loại & Sản phẩm</span>
                        </div>

                        <div className="grid grid-cols-2 gap-x-8 gap-y-6">
                          {/* Sub-groups / Sub-categories */}
                          <div>
                            <p className="text-[11px] font-extrabold text-blue-600 mb-4 uppercase tracking-widest">Nhóm hàng</p>
                            <div className="flex flex-wrap gap-2">
                              {getSubCategories(hoveredCategory).map((sub: string, idx: number) => {
                                const isSelected = selectedSubCategories.includes(sub);
                                return (
                                  <button
                                    key={idx}
                                    onClick={(e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      if (isSelected) {
                                        setSelectedSubCategories(prev => prev.filter(item => item !== sub));
                                      } else {
                                        setSelectedSubCategories(prev => [...prev, sub]);
                                      }
                                    }}
                                    className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all border
                                        ${isSelected
                                        ? 'bg-blue-600 text-white border-blue-600 shadow-md scale-105'
                                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:border-blue-300 hover:bg-white hover:text-blue-600'
                                      }
                                      `}
                                  >
                                    {sub}
                                  </button>
                                );
                              })}
                            </div>
                          </div>

                          {/* Featured Items in this category Area */}
                          <div className="border-l border-slate-100 pl-8">
                            <p className="text-[11px] font-extrabold text-indigo-600 mb-4 uppercase tracking-widest">Sản phẩm gợi ý</p>
                            <div className="space-y-3">
                              {getSuggestedProducts(hoveredCategory).map((prod, idx) => (
                                <Link
                                  key={idx}
                                  href={`/products?q=${prod.name}`}
                                  className="group/prod flex items-center justify-between p-2 rounded-lg hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-100 cursor-pointer"
                                >
                                  <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded bg-blue-50 flex items-center justify-center text-blue-500 group-hover/prod:bg-blue-600 group-hover/prod:text-white transition-colors">
                                      <TrendingUp className="w-4 h-4" />
                                    </div>
                                    <span className="text-xs font-semibold text-slate-700">{prod.name}</span>
                                  </div>
                                  <span className="text-[10px] font-bold text-blue-600">{prod.price}</span>
                                </Link>
                              ))}
                              <Link href={`/products?category=${hoveredCategory.id}`} className="block text-center mt-4 text-[10px] font-black text-blue-600 hover:underline">
                                XEM TẤT CẢ SẢN PHẨM <ArrowRight className="w-3 h-3 inline ml-1" />
                              </Link>
                            </div>
                          </div>
                        </div>
                      </div>

                      {selectedSubCategories.length > 0 && (
                        <div className="mt-auto pt-4 border-t border-slate-100 flex items-center justify-between">
                          <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                            Đã chọn: {selectedSubCategories.length} mục lọc
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => setSelectedSubCategories([])}
                              className="text-[10px] font-bold text-slate-400 hover:text-red-500 transition-colors uppercase"
                            >
                              Xóa tất cả
                            </button>
                            <Link
                              href={`/products?${hoveredCategory.id ? `category=${hoveredCategory.id}` : `q=${hoveredCategory.name}`}&tags=${selectedSubCategories.join(',')}`}
                              className="bg-blue-600 text-white px-4 py-2 rounded-lg text-[10px] font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 uppercase"
                            >
                              Lọc kết quả ngay
                            </Link>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Middle: Professional Banner Carousel */}
            <div className="lg:col-span-6 flex flex-col gap-4">
              <div className="relative flex-1 bg-white rounded-xl shadow-xl overflow-hidden border border-slate-100 min-h-[300px]">
                {banners.map((banner, idx) => (
                  <div
                    key={idx}
                    className={`absolute inset-0 transition-all duration-700 ease-in-out ${idx === currentBanner ? 'opacity-100 scale-100' : 'opacity-0 scale-105 pointer-events-none'}`}
                  >
                    <Image
                      src={banner.image}
                      alt={banner.title}
                      fill
                      sizes="(max-width: 768px) 100vw, 50vw"
                      className="object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-end p-8 text-white">
                      <span className="bg-blue-600 text-[10px] font-extrabold px-2 py-0.5 rounded w-fit mb-3 tracking-widest">{banner.tag}</span>
                      <h3 className="text-2xl font-black mb-2 uppercase italic tracking-tighter leading-tight">{banner.title}</h3>
                      <p className="text-white/80 text-sm max-w-sm font-medium">{banner.sub}</p>
                    </div>
                  </div>
                ))}

                {/* Carousel Indicators */}
                <div className="absolute bottom-4 right-8 flex gap-2 z-20">
                  {banners.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => setCurrentBanner(idx)}
                      className={`h-1.5 rounded-full transition-all ${idx === currentBanner ? 'w-8 bg-blue-500' : 'w-2 bg-white/50 hover:bg-white'}`}
                    />
                  ))}
                </div>
              </div>
              {/* Quick Action Badges below banner */}
              <div className="flex gap-4">
                <Link href="/estimator" className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-700 p-4 rounded-xl text-white shadow-lg flex items-center justify-between group cursor-pointer hover:shadow-blue-200 transition-all active:scale-95">
                  <div>
                    <div className="text-[10px] font-bold opacity-80 uppercase tracking-widest">Báo giá ngay</div>
                    <div className="font-bold text-sm">Dự toán vật liệu AI</div>
                  </div>
                  <Brain className="w-6 h-6 opacity-80 group-hover:scale-110 transition-transform" />
                </Link>
                <Link href="/contractors" className="flex-1 bg-gradient-to-r from-teal-500 to-emerald-600 p-4 rounded-xl text-white shadow-lg flex items-center justify-between group cursor-pointer hover:shadow-teal-200 transition-all active:scale-95">
                  <div>
                    <div className="text-[10px] font-bold opacity-80 uppercase tracking-widest">Kết nối</div>
                    <div className="font-bold text-sm">Tìm nhà thầu uy tín</div>
                  </div>
                  <ShieldCheck className="w-6 h-6 opacity-80 group-hover:scale-110 transition-transform" />
                </Link>
                <Link href="/projects/post" className="flex-1 bg-gradient-to-r from-orange-500 to-amber-600 p-4 rounded-xl text-white shadow-lg flex items-center justify-between group cursor-pointer hover:shadow-orange-200 transition-all active:scale-95">
                  <div>
                    <div className="text-[10px] font-bold opacity-80 uppercase tracking-widest">Khách hàng</div>
                    <div className="font-bold text-sm">Đăng tin dự án</div>
                  </div>
                  <Plus className="w-6 h-6 opacity-80 group-hover:scale-110 transition-transform" />
                </Link>
              </div>
            </div>

            {/* Right: Small Info Cards / Quick Actions */}
            <div className="lg:col-span-3 flex flex-col gap-4">
              <div className="bg-white p-6 rounded-xl shadow-lg border border-slate-100 flex flex-col items-center text-center">
                <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mb-4">
                  <UserPlus className="w-8 h-8 text-blue-600" />
                </div>
                <h4 className="font-bold text-slate-800 text-sm mb-1">Dành Cho Nhà Thầu</h4>
                <p className="text-[11px] text-slate-500 mb-4">Đăng ký làm đối tác để nhận ưu đãi chiết khấu tốt nhất.</p>
                <button className="w-full bg-slate-900 text-white py-2 rounded-lg text-xs font-bold hover:bg-slate-800 transition-all">ĐĂNG KÝ NGAY</button>
              </div>
              <div className="bg-gradient-to-br from-indigo-50 to-blue-50 p-6 rounded-xl shadow-lg border border-blue-100 flex-1 relative overflow-hidden group">
                <div className="relative z-10">
                  <h4 className="font-bold text-blue-900 text-sm mb-2">Trợ Lý Ổn Định</h4>
                  <p className="text-[11px] text-blue-700/80 mb-4 font-medium leading-relaxed">
                    Theo dõi biến động giá thép và xi măng thị trường theo thời gian thực.
                  </p>
                  <Link href="/market" className="text-blue-600 text-xs font-black flex items-center group-hover:underline underline-offset-4">
                    XEM BIỂU ĐỒ <ChevronRight className="w-3 h-3 ml-1" />
                  </Link>
                </div>
                <TrendingUp className="absolute -bottom-4 -right-4 w-24 h-24 text-blue-600/5 group-hover:scale-110 transition-transform" />
              </div>
            </div>
          </div>
        </div>

        {/* Stats Section */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8 relative z-20 mb-20">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { label: 'Sản phẩm đa dạng', value: `${stats.totalProducts}+`, icon: LayoutGrid, color: 'text-blue-600', bg: 'bg-blue-50' },
              { label: 'Khách hàng tin dùng', value: `${stats.totalCustomers}+`, icon: ShieldCheck, color: 'text-green-600', bg: 'bg-green-50' },
              { label: 'Đơn hàng thành công', value: `${stats.activeOrders}+`, icon: CreditCard, color: 'text-orange-600', bg: 'bg-orange-50' },
            ].map((item, idx) => (
              <div key={idx} className="bg-white rounded-xl shadow-lg border border-slate-100 p-6 flex items-center hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                <div className={`p-4 rounded-lg ${item.bg} mr-5`}>
                  <item.icon className={`h-8 w-8 ${item.color}`} />
                </div>
                <div>
                  <div className="text-3xl font-bold text-slate-800">{loading ? '...' : item.value}</div>
                  <div className="text-sm text-slate-500 font-medium mt-1">{item.label}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Featured Products */}
        <section className="py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-end mb-10 pb-4 border-b border-slate-100">
              <div>
                <h2 className="text-2xl font-bold text-slate-800 mb-2">Vật Liệu Nổi Bật</h2>
                <p className="text-slate-500 text-sm">Các sản phẩm được tìm kiếm và đặt hàng nhiều nhất tuần qua</p>
              </div>
              <Link href="/products" className="text-blue-600 font-semibold hover:text-blue-700 flex items-center transition-colors text-sm">
                Xem tất cả <ArrowRight className="h-4 w-4 ml-1" />
              </Link>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {featuredLoading ? (
                [...Array(4)].map((_, i) => (
                  <div key={i} className="bg-slate-50 rounded-lg h-80 animate-pulse border border-slate-100"></div>
                ))
              ) : featuredProducts.length > 0 ? (
                featuredProducts.map((product) => (
                  <div
                    key={product.id}
                    className="group block bg-white border border-slate-100 rounded-xl overflow-hidden hover:shadow-xl hover:border-blue-200 transition-all duration-300 relative"
                  >
                    <div className="absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                      <WishlistButton product={product} size="sm" />
                    </div>
                    <Link href={`/products/${product.id}`}>
                      <div className="relative aspect-[4/3] bg-slate-50 overflow-hidden p-2">
                        {product.images?.[0] ? (
                          <Image src={product.images[0]} alt={product.name} fill className="object-contain group-hover:scale-110 transition-transform duration-500" />
                        ) : (
                          <div className="flex items-center justify-center h-full text-slate-200">
                            <Package className="h-8 w-8" />
                          </div>
                        )}
                      </div>
                      <div className="p-3">
                        <div className="text-[9px] text-blue-500 mb-1 uppercase font-black tracking-tighter">
                          {product.category?.name || 'Vật liệu'}
                        </div>
                        <h3 className="font-bold text-slate-800 mb-1.5 line-clamp-2 h-8 group-hover:text-blue-700 transition-colors text-[11px] leading-tight">
                          {product.name}
                        </h3>
                        <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-50">
                          <span className="text-sm font-black text-slate-900">
                            {product.price.toLocaleString('vi-VN')}₫
                          </span>
                          <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">
                            CHI TIẾT
                          </span>
                        </div>
                      </div>
                    </Link>
                  </div>
                ))
              ) : (
                <div className="col-span-full text-center py-10 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                  <Package className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                  <p className="text-slate-500 font-medium">Chưa có sản phẩm nào</p>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* AI Recommendations */}
        {aiRecommendedProducts.length > 0 && (
          <section className="py-16 bg-slate-50 border-t border-slate-200">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center mb-12">
                <span className="bg-indigo-100 text-indigo-700 text-[11px] font-bold px-3 py-1 rounded-full uppercase tracking-widest mb-4 inline-block">
                  Dành riêng cho bạn
                </span>
                <h2 className="text-3xl font-bold text-slate-900 mb-4 tracking-tight">Gợi Ý Từ Trợ Lý AI</h2>
                <p className="text-slate-500 max-w-4xl mx-auto text-base leading-relaxed">
                  Hệ thống tự động phân tích nhu cầu và đề xuất những vật liệu tối ưu nhất cho công trình của bạn.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {aiRecommendedProducts.map((product) => (
                  <div key={product.id} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col hover:border-indigo-300 transition-colors">
                    <div className="flex items-start gap-4 mb-4">
                      <div className="relative w-16 h-16 bg-slate-100 rounded-lg overflow-hidden flex-shrink-0 border border-slate-100">
                        {product.images?.[0] && (
                          <Image src={product.images[0]} alt={product.name} fill className="object-cover" />
                        )}
                      </div>
                      <div>
                        <h4 className="font-semibold text-slate-800 line-clamp-2 text-sm mb-1 leading-snug">{product.name}</h4>
                        <span className="text-indigo-600 font-bold text-sm">{product.price.toLocaleString()}₫</span>
                      </div>
                    </div>
                    {product.recommendationScore && (
                      <div className="mt-auto pt-3 border-t border-slate-100">
                        <div className="flex items-center text-xs text-slate-500 mb-3">
                          <Zap className="w-3 h-3 text-yellow-500 mr-1" />
                          Độ phù hợp: <span className="font-semibold text-slate-700 ml-1">{Math.round(product.recommendationScore * 100)}%</span>
                        </div>
                        <Link href={`/products/${product.id}`} className="block w-full text-center bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-sm font-semibold py-2 rounded-lg transition-colors">
                          Xem chi tiết
                        </Link>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Tools Section */}
        <section className="py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="text-3xl font-extrabold text-slate-900 mb-6 tracking-tight">Công Cụ Hỗ Trợ Thông Minh</h2>
                <p className="text-slate-600 mb-8 text-lg leading-relaxed">
                  Chúng tôi tích hợp công nghệ AI giúp bạn quản lý ngân sách và lựa chọn đối tác xây dựng chỉ trong vài lần nhấp chuột.
                </p>
                <div className="space-y-6">
                  <div className="flex gap-4 group">
                    <div className="bg-blue-50 p-3 rounded-lg h-fit text-blue-600 group-hover:bg-blue-100 transition-colors">
                      <PenTool className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-800 text-lg">Dự toán chi phí AI</h4>
                      <p className="text-slate-500 text-sm mt-1">Tính toán khối lượng vật liệu chính xác trong tích tắc chỉ với vài thông số cơ bản.</p>
                    </div>
                  </div>
                  <div className="flex gap-4 group">
                    <div className="bg-green-50 p-3 rounded-lg h-fit text-green-600 group-hover:bg-green-100 transition-colors">
                      <ShieldCheck className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-800 text-lg">Tìm nhà thầu uy tín</h4>
                      <p className="text-slate-500 text-sm mt-1">Kết nối với đội ngũ thầu thợ đã được xác minh năng lực và đánh giá thực tế từ cộng đồng.</p>
                    </div>
                  </div>
                </div>
                <div className="mt-10">
                  <Link href="/estimator" className="inline-flex items-center justify-center px-8 py-3 border border-transparent text-base font-semibold rounded-lg text-white bg-slate-900 hover:bg-slate-800 transition-all shadow-lg hover:shadow-xl">
                    <Brain className="w-4 h-4 mr-2" />
                    Thử công cụ AI
                  </Link>
                </div>

                {!isAuthenticated && (
                  <div className="mt-8 p-6 bg-indigo-50 border border-indigo-100 rounded-2xl">
                    <div className="flex items-start gap-4">
                      <div className="bg-white p-2 rounded-lg text-indigo-600 shadow-sm">
                        <Sparkles className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-black text-slate-800 text-sm uppercase tracking-wider">Mở khóa toàn bộ trải nghiệm AI</h4>
                        <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                          Chỉ thành viên mới có thể <strong>lưu trữ kết quả dự toán</strong>, theo dõi tiến độ vật tư và nhận tư vấn chuyên sâu từ chuyên gia.
                        </p>
                        <Link href="/register" className="inline-flex items-center mt-3 text-indigo-600 font-bold text-xs hover:underline">
                          Tạo tài khoản miễn phí <ArrowRight className="w-3 h-3 ml-1" />
                        </Link>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              <div className="relative h-96 bg-gradient-to-br from-slate-100 to-white rounded-2xl overflow-hidden border border-slate-200 p-8 flex items-center justify-center">
                <div className="absolute inset-0 bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] [background-size:16px_16px]"></div>
                <div className="bg-white p-6 rounded-xl shadow-2xl max-w-sm w-full relative z-10 border border-slate-100">
                  <div className="flex items-center justify-between mb-6 border-b border-slate-100 pb-4">
                    <span className="font-bold text-slate-800 flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-green-500"></div> Bảng dự toán mẫu
                    </span>
                    <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-1 rounded font-medium border border-slate-200">Export PDF</span>
                  </div>
                  <div className="space-y-4">
                    {[
                      { name: "Xi măng PCB40", qty: "50 bao", price: "4.500.000₫" },
                      { name: "Cát xây dựng", qty: "12 m³", price: "3.600.000₫" },
                      { name: "Gạch 4 lỗ", qty: "5000 viên", price: "6.250.000₫" }
                    ].map((item, i) => (
                      <div key={i} className="flex justify-between items-center text-sm p-2 hover:bg-slate-50 rounded transition-colors">
                        <div className="flex items-center gap-3">
                          <Package className="w-4 h-4 text-blue-500" />
                          <div>
                            <div className="font-medium text-slate-700">{item.name}</div>
                            <div className="text-[10px] text-slate-400">{item.qty}</div>
                          </div>
                        </div>
                        <div className="font-semibold text-slate-600 text-xs">{item.price}</div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-6 pt-4 border-t border-slate-100 flex justify-between items-center">
                    <span className="font-semibold text-slate-600 text-sm">Tổng cộng</span>
                    <span className="font-bold text-blue-600 text-lg">145.000.000₫</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Trusted Contractors & Partners Section */}
        <section className="py-24 bg-gradient-to-b from-white via-blue-50/50 to-indigo-50/30 relative">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-600 via-indigo-500 to-teal-400 mt-[1px]"></div>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-end mb-12">
              <div>
                <h2 className="text-3xl font-black text-slate-900 mb-4 tracking-tight">Khách Hàng Nói Về Chúng Tôi</h2>
                <p className="text-slate-500 font-medium">Những chia sẻ thực tế từ các chủ thầu và khách hàng đã tin dùng sản phẩm</p>
              </div>
              <div className="flex flex-col items-end">
                <div className="flex items-center gap-2 mb-1">
                  <div className="flex gap-0.5">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star key={s} className="w-3 h-3 fill-yellow-500 text-yellow-500" />
                    ))}
                  </div>
                  <span className="text-sm font-bold text-slate-900">1,200+ Đánh giá</span>
                </div>
                <div className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em]">Khách hàng tin dùng</div>
              </div>
            </div>

            {/* Contractor Carousel Wrapper */}
            <div className="relative group/carousel">
              <div className="overflow-hidden py-4">
                <div
                  className="flex transition-all duration-1000 ease-in-out gap-6"
                  style={{ transform: `translateX(-${contractorIndex * (100 / 3)}%)` }}
                >
                  {[
                    { name: 'Anh Hùng', role: 'Chủ thầu (Quận 7)', comment: 'Sản phẩm thép Hòa Phát rất chuẩn, giao hàng nhanh đúng tiến độ công trình. Dịch vụ chăm sóc khách hàng cực kỳ tốt.', rating: 5.0, avatar: 'H' },
                    { name: 'Chị Lan', role: 'Chủ nhà (Bình Chánh)', comment: 'Gạch Viglacera mẫu mã đẹp, giá cả cạnh tranh. Nhân viên tư vấn rất nhiệt tình và chu đáo.', rating: 5.0, avatar: 'L' },
                    { name: 'Bác Thành', role: 'Thầu xây dựng (Thủ Đức)', comment: 'Xi măng Hà Tiên loại 1, chất lượng khỏi bàn. Chatbot tư vấn dự toán AI rất chính xác và tiện lợi.', rating: 4.9, avatar: 'T' },
                    { name: 'Anh Minh', role: 'Công ty xây dựng (Q.2)', comment: 'Hệ thống đặt hàng online rất chuyên nghiệp, giúp chúng tôi quản lý vật tư cho nhiều công trình cùng lúc dễ dàng.', rating: 4.8, avatar: 'M' },
                    { name: 'Chị Mai', role: 'Nhà thiết kế (Q.9)', comment: 'Sơn Dulux lên màu rất chuẩn, giao hàng cẩn thận. SmartBuild là lựa chọn hàng đầu cho các dự án của tôi.', rating: 5.0, avatar: 'M' },
                    { name: 'Chú Sáu', role: 'Chủ công trình (Hóc Môn)', comment: 'Giá cả vật liệu rất minh bạch, không lo bị đội giá. Tôi rất an tâm khi mua hàng tại đây.', rating: 4.9, avatar: 'S' },
                    { name: 'Anh Tuấn', role: 'Kỹ sư (Bình Tân)', comment: 'Vật liệu đa dạng, từ cát đá đến thiết bị vệ sinh cao cấp cái gì cũng có. Tiết kiệm thời gian đi tìm kiếm.', rating: 4.7, avatar: 'T' },
                    { name: 'Chị Hồng', role: 'Chủ cửa hàng (Củ Chi)', comment: 'Tôi thường xuyên nhập hàng sỉ ở đây, chiết khấu tốt và giao hàng đúng hẹn là điều tôi đánh giá cao nhất.', rating: 4.9, avatar: 'H' }
                  ].map((review, i) => (
                    <div
                      key={i}
                      className="min-w-[calc(33.33%-16px)] bg-white p-8 rounded-3xl shadow-lg border border-slate-100 hover:shadow-2xl transition-all duration-500 flex flex-col group relative overflow-hidden"
                    >
                      <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                        <Quote className="w-16 h-16 text-slate-900" />
                      </div>

                      <div className="flex gap-1 text-yellow-500 mb-6">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star key={star} className={`w-4 h-4 ${star <= Math.floor(review.rating) ? 'fill-current' : 'text-slate-200'}`} />
                        ))}
                      </div>

                      <p className="text-slate-600 italic mb-8 leading-relaxed flex-grow text-sm">"{review.comment}"</p>

                      <div className="flex items-center gap-4 border-t border-slate-50 pt-6">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-lg shadow-md uppercase">
                          {review.avatar}
                        </div>
                        <div>
                          <h4 className="font-bold text-slate-900 text-sm">{review.name}</h4>
                          <p className="text-[11px] text-slate-500 font-medium uppercase tracking-wider">{review.role}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Carousel Controls */}
              <button
                onClick={() => setContractorIndex(prev => Math.max(0, prev - 1))}
                className={`absolute left-0 top-1/2 -translate-y-1/2 -translate-x-6 w-12 h-12 bg-white rounded-full shadow-xl border border-slate-100 flex items-center justify-center hover:bg-slate-50 transition-all ${contractorIndex === 0 ? 'opacity-0 invisible' : 'opacity-100 visible'}`}
              >
                <ChevronRight className="w-6 h-6 rotate-180 text-slate-600" />
              </button>
              <button
                onClick={() => setContractorIndex(prev => Math.min(5, prev + 1))}
                className={`absolute right-0 top-1/2 -translate-y-1/2 translate-x-6 w-12 h-12 bg-white rounded-full shadow-xl border border-slate-100 flex items-center justify-center hover:bg-slate-50 transition-all ${contractorIndex >= 5 ? 'opacity-0 invisible' : 'opacity-100 visible'}`}
              >
                <ChevronRight className="w-6 h-6 text-slate-600" />
              </button>
            </div>

            {/* Partner Logo Infinite Scroller */}
            <div className="pt-24 border-t border-slate-200 mt-20 relative overflow-hidden">
              <p className="text-center text-[11px] font-black text-slate-500 underline underline-offset-8 decoration-blue-500 uppercase tracking-[0.4em] mb-12">Đối tác cung ứng vật liệu chiến lược</p>

              <style dangerouslySetInnerHTML={{
                __html: `
                @keyframes scroll {
                  0% { transform: translateX(0); }
                  100% { transform: translateX(-50%); }
                }
                .logo-scroller {
                  display: flex;
                  width: fit-content;
                  animation: scroll 30s linear infinite;
                }
                .logo-scroller:hover {
                  animation-play-state: paused;
                }
              `}} />

              <div className="logo-scroller gap-16 items-center">
                {[...partners, ...partners].map((p, i) => {
                  const key = `${i < partners.length ? 'orig' : 'dup'}-${i % partners.length}`
                  const isLoaded = loadedLogos.has(key)

                  return (
                    <div key={key} className={`flex items-center justify-center min-w-[220px] h-24 px-8 rounded-2xl transition-all hover:scale-105 duration-500 pointer-events-auto cursor-pointer ${p.color} border border-transparent shadow-sm group relative overflow-hidden`}>

                      {/* Fallback Text - Visible until loaded OR if failed */}
                      <span
                        className={`absolute inset-0 flex items-center justify-center font-black text-sm tracking-tighter ${p.text} whitespace-nowrap uppercase transition-opacity duration-500 ${(isLoaded && !failedLogos.has(key)) ? 'opacity-0' : 'opacity-100'}`}
                      >
                        {p.name}
                      </span>

                      {/* Logo Image - Fades in on load */}
                      {/* Logo Image - Fades in on load */}
                      {p.logo && (
                        <img
                          src={p.logo}
                          alt={p.name}
                          className={`relative z-10 h-10 md:h-12 object-contain max-w-full drop-shadow-sm group-hover:drop-shadow-md transition-all duration-500 ${isLoaded ? 'opacity-100 scale-100' : 'opacity-0 scale-90'}`}
                          onLoad={() => setLoadedLogos(prev => new Set(prev).add(key))}
                          onError={(e) => {
                            setFailedLogos(prev => new Set(prev).add(key))
                            e.currentTarget.style.display = 'none'
                          }}
                        />
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </section>

        {/* Registration Incentive Section */}
        {!isAuthenticated && (
          <section className="py-24 bg-white overflow-hidden relative">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
              <div className="bg-gradient-to-br from-indigo-600 to-blue-700 rounded-[3rem] p-12 md:p-20 text-white shadow-2xl relative overflow-hidden">
                {/* Abstract background elements */}
                <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/4 w-96 h-96 bg-white/10 rounded-full blur-3xl"></div>
                <div className="absolute bottom-0 left-0 translate-y-1/4 -translate-x-1/4 w-96 h-96 bg-blue-400/20 rounded-full blur-3xl"></div>

                <div className="grid lg:grid-cols-2 gap-16 items-center">
                  <div>
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-md rounded-full text-xs font-black tracking-widest uppercase mb-8 border border-white/20">
                      <Zap className="w-3 h-3 text-yellow-300" />
                      Đặc quyền thành viên
                    </div>
                    <h2 className="text-4xl md:text-5xl font-black mb-8 leading-tight tracking-tight">
                      Xây Dựng Thông Minh Hơn Với <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-orange-400">SmartBuild Member</span>
                    </h2>
                    <p className="text-blue-100 text-lg mb-12 leading-relaxed opacity-90">
                      Đừng chỉ là người xem. Hãy trở thành một phần của cộng đồng xây dựng hiện đại nhất Việt Nam để nhận được những công cụ và ưu đãi độc quyền.
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-12">
                      {[
                        { icon: Clock, title: "Lưu lịch sử", desc: "Không bao giờ mất lịch sử chat & dự toán" },
                        { icon: TrendingUp, title: "Giá ưu đãi", desc: "Chiết khấu riêng cho thành viên" },
                        { icon: LayoutGrid, title: "Quản lý dự án", desc: "Theo dõi tiến độ & vật tư thông minh" },
                        { icon: ShieldCheck, title: "Ưu tiên hỗ trợ", desc: "Kết nối trực tiếp với đội ngũ kỹ thuật" }
                      ].map((benefit, i) => (
                        <div key={i} className="flex gap-4 items-start">
                          <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center flex-shrink-0 border border-white/10">
                            <benefit.icon className="w-5 h-5 text-white" />
                          </div>
                          <div>
                            <h4 className="font-bold text-sm text-white">{benefit.title}</h4>
                            <p className="text-[11px] text-blue-100 opacity-70 mt-0.5">{benefit.desc}</p>
                          </div>
                        </div>
                      ))}
                    </div>

                    <Link
                      href="/register"
                      className="inline-flex items-center justify-center px-10 py-5 bg-white text-indigo-700 rounded-2xl font-black text-lg shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-all"
                    >
                      <UserPlus className="w-5 h-5 mr-3" />
                      Đăng Ký Tài Khoản Ngay
                    </Link>
                  </div>

                  <div className="relative group">
                    <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl transform group-hover:rotate-1 transition-transform duration-500">
                      <div className="flex items-center justify-between mb-8">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-lg">
                            <span className="text-indigo-600 font-black text-xl">S</span>
                          </div>
                          <div>
                            <p className="font-black text-white">Guest vs Member</p>
                            <p className="text-[10px] text-blue-100 opacity-60">So sánh quyền lợi</p>
                          </div>
                        </div>
                        <div className="px-3 py-1 bg-green-400 text-green-950 font-black text-[10px] rounded-full uppercase tracking-tighter">FREE ACCOUNT</div>
                      </div>

                      <div className="space-y-4">
                        {[
                          { feature: "Xem sản phẩm & giá", guest: true, member: true },
                          { feature: "Sử dụng AI Dự toán", guest: true, member: true },
                          { feature: "Lưu trữ lịch sử tìm kiếm", guest: false, member: true },
                          { feature: "Theo dõi dự án realtime", guest: false, member: true },
                          { feature: "Ưu đãi giá (Member Price)", guest: false, member: true },
                          { feature: "Tích lũy điểm thưởng", guest: false, member: true }
                        ].map((f, i) => (
                          <div key={i} className="flex items-center justify-between p-3 rounded-xl hover:bg-white/5 transition-colors border border-white/5">
                            <span className="text-xs font-medium text-blue-50 text-opacity-80">{f.feature}</span>
                            <div className="flex gap-4 items-center">
                              <div className={`w-5 h-5 rounded-full flex items-center justify-center ${f.guest ? 'bg-white/10' : 'bg-red-500/20'}`}>
                                {f.guest ? <ShieldCheck className="w-3 h-3 text-white/40" /> : <ChevronRight className="w-3 h-3 text-red-400 rotate-90" />}
                              </div>
                              <div className="w-5 h-5 rounded-full bg-green-400 flex items-center justify-center shadow-lg shadow-green-400/20">
                                <ShieldCheck className="w-3 h-3 text-green-950" />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="mt-8 text-center">
                        <p className="text-[10px] text-blue-100 opacity-50 italic">Bạn chỉ mất 30 giây để nhận toàn bộ đặc quyền trên</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Footer CTA */}
        <section className="bg-slate-900 text-white py-16">
          <div className="max-w-4xl mx-auto text-center px-4">
            <h2 className="text-3xl font-bold mb-4">Sẵn sàng bắt đầu dự án của bạn?</h2>
            <p className="text-blue-100 mb-8 text-lg">Tham gia cùng hàng ngàn khách hàng và nhà thầu đang sử dụng nền tảng của chúng tôi.</p>
            <div className="flex gap-4 justify-center">
              <Link href="/products" className="bg-white text-blue-900 px-8 py-3 rounded-lg font-bold hover:bg-blue-50 transition-colors shadow-lg">
                Xem Sản Phẩm
              </Link>
              <Link href="/contractors" className="bg-blue-800 border border-blue-700 text-white px-8 py-3 rounded-lg font-bold hover:bg-blue-700 transition-colors">
                Tìm Nhà Thầu
              </Link>
            </div>
          </div>
        </section>
      </main>

    </div>
  )
}