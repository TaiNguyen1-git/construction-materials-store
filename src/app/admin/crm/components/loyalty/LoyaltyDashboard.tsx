'use client'

import { useState, useEffect } from 'react'
import {
    Users, Star, Gift, TrendingUp, AlertTriangle, ArrowUpRight
} from 'lucide-react'
import {
    PieChart, Pie, Cell, BarChart, Bar,
    XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid
} from 'recharts'
import { Skeleton } from '@/components/ui/skeleton'

const TIER_COLORS: Record<string, string> = {
    BRONZE: '#d97706',
    SILVER: '#64748b',
    GOLD: '#eab308',
    PLATINUM: '#3b82f6',
    DIAMOND: '#8b5cf6',
}

const TIER_NAMES: Record<string, string> = {
    BRONZE: 'Đồng',
    SILVER: 'Bạc',
    GOLD: 'Vàng',
    PLATINUM: 'Bạch Kim',
    DIAMOND: 'Kim Cương',
}

interface Stats {
    totalMembers: number
    totalPointsInCirculation: number
    totalPointsEarned: number
    totalPointsRedeemed: number
    redemptionRate: number
    totalRevenueFromLoyalCustomers: number
    tierDistribution: Record<string, number>
    voucherStats: { total: number; used: number; usageRate: number; totalValue: number }
    monthlyGrowth: Array<{ month: string; count: number }>
    churnRiskCount: number
}

export default function LoyaltyDashboard() {
    const [stats, setStats] = useState<Stats | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchStats()
    }, [])

    const fetchStats = async () => {
        try {
            const res = await fetch('/api/admin/loyalty/stats')
            const data = await res.json()
            if (data.success) setStats(data.data)
        } catch (err) {
            console.error('Lỗi tải thống kê:', err)
        } finally {
            setLoading(false)
        }
    }

    const fmt = (n: number) => new Intl.NumberFormat('vi-VN').format(n)
    const fmtCurrency = (n: number) =>
        new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', minimumFractionDigits: 0 }).format(n)

    if (loading) {
        return (
            <div className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
                    {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-36 rounded-[32px]" />)}
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    <Skeleton className="lg:col-span-7 h-[380px] rounded-[32px]" />
                    <Skeleton className="lg:col-span-5 h-[380px] rounded-[32px]" />
                </div>
            </div>
        )
    }

    if (!stats) return <div className="text-center py-20 text-slate-400">Không có dữ liệu</div>

    const kpis = [
        { title: 'Tổng Thành Viên', value: fmt(stats.totalMembers), icon: Users, color: 'bg-blue-50 text-blue-600' },
        { title: 'Điểm Lưu Hành', value: fmt(stats.totalPointsInCirculation), icon: Star, color: 'bg-amber-50 text-amber-600' },
        { title: 'Tỷ Lệ Đổi Quà', value: `${stats.redemptionRate}%`, icon: Gift, color: 'bg-emerald-50 text-emerald-600' },
        { title: 'Doanh Thu KH Cũ', value: fmtCurrency(stats.totalRevenueFromLoyalCustomers), icon: TrendingUp, color: 'bg-indigo-50 text-indigo-600' },
        { title: 'Nguy Cơ Rời Bỏ', value: fmt(stats.churnRiskCount), icon: AlertTriangle, color: 'bg-red-50 text-red-600' },
    ]

    const tierData = Object.entries(stats.tierDistribution).map(([tier, count]) => ({
        name: TIER_NAMES[tier] || tier,
        value: count,
        color: TIER_COLORS[tier] || '#94a3b8',
    }))

    return (
        <div className="space-y-8">
            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
                {kpis.map((kpi, i) => (
                    <div key={i} className="bg-white rounded-[32px] border border-slate-100 p-7 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all group relative overflow-hidden">
                        <div className="absolute -right-4 -top-4 w-20 h-20 bg-blue-600/5 rounded-full blur-2xl group-hover:bg-blue-600/10 transition-all" />
                        <div className="flex justify-between items-start mb-4">
                            <div className={`p-3 rounded-2xl ${kpi.color} transition-transform group-hover:scale-110`}>
                                <kpi.icon size={20} />
                            </div>
                            <ArrowUpRight size={14} className="text-slate-300 group-hover:text-blue-500 transition-colors" />
                        </div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">{kpi.title}</p>
                        <p className="text-2xl font-black text-slate-900 tracking-tighter">{kpi.value}</p>
                    </div>
                ))}
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Monthly Growth */}
                <div className="lg:col-span-7 bg-white rounded-[32px] border border-slate-100 p-8 shadow-sm">
                    <h3 className="text-lg font-black text-slate-900 tracking-tighter italic mb-1">Tăng Trưởng Thành Viên</h3>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6">Số thành viên mới theo tháng</p>
                    <div className="h-[280px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={stats.monthlyGrowth}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }} />
                                <YAxis hide />
                                <Tooltip
                                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', padding: '12px' }}
                                    formatter={(value: number) => [`${value} thành viên`, 'Số lượng']}
                                />
                                <Bar dataKey="count" fill="#3b82f6" radius={[12, 12, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Tier Distribution */}
                <div className="lg:col-span-5 bg-white rounded-[32px] border border-slate-100 p-8 shadow-sm">
                    <h3 className="text-lg font-black text-slate-900 tracking-tighter italic mb-1">Phân Bố Hạng</h3>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Cơ cấu hạng thành viên</p>
                    <div className="h-[200px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie data={tierData} cx="50%" cy="50%" innerRadius={55} outerRadius={80} paddingAngle={5} cornerRadius={8} dataKey="value">
                                    {tierData.map((entry, idx) => (
                                        <Cell key={idx} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Tooltip formatter={(value: number, name: string) => [`${value} người`, name]} />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="grid grid-cols-2 gap-2 mt-2">
                        {tierData.map((t, i) => (
                            <div key={i} className="flex items-center gap-2 p-2 bg-slate-50 rounded-xl">
                                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: t.color }} />
                                <span className="text-[10px] font-bold text-slate-600">{t.name}: {t.value}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Voucher Summary */}
            <div className="bg-white rounded-[32px] border border-slate-100 p-8 shadow-sm">
                <h3 className="text-lg font-black text-slate-900 tracking-tighter italic mb-6">Tổng Quan Voucher</h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    {[
                        { label: 'Tổng Voucher', value: fmt(stats.voucherStats.total) },
                        { label: 'Đã Sử Dụng', value: fmt(stats.voucherStats.used) },
                        { label: 'Tỷ Lệ Dùng', value: `${stats.voucherStats.usageRate}%` },
                        { label: 'Giá Trị Phát Hành', value: fmtCurrency(stats.voucherStats.totalValue) },
                    ].map((item, i) => (
                        <div key={i} className="p-5 bg-slate-50 rounded-2xl border border-slate-100">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">{item.label}</p>
                            <p className="text-xl font-black text-slate-900 tracking-tighter">{item.value}</p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}
