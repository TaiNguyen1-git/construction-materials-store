'use client'

import { useState, useEffect, useTransition } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Search, ChevronDown, Sparkles, Loader2 } from 'lucide-react'

interface Category {
    id: string
    name: string
    slug: string
}

interface BlogFiltersProps {
    categories: Category[]
}

export default function BlogFilters({ categories }: BlogFiltersProps) {
    const router = useRouter()
    const searchParams = useSearchParams()
    const [isPending, startTransition] = useTransition()

    const currentCategoryId = searchParams.get('categoryId') || null
    const currentSort = searchParams.get('sortBy') || 'publishedAt'
    const currentSearch = searchParams.get('search') || ''

    const [searchTerm, setSearchTerm] = useState(currentSearch)
    const [isSortOpen, setIsSortOpen] = useState(false)
    const [localCategoryId, setLocalCategoryId] = useState<string | null>(currentCategoryId)

    // Sync local state with URL
    useEffect(() => {
        setLocalCategoryId(currentCategoryId)
    }, [currentCategoryId])

    // Debounce search
    useEffect(() => {
        const timer = setTimeout(() => {
            if (searchTerm !== (searchParams.get('search') || '')) {
                updateFilters({ search: searchTerm, page: '1' })
            }
        }, 300)
        return () => clearTimeout(timer)
    }, [searchTerm])

    const updateFilters = (updates: Record<string, string | null>) => {
        if (updates.categoryId !== undefined) {
            setLocalCategoryId(updates.categoryId)
        }

        const params = new URLSearchParams(searchParams.toString())
        
        Object.entries(updates).forEach(([key, value]) => {
            if (value === null) {
                params.delete(key)
            } else {
                params.set(key, value)
            }
        })

        startTransition(() => {
            router.push(`/blog?${params.toString()}`, { scroll: false })
        })
    }

    const prefetchFilter = (updates: Record<string, string | null>) => {
        const params = new URLSearchParams(searchParams.toString())
        Object.entries(updates).forEach(([key, value]) => {
            if (value === null) params.delete(key)
            else params.set(key, value)
        })
        router.prefetch(`/blog?${params.toString()}`)
    }

    return (
        <div className="max-w-7xl mx-auto px-6 -mt-12 relative z-20">
            {/* Subtle Loading Bar */}
            <div className={`absolute -top-1 left-8 right-8 h-1 bg-primary-600/20 rounded-full overflow-hidden transition-opacity duration-300 ${isPending ? 'opacity-100' : 'opacity-0'}`}>
                <div className="h-full bg-primary-600 animate-[loading-bar_1.5s_infinite_linear] w-1/3 rounded-full"></div>
            </div>

            <div className={`bg-white/90 backdrop-blur-xl border border-neutral-100 p-2.5 rounded-[2rem] shadow-2xl flex flex-col md:flex-row items-center gap-4 ring-1 ring-black/5 transition-all duration-300 ${isPending ? 'ring-primary-500/20 shadow-primary-500/10' : ''}`}>
                <div className="flex items-center gap-2 overflow-x-auto w-full md:flex-1 p-1 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                    <button 
                        onClick={() => updateFilters({ categoryId: null, page: '1' })}
                        onMouseEnter={() => prefetchFilter({ categoryId: null, page: '1' })}
                        className={`px-8 py-3 rounded-full text-[11px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${!localCategoryId ? 'bg-primary-600 text-white shadow-lg shadow-primary-200' : 'text-neutral-400 hover:text-neutral-900 hover:bg-neutral-50'}`}
                    >
                        Tất cả
                    </button>
                    {categories.map(cat => (
                        <button 
                            key={cat.id}
                            onClick={() => updateFilters({ categoryId: cat.id, page: '1' })}
                            onMouseEnter={() => prefetchFilter({ categoryId: cat.id, page: '1' })}
                            className={`px-8 py-3 rounded-full text-[11px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${localCategoryId === cat.id ? 'bg-primary-600 text-white shadow-lg shadow-primary-200' : 'text-neutral-400 hover:text-neutral-900 hover:bg-neutral-50'}`}
                        >
                            {cat.name}
                        </button>
                    ))}
                </div>
                <div className="flex gap-2 w-full md:w-auto mt-2 md:mt-0">
                    <div className="relative z-50">
                        <button 
                            onClick={() => setIsSortOpen(!isSortOpen)}
                            className="px-6 py-3.5 bg-white border border-blue-100 rounded-full text-[11px] font-black uppercase tracking-widest text-blue-600 flex items-center justify-between gap-3 w-40 hover:bg-blue-50 transition-all shadow-sm"
                        >
                            {currentSort === 'publishedAt' ? 'Mới nhất' : 'Xem nhiều'}
                            <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isSortOpen ? 'rotate-180' : ''}`} />
                        </button>
                        
                        {isSortOpen && (
                            <>
                                <div className="fixed inset-0 z-40" onClick={() => setIsSortOpen(false)}></div>
                                <div className="absolute top-full mt-2 w-full bg-white rounded-2xl shadow-xl border border-blue-100 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                                    <button 
                                        onClick={() => { updateFilters({ sortBy: 'publishedAt', page: '1' }); setIsSortOpen(false); }}
                                        className={`w-full text-left px-5 py-3 text-[11px] font-black uppercase tracking-widest transition-colors ${currentSort === 'publishedAt' ? 'bg-blue-600 text-white' : 'text-neutral-500 hover:bg-neutral-50 hover:text-blue-600'}`}
                                    >
                                        Mới nhất
                                    </button>
                                    <button 
                                        onClick={() => { updateFilters({ sortBy: 'viewCount', page: '1' }); setIsSortOpen(false); }}
                                        className={`w-full text-left px-5 py-3 text-[11px] font-black uppercase tracking-widest transition-colors ${currentSort === 'viewCount' ? 'bg-blue-600 text-white' : 'text-neutral-500 hover:bg-neutral-50 hover:text-blue-600'}`}
                                    >
                                        Xem nhiều
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                    <div className="relative flex-1 md:w-72">
                        {isPending ? (
                            <Loader2 className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-primary-500 animate-spin" />
                        ) : (
                            <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-300 transition-colors" />
                        )}
                        <input 
                            type="text"
                            placeholder="Tìm bài viết..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-14 pr-6 py-3.5 bg-neutral-50/50 border border-neutral-100 rounded-full text-sm outline-none focus:bg-white focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all font-medium"
                        />
                    </div>
                </div>
            </div>
        </div>
    )
}
