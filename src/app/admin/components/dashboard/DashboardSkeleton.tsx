import React from 'react'
import { Skeleton } from '@/components/ui/skeleton'

export default function DashboardSkeleton() {
    return (
        <div className="space-y-10 animate-pulse">
            {/* Header Skeleton */}
            <div className="flex flex-col lg:flex-row gap-6">
                <div className="flex-1 space-y-2 pt-4">
                    <div className="flex gap-2">
                        <Skeleton className="h-12 w-40 rounded-2xl" />
                        <Skeleton className="h-12 w-16 rounded-2xl" />
                    </div>
                </div>
                <Skeleton className="h-[200px] lg:w-[450px] rounded-[40px]" />
            </div>

            {/* Stat Cards Skeleton */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6">
                {[...Array(6)].map((_, i) => (
                    <Skeleton key={i} className={`h-40 rounded-[40px] ${i === 4 ? 'lg:col-span-2' : ''}`} />
                ))}
            </div>

            {/* Charts Skeleton */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                <Skeleton className="lg:col-span-8 h-[450px] rounded-[40px]" />
                <Skeleton className="lg:col-span-4 h-[450px] rounded-[40px]" />
            </div>
        </div>
    )
}
