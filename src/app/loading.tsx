import React from 'react'

export default function RootLoading() {
  return (
    <div className="w-full min-h-[75vh] flex flex-col items-center justify-center py-16 bg-neutral-50/50">
      <div className="flex flex-col items-center space-y-6 p-10 bg-white border border-neutral-100 rounded-[2rem] shadow-sm max-w-sm w-full mx-4 animate-in fade-in zoom-in-95 duration-300">
        {/* Animated concentric loader rings */}
        <div className="relative w-14 h-14">
          <div className="absolute inset-0 border-4 border-neutral-100 rounded-full" />
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
