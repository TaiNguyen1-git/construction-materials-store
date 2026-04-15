'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { Grid, List } from 'lucide-react'

export default function ProductViewControls({ viewMode }: { viewMode: 'grid' | 'list' }) {
    const router = useRouter()
    const searchParams = useSearchParams()

    const updateView = (mode: 'grid' | 'list') => {
        const params = new URLSearchParams(searchParams.toString())
        params.set('view', mode)
        router.push(`/products?${params.toString()}`, { scroll: false })
    }

    return (
        <div className="flex items-center gap-1.5">
            <button
                onClick={() => updateView('grid')}
                className={`p-2.5 rounded-xl transition-all ${viewMode === 'grid'
                    ? 'bg-primary-600 text-white shadow-sm shadow-primary-200'
                    : 'text-neutral-400 hover:text-neutral-600 hover:bg-neutral-50'}`}
            >
                <Grid className="h-4 w-4" />
            </button>
            <button
                onClick={() => updateView('list')}
                className={`p-2.5 rounded-xl transition-all ${viewMode === 'list'
                    ? 'bg-primary-600 text-white shadow-sm shadow-primary-200'
                    : 'text-neutral-400 hover:text-neutral-600 hover:bg-neutral-50'}`}
            >
                <List className="h-4 w-4" />
            </button>
        </div>
    )
}
