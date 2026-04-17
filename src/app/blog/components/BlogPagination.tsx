'use client'

import { useTransition, useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

interface BlogPaginationProps {
    lastPage: number
    currentPage: number
}

export default function BlogPagination({ lastPage, currentPage }: BlogPaginationProps) {
    const router = useRouter()
    const searchParams = useSearchParams()
    const [isPending, startTransition] = useTransition()
    const [localPage, setLocalPage] = useState(currentPage)

    // Sync local state with URL
    useEffect(() => {
        setLocalPage(currentPage)
    }, [currentPage])

    const goToPage = (page: number) => {
        setLocalPage(page)
        const params = new URLSearchParams(searchParams.toString())
        params.set('page', page.toString())
        startTransition(() => {
            router.push(`/blog?${params.toString()}`, { scroll: true })
        })
    }

    if (lastPage <= 1) return null

    return (
        <div className="flex items-center justify-center gap-3 mt-32">
            <button 
                disabled={currentPage === 1}
                onClick={() => goToPage(currentPage - 1)}
                className="w-14 h-14 flex items-center justify-center rounded-3xl bg-neutral-50 text-slate-400 border border-slate-100 disabled:opacity-20 hover:bg-primary-600 hover:text-white transition-all shadow-xl shadow-slate-200/50"
            >
                ←
            </button>
            {[...Array(lastPage)].map((_, i) => (
                <button
                    key={i + 1}
                    onClick={() => goToPage(i + 1)}
                    className={`w-14 h-14 flex items-center justify-center rounded-3xl font-black text-sm transition-all shadow-xl ${
                        localPage === i + 1 
                        ? 'bg-primary-600 text-white shadow-primary-200/50' 
                        : 'bg-white border border-slate-100 text-slate-400 hover:bg-slate-50 shadow-slate-100'
                    }`}
                >
                    {i + 1}
                </button>
            ))}
            <button 
                disabled={currentPage === lastPage}
                onClick={() => goToPage(currentPage + 1)}
                className="w-14 h-14 flex items-center justify-center rounded-3xl bg-neutral-50 text-slate-400 border border-slate-100 disabled:opacity-20 hover:bg-primary-600 hover:text-white transition-all shadow-xl shadow-slate-200/50"
            >
                →
            </button>
        </div>
    )
}
