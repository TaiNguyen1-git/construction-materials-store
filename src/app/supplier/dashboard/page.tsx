'use client'

import { useEffect } from 'react'
import { Download, CheckCircle } from 'lucide-react'
import { useRouter } from 'next/navigation'

import StatCards from './components/StatCards'
import PerformanceAlerts from './components/PerformanceAlerts'
import RecentOrders from './components/RecentOrders'
import RevenueChart from './components/RevenueChart'
import { useDashboard } from './hooks/useDashboard'
import { Skeleton } from '@/components/ui/skeleton'

export default function SupplierDashboard() {
    const router = useRouter()
    const {
        stats,
        recentOrders,
        loading,
        performanceAlerts,
        fetchDashboardData,
        handleExport,
        formatCurrency
    } = useDashboard()

    useEffect(() => {
        fetchDashboardData()
    }, [fetchDashboardData])

    if (loading) {
        return (
            <div className="space-y-10 animate-in fade-in duration-500">
                {/* Skeleton Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="space-y-2">
                        <Skeleton className="h-10 w-64 rounded-xl" />
                        <Skeleton className="h-4 w-48 rounded-lg" />
                    </div>
                    <div className="flex gap-3">
                        <Skeleton className="h-12 w-32 rounded-xl" />
                        <Skeleton className="h-12 w-40 rounded-xl" />
                    </div>
                </div>

                {/* Skeleton Stats */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {[1, 2, 3, 4].map(i => (
                        <Skeleton key={i} className="h-32 rounded-[2rem]" />
                    ))}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 space-y-8">
                        <Skeleton className="h-80 rounded-[2.5rem]" />
                        <Skeleton className="h-96 rounded-[2.5rem]" />
                    </div>
                    <div className="space-y-8">
                        <Skeleton className="h-64 rounded-[2rem]" />
                        <Skeleton className="h-64 rounded-[2rem]" />
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-10 pb-20 animate-in fade-in slide-in-from-bottom-2 duration-700">
            {/* Elegant Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-4xl font-black text-slate-900 tracking-tight">Tổng quan hệ thống</h1>
                    <div className="flex items-center gap-2 mt-2 text-slate-500 font-medium">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_12px_rgba(16,185,129,0.5)]" />
                        Trạng thái hệ thống: Hoạt động bình thường
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={handleExport}
                        className="flex items-center gap-2 px-6 py-3 bg-white border border-slate-200 text-slate-700 font-bold rounded-2xl hover:bg-slate-50 transition-all shadow-sm active:scale-95"
                    >
                        <Download className="w-4 h-4" />
                        Xuất báo cáo
                    </button>
                    <button
                        onClick={() => router.push('/supplier/products')}
                        className="px-6 py-3 bg-blue-600 text-white font-black text-xs uppercase tracking-widest rounded-2xl hover:bg-blue-700 transition-all shadow-xl shadow-blue-100 active:scale-95"
                    >
                        Thêm sản phẩm
                    </button>
                </div>
            </div>

            <StatCards stats={stats} formatCurrency={formatCurrency} />

            <PerformanceAlerts alerts={performanceAlerts} />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                <div className="lg:col-span-2 space-y-8">
                    {/* Integrated dynamic Revenue Chart */}
                    <div className="bg-white rounded-[2.5rem] p-1 border border-slate-100/60 shadow-sm overflow-hidden">
                        <RevenueChart />
                    </div>
                    
                    {/* Integrated Recent Orders Table */}
                    <div className="bg-white rounded-[2.5rem] p-1 border border-slate-100/60 shadow-sm overflow-hidden">
                        <RecentOrders recentOrders={recentOrders} />
                    </div>
                </div>

                {/* Sidebar Cards - Taking 1/3 of space */}
                <div className="space-y-8">
                    {/* Activity Feed or Promo Card */}
                    <div className="bg-gradient-to-br from-indigo-600 to-blue-700 rounded-[2.5rem] p-10 text-white relative overflow-hidden shadow-2xl shadow-indigo-100 group">
                        <div className="absolute top-[-20px] right-[-20px] w-64 h-64 bg-white/10 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-1000" />
                        <div className="relative z-10">
                            <h3 className="text-2xl font-black mb-2 uppercase tracking-tight">Đối tác Vàng</h3>
                            <p className="text-blue-100 text-sm leading-relaxed mb-8 opacity-80">
                                Nâng cấp lên Thứ hạng Vàng để nhận chiết khấu vận chuyển và ưu tiên hiển thị sản phẩm trên Marketplace.
                            </p>
                            <button
                                onClick={() => router.push('/supplier/support')}
                                className="w-full py-4 bg-white text-blue-700 font-black text-xs uppercase tracking-widest rounded-2xl hover:bg-blue-50 transition-all shadow-lg active:scale-95"
                            >
                                Tìm hiểu ngay
                            </button>
                        </div>
                    </div>

                    {/* Quick Tips */}
                    <div className="bg-white rounded-[2.5rem] p-10 border border-slate-100 shadow-sm relative overflow-hidden group">
                        <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-emerald-50/50 rounded-full group-hover:scale-150 transition-transform duration-1000"></div>
                        <div className="relative z-10">
                            <h3 className="text-xl font-black text-slate-900 mb-8 flex items-center gap-3">
                                <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center">
                                    <CheckCircle className="w-5 h-5 text-emerald-500" />
                                </div>
                                Gợi ý vận hành
                            </h3>
                            <ul className="space-y-6">
                                {[
                                    'Cập nhật tồn kho mỗi sáng',
                                    'Phản hồi PO sớm nhất có thể',
                                    'Đính kèm hóa đơn điện tử'
                                ].map((tip, i) => (
                                    <li key={i} className="flex gap-4 items-start group/tip cursor-pointer">
                                        <span className="w-6 h-6 rounded-lg bg-slate-100 flex items-center justify-center text-[10px] font-black flex-shrink-0 group-hover/tip:bg-blue-600 group-hover/tip:text-white transition-colors">
                                            {i + 1}
                                        </span>
                                        <span className="text-sm text-slate-600 font-bold group-hover/tip:text-slate-900 transition-colors pt-0.5">
                                            {tip}
                                        </span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
