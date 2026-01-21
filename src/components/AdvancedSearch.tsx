'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Search, X, Clock, TrendingUp, Package } from 'lucide-react'

interface SearchSuggestion {
  id: string
  name: string
  type: 'product' | 'category' | 'history'
  image?: string
  price?: number
  categoryName?: string
}

interface AdvancedSearchProps {
  onClose?: () => void
  autoFocus?: boolean
}

export default function AdvancedSearch({ onClose, autoFocus = false }: AdvancedSearchProps) {
  const router = useRouter()
  const [query, setQuery] = useState('')
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([])
  const [searchHistory, setSearchHistory] = useState<string[]>([])
  const [popularSearches] = useState(['Xi măng', 'Gạch', 'Sắt thép', 'Cát xây dựng'])
  const [loading, setLoading] = useState(false)
  const [showSuggestions, setShowSuggestions] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    // Load search history from localStorage
    const history = localStorage.getItem('searchHistory')
    if (history) {
      setSearchHistory(JSON.parse(history))
    }

    if (autoFocus && inputRef.current) {
      inputRef.current.focus()
    }
  }, [autoFocus])

  useEffect(() => {
    if (query.length >= 2) {
      // Debounce search
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current)
      }

      searchTimeoutRef.current = setTimeout(() => {
        fetchSuggestions(query)
      }, 300)
    } else {
      setSuggestions([])
    }

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current)
      }
    }
  }, [query])

  const fetchSuggestions = async (searchQuery: string) => {
    try {
      setLoading(true)
      const response = await fetch(`/api/products?search=${encodeURIComponent(searchQuery)}&limit=5`)

      if (response.ok) {
        const result = await response.json()
        const products = result.data?.items || result.data || []

        const productSuggestions: SearchSuggestion[] = products.map((product: any) => ({
          id: product.id,
          name: product.name,
          type: 'product' as const,
          image: product.images?.[0],
          price: product.price,
          categoryName: product.category?.name
        }))

        setSuggestions(productSuggestions)
      }
    } catch (error) {
      console.error('Failed to fetch suggestions:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (searchQuery?: string) => {
    const finalQuery = searchQuery || query
    if (!finalQuery.trim()) return

    // Save to search history
    const newHistory = [finalQuery, ...searchHistory.filter(h => h !== finalQuery)].slice(0, 10)
    setSearchHistory(newHistory)
    localStorage.setItem('searchHistory', JSON.stringify(newHistory))

    // Navigate to products page with search
    router.push(`/products?search=${encodeURIComponent(finalQuery)}`)
    setShowSuggestions(false)
    setQuery('')
    if (onClose) onClose()
  }

  const handleSuggestionClick = (suggestion: SearchSuggestion) => {
    if (suggestion.type === 'product') {
      router.push(`/products/${suggestion.id}`)
      if (onClose) onClose()
    } else {
      handleSearch(suggestion.name)
    }
  }

  const clearHistory = () => {
    setSearchHistory([])
    localStorage.removeItem('searchHistory')
  }

  const removeFromHistory = (item: string) => {
    const newHistory = searchHistory.filter(h => h !== item)
    setSearchHistory(newHistory)
    localStorage.setItem('searchHistory', JSON.stringify(newHistory))
  }

  return (
    <div className="relative w-full max-w-2xl">
      {/* Search Input */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-gray-400" />
        </div>
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            setShowSuggestions(true)
          }}
          onFocus={() => setShowSuggestions(true)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              handleSearch()
            } else if (e.key === 'Escape') {
              setShowSuggestions(false)
              if (onClose) onClose()
            }
          }}
          placeholder="Tìm kiếm sản phẩm, danh mục..."
          className="w-full pl-12 pr-12 py-3 border-2 border-gray-300 rounded-xl focus:border-primary-500 focus:ring-2 focus:ring-primary-200 transition-all outline-none text-lg"
        />
        {query && (
          <button
            onClick={() => {
              setQuery('')
              setSuggestions([])
              inputRef.current?.focus()
            }}
            className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* Suggestions Dropdown */}
      {showSuggestions && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-2xl border-2 border-gray-100 max-h-96 overflow-y-auto z-50">
          {/* Loading */}
          {loading && (
            <div className="p-4 text-center text-gray-500">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600 mx-auto"></div>
              <p className="text-sm mt-2">Đang tìm kiếm...</p>
            </div>
          )}

          {/* Product Suggestions */}
          {!loading && suggestions.length > 0 && (
            <div>
              <div className="px-4 py-2 bg-gray-50 text-xs font-bold text-gray-600 uppercase">
                Sản phẩm
              </div>
              {suggestions.map((suggestion) => (
                <button
                  key={suggestion.id}
                  onClick={() => handleSuggestionClick(suggestion)}
                  className="w-full px-4 py-3 hover:bg-gray-50 transition-colors flex items-center gap-3 text-left"
                >
                  {suggestion.image ? (
                    <img
                      src={suggestion.image}
                      alt={suggestion.name}
                      className="w-12 h-12 object-cover rounded-lg"
                    />
                  ) : (
                    <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center">
                      <Package className="h-6 w-6 text-gray-400" />
                    </div>
                  )}
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900 line-clamp-1">{suggestion.name}</p>
                    {suggestion.categoryName && (
                      <p className="text-xs text-gray-500">{suggestion.categoryName}</p>
                    )}
                  </div>
                  {suggestion.price && (
                    <div className="text-primary-600 font-bold">
                      {suggestion.price.toLocaleString()}đ
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}

          {/* No Results */}
          {!loading && query.length >= 2 && suggestions.length === 0 && (
            <div className="p-8 text-center text-gray-500">
              <Search className="h-12 w-12 mx-auto mb-2 text-gray-300" />
              <p>Không tìm thấy kết quả cho &quot;{query}&quot;</p>
              <button
                onClick={() => handleSearch()}
                className="mt-4 text-primary-600 hover:text-primary-700 font-semibold"
              >
                Tìm kiếm tất cả
              </button>
            </div>
          )}

          {/* Search History */}
          {!query && searchHistory.length > 0 && (
            <div>
              <div className="px-4 py-2 bg-gray-50 text-xs font-bold text-gray-600 uppercase flex items-center justify-between">
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  Tìm kiếm gần đây
                </span>
                <button
                  onClick={clearHistory}
                  className="text-primary-600 hover:text-primary-700 normal-case"
                >
                  Xóa
                </button>
              </div>
              {searchHistory.map((item, index) => (
                <div
                  key={index}
                  className="px-4 py-3 hover:bg-gray-50 transition-colors flex items-center gap-3"
                >
                  <Clock className="h-4 w-4 text-gray-400 flex-shrink-0" />
                  <button
                    onClick={() => handleSearch(item)}
                    className="flex-1 text-left text-gray-700 hover:text-gray-900"
                  >
                    {item}
                  </button>
                  <button
                    onClick={() => removeFromHistory(item)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Popular Searches */}
          {!query && (
            <div>
              <div className="px-4 py-2 bg-gray-50 text-xs font-bold text-gray-600 uppercase flex items-center gap-1">
                <TrendingUp className="h-3 w-3" />
                Tìm kiếm phổ biến
              </div>
              <div className="p-3 flex flex-wrap gap-2">
                {popularSearches.map((item, index) => (
                  <button
                    key={index}
                    onClick={() => handleSearch(item)}
                    className="px-3 py-1.5 bg-gray-100 hover:bg-primary-50 text-gray-700 hover:text-primary-700 rounded-lg text-sm font-medium transition-colors"
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Backdrop */}
      {showSuggestions && (
        <div
          className="fixed inset-0 bg-black/20 z-40"
          onClick={() => setShowSuggestions(false)}
        />
      )}
    </div>
  )
}
