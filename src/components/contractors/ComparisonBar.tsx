import { ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { Contractor } from './types'
import { encodeId } from '@/lib/id-utils'

interface ComparisonBarProps {
    compareList: Contractor[]
    onClear: () => void
}

export default function ComparisonBar({ compareList, onClear }: ComparisonBarProps) {
    if (compareList.length === 0) return null

    return (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[60] w-full max-w-2xl px-4">
            <div className="bg-white/90 backdrop-blur-2xl rounded-[32px] p-2 pl-6 flex items-center justify-between shadow-[0_20px_50px_rgba(0,0,0,0.15)] border border-white">
                <div className="flex items-center gap-4">
                    <span className="text-slate-400 font-black text-[10px] uppercase tracking-widest hidden sm:block">Đang chọn</span>
                    <div className="flex -space-x-3">
                        {compareList.map(c => (
                            <div key={c.id} className="w-10 h-10 rounded-full border-2 border-white bg-blue-600 flex items-center justify-center text-xs font-black text-white shadow-lg relative group">
                                {c.displayName[0]}
                                <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-slate-900 text-white px-3 py-1.5 rounded-lg text-[10px] font-black opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none shadow-xl">
                                    {c.displayName}
                                </div>
                            </div>
                        ))}
                        {Array.from({ length: 3 - compareList.length }).map((_, i) => (
                            <div key={i} className="w-10 h-10 rounded-full border-2 border-white bg-slate-50 flex items-center justify-center text-slate-300 text-xs border-dashed">
                                +
                            </div>
                        ))}
                    </div>
                </div>

                <div className="flex gap-2">
                    <button 
                        onClick={onClear}
                        className="px-6 py-3 bg-slate-50 text-slate-400 font-black rounded-[20px] hover:text-slate-600 transition-all text-[10px] uppercase tracking-widest"
                    >
                        Xóa hết
                    </button>
                    <Link
                        href={`/contractors/compare?ids=${compareList.map(c => encodeId(c.id)).join(',')}`}
                        className="px-8 py-3 bg-blue-600 text-white font-black rounded-[20px] hover:bg-blue-500 transition-all text-[10px] flex items-center gap-2 shadow-lg shadow-blue-200 uppercase tracking-widest"
                    >
                        So sánh ngay
                        <ArrowRight className="w-4 h-4" />
                    </Link>
                </div>
            </div>
        </div>
    )
}
