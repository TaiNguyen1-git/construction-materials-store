import { useState } from 'react'
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts'
import { Calendar } from 'lucide-react'

// Dummy data for demonstrate the chart capability
const generateData = (range: string) => {
    if (range === '7d') {
        return [
            { name: 'T2', revenue: 12000000, orders: 15 },
            { name: 'T3', revenue: 19000000, orders: 20 },
            { name: 'T4', revenue: 15000000, orders: 18 },
            { name: 'T5', revenue: 22000000, orders: 25 },
            { name: 'T6', revenue: 30000000, orders: 32 },
            { name: 'T7', revenue: 28000000, orders: 30 },
            { name: 'CN', revenue: 35000000, orders: 40 },
        ]
    } else if (range === '30d') {
        return [
            { name: 'Tuần 1', revenue: 85000000, orders: 100 },
            { name: 'Tuần 2', revenue: 92000000, orders: 110 },
            { name: 'Tuần 3', revenue: 78000000, orders: 85 },
            { name: 'Tuần 4', revenue: 105000000, orders: 130 },
        ]
    } else {
        return [
            { name: 'Thg 1', revenue: 320000000, orders: 400 },
            { name: 'Thg 2', revenue: 280000000, orders: 350 },
            { name: 'Thg 3', revenue: 450000000, orders: 520 },
            { name: 'Thg 4', revenue: 120000000, orders: 150 },
        ]
    }
}

export default function RevenueChart() {
    const [timeRange, setTimeRange] = useState('7d')
    const chartData = generateData(timeRange)

    const formatYAxis = (tickItem: number) => {
        if (tickItem === 0) return '0'
        return `${(tickItem / 1000000).toFixed(0)}M`
    }

    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-slate-900 text-white p-4 rounded-2xl shadow-xl shadow-slate-200 border border-slate-800">
                    <p className="font-bold text-slate-300 mb-2">{label}</p>
                    <p className="text-xl font-black text-emerald-400 mb-1">
                        {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(payload[0].value)}
                    </p>
                    <p className="text-sm font-medium text-slate-400">
                        {payload[0].payload.orders} đơn hàng
                    </p>
                </div>
            )
        }
        return null
    }

    return (
        <div className="bg-white rounded-[2rem] border border-slate-200/60 shadow-sm p-6 lg:p-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                <div>
                    <h3 className="text-xl font-bold text-slate-900">Biểu đồ Doanh thu</h3>
                    <p className="text-sm text-slate-500 font-medium">Theo dõi tăng trưởng & dòng tiền</p>
                </div>
                
                {/* Time Range Filter Box */}
                <div className="flex items-center bg-slate-50 p-1.5 rounded-2xl border border-slate-100">
                    {[
                        { id: '7d', label: '7 Ngày' },
                        { id: '30d', label: '30 Ngày' },
                        { id: 'year', label: 'Năm nay' }
                    ].map((range) => (
                        <button
                            key={range.id}
                            onClick={() => setTimeRange(range.id)}
                            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                                timeRange === range.id
                                    ? 'bg-white text-blue-600 shadow-sm'
                                    : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100'
                            }`}
                        >
                            {range.label}
                        </button>
                    ))}
                </div>
            </div>

            <div className="h-[350px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                        data={chartData}
                        margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                    >
                        <defs>
                            <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis 
                            dataKey="name" 
                            axisLine={false} 
                            tickLine={false} 
                            tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 600 }}
                            dy={10} 
                        />
                        <YAxis 
                            axisLine={false} 
                            tickLine={false} 
                            tickFormatter={formatYAxis} 
                            tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 600 }}
                            dx={-10}
                        />
                        <Tooltip content={<CustomTooltip />} />
                        <Area
                            type="monotone"
                            dataKey="revenue"
                            stroke="#10b981"
                            strokeWidth={4}
                            fillOpacity={1}
                            fill="url(#colorRevenue)"
                            activeDot={{ r: 6, fill: '#10b981', stroke: '#fff', strokeWidth: 3 }}
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
            
            <div className="mt-6 flex items-center justify-between pt-6 border-t border-slate-100">
                <div className="flex items-center gap-2 text-sm text-slate-500 font-medium">
                    <Calendar className="w-4 h-4" />
                    Đã cập nhật lúc {new Date().toLocaleTimeString('vi-VN')}
                </div>
            </div>
        </div>
    )
}
