import React from 'react'

export default function RootLoading() {
  return (
    <div className="fixed inset-0 bg-neutral-50/80 backdrop-blur-md flex flex-col items-center justify-center z-50 transition-all duration-300">
      <div className="relative flex flex-col items-center space-y-6 p-10 bg-white/50 border border-white/60 rounded-3xl shadow-xl shadow-neutral-100/50 backdrop-filter">
        {/* Animated concentric loader rings */}
        <div className="relative w-16 h-16">
          <div className="absolute inset-0 border-4 border-indigo-100 rounded-full" />
          <div className="absolute inset-0 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
        </div>
        
        {/* Text branding */}
        <div className="text-center space-y-2">
          <h3 className="text-lg font-black text-neutral-800 tracking-tight uppercase">SmartBuild</h3>
          <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest animate-pulse">Đang tải tài nguyên...</p>
        </div>
      </div>
    </div>
  )
}
