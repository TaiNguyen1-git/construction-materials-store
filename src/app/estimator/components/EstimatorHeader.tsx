'use client'

import React from 'react'
import { Calculator } from 'lucide-react'

export default function EstimatorHeader() {
    return (
        <div className="mb-12 flex items-center gap-4">
            <div className="w-14 h-14 bg-gradient-to-br from-indigo-600 to-blue-600 rounded-2xl flex items-center justify-center shadow-xl shadow-indigo-100">
                <Calculator className="w-7 h-7 text-white" />
            </div>
            <div>
                <h1 className="text-3xl font-black text-slate-900 leading-none mb-2 tracking-tighter uppercase">AI Material Estimator</h1>
                <p className="text-[11px] text-slate-400 font-black uppercase tracking-[0.3em]">Bóc tách khối lượng tự động bằng trí tuệ nhân tạo</p>
            </div>
        </div>
    )
}
