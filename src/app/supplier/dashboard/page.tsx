'use client'

import { useState, useEffect } from 'react'
import { Package, DollarSign, FileText, TrendingUp, Clock, CheckCircle, Download } from 'lucide-react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import toast from 'react-hot-toast'

interface DashboardStats {
    totalOrders: number
    pendingOrders: number
    totalRevenue: number
    pendingPayments: number
}

export default function SupplierDashboard() {
    const router = useRouter()
    const [stats, setStats] = useState<DashboardStats>({
        totalOrders: 0,
        pendingOrders: 0,
        totalRevenue: 0,
        pendingPayments: 0
    })
    const [recentOrders, setRecentOrders] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchDashboardData()
    }, [])

    const fetchDashboardData = async () => {
        try {
            const supplierId = localStorage.getItem('supplier_id')
            const token = localStorage.getItem('supplier_token')

            const res = await fetch(`/api/supplier/dashboard?supplierId=${supplierId}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            })

            if (res.ok) {
                const data = await res.json()
                if (data.success) {
                    setStats(data.data.stats)
                    setRecentOrders(data.data.recentOrders || [])
                }
            }
        } catch (error) {
            console.error('Failed to fetch dashboard:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleExport = () => {
        const loadingToast = toast.loading('Đang chuẩn bị dữ liệu báo cáo...')

        try {
            // Chuẩn bị dữ liệu CSV
            const headers = ['Mã Đơn Hàng', 'Sản phẩm', 'Số lượng', 'Trạng thái', 'Ngày tạo']
            const rows = recentOrders.map(order => [
                order.orderNumber,
                order.productName,
                order.quantity,
                order.status,
                new Date(order.createdAt).toLocaleDateString('vi-VN')
            ])

            const csvContent = [
                headers.join(','),
                ...rows.map(row => row.join(','))
            ].join('\n')

            // Tạo blob và download
            const blob = new Blob([`\ufeff${csvContent}`], { type: 'text/csv;charset=utf-8;' })
            const link = document.createElement('a')
            const url = URL.createObjectURL(blob)

            link.setAttribute('href', url)
            link.setAttribute('download', `bao_cao_nha_cung_cap_${new Date().toISOString().split('T')[0]}.csv`)
            link.style.visibility = 'hidden'
            document.body.appendChild(link)
            link.click()
            document.body.removeChild(link)

            toast.success('Báo cáo đã được tải về thành công', { id: loadingToast })
        } catch (error) {
            toast.error('Có lỗi xảy ra khi xuất báo cáo', { id: loadingToast })
        }
    }

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND',
            minimumFractionDigits: 0
        }).format(amount)
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        )
    }

    const statCards = [
        {
            title: 'Tổng Đơn Hàng',
            value: stats.totalOrders,
            icon: Package,
            color: 'from-blue-600 to-blue-400',
            textColor: 'text-blue-600',
            bgLight: 'bg-blue-50',
            trend: '+12%',
            description: 'So với tháng trước'
        },
        {
            title: 'Đang Chờ',
            value: stats.pendingOrders,
            icon: Clock,
            color: 'from-amber-500 to-amber-300',
            textColor: 'text-amber-600',
            bgLight: 'bg-amber-50',
            trend: 'Cần xử lý',
            description: 'Đơn hàng mới'
        },
        {
            title: 'Tổng Doanh Thu',
            value: formatCurrency(stats.totalRevenue),
            icon: TrendingUp,
            color: 'from-emerald-600 to-emerald-400',
            textColor: 'text-emerald-600',
            bgLight: 'bg-emerald-50',
            trend: 'Ổn định',
            description: 'Vốn quay vòng'
        },
        {
            title: 'Chờ Thanh Toán',
            value: formatCurrency(stats.pendingPayments),
            icon: DollarSign,
            color: 'from-indigo-600 to-indigo-400',
            textColor: 'text-indigo-600',
            bgLight: 'bg-indigo-50',
            trend: 'Kết quả đối soát',
            description: 'Dòng tiền sắp về'
        }
    ]

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

            {/* Bento Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {statCards.map((stat, index) => (
                    <div key={index} className="group relative bg-white rounded-[2rem] p-8 border border-slate-200/60 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden">
                        <div className={`absolute top-0 right-0 w-32 h-32 ${stat.bgLight} rounded-full -mr-12 -mt-12 blur-3xl opacity-50 group-hover:scale-150 transition-transform duration-500`} />

                        <div className="relative space-y-4">
                            <div className="flex items-center justify-between">
                                <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${stat.color} flex items-center justify-center shadow-lg shadow-slate-200 rotate-3 group-hover:rotate-0 transition-transform`}>
                                    <stat.icon className="w-6 h-6 text-white" />
                                </div>
                                <span className={`text-[10px] font-black px-2 py-1 rounded-lg ${stat.bgLight} ${stat.textColor} uppercase tracking-wider`}>
                                    {stat.trend}
                                </span>
                            </div>
                            <div>
                                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest">{stat.title}</h3>
                                <p className="text-3xl font-black text-slate-900 mt-1">{stat.value}</p>
                                <p className="text-xs text-slate-400 mt-2 font-medium">{stat.description}</p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Recent Orders - Taking 2/3 of space */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="flex items-center justify-between px-2">
                        <h2 className="text-xl font-bold text-slate-900 flex items-center gap-3">
                            <Clock className="w-5 h-5 text-blue-600" />
                            Đơn hàng mới cập nhật
                        </h2>
                        <button
                            onClick={() => router.push('/supplier/orders')}
                            className="text-sm font-bold text-blue-600 hover:underline"
                        >
                            Xem tất cả
                        </button>
                    </div>
                    <div className="bg-white rounded-[2rem] border border-slate-200/60 shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-700">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-slate-50/50">
                                    <tr>
                                        <th className="px-8 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Mã Đơn Hàng</th>
                                        <th className="px-8 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Sản phẩm</th>
                                        <th className="px-8 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Số lượng</th>
                                        <th className="px-8 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Trạng thái</th>
                                        <th className="px-8 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Ngày tạo</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {recentOrders.length > 0 ? (
                                        recentOrders.map((order, index) => (
                                            <tr key={index} className="group hover:bg-slate-50/50 transition-colors">
                                                <td className="px-8 py-5 text-sm font-bold text-slate-900">{order.orderNumber}</td>
                                                <td className="px-8 py-5 text-sm font-medium text-slate-600">{order.productName}</td>
                                                <td className="px-8 py-5 text-sm font-black text-slate-900">x{order.quantity}</td>
                                                <td className="px-8 py-5">
                                                    <span className={`px-3 py-1 text-[10px] font-black rounded-lg uppercase tracking-wider ${order.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-600' :
                                                        order.status === 'PENDING' ? 'bg-amber-100 text-amber-600' :
                                                            'bg-slate-100 text-slate-600'
                                                        }`}>
                                                        {order.status}
                                                    </span>
                                                </td>
                                                <td className="px-8 py-5 text-sm font-medium text-slate-400">
                                                    {new Date(order.createdAt).toLocaleDateString('vi-VN')}
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan={5} className="px-8 py-20 text-center">
                                                <div className="flex flex-col items-center justify-center grayscale opacity-20">
                                                    <Package className="w-16 h-16 mb-4" />
                                                    <p className="font-bold uppercase tracking-widest">Chưa có đơn hàng nào</p>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {/* Sidebar Cards - Taking 1/3 of space */}
                <div className="space-y-8">
                    {/* Activity Feed or Promo Card */}
                    <div className="bg-gradient-to-br from-indigo-600 to-blue-700 rounded-[2rem] p-8 text-white relative overflow-hidden shadow-xl shadow-blue-200">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-xl" />
                        <h3 className="text-xl font-bold mb-2">Chương trình đối tác</h3>
                        <p className="text-blue-100 text-sm leading-relaxed mb-6">
                            Nâng cấp lên hạng vàng để nhận chiết khấu vận chuyển và ưu tiên hiển thị sản phẩm.
                        </p>
                        <button
                            onClick={() => router.push('/supplier/support')}
                            className="w-full py-3 bg-white text-blue-600 font-bold rounded-xl hover:bg-blue-50 transition-all active:scale-95"
                        >
                            Tìm hiểu thêm
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
                                'Cập nhật tồn kho thường xuyên',
                                'Phản hồi PO trong vòng 4 tiếng',
                                'Đính kèm hóa đơn VAT kịp thời'
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
