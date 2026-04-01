'use client'

import { useEffect } from 'react'
import { Download, CheckCircle } from 'lucide-react'
import { useRouter } from 'next/navigation'

import StatCards from './components/StatCards'
import PerformanceAlerts from './components/PerformanceAlerts'
import RecentOrders from './components/RecentOrders'
import RevenueChart from './components/RevenueChart'
import { useDashboard } from './hooks/useDashboard'

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
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        )
    }

    return (
        <div className="space-y-10 pb-20">
            {/* Elegant Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight">Tổng quan hệ thống</h1>
                    <div className="flex items-center gap-2 mt-2 text-slate-500 font-medium">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        Trạng thái hệ thống: Hoạt động bình thường
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={handleExport}
                        className="flex items-center gap-2 px-5 py-2.5 bg-white border border-slate-200 text-slate-700 font-bold rounded-xl hover:bg-slate-50 transition-all shadow-sm active:scale-95"
                    >
                        <Download className="w-4 h-4" />
                        Xuất báo cáo
                    </button>
                    <button
                        onClick={() => router.push('/supplier/products')}
                        className="px-5 py-2.5 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 active:scale-95"
                    >
                        Thêm sản phẩm
                    </button>
                </div>
            </div>

            <StatCards stats={stats} formatCurrency={formatCurrency} />

            <PerformanceAlerts alerts={performanceAlerts} />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-8">
                    {/* Integrated dynamic Revenue Chart */}
                    <RevenueChart />
                    
                    {/* Integrated Recent Orders Table */}
                    <RecentOrders recentOrders={recentOrders} />
                </div>

                {/* Sidebar Cards - Taking 1/3 of space */}
                <div className="space-y-8">
                    {/* Activity Feed or Promo Card */}
                    <div className="bg-gradient-to-br from-indigo-600 to-blue-700 rounded-[2rem] p-8 text-white relative overflow-hidden shadow-xl shadow-blue-200">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-xl" />
                        <h3 className="text-xl font-bold mb-2">Chương trình đối tác</h3>
                        <p className="text-blue-100 text-sm leading-relaxed mb-6">
                            Nâng cấp lên hạng vàng hiện đang mở! Bạn có muốn nhận chiết khấu vận chuyển và ưu tiên hiển thị sản phẩm không?
                        </p>
                        <button
                            onClick={() => router.push('/supplier/support')}
                            className="w-full py-3 bg-white text-blue-600 font-bold rounded-xl hover:bg-blue-50 transition-all active:scale-95"
                        >
                            Tìm hiểu ngay
                        </button>
                    </div>

                    {/* Quick Tips */}
                    <div className="bg-white rounded-[2rem] p-8 border border-slate-200/60 shadow-sm">
                        <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                            <CheckCircle className="w-5 h-5 text-emerald-500" />
                            Gợi ý vận hành
                        </h3>
                        <ul className="space-y-4">
                            {[
                                'Cập nhật tồn kho hàng ngày',
                                'Phản hồi PO trong tối đa 4 tiếng',
                                'Thêm hóa đơn điện tử đính kèm'
                            ].map((tip, i) => (
                                <li key={i} className="flex gap-3 text-sm text-slate-600 font-medium">
                                    <span className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-black flex-shrink-0">
                                        {i + 1}
                                    </span>
                                    {tip}
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    )
}
