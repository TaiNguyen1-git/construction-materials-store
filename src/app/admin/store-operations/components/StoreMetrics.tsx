import React from 'react'
import { Wallet, Truck, FileText, Coins } from 'lucide-react'
import { formatCurrency } from '../types'

interface StoreMetricsProps {
    cashCollected: number
    unassignedOrdersCount: number
    pendingQuotesCount: number
    totalExpenses: number
}

const StoreMetrics: React.FC<StoreMetricsProps> = ({
    cashCollected,
    unassignedOrdersCount,
    pendingQuotesCount,
    totalExpenses
}) => {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white/70 backdrop-blur-xl rounded-[32px] p-7 shadow-sm border border-white/50 ring-1 ring-slate-200/50">
                <div className="flex items-center justify-between mb-4">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em]">Tiền tài xế đang giữ</p>
                    <div className="w-8 h-8 rounded-xl bg-orange-50 flex items-center justify-center">
                        <Wallet className="w-4 h-4 text-orange-500" />
                    </div>
                </div>
                <p className="text-2xl font-black text-slate-900 tracking-tight">{formatCurrency(cashCollected)}</p>
            </div>

            <div className="bg-white/70 backdrop-blur-xl rounded-[32px] p-7 shadow-sm border border-white/50 ring-1 ring-slate-200/50">
                <div className="flex items-center justify-between mb-4">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em]">Đơn chờ điều xe</p>
                    <div className="w-8 h-8 rounded-xl bg-blue-50 flex items-center justify-center">
                        <Truck className="w-4 h-4 text-blue-600" />
                    </div>
                </div>
                <p className="text-2xl font-black text-blue-600 tracking-tight">{unassignedOrdersCount} Đơn hàng</p>
            </div>

            <div className="bg-white/70 backdrop-blur-xl rounded-[32px] p-7 shadow-sm border border-white/50 ring-1 ring-slate-200/50">
                <div className="flex items-center justify-between mb-4">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em]">Báo giá đang chờ</p>
                    <div className="w-8 h-8 rounded-xl bg-emerald-50 flex items-center justify-center">
                        <FileText className="w-4 h-4 text-emerald-600" />
                    </div>
                </div>
                <p className="text-2xl font-black text-emerald-600 tracking-tight">{pendingQuotesCount} Bản thảo</p>
            </div>

            <div className="bg-white/70 backdrop-blur-xl rounded-[32px] p-7 shadow-sm border border-white/50 ring-1 ring-slate-200/50">
                <div className="flex items-center justify-between mb-4">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em]">Chi phí hằng ngày</p>
                    <div className="w-8 h-8 rounded-xl bg-red-50 flex items-center justify-center">
                        <Coins className="w-4 h-4 text-red-500" />
                    </div>
                </div>
                <p className="text-2xl font-black text-red-500 tracking-tight">{formatCurrency(totalExpenses)}</p>
            </div>
        </div>
    )
}

export default StoreMetrics
