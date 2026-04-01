import { Package, Wallet, TrendingUp, Clock } from 'lucide-react'

interface StatCardsProps {
    stats: {
        totalOrders: number
        pendingOrders: number
        totalRevenue: number
        pendingPayments: number
    }
    formatCurrency: (amount: number) => string
}

export default function StatCards({ stats, formatCurrency }: StatCardsProps) {
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
            icon: Wallet,
            color: 'from-indigo-600 to-indigo-400',
            textColor: 'text-indigo-600',
            bgLight: 'bg-indigo-50',
            trend: 'Kết quả đối soát',
            description: 'Dòng tiền sắp về'
        }
    ]

    return (
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
    )
}
