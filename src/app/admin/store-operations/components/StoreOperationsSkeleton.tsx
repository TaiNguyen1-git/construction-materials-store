import React from 'react'
import { Skeleton } from '@/components/ui/skeleton'

export default function StoreOperationsSkeleton() {
    return (
        <div className="space-y-8 max-w-[1600px] mx-auto animate-in fade-in duration-500 pb-20">
            {/* Header Skeleton */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                    <Skeleton className="h-14 w-14 rounded-2xl" />
                    <div className="space-y-2">
                        <Skeleton className="h-8 w-64 rounded-xl" />
                        <Skeleton className="h-6 w-80 rounded-lg" />
                    </div>
                </div>
                <div className="flex gap-3">
                    <Skeleton className="h-14 w-44 rounded-2xl" />
                    <Skeleton className="h-14 w-44 rounded-2xl" />
                </div>
            </div>

            {/* Metrics Skeleton */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {[...Array(4)].map((_, i) => (
                    <div key={i} className="bg-white/50 rounded-[32px] p-7 border border-slate-100/50 shadow-sm">
                        <div className="flex justify-between mb-4">
                            <Skeleton className="h-3 w-32 rounded-lg" />
                            <Skeleton className="h-8 w-8 rounded-xl" />
                        </div>
                        <Skeleton className="h-8 w-48 rounded-xl" />
                    </div>
                ))}
            </div>

            {/* Main Content Skeleton */}
            <div className="bg-white/50 rounded-[40px] border border-slate-100/50 shadow-xl overflow-hidden min-h-[600px]">
                <div className="flex items-center gap-3 px-6 py-4 bg-slate-50/50 border-b border-slate-100">
                    {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-12 w-40 rounded-2xl" />)}
                </div>
                <div className="p-10">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        <div className="bg-slate-50/50 rounded-[32px] p-6 border border-slate-100 min-h-[500px]">
                            <div className="flex justify-between items-center mb-6">
                                <Skeleton className="h-5 w-40 rounded-lg" />
                                <Skeleton className="h-6 w-20 rounded-xl" />
                            </div>
                            <Skeleton className="h-12 w-full rounded-2xl mb-6" />
                            <div className="space-y-4">
                                {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-24 w-full rounded-3xl" />)}
                            </div>
                        </div>
                        <div className="space-y-6">
                            <div className="flex justify-between items-center">
                                <Skeleton className="h-5 w-48 rounded-lg" />
                                <Skeleton className="h-6 w-24 rounded-xl" />
                            </div>
                            <div className="space-y-4">
                                {[...Array(3)].map((_, i) => (
                                    <div key={i} className="bg-white/50 rounded-[28px] p-6 border border-slate-100">
                                        <div className="flex items-center gap-4 mb-4">
                                            <Skeleton className="h-12 w-12 rounded-2xl" />
                                            <div className="space-y-1">
                                                <Skeleton className="h-4 w-32 rounded-lg" />
                                                <Skeleton className="h-3 w-20 rounded-md" />
                                            </div>
                                        </div>
                                        <Skeleton className="h-20 w-full rounded-2xl" />
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
