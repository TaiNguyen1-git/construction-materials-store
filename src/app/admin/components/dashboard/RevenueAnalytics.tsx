import React from 'react'
import { TrendingUp } from 'lucide-react'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts'

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316']

interface RevenueAnalyticsProps {
  revenueTrend: any[]
  salesByCategory: any[]
  formatCurrency: (val: number) => string
  formatNumber: (val: number) => string
}

const RevenueAnalytics: React.FC<RevenueAnalyticsProps> = ({
  revenueTrend,
  salesByCategory,
  formatCurrency,
  formatNumber
}) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* Main Revenue Chart */}
      <div className="lg:col-span-8 bg-white rounded-[40px] border border-slate-100 p-10 shadow-sm relative overflow-hidden">
        <div className="flex justify-between items-center mb-10">
          <div>
            <h3 className="text-xl font-black text-slate-900 uppercase tracking-tighter italic flex items-center gap-2">
              <TrendingUp className="text-blue-600" size={20} />
              Xu Hướng Dòng Tiền
            </h3>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Biểu đồ giao dịch 30 ngày qua</p>
          </div>
          <div className="flex gap-2">
            <div className="px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg text-[10px] font-black uppercase tracking-widest">Doanh Thu (VND)</div>
          </div>
        </div>
        <div className="h-[350px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={revenueTrend}>
              <defs>
                <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }} />
              <YAxis hide />
              <Tooltip
                contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', padding: '15px' }}
                formatter={(value: number) => [formatCurrency(value), 'Doanh Thu']}
              />
              <Area type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={4} fillOpacity={1} fill="url(#colorRev)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Categories Distribution */}
      <div className="lg:col-span-4 bg-slate-50/50 rounded-[40px] border border-slate-100 p-10 shadow-sm flex flex-col items-center">
        <h3 className="text-xl font-black text-slate-900 uppercase tracking-tighter italic mb-6 w-full text-wrap break-words">Cơ Cấu Danh Mục</h3>
        <div className="h-[250px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={salesByCategory}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={8}
                cornerRadius={10}
                dataKey="total"
              >
                {salesByCategory.map((entry: any, index: number) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="grid grid-cols-2 gap-3 mt-6 w-full">
          {salesByCategory.slice(0, 4).map((cat: any, i: number) => (
            <div key={i} className="flex flex-col p-3 bg-white rounded-2xl border border-slate-100">
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest line-clamp-1">{cat.category}</span>
              <span className="text-sm font-black text-slate-900 mt-1">{formatNumber(cat.total / 1000000)}M</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default RevenueAnalytics
