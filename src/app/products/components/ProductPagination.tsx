'use client'

import { useRouter, useSearchParams } from 'next/navigation'

interface ProductPaginationProps {
    lastPage: number
    currentPage: number
}

export default function ProductPagination({ lastPage, currentPage }: ProductPaginationProps) {
    const router = useRouter()
    const searchParams = useSearchParams()

    const goToPage = (page: number) => {
        const params = new URLSearchParams(searchParams.toString())
        params.set('page', page.toString())
        router.push(`/products?${params.toString()}`)
    }

    if (lastPage <= 1) return null

    return (
        <div className="mt-12 flex justify-center">
            <div className="bg-white rounded-2xl shadow-sm p-2 flex items-center gap-1 border border-neutral-200">
                <button
                    onClick={() => goToPage(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="px-4 py-2.5 text-xs font-bold text-neutral-500 hover:text-primary-600 rounded-xl hover:bg-primary-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                >
                    ← Trước
                </button>

                {[...Array(lastPage)].map((_, i) => (
                    <button
                        key={i + 1}
                        onClick={() => goToPage(i + 1)}
                        className={`w-10 h-10 text-xs font-bold rounded-xl transition-all ${
                            currentPage === i + 1
                            ? 'bg-primary-600 text-white shadow-sm shadow-primary-200'
                            : 'text-neutral-600 hover:bg-neutral-50'
                        }`}
                    >
                        {i + 1}
                    </button>
                ))}

                <button
                    onClick={() => goToPage(currentPage + 1)}
                    disabled={currentPage === lastPage}
                    className="px-4 py-2.5 text-xs font-bold text-neutral-500 hover:text-primary-600 rounded-xl hover:bg-primary-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                >
                    Sau →
                </button>
            </div>
        </div>
    )
}
