'use client'

import React, { useRef, useState, useEffect, useCallback } from 'react'
import Image from 'next/image'
import { Search, MapPin, Package, HardHat, TrendingUp, ChevronDown, ArrowRight, ShieldCheck } from 'lucide-react'
import { TOP_SEARCHES, LOCATIONS } from '@/config/home-data'
import Link from 'next/link'

interface HeroProps {
    searchQuery: string
    setSearchQuery: (query: string) => void
    activeSearchTab: 'products' | 'contractors'
    setActiveSearchTab: (tab: 'products' | 'contractors') => void
    isSearchFocused: boolean
    setIsSearchFocused: (focused: boolean) => void
    searchSuggestions: any[]
    contractorSuggestions: any[]
    featuredContractors: any[]
    contractorSearchLoading: boolean
    selectedLocation: string
    setSelectedLocation: (loc: string) => void
}

export default function Hero({
    searchQuery,
    setSearchQuery,
    activeSearchTab,
    setActiveSearchTab,
    isSearchFocused,
    setIsSearchFocused,
    searchSuggestions,
    contractorSuggestions,
    featuredContractors,
    contractorSearchLoading,
    selectedLocation,
    setSelectedLocation
}: HeroProps) {
    const [isLocationOpen, setIsLocationOpen] = useState(false)
    const [dropdownDirection, setDropdownDirection] = useState<'up' | 'down'>('down')
    const searchInputRef = useRef<HTMLInputElement>(null)

    const calculateDropdownDirection = useCallback(() => {
        if (searchInputRef.current) {
            const rect = searchInputRef.current.getBoundingClientRect()
            const spaceBelow = window.innerHeight - rect.bottom - 20
            const dropdownHeight = 350
            setDropdownDirection(spaceBelow < dropdownHeight ? 'up' : 'down')
        }
    }, [])

    useEffect(() => {
        if (isSearchFocused) {
            calculateDropdownDirection()
            window.addEventListener('scroll', calculateDropdownDirection)
            return () => window.removeEventListener('scroll', calculateDropdownDirection)
        }
    }, [isSearchFocused, calculateDropdownDirection])

    return (
        <section className="relative min-h-[600px] flex items-center pt-12 pb-32 z-40 overflow-hidden">
            {/* Background with advanced effects */}
            <div className="absolute inset-0 z-0 overflow-hidden">
                <Image
                    src="/images/hero_bg.png"
                    alt="Construction Site"
                    fill
                    className="object-cover scale-105 animate-slow-zoom"
                    priority
                />
                <div className="absolute inset-0 bg-gradient-to-r from-blue-950 via-blue-900/90 to-slate-900/80 z-10"></div>

                {/* Decorative Orbs */}
                <div className="absolute top-1/4 -left-20 w-[500px] h-[500px] bg-indigo-500/20 rounded-full blur-[120px] z-10 animate-pulse"></div>
                <div className="absolute bottom-1/4 -right-20 w-[500px] h-[500px] bg-blue-500/20 rounded-full blur-[120px] z-10 animate-pulse delay-700"></div>

                {/* Bottom Transition */}
                <div className="absolute bottom-0 left-0 right-0 h-48 bg-gradient-to-t from-slate-50 to-transparent z-20"></div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                <div className="text-center max-w-5xl mx-auto">
                    {/* Badge */}
                    <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white/5 border border-white/10 backdrop-blur-xl text-blue-200 text-[11px] font-black tracking-widest mb-10 animate-fade-in-up uppercase">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-400"></span>
                        </span>
                        Kỷ Nguyên Vật Tư Số 4.0
                    </div>

                    <h1 className="text-5xl md:text-7xl font-black mb-8 leading-[1.05] tracking-tighter text-white animate-fade-in-up">
                        Nền Tảng Cung Cấp <br className="hidden lg:block" />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-300 to-sky-300 animate-gradient-text">
                            Vật Liệu Xây Dựng
                        </span> Thông Minh
                    </h1>

                    <p className="text-lg md:text-xl text-slate-300 mb-12 max-w-2xl mx-auto leading-relaxed font-medium animate-fade-in-up delay-100 opacity-90">
                        Kết nối trực tiếp nhà thầu với nguồn hàng uy tín. Tối ưu chi phí, minh bạch quy trình, bảo đảm tiến độ cho mọi công trình.
                    </p>

                    {/* Search Tabs */}
                    <div className="flex justify-center translate-y-[1px] animate-fade-in-up delay-200">
                        <div className="bg-slate-900/40 backdrop-blur-2xl p-1.5 rounded-t-[1.5rem] flex gap-1 border-x border-t border-white/10">
                            <button
                                onClick={() => setActiveSearchTab('products')}
                                className={`px-8 py-3.5 rounded-t-2xl text-[11px] font-black transition-all flex items-center gap-2.5 uppercase tracking-wider ${activeSearchTab === 'products' ? 'bg-white text-indigo-950 shadow-2xl' : 'text-blue-100/60 hover:text-white hover:bg-white/5'}`}
                            >
                                <Package className="w-4 h-4" /> Mua Vật Tư
                            </button>
                            <button
                                onClick={() => setActiveSearchTab('contractors')}
                                className={`px-8 py-3.5 rounded-t-2xl text-[11px] font-black transition-all flex items-center gap-2.5 uppercase tracking-wider ${activeSearchTab === 'contractors' ? 'bg-white text-indigo-950 shadow-2xl' : 'text-blue-100/60 hover:text-white hover:bg-white/5'}`}
                            >
                                <HardHat className="w-4 h-4" /> Tìm Nhà Thầu
                            </button>
                        </div>
                    </div>

                    {/* Search Bar */}
                    <div className="bg-white p-2 rounded-[2rem] rounded-tr-none shadow-[0_30px_100px_rgba(0,0,0,0.3)] max-w-4xl mx-auto flex flex-col md:flex-row gap-2 border border-blue-100/20 relative z-30 animate-fade-in-up delay-300">
                        <div className="flex-[2] relative flex items-center px-6 border-b md:border-b-0 md:border-r border-slate-100 group">
                            <Search className="h-5 w-5 text-indigo-500 mr-4 group-focus-within:scale-110 transition-transform" />
                            <input
                                ref={searchInputRef}
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                onFocus={() => setIsSearchFocused(true)}
                                onBlur={() => setTimeout(() => setIsSearchFocused(false), 200)}
                                placeholder={activeSearchTab === 'products' ? "Tên vật liệu, thương hiệu, mã số..." : "Tên thầu, đội thợ, khu vực..."}
                                className="w-full py-4 outline-none text-slate-800 placeholder-slate-400 font-bold text-lg bg-transparent"
                            />

                            {/* Suggestions */}
                            {isSearchFocused && (
                                <div className={`absolute left-0 right-0 bg-white rounded-[2rem] shadow-2xl border border-slate-100 overflow-hidden z-50 animate-in fade-in slide-in-from-top-4 duration-300 max-h-[400px] overflow-y-auto ${dropdownDirection === 'up' ? 'bottom-full mb-4' : 'top-full mt-4'}`}>
                                    {activeSearchTab === 'products' ? (
                                        <div className="p-4">
                                            {searchQuery.length === 0 ? (
                                                <>
                                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4 px-3">Xu hướng tìm kiếm</p>
                                                    <div className="space-y-1">
                                                        {TOP_SEARCHES.map((item, idx) => (
                                                            <button key={idx} onClick={() => setSearchQuery(item.name)} className="w-full flex items-center justify-between px-4 py-3 hover:bg-indigo-50 rounded-2xl transition-all group text-left">
                                                                <span className="text-sm font-bold text-slate-700 group-hover:text-indigo-600 flex items-center gap-3">
                                                                    <TrendingUp className="w-4 h-4 text-indigo-400" /> {item.name}
                                                                </span>
                                                                <span className="text-[9px] px-2 py-1 bg-slate-100 text-slate-500 rounded-lg font-black uppercase">{item.tag}</span>
                                                            </button>
                                                        ))}
                                                    </div>
                                                </>
                                            ) : (
                                                <div className="p-2 space-y-1">
                                                    {searchSuggestions.map((item, idx) => (
                                                        <button key={idx} className="w-full flex items-center justify-between px-4 py-3.5 hover:bg-indigo-50 rounded-2xl transition-all group text-left">
                                                            <div className="flex items-center gap-4">
                                                                <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center">
                                                                    <Package className="w-5 h-5 text-slate-400" />
                                                                </div>
                                                                <div>
                                                                    <p className="text-sm font-bold text-slate-800 group-hover:text-indigo-600">{item.name}</p>
                                                                    <p className="text-xs font-black text-indigo-500">{item.price}</p>
                                                                </div>
                                                            </div>
                                                            <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-indigo-500 group-hover:translate-x-1 transition-all" />
                                                        </button>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="p-4">
                                            {/* Contractor rendering similar to product suggestions */}
                                            {/* ... (Keep it consistent with product view) */}
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4 px-3">Nhà thầu uy tín</p>
                                            {/* ... contractor specific items ... */}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {activeSearchTab === 'contractors' && (
                            <div className="flex-1 relative">
                                <button
                                    onClick={() => setIsLocationOpen(!isLocationOpen)}
                                    className="w-full h-full flex items-center px-6 py-4 text-left outline-none cursor-pointer group"
                                >
                                    <MapPin className="h-5 w-5 text-indigo-400 mr-4 group-hover:scale-110 transition-transform" />
                                    <span className="flex-1 text-slate-700 font-bold truncate text-base">{selectedLocation}</span>
                                    <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform duration-300 ${isLocationOpen ? 'rotate-180' : ''}`} />
                                </button>

                                {isLocationOpen && (
                                    <div className="absolute top-full mt-4 left-0 w-full bg-white rounded-[2rem] shadow-2xl border border-slate-100 overflow-hidden z-[100] p-3 max-h-[300px] overflow-y-auto animate-in fade-in slide-in-from-top-2">
                                        {LOCATIONS.map((loc) => (
                                            <button
                                                key={loc}
                                                onClick={() => { setSelectedLocation(loc); setIsLocationOpen(false); }}
                                                className={`w-full px-5 py-3 text-left text-sm font-bold rounded-xl transition-all flex items-center gap-3 ${selectedLocation === loc ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-50'}`}
                                            >
                                                <MapPin className="w-4 h-4 opacity-40" /> {loc}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        <button className="bg-indigo-600 hover:bg-indigo-700 text-white font-black py-4 px-12 rounded-[1.5rem] transition-all w-full md:w-auto shadow-xl shadow-indigo-100 active:scale-95 flex items-center justify-center gap-3 tracking-widest text-sm">
                            TÌM KIẾM
                        </button>
                    </div>

                    {/* Quick Stats */}
                    <div className="mt-20 flex justify-center animate-fade-in-up delay-400">
                        <div className="bg-white/5 backdrop-blur-2xl border border-white/10 px-10 py-6 rounded-[2.5rem] shadow-2xl flex flex-wrap justify-center gap-x-16 gap-y-6">
                            {[
                                { label: 'Sản phẩm', value: '100% Chính hãng', icon: ShieldCheck, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
                                { label: 'Chính sách', value: 'Giá cạnh tranh', icon: TrendingUp, color: 'text-indigo-400', bg: 'bg-indigo-500/10' },
                                { label: 'Dịch vụ', value: 'Giao hàng 24h', icon: Package, color: 'text-sky-400', bg: 'bg-sky-500/10' }
                            ].map((stat, i) => (
                                <div key={i} className="flex items-center gap-4 group cursor-default">
                                    <div className={`w-12 h-12 rounded-2xl ${stat.bg} flex items-center justify-center border border-white/5 group-hover:scale-110 transition-transform duration-500`}>
                                        <stat.icon className={`w-5 h-5 ${stat.color}`} />
                                    </div>
                                    <div className="text-left">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">{stat.label}</p>
                                        <p className="text-sm font-bold text-white">{stat.value}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </section>
    )
}
