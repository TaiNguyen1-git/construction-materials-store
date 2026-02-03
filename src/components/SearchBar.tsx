'use client'

import { useState, useEffect, useRef } from 'react'
import { Search, X, Loader2, Package, ArrowRight, Sparkles } from 'lucide-react'
import { useRouter, useSearchParams } from 'next/navigation'
import Image from 'next/image'

interface Suggestion {
  id: string
  name: string
  category?: string
  image?: string
}

export default function SearchBar() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [query, setQuery] = useState(searchParams.get('q') || '')
  const [isSearching, setIsSearching] = useState(false)
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  // Sync query with URL params
  useEffect(() => {
    setQuery(searchParams.get('q') || '')
  }, [searchParams])

  // Click outside to close suggestions
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShowSuggestions(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Live filter and suggestions
  useEffect(() => {
    const fetchSuggestions = async () => {
      if (!query.trim() || query.length < 1) {
        setSuggestions([])
        setShowSuggestions(false)
        return
      }

      setIsLoadingSuggestions(true)
      try {
        // Debounced search could be implemented here for production
        const response = await fetch(`/api/products?q=${encodeURIComponent(query)}&limit=5`)
        if (response.ok) {
          const result = await response.json()
          if (result.success && result.data?.data) {
            setSuggestions(result.data.data.map((p: any) => ({
              id: p.id,
              name: p.name,
              category: p.category?.name,
              image: p.images?.[0]
            })))
            setShowSuggestions(true)
          }
        }

        // Live filter on Products page: Update URL without full reload
        if (window.location.pathname === '/products') {
          const params = new URLSearchParams(searchParams.toString())
          if (query.trim()) {
            params.set('q', query.trim())
          } else {
            params.delete('q')
          }
          // Avoid pushing same query to history repeatedly
          router.replace(`/products?${params.toString()}`, { scroll: false })
        }
      } catch (error) {
        console.error('Failed to fetch suggestions:', error)
      } finally {
        setIsLoadingSuggestions(false)
      }
    }

    const timer = setTimeout(fetchSuggestions, 300)
    return () => clearTimeout(timer)
  }, [query, searchParams, router])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (!query.trim()) return

    setIsSearching(true)
    setShowSuggestions(false)
    router.push(`/products?q=${encodeURIComponent(query.trim())}`)
    setTimeout(() => setIsSearching(false), 500)
  }

  const clearSearch = () => {
    setQuery('')
    setShowSuggestions(false)
    router.push('/products')
  }

  const selectSuggestion = (s: Suggestion) => {
    setQuery(s.name)
    setShowSuggestions(false)
    router.push(`/products?q=${encodeURIComponent(s.name)}`)
  }

  return (
    <div ref={containerRef} className="relative w-full group">
      <form onSubmit={handleSearch} className="relative z-30">
        <div className="relative">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => query.trim() && setShowSuggestions(true)}
            placeholder="Tìm vật liệu: xi măng, thép, đá 1x2..."
            className="w-full pl-16 pr-32 py-5 bg-white border border-slate-100 rounded-[2rem] shadow-[0_15px_40px_rgba(0,0,0,0.02)] focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/5 transition-all outline-none text-slate-900 font-medium placeholder:text-slate-400"
          />
          <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
            {query && !isSearching && !isLoadingSuggestions && (
              <button
                type="button"
                onClick={clearSearch}
                className="p-2 hover:bg-slate-50 text-slate-400 hover:text-red-500 rounded-xl transition-all"
              >
                <X className="h-4 w-4" />
              </button>
            )}
            {(isSearching || isLoadingSuggestions) && (
              <div className="p-2">
                <Loader2 className="h-4 w-4 text-indigo-600 animate-spin" />
              </div>
            )}
            <button
              type="submit"
              className="bg-indigo-600 text-white px-6 py-2.5 rounded-2xl hover:bg-indigo-700 transition-all font-black text-[10px] uppercase tracking-widest shadow-xl shadow-indigo-100 active:scale-95 hidden sm:block"
            >
              Tìm kiếm
            </button>
          </div>
        </div>
      </form>

      {/* Suggestions Dropdown */}
      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-3 pt-4 pb-2 bg-white/95 backdrop-blur-xl rounded-[2rem] shadow-[0_30px_60px_rgba(0,0,0,0.12)] border border-slate-50 z-20 animate-in fade-in slide-in-from-top-2 duration-300 overflow-hidden">
          <div className="px-6 py-2 mb-2">
            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <Sparkles className="w-3 h-3 text-indigo-500" />
              Gợi ý kết quả
            </h4>
          </div>
          <div className="max-h-[350px] overflow-y-auto px-2">
            {suggestions.map((s) => (
              <button
                key={s.id}
                onClick={() => selectSuggestion(s)}
                className="w-full flex items-center gap-4 p-3 hover:bg-slate-50 rounded-2xl transition-all text-left group/item"
              >
                <div className="w-12 h-12 bg-slate-100 rounded-xl overflow-hidden flex-shrink-0 relative border border-slate-50">
                  {s.image ? (
                    <img src={s.image} alt={s.name} className="w-full h-full object-cover group-hover/item:scale-110 transition-transform duration-500" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Package className="w-5 h-5 text-slate-300" />
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <h5 className="text-sm font-bold text-slate-900 group-hover/item:text-indigo-600 transition-colors line-clamp-1">{s.name}</h5>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{s.category}</p>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-200 group-hover/item:text-indigo-400 -translate-x-2 opacity-0 group-hover/item:translate-x-0 group-hover/item:opacity-100 transition-all" />
              </button>
            ))}
          </div>
          <div className="px-4 mt-2">
            <button
              onClick={handleSearch}
              className="w-full py-3 bg-slate-50 hover:bg-indigo-50 rounded-xl text-[10px] font-black text-slate-400 hover:text-indigo-600 transition-all uppercase tracking-widest"
            >
              Xem tất cả kết quả cho "{query}"
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
