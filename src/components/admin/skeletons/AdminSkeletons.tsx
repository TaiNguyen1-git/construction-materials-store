'use client'

import React from 'react'

export const SkeletonBase = ({ className = "" }: { className?: string }) => (
  <div className={`animate-pulse bg-slate-200 rounded-lg ${className}`} />
)

export const StatsSkeleton = () => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
    {[1, 2, 3, 4].map((i) => (
      <div key={i} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
        <div className="flex justify-between items-start mb-4">
          <SkeletonBase className="h-4 w-24" />
          <SkeletonBase className="h-10 w-10 rounded-xl" />
        </div>
        <SkeletonBase className="h-8 w-32 mb-2" />
        <SkeletonBase className="h-3 w-48" />
      </div>
    ))}
  </div>
)

export const TableSkeleton = ({ rows = 5 }: { rows?: number }) => (
  <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden mt-6">
    <div className="p-8 border-b border-slate-50 flex justify-between items-center bg-slate-50/30">
      <div className="flex gap-4">
         <SkeletonBase className="h-10 w-48 rounded-xl" />
         <SkeletonBase className="h-10 w-32 rounded-xl" />
      </div>
      <SkeletonBase className="h-10 w-40 rounded-xl" />
    </div>
    <div className="p-8 overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-slate-50">
            {[1, 2, 3, 4, 5].map((i) => (
              <th key={i} className="pb-6"><SkeletonBase className="h-3 w-20" /></th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-50">
          {Array.from({ length: rows }).map((_, i) => (
            <tr key={i}>
              {[1, 2, 3, 4, 5].map((j) => (
                <td key={j} className="py-6 pr-4">
                  <div className="flex items-center gap-3">
                    {j === 1 && <SkeletonBase className="h-10 w-10 rounded-xl shrink-0" />}
                    <div className="space-y-2 flex-1">
                      <SkeletonBase className={`h-3 ${j === 1 ? 'w-24' : 'w-20'}`} />
                      {j === 1 && <SkeletonBase className="h-2 w-16 opacity-50" />}
                    </div>
                  </div>
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
)

export const PageSkeleton = () => (
  <div className="space-y-8 p-1 animate-in fade-in duration-700">
    <div className="flex justify-between items-center">
      <div className="space-y-2">
        <SkeletonBase className="h-8 w-64" />
        <SkeletonBase className="h-4 w-96 opacity-60" />
      </div>
      <div className="flex gap-3">
        <SkeletonBase className="h-11 w-32 rounded-xl" />
        <SkeletonBase className="h-11 w-40 rounded-xl" />
      </div>
    </div>

    <StatsSkeleton />
    
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
       <div className="lg:col-span-8 space-y-8">
          <TableSkeleton rows={6} />
       </div>
       <div className="lg:col-span-4 space-y-6">
          <div className="bg-white p-8 rounded-[32px] border border-slate-100 h-full min-h-[400px]">
             <SkeletonBase className="h-6 w-32 mb-6" />
             <div className="space-y-6">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="flex gap-4">
                     <SkeletonBase className="h-12 w-12 rounded-2xl shrink-0" />
                     <div className="flex-1 space-y-3 pt-1">
                        <SkeletonBase className="h-3 w-full" />
                        <SkeletonBase className="h-2 w-2/3 opacity-50" />
                     </div>
                  </div>
                ))}
             </div>
          </div>
       </div>
    </div>
  </div>
)
