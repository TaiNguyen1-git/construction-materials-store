import React from 'react'
import { Package, AlertTriangle, ShoppingCart, Users, Coins, Clock } from 'lucide-react'

interface DashboardStatsGridProps {
  stats: {
    totalProducts: number
    totalOrders: number
    totalCustomers: number
    totalRevenue: number
    lowStockItems: number
    pendingOrders: number
  }
  formatCurrency: (val: number) => string
  formatNumber: (val: number) => string
}

const DashboardStatsGrid: React.FC<DashboardStatsGridProps> = ({
  stats,
  formatCurrency,
  formatNumber
}) => {
  const statCards = [
    {
      title: 'Danh mục sản phẩm',
      value: formatNumber(stats.totalProducts),
      icon: Package,
      color: 'bg-blue-50 text-blue-600',
      trend: '+12%',
      sub: 'Mã SKU'
    },
    {
      title: 'Tồn kho cảnh báo',
      value: formatNumber(stats.lowStockItems),
      icon: AlertTriangle,
      color: 'bg-red-50 text-red-600',
      trend: stats.lowStockItems > 10 ? 'Urgent' : 'Low Risk',
      sub: 'Mức Quan Trọng'
    },
    {
      title: 'Thanh khoản đơn hàng',
      value: formatNumber(stats.totalOrders),
      icon: ShoppingCart,
      color: 'bg-emerald-50 text-emerald-600',
      trend: '+8%',
      sub: 'Khối Lượng'
    },
    {
      title: 'Cơ sở khách hàng',
      value: formatNumber(stats.totalCustomers),
      icon: Users,
      color: 'bg-indigo-50 text-indigo-600',
      trend: '+15%',
      sub: 'Người Dùng'
    },
    {
      title: 'Tổng doanh thu',
      value: formatCurrency(stats.totalRevenue),
      icon: Coins,
      color: 'bg-emerald-600 text-white',
      trend: '+23%',
      sub: 'Trong Tháng',
      isHero: true
    },
    {
      title: 'Đơn chờ xử lý',
      value: formatNumber(stats.pendingOrders),
      icon: Clock,
      color: 'bg-amber-50 text-amber-600',
      trend: 'Queued',
      sub: 'Chờ Xử Lý'
    }
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6">
      {statCards.map((stat, index) => (
        <div
          key={index}
          className={`bg-white rounded-[40px] border border-slate-100 p-8 shadow-[0_10px_40px_-15px_rgba(0,0,0,0.03)] hover:shadow-xl hover:-translate-y-1 transition-all group relative overflow-hidden ${
            stat.isHero ? 'md:col-span-2 lg:col-span-2 ring-2 ring-emerald-500/10' : 'lg:col-span-1'
          }`}
        >
          {stat.isHero && <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 blur-[60px] pointer-events-none"></div>}

          <div className="flex flex-col h-full justify-between gap-6">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <dt className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 line-clamp-1">{stat.title}</dt>
                <dd className={`font-extrabold text-slate-900 tracking-tighter ${stat.isHero ? 'text-4xl' : 'text-2xl line-clamp-1'}`}>
                  {stat.value}
                </dd>
              </div>
              <div className={`p-4 rounded-2xl ${stat.color} transition-all duration-500 group-hover:rotate-12`}>
                <stat.icon size={24} />
              </div>
            </div>

            <div className="flex items-center justify-between border-t border-slate-50 pt-4">
              <div className={`text-[10px] font-black px-2.5 py-1 rounded-lg uppercase tracking-widest ${
                stat.trend.includes('+') ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-50 text-slate-400'
              }`}>
                {stat.trend}
              </div>
              <div className="text-[10px] font-bold text-slate-300 uppercase italic tracking-tighter">{stat.sub}</div>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

export default DashboardStatsGrid
