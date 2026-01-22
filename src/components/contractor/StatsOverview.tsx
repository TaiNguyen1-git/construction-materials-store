'use client'

import { Briefcase, ShoppingCart, Bell, Wallet, ArrowUpRight, ArrowDownRight } from 'lucide-react'

interface StatsProps {
    stats: {
        activeProjects: number
        pendingOrders: number
        unreadNotifications: number
        totalSpent: number
        thisMonthSpent: number
    }
    loading?: boolean
}

export default function StatsOverview({ stats, loading }: StatsProps) {
    if (loading) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                {[1, 2, 3, 4].map(i => (
                    <div key={i} className="h-32 bg-gray-100 rounded-2xl animate-pulse" />
                ))}
            </div>
        )
    }

    const formatCurrency = (val: number) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val)

    const colorMap: Record<string, { bg: string, text: string }> = {
        blue: { bg: 'bg-blue-50', text: 'text-blue-600' },
        orange: { bg: 'bg-orange-50', text: 'text-orange-600' },
        red: { bg: 'bg-red-50', text: 'text-red-600' },
        green: { bg: 'bg-green-50', text: 'text-green-600' }
    }

    const items = [
        {
            label: 'Dự án đang chạy',
            value: stats.activeProjects,
            icon: Briefcase,
            color: 'blue',
            trend: '+2',
            trendLabel: 'so với tháng trước',
            trendUp: true
        },
        {
            label: 'Đơn hàng chờ xử lý',
            value: stats.pendingOrders,
            icon: ShoppingCart,
            color: 'orange',
            trend: 'Cần duyệt',
            trendLabel: 'ngay',
            trendUp: false
        },
        {
            label: 'Thông báo mới',
            value: stats.unreadNotifications,
            icon: Bell,
            color: 'red',
            trend: 'Quan trọng',
            trendLabel: 'cần xem',
            trendUp: false
        },
        {
            label: 'Chi tiêu tháng này',
            value: formatCurrency(stats.thisMonthSpent),
            icon: Wallet,
            color: 'green',
            trend: '+12%',
            trendLabel: 'so với T.trước',
            trendUp: true
        }
    ]

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {items.map((item, idx) => (
                <div key={idx} className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start mb-4">
                        <div className={`p-3 rounded-xl ${colorMap[item.color].bg} ${colorMap[item.color].text}`}>
                            <item.icon className="w-6 h-6" />
                        </div>
                        {item.trend && (
                            <div className={`flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full ${item.trendUp ? 'bg-green-50 text-green-600' : 'bg-gray-50 text-gray-600'
                                }`}>
                                {item.trendUp ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                                {item.trend}
                            </div>
                        )}
                    </div>
                    <div>
                        <p className="text-gray-500 text-sm font-medium mb-1">{item.label}</p>
                        <h3 className="text-2xl font-bold text-gray-900">{item.value}</h3>
                        <p className="text-xs text-gray-400 mt-1">{item.trendLabel}</p>
                    </div>
                </div>
            ))}
        </div>
    )
}
