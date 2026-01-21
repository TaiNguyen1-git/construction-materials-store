'use client'

/**
 * Contractor Financial Dashboard
 * Visualizes income flow and material costs
 */

import { useState, useEffect } from 'react'
import {
    Wallet, TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight,
    Calendar, Briefcase, ShoppingCart, Loader2, AlertCircle
} from 'lucide-react'

export default function FinancialDashboard() {
    const [loading, setLoading] = useState(true)
    const [data, setData] = useState<any>(null)

    useEffect(() => {
        fetchFinance()
    }, [])

    const fetchFinance = async () => {
        try {
            const token = localStorage.getItem('access_token')
            const res = await fetch('/api/contractors/finance', {
                headers: { 'Authorization': token ? `Bearer ${token}` : '' }
            })
            const json = await res.json()
            if (json.success) setData(json.data)
        } catch (err) {
            console.error('Fetch finance failed')
        } finally {
            setLoading(false)
        }
    }

    const formatCurrency = (amt: number) => new Intl.NumberFormat('vi-VN').format(amt) + 'đ'

    if (loading) return <div className="h-64 flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div>
    if (!data) return <div className="p-8 text-center text-gray-500">Chưa có dữ liệu tài chính</div>

    const { summary } = data

    return (
        <div className="space-y-6">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-gradient-to-br from-blue-600 to-blue-700 p-6 rounded-3xl text-white shadow-xl shadow-blue-100">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-2 bg-white/20 rounded-xl">
                            <Wallet className="w-6 h-6" />
                        </div>
                        <span className="text-xs font-medium bg-white/20 px-2 py-1 rounded-full">Tổng số dư dự kiến</span>
                    </div>
                    <p className="text-3xl font-bold mb-1">{formatCurrency(summary.netWorth)}</p>
                    <p className="text-blue-100 text-xs">Phí sàn: -0.5% khi giải ngân</p>
                </div>

                <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-2 bg-green-50 rounded-xl text-green-600">
                            <TrendingUp className="w-6 h-6" />
                        </div>
                        <span className="text-[10px] font-bold text-green-600 uppercase tracking-wider">Tiền Dự án (Income)</span>
                    </div>
                    <div className="space-y-3">
                        <div className="flex justify-between items-end">
                            <span className="text-gray-400 text-sm">Đã thực nhận:</span>
                            <span className="font-bold text-gray-900">{formatCurrency(summary.totalReleased)}</span>
                        </div>
                        <div className="flex justify-between items-end">
                            <span className="text-gray-400 text-sm">Đang treo (Escrow):</span>
                            <span className="font-bold text-blue-600">+{formatCurrency(summary.totalIncoming)}</span>
                        </div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-2 bg-red-50 rounded-xl text-red-600">
                            <TrendingDown className="w-6 h-6" />
                        </div>
                        <span className="text-[10px] font-bold text-red-600 uppercase tracking-wider">Chi phí vật tư (Expense)</span>
                    </div>
                    <div className="space-y-3">
                        <div className="flex justify-between items-end">
                            <span className="text-gray-400 text-sm">Tổng đã chi:</span>
                            <span className="font-bold text-gray-900">{formatCurrency(summary.totalSpent)}</span>
                        </div>
                        <div className="flex justify-between items-end">
                            <span className="text-gray-400 text-sm">Công nợ hiện tại:</span>
                            <span className="font-bold text-red-600">-{formatCurrency(summary.unpaidDebt)}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Detailed Projects Table */}
            <div className="bg-white rounded-3xl border border-gray-100 overflow-hidden">
                <div className="p-6 border-b border-gray-50 flex items-center justify-between">
                    <h3 className="font-bold text-gray-900 flex items-center gap-2">
                        <Briefcase className="w-5 h-5 text-gray-400" />
                        Dòng tiền theo dự án
                    </h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-gray-50 text-gray-600">
                            <tr>
                                <th className="px-6 py-4 text-left font-semibold">Tên dự án</th>
                                <th className="px-6 py-4 text-right font-semibold">Giá trị hợp đồng</th>
                                <th className="px-6 py-4 text-right font-semibold">Đã nhận</th>
                                <th className="px-6 py-4 text-right font-semibold">Đang treo</th>
                                <th className="px-6 py-4 text-right font-semibold">Tiến độ</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {data.projects.map((p: any) => {
                                const progress = Math.round((p.released / p.totalAmount) * 100) || 0
                                return (
                                    <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4 font-medium text-gray-900">{p.title}</td>
                                        <td className="px-6 py-4 text-right font-bold">{formatCurrency(p.totalAmount)}</td>
                                        <td className="px-6 py-4 text-right text-green-600 font-medium">{formatCurrency(p.released)}</td>
                                        <td className="px-6 py-4 text-right text-blue-600 font-medium">{formatCurrency(p.incoming)}</td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2 justify-end">
                                                <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                                    <div className="h-full bg-blue-600" style={{ width: `${progress}%` }} />
                                                </div>
                                                <span className="text-[10px] font-bold text-gray-400">{progress}%</span>
                                            </div>
                                        </td>
                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}
